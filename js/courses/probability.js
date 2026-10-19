import { fix } from '../lib/svg.js';
const r = String.raw;
const die = () => Math.floor(Math.random() * 6);
const coin = () => Math.random() < 0.5;
// draw two without replacement from 3 red, 2 blue: 0 = both red, 1 = one each, 2 = both blue
const drawTwo = () => {
  const bag = ['R', 'R', 'R', 'B', 'B'];
  const a = bag.splice(Math.floor(Math.random() * 5), 1)[0], b = bag[Math.floor(Math.random() * 4)];
  return a === 'R' && b === 'R' ? 0 : a === 'B' && b === 'B' ? 2 : 1;
};
const bothRed = (r, b) => (r * (r - 1)) / ((r + b) * (r + b - 1));
// birthday problem
const pMatch = (n) => {
  let q = 1;
  for (let i = 0; i < n; i++) q *= (365 - i) / 365;
  return 1 - q;
};
// longest run (of either face) in n coin flips
const longestRun = (n) => {
  let best = 1, cur = 1, prev = coin();
  for (let i = 1; i < n; i++) {
    const c = coin();
    cur = c === prev ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = c;
  }
  return best;
};

export default {
  id: 'probability',
  subject: 'math',
  title: 'Probability',
  level: 'Intermediate',
  cover: 'probability',
  tagline: 'Dice, coins, trees, birthdays, streaks, game shows and medical tests: reasoning about chance.',
  description: r`Run thousands of experiments in seconds to build intuition for chance. Count outcomes, combine probabilities, compute expected values, and crack famous puzzles: the Monty Hall problem, the false-positive paradox, the birthday problem and the streakiness of random sequences.`,
  chapters: [
    {
      title: 'Chance',
      summary: 'Counting outcomes, and what happens in the long run.',
      lessons: [
        {
          id: 'counting',
          title: 'Counting Outcomes',
          summary: 'Favourable over total',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Two coins',
              prompt: 'You flip two fair coins. What is the probability that both land heads?',
              cols: 2,
              choices: [
                { t: r`$\tfrac14$`, ok: true },
                { t: r`$\tfrac13$`, why: r`It's tempting to list three outcomes: two heads, two tails, one of each. But "one of each" can happen in two ways (HT and TH), so the outcomes aren't equally likely.` },
                { t: r`$\tfrac12$`, why: r`That's the chance for **one** coin to land heads. Both have to.` },
              ],
              explain: r`The four equally likely outcomes are HH, HT, TH, TT. Only one of them is two heads: $\tfrac14$.`,
            },
            {
              type: 'explain',
              title: 'Check it by experiment',
              body: r`Flip two coins thousands of times. The dashed lines show the predicted probabilities: $\tfrac14$, $\tfrac12$, $\tfrac14$.`,
              widget: {
                kind: 'sampler', outcomes: ['two heads', 'one of each', 'two tails'], probs: [0.25, 0.5, 0.25],
                trial: () => { const a = coin(), b = coin(); return a && b ? 0 : !a && !b ? 2 : 1; },
                batches: [1, 10, 100, 1000], oneLabel: 'Flip',
              },
              after: r`"One of each" happens about twice as often, because there are two ways to get it.

::: key
When all outcomes are equally likely, $P(\text{event}) = \dfrac{\text{favourable outcomes}}{\text{total outcomes}}$.
:::`,
            },
            {
              type: 'numeric',
              title: 'Roll a die',
              prompt: 'You roll a fair six-sided die. What is the probability of rolling a number greater than 4? (A fraction like 1/2 is fine.)',
              answer: 1 / 3,
              tol: 0.005,
              wrong: [
                { v: 1 / 2, tol: 0.005, why: 'Greater than 4 means 5 or 6. That’s 2 numbers out of 6.' },
                { v: 1 / 6, tol: 0.005, why: 'Both 5 and 6 are greater than 4.' },
              ],
              explain: r`The favourable outcomes are 5 and 6: 2 out of 6, so $\tfrac26 = \tfrac13$.`,
            },
            {
              type: 'explain',
              title: 'Two dice',
              body: r`Roll two dice and add them. There are $6 \times 6 = 36$ equally likely pairs. A total of 7 can be made 6 ways (1+6, 2+5, 3+4, 4+3, 5+2, 6+1), but 2 only one way (1+1). Roll and see:`,
              widget: {
                kind: 'sampler', outcomes: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                probs: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((k) => k / 36),
                trial: () => die() + die(), batches: [1, 10, 100, 1000], oneLabel: 'Roll', color: 'coral', ymax: 0.25,
              },
            },
            {
              type: 'numeric',
              title: 'Lucky seven',
              prompt: 'What is the probability that two dice add up to 7?',
              answer: 1 / 6,
              tol: 0.003,
              wrong: [
                { v: 1 / 11, tol: 0.003, why: 'There are 11 possible totals (2–12), but they aren’t equally likely. Count the 36 pairs.' },
                { v: 1 / 36, tol: 0.003, why: 'That’s the chance of one specific pair. Seven can be made in 6 different ways.' },
              ],
              explain: r`6 favourable pairs out of 36: $\tfrac{6}{36} = \tfrac16$. Seven is the most likely total.`,
            },
            {
              type: 'mcq',
              title: 'Six or eight?',
              prompt: 'Which is more likely with two dice: a total of 6, or a total of 8?',
              choices: [
                { t: 'They are equally likely', ok: true },
                { t: 'A total of 6', why: r`6 can be made 5 ways (1+5, 2+4, 3+3, 4+2, 5+1), and so can 8 (2+6, 3+5, 4+4, 5+3, 6+2).` },
                { t: 'A total of 8', why: 'Count the ways: both totals can be made in 5 ways.' },
              ],
              explain: r`Both have 5 ways out of 36. The distribution is symmetric around 7.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'High roller',
              prompt: 'What is the probability that two dice total 10 or more?',
              answer: 1 / 6,
              tol: 0.003,
              wrong: [{ v: 1 / 12, tol: 0.003, why: r`Count every way: a total of 10 has 3 ways, 11 has 2, and 12 has 1.` }],
              explain: r`Ten: 3 ways (4+6, 5+5, 6+4). Eleven: 2 ways. Twelve: 1 way. That's $3 + 2 + 1 = 6$ out of 36, which is $\tfrac16$.`,
            },
          ],
          recap: [
            r`For equally likely outcomes, $P = \frac{\text{favourable}}{\text{total}}$.`,
            'Make sure the outcomes you count really are equally likely (HT and TH are different outcomes).',
            'With two dice, 7 is the most likely total (6 ways out of 36).',
          ],
        },
        {
          id: 'large-numbers',
          title: 'The Long Run',
          summary: 'The law of large numbers',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Due for tails?',
              body: r`A fair coin has just landed heads 5 times in a row.`,
              prompt: 'What is the probability that the next flip is heads?',
              cols: 2,
              choices: [
                { t: '50%', ok: true },
                { t: 'Less than 50%: tails is “due”', why: 'The coin has no memory. Each flip is independent of the ones before.' },
                { t: 'More than 50%: heads is on a streak', why: 'A fair coin has no streaks to keep up. Each flip is a fresh 50–50.' },
              ],
              explain: r`Each flip is independent. The coin doesn't know what happened before. Believing that tails is "due" is the famous **gambler's fallacy**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch it settle',
              body: r`Flip a coin many times. The lower chart tracks the **proportion** of heads so far. Watch how it behaves as the number of flips grows.`,
              widget: {
                kind: 'sampler', outcomes: ['heads', 'tails'], probs: [0.5, 0.5], trial: () => (coin() ? 0 : 1),
                batches: [1, 10, 100, 1000], running: 0, runningLabel: 'heads', oneLabel: 'Flip', ymax: 1, height: 180,
              },
              after: r`Early on the proportion swings wildly. Over thousands of flips it settles close to 50%. That's the **law of large numbers**: the long-run proportion approaches the probability.`,
            },
            {
              type: 'mcq',
              title: 'Small samples',
              prompt: 'Which is more likely with a fair coin: at least 7 heads in 10 flips, or at least 70 heads in 100 flips?',
              choices: [
                { t: 'At least 7 heads in 10 flips', ok: true },
                { t: 'At least 70 heads in 100 flips', why: 'Large samples stay much closer to 50%. Getting 70% heads in 100 flips is extremely unlikely.' },
                { t: 'They are equally likely: both are 70%', why: 'The proportion is the same, but small samples wander far more than large ones.' },
              ],
              explain: r`At least 7 heads in 10 flips happens about 17% of the time. At least 70 in 100 happens about 0.004% of the time. Small samples are noisy, and large samples average the noise out.`,
            },
            {
              type: 'numeric',
              title: 'Expected count',
              prompt: 'You roll a fair die 600 times. About how many sixes should you expect?',
              answer: 100,
              wrong: [{ v: 6, why: r`Multiply the number of rolls by the probability: $600 \times \tfrac16$.` }],
              explain: r`$600 \times \tfrac16 = 100$. You won't get exactly 100 every time: typical results range from about 85 to 115.`,
            },
            {
              type: 'numeric',
              title: 'How much wobble?',
              prompt: r`In 100 fair coin tosses, the proportion of heads has standard deviation $\sqrt{\frac{0.5 \times 0.5}{100}}$. What is that? (Decimal.)`,
              answer: 0.05,
              tol: 0.0001,
              explain: r`$\sqrt{0.0025} = 0.05$: typically the proportion lands within about 5 percentage points of a half. With 10,000 tosses it shrinks to 0.005: the law of large numbers in action.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Two hospitals',
              body: r`A large hospital has about 45 births a day. A small one has about 15. On average, about 50% of babies are boys, but the exact share varies from day to day.`,
              prompt: 'Over a year, which hospital records more days on which more than 60% of the babies born are boys?',
              choices: [
                { t: 'The small hospital', ok: true },
                { t: 'The large hospital', why: 'More births per day means the daily share stays closer to 50%.' },
                { t: 'About the same', why: 'Small samples vary more, so extreme days are more common in the small hospital.' },
              ],
              explain: r`Smaller samples swing further from the average, so the small hospital has many more extreme days. When psychologists Daniel Kahneman and Amos Tversky posed this question, most people answered "about the same", missing the effect of sample size.`,
            },
          ],
          recap: [
            'Independent events have no memory. Believing otherwise is the gambler’s fallacy.',
            'Law of large numbers: over many trials, proportions approach the true probability.',
            'Small samples vary much more than large ones.',
          ],
        },
      ],
    },
    {
      title: 'Combining Probabilities',
      summary: 'And, or, not, and expected value.',
      lessons: [
        {
          id: 'and-or-not',
          title: 'And, Or, Not',
          summary: 'Multiply, add, subtract from 1',
          icon: 'sigma',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Double six',
              prompt: 'You roll two dice. What is the probability that both show a six?',
              answer: 1 / 36,
              tol: 0.001,
              wrong: [
                { v: 1 / 3, tol: 0.005, why: r`$\tfrac16 + \tfrac16 = \tfrac13$, but "both" means multiply, not add.` },
                { v: 1 / 12, tol: 0.001, why: r`Multiply the two chances: $\tfrac16 \times \tfrac16$.` },
              ],
              explain: r`The dice are independent: $\tfrac16 \times \tfrac16 = \tfrac{1}{36}$.`,
            },
            {
              type: 'explain',
              title: 'Three rules',
              body: r`- **And (independent events): multiply.** $P(A \text{ and } B) = P(A) \times P(B)$.
- **Not: subtract from 1.** $P(\text{not } A) = 1 - P(A)$.
- **Or (events that can't both happen): add.** $P(A \text{ or } B) = P(A) + P(B)$.

"At least one" questions are usually easiest using **not**: work out the chance of *none*, then subtract it from 1.`,
            },
            {
              type: 'numeric',
              title: 'The gambler’s question',
              body: r`In the 1650s, the gambler Chevalier de Méré asked Blaise Pascal about his bets. One of them: is it a good bet that at least one six appears in four rolls of a die?`,
              prompt: 'What is the probability of at least one six in four rolls? (Give a decimal.)',
              answer: 1 - (5 / 6) ** 4,
              tol: 0.005,
              wrong: [
                { v: 4 / 6, tol: 0.005, why: r`Adding $\tfrac16$ four times overcounts the cases with more than one six. (Six rolls would give $\tfrac66 = 1$, which can't be right!)` },
                { v: (5 / 6) ** 4, tol: 0.005, why: r`That's the chance of **no** sixes. Subtract it from 1.` },
              ],
              hint: r`First find the chance of no sixes at all: $(\tfrac56)^4$.`,
              explain: r`$P(\text{no six in 4 rolls}) = \left(\tfrac56\right)^4 = \tfrac{625}{1296} \approx 0.482$. So $P(\text{at least one}) = 1 - 0.482 \approx 0.518$, a little better than even. Pascal's letters with Pierre de Fermat about questions like this helped found probability theory.`,
            },
            {
              type: 'explain',
              title: 'Test it',
              body: r`Roll four dice at a time and record whether at least one six appeared.`,
              widget: {
                kind: 'sampler', outcomes: ['no six', 'at least one six'], probs: [(5 / 6) ** 4, 1 - (5 / 6) ** 4],
                trial: () => ([0, 1, 2, 3].some(() => die() === 5) ? 1 : 0), batches: [1, 10, 100, 1000], oneLabel: 'Roll 4 dice', color: 'teal', ymax: 0.8,
              },
            },
            {
              type: 'numeric',
              title: 'Hearts or kings',
              body: r`When two events **can** happen together, adding counts the overlap twice, so subtract it once: $P(A \text{ or } B) = P(A) + P(B) - P(A \text{ and } B)$.`,
              prompt: 'You draw one card from a standard 52-card deck. What is the probability that it is a heart or a king? (Give a decimal or a fraction.)',
              answer: 16 / 52,
              tol: 0.003,
              wrong: [{ v: 17 / 52, tol: 0.003, why: r`The king of hearts was counted twice: once as a heart and once as a king.` }],
              explain: r`$\tfrac{13}{52} + \tfrac{4}{52} - \tfrac{1}{52} = \tfrac{16}{52} = \tfrac{4}{13} \approx 0.31$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Birthday surprise',
              prompt: 'How many people need to be in a room for there to be a better than 50% chance that two of them share a birthday? (Ignore leap years.)',
              cols: 2,
              choices: [
                { t: '23', ok: true },
                { t: '183', why: 'That’s about half of 365, but every pair of people is a chance for a match, and the number of pairs grows fast.' },
                { t: '365', why: 'With 366 people a match is certain. A 50% chance needs far fewer.' },
                { t: '50', why: 'With 50 people the chance is already about 97%.' },
              ],
              explain: r`Use **not**: the chance that all $n$ birthdays are different is $\frac{365}{365} \cdot \frac{364}{365} \cdot \frac{363}{365} \cdots$. At $n = 23$, that drops below $\tfrac12$ (to about 0.493), so a match is about 50.7% likely. With 23 people there are 253 different pairs, which is a lot of chances.`,
            },
          ],
          recap: [
            'And (independent events): multiply. Not: 1 minus.',
            'Or: add, then subtract any overlap.',
            '“At least one” = 1 − P(none).',
          ],
        },
        {
          id: 'trees',
          title: 'Trees & Dependence',
          summary: 'When one draw changes the next',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Tree diagrams',
              body: r`A bag holds 3 red and 2 blue marbles. Draw one, keep it out, then draw another. A **tree diagram** lays out every path:
- First draw: red with probability $\frac35$, blue with $\frac25$.
- If the first was red, the bag now holds 2 red and 2 blue, so the second is red with probability $\frac24$.

**Multiply along a branch** to get the probability of that whole path. **Add across branches** when several paths lead to the outcome you want.`,
            },
            {
              type: 'numeric',
              title: 'Both red',
              prompt: r`Drawing two marbles without replacement from 3 red and 2 blue, what's the probability that both are red?`,
              answer: 0.3,
              wrong: [{ v: 0.36, why: r`That's with replacement, $\left(\frac35\right)^2$. After one red is removed, only 2 of the 4 left are red.` }],
              explain: r`$\frac35 \times \frac24 = \frac{6}{20} = 0.3$.`,
            },
            {
              type: 'numeric',
              title: 'One of each',
              prompt: r`What's the probability of getting one red and one blue (in either order)?`,
              answer: 0.6,
              wrong: [{ v: 0.3, why: r`Red then blue is $\frac35 \cdot \frac24 = 0.3$, but blue then red is another path.` }],
              explain: r`Red then blue: $\frac35 \cdot \frac24 = 0.3$. Blue then red: $\frac25 \cdot \frac34 = 0.3$. Add the two branches: $0.6$. With both blue at $\frac25 \cdot \frac14 = 0.1$, all three outcomes add up to 1. ✓`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Draw and check',
              body: r`Draw two marbles at a time, many times over, and compare with the tree.`,
              widget: {
                kind: 'sampler', outcomes: ['both red', 'one of each', 'both blue'], probs: [0.3, 0.6, 0.1], trial: drawTwo,
                batches: [1, 10, 100, 1000], oneLabel: 'Draw two', color: 'coral', ymax: 0.8,
              },
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The sock drawer',
              prompt: r`A drawer holds red and black socks. You pull out two at random. Choose how many of each so that the chance both are red is **exactly** $\frac12$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, axes: false, height: 120,
                params: {
                  r: { min: 1, max: 20, step: 1, value: 2, label: 'red', color: 'coral' },
                  b: { min: 1, max: 20, step: 1, value: 2, label: 'black', color: 'ink' },
                },
                extra: ({ plot, p, s }) => {
                  const n = p.r + p.b, w = Math.min(28, (plot.X(1) - plot.X(0) - 20) / n);
                  const els = [];
                  for (let i = 0; i < n; i++) els.push(s('rect', { x: plot.X(0.5) - (n * w) / 2 + i * w + 2, y: plot.Y(0.75), width: w - 4, height: plot.Y(0.25) - plot.Y(0.75), rx: 4, class: i < p.r ? 'fl-coral' : 'fl-ink' }));
                  return els;
                },
                readout: (p) => r`$P(\text{both red}) = \dfrac{${p.r}}{${p.r + p.b}} \times \dfrac{${p.r - 1}}{${p.r + p.b - 1}} = ${bothRed(p.r, p.b).toFixed(4)}$`,
                goal: (p) => Math.abs(bothRed(p.r, p.b) - 0.5) < 1e-9,
                hint: 'Try a small drawer: with only one black sock, how many red ones do you need?',
                solution: { r: 3, b: 1 },
              },
              explain: r`3 red and 1 black: $\frac34 \times \frac23 = \frac12$. The next solution is 15 red and 6 black: $\frac{15}{21} \times \frac{14}{20} = \frac{210}{420} = \frac12$. Finding all solutions leads to a famous equation from number theory (a Pell equation).`,
            },
            {
              type: 'mcq',
              title: 'Independent?',
              prompt: r`Two cards are dealt from a shuffled deck. Are the events "first card is an ace" and "second card is an ace" independent?`,
              choices: [
                { t: 'No: knowing the first is an ace lowers the chance the second is (3/51 instead of 4/51)', ok: true },
                { t: 'Yes: each card is random', why: 'Each card is random, but they’re dealt from the same deck. The first changes what’s left.' },
                { t: 'Yes, because both have probability 1/13', why: 'Each has probability 1/13 on its own, but independence is about how they behave together.' },
              ],
              explain: r`Events are **independent** when knowing one doesn't change the probability of the other: $P(A \text{ and } B) = P(A)P(B)$. Here $P(\text{both aces}) = \frac{4}{52} \cdot \frac{3}{51} = \frac{1}{221}$, not $\frac{1}{169}$. Drawing **with** replacement would make them independent.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'At least one ace',
              prompt: r`Two cards are dealt from a shuffled 52-card deck. What's the probability that at least one is an ace? (4 decimal places.)`,
              answer: 1 - (48 / 52) * (47 / 51),
              tol: 0.0003,
              wrong: [{ v: 8 / 52, tol: 0.0005, why: r`Adding $\frac{4}{52} + \frac{4}{52}$ double-counts hands with two aces. Use the complement: $1 - P(\text{no aces})$.` }, { v: 1 - (48 / 52) ** 2, tol: 0.0005, why: 'That treats the cards as independent. After one non-ace, 47 of the remaining 51 are non-aces.' }],
              explain: r`$P(\text{no aces}) = \frac{48}{52} \times \frac{47}{51} \approx 0.8507$, so $P(\text{at least one}) \approx 0.1493$. The complement trick plus a tree branch: two tools that handle most probability problems.`,
            },
          ],
          recap: [
            'Multiply along branches of a tree; add across branches.',
            'Without replacement, each draw changes the next probabilities.',
            r`Independent events satisfy $P(A \text{ and } B) = P(A)\,P(B)$.`,
          ],
        },
        {
          id: 'expected-value',
          title: 'Expected Value',
          summary: 'The long-run average',
          icon: 'trophy',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Average roll',
              prompt: 'If you roll a fair die many times, what will the average of the results be?',
              answer: 3.5,
              wrong: [
                { v: 3, why: r`Add up 1 through 6 (21) and divide by 6.` },
                { v: 4, why: r`$\frac{1+2+3+4+5+6}{6} = 3.5$.` },
              ],
              explain: r`$\frac{1 + 2 + 3 + 4 + 5 + 6}{6} = \frac{21}{6} = 3.5$. You can never actually roll 3.5, but it's the long-run average.`,
            },
            {
              type: 'explain',
              title: 'Expected value',
              body: r`The **expected value** of a random quantity is the average you'd get over many repeats. Multiply each possible value by its probability, then add:
$$E = \sum (\text{value}) \times (\text{probability})$$
For a die: $1 \cdot \tfrac16 + 2 \cdot \tfrac16 + \cdots + 6 \cdot \tfrac16 = 3.5$.`,
            },
            {
              type: 'numeric',
              title: 'A fair game?',
              body: r`You pay \$1 to play. You roll a die: if it's a six, you get \$5 back (so you're \$4 ahead). Otherwise you lose your \$1.`,
              prompt: 'What is your expected profit per game, in dollars? (It may be negative.)',
              answer: -1 / 6,
              tol: 0.01,
              wrong: [
                { v: 4 / 6, tol: 0.01, why: 'Don’t forget the 5 out of 6 times you lose your dollar.' },
                { v: 0, why: r`$\tfrac16 \times 4 - \tfrac56 \times 1 \ne 0$.` },
              ],
              explain: r`$E = \tfrac16 (+4) + \tfrac56 (-1) = \tfrac46 - \tfrac56 = -\tfrac16 \approx -\$0.17$. On average you lose about 17 cents every game.`,
            },
            {
              type: 'mcq',
              title: 'Play all night?',
              prompt: 'Should you play this game 1000 times?',
              choices: [
                { t: r`No: you expect to lose about \$167`, ok: true },
                { t: 'Yes: you’ll win about 167 times', why: r`You'll win about 167 times (+\$668) but lose about 833 times (−\$833).` },
                { t: 'It doesn’t matter, it’s all luck', why: 'Over 1000 games, the law of large numbers makes the average very predictable.' },
              ],
              explain: r`$1000 \times (-\tfrac16) \approx -\$167$. Casino games are designed with a negative expected value for the player. Over many plays, the house reliably wins.`,
            },
            {
              type: 'numeric',
              title: 'Lottery',
              body: r`A \$2 lottery ticket gives a 1 in 10,000,000 chance of winning \$10,000,000, and nothing otherwise.`,
              prompt: 'What are the expected winnings per ticket, in dollars (before subtracting the ticket price)?',
              answer: 1,
              wrong: [
                { v: -1, why: r`That's the expected *profit*, after the \$2 price. The question asks for the winnings alone.` },
                { v: 10000000, why: r`Multiply the prize by its tiny probability: $10{,}000{,}000 \times \frac{1}{10{,}000{,}000}$.` },
              ],
              explain: r`$\$10{,}000{,}000 \times \frac{1}{10{,}000{,}000} = \$1$. You pay \$2 for an expected \$1, an expected loss of \$1 per ticket.`,
            },
            {
              type: 'explain',
              title: 'Beyond the average',
              body: r`Expected value isn't everything. Insurance has a negative expected value for the customer (the insurer has to make a profit), yet buying it can be wise. It swaps a small, certain cost for protection against a rare, ruinous loss.

Good decisions weigh both the average **and** the risk.`,
            },
            {
              type: 'interactive',
              title: 'A fair price',
              body: r`You pay to roll a die and win (in pounds) the number shown. Set the entry price that makes the game **fair** (expected profit zero).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 7, ymin: -3, ymax: 3, grid: false, height: 240, axes: { xlabel: 'face', ylabel: 'profit (£)', xticks: 1, yticks: 1 },
                params: { c: { min: 1, max: 6, step: 0.5, value: 3, label: 'entry price', color: 'coral', format: (v) => `£${v.toFixed(2)}` } },
                extra: ({ plot, p, s }) => [1, 2, 3, 4, 5, 6].map((f) => { const v = f - p.c; return s('rect', { x: plot.X(f - 0.35), y: plot.Y(Math.max(0, v)), width: plot.X(0.7) - plot.X(0), height: Math.abs(plot.Y(0) - plot.Y(v)), class: v >= 0 ? 'fl-teal' : 'fl-coral' }); }),
                readout: (p) => `expected profit per game: **£${(3.5 - p.c).toFixed(2)}**`,
                goal: (p) => Math.abs(p.c - 3.5) < 1e-9,
                hint: 'The average face value is (1 + 2 + … + 6) ÷ 6.',
                solution: { c: 3.5 },
              },
              explain: r`The fair price is **£3.50**, the expected winnings. Any casino game is priced above its expected payout, so although individual players win, the house collects the difference on average, and averages are what thousands of games deliver.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Waiting for a six',
              prompt: 'On average, how many rolls of a die does it take to get your first six?',
              answer: 6,
              wrong: [{ v: 3.5, why: r`That's the average value of one roll. Here you're counting rolls until the first six.` }],
              explain: r`If something has probability $p$ per try, the expected number of tries until it first happens is $\frac{1}{p}$. Here that's $\frac{1}{1/6} = 6$ rolls.`,
            },
          ],
          recap: [
            'Expected value = sum of (value × probability): the long-run average.',
            'Casino games and lotteries have negative expected value for players.',
            'Expected value ignores risk, which matters too (that’s why insurance makes sense).',
          ],
        },
      ],
    },
    {
      title: 'Famous Puzzles',
      summary: 'Where intuition fails.',
      lessons: [
        {
          id: 'monty-hall',
          title: 'Monty Hall',
          summary: 'Should you switch?',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Let’s make a deal',
              body: r`A game show has three doors. Behind one is a car, and behind the other two are goats. You pick door 1. The host, **who knows where the car is**, opens door 3 to reveal a goat. Then he offers you the chance to switch to door 2.`,
              prompt: 'What should you do?',
              choices: [
                { t: 'Switch: it wins more often', ok: true },
                { t: 'It doesn’t matter: it’s 50–50 now', why: 'That’s what almost everyone thinks, including many mathematicians! Play the game on the next screen and see what happens.' },
                { t: 'Stay: your first pick is luckier', why: 'Your first pick has no special luck. Play the game on the next screen and see what happens.' },
              ],
              explain: r`Switching wins **2 out of 3** times. Hard to believe? Test it.`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Play it',
              body: r`Play a few rounds by hand, then use the simulation buttons to play hundreds of games with each strategy. Play at least **10 games** to continue.`,
              widget: { kind: 'monty', needGames: 10 },
              gate: true,
              after: r`Staying wins about $\tfrac13$ of the time. Switching wins about $\tfrac23$.`,
            },
            {
              type: 'explain',
              title: 'Why switching works',
              body: r`Your first pick is right only $\tfrac13$ of the time. That never changes, because the host can always open a goat door whatever you chose.

- If your first pick was the **car** ($\tfrac13$ of the time), switching loses.
- If your first pick was a **goat** ($\tfrac23$ of the time), the host must open the *other* goat, so the remaining door is the car. Switching wins.

The host's choice isn't random: he's forced to avoid the car. His action hands you information.`,
            },
            {
              type: 'mcq',
              title: '100 doors',
              body: r`Now imagine 100 doors, with one car. You pick door 1. The host, who knows where the car is, opens 98 of the other doors, all goats, leaving door 1 and door 57 closed.`,
              prompt: 'What is the probability that the car is behind door 57?',
              cols: 2,
              choices: [
                { t: r`$\tfrac{99}{100}$`, ok: true },
                { t: r`$\tfrac12$`, why: r`Your first pick had a $\tfrac{1}{100}$ chance and still does. The host carefully avoided the car while opening 98 doors.` },
                { t: r`$\tfrac{1}{100}$`, why: r`That's the chance for your **original** door.` },
              ],
              explain: r`Your door had a $\tfrac{1}{100}$ chance at the start, and nothing the host did changed that. The other $\tfrac{99}{100}$ is now concentrated on the one door he deliberately left closed. With 100 doors, switching feels obvious.`,
            },
            {
              type: 'numeric',
              title: 'Four doors',
              prompt: r`With 4 doors (one car), you pick one, and the host (who knows where the car is) opens one of the others with a goat. If you then switch to one of the two remaining closed doors at random, what is your chance of winning? (Decimal.)`,
              answer: 3 / 8,
              tol: 0.001,
              explain: r`Your first pick is wrong with probability $\frac34$; then the car is behind one of the 2 other closed doors, so switching wins with probability $\frac34 \times \frac12 = \frac38 = 0.375$, better than staying ($\frac14$).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A forgetful host',
              body: r`Change the story: the host **doesn't know** where the car is. He opens one of the other two doors at random, and it happens to show a goat.`,
              prompt: 'Now should you switch?',
              choices: [
                { t: 'It doesn’t matter: now it really is 50–50', ok: true },
                { t: 'Switch: it still wins 2/3 of the time', why: 'The 2/3 depended on the host avoiding the car deliberately. A random reveal that happens to show a goat carries different information.' },
                { t: 'Stay: it wins 2/3 of the time', why: 'Neither door has an advantage in this version.' },
              ],
              explain: r`If the host picks at random, a third of the time he'd reveal the car (ruining the game). In the games where he happens to reveal a goat, your door and the other door are equally likely to hide the car: $\tfrac12$ each. What the host **knows** changes the answer.

When Marilyn vos Savant explained the original puzzle correctly in her magazine column in 1990, she received thousands of letters, many from people with PhDs, insisting she was wrong.`,
            },
          ],
          recap: [
            'In the Monty Hall game, switching wins 2/3 of the time and staying wins 1/3.',
            'The host’s knowledge matters: a forced reveal carries information, a random one doesn’t.',
            'Simulations are a powerful check when intuition and calculation disagree.',
          ],
        },
        {
          id: 'bayes',
          title: 'Testing Positive',
          summary: 'Conditional probability and Bayes',
          icon: 'eye',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Given that…',
              prompt: 'You draw a card and are told it’s red. What is the probability that it’s a heart?',
              answer: 0.5,
              wrong: [{ v: 0.25, why: 'Knowing it’s red rules out the black cards. Of the 26 red cards, 13 are hearts.' }],
              explain: r`Being told it's red shrinks the possibilities to 26 red cards, and 13 of those are hearts: $\tfrac{13}{26} = \tfrac12$. This is a **conditional probability**: $P(\text{heart} \mid \text{red}) = \tfrac12$.`,
            },
            {
              type: 'mcq',
              title: 'The test',
              body: r`A disease affects **2%** of people. A test for it:
- correctly detects **90%** of people who have the disease, and
- wrongly gives a positive result for **10%** of people who don't.

You test positive.`,
              prompt: 'Roughly how likely is it that you have the disease?',
              choices: [
                { t: 'About 16%', ok: true },
                { t: 'About 90%', why: r`That's the chance of testing positive **if** you're sick. The question is the reverse: the chance you're sick **if** you test positive.` },
                { t: 'About 10%', why: 'Close in size, but it comes from a different calculation. Picture 1000 people and count the positives.' },
                { t: 'About 2%', why: 'Testing positive does raise the chance above the starting 2%.' },
              ],
              explain: r`Surprisingly low! Picture 1000 people on the next screen.`,
            },
            {
              type: 'explain',
              title: 'Count real people',
              body: r`Imagine **1000** people take the test:`,
              widget: {
                kind: 'figure', w: 600, h: 260, label: 'Natural frequency tree for a medical test',
                draw: ({ s }) => {
                  const box = (x, y, w, txt, cls) => [s('rect', { x: x - w / 2, y: y - 20, width: w, height: 40, rx: 10, class: cls }), s('text', { x, y: y + 6, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))${/soft|surface/.test(cls) ? '' : ';fill:#1f2328'}`, text: txt })]; // dark text on the strong colours, in both themes
                  const line = (x1, y1, x2, y2) => s('line', { x1, y1, x2, y2, stroke: 'var(--ink-3)', 'stroke-width': 2 });
                  return [
                    line(300, 50, 150, 120), line(300, 50, 450, 120),
                    line(150, 140, 80, 210), line(150, 140, 220, 210), line(450, 140, 380, 210), line(450, 140, 520, 210),
                    ...box(300, 36, 150, '1000 people', 'fl-surface'),
                    ...box(150, 130, 130, '20 sick', 'fl-coral-soft'),
                    ...box(450, 130, 140, '980 healthy', 'fl-teal-soft'),
                    ...box(80, 222, 120, '18 positive', 'fl-coral'),
                    ...box(220, 222, 120, '2 negative', 'fl-surface'),
                    ...box(380, 222, 120, '98 positive', 'fl-amber'),
                    ...box(520, 222, 130, '882 negative', 'fl-surface'),
                  ];
                },
              },
              after: r`There are $18 + 98 = 116$ positive tests, but only 18 of them come from sick people:
$$P(\text{sick} \mid \text{positive}) = \frac{18}{116} \approx 15.5\%.$$
The disease is rare, so the 10% false positives among the many healthy people outnumber the true positives.`,
            },
            {
              type: 'numeric',
              title: 'A common disease',
              body: r`Same test (90% detection, 10% false positives), but now the disease affects **10%** of people.`,
              prompt: 'If you test positive, what is the probability (in %) that you are sick?',
              unit: '%',
              answer: 50,
              tol: 0.5,
              wrong: [
                { v: 90, tol: 0.5, why: r`Count again with 1000 people: 100 sick (90 positive), 900 healthy (90 positive).` },
                { v: 15.5, tol: 0.5, why: 'That was for the rare disease. Redo the count with 10% sick.' },
              ],
              explain: r`Out of 1000 people: 100 sick, of whom 90 test positive. 900 healthy, of whom 90 test positive. So $\frac{90}{90 + 90} = 50\%$. The same test means much more when the disease is common. The starting rate (the **base rate**) matters enormously.`,
            },
            {
              type: 'explain',
              title: 'Bayes’ theorem',
              body: r`The counting method is captured by **Bayes' theorem**:
$$P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}$$
For the rare disease: $\frac{0.9 \times 0.02}{0.116} \approx 0.155$, where $P(B) = 0.9 \times 0.02 + 0.1 \times 0.98 = 0.116$ is the overall chance of testing positive.

Bayes' theorem tells you how to **update** a belief when new evidence arrives. It's used everywhere from spam filters to medical diagnosis.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Test again',
              body: r`Back to the rare disease (2%). After your first positive test, your chance of being sick is about 15.5%. You take a second, independent test with the same accuracy, and it's also positive.`,
              prompt: 'About how likely is it now that you are sick?',
              choices: [
                { t: 'About 62%', ok: true },
                { t: 'About 31%', why: r`Doubling isn't how evidence combines. Use 15.5% as the new starting rate and update again.` },
                { t: 'About 99%', why: 'Two positives are strong evidence, but false positives are still common enough that it’s far from certain.' },
              ],
              explain: r`Start from 15.5% and apply Bayes again: $\frac{0.9 \times 0.155}{0.9 \times 0.155 + 0.1 \times 0.845} = \frac{0.1395}{0.224} \approx 62\%$. Each piece of evidence updates the last result. That's why doctors often confirm a positive screening result with a second test.`,
            },
          ],
          recap: [
            r`$P(A \mid B)$ is the probability of $A$ when you know $B$ happened. It is not the same as $P(B \mid A)$.`,
            'For rare conditions, even accurate tests give many false positives. Always consider the base rate.',
            'Bayes’ theorem updates probabilities as evidence arrives.',
          ],
        },
        {
          id: 'birthday',
          title: 'The Birthday Problem',
          summary: 'Why coincidences are common',
          icon: 'star',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A class of 30',
              prompt: r`In a class of 30 people, roughly how likely is it that at least two share a birthday?`,
              cols: 2,
              choices: [
                { t: 'About 70%', ok: true },
                { t: 'About 8%', why: 'That’s 30 out of 365, but there are many pairs of people who could match.' },
                { t: 'About 50%', why: 'Closer, but it’s higher: the 50% point is reached at just 23 people.' },
                { t: 'Under 1%', why: 'Far too low: shared birthdays are surprisingly common.' },
              ],
              explain: r`About 71%. Most people guess far lower. Let's see why.`,
            },
            {
              type: 'explain',
              title: 'Count the misses',
              body: r`It's easier to find the chance that **no one** shares (ignoring 29 February and assuming birthdays are spread evenly). Line people up: the second must avoid the first's birthday ($\frac{364}{365}$), the third must avoid both ($\frac{363}{365}$), and so on:
$$P(\text{all different}) = \frac{365}{365} \times \frac{364}{365} \times \frac{363}{365} \times \cdots \times \frac{365 - n + 1}{365}$$
Then $P(\text{a shared birthday}) = 1 - P(\text{all different})$.`,
            },
            {
              type: 'numeric',
              title: 'Three people',
              prompt: r`What's the probability that at least two of 3 people share a birthday? (4 decimal places.)`,
              answer: pMatch(3),
              tol: 0.0002,
              wrong: [{ v: 1 - pMatch(3), tol: 0.0003, why: r`That's the chance they're all **different**. Subtract it from 1.` }],
              explain: r`$1 - \frac{364 \times 363}{365^2} \approx 0.0082$. Under 1%, but it grows fast as the group gets bigger.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The tipping point',
              prompt: r`Drag along the coral curve to find the smallest group for which a shared birthday is **more likely than not**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 70, ymin: 0, ymax: 1, grid: 10, gridY: 0.1, height: 280, padL: 50, axes: { xlabel: 'people in the group', ylabel: 'probability', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { n: { min: 2, max: 70, step: 1, value: 10, slider: false } },
                curves: [
                  { f: (x) => pMatch(Math.round(x)), color: 'coral', width: 3 },
                  { f: (x) => 1 - (364 / 365) ** Math.round(x), color: 'blue', width: 2, dash: true },
                  { f: () => 0.5, color: 'ink', dash: true, width: 1 },
                ],
                points: [{ x: (p) => p.n, y: (p) => pMatch(p.n), drag: { x: 'n' }, color: 'coral' }],
                readout: (p) => r`${p.n} people: $P(\text{some pair shares}) = ${(pMatch(p.n) * 100).toFixed(1)}\%$; $\;$ $P(\text{someone shares }\textit{your}\text{ birthday}) = ${((1 - (364 / 365) ** p.n) * 100).toFixed(1)}\%$`,
                goal: (p) => pMatch(p.n) > 0.5 && pMatch(p.n - 1) <= 0.5,
                hint: 'Find where the coral curve first rises above the 50% line.',
                solution: { n: 23 },
              },
              explain: r`**23 people** give a 50.7% chance. By 57 people it's over 99%. The blue dashed curve, the chance that someone shares **your** particular birthday, rises far more slowly: that's the question our intuition usually answers instead.`,
            },
            {
              type: 'numeric',
              title: 'Count the pairs',
              prompt: r`The key is the number of **pairs** that could match. How many different pairs can be made from 23 people?`,
              answer: 253,
              wrong: [{ v: 22, why: 'That’s the pairs involving one particular person.' }, { v: 506, why: r`Each pair is counted twice that way: divide by 2. $\frac{23 \times 22}{2}$.` }],
              explain: r`$\frac{23 \times 22}{2} = 253$ pairs, each with a $\frac{1}{365}$ chance of matching. With so many chances, a match becomes likely, even though any particular pair is unlikely.`,
            },
            { /*anim:probability*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Pairs pile up',
              body: r`People walk into a room one at a time. Each line joins two people who might share a birthday. Watch the number of lines grow much faster than the number of people.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 380,
                animate: { param: 't', speed: 2.2, max: 46, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const n = Math.max(1, Math.min(40, Math.floor(p.t) + 1)), M = 40, pos = (i) => { const k = (i * 17) % M; return [Math.cos(Math.PI / 2 - (2 * Math.PI * k) / M), Math.sin(Math.PI / 2 - (2 * Math.PI * k) / M)]; }; // newcomers take seats spread around the table
                  let d = '';
                  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const [a, b] = pos(i), [c, e] = pos(j); d += `M${plot.X(a).toFixed(1)} ${plot.Y(b).toFixed(1)}L${plot.X(c).toFixed(1)} ${plot.Y(e).toFixed(1)}`; }
                  const els = [s('path', { d, stroke: n >= 23 ? 'var(--coral)' : 'var(--blue)', 'stroke-width': 0.8, opacity: 0.45, fill: 'none' })];
                  for (let i = 0; i < M; i++) { const [a, b] = pos(i); els.push(s('circle', { cx: plot.X(a), cy: plot.Y(b), r: 6, class: i < n ? 'fl-ink' : 'fl-surface', stroke: 'var(--line-2)', 'stroke-width': 1 })); }
                  return els;
                },
                readout: (p) => {
                  const n = Math.max(1, Math.min(40, Math.floor(p.t) + 1));
                  let q = 1; for (let k = 0; k < n; k++) q *= (365 - k) / 365;
                  return `${n} ${n === 1 ? 'person' : 'people'} · **${(n * (n - 1)) / 2} pairs** · chance of a shared birthday **${fix(100 * (1 - q), 1)}%**`;
                },
              },
              after: r`Each new person brings a pair with **everyone** already there, so with $n$ people there are $\frac{n(n-1)}{2}$ pairs: the count grows like $n^2$. By 23 people (when the lines turn coral) there are 253 chances for a match, and the probability passes 50%. By 40 people there are 780 pairs and the chance is about 89%.`,
            },
            {
              type: 'mcq',
              title: 'Truly large numbers',
              prompt: r`A newspaper reports a woman who won a lottery jackpot twice, and calls it a "one in 17 trillion" miracle. What's wrong with that framing?`,
              choices: [
                { t: 'It’s the chance for one named person; with millions of regular players over many years, someone winning twice is quite likely', ok: true },
                { t: 'Nothing: it really was a miracle', why: 'The tiny figure answers the wrong question: not “this person”, but “anyone, ever”.' },
                { t: 'Lotteries are rigged', why: 'No rigging is needed: enormous numbers of chances make rare events happen somewhere.' },
              ],
              explain: r`This is the birthday problem again: the question is whether **anyone** shares a coincidence, not one specific person. Statisticians Persi Diaconis and Frederick Mosteller called it the **law of truly large numbers**: with a large enough number of opportunities, any outrageous thing is likely to happen.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Your birthday',
              prompt: r`How many other people must you gather for a better than 50% chance that at least one shares **your** birthday? (Solve $1 - \left(\frac{364}{365}\right)^n > \frac12$.)`,
              answer: 253,
              wrong: [{ v: 183, why: r`That's half of 365, but people can share birthdays with each other, wasting chances. Solve $\left(\frac{364}{365}\right)^n < \frac12$.` }, { v: 23, why: 'That’s for any pair to match. Matching one particular date needs far more people.' }],
              explain: r`$n > \frac{\ln 2}{-\ln(364/365)} \approx 252.7$, so 253 people, the same as the number of pairs in a group of 23. That's no accident: either way, you need about 253 "chances" of a $\frac{1}{365}$ match.`,
            },
          ],
          recap: [
            'Compute coincidences through the complement: the chance of no match.',
            'In 23 people, a shared birthday is more likely than not: there are 253 pairs.',
            'With enough opportunities, rare coincidences become likely.',
          ],
        },
        {
          id: 'streaks',
          title: 'Streaks',
          summary: 'Randomness is clumpier than you think',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Spot the fake',
              prompt: r`One of these sequences of 20 coin flips was made up by a person; the other came from a real coin. Which is real?

**A:** H T H H T H T T H T H H T H T T H T H T

**B:** H T T T T H H T H H H H H T T H T H T T`,
              cols: 2,
              choices: [
                { t: 'B', ok: true },
                { t: 'A', why: 'A never has more than two in a row. Real coins produce longer streaks far more often than that.' },
              ],
              explain: r`B is real. People faking randomness alternate too often and avoid long runs. A real coin flipped 20 times usually produces a run of 4 or more of the same face. Teachers use this trick to spot students who faked their homework.`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Longest run in 20 flips',
              body: r`Flip 20 coins and record the longest run of identical faces. Repeat many times.`,
              widget: {
                kind: 'sampler', outcomes: ['longest run < 4', 'longest run ≥ 4'], probs: [0.2316, 0.7684], trial: () => (longestRun(20) >= 4 ? 1 : 0),
                batches: [1, 10, 100, 1000], oneLabel: 'Flip 20', color: 'violet', ymax: 1,
              },
              after: r`About 77% of the time there's a run of at least 4, and about 46% of the time a run of 5 or more. Streaks are a normal part of randomness, not evidence against it.`,
            },
            {
              type: 'numeric',
              title: 'Five in a row',
              prompt: r`What's the probability that the next 5 flips of a fair coin are all heads? (4 decimal places.)`,
              answer: 1 / 32,
              tol: 0.0001,
              wrong: [{ v: 1 / 10, why: r`Multiply: $\left(\frac12\right)^5$.` }, { v: 1 / 16, tol: 0.0001, why: r`That's 4 flips. Five flips: $\frac{1}{32}$.` }],
              explain: r`$\left(\frac12\right)^5 = \frac{1}{32} \approx 0.0313$. Rare for a particular 5 flips, but in a long sequence there are many places a streak can start, so streaks somewhere are common.`,
            },
            {
              type: 'numeric',
              title: 'How long a streak?',
              prompt: r`A good rule of thumb: in $n$ flips, the longest run of heads is typically about $\log_2 n$. Roughly how long is the longest run of heads in 1,024 flips?`,
              answer: 10,
              tol: 0.5,
              wrong: [{ v: 512, why: r`It's $\log_2 1024$: the power of 2 that gives 1024.` }, { v: 32, why: r`That's $\sqrt{1024}$. Use $\log_2$.` }],
              explain: r`$2^{10} = 1024$, so about 10 heads in a row. The typical longest streak grows very slowly: doubling the number of flips adds only about 1 to it.`,
            },
            {
              type: 'mcq',
              title: 'The hot hand',
              prompt: r`A basketball player has made 4 shots in a row. Fans say she's "hot". In 1985, psychologists studied this. What happened next in the research?`,
              choices: [
                { t: 'The 1985 study found no hot hand, but a 2018 reanalysis found a subtle bias in its method, and evidence of a modest hot hand', ok: true },
                { t: 'The hot hand was proven to be a huge effect', why: 'Any real effect is modest: most streaks are explained by chance alone.' },
                { t: 'Scientists agree there’s nothing to study', why: 'It remains an active research topic.' },
              ],
              explain: r`Gilovich, Vallone and Tversky concluded that streaks were consistent with chance. In 2018, Joshua Miller and Adam Sanjurjo showed that looking at "the shot after a streak" in a finite sequence is subtly biased towards misses, and correcting for it revealed a small hot hand. Even experts can be fooled by streaks, in both directions!`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting runs',
              prompt: r`A "run" is a maximal block of identical faces (so HHTHH has 3 runs). What's the expected number of runs in 20 fair coin flips? (Hint: a new run starts at each of the 19 gaps where the face changes.)`,
              answer: 10.5,
              wrong: [{ v: 10, why: 'Don’t forget the first run, which starts at flip 1.' }, { v: 9.5, why: 'Add the first run: 1 + 19 × ½.' }],
              explain: r`Each of the 19 gaps has a $\frac12$ chance of being a change, so the expected number of changes is $9.5$, plus the first run: $10.5$. Sequence A above has 16 runs, suspiciously many; B has 10, right on target.`,
            },
          ],
          recap: [
            'Random sequences contain more and longer streaks than people expect.',
            r`The longest run in $n$ flips is typically about $\log_2 n$.`,
            'Streaks alone are weak evidence of anything but chance.',
          ],
        },
      ],
    },
  ],
};
