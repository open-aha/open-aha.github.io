import { fix } from '../lib/svg.js';

const r = String.raw;
const f2 = (v) => (Math.round(v * 100) / 100).toString();

// a gear drawn as a toothed outline
function gear(plot, s, cx, cy, teeth, rot, cls) {
  const R = teeth * 0.055, depth = 0.12;
  const pts = [];
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = rot + (2 * Math.PI * i) / n;
    const rr = i % 4 < 2 ? R + depth : R - depth * 0.2;
    pts.push(`${i ? 'L' : 'M'}${plot.X(cx + rr * Math.cos(a))} ${plot.Y(cy + rr * Math.sin(a))}`);
  }
  return [
    s('path', { d: pts.join('') + 'Z', class: cls, stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.9 }),
    s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: 6, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2 }),
    s('line', { x1: plot.X(cx), y1: plot.Y(cy), x2: plot.X(cx + (R - 0.15) * Math.cos(rot)), y2: plot.Y(cy + (R - 0.15) * Math.sin(rot)), stroke: 'var(--card)', 'stroke-width': 4, 'stroke-linecap': 'round' }),
  ];
}

export default {
  id: 'machines',
  subject: 'physics',
  title: 'Simple Machines',
  level: 'Foundational',
  cover: 'machines',
  tagline: 'Levers, pulleys, ramps, wheels and gears: trading force for distance.',
  description: r`How did ancient builders lift huge stones? Discover how levers, pulleys, ramps, wheels and gears multiply force, why you always pay for it with extra distance, how machines combine into cranes and bicycles, and why no machine can ever give you more work than you put in.`,
  chapters: [
    {
      title: 'Force Multipliers',
      summary: 'Levers, pulleys and ramps.',
      lessons: [
        {
          id: 'levers',
          title: 'Levers',
          summary: 'Give me a place to stand',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Crowbar',
              prompt: 'You use a crowbar to lift a heavy rock. To push with the least effort, where should you hold the bar?',
              choices: [
                { t: 'As far from the pivot as possible', ok: true },
                { t: 'Close to the pivot', why: 'Close to the pivot you’d need a huge force. The farther away you push, the less force you need.' },
                { t: 'It makes no difference', why: 'It makes a big difference: the distance from the pivot multiplies your force.' },
              ],
              explain: r`A lever balances when effort × effort-distance = load × load-distance. Pushing far from the pivot (the **fulcrum**) lets a small force balance a big load.`,
            },
            {
              type: 'explain',
              title: 'Mechanical advantage',
              body: r`The **mechanical advantage** (MA) of a machine is how much it multiplies your force:
$$\text{MA} = \frac{\text{load force}}{\text{effort force}}$$
For a lever, $\text{MA} = \dfrac{\text{effort arm}}{\text{load arm}}$ (the distances from the pivot).

The catch: your end moves **farther**. With an MA of 5, you push 5 times less hard, but your hand travels 5 times as far.`,
            },
            {
              type: 'numeric',
              title: 'Lift the rock',
              prompt: 'A crowbar’s pivot is 0.2 m from the rock and 1.2 m from your hand. The rock’s end needs 600 N. What force must you push with?',
              unit: 'N',
              answer: 100,
              wrong: [{ v: 3600, why: 'The long side gives you an advantage, so you need *less* force than 600 N.' }, { v: 120, why: r`$\text{MA} = 1.2 / 0.2 = 6$, so the effort is $600 / 6$.` }],
              explain: r`$\text{MA} = \frac{1.2}{0.2} = 6$, so the effort is $\frac{600}{6} = 100$ N. Your hand moves 6 times as far as the rock does.`,
            },
            { /*anim:machines*/
              type: 'explain',
              kicker: 'Explore',
              title: 'No free lunch',
              body: r`The same crowbar in motion: the rock sits 0.2 m from the pivot and your hand 1.2 m away, so the lever multiplies your force by 6. Watch how far each end **moves**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.42, xmax: 1.34, ymin: -0.32, ymax: 0.42, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 0.9, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const A0 = 0.2, phi0 = 0.25, phi = phi0 * Math.cos(p.t), a = 0.2, b = 1.2;
                  const P = (r, f) => [r * Math.cos(f), r * Math.sin(f)];
                  const L = P(-a, phi), R = P(b, phi);
                  const els = [];
                  const arc = (r, f0, f1, col) => {
                    const pts = [];
                    for (let i = 0; i <= 30; i++) { const f = f0 + ((f1 - f0) * i) / 30; pts.push(P(r, f)); }
                    return s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.55 });
                  };
                  els.push(s('path', { d: `M${plot.X(-0.42)} ${plot.Y(-0.13)} H${plot.X(0.16)} V${plot.Y(-0.32)}`, fill: 'none', stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  els.push(arc(-a, phi0, phi, 'coral'), arc(b, phi0, phi, 'blue'));
                  // pivot, bar, rock and hand
                  els.push(s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(-0.06)} ${plot.Y(-0.13)} L${plot.X(0.06)} ${plot.Y(-0.13)} Z`, class: 'fl-muted' }));
                  els.push(s('line', { x1: plot.X(L[0] * 1.15), y1: plot.Y(L[1] * 1.15), x2: plot.X(R[0]), y2: plot.Y(R[1]), stroke: 'var(--ink)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
                  const rs = plot.X(0.14) - plot.X(0);
                  els.push(s('rect', { x: plot.X(L[0]) - rs / 2, y: plot.Y(L[1]) - rs - 3, width: rs, height: rs, rx: 6, class: 'fl-coral' }));
                  els.push(s('text', { x: plot.X(L[0]), y: plot.Y(L[1]) - rs / 2 + 2, 'text-anchor': 'middle', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));font-weight:800;fill:#fff', text: '600 N' }));
                  els.push(s('circle', { cx: plot.X(R[0]), cy: plot.Y(R[1]) - 11, r: 9, class: 'fl-blue' }));
                  els.push(s('text', { x: plot.X(R[0]), y: plot.Y(R[1]) - 28, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--blue)', text: '100 N' }));
                  return els;
                },
                readout: (p) => { const phi = 0.25 * Math.cos(p.t), h = 0.2 * (Math.sin(0.25) - Math.sin(phi)) * 100; return r`rock rises $\coral{${fix(h, 1)}}$ cm, your hand moves $\blue{${fix(6 * h, 1)}}$ cm · work: $600 \times ${fix(h / 100, 3)} = 100 \times ${fix((6 * h) / 100, 3)}$ J`; },
              },
              after: r`Your hand travels **six times as far** as the rock rises. The lever multiplies force by 6 but divides distance by 6, so force × distance, the **work**, is the same on both ends. Every simple machine makes this trade: you never get more work out than you put in. Archimedes boasted that with a long enough lever he could move the Earth; he would also have needed to push it an astronomically long way.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Balance the seesaw',
              prompt: r`A 30 kg child sits 2 m to the left of the pivot. Slide the 40 kg parent along the right side until the seesaw balances.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.5, xmax: 3.5, ymin: -1, ymax: 1.8, grid: false, axes: false, maxWidth: 560,
                params: { d: { min: 0.25, max: 3, step: 0.25, value: 2.5, slider: false } },
                points: [{ x: (p) => p.d, y: (p) => Math.tan(-Math.max(-0.25, Math.min(0.25, (40 * p.d - 60) / 240))) * p.d + 0.35, drag: { x: 'd' }, color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  const tilt = -Math.max(-0.25, Math.min(0.25, (40 * p.d - 60) / 240)), t = Math.tan(tilt);
                  const y = (x) => t * x;
                  return [
                    s('path', { d: `M${plot.X(0)} ${plot.Y(-0.02)} L${plot.X(-0.35)} ${plot.Y(-0.8)} L${plot.X(0.35)} ${plot.Y(-0.8)} Z`, class: 'fl-ink' }),
                    s('line', { x1: plot.X(-3.2), y1: plot.Y(y(-3.2)), x2: plot.X(3.2), y2: plot.Y(y(3.2)), stroke: 'var(--amber)', 'stroke-width': 8, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(-2), cy: plot.Y(y(-2) + 0.3), r: 13, class: 'fl-blue' }),
                    s('text', { x: plot.X(-2), y: plot.Y(y(-2) + 0.75), class: 'tick', 'text-anchor': 'middle', text: '30 kg' }),
                    s('text', { x: plot.X(p.d), y: plot.Y(y(p.d) + 0.85), class: 'tick', 'text-anchor': 'middle', text: '40 kg' }),
                  ];
                },
                readout: (p) => r`left: $30 \times 2 = 60$; $\;$ right: $40 \times ${fix(p.d, 2)} = ${40 * p.d}$ ${40 * p.d === 60 ? '· balanced!' : ''}`,
                goal: (p) => p.d === 1.5,
                hint: 'Balance needs weight × distance to match on both sides.',
                solution: { d: 1.5 },
              },
              explain: r`$40 \times d = 30 \times 2$, so $d = 1.5$ m. Archimedes' **law of the lever**: weights balance when their distances from the pivot are in inverse proportion to the weights. "Give me a place to stand, and I shall move the Earth."`,
            },
            {
              type: 'mcq',
              title: 'Three classes',
              prompt: r`In a wheelbarrow, the wheel is the pivot, the load sits in the middle, and you lift the handles at the far end. Which is true?`,
              choices: [
                { t: 'It multiplies force: the effort is farther from the pivot than the load', ok: true },
                { t: 'It multiplies distance, like tweezers', why: 'In tweezers the effort is between the pivot and the load. In a wheelbarrow, the load is between the pivot and your hands.' },
                { t: 'It has an MA of exactly 1', why: 'Your hands are farther from the wheel than the load is, so MA > 1.' },
              ],
              explain: r`Levers come in three classes depending on what's in the middle: the **pivot** (seesaw, crowbar), the **load** (wheelbarrow, nutcracker, both MA > 1), or the **effort** (tweezers, forearm, fishing rod, MA < 1).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Your forearm',
              prompt: 'Your biceps attaches to your forearm about 4 cm from the elbow, while your hand is about 35 cm away. What kind of lever is your forearm?',
              choices: [
                { t: 'One with MA less than 1: the muscle pulls hard so the hand can move far and fast', ok: true },
                { t: 'One with a large MA, multiplying the muscle’s force', why: r`The muscle attaches close to the pivot (4 cm vs 35 cm), so $\text{MA} = 4/35 \approx 0.11$.` },
              ],
              explain: r`$\text{MA} \approx \frac{4}{35} \approx 0.11$: holding a 10 kg weight needs about 900 N from the biceps! Levers can also trade force **for** distance and speed. That's why your hand can move fast. Fishing rods and tweezers work the same way.`,
            },
          ],
          recap: [
            'Mechanical advantage = load ÷ effort. For a lever, effort arm ÷ load arm.',
            'More force always means more distance: you trade one for the other.',
            'Some levers (forearms, tweezers) deliberately trade force for distance and speed.',
          ],
        },
        {
          id: 'pulleys',
          title: 'Pulleys',
          summary: 'Count the ropes',
          icon: 'up',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'One fixed pulley',
              prompt: 'A single pulley fixed to the ceiling lifts a bucket as you pull down on the rope. What does it do for you?',
              choices: [
                { t: 'It changes the direction of your pull, but not its size', ok: true },
                { t: 'It halves the force you need', why: 'A single fixed pulley has MA = 1. It just lets you pull down instead of lifting up.' },
                { t: 'It doubles the force you need', why: 'With an ideal pulley, you pull with the same force as the load’s weight.' },
              ],
              explain: r`A fixed pulley only redirects the force: pulling down is easier than lifting, since you can use your body weight. To reduce the force, you need a **movable** pulley.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Block and tackle',
              body: r`In a **block and tackle**, the load hangs from several rope segments. The tension in the rope is the same everywhere, so each supporting segment holds up an equal share.
$$\text{MA} = \text{number of rope segments supporting the load}$$`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: false, height: 300,
                params: { n: { min: 1, max: 6, step: 1, value: 2, label: 'segments', color: 'teal', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('rect', { x: plot.X(1), y: plot.Y(6.8), width: plot.X(8) - plot.X(0), height: 10, class: 'fl-ink' })];
                  const x0 = 5 - (p.n - 1) * 0.35;
                  for (let i = 0; i < p.n; i++) els.push(s('line', { x1: plot.X(x0 + i * 0.7), x2: plot.X(x0 + i * 0.7), y1: plot.Y(6.6), y2: plot.Y(2.8), stroke: 'var(--amber)', 'stroke-width': 4 }));
                  els.push(s('rect', { x: plot.X(x0 - 0.5), y: plot.Y(2.8), width: plot.X(p.n * 0.7 + 0.3) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), rx: 6, class: 'fl-muted' }));
                  els.push(s('rect', { x: plot.X(4), y: plot.Y(2.2), width: plot.X(2) - plot.X(0), height: plot.Y(0) - plot.Y(1.6), rx: 6, class: 'fl-coral' }));
                  els.push(s('text', { x: plot.X(5), y: plot.Y(1.3), 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800', text: '600 N' }));
                  els.push(s('line', { x1: plot.X(8.6), x2: plot.X(8.6), y1: plot.Y(6.6), y2: plot.Y(3.6), stroke: 'var(--amber)', 'stroke-width': 4 }));
                  els.push(s('text', { x: plot.X(8.75), y: plot.Y(3.3), class: 'lbl fl-teal', text: `pull ${f2(600 / p.n)} N` }));
                  return els;
                },
                readout: (p) => r`MA $= ${p.n}$: pull with $\frac{600}{${p.n}} = ${f2(600 / p.n)}$ N, but pull $${p.n}$ m of rope for every 1 m the load rises`,
              },
            },
            {
              type: 'numeric',
              title: 'Lift a piano',
              prompt: 'A 2,400 N piano is lifted with a block and tackle that has 4 supporting rope segments. What pulling force is needed (ignoring friction)?',
              unit: 'N',
              answer: 600,
              wrong: [{ v: 9600, why: 'Pulleys reduce the force: divide by the number of segments.' }],
              explain: r`$\frac{2400}{4} = 600$ N. To raise the piano 1 m, you'd pull 4 m of rope.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design the tackle',
              prompt: r`You can pull with at most 250 N. Choose the **fewest** supporting rope segments that let you lift a 1200 N engine (ignore friction).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, height: 150,
                params: { n: { min: 1, max: 8, step: 1, value: 2, label: 'segments', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const f = 1200 / p.n, ok = f <= 250;
                  return [
                    s('rect', { x: plot.X(0.5), y: plot.Y(2.4), width: plot.X(9.5) - plot.X(0.5), height: plot.Y(1.6) - plot.Y(2.4), rx: 6, class: 'fl-surface', stroke: 'var(--line-2)' }),
                    s('rect', { x: plot.X(0.5), y: plot.Y(2.4), width: (plot.X(9.5) - plot.X(0.5)) * Math.min(1, f / 1200), height: plot.Y(1.6) - plot.Y(2.4), rx: 6, class: ok ? 'fl-teal' : 'fl-coral' }),
                    s('line', { x1: plot.X(0.5 + 9 * (250 / 1200)), x2: plot.X(0.5 + 9 * (250 / 1200)), y1: plot.Y(2.7), y2: plot.Y(1.3), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
                    s('text', { x: plot.X(0.5 + 9 * (250 / 1200)), y: plot.Y(1.0), class: 'tick', 'text-anchor': 'middle', text: 'your limit: 250 N' }),
                  ];
                },
                readout: (p) => r`pull needed $= \frac{1200}{${p.n}} = ${fix(1200 / p.n, 2)}$ N`,
                goal: (p) => p.n === 5,
                hint: r`You need $\frac{1200}{n} \le 250$.`,
                solution: { n: 5 },
              },
              explain: r`$\frac{1200}{4} = 300$ N is too much; $\frac{1200}{5} = 240$ N works. So 5 segments. (With real friction, you'd want a margin, perhaps 6.)`,
            },
            {
              type: 'numeric',
              title: 'Friction in the pulleys',
              prompt: r`A block and tackle with 4 supporting ropes should need 200 N to lift an 800 N load, but in practice it takes 250 N. What is its efficiency? (Percentage.)`,
              unit: '%',
              answer: 80,
              tol: 0.5,
              explain: r`Efficiency $= \frac{\text{actual MA}}{\text{ideal MA}} = \frac{800/250}{4} = \frac{3.2}{4} = 80\%$. The rest of your effort goes into friction in the pulleys and bending the rope.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rope needed',
              prompt: 'With that 4-segment pulley system, how much rope must you pull to lift the piano 3 metres?',
              unit: 'm',
              answer: 12,
              wrong: [{ v: 0.75, why: 'You pull *more* rope than the load rises, not less.' }, { v: 3, why: 'Each of the 4 segments must shorten by 3 m.' }],
              explain: r`Each of the 4 supporting segments must shorten by 3 m, so you pull $4 \times 3 = 12$ m of rope. Work check: $600 \text{ N} \times 12 \text{ m} = 2400 \text{ N} \times 3 \text{ m} = 7200$ J. ✓`,
            },
          ],
          recap: [
            'A fixed pulley changes the direction of force (MA = 1).',
            'Block and tackle: MA = the number of rope segments supporting the load.',
            'Force × distance (work) stays the same.',
          ],
        },
        {
          id: 'ramps',
          title: 'Ramps & Screws',
          summary: 'Inclined planes',
          icon: 'pencil',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Loading a truck',
              prompt: 'Why do movers push heavy things up a ramp instead of lifting them straight up?',
              choices: [
                { t: 'The ramp lets them use a smaller force over a longer distance', ok: true },
                { t: 'The ramp reduces the work they do', why: 'The work to raise something a given height is the same either way (ignoring friction). The ramp just spreads it over a longer distance.' },
                { t: 'The ramp makes the object lighter', why: 'The weight is unchanged. Only the force needed to push it changes.' },
              ],
              explain: r`Lifting straight up takes the full weight over the height $h$. On a ramp of length $L$, you push with less force over the longer distance. The work, $mgh$, is the same.`,
            },
            {
              type: 'explain',
              title: 'Inclined planes',
              body: r`For a frictionless ramp, the force needed is
$$F = W\,\frac{h}{L}, \qquad \text{MA} = \frac{L}{h}$$
A ramp twice as long (for the same height) halves the push. Ancient builders probably raised the stones of the pyramids with ramps.

A **screw** is a ramp wrapped around a cylinder: each turn advances it a small distance (the **pitch**), so turning it with a modest force drives it in with great force. A **wedge** (like an axe) is a pair of ramps back to back.`,
            },
            {
              type: 'numeric',
              title: 'Wheelchair ramp',
              prompt: 'A ramp is 6 m long and rises 0.5 m. What is its mechanical advantage (ignoring friction)?',
              answer: 12,
              wrong: [{ v: 1 / 12, tol: 0.001, why: r`$\text{MA} = L / h = 6 / 0.5$.` }],
              explain: r`$\text{MA} = \frac{6}{0.5} = 12$. Pushing a 600 N load up it takes only about 50 N (plus friction).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose the ramp',
              prompt: r`You need to raise a 600 N trolley onto a platform 1 m high, but can push with only 150 N. How long must the (frictionless) ramp be?`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 6.5, ymin: -0.3, ymax: 1.8, grid: false, axes: false, maxWidth: 560,
                params: { L: { min: 1.5, max: 6, step: 0.5, value: 2, label: 'ramp length', color: 'violet', format: (v) => `${fix(v, 1)} m` } },
                extra: ({ plot, p, s }) => {
                  const base = Math.sqrt(p.L * p.L - 1);
                  return [
                    s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(base)} ${plot.Y(1)} L${plot.X(base)} ${plot.Y(0)} Z`, class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('rect', { x: plot.X(base), y: plot.Y(1), width: plot.X(6.5) - plot.X(base), height: plot.Y(0) - plot.Y(1), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  ];
                },
                readout: (p) => r`push $= 600 \times \frac{1}{${fix(p.L, 1)}} = ${fix(600 / p.L, 2)}$ N`,
                goal: (p) => p.L === 4,
                hint: r`Push $= W \times \frac{h}{L}$. Set it equal to 150 N.`,
                solution: { L: 4 },
              },
              explain: r`$600 \times \frac{1}{L} = 150$ gives $L = 4$ m: MA $= 4$. A longer ramp needs even less force but more pushing distance; the work, $600$ J, stays the same.`,
            },
            {
              type: 'mcq',
              title: 'Less force, same work?',
              prompt: r`Pushing a box up a long gentle ramp needs much less force than lifting it straight up. Ignoring friction, how does the **work** compare?`,
              choices: [
                { t: r`It’s the same: smaller force, but over a longer distance`, ok: true },
                { t: r`Less work with the ramp`, why: r`Work is force × distance, and the ramp increases the distance by exactly the factor it reduces the force.` },
                { t: r`More work with the ramp`, why: r`Without friction it is exactly equal: both give the box the same potential energy mgh.` },
              ],
              explain: r`Every simple machine trades force for distance; none reduces the work. With friction, the ramp actually needs a little **more** work in total, but a force you can manage.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Car jack',
              prompt: 'A screw jack has a pitch of 0.5 cm (it rises 0.5 cm per turn), and its handle traces a circle 100 cm around. Ignoring friction, what is its mechanical advantage?',
              answer: 200,
              wrong: [{ v: 0.005, tol: 0.001, why: r`$\text{MA} = \frac{\text{distance your hand moves}}{\text{distance the load rises}} = \frac{100}{0.5}$.` }, { v: 50, why: r`$100 / 0.5 = 200$.` }],
              explain: r`Per turn, your hand moves 100 cm while the car rises 0.5 cm: $\text{MA} = \frac{100}{0.5} = 200$. A 150 N push could lift 30,000 N in principle. Friction lowers this a lot, but that same friction also stops the jack from slipping back down.`,
            },
          ],
          recap: [
            r`Ramp: $\text{MA} = L/h$. Push with less force over a longer distance.`,
            'Screws are ramps wrapped around a cylinder. Wedges are double ramps.',
            'MA = (distance the effort moves) ÷ (distance the load moves), for ideal machines.',
          ],
        },
      ],
    },
    {
      title: 'Gears and Efficiency',
      summary: 'Turning, and why nothing is free.',
      lessons: [
        {
          id: 'gears',
          title: 'Gears',
          summary: 'Speed versus turning force',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Meshing gears',
              body: r`Teeth on meshing gears pass each other at the same rate. So a gear with **fewer teeth turns faster**. Change the tooth counts.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.4, xmax: 3.6, ymin: -1.6, ymax: 1.6, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  a: { min: 8, max: 24, step: 2, value: 24, label: 'driver teeth', color: 'blue', format: (v) => `${v}` },
                  b: { min: 8, max: 24, step: 2, value: 12, label: 'driven teeth', color: 'coral', format: (v) => `${v}` },
                },
                extra: ({ plot, p, s }) => {
                  const Ra = p.a * 0.055, Rb = p.b * 0.055;
                  const xa = -0.4, xb = xa + Ra + Rb + 0.03;
                  const wa = 0.6;
                  const wb = -wa * (p.a / p.b);
                  return [...gear(plot, s, xa, 0, p.a, wa * p.t, 'fl-blue'), ...gear(plot, s, xb, 0, p.b, wb * p.t + Math.PI / p.b, 'fl-coral')];
                },
                readout: (p) => r`gear ratio $${p.a} : ${p.b}$: the driven gear turns $${fix(p.a / p.b, 2)}\times$ as fast, in the opposite direction, with $${fix(p.b / p.a, 2)}\times$ the turning force`,
              },
            },
            {
              type: 'numeric',
              title: 'Gear ratio',
              prompt: 'A 40-tooth gear drives a 10-tooth gear. If the big gear turns 3 times, how many times does the small one turn?',
              answer: 12,
              wrong: [{ v: 0.75, why: 'The small gear turns *faster*: 40 ÷ 10 = 4 times per turn of the big gear.' }],
              explain: r`Ratio $40 : 10 = 4$, so the small gear makes 4 turns per big-gear turn: $3 \times 4 = 12$ turns. But it twists with only a quarter of the turning force.`,
            },
            {
              type: 'numeric',
              title: 'An idler gear',
              prompt: r`Three gears in a row: 20 teeth, then 50 teeth, then 10 teeth. The first turns once. How many times does the last one turn?`,
              answer: 2,
              wrong: [{ v: 5, why: r`The middle gear doesn't change the overall ratio: only the first and last tooth counts matter, $20 : 10$.` }, { v: 0.4, tol: 0.01, why: 'That’s the middle gear. Continue to the last one.' }],
              explain: r`First → middle: $\frac{20}{50} = 0.4$ turns. Middle → last: $0.4 \times \frac{50}{10} = 2$ turns. The middle **idler** gear cancels out of the ratio, but it does make the last gear turn the same way as the first.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Pick a bike gear',
              prompt: r`The front chainring has 48 teeth. Choose the rear cog so that each pedal turn spins the back wheel exactly **4 times**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.4, xmax: 3.6, ymin: -1.6, ymax: 1.6, grid: false, axes: false, maxWidth: 520,
                params: { c: { min: 10, max: 28, step: 1, value: 20, label: 'rear cog teeth', color: 'coral' } },
                extra: ({ plot, p, s }) => {
                  const R1 = 48 * 0.024, R2 = p.c * 0.024, x1 = -0.8, x2 = 2.2;
                  return [
                    s('line', { x1: plot.X(x1), y1: plot.Y(R1), x2: plot.X(x2), y2: plot.Y(R2), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(x1), y1: plot.Y(-R1), x2: plot.X(x2), y2: plot.Y(-R2), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    ...gear(plot, s, x1, 0, 48, 0, 'fl-blue'),
                    ...gear(plot, s, x2, 0, p.c, 0, 'fl-coral'),
                  ];
                },
                readout: (p) => r`ratio $\frac{48}{${p.c}} = ${fix(48 / p.c, 2)}$ wheel turns per pedal turn`,
                goal: (p) => p.c === 12,
                hint: 'Wheel turns per pedal turn = front teeth ÷ rear teeth.',
                solution: { c: 12 },
              },
              explain: r`$\frac{48}{12} = 4$. A chain acts like meshing gears that turn the same way. A big ratio is a high gear: fast on the flat, but hard work uphill.`,
            },
            {
              type: 'numeric',
              title: 'Metres per pedal turn',
              prompt: r`A bike has a 48-tooth chainring and a 16-tooth rear sprocket. Its wheel has a circumference of 2.1 m. How far does the bike travel per turn of the pedals, in metres?`,
              unit: 'm',
              answer: 6.3,
              tol: 0.01,
              explain: r`The wheel turns $\frac{48}{16} = 3$ times per pedal turn, covering $3 \times 2.1 = 6.3$ m. Shifting to a 24-tooth sprocket would give 4.2 m: easier on hills, slower on the flat.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Climbing a hill',
              prompt: 'On a steep hill, which bicycle gear setting makes pedalling easiest?',
              choices: [
                { t: 'A small front chainring and a large rear cog', ok: true },
                { t: 'A large front chainring and a small rear cog', why: 'That’s for going fast on the flat: each pedal turn spins the wheel many times, which takes a lot of force.' },
              ],
              explain: r`A small chainring driving a big rear cog means each pedal turn rotates the wheel less, so you push with less force (for more pedal turns). That's trading distance for force again.`,
            },
          ],
          recap: [
            'Meshing gears trade speed for turning force, in the ratio of their tooth counts.',
            'Fewer teeth: faster, with less turning force. Meshing gears turn in opposite directions.',
            'Low bike gears make hills easier by trading speed for force.',
          ],
        },
        {
          id: 'efficiency',
          title: 'No Free Lunch',
          summary: 'Work and efficiency',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Perpetual motion',
              prompt: 'An inventor claims a machine of pulleys and levers that outputs more work than you put in. What should you say?',
              choices: [
                { t: 'Impossible: it would create energy from nothing', ok: true },
                { t: 'Possible, with enough pulleys', why: 'Every simple machine conserves work at best: force goes up exactly as distance goes down.' },
              ],
              explain: r`An ideal machine gives out exactly the work you put in. Real machines give less, because of friction. Machines that create energy (perpetual motion machines) would break energy conservation, and patent offices routinely refuse them.`,
            },
            {
              type: 'explain',
              title: 'Efficiency',
              body: r`For any machine:
$$\text{efficiency} = \frac{\text{work out}}{\text{work in}} \times 100\%$$
Friction turns some input work into heat, so the efficiency is always below 100%. Good bicycle chains reach about 98%. A simple pulley system might manage 70–90%.

Because of friction, the **actual** mechanical advantage (load ÷ effort) is a bit less than the **ideal** one (effort distance ÷ load distance).`,
            },
            {
              type: 'numeric',
              title: 'Real pulley',
              prompt: 'Lifting an 800 N load 2 m with a pulley system takes 250 N of effort over 8 m of rope. What is the efficiency?',
              unit: '%',
              answer: 80,
              wrong: [{ v: 125, why: 'Efficiency is work out ÷ work in: 1600 ÷ 2000. It can’t exceed 100%.' }],
              explain: r`Work out: $800 \times 2 = 1600$ J. Work in: $250 \times 8 = 2000$ J. Efficiency: $\frac{1600}{2000} = 80\%$. The missing 400 J became heat from friction in the pulleys.`,
            },
            {
              type: 'numeric',
              title: 'Machines in a chain',
              prompt: r`A motor (90% efficient) drives a gearbox (80% efficient). What is the efficiency of the combination?`,
              unit: '%',
              answer: 72,
              wrong: [{ v: 85, why: 'Efficiencies don’t average: the gearbox only gets 90% of the input, then passes on 80% of that.' }, { v: 70, why: r`Losses don't simply add: $0.9 \times 0.8 = 0.72$.` }],
              explain: r`$0.9 \times 0.8 = 0.72 = 72\%$. Efficiencies **multiply**, so every extra stage costs a little more. That's one reason engineers keep power trains simple.`,
            },
            {
              type: 'interactive',
              title: 'Losses multiply',
              body: r`A motor (80% efficient) drives a gearbox (80% efficient), which drives a pump. Choose the pump’s efficiency so the whole chain delivers **48%** of the electrical energy as useful work.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 160,
                params: { e3: { min: 0.5, max: 1, step: 0.01, value: 0.9, label: 'pump efficiency', color: 'teal', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => { const steps = [1, 0.8, 0.64, 0.64 * p.e3]; return steps.map((v, i) => s('rect', { x: plot.X(0.5 + i * 2.4), y: plot.Y(0.3 + 1.5 * v), width: plot.X(1.6) - plot.X(0), height: plot.Y(0.3) - plot.Y(0.3 + 1.5 * v), rx: 4, class: ['fl-blue', 'fl-violet', 'fl-amber', 'fl-teal'][i] })).concat(['in', 'motor', 'gears', 'pump'].map((t, i) => s('text', { x: plot.X(1.3 + i * 2.4), y: plot.Y(0.1) + 4, 'text-anchor': 'middle', class: 'tick', text: t }))); },
                readout: (p) => `overall efficiency: 0.8 × 0.8 × ${p.e3.toFixed(2)} = **${(64 * p.e3).toFixed(1)}%**`,
                goal: (p) => Math.abs(0.64 * p.e3 - 0.48) < 0.001,
                hint: 'Efficiencies in a chain multiply: 0.64 × pump = 0.48.',
                solution: { e3: 0.75 },
              },
              explain: r`$0.8 \times 0.8 \times 0.75 = 0.48$. Three decent machines in a row waste over half the energy, which is why engineers try to shorten chains of conversion (for example, electric cars drive their wheels with as few stages as possible).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Actual vs ideal',
              prompt: 'For the real pulley system above (an 800 N load lifted with 250 N of effort), what is the actual mechanical advantage (load ÷ effort)?',
              answer: 3.2,
              tol: 0.01,
              wrong: [{ v: 4, why: r`That's the ideal MA (8 m ÷ 2 m). The actual MA uses forces: $800 / 250$.` }],
              explain: r`Actual MA $= \frac{800}{250} = 3.2$, while the ideal MA $= \frac{8}{2} = 4$. And efficiency $= \frac{\text{actual MA}}{\text{ideal MA}} = \frac{3.2}{4} = 80\%$. ✓`,
            },
          ],
          recap: [
            'No machine outputs more work than goes in. Perpetual motion is impossible.',
            'Efficiency = work out ÷ work in = actual MA ÷ ideal MA.',
            'Friction makes real machines less than 100% efficient.',
          ],
        },
        {
          id: 'wheel-axle',
          title: 'Wheel & Axle',
          summary: 'Big circles, small circles',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A lever that keeps turning',
              body: r`A doorknob, a steering wheel, a screwdriver and a tap are all **wheel-and-axle** machines: a large wheel fixed to a small axle, turning together. Turn the wheel and the axle turns with it.

It's really a lever that goes round and round: the pivot is the centre, your hand pushes at the wheel's radius $R$, and the axle delivers force at its radius $r$:
$$\text{MA} = \frac{R}{r}$$`,
            },
            {
              type: 'numeric',
              title: 'Winding a well bucket',
              prompt: r`A well's winch has a handle of radius 40 cm turning an axle of radius 5 cm, which winds the rope. What force at the handle lifts a 160 N bucket (ignoring friction)?`,
              unit: 'N',
              answer: 20,
              wrong: [{ v: 1280, why: 'The big handle gives you an advantage: divide by the MA of 8.' }],
              explain: r`$\text{MA} = \frac{40}{5} = 8$, so $\frac{160}{8} = 20$ N. But you must wind the handle 8 times as far as the rope rises.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose the handle',
              prompt: r`A stuck valve needs 120 N at the axle (radius 2 cm) to turn. You can push with 15 N. How big must the handwheel's radius be?`,
              widget: {
                kind: 'graph', equal: true, xmin: -20, xmax: 20, ymin: -20, ymax: 20, grid: false, axes: false, maxWidth: 360,
                params: { R: { min: 4, max: 20, step: 1, value: 8, label: 'wheel radius', color: 'blue', format: (v) => `${v} cm` } },
                extra: ({ plot, p, s }) => {
                  const u = plot.X(1) - plot.X(0);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: p.R * u, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 6 }),
                    ...[0, 1, 2, 3].map((k) => s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(p.R * Math.cos((k * Math.PI) / 2)), y2: plot.Y(p.R * Math.sin((k * Math.PI) / 2)), stroke: 'var(--blue)', 'stroke-width': 3 })),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 2 * u, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => r`MA $= \frac{${p.R}}{2} = ${fix(p.R / 2, 1)}$, $\;$ force needed $= \frac{120}{${fix(p.R / 2, 1)}} = ${fix(240 / p.R, 2)}$ N`,
                goal: (p) => p.R === 16,
                hint: r`You need MA $= \frac{120}{15} = 8$.`,
                solution: { R: 16 },
              },
              explain: r`You need MA $= \frac{120}{15} = 8$, so $R = 8 \times 2 = 16$ cm. That's why big valves have big handwheels, and why a long screwdriver handle is easier to turn than a thin one.`,
            },
            {
              type: 'mcq',
              title: 'Backwards',
              prompt: r`In a car, the engine turns the axle, and the axle turns the much larger wheel. What does this arrangement trade?`,
              choices: [
                { t: 'Force for speed: the wheel’s rim moves faster and farther than the axle’s surface', ok: true },
                { t: 'Speed for force: the wheel pushes harder than the axle', why: 'Driving from the axle is like using the lever from the short end: MA < 1.' },
                { t: 'Nothing: wheels just reduce friction', why: 'They do reduce friction, but driving the axle also multiplies speed.' },
              ],
              explain: r`Driving the axle to turn the wheel has MA $= \frac{r}{R} < 1$: you need more force, but the rim moves faster. Bicycles and cars do this, then use gears to balance force against speed.`,
            },
            {
              type: 'numeric',
              title: 'A screwdriver',
              prompt: r`A screwdriver handle has a radius of 2 cm and its shaft a radius of 4 mm. What is its ideal mechanical advantage?`,
              answer: 5,
              explain: r`$\frac{20\ \text{mm}}{4\ \text{mm}} = 5$: the handle multiplies your twisting force five times. That’s why a fat-handled screwdriver loosens stubborn screws more easily.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Steering effort',
              prompt: r`A steering wheel of radius 19 cm turns a shaft of radius 1 cm that needs 76 N at its surface. Power steering is broken. What force must the driver apply at the rim?`,
              unit: 'N',
              answer: 4,
              wrong: [{ v: 1444, why: 'The wheel helps you: divide by MA = 19.' }],
              explain: r`$\text{MA} = 19$, so $\frac{76}{19} = 4$ N. Older cars had larger steering wheels precisely to give drivers more leverage.`,
            },
          ],
          recap: [
            r`Wheel and axle: MA $= R/r$ when you turn the wheel.`,
            'It’s a lever that keeps turning: doorknobs, taps, winches, screwdrivers.',
            'Driving the axle instead trades force for speed.',
          ],
        },
        {
          id: 'compound',
          title: 'Combining Machines',
          summary: 'Advantages multiply',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Machines in series',
              body: r`Most real machines are **compound**: several simple machines feeding into each other. Scissors are two levers with wedge-shaped blades. A bicycle combines pedal cranks (wheel and axle), a chain drive (gears) and wheels. A crane combines winches and pulleys.

When the output of one machine drives the next, the mechanical advantages **multiply**:
$$\text{MA}_{\text{total}} = \text{MA}_1 \times \text{MA}_2 \times \cdots$$`,
            },
            {
              type: 'numeric',
              title: 'Winch plus pulleys',
              prompt: r`A winch (MA 6) pulls the rope of a block and tackle with 4 supporting segments. What is the total mechanical advantage?`,
              answer: 24,
              wrong: [{ v: 10, why: 'Advantages multiply when one machine drives another: 6 × 4.' }],
              explain: r`$6 \times 4 = 24$: turning the winch with 50 N could lift 1200 N (ignoring friction). And the distances multiply too: the handle moves 24 times as far as the load.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Build a lifting rig',
              prompt: r`You want a total mechanical advantage of exactly **36**. A lever with MA 3 drives a winch. Choose the winch's MA.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 120,
                params: { w: { min: 2, max: 20, step: 1, value: 6, label: 'winch MA', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const box = (x, t, c) => [s('rect', { x: plot.X(x - 1.2), y: plot.Y(1.5), width: plot.X(2.4) - plot.X(0), height: plot.Y(0.5) - plot.Y(1.5), rx: 8, class: `fl-${c}-soft`, stroke: `var(--${c})`, 'stroke-width': 2 }), s('text', { x: plot.X(x), y: plot.Y(1) + 5, class: 'lbl', 'text-anchor': 'middle', text: t })];
                  return [...box(2, 'lever × 3', 'blue'), ...box(5.2, `winch × ${p.w}`, 'teal'), ...box(8.4, `= × ${3 * p.w}`, 'violet')];
                },
                readout: (p) => r`total MA $= 3 \times ${p.w} = ${3 * p.w}$`,
                goal: (p) => p.w === 12,
                hint: r`$3 \times ? = 36$.`,
                solution: { w: 12 },
              },
              explain: r`$3 \times 12 = 36$. Engineers chain modest stages rather than build one enormous lever: a lever with MA 36 would need an arm 36 times longer than the load arm.`,
            },
            {
              type: 'numeric',
              title: 'Real-world losses',
              prompt: r`That rig has ideal MA 36, but each of the two stages is 85% efficient. What is the **actual** mechanical advantage? (1 decimal place.)`,
              answer: 36 * 0.85 * 0.85,
              tol: 0.06,
              wrong: [{ v: 36 * 0.85, tol: 0.06, why: 'Both stages lose energy: multiply by 0.85 twice.' }],
              explain: r`Overall efficiency $= 0.85 \times 0.85 \approx 0.72$, so actual MA $\approx 36 \times 0.72 = 26.0$. Losses compound just like advantages do.`,
            },
            {
              type: 'numeric',
              title: 'Efficiencies multiply',
              prompt: r`A crane's motor is 95% efficient, its gearbox 90% and its pulleys 80%. What is the overall efficiency? (Percentage, 1 decimal place.)`,
              unit: '%',
              answer: 68.4,
              tol: 0.5,
              explain: r`$0.95 \times 0.9 \times 0.8 = 0.684$: 68.4%. Each stage looks good on its own, yet together they lose almost a third of the input. In a chain of machines the losses compound.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Scissors',
              prompt: r`Why is it easier to cut thick cardboard near the pivot of a pair of scissors than at the tips?`,
              choices: [
                { t: 'Near the pivot, the load arm is short, so the scissors’ levers give a larger mechanical advantage', ok: true },
                { t: 'The blades are sharper near the pivot', why: 'Sharpness is similar along the blade. The difference is leverage.' },
                { t: 'It isn’t easier; it just feels that way', why: 'It really is easier: the force at the cut scales as handle distance ÷ cut distance.' },
              ],
              explain: r`Each blade is a lever with the pivot in the middle. Cutting close to the pivot shortens the load arm, increasing MA $= \frac{\text{handle arm}}{\text{cut arm}}$. Bolt cutters take this to the extreme, with long handles and short jaws (and a second lever stage).`,
            },
          ],
          recap: [
            'Compound machines chain simple machines together.',
            'Mechanical advantages multiply, and so do efficiencies.',
            'Shortening the load arm (cutting near the pivot) increases leverage.',
          ],
        },
      ],
    },
  ],
};
