import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
const f3 = (v) => fix(v, 3);

// deterministic pseudo-random normal samples (Box–Muller on a simple generator)
function normals(n, seed) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967297;
  };
  const out = [];
  for (let i = 0; i < n; i++) out.push(Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u()));
  return out;
}
// standard normal CDF (Abramowitz–Stegun approximation of erf)
const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
const power = (n, d) => 1 - Phi(1.645 - d * Math.sqrt(n));
// Beta(a, b) density for whole-number a, b
const LF = (() => { const t = [0]; for (let i = 1; i <= 400; i++) t.push(t[i - 1] + Math.log(i)); return t; })();
const betaPdf = (x, a, b) => (x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + LF[a + b - 1] - LF[a - 1] - LF[b - 1]));
const Z = { 80: 1.2816, 90: 1.6449, 95: 1.96, 99: 2.5758 };
const LEVELS = [80, 90, 95, 99];
const SKILL = normals(160, 11), LUCK1 = normals(160, 23), LUCK2 = normals(160, 37);

// 20 A/A tests (no real difference): after each batch of visitors, the running z-score is (sum of n standard normal steps)/√n
let PEEK_RUNS = null;
const peekRuns = () => {
  if (PEEK_RUNS) return PEEK_RUNS;
  let seed = 9;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const runs = [];
  for (let r = 0; r < 20; r++) { let S = 0; const z = []; for (let n = 1; n <= 100; n++) { S += gauss(); z.push(S / Math.sqrt(n)); } runs.push(z); }
  return (PEEK_RUNS = runs);
};
const peekN = (t) => Math.min(100, Math.max(1, Math.floor(t * 8)));

export default {
  id: 'inference',
  subject: 'math',
  title: 'Statistical Inference',
  level: 'Advanced',
  cover: 'inference',
  tagline: 'p-values, power, false discoveries, confidence intervals and Bayesian updating.',
  description: r`How do scientists decide whether an effect is real or just luck? Learn how hypothesis tests and p-values work, why testing many things at once guarantees false alarms, why extreme results tend to be followed by ordinary ones, how companies run A/B tests, what a confidence interval really promises, and how Bayesians update their beliefs as data arrive.`,
  prereq: 'Probability Distributions',
  chapters: [
    {
      title: 'Testing Ideas',
      summary: 'Is it real, or is it luck?',
      lessons: [
        {
          id: 'hypothesis',
          title: 'Hypothesis Tests',
          summary: 'Could it be chance?',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Innocent until proven guilty',
              body: r`A friend claims their coin is biased. You flip it 10 times and get 9 heads. Is it biased, or just lucky?

A **hypothesis test** starts by assuming the boring explanation, the **null hypothesis** $H_0$: "the coin is fair". Then ask: if $H_0$ were true, how surprising would this result be?

The **p-value** is the probability, assuming $H_0$, of a result **at least as extreme** as the one observed.`,
            },
            {
              type: 'numeric',
              title: 'Compute a p-value',
              prompt: r`For a fair coin, what is the probability of getting **9 or more** heads in 10 flips? (3 decimal places.)`,
              lhs: r`$p =$`,
              answer: 11 / 1024,
              tol: 0.0006,
              wrong: [{ v: 10 / 1024, tol: 0.0003, why: r`Include 10 heads too: $\binom{10}{9} + \binom{10}{10} = 11$ outcomes.` }, { v: 0.9, why: r`That's the proportion of heads. The p-value is a probability: $\frac{11}{1024}$.` }],
              explain: r`$P(9) + P(10) = \dfrac{\binom{10}{9} + \binom{10}{10}}{2^{10}} = \dfrac{10 + 1}{1024} \approx 0.011$. A fair coin would do this only about 1% of the time, which is fairly strong evidence against $H_0$.`,
            },
            {
              type: 'explain',
              title: 'Significance',
              body: r`Scientists often pick a threshold in advance, commonly $\alpha = 0.05$. If $p < \alpha$, the result is called **statistically significant** and $H_0$ is rejected.

Two kinds of mistakes are possible:
- **False positive** (type I error): rejecting $H_0$ when it's actually true. With $\alpha = 0.05$, this happens 5% of the time when there's no real effect.
- **False negative** (type II error): missing a real effect, often because the sample was too small.`,
            },
            {
              type: 'numeric',
              title: 'Two-sided',
              prompt: r`The friend only said the coin was "biased", not which way. So 1 or fewer heads would have been just as surprising as 9 or more. What is the **two-sided** p-value for 9 heads in 10 flips? (3 decimal places.)`,
              lhs: r`$p =$`,
              answer: 22 / 1024,
              tol: 0.0006,
              wrong: [{ v: 11 / 1024, tol: 0.0006, why: 'That’s one tail only. Add the equally extreme results in the other direction: 0 or 1 heads.' }],
              explain: r`$\frac{11 + 11}{1024} \approx 0.021$. A two-sided test counts extremes in both directions, so its p-value is twice the one-sided one here. Decide which test you're doing **before** looking at the data.`,
            },
            {
              type: 'interactive',
              title: 'Power',
              body: r`A new teaching method truly raises scores by $0.3$ standard deviations. The blue curve shows the test statistic if there were **no** effect; the coral curve shows it with the real effect. Results beyond the dashed line count as significant ($\alpha = 0.05$). The coral shaded area is the test's **power**: the chance of detecting the effect. Choose a sample size that gives at least **80%** power.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 8, ymin: 0, ymax: 0.45, grid: false, height: 280, axes: { xlabel: 'test statistic', xticks: 2, yticks: 1 },
                params: { n: { min: 5, max: 200, step: 1, value: 25, label: 'sample size', color: 'violet' } },
                curves: [{ f: (x) => phi(x), color: 'blue', width: 2.5 }, { f: (x, p) => phi(x - 0.3 * Math.sqrt(p.n)), color: 'coral', width: 2.5 }],
                extra: ({ plot, p, s }) => { const m = 0.3 * Math.sqrt(p.n); let d = `M${plot.X(1.645)} ${plot.Y(0)}`; for (let i = 0; i <= 80; i++) { const x = 1.645 + (6.355 * i) / 80; d += `L${plot.X(x).toFixed(1)} ${plot.Y(phi(x - m)).toFixed(1)}`; } d += `L${plot.X(8)} ${plot.Y(0)}Z`; return [s('path', { d, class: 'fl-coral-soft' }), s('line', { x1: plot.X(1.645), x2: plot.X(1.645), y1: plot.Y(0), y2: plot.Y(0.43), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 5' })]; },
                readout: (p) => `power with ${p.n} students: **${(100 * power(p.n, 0.3)).toFixed(0)}%** · chance of missing the effect: ${(100 - 100 * power(p.n, 0.3)).toFixed(0)}%`,
                goal: (p) => power(p.n, 0.3) >= 0.8,
                hint: 'Bigger samples pull the coral curve to the right, away from the null curve.',
                solution: { n: 70 },
              },
              explain: r`It takes about **69** students. With 25, the study would miss a real effect more than half the time, and a non-significant result would mean very little. Researchers calculate power **before** an experiment to choose a sample size; underpowered studies are a major cause of unreliable science.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What p means',
              prompt: r`A drug trial finds $p = 0.03$. Which statement is correct?`,
              choices: [
                { t: 'If the drug had no effect, results at least this extreme would occur about 3% of the time', ok: true },
                { t: 'There’s a 3% chance the drug doesn’t work', why: 'This is the most common misreading. The p-value assumes no effect and asks how surprising the data are. It isn’t the probability that the hypothesis is true.' },
                { t: 'There’s a 97% chance the drug works', why: 'A p-value can’t tell you the probability that the drug works. That needs prior information (Bayes’ theorem).' },
                { t: 'The drug has a large effect', why: 'A tiny effect can still give a small p-value with a big enough sample. p measures surprise, not size.' },
              ],
              explain: r`The p-value is $P(\text{data this extreme} \mid H_0)$, not $P(H_0 \mid \text{data})$. Confusing the two is like confusing "the chance a fair coin gives 9 heads" with "the chance the coin is fair, given 9 heads". The second needs to know how common biased coins are: Bayes' theorem again.`,
            },
          ],
          recap: [
            'Assume the null hypothesis, then ask how surprising the data are.',
            'p-value: the probability of results at least this extreme if H₀ is true.',
            'A small p is evidence against H₀, but it is not the probability that H₀ is true.',
          ],
        },
        {
          id: 'multiple',
          title: 'Multiple Comparisons',
          summary: 'Test enough, and something will be “significant”',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The jelly bean problem',
              body: r`Researchers test whether jelly beans cause acne. No link ($p > 0.05$). So they test each of 20 colours separately, and green comes out "significant"! Suppose no colour has any real effect. How likely is at least one false positive among $k$ tests at $\alpha = 0.05$?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 1, grid: 10, gridY: 0.25, height: 300, axes: { xlabel: 'number of tests', ylabel: 'P(at least one false positive)' },
                params: { k: { min: 1, max: 60, step: 1, value: 20, label: 'tests', color: 'coral', format: (v) => `${v}` } },
                curves: [{ f: (x) => 1 - 0.95 ** x, color: 'coral' }],
                points: [{ x: (p) => p.k, y: (p) => 1 - 0.95 ** p.k, color: 'coral' }],
                readout: (p) => r`$1 - 0.95^{${p.k}} = ${f3(1 - 0.95 ** p.k)}$`,
              },
              after: r`With 20 independent tests, there's a $1 - 0.95^{20} \approx 64\%$ chance of at least one false positive, even when nothing is going on. Report only the "hit" and you get a misleading headline: "Green jelly beans linked to acne!"`,
            },
            {
              type: 'numeric',
              title: 'Bonferroni',
              prompt: r`One simple fix, the **Bonferroni correction**, divides $\alpha$ by the number of tests. With 20 tests and an overall $\alpha = 0.05$, what threshold should each test use?`,
              answer: 0.0025,
              tol: 0.00005,
              wrong: [{ v: 0.05, why: 'That’s the uncorrected threshold. Divide by the number of tests.' }, { v: 1, why: r`Divide 0.05 by 20, rather than multiplying.` }],
              explain: r`$0.05 / 20 = 0.0025$. Then the chance of **any** false positive across all 20 tests is at most about 5%. The price: real but small effects become harder to detect.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'How many findings are true?',
              body: r`Imagine 1,000 hypotheses tested by a field of science, each at $\alpha = 0.05$. Only some are true. Each square is one hypothesis: **teal** = true effect found, **coral** = false positive, pale blue = true effect missed, grey = correctly found nothing. Adjust the share of true hypotheses and the studies' power.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 40, ymin: -0.5, ymax: 25, grid: false, axes: false, maxWidth: 520,
                params: { pi: { min: 0.01, max: 0.5, step: 0.01, value: 0.1, label: 'true hypotheses', color: 'teal', format: (v) => `${Math.round(v * 100)}%` }, pw: { min: 0.2, max: 0.95, step: 0.05, value: 0.8, label: 'power', color: 'violet', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => { const T = Math.round(1000 * p.pi), TP = Math.round(T * p.pw), FP = Math.round((1000 - T) * 0.05), w = plot.X(0.84) - plot.X(0); const els = []; for (let i = 0; i < 1000; i++) { const cls = i < TP ? 'fl-teal' : i < T ? 'fl-blue-soft' : i < T + FP ? 'fl-coral' : 'fl-card'; els.push(s('rect', { x: plot.X(i % 40), y: plot.Y(24 - Math.floor(i / 40)) - w, width: w, height: w, rx: 2, class: cls, stroke: cls === 'fl-card' ? 'var(--line-2)' : 'none' })); } return els; },
                readout: (p) => { const T = Math.round(1000 * p.pi), TP = Math.round(T * p.pw), FP = Math.round((1000 - T) * 0.05); return `significant results: ${TP + FP} · of these, **${Math.round((100 * TP) / (TP + FP))}%** are real`; },
              },
              after: r`When true hypotheses are rare, false positives can outnumber real discoveries, even with every test done correctly. This is the argument of John Ioannidis's famous 2005 paper "Why Most Published Research Findings Are False": low prior odds, low power and flexible analyses together make many "significant" findings wrong.`,
            },
            {
              type: 'numeric',
              title: 'Count the discoveries',
              prompt: r`Of 1,000 hypotheses, 100 are true. Studies have 80% power and use $\alpha = 0.05$. What fraction of the significant results are real effects? (2 decimal places.)`,
              answer: 0.64,
              tol: 0.006,
              wrong: [{ v: 0.95, why: r`That's $1 - \alpha$. Count: 80 true positives and $0.05 \times 900 = 45$ false positives.` }, { v: 0.8, why: 'That’s the power. Some significant results come from the 900 false hypotheses too.' }],
              hint: r`True positives: $0.8 \times 100$. False positives: $0.05 \times 900$.`,
              explain: r`$80$ true positives and $45$ false positives: $\frac{80}{125} = 0.64$. More than a third of the "discoveries" are false, though each test has only a 5% false positive rate. It's the same base-rate logic as a medical test for a rare disease.`,
            },
            {
              type: 'numeric',
              title: 'After the correction',
              prompt: r`With the Bonferroni threshold of $0.0025$ for each of 20 independent tests of effects that don't exist, what is the chance of at least one false positive? (Percentage, 1 decimal place.)`,
              unit: '%',
              answer: (1 - Math.pow(0.9975, 20)) * 100,
              tol: 0.05,
              wrong: [{ v: 64.2, tol: 0.5, why: r`That's without the correction, using $0.95^{20}$. Each test now passes with probability $0.9975$.` }],
              explain: r`$1 - 0.9975^{20} \approx 4.9\%$, just under the 5% we wanted for the whole family of tests, down from 64% without the correction.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Torturing the data',
              prompt: r`A researcher tries many analyses (different subgroups, outcomes and cut-offs) and publishes only the one with $p < 0.05$. What's the problem?`,
              choices: [
                { t: 'The reported p-value is misleading, because many hidden comparisons were made (“p-hacking”)', ok: true },
                { t: 'Nothing: p < 0.05 is significant', why: 'The threshold assumes one planned test. Many unreported tries inflate the false positive rate enormously.' },
                { t: 'The sample is too large', why: 'The problem is selective reporting, not the sample size.' },
              ],
              explain: r`This **p-hacking** helped cause the "replication crisis", where many published findings failed when other labs repeated them. Remedies include **pre-registering** the analysis plan before collecting data, correcting for multiple comparisons, and publishing negative results too.`,
            },
          ],
          recap: [
            r`With $k$ independent tests at $\alpha = 0.05$: $P(\text{false positive}) = 1 - 0.95^k$.`,
            r`Bonferroni: use $\alpha / k$ for each test.`,
            'Hidden comparisons (p-hacking) make findings look stronger than they are.',
          ],
        },
      ],
    },
    {
      title: 'Traps and Tools',
      summary: 'Regression to the mean and A/B tests.',
      lessons: [
        {
          id: 'regression',
          title: 'Regression to the Mean',
          summary: 'Why extremes don’t last',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Skill plus luck',
              body: r`160 students take two tests. Each score is **skill** (the same both times) plus **luck** (different each time). Each dot is one student. Adjust how much the scores depend on skill rather than luck. The coral dots are the top 10% on test 1.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.6, xmax: 3.6, ymin: -3.6, ymax: 3.6, grid: 1, axes: { xlabel: 'test 1', ylabel: 'test 2' }, maxWidth: 460,
                params: { w: { min: 0.1, max: 0.95, step: 0.05, value: 0.5, label: 'skill share', color: 'blue', format: (v) => `${Math.round(v * 100)}%` } },
                curves: [{ f: (x) => x, color: 'ink', dash: true }, { f: (x, p) => p.w * x, color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  const a = Math.sqrt(p.w), b = Math.sqrt(1 - p.w);
                  const t1 = SKILL.map((k, i) => a * k + b * LUCK1[i]);
                  const cut = t1.slice().sort((x, y) => y - x)[15];
                  return SKILL.map((k, i) => {
                    const x = t1[i], y = a * k + b * LUCK2[i];
                    return s('circle', { cx: plot.X(x), cy: plot.Y(y), r: x >= cut ? 6 : 4, class: x >= cut ? 'fl-coral' : 'fl-blue', opacity: x >= cut ? 0.95 : 0.55 });
                  });
                },
                readout: (p) => {
                  const a = Math.sqrt(p.w), b = Math.sqrt(1 - p.w);
                  const t1 = SKILL.map((k, i) => a * k + b * LUCK1[i]);
                  const idx = t1.map((x, i) => [x, i]).sort((x, y) => y[0] - x[0]).slice(0, 16).map(([, i]) => i);
                  const m1 = idx.reduce((s, i) => s + t1[i], 0) / 16, m2 = idx.reduce((s, i) => s + a * SKILL[i] + b * LUCK2[i], 0) / 16;
                  return r`top 10% on test 1: average $${f2(m1)}$ → on test 2: average $${f2(m2)}$ (scores in standard units)`;
                },
              },
              after: r`The top scorers on test 1 still do well on test 2, but **less** extremely: their average falls back toward the middle. They were partly skilled and partly **lucky**, and luck doesn't repeat. The less a result depends on skill, the stronger this **regression to the mean**. The coral line, with slope less than 1, shows the trend.`,
            },
            {
              type: 'mcq',
              title: 'The cover jinx',
              prompt: r`Athletes who appear on a famous sports magazine's cover often perform worse afterwards. Fans talk of a "jinx". What's the likely explanation?`,
              choices: [
                { t: 'They made the cover after an exceptional streak, which was partly luck; the next season regresses toward their usual level', ok: true },
                { t: 'Fame makes them lazy', why: 'Possible in individual cases, but the pattern is expected even with no change at all in the athletes.' },
                { t: 'The magazine picks bad athletes', why: 'It picks athletes at their peak, and that’s exactly the point.' },
              ],
              explain: r`Being picked for the cover selects people at an **unusually** good moment. Even with no jinx at all, their next results will tend to be closer to average. Regression to the mean fools people everywhere: treatments that "work" on patients who came in at their sickest, or punishments that seem to "work" after an unusually bad performance.`,
            },
            {
              type: 'numeric',
              title: 'How far back?',
              prompt: r`When two tests are measured in standard units, the best prediction for test 2 is $r$ times the test-1 score, where $r$ is the correlation between them. If $r = 0.5$, what test-2 score do you predict for a student who scored $2$ standard deviations above average on test 1?`,
              answer: 1,
              tol: 0.01,
              wrong: [{ v: 2, why: 'That ignores the luck in test 1. Multiply by r = 0.5.' }, { v: 0, why: 'The student is partly skilled, so they should stay above average: 0.5 × 2.' }],
              explain: r`$0.5 \times 2 = 1$ standard deviation above average: halfway back to the mean. That's the slope of the coral line in the scatter plot. With $r = 1$ (no luck at all) there's no regression; with $r = 0$ (pure luck) the best guess is the average.`,
            },
            {
              type: 'mcq',
              title: 'Galton’s puzzle',
              prompt: r`Francis Galton found in 1886 that very tall parents tend to have children who are tall, but less extremely so. Does that mean that, over generations, everyone will end up the same height?`,
              choices: [
                { t: 'No: some children of average parents are unusually tall, so the overall spread stays the same', ok: true },
                { t: 'Yes: heights converge to the average', why: 'If that were so, the spread of heights would shrink every generation, and it doesn’t.' },
                { t: 'Yes, unless parents marry people of similar height', why: 'Regression happens even then. It’s a statistical effect, not a biological force.' },
              ],
              explain: r`Regression works in **both directions**: extreme children also tend to have less extreme parents. Extremes keep being produced by fresh combinations of genes and luck, so the distribution stays stable. Regression to the mean describes the **imperfect correlation** between two measurements, not a force pulling everyone to the middle.`,
            },
            {
              type: 'numeric',
              title: 'Mostly luck',
              prompt: r`A golfer's scores from one round to the next correlate only weakly, with $r = 0.3$. After a round 3 standard deviations better than their average, how many standard deviations better do you predict for the next round?`,
              answer: 0.9,
              tol: 0.01,
              wrong: [{ v: 3, why: r`That assumes the great round was all skill. With $r = 0.3$, most of it was luck.` }],
              explain: r`$0.3 \times 3 = 0.9$: most of the way back to average. The weaker the correlation, the more a standout result is luck, and the harder it regresses. A golfer who shoots a record round should expect a good, but ordinary, next one.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Praise and blame',
              prompt: r`A flight instructor notices that after praising a trainee's excellent landing, the next one is usually worse, while after criticising a bad landing, the next one usually improves. What should they conclude?`,
              choices: [
                { t: 'Probably nothing about praise or criticism: extreme landings are naturally followed by more ordinary ones', ok: true },
                { t: 'Criticism works better than praise', why: 'That conclusion ignores regression to the mean: the pattern would appear even if feedback had no effect at all.' },
                { t: 'Praise makes trainees overconfident', why: 'Maybe, but this evidence can’t show it. Regression to the mean alone predicts the same pattern.' },
              ],
              explain: r`Daniel Kahneman described exactly this story from his work with flight instructors. Unusually good and bad landings involve a lot of luck, so the next landing tends to be more ordinary **regardless** of feedback. To learn whether feedback helps, you need a controlled comparison.`,
            },
          ],
          recap: [
            'When outcomes mix skill and luck, extreme results tend to be followed by less extreme ones.',
            'This regression to the mean creates illusory “jinxes” and illusory cures.',
            'Controlled comparisons are needed to tell real effects from regression.',
          ],
        },
        {
          id: 'ab-testing',
          title: 'A/B Testing',
          summary: 'Experiments at scale',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'Randomised experiments',
              body: r`A website wants to know whether a green "Buy" button sells more than a blue one. In an **A/B test**, each visitor is randomly shown version A or B. Randomisation balances everything else (age, device, mood) between the groups, on average, so any clear difference must come from the button.

But each group's sales rate is itself noisy. For a rate $p$ measured on $n$ visitors, the typical random error, called the **standard error**, is
$$SE = \sqrt{\frac{p(1 - p)}{n}}$$`,
            },
            {
              type: 'numeric',
              title: 'How precise?',
              prompt: r`Version A is shown to 900 visitors, and 10% of them buy. What is the standard error of that 10% estimate? (Give it as a decimal.)`,
              lhs: r`$SE =$`,
              answer: 0.01,
              tol: 0.0003,
              wrong: [{ v: 0.0001, tol: 0.00002, why: r`Take the square root: $\sqrt{0.09/900} = \sqrt{0.0001}$.` }, { v: 0.1, why: r`That's $p$ itself. $SE = \sqrt{\frac{0.1 \times 0.9}{900}}$.` }],
              explain: r`$SE = \sqrt{\dfrac{0.1 \times 0.9}{900}} = \sqrt{0.0001} = 0.01$, or 1 percentage point. So a result of "10%" is really "about $10\% \pm 2\%$" (two standard errors).`,
            },
            {
              type: 'mcq',
              title: 'Is B better?',
              prompt: r`With 900 visitors each, A sells to 10.0% and B to 11.0%. Each has a standard error of about 1 percentage point. Should the company conclude B is better?`,
              choices: [
                { t: 'Not yet: a 1-point difference is well within what random noise could produce', ok: true },
                { t: 'Yes: 11% is higher than 10%', why: 'With this much noise, a 1-point gap could easily be luck. The difference’s standard error is about 1.4 points.' },
                { t: 'Yes, B is 10% better', why: 'B looks 10% better in relative terms, but the measurement noise is too large to be sure.' },
              ],
              explain: r`The difference between two independent estimates has standard error about $\sqrt{1^2 + 1^2} \approx 1.4$ points, so a 1-point gap is less than one standard error, entirely plausible by chance. To detect a 1-point improvement reliably, you'd need roughly ten times as many visitors. Big tech companies run thousands of such tests, with very large samples, precisely because real effects are usually small.`,
            },
            {
              type: 'interactive',
              title: 'How many visitors?',
              body: r`Suppose B really does sell to 11% and A to 10%. The curves show the likely measured rates for each version. Increase the number of visitors per version until the measured **difference** is at least **2 standard errors** from zero, so a real 1-point improvement would usually show up as significant.`,
              widget: {
                kind: 'graph', xmin: 0.06, xmax: 0.15, ymin: 0, ymax: 1.1, grid: false, height: 260, axes: { xlabel: 'measured sales rate', xticks: 0.01, yticks: 2, xfmt: (v) => `${Math.round(v * 100)}%` },
                params: { e: { min: 2.5, max: 4.5, step: 0.05, value: 2.95, label: 'visitors each', color: 'violet', format: (v) => `${Math.round(10 ** v).toLocaleString('en-US')}` } },
                curves: [
                  { f: (x, p) => Math.exp(-(((x - 0.1) / Math.sqrt(0.09 / 10 ** p.e)) ** 2) / 2), color: 'blue', width: 3, n: 400 },
                  { f: (x, p) => Math.exp(-(((x - 0.11) / Math.sqrt(0.0979 / 10 ** p.e)) ** 2) / 2), color: 'coral', width: 3, n: 400 },
                ],
                readout: (p) => { const n = Math.round(10 ** p.e), se = Math.sqrt((0.09 + 0.0979) / n); return `${n.toLocaleString('en-US')} visitors each: SE of the difference **${(100 * se).toFixed(2)}** points · a 1-point gap is **${(0.01 / se).toFixed(1)}** SEs`; },
                goal: (p) => 0.01 / Math.sqrt((0.09 + 0.0979) / Math.round(10 ** p.e)) >= 2,
                hint: 'The standard error shrinks like 1/√n. You need it about 3 times smaller than at 900 visitors.',
                solution: { e: 3.9 },
              },
              explain: r`It takes roughly **7,500 visitors per version**, about eight times as many as before. A difference of 1 point needs a standard error of about 0.5 points, and since $SE \propto 1/\sqrt n$, shrinking it 2.8-fold costs $2.8^2 \approx 8$ times the data.`,
            },
            {
              type: 'numeric',
              title: 'A rule of thumb',
              prompt: r`A rule of thumb for an A/B test with 80% power at 5% significance: each group needs about $\frac{16\,p(1 - p)}{\delta^2}$ visitors, where $p$ is the baseline rate and $\delta$ the difference to detect. For $p = 0.1$ and $\delta = 0.01$, how many per group?`,
              answer: 14400,
              explain: r`$\frac{16 \times 0.09}{0.0001} = 14{,}400$ per group. Detecting small improvements takes a lot of traffic; halving $\delta$ would need four times as many.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'No peeking',
              prompt: r`An analyst checks the A/B test every hour and stops as soon as $p < 0.05$. If the two buttons are actually identical, what happens?`,
              choices: [
                { t: 'The chance of a false positive rises far above 5%, because each peek is another chance to be fooled', ok: true },
                { t: 'Nothing: each check uses the correct 5% threshold', why: 'Each look is a separate test. Stopping at the first “win” is multiple comparisons in disguise.' },
                { t: 'It makes false positives less likely, because more data is checked', why: 'Stopping early on a lucky fluctuation makes them more likely.' },
              ],
              explain: r`The running p-value wanders like a random walk, and given enough looks it dips below 0.05 surprisingly often: with hundreds of peeks the false positive rate can exceed 30%. Remedies are to fix the sample size in advance, or use "sequential" methods designed for continuous monitoring.`,
            },
            { /*anim:inference*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Peeking at twenty tests',
              body: r`Twenty A/A tests: both "versions" are identical, so there's nothing to find. After each batch of visitors, the analyst checks the test statistic $z$. Inside the grey band ($|z| < 1.96$) the result isn't significant. A test turns {coral:coral} the first time it leaves the band, which is when a peeking analyst would stop and declare a winner.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: -3.6, ymax: 3.6, grid: false, height: 320, axes: { xticks: 20, yticks: 1, yAt: -3.6, xlabel: 'checks', ylabel: 'z' }, clipExtra: true,
                animate: { param: 't', speed: 1, max: 15, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const runs = peekRuns(), n = peekN(p.t), els = [];
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(1.96), width: plot.X(100) - plot.X(0), height: plot.Y(-1.96) - plot.Y(1.96), class: 'fl-muted', opacity: 0.18 }));
                  for (const z of runs) {
                    const hit = z.slice(0, n).findIndex((v) => Math.abs(v) > 1.96);
                    els.push(s('path', { d: z.slice(0, n).map((v, i) => `${i ? 'L' : 'M'}${plot.X(i + 1).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join(''), fill: 'none', stroke: hit >= 0 ? 'var(--coral)' : 'var(--blue)', 'stroke-width': hit >= 0 ? 2 : 1.6, opacity: hit >= 0 ? 0.9 : 0.55 }));
                    if (hit >= 0) els.push(s('circle', { cx: plot.X(hit + 1), cy: plot.Y(z[hit]), r: 4.5, class: 'fl-coral' }));
                  }
                  return els;
                },
                readout: (p) => { const runs = peekRuns(), n = peekN(p.t), k = runs.filter((z) => z.slice(0, n).some((v) => Math.abs(v) > 1.96)).length, last = runs.filter((z) => Math.abs(z[n - 1]) > 1.96).length; return `after ${n} checks: ${k} of 20 tests have *at some point* looked significant · at this check alone: ${last} of 20`; },
              },
              after: r`At any single, planned moment, about 1 test in 20 crosses the line, as a 5% false-positive rate promises. But each test's $z$ wanders like a random walk, and with a hundred looks, many of them stray out of the band at least once. Stop at the first crossing and you'll "find" a winner far more often than 5% of the time. The fixes: decide the sample size in advance, or use methods designed for repeated looks.`,
            },
          ],
          recap: [
            'Random assignment makes the groups comparable, so differences can be attributed to the change.',
            r`Standard error of a rate: $\sqrt{p(1-p)/n}$. It shrinks like $1/\sqrt n$.`,
            'Small effects need large samples to tell them apart from noise.',
          ],
        },
      ],
    },
    {
      title: 'Estimating',
      summary: 'Confidence intervals and Bayesian updating.',
      lessons: [
        {
          id: 'confidence',
          title: 'Confidence Intervals',
          summary: 'What “95% confident” really means',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A range, not a number',
              body: r`A single estimate, like "the average is 48.7", hides how uncertain it is. A **confidence interval** gives a range instead. If a sample of size $n$ has mean $\bar x$, and individual values have standard deviation $\sigma$, then the 95% confidence interval for the true mean is
$$\bar x \pm 1.96\,\frac{\sigma}{\sqrt n}$$
The 1.96 comes from the normal distribution: 95% of the area lies within 1.96 standard deviations of the centre.`,
            },
            {
              type: 'interactive',
              title: 'Forty intervals',
              body: r`The true mean is 50 (dashed line), with $\sigma = 10$. Each bar is the confidence interval from a different random sample. Coral bars **miss** the true mean. Explore the sample size and confidence level, then set the level so that you'd expect only **2** of the 40 intervals to miss.`,
              widget: {
                kind: 'graph', xmin: 30, xmax: 70, ymin: -1, ymax: 41, grid: false, height: 380, axes: { xlabel: 'value', xticks: 5, yticks: 100 },
                params: {
                  n: { min: 4, max: 100, step: 1, value: 25, label: 'sample size', color: 'blue' },
                  L: { min: 0, max: 3, step: 1, value: 0, label: 'confidence', color: 'violet', format: (v) => `${LEVELS[v]}%` },
                  seed: { min: 1, max: 30, step: 1, value: 1, label: 'new samples', color: 'teal', format: (v) => `#${v}` },
                },
                extra: ({ plot, p, s }) => { const se = 10 / Math.sqrt(p.n), z = Z[LEVELS[p.L]], m = normals(40, p.seed * 31 + 7); const els = [s('line', { x1: plot.X(50), x2: plot.X(50), y1: plot.Y(-0.5), y2: plot.Y(40.5), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 5' })]; m.forEach((g, i) => { const c = 50 + g * se, miss = Math.abs(c - 50) > z * se; els.push(s('line', { x1: plot.X(Math.max(30, c - z * se)), x2: plot.X(Math.min(70, c + z * se)), y1: plot.Y(i + 0.5), y2: plot.Y(i + 0.5), stroke: miss ? 'var(--coral)' : 'var(--blue)', 'stroke-width': 4, 'stroke-linecap': 'round' }), s('circle', { cx: plot.X(c), cy: plot.Y(i + 0.5), r: 3.5, class: 'fl-ink' })); }); return els; },
                readout: (p) => { const z = Z[LEVELS[p.L]], miss = normals(40, p.seed * 31 + 7).filter((g) => Math.abs(g) > z).length; return `${40 - miss} of 40 intervals contain the true mean · ${miss} miss · width ±${(z * 10 / Math.sqrt(p.n)).toFixed(1)}`; },
                goal: (p) => LEVELS[p.L] === 95,
                hint: '2 out of 40 is 5% missing.',
                solution: { L: 2 },
              },
              explain: r`A 95% interval misses 5% of the time: 2 of 40 on average (any particular batch might show 0 or 4). Raising the confidence widens every interval; increasing $n$ narrows them. The sample size changes the width, but not the fraction that miss.`,
            },
            {
              type: 'mcq',
              title: 'What does 95% mean?',
              prompt: r`A study reports a 95% confidence interval of 46 to 54 for an average. Which statement is correct?`,
              choices: [
                { t: '95% of intervals made this way, from repeated samples, would contain the true average', ok: true },
                { t: 'There is a 95% chance that the true average lies between 46 and 54', why: 'Subtle but important: the true average is fixed, and this interval either contains it or doesn’t. The 95% describes the method.' },
                { t: '95% of individual values lie between 46 and 54', why: 'The interval is about the **average**, which is far less variable than individual values.' },
              ],
              explain: r`The confidence is in the **procedure**: like a ring toss that lands around the peg 95% of the time. Any single toss either rings the peg or not. (A Bayesian **credible interval**, coming next lesson, does allow the "95% chance" reading, at the price of choosing a prior.)`,
            },
            {
              type: 'numeric',
              title: 'Build one',
              prompt: r`A sample of 100 light bulbs lasts an average of 1,200 hours, with $\sigma = 150$ hours. What is the **upper** end of the 95% confidence interval for the true average lifetime?`,
              unit: 'hours',
              answer: 1200 + 1.96 * 15,
              tol: 0.5,
              wrong: [{ v: 1200 + 1.96 * 150, tol: 1, why: r`Use the standard error $\sigma/\sqrt n = 150/10 = 15$, not $\sigma$ itself.` }, { v: 1215, tol: 0.5, why: r`That's one standard error. A 95% interval goes out 1.96 of them.` }],
              hint: r`$1200 + 1.96 \times \frac{150}{\sqrt{100}}$.`,
              explain: r`The standard error is $\frac{150}{\sqrt{100}} = 15$ hours, so the interval is $1200 \pm 29.4$: from about 1,171 to **1,229** hours. Individual bulbs vary by hundreds of hours, but the average of 100 is pinned down to within about 30.`,
            },
            {
              type: 'numeric',
              title: 'More confidence, more width',
              prompt: r`A 95% interval uses $\pm 1.96$ standard errors; a 99% interval uses $\pm 2.58$. How many times wider is the 99% interval? (2 decimal places.)`,
              answer: 2.58 / 1.96,
              tol: 0.01,
              explain: r`$\frac{2.58}{1.96} \approx 1.32$: a third wider. More confidence costs precision, unless you collect more data.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Half the width',
              prompt: r`The bulb company wants an interval half as wide (±15 hours instead of ±29.4). How many bulbs must it test?`,
              unit: 'bulbs',
              answer: 400,
              wrong: [{ v: 200, why: r`Width shrinks like $1/\sqrt n$, so halving it needs $2^2 = 4$ times the sample.` }, { v: 50, why: 'A smaller sample gives a **wider** interval.' }],
              explain: r`Width $\propto 1/\sqrt n$, so halving it needs **4 times** as many: 400 bulbs. Every extra digit of precision costs 100 times the data, which is why huge surveys only get slightly more precise than big ones.`,
            },
          ],
          recap: [
            r`95% confidence interval for a mean: $\bar x \pm 1.96\,\sigma/\sqrt n$.`,
            '“95%” describes the method: 95% of such intervals contain the truth.',
            'Halving the width takes four times the sample.',
          ],
        },
        {
          id: 'bayesian',
          title: 'Bayesian Updating',
          summary: 'Learning a coin’s bias from data',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Beliefs as distributions',
              body: r`A Bayesian treats an unknown quantity, like a coin's probability of heads $\theta$, as uncertain and describes that uncertainty with a probability distribution. Start with a **prior** (what you believe before the data), then use Bayes' theorem to get the **posterior**:
$$\text{posterior} \propto \text{likelihood} \times \text{prior}$$
For a coin with $h$ heads and $t$ tails, the likelihood is $\theta^h (1 - \theta)^t$. Starting from a flat prior (every $\theta$ equally plausible), the posterior is proportional to $\theta^h (1 - \theta)^t$ itself.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch the belief sharpen',
              body: r`Add heads and tails and watch the posterior. The **prior strength** adds imaginary flips (half heads, half tails) for someone who starts out confident the coin is roughly fair. The shaded band holds the middle 95% of belief.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 10, grid: false, height: 300, axes: { xlabel: 'θ, the probability of heads', xticks: 0.25, yticks: 20 },
                params: {
                  h: { min: 0, max: 60, step: 1, value: 7, label: 'heads', color: 'coral' },
                  t: { min: 0, max: 60, step: 1, value: 3, label: 'tails', color: 'blue' },
                  s: { min: 1, max: 30, step: 1, value: 1, label: 'prior strength', color: 'violet', format: (v) => (v === 1 ? 'flat' : `${2 * (v - 1)} imaginary flips`) },
                },
                curves: [{ f: (x, p) => betaPdf(x, p.s, p.s), color: 'muted', dash: true, n: 300 }, { f: (x, p) => Math.min(10.5, betaPdf(x, p.h + p.s, p.t + p.s)), color: 'violet', width: 3, n: 400 }],
                extra: ({ plot, p, s }) => { const a = p.h + p.s, b = p.t + p.s, N = 400, cdf = [0]; for (let i = 1; i <= N; i++) cdf.push(cdf[i - 1] + betaPdf((i - 0.5) / N, a, b) / N); const tot = cdf[N]; const lo = cdf.findIndex((c) => c / tot >= 0.025) / N, hi = cdf.findIndex((c) => c / tot >= 0.975) / N; let d = `M${plot.X(lo)} ${plot.Y(0)}`; for (let i = 0; i <= 80; i++) { const x = lo + ((hi - lo) * i) / 80; d += `L${plot.X(x).toFixed(1)} ${plot.Y(Math.min(10, betaPdf(x, a, b))).toFixed(1)}`; } d += `L${plot.X(hi)} ${plot.Y(0)}Z`; return [s('path', { d, class: 'fl-violet-soft' })]; },
                readout: (p) => { const a = p.h + p.s, b = p.t + p.s, N = 400, cdf = [0]; for (let i = 1; i <= N; i++) cdf.push(cdf[i - 1] + betaPdf((i - 0.5) / N, a, b) / N); const tot = cdf[N], lo = cdf.findIndex((c) => c / tot >= 0.025) / N, hi = cdf.findIndex((c) => c / tot >= 0.975) / N; return `best guess (posterior mean) **${(a / (a + b)).toFixed(3)}** · 95% credible interval ${lo.toFixed(2)} to ${hi.toFixed(2)}`; },
              },
              after: r`With a flat prior, 7 heads and 3 tails give a broad hump centred near 0.67. Add more data and it narrows like $1/\sqrt n$. A strong prior holds the curve near 0.5 at first, but enough data overwhelms any reasonable prior.`,
            },
            {
              type: 'numeric',
              title: 'Rule of succession',
              prompt: r`With a flat prior, after $h$ heads in $n$ flips the probability that the **next** flip is heads is $\dfrac{h + 1}{n + 2}$. A coin you know nothing about lands heads 10 times out of 10. What's the probability the next flip is heads? (3 decimal places.)`,
              answer: 11 / 12,
              tol: 0.0015,
              wrong: [{ v: 1, why: 'Ten heads make tails unlikely, but not impossible.' }, { v: 0.5, why: 'That ignores the data. Use (h + 1)/(n + 2).' }],
              explain: r`$\frac{11}{12} \approx 0.917$. This is Laplace's **rule of succession** (1814). It behaves as if you'd seen one extra head and one extra tail before starting, so it never declares anything certain from finite data.`,
            },
            {
              type: 'mcq',
              title: 'Will the sun rise?',
              prompt: r`Laplace applied his rule to sunrise: given that the sun has risen every day for 5,000 years, what's the chance it rises tomorrow? Critics said the answer was silly. Why?`,
              choices: [
                { t: 'We know far more about the sun than a count of sunrises: a flat prior ignores physics', ok: true },
                { t: 'The formula gives exactly 1', why: r`It gives $\frac{n+1}{n+2}$, extremely close to 1 but not equal.` },
                { t: 'Bayesian reasoning can’t be used for physical events', why: 'It can. The objection is to the choice of prior, not to Bayes’ theorem.' },
              ],
              explain: r`The rule assumes total ignorance before the data. For the sun we have astronomy, which makes tomorrow's sunrise far more certain than any sunrise count suggests. Choosing a prior that reflects real knowledge is both the strength and the controversy of Bayesian statistics. (Laplace himself made this point.)`,
            },
            {
              type: 'numeric',
              title: 'No successes yet',
              prompt: r`Starting from a uniform prior, you observe 0 successes in 10 trials. By Laplace’s rule of succession, the posterior mean is $\frac{s + 1}{n + 2}$. What is it? (3 decimal places.)`,
              answer: 1 / 12,
              tol: 0.001,
              explain: r`$\frac{0 + 1}{10 + 2} = \frac{1}{12} \approx 0.083$. Unlike the raw estimate $\frac{0}{10} = 0$, the Bayesian answer admits that success is still possible, just unlikely.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A confident sceptic',
              prompt: r`A sceptic's prior is worth 50 imaginary heads and 50 imaginary tails. Then the coin gives 70 heads and 30 tails. Their posterior mean is $\dfrac{50 + 70}{100 + 100}$. What is it?`,
              answer: 0.6,
              tol: 0.001,
              wrong: [{ v: 0.7, why: 'That’s the data alone. The sceptic’s prior pulls the estimate toward 0.5.' }, { v: 0.5, why: 'The data move the estimate. Compute 120/200.' }],
              explain: r`$\frac{120}{200} = 0.6$: halfway between the prior's 0.5 and the data's 0.7, because the prior and the data carry equal weight (100 flips each). After 10,000 real flips at 70% heads, the posterior mean would be $\frac{7050}{10100} \approx 0.698$: the data win.`,
            },
          ],
          recap: [
            'Posterior ∝ likelihood × prior.',
            r`Flat prior: after $h$ heads in $n$ flips, $P(\text{next head}) = \frac{h+1}{n+2}$.`,
            'Priors act like imaginary data; enough real data overwhelms them.',
          ],
        },
        {
          id: 'bootstrap',
          title: 'The Bootstrap',
          summary: 'Resampling your own data',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Pulling yourself up',
              body: r`You have one sample, say 12 people’s commute times, and you compute its mean. How much would that mean change if you could repeat the survey? Usually you can’t.

Bradley Efron’s **bootstrap** (1979) answers it with a trick: treat your sample as a stand-in for the population, and draw many new samples of the same size **from your own data, with replacement**. The spread of the statistic across these resamples estimates its uncertainty. No formulas needed, and it works for medians and other statistics too.`,
            },
            {
              type: 'numeric',
              title: 'The classic formula',
              prompt: r`For the mean, there is a formula: the standard error is $\frac{s}{\sqrt n}$. A sample of 36 has standard deviation $s = 12$. What is the standard error of its mean?`,
              answer: 2,
              tol: 0.001,
              explain: r`$\frac{12}{\sqrt{36}} = 2$. The bootstrap should give about the same for a mean, but it also works where no simple formula exists.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Resample the commutes',
              body: r`The data: 12 commute times (minutes) $12, 15, 9, 22, 30, 14, 18, 11, 25, 16, 40, 13$, with mean 18.75. Each bootstrap resample picks 12 values at random from these, with replacement. Choose how many resamples to draw, and whether to track the mean or the median.`,
              widget: {
                kind: 'graph', xmin: 8, xmax: 32, ymin: 0, ymax: 0.3, grid: false, height: 250, axes: { xlabel: 'resampled statistic (minutes)', xticks: 4, yticks: 10, yAt: 0, xAt: 8 },
                params: { B: { min: 20, max: 3000, step: 20, value: 200, label: 'resamples', color: 'violet' }, med: { min: 0, max: 1, step: 1, value: 0, label: 'statistic', color: 'ink', format: (v) => (v ? 'median' : 'mean') } },
                extra: ({ plot, p, s }) => { const D = [12, 15, 9, 22, 30, 14, 18, 11, 25, 16, 40, 13]; let a = 7; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; const vals = []; for (let b = 0; b < p.B; b++) { const r = []; for (let i = 0; i < 12; i++) r.push(D[(u() * 12) | 0]); r.sort((x, y) => x - y); vals.push(p.med ? (r[5] + r[6]) / 2 : r.reduce((x, y) => x + y, 0) / 12); } const bins = new Array(48).fill(0); for (const v of vals) { const k = Math.floor((v - 8) * 2); if (k >= 0 && k < 48) bins[k]++; } return bins.map((c, k) => s('rect', { x: plot.X(8 + k / 2), y: plot.Y(c / p.B), width: plot.X(0.5) - plot.X(0) - 0.5, height: plot.Y(0) - plot.Y(c / p.B), class: 'fl-violet' })); },
                readout: (p) => { const D = [12, 15, 9, 22, 30, 14, 18, 11, 25, 16, 40, 13]; let a = 7; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; const vals = []; for (let b = 0; b < p.B; b++) { const r = []; for (let i = 0; i < 12; i++) r.push(D[(u() * 12) | 0]); r.sort((x, y) => x - y); vals.push(p.med ? (r[5] + r[6]) / 2 : r.reduce((x, y) => x + y, 0) / 12); } const m = vals.reduce((x, y) => x + y, 0) / vals.length, sd = Math.sqrt(vals.reduce((x, y) => x + (y - m) ** 2, 0) / (vals.length - 1)); vals.sort((x, y) => x - y); return `bootstrap standard error **${sd.toFixed(2)}** min${p.med ? '' : ' (formula s/√n: 2.62)'} · middle 95%: ${vals[Math.floor(0.025 * vals.length)].toFixed(1)} to ${vals[Math.ceil(0.975 * vals.length) - 1].toFixed(1)}`; },
              },
              after: r`With a few thousand resamples, the bootstrap standard error of the mean settles close to the formula’s 2.6 minutes. For the median, there’s no simple formula, yet the bootstrap works just the same, and the lumpy histogram honestly shows how the median jumps between data values.`,
            },
            {
              type: 'mcq',
              title: 'Why with replacement?',
              prompt: r`Why must bootstrap resamples be drawn **with replacement**?`,
              choices: [
                { t: 'Without replacement, every resample of size 12 would just be the original data in a different order', ok: true },
                { t: 'It makes the calculation faster', why: 'Speed isn’t the reason: without replacement there would be no variation at all.' },
                { t: 'To avoid repeating values', why: 'The opposite: replacement allows values to repeat, which creates the variation we need.' },
              ],
              explain: r`Sampling with replacement mimics drawing fresh people from a population that "looks like" your sample. Some values appear twice, others not at all, and that variation is what estimates the uncertainty.`,
            },
            {
              type: 'numeric',
              title: 'A percentile interval',
              prompt: r`You compute 1,000 bootstrap means and sort them. For a 95% interval you take the 2.5th and 97.5th percentiles. Which position in the sorted list gives the upper end?`,
              answer: 975,
              tol: 0.5,
              explain: r`The 97.5th percentile of 1,000 values is the 975th (and the lower end is the 25th). The middle 95% of resampled means forms the interval.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A third of the uncertainty',
              prompt: r`The standard error shrinks like $\frac{1}{\sqrt n}$. A survey of 36 people gives too wide an interval. How many people would you need to cut the standard error to **a third** of its value?`,
              answer: 324,
              wrong: [{ v: 108, why: r`Tripling $n$ only divides the standard error by $\sqrt3$. You need $\sqrt n$ to triple.` }],
              explain: r`Cutting $\frac{s}{\sqrt n}$ to a third needs $\sqrt n$ to triple, so $n$ must be 9 times bigger: $9 \times 36 = 324$. Precision is expensive: each extra decimal place costs 100 times the data.`,
            },
          ],
          recap: [
            'The bootstrap resamples your own data, with replacement, many times.',
            'The spread of the resampled statistic estimates its standard error.',
            'It works for medians and other statistics with no simple formula.',
          ],
        },
      ],
    },
  ],
};
