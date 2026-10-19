import { fix } from '../lib/svg.js';
const r = String.raw;
const AL = 1, BE = 0.1, DE = 0.02, GA = 0.5; // prey growth, predation, predator gain, predator death
const T_END = 40, DT = 0.02;
const cache = new Map();
const simulate = (x0, y0) => {
  const key = `${x0},${y0}`;
  if (cache.has(key)) return cache.get(key);
  const f = ([x, y]) => [AL * x - BE * x * y, DE * x * y - GA * y];
  let st = [x0, y0];
  const out = [st];
  for (let i = 0; i < T_END / DT; i++) {
    const k1 = f(st), k2 = f(st.map((v, j) => v + (DT / 2) * k1[j])), k3 = f(st.map((v, j) => v + (DT / 2) * k2[j])), k4 = f(st.map((v, j) => v + DT * k3[j]));
    st = st.map((v, j) => v + (DT / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    out.push(st);
  }
  cache.set(key, out);
  return out;
};
const at = (series, t, j) => series[Math.min(series.length - 1, Math.round(t / DT))][j];

// logistic fishery
const RR = 0.4, KK = 10000;
const growth = (n) => RR * n * (1 - n / KK);

// fixed-catch fishery from N0, Euler steps of 0.05 years
const fishRun = (N0, H, T = 50) => { const out = [[0, N0]]; let N = N0; for (let t = 0.05; t <= T + 1e-9; t += 0.05) { N = Math.max(0, N + 0.05 * (growth(N) - H)); out.push([t, N]); } return out; };
// two competing species (scaled so each alone settles at 1)
const compRun = (a, b, x0 = 0.1, y0 = 0.15, T = 60, dt = 0.02) => { const out = [[x0, y0]]; let x = x0, y = y0; for (let t = 0; t < T; t += dt) { [x, y] = [x + dt * x * (1 - x - a * y), y + dt * y * (1 - y - b * x)]; out.push([x, y]); } return out; };
// two-stage population (juveniles J, adults A): J' = f·A, A' = s·J + p·A
const stages = (f, s, p, n = 15) => { let J = 0, A = 10; const out = [[J, A]]; for (let i = 0; i < n; i++) { [J, A] = [f * A, s * J + p * A]; out.push([J, A]); } return out; };
const lambda = (f, s, p) => (p + Math.sqrt(p * p + 4 * f * s)) / 2;

// Allee effect: growth r N (N/A − 1)(1 − N/K) with r = 0.5, A = 200, K = 1000
const allee = (N) => 0.5 * N * (N / 200 - 1) * (1 - N / 1000);
const alleeRun = (N0, H = 0, T = 30, dt = 0.02) => { const out = [[0, N0]]; let N = N0; for (let t = dt; t <= T + 1e-9; t += dt) { N = Math.max(0, N + dt * (allee(N) - H)); out.push([t, N]); } return out; };
// Levins metapopulation with habitat destruction D: dp/dt = c p (1 − D − p) − e p
const levinsRun = (D, c = 0.5, e = 0.1, p0 = 0.8, T = 100, dt = 0.05) => { const out = [[0, p0]]; let p = p0; for (let t = dt; t <= T + 1e-9; t += dt) { p = Math.max(0, p + dt * (c * p * (1 - D - p) - e * p)); out.push([t, p]); } return out; };
const PATCH_ORDER = (() => { let a = 31; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; const idx = Array.from({ length: 100 }, (_, i) => i); for (let i = 99; i > 0; i--) { const j = (u() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx; })();

// 100 patches, c = 0.5 and e = 0.1 per year, in quarter-year steps from 5 occupied patches (seeded, so the run is always the same)
let PATCH_SIM = null;
const patchSim = () => {
  if (PATCH_SIM) return PATCH_SIM;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let occ = Array.from({ length: 100 }, (_, i) => [7, 23, 48, 62, 85].includes(i));
  const frames = [occ];
  for (let k = 0; k < 160; k++) {
    const p = occ.filter(Boolean).length / 100;
    occ = occ.map((o) => (o ? rnd() > 0.1 * 0.25 : rnd() < 0.5 * p * 0.25));
    frames.push(occ);
  }
  return (PATCH_SIM = frames);
};

export default {
  id: 'populations',
  subject: 'math',
  title: 'Population Dynamics',
  level: 'Advanced',
  cover: 'populations',
  tagline: 'Predator–prey cycles, a fishing paradox, sustainable harvests, competition and age structure.',
  description: r`Why do lynx and hare populations rise and fall in a ten-year rhythm? Why did reduced fishing during the First World War lead to more sharks? How many fish can be caught each year without wrecking a fishery? When can two competing species share a habitat, and why did protecting turtle nests not save the turtles? Why can a species die out while some of its habitat is still intact? Model interacting populations with differential equations and matrices, and find out.`,
  prereq: 'Differential Equations',
  chapters: [
    {
      title: 'Predators and Prey',
      summary: 'The Lotka–Volterra model.',
      lessons: [
        {
          id: 'lotka',
          title: 'Boom and Bust',
          summary: 'The Lotka–Volterra equations',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Hares and lynx',
              body: r`For nearly a century, the Hudson's Bay Company recorded the furs it bought from trappers in Canada. The numbers of snowshoe hares and the lynx that hunt them rose and fell in cycles roughly 10 years long, with lynx peaks lagging behind hare peaks.

In the 1920s, Alfred Lotka and Vito Volterra independently wrote a simple model. With $x$ prey and $y$ predators:
$$\frac{dx}{dt} = \alpha x - \beta x y, \qquad \frac{dy}{dt} = \delta x y - \gamma y$$
Prey multiply on their own ($\alpha x$) but are eaten when they meet predators ($\beta xy$). Predators grow by eating ($\delta xy$) and die off without food ($\gamma y$).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the balance',
              prompt: r`Here $\alpha = 1$, $\beta = 0.1$, $\delta = 0.02$, $\gamma = 0.5$. Most starting populations cycle forever. Find the starting numbers that stay **perfectly constant**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: T_END, ymin: 0, ymax: 85, grid: 5, gridY: 20, height: 280, axes: { xlabel: 'time', ylabel: 'population' },
                params: {
                  x0: { min: 10, max: 50, step: 1, value: 40, label: 'prey at start', color: 'blue' },
                  y0: { min: 4, max: 20, step: 1, value: 8, label: 'predators at start', color: 'coral' },
                },
                curves: [
                  { f: (t, p) => at(simulate(p.x0, p.y0), t, 0), color: 'blue', width: 3 },
                  { f: (t, p) => at(simulate(p.x0, p.y0), t, 1), color: 'coral', width: 3 },
                ],
                readout: (p) => {
                  const sr = simulate(p.x0, p.y0);
                  const xs = sr.map((s) => s[0]);
                  const swing = Math.max(...xs) - Math.min(...xs);
                  return swing < 0.5 ? '**Equilibrium**: neither population changes.' : `prey swing between ${Math.min(...xs).toFixed(0)} and ${Math.max(...xs).toFixed(0)}`;
                },
                goal: (p) => p.x0 === GA / DE && p.y0 === AL / BE,
                hint: r`Both rates must be zero. $\frac{dy}{dt} = 0$ needs $\delta x = \gamma$; $\frac{dx}{dt} = 0$ needs $\beta y = \alpha$.`,
                solution: { x0: 25, y0: 10 },
              },
              explain: r`The equilibrium is $x^* = \frac{\gamma}{\delta} = 25$ prey and $y^* = \frac{\alpha}{\beta} = 10$ predators. Start anywhere else and the populations orbit around it: prey boom, predators feast and multiply, prey crash, predators starve, prey recover… The predator peaks always lag behind the prey peaks.`,
            },
            {
              type: 'mcq',
              title: 'Loops in the plane',
              prompt: r`Plot predators against prey (instead of against time). What shape does a Lotka–Volterra cycle trace?`,
              choices: [
                { t: 'A closed loop around the equilibrium point, repeated forever', ok: true },
                { t: 'A spiral into the equilibrium', why: 'In the basic model, a quantity is conserved, so orbits neither spiral in nor out: they close up.' },
                { t: 'A straight line', why: 'Prey and predators rise and fall out of step, so the path loops round.' },
              ],
              explain: r`The basic model has a conserved quantity, $\delta x - \gamma \ln x + \beta y - \alpha \ln y$, so each starting point stays on its own closed loop. Real ecosystems add complications (limited food for prey, disease, weather), which can make cycles settle down or turn chaotic, but the basic rhythm survives remarkably often.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Orbits in the plane',
              body: r`Here each run is drawn as a path in the prey–predator plane: prey across, predators up. Drag the starting point. The dot in the middle is the equilibrium (25, 10).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 0, ymax: 32, grid: false, height: 320, padL: 46, axes: { xlabel: 'prey', ylabel: 'predators', xticks: 10, yticks: 5 },
                params: { x0: { min: 6, max: 60, step: 1, value: 40, slider: false }, y0: { min: 3, max: 25, step: 1, value: 8, slider: false } },
                extra: ({ plot, p, s }) => [
                  s('path', { d: simulate(p.x0, p.y0).map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(Math.min(x, 95)).toFixed(1)} ${plot.Y(Math.min(y, 34)).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 }),
                  s('circle', { cx: plot.X(25), cy: plot.Y(10), r: 5, class: 'fl-ink' }),
                ],
                points: [{ x: (p) => p.x0, y: (p) => p.y0, drag: { x: 'x0', y: 'y0' }, color: 'coral' }],
                readout: (p) => (p.x0 === 25 && p.y0 === 10 ? 'At the equilibrium: the path is a single point.' : 'The path goes round anticlockwise and closes on itself.'),
              },
              after: r`Every orbit circles the equilibrium **anticlockwise**: many prey and few predators (bottom right) → predators multiply (top right) → prey crash (top left) → predators starve (bottom left) → prey recover. Bigger loops mean wilder booms and busts.`,
            },
            {
              type: 'mcq',
              title: 'Average over a cycle',
              prompt: r`In the Lotka–Volterra model the populations cycle forever. What are their **averages** over one full cycle?`,
              choices: [
                { t: r`Exactly the equilibrium values`, ok: true },
                { t: r`Zero`, why: r`Neither population dies out; they oscillate around the equilibrium.` },
                { t: r`Half the peak values`, why: r`The cycles aren’t symmetric, but the time averages equal the equilibrium exactly.` },
              ],
              explain: r`Integrating the equations over a cycle shows the averages equal the equilibrium point. That’s the heart of Volterra’s fishing paradox: fishing shifts the equilibrium, and so shifts the averages, even though the cycles continue.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The rhythm',
              prompt: r`Small cycles near the equilibrium have period $T \approx \dfrac{2\pi}{\sqrt{\alpha\gamma}}$. With $\alpha = 1$ and $\gamma = 0.5$, what is the period? (1 decimal place.)`,
              answer: (2 * Math.PI) / Math.sqrt(0.5),
              tol: 0.05,
              wrong: [{ v: 2 * Math.PI * Math.sqrt(0.5), tol: 0.05, why: r`Divide by $\sqrt{\alpha\gamma} = \sqrt{0.5} \approx 0.707$, don't multiply.` }, { v: 4 * Math.PI, tol: 0.05, why: r`$\sqrt{1 \times 0.5} = 0.707$, not 0.5.` }],
              explain: r`$\frac{2\pi}{\sqrt{0.5}} \approx 8.9$ time units. The period depends on how fast the prey breed and how fast the predators die, not on the numbers of animals. For hares and lynx, rates like these give a cycle of roughly a decade, close to what the fur records show.`,
            },
          ],
          recap: [
            'Lotka–Volterra: prey grow and get eaten; predators eat and die off.',
            r`Equilibrium at $x^* = \gamma/\delta$, $y^* = \alpha/\beta$.`,
            'Other starting points give endless cycles, with predator peaks lagging prey peaks.',
          ],
        },
        {
          id: 'fishing',
          title: 'Volterra’s Fishing Paradox',
          summary: 'Less fishing, more sharks',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A puzzle from the Adriatic',
              body: r`During the First World War, fishing in the Adriatic Sea dropped sharply. Afterwards, the biologist Umberto D'Ancona noticed that the **proportion** of predatory fish (sharks, rays) in the catch had risen. Why would less fishing favour predators? He took the question to his father-in-law, the mathematician Vito Volterra.

Volterra added fishing at rate $h$, removing both prey and predators in proportion to their numbers:
$$\frac{dx}{dt} = (\alpha - h)x - \beta xy, \qquad \frac{dy}{dt} = \delta xy - (\gamma + h)y$$`,
            },
            {
              type: 'numeric',
              title: 'The new balance',
              prompt: r`With fishing, the equilibrium becomes $x^* = \frac{\gamma + h}{\delta}$ and $y^* = \frac{\alpha - h}{\beta}$. Using $\alpha = 1$, $\beta = 0.1$, $\delta = 0.02$, $\gamma = 0.5$ and fishing rate $h = 0.2$, how many predators are there at equilibrium?`,
              answer: (AL - 0.2) / BE,
              tol: 0.01,
              wrong: [{ v: 10, why: 'That’s without fishing. With h = 0.2: (1 − 0.2) ÷ 0.1.' }, { v: (GA + 0.2) / DE, tol: 0.01, why: 'That’s the prey equilibrium. Predators: (α − h) ÷ β.' }],
              explain: r`$y^* = \frac{0.8}{0.1} = 8$ predators (down from 10), while prey rise to $x^* = \frac{0.7}{0.02} = 35$ (up from 25). Moderate fishing **helps** the prey on average and hurts the predators. So when wartime fishing stopped, the balance swung back towards predators, exactly as D'Ancona saw.`,
            },
            {
              type: 'numeric',
              title: 'What the fishermen saw',
              prompt: r`The catch contains prey and predators in proportion to their numbers. With no fishing, the equilibrium is 25 prey and 10 predators, so predators are $\frac{10}{35} \approx 29\%$ of the catch. At $h = 0.2$ (35 prey, 8 predators), what percentage of the catch is predators? (1 decimal place.)`,
              unit: '%',
              answer: (8 / 43) * 100,
              tol: 0.1,
              wrong: [{ v: (8 / 35) * 100, tol: 0.2, why: 'Divide by the total, prey plus predators: 35 + 8 = 43.' }, { v: 80, tol: 0.5, why: 'That’s the predators as a share of their old number. The question is about the share of the catch.' }],
              explain: r`$\frac{8}{35 + 8} \approx 18.6\%$. So heavy wartime fishing would have meant fewer predators in the catch, and the lull in fishing let their share climb back towards 29%, just what D'Ancona saw in the market records.`,
            },
            {
              type: 'numeric',
              title: 'Fished out',
              prompt: r`At what fishing rate $h$ does the predators' equilibrium $y^* = \frac{\alpha - h}{\beta}$ drop to zero? ($\alpha = 1$.)`,
              answer: 1,
              wrong: [{ v: 0.5, why: r`That's $\gamma$. Predators vanish when $\alpha - h = 0$.` }, { v: 0.1, why: r`That's $\beta$. Set the numerator $\alpha - h$ to zero.` }],
              explain: r`At $h = \alpha = 1$, the prey are being removed as fast as they breed on their own, so there's nothing spare to feed predators, and the predators die out. Strong harvesting tends to strip out the top of a food chain first, a pattern called "fishing down the food web".`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Fishing both species',
              body: r`Prey (fish, teal) and predators (sharks, coral) follow the Lotka–Volterra cycles. Fishing removes a fraction of **both** each year. Increase the fishing effort and watch the **average** populations (dashed).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 6, grid: false, height: 280, axes: { xlabel: 'time (years)', ylabel: 'population', xticks: 5, yticks: 1 },
                params: { f: { min: 0, max: 0.8, step: 0.05, value: 0, label: 'fishing effort', color: 'blue', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => { const a = 1, b = 0.5, c = 0.75, d = 0.25; let x = 2, y = 1.2, dp = '', dq = ''; const F = (x, y) => [x * (a - p.f - b * y), y * (d * x - c - p.f)], dt = 0.01; for (let i = 0; i <= 4000; i++) { const t = i * dt; if (i % 5 === 0) { dp += (dp ? 'L' : 'M') + plot.X(t).toFixed(1) + ' ' + plot.Y(Math.min(x, 6.5)).toFixed(1); dq += (dq ? 'L' : 'M') + plot.X(t).toFixed(1) + ' ' + plot.Y(Math.min(y, 6.5)).toFixed(1); } const k1 = F(x, y), k2 = F(x + (dt / 2) * k1[0], y + (dt / 2) * k1[1]), k3 = F(x + (dt / 2) * k2[0], y + (dt / 2) * k2[1]), k4 = F(x + dt * k3[0], y + dt * k3[1]); x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); } const X = (c + p.f) / d, Y = (a - p.f) / b; return [s('path', { d: dp, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 2.5 }), s('path', { d: dq, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }), s('line', { x1: plot.X(0), x2: plot.X(40), y1: plot.Y(X), y2: plot.Y(X), stroke: 'var(--teal)', 'stroke-dasharray': '6 5' }), s('line', { x1: plot.X(0), x2: plot.X(40), y1: plot.Y(Y), y2: plot.Y(Y), stroke: 'var(--coral)', 'stroke-dasharray': '6 5' })]; },
                readout: (p) => `average fish **${((0.75 + p.f) / 0.25).toFixed(2)}** · average sharks **${((1 - p.f) / 0.5).toFixed(2)}**`,
              },
              after: r`Fishing **raises** the average number of prey and lowers the predators. With fewer sharks eating them, the fish more than make up for the catch. That explains what the Adriatic fishermen saw: when fishing stopped during the First World War, the share of sharks in the catch went up.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pesticides',
              prompt: r`A farmer sprays an insecticide that kills both a crop pest (prey) and the ladybirds that eat it (predators), in proportion to their numbers. According to the same model, what happens to the pest population on average?`,
              choices: [
                { t: 'It can increase, because the spray hurts the predators’ equilibrium more than the pests’', ok: true },
                { t: 'It must decrease, since the spray kills pests', why: 'The spray also cuts the predators, and in this model the pest equilibrium γ/δ goes up when predators die faster.' },
                { t: 'Nothing changes', why: 'Both equilibria shift: pests up, predators down.' },
              ],
              explain: r`It's the same mathematics as fishing: indiscriminate killing raises the prey equilibrium. This has really happened: spraying cottony cushion scale insects in California citrus groves in the 1940s also killed their ladybird predators, and the pest outbreaks grew worse. It's one reason modern farming favours targeted, integrated pest management.`,
            },
          ],
          recap: [
            'Fishing both species raises the prey equilibrium and lowers the predators’.',
            'This explains the rise of predatory fish when wartime fishing stopped.',
            'Broad pesticides can, paradoxically, increase pests.',
          ],
        },
      ],
    },
    {
      title: 'Harvesting',
      summary: 'Sustainable yield and collapse.',
      lessons: [
        {
          id: 'msy',
          title: 'Sustainable Yield',
          summary: 'How many fish can we take?',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Growth that peaks in the middle',
              body: r`A fish stock with no fishing follows logistic growth, $\frac{dN}{dt} = rN\left(1 - \frac{N}{K}\right)$, where $K$ is the carrying capacity. Its growth rate is small when there are very few fish (few parents) and when there are very many (crowding), and largest in between.

Catch $H$ fish per year, and the stock is in balance wherever the natural growth equals the catch.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Maximum sustainable yield',
              prompt: r`The curve shows natural growth for a stock with $r = 0.4$ per year and $K = 10{,}000$ fish. The dashed line is the annual catch. Find the **largest** catch that can be sustained.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10000, ymin: 0, ymax: 1400, grid: 2000, gridY: 200, height: 280, padL: 56,
                axes: { xlabel: 'fish in the stock', ylabel: 'fish per year' },
                params: { H: { min: 200, max: 1400, step: 50, value: 600, label: 'annual catch', color: 'coral', format: (v) => `${v} fish` } },
                curves: [{ f: (n) => growth(n), color: 'teal', width: 3 }, { f: (n, p) => p.H, color: 'coral', dash: true, width: 2.5 }],
                extra: ({ plot, p, s }) => {
                  const disc = 1 - (4 * p.H) / (RR * KK);
                  if (disc < 0) return [];
                  const n1 = (KK / 2) * (1 + Math.sqrt(disc));
                  return [s('circle', { cx: plot.X(n1), cy: plot.Y(p.H), r: 7, class: 'fl-teal' })];
                },
                readout: (p) => {
                  const disc = 1 - (4 * p.H) / (RR * KK);
                  if (disc < 0) return `Catch exceeds the maximum growth: the stock **collapses**.`;
                  return `stable stock: **${Math.round((KK / 2) * (1 + Math.sqrt(disc)))}** fish`;
                },
                goal: (p) => p.H === (RR * KK) / 4,
                hint: r`The peak of the growth curve is at $N = K/2$. How fast is the stock growing there?`,
                solution: { H: 1000 },
              },
              explain: r`The growth curve peaks at $N = \frac{K}{2} = 5000$, where it adds $\frac{rK}{4} = 1000$ fish per year: the **maximum sustainable yield**. Any bigger catch exceeds the best possible growth, and the stock declines to zero. And at exactly the maximum, any bad year or overfishing tips the stock over the edge, so managers aim well below it.`,
            },
            {
              type: 'interactive',
              title: 'Too few to recover',
              body: r`With a fixed catch of 750 fish a year (below the maximum of 1000), there are **two** balance points: where the growth curve crosses the catch line. Choose the starting stock and watch 50 years unfold. Find the smallest starting stock that survives.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 10000, grid: false, height: 280, padL: 56, axes: { xlabel: 'years', ylabel: 'fish', xticks: 10, yticks: 2000 },
                params: { N0: { min: 1000, max: 9000, step: 100, value: 4000, label: 'starting stock', color: 'blue' } },
                curves: [{ f: () => 2500, color: 'coral', dash: true }, { f: () => 7500, color: 'teal', dash: true }],
                extra: ({ plot, p, s }) => [s('path', { d: fishRun(p.N0, 750).map(([t, N], i) => `${i ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(N).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 })],
                readout: (p) => { const end = fishRun(p.N0, 750).slice(-1)[0][1]; return end < 1 ? 'The stock **collapses** to zero.' : `After 50 years: **${Math.round(end)}** fish.`; },
                goal: (p) => p.N0 >= 2500 && p.N0 <= 2600,
                hint: r`The lower balance point is where $0.4N(1 - N/10000) = 750$.`,
                solution: { N0: 2600 },
              },
              explain: r`The balance points are at 2500 and 7500 fish. Above 2500, growth beats the catch and the stock climbs to the **stable** level of 7500. Below 2500, the catch beats growth, and the decline accelerates to collapse. The lower balance point is **unstable**: a fishery pushed below it by a few bad years collapses even though the catch is "sustainable".`,
            },
            {
              type: 'numeric',
              title: 'Fish a fraction instead',
              body: r`Instead of a fixed number, catch a fixed **fraction** $E$ of the stock each year: $\frac{dN}{dt} = rN\left(1 - \frac{N}{K}\right) - EN$. The stock then settles at $N^* = K\left(1 - \frac{E}{r}\right)$.`,
              prompt: r`With $r = 0.4$, $K = 10{,}000$ and $E = 0.1$ (10% a year), where does the stock settle?`,
              unit: 'fish',
              answer: 7500,
              wrong: [{ v: 9000, why: r`$1 - \frac{E}{r} = 1 - \frac{0.1}{0.4} = 0.75$, not 0.9.` }, { v: 750, why: 'That’s the annual catch at that level, 10% of 7500.' }],
              explain: r`$N^* = 10{,}000 \times (1 - 0.25) = 7500$, with a catch of $0.1 \times 7500 = 750$ a year. If the stock drops, the catch drops with it, giving it room to recover: this kind of harvesting has a single stable balance and no collapse. The best effort is $E = \frac{r}{2}$, giving the same maximum yield of 1000.`,
            },
            {
              type: 'numeric',
              title: 'The danger line',
              prompt: r`The same stock ($r = 0.4$, $K = 10{,}000$) now has a fixed catch of 640 fish a year. The balance points solve $0.4N\left(1 - \frac{N}{10{,}000}\right) = 640$. What is the **lower** (unstable) one?`,
              unit: 'fish',
              answer: 2000,
              tol: 5,
              wrong: [{ v: 8000, tol: 5, why: 'That’s the upper, stable balance. The question asks for the lower one, the point of no return.' }],
              explain: r`Multiply out: $N^2 - 10{,}000N + 16{,}000{,}000 = 0$, so $N = \frac{10{,}000 \pm 6000}{2}$: 2000 or 8000. A stock above 2000 recovers to 8000; one pushed below 2000 by a few bad years collapses, even though the catch never changed. The closer the catch gets to the maximum of 1000, the closer the two points move together, and the thinner the safety margin.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Grand Banks',
              prompt: r`For centuries, the Grand Banks off Newfoundland held one of the richest cod fisheries on Earth. In 1992, Canada closed it after the cod collapsed to around 1% of historic levels. Which feature of the model helps explain such a sudden collapse?`,
              choices: [
                { t: 'If the catch exceeds the stock’s maximum growth rate, there is no stable level at all, and decline accelerates as numbers fall', ok: true },
                { t: 'Fish populations always recover quickly once fishing stops', why: 'The Grand Banks cod has recovered only slowly, decades later. Collapsed ecosystems can get stuck.' },
                { t: 'Catching fewer fish per boat causes collapse', why: 'It was catching too many, with improved technology masking the decline until too late.' },
              ],
              explain: r`With a fixed catch above the maximum sustainable yield, the stock falls, its growth falls with it, and the decline speeds up. Better technology kept catches high even as the stock shrank, hiding the danger. About 30,000 people lost their jobs when the fishery closed, and recovery has been slow. Modern fisheries usually set catches as a **fraction** of the estimated stock, so the catch falls automatically as the stock declines.`,
            },
          ],
          recap: [
            'Logistic growth is fastest at half the carrying capacity.',
            r`Maximum sustainable yield $= rK/4$.`,
            'Catches above it make stocks collapse, as happened to the Grand Banks cod.',
          ],
        },
      ],
    },
    {
      title: 'Competition and Age',
      summary: 'Rival species and population structure.',
      lessons: [
        {
          id: 'competition',
          title: 'Competing Species',
          summary: 'Coexist or exclude?',
          icon: 'hand',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Same food, same place',
              prompt: 'Two species eat exactly the same food in the same place, and one is slightly better at getting it. What tends to happen over many generations?',
              choices: [
                { t: 'The better competitor eventually drives the other out', ok: true },
                { t: 'They settle into an equal split', why: 'Even a small advantage compounds generation after generation.' },
                { t: 'Both die out', why: 'The winner keeps the food supply, so it survives.' },
              ],
              explain: r`In 1934 the Russian biologist Georgy Gause grew two species of *Paramecium* in the same tube of food: one always drove the other extinct. The **competitive exclusion principle** says two species competing for exactly the same limited resource can't coexist indefinitely. Coexistence needs some difference in what they need.`,
            },
            {
              type: 'explain',
              title: 'The competition model',
              body: r`Measure each species as a fraction of the number its habitat could support on its own. Each grows logistically, but is also held back by the other:
$$\frac{dx}{dt} = x\,(1 - x - a\,y), \qquad \frac{dy}{dt} = y\,(1 - y - b\,x).$$
The **competition coefficients** $a$ and $b$ say how strongly each species crowds the other, compared with crowding by its own kind. $a = 1$ means a member of species $y$ is as bad for $x$ as one more $x$.`,
            },
            {
              type: 'interactive',
              title: 'Coexist or exclude',
              body: r`The graph shows both populations over time, starting small. Set the competition coefficients. Find settings where **both species survive** together.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 1.1, grid: false, height: 280, axes: { xlabel: 'time', ylabel: 'population', xticks: 10, yticks: 0.25 },
                params: {
                  a: { min: 0.2, max: 1.8, step: 0.05, value: 1.4, label: 'effect of y on x (a)', color: 'blue' },
                  b: { min: 0.2, max: 1.8, step: 0.05, value: 0.6, label: 'effect of x on y (b)', color: 'coral' },
                },
                extra: ({ plot, p, s }) => { const run = compRun(p.a, p.b); const path = (j) => run.filter((_, i) => i % 5 === 0).map((st, i) => `${i ? 'L' : 'M'}${plot.X(i * 0.1).toFixed(1)} ${plot.Y(st[j]).toFixed(1)}`).join(''); return [s('path', { d: path(0), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }), s('path', { d: path(1), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 })]; },
                readout: (p) => {
                  if (p.a < 1 && p.b < 1) return `**Coexistence**: $x \\to ${((1 - p.a) / (1 - p.a * p.b)).toFixed(2)}$, $y \\to ${((1 - p.b) / (1 - p.a * p.b)).toFixed(2)}$`;
                  if (p.a > 1 && p.b > 1) { const [x, y] = compRun(p.a, p.b).slice(-1)[0]; return `Both crowd each other hard: whoever gets ahead wins. Here **${x > y ? 'x' : 'y'}** wins.`; }
                  if (p.a >= 1 && p.b <= 1) return 'Species **y** wins; x is slowly squeezed out.';
                  return 'Species **x** wins; y is slowly squeezed out.';
                },
                goal: (p) => p.a < 1 && p.b < 1,
                hint: 'Coexistence needs each species to hold back its own kind more than it holds back the other.',
                solution: { a: 0.5, b: 0.5 },
              },
              explain: r`Both survive when $a < 1$ and $b < 1$: each species is limited more by its own kind than by its rival, usually because they use resources a bit differently. If one coefficient exceeds 1 while the other is below 1, the species that crowds harder wins. If **both** exceed 1, whoever gets a head start wins.`,
            },
            {
              type: 'numeric',
              title: 'Where they settle',
              prompt: r`With $a = b = 0.5$, both populations settle at the same level, where $1 - x - 0.5x = 0$. What is it? (3 decimal places.)`,
              answer: 2 / 3,
              tol: 0.001,
              wrong: [{ v: 0.5, tol: 0.001, why: r`Solve $1 - x - 0.5x = 0$: $1.5x = 1$.` }, { v: 1, why: 'That’s the level each species would reach alone. Competition holds both lower.' }],
              explain: r`$1.5x = 1$ gives $x = y = \frac23$: each species reaches two-thirds of what it would alone. In general, coexistence settles at $x^* = \frac{1 - a}{1 - ab}$, $y^* = \frac{1 - b}{1 - ab}$.`,
            },
            {
              type: 'mcq',
              title: 'Head start',
              prompt: r`With $a = b = 1.5$ (each species harms the other more than itself), the outcome depends on the starting numbers. What kind of situation is this?`,
              choices: [
                { t: 'Bistable: whichever species is ahead takes over', ok: true },
                { t: 'They always coexist', why: 'Here each crowds its rival harder than itself, so coexistence is unstable.' },
                { t: 'The species with more offspring always wins', why: 'In this model, with equal coefficients, the head start decides.' },
              ],
              explain: r`There's a coexistence point, but it's unstable, like a ball balanced on a ridge: a slight advantage grows until one species takes over. Which one depends on history. Ecologists call this **priority effects**: the first to arrive in a habitat can lock others out.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Red and grey squirrels',
              prompt: r`American grey squirrels, introduced to Britain in the late 1800s, have replaced the native red squirrel across most of England. Besides competing for food, greys carry a squirrelpox virus that harms reds but rarely greys. In the competition model, what does the virus do?`,
              choices: [
                { t: 'It effectively raises the greys’ harm to reds (a coefficient above 1), so the greys win', ok: true },
                { t: 'It lowers the greys’ harm to reds', why: 'The virus makes each grey squirrel even more damaging to red squirrels.' },
                { t: 'It has no effect in the model', why: 'Anything that makes one species reduce the other’s growth acts like a bigger competition coefficient.' },
              ],
              explain: r`Greys outcompete reds for food (especially acorns, which reds digest poorly) and carry squirrelpox, together making the greys' effect on reds much stronger than the reverse. Reds now survive mainly in Scotland, Ireland and islands, plus areas where pine martens, which prey more on greys, have returned.`,
            },
          ],
          recap: [
            'Competitive exclusion: identical competitors can’t coexist (Gause).',
            'In the model, coexistence needs a < 1 and b < 1: each species limits itself more than its rival.',
            'If both exceed 1, the outcome is bistable and history decides.',
          ],
        },
        {
          id: 'leslie',
          title: 'Age Structure',
          summary: 'Juveniles, adults and the growth factor',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'One year on',
              body: r`A bird population has 100 juveniles and 50 adults this year. Each adult raises 2 chicks a year; half of juveniles survive to become adults; 60% of adults survive each year.`,
              prompt: 'How many adults will there be next year?',
              answer: 0.5 * 100 + 0.6 * 50,
              wrong: [{ v: 50, why: 'Add the surviving juveniles (half of 100) to the surviving adults (60% of 50).' }, { v: 100, why: r`Juveniles: $0.5 \times 100 = 50$ survive. Adults: $0.6 \times 50 = 30$ survive.` }],
              explain: r`$0.5 \times 100 + 0.6 \times 50 = 50 + 30 = 80$ adults, and $2 \times 50 = 100$ new juveniles. Splitting a population into **stages** lets us see who survives and who breeds, which a single number can't.`,
            },
            {
              type: 'explain',
              title: 'Stages and matrices',
              body: r`Write the population as juveniles $J$ and adults $A$. Each year:
$$J_{\text{next}} = f\,A, \qquad A_{\text{next}} = s\,J + p\,A,$$
with $f$ = chicks per adult, $s$ = juvenile survival, $p$ = adult survival. Patrick Leslie wrote models like this as a **matrix** in 1945:
$$\begin{pmatrix} J \\ A \end{pmatrix}_{\text{next}} = \begin{pmatrix} 0 & f \\ s & p \end{pmatrix}\begin{pmatrix} J \\ A \end{pmatrix}.$$
Whatever the starting mix, after a few years the population settles into a fixed ratio of juveniles to adults and grows (or shrinks) by the same factor $\lambda$ every year.`,
            },
            {
              type: 'interactive',
              title: 'Hold it steady',
              body: r`Juvenile survival is $s = 0.5$ and adult survival $p = 0.6$. Bars show juveniles (blue) and adults (coral) over 15 years. Choose the breeding rate $f$ so the population neither grows nor shrinks in the long run ($\lambda = 1$).`,
              widget: {
                kind: 'graph', xmin: -0.7, xmax: 15.7, ymin: 0, ymax: 40, grid: false, height: 280, axes: { xlabel: 'year', ylabel: 'birds', xticks: 5, yticks: 10, xAt: -0.7 },
                params: { f: { min: 0.2, max: 2, step: 0.05, value: 1.1, label: 'chicks per adult (f)', color: 'teal' } },
                extra: ({ plot, p, s }) => stages(p.f, 0.5, 0.6).flatMap(([J, A], i) => [
                  s('rect', { x: plot.X(i - 0.38), y: plot.Y(Math.min(40, J)), width: plot.X(0.36) - plot.X(0), height: plot.Y(0) - plot.Y(Math.min(40, J)), class: 'fl-blue' }),
                  s('rect', { x: plot.X(i + 0.02), y: plot.Y(Math.min(40, A)), width: plot.X(0.36) - plot.X(0), height: plot.Y(0) - plot.Y(Math.min(40, A)), class: 'fl-coral' }),
                ]),
                readout: (p) => { const L = lambda(p.f, 0.5, 0.6); return `Long-run growth factor λ = **${L.toFixed(3)}** per year (${L > 1.0005 ? 'growing' : L < 0.9995 ? 'shrinking' : 'steady'})`; },
                goal: (p) => Math.abs(lambda(p.f, 0.5, 0.6) - 1) < 0.001,
                hint: r`For $\lambda = 1$, each adult must exactly replace itself: the adults lost each year ($1 - p$) must equal new adults per adult ($f \times s$).`,
                solution: { f: 0.8 },
              },
              explain: r`Steady needs $1 - p = fs$: each year 40% of adults die, so each adult must produce $0.4$ new adults, which takes $f = \frac{0.4}{0.5} = 0.8$ chicks. Notice the early wobbles: the starting mix (all adults) isn't the settled ratio, so the first few years overshoot and undershoot before the pattern takes hold.`,
            },
            {
              type: 'numeric',
              title: 'The growth factor',
              body: r`The long-run growth factor of this model is $\lambda = \dfrac{p + \sqrt{p^2 + 4fs}}{2}$.`,
              prompt: r`What is $\lambda$ for $f = 3$, $s = 0.5$, $p = 0.5$?`,
              answer: 1.5,
              tol: 0.001,
              wrong: [{ v: 2, why: r`$\sqrt{0.25 + 6} = 2.5$, then $(0.5 + 2.5)/2$.` }, { v: 2.5, why: 'Don’t forget to add p and halve.' }],
              explain: r`$\frac{0.5 + \sqrt{0.25 + 6}}{2} = \frac{0.5 + 2.5}{2} = 1.5$: the population grows 50% a year once it settles. (In matrix language, $\lambda$ is the largest **eigenvalue** of the Leslie matrix, an idea you'll meet in the Linear Algebra course.)`,
            },
            {
              type: 'mcq',
              title: 'Which number matters most?',
              prompt: r`Conservationists trying to save loggerhead sea turtles in the 1980s found that protecting nests on beaches (more hatchlings) did little. A stage model showed something else mattered far more. What?`,
              choices: [
                { t: 'Survival of large juveniles and adults, who were drowning in shrimp-fishing nets', ok: true },
                { t: 'The number of eggs per nest', why: 'Turtles lay many eggs, but so few hatchlings survive that extra eggs barely change λ.' },
                { t: 'The temperature of the sand', why: 'Sand temperature sets the sex of hatchlings, but the model pointed at older turtles’ survival.' },
              ],
              explain: r`A 1987 stage model of loggerheads showed that $\lambda$ was most **sensitive** to the survival of large juveniles and adults, which take decades to mature and were dying in shrimp trawls. This helped drive laws requiring turtle excluder devices in nets. Stage models show where effort pays off most.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Tenfold growth',
              prompt: r`A population settles into growing by a factor $\lambda = 1.5$ every year. About how many years does it take to grow tenfold? (1 decimal place.)`,
              unit: 'years',
              answer: Math.log(10) / Math.log(1.5),
              tol: 0.05,
              wrong: [{ v: 10 / 1.5, tol: 0.1, why: r`Growth is multiplicative: solve $1.5^n = 10$, so $n = \frac{\log 10}{\log 1.5}$.` }, { v: 6, why: r`$1.5^6 \approx 11.4$ is already more than 10. Use logarithms for a precise answer.` }],
              explain: r`$1.5^n = 10$ gives $n = \frac{\ln 10}{\ln 1.5} \approx 5.7$ years. Without limits, the population would grow tenfold every 5.7 years: a thousandfold in 17. That's why real populations always end up limited by food, space or predators, as in the logistic and predator–prey models.`,
            },
          ],
          recap: [
            'Stage-structured models track juveniles and adults separately (Leslie matrices).',
            'The population settles into a stable mix, growing by a factor λ each year.',
            'λ = 1 means each adult exactly replaces itself; sensitivity analysis shows which survival rate matters most.',
          ],
        },
      ],
    },
    {
      title: 'Thresholds of Survival',
      summary: 'When small populations, or small habitats, are doomed.',
      lessons: [
        {
          id: 'allee',
          title: 'Too Few to Survive',
          summary: 'The Allee effect',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Safety in numbers',
              body: r`In the logistic model, a small population grows fastest per individual: plenty of room, little competition. But many species **need each other**: to find mates, to hunt or defend in groups, to pollinate. When numbers fall too low, each individual does **worse**. This is the **Allee effect**, after the ecologist Warder Clyde Allee.

A simple model adds a threshold $A$ to logistic growth:
$$\frac{dN}{dt} = rN\left(\frac{N}{A} - 1\right)\left(1 - \frac{N}{K}\right)$$
Between $A$ and the carrying capacity $K$ the population grows; below $A$ the middle factor is negative and it shrinks.`,
            },
            {
              type: 'mcq',
              title: 'Below the line',
              prompt: r`With $A = 200$ and $K = 1000$, a population of 150 animals is left after a hard winter. What does the model predict?`,
              choices: [
                { t: 'It declines to extinction, even with no further threats', ok: true },
                { t: 'It recovers slowly back to 1,000', why: r`Below $A$, the factor $\frac{N}{A} - 1$ is negative, so the growth rate is negative.` },
                { t: 'It stays at 150', why: 'Only the equilibria 0, A and K stay put. 150 is none of them.' },
              ],
              explain: r`Below the threshold, the population shrinks, which makes things worse still, and it spirals down to zero. $N = A$ is an **unstable** equilibrium: a tipping point between recovery and collapse.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Either side of the tipping point',
              body: r`Choose a starting population and follow it for 30 years (with $r = 0.5$ per year, $A = 200$, $K = 1000$). The faint curves start from other values.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 1100, grid: false, height: 270, axes: { xlabel: 'years', ylabel: 'population', xticks: 5, yticks: 200 },
                params: { N0: { min: 20, max: 1000, step: 5, value: 230, label: 'starting population', color: 'coral' } },
                curves: [{ f: () => 200, color: 'muted', dash: true }, { f: () => 1000, color: 'teal', dash: true }],
                extra: ({ plot, p, s }) => { const path = (run) => run.filter((_, i) => i % 5 === 0).map(([t, n], i) => `${i ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(n).toFixed(1)}`).join(''); const out = [100, 180, 220, 400, 700].map((n) => s('path', { d: path(alleeRun(n)), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.2, opacity: 0.5 })); out.push(s('path', { d: path(alleeRun(p.N0)), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 })); return out; },
                readout: (p) => { const run = alleeRun(p.N0), end = run[run.length - 1][1]; return `after 30 years: **${Math.round(end)}** animals · ${end < 1 ? 'extinct' : end > 900 ? 'thriving near K' : p.N0 < 200 ? 'collapsing' : 'recovering'}`; },
              },
              after: r`Starting at 190 the population slowly dies out; starting at 210 it slowly recovers. Near the threshold everything happens slowly, so a population just below it can look stable for years while it is in fact doomed.`,
            },
            {
              type: 'numeric',
              title: 'Growth at 600',
              prompt: r`With $r = 0.5$, $A = 200$ and $K = 1000$, how fast does a population of 600 grow, in animals per year?`,
              answer: 240,
              wrong: [{ v: 120, why: r`Check each factor: $0.5 \times 600 \times (3 - 1) \times (1 - 0.6)$.` }],
              explain: r`$0.5 \times 600 \times \left(\frac{600}{200} - 1\right)\left(1 - \frac{600}{1000}\right) = 0.5 \times 600 \times 2 \times 0.4 = 240$ per year.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How much can we take?',
              prompt: r`Now harvest $H$ animals every year. The population can only stay steady where the growth curve reaches up to the harvest line. Find the **largest whole-number harvest** that still leaves a steady, surviving population.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1050, ymin: -150, ymax: 330, grid: false, height: 270, axes: { xlabel: 'population N', ylabel: 'growth per year', xticks: 200, yticks: 100, xlabelBelow: 'edge' },
                params: { H: { min: 0, max: 330, step: 1, value: 100, label: 'harvest', color: 'coral', format: (v) => `${v} per year` } },
                curves: [{ f: (x) => allee(x), color: 'violet', width: 3 }, { f: (x, p) => p.H, color: 'coral', dash: true }],
                readout: (p) => { const roots = []; for (let n = 200; n < 1000; n += 0.5) if ((allee(n) - p.H) * (allee(n + 0.5) - p.H) <= 0) roots.push(n); return roots.length >= 2 ? `steady states at **${Math.round(roots[0])}** (tipping point) and **${Math.round(roots[roots.length - 1])}** (stable)` : roots.length === 1 ? 'just touching: one fragile steady state' : '**no steady state**: any population collapses'; },
                goal: (p) => p.H === 262,
                hint: 'Find the top of the growth curve.',
                solution: { H: 262 },
              },
              explain: r`The curve peaks at about **262** per year (at $N \approx 705$). A harvest above that has no steady state at all, and even below it the tipping point rises: at $H = 150$ it is about 443. Heavy harvesting doesn’t just shrink a population, it pushes its point of no return upward, so one bad year can now finish it.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The passenger pigeon',
              prompt: r`In 1870 there were still millions of passenger pigeons, which nested in vast colonies. Hunting reduced them, and within a few decades they were extinct, even though thousands remained when hunting slowed. Which explanation fits the Allee model?`,
              choices: [
                { t: 'They needed huge colonies to breed successfully, so their threshold A was very large', ok: true },
                { t: 'Thousands of birds is always too few to survive', why: 'Many species recover from a few thousand, or even a few dozen. It depends on the threshold.' },
                { t: 'The model says hunting can never cause extinction', why: 'On the contrary: once numbers fall below the threshold, extinction follows even without further hunting.' },
              ],
              explain: r`A species whose breeding depends on enormous colonies has a large $A$. Once numbers fell below it, the decline continued without further hunting. Conservation biologists now watch for such thresholds; the collapse of the northern cod has been linked to similar effects.`,
            },
          ],
          recap: [
            'The Allee effect: below a threshold A, per-capita growth turns negative.',
            'N = A is an unstable tipping point between recovery and extinction.',
            'Harvesting raises the tipping point; above the peak growth, no steady state survives.',
          ],
        },
        {
          id: 'metapop',
          title: 'Patches & Extinction',
          summary: 'Levins’ metapopulation model',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A population of populations',
              body: r`Many species live in scattered **patches** of habitat: ponds, meadows, woods. A local population can die out, and an empty patch can be recolonised from occupied ones. In 1969 Richard Levins modelled the fraction $p$ of patches occupied:
$$\frac{dp}{dt} = c\,p\,(1 - p) - e\,p$$
Colonisation needs both occupied patches (to send migrants) and empty ones (to receive them), giving $c\,p(1-p)$. Each occupied patch goes extinct at rate $e$.`,
            },
            {
              type: 'numeric',
              title: 'The balance',
              prompt: r`Setting $\frac{dp}{dt} = 0$ (with $p > 0$) gives $p^* = 1 - \frac{e}{c}$. With colonisation rate $c = 0.5$ and extinction rate $e = 0.1$ per year, what fraction of patches is occupied at equilibrium?`,
              answer: 0.8,
              tol: 0.001,
              wrong: [{ v: 0.2, why: r`That’s $\frac{e}{c}$. The occupied fraction is $1 - \frac{e}{c}$.` }],
              explain: r`$p^* = 1 - \frac{0.1}{0.5} = 0.8$. Even with patches winking out all the time, 80% stay occupied: extinctions are balanced by recolonisation.`,
            },
            { /*anim:populations*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Patches winking on and off',
              body: r`A hundred habitat patches with $c = 0.5$ and $e = 0.1$ per year, starting with just five occupied. Each occupied patch has a 10% chance a year of dying out; each empty one gets colonised at a rate set by how many patches are occupied. On the right, the {teal:fraction occupied} over 40 years.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.2, xmax: 22.4, ymin: -1.4, ymax: 10.3, grid: false, axes: false, maxWidth: 620,
                animate: { param: 't', speed: 4, max: 172, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const F = patchSim(), k = Math.min(160, Math.floor(p.t)), occ = F[k], w = plot.X(1) - plot.X(0) - 3, els = [];
                  occ.forEach((o, i) => els.push(s('rect', { x: plot.X(i % 10) + 1.5, y: plot.Y(((i / 10) | 0) + 1) + 1.5, width: w, height: w, rx: 3, class: o ? 'fl-teal' : 'fl-card', stroke: 'var(--line-2)' })));
                  // the chart: years 0 to 40 across x = 11.5 to 22, fraction 0 to 1 up y = 0 to 10
                  const cx = (yr) => plot.X(11.5 + (10.5 * yr) / 40), cy = (f) => plot.Y(10 * f);
                  els.push(s('line', { x1: cx(0), x2: cx(40), y1: cy(0), y2: cy(0), stroke: 'var(--axis)', 'stroke-width': 1.3 }));
                  els.push(s('line', { x1: cx(0), x2: cx(0), y1: cy(0), y2: cy(1), stroke: 'var(--axis)', 'stroke-width': 1.3 }));
                  els.push(s('line', { x1: cx(0), x2: cx(40), y1: cy(0.8), y2: cy(0.8), stroke: 'var(--ink-3)', 'stroke-width': 1.3, 'stroke-dasharray': '5 4' }));
                  els.push(s('text', { x: cx(0) - 6, y: cy(0.8) + 4, 'text-anchor': 'end', class: 'tick', text: '0.8' }));
                  els.push(s('text', { x: cx(0) - 6, y: cy(0) + 4, 'text-anchor': 'end', class: 'tick', text: '0' }));
                  els.push(s('text', { x: cx(40), y: cy(0) + 16, 'text-anchor': 'end', class: 'tick', text: '40 years' }));
                  const pts = [];
                  for (let j = 0; j <= k; j++) pts.push(`${j ? 'L' : 'M'}${cx(j / 4).toFixed(1)} ${cy(F[j].filter(Boolean).length / 100).toFixed(1)}`);
                  els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
                  return els;
                },
                readout: (p) => { const k = Math.min(160, Math.floor(p.t)); return `year ${fix(k / 4, 1)} · ${patchSim()[k].filter(Boolean).length} of 100 patches occupied`; },
              },
              after: r`No single patch is safe: every one keeps winking out and being recolonised. Yet the total climbs and then hovers around the balance $p^* = 0.8$, jiggling a little because the patches are few. The species persists as a **network**, not in any one place, which is why cutting the links between patches can doom it.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Destroying habitat',
              prompt: r`Now destroy a fraction $D$ of the patches permanently. Colonisation can only reach the surviving ones, so $\frac{dp}{dt} = c\,p\,(1 - D - p) - e\,p$ and $p^* = 1 - D - \frac{e}{c}$. Grey squares are destroyed, green ones occupied at equilibrium. Find the **smallest** destruction that drives the species extinct.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 10, grid: false, axes: false, maxWidth: 320, pad: 6,
                params: { D: { min: 0, max: 1, step: 0.01, value: 0.3, label: 'habitat destroyed', color: 'ink', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => { const nd = Math.round(p.D * 100), ps = Math.max(0, 1 - p.D - 0.2), no = Math.round(ps * 100), w = plot.X(1) - plot.X(0) - 3; return PATCH_ORDER.map((k, i) => s('rect', { x: plot.X(k % 10) + 1.5, y: plot.Y(((k / 10) | 0) + 1) + 1.5, width: w, height: w, rx: 3, class: i < nd ? 'fl-muted' : i < nd + no ? 'fl-teal' : 'fl-card', stroke: 'var(--line-2)', opacity: i < nd ? 0.5 : 1 })); },
                readout: (p) => { const ps = Math.max(0, 1 - p.D - 0.2); return `habitat left **${Math.round((1 - p.D) * 100)}%** · occupied at equilibrium **${Math.round(ps * 100)}%** of all patches${ps <= 0 ? ' · **extinct**' : ''}`; },
                goal: (p) => Math.abs(p.D - 0.8) < 0.005,
                hint: r`Extinction comes when $1 - D - \frac{e}{c}$ reaches 0, with $\frac{e}{c} = 0.2$.`,
                solution: { D: 0.8 },
              },
              explain: r`At $D = 0.8$ the species vanishes, although **20% of its habitat is still intact**. Each destroyed patch removes the occupants and also a target for colonisation, so the balance tips to extinction before the habitat runs out. Every 1% of habitat lost cuts occupied patches by a full 1% of the total.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Extinction debt',
              body: r`Start at the undisturbed balance ($p = 0.8$), then destroy a random fraction $D$ of the patches at year 0 (taking their occupants with them) and watch the occupied fraction respond.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: 0, ymax: 0.9, grid: false, height: 260, axes: { xlabel: 'years after destruction', ylabel: 'fraction of patches occupied', xticks: 20, yticks: 0.2 },
                params: { D: { min: 0, max: 0.95, step: 0.01, value: 0.75, label: 'habitat destroyed', color: 'coral', format: (v) => `${Math.round(v * 100)}%` } },
                curves: [{ f: (x, p) => Math.max(0, 0.8 - p.D), color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const run = levinsRun(p.D, 0.5, 0.1, 0.8 * (1 - p.D)); return [s('path', { d: run.filter((_, i) => i % 4 === 0).map(([t, v], i) => `${i ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 })]; },
                readout: (p) => { const run = levinsRun(p.D, 0.5, 0.1, 0.8 * (1 - p.D)); return `occupied after 10 years: **${(100 * run[200][1]).toFixed(0)}%** · after 100 years: **${(100 * run[run.length - 1][1]).toFixed(1)}%** · eventual: ${(100 * Math.max(0, 0.8 - p.D)).toFixed(0)}%`; },
              },
              after: r`Past the threshold the decline can be slow: with 82% destroyed, about 8% of patches are still occupied after 10 years and the species lingers for a century, yet its fate is sealed. Ecologists call this an **extinction debt**: species that are still around today may already be committed to vanishing because of habitat lost decades ago.`,
            },
            {
              type: 'mcq',
              title: 'Reading the debt',
              prompt: r`A forest was heavily fragmented 40 years ago, but surveys today still find most of its original bird species. What does the metapopulation model suggest?`,
              choices: [
                { t: 'Some of them may still be heading for extinction; the full loss can take many decades to appear', ok: true },
                { t: 'The fragmentation evidently did no harm', why: 'Near the threshold the decline is very slow. Presence today doesn’t guarantee persistence.' },
                { t: 'The species must have adapted', why: 'Possible, but the model shows slow decline is expected even without adaptation.' },
              ],
              explain: r`The model shows that the effects of habitat loss can lag far behind the loss itself. Restoring habitat while species are still present can “repay” the debt before it falls due.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Half a landscape',
              prompt: r`A species has $c = 0.4$ and $e = 0.1$ per year. Half its habitat patches are destroyed ($D = 0.5$). At the new equilibrium, what percentage of the **surviving** patches is occupied?`,
              unit: '%',
              answer: 50,
              tol: 0.5,
              wrong: [{ v: 25, why: r`That’s the fraction of **all** patches: $1 - 0.5 - 0.25 = 0.25$. Divide by the surviving half.` }, { v: 75, why: r`That’s the undisturbed level, $1 - \frac{e}{c}$.` }],
              explain: r`$p^* = 1 - 0.5 - \frac{0.1}{0.4} = 0.25$ of all patches, which is $0.25 / 0.5 = $ **50%** of the surviving ones, down from 75% before. Losing half the habitat costs far more than half the population: occupancy of all patches falls from 0.75 to 0.25.`,
            },
          ],
          recap: [
            r`Levins’ model: $\frac{dp}{dt} = c\,p(1 - D - p) - e\,p$, so $p^* = 1 - D - \frac{e}{c}$.`,
            'A species can go extinct while some of its habitat remains.',
            'Near the threshold, decline is slow: an extinction debt.',
          ],
        },
      ],
    },
  ],
};
