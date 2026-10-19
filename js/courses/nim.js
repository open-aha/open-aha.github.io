const r = String.raw;
const START = [3, 4, 5];
const bin = (n) => n.toString(2).padStart(3, '0');

// minimax: Max picks a branch, then Min picks a leaf
const TREE = [[3, 12], [2, 8], [14, 1]];
// Wythoff's game: losing positions (⌊kφ⌋, ⌊kφ⌋ + k) and their mirror images
const PHI = (1 + Math.sqrt(5)) / 2;
const WYTHOFF_L = new Set();
for (let k = 0; k < 12; k++) { const a = Math.floor(k * PHI), b = a + k; WYTHOFF_L.add(`${a},${b}`); WYTHOFF_L.add(`${b},${a}`); }
const Q0 = [9, 6];
const legalQueen = (x, y) => (x < Q0[0] && y === Q0[1]) || (x === Q0[0] && y < Q0[1]) || (Q0[0] - x === Q0[1] - y && x < Q0[0]);

export default {
  id: 'nim',
  subject: 'math',
  title: 'Nim & Strategy Games',
  level: 'Intermediate',
  cover: 'nim',
  tagline: 'Winning and losing positions, the XOR trick, strategy stealing, minimax and a golden-ratio game.',
  description: r`Some games can be solved completely by mathematics. Learn to classify winning and losing positions, beat anyone at Nim using binary arithmetic, see how a clever argument proves the first player wins without saying how, discover that every such game is secretly Nim, search game trees with minimax, and find the golden ratio hiding in Wythoff's game.`,
  prereq: 'Binary & Information',
  chapters: [
    {
      title: 'Solving Games',
      summary: 'Winning positions and Nim.',
      lessons: [
        {
          id: 'positions',
          title: 'Winning & Losing Positions',
          summary: 'Work backwards from the end',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of position',
              body: r`Consider games with two players, no luck and no hidden information, where both players have the same moves and **whoever makes the last move wins**. Every position is one of two kinds:
- a **losing position** (L): whoever must move from here loses, if the opponent plays well;
- a **winning position** (W): the player to move can win.

The rules for telling them apart:
- A position is **W** if **some** move leads to an L position.
- A position is **L** if **every** move leads to a W position (including having no moves at all).`,
            },
            {
              type: 'numeric',
              title: 'Take one or two',
              prompt: r`There's a pile of coins, and each turn a player takes 1 or 2. Taking the last coin wins. 0 coins is L (no move). Working upward: 1 and 2 are W (take everything), 3 is L (both moves leave a W position). What's the next L position after 3?`,
              unit: 'coins',
              answer: 6,
              wrong: [{ v: 4, why: 'From 4 you can take 1 and leave 3, an L position, so 4 is W.' }, { v: 5, why: 'From 5 you can take 2 and leave 3, an L position, so 5 is W.' }],
              explain: r`4 and 5 are W (move to 3), and from 6 every move leads to 5 or 4, both W, so 6 is **L**. The losing positions are the multiples of 3. If the pile isn't a multiple of 3, take enough to make it one, and you'll win.`,
            },
            {
              type: 'mcq',
              title: 'Who should go first?',
              prompt: r`In the same game (take 1 or 2), the pile starts with 20 coins. Should you choose to go first or second?`,
              cols: 2,
              choices: [
                { t: 'First, taking 2 coins', ok: true },
                { t: 'Second', why: '20 isn’t a multiple of 3, so it’s a winning position for the player to move.' },
              ],
              explain: r`20 is a W position: take 2 to leave 18, a multiple of 3. Then whatever your opponent takes (1 or 2), you take the rest of a group of 3, keeping the pile at a multiple of 3 until you take the last coin.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Twenty-one',
              prompt: r`A pile has 21 counters. Players take 1, 2 or 3 per turn, and whoever takes the last counter wins. It's your move: how many should you take?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 11, ymin: -0.6, ymax: 2.4, grid: false, axes: false, height: 150,
                params: { t: { min: 1, max: 3, step: 1, value: 3, label: 'take', color: 'coral' } },
                extra: ({ plot, p, s }) => Array.from({ length: 21 }, (_, i) => {
                  const x = 0.5 + (i % 11), y = i < 11 ? 1.6 : 0.4;
                  return s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 13, class: i >= 21 - p.t ? 'fl-card' : 'fl-blue', stroke: i >= 21 - p.t ? 'var(--line-2)' : 'var(--card)', 'stroke-width': 2, 'stroke-dasharray': i >= 21 - p.t ? '4 4' : null });
                }),
                readout: (p) => `take ${p.t}: leaves **${21 - p.t}** counters ${(21 - p.t) % 4 === 0 ? '(a losing position for your opponent!)' : ''}`,
                goal: (p) => (21 - p.t) % 4 === 0,
                hint: 'With moves of 1–3, the losing positions are 0, 4, 8, 12, …',
                solution: { t: 1 },
              },
              explain: r`Take **1**, leaving 20, a multiple of 4. Whatever your opponent takes ($k$), you take $4 - k$, keeping the pile at a multiple of 4 until you take the last counter. This game appeared in the TV show *Survivor* as "21 flags".`,
            },
            {
              type: 'mcq',
              title: 'The general rule',
              prompt: r`If each move takes between 1 and $k$ counters, which pile sizes are losing positions?`,
              choices: [
                { t: r`Multiples of $k + 1$`, ok: true },
                { t: r`Multiples of $k$`, why: r`Check $k = 2$: the losing positions are 0, 3, 6, …, multiples of 3.` },
                { t: 'Odd numbers', why: 'With k = 3, the pile of 4 is losing but 5 is winning.' },
              ],
              explain: r`From a multiple of $k + 1$, any move of $j$ leaves a non-multiple, and the opponent answers with $k + 1 - j$ to restore it.`,
            },
          ],
          recap: [
            'W positions have a move to an L position. L positions only lead to W positions.',
            'Work backwards from the end to classify positions.',
            'Winning means always moving to an L position.',
          ],
        },
        {
          id: 'nim',
          title: 'Nim',
          summary: 'The binary secret',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'The game of Nim',
              body: r`**Nim** has several heaps of counters. On your turn, take **any number** of counters (at least one) from **one** heap. Whoever takes the last counter wins.

In 1901, Charles Bouton found the complete solution. Write each heap size in **binary** and add them **without carrying**: in each column, an odd number of 1s gives 1, and an even number gives 0. This is the **nim-sum**, also known as XOR, written $\oplus$.

::: key
A position is **losing** for the player to move exactly when its nim-sum is **0**.
:::`,
            },
            {
              type: 'numeric',
              title: 'Compute a nim-sum',
              prompt: r`Heaps of 3, 4 and 5: in binary, $011$, $100$ and $101$. What is $3 \oplus 4 \oplus 5$, in decimal?`,
              answer: 2,
              wrong: [{ v: 12, why: 'That’s the ordinary sum. Nim-sum adds each binary column without carrying.' }, { v: 0, why: r`Check each column: the 4s column has two 1s (0), the 2s column has one 1 (1), and the 1s column has two 1s (0). So $010_2$.` }],
              explain: r`Column by column: 4s: $0 + 1 + 1$, even, so 0. 2s: $1 + 0 + 0$, odd, so 1. 1s: $1 + 0 + 1$, even, so 0. The nim-sum is $010_2 = 2$. It's not 0, so the player to move can win.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make the winning move',
              prompt: r`It's your move with heaps 3, 4, 5. Reduce **one** heap so that the nim-sum becomes **0**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: -0.8, ymax: 5.6, grid: false, axes: false, height: 340,
                params: Object.fromEntries(START.map((n, i) => [`h${i}`, { min: 0, max: n, step: 1, value: n, label: `heap ${i + 1}`, color: ['blue', 'coral', 'teal'][i], format: (v) => `${v}` }])),
                extra: ({ plot, p, s }) => START.flatMap((n, i) => {
                  const cx = 1 + i * 2, els = [];
                  for (let k = 0; k < n; k++) els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0.45 + k), r: 15, class: k < p[`h${i}`] ? `fl-${['blue', 'coral', 'teal'][i]}` : 'fl-card', stroke: k < p[`h${i}`] ? 'var(--card)' : 'var(--line-2)', 'stroke-width': 2, 'stroke-dasharray': k < p[`h${i}`] ? null : '4 4' }));
                  els.push(s('text', { x: plot.X(cx), y: plot.Y(-0.45), 'text-anchor': 'middle', style: 'font-family:var(--font-mono);font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));font-weight:600', text: bin(p[`h${i}`]) }));
                  return els;
                }),
                readout: (p) => {
                  const x = p.h0 ^ p.h1 ^ p.h2;
                  const changed = START.filter((n, i) => p[`h${i}`] !== n).length;
                  return `nim-sum = ${bin(p.h0)} ⊕ ${bin(p.h1)} ⊕ ${bin(p.h2)} = **${bin(x)}** (${x})${changed > 1 ? ' · You may only take from one heap!' : ''}`;
                },
                goal: (p) => (p.h0 ^ p.h1 ^ p.h2) === 0 && START.filter((n, i) => p[`h${i}`] !== n).length === 1,
                hint: 'The nim-sum is 010. Which heap can lose its 2s bit (or flip bits to cancel it) by getting smaller?',
                solution: { h0: 1 },
              },
              explain: r`Reduce the heap of 3 to **1**: $1 \oplus 4 \oplus 5 = 001 \oplus 100 \oplus 101 = 000$ ✓. Whatever your opponent does next breaks the zero, and you can always restore it. Eventually you take the last counter.`,
            },
            {
              type: 'numeric',
              title: 'Win or lose?',
              prompt: r`Heaps of 7, 5 and 3. What's the nim-sum? (If it's 0, the player to move loses.)`,
              answer: 1,
              wrong: [{ v: 15, why: 'That’s the ordinary sum. XOR the binary digits: 111 ⊕ 101 ⊕ 011.' }, { v: 0, why: 'Check the 1s column: 1 + 1 + 1 is odd.' }],
              explain: r`$111 \oplus 101 \oplus 011 = 001$: nim-sum 1, a winning position. A winning move: reduce 7 to 6, making $110 \oplus 101 \oplus 011 = 000$.`,
            },
            {
              type: 'mcq',
              title: 'Misère Nim',
              prompt: r`In **misère** Nim, whoever takes the last counter **loses**. How does the winning strategy change?`,
              choices: [
                { t: 'Play normal Nim until your move would leave only heaps of size 1; then leave an odd number of them', ok: true },
                { t: 'Do the exact opposite of normal Nim all game', why: 'Surprisingly, the normal strategy works until the very end.' },
                { t: 'There’s no strategy for misère Nim', why: 'There is, and it’s almost the same as normal Nim.' },
              ],
              explain: r`Almost all the game is identical. Only when every heap is about to be size 1 or 0 do you switch: leave an **odd** number of single counters, so your opponent takes the last one. Charles Bouton included this twist in his 1901 paper that first solved Nim.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why it works',
              prompt: r`Why can a player facing nim-sum 0 never move to another nim-sum-0 position?`,
              choices: [
                { t: 'Changing one heap changes at least one of its binary digits, which makes that column’s count odd', ok: true },
                { t: 'Because heaps can only shrink', why: 'Shrinking matters, but the key is that any change to one heap flips at least one column’s parity.' },
                { t: 'It can, if they take enough counters', why: 'Changing a single heap always flips at least one bit, so the nim-sum can’t stay 0.' },
              ],
              explain: r`With nim-sum 0, every column has an even number of 1s. A move changes just one heap, so it flips at least one bit in that heap, making some column odd: the nim-sum becomes nonzero. And from any nonzero nim-sum there's always a move back to 0. So zero positions are exactly the L positions.`,
            },
          ],
          recap: [
            'Nim-sum: add the heap sizes in binary without carrying (XOR).',
            'Nim-sum 0 means a losing position for the player to move.',
            'Winning strategy: always move to nim-sum 0.',
          ],
        },
      ],
    },
    {
      title: 'Clever Arguments',
      summary: 'Strategy stealing and Grundy numbers.',
      lessons: [
        {
          id: 'stealing',
          title: 'Strategy Stealing',
          summary: 'Proving a win without finding it',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Chomp',
              body: r`**Chomp** is played on a rectangular chocolate bar whose bottom-left square is poisoned. Players take turns choosing a square and eating it along with every square above it and to its right. Whoever is forced to eat the poisoned square loses.

For most bar sizes, no one knows a winning strategy. Yet we can **prove** the first player always has one.`,
            },
            {
              type: 'mcq',
              title: 'The argument',
              prompt: r`Suppose the **second** player had a winning strategy. The first player eats just the top-right square. Why does that lead to a contradiction?`,
              choices: [
                { t: 'Whatever winning reply the second player makes, the first player could have made that move instead at the very start', ok: true },
                { t: 'Eating the top-right square always wins', why: 'It might not! The argument doesn’t say what wins, only that something does.' },
                { t: 'Chomp always ends in a draw', why: 'Chomp can’t be drawn: someone eventually eats the poison.' },
              ],
              explain: r`The second player's winning reply to "eat the top-right square" leaves some position $P$. But that reply eats the top-right square anyway (every move does), so the first player could have moved straight to $P$ on turn one and **stolen** the winning strategy. That contradicts the assumption, so the first player must be the one who can win. The argument proves a win exists without revealing it.`,
            },
            {
              type: 'mcq',
              title: 'Square Chomp',
              prompt: r`On a **square** Chomp bar (say 6 × 6), there is a known winning first move. What is it?`,
              choices: [
                { t: 'Eat the square diagonally next to the poison, leaving an L-shape with two equal arms; then copy every opponent move on the other arm', ok: true },
                { t: 'Eat the top-right square', why: 'Strategy stealing says something wins, but this specific move isn’t known to.' },
                { t: 'Eat a whole row', why: 'That leaves a rectangle, whose strategy is unknown in general.' },
              ],
              explain: r`After eating the square at (2, 2), only the bottom row and left column remain, equal in length. Whatever the opponent eats from one arm, you eat the same amount from the other. Eventually they must take the poison. Symmetry strategies like this crop up in many games.`,
            },
            {
              type: 'numeric',
              title: 'A one-row Chomp',
              prompt: r`Chomp on a single row of 10 squares, with the poisoned square at the left end: players take any square and everything to its right; whoever must take the poisoned square loses. How many squares should the first player take on the first move?`,
              unit: 'squares',
              answer: 9,
              explain: r`Take all 9 safe squares at once, leaving only the poisoned one: the opponent must eat it. In bigger rectangles the strategy-stealing argument proves the first player can always win, without telling anyone how.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where are the winning bites?',
              body: r`Strategy stealing proves the first player can always win rectangular Chomp, but not **how**. A computer can search small boards: the green squares are the winning first bites (the poisoned square is bottom left). Try different sizes.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 7, ymin: 0, ymax: 4.6, grid: false, axes: false, maxWidth: 460,
                params: { r: { min: 2, max: 4, step: 1, value: 2, label: 'rows', color: 'blue' }, c: { min: 2, max: 7, step: 1, value: 4, label: 'columns', color: 'blue' } },
                extra: ({ plot, p, s }) => { const memo = new Map(); const win = (st) => { const key = st.join(','); if (memo.has(key)) return memo.get(key); let w = false; for (let r = 0; r < st.length && !w; r++) for (let c = 0; c < st[r] && !w; c++) { if (r === 0 && c === 0) continue; const nx = st.map((L, i) => (i >= r ? Math.min(L, c) : L)); if (!win(nx)) w = true; } memo.set(key, w); return w; }; const start = Array(p.r).fill(p.c), out = []; for (let r = 0; r < p.r; r++) for (let c = 0; c < p.c; c++) { let cls = 'fl-amber-soft'; if (r === 0 && c === 0) cls = 'fl-coral'; else if (!win(start.map((L, i) => (i >= r ? Math.min(L, c) : L)))) cls = 'fl-teal'; out.push(s('rect', { x: plot.X(c + 0.06), y: plot.Y(r + 0.94), width: plot.X(0.88) - plot.X(0), height: plot.Y(0) - plot.Y(0.88), rx: 6, class: cls, stroke: 'var(--line-2)' })); } return out; },
                readout: (p) => { const memo = new Map(); const win = (st) => { const key = st.join(','); if (memo.has(key)) return memo.get(key); let w = false; for (let r = 0; r < st.length && !w; r++) for (let c = 0; c < st[r] && !w; c++) { if (r === 0 && c === 0) continue; const nx = st.map((L, i) => (i >= r ? Math.min(L, c) : L)); if (!win(nx)) w = true; } memo.set(key, w); return w; }; const start = Array(p.r).fill(p.c); let n = 0; for (let r = 0; r < p.r; r++) for (let c = 0; c < p.c; c++) if ((r || c) && !win(start.map((L, i) => (i >= r ? Math.min(L, c) : L)))) n++; return `${p.r} × ${p.c} board: **${n} winning first bite${n === 1 ? '' : 's'}** (green)`; },
              },
              after: r`There is always at least one green square, exactly as strategy stealing promises; for a square board it is the bite that leaves an L shape. But for most boards nobody knows a simple rule for finding it: the proof shows a win exists without saying where it is.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The game of Hex',
              prompt: r`In Hex, players take turns placing stones on a diamond-shaped board of hexagons, each trying to connect their two sides. A draw is impossible, and an extra stone never hurts. What does strategy stealing show?`,
              choices: [
                { t: 'The first player has a winning strategy', ok: true },
                { t: 'The second player wins', why: 'If the second player had a winning strategy, the first player could steal it using one extra stone, which never hurts.' },
                { t: 'The game is a draw with perfect play', why: 'Hex can never end in a draw: someone always connects.' },
              ],
              explain: r`John Nash (of game-theory fame) used this argument around 1949: the first player places any stone, then pretends to be the second player and follows the supposed winning strategy, and the extra stone can only help. So the first player wins. For large boards, nobody knows **how**. To keep things fair, real games often use a "swap rule".`,
            },
          ],
          recap: [
            'Strategy stealing proves a winning strategy exists without finding it.',
            'The first player wins Chomp and Hex with perfect play.',
            'The proof works because an extra move never hurts.',
          ],
        },
        {
          id: 'grundy',
          title: 'Everything Is Nim',
          summary: 'The Sprague–Grundy theorem',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Grundy numbers',
              body: r`In the 1930s, Roland Sprague and Patrick Grundy independently proved something remarkable: every game of this kind (two players, the same moves for both, last move wins) behaves exactly like a **single Nim heap** of some size, its **Grundy number**.

To compute it: a position with no moves has Grundy number 0. Otherwise, take the **smallest non-negative number not among** the Grundy numbers of the positions you can move to (the "mex", minimum excluded value).

A position is losing exactly when its Grundy number is 0. And a sum of several games is solved by taking the nim-sum of their Grundy numbers.`,
            },
            {
              type: 'numeric',
              title: 'Take one or two, again',
              prompt: r`In "take 1 or 2 coins", the Grundy numbers go 0, 1, 2, 0, 1, 2, … for piles of 0, 1, 2, 3, 4, 5, … What is the Grundy number of a pile of 7?`,
              answer: 1,
              wrong: [{ v: 0, why: r`The pattern repeats every 3: 7 leaves remainder 1 when divided by 3.` }, { v: 7, why: 'In Nim, a heap of 7 has Grundy number 7, but this game only allows taking 1 or 2.' }],
              explain: r`From 7 you can reach 6 (Grundy 0) and 5 (Grundy 2). The smallest number not in $\{0, 2\}$ is **1**. In general, the Grundy number is $n \bmod 3$.`,
            },
            {
              type: 'numeric',
              title: 'Compute a mex',
              prompt: r`From some position, the reachable positions have Grundy numbers 0, 1 and 3. What is this position's Grundy number?`,
              answer: 2,
              wrong: [{ v: 4, why: 'Mex is the smallest number **not** in the set, not one more than the largest.' }, { v: 0, why: '0 is in the set.' }],
              explain: r`The smallest non-negative integer missing from $\{0, 1, 3\}$ is **2**. So this position behaves exactly like a Nim heap of 2.`,
            },
            {
              type: 'numeric',
              title: 'Take one, three or four',
              prompt: r`In a game where you may take 1, 3 or 4 counters, the Grundy numbers for piles 0 to 6 are 0, 1, 0, 1, 2, 3, 2. What is the Grundy number of a pile of 7?`,
              answer: 0,
              wrong: [{ v: 1, why: 'From 7 you reach 6, 4 and 3, with Grundy numbers 2, 2 and 1. The mex of {1, 2} is 0.' }],
              explain: r`Moves from 7 reach 6, 4 and 3, with Grundy numbers 2, 2, 1. The smallest missing number is **0**, so 7 is a losing position. The pattern then repeats with period 7.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Patterns in Grundy numbers',
              body: r`For a subtraction game (take any amount from an allowed set), each heap size gets a Grundy number: the mex of the values you can move to. Heaps with value 0 (coral) are losing for the player to move. Pick a rule and look for patterns.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 30.5, ymin: 0, ymax: 4.5, grid: false, height: 240, axes: { xlabel: 'heap size', ylabel: 'Grundy number', xticks: 5, yticks: 1, xAt: 0, yAt: -0.5 },
                params: { set: { min: 0, max: 3, step: 1, value: 1, label: 'allowed moves', color: 'violet', format: (v) => ['take 1 or 2', 'take 1, 3 or 4', 'take 2 or 5', 'take 1, 2 or 4'][v] } },
                extra: ({ plot, p, s }) => { const S = [[1, 2], [1, 3, 4], [2, 5], [1, 2, 4]][p.set], g = []; for (let n = 0; n <= 30; n++) { const seen = new Set(S.filter((k) => k <= n).map((k) => g[n - k])); let m = 0; while (seen.has(m)) m++; g.push(m); } return g.map((v, n) => v === 0 ? s('circle', { cx: plot.X(n), cy: plot.Y(0.12), r: 5, class: 'fl-coral' }) : s('rect', { x: plot.X(n - 0.35), y: plot.Y(v), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 2, class: 'fl-violet' })); },
                readout: (p) => { const S = [[1, 2], [1, 3, 4], [2, 5], [1, 2, 4]][p.set], g = []; for (let n = 0; n <= 30; n++) { const seen = new Set(S.filter((k) => k <= n).map((k) => g[n - k])); let m = 0; while (seen.has(m)) m++; g.push(m); } return `Grundy numbers: ${g.slice(0, 15).join(' ')} … · losing heaps: **${g.map((v, n) => (v ? null : n)).filter((n) => n !== null).slice(0, 7).join(', ')}, …**`; },
              },
              after: r`Every subtraction game with a finite move set eventually repeats its Grundy numbers in a cycle: period 3 for "take 1 or 2", period 7 for "take 1, 3 or 4". Once you have spotted the cycle you can play a heap of any size perfectly, and by the Sprague–Grundy theorem you can combine several heaps by XOR-ing their values, exactly as in Nim.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Playing two games at once',
              prompt: r`You play two take-1-or-2 piles side by side, with 7 and 4 coins. On each turn you move in **one** of the piles. Taking the last coin overall wins. Are you, the player to move, winning?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`Grundy numbers: $7 \bmod 3 = 1$ and $4 \bmod 3 = 1$, and $1 \oplus 1 = 0$, so it's a losing position.` },
              ],
              explain: r`Both piles have Grundy number 1, and $1 \oplus 1 = 0$: a **losing** position for the player to move. Your opponent can mirror you, keeping the two Grundy numbers equal. The Sprague–Grundy theorem turns complicated combined games into simple Nim arithmetic.`,
            },
          ],
          recap: [
            'Every impartial game is equivalent to a Nim heap of size equal to its Grundy number.',
            'Grundy number = mex of the Grundy numbers of the positions you can reach.',
            'For combined games, take the nim-sum of the Grundy numbers.',
          ],
        },
      ],
    },
    {
      title: 'More Games',
      summary: 'Game trees and a queen on a grid.',
      lessons: [
        {
          id: 'minimax',
          title: 'Game Trees & Minimax',
          summary: 'Assume your opponent is clever',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Looking ahead',
              body: r`For games with scores (or win/draw/lose), draw a **game tree**: each branch is a move, each leaf a final result. One player (Max) wants the result high, the other (Min) wants it low.

**Minimax**: work up from the leaves. At Min's turns, take the **smallest** value below; at Max's turns, the **largest**. The value at the top is what Max can guarantee against a perfect opponent.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose a branch',
              prompt: r`You are Max (choosing at the top). After your choice, Min chooses one of the two leaves below it. Pick the branch that guarantees you the **highest** result.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 6, grid: false, axes: false, height: 260,
                params: { k: { min: 0, max: 2, step: 1, value: 2, label: 'your branch', color: 'violet', format: (v) => ['left', 'middle', 'right'][v] } },
                extra: ({ plot, p, s }) => {
                  const els = [], root = [6, 5.2];
                  TREE.forEach((leaves, i) => {
                    const m = [2 + 4 * i, 3], chosen = i === p.k, mn = Math.min(...leaves);
                    els.push(s('line', { x1: plot.X(root[0]), y1: plot.Y(root[1]), x2: plot.X(m[0]), y2: plot.Y(m[1]), stroke: chosen ? 'var(--violet)' : 'var(--line-2)', 'stroke-width': chosen ? 5 : 3 }));
                    leaves.forEach((v, j) => {
                      const L = [m[0] - 1 + 2 * j, 0.8], minPick = chosen && v === mn;
                      els.push(s('line', { x1: plot.X(m[0]), y1: plot.Y(m[1]), x2: plot.X(L[0]), y2: plot.Y(L[1]), stroke: minPick ? 'var(--coral)' : 'var(--line-2)', 'stroke-width': minPick ? 5 : 3 }));
                      els.push(s('rect', { x: plot.X(L[0]) - 18, y: plot.Y(L[1]) - 16, width: 36, height: 32, rx: 6, class: minPick ? 'fl-coral' : 'fl-card', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                      els.push(s('text', { x: plot.X(L[0]), y: plot.Y(L[1]) + 6, 'text-anchor': 'middle', style: 'font-weight:700;font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', text: String(v) }));
                    });
                    els.push(s('circle', { cx: plot.X(m[0]), cy: plot.Y(m[1]), r: 16, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2 }));
                    els.push(s('text', { x: plot.X(m[0]), y: plot.Y(m[1]) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'Min' }));
                  });
                  els.push(s('circle', { cx: plot.X(root[0]), cy: plot.Y(root[1]), r: 18, class: 'fl-violet-soft', stroke: 'var(--ink)', 'stroke-width': 2 }));
                  els.push(s('text', { x: plot.X(root[0]), y: plot.Y(root[1]) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'Max' }));
                  return els;
                },
                readout: (p) => `You choose ${['left', 'middle', 'right'][p.k]}; Min replies with **${Math.min(...TREE[p.k])}**.`,
                goal: (p) => p.k === 0,
                hint: 'For each branch, assume Min picks the worse leaf for you.',
                solution: { k: 0 },
              },
              explain: r`Min's replies give 3, 2 and 1, so the left branch guarantees **3**. The right branch is tempting (it contains 14!), but a clever Min answers with 1. Minimax assumes the opponent plays their best, and guards against it.`,
            },
            {
              type: 'numeric',
              title: 'Noughts and crosses',
              prompt: r`In tic-tac-toe, X has 9 possible first moves, then O has 8 replies. How many different positions-by-move-sequence are there after the first two moves?`,
              answer: 72,
              wrong: [{ v: 17, why: 'Each of the 9 first moves can be followed by any of 8 replies: multiply.' }, { v: 81, why: 'O can’t play in the square X just took.' }],
              explain: r`$9 \times 8 = 72$. Continuing, there are at most $9! = 362{,}880$ move sequences; since many games end early, the true number of complete games is 255,168, few enough for a computer to search completely.`,
            },
            {
              type: 'mcq',
              title: 'Solved',
              prompt: r`Searching tic-tac-toe's whole game tree with minimax gives the value of the starting position. What is it?`,
              choices: [
                { t: 'A draw: with perfect play from both sides, nobody wins', ok: true },
                { t: 'X wins', why: 'X has an advantage, but O can always defend.' },
                { t: 'O wins', why: 'Going second is never an advantage in tic-tac-toe.' },
              ],
              explain: r`That's why games between experienced players always draw. Draughts (checkers) was also solved as a draw in 2007, after almost two decades of computation by Jonathan Schaeffer's team.`,
            },
            {
              type: 'numeric',
              title: 'Pruning the tree',
              prompt: r`Alpha–beta pruning, with good move ordering, examines only about $b^{d/2}$ positions instead of $b^d$. For branching factor 30 and depth 4, how many is that?`,
              answer: 900,
              explain: r`$30^2 = 900$ instead of $30^4 = 810{,}000$. Pruning effectively doubles the depth a program can search in the same time.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Too big for minimax',
              prompt: r`Claude Shannon estimated that chess has about $10^{120}$ possible games, while the observable universe contains about $10^{80}$ atoms. How many orders of magnitude (powers of 10) more games are there than atoms?`,
              answer: 40,
              wrong: [{ v: 1.5, tol: 0.01, why: 'That’s 120 ÷ 80. Orders of magnitude subtract: 120 − 80.' }, { v: 200, why: 'Dividing powers of 10 subtracts the exponents.' }],
              explain: r`$\frac{10^{120}}{10^{80}} = 10^{40}$. Chess programs can't search everything, so they look a limited number of moves ahead, estimate the resulting positions, and prune hopeless branches ("alpha–beta pruning"). Modern engines add neural networks trained by self-play.`,
            },
          ],
          recap: [
            'Minimax: Min takes the smallest, Max the largest, working up from the leaves.',
            'It finds the best guaranteed result against a perfect opponent.',
            'Small games (tic-tac-toe, draughts) are solved; chess is far too big.',
          ],
        },
        {
          id: 'wythoff',
          title: 'Wythoff’s Queen',
          summary: 'Losing positions and the golden ratio',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'A queen heading home',
              body: r`A chess queen stands on a grid. Players take turns moving it any distance **left**, **down**, or **diagonally down-left**. Whoever moves it into the corner (0, 0) wins. (This is Wythoff's game, from 1907, in disguise: two heaps, where you may take from one heap or the same amount from both.)

Losing positions, as always, are those from which every move reaches a winning position.`,
            },
            {
              type: 'numeric',
              title: 'Next to the corner',
              prompt: r`(0, 0) is losing (no moves: the previous player won). Any square in the bottom row, left column or main diagonal can reach (0, 0) in one move, so it's winning. The next losing positions are (1, 2) and its mirror image. What's the sum of the coordinates of (1, 2)?`,
              answer: 3,
              wrong: [{ v: 2, why: '1 + 2 = 3.' }],
              explain: r`From (1, 2) the queen can reach (0, 2), (1, 1), (1, 0) or (0, 1), and each of those can then reach the corner. So (1, 2) is losing. The next ones are (3, 5), (4, 7), (6, 10), (8, 13)…`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make the winning move',
              prompt: r`The queen is on (9, 6). Move it (left, down or diagonally down-left) to a **losing** position for your opponent.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.6, xmax: 11.6, ymin: -0.6, ymax: 8.6, grid: 1, axes: false, maxWidth: 520,
                params: { x: { min: 0, max: 11, step: 1, value: 9, slider: false }, y: { min: 0, max: 8, step: 1, value: 6, slider: false } },
                extra: ({ plot, s }) => {
                  const [qx, qy] = Q0, els = [];
                  els.push(s('line', { x1: plot.X(0), y1: plot.Y(qy), x2: plot.X(qx), y2: plot.Y(qy), stroke: 'var(--violet)', 'stroke-width': 3, opacity: 0.3 }));
                  els.push(s('line', { x1: plot.X(qx), y1: plot.Y(0), x2: plot.X(qx), y2: plot.Y(qy), stroke: 'var(--violet)', 'stroke-width': 3, opacity: 0.3 }));
                  els.push(s('line', { x1: plot.X(qx - qy), y1: plot.Y(0), x2: plot.X(qx), y2: plot.Y(qy), stroke: 'var(--violet)', 'stroke-width': 3, opacity: 0.3 }));
                  els.push(s('rect', { x: plot.X(-0.4), y: plot.Y(0.4), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(0.8), class: 'fl-teal-soft' }));
                  els.push(s('text', { x: plot.X(qx), y: plot.Y(qy) - 16, 'text-anchor': 'middle', style: 'font-size:22px', text: '♛' }));
                  for (let i = 0; i <= 11; i++) els.push(s('text', { x: plot.X(i), y: plot.Y(-0.5) + 4, 'text-anchor': 'middle', class: 'tick', text: String(i) }));
                  return els;
                },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral', r: 9 }],
                readout: (p) => (p.x === Q0[0] && p.y === Q0[1] ? 'Drag the coral dot to where the queen should go.' : legalQueen(p.x, p.y) ? `(${p.x}, ${p.y}): a legal move${WYTHOFF_L.has(`${p.x},${p.y}`) ? ', and a **losing position** for your opponent!' : ', but your opponent can win from there.'}` : `(${p.x}, ${p.y}) isn't a legal queen move from (9, 6).`),
                goal: (p) => legalQueen(p.x, p.y) && WYTHOFF_L.has(`${p.x},${p.y}`),
                hint: 'The losing positions include (1, 2), (3, 5), (4, 7) and their mirror images. Which can you reach?',
                solution: { x: 7, y: 4 },
              },
              explain: r`Move diagonally to **(7, 4)**, the mirror image of the losing position (4, 7). From there, every queen move leads to a winning position for you.`,
            },
            { /*anim:nim*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Sieving out the losing squares',
              body: r`Find every losing square on a 21 × 21 board at once. Start from the corner $(0, 0)$, which is losing. Every square that can reach a losing square in one queen move (along its row, its column or its diagonal) is **winning**: shade it. Then the nearest square still unshaded must be losing too. Repeat.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.7, xmax: 21.2, ymin: -0.7, ymax: 21.2, grid: false, axes: false, maxWidth: 440,
                animate: { param: 't', speed: 0.8, max: 12, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const P = [[0, 0], [1, 2], [3, 5], [4, 7], [6, 10], [8, 13], [9, 15], [11, 18], [12, 20]], N = 21, els = [];
                  const k = Math.min(P.length, Math.floor(p.t) + 1), f = Math.min(1, p.t - Math.floor(p.t));
                  const lost = new Set(), win = new Set();
                  const cell = (x, y, cls, o = {}) => s('rect', { x: plot.X(x - 0.45), y: plot.Y(y + 0.45), width: plot.X(0.9) - plot.X(0), height: plot.Y(0) - plot.Y(0.9), rx: 2, class: cls, ...o });
                  for (let i = 0; i < k; i++) {
                    for (const [a, b] of i ? [P[i], [P[i][1], P[i][0]]] : [P[0]]) {
                      lost.add(`${a},${b}`);
                      const reach = i === k - 1 ? f * N : N;
                      for (let d = 1; d <= reach; d++) for (const [x, y] of [[a + d, b], [a, b + d], [a + d, b + d]]) if (x < N && y < N) win.add(`${x},${y}`);
                    }
                  }
                  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
                    const key = `${x},${y}`;
                    els.push(cell(x, y, lost.has(key) ? 'fl-coral' : win.has(key) ? 'fl-blue-soft' : 'fl-surface'));
                  }
                  if (p.t >= P.length) {
                    const phi = (1 + Math.sqrt(5)) / 2;
                    for (const m of [phi, 1 / phi]) els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(m > 1 ? 21 / m : 21), y2: plot.Y(m > 1 ? 21 : 21 * m), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }));
                  }
                  return els;
                },
                readout: (p) => { const P = ['(0, 0)', '(1, 2)', '(3, 5)', '(4, 7)', '(6, 10)', '(8, 13)', '(9, 15)', '(11, 18)', '(12, 20)'], k = Math.min(P.length, Math.floor(p.t) + 1); return `losing squares so far: ${P.slice(0, k).join(', ')}${p.t >= P.length ? ' (and their mirror images)' : ''}`; },
              },
              after: r`Each losing square knocks out its whole row, column and diagonal, so the next losing square must sit in a fresh row and a fresh column, and on a fresh diagonal. That forces the gaps $b - a$ to go $0, 1, 2, 3, \dots$, while $a$ takes the smallest number not used yet. The losing squares end up hugging two straight lines through the corner, with slopes $\varphi$ and $1/\varphi$ (dashed).`,
            },
            {
              type: 'explain',
              title: 'The golden ratio appears',
              body: r`The losing positions $(a_k, b_k)$ are
$$(0, 0),\ (1, 2),\ (3, 5),\ (4, 7),\ (6, 10),\ (8, 13),\ (9, 15),\ \dots$$
Each $b_k = a_k + k$, and amazingly, $a_k = \lfloor k\varphi \rfloor$ and $b_k = \lfloor k\varphi^2 \rfloor$, where $\varphi = \frac{1 + \sqrt5}{2} \approx 1.618$ is the **golden ratio**. Every positive whole number appears exactly once in the two lists combined.`,
            },
            {
              type: 'numeric',
              title: 'Predict the next',
              prompt: r`Using $a_k = \lfloor k\varphi \rfloor$ (round down), find $a_7$. ($7\varphi \approx 11.33$.)`,
              answer: 11,
              wrong: [{ v: 12, why: 'Round down, not to the nearest.' }],
              explain: r`$\lfloor 11.33 \rfloor = 11$, and $b_7 = 11 + 7 = 18$. So (11, 18) is the next losing position after (9, 15).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Not like Nim',
              prompt: r`Why can't Wythoff's game be solved with the plain Nim-sum rule for two heaps?`,
              choices: [
                { t: 'Taking the same amount from both heaps is an extra kind of move that Nim doesn’t allow', ok: true },
                { t: 'Because it’s played on a grid', why: 'The grid is just a picture of two heap sizes.' },
                { t: 'It can: (a, a) positions are losing', why: 'In Wythoff, (5, 5) is winning: move diagonally straight to (0, 0).' },
              ],
              explain: r`In two-heap Nim, the losing positions are equal heaps $(a, a)$. The diagonal move destroys that, and the losing positions are pushed apart by golden-ratio spacing. (Sprague–Grundy still applies, but Wythoff's Grundy numbers are notoriously irregular.)`,
            },
          ],
          recap: [
            'Wythoff’s game: move a queen left, down or diagonally toward the corner.',
            r`Losing positions: $(\lfloor k\varphi \rfloor, \lfloor k\varphi^2 \rfloor)$ and their mirrors.`,
            'A single extra kind of move can completely change a game’s structure.',
          ],
        },
        {
          id: 'fibonacci-nim',
          title: 'Fibonacci Nim',
          summary: 'A game solved by Zeckendorf',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Take up to twice as many',
              body: r`One pile of stones. The first player takes any number except the whole pile. After that, each player may take at least 1 stone and **at most twice** what the opponent just took. Whoever takes the last stone wins.

The winning strategy uses a beautiful fact found by Édouard Zeckendorf: every positive whole number can be written in exactly one way as a sum of **non-consecutive** Fibonacci numbers (1, 2, 3, 5, 8, 13, 21, …). For example, $20 = 13 + 5 + 2$.`,
            },
            {
              type: 'numeric',
              title: 'Write it in Fibonacci',
              prompt: r`Write 30 as a sum of non-consecutive Fibonacci numbers, always taking the biggest one that fits. How many terms do you need?`,
              answer: 3,
              explain: r`$30 = 21 + 8 + 1$: three terms. Taking the biggest Fibonacci number each time automatically avoids consecutive ones.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Winning moves',
              prompt: r`The rule: if the pile is a Fibonacci number, the first player loses (against perfect play). Otherwise, take the **smallest** term of its Zeckendorf sum. Find the smallest pile **greater than 20** on which the first player loses.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, maxWidth: 560, height: 160,
                params: { n: { min: 2, max: 100, step: 1, value: 20, label: 'stones', color: 'violet' } },
                extra: ({ plot, p, s }) => { const F = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89], parts = []; let m = p.n; for (let i = F.length - 1; i >= 0; i--) if (F[i] <= m) { parts.push(F[i]); m -= F[i]; } const out = [], W = 9.4 / p.n; let x = 0.3; parts.forEach((v, i) => { out.push(s('rect', { x: plot.X(x), y: plot.Y(2.2), width: plot.X(v * W) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(1.4), rx: 4, class: i === parts.length - 1 && parts.length > 1 ? 'fl-coral' : 'fl-violet-soft', stroke: 'var(--violet)' }), s('text', { x: plot.X(x + (v * W) / 2), y: plot.Y(1.5) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink)', text: String(v) })); x += v * W; }); return out; },
                readout: (p) => { const F = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89], parts = []; let m = p.n; for (let i = F.length - 1; i >= 0; i--) if (F[i] <= m) { parts.push(F[i]); m -= F[i]; } return parts.length === 1 ? `${p.n} is a Fibonacci number: **the first player loses**` : `${p.n} = ${parts.join(' + ')} · winning move: **take ${parts[parts.length - 1]}**`; },
                goal: (p) => p.n === 21,
                hint: 'Losing piles are Fibonacci numbers. Which comes after 13?',
                solution: { n: 21 },
              },
              explain: r`**21** is the next Fibonacci number, so the first player loses: whatever they take, the opponent can respond with a winning move. On every other pile, taking the smallest Zeckendorf term wins.`,
            },
            {
              type: 'mcq',
              title: 'Why the smallest term?',
              prompt: r`Say the pile is $20 = 13 + 5 + 2$ and you take 2, leaving $18 = 13 + 5$. Your opponent may now take up to 4. Why can’t they use the same trick on you?`,
              choices: [
                { t: 'The smallest term left is 5, more than twice 2, so they can’t take it', ok: true },
                { t: 'Because 18 is a Fibonacci number', why: '18 isn’t Fibonacci. The point is that the smallest remaining term is too big to take.' },
                { t: 'They can: the first player has no real advantage', why: 'They can’t. Non-consecutive Fibonacci terms are always more than double the next smaller one.' },
              ],
              explain: r`Because Zeckendorf terms are never consecutive, each term is more than twice the next smaller one. After you take the smallest term, the opponent can’t take the new smallest term, and whatever they take, you can again take the smallest term of what remains. Eventually you take the last stone.`,
            },
            {
              type: 'numeric',
              title: 'A hundred stones',
              prompt: r`The pile has 100 stones and you move first. How many should you take?`,
              answer: 3,
              wrong: [{ v: 89, why: r`Take the **smallest** term of $100 = 89 + 8 + 3$.` }],
              explain: r`$100 = 89 + 8 + 3$, so take **3**, leaving $89 + 8$. Your opponent may take at most 6, which can’t remove the 8-block.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Losing piles',
              prompt: r`For how many pile sizes from 2 to 100 does the first player lose against perfect play?`,
              answer: 9,
              wrong: [{ v: 10, why: 'Count the Fibonacci numbers from 2 to 100: 2, 3, 5, 8, 13, 21, 34, 55, 89.' }],
              explain: r`The losing piles are the Fibonacci numbers 2, 3, 5, 8, 13, 21, 34, 55, 89: **9** of them. On the other 90 sizes, the first player can always win.`,
            },
          ],
          recap: [
            'Each move takes at most twice the previous move.',
            'Every number is a unique sum of non-consecutive Fibonacci numbers (Zeckendorf).',
            'Fibonacci piles lose; otherwise take the smallest Zeckendorf term.',
          ],
        },
      ],
    },
  ],
};
