const r = String.raw;

// ── a small election engine: 3 candidates, 4 ballot types ──
const TYPES = [['A', 'B', 'C'], ['B', 'C', 'A'], ['C', 'B', 'A'], ['C', 'A', 'B']];
const CANDS = ['A', 'B', 'C'];
const COL = { A: 'blue', B: 'coral', C: 'teal' };
function ballots(p) {
  return TYPES.map((t, i) => ({ order: t, n: p[`n${i}`] }));
}
const top = (scores) => {
  const best = Math.max(...Object.values(scores));
  const w = Object.keys(scores).filter((k) => scores[k] === best);
  return w.length === 1 ? w[0] : 'tie';
};
function plurality(bs) {
  const s = { A: 0, B: 0, C: 0 };
  for (const b of bs) s[b.order[0]] += b.n;
  return s;
}
function runoff(bs) {
  const s = plurality(bs);
  const low = Math.min(...Object.values(s));
  const losers = CANDS.filter((c) => s[c] === low);
  if (losers.length > 1) return 'tie';
  const out = losers[0];
  const s2 = {};
  for (const c of CANDS) if (c !== out) s2[c] = 0;
  for (const b of bs) {
    const pick = b.order.find((c) => c !== out);
    s2[pick] += b.n;
  }
  return top(s2);
}
function borda(bs) {
  const s = { A: 0, B: 0, C: 0 };
  for (const b of bs) b.order.forEach((c, i) => (s[c] += (2 - i) * b.n));
  return s;
}
function condorcet(bs) {
  for (const c of CANDS) {
    if (CANDS.every((d) => d === c || bs.reduce((acc, b) => acc + (b.order.indexOf(c) < b.order.indexOf(d) ? b.n : -b.n), 0) > 0)) return c;
  }
  return 'none';
}
const params = (v) => Object.fromEntries(v.map((x, i) => [`n${i}`, { min: 0, max: 10, step: 1, value: x, label: TYPES[i].join(' > '), color: COL[TYPES[i][0]], format: (y) => `${y}` }]));
const electionExtra = ({ plot, p, s }) => {
  const sc = plurality(ballots(p));
  const max = Math.max(1, ...Object.values(sc));
  return CANDS.flatMap((c, i) => {
    const x = 1 + i * 2, hgt = (sc[c] / max) * 2.6;
    return [
      s('rect', { x: plot.X(x - 0.6), y: plot.Y(hgt), width: plot.X(x + 0.6) - plot.X(x - 0.6), height: plot.Y(0) - plot.Y(hgt), rx: 6, class: `fl-${COL[c]}` }),
      s('text', { x: plot.X(x), y: plot.Y(0) + 22, 'text-anchor': 'middle', style: 'font-weight:700;font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))', text: c }),
      s('text', { x: plot.X(x), y: plot.Y(hgt) - 8, 'text-anchor': 'middle', class: 'lbl', text: `${sc[c]} first` }),
    ];
  });
};
const electionReadout = (p) => {
  const bs = ballots(p);
  const name = (w) => (w === 'tie' ? 'tie' : w === 'none' ? 'none (a cycle!)' : `**${w}**`);
  return `Plurality: ${name(top(plurality(bs)))} · Runoff: ${name(runoff(bs))} · Borda: ${name(top(borda(bs)))} · Condorcet: ${name(condorcet(bs))}`;
};

// ── instant runoff monotonicity: k of the B > C > A voters move A to the top ──
const irvBallots = (k) => ({ n0: 6 + k, n1: 6 - k, n2: 0, n3: 5 });
// ── gerrymandering: 5 × 5 grid of voters (1 = orange), three district maps ──
const GRID = [
  [1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1],
  [0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
const MAPS = [
  { name: 'vertical strips', d: (r, c) => c },
  { name: 'horizontal strips', d: (r) => r },
  { name: 'blocks', d: (r, c) => [[0, 0, 1, 1, 1], [0, 0, 1, 1, 2], [0, 3, 2, 2, 2], [3, 3, 3, 3, 2], [4, 4, 4, 4, 4]][r][c] },
];
const districtResults = (m) => {
  const o = [0, 0, 0, 0, 0];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) o[MAPS[m].d(r, c)] += GRID[r][c];
  return o; // orange voters in each district (of 5)
};
// ── Banzhaf power: parties with 4, 3, 2, 1 seats ──
const SEATS = [4, 3, 2, 1];
const swings = (q) => {
  const cnt = [0, 0, 0, 0];
  for (let mask = 0; mask < 16; mask++) {
    const tot = SEATS.reduce((a, w, i) => a + (mask >> i & 1 ? w : 0), 0);
    if (tot >= q) SEATS.forEach((w, i) => { if (mask >> i & 1 && tot - w < q) cnt[i]++; });
  }
  return cnt;
};

export default {
  id: 'voting',
  subject: 'math',
  title: 'Voting & Fairness',
  level: 'Intermediate',
  cover: 'voting',
  tagline: 'Elections, paradoxes, gerrymanders, seats and voting power.',
  description: r`Who "should" win an election? It depends on how you count. Compare voting systems on the same ballots, meet Condorcet's paradox and Arrow's impossibility theorem, watch instant runoff punish a candidate for gaining support, redraw districts to flip an election, see how dividing seats can go strangely wrong, and measure who really holds power.`,
  prereq: 'Logic & Proof',
  chapters: [
    {
      title: 'Counting Votes',
      summary: 'Same ballots, different winners.',
      lessons: [
        {
          id: 'methods',
          title: 'Voting Methods',
          summary: 'Plurality, runoff, Borda',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'One election, nine voters',
              body: r`Nine voters rank three candidates:

| Voters | 1st | 2nd | 3rd |
|---|---|---|---|
| 4 | A | B | C |
| 3 | B | C | A |
| 2 | C | B | A |

Who should win? It depends on the method:
- **Plurality**: most first-choice votes wins.
- **Instant runoff**: drop the candidate with the fewest first choices, move those ballots to their next choice, and repeat.
- **Borda count**: 2 points for 1st place, 1 for 2nd, 0 for 3rd.`,
            },
            {
              type: 'mcq',
              title: 'Plurality',
              prompt: r`Who wins by plurality?`,
              cols: 3,
              choices: [
                { t: 'A', ok: true },
                { t: 'B', why: 'B has 3 first-choice votes. A has 4.' },
                { t: 'C', why: 'C has only 2 first-choice votes.' },
              ],
              explain: r`A has 4 first-choice votes, the most. But 5 of the 9 voters rank A **last**!`,
            },
            {
              type: 'numeric',
              title: 'Borda count',
              prompt: r`What is B's Borda score (2 points for 1st, 1 for 2nd, 0 for 3rd)?`,
              answer: 12,
              wrong: [{ v: 6, why: r`Count B's 2nd places too: the 4 A-voters and the 2 C-voters each give B 1 point.` }, { v: 9, why: r`$3 \times 2 + 4 \times 1 + 2 \times 1 = 12$.` }],
              explain: r`B gets $3 \times 2 = 6$ points for first places plus $4 + 2 = 6$ for second places: **12**. A gets $4 \times 2 = 8$ and C gets $2 \times 2 + 3 \times 1 = 7$. So Borda picks **B**, and so does instant runoff (C is eliminated and its 2 votes go to B, beating A 5 to 4).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make the methods disagree',
              prompt: r`Each slider sets how many voters cast each type of ballot. Right now every method agrees. Change the numbers so that **plurality and Borda pick different winners**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: -0.6, ymax: 3.2, grid: false, axes: false, height: 230,
                params: params([6, 2, 1, 0]),
                extra: electionExtra,
                readout: electionReadout,
                goal: (p) => { const bs = ballots(p); const a = top(plurality(bs)), b = top(borda(bs)); return a !== 'tie' && b !== 'tie' && a !== b; },
                hint: 'Try the nine-voter election above: 4 for A > B > C, 3 for B > C > A, 2 for C > B > A.',
                solution: { n0: 4, n1: 3, n2: 2, n3: 0 },
              },
              explain: r`A candidate who's many voters' **first** choice but many others' **last** choice can win plurality while losing Borda, where broad second-choice support counts too.`,
            },
            {
              type: 'numeric',
              title: 'Borda points',
              prompt: r`With 4 candidates, a Borda count gives 3 points for a first preference, 2 for second, 1 for third and 0 for last. A candidate is ranked first by 5 voters, second by 3 voters and last by 2 voters. How many points does she get?`,
              answer: 21,
              explain: r`$5 \times 3 + 3 \times 2 + 2 \times 0 = 21$. Borda rewards being broadly liked, not just being many people’s first choice.`,
            },
            {
              type: 'mcq',
              title: 'Approval voting',
              prompt: r`In **approval voting**, each voter ticks every candidate they find acceptable, and the most ticks wins. What's its main attraction?`,
              choices: [
                { t: 'You never hurt a favourite by also supporting a compromise candidate, which reduces the spoiler effect', ok: true },
                { t: 'It always picks the Condorcet winner', why: 'It often does, but not always: it depends on where voters draw their approval line.' },
                { t: 'It needs voters to rank every candidate', why: 'It’s simpler than ranking: just approve or not.' },
              ],
              explain: r`Approving a long-shot favourite **and** a viable compromise costs nothing. Approval voting is used by some scientific societies and by the cities of Fargo and St. Louis. Like every method, though, it has flaws: Arrow-style theorems apply to it too, in modified form.`,
            },
          ],
          recap: [
            'Plurality counts only first choices. Runoff and Borda use full rankings.',
            'The same ballots can produce different winners under different methods.',
            'A plurality winner can be ranked last by a majority.',
          ],
        },
        {
          id: 'paradoxes',
          title: 'Voting Paradoxes',
          summary: 'Condorcet and Arrow',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Head-to-head',
              body: r`The Marquis de Condorcet (1785) suggested a natural standard: a candidate who beats **every** other candidate in a one-on-one contest should win. Such a candidate is a **Condorcet winner**.

In the nine-voter election, B beats A (5 to 4) and B beats C (7 to 2), so B is the Condorcet winner, yet plurality chose A.`,
            },
            {
              type: 'mcq',
              title: 'Rock, paper, scissors',
              prompt: r`Three voters rank: A > B > C, B > C > A, and C > A > B. Who is the Condorcet winner?`,
              choices: [
                { t: 'There isn’t one: A beats B, B beats C, and C beats A', ok: true },
                { t: 'A', why: 'C beats A: two of the three voters prefer C to A.' },
                { t: 'B', why: 'A beats B: two voters prefer A to B.' },
              ],
              explain: r`Each candidate wins one head-to-head and loses another, so the group's preferences form a **cycle**, even though every individual is perfectly consistent. This is **Condorcet's paradox**: majorities can be intransitive.`,
            },
            {
              type: 'explain',
              title: 'Arrow’s impossibility theorem',
              body: r`In 1951, Kenneth Arrow asked: is there **any** ranked voting method that satisfies a few obviously reasonable conditions?

1. If every voter prefers X to Y, the group should too.
2. The group's ranking of X versus Y should depend only on how voters rank X versus Y (adding or removing a third candidate shouldn't flip it).
3. There's no dictator whose preference always decides.

Arrow proved that with three or more candidates, **no method satisfies all three**. He won the Nobel Prize in Economics in 1972, partly for this result.`,
            },
            {
              type: 'numeric',
              title: 'All the contests',
              prompt: r`To find a Condorcet winner among 5 candidates, how many different head-to-head contests must be compared?`,
              answer: 10,
              wrong: [{ v: 20, why: 'A vs B is the same contest as B vs A: divide by 2.' }, { v: 5, why: r`Each pair of candidates is one contest: $\binom{5}{2}$.` }],
              explain: r`$\binom{5}{2} = \frac{5 \times 4}{2} = 10$ pairs. Ranked ballots contain all the information needed to run every one of these contests at once.`,
            },
            {
              type: 'interactive',
              title: 'Find the spoiler',
              body: r`100 voters. 40 prefer A. The rest prefer B to A, but $c$ of them like candidate C best (with B second). Under plurality, each voter backs only their favourite. Find the **smallest** number of C voters that hands the election to A, even though most voters prefer B to A.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 82, grid: false, axes: false, maxWidth: 480, height: 300,
                params: { c: { min: 0, max: 40, step: 1, value: 10, label: 'C voters', color: 'amber' } },
                extra: ({ plot, p, s }) => { const bars = [['A', 40, 'coral', 0.8], ['B', 60 - p.c, 'blue', 2.2], ['C', p.c, 'amber', 3.6], ['A', 40, 'coral', 6.4], ['B', 60, 'blue', 7.8]], out = []; for (const [n, v, c, x] of bars) out.push(s('rect', { x: plot.X(x), y: plot.Y(v), width: plot.X(1.1) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 4, class: `fl-${c}` }), s('text', { x: plot.X(x + 0.55), y: plot.Y(v) - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: `${n}: ${v}` })); out.push(s('text', { x: plot.X(2.7), y: plot.Y(77), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: 'plurality vote' }), s('text', { x: plot.X(7.65), y: plot.Y(77), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: 'A against B, head to head' })); return out; },
                readout: (p) => { const B = 60 - p.c; const win = 40 > B && 40 > p.c ? 'A' : B > p.c && B > 40 ? 'B' : p.c > 40 ? 'C' : 'a tie'; return `plurality winner: **${win}** · head to head, B beats A **60–40**`; },
                goal: (p) => p.c === 21,
                hint: 'A wins plurality once B’s first-choice votes drop below 40.',
                solution: { c: 21 },
              },
              explain: r`With 21 C voters, B’s first-choice support falls to 39 and A wins with 40, although 60 voters prefer B to A. C cannot win but changes who does: the spoiler effect. Ranked systems such as instant runoff would transfer C’s votes to B.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The spoiler effect',
              prompt: r`In a plurality election, candidate B is leading C. Then a new candidate, D, similar to B, enters, and C wins. Which of Arrow's conditions does plurality break here?`,
              choices: [
                { t: 'Condition 2: an irrelevant candidate changed the B-versus-C outcome', ok: true },
                { t: 'Condition 1', why: 'Not everyone preferred B to C, so condition 1 doesn’t apply.' },
                { t: 'Condition 3', why: 'There’s no dictator in plurality voting.' },
              ],
              explain: r`Voters' opinions of B versus C didn't change, but splitting the B-like vote handed victory to C. That's the **spoiler effect**, a violation of "independence of irrelevant alternatives". Arrow's theorem says every ranked method must break **something**: designing elections means choosing which flaws to live with.`,
            },
          ],
          recap: [
            'A Condorcet winner beats every rival head-to-head, but may not exist.',
            'Majority preferences can form cycles (Condorcet’s paradox).',
            'Arrow: no ranked method with 3+ candidates meets all the fairness conditions.',
          ],
        },
        {
          id: 'irv',
          title: 'Instant Runoff',
          summary: 'Ranked ballots and a strange paradox',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Eliminate and transfer',
              body: r`**Instant-runoff voting** (IRV, or "ranked-choice voting") uses ranked ballots:
1. Count first preferences. If someone has a majority, they win.
2. Otherwise, eliminate the candidate with the fewest first preferences, and move each of their ballots to its next choice.
3. Repeat.

It's used in Australian elections, for the mayor of New York City, and in Irish presidential elections.`,
            },
            {
              type: 'numeric',
              title: 'Run the count',
              prompt: r`17 voters: 6 rank A > B > C, 6 rank B > C > A, and 5 rank C > A > B. Under IRV, how many votes does the winner have in the final round?`,
              unit: 'votes',
              answer: 11,
              wrong: [{ v: 6, why: 'No one has a majority at first. Eliminate C (5 votes) and transfer those ballots.' }, { v: 12, why: 'C’s ballots go to their **second** choice, A, not to B.' }],
              explain: r`First round: A 6, B 6, C 5. C is eliminated, and its 5 ballots (C > A > B) transfer to A. Final round: A **11**, B 6. A wins.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'More support, fewer wins?',
              prompt: r`A has won. Now some of the B > C > A voters warm to A and move A to the **top** of their ballots (A > B > C), which should only help A. Find how many must switch for A to **lose**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 3.4, grid: false, axes: false, height: 220,
                params: { k: { min: 0, max: 6, step: 1, value: 0, label: 'voters switching to A > B > C', color: 'blue' } },
                extra: (o) => electionExtra({ ...o, p: irvBallots(o.p.k) }),
                readout: (p) => {
                  const bs = ballots(irvBallots(p.k)), pl = plurality(bs), w = runoff(bs);
                  return `first round A ${pl.A}, B ${pl.B}, C ${pl.C} → instant-runoff winner: **${w}**`;
                },
                goal: (p) => runoff(ballots(irvBallots(p.k))) !== 'A',
                hint: 'The danger for A is that B gets eliminated instead of C.',
                solution: { k: 2 },
              },
              explain: r`With **2** switchers: A 8, B 4, C 5. Now **B** is eliminated, and its 4 ballots (B > C > A) go to C: C 9, A 8. A loses because it gained support! This failure of **monotonicity** happens because who gets eliminated first can change the whole outcome.`,
            },
            {
              type: 'mcq',
              title: 'Burlington, 2009',
              prompt: r`In Burlington, Vermont's 2009 mayoral election, held under IRV, a centrist candidate would have beaten each rival head-to-head, but was eliminated in the second round. What does that show?`,
              choices: [
                { t: 'IRV can eliminate a Condorcet winner who has few first preferences', ok: true },
                { t: 'The votes were counted wrongly', why: 'The count was correct. It’s a property of the method: being many voters’ second choice doesn’t protect you from elimination.' },
                { t: 'There was no Condorcet winner', why: 'There was one: he lost in the second round because too few voters ranked him first.' },
              ],
              explain: r`IRV only looks at first preferences when deciding who to eliminate, so a broadly liked compromise candidate can be squeezed out. Burlington repealed IRV in 2010 (and later brought it back for some elections). Every method has trade-offs.`,
            },
            {
              type: 'numeric',
              title: 'Transfers decide',
              prompt: r`Three candidates: A has 40 first preferences, B 35 and C 25. C is eliminated, and all C voters rank B second. How many votes does B have in the final round?`,
              answer: 60,
              explain: r`B gets $35 + 25 = 60$ and beats A’s 40, although A led on first preferences. Instant runoff lets supporters of a weak candidate still influence the result.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A cycle in disguise',
              prompt: r`Back to the original 17 voters (6 A > B > C, 6 B > C > A, 5 C > A > B). Is there a Condorcet winner?`,
              choices: [
                { t: 'No: A beats B, B beats C, and C beats A', ok: true },
                { t: 'Yes, A', why: 'C beats A: 11 voters (the B > C > A and C > A > B groups) prefer C to A.' },
                { t: 'Yes, B', why: 'A beats B 11 to 6.' },
              ],
              explain: r`A beats B 11–6, B beats C 12–5, C beats A 11–6: a Condorcet cycle. Elections with cycles are exactly where methods disagree and paradoxes like non-monotonicity appear.`,
            },
          ],
          recap: [
            'IRV eliminates the last-placed candidate and transfers ballots.',
            'It can fail monotonicity: more support can make a candidate lose.',
            'It can eliminate a Condorcet winner with few first preferences.',
          ],
        },
      ],
    },
    {
      title: 'Sharing Fairly',
      summary: 'Districts, seats and power.',
      lessons: [
        {
          id: 'gerrymander',
          title: 'Drawing Districts',
          summary: 'Same votes, different winners',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Districts decide',
              body: r`Many countries elect one representative per **district**. The same votes can produce very different results depending on where the district lines are drawn.

Drawing lines to favour one party is called **gerrymandering**, after Massachusetts governor Elbridge Gerry, whose 1812 district map included a district shaped like a salamander.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Redraw the map',
              prompt: r`25 voters: 15 blue (60%) and 10 orange (40%). They must be split into 5 districts of 5 voters each. Try the maps: find the one where **orange**, the minority, wins a majority of seats.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 5.3, ymin: -0.3, ymax: 5.3, grid: false, axes: false, maxWidth: 360,
                params: { m: { min: 0, max: 2, step: 1, value: 0, label: 'map', color: 'violet', format: (v) => MAPS[v].name } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  const shade = ['fl-violet-soft', 'fl-teal-soft', 'fl-amber-soft', 'fl-pink-soft', 'fl-blue-soft'];
                  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
                    const d = MAPS[p.m].d(r, c), x = c, y = 4 - r;
                    els.push(s('rect', { x: plot.X(x), y: plot.Y(y + 1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1), class: shade[d], stroke: 'var(--card)', 'stroke-width': 1 }));
                  }
                  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
                    const d = MAPS[p.m].d(r, c), x = c, y = 4 - r;
                    if (c < 4 && MAPS[p.m].d(r, c + 1) !== d) els.push(s('line', { x1: plot.X(x + 1), x2: plot.X(x + 1), y1: plot.Y(y), y2: plot.Y(y + 1), stroke: 'var(--ink)', 'stroke-width': 3.5 }));
                    if (r < 4 && MAPS[p.m].d(r + 1, c) !== d) els.push(s('line', { x1: plot.X(x), x2: plot.X(x + 1), y1: plot.Y(y), y2: plot.Y(y), stroke: 'var(--ink)', 'stroke-width': 3.5 }));
                    els.push(s('circle', { cx: plot.X(x + 0.5), cy: plot.Y(y + 0.5), r: (plot.X(1) - plot.X(0)) * 0.28, class: GRID[r][c] ? 'fl-amber' : 'fl-blue' }));
                  }
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(5), width: plot.X(5) - plot.X(0), height: plot.Y(0) - plot.Y(5), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3.5 }));
                  return els;
                },
                readout: (p) => {
                  const res = districtResults(p.m), o = res.filter((x) => x >= 3).length;
                  return `District results (orange voters out of 5): ${res.join(', ')} → orange wins **${o}** seat${o === 1 ? '' : 's'}, blue wins **${5 - o}**`;
                },
                goal: (p) => districtResults(p.m).filter((x) => x >= 3).length >= 3,
                hint: 'Orange needs 3 voters in each of 3 districts. Which map groups the orange voters that way?',
                solution: { m: 1 },
              },
              explain: r`With **horizontal strips**, orange wins 3 of 5 seats with only 40% of the votes. With vertical strips, every district is 3–2 blue, so orange wins **nothing**. The compact "blocks" map gives 2 seats, matching orange's 40% share. Nobody changed their vote; only the lines moved.`,
            },
            {
              type: 'mcq',
              title: 'Packing and cracking',
              prompt: r`Gerrymanderers use two tricks against the other party's voters. Which describes them?`,
              choices: [
                { t: 'Packing crams them into a few districts they win by huge margins; cracking spreads them thinly so they narrowly lose everywhere', ok: true },
                { t: 'Packing removes voters from the register; cracking discourages turnout', why: 'Those would be voter suppression. Gerrymandering works purely by where the lines go.' },
                { t: 'Both mean making districts larger', why: 'District sizes stay equal; only their shapes change.' },
              ],
              explain: r`Vertical strips **crack** orange: 2 orange voters in every district, losing each time. Packing would put all 10 orange voters into 2 districts, which they'd win 5–0, wasting votes, while blue takes the other 3.`,
            },
            {
              type: 'numeric',
              title: 'Wasted votes',
              prompt: r`A vote is **wasted** if it's cast for a loser, or for a winner beyond the 3 votes needed to win a 5-voter district. With vertical strips (every district 3 blue, 2 orange), how many orange votes are wasted in total?`,
              answer: 10,
              wrong: [{ v: 2, why: 'That’s in one district. There are 5 districts.' }, { v: 0, why: 'Every orange vote went to a losing candidate.' }],
              explain: r`All 10 orange votes went to losers, while blue wasted none: each blue vote was needed for its 3–2 win. The **efficiency gap** is the difference in wasted votes divided by all votes: $\frac{10 - 0}{25} = 40\%$, an extreme imbalance.`,
            },
            {
              type: 'mcq',
              title: 'Measuring shape',
              prompt: r`One way to flag a gerrymander is by district **shape**. The Polsby–Popper score compares a district’s area with that of a circle with the same perimeter. Which district scores lowest?`,
              choices: [
                { t: r`A long, snaking district with a jagged boundary`, ok: true },
                { t: r`A compact, roughly square district`, why: r`Compact shapes score high; a circle scores the maximum, 1.` },
                { t: r`A circular district`, why: r`A circle has the highest possible score.` },
              ],
              explain: r`Wiggly boundaries add perimeter without area, lowering the score. But shape alone isn’t proof: natural boundaries like coastlines are jagged too, so courts also look at measures like wasted votes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The other side',
              prompt: r`Now take the horizontal-strips map, which favours orange. The districts have 4, 3, 3, 0 and 0 orange voters. How many **blue** votes are wasted in total?`,
              answer: 9,
              wrong: [{ v: 5, why: 'Blue’s winning districts (5 blue each) also waste 2 votes each, beyond the 3 needed.' }, { v: 10, why: 'Count carefully: 1 + 2 + 2 blue losing votes, plus 2 + 2 surplus votes in the two blue districts.' }],
              explain: r`Losing districts: $1 + 2 + 2 = 5$ wasted blue votes. Winning districts (5–0): $2 + 2 = 4$ surplus. Total **9**, while orange wastes just 1 (its 4th vote in the first row). Efficiency gap $\frac{9 - 1}{25} = 32\%$ in orange's favour.`,
            },
          ],
          recap: [
            'The same votes can produce very different seat counts under different maps.',
            'Packing and cracking waste the targeted party’s votes.',
            'The efficiency gap measures imbalance in wasted votes.',
          ],
        },
        {
          id: 'apportionment',
          title: 'Dividing Seats',
          summary: 'Rounding, and its paradoxes',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Whole seats only',
              body: r`A parliament must split seats among regions in proportion to population, but seats are whole numbers. **Hamilton's method**:
1. Compute each region's exact quota: $\text{seats} \times \dfrac{\text{population}}{\text{total population}}$.
2. Give each region the whole-number part of its quota.
3. Hand out any leftover seats to the largest fractional parts.`,
            },
            {
              type: 'numeric',
              title: 'Try it',
              prompt: r`Three states have populations 5.3 million, 3.1 million and 1.6 million, sharing 10 seats. Using Hamilton's method, how many seats does the **smallest** state get?`,
              unit: 'seats',
              answer: 2,
              wrong: [{ v: 1, why: 'Quotas: 5.3, 3.1, 1.6. Whole parts give 5 + 3 + 1 = 9, so one seat is left, and it goes to the largest fraction: 0.6.' }, { v: 1.6, why: 'Seats must be whole numbers. Use Hamilton’s rounding rule.' }],
              explain: r`Total 10 million, so the quotas are exactly 5.3, 3.1 and 1.6 seats. Whole parts give $5 + 3 + 1 = 9$. The one leftover seat goes to the largest remainder, 0.6, so the smallest state gets **2**, for a final split of 5, 3, 2.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A divisor method',
              prompt: r`**Jefferson's method** (called D'Hondt in Europe) works differently: choose a divisor $d$, and give each state $\left\lfloor \frac{\text{population}}{d} \right\rfloor$ seats (rounding down). Adjust $d$ (in millions) until exactly 10 seats are handed out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 8, grid: false, axes: false, height: 200,
                params: { d: { min: 0.6, max: 1.2, step: 0.01, value: 1, label: 'divisor d', color: 'violet', format: (v) => `${v.toFixed(2)} million` } },
                extra: ({ plot, p, s }) => [5.3, 3.1, 1.6].flatMap((pop, i) => {
                  const seats = Math.floor(pop / p.d), x = 1 + i * 2;
                  const els = [s('text', { x: plot.X(x), y: plot.Y(0) - 6, 'text-anchor': 'middle', class: 'lbl', text: `${pop}M: ${seats}` })];
                  for (let k = 0; k < seats; k++) els.push(s('rect', { x: plot.X(x - 0.35), y: plot.Y(1.2 + k * 0.85 + 0.7), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(0.7), rx: 4, class: ['fl-blue', 'fl-coral', 'fl-teal'][i] }));
                  return els;
                }),
                readout: (p) => {
                  const t = [5.3, 3.1, 1.6].map((x) => Math.floor(x / p.d));
                  return `seats: ${t.join(' + ')} = **${t[0] + t[1] + t[2]}**${t[0] + t[1] + t[2] === 10 ? ' ✓' : ''}`;
                },
                goal: (p) => [5.3, 3.1, 1.6].reduce((a, x) => a + Math.floor(x / p.d), 0) === 10,
                hint: 'A divisor of 1 hands out too few seats. Lower it gradually.',
                solution: { d: 0.85 },
              },
              explain: r`Any divisor from about 0.81 to 0.88 gives **6, 3, 1**, compared with Hamilton's 5, 3, 2. Rounding down after dividing tends to favour large states (or parties). Divisor methods never suffer the Alabama paradox, but they can give a state more than its quota rounded up.`,
            },
            {
              type: 'numeric',
              title: 'Largest remainders',
              prompt: r`Ten seats are shared among three parties with 53%, 27% and 20% of the vote. Hamilton’s method gives each party its whole-number quota (5, 2, 2), then hands leftover seats to the largest remainders. How many seats does the 27% party get?`,
              unit: 'seats',
              answer: 3,
              wrong: [{ v: 2, why: r`One seat is left over after the floors, and the 0.7 remainder is largest.` }],
              explain: r`Quotas are 5.3, 2.7 and 2.0. The floors give 9 seats; the last goes to the largest remainder, 0.7, so the 27% party gets **3**. Final: 5, 3, 2.`,
            },
            {
              type: 'mcq',
              title: 'No perfect method',
              prompt: r`Hamilton’s method can suffer the Alabama paradox; divisor methods can violate "quota" (give a state more or fewer seats than its quota rounded either way). What did Balinski and Young prove in 1980?`,
              choices: [
                { t: r`No apportionment method can both always stay within quota and avoid all such population paradoxes`, ok: true },
                { t: r`Hamilton’s method is perfect`, why: r`It always stays within quota but suffers the Alabama and population paradoxes.` },
                { t: r`Webster’s method has no flaws`, why: r`Webster’s method avoids the paradoxes but can occasionally violate quota.` },
              ],
              explain: r`Like Arrow’s theorem for voting, the Balinski–Young theorem shows that some fairness goals clash. Choosing a method means choosing which flaw to live with; the US House uses the Huntington–Hill divisor method.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Alabama paradox',
              prompt: r`In 1880, US officials noticed something odd about Hamilton's method. When the House of Representatives was enlarged from 299 to 300 seats, what happened to Alabama?`,
              choices: [
                { t: 'It would have **lost** a seat, even though the total went up', ok: true },
                { t: 'It gained two seats', why: 'The surprise was the opposite: a bigger House meant one fewer seat for Alabama.' },
                { t: 'Nothing', why: 'The calculation showed Alabama dropping from 8 seats to 7.' },
              ],
              explain: r`With 299 seats Alabama got 8, but with 300 seats it got only 7, because growing the House shifted the fractional remainders so that other states overtook it. This **Alabama paradox** helped push the US to other methods. Later, Balinski and Young proved that no method can always give every state its rounded-up or rounded-down quota **and** avoid paradoxes like this: another impossibility theorem.`,
            },
          ],
          recap: [
            'Hamilton’s method: give whole quotas, then leftovers to the largest remainders.',
            'The Alabama paradox: more total seats can mean fewer for one state.',
            'Like voting, apportionment can’t satisfy every fairness property at once.',
          ],
        },
        {
          id: 'power',
          title: 'Voting Power',
          summary: 'Seats aren’t the same as influence',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Who really decides?',
              body: r`In a parliament, parties vote as blocs, and a coalition passes a law if its seats reach the **quota**. A party is **critical** in a winning coalition if the coalition would lose without it.

The **Banzhaf power index** counts how often each party is critical, across all winning coalitions. A party's share of those "swings" measures its real influence, which can be very different from its share of seats.`,
            },
            {
              type: 'numeric',
              title: 'A small party',
              prompt: r`Four parties have 4, 3, 2 and 1 seats (10 in total); a majority of 6 is needed. Counting all winning coalitions, the four parties are critical 5, 3, 3 and 1 times. What share of the power does the 1-seat party have? (3 decimal places.)`,
              answer: 1 / 12,
              tol: 0.001,
              wrong: [{ v: 0.1, why: 'That’s its share of seats. Power share = its swings ÷ total swings = 1 ÷ 12.' }],
              explain: r`$\frac{1}{5 + 3 + 3 + 1} = \frac{1}{12} \approx 0.083$, a bit less than its 10% of seats. Notice that the 3-seat and 2-seat parties have **equal** power.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Change the quota',
              prompt: r`Change the quota needed to pass a law. Find the quota at which the 1-seat party has **no power at all**, despite holding a seat.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: 0, ymax: 6, grid: false, axes: false, height: 220,
                params: { q: { min: 6, max: 10, step: 1, value: 6, label: 'quota', color: 'violet', format: (v) => `${v} of 10 seats` } },
                extra: ({ plot, p, s }) => {
                  const sw = swings(p.q), tot = sw.reduce((a, b) => a + b, 0);
                  return SEATS.flatMap((w, i) => {
                    const x = 1 + i * 2, hgt = (sw[i] / tot) * 9;
                    return [
                      s('rect', { x: plot.X(x - 0.6), y: plot.Y(hgt + 0.6), width: plot.X(1.2) - plot.X(0), height: plot.Y(0) - plot.Y(hgt), rx: 5, class: ['fl-blue', 'fl-coral', 'fl-teal', 'fl-amber'][i] }),
                      s('text', { x: plot.X(x), y: plot.Y(0.15), 'text-anchor': 'middle', class: 'lbl', text: `${w} seat${w > 1 ? 's' : ''}` }),
                      s('text', { x: plot.X(x), y: plot.Y(hgt + 0.6) - 6, 'text-anchor': 'middle', class: 'lbl', text: `${Math.round((100 * sw[i]) / tot)}%` }),
                    ];
                  });
                },
                readout: (p) => `quota ${p.q}: swings ${swings(p.q).join(', ')} (bar heights show each party's share of power)`,
                goal: (p) => swings(p.q)[3] === 0,
                hint: 'The 1-seat party matters only if adding its single seat ever tips a coalition over the quota.',
                solution: { q: 9 },
              },
              explain: r`At a quota of **9**, the 1-seat party is never critical: any coalition that reaches 9 with it already has 9 without it, or falls short anyway. It holds 10% of the seats but has 0% of the power. At quota 10 (unanimity), every party has equal power, since anyone can veto.`,
            },
            {
              type: 'mcq',
              title: 'Luxembourg, 1958',
              prompt: r`In the original European Economic Community, France, Germany and Italy had 4 votes each, Belgium and the Netherlands 2, and Luxembourg 1. Laws needed 12 of the 17 votes. How much power did Luxembourg have?`,
              choices: [
                { t: 'None: every other total is even, so Luxembourg’s single vote could never tip a coalition from 11 to 12', ok: true },
                { t: 'About 6%, matching its share of votes', why: 'Check: all other countries have even numbers of votes, so any coalition of them totals an even number.' },
                { t: 'A veto', why: 'A veto would need the quota to require every vote.' },
              ],
              explain: r`Without Luxembourg, coalition totals are always even, so they're either at least 12 already or at most 10. Adding 1 never changes the outcome. Luxembourg was a **dummy** voter from 1958 until the weights changed in 1973.`,
            },
            {
              type: 'numeric',
              title: 'Banzhaf power',
              prompt: r`Three parties have 3, 2 and 1 seats, and a majority needs 4. A party is **critical** in a winning coalition if the coalition would fail without it. The winning coalitions are {3, 2}, {3, 1} and {3, 2, 1}. What fraction of all critical appearances belong to the 3-seat party? (Decimal.)`,
              answer: 0.6,
              tol: 0.001,
              explain: r`The 3-seat party is critical in all three coalitions; the 2-seat party only in {3, 2}; the 1-seat party only in {3, 1}. That’s 3 out of 5 critical appearances: **0.6**. The 2- and 1-seat parties have equal power (0.2 each), despite different sizes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Equal power',
              prompt: r`Back to the 4, 3, 2, 1 parliament. At a quota of 8, the parties are critical 3, 3, 1 and 1 times. What share of the power does the 4-seat party have? (3 decimal places.)`,
              answer: 3 / 8,
              tol: 0.001,
              wrong: [{ v: 0.4, why: 'That’s its share of seats.' }],
              explain: r`$\frac{3}{3 + 3 + 1 + 1} = 0.375$, exactly the same as the 3-seat party. With a quota of 8, the biggest party gains nothing from its extra seat. Power depends on the rules as much as the numbers.`,
            },
          ],
          recap: [
            'A party is critical when its departure turns a winning coalition into a losing one.',
            'Banzhaf power counts critical appearances; it can differ wildly from seat share.',
            'Some voters can hold seats but no power at all (dummies).',
          ],
        },
        {
          id: 'jury',
          title: 'The Wisdom of Crowds',
          summary: 'Condorcet’s jury theorem',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Many imperfect judges',
              body: r`In 1785 the Marquis de Condorcet asked: if each member of a jury is right with probability $p$, independently of the others, how often is the **majority** right?

His answer, the **jury theorem**: if $p > \frac12$, the majority is more reliable than any single juror, and its reliability climbs towards certainty as the jury grows. If $p < \frac12$, the opposite happens.`,
            },
            {
              type: 'numeric',
              title: 'Three jurors',
              prompt: r`Each of 3 jurors is right with probability 0.6, independently. The majority is right if at least 2 are right. What is the probability of that? (3 decimal places.)`,
              answer: 0.648,
              tol: 0.001,
              hint: r`All three right: $0.6^3$. Exactly two right: $3 \times 0.6^2 \times 0.4$.`,
              explain: r`$0.6^3 + 3 \times 0.6^2 \times 0.4 = 0.216 + 0.432 = 0.648$. Already better than one juror’s 0.6.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How big a jury?',
              prompt: r`Each voter is right with probability $p = 0.6$. Increase the (odd) number of voters and find the **smallest** group whose majority is right at least **90%** of the time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 101, ymin: 0.4, ymax: 1, grid: false, height: 260, axes: { xlabel: 'number of voters', ylabel: 'chance the majority is right', xticks: 20, yticks: 0.1, yAt: 0.4 },
                params: { n: { min: 1, max: 101, step: 2, value: 11, label: 'voters', color: 'coral' } },
                curves: [{ f: () => 0.9, color: 'teal', dash: true }],
                extra: ({ plot, p, s }) => { const maj = (n) => { let t = 0, c = 1; for (let k = 0; k <= n; k++) { if (k > n / 2) t += c * 0.6 ** k * 0.4 ** (n - k); c = (c * (n - k)) / (k + 1); } return t; }, out = []; for (let n = 1; n <= 101; n += 2) out.push(s('circle', { cx: plot.X(n), cy: plot.Y(maj(n)), r: n === p.n ? 7 : 3, class: n === p.n ? 'fl-coral' : 'fl-violet' })); return out; },
                readout: (p) => { let t = 0, c = 1; for (let k = 0; k <= p.n; k++) { if (k > p.n / 2) t += c * 0.6 ** k * 0.4 ** (p.n - k); c = (c * (p.n - k)) / (k + 1); } return `${p.n} voters: majority right **${(100 * t).toFixed(1)}%** of the time`; },
                goal: (p) => p.n === 41,
                hint: 'The chance passes 90% somewhere between 30 and 50 voters.',
                solution: { n: 41 },
              },
              explain: r`It takes **41** voters (90.3%); 39 give 89.8%. Individually each is barely better than a coin, yet together they become quite reliable, and with 101 voters the majority is right 98% of the time.`,
            },
            {
              type: 'mcq',
              title: 'Worse than a coin',
              prompt: r`What happens if each voter is right only 45% of the time, and the group grows?`,
              choices: [
                { t: 'The majority becomes more and more likely to be wrong', ok: true },
                { t: 'The majority still improves, just more slowly', why: 'With p below one half, adding voters amplifies the error instead of the truth.' },
                { t: 'It stays at 45%', why: 'The majority’s reliability moves away from one half in whichever direction p points.' },
              ],
              explain: r`The law of large numbers pushes the fraction of correct voters towards $p$. If $p < \frac12$, a majority will almost certainly be wrong. Crowds amplify whatever tendency individuals have.`,
            },
            {
              type: 'mcq',
              title: 'The hidden assumption',
              prompt: r`The theorem assumes voters err **independently**. Which situation breaks that assumption most?`,
              choices: [
                { t: 'Everyone forms their opinion from the same single news source', ok: true },
                { t: 'Voters live in different towns', why: 'Geography alone doesn’t make errors correlated.' },
                { t: 'Some voters are slightly better than others', why: 'Varying skill is fine as long as the average is above one half and errors are independent.' },
              ],
              explain: r`If everyone copies one source, the group is effectively a single voter and the crowd adds nothing. The "wisdom of crowds" depends on diverse, independent judgements, which is why juries deliberate only after hearing the evidence for themselves.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Five good judges',
              prompt: r`Five judges are each right 70% of the time, independently. What percentage of the time is their majority (at least 3) right? (1 decimal place.)`,
              unit: '%',
              answer: 83.692,
              tol: 0.1,
              hint: r`Add the chances of exactly 3, 4 and 5 correct: $\binom{5}{k}0.7^k0.3^{5-k}$.`,
              explain: r`$10 \times 0.343 \times 0.09 + 5 \times 0.2401 \times 0.3 + 0.16807 = 0.3087 + 0.36015 + 0.16807 \approx 0.837$: **83.7%**, up from 70% for one judge.`,
            },
          ],
          recap: [
            'If each voter is right with p > ½ independently, the majority does better.',
            'Reliability approaches certainty as the group grows (41 voters at p = 0.6 give 90%).',
            'Correlated opinions or p < ½ destroy the effect.',
          ],
        },
      ],
    },
  ],
};
