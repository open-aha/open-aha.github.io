import { fix } from '../lib/svg.js';

const r = String.raw;

const PD_TABLE = `| | **They stay silent** | **They confess** |
|---|---|---|
| **You stay silent** | 1 year each | you 10, them 0 |
| **You confess** | you 0, them 10 | 5 years each |`;

// ultimatum game: responder accepts an offer x (of £10) with probability min(1, x/4)
const keep = (x) => (10 - x) * Math.min(1, x / 4);
// first-price auction: your value £80, rival's bid uniform on £0–100
const auctionProfit = (b) => (80 - b) * (b / 100);

// Nowak & May's spatial prisoner's dilemma (1992): everyone plays their 8 neighbours and themselves,
// then copies the best scorer nearby. Temptation b = 1.85; one defector starts in the middle.
const PD_N = 69, PD_B = 1.85;
// computed on first use (and the drawing of each round is kept too)
let PD_CACHE = null;
const PD_DRAW = new Map();
const pdGens = () => PD_CACHE || (PD_CACHE = (() => {
  const N = PD_N, gens = [];
  let g = new Uint8Array(N * N); // 1 = defector
  g[((N - 1) / 2) * N + (N - 1) / 2] = 1;
  gens.push(g);
  for (let step = 0; step < 90; step++) {
    const score = new Float64Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      let sc = 0;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= N || b >= N || g[a * N + b]) continue; // only cooperating partners pay out
        sc += g[i * N + j] ? PD_B : 1;
      }
      score[i * N + j] = sc;
    }
    const next = new Uint8Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      let best = score[i * N + j], st = g[i * N + j];
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= N || b >= N) continue;
        if (score[a * N + b] > best) { best = score[a * N + b]; st = g[a * N + b]; }
      }
      next[i * N + j] = st;
    }
    gens.push(next);
    g = next;
  }
  return gens;
})());

export default {
  id: 'games',
  subject: 'math',
  title: 'Game Theory',
  level: 'Intermediate',
  cover: 'games',
  tagline: 'Dilemmas, equilibria, mixed strategies, backward induction and auctions: the mathematics of strategy.',
  description: r`How should you act when the outcome depends on what others do? Analyse the prisoner's dilemma, find Nash equilibria, learn why randomizing can be optimal, discover how cooperation can evolve between self-interested players, solve games by thinking backwards, and learn how to bid in auctions.`,
  prereq: 'Probability',
  chapters: [
    {
      title: 'Strategic Thinking',
      summary: 'Payoffs, dominance and equilibrium.',
      lessons: [
        {
          id: 'dilemma',
          title: 'The Prisoner’s Dilemma',
          summary: 'When self-interest backfires',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Two suspects',
              body: r`Two suspects are questioned in separate rooms and can't communicate. Each can stay silent or confess (betraying the other). The prison sentences are:

${PD_TABLE}`,
              prompt: 'Thinking only about your own sentence, what should you do?',
              choices: [
                { t: 'Confess: it’s better for you whatever they do', ok: true },
                { t: 'Stay silent: you both get only 1 year', why: 'That’s best for the two of you together. But if they stay silent, you’d do even better by confessing (0 years), and if they confess, confessing cuts your sentence from 10 to 5.' },
                { t: 'It depends on what they do', why: 'Check both cases: whatever they do, confessing gives you a shorter sentence.' },
              ],
              explain: r`If they stay silent, confessing gives you 0 years instead of 1. If they confess, it gives you 5 instead of 10. Either way, confessing is better for you: it's a **dominant strategy**. But if both of you reason this way, you each get 5 years, far worse than the 1 year each you'd get by both staying silent.`,
            },
            {
              type: 'explain',
              title: 'The dilemma',
              body: r`Individually rational choices lead to a collectively bad outcome. That's the **prisoner's dilemma**, formalized around 1950 at the RAND Corporation.

The same structure appears everywhere: arms races, overfishing, price wars, doping in sport and climate change. Each party gains by defecting, whatever the others do, but everyone is worse off when all defect.`,
            },
            {
              type: 'mcq',
              title: 'Spot the dilemma',
              prompt: 'Which situation has the structure of a prisoner’s dilemma?',
              choices: [
                { t: 'Two fishing fleets each gain by catching more, but if both overfish, the fish stocks collapse', ok: true },
                { t: 'Two friends deciding which film to watch together', why: 'That’s a coordination problem: they both want to end up together. There’s no temptation to betray.' },
                { t: 'A chess game', why: 'Chess is zero-sum: one player’s gain is exactly the other’s loss, so there’s no shared benefit to cooperating.' },
              ],
              explain: r`Each fleet does better individually by overfishing, whatever the other does. But if both overfish, both lose their livelihood. That's the classic "tragedy of the commons", a many-player prisoner's dilemma.`,
            },
            {
              type: 'numeric',
              title: 'Free riding',
              prompt: r`Four players each have £10. Any money put in a shared pot is doubled and split equally among all four. If the other three put in all their money and you keep yours, how much do you end up with?`,
              unit: '£',
              answer: 25,
              wrong: [{ v: 20, why: 'That’s what everyone gets if all four contribute. You also keep your own £10.' }, { v: 15, why: r`The pot is $3 \times 10 \times 2 = £60$, split four ways: £15 each, **plus** the £10 you kept.` }],
              explain: r`The pot is $£30 \times 2 = £60$, giving £15 each, plus your kept £10: **£25**, more than the £20 you'd get by contributing. Every £1 you put in returns only 50p to you. This **public goods game** is a many-player prisoner's dilemma: in experiments, contributions start around half and dwindle over repeated rounds, unless players can punish free riders.`,
            },
            {
              type: 'interactive',
              title: 'Fine the defectors',
              body: r`In the prisoner’s dilemma below (your payoff first), defecting is always better for you. Suppose a fine $f$ is charged to anyone who defects. Find the **smallest** fine (in half-steps) that makes cooperating **strictly** better for you, whatever the other player does.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: false, maxWidth: 440, height: 300,
                params: { f: { min: 0, max: 4, step: 0.5, value: 0, label: 'fine for defecting', color: 'coral', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => { const pay = (me, them) => (me === 'C' ? (them === 'C' ? 3 : 0) : (them === 'C' ? 5 : 1) - p.f), out = []; const T = (x, y, t, sz, c) => s('text', { x: plot.X(x), y: plot.Y(y) + sz / 3, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(${sz}px * var(--fs, 1)), var(--fmin, 0px))`, fill: c || 'var(--ink-2)', text: t }); out.push(T(5.5, 6.5, 'they cooperate', 14), T(8.5, 6.5, 'they defect', 14), T(1.6, 4.5, 'you cooperate', 14), T(1.6, 2, 'you defect', 14)); for (const [r, me] of [[0, 'C'], [1, 'D']]) for (const [c, them] of [[0, 'C'], [1, 'D']]) { const best = pay(me, them) > pay(me === 'C' ? 'D' : 'C', them); out.push(s('rect', { x: plot.X(4 + 3 * c), y: plot.Y(5.8 - 2.5 * r), width: plot.X(3) - plot.X(0), height: plot.Y(0) - plot.Y(2.5), class: best ? 'fl-teal-soft' : 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 }), T(5.5 + 3 * c, 4.55 - 2.5 * r, fix(pay(me, them), 1), 26, best ? 'var(--teal)' : 'var(--ink-2)')); } return out; },
                readout: (p) => { const a = 3 > 5 - p.f, b = 0 > 1 - p.f; return `if they cooperate: ${a ? '**cooperate**' : 3 === 5 - p.f ? 'a tie' : 'defect'} is better · if they defect: ${b ? '**cooperate**' : 0 === 1 - p.f ? 'a tie' : 'defect'} is better`; },
                goal: (p) => p.f === 2.5,
                hint: 'Defecting against a cooperator pays 5 − f, which must fall below 3.',
                solution: { f: 2.5 },
              },
              explain: r`At $f = 2.5$: against a cooperator you get 3 versus 2.5, against a defector 0 versus −1.5. Cooperating now dominates, and the dilemma disappears. Contracts, laws and reputations work like this fine: they change the payoffs so that individual and group interests line up.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Changing the game',
              prompt: 'Which change could make staying silent the rational choice?',
              choices: [
                { t: 'A gang code that punishes confessors severely, making confessing costly', ok: true },
                { t: 'Letting them think harder about it', why: 'The logic doesn’t change with more thought. Confessing remains dominant.' },
                { t: 'Making all the sentences twice as long', why: 'Doubling every sentence keeps the same structure: confessing is still dominant.' },
              ],
              explain: r`Change the payoffs, and you change the rational choice. Contracts, laws, reputations and punishments all work by reshaping the payoffs so that cooperation becomes individually rational.`,
            },
          ],
          recap: [
            'A dominant strategy is best no matter what others do.',
            'Prisoner’s dilemma: everyone defecting is individually rational but collectively bad.',
            'Changing the payoffs (laws, contracts, reputation) can make cooperation rational.',
          ],
        },
        {
          id: 'nash',
          title: 'Nash Equilibrium',
          summary: 'No one wants to switch',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Which side of the road?',
              body: r`Two drivers approach each other on a road. Each chooses to keep left or keep right. If they choose the same side, they pass safely. If they choose differently, they crash.`,
              prompt: 'Which outcomes are stable, so that neither driver would want to change their choice on their own?',
              choices: [
                { t: 'Both left, and both right', ok: true },
                { t: 'Only both right', why: 'Both left is just as stable. That’s why different countries drive on different sides.' },
                { t: 'None', why: 'If both keep right, neither wants to switch (switching causes a crash). The same goes for both left.' },
              ],
              explain: r`Both "left–left" and "right–right" are stable: neither driver gains by switching alone. These are **Nash equilibria**. Games can have several, and which one a society settles on can come down to history and convention.`,
            },
            {
              type: 'explain',
              title: 'Nash equilibrium',
              body: r`A **Nash equilibrium** is a choice of strategies, one per player, such that **no player can do better by changing only their own strategy**.

John Nash proved in 1950 that every finite game has at least one equilibrium (possibly involving randomized strategies). He shared the 1994 Nobel Prize in Economics for this work.

In the prisoner's dilemma, "both confess" is the only Nash equilibrium, even though it's worse for both players than "both stay silent".`,
            },
            {
              type: 'mcq',
              title: 'Find the equilibrium',
              body: r`Two cafés choose their prices. Each cell shows (Café A's profit, Café B's profit):

| | **B: high** | **B: low** |
|---|---|---|
| **A: high** | 10, 10 | 2, 14 |
| **A: low** | 14, 2 | 5, 5 |`,
              prompt: 'What is the Nash equilibrium?',
              choices: [
                { t: 'Both price low (5, 5)', ok: true },
                { t: 'Both price high (10, 10)', why: 'If B prices high, A earns more by switching to low (14 > 10). So it isn’t stable.' },
                { t: 'A high, B low', why: 'Then A would switch to low (5 > 2).' },
              ],
              explain: r`Check each cell for a profitable one-sided switch. Only (low, low) has none: if either café raised its price alone, its profit would drop from 5 to 2. It's a price war, a prisoner's dilemma in business. Cartels try (often illegally) to escape it by fixing high prices.`,
            },
            {
              type: 'numeric',
              title: 'Matching pennies',
              body: r`Two players each show a coin, heads or tails. If they match, player 1 wins £1 from player 2; if they differ, player 2 wins £1.`,
              prompt: 'How many Nash equilibria with simple, non-random choices does this game have?',
              answer: 0,
              wrong: [{ v: 1, why: 'Check each of the four outcomes: in every one, the losing player gains by switching.' }, { v: 2, why: 'In (heads, heads), player 2 would switch to tails. Every outcome has someone who wants to switch.' }],
              explain: r`None: in every outcome the loser wants to switch, and the cycle never settles. Nash's theorem guarantees an equilibrium only once **randomizing** is allowed: here, each plays heads and tails half the time. That's the next lesson.`,
            },
            {
              type: 'interactive',
              title: 'The penalty kick',
              body: r`A kicker is stronger to the left. Scoring chances: kick left vs goalie diving left 60%, left vs dive right 95%, right vs dive left 90%, right vs dive right 40%. The goalie dives left with probability $q$. Find the $q$ that leaves the kicker with **no** better option, so they might as well mix.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0.3, ymax: 1, grid: false, height: 280, axes: { xlabel: 'chance the goalie dives left, q', ylabel: 'kicker’s scoring chance', xticks: 0.2, yticks: 0.1, yAt: 0 },
                params: { q: { min: 0, max: 1, step: 0.01, value: 0.3, label: 'q', color: 'ink', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => 0.6 * x + 0.95 * (1 - x), color: 'coral', width: 3 }, { f: (x) => 0.9 * x + 0.4 * (1 - x), color: 'blue', width: 3 }],
                points: [{ x: (p) => p.q, y: (p) => 0.6 * p.q + 0.95 * (1 - p.q), color: 'coral' }, { x: (p) => p.q, y: (p) => 0.9 * p.q + 0.4 * (1 - p.q), color: 'blue' }],
                readout: (p) => { const L = 0.6 * p.q + 0.95 * (1 - p.q), R = 0.9 * p.q + 0.4 * (1 - p.q); return `kick left (coral): **${(100 * L).toFixed(1)}%** · kick right (blue): **${(100 * R).toFixed(1)}%** · kicker’s best: ${Math.abs(L - R) < 0.005 ? 'either' : L > R ? 'left' : 'right'}`; },
                goal: (p) => Math.abs(p.q - 0.647) < 0.01,
                hint: 'The lines cross where 0.95 − 0.35q = 0.4 + 0.5q.',
                solution: { q: 0.65 },
              },
              explain: r`At $q = 0.55/0.85 \approx 0.65$ the two lines cross: the kicker scores about 72% either way. If the goalie dived left any more often, the kicker would always go right, and vice versa. The surprise: the goalie should dive to the kicker’s **strong** side most of the time. Studies of real penalty kicks find players mix close to these equilibrium rates.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Stag hunt',
              body: r`Two hunters can hunt a stag together (big reward, but only if **both** commit) or hunt hares alone (a small, guaranteed reward).

| | **Other: stag** | **Other: hare** |
|---|---|---|
| **You: stag** | 4, 4 | 0, 2 |
| **You: hare** | 2, 0 | 2, 2 |`,
              prompt: 'How many Nash equilibria (with simple, non-random choices) does this game have?',
              cols: 2,
              choices: [
                { t: '2', ok: true },
                { t: '1', why: r`Both "stag, stag" and "hare, hare" are stable. Check: from (hare, hare), switching to stag alone gives 0 < 2.` },
                { t: '0', why: 'Check (stag, stag): switching to hare gives 2 < 4, so nobody wants to switch.' },
              ],
              explain: r`(Stag, stag) is stable because switching drops you from 4 to 2. (Hare, hare) is stable because switching drops you from 2 to 0. Trust decides which one happens: the stag hunt models any situation where cooperation pays off only if everyone commits.`,
            },
          ],
          recap: [
            'Nash equilibrium: nobody can gain by changing only their own strategy.',
            'Games can have one equilibrium or several. Equilibria need not be good for everyone.',
            'Check each outcome for a profitable one-sided switch.',
          ],
        },
      ],
    },
    {
      title: 'Advanced Strategy',
      summary: 'Randomizing, and repeated games.',
      lessons: [
        {
          id: 'mixed',
          title: 'Mixed Strategies',
          summary: 'Why randomness can be smart',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Rock, paper, scissors',
              prompt: 'What’s the best strategy in rock–paper–scissors against a clever opponent?',
              choices: [
                { t: 'Pick each option at random, 1/3 of the time each', ok: true },
                { t: 'Always play rock', why: 'A clever opponent will notice, and play paper every time.' },
                { t: 'Cycle rock, paper, scissors in order', why: 'Any predictable pattern can be exploited.' },
              ],
              explain: r`Any pattern can be exploited. Randomizing equally makes you unpredictable: whatever your opponent does, you win, lose and draw a third of the time each. That's a **mixed-strategy** Nash equilibrium.`,
            },
            {
              type: 'explain',
              title: 'Make your opponent indifferent',
              body: r`In a mixed equilibrium, you randomize so that your opponent has **no reason to prefer** any of their options. If they did prefer one, you'd be exploitable.

Professional sport shows this. Footballers taking penalty kicks, and the goalkeepers facing them, choose left and right in proportions close to what game theory predicts, as studies of thousands of penalties have found.`,
            },
            {
              type: 'numeric',
              title: 'Penalty kicks',
              body: r`A striker scores 90% of the time if the keeper dives the wrong way. If the keeper guesses right, the striker scores 30% of the time when kicking left, and 60% when kicking right (the striker is stronger on the right).`,
              prompt: r`If the keeper dives left with probability $q$, the striker scores $0.3q + 0.9(1 - q)$ kicking left and $0.9q + 0.6(1 - q)$ kicking right. What value of $q$ makes the striker indifferent between the two? (Give a decimal.)`,
              answer: 1 / 3,
              tol: 0.005,
              wrong: [{ v: 0.5, why: r`Set the two expressions equal: $0.3q + 0.9 - 0.9q = 0.9q + 0.6 - 0.6q$.` }],
              explain: r`$0.9 - 0.6q = 0.6 + 0.3q$, so $0.3 = 0.9q$ and $q = \tfrac13$. The keeper should dive left only a third of the time, guarding the striker's stronger right side more often. Then the striker scores 70% either way.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'See the equilibrium',
              prompt: r`The two lines show how often the striker scores by kicking left or right, depending on how often $q$ the keeper dives left. Drag to the keeper's best $q$: the one that leaves the striker the **least** to gain from either choice.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0.2, ymax: 1, grid: 0.1, gridY: 0.1, height: 270, padL: 48, axes: { xlabel: 'keeper dives left (q)', ylabel: 'striker scores', yAt: 0.2, xfmt: (v) => v.toFixed(1), yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { q: { min: 0, max: 1, step: 0.01, value: 0.8, slider: false } },
                curves: [{ f: (q) => 0.9 - 0.6 * q, color: 'blue', width: 3 }, { f: (q) => 0.6 + 0.3 * q, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.q, y: (p) => Math.max(0.9 - 0.6 * p.q, 0.6 + 0.3 * p.q), drag: { x: 'q' }, color: 'violet' }],
                extra: ({ plot, s }) => [
                  s('text', { x: plot.X(0.62), y: plot.Y(0.9 - 0.6 * 0.62) + 22, class: 'lbl fl-blue', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'kick left' }),
                  s('text', { x: plot.X(0.62), y: plot.Y(0.6 + 0.3 * 0.62) - 12, class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'kick right' }),
                ],
                readout: (p) => r`$q = ${p.q.toFixed(2)}$: left scores $${Math.round((0.9 - 0.6 * p.q) * 100)}\%$, right scores $${Math.round((0.6 + 0.3 * p.q) * 100)}\%$; the striker picks the better one: $${Math.round(Math.max(0.9 - 0.6 * p.q, 0.6 + 0.3 * p.q) * 100)}\%$`,
                goal: (p) => Math.abs(p.q - 1 / 3) < 0.006,
                hint: 'The striker always picks the higher line. Make the higher line as low as possible.',
                solution: { q: 0.33 },
              },
              explain: r`The striker picks whichever line is higher, so the keeper wants the **lowest point of the upper envelope**: where the lines cross, at $q = \frac13$. There, the striker scores 70% whatever they do. Dive left more often and the striker kicks right; less often, and they kick left.`,
            },
            {
              type: 'numeric',
              title: 'Rock’s share',
              prompt: r`In the mixed equilibrium of rock–paper–scissors, with what probability does each player choose rock? (3 decimal places.)`,
              answer: 1 / 3,
              tol: 0.001,
              explain: r`$\frac13$ each. Any bias can be exploited: if your opponent plays rock 40% of the time, always playing paper wins on average.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Zero-sum',
              prompt: 'In a zero-sum game (one player’s gain is exactly the other’s loss), what does a mixed-strategy equilibrium guarantee?',
              choices: [
                { t: 'Each player can secure a certain average payoff (the game’s “value”), whatever the opponent does', ok: true },
                { t: 'Both players win', why: 'In a zero-sum game, both can’t win. The gains and losses cancel.' },
                { t: 'The game always ends in a draw', why: 'The equilibrium fixes the expected payoff, not the result of each game.' },
              ],
              explain: r`John von Neumann's **minimax theorem** (1928) says that in two-player zero-sum games, mixed strategies let each player guarantee the game's value. Neither player can be exploited, and neither can exploit a perfect opponent.`,
            },
          ],
          recap: [
            'Mixed strategies randomize to stay unpredictable.',
            'In a mixed equilibrium, each player makes the other indifferent between their options.',
            'In zero-sum games, minimax lets each side guarantee the game’s value.',
          ],
        },
        {
          id: 'repeated',
          title: 'Cooperation',
          summary: 'Repeated games and tit for tat',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Play it again',
              body: r`Now play the prisoner's dilemma **10 times** against the same opponent. Points (higher is better): both cooperate, 3 each. You defect while they cooperate, 5 for you and 0 for them. Both defect, 1 each.

Try different opponents. Play at least one full game.`,
              widget: { kind: 'ipd', rounds: 10 },
              gate: true,
              after: r`Against **Tit for Tat** (which copies your previous move), steady cooperation earns 30 points. Defecting earns a quick 5, but then you're punished every time you keep defecting.`,
            },
            {
              type: 'explain',
              title: 'Axelrod’s tournaments',
              body: r`Around 1980, political scientist Robert Axelrod invited experts to submit strategies for a repeated prisoner's dilemma tournament. The winner was the simplest entry: **Tit for Tat**, submitted by Anatol Rapoport. Cooperate first, then copy whatever the opponent did last time.

Successful strategies shared four traits: they were **nice** (never the first to defect), **retaliatory** (they punished defection), **forgiving** (they returned to cooperation) and **clear** (easy for others to read).`,
            },
            { /*anim:games*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Cooperation on a grid',
              body: r`In 1992 Martin Nowak and Robert May put players on a grid. Each round, everyone plays the prisoner's dilemma with their eight neighbours, then copies whichever neighbour scored best. No memory, no strategy: just imitation. Start with a sea of cooperators and **one** defector in the middle.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 69, ymin: 0, ymax: 69, grid: false, axes: false, maxWidth: 420, pad: 4,
                animate: { param: 't', speed: 4, max: 91, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = Math.min(90, Math.floor(p.t)), g = pdGens()[k], prev = pdGens()[Math.max(0, k - 1)], N = PD_N;
                  // blue: stayed a cooperator, coral: stayed a defector, amber: just defected, green: just started cooperating
                  const w = plot.X(1) - plot.X(0), key = `${k}:${w.toFixed(3)}`;
                  let paths = PD_DRAW.get(key);
                  if (!paths) {
                    paths = { blue: '', coral: '', amber: '', green: '' };
                    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
                      const a = prev[i * N + j], b = g[i * N + j], col = a ? (b ? 'coral' : 'green') : b ? 'amber' : 'blue';
                      paths[col] += `M${plot.X(j).toFixed(2)} ${plot.Y(i + 1).toFixed(2)}h${w.toFixed(2)}v${w.toFixed(2)}h${(-w).toFixed(2)}z`;
                    }
                    PD_DRAW.set(key, paths);
                  }
                  return Object.entries(paths).map(([col, d]) => s('path', { d, class: `fl-${col}`, opacity: col === 'blue' ? 0.35 : 0.9 }));
                },
                readout: (p) => { const k = Math.min(90, Math.floor(p.t)), g = pdGens()[k]; let d = 0; for (const v of g) d += v; return `round ${k} · {blue:cooperators} ${(100 - (100 * d) / g.length).toFixed(0)}% · {coral:defectors} ${((100 * d) / g.length).toFixed(0)}%`; },
              },
              after: r`The lone defector grows into an ever-changing, perfectly symmetric pattern, an "evolutionary kaleidoscope". Defectors invade, but clusters of cooperators protect each other: inside a cluster, cooperators mostly meet cooperators and score well. Neither side ever wins outright, and cooperation survives without any memory or foresight, just because neighbours interact with neighbours.`,
            },
            {
              type: 'mcq',
              title: 'Why repetition helps',
              prompt: 'Why can cooperation become rational in a repeated game, when it isn’t in a single round?',
              choices: [
                { t: 'Future rounds create a threat of retaliation, so defecting now costs you later', ok: true },
                { t: 'Players become friends', why: 'No friendship is needed. The "shadow of the future" changes the incentives, even for purely selfish players.' },
                { t: 'The payoffs change each round', why: 'The payoffs are the same each round. The difference is that today’s actions affect tomorrow’s responses.' },
              ],
              explain: r`When you'll meet again, today's betrayal invites tomorrow's punishment. This "shadow of the future" can make cooperation the self-interested choice, which helps explain cooperation among animals, businesses and nations.`,
            },
            {
              type: 'mcq',
              title: 'Noisy moves',
              prompt: r`In real life, moves are sometimes misread: a cooperation is mistaken for a defection. What happens when two Tit for Tat players face occasional errors?`,
              choices: [
                { t: 'One mistake triggers an endless echo of alternating retaliation; a more forgiving strategy does better', ok: true },
                { t: 'Nothing: Tit for Tat corrects itself immediately', why: 'Each player copies the other’s last move, so a single false defection bounces back and forth.' },
                { t: 'Both switch to cooperating forever', why: 'Tit for Tat has no way to break the cycle of retaliation by itself.' },
              ],
              explain: r`After a mistaken defection, A punishes B, then B punishes A, and so on: a feud. **Generous Tit for Tat**, which forgives about one defection in ten, recovers from errors and outperforms plain Tit for Tat when there's noise, a mathematical case for forgiveness.`,
            },
            {
              type: 'numeric',
              title: 'Patience pays',
              prompt: r`In a repeated prisoner’s dilemma with payoffs $T = 5$ (temptation), $R = 3$ (mutual cooperation) and $P = 1$ (mutual defection), cooperation backed by the threat of permanent defection is stable if the weight $\delta$ placed on the future is at least $\frac{T - R}{T - P}$. What is that threshold?`,
              answer: 0.5,
              tol: 0.001,
              explain: r`$\frac{5 - 3}{5 - 1} = 0.5$. Players who value the next round at least half as much as this one can sustain cooperation: the "shadow of the future".`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Last round',
              prompt: 'Against Tit for Tat over exactly 10 rounds, the best score comes from cooperating in rounds 1–9 and defecting in round 10. What is that total?',
              answer: 32,
              wrong: [{ v: 30, why: 'That’s cooperating every round. Defecting on the very last round adds 2 more, because Tit for Tat can’t punish you afterwards.' }, { v: 50, why: 'If you defect every round, Tit for Tat defects from round 2 onward. You’d get 5 + 9 × 1 = 14.' }],
              explain: r`Rounds 1–9: 3 points each = 27. Round 10: you defect while Tit for Tat cooperates, earning 5. Total: 32. The last round has no future, so there's no punishment. (Pushing this logic backwards from the last round is a famous puzzle in game theory, called backward induction.)`,
            },
          ],
          recap: [
            'Repeated play can make cooperation rational: the shadow of the future.',
            'Tit for Tat: nice, retaliatory, forgiving and clear. It won Axelrod’s tournaments.',
            'With a known final round, the incentive to defect at the end returns.',
          ],
        },
      ],
    },
    {
      title: 'Games in Practice',
      summary: 'Moves in sequence, and auctions.',
      lessons: [
        {
          id: 'sequential',
          title: 'Backward Induction',
          summary: 'Think from the end',
          icon: 'left',
          steps: [
            {
              type: 'explain',
              title: 'Games in turns',
              body: r`In many games, players move **in turn**, seeing earlier moves: chess, negotiations, a company deciding whether to enter a market.

To solve them, start at the **end**: work out what the last mover will do at each possible point, then what the player before them will do knowing that, and so on back to the start. This is **backward induction**.`,
            },
            {
              type: 'mcq',
              title: 'An empty threat',
              body: r`A newcomer is deciding whether to open a shop next to an established one. The established shop threatens a price war if it does. After entry, a price war gives the established shop £1m profit; sharing the market peacefully gives it £3m.`,
              prompt: 'Should the newcomer believe the threat?',
              choices: [
                { t: 'No: once the newcomer has entered, starting a price war would cost the established shop £2m, so it won’t follow through', ok: true },
                { t: 'Yes: threats should always be taken seriously', why: 'Look at the last move: after entry, the established shop prefers £3m to £1m.' },
                { t: 'Only if the newcomer is small', why: 'The established shop’s choice after entry depends only on its own payoffs: £3m beats £1m.' },
              ],
              explain: r`Backward induction shows the threat isn't **credible**. Real firms try to make threats credible by committing in advance, for example by building extra capacity that makes a price war cheaper for them.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The ultimatum game',
              prompt: r`You split £10 with a stranger: you offer them $x$, and they accept (both get paid) or reject (both get nothing). In experiments, people often reject stingy offers. Suppose an offer of $x$ is accepted with probability $\min\left(1, \frac{x}{4}\right)$. Drag to find the offer that maximises what you expect to keep.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 8, grid: 1, gridY: 1, height: 260, axes: { xlabel: 'your offer x (£)', ylabel: 'expected amount kept (£)' },
                params: { x: { min: 0, max: 10, step: 0.5, value: 1, slider: false } },
                curves: [{ f: (x) => keep(x), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.x, y: (p) => keep(p.x), drag: { x: 'x' }, color: 'coral' }],
                readout: (p) => r`offer £${fix(p.x, 2)}: accepted with probability $${Math.min(1, p.x / 4).toFixed(2)}$; you expect to keep $£${keep(p.x).toFixed(2)}$`,
                goal: (p) => Math.abs(p.x - 4) < 1e-9,
                hint: 'Below £4, each extra pound offered raises the acceptance chance a lot. Above £4, it’s accepted anyway.',
                solution: { x: 4 },
              },
              explain: r`Offer **£4** and keep £6 for sure. Lower offers risk rejection; higher offers give money away needlessly. A perfectly "rational" responder would accept any positive offer (something beats nothing), so backward induction predicts tiny offers, but real people reject unfair splits, and real proposers typically offer 40–50%.`,
            },
            {
              type: 'numeric',
              title: 'The centipede',
              body: r`Two players take turns. There's a pot that starts at £2. On your turn you can **take** the larger share (the pot is split £k+1 to you and £k−1 to the other, where the pot is 2k) or **pass**, which adds £2 to the pot. The game stops after at most 100 passes.`,
              prompt: r`Backward induction says the first player should take immediately. If both instead passed until the end, the final pot would be £2 + 100 × £2. How big is that pot, in pounds?`,
              unit: '£',
              answer: 202,
              wrong: [{ v: 200, why: 'Don’t forget the starting £2.' }],
              explain: r`£202, versus the £2 pot that backward induction says will be split at once. At each step, the mover gains by taking just before the other would, which unravels all the way to the start. In experiments, most people pass for a while, earning far more than the "rational" prediction: a famous tension between logic and trust.`,
            },
            {
              type: 'numeric',
              title: 'Game trees grow fast',
              prompt: r`In a game where each player has 30 possible moves per turn, how many different sequences of 4 moves (2 by each player) are there?`,
              answer: 810000,
              explain: r`$30^4 = 810{,}000$. Chess averages about 35 moves per position, so looking ahead 10 moves means about $10^{15}$ positions: backward induction on the full tree is hopeless, so programs search cleverly instead.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pirates',
              prompt: r`Three pirates (ranked A, B, C) split 100 gold coins. A proposes a split; if at least half the pirates (including A) vote yes, it's accepted; otherwise A is thrown overboard and B proposes to C. Pirates are greedy and logical, and vote no if indifferent. What should A propose?`,
              choices: [
                { t: 'A 99, B 0, C 1', ok: true },
                { t: 'A 34, B 33, C 33', why: 'Too generous: A only needs one other vote, and C can be bought cheaply.' },
                { t: 'A 100, B 0, C 0', why: 'Then B and C both vote no (C gets 0 either way, and votes no if indifferent).' },
              ],
              explain: r`Work backwards. If A is gone, B proposes "B 100, C 0" and passes with B's own vote (half of two). So C gets nothing unless A offers something: 1 coin buys C's vote, and A keeps 99. Backward induction can give wildly unequal outcomes.`,
            },
          ],
          recap: [
            'Solve sequential games backwards from the end.',
            'Threats that wouldn’t be carried out are not credible.',
            'Real people often depart from backward induction (ultimatum, centipede).',
          ],
        },
        {
          id: 'auctions',
          title: 'Auctions',
          summary: 'How to bid, and what sellers earn',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Sealed bids',
              body: r`In a **sealed-bid** auction, everyone writes down one bid in secret and the highest bid wins. Two common rules:
- **First-price:** the winner pays their own bid.
- **Second-price** (Vickrey): the winner pays the **second-highest** bid.

Online ad auctions, radio spectrum sales and art auctions all use variations of these rules.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Shade your bid',
              prompt: r`In a first-price auction, a painting is worth £80 to you. Your one rival's bid is equally likely to be anything from £0 to £100. Your expected profit is $(80 - b) \times P(\text{win})$. Drag to the bid $b$ that maximises it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 80, ymin: 0, ymax: 20, grid: 10, gridY: 5, height: 260, axes: { xlabel: 'your bid b (£)', ylabel: 'expected profit (£)' },
                params: { b: { min: 0, max: 80, step: 1, value: 70, slider: false } },
                curves: [{ f: (b) => auctionProfit(b), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.b, y: (p) => auctionProfit(p.b), drag: { x: 'b' }, color: 'coral' }],
                readout: (p) => r`bid £${p.b}: win with probability $${(p.b / 100).toFixed(2)}$, profit if you win £${80 - p.b}, expected $£${auctionProfit(p.b).toFixed(2)}$`,
                goal: (p) => p.b === 40,
                hint: 'Bidding more wins more often but earns less each time. The best is halfway.',
                solution: { b: 40 },
              },
              explain: r`$(80 - b)\frac{b}{100}$ is a parabola peaking at $b = 40$: bid **half** your value. In first-price auctions, bidding your true value guarantees zero profit, so everyone "shades" their bids below what the item is worth to them.`,
            },
            {
              type: 'numeric',
              title: 'Second price',
              prompt: r`In a second-price auction, you bid £80 (your true value) and the other bids are £60 and £45. What do you pay?`,
              unit: '£',
              answer: 60,
              wrong: [{ v: 80, why: 'You win, but you pay the second-highest bid.' }],
              explain: r`You win and pay £60, the second-highest bid, for a profit of £20.`,
            },
            {
              type: 'mcq',
              title: 'Honesty pays',
              prompt: r`Why is bidding exactly your true value the best strategy in a second-price auction, whatever others do?`,
              choices: [
                { t: 'Your bid only decides **whether** you win, not what you pay; bidding your value means you win exactly when the price is below your value', ok: true },
                { t: 'Because the auctioneer can see your value', why: 'Bids are sealed and values private. The rule itself makes honesty optimal.' },
                { t: 'It isn’t: you should bid below your value', why: 'Shading only risks losing auctions you’d have won at a price below your value, without lowering what you pay.' },
              ],
              explain: r`Bid higher than your value and you might win at a price above it (a loss). Bid lower and you might lose an auction you'd have won profitably. Truthful bidding is a **dominant strategy**: William Vickrey's insight, recognised with the 1996 Nobel Prize.`,
            },
            {
              type: 'mcq',
              title: 'The winner’s curse',
              prompt: r`Several oil companies bid for drilling rights. Each has an estimate of how much oil is there; the estimates are right on average. The company with the highest estimate wins. What tends to happen?`,
              choices: [
                { t: 'The winner usually overestimated, so it often overpays', ok: true },
                { t: 'The winner gets a bargain', why: 'Winning means your estimate was the most optimistic, which is usually too high.' },
                { t: 'Nothing special: estimates are right on average', why: 'Right on average for all bidders, but the **highest** estimate is biased upwards.' },
              ],
              explain: r`This is the **winner's curse**, first described by oil engineers in 1971: winning tells you that everyone else valued the item less. Smart bidders adjust their bids downwards to account for it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Revenue equivalence',
              prompt: r`Two bidders have values equally likely anywhere from £0 to £100 and bid truthfully in a second-price auction. The seller earns the lower of the two values, which averages $\frac13$ of the range. What's the seller's expected revenue, in pounds? (1 decimal place.)`,
              unit: '£',
              answer: 100 / 3,
              tol: 0.05,
              wrong: [{ v: 50, why: r`That's the average of one value. The **lower** of two averages $\frac13$ of the range.` }, { v: 66.7, tol: 0.1, why: r`That's the average **higher** value. The seller is paid the second-highest bid.` }],
              explain: r`£33.3. Remarkably, a first-price auction gives the same expected revenue: there, each bidder bids half their value, and the higher value averages £66.7, so the winning bid averages £33.3. This **revenue equivalence theorem** says many auction formats earn the same on average.`,
            },
          ],
          recap: [
            'First-price: shade your bid (with one uniform rival, bid half your value).',
            'Second-price: bidding your true value is a dominant strategy.',
            'Winners tend to have overestimated (winner’s curse); many formats earn the same on average.',
          ],
        },
        {
          id: 'hawkdove',
          title: 'Hawks & Doves',
          summary: 'Evolutionarily stable strategies',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'Fight or share?',
              body: r`Animals often compete for a resource worth $V$ (food, a territory, a mate). In John Maynard Smith’s model each animal plays one of two strategies:
- a **hawk** always fights, and keeps fighting until injured or the other retreats;
- a **dove** displays but retreats if attacked, and shares if the other is also a dove.

Two hawks fight: each wins half the time but risks an injury costing $C$, so on average each gets $\frac{V - C}{2}$. A hawk meeting a dove takes everything ($V$, dove gets 0). Two doves share ($\frac{V}{2}$ each).`,
            },
            {
              type: 'numeric',
              title: 'A costly fight',
              prompt: r`The resource is worth $V = 2$ and an injury costs $C = 6$. What is a hawk’s average payoff when it meets another hawk?`,
              answer: -2,
              explain: r`$\frac{V - C}{2} = \frac{2 - 6}{2} = -2$. When fights are costlier than the prize, two hawks both lose on average.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The stable mix',
              prompt: r`In a population with a fraction $p$ of hawks, each animal meets random opponents. Compare the average payoffs of hawks and doves (with $V = 2$, $C = 6$) and find the mix where **neither does better**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: -2.2, ymax: 2.2, grid: false, height: 290, axes: { xlabel: 'fraction of hawks p', ylabel: 'average payoff', xticks: 0.2, yticks: 1, yAt: -2.2 },
                params: { p: { min: 0, max: 1, step: 0.001, value: 0.8, label: 'hawks', color: 'ink', format: (v) => `${(v * 100).toFixed(1)}%` } },
                curves: [{ f: () => 0, color: 'muted', width: 1.5, dash: true }, { f: (x) => (x * (2 - 6)) / 2 + (1 - x) * 2, color: 'coral', width: 3 }, { f: (x) => (1 - x) * 1, color: 'blue', width: 3 }],
                points: [{ x: (p) => p.p, y: (p) => (p.p * (2 - 6)) / 2 + (1 - p.p) * 2, color: 'coral' }, { x: (p) => p.p, y: (p) => 1 - p.p, color: 'blue' }],
                readout: (p) => { const H = -2 * p.p + 2 * (1 - p.p), D = 1 - p.p; return `hawk (coral) **${H.toFixed(2)}** · dove (blue) **${D.toFixed(2)}** · ${Math.abs(H - D) < 0.01 ? 'balanced' : H > D ? 'hawks do better, so hawks spread' : 'doves do better, so doves spread'}`; },
                goal: (p) => Math.abs(p.p - 1 / 3) < 0.005,
                hint: r`Set $p\frac{V - C}{2} + (1 - p)V = (1 - p)\frac{V}{2}$.`,
                solution: { p: 0.333 },
              },
              explain: r`The lines cross at $p = \frac{V}{C} = \frac13$. With more hawks than that, doves do better and hawks decline; with fewer, hawks do better and increase. So the population settles at one-third hawks: an **evolutionarily stable strategy** (ESS).`,
            },
            {
              type: 'mcq',
              title: 'Self-correcting',
              prompt: r`A few extra hawks appear (for example, by mutation) in a population sitting at the stable mix. What happens?`,
              choices: [
                { t: 'Hawks now do slightly worse than doves, so their share drifts back down', ok: true },
                { t: 'Hawks take over, because they win fights', why: 'More hawks means more costly hawk–hawk fights, which drags their average payoff below the doves’.' },
                { t: 'Nothing: any mix is stable', why: 'Only p = V/C is stable; away from it, one strategy does better.' },
              ],
              explain: r`An ESS resists invasion: any small change makes the newcomers do worse. Nature doesn’t need any animal to calculate this; natural selection does the arithmetic.`,
            },
            {
              type: 'mcq',
              title: 'Cheap fights',
              prompt: r`Suppose injuries are mild, so the cost is **less** than the prize ($C < V$). What does the population end up as?`,
              choices: [
                { t: 'All hawks', ok: true },
                { t: 'All doves', why: r`Even against hawks, a hawk gets $\frac{V - C}{2} > 0$, which beats a dove’s 0.` },
                { t: 'Still a mix with p = V/C', why: r`$\frac{V}{C}$ is more than 1 here: there is no mixed balance point.` },
              ],
              explain: r`If $C < V$, hawks do better against everyone, so fighting takes over. Ritual displays and retreats evolve only where fights are costly, which is why so many animal contests are mostly bluff.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Antlers',
              prompt: r`For deer competing for mates, suppose the prize is worth $V = 10$ and a serious injury costs $C = 25$. What percentage of the population plays hawk at the stable mix?`,
              unit: '%',
              answer: 40,
              tol: 0.5,
              explain: r`$p = \frac{V}{C} = \frac{10}{25} = 0.4$: **40%** hawks. If injuries became more serious (say $C = 50$), hawks would fall to 20%.`,
            },
          ],
          recap: [
            'Hawk–dove payoffs: (V − C)/2, V, 0 and V/2.',
            'When C > V the stable mix has a fraction V/C of hawks.',
            'An ESS can’t be invaded: deviants do worse.',
          ],
        },
      ],
    },
  ],
};
