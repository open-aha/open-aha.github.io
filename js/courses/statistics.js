import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f1 = (v) => fix(v, 1);
const f2 = (v) => fix(v, 2);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => { const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

// deterministic pseudo-random normals for the correlation demo
function seeded(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
const rng = seeded(12345);
const PAIRS = Array.from({ length: 60 }, () => {
  const u1 = rng(), u2 = rng(), u3 = rng(), u4 = rng();
  return [Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2), Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4)];
});

// distribution of the sum of k dice
function diceDist(k) {
  let d = [1];
  for (let i = 0; i < k; i++) {
    const nd = new Array(d.length + 6).fill(0);
    d.forEach((p, s) => { for (let f = 1; f <= 6; f++) nd[s + f] += p / 6; });
    d = nd;
  }
  return d;
}
const D5 = diceDist(5).slice(5);

const dotParams = (vals) => Object.fromEntries(vals.map((v, i) => [`x${i}`, { min: 0, max: 100, step: 1, value: v, slider: false }]));
const dotVals = (p, n) => Array.from({ length: n }, (_, i) => p[`x${i}`]);

// standard normal CDF via an erf approximation (Abramowitz–Stegun 7.1.26)
const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
const pdf = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

// a bomber seen from above; hits land anywhere, but hits on the engines or cockpit bring the plane down
const PLANE_ENG = [[-3.1, 0.35], [-1.7, 0.45], [1.7, 0.45], [3.1, 0.35]];
const inPlane = (x, y) => (x * x) / 0.42 ** 2 + (y * y) / 4.2 ** 2 <= 1 || (Math.abs(x) <= 4.6 && y >= -0.5 + 0.15 * Math.abs(x) && y <= 0.9 - 0.12 * Math.abs(x)) || (Math.abs(x) <= 1.6 && y >= -3.9 && y <= -3.2);
const lethal = (x, y) => PLANE_ENG.some(([ex, ey]) => (x - ex) ** 2 + (y - ey) ** 2 <= 0.34 ** 2) || (x * x + (y - 3.3) ** 2 <= 0.42 ** 2);
const PLANE_HITS = (() => {
  let a = 424242;
  const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, () => {
    const hits = [];
    while (hits.length < 4) { const x = -4.6 + 9.2 * rnd(), y = -4.2 + 8.4 * rnd(); if (inPlane(x, y)) hits.push([x, y]); }
    return { hits, lost: hits.some(([x, y]) => lethal(x, y)) };
  });
})();

export default {
  id: 'statistics',
  subject: 'math',
  title: 'Statistics',
  level: 'Intermediate',
  cover: 'statistics',
  tagline: 'Averages, spread, bell curves, percentiles, correlation and bias: making sense of data.',
  description: r`Data is everywhere, and so are misleading numbers. Learn which "average" to trust, measure spread, see bell curves emerge from randomness, understand margins of error, avoid the classic traps of correlation and Simpson's paradox, place values with z-scores and box plots, and spot biased samples.`,
  prereq: 'Probability',
  chapters: [
    {
      title: 'Describing Data',
      summary: 'Centres and spreads.',
      lessons: [
        {
          id: 'averages',
          title: 'Which Average?',
          summary: 'Mean, median and outliers',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Average salary',
              body: r`A small company has 9 employees earning \$40,000 each, and a CEO earning \$1,000,000.`,
              prompt: 'Which number best describes a typical salary at this company?',
              choices: [
                { t: r`The median: \$40,000`, ok: true },
                { t: r`The mean: \$136,000`, why: 'The mean is pulled way up by one huge salary. Nine out of ten people earn far less than it.' },
                { t: 'They describe it equally well', why: 'One extreme value (an outlier) drags the mean far from what is typical.' },
              ],
              explain: r`The **mean** is $\frac{9 \times 40{,}000 + 1{,}000{,}000}{10} = \$136{,}000$, yet nobody except the CEO earns anywhere near that. The **median** (the middle value when sorted) is \$40,000. Medians resist outliers.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Drag the data',
              body: r`Drag the dots. Watch the {blue:mean} and the {coral:median}. Try dragging one dot far to the right.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 105, ymin: -0.5, ymax: 2, grid: false, height: 200, axes: { xticks: 10, yticks: 100 },
                params: dotParams([22, 35, 41, 47, 52, 60, 68]),
                points: Array.from({ length: 7 }, (_, i) => ({ x: (p) => p[`x${i}`], y: () => 0.6, drag: { x: `x${i}` }, color: 'ink', r: 9 })),
                extra: ({ plot, p, s }) => {
                  const v = dotVals(p, 7), m = mean(v), md = median(v);
                  return [
                    s('line', { x1: plot.X(m), x2: plot.X(m), y1: plot.Y(1.7), y2: plot.Y(-0.1), stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(md), x2: plot.X(md), y1: plot.Y(1.7), y2: plot.Y(-0.1), stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
                    s('text', { x: plot.X(m), y: plot.Y(1.8), 'text-anchor': 'middle', class: 'lbl fl-blue', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'mean' }),
                    s('text', { x: plot.X(md), y: plot.Y(1.35), 'text-anchor': 'middle', class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'median' }),
                  ];
                },
                readout: (p) => { const v = dotVals(p, 7); return r`mean $= ${f1(mean(v))}$, $\quad$ median $= ${f1(median(v))}$`; },
              },
              after: r`One extreme dot drags the mean a long way, but the median only moves if the dot crosses the middle. Use the median for skewed data like incomes or house prices.`,
            },
            {
              type: 'numeric',
              title: 'Find the median',
              prompt: r`What is the median of $7, 2, 9, 4, 12, 5$?`,
              answer: 6,
              wrong: [{ v: 4, why: r`Sort first: $2, 4, 5, 7, 9, 12$. With an even count, average the middle two.` }, { v: 6.5, why: r`That's the mean. The median is the middle of the sorted list: $\frac{5 + 7}{2}$.` }],
              explain: r`Sorted: $2, 4, 5, 7, 9, 12$. With an even number of values, the median is the average of the two middle ones: $\frac{5 + 7}{2} = 6$.`,
            },
            {
              type: 'numeric',
              title: 'The missing number',
              prompt: r`Five numbers have a mean of 8. Four of them are 6, 7, 9 and 10. What is the fifth?`,
              answer: 8,
              wrong: [{ v: 9, why: r`The total must be $5 \times 8 = 40$; the four known numbers already make 32.` }],
              explain: r`The five numbers must total $5 \times 8 = 40$. The four known ones add to 32, so the fifth is 8. Thinking in **totals** is the fastest way through mean problems.`,
            },
            {
              type: 'numeric',
              title: 'The mode',
              prompt: r`The **mode** is the most common value. What is the mode of $2, 3, 3, 5, 7, 7, 7, 9$?`,
              answer: 7,
              explain: r`7 appears three times, more than any other value. The mode is the only average that works for categories, like the most popular shoe size or favourite colour.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Raise the average',
              prompt: 'Your first four test scores average 80. What do you need on the fifth test to bring your average up to 84?',
              answer: 100,
              wrong: [{ v: 84, why: r`You need a total of $5 \times 84 = 420$, and you have $4 \times 80 = 320$ so far.` }, { v: 88, why: r`The total must be 420. Your current total is 320.` }],
              explain: r`You need a total of $5 \times 84 = 420$. You have $4 \times 80 = 320$, so you need $420 - 320 = 100$. Means are about totals.`,
            },
          ],
          recap: [
            'Mean = total ÷ count. Median = the middle value when sorted.',
            'Outliers drag the mean but barely move the median.',
            'For skewed data (incomes, house prices) the median is often the more honest summary.',
          ],
        },
        {
          id: 'spread',
          title: 'Spread',
          summary: 'Standard deviation',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Same average, different story',
              body: r`Two cities both average 15 °C over a year. City A ranges from 12 °C to 18 °C. City B swings from −10 °C to 40 °C.`,
              prompt: 'What does the average fail to tell you?',
              cols: 2,
              choices: [
                { t: 'How spread out the values are', ok: true },
                { t: 'The typical temperature', why: 'Both have the same typical (average) value. They differ in how much they vary.' },
              ],
              explain: r`A centre (mean or median) is only half the picture. You also need a measure of **spread**: how far values typically are from the centre.`,
            },
            {
              type: 'explain',
              title: 'Standard deviation',
              body: r`The **standard deviation** $\sigma$ measures typical distance from the mean:
1. Find each value's distance from the mean.
2. Square the distances (this removes the signs) and average them. That's the **variance**.
3. Take the square root, to get back to the original units.
$$\sigma = \sqrt{\frac{1}{n}\sum (x_i - \bar x)^2}$$
Drag the dots and watch $\sigma$.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 105, ymin: -0.5, ymax: 2, grid: false, height: 200, axes: { xticks: 10, yticks: 100 },
                params: dotParams([40, 45, 50, 50, 55, 60]),
                points: Array.from({ length: 6 }, (_, i) => ({ x: (p) => p[`x${i}`], y: () => 0.6, drag: { x: `x${i}` }, color: 'ink', r: 9 })),
                extra: ({ plot, p, s }) => {
                  const v = dotVals(p, 6), m = mean(v), sg = sd(v);
                  return [
                    s('rect', { x: plot.X(m - sg), y: plot.Y(1.6), width: plot.X(m + sg) - plot.X(m - sg), height: plot.Y(0) - plot.Y(1.6), class: 'fl-violet', opacity: 0.15 }),
                    s('line', { x1: plot.X(m), x2: plot.X(m), y1: plot.Y(1.7), y2: plot.Y(-0.1), stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('text', { x: plot.X(m), y: plot.Y(1.8), 'text-anchor': 'middle', class: 'lbl fl-violet', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'mean ± σ' }),
                  ];
                },
                readout: (p) => { const v = dotVals(p, 6); return r`mean $= ${f1(mean(v))}$, $\quad \sigma = ${f1(sd(v))}$`; },
              },
            },
            {
              type: 'numeric',
              title: 'Compute σ',
              prompt: r`What is the standard deviation of $2, 4, 4, 4, 5, 5, 7, 9$? (Their mean is 5.)`,
              answer: 2,
              wrong: [{ v: 4, why: r`That's the variance. Take the square root.` }, { v: 1.5, why: r`Squared distances: $9, 1, 1, 1, 0, 0, 4, 16$, with total 32. Average: 4. Square root: 2.` }],
              explain: r`Distances from 5: $-3, -1, -1, -1, 0, 0, 2, 4$. Squared: $9, 1, 1, 1, 0, 0, 4, 16$, with total 32. Variance $= 32/8 = 4$, so $\sigma = 2$.`,
            },
            {
              type: 'numeric',
              title: 'Scaling the data',
              prompt: r`A data set has standard deviation 2. Every value is multiplied by 3. What is the new standard deviation?`,
              answer: 6,
              wrong: [{ v: 18, why: r`Multiplying by 3 triples each distance from the mean, so σ triples (it’s the variance that grows ninefold).` }, { v: 2, why: r`Multiplying (unlike adding a constant) does change the spread.` }],
              explain: r`Multiplying every value by 3 stretches all the distances from the mean by 3, so $\sigma$ becomes $3 \times 2 = 6$ (and the variance becomes $9 \times 4 = 36$). Converting units, like metres to centimetres, scales $\sigma$ the same way.`,
            },
            {
              type: 'numeric',
              title: 'A z-score',
              prompt: r`A test has mean 70 and standard deviation 10. How many standard deviations above the mean is a score of 85?`,
              answer: 1.5,
              tol: 0.001,
              explain: r`$\frac{85 - 70}{10} = 1.5$. Measuring in standard deviations (a **z-score**) lets you compare results from tests with different scales.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Add a constant',
              prompt: 'Every student gets 5 bonus points on a test. What happens to the mean and the standard deviation?',
              choices: [
                { t: 'The mean goes up 5. σ stays the same', ok: true },
                { t: 'Both go up by 5', why: 'Shifting every value by the same amount doesn’t change how spread out they are.' },
                { t: 'Neither changes', why: 'The mean shifts up with every score.' },
              ],
              explain: r`Adding a constant slides the whole dataset along without changing the gaps between values. The mean moves, the spread doesn't. (Multiplying every value by 2 would double both.)`,
            },
          ],
          recap: [
            'Spread matters as much as the centre.',
            r`Standard deviation $\sigma$ = square root of the average squared distance from the mean.`,
            'Shifting all values moves the mean but not σ. Scaling all values scales both.',
          ],
        },
      ],
    },
    {
      title: 'Distributions and Samples',
      summary: 'Bell curves and margins of error.',
      lessons: [
        {
          id: 'normal',
          title: 'The Bell Curve',
          summary: 'Normal distributions',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Add up dice',
              body: r`Roll **five** dice and add them. Do this many times and look at the shape of the results.`,
              widget: {
                kind: 'sampler', outcomes: D5.map((_, i) => String(i + 5)), probs: D5,
                trial: () => { let t = 0; for (let i = 0; i < 5; i++) t += Math.floor(Math.random() * 6); return t; },
                batches: [1, 10, 100, 1000], oneLabel: 'Roll 5', color: 'violet', ymax: 0.12, height: 220,
              },
              after: r`A **bell-shaped** curve appears, even though each single die is completely flat (every face equally likely). Adding up many random effects tends to produce this **normal distribution**. That's the **central limit theorem**, and it's why bell curves are everywhere: heights, measurement errors, test scores.`,
            },
            {
              type: 'explain',
              title: 'The 68–95–99.7 rule',
              body: r`For a normal distribution with mean $\mu$ and standard deviation $\sigma$:
- about **68%** of values fall within $1\sigma$ of the mean,
- about **95%** within $2\sigma$,
- about **99.7%** within $3\sigma$.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 4, ymin: 0, ymax: 0.45, grid: 1, gridY: 0.1, height: 260, axes: { xlabel: 'σ from mean', ylabel: '', yticks: 10 },
                params: { k: { min: 1, max: 3, step: 1, value: 2, label: 'within', color: 'violet', format: (v) => `${v}σ` } },
                curves: [{ f: (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), color: 'violet' }],
                extra: ({ plot, p, s }) => {
                  const pts = [];
                  for (let i = 0; i <= 80; i++) { const x = -p.k + (2 * p.k * i) / 80; pts.push([x, Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)]); }
                  return [s('path', { d: `M${plot.X(-p.k)} ${plot.Y(0)} ` + pts.map(([x, y]) => `L${plot.X(x)} ${plot.Y(y)}`).join(' ') + ` L${plot.X(p.k)} ${plot.Y(0)} Z`, class: 'fl-violet', opacity: 0.25 })];
                },
                readout: (p) => r`within $${p.k}\sigma$: about $${{ 1: '68.3', 2: '95.4', 3: '99.7' }[p.k]}\%$`,
              },
            },
            {
              type: 'numeric',
              title: 'Heights',
              prompt: 'Adult heights in a population are roughly normal, with mean 170 cm and σ = 7 cm. About what percentage of adults are between 163 cm and 177 cm?',
              unit: '%',
              answer: 68,
              tol: 1,
              wrong: [{ v: 95, why: r`163 to 177 is $170 \pm 7$: just one $\sigma$ either side.` }, { v: 50, why: r`That range is $\pm 1\sigma$, which holds about 68%.` }],
              explain: r`$163$ to $177$ is $170 \pm 7 = \mu \pm 1\sigma$, so about 68%.`,
            },
            {
              type: 'numeric',
              title: 'Very high scores',
              prompt: r`IQ scores are designed to follow a normal distribution with mean 100 and standard deviation 15. Using the 68–95–99.7 rule, roughly what percentage of people score **above 130**?`,
              unit: '%',
              answer: 2.5,
              tol: 0.1,
              wrong: [{ v: 5, why: r`That’s both tails together. Only half of them are above 130.` }, { v: 16, why: r`That’s the fraction above 1σ (115).` }],
              explain: r`130 is 2 standard deviations above the mean. About 95% of people lie within 2σ, so 5% lie outside, split equally: about **2.5%** above 130 (and 2.5% below 70).`,
            },
            {
              type: 'numeric',
              title: 'One standard deviation up',
              prompt: r`IQ scores are designed to have mean 100 and standard deviation 15. Roughly 16% of people score above what value?`,
              answer: 115,
              explain: r`68% lie within one standard deviation, so 16% lie above $100 + 15 = 115$ (and 16% below 85). About 2.5% score above 130.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A lopsided range',
              prompt: 'Back to adult heights (mean 170 cm, σ = 7 cm). About what percentage of adults are between 156 cm and 177 cm?',
              unit: '%',
              answer: 81.5,
              tol: 0.6,
              wrong: [{ v: 68, why: r`156 is $2\sigma$ below the mean, not $1\sigma$: split the range at the mean and do each side separately.` }, { v: 95, why: r`177 is only $1\sigma$ above the mean.` }],
              explain: r`$156 = \mu - 2\sigma$ and $177 = \mu + 1\sigma$. By symmetry, half of the 95% lies between $\mu - 2\sigma$ and $\mu$: 47.5%. Half of the 68% lies between $\mu$ and $\mu + \sigma$: 34%. Together, about **81.5%**. Splitting at the mean like this handles any range built from whole numbers of $\sigma$.`,
            },
          ],
          recap: [
            'Sums of many random effects tend toward a bell curve (the central limit theorem).',
            '68–95–99.7: the share of values within 1, 2 and 3 standard deviations of the mean.',
            'Use symmetry for one-sided questions: split the outside share between the two tails.',
          ],
        },
        {
          id: 'sampling',
          title: 'Polls & Margins of Error',
          summary: 'How big a sample?',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Asking a few',
              prompt: 'A poll asks 1000 randomly chosen voters out of 50 million. Can that tell you anything reliable about all 50 million?',
              choices: [
                { t: 'Yes, within a few percentage points, if the sample is truly random', ok: true },
                { t: 'No: 1000 is a tiny fraction of 50 million', why: 'Surprisingly, the size of the population barely matters. What counts is the sample size, and whether it is random.' },
                { t: 'Only if they ask at least 1 million people', why: 'A random 1000 is already accurate to about ±3 points.' },
              ],
              explain: r`A random sample of 1000 pins down the true percentage to within about ±3 points, 95% of the time, whether the population is 50 thousand or 50 million. Like tasting soup: one spoonful tells you about the whole pot, **if it's well stirred**.`,
            },
            {
              type: 'explain',
              title: 'Margin of error',
              body: r`For a poll of $n$ random people, the 95% **margin of error** on a percentage is roughly
$$\pm \frac{1}{\sqrt{n}}$$
(as a fraction). Because of the square root, to halve the margin of error you need **four times** the sample.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4000, ymin: 0, ymax: 0.12, grid: 500, gridY: 0.02, height: 260, axes: { xlabel: 'sample size n', ylabel: 'margin', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { n: { min: 100, max: 4000, step: 100, value: 1000, label: '$n$', color: 'teal', format: (v) => `${v}` } },
                curves: [{ f: (x) => 1 / Math.sqrt(x), color: 'teal', from: () => 70 }],
                points: [{ x: (p) => p.n, y: (p) => 1 / Math.sqrt(p.n), color: 'teal' }],
                readout: (p) => r`$n = ${p.n}$: margin of error $\approx \pm ${f1(100 / Math.sqrt(p.n))}$ points`,
              },
            },
            {
              type: 'numeric',
              title: 'Sample of 400',
              prompt: 'Roughly what is the margin of error (in percentage points) for a random sample of 400 people?',
              unit: 'points',
              answer: 5,
              tol: 0.2,
              wrong: [{ v: 2.5, why: r`$\frac{1}{\sqrt{400}} = \frac{1}{20} = 5\%$.` }, { v: 0.25, why: 'That uses 1/400. The margin is 1/√400 = 1/20.' }],
              explain: r`$\frac{1}{\sqrt{400}} = \frac{1}{20} = 0.05$, so about ±5 percentage points.`,
            },
            {
              type: 'numeric',
              title: 'A bigger poll',
              prompt: r`For a poll of $n$ people, the 95% margin of error is roughly $\frac{1}{\sqrt n}$. What is it for a poll of 1,600 people, in percentage points?`,
              unit: '%',
              answer: 2.5,
              tol: 0.05,
              wrong: [{ v: 1.25, tol: 0.01, why: r`$\sqrt{1600} = 40$, so $\frac{1}{40} = 0.025 = 2.5\%$.` }],
              explain: r`$\frac{1}{\sqrt{1600}} = \frac{1}{40} = 2.5\%$. Quadrupling the sample from 400 to 1,600 only halves the margin of error, from 5% to 2.5%: precision is expensive.`,
            },
            {
              type: 'numeric',
              title: 'Plus or minus one percent',
              prompt: r`The margin of error of a poll is roughly $\frac{1}{\sqrt n}$. About how many people must be polled for a margin of ±1%?`,
              answer: 10000,
              explain: r`$\frac{1}{\sqrt n} = 0.01$ gives $n = 10{,}000$. Halving the margin of error always needs four times the sample, which is why most polls settle for about ±3% (around 1,000 people).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The famous flop',
              body: r`In 1936, the *Literary Digest* polled 2.4 million readers, car owners and telephone users, and predicted a landslide win for Alf Landon. A much smaller, more careful poll by George Gallup correctly predicted that Franklin Roosevelt would win.`,
              prompt: 'Why did the giant poll fail?',
              choices: [
                { t: 'Its sample was biased: in 1936, car and phone owners were wealthier than average voters', ok: true },
                { t: 'It wasn’t big enough', why: '2.4 million is enormous. Size can’t fix a biased sample.' },
                { t: 'Random sampling doesn’t work for elections', why: 'Random samples work well. This one wasn’t random.' },
              ],
              explain: r`A big **biased** sample is worse than a small random one. The margin-of-error formula only covers random chance, not systematic bias. Roosevelt won in a landslide, and Gallup became famous.`,
            },
          ],
          recap: [
            'A random sample can describe a huge population. The population size barely matters.',
            r`Margin of error is about $\pm 1/\sqrt{n}$. To halve it, quadruple the sample.`,
            'Bias beats size: a large non-random sample can be badly wrong.',
          ],
        },
      ],
    },
    {
      title: 'Relationships',
      summary: 'Correlation, causation and paradoxes.',
      lessons: [
        {
          id: 'correlation',
          title: 'Correlation',
          summary: 'Not causation',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Scatter plots',
              body: r`Each dot is one person, with two measurements. The **correlation coefficient** $r$, between $-1$ and $1$, measures how closely the dots follow a straight line. Slide it.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.2, xmax: 3.2, ymin: -3.2, ymax: 3.2, grid: 1, axes: false, maxWidth: 440,
                params: { rr: { min: -1, max: 1, step: 0.1, value: 0.7, label: '$r$', color: 'blue', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => PAIRS.map(([a, b]) => {
                  const y = p.rr * a + Math.sqrt(Math.max(0, 1 - p.rr * p.rr)) * b;
                  return s('circle', { cx: plot.X(Math.max(-3, Math.min(3, a))), cy: plot.Y(Math.max(-3, Math.min(3, y))), r: 5, class: 'fl-blue', opacity: 0.7 });
                }),
                readout: (p) => (Math.abs(p.rr) < 0.15 ? r`$r \approx 0$: no linear relationship` : p.rr > 0 ? r`$r = ${p.rr.toFixed(1)}$: as one goes up, the other tends to go up` : r`$r = ${p.rr.toFixed(1)}$: as one goes up, the other tends to go down`),
              },
            },
            {
              type: 'mcq',
              title: 'Ice cream and drowning',
              body: r`In many places, ice cream sales and drowning deaths are positively correlated: months with more ice cream sales have more drownings.`,
              prompt: 'What’s the best explanation?',
              choices: [
                { t: 'A third factor, hot weather, drives both', ok: true },
                { t: 'Eating ice cream makes people drown', why: 'There’s no plausible mechanism. Look for something that causes both.' },
                { t: 'Drownings make people buy ice cream', why: 'The direction makes no sense. A hidden third factor is at work.' },
              ],
              explain: r`Hot weather brings both more ice cream **and** more swimming. That's a **confounding variable**. Correlation tells you two things move together. It doesn't tell you why.`,
            },
            {
              type: 'mcq',
              title: 'What r measures',
              prompt: r`Data points lie exactly on the curve $y = x^2$, for $x$ from $-3$ to $3$. What is their correlation coefficient $r$?`,
              choices: [
                { t: 'About 0', ok: true },
                { t: 'Close to 1', why: r`$r$ measures **straight-line** relationships. Here $y$ rises on both sides, so a straight line fits terribly.` },
                { t: 'Close to −1', why: 'The left half goes down and the right half goes up. Overall there’s no linear trend.' },
              ],
              explain: r`The relationship is perfect, yet $r \approx 0$, because $r$ only detects **linear** patterns. Always plot your data before trusting a single summary number.`,
            },
            {
              type: 'mcq',
              title: 'A negative correlation',
              prompt: r`Across many cars, engine size and fuel economy (km per litre) have a correlation of $r = -0.8$. What does that mean?`,
              choices: [
                { t: r`Bigger engines tend fairly strongly to go fewer km per litre`, ok: true },
                { t: r`Bigger engines always go exactly 0.8 km less per litre`, why: r`$r$ measures how tightly points cluster around a line, not the slope of the line.` },
                { t: r`There’s almost no relationship`, why: r`$|r| = 0.8$ is a strong relationship. The minus sign gives its direction.` },
              ],
              explain: r`The sign gives the direction (negative: one goes up as the other goes down) and the size, between 0 and 1, gives the strength of the **linear** pattern. $r$ says nothing about the slope, and nothing about cause.`,
            },
            {
              type: 'numeric',
              title: 'Variance explained',
              prompt: r`Two variables have correlation $r = 0.7$. The fraction of the variation in one that is "explained" by a straight-line relationship with the other is $r^2$. What percentage is that?`,
              unit: '%',
              answer: 49,
              tol: 0.5,
              explain: r`$0.7^2 = 0.49$: 49%. A correlation that sounds strong still leaves half the variation unexplained, and $r = 0.3$ explains only 9%.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How to show causation',
              prompt: 'What is the most reliable way to show that a new medicine actually causes recovery?',
              choices: [
                { t: 'A randomized controlled trial: randomly assign patients to get the medicine or a placebo', ok: true },
                { t: 'Find that people who take it recover more often', why: 'People who choose to take it might differ in other ways, such as being healthier or richer.' },
                { t: 'Ask doctors whether it works', why: 'Expert opinion is useful, but it’s no substitute for controlled evidence.' },
              ],
              explain: r`Random assignment balances out every other factor (known **and** unknown) between the two groups. So any difference in outcomes can be credited to the medicine. That's why randomized trials are the gold standard.`,
            },
          ],
          recap: [
            r`The correlation $r$ (from $-1$ to $1$) measures how well the data fit a straight line.`,
            'Correlation is not causation: watch out for confounding variables.',
            'Randomized experiments can establish causation.',
          ],
        },
        {
          id: 'simpson',
          title: 'Simpson’s Paradox',
          summary: 'When the totals lie',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              kicker: 'A real study',
              title: 'Kidney stones',
              body: r`A 1986 medical study compared two treatments for kidney stones:

| | Treatment A | Treatment B |
|---|---|---|
| Small stones | 81 / 87 (93%) | 234 / 270 (87%) |
| Large stones | 192 / 263 (73%) | 55 / 80 (69%) |
| **All patients** | 273 / 350 (78%) | 289 / 350 (83%) |

Look carefully at each row.`,
            },
            {
              type: 'mcq',
              title: 'Which is better?',
              prompt: 'Treatment A is better for small stones AND better for large stones. But B looks better overall. Which treatment is actually better?',
              choices: [
                { t: 'Treatment A', ok: true },
                { t: 'Treatment B: the overall numbers say so', why: 'The overall comparison is misleading, because the two treatments were given to very different mixes of patients.' },
                { t: 'They’re the same', why: 'A wins in both groups.' },
              ],
              explain: r`A is better for every type of patient. The overall numbers flip because A was mostly given for **large** stones, the harder cases (263 of its 350 patients), while B mostly got the **easy** small stones (270 of 350). Lumping everyone together hides that.`,
            },
            {
              type: 'explain',
              title: 'Simpson’s paradox',
              body: r`A trend that appears in every group can **reverse** when the groups are combined, if the groups have very different sizes and baseline rates. This is called **Simpson's paradox**.

The cure is to ask: *what else differs between the groups being compared?* Here, stone size affected both the choice of treatment and the chance of success: a confounding variable, again.`,
            },
            {
              type: 'mcq',
              title: 'Berkeley, 1973',
              prompt: r`In 1973, UC Berkeley admitted a lower percentage of women applicants than men overall, but within most individual departments, women were admitted at an equal or higher rate. How can both be true?`,
              choices: [
                { t: r`Women applied more to competitive departments with low admission rates for everyone`, ok: true },
                { t: r`The figures must contain a mistake`, why: r`Both are correct: it’s a classic example of Simpson’s paradox.` },
                { t: r`Departments favoured men while the university favoured women`, why: r`Within departments the rates for women were similar or higher. The overall gap came from where people applied.` },
              ],
              explain: r`Overall rates mix together departments with very different acceptance rates. Because women applied more to departments that were hard for everyone to get into, their overall rate was lower even though no department admitted them at a lower rate. The lurking variable is **department**.`,
            },
            {
              type: 'interactive',
              title: 'Make the reversal happen',
              body: r`Treatment A succeeds 93% of the time on small kidney stones and 73% on large ones; treatment B 87% and 69%. A is better for **both** kinds. B’s patients are 25% large-stone cases. Increase the share of hard (large-stone) cases given A, and find the **smallest** share at which A’s overall success rate falls below B’s.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0.6, ymax: 1, grid: false, axes: { ylabel: 'overall success rate', yticks: 0.1, xticks: 20, yfmt: (v) => `${Math.round(v * 100)}%` }, maxWidth: 440, height: 280,
                params: { sA: { min: 0, max: 1, step: 0.01, value: 0.3, label: 'A’s share of large stones', color: 'coral', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => { const A = 0.93 * (1 - p.sA) + 0.73 * p.sA, B = 0.87 * 0.75 + 0.69 * 0.25; return [[A, 2, 'coral', 'A'], [B, 6, 'blue', 'B']].flatMap(([v, x, c, t]) => [s('rect', { x: plot.X(x), y: plot.Y(v), width: plot.X(2) - plot.X(0), height: plot.Y(0.6) - plot.Y(v), rx: 4, class: `fl-${c}` }), s('text', { x: plot.X(x + 1), y: plot.Y(v) - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: `${t}: ${(100 * v).toFixed(1)}%` })]); },
                readout: (p) => { const A = 0.93 * (1 - p.sA) + 0.73 * p.sA, B = 0.825; return `A overall **${(100 * A).toFixed(1)}%** · B overall **${(100 * B).toFixed(1)}%** · ${A < B ? 'B looks better, though A wins in each group!' : 'A looks better'}`; },
                goal: (p) => Math.abs(p.sA - 0.53) < 0.001,
                hint: 'Solve 0.93 − 0.20 s = 0.825.',
                solution: { sA: 0.53 },
              },
              explain: r`Once more than about 53% of A’s patients have large stones, A’s overall rate drops below B’s 82.5%, even though A is better in both groups. The overall figures mostly reflect **who** got each treatment, not how good it is. Compare like with like before drawing conclusions.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Batting averages',
              body: r`Two baseball players over two seasons:
- **Year 1:** Derek hits 12 of 48 (.250), David hits 104 of 411 (.253).
- **Year 2:** Derek hits 183 of 582 (.314), David hits 45 of 140 (.321).

David has the better average in **both** years.`,
              prompt: 'What is Derek’s batting average over both years combined? (Give a decimal like 0.250.)',
              answer: 195 / 630,
              tol: 0.002,
              wrong: [{ v: 149 / 551, tol: 0.002, why: 'That’s David’s combined average. Derek hit 12 + 183 out of 48 + 582.' }, { v: 0.282, tol: 0.002, why: 'Don’t average the two percentages. Combine the hits and at-bats.' }],
              explain: r`Derek: $\frac{12 + 183}{48 + 582} = \frac{195}{630} \approx 0.310$. David: $\frac{104 + 45}{411 + 140} = \frac{149}{551} \approx 0.270$. David wins each year, but Derek wins overall: Simpson's paradox. Derek had most of his at-bats in his strong year. (This pattern really happened, with Derek Jeter and David Justice in 1995–96.)`,
            },
          ],
          recap: [
            'A trend in every group can reverse in the combined data: Simpson’s paradox.',
            'It happens when group sizes and baseline rates differ, usually because of a confounder.',
            'Always ask what else differs between the groups you’re comparing.',
          ],
        },
      ],
    },
    {
      title: 'Positions and Pitfalls',
      summary: 'Where a value stands, and where samples mislead.',
      lessons: [
        {
          id: 'zscores',
          title: 'Percentiles & z-Scores',
          summary: 'How unusual is a value?',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Standard units',
              body: r`To compare values from different scales, measure how many standard deviations each is from its mean: its **z-score**,
$$z = \frac{x - \mu}{\sigma}$$
A z-score of 2 means "two standard deviations above average", whatever the units. For normally distributed data, a z-score tells you the **percentile**: the percentage of values below it.`,
            },
            {
              type: 'numeric',
              title: 'An IQ score',
              prompt: r`IQ tests are scaled to have mean 100 and standard deviation 15. What's the z-score of an IQ of 130?`,
              answer: 2,
              wrong: [{ v: 30, why: 'That’s the difference from the mean. Divide by the standard deviation.' }, { v: 8.67, tol: 0.05, why: r`$z = \frac{130 - 100}{15}$.` }],
              explain: r`$z = \frac{130 - 100}{15} = 2$: two standard deviations above average, which by the 68–95–99.7 rule is roughly the top 2.5%.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The top ten percent',
              prompt: r`Drag the point along the axis to the z-score that has **90%** of the area to its left (the 90th percentile).`,
              widget: {
                kind: 'graph', xmin: -3.5, xmax: 3.5, ymin: 0, ymax: 0.45, grid: 0.5, gridY: 0.1, height: 260, axes: { xlabel: 'z', ylabel: '', yfmt: () => '' },
                params: { z: { min: -3, max: 3, step: 0.01, value: 0.5, slider: false } },
                curves: [{ f: (z) => pdf(z), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.z, y: () => 0, drag: { x: 'z' }, color: 'coral', r: 8 }],
                extra: ({ plot, p, s }) => {
                  const pts = [`M${plot.X(-3.5)} ${plot.Y(0)}`];
                  for (let z = -3.5; z <= p.z; z += 0.05) pts.push(`L${plot.X(z)} ${plot.Y(pdf(z))}`);
                  pts.push(`L${plot.X(p.z)} ${plot.Y(pdf(p.z))} L${plot.X(p.z)} ${plot.Y(0)} Z`);
                  return [s('path', { d: pts.join(' '), class: 'fl-violet', opacity: 0.25 })];
                },
                readout: (p) => r`$z = ${p.z.toFixed(2)}$: $${(100 * Phi(p.z)).toFixed(1)}\%$ of values lie below`,
                goal: (p) => Math.abs(Phi(p.z) - 0.9) < 0.003,
                hint: 'The shaded area must be 90%. It’s a little more than one standard deviation above the mean.',
                solution: { z: 1.28 },
              },
              explain: r`$z \approx 1.28$. So the top 10% of any normal distribution starts about 1.28 standard deviations above the mean. Statisticians once read such values from printed tables; now software does it.`,
            },
            {
              type: 'numeric',
              title: 'An IQ cut-off',
              prompt: r`What IQ score marks the top 10%? (Mean 100, SD 15, $z = 1.28$; nearest whole number.)`,
              answer: 119,
              tol: 0.6,
              wrong: [{ v: 90, why: 'The top 10% is above the mean.' }, { v: 128, why: r`$100 + 1.28 \times 15$, not $100 + 28$.` }],
              explain: r`$x = \mu + z\sigma = 100 + 1.28 \times 15 \approx 119$.`,
            },
            {
              type: 'explain',
              title: 'Box plots',
              body: r`When data aren't normal, quartiles describe them without assuming a shape:
- $Q_1$ (25th percentile), the median (50th) and $Q_3$ (75th) split the data into four equal groups.
- The **interquartile range** $\text{IQR} = Q_3 - Q_1$ covers the middle half.
- A common rule flags values more than $1.5 \times \text{IQR}$ beyond the quartiles as possible **outliers**.

A **box plot** draws the box from $Q_1$ to $Q_3$, a line at the median, and whiskers out to the furthest non-outliers.`,
            },
            {
              type: 'numeric',
              title: 'An outlier?',
              prompt: r`Commute times have $Q_1 = 20$ minutes and $Q_3 = 30$ minutes. Above what time would a commute be flagged as an outlier?`,
              unit: 'min',
              answer: 45,
              wrong: [{ v: 35, why: r`The IQR is 10, so the fence is $Q_3 + 1.5 \times 10$.` }, { v: 40, why: r`$1.5 \times \text{IQR}$, not $1 \times$.` }],
              explain: r`IQR $= 30 - 20 = 10$; upper fence $= 30 + 15 = 45$ minutes. A 60-minute commute would show as a separate dot beyond the whisker.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Who did better?',
              prompt: r`Asha scored 80 on a test with mean 70 and SD 5. Ben scored 90 on a different test with mean 80 and SD 10. Relative to their classmates, who did better?`,
              choices: [
                { t: 'Asha: her z-score is 2, Ben’s is 1', ok: true },
                { t: 'Ben: he scored higher', why: 'Raw scores on different tests can’t be compared directly.' },
                { t: 'They did equally well: both are 10 above the mean', why: 'Asha’s 10 points is two standard deviations; Ben’s is only one.' },
              ],
              explain: r`Asha: $\frac{80 - 70}{5} = 2$; Ben: $\frac{90 - 80}{10} = 1$. Asha is around the 98th percentile of her class, Ben around the 84th. z-scores put different scales on a common footing.`,
            },
          ],
          recap: [
            r`z-score: $z = (x - \mu)/\sigma$, the number of standard deviations from the mean.`,
            'For normal data, z determines the percentile (z = 1.28 is the 90th).',
            'Quartiles, IQR and the 1.5 × IQR rule describe any data and flag outliers.',
          ],
        },
        {
          id: 'bias',
          title: 'Biased Samples',
          summary: 'When the data you see isn’t the whole story',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The returning planes',
              prompt: r`In World War II, analysts studied bombers returning from missions and marked where they'd been hit by bullets. Most holes were in the wings and fuselage, few in the engines. Where should extra armour go?`,
              choices: [
                { t: 'On the engines: planes hit there mostly didn’t come back to be counted', ok: true },
                { t: 'On the wings and fuselage, where the holes are', why: 'Those planes survived their hits. The missing data is from planes that didn’t return.' },
                { t: 'Evenly everywhere', why: 'The pattern of holes is informative, just not in the obvious way.' },
              ],
              explain: r`The statistician Abraham Wald pointed out that the sample only contained **survivors**. Holes in returning planes show where a plane can be hit and still fly home. This is **survivorship bias**: drawing conclusions from the examples that made it through a filter.`,
            },
            { /*anim:statistics*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Holes in the data',
              body: r`Planes fly out, and each one is hit in 4 random places. A hit on an {amber:engine} or the cockpit brings the plane down; anywhere else it limps home. The analysts only see holes on the planes that come back.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -4.6, ymax: 4.6, grid: false, axes: false, maxWidth: 400,
                animate: { param: 't', speed: 3, max: 76, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const n = Math.min(70, Math.floor(p.t)), els = [];
                  const poly = (pts, o) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', ...o });
                  els.push(poly([[-4.6, 0.9 - 0.12 * 4.6], [0, 0.9], [4.6, 0.9 - 0.12 * 4.6], [4.6, -0.5 + 0.15 * 4.6], [0, -0.5], [-4.6, -0.5 + 0.15 * 4.6]], { class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(poly([[-1.6, -3.2], [1.6, -3.2], [1.6, -3.9], [-1.6, -3.9]], { class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: plot.X(0.42) - plot.X(0), ry: plot.Y(0) - plot.Y(4.2), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  PLANE_ENG.forEach(([x, y]) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: plot.X(0.34) - plot.X(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 1.5 })));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(3.3), r: plot.X(0.42) - plot.X(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 1.5 }));
                  PLANE_HITS.slice(0, n).forEach((pl) => { if (!pl.lost) pl.hits.forEach(([x, y]) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 3.5, class: 'fl-coral' }))); });
                  return els;
                },
                readout: (p) => { const n = Math.min(70, Math.floor(p.t)), back = PLANE_HITS.slice(0, n).filter((pl) => !pl.lost).length; return `planes sent: ${n} · came back: ${back} · holes recorded: ${4 * back}`; },
              },
              after: r`The returning planes are riddled with holes on the wings, body and tail, and almost none on the engines or cockpit. It's tempting to add armour where the holes are. The statistician Abraham Wald pointed out the opposite: planes **were** hit on the engines just as often, but those planes never came back to be counted. The missing holes mark exactly where armour is needed. That's **survivorship bias**: studying only the survivors.`,
            },
            {
              type: 'mcq',
              title: 'Old buildings',
              prompt: r`"Buildings made 200 years ago were built to last; modern ones aren't." What's the flaw?`,
              choices: [
                { t: 'Survivorship bias: the poorly built old buildings have already fallen down or been demolished', ok: true },
                { t: 'There’s no flaw', why: 'We only see the old buildings that survived; the rest are gone.' },
                { t: 'Modern buildings are older', why: 'The issue is which old buildings remain to be seen.' },
              ],
              explain: r`The same trap catches "music was better in my day" (the forgettable songs are forgotten) and stories of college dropouts who became billionaires (we don't hear from the many who didn't).`,
            },
            {
              type: 'explain',
              title: 'Kinds of bias',
              body: r`A sample can mislead in several ways, however large it is:
- **Selection bias:** some groups are more likely to be included (an online poll reaches only internet users who choose to answer).
- **Non-response bias:** the people who don't respond differ from those who do.
- **Response bias:** questions are worded so that answers are pushed one way, or people give the answer they think is socially acceptable.

A huge biased sample is no better than a small one, and can be worse because it looks convincing.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Reweight the poll',
              prompt: r`A phone poll reached mostly older people: 70% of respondents were over 60, but only 40% of voters are. Support for a policy is 30% among over-60s and 70% among under-60s. Set the weight of the over-60 group so the estimate matches the real population.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.1, gridY: 0.1, height: 250, axes: { xlabel: 'share of over-60s counted in the estimate', ylabel: 'estimated support', xfmt: (v) => `${Math.round(v * 100)}%`, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { w: { min: 0, max: 1, step: 0.05, value: 0.7, slider: false } },
                curves: [{ f: (w) => 0.3 * w + 0.7 * (1 - w), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.w, y: (p) => 0.3 * p.w + 0.7 * (1 - p.w), drag: { x: 'w' }, color: 'coral' }],
                readout: (p) => r`counting over-60s as $${Math.round(p.w * 100)}\%$: estimated support $${Math.round(100 * (0.3 * p.w + 0.7 * (1 - p.w)))}\%$ ${Math.abs(p.w - 0.7) < 1e-6 ? '(the raw, unweighted poll)' : ''}`,
                goal: (p) => Math.abs(p.w - 0.4) < 1e-6,
                hint: 'Match the population: what share of voters are over 60?',
                solution: { w: 0.4 },
              },
              explain: r`Weighting over-60s to their true 40% share gives $0.4 \times 30\% + 0.6 \times 70\% = 54\%$ support, compared with 42% in the raw poll: the difference between "minority" and "majority". Pollsters routinely weight by age, sex, region and education, though weighting can't fix differences they don't know about.`,
            },
            {
              type: 'numeric',
              title: 'A volunteer survey',
              prompt: r`A magazine asks readers to mail in whether they're happy with their marriage. 10,000 respond, and 70% say they're unhappy. Ignoring bias, what's the margin of error for a sample this size? ($\approx \frac{1}{\sqrt n}$, as a percentage, 1 decimal place.)`,
              unit: '%',
              answer: 1,
              tol: 0.05,
              wrong: [{ v: 0.01, tol: 0.001, why: 'Express it as a percentage.' }],
              explain: r`$\frac{1}{\sqrt{10{,}000}} = 1\%$. Impressively small, but meaningless here: people with strong feelings are far more likely to write in. The statistical margin of error says **nothing** about bias.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Randomise!',
              prompt: r`What's the best protection against selection bias when choosing whom to survey?`,
              choices: [
                { t: 'Choose people at random, so every member of the population has a known chance of being picked', ok: true },
                { t: 'Survey as many people as possible', why: 'A huge biased sample stays biased (remember the 1936 Literary Digest poll).' },
                { t: 'Let people volunteer', why: 'Volunteers are exactly the self-selected group that causes bias.' },
              ],
              explain: r`Random sampling makes the sample representative **on average**, including in ways nobody thought to check. Randomised controlled trials apply the same idea to experiments: random assignment balances out hidden differences between groups.`,
            },
          ],
          recap: [
            'Survivorship bias: drawing conclusions only from the examples that made it through a filter.',
            'Selection, non-response and response biases aren’t fixed by larger samples.',
            'Random sampling, and careful weighting, are the main defences.',
          ],
        },
      ],
    },
  ],
};
