const r = String.raw;
const D = Math.PI / 180;
const sectors = (th) => [70, th - 70, 250 - th, 110];
const LANDMARKS = [[1, 'a door'], [10, 'a house'], [300, 'the Eiffel Tower'], [828, 'the Burj Khalifa'], [8849, 'Mount Everest'], [400000, 'the International Space Station'], [384400000, 'the Moon']];
// Haga: fold corner (1,0) of the unit square onto (t,1); the image of the bottom edge meets the left edge at y = t/(2 - t)
const haga = (t) => t / (2 - t);
const reflectAcross = (X, A, P) => {
  const M = [(A[0] + P[0]) / 2, (A[1] + P[1]) / 2], d = [P[0] - A[0], P[1] - A[1]];
  const k = ((X[0] - M[0]) * d[0] + (X[1] - M[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2);
  return [X[0] - 2 * k * d[0], X[1] - 2 * k * d[1]];
};

export default {
  id: 'origami',
  subject: 'math',
  title: 'The Mathematics of Origami',
  level: 'Intermediate',
  cover: 'origami',
  tagline: 'Fold paper to the Moon, find the rules of flat folding, and trisect angles that a compass can’t.',
  description: r`Paper folding is full of mathematics. See how quickly folding doubles thickness, discover the two simple theorems that decide whether a crease pattern folds flat, learn how a single fold can do what compass and straightedge cannot, and meet the origami patterns used in spacecraft and medicine.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'Folding Rules',
      summary: 'Doubling and flat-foldability.',
      lessons: [
        {
          id: 'doubling',
          title: 'Fold It in Half',
          summary: 'Exponential thickness',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              title: 'To the Moon',
              prompt: r`A sheet of paper is 0.1 mm thick. Each fold doubles the thickness. How thick would it be after 42 folds? Give the answer in thousands of kilometres.`,
              unit: 'thousand km',
              answer: (0.1e-3 * 2 ** 42) / 1e6,
              tol: 2,
              wrong: [{ v: (0.1e-3 * 42) / 1e6, relTol: 0.5, why: 'Each fold doubles the thickness: multiply by 2⁴², not by 42.' }],
              explain: r`$0.1 \text{ mm} \times 2^{42} \approx 4.4 \times 10^{8}$ m $\approx 440{,}000$ km, farther than the Moon (about 384,000 km away). Exponential growth is relentlessly fast.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Taller than Everest',
              prompt: r`Paper is 0.1 mm thick. What is the **fewest** number of folds that would make the stack taller than Mount Everest (8,849 m)?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 42, ymin: -4, ymax: 9, grid: false, height: 220, padL: 52, axes: { xlabel: 'folds', ylabel: 'height', xticks: 5, yfmt: (v) => (Number.isInteger(v) && v % 2 === 0 ? `10${['⁻⁴', '⁻³', '⁻²', '⁻¹', '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'][v + 4]} m` : '') },
                params: { n: { min: 1, max: 42, step: 1, value: 20, label: 'folds', color: 'violet' } },
                curves: [{ f: (n) => Math.log10(0.1e-3 * 2 ** n), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.n, y: (p) => Math.log10(0.1e-3 * 2 ** p.n), color: 'coral' }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(0), x2: plot.X(42), y1: plot.Y(Math.log10(8849)), y2: plot.Y(Math.log10(8849)), stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }), s('text', { x: plot.X(1), y: plot.Y(Math.log10(8849)) - 6, class: 'tick', text: 'Everest' })],
                readout: (p) => {
                  const h = 0.1e-3 * 2 ** p.n, past = LANDMARKS.filter(([m]) => h > m).pop();
                  return `${p.n} folds: ${h < 1 ? (h * 100).toFixed(1) + ' cm' : h < 1000 ? h.toFixed(1) + ' m' : (h / 1000).toFixed(1) + ' km'}${past ? ` (taller than ${past[1]})` : ''}`;
                },
                goal: (p) => p.n === 27,
                hint: r`You need $0.0001 \times 2^n > 8849$, so $2^n > 88{,}490{,}000$. Remember $2^{10} \approx 1000$.`,
                solution: { n: 27 },
              },
              explain: r`$2^{26} \times 0.1$ mm $\approx 6.7$ km (not quite), but $2^{27} \times 0.1$ mm $\approx 13.4$ km: **27 folds**. Each fold adds just one to the exponent, yet doubles the height.`,
            },
            {
              type: 'mcq',
              title: 'The real limit',
              prompt: r`In practice, nobody can fold an ordinary sheet of paper in half more than 7 or 8 times. Why?`,
              choices: [
                { t: 'Each fold needs much more paper length around the curved fold, and the stack quickly becomes too thick and short to bend', ok: true },
                { t: 'Paper is too weak', why: 'Strength isn’t the issue. The problem is geometry: the paper runs out of length.' },
                { t: 'It’s physically impossible to fold anything more than 8 times', why: 'In 2002, a student folded a long strip of paper 12 times.' },
              ],
              explain: r`Each fold wraps the stack around a curve, which uses up paper length, and the required length grows explosively with the number of folds. In 2002, high-school student Britney Gallivan worked out the formula, then folded a strip of paper about 1.2 km long in half 12 times.`,
            },
            {
              type: 'numeric',
              title: 'Gallivan’s formula',
              prompt: r`Britney Gallivan showed that folding a strip of thickness $t$ in half $n$ times (always in the same direction) needs a length of at least $L = \frac{\pi t}{6}\,(2^n + 4)(2^n - 1)$. For paper 0.1 mm thick, what length is needed for 7 folds? (In metres, 2 decimal places.)`,
              unit: 'm',
              answer: (Math.PI * 1e-4 / 6) * (2 ** 7 + 4) * (2 ** 7 - 1),
              tol: 0.01,
              wrong: [{ v: (Math.PI * 1e-4 / 6) * (2 ** 7 + 4) * (2 ** 7 - 1) * 1000, relTol: 0.02, why: 'Use metres: 0.1 mm = 0.0001 m.' }],
              hint: r`$2^7 = 128$, so $L = \frac{\pi \times 0.0001}{6} \times 132 \times 127$.`,
              explain: r`$L \approx 0.88$ m. Each extra fold roughly **quadruples** the length needed (because of the $2^n \times 2^n$), so 12 folds need about 0.9 km for this paper. Gallivan used a 1.2 km roll of thin toilet paper.`,
            },
            {
              type: 'numeric',
              title: 'Seven folds',
              prompt: r`A sheet of paper is 0.1 mm thick. How thick is it after 7 folds, in millimetres?`,
              unit: 'mm',
              answer: 12.8,
              tol: 0.01,
              explain: r`$0.1 \times 2^7 = 12.8$ mm, already over a centimetre. Folding paper more than about 7 times by hand is very hard, because the stack is thick and short.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Folding to the Sun',
              prompt: r`The Sun is about 150 million km ($1.5 \times 10^{11}$ m) away. How many folds of 0.1 mm paper would make a stack that reaches it? (The smallest whole number.)`,
              unit: 'folds',
              answer: 51,
              wrong: [{ v: 50, why: r`$2^{50} \times 0.1$ mm $\approx 1.1 \times 10^{11}$ m: not quite there.` }, { v: 42, why: 'That reaches the Moon. The Sun is about 400 times farther.' }],
              hint: r`You need $2^n > 1.5 \times 10^{15}$. Since $2^{10} \approx 10^3$, $2^{50} \approx 10^{15}$.`,
              explain: r`$2^{50} \times 10^{-4}$ m $\approx 1.13 \times 10^{11}$ m falls short, but $2^{51} \times 10^{-4} \approx 2.25 \times 10^{11}$ m makes it: **51 folds**. Only 9 more folds than reaching the Moon, even though the Sun is 400 times farther, because $2^9 = 512$.`,
            },
          ],
          recap: [
            r`Folding doubles thickness: $n$ folds multiply it by $2^n$.`,
            '42 folds of paper would reach past the Moon.',
            'Real folding is limited by the paper length lost in each curved fold.',
          ],
        },
        {
          id: 'flat',
          title: 'Folding Flat',
          summary: 'Maekawa and Kawasaki',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Mountains and valleys',
              body: r`Unfold a flat-folded origami model and you see a **crease pattern**. Each crease is either a **mountain** fold (peak pointing up) or a **valley** fold. Around any single vertex in the interior of a flat-foldable pattern, two rules must hold:

- **Maekawa's theorem**: the numbers of mountains $M$ and valleys $V$ differ by exactly 2: $M - V = \pm 2$.
- **Kawasaki's theorem**: going around the vertex, the alternate angles between creases each add up to $180°$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make it fold flat',
              prompt: r`Four creases meet at a point. Three are fixed; rotate the coral crease until the vertex satisfies Kawasaki's theorem.`,
              widget: {
                kind: 'graph', xmin: -1.4, xmax: 1.4, ymin: -1.25, ymax: 1.25, grid: false, axes: false, equal: true, maxWidth: 420,
                params: { th: { min: 95, max: 225, step: 5, value: 180, label: 'coral crease angle', color: 'coral', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const angs = [0, 70, p.th, 250], cols = ['ink', 'ink', 'coral', 'ink'];
                  const els = [s('rect', { x: plot.X(-1.15), y: plot.Y(1.15), width: plot.X(1.15) - plot.X(-1.15), height: plot.Y(-1.15) - plot.Y(1.15), class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 })];
                  const sec = sectors(p.th);
                  angs.forEach((a, i) => {
                    const mid = (a + (i < 3 ? angs[i + 1] : 360)) / 2;
                    els.push(s('text', { x: plot.X(0.55 * Math.cos(mid * D)), y: plot.Y(0.55 * Math.sin(mid * D)) + 5, class: 'lbl', 'text-anchor': 'middle', style: `fill: var(--${i % 2 ? 'teal' : 'violet'})`, text: `${sec[i]}°` }));
                  });
                  angs.forEach((a, i) => els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(1.1 * Math.cos(a * D)), y2: plot.Y(1.1 * Math.sin(a * D)), stroke: `var(--${cols[i]})`, 'stroke-width': i === 2 ? 4 : 3, 'stroke-dasharray': i === 1 ? '8 5' : null })));
                  return els;
                },
                readout: (p) => {
                  const [a, b, c, d] = sectors(p.th);
                  return r`violet angles: $${a} + ${c} = ${a + c}°$; $\;$ teal angles: $${b} + ${d} = ${b + d}°$`;
                },
                goal: (p) => sectors(p.th)[0] + sectors(p.th)[2] === 180,
                hint: r`You need $70° + (250° - \theta) = 180°$.`,
                solution: { th: 140 },
              },
              explain: r`At $140°$ the angles are $70°, 70°, 110°, 110°$: alternate sums $70 + 110 = 180°$ each. Why must it work this way? Folding flat makes you travel round the vertex alternately face-up and face-down, so the angles you sweep go alternately clockwise and anticlockwise; to return to the start, the two sets must cancel, each totalling $180°$.`,
            },
            {
              type: 'multi',
              title: 'Which will fold flat?',
              prompt: r`Each list gives the four angles, in order around a vertex. By Kawasaki's theorem, which vertices can fold flat? Select all.`,
              choices: [
                { t: '90°, 90°, 90°, 90°', ok: true },
                { t: '60°, 120°, 120°, 60°', ok: true },
                { t: '100°, 80°, 100°, 80°', why: 'Alternate angles: 100 + 100 = 200°, not 180°.' },
                { t: '45°, 100°, 135°, 80°', ok: true },
              ],
              explain: r`Add every other angle: $90 + 90$, $60 + 120$ and $45 + 135$ all make $180°$, so those fold flat (with the right mountain–valley assignment). For $100, 80, 100, 80$ the alternate sums are $200°$ and $160°$: it can't. Note that the angles don't need any symmetry, only the alternating sums.`,
            },
            {
              type: 'numeric',
              title: 'The missing angle',
              prompt: r`A flat-foldable vertex has four creases. Going around, the first two angles are $65°$ and $95°$. What is the third angle?`,
              unit: '°',
              answer: 115,
              wrong: [{ v: 85, why: r`That's the fourth angle. The third pairs with the first: $65 + \theta_3 = 180$.` }, { v: 200, why: 'Alternate angles add up to 180°, not all four to 360° minus something.' }],
              explain: r`Angles 1 and 3 alternate, so $\theta_3 = 180 - 65 = 115°$, and then $\theta_4 = 180 - 95 = 85°$. Check: $65 + 95 + 115 + 85 = 360°$ ✓.`,
            },
            {
              type: 'mcq',
              title: 'Is it foldable?',
              prompt: r`Kawasaki’s and Maekawa’s conditions check each crease vertex on its own. Is that enough to guarantee a whole crease pattern folds flat?`,
              choices: [
                { t: r`No: every vertex can pass the tests while the layers still collide; deciding flat-foldability is computationally hard in general`, ok: true },
                { t: r`Yes: if every vertex passes, the pattern folds`, why: r`Local conditions don’t rule out paper layers passing through each other elsewhere.` },
                { t: r`Only for squares`, why: r`The difficulty isn’t about the sheet’s shape.` },
              ],
              explain: r`In 1996 Marshall Bern and Barry Hayes proved that deciding whether a general crease pattern folds flat is NP-hard. Single vertices are easy; the trouble is how all the layers stack together.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Count the mountains',
              prompt: r`A flat-folded vertex has 6 creases, with more mountains than valleys. By Maekawa's theorem, how many are mountains?`,
              answer: 4,
              wrong: [{ v: 3, why: r`$M - V$ must be $\pm 2$, so a 3–3 split is impossible.` }, { v: 2, why: 'That would mean more valleys than mountains.' }],
              explain: r`$M + V = 6$ and $M - V = 2$ give $M = 4$, $V = 2$. A consequence: every interior vertex of a flat-foldable pattern has an **even** number of creases.`,
            },
          ],
          recap: [
            r`Maekawa: at each flat-folded vertex, $M - V = \pm 2$.`,
            'Kawasaki: alternate angles around the vertex each sum to 180°.',
            'So interior vertices always have an even number of creases.',
          ],
        },
        {
          id: 'triangle-fold',
          title: 'Folding an Equilateral Triangle',
          summary: 'Sixty degrees from a square',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'From square to triangle',
              body: r`Take a square sheet and fold it in half to mark a vertical centre line. Now make a fold through the bottom-left corner $B$ that carries the bottom-right corner $C$ up onto the centre line, at $C'$. Triangle $BCC'$ turns out to be **equilateral**: no protractor needed.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Land on the centre line',
              prompt: r`Rotate the fold line through $B$ until the corner $C$ lands exactly on the dashed centre line.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.15, xmax: 1.15, ymin: -0.15, ymax: 1.15, grid: false, axes: false, maxWidth: 380,
                params: { th: { min: 10, max: 45, step: 1, value: 20, label: 'fold angle', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const a = p.th * D, Cp = [Math.cos(2 * a), Math.sin(2 * a)];
                  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
                  return [
                    s('path', { d: sq.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2.5 }),
                    s('line', { x1: plot.X(0.5), x2: plot.X(0.5), y1: plot.Y(0), y2: plot.Y(1), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(Math.cos(a) * 1.15), y2: plot.Y(Math.sin(a) * 1.15), stroke: 'var(--violet)', 'stroke-width': 2.5, 'stroke-dasharray': '8 5' }),
                    s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(1)} ${plot.Y(0)} L${plot.X(Cp[0])} ${plot.Y(Cp[1])} Z`, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2 }),
                    s('circle', { cx: plot.X(Cp[0]), cy: plot.Y(Cp[1]), r: 7, class: 'fl-coral' }),
                    s('text', { x: plot.X(0) - 8, y: plot.Y(0) + 18, class: 'lbl', 'text-anchor': 'end', text: 'B' }), s('text', { x: plot.X(1) + 6, y: plot.Y(0) + 18, class: 'lbl', text: 'C' }), s('text', { x: plot.X(Cp[0]) + 10, y: plot.Y(Cp[1]) - 8, class: 'lbl', text: "C'" }),
                  ];
                },
                readout: (p) => r`$C'$ is at $x = ${Math.cos(2 * p.th * D).toFixed(3)}$ (centre line at $x = 0.5$)`,
                goal: (p) => p.th === 30,
                hint: r`The fold reflects $C$ through angle $2\theta$ around $B$. You need $\cos 2\theta = \frac12$.`,
                solution: { th: 30 },
              },
              explain: r`At a fold angle of $30°$, $C$ swings through $60°$ to land on the centre line. $BC' = BC$ (the fold preserves length) and $C'$ is equally far from $B$ and $C$ (it's on the centre line), so all three sides are equal: an **equilateral** triangle, with $60°$ angles.`,
            },
            {
              type: 'numeric',
              title: 'Height of the triangle',
              prompt: r`The square has side 1. How high above the bottom edge is $C'$? (3 decimal places.)`,
              answer: Math.sqrt(3) / 2,
              tol: 0.0006,
              wrong: [{ v: 0.5, why: 'That’s the x-coordinate. Use Pythagoras: √(1 − 0.25).' }],
              explain: r`$\sqrt{1 - \left(\tfrac12\right)^2} = \frac{\sqrt3}{2} \approx 0.866$: the height of an equilateral triangle of side 1.`,
            },
            {
              type: 'numeric',
              title: 'Area of the triangle',
              prompt: r`Folding a 20 cm square gives an equilateral triangle with sides of 20 cm. What is its area? ($\frac{\sqrt3}{4}s^2$; 1 decimal place.)`,
              unit: 'cm²',
              answer: Math.sqrt(3) / 4 * 400,
              tol: 0.1,
              explain: r`$\frac{\sqrt3}{4} \times 400 \approx 173.2$ cm², about 43% of the square. (Larger equilateral triangles fit if tilted inside the square: the biggest has side about 20.7 cm.)`,
            },
            {
              type: 'numeric',
              title: 'The largest triangle',
              prompt: r`The largest equilateral triangle that fits in a unit square is tilted by $15°$, with side $\frac{1}{\cos 15°}$. How long is its side? (3 decimal places.)`,
              answer: 1 / Math.cos(Math.PI / 12),
              tol: 0.001,
              explain: r`$\frac{1}{\cos 15°} \approx 1.035$, slightly longer than the square’s side. Origami can fold exactly this triangle too, by a cleverer sequence of creases.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why it works',
              prompt: r`Which fact guarantees that $C'$ is the same distance from $B$ as $C$ is?`,
              choices: [
                { t: 'A fold is a reflection, and reflections preserve distances from points on the crease', ok: true },
                { t: 'The paper is square', why: 'Squareness gives BC = 1, but the key is that folding reflects C across a line through B.' },
                { t: 'Angles in a triangle add to 180°', why: 'True, but the equal distance comes from the reflection.' },
              ],
              explain: r`Every fold is a **reflection** across the crease. Points on the crease (like $B$) stay put, and distances are preserved, so $BC' = BC$. Origami geometry is really the geometry of reflections.`,
            },
          ],
          recap: [
            'A fold is a reflection across the crease line.',
            'Folding a corner onto the centre line through the opposite corner makes a 60° angle.',
            'This gives an equilateral triangle from a square.',
          ],
        },
        {
          id: 'haga',
          title: 'Haga’s Theorem',
          summary: 'Thirds without measuring',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A biology professor’s discovery',
              body: r`Dividing a square's side into halves is easy: fold it in half. But thirds? In 1978, Japanese biologist Kazuo Haga noticed a remarkable fold: bring the bottom-right corner up to the **midpoint** of the top edge. The bottom edge, now folded, crosses the left edge exactly **one third** of the way up.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Halfway up',
              prompt: r`Move the point on the top edge where the corner lands. Find the landing point that makes the folded bottom edge cross the left side exactly **halfway** up.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.15, xmax: 1.15, ymin: -0.15, ymax: 1.15, grid: false, axes: false, maxWidth: 380,
                params: { t: { min: 1 / 12, max: 11 / 12, step: 1 / 12, value: 6 / 12, label: 'landing point', color: 'coral', format: (v) => `${Math.round(v * 12)}/12 along the top` } },
                extra: ({ plot, p, s }) => {
                  const A = [1, 0], P = [p.t, 1], B2 = reflectAcross([0, 0], A, P), y = haga(p.t);
                  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
                  return [
                    s('path', { d: sq.map(([x, yy], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(yy)}`).join('') + 'Z', class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2.5 }),
                    s('line', { x1: plot.X(P[0]), y1: plot.Y(P[1]), x2: plot.X(0), y2: plot.Y(y), stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(1), y1: plot.Y(0), x2: plot.X(P[0]), y2: plot.Y(P[1]), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    s('circle', { cx: plot.X(P[0]), cy: plot.Y(1), r: 7, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(y), r: 7, class: 'fl-violet' }),
                    s('text', { x: plot.X(0) - 10, y: plot.Y(y) + 5, class: 'lbl', 'text-anchor': 'end', text: y.toFixed(3) }),
                    ...(B2[0] >= 0 ? [] : []),
                  ];
                },
                readout: (p) => r`folded edge crosses the left side at height $${haga(p.t).toFixed(3)}$`,
                goal: (p) => Math.abs(haga(p.t) - 0.5) < 1e-6,
                hint: r`The crossing height is $\frac{t}{2 - t}$. Solve $\frac{t}{2 - t} = \frac12$.`,
                solution: { t: 8 / 12 },
              },
              explain: r`Landing at $t = \frac23$ of the way along the top gives the halfway point. In general the crossing height is $\frac{t}{2 - t}$: at $t = \frac12$ it's $\frac13$ (Haga's thirds), at $t = \frac13$ it's $\frac15$, at $t = \frac14$ it's $\frac17$.`,
            },
            {
              type: 'numeric',
              title: 'Quarter landing',
              prompt: r`If the corner lands a quarter of the way along the top edge ($t = \frac14$), at what height does the folded edge cross the left side? (As a fraction or decimal.)`,
              answer: 1 / 7,
              tol: 0.001,
              wrong: [{ v: 0.25, why: r`Use $\frac{t}{2 - t} = \frac{0.25}{1.75}$.` }],
              explain: r`$\frac{1/4}{2 - 1/4} = \frac{1/4}{7/4} = \frac17$: sevenths, notoriously hard to fold by trial and error, come out exactly.`,
            },
            {
              type: 'numeric',
              title: 'Two-thirds across',
              prompt: r`In Haga’s fold, landing the corner at distance $t$ along the top edge makes a crease mark at height $\frac{t}{2 - t}$ on the left edge. Where does the mark land for $t = \frac23$?`,
              answer: 0.5,
              tol: 0.001,
              explain: r`$\frac{2/3}{2 - 2/3} = \frac{2/3}{4/3} = \frac12$. Haga’s theorem turns one fraction into another, so a sequence of folds can mark thirds, fifths, sevenths and more.`,
            },
            {
              type: 'numeric',
              title: 'Folding fifths',
              prompt: r`In Haga’s construction, landing the corner at a fraction $t$ along the top edge marks the side at height $\frac{t}{2 - t}$. What height does $t = \frac13$ mark? (Decimal.)`,
              answer: 0.2,
              tol: 0.001,
              explain: r`$\frac{1/3}{2 - 1/3} = \frac{1/3}{5/3} = \frac15$. Folding thirds first and then using Haga’s fold gives fifths: no ruler needed.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Any fraction?',
              prompt: r`Starting from halves (which are easy), Haga's fold turns a landing at $t$ into a crossing at $\frac{t}{2 - t}$. What does repeating such folds allow?`,
              choices: [
                { t: 'Dividing a side into any number of equal parts, exactly, with no measuring', ok: true },
                { t: 'Only thirds', why: r`Landing at $\frac13$ gives fifths, at $\frac14$ sevenths, and combining folds reaches any fraction.` },
                { t: 'Nothing new: halving already does everything', why: 'Halving only gives powers of 2: halves, quarters, eighths. Haga’s fold reaches odd denominators too.' },
              ],
              explain: r`Halving gives $\frac12, \frac14, \frac18, \dots$; Haga's fold turns these into $\frac13, \frac17, \frac{1}{15}, \dots$, and combinations reach every rational fraction. Origami designers use such tricks to lay out crease patterns precisely. Haga called this playful field "origamics".`,
            },
          ],
          recap: [
            'Folding a corner to the top edge’s midpoint divides the side into thirds (Haga).',
            r`Landing at $t$ gives a crossing at height $\frac{t}{2 - t}$.`,
            'Repeated folds can divide a side into any number of equal parts.',
          ],
        },
      ],
    },
    {
      title: 'Folding Beyond the Compass',
      summary: 'Trisection and engineering.',
      lessons: [
        {
          id: 'trisect',
          title: 'Trisecting with Paper',
          summary: 'A fold can solve a cubic',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'More powerful than a compass',
              body: r`Compass and straightedge can't trisect an arbitrary angle, because they only solve equations using square roots. A single origami fold can do more: it can place **two** points onto **two** lines at once. Solving where that fold goes amounts to solving a **cubic** equation.

Around 1980, Hisashi Abe published a folding method that trisects any acute angle exactly, and origami can also double the cube (Peter Messer, 1986).`,
            },
            {
              type: 'order',
              title: 'Abe’s trisection',
              body: r`The angle to trisect sits at the bottom-left corner of a square sheet, between the bottom edge and a crease line $L$.`,
              prompt: 'Put the steps of the folding method in order.',
              items: [
                'Fold two horizontal creases near the bottom, equally spaced: the bottom edge, a first line, and a second line twice as high.',
                'Make one fold that places the bottom-left corner onto the first line and, at the same time, the left end of the second line onto L.',
                'With the paper still folded, mark through the new positions of the corner and of the left end of the first line.',
                'Unfold: the lines from the corner through these marks trisect the angle.',
              ],
              explain: r`The single fold in step 2 is the magic: it satisfies two conditions at once, which amounts to solving a cubic equation. A compass and straightedge can't do that in one move.`,
            },
            {
              type: 'mcq',
              title: 'Why this doesn’t break the theorem',
              prompt: r`Pierre Wantzel proved in 1837 that trisecting an arbitrary angle is impossible. Why doesn't origami trisection contradict him?`,
              choices: [
                { t: 'His theorem is about compass and straightedge only; origami folds are a different, more powerful set of tools', ok: true },
                { t: 'Origami trisections are only approximate', why: 'Abe’s method is exact in principle. It simply uses moves compass and straightedge don’t have.' },
                { t: 'Wantzel’s proof was later found to be wrong', why: 'It’s correct. Impossibility always depends on which tools are allowed.' },
              ],
              explain: r`Impossibility results are always relative to the allowed moves. Folding can solve cubics, so it can construct $\sqrt[3]{2}$ and $\cos 20°$, both out of reach for compass and straightedge. (Archimedes could also trisect angles using a ruler with two marks on it.) The basic folding moves were catalogued by Humiaki Huzita and later Koshiro Hatori; there are seven.`,
            },
            {
              type: 'multi',
              title: 'What can folding construct?',
              prompt: r`Origami folds can solve quadratic and cubic equations, but nothing more. Which of these can be constructed exactly by folding but **not** with compass and straightedge? Select all.`,
              choices: [
                { t: r`A cube with twice the volume of a given cube (edge $\sqrt[3]{2}$)`, ok: true },
                { t: 'A regular heptagon (7 sides)', ok: true },
                { t: 'A square with the same area as a given circle', why: r`That needs a length of $\sqrt\pi$, and $\pi$ isn't the root of any polynomial with whole-number coefficients. No finite construction reaches it.` },
                { t: 'A regular hexagon', why: 'A hexagon is easy with compass and straightedge too.' },
              ],
              explain: r`Doubling the cube needs $\sqrt[3]{2}$ (a cubic), and the heptagon needs $\cos\frac{2\pi}{7}$, a root of $8x^3 + 4x^2 - 4x - 1 = 0$. Folding handles both. Squaring the circle stays impossible by any method built on polynomial equations, because $\pi$ is **transcendental** (Lindemann, 1882).`,
            },
            {
              type: 'interactive',
              title: 'A cubic in disguise',
              body: r`Trisecting a $60°$ angle means constructing $\cos 20°$, a root of $8x^3 - 6x - 1 = 0$. Slide $x$ to find where the cubic crosses zero (between 0.9 and 1).`,
              widget: {
                kind: 'graph', xmin: -1.1, xmax: 1.1, ymin: -3, ymax: 3, grid: 0.5, height: 280, axes: { xticks: 0.5, yticks: 1 },
                params: { x: { min: -1, max: 1, step: 0.0005, value: 0.8, label: '$x$', color: 'coral', format: (v) => v.toFixed(4) } },
                curves: [{ f: (x) => 8 * x ** 3 - 6 * x - 1, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.x, y: (p) => 8 * p.x ** 3 - 6 * p.x - 1, color: 'coral' }],
                readout: (p) => `$8x^3 - 6x - 1 = ${(8 * p.x ** 3 - 6 * p.x - 1).toFixed(4)}$ · $\\cos 20° = ${Math.cos(Math.PI / 9).toFixed(4)}$`,
                goal: (p) => Math.abs(8 * p.x ** 3 - 6 * p.x - 1) < 0.005 && p.x > 0.9,
                hint: 'cos 20° is about 0.94.',
                solution: { x: 0.9397 },
              },
              explain: r`The root is $x = \cos 20° \approx 0.9397$ (the other two roots are $\cos 140°$ and $\cos 260°$). Compass and straightedge can’t reach it, but one origami fold, which places two points on two lines at once, solves exactly this kind of cubic.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Doubling the cube',
              prompt: r`According to legend, the oracle of Delos demanded an altar twice the volume of a cube-shaped one. If the old altar has edge 1 m, what edge does the new one need? (3 decimal places.)`,
              unit: 'm',
              answer: Math.cbrt(2),
              tol: 0.001,
              wrong: [{ v: 2, why: 'Doubling the edge multiplies the volume by 8.' }, { v: Math.SQRT2, tol: 0.001, why: r`$\sqrt2$ doubles a square's area. For volume you need the **cube** root.` }],
              explain: r`$\sqrt[3]{2} \approx 1.260$ m. Greek geometers failed to construct it with compass and straightedge (and Wantzel proved in 1837 that it's impossible), but Peter Messer's 1986 origami method folds it exactly in a few steps.`,
            },
          ],
          recap: [
            'One origami fold can place two points onto two lines at once.',
            'That solves cubic equations, so folding can trisect angles and double the cube.',
            'Impossibility proofs depend on which tools are allowed.',
          ],
        },
        {
          id: 'engineering',
          title: 'Origami Engineering',
          summary: 'Folding in space and medicine',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'The Miura fold',
              body: r`Astrophysicist Koryo Miura designed a pattern of parallelograms (the **Miura-ori**) that folds a large flat sheet into a compact stack, and unfolds it again in one smooth motion by pulling two opposite corners. It is **rigid-foldable**: each panel stays flat while only the creases bend.

A Miura-folded solar array flew on Japan's Space Flyer Unit satellite in 1995. Origami-inspired designs now appear in deployable antennas, foldable telescope concepts, heart stents that expand inside an artery, and the way airbags are folded inside a steering wheel.`,
            },
            {
              type: 'mcq',
              title: 'Why fold for space?',
              prompt: r`Why are origami ideas especially valuable for spacecraft?`,
              choices: [
                { t: 'Large structures must fit inside a rocket’s narrow nose cone, then unfold reliably in space without human help', ok: true },
                { t: 'Paper is used to build satellites', why: 'The materials are metal, plastic or composites. The folding geometry is what’s borrowed.' },
                { t: 'Folded structures are heavier and so more stable', why: 'Folding doesn’t change mass. It changes the packed size and how the structure deploys.' },
              ],
              explain: r`Rocket fairings are only a few metres wide, but solar arrays, antennas and sunshields can be tens of metres across. Fold patterns with a single degree of freedom unfold predictably, with one motion and few motors.`,
            },
            {
              type: 'numeric',
              title: 'Packing ratio',
              prompt: r`A square solar sail 20 m on each side is folded into a packet 0.5 m × 0.5 m. By what factor has its footprint area shrunk?`,
              unit: '×',
              answer: 1600,
              wrong: [{ v: 40, why: 'That’s the factor for each side. Area shrinks by the square: 40².' }],
              explain: r`$\frac{20 \times 20}{0.5 \times 0.5} = \frac{400}{0.25} = 1600$. Each side shrinks 40-fold, so the area shrinks $40^2 = 1600$-fold, at the cost of many layers of thickness.`,
            },
            {
              type: 'mcq',
              title: 'Folding inside the body',
              prompt: r`Origami-inspired heart stents and surgical tools are folded small, then expanded inside the body. What's the main advantage?`,
              choices: [
                { t: 'They can travel through narrow blood vessels or a small incision, then open to full size where they’re needed', ok: true },
                { t: 'Folded devices are stronger', why: 'The key benefit is size during delivery, not strength.' },
                { t: 'They dissolve faster', why: 'Folding doesn’t change how quickly materials dissolve.' },
              ],
              explain: r`A stent might need to be pushed through blood vessels a few millimetres wide, then hold open an artery. Origami patterns that expand in one controlled motion make this possible, as do folded micro-grippers for keyhole surgery.`,
            },
            {
              type: 'interactive',
              title: 'Packing a solar sail',
              body: r`A 20 m square sail must fit in a 0.5 m square packet. Each fold halves one side and doubles the thickness (0.1 mm per layer). Choose the folds in each direction to make it fit with the **fewest** folds.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 22, ymin: -1, ymax: 21, grid: false, axes: false, maxWidth: 400,
                params: { a: { min: 0, max: 8, step: 1, value: 3, label: 'folds across', color: 'blue' }, b: { min: 0, max: 8, step: 1, value: 3, label: 'folds along', color: 'coral' } },
                extra: ({ plot, p, s }) => { const w = 20 / 2 ** p.a, h = 20 / 2 ** p.b; return [s('rect', { x: plot.X(0), y: plot.Y(20), width: plot.X(20) - plot.X(0), height: plot.Y(0) - plot.Y(20), fill: 'none', stroke: 'var(--line-2)', 'stroke-dasharray': '6 5' }), s('rect', { x: plot.X(0), y: plot.Y(h), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(h), class: w <= 0.5 && h <= 0.5 ? 'fl-teal' : 'fl-violet-soft', stroke: 'var(--violet)' }), s('rect', { x: plot.X(0), y: plot.Y(0.5), width: plot.X(0.5) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2 })]; },
                readout: (p) => { const w = 20 / 2 ** p.a, h = 20 / 2 ** p.b, layers = 2 ** (p.a + p.b); return `packet ${w.toFixed(2)} m × ${h.toFixed(2)} m · ${layers.toLocaleString('en-US')} layers, **${((layers * 0.1) / 10).toFixed(1)} cm** thick`; },
                goal: (p) => p.a === 6 && p.b === 6,
                hint: 'Each side must shrink from 20 m to under 0.5 m: a factor of over 40.',
                solution: { a: 6, b: 6 },
              },
              explain: r`Six folds each way (each side $20/64 \approx 0.31$ m) is the minimum, since five gives 0.625 m. But that makes $2^{12} = 4096$ layers, 41 cm thick, and simple folding creases the sail badly. Patterns like the Miura fold and spirals around a hub pack sails far more gently.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Tilted panels',
              prompt: r`In a rigid-foldable pattern like the Miura fold, every panel tilts by the same angle $\phi$ as it folds, so the sheet's footprint shrinks to $\cos\phi$ of its flat area. At what tilt angle has the footprint shrunk to 10% of its original area? (Nearest degree.)`,
              unit: '°',
              answer: (Math.acos(0.1) * 180) / Math.PI,
              tol: 0.6,
              wrong: [{ v: 10, why: 'That’s the percentage. Solve cos φ = 0.1.' }, { v: 90, why: 'At 90° the footprint would be zero.' }],
              explain: r`$\phi = \arccos 0.1 \approx 84°$. Most of the shrinking happens in the last few degrees, so folded arrays are deployed slowly at first and then quickly, and must be locked in place at the end.`,
            },
          ],
          recap: [
            'The Miura fold collapses and deploys a sheet in one motion.',
            'Rigid-foldable patterns keep panels flat while creases bend.',
            'Origami ideas are used in spacecraft, stents and airbags.',
          ],
        },
        {
          id: 'parabola-fold',
          title: 'Folding a Parabola',
          summary: 'Creases that solve equations',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Point onto line',
              body: r`Mark a point $F$ on a sheet of paper and draw a straight line below it. Fold the paper so that $F$ lands somewhere on the line, and crease. Unfold and repeat with $F$ landing at a different spot.

After many folds the creases outline a smooth curve: a **parabola** with **focus** $F$ and the line as its **directrix**. Each crease is a tangent to it.`,
            },
            {
              type: 'mcq',
              title: 'Why a parabola?',
              prompt: r`Folding $F$ onto a point $P$ of the line makes the crease the perpendicular bisector of $FP$. Every point on the crease is equally far from $F$ and $P$. Which point of the crease touches the curve?`,
              choices: [
                { t: 'The point directly above P, which is equally far from F and from the line', ok: true },
                { t: 'The midpoint of FP', why: 'The midpoint is on the crease, but it is generally not equidistant from F and the whole line.' },
                { t: 'The point closest to F', why: 'Think about the definition of a parabola: equal distance from the focus and the directrix.' },
              ],
              explain: r`The point $T$ on the crease directly above $P$ satisfies $TF = TP$, and $TP$ is its distance to the line. Equal distances from focus and directrix is exactly the definition of a parabola. Any other point of the crease is closer to the line than to $F$, so the crease touches the parabola only at $T$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Many folds',
              body: r`Here $F = (0, 1)$ and the line is $y = -1$. Increase the number of folds (with $F$ landing at evenly spaced points on the line).`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -1.5, ymax: 7, grid: false, axes: false, maxWidth: 440, pad: 6,
                params: { n: { min: 1, max: 41, step: 1, value: 9, label: 'folds', color: 'amber' } },
                extra: ({ plot, p, s }) => { const out = [s('line', { x1: plot.X(-6), x2: plot.X(6), y1: plot.Y(-1), y2: plot.Y(-1), stroke: 'var(--ink-2)', 'stroke-width': 2.5 }), s('circle', { cx: plot.X(0), cy: plot.Y(1), r: 6, class: 'fl-coral' })]; for (let i = 0; i < p.n; i++) { const t = p.n === 1 ? 2 : -8 + (16 * i) / (p.n - 1), y = (x) => (t * x) / 2 - (t * t) / 4; out.push(s('line', { x1: plot.X(-6), y1: plot.Y(y(-6)), x2: plot.X(6), y2: plot.Y(y(6)), stroke: 'var(--amber)', 'stroke-width': 1.2, opacity: 0.8 })); } return out; },
                readout: (p) => `${p.n} crease${p.n > 1 ? 's' : ''} · the envelope is the parabola y = x²/4`,
              },
              after: r`Folding $F$ onto $(t, -1)$ gives the crease $y = \frac{t}{2}x - \frac{t^2}{4}$, which touches $y = \frac{x^2}{4}$ at $x = t$. No curve is ever drawn, yet the parabola appears.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A crease through a point',
              prompt: r`Slide the landing point $(t, -1)$ along the line. Find a fold whose crease passes through the point $Q = (4, 3)$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 9, ymin: -1.5, ymax: 7, grid: false, axes: false, maxWidth: 440, pad: 6,
                params: { t: { min: -2, max: 8, step: 0.05, value: 0, label: 'landing point t', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => (x * x) / 4, color: 'muted', dash: true }, { f: (x, p) => (p.t * x) / 2 - (p.t * p.t) / 4, color: 'amber', width: 2.5 }],
                points: [{ x: () => 4, y: () => 3, color: 'coral' }, { x: (p) => p.t, y: () => -1, color: 'violet' }, { x: () => 0, y: () => 1, color: 'ink' }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(-3), x2: plot.X(9), y1: plot.Y(-1), y2: plot.Y(-1), stroke: 'var(--ink-2)', 'stroke-width': 2.5 }), s('line', { x1: plot.X(0), y1: plot.Y(1), x2: plot.X(p.t), y2: plot.Y(-1), stroke: 'var(--violet)', 'stroke-dasharray': '4 4' })],
                readout: (p) => `crease height at x = 4: **${(2 * p.t - (p.t * p.t) / 4).toFixed(2)}** (target 3)`,
                goal: (p) => Math.abs(p.t - 2) < 0.03 || Math.abs(p.t - 6) < 0.03,
                hint: 'The crease passes through (4, 3) when 3 = 2t − t²/4.',
                solution: { t: 2 },
              },
              explain: r`Both $t = 2$ and $t = 6$ work: they solve $t^2 - 8t + 12 = 0$. Folding a point onto a line so that the crease passes through another point **solves a quadratic equation**. In 1936 Margharita Beloch found a fold that lines up two points with two lines at once, which solves **cubic** equations: that’s how origami trisects angles and doubles cubes.`,
            },
            {
              type: 'mcq',
              title: 'How many creases?',
              prompt: r`For a point $Q$ **inside** the parabola (above the curve, on the same side as the focus), how many folds have a crease through $Q$?`,
              choices: [
                { t: 'None: every crease is a tangent, and no tangent passes inside the curve', ok: true },
                { t: 'Exactly two', why: 'That’s for points outside (below) the parabola, like Q = (4, 3).' },
                { t: 'Infinitely many', why: 'Each crease is a tangent line, and tangents stay on the outside of a parabola.' },
              ],
              explain: r`Points outside the parabola have two tangents through them (two creases), points on it have one, and points inside have none, matching the two, one or zero real solutions of the quadratic.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Where it touches',
              prompt: r`With $F = (0, 1)$ and the line $y = -1$, you fold $F$ onto the point $(6, -1)$. The crease touches the parabola at one point. What is that point’s $y$-coordinate?`,
              answer: 9,
              wrong: [{ v: 3, why: r`The touching point is directly above $(6, -1)$, at $x = 6$ on $y = \frac{x^2}{4}$.` }],
              explain: r`The crease touches $y = \frac{x^2}{4}$ directly above the landing point, at $x = 6$, so $y = \frac{36}{4} = 9$. Check: $(6, 9)$ is 10 from the line $y = -1$, and $\sqrt{6^2 + 8^2} = 10$ from $F$.`,
            },
          ],
          recap: [
            'Folding a point onto a line gives a crease tangent to a parabola.',
            'A crease through a given point solves a quadratic equation.',
            'Beloch’s fold solves cubics, which is why origami can trisect angles.',
          ],
        },
      ],
    },
  ],
};
