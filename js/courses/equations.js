import { machine, scale } from './_figs.js';
import { fix } from '../lib/svg.js';

const r = String.raw;

// a sweep over 0.7 ≤ x ≤ 7.3 that pauses where the two sides balance (x = 5)
const scanX = (t) => {
  const d = 4 - 3.6 * Math.cos(t) - 5, a = Math.abs(d);
  return 5 + Math.sign(d) * (a < 0.3 ? 0 : a < 1.1 ? 0.8 * ((a - 0.3) / 0.8) ** 2 : a - 0.3);
};

export default {
  id: 'equations',
  subject: 'math',
  title: 'Solving Equations',
  level: 'Foundational',
  cover: 'balance',
  tagline: 'Balance scales, undo buttons, formulas, systems and inequalities.',
  description: r`Discover what the equals sign really means by playing with balance scales. Then learn to undo operations, turn word problems into equations, rearrange formulas, crack puzzles with two unknowns using algebra and graphs, and solve inequalities whose answers are whole ranges.`,
  chapters: [
    {
      title: 'The Balance',
      summary: 'An equation is a scale that stays level.',
      lessons: [
        {
          id: 'balance-scales',
          title: 'Balance Scales',
          summary: 'What does “=” really mean?',
          icon: 'target',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A mystery box',
              body: r`This scale is perfectly level. The {blue:blue box} has an unknown weight. Each {amber:gold coin} weighs exactly 1.`,
              widget: scale({ c: 3, x: 1 }, { c: 7 }, { x: 4 }),
              prompt: 'How much does the blue box weigh?',
              answer: 4,
              wrong: [
                { v: 7, why: 'The box shares its pan with 3 coins, so it doesn’t have to balance all 7 coins alone.' },
                { v: 10, why: '10 is the total weight of all the coins. Compare the two pans instead.' },
              ],
              hint: 'The left pan holds the box and 3 coins. The right pan holds 7 coins. Both pans weigh the same.',
              explain: r`The pans weigh the same. The left one is "box + 3", the right one is 7. So the box must make up the difference: $7 - 3 = 4$.`,
            },
            {
              type: 'interactive',
              title: 'Take the same off both sides',
              body: r`You probably reasoned like this: *take 3 coins off each pan*. The scale stays level, and the box ends up alone, balancing the coins that are left.

Try it.`,
              widget: { kind: 'balance', left: { x: 1, c: 3 }, right: { c: 7 }, x: 4, ops: ['sub1'], goal: 'isolate' },
              prompt: 'Get the box alone on one side.',
              explain: r`Each press takes one coin off **both** pans, so the pans always weigh the same. After three presses the box sits alone and balances 4 coins: the box weighs 4.`,
            },
            {
              type: 'mcq',
              title: 'Breaking the balance',
              widget: scale({ x: 1, c: 3 }, { c: 7 }, { x: 4 }),
              prompt: 'Now take 2 coins off the **left** pan only. What happens?',
              choices: [
                { t: 'The left pan rises and the right pan sinks', ok: true },
                { t: 'The left pan sinks and the right pan rises', why: 'The left pan just got *lighter*. A lighter pan can’t sink.' },
                { t: 'The scale stays level', why: 'The left pan lost 2 units of weight but the right pan didn’t change, so they no longer weigh the same.' },
              ],
              explain: r`Before, both pans weighed 7. Removing 2 coins from the left makes it weigh 5, while the right still weighs 7. The heavier right pan sinks.

That's the danger: change only one side, and the two sides stop being equal.`,
            },
            {
              type: 'explain',
              title: 'An equation is a balance',
              body: r`Write the scale in symbols. Call the box's weight $\blue{x}$:

$$\blue{x} + 3 = 7$$

The **equals sign** says that both sides have the same value, just like the level scale. Solving the equation means finding the value of $\blue{x}$ that makes it true.

::: key
Whatever you do to one side of an equation, do exactly the same to the other side. Then it stays balanced.
:::

Taking 3 off both sides gives $\blue{x} = 4$.`,
              widget: { kind: 'balance', left: { x: 1, c: 3 }, right: { c: 7 }, x: 4, showEq: true },
            },
            {
              type: 'multi',
              title: 'Balanced moves',
              widget: { kind: 'balance', left: { x: 2, c: 1 }, right: { c: 7 }, x: 3, showEq: true },
              prompt: 'Which of these moves keep this scale level? Select all that apply.',
              choices: [
                { t: 'Remove 1 coin from each pan', ok: true },
                { t: 'Add 5 coins to each pan', ok: true },
                { t: 'Remove 1 coin from the left pan only', why: 'Changing only one pan breaks the balance.' },
                { t: 'Remove one box from the left and one coin from the right', why: 'A box doesn’t weigh the same as a coin. Here each box weighs 3, so the two pans change by different amounts.' },
                { t: 'Swap the two pans', ok: true },
              ],
              explain: r`Adding or removing the **same amount** on both pans keeps them equal. Swapping the pans also works: if $2x + 1 = 7$, then $7 = 2x + 1$ too. Equality works in both directions.

Removing a box from one side and a coin from the other changes the sides by $x$ and by $1$. Those are only equal if $x = 1$.`,
            },
            {
              type: 'numeric',
              title: 'Two boxes',
              body: r`The two boxes are identical.`,
              widget: scale({ x: 2, c: 1 }, { c: 7 }, { x: 3 }),
              prompt: 'How much does each box weigh?',
              lhs: r`$\blue{x} =$`,
              answer: 3,
              wrong: [
                { v: 6, why: 'That’s how much the **two** boxes weigh together. How much is one?' },
                { v: 3.5, why: 'You split 7 in half, but the coin on the left needs to come off first.' },
                { v: 4, why: 'Check it: two boxes of 4 plus a coin would weigh 9, not 7.' },
              ],
              explain: r`Remove the coin from both sides: $2\blue{x} = 6$. Two identical boxes balance 6 coins, so each box balances half of them: $\blue{x} = 3$.`,
            },
            {
              type: 'interactive',
              title: 'Split both sides',
              body: r`Once two boxes balance 6 coins, you can split **each** side into two equal groups. Keep one group from each side and it still balances. That's dividing both sides by 2.`,
              widget: { kind: 'balance', left: { x: 2, c: 1 }, right: { c: 7 }, x: 3, ops: ['sub1', 'div'], goal: 'isolate' },
              prompt: 'Use the moves to get one box alone.',
              hint: 'First clear the coins away from the boxes. Then divide.',
              explain: r`$$\begin{aligned} 2\blue{x} + 1 &= 7 \\ 2\blue{x} &= 6 \quad (\text{remove 1 from both}) \\ \blue{x} &= 3 \quad (\text{divide both by } 2) \end{aligned}$$`,
            },
            {
              type: 'interactive',
              title: 'Boxes on both sides',
              body: r`Boxes can sit on both pans. The same rule applies: you may remove a box from both sides, because the boxes weigh the same.`,
              widget: { kind: 'balance', left: { x: 3, c: 1 }, right: { x: 1, c: 9 }, x: 4, ops: ['sub1', 'subx', 'div'], goal: 'isolate' },
              prompt: 'Get one box alone.',
              hint: 'Remove a box from both sides so all the boxes are together on the left. Then deal with the coins.',
              explain: r`$$\begin{aligned} 3\blue{x} + 1 &= \blue{x} + 9 \\ 2\blue{x} + 1 &= 9 \quad (\text{remove } \blue{x} \text{ from both}) \\ 2\blue{x} &= 8 \quad (\text{remove 1 from both}) \\ \blue{x} &= 4 \quad (\text{divide both by 2}) \end{aligned}$$`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'No scale this time',
              body: r`Picture the balance in your head.`,
              prompt: r`Solve $4\blue{x} + 2 = \blue{x} + 14$.`,
              lhs: r`$\blue{x} =$`,
              answer: 4,
              wrong: [
                { v: 3, why: r`Don't forget the $\blue{x}$ on the right side. Remove one $\blue{x}$ from both sides too.` },
                { v: 2.4, why: r`Removing $\blue{x}$ from the right means removing it from the left as well: $4x - x = 3x$, not $5x$.` },
                { v: 16 / 3, tol: 0.01, why: 'To get rid of the +2, subtract 2 from both sides (don’t add it).' },
              ],
              hint: r`Remove one $\blue{x}$ from both sides, then remove 2 from both sides.`,
              explain: r`$$\begin{aligned} 4\blue{x} + 2 &= \blue{x} + 14 \\ 3\blue{x} + 2 &= 14 \\ 3\blue{x} &= 12 \\ \blue{x} &= 4 \end{aligned}$$
Check: $4(4) + 2 = 18$ and $4 + 14 = 18$. ✓`,
            },
          ],
          recap: [
            'An equation is like a level scale: both sides have the same value.',
            'Doing the same thing to both sides keeps it balanced.',
            r`To solve, use balanced moves until $x$ is alone on one side.`,
          ],
        },
        {
          id: 'undoing',
          title: 'Undo Buttons',
          summary: 'Inverse operations, in reverse order',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Think of a number',
              body: r`I think of a number. I multiply it by 3, then add 5. I get **26**.`,
              prompt: 'What was my number?',
              answer: 7,
              wrong: [
                { v: 31 / 3, tol: 0.01, why: 'You added 5 again. To undo “add 5”, subtract 5.' },
                { v: 26 / 3 - 5, tol: 0.01, why: 'Right operations, wrong order. The +5 happened last, so undo it first.' },
                { v: 93, why: 'Undoing “multiply by 3” means dividing by 3, not multiplying.' },
              ],
              hint: 'Work backwards from 26. What was the number just before I added 5?',
              explain: r`Work backwards: before adding 5 the number was $26 - 5 = 21$. Before multiplying by 3 it was $21 \div 3 = 7$.`,
            },
            {
              type: 'explain',
              title: 'Every operation has an undo button',
              body: r`Think of the puzzle as a machine. Your number goes in, gets multiplied by 3, then has 5 added.

To run it **backwards**, use the opposite (the *inverse*) of each operation, starting with the **last** one.`,
              widget: machine(['×3', '+5'], { input: 'x', output: '26', back: true, mids: ['21'], backMids: ['7', '21'] }),
              after: r`It's like getting dressed: socks first, then shoes. Getting undressed, the shoes come off first. Addition and subtraction undo each other, and so do multiplication and division.`,
            },
            {
              type: 'mcq',
              title: 'The right undo',
              prompt: r`Which operation undoes "divide by 4"?`,
              cols: 2,
              choices: [
                { t: 'Multiply by 4', ok: true },
                { t: 'Subtract 4', why: 'Subtraction undoes addition, not division.' },
                { t: 'Divide by 4 again', why: 'That makes the number even smaller. Try it with 20: 20 → 5 → 1.25.' },
                { t: r`Multiply by $\tfrac14$`, why: r`Multiplying by $\tfrac14$ is the *same* as dividing by 4, so it does the operation a second time.` },
              ],
              explain: r`Try it: $20 \div 4 = 5$, and $5 \times 4 = 20$. Multiplying by 4 brings you back to where you started.`,
            },
            {
              type: 'order',
              title: 'Solving in order',
              body: r`Here is an equation:
$$\frac{\blue{x}}{2} - 3 = 5$$
In words: take $\blue{x}$, divide by 2, then subtract 3. The result is 5.`,
              prompt: 'Put the solution steps in order.',
              items: [
                r`Add 3 to both sides: $\frac{x}{2} = 8$`,
                r`Multiply both sides by 2: $x = 16$`,
                r`Check: $16 \div 2 - 3 = 5$ ✓`,
              ],
              explain: r`Subtracting 3 was the **last** thing done to $x$, so undo it first by adding 3. Then undo the division by multiplying by 2. Finally, check by putting 16 back into the original equation.`,
            },
            {
              type: 'numeric',
              title: 'Your turn',
              prompt: r`Solve $\dfrac{\blue{x}}{3} - 2 = 5$.`,
              lhs: r`$\blue{x} =$`,
              answer: 21,
              wrong: [
                { v: 9, why: r`To undo $-2$, **add** 2 to both sides.` },
                { v: 7 / 3, tol: 0.01, why: r`To undo $\div 3$, **multiply** by 3.` },
                { v: 13, why: r`It looks like you multiplied first and then added: $3\cdot5 - 2 = 13$. Undo the $-2$ first, then multiply by 3.` },
              ],
              explain: r`$$\begin{aligned} \frac{x}{3} - 2 &= 5 \\ \frac{x}{3} &= 7 \\ x &= 21 \end{aligned}$$
Check: $21 \div 3 - 2 = 7 - 2 = 5$. ✓`,
            },
            {
              type: 'numeric',
              title: 'Below zero',
              body: r`Undoing works with negative numbers too. A balance can't hold negative weights, but the equation doesn't care.`,
              prompt: r`Solve $\blue{x} + 9 = 4$.`,
              lhs: r`$\blue{x} =$`,
              answer: -5,
              wrong: [
                { v: 5, why: 'Check it: 5 + 9 = 14, not 4. Watch the sign.' },
                { v: 13, why: r`To undo $+9$, subtract 9 from both sides.` },
              ],
              explain: r`Subtract 9 from both sides: $x = 4 - 9 = -5$. Check: $-5 + 9 = 4$. ✓`,
            },
            {
              type: 'mcq',
              title: 'Spot the mistake',
              body: r`Sam solved $2(\blue{x} + 4) = 18$ like this:

1. $2x + 4 = 18$
2. $2x = 14$
3. $x = 7$`,
              prompt: 'Where is Sam’s first mistake?',
              fixed: true,
              choices: [
                { t: 'Line 1', ok: true },
                { t: 'Line 2', why: 'Going from line 1 to line 2 correctly subtracts 4 from both sides. The trouble starts earlier.' },
                { t: 'Line 3', why: 'Dividing 14 by 2 is fine. The trouble starts earlier.' },
                { t: 'There is no mistake', why: r`Check: $2(7 + 4) = 22$, not 18.` },
              ],
              explain: r`The 2 multiplies **everything** in the brackets: $2(x + 4) = 2x + 8$, not $2x + 4$. Picture two bags, each holding an $x$ and 4 coins: that's two $x$'s and 8 coins.`,
            },
            {
              type: 'numeric',
              title: 'Fix it',
              prompt: r`Now solve $2(\blue{x} + 4) = 18$ correctly.`,
              lhs: r`$\blue{x} =$`,
              answer: 5,
              wrong: [{ v: 7, why: r`That's Sam's answer. Remember that $2(x+4) = 2x + 8$.` }],
              explain: r`Two ways, same answer:

- Divide both sides by 2 first: $x + 4 = 9$, so $x = 5$.
- Or expand: $2x + 8 = 18$, so $2x = 10$ and $x = 5$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Taxi ride',
              body: r`A taxi charges a flat fee of \$3, plus \$2 for every kilometre. Your ride cost \$19.`,
              prompt: 'How many kilometres was the ride?',
              unit: 'km',
              answer: 8,
              wrong: [
                { v: 9.5, why: r`Don't forget the \$3 flat fee. Only part of the \$19 pays for distance.` },
                { v: 11, why: 'The flat fee was *added* to the cost, so subtract it before dividing.' },
              ],
              explain: r`Let $d$ be the distance. The cost is $3 + 2d = 19$. Undo the $+3$: $2d = 16$. Undo the $\times 2$: $d = 8$ km.`,
            },
          ],
          recap: [
            'Addition and subtraction undo each other, and so do multiplication and division.',
            'Undo operations in reverse order: the last thing done to $x$ is the first thing you undo.',
            r`A number in front of brackets multiplies everything inside: $2(x+4) = 2x+8$.`,
            'Always check by putting your answer back into the original equation.',
          ],
        },
      ],
    },
    {
      title: 'Equations in the Wild',
      summary: 'Turning words into equations, and equations that misbehave.',
      lessons: [
        {
          id: 'writing-equations',
          title: 'Words to Equations',
          summary: 'Translate stories into algebra',
          icon: 'pencil',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Translate',
              prompt: r`Let $n$ be a number. Which expression means “3 less than twice a number”?`,
              cols: 2,
              choices: [
                { t: r`$2n - 3$`, ok: true },
                { t: r`$3 - 2n$`, why: r`"3 less than" something means you start with that something and take 3 away. $3 - 2n$ is "twice a number less than 3".` },
                { t: r`$2(n - 3)$`, why: r`That's "twice (3 less than a number)": it subtracts first, then doubles.` },
                { t: r`$2 - 3n$`, why: r`Twice a number is $2n$, not $3n$.` },
              ],
              explain: r`"Twice a number" is $2n$. "3 less than" that means subtract 3 from it: $2n - 3$. Test with $n = 10$: twice 10 is 20, and 3 less than 20 is 17. Only $2n - 3$ gives 17.`,
            },
            {
              type: 'explain',
              title: 'A recipe for word problems',
              body: r`Word problems feel hard because two jobs are mixed together: *translating* and *solving*. Do them separately.

1. **Name** the unknown with a letter. Say what it stands for.
2. **Translate** each fact into algebra.
3. **Solve** the equation, using the balance moves.
4. **Check** the answer against the original story, not just your equation.

The checking step catches translation mistakes that algebra can't see.`,
            },
            {
              type: 'numeric',
              title: 'The rectangle',
              body: r`A rectangle is 3 cm longer than it is wide. Its perimeter is 26 cm.`,
              widget: {
                kind: 'figure', w: 600, h: 220, label: 'Rectangle with width w and length w + 3',
                draw: ({ s }) => [
                  s('rect', { x: 170, y: 40, width: 260, height: 130, rx: 6, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }),
                  s('text', { x: 300, y: 30, 'text-anchor': 'middle', class: 'lbl-math', text: 'w + 3' }),
                  s('text', { x: 150, y: 112, 'text-anchor': 'end', class: 'lbl-math', text: 'w' }),
                  s('text', { x: 300, y: 196, 'text-anchor': 'middle', class: 'lbl-math', text: 'w + 3' }),
                  s('text', { x: 450, y: 112, class: 'lbl-math', text: 'w' }),
                ],
              },
              prompt: r`What is the width $w$?`,
              lhs: r`$w =$`,
              unit: 'cm',
              answer: 5,
              wrong: [
                { v: 11.5, why: 'The perimeter goes all the way around, so it includes two widths and two lengths.' },
                { v: 6.5, why: r`Careful: there are two lengths, and each one is $w + 3$. Together they add 6, not 3.` },
                { v: 8, why: 'That’s the length. The question asks for the width.' },
              ],
              hint: r`Add up all four sides: $w + (w+3) + w + (w+3)$.`,
              explain: r`Going around: $w + (w + 3) + w + (w + 3) = 4w + 6$. So
$$4w + 6 = 26 \;\Rightarrow\; 4w = 20 \;\Rightarrow\; w = 5.$$
Check: width 5, length 8, perimeter $5 + 8 + 5 + 8 = 26$. ✓`,
            },
            {
              type: 'mcq',
              title: 'Three in a row',
              body: r`Three consecutive whole numbers (like 7, 8, 9) add up to 51.`,
              prompt: r`If the smallest is $n$, which equation fits?`,
              choices: [
                { t: r`$n + (n+1) + (n+2) = 51$`, ok: true },
                { t: r`$n + n + n = 51$`, why: 'That says all three numbers are the same. Consecutive numbers go up by 1 each time.' },
                { t: r`$n + 2n + 3n = 51$`, why: r`That's $n$, double $n$ and triple $n$. For $n = 7$ it gives 7, 14, 21, which aren't consecutive.` },
                { t: r`$(n+1) + (n+2) + (n+3) = 51$`, why: r`If the smallest number is $n$, the list has to start at $n$.` },
              ],
              explain: r`If the smallest is $n$, the next two are $n + 1$ and $n + 2$. Adding them gives $3n + 3 = 51$.`,
            },
            {
              type: 'numeric',
              title: 'Find them',
              prompt: r`Solve $n + (n+1) + (n+2) = 51$. What is the **largest** of the three numbers?`,
              answer: 18,
              wrong: [
                { v: 16, why: r`That's $n$, the smallest. The largest is $n + 2$.` },
                { v: 17, why: 'That’s the middle number.' },
              ],
              explain: r`$3n + 3 = 51$, so $3n = 48$ and $n = 16$. The numbers are 16, 17 and 18, and the largest is **18**.

A shortcut: the middle number of three consecutive numbers is their average, $51 \div 3 = 17$.`,
            },
            {
              type: 'numeric',
              title: 'Ages',
              body: r`Maya is 4 times as old as her brother. In 6 years, she'll be only twice as old as him.`,
              prompt: 'How old is her brother now?',
              unit: 'years',
              answer: 3,
              wrong: [
                { v: 12, why: 'That’s Maya’s age. The question asks about her brother.' },
                { v: 6, why: r`Check it: if he is 6 now, Maya is 24. In 6 years they'd be 12 and 30, and 30 isn't twice 12.` },
              ],
              hint: r`Let the brother be $b$, so Maya is $4b$. In 6 years they are $b + 6$ and $4b + 6$.`,
              explain: r`Let the brother be $b$. Maya is $4b$. In 6 years: $4b + 6 = 2(b + 6)$.
$$4b + 6 = 2b + 12 \;\Rightarrow\; 2b = 6 \;\Rightarrow\; b = 3.$$
Check: now 3 and 12. In 6 years, 9 and 18, and 18 is twice 9. ✓`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which equation?',
              body: r`A school has 3 times as many students as teachers. Let $s$ be the number of students and $t$ the number of teachers.`,
              prompt: 'Which equation is correct?',
              cols: 2,
              choices: [
                { t: r`$s = 3t$`, ok: true },
                { t: r`$3s = t$`, why: r`Test it: with 10 teachers there should be 30 students. $3s = t$ would give $3 \cdot 30 = 90 \ne 10$. This is a classic trap: the words put "3" next to "students", but it's the number of *teachers* that gets multiplied by 3.` },
                { t: r`$s + 3 = t$`, why: r`"3 times as many" means multiplying, not adding.` },
                { t: r`$s = t + 3$`, why: r`That means 3 *more* students than teachers, not 3 *times* as many.` },
              ],
              explain: r`There are more students, so $s$ must be the bigger number: $s = 3t$. Always test with numbers. With 10 teachers, $s = 3 \times 10 = 30$ students, which makes sense.

Even many university students write $3s = t$ for this kind of problem. Checking with real numbers catches it.`,
            },
          ],
          recap: [
            'Name the unknown, translate each fact, solve, then check against the story.',
            r`"3 less than $x$" is $x - 3$, and "3 times as many" means multiplying.`,
            'Testing an equation with real numbers catches translation mistakes.',
          ],
        },
        {
          id: 'formulas',
          title: 'Rearranging Formulas',
          summary: 'Making any letter the subject',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Formulas are equations too',
              body: r`A formula like $v = \dfrac{d}{t}$ (speed = distance ÷ time) is just an equation with several letters. To find the time for a journey, you want $t$ on its own: you **rearrange** the formula, using exactly the same balance moves as before.

$$v = \frac{d}{t} \;\xrightarrow{\;\times t\;}\; vt = d \;\xrightarrow{\;\div v\;}\; t = \frac{d}{v}$$`,
            },
            {
              type: 'numeric',
              title: 'Journey time',
              prompt: r`Using $t = \dfrac{d}{v}$: how many hours does a 270 km trip take at 90 km/h?`,
              unit: 'h',
              answer: 3,
              wrong: [{ v: 24300, why: r`That's $d \times v$. Time is distance **divided** by speed.` }, { v: 1 / 3, tol: 0.01, why: r`That's $v \div d$. Use $t = d \div v$.` }],
              explain: r`$t = \dfrac{270}{90} = 3$ hours.`,
            },
            {
              type: 'mcq',
              title: 'Celsius from Fahrenheit',
              prompt: r`Rearrange $F = \tfrac95 C + 32$ to make $C$ the subject.`,
              choices: [
                { t: r`$C = \tfrac59 (F - 32)$`, ok: true },
                { t: r`$C = \tfrac59 F - 32$`, why: r`Undo in reverse order: first subtract 32 (it was added last), then multiply by $\tfrac59$.` },
                { t: r`$C = \tfrac95 (F - 32)$`, why: r`To undo multiplying by $\tfrac95$, multiply by its reciprocal, $\tfrac59$.` },
              ],
              explain: r`The formula does "× 9/5, then + 32". Undo in reverse: "− 32, then × 5/9": $C = \tfrac59(F - 32)$. Check: $F = 212$ gives $C = \tfrac59 \times 180 = 100$ ✓.`,
            },
            {
              type: 'order',
              title: 'Radius from volume',
              body: r`A cone's volume is $V = \tfrac13 \pi r^2 h$.`,
              prompt: r`Put the steps for making $r$ the subject in order.`,
              items: [
                r`Multiply both sides by 3: $3V = \pi r^2 h$`,
                r`Divide both sides by $\pi h$: $\dfrac{3V}{\pi h} = r^2$`,
                r`Take the square root: $r = \sqrt{\dfrac{3V}{\pi h}}$`,
              ],
              explain: r`Peel off the operations around $r$ from the outside in: the $\tfrac13$, then the $\pi h$, and finally the square.`,
            },
            {
              type: 'numeric',
              title: 'A circular garden',
              prompt: r`A circular lawn has area $A = \pi r^2 = 50\ \text{m}^2$. What is its radius? (2 decimal places.)`,
              unit: 'm',
              answer: Math.sqrt(50 / Math.PI),
              tol: 0.006,
              wrong: [{ v: 50 / Math.PI, tol: 0.01, why: r`That's $r^2$. Take the square root as the last step.` }, { v: Math.sqrt(50) / Math.PI, tol: 0.01, why: r`Divide by $\pi$ **before** taking the square root: $r = \sqrt{A / \pi}$.` }],
              explain: r`$r = \sqrt{\dfrac{A}{\pi}} = \sqrt{\dfrac{50}{3.1416}} = \sqrt{15.92} \approx 3.99$ m.`,
            },
            {
              type: 'interactive',
              title: 'Where the scales agree',
              body: r`The line shows $F = \frac95 C + 32$, converting Celsius to Fahrenheit. The dashed line is $F = C$. Drag the point to the one temperature that reads the same on both scales.`,
              widget: {
                kind: 'graph', xmin: -60, xmax: 60, ymin: -80, ymax: 140, grid: 20, gridY: 20, height: 320, axes: { xlabel: '°C', ylabel: '°F' },
                params: { c: { min: -60, max: 60, step: 1, value: 20, slider: false } },
                curves: [{ f: (x) => 1.8 * x + 32, color: 'violet', width: 3 }, { f: (x) => x, color: 'muted', dash: true }],
                points: [{ x: (p) => p.c, y: (p) => 1.8 * p.c + 32, drag: { x: 'c' }, color: 'coral' }],
                readout: (p) => `${p.c} °C = **${(1.8 * p.c + 32).toFixed(0)} °F**`,
                goal: (p) => p.c === -40,
                hint: r`Solve $C = \frac95 C + 32$.`,
                solution: { c: -40 },
              },
              explain: r`$C = \frac95 C + 32$ gives $-\frac45 C = 32$, so $C = -40$: $-40°$ is the same on both scales. Rearranging formulas turns questions like "when are they equal?" into one line of algebra.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Trapezium height',
              prompt: r`A trapezium's area is $A = \tfrac12 (a + b) h$. If $A = 45\ \text{cm}^2$ and the parallel sides are $a = 7$ cm and $b = 11$ cm, what is the height $h$?`,
              unit: 'cm',
              answer: 5,
              wrong: [{ v: 2.5, why: r`Don't forget the $\tfrac12$: $h = \dfrac{2A}{a + b}$.` }, { v: 10, why: r`$h = \dfrac{2 \times 45}{18}$.` }],
              explain: r`$h = \dfrac{2A}{a + b} = \dfrac{90}{18} = 5$ cm. Rearranging first, then substituting, is often cleaner than substituting numbers straight away.`,
            },
          ],
          recap: [
            'A formula is an equation; rearrange it with the same balance moves.',
            'Undo the operations around the target letter in reverse order.',
            'Rearrange first, then substitute numbers.',
          ],
        },
        {
          id: 'strange-solutions',
          title: 'Strange Solutions',
          summary: 'No solution, or infinitely many',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Something’s off',
              prompt: r`Try to solve $2x + 3 = 2x + 5$. What happens?`,
              choices: [
                { t: 'There is no solution', ok: true },
                { t: r`$x = 0$`, why: r`Check it: $2(0) + 3 = 3$ but $2(0) + 5 = 5$.` },
                { t: r`$x = 1$`, why: r`Check it: $2(1) + 3 = 5$ but $2(1) + 5 = 7$.` },
                { t: 'Every number is a solution', why: r`Try any number: the right side always comes out 2 bigger than the left.` },
              ],
              explain: r`Remove $2x$ from both sides and you're left with $3 = 5$, which is never true. Whatever $x$ is, the right side is always 2 more than the left. There is **no solution**.`,
            },
            {
              type: 'explain',
              title: 'When the unknowns vanish',
              body: r`Sometimes the balance moves make $x$ disappear completely. What's left tells you the story:

- **A false statement** (like $3 = 5$): no value of $x$ works. The equation has **no solution**.
- **A true statement** (like $5 = 5$): every value of $x$ works. The equation is true for **all** $x$ and is called an **identity**.

For example, $2(x + 1) = 2x + 2$ becomes $2x + 2 = 2x + 2$, and then $2 = 2$. That's always true: both sides are the same expression written two ways.`,
            },
            {
              type: 'mcq',
              title: 'Which kind?',
              prompt: r`How many solutions does $3(x - 2) = 3x - 6$ have?`,
              choices: [
                { t: 'Infinitely many (every number works)', ok: true },
                { t: 'Exactly one', why: r`Expand the left side and compare it with the right side.` },
                { t: 'None', why: r`Expand: $3(x-2) = 3x - 6$, which is exactly the right side.` },
              ],
              explain: r`$3(x - 2) = 3x - 6$, so both sides are identical. Subtracting $3x$ from both leaves $-6 = -6$, which is always true.`,
            },
            {
              type: 'mcq',
              title: 'And this one?',
              prompt: r`How many solutions does $5x - 1 = 3x - 1$ have?`,
              choices: [
                { t: r`Exactly one ($x = 0$)`, ok: true },
                { t: 'None', why: r`Remember that $x = 0$ is a perfectly good solution. Check: $5(0) - 1 = -1$ and $3(0) - 1 = -1$.` },
                { t: 'Infinitely many', why: r`Try $x = 1$: $5 - 1 = 4$ but $3 - 1 = 2$. Not every number works.` },
              ],
              explain: r`Add 1 to both sides: $5x = 3x$. Subtract $3x$: $2x = 0$, so $x = 0$.

A solution of zero is still a solution. "No solution" only happens when you end up with a false statement like $3 = 5$.`,
            },
            {
              type: 'mcq',
              title: 'The vanishing solution',
              body: r`Alex wants to solve $x^2 = 3x$ and writes: "Divide both sides by $x$, so $x = 3$." Alex is happy, because $3^2 = 9 = 3 \cdot 3$.`,
              prompt: 'What did Alex miss?',
              choices: [
                { t: r`$x = 0$ is also a solution`, ok: true },
                { t: r`$x = -3$ is also a solution`, why: r`Check: $(-3)^2 = 9$ but $3 \cdot (-3) = -9$.` },
                { t: 'Nothing, 3 is the only solution', why: r`Try $x = 0$: $0^2 = 0$ and $3 \cdot 0 = 0$.` },
              ],
              explain: r`Dividing by $x$ is only allowed when $x \ne 0$, so it quietly throws away the case $x = 0$. And $x = 0$ works: $0^2 = 0 = 3 \cdot 0$.

The safe way is to move everything to one side: $x^2 - 3x = 0$, which factors as $x(x - 3) = 0$. A product is zero when either factor is zero, so $x = 0$ or $x = 3$.

::: key
Never divide both sides by something that might be zero.
:::`,
            },
            { /*anim:equations*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A balance on a graph',
              body: r`Solve $\blue{3x - 1} = \coral{x + 9}$ by brute force: try every $x$. Each side is a line. The scanner tries values of $x$ and loads the two sides onto a balance.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: -2, ymax: 26, grid: 1, gridY: 2, height: 340, axes: { xlabel: 'x', yticks: 4, xticks: 1 },
                animate: { param: 't', speed: 0.3, max: 2 * Math.PI, autoplay: true },
                curves: [
                  { f: (x) => 3 * x - 1, color: 'blue' },
                  { f: (x) => x + 9, color: 'coral' },
                ],
                extra: ({ plot, p, s }) => {
                  const x = scanX(p.t), L = 3 * x - 1, R = x + 9;
                  const els = [s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(-2), y2: plot.Y(26), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' })];
                  els.push(s('circle', { cx: plot.X(x), cy: plot.Y(L), r: 7, class: 'fl-blue', stroke: 'var(--card)', 'stroke-width': 2.5 }));
                  els.push(s('circle', { cx: plot.X(x), cy: plot.Y(R), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2.5 }));
                  // the balance, drawn in pixels in the empty top-left corner
                  const px = plot.X(1.9), py = plot.Y(19.5), half = 66, ang = Math.max(-0.35, Math.min(0.35, (L - R) * 0.03));
                  const ex = half * Math.cos(ang), ey = half * Math.sin(ang);
                  const lx = px - ex, ly = py + ey, rx = px + ex, ry = py - ey;
                  els.push(s('path', { d: `M${px} ${py} L${px - 14} ${py + 34} L${px + 14} ${py + 34} Z`, class: 'fl-muted' }));
                  els.push(s('line', { x1: lx, y1: ly, x2: rx, y2: ry, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
                  const pan = (cx, cy, cls, v) => [
                    s('line', { x1: cx, y1: cy, x2: cx, y2: cy + 16, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    s('rect', { x: cx - 26, y: cy + 16, width: 52, height: 10, rx: 4, class: cls }),
                    s('text', { x: cx, y: cy + 44, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', text: fix(v, 1) }),
                  ];
                  els.push(pan(lx, ly, 'fl-blue', L), pan(rx, ry, 'fl-coral', R));
                  if (Math.abs(L - R) < 0.03) els.push(s('circle', { cx: plot.X(5), cy: plot.Y(14), r: 13, fill: 'none', stroke: 'var(--success)', 'stroke-width': 3 }));
                  return els;
                },
                readout: (p) => { const x = scanX(p.t), L = 3 * x - 1, R = x + 9; return r`$x = ${fix(x, 1)}$: $\;\blue{3x - 1} = ${fix(L, 1)}$, $\;\coral{x + 9} = ${fix(R, 1)}$ ${Math.abs(L - R) < 0.03 ? '· **balanced!**' : L > R ? '· left is heavier' : '· right is heavier'}`; },
              },
              after: r`Left of the crossing, the right pan is heavier; right of it, the left pan is. The scale is level at exactly one $x$, where the lines cross: $x = 5$, with both sides equal to 14. Solving an equation is finding where two graphs meet, which is why lines that never meet give no solution, and lines that coincide give infinitely many.`,
            },
            {
              type: 'interactive',
              title: 'One, none or infinitely many',
              body: r`Solving $2x + 3 = mx + c$ means finding where two lines cross. Change the second line. Make the equation have **infinitely many** solutions.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -8, ymax: 12, grid: 1, gridY: 2, height: 300, axes: { xlabel: 'x' },
                params: { m: { min: -3, max: 3, step: 0.5, value: 1, label: 'slope $m$', color: 'coral', format: (v) => v.toFixed(1) }, c: { min: -5, max: 5, step: 1, value: 0, label: 'intercept $c$', color: 'teal' } },
                curves: [{ f: (x) => 2 * x + 3, color: 'blue', width: 3 }, { f: (x, p) => p.m * x + p.c, color: 'coral', width: 3, dash: true }],
                readout: (p) => (p.m !== 2 ? `one solution: $x = ${((p.c - 3) / (2 - p.m)).toFixed(2)}$` : p.c !== 3 ? '**no solution**: parallel lines never meet' : '**infinitely many**: the lines are the same, so every $x$ works'),
                goal: (p) => p.m === 2 && p.c === 3,
                hint: 'The two sides must be exactly the same expression.',
                solution: { m: 2, c: 3 },
              },
              explain: r`With $m = 2$ and $c = 3$ both sides are $2x + 3$: an identity, true for every $x$. Same slope but a different intercept gives parallel lines: no solution, and the algebra collapses to something false like $3 = 0$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Make it impossible',
              body: r`Look at the equation $ax + 4 = 6x + 1$, where $a$ is some number.`,
              prompt: r`For which value of $a$ does the equation have **no solution**?`,
              lhs: r`$a =$`,
              answer: 6,
              wrong: [{ v: -6, why: r`With $a = -6$ you'd get $-6x + 4 = 6x + 1$, which gives $12x = 3$, so $x = \tfrac14$. That has a solution.` }],
              hint: r`The $x$ terms need to cancel completely, leaving a false statement.`,
              explain: r`If $a = 6$, subtracting $6x$ from both sides leaves $4 = 1$, which is false. For any other value of $a$, you get $(a - 6)x = -3$, so $x = \frac{-3}{a - 6}$: exactly one solution.`,
            },
          ],
          recap: [
            r`If $x$ cancels and leaves a false statement (like $3 = 5$), there's no solution.`,
            r`If it leaves a true statement (like $2 = 2$), every $x$ is a solution: an identity.`,
            r`$x = 0$ is a real solution. Never divide by something that could be zero.`,
          ],
        },
      ],
    },
    {
      title: 'Two Unknowns',
      summary: 'Systems of equations, solved with balances.',
      lessons: [
        {
          id: 'two-scales',
          title: 'Two Scales',
          summary: 'Substitution: swap one thing for another',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Boxes and balls',
              body: r`Both scales are level. Every {blue:box} weighs the same, and every {teal:ball} weighs the same.

**Scale 1:** one box balances two balls.`,
              widget: { kind: 'balance', left: { x: 1 }, right: { y: 2 }, x: 4, y: 2, showEq: true, label: 'x', labelY: 'y' },
              after: r`**Scale 2:** one box and one ball together balance 6 coins.

$$\blue{x} + \teal{y} = 6$$`,
              prompt: 'How much does one ball weigh?',
              lhs: r`$\teal{y} =$`,
              answer: 2,
              wrong: [
                { v: 3, why: r`That would make the box weigh 3 too, but scale 1 says a box weighs as much as **two** balls.` },
                { v: 4, why: 'That’s the box. The question asks about the ball.' },
                { v: 1.5, why: r`Check it: the box would weigh 3, and $3 + 1.5 = 4.5$, not 6.` },
              ],
              hint: 'On scale 2, swap the box for two balls. That keeps it balanced, because they weigh the same.',
              explain: r`Scale 1 says $\blue{x} = 2\teal{y}$. On scale 2, swap the box for two balls: $2\teal{y} + \teal{y} = 6$, so $3\teal{y} = 6$ and $\teal{y} = 2$. Then the box weighs $\blue{x} = 4$.`,
            },
            {
              type: 'explain',
              title: 'Substitution',
              body: r`What you just did has a name: **substitution**. If two things weigh the same, you can swap one for the other on any scale without breaking the balance.

$$\begin{aligned} \blue{x} &= 2\teal{y} \\ \blue{x} + \teal{y} &= 6 \end{aligned} \quad\longrightarrow\quad 2\teal{y} + \teal{y} = 6$$

The swap removes one unknown completely, leaving a one-unknown equation you already know how to solve.`,
              widget: { kind: 'balance', left: { y: 3 }, right: { c: 6 }, x: 4, y: 2, showEq: true, label: 'x', labelY: 'y' },
              after: 'After the swap, scale 2 shows three balls balancing 6 coins.',
            },
            {
              type: 'numeric',
              title: 'Your turn',
              body: r`$$\begin{aligned} \blue{x} &= \teal{y} + 3 \\ \blue{x} + \teal{y} &= 11 \end{aligned}$$`,
              prompt: r`Find $\teal{y}$.`,
              lhs: r`$\teal{y} =$`,
              answer: 4,
              wrong: [
                { v: 7, why: r`That's $\blue{x}$. Use $\blue{x} = \teal{y} + 3$ to find $\teal{y}$.` },
                { v: 5.5, why: r`That would be true if $\blue{x}$ and $\teal{y}$ were equal, but $\blue{x}$ is 3 more.` },
                { v: 8, why: r`Substitute: $(\teal{y} + 3) + \teal{y} = 11$. That's $2\teal{y} + 3 = 11$, so subtract 3 before dividing.` },
              ],
              explain: r`Replace $\blue{x}$ with $\teal{y} + 3$ in the second equation:
$$(\teal{y} + 3) + \teal{y} = 11 \;\Rightarrow\; 2\teal{y} = 8 \;\Rightarrow\; \teal{y} = 4.$$
Then $\blue{x} = 4 + 3 = 7$. Check: $7 + 4 = 11$. ✓`,
            },
            {
              type: 'explain',
              title: 'Another trick: combine the scales',
              body: r`Here's a different idea. Suppose
$$\begin{aligned} \blue{x} + \teal{y} &= 10 \\ \blue{x} - \teal{y} &= 2 \end{aligned}$$

Two true equations can be **added** together, left side to left side and right side to right side, because you're adding equal amounts to equal amounts.

$$(\blue{x} + \teal{y}) + (\blue{x} - \teal{y}) = 10 + 2 \;\Rightarrow\; 2\blue{x} = 12$$

The $\teal{y}$'s cancel out! So $\blue{x} = 6$, and then $\teal{y} = 4$. This is called **elimination**.`,
            },
            {
              type: 'mcq',
              title: 'Pick the move',
              body: r`$$\begin{aligned} 3a + 2b &= 16 \\ a + 2b &= 8 \end{aligned}$$`,
              prompt: r`Which single move eliminates $b$?`,
              choices: [
                { t: 'Subtract the second equation from the first', ok: true },
                { t: 'Add the two equations', why: r`Adding gives $4a + 4b = 24$. The $b$'s pile up instead of cancelling.` },
                { t: 'Multiply the second equation by 3', why: r`That makes the $a$ terms match ($3a$ and $3a$), not the $b$ terms.` },
              ],
              explain: r`Both equations have $+2b$, so subtracting cancels them:
$$(3a + 2b) - (a + 2b) = 16 - 8 \;\Rightarrow\; 2a = 8 \;\Rightarrow\; a = 4.$$
Then $4 + 2b = 8$ gives $b = 2$.`,
            },
            {
              type: 'numeric',
              title: 'Tickets',
              body: r`At a cinema, 2 adult tickets and 1 child ticket cost \$32. 1 adult ticket and 1 child ticket cost \$20.`,
              prompt: 'How much is one adult ticket?',
              unit: 'dollars',
              answer: 12,
              wrong: [
                { v: 8, why: 'That’s the child ticket. The question asks for the adult ticket.' },
                { v: 16, why: r`$32 \div 2 = 16$ ignores the child ticket in the first order.` },
              ],
              hint: 'Compare the two orders. What’s the only difference between them?',
              explain: r`The first order is exactly the second order plus one extra adult ticket. So that extra adult ticket costs $32 - 20 = \$12$, and a child ticket costs $20 - 12 = \$8$.

In algebra: $(2a + c) - (a + c) = 32 - 20$, so $a = 12$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Heads and legs',
              body: r`A farmyard has chickens (2 legs each) and cows (4 legs each). There are 20 heads and 56 legs.`,
              prompt: 'How many cows are there?',
              answer: 8,
              wrong: [
                { v: 12, why: 'That’s the number of chickens.' },
                { v: 14, why: r`$56 \div 4 = 14$ would mean every animal is a cow, but then there would be only 14 heads.` },
              ],
              hint: 'Imagine all 20 animals are chickens. How many legs would that be, and how many are missing?',
              explain: r`Let $c$ be chickens and $w$ be cows: $c + w = 20$ and $2c + 4w = 56$.

**Elimination:** double the first equation to get $2c + 2w = 40$, then subtract it from the second: $2w = 16$, so $w = 8$ cows (and 12 chickens).

**Intuition:** if all 20 animals were chickens there would be 40 legs. We have 16 extra legs, and each cow adds 2 extra, so there are $16 \div 2 = 8$ cows.

Check: $12 \cdot 2 + 8 \cdot 4 = 24 + 32 = 56$. ✓`,
            },
          ],
          recap: [
            '**Substitution:** if two things are equal, swap one for the other to remove an unknown.',
            '**Elimination:** add or subtract whole equations so that one unknown cancels.',
            'Two unknowns usually need two independent facts (equations).',
          ],
        },
        {
          id: 'lines-cross',
          title: 'Lines That Cross',
          summary: 'Solving systems by graphing',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Every equation is a line',
              body: r`An equation in two unknowns, like $x + y = 10$, has infinitely many solutions: $(0, 10)$, $(3, 7)$, $(6, 4)$, … Plot them all and you get a **straight line**.

A system of two equations asks for a pair $(x, y)$ that satisfies **both**. On a graph, that's where the two lines **cross**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the crossing',
              prompt: r`Drag the point to the solution of the system $\;y = 2x - 1\;$ and $\;y = -x + 8$.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 7, ymin: -2, ymax: 10, grid: 1, height: 320, equal: false,
                params: { x: { min: -1, max: 7, step: 0.5, value: 1, slider: false }, y: { min: -2, max: 10, step: 0.5, value: 1, slider: false } },
                curves: [{ f: (x) => 2 * x - 1, color: 'blue', width: 3 }, { f: (x) => -x + 8, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: (p) => r`$(${fix(p.x, 1)}, ${fix(p.y, 1)})$: $\;2x - 1 = ${fix(2 * p.x - 1, 0)}$ ${2 * p.x - 1 === p.y ? '✓' : '✗'}, $\;-x + 8 = ${fix(-p.x + 8, 1)}$ ${-p.x + 8 === p.y ? '✓' : '✗'}`,
                goal: (p) => p.x === 3 && p.y === 5,
                hint: 'Put the point where the blue and coral lines meet. Then check it satisfies both equations.',
                solution: { x: 3, y: 5 },
              },
              explain: r`They cross at $(3, 5)$. Algebra agrees: $2x - 1 = -x + 8$ gives $3x = 9$, so $x = 3$ and $y = 5$. The graph shows **why** there is exactly one answer.`,
            },
            {
              type: 'numeric',
              title: 'Phone plans',
              prompt: r`Plan A costs £20 a month plus 10p per minute. Plan B costs £5 a month plus 25p per minute. At how many minutes a month do they cost the same?`,
              unit: 'minutes',
              answer: 100,
              wrong: [{ v: 60, why: r`Set $20 + 0.10m = 5 + 0.25m$: then $15 = 0.15m$.` }],
              explain: r`$20 + 0.1m = 5 + 0.25m \Rightarrow 15 = 0.15m \Rightarrow m = 100$ minutes. Below 100 minutes, plan B is cheaper; above it, plan A. The **break-even point** is where the two cost lines cross.`,
            },
            {
              type: 'mcq',
              title: 'Lines that never meet',
              prompt: r`How many solutions does the system $\;y = 3x + 1\;$ and $\;y = 3x - 4\;$ have?`,
              choices: [
                { t: 'None: the lines are parallel', ok: true },
                { t: 'Exactly one', why: r`Both lines have slope 3, so they never cross. Algebra gives $3x + 1 = 3x - 4$, i.e. $1 = -4$: impossible.` },
                { t: 'Infinitely many', why: 'That happens only if the two equations describe the same line. These have different intercepts.' },
              ],
              explain: r`Same slope, different intercepts: parallel lines, no crossing, no solution. If the equations described the **same** line (e.g. $y = 3x + 1$ and $2y = 6x + 2$), every point on it would be a solution.`,
            },
            {
              type: 'numeric',
              title: 'Where they meet',
              prompt: r`Find where $y = 2x + 1$ crosses $y = -x + 7$. What is the $y$-coordinate?`,
              answer: 5,
              explain: r`Setting $2x + 1 = -x + 7$ gives $x = 2$, and then $y = 5$. The crossing point $(2, 5)$ satisfies both equations at once.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Catching up',
              prompt: r`A cyclist leaves town at 9:00 riding at 15 km/h. A car follows the same road from the same place at 10:00, at 60 km/h. How many km from town does the car catch the cyclist?`,
              unit: 'km',
              answer: 20,
              wrong: [{ v: 15, why: 'That’s how far the cyclist is when the car starts. The car still needs time to close the gap.' }, { v: 60, why: r`Set the distances equal: $15t = 60(t - 1)$, where $t$ is hours after 9:00.` }],
              explain: r`Hours after 9:00: cyclist $15t$, car $60(t - 1)$. Equal when $15t = 60t - 60$, so $t = \tfrac43$ h (10:20), at $15 \times \tfrac43 = 20$ km. Plotting distance against time, it's where the two lines cross.`,
            },
          ],
          recap: [
            'An equation in two unknowns is a line of solutions.',
            'A system’s solution is where the lines cross; parallel lines mean no solution.',
            'Break-even and catch-up problems are line crossings.',
          ],
        },
      ],
    },
    {
      title: 'Inequalities',
      summary: 'When the answer is a range.',
      lessons: [
        {
          id: 'inequalities',
          title: 'Inequalities',
          summary: 'Solving for a range of answers',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'More or less',
              body: r`An **inequality** compares two sides that aren't necessarily equal: $<$ (less than), $\le$ (at most), $>$ (more than), $\ge$ (at least). A lift that holds at most 600 kg, carrying people of 75 kg each, gives $75n \le 600$.

Instead of one answer, the solution is a whole **range**: here $n \le 8$. You solve inequalities with the same balance moves as equations, with one important twist (coming up).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Show the solution set',
              prompt: r`Solve $3x - 4 < 11$ and show the solution on the number line: set the boundary and the direction.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 11, ymin: -1, ymax: 1, grid: false, axes: false, height: 140,
                params: {
                  b: { min: 0, max: 10, step: 1, value: 2, label: 'boundary', color: 'violet' },
                  d: { min: 0, max: 1, step: 1, value: 1, label: 'direction', color: 'teal', format: (v) => (v ? 'x > boundary' : 'x < boundary') },
                },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(-0.8), x2: plot.X(10.8), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  for (let k = 0; k <= 10; k++) {
                    els.push(s('line', { x1: plot.X(k), x2: plot.X(k), y1: plot.Y(0.12), y2: plot.Y(-0.12), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                    els.push(s('text', { x: plot.X(k), y: plot.Y(-0.78), class: 'tick', 'text-anchor': 'middle', text: String(k) }));
                  }
                  const end = p.d ? 10.8 : -0.8;
                  els.push(s('line', { x1: plot.X(p.b), x2: plot.X(end), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--violet)', 'stroke-width': 7, 'stroke-linecap': 'round' }));
                  els.push(s('circle', { cx: plot.X(p.b), cy: plot.Y(0), r: 9, fill: 'var(--card)', stroke: 'var(--violet)', 'stroke-width': 3.5 }));
                  return els;
                },
                readout: (p) => r`$x ${p.d ? '>' : '<'} ${p.b}$ (open circle: ${p.b} itself is not included)`,
                goal: (p) => p.b === 5 && p.d === 0,
                hint: 'Solve it like an equation: add 4 to both sides, then divide by 3.',
                solution: { b: 5, d: 0 },
              },
              explain: r`$3x - 4 < 11 \Rightarrow 3x < 15 \Rightarrow x < 5$. The open circle shows 5 itself isn't included (since $3 \times 5 - 4 = 11$, which is not **less** than 11). For $\le$ or $\ge$, use a filled circle.`,
            },
            {
              type: 'mcq',
              title: 'The twist',
              prompt: r`Start with the true statement $2 < 5$. Multiply both sides by $-1$. Which statement is true?`,
              cols: 2,
              choices: [
                { t: r`$-2 > -5$`, ok: true },
                { t: r`$-2 < -5$`, why: r`On the number line, $-2$ is to the **right** of $-5$, so $-2$ is bigger.` },
              ],
              explain: r`Multiplying (or dividing) by a negative number **flips** the inequality: the order of numbers reverses when you reflect them through zero. So $-2x < 6$ means $x > -3$, not $x < -3$.`,
            },
            {
              type: 'numeric',
              title: 'Largest whole number',
              prompt: r`What is the largest whole number $x$ satisfying $2x + 3 \le 20$?`,
              answer: 8,
              wrong: [{ v: 8.5, why: 'That’s the boundary, but the question asks for a whole number.' }, { v: 9, why: r`$2 \times 9 + 3 = 21 > 20$.` }],
              explain: r`$2x \le 17 \Rightarrow x \le 8.5$. The largest whole number is 8: check $2 \times 8 + 3 = 19 \le 20$ ✓.`,
            },
            {
              type: 'numeric',
              title: 'Flip it',
              prompt: r`Solve $5 - 2x > 13$. The answer is $x < k$ or $x > k$; what is $k$?`,
              lhs: r`$k =$`,
              answer: -4,
              wrong: [{ v: 4, why: r`$-2x > 8$ gives $x < -4$ (flipped, and negative).` }, { v: 9, why: r`Subtract 5 first: $-2x > 8$.` }],
              explain: r`$-2x > 8$. Dividing by $-2$ flips the sign: $x < -4$. Check with $x = -5$: $5 + 10 = 15 > 13$ ✓.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A double inequality',
              prompt: r`How many integers $x$ satisfy $-3 < 2x + 1 \le 9$?`,
              answer: 6,
              wrong: [{ v: 5, why: r`Solve all three parts at once: $-4 < 2x \le 8$, so $-2 < x \le 4$. Include 4, exclude −2.` }, { v: 7, why: r`$-2$ is excluded (strict inequality): $2(-2) + 1 = -3$, which is not greater than $-3$.` }],
              explain: r`Subtract 1 everywhere: $-4 < 2x \le 8$. Divide by 2: $-2 < x \le 4$. The integers in that range are $-1, 0, 1, 2, 3, 4$: **six** of them.`,
            },
          ],
          recap: [
            'Inequalities are solved like equations; the solution is a range.',
            'Multiplying or dividing by a negative number flips the inequality.',
            'On a number line: open circle for < and >, filled for ≤ and ≥.',
          ],
        },
      ],
    },
  ],
};
