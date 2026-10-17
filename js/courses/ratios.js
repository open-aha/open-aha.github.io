import { fix } from '../lib/svg.js';

const r = String.raw;

// fraction bar: a/b shaded
const bar = (plot, s, y, a, b, cls) => {
  const els = [];
  for (let i = 0; i < b; i++) {
    const x0 = (i / b) * 10, x1 = ((i + 1) / b) * 10;
    els.push(s('rect', { x: plot.X(x0) + 1, y: plot.Y(y + 1), width: plot.X(x1) - plot.X(x0) - 2, height: plot.Y(0) - plot.Y(1), rx: 4, class: i < a ? cls : 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
  }
  return els;
};
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const simplest = (a, b) => {
  const g = gcd(a, b) || 1;
  return `${a / g} : ${b / g}`;
};

export default {
  id: 'ratios',
  subject: 'math',
  title: 'Ratios & Percentages',
  level: 'Foundational',
  cover: 'ratios',
  tagline: 'Fractions, rates, proportion, scale, interest, and the percentage traps everyone falls for.',
  description: r`The everyday maths of recipes, prices, maps, savings and news headlines. Build intuition for fractions and ratios, recognise proportional and inversely proportional relationships, work with scale drawings, master percentage changes and compound interest, and learn to spot the misleading percentages hiding in adverts and news stories.`,
  chapters: [
    {
      title: 'Fractions and Ratios',
      summary: 'Parts of a whole, and comparisons.',
      lessons: [
        {
          id: 'fractions',
          title: 'Fractions',
          summary: 'Parts of a whole',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Which is bigger?',
              prompt: r`Which is bigger: $\tfrac{3}{8}$ or $\tfrac{2}{5}$?`,
              cols: 2,
              choices: [
                { t: r`$\tfrac25$`, ok: true },
                { t: r`$\tfrac38$`, why: r`It has bigger numbers, but compare properly: $\tfrac38 = 0.375$ and $\tfrac25 = 0.4$.` },
                { t: 'They’re equal', why: r`$\tfrac38 = \tfrac{15}{40}$ and $\tfrac25 = \tfrac{16}{40}$: not quite equal.` },
              ],
              explain: r`Rewrite both with the same denominator: $\tfrac38 = \tfrac{15}{40}$ and $\tfrac25 = \tfrac{16}{40}$. So $\tfrac25$ is slightly bigger.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Equivalent fractions',
              body: r`Cut each piece of a fraction bar into $k$ smaller pieces. The shaded **amount** doesn't change, but the fraction's name does: $\tfrac23 = \tfrac46 = \tfrac69 = \cdots$`,
              widget: {
                kind: 'graph', xmin: -0.2, xmax: 10.2, ymin: -0.3, ymax: 3.3, grid: false, axes: false, height: 200,
                params: { k: { min: 1, max: 5, step: 1, value: 2, label: 'cut each piece into', color: 'blue', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => [...bar(plot, s, 2, 2, 3, 'fl-blue'), ...bar(plot, s, 0.3, 2 * p.k, 3 * p.k, 'fl-teal')],
                readout: (p) => r`$\dfrac{2}{3} = \dfrac{2 \times ${p.k}}{3 \times ${p.k}} = \dfrac{${2 * p.k}}{${3 * p.k}}$`,
              },
              after: r`Multiplying (or dividing) the top and bottom by the same number gives an **equivalent fraction**. Simplifying means dividing both by a common factor: $\tfrac{12}{18} = \tfrac{2}{3}$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fractions are numbers',
              prompt: r`Every fraction is a point on the number line. The line from 0 to 1 is split into eighths. Drag the point to $\tfrac58$.`,
              widget: {
                kind: 'graph', xmin: -0.08, xmax: 1.08, ymin: -0.5, ymax: 0.6, grid: false, axes: false, height: 150,
                params: { v: { min: 0, max: 1, step: 0.125, value: 0.25, slider: false } },
                points: [{ x: (p) => p.v, y: () => 0, drag: { x: 'v' }, color: 'coral' }],
                extra: ({ plot, s }) => {
                  const els = [s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 })];
                  for (let i = 0; i <= 8; i++) {
                    els.push(s('line', { x1: plot.X(i / 8), x2: plot.X(i / 8), y1: plot.Y(i % 4 ? 0.12 : 0.22), y2: plot.Y(i % 4 ? -0.12 : -0.22), stroke: 'var(--ink)', 'stroke-width': 2 }));
                  }
                  els.push(s('text', { x: plot.X(0), y: plot.Y(-0.42), class: 'lbl', 'text-anchor': 'middle', text: '0' }));
                  els.push(s('text', { x: plot.X(0.5), y: plot.Y(-0.42), class: 'lbl', 'text-anchor': 'middle', text: '½' }));
                  els.push(s('text', { x: plot.X(1), y: plot.Y(-0.42), class: 'lbl', 'text-anchor': 'middle', text: '1' }));
                  return els;
                },
                readout: (p) => r`the point is at $\tfrac{${Math.round(p.v * 8)}}{8} = ${p.v.toFixed(3)}$`,
                goal: (p) => Math.abs(p.v - 0.625) < 1e-9,
                hint: r`$\tfrac58$ is five steps of $\tfrac18$: one step past halfway.`,
                solution: { v: 0.625 },
              },
              explain: r`$\tfrac58 = 0.625$: one eighth past $\tfrac12 = \tfrac48$. Seeing fractions as positions makes comparisons obvious: whichever is further right is bigger.`,
            },
            {
              type: 'numeric',
              title: 'Add fractions',
              prompt: r`What is $\tfrac12 + \tfrac13$? (Give a fraction.)`,
              answer: 5 / 6,
              tol: 0.002,
              wrong: [{ v: 2 / 5, tol: 0.002, why: r`You can't add tops and bottoms separately. Use a common denominator: $\tfrac36 + \tfrac26$.` }],
              explain: r`Use sixths: $\tfrac12 = \tfrac36$ and $\tfrac13 = \tfrac26$, so the sum is $\tfrac56$. (Adding tops and bottoms, $\tfrac25$, would give less than $\tfrac12$ alone, which can't be right.)`,
            },
            {
              type: 'explain',
              title: 'Multiplying and dividing',
              body: r`Multiplying fractions is easier than adding: multiply the tops and multiply the bottoms. $\tfrac23 \times \tfrac34 = \tfrac{6}{12} = \tfrac12$. Think of it as "$\tfrac23$ **of** $\tfrac34$".

Dividing asks "how many of these fit into that?". To divide by a fraction, multiply by its reciprocal (flip it upside down):
$$6 \div \tfrac34 = 6 \times \tfrac43 = 8$$
Eight three-quarter-cup scoops fit into 6 cups.`,
            },
            {
              type: 'numeric',
              title: 'Scoops of rice',
              prompt: r`You have $4\tfrac12$ cups of rice and a scoop that holds $\tfrac34$ of a cup. How many full scoops is that?`,
              unit: 'scoops',
              answer: 6,
              wrong: [{ v: 3.375, tol: 0.01, why: r`That's $4.5 \times \frac34$. Dividing by $\frac34$ means multiplying by $\frac43$.` }],
              explain: r`$4\tfrac12 \div \tfrac34 = \tfrac92 \times \tfrac43 = \tfrac{36}{6} = 6$ scoops.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Pizza share',
              prompt: r`You eat $\tfrac14$ of a pizza, and your friend eats $\tfrac23$ of what's left. What fraction of the whole pizza remains?`,
              answer: 0.25,
              tol: 0.002,
              wrong: [{ v: 1 / 12, tol: 0.002, why: r`Your friend ate $\tfrac23$ of the remaining $\tfrac34$, which is $\tfrac12$ of the pizza. So $\tfrac34 - \tfrac12$ is left.` }],
              explain: r`After you: $\tfrac34$ left. Your friend eats $\tfrac23 \times \tfrac34 = \tfrac12$ of the pizza. Remaining: $\tfrac34 - \tfrac12 = \tfrac14$. ("Of" means multiply.)`,
            },
          ],
          recap: [
            'Equivalent fractions: multiply or divide the top and bottom by the same number.',
            'Fractions are points on the number line; to add them, use a common denominator.',
            '“A fraction of” means multiply; dividing by a fraction means multiplying by its reciprocal.',
          ],
        },
        {
          id: 'ratios',
          title: 'Ratios & Rates',
          summary: 'Scaling recipes and best buys',
          icon: 'target',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Pancakes',
              prompt: 'A recipe for 4 people uses 300 g of flour. How much flour do you need for 10 people?',
              unit: 'g',
              answer: 750,
              wrong: [{ v: 306, why: r`Scale proportionally: 10 people is $\tfrac{10}{4} = 2.5$ times the recipe.` }, { v: 1200, why: 'That’s for 16 people. Each person needs 300 ÷ 4 = 75 g.' }],
              explain: r`Per person: $300 / 4 = 75$ g. For 10: $75 \times 10 = 750$ g. Or scale by $\tfrac{10}{4} = 2.5$.`,
            },
            {
              type: 'explain',
              title: 'Ratios and unit rates',
              body: r`A **ratio** compares quantities: a 2 : 3 mix of juice to water means 2 parts juice for every 3 parts water. That's $\tfrac25$ juice overall: a ratio compares part to part, while a fraction compares part to whole.

A **unit rate** tells you how much per one unit: price per gram, km per hour, people per square km. Unit rates make comparisons easy.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Mix the squash',
              prompt: r`The label says: mix squash and water in the ratio **2 : 3**. You've poured 8 cups of squash. Add the right amount of water.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 21, ymin: 0, ymax: 3, grid: false, axes: false, height: 160,
                params: { w: { min: 0, max: 20, step: 1, value: 4, label: 'cups of water', color: 'blue' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 0; i < 8; i++) els.push(s('rect', { x: plot.X(0.5 + i) + 1, y: plot.Y(2.6), width: plot.X(1) - plot.X(0) - 3, height: plot.Y(1.7) - plot.Y(2.6), rx: 4, class: 'fl-amber' }));
                  for (let i = 0; i < p.w; i++) els.push(s('rect', { x: plot.X(0.5 + i) + 1, y: plot.Y(1.2), width: plot.X(1) - plot.X(0) - 3, height: plot.Y(0.3) - plot.Y(1.2), rx: 4, class: 'fl-blue' }));
                  return els;
                },
                readout: (p) => r`squash : water $= 8 : ${p.w}${p.w ? ` = ${simplest(8, p.w)}` : ''}$; $\;$ squash is $${p.w ? Math.round((800 / (8 + p.w))) : 100}\%$ of the drink`,
                goal: (p) => p.w === 12,
                hint: r`2 : 3 means 3 cups of water for every 2 cups of squash. 8 cups is 4 lots of 2.`,
                solution: { w: 12 },
              },
              explain: r`8 cups of squash is $4 \times 2$, so you need $4 \times 3 = 12$ cups of water: $8 : 12 = 2 : 3$. The drink is $\tfrac{8}{20} = 40\%$ squash, matching $\tfrac{2}{2 + 3} = \tfrac25$.`,
            },
            {
              type: 'mcq',
              title: 'Best buy',
              prompt: 'Which is the better deal?',
              choices: [
                { t: r`750 g of cereal for \$4.50`, ok: true },
                { t: r`500 g of cereal for \$3.20`, why: r`Per 100 g: $3.20 / 5 = 64$¢, versus $4.50 / 7.5 = 60$¢.` },
                { t: 'They’re the same value', why: 'Compare the price per 100 g: 60¢ vs 64¢.' },
              ],
              explain: r`Unit prices: $\$4.50 / 7.5 = \$0.60$ per 100 g, versus $\$3.20 / 5 = \$0.64$ per 100 g. The bigger box is cheaper per gram here, but that's not always the case, so check!`,
            },
            {
              type: 'numeric',
              title: 'A speed is a rate',
              prompt: r`A cyclist covers 36 km in 1 hour 30 minutes. What is her average speed in km/h?`,
              unit: 'km/h',
              answer: 24,
              wrong: [{ v: 27.7, tol: 0.1, why: r`1 hour 30 minutes is 1.5 hours, not 1.3.` }, { v: 36, why: 'She took longer than one hour. Divide by 1.5 hours.' }],
              explain: r`$36 \div 1.5 = 24$ km/h. Speed is just a unit rate: distance per one unit of time.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Mixing paint',
              prompt: 'Green paint is mixed from blue and yellow in the ratio 2 : 5. How much blue do you need to make 21 litres of green?',
              unit: 'L',
              answer: 6,
              wrong: [{ v: 8.4, why: r`The parts add to $2 + 5 = 7$. Blue is $\tfrac27$ of the total.` }, { v: 15, why: 'That’s the yellow paint.' }],
              explain: r`$2 + 5 = 7$ parts. Each part is $21 / 7 = 3$ L, so blue is $2 \times 3 = 6$ L and yellow is $15$ L.`,
            },
          ],
          recap: [
            'Scale recipes by multiplying every amount by the same factor.',
            'A ratio a : b means a/(a + b) of the total is the first part.',
            'Compare deals and speeds with unit rates (amount per one unit).',
          ],
        },
        {
          id: 'proportional',
          title: 'Proportional Relationships',
          summary: 'Straight lines through the origin',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Double one, double the other',
              body: r`Two quantities are **proportional** when their ratio never changes: double one and the other doubles, triple one and the other triples. We write
$$y = k\,x$$
where $k$ is the **constant of proportionality**: the unit rate. Pay at £15 an hour: pay $= 15 \times$ hours. Petrol at £1.50 a litre: cost $= 1.5 \times$ litres.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the rate',
              prompt: r`The dots show a babysitter's pay for different numbers of hours. Adjust the line $y = kx$ until it passes through all the dots.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9, ymin: 0, ymax: 140, grid: 1, gridY: 20, height: 280, padL: 48, axes: { xlabel: 'hours', ylabel: 'pay (£)' },
                params: { k: { min: 5, max: 25, step: 1, value: 10, label: 'rate k', color: 'violet', format: (v) => `£${v} per hour` } },
                curves: [{ f: (x, p) => p.k * x, color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [2, 4, 6, 8].map((h) => s('circle', { cx: plot.X(h), cy: plot.Y(15 * h), r: 7, class: 'fl-coral' })),
                readout: (p) => r`$y = ${p.k}x$`,
                goal: (p) => p.k === 15,
                hint: 'Read off one dot: how much for 2 hours? Divide by 2.',
                solution: { k: 15 },
              },
              explain: r`£30 for 2 hours, £60 for 4, … always £15 per hour: $y = 15x$. A proportional relationship always graphs as a **straight line through the origin** (0 hours, £0), and its slope is the unit rate.`,
            },
            {
              type: 'mcq',
              title: 'Proportional or not?',
              prompt: r`A taxi charges a £3 pick-up fee plus £2 per km. Is the fare proportional to the distance?`,
              choices: [
                { t: 'No: a 0 km trip still costs £3, so the graph doesn’t pass through the origin', ok: true },
                { t: 'Yes: it goes up by £2 for each km', why: 'It increases steadily, but doubling the distance doesn’t double the fare: 1 km costs £5, 2 km costs £7.' },
                { t: 'Yes, because the graph is a straight line', why: 'Straight isn’t enough. A proportional graph must also pass through the origin.' },
              ],
              explain: r`Fare $= 3 + 2d$ is **linear** but not proportional. Check: 1 km costs £5, 2 km costs £7, not £10. The ratio fare/distance changes, so there's no single constant of proportionality.`,
            },
            {
              type: 'numeric',
              title: 'Use the constant',
              prompt: r`A printer prints 84 pages in 6 minutes, at a steady rate. How many pages does it print in 25 minutes?`,
              unit: 'pages',
              answer: 350,
              wrong: [{ v: 103, why: 'Pages are proportional to time: find the rate per minute first, 84 ÷ 6.' }],
              explain: r`$k = \frac{84}{6} = 14$ pages per minute, so $14 \times 25 = 350$ pages.`,
            },
            {
              type: 'numeric',
              title: 'Scaling a recipe',
              prompt: r`A recipe for 4 people uses 300 g of flour. How much flour do you need for 6 people?`,
              unit: 'g',
              answer: 450,
              explain: r`Flour is proportional to people: $300 \times \frac64 = 450$ g. The constant of proportionality is 75 g per person.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Exchange rates',
              prompt: r`On a holiday exchange board, £50 buys €58. At the same rate, how many pounds do you need for €203?`,
              unit: '£',
              answer: 175,
              wrong: [{ v: 235.48, tol: 0.1, why: 'That converts the wrong way. Euros per pound is 58/50, so pounds = euros ÷ 1.16.' }],
              explain: r`The rate is $\frac{58}{50} = 1.16$ euros per pound, so $203 \div 1.16 = £175$. Proportional relationships work both ways: the reverse rate is $\frac{1}{1.16}$ pounds per euro.`,
            },
          ],
          recap: [
            r`Proportional: $y = kx$, with a constant ratio $k$ (the unit rate).`,
            'The graph is a straight line through the origin.',
            'A fixed fee breaks proportionality, even if the graph is straight.',
          ],
        },
        {
          id: 'inverse',
          title: 'Inverse Proportion',
          summary: 'More workers, less time',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'When one goes up, the other goes down',
              body: r`Some quantities are linked the other way round: double one and the other **halves**. The number of painters and the days to paint a house; speed and journey time for a fixed distance; the width and length of a rectangle with fixed area. Their **product** stays constant:
$$x \times y = k \qquad\text{or}\qquad y = \frac{k}{x}$$
This is **inverse proportion**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A journey of 120 km',
              body: r`The time for a 120 km journey depends on your speed. Change the speed.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 130, ymin: 0, ymax: 8, grid: 20, gridY: 1, height: 260, axes: { xlabel: 'speed (km/h)', ylabel: 'time (h)' },
                params: { v: { min: 20, max: 120, step: 10, value: 60, label: 'speed', color: 'coral', format: (v) => `${v} km/h` } },
                curves: [{ f: (x) => 120 / x, from: () => 15, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.v, y: (p) => 120 / p.v, color: 'coral' }],
                readout: (p) => r`time $= \dfrac{120}{${p.v}} = ${(120 / p.v).toFixed(2)}$ h, $\;$ speed × time $= 120$`,
              },
              after: r`Doubling the speed from 30 to 60 km/h halves the time from 4 h to 2 h. The graph is a curve (a **hyperbola**), not a straight line, and it never reaches zero: no finite speed gets you there instantly.`,
            },
            {
              type: 'numeric',
              title: 'Painting a fence',
              prompt: r`6 painters take 10 days to paint a long fence. How many days would 4 painters take, working at the same rate?`,
              unit: 'days',
              answer: 15,
              wrong: [{ v: 6.67, tol: 0.02, why: 'Fewer painters take longer, not shorter. The total work is 6 × 10 = 60 painter-days.' }, { v: 8, why: 'Inverse proportion multiplies, not subtracts: 60 painter-days ÷ 4 painters.' }],
              explain: r`The job takes $6 \times 10 = 60$ painter-days. With 4 painters: $60 \div 4 = 15$ days.`,
            },
            {
              type: 'mcq',
              title: 'Spot the type',
              prompt: r`Which pair of quantities is inversely proportional?`,
              choices: [
                { t: 'The number of people sharing a £60 bill equally, and each person’s share', ok: true },
                { t: 'The number of tickets bought and the total cost', why: 'More tickets means a proportionally bigger cost: direct proportion.' },
                { t: 'A person’s age and height', why: 'Neither direct nor inverse: height grows, then stops.' },
              ],
              explain: r`Share $= \frac{60}{\text{people}}$: people × share stays £60. Twice as many people, half the share each.`,
            },
            {
              type: 'numeric',
              title: 'A faster drive',
              prompt: r`A journey takes 3 hours at 80 km/h. How long does it take at 120 km/h, in hours?`,
              unit: 'h',
              answer: 2,
              wrong: [{ v: 4.5, why: 'Faster means less time, not more: speed and time are inversely proportional here.' }],
              explain: r`The distance is fixed: $80 \times 3 = 240$ km. At 120 km/h that takes $\frac{240}{120} = 2$ hours. Speed × time stays constant, so 1.5 times the speed means $\frac{1}{1.5}$ of the time.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Faster pumps',
              prompt: r`Three identical pumps empty a pool in 8 hours. After 2 hours, a fourth identical pump joins in. How many hours does the whole job take in total?`,
              unit: 'hours',
              answer: 6.5,
              tol: 0.01,
              wrong: [{ v: 6, why: r`The first 2 hours use 3 pumps (6 pump-hours). The remaining 18 pump-hours are shared by 4 pumps.` }, { v: 8, why: 'The extra pump speeds things up after it joins.' }],
              explain: r`The job is $3 \times 8 = 24$ pump-hours. In the first 2 hours, 3 pumps do 6 pump-hours, leaving 18. Four pumps finish that in $18 \div 4 = 4.5$ hours. Total: $2 + 4.5 = 6.5$ hours.`,
            },
          ],
          recap: [
            r`Inverse proportion: $xy = k$, or $y = k/x$.`,
            'Double one quantity and the other halves; the graph is a hyperbola.',
            'Work problems: find the total work (e.g. painter-days), then divide.',
          ],
        },
        {
          id: 'scale',
          title: 'Scale Drawings & Maps',
          summary: 'Lengths, areas and volumes',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Scale factors',
              body: r`A map with scale **1 : 25,000** shows everything 25,000 times smaller than in real life: 1 cm on the map is 25,000 cm $= 250$ m on the ground. A model car at 1 : 18 is 18 times shorter than the real car in every direction.

The number that multiplies every length is the **scale factor**.`,
            },
            {
              type: 'numeric',
              title: 'Reading a map',
              prompt: r`On a 1 : 25,000 map, two villages are 6 cm apart. How far apart are they in reality, in km?`,
              unit: 'km',
              answer: 1.5,
              tol: 0.001,
              wrong: [{ v: 150, why: '6 × 25,000 = 150,000 cm. Convert to km: 100,000 cm make 1 km.' }, { v: 15, why: 'Check the conversion: 150,000 cm = 1,500 m = 1.5 km.' }],
              explain: r`$6 \times 25{,}000 = 150{,}000$ cm $= 1500$ m $= 1.5$ km.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Scaling areas',
              prompt: r`Enlarge the small rectangle by a scale factor. Find the scale factor that makes its **area** 9 times bigger.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 14, ymin: 0, ymax: 8, grid: 1, equal: true, axes: false, maxWidth: 520,
                params: { k: { min: 1, max: 4, step: 0.5, value: 2, label: 'scale factor', color: 'teal', format: (v) => `× ${fix(v, 1)}` } },
                extra: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0.5), y: plot.Y(1.5 + 1), width: plot.X(2) - plot.X(0.5), height: plot.Y(1.5) - plot.Y(2.5), class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2.5 }),
                  s('rect', { x: plot.X(3), y: plot.Y(0.5 + p.k), width: plot.X(3 + 1.5 * p.k) - plot.X(3), height: plot.Y(0.5) - plot.Y(0.5 + p.k), class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2.5 }),
                ],
                readout: (p) => r`lengths $\times ${fix(p.k, 1)}$, $\;$ area $\times ${fix(p.k, 1)}^2 = ${fix(p.k * p.k, 2)}$`,
                goal: (p) => p.k === 3,
                hint: r`Both the width and the height get multiplied by the scale factor.`,
                solution: { k: 3 },
              },
              explain: r`A scale factor of 3 multiplies the width by 3 **and** the height by 3, so the area grows $3 \times 3 = 9$ times. In general: lengths scale by $k$, areas by $k^2$, and volumes by $k^3$.`,
            },
            {
              type: 'numeric',
              title: 'Model paint',
              prompt: r`A 1 : 10 scale model of a boat needs 0.3 litres of paint to cover its hull. How much paint would the real boat's hull need?`,
              unit: 'L',
              answer: 30,
              wrong: [{ v: 3, why: r`Paint covers area, which scales by $10^2 = 100$, not 10.` }, { v: 300, why: r`That's the volume factor, $10^3$. Paint covers area: $10^2$.` }],
              explain: r`Areas scale by $10^2 = 100$: $0.3 \times 100 = 30$ litres. (If it were filled with water instead, the factor would be $10^3 = 1000$.)`,
            },
            {
              type: 'numeric',
              title: 'Volumes scale by the cube',
              prompt: r`A 1 : 50 scale model of a water tank holds 1 litre. How many litres does the real tank hold?`,
              unit: 'L',
              answer: 125000,
              explain: r`Volumes scale by $50^3 = 125{,}000$, so the tank holds 125,000 litres. Lengths scale by 50, areas by 2,500, volumes by 125,000.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A giant’s weight',
              prompt: r`A statue is an exact copy of a 70 kg person, scaled up 3 times in every direction, made of material with the same density. What is its mass, in kg?`,
              unit: 'kg',
              answer: 1890,
              wrong: [{ v: 210, why: 'Mass depends on volume, which scales by 3³ = 27.' }, { v: 630, why: 'That’s the area factor (9). Mass goes with volume: 27.' }],
              explain: r`Volume (and so mass) scales by $3^3 = 27$: $70 \times 27 = 1890$ kg. Its leg bones' cross-sections only grow by $3^2 = 9$, so each square centimetre of bone carries three times the load. That's why real giants would collapse, an idea Galileo explained in 1638.`,
            },
          ],
          recap: [
            'A scale of 1 : n means real lengths are n times the drawn ones.',
            r`Scale lengths by $k$: areas scale by $k^2$, volumes by $k^3$.`,
            'This square–cube law limits how big animals and structures can grow.',
          ],
        },
      ],
    },
    {
      title: 'Percentages',
      summary: 'Per hundred, changes, interest and traps.',
      lessons: [
        {
          id: 'percent',
          title: 'Per Hundred',
          summary: 'Percent of a number',
          icon: 'sigma',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A tip',
              prompt: r`What is 15% of \$60?`,
              unit: 'dollars',
              answer: 9,
              wrong: [{ v: 4, why: r`15% means $\tfrac{15}{100}$: $0.15 \times 60$.` }, { v: 900, why: 'Divide by 100: 15% is 0.15.' }],
              explain: r`$15\% = 0.15$, and $0.15 \times 60 = 9$. Mental shortcut: 10% is \$6, 5% is \$3, so 15% is \$9.`,
            },
            {
              type: 'explain',
              title: 'Percent means per hundred',
              body: r`"Per cent" means "out of 100": $35\% = \tfrac{35}{100} = 0.35$.

- To find $p\%$ of $x$: multiply $x$ by $\frac{p}{100}$.
- To find what percent $a$ is of $b$: compute $\frac{a}{b} \times 100\%$.

Handy fact: $x\%$ of $y$ = $y\%$ of $x$. So 8% of 25 is the same as 25% of 8, which is 2.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Shade the percentage',
              prompt: r`A basketball player scores 18 of her 24 free throws. Shade the hundred-square to show her success rate as a percentage.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 10, grid: false, axes: false, equal: true, maxWidth: 300,
                params: { p: { min: 0, max: 100, step: 1, value: 50, label: 'percent shaded', color: 'violet', format: (v) => `${v}%` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 0; i < 100; i++) {
                    const x = i % 10, y = 9 - Math.floor(i / 10);
                    els.push(s('rect', { x: plot.X(x) + 1, y: plot.Y(y + 1) + 1, width: plot.X(1) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(1) - 2, rx: 2, class: i < p.p ? 'fl-violet' : 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 1 }));
                  }
                  return els;
                },
                readout: (p) => r`$${p.p}\%$ $= \tfrac{${p.p}}{100}$`,
                goal: (p) => p.p === 75,
                hint: r`$\tfrac{18}{24}$ simplifies to a fraction you know well.`,
                solution: { p: 75 },
              },
              explain: r`$\tfrac{18}{24} = \tfrac34 = \tfrac{75}{100} = 75\%$. Converting to "out of 100" lets you compare rates with different totals: 75% beats, say, 13 out of 20 (65%).`,
            },
            {
              type: 'numeric',
              title: 'Test score',
              prompt: 'You scored 42 out of 60 on a test. What percentage is that?',
              unit: '%',
              answer: 70,
              wrong: [{ v: 42, why: r`$\frac{42}{60} \times 100$.` }],
              explain: r`$\frac{42}{60} = 0.7 = 70\%$.`,
            },
            {
              type: 'mcq',
              title: 'Fractions, decimals, percents',
              prompt: r`Which is largest: $\tfrac58$, $0.6$ or $62\%$?`,
              cols: 3,
              choices: [
                { t: r`$\tfrac58$`, ok: true },
                { t: r`$0.6$`, why: r`$0.6 = 60\%$, less than $\tfrac58 = 62.5\%$.` },
                { t: r`$62\%$`, why: r`Close, but $\tfrac58 = 62.5\%$.` },
              ],
              explain: r`Convert everything to percentages: $\tfrac58 = 62.5\%$, $0.6 = 60\%$, and $62\%$. So $\tfrac58$ wins by a hair.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The swap trick',
              prompt: 'Without a calculator: what is 4% of 75?',
              answer: 3,
              wrong: [{ v: 30, why: r`Use the swap: 4% of 75 = 75% of 4 = 3.` }],
              explain: r`4% of 75 = 75% of 4 = 3. That's because $\frac{4}{100} \times 75 = \frac{75}{100} \times 4$.`,
            },
          ],
          recap: [
            r`$p\%$ means $\frac{p}{100}$. To find $p\%$ of $x$, multiply.`,
            r`$a$ as a percentage of $b$ is $\frac{a}{b} \times 100\%$.`,
            'Convert to percentages to compare fractions and decimals; x% of y equals y% of x.',
          ],
        },
        {
          id: 'percent-change',
          title: 'Percent Change',
          summary: 'Up, down, and back again',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Up then down',
              prompt: 'A stock rises 50%, then falls 50%. Overall, compared with where it started, it is…',
              choices: [
                { t: '25% lower', ok: true },
                { t: 'Back where it started', why: r`The 50% fall applies to the bigger, risen value. $\$100 \to \$150 \to \$75$.` },
                { t: '25% higher', why: r`$100 \times 1.5 \times 0.5 = 75$, which is lower.` },
              ],
              explain: r`$\$100 \to \$150$ (up 50%) $\to \$75$ (down 50% **of 150**). Percentage changes multiply: $1.5 \times 0.5 = 0.75$, a 25% loss.`,
            },
            {
              type: 'explain',
              title: 'Multipliers',
              body: r`A percentage change is easiest as a **multiplier**:
- up $p\%$: multiply by $1 + \frac{p}{100}$ (up 20% means × 1.2),
- down $p\%$: multiply by $1 - \frac{p}{100}$ (down 20% means × 0.8).

Successive changes multiply together. And the **percent change** from an old value to a new one is
$$\frac{\text{new} - \text{old}}{\text{old}} \times 100\%.$$`,
            },
            {
              type: 'numeric',
              title: 'Which base?',
              prompt: r`A price goes from £80 to £100. By what percentage did it increase?`,
              unit: '%',
              answer: 25,
              wrong: [{ v: 20, why: 'That divides by the new price. Percent change uses the old value: 20 ÷ 80.' }],
              explain: r`$\frac{100 - 80}{80} = \frac{20}{80} = 25\%$. But going back from £100 to £80 is a **20%** decrease, since now the base is 100. Same £20 gap, different percentages.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Undo a discount',
              prompt: r`A £100 item is reduced by 25%. What percentage increase brings it back to exactly £100?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 120, grid: false, axes: false, height: 240,
                params: { p: { min: 0, max: 50, step: 0.1, value: 25, label: 'increase', color: 'teal', format: (v) => `${v.toFixed(1)}%` } },
                extra: ({ plot, p, s }) => {
                  const vals = [[1, 100, 'blue', 'start'], [3, 75, 'coral', '−25%'], [5, 75 * (1 + p.p / 100), 'teal', `+${p.p.toFixed(1)}%`]];
                  const els = [], labels = [];
                  for (const [x, v, c, lab] of vals) {
                    els.push(s('rect', { x: plot.X(x - 0.6), y: plot.Y(v), width: plot.X(x + 0.6) - plot.X(x - 0.6), height: plot.Y(0) - plot.Y(v), rx: 5, class: `fl-${c}` }));
                    labels.push(s('text', { x: plot.X(x), y: plot.Y(v) - 8, class: 'lbl halo-text', 'text-anchor': 'middle', text: `£${v.toFixed(2)}` }));
                    els.push(s('text', { x: plot.X(x), y: plot.Y(0) + 18, class: 'tick', 'text-anchor': 'middle', text: lab }));
                  }
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(6), y1: plot.Y(100), y2: plot.Y(100), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }), ...labels);
                  return els;
                },
                readout: (p) => r`$100 \times 0.75 \times ${(1 + p.p / 100).toFixed(3)} = ${(75 * (1 + p.p / 100)).toFixed(2)}$`,
                goal: (p) => Math.abs(75 * (1 + p.p / 100) - 100) < 0.05,
                hint: r`You need $75 \times m = 100$, so $m = \frac{100}{75}$.`,
                solution: { p: 33.3 },
              },
              explain: r`You need a multiplier of $\frac{100}{75} = \frac43 \approx 1.333$: an increase of about **33.3%**, not 25%. The 25% cut was taken from £100; the rise is calculated on the smaller £75.`,
            },
            {
              type: 'numeric',
              title: 'Sale price',
              prompt: r`After a 20% discount, a jacket costs \$80. What was the original price?`,
              unit: 'dollars',
              answer: 100,
              wrong: [{ v: 96, why: r`Adding 20% of \$80 uses the wrong base. The discount was 20% of the **original** price: $0.8 \times P = 80$.` }],
              explain: r`$0.8 \times P = 80$, so $P = 80 / 0.8 = \$100$. A very common mistake is to add 20% back onto \$80 (giving \$96), but the 20% was taken from the original.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Price rises',
              prompt: 'Prices rise 10% one year and 10% the next. What is the total percentage increase over the two years?',
              unit: '%',
              answer: 21,
              wrong: [{ v: 20, why: r`The second 10% applies to the already-raised price: $1.1 \times 1.1 = 1.21$.` }],
              explain: r`$1.1 \times 1.1 = 1.21$: a 21% increase. The extra 1% is 10% of the first year's 10%. That's compounding in action.`,
            },
          ],
          recap: [
            'Up p% means × (1 + p/100). Down p% means × (1 − p/100). Successive changes multiply.',
            'Percent change is always measured from the old value.',
            'To undo a discount, divide by the multiplier: −25% needs +33.3% to recover.',
          ],
        },
        {
          id: 'interest',
          title: 'Interest & Compounding',
          summary: 'Money that grows on itself',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Simple versus compound',
              body: r`Put £1000 in a savings account paying 5% a year.

- **Simple interest** pays 5% of the original £1000 each year: £50 a year, so after 10 years you'd have £1500.
- **Compound interest** pays 5% of whatever is in the account, including past interest. Each year multiplies the balance by 1.05:
$$\text{balance after } n \text{ years} = 1000 \times 1.05^n$$`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching it grow',
              body: r`Compare simple and compound interest on £1000. Change the interest rate.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 10000, grid: 5, gridY: 2000, height: 280, padL: 56, axes: { xlabel: 'years', ylabel: 'balance (£)' },
                params: { rate: { min: 1, max: 10, step: 0.5, value: 5, label: 'interest rate', color: 'violet', format: (v) => `${fix(v, 1)}%` } },
                curves: [
                  { f: (n, p) => 1000 * (1 + (p.rate / 100) * n), color: 'blue', width: 2.5, dash: true },
                  { f: (n, p) => 1000 * (1 + p.rate / 100) ** n, color: 'violet', width: 3.5 },
                ],
                readout: (p) => r`after 30 years: simple £${Math.round(1000 * (1 + (p.rate / 100) * 30)).toLocaleString('en-GB')}, $\;$ compound **£${Math.round(1000 * (1 + p.rate / 100) ** 30).toLocaleString('en-GB')}**`,
              },
              after: r`At first the two barely differ, but compounding pulls away dramatically over decades: interest earns interest. At 8% for 30 years, compounding gives nearly three times as much as simple interest.`,
            },
            {
              type: 'numeric',
              title: 'Ten years at 5%',
              prompt: r`£1000 is invested at 5% compound interest. How much is it worth after 10 years? (Nearest pound.)`,
              unit: '£',
              answer: Math.round(1000 * 1.05 ** 10),
              tol: 1,
              wrong: [{ v: 1500, why: 'That’s simple interest. Compound interest multiplies by 1.05 ten times.' }],
              explain: r`$1000 \times 1.05^{10} \approx £1629$, about £129 more than simple interest would give.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Double your money',
              prompt: r`Find the interest rate (to the nearest 0.1%) that doubles your money in exactly **10 years**, to within 1%.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 3, grid: 1, gridY: 0.5, height: 260, axes: { xlabel: 'years', ylabel: 'growth factor' },
                params: { rate: { min: 3, max: 12, step: 0.1, value: 5, label: 'interest rate', color: 'teal', format: (v) => `${v.toFixed(1)}%` } },
                curves: [{ f: (n, p) => (1 + p.rate / 100) ** n, color: 'teal', width: 3 }, { f: () => 2, color: 'coral', dash: true, width: 2 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(10), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(3), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' })],
                readout: (p) => r`$${(1 + p.rate / 100).toFixed(3)}^{10} = ${((1 + p.rate / 100) ** 10).toFixed(3)}$`,
                goal: (p) => Math.abs((1 + p.rate / 100) ** 10 - 2) < 0.01,
                hint: 'Try a rate a little above 7%.',
                solution: { rate: 7.2 },
              },
              explain: r`About **7.2%**: $1.072^{10} \approx 2.00$. Notice $7.2 \times 10 = 72$. That's the **rule of 72**: money doubles in roughly $\frac{72}{\text{rate}}$ years.`,
            },
            {
              type: 'numeric',
              title: 'Monthly compounding',
              prompt: r`A card charges 12% a year, compounded **monthly** (1% each month). What is the effective annual rate? (Percentage, 2 decimal places.)`,
              unit: '%',
              answer: (Math.pow(1.01, 12) - 1) * 100,
              tol: 0.01,
              explain: r`$1.01^{12} - 1 \approx 12.68\%$. The more often interest compounds, the more it adds up; this "effective annual rate" (often called the AER or APY) is the true yearly cost.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rule of 72',
              prompt: r`Using the rule of 72, roughly how many years does it take for prices to double if inflation runs at 6% per year?`,
              unit: 'years',
              answer: 12,
              tol: 0.1,
              wrong: [{ v: 16.7, tol: 0.1, why: 'That’s 100 ÷ 6, simple growth. Compounding doubles faster: 72 ÷ 6.' }],
              explain: r`$\frac{72}{6} = 12$ years (the exact answer is 11.9). The same rule works for debts: a credit card charging 24% a year doubles an unpaid balance in about 3 years.`,
            },
          ],
          recap: [
            'Simple interest pays on the original amount; compound interest pays on the growing balance.',
            r`Compound growth: amount $= P(1 + r)^n$.`,
            'Rule of 72: doubling time ≈ 72 ÷ rate (in %).',
          ],
        },
        {
          id: 'percent-traps',
          title: 'Percentage Traps',
          summary: 'Read the numbers carefully',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Doubled risk',
              body: r`A headline reads: "New study: drinking X **doubles** your risk of a rare disease!" The risk goes from 1 in 100,000 to 2 in 100,000.`,
              prompt: 'How much has the actual risk increased?',
              choices: [
                { t: 'By 0.001 percentage points: from 0.001% to 0.002%', ok: true },
                { t: 'By 100%, so it’s now very dangerous', why: 'It’s a 100% **relative** increase, but the **absolute** risk is still tiny.' },
              ],
              explain: r`**Relative** risk doubled (+100%), but the **absolute** risk rose by just 1 in 100,000. Headlines often quote relative changes because they sound dramatic. Always ask: what is the actual risk?`,
            },
            {
              type: 'mcq',
              title: 'Points vs percent',
              prompt: 'An interest rate rises from 2% to 3%. Which description is correct?',
              choices: [
                { t: 'It rose by 1 percentage point, which is a 50% increase', ok: true },
                { t: 'It rose by 1%', why: r`It rose by 1 **percentage point**. As a percentage of the original 2%, that's a 50% increase.` },
                { t: 'It rose by 3%', why: 'Compare 3 with 2: up 1 percentage point, or 50% relative to the starting rate.' },
              ],
              explain: r`The difference between two percentages is measured in **percentage points**: $3 - 2 = 1$ point. The relative change is $\frac{1}{2} = 50\%$. Mixing these up causes endless confusion in news reports.`,
            },
            {
              type: 'mcq',
              title: 'Averaging percentages',
              prompt: r`A shop's sales rose 10% in its small online store (£10,000 of sales) and fell 10% in its big high-street store (£90,000). Did total sales rise, fall or stay the same?`,
              choices: [
                { t: 'Fell, by 8%', ok: true },
                { t: 'Stayed the same: +10% and −10% cancel', why: 'Percentages of different bases can’t simply be averaged. The 10% fall is on a much bigger amount.' },
                { t: 'Rose', why: 'Online gained £1,000 but the high street lost £9,000.' },
              ],
              explain: r`Online: $+£1{,}000$. High street: $-£9{,}000$. Total: from £100,000 to £92,000, an 8% fall. Percentages only average fairly when their bases are the same size.`,
            },
            {
              type: 'numeric',
              title: 'Price including tax',
              prompt: r`A laptop costs £720 including 20% VAT. What is its price before VAT?`,
              unit: '£',
              answer: 600,
              wrong: [{ v: 576, why: 'Subtracting 20% of £720 uses the wrong base. The VAT was 20% of the pre-tax price: 1.2 × P = 720.' }],
              explain: r`$1.2 \times P = 720$, so $P = £600$ (VAT is £120). The same "reverse percentage" trap as with discounts.`,
            },
            {
              type: 'interactive',
              title: 'Up, then down',
              body: r`A price rises by $x\%$ and then falls by $x\%$. Choose $x$ so the final price is **91%** of the original.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, height: 200,
                params: { x: { min: 0, max: 60, step: 1, value: 10, label: 'percentage $x$', color: 'coral', format: (v) => `${v}%` } },
                extra: ({ plot, p, s }) => { const a = 100, b = 100 * (1 + p.x / 100), c = b * (1 - p.x / 100), W = (v) => (v / 170) * 8.5; return [[a, 2.4, 'fl-blue', 'start'], [b, 1.5, 'fl-coral', `+${p.x}%`], [c, 0.6, 'fl-teal', `−${p.x}%`]].flatMap(([v, y, cls, lab]) => [s('rect', { x: plot.X(1.2), y: plot.Y(y + 0.3), width: plot.X(W(v)) - plot.X(0), height: plot.Y(0) - plot.Y(0.6), rx: 4, class: cls }), s('text', { x: plot.X(1.1), y: plot.Y(y) + 5, 'text-anchor': 'end', class: 'tick', text: lab }), s('text', { x: plot.X(1.2 + W(v)) + 6, y: plot.Y(y) + 5, class: 'tick', text: v.toFixed(1) })]); },
                readout: (p) => `final price: **${(100 * (1 + p.x / 100) * (1 - p.x / 100)).toFixed(1)}%** of the original`,
                goal: (p) => Math.abs((1 + p.x / 100) * (1 - p.x / 100) - 0.91) < 1e-9,
                hint: r`The final price is $(1 + x)(1 - x) = 1 - x^2$ of the original.`,
                solution: { x: 30 },
              },
              explain: r`$(1.3)(0.7) = 0.91$: a 30% rise followed by a 30% fall leaves you 9% down, because the fall is taken from a bigger number. In general, with $x$ written as a decimal, $(1 + x)(1 - x) = 1 - x^2$, so the loss is $x^2$. That is why "up 50%, down 50%" leaves only 75%.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Survey of 10',
              body: r`An advert claims: "80% of dentists recommend Brite toothpaste!" The small print says 10 dentists were asked, and each could recommend several brands.`,
              prompt: 'How many dentists recommended Brite?',
              answer: 8,
              wrong: [{ v: 80, why: 'Only 10 dentists were surveyed. 80% of 10 is 8.' }],
              explain: r`80% of 10 is just 8 dentists, and since they could recommend several brands, other toothpastes may have scored just as high. A tiny sample plus a vague question makes an impressive-sounding but nearly meaningless percentage.`,
            },
          ],
          recap: [
            'Relative change (a percentage) differs from absolute change (the actual amount).',
            'Differences between percentages are measured in percentage points.',
            'Percentages of different bases can’t be averaged; always check the base and sample size.',
          ],
        },
      ],
    },
  ],
};
