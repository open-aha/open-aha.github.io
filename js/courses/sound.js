import { fix } from '../lib/svg.js';

const r = String.raw;
const TAU = 2 * Math.PI;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f1 = (v) => fix(v, 1);
const f2 = (v) => fix(v, 2);

// ── widgets ──────────────────────────────────────────────

// Longitudinal wave: rows of air "molecules" that only jiggle back and forth.
const airWave = {
  kind: 'graph', xmin: 0, xmax: 12, ymin: -2.6, ymax: 2.7, grid: false, axes: false, height: 330,
  animate: { param: 't', speed: 1, autoplay: true },
  params: { t: { min: 0, max: 1e9, step: 0.001, value: 0, slider: false } },
  curves: [{ f: (x, p) => -1.55 - 0.75 * Math.cos((TAU / 4) * x - TAU * 0.5 * p.t), color: 'coral' }],
  extra: ({ plot, p, s }) => {
    const els = [];
    const k = TAU / 4, w = TAU * 0.5, A = 0.32;
    for (let row = 0; row < 6; row++) {
      const y = 0.25 + row * 0.42;
      for (let i = 0; i <= 48; i++) {
        const x0 = i * 0.25 + (row % 2 ? 0.125 : 0);
        const x = x0 + A * Math.sin(k * x0 - w * p.t);
        const tagged = row === 3 && i === 20;
        els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: tagged ? 7 : 4, class: tagged ? 'fl-coral' : 'fl-blue', opacity: tagged ? 1 : 0.75 }));
      }
    }
    els.push(s('text', { x: plot.X(0.15), y: plot.Y(-0.45), class: 'lbl', text: 'air pressure' }));
    els.push(s('line', { x1: plot.X(0), x2: plot.X(12), y1: plot.Y(-1.55), y2: plot.Y(-1.55), class: 'st-muted', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }));
    return els;
  },
  ready: true,
};

// Doppler: wavefronts from a moving source. M = source speed / sound speed.
const DOP = { c: 1.4, T: 0.36, x0: -4, tmax: 5 };
const doppler = {
  kind: 'graph', equal: true, xmin: -6.5, xmax: 6.5, ymin: -3.2, ymax: 3.2, grid: false, axes: false, maxWidth: 640,
  animate: { param: 't', speed: 1, max: DOP.tmax, autoplay: true },
  params: {
    t: { min: 0, max: DOP.tmax, step: 0.001, value: 0, slider: false },
    M: { min: 0, max: 1.4, step: 0.1, value: 0.5, label: r`$v_s / v$`, color: 'coral', format: (v) => v.toFixed(1) },
  },
  extra: ({ plot, p, s }) => {
    const els = [];
    const px = (u) => plot.X(u) - plot.X(0);
    const xs = (t) => DOP.x0 + p.M * DOP.c * t;
    for (let k = 0; k * DOP.T <= p.t; k++) {
      const tk = k * DOP.T;
      const R = DOP.c * (p.t - tk);
      els.push(s('circle', { cx: plot.X(xs(tk)), cy: plot.Y(0), r: px(R), fill: 'none', class: 'st-blue', 'stroke-width': 2, opacity: Math.max(0.2, 1 - R / 9) }));
    }
    els.push(s('circle', { cx: plot.X(xs(p.t)), cy: plot.Y(0), r: 10, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 3 }));
    for (const [x, t] of [[-6, 'behind'], [6, 'ahead']]) {
      els.push(s('circle', { cx: plot.X(x), cy: plot.Y(-2.6), r: 8, class: 'fl-ink' }));
      els.push(s('text', { x: plot.X(x), y: plot.Y(-2.6) - 16, 'text-anchor': 'middle', class: 'lbl', text: t }));
    }
    return els;
  },
  readout: (p) => {
    if (p.M === 0) return r`Source at rest: everyone hears the true frequency $f$.`;
    if (p.M >= 1) return r`Faster than sound! The wavefronts pile up into a **shock cone**: a sonic boom.`;
    return r`ahead: $\dfrac{f}{1 - ${f1(p.M)}} = ${f2(1 / (1 - p.M))}f$ $\quad$ behind: $\dfrac{f}{1 + ${f1(p.M)}} = ${f2(1 / (1 + p.M))}f$`;
  },
};

// Standing waves in a pipe: open–open or closed–open. Shows how far the air moves.
const pipe = {
  kind: 'graph', xmin: -0.8, xmax: 10.8, ymin: -2.2, ymax: 2.2, grid: false, axes: false, height: 280,
  animate: { param: 't', speed: 1, autoplay: true },
  params: {
    t: { min: 0, max: 1e9, step: 0.001, value: 0, slider: false },
    m: { min: 1, max: 4, step: 1, value: 1, label: 'mode', color: 'blue', format: (v) => `${v}` },
    closed: { min: 0, max: 1, step: 1, value: 0, label: 'left end', color: 'coral', format: (v) => (v ? 'closed' : 'open') },
  },
  extra: ({ plot, p, s }) => {
    const L = 10;
    const n = p.closed ? 2 * p.m - 1 : p.m;
    const env = (x) => (p.closed ? Math.sin((n * Math.PI * x) / (2 * L)) : Math.cos((n * Math.PI * x) / L));
    const osc = Math.cos(TAU * 0.6 * p.t);
    const els = [];
    els.push(s('rect', { x: plot.X(0), y: plot.Y(1.5), width: plot.X(L) - plot.X(0), height: plot.Y(-1.5) - plot.Y(1.5), class: 'fl-surface', stroke: 'var(--ink)', 'stroke-width': 3 }));
    if (p.closed) els.push(s('rect', { x: plot.X(0) - 10, y: plot.Y(1.5), width: 10, height: plot.Y(-1.5) - plot.Y(1.5), class: 'fl-ink' }));
    // air columns: vertical "slices" of air that slide back and forth
    for (let i = 0; i <= 40; i++) {
      const x0 = (i / 40) * L;
      const x = x0 + 0.22 * env(x0) * osc;
      els.push(s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(1.3), y2: plot.Y(-1.3), class: 'st-blue', 'stroke-width': 2, opacity: 0.6 }));
    }
    // envelope
    for (const sgn of [1, -1]) {
      let d = '';
      for (let i = 0; i <= 120; i++) {
        const x = (i / 120) * L;
        d += `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(sgn * 1.15 * Math.abs(env(x))).toFixed(1)}`;
      }
      els.push(s('path', { d, fill: 'none', class: 'st-coral', 'stroke-width': 3 }));
    }
    els.push(s('text', { x: plot.X(L / 2), y: plot.Y(-1.9), 'text-anchor': 'middle', class: 'lbl', text: 'coral outline: how far the air moves (wide = a lot, pinched = none)' }));
    return els;
  },
  readout: (p) => {
    const n = p.closed ? 2 * p.m - 1 : p.m;
    return p.closed ? r`closed–open: $f = ${n}\cdot\dfrac{v}{4L}$ (harmonic ${n})` : r`open–open: $f = ${n}\cdot\dfrac{v}{2L}$ (harmonic ${n})`;
  },
};

// Two tones played together: simple ratios make short repeating patterns.
const INTERVALS = [
  ['Unison', 1, 1], ['Octave', 2, 1], ['Perfect fifth', 3, 2], ['Perfect fourth', 4, 3], ['Major third', 5, 4], ['Tritone', 45, 32],
];
const intervals = {
  kind: 'graph', xmin: 0, xmax: 4, ymin: -2.3, ymax: 2.3, grid: false, axes: false, height: 260,
  params: { i: { min: 0, max: 5, step: 1, value: 2, label: 'interval', color: 'violet', format: (v) => INTERVALS[v][0] } },
  curves: [{ f: (x, p) => Math.sin(TAU * x) + Math.sin((TAU * INTERVALS[p.i][1] * x) / INTERVALS[p.i][2]), color: 'violet' }],
  extra: ({ plot, p, s }) => {
    const q = INTERVALS[p.i][2];
    const els = [];
    for (let k = q; k < 4 + 1e-9; k += q) els.push(s('line', { x1: plot.X(k), x2: plot.X(k), y1: plot.Y(2.2), y2: plot.Y(-2.2), class: 'st-muted', 'stroke-width': 2, 'stroke-dasharray': '6 6' }));
    return els;
  },
  readout: (p) => {
    const [name, a, b] = INTERVALS[p.i];
    return b <= 4
      ? r`${name}: ratio $${a}:${b}$. The combined wave repeats every ${b === 1 ? 'cycle' : `${b} cycles`} of the lower note.`
      : r`${name}: ratio $${a}:${b}$. It takes ${b} cycles to repeat, so it sounds tense.`;
  },
  ready: true,
};

// Sabine reverberation: hall volume 20,000 m³, hard surfaces 400 m² sabins, panels absorb 80%
const rt60 = (S) => (0.161 * 20000) / (400 + 0.8 * S);
// interaural time difference (ms) for a source at angle th (degrees from straight ahead), ears 0.2 m apart
const itd = (th) => ((0.2 * Math.sin((th * Math.PI) / 180)) / 343) * 1000;

export default {
  id: 'sound',
  subject: 'physics',
  title: 'Sound & Hearing',
  level: 'Intermediate',
  cover: 'sound',
  tagline: 'Pressure waves, decibels, the Doppler effect, music, concert halls and how your ears locate sounds.',
  description: r`Sound is a ripple of pressure passing through the air. Find out how fast it travels, why loudness is measured in decibels, why a passing siren drops in pitch, how flutes and clarinets choose their notes, why some pairs of notes sound sweet together, how concert halls are tuned, and how two ears tell you where a sound came from.`,
  prereq: 'Waves & Oscillations',
  chapters: [
    {
      title: 'What Sound Is',
      summary: 'A travelling squeeze.',
      lessons: [
        {
          id: 'pressure-waves',
          title: 'Pressure Waves',
          summary: 'Compressions, rarefactions and pitch',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Squeezes in the air',
              body: r`A speaker cone pushes and pulls on the air in front of it. Watch the molecules (blue). Crowded regions are **compressions**, where the pressure is a little higher. Sparse regions are **rarefactions**, where it is a little lower.`,
              widget: airWave,
              after: r`Follow the coral molecule. It only jiggles back and forth around one spot, but the **pattern** of squeezes travels to the right. The coral curve shows the pressure.`,
            },
            {
              type: 'mcq',
              title: 'Which kind of wave?',
              prompt: r`In a sound wave in air, which way do the molecules move?`,
              choices: [
                { t: 'Back and forth, along the direction the wave travels', ok: true },
                { t: 'Up and down, across the direction the wave travels', why: 'That’s a transverse wave, like a wave on a string. Sound in air pushes along the direction of travel.' },
                { t: 'Along with the wave, all the way from source to ear', why: 'The molecules stay roughly where they are. Only the pattern of pressure travels.' },
              ],
              explain: r`Sound in air is a **longitudinal** wave: the molecules oscillate along the direction the wave travels. A wave on a string is **transverse**: the string moves at right angles to the wave.`,
            },
            {
              type: 'mcq',
              title: 'In space',
              prompt: r`An astronaut on a spacewalk drops a wrench onto a metal panel 2 m away. What does a second astronaut floating nearby hear?`,
              choices: [
                { t: 'Nothing: sound needs something to travel through', ok: true },
                { t: 'A faint clang', why: 'Between the astronauts there is almost no air: there’s nothing to squeeze, so no sound gets across.' },
                { t: 'A loud clang, because nothing absorbs it', why: 'There is nothing to carry it in the first place. Sound is a wave in a material.' },
              ],
              explain: r`Sound is a pressure wave **in a material**: a gas, liquid or solid. Space is nearly empty, so sound can't cross it. (If the astronaut touched the panel, they would feel the clang through the metal and their suit.)`,
            },
            {
              type: 'explain',
              title: 'Pitch and frequency',
              body: r`How many compressions arrive each second is the **frequency** $f$, measured in hertz (Hz). We hear frequency as **pitch**: higher frequency means a higher note.

Young people hear roughly from **20 Hz** to **20,000 Hz**, and the top of the range drops with age. As for any wave, speed = frequency × wavelength:
$$v = f\lambda$$`,
            },
            {
              type: 'numeric',
              title: 'From whisper to rock concert',
              prompt: r`A whisper is about 30 dB and a rock concert about 110 dB. Every 10 dB is a factor of 10 in intensity. The concert is $10^{n}$ times as intense: what is $n$?`,
              answer: 8,
              explain: r`$\frac{110 - 30}{10} = 8$, so a hundred million times the intensity. Our ears handle this enormous range by responding roughly logarithmically, which is why decibels work so well.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Wavelength',
              prompt: r`Sound travels at about 343 m/s in air. What is the wavelength of the lowest sound humans can hear (20 Hz)?`,
              lhs: r`$\lambda =$`,
              unit: 'm',
              answer: 17.15,
              tol: 0.2,
              wrong: [{ v: 6860, why: r`$\lambda = v / f$: divide, don't multiply.` }, { v: 0.058, tol: 0.002, why: r`That's $f / v$. Wavelength is $v / f$.` }],
              explain: r`$\lambda = \dfrac{v}{f} = \dfrac{343}{20} \approx 17$ m: longer than a bus! At 20,000 Hz it's only about 1.7 cm. That huge range is why bass sound bends around buildings so easily and why a big speaker is needed to push long waves.`,
            },
          ],
          recap: [
            'Sound is a longitudinal pressure wave: compressions and rarefactions.',
            'The molecules jiggle in place. The pattern travels.',
            r`Frequency is heard as pitch. Humans hear about 20 Hz to 20 kHz, and $v = f\lambda$.`,
          ],
        },
        {
          id: 'speed-of-sound',
          title: 'The Speed of Sound',
          summary: 'Thunder, echoes and sonar',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'Air, water or steel?',
              prompt: r`In which material does sound travel fastest?`,
              cols: 3,
              choices: [
                { t: 'Steel', ok: true },
                { t: 'Water', why: 'Water carries sound at about 1,500 m/s, but steel is much faster.' },
                { t: 'Air', why: 'Air is the slowest of the three: about 343 m/s.' },
              ],
              explain: r`Roughly: **air** 343 m/s, **water** 1,500 m/s, **steel** 5,900 m/s. Speed depends on how **stiff** the material is (how hard it pushes back when squeezed) compared with how **dense** it is. Steel is dense, but it is enormously stiff.`,
            },
            {
              type: 'explain',
              title: 'Warm air is faster',
              body: r`In a gas, sound is passed along by molecules bumping into each other, so faster molecules carry it faster. In air near room temperature:
$$v \approx 331 + 0.6\,T \ \text{m/s}$$
where $T$ is the temperature in °C. At 20 °C that gives 343 m/s.`,
            },
            {
              type: 'numeric',
              title: 'A hot day',
              prompt: r`Roughly how fast does sound travel in air at 35 °C?`,
              lhs: r`$v \approx$`,
              unit: 'm/s',
              answer: 352,
              tol: 0.6,
              wrong: [{ v: 343, why: 'That’s at 20 °C. Hotter air is faster.' }, { v: 366, why: r`It's $0.6 \times 35$, not $35$, added to 331.` }],
              explain: r`$331 + 0.6 \times 35 = 331 + 21 = 352$ m/s.`,
            },
            {
              type: 'numeric',
              title: 'Count the thunder',
              prompt: r`You see a lightning flash and hear the thunder 6 seconds later. About how far away was the strike? (Light arrives almost instantly. Use 343 m/s.)`,
              unit: 'km',
              answer: 2.058,
              tol: 0.1,
              wrong: [{ v: 1.03, tol: 0.05, why: 'Don’t halve it: the sound only travels one way here, from the lightning to you.' }, { v: 57, tol: 2, why: r`Distance = speed × time: $343 \times 6$ m, then convert to km.` }],
              explain: r`$343 \times 6 \approx 2{,}060$ m, about **2 km**. That's the handy rule: **count the seconds and divide by 3** to get kilometres (or divide by 5 for miles).`,
            },
            {
              type: 'interactive',
              title: 'Echo off a cliff',
              body: r`You clap once facing a cliff. The trace shows the sound at your ear: the clap, then its echo after travelling to the cliff and back at 343 m/s. Move the cliff until the echo arrives exactly **0.5 s** after the clap.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: -1.2, ymax: 1.2, grid: false, height: 220, axes: { xlabel: 'time (s)', xticks: 0.1, yticks: 10 },
                params: { D: { min: 20, max: 170, step: 0.25, value: 50, label: 'distance to cliff', color: 'teal', format: (v) => `${v.toFixed(2)} m` } },
                curves: [{ f: (t, p) => { const e = (2 * p.D) / 343, g = (u, a) => a * Math.exp(-((u / 0.006) ** 2)) * Math.cos(u * 900); return g(t - 0.02, 1) + g(t - 0.02 - e, 0.45); }, color: 'violet', width: 2, n: 900 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(0.52), x2: plot.X(0.52), y1: plot.Y(-1.1), y2: plot.Y(1.1), stroke: 'var(--teal)', 'stroke-dasharray': '4 4' })],
                readout: (p) => `round trip ${(2 * p.D).toFixed(1)} m · echo after **${((2 * p.D) / 343).toFixed(3)} s**`,
                goal: (p) => Math.abs((2 * p.D) / 343 - 0.5) < 0.0015,
                hint: 'In 0.5 s sound travels 343 × 0.5 m, which is there and back.',
                solution: { D: 85.75 },
              },
              explain: r`The sound covers $343 \times 0.5 = 171.5$ m, there and back, so the cliff is about **86 m** away. Bats and sonar use the same idea with much shorter delays; echoes arriving within about 0.1 s merge with the original sound, so you only hear a distinct echo from walls more than about 17 m away.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sonar',
              prompt: r`A ship sends a sound pulse straight down. The echo from the sea floor returns 2.0 s later. Sound travels at 1,500 m/s in seawater. How deep is the water?`,
              unit: 'm',
              answer: 1500,
              tol: 5,
              wrong: [{ v: 3000, why: 'The pulse travels down **and** back. The depth is half the total distance.' }, { v: 750, why: r`The total distance is $1500 \times 2 = 3000$ m, so the depth is half of that.` }],
              explain: r`The echo travels $1500 \times 2.0 = 3000$ m in total, down and back, so the depth is **1,500 m**. Bats and dolphins use the same trick, called **echolocation**.`,
            },
          ],
          recap: [
            'Sound travels at about 343 m/s in air, 1,500 m/s in water and 5,900 m/s in steel.',
            r`In air, $v \approx 331 + 0.6\,T$ m/s (T in °C).`,
            'For an echo, the sound makes a round trip, so halve the total distance.',
          ],
        },
      ],
    },
    {
      title: 'Loudness & Motion',
      summary: 'Decibels and Doppler.',
      lessons: [
        {
          id: 'decibels',
          title: 'Decibels',
          summary: 'Why loudness is logarithmic',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Intensity',
              body: r`**Intensity** $I$ is the sound power passing through each square metre, in W/m². A sound spreads out over a sphere, and the sphere's area grows as $4\pi d^2$. So:
$$I = \frac{P}{4\pi d^2}$$
Double your distance and the intensity drops to **a quarter**: an **inverse-square law**.`,
            },
            {
              type: 'explain',
              title: 'An enormous range',
              body: r`Your ears handle a staggering range: the loudest sound you can stand is more than **a trillion** ($10^{12}$) times as intense as the faintest one you can hear. To tame that range, we use a logarithmic scale, the **decibel** (dB):
$$L = 10 \log_{10}\!\left(\frac{I}{I_0}\right), \qquad I_0 = 10^{-12}\ \text{W/m}^2$$

| Sound | Level |
|---|---|
| Threshold of hearing | 0 dB |
| Quiet library | 30 dB |
| Normal conversation | 60 dB |
| Busy traffic | 80 dB |
| Rock concert | 110 dB |
| Threshold of pain | about 130 dB |

::: key
Every **+10 dB** means **10×** the intensity. Long exposure above about 85 dB can permanently damage your hearing.
:::`,
            },
            {
              type: 'numeric',
              title: 'Compare two sounds',
              prompt: r`How many times more intense is a 90 dB sound than a 60 dB sound?`,
              unit: '×',
              answer: 1000,
              wrong: [{ v: 30, why: r`Decibels are logarithmic: each +10 dB multiplies the intensity by 10.` }, { v: 1.5, why: r`It's not the ratio $90/60$. Each 10 dB step is a factor of 10.` }, { v: 3, why: r`Three steps of 10 dB is $10 \times 10 \times 10$, not 3.` }],
              explain: r`The difference is 30 dB, which is three steps of 10 dB, so $10 \times 10 \times 10 = 1000\times$ the intensity.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Walking away',
              body: r`A speaker produces 100 dB at 1 m. Drag the point to walk away from it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 16.5, ymin: 70, ymax: 104, grid: 2, gridY: 5, height: 320, axes: { xlabel: 'distance (m)', ylabel: 'dB' },
                params: { d: { min: 1, max: 16, step: 0.5, value: 2, slider: false } },
                curves: [{ f: (x) => 100 - 20 * Math.log10(x), from: () => 1, color: 'blue' }],
                points: [{ x: (p) => p.d, y: (p) => 100 - 20 * Math.log10(p.d), drag: { x: 'd' }, color: 'coral' }],
                extra: ({ plot, s }) => [1, 2, 4, 8, 16].map((d) => s('circle', { cx: plot.X(d), cy: plot.Y(100 - 20 * Math.log10(d)), r: 4, class: 'fl-ink' })),
                readout: (p) => r`at ${f1(p.d)} m: $I$ is $\tfrac{1}{${f2(p.d * p.d)}}$ of its value at 1 m, $L = ${f1(100 - 20 * Math.log10(p.d))}$ dB`,
              },
              after: r`Look at the black dots at 1, 2, 4, 8 and 16 m. Each time you **double** the distance, the level drops by about **6 dB** (a quarter of the intensity). Walking from 1 m to 16 m only takes you from 100 dB to 76 dB.`,
            },
            {
              type: 'mcq',
              title: 'Add a second speaker',
              prompt: r`One speaker gives 80 dB where you stand. An identical second speaker is added next to it, playing the same noise. What's the new level?`,
              cols: 2,
              choices: [
                { t: 'About 83 dB', ok: true },
                { t: '160 dB', why: 'Decibels don’t add. Intensities do, and doubling the intensity adds only about 3 dB.' },
                { t: '90 dB', why: '+10 dB needs 10× the intensity, so you would need ten speakers.' },
                { t: '80 dB', why: 'The intensity really does double, so the level goes up a little.' },
              ],
              explain: r`Two speakers means double the intensity, and $10\log_{10} 2 \approx 3$ dB. So the level becomes **83 dB**. Ears are logarithmic too: to sound roughly *twice as loud*, you need about +10 dB, which takes ten speakers!`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'From the formula',
              prompt: r`A sound has intensity $10^{-5}$ W/m². What is its level in decibels?`,
              unit: 'dB',
              answer: 70,
              wrong: [{ v: -50, why: r`Divide by $I_0 = 10^{-12}$ first: $\frac{10^{-5}}{10^{-12}} = 10^{7}$.` }, { v: 7, why: r`$\log_{10}(10^7) = 7$, but don't forget to multiply by 10.` }, { v: 17, why: r`$10^{-5} / 10^{-12} = 10^{-5 - (-12)} = 10^{7}$.` }],
              explain: r`$\dfrac{I}{I_0} = \dfrac{10^{-5}}{10^{-12}} = 10^{7}$. Then $L = 10 \times \log_{10}(10^7) = 10 \times 7 = 70$ dB: a loud vacuum cleaner.`,
            },
          ],
          recap: [
            r`Intensity falls as $1/d^2$: double the distance and the level drops by about 6 dB.`,
            r`$L = 10\log_{10}(I/I_0)$. Every +10 dB is 10× the intensity, and +3 dB is double.`,
            'Above about 85 dB, long exposure can damage hearing.',
          ],
        },
        {
          id: 'doppler',
          title: 'The Doppler Effect',
          summary: 'Why sirens change pitch',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'A passing siren',
              prompt: r`An ambulance races past you. How does its siren's pitch sound as it approaches, then moves away?`,
              choices: [
                { t: 'Higher while approaching, lower while moving away', ok: true },
                { t: 'Lower while approaching, higher while moving away', why: 'It’s the other way round: the waves get bunched up in front of the ambulance.' },
                { t: 'The same throughout; only the loudness changes', why: 'The pitch genuinely shifts. You’ve probably heard the classic “neee-yowww”.' },
              ],
              explain: r`This is the **Doppler effect**. Let's see why it happens.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Bunched-up waves',
              body: r`The coral source sends out a wavefront at regular intervals. Each one spreads out at the speed of sound from the point **where it was emitted**. Adjust the source's speed.`,
              widget: doppler,
              after: r`Ahead of the source the wavefronts are squeezed together: shorter wavelength, higher frequency. Behind, they're stretched apart. Push the speed past 1.0 and the source outruns its own waves: they pile up into a **shock cone**, heard as a **sonic boom**.`,
            },
            {
              type: 'explain',
              title: 'The formula',
              body: r`For a source moving at speed $v_s$ (with the air and listener still), the frequency heard is
$$f' = f\,\frac{v}{v \mp v_s}$$
Use **minus** when the source approaches (a smaller denominator gives a higher pitch) and **plus** when it moves away. Here $v$ is the speed of sound.`,
            },
            {
              type: 'numeric',
              title: 'Approaching',
              prompt: r`A siren emits 600 Hz and moves toward you at 40 m/s. Take the speed of sound to be 340 m/s. What frequency do you hear?`,
              unit: 'Hz',
              answer: 680,
              tol: 1,
              wrong: [{ v: 640, why: 'You can’t just add the speed to the frequency. Use the formula.' }, { v: 536.8, tol: 1, why: 'That’s the receding frequency. Approaching means minus: 340 − 40.' }, { v: 670.6, tol: 1, why: r`That's $600 \times \frac{380}{340}$, the formula for a moving **listener**. For a moving source, use $\frac{v}{v - v_s}$.` }],
              explain: r`$f' = 600 \times \dfrac{340}{340 - 40} = 600 \times \dfrac{340}{300} = 680$ Hz.`,
            },
            {
              type: 'numeric',
              title: 'Receding',
              prompt: r`Once it has passed, still moving at 40 m/s, what frequency do you hear?`,
              unit: 'Hz',
              answer: 536.8,
              tol: 1,
              wrong: [{ v: 520, why: r`Don't subtract 80 Hz. Use $f' = f\frac{v}{v + v_s}$.` }, { v: 680, why: 'That’s while approaching. Moving away uses plus: 340 + 40.' }],
              explain: r`$f' = 600 \times \dfrac{340}{380} \approx 537$ Hz. The pitch drops from 680 Hz to 537 Hz as it passes: about four semitones!`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Beyond sound',
              prompt: r`Astronomers see that light from a distant galaxy has shifted toward **red** (longer wavelengths). What does that tell them?`,
              choices: [
                { t: 'The galaxy is moving away from us', ok: true },
                { t: 'The galaxy is moving toward us', why: 'Approaching sources are shifted to shorter wavelengths, toward blue.' },
                { t: 'The galaxy is very hot', why: 'Temperature changes a star’s colour, but a shift of known spectral lines is a Doppler effect.' },
              ],
              explain: r`The Doppler effect works for light too. A receding source stretches its waves, shifting known spectral lines toward the red: a **redshift**. Edwin Hubble used redshifts to show that distant galaxies are moving away from us, the first evidence that the universe is expanding. (Police radar guns use the same idea with radio waves.)`,
            },
          ],
          recap: [
            'A moving source squeezes its waves ahead and stretches them behind.',
            r`$f' = f\,\dfrac{v}{v \mp v_s}$: minus when approaching, plus when receding.`,
            'Faster than sound means a shock cone (sonic boom). Light shows the same effect as red- and blueshift.',
          ],
        },
      ],
    },
    {
      title: 'The Physics of Music',
      summary: 'Pipes and harmony.',
      lessons: [
        {
          id: 'pipes',
          title: 'Pipes & Wind Instruments',
          summary: 'Open and closed pipes',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Standing waves in air',
              body: r`A flute or an organ pipe is a column of air. Sound bounces back and forth inside it, and only certain wavelengths fit, forming **standing waves**, just like on a guitar string. The rules at the ends:

- At an **open** end, air can move freely: maximum motion (an **antinode**).
- At a **closed** end, the air is stopped by the wall: no motion (a **node**).`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Modes of a pipe',
              body: r`The blue lines are slices of air sliding back and forth. Try both end types and step through the modes.`,
              widget: pipe,
              after: r`**Open–open**: the fundamental fits half a wavelength, $L = \lambda/2$, so $f_1 = \dfrac{v}{2L}$, and **every** multiple $1, 2, 3, \dots$ of $f_1$ is allowed.
**Closed–open**: the fundamental fits only a quarter wavelength, $L = \lambda/4$, so $f_1 = \dfrac{v}{4L}$, and only **odd** multiples $1, 3, 5, \dots$ are allowed.`,
            },
            {
              type: 'numeric',
              title: 'An open pipe',
              prompt: r`An organ pipe open at both ends is 0.50 m long. Take $v = 340$ m/s. What is its fundamental frequency?`,
              unit: 'Hz',
              answer: 340,
              tol: 1,
              wrong: [{ v: 170, why: r`That's the closed-pipe formula $v/4L$. For an open pipe, $f_1 = v/2L$.` }, { v: 680, why: r`$f_1 = \frac{v}{2L} = \frac{340}{1.0}$.` }],
              explain: r`$f_1 = \dfrac{v}{2L} = \dfrac{340}{2 \times 0.50} = 340$ Hz.`,
            },
            {
              type: 'numeric',
              title: 'Close one end',
              prompt: r`Now the same 0.50 m pipe is closed at one end. What is its fundamental now?`,
              unit: 'Hz',
              answer: 170,
              tol: 1,
              wrong: [{ v: 340, why: 'Closing one end changes the fit: now a quarter wavelength spans the pipe.' }, { v: 680, why: r`The wavelength gets **longer** ($4L$ instead of $2L$), so the frequency goes **down**.` }],
              explain: r`$f_1 = \dfrac{v}{4L} = \dfrac{340}{2.0} = 170$ Hz: an octave lower. Closing one end doubles the fundamental wavelength.`,
            },
            {
              type: 'numeric',
              title: 'A flute for middle C',
              prompt: r`A flute behaves like a pipe open at both ends, with fundamental $f = \frac{v}{2L}$. How long must it be to play middle C (262 Hz), with $v = 343$ m/s? (Centimetres, 1 decimal place.)`,
              unit: 'cm',
              answer: 343 / (2 * 262) * 100,
              tol: 0.2,
              explain: r`$L = \frac{343}{2 \times 262} \approx 65.5$ cm, close to a real concert flute’s sounding length. Opening holes shortens the effective pipe and raises the pitch.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The next note up',
              prompt: r`A pipe closed at one end has a fundamental of 100 Hz. What is the next frequency at which it resonates?`,
              cols: 2,
              choices: [
                { t: '300 Hz', ok: true },
                { t: '200 Hz', why: 'A closed–open pipe only allows odd harmonics, so 2 × 100 Hz is missing.' },
                { t: '150 Hz', why: 'Harmonics are whole-number multiples of the fundamental.' },
                { t: '400 Hz', why: 'Odd multiples only: 1×, 3×, 5×…' },
              ],
              explain: r`Only odd harmonics fit: 100, **300**, 500 Hz… A clarinet behaves roughly like a closed–open pipe. That's why, when a player **overblows**, a clarinet jumps up by a twelfth (3× the frequency), while a flute jumps up an octave (2×).`,
            },
          ],
          recap: [
            'Open end: air moves the most (an antinode). Closed end: air is still (a node).',
            r`Open–open: $f_n = n\dfrac{v}{2L}$, all harmonics.`,
            r`Closed–open: $f_n = n\dfrac{v}{4L}$, odd $n$ only.`,
          ],
        },
        {
          id: 'harmony',
          title: 'Harmony & Scales',
          summary: 'Ratios, octaves and twelve semitones',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'The octave',
              body: r`Play two notes where one has **exactly twice** the frequency of the other. They blend so well that they sound like "the same note, higher". That's an **octave**. Concert A is 440 Hz; the A above it is 880 Hz, and the A below is 220 Hz.

Other simple ratios also sound pleasant (**consonant**): the **perfect fifth** is $3:2$, and the **perfect fourth** is $4:3$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Seeing consonance',
              body: r`This graph adds a low note and a higher note together. The horizontal axis counts cycles of the lower note.`,
              widget: intervals,
              after: r`Simple ratios make a combined wave that repeats quickly: the dashed lines mark each repeat. A ratio like $45:32$ repeats only after 32 cycles, and our ears hear that as tension.`,
            },
            {
              type: 'numeric',
              title: 'A perfect fifth',
              prompt: r`What frequency is a perfect fifth ($3:2$) above A = 440 Hz?`,
              unit: 'Hz',
              answer: 660,
              tol: 1,
              wrong: [{ v: 293.3, tol: 1, why: r`That's a fifth **below** ($440 \times \frac{2}{3}$). Above means multiply by $\frac{3}{2}$.` }, { v: 1320, why: r`That's $3 \times 440$. A ratio of $3:2$ means multiply by $\frac32$.` }],
              explain: r`$440 \times \dfrac{3}{2} = 660$ Hz (the note E).`,
            },
            {
              type: 'explain',
              title: 'Equal temperament',
              body: r`A piano divides each octave into **12 equal steps** (semitones). "Equal" means each step multiplies the frequency by the same factor $s$. Twelve steps must make an octave:
$$s^{12} = 2 \quad\Rightarrow\quad s = \sqrt[12]{2} \approx 1.0595$$
So each semitone raises the pitch by about 6%.`,
            },
            {
              type: 'numeric',
              title: 'Seven semitones',
              prompt: r`A fifth on a piano is 7 semitones. What is its frequency ratio $2^{7/12}$? (3 decimal places.)`,
              answer: 1.498,
              tol: 0.0015,
              wrong: [{ v: 1.5, tol: 0.0004, why: 'Close! But equal temperament isn’t exactly 3/2. Compute 2^(7/12).' }, { v: 1.167, tol: 0.002, why: r`That's $\frac{7}{12} \times 2$. You need $2$ raised to the power $\frac{7}{12}$.` }],
              explain: r`$2^{7/12} \approx 1.4983$. That's just 0.1% flat of the pure $1.5$: close enough that almost nobody notices. This compromise lets a piano play in every key equally well.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why not use pure fifths?',
              prompt: r`Stack 12 pure fifths ($\times \tfrac32$ each) and you should arrive back at a C, 7 octaves up ($\times 2^7 = 128$). What actually happens?`,
              choices: [
                { t: r`You overshoot slightly: $(3/2)^{12} \approx 129.7$`, ok: true },
                { t: r`It lands exactly on 128`, why: r`$(3/2)^{12} = 3^{12}/2^{12} = 531441/4096 \approx 129.75$. A power of 3 can never equal a power of 2.` },
                { t: r`You fall short: $(3/2)^{12} \approx 120$`, why: r`Compute it: $1.5^{12} \approx 129.75$, which is a little **more** than 128.` },
              ],
              explain: r`$(3/2)^{12} \approx 129.75$, about 1.4% above 128. This gap is the **Pythagorean comma**. Because $3^{12}$ is odd and $2^{19}$ is even, pure fifths can **never** close the circle exactly. Equal temperament shrinks each fifth a tiny bit to share out the gap.`,
            },
          ],
          recap: [
            'Octave = 2:1, fifth = 3:2, fourth = 4:3. Simple ratios sound consonant.',
            r`Equal temperament: each semitone multiplies the frequency by $\sqrt[12]{2} \approx 1.0595$.`,
            'Twelve pure fifths overshoot seven octaves (the Pythagorean comma), so tuning is always a compromise.',
          ],
        },
      ],
    },
    {
      title: 'Rooms and Ears',
      summary: 'Acoustics and how we locate sounds.',
      lessons: [
        {
          id: 'rooms',
          title: 'Rooms & Echoes',
          summary: 'Reverberation and concert halls',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Echo or reverberation?',
              body: r`Shout at a cliff and you hear a distinct **echo**: one reflection, arriving long after the original. In a room, sound reflects off every surface many times, and the reflections blur into a fading tail: **reverberation**.

Our ears merge reflections arriving within about 0.1 s of the original sound. Later ones are heard as separate echoes.`,
            },
            {
              type: 'numeric',
              title: 'Shouting at a cliff',
              prompt: r`You stand 170 m from a cliff and clap. How long until you hear the echo? (Speed of sound 343 m/s; 2 decimal places.)`,
              unit: 's',
              answer: 340 / 343,
              tol: 0.01,
              wrong: [{ v: 170 / 343, tol: 0.01, why: 'The sound has to go to the cliff **and back**: 340 m.' }],
              explain: r`$\frac{2 \times 170}{343} \approx 0.99$ s. Bats and dolphins use the same idea, with ultrasound, to "see" in the dark: echolocation.`,
            },
            {
              type: 'numeric',
              title: 'A distinct echo',
              prompt: r`To hear a separate echo, it must arrive at least 0.1 s after the original. What's the minimum distance to the reflecting wall? (Nearest metre.)`,
              unit: 'm',
              answer: 17,
              tol: 0.6,
              wrong: [{ v: 34, why: 'In 0.1 s, sound travels 34 m, but that’s there and back.' }],
              explain: r`$343 \times 0.1 = 34.3$ m round trip, so the wall must be about **17 m** away. In ordinary rooms, reflections blend into reverberation instead.`,
            },
            {
              type: 'explain',
              title: 'Sabine’s formula',
              body: r`In 1895, the young physicist Wallace Sabine was asked to fix the dreadful acoustics of a Harvard lecture hall. Using a stopwatch and borrowed seat cushions, he found that the **reverberation time** (how long a sound takes to fade by 60 dB) is
$$T_{60} \approx \frac{0.161\,V}{A}$$
where $V$ is the room's volume in m³, and $A$ is its total **absorption**: each surface's area times its absorption coefficient (0 for a perfect reflector, 1 for an open window), added up.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design a concert hall',
              prompt: r`A new hall has a volume of 20,000 m³. Its hard surfaces provide 400 m² of absorption. Add sound-absorbing panels (absorption coefficient 0.8) until the reverberation time is **2.0 seconds**, ideal for orchestral music.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3000, ymin: 0, ymax: 9, grid: 500, gridY: 1, height: 260, axes: { xlabel: 'area of panels (m²)', ylabel: 'reverberation time (s)' },
                params: { S: { min: 0, max: 3000, step: 10, value: 200, slider: false } },
                curves: [{ f: (S) => rt60(S), color: 'violet', width: 3 }, { f: () => 2, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.S, y: (p) => rt60(p.S), drag: { x: 'S' }, color: 'coral' }],
                readout: (p) => r`${p.S} m² of panels: $A = ${400 + 0.8 * p.S}$, $\;T_{60} = ${rt60(p.S).toFixed(2)}$ s`,
                goal: (p) => Math.abs(rt60(p.S) - 2) < 0.02,
                hint: r`You need $A = \frac{0.161 \times 20000}{2} = 1610$ m².`,
                solution: { S: 1510 },
              },
              explain: r`$A = 1610$ m², so $0.8\,S = 1210$ and $S \approx 1510$ m² of panels. Speech needs a shorter time (around 1 s) so words don't smear together; organ music in a cathedral can enjoy 5 seconds or more.`,
            },
            {
              type: 'mcq',
              title: 'An empty hall',
              prompt: r`Musicians often find a concert hall sounds much "boomier" in an empty rehearsal than in the evening performance. Why?`,
              choices: [
                { t: 'The audience’s bodies and clothes absorb a lot of sound, so a full hall has a shorter reverberation time', ok: true },
                { t: 'Sound travels faster in an empty hall', why: 'The speed of sound barely changes. The absorption does.' },
                { t: 'The musicians play louder in rehearsal', why: 'Reverberation time doesn’t depend on loudness: it’s set by volume and absorption.' },
              ],
              explain: r`Each person absorbs roughly half a square metre of sound. Good halls use upholstered seats that absorb about as much empty as occupied, so rehearsals sound like performances.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Doubling up',
              prompt: r`A room has a reverberation time of 1.2 s. An architect doubles its volume (making it twice as tall) but keeps the same total absorption. What's the new reverberation time?`,
              unit: 's',
              answer: 2.4,
              wrong: [{ v: 0.6, why: r`$T_{60} \propto V$: more volume means longer reverberation.` }, { v: 1.2, why: 'The volume has doubled, so the time changes.' }],
              explain: r`$T_{60} \propto \frac{V}{A}$, so doubling $V$ doubles it to 2.4 s. (In reality, the extra wall area would add a little absorption.) Big cathedrals ring for so long because their volume is enormous compared with their absorbing surfaces.`,
            },
          ],
          recap: [
            'Reflections within 0.1 s blend into reverberation; later ones are echoes.',
            r`Sabine: $T_{60} \approx 0.161\,V/A$.`,
            'Concert halls balance volume and absorption to get about 2 s.',
          ],
        },
        {
          id: 'ears',
          title: 'Hearing with Two Ears',
          summary: 'How you know where a sound is',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Inside the ear',
              body: r`Young people hear from about 20 Hz to 20,000 Hz. Inside the inner ear, the snail-shaped **cochlea** holds a membrane that vibrates most strongly at different places for different frequencies: high notes near its entrance, low notes at the far end. About 3,500 rows of hair cells along it act like the keys of a piano in reverse, turning each frequency into nerve signals.`,
            },
            {
              type: 'mcq',
              title: 'Losing the high notes',
              prompt: r`With age, almost everyone loses hearing at high frequencies first. Which explanation fits the cochlea's layout?`,
              choices: [
                { t: 'High frequencies are detected near the cochlea’s entrance, where every sound passes and the hair cells take the most wear', ok: true },
                { t: 'High-frequency sounds are quieter', why: 'Many are perfectly loud. The issue is the hair cells that detect them.' },
                { t: 'The eardrum gets thinner', why: 'The main cause is damage to hair cells in the cochlea, which don’t regrow.' },
              ],
              explain: r`Every sound wave travels past the base of the cochlea, so those hair cells are exposed to the most vibration over a lifetime. Some shops have used high-pitched "mosquito" tones, around 17 kHz, which teenagers can hear but most adults can't.`,
            },
            {
              type: 'explain',
              title: 'Timing between the ears',
              body: r`Your ears are about 20 cm apart. A sound from your left reaches your left ear slightly before your right ear. For a source at angle $\theta$ from straight ahead, the extra path is about $d\sin\theta$, so the **interaural time difference** is
$$\Delta t \approx \frac{d \sin\theta}{v}$$
Your brain detects differences as small as 10 microseconds, which lets you locate a sound to within a degree or two.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Where is it?',
              prompt: r`A sound reaches your right ear **0.3 milliseconds** before your left. Turn the source until it produces that delay.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -1.6, ymax: 3, grid: false, axes: false, maxWidth: 420,
                params: { th: { min: 0, max: 90, step: 1, value: 60, label: 'angle to the right', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s, arrow }) => {
                  const a = (p.th * Math.PI) / 180, R = plot.X(1) - plot.X(0);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: R, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('path', { d: `M${plot.X(-0.25)} ${plot.Y(0.95)} L${plot.X(0)} ${plot.Y(1.3)} L${plot.X(0.25)} ${plot.Y(0.95)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('ellipse', { cx: plot.X(-1.05), cy: plot.Y(0), rx: 8, ry: 16, class: 'fl-blue' }),
                    s('ellipse', { cx: plot.X(1.05), cy: plot.Y(0), rx: 8, ry: 16, class: 'fl-coral' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(2.8), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '4 4' }),
                    arrow(plot.X(2.7 * Math.sin(a)), plot.Y(2.7 * Math.cos(a)), plot.X(1.3 * Math.sin(a)), plot.Y(1.3 * Math.cos(a)), { color: 'var(--violet)', width: 4, head: 13 }),
                    s('circle', { cx: plot.X(2.8 * Math.sin(a)), cy: plot.Y(2.8 * Math.cos(a)), r: 9, class: 'fl-violet' }),
                    s('text', { x: plot.X(0), y: plot.Y(0) + 5, 'text-anchor': 'middle', class: 'lbl', text: 'you' }),
                  ];
                },
                readout: (p) => r`source at ${p.th}°: right ear leads by $${itd(p.th).toFixed(3)}$ ms`,
                goal: (p) => Math.abs(itd(p.th) - 0.3) < 0.006,
                hint: r`Solve $\sin\theta = \frac{0.3 \times 10^{-3} \times 343}{0.2}$.`,
                solution: { th: 31 },
              },
              explain: r`$\sin\theta = \frac{0.0003 \times 343}{0.2} \approx 0.51$, so $\theta \approx 31°$ to the right. Your brain does this calculation continuously, using dedicated neurons in the brainstem that compare arrival times.`,
            },
            {
              type: 'numeric',
              title: 'The biggest delay',
              prompt: r`What's the largest possible interaural time difference, for a sound directly to one side? Give it in microseconds. (Nearest 10 μs.)`,
              unit: 'μs',
              answer: 580,
              tol: 10,
              wrong: [{ v: 0.58, tol: 0.01, why: 'That’s in milliseconds. Convert to microseconds.' }],
              explain: r`$\frac{0.2}{343} \approx 0.00058$ s $\approx 580$ μs. Every direction is encoded as a delay somewhere between 0 and about 0.6 ms.`,
            },
            {
              type: 'mcq',
              title: 'Where’s the subwoofer?',
              prompt: r`Home cinema systems have five or more small speakers placed carefully around the room, but one bass subwoofer that can go almost anywhere. Why?`,
              choices: [
                { t: 'Low-frequency sound has wavelengths much longer than your head, so your ears get few cues about its direction', ok: true },
                { t: 'Bass travels faster than treble', why: 'All frequencies travel at the same speed in air.' },
                { t: 'Subwoofers are louder', why: 'Loudness doesn’t help localisation. The long wavelength is the issue.' },
              ],
              explain: r`Bass wavelengths are several metres long, so the sound bends around your head and arrives at both ears almost equally, with only tiny phase differences. For high frequencies, your head casts a "sound shadow", giving a loudness difference too.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Front or back?',
              prompt: r`A sound 30° to your right in front and one 30° to your right **behind** you (at 150° from straight ahead) produce exactly the same time difference. How do you tell them apart?`,
              choices: [
                { t: 'The folds of the outer ear filter sounds differently from front and back, and turning your head changes the delays', ok: true },
                { t: 'You can’t: the brain always guesses "in front"', why: 'We do sometimes get confused, but the outer ear and head movements usually resolve it.' },
                { t: 'Sounds from behind are always quieter', why: 'Not reliably: the key cues are the ear’s shape and head movement.' },
              ],
              explain: r`$\sin 30° = \sin 150°$, so timing alone can't distinguish them: the **cone of confusion**. The ridges of your outer ear (the pinna) colour sounds differently by direction, and a small turn of the head changes the two delays in opposite ways. 3D audio in headphones imitates these pinna cues.`,
            },
          ],
          recap: [
            'The cochlea maps frequency to position; high frequencies wear out first.',
            r`Interaural time difference $\Delta t \approx d\sin\theta / v$, up to about 0.6 ms.`,
            'Bass is hard to locate; the outer ear and head movements resolve front from back.',
          ],
        },
      ],
    },
  ],
};
