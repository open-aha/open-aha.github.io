import { fix } from '../lib/svg.js';

const r = String.raw;
const XY = { xlabel: 'x', ylabel: 'y' };
const seg = (plot, s, x1, y1, x2, y2, color, w = 3, dash) => s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: `var(--${color})`, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': dash || null });
const dot = (plot, s, x, y, cls, rad = 7) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: rad, class: cls, stroke: 'var(--card)', 'stroke-width': 2.5 });

// side view of a double cone, cut by a plane through (0, 1.4) at angle th from horizontal
const SIDE = 60; // the cone's sides make 60° with the horizontal
const conicName = (th) => (th === 0 ? 'a circle' : th < SIDE ? 'an ellipse' : th === SIDE ? 'a parabola' : 'a hyperbola');

// eccentricity of the cut when the plane is tilted th degrees from horizontal (cone sides at 60°)
const eccOf = (th) => Math.sin((th * Math.PI) / 180) / Math.cos(((90 - SIDE) * Math.PI) / 180);

export default {
  id: 'conics',
  subject: 'math',
  title: 'Conic Sections',
  level: 'Intermediate',
  cover: 'conics',
  tagline: 'Ellipses, parabolas and hyperbolas: the curves of orbits, dishes and lenses.',
  description: r`Slice a cone and you get four famous curves. Discover the focus properties that explain planetary orbits, satellite dishes, whispering galleries and GPS-style navigation, and learn to recognise each curve from its equation.`,
  prereq: 'Quadratics & Polynomials',
  chapters: [
    {
      title: 'Four Curves',
      summary: 'Slices of a cone.',
      lessons: [
        {
          id: 'slicing',
          title: 'Slicing a Cone',
          summary: 'Where the curves come from',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tilt the knife',
              body: r`Picture a double cone (two cones tip to tip), seen from the side. Slice it with a flat plane, shown here as the coral line, and look at the shape of the cut. Tilt the plane.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.2, xmax: 3.2, ymin: -3, ymax: 3.2, grid: false, axes: false, maxWidth: 440,
                params: { th: { min: 0, max: 85, step: 5, value: 30, label: 'tilt', color: 'coral', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const k = Math.tan((SIDE * Math.PI) / 180);
                  const els = [
                    s('path', { d: `M${plot.X(-3 / k)} ${plot.Y(3)} L${plot.X(0)} ${plot.Y(0)} L${plot.X(3 / k)} ${plot.Y(3)} Z`, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                    s('path', { d: `M${plot.X(-3 / k)} ${plot.Y(-3)} L${plot.X(0)} ${plot.Y(0)} L${plot.X(3 / k)} ${plot.Y(-3)} Z`, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                    seg(plot, s, 0, -3, 0, 3.1, 'ink-3', 1.5, '5 5'),
                  ];
                  const t = (p.th * Math.PI) / 180, L = 5;
                  els.push(seg(plot, s, -L * Math.cos(t), 1.4 - L * Math.sin(t), L * Math.cos(t), 1.4 + L * Math.sin(t), 'coral', 4));
                  return els;
                },
                readout: (p) => `The cut is **${conicName(p.th)}**${p.th > SIDE ? ' (the plane cuts both cones, giving two pieces)' : ''}.`,
              },
              after: r`- **Flat** cut: a **circle**.
- Tilted, but less steeply than the cone's side: an **ellipse** (a closed oval).
- Exactly **parallel** to the side: a **parabola** (open at one end).
- Steeper than the side: a **hyperbola**, with two separate branches.

The Greek mathematician Apollonius studied these "conic sections" over 2,000 years ago.`,
            },
            {
              type: 'mcq',
              title: 'A torch on a wall',
              prompt: r`A torch's beam is a cone of light. You shine it at a wall, slightly tilted, and the bright patch is a closed oval. Then you tilt the torch more and more until the patch's edge stops closing up. What shapes do you see?`,
              choices: [
                { t: 'Ellipse, then parabola, then hyperbola', ok: true },
                { t: 'Circle, then ellipse, then circle again', why: 'Tilting further makes the patch longer and longer, until it no longer closes.' },
                { t: 'Parabola, then ellipse', why: 'It starts closed (an ellipse) and opens up as you tilt more.' },
              ],
              explain: r`The wall is the slicing plane. Facing the wall square on gives a circle, a small tilt gives an ellipse, and once the cone's edge is parallel to the wall the patch opens into a parabola, then a hyperbola. You can try this with a phone torch!`,
            },
            {
              type: 'interactive',
              title: 'Dial an eccentricity',
              body: r`Every slice has an **eccentricity** $e$: 0 for a circle, between 0 and 1 for an ellipse, exactly 1 for a parabola, more than 1 for a hyperbola. For this cone, $e = \dfrac{\sin(\text{tilt})}{\cos 30°}$. The picture shows the actual shape of the cut. Find the tilt that gives an ellipse with $e = 0.5$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.2, ymax: 2.2, grid: false, axes: false, maxWidth: 480,
                params: { th: { min: 0, max: 85, step: 0.5, value: 40, label: 'tilt', color: 'coral', format: (v) => `${fix(v, 1)}°` } },
                extra: ({ plot, p, s }) => { const ec = eccOf(p.th), pts = []; for (let i = 0; i <= 400; i++) { const t = -Math.PI + (2 * Math.PI * i) / 400, den = 1 + ec * Math.cos(t); if (den <= 0.02) { pts.push(null); continue; } const rr = 1 / den; if (rr > 6) { pts.push(null); continue; } pts.push([rr * Math.cos(t) - (ec < 1 ? ec / (1 - ec * ec) : 0) * 0, rr * Math.sin(t)]); } let d = '', pen = false; for (const q of pts) { if (!q) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${plot.X(q[0] * 0.6 + 1.2).toFixed(1)} ${plot.Y(q[1] * 0.6).toFixed(1)}`; pen = true; } return [s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }), s('circle', { cx: plot.X(1.2), cy: plot.Y(0), r: 5, class: 'fl-coral' })]; },
                readout: (p) => { const ec = eccOf(p.th); return `tilt ${fix(p.th, 1)}°: eccentricity **${ec.toFixed(3)}** · ${ec < 1e-9 ? 'circle' : ec < 0.999 ? 'ellipse' : ec < 1.001 ? 'parabola' : 'hyperbola (one branch shown)'}`; },
                goal: (p) => Math.abs(eccOf(p.th) - 0.5) < 0.01,
                hint: r`Solve $\sin(\text{tilt}) = 0.5 \times \cos 30° \approx 0.433$.`,
                solution: { th: 25.5 },
              },
              explain: r`$\sin(\text{tilt}) = 0.433$ gives a tilt of about $25.7°$. The coral dot is a **focus**. As the tilt grows the ellipse stretches away from the focus, opens into a parabola at exactly $60°$ (parallel to the cone's side), and then becomes a hyperbola. Eccentricity is the single number that sorts all conics.`,
            },
            {
              type: 'mcq',
              title: 'Through the tip',
              prompt: r`What do you get if the slicing plane passes through the very tip of the double cone?`,
              choices: [
                { t: 'A single point, a single line, or a pair of crossing lines, depending on the tilt', ok: true },
                { t: 'A very small circle', why: 'At the tip the cone has no width at all: a flat cut there is just a point.' },
                { t: 'Nothing: the plane misses the cone', why: 'The plane touches the cone at least at the tip.' },
              ],
              explain: r`These are the **degenerate conics**: a point (flat cut through the tip), a line (cut along the cone's side), or two crossing lines (steeper cut). They're limiting cases of the ellipse, parabola and hyperbola, and they still satisfy second-degree equations, like $x^2 - y^2 = 0$ for two crossing lines.`,
            },
            {
              type: 'numeric',
              title: 'From axes to eccentricity',
              prompt: r`An ellipse has semi-major axis $a = 13$ and semi-minor axis $b = 5$. Its foci are $c = \sqrt{a^2 - b^2}$ from the centre and its eccentricity is $e = \frac{c}{a}$. What is $e$? (3 decimal places.)`,
              answer: 12 / 13,
              tol: 0.001,
              wrong: [{ v: 12, why: r`That's $c$, the distance from the centre to a focus. Divide by $a = 13$.` }],
              explain: r`$c = \sqrt{169 - 25} = 12$, so $e = \frac{12}{13} \approx 0.923$: a long, thin ellipse. A circle has $e = 0$; as $b \to 0$ the ellipse flattens and $e \to 1$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Planetary eccentricity',
              prompt: r`Mars's orbit has eccentricity 0.0934. The ratio of its farthest to nearest distance from the Sun is $\frac{1 + e}{1 - e}$. What is that ratio? (2 decimal places.)`,
              answer: 1.0934 / 0.9066,
              tol: 0.006,
              wrong: [{ v: 1.0934, tol: 0.006, why: r`Divide by $1 - e$ as well: $\frac{1.0934}{0.9066}$.` }],
              explain: r`$\frac{1.0934}{0.9066} \approx 1.21$: Mars is about 21% farther from the Sun at its farthest than at its nearest, so its sunlight varies by about 45% ($1.21^2$) over its year, enough to stir up planet-wide dust storms. Halley's comet, with $e \approx 0.97$, swings from inside Venus's orbit to beyond Neptune's.`,
            },
          ],
          recap: [
            'Slicing a cone gives a circle, an ellipse, a parabola or a hyperbola.',
            'The tilt of the plane compared with the cone’s side decides which.',
            'Ellipses are closed. Parabolas and hyperbolas are open.',
          ],
        },
        {
          id: 'ellipse',
          title: 'The Ellipse',
          summary: 'Two foci and a string',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The gardener’s ellipse',
              body: r`Push two pins into a board, loop a string around them, and pull it tight with a pencil. Move the pencil around and it draws an **ellipse**. The pins are the **foci** (singular: focus). Drag the point around the curve.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5.5, xmax: 5.5, ymin: -3.6, ymax: 3.6, grid: 1, axes: XY, maxWidth: 600,
                params: {
                  a: { min: 2.5, max: 5, step: 0.5, value: 4, label: '$a$', color: 'blue', format: (v) => fix(v, 1) },
                  e: { min: 0, max: 0.9, step: 0.05, value: 0.6, label: 'eccentricity', color: 'violet', format: (v) => v.toFixed(2) },
                  t: { min: -Math.PI, max: Math.PI, step: 0.01, value: 1.1, slider: false },
                },
                curves: [{ param: { x: (t, p) => p.a * Math.cos(t), y: (t, p) => p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'ink' }],
                extra: ({ plot, p, s }) => {
                  const c = p.a * p.e, b = p.a * Math.sqrt(1 - p.e * p.e);
                  const x = p.a * Math.cos(p.t), y = b * Math.sin(p.t);
                  return [seg(plot, s, -c, 0, x, y, 'blue', 3), seg(plot, s, c, 0, x, y, 'coral', 3), dot(plot, s, -c, 0, 'fl-blue'), dot(plot, s, c, 0, 'fl-coral')];
                },
                points: [{ x: (p) => p.a * Math.cos(p.t), y: (p) => p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(p.t), drag: { fn: (x, y, p) => ({ t: Math.atan2(y / Math.sqrt(1 - p.e * p.e), x) }), key: 't' }, color: 'ink' }],
                readout: (p) => {
                  const c = p.a * p.e, b = p.a * Math.sqrt(1 - p.e * p.e);
                  const x = p.a * Math.cos(p.t), y = b * Math.sin(p.t);
                  const d1 = Math.hypot(x + c, y), d2 = Math.hypot(x - c, y);
                  return r`$\blue{d_1 = ${fix(d1, 2)}}$, $\coral{d_2 = ${fix(d2, 2)}}$, $\;d_1 + d_2 = ${fix(d1 + d2, 0)} = 2a$`;
                },
              },
              after: r`Wherever the point goes, $d_1 + d_2$ stays the same: it equals $2a$, the length of the long axis. The **eccentricity** $e$ measures how stretched the ellipse is: $e = 0$ is a circle (the two foci merge), and $e$ close to 1 is long and thin.`,
            },
            {
              type: 'explain',
              title: 'The equation',
              body: r`An ellipse centred at the origin, with semi-axes $a$ (along $x$) and $b$ (along $y$):
$$\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$$
The foci sit at $(\pm c, 0)$, where $c^2 = a^2 - b^2$, and the eccentricity is $e = c/a$.`,
            },
            {
              type: 'numeric',
              title: 'Find the foci',
              prompt: r`The ellipse $\dfrac{x^2}{25} + \dfrac{y^2}{9} = 1$ has foci at $(\pm c, 0)$. What is $c$?`,
              lhs: r`$c =$`,
              answer: 4,
              wrong: [{ v: 16, why: r`That's $c^2 = 25 - 9$. Take the square root.` }, { v: 5.83, tol: 0.01, why: r`For an ellipse it's $c^2 = a^2 - b^2$ (minus, not plus).` }, { v: 2, why: r`$a = 5$ and $b = 3$, so $c^2 = 25 - 9 = 16$.` }],
              explain: r`$a = 5$, $b = 3$, so $c = \sqrt{25 - 9} = 4$. The foci are at $(\pm 4, 0)$ and the eccentricity is $4/5 = 0.8$.`,
            },
            {
              type: 'mcq',
              title: 'Orbits',
              prompt: r`Kepler discovered that planets move in ellipses. Where is the Sun?`,
              choices: [
                { t: 'At one focus', ok: true },
                { t: 'At the centre of the ellipse', why: 'The centre is empty space. The Sun sits off-centre, at a focus.' },
                { t: 'At both foci', why: 'There’s only one Sun! The other focus is empty.' },
              ],
              explain: r`The Sun sits at **one focus**: that's Kepler's first law. Earth's orbit has eccentricity about 0.017, so it's almost a circle. Comet Halley's orbit, with $e \approx 0.97$, is a long thin ellipse.`,
            },
            {
              type: 'mcq',
              title: 'Whispering galleries',
              prompt: r`In an elliptical room, a whisper at one focus can be heard clearly at the other focus, far across the room. Why?`,
              choices: [
                { t: 'Sound leaving one focus reflects off the wall straight toward the other focus', ok: true },
                { t: 'The walls amplify sound', why: 'There’s no amplification. Every reflected path is redirected to the other focus, and the paths all have the same length.' },
                { t: 'Sound travels faster along the long axis', why: 'Sound travels at the same speed in every direction.' },
              ],
              explain: r`An ellipse's **reflection property**: any line from one focus bounces off the curve toward the other focus. And since $d_1 + d_2 = 2a$ for every path, all the reflections arrive **at the same moment** and reinforce each other. Statuary Hall in the US Capitol is a famous example. Doctors use the same idea to break kidney stones with focused shock waves.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ramanujan’s perimeter',
              prompt: r`An ellipse's perimeter has no simple exact formula. Srinivasa Ramanujan found the superb approximation $\pi\left[3(a + b) - \sqrt{(3a + b)(a + 3b)}\right]$. Use it for $a = 5$, $b = 3$. (1 decimal place.)`,
              answer: Math.PI * (3 * 8 - Math.sqrt((15 + 3) * (5 + 9))),
              tol: 0.06,
              wrong: [{ v: Math.PI * 8, tol: 0.06, why: r`That's $\pi(a + b)$, a rougher estimate. Use Ramanujan's formula.` }],
              explain: r`$\pi[24 - \sqrt{18 \times 14}] = \pi[24 - 15.875] \approx 25.5$. Ramanujan's 1914 formula is accurate to within a few parts per million for moderate shapes. Circles are easy; ellipses are surprisingly hard.`,
            },
          ],
          recap: [
            r`An ellipse: the points where $d_1 + d_2 = 2a$ (constant).`,
            r`$\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$, with foci at $\pm c$, where $c^2 = a^2 - b^2$, and $e = c/a$.`,
            'Rays from one focus reflect to the other. Planets orbit with the Sun at a focus.',
          ],
        },
      ],
    },
    {
      title: 'Open Curves',
      summary: 'Parabolas and hyperbolas.',
      lessons: [
        {
          id: 'parabola',
          title: 'The Parabola',
          summary: 'Focus, directrix and dishes',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Focus and directrix',
              body: r`A **parabola** is the set of points that are **equally far** from a point (the **focus**) and a line (the **directrix**). Drag the point along the curve. Turn on the incoming rays to see what the shape does to light.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -2.5, ymax: 5.5, grid: 1, axes: XY, maxWidth: 560,
                params: {
                  f: { min: 0.5, max: 2, step: 0.25, value: 1, label: 'focus height $p$', color: 'coral', format: (v) => fix(v, 2) },
                  x0: { min: -4.5, max: 4.5, step: 0.1, value: 2.5, slider: false },
                  rays: { min: 0, max: 1, step: 1, value: 0, label: 'rays', color: 'amber', format: (v) => (v ? 'on' : 'off') },
                },
                curves: [{ f: (x, p) => (x * x) / (4 * p.f), color: 'ink' }],
                extra: ({ plot, p, s }) => {
                  const els = [seg(plot, s, -5, -p.f, 5, -p.f, 'teal', 3, '8 6'), dot(plot, s, 0, p.f, 'fl-coral', 8)];
                  if (p.rays) {
                    for (const x of [-4, -3, -2, -1, 1, 2, 3, 4]) {
                      const y = (x * x) / (4 * p.f);
                      if (y > 5.5) continue;
                      els.push(seg(plot, s, x, 5.5, x, y, 'amber', 2), seg(plot, s, x, y, 0, p.f, 'amber', 2));
                    }
                  } else {
                    const y = (p.x0 * p.x0) / (4 * p.f);
                    els.push(seg(plot, s, p.x0, y, 0, p.f, 'coral', 3), seg(plot, s, p.x0, y, p.x0, -p.f, 'teal', 3));
                  }
                  return els;
                },
                points: [{ x: (p) => p.x0, y: (p) => (p.x0 * p.x0) / (4 * p.f), drag: { x: 'x0' }, color: 'ink', visible: (p) => !p.rays }],
                readout: (p) => {
                  if (p.rays) return r`Light arriving parallel to the axis reflects through the **focus**.`;
                  const y = (p.x0 * p.x0) / (4 * p.f);
                  return r`$y = \dfrac{x^2}{${fix(4 * p.f, 0)}}$: $\;\coral{\text{to focus} = ${fix(Math.hypot(p.x0, y - p.f), 2)}}$, $\;\teal{\text{to directrix} = ${fix(y + p.f, 2)}}$`;
                },
              },
              after: r`The two distances always match. With the focus at $(0, p)$ and the directrix $y = -p$, the parabola is
$$y = \frac{x^2}{4p}$$
And every ray coming in parallel to the axis reflects through the focus.`,
            },
            {
              type: 'numeric',
              title: 'Where to put the receiver',
              prompt: r`A satellite dish has the shape $y = \dfrac{x^2}{8}$ (in metres). How high above the bottom of the dish should the receiver sit, at the focus?`,
              unit: 'm',
              answer: 2,
              wrong: [{ v: 8, why: r`Compare with $y = \frac{x^2}{4p}$: $4p = 8$.` }, { v: 0.125, why: r`That's the coefficient $\frac18$. Solve $4p = 8$.` }, { v: 4, why: r`$4p = 8$, so $p = 2$.` }],
              explain: r`Matching $y = \dfrac{x^2}{4p}$ gives $4p = 8$, so $p = 2$ m. Signals arriving from a distant satellite are effectively parallel, so they all reflect into the receiver at the focus.`,
            },
            {
              type: 'mcq',
              title: 'Headlights',
              prompt: r`A car headlight puts its bulb at the focus of a parabolic mirror. What kind of beam comes out?`,
              choices: [
                { t: 'A beam of parallel rays', ok: true },
                { t: 'Rays spreading out in every direction', why: 'The mirror redirects the bulb’s light so it leaves parallel to the axis.' },
                { t: 'Rays converging to a second focus', why: 'That’s what an ellipse would do. A parabola has one focus, and rays from it leave parallel.' },
              ],
              explain: r`Light paths are reversible: since parallel incoming rays reflect into the focus, light leaving the focus reflects out **parallel**. The same idea is used in torches, solar cookers and radio telescopes.`,
            },
            {
              type: 'numeric',
              title: 'The latus rectum',
              prompt: r`For the parabola $y = \frac{x^2}{4}$, the focus is at $(0, 1)$. How wide is the parabola at the height of its focus?`,
              answer: 4,
              wrong: [{ v: 2, why: r`At $y = 1$: $x^2 = 4$, so $x = \pm 2$. The width is from $-2$ to $2$.` }],
              explain: r`At $y = 1$, $x = \pm 2$: width 4, four times the focal distance. This chord (the "latus rectum") is a quick way to sketch a parabola from its focus.`,
            },
            {
              type: 'numeric',
              title: 'Find the directrix',
              prompt: r`The parabola $y = \frac{x^2}{12}$ can be written $x^2 = 4py$ with $p = 3$. Its focus is $(0, 3)$. What is the equation of its directrix, $y = \;?$`,
              answer: -3,
              explain: r`The directrix is the same distance $p$ on the other side of the vertex: $y = -3$. Every point of the parabola is equally far from $(0, 3)$ and from this line.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Dish depth',
              prompt: r`A satellite dish is a parabola $y = \frac{x^2}{4f}$ with focal length $f = 20$ cm. It is 60 cm across. How deep is it? (In cm, 2 decimal places.)`,
              unit: 'cm',
              answer: 30 * 30 / 80,
              tol: 0.01,
              wrong: [{ v: 45, tol: 0.1, why: r`Use the radius, 30 cm, not the full width.` }],
              explain: r`At the rim $x = 30$ cm, so depth $= \frac{30^2}{4 \times 20} = 11.25$ cm. Shallower dishes have longer focal lengths, which is why the receiver of a flat dish sits on a long arm.`,
            },
          ],
          recap: [
            'A parabola: points equally far from a focus and a directrix.',
            r`Focus $(0, p)$ and directrix $y = -p$ give $y = \dfrac{x^2}{4p}$.`,
            'Parallel rays reflect through the focus, and rays from the focus leave parallel.',
          ],
        },
        {
          id: 'eccentricity',
          title: 'Eccentricity',
          summary: 'One number for all conics',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Focus and directrix, again',
              body: r`Every conic (except the circle) can be defined by a focus $F$, a line called the directrix, and a number $e$, the **eccentricity**: the curve is the set of points whose distance to $F$ is $e$ times their distance to the directrix.

- $e = 0$: a circle (the limit of an ellipse).
- $0 < e < 1$: an ellipse.
- $e = 1$: a parabola.
- $e > 1$: a hyperbola.

One family, one dial.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design an orbit',
              prompt: r`In polar form, an orbit around a focus is $r = \frac{1}{1 + e\cos\theta}$. Choose $e$ so that the orbit's farthest point is **three times** as far from the focus (the Sun) as its nearest point.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.5, xmax: 1.6, ymin: -2.4, ymax: 2.4, grid: false, axes: false, maxWidth: 520,
                params: { e: { min: 0, max: 1.4, step: 0.05, value: 0.2, label: 'eccentricity e', color: 'violet', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => {
                  let d = '', pen = false;
                  for (let i = 0; i <= 720; i++) {
                    const th = (i / 720) * 2 * Math.PI, den = 1 + p.e * Math.cos(th);
                    if (den <= 0.05) { pen = false; continue; }
                    const rr = 1 / den, x = rr * Math.cos(th), y = rr * Math.sin(th);
                    if (Math.abs(x) > 6 || Math.abs(y) > 4) { pen = false; continue; }
                    d += `${pen ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`;
                    pen = true;
                  }
                  return [s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 9, class: 'fl-amber' })];
                },
                readout: (p) => (p.e < 1 ? r`${p.e === 0 ? 'circle' : 'ellipse'}: nearest $r = ${(1 / (1 + p.e)).toFixed(2)}$, farthest $r = ${(1 / (1 - p.e)).toFixed(2)}$, ratio $${((1 + p.e) / (1 - p.e)).toFixed(2)}$` : p.e === 1 ? 'parabola: the curve never closes (escape!)' : 'hyperbola: a one-time flyby'),
                goal: (p) => Math.abs((1 + p.e) / (1 - p.e) - 3) < 1e-6,
                hint: r`Farthest ÷ nearest $= \frac{1 + e}{1 - e}$. Set it equal to 3.`,
                solution: { e: 0.5 },
              },
              explain: r`$\frac{1 + e}{1 - e} = 3$ gives $e = 0.5$. Push $e$ to 1 and the orbit opens into a parabola: the object escapes. Beyond 1, a hyperbola: a single flyby, like the interstellar visitor 'Oumuamua in 2017 ($e \approx 1.2$).`,
            },
            {
              type: 'numeric',
              title: 'Earth’s orbit',
              prompt: r`Earth's orbital eccentricity is about 0.0167. What is the ratio of its farthest to nearest distance from the Sun? (3 decimal places.)`,
              answer: 1.0167 / 0.9833,
              tol: 0.0006,
              wrong: [{ v: 1.0167, tol: 0.0003, why: r`Divide farthest by nearest: $\frac{1 + e}{1 - e}$.` }],
              explain: r`$\frac{1.0167}{0.9833} \approx 1.034$: only 3.4% farther at aphelion (early July) than at perihelion (early January). Seasons come from the tilt of Earth's axis, not the shape of its orbit.`,
            },
            {
              type: 'numeric',
              title: 'Halley’s comet',
              prompt: r`Halley’s comet has orbital eccentricity 0.967. Its farthest distance from the Sun divided by its nearest is $\frac{1 + e}{1 - e}$. What is that ratio? (Nearest whole number.)`,
              unit: '×',
              answer: 1.967 / 0.033,
              tol: 0.6,
              explain: r`$\frac{1.967}{0.033} \approx 60$: it swings from 0.59 AU (inside Venus’s orbit) out to about 35 AU (beyond Neptune). By Kepler’s second law it races through perihelion in weeks and crawls for decades at the far end.`,
            },
            {
              type: 'numeric',
              title: 'Pluto’s closest approach',
              prompt: r`Pluto’s orbit has semi-major axis 39.5 AU and eccentricity 0.25. How close does it come to the Sun (perihelion $a(1 - e)$), in AU? (1 decimal place.)`,
              unit: 'AU',
              answer: 39.5 * 0.75,
              tol: 0.1,
              explain: r`$39.5 \times 0.75 \approx 29.6$ AU, closer than Neptune’s 30.1 AU. For 20 years (1979–1999) Pluto was nearer to the Sun than Neptune, though their orbits never actually cross in space.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Dandelin spheres',
              prompt: r`In 1822, Germinal Dandelin showed why a slice of a cone has two foci. He placed spheres inside the cone touching both the cone and the cutting plane. Where do the spheres touch the plane?`,
              choices: [
                { t: 'Exactly at the two foci of the ellipse', ok: true },
                { t: 'At the ends of the major axis', why: 'The touching points are inside the ellipse, at the foci.' },
                { t: 'At the centre of the ellipse', why: 'There are two touching points, one per sphere: the two foci.' },
              ],
              explain: r`Tangent lengths from a point to a sphere are all equal, which turns "distance to a focus" into "distance along the cone to a touching circle". Adding the two gives a constant: the sum-of-distances property, proved with pure geometry. It neatly links the cone-slice and focus definitions.`,
            },
          ],
          recap: [
            'Eccentricity e unifies the conics: 0 circle, < 1 ellipse, = 1 parabola, > 1 hyperbola.',
            r`Polar orbit: $r = \frac{p}{1 + e\cos\theta}$; farthest/nearest $= \frac{1 + e}{1 - e}$.`,
            'Dandelin spheres touch the cutting plane at the foci.',
          ],
        },
        {
          id: 'hyperbola',
          title: 'The Hyperbola',
          summary: 'Differences and asymptotes',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A constant difference',
              body: r`A **hyperbola** is the set of points whose distances to two foci have a constant **difference**: $|d_1 - d_2| = 2a$. Drag the point along a branch.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -4, ymax: 4, grid: 1, axes: XY, maxWidth: 600,
                params: {
                  a: { min: 1, max: 3, step: 0.5, value: 2, label: '$a$', color: 'blue', format: (v) => fix(v, 1) },
                  b: { min: 0.5, max: 3, step: 0.5, value: 1.5, label: '$b$', color: 'teal', format: (v) => fix(v, 1) },
                  t: { min: -2, max: 2, step: 0.01, value: 0.8, slider: false },
                },
                curves: [
                  { param: { x: (t, p) => p.a * Math.cosh(t), y: (t, p) => p.b * Math.sinh(t), t0: -2.5, t1: 2.5 }, color: 'ink' },
                  { param: { x: (t, p) => -p.a * Math.cosh(t), y: (t, p) => p.b * Math.sinh(t), t0: -2.5, t1: 2.5 }, color: 'ink' },
                  { f: (x, p) => (p.b / p.a) * x, color: 'violet', dash: true },
                  { f: (x, p) => (-p.b / p.a) * x, color: 'violet', dash: true },
                ],
                extra: ({ plot, p, s }) => {
                  const c = Math.hypot(p.a, p.b);
                  const x = p.a * Math.cosh(p.t), y = p.b * Math.sinh(p.t);
                  return [seg(plot, s, -c, 0, x, y, 'blue', 3), seg(plot, s, c, 0, x, y, 'coral', 3), dot(plot, s, -c, 0, 'fl-blue'), dot(plot, s, c, 0, 'fl-coral')];
                },
                points: [{ x: (p) => p.a * Math.cosh(p.t), y: (p) => p.b * Math.sinh(p.t), drag: { fn: (x, y, p) => ({ t: Math.asinh(y / p.b) }), key: 't' }, color: 'ink' }],
                readout: (p) => {
                  const c = Math.hypot(p.a, p.b);
                  const x = p.a * Math.cosh(p.t), y = p.b * Math.sinh(p.t);
                  const d1 = Math.hypot(x + c, y), d2 = Math.hypot(x - c, y);
                  return r`$\blue{d_1 = ${fix(d1, 2)}}$, $\coral{d_2 = ${fix(d2, 2)}}$, $\;d_1 - d_2 = ${fix(d1 - d2, 0)} = 2a$`;
                },
              },
              after: r`The equation is
$$\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1, \qquad c^2 = a^2 + b^2$$
Far from the centre, the branches hug the dashed **asymptotes** $y = \pm\dfrac{b}{a}x$, getting closer and closer without ever touching them.`,
            },
            {
              type: 'numeric',
              title: 'Foci of a hyperbola',
              prompt: r`Where are the foci of $\dfrac{x^2}{9} - \dfrac{y^2}{16} = 1$? Enter $c$ for the foci at $(\pm c, 0)$.`,
              lhs: r`$c =$`,
              answer: 5,
              wrong: [{ v: 2.65, tol: 0.01, why: r`For a hyperbola, $c^2 = a^2 + b^2$ (plus, unlike the ellipse).` }, { v: 25, why: 'That’s c². Take the square root.' }],
              explain: r`$c = \sqrt{9 + 16} = 5$. The asymptotes are $y = \pm\tfrac43 x$.`,
            },
            {
              type: 'mcq',
              title: 'Flybys',
              prompt: r`A comet from interstellar space (like ‘Oumuamua in 2017) passes the Sun once and leaves forever. What shape is its path?`,
              choices: [
                { t: 'A hyperbola, with the Sun at a focus', ok: true },
                { t: 'An ellipse', why: 'An ellipse is closed: the comet would keep coming back.' },
                { t: 'A circle', why: 'A circular orbit needs exactly the right speed, and it never leaves.' },
              ],
              explain: r`Orbits around the Sun are conics with the Sun at a focus. Too slow to escape: an ellipse. Exactly escape speed: a parabola. Faster than escape speed: a **hyperbola**. Interstellar visitors like ‘Oumuamua move too fast to be captured.`,
            },
            {
              type: 'mcq',
              title: 'Finding a ship',
              prompt: r`Two radio stations send a pulse at the same moment. A ship receives the pulse from station A 0.001 s earlier than the pulse from station B. On what curve must the ship lie?`,
              choices: [
                { t: 'A branch of a hyperbola with foci at the two stations', ok: true },
                { t: 'A circle around station A', why: 'The ship only knows the **difference** in arrival times, not the time from A alone.' },
                { t: 'An ellipse with foci at the two stations', why: 'An ellipse has a constant **sum** of distances. Here the **difference** is fixed.' },
              ],
              explain: r`The time difference fixes the **difference** of distances: $d_B - d_A = 0.001 \times 3 \times 10^8 = 300$ km. That's a hyperbola! A third station gives a second hyperbola, and the ship is where they cross. This was the principle of the LORAN navigation system, and similar time-difference ideas help locate earthquakes and phones.`,
            },
            {
              type: 'numeric',
              title: 'A hyperbola’s eccentricity',
              prompt: r`For $\frac{x^2}{9} - \frac{y^2}{16} = 1$, the foci are at $c = \sqrt{a^2 + b^2} = 5$. What is its eccentricity $e = \frac{c}{a}$? (3 decimal places.)`,
              answer: 5 / 3,
              tol: 0.001,
              explain: r`$e = \frac53 \approx 1.667$. Every hyperbola has $e > 1$: the larger $e$, the more open the branches.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Asymptotes',
              prompt: r`The hyperbola $\frac{x^2}{9} - \frac{y^2}{16} = 1$ approaches straight lines $y = \pm mx$ far from the centre. What is $m$? (As a decimal, 2 places.)`,
              answer: 4 / 3,
              tol: 0.006,
              wrong: [{ v: 0.75, tol: 0.006, why: r`That's $\frac{a}{b}$. The asymptotes are $y = \pm\frac{b}{a}x$ with $a = 3$, $b = 4$.` }, { v: 16 / 9, tol: 0.01, why: 'Take square roots: b = 4 and a = 3.' }],
              explain: r`For large $x$, the $1$ becomes negligible: $\frac{x^2}{9} \approx \frac{y^2}{16}$, so $y \approx \pm\frac43 x$. The hyperbola hugs these two lines, which cross at its centre.`,
            },
          ],
          recap: [
            r`A hyperbola: points where $|d_1 - d_2| = 2a$ (constant).`,
            r`$\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1$, with $c^2 = a^2 + b^2$ and asymptotes $y = \pm\frac{b}{a}x$.`,
            'Unbound orbits are hyperbolas. Time differences locate objects on hyperbolas.',
          ],
        },
        {
          id: 'recognise',
          title: 'Recognising Conics',
          summary: 'From equation to curve',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Read the squares',
              body: r`When there's no $xy$ term, look at the squared terms:

| Equation | Curve |
|---|---|
| $x^2$ and $y^2$, same coefficient | circle |
| $x^2$ and $y^2$, same sign | ellipse |
| $x^2$ and $y^2$, opposite signs | hyperbola |
| only one of $x^2$, $y^2$ | parabola |

If the centre isn't at the origin, **complete the square** to find it.`,
            },
            {
              type: 'mcq',
              title: 'Name it',
              prompt: r`What curve is $4x^2 - y^2 = 16$?`,
              cols: 2,
              choices: [
                { t: 'Hyperbola', ok: true },
                { t: 'Ellipse', why: r`The squared terms have **opposite** signs ($+4x^2$, $-y^2$).` },
                { t: 'Parabola', why: 'Both x and y are squared.' },
                { t: 'Circle', why: 'A circle needs equal coefficients with the same sign.' },
              ],
              explain: r`Opposite signs mean a hyperbola. Dividing by 16: $\dfrac{x^2}{4} - \dfrac{y^2}{16} = 1$, so $a = 2$, $b = 4$, and the asymptotes are $y = \pm 2x$.`,
            },
            {
              type: 'interactive',
              title: 'Tune the coefficients',
              body: r`The curve $Ax^2 + Cy^2 = 1$ changes type as you change $A$ and $C$. Set them to make a **circle of radius 2**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3, ymax: 3, grid: 1, maxWidth: 480, axes: XY,
                params: { A: { min: -1, max: 1, step: 0.05, value: 1, label: '$A$', color: 'blue', format: (v) => v.toFixed(2) }, C: { min: -1, max: 1, step: 0.05, value: 0.5, label: '$C$', color: 'coral', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => { const pts = []; const N = 600; let d = ''; for (const sgn of [1, -1]) { let pen = false; for (let i = 0; i <= N; i++) { const x = -4 + (8 * i) / N, rhs = 1 - p.A * x * x; if (Math.abs(p.C) < 1e-9 || rhs / p.C < 0) { pen = false; continue; } const y = sgn * Math.sqrt(rhs / p.C); if (Math.abs(y) > 3.2) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; pen = true; } } return [s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 })]; },
                readout: (p) => { const A = p.A, C = p.C; const t = A > 0 && C > 0 ? (Math.abs(A - C) < 1e-9 ? `a circle of radius ${(1 / Math.sqrt(A)).toFixed(2)}` : 'an ellipse') : A * C < 0 ? 'a hyperbola' : A === 0 || C === 0 ? (A > 0 || C > 0 ? 'a pair of parallel lines' : 'nothing') : 'no real points'; return `$${A.toFixed(2)}x^2 ${C < 0 ? '-' : '+'} ${Math.abs(C).toFixed(2)}y^2 = 1$: **${t}**`; },
                goal: (p) => Math.abs(p.A - 0.25) < 1e-9 && Math.abs(p.C - 0.25) < 1e-9,
                hint: r`A circle of radius $r$ is $x^2 + y^2 = r^2$, so divide by $r^2 = 4$.`,
                solution: { A: 0.25, C: 0.25 },
              },
              explain: r`$\frac{x^2}{4} + \frac{y^2}{4} = 1$ is $x^2 + y^2 = 4$: radius 2. Make $A$ and $C$ unequal (both positive) and it squashes into an ellipse; give them opposite signs and it splits into a hyperbola; make both negative and there are no points at all.`,
            },
            {
              type: 'numeric',
              title: 'Where are the foci?',
              prompt: r`The hyperbola $\dfrac{x^2}{16} - \dfrac{y^2}{9} = 1$ has $a = 4$ and $b = 3$. Its foci are at $(\pm c, 0)$, and for a hyperbola $c^2 = a^2 + b^2$. What is $c$?`,
              lhs: r`$c =$`,
              answer: 5,
              wrong: [{ v: Math.sqrt(7), tol: 0.01, why: r`For a hyperbola it's $a^2 + b^2$; $a^2 - b^2$ is for ellipses.` }, { v: 25, why: 'That’s c². Take the square root.' }],
              explain: r`$c = \sqrt{16 + 9} = 5$: the foci are at $(\pm5, 0)$, **outside** the vertices at $(\pm4, 0)$, so the eccentricity $\frac{c}{a} = \frac54$ is greater than 1, as it is for every hyperbola. For an ellipse the foci sit inside, with $c^2 = a^2 - b^2$ and $e < 1$.`,
            },
            {
              type: 'numeric',
              title: 'Area of an ellipse',
              prompt: r`$x^2 + 4y^2 = 16$ can be rewritten $\frac{x^2}{16} + \frac{y^2}{4} = 1$. Its area is $\pi ab$. What is the area? (2 decimal places.)`,
              answer: 8 * Math.PI,
              tol: 0.01,
              explain: r`$a = 4$, $b = 2$, so the area is $8\pi \approx 25.13$. Archimedes knew this: an ellipse is a circle stretched in one direction, and stretching multiplies areas by the stretch factor.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Find the centre',
              prompt: r`$x^2 + y^2 - 6x + 4y = 12$ is a circle. Complete the square: what is its radius?`,
              lhs: r`$r =$`,
              answer: 5,
              wrong: [{ v: 12, why: r`Completing the square adds $9 + 4$ to both sides: $(x-3)^2 + (y+2)^2 = 25$.` }, { v: 25, why: 'That’s r². Take the square root.' }, { v: 3.46, tol: 0.01, why: r`Don't forget to add the completed-square constants to the right side: $12 + 9 + 4$.` }],
              explain: r`$(x^2 - 6x + 9) + (y^2 + 4y + 4) = 12 + 9 + 4$, so $(x - 3)^2 + (y + 2)^2 = 25$: a circle with centre $(3, -2)$ and radius **5**.`,
            },
          ],
          recap: [
            'Same-sign squares: ellipse (or circle). Opposite signs: hyperbola. One square: parabola.',
            'Complete the square to find the centre.',
            r`Circle: $(x - h)^2 + (y - k)^2 = r^2$.`,
          ],
        },
        {
          id: 'tilted',
          title: 'Tilted Conics',
          summary: 'Rotating away the xy term',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'The general equation',
              body: r`Every conic can be written as
$$Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0.$$
The cross term $Bxy$ is the sign of a **tilted** conic: its axes don’t line up with the $x$ and $y$ axes. Rotating the coordinate axes by the right angle $\theta$ makes the cross term vanish, revealing a standard ellipse, parabola or hyperbola. The right angle satisfies
$$\tan 2\theta = \frac{B}{A - C}.$$`,
            },
            {
              type: 'mcq',
              title: 'What is xy = 1?',
              prompt: r`The curve $xy = 1$ (that is, $y = \frac1x$) has $A = C = 0$ and $B = 1$. What kind of conic is it?`,
              choices: [
                { t: 'A hyperbola, tilted at 45°', ok: true },
                { t: 'A parabola', why: r`It has two separate branches and two asymptotes (the axes): the hallmarks of a hyperbola.` },
                { t: 'Not a conic at all', why: r`Rotating by 45° turns it into $\frac{u^2}{2} - \frac{v^2}{2} = 1$, a standard hyperbola.` },
              ],
              explain: r`With $A = C$, $\tan 2\theta$ is infinite, so $\theta = 45°$. In the rotated coordinates $u, v$ the equation becomes $u^2 - v^2 = 2$: a rectangular hyperbola whose asymptotes are the original axes.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Line up the axes',
              prompt: r`The ellipse $5x^2 + 4xy + 2y^2 = 6$ is tilted. Rotate the new axes (violet) until the cross term in the new coordinates disappears.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -3, ymax: 3, grid: false, maxWidth: 360, axes: { xticks: 1, yticks: 1 },
                params: { th: { min: 0, max: 90, step: 0.05, value: 10, label: 'rotation θ', color: 'violet', format: (v) => `${v.toFixed(2)}°` } },
                curves: [{ param: { x: (t) => Math.cos(t) * Math.cos(0.4636) - Math.sqrt(6) * Math.sin(t) * Math.sin(0.4636), y: (t) => Math.cos(t) * Math.sin(0.4636) + Math.sqrt(6) * Math.sin(t) * Math.cos(0.4636), t0: 0, t1: 2 * Math.PI }, color: 'coral', width: 3 }],
                extra: ({ plot, p, s }) => { const a = (p.th * Math.PI) / 180, L = 3.2; return [[Math.cos(a), Math.sin(a)], [-Math.sin(a), Math.cos(a)]].map(([c, d]) => s('line', { x1: plot.X(-L * c), y1: plot.Y(-L * d), x2: plot.X(L * c), y2: plot.Y(L * d), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '6 4' })); },
                readout: (p) => { const a = (2 * p.th * Math.PI) / 180, Bp = 4 * Math.cos(a) - 3 * Math.sin(a), Ap = 3.5 + 1.5 * Math.cos(a) + 2 * Math.sin(a), Cp = 3.5 - 1.5 * Math.cos(a) - 2 * Math.sin(a); return `new equation: ${Ap.toFixed(2)}u² ${Bp >= 0 ? '+' : '−'} ${Math.abs(Bp).toFixed(2)}uv + ${Cp.toFixed(2)}v² = 6`; },
                goal: (p) => Math.abs(4 * Math.cos((2 * p.th * Math.PI) / 180) - 3 * Math.sin((2 * p.th * Math.PI) / 180)) < 0.02,
                hint: r`You need $\tan 2\theta = \frac{4}{5 - 2} = \frac43$.`,
                solution: { th: 26.57 },
              },
              explain: r`At $\theta \approx 26.6°$ (where $\tan 2\theta = \frac43$) the equation becomes $6u^2 + v^2 = 6$, or $u^2 + \frac{v^2}{6} = 1$: an ellipse with semi-axes 1 and $\sqrt6$. The new coefficients 6 and 1 are the **eigenvalues** of the matrix $\begin{pmatrix} 5 & 2 \\ 2 & 2 \end{pmatrix}$.`,
            },
            {
              type: 'numeric',
              title: 'The discriminant',
              prompt: r`Without rotating, the sign of $B^2 - 4AC$ tells you the type: negative for an ellipse, zero for a parabola, positive for a hyperbola. Compute it for $5x^2 + 4xy + 2y^2 = 6$.`,
              answer: -24,
              explain: r`$4^2 - 4 \times 5 \times 2 = 16 - 40 = -24 < 0$: an ellipse, as we found. Rotating the axes never changes $B^2 - 4AC$, which is why it can classify the conic.`,
            },
            {
              type: 'mcq',
              title: 'Classify it',
              prompt: r`What kind of conic is $x^2 + 4xy + y^2 = 1$?`,
              choices: [
                { t: 'A hyperbola', ok: true },
                { t: 'An ellipse', why: r`It looks symmetric, but $B^2 - 4AC = 16 - 4 = 12 > 0$.` },
                { t: 'A parabola', why: r`That needs $B^2 - 4AC = 0$; here it is 12.` },
              ],
              explain: r`$B^2 - 4AC = 16 - 4 = 12 > 0$, so it’s a hyperbola. Rotating by 45° gives $3u^2 - v^2 = 1$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The longest reach',
              prompt: r`How far from the centre does the ellipse $5x^2 + 4xy + 2y^2 = 6$ reach at its farthest point? (2 decimal places.)`,
              answer: Math.sqrt(6),
              tol: 0.01,
              wrong: [{ v: 1, why: 'That’s the shorter semi-axis. In u² + v²/6 = 1 the longer one is along v.' }],
              explain: r`In rotated coordinates it is $u^2 + \frac{v^2}{6} = 1$, so the longer semi-axis is $\sqrt6 \approx 2.45$, along the direction at $26.6° + 90° = 116.6°$.`,
            },
          ],
          recap: [
            'An xy term means the conic is tilted.',
            'Rotate by θ with tan 2θ = B/(A − C) to remove it.',
            'B² − 4AC < 0 ellipse, = 0 parabola, > 0 hyperbola, unchanged by rotation.',
          ],
        },
      ],
    },
  ],
};
