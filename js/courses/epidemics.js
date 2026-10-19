import { fix } from '../lib/svg.js';

const r = String.raw;

// SIR model, integrated with small Euler steps; returns samples every day
const sirCache = new Map();
function sir(R0, days = 160, gamma = 0.1) {
  const key = `${R0}|${days}`;
  if (sirCache.has(key)) return sirCache.get(key);
  const beta = R0 * gamma, dt = 0.05;
  let S = 0.999, I = 0.001, Rr = 0;
  const out = [[S, I, Rr]];
  for (let d = 0; d < days; d++) {
    for (let k = 0; k < 1 / dt; k++) {
      const inf = beta * S * I * dt, rec = gamma * I * dt;
      S -= inf;
      I += inf - rec;
      Rr += rec;
    }
    out.push([S, I, Rr]);
  }
  sirCache.set(key, out);
  return out;
}
const pct = (v) => `${Math.round(v * 100)}%`;
const peakOf = (R0) => Math.max(...sir(R0, 1500).map((d) => d[1]));
// SIS model (no immunity): logistic solution, gamma = 0.1, 0.1% infected at the start
const sis = (R0, t) => {
  const Is = 1 - 1 / R0, r0 = 0.1 * (R0 - 1);
  return Is / (1 + (Is / 0.001 - 1) * Math.exp(-r0 * t));
};
// branching process: probability one case's chain of infection dies out (Poisson offspring)
const extinction = (R) => {
  if (R <= 1) return 1;
  let q = 0;
  for (let i = 0; i < 3000; i++) q = Math.exp(R * (q - 1));
  return q;
};

// five outbreaks, each starting from one case, with R = 1.5 (random number of new cases per case)
const BRANCH = (() => {
  const mul = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pois = (u) => { const L = Math.exp(-1.5); let k = 0, q = 1; do { k++; q *= u(); } while (q > L); return k - 1; };
  return [8, 2, 10, 4, 11].map((seed) => {
    const u = mul(seed * 977), gens = [[{ parent: -1 }]];
    for (let g = 0; g < 6; g++) {
      const next = [];
      gens[g].slice(0, 30).forEach((_, i) => { const n = pois(u); for (let k = 0; k < n; k++) next.push({ parent: i }); });
      if (!next.length) break;
      gens.push(next);
    }
    return gens;
  });
})();

export default {
  id: 'epidemics',
  subject: 'math',
  title: 'Modelling Epidemics',
  level: 'Intermediate',
  cover: 'epidemics',
  tagline: 'The R number, herd immunity, the SIR model, endemic infections and superspreading.',
  description: r`Mathematical models help public-health experts understand how infections spread and how to slow them. Learn what the reproduction number R means, why R = 1 is the tipping point, how herd immunity works, how the classic SIR model predicts the course of an outbreak, why some diseases become endemic, and why chance and superspreaders matter so much early on.`,
  prereq: 'Functions & Graphs',
  chapters: [
    {
      title: 'Spreading',
      summary: 'Growth and thresholds.',
      lessons: [
        {
          id: 'r-number',
          title: 'The Reproduction Number',
          summary: 'Generations of infection',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'R',
              body: r`The **basic reproduction number** $R_0$ is the average number of people one infected person passes an infection to, in a population where everyone is susceptible. If $R_0 = 3$, one case leads to 3, which lead to 9, then 27…

Each step is a **generation** of infection, so the number of new cases grows like a geometric sequence: $R_0^n$ after $n$ generations.`,
            },
            {
              type: 'numeric',
              title: 'Five generations',
              prompt: r`One person brings an infection with $R_0 = 3$ into a fully susceptible community. How many **new** cases are there in the 5th generation (with no interventions)?`,
              answer: 243,
              wrong: [{ v: 15, why: r`Each generation multiplies by 3: $3^5$, not $3 \times 5$.` }, { v: 81, why: r`That's the 4th generation, $3^4$.` }, { v: 364, why: 'That’s the total across all five generations (plus the first case). The question asks for the 5th generation alone.' }],
              explain: r`$3^5 = 243$. And the total so far is $1 + 3 + 9 + 27 + 81 + 243 = 364$. This is why early action matters so much: every generation of delay multiplies the problem.`,
            },
            {
              type: 'mcq',
              title: 'Comparing diseases',
              prompt: r`Measles has $R_0$ of about 12–18, and seasonal flu about 1.3. Starting from one case, roughly how many cases are there in the third generation for each?`,
              choices: [
                { t: 'Measles: thousands; flu: about 2', ok: true },
                { t: 'They’re similar, because both start from one case', why: r`Generations multiply: $15^3 = 3375$, while $1.3^3 \approx 2.2$.` },
                { t: 'Measles: about 45; flu: about 4', why: 'That’s adding R three times. Each generation multiplies.' },
              ],
              explain: r`With $R_0 = 15$, the third generation has $15^3 \approx 3{,}400$ cases. With $R_0 = 1.3$, it has $1.3^3 \approx 2.2$. Exponentials are extremely sensitive to the base, which is why highly contagious diseases need very high vaccination rates.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A thousand cases',
              prompt: r`Starting from one case, choose $R$ so that the 10th generation has about **1,000** new cases.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1500, grid: 1, gridY: 250, height: 260, padL: 52, axes: { xlabel: 'generation', ylabel: 'new cases' },
                params: { R: { min: 1, max: 2.5, step: 0.05, value: 1.5, label: '$R$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (n, p) => p.R ** n, color: 'coral', width: 3 }, { f: () => 1000, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: () => 10, y: (p) => Math.min(p.R ** 10, 1500), color: 'coral' }],
                readout: (p) => r`generation 10: $${p.R.toFixed(2)}^{10} \approx ${Math.round(p.R ** 10).toLocaleString('en-GB')}$ new cases`,
                goal: (p) => Math.abs(p.R ** 10 - 1000) < 60,
                hint: r`You need $R^{10} \approx 1000$, so $R = 1000^{1/10}$.`,
                solution: { R: 2 },
              },
              explain: r`$R = 2$: $2^{10} = 1024$. At $R = 1.5$ it's only 58 cases; at $R = 2.5$ it's nearly 10,000. Small changes in $R$ compound into enormous differences.`,
            },
            {
              type: 'numeric',
              title: 'From generations to days',
              prompt: r`If each generation of infection takes about 5 days and $R = 2$, how many times bigger is the daily number of new cases after 30 days?`,
              unit: '×',
              answer: 64,
              wrong: [{ v: 12, why: r`30 days is 6 generations, and each **doubles**: $2^6$.` }, { v: 32, why: 'That’s 5 generations. 30 ÷ 5 = 6.' }],
              explain: r`30 days = 6 generations, so $2^6 = 64$ times as many cases: a doubling every 5 days. The **doubling time** is often easier to measure than $R$ itself.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Is R fixed?',
              prompt: r`Is the reproduction number a fixed property of a virus?`,
              choices: [
                { t: 'No: it depends on how people mix, behave and are protected, as well as on the virus itself', ok: true },
                { t: 'Yes: it’s set by the virus’s biology', why: 'Biology matters, but so do contacts: the same virus spreads faster in crowded, poorly ventilated places.' },
                { t: 'Yes, but only for respiratory viruses', why: 'For every infection, R depends on contacts and behaviour.' },
              ],
              explain: r`$R$ is roughly (contacts per day) × (chance of transmission per contact) × (days infectious). Changing any factor, through ventilation, masks, fewer contacts or faster isolation, changes $R$. That's why estimates of $R_0$ vary between places and times.`,
            },
          ],
          recap: [
            r`$R_0$: the average number infected by one case in a fully susceptible population.`,
            r`New cases in generation $n$: $R_0^n$.`,
            'Small differences in R make enormous differences over generations.',
          ],
        },
        {
          id: 'threshold',
          title: 'Tipping Points',
          summary: 'R = 1 and herd immunity',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Above or below 1',
              body: r`If each case causes **more** than one new case ($R > 1$), cases grow. If **fewer** than one ($R < 1$), the outbreak shrinks and dies out. $R = 1$ is the tipping point.

As people become immune (by recovering or through vaccination), fewer contacts lead to infection. If a fraction $s$ of the population is still susceptible, the **effective** reproduction number is
$$R_{\text{eff}} = R_0 \times s$$`,
            },
            {
              type: 'numeric',
              title: 'Herd immunity',
              prompt: r`To push $R_{\text{eff}}$ below 1, the susceptible fraction must fall below $1/R_0$. For a disease with $R_0 = 4$, what percentage of people must be immune?`,
              unit: '%',
              answer: 75,
              wrong: [{ v: 25, why: r`That's the maximum susceptible fraction, $1/R_0$. The immune fraction is $1 - 1/R_0$.` }, { v: 100, why: 'Not everyone needs to be immune: just enough to bring R below 1.' }],
              explain: r`Immune fraction $= 1 - \dfrac{1}{R_0} = 1 - \dfrac14 = 75\%$. Then each case infects on average fewer than one other, and outbreaks fizzle out. This protects people who can't be vaccinated too: **herd immunity**.`,
            },
            {
              type: 'mcq',
              title: 'Measles',
              prompt: r`Using $1 - 1/R_0$ with $R_0 \approx 15$, roughly what vaccination coverage is needed to prevent measles outbreaks?`,
              cols: 2,
              choices: [
                { t: 'About 93% or more', ok: true },
                { t: 'About 50%', why: r`With $R_0 = 15$: $1 - \frac{1}{15} \approx 0.93$.` },
                { t: 'About 15%', why: r`$1/R_0$ is the fraction allowed to remain susceptible. You need $1 - 1/R_0$ immune.` },
                { t: '100%', why: 'Close to it, but the threshold is just below 100%.' },
              ],
              explain: r`$1 - \tfrac{1}{15} \approx 93\%$, which is why public-health agencies aim for about 95% measles vaccination coverage. When coverage drops below that in a community, outbreaks can return.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Imperfect vaccines',
              prompt: r`A disease has $R_0 = 4$ and a vaccine that protects 90% of those who get it. Find the **smallest** vaccination coverage that brings $R_{\text{eff}}$ below 1.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 4.2, grid: 0.1, gridY: 0.5, height: 260, axes: { xlabel: 'fraction vaccinated', ylabel: 'effective R', xfmt: (v) => `${Math.round(v * 100)}%` },
                params: { c: { min: 0, max: 1, step: 0.01, value: 0.5, slider: false } },
                curves: [{ f: (c) => 4 * (1 - 0.9 * c), color: 'coral', width: 3 }, { f: () => 1, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.c, y: (p) => 4 * (1 - 0.9 * p.c), drag: { x: 'c' }, color: 'teal' }],
                readout: (p) => r`coverage $${Math.round(p.c * 100)}\%$: immune $${(90 * p.c).toFixed(1)}\%$, $\;R_{\text{eff}} = 4 \times ${(1 - 0.9 * p.c).toFixed(3)} = ${(4 * (1 - 0.9 * p.c)).toFixed(2)}$`,
                goal: (p) => 4 * (1 - 0.9 * p.c) < 1 && 4 * (1 - 0.9 * (p.c - 0.01)) >= 1,
                hint: r`You need $0.9c \ge 0.75$.`,
                solution: { c: 0.84 },
              },
              explain: r`$c \ge \frac{1 - 1/R_0}{\text{efficacy}} = \frac{0.75}{0.9} \approx 83.3\%$, so 84% coverage. A less effective vaccine needs higher coverage to reach the same threshold.`,
            },
            {
              type: 'mcq',
              title: 'Protecting the vulnerable',
              prompt: r`Some people can’t be vaccinated (newborns, people with weakened immune systems). How does vaccinating others protect them?`,
              choices: [
                { t: r`Above the herd-immunity threshold, outbreaks die out before they can reach most unvaccinated people`, ok: true },
                { t: r`Vaccinated people pass on antibodies`, why: r`Antibodies aren’t transmitted; the protection comes from blocking chains of infection.` },
                { t: r`It doesn’t: only personal vaccination helps`, why: r`Herd immunity protects people who couldn’t be vaccinated, by starving the virus of hosts.` },
              ],
              explain: r`When each case infects fewer than one other on average, any spark fizzles out. The unvaccinated are protected not by immunity of their own, but because the disease can’t find a path to them.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Not enough',
              prompt: r`With $R_0 = 4$ and a vaccine that's only 70% effective at stopping transmission, can vaccination alone reach herd immunity?`,
              choices: [
                { t: r`No: it would need $\frac{0.75}{0.7} \approx 107\%$ coverage, which is impossible`, ok: true },
                { t: 'Yes, with 75% coverage', why: 'Only 70% of those vaccinated are protected, so 75% coverage makes just 52.5% immune.' },
                { t: 'Yes, with 100% coverage', why: 'Even vaccinating everyone makes only 70% immune, short of the 75% needed.' },
              ],
              explain: r`Even 100% coverage leaves $R_{\text{eff}} = 4 \times 0.3 = 1.2 > 1$. Vaccination would still slow spread and protect individuals, but other measures would be needed to push $R$ below 1.`,
            },
          ],
          recap: [
            r`$R > 1$: growth. $R < 1$: decline.`,
            r`$R_{\text{eff}} = R_0 \times (\text{susceptible fraction})$.`,
            r`Herd immunity threshold: $1 - 1/R_0$.`,
          ],
        },
      ],
    },
    {
      title: 'The SIR Model',
      summary: 'A whole outbreak in three equations.',
      lessons: [
        {
          id: 'sir',
          title: 'The SIR Model',
          summary: 'Susceptible, infected, recovered',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Three groups',
              body: r`In 1927, William Kermack and Anderson McKendrick split a population into three groups: **S**usceptible, **I**nfected and **R**ecovered (immune). People move from S to I when infected, and from I to R when they recover:
$$\frac{dS}{dt} = -\beta S I, \qquad \frac{dI}{dt} = \beta S I - \gamma I, \qquad \frac{dR}{dt} = \gamma I$$
$\beta$ measures how easily the infection spreads, and $\gamma$ is the recovery rate. Their ratio is $R_0 = \beta/\gamma$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An outbreak unfolds',
              body: r`Here's the SIR model for a population where 0.1% start out infected. Change $R_0$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 160, ymin: 0, ymax: 1, grid: 20, gridY: 0.25, height: 320, axes: { xlabel: 'days', ylabel: 'fraction of population' },
                params: { R0: { min: 1.1, max: 5, step: 0.1, value: 2.5, label: '$R_0$', color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [
                  { f: (t, p) => sir(p.R0)[Math.round(t)]?.[0] ?? NaN, color: 'blue' },
                  { f: (t, p) => sir(p.R0)[Math.round(t)]?.[1] ?? NaN, color: 'coral', width: 4 },
                  { f: (t, p) => sir(p.R0)[Math.round(t)]?.[2] ?? NaN, color: 'teal' },
                ],
                readout: (p) => {
                  const data = sir(p.R0, 1500);
                  const peak = Math.max(...data.map((d) => d[1]));
                  const final = data[data.length - 1][2];
                  return r`$\blue{S}$, $\coral{I}$, $\teal{R}$ $\;\cdot\;$ peak infected: **${pct(peak)}** $\;\cdot\;$ eventually infected: **${pct(final)}**`;
                },
              },
              after: r`The infected curve rises, peaks and falls. The epidemic turns around when the susceptible fraction drops to $1/R_0$, exactly where $R_{\text{eff}} = 1$. Notice too that it **overshoots**: by the end, more people have been infected than the herd immunity threshold alone would require, and some people never catch it at all.`,
            },
            {
              type: 'mcq',
              title: 'When does it peak?',
              prompt: r`With $R_0 = 2.5$, at what susceptible fraction does the number of infected people peak?`,
              cols: 2,
              choices: [
                { t: '40%', ok: true },
                { t: '50%', why: r`The peak is where $R_{\text{eff}} = R_0 \times S = 1$, so $S = 1/2.5$.` },
                { t: '60%', why: r`That's $1 - 1/R_0$, the immune fraction at the peak (ignoring those still infected). The susceptible fraction is $1/R_0$.` },
                { t: '0%', why: 'The outbreak turns around long before everyone has been infected.' },
              ],
              explain: r`$\dfrac{dI}{dt} = I(\beta S - \gamma)$ is zero when $S = \gamma/\beta = 1/R_0 = 0.4$. Before that, each case causes more than one new case; after it, fewer.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Keep the peak down',
              prompt: r`Hospitals can cope if no more than 10% of people are infected at once. Find the $R_0$ at which the SIR peak is exactly about 10%.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: 0, ymax: 0.4, grid: 50, gridY: 0.1, height: 280, axes: { xlabel: 'days', ylabel: 'fraction infected', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { R0: { min: 1.2, max: 3, step: 0.1, value: 2.5, label: '$R_0$', color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [{ f: (t, p) => sir(p.R0, 300)[Math.round(t)]?.[1] ?? NaN, color: 'coral', width: 3 }, { f: () => 0.1, color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`peak infected: $${(100 * peakOf(p.R0)).toFixed(1)}\%$`,
                goal: (p) => Math.abs(peakOf(p.R0) - 0.1) < 0.005,
                hint: 'Lower R₀ gives a lower, later peak.',
                solution: { R0: 1.7 },
              },
              explain: r`$R_0 \approx 1.7$. There's a neat formula for the peak (starting from almost everyone susceptible): $I_{\max} = 1 - \frac{1}{R_0} - \frac{\ln R_0}{R_0}$. At $R_0 = 1.7$ that's about 10%; at $R_0 = 3$ it's 30%.`,
            },
            {
              type: 'numeric',
              title: 'How high the peak',
              prompt: r`Use the peak formula $I_{\max} = 1 - \frac{1}{R_0} - \frac{\ln R_0}{R_0}$. For $R_0 = 2.5$, what percentage of the population is infected at the same time at the peak? (Nearest whole percent.)`,
              unit: '%',
              answer: 100 * (1 - 1 / 2.5 - Math.log(2.5) / 2.5),
              tol: 0.6,
              wrong: [{ v: 40, why: r`40% is the **susceptible** fraction at the peak, $\frac{1}{R_0}$. Now subtract the $\frac{\ln R_0}{R_0}$ term too.` }, { v: 60, why: r`You still need to subtract $\frac{\ln 2.5}{2.5} \approx 0.37$.` }],
              explain: r`$1 - 0.4 - \frac{\ln 2.5}{2.5} = 0.6 - \frac{0.916}{2.5} \approx 0.6 - 0.367 = 0.233$: about **23%** of everyone infected at once. With no intervention, health services would face almost a quarter of the population ill at the same time, which is why "flattening the curve" matters.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The final size',
              prompt: r`The fraction $z$ eventually infected satisfies $z = 1 - e^{-R_0 z}$. For $R_0 = 2$, what percentage is eventually infected? (Try $z = 0.8$ and adjust; nearest whole percent.)`,
              unit: '%',
              answer: 80,
              tol: 0.6,
              wrong: [{ v: 50, why: r`That's the herd immunity threshold, $1 - 1/R_0$. The epidemic overshoots it.` }],
              explain: r`$1 - e^{-1.6} \approx 0.798$, so $z \approx 80\%$, well past the 50% herd immunity threshold. The overshoot happens because the epidemic is still large when it reaches the threshold, and those infected go on infecting others as it declines.`,
            },
          ],
          recap: [
            r`SIR: $S \to I \to R$, with $R_0 = \beta/\gamma$.`,
            r`Infections peak when $S = 1/R_0$.`,
            'Outbreaks overshoot the herd immunity threshold.',
          ],
        },
        {
          id: 'flatten',
          title: 'Flattening the Curve',
          summary: 'What interventions do',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'Lowering R',
              prompt: r`Measures like ventilation, hand-washing or reducing contacts lower the effective $\beta$. In the SIR model, what happens to the outbreak?`,
              choices: [
                { t: 'The peak is lower and later, and fewer people are infected in total', ok: true },
                { t: 'The same number of people are infected, just more slowly', why: 'Try lowering R₀ in the model: the total eventually infected also falls.' },
                { t: 'Nothing changes', why: 'Lower transmission changes everything in the model.' },
              ],
              explain: r`A lower $R$ gives a lower, later peak ("flattening the curve"), which keeps hospitals from being overwhelmed, and it also reduces the **total** number infected because the overshoot is smaller. If $R$ can be pushed below 1, the outbreak shrinks.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Under the line',
              prompt: r`An infection has $R_0 = 3$. Measures that cut transmission by a fraction $x$ make $R = 3(1 - x)$. Find the **smallest** reduction (in steps of 5%) that keeps the peak at or below 10%.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: 0, ymax: 0.35, grid: 50, gridY: 0.05, height: 280, axes: { xlabel: 'days', ylabel: 'fraction infected', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { x: { min: 0, max: 0.6, step: 0.05, value: 0, label: 'transmission cut', color: 'teal', format: (v) => `${Math.round(v * 100)}%` } },
                curves: [
                  { f: (t) => sir(3, 300)[Math.round(t)]?.[1] ?? NaN, color: 'muted', dash: true, width: 2 },
                  { f: (t, p) => sir(+(3 * (1 - p.x)).toFixed(2), 300)[Math.round(t)]?.[1] ?? NaN, color: 'teal', width: 3.5 },
                  { f: () => 0.1, color: 'coral', dash: true, width: 1.5 },
                ],
                readout: (p) => {
                  const R = +(3 * (1 - p.x)).toFixed(2);
                  return r`$R = ${fix(R, 2)}$: peak $${(100 * peakOf(R)).toFixed(1)}\%$, eventually infected $${(100 * sir(R, 1500)[1500][2]).toFixed(0)}\%$`;
                },
                goal: (p) => peakOf(+(3 * (1 - p.x)).toFixed(2)) <= 0.1 && peakOf(+(3 * (1 - (p.x - 0.05))).toFixed(2)) > 0.1,
                hint: 'You need R at or below about 1.7.',
                solution: { x: 0.45 },
              },
              explain: r`A 45% cut gives $R = 1.65$ and a peak of about 9%. The curve is flatter **and** later, buying time for treatments and vaccines, and the total infected falls from 94% to about 67%.`,
            },
            {
              type: 'numeric',
              title: 'Hospital beds',
              prompt: r`In a city of 1,000,000 people, the peak has 9% infected at once. If 3% of infected people need a hospital bed, how many beds are needed at the peak?`,
              unit: 'beds',
              answer: 2700,
              wrong: [{ v: 30000, why: 'That’s 3% of the whole city. Only the 90,000 currently infected matter.' }, { v: 90000, why: 'That’s the number infected. Only 3% of them need a bed.' }],
              explain: r`$1{,}000{,}000 \times 0.09 \times 0.03 = 2{,}700$ beds. Without intervention ($R = 3$) the peak is about 30% infected at once, needing about 9,000 beds: far more than most cities have. That's what "flattening the curve" protects against.`,
            },
            {
              type: 'mcq',
              title: 'Buying time',
              prompt: r`Even if an intervention only delayed the peak without reducing the total number infected, why could it still save lives?`,
              choices: [
                { t: 'Hospitals wouldn’t be overwhelmed, and treatments or vaccines might arrive before many people are infected', ok: true },
                { t: 'It couldn’t: only the total number of infections matters', why: 'The timing matters too: overwhelmed hospitals can’t treat everyone, and delays give time for vaccines.' },
                { t: 'Delayed infections are always milder', why: 'The disease itself doesn’t change. What changes is the care available and the chance of vaccination first.' },
              ],
              explain: r`A spread-out epidemic lets every patient get care, and every week of delay is another week for vaccine development and production. During COVID-19, vaccines arrived about a year after the outbreak began.`,
            },
            {
              type: 'numeric',
              title: 'The slow way down',
              prompt: r`An outbreak has reached 6,400 cases a day. Measures cut $R$ from 2 to 0.8, with 5 days between generations. About how many cases a day will there be 30 days later? (Nearest whole number.)`,
              answer: 6400 * 0.8 ** 6,
              tol: 1,
              wrong: [{ v: 100, why: r`That would need $R = 0.5$. With $R = 0.8$, each of the 6 generations is only 20% smaller: $6400 \times 0.8^6$.` }],
              explain: r`30 days is 6 generations: $6400 \times 0.8^6 \approx 6400 \times 0.26 \approx 1{,}678$ cases a day. At $R = 2$ cases grow 64-fold in a month, but at $R = 0.8$ they fall only about fourfold: epidemics climb fast and come down slowly, which is why acting early matters so much.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Limits of the model',
              prompt: r`Which is a real limitation of the basic SIR model?`,
              choices: [
                { t: 'It assumes everyone mixes equally with everyone else', ok: true },
                { t: 'It can’t produce a peak', why: 'It does produce a peak: that’s one of its key predictions.' },
                { t: 'It only works for diseases spread by insects', why: 'SIR is a general model, often used for person-to-person infections.' },
              ],
              explain: r`Real populations have households, schools, age groups and travel networks. Immunity can also fade, and people change their behaviour. Researchers extend SIR with more groups (for example SEIR adds an "exposed" stage) and with contact networks. As the statistician George Box put it, all models are wrong, but some are useful.`,
            },
          ],
          recap: [
            'Lowering transmission flattens and delays the peak, and reduces total infections.',
            'Basic SIR assumes uniform mixing and lasting immunity.',
            'More detailed models add structure, but the core ideas remain.',
          ],
        },
      ],
    },
    {
      title: 'Beyond SIR',
      summary: 'Endemic diseases and the role of chance.',
      lessons: [
        {
          id: 'endemic',
          title: 'Endemic Diseases',
          summary: 'When immunity doesn’t last',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'The SIS model',
              body: r`Some infections, like the common cold or many bacterial infections, give little lasting immunity: people recover and become susceptible again. The **SIS** model drops the R group:
$$\frac{dI}{dt} = \beta S I - \gamma I, \qquad S = 1 - I$$
Instead of burning out, the infection can settle at a steady level: it becomes **endemic**.`,
            },
            {
              type: 'numeric',
              title: 'The steady state',
              prompt: r`At a steady state, $\frac{dI}{dt} = 0$ with $I > 0$, so $\beta S = \gamma$, which means $S = \frac{1}{R_0}$. If $R_0 = 2$, what fraction of people are infected at any one time? (As a decimal.)`,
              answer: 0.5,
              wrong: [{ v: 2, why: 'A fraction must be between 0 and 1. I = 1 − S = 1 − 1/R₀.' }],
              explain: r`$I^* = 1 - \frac{1}{R_0} = 0.5$: half the population infected at any moment. It's the same number as the herd immunity threshold, now as a permanent burden.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the endemic level',
              prompt: r`Choose $R_0$ so that the infection settles with **25%** of people infected at any one time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 400, ymin: 0, ymax: 0.6, grid: 50, gridY: 0.1, height: 270, axes: { xlabel: 'days', ylabel: 'fraction infected', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { R0: { min: 1.05, max: 2.5, step: 0.01, value: 2, label: '$R_0$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (t, p) => sis(p.R0, t), color: 'coral', width: 3 }, { f: () => 0.25, color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`endemic level $1 - \frac{1}{${p.R0.toFixed(2)}} = ${(100 * (1 - 1 / p.R0)).toFixed(1)}\%$`,
                goal: (p) => Math.abs(1 - 1 / p.R0 - 0.25) < 0.005,
                hint: r`Solve $1 - \frac{1}{R_0} = 0.25$.`,
                solution: { R0: 1.33 },
              },
              explain: r`$R_0 = \frac43 \approx 1.33$. Notice that the curve is an S-shaped **logistic** curve: early on it grows exponentially, then levels off as susceptible people become scarce.`,
            },
            {
              type: 'mcq',
              title: 'Why some diseases never leave',
              prompt: r`Which feature lets an infection persist indefinitely in a population, rather than burning out after one big wave?`,
              choices: [
                { t: 'A steady supply of new susceptible people: through waning immunity, births, or a lack of immunity', ok: true },
                { t: 'A very high R₀', why: 'A high R₀ alone tends to cause one huge wave that runs out of susceptible people.' },
                { t: 'A long incubation period', why: 'Incubation affects timing, not whether susceptibles get replenished.' },
              ],
              explain: r`In SIR without births, an epidemic always burns out. Measles was endemic before vaccines only because each year's births supplied new susceptible children; in small isolated islands, it would vanish between introductions. Cities need roughly 250,000–500,000 people to sustain measles.`,
            },
            {
              type: 'numeric',
              title: 'How long are you ill?',
              prompt: r`In the SIS model, people recover at rate $\gamma$ per day, so an infection lasts $\frac1\gamma$ days on average. If $\gamma = 0.2$ per day, how many days is that?`,
              unit: 'days',
              answer: 5,
              explain: r`$\frac{1}{0.2} = 5$ days. With transmission rate $\beta$, $R_0 = \frac{\beta}{\gamma}$: a longer infection gives each case more time to spread it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Halving the burden',
              prompt: r`An endemic infection has $R_0 = 2$ (50% infected). If better hygiene cuts transmission by 20%, making $R_0 = 1.6$, what will the new endemic level be? (Nearest whole percent.)`,
              unit: '%',
              answer: Math.round(100 * (1 - 1 / 1.6)),
              tol: 0.6,
              wrong: [{ v: 40, why: r`It isn't simply 20% lower. Use $1 - \frac{1}{1.6}$.` }],
              explain: r`$1 - \frac{1}{1.6} = 0.375$, about 38%. Cutting transmission by 20% removes a quarter of the infections. Pushing $R_0$ below 1 would eliminate it entirely.`,
            },
          ],
          recap: [
            'Without lasting immunity (SIS), infections can become endemic.',
            r`Endemic level $I^* = 1 - 1/R_0$.`,
            'Diseases persist when new susceptible people keep arriving.',
          ],
        },
        {
          id: 'chance',
          title: 'Chance & Superspreading',
          summary: 'Why most sparks fizzle',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'A branching process',
              body: r`Early in an outbreak, numbers are tiny, and **chance** dominates. One infected person might, by luck, infect nobody, even if $R = 2$ on average. If that happens, the chain stops.

Treating each case as independently infecting a random number of others (with average $R$) is called a **branching process**. The probability $q$ that a chain eventually dies out satisfies an equation; for typical random spreading it's
$$q = e^{R(q - 1)}$$`,
            },
            { /*anim:epidemics*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Five sparks',
              body: r`Five people each bring the same infection into five separate towns. Every case infects a random number of others, **1.5 on average**. Watch the chains of infection grow, generation by generation.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5, ymin: -6.6, ymax: 0.5, grid: false, axes: false, height: 340,
                animate: { param: 't', speed: 1.1, max: 8.5, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const G = Math.min(6, Math.floor(p.t)), els = [];
                  BRANCH.forEach((gens, c) => {
                    const xs = gens.map((row) => { const m = Math.min(row.length, 30); return row.slice(0, 30).map((_, i) => c + 0.5 + (m > 1 ? (i / (m - 1) - 0.5) * 0.86 : 0)); });
                    for (let g = 1; g <= Math.min(G, gens.length - 1); g++) gens[g].slice(0, 30).forEach((nd, i) => {
                      els.push(s('line', { x1: plot.X(xs[g - 1][nd.parent]), y1: plot.Y(-(g - 1)), x2: plot.X(xs[g][i]), y2: plot.Y(-g), stroke: 'var(--coral)', 'stroke-width': 1.2, opacity: 0.6 }));
                    });
                    for (let g = 0; g <= Math.min(G, gens.length - 1); g++) xs[g].forEach((x) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(-g), r: 4, class: 'fl-coral' })));
                    if (gens.length - 1 < G) els.push(s('text', { x: plot.X(c + 0.5), y: plot.Y(-gens.length) + 4, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--teal)', text: 'died out' }));
                  });
                  return els;
                },
                readout: (p) => { const G = Math.min(6, Math.floor(p.t)), dead = BRANCH.filter((g) => g.length - 1 < G).length; return `generation ${G} · outbreaks that died out by chance: **${dead} of 5**`; },
              },
              after: r`Even though each case causes 1.5 new cases **on average**, two of the five chains fizzled out almost at once: the first case happened to infect nobody, or only one person who infected nobody. For this kind of spread the chance that one imported case dies out is $q \approx 0.42$, the solution of $q = e^{1.5(q - 1)}$. That's why early outbreaks are so unpredictable, and why many introductions of a disease never take off.`,
            },
            {
              type: 'mcq',
              title: 'Below one',
              prompt: r`If $R = 0.9$, what's the probability that a chain of infection started by one case eventually dies out?`,
              choices: [
                { t: '100%: with R below 1 every chain dies out', ok: true },
                { t: '90%', why: 'Below 1, chains shrink on average, and the probability of dying out is exactly 1.' },
                { t: '10%', why: 'It’s the opposite: chains almost always fizzle quickly.' },
              ],
              explain: r`With $R \le 1$, extinction is certain (though some chains can run for a while first). The interesting case is $R > 1$, where some sparks fizzle and others catch.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Even odds',
              prompt: r`Find the value of $R$ at which a single imported case has exactly a **50%** chance of fizzling out on its own.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 4, ymin: 0, ymax: 1, grid: 0.5, gridY: 0.1, height: 260, axes: { xlabel: 'R', ylabel: 'P(chain dies out)', xAt: 1, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { R: { min: 1.05, max: 4, step: 0.01, value: 2.5, slider: false } },
                curves: [{ f: (R) => extinction(R), color: 'violet', width: 3 }, { f: () => 0.5, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.R, y: (p) => extinction(p.R), drag: { x: 'R' }, color: 'coral' }],
                readout: (p) => r`$R = ${p.R.toFixed(2)}$: the chain dies out with probability $${(100 * extinction(p.R)).toFixed(1)}\%$`,
                goal: (p) => Math.abs(extinction(p.R) - 0.5) < 0.01,
                hint: r`Put $q = \frac12$ into $q = e^{R(q - 1)}$ and solve for $R$.`,
                solution: { R: 1.39 },
              },
              explain: r`$\frac12 = e^{-R/2}$ gives $R = 2\ln 2 \approx 1.39$. Even at $R = 2$, about 20% of introductions fizzle; at $R = 3$, about 6%. This is why border checks can delay an outbreak but rarely prevent one: with many introductions, one eventually takes off.`,
            },
            {
              type: 'numeric',
              title: 'Superspreaders',
              prompt: r`In some outbreaks, most infected people infect nobody, while a few infect many. Suppose 80% of cases infect 0 people and 20% infect 10. What's the average $R$?`,
              answer: 2,
              wrong: [{ v: 10, why: 'Only 20% of cases infect 10 people. Average over everyone.' }, { v: 0, why: 'Most infect no one, but the superspreaders raise the average.' }],
              explain: r`$0.8 \times 0 + 0.2 \times 10 = 2$. The same average as a disease where everyone infects exactly 2, but the outbreak behaves very differently: 80% of introductions die immediately, and spread happens in explosive clusters.`,
            },
            {
              type: 'mcq',
              title: 'Targeting clusters',
              prompt: r`If spread is dominated by superspreading events, what is the most effective way to control it?`,
              choices: [
                { t: 'Prevent large gatherings in risky settings and trace back to find clusters', ok: true },
                { t: 'Only trace forward from each case', why: 'Backward tracing finds the cluster a case came from, which usually has more undiscovered cases.' },
                { t: 'Nothing works with superspreading', why: 'It actually makes control easier in one sense: targeting the few risky settings removes most transmission.' },
              ],
              explain: r`When 20% of cases cause 80% or more of infections, stopping the riskiest settings (crowded, indoor, poorly ventilated) cuts transmission dramatically. Japan's early COVID-19 strategy focused on finding clusters by backward tracing.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The friendship paradox',
              prompt: r`In a star-shaped network, one hub has 4 friends, and each of those 4 has only the hub as a friend. Pick a random **friend of a random person**: list each person's friends and average over all friendships. The 4 leaves' friend (the hub) has 4 friends, and the hub's 4 friends have 1 each. What's the average number of friends a "friend" has?`,
              answer: 2.5,
              tol: 0.001,
              wrong: [{ v: 1.6, why: 'That’s the average number of friends **a person** has: (4 + 1 + 1 + 1 + 1)/5.' }],
              explain: r`There are 8 "friend" slots: 4 point to the hub (4 friends each) and 4 to leaves (1 friend each): $\frac{4 \times 4 + 4 \times 1}{8} = 2.5$, more than the 1.6 friends an average person has. Your friends have more friends than you, on average! So vaccinating randomly chosen **friends** of random people targets well-connected hubs.`,
            },
          ],
          recap: [
            'Early outbreaks are ruled by chance: many introductions fizzle.',
            r`Extinction probability solves $q = e^{R(q-1)}$; at $R = 2\ln 2$ it's 50%.`,
            'Superspreading makes spread clustered; targeting risky settings and hubs is effective.',
          ],
        },
        {
          id: 'base-rates',
          title: 'Vaccinated in Hospital',
          summary: 'Counts versus rates',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A puzzling headline',
              body: r`"Half the patients in hospital with the disease are vaccinated!" Does that mean the vaccine doesn’t work?

Not necessarily. If almost everyone is vaccinated, then even a very good vaccine leaves a lot of vaccinated cases, simply because there are so many vaccinated people. What matters is the **rate** in each group, not the raw count.`,
            },
            {
              type: 'numeric',
              title: 'A town of 1,000',
              prompt: r`In a town of 1,000, 90% are vaccinated. The vaccine cuts the risk of severe illness by 90%. If an unvaccinated person’s risk is 10%, how many severe cases are there in total?`,
              answer: 19,
              hint: r`Unvaccinated: $100 \times 10\%$. Vaccinated: $900 \times 1\%$.`,
              explain: r`Unvaccinated: $100 \times 0.10 = 10$ cases. Vaccinated: $900 \times 0.01 = 9$ cases. Total 19, of whom 9 (47%) are vaccinated, even though each vaccinated person was 10 times safer.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Rising coverage',
              prompt: r`With a 90% effective vaccine, the share of severe cases who are vaccinated is $\frac{c(1 - e)}{c(1 - e) + (1 - c)}$, where $c$ is the fraction vaccinated and $e = 0.9$. Find the coverage at which **half** of the patients are vaccinated.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'fraction of people vaccinated', ylabel: 'fraction of patients vaccinated', xticks: 0.2, yticks: 0.2 },
                params: { c: { min: 0, max: 1, step: 0.001, value: 0.5, label: 'coverage', color: 'teal', format: (v) => `${(100 * v).toFixed(1)}%` } },
                curves: [{ f: (x) => (x * 0.1) / (x * 0.1 + 1 - x), color: 'violet', width: 3 }, { f: () => 0.5, color: 'muted', dash: true }],
                points: [{ x: (p) => p.c, y: (p) => (p.c * 0.1) / (p.c * 0.1 + 1 - p.c), color: 'coral' }],
                readout: (p) => { const sh = (p.c * 0.1) / (p.c * 0.1 + 1 - p.c || 1); return `${(100 * p.c).toFixed(1)}% vaccinated → **${(100 * sh).toFixed(1)}%** of patients vaccinated · each vaccinated person still 10× safer`; },
                goal: (p) => Math.abs(p.c - 1 / 1.1) < 0.003,
                hint: r`Half the patients are vaccinated when $0.1c = 1 - c$.`,
                solution: { c: 0.909 },
              },
              explain: r`At $c = \frac{1}{1.1} \approx 91\%$ coverage, vaccinated and unvaccinated patients are equal in number. Beyond that, most patients are vaccinated, yet the vaccine is working exactly as well as before: there are just very few unvaccinated people left to get sick.`,
            },
            {
              type: 'mcq',
              title: 'The right comparison',
              prompt: r`Which statistic actually tells you how well the vaccine works?`,
              choices: [
                { t: 'Severe cases per 100,000 vaccinated, compared with per 100,000 unvaccinated', ok: true },
                { t: 'The fraction of patients who are vaccinated', why: 'That depends heavily on how many people are vaccinated in the first place.' },
                { t: 'The total number of vaccinated patients', why: 'A raw count says nothing without knowing the size of each group.' },
              ],
              explain: r`Comparing rates within each group removes the effect of group size. Ignoring group sizes is the **base-rate fallacy**, and it is behind many misleading headlines, from medicine to crime statistics.`,
            },
            {
              type: 'numeric',
              title: 'Read the rates',
              prompt: r`Data show 20 severe cases per 100,000 vaccinated people and 200 per 100,000 unvaccinated. By what percentage does vaccination cut the risk?`,
              unit: '%',
              answer: 90,
              tol: 0.5,
              explain: r`The risk ratio is $\frac{20}{200} = 0.1$, so the risk is cut by **90%**. That is what "90% effective" means.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Work out the efficacy',
              prompt: r`In a country where 95% of people are vaccinated, 60% of severe cases are vaccinated. How effective is the vaccine against severe disease? (Percentage, 1 decimal place.)`,
              unit: '%',
              answer: (1 - (0.6 * 0.05) / (0.95 * 0.4)) * 100,
              tol: 0.15,
              hint: r`Compare cases per person: vaccinated $\frac{0.6}{0.95}$, unvaccinated $\frac{0.4}{0.05}$.`,
              explain: r`Rate among vaccinated $\propto \frac{0.6}{0.95} = 0.632$; among unvaccinated $\propto \frac{0.4}{0.05} = 8$. Risk ratio $\frac{0.632}{8} = 0.079$, so efficacy $\approx$ **92.1%**. A majority of vaccinated patients is perfectly consistent with an excellent vaccine.`,
            },
          ],
          recap: [
            'When coverage is high, many cases can be vaccinated even with a good vaccine.',
            'Compare rates within groups, not raw counts: the base-rate fallacy.',
            'With 90% efficacy, half of patients are vaccinated at about 91% coverage.',
          ],
        },
      ],
    },
  ],
};
