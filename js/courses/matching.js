const r = String.raw;

// ---- stable matching instance
const STU = ['A', 'B', 'C'], SCH = ['X', 'Y', 'Z'];
const PREF = { A: ['X', 'Y', 'Z'], B: ['Y', 'X', 'Z'], C: ['X', 'Y', 'Z'], X: ['B', 'A', 'C'], Y: ['A', 'B', 'C'], Z: ['A', 'B', 'C'] };
const PERMS = [['Z', 'Y', 'X'], ['X', 'Z', 'Y'], ['Y', 'Z', 'X'], ['X', 'Y', 'Z'], ['Z', 'X', 'Y'], ['Y', 'X', 'Z']];
const blocking = (k) => {
  const m = {}, inv = {};
  STU.forEach((s, i) => { m[s] = PERMS[k][i]; inv[PERMS[k][i]] = s; });
  const out = [];
  for (const s of STU) for (const sc of PREF[s]) {
    if (sc === m[s]) break;
    if (PREF[sc].indexOf(s) < PREF[sc].indexOf(inv[sc])) out.push([s, sc]);
  }
  return out;
};

// ---- second-price auction: your value is 100
const VALUE = 100;
const payoff = (bid, rival) => (bid > rival ? VALUE - rival : 0);

// rent division: big + small room cost £1000 in total
const surplus = (pBig) => ({ alice: 600 - pBig, bob: 450 - (1000 - pBig) });
// kidney exchange: donor i is compatible with patient j for each arrow [i, j]
const KID_POS = { 1: [1.5, 4], 2: [4.5, 5], 3: [7.5, 4], 4: [6.5, 1.3], 5: [2.5, 1.3] };
const KID_ARROWS = [[1, 2], [2, 1], [2, 3], [3, 4], [4, 2], [4, 5], [5, 4], [3, 1]];
const KID_PLANS = [
  { name: 'swap 1 ⇄ 2', cycles: [[1, 2]] },
  { name: 'swap 1 ⇄ 2 and 4 ⇄ 5', cycles: [[1, 2], [4, 5]] },
  { name: 'cycle 2 → 3 → 4 → 2', cycles: [[2, 3, 4]] },
  { name: 'cycle 1 → 2 → 3 → 1 and swap 4 ⇄ 5', cycles: [[1, 2, 3], [4, 5]] },
  { name: 'swap 4 ⇄ 5 only', cycles: [[4, 5]] },
];
const kidCount = (k) => KID_PLANS[k].cycles.reduce((a, c) => a + c.length, 0);

export default {
  id: 'matching',
  subject: 'math',
  title: 'Matching, Auctions & Fair Division',
  level: 'Intermediate',
  cover: 'matching',
  tagline: 'The Nobel-winning maths of matching doctors to hospitals, designing auctions, sharing fairly and exchanging kidneys.',
  description: r`How should students be assigned to schools, or doctors to hospitals? How should an auction be designed so that people bid honestly? How can a cake be cut so nobody feels cheated? Explore stable matchings and the Gale–Shapley algorithm, Vickrey's truthful auction, clever protocols for fair division, envy-free rent splitting, and the kidney exchanges that save lives.`,
  prereq: 'Game Theory',
  chapters: [
    {
      title: 'Matching',
      summary: 'Stable pairings.',
      lessons: [
        {
          id: 'stable',
          title: 'Stable Matchings',
          summary: 'No pair wants to run off',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Blocking pairs',
              body: r`Three students (A, B, C) apply to three schools (X, Y, Z), each with one place. Every student ranks the schools and every school ranks the students.

A matching is **unstable** if some student and some school would both rather be with each other than with their current matches. Such a student–school pair is called a **blocking pair**: they have every reason to break the rules and make a deal on the side. A matching with no blocking pair is **stable**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find a stable matching',
              prompt: r`Each person's preferences are listed beside them (best first). Blocking pairs show as dashed coral lines. Try the possible matchings until you find a **stable** one.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 300,
                params: { k: { min: 0, max: 5, step: 1, value: 0, label: 'matching', color: 'violet', format: (v) => STU.map((s, i) => `${s}–${PERMS[v][i]}`).join(', ') } },
                extra: ({ plot, p, s }) => {
                  const Y = { A: 5, B: 3, C: 1, X: 5, Y: 3, Z: 1 }, X = (n) => (STU.includes(n) ? 3.2 : 6.8);
                  const els = [];
                  STU.forEach((st, i) => els.push(s('line', { x1: plot.X(3.2), y1: plot.Y(Y[st]), x2: plot.X(6.8), y2: plot.Y(Y[PERMS[p.k][i]]), stroke: 'var(--violet)', 'stroke-width': 4 })));
                  for (const [st, sc] of blocking(p.k)) els.push(s('line', { x1: plot.X(3.2), y1: plot.Y(Y[st]), x2: plot.X(6.8), y2: plot.Y(Y[sc]), stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-dasharray': '7 6' }));
                  for (const n of [...STU, ...SCH]) {
                    const left = STU.includes(n);
                    els.push(s('circle', { cx: plot.X(X(n)), cy: plot.Y(Y[n]), r: 17, class: left ? 'fl-blue' : 'fl-amber', stroke: 'var(--ink)', 'stroke-width': 2 }));
                    const t = s('text', { x: plot.X(X(n)), y: plot.Y(Y[n]) + 6, class: 'lbl', 'text-anchor': 'middle', text: n });
                    t.style.fill = 'var(--card)';
                    els.push(t, s('text', { x: plot.X(X(n) + (left ? -0.5 : 0.5)), y: plot.Y(Y[n]) + 5, class: 'lbl', 'text-anchor': left ? 'end' : 'start', text: PREF[n].join(' > ') }));
                  }
                  return els;
                },
                readout: (p) => {
                  const b = blocking(p.k);
                  return b.length ? `blocking pairs: **${b.map(([x, y]) => `${x}–${y}`).join(', ')}**` : '**Stable!** No student and school would both rather switch.';
                },
                goal: (p) => blocking(p.k).length === 0,
                hint: 'Look at each dashed pair: both prefer each other to their current partners. Fix one by matching them together.',
                solution: { k: 3 },
              },
              explain: r`There are two stable matchings here: A–X, B–Y, C–Z, where A and B each get their **first** choice, and A–Y, B–X, C–Z, where schools X and Y each get their first choice. Stable matchings can come in several versions, favouring one side or the other.`,
            },
            {
              type: 'mcq',
              title: 'Why stability matters',
              prompt: r`Before 1952, US hospitals recruited medical students with ever-earlier offers and exploding deadlines, and the market was chaotic. Why does a stable matching help?`,
              choices: [
                { t: 'No student and hospital have an incentive to strike a side deal, so everyone accepts the outcome', ok: true },
                { t: 'Everyone gets their first choice', why: 'That’s usually impossible: two students may both want the same hospital. Stability just means no pair wants to defect together.' },
                { t: 'It maximises the number of matches', why: 'Stability is about incentives, not the count of matches.' },
              ],
              explain: r`An unstable assignment unravels as blocking pairs defect. Since 1952, the US National Resident Matching Program has used an algorithm that produces stable matchings, and it was redesigned in the 1990s by economist Alvin Roth, using the method in the next lesson.`,
            },
            {
              type: 'numeric',
              title: 'Too many to check',
              prompt: r`With 3 students and 3 schools there are $3! = 6$ possible matchings. How many are there with 10 students and 10 schools?`,
              answer: 3628800,
              wrong: [{ v: 100, why: r`Count the orderings: the first student has 10 options, the next 9, and so on: $10!$.` }, { v: 1000, why: 'It’s 10 × 9 × 8 × … × 1, not 10³.' }],
              explain: r`$10! = 3{,}628{,}800$. For the tens of thousands of doctors in the US residency match, checking every matching is hopeless. We need an algorithm that finds a stable one directly.`,
            },
            {
              type: 'numeric',
              title: 'How many proposals?',
              prompt: r`In the Gale–Shapley algorithm with $n$ proposers and $n$ reviewers, there can be at most $n^2 - n + 1$ proposals in total. What is that bound for $n = 4$?`,
              answer: 13,
              explain: r`$16 - 4 + 1 = 13$. Since each proposer proposes to each reviewer at most once, the algorithm always finishes quickly: about $n^2$ steps, even though the number of possible matchings is $n!$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Roommates',
              prompt: r`Four students must pair up as roommates (anyone can room with anyone). Is a stable pairing always possible, as it is with two separate sides?`,
              choices: [
                { t: 'No: there are preferences for which every pairing has a blocking pair', ok: true },
                { t: 'Yes: Gale and Shapley proved it', why: 'Their theorem needs two separate sides (students and schools). With a single pool it can fail.' },
                { t: 'Only if there are an even number of students', why: 'Even with 4 students, a cyclic preference pattern can make every pairing unstable.' },
              ],
              explain: r`Suppose A likes B best, B likes C best, C likes A best, and all three rank D last. Whoever is paired with D wants to switch, and one of the other two will gladly accept. Gale and Shapley gave this counterexample themselves. The two-sided structure is what makes stability guaranteed.`,
            },
          ],
          recap: [
            'A blocking pair would both rather be matched with each other.',
            'A matching with no blocking pair is stable.',
            'There can be several stable matchings, favouring different sides.',
          ],
        },
        {
          id: 'galeshapley',
          title: 'The Gale–Shapley Algorithm',
          summary: 'Propose, hold, reject',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Deferred acceptance',
              body: r`In 1962, David Gale and Lloyd Shapley found a procedure that **always** produces a stable matching:

1. Every unmatched student applies to their favourite school that hasn't yet rejected them.
2. Each school **holds** the best applicant it has seen so far and rejects the rest. (Holding isn't final: a better applicant can bump the current one.)
3. Repeat until every student is held somewhere.

Run it on our example: A applies to X, B to Y, C to X. X prefers A to C, so it rejects C. C applies to Y, but Y prefers B, so it rejects C. C applies to Z, which accepts. Done: A–X, B–Y, C–Z.`,
            },
            {
              type: 'numeric',
              title: 'Count the applications',
              prompt: r`In the run above, how many applications were made in total?`,
              unit: 'applications',
              answer: 5,
              wrong: [{ v: 3, why: 'Each student applied at least once, but C was rejected twice before Z accepted. Count every application.' }, { v: 9, why: 'That’s the maximum possible for 3 students with 3 choices each. Count the actual applications.' }],
              explain: r`A → X, B → Y, C → X (rejected), C → Y (rejected), C → Z: **5** applications. Each student applies to each school at most once, so the algorithm always finishes within $n^2$ applications.`,
            },
            {
              type: 'mcq',
              title: 'Who benefits?',
              prompt: r`Gale and Shapley proved something striking about the side that does the applying. What is it?`,
              choices: [
                { t: 'Each applicant gets the best partner they could have in any stable matching', ok: true },
                { t: 'The applying side always gets worse results', why: 'It’s the opposite: applying is an advantage. Each applicant ends up with their best stable partner.' },
                { t: 'It makes no difference which side applies', why: 'In our example, students applying gives A–X, B–Y, while schools applying gives A–Y, B–X.' },
              ],
              explain: r`The algorithm is **applicant-optimal**: among all stable matchings, every applicant gets their best possible partner (and every receiver their worst). That's why modern school-choice and residency systems let students do the proposing. Shapley and Roth shared the 2012 Nobel Prize in Economics for this theory and its use in practice.`,
            },
            {
              type: 'mcq',
              title: 'Schools propose',
              prompt: r`Now run the algorithm with the **schools** proposing to students, using the same preferences. X proposes to B, Y to A, Z to A; A holds Y (A prefers Y to Z); Z then proposes to B, but B holds X, so Z ends with C. Which student does worse than when students proposed?`,
              choices: [
                { t: 'Both A and B: they get their second choices (A–Y, B–X) instead of their first', ok: true },
                { t: 'Only C', why: 'C gets Z either way. A and B are the ones who lose out.' },
                { t: 'Nobody', why: 'Compare: students proposing gave A–X, B–Y; schools proposing gives A–Y, B–X.' },
              ],
              explain: r`Schools proposing gives A–Y, B–X, C–Z: the stable matching best for the schools and worst for the students. Who proposes really matters.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch deferred acceptance',
              body: r`Four proposers (A–D) and four reviewers (W–Z), each with a preference list (best first). A free proposer asks the next reviewer on their list; a reviewer holds the best offer so far and rejects the rest. Step through the algorithm.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, maxWidth: 520, height: 300,
                params: { k: { min: 0, max: 8, step: 1, value: 0, label: 'step', color: 'violet' } },
                extra: ({ plot, p, s, arrow }) => { const M = ['A', 'B', 'C', 'D'], Wn = ['W', 'X', 'Y', 'Z'], mp = [[0, 1, 2, 3], [0, 2, 1, 3], [1, 0, 3, 2], [0, 3, 1, 2]], wp = [[3, 1, 0, 2], [0, 2, 1, 3], [2, 1, 3, 0], [1, 0, 3, 2]], next = [0, 0, 0, 0], held = [-1, -1, -1, -1], free = [0, 1, 2, 3]; let last = null; for (let step = 0; step < p.k && free.length; step++) { const m = free.shift(), w = mp[m][next[m]++], cur = held[w]; if (cur < 0) { held[w] = m; last = [m, w, true]; } else if (wp[w].indexOf(m) < wp[w].indexOf(cur)) { held[w] = m; free.unshift(cur); last = [m, w, true]; } else { free.unshift(m); last = [m, w, false]; } } const y = (i) => 4.3 - i * 1.15, out = []; held.forEach((m, w) => { if (m >= 0) out.push(s('line', { x1: plot.X(2.4), y1: plot.Y(y(m)), x2: plot.X(7.6), y2: plot.Y(y(w)), stroke: 'var(--teal)', 'stroke-width': 4, opacity: 0.8 })); }); if (last) out.push(arrow(plot.X(2.4), plot.Y(y(last[0]) - 0.12), plot.X(7.5), plot.Y(y(last[1]) - 0.12), { color: last[2] ? 'var(--teal)' : 'var(--coral)', width: 2.5 })); for (let i = 0; i < 4; i++) { out.push(s('circle', { cx: plot.X(2), cy: plot.Y(y(i)), r: 15, class: 'fl-blue' }), s('text', { x: plot.X(2), y: plot.Y(y(i)) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--card)', text: M[i] }), s('text', { x: plot.X(0.9), y: plot.Y(y(i)) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: mp[i].map((j) => Wn[j]).join(' ') }), s('circle', { cx: plot.X(8), cy: plot.Y(y(i)), r: 15, class: 'fl-pink' }), s('text', { x: plot.X(8), y: plot.Y(y(i)) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--card)', text: Wn[i] }), s('text', { x: plot.X(9.1), y: plot.Y(y(i)) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: wp[i].map((j) => M[j]).join(' ') })); } return out; },
                readout: (p) => { const M = ['A', 'B', 'C', 'D'], Wn = ['W', 'X', 'Y', 'Z'], mp = [[0, 1, 2, 3], [0, 2, 1, 3], [1, 0, 3, 2], [0, 3, 1, 2]], wp = [[3, 1, 0, 2], [0, 2, 1, 3], [2, 1, 3, 0], [1, 0, 3, 2]], next = [0, 0, 0, 0], held = [-1, -1, -1, -1], free = [0, 1, 2, 3]; let msg = 'Everyone starts free.'; for (let step = 0; step < p.k && free.length; step++) { const m = free.shift(), w = mp[m][next[m]++], cur = held[w]; if (cur < 0) { held[w] = m; msg = `${M[m]} proposes to ${Wn[w]}, who is free and **holds** the offer.`; } else if (wp[w].indexOf(m) < wp[w].indexOf(cur)) { held[w] = m; free.unshift(cur); msg = `${M[m]} proposes to ${Wn[w]}, who prefers ${M[m]} and **drops ${M[cur]}**.`; } else { free.unshift(m); msg = `${M[m]} proposes to ${Wn[w]}, who prefers ${M[cur]} and **rejects** ${M[m]}.`; } } return free.length ? msg : msg + ' Everyone is matched: the matching is **stable**.'; },
              },
              after: r`After 8 proposals everyone is matched, and no proposer and reviewer prefer each other to their partners. Notice that reviewers only ever trade up, while proposers only ever move down their lists: that asymmetry is why the proposing side gets its best possible stable partner.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Can lying help?',
              prompt: r`When students propose, can a student ever get a better school by listing their preferences dishonestly?`,
              choices: [
                { t: 'No: for the proposing side, truthful ranking is a dominant strategy', ok: true },
                { t: 'Yes: listing a "safe" school first is smarter', why: 'In deferred acceptance, a rejection never hurts your later chances, so aiming high costs nothing.' },
                { t: 'Yes, by ranking fewer schools', why: 'Shortening your list can only leave you unmatched; it never gets you a better school.' },
              ],
              explain: r`Because offers are only **held**, applying to a long-shot school first costs nothing: if it rejects you, you simply move on. Dubins, Freedman and Roth proved that proposers can't gain by lying. (The receiving side, though, sometimes can.) That's why Boston and New York switched their school assignment systems to deferred acceptance in the 2000s.`,
            },
          ],
          recap: [
            'Deferred acceptance: apply, hold the best, reject the rest, repeat.',
            'It always ends with a stable matching, within n² applications.',
            'The applying side gets its best stable outcome.',
          ],
        },
      ],
    },
    {
      title: 'Auctions and Fairness',
      summary: 'Honest bidding and fair shares.',
      lessons: [
        {
          id: 'vickrey',
          title: 'Truthful Auctions',
          summary: 'Why second price is first rate',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'Two sealed-bid auctions',
              body: r`Everyone submits a secret bid; the highest bid wins. But what does the winner pay?

- **First-price auction**: the winner pays their own bid. Bidders have a reason to **shade** their bids below what the item is worth to them, guessing how low they can go.
- **Second-price (Vickrey) auction**: the winner pays the **second-highest** bid. William Vickrey analysed it in 1961 and found that the best strategy is simply to bid your true value. He shared the 1996 Nobel Prize in Economics.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Is honesty the best policy?',
              prompt: r`The item is worth 100 to you. The horizontal axis is the highest rival bid, which you don't know. The dashed line is your payoff if you bid 100; the solid line is your payoff with your chosen bid. Find the bid that is **never** worse than any other, whatever the rivals do.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 200, ymin: -110, ymax: 110, grid: 25, gridY: 50, height: 300, padL: 52,
                axes: { xlabel: 'highest rival bid', ylabel: 'your payoff' },
                params: { bid: { min: 0, max: 200, step: 5, value: 70, label: 'your bid', color: 'violet' } },
                curves: [
                  { f: (x) => payoff(VALUE, x), color: 'ink', dash: true, width: 2 },
                  { f: (x, p) => payoff(p.bid, x), color: 'violet', width: 3.5 },
                ],
                extra: ({ plot, p, s }) => {
                  if (p.bid === VALUE) return [];
                  const lo = Math.min(p.bid, VALUE), hi = Math.max(p.bid, VALUE);
                  return [s('rect', { x: plot.X(lo), y: plot.Y(110), width: plot.X(hi) - plot.X(lo), height: plot.Y(-110) - plot.Y(110), class: 'fl-coral-soft', opacity: 0.4 })];
                },
                readout: (p) => (p.bid < VALUE ? `In the shaded range you **lose** an auction you'd have won at a profit by bidding 100.` : p.bid > VALUE ? `In the shaded range you **win** but pay more than the item is worth to you.` : '**Bidding your value**: you win exactly when winning is profitable.'),
                goal: (p) => p.bid === VALUE,
                hint: 'Look for the bid that never leaves a shaded region where you’d have done better.',
                solution: { bid: 100 },
              },
              explain: r`Your bid only decides **whether** you win, not **what** you pay (that's set by the rival). Bidding your true value wins exactly when the price is below your value. Bidding lower risks losing profitable wins; bidding higher risks paying too much. So truthful bidding is a **dominant strategy**: best no matter what others do.`,
            },
            {
              type: 'numeric',
              title: 'What does the winner pay?',
              prompt: r`In a second-price auction, the bids are 120, 95 and 80. How much does the winner pay?`,
              answer: 95,
              wrong: [{ v: 120, why: 'That’s the winning bid. In a second-price auction, the winner pays the second-highest bid.' }],
              explain: r`The 120 bidder wins and pays **95**. An ordinary rising-price (English) auction works out the same way: bidding stops just above the second-highest bidder's limit. Online proxy bidding, where you enter your maximum and the system bids for you, works on the same principle.`,
            },
            {
              type: 'mcq',
              title: 'The Dutch auction',
              prompt: r`In a Dutch flower auction, a clock starts at a high price and ticks down; the first bidder to press their button buys at the current price. Which sealed-bid auction is it equivalent to?`,
              choices: [
                { t: 'First-price: you must decide in advance at what price to jump in, and you pay that price', ok: true },
                { t: 'Second-price', why: 'You pay the price at which **you** stop the clock, not the next bidder’s price.' },
                { t: 'Neither', why: 'Your plan is just a single "stop" price, like a sealed first-price bid.' },
              ],
              explain: r`No information is revealed until someone stops the clock, so your strategy is just a price, exactly like a sealed first-price bid, and the same bid shading applies. Similarly, the rising-price English auction is strategically like the second-price auction.`,
            },
            {
              type: 'mcq',
              title: 'Which raises more money?',
              prompt: r`In a first-price sealed-bid auction, bidders shade their bids below their values; in a second-price auction they bid their true values but pay the second-highest bid. Under standard assumptions (independent private values, risk-neutral bidders), which raises more money on average?`,
              choices: [
                { t: r`They raise the same on average (revenue equivalence)`, ok: true },
                { t: r`First-price, because winners pay their own bids`, why: r`Bidders shade their bids by exactly enough to cancel this out on average.` },
                { t: r`Second-price, because bids are higher`, why: r`Higher bids, but the winner pays the second-highest one; on average the two effects match.` },
              ],
              explain: r`The revenue equivalence theorem (Vickrey, Myerson) says many auction formats give the seller the same expected revenue. Differences appear when bidders are risk-averse, values are linked, or bidders can collude, which is why auction design is still a big field.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Selling the airwaves',
              prompt: r`In 2000, the UK auctioned 3G mobile phone licences using a design by economists including Ken Binmore and Paul Klemperer. What happened?`,
              choices: [
                { t: 'It raised about £22.5 billion, far beyond expectations', ok: true },
                { t: 'Nobody bid', why: 'Competition was intense: there were more bidders than licences, which kept prices high.' },
                { t: 'The licences went for almost nothing', why: 'That happened in some other countries with poorly designed auctions; the UK’s design kept competition high.' },
              ],
              explain: r`About £22.5 billion, roughly 2.5% of UK GDP. Making sure there were more bidders than licences was crucial. Paul Milgrom and Robert Wilson won the 2020 Nobel Prize for auction design, much of it inspired by spectrum sales.`,
            },
          ],
          recap: [
            'First-price auctions encourage bid shading.',
            'In a second-price (Vickrey) auction, the winner pays the second-highest bid.',
            'Bidding your true value is a dominant strategy in a second-price auction.',
          ],
        },
        {
          id: 'cake',
          title: 'Cutting the Cake',
          summary: 'Fair division without a referee',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'I cut, you choose',
              body: r`Two people want to share a cake fairly, but they value its parts differently, and there's no referee. The ancient solution: **one cuts, the other chooses**.

- The cutter divides it into two pieces they consider equal, since they'll get whichever is left.
- The chooser takes the piece they prefer.

Each gets at least half **by their own measure**, and neither envies the other: the division is **envy-free**.`,
            },
            {
              type: 'numeric',
              title: 'Different tastes',
              prompt: r`Half a cake is chocolate, half vanilla. Alice likes both equally; Bob cares only about chocolate. Alice cuts the cake into a chocolate half and a vanilla half (equal to her), and Bob chooses. What fraction of his own total value does Bob get, as a percentage?`,
              unit: '%',
              answer: 100,
              wrong: [{ v: 50, why: 'Bob values only chocolate, and he can take the whole chocolate half. By his measure, that’s everything he cares about.' }],
              explain: r`Bob takes the chocolate half: **100%** of what he values. Alice gets the vanilla half, worth exactly 50% to her. When tastes differ, fair division can give people **more** than their "fair share" by their own standards.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The cherry end',
              prompt: r`A long cake has cherries piled towards the right end. Bob values it with density $2x$ along its length (from 0 to 1), so the right end matters most to him. Bob is cutting: place the cut where the two pieces are worth **exactly the same** to Bob.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 2.2, grid: 0.1, gridY: 0.5, height: 260, axes: { xlabel: 'position along the cake', ylabel: 'Bob’s value density', xfmt: (v) => v.toFixed(1) },
                params: { c: { min: 0.3, max: 0.95, step: 0.005, value: 0.5, slider: false } },
                curves: [{ f: (x) => 2 * x, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.c, y: () => 0, drag: { x: 'c' }, color: 'violet', r: 9 }],
                under: ({ plot, p, s }) => [
                  s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(p.c)} ${plot.Y(0)} L${plot.X(p.c)} ${plot.Y(2 * p.c)} Z`, class: 'fl-blue-soft' }),
                  s('path', { d: `M${plot.X(p.c)} ${plot.Y(0)} L${plot.X(1)} ${plot.Y(0)} L${plot.X(1)} ${plot.Y(2)} L${plot.X(p.c)} ${plot.Y(2 * p.c)} Z`, class: 'fl-amber-soft' }),
                ],
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(p.c), x2: plot.X(p.c), y1: plot.Y(0), y2: plot.Y(2.1), stroke: 'var(--violet)', 'stroke-width': 2.5 }),
                ],
                readout: (p) => r`cut at $${p.c.toFixed(3)}$: left piece worth $${(p.c * p.c).toFixed(3)}$ to Bob, right piece $${(1 - p.c * p.c).toFixed(3)}$`,
                goal: (p) => Math.abs(p.c * p.c - 0.5) < 0.005,
                hint: r`The left piece's value is the triangle's area, $c^2$. Make it $\frac12$.`,
                solution: { c: 0.705 },
              },
              explain: r`$c^2 = \frac12$ gives $c = \frac{1}{\sqrt2} \approx 0.707$. Now if Alice, who values every part equally, chooses, she takes the **left** piece: 70.7% of the cake by her measure. Bob still gets exactly half by his. A cutter whose tastes differ from the chooser's hands the chooser a bonus.`,
            },
            {
              type: 'mcq',
              title: 'Three people',
              prompt: r`With three people, a natural attempt: Alice cuts the cake into three pieces she thinks are equal; Bob picks first, then Carol, and Alice takes the last. Is this envy-free?`,
              choices: [
                { t: 'No: Carol might value Bob’s piece more than the one she got, so she envies Bob', ok: true },
                { t: 'Yes: everyone chose freely', why: 'Bob and Alice are fine, but Carol only gets to choose from two pieces. She may envy Bob’s pick.' },
                { t: 'Yes, because Alice’s pieces are equal', why: 'They’re equal to Alice, not necessarily to Carol.' },
              ],
              explain: r`Envy-free division for three people is surprisingly tricky. John Selfridge and John Conway independently found an elegant protocol around 1960, involving trimming a piece and dividing the trimmings. For any number of people, a procedure with a guaranteed finite (if astronomically large) number of steps was only found in 2016, by Haris Aziz and Simon Mackenzie.`,
            },
            {
              type: 'mcq',
              title: 'Envy-free',
              prompt: r`In "I cut, you choose", which guarantee holds for **both** people?`,
              choices: [
                { t: r`Each person gets a piece they value at least as much as the other piece (no envy)`, ok: true },
                { t: r`Both get exactly half the cake by weight`, why: r`Each gets at least half by their own values, not necessarily by weight.` },
                { t: r`The cutter always gets the better piece`, why: r`The cutter gets exactly half by their own value; the chooser can do better.` },
              ],
              explain: r`The cutter makes two pieces they value equally, so they’re happy with either; the chooser takes the one they prefer. Nobody envies the other: the division is **envy-free**. For three or more people, envy-free procedures exist but are surprisingly complicated.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Cutting by your own values',
              prompt: r`A 30 cm cake has chocolate on its left half, which you value twice as much per centimetre as the plain right half. Where should you cut (measured from the left end) so that both pieces are worth exactly the same **to you**? (In cm.)`,
              unit: 'cm',
              answer: 11.25,
              tol: 0.05,
              wrong: [{ v: 15, why: r`At 15 cm the chocolate half would be worth twice as much to you.` }],
              explain: r`Your total value is $2 \times 15 + 1 \times 15 = 45$ units, so each piece must be worth 22.5. The left piece of length $x$ (all chocolate) is worth $2x$, so $x = 11.25$ cm. Fair division only needs each person’s **own** valuation, not agreement on what the cake is worth.`,
            },
          ],
          recap: [
            'Cut-and-choose gives two people an envy-free division.',
            'Each person gets at least their fair share by their own valuation.',
            'Envy-free division for three or more people needs cleverer protocols.',
          ],
        },
        {
          id: 'rent',
          title: 'Splitting the Rent',
          summary: 'Envy-free prices for rooms',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Two rooms, one rent',
              body: r`Alice and Bob share a flat with a big room and a small room. The total rent is £1,000. How should they split it?

Each says what the rooms are worth to them (summing to the rent): Alice values the big room at £600 and the small at £400; Bob values them at £550 and £450. A split is **envy-free** if each prefers their own room-and-price to the other's: their **surplus**, value minus price, is at least as large.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the price',
              prompt: r`Alice takes the big room, Bob the small one. Choose the big room's price $p$ (the small room costs $1000 - p$) so that the split is envy-free **and** both get the same surplus.`,
              widget: {
                kind: 'graph', xmin: 500, xmax: 650, ymin: -60, ymax: 110, grid: 25, gridY: 25, height: 270, padL: 48, axes: { xlabel: 'price of the big room (£)', ylabel: 'surplus (£)', xAt: 500, yAt: -60 },
                params: { p: { min: 500, max: 650, step: 5, value: 520, slider: false } },
                curves: [{ f: (x) => surplus(x).alice, color: 'coral', width: 3 }, { f: (x) => surplus(x).bob, color: 'blue', width: 3 }, { f: () => 0, color: 'ink', width: 1 }],
                points: [{ x: (p) => p.p, y: (p) => surplus(p.p).alice, drag: { x: 'p' }, color: 'coral' }, { x: (p) => p.p, y: (p) => surplus(p.p).bob, color: 'blue' }],
                under: ({ plot, s }) => [s('rect', { x: plot.X(550), y: plot.Y(110), width: plot.X(600) - plot.X(550), height: plot.Y(-60) - plot.Y(110), class: 'fl-teal-soft', opacity: 0.5 })],
                extra: ({ plot, s }) => [
                  s('text', { x: plot.X(575), y: plot.Y(100), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'envy-free' }),
                ],
                readout: (p) => {
                  const u = surplus(p.p);
                  return `big room £${p.p}, small £${1000 - p.p}: Alice's surplus **£${u.alice}**, Bob's **£${u.bob}**`;
                },
                goal: (p) => p.p === 575,
                hint: 'Find where the two surplus lines cross.',
                solution: { p: 575 },
              },
              explain: r`At $p = £575$, Alice pays £575 for a room worth £600 to her (surplus £25), and Bob pays £425 for one worth £450 (surplus £25). Any price from £550 to £600 is envy-free; £575 shares the gains equally.`,
            },
            {
              type: 'numeric',
              title: 'Bob’s limit',
              prompt: r`What's the **lowest** price for the big room at which Bob doesn't envy Alice?`,
              unit: '£',
              answer: 550,
              wrong: [{ v: 600, why: 'That’s the highest price Alice will accept for the big room.' }, { v: 500, why: 'At £500 each, Bob would rather have the big room (worth £550 to him) than the small one (£450).' }],
              explain: r`Bob is happy when $450 - (1000 - p) \ge 550 - p$, which gives $p \ge 550$. Below that, the big room becomes a bargain Bob wishes he had.`,
            },
            {
              type: 'mcq',
              title: 'More flatmates',
              prompt: r`Does an envy-free rent split always exist for any number of flatmates and rooms?`,
              choices: [
                { t: 'Yes, under mild assumptions (like everyone preferring a free room to a paid one), as Francis Su proved using Sperner’s lemma', ok: true },
                { t: 'No: with three or more people, someone always envies', why: 'Remarkably, a combinatorial result about coloured triangles guarantees an envy-free split.' },
                { t: 'Only if everyone values the rooms the same way', why: 'Different valuations are exactly what make envy-free splits interesting, and they still exist.' },
              ],
              explain: r`Francis Su's 1999 proof uses **Sperner's lemma**, a fact about colouring the corners of triangles in a subdivided triangle. Websites such as Spliddit put these ideas to practical use for rent, chores and shared costs.`,
            },
            {
              type: 'mcq',
              title: 'Swap the rooms?',
              prompt: r`Back to the original values (Alice: big £600, small £400; Bob: big £550, small £450). Suppose Bob takes the big room and Alice the small one. Is there a big-room price $p$ that makes this envy-free?`,
              choices: [
                { t: r`No: Alice would need $p \ge 600$, but Bob would need $p \le 550$`, ok: true },
                { t: r`Yes: $p = £575$ works again`, why: r`At £575 Bob's surplus is $550 - 575 = -£25$, while the small room would give him $450 - 425 = £25$: he envies Alice.` },
                { t: 'Yes: any price works if they both agree to it', why: 'Envy-freeness depends on each person’s own values, which no agreement changes.' },
              ],
              explain: r`Alice is content with the small room only if $400 - (1000 - p) \ge 600 - p$, that is $p \ge 600$. Bob is content with the big room only if $550 - p \ge 450 - (1000 - p)$, that is $p \le 550$. Both can't hold. Giving Alice the big room is worth $600 + 450 = £1050$ to the pair; the swap only $550 + 400 = £950$. Envy-free splits always use an assignment that maximises the total value.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Stronger preferences',
              prompt: r`Alice now values the big room at £700 (small £300), while Bob still values them at £550 and £450. What price for the big room gives both the same surplus?`,
              unit: '£',
              answer: 625,
              wrong: [{ v: 575, why: 'Alice’s valuation changed. Solve 700 − p = 450 − (1000 − p).' }],
              explain: r`$700 - p = p - 550$, so $p = £625$: each gets £75 of surplus. Alice pays more because she wants the big room more, and that benefits both of them.`,
            },
          ],
          recap: [
            'Envy-free: everyone prefers their own room at its price.',
            'With two people there’s a range of envy-free prices; equal surplus picks one.',
            'Envy-free rent splits exist for any number of people (Su, via Sperner’s lemma).',
          ],
        },
        {
          id: 'kidneys',
          title: 'Kidney Exchange',
          summary: 'Matching that saves lives',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Swapping donors',
              body: r`Many people needing a kidney have a friend or relative willing to donate, but whose kidney isn't compatible (blood type or tissue type doesn't match). Selling kidneys is illegal almost everywhere, so how can such pairs be helped?

**Swap**: if donor 1 matches patient 2 and donor 2 matches patient 1, the two pairs exchange. Longer cycles (1 → 2 → 3 → 1) also work. Alvin Roth, Tayfun Sönmez and Utku Ünver designed the matching systems now used in the US and the UK.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Plan the exchanges',
              prompt: r`Five incompatible pairs. An arrow from $i$ to $j$ means donor $i$ can give to patient $j$. Exchanges must be cycles of length 2 or 3, and no pair can be in two cycles. Choose the plan that gives the **most transplants**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9, ymin: 0, ymax: 6.2, grid: false, axes: false, height: 300,
                params: { k: { min: 0, max: 4, step: 1, value: 0, label: 'plan', color: 'violet', format: (v) => KID_PLANS[v].name } },
                extra: ({ plot, p, s, arrow }) => {
                  const used = new Set();
                  for (const c of KID_PLANS[p.k].cycles) c.forEach((v, i) => used.add(`${v}-${c[(i + 1) % c.length]}`));
                  const els = [];
                  for (const [a, b] of KID_ARROWS) {
                    const [x1, y1] = KID_POS[a], [x2, y2] = KID_POS[b];
                    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, off = 0.18, sh = 0.55;
                    const on = used.has(`${a}-${b}`);
                    els.push(arrow(plot.X(x1 + (dx / L) * sh + nx * off), plot.Y(y1 + (dy / L) * sh + ny * off), plot.X(x2 - (dx / L) * sh + nx * off), plot.Y(y2 - (dy / L) * sh + ny * off), { color: on ? 'var(--violet)' : 'var(--ink-3)', width: on ? 4 : 2, head: 11 }));
                  }
                  for (const [id, [x, y]] of Object.entries(KID_POS)) {
                    const inPlan = KID_PLANS[p.k].cycles.some((c) => c.includes(+id));
                    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 20, class: inPlan ? 'fl-teal' : 'fl-surface', stroke: 'var(--ink)', 'stroke-width': 2 }));
                    els.push(s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', class: 'lbl', text: id }));
                  }
                  return els;
                },
                readout: (p) => `**${kidCount(p.k)}** transplants (${KID_PLANS[p.k].name})`,
                goal: (p) => kidCount(p.k) === 5,
                hint: 'Look for a 3-cycle that uses pairs 1 and 2, leaving pairs 4 and 5 free to swap with each other.',
                solution: { k: 3 },
              },
              explain: r`The 3-cycle 1 → 2 → 3 → 1 plus the swap 4 ⇄ 5 gives transplants to all **5** patients. The tempting 3-cycle 2 → 3 → 4 blocks both other exchanges and helps only 3. Choosing exchanges well is an optimisation problem that real systems solve with integer programming over thousands of pairs.`,
            },
            {
              type: 'numeric',
              title: 'Simultaneous surgery',
              prompt: r`Exchanges in a cycle are usually performed at the same time, so nobody can back out after their partner has received a kidney. How many operations (removals and transplants) does a 3-way cycle need at once?`,
              unit: 'operations',
              answer: 6,
              wrong: [{ v: 3, why: 'Each of the 3 donors has a kidney removed, and each of the 3 patients receives one.' }],
              explain: r`3 donor operations plus 3 transplants: 6 surgical teams and operating theatres at once. That's why cycles longer than 3 are rare.`,
            },
            {
              type: 'mcq',
              title: 'Chains',
              prompt: r`An **altruistic donor** offers a kidney to a stranger, starting a chain: they give to patient 1, donor 1 gives to patient 2, and so on. Why don't chains need to be simultaneous?`,
              choices: [
                { t: 'If a donor backs out, the chain just stops early: nobody has given a kidney without their partner receiving one', ok: true },
                { t: 'Chains are illegal to do simultaneously', why: 'It’s about incentives: in a chain, each pair receives before its donor gives.' },
                { t: 'Because altruistic donors are faster to operate on', why: 'The point is the order: each pair’s patient receives before their donor donates.' },
              ],
              explain: r`In a chain, each pair's patient receives a kidney **before** their donor gives one, so a broken link costs no one a kidney. Chains of dozens of transplants have been carried out across the US.`,
            },
            {
              type: 'numeric',
              title: 'Possible swaps',
              prompt: r`Ten incompatible patient–donor pairs join a registry. If every pair could in principle swap with every other, how many possible two-way swaps would there be to consider?`,
              answer: 45,
              explain: r`$\binom{10}{2} = \frac{10 \times 9}{2} = 45$. Real compatibility rules out most of them, and the hard part is choosing a set of swaps and chains that don’t overlap, an optimisation problem solved by computer in national programmes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'One gift, many lives',
              prompt: r`An altruistic donor starts a chain through 10 incompatible pairs, and the last pair's donor gives to someone on the waiting list. How many transplants does the chain produce in total?`,
              unit: 'transplants',
              answer: 11,
              wrong: [{ v: 10, why: 'Count the final donation to the waiting list too.' }, { v: 1, why: 'The altruist’s gift sets off every donation down the chain.' }],
              explain: r`10 patients in the pairs, plus 1 on the waiting list: **11** transplants from a single altruistic gift. Matching theory helps turn individual generosity into the biggest possible impact.`,
            },
          ],
          recap: [
            'Incompatible donor–patient pairs can swap in cycles of 2 or 3.',
            'Choosing which cycles to run is an optimisation problem.',
            'Chains started by altruistic donors can produce many transplants.',
          ],
        },
        {
          id: 'assignment',
          title: 'The Assignment Problem',
          summary: 'Who should do which job?',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Pairing people with jobs',
              body: r`Three workers, three jobs, and a table of how long (in hours) each worker would take at each job. Give each worker exactly one job so that the **total** time is as small as possible.

This is the **assignment problem**. With $n$ workers there are $n!$ possible assignments, so checking them all quickly becomes hopeless. But there are clever algorithms, like the Hungarian method (Kuhn, 1955), that solve it fast.`,
            },
            {
              type: 'numeric',
              title: 'Too many to check',
              prompt: r`How many different ways are there to assign 10 workers to 10 jobs, one each?`,
              answer: 3628800,
              explain: r`$10! = 3{,}628{,}800$. For 20 workers it’s about $2.4 \times 10^{18}$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the cheapest assignment',
              prompt: r`Hours each worker needs per job are shown in the table. Step through the 6 possible assignments and find the one with the **smallest total**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, maxWidth: 520, height: 260,
                params: { k: { min: 0, max: 5, step: 1, value: 0, label: 'assignment', color: 'violet', format: (v) => `#${v + 1}` } },
                extra: ({ plot, p, s }) => { const C = [[1, 4, 6], [2, 9, 9], [5, 3, 8]], P = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]][p.k], W = ['Ann', 'Bob', 'Cat'], J = ['A', 'B', 'C'], out = [], T = (x, y, t, st) => s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', style: st || 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: t }); J.forEach((j, c) => out.push(T(2.5 + 1.5 * c, 4.4, `job ${j}`, 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))'))); W.forEach((w, r) => { out.push(T(0.9, 3.4 - r, w)); C[r].forEach((v, c) => { const on = P[r] === c; out.push(s('rect', { x: plot.X(1.9 + 1.5 * c), y: plot.Y(3.8 - r), width: plot.X(1.2) - plot.X(0), height: plot.Y(0) - plot.Y(0.8), rx: 6, class: on ? 'fl-violet' : 'fl-card', stroke: 'var(--line-2)' }), s('text', { x: plot.X(2.5 + 1.5 * c), y: plot.Y(3.4 - r) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', fill: on ? 'var(--card)' : 'var(--ink-2)', text: String(v) })); }); }); out.push(T(8.3, 2.4, `total ${P.reduce((t, c, r) => t + C[r][c], 0)} h`, 'font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))')); return out; },
                readout: (p) => { const C = [[1, 4, 6], [2, 9, 9], [5, 3, 8]], P = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]][p.k]; return `Ann → ${'ABC'[P[0]]}, Bob → ${'ABC'[P[1]]}, Cat → ${'ABC'[P[2]]} · total **${P.reduce((t, c, r) => t + C[r][c], 0)} hours**`; },
                goal: (p) => p.k === 4,
                hint: 'Bob is slow at everything except job A.',
                solution: { k: 4 },
              },
              explain: r`The best is Ann → C, Bob → A, Cat → B: $6 + 2 + 3 = 11$ hours. Notice that Ann doesn’t get her best job (A, 1 hour): Bob is so much worse at the other jobs that A is better given to him.`,
            },
            {
              type: 'mcq',
              title: 'Grab the best first?',
              prompt: r`A greedy approach picks the cheapest entry in the table first (Ann → A, 1 hour), then the cheapest remaining, and so on. What total does it give here?`,
              choices: [
                { t: '13 hours: worse than the best possible 11', ok: true },
                { t: '11 hours: greedy always finds the best', why: 'After Ann → A, the cheapest remaining is Cat → B (3), leaving Bob → C (9): 13 hours.' },
                { t: '18 hours', why: 'Greedy picks Ann → A (1), then Cat → B (3), then Bob → C (9).' },
              ],
              explain: r`Greedy gives $1 + 3 + 9 = 13$. Locking in the single best pairing early can force expensive choices later. The Hungarian method avoids this by adjusting the whole table at once.`,
            },
            {
              type: 'numeric',
              title: 'Shifting a row',
              prompt: r`The Hungarian method relies on a simple fact: if you add the same number to every entry in one worker’s row, the best assignment stays the same. If every one of Bob’s times went up by 5 hours, by how much would the best total change?`,
              unit: 'h',
              answer: 5,
              explain: r`Bob does exactly one job in every assignment, so every total rises by exactly 5, and the ranking of assignments doesn’t change. The algorithm subtracts row and column minimums to create zeros, then looks for an assignment using only zeros.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Brute force for twenty',
              prompt: r`A computer checks a million assignments per second. Roughly how many **thousand years** would it need to check all $20! \approx 2.43 \times 10^{18}$ assignments of 20 workers? (A year is about $3.16 \times 10^7$ seconds.)`,
              unit: 'thousand years',
              answer: 2.43e18 / 1e6 / 3.156e7 / 1000,
              relTol: 0.03,
              explain: r`$\frac{2.43 \times 10^{18}}{10^6} = 2.4 \times 10^{12}$ s, about **77,000 years**. The Hungarian method solves the same problem in roughly $n^3 = 8{,}000$ steps: a fraction of a millisecond.`,
            },
          ],
          recap: [
            'Assign n workers to n jobs to minimise total cost: n! possibilities.',
            'Greedy choices can fail; the Hungarian method finds the optimum in about n³ steps.',
            'Adding a constant to a row or column doesn’t change the best assignment.',
          ],
        },
      ],
    },
  ],
};
