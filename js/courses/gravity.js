import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
const V_UNIT = 7.9; // km/s: circular speed at Earth's surface
const R0 = 1.08; // launch radius (Earth radii): a ~500 km mountain

const GN = 6.674e-11, ME = 5.972e24, RE = 6.371e6;
// circular orbit period (hours) at altitude h (km) above Earth
const orbitHours = (hkm) => (2 * Math.PI * Math.sqrt(((RE + hkm * 1e3) ** 3) / (GN * ME))) / 3600;
// Io's period (days) around a planet of mass M × 10^27 kg, at 421,700 km
const ioDays = (M) => (2 * Math.PI * Math.sqrt((4.217e8) ** 3 / (GN * M * 1e27))) / 86400;

// phasing: the chaser (40° behind) brakes into a lower, faster ellipse and meets the target one lap later
const PHASE = (() => {
  const gap = (40 * Math.PI) / 180, Tp = 2 * Math.PI - gap, a = (Tp / (2 * Math.PI)) ** (2 / 3), rp = 2 * a - 1, e = (1 - rp) / (1 + rp);
  const ellipse = (tt) => {
    const M = Math.PI + (2 * Math.PI * tt) / Tp;
    let E = M;
    for (let i = 0; i < 30; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)), r = a * (1 - e * Math.cos(E));
    return [r * Math.cos(Math.PI + nu), r * Math.sin(Math.PI + nu)];
  };
  return { gap, Tp, a, rp, ellipse, t0: 1.5 };
})();

export default {
  id: 'gravity',
  subject: 'physics',
  title: 'Gravity & Orbits',
  level: 'Intermediate',
  cover: 'gravity',
  tagline: 'From falling apples to orbiting moons: Newton’s universal law.',
  description: r`Discover that the force pulling an apple down also holds the Moon in its orbit. Fire Newton's cannonball into orbit, uncover Kepler's laws of planetary motion, calculate what it takes to escape Earth entirely, place satellites in useful orbits, and weigh the Earth, Jupiter and the Sun.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Universal Gravitation',
      summary: 'One law for apples, moons and planets.',
      lessons: [
        {
          id: 'newton-gravity',
          title: 'The Inverse-Square Law',
          summary: 'How gravity weakens with distance',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The apple and the Moon',
              body: r`Legend says Newton saw an apple fall and wondered: does the same force reach all the way to the Moon?`,
              prompt: 'If gravity reaches the Moon, why doesn’t the Moon fall down onto Earth?',
              choices: [
                { t: 'It is falling, but it moves sideways so fast that it keeps missing', ok: true },
                { t: 'Gravity doesn’t reach that far', why: 'Gravity gets weaker with distance, but it never switches off. It’s what keeps the Moon in orbit.' },
                { t: 'The Moon is too heavy to be pulled', why: 'Heavier objects are pulled harder, not less.' },
              ],
              explain: r`The Moon is falling toward Earth all the time. But it's also moving sideways at about 1 km/s, so as it falls, Earth's surface curves away beneath it. That's what an orbit is: falling forever and always missing.`,
            },
            {
              type: 'explain',
              title: 'Newton’s law of gravitation',
              body: r`Every mass attracts every other mass with a force
$$F = \frac{G\,m_1 m_2}{r^2}$$
where $r$ is the distance between their centres and $G = 6.67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ is a tiny universal constant.

The force is proportional to each mass and **inversely proportional to the square of the distance**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5.2, ymin: 0, ymax: 1.1, grid: 1, gridY: 0.25, height: 280, axes: { xlabel: 'distance (×r)', ylabel: 'force', yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { d: { min: 1, max: 5, step: 0.5, value: 2, label: 'distance', color: 'violet', format: (v) => `${fix(v, 1)}×` } },
                curves: [{ f: (x) => 1 / (x * x), color: 'violet', from: () => 0.95 }],
                points: [{ x: (p) => p.d, y: (p) => 1 / (p.d * p.d), color: 'violet' }],
                readout: (p) => r`At ${fix(p.d, 1)} times the distance, the force is $\frac{1}{${fix(p.d, 1)}^2} = ${f2(100 / (p.d * p.d))}\%$ as strong`,
              },
            },
            {
              type: 'mcq',
              title: 'Twice as far',
              prompt: 'Two asteroids move twice as far apart. What happens to the gravitational force between them?',
              cols: 2,
              choices: [
                { t: 'It becomes ¼ as strong', ok: true },
                { t: 'It becomes ½ as strong', why: r`The force goes as $1/r^2$: doubling $r$ divides it by $2^2 = 4$.` },
                { t: 'It stays the same', why: 'Gravity weakens with distance.' },
                { t: 'It becomes 4 times stronger', why: 'Moving apart weakens gravity.' },
              ],
              explain: r`$F \propto \frac{1}{r^2}$, so doubling $r$ gives $\frac{1}{4}$ of the force. Light and sound spread out in the same inverse-square way.`,
            },
            {
              type: 'numeric',
              title: 'Newton’s Moon test',
              body: r`The Moon is about 60 times farther from Earth's centre than you are (you're 1 Earth radius away from it). At Earth's surface, gravity gives an acceleration of 9.8 m/s².`,
              prompt: 'What acceleration does Earth’s gravity give the Moon, in m/s²?',
              unit: 'm/s²',
              answer: 9.8 / 3600,
              tol: 0.0001,
              wrong: [
                { v: 9.8 / 60, tol: 0.001, why: r`Gravity falls off with the **square** of distance: divide by $60^2 = 3600$.` },
                { v: 9.8, tol: 0.01, why: 'Gravity is much weaker that far away.' },
              ],
              explain: r`$\frac{9.8}{60^2} = \frac{9.8}{3600} \approx 0.0027$ m/s². Newton then worked out the acceleration needed to keep the Moon on its circular path, using its distance and its 27.3-day orbit. It was the same number. This was the first evidence that gravity is **universal**.`,
            },
            {
              type: 'mcq',
              title: 'Who pulls harder?',
              prompt: 'Earth pulls on you. You pull on Earth. Which force is bigger?',
              choices: [
                { t: 'They are exactly equal', ok: true },
                { t: 'Earth’s pull on you', why: r`The formula $\frac{Gm_1m_2}{r^2}$ is symmetric in the two masses. Also, Newton's third law says the pair must be equal.` },
                { t: 'Your pull on Earth', why: 'The forces are equal. Only the accelerations differ.' },
              ],
              explain: r`The forces are equal (Newton's third law), but Earth's enormous mass means its acceleration is about $10^{-23}$ m/s², far too small to notice.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two people',
              prompt: r`Two 70 kg people stand 1 m apart. What is the gravitational force between them? ($G = 6.67 \times 10^{-11}$) Give your answer in micronewtons (μN, millionths of a newton).`,
              unit: 'μN',
              answer: (6.67e-11 * 70 * 70) / 1e-6,
              tol: 0.005,
              wrong: [{ v: (6.67e-11 * 140) / 1e-6, tol: 0.0005, why: r`Multiply the masses, don't add them: $70 \times 70 = 4900$.` }],
              explain: r`$F = \frac{6.67 \times 10^{-11} \times 70 \times 70}{1^2} \approx 3.3 \times 10^{-7}$ N $\approx 0.33$ μN. That's less than the weight of a grain of sand. Gravity is by far the weakest force in nature. We only notice it because Earth is so massive.`,
            },
          ],
          recap: [
            r`$F = Gm_1m_2/r^2$: every mass attracts every other mass.`,
            'Double the distance and the force drops to a quarter.',
            'The same gravity that drops apples keeps the Moon in orbit.',
          ],
        },
        {
          id: 'other-worlds',
          title: 'Weight on Other Worlds',
          summary: 'g = GM/R²',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Jumping on the Moon',
              prompt: 'Astronauts on the Moon bounced around easily. Compared with on Earth, their mass on the Moon was…',
              choices: [
                { t: 'The same', ok: true },
                { t: 'About ⅙ as much', why: 'Their *weight* was about ⅙, but mass (the amount of matter) doesn’t change.' },
                { t: 'Zero', why: 'Mass never disappears. And the Moon does have gravity, just weaker.' },
              ],
              explain: r`Mass is the same everywhere. **Weight** (the force of gravity) depends on where you are. The Moon's surface gravity is about $\tfrac16$ of Earth's.`,
            },
            {
              type: 'explain',
              title: 'Surface gravity',
              body: r`At the surface of a planet with mass $M$ and radius $R$, the gravity on a mass $m$ is $\frac{GMm}{R^2}$. Divide by $m$ to get the acceleration:
$$g = \frac{GM}{R^2}$$
A more massive planet pulls harder. A bigger radius puts you farther from its centre, which weakens the pull.

| World | $g$ (m/s²) |
|---|---|
| Moon | 1.6 |
| Mars | 3.7 |
| Earth | 9.8 |
| Jupiter (cloud tops) | 24.8 |`,
            },
            {
              type: 'numeric',
              title: 'Weigh yourself on Mars',
              prompt: r`A 60 kg astronaut stands on Mars ($g = 3.7$ m/s²). What is their weight?`,
              unit: 'N',
              answer: 222,
              tol: 0.5,
              wrong: [
                { v: 588, tol: 0.5, why: 'That’s their weight on Earth. Use Mars’s gravity.' },
                { v: 60, why: 'That’s their mass, in kg. Weight is mg.' },
              ],
              explain: r`$W = mg = 60 \times 3.7 = 222$ N, about 38% of their 588 N weight on Earth.`,
            },
            {
              type: 'mcq',
              title: 'Double planet',
              prompt: 'A planet has the same mass as Earth but twice the radius. What is its surface gravity?',
              cols: 2,
              choices: [
                { t: 'A quarter of Earth’s', ok: true },
                { t: 'Half of Earth’s', why: r`$g = GM/R^2$: doubling $R$ divides $g$ by 4.` },
                { t: 'Twice Earth’s', why: 'A bigger radius puts you farther from the centre, so gravity is weaker.' },
                { t: 'The same as Earth’s', why: r`The radius is in the formula, squared.` },
              ],
              explain: r`$g \propto \frac{1}{R^2}$, so twice the radius with the same mass gives $\frac14 g$.`,
            },
            {
              type: 'interactive',
              title: 'A jump on a small world',
              body: r`For worlds with the same density as Earth, surface gravity is proportional to radius: $g = 9.8\ \text{m/s}^2 \times \frac{R}{6371\ \text{km}}$. A jump that rises 0.5 m on Earth rises $0.5\ \text{m} \times \frac{9.8}{g}$. Find the radius where the same jump rises **1.5 m**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -1.25, ymax: 1.55, grid: false, axes: false, maxWidth: 300,
                params: { R: { min: 500, max: 12000, step: 1, value: 4000, label: 'radius', color: 'blue', format: (v) => `${v} km` } },
                extra: ({ plot, p, s }) => { const r = p.R / 12000, rE = 6371 / 12000, h = Math.min(0.5, 0.5 * (6371 / p.R) * 0.1); return [s('circle', { cx: plot.X(0), cy: plot.Y(1 - r), r: plot.X(r) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('circle', { cx: plot.X(0), cy: plot.Y(1 - rE), r: plot.X(rE) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4', opacity: 0.7 }), s('circle', { cx: plot.X(0), cy: plot.Y(1 + 0.05 + h), r: 6, class: 'fl-coral' })]; },
                readout: (p) => { const g = (9.8 * p.R) / 6371; return `g = **${g.toFixed(2)} m/s²** · the jump rises **${((0.5 * 9.8) / g).toFixed(2)} m** (dashed: Earth’s size)`; },
                goal: (p) => Math.abs((0.5 * 9.8) / ((9.8 * p.R) / 6371) - 1.5) < 0.003,
                hint: 'Three times the height needs a third of the gravity, so a third of the radius.',
                solution: { R: 2124 },
              },
              explain: r`A third of Earth’s radius, about **2,120 km**, gives a third of the gravity and a jump three times as high. The Moon (1,737 km) is smaller still, but also less dense, so its gravity is only a sixth of Earth’s.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Weigh Mars',
              body: r`Since $g = GM/R^2$, a planet's surface gravity and size reveal its mass: $M = gR^2/G$. (The constant $G$ was first measured by Henry Cavendish in 1798.)`,
              prompt: r`On Mars, $g = 3.71$ m/s² and $R = 3.39 \times 10^6$ m. With $G = 6.67 \times 10^{-11}$, what is Mars's mass, in units of $10^{23}$ kg?`,
              unit: r`$\times 10^{23}$ kg`,
              answer: (3.71 * 3.39e6 ** 2) / 6.67e-11 / 1e23,
              tol: 0.05,
              wrong: [{ v: (3.71 * 3.39e6) / 6.67e-11 / 1e23, tol: 0.0001, why: r`Square the radius: $M = gR^2/G$.` }],
              explain: r`$M = \frac{gR^2}{G} = \frac{3.71 \times (3.39 \times 10^6)^2}{6.67 \times 10^{-11}} \approx 6.4 \times 10^{23}$ kg, about a tenth of Earth's mass (the modern value is $6.42 \times 10^{23}$ kg). The same formula weighs any world whose size and surface gravity we can measure, including Earth itself, as a later lesson shows.`,
            },
          ],
          recap: [
            r`Surface gravity $g = GM/R^2$: more mass pulls harder, a bigger radius pulls weaker.`,
            'Mass is the same everywhere. Weight = mg changes from world to world.',
            'Measuring G made it possible to weigh the Earth.',
          ],
        },
      ],
    },
    {
      title: 'Orbits',
      summary: 'Falling around the world.',
      lessons: [
        {
          id: 'cannonball',
          title: 'Newton’s Cannonball',
          summary: 'Fast enough to keep missing',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Fire!',
              body: r`Newton imagined a cannon on top of an enormous mountain. Ours is 500 km tall, about where the Space Station flies, and there's no air. Fire at different speeds and watch where the cannonball goes.`,
              widget: {
                kind: 'orbit', r0: R0, unitSpeed: V_UNIT, view: 3.4, height: 420, ready: true,
                params: { v: { min: 0.3, max: 1.5, step: 0.01, value: 0.6, label: '$v$' } },
                readout: (p, res) => (res ? (res.kind === 'crash' ? 'It curved around the planet a little, then hit the ground.' : res.kind === 'escape' ? 'Escaped into space!' : `It came all the way around: ${res.shape === 'circle' ? 'a circular orbit' : 'an elliptical orbit'}!`) : 'Press **Fire**.'),
              },
              after: 'Slow shots fall back. Faster shots land farther away, because the planet curves away beneath them. Fast enough, and the ground curves away as fast as the ball falls: it never lands. Faster still, it escapes.',
            },
            {
              type: 'interactive',
              title: 'A perfect circle',
              body: r`Find the launch speed that gives a **circular** orbit, one that stays at the same height all the way around.`,
              widget: {
                kind: 'orbit', r0: R0, unitSpeed: V_UNIT, view: 3.4, height: 420, needRun: true, preview: false,
                params: { v: { min: 0.7, max: 1.2, step: 0.01, value: 0.8, label: '$v$' } },
                readout: (p, res) => (res ? { crash: 'It fell back to the ground. Try faster.', escape: 'Too fast: it escaped!', circle: 'A perfect circular orbit!', ellipse: 'An ellipse: it comes all the way around, but its height changes.' }[res.shape] : `Launch speed: ${f2(p.v * V_UNIT)} km/s`),
                goal: (p, res) => (res && res.shape === 'circle' ? true : { ok: false, msg: !res ? 'Fire first!' : res.shape === 'ellipse' ? (p.v > 1 / Math.sqrt(R0) ? 'Elliptical: the orbit swings farther out. Try a little slower.' : 'Elliptical: the orbit dips closer in. Try a little faster.') : res.kind === 'crash' ? 'It fell back. Try faster.' : 'It escaped. Try much slower.' }),
                solution: { v: 0.96 },
              },
              explain: r`A circular orbit needs exactly the speed where gravity provides the pull needed to curve the path into a circle: $v = \sqrt{GM/r}$. At 500 km up, that's about **7.6 km/s**, roughly 27,000 km/h.`,
            },
            {
              type: 'explain',
              title: 'Orbital speed',
              body: r`Moving in a circle of radius $r$ at speed $v$ needs a **centripetal** (centre-pointing) acceleration of $\frac{v^2}{r}$. For an orbit, gravity supplies it:
$$\frac{GM}{r^2} = \frac{v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{GM}{r}}$$
Notice that the satellite's mass cancels out. A tennis ball and a space station at the same height orbit at the same speed.`,
            },
            {
              type: 'mcq',
              title: 'Higher orbit',
              prompt: 'Compared with a low orbit, a satellite in a higher circular orbit moves…',
              cols: 2,
              choices: [
                { t: 'More slowly', ok: true },
                { t: 'Faster', why: r`$v = \sqrt{GM/r}$: a larger $r$ means a smaller $v$. Gravity is weaker up there, so less speed is needed.` },
                { t: 'At the same speed', why: r`The orbital speed depends on $r$.` },
              ],
              explain: r`Higher means weaker gravity, so a slower speed balances it. The Space Station (about 400 km up) does a lap in roughly 90 minutes. The Moon (384,000 km away) takes about 27 days.`,
            },
            {
              type: 'numeric',
              title: 'The space station’s speed',
              prompt: r`The ISS orbits 400 km up, 6,771 km from Earth’s centre. Its speed is $\sqrt{\frac{GM}{r}}$ with $GM = 3.986 \times 10^{14}$ m³/s². What is it, in km/s? (2 decimal places.)`,
              unit: 'km/s',
              answer: Math.sqrt(3.986e14 / 6.771e6) / 1000,
              tol: 0.01,
              explain: r`About 7.67 km/s, once round the Earth every 92 minutes. That’s Newton’s cannonball, fired fast enough to keep missing the ground.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Geostationary',
              body: r`Communication satellites in **geostationary** orbit take exactly one day to go around, so they stay above the same spot on Earth. Their orbit radius is about 42,000 km.`,
              prompt: 'Roughly how fast do they travel, in km/s? (Speed = circumference ÷ time, and 1 day = 86,400 s.)',
              unit: 'km/s',
              answer: (2 * Math.PI * 42000) / 86400,
              tol: 0.05,
              wrong: [{ v: 42000 / 86400, tol: 0.01, why: r`The distance around is the circumference, $2\pi r$, not $r$.` }],
              explain: r`$v = \frac{2\pi r}{T} = \frac{2\pi \times 42{,}000}{86{,}400} \approx 3.1$ km/s, much slower than the Space Station's 7.7 km/s, just as $v = \sqrt{GM/r}$ predicts for a higher orbit.`,
            },
          ],
          recap: [
            'An orbit is free fall with enough sideways speed to keep missing the ground.',
            r`Circular orbit speed: $v = \sqrt{GM/r}$, independent of the satellite's mass.`,
            'Higher orbits are slower, and take longer.',
          ],
        },
        {
          id: 'kepler',
          title: 'Kepler’s Laws',
          summary: 'Ellipses, equal areas, and T² ∝ a³',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Not quite a circle',
              prompt: 'What shape are the orbits of the planets around the Sun?',
              cols: 2,
              choices: [
                { t: 'Ellipses', ok: true },
                { t: 'Perfect circles', why: 'Most are close to circles, but not exactly. Johannes Kepler showed in 1609 that Mars moves on an ellipse.' },
                { t: 'Spirals', why: 'Planets come back to the same path every orbit.' },
              ],
              explain: r`Kepler's **first law** (1609): planets move in ellipses, with the Sun at one **focus** (not at the centre). Earth's orbit is nearly circular, but Mars's is noticeably stretched.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Equal areas in equal times',
              body: r`Launch a planet from its farthest point. The coloured wedges are each swept out in the **same amount of time**.`,
              widget: {
                kind: 'orbit', r0: 4, view: 4.6, height: 420, sun: true, planetClass: 'fl-amber', showKepler: true, sweepEvery: 3.5, speed: 6, ready: true,
                params: { v: { min: 0.32, max: 0.5, step: 0.01, value: 0.36, label: '$v$', format: (v) => `${v.toFixed(2)}` } },
                readout: () => 'Wedges near the Sun are short and wide. Far away they are long and thin.',
              },
              after: r`Kepler's **second law**: a line from the Sun to a planet sweeps out equal areas in equal times. So planets move **fastest when closest** to the Sun and slowest when farthest. Earth is fastest in early January, at its closest approach.`,
            },
            {
              type: 'mcq',
              title: 'Comet speed',
              prompt: 'A comet on a long, stretched orbit swings close to the Sun, then travels far out. Where does it move fastest?',
              choices: [
                { t: 'At its closest point to the Sun', ok: true },
                { t: 'At its farthest point', why: 'Far from the Sun it crawls. Equal areas mean the long, thin wedges take just as long as the short, wide ones near the Sun.' },
                { t: 'It moves at a constant speed', why: 'Only circular orbits have constant speed.' },
              ],
              explain: r`Near the Sun, the comet has to sweep a wide wedge quickly, so it races. Energy tells the same story: falling inward converts potential energy into kinetic energy. Halley's comet moves about 60 times faster at its closest point than at its farthest.`,
            },
            {
              type: 'explain',
              title: 'The third law',
              body: r`Kepler's **third law** (1619) links the size of an orbit to its period. If $T$ is measured in years and $a$ (half the longest width of the ellipse) in AU (Earth's average distance from the Sun):
$$T^2 = a^3$$
Newton later derived it from his law of gravity. For a circular orbit, $v = \sqrt{GM/r}$ and $T = 2\pi r/v$, which gives $T^2 \propto r^3$.`,
            },
            {
              type: 'numeric',
              title: 'Year on Mars',
              prompt: 'Mars orbits at about 1.52 AU. How long is a Martian year, in Earth years?',
              unit: 'years',
              answer: Math.sqrt(1.52 ** 3),
              tol: 0.02,
              wrong: [
                { v: 1.52, tol: 0.01, why: r`$T^2 = a^3$, so $T = a^{3/2}$, not $a$.` },
                { v: 1.52 ** 3, tol: 0.02, why: r`That's $T^2$. Take the square root.` },
              ],
              explain: r`$T = \sqrt{1.52^3} = \sqrt{3.51} \approx 1.87$ years. The measured value is 1.88 years.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Distant planet',
              prompt: 'A planet takes 8 years to orbit the Sun. How far out is it, in AU?',
              unit: 'AU',
              answer: 4,
              wrong: [
                { v: 8, why: r`$a^3 = T^2 = 64$, so $a = \sqrt[3]{64}$.` },
                { v: 64, why: r`That's $a^3$. Take the cube root.` },
                { v: Math.sqrt(8), tol: 0.01, why: r`$a = T^{2/3}$, not $T^{1/2}$.` },
              ],
              explain: r`$a^3 = T^2 = 64$, so $a = 4$ AU. (That's between Mars and Jupiter, in the asteroid belt.)`,
            },
          ],
          recap: [
            'First law: orbits are ellipses, with the Sun at one focus.',
            'Second law: equal areas in equal times, so planets are fastest when closest.',
            r`Third law: $T^2 = a^3$ (in years and AU). It follows from Newton's gravity.`,
          ],
        },
        {
          id: 'escape',
          title: 'Escape Velocity',
          summary: 'Leaving for good',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Throw it hard enough',
              prompt: 'Ignoring air resistance, can you throw something so fast that it never comes back down?',
              choices: [
                { t: 'Yes, above a certain speed it escapes forever', ok: true },
                { t: 'No, gravity always pulls it back eventually', why: 'Gravity weakens with distance. Fast enough, and it slows the object down but never stops it.' },
                { t: 'Only if it reaches the Moon', why: 'Escape doesn’t depend on reaching anything. It depends on speed versus gravity.' },
              ],
              explain: r`Because gravity weakens as $1/r^2$, the total "uphill" energy needed to climb all the way out is **finite**. Launch with more kinetic energy than that, and the object coasts away forever, slowing but never stopping.`,
            },
            {
              type: 'interactive',
              title: 'Break free',
              body: r`Back to our cannon. Find a launch speed that makes the cannonball **escape**.`,
              widget: {
                kind: 'orbit', r0: R0, unitSpeed: V_UNIT, view: 3.4, height: 420, needRun: true,
                params: { v: { min: 0.9, max: 1.6, step: 0.01, value: 1.1, label: '$v$' } },
                readout: (p, res) => (res ? { crash: 'Fell back.', escape: 'Escaped!', circle: 'Orbiting, but not escaping.', ellipse: 'A long ellipse, but it still comes back. Faster!' }[res.shape] : `Launch speed: ${f2(p.v * V_UNIT)} km/s`),
                goal: (p, res) => (res && res.kind === 'escape' ? true : { ok: false, msg: !res ? 'Fire first!' : 'It came back. Try faster.' }),
                solution: { v: 1.45 },
              },
              explain: r`From this height, escape takes about **10.8 km/s**. Anything slower traces an ellipse and comes back. That's exactly $\sqrt2 \approx 1.41$ times the circular orbit speed.`,
            },
            {
              type: 'explain',
              title: 'The escape speed formula',
              body: r`The energy needed to climb from distance $R$ all the way out of a planet's gravity is $\frac{GMm}{R}$. Set the kinetic energy equal to it:
$$\tfrac12 m v^2 = \frac{GMm}{R} \quad\Rightarrow\quad v_\text{esc} = \sqrt{\frac{2GM}{R}} = \sqrt2 \times v_\text{orbit}$$
From Earth's surface, $v_\text{esc} \approx 11.2$ km/s, about 40,000 km/h.`,
            },
            {
              type: 'numeric',
              title: 'Compare',
              prompt: 'Close to Earth’s surface, circular orbit speed is about 7.9 km/s. What is the escape speed?',
              unit: 'km/s',
              answer: 7.9 * Math.SQRT2,
              tol: 0.05,
              wrong: [{ v: 15.8, tol: 0.05, why: r`It's $\sqrt2$ times the orbit speed, not 2 times.` }],
              explain: r`$v_\text{esc} = \sqrt2 \times 7.9 \approx 11.2$ km/s.`,
            },
            {
              type: 'mcq',
              title: 'The Moon’s missing air',
              prompt: 'Why does the Moon have almost no atmosphere, while Earth does?',
              choices: [
                { t: 'Its escape speed is low (2.4 km/s), so fast-moving gas molecules escape', ok: true },
                { t: 'The Moon is too cold for gas', why: 'Cold actually helps keep gases. The main issue is the Moon’s weak gravity.' },
                { t: 'The Moon is too far from the Sun', why: 'The Moon and Earth are the same distance from the Sun.' },
              ],
              explain: r`Gas molecules zip around at hundreds of metres per second, and a few go much faster. With an escape speed of only 2.4 km/s, the Moon slowly leaked away whatever gases it had. Earth's 11.2 km/s holds on to nitrogen and oxygen (though it has lost most of its hydrogen and helium).`,
            },
            {
              type: 'explain',
              kicker: 'Big picture',
              title: 'Black holes',
              body: r`Squeeze a mass into a small enough radius and its escape speed exceeds the speed of light, $c$. Setting $v_\text{esc} = c$ gives the **Schwarzschild radius**:
$$R_s = \frac{2GM}{c^2}$$
Nothing, not even light, can escape from inside it: that's a **black hole**. To become one, Earth would have to be crushed into a ball with a radius of about 9 mm, roughly the size of a marble. (The correct derivation needs Einstein's general relativity, but it gives the same formula.)`,
            },
          ],
          recap: [
            r`Escape speed $v_\text{esc} = \sqrt{2GM/R} = \sqrt2 \times$ the circular orbit speed.`,
            'About 11.2 km/s from Earth and 2.4 km/s from the Moon.',
            'When the escape speed exceeds the speed of light, you have a black hole.',
          ],
        },
      ],
    },
    {
      title: 'Satellites and Scales',
      summary: 'Useful orbits, and weighing planets.',
      lessons: [
        {
          id: 'satellites',
          title: 'Satellite Orbits',
          summary: 'Low, medium and geostationary',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Speed and period',
              body: r`For a circular orbit of radius $r$ around a planet of mass $M$, gravity provides exactly the centripetal force:
$$\frac{GMm}{r^2} = \frac{mv^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{GM}{r}}, \qquad T = 2\pi\sqrt{\frac{r^3}{GM}}$$
Higher orbits are **slower** and take **longer**. Remember $r$ is measured from the planet's **centre**: add the planet's radius to the altitude.`,
            },
            {
              type: 'numeric',
              title: 'The Space Station',
              prompt: r`The International Space Station orbits about 400 km up. How long does one orbit take, in minutes? (Earth's radius 6,371 km, $GM = 3.99 \times 10^{14}$ m³/s²; nearest minute.)`,
              unit: 'min',
              answer: Math.round(orbitHours(400) * 60),
              tol: 1,
              wrong: [{ v: Math.round((2 * Math.PI * Math.sqrt((4e5) ** 3 / (GN * ME))) / 60), tol: 2, why: 'Use the distance from Earth’s centre: 6,771 km.' }],
              explain: r`$T = 2\pi\sqrt{\frac{(6.771 \times 10^6)^3}{3.99 \times 10^{14}}} \approx 5{,}540$ s $\approx 92$ minutes. The crew see about 16 sunrises a day, travelling at nearly 7.7 km/s.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Geostationary',
              prompt: r`A satellite that orbits once per sidereal day (23.93 hours) above the equator stays over the same spot on Earth. Drag to find its altitude.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50000, ymin: 0, ymax: 40, grid: 5000, gridY: 5, height: 260, padL: 44, axes: { xlabel: 'altitude (km)', ylabel: 'period (hours)', xfmt: (v) => `${v / 1000}k` },
                params: { h: { min: 200, max: 50000, step: 10, value: 20000, slider: false } },
                curves: [{ f: (h) => orbitHours(h), color: 'violet', width: 3 }, { f: () => 23.93, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.h, y: (p) => orbitHours(p.h), drag: { x: 'h' }, color: 'teal' }],
                readout: (p) => r`altitude ${p.h.toLocaleString('en-GB')} km: period $${orbitHours(p.h).toFixed(2)}$ h, speed $${(Math.sqrt(GN * ME / (RE + p.h * 1e3)) / 1000).toFixed(2)}$ km/s`,
                goal: (p) => Math.abs(orbitHours(p.h) - 23.93) < 0.02,
                hint: r`Solve $r^3 = \frac{GMT^2}{4\pi^2}$, then subtract Earth's radius.`,
                solution: { h: 35790 },
              },
              explain: r`About **35,790 km** up (42,160 km from Earth's centre). Arthur C. Clarke popularised the idea of using such orbits for communications in 1945. Satellite TV dishes point at a fixed spot in the sky because the satellite seems to hang there.`,
            },
            {
              type: 'mcq',
              title: 'Why over the equator?',
              prompt: r`Why must a geostationary satellite orbit above the equator, not above, say, London?`,
              choices: [
                { t: 'Every orbit is centred on Earth’s centre; only an equatorial orbit stays in the plane of Earth’s spin', ok: true },
                { t: 'Gravity is weaker over the equator', why: 'The small difference doesn’t matter. The orbit must circle Earth’s centre.' },
                { t: 'It could hover over London if it went fast enough', why: 'An orbit tilted towards London would swing north and south of the equator each day.' },
              ],
              explain: r`An orbit's plane passes through Earth's centre. A tilted 24-hour orbit traces a figure-of-eight in the sky. To hover over a fixed point, the orbit must lie in the equatorial plane, which is why geostationary satellites appear low in the southern sky from the UK.`,
            },
            {
              type: 'numeric',
              title: 'GPS satellites',
              prompt: r`GPS satellites orbit twice per sidereal day (period 11.97 h). Using Kepler's third law ($r \propto T^{2/3}$), how does their orbital radius compare with the geostationary radius (42,160 km)? Give it in thousands of km. (Nearest thousand.)`,
              unit: 'thousand km',
              answer: Math.round(42.16 * 0.5 ** (2 / 3)),
              tol: 0.6,
              wrong: [{ v: 21, why: r`Halving the period divides the radius by $2^{2/3} \approx 1.59$, not 2.` }],
              explain: r`$42{,}160 \times 2^{-2/3} \approx 26{,}560$ km from the centre, about 20,200 km up: the medium Earth orbits used by navigation systems.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Catching up',
              prompt: r`A spacecraft trails the Space Station by a few kilometres in the same orbit. To catch up, which way should it fire its engine first?`,
              choices: [
                { t: 'Backwards (to slow down), dropping into a lower, faster orbit', ok: true },
                { t: 'Forwards (to speed up), obviously', why: 'Speeding up raises the orbit, which is slower: it would fall further behind.' },
                { t: 'Straight towards the station', why: 'Orbital mechanics isn’t that simple: thrust changes the orbit’s shape.' },
              ],
              explain: r`Slowing down drops you to a lower orbit with a shorter period, so you gain on the target; then you speed up to rise back to its altitude. Gemini 4's astronauts discovered this the hard way in 1965 when they tried to fly straight at their target and kept drifting away.`,
            },
            { /*anim:gravity*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Slow down to catch up',
              body: r`The {coral:chaser} is 40° behind the {blue:target} in the same circular orbit. Watch what happens when it fires its engine **backwards**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 420,
                animate: { param: 't', speed: 1.1, max: 10, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { gap, Tp, ellipse, t0 } = PHASE, t = p.t, els = [];
                  const target = [Math.cos(gap + t), Math.sin(gap + t)];
                  let chaser, burn = false;
                  if (t < t0) chaser = [Math.cos(t), Math.sin(t)];
                  else if (t < t0 + Tp) { const q = ellipse(t - t0); const a0 = t0; chaser = [q[0] * Math.cos(a0) - q[1] * Math.sin(a0), q[0] * Math.sin(a0) + q[1] * Math.cos(a0)]; burn = t - t0 < 0.25; }
                  else chaser = [Math.cos(t - Tp), Math.sin(t - Tp)];
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 2 }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(0.3) - plot.X(0), class: 'fl-teal', opacity: 0.8 }));
                  // the phasing ellipse
                  const pts = [];
                  for (let i = 0; i <= 120; i++) { const q = ellipse((Tp * i) / 120); pts.push([q[0] * Math.cos(t0) - q[1] * Math.sin(t0), q[0] * Math.sin(t0) + q[1] * Math.cos(t0)]); }
                  if (t >= t0) els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  els.push(s('circle', { cx: plot.X(target[0]), cy: plot.Y(target[1]), r: 9, class: 'fl-blue', stroke: 'var(--card)', 'stroke-width': 2 }));
                  els.push(s('circle', { cx: plot.X(chaser[0]), cy: plot.Y(chaser[1]), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 }));
                  if (burn) els.push(s('circle', { cx: plot.X(chaser[0]), cy: plot.Y(chaser[1]), r: 16, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 3 }));
                  return els;
                },
                readout: (p) => {
                  const { gap, Tp, ellipse, t0 } = PHASE, t = p.t;
                  if (t < t0) return 'same orbit, same speed: the gap stays at 40°';
                  if (t >= t0 + Tp) return '**rendezvous!** A forward burn puts the chaser back on the circle, right beside the target';
                  const q = ellipse(t - t0), ang = Math.atan2(q[1], q[0]) + t0, d = ((((gap + t - ang) * 180) / Math.PI) % 360 + 360) % 360;
                  return `braked into a lower orbit: it's falling inwards and speeding up · gap ${fix(d > 180 ? d - 360 : d, 0)}°`;
                },
              },
              after: r`Braking at one point of the orbit lowers the **opposite** side of the orbit. The chaser drops inwards, speeds up as it falls, and its new, smaller orbit takes less time to go round. One lap later it arrives back at the burn point exactly when the target does. Speeding up would have done the opposite: a bigger, slower orbit, and the target would pull further ahead.`,
            },
          ],
          recap: [
            r`Orbit speed $v = \sqrt{GM/r}$ and period $T = 2\pi\sqrt{r^3/GM}$: higher is slower.`,
            'Low orbits take about 90 minutes; geostationary orbits sit 35,790 km above the equator.',
            'To catch up in orbit, first slow down.',
          ],
        },
        {
          id: 'weighing',
          title: 'Weighing Worlds',
          summary: 'From a lab balance to Jupiter',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Measuring G',
              body: r`Newton's law $F = \frac{GMm}{r^2}$ contains a constant $G$ that Newton never knew. In 1798, Henry Cavendish measured it with a **torsion balance**: two small lead balls on a rod hung from a thin wire, with two large lead balls nearby. Their tiny gravitational pull twisted the wire, by an amount he could measure through a telescope from outside the room (to avoid disturbing the air).

His result gives $G \approx 6.67 \times 10^{-11}$ N m²/kg².`,
            },
            {
              type: 'numeric',
              title: 'A tiny force',
              prompt: r`A 158 kg lead ball sits 0.23 m (centre to centre) from a 0.73 kg ball. What's the gravitational force between them, in units of $10^{-7}$ N? (2 decimal places.)`,
              unit: r`$\times 10^{-7}$ N`,
              answer: (GN * 158 * 0.73) / 0.23 ** 2 / 1e-7,
              tol: 0.01,
              wrong: [{ v: (GN * 158 * 0.73) / 0.23 / 1e-7, tol: 0.02, why: 'Square the distance.' }],
              explain: r`$F = \frac{6.67 \times 10^{-11} \times 158 \times 0.73}{0.23^2} \approx 1.46 \times 10^{-7}$ N: about the weight of a grain of sand. Cavendish had to shield his apparatus from draughts and temperature changes to measure it.`,
            },
            {
              type: 'numeric',
              title: 'Weighing the Earth',
              prompt: r`Knowing $G$, you can weigh the Earth: at its surface, $g = \frac{GM}{R^2}$. With $g = 9.8$ m/s² and $R = 6.37 \times 10^6$ m, find $M$ in units of $10^{24}$ kg. (2 decimal places.)`,
              unit: r`$\times 10^{24}$ kg`,
              answer: (9.8 * 6.37e6 ** 2) / GN / 1e24,
              tol: 0.02,
              wrong: [{ v: (9.8 * 6.37e6) / GN / 1e24, tol: 0.02, why: r`$M = \frac{gR^2}{G}$: square the radius.` }],
              explain: r`$M = \frac{9.8 \times (6.37 \times 10^6)^2}{6.67 \times 10^{-11}} \approx 5.96 \times 10^{24}$ kg. Cavendish's experiment was famously described as "weighing the world".`,
            },
            {
              type: 'numeric',
              title: 'Earth’s density',
              prompt: r`Earth's volume is about $1.08 \times 10^{21}$ m³. What's its average density, in kg/m³? (Nearest 10.)`,
              unit: 'kg/m³',
              answer: Math.round(5.97e24 / 1.08e21 / 10) * 10,
              tol: 10,
              wrong: [{ v: 1810, tol: 20, why: 'Divide mass by volume: 5.97 × 10²⁴ ÷ 1.08 × 10²¹.' }],
              explain: r`$\frac{5.97 \times 10^{24}}{1.08 \times 10^{21}} \approx 5{,}530$ kg/m³, twice the density of surface rocks (about 2,700). So Earth's interior must be much denser: it has a heavy iron core.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Weighing Jupiter',
              prompt: r`Jupiter's moon Io orbits 421,700 km from Jupiter's centre, once every **1.769 days**. Adjust Jupiter's mass until the predicted orbital period matches.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 3, ymin: 0, ymax: 4, grid: 0.25, gridY: 0.5, height: 260, axes: { xlabel: 'Jupiter’s mass (× 10²⁷ kg)', ylabel: 'Io’s period (days)', xAt: 0.5 },
                params: { M: { min: 0.5, max: 3, step: 0.01, value: 1, slider: false } },
                curves: [{ f: (M) => ioDays(M), color: 'violet', width: 3 }, { f: () => 1.769, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.M, y: (p) => ioDays(p.M), drag: { x: 'M' }, color: 'teal' }],
                readout: (p) => r`$M = ${p.M.toFixed(2)} \times 10^{27}$ kg: Io would orbit every $${ioDays(p.M).toFixed(3)}$ days`,
                goal: (p) => Math.abs(ioDays(p.M) - 1.769) < 0.006,
                hint: r`$M = \frac{4\pi^2 r^3}{G T^2}$.`,
                solution: { M: 1.9 },
              },
              explain: r`$M \approx 1.9 \times 10^{27}$ kg, about 318 Earths. Any moon (or spacecraft) orbiting a body reveals its mass this way; it's how we know the masses of planets, stars and the black hole at the centre of our galaxy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Weighing the Sun',
              prompt: r`Earth orbits the Sun at $1.5 \times 10^{11}$ m once a year ($3.16 \times 10^7$ s). Find the Sun's mass, in units of $10^{30}$ kg. (2 decimal places.)`,
              unit: r`$\times 10^{30}$ kg`,
              answer: (4 * Math.PI ** 2 * 1.5e11 ** 3) / (GN * 3.16e7 ** 2) / 1e30,
              tol: 0.02,
              wrong: [{ v: (4 * Math.PI ** 2 * 1.5e11 ** 2) / (GN * 3.16e7 ** 2) / 1e30, tol: 0.02, why: 'Cube the radius.' }],
              explain: r`$M = \frac{4\pi^2 (1.5 \times 10^{11})^3}{6.67 \times 10^{-11} \times (3.16 \times 10^7)^2} \approx 2.0 \times 10^{30}$ kg, about 330,000 Earths. The Sun holds over 99.8% of the Solar System's mass.`,
            },
          ],
          recap: [
            'Cavendish’s torsion balance measured G in 1798.',
            r`Surface gravity gives a planet's mass: $M = gR^2/G$; Earth's density shows a dense core.`,
            r`Any orbit reveals the central mass: $M = 4\pi^2 r^3 / (GT^2)$.`,
          ],
        },
      ],
    },
  ],
};
