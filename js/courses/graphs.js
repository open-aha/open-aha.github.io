const r = String.raw;

// "house of Nicholas": envelope house drawable in one stroke
const HOUSE = {
  nodes: [[220, 310, '1'], [380, 310, '2'], [220, 170, '3'], [380, 170, '4'], [300, 50, '5']],
  edges: [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 4], [0, 3], [1, 2]],
};
const pentagon = Array.from({ length: 5 }, (_, k) => {
  const a = -Math.PI / 2 + (2 * Math.PI * k) / 5;
  return [300 + 130 * Math.cos(a), 175 + 130 * Math.sin(a), ''];
});
const C5 = { nodes: pentagon, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] };
const W5 = { nodes: [...pentagon, [300, 175, '']], edges: [...C5.edges, [5, 0], [5, 1], [5, 2], [5, 3], [5, 4]] };
const ROAD = {
  nodes: [[60, 170, 'A'], [200, 60, 'B'], [200, 280, 'C'], [400, 60, 'D'], [540, 170, 'E'], [400, 280, 'F']],
  edges: [[0, 1], [0, 2], [2, 1], [1, 3], [2, 5], [3, 5], [3, 4], [5, 4]],
  weights: [4, 2, 1, 5, 9, 2, 6, 3],
};

// octahedron drawn flat: every vertex has degree 4
const OCT_FLAT = [[300, 30, ''], [70, 315, ''], [530, 315, ''], [300, 250, ''], [365, 150, ''], [235, 150, '']];
const OCT_EDGES = [[0, 1], [0, 2], [0, 4], [0, 5], [1, 2], [1, 3], [1, 5], [2, 3], [2, 4], [3, 4], [3, 5], [4, 5]];
// cube graph with binary labels: neighbours differ in exactly one digit
const CUBE = {
  nodes: [[150, 40, '000'], [450, 40, '001'], [450, 300, '011'], [150, 300, '010'], [240, 110, '100'], [360, 110, '101'], [360, 230, '111'], [240, 230, '110']],
  edges: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]],
  r: 22,
};
const petersen = Array.from({ length: 10 }, (_, k) => {
  const a = -Math.PI / 2 + (2 * Math.PI * (k % 5)) / 5, rad = k < 5 ? 150 : 68;
  return [300 + rad * Math.cos(a), 178 + rad * Math.sin(a), ''];
});
const PETERSEN = {
  nodes: petersen, h: 350,
  edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 7], [7, 9], [9, 6], [6, 8], [8, 5], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9]],
};
// weighted graph for the cheapest-network (spanning tree) puzzle
const TOWNS = {
  nodes: [[80, 90, 'A'], [250, 40, 'B'], [420, 70, 'C'], [540, 190, 'D'], [400, 300, 'E'], [210, 290, 'F'], [300, 170, 'G']],
  edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 0], [6, 1], [6, 2], [6, 4], [6, 5]],
  weights: [7, 3, 9, 4, 8, 5, 10, 6, 2, 11, 1],
};
const GRID3 = {
  nodes: Array.from({ length: 9 }, (_, i) => [180 + 120 * (i % 3), 50 + 120 * Math.floor(i / 3), '']),
  edges: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]],
};

// dodecahedron flattened (Hamilton's Icosian game)
const DODECA = {
  nodes: [[300, 25], [462, 142], [400, 333], [200, 333], [138, 142], [300, 83], [356, 118], [407, 160], [390, 224], [366, 286], [300, 290], [234, 286], [210, 224], [193, 160], [244, 118], [328, 156], [346, 210], [300, 243], [254, 210], [272, 156]].map(([x, y]) => [x, y, '']),
  edges: [[0, 1], [0, 5], [1, 2], [1, 7], [2, 3], [2, 9], [3, 4], [3, 11], [4, 0], [4, 13], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 5], [15, 6], [15, 16], [16, 8], [16, 17], [17, 10], [17, 18], [18, 12], [18, 19], [19, 14], [19, 15]],
  r: 13, h: 360,
};
// delivery round: H is home
const ROUND = {
  nodes: [[70, 170, 'H'], [200, 55, 'A'], [200, 285, 'B'], [330, 170, 'C'], [460, 55, 'D'], [460, 285, 'E'], [560, 170, 'F']],
  edges: [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [1, 4], [2, 5], [3, 4], [3, 5], [4, 6], [5, 6], [4, 5]],
  weights: [10, 7, 11, 8, 9, 15, 11, 8, 7, 6, 9, 11],
};
const K33 = {
  nodes: [[150, 60, 'A'], [300, 60, 'B'], [450, 60, 'C'], [150, 280, 'G'], [300, 280, 'W'], [450, 280, 'E']],
  edges: [[0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]],
};
// small world: a ring of 24, each joined to 2 neighbours on each side, plus shortcuts
const SW_N = 24;
const SW_SHORT = [[18, 6], [5, 16], [19, 5], [3, 14], [2, 17], [1, 19], [0, 16], [7, 19], [0, 14], [16, 7], [20, 9], [15, 0]];
const swPos = (i) => [Math.cos(Math.PI / 2 - (2 * Math.PI * i) / SW_N), Math.sin(Math.PI / 2 - (2 * Math.PI * i) / SW_N)];
function swStats(k) {
  const adj = Array.from({ length: SW_N }, () => []);
  const link = (a, b) => { adj[a].push(b); adj[b].push(a); };
  for (let i = 0; i < SW_N; i++) { link(i, (i + 1) % SW_N); link(i, (i + 2) % SW_N); }
  SW_SHORT.slice(0, k).forEach(([a, b]) => link(a, b));
  let tot = 0, max = 0;
  for (let src = 0; src < SW_N; src++) {
    const d = Array(SW_N).fill(-1);
    d[src] = 0;
    const q = [src];
    while (q.length) { const u = q.shift(); for (const v of adj[u]) if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); } }
    tot += d.reduce((a, b) => a + b, 0);
    max = Math.max(max, ...d);
  }
  return { avg: tot / (SW_N * (SW_N - 1)), max };
}

export default {
  id: 'graphs',
  subject: 'math',
  title: 'Graph Theory',
  level: 'Intermediate',
  cover: 'graphs',
  tagline: 'Bridges, routes, maps, tours and small worlds: the mathematics of connections.',
  description: r`A "graph" here means dots joined by lines. From Euler's bridges of Königsberg to GPS routing, map colouring, cheapest networks, the travelling salesperson, untangling puzzles and Euler's formula, discover how this simple idea models friendships, road networks, the internet and more, and why we live in a small world.`,
  chapters: [
    {
      title: 'Paths',
      summary: 'Euler and the bridges.',
      lessons: [
        {
          id: 'konigsberg',
          title: 'The Seven Bridges',
          summary: 'Where graph theory began',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A Sunday stroll',
              body: r`The city of Königsberg had two islands linked to the riverbanks and to each other by seven bridges. Locals wondered: is there a walk that crosses every bridge **exactly once**?`,
              widget: {
                kind: 'figure', w: 600, h: 300, label: 'The seven bridges of Königsberg',
                draw: ({ s }) => [
                  s('path', { d: 'M0 120 C 150 100, 300 140, 600 115 L600 185 C 300 205, 150 165, 0 185 Z', class: 'fl-blue', opacity: 0.25 }),
                  s('ellipse', { cx: 230, cy: 152, rx: 70, ry: 26, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  s('ellipse', { cx: 450, cy: 150, rx: 55, ry: 22, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  ...[[195, 105, 195, 128], [265, 108, 265, 128], [195, 177, 195, 197], [265, 177, 265, 196], [450, 105, 450, 128], [450, 172, 450, 192], [300, 152, 395, 150]].map(([x1, y1, x2, y2]) => s('line', { x1, y1, x2, y2, stroke: 'var(--coral)', 'stroke-width': 9, 'stroke-linecap': 'round' })),
                  s('text', { x: 90, y: 70, class: 'lbl', text: 'North bank' }), s('text', { x: 90, y: 250, class: 'lbl', text: 'South bank' }),
                ],
              },
              prompt: 'Is there such a walk?',
              choices: [
                { t: 'No: it’s impossible', ok: true },
                { t: 'Yes, starting on an island', why: 'People tried for years without success. In 1736 Leonhard Euler proved that no such walk exists, wherever you start.' },
                { t: 'Yes, starting on a bank', why: 'Euler proved that no starting point works.' },
              ],
              explain: r`In 1736, Leonhard Euler proved it's impossible, and in doing so founded **graph theory**. His key insight: the shapes and distances don't matter, only **what connects to what**.`,
            },
            {
              type: 'explain',
              title: 'Dots and lines',
              body: r`Euler turned each land mass into a dot (a **vertex**) and each bridge into a line (an **edge**). The **degree** of a vertex is the number of edges touching it.

Walking through a vertex uses two edges: one in, one out. So every vertex you pass **through** needs an even degree. Only the start and the end of a walk can have odd degree.

::: key
A walk using every edge exactly once (an **Euler path**) exists only if the graph is connected and has **0 or 2** vertices of odd degree. With 2, it must start at one of them and end at the other.
:::

In Königsberg, all four land masses had odd degree (5, 3, 3, 3). Hopeless.`,
            },
            {
              type: 'interactive',
              title: 'Draw the house',
              body: r`A classic puzzle: draw this "house" in one continuous stroke, without lifting your pen or repeating a line. Tap the points in order.`,
              widget: { kind: 'network', mode: 'trace', ...HOUSE, solution: [0, 1, 2, 0, 3, 2, 4, 3, 1] },
              hint: 'Count the lines at each point. Which points have an odd number? Start at one of those.',
              explain: r`Points 1 and 2 (the bottom corners) have degree 3, and the others have even degree. So the path must start at one bottom corner and finish at the other. For example: 1 → 2 → 3 → 1 → 4 → 3 → 5 → 4 → 2.`,
            },
            {
              type: 'interactive',
              title: 'Back where you started',
              body: r`Every point in this drawing has degree 4. Draw every line exactly once.`,
              widget: { kind: 'network', mode: 'trace', nodes: OCT_FLAT, edges: OCT_EDGES, solution: [0, 1, 2, 0, 4, 2, 3, 1, 5, 3, 4, 5, 0] },
              hint: 'Any starting point works. Avoid cutting off part of the drawing that you can no longer get back to.',
              explain: r`With no odd vertices, you can start **anywhere**, and you always finish where you started. A closed walk using every edge once is an **Euler circuit**. For example: top → bottom-left → bottom-right → top → right → bottom-right → middle → bottom-left → left → middle → right → left → top.`,
            },
            {
              type: 'mcq',
              title: 'The street sweeper',
              prompt: 'A street-sweeping truck must drive along every street of a district exactly once and finish back at its depot. What must be true of the street map?',
              choices: [
                { t: 'Every junction has an even number of streets', ok: true },
                { t: 'Exactly two junctions have an odd number of streets', why: 'That gives an Euler path, but it ends at a different junction from where it started.' },
                { t: 'The district has no dead ends', why: 'A dead end is a junction of degree 1, which is odd, so that rule is part of the answer, but not the whole of it. A junction of degree 3 also breaks the circuit.' },
                { t: 'Nothing: it’s always possible', why: 'Each time the truck passes through a junction it uses two streets, so odd junctions make it impossible.' },
              ],
              explain: r`A closed tour needs **every** degree to be even. When some are odd, the truck must repeat some streets; choosing the cheapest streets to repeat is the "Chinese postman problem", solved in 1962 and used for planning snow-plough and bin-lorry routes.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Fix Königsberg',
              prompt: 'What is the smallest number of new bridges that would make a walk crossing every bridge exactly once possible?',
              cols: 2,
              choices: [
                { t: '1', ok: true },
                { t: '2', why: 'One bridge between two odd vertices makes both of them even, leaving exactly 2 odd vertices.' },
                { t: '0', why: 'All 4 land masses have odd degree. Euler paths need 0 or 2.' },
                { t: '4', why: 'Each new bridge changes the degree of two vertices at once.' },
              ],
              explain: r`One new bridge between two odd-degree land masses makes both even, leaving exactly 2 odd vertices, so an Euler path appears. (Königsberg, now Kaliningrad, was in fact rebuilt with a different set of bridges after the Second World War.)`,
            },
          ],
          recap: [
            'A graph is a set of vertices (dots) joined by edges (lines). Only the connections matter.',
            'An Euler path (every edge exactly once) needs 0 or 2 odd-degree vertices.',
            'Start and end at the odd vertices, if there are any.',
          ],
        },
        {
          id: 'handshake',
          title: 'The Handshake Lemma',
          summary: 'Counting degrees',
          icon: 'hand',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Total degree',
              prompt: 'A graph has 7 edges. What is the sum of the degrees of all its vertices?',
              answer: 14,
              wrong: [{ v: 7, why: 'Each edge has two ends, and each end adds 1 to some vertex’s degree.' }],
              explain: r`Each edge has 2 ends, and each end adds 1 to a degree. So the total degree is always $2 \times (\text{number of edges}) = 14$.`,
            },
            {
              type: 'explain',
              title: 'The handshake lemma',
              body: r`::: key
The sum of all the degrees equals twice the number of edges.
:::

At a party, if everyone counts their handshakes and you add up the counts, you get exactly twice the number of handshakes, because each handshake gets counted by both people.

**Consequence:** the number of odd-degree vertices is always **even**. (The total is even, and even-degree vertices contribute an even amount, so the odd ones must come in pairs.)`,
            },
            {
              type: 'mcq',
              title: 'Possible party?',
              prompt: 'Can 5 people each shake hands with exactly 3 of the others?',
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`The degrees would add up to $5 \times 3 = 15$, which is odd. But degree sums are always even.` },
              ],
              explain: r`$5 \times 3 = 15$ is odd, but the total degree must be $2 \times$ (number of edges), which is even. So it's impossible, without trying a single arrangement.`,
            },
            {
              type: 'numeric',
              title: 'Everybody shakes hands',
              prompt: 'Ten people meet, and every pair shakes hands once. How many handshakes are there?',
              answer: 45,
              wrong: [{ v: 90, why: 'Each handshake has been counted twice, once by each person.' }, { v: 100, why: 'Nobody shakes their own hand, and each handshake involves two people.' }],
              explain: r`Each person has degree 9, so the total degree is $10 \times 9 = 90$, and the number of edges is half that: 45. In general, the **complete graph** $K_n$ (every pair joined) has $\dfrac{n(n-1)}{2}$ edges.`,
            },
            {
              type: 'mcq',
              title: 'Same number of friends',
              body: r`At any party, count how many friends each guest has among the other guests (friendship goes both ways).`,
              prompt: 'Must two guests always have the same count?',
              choices: [
                { t: 'Yes, at every party with at least 2 guests', ok: true },
                { t: 'No: with enough guests, all counts can differ', why: r`With $n$ guests the counts could only be $0, 1, \ldots, n-1$, and $0$ and $n-1$ can't both occur. That leaves $n-1$ possible values for $n$ guests.` },
                { t: 'Only if somebody has no friends there', why: 'It happens at every party, whether or not anyone is friendless.' },
              ],
              explain: r`With $n$ guests, each count is between $0$ and $n - 1$. But if someone is friends with everybody ($n - 1$), nobody can have $0$, and vice versa. So only $n - 1$ values are available for $n$ guests, and by the pigeonhole principle two must share a value. In graph terms: every graph with 2 or more vertices has two vertices of equal degree.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Count the odd ones',
              body: r`A random graph on 9 people: each line is a friendship, each number is a degree. Odd-degree vertices are coral. Try different graphs and compare the total degree with the number of edges.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 340,
                params: { seed: { min: 1, max: 40, step: 1, value: 7, label: 'random graph', color: 'violet', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => { let a = p.seed * 7919; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; const n = 9, deg = Array(n).fill(0), pos = (i) => [Math.cos(Math.PI / 2 + (2 * Math.PI * i) / n), Math.sin(Math.PI / 2 + (2 * Math.PI * i) / n)], out = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (u() < 0.3) { deg[i]++; deg[j]++; const [x1, y1] = pos(i), [x2, y2] = pos(j); out.push(s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: 'var(--ink-3)', 'stroke-width': 1.8 })); } for (let i = 0; i < n; i++) { const [x, y] = pos(i); out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 15, class: deg[i] % 2 ? 'fl-coral' : 'fl-teal' }), s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--card)', text: String(deg[i]) })); } return out; },
                readout: (p) => { let a = p.seed * 7919; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; const n = 9, deg = Array(n).fill(0); let E = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (u() < 0.3) { deg[i]++; deg[j]++; E++; } const odd = deg.filter((d) => d % 2).length; return `total degree **${deg.reduce((x, y) => x + y, 0)}** = 2 × **${E}** edges · odd-degree vertices: **${odd}**`; },
              },
              after: r`Every edge adds 1 to the degree of each of its two ends, so the total degree is always twice the number of edges, an even number. And since the even degrees add to an even number, the odd ones must too: there is always an **even** number of odd-degree vertices.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How many edges?',
              prompt: 'A graph has 6 vertices, and every vertex has degree 4. How many edges does it have?',
              answer: 12,
              wrong: [{ v: 24, why: 'That’s the total degree. Each edge counts twice, so halve it.' }, { v: 10, why: r`Total degree $= 6 \times 4 = 24$, so there are $24 / 2$ edges.` }],
              explain: r`Total degree $6 \times 4 = 24 = 2 \times \text{edges}$, so there are 12 edges. (An octahedron is a graph exactly like this.)`,
            },
          ],
          recap: [
            'The sum of the degrees = 2 × the number of edges.',
            'Every graph has an even number of odd-degree vertices.',
            'Counting the same thing two ways is a powerful proof technique.',
          ],
        },
      ],
    },
    {
      title: 'Routes, Colours and Trees',
      summary: 'Graphs at work.',
      lessons: [
        {
          id: 'shortest',
          title: 'Shortest Paths',
          summary: 'How maps find routes',
          icon: 'target',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Find the route',
              body: r`Numbers on the roads are travel times in minutes.`,
              widget: { kind: 'network', mode: 'view', ...ROAD },
              prompt: 'What is the shortest travel time from A to E?',
              unit: 'min',
              answer: 13,
              wrong: [
                { v: 15, why: r`That's A → B → D → E. Is there a sneakier route? Going from A to B via C is faster than the direct road.` },
                { v: 14, why: r`That's A → C → F → E. Try going A → C → B → D → F → E.` },
              ],
              hint: 'Work outward from A, writing down the fastest known time to reach each point.',
              explain: r`Fastest times from A: C = 2, B = 3 (via C, beating the direct 4), D = 8, F = 10 (via D, beating 11 via C), E = 13 (via F, beating 14 via D). The best route is A → C → B → D → F → E, with 5 roads but only 13 minutes.`,
            },
            {
              type: 'explain',
              title: 'Dijkstra’s algorithm',
              body: r`The method you just used is **Dijkstra's algorithm** (1956):

1. Give the start a distance of 0 and every other point a distance of ∞.
2. Pick the unvisited point with the smallest known distance and mark it as visited.
3. Update its neighbours: if going through it gives a shorter distance, record that.
4. Repeat until you reach the destination.

Map apps run (much refined) versions of this on graphs with millions of junctions and roads.`,
            },
            {
              type: 'numeric',
              title: 'Fewest roads',
              body: r`A cyclist doesn't care about travel times on the same map, only about the number of roads (each road means another hill).`,
              prompt: 'What is the smallest number of roads on a route from A to E?',
              answer: 3,
              wrong: [{ v: 5, why: 'That’s the fastest route, but it uses many roads. Ignore the numbers and count roads.' }, { v: 2, why: 'No point is joined to both A and E.' }],
              explain: r`A → B → D → E or A → C → F → E both use 3 roads. Without weights, a simpler method works: label A's neighbours "1", their new neighbours "2", and so on, spreading out in rings (**breadth-first search**). Social networks use this to find "degrees of separation".`,
            },
            {
              type: 'numeric',
              title: 'Traffic jam',
              body: r`An accident on the road between D and F raises its travel time from 2 to 10 minutes. Every other road is unchanged.`,
              prompt: 'What is the fastest time from A to E now?',
              unit: 'min',
              answer: 14,
              wrong: [{ v: 13, why: 'The old best route used the road from D to F, which now takes 10 minutes.' }, { v: 15, why: 'A → B → D → E is 15, but going to B via C saves a minute.' }, { v: 21, why: 'That still uses the jammed road. Find a way around it.' }],
              explain: r`Two routes tie at 14 minutes: A → C → B → D → E $(2+1+5+6)$ and A → C → F → E $(2+9+3)$. Live traffic updates simply change the weights and rerun the search, which is why your map app suddenly reroutes you.`,
            },
            {
              type: 'numeric',
              title: 'Counting shortest routes',
              body: r`In a city laid out as a square grid of 3 × 3 blocks, you walk from the bottom-left corner to the top-right corner, always heading east or north.`,
              widget: {
                kind: 'figure', w: 600, h: 260, label: 'A grid of 3 by 3 city blocks',
                draw: ({ s }) => [
                  ...[0, 1, 2, 3].flatMap((k) => [
                    s('line', { x1: 200 + 60 * k, y1: 30, x2: 200 + 60 * k, y2: 210, stroke: 'var(--ink-3)', 'stroke-width': 3 }),
                    s('line', { x1: 200, y1: 30 + 60 * k, x2: 380, y2: 30 + 60 * k, stroke: 'var(--ink-3)', 'stroke-width': 3 }),
                  ]),
                  s('polyline', { points: '200,210 260,210 260,150 320,150 320,90 380,90 380,30', fill: 'none', stroke: 'var(--coral)', 'stroke-width': 5, 'stroke-linejoin': 'round' }),
                  s('circle', { cx: 200, cy: 210, r: 9, class: 'fl-teal' }), s('circle', { cx: 380, cy: 30, r: 9, class: 'fl-coral' }),
                  s('text', { x: 186, y: 240, class: 'lbl', text: 'start' }), s('text', { x: 392, y: 34, class: 'lbl', text: 'finish' }),
                ],
              },
              prompt: 'How many different shortest routes are there? (One is shown.)',
              answer: 20,
              wrong: [{ v: 6, why: 'Every route is 6 blocks long: 3 east and 3 north. In how many orders can you arrange them?' }, { v: 9, why: 'Count the orders of 3 E’s and 3 N’s, such as ENENEN or EEENNN.' }, { v: 720, why: r`That's $6!$, but the three E's are identical, and so are the three N's. Divide by $3! \times 3!$.` }],
              hint: 'Each shortest route is a string of 3 E’s and 3 N’s. Or write at each corner the number of ways to reach it: it’s the sum of the numbers from the south and the west.',
              explain: r`A shortest route chooses which 3 of its 6 blocks go east: $\binom{6}{3} = 20$. Writing the number of routes at each corner (each is the sum of the corner to the south and to the west) rebuilds Pascal's triangle. Most graphs have many tied shortest paths, and map apps pick among them using other preferences.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Greedy fails',
              prompt: 'A “greedy” driver always takes the shortest road leaving their current junction (without going back). Is this guaranteed to find the fastest route to their destination?',
              choices: [
                { t: 'No: locally best choices can lead to a worse overall route', ok: true },
                { t: 'Yes, always', why: 'Greedy choices only look one step ahead. Picture a 1-minute road from A that leads only to a 100-minute road to E, beside a 5-minute road straight from A to E.' },
                { t: 'Yes, provided every road time is positive', why: 'Positive times are what Dijkstra’s algorithm needs, but the greedy driver can still be lured onto a cheap first road that leads somewhere slow.' },
              ],
              explain: r`On the map above greedy happens to work (A → C → B → D → F → E). But imagine a 1-minute road from A that leads only to a 100-minute road to E, while a 5-minute road goes straight from A to E: greedy takes the bait. Dijkstra's algorithm avoids this by keeping track of the best known total distance to every point, not just the next road.`,
            },
          ],
          recap: [
            'Weighted graphs model roads, networks and costs.',
            'Dijkstra’s algorithm finds shortest paths by settling the closest point first.',
            'Greedy choices can fail. Keep track of total distances.',
          ],
        },
        {
          id: 'coloring',
          title: 'Colouring',
          summary: 'Maps and schedules',
          icon: 'sparkle',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Colour the pentagon',
              body: r`Colour the points so that no line joins two points of the same colour, using as few colours as possible. Tap a point to change its colour.`,
              widget: { kind: 'network', mode: 'color', ...C5, k: 3, maxColors: 3, solution: [1, 2, 1, 2, 3] },
              explain: r`Two colours aren't enough: going around an **odd** cycle, alternating two colours always clashes when you get back to the start. Three colours work.`,
            },
            {
              type: 'interactive',
              title: 'Add a hub',
              body: r`Now there's a hub point joined to all five others. Colour it properly using as few colours as you can.`,
              widget: { kind: 'network', mode: 'color', ...W5, k: 4, maxColors: 4, solution: [1, 2, 1, 2, 3, 4] },
              explain: r`The rim (an odd cycle) needs 3 colours, and the hub touches all of them, so it needs a 4th. This "wheel" graph needs exactly 4 colours.`,
            },
            {
              type: 'explain',
              title: 'The four colour theorem',
              body: r`Colour a map so that neighbouring countries get different colours. Turn each country into a vertex, with an edge between neighbours, and it's a graph colouring problem.

The **four colour theorem** says every flat map can be coloured with at most 4 colours. It was conjectured in 1852 and finally proved in 1976 by Kenneth Appel and Wolfgang Haken. It was the first major theorem whose proof relied on a computer, which checked almost 2000 special cases.`,
            },
            {
              type: 'interactive',
              title: 'Two colours?',
              body: r`This is a cube, flattened. Can you colour it with only **two** colours?`,
              widget: { kind: 'network', mode: 'color', ...CUBE, nodes: CUBE.nodes.map(([x, y]) => [x, y, '']), k: 2, maxColors: 2, solution: [1, 2, 1, 2, 2, 1, 2, 1] },
              hint: 'Colour one corner, then give all its neighbours the other colour, and keep going.',
              explain: r`It works: every cycle in a cube has even length (4 or 6 or 8), so alternating colours never clashes. Graphs that can be 2-coloured are called **bipartite**: the vertices split into two groups with every edge going between the groups.

::: key
A graph can be coloured with 2 colours exactly when it has **no odd cycle**.
:::`,
            },
            {
              type: 'interactive',
              title: 'The Petersen graph',
              body: r`This famous graph appears as a counterexample all over graph theory. How few colours does it need?`,
              widget: { kind: 'network', mode: 'color', ...PETERSEN, k: 3, maxColors: 3, solution: [1, 2, 1, 2, 3, 2, 1, 3, 3, 2] },
              hint: 'The outer ring is a 5-cycle, so 2 colours can’t work. Try 3, colouring the outer ring first and then each inner point to avoid its three neighbours.',
              explain: r`The outer pentagon is an odd cycle, so at least 3 colours are needed, and 3 suffice. Colouring by hand gets hard quickly: deciding whether a general graph can be 3-coloured is NP-complete, in the same family as the travelling salesperson problem. (A Sudoku is also a colouring puzzle: 81 cells, 9 colours, and edges between cells in the same row, column or box.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Exam timetable',
              body: r`Five exams: Maths, Physics, Chemistry, Biology, Art. Some students take both exams in each of these pairs, so those pairs can't be at the same time: Maths–Physics, Maths–Chemistry, Physics–Chemistry, Chemistry–Biology, Biology–Art.`,
              prompt: 'What is the minimum number of time slots needed?',
              answer: 3,
              wrong: [{ v: 2, why: 'Maths, Physics and Chemistry all clash with each other (a triangle), so they need 3 different slots.' }, { v: 5, why: 'Exams that don’t clash can share a slot. Try colouring the clash graph.' }],
              explain: r`Make each exam a vertex, with an edge for each clash. Maths, Physics and Chemistry form a triangle, so at least 3 slots are needed. Three is enough: {Maths, Biology}, {Physics, Art}, {Chemistry}. Scheduling problems like this are graph colouring in disguise.`,
            },
          ],
          recap: [
            'Graph colouring: adjacent vertices get different colours.',
            'Odd cycles need 3 colours. Every flat map needs at most 4 (the four colour theorem).',
            'Timetables and frequency assignments are colouring problems.',
          ],
        },
        {
          id: 'trees',
          title: 'Trees',
          summary: 'Connected, with no loops',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Connect the towns',
              prompt: 'You must connect 8 towns with roads so that every town can reach every other, using as few roads as possible. How many roads do you need?',
              answer: 7,
              wrong: [{ v: 8, why: 'With 8 roads there’s always a loop, and one road in it could be removed.' }, { v: 28, why: 'That connects every pair directly. You only need each town to be reachable.' }],
              explain: r`7 roads. Each new road can join at most one new town to the network, so you need at least 7, and 7 is enough.`,
            },
            {
              type: 'explain',
              title: 'Trees',
              body: r`A **tree** is a connected graph with no cycles (loops). Every tree with $n$ vertices has exactly $n - 1$ edges.

- Remove any edge from a tree and it falls into two pieces.
- Add any edge and you create exactly one cycle.

Family trees, file folders, and the branching of a river system are all trees.`,
            },
            {
              type: 'mcq',
              title: 'Is it a tree?',
              prompt: 'A connected graph has 10 vertices and 10 edges. Is it a tree?',
              cols: 2,
              choices: [
                { t: 'No: it must contain a cycle', ok: true },
                { t: 'Yes', why: 'A tree with 10 vertices has exactly 9 edges. One more edge creates a cycle.' },
              ],
              explain: r`A connected graph with $n$ vertices and $n$ edges has exactly one more edge than a tree, so it contains exactly one cycle.`,
            },
            {
              type: 'interactive',
              title: 'The cheapest network',
              body: r`The numbers are the costs (in millions) of laying fibre-optic cable between towns. Choose cables so that every town is connected to every other, as cheaply as possible. Tap a line to choose it, and tap again to remove it.`,
              widget: { kind: 'network', mode: 'pick', ...TOWNS, maxWeight: 23, solution: [10, 8, 1, 3, 5, 4] },
              hint: 'Take the cheapest cable, then the next cheapest, skipping any cable that would close a loop.',
              explain: r`The cheapest network costs 23: cables 1 (G–F), 2 (G–C), 3 (B–C), 4 (D–E), 5 (F–A), skipping 6 and 7 because each would close a loop, then 8 (E–F) to bring in D and E. It uses 6 cables for 7 towns, as every tree must.`,
            },
            {
              type: 'explain',
              title: 'Kruskal’s algorithm',
              body: r`The cheapest connected network is a **minimum spanning tree**. You probably used **Kruskal's algorithm** (1956):

1. Sort the edges from cheapest to most expensive.
2. Go through them in order. Add an edge unless it would create a loop.
3. Stop when you have $n - 1$ edges.

Unlike the greedy driver in the shortest-path lesson, greed is **provably optimal** here: the cheapest edge leaving any group of connected towns always belongs to some cheapest network. Spanning trees are used to design power grids, pipelines and computer networks, and even to stop data packets circling forever in office networks.`,
            },
            {
              type: 'numeric',
              title: 'How many trees?',
              body: r`Four towns, A, B, C and D, are to be connected by 3 roads into a tree. One possibility is a straight line A–B–C–D; another is a star with every road meeting at A.`,
              prompt: 'How many different trees connect the four towns?',
              answer: 16,
              wrong: [{ v: 2, why: 'There are only 2 *shapes* (a line and a star), but each shape can be labelled in several ways.' }, { v: 20, why: r`That's the number of ways to choose 3 of the 6 possible roads, but 4 of those choices form a triangle and leave one town out.` }, { v: 12, why: 'The 12 lines are right, but don’t forget the 4 stars, one centred on each town.' }],
              hint: 'Count lines (paths through all four) and stars (one centre joined to the other three) separately.',
              explain: r`Lines: $4!/2 = 12$ orderings (reversals are the same). Stars: 4 choices of centre. Total 16. **Cayley's formula** says there are $n^{n-2}$ trees on $n$ labelled vertices, and $4^2 = 16$. With 10 towns there are already $10^8$ possible trees, which is why Kruskal's shortcut matters.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Knockout tournament',
              prompt: 'A knockout tennis tournament starts with 64 players. How many matches are played in total?',
              answer: 63,
              wrong: [{ v: 32, why: 'That’s just the first round. Count every round, or think about how many players must be eliminated.' }, { v: 64, why: 'Each match eliminates one player, and all but one player are eliminated.' }],
              explain: r`Each match eliminates exactly one player, and 63 players must be eliminated to leave a champion. So there are 63 matches, no round-by-round counting needed. (The bracket itself is a tree.)`,
            },
          ],
          recap: [
            'A tree is connected with no cycles. With n vertices it has n − 1 edges.',
            'Removing an edge from a tree disconnects it. Adding one creates a cycle.',
            'A minimal network connecting n points always has n − 1 links.',
          ],
        },
      ],
    },
    {
      title: 'Tours, Planes and Networks',
      summary: 'Hamilton, Euler’s formula and small worlds.',
      lessons: [
        {
          id: 'hamilton',
          title: 'Hamiltonian Tours',
          summary: 'Visit every point once',
          icon: 'star',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'The Icosian game',
              body: r`In 1857 the mathematician William Rowan Hamilton sold a puzzle based on the 20 corners of a dodecahedron, flattened like this. Find a round trip along the lines that visits **every point exactly once** and returns to the start. Tap the points in order.`,
              widget: { kind: 'network', mode: 'tour', ...DODECA, solution: [0, 1, 2, 3, 4, 13, 12, 11, 10, 9, 8, 7, 6, 15, 16, 17, 18, 19, 14, 5, 0] },
              hint: 'Try going most of the way around the outer pentagon, then spiralling inward through the middle ring and the inner pentagon.',
              explain: r`One solution goes around the outer pentagon, drops into the middle ring, runs around most of it, does a lap of the inner pentagon, and climbs back out to the start. A round trip through every vertex exactly once is called a **Hamiltonian cycle**. (The puzzle sold poorly: people found it too easy on a solid dodecahedron.)`,
            },
            {
              type: 'explain',
              title: 'Euler versus Hamilton',
              body: r`The two puzzles sound alike but behave very differently:

- **Euler**: use every **edge** exactly once. There's a quick test: count the odd-degree vertices.
- **Hamilton**: visit every **vertex** exactly once. Nobody knows a quick test.

::: key
Deciding whether a graph has a Hamiltonian cycle is **NP-complete**: a fast method for it would give fast methods for thousands of other hard problems (see the Algorithms course).
:::

The famous **travelling salesperson problem** asks for the *shortest* Hamiltonian cycle when the edges have lengths.`,
            },
            {
              type: 'mcq',
              title: 'A 3 × 3 grid',
              widget: { kind: 'network', mode: 'view', ...GRID3 },
              prompt: 'Is there a round trip along the lines that visits all 9 points exactly once?',
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: 'Colour the points like a chessboard: 5 of one colour and 4 of the other. Each step changes colour, so a round trip must use equal numbers of each.' },
              ],
              explain: r`Colour the points like a chessboard: the corners and centre are dark (5 points), and the edge midpoints are light (4 points). Every line joins a dark point to a light one, so a round trip alternates colours and must contain equally many of each. With 5 and 4, it's impossible. Parity arguments like this can sometimes rule out a Hamiltonian cycle quickly; in general nothing so simple works.`,
            },
            {
              type: 'interactive',
              title: 'One digit at a time',
              body: r`This is a cube again, with each corner labelled by a 3-digit binary code. Neighbouring corners differ in exactly **one** digit. Find a round trip through all 8 codes.`,
              widget: { kind: 'network', mode: 'tour', ...CUBE, solution: [0, 1, 2, 3, 7, 6, 5, 4, 0] },
              hint: 'Go around the outer square first, then cross to the inner square and go around it the other way.',
              explain: r`For example 000 → 001 → 011 → 010 → 110 → 111 → 101 → 100 → back to 000. A list of all codes in which consecutive codes differ in one digit is a **Gray code**. Rotary encoders (in volume knobs and robot joints) use one, so a sensor caught halfway between two positions can never misread by more than one step.`,
            },
            {
              type: 'interactive',
              title: 'Delivery round',
              body: r`A van leaves home (H), must visit A to F, and return to H. The numbers are driving times in minutes. Find a round that takes **59 minutes or less**.`,
              widget: { kind: 'network', mode: 'tour', ...ROUND, maxLength: 59, solution: [0, 1, 3, 4, 6, 5, 2, 0] },
              hint: 'The 15-minute road from A to D is expensive. Can you avoid it?',
              explain: r`The best round is H → A → C → D → F → E → B → H: $10 + 8 + 8 + 6 + 9 + 11 + 7 = 59$ minutes. With 7 stops you can check every round by hand, but the number of rounds grows factorially, so real delivery firms use clever approximations.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Nearest neighbour',
              body: r`A simple rule for planning a round: from wherever you are, drive to the **closest** stop you haven't visited yet. When every stop is done, drive home.`,
              prompt: 'Starting from H on the same map, how long is the round that this rule produces?',
              unit: 'min',
              answer: 63,
              wrong: [{ v: 59, why: 'That’s the best round. Follow the rule exactly: from H the closest stop is B (7), not A (10).' }, { v: 48, why: 'Don’t forget the drive home at the end.' }],
              hint: 'From H: the nearest is B (7). From B: compare C (9) and E (11). Keep going, never revisiting a stop.',
              explain: r`H → B (7) → C (9) → E (7) → F (9) → D (6) → A (15) → H (10) $= 63$ minutes, 4 minutes worse than the best. The early greedy choices left only the slow 15-minute road for the end. Practical route planners start with a quick rule like this and then improve the round, for example by reversing a section whenever that makes it shorter ("2-opt").`,
            },
          ],
          recap: [
            'A Hamiltonian cycle visits every vertex exactly once and returns to the start.',
            'Unlike Euler paths, there is no known quick test: the problem is NP-complete.',
            'Parity (chessboard colouring) can sometimes prove that no cycle exists.',
            'Quick rules like nearest neighbour give good tours, but not always the best.',
          ],
        },
        {
          id: 'planar',
          title: 'Planar Graphs',
          summary: 'Drawing without crossings',
          icon: 'pencil',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Untangle',
              body: r`Drag the points so that no two lines cross. (The lines stay straight and follow the points.)`,
              widget: { kind: 'network', mode: 'drag', nodes: [[100, 45, ''], [212, 217, ''], [483, 78, ''], [103, 272, ''], [255, 145, ''], [463, 199, '']], edges: OCT_EDGES, solution: OCT_FLAT.map(([x, y]) => [x, y]) },
              hint: 'Find a triangle of three points that are joined to each other and spread it out wide. Then place the other three inside it.',
              explain: r`It untangles into a big triangle with a smaller, upside-down triangle inside. A graph that can be drawn with no crossings is called **planar**. This one is the octahedron, flattened.`,
            },
            {
              type: 'explain',
              title: 'Faces and Euler’s formula',
              body: r`A planar drawing cuts the page into regions called **faces**. The unbounded region outside the drawing counts as a face too.

::: key
For any connected planar drawing,
$$V - E + F = 2$$
where $V$ is the number of vertices, $E$ the edges and $F$ the faces.
:::

Why? Start from a single vertex: $1 - 0 + 1 = 2$. Adding an edge to a new vertex adds one $V$ and one $E$. Adding an edge between existing vertices adds one $E$ and splits a face, adding one $F$. Either way, $V - E + F$ never changes.`,
            },
            {
              type: 'numeric',
              title: 'Count the faces',
              prompt: 'The graph you untangled has 6 vertices and 12 edges. How many faces does its untangled drawing have, counting the outside?',
              answer: 8,
              wrong: [{ v: 7, why: 'Don’t forget the outside face.' }, { v: 6, why: r`Use $V - E + F = 2$ with $V = 6$, $E = 12$.` }],
              explain: r`$6 - 12 + F = 2$ gives $F = 8$: the 7 triangles inside the big triangle, plus the outside (itself a triangle). An octahedron has exactly 8 triangular faces. Flattening a solid like this keeps $V$, $E$ and $F$, which is why Euler's formula also holds for every convex polyhedron.`,
            },
            {
              type: 'interactive',
              title: 'A bigger tangle',
              body: r`Nine points and sixteen lines. Untangle them.`,
              widget: { kind: 'network', mode: 'drag', nodes: [[169, 58, ''], [85, 52, ''], [267, 171, ''], [482, 101, ''], [124, 294, ''], [311, 67, ''], [83, 129, ''], [397, 266, ''], [247, 280, '']], edges: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8], [1, 3], [1, 5], [3, 7], [5, 7]], solution: Array.from({ length: 9 }, (_, i) => [150 + 150 * (i % 3), 60 + 110 * Math.floor(i / 3)]) },
              hint: 'One point is joined to four others that form a ring around it. Put that point in the middle.',
              explain: r`It's a 3 × 3 grid with a diamond around the centre point: 4 corner triangles, 4 inner triangles and the outside, so $F = 9$, and indeed $9 - 16 + 9 = 2$.`,
            },
            {
              type: 'mcq',
              title: 'Three utilities',
              widget: { kind: 'network', mode: 'view', ...K33, caption: 'Houses A, B, C; gas (G), water (W) and electricity (E)' },
              body: r`A classic puzzle: connect each of three houses to each of three utilities, with no pipes or cables crossing (on flat ground, without passing under a house).`,
              prompt: 'Can it be done?',
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: 'Euler’s formula rules it out: see the explanation.' },
              ],
              explain: r`It's impossible. Suppose it could be drawn: $V = 6$, $E = 9$, so $F = 2 - 6 + 9 = 5$. Every pipe joins a house to a utility, so there are no triangles and each face is bounded by at least 4 edges. Each edge borders 2 faces, so $4F \le 2E = 18$, giving $F \le 4$. Contradiction! This graph is called $K_{3,3}$. Kuratowski proved in 1930 that a graph is planar **unless** it contains $K_{3,3}$ or the complete graph $K_5$ hidden inside it.`,
            },
            {
              type: 'numeric',
              title: 'How many lines fit?',
              body: r`In a planar drawing (with at least 3 vertices, and no repeated edges), every face is bounded by at least 3 edges.`,
              prompt: 'What is the largest number of edges a planar graph with 10 vertices can have?',
              answer: 24,
              wrong: [{ v: 45, why: 'That’s every pair joined, which can’t be drawn flat. Use 3F ≤ 2E together with Euler’s formula.' }, { v: 27, why: r`Combine $3F \le 2E$ with $F = 2 - V + E$ to get $E \le 3V - 6$.` }],
              hint: r`Each edge borders 2 faces, so $3F \le 2E$. Substitute $F = 2 - V + E$.`,
              explain: r`From $3F \le 2E$ and $F = 2 - V + E$: $3(2 - V + E) \le 2E$, so $E \le 3V - 6 = 24$. This also proves $K_5$ is not planar: it has $V = 5$ and $E = 10$, but $3 \times 5 - 6 = 9$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Always twelve',
              body: r`A football is stitched from pentagons and hexagons, with three patches meeting at every corner. Engineers design geodesic domes and virus shells the same way, some with hundreds of hexagons.`,
              prompt: 'However many hexagons there are, how many pentagons must such a closed ball have?',
              answer: 12,
              wrong: [{ v: 20, why: 'That’s the number of hexagons on a classic football. Try P pentagons and H hexagons in Euler’s formula: the H terms cancel.' }, { v: 0, why: 'All hexagons can tile a flat plane but cannot close up into a ball. Euler’s formula forces some pentagons.' }, { v: 6, why: r`Count carefully: $E = \frac{5P + 6H}{2}$ and $V = \frac{5P + 6H}{3}$, since 3 patches meet at each corner.` }],
              hint: r`With $P$ pentagons and $H$ hexagons: $F = P + H$, $E = \frac{5P + 6H}{2}$, $V = \frac{5P + 6H}{3}$. Put these into $V - E + F = 2$ and multiply by 6.`,
              explain: r`Multiplying $V - E + F = 2$ by 6: $2(5P + 6H) - 3(5P + 6H) + 6(P + H) = 12$, which simplifies to $P = 12$. The hexagons cancel completely! So every such ball, from a football (20 hexagons) to the C₆₀ "buckyball" molecule to many virus shells, has exactly 12 pentagons.`,
            },
          ],
          recap: [
            'A planar graph can be drawn without crossings. Its drawing has faces, including the outside.',
            'Euler’s formula: V − E + F = 2.',
            'A planar graph with V ≥ 3 has at most 3V − 6 edges, so K₅ is not planar.',
            'K₃,₃ (the utilities puzzle) is not planar either. These two are the only obstacles.',
          ],
        },
        {
          id: 'smallworld',
          title: 'Small Worlds',
          summary: 'Six degrees of separation',
          icon: 'bulb',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Letters to Boston',
              body: r`In 1967 the psychologist Stanley Milgram gave letters to people in Nebraska and Kansas, addressed to a stranger in Massachusetts. Each person could only pass the letter on to someone they knew personally, who would pass it on again, and so on.`,
              prompt: 'Among the letters that arrived, how many people handled a typical letter?',
              choices: [
                { t: 'About 6', ok: true },
                { t: 'About 50', why: 'Far fewer: chains were surprisingly short.' },
                { t: 'About 500', why: 'Far fewer. Most letters never arrived, but those that did took only a handful of steps.' },
                { t: 'About 5000', why: 'Far fewer: the US had 200 million people, but chains were only a few steps long.' },
              ],
              explain: r`Completed chains had about 5 intermediaries, about 6 steps. Many letters were lost on the way, so the experiment is far from conclusive, but later studies of email, phone and social networks keep finding the same thing: almost everyone is linked by short chains. The phrase "**six degrees of separation**" comes from here.`,
            },
            {
              type: 'numeric',
              title: 'Friends of friends',
              body: r`Suppose everyone has 100 friends, and (unrealistically) no two of your friends share any other friends.`,
              prompt: 'What is the smallest number of steps that could reach all 8 billion people?',
              unit: 'steps',
              answer: 5,
              wrong: [{ v: 4, why: r`$100^4 = 10^8$, only 100 million.` }, { v: 6, why: r`$100^5 = 10^{10}$ already exceeds 8 billion.` }],
              explain: r`Within $k$ steps you reach about $100^k$ people: $100^4 = 10^8$ falls short, but $100^5 = 10^{10}$ is more than 8 billion. Exponential growth makes 5 or 6 steps plausible.`,
            },
            {
              type: 'explain',
              title: 'But friends overlap',
              body: r`Real friendships are **clustered**: your friends tend to know each other. Picture a ring of people where everyone knows only their 2 nearest neighbours on each side. That ring is highly clustered, but you would need many steps to reach the far side of it.

So which is it? Clustered networks, where news travels slowly, or tree-like ones with very short chains? In 1998 Duncan Watts and Steven Strogatz found that the answer is **both**.`,
            },
            {
              type: 'interactive',
              title: 'Add shortcuts',
              body: r`24 people stand in a ring, each knowing their 2 nearest neighbours on each side. Add a few long-range friendships (shortcuts) and watch the average number of steps between two people. Bring the average below **2.6** steps.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 440,
                params: { k: { min: 0, max: 12, step: 1, value: 0, label: 'shortcuts' } },
                extra: ({ plot, p, s }) => {
                  const P = Array.from({ length: SW_N }, (_, i) => swPos(i)).map(([x, y]) => [plot.X(x), plot.Y(y)]);
                  const line = ([a, b], cls, w) => s('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: `var(--${cls})`, 'stroke-width': w });
                  return [
                    ...Array.from({ length: SW_N }, (_, i) => [line([i, (i + 1) % SW_N], 'ink-3', 2), line([i, (i + 2) % SW_N], 'ink-3', 1.2)]).flat(),
                    ...SW_SHORT.slice(0, p.k).map((pr) => line(pr, 'coral', 3)),
                    ...P.map(([x, y]) => s('circle', { cx: x, cy: y, r: 7, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2 })),
                  ];
                },
                readout: (p) => { const st = swStats(p.k); return `Average separation **${st.avg.toFixed(2)}** steps · farthest pair **${st.max}** steps`; },
                goal: (p) => swStats(p.k).avg < 2.6,
                solution: { k: 5 },
              },
              hint: 'Each shortcut helps, but the first few help the most.',
              explain: r`With no shortcuts the average is 3.39 steps. The **first** shortcut alone cuts it to 2.99, and 5 shortcuts bring it to 2.58, although almost all of each person's friends are still their neighbours. In big networks the effect is dramatic: in a ring of 1000 people, about 50 random shortcuts (2.5% more links) cut the average from 125 steps to about 17.`,
            },
            {
              type: 'explain',
              title: 'Small worlds everywhere',
              body: r`Watts and Strogatz called networks with high clustering **and** short paths **small worlds**. A handful of random long-range links is all it takes, and they found the pattern in the network of film actors, the US power grid, and the 302 neurons of the worm *C. elegans*.

::: key
In a small world, the typical distance between two vertices grows only like $\log N$, not like $N$: doubling the population adds just a step or so.
:::

This is why gossip, fashions and viruses spread so fast: a disease that reaches one long-range traveller jumps straight across the network.`,
            },
            {
              type: 'mcq',
              title: 'Hubs',
              body: r`In many real networks, such as airline routes and links between websites, a few **hubs** have enormous degree while most vertices have only a few links (the degrees follow a power law).`,
              prompt: 'How does such a network cope with losing vertices?',
              choices: [
                { t: 'It survives random failures well, but removing a few hubs can break it apart', ok: true },
                { t: 'It is fragile to random failures but robust to losing hubs', why: 'It’s the other way round. A random failure almost always hits a minor vertex, but hubs hold the network together.' },
                { t: 'All vertices matter equally', why: 'Most shortest paths pass through the hubs, so they matter far more than typical vertices.' },
              ],
              explain: r`A randomly chosen airport is probably small, and closing it barely affects anyone's journey. Closing a few major hubs strands huge numbers of travellers. The same logic suggests vaccinating or monitoring the best-connected people first to slow an epidemic.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A ring of 1000',
              body: r`1000 people stand in a ring, each knowing only their 2 nearest neighbours on each side. There are no shortcuts.`,
              prompt: 'How many steps away is the person farthest from you?',
              unit: 'steps',
              answer: 250,
              wrong: [{ v: 500, why: 'They are 500 places away, but each step can jump 2 places.' }, { v: 1000, why: 'Go the short way around the ring: the farthest person is 500 places away.' }, { v: 125, why: 'That’s the *average* distance. The question asks for the farthest person.' }],
              explain: r`The farthest person is directly opposite, 500 places away round the ring, and each step jumps at most 2 places: 250 steps. The average distance is about 125. Just 50 random shortcuts bring the farthest pair down to about 40 steps and the average to about 17, which is the essence of a small world.`,
            },
          ],
          recap: [
            'Social networks are small worlds: high clustering, yet short chains between almost anyone.',
            'A few random long-range links shrink typical distances dramatically (like log N).',
            'Hub-dominated networks shrug off random failures but are vulnerable to losing their hubs.',
          ],
        },
      ],
    },
  ],
};
