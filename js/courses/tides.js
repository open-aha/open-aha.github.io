const r = String.raw;
const D = Math.PI / 180;

// combined tidal range for Moon–Sun angle phi (Sun's effect 0.46 of the Moon's)
const tideRange = (phi) => Math.sqrt(1 + 0.46 ** 2 + 2 * 0.46 * Math.cos(2 * phi * D));
// quarter-wave resonance period (hours) of a bay of length L km and depth 70 m
const bayPeriod = (L) => (4 * L * 1000) / Math.sqrt(9.8 * 70) / 3600;

export default {
  id: 'tides',
  subject: 'physics',
  title: 'Tides & Spinning Worlds',
  level: 'Intermediate',
  cover: 'tides',
  tagline: 'Why there are two high tides a day, why the Moon shows one face, and how a pendulum proves the Earth turns.',
  description: r`Gravity doesn't just hold planets in orbit: it stretches them. Discover why the oceans bulge on both sides of the Earth, how the Sun and Moon team up for spring tides, why the Moon is slowly drifting away, and what really happens on a spinning planet, from hurricanes to Foucault's pendulum. Finally, see why some bays have giant tides and how tide tables are predicted.`,
  prereq: 'Gravity & Orbits',
  chapters: [
    {
      title: 'Tides',
      summary: 'Gravity that stretches.',
      lessons: [
        {
          id: 'tidalforce',
          title: 'The Tidal Force',
          summary: 'Two bulges, not one',
          icon: 'moon',
          steps: [
            {
              type: 'explain',
              title: 'Gravity that varies',
              body: r`The Moon pulls on every part of the Earth, but not equally: the near side is about 6,400 km closer than the centre, and the far side 6,400 km further away. Gravity weakens with distance, so the near side is pulled a little **more** than the centre, and the far side a little **less**.

What matters for tides is the **difference** between the pull on each part of the Earth and the pull on its centre. That difference is the **tidal force**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Stretching the Earth',
              body: r`The arrows show the tidal force at points around the Earth (the Moon is to the right, not to scale). Change the Moon's distance.`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 4, ymin: -1.7, ymax: 1.7, grid: false, axes: false, equal: true, height: 300,
                params: { d: { min: 40, max: 90, step: 5, value: 60, label: 'Moon distance', color: 'violet', format: (v) => `${v} Earth radii` } },
                extra: ({ plot, p, s, arrow }) => {
                  const k = (60 / p.d) ** 3, u = plot.X(1) - plot.X(0);
                  const els = [
                    s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: (1 + 0.12 * k) * u, ry: (1 - 0.06 * k) * u, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 0.82 * u, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2.5 }),
                    s('circle', { cx: plot.X(3.3), cy: plot.Y(0), r: 0.27 * u, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('text', { x: plot.X(3.3), y: plot.Y(-0.5), class: 'lbl', 'text-anchor': 'middle', text: 'Moon' }),
                  ];
                  for (let i = 0; i < 16; i++) {
                    const th = (i * 22.5) * D, x = 0.82 * Math.cos(th), y = 0.82 * Math.sin(th);
                    const ax = 2 * Math.cos(th) * 0.3 * k, ay = -Math.sin(th) * 0.3 * k;
                    els.push(arrow(plot.X(x), plot.Y(y), plot.X(x + ax), plot.Y(y + ay), { color: 'var(--coral)', width: 3, head: 9 }));
                  }
                  return els;
                },
                readout: (p) => r`tidal force $\propto \dfrac{1}{d^3}$: $\;$ ${((60 / p.d) ** 3).toFixed(2)}$\times$ today's strength`,
              },
              after: r`The tidal force stretches the Earth along the Earth–Moon line and squeezes it at the sides. So the oceans bulge **towards** the Moon and **away** from it. As the Earth spins, a coastline passes through both bulges: about **two high tides a day**.`,
            },
            {
              type: 'explain',
              title: 'An inverse cube',
              body: r`The Moon's gravity at distance $d$ is $\frac{GM}{d^2}$. The difference across the Earth (radius $R$) is roughly the rate of change times $R$:
$$a_{\text{tidal}} \approx \frac{2GMR}{d^3}$$
Gravity falls off as $\frac{1}{d^2}$, but tidal forces fall off **faster**, as $\frac{1}{d^3}$.`,
            },
            {
              type: 'numeric',
              title: 'Twice as far',
              prompt: r`If the Moon were twice as far away, how many times weaker would the tides be?`,
              unit: '×',
              answer: 8,
              wrong: [{ v: 4, why: r`That's how much weaker the Moon's **gravity** would be. Tidal force goes as $\frac{1}{d^3}$.` }, { v: 2, why: r`Tidal force falls as $\frac{1}{d^3}$: $2^3 = 8$.` }],
              explain: r`$2^3 = 8$ times weaker. The steep $\frac{1}{d^3}$ dependence is why the nearby Moon beats the massive Sun at raising tides.`,
            },
            {
              type: 'mcq',
              title: 'Why two bulges?',
              prompt: r`The Moon pulls the near side of Earth more than the centre, and the centre more than the far side. Why does this make **two** tidal bulges, not one?`,
              choices: [
                { t: r`Relative to Earth’s centre, the near side is pulled towards the Moon and the far side is "left behind", away from it`, ok: true },
                { t: r`The Sun makes the second bulge`, why: r`The Sun makes its own pair of bulges; the Moon alone makes two.` },
                { t: r`Earth’s spin flings water outward on the far side`, why: r`Spin is not the cause; it’s the difference in the Moon’s pull across Earth.` },
              ],
              explain: r`Tides come from the **difference** in gravity across Earth. The ocean nearest the Moon is pulled ahead of Earth’s centre; the centre is pulled ahead of the far ocean. Both sides bulge outward, giving two high tides a day.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sun versus Moon',
              prompt: r`The Sun is $2.7 \times 10^7$ times as massive as the Moon, but 389 times as far away. What's the Sun's tidal effect on Earth as a fraction of the Moon's? (2 decimal places.)`,
              answer: 2.7e7 / 389 ** 3,
              tol: 0.01,
              wrong: [{ v: 2.7e7 / 389 ** 2, tol: 2, why: r`That's the ratio of their **gravitational pulls** on Earth (the Sun's is far stronger). Tides go as $\frac{M}{d^3}$.` }],
              explain: r`$\dfrac{2.7 \times 10^7}{389^3} \approx 0.46$. The Sun's pull on Earth is about 180 times stronger than the Moon's, yet its tidal effect is less than half as big, because it's so far away that its gravity hardly changes across the Earth.`,
            },
          ],
          recap: [
            'Tidal force is the difference in gravity across a body.',
            r`It falls off as $\frac{1}{d^3}$, faster than gravity itself.`,
            'It stretches the Earth into two bulges: towards and away from the Moon.',
          ],
        },
        {
          id: 'springneap',
          title: 'Spring & Neap Tides',
          summary: 'Teamwork in the sky',
          icon: 'sun',
          steps: [
            {
              type: 'mcq',
              title: 'Lining up',
              prompt: r`At new moon and full moon, the Sun, Earth and Moon are in a line. What happens to the tides?`,
              choices: [
                { t: 'The Sun’s and Moon’s bulges line up, giving extra-large spring tides', ok: true },
                { t: 'They cancel, because the Sun and Moon pull in opposite directions at full moon', why: 'Each body raises bulges on **both** sides of the Earth, so at full moon the bulges still line up.' },
                { t: 'Nothing: the Sun has no tidal effect', why: 'The Sun’s tidal effect is about 46% of the Moon’s.' },
              ],
              explain: r`Because each body stretches the Earth along its line (in both directions), it doesn't matter whether the Sun and Moon are on the same side or opposite sides. Twice a month the effects add, giving **spring tides** (nothing to do with the season: they "spring up"). At first and last quarter, the Sun's stretch is at right angles to the Moon's and partly cancels it: **neap tides**.`,
            },
            {
              type: 'numeric',
              title: 'High versus low range',
              prompt: r`Using the Sun's tidal effect as 0.46 of the Moon's, how many times larger is a spring tide than a neap tide? (1 decimal place.)`,
              unit: '×',
              answer: 1.46 / 0.54,
              tol: 0.06,
              wrong: [{ v: 1.46, tol: 0.03, why: 'That’s the spring tide alone. A neap tide is 1 − 0.46 = 0.54. Divide the two.' }],
              explain: r`Spring: $1 + 0.46 = 1.46$. Neap: $1 - 0.46 = 0.54$. Ratio $\approx 2.7$. In practice, local coastlines and ocean basins make real tides much more complicated (the Bay of Fundy's resonance gives tides of over 15 m), but this rhythm shows up everywhere.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The weakest tides',
              prompt: r`The angle between the directions of the Moon and the Sun (seen from Earth) changes through the month. Find the angle that gives the **smallest** tidal range.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 180, ymin: 0, ymax: 1.6, grid: 30, gridY: 0.25, height: 260, axes: { xlabel: 'Moon–Sun angle (°)', ylabel: 'tidal range (Moon alone = 1)' },
                params: { phi: { min: 0, max: 180, step: 5, value: 30, slider: false } },
                curves: [{ f: (x) => tideRange(x), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.phi, y: (p) => tideRange(p.phi), drag: { x: 'phi' }, color: 'coral' }],
                readout: (p) => `angle ${p.phi}°: range ${tideRange(p.phi).toFixed(2)} ${p.phi === 0 ? '(new moon: spring tide)' : p.phi === 180 ? '(full moon: spring tide)' : p.phi === 90 ? '(quarter moon: neap tide)' : ''}`,
                goal: (p) => p.phi === 90,
                hint: 'The Sun’s bulge is worst aligned with the Moon’s when they’re at right angles.',
                solution: { phi: 90 },
              },
              explain: r`At 90° (first or last quarter), the Sun's bulges sit where the Moon's low tides are, partly cancelling: range $1 - 0.46 = 0.54$. At 0° and 180°, they add to 1.46. The pattern repeats twice a month.`,
            },
            {
              type: 'numeric',
              title: 'Later every day',
              prompt: r`High tides follow the Moon, which goes round the Earth once every 29.5 days (relative to the Sun) in the same direction that Earth spins. So each day, the Earth has to turn a little extra to face the Moon again. About how many minutes later is the tide each day?`,
              unit: 'minutes',
              answer: 1440 / 28.5,
              tol: 3,
              wrong: [{ v: 12, tol: 1, why: r`In one day the Moon moves about $12°$ around its orbit, but the question asks for minutes. The Earth turns $1°$ every 4 minutes.` }],
              explain: r`The Moon moves $\frac{360°}{29.5} \approx 12.2°$ per day. The Earth turns $1°$ every 4 minutes, so it takes about 50 minutes extra to catch up. The tides (and moonrise) come about **50 minutes later** each day, and two high tides are roughly 12 hours 25 minutes apart.`,
            },
            {
              type: 'numeric',
              title: 'Spring tides in a year',
              prompt: r`Spring tides come at every new and full Moon, about every 14.8 days. Roughly how many spring tides are there in a year? (Nearest whole number.)`,
              answer: 365.25 / 14.77,
              tol: 0.6,
              explain: r`$\frac{365.25}{14.77} \approx 25$. The very biggest come when a spring tide coincides with the Moon’s closest approach (perigee): the so-called king tides.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Equinox tides',
              prompt: r`The very biggest spring tides of the year tend to happen near the March and September equinoxes. Why?`,
              choices: [
                { t: r`The Sun is then over the equator, lining up its tidal bulges best with the Moon’s, and Earth’s tilt no longer splits them`, ok: true },
                { t: r`The Moon is closest to Earth then`, why: r`The Moon’s closest approach (perigee) shifts through the year. The equinox effect comes from the Sun’s position.` },
                { t: r`Spring and autumn storms push the water higher`, why: r`Storms add surges, but the equinoctial tides are bigger even in calm weather.` },
              ],
              explain: r`At the equinoxes, the Sun’s tidal bulges sit over the equator. When a new or full Moon is also near the equator, the bulges reinforce strongly at most places. Combine that with the Moon at perigee and you get the largest tides of all.`,
            },
          ],
          recap: [
            'Spring tides: Sun and Moon aligned (new and full moon). Neap tides: at right angles.',
            'Spring tides are roughly 2.7 times the range of neap tides in this simple model.',
            'Tides come about 50 minutes later each day.',
          ],
        },
        {
          id: 'locking',
          title: 'Tidal Locking',
          summary: 'Why the Moon shows one face',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Tidal friction',
              body: r`The Earth spins faster (once a day) than the Moon orbits (once a month). Friction drags the tidal bulges slightly **ahead** of the Earth–Moon line. The Moon's gravity tugs back on the leading bulge, slowing the Earth's spin. In return, the bulge pulls the Moon forward, lifting it into a higher orbit.

Both effects have been measured:
- Lasers bounced off reflectors left by the Apollo astronauts show the Moon receding by about **3.8 cm per year**.
- Records of ancient eclipses and fossil corals show that days were shorter in the past. About 400 million years ago, a year had roughly 400 days.`,
            },
            {
              type: 'mcq',
              title: 'The Moon’s spin',
              prompt: r`The Moon always shows the same face to Earth. What does that tell us about its rotation?`,
              choices: [
                { t: 'It spins exactly once per orbit', ok: true },
                { t: 'It doesn’t spin at all', why: 'A non-spinning Moon would show us all its sides during each orbit. Try walking around a chair while always facing it: you turn once.' },
                { t: 'It spins once a day, like Earth', why: 'Then we’d see different faces every few hours.' },
              ],
              explain: r`Earth's tides on the Moon (about 20 times stronger than the Moon's on Earth, since Earth is much more massive) long ago slowed the Moon's spin until it matched its orbit. This is **tidal locking**, and it's common: most large moons in the Solar System are locked to their planets. Pluto and its moon Charon are locked **to each other**, each always showing the other the same face.`,
            },
            {
              type: 'numeric',
              title: 'A million years',
              prompt: r`At 3.8 cm per year, how far does the Moon recede in one million years, in kilometres?`,
              unit: 'km',
              answer: 38,
              wrong: [{ v: 380, why: '3.8 cm × 10⁶ = 3.8 × 10⁶ cm = 38,000 m.' }, { v: 3.8, why: 'Convert carefully: 3.8 × 10⁶ cm = 38 km.' }],
              explain: r`$3.8 \times 10^6$ cm $= 38$ km: tiny compared with the Moon's 384,000 km distance, but over billions of years it adds up. When the Moon formed, it was perhaps 10 times closer, raising enormous tides.`,
            },
            {
              type: 'numeric',
              title: 'Slowing spin',
              prompt: r`Today the Moon's tides lengthen the day by about 2 milliseconds per century. If that rate had held steady, by how many hours would the day have grown over 400 million years? (1 decimal place.)`,
              unit: 'hours',
              answer: (4e8 / 100) * 0.002 / 3600,
              tol: 0.06,
              wrong: [{ v: 8000, tol: 1, why: 'That’s in seconds. Divide by 3600 to get hours.' }],
              explain: r`400 million years is $4 \times 10^6$ centuries, and $4 \times 10^6 \times 0.002$ s $= 8000$ s $\approx 2.2$ hours. So a day back then would have lasted roughly 22 hours, a prediction you can test against fossil corals next. (The braking rate has varied over time, so this is only a rough check.)`,
            },
            {
              type: 'interactive',
              title: 'Counting ancient days',
              body: r`Fossil corals grow daily and yearly bands. Corals from about 400 million years ago show roughly **400 days in a year**. The length of the year hasn’t changed, but the day has. Find the day length that fits.`,
              widget: {
                kind: 'graph', xmin: 18, xmax: 26, ymin: 330, ymax: 490, grid: false, height: 260, axes: { xlabel: 'length of a day (hours)', ylabel: 'days per year', xticks: 1, yticks: 20, xAt: 18, yAt: 330 },
                params: { h: { min: 18, max: 26, step: 0.05, value: 24, label: 'day length', color: 'coral', format: (v) => `${v.toFixed(2)} h` } },
                curves: [{ f: (x) => 8766 / x, color: 'violet', width: 3 }, { f: () => 400, color: 'teal', dash: true }],
                points: [{ x: (p) => p.h, y: (p) => 8766 / p.h, color: 'coral' }],
                readout: (p) => `${p.h.toFixed(2)} h days: **${(8766 / p.h).toFixed(1)} days per year** · ${((24 - p.h) * 3600 * 1000 / 4e6).toFixed(1)} ms longer per century on average since`,
                goal: (p) => Math.abs(8766 / p.h - 400) < 1,
                hint: 'A year is 8,766 hours; divide by 400.',
                solution: { h: 21.9 },
              },
              explain: r`$8766/400 \approx 21.9$ hours. The Moon’s tides have been braking Earth’s spin ever since, adding on average about 2 ms per century to the day. The angular momentum Earth loses goes into the Moon’s orbit, which is why the Moon is drifting away by about 3.8 cm a year.`,
            },
            {
              type: 'mcq',
              title: 'The far future',
              prompt: r`If tidal friction continued for long enough (ignoring the Sun's eventual evolution), where would the Earth–Moon system end up?`,
              choices: [
                { t: 'Earth’s day would equal the (longer) month, with each body always facing the other', ok: true },
                { t: 'The Moon would escape completely', why: 'The Moon’s recession slows down as it gets further away. The process stops when Earth’s spin matches the Moon’s orbit.' },
                { t: 'The Moon would crash into Earth', why: 'The Moon is moving away, not closer, because the Earth spins faster than the Moon orbits.' },
              ],
              explain: r`The exchange stops once Earth's spin matches the Moon's orbital period: no more relative motion, no more friction. Calculations suggest a day and month of roughly 47 of today's days, but this would take far longer than the Sun's remaining lifetime.`,
            },
          ],
          recap: [
            'Tidal friction slows Earth’s spin and pushes the Moon outward (3.8 cm per year).',
            'The Moon is tidally locked: it spins once per orbit.',
            'Locking is common among moons; Pluto and Charon are locked to each other.',
          ],
        },
      ],
    },
    {
      title: 'Life on a Spinning Planet',
      summary: 'Rotating frames.',
      lessons: [
        {
          id: 'coriolis',
          title: 'The Coriolis Effect',
          summary: 'Curving paths on a turntable',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Throwing on a merry-go-round',
              body: r`From the centre of a spinning merry-go-round, you roll a ball straight towards a friend at the edge. Seen from above, the ball travels in a perfectly straight line. But while it rolls, your friend moves round with the merry-go-round, and the ball misses.

To someone riding the merry-go-round, the ball seems to **curve**. Physicists account for this with a fictitious **Coriolis force**, named after Gaspard-Gustave de Coriolis, who analysed it in 1835.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Watch it curve',
              prompt: r`The turntable spins anticlockwise and the ball takes 1 second to reach the edge. Switch between the two views. Then set the spin so that, **as seen by the riders**, the ball lands a quarter-turn to the right of the friend.`,
              widget: {
                kind: 'graph', xmin: -1.35, xmax: 1.35, ymin: -1.25, ymax: 1.25, grid: false, axes: false, equal: true, height: 320, maxWidth: 440,
                params: {
                  w: { min: 0, max: 180, step: 5, value: 30, label: 'spin', color: 'violet', format: (v) => `${v}°/s` },
                  view: { min: 0, max: 1, step: 1, value: 1, label: 'view', color: 'teal', format: (v) => (v ? 'riding the turntable' : 'from above (not spinning)') },
                },
                extra: ({ plot, p, s }) => {
                  const u = plot.X(1) - plot.X(0), fa = p.view ? 0 : p.w * D;
                  const bx = p.view ? Math.cos(p.w * D) : 1, by = p.view ? -Math.sin(p.w * D) : 0;
                  let path = '';
                  for (let i = 0; i <= 60; i++) {
                    const t = i / 60, x = p.view ? t * Math.cos(p.w * D * t) : t, y = p.view ? -t * Math.sin(p.w * D * t) : 0;
                    path += `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`;
                  }
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: u, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2.5 }),
                    s('path', { d: path, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' }),
                    s('circle', { cx: plot.X(Math.cos(fa)), cy: plot.Y(Math.sin(fa)), r: 11, class: 'fl-blue' }),
                    s('text', { x: plot.X(1.12 * Math.cos(fa)), y: plot.Y(1.12 * Math.sin(fa)) + 5, class: 'lbl', 'text-anchor': Math.cos(fa) > 0.3 ? 'start' : Math.cos(fa) < -0.3 ? 'end' : 'middle', text: 'friend' }),
                    s('circle', { cx: plot.X(bx), cy: plot.Y(by), r: 8, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => (p.view ? `Riders see the ball curve **right**, landing ${p.w}° from the friend.` : `From above, the ball goes straight; the friend has moved ${p.w}° round by the time it arrives.`),
                goal: (p) => p.w === 90,
                hint: 'The ball misses by exactly the angle the turntable turns in 1 second.',
                solution: { w: 90, view: 1 },
              },
              explain: r`In 1 second the turntable turns $90°$, so the ball arrives a quarter-turn away from the friend. Both views describe the same motion: from above, a straight line; from on board, a curve to the right.`,
            },
            {
              type: 'mcq',
              title: 'Hurricanes',
              prompt: r`Seen from above the North Pole, the Earth spins anticlockwise. Air rushes inwards towards a low-pressure storm centre. Which way do northern-hemisphere hurricanes rotate?`,
              choices: [
                { t: 'Anticlockwise: inflowing air is deflected to the right of its motion, setting up an anticlockwise swirl', ok: true },
                { t: 'Clockwise', why: 'That’s the southern hemisphere, where the deflection is to the left.' },
                { t: 'Either way, at random', why: 'For storms hundreds of kilometres across, the Coriolis effect dominates and fixes the direction.' },
              ],
              explain: r`Air heading towards the low is deflected to the right, so it misses the centre and circles it anticlockwise. Southern-hemisphere cyclones spin clockwise. But the famous claim that sinks drain in opposite directions in each hemisphere is a myth: over a few seconds and a few centimetres, the Coriolis effect is tiny compared with the shape of the basin and leftover swirls in the water.`,
            },
            {
              type: 'numeric',
              title: 'Earth’s spin rate',
              prompt: r`Earth turns once relative to the stars every 23 h 56 min (86,164 s). What is its angular speed $\Omega = 2\pi / T$, in radians per second? (Give 3 significant figures, like 7.29e-5.)`,
              answer: 2 * Math.PI / 86164,
              relTol: 0.002,
              wrong: [{ v: 7.27e-5, relTol: 0.001, why: r`Use the sidereal day (86,164 s), not 86,400 s. Close, though!` }],
              explain: r`$\Omega \approx 7.29 \times 10^{-5}$ rad/s. It sets the size of the Coriolis effect, $2\Omega v\sin(\text{latitude})$: for a ball thrown at 20 m/s it’s a sideways acceleration of only about 0.002 m/s², which is why you never notice it at play but hurricanes, ocean currents and long-range artillery do.`,
            },
            {
              type: 'numeric',
              title: 'A small sideways push',
              prompt: r`The Coriolis acceleration on something moving horizontally at speed $v$ is $2\Omega v\sin\varphi$, with $\Omega = 7.29 \times 10^{-5}$ rad/s. For wind at 20 m/s at latitude 45°, how big is it in mm/s²? (2 decimal places.)`,
              unit: 'mm/s²',
              answer: 2 * 7.292e-5 * 20 * Math.sin(Math.PI / 4) * 1000,
              tol: 0.02,
              explain: r`About 2.06 mm/s², a five-thousandth of gravity. Tiny, but acting for hours over hundreds of kilometres, it steers winds into great swirls.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An hour off course',
              prompt: r`A plane flies at 250 m/s at latitude 45°, so its Coriolis acceleration is $2\omega v\sin\varphi \approx 0.026$ m/s². If nothing corrected for it, roughly how far sideways would it drift in one hour? Use $\frac12 a t^2$ and give the answer in km. (Nearest 10 km.)`,
              unit: 'km',
              answer: 0.5 * (2 * 7.29e-5 * 250 * Math.sin(45 * D)) * 3600 ** 2 / 1000,
              tol: 6,
              wrong: [{ v: 0.026 * 3600 / 1000, tol: 0.05, why: r`That's $at$, a sideways speed. Distance from a steady acceleration is $\frac12 a t^2$.` }],
              explain: r`$\frac12 \times 0.026 \times 3600^2 \approx 167{,}000$ m: about **170 km**. A push of 0.3% of $g$ sounds negligible, but it adds up. In practice the plane's navigation constantly corrects its heading, and artillery tables have long included Coriolis corrections.`,
            },
          ],
          recap: [
            'In a rotating frame, moving objects appear deflected: the Coriolis effect.',
            'On Earth, deflection is to the right in the northern hemisphere and to the left in the southern.',
            'It shapes hurricanes and winds, but not your sink.',
          ],
        },
        {
          id: 'foucault',
          title: 'Proving the Earth Turns',
          summary: 'Foucault’s pendulum and the bulging Earth',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'The Panthéon, 1851',
              body: r`Léon Foucault hung a 28 kg iron ball on a 67 m wire from the dome of the Panthéon in Paris. A pendulum keeps swinging in the same plane in space, while the Earth turns beneath it. Over the hours, the swing appeared to rotate slowly around the floor, knocking over a ring of markers.

At the North Pole, the floor turns a full circle beneath the pendulum in a day. At the equator the floor doesn't turn around the vertical at all. In between, the swing rotates once every
$$T = \frac{24\text{ h}}{\sin\varphi}$$
where $\varphi$ is the latitude. (Strictly, it's one **sidereal** day, about 23.9 h.)`,
            },
            {
              type: 'numeric',
              title: 'At 30°',
              prompt: r`How long does a Foucault pendulum take to complete one rotation at latitude $30°$? (Use 24 hours.)`,
              unit: 'hours',
              answer: 48,
              tol: 0.5,
              wrong: [{ v: 24, why: r`That's at the poles. At $30°$, divide by $\sin 30° = 0.5$.` }, { v: 12, why: r`Divide by $\sin 30°$, don't multiply. At lower latitudes the rotation is **slower**.` }, { v: 27.7, tol: 0.3, why: r`That's $24 / \cos 30°$. The formula uses $\sin\varphi$.` }],
              explain: r`$\frac{24}{\sin 30°} = \frac{24}{0.5} = 48$ hours. In Paris ($48.85°$ N), it's about 32 hours. Foucault's pendulum was the first simple, direct demonstration that the Earth rotates, with no need to look at the sky.`,
            },
            {
              type: 'mcq',
              title: 'At the equator',
              prompt: r`What does a Foucault pendulum do at the equator?`,
              choices: [
                { t: 'Its swing doesn’t rotate at all: the floor isn’t turning around the vertical there', ok: true },
                { t: 'It rotates once a day, like at the poles', why: r`At the equator $\sin\varphi = 0$, so the rotation period is infinite.` },
                { t: 'It stops swinging', why: 'It swings normally; its plane just doesn’t rotate.' },
              ],
              explain: r`At the equator, the ground is carried around the Earth's axis, but it doesn't twist around the local vertical. In the southern hemisphere, the swing rotates the opposite way (anticlockwise).`,
            },
            {
              type: 'numeric',
              title: 'Lighter at the equator',
              prompt: r`At the equator, part of gravity is used up keeping you moving in a circle with the spinning Earth. Find the centripetal acceleration $\omega^2 R$, with $\omega = 7.29 \times 10^{-5}$ rad/s and $R = 6.38 \times 10^6$ m. (In m/s², 3 decimal places.)`,
              unit: 'm/s²',
              answer: 7.29e-5 ** 2 * 6.38e6,
              tol: 0.0006,
              wrong: [{ v: 7.29e-5 * 6.38e6, tol: 3, why: r`That's $\omega R$, your speed (465 m/s). The centripetal acceleration is $\omega^2 R$.` }],
              explain: r`$\omega^2 R \approx 0.034$ m/s², about 0.3% of $g$. So you weigh about 0.3% less at the equator than at the poles from spin alone. (Earth's shape adds a little more.) The same effect made the young, molten Earth bulge: its equatorial radius is about 21 km larger than its polar radius.`,
            },
            {
              type: 'interactive',
              title: 'Ten degrees an hour',
              body: r`A Foucault pendulum’s swing plane turns at $15° \times \sin(\text{latitude})$ per hour. The lines show the plane at the start and after each hour for 6 hours. Find the latitude where it turns **10° per hour**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 1.15, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 320,
                params: { lat: { min: 0, max: 90, step: 0.1, value: 20, label: 'latitude', color: 'teal', format: (v) => `${v.toFixed(1)}° N` } },
                extra: ({ plot, p, s }) => { const rate = 15 * Math.sin((p.lat * Math.PI) / 180), out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1.05) - plot.X(0), class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 })]; for (let h = 0; h <= 6; h++) { const a = Math.PI / 2 - (rate * h * Math.PI) / 180; out.push(s('line', { x1: plot.X(-Math.cos(a)), y1: plot.Y(-Math.sin(a)), x2: plot.X(Math.cos(a)), y2: plot.Y(Math.sin(a)), stroke: h === 0 ? 'var(--ink-3)' : 'var(--violet)', 'stroke-width': h === 6 ? 3 : 1.5, opacity: h === 0 ? 1 : 0.35 + h / 10 })); } return out; },
                readout: (p) => { const r = 15 * Math.sin((p.lat * Math.PI) / 180); return `turns **${r.toFixed(2)}° per hour** · full circle in ${r > 0.01 ? (360 / r).toFixed(1) + ' hours' : 'never'}`; },
                goal: (p) => Math.abs(15 * Math.sin((p.lat * Math.PI) / 180) - 10) < 0.02,
                hint: 'You need sin(latitude) = 10/15 = 2/3.',
                solution: { lat: 41.8 },
              },
              explain: r`$\sin\varphi = \frac23$ gives about **41.8° N**, roughly the latitude of Rome, Chicago or Barcelona. The plane takes 36 hours to come full circle there; at the pole it takes one sidereal day, and on the equator it never turns at all.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'In Paris',
              prompt: r`A Foucault pendulum’s swing turns full circle in $\frac{24\ \text{h}}{\sin(\text{latitude})}$ (using a sidereal day of about 23.93 h gives a slightly smaller answer). Using 24 h, how long does it take in Paris, at 48.85° N? (1 decimal place, in hours.)`,
              unit: 'h',
              answer: 24 / Math.sin(48.85 * Math.PI / 180),
              tol: 0.06,
              explain: r`$\frac{24}{\sin 48.85°} \approx 31.9$ hours. Foucault’s 1851 audience watched the pendulum’s plane drift about $11°$ per hour: the first direct demonstration that the Earth spins.`,
            },
          ],
          recap: [
            r`A Foucault pendulum's swing rotates once every $24\text{ h}/\sin\varphi$.`,
            r`Earth's spin reduces effective gravity at the equator by $\omega^2 R \approx 0.034$ m/s².`,
            'The spin also flattens the Earth: it bulges by about 21 km at the equator.',
          ],
        },
      ],
    },
    {
      title: 'Tides at the Extremes',
      summary: 'Resonant bays and tide tables.',
      lessons: [
        {
          id: 'bays',
          title: 'Tides in Bays',
          summary: 'Resonance and the Bay of Fundy',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Why tides vary so much',
              body: r`In the open ocean, tides rise and fall by less than a metre. Yet in some places they're enormous: over 15 m in the Bay of Fundy in Canada and around 14 m in the Severn Estuary in Britain, while parts of the Mediterranean barely notice the tide at all.

The difference is **resonance**. Water sloshes back and forth in a bay with its own natural period. If that period is close to the tidal period (12.4 hours), each tide pumps the oscillation up, like pushing a swing at the right moments.`,
            },
            {
              type: 'explain',
              title: 'A quarter-wave basin',
              body: r`A long bay open to the ocean at one end resonates like an organ pipe closed at one end: the fundamental wavelength is **four** times the bay's length. Tidal waves in a bay are shallow-water waves, travelling at $\sqrt{gh}$, so the natural period is
$$T = \frac{4L}{\sqrt{gh}}$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tune the bay',
              prompt: r`A bay has an average depth of 70 m. Find the length that makes its natural period match the **12.42-hour** tide.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 500, ymin: 0, ymax: 22, grid: 50, gridY: 2, height: 260, axes: { xlabel: 'bay length (km)', ylabel: 'natural period (hours)' },
                params: { L: { min: 20, max: 500, step: 1, value: 150, slider: false } },
                curves: [{ f: (L) => bayPeriod(L), color: 'violet', width: 3 }, { f: () => 12.42, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.L, y: (p) => bayPeriod(p.L), drag: { x: 'L' }, color: 'teal' }],
                readout: (p) => r`$L = ${p.L}$ km: natural period $${bayPeriod(p.L).toFixed(2)}$ h`,
                goal: (p) => Math.abs(bayPeriod(p.L) - 12.42) < 0.05,
                hint: r`Solve $L = \frac{T\sqrt{gh}}{4}$ with $T = 12.42 \times 3600$ s.`,
                solution: { L: 293 },
              },
              explain: r`About **293 km**. The Bay of Fundy, together with the Gulf of Maine, is close to this resonance, which is why its tides are the largest on Earth: twice a day, about 100 billion tonnes of water flow in and out.`,
            },
            {
              type: 'numeric',
              title: 'Shallow-water speed',
              prompt: r`How fast does a tidal wave travel in water 70 m deep? (m/s, 1 decimal place.)`,
              unit: 'm/s',
              answer: Math.sqrt(9.8 * 70),
              tol: 0.05,
              wrong: [{ v: 686, why: 'Take the square root of gh.' }],
              explain: r`$\sqrt{9.8 \times 70} \approx 26.2$ m/s, about 94 km/h. Tides are waves with wavelengths of hundreds of kilometres, so even deep oceans count as "shallow" for them.`,
            },
            {
              type: 'mcq',
              title: 'Tidal power',
              prompt: r`The La Rance power station in France has generated electricity from the tide since 1966. Why are tidal power stations built in places like estuaries with huge tides?`,
              choices: [
                { t: 'The energy available grows with the square of the tidal range, so big tides give far more power', ok: true },
                { t: 'Big tides are more predictable', why: 'All tides are predictable; the benefit of a big range is energy.' },
                { t: 'Estuaries have stronger gravity', why: 'Gravity is the same; the local resonance amplifies the tide.' },
              ],
              explain: r`Water trapped behind a barrage of area $A$ at height $h$ stores energy proportional to $A h^2$: double the range, four times the energy. Tidal power is perfectly predictable years ahead, unlike wind or solar, but suitable sites are rare and barrages affect estuary wildlife.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Twice the range',
              prompt: r`A tidal barrage site has a range of 5 m. How many times more energy per tide would a site with a 12 m range store (same basin area)? (1 decimal place.)`,
              unit: '×',
              answer: (12 / 5) ** 2,
              tol: 0.05,
              wrong: [{ v: 2.4, tol: 0.01, why: 'Energy goes as the range squared.' }],
              explain: r`$\left(\frac{12}{5}\right)^2 = 5.76 \approx 5.8$ times. That's why the Severn Estuary, with Europe's largest tides, has been studied for tidal power for over a century.`,
            },
          ],
          recap: [
            'Bays resonate; when their period nears 12.4 h, tides grow huge.',
            r`Quarter-wave basin period: $T = 4L/\sqrt{gh}$.`,
            'Tidal energy grows as the range squared.',
          ],
        },
        {
          id: 'predicting',
          title: 'Predicting Tides',
          summary: 'Adding up rhythms',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Tides as a sum of waves',
              body: r`Tide tables are computed years in advance by adding up **tidal constituents**: sine waves with precisely known periods, each caused by some feature of the Moon's and Sun's motion. The two biggest are:
- **M2**, the principal lunar tide, with a period of 12.42 hours;
- **S2**, the principal solar tide, with a period of exactly 12.00 hours.

Local measurements fix each constituent's size and timing at a particular port; after that, the future tides follow from astronomy.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'From tides to spring tides',
              prompt: r`The graph adds an M2 wave (height 1) and an S2 wave (height 0.46). Because their periods differ slightly, they drift in and out of step. Drag to the time of the **next spring tide** after day 0 (where the envelope is tallest again).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: -1.7, ymax: 1.7, grid: 5, gridY: 0.5, height: 270, axes: { xlabel: 'days', ylabel: 'water level' },
                params: { t: { min: 1, max: 29, step: 0.05, value: 5, slider: false } },
                curves: [
                  { f: (d) => Math.cos((2 * Math.PI * d * 24) / 12.42) + 0.46 * Math.cos((2 * Math.PI * d * 24) / 12), color: 'blue', width: 1, n: 1500 },
                  { f: (d) => tideRange(((d * 24) / 12 - (d * 24) / 12.42) * 180), color: 'coral', width: 2.5 },
                  { f: (d) => -tideRange(((d * 24) / 12 - (d * 24) / 12.42) * 180), color: 'coral', width: 2.5 },
                ],
                points: [{ x: (p) => p.t, y: (p) => tideRange(((p.t * 24) / 12 - (p.t * 24) / 12.42) * 180), drag: { x: 't' }, color: 'violet' }],
                readout: (p) => `day ${p.t.toFixed(2)}: envelope height ${tideRange(((p.t * 24) / 12 - (p.t * 24) / 12.42) * 180).toFixed(2)}`,
                goal: (p) => Math.abs(p.t - 14.77) < 0.3,
                hint: 'Follow the coral envelope: it shrinks to a neap tide, then grows back.',
                solution: { t: 14.75 },
              },
              explain: r`The next spring tide comes about **14.8 days** later. That's the **beat period** of the two constituents: $\frac{1}{1/12 - 1/12.42}$ hours $\approx 355$ hours. It's exactly half a lunar month, matching the new and full moons.`,
            },
            {
              type: 'numeric',
              title: 'The beat period',
              prompt: r`Compute the beat period of M2 (12.42 h) and S2 (12.00 h): $\dfrac{1}{\frac{1}{12} - \frac{1}{12.42}}$ hours. Convert to days (1 decimal place).`,
              unit: 'days',
              answer: 1 / (1 / 12 - 1 / 12.42) / 24,
              tol: 0.06,
              wrong: [{ v: 0.42, tol: 0.05, why: 'Subtract the frequencies (1/period), not the periods.' }],
              explain: r`$\frac{1}{0.08333 - 0.08052} \approx 355$ hours $\approx 14.8$ days: one spring–neap–spring cycle.`,
            },
            {
              type: 'mcq',
              title: 'Tide-predicting machines',
              prompt: r`In 1872, Lord Kelvin built a machine of pulleys and gears to predict tides. How did it work?`,
              choices: [
                { t: 'Each gear-driven pulley produced one sine wave; a single cord ran over them all, adding the waves mechanically', ok: true },
                { t: 'It used a tank of water as a model ocean', why: 'It was an analogue computer adding sine waves, not a scale model.' },
                { t: 'It looked up old tide records', why: 'It predicted future tides by adding constituents.' },
              ],
              explain: r`Later machines summed up to 40 constituents and could compute a year of tides for a port in a day. They were vital for planning the D-Day landings in 1944, and remained in use until computers replaced them in the 1960s.`,
            },
            {
              type: 'numeric',
              title: 'Adding constituents',
              prompt: r`At a port, the main lunar tide (M2) has amplitude 1.5 m and the solar tide (S2) 0.7 m. At spring tides they line up. What is the spring tidal **range** (high minus low water), in metres?`,
              unit: 'm',
              answer: 2 * (1.5 + 0.7),
              tol: 0.01,
              explain: r`The amplitudes add to 2.2 m, and the range is twice the amplitude: **4.4 m**. At neap tides they oppose, giving $2 \times 0.8 = 1.6$ m.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Daily inequality',
              prompt: r`Some ports, like those in the Gulf of Mexico, have only **one** high tide a day, dominated by a constituent called K1 with a period of 23.93 hours. How many K1 high tides happen in 30 days? (Nearest whole number.)`,
              answer: Math.round((30 * 24) / 23.93),
              tol: 0.6,
              wrong: [{ v: 60, why: 'K1 is a once-a-day tide, not twice a day.' }],
              explain: r`$\frac{720}{23.93} \approx 30$. Diurnal constituents like K1 come from the tilt of the Moon's and Sun's orbits relative to the equator. Where a basin happens to resonate with them, the twice-daily tides fade and one daily tide dominates.`,
            },
          ],
          recap: [
            'Tides are predicted by adding constituents with astronomically known periods.',
            'M2 (12.42 h) and S2 (12 h) beat every 14.8 days: the spring–neap cycle.',
            'Kelvin’s mechanical machines summed the waves long before computers.',
          ],
        },
      ],
    },
  ],
};
