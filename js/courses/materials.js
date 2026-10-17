import { fix } from '../lib/svg.js';

const r = String.raw;
const EI_DOWEL = 10e9 * (Math.PI * 0.006 ** 4) / 64; // wooden dowel, 6 mm diameter
const pcr = (L) => (Math.PI ** 2 * EI_DOWEL) / L ** 2;

export default {
  id: 'materials',
  subject: 'physics',
  title: 'Strength of Materials',
  level: 'Intermediate',
  cover: 'materials',
  tagline: 'Why bridges stand, rulers bend, columns buckle and arches last for millennia.',
  description: r`Every structure is a negotiation between forces and materials. Learn how engineers measure stress and stretch, why steel bends but glass shatters, why tall beams are so much stiffer than flat ones, how columns suddenly buckle, and how arches carry enormous loads using compression alone.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Stretching and Breaking',
      summary: 'Stress, strain and strength.',
      lessons: [
        {
          id: 'stress',
          title: 'Stress & Strain',
          summary: 'Young’s modulus',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Fair comparisons',
              body: r`A thick rope holds more than a thin thread of the same material, so "how strong is it?" needs care. Engineers use two ratios:

- **Stress** $\sigma = \dfrac{F}{A}$: force per unit cross-sectional area, measured in pascals (N/m²).
- **Strain** $\varepsilon = \dfrac{\Delta L}{L}$: fractional change in length (no units).

For small loads, stress is proportional to strain (Hooke's law), and the ratio is the material's **Young's modulus**, its stiffness:
$$E = \frac{\sigma}{\varepsilon}$$
Steel: about 200 GPa. Bone: about 18 GPa. Wood (along the grain): about 10 GPa. Rubber: around 0.01 GPa.`,
            },
            {
              type: 'numeric',
              title: 'The stress in a wire',
              prompt: r`A steel wire with cross-section $1\text{ mm}^2$ ($10^{-6}$ m²) holds a 10 kg mass. What's the stress in the wire, in megapascals? ($g = 9.8$ m/s².)`,
              unit: 'MPa',
              answer: 98,
              tol: 0.5,
              wrong: [{ v: 10, why: 'Use the weight in newtons: 10 kg × 9.8 m/s² = 98 N.' }, { v: 98e6, relTol: 0.01, why: 'That’s in pascals. A megapascal is a million pascals.' }],
              explain: r`$\sigma = \frac{98 \text{ N}}{10^{-6} \text{ m}^2} = 9.8 \times 10^7$ Pa $= 98$ MPa. A tiny area concentrates even a modest force into a big stress.`,
            },
            {
              type: 'numeric',
              title: 'How much does it stretch?',
              prompt: r`The wire is 2 m long, and steel's Young's modulus is 200 GPa. How much does the wire stretch, in millimetres? (2 decimal places.)`,
              unit: 'mm',
              answer: (98e6 / 200e9) * 2 * 1000,
              tol: 0.01,
              wrong: [{ v: 0.49, tol: 0.01, why: r`That's for 1 m. Strain $= 4.9 \times 10^{-4}$, and the wire is 2 m long.` }],
              explain: r`Strain $= \frac{98 \times 10^6}{200 \times 10^9} = 4.9 \times 10^{-4}$, so $\Delta L = 4.9 \times 10^{-4} \times 2 \text{ m} \approx 0.98$ mm. Steel is so stiff that a 10 kg load barely stretches it, which is just what you want in a bridge cable.`,
            },
            {
              type: 'mcq',
              title: 'Twice as thick',
              prompt: r`A rope’s breaking stress is fixed by its material. If you replace it with a rope of the same material but **twice the diameter**, how much more load can it hold?`,
              choices: [
                { t: r`4 times as much`, ok: true },
                { t: r`2 times as much`, why: r`Load capacity depends on cross-sectional area, which grows with the diameter **squared**.` },
                { t: r`8 times as much`, why: r`Volume grows like the cube, but strength depends on the area of the cross-section: $2^2 = 4$.` },
              ],
              explain: r`Breaking load = breaking stress × area, and area $\propto d^2$, so doubling the diameter quadruples the load. It also quadruples the weight per metre, which is why very long ropes and cables eventually can’t even hold themselves up.`,
            },
            {
              type: 'interactive',
              title: 'Thick enough',
              body: r`A steel wire must hold 1,000 N without its stress exceeding 100 MPa ($10^8$ N/m²). Find the smallest diameter that works.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 8, ymin: 0, ymax: 500, grid: false, height: 260, axes: { xlabel: 'diameter (mm)', ylabel: 'stress (MPa)', xticks: 1, yticks: 100, xAt: 1 },
                params: { d: { min: 1, max: 8, step: 0.01, value: 2.5, label: 'diameter', color: 'coral', format: (v) => `${v.toFixed(2)} mm` } },
                curves: [{ f: (x) => 1000 / (Math.PI * (x / 2000) ** 2) / 1e6, color: 'violet', width: 3 }, { f: () => 100, color: 'teal', dash: true }],
                points: [{ x: (p) => p.d, y: (p) => Math.min(500, 1000 / (Math.PI * (p.d / 2000) ** 2) / 1e6), color: 'coral' }],
                readout: (p) => `area ${(Math.PI * (p.d / 2) ** 2).toFixed(2)} mm² · stress **${(1000 / (Math.PI * (p.d / 2000) ** 2) / 1e6).toFixed(1)} MPa**`,
                goal: (p) => { const st = 1000 / (Math.PI * (p.d / 2000) ** 2) / 1e6; return st <= 100 && st > 98; },
                hint: 'You need an area of 1000 / 10⁸ = 10⁻⁵ m² = 10 mm².',
                solution: { d: 3.57 },
              },
              explain: r`An area of 10 mm² needs a diameter of about **3.6 mm**. Stress falls with the square of the diameter, so a slightly thicker wire carries much more: going up to 5 mm halves the stress.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Safety margin in a bone',
              prompt: r`Standing on one leg, a 70 kg person's thigh bone (cross-section about 3 cm² of solid bone) carries roughly their weight, 690 N. Bone can take about 130 MPa in compression. What's the safety factor (strength ÷ actual stress)? (Nearest whole number.)`,
              answer: Math.round(130e6 / (690 / 3e-4)),
              tol: 1,
              wrong: [{ v: 2.3, tol: 0.1, why: 'That’s the actual stress in MPa. Divide the strength (130 MPa) by it.' }],
              explain: r`Stress $= \frac{690}{3 \times 10^{-4}} \approx 2.3$ MPa, so the safety factor is $\frac{130}{2.3} \approx 57$. Running and jumping multiply the load several times over, which is why bones are built with such a generous margin.`,
            },
          ],
          recap: [
            r`Stress $\sigma = F/A$; strain $\varepsilon = \Delta L/L$.`,
            r`Young's modulus $E = \sigma/\varepsilon$ measures stiffness.`,
            'Steel (200 GPa) is about 10 times stiffer than bone and 20 times stiffer than wood.',
          ],
        },
        {
          id: 'breaking',
          title: 'Bend or Shatter',
          summary: 'Elastic, plastic and brittle',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'The stress–strain curve',
              body: r`Pull a sample until it breaks and plot stress against strain.`,
              widget: {
                kind: 'figure', w: 600, h: 290, maxWidth: 560, label: 'Schematic stress–strain curves for mild steel and glass',
                draw: ({ s, arrow }) => {
                  const X = (e) => 70 + e * 500, Y = (v) => 250 - v * 200;
                  return [
                    arrow(X(0), Y(0), X(1.03), Y(0), { color: 'var(--ink)', width: 2 }),
                    arrow(X(0), Y(0), X(0), Y(1.08), { color: 'var(--ink)', width: 2 }),
                    s('text', { x: X(1), y: Y(0) + 24, class: 'lbl', 'text-anchor': 'end', text: 'strain' }),
                    s('text', { x: X(0) + 10, y: Y(1.06), class: 'lbl', text: 'stress' }),
                    s('path', { d: `M${X(0)} ${Y(0)} L${X(0.06)} ${Y(0.6)} L${X(0.16)} ${Y(0.6)} C${X(0.4)} ${Y(0.85)} ${X(0.6)} ${Y(0.95)} ${X(0.75)} ${Y(0.92)} L${X(0.85)} ${Y(0.8)}`, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 4, 'stroke-linejoin': 'round' }),
                    s('path', { d: `M${X(0)} ${Y(0)} L${X(0.035)} ${Y(0.42)}`, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }),
                    s('text', { x: X(0.035) + 8, y: Y(0.42) + 4, class: 'lbl', style: 'fill: var(--coral)', text: 'glass: snaps ✗' }),
                    s('circle', { cx: X(0.06), cy: Y(0.6), r: 5, class: 'fl-ink' }),
                    s('text', { x: X(0.06) - 8, y: Y(0.6) - 12, class: 'tick', 'text-anchor': 'middle', text: 'yield point' }),
                    s('circle', { cx: X(0.75), cy: Y(0.92), r: 5, class: 'fl-ink' }),
                    s('text', { x: X(0.75), y: Y(0.92) - 14, class: 'tick', 'text-anchor': 'middle', text: 'ultimate strength' }),
                    s('text', { x: X(0.85) + 8, y: Y(0.8) + 4, class: 'lbl', style: 'fill: var(--blue)', text: 'steel: breaks' }),
                    s('text', { x: X(0.4), y: Y(0.5), class: 'tick', 'text-anchor': 'middle', text: 'plastic: permanent stretching' }),
                    s('text', { x: X(0.1), y: Y(0.15), class: 'tick', text: '← elastic' }),
                  ];
                },
              },
              after: r`(Schematic: not to scale.) In the **elastic** region, the material springs back when unloaded. Past the **yield point**, steel deforms **plastically**: it stays bent. It keeps getting stronger as it stretches, up to its **ultimate strength**, then necks and breaks. Glass has no plastic region: it's **brittle**, snapping without warning.`,
            },
            {
              type: 'numeric',
              title: 'Safe load',
              prompt: r`Mild steel yields at about 250 MPa. What's the largest mass a steel wire of cross-section $1\text{ mm}^2$ can hold before it yields? (Nearest kg, $g = 9.8$ m/s².)`,
              unit: 'kg',
              answer: Math.round(250 / 9.8),
              tol: 0.6,
              wrong: [{ v: 250, why: r`250 MPa on $10^{-6}$ m² is a force of 250 N. Divide by $g$ for the mass.` }],
              explain: r`$F = 250 \times 10^6 \times 10^{-6} = 250$ N, a mass of about **26 kg**. Engineers then divide by a **safety factor** (often 1.5 to 4) to allow for flaws, wear and unexpected loads.`,
            },
            {
              type: 'mcq',
              title: 'Steel in concrete',
              prompt: r`Concrete can take a compressive stress of 30 MPa or more, but cracks under a tensile stress of only about 3 MPa. Why do engineers embed steel bars ("rebar") in concrete beams?`,
              choices: [
                { t: 'The steel carries the tension (stretching) that would crack the concrete', ok: true },
                { t: 'To make the concrete heavier', why: 'Weight isn’t the goal. Steel is strong in tension, exactly where concrete is weak.' },
                { t: 'Steel is stronger in compression, so it carries the squeeze', why: 'Concrete handles compression well on its own. The steel is there for tension.' },
              ],
              explain: r`A loaded beam is squeezed on top and stretched underneath (more on this next). Steel bars near the bottom take the tension, and concrete takes the compression. **Reinforced concrete**, developed in the 19th century, is now the most widely used building material on Earth.`,
            },
            {
              type: 'mcq',
              title: 'Tough or strong?',
              prompt: r`Glass can be stronger than mild steel in pure tension, yet a steel ruler survives a fall that shatters a glass one. Why?`,
              choices: [
                { t: 'Steel is tough: it absorbs lots of energy by deforming plastically before breaking', ok: true },
                { t: 'Steel is always stronger', why: 'Flawless glass fibres can be very strong. The difference is toughness: energy absorbed before fracture.' },
                { t: 'Glass is lighter', why: 'Weight isn’t the issue. Brittle materials can’t absorb impact energy.' },
              ],
              explain: r`**Strength** is the stress needed to break something; **toughness** is the energy it absorbs first (the area under the stress–strain curve). Ductile steel bends and soaks up energy; glass stores it elastically until a crack races through.`,
            },
            {
              type: 'numeric',
              title: 'Stress in a rod',
              prompt: r`A steel rod with a cross-section of 1 cm² carries a pull of 10 kN. What is the stress in it, in megapascals?`,
              unit: 'MPa',
              answer: 100,
              explain: r`$\frac{10{,}000\ \text{N}}{10^{-4}\ \text{m}^2} = 10^8$ Pa $= 100$ MPa, well below the 250 MPa or so at which ordinary steel starts to yield.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Silk versus steel',
              prompt: r`Spider dragline silk has a breaking stress of about 1.0 GPa and a density of 1,300 kg/m³; a high-strength steel wire about 2.0 GPa and 7,850 kg/m³. By what factor is silk stronger **for its weight**? (1 decimal place.)`,
              unit: '×',
              answer: (1.0 / 1300) / (2.0 / 7850),
              tol: 0.06,
              wrong: [{ v: 0.5, tol: 0.01, why: r`That compares strength alone. Divide each strength by its density first.` }],
              explain: r`$\frac{1.0/1300}{2.0/7850} \approx 3.0$: per kilogram, silk is about three times stronger than this steel, and it is also far tougher, absorbing huge energy as it stretches. That’s why it’s a holy grail for materials scientists.`,
            },
          ],
          recap: [
            'Elastic deformation springs back; plastic deformation is permanent.',
            'Ductile materials like steel yield and stretch before breaking; brittle ones like glass snap.',
            'Concrete is strong in compression but weak in tension, so it’s reinforced with steel.',
          ],
        },
      ],
    },
    {
      title: 'Structures',
      summary: 'Beams, columns and arches.',
      lessons: [
        {
          id: 'beams',
          title: 'Beams',
          summary: 'Why height matters most',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Squeezed and stretched',
              body: r`When a beam bends under a load, its top surface is **compressed** and its bottom surface is **stretched**. Somewhere in between lies the **neutral axis**, which neither stretches nor shrinks.

The further material sits from the neutral axis, the more it resists bending. For a rectangular beam of width $b$ and height $h$, the stiffness is proportional to
$$b\,h^3$$
Doubling the width doubles the stiffness, but doubling the height multiplies it by **eight**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A loaded plank',
              body: r`A plank sticks out from a wall with a weight on the end. Change its height (keeping its width fixed).`,
              widget: {
                kind: 'graph', xmin: -0.6, xmax: 6.4, ymin: -3.4, ymax: 1.6, grid: false, axes: false, height: 260,
                params: { h: { min: 1, max: 4, step: 0.5, value: 1, label: 'plank height', color: 'teal', format: (v) => `${fix(v, 1)} cm` } },
                extra: ({ plot, p, s, arrow }) => {
                  const Lb = 5.5, tip = 2.6 / p.h ** 3; // tip deflection ∝ 1/h³
                  const y = (x) => -tip * (x * x * (3 * Lb - x)) / (2 * Lb ** 3);
                  const th = 0.12 * p.h;
                  let top = '', bot = '';
                  for (let i = 0; i <= 40; i++) {
                    const x = (Lb * i) / 40;
                    top += `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y(x) + th / 2).toFixed(1)}`;
                    bot = `L${plot.X(x).toFixed(1)} ${plot.Y(y(x) - th / 2).toFixed(1)}` + bot;
                  }
                  const tx = plot.X(Lb), ty = plot.Y(y(Lb) - th / 2);
                  return [
                    s('rect', { x: plot.X(-0.6), y: plot.Y(1.6), width: plot.X(0) - plot.X(-0.6), height: plot.Y(-3.4) - plot.Y(1.6), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('line', { x1: plot.X(0), x2: plot.X(Lb), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('path', { d: top + bot.replace(/^L/, 'L') + ' Z', class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2.5 }),
                    arrow(tx, ty + 4, tx, ty + 44, { color: 'var(--coral)', width: 3.5 }),
                    s('text', { x: tx - 10, y: ty + 40, class: 'lbl', 'text-anchor': 'end', text: 'load' }),
                  ];
                },
                readout: (p) => r`stiffness $\propto h^3 = ${fix(p.h ** 3, 3)}$ $\;\Rightarrow\;$ the tip sags ${p.h === 1 ? 'the most' : `$\\frac{1}{${fix(p.h ** 3, 3)}}$ as much as the 1 cm plank`}`,
              },
              after: r`That's why floor joists are installed on edge, tall and narrow, never flat. It's also the idea behind the **I-beam**: most of the steel is put into the top and bottom flanges, far from the neutral axis, connected by a thin web.`,
            },
            {
              type: 'numeric',
              title: 'Flat or on edge?',
              prompt: r`A ruler is 30 mm wide and 3 mm thick. How many times stiffer is it when bent "on edge" (height 30 mm, width 3 mm) than when bent flat (height 3 mm, width 30 mm)?`,
              unit: '×',
              answer: 100,
              wrong: [{ v: 10, why: r`Stiffness goes as $b h^3$: compare $3 \times 30^3$ with $30 \times 3^3$.` }, { v: 1000, why: r`Don't forget the width also changes: $\frac{3 \times 30^3}{30 \times 3^3} = 100$.` }],
              explain: r`$\frac{3 \times 30^3}{30 \times 3^3} = \frac{81{,}000}{810} = 100$. Try it: a ruler flexes easily when flat but is nearly rigid on edge.`,
            },
            {
              type: 'mcq',
              title: 'Where to drill',
              prompt: r`An electrician needs to drill a hole through a wooden floor joist (a beam on edge). Where does the hole weaken it least?`,
              choices: [
                { t: r`Through the middle of its depth, near the neutral axis`, ok: true },
                { t: r`Close to the top or bottom edge`, why: r`That’s where the stresses are largest: the top is squeezed and the bottom stretched.` },
                { t: r`It makes no difference`, why: r`Bending stress varies from zero at the middle to a maximum at the edges.` },
              ],
              explain: r`In bending, the middle layer (the **neutral axis**) is neither stretched nor squeezed, so removing material there costs little strength. That’s also why I-beams can have a thin central web: the flanges at the top and bottom do most of the work.`,
            },
            {
              type: 'numeric',
              title: 'A longer span',
              prompt: r`For a beam carrying a load at its middle, the sag grows like the **cube** of the span. If a shelf’s span doubles, by what factor does its sag increase?`,
              answer: 8,
              explain: r`$2^3 = 8$. That’s why long shelves need extra brackets and why bridge spans are so demanding.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why I-beams?',
              prompt: r`An I-beam and a solid rectangular beam use the same amount of steel and have the same height. Which is stiffer in bending?`,
              choices: [
                { t: 'The I-beam: its material sits far from the neutral axis, where it resists bending most', ok: true },
                { t: 'The solid beam: it has no gaps', why: 'The material near the middle barely helps with bending. Moving it to the flanges helps a lot.' },
                { t: 'They’re equally stiff', why: 'Same material, different arrangement: distance from the neutral axis matters.' },
              ],
              explain: r`Bending stiffness depends on how far the material is from the neutral axis (roughly as distance squared). The I-beam moves material out to the flanges, giving much more stiffness per kilogram. Bones, bird feathers and plant stems use similar tricks.`,
            },
          ],
          recap: [
            'A bending beam is compressed on one side and stretched on the other.',
            r`Stiffness of a rectangular beam $\propto b h^3$.`,
            'I-beams place material far from the neutral axis for maximum stiffness per kilogram.',
          ],
        },
        {
          id: 'buckling',
          title: 'Columns & Buckling',
          summary: 'Sudden sideways failure',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Failing sideways',
              body: r`Press down on a strand of dry spaghetti. It doesn't crush; it suddenly bows sideways and snaps. That's **buckling**, and for long, thin columns it happens at loads far below what the material could take in pure compression.

In 1744, Leonhard Euler found the critical load for a slender column with pinned ends:
$$P_{\text{cr}} = \frac{\pi^2 E I}{L^2}$$
where $L$ is the length and $I$ measures how the cross-section resists bending (like $bh^3$ for beams).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How long can it be?',
              prompt: r`A wooden dowel 6 mm across is used as a column. Find the **longest** dowel that can support a 100 N load (about 10 kg) without buckling.`,
              widget: {
                kind: 'graph', xmin: 0.1, xmax: 0.6, ymin: 0, ymax: 400, grid: 0.1, gridY: 100, height: 300, padL: 54,
                axes: { xlabel: 'length (m)', ylabel: 'buckling load (N)', xAt: 0.1, xfmt: (v) => v.toFixed(1) },
                params: { L: { min: 0.1, max: 0.6, step: 0.01, value: 0.4, slider: false } },
                curves: [{ f: (L) => pcr(L), color: 'violet', width: 3 }, { f: () => 100, color: 'coral', dash: true }],
                points: [{ x: (p) => p.L, y: (p) => Math.min(400, pcr(p.L)), drag: { x: 'L' }, color: 'teal' }],
                readout: (p) => {
                  const P = pcr(p.L);
                  return r`$L = ${p.L.toFixed(2)}$ m: $\;P_{\text{cr}} = ${P.toFixed(0)}$ N ${P >= 100 ? '✓ holds the load' : '✗ buckles'}`;
                },
                goal: (p) => pcr(p.L) >= 100 && pcr(p.L + 0.01) < 100,
                hint: r`Drag along the curve to where it crosses the dashed 100 N line, staying on the safe side.`,
                solution: { L: 0.25 },
              },
              explain: r`About **25 cm**. Because $P_{\text{cr}} \propto \frac{1}{L^2}$, a dowel twice as long buckles at a quarter of the load: 50 cm supports only about 25 N. That's why scaffolding poles are braced at intervals: halving the free length quadruples the load they can take.`,
            },
            {
              type: 'numeric',
              title: 'Thicker columns',
              prompt: r`For a round column, $I \propto d^4$. If you double a column's diameter, by what factor does its buckling load increase?`,
              unit: '×',
              answer: 16,
              wrong: [{ v: 4, why: r`That's how much the **area** grows. Buckling depends on $I \propto d^4$: $2^4$.` }, { v: 2, why: r`$P_{\text{cr}} \propto I \propto d^4$, so the factor is $2^4$.` }],
              explain: r`$2^4 = 16$, while the column only uses 4 times as much material. Better still, a **hollow tube** puts its material far from the centre, giving a large $I$ for little weight. Bicycle frames, bamboo and bird bones all use this trick.`,
            },
            {
              type: 'mcq',
              title: 'Thin-walled tubes',
              prompt: r`Bicycle frames, scaffolding poles and plant stems are often hollow tubes rather than solid rods of the same mass. Why?`,
              choices: [
                { t: r`Spreading the material out away from the centre makes the tube much stiffer against bending and buckling`, ok: true },
                { t: r`Hollow tubes are cheaper to make`, why: r`Sometimes, but the structural reason is that material far from the axis resists bending best.` },
                { t: r`Air inside makes them stronger`, why: r`The air does nothing. The benefit comes from where the material sits.` },
              ],
              explain: r`Bending stiffness grows with the fourth power of the radius, so a wider, thinner-walled tube of the same mass is far stiffer. Too thin, though, and the wall itself crumples locally, so designs balance the two failure modes.`,
            },
            {
              type: 'numeric',
              title: 'Half the length',
              prompt: r`Euler’s buckling load is proportional to $\frac{1}{L^2}$. If a column is cut to half its length, by what factor does the load it can carry before buckling increase?`,
              answer: 4,
              explain: r`$\frac{1}{(1/2)^2} = 4$. Bracing a long column at its middle has the same effect, which is why tall structures have cross-bracing.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Bamboo',
              prompt: r`Bamboo stems are hollow tubes with solid "nodes" every so often. What do the nodes do?`,
              choices: [
                { t: 'They stop the thin tube wall from collapsing locally, and break the stem into shorter, stiffer sections', ok: true },
                { t: 'They store water', why: 'Mechanically, they act like stiffening rings, preventing local buckling of the thin wall.' },
                { t: 'Nothing structural', why: 'Engineers copy them: stiffening rings in tubes prevent local buckling.' },
              ],
              explain: r`A hollow tube gives a large $I$ for little material, but a very thin wall can crumple locally. The nodes act like the rings inside aircraft fuselages and drink cans, keeping the tube round. Nature found the optimal column long before engineers did.`,
            },
          ],
          recap: [
            'Slender columns fail by buckling sideways, well below their crushing strength.',
            r`Euler: $P_{\text{cr}} = \pi^2 EI/L^2$, so doubling the length quarters the load.`,
            'Thicker or hollow cross-sections resist buckling far better.',
          ],
        },
        {
          id: 'arches',
          title: 'Arches & Domes',
          summary: 'Building with compression',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Stone hates being stretched',
              body: r`Stone, brick and unreinforced concrete are strong in compression but weak in tension. A stone beam across a wide gap would crack along its stretched underside. An **arch** solves this: its shape lets every block push against its neighbours, so the whole structure is in **compression**.

In 1675, Robert Hooke summed up the ideal shape: *as hangs the flexible line, so but inverted will stand the rigid arch*. A hanging chain is purely in tension; flip its shape upside down and you get an arch purely in compression.`,
            },
            {
              type: 'mcq',
              title: 'The keystone',
              prompt: r`While a stone arch is being built, it's supported by a temporary wooden frame. When can the frame be removed?`,
              choices: [
                { t: 'Once the keystone at the top is in place, locking the blocks so they press against each other', ok: true },
                { t: 'As soon as the first half of the arch is built', why: 'A half-arch has nothing to push against. It would topple.' },
                { t: 'Never: arches always need internal support', why: 'Once complete, an arch supports itself by compression. Many Roman arches have stood for 2,000 years.' },
              ],
              explain: r`Until the arch is closed, the blocks have nothing to lean on. With the keystone placed, each block is squeezed between its neighbours, and the arch pushes outward and down onto its supports (which must be strong enough to resist that outward thrust).`,
            },
            {
              type: 'mcq',
              title: 'Gaudí’s upside-down models',
              prompt: r`To design the curved columns and vaults of the Sagrada Família, Antoni Gaudí hung strings weighted with small bags of shot and photographed them, then turned the photos upside down. Why does this work?`,
              choices: [
                { t: 'Hanging strings settle into pure tension under their loads; inverted, the same shapes carry those loads in pure compression', ok: true },
                { t: 'Strings are as strong as stone', why: 'The materials differ, but the force pattern is what matters: flipping turns tension into compression.' },
                { t: 'It was only for artistic effect', why: 'It’s genuine engineering. The inverted hanging model gives shapes that need no tension at all.' },
              ],
              explain: r`Gravity finds the shape automatically: a hanging string takes the form where every part is in pure tension. Reverse all the forces and you get a structure in pure compression, perfect for masonry. Modern engineers use computer form-finding based on the same idea. And the Pantheon in Rome, built around 125 AD, still has the largest unreinforced concrete dome in the world.`,
            },
            {
              type: 'mcq',
              title: 'Flying buttresses',
              prompt: r`Gothic cathedrals have tall, thin walls and huge windows, propped by external arches called flying buttresses. What do the buttresses resist?`,
              choices: [
                { t: 'The outward thrust of the stone vaults pushing the walls apart', ok: true },
                { t: 'The weight of the roof pressing straight down', why: 'Walls handle vertical loads well. The danger is the sideways push from the vaults.' },
                { t: 'Wind only', why: 'Wind matters, but the main job is to counter the vaults’ outward thrust.' },
              ],
              explain: r`An arch or vault pushes outward as well as down. Buttresses carry that thrust down to the ground outside, letting the walls become thin and full of glass. Notre-Dame de Paris was one of the first cathedrals to use them, in the late 12th century.`,
            },
            {
              type: 'interactive',
              title: 'Rise versus thrust',
              body: r`A parabolic arch spans 20 m and carries 10 kN per metre. Its outward thrust is $H = \frac{wL^2}{8h}$. Make the arch tall enough that the thrust is no more than **50 kN**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -12, xmax: 12, ymin: -1, ymax: 13, grid: false, axes: false, maxWidth: 460,
                params: { h: { min: 2, max: 12, step: 0.5, value: 4, label: 'rise', color: 'violet', format: (v) => `${fix(v, 1)} m` } },
                curves: [{ f: (x, p) => (Math.abs(x) <= 10 ? p.h * (1 - (x / 10) ** 2) : NaN), color: 'violet', width: 5 }],
                extra: ({ plot, p, s, arrow }) => { const H = (10 * 400) / (8 * p.h), L = Math.min(6, H / 20); return [s('line', { x1: plot.X(-12), x2: plot.X(12), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 }), arrow(plot.X(-10), plot.Y(0.3), plot.X(-10 - L), plot.Y(0.3), { color: 'var(--coral)', width: 4 }), arrow(plot.X(10), plot.Y(0.3), plot.X(10 + L), plot.Y(0.3), { color: 'var(--coral)', width: 4 })]; },
                readout: (p) => `rise ${fix(p.h, 1)} m: outward thrust **${((10 * 400) / (8 * p.h)).toFixed(0)} kN** on each support`,
                goal: (p) => (10 * 400) / (8 * p.h) <= 50 + 1e-9 && p.h <= 10,
                hint: '$H = \\frac{4000}{8h} \\le 50$.',
                solution: { h: 10 },
              },
              explain: r`A rise of **10 m** brings the thrust down to 50 kN; a flat 2 m arch would push outward with 250 kN. Tall Roman arches needed little buttressing; shallow medieval bridges and flat Gothic vaults needed massive abutments and flying buttresses.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The sideways push',
              prompt: r`An arch pushes outward on its supports. For a parabolic arch with span $L$ and rise $h$ carrying a uniform load $w$ per metre, the horizontal thrust is $H = \frac{wL^2}{8h}$. With $w = 10$ kN/m, $L = 20$ m and $h = 5$ m, what is $H$?`,
              unit: 'kN',
              answer: 100,
              wrong: [{ v: 400, why: r`Divide by $8h = 40$, not 10.` }],
              explain: r`$\frac{10 \times 20^2}{8 \times 5} = 100$ kN. A flatter arch (smaller $h$) pushes outward much harder, which is why Gothic cathedrals needed flying buttresses, and why a shallow bridge needs massive abutments.`,
            },
          ],
          recap: [
            'Masonry is strong in compression and weak in tension.',
            'Arches keep every part in compression; the ideal shape is an inverted hanging chain.',
            'An arch stands on its own once the keystone locks it.',
          ],
        },
      ],
    },
    {
      title: 'Failure and Frameworks',
      summary: 'Cracks, and why triangles rule.',
      lessons: [
        {
          id: 'cracks',
          title: 'Cracks & Stress Concentration',
          summary: 'Why sharp corners break',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Stress piles up',
              body: r`Pull on a plate with a hole in it, and the stress near the hole's edge is much higher than the average: the "flow" of force has to squeeze around it. For an elliptical hole of length $2a$ with tip radius $\rho$, Charles Inglis found in 1913 that the peak stress is multiplied by
$$K = 1 + 2\sqrt{\frac{a}{\rho}}$$
The sharper the tip (small $\rho$), the bigger the concentration. A crack is the sharpest possible hole.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Blunt the crack',
              prompt: r`A crack 20 mm long (half-length $a = 10$ mm) has a very sharp tip. Engineers stop cracks growing by drilling a hole at the tip, rounding it. Choose the tip radius that brings the stress concentration factor down to **3**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 25, grid: 2, gridY: 5, height: 260, padL: 48, axes: { xlabel: 'tip radius ρ (mm)', ylabel: 'K' },
                params: { rho: { min: 0.1, max: 12, step: 0.1, value: 0.2, slider: false } },
                curves: [{ f: (x) => 1 + 2 * Math.sqrt(10 / x), from: () => 0.15, color: 'violet', width: 3 }, { f: () => 3, color: 'teal', dash: true, width: 2 }],
                points: [{ x: (p) => p.rho, y: (p) => Math.min(25, 1 + 2 * Math.sqrt(10 / p.rho)), drag: { x: 'rho' }, color: 'coral' }],
                readout: (p) => r`$K = 1 + 2\sqrt{10/${p.rho.toFixed(1)}} = ${(1 + 2 * Math.sqrt(10 / p.rho)).toFixed(2)}$`,
                goal: (p) => Math.abs(1 + 2 * Math.sqrt(10 / p.rho) - 3) < 0.02,
                hint: r`$K = 3$ needs $\sqrt{a/\rho} = 1$.`,
                solution: { rho: 10 },
              },
              explain: r`$K = 3$ when $\rho = a = 10$ mm: a circular hole. A sharp crack might have $K$ of 20 or more; rounding it cuts the peak stress by a factor of 7. "Crack-stopper" holes are drilled into aircraft skins, bridge girders and even cracked windscreens.`,
            },
            {
              type: 'mcq',
              title: 'Square windows',
              prompt: r`In 1954, two de Havilland Comet airliners broke apart in flight. Investigators traced the failures to metal fatigue near the corners of square-ish cut-outs in the fuselage. What changed in later airliners?`,
              choices: [
                { t: 'Windows got rounded corners, reducing stress concentration', ok: true },
                { t: 'Windows were removed entirely', why: 'Passengers still get windows; their corners became rounded.' },
                { t: 'Thicker glass', why: 'The problem was the metal around the opening, where stress concentrated at sharp corners.' },
              ],
              explain: r`Each pressurisation cycle stressed the metal near the corners far above average, and fatigue cracks grew there. Rounded windows spread the stress, and every airliner since has them.`,
            },
            {
              type: 'numeric',
              title: 'A sharp tip',
              prompt: r`An elliptical hole multiplies the stress at its tip by about $1 + \frac{2a}{b}$, where $a$ is its half-length and $b$ its half-width. For a crack 10 mm long ($a = 5$ mm) and only 0.1 mm wide ($b = 0.05$ mm), what is the factor?`,
              unit: '×',
              answer: 1 + 2 * 5 / 0.05,
              wrong: [{ v: 101, why: r`Check the half-width: $b = 0.05$ mm, so $2a/b = 200$.` }],
              explain: r`$1 + \frac{2 \times 5}{0.05} = 201$: the tip feels 200 times the average stress. That’s why engineers drill a small round hole at the end of a crack to blunt it, and why glass breaks so easily once scratched.`,
            },
            {
              type: 'mcq',
              title: 'Stopping a crack',
              prompt: r`Engineers sometimes stop a growing crack in a metal plate by drilling a small hole at its tip. Why does that work?`,
              choices: [
                { t: r`It replaces the razor-sharp tip with a rounded one, greatly reducing the stress concentration`, ok: true },
                { t: r`It removes the cracked metal`, why: r`Only a tiny bit is removed; the key is the rounder tip.` },
                { t: r`It lets air in to cool the metal`, why: r`Temperature isn’t the point; the curvature of the tip is.` },
              ],
              explain: r`Stress concentration grows like $\sqrt{a/\rho}$, where $\rho$ is the tip radius. A drilled hole makes $\rho$ hundreds of times bigger. The same principle explains why airliner windows have rounded corners.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A sharp crack',
              prompt: r`A crack with half-length 4 mm has a tip radius of 0.01 mm. What is its stress concentration factor? (Nearest whole number.)`,
              answer: Math.round(1 + 2 * Math.sqrt(4 / 0.01)),
              tol: 0.6,
              wrong: [{ v: 40, why: r`$K = 1 + 2\sqrt{400} = 1 + 40$.` }, { v: 401, why: 'Take the square root of a/ρ before multiplying by 2.' }],
              explain: r`$K = 1 + 2\sqrt{\frac{4}{0.01}} = 1 + 2 \times 20 = 41$. A modest load becomes 41 times larger at the tip: that's how small cracks grow, and why glass is scored before snapping.`,
            },
          ],
          recap: [
            'Holes and cracks concentrate stress at their edges.',
            r`Inglis: $K = 1 + 2\sqrt{a/\rho}$: sharp tips are dangerous.`,
            'Rounding corners and drilling crack-stopper holes reduce the peak stress.',
          ],
        },
        {
          id: 'trusses',
          title: 'Triangles & Trusses',
          summary: 'The only rigid polygon',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Squares wobble, triangles don’t',
              body: r`Join four bars with hinges into a square and push a corner: it collapses into a rhombus. A triangle of three hinged bars can't change shape at all, because three side lengths fix a triangle completely (SSS congruence).

That's why bridges, cranes, roofs and bicycle frames are built from triangles: **trusses**. Each bar is pulled or pushed along its length, with no bending, so thin members can carry big loads.`,
            },
            {
              type: 'mcq',
              title: 'Bracing a gate',
              prompt: r`A rectangular wooden gate sags over time. What's the best fix?`,
              choices: [
                { t: 'Add a diagonal brace, splitting the rectangle into two triangles', ok: true },
                { t: 'Use thicker horizontal bars', why: 'Thicker bars help a little, but a rectangle with hinge-like joints can still shear. A diagonal makes it rigid.' },
                { t: 'Add another vertical bar in the middle', why: 'That makes two smaller rectangles, which can still shear.' },
              ],
              explain: r`A diagonal turns the rectangle into two triangles. Put it from the bottom of the hinge side to the top of the latch side, and it's squeezed (in compression) as the gate tries to sag.`,
            },
            {
              type: 'numeric',
              title: 'How many bars?',
              prompt: r`A flat framework with $j$ joints needs at least $2j - 3$ bars to be rigid. How many bars does a rigid truss with 6 joints need?`,
              unit: 'bars',
              answer: 9,
              wrong: [{ v: 12, why: r`$2 \times 6 - 3 = 9$.` }, { v: 6, why: 'Too few: a 6-sided ring of bars would wobble freely.' }],
              explain: r`$2 \times 6 - 3 = 9$. Each joint has 2 ways to move (in the plane), and the whole frame can slide or turn as a unit in 3 ways, so $2j - 3$ bars are needed to lock it. A chain of triangles meets this count exactly.`,
            },
            {
              type: 'numeric',
              title: 'Forces in the bars',
              prompt: r`A 1,000 N weight hangs from the top joint of two bars, each sloping steeply at $60°$ above the horizontal. Each bar pushes along its length with force $F$ such that $2F\sin 60° = 1000$ N. What is $F$? (Nearest newton.)`,
              unit: 'N',
              answer: 1000 / (2 * Math.sin(Math.PI / 3)),
              tol: 1,
              wrong: [{ v: 500, why: r`That would be right for vertical bars. These slope, so only $\sin 60° \approx 0.866$ of each push is upward: $F = \frac{1000}{2 \times 0.866}$.` }],
              explain: r`$F = \frac{1000}{2 \times 0.866} \approx 577$ N, only a little more than half the weight, because steep bars point almost straight up. Flatten them and the force grows quickly, as the next step shows: that's why roof trusses aren't made too flat.`,
            },
            {
              type: 'interactive',
              title: 'Steeper is easier',
              body: r`A 1,000 N load hangs from the apex of two bars that slope at angle $\theta$. Each bar carries $F = \frac{W}{2\sin\theta}$. Find the angle at which each bar carries exactly the load itself, 1,000 N.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.5, xmax: 4.5, ymin: -0.5, ymax: 4, grid: false, axes: false, maxWidth: 420,
                params: { th: { min: 10, max: 80, step: 1, value: 45, label: 'bar angle', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => { const t = (p.th * Math.PI) / 180, L = 3.5, top = [0, L * Math.sin(t)], F = 1000 / (2 * Math.sin(t)); const col = F > 1500 ? 'var(--coral)' : 'var(--teal)'; return [s('line', { x1: plot.X(-L * Math.cos(t)), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(top[1]), stroke: col, 'stroke-width': 6 }), s('line', { x1: plot.X(L * Math.cos(t)), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(top[1]), stroke: col, 'stroke-width': 6 }), s('line', { x1: plot.X(-4.5), x2: plot.X(4.5), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 }), s('rect', { x: plot.X(-0.3), y: plot.Y(top[1] - 0.15), width: plot.X(0.6) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), class: 'fl-ink' })]; },
                readout: (p) => `force in each bar: **${(1000 / (2 * Math.sin((p.th * Math.PI) / 180))).toFixed(0)} N**`,
                goal: (p) => p.th === 30,
                hint: 'You need $2\\sin\\theta = 1$.',
                solution: { th: 30 },
              },
              explain: r`At $30°$, $\sin\theta = \frac12$ and each bar carries 1,000 N. At $10°$ the force rises to almost 2,900 N: shallow trusses multiply forces, which is why washing lines sag and why a tight rope can’t be pulled perfectly straight.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pulled or pushed?',
              prompt: r`A simple bridge truss sags slightly under a load in the middle. Which members are in tension?`,
              choices: [
                { t: 'The bottom chord (the lower horizontal bars)', ok: true },
                { t: 'The top chord', why: 'Like a beam, the top is squeezed (compression) and the bottom stretched (tension).' },
                { t: 'All of them equally', why: 'Different members carry different forces; the bottom chord stretches as the truss sags.' },
              ],
              explain: r`A truss behaves like a deep beam: the top chord is compressed and the bottom chord stretched. That's why bottom chords can be slender steel bars or even cables, while top chords are chunkier to resist buckling.`,
            },
          ],
          recap: [
            'Triangles are the only rigid polygons with hinged corners.',
            r`A rigid planar truss needs at least $2j - 3$ bars.`,
            'In a loaded truss, top members are compressed and bottom members stretched.',
          ],
        },
      ],
    },
  ],
};
