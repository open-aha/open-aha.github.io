const r = String.raw;
const VALS = [[48, 'Brand A', 'blue'], [52, 'Brand B', 'coral']];
// study hours vs exam score
const SX = [1, 2, 3, 4, 5, 6, 7, 8], SY = [52, 55, 61, 62, 68, 71, 73, 79];
const sse = (m, b) => SX.reduce((t, x, i) => t + (SY[i] - m * x - b) ** 2, 0);

export default {
  id: 'graphsread',
  subject: 'math',
  title: 'Reading Graphs',
  level: 'Foundational',
  cover: 'graphsread',
  tagline: 'Spot misleading charts, read log scales and scatter plots, and compare fairly with rates.',
  description: r`Charts are everywhere in the news, and they can mislead as easily as inform. Learn to check the axes, see through pictograms that exaggerate, read logarithmic scales, notice cherry-picked time windows, tell relative risk from absolute risk, fit trend lines to scatter plots, compare fairly using rates, and choose the right chart for the question.`,
  chapters: [
    {
      title: 'Tricks of the Eye',
      summary: 'Axes and areas.',
      lessons: [
        {
          id: 'axes',
          title: 'Check the Axis',
          summary: 'Truncated bar charts',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where does the axis start?',
              body: r`Two brands have 48% and 52% of the market. Move the point where the vertical axis starts, and watch how the difference **looks**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: 0, ymax: 1.12, grid: false, axes: false, height: 280,
                params: { b: { min: 0, max: 46, step: 1, value: 0, label: 'axis starts at', color: 'violet', format: (v) => `${v}%` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(0.3), x2: plot.X(3.7), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2 })];
                  VALS.forEach(([v, name, c], i) => {
                    const hgt = (v - p.b) / (55 - p.b);
                    const x = 1.2 + i * 1.6;
                    els.push(s('rect', { x: plot.X(x - 0.45), y: plot.Y(hgt), width: plot.X(x + 0.45) - plot.X(x - 0.45), height: plot.Y(0) - plot.Y(hgt), rx: 6, class: `fl-${c}` }));
                    els.push(s('text', { x: plot.X(x), y: plot.Y(hgt) - 8, 'text-anchor': 'middle', class: 'lbl', text: `${v}%` }));
                    els.push(s('text', { x: plot.X(x), y: plot.Y(0) + 20, 'text-anchor': 'middle', class: 'lbl', text: name }));
                  });
                  els.push(s('text', { x: plot.X(0.3), y: plot.Y(0) + 20, class: 'tick', text: `${p.b}%` }));
                  return els;
                },
                readout: (p) => `Brand B's bar looks **${((52 - p.b) / (48 - p.b)).toFixed(2)}×** as tall as Brand A's (the true ratio is 1.08×)`,
              },
              after: r`Starting the axis at 46% makes Brand B's bar look **three times** as tall, even though it's only 4 points ahead. A truncated axis isn't always dishonest (it can reveal small changes in, say, body temperature), but on a bar chart, where bar **length** suggests size, it misleads. Always check where the axis starts.`,
            },
            {
              type: 'numeric',
              title: 'How much bigger?',
              prompt: r`A bar chart's axis starts at 90. One bar shows 95 and another 100. The second bar looks twice as tall as the first. By what percentage is 100 actually larger than 95? (1 decimal place.)`,
              unit: '%',
              answer: (5 / 95) * 100,
              tol: 0.06,
              wrong: [{ v: 100, why: 'That’s how it looks, because the axis is truncated. Compute (100 − 95) ÷ 95.' }, { v: 5, why: r`The difference is 5 points, but as a percentage of 95 it's $\frac{5}{95}$.` }],
              explain: r`$\dfrac{100 - 95}{95} \approx 5.3\%$, nowhere near the "twice as tall" the chart suggests.`,
            },
            {
              type: 'mcq',
              title: 'Line charts are different',
              prompt: r`A line chart of a patient's temperature has a vertical axis from 36 °C to 40 °C, not starting at zero. Is that misleading?`,
              choices: [
                { t: 'No: on a line chart, the shape of the change matters, and starting at 0 would flatten a dangerous fever into an invisible wiggle', ok: true },
                { t: 'Yes: every axis must start at zero', why: 'That rule is for bar charts, where bar length represents the amount. Line charts show changes, so zooming in can be honest.' },
              ],
              explain: r`Bars encode quantity by **length**, so they need a zero baseline. Lines encode change by **position**, so a zoomed axis can be fine, as long as it's clearly labelled. The question is always: does the visual impression match the real size of the difference?`,
            },
            {
              type: 'numeric',
              title: 'How much bigger does it look?',
              prompt: r`Two bars show 48% and 52%. If the vertical axis starts at 46%, the bars are drawn 2 and 6 units tall. How many times taller does the second bar look?`,
              unit: '×',
              answer: 3,
              wrong: [{ v: 1.08, tol: 0.01, why: r`That’s the true ratio. The drawn bars are 2 and 6 units tall.` }],
              explain: r`$\frac{6}{2} = 3$ times taller, though 52 is only about 8% more than 48. A truncated axis can turn a small difference into an apparently huge one.`,
            },
            {
              type: 'numeric',
              title: 'Percent or percentage points?',
              prompt: r`An unemployment rate rises from 4% to 5%. That’s a rise of 1 percentage point. By what **percentage** has the rate increased?`,
              unit: '%',
              answer: 25,
              tol: 0.5,
              explain: r`$\frac{5 - 4}{4} = 25\%$. Both statements are true, but "unemployment up 25%" sounds far more alarming than "up 1 point". Always check which one a headline means.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Two vertical axes',
              prompt: r`A chart shows ice-cream sales (left axis) and shark attacks (right axis) rising and falling together. The two axes have different scales chosen by the author. What's the danger?`,
              choices: [
                { t: 'By stretching either axis, the author can make any two series look closely linked', ok: true },
                { t: 'None: two axes are always more informative', why: 'Dual axes let the author choose both scales independently, so the visual overlap can be manufactured.' },
                { t: 'It proves ice cream causes shark attacks', why: 'Both are driven by summer weather. And the overlap on the chart could be tuned anyway.' },
              ],
              explain: r`With dual axes, the visual alignment is an editorial choice, so treat apparent "tracking" with suspicion. And even a real correlation here comes from a common cause: hot weather brings both swimmers and ice-cream buyers.`,
            },
          ],
          recap: [
            'On bar charts, bars should start at zero.',
            'Truncated axes exaggerate small differences.',
            'Always read the axis labels before judging a chart.',
          ],
        },
        {
          id: 'area',
          title: 'Misleading Pictures',
          summary: 'When areas lie',
          icon: 'grip',
          steps: [
            {
              type: 'mcq',
              title: 'The bigger bag of money',
              prompt: r`A chart shows one country's spending as a picture of a money bag, and another country's (twice as much) as the same bag drawn twice as tall **and** twice as wide. How much bigger does the second bag look?`,
              choices: [
                { t: 'About 4 times bigger, because its area is 4 times larger', ok: true },
                { t: 'Twice as big', why: 'Doubling both height and width quadruples the area, and our eyes judge by area.' },
                { t: 'Eight times bigger, always', why: 'Drawn in 2D it looks 4× bigger by area. If drawn as a 3D bag, it might even suggest 8× by volume.' },
              ],
              explain: r`Scaling a picture by 2 in both directions makes its area $2^2 = 4$ times larger, so it **looks** four times as big. If it's drawn to look three-dimensional, viewers may perceive it as $2^3 = 8$ times bigger. Honest pictograms show "twice as much" with **two** equal pictures, or scale the area, not the height.`,
            },
            {
              type: 'mcq',
              title: '3D pie charts',
              prompt: r`A 3D pie chart is tilted so the slices at the front look bigger and the ones at the back look smaller. What's the effect?`,
              choices: [
                { t: 'Equal slices look unequal: the tilt distorts the angles and areas we compare', ok: true },
                { t: 'It makes the chart more accurate', why: 'The perspective changes the apparent size of the slices, which is exactly what the reader is meant to compare.' },
                { t: 'No effect, because the percentages are written on it', why: 'If readers must read the numbers to get it right, the picture is misleading them.' },
              ],
              explain: r`Perspective shrinks the back and enlarges the front, so a 25% slice in front can look bigger than a 30% slice behind. Even flat pie charts are hard to compare by eye; a simple bar chart is usually clearer.`,
            },
            {
              type: 'interactive',
              title: 'Honest bubbles',
              body: r`City B has **4 times** the population of city A. The chart shows each as a circle. Set the size of B's circle so that the **area** shows the true ratio.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: -0.2, ymax: 4.6, grid: false, axes: false, maxWidth: 480,
                params: { k: { min: 1, max: 4, step: 0.1, value: 4, label: 'radius of B ÷ radius of A', color: 'coral', format: (v) => `${v.toFixed(1)}×` } },
                extra: ({ plot, p, s }) => { const u = plot.X(1) - plot.X(0), r0 = 0.55; return [s('circle', { cx: plot.X(1.5), cy: plot.Y(r0), r: r0 * u, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('circle', { cx: plot.X(6), cy: plot.Y(r0 * p.k), r: r0 * p.k * u, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('text', { x: plot.X(1.5), y: plot.Y(r0) + 5, 'text-anchor': 'middle', class: 'lbl', text: 'A' }), s('text', { x: plot.X(6), y: plot.Y(r0 * p.k) + 5, 'text-anchor': 'middle', class: 'lbl', text: 'B' })]; },
                readout: (p) => `B's circle has **${(p.k * p.k).toFixed(1)}×** the area of A's (true ratio: 4×)`,
                goal: (p) => Math.abs(p.k - 2) < 1e-9,
                hint: 'Area grows with the square of the radius.',
                solution: { k: 2 },
              },
              explain: r`A radius twice as big gives an area $2^2 = 4$ times as big: honest. Scaling the radius by 4 (the tempting choice) would make B look **16** times bigger. Many published bubble charts make exactly this mistake.`,
            },
            {
              type: 'numeric',
              title: 'The lie factor',
              prompt: r`Edward Tufte defined the **lie factor** as (size of the effect shown in the graphic) ÷ (size of the effect in the data). A value grows by 50%, but its pictogram is enlarged by 50% in both height and width. What's the lie factor? (Compare the area increase with the data increase.)`,
              answer: 1.25 / 0.5,
              tol: 0.01,
              wrong: [{ v: 1, why: 'The picture’s area grows by 1.5 × 1.5 = 2.25, an increase of 125%, not 50%.' }, { v: 2.25, tol: 0.01, why: 'Compare increases: the area rose 125% while the data rose 50%.' }],
              explain: r`The area grows from 1 to $1.5^2 = 2.25$: a 125% increase, against a true increase of 50%. Lie factor $= \frac{125\%}{50\%} = 2.5$. Tufte suggested anything outside 0.95–1.05 is misleading.`,
            },
            {
              type: 'mcq',
              title: 'Honest pictograms',
              prompt: r`A chart shows one country with twice another’s oil output. Which pictogram is honest?`,
              choices: [
                { t: r`Two identical barrels for one, one barrel for the other`, ok: true },
                { t: r`One barrel drawn twice as tall and twice as wide`, why: r`That barrel has four times the area (and looks eight times the volume).` },
                { t: r`One barrel twice as wide only`, why: r`Twice the area is honest in principle, but readers judge such shapes poorly; repeated icons are clearer.` },
              ],
              explain: r`Repeating identical icons makes the count obvious. Scaling an icon in both directions squares the visual effect, one of the commonest ways charts mislead.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Draw it honestly',
              prompt: r`To show a value 9 times larger with a circle, by how many times should you scale the circle's **radius**?`,
              unit: '×',
              answer: 3,
              wrong: [{ v: 9, why: 'Scaling the radius by 9 would make the area 81 times larger.' }, { v: 81, why: 'Area goes as radius squared. You want the area, not the radius, to be 9×.' }],
              explain: r`Area $\propto r^2$, so 9× the area needs $\sqrt9 = 3$× the radius. It's the square–cube law again, this time fooling the eye.`,
            },
          ],
          recap: [
            'Our eyes judge pictures by area (or volume), not height.',
            'Doubling a picture’s height and width makes it look 4× bigger.',
            'Scale circles and pictures by area to represent values honestly.',
          ],
        },
      ],
    },
    {
      title: 'Scales and Context',
      summary: 'Logarithms, time windows and risk.',
      lessons: [
        {
          id: 'log',
          title: 'Logarithmic Scales',
          summary: 'Equal steps, equal ratios',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two views of growth',
              body: r`Something doubles every 3 days, starting at 10. Switch between an ordinary (linear) vertical axis and a **logarithmic** one, where each gridline is 10 times the previous one.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 36, ymin: 0, ymax: 1, grid: false, axes: false, height: 300, padL: 64,
                params: { log: { min: 0, max: 1, step: 1, value: 0, label: 'vertical axis', color: 'violet', format: (v) => (v ? 'logarithmic' : 'linear') } },
                extra: ({ plot, p, s }) => {
                  const f = (t) => 10 * 2 ** (t / 3);
                  const maxV = f(36);
                  const Y = (v) => (p.log ? Math.log10(v) / Math.log10(maxV * 1.2) : v / (maxV * 1.1));
                  const els = [];
                  const lines = p.log ? [10, 100, 1000, 10000] : [10000, 20000, 30000, 40000];
                  for (const v of lines) {
                    els.push(s('line', { x1: plot.X(0), x2: plot.X(36), y1: plot.Y(Y(v)), y2: plot.Y(Y(v)), stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
                    els.push(s('text', { x: plot.X(0) - 8, y: plot.Y(Y(v)) + 5, class: 'tick', 'text-anchor': 'end', text: v.toLocaleString('en-US') }));
                  }
                  let d = '';
                  for (let i = 0; i <= 144; i++) {
                    const t = i / 4;
                    d += `${i ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(Y(f(t))).toFixed(1)}`;
                  }
                  els.push(s('path', { d, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(36), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2 }));
                  for (let t = 0; t <= 36; t += 6) els.push(s('text', { x: plot.X(t), y: plot.Y(0) + 20, class: 'tick', 'text-anchor': t === 36 ? 'end' : 'middle', text: t === 36 ? '36 days' : String(t) }));
                  return els;
                },
                readout: (p) => (p.log ? 'On a log scale, steady doubling is a **straight line**: every equal step up means multiplying by the same factor.' : 'On a linear scale, nothing seems to happen for weeks, then it explodes.'),
              },
              after: r`On a linear axis, early growth is invisible and then suddenly vertical. On a log axis, exponential growth is a straight line, and the **slope** shows the growth rate. Both are honest, but they answer different questions: "how many?" versus "how fast is it multiplying?".`,
            },
            {
              type: 'numeric',
              title: 'Reading a log axis',
              prompt: r`On a logarithmic axis, the gridlines go 1, 10, 100, 1000. A point sits exactly halfway between the 100 and 1000 lines. What value does it represent? (Nearest whole number.)`,
              answer: Math.round(10 ** 2.5),
              tol: 1,
              wrong: [{ v: 550, why: r`Halfway on a log scale isn't the average. It's $10^{2.5}$.` }, { v: 500, why: r`On a log axis, the midpoint between 100 and 1000 is $\sqrt{100 \times 1000}$, not 500.` }],
              explain: r`Halfway in log terms is $10^{2.5} = \sqrt{100 \times 1000} \approx 316$. On a log scale, midpoints are **geometric** means. Misreading log axes as linear is a common mistake in news coverage.`,
            },
            {
              type: 'interactive',
              title: 'Find 50 on a log axis',
              body: r`This axis is logarithmic: 1, 10, 100, 1000 are equally spaced. Slide the marker to the value **50**.`,
              widget: {
                kind: 'graph', xmin: -0.1, xmax: 3.1, ymin: -1, ymax: 1, grid: false, axes: false, height: 140,
                params: { x: { min: 0, max: 3, step: 0.005, value: 1.5, label: 'marker position', color: 'coral', format: (v) => `${(10 ** v).toFixed(1)}` } },
                extra: ({ plot, p, s }) => { const els = [s('line', { x1: plot.X(0), x2: plot.X(3), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2 })]; for (let dec = 0; dec < 3; dec++) for (let m = 1; m <= 10; m++) { const x = dec + Math.log10(m), major = m === 1 || m === 10; els.push(s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(0), y2: plot.Y(major ? 0.45 : 0.22), stroke: 'var(--ink-3)', 'stroke-width': major ? 2 : 1 })); if (m === 1) els.push(s('text', { x: plot.X(x), y: plot.Y(-0.35) + 6, 'text-anchor': 'middle', class: 'tick', text: String(10 ** dec) })); } els.push(s('text', { x: plot.X(3), y: plot.Y(-0.35) + 6, 'text-anchor': 'middle', class: 'tick', text: '1000' })); els.push(s('path', { d: `M${plot.X(p.x)} ${plot.Y(0.05)}l-8 -16h16Z`, class: 'fl-coral' })); return els; },
                readout: (p) => `marker at **${(10 ** p.x).toFixed(1)}**, ${((p.x % 1) * 100).toFixed(0)}% of the way through its decade`,
                goal: (p) => Math.abs(10 ** p.x - 50) < 1,
                hint: 'Between 10 and 100. Halfway through that decade is about 32.',
                solution: { x: 1.699 },
              },
              explain: r`50 sits about **70%** of the way from 10 to 100, because $\log_{10} 50 \approx 1.70$. The little ticks bunch up toward each power of 10: on a log axis 2, 3, 4 … are not evenly spaced, but the **ratios** 1→2, 10→20, 100→200 all look the same size.`,
            },
            {
              type: 'numeric',
              title: 'Doubling time from a slope',
              prompt: r`On a log-scale chart, a line rises by one full decade (×10) in 10 days. What is the doubling time? ($\log_{10} 2 \approx 0.301$.)`,
              unit: 'days',
              answer: 10 * Math.log10(2),
              tol: 0.02,
              wrong: [{ v: 5, why: 'Doubling isn’t half of ×10. A doubling is 0.301 of a decade.' }, { v: 1, why: 'That would be ×1024 in 10 days.' }],
              explain: r`A doubling is $\log_{10} 2 \approx 0.301$ of a decade, so it takes $0.301 \times 10 \approx 3.0$ days. Reading slopes off log charts was how epidemiologists tracked doubling times during the COVID-19 pandemic.`,
            },
            {
              type: 'numeric',
              title: 'Doublings in three decades',
              prompt: r`On a log scale, going from 1 to 1,000 spans three factors of 10. About how many **doublings** is that? (Nearest whole number.)`,
              answer: 10,
              explain: r`$2^{10} = 1024 \approx 1000$, so about 10 doublings. On a log chart of something doubling regularly, each factor of 10 takes about 3.3 doubling times.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Comparing slopes',
              prompt: r`On a log-scale chart of cases in two countries, country A's line is steeper than B's, but lower. What does that tell you?`,
              choices: [
                { t: 'A has fewer cases now but they’re multiplying faster', ok: true },
                { t: 'A has more cases', why: 'Its line is lower, so it has fewer cases at the moment.' },
                { t: 'Both grow at the same rate', why: 'On a log scale, the slope is the growth rate, and A’s is steeper.' },
              ],
              explain: r`On a log scale, **height** shows the current number and **slope** shows how fast it's multiplying. If nothing changes, A will overtake B, which a linear chart would hide until late.`,
            },
          ],
          recap: [
            'On a log scale, equal steps mean equal multiplication.',
            'Exponential growth appears as a straight line on a log scale.',
            'The midpoint between 100 and 1000 on a log axis is about 316.',
          ],
        },
        {
          id: 'risk',
          title: 'Context Matters',
          summary: 'Cherry-picking and risk',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              title: 'Choose your window',
              prompt: r`A company's share price rose from 80 to 100 in the past month, but fell from 150 to 100 over the past two years. An advert says "Shares up 25%!" What's the problem?`,
              choices: [
                { t: 'The time window was chosen to tell a flattering story', ok: true },
                { t: 'Nothing: 25% is correct', why: 'The number is correct for that month, but the choice of window hides the bigger picture.' },
                { t: 'The percentage is wrong', why: r`From 80 to 100 really is $+25\%$. The trick is in choosing which period to show.` },
              ],
              explain: r`Picking start and end dates to support a conclusion is called **cherry-picking**. Over two years, the shares lost a third of their value. Always ask: why this time range, and what happens if I zoom out?`,
            },
            {
              type: 'explain',
              title: 'Relative versus absolute',
              body: r`A headline says: "Eating a certain food **doubles** your risk of a rare disease!" That's a **relative** risk increase of 100%. But if the risk goes from 1 in 10,000 to 2 in 10,000, the **absolute** risk increase is just 1 in 10,000, or 0.01 percentage points.

Both numbers are true. The relative number sounds alarming; the absolute one tells you how much it matters for you.`,
            },
            {
              type: 'numeric',
              title: 'Absolute risk',
              prompt: r`A medicine cuts the risk of a side effect from 4% to 3%. The advert says it "reduces risk by 25%". What is the **absolute** reduction, in percentage points?`,
              unit: 'points',
              answer: 1,
              wrong: [{ v: 25, why: 'That’s the relative reduction (1 out of 4). The absolute reduction is 4% − 3%.' }, { v: 75, why: 'The new risk is 75% of the old one. The absolute drop is 4 − 3.' }],
              explain: r`$4\% - 3\% = 1$ percentage point: out of 100 people taking it, about one fewer would get the side effect. "25% lower" is also true ($1/4$), but it sounds far more impressive. Good reporting gives both.`,
            },
            {
              type: 'numeric',
              title: 'Number needed to treat',
              prompt: r`A drug lowers the risk of a heart attack from 2% to 1.5% over five years. How many people need to take it for five years to prevent one heart attack?`,
              unit: 'people',
              answer: 200,
              wrong: [{ v: 25, why: 'That uses the relative reduction (25%). Use the absolute difference: 0.5 percentage points.' }, { v: 50, why: '0.5% is 1 in 200, not 1 in 50.' }],
              explain: r`The absolute reduction is $0.5\% = \frac{1}{200}$, so about **200** people must take it to prevent one heart attack. This "number needed to treat" makes the benefit concrete, and lets it be weighed against costs and side effects.`,
            },
            {
              type: 'interactive',
              title: 'Doubling a small risk',
              body: r`A treatment **doubles** the risk of a side effect. Choose the baseline risk so that the doubling adds exactly **1 percentage point** of absolute risk.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 140,
                params: { b: { min: 0.1, max: 10, step: 0.1, value: 5, label: 'baseline risk', color: 'blue', format: (v) => `${v.toFixed(1)}%` } },
                extra: ({ plot, p, s }) => [s('rect', { x: plot.X(0.5), y: plot.Y(1.7), width: plot.X(p.b * 0.45) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), rx: 3, class: 'fl-blue' }), s('rect', { x: plot.X(0.5), y: plot.Y(0.9), width: plot.X(p.b * 0.9) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), rx: 3, class: 'fl-coral' }), s('text', { x: plot.X(0.4), y: plot.Y(1.45) + 4, 'text-anchor': 'end', class: 'tick', text: 'before' }), s('text', { x: plot.X(0.4), y: plot.Y(0.65) + 4, 'text-anchor': 'end', class: 'tick', text: 'after' })],
                readout: (p) => `${p.b.toFixed(1)}% → ${(2 * p.b).toFixed(1)}%: relative increase **100%**, absolute increase **${p.b.toFixed(1)} percentage points**`,
                goal: (p) => Math.abs(p.b - 1) < 1e-9,
                hint: 'Doubling adds the baseline itself.',
                solution: { b: 1 },
              },
              explain: r`From 1% to 2%: the relative risk doubles (100% increase) for every baseline, but the **absolute** change equals the baseline. "Doubles your risk" means one extra case per 100 people here, but only one per 10,000 if the baseline is 0.01%.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Doubling a tiny risk',
              prompt: r`A headline reports that a medicine "doubles the risk" of a side effect, from 1 in 10,000 to 2 in 10,000. What is the increase in **absolute** risk, as a percentage?`,
              unit: '%',
              answer: 0.01,
              tol: 0.001,
              wrong: [{ v: 100, why: r`That’s the relative increase. The absolute increase is 1 in 10,000.` }],
              explain: r`From 0.01% to 0.02%: an absolute increase of **0.01 percentage points**, or one extra case per 10,000 people. "Doubles" is true, but without the baseline it sounds far scarier.`,
            },
          ],
          recap: [
            'Cherry-picked time windows can tell any story.',
            'Relative risk (“doubles”) can sound dramatic when absolute risk is tiny.',
            'Ask for absolute numbers and the full time range.',
          ],
        },
      ],
    },
    {
      title: 'Data in Context',
      summary: 'Trends, rates and good chart choices.',
      lessons: [
        {
          id: 'scatter',
          title: 'Scatter Plots & Trend Lines',
          summary: 'Fitting a line to data',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Two variables at once',
              body: r`A **scatter plot** puts one variable across and another up, one dot per case: hours studied and exam score, height and weight, temperature and ice-cream sales. Clouds of dots that slope upward suggest a **positive correlation**; downward, a negative one.

A **trend line** summarises the cloud. The usual choice, the **least-squares** line, makes the total of the squared vertical gaps (residuals) as small as possible.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fit the line',
              prompt: r`Eight students' study hours and exam scores are plotted. Adjust the slope and intercept to make the total squared error as small as you can (below 9).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9, ymin: 40, ymax: 90, grid: 1, gridY: 10, height: 300, padL: 48, axes: { xlabel: 'hours studied', ylabel: 'score', yAt: 40 },
                params: {
                  m: { min: 2, max: 6, step: 0.25, value: 5, label: 'slope', color: 'violet', format: (v) => `${v.toFixed(2)} points per hour` },
                  b: { min: 40, max: 56, step: 0.25, value: 42, label: 'intercept', color: 'teal', format: (v) => v.toFixed(2) },
                },
                curves: [{ f: (x, p) => p.m * x + p.b, color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => SX.flatMap((x, i) => [
                  s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(SY[i]), y2: plot.Y(p.m * x + p.b), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }),
                  s('circle', { cx: plot.X(x), cy: plot.Y(SY[i]), r: 6, class: 'fl-coral' }),
                ]),
                readout: (p) => r`$y = ${p.m.toFixed(2)}x + ${p.b.toFixed(2)}$, $\;$ total squared error $= ${sse(p.m, p.b).toFixed(2)}$`,
                goal: (p) => sse(p.m, p.b) < 9,
                hint: 'Get the slope right first (how much does the score rise per hour?), then slide the line up or down.',
                solution: { m: 3.75, b: 48.25 },
              },
              explain: r`The best line is about $y = 3.75x + 48.25$: roughly 3.75 extra points per hour of study. The dashed gaps are the **residuals**. Squaring them punishes big misses and gives a unique best line; Legendre and Gauss developed this method around 1805–1809.`,
            },
            {
              type: 'numeric',
              title: 'Make a prediction',
              prompt: r`Using the trend line $y = 3.75x + 48.25$, what score would you predict for a student who studies 6 hours? (1 decimal place.)`,
              answer: 70.75,
              tol: 0.06,
              wrong: [{ v: 71, why: 'That’s the actual score of the student who studied 6 hours. The line gives a prediction.' }],
              explain: r`$3.75 \times 6 + 48.25 = 70.75$, close to the real student's 71. Predictions inside the range of the data (**interpolation**) are fairly safe.`,
            },
            {
              type: 'mcq',
              title: 'Extrapolation',
              prompt: r`Can the same line predict the score for a student who studies 20 hours?`,
              choices: [
                { t: 'Not reliably: it predicts 123 out of 100, because the pattern can’t continue forever', ok: true },
                { t: 'Yes: the line works for any number of hours', why: r`$3.75 \times 20 + 48.25 = 123.25$, more than the maximum possible score.` },
              ],
              explain: r`**Extrapolating** far beyond the data assumes the trend continues unchanged, which often fails: scores cap at 100, and exhaustion sets in. Mark Twain mocked extrapolation by "predicting" from the river's shortening that the Mississippi would one day be a mile and three-quarters long.`,
            },
            {
              type: 'numeric',
              title: 'A perfect line',
              prompt: r`Every point of a scatter plot lies exactly on the line $y = -3x + 2$. What is the correlation coefficient $r$?`,
              answer: -1,
              explain: r`All points on a straight line with negative slope: $r = -1$. The correlation measures how close to a line the points are, not how steep the line is; $y = -0.01x$ would also give $r = -1$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'One outlier',
              prompt: r`One more student studied 8 hours but scored 20 (they were ill). What happens to the least-squares line?`,
              choices: [
                { t: 'It tilts noticeably towards the outlier, because squaring makes one big miss very costly', ok: true },
                { t: 'Nothing: one point out of nine barely matters', why: r`Its residual would be about 60 points; squared, that's 3600, far more than all the others combined. The line moves to reduce it.` },
              ],
              explain: r`Least squares is sensitive to **outliers**: one wild point can drag the line. Always plot your data and ask whether an unusual point belongs, before trusting the fit.`,
            },
          ],
          recap: [
            'Scatter plots show relationships between two variables.',
            'The least-squares line minimises the total squared residuals.',
            'Interpolation is fairly safe; extrapolation and outliers can mislead.',
          ],
        },
        {
          id: 'rates',
          title: 'Totals vs Rates',
          summary: 'Per person, per year, per mile',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Big places have big numbers',
              body: r`A map shading countries by total number of road deaths mostly shows where lots of people live. To compare fairly, divide by the size of the group: deaths **per 100,000 people**, crimes per 1000 residents, accidents per million miles driven.

Totals answer "how much?"; rates answer "how likely?".`,
            },
            {
              type: 'numeric',
              title: 'Which is safer?',
              prompt: r`Town A had 50 burglaries among 10,000 homes; city B had 400 among 160,000 homes. What is city B's rate, in burglaries per 1000 homes? (1 decimal place.)`,
              unit: 'per 1000',
              answer: 2.5,
              tol: 0.01,
              wrong: [{ v: 400, why: 'That’s the total. Divide by 160 (thousands of homes).' }, { v: 5, why: 'That’s town A’s rate. B’s is 400 ÷ 160.' }],
              explain: r`B: $\frac{400}{160} = 2.5$ per 1000 homes. A: $\frac{50}{10} = 5$ per 1000. Despite eight times as many burglaries, the city is **half** as risky per home.`,
            },
            {
              type: 'mcq',
              title: 'The safest age to drive?',
              prompt: r`Drivers over 80 cause fewer crashes in total than drivers aged 30–50. Does that mean they're safer?`,
              choices: [
                { t: 'Not necessarily: there are far fewer of them and they drive far fewer miles', ok: true },
                { t: 'Yes: fewer crashes means safer', why: 'Totals ignore exposure. Per mile driven, the youngest and oldest drivers have the highest crash rates.' },
              ],
              explain: r`The right denominator is **exposure**: crashes per million miles driven. On that measure, both the youngest and the oldest drivers are riskier than the middle-aged. Choosing the denominator is part of asking the right question.`,
            },
            {
              type: 'mcq',
              title: 'Cumulative charts',
              prompt: r`A cumulative chart of total vaccinations always goes up. Can it show that vaccinations are slowing down?`,
              choices: [
                { t: 'Yes: the curve gets flatter, though it never falls', ok: true },
                { t: 'No: it keeps rising, so things are getting better', why: 'A running total rises even when new additions shrink. Look at its slope.' },
              ],
              explain: r`A cumulative total can only rise, which makes it reassuring-looking. The **daily** numbers (its slope) reveal slowdowns. When reading a chart, check whether it shows totals so far or amounts per day.`,
            },
            {
              type: 'interactive',
              title: 'Equal rates',
              body: r`Town A has 50 road accidents a year and 100,000 people. Town B has 20 accidents. How many people must live in B for the two towns to have the **same accident rate**?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 160,
                params: { pop: { min: 10000, max: 100000, step: 1000, value: 80000, label: 'population of B', color: 'coral', format: (v) => v.toLocaleString('en-US') } },
                extra: ({ plot, p, s }) => { const ra = 50, rb = (20 / p.pop) * 1e5; return [[ra, 1.4, 'fl-blue', 'A'], [rb, 0.5, 'fl-coral', 'B']].flatMap(([v, y, cls, l]) => [s('rect', { x: plot.X(0.8), y: plot.Y(y + 0.3), width: plot.X(v / 20) - plot.X(0), height: plot.Y(0) - plot.Y(0.6), rx: 3, class: cls }), s('text', { x: plot.X(0.6), y: plot.Y(y) + 5, 'text-anchor': 'end', class: 'lbl', text: l })]); },
                readout: (p) => `per 100,000 people: A **50**, B **${((20 / p.pop) * 1e5).toFixed(1)}**`,
                goal: (p) => p.pop === 40000,
                hint: 'A has 50 accidents per 100,000 people. What population gives B the same?',
                solution: { pop: 40000 },
              },
              explain: r`With 40,000 people, B has $\frac{20}{40{,}000} = 50$ per 100,000, exactly like A, even though A has 2.5 times as many accidents. Comparing totals mostly measures size; comparing **rates** measures risk.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Per capita',
              prompt: r`Country X has 1.4 billion people and emits 11 billion tonnes of CO₂ a year; country Y has 330 million people and emits 5 billion tonnes. How many tonnes per person does Y emit? (1 decimal place.)`,
              unit: 't',
              answer: 5 / 0.33,
              tol: 0.1,
              wrong: [{ v: 11 / 1.4, tol: 0.1, why: 'That’s country X. Y emits 5 billion ÷ 0.33 billion.' }],
              explain: r`Y: $\frac{5}{0.33} \approx 15.2$ tonnes per person, nearly twice X's $\frac{11}{1.4} \approx 7.9$. X emits more in total; Y emits more per person. Both facts are true; which matters depends on the question.`,
            },
          ],
          recap: [
            'Totals scale with population; rates allow fair comparison.',
            'Choose the denominator that matches the question (people, homes, miles driven).',
            'Cumulative charts always rise; check their slope for the real trend.',
          ],
        },
        {
          id: 'choosing',
          title: 'Choosing the Right Chart',
          summary: 'Match the chart to the question',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Different charts, different jobs',
              body: r`- **Bar chart:** compare amounts across categories.
- **Line chart:** show change over time.
- **Scatter plot:** show the relationship between two variables.
- **Histogram:** show how one variable is distributed.
- **Pie chart:** show parts of a whole, but only with a few, clearly different slices.

A good chart answers one question at a glance.`,
            },
            {
              type: 'mcq',
              title: 'Monthly rainfall',
              prompt: r`You want to show how a city's rainfall changed month by month over three years. Which chart is best?`,
              cols: 2,
              choices: [
                { t: 'Line chart', ok: true },
                { t: 'Pie chart', why: 'Pies show parts of a whole, not change over time, and 36 slices would be unreadable.' },
                { t: 'Scatter plot', why: 'Scatter plots relate two variables; here time is the natural horizontal axis of a line chart.' },
                { t: 'Histogram', why: 'A histogram shows a distribution, losing the order in time.' },
              ],
              explain: r`Time series belong on a **line chart**: the eye follows rises, falls and seasonal cycles naturally.`,
            },
            {
              type: 'mcq',
              title: 'Heights in a class',
              prompt: r`You measured the heights of 200 students and want to show how common each height range is. Which chart?`,
              cols: 2,
              choices: [
                { t: 'Histogram', ok: true },
                { t: 'Line chart', why: 'There’s no time order here; you want counts per height band.' },
                { t: 'Pie chart', why: 'A pie hides the natural order of the height bands.' },
                { t: 'Scatter plot', why: 'You have only one variable, height.' },
              ],
              explain: r`A **histogram** groups values into bins and shows how many fall in each, revealing the shape: here, probably a bell curve.`,
            },
            {
              type: 'mcq',
              title: 'Revision and results',
              prompt: r`For 50 students you know two numbers: hours spent revising and exam score. You want to see whether more revision tends to go with higher scores. Which chart?`,
              cols: 2,
              choices: [
                { t: 'Scatter plot', ok: true },
                { t: 'Bar chart', why: 'Bars compare amounts across categories. Here each student has two numbers, and you want to see how they relate.' },
                { t: 'Line chart', why: 'Joining the students with a line implies an order (like time) that doesn’t exist.' },
                { t: 'Pie chart', why: 'There’s no whole being split into parts.' },
              ],
              explain: r`A **scatter plot** puts one variable on each axis, with one dot per student. If the cloud of dots drifts upwards to the right, more revision goes with higher scores, and unusual students stand out as outliers. (A pattern shows correlation, not proof that one causes the other.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Pie or bar?',
              body: r`Five sellers have market shares of 22%, 20%, 19%, 20% and 19%. Switch between a pie chart and a bar chart. In which can you tell who’s ahead?`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 6.5, ymin: -1.2, ymax: 1.3, grid: false, axes: false, maxWidth: 520,
                params: { t: { min: 0, max: 1, step: 1, value: 0, label: 'chart', color: 'violet', format: (v) => (v ? 'bar chart' : 'pie chart') } },
                extra: ({ plot, p, s }) => { const v = [22, 20, 19, 20, 19], cls = ['fl-blue', 'fl-coral', 'fl-teal', 'fl-amber', 'fl-violet']; if (!p.t) { let a = Math.PI / 2; return v.map((x, i) => { const b = a - (2 * Math.PI * x) / 100, P = (t) => `${plot.X(Math.cos(t))} ${plot.Y(Math.sin(t))}`; const d = `M${plot.X(0)} ${plot.Y(0)}L${P(a)}A${plot.X(1) - plot.X(0)} ${plot.X(1) - plot.X(0)} 0 0 1 ${P(b)}Z`; a = b; return s('path', { d, class: cls[i], stroke: 'var(--card)', 'stroke-width': 2 }); }); } return v.map((x, i) => s('rect', { x: plot.X(-1 + i * 1.4), y: plot.Y(-1 + x / 12), width: plot.X(1) - plot.X(0), height: plot.Y(-1) - plot.Y(-1 + x / 12), class: cls[i] })); },
                readout: (p) => (p.t ? 'Bars share a baseline, so the 22% bar is clearly tallest.' : 'Can you tell which slice is biggest?'),
              },
              after: r`Our eyes compare lengths along a common baseline far better than angles or areas. In the pie, the slices look almost identical; in the bar chart, the leader is obvious. Pie charts are fine for "half versus a quarter", but bars win for close comparisons.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Too many slices',
              prompt: r`A pie chart shows market share for 12 phone brands, several with 3–5%. What's the better alternative?`,
              choices: [
                { t: 'A bar chart sorted from largest to smallest', ok: true },
                { t: 'A 3D pie chart', why: '3D makes the comparisons even harder.' },
                { t: 'A line chart', why: 'There’s no time axis to follow.' },
              ],
              explain: r`Our eyes judge **lengths** along a common baseline far better than angles or areas. A sorted bar chart makes a 4% vs 5% difference visible; a pie with 12 thin slices makes it guesswork.`,
            },
          ],
          recap: [
            'Bars compare categories; lines show change over time; scatters show relationships.',
            'Histograms show distributions; pies only suit a few parts of a whole.',
            'People compare lengths better than angles or areas.',
          ],
        },
      ],
    },
  ],
};
