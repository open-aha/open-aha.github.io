const r = String.raw;
const DEG = 180 / Math.PI;
// angle from the antisolar point for a ray with impact parameter b (0–1) through a drop of index n, after one internal reflection
const bowAngle = (b, n) => 180 - (180 + 2 * Math.asin(b) * DEG - 4 * Math.asin(b / n) * DEG);
const peakCache = new Map();
const peak = (n) => {
  if (peakCache.has(n)) return peakCache.get(n);
  let best = 0;
  for (let b = 0.001; b < 1; b += 0.001) best = Math.max(best, bowAngle(b, n));
  peakCache.set(n, best);
  return best;
};
const colourOf = (n) => (n <= 1.3315 ? 'red' : n <= 1.3335 ? 'orange–yellow' : n <= 1.337 ? 'green' : n <= 1.34 ? 'blue' : 'violet');

const rayleigh = (lam) => (700 / lam) ** 4; // scattering relative to 700 nm red
const coronaDeg = (dum) => (1.22 * 550e-9 / (dum * 1e-6)) * DEG; // first dark ring, 550 nm light, droplet diameter in µm
const hueOf = (nm) => Math.max(0, Math.min(270, (270 * (700 - nm)) / 300));

export default {
  id: 'skyoptics',
  subject: 'physics',
  title: 'Rainbows & Sky Optics',
  level: 'Intermediate',
  cover: 'skyoptics',
  tagline: 'Rainbows, halos, mirages, blue skies and coronas.',
  description: r`The sky is a giant optics laboratory. Trace light through raindrops to discover why rainbows sit exactly 42° from the shadow of your head, why double rainbows are reversed, how ice crystals paint rings around the Sun, why hot roads seem to shimmer with water, why the sky is blue and sunsets red, and how a ring around the Moon reveals the size of cloud droplets.`,
  prereq: 'Light & Optics',
  chapters: [
    {
      title: 'Rainbows',
      summary: 'Light inside raindrops.',
      lessons: [
        {
          id: 'rainbow',
          title: 'The Rainbow Angle',
          summary: 'Why 42°?',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Light in a raindrop',
              body: r`Sunlight enters a spherical raindrop, **refracts** (bends), **reflects** once off the back, and refracts again on the way out. Where it leaves depends on how far from the drop's centre it entered: its **impact parameter** $b$ (0 at the centre, 1 at the edge).

To see a rainbow, the Sun must be behind you. Angles are measured from the **antisolar point**: the shadow of your head.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where the light piles up',
              body: r`The graph shows the angle (from the antisolar point) at which light leaves the drop, for each impact parameter. Change the refractive index: water's is about 1.331 for red light and 1.343 for violet.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 46, grid: 0.1, gridY: 10, height: 320, axes: { xlabel: 'impact parameter b', ylabel: 'angle (°)' },
                params: { n: { min: 1.331, max: 1.343, step: 0.002, value: 1.331, label: 'refractive index', color: 'violet', format: (v) => v.toFixed(3) } },
                curves: [{ f: (b, p) => (b > 0 && b < 1 ? bowAngle(b, p.n) : NaN), color: 'coral', width: 3 }, { f: (b, p) => peak(p.n), color: 'ink', dash: true }],
                readout: (p) => r`maximum angle $= ${peak(p.n).toFixed(1)}°$ (${colourOf(p.n)} light)`,
              },
              after: r`The curve rises to a maximum and turns over. Near the top, a whole range of impact parameters leaves at almost the **same** angle, so light piles up there: about **42°** for red. That concentration of light, all around the antisolar point, is the rainbow. Violet light bends more, so its maximum is smaller, about 40.6°: violet is on the **inside** of the bow and red on the outside.`,
            },
            {
              type: 'mcq',
              title: 'Chasing the rainbow',
              prompt: r`Why can you never reach the end of a rainbow?`,
              choices: [
                { t: 'It isn’t a place: it’s a set of directions 42° from your own antisolar point, so it moves with you', ok: true },
                { t: 'It’s too far away', why: 'Distance isn’t the issue: the drops making your rainbow change as you move.' },
                { t: 'It fades when you get close', why: 'The bow keeps the same angle relative to you, whatever the distance.' },
              ],
              explain: r`Your rainbow is made by whichever drops happen to lie at 42° from **your** antisolar point. Move, and different drops do the job. Everyone sees their own personal rainbow.`,
            },
            {
              type: 'mcq',
              title: 'Morning and evening',
              prompt: r`Why are rainbows seen in the early morning or late afternoon, but rarely around midday in summer?`,
              choices: [
                { t: 'When the Sun is higher than 42°, the antisolar point is more than 42° below the horizon, so the whole bow is below the ground', ok: true },
                { t: 'It doesn’t rain at midday', why: 'It rains at any time. The geometry is the problem.' },
                { t: 'Sunlight is too bright at midday', why: 'Brightness isn’t the problem. The bow’s position is.' },
              ],
              explain: r`The antisolar point is as far below the horizon as the Sun is above it. With the Sun above about 42°, the entire rainbow circle sits below the horizon. From an aeroplane, though, you can sometimes see a **complete circular** rainbow.`,
            },
            {
              type: 'numeric',
              title: 'How high is the arc?',
              prompt: r`The rainbow is a circle of radius $42°$ centred on the point directly opposite the Sun. If the Sun is $20°$ above the horizon, how high above the horizon is the top of the bow?`,
              unit: '°',
              answer: 22,
              explain: r`The antisolar point is $20°$ **below** the horizon, so the top of the bow is $42° - 20° = 22°$ up. As the Sun climbs, the bow sinks, vanishing when the Sun passes $42°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'No rainbows at noon',
              prompt: r`The rainbow is a circle of radius 42° around the antisolar point (directly opposite the Sun, below the horizon when the Sun is up). Above what solar altitude (in degrees) is the whole primary bow below the horizon, so you can't see it from flat ground?`,
              unit: '°',
              answer: 42,
              wrong: [{ v: 48, why: 'The antisolar point is as far below the horizon as the Sun is above it; the bow reaches 42° above that point.' }],
              explain: r`When the Sun is more than 42° high, the top of the bow is below the horizon. That's why rainbows appear in the morning or late afternoon, never around midday in summer (unless you're on a mountain or in a plane, where you can sometimes see the full circle).`,
            },
          ],
          recap: [
            'Light piles up at the maximum exit angle: about 42° from the antisolar point.',
            'Red is outside (42.4°) and violet inside (40.6°).',
            'The rainbow is a set of directions, not an object: it moves with you.',
          ],
        },
        {
          id: 'double',
          title: 'Double Rainbows',
          summary: 'Two reflections',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'The secondary bow',
              body: r`Some light reflects **twice** inside the drop before leaving. It makes a fainter **secondary rainbow** at about **51°** from the antisolar point, outside the primary bow. The extra reflection reverses the order of colours: the secondary bow has red on the **inside**.

Between the two bows, the sky is noticeably darker. No light from one or two reflections can exit in that range of angles. This is **Alexander's dark band**, named after Alexander of Aphrodisias, who described it around 200 AD.`,
            },
            {
              type: 'mcq',
              title: 'Which is fainter?',
              prompt: r`Why is the secondary rainbow fainter than the primary?`,
              choices: [
                { t: 'Some light escapes at each internal reflection, so less light survives two reflections', ok: true },
                { t: 'It’s farther away', why: 'Both bows come from drops at similar distances. The difference is inside the drops.' },
                { t: 'It uses only red light', why: 'The secondary bow has all the colours, just in reverse order.' },
              ],
              explain: r`At every internal reflection, most of the light actually passes out of the drop, and only a small fraction reflects. Two reflections leave much less light than one, so the secondary bow is dimmer.`,
            },
            {
              type: 'mcq',
              title: 'Higher orders',
              prompt: r`Light reflecting three or four times inside drops makes tertiary and quaternary rainbows. Where in the sky do they appear?`,
              choices: [
                { t: 'Around the Sun itself, at about 40° and 45° from it, where they’re drowned out by sunlight', ok: true },
                { t: 'Outside the secondary bow, at about 60° from the antisolar point', why: 'The extra reflections turn the light back towards the Sun’s side of the sky.' },
                { t: 'They don’t exist', why: 'They exist and were finally photographed in 2011.' },
              ],
              explain: r`Each extra reflection turns the light by about 100° more, so the third- and fourth-order bows form on the Sun's side of the sky, faint against the glare. They weren't photographed until 2011.`,
            },
            {
              type: 'numeric',
              title: 'How high is the bow?',
              prompt: r`The secondary bow is a circle of radius about $51°$ around the point directly opposite the Sun. If the Sun is $30°$ above the horizon, how high above the horizon is the top of the **secondary** bow?`,
              unit: '°',
              answer: 21,
              wrong: [{ v: 81, why: r`The bow is centred on the antisolar point, which is below the horizon.` }, { v: 12, why: r`That's the primary bow (42°). The secondary bow has a radius of about 51°.` }],
              explain: r`The centre is $30°$ **below** the horizon, so the top of the secondary bow is at $51° - 30° = 21°$, while the primary is at $42° - 30° = 12°$. The secondary bow survives a higher Sun, but it vanishes too once the Sun climbs past about $51°$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where the two bows come from',
              body: r`Light enters a raindrop at a distance $b$ from its centre line (as a fraction of the radius). After **one** internal reflection it comes back at angle $\theta_1$ from the point opposite the Sun; after **two**, at $\theta_2$. Slide $b$ across the drop.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 90, grid: false, height: 280, axes: { xlabel: 'entry point b (fraction of radius)', ylabel: 'angle from antisolar point (°)', xticks: 0.2, yticks: 15 },
                params: { b: { min: 0.01, max: 0.99, step: 0.01, value: 0.5, label: 'entry point', color: 'ink', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => (180 / Math.PI) * (4 * Math.asin(x / 1.333) - 2 * Math.asin(x)), color: 'coral', width: 3 }, { f: (x) => 180 + (180 / Math.PI) * (2 * Math.asin(x) - 6 * Math.asin(x / 1.333)), color: 'blue', width: 3 }, { f: () => 42, color: 'coral', dash: true }, { f: () => 51, color: 'blue', dash: true }],
                points: [{ x: (p) => p.b, y: (p) => (180 / Math.PI) * (4 * Math.asin(p.b / 1.333) - 2 * Math.asin(p.b)), color: 'coral' }, { x: (p) => p.b, y: (p) => 180 + (180 / Math.PI) * (2 * Math.asin(p.b) - 6 * Math.asin(p.b / 1.333)), color: 'blue' }],
                extra: ({ plot, s }) => [s('rect', { x: plot.X(0), y: plot.Y(51), width: plot.X(1) - plot.X(0), height: plot.Y(42) - plot.Y(51), fill: 'var(--ink)', opacity: 0.12 })],
                readout: (p) => `one reflection: **${((180 / Math.PI) * (4 * Math.asin(p.b / 1.333) - 2 * Math.asin(p.b))).toFixed(1)}°** · two reflections: **${(180 + (180 / Math.PI) * (2 * Math.asin(p.b) - 6 * Math.asin(p.b / 1.333))).toFixed(1)}°**`,
              },
              after: r`One reflection never sends light beyond about $42°$, and the angle lingers there for a wide range of $b$: light piles up at that edge, making the primary bow. Two reflections never come back inside $51°$, piling up at the secondary bow. Between them (shaded) neither sends any light: Alexander’s dark band.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The dark band',
              prompt: r`The primary bow's red edge is at about 42° and the secondary bow's red edge is at about 50°. About how wide is Alexander's dark band, in degrees?`,
              unit: '°',
              answer: 8,
              wrong: [{ v: 92, why: 'Subtract the angles: 50 − 42.' }, { v: 51, why: 'That’s roughly the secondary bow’s position. The band is the gap between the two red edges.' }],
              explain: r`About $50° - 42° = 8°$ of darker sky, roughly the width of your fist at arm's length.`,
            },
          ],
          recap: [
            'Two internal reflections make a secondary bow at about 51°.',
            'Its colours are reversed, and it’s fainter.',
            'Alexander’s dark band lies between the two bows.',
          ],
        },
      ],
    },
    {
      title: 'Ice and Air',
      summary: 'Halos and mirages.',
      lessons: [
        {
          id: 'halos',
          title: 'Halos & Sundogs',
          summary: 'Ice crystal prisms',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Six-sided prisms',
              body: r`High, thin clouds are made of tiny **hexagonal ice crystals**. Light passing in through one side face and out through the next goes through a 60° prism. Like the rainbow, the light piles up at the **minimum deviation** angle: for ice, about **22°**. Randomly oriented crystals spread this into a ring around the Sun or Moon: the **22° halo**.`,
            },
            {
              type: 'numeric',
              title: 'Minimum deviation',
              prompt: r`For a prism with apex angle $A$, the minimum deviation $\delta$ satisfies $n\sin\tfrac{A}{2} = \sin\tfrac{A + \delta}{2}$. For ice ($n = 1.31$) and $A = 60°$, find $\delta$ in degrees. (Nearest degree.)`,
              unit: '°',
              answer: 22,
              tol: 0.5,
              wrong: [{ v: 82, why: r`That's $A + \delta$. Subtract the apex angle: $\delta = 2\arcsin(0.655) - 60°$.` }, { v: 41, why: r`$\frac{A + \delta}{2} = \arcsin(1.31 \times 0.5) \approx 40.9°$, so $\delta = 81.8° - 60°$.` }],
              explain: r`$\sin\tfrac{60° + \delta}{2} = 1.31 \times \sin 30° = 0.655$, so $\tfrac{60° + \delta}{2} \approx 40.9°$ and $\delta \approx 21.8°$. That's the radius of the halo: about the span of your outstretched hand at arm's length.`,
            },
            {
              type: 'numeric',
              title: 'The 46° halo',
              prompt: r`Light can also pass through a crystal's side face and out of its flat end: a 90° prism. Using $n\sin 45° = \sin\frac{90° + \delta}{2}$ with $n = 1.31$, find the minimum deviation. (Nearest degree.)`,
              unit: '°',
              answer: Math.round(2 * Math.asin(1.31 * Math.sin(Math.PI / 4)) * DEG - 90),
              tol: 0.6,
              wrong: [{ v: 22, why: 'That’s the 60° prism. Use A = 90°.' }],
              explain: r`$\sin\frac{90° + \delta}{2} = 1.31 \times 0.707 = 0.926$, so $\frac{90° + \delta}{2} \approx 67.9°$ and $\delta \approx 46°$: the rarer, fainter **46° halo**.`,
            },
            {
              type: 'mcq',
              title: 'Sundogs',
              prompt: r`Sometimes, instead of a full ring, two bright spots appear 22° to the left and right of a low Sun: **sundogs**. What's different about the crystals?`,
              choices: [
                { t: 'Flat plate crystals drift down horizontally, like falling leaves, so their prisms point in only one direction', ok: true },
                { t: 'The crystals are much larger', why: 'Size isn’t the key. Orientation is: aligned crystals send light to specific spots instead of a whole ring.' },
                { t: 'The crystals are spinning rapidly', why: 'It’s the steady, aligned orientation of falling plates that matters.' },
              ],
              explain: r`Plate-shaped crystals fall with their flat faces horizontal, so their vertical side faces act as prisms only for light coming in horizontally. That concentrates the halo's light into two spots level with the Sun: the sundogs (parhelia).`,
            },
            {
              type: 'interactive',
              title: 'Piling up at 22°',
              body: r`Light passes through two faces of a hexagonal ice crystal that meet at $60°$, like a prism. The deviation depends on the angle at which it enters. Find the entry angle that bends the light **least**.`,
              widget: {
                kind: 'graph', xmin: 14, xmax: 90, ymin: 15, ymax: 50, grid: false, height: 260, axes: { xlabel: 'entry angle (°)', ylabel: 'deviation (°)', xticks: 10, yticks: 5, xAt: 14, yAt: 15 },
                params: { i: { min: 14, max: 90, step: 0.5, value: 70, label: 'entry angle', color: 'teal', format: (v) => `${v.toFixed(1)}°` } },
                curves: [{ f: (x) => { const r = Math.PI / 180, a = Math.asin(Math.sin(x * r) / 1.31); return x + Math.asin(1.31 * Math.sin(60 * r - a)) / r - 60; }, color: 'violet', width: 3 }, { f: () => 21.84, color: 'teal', dash: true }],
                points: [{ x: (p) => p.i, y: (p) => { const r = Math.PI / 180, a = Math.asin(Math.sin(p.i * r) / 1.31); return p.i + Math.asin(1.31 * Math.sin(60 * r - a)) / r - 60; }, color: 'coral' }],
                readout: (p) => { const r = Math.PI / 180, a = Math.asin(Math.sin(p.i * r) / 1.31), e = Math.asin(1.31 * Math.sin(60 * r - a)) / r; return `exits at ${e.toFixed(1)}° · deviation **${(p.i + e - 60).toFixed(2)}°**`; },
                goal: (p) => Math.abs(p.i - 40.9) < 0.7,
                hint: 'The minimum is where the light passes symmetrically: it exits at the same angle it entered.',
                solution: { i: 41 },
              },
              explain: r`At about $41°$ the light passes symmetrically and is deviated by the minimum, about $22°$. Near the minimum the curve is flat, so a wide range of entry angles all give nearly $22°$: randomly tilted crystals send a lot of light to that angle and none to smaller ones, making a sharp-edged ring of radius $22°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Halo in Moon widths',
              prompt: r`The common halo has a radius of $22°$. The Moon appears about $0.5°$ across. How many Moon-widths is the halo’s radius?`,
              unit: 'Moon widths',
              answer: 44,
              explain: r`$\frac{22}{0.5} = 44$ Moon diameters: much bigger than most people expect. A hand at arm’s length with fingers spread (thumb to little finger) spans about 20°, a handy way to recognise the 22° halo.`,
            },
          ],
          recap: [
            'Hexagonal ice crystals act as 60° prisms.',
            'Minimum deviation of about 22° creates the 22° halo.',
            'Horizontally aligned plates make sundogs beside the Sun.',
          ],
        },
        {
          id: 'mirages',
          title: 'Mirages',
          summary: 'Bending light in air',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              title: 'Water on the road',
              prompt: r`On a hot day, a road ahead seems to have shimmering pools of water that vanish as you approach. What are you actually seeing?`,
              choices: [
                { t: 'Light from the sky, bent upward by hot air near the road, so you see the sky reflected', ok: true },
                { t: 'Real puddles that evaporate quickly', why: 'They recede as you approach, which real puddles wouldn’t do.' },
                { t: 'Heat radiation glowing', why: 'Road heat radiation is infrared and invisible. What you see is bent skylight.' },
              ],
              explain: r`Air just above a hot road is hotter and less dense, so light travels slightly faster there. Light from the sky heading down at a shallow angle gets bent gradually **upward**, like a ball rolling over a shallow bowl, and reaches your eye from below. Your brain interprets it as sky reflected in water: an **inferior mirage**.`,
            },
            {
              type: 'mcq',
              title: 'Ships in the sky',
              prompt: r`Over a cold sea, with warmer air above, distant ships and coastlines sometimes appear lifted up, stretched or even upside down above the horizon. What causes this?`,
              choices: [
                { t: 'A superior mirage: light bends down towards the denser cold air, so objects appear higher than they are', ok: true },
                { t: 'Reflections from the clouds', why: 'Clouds don’t reflect like mirrors. The air’s temperature layers bend the light.' },
                { t: 'An inferior mirage, like a hot road', why: 'Inferior mirages appear below the object; here the air near the surface is colder, not hotter.' },
              ],
              explain: r`When cold, dense air lies under warm air, light curves downward, following the Earth's curve, and objects beyond the horizon can come into view. Complex, shifting versions are called **Fata Morgana**, after the sorceress said to conjure castles in the air.`,
            },
            {
              type: 'numeric',
              title: 'Extra daylight',
              prompt: r`Near the equator the Sun sinks at about 0.25° per minute. If refraction lifts its image by 0.5°, how many extra minutes of sunlight does that add at sunset?`,
              unit: 'minutes',
              answer: 2,
              wrong: [{ v: 0.5, why: 'Divide the lift by the rate: 0.5 ÷ 0.25.' }],
              explain: r`$\frac{0.5}{0.25} = 2$ minutes, at sunrise and sunset each, so refraction adds about 4 minutes of daylight a day. Near the poles, where the Sun crosses the horizon at a shallow slant, the effect can last much longer.`,
            },
            {
              type: 'mcq',
              title: 'Seeing the Sun after sunset',
              prompt: r`Earth's atmosphere bends light from objects near the horizon by about 0.5°, roughly the Sun's own width. What does that mean at sunset?`,
              choices: [
                { t: 'When you see the Sun’s bottom edge touch the horizon, the Sun is geometrically already just below it', ok: true },
                { t: 'Sunsets happen 0.5° earlier than they should', why: 'Refraction lifts the image, so the Sun is visible for longer, not shorter.' },
                { t: 'Nothing: the effect is too small to notice', why: 'Half a degree is about the whole width of the Sun, which adds a couple of minutes of daylight.' },
              ],
              explain: r`Refraction lifts the Sun's image by about its own diameter, so it stays visible a few minutes longer than it otherwise would. Because the bottom edge is lifted more than the top, the setting Sun also looks **squashed**. And in very clear air, the last sliver can flash green: the famous green flash.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Rays that turn back up',
              body: r`Air just above a hot road is thinner, so light bends **upward** as it skims the road. Trace rays from an eye 1.5 m up, looking down the road at small angles (the height is stretched hugely). Turn up the heating.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: 0, ymax: 3, grid: false, height: 260, axes: { xlabel: 'distance along road (m)', ylabel: 'height (m)', xticks: 50, yticks: 1 },
                params: { k: { min: 0, max: 3, step: 0.05, value: 1, label: 'heating (bending)', color: 'coral', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => { const out = [], K = p.k * 1e-4; for (let deg = 0.2; deg <= 1.81; deg += 0.2) { const a = Math.tan((deg * Math.PI) / 180); let d = '', hit = false; for (let x = 0; x <= 300; x += 2) { const y = 1.5 - a * x + 0.5 * K * x * x; if (y < 0) { hit = true; break; } if (y > 3) break; d += (d ? 'L' : 'M') + plot.X(x).toFixed(1) + ' ' + plot.Y(y).toFixed(1); } out.push(s('path', { d, fill: 'none', stroke: hit ? 'var(--amber)' : 'var(--blue)', 'stroke-width': 2 })); } out.push(s('circle', { cx: plot.X(0), cy: plot.Y(1.5), r: 6, class: 'fl-ink' })); return out; },
                readout: (p) => { if (p.k === 0) return 'no bending: every downward ray hits the road (amber)'; const ac = Math.sqrt(2 * p.k * 1e-4 * 1.5); return `rays aimed less than **${((ac * 180) / Math.PI).toFixed(2)}°** down curve back up to the sky (blue) · “water” appears from about ${(1.5 / ac).toFixed(0)} m away`; },
              },
              after: r`A blue ray started downward but ended up in the sky, so when you look down along it you see sky, apparently lying on the road: it looks like a puddle. The hotter the road, the steeper the angles that turn back, and the nearer the “water” appears. Mirage water always recedes as you approach, because it is really just the sky.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The green flash',
              prompt: r`Just as the last sliver of the Sun sets over a clear sea horizon, it sometimes flashes green for a second or two. What causes this?`,
              choices: [
                { t: r`The atmosphere bends blue-green light slightly more than red, so the green image of the Sun’s top edge sets last`, ok: true },
                { t: r`The ocean reflects green light`, why: r`The effect is in the air, not the water: it’s seen over desert horizons too.` },
                { t: r`It’s an after-image in the eye`, why: r`It’s been photographed, so it’s real light, not an illusion.` },
              ],
              explain: r`Refraction (which lifts the setting Sun by over half a degree) is slightly stronger for shorter wavelengths, so the Sun’s images in different colours are stacked, with green on top. Blue is usually scattered away, leaving green as the last colour visible, especially when a mirage magnifies the effect.`,
            },
          ],
          recap: [
            'Temperature gradients in air bend light.',
            'Road mirages are bent images of the sky.',
            'Atmospheric refraction lifts and squashes the setting Sun.',
          ],
        },
      ],
    },
    {
      title: 'Scattering and Diffraction',
      summary: 'Blue skies and rings around the Moon.',
      lessons: [
        {
          id: 'bluesky',
          title: 'Why the Sky Is Blue',
          summary: 'Rayleigh scattering',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Scattering by molecules',
              body: r`Air molecules are far smaller than the wavelength of light. When light passes, it sets their electrons oscillating, and they re-radiate light in all directions: **scattering**. Lord Rayleigh showed in 1871 that the strength of this scattering goes as
$$\text{scattering} \propto \frac{1}{\lambda^4}$$
Short wavelengths (blue) scatter far more than long ones (red). The blue sky is sunlight scattered sideways towards us from all over the atmosphere.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Four times as strong',
              prompt: r`Compared with red light at 700 nm, find the wavelength that is scattered **four times** more strongly.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 720, ymin: 0, ymax: 12, grid: 40, gridY: 2, height: 260, axes: { xlabel: 'wavelength (nm)', ylabel: 'scattering (red = 1)', xAt: 380 },
                params: { lam: { min: 380, max: 700, step: 1, value: 600, slider: false } },
                curves: [{ f: (x) => rayleigh(x), color: 'blue', width: 3 }, { f: () => 4, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.lam, y: (p) => rayleigh(p.lam), drag: { x: 'lam' }, color: 'violet' }],
                extra: ({ plot, s }) => Array.from({ length: 80 }, (_, i) => { const lam = 380 + i * 4; return s('rect', { x: plot.X(lam), y: plot.Y(0.6), width: plot.X(lam + 4) - plot.X(lam) + 0.5, height: plot.Y(0) - plot.Y(0.6), fill: `hsl(${hueOf(Math.max(400, Math.min(700, lam)))}, 85%, 55%)` }); }),
                readout: (p) => r`${p.lam} nm: scattered $\left(\frac{700}{${p.lam}}\right)^4 = ${rayleigh(p.lam).toFixed(2)}$ times as strongly as red`,
                goal: (p) => Math.abs(rayleigh(p.lam) - 4) < 0.03,
                hint: r`You need $\frac{700}{\lambda} = \sqrt[4]{4} = \sqrt2$.`,
                solution: { lam: 495 },
              },
              explain: r`$\lambda = \frac{700}{\sqrt2} \approx 495$ nm, blue-green. Halving the wavelength would multiply scattering by 16. That steep dependence is why the clear sky is blue rather than white.`,
            },
            {
              type: 'numeric',
              title: 'Violet versus red',
              prompt: r`How many times more strongly is violet light (400 nm) scattered than red (700 nm)? (1 decimal place.)`,
              unit: '×',
              answer: rayleigh(400),
              tol: 0.06,
              wrong: [{ v: 1.75, tol: 0.01, why: 'Raise the ratio to the 4th power.' }],
              explain: r`$\left(\frac{700}{400}\right)^4 \approx 9.4$. So why isn't the sky violet? Sunlight contains less violet than blue, some violet is absorbed high in the atmosphere, and our eyes are much less sensitive to violet. The mixture we see looks sky blue.`,
            },
            {
              type: 'mcq',
              title: 'Red sunsets',
              prompt: r`Why are sunsets red and orange?`,
              choices: [
                { t: 'Sunlight crosses far more air near the horizon, so most blue is scattered out of the beam before it reaches you', ok: true },
                { t: 'The Sun is cooler in the evening', why: 'The Sun’s temperature doesn’t change over a day; the path through the air does.' },
                { t: 'Dust in the air is red', why: 'Dust can enhance colours, but even perfectly clean air gives red sunsets.' },
              ],
              explain: r`At sunset, light travels through roughly 40 times more atmosphere than at noon. With blue scattered away (to make someone else's blue sky further west), what's left is red and orange. Volcanic eruptions, like Krakatoa in 1883, have caused spectacular sunsets worldwide.`,
            },
            {
              type: 'mcq',
              title: 'Why not violet?',
              prompt: r`Violet light is scattered even more strongly than blue. So why does the sky look blue rather than violet?`,
              choices: [
                { t: r`Sunlight contains less violet, some is absorbed high in the atmosphere, and our eyes are less sensitive to it`, ok: true },
                { t: r`Violet light can’t be scattered`, why: r`It is scattered more than blue; other factors tip the balance.` },
                { t: r`The sky really is violet`, why: r`A spectrometer finds most scattered energy in the blue, and our eyes add to the effect.` },
              ],
              explain: r`The scattered spectrum peaks in the blue–violet, but our eyes’ colour sensors respond to the mixture by reporting "sky blue", a blend of blue with some green and a little violet.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'White clouds',
              prompt: r`If blue scatters more, why are clouds white rather than blue?`,
              choices: [
                { t: 'Cloud droplets are much larger than the wavelength of light, and scatter all colours about equally', ok: true },
                { t: 'Clouds contain white pigment', why: 'Clouds are just water droplets; their colour comes from how they scatter light.' },
                { t: 'Clouds absorb blue light', why: 'Water absorbs very little visible light over such short distances.' },
              ],
              explain: r`Rayleigh's $1/\lambda^4$ law holds only for particles much smaller than the wavelength. Droplets around 10 µm across scatter all wavelengths similarly (Mie scattering), so clouds look white, or grey when thick enough to block the light.`,
            },
          ],
          recap: [
            r`Rayleigh scattering by molecules goes as $1/\lambda^4$: blue scatters most.`,
            'Long paths through air at sunset leave red and orange.',
            'Big droplets scatter all colours equally, so clouds are white.',
          ],
        },
        {
          id: 'coronas',
          title: 'Coronas',
          summary: 'Measuring droplets with a ring',
          icon: 'moon',
          steps: [
            {
              type: 'explain',
              title: 'Rings close to the Moon',
              body: r`A thin cloud passing in front of the Moon often shows a small, coloured ring hugging it: a **corona**. It's much smaller than a 22° halo and comes from **diffraction** by tiny water droplets, each acting like a small circular obstacle.

The angle to the first dark ring is about
$$\theta \approx 1.22\,\frac{\lambda}{d}$$
where $d$ is the droplet diameter. Smaller droplets give bigger coronas.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Measure the droplets',
              prompt: r`A corona around the Moon has its first dark ring at **2°**. Find the droplet diameter (for green light, 550 nm).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 8, grid: 5, gridY: 1, height: 260, axes: { xlabel: 'droplet diameter (µm)', ylabel: 'corona radius (°)' },
                params: { d: { min: 4, max: 60, step: 0.1, value: 40, slider: false } },
                curves: [{ f: (x) => (x > 3 ? coronaDeg(x) : NaN), color: 'violet', width: 3 }, { f: () => 2, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.d, y: (p) => Math.min(8, coronaDeg(p.d)), drag: { x: 'd' }, color: 'teal' }],
                readout: (p) => r`droplets $${p.d.toFixed(1)}\ \mu$m: corona radius $${coronaDeg(p.d).toFixed(2)}°$`,
                goal: (p) => Math.abs(coronaDeg(p.d) - 2) < 0.02,
                hint: r`$d = \frac{1.22\lambda}{\theta}$, with $\theta$ in radians ($2° = 0.0349$ rad).`,
                solution: { d: 19.2 },
              },
              explain: r`$d = \frac{1.22 \times 550 \times 10^{-9}}{0.0349} \approx 19\ \mu$m, typical for cloud droplets. Meteorologists once used coronas to estimate droplet sizes from the ground.`,
            },
            {
              type: 'mcq',
              title: 'Which colour outside?',
              prompt: r`The outer edge of each corona ring is red, the inner edge bluish. Why?`,
              choices: [
                { t: 'Longer wavelengths diffract to larger angles', ok: true },
                { t: 'Red light refracts more', why: 'In refraction (rainbows) violet bends more. Diffraction favours long wavelengths for wide angles.' },
                { t: 'Red light is brighter', why: 'The order comes from wavelength, not brightness.' },
              ],
              explain: r`Since $\theta \propto \lambda$, red (700 nm) rings sit about 1.6 times further out than violet (430 nm) ones. Rainbows and halos come from refraction; coronas and glories come from diffraction, which is why their colour orders differ.`,
            },
            {
              type: 'numeric',
              title: 'Pollen coronas',
              prompt: r`In spring, coronas can appear in clear skies from pollen grains. A birch-pollen corona has its first ring at about 1.4°. Treating pollen like droplets, estimate the grain size in µm. (Nearest whole number.)`,
              unit: 'µm',
              answer: Math.round((1.22 * 550e-9) / ((1.4 * Math.PI) / 180) * 1e6),
              tol: 1,
              wrong: [{ v: 19, why: 'A smaller corona means bigger particles: use 1.4°.' }],
              explain: r`$d = \frac{1.22 \times 550 \times 10^{-9}}{0.0244} \approx 27\ \mu$m, close to real birch pollen (around 20–30 µm). Pollen coronas are often oval because the grains aren't spheres.`,
            },
            {
              type: 'mcq',
              title: 'Corona or halo?',
              prompt: r`A small coloured ring hugging the Moon, a few degrees across, versus a big ring 22° out. What causes each?`,
              choices: [
                { t: r`The small corona is diffraction by tiny water droplets; the 22° halo is refraction through ice crystals`, ok: true },
                { t: r`Both are refraction by ice`, why: r`The 22° halo is; a corona comes from diffraction by droplets.` },
                { t: r`Both are reflections off clouds`, why: r`Neither is a reflection.` },
              ],
              explain: r`Coronas get bigger as droplets get smaller (angle $\propto \lambda/d$), so they vary from night to night. Halos are always 22° because they depend only on the 60° angle of ice crystals and ice’s refractive index.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Iridescent clouds',
              prompt: r`Sometimes thin cloud edges near the Sun shimmer with pastel pinks and greens. What does this tell you about the droplets there?`,
              choices: [
                { t: 'They’re small and similar in size, so their diffraction rings line up; different sizes in different patches give different colours', ok: true },
                { t: 'There’s oil in the clouds', why: 'It looks like an oil film, but the colours come from diffraction by droplets.' },
                { t: 'The cloud is made of ice prisms', why: 'Ice prisms make halos at 22°; iridescence comes from diffraction by small droplets.' },
              ],
              explain: r`Fresh, newly forming clouds have small, uniform droplets: perfect for diffraction colours. Each patch shows the colour diffracted towards you by its own droplet size, painting the cloud like mother-of-pearl.`,
            },
          ],
          recap: [
            'Coronas are diffraction rings from tiny droplets or grains.',
            r`Ring angle $\theta \approx 1.22\lambda/d$: smaller droplets, bigger rings.`,
            'Diffraction puts red outside, the reverse of refraction-based bows.',
          ],
        },
        {
          id: 'polarised-sky',
          title: 'The Polarised Sky',
          summary: 'A hidden pattern bees can see',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Scattered light is sorted',
              body: r`When sunlight scatters off air molecules, the scattered light is **polarised**: its electric field vibrates mostly in one direction. The effect depends on the angle $\theta$ between the sunlight and the direction you look. For ideal Rayleigh scattering, the **degree of polarisation** is
$$P = \frac{\sin^2\theta}{1 + \cos^2\theta},$$
zero looking towards (or directly away from) the Sun, and greatest at $90°$ from it.`,
            },
            {
              type: 'mcq',
              title: 'At sunset',
              prompt: r`The Sun is setting on the horizon. Where in the sky is the light most strongly polarised?`,
              choices: [
                { t: 'In a band passing overhead, 90° from the Sun', ok: true },
                { t: 'Near the setting Sun', why: r`Looking near the Sun, $\theta$ is small and the polarisation is weak.` },
                { t: 'Equally everywhere', why: 'Polarisation depends strongly on the angle from the Sun.' },
              ],
              explain: r`The band of maximum polarisation is a great circle 90° from the Sun. At sunset it runs straight through the zenith, from north to south (if the Sun sets in the west). Rotate polarising sunglasses while looking overhead and the sky darkens and brightens.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Half polarised',
              prompt: r`Find the angle from the Sun at which the light is exactly **50%** polarised (on the side between the Sun and the 90° band).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 180, ymin: 0, ymax: 1.05, grid: false, height: 260, axes: { xlabel: 'angle from the Sun (°)', ylabel: 'degree of polarisation', xticks: 30, yticks: 0.25 },
                params: { th: { min: 0, max: 180, step: 0.1, value: 30, label: 'angle', color: 'blue', format: (v) => `${v.toFixed(1)}°` } },
                curves: [{ f: (x) => { const t = (x * Math.PI) / 180; return Math.sin(t) ** 2 / (1 + Math.cos(t) ** 2); }, color: 'violet', width: 3 }, { f: () => 0.5, color: 'muted', dash: true }],
                points: [{ x: (p) => p.th, y: (p) => { const t = (p.th * Math.PI) / 180; return Math.sin(t) ** 2 / (1 + Math.cos(t) ** 2); }, color: 'blue' }],
                readout: (p) => { const t = (p.th * Math.PI) / 180; return `polarisation **${((100 * Math.sin(t) ** 2) / (1 + Math.cos(t) ** 2)).toFixed(1)}%**`; },
                goal: (p) => Math.abs(p.th - 54.74) < 0.3,
                hint: r`$\sin^2\theta = \frac12(1 + \cos^2\theta)$ leads to $\cos^2\theta = \frac13$.`,
                solution: { th: 54.7 },
              },
              explain: r`$\cos^2\theta = \frac13$ gives $\theta \approx 54.7°$ (and $125.3°$ on the far side). In the real sky, multiple scattering and haze reduce the polarisation: even at 90° it reaches only about 75% on a clear day.`,
            },
            {
              type: 'mcq',
              title: 'Navigating by the pattern',
              prompt: r`Honeybees can see polarisation. Why is that useful when the Sun is hidden behind a cloud?`,
              choices: [
                { t: 'A patch of blue sky reveals the polarisation pattern, from which the Sun’s direction can be worked out', ok: true },
                { t: 'Polarised light is brighter, so they can see through clouds', why: 'It isn’t brighter. The pattern of directions encodes where the Sun is.' },
                { t: 'It lets them see ultraviolet flowers', why: 'That’s a different ability (UV vision). Polarisation helps with navigation.' },
              ],
              explain: r`The pattern of polarisation directions across the sky is arranged around the Sun, so even a small patch of blue sky gives away its position. Some historians think Viking sailors may have used calcite "sunstones" the same way.`,
            },
            {
              type: 'numeric',
              title: 'Sixty degrees',
              prompt: r`What is the ideal degree of polarisation at $60°$ from the Sun? (Percentage.)`,
              unit: '%',
              answer: 60,
              tol: 0.5,
              explain: r`$\sin^2 60° = 0.75$ and $1 + \cos^2 60° = 1.25$, so $P = \frac{0.75}{1.25} = 60\%$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Forty-five degrees',
              prompt: r`What is the ideal degree of polarisation at $45°$ from the Sun? (Percentage, 1 decimal place.)`,
              unit: '%',
              answer: 100 / 3,
              tol: 0.1,
              explain: r`$\sin^2 45° = \cos^2 45° = \frac12$, so $P = \frac{0.5}{1.5} = \frac13 \approx 33.3\%$.`,
            },
          ],
          recap: [
            'Scattered skylight is polarised, most strongly 90° from the Sun.',
            r`Ideal degree of polarisation: $P = \sin^2\theta / (1 + \cos^2\theta)$.`,
            'Insects (and perhaps Vikings) navigate by the pattern.',
          ],
        },
      ],
    },
  ],
};
