import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f1 = (v) => fix(v, 1);
const f2 = (v) => fix(v, 2);
const vec = (plot, arrow, x0, y0, x1, y1, color, w = 4) => arrow(plot.X(x0), plot.Y(y0), plot.X(x1), plot.Y(y1), { color: `var(--${color})`, width: w, head: 13 });

// ball on a string: remembers when the string was cut
let release = null;
const whirl = {
  kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -4.6, ymax: 4.6, grid: 1, axes: false, maxWidth: 560,
  animate: { param: 't', speed: 1, autoplay: true },
  params: {
    t: { min: 0, max: 1e9, step: 0.001, value: 0, slider: false },
    r: { min: 1.5, max: 4, step: 0.5, value: 3, label: 'radius', color: 'teal', format: (v) => `${f1(v)} m` },
    v: { min: 1, max: 6, step: 0.5, value: 3, label: 'speed', color: 'blue', format: (v) => `${f1(v)} m/s` },
    cut: { min: 0, max: 1, step: 1, value: 0, label: 'string', color: 'coral', format: (v) => (v ? 'cut!' : 'attached') },
  },
  extra: ({ plot, p, s, arrow }) => {
    const pos = (t) => {
      const a = (p.v * t) / p.r;
      return [p.r * Math.cos(a), p.r * Math.sin(a), -Math.sin(a), Math.cos(a)];
    };
    if (!p.cut) release = null;
    else if (release == null || p.t < release) release = p.t;
    const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(p.r) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 6' })];
    els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' }));
    if (release == null) {
      const [x, y, tx, ty] = pos(p.t);
      const a = (p.v * p.v) / p.r;
      els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(y), stroke: 'var(--ink)', 'stroke-width': 2 }));
      els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 11, class: 'fl-ink', stroke: 'var(--card)', 'stroke-width': 3 }));
      els.push(vec(plot, arrow, x, y, x + 0.6 * p.v * tx, y + 0.6 * p.v * ty, 'blue'));
      const la = Math.min(0.4 * a, p.r * 0.85);
      els.push(vec(plot, arrow, x, y, x - (la * x) / p.r, y - (la * y) / p.r, 'coral'));
    } else {
      const [x0, y0, tx, ty] = pos(release);
      const d = p.v * (p.t - release);
      const x = x0 + d * tx, y = y0 + d * ty;
      els.push(s('line', { x1: plot.X(x0), y1: plot.Y(y0), x2: plot.X(x), y2: plot.Y(y), stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '4 6' }));
      els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 11, class: 'fl-ink', stroke: 'var(--card)', 'stroke-width': 3 }));
      els.push(vec(plot, arrow, x, y, x + 0.6 * p.v * tx, y + 0.6 * p.v * ty, 'blue'));
    }
    return els;
  },
  readout: (p) => (p.cut ? r`String cut: no more inward force, so the ball flies off in a **straight line**.` : r`$\blue{v = ${f1(p.v)}}$ m/s, $\;\coral{a = \dfrac{v^2}{r} = ${f2((p.v * p.v) / p.r)}}$ m/s² toward the centre`),
};

// loop-the-loop: car inside a vertical loop of radius R
const RL = 10;
const loop = {
  kind: 'graph', equal: true, xmin: -15, xmax: 15, ymin: -2, ymax: 23, grid: false, axes: false, maxWidth: 520,
  params: {
    vb: { min: 10, max: 30, step: 0.5, value: 18, label: 'speed at bottom', color: 'blue', format: (v) => `${f1(v)} m/s` },
    phi: { min: 0, max: 360, step: 5, value: 0, label: 'position', color: 'violet', format: (v) => `${v}°` },
  },
  extra: ({ plot, p, s, arrow }) => {
    const cy = RL;
    const els = [s('circle', { cx: plot.X(0), cy: plot.Y(cy), r: plot.X(RL) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 6 })];
    els.push(s('line', { x1: plot.X(-15), x2: plot.X(15), y1: plot.Y(0) + 3, y2: plot.Y(0) + 3, stroke: 'var(--ink)', 'stroke-width': 6 }));
    const a = (p.phi * Math.PI) / 180;
    // angle measured from the bottom, counterclockwise
    const x = RL * Math.sin(a), y = cy - RL * Math.cos(a);
    const v2 = p.vb * p.vb - 2 * G * y;
    const N = v2 < 0 ? -1 : v2 / RL + G * Math.cos(a);
    const fell = loopFails(p.vb, p.phi);
    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 12, class: fell ? 'fl-coral' : 'fl-ink', stroke: 'var(--card)', 'stroke-width': 3 }));
    if (!fell) {
      const L = Math.min(9, 0.45 * N);
      if (L > 0.3) els.push(vec(plot, arrow, x, y, x - (L * x) / RL, y + (L * (cy - y)) / RL, 'teal'));
      els.push(vec(plot, arrow, x, y, x, y - 0.45 * G, 'coral'));
    }
    return els;
  },
  readout: (p) => {
    if (loopFails(p.vb, p.phi)) return r`The car **loses contact** with the track before reaching here and falls!`;
    const a = (p.phi * Math.PI) / 180;
    const h = RL * (1 - Math.cos(a));
    const v2 = p.vb * p.vb - 2 * G * h;
    const N = v2 / RL + G * Math.cos(a);
    return r`speed here: $${f1(Math.sqrt(v2))}$ m/s, $\;$ $\teal{\text{normal force}} = ${f2(N / G)}\times$ weight $\;$ ($\coral{\text{gravity}}$ is 1×)`;
  },
  goal: (p) => !loopFails(p.vb, 180),
  hint: r`At the top, gravity alone must not be more than the inward force needed: $v_{\text{top}}^2 \geq gR$.`,
  solution: { vb: 22.5 },
};
// does the car lose contact somewhere between the bottom and angle phi?
function loopFails(vb, phi) {
  for (let d = 0; d <= Math.min(phi, 360); d += 1) {
    const a = (d * Math.PI) / 180;
    const v2 = vb * vb - 2 * G * RL * (1 - Math.cos(a));
    if (v2 < 0 || v2 / RL + G * Math.cos(a) < -1e-9) return true;
  }
  return false;
}

// centrifuge: g-force at radius r (m) for rpm
const gForce = (rpm, rad) => ((rpm * 2 * Math.PI / 60) ** 2 * rad) / G;
// conical pendulum (string 1 m): angle from vertical for period T
const conicalAngle = (T) => { const c = (G * T * T) / (4 * Math.PI * Math.PI * 1); return c >= 1 ? 0 : Math.acos(c) * 180 / Math.PI; };

export default {
  id: 'circular',
  subject: 'physics',
  title: 'Circular Motion',
  level: 'Intermediate',
  cover: 'circular',
  tagline: 'Centripetal force, banked curves, loop-the-loops, artificial gravity, centrifuges and fairground rides.',
  description: r`Why do you lurch sideways on a sharp bend? What keeps a roller coaster on the track upside down? How could a spinning space station create gravity? Discover the inward acceleration behind all circular motion, and the everyday forces that provide it, from centrifuges to swinging chairs.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Going Round',
      summary: 'Acceleration toward the centre.',
      lessons: [
        {
          id: 'uniform',
          title: 'Moving in Circles',
          summary: 'Constant speed, changing velocity',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'Is it accelerating?',
              prompt: r`A ball whirls around on a string at a **constant speed**. Is it accelerating?`,
              choices: [
                { t: 'Yes: its direction keeps changing', ok: true },
                { t: 'No: its speed is constant', why: 'Acceleration is any change in velocity, and velocity includes direction.' },
                { t: 'Only when it speeds up', why: 'Changing direction is also a change in velocity, so it counts as acceleration.' },
              ],
              explain: r`Velocity is a vector: it has a size (speed) **and** a direction. Going round a circle, the direction changes constantly, so the velocity changes, so the ball **is** accelerating, even at constant speed.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Which way is the acceleration?',
              body: r`The $\blue{\text{blue}}$ arrow is the velocity, always **tangent** to the circle. The $\coral{\text{coral}}$ arrow is the acceleration. Change the speed and radius, then try cutting the string.`,
              widget: whirl,
              after: r`The acceleration points straight at the **centre**: it's called **centripetal** ("centre-seeking") acceleration. When the string is cut, nothing pulls the ball inward any more, so by Newton's first law it continues in a **straight line** along the tangent.`,
            },
            {
              type: 'mcq',
              title: 'Released',
              prompt: r`A hammer thrower spins and lets go when the hammer is moving due north. Which way does the hammer fly?`,
              choices: [
                { t: 'Due north, in a straight line (then falls)', ok: true },
                { t: 'Outward from the centre of the spin', why: 'There’s no outward force on the hammer. It keeps the velocity it had at release: due north.' },
                { t: 'Along a curved path, continuing the circle', why: 'Without the inward pull, nothing curves its path sideways.' },
              ],
              explain: r`At the moment of release, the hammer keeps its velocity: due north, tangent to the circle. Throwers time their release so that this tangent points down the field.`,
            },
            {
              type: 'explain',
              title: 'How big is the acceleration?',
              body: r`For an object moving at speed $v$ around a circle of radius $r$:
$$a = \frac{v^2}{r}$$
directed toward the centre. Going faster increases it a lot (it depends on $v^2$), and tighter turns (smaller $r$) increase it too. By Newton's second law, something must supply an inward force:
$$F = \frac{mv^2}{r}$$`,
            },
            {
              type: 'numeric',
              title: 'The hammer throw',
              prompt: r`Just before release, a hammer thrower's hammer moves at 25 m/s around a circle of radius 2 m. What is its centripetal acceleration, in m/s²?`,
              unit: 'm/s²',
              answer: 312.5,
              tol: 0.5,
              wrong: [{ v: 12.5, why: r`Square the speed: $a = \frac{v^2}{r} = \frac{25^2}{2}$.` }],
              explain: r`$a = \frac{v^2}{r} = \frac{625}{2} = 312.5$ m/s², about 32 times $g$. The thrower leans far back so their weight helps supply the huge inward pull on the wire.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A roundabout',
              prompt: r`A car drives around a roundabout of radius 20 m at 10 m/s. What is its centripetal acceleration?`,
              unit: 'm/s²',
              answer: 5,
              wrong: [{ v: 0.5, why: r`$a = v^2 / r$: square the speed first. $100 / 20$.` }, { v: 2000, why: r`Divide by $r$: $\frac{10^2}{20}$.` }, { v: 200, why: r`That's $v \times r$. Use $v^2 / r$.` }],
              explain: r`$a = \dfrac{v^2}{r} = \dfrac{10^2}{20} = 5$ m/s², about half of $g$.`,
            },
          ],
          recap: [
            'Moving in a circle means accelerating, even at constant speed.',
            r`Centripetal acceleration points to the centre: $a = v^2/r$.`,
            'Remove the inward force and the object moves off along the tangent.',
          ],
        },
        {
          id: 'periods',
          title: 'Periods & Angular Speed',
          summary: 'Revolutions per second',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Describing a spin',
              body: r`The **period** $T$ is the time for one full turn. In that time, the object travels the circumference $2\pi r$, so
$$v = \frac{2\pi r}{T}$$
The **angular speed** $\omega$ (omega) is how fast the angle changes, in radians per second: $\omega = \dfrac{2\pi}{T}$, so $v = \omega r$ and
$$a = \frac{v^2}{r} = \omega^2 r$$`,
            },
            {
              type: 'numeric',
              title: 'A merry-go-round',
              prompt: r`A child sits 2 m from the centre of a merry-go-round that turns once every 4 s. What is the child's speed? (2 decimal places.)`,
              unit: 'm/s',
              answer: Math.PI,
              tol: 0.01,
              wrong: [{ v: 0.5, why: r`That's $2/4$. In one period the child travels the whole circumference, $2\pi r$.` }, { v: 1.57, tol: 0.01, why: r`The circumference is $2\pi r = 4\pi$ m, not $\pi r$.` }],
              explain: r`$v = \dfrac{2\pi r}{T} = \dfrac{2\pi \times 2}{4} = \pi \approx 3.14$ m/s.`,
            },
            {
              type: 'mcq',
              title: 'Outside lane',
              prompt: r`Two children ride the same merry-go-round, one at 1 m from the centre and one at 3 m. How do their accelerations compare?`,
              cols: 2,
              choices: [
                { t: 'The outer child’s is 3 times larger', ok: true },
                { t: 'The same', why: r`They share the same $\omega$, but $a = \omega^2 r$ grows with $r$.` },
                { t: 'The outer child’s is 9 times larger', why: r`It would be 9× if the **speed** tripled at the same radius. Here $\omega$ is the same, so $a = \omega^2 r$ is 3×.` },
                { t: 'The inner child’s is larger', why: r`A tighter circle at the **same speed** would mean more acceleration, but here the outer child moves faster.` },
              ],
              explain: r`Both turn at the same angular speed $\omega$. With $a = \omega^2 r$, tripling $r$ triples the acceleration. (The outer child also moves 3× faster.) That's why the outside of a merry-go-round is the scariest place to hold on.`,
            },
            {
              type: 'numeric',
              title: 'A spinning record',
              prompt: r`A vinyl LP turns at $33\tfrac13$ revolutions per minute. What is its angular speed in radians per second? (2 decimal places.)`,
              unit: 'rad/s',
              answer: 33.3333 * 2 * Math.PI / 60,
              tol: 0.01,
              wrong: [{ v: 200, tol: 1, why: r`Convert minutes to seconds and revolutions to radians: × 2π ÷ 60.` }],
              explain: r`$33\tfrac13 \times \frac{2\pi}{60} \approx 3.49$ rad/s. The outer edge (15 cm out) moves at about 0.52 m/s, the inner grooves much slower, so the music near the centre is squeezed into less groove and loses quality.`,
            },
            {
              type: 'interactive',
              title: 'Same spin, different speeds',
              body: r`Two children ride a merry-go-round, one 1.5 m from the centre and one at the edge, 4 m out. Both go round once per period $T$, so both have the same angular speed, but the outer child covers more ground. Set the period so that the **outer** child moves at **2 m/s**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5.5, xmax: 5.5, ymin: -5, ymax: 5, grid: false, axes: false, maxWidth: 380,
                params: { T: { min: 4, max: 30, step: 0.01, value: 8, label: 'period', color: 'coral', format: (v) => `${v.toFixed(2)} s` } },
                extra: ({ plot, p, s, arrow }) => { const w = (2 * Math.PI) / p.T, k = 1.2, out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(4) - plot.X(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(4), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' })]; for (const [r, c] of [[1.5, 'teal'], [4, 'violet']]) out.push(arrow(plot.X(r), plot.Y(0), plot.X(r), plot.Y(k * w * r), { color: `var(--${c})`, width: 3 }), s('circle', { cx: plot.X(r), cy: plot.Y(0), r: 9, class: `fl-${c}` })); return out; },
                readout: (p) => { const w = (2 * Math.PI) / p.T; return `ω = ${w.toFixed(3)} rad/s · inner ${(w * 1.5).toFixed(2)} m/s · outer **${(w * 4).toFixed(2)} m/s**`; },
                goal: (p) => Math.abs((2 * Math.PI * 4) / p.T - 2) < 0.01,
                hint: 'v = 2πr / T, so T = 2π × 4 / 2.',
                solution: { T: 12.57 },
              },
              explain: r`$T = \frac{2\pi \times 4}{2} \approx 12.6$ s, an angular speed of $0.5$ rad/s. The inner child then moves at only $0.75$ m/s. Speed is $v = \omega r$: same $\omega$, so speed grows in proportion to the distance from the centre.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Spinning Earth',
              prompt: r`The Earth turns once a day ($T = 86{,}400$ s), and its radius is 6,400 km. What is the centripetal acceleration of a person on the equator? (3 significant figures.)`,
              unit: 'm/s²',
              answer: 0.0338,
              tol: 0.0004,
              wrong: [{ v: 465, tol: 3, why: r`That's the **speed**, about 465 m/s. The acceleration is $v^2/r$.` }, { v: 9.8, why: 'That’s gravity. The acceleration from Earth’s spin is much smaller.' }],
              explain: r`$v = \dfrac{2\pi \times 6.4 \times 10^6}{86{,}400} \approx 465$ m/s, so $a = \dfrac{465^2}{6.4 \times 10^6} \approx 0.034$ m/s², about 0.3% of $g$. So you weigh very slightly less at the equator than at the poles.`,
            },
          ],
          recap: [
            r`$v = 2\pi r / T$ and $\omega = 2\pi / T$, so $v = \omega r$.`,
            r`$a = v^2/r = \omega^2 r$.`,
            'On a spinning object, points farther out move faster and accelerate more.',
          ],
        },
      ],
    },
    {
      title: 'Forces in Circles',
      summary: 'What does the pulling?',
      lessons: [
        {
          id: 'curves',
          title: 'Taking Corners',
          summary: 'Friction and banked curves',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Not a new force',
              body: r`"Centripetal force" isn't a new kind of force. It's a **job** that some real force has to do:

- A ball on a string: **tension** pulls it inward.
- The Moon orbiting Earth: **gravity**.
- A car on a flat bend: **friction** between the tyres and the road.

If that force can't provide $\dfrac{mv^2}{r}$, the object can't follow the circle.`,
            },
            {
              type: 'numeric',
              title: 'Maximum cornering speed',
              prompt: r`On a flat road, friction can provide at most $\mu mg$, where $\mu = 0.8$ for dry asphalt. Setting $\mu m g = \dfrac{mv^2}{r}$, what is the fastest a car can take a bend of radius 50 m? (Use $g = 9.8$ m/s².)`,
              unit: 'm/s',
              answer: Math.sqrt(0.8 * 9.8 * 50),
              tol: 0.15,
              wrong: [{ v: 392, why: r`That's $v^2$. Take the square root.` }, { v: 22.1, tol: 0.15, why: r`Don't forget $\mu$: $v = \sqrt{\mu g r} = \sqrt{0.8 \times 9.8 \times 50}$.` }],
              explain: r`The mass cancels: $v = \sqrt{\mu g r} = \sqrt{0.8 \times 9.8 \times 50} = \sqrt{392} \approx 19.8$ m/s (about 71 km/h). On ice, $\mu$ might be 0.1, and the safe speed drops to about 7 m/s.`,
            },
            {
              type: 'mcq',
              title: 'Heavier cars',
              prompt: r`A heavy truck and a light car take the same flat bend. Ignoring other effects, which has the higher maximum safe speed?`,
              cols: 3,
              choices: [
                { t: 'They’re the same', ok: true },
                { t: 'The truck', why: r`More weight means more friction, but it also needs more inward force. The mass cancels.` },
                { t: 'The car', why: r`The car needs less inward force, but it also gets less friction. The mass cancels.` },
              ],
              explain: r`Friction $\mu mg$ and the required force $\dfrac{mv^2}{r}$ both grow in proportion to $m$, so $v_{\max} = \sqrt{\mu g r}$ doesn't depend on mass. (Real trucks are worse at corners for other reasons, such as a high centre of mass that makes them tip.)`,
            },
            {
              type: 'explain',
              title: 'Banked curves',
              body: r`Racetracks and motorway ramps are **banked**: tilted inward. Then the road's normal force leans toward the centre and does some of the turning, without relying on friction. With no friction at all, the ideal bank angle satisfies
$$\tan\theta = \frac{v^2}{rg}$$`,
            },
            {
              type: 'interactive',
              title: 'Rain on the bend',
              body: r`On a bend of radius 50 m, the friction needed is $\mu = \frac{v^2}{gr}$. Wet asphalt only offers about $\mu = 0.4$. Find the **fastest** safe speed in the wet.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 120, ymin: 0, ymax: 1.2, grid: false, height: 260, axes: { xlabel: 'speed (km/h)', ylabel: 'friction needed μ', xticks: 20, yticks: 0.2 },
                params: { v: { min: 10, max: 120, step: 0.5, value: 80, label: 'speed', color: 'coral', format: (v) => `${v.toFixed(1)} km/h` } },
                curves: [{ f: (x) => (x / 3.6) ** 2 / (9.8 * 50), color: 'violet', width: 3 }, { f: () => 0.8, color: 'teal', dash: true }, { f: () => 0.4, color: 'blue', dash: true }, { f: () => 0.1, color: 'muted', dash: true }],
                points: [{ x: (p) => p.v, y: (p) => (p.v / 3.6) ** 2 / (9.8 * 50), color: 'coral' }],
                readout: (p) => { const mu = (p.v / 3.6) ** 2 / (9.8 * 50); return `needs μ = **${mu.toFixed(3)}** · dry 0.8 ${mu <= 0.8 ? '✓' : '✗'} · wet 0.4 ${mu <= 0.4 ? '✓' : '✗'} · ice 0.1 ${mu <= 0.1 ? '✓' : '✗'}`; },
                goal: (p) => Math.abs((p.v / 3.6) ** 2 / (9.8 * 50) - 0.4) < 0.008,
                hint: 'v = √(μgr) = √(0.4 × 9.8 × 50) m/s; multiply by 3.6 for km/h.',
                solution: { v: 50.5 },
              },
              explain: r`$v = \sqrt{0.4 \times 9.8 \times 50} = 14$ m/s, about **50 km/h**, compared with 71 km/h in the dry. Because $\mu$ needed grows with $v^2$, halving the grip only cuts the safe speed by a factor $\sqrt2$. On ice ($\mu \approx 0.1$) it drops to 25 km/h.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Design a bank',
              prompt: r`A track has radius 100 m. At what bank angle can cars take it at 30 m/s with **no** friction needed? (Use $g = 9.8$ m/s².)`,
              unit: '°',
              answer: (Math.atan(900 / 980) * 180) / Math.PI,
              tol: 0.3,
              wrong: [{ v: 0.92, tol: 0.02, why: r`That's $\tan\theta$. Now find $\theta$: $\tan^{-1}(0.918)$.` }, { v: 1.7, tol: 0.2, why: r`$\tan\theta = \frac{v^2}{rg}$: square the speed. $\frac{900}{980}$.` }],
              explain: r`$\tan\theta = \dfrac{30^2}{100 \times 9.8} = \dfrac{900}{980} \approx 0.918$, so $\theta \approx 42.6°$. Velodromes for track cycling are banked as steeply as about 45° on the turns.`,
            },
          ],
          recap: [
            'Centripetal force is a role played by tension, gravity, friction or a normal force.',
            r`Flat bend: $v_{\max} = \sqrt{\mu g r}$, independent of mass.`,
            r`Frictionless banked curve: $\tan\theta = v^2/(rg)$.`,
          ],
        },
        {
          id: 'loops',
          title: 'Loops & g-Forces',
          summary: 'Upside down without falling',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'At the top and bottom',
              body: r`In a vertical loop, two forces act on a rider: gravity $mg$ (always down) and the track's normal force $N$ (pushing toward the centre).

- **At the bottom**, the centre is above: $N - mg = \dfrac{mv^2}{r}$, so $N = m\left(g + \dfrac{v^2}{r}\right)$. You feel **heavier**.
- **At the top**, the centre is below: $N + mg = \dfrac{mv^2}{r}$, so $N = m\left(\dfrac{v^2}{r} - g\right)$. You feel **lighter**.

The normal force is what you feel as your weight.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make it round the loop',
              prompt: r`A frictionless car enters a loop of radius 10 m. Find a speed at the bottom that is just enough to get round the **top** without falling. Use the position slider to watch the forces all the way round.`,
              widget: loop,
              explain: r`At the top, the track must push down (or at least not pull), so $N \geq 0$, which needs $v_{\text{top}}^2 \geq gr$. Energy conservation adds the climb of $2r$: $v_{\text{bottom}}^2 = v_{\text{top}}^2 + 2g(2r) \geq 5gr$. So $v_{\text{bottom}} \geq \sqrt{5 \times 9.8 \times 10} \approx 22.1$ m/s.`,
            },
            {
              type: 'numeric',
              title: 'Feeling heavy',
              prompt: r`At the bottom of the loop, a rider moves at 20 m/s and the radius is 10 m. How many times their normal weight do they feel? (Use $g = 9.8$ m/s².)`,
              unit: '× weight',
              answer: 1 + 400 / 98,
              tol: 0.05,
              wrong: [{ v: 4.08, tol: 0.05, why: r`That's just $\frac{v^2}{rg}$. At the bottom, gravity adds 1: $N = m(g + v^2/r)$.` }, { v: 3.08, tol: 0.05, why: r`At the **bottom** you add $g$; at the top you'd subtract it.` }],
              explain: r`$\dfrac{N}{mg} = 1 + \dfrac{v^2}{rg} = 1 + \dfrac{400}{98} \approx 5.1$: a "5 g" moment. Real roller-coaster loops are teardrop-shaped (tighter at the top, wider at the bottom) to keep these forces comfortable.`,
            },
            {
              type: 'mcq',
              title: 'Teardrop loops',
              prompt: r`Modern roller-coaster loops aren’t circles: they’re taller than they are wide, with a tight curve at the top. Why?`,
              choices: [
                { t: r`A tight top lets the train go round slowly without falling, while the gentle bottom curve avoids crushing g-forces`, ok: true },
                { t: r`They are cheaper to build`, why: r`The shape is chosen for the riders’ bodies, not the cost.` },
                { t: r`Circles are impossible to build`, why: r`Early coasters did use circular loops, and they gave riders whiplash.` },
              ],
              explain: r`In a circle, a train fast enough to stay on the track at the top hits the bottom at about 6 g. A **clothoid** loop, with radius shrinking toward the top, keeps the needed speed at the top low and the forces at the bottom gentle: about 3–4 g at most.`,
            },
            {
              type: 'numeric',
              title: 'Heavy at the bottom',
              prompt: r`A car enters a vertical circular loop with just enough speed to get round. At the bottom, its speed is $\sqrt{5gr}$. The riders feel $1 + \frac{v^2}{gr}$ times their weight there. How many g is that?`,
              answer: 6,
              explain: r`$1 + 5 = 6$ g, too much for comfort. That’s one reason real roller-coaster loops are teardrop-shaped, with a tighter curve at the top and gentler curves at the bottom.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How high to start?',
              prompt: r`A frictionless coaster starts from rest on a hill and then enters a loop of radius 10 m. What is the minimum starting height (above the bottom of the loop) to get round safely?`,
              unit: 'm',
              answer: 25,
              wrong: [{ v: 20, why: r`Reaching the top (height $2r = 20$ m) isn't enough: the car must still be moving at $\sqrt{gr}$ there.` }, { v: 22.1, tol: 0.2, why: 'That’s the minimum speed at the bottom in m/s. Convert it to a height with energy conservation.' }],
              explain: r`At the top you need $v^2 = gr$. Energy conservation from the start: $mgh = mg(2r) + \tfrac12 m(gr)$, so $h = 2r + \tfrac12 r = 2.5r = 25$ m. This is a classic result.`,
            },
          ],
          recap: [
            r`Bottom of a loop: $N = m(g + v^2/r)$. You feel heavier.`,
            r`Top: $N = m(v^2/r - g)$. You feel lighter, and need $v^2 \geq gr$.`,
            r`A frictionless loop needs a start at least $2.5r$ high.`,
          ],
        },
        {
          id: 'artificial-gravity',
          title: 'Artificial Gravity',
          summary: 'Spinning space stations',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Spin to weigh',
              body: r`In a spinning ring-shaped space station, the floor is the outer wall. It pushes astronauts toward the centre, providing their centripetal force. To the astronauts, that push feels exactly like standing on a floor under gravity.

To feel Earth-normal weight, the floor must accelerate them at $g$:
$$\omega^2 r = g \quad\Rightarrow\quad \omega = \sqrt{g/r}$$`,
            },
            { /*anim:circular*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Dropping a ball in a space station',
              body: r`An astronaut stands on the floor of a spinning ring and lets go of a ball held at chest height. **Left:** seen from outside, by someone not spinning. **Right:** seen by the astronaut, who spins with the station.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 3.55, ymin: -1.15, ymax: 1.15, grid: false, axes: false,
                animate: { param: 't', speed: 0.5, max: 1.6, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const tHit = Math.sqrt(1 - 0.49) / 0.7, t = Math.min(p.t, tHit), els = [];
                  const ball = (tt) => [0.7 * Math.min(tt, tHit), -0.7]; // straight line in the outside view
                  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
                  [[0, true], [2.4, false]].forEach(([cx, outside]) => {
                    const turn = outside ? p.t : 0, X = ([x, y]) => [plot.X(cx + x), plot.Y(y)];
                    els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4 }));
                    for (let k = 0; k < 8; k++) { const [x1, y1] = X(rot([0.95, 0], turn + (k * Math.PI) / 4)), [x2, y2] = X(rot([1.05, 0], turn + (k * Math.PI) / 4)); els.push(s('line', { x1, y1, x2, y2, stroke: 'var(--ink-3)', 'stroke-width': 3 })); }
                    // the astronaut stands on the floor at the bottom of the ring (and turns with it)
                    const feet = rot([0, -1], turn), head = rot([0, -0.62], turn), [fx, fy] = X(feet), [hx, hy] = X(head);
                    els.push(s('line', { x1: fx, y1: fy, x2: hx, y2: hy, stroke: 'var(--teal)', 'stroke-width': 7, 'stroke-linecap': 'round' }));
                    // the ball's path so far
                    const pts = [];
                    for (let i = 0; i <= 40; i++) { const tt = (t * i) / 40; pts.push(X(outside ? ball(tt) : rot(ball(tt), -tt))); }
                    els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
                    // once it lands, the ball rides round with the floor
                    const [bx, by] = outside && p.t > tHit ? X(rot(ball(tHit), p.t - tHit)) : pts[pts.length - 1];
                    els.push(s('circle', { cx: bx, cy: by, r: 7, class: 'fl-coral' }));
                    els.push(s('text', { x: plot.X(cx), y: plot.Y(0) + 5, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--ink-3)', text: outside ? 'outside view' : 'astronaut’s view' }));
                  });
                  return els;
                },
                readout: (p) => (p.t < Math.sqrt(1 - 0.49) / 0.7 ? 'the ball is falling…' : 'landed: **behind** the astronaut’s feet'),
              },
              after: r`From outside, nothing pulls on the ball at all: once released, it just keeps the sideways speed it had and flies in a **straight line**, while the floor swings round to meet it. The astronaut sees the same event as the ball "falling", but curving backwards to land behind their feet, because their feet, further from the centre, were moving faster than the ball. In a spinning station "gravity" is only the floor pushing you round in a circle.`,
            },
            {
              type: 'numeric',
              title: 'Design a station',
              prompt: r`A ring station has radius 100 m. How long should one rotation take so astronauts on the rim feel $g = 9.8$ m/s²? (Nearest second.)`,
              unit: 's',
              answer: 2 * Math.PI * Math.sqrt(100 / 9.8),
              tol: 0.6,
              wrong: [{ v: 0.31, tol: 0.02, why: r`That's $\omega$ in rad/s. The period is $T = 2\pi/\omega$.` }, { v: 3.2, tol: 0.1, why: r`That's $\sqrt{r/g}$. Multiply by $2\pi$ to get the period.` }],
              explain: r`$\omega = \sqrt{9.8/100} \approx 0.313$ rad/s, so $T = \dfrac{2\pi}{\omega} \approx 20$ s: about 3 rotations per minute.`,
            },
            {
              type: 'mcq',
              title: 'Head and feet',
              prompt: r`In a small spinning station (radius 5 m), what does an astronaut standing on the rim notice?`,
              choices: [
                { t: 'Their feet feel noticeably heavier than their head', ok: true },
                { t: 'Nothing unusual', why: r`With a small radius, $a = \omega^2 r$ changes a lot over the height of a person.` },
                { t: 'Their head feels heavier than their feet', why: r`The head is closer to the centre (smaller $r$), so it has the **smaller** acceleration.` },
              ],
              explain: r`With $a = \omega^2 r$, a head 1.8 m closer to the centre (at 3.2 m instead of 5 m) gets only about 64% of the "gravity" at the feet. Small, fast-spinning stations also cause dizziness when you turn your head. That's why designs favour large radii and slow spins.`,
            },
            {
              type: 'numeric',
              title: 'A comfortable spin',
              prompt: r`Most people get dizzy in a spinning room turning faster than about 2 revolutions per minute ($\omega \approx 0.209$ rad/s). A station of radius 100 m spins at 2 rpm. What acceleration does its rim give, as a fraction of $g = 9.8$ m/s²? (2 decimal places.)`,
              answer: (0.2094 ** 2 * 100) / 9.8,
              tol: 0.01,
              wrong: [{ v: 0.21, tol: 0.01, why: r`That's $\omega r / g$. The acceleration is $\omega^2 r$: square $\omega$ first.` }],
              explain: r`$\omega^2 r = 0.0439 \times 100 \approx 4.4$ m/s², about **0.45 g**: less than half Earth's gravity. At a comfortable spin rate, full gravity needs a much bigger wheel, as the next screen shows.`,
            },
            {
              type: 'interactive',
              title: 'A gentle spin',
              body: r`Most people get dizzy if a station spins faster than about **2 revolutions per minute**. At 2 rpm, find the radius that gives a full $g = 9.8$ m/s² at the rim, using $a = \omega^2 r$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -420, xmax: 420, ymin: -420, ymax: 420, grid: false, axes: false, maxWidth: 340,
                params: { r: { min: 20, max: 400, step: 1, value: 80, label: 'radius', color: 'violet', format: (v) => `${v} m` } },
                extra: ({ plot, p, s }) => { const out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(p.r) - plot.X(0), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 10, opacity: 0.6 })]; for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + 0.4; out.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(p.r * Math.cos(a)), y2: plot.Y(p.r * Math.sin(a)), stroke: 'var(--ink-3)', 'stroke-width': 2 })); } out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 10, class: 'fl-amber' })); return out; },
                readout: (p) => { const w = (2 * 2 * Math.PI) / 60, a = w * w * p.r; return `ω = ${w.toFixed(3)} rad/s · rim gravity **${a.toFixed(2)} m/s² = ${(a / 9.8).toFixed(3)} g** · at head height (2 m in): ${((100 * (p.r - 2)) / p.r).toFixed(1)}% of feet`; },
                goal: (p) => { const w = (4 * Math.PI) / 60; return Math.abs((w * w * p.r) / 9.8 - 1) < 0.003; },
                hint: 'r = g / ω², with ω = 2 × 2π / 60 rad/s.',
                solution: { r: 223 },
              },
              explain: r`$\omega = 0.209$ rad/s, so $r = 9.8 / 0.209^2 \approx 223$ m, a ring nearly half a kilometre across. A big radius also keeps the difference between head and feet small (under 1% here), which a small, fast-spinning station cannot do.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Centrifugal force?',
              prompt: r`In a car turning sharply left, you feel pushed to the right, against the door. What is really happening?`,
              choices: [
                { t: 'Your body tends to go straight; the car turns left under you until the door pushes you inward', ok: true },
                { t: 'A real outward “centrifugal” force pushes you right', why: 'Nothing is pushing you outward. Seen from outside the car, you just keep going straight until the door pushes you along the curve.' },
                { t: 'The seat belt pulls you right', why: 'The seat belt and door pull or push you to the left, toward the centre of the turn.' },
              ],
              explain: r`From outside, the only horizontal force on you points **inward**: the door pushing you round the curve. The "centrifugal force" is a **fictitious force** that appears only when you describe motion from inside the turning car, a rotating frame of reference. It's a useful bookkeeping trick, but not a real push.`,
            },
          ],
          recap: [
            r`A rotating station gives artificial gravity $a = \omega^2 r$.`,
            'Large radii and slow spins feel most natural.',
            'Centrifugal force is fictitious: it appears only in a rotating frame.',
          ],
        },
      ],
    },
    {
      title: 'Spinning Machines',
      summary: 'Centrifuges, swings and rotors.',
      lessons: [
        {
          id: 'centrifuge',
          title: 'Centrifuges',
          summary: 'Thousands of g in a lab',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Sorting by spinning',
              body: r`A **centrifuge** spins samples at high speed. To keep moving in a circle, everything in the tube needs a large inward force, provided by the liquid around it. Denser particles need more force than the liquid can give at their position, so they drift **outwards** and pile up at the bottom of the tube.

The strength is quoted as a multiple of gravity, the **relative centrifugal force**:
$$\text{RCF} = \frac{\omega^2 r}{g}$$`,
            },
            {
              type: 'numeric',
              title: 'A salad spinner',
              prompt: r`A salad spinner's basket (radius 0.12 m) turns 10 times per second ($\omega = 20\pi$ rad/s). How many g does the lettuce feel? (Nearest whole number.)`,
              unit: 'g',
              answer: Math.round(((20 * Math.PI) ** 2 * 0.12) / G),
              tol: 1,
              wrong: [{ v: Math.round((20 * Math.PI * 0.12) / G), tol: 1, why: r`Square $\omega$: the acceleration is $\omega^2 r$.` }],
              explain: r`$\frac{(20\pi)^2 \times 0.12}{9.8} \approx 48$ g. The basket's walls push the lettuce round, but water droplets slip through the holes and fly off in straight lines.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A thousand g',
              prompt: r`A lab centrifuge holds tubes 10 cm from the axis. Set the speed (in revolutions per minute) so the samples feel **1,000 g**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6000, ymin: 0, ymax: 4000, grid: 1000, gridY: 500, height: 260, padL: 52, axes: { xlabel: 'rpm', ylabel: 'g-force' },
                params: { rpm: { min: 500, max: 6000, step: 10, value: 1500, slider: false } },
                curves: [{ f: (x) => gForce(x, 0.1), color: 'violet', width: 3 }, { f: () => 1000, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.rpm, y: (p) => gForce(p.rpm, 0.1), drag: { x: 'rpm' }, color: 'teal' }],
                readout: (p) => r`${p.rpm} rpm: $\omega = ${(p.rpm * 2 * Math.PI / 60).toFixed(0)}$ rad/s, RCF $= ${gForce(p.rpm, 0.1).toFixed(0)}$ g`,
                goal: (p) => Math.abs(gForce(p.rpm, 0.1) - 1000) < 5,
                hint: r`You need $\omega = \sqrt{1000 \times 9.8 / 0.1} \approx 313$ rad/s.`,
                solution: { rpm: 2990 },
              },
              explain: r`About **2,990 rpm**. Because the g-force grows as $\omega^2$, doubling the speed quadruples it: ultracentrifuges reach over 100,000 rpm and a million g, enough to separate individual molecules by mass.`,
            },
            {
              type: 'numeric',
              title: 'A spin cycle',
              prompt: r`A washing machine drum of radius 0.25 m spins at 1,200 rpm. What g-force do the clothes feel? (Nearest 10 g.)`,
              unit: 'g',
              answer: Math.round(gForce(1200, 0.25) / 10) * 10,
              tol: 10,
              wrong: [{ v: Math.round((1200 * 0.25) / G), tol: 2, why: 'Convert rpm to rad/s and square it.' }],
              explain: r`$\omega = \frac{1200 \times 2\pi}{60} \approx 126$ rad/s, so RCF $= \frac{126^2 \times 0.25}{9.8} \approx 400$ g. Water is flung out through the drum's holes; the drum walls hold the clothes in.`,
            },
            {
              type: 'numeric',
              title: 'A lab centrifuge',
              prompt: r`A centrifuge spins at 10,000 rpm with samples 10 cm from the axis. Its relative centrifugal force is $\frac{\omega^2r}{g}$. How many g is that? (Nearest hundred.)`,
              unit: 'g',
              answer: (2 * Math.PI * 10000 / 60) ** 2 * 0.1 / 9.81,
              tol: 60,
              explain: r`$\omega \approx 1047$ rad/s, so $\frac{1047^2 \times 0.1}{9.81} \approx 11{,}200$ g. Ultracentrifuges reach over a million g, enough to sort molecules by mass.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Separating blood',
              prompt: r`Spun in a centrifuge, blood separates into a layer of red cells at the bottom, pale plasma at the top, and a thin layer of white cells between. Why do the red cells end up at the bottom?`,
              choices: [
                { t: 'They’re densest: the surrounding fluid can’t supply enough inward force to keep them on their circle, so they drift outwards', ok: true },
                { t: 'They’re the smallest', why: 'Size affects how fast they move, but density decides the direction.' },
                { t: 'They’re pulled down by gravity', why: 'In a centrifuge, gravity is negligible compared with the spinning effect: hundreds or thousands of g.' },
              ],
              explain: r`It's like sedimentation in a jar, but thousands of times faster. Uranium enrichment uses the same principle with gas centrifuges, separating uranium hexafluoride molecules that differ in mass by less than 1%.`,
            },
          ],
          recap: [
            r`Relative centrifugal force $= \omega^2 r / g$.`,
            'Doubling the spin speed quadruples the g-force.',
            'Denser particles move outwards, separating mixtures.',
          ],
        },
        {
          id: 'conical',
          title: 'Swings & Rotors',
          summary: 'Conical pendulums and fairground rides',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'The conical pendulum',
              body: r`Whirl a ball on a string in a horizontal circle and the string traces out a cone. Two forces act: the **tension** along the string and the **weight** downwards. The tension's vertical part balances the weight; its horizontal part provides the centripetal force:
$$T\cos\theta = mg, \qquad T\sin\theta = m\omega^2 r$$
Dividing gives $\tan\theta = \frac{\omega^2 r}{g}$: spin faster, and the string swings out further.`,
            },
            {
              type: 'mcq',
              title: 'Heavier riders',
              prompt: r`On a chair-swing ride, does a heavy adult's chair swing out to a different angle from a light child's chair at the same speed?`,
              choices: [
                { t: 'No: the mass cancels, so the angle depends only on speed and geometry', ok: true },
                { t: 'Yes, the heavy chair swings out further', why: 'More mass needs more centripetal force, but it also has more weight to balance: they cancel.' },
                { t: 'Yes, the heavy chair hangs lower', why: 'Mass cancels from both equations.' },
              ],
              explain: r`In $\tan\theta = \frac{\omega^2 r}{g}$ there's no mass. All the chairs on the ride fan out together, just as all objects fall at the same rate.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Sixty degrees',
              prompt: r`A ball whirls on a 1 m string. Adjust the time for one revolution so the string makes **60°** with the vertical.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.3, ymax: 0.25, grid: false, axes: false, maxWidth: 420,
                params: { T: { min: 1, max: 2, step: 0.01, value: 1.8, label: 'period', color: 'violet', format: (v) => `${v.toFixed(2)} s` } },
                extra: ({ plot, p, s }) => {
                  const th = conicalAngle(p.T) * Math.PI / 180, rr = Math.sin(th), h = Math.cos(th);
                  return [
                    s('line', { x1: plot.X(-0.4), x2: plot.X(0.4), y1: plot.Y(0.1), y2: plot.Y(0.1), stroke: 'var(--ink)', 'stroke-width': 4 }),
                    s('ellipse', { cx: plot.X(0), cy: plot.Y(-h), rx: plot.X(rr) - plot.X(0), ry: (plot.X(rr) - plot.X(0)) * 0.25, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0.1), x2: plot.X(0), y2: plot.Y(-1.2), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0.1), x2: plot.X(rr), y2: plot.Y(-h), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
                    s('circle', { cx: plot.X(rr), cy: plot.Y(-h), r: 11, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => r`period ${p.T.toFixed(2)} s: string at $${conicalAngle(p.T).toFixed(1)}°$ from vertical`,
                goal: (p) => Math.abs(conicalAngle(p.T) - 60) < 0.5,
                hint: r`For a conical pendulum, $T = 2\pi\sqrt{\frac{L\cos\theta}{g}}$.`,
                solution: { T: 1.42 },
              },
              explain: r`$T = 2\pi\sqrt{\frac{1 \times \cos 60°}{9.8}} \approx 1.42$ s. Remarkably, the period depends only on the **height** of the cone, $L\cos\theta$, not on the length of string or the mass.`,
            },
            {
              type: 'numeric',
              title: 'Tension',
              prompt: r`At 60°, how many times the ball's weight is the tension in the string? ($T\cos\theta = mg$.)`,
              unit: '×',
              answer: 2,
              wrong: [{ v: 0.5, why: r`$T = \frac{mg}{\cos 60°}$: dividing by ½ doubles it.` }],
              explain: r`$T = \frac{mg}{\cos 60°} = 2mg$. At steeper angles the tension soars: at 80° it's nearly 6 times the weight, so whirling something nearly horizontally takes a strong string.`,
            },
            {
              type: 'explain',
              title: 'The rotor ride',
              body: r`In the fairground **rotor**, riders stand against the wall of a spinning drum; then the floor drops away, and they stay stuck to the wall. The wall pushes inwards (the normal force $N = m\omega^2 r$, providing the centripetal force), and **friction** $\mu N$ holds riders up against their weight. They stay put as long as
$$\mu m \omega^2 r \ge mg$$`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Safe speed',
              prompt: r`A rotor has radius 2.5 m, and the wall's friction coefficient with clothing is 0.4. What's the minimum angular speed for riders to stay up when the floor drops? (2 decimal places, rad/s.)`,
              unit: 'rad/s',
              answer: Math.sqrt(G / (0.4 * 2.5)),
              tol: 0.01,
              wrong: [{ v: G / (0.4 * 2.5), tol: 0.02, why: 'Take the square root: ω² = g/(μr).' }],
              explain: r`$\omega \ge \sqrt{\frac{g}{\mu r}} = \sqrt{\frac{9.8}{1}} \approx 3.13$ rad/s, about one turn every 2 seconds. Mass cancels again, so every rider sticks equally well.`,
            },
          ],
          recap: [
            r`Conical pendulum: $\tan\theta = \omega^2 r / g$, independent of mass.`,
            r`Its period $2\pi\sqrt{L\cos\theta/g}$ depends only on the cone's height.`,
            r`Rotor rides need $\mu\omega^2 r \ge g$.`,
          ],
        },
      ],
    },
  ],
};
