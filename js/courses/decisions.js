import { sig } from '../lib/svg.js';
const r = String.raw;

// optimal stopping (secretary problem), n = 100 candidates
const N = 100;
const pBest = (rr) => {
  if (rr === 1) return 1 / N;
  let s = 0;
  for (let i = rr; i <= N; i++) s += 1 / (i - 1);
  return ((rr - 1) / N) * s;
};
const P_MAX = Math.max(...Array.from({ length: N }, (_, i) => pBest(i + 1)));

// Kelly: even-money bet won with probability 0.6
const growth = (f) => 0.6 * Math.log(1 + f) + 0.4 * Math.log(1 - f);

// value of perfect information for the umbrella decision (cost 1 to carry, 10 to get wet)
const evpi = (q) => Math.min(1, 10 * q) - q;
// explore-then-commit with two arms (60% and 50%), testing n pulls of each, T pulls in total
const Phi = (z) => {
  // standard normal CDF (Abramowitz–Stegun approximation)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const pr = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - pr : pr;
};
const etc = (n, T = 1000) => (n === 0 ? 0.55 * T : 1.1 * n + (T - 2 * n) * (0.5 + 0.1 * Phi((0.1 * Math.sqrt(n)) / Math.sqrt(0.49))));
const ETC_MAX = Math.max(...Array.from({ length: 300 }, (_, n) => etc(n)));

// 300 flips of the 60% coin (fixed, so every strategy sees the same luck)
const KELLY_FLIPS = (() => { let a = 20240611; const out = []; for (let i = 0; i < 300; i++) { a = (a * 1103515245 + 12345) % 2147483648; out.push(a / 2147483648 < 0.6); } return out; })();
const KELLY_F = [[0.1, 'teal'], [0.2, 'blue'], [0.4, 'amber'], [0.6, 'coral']];
const kellyPath = (f, n) => { let w = Math.log10(100); const pts = [w]; for (let i = 0; i < n; i++) { w += Math.log10(KELLY_FLIPS[i] ? 1 + f : 1 - f); pts.push(w); } return pts; };

export default {
  id: 'decisions',
  subject: 'math',
  title: 'Decisions Under Uncertainty',
  level: 'Intermediate',
  cover: 'decisions',
  tagline: 'Expected value, a paradox that broke it, insurance, betting, stopping, the value of information and explore versus exploit.',
  description: r`How should you choose when outcomes are uncertain? Start with expected value, see how the St. Petersburg paradox exposed its limits, discover utility and why insurance can be rational, find the betting fraction that grows wealth fastest, learn the famous 37% rule for knowing when to stop searching, work out what a forecast is worth, and balance exploring against exploiting.`,
  prereq: 'Probability',
  chapters: [
    {
      title: 'Expected Value and Its Limits',
      summary: 'Averages, paradoxes and utility.',
      lessons: [
        {
          id: 'ev',
          title: 'Expected Value',
          summary: 'The long-run average',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Weighing outcomes',
              body: r`If a gamble pays $x_1, x_2, \dots$ with probabilities $p_1, p_2, \dots$, its **expected value** is
$$E = p_1 x_1 + p_2 x_2 + \cdots$$
It's not what you'll get on any single play. It's the average you'd approach if you played many, many times. A game is **fair** when its expected value, after paying to play, is zero.`,
            },
            {
              type: 'numeric',
              title: 'A dice game',
              prompt: r`You roll a fair die and win £6 if it shows a six, and nothing otherwise. What's the expected value of one roll, in pounds?`,
              unit: '£',
              answer: 1,
              wrong: [{ v: 6, why: 'You only win £6 one time in six. Multiply by the probability.' }, { v: 3.5, why: 'That’s the average number on the die, not the average winnings.' }],
              explain: r`$\frac16 \times 6 + \frac56 \times 0 = 1$. So paying £1 to play would make the game exactly fair.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Price a fair game',
              prompt: r`A spinner pays £20 with probability 10%, £5 with probability 30%, and nothing otherwise. Set the ticket price so the game is exactly **fair**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: -6, ymax: 6, grid: 1, gridY: 2, height: 260, axes: { xlabel: 'ticket price (£)', ylabel: 'your average profit' },
                params: { c: { min: 0, max: 6, step: 0.25, value: 1, slider: false } },
                curves: [{ f: (c) => 3.5 - c, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.c, y: (p) => 3.5 - p.c, drag: { x: 'c' }, color: 'coral' }],
                readout: (p) => r`$E = 0.1 \times 20 + 0.3 \times 5 - ${p.c.toFixed(2)} = ${(3.5 - p.c).toFixed(2)}$ per play`,
                goal: (p) => Math.abs(p.c - 3.5) < 1e-9,
                hint: r`The expected winnings are $0.1 \times 20 + 0.3 \times 5$. The fair price equals that.`,
                solution: { c: 3.5 },
              },
              explain: r`Expected winnings $= 2 + 1.5 = £3.50$, so a £3.50 ticket makes the game fair. Charge more and the house profits in the long run, which is exactly how casinos and lotteries work.`,
            },
            {
              type: 'numeric',
              title: 'Roulette',
              prompt: r`A European roulette wheel has 37 pockets: 18 red, 18 black and one green zero. You bet £1 on red: win £1 if red, lose £1 otherwise. What's your expected profit per bet, in pence? (1 decimal place.)`,
              unit: 'p',
              answer: (100 * (18 - 19)) / 37,
              tol: 0.06,
              wrong: [{ v: 0, why: 'The green zero tips the odds: 18 ways to win, 19 to lose.' }],
              explain: r`$\frac{18}{37}(+1) + \frac{19}{37}(-1) = -\frac{1}{37} \approx -2.7$p. A small edge, but over millions of bets it guarantees the casino's profit. That single green pocket is the **house edge**.`,
            },
            {
              type: 'numeric',
              title: 'A lottery ticket',
              prompt: r`A £2 lottery ticket wins £1,000,000 with probability 1 in 14 million and £10 with probability 1 in 57 (ignore the other prizes). What's its expected value, in pence? (Nearest penny.)`,
              unit: 'p',
              answer: Math.round(100 * (1e6 / 14e6 + 10 / 57)),
              tol: 1,
              wrong: [{ v: 7, tol: 1, why: 'Include the £10 prize too: 10/57 of a pound.' }],
              explain: r`$\frac{1{,}000{,}000}{14{,}000{,}000} + \frac{10}{57} \approx 0.071 + 0.175 = £0.25$: you pay £2 for about 25p of expected value. People buy tickets anyway for the dream, which is the kind of value expected money doesn't capture.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Always maximise EV?',
              prompt: r`You're offered a choice: £1 million for certain, or a coin flip for £3 million or nothing. The flip has higher expected value (£1.5 million). Is it irrational to take the sure million?`,
              choices: [
                { t: 'No: the first million would change your life far more than the next two, so expected money isn’t everything', ok: true },
                { t: 'Yes: you should always maximise expected value', why: 'That ignores how much each pound matters to you. The next lessons show why the sure thing can be the wiser choice.' },
                { t: 'Yes, because the coin is fair', why: 'Fairness doesn’t settle it. The question is how much the outcomes are worth to you, not just in pounds.' },
              ],
              explain: r`Most people take the sure million, and with good reason. For a one-off, life-changing gamble, expected value alone is a poor guide. Mathematicians noticed this over 280 years ago, prompted by a strange puzzle.`,
            },
          ],
          recap: [
            r`Expected value $E = \sum p_i x_i$: the long-run average.`,
            'A fair game has zero expected profit; casinos build in a small house edge.',
            'For big one-off decisions, expected money isn’t the whole story.',
          ],
        },
        {
          id: 'petersburg',
          title: 'The St. Petersburg Paradox',
          summary: 'An infinitely valuable game?',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Doubling pot',
              body: r`A casino offers a game: flip a coin until it lands heads. If the first head comes on flip $k$, you win $£2^k$. Heads at once pays £2; first head on flip 2 pays £4; flip 3 pays £8; and so on.

How much would you pay to play? Nicolaus Bernoulli posed this puzzle in 1713, and his cousin Daniel published a famous analysis of it in 1738, in the journal of the St. Petersburg Academy.`,
            },
            {
              type: 'numeric',
              title: 'One term',
              prompt: r`What's the probability that the first head comes on flip 3, and what does that pay? Give the **contribution** to the expected value, probability × payout, in pounds.`,
              unit: '£',
              answer: 1,
              wrong: [{ v: 8, why: r`That's the payout. Multiply by the probability $\frac18$.` }, { v: 0.125, tol: 0.001, why: 'That’s the probability. Multiply by the £8 payout.' }],
              explain: r`Probability $\left(\frac12\right)^3 = \frac18$, payout £8: contribution £1. And every other flip number contributes exactly £1 too.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An endless sum',
              body: r`Since every possible flip contributes £1, the expected value is $1 + 1 + 1 + \cdots$: **infinite**. Yet hardly anyone would pay more than £10 or £20 to play. Suppose the casino can only pay up to a limit. See how the expected value depends on its bank.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 42, grid: 5, gridY: 10, height: 260, axes: { xlabel: 'n', ylabel: 'expected value (£)' },
                params: { n: { min: 1, max: 40, step: 1, value: 10, label: 'maximum payout', color: 'violet', format: (v) => `£${(2 ** v).toLocaleString('en-GB')}` } },
                curves: [{ f: (x) => x, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.n, y: (p) => p.n, color: 'coral' }],
                readout: (p) => `With a maximum payout of £${(2 ** p.n).toLocaleString('en-GB')}, the game is worth about **£${p.n}**.`,
              },
              after: r`A bank of a million pounds (about $2^{20}$) makes the game worth about £20; a trillion pounds (about $2^{40}$), only about £40. The infinite expected value comes entirely from absurdly unlikely, astronomically large payouts that no real casino could honour.`,
            },
            {
              type: 'numeric',
              title: 'A billionaire casino',
              prompt: r`A casino with £1 billion can pay out at most about $£2^{n}$ where $2^n \approx 10^9$. What is $n$, to the nearest whole number? (That's roughly what the game is worth.)`,
              answer: 30,
              tol: 0.5,
              wrong: [{ v: 9, why: r`That's the power of 10. You need the power of 2: $\log_2 10^9 \approx 29.9$.` }],
              explain: r`$2^{30} \approx 1.07 \times 10^9$, so $n \approx 30$: even a billion-pound casino makes the game worth only about £30.`,
            },
            {
              type: 'numeric',
              title: 'More than £64?',
              prompt: r`In the St. Petersburg game, what's the probability of winning **more than £64**? (4 decimal places.)`,
              answer: 1 / 64,
              tol: 0.0001,
              wrong: [{ v: 1 / 32, tol: 0.0001, why: r`Winning £64 needs the first head on flip 6. More than £64 needs the first 6 flips all tails: $\left(\frac12\right)^6$.` }],
              explain: r`More than £64 means the first six flips are all tails: $\left(\frac12\right)^6 = \frac{1}{64} \approx 0.0156$. So 98.4% of the time you win £64 or less, which is why no one would pay a fortune to play.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Bernoulli’s resolution',
              prompt: r`Daniel Bernoulli argued that the **value** of money to a person grows more slowly than the amount: an extra £100 means more to a poor person than to a rich one. If value grows like the logarithm of wealth, what happens to the game?`,
              choices: [
                { t: 'Its expected value (in utility) becomes finite and modest, matching people’s reluctance to pay much', ok: true },
                { t: 'It’s still infinitely valuable', why: r`With logarithmic utility, the huge payouts add only about $\log 2^k \propto k$ each, weighted by $2^{-k}$: the sum converges.` },
                { t: 'It becomes worthless', why: 'Not worthless: you always win at least £2. Its value becomes finite and reasonable.' },
              ],
              explain: r`With logarithmic utility, the terms become $\frac{k \log 2}{2^k}$, which add up to a small finite number. For someone with modest savings, the game is worth only a few pounds. This was the birth of **utility theory**.`,
            },
          ],
          recap: [
            'The St. Petersburg game has infinite expected value, yet is worth little to anyone.',
            'Any real limit on payouts makes its value modest (about £30 for a £1 billion bank).',
            'Bernoulli resolved it with utility: money’s value grows more slowly than the amount.',
          ],
        },
        {
          id: 'utility',
          title: 'Utility & Risk',
          summary: 'Why insurance makes sense',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Diminishing returns',
              body: r`A **utility function** $u(w)$ measures how much a level of wealth $w$ is worth to you. Bernoulli suggested $u(w) = \log w$: each **doubling** of wealth adds the same amount of happiness.

With a curving utility, a risky gamble is worth less to you than its expected value. The sure amount that you'd value equally is called the **certainty equivalent**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the certainty equivalent',
              prompt: r`You have £100. A coin flip will leave you with either £100 (lose nothing) or £300 (gain £200): expected wealth £200. With $u(w) = \log w$, find the **sure** wealth you'd value exactly as much as the gamble.`,
              widget: {
                kind: 'graph', xmin: 50, xmax: 350, ymin: 3.8, ymax: 6, grid: 50, gridY: 0.5, height: 280, padL: 48, axes: { xlabel: 'wealth (£)', ylabel: 'utility', xAt: 50, yAt: 3.8, yfmt: (v) => v.toFixed(1) },
                params: { w: { min: 100, max: 300, step: 1, value: 200, slider: false } },
                curves: [{ f: (w) => Math.log(w), color: 'violet', width: 3 }, { f: () => (Math.log(100) + Math.log(300)) / 2, color: 'coral', dash: true, width: 2 }],
                points: [{ x: (p) => p.w, y: (p) => Math.log(p.w), drag: { x: 'w' }, color: 'teal' }],
                extra: ({ plot, s }) => [
                  s('line', { x1: plot.X(100), y1: plot.Y(Math.log(100)), x2: plot.X(300), y2: plot.Y(Math.log(300)), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                  s('circle', { cx: plot.X(200), cy: plot.Y((Math.log(100) + Math.log(300)) / 2), r: 5, class: 'fl-coral' }),
                ],
                readout: (p) => r`$u(${p.w}) = ${Math.log(p.w).toFixed(3)}$; $\;$ gamble's expected utility $= ${((Math.log(100) + Math.log(300)) / 2).toFixed(3)}$`,
                goal: (p) => Math.abs(p.w - Math.sqrt(30000)) < 0.6,
                hint: r`You need $\log w = \frac{\log 100 + \log 300}{2}$, so $w = \sqrt{100 \times 300}$.`,
                solution: { w: 173 },
              },
              explain: r`$w = \sqrt{100 \times 300} \approx £173$: the **geometric** mean. You'd swap the gamble (expected £200) for a sure £173. The £27 gap is the **risk premium**: what you'd give up to avoid uncertainty. On the graph, the chord between the two outcomes lies below the curve; that's what curvature does.`,
            },
            {
              type: 'mcq',
              title: 'Why buy insurance?',
              prompt: r`Insurance companies make a profit, so for customers, insurance has a negative expected value. Why is buying it still sensible?`,
              choices: [
                { t: 'Losing your house would hurt far more than the steady small premiums, because utility is curved', ok: true },
                { t: 'Insurance actually has positive expected value for customers', why: 'On average, customers pay in more than they get back; that’s how insurers survive.' },
                { t: 'It isn’t sensible; it’s a cognitive bias', why: 'It’s rational for risk-averse people. A catastrophic loss costs far more utility than many small premiums.' },
              ],
              explain: r`Swapping a small certain loss (the premium) for protection against a huge, ruinous loss raises your **expected utility**, even though it lowers your expected wealth. The insurer, pooling thousands of customers, faces almost no risk.`,
            },
            {
              type: 'numeric',
              title: 'Pricing insurance',
              prompt: r`You have wealth £100,000, including a £90,000 house with a 1% chance of burning down. With $u(w) = \ln w$, the most you'd pay for full insurance makes $\ln(100{,}000 - \text{premium})$ equal your expected utility. That maximum premium is $100{,}000\left(1 - 0.1^{0.01}\right)$. What is it? (Nearest £10.)`,
              unit: '£',
              answer: 2280,
              tol: 10,
              wrong: [{ v: 900, tol: 10, why: 'That’s the expected loss (1% of £90,000). A risk-averse person will pay more than that.' }],
              explain: r`$100{,}000 \times (1 - 0.97724) \approx £2{,}280$, more than double the £900 expected loss. Any premium between £900 and £2,280 benefits both you (in utility) and the insurer (in money). That gap is why the insurance industry exists.`,
            },
            {
              type: 'numeric',
              title: 'A square-root utility',
              prompt: r`With utility $u(x) = \sqrt x$, a 50–50 gamble between £100 and £0 has expected utility $\frac12 \times 10 + \frac12 \times 0 = 5$. What sure amount gives the same utility (the certainty equivalent), in pounds?`,
              unit: '£',
              answer: 25,
              explain: r`$\sqrt{CE} = 5$, so $CE = £25$, half the gamble’s expected value of £50. The £25 gap is the risk premium this person would pay to avoid the uncertainty.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Losses loom larger',
              prompt: r`Psychologists Daniel Kahneman and Amos Tversky found that most people refuse a coin flip that wins £150 or loses £100, despite its positive expected value. What does this reveal?`,
              choices: [
                { t: 'Loss aversion: losses feel roughly twice as painful as equal gains feel good', ok: true },
                { t: 'People can’t calculate expected values', why: 'Most people can see the bet is favourable. They reject it because losing £100 feels worse than winning £150 feels good.' },
                { t: 'People are always risk-seeking', why: 'Here they’re avoiding risk. Interestingly, people often become risk-seeking to avoid a sure loss.' },
              ],
              explain: r`Their **prospect theory** (1979) measures outcomes as gains and losses relative to a reference point, with losses weighted about twice as heavily. Kahneman received the 2002 Nobel Prize in Economics for this work (Tversky had died in 1996).`,
            },
          ],
          recap: [
            r`Utility functions like $\log w$ capture diminishing returns.`,
            'The certainty equivalent of a gamble is less than its expected value for risk-averse people.',
            'Insurance trades a small certain loss for protection against ruin; people also feel losses more than gains.',
          ],
        },
      ],
    },
    {
      title: 'Strategies',
      summary: 'Betting and stopping.',
      lessons: [
        {
          id: 'kelly',
          title: 'The Kelly Criterion',
          summary: 'How much to bet',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'A favourable coin',
              body: r`You've found a biased coin that lands heads 60% of the time, and someone will take even-money bets on it, over and over. Each time you bet a fraction $f$ of your current money: win and it grows by a factor $(1 + f)$, lose and it shrinks by $(1 - f)$.

Bet too little and you grow slowly. Bet everything and one tails wipes you out. What fraction is best?`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Maximise growth',
              prompt: r`Over many bets, your money grows by a factor $e^{g}$ per bet on average, where $g(f) = 0.6\ln(1 + f) + 0.4\ln(1 - f)$. Drag to find the fraction $f$ that makes $g$ as large as possible.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.6, ymin: -0.06, ymax: 0.03, grid: 0.1, gridY: 0.01, height: 280, padL: 56, axes: { xlabel: 'fraction bet each time', ylabel: 'growth rate', xfmt: (v) => `${Math.round(v * 100)}%`, yfmt: (v) => v.toFixed(2) },
                params: { f: { min: 0, max: 0.6, step: 0.01, value: 0.4, slider: false } },
                curves: [{ f: (f) => growth(f), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.f, y: (p) => growth(p.f), drag: { x: 'f' }, color: 'coral' }],
                readout: (p) => {
                  const g = growth(p.f);
                  return g > 0 ? r`betting $${Math.round(p.f * 100)}\%$: growth $${(100 * (Math.exp(g) - 1)).toFixed(2)}\%$ per bet on average` : r`betting $${Math.round(p.f * 100)}\%$: your money **shrinks** over time, despite the favourable coin`;
                },
                goal: (p) => Math.abs(p.f - 0.2) < 0.005,
                hint: 'The peak is where the curve is flat. For even-money bets, it is at 2p − 1.',
                solution: { f: 0.2 },
              },
              explain: r`The peak is at $f = 0.2$: bet **20%** of your money each time, growing about 2% per bet on average. This is the **Kelly criterion**, published by John Kelly at Bell Labs in 1956, building on Claude Shannon's information theory. Notice that betting 40% or more makes your money shrink in the long run, even though every bet is favourable.`,
            },
            {
              type: 'explain',
              title: 'Kelly’s formula',
              body: r`For a bet that pays $b$ times your stake if you win (probability $p$) and loses your stake otherwise ($q = 1 - p$), the growth-maximising fraction is
$$f^* = p - \frac{q}{b}$$
For our coin, $b = 1$: $f^* = 0.6 - 0.4 = 0.2$ ✓. If the edge is zero or negative, $f^* \le 0$: don't bet at all.`,
            },
            { /*anim:decisions*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Same luck, different bets',
              body: r`Four gamblers start with £100 and bet on the **same** 300 flips of the 60% coin. They differ only in the fraction they stake each time: {teal:10%}, {blue:20% (Kelly)}, {amber:40%} and {coral:60%}. The vertical scale is logarithmic: each gridline is ten times the one below.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: -2, ymax: 6, grid: 50, gridY: 1, height: 320, padL: 64, clipExtra: true,
                axes: { xlabel: 'flips', ylabel: 'money (£)', xticks: 50, yticks: 2, yAt: -2, yfmt: (v) => ({ '-2': '£0.01', 0: '£1', 2: '£100', 4: '£10k', 6: '£1m' })[v] ?? '' },
                animate: { param: 't', speed: 40, max: 330, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const n = Math.min(300, Math.floor(p.t));
                  return KELLY_F.map(([f, col]) => {
                    const pts = kellyPath(f, n);
                    return s('path', { d: pts.map((w, i) => `${i ? 'L' : 'M'}${plot.X(i).toFixed(1)} ${plot.Y(Math.max(-3, w)).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': f === 0.2 ? 3.5 : 2.5, 'stroke-linejoin': 'round' });
                  });
                },
                readout: (p) => { const n = Math.min(300, Math.floor(p.t)); return `after ${n} flips: ` + KELLY_F.map(([f, col]) => { const w = 10 ** kellyPath(f, n)[n]; return `{${col}:${w >= 1 ? '£' + sig(w, 2, true) : w >= 0.01 ? Math.round(w * 100) + 'p' : 'under 1p'}}`; }).join(' · '); },
              },
              after: r`Betting more feels bolder, but losses hurt more than wins help: a 60% stake turns £100 into £160 on a win but into £40 on a loss, and a win followed by a loss leaves only £64. The Kelly fraction grows fastest in the long run; staking twice Kelly (40%) has a growth rate of about zero; anything above that sinks towards ruin, **even though every single bet has a positive expected value**.`,
            },
            {
              type: 'numeric',
              title: 'Better odds',
              prompt: r`A bet pays 2 to 1 ($b = 2$) and you win with probability 40%. What fraction of your money should Kelly bet? (As a decimal.)`,
              answer: 0.4 - 0.6 / 2,
              tol: 0.001,
              wrong: [{ v: 0.4, why: r`Use $f^* = p - \frac{q}{b} = 0.4 - \frac{0.6}{2}$.` }, { v: -0.2, tol: 0.001, why: r`That uses $b = 1$. Here the payout is 2 to 1: $0.4 - \frac{0.6}{2}$.` }],
              explain: r`$f^* = 0.4 - \frac{0.6}{2} = 0.1$: bet 10% each time. Even though you lose most bets, the 2-to-1 payout gives you an edge.`,
            },
            {
              type: 'numeric',
              title: 'Half Kelly',
              prompt: r`Many professionals bet **half** the Kelly fraction. For the 60% coin, that's $f = 0.1$. The growth rate there is $g(0.1) \approx 0.0150$, compared with $0.0201$ at full Kelly. What percentage of the full-Kelly growth rate does half Kelly keep? (Nearest whole percent.)`,
              unit: '%',
              answer: Math.round((100 * growth(0.1)) / growth(0.2)),
              tol: 1,
              wrong: [{ v: 50, why: 'The growth curve is flat near its peak, so halving the bet loses much less than half the growth.' }],
              explain: r`$\frac{0.0150}{0.0201} \approx 75\%$ of the growth, with only half the size of the swings. Near the top of a smooth curve, small moves cost little: a recurring theme in optimisation.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Doubling time',
              prompt: r`At the Kelly fraction for the 60% coin, the growth rate is $g \approx 0.0201$ per bet, so your money grows like $e^{0.0201 n}$. About how many bets does it take to double your money? (Nearest whole number.)`,
              unit: 'bets',
              answer: Math.round(Math.log(2) / growth(0.2)),
              tol: 1,
              wrong: [{ v: 50, why: r`Solve $e^{0.0201 n} = 2$: $n = \frac{\ln 2}{0.0201}$.` }],
              explain: r`$n = \frac{\ln 2}{0.0201} \approx 34$ bets. Professional gamblers and investors who use Kelly ideas usually bet only a fraction of the Kelly amount, trading a little growth for much smaller swings, since in reality the true probabilities are never known exactly.`,
            },
          ],
          recap: [
            'Repeated bets compound, so maximise the average growth rate, not the expected value per bet.',
            r`Kelly fraction: $f^* = p - q/b$.`,
            'Overbetting, even with an edge, can make your money shrink.',
          ],
        },
        {
          id: 'stopping',
          title: 'When to Stop Looking',
          summary: 'The 37% rule',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Choosing the best',
              body: r`You're interviewing 100 candidates for a job, in random order. After each interview you must decide on the spot: hire or reject forever. You can rank each candidate against those you've seen, but not against future ones. How do you maximise your chance of hiring the very best?

A natural strategy: **look** at the first $r - 1$ candidates without hiring anyone, then **leap** at the first candidate who's better than all of them.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Look, then leap',
              prompt: r`The curve shows the chance of ending up with the best candidate for each choice of how many to reject first. Find the cut-off that gives the **highest** chance.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: 0, ymax: 0.45, grid: 10, gridY: 0.1, height: 280, padL: 48, axes: { xlabel: 'candidates rejected before leaping', ylabel: 'P(best)', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { k: { min: 0, max: 99, step: 1, value: 10, slider: false } },
                curves: [{ f: (k) => pBest(Math.max(1, Math.min(N, Math.round(k) + 1))), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.k, y: (p) => pBest(p.k + 1), drag: { x: 'k' }, color: 'coral' }],
                readout: (p) => `reject the first **${p.k}**, then take the next record-breaker: chance of the best = **${(100 * pBest(p.k + 1)).toFixed(2)}%**`,
                goal: (p) => pBest(p.k + 1) >= P_MAX - 0.0005,
                hint: 'Look for the top of the curve, a little over a third of the way along.',
                solution: { k: 37 },
              },
              explain: r`The best cut-off is to reject the first **37** (about $\frac{1}{e} \approx 37\%$), giving a 37% chance of picking the very best, astonishingly high given 100 candidates. As the number of candidates grows, both the best cut-off fraction and the success probability approach $\frac1e$.`,
            },
            {
              type: 'mcq',
              title: 'Why not leap sooner?',
              prompt: r`Why is it bad to start hiring after rejecting only the first 5 candidates?`,
              choices: [
                { t: 'You haven’t seen enough to know what “good” looks like, so you’re likely to settle for someone merely better than a weak start', ok: true },
                { t: 'Because the best candidate is always in the second half', why: 'The best candidate is equally likely to be anywhere. Leaping too early means your bar is set too low.' },
                { t: 'It’s not bad: earlier is always better', why: 'Too early sets a low bar; too late risks having already rejected the best. The optimum is in between.' },
              ],
              explain: r`Look too briefly and your benchmark is weak; look too long and the best has probably already gone by. The 37% rule balances the two. The same mathematics applies to flat-hunting, parking spaces and, somewhat less romantically, dating.`,
            },
            {
              type: 'numeric',
              title: 'Just three',
              prompt: r`With only 3 candidates, the best strategy is to reject the first and then take the first one better than everyone so far. What's the chance of getting the best? (As a decimal.)`,
              answer: 0.5,
              wrong: [{ v: 1 / 3, tol: 0.002, why: 'That’s picking at random. The strategy does better.' }],
              hint: 'List all 6 orders of the candidates ranked 1 (best), 2, 3, and check which ones end with the best hired.',
              explain: r`Of the 6 equally likely orders (listing ranks, with 1 the best), the strategy succeeds in 3: (2,1,3), (2,3,1) and (3,1,2). It fails when the best comes first, and with (3,2,1), where it settles for rank 2. So the chance is $\frac12$, versus $\frac13$ for picking at random.`,
            },
            {
              type: 'numeric',
              title: 'Ten candidates',
              prompt: r`With 10 candidates seen one at a time, the best strategy is to reject the first few and then take the first one better than all of them. The best number to reject for $n = 10$ is…`,
              answer: 3,
              explain: r`Rejecting 3 gives about a 40% chance of picking the very best of the ten. For large $n$ the rule tends to "reject the first 37%" and the success rate to $\frac1e \approx 37\%$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Flat hunting',
              prompt: r`You have 30 days to find a flat, viewing one per day, and must accept or reject each on the spot. Using the 37% rule, after about how many days should you start being willing to accept? (Nearest whole day.)`,
              unit: 'days',
              answer: Math.round(30 / Math.E),
              tol: 0.6,
              wrong: [{ v: 15, why: 'Half the time is too long a look. Use 37%: 30/e.' }],
              explain: r`$\frac{30}{e} \approx 11$ days: view for about 11 days, then take the first flat better than everything you've seen. (Real life adds complications, like flats being taken by others or second chances, which change the optimal rule, but the idea of a deliberate "look" phase holds up.)`,
            },
          ],
          recap: [
            'In optimal stopping, look first to set a benchmark, then leap at the first option that beats it.',
            r`The best cut-off is about $1/e \approx 37\%$ of the options.`,
            'It gives about a 37% chance of choosing the very best.',
          ],
        },
      ],
    },
    {
      title: 'Information and Learning',
      summary: 'What knowledge is worth, and how to gather it.',
      lessons: [
        {
          id: 'information',
          title: 'The Value of Information',
          summary: 'How much is a forecast worth?',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'To carry or not to carry',
              body: r`Each morning you decide whether to take an umbrella. Carrying one is a nuisance, costing you 1 "unit" of annoyance; getting soaked costs 10. If the chance of rain is $q$:
- **carry**: cost 1, whatever happens;
- **don't carry**: expected cost $10q$.

So carry when $10q > 1$, that is, when $q > 0.1$. The decision flips at a **threshold**.`,
            },
            {
              type: 'numeric',
              title: 'A different threshold',
              prompt: r`If getting soaked cost 4 units instead of 10, above what chance of rain should you carry the umbrella? (As a decimal.)`,
              answer: 0.25,
              wrong: [{ v: 4, why: r`Carry when $4q > 1$.` }, { v: 0.1, why: 'That was for a cost of 10.' }],
              explain: r`Carry when $4q > 1$, so $q > 0.25$. The threshold is the ratio of costs: the cheaper the bad outcome, the more likely it has to be before you act.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'When is a forecast worth most?',
              prompt: r`A perfect forecast would tell you each morning whether it will rain, so you'd only carry when needed: expected cost $q \times 1$. Its value is how much it lowers your expected cost. Find the chance of rain at which the forecast is **most valuable**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.1, gridY: 0.1, height: 270, axes: { xlabel: 'chance of rain q', ylabel: 'value of a perfect forecast', xfmt: (v) => v.toFixed(1), yfmt: (v) => v.toFixed(1) },
                params: { q: { min: 0, max: 1, step: 0.01, value: 0.5, slider: false } },
                curves: [{ f: (q) => evpi(q), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.q, y: (p) => evpi(p.q), drag: { x: 'q' }, color: 'coral' }],
                readout: (p) => r`$q = ${p.q.toFixed(2)}$: without forecast $${Math.min(1, 10 * p.q).toFixed(2)}$, with forecast $${p.q.toFixed(2)}$, value $${evpi(p.q).toFixed(2)}$`,
                goal: (p) => Math.abs(p.q - 0.1) < 0.001,
                hint: 'Look for the peak: it sits exactly where you were most torn about what to do.',
                solution: { q: 0.1 },
              },
              explain: r`The value peaks at $q = 0.1$, the **threshold**, where it's worth 0.9 units a day. When rain is almost certain, or almost impossible, you already know what to do and the forecast adds little. Information is worth most when it could **change your decision**.`,
            },
            {
              type: 'mcq',
              title: 'Information that changes nothing',
              prompt: r`A doctor will prescribe the same treatment whatever a particular test shows. What's the decision value of doing the test?`,
              choices: [
                { t: 'Zero: if no possible result would change the decision, the test can’t improve the outcome', ok: true },
                { t: 'Positive: more information is always valuable', why: 'Information only has decision value if it might change what you do.' },
                { t: 'It depends on how accurate the test is', why: 'Even a perfect test can’t help if every result leads to the same action.' },
              ],
              explain: r`Information has value for a decision only through the choices it could change. (A test might still be worth doing for other reasons, like reassurance or research, but not for this decision.) This principle helps doctors, businesses and engineers avoid paying for tests that can't matter.`,
            },
            {
              type: 'numeric',
              title: 'Worth of a perfect forecast',
              prompt: r`Carrying an umbrella costs you 1 (in hassle). Getting wet costs 10. Rain has probability 0.2. Without a forecast you always carry (expected cost 1, better than $0.2 \times 10 = 2$). With a perfect forecast you carry only when it will rain (expected cost $0.2 \times 1$). How much is the perfect forecast worth?`,
              answer: 0.8,
              tol: 0.001,
              explain: r`$1 - 0.2 = 0.8$: the **expected value of perfect information**. No forecast, however good, is worth more than this to you.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Should we survey first?',
              prompt: r`Drilling a well costs £30 million and finds oil worth £100 million with probability 0.4. A perfect geological survey would reveal in advance whether there's oil. What's the most the company should pay for the survey, in £ millions?`,
              unit: '£m',
              answer: 18,
              wrong: [{ v: 10, why: 'That’s the expected profit of drilling without the survey. Compare it with the expected profit with perfect information.' }, { v: 28, why: 'That’s the expected profit **with** the survey. Subtract what you’d expect without it.' }],
              hint: 'Without the survey, compute the expected profit of drilling. With it, you only drill when there is oil.',
              explain: r`Without the survey: drill, expected profit $0.4 \times 100 - 30 = £10$m. With it: drill only if oil, $0.4 \times (100 - 30) = £28$m. The survey is worth up to $28 - 10 = £18$m, because it saves the £30m wasted on dry wells 60% of the time.`,
            },
          ],
          recap: [
            'Decisions flip at a threshold set by the ratio of costs.',
            'The value of information is the improvement in expected outcome it allows.',
            'Information is worth most when you’re near the threshold, and nothing if it can’t change your choice.',
          ],
        },
        {
          id: 'bandits',
          title: 'Explore or Exploit?',
          summary: 'Learning while you choose',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Two slot machines',
              body: r`Two slot machines (one-armed bandits) pay out with unknown probabilities. Every pull is both a chance to win and a chance to **learn** which machine is better. Should you keep trying both (**explore**) or stick with the one that looks best so far (**exploit**)?

This **multi-armed bandit** problem describes clinical trials, website A/B tests, choosing restaurants, and how animals forage.`,
            },
            {
              type: 'mcq',
              title: 'Pure greed',
              prompt: r`You pull each machine once. Machine A pays, machine B doesn't. Is it wise to play A forever from now on?`,
              choices: [
                { t: 'No: one pull each tells you almost nothing, and you might be abandoning the better machine', ok: true },
                { t: 'Yes: A is clearly better', why: 'A single pull is weak evidence. Even a worse machine often pays on any one try.' },
                { t: 'Yes, because B is broken', why: 'Machines pay with some probability; one miss doesn’t mean B never pays.' },
              ],
              explain: r`Greedy strategies can lock in on a bad choice after a lucky start, and never discover the mistake. Some exploration is essential, but every exploratory pull on the worse machine has a cost.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How long to test?',
              prompt: r`One machine pays 60% of the time, the other 50%, but you don't know which is which. You have 1,000 pulls: test each machine $n$ times, then commit to whichever did better. Drag to find the $n$ that maximises your expected total winnings.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: 540, ymax: 600, grid: 50, gridY: 10, height: 270, padL: 48, axes: { xlabel: 'test pulls per machine (n)', ylabel: 'expected wins', yAt: 540 },
                params: { n: { min: 0, max: 300, step: 1, value: 10, slider: false } },
                curves: [{ f: (n) => etc(Math.round(n)), color: 'violet', width: 3 }, { f: () => 600, color: 'ink', dash: true, width: 1 }],
                points: [{ x: (p) => p.n, y: (p) => etc(p.n), drag: { x: 'n' }, color: 'coral' }],
                readout: (p) => r`$n = ${p.n}$: expected wins $${etc(p.n).toFixed(1)}$ of 1000 $\;$ (knowing the answer in advance: 600)`,
                goal: (p) => etc(p.n) >= ETC_MAX - 0.3,
                hint: 'Too little testing risks committing to the wrong machine; too much wastes pulls on the worse one.',
                solution: { n: 99 },
              },
              explain: r`About $n = 100$ test pulls each (anything from roughly 80 to 120 is nearly as good) gives about 584 expected wins, compared with 550 for picking at random and 600 with perfect knowledge. The curve is flat near the top, so being roughly right is what matters.`,
            },
            {
              type: 'numeric',
              title: 'Regret',
              prompt: r`The **regret** of a strategy is how much worse it does than always playing the better machine. Over 1,000 pulls, what is the expected regret of the best test-then-commit strategy (about 584 wins)?`,
              unit: 'wins',
              answer: 16,
              tol: 0.6,
              wrong: [{ v: 584, why: 'That’s the expected total. Regret is the shortfall from the ideal 600.' }],
              explain: r`$600 - 584 = 16$ wins: the price of not knowing which machine is better. Cleverer strategies that adapt as they go do even better.`,
            },
            {
              type: 'mcq',
              title: 'Optimism',
              prompt: r`A popular modern strategy, "upper confidence bound" (UCB), always picks the machine whose payout rate **could plausibly** be highest, given the data so far. Why does that work well?`,
              choices: [
                { t: 'Rarely tried machines have wide uncertainty, so they get explored; once evidence accumulates, the truly best one wins out', ok: true },
                { t: 'It always picks the machine with the highest average so far', why: 'That’s the greedy strategy. UCB adds a bonus for uncertainty.' },
                { t: 'It picks at random', why: 'UCB is deterministic: it favours options with high potential.' },
              ],
              explain: r`"Optimism in the face of uncertainty": a machine you've barely tried might be great, so it gets a bonus that shrinks as you learn. UCB-style algorithms keep regret growing only logarithmically with the number of pulls, and are used in online advertising and recommendation systems.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A bigger budget',
              prompt: r`With 10,000 pulls instead of 1,000, the best test length is about 275 per machine. Compared with the 1,000-pull case (about 100 each), the test phase is…`,
              choices: [
                { t: 'Longer in total, but a much smaller fraction of the budget (5.5% instead of 20%)', ok: true },
                { t: 'The same fraction of the budget', why: '2 × 275 = 550 is 5.5% of 10,000, while 2 × 100 is 20% of 1,000.' },
                { t: 'Shorter', why: 'More pulls justify more testing, since the payoff from getting it right lasts longer.' },
              ],
              explain: r`With a longer horizon, getting the choice right is worth more, so you test more, but statistical certainty grows like $\sqrt{n}$, so you need relatively less. The same logic says: explore more when you're young, or new to a city, and exploit more later on.`,
            },
          ],
          recap: [
            'Every choice can earn rewards or gather information: explore versus exploit.',
            'Test-then-commit needs a balanced test length; the optimum is flat.',
            'Adaptive strategies like UCB use optimism about uncertain options.',
          ],
        },
      ],
    },
  ],
};
