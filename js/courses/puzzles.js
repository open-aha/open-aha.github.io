const r = String.raw;

// chords between n points on a circle (irregular spacing, so no three chords meet at one point)
const ANG = [90, 152, 207, 268, 333, 25];
const regions = (n) => {
  const c = (a, b) => { let x = 1; for (let i = 1; i <= b; i++) x = (x * (a - b + i)) / i; return b > a ? 0 : x; };
  return c(n, 4) + c(n, 2) + 1;
};

export default {
  id: 'puzzles',
  subject: 'math',
  title: 'Problem Solving',
  level: 'Foundational',
  cover: 'puzzles',
  tagline: 'Work backwards, spot invariants, distrust patterns, draw pictures, cross rivers and weigh coins.',
  description: r`Great problem solvers aren't magicians: they use a handful of powerful strategies. Practise working backwards, finding quantities that never change, testing patterns before trusting them, and turning words into pictures, on puzzles that look hard until you see the trick. Then tackle classic river crossings and coin-weighing puzzles.`,
  chapters: [
    {
      title: 'Strategies',
      summary: 'Tools for any puzzle.',
      lessons: [
        {
          id: 'backwards',
          title: 'Work Backwards',
          summary: 'Start from the end',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Puzzle',
              title: 'Lily pads',
              prompt: r`A patch of lily pads doubles in size every day. After 30 days it covers the whole pond. On which day did it cover **half** the pond?`,
              unit: 'day',
              answer: 29,
              wrong: [{ v: 15, why: 'Halfway in time isn’t halfway in size. Doubling each day means the last day does the most growing.' }, { v: 28, why: 'On day 28 it covers a quarter. One more doubling gives half.' }],
              explain: r`Work backwards from the end: full on day 30 means half on day **29**, a quarter on day 28, and so on. Thinking forwards ("when is it half?") is hard. Thinking backwards ("what was it the day before?") is easy.`,
            },
            {
              type: 'numeric',
              title: 'The frog in the well',
              prompt: r`A frog at the bottom of a 10 m well climbs 3 m each day but slips back 2 m each night. On which day does it get out?`,
              unit: 'day',
              answer: 8,
              wrong: [{ v: 10, why: r`Net progress is 1 m per day, but on the last day the frog climbs out before it can slip back.` }, { v: 7, why: r`At the start of day 7 the frog is at 6 m; climbing 3 m reaches 9 m, not 10. It slips back to 7 m.` }],
              explain: r`Work backwards from the escape: on its final day the frog climbs 3 m and gets out, so it must start that day at 7 m or higher. It gains 1 m per full day-and-night, so it reaches 7 m at the end of day 7. On **day 8** it climbs from 7 m to 10 m and escapes.`,
            },
            {
              type: 'order',
              title: 'Two jugs',
              body: r`You have a 3-litre jug and a 5-litre jug, a tap and a sink, and need **exactly 4 litres**. Working backwards: 4 litres in the big jug means pouring 1 litre out of a full 5-litre jug, which needs the small jug to hold exactly 2 litres first…`,
              prompt: 'Put the steps in order.',
              items: [
                'Fill the 5-litre jug.',
                'Pour from the 5-litre jug into the 3-litre jug until it’s full (2 litres remain in the big jug).',
                'Empty the 3-litre jug, then pour the 2 litres into it.',
                'Fill the 5-litre jug again.',
                'Top up the 3-litre jug from the big jug (only 1 litre fits), leaving exactly 4 litres.',
              ],
              explain: r`Working backwards from "4 = 5 − 1" told us we needed a 3-litre jug holding 2 litres, and "2 = 5 − 3" showed how to get that. (Bruce Willis solves this very puzzle in the film *Die Hard with a Vengeance*.)`,
            },
            {
              type: 'numeric',
              title: 'The half-full jar',
              prompt: r`A colony of bacteria doubles every minute. A jar is full after 60 minutes. When was it half full?`,
              unit: 'minutes',
              answer: 59,
              wrong: [{ v: 30, why: r`Half the time isn’t half the amount: it doubles every minute.` }],
              explain: r`Work backwards: one doubling before full, at **59 minutes**. At 55 minutes the jar was only 3% full: exponential growth looks harmless until the very end.`,
            },
            {
              type: 'interactive',
              title: 'Out of the well',
              body: r`A frog at the bottom of a 10 m well climbs 3 m each day and slips back 2 m each night. Step through the days to find when it gets out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 11, grid: false, height: 280, axes: { xlabel: 'day', ylabel: 'height (m)', xticks: 1, yticks: 2 },
                params: { d: { min: 1, max: 10, step: 1, value: 3, label: 'day', color: 'coral' } },
                extra: ({ plot, p, s }) => { let h = 0, d = `M${plot.X(0)} ${plot.Y(0)}`; let out = 0; for (let k = 1; k <= p.d; k++) { h += 3; d += `L${plot.X(k - 0.5)} ${plot.Y(Math.min(h, 10.5))}`; if (h >= 10) { out = k; break; } h -= 2; d += `L${plot.X(k)} ${plot.Y(h)}`; } return [s('line', { x1: plot.X(0), x2: plot.X(10), y1: plot.Y(10), y2: plot.Y(10), stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }), s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 })]; },
                readout: (p) => { let h = 0; for (let k = 1; k <= p.d; k++) { h += 3; if (h >= 10) return `day ${k}: reaches ${h} m during the day: **out!**`; h -= 2; } return `end of day ${p.d}: ${h} m up`; },
                goal: (p) => p.d === 8,
                hint: 'Work backwards: on its last day the frog needs to start within 3 m of the top.',
                solution: { d: 8 },
              },
              explain: r`It gains 1 m per full day, so after 7 days it starts at 7 m, and on day 8 it climbs to 10 m and escapes before slipping. The tempting answer, 10 days, forgets that the last climb doesn't slip back.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The last coin wins',
              prompt: r`There are 21 coins. Two players take turns removing 1, 2 or 3 coins. Whoever takes the **last** coin wins. How many coins should the first player take to guarantee a win?`,
              unit: 'coins',
              answer: 1,
              wrong: [{ v: 3, why: 'Taking 3 leaves 18. Your opponent can take 2 and leave you 16, a multiple of 4. Work backwards from the end.' }, { v: 2, why: 'Taking 2 leaves 19. Your opponent takes 3 and leaves 16, a multiple of 4. You want to leave the multiple of 4.' }],
              explain: r`Work backwards. If you face 4 coins, you lose: whatever you take, your opponent takes the rest. So you want to **leave** your opponent 4, and before that 8, 12, 16, 20: any multiple of 4. From 21, take **1** to leave 20. After each of their moves, take enough to make the total for the round 4.`,
            },
          ],
          recap: [
            'When the end state is known, work backwards from it.',
            'Doubling processes: the day before full is half full.',
            'In take-away games, find the losing positions and steer your opponent into them.',
          ],
        },
        {
          id: 'invariants',
          title: 'Invariants & Parity',
          summary: 'What never changes?',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'The mutilated chessboard',
              body: r`Remove two **opposite** corners from a chessboard, leaving 62 squares. Can you cover the rest exactly with 31 dominoes, each covering 2 neighbouring squares?`,
              widget: {
                kind: 'figure', w: 360, h: 360, maxWidth: 340, label: 'Chessboard with two opposite corners removed',
                draw: ({ s }) => {
                  const els = [];
                  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
                    const gone = (i === 0 && j === 0) || (i === 7 && j === 7);
                    els.push(s('rect', { x: 20 + 40 * j, y: 20 + 40 * i, width: 40, height: 40, class: gone ? 'fl-card' : (i + j) % 2 ? 'fl-blue-soft' : 'fl-ink', stroke: gone ? 'var(--line-2)' : 'none', 'stroke-dasharray': gone ? '4 4' : null, opacity: gone ? 1 : (i + j) % 2 ? 1 : 0.8 }));
                    if (gone) els.push(s('path', { d: `M${28 + 40 * j} ${28 + 40 * i} l24 24 M${52 + 40 * j} ${28 + 40 * i} l-24 24`, stroke: 'var(--coral)', 'stroke-width': 3 }));
                  }
                  els.push(s('rect', { x: 60, y: 20, width: 80, height: 40, rx: 8, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }));
                  return els;
                },
              },
              after: r`People can try for hours. The trick is to find something that a domino **can't change**.`,
            },
            {
              type: 'mcq',
              title: 'Count the colours',
              prompt: r`Every domino covers one dark square and one light square. The two removed corners are the **same colour**. What follows?`,
              choices: [
                { t: 'It’s impossible: there are 32 squares of one colour but only 30 of the other', ok: true },
                { t: 'It’s possible, but hard to find', why: 'Each domino covers one of each colour, so 31 dominoes cover 31 of each. The board has 30 and 32.' },
                { t: 'It depends on how you place the dominoes', why: 'Every placement covers equal numbers of each colour, so no arrangement can work.' },
              ],
              explain: r`31 dominoes always cover exactly 31 dark and 31 light squares. But the board now has 30 of one colour and 32 of the other, so a perfect covering is **impossible**. The balance of colours is an **invariant**: something every move preserves. One idea settles a question that brute force could never finish.`,
            },
            {
              type: 'mcq',
              title: 'Handshakes',
              prompt: r`At a party, some guests shake hands. Is it possible that **exactly 5** people shook an **odd** number of hands?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: 'Add up everyone’s handshake counts. Each handshake contributes 2, so the total is even, and an even total can’t have an odd number of odd terms.' },
              ],
              explain: r`Each handshake involves two people, so the sum of everyone's counts is **even** (twice the number of handshakes). A sum of numbers is even only if it contains an **even** number of odd terms. So the number of people with an odd count is always even: never 5. This is the **handshake lemma** from graph theory.`,
            },
            {
              type: 'mcq',
              title: 'The blackboard game',
              prompt: r`The numbers 1, 2, 3, …, 10 are written on a board. A move erases any two numbers $a$ and $b$ and writes $a + b$ instead. After nine moves one number is left. What could it be?`,
              choices: [
                { t: 'Always 55, whatever moves you make', ok: true },
                { t: 'It depends on the order of the moves', why: 'Each move replaces a and b by a + b, so the total on the board never changes.' },
                { t: 'Always 10', why: 'Add up the starting numbers: the total is preserved by every move.' },
              ],
              explain: r`The **sum** of the numbers is an invariant: replacing $a$ and $b$ with $a + b$ leaves it unchanged. It starts at $1 + 2 + \dots + 10 = 55$, so 55 is the only possible final number. Change the move to $|a - b|$ and the sum's **parity** becomes the invariant instead.`,
            },
            {
              type: 'mcq',
              title: 'Sam Loyd’s puzzle',
              prompt: r`In the 15-puzzle, the tiles 14 and 15 start swapped and everything else is in order. Can you slide the tiles back to the solved position?`,
              choices: [
                { t: r`No: every move preserves a parity invariant, and a single swap changes it`, ok: true },
                { t: r`Yes, with enough moves`, why: r`Loyd offered a \$1,000 prize because he knew it was impossible.` },
                { t: r`Only if you start from the bottom row`, why: r`The parity argument rules it out from any approach.` },
              ],
              explain: r`Each slide swaps the blank with a tile; combined with the blank’s position, this keeps a certain parity fixed. A single swap of two tiles flips it, so exactly half of all arrangements are reachable.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Flipping cups',
              prompt: r`Seven cups stand upright. A move flips exactly **two** cups. Can you make all seven upside down?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: 'Track the number of upside-down cups. Each move changes it by −2, 0 or +2, so it always stays even. 7 is odd.' },
              ],
              explain: r`Each move changes the number of upside-down cups by $+2$, $0$ or $-2$. It starts at 0 (even), so it stays **even** forever, and it can never reach 7. Parity (odd versus even) is one of the most useful invariants of all.`,
            },
          ],
          recap: [
            'An invariant is a quantity that no move can change.',
            'If the start and goal differ in an invariant, the goal is impossible.',
            'Parity and colourings are the classic invariants.',
          ],
        },
      ],
    },
    {
      title: 'Seeing Clearly',
      summary: 'Patterns and pictures.',
      lessons: [
        {
          id: 'patterns',
          title: 'Patterns Can Lie',
          summary: 'Test before you trust',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Points on a circle',
              body: r`Put points on a circle and join every pair with a straight line. Count the regions inside the circle. Add points one at a time.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 380,
                params: { n: { min: 1, max: 5, step: 1, value: 3, label: 'points', color: 'blue', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const pts = ANG.slice(0, p.n).map((a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]);
                  const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--ink)', 'stroke-width': 3 })];
                  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) els.push(s('line', { x1: plot.X(pts[i][0]), y1: plot.Y(pts[i][1]), x2: plot.X(pts[j][0]), y2: plot.Y(pts[j][1]), stroke: 'var(--violet)', 'stroke-width': 2.5 }));
                  for (const [x, y] of pts) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 8, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2.5 }));
                  return els;
                },
                readout: (p) => `${p.n} point${p.n > 1 ? 's' : ''} → **${regions(p.n)}** region${regions(p.n) > 1 ? 's' : ''}`,
              },
              after: r`1, 2, 4, 8, 16… The regions seem to double each time.`,
            },
            {
              type: 'mcq',
              title: 'Six points',
              prompt: r`Following the pattern 1, 2, 4, 8, 16, how many regions would you predict for 6 points?`,
              cols: 2,
              choices: [
                { t: '32', ok: true },
                { t: '31', why: 'That’s the true answer, as we’re about to see. But the question asked what the pattern predicts!' },
                { t: '24', why: 'The pattern so far doubles each time: 16 × 2.' },
              ],
              explain: r`The pattern predicts 32. Now let's actually count.`,
            },
            {
              type: 'explain',
              title: 'The surprise',
              body: r`With 6 points (placed so that no three lines meet at one point), there are only **31** regions, not 32. With 7 points there are 57, nowhere near 64. The real formula is
$$\binom{n}{4} + \binom{n}{2} + 1$$
which happens to match $2^{n-1}$ for $n = 1$ to $5$, and then breaks.

::: key
A pattern that fits the first few cases is a **guess**, not a proof. To be sure, you need a reason why it must continue.
:::`,
            },
            {
              type: 'numeric',
              title: 'Handshakes',
              prompt: r`At a meeting of 10 people, everyone shakes hands with everyone else exactly once. How many handshakes are there?`,
              answer: 45,
              wrong: [{ v: 90, why: r`Each person shakes 9 hands: $10 \times 9 = 90$, but that counts every handshake twice.` }, { v: 100, why: 'Nobody shakes their own hand, and each handshake involves two people.' }, { v: 55, why: r`$1 + 2 + \dots + 10 = 55$ counts one too many: the last person has already shaken everyone's hand.` }],
              explain: r`Each of the 10 people shakes 9 hands, giving $10 \times 9 = 90$. Every handshake is counted twice (once by each person), so there are $90 / 2 = 45$. In general, $\dfrac{n(n - 1)}{2}$. Unlike the circle pattern, here we have a **reason**, so the formula is guaranteed.`,
            },
            {
              type: 'numeric',
              title: 'The next term',
              prompt: r`The circle-and-chords sequence goes $1, 2, 4, 8, 16, 31$ for 1 to 6 points. The formula is $\binom{n}{4} + \binom{n}{2} + 1$. How many regions are there for 7 points?`,
              answer: 57,
              explain: r`$\binom74 + \binom72 + 1 = 35 + 21 + 1 = 57$. Nowhere near 64: the doubling pattern was a coincidence of small numbers.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A famous near miss',
              prompt: r`$n^2 + n + 41$ is prime for $n = 0, 1, 2, \dots, 39$ (Euler noticed this). Is it prime for **every** whole number $n$?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`Try $n = 40$: $1600 + 40 + 41 = 1681 = 41^2$.` },
              ],
              explain: r`At $n = 40$: $40^2 + 40 + 41 = 1681 = 41 \times 41$. Forty successes in a row, then failure. (In fact, no non-constant polynomial produces only primes.) Patterns, however impressive, need proof.`,
            },
          ],
          recap: [
            'Points on a circle: 1, 2, 4, 8, 16, then 31. Patterns can break.',
            r`Handshakes among $n$ people: $\frac{n(n-1)}{2}$, backed by a reason.`,
            'A pattern is a conjecture until it is proved.',
          ],
        },
        {
          id: 'pictures',
          title: 'Draw a Picture',
          summary: 'Turn words into diagrams',
          icon: 'pencil',
          steps: [
            {
              type: 'numeric',
              kicker: 'Puzzle',
              title: 'Average speed',
              prompt: r`You drive to a town at 30 km/h and come straight back along the same road at 60 km/h. What's your average speed for the whole trip?`,
              unit: 'km/h',
              answer: 40,
              wrong: [{ v: 45, why: r`You spend **twice as long** at 30 km/h as at 60 km/h, so the slow part counts more. Pick a distance and work it out.` }],
              explain: r`Pick a convenient distance, say 60 km each way. Going takes 2 h; returning takes 1 h. Total: 120 km in 3 h $= 40$ km/h. Averaging the speeds (45) is wrong because you spend more **time** at the slow speed.`,
            },
            {
              type: 'numeric',
              title: 'The fly and the trains',
              prompt: r`Two trains 100 km apart head toward each other, each at 50 km/h. A fly starts at one train and zigzags between them at 75 km/h until the trains meet. How far does the fly travel in total?`,
              unit: 'km',
              answer: 75,
              wrong: [{ v: 100, why: 'The fly flies for as long as the trains take to meet, at 75 km/h.' }, { v: 150, why: 'The trains meet after 1 hour, so the fly flies for 1 hour.' }],
              explain: r`Don't sum the infinite zigzags! The trains close the gap at $50 + 50 = 100$ km/h, so they meet after **1 hour**. The fly flies the whole time at 75 km/h: **75 km**. (The legend says John von Neumann answered instantly, and when asked if he knew the trick, said he had summed the infinite series.)`,
            },
            {
              type: 'numeric',
              title: 'A rope around the world',
              prompt: r`A rope is tied snugly around the equator (40,000 km). You want to raise it 1 m above the ground all the way round. How many **metres** of extra rope do you need? (2 decimal places.)`,
              unit: 'm',
              answer: 2 * Math.PI,
              tol: 0.006,
              wrong: [{ v: 1, why: r`The radius grows by 1 m, so the circumference grows by $2\pi \times 1$.` }, { v: 40000, why: 'Far less than you’d think: draw the two circles and compare their circumferences.' }],
              explain: r`Circumference $= 2\pi r$. Raising the rope adds 1 m to the radius, so the length grows by $2\pi \times 1 \approx 6.28$ m, whatever the size of the planet: the same for a tennis ball as for the Earth. A picture plus a formula beats intuition here.`,
            },
            {
              type: 'numeric',
              title: 'Overlapping hands',
              prompt: r`Starting at 12:00, how many times do a clock’s hour and minute hands overlap in the next 12 hours (counting 12:00 once)?`,
              unit: 'times',
              answer: 11,
              wrong: [{ v: 12, why: r`Between 11:00 and 12:00 the hands meet only at 12:00, which starts the next cycle.` }],
              explain: r`The minute hand gains one full lap on the hour hand every $\frac{12}{11}$ hours, so they meet **11** times in 12 hours (about every 65.5 minutes), not 12: there’s no overlap between 11 and 12 o’clock except at 12 itself.`,
            },
            {
              type: 'interactive',
              title: 'Same place, same time',
              body: r`A monk climbs a mountain path from 6 am to 6 pm one day, and descends the same path from 6 am to 6 pm the next. The graphs show his height on each day. Drag the marker to the moment he was at the same height at the same time on both days.`,
              widget: {
                kind: 'graph', xmin: 6, xmax: 18, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'time of day', ylabel: 'height', xticks: 2, yticks: 2, xfmt: (v) => `${v}:00` },
                params: { t: { min: 6, max: 18, step: 0.05, value: 9, slider: false } },
                curves: [{ f: (t) => { const u = (t - 6) / 12; return Math.min(1, u + 0.12 * Math.sin(3 * Math.PI * u)); }, color: 'blue', width: 3 }, { f: (t) => { const u = (t - 6) / 12; return 1 - Math.pow(u, 0.6); }, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.t, y: () => 0.02, drag: { x: 't' }, color: 'violet' }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.t), x2: plot.X(p.t), y1: plot.Y(0), y2: plot.Y(1.05), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '5 5' })],
                readout: (p) => { const u = (p.t - 6) / 12, up = Math.min(1, u + 0.12 * Math.sin(3 * Math.PI * u)), dn = 1 - Math.pow(u, 0.6); return `climbing: ${(100 * up).toFixed(0)}% of the way up · descending: ${(100 * dn).toFixed(0)}%`; },
                goal: (p) => { const u = (p.t - 6) / 12, up = Math.min(1, u + 0.12 * Math.sin(3 * Math.PI * u)), dn = 1 - Math.pow(u, 0.6); return Math.abs(up - dn) < 0.02; },
                hint: 'Look for where the two curves cross.',
                solution: { t: 11.7 },
              },
              explain: r`The two curves must cross: the ascent starts at the bottom and ends at the top, the descent does the opposite. Picture two monks walking on the same day, one up and one down: they must meet. The crossing proves such a moment exists, however the monk varies his pace.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The monk on the mountain',
              prompt: r`A monk walks up a mountain path from 6 am to 6 pm, stopping and starting at random. The next day he walks down the same path from 6 am to 6 pm. Must there be a time of day at which he is at the **same spot** on both days?`,
              choices: [
                { t: 'Yes, always', ok: true },
                { t: 'Only if he walks at a steady pace', why: 'Picture both journeys on the same day. Pauses and speed changes don’t matter.' },
                { t: 'No', why: 'Imagine two monks: one walking up and one walking down on the same day. Must they meet?' },
              ],
              explain: r`Draw a picture: imagine **two** monks on the same day, one going up from the bottom and one coming down from the top. On a single path they must meet somewhere, and at that moment they're at the same place at the same time of day. No calculation needed, just the right picture.`,
            },
          ],
          recap: [
            'Average speed is total distance ÷ total time, not the average of the speeds.',
            'Look for the simple quantity (here, time) instead of summing complicated pieces.',
            'A good picture, like two monks on one day, can make a hard problem obvious.',
          ],
        },
      ],
    },
    {
      title: 'Classic Puzzles',
      summary: 'Crossings and weighings.',
      lessons: [
        {
          id: 'crossings',
          title: 'River Crossings',
          summary: 'Searching through states',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'The farmer’s problem',
              body: r`A farmer must cross a river with a fox, a goose and a bag of grain. The boat holds the farmer and **one** item. Left alone, the fox eats the goose, and the goose eats the grain. How can everything cross safely?

This puzzle appears in a collection attributed to Alcuin of York, around 800 AD. The key strategy is to think of **states** (who is on which bank) and the moves between them.`,
            },
            {
              type: 'mcq',
              title: 'The first trip',
              prompt: 'What must the farmer take on the first crossing?',
              cols: 3,
              choices: [
                { t: 'The goose', ok: true },
                { t: 'The fox', why: 'Then the goose eats the grain on the starting bank.' },
                { t: 'The grain', why: 'Then the fox eats the goose on the starting bank.' },
              ],
              explain: r`The fox and grain are safe together, so the goose goes first. The goose is the troublemaker: it conflicts with both of the others.`,
            },
            {
              type: 'order',
              title: 'The full solution',
              prompt: 'Put the crossings in order.',
              items: [
                'Take the goose across.',
                'Return alone.',
                'Take the fox across.',
                'Bring the goose back.',
                'Take the grain across.',
                'Return alone.',
                'Take the goose across.',
              ],
              explain: r`The surprising move is bringing the goose **back**: sometimes progress requires a step backwards. Seven crossings is the minimum. (Taking the grain on trip 3 and the fox on trip 5 works too.)`,
            },
            {
              type: 'numeric',
              title: 'Counting states',
              prompt: r`Each of the farmer, fox, goose and grain can be on either bank. How many possible arrangements (states) are there in total, safe or not?`,
              answer: 16,
              wrong: [{ v: 8, why: 'All four can be on either side: 2 × 2 × 2 × 2.' }, { v: 4, why: 'Each of the four has 2 choices, and the choices multiply.' }],
              explain: r`$2^4 = 16$ states. Removing the unsafe ones leaves a small map of states; solving the puzzle means finding a path from "all on the left" to "all on the right". Computers solve much bigger puzzles by searching such state maps.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Who carries the torch?',
              body: r`Four people must cross a narrow bridge at night with one torch. They take 1, 2, 5 and 10 minutes; at most two cross at a time, at the slower one's pace, and someone must bring the torch back. Compare two strategies.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 6, grid: false, height: 240, axes: { xlabel: 'minutes', xticks: 2, yticks: 10 },
                params: { st: { min: 0, max: 1, step: 1, value: 0, label: 'strategy', color: 'violet', format: (v) => (v ? 'pair the slow ones' : 'fastest escorts everyone') } },
                extra: ({ plot, p, s }) => { const plan = p.st ? [['1+2 →', 2], ['← 1', 1], ['5+10 →', 10], ['← 2', 2], ['1+2 →', 2]] : [['1+10 →', 10], ['← 1', 1], ['1+5 →', 5], ['← 1', 1], ['1+2 →', 2]]; let t = 0; return plan.flatMap(([lab, d], i) => { const el = [s('rect', { x: plot.X(t), y: plot.Y(5.4 - i), width: plot.X(d) - plot.X(0), height: plot.Y(0) - plot.Y(0.7), rx: 3, class: lab.includes('→') ? 'fl-blue' : 'fl-coral' }), s('text', { x: plot.X(t + d) + 6, y: plot.Y(5.05 - i) + 4, class: 'tick', text: lab })]; t += d; return el; }); },
                readout: (p) => (p.st ? 'total: **17 minutes**' : 'total: **19 minutes**'),
              },
              after: r`Escorting everyone with the fastest walker takes 19 minutes. The trick is to send the two slowest **together**, so the 10-minute walker's slowness hides the 5-minute walker's: 17 minutes. Working out the order backwards from "the slow pair must cross once, together" finds it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The bridge at night',
              prompt: r`Four people must cross a narrow bridge at night with one torch. At most two cross at once (they need the torch, which must be carried back). They take 1, 2, 5 and 10 minutes, and a pair moves at the slower person's pace. What's the shortest total time?`,
              unit: 'min',
              answer: 17,
              wrong: [{ v: 19, why: 'Having the 1-minute person escort everyone gives 19. Try sending the two slowest across together.' }, { v: 18, why: 'Close! The trick is for 5 and 10 to cross together, with a fast person waiting on the far side to bring the torch back.' }],
              explain: r`1 & 2 cross (2), 1 returns (1), 5 & 10 cross (10), 2 returns (2), 1 & 2 cross (2): total **17**. The insight: let the two slowest travel **together** so you only pay for the 10 once.`,
            },
          ],
          recap: [
            'Think in states (who is where) and moves between them.',
            'Sometimes the solution needs a step that seems backwards.',
            'Pair up the slowest or most troublesome items cleverly.',
          ],
        },
        {
          id: 'weighing',
          title: 'Weighing Coins',
          summary: 'Three outcomes per weighing',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A balance has three answers',
              body: r`You have 9 identical-looking coins; one is a fake that's slightly **lighter**. With a two-pan balance, how few weighings guarantee finding it?

The secret: a weighing has **three** possible outcomes (left heavier, right heavier, balanced), not two. Use all three.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Split the coins',
              prompt: r`Choose how many coins to put on **each** pan for the first weighing, so that whatever happens, at most 3 suspects remain.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 3, grid: false, axes: false, height: 170,
                params: { k: { min: 1, max: 4, step: 1, value: 4, label: 'coins per pan', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const off = 9 - 2 * p.k, els = [];
                  const coin = (x, y, c) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 11, class: `fl-${c}`, stroke: 'var(--ink)', 'stroke-width': 1.5 });
                  for (let i = 0; i < p.k; i++) els.push(coin(0.8 + i * 0.75, 2.1, 'blue'), coin(4.8 + i * 0.75, 2.1, 'coral'));
                  for (let i = 0; i < off; i++) els.push(coin(8.8 + (i % 4) * 0.75, 2.1 - Math.floor(i / 4) * 0.8, 'amber'));
                  els.push(s('text', { x: plot.X(1.9), y: plot.Y(0.5), class: 'tick', 'text-anchor': 'middle', text: 'left pan' }), s('text', { x: plot.X(5.9), y: plot.Y(0.5), class: 'tick', 'text-anchor': 'middle', text: 'right pan' }), s('text', { x: plot.X(10), y: plot.Y(0.5), class: 'tick', 'text-anchor': 'middle', text: 'off the scale' }));
                  return els;
                },
                readout: (p) => `worst case after one weighing: **${Math.max(p.k, 9 - 2 * p.k)}** suspects`,
                goal: (p) => Math.max(p.k, 9 - 2 * p.k) <= 3,
                hint: 'If the pans balance, the fake is off the scale; if not, it’s on the lighter pan. Make all three groups equal.',
                solution: { k: 3 },
              },
              explain: r`3 against 3, with 3 off the scale. If one pan rises, the fake is among its 3 coins; if they balance, it's among the 3 set aside. Repeat with those 3 (1 against 1): **two weighings** find the fake among 9.`,
            },
            {
              type: 'numeric',
              title: 'How many coins?',
              prompt: r`Each weighing divides the suspects into three groups. What's the largest number of coins among which you can always find one light fake with **three** weighings?`,
              answer: 27,
              wrong: [{ v: 8, why: r`That's $2^3$. A balance has three outcomes, so it's $3^3$.` }, { v: 9, why: 'That’s two weighings. Each extra weighing triples the number.' }],
              explain: r`$3^3 = 27$. Each weighing can at most cut the suspects to a third, so $n$ weighings handle up to $3^n$ coins, and splitting into equal thirds achieves it.`,
            },
            {
              type: 'numeric',
              title: 'Four weighings',
              prompt: r`One coin among many is heavier. Each weighing on a balance has three outcomes. What is the largest number of coins from which you can always find the heavy one in 4 weighings?`,
              unit: 'coins',
              answer: 81,
              wrong: [{ v: 16, why: r`Each weighing has **three** outcomes, not two: $3^4$.` }],
              explain: r`$3^4 = 81$: each weighing splits the candidates into three groups (left heavy, right heavy, balance) and keeps one. In general $n$ weighings handle $3^n$ coins.`,
            },
            {
              type: 'numeric',
              title: 'The classic twelve',
              prompt: r`One of 12 coins is fake, and you don’t know whether it is heavier or lighter. What is the smallest number of weighings that always finds it and tells you which?`,
              answer: 3,
              explain: r`There are $12 \times 2 = 24$ possibilities and three weighings give $3^3 = 27$ outcomes, so 3 might be enough, and a clever scheme shows it is. (With 13 coins it can’t always be done in 3.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Heavier or lighter?',
              prompt: r`Now there are 12 coins and the fake might be heavier **or** lighter. You must find it and say which. Three weighings give $3^3 = 27$ outcomes. Why is this (just) enough?`,
              choices: [
                { t: 'There are 24 possibilities (12 coins × heavier/lighter), fewer than 27', ok: true },
                { t: 'Because 12 is less than 27', why: 'Close, but each coin could be heavy or light: 24 possibilities must fit into 27 outcomes.' },
                { t: 'It isn’t enough; you need four weighings', why: 'Three suffice: 24 cases fit within 27 outcomes, and clever weighings achieve it.' },
              ],
              explain: r`Each fake could be heavy or light: $12 \times 2 = 24$ possibilities, and three weighings give 27 outcomes. That doesn't build the strategy, but it shows one could exist. (One does, and it's a famous puzzle; with 13 coins and no extra genuine coin it becomes impossible.) Counting outcomes is the idea behind **information theory**.`,
            },
          ],
          recap: [
            'A balance has three outcomes, so split suspects into three equal groups.',
            r`$n$ weighings can find one light fake among up to $3^n$ coins.`,
            'Counting possibilities against outcomes shows what’s possible.',
          ],
        },
        {
          id: 'josephus',
          title: 'The Josephus Problem',
          summary: 'Who is left standing?',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Every second person',
              body: r`$n$ people stand in a circle, numbered $1$ to $n$. Starting from person 1, every **second** person is removed: 2 goes, then 4, then 6, and so on round and round the shrinking circle, until one person is left. Where should you stand to be the survivor?

The puzzle is named after the historian Flavius Josephus, who according to legend used a version of it to survive a siege in the first century.`,
            },
            {
              type: 'numeric',
              title: 'Five people',
              prompt: r`With 5 people, who survives? (Remove 2, then 4, then carry on round the circle.)`,
              answer: 3,
              wrong: [{ v: 5, why: 'After 2 and 4 go, the next removal skips 5 and takes 1, then skips 3 and takes 5.' }, { v: 1, why: 'After 2 and 4, person 5 is skipped and person 1 is removed.' }],
              explain: r`Remove 2, 4, then (skipping 5) 1, then (skipping 3) 5. Person **3** survives.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Watch the circle shrink',
              prompt: r`Choose the number of people and step through the removals (numbers show the order people leave). Find the **largest** circle of at most 40 people in which person **1** survives.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 360, pad: 6,
                params: { n: { min: 2, max: 40, step: 1, value: 10, label: 'people', color: 'violet' }, k: { min: 0, max: 39, step: 1, value: 39, label: 'removals shown', color: 'ink' } },
                extra: ({ plot, p, s }) => { const alive = Array.from({ length: p.n }, (_, i) => i), order = new Array(p.n).fill(0); let idx = 0, step = 0; while (alive.length > 1) { idx = (idx + 1) % alive.length; order[alive[idx]] = ++step; alive.splice(idx, 1); idx = idx % alive.length; } const out = []; for (let i = 0; i < p.n; i++) { const a = Math.PI / 2 - (2 * Math.PI * i) / p.n, x = Math.cos(a), y = Math.sin(a), gone = order[i] && order[i] <= p.k, win = !order[i] && p.k >= p.n - 1; out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: p.n > 24 ? 9 : 13, class: win ? 'fl-teal' : gone ? 'fl-muted' : 'fl-violet', stroke: 'var(--line-2)', opacity: gone ? 0.35 : 1 }), s('text', { x: plot.X(x), y: plot.Y(y) + 4, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(${p.n > 24 ? 9 : 11}px * var(--fs, 1)), var(--fmin, 0px))`, fill: gone ? 'var(--ink-2)' : 'var(--card)', text: String(i + 1) })); if (gone) out.push(s('text', { x: plot.X(0.78 * x), y: plot.Y(0.78 * y) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(9px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--coral)', text: String(order[i]) })); } return out; },
                readout: (p) => { let J = 0; for (let m = 2; m <= p.n; m++) J = (J + 2) % m; return `${p.n} people · survivor: **person ${J + 1}**${Math.min(p.k, p.n - 1) < p.n - 1 ? ` · ${Math.min(p.k, p.n - 1)} of ${p.n - 1} removals shown` : ''}`; },
                goal: (p) => p.n === 32,
                hint: 'Try 2, 4, 8 and 16 people. Who survives?',
                solution: { n: 32, k: 39 },
              },
              explain: r`Person 1 survives exactly when $n$ is a **power of 2**: 2, 4, 8, 16, 32. With $2^m$ people, the first lap removes all the even numbers and leaves $2^{m-1}$ people with person 1 about to start again, the same situation at half the size.`,
            },
            {
              type: 'mcq',
              title: 'Spot the pattern',
              prompt: r`The survivors for $n = 1, 2, 3, \dots, 9$ are $1, 1, 3, 1, 3, 5, 7, 1, 3$. Which description fits?`,
              choices: [
                { t: 'At each power of 2 the survivor resets to 1, then goes up by 2 each time', ok: true },
                { t: 'The survivor is always an odd number close to n/2', why: 'They are always odd, but for n = 7 the survivor is 7, not about 3.5.' },
                { t: 'The survivor is the largest odd number up to n', why: 'That works for n = 7 but fails for n = 9 (survivor 3).' },
              ],
              explain: r`Write $n = 2^m + L$ with $0 \le L < 2^m$. After $L$ people have been removed, $2^m$ remain and the next person to start is number $2L + 1$, who then survives, as we saw. So $J(n) = 2L + 1$.`,
            },
            {
              type: 'numeric',
              title: 'Forty-one people',
              prompt: r`In the legend, Josephus was in a circle of 41. Using $n = 2^m + L$ and $J(n) = 2L + 1$, which position survives (with every second person removed)?`,
              answer: 19,
              wrong: [{ v: 9, why: r`$41 = 32 + 9$, so $L = 9$, and the survivor is $2L + 1$.` }],
              explain: r`$41 = 32 + 9$, so $J(41) = 2 \times 9 + 1 = 19$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A hundred people',
              prompt: r`With 100 people in the circle, who survives?`,
              answer: 73,
              wrong: [{ v: 37, why: r`$100 = 64 + 36$, so $L = 36$; the survivor is $2L + 1$, not $L + 1$.` }, { v: 72, why: 'The survivor is always odd: 2L + 1.' }],
              explain: r`$100 = 64 + 36$, so $J(100) = 2 \times 36 + 1 = 73$. A neat binary trick gives the same answer: write $n$ in binary ($1100100$) and move the leading 1 to the end ($1001001 = 73$).`,
            },
          ],
          recap: [
            'Removing every second person, person 1 survives when n is a power of 2.',
            'Write n = 2ᵐ + L; the survivor is 2L + 1.',
            'In binary: move the leading 1 of n to the end.',
          ],
        },
      ],
    },
  ],
};
