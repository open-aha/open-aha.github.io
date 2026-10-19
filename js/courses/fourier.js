import { fix } from '../lib/svg.js';

const r = String.raw;
const PI = Math.PI;
// live values keep a fixed 1 decimal (every slider here steps by 0.1), so they never change length
const f1 = (v) => fix(v, 1);
const XY = { xlabel: 'x', ylabel: 'y' };
const piTicks = { xticks: PI / 2, xfmt: (v) => ({ 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' })[Math.round(v / (PI / 2))] ?? '' };

// partial sum of the square wave: (4/π) Σ sin(kx)/k over odd k, using n terms
const square = (x, n) => {
  let s = 0;
  for (let j = 0; j < n; j++) {
    const k = 2 * j + 1;
    s += Math.sin(k * x) / k;
  }
  return (4 / PI) * s;
};
const squareTrue = (x) => {
  const m = ((x % (2 * PI)) + 2 * PI) % (2 * PI);
  return m === 0 || m === PI ? 0 : m < PI ? 1 : -1;
};
// peak of the partial sum just after the jump at 0 (the first maximum is near x = π/(2n))
const peakOf = (n) => {
  let best = 0;
  for (let i = 1; i <= 400; i++) best = Math.max(best, square((i / 400) * (PI / n), n));
  return best;
};

// ---- epicycles: complex Fourier coefficients of closed polygon paths
const polyPath = (V, M = 256) => {
  const L = V.map((v, i) => Math.hypot(V[(i + 1) % V.length][0] - v[0], V[(i + 1) % V.length][1] - v[1]));
  const tot = L.reduce((a, b) => a + b, 0), pts = [];
  for (let k = 0; k < M; k++) {
    let d = (k / M) * tot, i = 0;
    while (d > L[i]) { d -= L[i]; i++; }
    const a = V[i], b = V[(i + 1) % V.length], u = d / L[i];
    pts.push([a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])]);
  }
  return pts;
};
const SHAPES = [
  ['square', polyPath([[1, 1], [-1, 1], [-1, -1], [1, -1]])],
  ['star', polyPath(Array.from({ length: 10 }, (_, k) => { const a = Math.PI / 2 + (Math.PI * k) / 5, rr = k % 2 ? 0.45 : 1.2; return [rr * Math.cos(a), rr * Math.sin(a)]; }))],
];
const COEFS = SHAPES.map(([, P]) => {
  const M = P.length, out = [];
  for (let k = -60; k <= 60; k++) {
    let re = 0, im = 0;
    P.forEach(([x, y], j) => { const a = (-2 * Math.PI * k * j) / M; re += x * Math.cos(a) - y * Math.sin(a); im += x * Math.sin(a) + y * Math.cos(a); });
    out.push({ k, re: re / M, im: im / M, mag: Math.hypot(re, im) / M });
  }
  return out.sort((a, b) => b.mag - a.mag);
});
const epi = (s, N, t) => { let x = 0, y = 0; const chain = [[0, 0]]; for (const c of COEFS[s].slice(0, N)) { const a = c.k * t; x += c.re * Math.cos(a) - c.im * Math.sin(a); y += c.re * Math.sin(a) + c.im * Math.cos(a); chain.push([x, y]); } return chain; };
// ---- three waves and their Fourier partial sums
const WAVES = [
  ['square', (x, n) => square(x, n), (x) => squareTrue(x)],
  ['sawtooth', (x, n) => { let s = 0; for (let k = 1; k <= 2 * n - 1; k++) s += ((-1) ** (k + 1) * Math.sin(k * x)) / k; return (2 / PI) * s; }, (x) => { const m = ((x % (2 * PI)) + 2 * PI) % (2 * PI); return m < PI ? m / PI : (m - 2 * PI) / PI; }],
  ['triangle', (x, n) => { let s = 0; for (let j = 0; j < n; j++) { const k = 2 * j + 1; s += ((-1) ** j * Math.sin(k * x)) / (k * k); } return (8 / (PI * PI)) * s; }, (x) => { const m = ((x % (2 * PI)) + 2 * PI) % (2 * PI); return m < PI / 2 ? (2 * m) / PI : m < (3 * PI) / 2 ? 2 - (2 * m) / PI : (2 * m) / PI - 4; }],
];
const rmsErr = (w, n) => { let s = 0; const M = 2000; for (let i = 0; i < M; i++) { const x = (2 * PI * (i + 0.5)) / M; s += (WAVES[w][1](x, n) - WAVES[w][2](x)) ** 2; } return Math.sqrt(s / M); };

// a "mystery" signal for the coefficient detector: 0.8 sin x + 0.5 sin 3x + 0.2 sin 5x
const mystery = (x) => 0.8 * Math.sin(x) + 0.5 * Math.sin(3 * x) + 0.2 * Math.sin(5 * x);
const bCoef = (f, n) => { let t = 0; const N = 2000; for (let i = 0; i < N; i++) { const x = (2 * PI * (i + 0.5)) / N; t += f(x) * Math.sin(n * x); } return (2 * t) / N; };

// a bar of length π, uniformly hot (1) inside, ends held at 0: T = Σ (4/nπ) sin(nx) e^{-n² kt} over odd n
const heatKt = (t) => { const u = Math.min(1, Math.max(0, (t - 0.8) / 7)); return 0.0005 + 0.8 * u * u * u; };
const heatT = (x, kt) => { let s = 0; for (let n = 1; n < 80; n += 2) s += (4 / (n * Math.PI)) * Math.sin(n * x) * Math.exp(-n * n * kt); return s; };

export default {
  id: 'fourier',
  subject: 'math',
  title: 'Fourier Series',
  level: 'Advanced',
  cover: 'fourier',
  tagline: 'Building any wave out of sines, drawing with circles, and hearing the maths of timbre.',
  description: r`In 1807, Joseph Fourier made a bold claim: any repeating signal, even one with sharp corners, can be built by adding up sine waves. Mix waves to match targets, watch a square wave emerge, discover why a violin and a flute sound different, learn the trick that finds the recipe, draw shapes with spinning circles, and see how smoothness controls everything.`,
  prereq: 'Calculus: Integrals',
  chapters: [
    {
      title: 'Adding Waves',
      summary: 'Sines as building blocks.',
      lessons: [
        {
          id: 'mixing',
          title: 'Mixing Sines',
          summary: 'Harmonics and their amplitudes',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Harmonics',
              body: r`Take a basic wave $\sin x$, which repeats every $2\pi$. Its **harmonics** are $\sin 2x$, $\sin 3x$, $\sin 4x$, …: they wiggle 2, 3, 4… times as fast, so they **also** repeat every $2\pi$.

Adding harmonics with different **amplitudes** (sizes) makes new shapes, all repeating every $2\pi$:
$$f(x) = b_1 \sin x + b_2 \sin 2x + b_3 \sin 3x + \dots$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Match the target',
              prompt: r`Adjust the amplitudes of the first three harmonics until your wave (blue) matches the dashed target.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * PI, ymin: -2, ymax: 2, grid: PI / 2, gridY: 0.5, height: 300, axes: { ...XY, ...piTicks },
                params: {
                  b1: { min: -1.5, max: 1.5, step: 0.1, value: 0.5, label: r`$b_1$`, color: 'blue', format: (v) => f1(v) },
                  b2: { min: -1.5, max: 1.5, step: 0.1, value: 0, label: r`$b_2$`, color: 'teal', format: (v) => f1(v) },
                  b3: { min: -1.5, max: 1.5, step: 0.1, value: 0, label: r`$b_3$`, color: 'coral', format: (v) => f1(v) },
                },
                curves: [
                  { f: (x) => Math.sin(x) + 0.5 * Math.sin(3 * x), color: 'ink', dash: true },
                  { f: (x, p) => p.b1 * Math.sin(x) + p.b2 * Math.sin(2 * x) + p.b3 * Math.sin(3 * x), color: 'blue', width: 4 },
                ],
                readout: (p) => r`$f(x) = ${f1(p.b1)}\sin x ${p.b2 < 0 ? '-' : '+'} ${f1(Math.abs(p.b2))}\sin 2x ${p.b3 < 0 ? '-' : '+'} ${f1(Math.abs(p.b3))}\sin 3x$`,
                goal: (p) => Math.abs(p.b1 - 1) < 1e-6 && Math.abs(p.b2) < 1e-6 && Math.abs(p.b3 - 0.5) < 1e-6,
                hint: 'The target has two bumps per half-cycle superimposed on a big one. Which harmonic wiggles 3 times?',
                solution: { b1: 1, b2: 0, b3: 0.5 },
              },
              explain: r`The target is $\sin x + 0.5\sin 3x$. The big slow wave sets the overall shape, and the third harmonic flattens the tops and adds "shoulders". Already it looks a bit like a square wave…`,
            },
            {
              type: 'numeric',
              title: 'Harmonics of a string',
              prompt: r`A guitar's open A string vibrates at a fundamental frequency of 110 Hz. What is the frequency of its third harmonic, in Hz?`,
              unit: 'Hz',
              answer: 330,
              wrong: [{ v: 113, why: 'Harmonics multiply the frequency: 3 × 110.' }, { v: 36.7, tol: 0.1, why: 'Harmonics are faster, not slower: multiply by 3.' }],
              explain: r`$3 \times 110 = 330$ Hz. A plucked string vibrates at all its harmonics at once (110, 220, 330, 440 Hz, …), and the mix of their amplitudes is what you hear as the guitar's tone.`,
            },
            {
              type: 'mcq',
              title: 'Same period',
              prompt: r`Why is $\sin x + \sin 2.5x$ **not** periodic with period $2\pi$?`,
              choices: [
                { t: r`$\sin 2.5x$ doesn't complete a whole number of cycles in $2\pi$`, ok: true },
                { t: 'Adding two sines never gives a periodic function', why: r`$\sin x + \sin 2x$ repeats every $2\pi$, for example.` },
                { t: 'Its amplitude is too large', why: 'Amplitude doesn’t affect periodicity. It’s about whole numbers of cycles.' },
              ],
              explain: r`In $2\pi$, $\sin 2.5x$ completes 2.5 cycles, so it ends halfway through a cycle. Only **whole-number** multiples $\sin nx$ fit exactly. (The sum does repeat eventually: every $4\pi$.)`,
            },
            {
              type: 'numeric',
              title: 'Period of a mixture',
              prompt: r`What is the period of $\sin 2x + \sin 3x$? (Give the period divided by $\pi$.)`,
              answer: 2,
              explain: r`$\sin 2x$ repeats every $\pi$ and $\sin 3x$ every $\frac{2\pi}{3}$. The mixture repeats when both do: the least common multiple, $2\pi$. So the answer is 2.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Only harmonics',
              prompt: r`Why does a repeating signal with period $T$ contain only frequencies that are whole-number multiples of $\frac1T$?`,
              choices: [
                { t: r`Only those waves also repeat every T, so only they can add up to something that repeats every T`, ok: true },
                { t: r`Other frequencies are too quiet to hear`, why: r`It’s not about loudness: other frequencies simply don’t fit the period.` },
                { t: r`Instruments can only make whole-number frequencies`, why: r`This is a mathematical fact about any repeating signal, not just instruments.` },
              ],
              explain: r`A sine wave of frequency $\frac{n}{T}$ fits exactly $n$ cycles into one period, so it repeats every $T$. A frequency like $\frac{2.5}{T}$ would not, so it can’t appear. That’s why the spectrum of a periodic signal is a set of sharp, evenly spaced lines.`,
            },
          ],
          recap: [
            r`Harmonics $\sin nx$ (for whole numbers $n$) all repeat every $2\pi$.`,
            'Adding harmonics with different amplitudes makes new periodic shapes.',
            'A Fourier series is such a sum, possibly with infinitely many terms.',
          ],
        },
        {
          id: 'square-wave',
          title: 'Building a Square Wave',
          summary: 'Corners from smooth curves',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'More and more terms',
              body: r`The square wave jumps between $+1$ and $-1$. Fourier found its recipe: only **odd** harmonics, with amplitudes falling like $\tfrac1n$:
$$\text{square}(x) = \frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \frac{\sin 7x}{7} + \dots\right)$$
Add terms one by one.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * PI, ymin: -1.5, ymax: 1.5, grid: PI / 2, gridY: 0.5, height: 300, axes: { xticksBelow: true, xlabelBelow: 'edge', ...XY, ...piTicks },
                params: { n: { min: 1, max: 40, step: 1, value: 1, label: 'terms', color: 'violet', format: (v) => `${v}` } },
                curves: [
                  { f: (x) => squareTrue(x), color: 'ink', dash: true },
                  { f: (x, p) => square(x, p.n), color: 'violet', width: 3 },
                ],
                readout: (p) => r`${p.n} term${p.n > 1 ? 's' : ''} (up to $\sin ${2 * p.n - 1}x$). Peak height: $${peakOf(p.n).toFixed(3)}$`,
              },
              after: r`With more terms, the sum hugs the square wave ever more closely. But look at the corners: a little **overshoot** never goes away. It just gets narrower. That's the **Gibbs phenomenon**: the peak settles near 1.179, an overshoot of about 9% of the jump.`,
            },
            {
              type: 'numeric',
              title: 'The fifth harmonic',
              prompt: r`In the square-wave series, what is the amplitude of $\sin 5x$? (2 decimal places.)`,
              lhs: r`$b_5 =$`,
              answer: 4 / (5 * PI),
              tol: 0.006,
              wrong: [{ v: 0.2, tol: 0.006, why: r`Don't forget the factor $\frac{4}{\pi}$ in front: $\frac{4}{5\pi}$.` }, { v: 1.27, tol: 0.01, why: r`That's $b_1 = \frac4\pi$. The fifth harmonic is divided by 5.` }],
              explain: r`$b_5 = \dfrac{4}{\pi} \cdot \dfrac{1}{5} = \dfrac{4}{5\pi} \approx 0.25$.`,
            },
            {
              type: 'mcq',
              title: 'Missing even harmonics',
              prompt: r`The square wave has no $\sin 2x$, $\sin 4x$, … terms. Why might that be?`,
              choices: [
                { t: 'The square wave’s second half is an upside-down copy of its first half, and even harmonics don’t have that property', ok: true },
                { t: 'Even harmonics are too fast to matter', why: r`Plenty of faster odd harmonics are included. It's about symmetry, not speed.` },
                { t: 'It’s a coincidence', why: 'There’s a reason: a symmetry the even harmonics can’t share.' },
              ],
              explain: r`Shift the square wave by half a period ($\pi$) and it flips sign: $f(x + \pi) = -f(x)$. Odd harmonics share this ($\sin 3(x + \pi) = -\sin 3x$) but even ones don't ($\sin 2(x + \pi) = +\sin 2x$). Symmetries of a signal tell you which harmonics can appear.`,
            },
            {
              type: 'numeric',
              title: 'Gibbs overshoot',
              prompt: r`The peak of the partial sums settles near 1.179, while the square wave itself only reaches 1. What fraction of the total jump (from $-1$ to $+1$, a jump of 2) is the overshoot? (Give a percentage, 1 decimal place.)`,
              unit: '%',
              answer: (0.179 / 2) * 100,
              tol: 0.1,
              wrong: [{ v: 17.9, tol: 0.1, why: 'That’s the overshoot as a fraction of 1. The jump is 2.' }],
              explain: r`$\frac{0.179}{2} \approx 9\%$ of the jump. The Gibbs overshoot appears at **every** jump of **every** Fourier series, always about 9%, however many terms you add. Engineers see it as "ringing" near sharp edges in filtered signals and images.`,
            },
            {
              type: 'numeric',
              title: 'The seventh harmonic',
              prompt: r`In the square wave $\frac4\pi\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \cdots\right)$, how big is the 7th harmonic relative to the fundamental? (3 decimal places.)`,
              answer: 1 / 7,
              tol: 0.001,
              explain: r`$\frac17 \approx 0.143$. Amplitudes falling like $\frac1n$ is the signature of a waveform with jumps.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A surprising sum',
              prompt: r`At $x = \tfrac{\pi}{2}$, the square wave equals 1, and $\sin\tfrac{n\pi}{2}$ cycles $1, 0, -1, 0, \dots$ So the series says $1 = \tfrac4\pi\left(1 - \tfrac13 + \tfrac15 - \tfrac17 + \dots\right)$. What does that give?`,
              choices: [
                { t: r`$1 - \tfrac13 + \tfrac15 - \tfrac17 + \dots = \tfrac{\pi}{4}$`, ok: true },
                { t: r`$1 - \tfrac13 + \tfrac15 - \tfrac17 + \dots = 1$`, why: r`The $\frac{4}{\pi}$ must be divided out: the sum is $\frac{\pi}{4}$.` },
                { t: r`$1 - \tfrac13 + \tfrac15 - \tfrac17 + \dots = \tfrac{4}{\pi}$`, why: r`Rearrange $1 = \frac{4}{\pi} \times S$, so $S = \frac{\pi}{4}$.` },
              ],
              explain: r`So $1 - \tfrac13 + \tfrac15 - \dots = \tfrac{\pi}{4}$: the **Leibniz formula for π**, falling straight out of a square wave! Fourier series connect surprisingly distant parts of mathematics.`,
            },
          ],
          recap: [
            r`Square wave $= \tfrac{4}{\pi}\left(\sin x + \tfrac13\sin 3x + \tfrac15\sin 5x + \dots\right)$: odd harmonics only.`,
            'More terms give a closer fit, but a ~9% overshoot persists at jumps (Gibbs).',
            'Symmetries of a signal decide which harmonics appear.',
          ],
        },
      ],
    },
    {
      title: 'Using Fourier',
      summary: 'Sound, coefficients and compression.',
      lessons: [
        {
          id: 'timbre',
          title: 'The Sound of Harmonics',
          summary: 'Why instruments sound different',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Same note, different sound',
              body: r`A flute and a violin playing the same A (440 Hz) share the same fundamental frequency, but they sound completely different. The difference, called **timbre**, comes from **how much of each harmonic** (880, 1320, 1760 Hz, …) is mixed in. The list of harmonic amplitudes is the sound's **spectrum**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Mix a timbre',
              body: r`Each slider sets the strength of one harmonic. Watch how the waveform changes. (A pure sine wave sounds smooth and flute-like. More high harmonics sound brighter and buzzier.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4 * PI, ymin: -3.6, ymax: 3.6, grid: PI, gridY: 1, height: 300, axes: false,
                params: {
                  h1: { min: 0, max: 1, step: 0.1, value: 1, label: '1st', color: 'blue', format: (v) => f1(v) },
                  h2: { min: 0, max: 1, step: 0.1, value: 0, label: '2nd', color: 'teal', format: (v) => f1(v) },
                  h3: { min: 0, max: 1, step: 0.1, value: 0, label: '3rd', color: 'coral', format: (v) => f1(v) },
                  h4: { min: 0, max: 1, step: 0.1, value: 0, label: '4th', color: 'amber', format: (v) => f1(v) },
                  h5: { min: 0, max: 1, step: 0.1, value: 0, label: '5th', color: 'violet', format: (v) => f1(v) },
                },
                curves: [{ f: (x, p) => p.h1 * Math.sin(x) + p.h2 * Math.sin(2 * x) + p.h3 * Math.sin(3 * x) + p.h4 * Math.sin(4 * x) + p.h5 * Math.sin(5 * x), color: 'ink', width: 3 }],
                extra: ({ plot, p, s }) => ['h1', 'h2', 'h3', 'h4', 'h5'].map((k, i) => s('rect', { x: plot.X(4 * PI) - 108 + i * 20, y: plot.Y(-3.5) - 44 * p[k], width: 14, height: 44 * p[k], rx: 3, class: `fl-${['blue', 'teal', 'coral', 'amber', 'violet'][i]}` })),
                readout: () => 'The bars in the corner show the spectrum.',
              },
              after: r`Try only odd harmonics (1st, 3rd, 5th): that hollow, reedy sound is like a **clarinet**, which (as a closed pipe) favours odd harmonics. A rich mix of all harmonics is closer to a **violin** or a brass instrument.`,
            },
            {
              type: 'numeric',
              title: 'A clarinet’s harmonics',
              prompt: r`A clarinet behaves like a pipe closed at one end, which produces only **odd** harmonics. If its fundamental is 200 Hz, what is the third frequency in the list of harmonics it actually produces?`,
              unit: 'Hz',
              answer: 1000,
              wrong: [{ v: 600, why: 'That’s the second one it produces (3 × 200). The list goes 200, 600, 1000, …' }, { v: 800, why: '4 × 200 is an even harmonic, which the clarinet lacks.' }],
              explain: r`Odd harmonics only: $200, 600, 1000, \ldots$ Hz, so the third is 1000 Hz (by the usual numbering, that's the 5th harmonic: $5 \times 200$). The missing even harmonics give the clarinet its hollow, woody sound, a lot like a softened square wave, which also has only odd harmonics.`,
            },
            {
              type: 'numeric',
              title: 'A violin’s overtone',
              prompt: r`A violin plays concert A at 440 Hz. What is the frequency of its third harmonic?`,
              unit: 'Hz',
              answer: 1320,
              explain: r`$3 \times 440 = 1320$ Hz, a fifth above the octave (an E). The balance between harmonics like this one gives each instrument its character.`,
            },
            {
              type: 'mcq',
              title: 'A pure-sounding flute',
              prompt: r`A flute sounds "purer" than an oboe playing the same note. What does that suggest about its spectrum?`,
              choices: [
                { t: r`Its sound is close to a single sine wave, with weak higher harmonics`, ok: true },
                { t: r`It plays at a different fundamental frequency`, why: r`Same note means the same fundamental; the difference is in the harmonics.` },
                { t: r`It has stronger high harmonics`, why: r`Strong high harmonics make a sound brighter and reedier, like the oboe.` },
              ],
              explain: r`A flute’s waveform is nearly sinusoidal, so its spectrum is dominated by the fundamental. Reed instruments produce rich, sharp-cornered waveforms with strong harmonics, giving their nasal, buzzy colour.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Seeing sound',
              prompt: r`A music app shows a live **spectrum** of your voice with tall bars at 220, 440, 660 and 880 Hz. What is the pitch of the note you're singing?`,
              cols: 2,
              choices: [
                { t: '220 Hz', ok: true },
                { t: '880 Hz', why: 'That’s the highest harmonic shown. The pitch we hear is the fundamental.' },
                { t: '550 Hz', why: 'We hear the fundamental, not the average.' },
                { t: '2,200 Hz', why: 'The pitch isn’t the sum of the frequencies.' },
              ],
              explain: r`The bars are at $1\times, 2\times, 3\times, 4\times$ 220 Hz: a fundamental of **220 Hz** plus its harmonics. Our ears hear the fundamental as the pitch, and the harmonic mix as the voice's character. Your ear does a kind of Fourier analysis: different spots along your cochlea respond to different frequencies.`,
            },
          ],
          recap: [
            'Timbre is the mix of harmonics: the spectrum.',
            'The fundamental sets the pitch. The harmonics set the character.',
            'The ear separates sound into frequencies, a natural Fourier analyser.',
          ],
        },
        {
          id: 'coefficients',
          title: 'Finding the Recipe',
          summary: 'Orthogonality and integrals',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Multiply and average',
              body: r`Here's the key trick. Multiply two harmonics, $\sin mx \cdot \sin nx$, and look at the **average** over a full period.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * PI, ymin: -1.3, ymax: 1.3, grid: PI / 2, gridY: 0.5, height: 280, axes: { xticksBelow: true, xlabelBelow: 'edge', ...XY, ...piTicks },
                params: {
                  m: { min: 1, max: 4, step: 1, value: 1, label: '$m$', color: 'blue', format: (v) => `${v}` },
                  n: { min: 1, max: 4, step: 1, value: 2, label: '$n$', color: 'coral', format: (v) => `${v}` },
                },
                curves: [{ f: (x, p) => Math.sin(p.m * x) * Math.sin(p.n * x), color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  let d = `M${plot.X(0)} ${plot.Y(0)}`;
                  for (let i = 0; i <= 240; i++) {
                    const x = (2 * PI * i) / 240;
                    d += `L${plot.X(x).toFixed(1)} ${plot.Y(Math.sin(p.m * x) * Math.sin(p.n * x)).toFixed(1)}`;
                  }
                  d += `L${plot.X(2 * PI)} ${plot.Y(0)}Z`;
                  return [s('path', { d, class: 'fl-violet-soft', opacity: 0.6 }), s('line', { x1: plot.X(0), x2: plot.X(2 * PI), y1: plot.Y(p.m === p.n ? 0.5 : 0), y2: plot.Y(p.m === p.n ? 0.5 : 0), stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '8 6' })];
                },
                readout: (p) => r`average of $\sin ${p.m}x \cdot \sin ${p.n}x$ over $[0, 2\pi]$: $\;${p.m === p.n ? '\\tfrac12' : '0'}$`,
              },
              after: r`When $m \ne n$, the positive and negative areas cancel exactly: the average is **0**. When $m = n$, the product is $\sin^2 mx$, which is never negative and averages $\tfrac12$. Different harmonics are **orthogonal**, like perpendicular directions.`,
            },
            {
              type: 'explain',
              title: 'Filtering out one harmonic',
              body: r`Suppose $f(x) = b_1\sin x + b_2\sin 2x + b_3\sin 3x + \dots$. To find $b_3$, multiply by $\sin 3x$ and average. Every term averages to zero **except** $b_3\sin^2 3x$, which averages $\tfrac{b_3}{2}$. So:
$$b_n = 2 \times \text{average of } f(x)\sin nx = \frac{1}{\pi}\int_0^{2\pi} f(x)\sin nx\,dx$$
Multiplying by $\sin nx$ acts like a **filter** that picks out just the $n$th harmonic.`,
            },
            {
              type: 'numeric',
              title: 'Compute b₁ for the square wave',
              prompt: r`The square wave is $+1$ on $(0, \pi)$ and $-1$ on $(\pi, 2\pi)$. Compute $b_1 = \dfrac{1}{\pi}\displaystyle\int_0^{2\pi} f(x)\sin x\,dx$. (2 decimal places.)`,
              lhs: r`$b_1 =$`,
              answer: 4 / PI,
              tol: 0.006,
              wrong: [{ v: 0, why: r`On $(\pi, 2\pi)$ both $f$ and $\sin x$ are negative, so the product is **positive** there too. The two halves add up rather than cancelling.` }, { v: 4, why: r`The integral is 4. Divide by $\pi$.` }, { v: 0.64, tol: 0.01, why: r`Each half contributes $\int_0^\pi \sin x\,dx = 2$, so the total is 4. Then divide by $\pi$.` }],
              explain: r`On $(0, \pi)$: $\int_0^\pi \sin x\,dx = 2$. On $(\pi, 2\pi)$: $\int_\pi^{2\pi} (-1)\sin x\,dx = 2$ as well. So $b_1 = \dfrac{4}{\pi} \approx 1.27$, exactly the coefficient in Fourier's recipe.`,
            },
            {
              type: 'interactive',
              title: 'A coefficient detector',
              body: r`The violet curve is a mystery signal built from a few sine harmonics. Choose $n$: the shaded curve is the signal multiplied by $\sin nx$, and its average (times 2) is $b_n$. Find the harmonic whose coefficient is **0.5**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * PI, ymin: -1.6, ymax: 1.6, grid: false, height: 280, axes: { ...XY, ...piTicks, yticks: 0.5 },
                params: { n: { min: 1, max: 6, step: 1, value: 2, label: '$n$', color: 'coral' } },
                curves: [{ f: (x) => mystery(x), color: 'violet', width: 3, n: 400 }],
                extra: ({ plot, p, s }) => { let d = `M${plot.X(0)} ${plot.Y(0)}`; for (let i = 0; i <= 300; i++) { const x = (2 * PI * i) / 300; d += `L${plot.X(x).toFixed(1)} ${plot.Y(mystery(x) * Math.sin(p.n * x)).toFixed(1)}`; } d += `L${plot.X(2 * PI)} ${plot.Y(0)}Z`; return [s('path', { d, class: 'fl-coral-soft', opacity: 0.7 })]; },
                readout: (p) => `$b_${p.n} = 2 \\times$ average of $f(x)\\sin ${p.n}x$ = **${bCoef(mystery, p.n).toFixed(3)}**`,
                goal: (p) => Math.abs(bCoef(mystery, p.n) - 0.5) < 0.01,
                hint: 'Try each n in turn: most give 0.',
                solution: { n: 3 },
              },
              explain: r`$b_3 = 0.5$. The full recipe is $f(x) = 0.8\sin x + 0.5\sin 3x + 0.2\sin 5x$: the detector reads off each ingredient separately, ignoring all the others. This is exactly what a spectrum analyser, or your ear's cochlea, does to sound.`,
            },
            {
              type: 'numeric',
              title: 'Average of a square',
              prompt: r`The coefficient recipe relies on averages like this one. What is the average value of $\sin^2 x$ over a full period?`,
              answer: 0.5,
              tol: 0.001,
              explain: r`$\sin^2 x = \frac{1 - \cos 2x}{2}$, and $\cos 2x$ averages to zero, leaving $\frac12$. That’s why $b_n = \frac{2}{T}\int f(t)\sin(n\omega t)\,dt$ has a factor 2: it undoes this one half.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The third harmonic',
              prompt: r`For the same square wave, compute $b_3 = \dfrac{1}{\pi}\displaystyle\int_0^{2\pi} f(x)\sin 3x\,dx$. ($\int_0^\pi \sin 3x\,dx = \frac23$; 3 decimal places.)`,
              lhs: r`$b_3 =$`,
              answer: 4 / (3 * PI),
              tol: 0.002,
              wrong: [{ v: 4 / PI, tol: 0.006, why: 'That’s b₁. Each half now contributes 2/3, not 2.' }, { v: 0, why: 'That happens for even n. For n = 3, the two halves add up again.' }],
              explain: r`Each half contributes $\frac23$, so $b_3 = \frac{1}{\pi} \cdot \frac43 = \frac{4}{3\pi} \approx 0.424$. In general $b_n = \frac{4}{n\pi}$ for odd $n$ and $0$ for even $n$: exactly the square-wave recipe.`,
            },
          ],
          recap: [
            r`$\sin mx$ and $\sin nx$ are orthogonal: their product averages 0 unless $m = n$.`,
            r`$b_n = \dfrac{1}{\pi}\int_0^{2\pi} f(x)\sin nx\,dx$ picks out one harmonic.`,
            'This works like a filter tuned to one frequency.',
          ],
        },
        {
          id: 'applications',
          title: 'Fourier Everywhere',
          summary: 'Heat, compression and more',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'From heat to JPEG',
              body: r`Fourier invented his series to solve the **heat equation**: how temperature spreads through a metal bar. Each sine wave pattern of temperature simply fades away at its own rate (faster wiggles fade faster), so splitting the initial temperature into sines solves the whole problem.

Today, Fourier's ideas are everywhere:
- **JPEG** images and **MP3** audio split data into cosine waves and throw away the ones you can't see or hear.
- **MRI scanners** measure an image's frequencies and use a Fourier transform to rebuild the picture.
- **Noise-cancelling headphones**, Wi-Fi, earthquake analysis and quantum mechanics all rely on frequencies.`,
            },
            {
              type: 'mcq',
              title: 'Fading wiggles',
              prompt: r`A hot bar starts with a temperature pattern made of $\sin x$ plus a little $\sin 10x$. As heat spreads out, what happens?`,
              choices: [
                { t: r`The fast $\sin 10x$ ripple fades away much sooner than the smooth $\sin x$ part`, ok: true },
                { t: 'Both parts fade at the same rate', why: 'Sharp, rapid temperature differences between neighbouring spots even out fastest.' },
                { t: r`The $\sin 10x$ part grows`, why: 'Heat flows from hot to cold, smoothing things out. Ripples only shrink.' },
              ],
              explain: r`In the heat equation, the $n$th harmonic decays like $e^{-n^2 kt}$. For $n = 10$ that's 100 times faster than $n = 1$. Fine details vanish first, and the temperature smooths out into a gentle curve.`,
            },
            {
              type: 'numeric',
              title: 'How much faster?',
              prompt: r`In the heat equation the $n$th harmonic fades like $e^{-n^2 kt}$. How many times faster does the 3rd harmonic fade than the 1st?`,
              unit: '×',
              answer: 9,
              wrong: [{ v: 3, why: r`The rate depends on $n^2$, not $n$.` }],
              explain: r`$3^2 = 9$ times faster: in the time the smooth $\sin x$ shape halves, the $\sin 3x$ ripple has halved 9 times, shrinking to about $\frac{1}{500}$. That's why heat smooths out sharp temperature differences so quickly.`,
            },
            { /*anim:fourier*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching the wiggles fade',
              body: r`A metal bar starts evenly hot, with its two ends held cold. Its temperature (top) is a Fourier sum of $\sin x, \sin 3x, \sin 5x, \ldots$ The bars at the bottom show how much of each harmonic is left as the heat spreads.`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 6.6, ymin: -0.75, ymax: 4.7, grid: false, axes: false, height: 360, maxWidth: 560,
                animate: { param: 't', speed: 1, max: 10, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const kt = heatKt(p.t), X = (x) => plot.X((6 * x) / Math.PI), els = [], pts = [];
                  // temperature profile, 0 to 1.2 drawn from y = 2.3 to 4.5
                  const PY = (T) => plot.Y(2.3 + 1.8 * T);
                  els.push(s('line', { x1: X(0), x2: X(Math.PI), y1: PY(0), y2: PY(0), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  for (let i = 0; i <= 150; i++) { const x = (Math.PI * i) / 150; pts.push(`${i ? 'L' : 'M'}${X(x).toFixed(1)} ${PY(heatT(x, kt)).toFixed(1)}`); }
                  els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 }));
                  // the bar itself, coloured by temperature
                  for (let i = 0; i < 48; i++) {
                    const x = (Math.PI * (i + 0.5)) / 48, T = Math.min(1, Math.max(0, heatT(x, kt)));
                    els.push(s('rect', { x: X((Math.PI * i) / 48), y: plot.Y(2.0), width: X(Math.PI / 48) - X(0) + 0.6, height: plot.Y(1.55) - plot.Y(2.0), style: `fill:color-mix(in srgb, var(--coral) ${Math.round(100 * T)}%, var(--blue))` }));
                  }
                  // harmonic sizes
                  for (let k = 0; k < 8; k++) {
                    const n = 2 * k + 1, b = (4 / (n * Math.PI)) * Math.exp(-n * n * kt), bx = 0.4 + 0.75 * k, h = 1.0 * b / (4 / Math.PI);
                    els.push(s('rect', { x: plot.X(bx - 0.22), y: plot.Y(h), width: plot.X(0.44) - plot.X(0), height: Math.max(0, plot.Y(0) - plot.Y(h)), class: 'fl-violet', opacity: 0.8 }));
                    els.push(s('text', { x: plot.X(bx), y: plot.Y(0) + 16, 'text-anchor': 'middle', class: 'tick', text: String(n) }));
                  }
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(6.2), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  return els;
                },
                readout: (p) => { const kt = heatKt(p.t); return `$kt = ${fix(kt, 3)}$ · {violet:harmonic 1}: ${fix(100 * Math.exp(-kt), 1)}% left · {violet:harmonic 3}: ${fix(100 * Math.exp(-9 * kt), 1)}% left`; },
              },
              after: r`Each harmonic fades on its own, the $n$th like $e^{-n^2 kt}$: the sharp edges (made of high harmonics) are gone almost at once, and soon the bar's profile is just a single smooth arch, $\sin x$, sinking slowly. This is exactly how Fourier solved the heat equation in 1807: split the starting temperature into harmonics, let each one decay at its own rate, and add them back up.`,
            },
            {
              type: 'numeric',
              title: 'Keeping the big coefficients',
              prompt: r`JPEG breaks an image into 8 × 8 blocks of pixels and describes each block by 64 frequency coefficients. If, for a smooth block, only 10 coefficients are worth keeping, by what factor is that block compressed?`,
              unit: '×',
              answer: 6.4,
              tol: 0.01,
              explain: r`$\frac{64}{10} = 6.4$ times smaller. Smooth regions (sky, skin) need few coefficients; sharp edges need more, which is why JPEG shows faint ripples, "artefacts", next to crisp text.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Building a square wave',
              body: r`A square wave is the sum $\frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \cdots\right)$. Add terms one at a time and watch the approximation sharpen.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6.3, ymin: -1.5, ymax: 1.5, grid: false, height: 260, axes: { xticks: 1, yticks: 0.5 },
                params: { n: { min: 1, max: 40, step: 1, value: 1, label: 'terms', color: 'violet' } },
                curves: [{ f: (x) => (Math.sin(x) >= 0 ? 1 : -1), color: 'muted', dash: true, n: 600 }, { f: (x, p) => { let s = 0; for (let k = 0; k < p.n; k++) s += Math.sin((2 * k + 1) * x) / (2 * k + 1); return (4 / Math.PI) * s; }, color: 'violet', width: 2.5, n: 900 }],
                readout: (p) => { let top = 0; for (let i = 1; i < 2000; i++) { const x = (Math.PI * i) / 2000; let s = 0; for (let k = 0; k < p.n; k++) s += Math.sin((2 * k + 1) * x) / (2 * k + 1); top = Math.max(top, (4 / Math.PI) * s); } return `highest frequency ${2 * p.n - 1}× · overshoot near the jump: **${((top - 1) * 100).toFixed(1)}%**`; },
              },
              after: r`Each term adds finer detail, and the flat parts quickly become flat. But near the jumps the curve always overshoots by about 9%, however many terms you add (the Gibbs phenomenon). Compression throws away the small high-frequency terms: you lose some sharpness at the edges, as in a heavily compressed JPEG.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why compression works',
              prompt: r`JPEG stores each small block of a photo as a sum of cosine patterns, from smooth to finely striped. Which ones does it discard first to save space?`,
              choices: [
                { t: 'The finest, high-frequency patterns, which the eye notices least', ok: true },
                { t: 'The smoothest, low-frequency patterns', why: 'Those carry the overall brightness and shapes. Losing them would wreck the picture.' },
                { t: 'A random selection', why: 'JPEG is cleverer: it targets the details our eyes are least sensitive to.' },
              ],
              explain: r`Most of a photo's important information lives in the low frequencies. Our eyes are weak at seeing very fine variations, so JPEG keeps those coefficients roughly or drops them. That's why heavily compressed images look blocky and smeared around sharp edges, a cousin of the Gibbs ringing you saw at the square wave's jumps.`,
            },
          ],
          recap: [
            'Fourier created his series to solve the heat equation.',
            'In heat flow, high harmonics fade fastest.',
            'JPEG, MP3, MRI and much more rely on splitting signals into frequencies.',
          ],
        },
      ],
    },
    {
      title: 'Circles and Corners',
      summary: 'Drawing with epicycles, and how smoothness controls convergence.',
      lessons: [
        {
          id: 'epicycles',
          title: 'Drawing with Circles',
          summary: 'Spinning arrows trace any shape',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A point on a wheel',
              prompt: r`A point goes round a circle of radius 1 at steady speed. What do its $x$ and $y$ coordinates do over time?`,
              choices: [
                { t: 'They trace a cosine and a sine wave', ok: true },
                { t: 'They grow steadily', why: 'They go up and down as the point goes round, repeating each lap.' },
                { t: 'One stays fixed while the other changes', why: 'Both change: the shadow of circular motion on each axis is a sine wave.' },
              ],
              explain: r`$x = \cos t$, $y = \sin t$: circular motion is two sine waves at right angles. So sine waves and spinning circles are the same thing seen in different ways, and a sum of sine waves is a chain of circles, each spinning on the rim of the one before.`,
            },
            {
              type: 'explain',
              title: 'Arrows on arrows',
              body: r`Treat a point $(x, y)$ in the plane as the complex number $x + iy$. An arrow of length $r$ spinning $k$ times per lap is $c\,e^{ikt}$. A **complex Fourier series** writes any closed path as a sum of such arrows:
$$z(t) = \sum_k c_k\,e^{ikt},$$
with $k = 0, \pm1, \pm2, \ldots$ (negative $k$ spin clockwise). Each arrow is attached to the tip of the previous one, and the last tip traces the shape. Ancient astronomers did something similar with **epicycles**: circles riding on circles to model the planets' looping paths.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Epicycles at work',
              body: r`The chain of spinning circles (largest first) traces the coral curve. Choose a shape and add circles.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 420,
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  s: { min: 0, max: 1, step: 1, value: 0, label: 'shape', color: 'blue', format: (v) => SHAPES[v][0] },
                  N: { min: 1, max: 60, step: 1, value: 5, label: 'circles', color: 'coral' },
                },
                extra: ({ plot, p, s }) => {
                  const P = SHAPES[p.s][1], els = [];
                  els.push(s('path', { d: P.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  const tr = [];
                  for (let i = 0; i <= 240; i++) tr.push(epi(p.s, p.N, (2 * Math.PI * i) / 240).slice(-1)[0]);
                  els.push(s('path', { d: tr.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }));
                  const ch = epi(p.s, p.N, (p.t * 0.6) % (2 * Math.PI));
                  ch.slice(0, -1).forEach(([x, y], i) => {
                    const [x2, y2] = ch[i + 1], rr = Math.hypot(x2 - x, y2 - y);
                    if (rr > 0.004) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: plot.X(rr) - plot.X(0), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 1, opacity: 0.45 }));
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(y), x2: plot.X(x2), y2: plot.Y(y2), stroke: 'var(--blue)', 'stroke-width': 1.5 }));
                  });
                  const [ex, ey] = ch[ch.length - 1];
                  els.push(s('circle', { cx: plot.X(ex), cy: plot.Y(ey), r: 5, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => `${p.N} circle${p.N > 1 ? 's' : ''}, spinning at ${COEFS[p.s].slice(0, Math.min(p.N, 6)).map((c) => c.k).join(', ')}${p.N > 6 ? ', …' : ''} turns per lap`,
              },
              after: r`A handful of circles already gives a rounded version of the shape; corners need many fast, small circles, just as the square wave's jumps needed many harmonics. With enough circles you can draw anything, from a star to a portrait.`,
            },
            {
              type: 'mcq',
              title: 'Were the ancients wrong?',
              prompt: r`Ptolemy's model of the planets (around 150 AD) used circles riding on circles, and it predicted planetary positions well for over a thousand years. Why was it eventually replaced?`,
              choices: [
                { t: 'Enough epicycles can fit almost any motion, so fitting well explained little; Kepler’s ellipses and Newton’s gravity explained why', ok: true },
                { t: 'Epicycles can’t reproduce looping motions', why: 'They can reproduce them very well; that’s exactly what they were designed for.' },
                { t: 'It used too few circles to be accurate', why: 'More circles can always be added. The deeper problem was that it described without explaining.' },
              ],
              explain: r`As Fourier's work shows, **any** periodic path can be built from circles, so a good fit proves little about the underlying cause. Kepler's three laws, and then Newton's law of gravity, explained the motion with a single simple rule. A model that can fit anything risks explaining nothing, the same lesson as overfitting.`,
            },
            {
              type: 'mcq',
              title: 'Drawing a square',
              prompt: r`How many rotating arrows does a Fourier epicycle drawing need to trace a square **exactly**, corners and all?`,
              choices: [
                { t: r`Infinitely many: sharp corners need ever-higher frequencies`, ok: true },
                { t: r`Four, one per side`, why: r`Each arrow moves in a circle; straight sides and sharp corners need infinitely many to cancel out the curving.` },
                { t: r`Two`, why: r`Two circles give smooth curves (like ellipses), never corners.` },
              ],
              explain: r`Smooth shapes need few circles; corners and straight edges need infinitely many, with amplitudes shrinking slowly. In practice a few dozen give a convincing square, with tiny wiggles near the corners.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Which way, how fast?',
              prompt: r`In a complex Fourier series, the term $c_{-3}e^{-3it}$ is an arrow spinning clockwise. How many full turns does it make while the drawing is traced once?`,
              unit: 'turns',
              answer: 3,
              wrong: [{ v: -3, why: 'The minus sign gives the direction (clockwise). Count the number of turns: 3.' }, { v: 1, why: r`$e^{-3it}$ goes round once each time $3t$ increases by $2\pi$, which happens 3 times as $t$ goes from 0 to $2\pi$.` }],
              explain: r`As $t$ runs from 0 to $2\pi$, the angle $-3t$ goes to $-6\pi$: three clockwise turns. A square's coefficients are only nonzero for $k = 1, -3, 5, -7, 9, \ldots$, so its circles alternate direction, every fourth frequency. That pattern comes from the square's four-fold symmetry.`,
            },
          ],
          recap: [
            'Circular motion is two sine waves; a sum of sines is a chain of spinning circles.',
            r`Complex Fourier series: $z(t) = \sum c_k e^{ikt}$ draws any closed path.`,
            'Corners need many small, fast circles; fitting with enough circles explains little by itself.',
          ],
        },
        {
          id: 'smoothness',
          title: 'Corners and Smoothness',
          summary: 'How fast do the harmonics fade?',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Which is easier?',
              prompt: r`A square wave jumps; a triangle wave has corners but no jumps. Which do you expect to need fewer sine waves to approximate well?`,
              choices: [
                { t: 'The triangle wave', ok: true },
                { t: 'The square wave', why: 'Jumps are the hardest features to build from smooth sine waves.' },
                { t: 'They need the same number', why: 'Smoother shapes need fewer high harmonics.' },
              ],
              explain: r`Smooth curves are made of smooth waves, so the smoother the target, the less it needs the fast, wiggly harmonics. Let's measure how much.`,
            },
            {
              type: 'interactive',
              title: 'Three waves',
              body: r`Compare the square, sawtooth and triangle waves, built from the first few nonzero harmonics. The readout gives the **root-mean-square error**, a typical size of the gap. Get the triangle wave's error below **0.01** using as few terms as possible.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * PI, ymin: -1.5, ymax: 1.5, grid: PI / 2, gridY: 0.5, height: 280, axes: { ...XY, ...piTicks },
                params: {
                  w: { min: 0, max: 2, step: 1, value: 2, label: 'wave', color: 'blue', format: (v) => WAVES[v][0] },
                  n: { min: 1, max: 20, step: 1, value: 1, label: 'terms', color: 'coral' },
                },
                curves: [{ f: (x, p) => WAVES[p.w][2](x), color: 'ink', dash: true }, { f: (x, p) => WAVES[p.w][1](x, p.n), color: 'coral', width: 2.5, n: 500 }],
                readout: (p) => `RMS error with ${p.n} term${p.n > 1 ? 's' : ''}: **${rmsErr(p.w, p.n).toFixed(4)}**`,
                goal: (p) => p.w === 2 && rmsErr(2, p.n) < 0.01 && p.n <= 5,
                hint: 'Choose the triangle wave and add terms one at a time.',
                solution: { w: 2, n: 5 },
              },
              explain: r`The triangle wave gets within 0.01 with just 5 terms (up to $\sin 9x$), while the square wave still has an error of about 0.1 even with 20 terms. The triangle's amplitudes fall like $\frac{1}{n^2}$; the square and sawtooth amplitudes only like $\frac1n$.`,
            },
            {
              type: 'explain',
              title: 'Smoothness and decay',
              body: r`The size of a function's Fourier coefficients reveals how smooth it is:

::: key
- **Jumps** (square, sawtooth): coefficients fall like $\frac{1}{n}$.
- **Corners** but no jumps (triangle): like $\frac{1}{n^2}$.
- Each extra level of smoothness gains another power of $\frac1n$; perfectly smooth periodic functions have coefficients that fall faster than any power.
:::

This is why compression works so well on smooth images and sounds, and why sharp edges are expensive to store.`,
            },
            {
              type: 'numeric',
              title: 'The triangle’s third harmonic',
              prompt: r`The triangle wave is $\frac{8}{\pi^2}\left(\sin x - \frac{\sin 3x}{9} + \frac{\sin 5x}{25} - \cdots\right)$. What is the size of its $\sin 3x$ coefficient? (3 decimal places.)`,
              answer: 8 / (9 * PI * PI),
              tol: 0.001,
              wrong: [{ v: 4 / (3 * PI), tol: 0.002, why: r`That's the square wave's $b_3$. The triangle's is $\frac{8}{\pi^2} \cdot \frac19$.` }, { v: 1 / 9, tol: 0.002, why: r`Include the factor $\frac{8}{\pi^2} \approx 0.81$.` }],
              explain: r`$\frac{8}{9\pi^2} \approx 0.090$, compared with $\frac{4}{3\pi} \approx 0.424$ for the square wave. By the 9th harmonic the triangle's coefficient is about 0.01, the square's still about 0.14.`,
            },
            {
              type: 'numeric',
              title: 'Triangle versus square',
              prompt: r`A triangle wave’s harmonics fall off like $\frac{1}{n^2}$ (a square wave’s like $\frac1n$). How big is the triangle wave’s 5th harmonic relative to its fundamental?`,
              answer: 0.04,
              tol: 0.001,
              explain: r`$\frac{1}{5^2} = \frac{1}{25} = 0.04$, versus $\frac15 = 0.2$ for the square wave. Corners (kinks) are milder than jumps, so the harmonics die away faster.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Energy in the harmonics',
              body: r`**Parseval's theorem** says a wave's average squared value equals half the sum of its squared coefficients. The square wave's squared value is always 1, and its coefficients are $\frac{4}{\pi n}$ for odd $n$, so
$$1 = \frac12 \cdot \frac{16}{\pi^2}\left(1 + \frac19 + \frac{1}{25} + \frac{1}{49} + \cdots\right).$$`,
              prompt: r`What is $1 + \frac19 + \frac{1}{25} + \frac{1}{49} + \cdots$ (the sum over odd squares)? (4 decimal places.)`,
              answer: (PI * PI) / 8,
              tol: 0.0001,
              wrong: [{ v: (PI * PI) / 6, tol: 0.0002, why: r`That's the sum over **all** squares. Rearranging gives $\frac{2\pi^2}{16} = \frac{\pi^2}{8}$ for the odd ones.` }, { v: 16 / (PI * PI), tol: 0.001, why: r`Solve for the sum: it equals $\frac{2\pi^2}{16}$.` }],
              hint: r`Rearrange: sum $= \frac{2\pi^2}{16}$.`,
              explain: r`The sum is $\frac{\pi^2}{8} \approx 1.2337$. The even squares add a quarter of the total ($\frac14 + \frac{1}{16} + \cdots$ is $\frac14$ of everything), so the full sum $1 + \frac14 + \frac19 + \cdots = \frac43 \cdot \frac{\pi^2}{8} = \frac{\pi^2}{6}$: the famous **Basel problem**, first solved by Euler in 1734, here falling out of a square wave.`,
            },
          ],
          recap: [
            'Smoother functions have Fourier coefficients that fade faster.',
            'Jumps: about 1/n. Corners: about 1/n². Smooth: faster than any power.',
            r`Parseval's theorem turns the square wave into $\sum \frac{1}{n^2} = \frac{\pi^2}{6}$.`,
          ],
        },
      ],
    },
  ],
};
