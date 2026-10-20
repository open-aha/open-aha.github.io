import { fix, sig } from '../lib/svg.js';
import { sup } from '../lib/chem.js';
import { r, FS } from './_chem.js';

// 10 to a power, for log-scale axes
const pow10 = (v) => `10${sup(String(Math.round(v)))}`;

// ---------- two tanks joined by pipes (A ⇌ B) ----------
const tankB = (t, kf, kb) => (kf / (kf + kb)) * (1 - Math.exp(-(kf + kb) * t));
function tanks({ kf = 0.3, kb = 0.3, sliders = true, goal, solution } = {}) {
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 260,
    params: {
      kf: { min: 0.1, max: 0.9, step: 0.05, value: kf, label: 'A → B pipe', color: 'blue', slider: sliders },
      kb: { min: 0.1, max: 0.9, step: 0.05, value: kb, label: 'B → A pipe', color: 'coral', slider: sliders },
    },
    animate: { param: 't', speed: 1.4, max: 14, loop: false, autoplay: true },
    extra: ({ plot, p, s }) => {
      const b = tankB(p.t, p.kf, p.kb), a = 1 - b;
      const out = [];
      const tank = (x0, lvl, col, name) => {
        const top = plot.Y(5.2), bot = plot.Y(0.8), h = bot - top;
        out.push(s('rect', { x: plot.X(x0), y: bot - h * lvl, width: plot.X(x0 + 3) - plot.X(x0), height: h * lvl, fill: col, 'fill-opacity': 0.35 }));
        out.push(s('path', { d: `M${plot.X(x0)} ${top}V${bot}H${plot.X(x0 + 3)}V${top}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
        out.push(s('text', { x: plot.X(x0 + 1.5), y: plot.Y(0.25), 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: `${name}: ${fix(lvl * 100, 0)}%` }));
      };
      tank(0.8, a, 'var(--blue)', 'A');
      tank(6.2, b, 'var(--coral)', 'B');
      const fA = p.kf * a, fB = p.kb * b, w = (f) => 2 + 14 * f;
      out.push(s('line', { x1: plot.X(3.9), x2: plot.X(6.0), y1: plot.Y(1.6), y2: plot.Y(1.6), stroke: 'var(--blue)', 'stroke-width': w(fA), 'marker-end': 'url(#arrow-blue)' }));
      out.push(s('line', { x1: plot.X(6.0), x2: plot.X(3.9), y1: plot.Y(2.6), y2: plot.Y(2.6), stroke: 'var(--coral)', 'stroke-width': w(fB), 'marker-end': 'url(#arrow-coral)' }));
      return out;
    },
    readout: (p) => {
      const b = tankB(p.t, p.kf, p.kb), a = 1 - b;
      return `flow A→B ${fix(p.kf * a, 3)} · flow B→A ${fix(p.kb * b, 3)} · ratio B/A ${fix(b / Math.max(a, 1e-9), 2)}`;
    },
    goal, solution,
  };
}

// ---------- H2 + I2 ⇌ 2HI, K = 50 ----------
const KHI = 50;
const qHI = (h, i, hi) => (hi * hi) / Math.max(h * i, 1e-12);

// ---------- cobalt chloride: pink Co(H2O)6 2+ ⇌ blue CoCl4 2− (endothermic) ----------
const blueFrac = (Tc, cl) => { const k = 9.77e-4 * Math.exp(-6014 * (1 / (Tc + 273.15) - 1 / 293.15)); const x = k * cl ** 4; return x / (1 + x); };
function cobalt({ T0 = 20, cl0 = 4, fixT = false, fixCl = false, goal, solution } = {}) {
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 240,
    params: {
      T: { min: 0, max: 100, step: 5, value: T0, label: 'Temperature', color: 'coral', format: (v) => `${v} °C`, slider: !fixT },
      cl: { min: 1, max: 8, step: 0.5, value: cl0, label: 'Chloride', color: 'teal', format: (v) => `${fix(v, 1)} M`, slider: !fixCl },
    },
    extra: ({ plot, p, s }) => {
      const f = blueFrac(p.T, p.cl);
      const col = `color-mix(in srgb, #2f5bd3 ${fix(f * 100, 0)}%, #e98bb6)`;
      const x0 = plot.X(4.2), x1 = plot.X(5.8), top = plot.Y(4.7), bot = plot.Y(0.5);
      return [
        s('path', { d: `M${x0} ${top}V${bot - 30}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 30}V${top}`, style: `fill:${col}`, stroke: 'none' }),
        s('rect', { x: x0 - 1, y: top - 14, width: x1 - x0 + 2, height: plot.Y(3.9) - top + 14, fill: 'var(--surface)' }),
        s('path', { d: `M${x0} ${top - 14}V${bot - 30}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 30}V${top - 14}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }),
        s('text', { x: plot.X(2), y: plot.Y(2.5), 'text-anchor': 'middle', class: 'lbl', style: `fill:#c2577f;${FS(15)}`, text: 'pink Co(H₂O)₆²⁺' }),
        s('text', { x: plot.X(8), y: plot.Y(2.5), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--blue);${FS(15)}`, text: 'blue CoCl₄²⁻' }),
      ];
    },
    readout: (p) => `${fix(blueFrac(p.T, p.cl) * 100, 0)}% of the cobalt is in the blue form`,
    goal, solution,
  };
}

// ---------- ammonia: N2 + 3H2 ⇌ 2NH3 (a model fitted to classic yield tables) ----------
function nh3Yield(Tc, P) {
  const k = Math.exp(106000 / (8.314 * (Tc + 273.15)) - 229 / 8.314);
  let lo = 0, hi = 0.999999;
  for (let i = 0; i < 60; i++) {
    const x = (lo + hi) / 2, n = 4 - 2 * x;
    const q = (2 * x / n) ** 2 / (((1 - x) / n) * ((3 * (1 - x)) / n) ** 3 * P * P);
    if (q < k) lo = x; else hi = x;
  }
  const x = (lo + hi) / 2;
  return (2 * x) / (4 - 2 * x);
}
const speed = (Tc) => 1 - Math.exp(-Math.exp((Tc - 400) / 40));

// ---------- solubility ----------
const KSP_AGCL = 1.8e-10;

// ---------- mystery ions ----------
const TESTS = ['nothing yet', 'chloride', 'sulfate', 'hydroxide'];
const RESULT = {
  'Ag+': [null, ['white', '#f2f2f2'], null, ['brown', '#7b5a3c']],
  'Ba 2+': [null, null, ['white', '#f2f2f2'], null],
  'Cu 2+': [null, null, null, ['pale blue', '#6fa8dc']],
  'Fe 3+': [null, null, null, ['rusty brown', '#a0522d']],
  'Pb 2+': [null, ['white', '#f2f2f2'], ['white', '#f2f2f2'], ['white', '#f2f2f2']],
};
const TINT = { 'Cu 2+': '#9cc3e6', 'Fe 3+': '#e8c27a' };
function mystery(ion) {
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 230,
    params: { r: { min: 0, max: 3, step: 1, value: 0, label: 'Add', format: (v) => TESTS[v] } },
    extra: ({ plot, p, s }) => {
      const res = RESULT[ion][p.r], liquid = TINT[ion] || '#dfe9f3';
      const x0 = plot.X(4.3), x1 = plot.X(5.7), top = plot.Y(4.6), bot = plot.Y(0.5), mid = plot.Y(2.6);
      const out = [s('path', { d: `M${x0} ${mid}V${bot - 26}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 26}V${mid}Z`, style: `fill:${liquid}`, 'fill-opacity': 0.8 })];
      if (res) {
        for (let k = 0; k < 26; k++) out.push(s('circle', { cx: x0 + 8 + ((k * 37) % 100) / 100 * (x1 - x0 - 16), cy: bot - 10 - ((k * 53) % 100) / 100 * 40, r: 4.5, style: `fill:${res[1]}`, stroke: 'var(--ink-3)', 'stroke-width': 0.8 }));
      }
      out.push(s('path', { d: `M${x0} ${top}V${bot - 26}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 26}V${top}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
      return out;
    },
    readout: (p) => (p.r === 0 ? 'A clear solution containing one unknown metal ion.' : RESULT[ion][p.r] ? `adding ${TESTS[p.r]}: a **${RESULT[ion][p.r][0]} precipitate** forms` : `adding ${TESTS[p.r]}: **no change**`),
    ready: true,
  };
}

// ---------- A ⇌ B with K = 2: add A, later remove B, and watch the mixture recover ----------
// each disturbance resets the start of an exponential approach (rate kf + kb) to the new equilibrium
const LC_EVENTS = [[0, 1, 2], [2.5, 2.5, 2], [10, 1.5, 1]]; // [time, A just after, B just after]
const lcConc = (t) => {
  let ev = LC_EVENTS[0];
  for (const e of LC_EVENTS) if (t >= e[0]) ev = e;
  const [t0, a0, b0] = ev, tot = a0 + b0, aeq = tot / 3, f = Math.exp(-0.75 * (t - t0));
  const a = aeq + (a0 - aeq) * f;
  return [a, tot - a];
};

export default {
  id: 'equilibrium',
  subject: 'physics',
  title: 'Chemical Equilibrium',
  level: 'Intermediate',
  cover: 'equilibrium',
  tagline: 'Reactions that run both ways: K and Q, ICE tables, Le Chatelier, ammonia and precipitates.',
  description: r`Many reactions never finish: they settle into a balance where the forward and backward reactions run at the same speed. Watch two tanks level out, write and use equilibrium constants, predict which way a mixture will move, and solve for the balance point by dragging along a curve. Then push equilibria around with heat and concentration, run an ammonia plant against the clock, and use solubility to identify mystery ions by the precipitates they form.`,
  prereq: 'Chemical Reactions',
  chapters: [
    {
      title: 'The Balance Point',
      summary: 'K, Q and solving for equilibrium.',
      lessons: [
        {
          id: 'dynamic',
          title: 'Two-Way Traffic',
          summary: 'Equilibrium is busy, not still',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Two tanks',
              body: r`Picture a reaction $\mathrm{A \rightleftharpoons B}$ as two tanks joined by two pipes. Water flows from A to B at a rate proportional to A's level, and back from B to A at a rate proportional to B's level. The arrows show the two flows.`,
              widget: tanks({ kf: 0.4, kb: 0.2 }),
              after: r`The levels stop changing when the two flows are equal, but water keeps moving both ways. That is **dynamic equilibrium**: at the molecular level reactions never stop, they just balance.`,
            },
            {
              type: 'mcq',
              title: 'At equilibrium',
              prompt: 'Once a reaction mixture has reached equilibrium, what is true?',
              choices: [
                { t: 'Forward and reverse reactions continue at equal rates', ok: true },
                { t: 'Both reactions have stopped', why: 'Molecules keep reacting both ways; only the overall amounts stop changing.' },
                { t: 'There are equal amounts of reactants and products', why: 'The amounts can be very unequal. It’s the rates that are equal.' },
              ],
              explain: r`Equal rates, not equal amounts. Tracer experiments with radioactive atoms show molecules continually swapping between reactant and product, even when nothing seems to happen.`,
            },
            {
              type: 'interactive',
              title: 'Set the balance',
              prompt: r`Choose the two pipe sizes so that, at equilibrium, tank B ends up holding three times as much as tank A.`,
              widget: tanks({ kf: 0.3, kb: 0.3, goal: (p) => (Math.abs(p.kf / p.kb - 3) < 0.01 ? true : { ok: false, msg: `At equilibrium B/A equals the ratio of the pipes: right now ${fix(p.kf / p.kb, 2)}.` }), solution: { kf: 0.6, kb: 0.2 } }),
              explain: r`At balance $k_f[\mathrm A] = k_b[\mathrm B]$, so $[\mathrm B]/[\mathrm A] = k_f / k_b$. Any pair with $k_f = 3k_b$ works (0.3 and 0.1, 0.6 and 0.2, 0.9 and 0.3). The ratio of the rate constants is the **equilibrium constant**, $K = 3$.`,
            },
            {
              type: 'numeric',
              title: 'Rates to K',
              prompt: r`For $\mathrm{A \rightleftharpoons B}$ the forward rate constant is 0.50 per second and the reverse is 0.10 per second. What is $K = [\mathrm B]/[\mathrm A]$ at equilibrium?`,
              answer: 5,
              tol: 0.01,
              wrong: [{ v: 0.2, why: 'That’s A over B. K puts products on top.' }],
              explain: r`$K = 0.50 / 0.10 = 5$: at equilibrium there is five times as much B as A, so $\tfrac56$ of the material is B.`,
            },
            {
              type: 'mcq',
              title: 'Starting from the other side',
              prompt: 'If you start with tank B full and A empty (same pipes), where do the levels end up?',
              choices: [
                { t: 'At exactly the same levels as before', ok: true },
                { t: 'With more in B, since it started there', why: 'The final balance depends only on the pipes, not where you start.' },
                { t: 'With equal levels', why: 'Only if the two pipes were the same size.' },
              ],
              explain: r`Equilibrium can be approached from either side and always reaches the same composition (for the same total amount and temperature). That is a test chemists use to show a mixture really is at equilibrium.`,
            },
          ],
          recap: [
            'Dynamic equilibrium: forward and reverse rates equal, both still running.',
            'For A ⇌ B, K = [B]/[A] = k_forward / k_reverse.',
          ],
        },
        {
          id: 'k',
          title: 'The Equilibrium Constant',
          summary: 'Writing and reading K',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Products over reactants',
              body: r`For a general reaction $a\mathrm{A} + b\mathrm{B} \rightleftharpoons c\mathrm{C} + d\mathrm{D}$, the concentrations at equilibrium always satisfy
$$K = \frac{[\mathrm C]^c\,[\mathrm D]^d}{[\mathrm A]^a\,[\mathrm B]^b}$$
the **law of mass action** (Guldberg and Waage, 1864). Coefficients become powers; products go on top. $K$ depends only on the temperature.

Pure solids and pure liquids are left out: their "concentration" can't change, so it is folded into $K$.`,
            },
            {
              type: 'mcq',
              title: 'Write it',
              prompt: r`Which is the equilibrium constant for $\mathrm{N_2 + 3H_2 \rightleftharpoons 2NH_3}$?`,
              choices: [
                { t: r`$K = \dfrac{[\mathrm{NH_3}]^2}{[\mathrm{N_2}][\mathrm{H_2}]^3}$`, ok: true },
                { t: r`$K = \dfrac{2[\mathrm{NH_3}]}{[\mathrm{N_2}] \cdot 3[\mathrm{H_2}]}$`, why: 'Coefficients become powers, not multipliers.' },
                { t: r`$K = \dfrac{[\mathrm{N_2}][\mathrm{H_2}]^3}{[\mathrm{NH_3}]^2}$`, why: 'That’s upside down: products go on top.' },
              ],
              explain: r`Ammonia, the product, on top, squared because two molecules form; nitrogen and hydrogen below, with hydrogen cubed.`,
            },
            {
              type: 'numeric',
              title: 'From measurements',
              prompt: r`At equilibrium in $\mathrm{N_2O_4 \rightleftharpoons 2NO_2}$, a flask contains $[\mathrm{N_2O_4}] = 0.0244$ M and $[\mathrm{NO_2}] = 0.0120$ M. Calculate $K$.`,
              answer: 0.0059,
              relTol: 0.02,
              wrong: [{ v: 0.492, why: r`Square the $\mathrm{NO_2}$ concentration: $0.0120^2 / 0.0244$.` }],
              explain: r`$K = 0.0120^2 / 0.0244 = 0.000144 / 0.0244 \approx 0.0059$.`,
            },
            {
              type: 'explain',
              title: 'What the size of K tells you',
              body: r`For a simple $\mathrm{A \rightleftharpoons B}$, the fraction that ends up as B is $K/(1+K)$. Slide $K$ across twelve powers of ten:`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 6, ymin: 0, ymax: 1, height: 280, grid: false,
                axes: { xticks: 2, yticks: 0.25, xlabel: 'K', ylabel: 'fraction as product', yAt: 0, xAt: -6, xfmt: pow10, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { lk: { min: -6, max: 6, step: 0.5, value: 0, label: 'K', format: (v) => sig(10 ** v, 2, true) } },
                curves: [{ f: (x) => 10 ** x / (1 + 10 ** x), color: 'violet' }],
                points: [{ x: (p) => p.lk, y: (p) => 10 ** p.lk / (1 + 10 ** p.lk), color: 'coral' }],
                readout: (p) => `K = ${sig(10 ** p.lk, 2, true)}: **${fix((100 * 10 ** p.lk) / (1 + 10 ** p.lk), 2)}%** products`,
              },
              after: r`$K \gg 1$: practically all products, the reaction "goes to completion". $K \ll 1$: hardly any reaction. Only when $K$ is between about 0.01 and 100 are there sizeable amounts of both.`,
            },
            {
              type: 'mcq',
              title: 'Solids drop out',
              prompt: r`What is $K$ for $\mathrm{CaCO_3(s) \rightleftharpoons CaO(s) + CO_2(g)}$?`,
              choices: [
                { t: r`$K = [\mathrm{CO_2}]$`, ok: true },
                { t: r`$K = \dfrac{[\mathrm{CaO}][\mathrm{CO_2}]}{[\mathrm{CaCO_3}]}$`, why: 'Pure solids are left out of K.' },
                { t: r`$K = \dfrac{1}{[\mathrm{CO_2}]}$`, why: 'CO₂ is a product, so it goes on top.' },
              ],
              explain: r`Only the gas counts. So at a given temperature there is one particular pressure of $\mathrm{CO_2}$ above heated limestone, however much solid is present.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Turn it around',
              prompt: r`$\mathrm{N_2O_4 \rightleftharpoons 2NO_2}$ has $K = 0.0059$. What is $K$ for the reverse reaction, $\mathrm{2NO_2 \rightleftharpoons N_2O_4}$? (Nearest whole number.)`,
              answer: 169,
              tol: 2,
              wrong: [{ v: -0.0059, why: 'K values are never negative. Reversing takes the reciprocal.' }],
              explain: r`Reversing the reaction flips the fraction: $K' = 1/K = 1/0.0059 \approx 169$.`,
            },
          ],
          recap: [
            'K = products^coefficients ÷ reactants^coefficients; leave out solids and pure liquids.',
            'Big K → mostly products; small K → mostly reactants.',
            'Reverse reaction: K becomes 1/K.',
          ],
        },
        {
          id: 'q',
          title: 'Which Way Will It Go?',
          summary: 'The reaction quotient',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Q: the same fraction, any time',
              body: r`The **reaction quotient** $Q$ has the same form as $K$ but uses the concentrations right now, at any moment. Comparing it with $K$ says which way the reaction will move:
- $Q < K$: too few products; the reaction goes **forwards**.
- $Q > K$: too many products; it goes **backwards**.
- $Q = K$: already at equilibrium.`,
            },
            {
              type: 'interactive',
              title: 'Already balanced',
              prompt: r`For $\mathrm{H_2 + I_2 \rightleftharpoons 2HI}$, $K = 50$ at 450 °C. Choose a mixture that is **already at equilibrium** ($Q$ within 2% of $K$).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: 0, ymax: 1.6, grid: false, height: 260, padB: 50,
                axes: { xticks: 0, yticks: 0.4, ylabel: 'concentration (M)', yAt: 0 }, stackSliders: true,
                params: {
                  h: { min: 0.05, max: 1, step: 0.05, value: 0.2, label: 'H₂', color: 'blue', format: (v) => `${fix(v, 2)} M` },
                  i: { min: 0.05, max: 1, step: 0.05, value: 0.2, label: 'I₂', color: 'violet', format: (v) => `${fix(v, 2)} M` },
                  hi: { min: 0, max: 1.6, step: 0.01, value: 0.4, label: 'HI', color: 'coral', format: (v) => `${fix(v, 2)} M` },
                },
                under: ({ plot, p, s }) => [['h', 'blue'], ['i', 'violet'], ['hi', 'coral']].map(([k, c], j) => s('rect', { x: plot.X(j + 0.25), y: plot.Y(p[k]), width: plot.X(0.5) - plot.X(0), height: plot.Y(0) - plot.Y(p[k]), rx: 5, class: `fl-${c}` })),
                extra: ({ plot, s }) => ['H₂', 'I₂', 'HI'].map((t, j) => s('text', { x: plot.X(j + 0.5), y: plot.bottom + 22, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: t })),
                readout: (p) => { const q = qHI(p.h, p.i, p.hi); return `Q = ${sig(q, 3)} · ${Math.abs(q / KHI - 1) <= 0.02 ? 'at equilibrium ✓' : q < KHI ? 'Q < K: will go forwards →' : 'Q > K: will go backwards ←'}`; },
                goal: (p) => (Math.abs(qHI(p.h, p.i, p.hi) / KHI - 1) <= 0.02 ? true : { ok: false, msg: 'Q isn’t 50 yet. Try equal H₂ and I₂ and adjust HI.' }),
                solution: { h: 0.2, i: 0.2, hi: 1.41 },
              },
              explain: r`With $[\mathrm{H_2}] = [\mathrm{I_2}] = 0.2$ M, $Q = [\mathrm{HI}]^2 / 0.04 = 50$ needs $[\mathrm{HI}] = \sqrt{2} \approx 1.41$ M. There are endless equilibrium mixtures; all of them share the same $K$.`,
            },
            {
              type: 'mcq',
              title: 'Predict the direction',
              prompt: r`A flask has $[\mathrm{H_2}] = [\mathrm{I_2}] = 0.10$ M and $[\mathrm{HI}] = 1.0$ M at 450 °C ($K = 50$). Which way does it go?`,
              choices: [
                { t: 'Backwards: some HI breaks up', ok: true },
                { t: 'Forwards: more HI forms', why: r`$Q = 1.0^2 / (0.10 \times 0.10) = 100$, bigger than $K$.` },
                { t: 'Nowhere: it’s at equilibrium', why: 'Calculate Q and compare it with 50.' },
              ],
              explain: r`$Q = 100 > K = 50$: there is too much HI, so some of it splits back into $\mathrm{H_2}$ and $\mathrm{I_2}$ until $Q$ falls to 50.`,
            },
            {
              type: 'numeric',
              title: 'Compute Q',
              prompt: r`For $\mathrm{N_2O_4 \rightleftharpoons 2NO_2}$ ($K = 0.0059$), a flask has 0.050 M $\mathrm{N_2O_4}$ and 0.030 M $\mathrm{NO_2}$. What is $Q$?`,
              answer: 0.018,
              relTol: 0.02,
              explain: r`$Q = 0.030^2 / 0.050 = 0.018$, three times $K$, so this mixture will turn some $\mathrm{NO_2}$ (brown) into $\mathrm{N_2O_4}$ (colourless) and get paler.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Empty flask',
              prompt: r`You put only HI into an empty flask at 450 °C. What is $Q$ at the start, and what happens?`,
              choices: [
                { t: 'Q is infinite (no H₂ or I₂ on the bottom), so HI decomposes until Q = 50', ok: true },
                { t: 'Q is zero, so more HI forms', why: 'HI is on top of the fraction; with zero H₂ and I₂ the bottom is zero.' },
                { t: 'Nothing happens: there are no reactants', why: 'The reverse reaction runs: HI is the "reactant" of the backwards direction.' },
              ],
              explain: r`With nothing below the line, $Q$ is effectively infinite and the reaction runs backwards. Every equilibrium can be reached from either side.`,
            },
          ],
          recap: [
            'Q has K’s form with current concentrations.',
            'Q < K → forwards; Q > K → backwards; Q = K → equilibrium.',
          ],
        },
        {
          id: 'ice',
          title: 'Solving for Equilibrium',
          summary: 'ICE tables and a curve to drag',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Initial, Change, Equilibrium',
              body: r`To find the equilibrium mixture, track an unknown amount $x$ that reacts. For $\mathrm{H_2 + I_2 \rightleftharpoons 2HI}$ starting with 1.0 M each of $\mathrm{H_2}$ and $\mathrm{I_2}$:

| | $\mathrm{H_2}$ | $\mathrm{I_2}$ | $\mathrm{HI}$ |
|---|---|---|---|
| Initial | 1.0 | 1.0 | 0 |
| Change | $-x$ | $-x$ | $+2x$ |
| Equilibrium | $1.0 - x$ | $1.0 - x$ | $2x$ |

Then put the bottom row into $K$: $\dfrac{(2x)^2}{(1-x)^2} = 50$, and solve for $x$.`,
            },
            {
              type: 'interactive',
              title: 'Find x by dragging',
              prompt: r`The violet curve is $Q$ as a function of $x$. Drag the point along it until $Q = K = 50$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 100, height: 320, grid: false,
                axes: { xticks: 0.2, yticks: 25, xlabel: 'x (M reacted)', ylabel: 'Q', yAt: 0, xAt: 0 },
                params: { x: { min: 0, max: 0.95, step: 0.005, value: 0.3, slider: false } },
                curves: [{ f: (x) => (2 * x) ** 2 / (1 - x) ** 2, color: 'violet', to: 0.92 }, { f: () => 50, color: 'muted', dash: true }],
                points: [{ x: (p) => p.x, y: (p) => (2 * p.x) ** 2 / (1 - p.x) ** 2, color: 'coral', drag: { fn: (x) => ({ x }) }, ariaLabel: 'x' }],
                readout: (p) => `x = ${fix(p.x, 3)} M · Q = ${fix(Math.min(9999, (2 * p.x) ** 2 / (1 - p.x) ** 2), 1)}`,
                goal: (p) => (Math.abs(p.x - 0.78) <= 0.006 ? true : { ok: false, msg: (2 * p.x) ** 2 / (1 - p.x) ** 2 < 50 ? 'Q is still below 50: more must react.' : 'Q is above 50: less reacts than that.' }),
                solution: { x: 0.78 },
              },
              explain: r`Taking square roots: $2x/(1-x) = \sqrt{50} = 7.07$, so $x = 7.07/9.07 \approx 0.78$ M. Dragging along the curve is exactly what a computer does to solve harder equilibria: search for the $x$ where $Q = K$.`,
            },
            {
              type: 'numeric',
              title: 'How much HI?',
              prompt: r`Using $x = 0.78$ M, what is the equilibrium concentration of HI?`,
              unit: 'M',
              answer: 1.56,
              tol: 0.01,
              wrong: [{ v: 0.78, why: r`Two HI form for each $\mathrm{H_2}$ used: $2x$.` }, { v: 0.22, why: r`That's what's left of the $\mathrm{H_2}$ ($1 - x$).` }],
              explain: r`$[\mathrm{HI}] = 2x = 1.56$ M, with 0.22 M each of $\mathrm{H_2}$ and $\mathrm{I_2}$ left. Check: $1.56^2 / 0.22^2 \approx 50$ ✓.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A smaller K',
              prompt: r`0.100 M $\mathrm{N_2O_4}$ is sealed in a flask ($K = 0.0059$). With $[\mathrm{NO_2}] = 2x$ and $[\mathrm{N_2O_4}] = 0.100 - x$, solve $4x^2/(0.100 - x) = 0.0059$. What is $[\mathrm{NO_2}]$ at equilibrium? (M, three decimal places.)`,
              unit: 'M',
              answer: 0.0229,
              relTol: 0.03,
              wrong: [{ v: 0.0114, why: r`That is $x$; the concentration of $\mathrm{NO_2}$ is $2x$.` }],
              explain: r`The quadratic $4x^2 + 0.0059x - 0.00059 = 0$ gives $x \approx 0.0114$, so $[\mathrm{NO_2}] = 2x \approx 0.023$ M: only about 11% of the $\mathrm{N_2O_4}$ has split.`,
            },
          ],
          recap: [
            'ICE: Initial, Change (in terms of x), Equilibrium.',
            'Substitute into K and solve for x (by algebra, or by searching for Q = K).',
          ],
        },
      ],
    },
    {
      title: 'Shifting the Balance',
      summary: 'Le Chatelier and the ammonia plant.',
      lessons: [
        {
          id: 'lechatelier',
          title: 'Le Chatelier’s Principle',
          summary: 'Push it and it pushes back',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Push and push back',
              body: r`Henri Le Chatelier (1884): when you disturb a system at equilibrium, it shifts in the direction that partly undoes the disturbance.

Cobalt chloride shows it in colour. In water, cobalt is pink $\mathrm{Co(H_2O)_6^{2+}}$; with lots of chloride it becomes blue $\mathrm{CoCl_4^{2-}}$:
$$\mathrm{Co(H_2O)_6^{2+} + 4Cl^- \rightleftharpoons CoCl_4^{2-} + 6H_2O} \qquad \Delta H > 0$$
Try changing the temperature and the chloride concentration.`,
              widget: cobalt({}),
            },
            { /*chemanim:equilibrium.lechatelier*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Disturb it twice',
              body: r`A simple equilibrium $\mathrm{A \rightleftharpoons B}$ with $K = [\mathrm B]/[\mathrm A] = 2$. First a dose of extra A is poured in; later some B is taken out. Follow the two concentrations, and the ratio $Q = [\mathrm B]/[\mathrm A]$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 17, ymin: 0, ymax: 3.6, grid: false, height: 290,
                axes: { xticks: 0, yticks: 1, ylabel: 'concentration', xlabel: 'time' },
                animate: { param: 't', speed: 1.4, max: 17, loop: false },
                extra: ({ plot, p, s }) => {
                  const out = [], tEnd = Math.min(p.t, 17);
                  for (const [idx, col, name] of [[0, 'var(--blue)', 'A'], [1, 'var(--coral)', 'B']]) {
                    let d = '';
                    for (let t = 0; t <= tEnd + 1e-9; t += 0.05) d += `${d ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(lcConc(t)[idx]).toFixed(1)}`;
                    out.push(s('path', { d, fill: 'none', stroke: col, 'stroke-width': 3 }));
                    out.push(s('text', { x: plot.X(0.8), y: plot.Y(idx ? 2.25 : 0.65), class: 'lbl halo-text', style: `fill:${col};${FS(14)}`, text: `[${name}]` }));
                  }
                  for (const [t0, txt] of [[2.5, 'add A'], [10, 'remove B']]) {
                    if (p.t < t0) continue;
                    out.push(s('line', { x1: plot.X(t0), x2: plot.X(t0), y1: plot.Y(0), y2: plot.Y(3.4), stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
                    out.push(s('text', { x: plot.X(t0) + 5, y: plot.Y(3.35), class: 'lbl halo-text', style: `fill:var(--ink-2);${FS(12)}`, text: txt }));
                  }
                  return out;
                },
                readout: (p) => {
                  const [a, b] = lcConc(Math.min(p.t, 17)), q = b / a;
                  return `Q = [B]/[A] = ${fix(q, 2)} · K = 2.00 · ${Math.abs(q - 2) < 0.02 ? 'at equilibrium' : q < 2 ? 'Q < K: shifting towards B' : 'Q > K: shifting towards A'}`;
                },
              },
              after: r`Adding A drops $Q$ below $K$, so some A turns into B until the ratio is back to 2: the extra A is **partly** used up, not completely. Removing B also drops $Q$, and again the mixture shifts towards B to replace part of what was taken. In both cases the system ends at a **new** mixture with the **same** $K$. That is Le Chatelier's principle, seen as a ratio finding its way home.`,
            },
            {
              type: 'interactive',
              title: 'Blue without more salt',
              prompt: r`Keeping the chloride fixed, turn the solution clearly blue (at least 80% blue form).`,
              widget: cobalt({ fixCl: true, goal: (p) => (blueFrac(p.T, 4) >= 0.8 ? true : { ok: false, msg: 'Not blue enough yet.' }), solution: { T: 80 } }),
              explain: r`The forward reaction is **endothermic**, so adding heat pushes it forwards, using up some of the added heat. Cool it and it turns pink again. Old "weather flowers" used this: blue when dry and warm, pink when damp.`,
            },
            {
              type: 'interactive',
              title: 'Blue at room temperature',
              prompt: r`Now keep the temperature at 20 °C and turn the solution at least 70% blue.`,
              widget: cobalt({ fixT: true, cl0: 2, goal: (p) => (blueFrac(20, p.cl) >= 0.7 ? true : { ok: false, msg: 'Add more chloride.' }), solution: { cl: 7.5 } }),
              explain: r`Adding chloride, a reactant, pushes the equilibrium forwards to use some of it up. Because chloride appears to the fourth power in $K$, a small increase in concentration makes a big difference.`,
            },
            {
              type: 'mcq',
              title: 'What changes K?',
              prompt: 'Which of these changes the value of the equilibrium constant itself?',
              choices: [
                { t: 'Changing the temperature', ok: true },
                { t: 'Adding more reactant', why: 'The mixture shifts, but K stays the same: Q changes and the system moves until Q = K again.' },
                { t: 'Compressing a gas mixture', why: 'Pressure shifts the mixture (towards fewer gas molecules) but leaves K unchanged.' },
                { t: 'Adding a catalyst', why: 'A catalyst speeds both directions equally: equilibrium is reached sooner, at the same place.' },
              ],
              explain: r`Only temperature changes $K$. An endothermic reaction's $K$ grows with temperature; an exothermic one's shrinks. Everything else shifts the mixture to a new position with the **same** $K$.`,
            },
            {
              type: 'mcq',
              title: 'Squeeze the brown gas',
              prompt: r`A syringe holds brown $\mathrm{NO_2}$ in equilibrium with colourless $\mathrm{N_2O_4}$ ($\mathrm{2NO_2 \rightleftharpoons N_2O_4}$). You push the plunger in sharply. After the first instant, how does the colour change?`,
              choices: [
                { t: 'It fades: the equilibrium shifts towards N₂O₄, which has fewer gas molecules', ok: true },
                { t: 'It darkens even more, steadily', why: 'Squeezing first concentrates the brown gas, but then the system responds.' },
                { t: 'Nothing happens after the first instant', why: 'Higher pressure favours the side with fewer molecules.' },
              ],
              explain: r`The first effect is darkening (the same molecules in less space); then the mixture shifts to the side with fewer molecules, $\mathrm{N_2O_4}$, and the colour fades partway back, partly undoing the squeeze.`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'Pushing an exothermic reaction',
              prompt: r`For $\mathrm{2SO_2(g) + O_2(g) \rightleftharpoons 2SO_3(g)}$, $\Delta H = -198$ kJ (a step in making sulfuric acid). Which changes increase the amount of $\mathrm{SO_3}$ at equilibrium?`,
              choices: [
                { t: 'Lowering the temperature', ok: true },
                { t: 'Raising the pressure', ok: true },
                { t: r`Adding more $\mathrm{O_2}$`, ok: true },
                { t: r`Removing $\mathrm{SO_3}$ as it forms`, ok: true },
                { t: 'Adding a catalyst', why: 'A catalyst makes equilibrium arrive faster, but doesn’t move it.' },
              ],
              explain: r`Cooling favours the heat-releasing direction; pressure favours fewer gas molecules (3 → 2); extra $\mathrm{O_2}$ or removing $\mathrm{SO_3}$ pulls it forwards. The catalyst (vanadium oxide) is still vital, because at low temperature the reaction is painfully slow.`,
            },
          ],
          recap: [
            'Disturb an equilibrium and it shifts to partly undo the disturbance.',
            'Only temperature changes K; concentration and pressure shift the position.',
            'Catalysts speed things up but don’t move the equilibrium.',
          ],
        },
        {
          id: 'haber',
          title: 'Making Ammonia',
          summary: 'Yield versus speed',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Bread from air',
              body: r`Fritz Haber and Carl Bosch found how to make ammonia from the nitrogen in air:
$$\mathrm{N_2 + 3H_2 \rightleftharpoons 2NH_3} \qquad \Delta H = -92 \text{ kJ}$$
About half the nitrogen in your body passed through an ammonia plant, as fertiliser. The chemistry is a balancing act: Le Chatelier favours **low temperature** (exothermic) and **high pressure** (4 molecules → 2). But at low temperature the reaction is far too slow, and high pressure costs money.

Here is the equilibrium yield (a model fitted to the classic data):`,
              widget: {
                kind: 'graph', xmin: 300, xmax: 600, ymin: 0, ymax: 0.8, height: 320, grid: false,
                axes: { xticks: 50, yticks: 0.2, xlabel: 'temperature (°C)', ylabel: 'ammonia at equilibrium', yAt: 0, xAt: 300, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { P: { min: 50, max: 350, step: 10, value: 200, label: 'Pressure', format: (v) => `${v} atm` } },
                curves: [{ f: (T, p) => nh3Yield(T, p.P), color: 'blue' }],
                readout: (p) => `at 450 °C and ${p.P} atm: **${fix(100 * nh3Yield(450, p.P), 1)}%** ammonia at equilibrium`,
              },
            },
            {
              type: 'interactive',
              title: 'Run the plant',
              prompt: r`The catalyst only works fast when hot, so the ammonia made per pass through the reactor is (equilibrium yield) × (how close the gas gets to equilibrium in time). The pumps are rated to 250 atm. Make at least **27%** ammonia per pass.`,
              widget: {
                kind: 'graph', xmin: 300, xmax: 600, ymin: 0, ymax: 0.8, height: 320, grid: false,
                axes: { xticks: 50, yticks: 0.2, xlabel: 'temperature (°C)', ylabel: 'ammonia', yAt: 0, xAt: 300, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: {
                  T: { min: 300, max: 600, step: 5, value: 350, label: 'Temperature', color: 'coral', format: (v) => `${v} °C` },
                  P: { min: 50, max: 250, step: 10, value: 100, label: 'Pressure', format: (v) => `${v} atm` },
                },
                curves: [{ f: (T, p) => nh3Yield(T, p.P), color: 'blue', dash: true }, { f: (T, p) => nh3Yield(T, p.P) * speed(T), color: 'violet' }],
                points: [{ x: (p) => p.T, y: (p) => nh3Yield(p.T, p.P) * speed(p.T), color: 'coral' }],
                readout: (p) => `equilibrium ${fix(100 * nh3Yield(p.T, p.P), 1)}% × reached ${fix(100 * speed(p.T), 0)}% = **${fix(100 * nh3Yield(p.T, p.P) * speed(p.T), 1)}% per pass**`,
                goal: (p) => (nh3Yield(p.T, p.P) * speed(p.T) >= 0.27 ? true : { ok: false, msg: speed(p.T) < 0.8 ? 'Too cold: the gas never gets near equilibrium.' : nh3Yield(p.T, p.P) < 0.3 ? 'Fast, but the equilibrium yield is low. More pressure, or not quite so hot.' : 'Close. Fine-tune both.' }),
                solution: { T: 430, P: 250 },
              },
              explain: r`Only a narrow window works: around 420–450 °C at the highest pressure. Real plants run at about 400–450 °C and 150–250 atm, getting 15–25% per pass, then cool the gas so the ammonia condenses out and send the unreacted nitrogen and hydrogen round again. Recycling lets almost all of it react eventually.`,
            },
            {
              type: 'mcq',
              title: 'The catalyst’s job',
              prompt: 'Why is an iron catalyst so important here, if it doesn’t change the equilibrium yield?',
              choices: [
                { t: 'It lets the reaction reach equilibrium fast at a lower temperature, where the yield is higher', ok: true },
                { t: 'It shifts the equilibrium towards ammonia', why: 'Catalysts never shift an equilibrium.' },
                { t: 'It absorbs the heat released', why: 'The heat is removed by cooling; the catalyst’s job is speed.' },
              ],
              explain: r`Without a catalyst you'd need much higher temperatures to get any speed, and there the yield is tiny. A better catalyst moves the "speed" curve to the left, opening up the high-yield, low-temperature region.`,
            },
            {
              type: 'numeric',
              title: 'Recycling',
              prompt: r`If 20% of the gas reacts on each pass and unreacted gas is always recycled, what fraction of the original gas is **still unreacted** after 5 passes? (As a percentage, nearest whole number.)`,
              unit: '%',
              answer: 33,
              tol: 1,
              wrong: [{ v: 0, why: '20% per pass is of what’s left each time, not of the original amount.' }],
              explain: r`$0.8^5 = 0.328$, about 33% left; after 20 passes only about 1% remains. Recycling turns a mediocre yield per pass into an excellent overall yield.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why not run it cold?',
              prompt: 'Le Chatelier says low temperature gives more ammonia at equilibrium. Why not run at 25 °C with a long wait?',
              choices: [
                { t: 'Even with the catalyst, equilibrium would take far too long to reach', ok: true },
                { t: 'At 25 °C, K is smaller than at 450 °C', why: 'For an exothermic reaction K is larger at low temperature.' },
                { t: 'Ammonia decomposes at room temperature', why: 'At room temperature ammonia is perfectly stable.' },
              ],
              explain: r`At 25 °C the equilibrium lies almost entirely on the ammonia side, but nitrogen's triple bond is so strong that the reaction essentially doesn't happen. Nitrogen-fixing bacteria manage it at soil temperature with an enzyme, nitrogenase, at a hefty energy cost.`,
            },
          ],
          recap: [
            'Haber process: compromise between yield (low T, high P) and speed (high T).',
            'Catalysts reach equilibrium faster; recycling raises overall yield.',
          ],
        },
      ],
    },
    {
      title: 'Solubility',
      summary: 'Equilibria with solids.',
      lessons: [
        {
          id: 'solubility',
          title: 'Solubility & Ksp',
          summary: 'How much dissolves',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'A solid in balance',
              body: r`Even "insoluble" salts dissolve a little. When no more will dissolve, solid and ions are at equilibrium:
$$\mathrm{AgCl(s) \rightleftharpoons Ag^+(aq) + Cl^-(aq)} \qquad K_{sp} = [\mathrm{Ag^+}][\mathrm{Cl^-}] = 1.8 \times 10^{-10}$$
$K_{sp}$, the **solubility product**, leaves out the solid as usual. If $s$ mol/L dissolves, then $[\mathrm{Ag^+}] = [\mathrm{Cl^-}] = s$, so $s^2 = K_{sp}$.`,
            },
            {
              type: 'numeric',
              title: 'How soluble is silver chloride?',
              prompt: r`Calculate the solubility $s$ of AgCl in pure water (mol/L). Write it like 1.2e-5.`,
              unit: 'mol/L',
              answer: 1.34e-5,
              relTol: 0.02,
              wrong: [{ v: 9e-11, why: 'Take the square root of Ksp, don’t halve it.' }],
              explain: r`$s = \sqrt{1.8 \times 10^{-10}} = 1.34 \times 10^{-5}$ mol/L, about 2 mg per litre. "Insoluble" in everyday terms, but not zero.`,
            },
            {
              type: 'interactive',
              title: 'The common-ion effect',
              prompt: r`Adding chloride from another source (such as table salt) pushes silver out of solution. How much chloride brings dissolved silver below $1 \times 10^{-7}$ mol/L?`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 0, ymin: -10, ymax: -4, height: 320, grid: false, padL: 70,
                axes: { xticks: 1, yticks: 1, xlabel: 'added chloride (mol/L)', ylabel: 'dissolved silver (mol/L)', yAt: -10, xAt: -5, xfmt: pow10, yfmt: pow10 },
                params: { lc: { min: -5, max: 0, step: 0.05, value: -4, label: 'Chloride', format: (v) => `${sig(10 ** v, 2)} M` } },
                curves: [{ f: (x) => Math.log10(KSP_AGCL / (10 ** x)), color: 'blue' }, { f: () => -7, color: 'muted', dash: true }],
                points: [{ x: (p) => p.lc, y: (p) => Math.log10(KSP_AGCL / 10 ** p.lc), color: 'coral' }],
                readout: (p) => `silver left dissolved: **${sig(KSP_AGCL / 10 ** p.lc, 2)} mol/L**`,
                goal: (p) => (KSP_AGCL / 10 ** p.lc <= 1e-7 ? true : { ok: false, msg: 'Still too much silver in solution: add more chloride.' }),
                solution: { lc: -2.7 },
              },
              explain: r`$[\mathrm{Ag^+}] = K_{sp}/[\mathrm{Cl^-}]$, so you need $[\mathrm{Cl^-}] \geq 1.8 \times 10^{-10} / 10^{-7} = 1.8 \times 10^{-3}$ M. Photographers recovered silver from used fixer baths this way. (Ignoring the chloride from the AgCl itself, which is tiny.)`,
            },
            {
              type: 'numeric',
              title: 'Two ions for one',
              prompt: r`Fluorite, $\mathrm{CaF_2}$, has $K_{sp} = 3.9 \times 10^{-11}$. If $s$ dissolves, $[\mathrm{Ca^{2+}}] = s$ and $[\mathrm{F^-}] = 2s$, so $K_{sp} = 4s^3$. Find $s$ (mol/L, like 1.2e-4).`,
              unit: 'mol/L',
              answer: 2.14e-4,
              relTol: 0.02,
              wrong: [{ v: 6.24e-6, why: r`Don’t take a square root: $s = (K_{sp}/4)^{1/3}$.` }],
              explain: r`$s = (3.9 \times 10^{-11} / 4)^{1/3} = 2.1 \times 10^{-4}$ mol/L. Notice that $\mathrm{CaF_2}$ has a smaller $K_{sp}$ than AgCl but dissolves more: you can only compare $K_{sp}$ values directly between salts of the same formula type.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Will it precipitate?',
              prompt: r`Equal volumes of $2.0 \times 10^{-4}$ M $\mathrm{AgNO_3}$ and $2.0 \times 10^{-4}$ M NaCl are mixed. Does AgCl precipitate?`,
              choices: [
                { t: 'Yes: Q = 1.0 × 10⁻⁸, larger than Ksp', ok: true },
                { t: 'No: the concentrations are tiny', why: 'Compare Q with Ksp; even small concentrations can exceed 1.8 × 10⁻¹⁰.' },
                { t: 'Yes: Q = 4.0 × 10⁻⁸', why: 'Mixing equal volumes halves each concentration first.' },
              ],
              explain: r`After mixing, each ion is $1.0 \times 10^{-4}$ M, so $Q = 1.0 \times 10^{-8} > K_{sp}$: a cloudy white precipitate forms until $Q$ falls to $K_{sp}$.`,
            },
          ],
          recap: [
            'Ksp: the equilibrium constant for a salt dissolving (solid left out).',
            'Common ions lower solubility.',
            'Q > Ksp → precipitate forms.',
          ],
        },
        {
          id: 'precipitation',
          title: 'Mystery Ions',
          summary: 'Detective work with precipitates',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Tests by precipitate',
              body: r`Different metal ions form insoluble salts with different partners, often in tell-tale colours. Adding a few drops of a reagent and watching for a precipitate is a classic way to identify an ion:

| ion | + chloride | + sulfate | + hydroxide |
|---|---|---|---|
| $\mathrm{Ag^+}$ | white | none | brown |
| $\mathrm{Ba^{2+}}$ | none | white | none |
| $\mathrm{Cu^{2+}}$ | none | none | pale blue |
| $\mathrm{Fe^{3+}}$ | none | none | rusty brown |
| $\mathrm{Pb^{2+}}$ | white | white | white |`,
            },
            {
              type: 'mcq',
              title: 'Mystery one',
              prompt: 'Try each reagent on the unknown. Which ion is it?',
              widget: mystery('Ba 2+'),
              choices: [
                { t: r`$\mathrm{Ba^{2+}}$`, ok: true },
                { t: r`$\mathrm{Pb^{2+}}$`, why: 'Lead would also precipitate with chloride and hydroxide.' },
                { t: r`$\mathrm{Ag^+}$`, why: 'Silver would precipitate with chloride.' },
                { t: r`$\mathrm{Cu^{2+}}$`, why: 'Copper would give a blue precipitate with hydroxide.' },
              ],
              explain: r`Only sulfate gave a precipitate: barium sulfate. $\mathrm{BaSO_4}$ is so insoluble ($K_{sp} \approx 10^{-10}$) that it's safe to swallow: the "barium meal" that shows up the gut on X-rays.`,
            },
            {
              type: 'mcq',
              title: 'Mystery two',
              prompt: 'A new unknown. Which ion is it?',
              widget: mystery('Fe 3+'),
              choices: [
                { t: r`$\mathrm{Fe^{3+}}$`, ok: true },
                { t: r`$\mathrm{Cu^{2+}}$`, why: 'Copper hydroxide is pale blue, not brown.' },
                { t: r`$\mathrm{Ag^+}$`, why: 'Silver also gives a white precipitate with chloride.' },
                { t: r`$\mathrm{Ba^{2+}}$`, why: 'Barium gives nothing with hydroxide.' },
              ],
              explain: r`A rusty-brown precipitate with hydroxide and nothing else: iron(III) hydroxide, essentially rust. The solution's yellowish tint was a clue too.`,
            },
            {
              type: 'mcq',
              title: 'Mystery three',
              prompt: 'One more. Which ion is it?',
              widget: mystery('Ag+'),
              choices: [
                { t: r`$\mathrm{Ag^+}$`, ok: true },
                { t: r`$\mathrm{Pb^{2+}}$`, why: 'Lead also precipitates with sulfate, and its hydroxide is white.' },
                { t: r`$\mathrm{Fe^{3+}}$`, why: 'Iron gives nothing with chloride.' },
              ],
              explain: r`White with chloride, nothing with sulfate, brown with hydroxide (silver oxide). Silver chloride's white precipitate darkens in sunlight as silver forms: the chemistry behind black-and-white photography.`,
            },
            {
              type: 'order',
              title: 'Separating a mixture',
              prompt: r`A solution contains both $\mathrm{Ag^+}$ and $\mathrm{Cu^{2+}}$. Put the steps in order to separate them.`,
              items: ['Add chloride: silver chloride precipitates', 'Filter off the white solid (silver chloride)', 'Add hydroxide to what passed through the filter', 'Filter off the blue solid (copper hydroxide)'],
              explain: r`Chloride removes silver but leaves copper in solution; then hydroxide catches the copper. Choosing reagents that pick off one ion at a time is the basis of classical **qualitative analysis**.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hard water',
              prompt: r`Soap forms a scum with "hard" water. Hard water contains $\mathrm{Ca^{2+}}$ and $\mathrm{Mg^{2+}}$. Washing soda ($\mathrm{Na_2CO_3}$) softens it. How?`,
              choices: [
                { t: 'Carbonate precipitates the calcium and magnesium as insoluble carbonates', ok: true },
                { t: 'Sodium ions cancel the charge of calcium', why: 'Sodium ions are spectators; carbonate does the work.' },
                { t: 'It makes the soap more soluble', why: 'It removes the ions that make soap insoluble.' },
              ],
              explain: r`$\mathrm{Ca^{2+} + CO_3^{2-} \to CaCO_3(s)}$. With the calcium locked away as chalk, it can't grab the soap. The same chalk builds up as limescale in kettles.`,
            },
          ],
          recap: [
            'Characteristic precipitates identify ions.',
            'Separate ions by precipitating them one at a time.',
          ],
        },
      ],
    },
  ],
};
