import { fix } from '../lib/svg.js';

const r = String.raw;
const M = 0.2, ARM = 0.05, I = 1e-4, G = 9.8; // toy gyroscope
const omegaP = (w) => (M * G * ARM) / (I * w); // precession rate (rad/s)

const leanDeg = (v, rad) => (Math.atan((v * v) / (9.8 * rad)) * 180) / Math.PI;
// reaction wheel: satellite I = 500 kg·m², wheel I = 0.05 kg·m²; satellite turn (degrees) in 60 s for a wheel speed in rpm
const satTurn = (rpm) => (((0.05 * rpm * 2 * Math.PI) / 60 / 500) * 60 * 180) / Math.PI;

export default {
  id: 'gyroscopes',
  subject: 'physics',
  title: 'Spinning Tops & Gyroscopes',
  level: 'Advanced',
  cover: 'gyroscopes',
  tagline: 'Why spinning things refuse to fall, how Earth’s axis wobbles, how bikes balance and spacecraft turn.',
  description: r`A spinning top seems to defy gravity, slowly circling instead of toppling. Learn to treat angular momentum as a vector, discover why torque makes spinning objects precess, see how the Earth's axis traces a circle every 26,000 years, meet the strange instability of rotation about an object's middle axis, and see how bicycles, spacecraft and phones put spin to work.`,
  prereq: 'Rotation & Torque',
  chapters: [
    {
      title: 'Precession',
      summary: 'Torque turns, rather than topples.',
      lessons: [
        {
          id: 'vector',
          title: 'Spin Has a Direction',
          summary: 'Angular momentum as a vector',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'The right-hand rule',
              body: r`Angular momentum isn't just a number: it points along the axis of rotation. Curl the fingers of your right hand in the direction of spin, and your thumb points along the angular momentum $\mathbf L = I\boldsymbol\omega$.

Just as a force changes momentum ($\mathbf F = \frac{d\mathbf p}{dt}$), a torque changes angular momentum:
$$\boldsymbol\tau = \frac{d\mathbf L}{dt}$$
Crucially, the change happens in the direction of the **torque**, which need not be the direction of $\mathbf L$.`,
            },
            {
              type: 'mcq',
              title: 'Spinning wheel in your hands',
              prompt: r`Hold a bicycle wheel by its axle while it spins fast, then try to tilt the axle. What do you feel?`,
              choices: [
                { t: 'It resists, and twists sideways in an unexpected direction', ok: true },
                { t: 'It tilts as easily as when it’s not spinning', why: 'A fast-spinning wheel has large angular momentum. Changing its direction takes a large torque, and the response comes out sideways.' },
                { t: 'It speeds up', why: 'Tilting doesn’t change the spin rate. It changes the direction of the angular momentum.' },
              ],
              explain: r`Changing the direction of a large angular momentum needs a large torque, and the axle swings at right angles to the way you push. That sideways response is the heart of every gyroscope. (Try it standing on a swivel chair: tilting the wheel sets you spinning, because total angular momentum is conserved.)`,
            },
            {
              type: 'numeric',
              title: 'How much spin?',
              prompt: r`A bicycle wheel has moment of inertia $0.1$ kg·m² and spins at 50 rad/s. What is the size of its angular momentum, in kg·m²/s?`,
              unit: 'kg·m²/s',
              answer: 5,
              wrong: [{ v: 500, why: r`$L = I\omega = 0.1 \times 50$.` }, { v: 125, why: r`That's like $\frac12 I\omega^2$, the energy. Angular momentum is $I\omega$.` }],
              explain: r`$L = I\omega = 0.1 \times 50 = 5$ kg·m²/s, pointing along the axle by the right-hand rule.`,
            },
            {
              type: 'numeric',
              title: 'Turning the axle',
              prompt: r`That wheel ($L = 5$ kg·m²/s along the axle) is turned so its axle points $90°$ away, in 0.5 s. The change in $\mathbf L$ is a vector from the old arrow to the new one, of length $5\sqrt2$. What average torque does that take, in N·m? (1 decimal place.)`,
              unit: 'N·m',
              answer: 5 * Math.SQRT2 / 0.5,
              tol: 0.1,
              wrong: [{ v: 0, why: r`The size of $\mathbf L$ is unchanged, but its direction changes, and that is a change in the vector.` }, { v: 10, tol: 0.1, why: r`The change isn't $5$: subtracting two perpendicular arrows of length 5 gives an arrow of length $5\sqrt2$.` }],
              explain: r`$\tau = \frac{|\Delta \mathbf L|}{\Delta t} = \frac{5\sqrt2}{0.5} \approx 14.1$ N·m, like holding a 2 kg bag at arm's length, even though the wheel never speeds up or slows down. Just changing the direction of a big angular momentum takes a big torque.`,
            },
            {
              type: 'interactive',
              title: 'Point the arrow',
              body: r`A bicycle wheel (2 kg, radius 0.3 m, so $I = \tfrac12 mr^2 = 0.09$ kg·m²) faces you. Spinning **anticlockwise** as you see it, its angular momentum points **out of the screen** (⊙); clockwise, into it (⊗). Set the spin to give $L = +5$ kg·m²/s, out of the screen.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 300,
                params: { rpm: { min: -1000, max: 1000, step: 1, value: -200, label: 'spin (+ = anticlockwise)', color: 'violet', format: (v) => `${v} rpm` } },
                extra: ({ plot, p, s }) => { const out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 8 })]; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; out.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(Math.cos(a)), y2: plot.Y(Math.sin(a)), stroke: 'var(--ink-3)', 'stroke-width': 1.2 })); } if (p.rpm !== 0) { const dir = Math.sign(p.rpm), a0 = 0.3, a1 = 2.4, r = 1.18, pts = Array.from({ length: 30 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / 29; return [r * Math.cos(dir > 0 ? a : -a), r * Math.sin(dir > 0 ? a : -a)]; }); out.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 })); const [xe, ye] = pts[29], [xp, yp] = pts[26]; out.push(s('circle', { cx: plot.X(xe), cy: plot.Y(ye), r: 7, class: 'fl-coral' })); out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 22, class: 'fl-card', stroke: 'var(--violet)', 'stroke-width': 3 })); out.push(dir > 0 ? s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-violet' }) : s('path', { d: `M${plot.X(-0.11)} ${plot.Y(-0.11)} L${plot.X(0.11)} ${plot.Y(0.11)} M${plot.X(-0.11)} ${plot.Y(0.11)} L${plot.X(0.11)} ${plot.Y(-0.11)}`, stroke: 'var(--violet)', 'stroke-width': 4 })); } return out; },
                readout: (p) => { const w = (p.rpm * 2 * Math.PI) / 60; return `ω = ${w.toFixed(1)} rad/s · L = Iω = **${(0.09 * w).toFixed(2)} kg·m²/s** ${p.rpm > 0 ? '(out of the screen ⊙)' : p.rpm < 0 ? '(into the screen ⊗)' : ''}`; },
                goal: (p) => Math.abs((0.09 * p.rpm * 2 * Math.PI) / 60 - 5) < 0.05,
                hint: 'ω = L / I = 5 / 0.09 rad/s; convert to rpm with × 60 / 2π.',
                solution: { rpm: 531 },
              },
              explain: r`$\omega = 5/0.09 \approx 55.6$ rad/s, about **530 rpm** anticlockwise. Reversing the spin flips the arrow: angular momentum is a vector, and its direction (given by the right-hand rule) is what a gyroscope holds fixed.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Flip the wheel',
              body: r`You sit on a swivel chair holding that spinning wheel with its axle vertical, angular momentum 5 kg·m²/s pointing **up**. You turn the wheel upside down, so its angular momentum points **down**.`,
              prompt: r`How much angular momentum do you and the chair gain (pointing up), in kg·m²/s?`,
              unit: 'kg·m²/s',
              answer: 10,
              wrong: [{ v: 5, why: 'The wheel’s angular momentum changes from +5 to −5: a change of 10, which you must make up.' }, { v: 0, why: 'Total angular momentum must stay +5 (up). The wheel now has −5, so you need +10.' }],
              explain: r`The total must stay $+5$ (no outside torque about the vertical). The wheel now has $-5$, so you and the chair must have $+10$: you start turning in the direction the wheel used to spin. This classic demonstration (often done in physics lectures) shows that angular momentum is a conserved **vector**.`,
            },
          ],
          recap: [
            'Angular momentum points along the spin axis (right-hand rule).',
            r`Torque changes angular momentum: $\boldsymbol\tau = d\mathbf L/dt$.`,
            'The change is in the direction of the torque, often sideways to the spin.',
          ],
        },
        {
          id: 'precession',
          title: 'Defying Gravity',
          summary: 'Why tops precess',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Sideways, not down',
              body: r`A gyroscope's axle rests on a pivot at one end, sticking out horizontally. Gravity pulls the spinning disc down, creating a torque $\tau = mgr$ about the pivot. But that torque points **horizontally**, at right angles to the axle. So instead of falling, the angular momentum swings sideways: the axle sweeps around the pivot in a horizontal circle. This is **precession**, at a rate
$$\Omega = \frac{\tau}{L} = \frac{mgr}{I\omega}$$`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Spin faster',
              body: r`A toy gyroscope (mass 0.2 kg, centre 5 cm from the pivot, $I = 10^{-4}$ kg·m²) precesses around its pivot, seen from slightly above. Change the spin rate.`,
              widget: {
                kind: 'graph', xmin: -1.6, xmax: 1.6, ymin: -1, ymax: 1.1, grid: false, axes: false, equal: true, maxWidth: 520,
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  t: { min: 0, max: 1e9, step: 0.001, value: 0, slider: false },
                  w: { min: 100, max: 600, step: 50, value: 200, label: 'spin rate', color: 'violet', format: (v) => `${v} rad/s` },
                },
                extra: ({ plot, p, s }) => {
                  const phi = omegaP(p.w) * p.t, R = 1.1;
                  const tip = [R * Math.cos(phi), 0.32 * R * Math.sin(phi)];
                  const front = Math.sin(phi) < 0;
                  const disc = s('ellipse', { cx: plot.X(tip[0]), cy: plot.Y(tip[1]), rx: Math.max(6, Math.abs(Math.sin(phi)) * 42), ry: 44, class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 3 });
                  const axle = s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(tip[0]), y2: plot.Y(tip[1]), stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' });
                  return [
                    s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: plot.X(R) - plot.X(0), ry: (plot.X(R) - plot.X(0)) * 0.32, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(-0.9), stroke: 'var(--ink-3)', 'stroke-width': 5 }),
                    ...(front ? [axle, disc] : [disc, axle]),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-ink' }),
                  ];
                },
                readout: (p) => r`precession rate $\Omega = \frac{mgr}{I\omega} = ${omegaP(p.w).toFixed(2)}$ rad/s: one lap every ${((2 * Math.PI) / omegaP(p.w)).toFixed(1)} s`,
              },
              after: r`The faster the spin, the **slower** the precession: a bigger $L$ needs longer to be swung around by the same torque. As friction slows a top's spin, its precession speeds up and it wobbles more and more, until it finally falls.`,
            },
            {
              type: 'numeric',
              title: 'Compute the precession',
              prompt: r`The toy gyroscope above spins at 400 rad/s. Find its precession rate $\Omega = \frac{mgr}{I\omega}$ in rad/s. ($m = 0.2$ kg, $g = 9.8$ m/s², $r = 0.05$ m, $I = 10^{-4}$ kg·m².) (2 decimal places.)`,
              unit: 'rad/s',
              answer: omegaP(400),
              tol: 0.006,
              wrong: [{ v: omegaP(200), tol: 0.006, why: 'That’s at 200 rad/s. At 400 rad/s the precession is half as fast.' }, { v: M * G * ARM, tol: 0.001, why: r`That's the torque $mgr$. Divide by $L = I\omega$.` }],
              explain: r`$\Omega = \frac{0.2 \times 9.8 \times 0.05}{10^{-4} \times 400} = \frac{0.098}{0.04} \approx 2.45$ rad/s: one lap about every 2.6 s.`,
            },
            {
              type: 'numeric',
              title: 'How fast it precesses',
              prompt: r`A gyroscope with angular momentum 2 kg·m²/s feels a gravitational torque of 0.5 N·m. Its precession rate is $\Omega = \tau / L$. What is it, in rad/s?`,
              unit: 'rad/s',
              answer: 0.25,
              tol: 0.005,
              wrong: [{ v: 4, why: r`Divide the torque by the angular momentum.` }],
              explain: r`$\frac{0.5}{2} = 0.25$ rad/s, one full circle every 25 seconds. Spin it twice as fast and it precesses half as fast, which is why a fast top seems to defy gravity.`,
            },
            {
              type: 'mcq',
              title: 'The extra wobble',
              prompt: r`Release a spinning gyroscope with its axis tilted, and besides slow precession it shows a small, fast nodding motion that dies away. What is it called?`,
              choices: [
                { t: r`Nutation`, ok: true },
                { t: r`Precession`, why: r`Precession is the slow circling of the axis; the fast nodding on top is different.` },
                { t: r`Resonance`, why: r`It isn’t driven by anything; it’s a natural wobble of the released top.` },
              ],
              explain: r`Nutation appears because the top must first start moving sideways before smooth precession takes over; friction usually damps it quickly. Earth nutates too, by about 9 arcseconds, driven by the Moon’s 18.6-year orbital cycle.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Reverse the spin',
              prompt: 'If the gyroscope spins the opposite way (same speed), what happens to its precession?',
              choices: [
                { t: 'It precesses at the same rate but in the opposite direction', ok: true },
                { t: 'It falls over immediately', why: 'It still has the same size of angular momentum, so it still precesses rather than falls.' },
                { t: 'Nothing changes', why: 'The angular momentum now points the other way along the axle, so the torque swings it round the other way.' },
              ],
              explain: r`Gravity's torque is unchanged, but $\mathbf L$ now points the other way along the axle. The change $d\mathbf L = \boldsymbol\tau\,dt$ is in the same direction as before, which now swings the axle round the opposite way. The size of the rate, $\frac{mgr}{I\omega}$, is the same.`,
            },
          ],
          recap: [
            'Gravity’s torque on a spinning gyroscope swings it sideways: precession.',
            r`Precession rate $\Omega = mgr/(I\omega)$.`,
            'Faster spin means slower precession.',
          ],
        },
      ],
    },
    {
      title: 'Spin in the World',
      summary: 'Planets, spacecraft and a strange flip.',
      lessons: [
        {
          id: 'earth',
          title: 'Earth’s Wobble',
          summary: 'The precession of the equinoxes',
          icon: 'moon',
          steps: [
            {
              type: 'explain',
              title: 'A spinning top the size of a planet',
              body: r`The Earth spins, and its spin makes it bulge at the equator. Its axis is tilted by $23.4°$, so the Sun's and Moon's gravity pull unevenly on the bulge, trying to straighten the tilt. Like a top, the Earth responds by precessing: its axis traces a cone, completing one circle in about **26,000 years**.

The Greek astronomer Hipparchus noticed the effect around 130 BC, by comparing his star positions with records made over a century earlier.`,
            },
            {
              type: 'numeric',
              title: 'How fast?',
              prompt: r`If the axis completes one full circle ($360°$) in 25,800 years, how many **arcseconds** does it turn per year? ($1° = 3600$ arcseconds; nearest whole number.)`,
              unit: '″/year',
              answer: Math.round((360 * 3600) / 25800),
              tol: 0.6,
              wrong: [{ v: 0.014, tol: 0.001, why: 'That’s in degrees. Multiply by 3600 to get arcseconds.' }],
              explain: r`$\frac{360 \times 3600}{25{,}800} \approx 50$ arcseconds per year: tiny, but it adds up to about $1.4°$ per century, enough that ancient star charts and astrological signs have drifted out of step with the constellations.`,
            },
            {
              type: 'numeric',
              title: 'Drifting zodiac',
              prompt: r`The zodiac signs were fixed about 2000 years ago. Precession shifts the Sun's position against the stars by one full sign ($30°$) in how many years, if a full circle takes 25,800 years? (Nearest hundred.)`,
              unit: 'years',
              answer: 25800 / 12,
              tol: 50,
              wrong: [{ v: 25800 / 30, tol: 50, why: 'One sign is 30° out of 360°, a twelfth of the circle.' }],
              explain: r`$\frac{25{,}800}{12} \approx 2150$ years per sign. That's why, today, on your "star sign" birthday the Sun is actually in front of the **previous** constellation. Astronomers measure star positions against a slowly shifting reference for the same reason.`,
            },
            {
              type: 'mcq',
              title: 'Precession and ice ages',
              prompt: r`Today Earth is closest to the Sun in early January, during the northern winter. In about 13,000 years precession will flip this. Why might that matter for climate?`,
              choices: [
                { t: 'Northern summers would come when Earth is closest to the Sun, making them hotter and winters colder', ok: true },
                { t: 'It wouldn’t matter: Earth’s orbit is a perfect circle', why: 'The orbit is slightly elliptical, so the Earth–Sun distance changes by about 3% through the year.' },
                { t: 'The seasons would stop', why: 'Seasons come from the tilt, which stays. Precession changes which season coincides with the closest approach.' },
              ],
              explain: r`Precession changes which season falls at the closest approach to the Sun. Together with slow changes in the tilt and the orbit's shape, these **Milankovitch cycles** alter how sunlight is spread over the seasons, and they line up remarkably well with the rhythm of the ice ages over the past million years.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Pole stars through the ages',
              body: r`Earth’s axis sweeps round a circle in the sky once every 25,800 years. Slide through time and see which star sits near the north celestial pole. (Star positions are approximate.)`,
              widget: {
                kind: 'graph', equal: true, xmin: -34, xmax: 34, ymin: -34, ymax: 34, grid: false, axes: false, maxWidth: 380,
                params: { yr: { min: -3000, max: 23000, step: 100, value: 2000, label: 'year', color: 'violet', format: (v) => (v < 0 ? `${-v} BC` : `AD ${v}`) } },
                extra: ({ plot, p, s }) => { const ph = (y) => (2 * Math.PI * (y - 2100)) / 25800 + Math.PI / 2, S = [['Polaris', 2100, 0], ['Errai', 4000, 1], ['Alderamin', 7500, 0], ['Deneb', 9800, 7], ['Vega', 13700, 5], ['Thuban', -2700, 0]]; const out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(23.4) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '4 5' }), s('text', { x: plot.X(0), y: plot.Y(0) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: '+' })]; for (const [n, y, off] of S) { const a = ph(y), r = 23.4 + off; out.push(s('circle', { cx: plot.X(r * Math.cos(a)), cy: plot.Y(r * Math.sin(a)), r: 5, class: 'fl-amber' }), s('text', { x: plot.X((r + 5.5) * Math.cos(a)), y: plot.Y((r + 5.5) * Math.sin(a)) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: n })); } const a = ph(p.yr); out.push(s('circle', { cx: plot.X(23.4 * Math.cos(a)), cy: plot.Y(23.4 * Math.sin(a)), r: 8, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 })); return out; },
                readout: (p) => { const S = [['Polaris', 2100, 0], ['Errai', 4000, 1], ['Alderamin', 7500, 0], ['Deneb', 9800, 7], ['Vega', 13700, 5], ['Thuban', -2700, 0]]; let best = null, bd = 1e9; for (const [n, y, off] of S) { const da = Math.abs(((((p.yr - y) / 25800) % 1) + 1.5) % 1 - 0.5) * 2 * Math.PI * 23.4, d = Math.hypot(da, off); if (d < bd) { bd = d; best = n; } } return bd < 4 ? `pole star: **${best}**` : 'no bright star close to the pole'; },
              },
              after: r`The Egyptians building the pyramids saw Thuban near the pole; today it is Polaris; around AD 14,000 bright Vega will be a rough pole star. The axis keeps its 23.4° tilt throughout; only its direction slowly circles, like a tilted spinning top.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The pole star',
              prompt: r`Today Earth's axis points almost at Polaris. What does precession imply?`,
              choices: [
                { t: 'Polaris is only a temporary pole star; in about 12,000 years the axis will point near Vega', ok: true },
                { t: 'Polaris will always be the pole star', why: 'The axis traces a big circle on the sky over 26,000 years. Polaris is just near the circle’s current point.' },
                { t: 'The pole star changes every year', why: 'The drift is about 50″ per year, so changes take thousands of years.' },
              ],
              explain: r`When the Egyptian pyramids were built, the pole star was Thuban in the constellation Draco. In about 12,000 years it will be bright Vega, and the cycle continues.`,
            },
          ],
          recap: [
            'The Sun and Moon tug on Earth’s equatorial bulge, making its axis precess.',
            'One full precession takes about 26,000 years (about 50″ per year).',
            'The pole star changes over millennia: Thuban, then Polaris, later Vega.',
          ],
        },
        {
          id: 'stability',
          title: 'Stable and Unstable Spins',
          summary: 'Bullets, spacecraft and a flipping nut',
          icon: 'star',
          steps: [
            {
              type: 'mcq',
              title: 'Rifling',
              prompt: r`Gun barrels have spiral grooves (rifling) that spin the bullet, and quarterbacks throw an American football with a spiral. What does the spin achieve?`,
              choices: [
                { t: 'Large angular momentum keeps the axis pointing steadily, so the projectile doesn’t tumble', ok: true },
                { t: 'It makes the projectile travel faster', why: 'Spin doesn’t add forward speed. It stabilises the orientation.' },
                { t: 'It cancels gravity', why: 'Spinning projectiles still fall under gravity. The spin keeps them from tumbling.' },
              ],
              explain: r`Small aerodynamic torques would make a non-spinning bullet or ball tumble. With large angular momentum, the same torques only make the axis precess gently, keeping it pointed nose-first. Spacecraft use the same principle: spinning wheels inside them (reaction wheels and control moment gyroscopes) hold or turn the craft without fuel.`,
            },
            {
              type: 'explain',
              title: 'The tennis racket theorem',
              body: r`Every rigid object has three principal axes: one with the largest moment of inertia, one with the smallest, and one in between. Toss a tennis racket (or a phone, or a book held shut with a band) spinning about each axis:

- About the **largest** or **smallest** axis, the spin is stable.
- About the **intermediate** axis, the object flips over unpredictably as it spins.

In 1985, cosmonaut Vladimir Dzhanibekov saw a wing nut spinning off a bolt in zero gravity flip back and forth every few seconds, a vivid demonstration now called the **Dzhanibekov effect**.`,
            },
            {
              type: 'numeric',
              title: 'Losing energy, keeping spin',
              prompt: r`With fixed angular momentum $L$, rotational energy is $\frac{L^2}{2I}$. If an object's spin shifts from an axis with $I = 2$ to one with $I = 3$ (same units, same $L$), its energy becomes what fraction of the original? (3 decimal places.)`,
              answer: 2 / 3,
              tol: 0.001,
              wrong: [{ v: 1.5, tol: 0.001, why: r`Energy is $\frac{L^2}{2I}$: a bigger $I$ means **less** energy, by the factor $\frac23$.` }],
              explain: r`$E \propto \frac1I$, so the energy falls to $\frac23$ of its original value. The lost third goes into heat (flexing, sloshing). That's why a spinning object that dissipates energy drifts towards its axis of largest moment of inertia: it's the lowest-energy way to carry the same angular momentum.`,
            },
            {
              type: 'numeric',
              title: 'Spinning bullets',
              prompt: r`A rifle barrel’s grooves twist one full turn every 25 cm. A bullet leaves at 900 m/s. How many revolutions per second is it spinning?`,
              unit: 'rev/s',
              answer: 900 / 0.25,
              tol: 1,
              wrong: [{ v: 225, why: r`Divide the speed by the twist length: 900 / 0.25.` }],
              explain: r`$\frac{900}{0.25} = 3{,}600$ revolutions per second, over 200,000 rpm. That huge angular momentum keeps the bullet pointing forward instead of tumbling, just as a spinning football flies in a tight spiral.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The flipping axis',
              body: r`Simulate a free-floating box with three different moments of inertia (1, 2 and 3), spun almost exactly about one axis with a tiny wobble. The curves show the spin about each axis over time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: -1.3, ymax: 1.3, grid: false, height: 260, axes: { xlabel: 'time', ylabel: 'spin about each axis', xticks: 10, yticks: 0.5 },
                params: { ax: { min: 1, max: 3, step: 1, value: 1, label: 'spun about axis', color: 'violet', format: (v) => ['', 'axis 1 (smallest I)', 'axis 2 (middle I)', 'axis 3 (largest I)'][v] } },
                extra: ({ plot, p, s }) => { let w = [0.02, 0.02, 0.02]; w[p.ax - 1] = 1; const f = ([a, b, c]) => [-b * c, a * c, -(a * b) / 3], dt = 0.02, paths = ['', '', '']; for (let i = 0; i <= 3000; i++) { const t = i * dt; for (let k = 0; k < 3; k++) paths[k] += (i ? 'L' : 'M') + plot.X(t).toFixed(1) + ' ' + plot.Y(w[k]).toFixed(1); const k1 = f(w), k2 = f(w.map((v, j) => v + (dt / 2) * k1[j])), k3 = f(w.map((v, j) => v + (dt / 2) * k2[j])), k4 = f(w.map((v, j) => v + dt * k3[j])); w = w.map((v, j) => v + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); } return paths.map((d, k) => s('path', { d, fill: 'none', stroke: ['var(--coral)', 'var(--violet)', 'var(--teal)'][k], 'stroke-width': k === p.ax - 1 ? 3 : 1.6 })); },
                readout: (p) => (p.ax === 2 ? 'axis 2: the spin **flips over** again and again (coral axis 1, violet axis 2, teal axis 3)' : `axis ${p.ax}: the spin stays put; the wobble stays tiny (coral axis 1, violet axis 2, teal axis 3)`),
              },
              after: r`Spin about the smallest or largest axis is stable: the small wobbles just oscillate. Spin about the middle axis is unstable: the wobble grows until the body flips completely, then flips back, over and over. Throw a phone or a tennis racket and you can see it happen.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which axis is stable for a satellite?',
              prompt: r`Explorer 1, America's first satellite (1958), was designed to spin about its long, thin axis (smallest moment of inertia). Its flexible antennas slowly dissipated energy. What happened?`,
              choices: [
                { t: 'It ended up tumbling end over end, about the axis of largest moment of inertia', ok: true },
                { t: 'It kept spinning about its long axis forever', why: 'With energy loss, spin about the smallest axis isn’t truly stable. Angular momentum is fixed, so losing energy pushes the spin towards the largest axis.' },
                { t: 'It stopped spinning entirely', why: 'Angular momentum is conserved; it can’t simply vanish. Its spin shifted to a different axis.' },
              ],
              explain: r`For fixed angular momentum $L$, rotational energy is $\frac{L^2}{2I}$, lowest for the largest $I$. A body that loses energy, by flexing or sloshing, drifts towards spinning about its axis of largest moment of inertia. Within hours, Explorer 1 was tumbling. Engineers learned the lesson: spin-stabilised satellites are now designed to spin about their major axis.`,
            },
          ],
          recap: [
            'Spin stabilises bullets, footballs and spacecraft.',
            'Rotation about the intermediate axis is unstable (tennis racket theorem).',
            'With energy loss, objects end up spinning about their axis of largest moment of inertia.',
          ],
        },
      ],
    },
    {
      title: 'Spin at Work',
      summary: 'Bicycles, spacecraft and phones.',
      lessons: [
        {
          id: 'bikes',
          title: 'Leaning into Turns',
          summary: 'Bicycles, balance and countersteering',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Why lean?',
              prompt: 'A cyclist going round a corner leans into the turn. Why?',
              choices: [
                { t: 'So that gravity and the road’s push combine to give the sideways force needed to turn, without toppling', ok: true },
                { t: 'To reduce air resistance', why: 'The lean is about balance in the turn, not drag.' },
                { t: 'It doesn’t matter: cyclists lean out of habit', why: 'Try turning without leaning: you’d topple outwards.' },
              ],
              explain: r`Turning needs a sideways (centripetal) force from the ground. That force acts at the tyres, below the rider's centre of mass, so it would tip the rider outwards, unless they lean in so that gravity's torque balances it. The right lean angle satisfies $\tan\theta = \frac{v^2}{gr}$.`,
            },
            {
              type: 'interactive',
              title: 'Find the corner',
              body: r`A cyclist rides at 10 m/s (36 km/h). Choose the radius of the corner so that the cyclist leans at exactly **30°** from vertical.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -0.1, ymax: 1.4, grid: false, axes: false, maxWidth: 320,
                params: { rad: { min: 5, max: 60, step: 0.5, value: 40, label: 'corner radius', color: 'blue', format: (v) => `${fix(v, 1)} m` } },
                extra: ({ plot, p, s }) => {
                  const th = (leanDeg(10, p.rad) * Math.PI) / 180, top = [Math.sin(th) * 1.2, Math.cos(th) * 1.2];
                  return [
                    s('line', { x1: plot.X(-1.2), x2: plot.X(1.2), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(1.3), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(top[0]), y2: plot.Y(top[1]), stroke: 'var(--violet)', 'stroke-width': 8, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(top[0] * 0.8), cy: plot.Y(top[1] * 0.8), r: 12, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => `Lean angle **${leanDeg(10, p.rad).toFixed(1)}°** from vertical`,
                goal: (p) => Math.abs(leanDeg(10, p.rad) - 30) < 1,
                hint: r`$\tan 30° \approx 0.577$, so $r = \frac{v^2}{g \tan 30°}$.`,
                solution: { rad: 17.5 },
              },
              explain: r`$r = \frac{10^2}{9.8 \times 0.577} \approx 17.7$ m. Tighter corners or higher speeds need steeper leans; racing motorcyclists lean beyond $60°$, which requires tyres gripping with a sideways force bigger than their weight.`,
            },
            {
              type: 'mcq',
              title: 'Why bikes stay up',
              prompt: r`A riderless bicycle pushed along at a decent speed often rolls on upright for a surprisingly long way. In 2011, researchers built a bike with tiny counter-spinning wheels (cancelling the gyroscopic effect) and no trail. What did they find?`,
              choices: [
                { t: 'It still balanced itself: steering geometry and mass placement can do the job without gyroscopic effects', ok: true },
                { t: 'It fell over at once, proving gyroscopes do all the work', why: 'The surprise was that it stayed upright. Gyroscopic effects help, but aren’t essential.' },
                { t: 'It went faster', why: 'Speed wasn’t the point; the experiment tested what makes a bike self-stable.' },
              ],
              explain: r`Jim Papadopoulos, Arend Schwab and colleagues showed that a bike's self-stability comes from the way it automatically **steers into a fall**: lean left and the front wheel turns left, bringing the wheels back under the rider. Gyroscopic precession of the front wheel contributes, as does the trail of the front fork, but neither alone is essential.`,
            },
            {
              type: 'mcq',
              title: 'Countersteering',
              prompt: r`To turn left at speed, motorcyclists briefly push the left handlebar **forward**, steering slightly right. Why does this make the bike turn left?`,
              choices: [
                { t: 'The brief right steer pushes the wheels out from under the bike, which tips it into a left lean, and the lean drives the left turn', ok: true },
                { t: 'It doesn’t: the bike turns right', why: 'Only for a moment. The wheels move right, the bike leans left, and then it carves left.' },
                { t: 'The engine pulls it left', why: 'It’s a steering-and-lean effect, not the engine.' },
              ],
              explain: r`Steering right for an instant moves the tyres right, under the bike, so the bike leans left (gyroscopic precession of the front wheel helps tip it too). Once leaning, the rider steers left into the turn. Riders do this unconsciously on bicycles; on fast motorcycles it's taught deliberately.`,
            },
            {
              type: 'numeric',
              title: 'Leaning on a corner',
              prompt: r`A cyclist rounds a curve of radius 20 m at 10 m/s. The lean angle from vertical satisfies $\tan\theta = \frac{v^2}{gr}$. What is it? (Nearest degree.)`,
              unit: '°',
              answer: Math.atan(100 / (9.8 * 20)) * 180 / Math.PI,
              tol: 0.6,
              explain: r`$\tan\theta = \frac{100}{196} \approx 0.51$, so $\theta \approx 27°$. Leaning puts the combined force of gravity and the road’s grip through the bike’s contact patch, so it doesn’t topple.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A racing lean',
              prompt: r`A motorcycle racer takes a corner of radius 50 m at 30 m/s (108 km/h). What lean angle from vertical is needed? (Nearest degree.)`,
              unit: '°',
              answer: leanDeg(30, 50),
              tol: 0.6,
              wrong: [{ v: 90 - leanDeg(30, 50), tol: 0.6, why: r`That's measured from the ground. From vertical, $\tan\theta = \frac{v^2}{gr}$.` }],
              hint: r`$\tan\theta = \frac{30^2}{9.8 \times 50} \approx 1.84$.`,
              explain: r`$\tan\theta = \frac{900}{490} \approx 1.84$, so $\theta \approx 61°$. The tyres must provide a sideways force 1.84 times the weight, which is why racing tyres are soft and sticky, and why riders' knees and even elbows brush the track.`,
            },
          ],
          recap: [
            r`A leaning rider balances in a turn when $\tan\theta = v^2/(gr)$.`,
            'Bikes self-stabilise mainly by steering into a fall; gyroscopic effects help.',
            'Countersteering: steer briefly the wrong way to start the lean.',
          ],
        },
        {
          id: 'gyrotech',
          title: 'Gyroscopes at Work',
          summary: 'Turning spacecraft and sensing motion',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Turning without thrusters',
              prompt: 'A space telescope must turn to point at a new star, but it has no air to push against and wants to save fuel. How can it turn?',
              choices: [
                { t: 'Spin up a wheel inside it: by conservation of angular momentum, the telescope turns the opposite way', ok: true },
                { t: 'It can’t turn without firing rockets', why: 'Angular momentum can be shuffled between parts of the craft without any outside push.' },
                { t: 'Use the Sun’s gravity', why: 'Gravity gives no useful torque for aiming. Internal wheels do the job.' },
              ],
              explain: r`With no outside torque, total angular momentum stays zero. Spin a heavy **reaction wheel** one way and the telescope rotates the other way; stop the wheel and the telescope stops. The Hubble Space Telescope aims with reaction wheels, slewing about as fast as a minute hand.`,
            },
            {
              type: 'interactive',
              title: 'Point the satellite',
              body: r`A satellite (moment of inertia 500 kg·m²) carries a reaction wheel (0.05 kg·m²). Set the wheel's speed so that the satellite turns through **90°** in one minute.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.4, ymax: 1.4, grid: false, axes: false, maxWidth: 300,
                params: { rpm: { min: 0, max: 6000, step: 50, value: 1000, label: 'wheel speed', color: 'violet', format: (v) => `${v} rpm` } },
                extra: ({ plot, p, s, arrow }) => {
                  const a = (satTurn(p.rpm) * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
                  const box = [[-0.6, -0.4], [0.6, -0.4], [0.6, 0.4], [-0.6, 0.4]].map(([x, y]) => [x * c - y * sn, x * sn + y * c]);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1.2) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-dasharray': '4 5' }),
                    s('path', { d: box.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }),
                    arrow(plot.X(0), plot.Y(0), plot.X(1.1 * c), plot.Y(1.1 * sn), { color: 'var(--coral)', width: 3, head: 10 }),
                    arrow(plot.X(0), plot.Y(0), plot.X(1.1), plot.Y(0), { color: 'var(--ink-3)', width: 1.5, head: 8 }),
                  ];
                },
                readout: (p) => `After one minute the satellite has turned **${satTurn(p.rpm).toFixed(1)}°** (the wheel spins the other way)`,
                goal: (p) => Math.abs(satTurn(p.rpm) - 90) < 3,
                hint: r`The satellite's angular speed must be $\frac{\pi/2}{60}$ rad/s. Then $I_\text{sat}\omega_\text{sat} = I_\text{wheel}\omega_\text{wheel}$.`,
                solution: { rpm: 2500 },
              },
              explain: r`The satellite must turn at $\frac{\pi/2}{60} \approx 0.026$ rad/s, so the wheel needs $\omega = \frac{500 \times 0.026}{0.05} \approx 262$ rad/s $\approx 2500$ rpm, 10,000 times faster than the satellite because it is 10,000 times lighter in rotational terms. To stop, the wheel slows back down.`,
            },
            {
              type: 'numeric',
              title: 'Gyroscopes on the space station',
              body: r`The International Space Station steers with four **control moment gyroscopes**: 100 kg rotors spinning at 6600 rpm. Instead of changing their spin speed, motors tilt their axles, and the precession torque turns the station.`,
              prompt: r`One rotor has $I \approx 7$ kg·m² at 6600 rpm (about 691 rad/s). What is its angular momentum, in kg·m²/s? (Nearest hundred.)`,
              unit: 'kg·m²/s',
              answer: 7 * 691,
              tol: 100,
              wrong: [{ v: 7 * 6600, tol: 100, why: 'Use rad/s (691), not rpm.' }],
              explain: r`$L = I\omega \approx 7 \times 691 \approx 4800$ kg·m²/s per gyroscope. Tilting such a large angular momentum produces big torques from small motors, letting the station hold its orientation using only electricity from its solar panels.`,
            },
            {
              type: 'mcq',
              title: 'The gyroscope in your phone',
              prompt: r`Your phone knows when you rotate it, yet it contains no spinning wheel. Its tiny MEMS gyroscope has a microscopic mass vibrating back and forth. How does that sense rotation?`,
              choices: [
                { t: 'When the phone rotates, the Coriolis effect pushes the vibrating mass sideways, and that tiny motion is measured', ok: true },
                { t: 'It measures the Earth’s magnetic field', why: 'That’s the magnetometer (compass). The gyroscope senses rotation itself.' },
                { t: 'It detects gravity tilting', why: 'That’s the accelerometer. The gyroscope responds to rotation, even with no change in tilt.' },
              ],
              explain: r`A mass vibrating in a rotating frame feels a Coriolis force at right angles to its motion, proportional to the rotation rate. The sideways jiggle, a few nanometres, is sensed electrically. These chips, smaller than a grain of rice, stabilise camera images, steer drones and help navigation when GPS drops out.`,
            },
            {
              type: 'mcq',
              title: 'Gyroscopes with no spinning parts',
              prompt: r`Aircraft and submarines often use **fibre-optic** or **ring-laser** gyroscopes, which have no spinning wheel. How do they sense rotation?`,
              choices: [
                { t: r`Light sent both ways round a loop takes slightly different times when the loop rotates (the Sagnac effect)`, ok: true },
                { t: r`They measure the Earth’s magnetic field`, why: r`That’s a compass, not a gyroscope.` },
                { t: r`A tiny wheel spins inside the fibre`, why: r`There are no moving parts at all, which is why they are so reliable.` },
              ],
              explain: r`When the loop turns, the beam travelling with the rotation has slightly farther to go. Interference between the two beams reveals the rotation rate with extraordinary precision, enough to detect Earth’s own rotation.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Gimbal lock',
              prompt: r`Apollo spacecraft measured their orientation with a gyroscope platform mounted in three nested rings (gimbals). Astronauts were warned to avoid one orientation, where two of the rings lined up. What went wrong there?`,
              choices: [
                { t: 'The rings lost one direction of freedom (gimbal lock), so the platform could be knocked out of alignment', ok: true },
                { t: 'The gyroscopes stopped spinning', why: 'The gyroscopes kept spinning; the problem was geometric: two rings aligned, losing a degree of freedom.' },
                { t: 'The spacecraft became unstable and tumbled', why: 'The spacecraft was fine; its measuring platform was what could lose its reference.' },
              ],
              explain: r`With two gimbal axes aligned, the three rings can only rotate in two independent ways, so a rotation in the missing direction drags the platform with it: **gimbal lock**. On Apollo 11, Michael Collins joked about asking for "a fourth gimbal for Christmas". Modern spacecraft avoid the problem with strapdown sensors and software that tracks orientation using quaternions, an extension of complex numbers.`,
            },
          ],
          recap: [
            'Reaction wheels turn spacecraft by trading angular momentum, with no fuel.',
            'Control moment gyroscopes tilt big spinning rotors to make large steering torques.',
            'Phone gyroscopes sense rotation through the Coriolis effect on a vibrating mass.',
          ],
        },
        {
          id: 'spin-limit',
          title: 'How Fast Can a Planet Spin?',
          summary: 'The spin barrier',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Gravity versus spin',
              body: r`On a spinning planet, matter at the equator moves in a circle, which needs a centripetal acceleration $\omega^2R$. Gravity, $\frac{GM}{R^2}$, provides it. Spin faster and less of gravity is left over to hold you down; spin fast enough and the equator would be flung off.

That happens when $\omega^2R = \frac{GM}{R^2}$, giving a minimum rotation period
$$T_{\min} = 2\pi\sqrt{\frac{R^3}{GM}} = \sqrt{\frac{3\pi}{G\rho}},$$
which depends only on the planet’s average density $\rho$.`,
            },
            {
              type: 'numeric',
              title: 'Earth today',
              prompt: r`Earth spins once every 23.93 hours. Its equatorial centripetal acceleration is about 0.034 m/s². What percentage of gravity (9.8 m/s²) is that? (2 decimal places.)`,
              unit: '%',
              answer: (0.034 / 9.8) * 100,
              tol: 0.01,
              explain: r`$\frac{0.034}{9.8} \approx 0.35\%$. You weigh about 0.35% less at the equator than you would on a non-spinning Earth, and Earth bulges by 21 km at the equator as a result.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Spin up the Earth',
              prompt: r`Shorten Earth’s day and watch the effective gravity at the equator fall. Find the day length at which objects on the equator would become **weightless**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 10, grid: false, height: 260, axes: { xlabel: 'length of day (hours)', ylabel: 'effective gravity at the equator (m/s²)', xticks: 1, yticks: 2 },
                params: { T: { min: 0.5, max: 6, step: 0.01, value: 3, label: 'day length', color: 'coral', format: (v) => `${v.toFixed(2)} h` } },
                curves: [{ f: (x) => 9.82 - (2 * Math.PI / (x * 3600)) ** 2 * 6.371e6, color: 'violet', width: 3, from: 0.5 }],
                points: [{ x: (p) => p.T, y: (p) => Math.max(0, 9.82 - (2 * Math.PI / (p.T * 3600)) ** 2 * 6.371e6), color: 'coral' }],
                readout: (p) => { const a = (2 * Math.PI / (p.T * 3600)) ** 2 * 6.371e6; return `spin acceleration ${a.toFixed(2)} m/s² · effective gravity **${(9.82 - a).toFixed(2)} m/s²**${a > 9.82 ? ' · the equator flies apart!' : ''}`; },
                goal: (p) => Math.abs(p.T - 1.406) < 0.01,
                hint: r`Solve $\left(\frac{2\pi}{T}\right)^2 R = g$, so $T = 2\pi\sqrt{R/g}$.`,
                solution: { T: 1.41 },
              },
              explain: r`$T = 2\pi\sqrt{\frac{6.371 \times 10^6}{9.82}} \approx 5{,}060$ s $\approx$ **84 minutes**: the same as the period of a satellite skimming the surface, since a weightless object on the equator is effectively in orbit. (Long before that, Earth would have flattened dramatically.)`,
            },
            {
              type: 'mcq',
              title: 'The bulge',
              prompt: r`Why is Earth’s equatorial radius about 21 km bigger than its polar radius?`,
              choices: [
                { t: 'Its spin reduces effective gravity at the equator, so the (slightly fluid) Earth settles into a flattened shape', ok: true },
                { t: 'The Moon’s pull stretches it', why: 'The Moon raises tides of about a metre, not a 21 km bulge.' },
                { t: 'More rock happened to collect there', why: 'The bulge is a direct effect of rotation on a body that flows over long times.' },
              ],
              explain: r`Over millions of years rock flows, and Earth takes the shape that balances gravity and spin. Saturn, spinning in 10.7 hours with low density, is flattened by about 10%: you can see it in a small telescope.`,
            },
            {
              type: 'numeric',
              title: 'The asteroid spin barrier',
              prompt: r`Many asteroids are loose "rubble piles" held together only by gravity, with density about 2,000 kg/m³. Using $T_{\min} = \sqrt{\frac{3\pi}{G\rho}}$ ($G = 6.67 \times 10^{-11}$), what is the shortest spin period such an asteroid can have, in hours? (1 decimal place.)`,
              unit: 'h',
              answer: Math.sqrt((3 * Math.PI) / (6.674e-11 * 2000)) / 3600,
              tol: 0.1,
              explain: r`$\sqrt{\frac{3\pi}{6.67 \times 10^{-11} \times 2000}} \approx 8{,}400$ s $\approx 2.3$ hours. Remarkably, surveys find almost no asteroids larger than a few hundred metres spinning faster than about 2.2 hours: the "spin barrier", evidence that they are indeed rubble piles.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Millisecond pulsars',
              prompt: r`Some pulsars spin hundreds of times per second. What does the spin limit tell us about them?`,
              choices: [
                { t: 'They must be fantastically dense, like neutron stars, or they would fly apart', ok: true },
                { t: 'They must be very large', why: r`$T_{\min}$ depends only on density. Fast spin requires very high density, whatever the size.` },
                { t: 'Nothing: stars can spin at any rate', why: 'Every self-gravitating body has a minimum period set by its density.' },
              ],
              explain: r`A period of 1.4 ms needs $\rho \ge \frac{3\pi}{GT^2} \approx 7 \times 10^{16}$ kg/m³, about a third of the density inside an atomic nucleus. That alone rules out ordinary stars and white dwarfs: only neutron stars fit.`,
            },
          ],
          recap: [
            r`A spinning body flies apart at the equator if $\omega^2R > GM/R^2$.`,
            r`Minimum period $T_{\min} = \sqrt{3\pi/(G\rho)}$, set by density alone.`,
            'Rubble-pile asteroids hit a 2.2-hour spin barrier; pulsars must be neutron stars.',
          ],
        },
      ],
    },
  ],
};
