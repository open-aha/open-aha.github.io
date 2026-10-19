const r = String.raw;
const BENFORD = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d));
const lead = (k) => Math.floor(10 ** ((k * Math.LOG10E * Math.LN2) % 1)); // leading digit of 2^k
const counts = (n) => {
  const c = Array(10).fill(0);
  for (let k = 1; k <= n; k++) c[lead(k)]++;
  return c.slice(1).map((v) => v / n);
};
const DATA = [1, 2, 4, 8, 16, 32, 64].map((x) => [x, 3 * x ** 1.5]);

// harmonic numbers for Zipf coverage (vocabulary of 10,000 words)
const HARM = (() => { const h = [0]; for (let k = 1; k <= 10000; k++) h[k] = h[k - 1] + 1 / k; return h; })();
const coverage = (k) => HARM[k] / HARM[10000];
// Pareto: share of the total held by the top 20% for tail index a
const top20 = (a) => 0.2 ** (1 - 1 / a);
// seeded uniforms for running averages and urns
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const U = (() => { const u = seeded(42); return Array.from({ length: 3000 }, () => u()); })();
const runCache = new Map();
const runningMean = (a) => {
  const key = a.toFixed(2);
  if (runCache.has(key)) return runCache.get(key);
  let sum = 0;
  const out = U.map((u, i) => { sum += (1 - u) ** (-1 / a); return sum / (i + 1); });
  runCache.set(key, out);
  return out;
};
const urnCache = new Map();
const polya = (seed) => {
  if (urnCache.has(seed)) return urnCache.get(seed);
  const u = seeded(seed * 977 + 3);
  let red = 1, blue = 1;
  const out = [0.5];
  for (let i = 0; i < 500; i++) { if (u() < red / (red + blue)) red++; else blue++; out.push(red / (red + blue)); }
  urnCache.set(seed, out);
  return out;
};

export default {
  id: 'powerlaws',
  subject: 'math',
  title: 'Power Laws & Surprising Statistics',
  level: 'Intermediate',
  cover: 'powerlaws',
  tagline: 'Why 1 is the most common first digit, why “the” rules English, and when averages lie.',
  description: r`Some of the strangest patterns in data come from power laws and scale invariance. Discover Benford's law of first digits, Zipf's law of word frequencies, how log–log plots reveal hidden power laws, why heavy-tailed data makes the average a treacherous guide, and how "the rich get richer" creates power laws.`,
  prereq: 'Statistics',
  chapters: [
    {
      title: 'Strange Patterns',
      summary: 'First digits and word ranks.',
      lessons: [
        {
          id: 'benford',
          title: 'Benford’s Law',
          summary: 'The surprising first digit',
          icon: 'sigma',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A guess',
              prompt: r`Take the populations of all the world's towns and look at the first digit of each (e.g. 2,754 → 2). Roughly what fraction start with 1?`,
              choices: [
                { t: 'About 30%', ok: true },
                { t: 'About 11% (one in nine)', why: 'That would be true if all nine digits were equally likely. Surprisingly, they aren’t.' },
                { t: 'About 50%', why: 'It’s high, but not that high: about 30%.' },
              ],
              explain: r`About 30% of such numbers start with 1, and fewer than 5% start with 9. This pattern, noticed by Simon Newcomb in 1881 (from worn pages in books of logarithms) and by Frank Benford in 1938, is called **Benford's law**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Powers of two',
              body: r`Benford's law predicts that the first digit is $d$ with probability $\log_{10}\!\left(1 + \frac1d\right)$. The outlines show these predictions; the bars show the first digits of $2^1, 2^2, \dots, 2^n$. Increase $n$.`,
              widget: {
                kind: 'graph', xmin: 0.3, xmax: 9.7, ymin: -0.04, ymax: 0.36, grid: false, axes: false, height: 260,
                params: { n: { min: 10, max: 1000, step: 10, value: 10, label: 'powers of 2', color: 'violet', format: (v) => `$2^1$ to $2^{${v}}$` } },
                extra: ({ plot, p, s }) => {
                  const c = counts(p.n), w = (plot.X(1) - plot.X(0)) * 0.34, els = [];
                  for (let d = 1; d <= 9; d++) {
                    els.push(s('rect', { x: plot.X(d) - w, y: plot.Y(c[d - 1]), width: 2 * w, height: plot.Y(0) - plot.Y(c[d - 1]), rx: 3, class: 'fl-violet', opacity: 0.85 }));
                    els.push(s('rect', { x: plot.X(d) - w, y: plot.Y(BENFORD[d - 1]), width: 2 * w, height: plot.Y(0) - plot.Y(BENFORD[d - 1]), rx: 3, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }));
                    els.push(s('text', { x: plot.X(d), y: plot.Y(0) + 18, class: 'lbl', 'text-anchor': 'middle', text: String(d) }));
                  }
                  return els;
                },
                readout: (p) => {
                  const c = counts(p.n);
                  return `first digit 1: **${(c[0] * 100).toFixed(1)}%** (Benford: 30.1%) · first digit 9: **${(c[8] * 100).toFixed(1)}%** (Benford: 4.6%)`;
                },
              },
              after: r`Why? Benford's law holds for quantities spread over many orders of magnitude, where the logarithm is evenly spread. On a logarithmic scale, the stretch from 1 to 2 takes up $\log_{10} 2 \approx 30\%$ of each factor of 10, while 9 to 10 takes only $\log_{10}\frac{10}{9} \approx 4.6\%$.`,
            },
            { /*anim:powerlaws*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Around the log circle',
              body: r`Why do powers of 2 follow Benford's law? Wrap a logarithmic scale from 1 to 10 around a circle. Each digit gets an arc: 1 gets the slice from 1 to 2, which is $\log_{10} 2 \approx 30\%$ of the way round, while 9 gets only $\log_{10}\tfrac{10}{9} \approx 5\%$. Doubling a number moves it the same distance round the circle every time.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 3.1, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 2.5, max: 105, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const n = Math.min(100, Math.floor(p.t)), L2 = Math.log10(2), els = [], cols = ['coral', 'blue', 'teal', 'amber', 'violet', 'pink', 'blue', 'teal', 'amber'];
                  const ang = (f) => Math.PI / 2 - 2 * Math.PI * f, P = (f, r) => [plot.X(r * Math.cos(ang(f))), plot.Y(r * Math.sin(ang(f)))];
                  for (let d = 1; d <= 9; d++) {
                    const f0 = Math.log10(d), f1 = Math.log10(d + 1), [x0, y0] = P(f0, 1), [x1, y1] = P(f1, 1), R = plot.X(1) - plot.X(0);
                    els.push(s('path', { d: `M${plot.X(0)} ${plot.Y(0)}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z`, class: `fl-${cols[d - 1]}`, opacity: 0.25, stroke: 'var(--card)', 'stroke-width': 1.5 }));
                    const [tx, ty] = P((f0 + f1) / 2, 0.8);
                    els.push(s('text', { x: tx, y: ty + 5, 'text-anchor': 'middle', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:800', text: String(d) }));
                  }
                  // the last few jumps, then the current point
                  for (let k = Math.max(0, n - 6); k <= n; k++) { const [x, y] = P((k * L2) % 1, 1); els.push(s('circle', { cx: x, cy: y, r: k === n ? 8 : 4, class: 'fl-ink', opacity: k === n ? 1 : 0.25 + 0.1 * (k - n + 6) })); }
                  // tally of first digits so far, with Benford's prediction
                  const cnt = new Array(10).fill(0);
                  for (let k = 0; k <= n; k++) cnt[Math.floor(10 ** ((k * L2) % 1) + 1e-9)]++;
                  for (let d = 1; d <= 9; d++) {
                    const x = plot.X(1.45 + 0.17 * (d - 1)), w = plot.X(0.12) - plot.X(0), base = plot.Y(-1.0), sc = (plot.Y(0) - plot.Y(1.9)) / 0.4;
                    els.push(s('rect', { x, y: base - (cnt[d] / (n + 1)) * sc, width: w, height: (cnt[d] / (n + 1)) * sc, class: `fl-${cols[d - 1]}`, opacity: 0.8 }));
                    els.push(s('rect', { x: x - 2, y: base - Math.log10(1 + 1 / d) * sc - 1, width: w + 4, height: 2.5, class: 'fl-ink' }));
                    els.push(s('text', { x: x + w / 2, y: base + 16, 'text-anchor': 'middle', class: 'tick', text: String(d) }));
                  }
                  return els;
                },
                readout: (p) => { const n = Math.min(100, Math.floor(p.t)), f = (n * Math.log10(2)) % 1, e = Math.floor(n * Math.log10(2)); return `$2^{${n}} \\approx ${(10 ** f).toFixed(2)} \\times 10^{${e}}$ · first digit **${Math.floor(10 ** f + 1e-9)}** · bars: first digits so far (black ticks: Benford)`; },
              },
              after: r`Each doubling adds $\log_{10} 2 \approx 0.301$ of a turn. Because that number is irrational, the point never lands in the same place twice and spreads itself evenly round the circle. So the share of powers of 2 that start with digit $d$ is just the size of $d$'s arc, $\log_{10}\left(1 + \tfrac1d\right)$: exactly Benford's law. Anything that grows by multiplying, like populations, prices or bank balances, wanders round the log circle in the same way.`,
            },
            {
              type: 'numeric',
              title: 'Digit one',
              prompt: r`Using Benford's formula, what's the probability that the first digit is 1? (As a percentage, 1 decimal place.)`,
              unit: '%',
              answer: 100 * Math.log10(2),
              tol: 0.06,
              wrong: [{ v: 11.1, tol: 0.1, why: 'That’s 1/9, for equally likely digits.' }],
              explain: r`$\log_{10}(1 + 1) = \log_{10} 2 \approx 30.1\%$.`,
            },
            {
              type: 'mcq',
              title: 'Change the units',
              prompt: r`A list of river lengths follows Benford's law in kilometres. What happens if you convert them all to miles?`,
              choices: [
                { t: 'The first digits still follow Benford’s law', ok: true },
                { t: 'The pattern is destroyed', why: 'Multiplying everything by a constant shifts all the logarithms equally, so an evenly spread log distribution stays evenly spread.' },
                { t: 'Every first digit becomes equally likely', why: 'Changing units doesn’t make digits uniform.' },
              ],
              explain: r`Benford's law is the only first-digit law that's **scale invariant**: it survives any change of units. That's a deep reason it appears so widely: nature doesn't care whether we measure in kilometres or miles.`,
            },
            {
              type: 'mcq',
              title: 'Catching fraudsters',
              prompt: r`Forensic accountants check whether the first digits of a company's expense claims follow Benford's law. Why might fabricated numbers fail the test?`,
              choices: [
                { t: 'People inventing “random-looking” numbers tend to spread first digits too evenly', ok: true },
                { t: 'Fake numbers are always round', why: 'Fraudsters often avoid round numbers. The giveaway is the distribution of first digits.' },
                { t: 'Benford’s law applies only to honest people', why: 'It’s a statistical pattern of naturally arising data. Invented data often doesn’t have it.' },
              ],
              explain: r`Invented numbers typically have too few 1s and too many 5s–9s. Benford analysis is a screening tool used by tax authorities and auditors, though not proof on its own: some genuine data (prices set at £9.99, numbers with fixed ranges like heights) don't follow the law.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Digits 1 to 3',
              prompt: r`What's the probability that the first digit is 1, 2 or 3? (As a percentage, nearest whole number. Hint: the probabilities add up to $\log_{10} 4$.)`,
              unit: '%',
              answer: Math.round(100 * Math.log10(4)),
              tol: 0.6,
              wrong: [{ v: 33, why: 'That’s 3/9, for uniform digits.' }],
              explain: r`$\log_{10}\frac21 + \log_{10}\frac32 + \log_{10}\frac43 = \log_{10} 4 \approx 60\%$. Most numbers in the wild start with 1, 2 or 3.`,
            },
          ],
          recap: [
            r`Benford's law: first digit $d$ appears with probability $\log_{10}(1 + 1/d)$.`,
            'About 30% of such numbers start with 1, under 5% with 9.',
            'It holds for data spanning many orders of magnitude, and helps detect fabricated numbers.',
          ],
        },
        {
          id: 'zipf',
          title: 'Zipf’s Law',
          summary: 'Rank times frequency',
          icon: 'book',
          steps: [
            {
              type: 'explain',
              title: 'The most common words',
              body: r`Count every word in a large body of English text and rank them: "the" first, "of" second, "and" third, and so on. Linguist George Zipf noticed in the 1930s and 40s that a word's frequency is roughly **inversely proportional to its rank**:
$$\text{frequency} \propto \frac{1}{\text{rank}}$$
The 2nd most common word appears about half as often as the 1st, the 10th about a tenth as often. "The" alone makes up roughly 5–7% of written English.`,
            },
            {
              type: 'numeric',
              title: 'Predicting a rank',
              prompt: r`In a million-word text, the most common word appears 60,000 times. According to Zipf's law, about how many times does the 20th most common word appear?`,
              unit: 'times',
              answer: 3000,
              wrong: [{ v: 59980, why: 'Zipf’s law divides by the rank: 60,000 ÷ 20.' }, { v: 1200000, why: 'Higher ranks are less common: divide, don’t multiply.' }],
              explain: r`$60{,}000 / 20 = 3000$. The same pattern appears in city populations, website visits and company sizes: a few giants and a very long tail of small ones.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Half of all text',
              prompt: r`Suppose a language has 10,000 words following Zipf's law exactly. How many of the most common words make up **half** of all the words in a typical text? Drag to find out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: 0, ymax: 0.8, grid: 50, gridY: 0.1, height: 260, axes: { xlabel: 'number of top words', ylabel: 'share of all text', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { k: { min: 1, max: 300, step: 1, value: 10, slider: false } },
                curves: [{ f: (x) => coverage(Math.max(1, Math.round(x))), color: 'violet', width: 3 }, { f: () => 0.5, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.k, y: (p) => coverage(p.k), drag: { x: 'k' }, color: 'teal' }],
                readout: (p) => r`the top ${p.k} words make up $${(100 * coverage(p.k)).toFixed(1)}\%$ of the text`,
                goal: (p) => coverage(p.k) >= 0.5 && coverage(p.k - 1) < 0.5,
                hint: 'The curve rises steeply at first, then very slowly.',
                solution: { k: 75 },
              },
              explain: r`Just **75 words** (out of 10,000) cover half of all text, while the other half is spread across 9,925 rarer words. That's why learners pick up common words fast but keep meeting unfamiliar ones for years.`,
            },
            {
              type: 'numeric',
              title: 'The tenth word',
              prompt: r`By Zipf’s law, the word of rank $k$ appears with frequency proportional to $\frac1k$. If "the" (rank 1) makes up 7% of English text, how often does the 10th most common word appear?`,
              unit: '%',
              answer: 0.7,
              tol: 0.01,
              explain: r`$\frac{7\%}{10} = 0.7\%$. Zipf’s law holds surprisingly well across languages, for city sizes and website visits, though it breaks down for very rare words.`,
            },
            {
              type: 'numeric',
              title: 'Million-person cities',
              prompt: r`Zipf’s law also roughly describes city sizes: the city of rank $k$ has about $\frac1k$ the population of the largest. If a country’s largest city has 6 million people, how many of its cities have at least 1 million?`,
              unit: 'cities',
              answer: 6,
              wrong: [{ v: 1, why: r`Each rank divides the largest city's population: rank 2 has 3 million, rank 3 has 2 million, and so on.` }],
              explain: r`The rank-$k$ city has $\frac{6}{k}$ million people, which is at least 1 million for $k = 1, 2, \dots, 6$: **six** cities. Doubling the threshold to 2 million halves the count to three. That proportional thinning is the power law at work.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Cities',
              prompt: r`Zipf's law also describes city sizes in many countries. If the largest city has 8 million people, roughly how big is the 4th largest?`,
              choices: [
                { t: 'About 2 million', ok: true },
                { t: 'About 7 million', why: 'Zipf’s law divides the largest by the rank: 8 ÷ 4.' },
                { t: 'About 0.5 million', why: 'That would be dividing by 16. Zipf divides by the rank, 4.' },
              ],
              explain: r`$\frac{8}{4} = 2$ million. It's only approximate, and some countries (like the UK, with London far bigger than expected) deviate, but the pattern is remarkably common.`,
            },
          ],
          recap: [
            r`Zipf's law: frequency $\propto 1/\text{rank}$.`,
            'It describes word frequencies, city sizes and many other rankings.',
            'A few items dominate, followed by a long tail.',
          ],
        },
      ],
    },
    {
      title: 'Power Laws',
      summary: 'Straight lines on log scales, and heavy tails.',
      lessons: [
        {
          id: 'loglog',
          title: 'Log–Log Plots',
          summary: 'Revealing hidden exponents',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Straightening a power law',
              body: r`A **power law** has the form $y = C x^k$. Take logarithms of both sides:
$$\log y = \log C + k \log x$$
So plotting $\log y$ against $\log x$ gives a **straight line** with slope $k$. That's how scientists spot power laws in data: put both axes on logarithmic scales and look for a line.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fit the line',
              prompt: r`The dots are data plotted on log–log axes (each tick is a factor of 10 on the vertical axis and a factor of 2 on the horizontal). Adjust $C$ and $k$ so the line $y = Cx^k$ passes through all the dots.`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 6.3, ymin: -0.3, ymax: 3.6, grid: false, height: 300, padL: 52,
                axes: { xlabel: 'x', ylabel: 'y', xticks: 1, yticks: 1, xfmt: (v) => String(2 ** Math.round(v)), yfmt: (v) => String(10 ** Math.round(v)), xAt: -0.3, yAt: -0.3 },
                params: {
                  C: { min: 1, max: 6, step: 0.5, value: 1, label: r`$C$`, color: 'amber', format: (v) => v.toFixed(1) },
                  k: { min: 0.5, max: 2.5, step: 0.05, value: 1, label: r`$k$`, color: 'violet', format: (v) => v.toFixed(2) },
                },
                curves: [{ f: (lx, p) => Math.log10(p.C * (2 ** lx) ** p.k), color: 'violet', width: 3 }],
                extra: ({ plot, s }) => DATA.map(([x, y]) => s('circle', { cx: plot.X(Math.log2(x)), cy: plot.Y(Math.log10(y)), r: 6, class: 'fl-coral' })),
                readout: (p) => r`$y = ${p.C.toFixed(1)}\,x^{${p.k.toFixed(2)}}$`,
                goal: (p) => Math.abs(p.k - 1.5) < 0.01 && Math.abs(p.C - 3) < 0.01,
                hint: r`The slope sets $k$; the height at $x = 1$ (where $x^k = 1$) sets $C$. At $x = 1$ the data point is $y = 3$.`,
                solution: { C: 3, k: 1.5 },
              },
              explain: r`$y = 3x^{1.5}$. At $x = 1$, $y = C$; the slope of the line gives the exponent. Real examples: Kepler's third law (orbital period $\propto$ distance$^{1.5}$, the very exponent here), animal metabolic rate $\propto$ mass$^{0.75}$, and earthquake frequencies against energy.`,
            },
            {
              type: 'numeric',
              title: 'Reading the exponent',
              prompt: r`On a log–log plot, a planet's orbital period rises by a factor of about 31.6 (that's $10^{1.5}$) when its distance from the Sun increases by a factor of 10. What's the exponent $k$ in period $\propto$ distance$^k$?`,
              answer: 1.5,
              tol: 0.01,
              wrong: [{ v: 3.16, tol: 0.01, why: r`The exponent is the slope on the log scale: $\log_{10} 31.6 / \log_{10} 10$.` }],
              explain: r`$k = \frac{\log 31.6}{\log 10} = 1.5$: Kepler's third law, $T^2 \propto a^3$.`,
            },
            {
              type: 'mcq',
              title: 'Power or exponential?',
              prompt: r`On log–log axes a power law is a straight line. What does an **exponential** curve like $y = 2^x$ look like on the same axes?`,
              choices: [
                { t: 'It curves upwards ever more steeply; exponentials are straight only when just the y-axis is logarithmic', ok: true },
                { t: 'A straight line too', why: 'Its log–log slope keeps increasing: exponentials outgrow every power law.' },
                { t: 'A horizontal line', why: 'It grows, so it can’t be horizontal.' },
              ],
              explain: r`$\log y = x \log 2$ is linear in $x$, not in $\log x$, so it's straight on a **semi-log** plot. Checking which plot straightens your data is a quick way to tell power-law growth from exponential growth.`,
            },
            {
              type: 'numeric',
              title: 'Reading a slope',
              prompt: r`On a log–log plot, a straight line with slope $-2$ means $y \propto x^{-2}$. If $x$ doubles, by what factor does $y$ change? (Decimal.)`,
              answer: 0.25,
              tol: 0.001,
              explain: r`$2^{-2} = \frac14 = 0.25$. Light intensity and gravity both fall like this with distance: the inverse-square law is a power law with exponent $-2$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Elephant and mouse',
              prompt: r`Metabolic rate scales as mass$^{0.75}$. An elephant is about 10,000 times heavier than a mouse. How many times greater is its metabolic rate?`,
              unit: '×',
              answer: 1000,
              relTol: 0.01,
              wrong: [{ v: 10000, why: 'The exponent 0.75 makes the rate grow more slowly than mass.' }, { v: 7500, why: r`$10{,}000^{0.75} = (10^4)^{0.75} = 10^3$.` }],
              explain: r`$(10^4)^{0.75} = 10^3 = 1000$. Per kilogram, the elephant burns energy 10 times more slowly than the mouse.`,
            },
          ],
          recap: [
            r`A power law $y = Cx^k$ is a straight line on log–log axes.`,
            'The slope is the exponent k.',
            'Kepler’s third law, metabolism and earthquake statistics follow power laws.',
          ],
        },
        {
          id: 'tails',
          title: 'Heavy Tails',
          summary: 'When the average misleads',
          icon: 'bolt',
          steps: [
            {
              type: 'numeric',
              title: 'A billionaire walks into a café',
              prompt: r`Nine people in a café each earn £30,000 a year. A tenth person, earning £10,000,000, walks in. What's the **mean** income now?`,
              unit: '£',
              answer: (9 * 30000 + 1e7) / 10,
              tol: 1,
              wrong: [{ v: 30000, why: 'That’s the median, which barely moves. The mean is the total divided by 10.' }],
              explain: r`$(9 \times 30{,}000 + 10{,}000{,}000) / 10 = £1{,}027{,}000$. The median is still £30,000. In heavy-tailed data, the mean is dragged far from what's typical.`,
            },
            {
              type: 'explain',
              title: 'Heavy-tailed distributions',
              body: r`Heights follow a bell curve: nobody is 10 times taller than average. But many quantities follow power laws in their **tails**: wealth, city sizes, book sales, earthquake energies, insurance losses, web traffic. In such distributions:

- Extreme values are rare but not negligible: they dominate totals. (Economist Vilfredo Pareto noted around 1900 that about 20% of Italians owned about 80% of the land, the origin of the "80/20 rule".)
- The sample average can jump wildly when a single huge value appears.
- The median is usually a far better guide to the typical case.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The 80/20 rule',
              prompt: r`In a Pareto distribution with tail index $\alpha$, the richest 20% hold a share $0.2^{1 - 1/\alpha}$ of the total. Find the $\alpha$ that gives Pareto's famous **80/20** split.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 3, ymin: 0.2, ymax: 1, grid: 0.25, gridY: 0.1, height: 260, axes: { xlabel: 'tail index α', ylabel: 'share held by the top 20%', xAt: 1, yAt: 0.2, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { a: { min: 1.05, max: 3, step: 0.01, value: 2, slider: false } },
                curves: [{ f: (a) => top20(a), color: 'violet', width: 3 }, { f: () => 0.8, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.a, y: (p) => top20(p.a), drag: { x: 'a' }, color: 'teal' }],
                readout: (p) => r`$\alpha = ${p.a.toFixed(2)}$: the top 20% hold $${(100 * top20(p.a)).toFixed(1)}\%$`,
                goal: (p) => Math.abs(top20(p.a) - 0.8) < 0.005,
                hint: 'Smaller α means a heavier tail and more inequality.',
                solution: { a: 1.16 },
              },
              explain: r`$\alpha \approx 1.16$. Heavier tails (smaller $\alpha$) concentrate even more in the top; at $\alpha = 2$ the top 20% hold "only" about 45%. Real wealth distributions have $\alpha$ around 1.5 in many countries.`,
            },
            {
              type: 'mcq',
              title: 'Planning for disasters',
              prompt: r`Flood damage follows a heavy-tailed distribution. An insurer sets prices using the average loss over the past 20 years, none of which had a truly extreme flood. What's the risk?`,
              choices: [
                { t: 'The average underestimates the true risk, because rare extreme events, absent from the sample, dominate long-run losses', ok: true },
                { t: 'None: 20 years of data gives a reliable average', why: 'With heavy tails, rare extremes carry much of the total. A short record can easily miss them.' },
                { t: 'The average overestimates the risk', why: 'It’s the opposite: the missing extreme events make the sample average too low.' },
              ],
              explain: r`In heavy-tailed worlds, history can badly understate risk until the "once in a century" event arrives. Nassim Nicholas Taleb called such events **black swans**. Risk managers use extreme-value theory and stress tests rather than simple averages.`,
            },
            {
              type: 'numeric',
              title: 'Eighty of eighty',
              prompt: r`If wealth follows the 80/20 rule at every scale, the top 20% hold 80% of the wealth, and the top 20% of **that** group (the top 4% overall) hold 80% of their share. What percentage of all wealth do the top 4% hold?`,
              unit: '%',
              answer: 64,
              tol: 0.5,
              explain: r`$0.8 \times 0.8 = 0.64$: 64%. Repeating the rule, the top 0.8% hold 51%. Self-similar inequality like this is a hallmark of power laws.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Fewer and fewer rich',
              prompt: r`In a Pareto (power-law) distribution with exponent $\alpha = 1.5$, the fraction of people earning more than $x$ falls like $x^{-1.5}$. If the threshold doubles, by what factor does the number of people above it shrink? (2 decimal places.)`,
              unit: '×',
              answer: 2 ** 1.5,
              tol: 0.01,
              explain: r`$2^{1.5} \approx 2.83$. So doubling the income threshold only divides the number of people by under 3: very high incomes are far more common than a bell curve would predict. That’s the signature of a heavy tail.`,
            },
          ],
          recap: [
            'In heavy-tailed data, a few extreme values dominate totals.',
            'The mean can be wildly unrepresentative; the median is more robust.',
            'Short records can badly underestimate the risk of extremes.',
          ],
        },
      ],
    },
    {
      title: 'Where Power Laws Come From',
      summary: 'Broken averages and runaway growth.',
      lessons: [
        {
          id: 'averages',
          title: 'When Averages Fail',
          summary: 'The law of large numbers breaks',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Averages usually settle',
              body: r`The law of large numbers says that the average of many independent samples settles down to the true mean. But it needs the true mean to **exist**.

For a Pareto distribution with tail index $\alpha$, the mean is $\frac{\alpha}{\alpha - 1}$ (times the minimum value) when $\alpha > 1$. When $\alpha \le 1$, the tail is so heavy that the mean is **infinite**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Running averages',
              body: r`The curve shows the running average of 3,000 random samples from a Pareto distribution (minimum value 1). Change the tail index.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3000, ymin: 0, ymax: 20, grid: 500, gridY: 4, height: 270, axes: { xlabel: 'number of samples', ylabel: 'running average' },
                params: { a: { min: 0.8, max: 3, step: 0.1, value: 3, label: 'tail index α', color: 'violet', format: (v) => v.toFixed(1) } },
                curves: [{ f: (n, p) => runningMean(p.a)[Math.min(2999, Math.max(0, Math.round(n) - 1))], color: 'violet', width: 2.5 }, { f: (n, p) => (p.a > 1 ? p.a / (p.a - 1) : NaN), color: 'coral', dash: true, width: 1.5 }],
                readout: (p) => (p.a > 1 ? r`true mean $\frac{\alpha}{\alpha - 1} = ${(p.a / (p.a - 1)).toFixed(2)}$ (dashed); after 3,000 samples: $${runningMean(p.a)[2999].toFixed(2)}$` : `α ≤ 1: the mean is infinite, and the running average keeps jumping up (now ${runningMean(p.a)[2999].toFixed(1)})`),
              },
              after: r`At $\alpha = 3$ the average settles quickly. Near $\alpha = 1.2$ it lurches upwards every time a giant value arrives, settling only very slowly. Below 1 it never settles: each new record outweighs everything before.`,
            },
            {
              type: 'numeric',
              title: 'The true mean',
              prompt: r`City populations above 100,000 are roughly Pareto with $\alpha = 2$. What's the mean population of such cities, in thousands?`,
              unit: 'thousand',
              answer: 200,
              wrong: [{ v: 100, why: r`That's the minimum. The mean is $\frac{\alpha}{\alpha - 1} = 2$ times the minimum.` }],
              explain: r`$\frac{2}{2 - 1} \times 100{,}000 = 200{,}000$, even though most such cities are near the 100,000 minimum. A few giant cities pull the average up.`,
            },
            {
              type: 'mcq',
              title: 'Which summary?',
              prompt: r`You're reporting "typical" book sales, which have a heavy tail (a few bestsellers sell millions). What should you report?`,
              choices: [
                { t: 'The median, and perhaps the share of sales from the top 1% of books', ok: true },
                { t: 'The mean: it uses all the data', why: 'With a heavy tail, the mean is dominated by a handful of bestsellers.' },
                { t: 'The maximum', why: 'That describes one outlier, not the typical book.' },
              ],
              explain: r`Most books sell only a few hundred copies, so the median is small, while the mean is pulled far higher by bestsellers. Reporting both, plus how concentrated the total is, tells the real story.`,
            },
            {
              type: 'numeric',
              title: 'Mean versus median',
              prompt: r`99 people each have £50,000, and one person has £10 billion. What is the mean wealth, in millions of pounds? (2 decimal places.)`,
              unit: '£ million',
              answer: (99 * 50000 + 1e10) / 100 / 1e6,
              tol: 0.01,
              explain: r`$\frac{99 \times 50{,}000 + 10^{10}}{100} \approx £100.05$ million, while the median is £50,000. In heavy-tailed data, the mean describes nobody; the median describes the typical person.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'No mean at all',
              prompt: r`The Cauchy distribution is a bell-shaped curve with very heavy tails and no mean. If you average 1,000 Cauchy samples, how spread out is the result compared with a single sample?`,
              choices: [
                { t: 'Exactly as spread out: averaging doesn’t help at all', ok: true },
                { t: 'About √1000 times narrower, like normal data', why: 'That rule needs a finite variance, which Cauchy data lacks.' },
                { t: 'It always gives zero', why: 'The average is just as wild as one sample.' },
              ],
              explain: r`Remarkably, the average of $n$ Cauchy samples has **exactly** the same Cauchy distribution as one sample. The central limit theorem's comforting $1/\sqrt n$ shrinkage requires finite variance; heavy tails break it.`,
            },
          ],
          recap: [
            r`Pareto mean: $\frac{\alpha}{\alpha - 1}$ times the minimum, infinite for $\alpha \le 1$.`,
            'With heavy tails, running averages settle slowly or never.',
            'Use medians and concentration measures for heavy-tailed data.',
          ],
        },
        {
          id: 'richer',
          title: 'The Rich Get Richer',
          summary: 'Preferential attachment',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Success breeds success',
              body: r`Why are power laws so common? One famous mechanism: **preferential attachment**. Things that are already big tend to grow faster: popular websites attract more links, big cities attract more migrants, well-cited papers get cited more. Sociologist Robert Merton called it the **Matthew effect**.

A simple model is **Pólya's urn**: start with one red and one blue ball. Repeatedly draw a ball at random, then put it back **with another of the same colour**.`,
            },
            {
              type: 'numeric',
              title: 'The first draw',
              prompt: r`Starting with 1 red and 1 blue, you draw red and add another red. What's the probability that the next draw is red?`,
              answer: 2 / 3,
              tol: 0.005,
              wrong: [{ v: 0.5, why: 'The urn now has 2 red and 1 blue.' }],
              explain: r`$\frac23$. Early luck gets reinforced: one lucky draw makes the next one more likely to go the same way.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where does it settle?',
              body: r`Each run shows the fraction of red balls over 500 draws. Try different runs.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 500, ymin: 0, ymax: 1, grid: 100, gridY: 0.25, height: 260, axes: { xlabel: 'draws', ylabel: 'fraction red', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { run: { min: 1, max: 10, step: 1, value: 1, label: 'run', color: 'coral' } },
                curves: [{ f: (n, p) => polya(p.run)[Math.min(500, Math.max(0, Math.round(n)))], color: 'coral', width: 2.5 }],
                readout: (p) => `run ${p.run}: settles near **${Math.round(100 * polya(p.run)[500])}%** red`,
              },
              after: r`Each run settles down, but to a **different** value, decided mostly by the luck of the first few draws. Remarkably, the final fraction is equally likely to be anything from 0% to 100%. Small early advantages lock in.`,
            },
            {
              type: 'mcq',
              title: 'Networks',
              prompt: r`In 1999, Albert-László Barabási and Réka Albert modelled the web as new pages linking preferentially to pages that already have many links. What distribution of link counts does this produce?`,
              choices: [
                { t: 'A power law: a few hubs with enormous numbers of links and a long tail of pages with few', ok: true },
                { t: 'A bell curve centred on the average', why: 'Without preference, link counts would cluster near the average. With it, hubs emerge.' },
                { t: 'Every page ends up with the same number of links', why: 'Preferential attachment amplifies differences rather than evening them out.' },
              ],
              explain: r`Their model gives a power law with exponent 3 for the number of links. "Scale-free" networks like this are robust to random failures but vulnerable to attacks on their hubs, which matters for the internet, airline routes and disease spread.`,
            },
            {
              type: 'numeric',
              title: 'Pólya’s urn',
              prompt: r`An urn starts with one red and one blue ball. Each time you draw a ball, you put it back **with another of the same colour**. The first two draws are both red. What is the probability that the third draw is red too? (Decimal.)`,
              answer: 0.75,
              tol: 0.001,
              wrong: [{ v: 2 / 3, tol: 0.002, why: 'That was the chance before the second red ball was added. Count the balls now.' }],
              explain: r`Each red draw added a red ball, so the urn now holds 3 red and 1 blue: the chance is $\frac34$. Early luck snowballs: the long-run fraction of red settles down, but to a value that depends on the early draws (it is uniformly random!).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Cumulative advantage',
              prompt: r`Two equally talented musicians start with 100 and 110 fans. Each month, each gains 10% more fans (proportional growth). After 24 months, how many more fans does the second have than the first? (Nearest whole number; $1.1^{24} \approx 9.85$.)`,
              unit: 'fans',
              answer: Math.round(10 * 1.1 ** 24),
              tol: 1,
              wrong: [{ v: 10, why: 'The gap grows along with everything else under proportional growth.' }],
              explain: r`Both grow by a factor of 9.85, so the 10-fan gap becomes about **98**. Proportional growth turns small, arbitrary early differences into large absolute gaps: a big part of why success can look like talent even when it's partly luck.`,
            },
          ],
          recap: [
            'Preferential attachment: the more you have, the faster you grow.',
            'Pólya’s urn settles to a random limit decided by early luck.',
            'It produces power-law hubs in networks and cumulative advantage in society.',
          ],
        },
        {
          id: 'omori',
          title: 'Aftershocks & Omori’s Law',
          summary: 'A power law in time',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Shaking that slowly fades',
              body: r`After a large earthquake come aftershocks: many at first, then fewer and fewer. In 1894 the seismologist Fusakichi Omori noticed that their rate falls off roughly as **one over the time** since the main shock:
$$n(t) = \frac{K}{t + c},$$
where $t$ is in days, $K$ sets the overall level, and the small constant $c$ (a fraction of a day) stops the rate blowing up at $t = 0$. It is a power law in time, with exponent close to $-1$.`,
            },
            {
              type: 'numeric',
              title: 'Day ten',
              prompt: r`Ignoring the small $c$, suppose there are about 100 aftershocks on day 1. Roughly how many are there on day 10?`,
              answer: 10,
              explain: r`The rate falls as $\frac1t$: ten times later, ten times fewer, so about **10**. On day 100, about 1.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Equal shares of a log scale',
              prompt: r`The number of aftershocks between days $t_1$ and $t_2$ is $K\ln\frac{t_2 + c}{t_1 + c}$. With $c = 0.1$ day, find the day $T$ such that there are as many aftershocks between day 10 and day $T$ as in the **first 10 days**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3.5, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'days after the main shock (log scale)', ylabel: 'share of aftershocks so far', xticks: 1, yticks: 0.25, xfmt: (v) => String(10 ** v) },
                params: { T: { min: 1.1, max: 3.4, step: 0.001, value: 2, label: 'T', color: 'coral', format: (v) => `day ${Math.round(10 ** v)}` } },
                curves: [{ f: (x) => Math.log((10 ** x + 0.1) / 0.1) / Math.log((10 ** 3.5 + 0.1) / 0.1), color: 'violet', width: 3, from: 0 }],
                under: ({ plot, p, s }) => { const N = (a, b) => Math.log((b + 0.1) / (a + 0.1)), tot = N(0, 10 ** 3.5), y1 = N(0, 10) / tot, y2 = N(0, 10 ** p.T) / tot; return [s('rect', { x: plot.X(0), y: plot.Y(y1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(y1), class: 'fl-teal-soft', opacity: 0.7 }), s('rect', { x: plot.X(1), y: plot.Y(y2), width: plot.X(p.T) - plot.X(1), height: plot.Y(y1) - plot.Y(y2), class: 'fl-coral-soft', opacity: 0.7 })]; },
                readout: (p) => { const N = (a, b) => Math.log((b + 0.1) / (a + 0.1)), a = N(0, 10), b = N(10, 10 ** p.T); return `first 10 days (teal): ${(100 * a).toFixed(0)} units · day 10 to day ${Math.round(10 ** p.T)} (coral): **${(100 * b).toFixed(0)}** units`; },
                goal: (p) => Math.abs(10 ** p.T - 1020) < 15,
                hint: r`You need $\frac{T + 0.1}{10.1} = \frac{10.1}{0.1}$.`,
                solution: { T: 3.0086 },
              },
              explain: r`$T + 0.1 = \frac{10.1^2}{0.1}$, so $T \approx 1{,}020$ days: almost **three years** to match what happened in the first ten days. Aftershock sequences of big quakes go on for decades; some aftershocks of the 1811–12 New Madrid earthquakes may still be occurring.`,
            },
            {
              type: 'mcq',
              title: 'Does it ever stop?',
              prompt: r`With a rate of exactly $\frac{K}{t}$, the total number of aftershocks up to time $T$ grows like $K \ln T$. What does that mean for the long run?`,
              choices: [
                { t: 'The total keeps growing without limit, but ever more slowly', ok: true },
                { t: 'The total levels off at a fixed number', why: r`$\ln T$ has no upper limit, although it grows very slowly.` },
                { t: 'Aftershocks stop after 1,000 days', why: 'The rate keeps falling but never reaches zero.' },
              ],
              explain: r`Each factor of 10 in time adds the same number of aftershocks: as many from day 100 to 1,000 as from day 10 to 100. In practice the sequence fades into the background rate of ordinary quakes.`,
            },
            {
              type: 'numeric',
              title: 'Count them',
              prompt: r`With $K = 200$ per day and $c$ negligible, about how many aftershocks occur between day 1 and day 100?`,
              answer: 200 * Math.log(100),
              tol: 5,
              explain: r`$200 \ln 100 = 200 \times 4.61 \approx 921$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The biggest aftershock',
              prompt: r`Båth’s law, another empirical rule, says the largest aftershock is typically about 1.2 magnitude units smaller than the main shock. What magnitude would you expect for the largest aftershock of a magnitude 7.0 earthquake?`,
              answer: 5.8,
              tol: 0.01,
              explain: r`$7.0 - 1.2 = 5.8$. That’s still a damaging quake, and it can strike days or months later, which is why aftershock forecasts matter after any big earthquake.`,
            },
          ],
          recap: [
            r`Omori’s law: aftershock rate $n(t) = K/(t + c)$, a power law in time.`,
            'Each factor of ten in time brings the same number of aftershocks.',
            'Båth’s law: the largest aftershock is about 1.2 magnitudes below the main shock.',
          ],
        },
      ],
    },
  ],
};
