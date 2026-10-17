import { fix } from '../lib/svg.js';

const r = String.raw;
const D = Math.PI / 180;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
const f1 = (v) => fix(v, 1);

// refraction at y = 0 between medium n1 (top) and n2 (bottom); incident ray comes from the top-left
function refraction({ n1Top = 1, n2Bottom = 1.5, fromBelow = false, angle = 40, nParam = true, goal, solution, hint } = {}) {
  return {
    kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3, ymax: 3, grid: false, axes: false, maxWidth: 520,
    params: {
      a: { min: 0, max: 85, step: 1, value: angle, label: r`$\theta_1$`, color: 'amber', format: (v) => `${v}°` },
      ...(nParam ? { n: { min: 1, max: 2.5, step: 0.05, value: fromBelow ? n1Top : n2Bottom, label: fromBelow ? r`$n_\text{top}$` : r`$n_2$`, color: 'blue', format: (v) => v.toFixed(2) } } : {}),
    },
    extra: ({ plot, p, s }) => {
      const nA = fromBelow ? n2Bottom : n1Top; // incident medium
      const nB = nParam ? p.n : fromBelow ? n1Top : n2Bottom; // other medium
      const th = p.a * D;
      const sgn = fromBelow ? -1 : 1; // incident side: +1 = top
      const L = 3.6;
      const inc = [-L * Math.sin(th), sgn * L * Math.cos(th)];
      const sin2 = (nA / nB) * Math.sin(th);
      const els = [
        s('rect', { x: plot.X(-4), y: plot.Y(0), width: plot.X(4) - plot.X(-4), height: plot.Y(-3) - plot.Y(0), class: 'fl-blue-soft', opacity: 0.8 }),
        s('line', { x1: plot.X(-4), x2: plot.X(4), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 }),
        s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(2.9), y2: plot.Y(-2.9), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
        s('line', { x1: plot.X(inc[0]), y1: plot.Y(inc[1]), x2: plot.X(0), y2: plot.Y(0), stroke: 'var(--amber)', 'stroke-width': 4 }),
      ];
      const tir = sin2 > 1;
      // reflected ray (always some; full brightness under TIR)
      els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(L * Math.sin(th)), y2: plot.Y(sgn * L * Math.cos(th)), stroke: 'var(--amber)', 'stroke-width': tir ? 4 : 2, opacity: tir ? 1 : 0.35 }));
      if (!tir) {
        const t2 = Math.asin(sin2);
        els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(L * Math.sin(t2)), y2: plot.Y(-sgn * L * Math.cos(t2)), stroke: 'var(--coral)', 'stroke-width': 4 }));
      }
      els.push(
        s('text', { x: plot.X(-3.8), y: plot.Y(fromBelow ? -2.6 : 2.6), class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: `n = ${f2(nA)}` }),
        s('text', { x: plot.X(-3.8), y: plot.Y(fromBelow ? 2.6 : -2.6), class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: `n = ${f2(nB)}` }),
      );
      return els;
    },
    readout: (p) => {
      const nA = fromBelow ? n2Bottom : n1Top;
      const nB = nParam ? p.n : fromBelow ? n1Top : n2Bottom;
      const sin2 = (nA / nB) * Math.sin(p.a * D);
      return sin2 > 1 ? r`$\sin\theta_2 = ${f2(sin2)} > 1$: **total internal reflection!**` : r`$\theta_1 = ${p.a}°, \quad \theta_2 = ${f1(Math.asin(sin2) / D)}°$`;
    },
    goal, solution, hint,
  };
}

// thin converging lens ray diagram
function lensDiagram({ dO = 6, f = 2, goal, solution, hint, fixF = false } = {}) {
  return {
    kind: 'graph', xmin: -10, xmax: 10, ymin: -4, ymax: 4, grid: 1, axes: false, height: 330,
    params: {
      d: { min: 1, max: 9, step: 0.5, value: dO, label: r`$d_o$`, color: 'teal', format: (v) => f1(v) },
      ...(fixF ? {} : { f: { min: 1, max: 4, step: 0.5, value: f, label: '$f$', color: 'violet', format: (v) => f1(v) } }),
    },
    extra: ({ plot, p, s }) => {
      const F = fixF ? f : p.f;
      const h0 = 1.5, x0 = -p.d;
      const els = [
        s('line', { x1: plot.X(-10), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
        s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: 8, ry: plot.Y(-3.4) - plot.Y(0), class: 'fl-blue', opacity: 0.25, stroke: 'var(--blue)', 'stroke-width': 2 }),
        s('circle', { cx: plot.X(F), cy: plot.Y(0), r: 5, class: 'fl-violet' }), s('circle', { cx: plot.X(-F), cy: plot.Y(0), r: 5, class: 'fl-violet' }),
        s('text', { x: plot.X(F), y: plot.Y(0) + 20, 'text-anchor': 'middle', class: 'lbl fl-violet', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'F' }),
        s('text', { x: plot.X(-F), y: plot.Y(0) + 20, 'text-anchor': 'middle', class: 'lbl fl-violet', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'F' }),
      ];
      const arrowUp = (x, hgt, color, dash) => [
        s('line', { x1: plot.X(x), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(hgt), stroke: color, 'stroke-width': 4, 'stroke-dasharray': dash ? '6 4' : null }),
        s('path', { d: `M${plot.X(x)} ${plot.Y(hgt)} l-7 ${hgt > 0 ? 12 : -12} h14 z`, fill: color }),
      ];
      els.push(...arrowUp(x0, h0, 'var(--teal)'));
      const ray = (pts, dash) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join(''), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': dash ? '5 5' : null });
      const atX = (xa, ya, xb, yb, X) => ya + ((yb - ya) * (X - xa)) / (xb - xa);
      // ray 1: parallel, then through far focal point
      els.push(ray([[x0, h0], [0, h0], [10, atX(0, h0, F, 0, 10)]]));
      // ray 2: through the centre
      els.push(ray([[x0, h0], [10, atX(x0, h0, 0, 0, 10)]]));
      if (Math.abs(p.d - F) < 1e-9) return els; // object at the focal point: rays leave parallel
      const di = 1 / (1 / F - 1 / p.d);
      const hi = (-h0 * di) / p.d;
      if (di > 0) els.push(...arrowUp(di, hi, 'var(--coral)'));
      else {
        // virtual image: extend rays backwards
        els.push(ray([[0, h0], [di, hi]], true), ray([[x0, h0], [di, hi]], true));
        els.push(...arrowUp(di, hi, 'var(--coral)', true));
      }
      return els;
    },
    readout: (p) => {
      const F = fixF ? f : p.f;
      if (Math.abs(p.d - F) < 1e-9) return 'Object at the focal point: the rays come out parallel and no image forms.';
      const di = 1 / (1 / F - 1 / p.d);
      const m = -di / p.d;
      return di > 0
        ? r`real image at $d_i = ${f2(di)}$, $\;$ magnification $${f2(m)}$ (${m < 0 ? 'upside down' : 'upright'}${Math.abs(m) > 1 ? ', bigger' : ', smaller'})`
        : r`virtual image at $d_i = ${f2(di)}$ (same side as the object), $\;$ magnification $${f2(m)}$ (upright, bigger)`;
    },
    goal, solution, hint,
  };
}

// concave mirror (focal length 2) ray diagram; mirror at x = 0, objects to the left
function mirrorDiagram() {
  const F = 2, h0 = 1;
  return {
    kind: 'graph', equal: true, xmin: -9, xmax: 6, ymin: -3.5, ymax: 3.5, grid: false, axes: false, maxWidth: 560,
    params: { d: { min: 0.5, max: 8, step: 0.25, value: 6, label: 'object distance', color: 'teal', format: (v) => f2(v) } },
    extra: ({ plot, p, s }) => {
      const x0 = -p.d, els = [];
      els.push(s('line', { x1: plot.X(-9), x2: plot.X(6), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.2 }));
      els.push(s('path', { d: `M${plot.X(-0.6)} ${plot.Y(3.2)} Q${plot.X(0.3)} ${plot.Y(0)} ${plot.X(-0.6)} ${plot.Y(-3.2)}`, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 4 }));
      [[-F, 'F'], [-2 * F, 'C']].forEach(([x, t]) => { els.push(s('circle', { cx: plot.X(x), cy: plot.Y(0), r: 4, class: 'fl-violet' }), s('text', { x: plot.X(x), y: plot.Y(0) + 18, 'text-anchor': 'middle', class: 'lbl fl-violet', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: t })); });
      const up = (x, hh, c, dash) => [s('line', { x1: plot.X(x), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(hh), stroke: c, 'stroke-width': 4, 'stroke-dasharray': dash ? '6 4' : null }), s('path', { d: `M${plot.X(x)} ${plot.Y(hh)} l-6 ${hh > 0 ? 11 : -11} h12 z`, fill: c })];
      els.push(...up(x0, h0, 'var(--teal)'));
      const ray = (pts, dash) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join(''), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': dash ? '5 5' : null });
      const atX = (xa, ya, xb, yb, X) => ya + ((yb - ya) * (X - xa)) / (xb - xa);
      // ray parallel to axis reflects through F; ray through F reflects parallel
      els.push(ray([[x0, h0], [0, h0], [-9, atX(0, h0, -F, 0, -9)]]));
      if (Math.abs(p.d - F) > 1e-9) {
        const yF = atX(x0, h0, -F, 0, 0);
        els.push(ray([[x0, h0], [0, yF], [-9, yF]]));
        const di = 1 / (1 / F - 1 / p.d), hi = (-h0 * di) / p.d;
        if (di > 0) els.push(...up(-di, hi, 'var(--coral)'));
        else { els.push(ray([[0, h0], [-di, hi]], true), ray([[0, yF], [-di, hi]], true)); els.push(...up(-di, hi, 'var(--coral)', true)); }
      }
      return els;
    },
    readout: (p) => {
      if (Math.abs(p.d - F) < 1e-9) return 'Object at the focal point: the reflected rays are parallel, and no image forms.';
      const di = 1 / (1 / F - 1 / p.d), m = -di / p.d;
      return di > 0 ? r`real image $${f2(di)}$ in front of the mirror, magnification $${f2(m)}$ (upside down)` : r`virtual image $${f2(-di)}$ behind the mirror, magnification $${f2(m)}$ (upright, bigger)`;
    },
    goal: (p) => Math.abs(1 / (1 / F - 1 / p.d) / -p.d - 2) < 1e-9,
    hint: 'For an upright, magnified image the object must be closer than the focal point.',
    solution: { d: 1 },
  };
}
// Malus: fraction of polarised light through a polariser at angle th
const malus = (th) => Math.cos((th * Math.PI) / 180) ** 2;

export default {
  id: 'light',
  subject: 'physics',
  title: 'Light & Optics',
  level: 'Intermediate',
  cover: 'light',
  tagline: 'Mirrors, lenses, rainbows, fibre optics and polarisation: following rays of light.',
  description: r`Trace rays of light as they bounce off mirrors, bend into water and glass, get trapped inside optical fibres, and focus through lenses. Then split white light into a rainbow, see what curved mirrors do, and discover the hidden direction of light's wiggle: polarisation.`,
  prereq: 'Trigonometry, and Waves & Oscillations',
  chapters: [
    {
      title: 'Bouncing and Bending',
      summary: 'Reflection, refraction and total internal reflection.',
      lessons: [
        {
          id: 'reflection',
          title: 'Reflection',
          summary: 'Mirrors and images',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Full-length mirror',
              prompt: 'What is the shortest wall mirror in which you can see your whole body, from head to toe?',
              choices: [
                { t: 'Half your height', ok: true },
                { t: 'Your full height', why: 'Surprisingly, you need only half. Light from your feet reflects off the mirror halfway between your eyes and your feet.' },
                { t: 'It depends on how far away you stand', why: 'Strangely, it doesn’t! Stepping back makes your image smaller, but it also shrinks the part of the mirror you use, by the same amount.' },
              ],
              explain: r`Light from your toes reaches your eyes by bouncing off the mirror at the point halfway (in height) between your eyes and your toes. The same goes for the top of your head. So the mirror only needs to span half your height, wherever you stand.`,
            },
            {
              type: 'explain',
              title: 'The law of reflection',
              body: r`A ray hitting a mirror bounces off at the **same angle** it arrived at. Both angles are measured from the **normal**, the line perpendicular to the surface:
$$\theta_\text{in} = \theta_\text{out}$$`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -0.6, ymax: 3.4, grid: false, axes: false, maxWidth: 520,
                params: { a: { min: 5, max: 85, step: 1, value: 35, label: r`$\theta$`, color: 'amber', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const th = p.a * D, L = 3.2;
                  return [
                    s('rect', { x: plot.X(-4), y: plot.Y(0), width: plot.X(4) - plot.X(-4), height: 10, class: 'fl-muted' }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(0), y2: plot.Y(3.3), stroke: 'var(--ink-3)', 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }),
                    s('line', { x1: plot.X(-L * Math.sin(th)), y1: plot.Y(L * Math.cos(th)), x2: plot.X(0), y2: plot.Y(0), stroke: 'var(--amber)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(L * Math.sin(th)), y2: plot.Y(L * Math.cos(th)), stroke: 'var(--amber)', 'stroke-width': 4 }),
                    s('text', { x: plot.X(-0.55), y: plot.Y(1.2), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: `${p.a}°` }),
                    s('text', { x: plot.X(0.55), y: plot.Y(1.2), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: `${p.a}°` }),
                  ];
                },
              },
            },
            {
              type: 'numeric',
              title: 'Angle to the surface',
              prompt: 'A ray hits a mirror at 25° to the mirror’s surface (not to the normal). What is its angle of reflection, measured from the normal?',
              unit: '°',
              answer: 65,
              wrong: [{ v: 25, why: r`Angles are measured from the normal, which is perpendicular to the surface: $90° - 25°$.` }],
              explain: r`The angle from the normal is $90° - 25° = 65°$. It reflects at 65° from the normal (which is 25° from the surface again).`,
            },
            {
              type: 'mcq',
              title: 'Where is the image?',
              prompt: 'You stand 2 m in front of a flat mirror. Where does your image appear to be?',
              choices: [
                { t: '2 m behind the mirror, so 4 m from you', ok: true },
                { t: 'On the surface of the mirror', why: 'Reflected rays seem to come from a point behind the mirror, as far behind it as you are in front.' },
                { t: '1 m behind the mirror', why: 'The image is as far behind the mirror as the object is in front of it.' },
              ],
              explain: r`Extend the reflected rays backwards: they meet at a point 2 m **behind** the mirror. That's a **virtual image**: light doesn't really come from there, it just looks that way. To photograph yourself in a mirror, you focus the camera 4 m away.`,
            },
            {
              type: 'numeric',
              title: 'Two mirrors at right angles',
              prompt: r`Two mirrors meet at a right angle. How many images of an object between them do you see? (Use $\frac{360°}{\theta} - 1$.)`,
              answer: 3,
              explain: r`$\frac{360}{90} - 1 = 3$ images. At $60°$ you’d see 5, the principle of the kaleidoscope. One of the three images in the corner is special: it isn’t reversed left to right.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Corner reflector',
              body: r`Two mirrors meet at a right angle. A ray hits one mirror, then the other.`,
              prompt: 'Which way does the ray end up travelling?',
              choices: [
                { t: 'Exactly back the way it came (parallel to the incoming ray)', ok: true },
                { t: 'At 90° to the incoming ray', why: r`Each bounce turns the ray, and two bounces off perpendicular mirrors turn it a full 180°.` },
                { t: 'It depends on the angle it came in at', why: 'For any incoming angle (within the corner), the two bounces send it straight back.' },
              ],
              explain: r`The first mirror flips one component of the ray's direction, and the second flips the other: $(x, y) \to (-x, -y)$, which is straight back. Apollo astronauts left arrays of corner reflectors on the Moon. Scientists still bounce lasers off them to measure the Earth–Moon distance to within millimetres.`,
            },
          ],
          recap: [
            'Angle of incidence = angle of reflection, both measured from the normal.',
            'A flat mirror makes a virtual image as far behind it as the object is in front.',
            'Corner reflectors send light straight back to where it came from.',
          ],
        },
        {
          id: 'refraction',
          title: 'Refraction',
          summary: 'Snell’s law',
          icon: 'pencil',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Bent straw',
              prompt: 'A straw in a glass of water looks broken at the water’s surface. Why?',
              choices: [
                { t: 'Light changes direction as it passes from water into air', ok: true },
                { t: 'The water magnifies the straw', why: 'There is some magnification, but the "break" comes from light bending at the surface.' },
                { t: 'The straw really bends', why: 'Pull it out: it’s perfectly straight.' },
              ],
              explain: r`Light travels more slowly in water than in air, and it **bends** as it crosses the boundary. Your brain assumes light travels in straight lines, so it places the underwater part of the straw in the wrong spot.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Into the glass',
              body: r`Light goes from air (top) into a material with refractive index $n_2$ (bottom). Change the angle and the material.`,
              widget: refraction({ angle: 45 }),
              after: r`Going into a denser material (a bigger $n$), the ray bends **toward** the normal. Head-on ($\theta_1 = 0$), it doesn't bend at all.`,
            },
            {
              type: 'explain',
              title: 'Snell’s law',
              body: r`Each material has a **refractive index**: $n = c/v$, the speed of light in a vacuum divided by its speed in the material. Air $\approx 1.00$, water $= 1.33$, glass $\approx 1.5$, diamond $= 2.42$.

The bending follows **Snell's law**:
$$n_1 \sin\theta_1 = n_2 \sin\theta_2$$

Why does slowing down cause bending? Picture a column of marching soldiers walking at an angle onto mud. The side that reaches the mud first slows down first, so the whole column swings around.`,
            },
            {
              type: 'numeric',
              title: 'Into water',
              prompt: r`Light hits water ($n = 1.33$) at 45° from the normal. What is the angle of refraction? ($\sin 45° = 0.707$)`,
              unit: '°',
              answer: Math.asin(Math.sin(45 * D) / 1.33) / D,
              tol: 0.3,
              wrong: [{ v: 45, why: 'Light bends when it enters water: it slows down.' }, { v: 70, tol: 1, why: 'Going into a denser medium bends light *toward* the normal, so the angle gets smaller.' }],
              explain: r`$\sin\theta_2 = \frac{1.00 \times 0.707}{1.33} \approx 0.532$, so $\theta_2 \approx 32.1°$. Smaller than 45°: bent toward the normal.`,
            },
            {
              type: 'numeric',
              title: 'Speed in glass',
              prompt: r`How fast does light travel in glass with $n = 1.5$? ($c = 3.0 \times 10^8$ m/s.) Give your answer in units of $10^8$ m/s.`,
              unit: r`$\times 10^8$ m/s`,
              answer: 2,
              wrong: [{ v: 4.5, why: r`$v = c/n$: divide, don't multiply.` }],
              explain: r`$v = \frac{c}{n} = \frac{3.0 \times 10^8}{1.5} = 2.0 \times 10^8$ m/s: two-thirds of its speed in a vacuum.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Spear fishing',
              prompt: 'You see a fish in a clear pond and want to spear it. Where should you aim?',
              choices: [
                { t: 'Below where the fish appears to be', ok: true },
                { t: 'Right at where it appears', why: 'Light bends at the surface, so the fish is not where it looks.' },
                { t: 'Above where it appears', why: 'Light from the fish bends away from the normal as it leaves the water, which makes the fish look *higher* than it really is.' },
              ],
              explain: r`Light from the fish bends away from the normal as it leaves the water. Traced back in a straight line, it seems to come from a point **above** the real fish. So the fish is deeper than it looks, and you should aim below it. It's also why pools look shallower than they really are.`,
            },
          ],
          recap: [
            r`Refractive index $n = c/v$: light is slower in denser materials.`,
            r`Snell's law: $n_1\sin\theta_1 = n_2\sin\theta_2$.`,
            'Entering a denser material, light bends toward the normal. Leaving it, light bends away.',
          ],
        },
        {
          id: 'tir',
          title: 'Trapped Light',
          summary: 'Total internal reflection',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Escaping glass',
              body: r`Now the light starts **inside** glass ($n = 1.5$, bottom) and tries to get out into air (top). Increase the angle.`,
              widget: refraction({ n1Top: 1, n2Bottom: 1.5, fromBelow: true, angle: 25, nParam: false }),
              after: r`Leaving the glass, the ray bends away from the normal. Beyond a certain angle, it can't get out at all. **All** the light reflects back inside: **total internal reflection**.`,
            },
            {
              type: 'explain',
              title: 'The critical angle',
              body: r`Total internal reflection begins when the refracted ray would skim along the surface, at $\theta_2 = 90°$:
$$n_1 \sin\theta_c = n_2 \sin 90° \quad\Rightarrow\quad \sin\theta_c = \frac{n_2}{n_1}$$
It only happens going from a slower material to a faster one (from a larger $n$ to a smaller $n$).`,
            },
            {
              type: 'interactive',
              title: 'Find the critical angle',
              body: r`For glass ($n = 1.5$) to air, find the **smallest** whole-degree angle at which total internal reflection happens.`,
              widget: refraction({
                n1Top: 1, n2Bottom: 1.5, fromBelow: true, angle: 30, nParam: false,
                goal: (p) => (p.a === 42 ? true : { ok: false, msg: 1.5 * Math.sin(p.a * D) > 1 ? `At ${p.a}° it’s trapped. But does it start at a smaller angle?` : `At ${p.a}° some light still escapes.` }),
                solution: { a: 42 },
              }),
              explain: r`$\sin\theta_c = \frac{1}{1.5} \approx 0.667$, so $\theta_c \approx 41.8°$. At 41° some light escapes. At 42° and above, it's all reflected.`,
            },
            {
              type: 'numeric',
              title: 'Diamonds',
              prompt: r`Diamond has $n = 2.42$. What is its critical angle (to air)?`,
              unit: '°',
              answer: Math.asin(1 / 2.42) / D,
              tol: 0.3,
              wrong: [{ v: 41.8, tol: 0.3, why: 'That’s the value for glass. Use n = 2.42.' }],
              explain: r`$\sin\theta_c = \frac{1}{2.42} \approx 0.413$, so $\theta_c \approx 24.4°$. Such a small critical angle traps light inside a well-cut diamond, bouncing it around until it escapes through the top. That's why diamonds sparkle.`,
            },
            {
              type: 'numeric',
              title: 'Trapped in water',
              prompt: r`Water has refractive index 1.33. What is its critical angle for light trying to escape into air ($\sin\theta_c = \frac1n$)? (Degrees, 1 decimal place.)`,
              unit: '°',
              answer: Math.asin(1 / 1.33) * 180 / Math.PI,
              tol: 0.1,
              explain: r`$\theta_c \approx 48.8°$. Look up from underwater and the whole sky is squeezed into a circle 97° across ("Snell’s window"); outside it you see reflections of the bottom.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Fibre optics',
              prompt: 'How do optical fibres carry light (and internet data) for kilometres, even around bends?',
              choices: [
                { t: 'The light keeps hitting the walls beyond the critical angle, so it is totally reflected again and again', ok: true },
                { t: 'The fibres are coated with mirrors', why: 'Mirrors absorb a little light at every bounce. Over thousands of bounces, the light would fade away. Total internal reflection loses almost nothing.' },
                { t: 'Light naturally follows curved glass', why: 'Light travels in straight lines. It bounces its way around bends.' },
              ],
              explain: r`Light zig-zags down the glass core, always striking the boundary at a glancing angle beyond the critical angle, so it's reflected with almost no loss. Most of the world's internet traffic travels this way, as pulses of light in fibres thinner than a hair.`,
            },
          ],
          recap: [
            'Going from a high n to a low n, light bends away from the normal.',
            r`Beyond the critical angle, $\sin\theta_c = n_2/n_1$, all the light reflects.`,
            'Total internal reflection makes diamonds sparkle and powers fibre optics.',
          ],
        },
      ],
    },
    {
      title: 'Lenses and Colour',
      summary: 'Focusing light, and splitting it apart.',
      lessons: [
        {
          id: 'lenses',
          title: 'Lenses',
          summary: 'Ray diagrams and images',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Burning point',
              prompt: 'A magnifying glass held in sunlight can focus the light to a bright dot. Why there?',
              choices: [
                { t: 'The lens bends all the parallel sunrays so they meet at one point, the focal point', ok: true },
                { t: 'The lens makes extra light', why: 'A lens only redirects light. It gathers a big area of sunlight into a small spot.' },
                { t: 'The glass gets hot', why: 'The glass stays cool. The heat comes from all the light concentrated in one spot.' },
              ],
              explain: r`A **converging** lens is thicker in the middle. Refraction at its curved surfaces bends parallel rays inward so they meet at the **focal point**, a distance $f$ (the **focal length**) from the lens.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Ray diagrams',
              body: r`Two easy rays locate any image: one travelling **parallel** to the axis (it bends through the far focal point F), and one through the **centre** of the lens (it goes straight on). Where they meet, an image forms. Move the {teal:object}.`,
              widget: lensDiagram({ dO: 6, f: 2 }),
              after: r`Far away: a small, upside-down **real** image (light really converges there, so you could catch it on a screen). Closer than F: the rays spread out, and you see an upright, bigger **virtual** image. That's a magnifying glass.`,
            },
            {
              type: 'explain',
              title: 'The thin lens equation',
              body: r`The distances obey
$$\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}$$
and the magnification is $m = -\frac{d_i}{d_o}$. A negative $m$ means the image is upside down. A negative $d_i$ means a virtual image, on the same side as the object.`,
            },
            {
              type: 'numeric',
              title: 'Where’s the image?',
              prompt: 'An object is 6 cm from a converging lens with focal length 2 cm. How far from the lens is the image?',
              unit: 'cm',
              answer: 3,
              wrong: [{ v: 4, why: r`$\frac{1}{d_i} = \frac12 - \frac16 = \frac13$, not $6 - 2$.` }, { v: 1.5, why: r`$\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o}$. Subtract, don't add.` }],
              explain: r`$\frac{1}{d_i} = \frac{1}{2} - \frac{1}{6} = \frac{3 - 1}{6} = \frac{1}{3}$, so $d_i = 3$ cm. Magnification $= -\frac36 = -0.5$: half size, upside down.`,
            },
            {
              type: 'interactive',
              title: 'Same size',
              body: r`The lens has focal length 2. Place the object so the image is the **same size** as the object (magnification $-1$).`,
              widget: lensDiagram({
                dO: 7, f: 2, fixF: true,
                goal: (p) => (p.d === 4 ? true : { ok: false, msg: p.d < 2 ? 'That gives a virtual, enlarged image.' : p.d > 4 ? 'The image is smaller than the object. Move closer.' : 'The image is bigger than the object. Move farther away.' }),
                solution: { d: 4 },
              }),
              explain: r`$m = -1$ needs $d_i = d_o$. Then $\frac{1}{f} = \frac{2}{d_o}$, so $d_o = 2f = 4$. At twice the focal length, the image is the same size, upside down, and also at $2f$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Magnifying glass',
              prompt: 'A magnifying glass has f = 10 cm. You hold it 5 cm from a stamp. What is the magnification?',
              answer: 2,
              wrong: [{ v: -2, why: r`$d_i = -10$ (virtual), so $m = -\frac{d_i}{d_o} = -\frac{-10}{5} = +2$: upright.` }, { v: 0.5, why: r`$\frac{1}{d_i} = \frac{1}{10} - \frac15 = -\frac{1}{10}$, so $d_i = -10$ cm.` }],
              explain: r`$\frac{1}{d_i} = \frac{1}{10} - \frac{1}{5} = -\frac{1}{10}$, so $d_i = -10$ cm (virtual, on the stamp's side). $m = -\frac{-10}{5} = +2$: upright and twice as big.`,
            },
          ],
          recap: [
            'Converging lenses bend parallel rays through the focal point.',
            r`$\frac1f = \frac{1}{d_o} + \frac{1}{d_i}$ and $m = -\frac{d_i}{d_o}$.`,
            'Beyond F: real, inverted image. Inside F: virtual, upright, magnified image.',
          ],
        },
        {
          id: 'color',
          title: 'Colour & the Spectrum',
          summary: 'Prisms, rainbows and blue skies',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Newton’s prism',
              prompt: 'In 1666, Isaac Newton passed sunlight through a glass prism and saw a band of rainbow colours. What did he conclude?',
              choices: [
                { t: 'White light is a mixture of all the colours', ok: true },
                { t: 'The glass added colour to the light', why: 'Newton showed this was wrong: a second prism could recombine the colours back into white light.' },
                { t: 'Sunlight is secretly red', why: 'All the colours were there, and they recombine into white.' },
              ],
              explain: r`Newton showed that white light is a **mixture** of colours, and that the prism just separates them. A second, upside-down prism merges them back into white.`,
            },
            {
              type: 'explain',
              title: 'Colour is wavelength',
              body: r`Light is a wave, and its colour is set by its **wavelength**. Visible light runs from about **700 nm (red)** down to about **400 nm (violet)**, where 1 nm is a billionth of a metre.

Glass has a slightly different refractive index for each wavelength: violet bends a little more than red. This spreading out of colours is called **dispersion**.`,
              widget: {
                kind: 'figure', w: 600, h: 230, label: 'Prism dispersing white light',
                draw: ({ s }) => {
                  const cols = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#5e35b1'];
                  const els = [s('path', { d: 'M230 200 L330 30 L430 200 Z', class: 'fl-blue-soft', stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  els.push(s('line', { x1: 40, y1: 150, x2: 282, y2: 118, stroke: 'var(--ink)', 'stroke-width': 5 }));
                  cols.forEach((c, i) => {
                    els.push(s('line', { x1: 282, y1: 118, x2: 378, y2: 122 + i * 4, stroke: c, 'stroke-width': 2.5 }));
                    els.push(s('line', { x1: 378, y1: 122 + i * 4, x2: 580, y2: 150 + i * 14, stroke: c, 'stroke-width': 4 }));
                  });
                  els.push(s('text', { x: 50, y: 136, class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'white light' }));
                  return els;
                },
              },
            },
            {
              type: 'mcq',
              title: 'Which bends most?',
              prompt: 'In a prism, which colour bends the most?',
              cols: 2,
              choices: [
                { t: 'Violet', ok: true },
                { t: 'Red', why: 'Red has the longest wavelength and bends the least.' },
                { t: 'Green', why: 'Green is in the middle. The shortest wavelengths bend most.' },
                { t: 'All the same', why: 'If they all bent equally, there would be no rainbow.' },
              ],
              explain: r`Glass has a slightly higher refractive index for shorter wavelengths, so violet bends most and red least.`,
            },
            {
              type: 'mcq',
              title: 'Rainbows',
              prompt: 'To see a rainbow, where must the Sun be?',
              choices: [
                { t: 'Behind you', ok: true },
                { t: 'In front of you, behind the rain', why: 'Raindrops send light back toward the side the Sun is on. The Sun has to be behind you.' },
                { t: 'Directly overhead', why: 'With the Sun high in the sky, the rainbow would be below the horizon. Rainbows are best in the early morning or late afternoon.' },
              ],
              explain: r`Sunlight enters a raindrop, reflects off the back, and comes out bent by about **42°** from the direction it came in, a little more or less for each colour. So the bow forms a circle 42° around the point directly opposite the Sun: the shadow of your head.`,
            },
            {
              type: 'numeric',
              title: 'Frequency of green',
              prompt: r`Green light has a wavelength of about 550 nm. What is its frequency $f = \frac{c}{\lambda}$, in units of $10^{14}$ Hz? (2 decimal places.)`,
              unit: '$\\times 10^{14}$ Hz',
              answer: 3e8 / 550e-9 / 1e14,
              tol: 0.01,
              explain: r`$\frac{3 \times 10^8}{550 \times 10^{-9}} \approx 5.45 \times 10^{14}$ Hz: over half a million billion oscillations a second.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why is the sky blue?',
              prompt: 'Air molecules scatter short wavelengths far more strongly than long ones. What does that explain?',
              choices: [
                { t: 'Blue skies by day, and red sunsets', ok: true },
                { t: 'Only red sunsets', why: 'It explains the blue sky too: scattered blue light reaches your eyes from every direction overhead.' },
                { t: 'Why clouds are white', why: 'Clouds are white because water droplets are large and scatter all colours equally. That’s a different effect.' },
              ],
              explain: r`This **Rayleigh scattering** grows as $1/\lambda^4$, so blue light (around 450 nm) is scattered about 6 times more than red (around 700 nm). Scattered blue light fills the sky. At sunset, sunlight crosses much more air, so most of the blue is scattered out of the beam before it reaches you, leaving reds and oranges. (Violet is scattered even more, but sunlight has less of it, and our eyes are less sensitive to it.)`,
            },
          ],
          recap: [
            'White light is a mix of colours. Colour corresponds to wavelength (from about 400 to 700 nm).',
            'Dispersion: violet bends more than red, which makes prisms and rainbows.',
            'Rayleigh scattering (proportional to 1/λ⁴) makes the sky blue and sunsets red.',
          ],
        },
      ],
    },
    {
      title: 'Mirrors and Polarisation',
      summary: 'Curved reflections and the direction of light’s wiggle.',
      lessons: [
        {
          id: 'mirrors',
          title: 'Curved Mirrors',
          summary: 'Concave and convex',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Focusing by reflection',
              body: r`A **concave** mirror (curved inwards, like a spoon's bowl) reflects parallel rays to a focal point $F$, halfway between the mirror and its centre of curvature: $f = \frac{R}{2}$. A **convex** mirror (curved outwards) spreads rays out, as if from a focal point behind it.

Curved mirrors obey the same equation as lenses: $\frac{1}{d_o} + \frac{1}{d_i} = \frac{1}{f}$, with magnification $m = -\frac{d_i}{d_o}$.`,
            },
            {
              type: 'numeric',
              title: 'Focal length',
              prompt: r`A concave mirror has a radius of curvature of 40 cm. What's its focal length?`,
              unit: 'cm',
              answer: 20,
              wrong: [{ v: 40, why: 'The focal point is halfway to the centre of curvature: f = R/2.' }, { v: 80, why: 'Halve the radius, don’t double it.' }],
              explain: r`$f = \frac{40}{2} = 20$ cm.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A shaving mirror',
              prompt: r`This concave mirror has focal length 2. Move the object (teal) to find where it gives an **upright image twice as big**, like a shaving or make-up mirror.`,
              widget: mirrorDiagram(),
              explain: r`At $d_o = 1$ (half the focal length), $\frac{1}{d_i} = \frac12 - 1 = -\frac12$, so $d_i = -2$: a virtual image behind the mirror, with $m = -\frac{-2}{1} = 2$. Move further than $F$ and the image flips upside down: try it with a spoon!`,
            },
            {
              type: 'mcq',
              title: 'Headlights and dishes',
              prompt: r`A car headlight has a bulb at the focal point of a concave mirror. What does the mirror do?`,
              choices: [
                { t: 'It sends the light out as a nearly parallel beam', ok: true },
                { t: 'It focuses the light to a point in front of the car', why: 'Light from the focal point reflects parallel: the reverse of focusing.' },
                { t: 'It spreads the light in all directions', why: 'That’s what a convex mirror would do.' },
              ],
              explain: r`Rays are reversible: parallel rays focus at $F$, so rays from $F$ leave parallel. Satellite dishes, solar furnaces and reflecting telescopes use the same geometry the other way round, collecting parallel waves into a point.`,
            },
            {
              type: 'numeric',
              title: 'A security mirror',
              prompt: r`A convex shop mirror has focal length $-0.5$ m. A customer stands 2 m away. Using $\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o}$ and $m = -\frac{d_i}{d_o}$, what's the magnification? (1 decimal place.)`,
              answer: 0.2,
              tol: 0.01,
              wrong: [{ v: -0.2, tol: 0.01, why: 'Convex mirrors make upright images: m is positive.' }, { v: 4, why: 'Convex mirrors make things look smaller.' }],
              explain: r`$\frac{1}{d_i} = -2 - 0.5 = -2.5$, so $d_i = -0.4$ m, and $m = -\frac{-0.4}{2} = 0.2$: an upright image one-fifth the size. Convex mirrors trade size for a wide field of view.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Closer than they appear',
              prompt: r`Passenger-side car mirrors often carry the warning "objects in mirror are closer than they appear". Why?`,
              choices: [
                { t: 'They’re convex: images are shrunk, so cars look smaller and therefore further away than they are', ok: true },
                { t: 'They’re concave, magnifying everything', why: 'A concave mirror would make cars look bigger and closer.' },
                { t: 'The glass slows light down', why: 'The effect is from the mirror’s curve, not the glass.' },
              ],
              explain: r`Your brain judges distance partly by apparent size. The convex mirror gives a wide view of the next lane, but at the cost of making cars look further away, hence the legally required warning in the US.`,
            },
          ],
          recap: [
            r`Concave mirrors focus at $f = R/2$; convex mirrors spread light.`,
            r`Mirror equation: $\frac1{d_o} + \frac1{d_i} = \frac1f$, magnification $-\frac{d_i}{d_o}$.`,
            'Inside f a concave mirror magnifies; convex mirrors always shrink.',
          ],
        },
        {
          id: 'polarisation',
          title: 'Polarisation',
          summary: 'The direction of the wiggle',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Which way does light wave?',
              body: r`Light is a transverse wave: its electric field wiggles **across** the direction of travel. Ordinary light from the Sun or a bulb is **unpolarised**, a jumble of all wiggle directions. A **polarising filter** lets through only the part of the wave wiggling along its axis.

After one filter, the light is **polarised**: it wiggles in a single direction.`,
            },
            {
              type: 'numeric',
              title: 'The first filter',
              prompt: r`Unpolarised light passes through one polarising filter. What percentage of its intensity gets through (ideal filter)?`,
              unit: '%',
              answer: 50,
              wrong: [{ v: 100, why: 'Only the component along the filter’s axis passes.' }, { v: 0, why: 'Half of the jumbled directions, on average, get through.' }],
              explain: r`On average, half: the filter keeps one component of each randomly oriented wiggle, and $\cos^2$ averages to $\frac12$ over all angles.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Malus’s law',
              prompt: r`Polarised light meets a second filter turned at angle $\theta$ to the first. The fraction transmitted is $\cos^2\theta$ (Malus's law). Turn the second filter so only **25%** gets through.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.2, xmax: 3.2, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 480,
                params: { th: { min: 0, max: 90, step: 1, value: 20, label: 'angle θ', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const a = (p.th * Math.PI) / 180, u = plot.X(1) - plot.X(0), els = [];
                  els.push(s('circle', { cx: plot.X(-1.6), cy: plot.Y(0), r: 1.2 * u, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  els.push(s('line', { x1: plot.X(-1.6), y1: plot.Y(-1.1), x2: plot.X(-1.6), y2: plot.Y(1.1), stroke: 'var(--blue)', 'stroke-width': 4 }));
                  els.push(s('circle', { cx: plot.X(1.6), cy: plot.Y(0), r: 1.2 * u, class: 'fl-amber', opacity: 0.15 + 0.6 * malus(p.th), stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  els.push(s('line', { x1: plot.X(1.6 - 1.1 * Math.sin(a)), y1: plot.Y(-1.1 * Math.cos(a)), x2: plot.X(1.6 + 1.1 * Math.sin(a)), y2: plot.Y(1.1 * Math.cos(a)), stroke: 'var(--violet)', 'stroke-width': 4 }));
                  els.push(s('text', { x: plot.X(-1.6), y: plot.Y(-1.4), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'first filter' }));
                  els.push(s('text', { x: plot.X(1.6), y: plot.Y(-1.4), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'second filter' }));
                  return els;
                },
                readout: (p) => r`$\cos^2 ${p.th}° = ${malus(p.th).toFixed(3)}$: $${(100 * malus(p.th)).toFixed(1)}\%$ transmitted`,
                goal: (p) => Math.abs(malus(p.th) - 0.25) < 0.005,
                hint: r`You need $\cos\theta = \frac12$.`,
                solution: { th: 60 },
              },
              explain: r`$\cos 60° = \frac12$, so $\cos^2 60° = \frac14$. At 90° the filters are "crossed" and block everything. Rotating one lens of a pair of polarising sunglasses in front of the other shows this beautifully.`,
            },
            {
              type: 'mcq',
              title: 'Cutting glare',
              prompt: r`Light reflected off water or a road is partly polarised **horizontally**. How are polarising sunglasses designed to cut this glare?`,
              choices: [
                { t: 'Their filters have vertical axes, blocking the horizontally polarised reflection', ok: true },
                { t: 'Their filters have horizontal axes', why: 'That would pass the glare and block other light.' },
                { t: 'They darken all light equally', why: 'That’s ordinary tinted glasses; polarisers selectively block the reflected glare.' },
              ],
              explain: r`Anglers use them to see into water, and photographers use polarising filters to darken skies and remove reflections. Tilt your head while wearing them near a lake and the glare comes back.`,
            },
            {
              type: 'numeric',
              title: 'Brewster’s angle',
              prompt: r`At **Brewster's angle**, $\tan\theta_B = n$, reflected light is completely polarised. For water ($n = 1.33$), what is it? (1 decimal place.)`,
              unit: '°',
              answer: (Math.atan(1.33) * 180) / Math.PI,
              tol: 0.06,
              wrong: [{ v: (Math.atan(1 / 1.33) * 180) / Math.PI, tol: 0.06, why: r`$\tan\theta_B = n$, not $1/n$.` }],
              explain: r`$\tan^{-1} 1.33 \approx 53.1°$ from the vertical (the normal). Sunlight reflecting off a lake at this angle (Sun about 37° above the horizon) is almost perfectly polarised, which polarising sunglasses block completely.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three filters',
              prompt: r`Two crossed polarisers (at 0° and 90°) block all light. Now slip a third filter at 45° **between** them. What fraction of the original unpolarised light gets through? (3 decimal places.)`,
              answer: 0.125,
              tol: 0.001,
              wrong: [{ v: 0, why: 'Surprisingly, adding a filter lets light through: the middle filter rotates the polarisation.' }, { v: 0.25, why: r`Start with $\frac12$ from the first filter, then $\cos^2 45°$ twice.` }],
              explain: r`$\frac12 \times \cos^2 45° \times \cos^2 45° = \frac12 \times \frac12 \times \frac12 = \frac18$. Adding a filter **increases** the light! Each filter re-polarises the light along its own axis, a hint of how measurement works in quantum mechanics.`,
            },
          ],
          recap: [
            'Polarising filters pass only light wiggling along their axis; unpolarised light loses half.',
            r`Malus's law: transmitted fraction $\cos^2\theta$.`,
            r`Reflections are polarised, completely at Brewster's angle $\tan\theta_B = n$.`,
          ],
        },
      ],
    },
  ],
};
