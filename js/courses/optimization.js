import { fix } from '../lib/svg.js';

const r = String.raw;

// bakery: x loaves of bread, y cakes. Flour: 2x + y ≤ 100. Oven: x + 3y ≤ 150. Profit 3x + 5y.
const feasible = (x, y) => x >= 0 && y >= 0 && 2 * x + y <= 100 + 1e-9 && x + 3 * y <= 150 + 1e-9;
const REGION = [[0, 0], [50, 0], [30, 40], [0, 50]];
const CORNERS = [[0, 0], [50, 0], [30, 40], [0, 50]];

// diet: food A (x units): 2 protein, 1 vitamin, £3; food B (y units): 1 protein, 3 vitamin, £4. Need ≥ 8 protein, ≥ 9 vitamin.
const dietOK = (x, y) => x >= 0 && y >= 0 && 2 * x + y >= 8 - 1e-9 && x + 3 * y >= 9 - 1e-9;

// knapsack: [name, kg, value]
const ITEMS = [['tent', 5, 60], ['stove', 3, 50], ['camera', 2, 40], ['books', 4, 30], ['snacks', 1, 15]];
const pack = (b) => ITEMS.reduce((acc, it, i) => (b[i] ? { w: acc.w + it[1], v: acc.v + it[2] } : acc), { w: 0, v: 0 });

// assignment: cost[worker][job]
const COST = [[9, 2, 7], [6, 4, 3], [5, 8, 1]];
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const WORKERS = ['Ana', 'Ben', 'Cleo'], JOBS = ['painting', 'wiring', 'plumbing'];
const assignCost = (k) => PERMS[k].reduce((t, j, w) => t + COST[w][j], 0);

// a 9-sided feasible region (tangent lines to the unit circle) and two routes to its best corner
const LP9 = Array.from({ length: 9 }, (_, i) => { const a = (2 * Math.PI * i) / 9 + 0.15; return [Math.cos(a), Math.sin(a)]; });
const LP_C = [Math.cos(0.5), Math.sin(0.5)];
const LP_VERTS = LP9.map((n, i) => {
  const m = LP9[(i + 1) % 9], det = n[0] * m[1] - n[1] * m[0];
  return [(m[1] - n[1]) / det, (n[0] - m[0]) / det];
});
// the simplex path: from the worst corner, step to a better neighbour each time (here, always the next corner round)
const LP_SIMPLEX = (() => {
  const val = (v) => v[0] * LP_C[0] + v[1] * LP_C[1];
  let i = LP_VERTS.reduce((b, v, k) => (val(v) < val(LP_VERTS[b]) ? k : b), 0);
  const path = [LP_VERTS[i]];
  for (;;) {
    const nb = [(i + 1) % 9, (i + 8) % 9].filter((k) => val(LP_VERTS[k]) > val(LP_VERTS[i]) + 1e-9).sort((p, q) => val(LP_VERTS[q]) - val(LP_VERTS[p]));
    if (!nb.length) break;
    i = nb[0];
    path.push(LP_VERTS[i]);
  }
  return path;
})();
// the interior route: the "central path", maximising c·x + μ Σ log(slack) as μ shrinks towards 0
const LP_CENTRAL = (() => {
  let x = [0, 0];
  const pts = [];
  for (let k = 0; k <= 60; k++) {
    const mu = 3 * 0.86 ** k;
    for (let it = 0; it < 30; it++) {
      let g = [LP_C[0], LP_C[1]], H = [0, 0, 0];
      for (const n of LP9) {
        const sl = 1 - n[0] * x[0] - n[1] * x[1];
        g[0] -= (mu * n[0]) / sl; g[1] -= (mu * n[1]) / sl;
        H[0] += (mu * n[0] * n[0]) / sl ** 2; H[1] += (mu * n[0] * n[1]) / sl ** 2; H[2] += (mu * n[1] * n[1]) / sl ** 2;
      }
      const det = H[0] * H[2] - H[1] * H[1];
      let d = [(H[2] * g[0] - H[1] * g[1]) / det, (H[0] * g[1] - H[1] * g[0]) / det], st = 1;
      while (LP9.some((n) => 1 - n[0] * (x[0] + st * d[0]) - n[1] * (x[1] + st * d[1]) <= 0)) st /= 2;
      x = [x[0] + st * d[0], x[1] + st * d[1]];
    }
    pts.push(x);
  }
  return pts;
})();

export default {
  id: 'optimization',
  subject: 'math',
  title: 'Linear Programming',
  level: 'Intermediate',
  cover: 'optimization',
  tagline: 'Making the best decision under constraints: corners, costs, knapsacks and assignments.',
  description: r`Airlines scheduling crews, factories planning production, dietitians designing meals: they all maximise or minimise something subject to limits. Learn to draw constraints as regions, discover why the best answer is always at a corner, minimise costs, find what an extra resource is worth, see the algorithm that transformed industry, and meet the harder whole-number problems of packing and assigning.`,
  prereq: 'Functions & Graphs',
  chapters: [
    {
      title: 'Constraints and Corners',
      summary: 'Feasible regions and optimal plans.',
      lessons: [
        {
          id: 'feasible',
          title: 'The Feasible Region',
          summary: 'Constraints as shapes',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'A bakery’s limits',
              body: r`A bakery makes $x$ loaves of bread and $y$ cakes each day.
- **Flour:** a loaf needs 2 kg and a cake 1 kg, and there are 100 kg: $2x + y \le 100$.
- **Oven time:** a loaf needs 1 hour and a cake 3 hours, and there are 150 oven-hours: $x + 3y \le 150$.
- And of course $x \ge 0$, $y \ge 0$.

Each inequality allows one side of a line. The points satisfying **all** of them form the **feasible region**: every possible production plan.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Shaping the region',
              body: r`Change the amount of flour and watch the feasible region (shaded) change shape.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 80, ymin: -5, ymax: 62, grid: 10, axes: { xlabel: 'loaves x', ylabel: 'cakes y' }, maxWidth: 520,
                params: { F: { min: 40, max: 160, step: 10, value: 100, label: 'flour available', color: 'blue', format: (v) => `${v} kg` } },
                curves: [{ f: (x, p) => p.F - 2 * x, color: 'blue' }, { f: (x) => (150 - x) / 3, color: 'teal' }],
                extra: ({ plot, p, s }) => {
                  // region: polygon from clipping
                  const pts = [];
                  for (let x = 0; x <= 80; x += 0.5) pts.push([x, Math.min(p.F - 2 * x, (150 - x) / 3)]);
                  const poly = pts.filter(([, y]) => y >= 0);
                  if (!poly.length) return [];
                  const last = poly[poly.length - 1];
                  const xEnd = Math.min(p.F / 2, 150);
                  const d = `M${plot.X(0)} ${plot.Y(0)} ` + poly.map(([x, y]) => `L${plot.X(x)} ${plot.Y(y)}`).join(' ') + ` L${plot.X(Math.max(last[0], xEnd))} ${plot.Y(0)} Z`;
                  return [s('path', { d, class: 'fl-violet-soft', opacity: 0.8 })];
                },
                readout: (p) => (p.F <= 50 ? 'With so little flour, the flour line alone shapes the region.' : p.F >= 300 ? '' : `The flour line (blue) and oven line (teal) cross at $x = ${((3 * p.F - 150) / 5).toFixed(0)}$, $y = ${((300 - p.F) / 5).toFixed(0)}$.`),
              },
              after: r`Every constraint slices off part of the plane. What's left is always a **convex** polygon: any two possible plans can be blended into another possible plan.`,
            },
            {
              type: 'mcq',
              title: 'Possible or not?',
              prompt: r`Is making 40 loaves and 30 cakes feasible?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`Flour: $2(40) + 30 = 110 > 100$. Not enough flour.` },
              ],
              explain: r`Flour needed: $2 \times 40 + 30 = 110$ kg, but only 100 kg is available. (Oven time, $40 + 90 = 130$ hours, would be fine.) The plan breaks one constraint, so it lies outside the feasible region.`,
            },
            {
              type: 'numeric',
              title: 'All the cakes',
              prompt: r`If the bakery makes no bread, what's the largest number of cakes it can make?`,
              unit: 'cakes',
              answer: 50,
              wrong: [{ v: 100, why: 'Flour allows 100 cakes, but oven time (3 hours each, 150 hours) allows only 50.' }],
              explain: r`Flour would allow 100 cakes, but the oven allows only $\frac{150}{3} = 50$. The **tightest** constraint wins: that's the corner $(0, 50)$.`,
            },
            {
              type: 'mcq',
              title: 'A redundant rule',
              prompt: r`A bakery’s region is defined by $x \ge 0$, $y \ge 0$ and $x + y \le 10$. A manager adds the rule $x + y \le 20$. What happens to the feasible region?`,
              choices: [
                { t: r`Nothing: every point that satisfies x + y ≤ 10 already satisfies x + y ≤ 20`, ok: true },
                { t: r`It doubles in size`, why: r`Constraints can only cut a region down, never enlarge it.` },
                { t: r`It becomes empty`, why: r`The new rule is weaker than an existing one, so it removes nothing.` },
              ],
              explain: r`A constraint that is implied by the others is **redundant**: its line lies entirely outside the region. Real planning problems often contain many such constraints, and spotting them makes the problem smaller.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Impossible orders',
              prompt: r`A customer insists on at least 60 loaves **and** at least 30 cakes. What happens to the feasible region?`,
              choices: [
                { t: 'It becomes empty: no plan meets every requirement', ok: true },
                { t: 'It grows', why: 'Adding constraints can only shrink the region.' },
                { t: 'Nothing changes', why: r`60 loaves alone need 120 kg of flour, more than the 100 kg available.` },
              ],
              explain: r`60 loaves need $120$ kg of flour on their own, so no plan works: the problem is **infeasible**. Detecting infeasibility, and which constraints clash, is an important job of real optimisation software.`,
            },
          ],
          recap: [
            'Each constraint is an inequality: one side of a line.',
            'The feasible region is where all the constraints hold; it is always convex.',
            'Too many constraints can leave no feasible plan at all.',
          ],
        },
        {
          id: 'corners',
          title: 'The Best Plan',
          summary: 'Optimum at a corner',
          icon: 'target',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Maximise profit',
              prompt: r`Each loaf earns \$3 profit and each cake \$5, so profit $= 3x + 5y$. Drag the plan around the feasible region to make the **most profit**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 80, ymin: -5, ymax: 62, grid: 10, axes: { xlabel: 'loaves x', ylabel: 'cakes y' }, maxWidth: 560,
                params: { x: { min: 0, max: 75, step: 1, value: 10, slider: false }, y: { min: 0, max: 60, step: 1, value: 10, slider: false } },
                curves: [
                  { f: (x) => 100 - 2 * x, color: 'blue' },
                  { f: (x) => (150 - x) / 3, color: 'teal' },
                  { f: (x, p) => (3 * p.x + 5 * p.y - 3 * x) / 5, color: 'coral', dash: true },
                ],
                under: ({ plot, s }) => [s('path', { d: REGION.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-violet-soft', opacity: 0.8 })],
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => (feasible(p.x, p.y) ? r`plan: ${p.x} loaves, ${p.y} cakes $\;\Rightarrow\;$ profit $= 3(${p.x}) + 5(${p.y}) = \$${3 * p.x + 5 * p.y}$` : r`**Not feasible**: ${2 * p.x + p.y > 100 ? 'not enough flour' : ''}${2 * p.x + p.y > 100 && p.x + 3 * p.y > 150 ? ' and ' : ''}${p.x + 3 * p.y > 150 ? 'not enough oven time' : ''}`),
                goal: (p) => feasible(p.x, p.y) && 3 * p.x + 5 * p.y === 290,
                hint: 'The dashed line shows all plans with the same profit as yours. Push it as far up and right as you can while still touching the region.',
                solution: { x: 30, y: 40 },
              },
              explain: r`The best plan is **30 loaves and 40 cakes**, earning \$290, at the corner where the flour and oven lines cross. Every point on the dashed line earns the same profit. Sliding the line outward raises the profit, and the last point of the region it touches is a corner.`,
            },
            {
              type: 'explain',
              title: 'The corner principle',
              body: r`For a **linear** objective (like $3x + 5y$) over a region bounded by straight lines, the maximum (and the minimum) always occurs at a **corner** (vertex) of the feasible region. So you only need to check the corners:

| Corner | Profit $3x + 5y$ |
|---|---|
| (0, 0) | \$0 |
| (50, 0) | \$150 |
| (0, 50) | \$250 |
| (30, 40) | **\$290** |`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'When does the best corner change?',
              prompt: r`Raise the profit per loaf. Find the price at which the corners $(30, 40)$ and $(50, 0)$ earn **exactly the same** profit.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 80, ymin: -5, ymax: 62, grid: 10, axes: { xlabel: 'loaves x', ylabel: 'cakes y' }, maxWidth: 520,
                params: { pb: { min: 1, max: 15, step: 0.5, value: 4, label: 'profit per loaf', color: 'blue', format: (v) => `$${fix(v, 2)}` } },
                curves: [{ f: (x) => 100 - 2 * x, color: 'blue', width: 1.5 }, { f: (x) => (150 - x) / 3, color: 'teal', width: 1.5 }, { f: (x, p) => { const best = Math.max(...CORNERS.map(([cx, cy]) => p.pb * cx + 5 * cy)); return (best - p.pb * x) / 5; }, color: 'coral', dash: true }],
                under: ({ plot, s }) => [s('path', { d: REGION.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-violet-soft', opacity: 0.8 })],
                extra: ({ plot, p, s }) => {
                  const vals = CORNERS.map(([cx, cy]) => p.pb * cx + 5 * cy), best = Math.max(...vals);
                  return [...CORNERS.map(([cx, cy], i) => s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: vals[i] === best ? 9 : 5, class: vals[i] === best ? 'fl-coral' : 'fl-ink' }))];
                },
                readout: (p) => r`$(30, 40)$: \$${fix(30 * p.pb + 200, 2)}$; $\;(50, 0)$: \$${fix(50 * p.pb, 2)}$`,
                goal: (p) => p.pb === 10,
                hint: 'Set 30p + 200 equal to 50p.',
                solution: { pb: 10 },
              },
              explain: r`$30p + 200 = 50p$ gives $p = \$10$. At that price, the profit lines are parallel to the flour line, so **every** plan along that edge ties. Above \$10, making only bread is best; below, the mixed plan wins. The optimal plan only jumps when prices cross such thresholds.`,
            },
            {
              type: 'numeric',
              title: 'Counting corners',
              prompt: r`A feasible region is defined by $x \ge 0$, $y \ge 0$ and three more straight-line constraints, each of which cuts off a corner of the region. At most how many corners can it have?`,
              unit: 'corners',
              answer: 5,
              wrong: [{ v: 3, why: r`Count all five constraints: the two axes are edges too.` }],
              explain: r`Each constraint can contribute at most one edge of the polygon, so 5 constraints give at most 5 edges and 5 corners. The corner principle means you only need to check those few points, however large the region.`,
            },
            {
              type: 'numeric',
              title: 'Test the corners',
              prompt: r`The feasible region has corners $(0, 0)$, $(4, 0)$, $(3, 2)$ and $(0, 3)$. What is the largest value of the profit $3x + 2y$ on the region?`,
              answer: 13,
              wrong: [{ v: 12, why: r`Check every corner: $(3, 2)$ gives $9 + 4 = 13$.` }],
              explain: r`Evaluate at each corner: $0$, $12$, $13$, $6$. The best is $13$ at $(3, 2)$. The corner principle guarantees no point inside does better.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Prices change',
              prompt: r`Bread profit rises to \$8 per loaf (cakes stay at \$5). Check the corners: what's the new maximum profit?`,
              unit: r`\$`,
              answer: 440,
              wrong: [{ v: 400, why: r`Check every corner: $(30, 40)$ gives $8(30) + 5(40) = 440$, more than $(50, 0)$'s 400.` }, { v: 250, why: 'That’s the all-cake corner. Bread is now much more profitable.' }],
              explain: r`Corners: $(50, 0) \to 400$; $(30, 40) \to 240 + 200 = 440$; $(0, 50) \to 250$. The maximum is still at $(30, 40)$: **\$440**, as the threshold of \$10 hasn't been reached.`,
            },
          ],
          recap: [
            'Lines of equal profit are parallel. Slide them outward to increase profit.',
            'A linear objective is maximised at a corner of the feasible region.',
            'The best corner only changes when prices cross a threshold.',
          ],
        },
        {
          id: 'diet',
          title: 'The Diet Problem',
          summary: 'Minimising cost',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'Cheapest healthy diet',
              body: r`In 1945, economist George Stigler asked: what's the cheapest diet that meets all nutritional needs? It became one of the first big linear programming problems.

A small version: food A costs £3 per unit and gives 2 g protein and 1 mg vitamin; food B costs £4 per unit and gives 1 g protein and 3 mg vitamin. You need at least 8 g of protein and 9 mg of vitamin. Now the constraints are "**at least**", and we **minimise** cost.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Minimise cost',
              prompt: r`Drag the plan (units of A across, units of B up) to the cheapest diet that meets both requirements. The feasible region is shaded.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 10, ymin: -0.5, ymax: 9, grid: 1, axes: { xlabel: 'units of A', ylabel: 'units of B' }, maxWidth: 480,
                params: { x: { min: 0, max: 10, step: 0.5, value: 6, slider: false }, y: { min: 0, max: 9, step: 0.5, value: 5, slider: false } },
                curves: [{ f: (x) => 8 - 2 * x, color: 'blue' }, { f: (x) => (9 - x) / 3, color: 'teal' }, { f: (x, p) => (3 * p.x + 4 * p.y - 3 * x) / 4, color: 'coral', dash: true }],
                under: ({ plot, s }) => [s('path', { d: [[0, 9], [0, 8], [3, 2], [9, 0], [10, 0], [10, 9]].map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-violet-soft', opacity: 0.8 })],
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => (dietOK(p.x, p.y) ? r`cost $= 3(${fix(p.x, 1)}) + 4(${fix(p.y, 1)}) = £${fix(3 * p.x + 4 * p.y, 2)}$` : `**Not enough** ${2 * p.x + p.y < 8 ? 'protein' : ''}${2 * p.x + p.y < 8 && p.x + 3 * p.y < 9 ? ' or ' : ''}${p.x + 3 * p.y < 9 ? 'vitamin' : ''}`),
                goal: (p) => dietOK(p.x, p.y) && 3 * p.x + 4 * p.y === 17,
                hint: 'Slide the dashed cost line down towards the origin as far as it can go while still touching the shaded region.',
                solution: { x: 3, y: 2 },
              },
              explain: r`The cheapest diet is **3 units of A and 2 of B**, costing £17, at the corner where both requirements are met exactly. Check the other corners: all B, $(0, 8)$, costs £32; all A, $(9, 0)$, costs £27. Mixing wins.`,
            },
            {
              type: 'mcq',
              title: 'Unbounded upwards',
              prompt: r`This feasible region stretches off to infinity (you can always eat more). Why is that not a problem here?`,
              choices: [
                { t: 'We are minimising cost, and the cheapest point is still at a corner near the origin', ok: true },
                { t: 'Because infinite food is free', why: 'More food costs more. Since we want the minimum, the region’s far side never matters.' },
                { t: 'It is a problem: there is no solution', why: 'There’s no maximum, but there is a minimum, at a corner.' },
              ],
              explain: r`An unbounded region has no **maximum** cost but can still have a **minimum**. Had we tried to maximise, the problem would be "unbounded": always improvable. Stigler's original problem had 77 foods and 9 nutrients; Jack Laderman's team solved it by hand in 1947, using desk calculators, in about 120 person-days.`,
            },
            {
              type: 'mcq',
              title: 'Impossible requirements',
              prompt: r`A nutritionist adds a new requirement to the diet problem that no combination of available foods can meet together with the others. What does linear programming report?`,
              choices: [
                { t: r`The problem is infeasible: the feasible region is empty`, ok: true },
                { t: r`It picks the closest diet anyway`, why: r`Plain linear programming doesn’t compromise. It reports that no point satisfies every constraint.` },
                { t: r`The cost becomes zero`, why: r`With no feasible point, there is no cost to minimise at all.` },
              ],
              explain: r`If the constraints contradict each other, there is no feasible region and no solution. Solvers detect this and report **infeasible**; the modeller must then relax a requirement. In 1945 George Stigler first posed the diet problem, solving it approximately by hand.`,
            },
            {
              type: 'numeric',
              title: 'Protein on a budget',
              prompt: r`Food A costs £2 per unit and gives 3 g of protein; food B costs £3 per unit and gives 6 g. What is the cheapest way to get exactly 12 g of protein (fractions of units allowed), in pounds?`,
              unit: '£',
              answer: 6,
              tol: 0.001,
              explain: r`B gives 2 g per pound, A only 1.5 g per pound, so use only B: 2 units for £6. All A would cost £8. With a single requirement, the best plan uses the food with the best value per pound.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A price rise',
              prompt: r`Food B's price rises to £10 per unit. Checking the corners $(0, 8)$, $(3, 2)$ and $(9, 0)$, what's the new minimum cost?`,
              unit: '£',
              answer: 27,
              wrong: [{ v: 29, why: r`$(3, 2)$ now costs $9 + 20 = 29$, but the all-A corner $(9, 0)$ costs only 27.` }],
              explain: r`$(0, 8) \to 80$; $(3, 2) \to 9 + 20 = 29$; $(9, 0) \to 27$. Now the cheapest plan is **all food A**: £27. A big enough price change switches the optimal corner.`,
            },
          ],
          recap: [
            '"At least" constraints give regions that may be unbounded.',
            'Minimum cost still occurs at a corner.',
            'The diet problem was one of the first large linear programs.',
          ],
        },
        {
          id: 'shadow',
          title: 'Shadow Prices',
          summary: 'What is one more kilogram worth?',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Valuing a resource',
              body: r`The bakery's best profit is \$290. A supplier offers extra flour. How much should the baker pay for it? Not more than the extra profit it allows. That extra profit per unit of resource is called the **shadow price**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'More flour',
              prompt: r`With more flour, the best corner moves. Find the amount of flour that lets the bakery earn a maximum profit of exactly **\$306**.`,
              widget: {
                kind: 'graph', xmin: 90, xmax: 150, ymin: 270, ymax: 340, grid: 10, gridY: 10, height: 260, padL: 52, axes: { xlabel: 'flour (kg)', ylabel: 'best profit', xAt: 90, yAt: 270 },
                params: { F: { min: 90, max: 150, step: 5, value: 100, slider: false } },
                curves: [{ f: (F) => 0.8 * F + 210, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.F, y: (p) => 0.8 * p.F + 210, drag: { x: 'F' }, color: 'coral' }],
                readout: (p) => r`flour ${p.F} kg: best plan $x = ${((3 * p.F - 150) / 5).toFixed(0)}$, $y = ${((300 - p.F) / 5).toFixed(0)}$, profit \$${(0.8 * p.F + 210).toFixed(0)}`,
                goal: (p) => p.F === 120,
                hint: 'Each extra kilogram of flour adds the same amount of profit. Find how much from the graph.',
                solution: { F: 120 },
              },
              explain: r`At 120 kg the best plan is 42 loaves and 36 cakes, earning \$306. Profit rises by \$16 for 20 kg: **\$0.80 per kilogram**. That's flour's shadow price. If flour costs less than 80 cents extra per kilogram, buying more is worthwhile.`,
            },
            {
              type: 'numeric',
              title: 'Read the shadow price',
              prompt: r`From the line, best profit $= 0.8F + 210$. By how many dollars does the best profit rise for each extra kilogram of flour?`,
              unit: r`\$`,
              answer: 0.8,
              tol: 0.001,
              wrong: [{ v: 3, why: 'An extra kilogram doesn’t simply make more bread: the best plan rebalances bread and cakes.' }],
              explain: r`\$0.80 per kg. Surprisingly, extra flour makes the bakery bake **more bread and fewer cakes** (oven time is still limited), and the net gain is 80 cents per kilogram.`,
            },
            {
              type: 'numeric',
              title: 'Is it worth buying?',
              prompt: r`A bakery’s shadow price for flour is £2 per kg: each extra kilogram adds £2 to the maximum profit (for small changes). A supplier offers 10 kg more at £1.50 per kg. How much does the bakery gain by buying it?`,
              unit: '£',
              answer: 5,
              wrong: [{ v: 20, why: r`That’s the extra profit before paying for the flour.` }],
              explain: r`The extra flour adds about $10 \times 2 = £20$ of profit and costs $10 \times 1.50 = £15$, a gain of **£5**. Shadow prices tell managers exactly which resources are worth paying more for, and how much more.`,
            },
            {
              type: 'numeric',
              title: 'Buying at a discount',
              prompt: r`Flour has a shadow price of £4 per kg: each extra kilogram adds £4 to the best profit (within the relevant range). A supplier offers 10 kg at £3 per kg. By how much does buying it raise profit, in pounds?`,
              unit: '£',
              answer: 10,
              tol: 0.001,
              explain: r`Each kilogram earns £4 and costs £3, a gain of £1, so 10 kg add **£10**. If the price were above £4, buying would lose money: the shadow price is the most it’s worth paying.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Unused resources',
              prompt: r`Suppose the best plan left 20 oven-hours unused. What would the shadow price of oven time be?`,
              choices: [
                { t: 'Zero: more oven time wouldn’t help, since some is already idle', ok: true },
                { t: 'The same as flour', why: 'Shadow prices are separate for each resource. Idle capacity has no extra value.' },
                { t: 'Very high', why: 'If you already have spare oven time, more of it adds nothing.' },
              ],
              explain: r`A constraint that isn't "tight" at the optimum has a shadow price of **zero**. Shadow prices come from the **dual** linear program, a mirror-image problem about valuing resources, discovered by John von Neumann and developed by Dantzig and others. They guide real decisions about where to invest.`,
            },
          ],
          recap: [
            'A shadow price is the extra optimal profit per extra unit of a resource.',
            r`Here flour is worth \$0.80 per extra kilogram.`,
            'Resources left over at the optimum have a shadow price of zero.',
          ],
        },
      ],
    },
    {
      title: 'At Scale',
      summary: 'Algorithms and whole-number problems.',
      lessons: [
        {
          id: 'simplex',
          title: 'The Simplex Method',
          summary: 'Corner to corner, uphill',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Thousands of variables',
              body: r`Real problems have thousands of variables and constraints: the feasible region is a shape in thousands of dimensions with astronomically many corners. Checking every corner is hopeless.

In 1947, George Dantzig invented the **simplex method**: start at one corner, then repeatedly move along an edge to a neighbouring corner with a better value, until no neighbour is better. Because the region is convex (it has no dents), a corner with no better neighbour is the overall best.`,
            },
            {
              type: 'numeric',
              title: 'Too many corners',
              prompt: r`A problem with 10 variables and 20 constraints can have up to $\binom{20}{10}$ corners. How many is that?`,
              answer: 184756,
              wrong: [{ v: 200, why: r`$\binom{20}{10}$ is "20 choose 10", the number of ways to choose 10 constraints from 20.` }],
              explain: r`$\binom{20}{10} = 184{,}756$. Real problems with thousands of constraints have more corners than atoms in the universe, yet the simplex method typically visits only a few times as many corners as there are constraints.`,
            },
            {
              type: 'mcq',
              title: 'Why stopping is safe',
              prompt: r`Why can the simplex method stop as soon as no neighbouring corner improves the profit?`,
              choices: [
                { t: 'For a linear objective on a convex region, a local best corner is also the global best', ok: true },
                { t: 'Because it has checked every corner', why: 'It usually visits only a tiny fraction of the corners. Convexity is what makes stopping safe.' },
                { t: 'It can’t: it might stop at a worse corner', why: 'With a linear objective and a convex feasible region, there are no false peaks.' },
              ],
              explain: r`On a convex region, a linear function has no false peaks: if you can't improve by stepping to a neighbouring corner, you're at the top. That's very different from the bumpy landscapes of the Multivariable Calculus course, where gradient ascent can get stuck on a lower hill.`,
            },
            {
              type: 'mcq',
              title: 'Fast in practice',
              prompt: r`In 1972, Klee and Minty built examples where the simplex method visits an exponential number of corners. Yet it remains one of the most-used algorithms in the world. Why?`,
              choices: [
                { t: r`On real problems it almost always finishes in a small number of steps, and the bad cases are extremely contrived`, ok: true },
                { t: r`Computers became fast enough to visit every corner`, why: r`Exponentially many corners would defeat any computer. The method rarely comes close to that.` },
                { t: r`The Klee–Minty examples were later shown to be wrong`, why: r`They’re correct. They just almost never occur in practice.` },
              ],
              explain: r`Worst-case and typical behaviour can differ wildly. In 2001 Spielman and Teng explained why ("smoothed analysis"): tiny random perturbations make the bad cases disappear. Meanwhile **interior-point methods** (Karmarkar, 1984) offer guaranteed polynomial time.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Walking the corners',
              body: r`Here is the simplex method on a small problem: maximise profit $3x + 2y$ over the shaded region. Step through it: each step moves to a neighbouring corner with higher profit.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 7, ymin: -0.5, ymax: 6.5, grid: 1, maxWidth: 440, axes: { xticks: 1, yticks: 1 },
                params: { k: { min: 0, max: 2, step: 1, value: 0, label: 'step', color: 'violet' } },
                extra: ({ plot, p, s }) => { const poly = [[0, 0], [5, 0], [5, 2], [3, 4], [0, 5]], path = [[0, 0], [5, 0], [5, 2]]; const els = [s('path', { d: 'M' + poly.map(([x, y]) => `${plot.X(x)} ${plot.Y(y)}`).join('L') + 'Z', class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 })]; for (let i = 0; i < p.k; i++) els.push(s('line', { x1: plot.X(path[i][0]), y1: plot.Y(path[i][1]), x2: plot.X(path[i + 1][0]), y2: plot.Y(path[i + 1][1]), stroke: 'var(--coral)', 'stroke-width': 4 })); poly.forEach(([x, y]) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: 'fl-ink' }))); const [cx, cy] = path[p.k]; els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: 9, class: 'fl-coral' })); return els; },
                readout: (p) => { const path = [[0, 0], [5, 0], [5, 2]], [x, y] = path[p.k]; return `corner (${x}, ${y}): profit **${3 * x + 2 * y}**${p.k === 2 ? ' · no neighbour is better: optimal ✓' : ''}`; },
              },
              after: r`From $(0,0)$ the method moves to $(5, 0)$ (profit 15), then $(5, 2)$ (profit 19). Its neighbours, $(3, 4)$ with 17 and $(5, 0)$ with 15, are both worse, so it stops: for linear problems, a corner better than its neighbours is the best of all. It never had to visit $(0, 5)$ or $(3, 4)$.`,
            },
            { /*anim:optimization*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Two ways to the top',
              body: r`A feasible region with nine corners, and a profit that grows towards the top right (the dashed lines are equal-profit lines). The {coral:simplex method} starts at a corner and walks along the edges, one better corner at a time. An {blue:interior-point method} starts in the middle and heads straight for the answer.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 440,
                animate: { param: 't', speed: 0.8, max: 7.5, autoplay: true },
                under: ({ plot, s }) => {
                  const els = [s('path', { d: LP_VERTS.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 2 })];
                  for (let v = -1.2; v <= 1.2; v += 0.3) {
                    const px = -LP_C[1], py = LP_C[0];
                    els.push(s('line', { x1: plot.X(v * LP_C[0] - 2 * px), y1: plot.Y(v * LP_C[1] - 2 * py), x2: plot.X(v * LP_C[0] + 2 * px), y2: plot.Y(v * LP_C[1] + 2 * py), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 6', opacity: 0.6 }));
                  }
                  return els;
                },
                clipExtra: true,
                extra: ({ plot, p, s }) => {
                  const n = LP_SIMPLEX.length - 1, T = Math.min(p.t, 6), els = [];
                  // simplex: one edge per time unit (spread over 6 units)
                  const u = (T / 6) * n, k = Math.min(n - 1, Math.floor(u)), f = Math.min(1, u - k);
                  const sp = LP_SIMPLEX.slice(0, k + 1).concat([[LP_SIMPLEX[k][0] + (LP_SIMPLEX[k + 1][0] - LP_SIMPLEX[k][0]) * f, LP_SIMPLEX[k][1] + (LP_SIMPLEX[k + 1][1] - LP_SIMPLEX[k][1]) * f]]);
                  const line = (pts, col, w) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
                  els.push(line(sp, 'coral', 4));
                  LP_SIMPLEX.slice(0, k + 1).forEach(([x, y]) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: 'fl-coral' })));
                  // move along the central path at a steady speed (by length, not by μ)
                  const cum = [0];
                  for (let i = 1; i < LP_CENTRAL.length; i++) cum.push(cum[i - 1] + Math.hypot(LP_CENTRAL[i][0] - LP_CENTRAL[i - 1][0], LP_CENTRAL[i][1] - LP_CENTRAL[i - 1][1]));
                  const goal = (T / 6) * cum[cum.length - 1], ip = [LP_CENTRAL[0]];
                  for (let i = 1; i < LP_CENTRAL.length; i++) {
                    if (cum[i] <= goal) { ip.push(LP_CENTRAL[i]); continue; }
                    const w = (goal - cum[i - 1]) / (cum[i] - cum[i - 1]);
                    ip.push([LP_CENTRAL[i - 1][0] + (LP_CENTRAL[i][0] - LP_CENTRAL[i - 1][0]) * w, LP_CENTRAL[i - 1][1] + (LP_CENTRAL[i][1] - LP_CENTRAL[i - 1][1]) * w]);
                    break;
                  }
                  els.push(line(ip, 'blue', 3.5));
                  const [ex, ey] = sp[sp.length - 1], [bx, by] = ip[ip.length - 1];
                  els.push(s('circle', { cx: plot.X(ex), cy: plot.Y(ey), r: 8, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 }));
                  els.push(s('circle', { cx: plot.X(bx), cy: plot.Y(by), r: 8, class: 'fl-blue', stroke: 'var(--card)', 'stroke-width': 2 }));
                  return els;
                },
                readout: (p) => { const n = LP_SIMPLEX.length - 1, k = Math.min(n, Math.floor((Math.min(p.t, 6) / 6) * n + 1e-9)); return `simplex: ${k} of ${n} edges walked · interior path: ${p.t >= 6 ? 'arrived' : 'cutting through the middle'}`; },
              },
              after: r`The simplex method only ever stands on corners, and here it needs four edge steps. With millions of corners it is usually still quick, but its route can wind around the boundary. Interior-point methods follow a smooth curve, the **central path**, that keeps away from the walls until the very end. Each step costs more work, but the number of steps grows very slowly with the size of the problem.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A different route',
              prompt: r`In 1984, Narendra Karmarkar published a method that cuts through the **interior** of the feasible region instead of walking along its edges. Why might that help?`,
              choices: [
                { t: 'It avoids long walks around the boundary; such interior-point methods are guaranteed fast in the worst case', ok: true },
                { t: 'The interior contains better solutions than the corners', why: 'The optimum is still at a corner (or edge). Interior methods just approach it by a shortcut.' },
                { t: 'It doesn’t help; edges are always faster', why: 'For some carefully built problems the simplex method takes exponentially many steps; interior-point methods never do.' },
              ],
              explain: r`The simplex method is fast in practice, but contrived examples (Klee and Minty, 1972) force it to visit exponentially many corners. **Interior-point methods** run in polynomial time even in the worst case, and modern solvers use both approaches.`,
            },
          ],
          recap: [
            'The simplex method walks from corner to better corner.',
            'Convexity guarantees that a local best corner is the global best.',
            'Interior-point methods take a shortcut through the middle.',
          ],
        },
        {
          id: 'knapsack',
          title: 'The Knapsack Problem',
          summary: 'Whole items only',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Take it or leave it',
              body: r`A hiker's rucksack holds 10 kg. Each item has a weight and a value (how useful it is). You can't take half a tent: each item is in or out. Which items give the most value without exceeding the weight limit?

This is the **knapsack problem**. Because the choices are all-or-nothing, the corner principle no longer applies, and the problem becomes much harder.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Pack the rucksack',
              prompt: r`Switch items on to pack them: tent (5 kg, value 60), stove (3 kg, 50), camera (2 kg, 40), books (4 kg, 30), snacks (1 kg, 15). Find the most valuable load that weighs at most 10 kg.`,
              widget: {
                kind: 'bits', n: 5, value: 0, labels: ITEMS.map((it) => it[0]), colors: ['coral', 'amber', 'blue', 'violet', 'teal'], maxWidth: 500,
                readout: (v, b) => {
                  const { w, v: val } = pack(b);
                  return `weight **${w} kg**${w > 10 ? ' (too heavy!)' : ''} · value **${val}**`;
                },
                goal: (v, b) => { const { w, v: val } = pack(b); return w <= 10 && val === 150; },
                hint: 'Try the three items with the highest values per kilogram first, then check whether a different combination does better.',
                solution: 28,
              },
              explain: r`Tent, stove and camera: exactly 10 kg, value **150**. With only $2^5 = 32$ combinations you can check them all, but with 100 items there are $2^{100} \approx 10^{30}$, far too many.`,
            },
            {
              type: 'mcq',
              title: 'The greedy trap',
              prompt: r`A "greedy" strategy packs items in order of value per kilogram (camera 20, stove 16.7, snacks 15, tent 12, books 7.5), adding each if it fits. What does it achieve here?`,
              choices: [
                { t: 'Value 135 (camera, stove, snacks, books): good, but not the best', ok: true },
                { t: 'The best possible value, 150', why: 'After camera, stove and snacks (6 kg), the tent no longer fits, so greedy takes the books instead.' },
                { t: 'Nothing fits', why: 'Plenty fits: camera, stove, snacks and books weigh exactly 10 kg.' },
              ],
              explain: r`Greedy takes camera, stove and snacks (6 kg), then can't fit the tent (5 kg), so adds the books: value 135. Taking the small snacks blocked the valuable tent. Greedy choices are fast and often decent, but not always optimal.`,
            },
            {
              type: 'numeric',
              title: 'Checking everything',
              prompt: r`With 20 items, each either packed or left behind, how many different selections are there to check by brute force?`,
              unit: 'selections',
              answer: 2 ** 20,
              wrong: [{ v: 400, why: r`Each item doubles the number of choices: $2 \times 2 \times \cdots$, not $20 \times 20$.` }, { v: 2432902008176640000, why: r`That’s 20!, the number of **orders**. Each item is simply in or out: $2^{20}$.` }],
              explain: r`$2^{20} = 1{,}048{,}576$, about a million: easy for a computer. But 100 items give $2^{100} \approx 10^{30}$ selections, far beyond any computer, which is why clever methods (dynamic programming, branch and bound) matter.`,
            },
            {
              type: 'mcq',
              title: 'Cutting the cheese',
              prompt: r`In the **fractional** knapsack problem you may take part of an item (like a block of cheese). Which strategy is optimal then?`,
              choices: [
                { t: r`Greedy: take items in order of value per kilogram, splitting the last one`, ok: true },
                { t: r`Still check every subset`, why: r`With divisible items the greedy choice provably can’t be beaten.` },
                { t: r`Take the most valuable items first`, why: r`Value alone ignores weight; value per kilogram is what matters.` },
              ],
              explain: r`Allowing fractions removes the all-or-nothing dilemma that makes the ordinary knapsack hard. It becomes a simple linear programme, solved instantly by sorting.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How hard?',
              prompt: r`What is known about solving the knapsack problem exactly for many items?`,
              choices: [
                { t: 'It is NP-hard: no known algorithm solves every case fast, though clever methods handle realistic sizes', ok: true },
                { t: 'It can always be solved instantly by sorting', why: 'Sorting by value density gives the greedy answer, which we just saw can be wrong.' },
                { t: 'It has been proved impossible to solve', why: 'It’s solvable, just potentially slowly: checking all combinations always works, eventually.' },
              ],
              explain: r`Knapsack is one of Richard Karp's 21 classic NP-complete problems (1972). Yet a dynamic-programming method solves it quickly when weights are small whole numbers, and branch-and-bound solvers handle thousands of items. It appears in budgeting, cargo loading and cutting materials.`,
            },
          ],
          recap: [
            'In the knapsack problem, items are all-or-nothing.',
            'Greedy (best value per kilogram first) is fast but can miss the optimum.',
            'Exact knapsack is NP-hard in general, though practical methods work well.',
          ],
        },
        {
          id: 'assignment',
          title: 'Assignment Problems',
          summary: 'Who does which job?',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Matching workers to jobs',
              body: r`Three workers, three jobs, and a table of how many hours each worker needs for each job:

| | painting | wiring | plumbing |
|---|---|---|---|
| Ana | 9 | 2 | 7 |
| Ben | 6 | 4 | 3 |
| Cleo | 5 | 8 | 1 |

Each worker gets exactly one job. Which assignment minimises the total hours?`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the best assignment',
              prompt: r`Step through the six possible assignments and find the one with the smallest total.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 200,
                params: { k: { min: 0, max: 5, step: 1, value: 0, label: 'assignment', color: 'violet', format: (v) => `#${v + 1}` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  WORKERS.forEach((wk, w) => {
                    const y = 3.3 - w * 1.2, j = PERMS[p.k][w];
                    els.push(s('text', { x: plot.X(1.2), y: plot.Y(y) + 6, class: 'lbl', 'text-anchor': 'middle', text: wk }));
                    els.push(s('line', { x1: plot.X(2), x2: plot.X(6.6), y1: plot.Y(y), y2: plot.Y(3.3 - j * 1.2), stroke: 'var(--violet)', 'stroke-width': 3 }));
                    els.push(s('text', { x: plot.X(3.1), y: plot.Y(y + 0.24 * (3.3 - j * 1.2 - y)) - 6, class: 'tick halo-text', 'text-anchor': 'middle', text: `${COST[w][j]} h` })); // near the worker, so crossing lines never stack their labels
                  });
                  JOBS.forEach((jb, j) => els.push(s('text', { x: plot.X(8.2), y: plot.Y(3.3 - j * 1.2) + 6, class: 'lbl', 'text-anchor': 'middle', text: jb })));
                  return els;
                },
                readout: (p) => `total: **${assignCost(p.k)} hours**`,
                goal: (p) => assignCost(p.k) === 9,
                hint: 'Notice Ana is fastest at wiring and Cleo at plumbing.',
                solution: { k: 2 },
              },
              explain: r`Ana → wiring (2), Ben → painting (6), Cleo → plumbing (1): **9 hours**. Note that Ben doesn't get his best job (plumbing, 3 h); the overall optimum sometimes asks individuals to compromise.`,
            },
            {
              type: 'numeric',
              title: 'How many assignments?',
              prompt: r`With 10 workers and 10 jobs, how many different one-to-one assignments are there?`,
              answer: 3628800,
              wrong: [{ v: 100, why: 'The first worker has 10 choices, the next 9, and so on: 10!' }],
              explain: r`$10! = 3{,}628{,}800$. With 30 workers, $30! \approx 2.7 \times 10^{32}$: brute force is hopeless. Yet the **Hungarian method** (Kuhn, 1955, based on work by Kőnig and Egerváry) solves assignment problems in polynomial time.`,
            },
            {
              type: 'mcq',
              title: 'The Hungarian method',
              prompt: r`In 1955 Harold Kuhn published a fast algorithm for the assignment problem, naming it after two Hungarian mathematicians whose work it built on. Roughly how does its running time grow with $n$ workers and jobs?`,
              choices: [
                { t: r`Like $n^3$: about a million steps for 100 workers`, ok: true },
                { t: r`Like $n!$, the number of assignments`, why: r`That’s brute force. The algorithm avoids checking every assignment.` },
                { t: r`Like $2^n$`, why: r`Exponential growth would make 100 workers hopeless. The Hungarian method is polynomial.` },
              ],
              explain: r`Its running time grows like $n^3$ (in its improved form), so assigning 100 workers to 100 jobs takes about a million steps, versus $100! \approx 10^{158}$ assignments to check by brute force. It’s used for scheduling, ride-sharing and even matching particle tracks in physics experiments.`,
            },
            {
              type: 'numeric',
              title: 'Polynomial time',
              prompt: r`The Hungarian method takes roughly $n^3$ steps for $n$ workers. About how many steps is that for 100 workers?`,
              answer: 1e6,
              relTol: 0.001,
              explain: r`$100^3 = 1{,}000{,}000$ steps, a fraction of a second, compared with $100! \approx 9 \times 10^{157}$ assignments to check by brute force.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Easy despite whole numbers',
              prompt: r`Assignment problems require whole numbers (a worker can't do half a job), like knapsack. Yet they're easy to solve. Why?`,
              choices: [
                { t: 'Their linear program’s corners automatically have whole-number coordinates, so ordinary LP methods give integer answers', ok: true },
                { t: 'They’re small in practice', why: 'They’re easy even when huge: the structure of the constraints is special.' },
                { t: 'Because there’s always a greedy solution', why: 'Greedy can fail here too. The real reason is the special structure of the constraints.' },
              ],
              explain: r`The constraints of an assignment problem have a special form ("totally unimodular"), which guarantees every corner of its feasible region has whole-number coordinates. So ordinary linear programming solves it exactly. Spotting such structure is a key skill in optimisation.`,
            },
          ],
          recap: [
            'Assignment problems match workers to jobs at minimum total cost.',
            'Brute force grows like n!, but the Hungarian method is fast.',
            'Special structure can make whole-number problems easy.',
          ],
        },
      ],
    },
  ],
};
