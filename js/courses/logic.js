const r = String.raw;

const cardFig = (cards) => ({
  kind: 'figure', w: 600, h: 170, label: 'Four cards on a table',
  draw: ({ s }) => cards.flatMap((c, i) => {
    const x = 40 + i * 140;
    return [
      s('rect', { x, y: 20, width: 100, height: 130, rx: 12, class: 'fl-card', stroke: 'var(--ink-2)', 'stroke-width': 2.5 }),
      s('text', { x: x + 50, y: 102, 'text-anchor': 'middle', style: 'font-size:48px;font-weight:800;fill:var(--ink)', text: c }),
    ];
  }),
});

export default {
  id: 'logic',
  subject: 'math',
  title: 'Logic & Proof',
  level: 'Foundational',
  cover: 'logic',
  tagline: 'Truth tables, if–then traps, Venn diagrams, fallacies, knights and knaves, and how to prove things.',
  description: r`Mathematics runs on airtight reasoning. Learn the logic of "and", "or", "not" and "if–then", solve classic knights-and-knaves puzzles, draw logic with Venn diagrams, spot invalid arguments, and master three powerful proof techniques: contradiction, induction and the pigeonhole principle.`,
  chapters: [
    {
      title: 'Logic',
      summary: 'The rules of reasoning.',
      lessons: [
        {
          id: 'truth',
          title: 'And, Or, Not',
          summary: 'Truth tables',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Or means…?',
              body: r`A menu says: "Lunch comes with soup **or** salad." In everyday speech that usually means one or the other, but not both.`,
              prompt: 'In mathematical logic, when is "P or Q" true?',
              choices: [
                { t: 'When at least one of P, Q is true (including both)', ok: true },
                { t: 'When exactly one of them is true', why: 'That’s "exclusive or". Mathematicians use the inclusive "or", which also allows both.' },
                { t: 'Only when both are true', why: 'That’s "and".' },
              ],
              explain: r`Mathematical "or" is **inclusive**: "P or Q" is true if P is true, Q is true, or both. It's false only when both are false.`,
            },
            {
              type: 'explain',
              title: 'Truth tables',
              body: r`A **truth table** lists every combination of true (T) and false (F):

| P | Q | P and Q | P or Q | not P |
|---|---|---|---|---|
| T | T | T | T | F |
| T | F | F | T | F |
| F | T | F | T | T |
| F | F | F | F | T |`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Flip the switches',
              prompt: r`Each switch is a statement: on = true, off = false. Switch $C$ is stuck off. Set $A$ and $B$ to make this compound statement **true**:
$$(A \text{ or } B) \text{ and } (\text{not } A \text{ or } C)$$`,
              widget: {
                kind: 'bits', n: 3, value: 4, labels: ['A', 'B', 'C'], lock: [2], maxWidth: 340, colors: ['blue', 'teal', 'coral'],
                readout: (v, b) => {
                  const [A, B, C] = b.map(Boolean);
                  const left = A || B, right = !A || C;
                  return r`$(A \text{ or } B) = ${left ? '\\text{T}' : '\\text{F}'}$, $\;(\text{not } A \text{ or } C) = ${right ? '\\text{T}' : '\\text{F}'}$ $\;\Rightarrow\;$ **${left && right ? 'TRUE' : 'false'}**`;
                },
                goal: (v, b) => (b[0] || b[1]) && (!b[0] || b[2]),
                hint: 'With C off, the second bracket needs “not A” to be true.',
                solution: 2,
              },
              explain: r`With $C$ false, "not $A$ or $C$" forces $A$ to be **false**. Then "$A$ or $B$" needs $B$ **true**. So $A = $ off, $B = $ on. Reasoning step by step like this is exactly how computer "SAT solvers" crack enormous logic puzzles.`,
            },
            {
              type: 'numeric',
              title: 'How many rows?',
              prompt: r`A truth table lists every combination of T and F for its statements. How many rows does a table for **4** statements need?`,
              answer: 16,
              wrong: [{ v: 8, why: 'That’s for 3 statements. Each new statement doubles the rows.' }, { v: 4, why: 'Each statement has 2 options, and they multiply: 2 × 2 × 2 × 2.' }],
              explain: r`Each statement can be T or F: $2^4 = 16$ rows. With 30 statements you'd need over a billion rows, which is why logicians look for cleverer methods.`,
            },
            {
              type: 'mcq',
              title: 'Negate “and”',
              prompt: 'What is the opposite (negation) of “It is sunny AND warm”?',
              choices: [
                { t: 'It is not sunny, OR it is not warm', ok: true },
                { t: 'It is not sunny AND not warm', why: 'Too strong. A sunny, cold day also makes the original statement false.' },
                { t: 'It is cloudy and cold', why: 'That’s only one of the ways the original can fail.' },
              ],
              explain: r`"Sunny and warm" fails if **either** part fails. This is one of **De Morgan's laws**:
$$\text{not}(P \text{ and } Q) = (\text{not } P) \text{ or } (\text{not } Q)$$
and likewise, $\text{not}(P \text{ or } Q) = (\text{not } P) \text{ and } (\text{not } Q)$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Negate “all”',
              prompt: 'What is the negation of “All swans are white”?',
              choices: [
                { t: 'At least one swan is not white', ok: true },
                { t: 'All swans are not white', why: 'That says no swan is white. To refute "all", one exception is enough.' },
                { t: 'Some swans are white', why: 'That’s consistent with the original statement. It doesn’t contradict it.' },
              ],
              explain: r`To disprove "all X are Y", you need just **one** counterexample. (Europeans long assumed all swans were white, until black swans were found in Australia.) Similarly, the negation of "some X is Y" is "no X is Y".`,
            },
          ],
          recap: [
            'Logical “or” is inclusive. “And” needs both parts to be true.',
            'De Morgan: not (P and Q) = not P or not Q, and the other way round.',
            'Negating “all” gives “at least one isn’t”.',
          ],
        },
        {
          id: 'if-then',
          title: 'If–Then',
          summary: 'Implication and its traps',
          icon: 'right',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The four cards',
              body: r`Each card has a letter on one side and a number on the other. The rule is: **"If a card has a vowel on one side, then it has an even number on the other."**`,
              widget: cardFig(['E', 'K', '4', '7']),
              prompt: 'Which cards must you turn over to check whether the rule is broken?',
              cols: 2,
              choices: [
                { t: 'E and 7', ok: true },
                { t: 'E and 4', why: 'The 4 can’t break the rule: the rule says nothing about what’s behind an even number. But a vowel behind the 7 would break it.' },
                { t: 'E only', why: 'The 7 matters too. If it has a vowel on the back, the rule is broken.' },
                { t: 'All four', why: 'K and 4 can’t break the rule, whatever is on their backs.' },
              ],
              explain: r`Only a vowel paired with an odd number breaks the rule. **E** might hide an odd number, and **7** might hide a vowel. K and 4 can't break it. This is the famous **Wason selection task**. Fewer than 10% of people get it right on their first try.`,
            },
            {
              type: 'explain',
              title: 'Implication',
              body: r`"If P then Q" (written $P \Rightarrow Q$) is false in exactly one case: P true and Q false.

Related statements:
- **Converse:** $Q \Rightarrow P$. Not equivalent to the original!
- **Contrapositive:** $\text{not } Q \Rightarrow \text{not } P$. Always equivalent.

"If it's raining, the ground is wet" is true. Its converse ("if the ground is wet, it's raining") isn't: maybe a sprinkler is on. Its contrapositive ("if the ground is dry, it isn't raining") is true.`,
            },
            {
              type: 'mcq',
              title: 'Equivalent?',
              prompt: '“If a number is divisible by 6, then it is even.” Which statement is equivalent to it?',
              choices: [
                { t: 'If a number is odd, it is not divisible by 6', ok: true },
                { t: 'If a number is even, it is divisible by 6', why: 'That’s the converse, and it’s false: 4 is even but not divisible by 6.' },
                { t: 'If a number is not divisible by 6, it is odd', why: 'That’s the inverse, and it’s false: 4 again.' },
              ],
              explain: r`The **contrapositive** (not Q ⇒ not P) always has the same truth value as the original. "Odd ⇒ not divisible by 6" is the contrapositive here.`,
            },
            {
              type: 'mcq',
              title: 'Necessary or sufficient?',
              prompt: r`"Being a square is ___ for being a rectangle." Which word fits?`,
              cols: 2,
              choices: [
                { t: 'sufficient', ok: true },
                { t: 'necessary', why: 'A rectangle need not be a square (think of a long thin one). But every square is a rectangle.' },
              ],
              explain: r`"Square ⇒ rectangle" is true. In $P \Rightarrow Q$, $P$ is **sufficient** for $Q$ (it guarantees it), and $Q$ is **necessary** for $P$ (you can't have $P$ without it). So being a rectangle is necessary for being a square.`,
            },
            {
              type: 'mcq',
              title: 'Affirming the consequent',
              prompt: r`"If it rained, the ground is wet. The ground is wet. So it rained." What’s wrong with this argument?`,
              choices: [
                { t: r`The ground could be wet for another reason: the converse doesn’t follow`, ok: true },
                { t: r`Nothing: it’s valid`, why: r`Sprinklers, spills or dew could wet the ground without rain.` },
                { t: r`The first statement is false`, why: r`The first statement may well be true; the reasoning is the problem.` },
              ],
              explain: r`From "if P then Q" and Q, you can’t conclude P. This fallacy, **affirming the consequent**, is common in everyday arguments: "Guilty people are nervous; he’s nervous; so he’s guilty."`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A vacuous truth',
              prompt: '“If 2 + 2 = 5, then the Moon is made of cheese.” In logic, is this statement true or false?',
              cols: 2,
              choices: [
                { t: 'True', ok: true },
                { t: 'False', why: r`An implication is false only when the "if" part is true and the "then" part is false. Here the "if" part is false.` },
              ],
              explain: r`With a false "if" part, an implication is automatically ("vacuously") true: it makes no claim about a situation that never happens. Similarly, "all unicorns can fly" is technically true, because there are no unicorns to disprove it.`,
            },
          ],
          recap: [
            r`$P \Rightarrow Q$ is false only when P is true and Q is false.`,
            'The contrapositive is equivalent to the original. The converse is not.',
            'When testing a rule, look for cases that could break it.',
          ],
        },
        {
          id: 'knights-knaves',
          title: 'Knights & Knaves',
          summary: 'Logic puzzles',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'The island',
              body: r`On a certain island, every inhabitant is either a **knight**, who always tells the truth, or a **knave**, who always lies. (These puzzles were made famous by logician Raymond Smullyan.)

The strategy: **assume** someone is a knight and check whether their statement is consistent. Then assume they're a knave and check again.`,
            },
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'I am a knave',
              prompt: 'Could anyone on the island say, “I am a knave”?',
              choices: [
                { t: 'No: a knight wouldn’t lie, and a knave can’t tell that truth', ok: true },
                { t: 'Yes, a knave', why: 'If a knave said "I am a knave", that would be true, and knaves never tell the truth.' },
                { t: 'Yes, a knight', why: 'A knight saying "I am a knave" would be lying, which knights never do.' },
              ],
              explain: r`A knight can't say it (it would be a lie). A knave can't say it either (it would be true). So nobody on the island can make that statement.`,
            },
            {
              type: 'mcq',
              title: 'Two islanders',
              body: r`A says: "We are both knaves."`,
              prompt: 'What are A and B?',
              choices: [
                { t: 'A is a knave, B is a knight', ok: true },
                { t: 'Both knaves', why: 'Then A’s statement would be true, but knaves always lie.' },
                { t: 'A is a knight, B is a knave', why: 'A knight can’t claim to be a knave.' },
                { t: 'Both knights', why: 'A knight wouldn’t claim that both of them are knaves.' },
              ],
              explain: r`If A were a knight, the statement would be true, making A a knave: a contradiction. So A is a **knave**, and the statement is false. "Both knaves" is false while A is a knave only if B is **not** a knave. So B is a knight.`,
            },
            {
              type: 'mcq',
              title: 'Same kind',
              body: r`A says: "B and I are the same kind." B says: "A and I are different kinds."`,
              prompt: 'What is B?',
              cols: 2,
              choices: [
                { t: 'A knight', ok: true },
                { t: 'A knave', why: 'If B were a knave, B’s claim "we’re different" would be false, so A would be a knave too. But then A’s claim "we’re the same kind" would be true, and knaves can’t tell the truth.' },
                { t: 'Impossible to tell', why: 'Their two statements contradict each other, so exactly one of them is lying. Check the cases.' },
              ],
              explain: r`Check all four cases systematically:

| A | B | A says "same" | B says "different" | Works? |
|---|---|---|---|---|
| knight | knight | true ✓ | false, but a knight can't lie ✗ | no |
| knight | knave | false, but a knight can't lie ✗ | | no |
| knave | knight | false ✓ | true ✓ | **yes** |
| knave | knave | true, but a knave can't tell the truth ✗ | | no |

Only one case survives: **A is a knave and B is a knight**. When intuition wobbles, a table settles it.`,
            },
            {
              type: 'interactive',
              title: 'Test every case',
              body: r`$A$ says: "We are both knaves." Knights always tell the truth; knaves always lie. Set who is what, and find the only consistent assignment.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 40,
                params: { a: { min: 0, max: 1, step: 1, value: 1, label: 'A is a', color: 'blue', format: (v) => (v ? 'knight' : 'knave') }, b: { min: 0, max: 1, step: 1, value: 1, label: 'B is a', color: 'coral', format: (v) => (v ? 'knight' : 'knave') } },
                readout: (p) => { const stmt = !p.a && !p.b, ok = p.a ? stmt : !stmt; return `"We are both knaves" is ${stmt ? 'true' : 'false'}; A is a ${p.a ? 'knight, who must tell the truth' : 'knave, who must lie'} → ${ok ? '**consistent** ✓' : '**contradiction**'}`; },
                goal: (p) => p.a === 0 && p.b === 1,
                hint: 'A knight could never say they are a knave.',
                solution: { a: 0, b: 1 },
              },
              explain: r`If $A$ were a knight, the statement would be true, making $A$ a knave: impossible. So $A$ is a knave and the statement is false, so they're **not** both knaves: $B$ is a knight. Checking all four cases is a truth table in disguise.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The fork in the road',
              body: r`You reach a fork in the road. One path leads to the village, the other to a swamp. A single islander stands there. You don't know whether they're a knight or a knave, and you may ask **one** yes/no question.`,
              prompt: 'Which question reliably tells you the way to the village?',
              choices: [
                { t: '“If I asked you whether the left path leads to the village, would you say yes?”', ok: true },
                { t: '“Does the left path lead to the village?”', why: 'A knave would lie, and you can’t tell which kind of islander you’re talking to.' },
                { t: '“Are you a knight?”', why: 'Both a knight and a knave answer "yes", so this tells you nothing.' },
              ],
              explain: r`A knight answers truthfully about what they'd say. A knave lies about what they would say, and since they'd lie in the first place, the two lies cancel out. Either way, "yes" means the left path leads to the village.`,
            },
          ],
          recap: [
            'Assume a case, follow the consequences, and reject cases that lead to contradictions.',
            'Check every case systematically: hunches can be wrong.',
            'Double negatives (a lie about a lie) cancel out.',
          ],
        },
        {
          id: 'sets',
          title: 'Sets & Venn Diagrams',
          summary: 'Logic you can draw',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'And, or, not as regions',
              body: r`A **set** is a collection of things. Draw two overlapping circles: one for people who like tea ($T$), one for coffee ($C$). Logic turns into geometry:

- **and** is the overlap, the **intersection** $T \cap C$;
- **or** is everything in either circle, the **union** $T \cup C$;
- **not** is everything outside a circle, the **complement**.

John Venn popularised these diagrams in 1880.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tea and coffee',
              prompt: r`In a class, 30 students like tea and 25 like coffee. Exactly 45 students like at least one of the two. Adjust the overlap to match.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.6, xmax: 3.6, ymin: -2.2, ymax: 2.2, grid: false, axes: false, maxWidth: 520,
                params: { b: { min: 0, max: 25, step: 1, value: 5, label: 'like both', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const u = plot.X(1) - plot.X(0), sep = 2.4 - 0.05 * p.b;
                  const t = (x, y, str, c) => s('text', { x: plot.X(x), y: plot.Y(y) + 7, class: 'lbl', 'text-anchor': 'middle', style: `font-size: 20px; fill: var(--${c})`, text: str });
                  return [
                    s('circle', { cx: plot.X(-sep / 2), cy: plot.Y(0), r: 1.8 * u, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3, opacity: 0.8 }),
                    s('circle', { cx: plot.X(sep / 2), cy: plot.Y(0), r: 1.8 * u, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 3, opacity: 0.8 }),
                    t(-sep / 2 - 0.9, 0, String(30 - p.b), 'blue'), t(sep / 2 + 0.9, 0, String(25 - p.b), 'coral'), t(0, 0, String(p.b), 'violet'),
                    t(-sep / 2 - 0.9, 1.95, 'tea', 'blue'), t(sep / 2 + 0.9, 1.95, 'coffee', 'coral'),
                  ];
                },
                readout: (p) => r`at least one: $${30 - p.b} + ${p.b} + ${25 - p.b} = ${55 - p.b}$`,
                goal: (p) => p.b === 10,
                hint: 'Adding 30 and 25 counts the overlap twice. By how much does 55 exceed 45?',
                solution: { b: 10 },
              },
              explain: r`$30 + 25 = 55$ counts the "both" group twice, so $|T \cup C| = |T| + |C| - |T \cap C|$: $45 = 55 - 10$. Ten students like both. This **inclusion–exclusion** rule fixes double counting.`,
            },
            {
              type: 'numeric',
              title: 'Neither',
              prompt: r`The class has 52 students. How many like **neither** tea nor coffee?`,
              answer: 7,
              wrong: [{ v: 17, why: '45 students like at least one drink. The rest like neither: 52 − 45.' }],
              explain: r`$52 - 45 = 7$ students sit outside both circles: the complement of $T \cup C$.`,
            },
            {
              type: 'mcq',
              title: 'De Morgan, drawn',
              prompt: r`Which region is "not (tea or coffee)"?`,
              choices: [
                { t: 'Outside both circles: the same as “not tea and not coffee”', ok: true },
                { t: 'Outside at least one circle', why: 'That’s “not tea or not coffee”, which is the complement of the overlap.' },
                { t: 'The overlap', why: 'The overlap is “tea and coffee”.' },
              ],
              explain: r`Outside the union is exactly the region that's outside $T$ **and** outside $C$: De Morgan's law, now visible. Venn diagrams turn logical laws into pictures you can check at a glance.`,
            },
            {
              type: 'numeric',
              title: 'Inclusion–exclusion',
              prompt: r`In a class, 30 students play football, 25 play tennis, and 10 play both. How many play at least one of the two?`,
              answer: 45,
              explain: r`$|A \cup B| = |A| + |B| - |A \cap B| = 30 + 25 - 10 = 45$. The overlap was counted twice, so subtract it once.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three clubs',
              prompt: r`In a school, 40 students play football, 30 do drama and 20 play chess. 12 do football and drama, 8 football and chess, 6 drama and chess, and 3 do all three. How many students do at least one activity?`,
              answer: 67,
              wrong: [{ v: 90, why: 'That counts students in two activities more than once. Subtract the pairwise overlaps.' }, { v: 64, why: 'After subtracting the pairs, the students in all three have been removed completely. Add them back once.' }],
              explain: r`Inclusion–exclusion for three sets: $40 + 30 + 20 - 12 - 8 - 6 + 3 = 67$. Add the singles, subtract the pairs, add back the triple.`,
            },
          ],
          recap: [
            'Intersection = and, union = or, complement = not.',
            r`$|A \cup B| = |A| + |B| - |A \cap B|$ (inclusion–exclusion).`,
            'Venn diagrams make logical laws like De Morgan’s visible.',
          ],
        },
        {
          id: 'fallacies',
          title: 'Arguments & Fallacies',
          summary: 'Valid reasoning and common traps',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Valid arguments',
              body: r`An argument is **valid** if its conclusion must be true **whenever** its premises are true. Two valid patterns:

- **Modus ponens:** If P then Q. P. Therefore Q.
- **Modus tollens:** If P then Q. Not Q. Therefore not P.

Validity is about form, not content. "If it's a cat, it can fly. Tom is a cat. So Tom can fly" is valid but has a false premise, so it isn't **sound**.`,
            },
            {
              type: 'mcq',
              title: 'Affirming the consequent',
              prompt: r`"If it rained, the street is wet. The street is wet. So it rained." Is this valid?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: 'A street-cleaning truck could have wet the street. The premises can be true while the conclusion is false.' },
              ],
              explain: r`This is **affirming the consequent**: from $P \Rightarrow Q$ and $Q$, concluding $P$. It confuses an implication with its converse. Its cousin, **denying the antecedent** (not $P$, so not $Q$), is invalid too.`,
            },
            {
              type: 'multi',
              title: 'Which are valid?',
              prompt: r`Each argument starts from "If a number ends in 0, it is divisible by 5." Select all the **valid** conclusions.`,
              choices: [
                { t: '240 ends in 0, so 240 is divisible by 5', ok: true },
                { t: '37 is not divisible by 5, so 37 doesn’t end in 0', ok: true },
                { t: '35 is divisible by 5, so 35 ends in 0', why: 'Affirming the consequent: 35 is divisible by 5 but ends in 5.' },
                { t: '42 doesn’t end in 0, so 42 isn’t divisible by 5', why: 'Denying the antecedent. Its conclusion happens to be true here, but the reasoning would also "prove" 45 isn’t divisible by 5.' },
              ],
              explain: r`The first is modus ponens, the second modus tollens. The others are the two classic invalid forms. Note that an invalid argument can still have a true conclusion by luck.`,
            },
            {
              type: 'mcq',
              title: 'Correlation',
              prompt: r`Towns with more fire engines at a fire tend to have more damage. Does sending fire engines cause damage?`,
              choices: [
                { t: 'No: bigger fires cause both more damage and more engines', ok: true },
                { t: 'Yes, the data shows it', why: 'The data shows a correlation. A hidden third factor (fire size) explains it.' },
              ],
              explain: r`**Correlation is not causation.** A **confounding** variable, the size of the fire, drives both. The same trap appears when ice-cream sales and drownings rise together (both caused by hot weather).`,
            },
            {
              type: 'interactive',
              title: 'Find a counterexample',
              body: r`"All cats are mammals. Tom is a mammal. So Tom is a cat." Drag Tom to a spot that makes both premises true but the conclusion false.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -3.5, ymax: 3.5, grid: false, axes: false, maxWidth: 480,
                params: { x: { min: -4.8, max: 4.8, step: 0.05, value: 4, slider: false }, y: { min: -3.3, max: 3.3, step: 0.05, value: 2.8, slider: false } },
                extra: ({ plot, s }) => [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(3) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('circle', { cx: plot.X(-1), cy: plot.Y(0), r: plot.X(1.4) - plot.X(0), class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('text', { x: plot.X(1.2), y: plot.Y(2.2), class: 'lbl', fill: 'var(--blue)', text: 'mammals' }), s('text', { x: plot.X(-1), y: plot.Y(0) + 5, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--coral)', text: 'cats' })],
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: (p) => { const mam = Math.hypot(p.x, p.y) < 3, cat = Math.hypot(p.x + 1, p.y) < 1.4; return `Tom is ${mam ? 'a mammal' : 'not a mammal'} and ${cat ? 'a cat' : 'not a cat'}${mam && !cat ? ': premises true, conclusion false ✓' : ''}`; },
                goal: (p) => Math.hypot(p.x, p.y) < 3 && Math.hypot(p.x + 1, p.y) >= 1.4,
                hint: 'Tom must be inside the big circle but outside the small one.',
                solution: { x: 1.8, y: 0 },
              },
              explain: r`Tom could be a dog: a mammal that isn't a cat. One counterexample shows the argument is **invalid**: the premises can be true while the conclusion is false. This is the fallacy of **affirming the consequent**.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Name the fallacy',
              prompt: r`"Either we ban all cars from the city centre, or we accept choking pollution forever." What's wrong with this argument?`,
              choices: [
                { t: 'It’s a false dilemma: it ignores other options, like cleaner cars or congestion charges', ok: true },
                { t: 'Nothing: it’s modus ponens', why: 'It isn’t of that form. It presents two options as if they were the only ones.' },
                { t: 'It attacks a person instead of an argument', why: 'That would be an ad hominem. This one offers a false choice.' },
              ],
              explain: r`A **false dilemma** pretends only two options exist. Logically, "P or Q" is only useful if it's actually true. Other famous informal fallacies include the **straw man** (attacking a distorted version of an argument) and **ad hominem** (attacking the arguer rather than the argument).`,
            },
          ],
          recap: [
            'Valid: modus ponens (P, so Q) and modus tollens (not Q, so not P).',
            'Invalid: affirming the consequent and denying the antecedent.',
            'Watch for correlation ≠ causation and false dilemmas.',
          ],
        },
      ],
    },
    {
      title: 'Proof',
      summary: 'Three powerful techniques.',
      lessons: [
        {
          id: 'contradiction',
          title: 'Proof by Contradiction',
          summary: '√2 is irrational',
          icon: 'cross',
          steps: [
            {
              type: 'explain',
              title: 'The idea',
              body: r`To prove a statement, **assume it's false** and show that this leads to something impossible. If the assumption breaks logic, the statement must be true.

You've seen this already: Euclid's proof of infinitely many primes (in Number Theory) assumed there were finitely many and reached a contradiction.`,
            },
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Even squares',
              prompt: r`Suppose $n^2$ is even. What must be true of $n$?`,
              cols: 2,
              choices: [
                { t: r`$n$ is even`, ok: true },
                { t: r`$n$ could be odd`, why: r`If $n$ were odd, $n = 2k + 1$, then $n^2 = 4k^2 + 4k + 1$ is odd.` },
              ],
              explain: r`If $n$ were odd, $n^2$ would be odd too (odd × odd = odd). So an even $n^2$ forces $n$ to be even. We'll use this fact next.`,
            },
            {
              type: 'explain',
              title: '√2 is irrational',
              body: r`**Claim:** $\sqrt2$ can't be written as a fraction $\frac{a}{b}$ of whole numbers.

**Proof:** Suppose it can, with the fraction in lowest terms (so $a$ and $b$ have no common factor). Then
$$\sqrt2 = \frac{a}{b} \;\Rightarrow\; 2b^2 = a^2.$$
So $a^2$ is even, which means $a$ is even: $a = 2c$. Substituting, $2b^2 = 4c^2$, so $b^2 = 2c^2$. That makes $b^2$ even, so $b$ is even too.

But then $a$ and $b$ are **both even**, sharing a factor of 2, which contradicts "lowest terms". So the assumption was false: $\sqrt2$ is **irrational**. ∎

Legend says the ancient Pythagoreans were so disturbed by this discovery that they tried to keep it secret.`,
            },
            {
              type: 'order',
              title: 'Rebuild the proof',
              prompt: 'Put the steps of the proof in order.',
              items: [
                r`Assume $\sqrt2 = a/b$ in lowest terms`,
                r`Square both sides: $a^2 = 2b^2$, so $a$ is even`,
                r`Write $a = 2c$, so $b^2 = 2c^2$, and $b$ is even`,
                r`Both are even, which contradicts lowest terms`,
              ],
              explain: r`Assume, deduce, deduce, contradiction. That's the shape of every proof by contradiction.`,
            },
            {
              type: 'interactive',
              title: 'Close, but never equal',
              body: r`If $\sqrt2$ were a fraction $\frac pq$, then $p^2 = 2q^2$ exactly. Try to find a fraction within 0.001 of $\sqrt2 \approx 1.41421$, and watch $p^2$ versus $2q^2$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 40,
                params: { p: { min: 1, max: 100, step: 1, value: 7, label: '$p$', color: 'blue' }, q: { min: 1, max: 70, step: 1, value: 5, label: '$q$', color: 'coral' } },
                readout: (p) => `$\\frac{${p.p}}{${p.q}} = ${(p.p / p.q).toFixed(5)}$ · $p^2 = ${p.p * p.p}$, $2q^2 = ${2 * p.q * p.q}$ · off by ${Math.abs(p.p / p.q - Math.SQRT2).toFixed(5)}`,
                goal: (p) => Math.abs(p.p / p.q - Math.SQRT2) < 0.001,
                hint: 'Try 17/12, 41/29 or 99/70.',
                solution: { p: 41, q: 29 },
              },
              explain: r`Fractions like $\frac{41}{29}$ get very close ($41^2 = 1681$ versus $2 \times 29^2 = 1682$), but $p^2$ and $2q^2$ never match: the proof by contradiction shows they can't, for **any** whole numbers. Closeness is not equality.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'No largest',
              prompt: 'Which argument proves there is no largest even number?',
              choices: [
                { t: 'Suppose N is the largest even number. Then N + 2 is even and bigger: a contradiction', ok: true },
                { t: 'Even numbers keep going because we can’t see an end', why: 'Not seeing an end isn’t a proof. A proof must show that an end is impossible.' },
                { t: 'Check the first million even numbers', why: 'Checking examples can never prove a claim about infinitely many numbers.' },
              ],
              explain: r`Assume a largest one exists, then construct a bigger one. That's a contradiction, so no largest even number exists. Clean and airtight.`,
            },
          ],
          recap: [
            'Proof by contradiction: assume the opposite and derive something impossible.',
            r`$\sqrt2$ is irrational: assuming $\frac{a}{b}$ in lowest terms forces both $a$ and $b$ to be even.`,
            'Examples can disprove a general claim, but they can never prove one.',
          ],
        },
        {
          id: 'induction',
          title: 'Induction',
          summary: 'Falling dominoes',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Dominoes',
              body: r`An infinite line of dominoes stands upright.`,
              prompt: 'What do you need to know to be sure they ALL fall?',
              choices: [
                { t: 'The first one falls, and each falling domino knocks over the next', ok: true },
                { t: 'The first one falls', why: 'If there’s a big gap somewhere, the chain stops there.' },
                { t: 'Each domino knocks over the next', why: 'If none of them ever starts falling, nothing happens.' },
              ],
              explain: r`You need **both**: a start (the first one falls) and a chain (each one topples the next). This is **mathematical induction**.`,
            },
            {
              type: 'explain',
              title: 'Proof by induction',
              body: r`To prove a statement $S(n)$ for every $n \ge 1$:
1. **Base case:** prove $S(1)$.
2. **Inductive step:** prove that **if** $S(k)$ is true, then $S(k + 1)$ is true.

**Example:** $1 + 2 + \cdots + n = \frac{n(n+1)}{2}$.
- Base: $1 = \frac{1 \cdot 2}{2}$. ✓
- Step: assume it holds for $k$. Add $k + 1$ to both sides:
$$\frac{k(k+1)}{2} + (k + 1) = \frac{(k+1)(k+2)}{2}.$$
That's the formula for $k + 1$. ✓ So it holds for every $n$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Odd numbers make squares',
              body: r`Add up the first $n$ odd numbers: $1$, $1 + 3 = 4$, $1 + 3 + 5 = 9$, … squares every time! The picture shows why: each odd number is an L-shaped layer that turns an $(n-1) \times (n-1)$ square into an $n \times n$ square. That's the inductive step, drawn.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 8.3, ymin: -0.3, ymax: 8.3, grid: false, axes: false, maxWidth: 340,
                params: { n: { min: 1, max: 8, step: 1, value: 4, label: 'n', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const cols = ['blue', 'coral', 'teal', 'amber', 'violet', 'pink', 'blue', 'coral'], els = [];
                  for (let i = 0; i < p.n; i++) for (let j = 0; j < p.n; j++) {
                    const layer = Math.max(i, j);
                    els.push(s('rect', { x: plot.X(i) + 1, y: plot.Y(j + 1) + 1, width: plot.X(1) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(1) - 2, rx: 3, class: `fl-${cols[layer]}`, opacity: 0.75 }));
                  }
                  return els;
                },
                readout: (p) => r`$${Array.from({ length: p.n }, (_, i) => 2 * i + 1).join(' + ')} = ${p.n * p.n} = ${p.n}^2$`,
              },
              after: r`Induction makes it airtight. **Base:** $1 = 1^2$. **Step:** if the first $k$ odd numbers sum to $k^2$, adding the next one, $2k + 1$, gives $k^2 + 2k + 1 = (k + 1)^2$. So it holds for every $n$.`,
            },
            {
              type: 'mcq',
              title: 'Spot the flaw',
              body: r`A famous bogus "proof" that all horses are the same colour:

*Base:* any group of 1 horse is all one colour. ✓
*Step:* take a group of $k + 1$ horses. Remove one horse: the other $k$ are the same colour (by assumption). Put it back and remove a different horse: those $k$ are the same colour too. The two groups overlap, so all $k + 1$ horses share a colour.`,
              prompt: 'Where does it fail?',
              choices: [
                { t: 'The step from 1 horse to 2: the two smaller groups don’t overlap', ok: true },
                { t: 'The base case is wrong', why: 'A single horse really is one colour.' },
                { t: 'Induction doesn’t work for horses', why: 'Induction is fine. One specific step is broken.' },
              ],
              explain: r`With $k + 1 = 2$ horses, removing one leaves {horse 1}, and removing the other leaves {horse 2}. These groups don't overlap, so nothing links their colours. The chain breaks between the first and second domino, and every later step depends on that link.`,
            },
            {
              type: 'numeric',
              title: 'Sum to twenty',
              prompt: r`Induction proves $1 + 2 + \cdots + n = \frac{n(n+1)}{2}$. What is $1 + 2 + \cdots + 20$?`,
              answer: 210,
              explain: r`$\frac{20 \times 21}{2} = 210$. Once proved by induction, the formula works for every $n$ without adding anything up.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Use the pattern',
              body: r`By induction, one can prove that $1^3 + 2^3 + \cdots + n^3 = \left(\frac{n(n+1)}{2}\right)^2$.`,
              prompt: r`What is $1^3 + 2^3 + \cdots + 10^3$?`,
              answer: 3025,
              wrong: [{ v: 55, why: r`That's $1 + 2 + \cdots + 10$. Square it.` }],
              explain: r`$\left(\frac{10 \cdot 11}{2}\right)^2 = 55^2 = 3025$. The sum of the first $n$ cubes is the square of the sum of the first $n$ numbers.`,
            },
          ],
          recap: [
            'Induction: prove a base case and an inductive step (k ⇒ k + 1).',
            'Every step must work, including the very first one (remember the horses).',
            'Induction proves infinitely many statements in finitely many lines.',
          ],
        },
        {
          id: 'pigeonhole',
          title: 'The Pigeonhole Principle',
          summary: 'Too many pigeons',
          icon: 'target',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Socks in the dark',
              prompt: 'A drawer contains black and white socks. In the dark, how many socks must you take out to be sure of getting a matching pair?',
              answer: 3,
              wrong: [{ v: 2, why: 'Two socks might be one black and one white.' }, { v: 4, why: 'With 3 socks and only 2 colours, two of them must match.' }],
              explain: r`With 3 socks and only 2 colours, at least two must share a colour.`,
            },
            {
              type: 'explain',
              title: 'The principle',
              body: r`::: key
If $n + 1$ pigeons fly into $n$ holes, at least one hole contains two or more pigeons.
:::

It sounds obvious, but it proves surprising things, often without telling you **which** hole is crowded.`,
            },
            {
              type: 'mcq',
              title: 'Hairy heads',
              prompt: 'London has about 9 million people, and no human head has more than about 200,000 hairs. What must be true?',
              choices: [
                { t: 'At least two Londoners have exactly the same number of hairs', ok: true },
                { t: 'Nothing can be said without counting', why: 'There are more people than possible hair counts, so the pigeonhole principle applies.' },
                { t: 'Everyone has a different number of hairs', why: 'There are only about 200,001 possible counts for 9 million people.' },
              ],
              explain: r`There are at most about 200,001 possible hair counts (the holes) and 9 million people (the pigeons). So many people must share a count. In fact, some count is shared by at least $\lceil 9{,}000{,}000 / 200{,}001 \rceil = 45$ people.`,
            },
            {
              type: 'numeric',
              title: 'Birthday months',
              prompt: 'What is the smallest group size that guarantees at least 3 people share a birth month?',
              answer: 25,
              wrong: [{ v: 13, why: '13 guarantees 2 people sharing a month. For 3, fill every month with 2 people first.' }, { v: 36, why: 'With 25: if no month had 3 people, there would be at most 2 × 12 = 24 people.' }],
              explain: r`With 24 people you could have exactly 2 per month. The 25th person must make a third in some month. In general, $kn + 1$ pigeons guarantee some hole gets $k + 1$.`,
            },
            {
              type: 'interactive',
              title: 'The worst case',
              body: r`A drawer holds socks in 3 colours. Draw socks in the dark and imagine the **unluckiest** possible draw. What’s the smallest number that guarantees a matching pair?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: 0, ymax: 4, grid: false, axes: false, height: 200,
                params: { n: { min: 1, max: 7, step: 1, value: 2, label: 'socks drawn', color: 'violet' } },
                extra: ({ plot, p, s }) => { const cnt = [0, 0, 0]; for (let i = 0; i < p.n; i++) cnt[i % 3]++; return cnt.flatMap((c, j) => Array.from({ length: c }, (_, k) => s('rect', { x: plot.X(0.5 + j * 1.1), y: plot.Y(0.9 + k * 0.9), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(0.7), rx: 6, class: ['fl-blue', 'fl-coral', 'fl-teal'][j] }))); },
                readout: (p) => (p.n <= 3 ? `worst case: ${p.n} sock${p.n > 1 ? 's' : ''}, all different colours, no pair yet` : `even in the worst case, two socks share a colour ✓`),
                goal: (p) => p.n === 4,
                hint: 'Three socks could all be different. What does the next one do?',
                solution: { n: 4 },
              },
              explain: r`Three socks can be one of each colour, but the fourth must repeat a colour: 4 socks, 3 colours (pigeonholes), so some colour gets two. In general, $k + 1$ objects in $k$ boxes force a box with at least two.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Handshakes',
              prompt: 'At a party, some pairs of guests shake hands. Must two guests have shaken the same number of hands?',
              choices: [
                { t: 'Yes, always', ok: true },
                { t: 'No, it depends on the party', why: r`With $n$ guests, counts range from 0 to $n - 1$. But 0 and $n - 1$ can't both happen. That leaves $n - 1$ holes for $n$ guests.` },
              ],
              explain: r`With $n$ guests, each shakes between 0 and $n - 1$ hands. But if someone shook hands with everyone ($n - 1$), nobody shook 0. So only $n - 1$ different counts are possible for $n$ people, and two must match.`,
            },
          ],
          recap: [
            'n + 1 pigeons in n holes means some hole has at least 2.',
            'More generally, kn + 1 pigeons guarantee some hole has at least k + 1.',
            'The trick is choosing what counts as the “pigeons” and the “holes”.',
          ],
        },
      ],
    },
  ],
};
