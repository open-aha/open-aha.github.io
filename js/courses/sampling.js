const r = String.raw;
const FS = 10; // sample rate (Hz) in the aliasing demo
const alias = (f) => Math.abs(f - FS * Math.round(f / FS));
const quant = (v, bits) => {
  const L = 2 ** bits; // levels spread over [-1, 1]
  const step = 2 / (L - 1);
  return -1 + Math.round((v + 1) / step) * step;
};

const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
// a band-limited test signal (frequencies below 2 Hz), sampled at 4.5 Hz for the reconstruction demo
const band = (t) => 0.6 * Math.sin(2 * Math.PI * 0.7 * t) + 0.4 * Math.cos(2 * Math.PI * 1.6 * t + 0.5);
const RS = 4.5;
// moving-average filter on a noisy sine (seeded noise)
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const NS = 200;
const CLEAN = Array.from({ length: NS }, (_, i) => Math.sin((2 * Math.PI * 2 * i) / NS));
const NOISY = (() => { const R = rng(5); return CLEAN.map((c) => c + (R() - 0.5) * 1.2); })();
const smooth = (w) => { const h = (w - 1) / 2; return NOISY.map((_, i) => { const a = Math.max(0, i - h), b = Math.min(NS, i + h + 1); let s = 0; for (let j = a; j < b; j++) s += NOISY[j]; return s / (b - a); }); };
const maErr = (w) => Math.sqrt(smooth(w).reduce((s, v, i) => s + (v - CLEAN[i]) ** 2, 0) / NS);
const BEST_W = (() => { let best = 1; for (let w = 1; w <= 61; w += 2) if (maErr(w) < maErr(best)) best = w; return best; })();
// DFT demo: a 64-sample signal hiding two tones (5 and 12 cycles)
const N64 = 64;
const HID = Array.from({ length: N64 }, (_, n) => Math.sin((2 * Math.PI * 5 * n) / N64) + 0.5 * Math.sin((2 * Math.PI * 12 * n) / N64 + 1));
const dftMag = (k) => { let re = 0, im = 0; HID.forEach((x, n) => { re += x * Math.cos((2 * Math.PI * k * n) / N64); im -= x * Math.sin((2 * Math.PI * k * n) / N64); }); return (2 * Math.hypot(re, im)) / N64; };

export default {
  id: 'sampling',
  subject: 'math',
  title: 'Sampling & Digital Signals',
  level: 'Advanced',
  cover: 'sampling',
  tagline: 'How smooth sound becomes numbers, why wheels spin backwards on film, filters, the FFT, and how MP3s shrink music.',
  description: r`Every digital photo, song and phone call starts as a smooth, continuous signal that has to be turned into numbers. Learn how sampling works, why sampling too slowly creates phantom frequencies, the theorem that says how fast is fast enough, how bits, quantization and compression shape what you hear, how filters clean up noisy signals, and how the FFT finds hidden frequencies.`,
  prereq: 'Fourier Series',
  chapters: [
    {
      title: 'Sampling',
      summary: 'Snapshots of a signal.',
      lessons: [
        {
          id: 'samples',
          title: 'Snapshots of Sound',
          summary: 'Turning waves into numbers',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Measuring at regular instants',
              body: r`A microphone turns sound into a voltage that varies smoothly in time. To store it digitally, an **analogue-to-digital converter** measures the voltage at regular instants: these measurements are **samples**. The number of samples per second is the **sample rate**.

A music CD uses 44,100 samples per second for each of its two stereo channels. Playback reverses the process, rebuilding a smooth signal from the samples.`,
            },
            {
              type: 'numeric',
              title: 'How many numbers?',
              prompt: r`How many samples are stored for a 3-minute stereo song on a CD? Give the answer in millions (1 decimal place).`,
              unit: 'million',
              answer: (44100 * 180 * 2) / 1e6,
              tol: 0.06,
              wrong: [{ v: (44100 * 180) / 1e6, tol: 0.06, why: 'Stereo means two channels, each with its own samples.' }, { v: (44100 * 3 * 2) / 1e6, tol: 0.01, why: 'Convert 3 minutes to 180 seconds.' }],
              explain: r`$44{,}100 \times 180 \times 2 \approx 15.9$ million samples. Each is a 16-bit number, so the song takes about 32 megabytes uncompressed.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'More or fewer snapshots',
              body: r`Here a 1 Hz wave is sampled at different rates. Straight lines join the dots (a crude reconstruction). Change the sample rate.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2, ymin: -1.3, ymax: 1.3, grid: false, height: 260, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'seconds', xticks: 0.5, yticks: 1 },
                params: { fs: { min: 1, max: 40, step: 1, value: 6, label: 'sample rate', color: 'violet', format: (v) => `${v} per second` } },
                curves: [{ f: (t) => Math.sin(2 * Math.PI * t), color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => {
                  const pts = Array.from({ length: 2 * p.fs + 1 }, (_, n) => [n / p.fs, Math.sin((2 * Math.PI * n) / p.fs)]);
                  return [s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 }), ...pts.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 4.5, class: 'fl-ink' }))];
                },
                readout: (p) => `${p.fs} samples per second · ${(p.fs).toFixed(0)} samples per cycle of the wave`,
              },
              after: r`With many samples per cycle, even joining the dots with straight lines looks like the wave. With very few, the dots seem to describe something else entirely, as you'll see in the next lesson. Real converters don't join the dots with straight lines: they use a smarter recipe that, remarkably, can rebuild the wave exactly.`,
            },
            {
              type: 'numeric',
              title: 'The highest note',
              prompt: r`A sampled signal can faithfully capture frequencies only up to **half** its sample rate (the Nyquist rule, which later lessons explain). Professional audio is sampled 48,000 times per second. What is the highest frequency it can capture, in kHz?`,
              unit: 'kHz',
              answer: 24,
              wrong: [{ v: 48, why: r`You need at least two samples per cycle: half the sampling rate.` }],
              explain: r`Half the sampling rate: **24 kHz**, safely above the roughly 20 kHz limit of human hearing. CD audio’s 44.1 kHz gives 22.05 kHz.`,
            },
            {
              type: 'numeric',
              title: 'An hour of music',
              prompt: r`CD audio stores 44,100 samples per second in each of 2 channels, at 2 bytes per sample. How many megabytes (millions of bytes) does one hour take? (Nearest whole number.)`,
              unit: 'MB',
              answer: 44100 * 2 * 2 * 3600 / 1e6,
              tol: 1,
              wrong: [{ v: 317.52, tol: 1, why: 'Remember both channels: multiply by 2 for stereo.' }, { v: 10.584, tol: 0.1, why: 'That’s one minute. An hour is 60 times as much.' }],
              explain: r`$44{,}100 \times 2 \times 2 \times 3600 \approx 635$ MB. A CD holds about 700 MB, which is why discs top out at around 74 to 80 minutes of music.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Between samples',
              prompt: r`At 44,100 samples per second, how much time passes between one sample and the next, in microseconds (millionths of a second)? (1 decimal place.)`,
              unit: 'μs',
              answer: 1e6 / 44100,
              tol: 0.06,
              wrong: [{ v: 44.1, tol: 0.1, why: 'That’s the rate in thousands per second. The gap is 1 ÷ 44,100 seconds.' }],
              explain: r`$\frac{1}{44{,}100}$ s $\approx 22.7$ μs. In that time sound travels less than 8 mm. A 20 kHz tone (the highest you can hear) completes one cycle in 50 μs, so it gets just over two samples per cycle.`,
            },
          ],
          recap: [
            'Digital audio measures a signal at regular instants (samples).',
            'CDs use 44,100 samples per second per channel.',
            'Playback rebuilds a smooth signal from the samples.',
          ],
        },
        {
          id: 'aliasing',
          title: 'Aliasing',
          summary: 'Phantom frequencies',
          icon: 'eye',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Disguised waves',
              prompt: r`A wave is sampled 10 times per second (the dots). The dashed curve is the **lowest-frequency** wave that passes through the same dots: what you'd hear on playback. Find a frequency **above 5 Hz** whose samples are identical to those of a 2 Hz wave.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: -1.3, ymax: 1.3, grid: 0.1, gridY: 0.5, height: 280, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 's', xfmt: (v) => v.toFixed(1), yfmt: () => '' },
                params: { f: { min: 1, max: 20, step: 1, value: 3, label: 'true frequency', color: 'violet', format: (v) => `${v} Hz` } },
                curves: [
                  { f: (t, p) => Math.cos(2 * Math.PI * p.f * t), color: 'violet', width: 2.5 },
                  { f: (t, p) => Math.cos(2 * Math.PI * alias(p.f) * t), color: 'coral', width: 3, dash: true },
                ],
                extra: ({ plot, p, s }) => Array.from({ length: FS + 1 }, (_, n) => s('circle', { cx: plot.X(n / FS), cy: plot.Y(Math.cos(2 * Math.PI * p.f * (n / FS))), r: 7, class: 'fl-ink' })),
                readout: (p) => (alias(p.f) === p.f ? `${p.f} Hz is captured faithfully: the samples show a ${p.f} Hz wave.` : `The samples of ${p.f} Hz look exactly like **${alias(p.f)} Hz**: an alias!`),
                goal: (p) => p.f > 5 && alias(p.f) === 2,
                hint: 'Frequencies that differ from 2 Hz by a multiple of the sample rate (10 Hz) give the same samples.',
                solution: { f: 8 },
              },
              explain: r`8 Hz (and 12 Hz, and 18 Hz) give exactly the same samples as 2 Hz. Once sampled, there's no way to tell them apart: the high frequency masquerades as a low one. This is **aliasing**. Frequencies above half the sample rate (here 5 Hz) fold back into the range below it.`,
            },
            {
              type: 'mcq',
              title: 'Backwards wheels',
              prompt: r`In films (24 frames per second), a car's spoked wheels sometimes seem to turn slowly backwards even though the car is speeding forwards. Why?`,
              choices: [
                { t: 'Between frames, each spoke moves almost to where the next spoke was, so the samples look like a slow backwards rotation', ok: true },
                { t: 'The camera runs backwards between frames', why: 'The camera simply takes 24 snapshots per second. The wheel’s motion between snapshots is what fools us.' },
                { t: 'The wheel really briefly turns backwards', why: 'It doesn’t. It’s an illusion created by sampling: aliasing in time.' },
              ],
              explain: r`If a spoke advances by slightly less than the gap between spokes during each frame, the nearest spoke in the next frame appears slightly **behind**: the eye sees slow backwards motion. This "wagon-wheel effect" is aliasing: the camera samples too slowly for the wheel's true rotation.`,
            },
            {
              type: 'numeric',
              title: 'Folding back',
              prompt: r`A 9 Hz wave is sampled 10 times per second. What frequency does it appear to have?`,
              unit: 'Hz',
              answer: 1,
              wrong: [{ v: 9, why: 'Above the Nyquist frequency (5 Hz), frequencies fold back: 10 − 9.' }, { v: 19, why: 'Aliases fold down into the range 0–5 Hz.' }],
              explain: r`$|9 - 10| = 1$ Hz. Each sample catches the 9 Hz wave just slightly behind where it was one cycle earlier, which looks like a slow 1 Hz wave.`,
            },
            {
              type: 'mcq',
              title: 'A frozen rotor',
              prompt: r`A helicopter’s rotor has 5 blades and turns 6 times per second. Filmed at 30 frames per second, what does the video show?`,
              choices: [
                { t: r`The rotor appears frozen`, ok: true },
                { t: r`The rotor appears to spin slowly forwards`, why: r`A blade passes the same spot exactly 5 × 6 = 30 times a second: once per frame.` },
                { t: r`A blur`, why: r`Each frame catches a blade in exactly the same place, so the picture looks still.` },
              ],
              explain: r`Blades pass any given position $5 \times 6 = 30$ times per second, matching the frame rate, so every frame shows the same picture: aliasing makes the motion vanish. Slightly faster and the rotor seems to creep forward; slightly slower and it creeps backwards.`,
            },
            {
              type: 'mcq',
              title: 'Filter first',
              prompt: r`Before sampling, audio equipment passes the signal through an **anti-aliasing filter**. What does it do?`,
              choices: [
                { t: r`Removes frequencies above half the sampling rate, so they can’t fold back as false tones`, ok: true },
                { t: r`Boosts the bass`, why: r`It’s a low-pass filter with a cut-off at the Nyquist frequency, not an equaliser.` },
                { t: r`Removes noise after sampling`, why: r`It acts before sampling; once aliasing has happened it can’t be undone.` },
              ],
              explain: r`After sampling, an alias is indistinguishable from a real tone at the same frequency, so the only cure is prevention: filter out everything the sample rate can’t represent before converting to digital.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Creeping backwards',
              prompt: r`A wheel with 12 identical spokes turns at 1.9 revolutions per second, filmed at 24 frames per second. It seems to turn slowly **backwards**. How many revolutions per second does it appear to turn? (Give the backward speed as a positive number, 2 decimal places.)`,
              unit: 'rev/s',
              answer: 0.1,
              tol: 0.005,
              wrong: [{ v: 1.9, tol: 0.01, why: 'That’s the real speed. The film only sees where the nearest spoke is in each frame.' }],
              explain: r`Each frame the wheel turns $\frac{1.9}{24}$ of a turn, just short of the spoke spacing $\frac{1}{12} = \frac{2}{24}$. So each spoke stops $\frac{0.1}{24}$ of a turn short of where its neighbour was, which looks like a backward step. Over 24 frames: $0.1$ rev/s backwards. At exactly 2 rev/s the wheel would look frozen.`,
            },
          ],
          recap: [
            'Different frequencies can produce identical samples.',
            'Frequencies above half the sample rate fold back to lower ones: aliasing.',
            'The wagon-wheel effect is aliasing in film.',
          ],
        },
      ],
    },
    {
      title: 'Going Digital',
      summary: 'The sampling theorem, bits and compression.',
      lessons: [
        {
          id: 'nyquist',
          title: 'The Sampling Theorem',
          summary: 'How fast is fast enough?',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Twice the highest frequency',
              body: r`The **Nyquist–Shannon sampling theorem** (Harry Nyquist, 1928; Claude Shannon, 1949) says: if a signal contains no frequencies above $f_{\max}$, then sampling it at **more than** $2 f_{\max}$ captures it perfectly. The original smooth signal can be rebuilt exactly from the samples.

Half the sample rate is called the **Nyquist frequency**. Before sampling, an electronic **anti-aliasing filter** removes anything above it, so nothing can sneak in as an alias.`,
            },
            {
              type: 'numeric',
              title: 'Why 44,100?',
              prompt: r`Human hearing extends up to about 20,000 Hz. What's the minimum sample rate the theorem requires to capture all audible sound?`,
              unit: 'Hz',
              answer: 40000,
              wrong: [{ v: 20000, why: 'You need more than twice the highest frequency.' }, { v: 10000, why: 'The sample rate must be at least twice the highest frequency, not half.' }],
              explain: r`Just over $2 \times 20{,}000 = 40{,}000$ Hz. CDs use 44,100 Hz, leaving room for a practical anti-aliasing filter to roll off between 20 kHz and the 22.05 kHz Nyquist frequency.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Perfect reconstruction',
              body: r`How can samples rebuild a smooth wave **exactly**? Replace each sample by a "sinc" pulse, $\frac{\sin(\pi x)}{\pi x}$, centred on it and scaled to its height, then add them all up. The signal here (black) contains frequencies only up to 1.6 Hz, sampled 4.5 times per second. Add more sinc pulses.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: -1.3, ymax: 1.3, grid: false, height: 280, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'seconds', xticks: 1, yticks: 1 },
                params: { m: { min: 1, max: 27, step: 1, value: 3, label: 'pulses used', color: 'teal' } },
                curves: [
                  { f: (t) => band(t), color: 'ink', width: 2, dash: true },
                  { f: (t, p) => { let s = 0; const c = Math.round(3 * RS); for (let j = 0; j < p.m; j++) { const n = c + (j % 2 ? -1 : 1) * Math.ceil(j / 2); if (n < 0 || n > 6 * RS) continue; s += band(n / RS) * sinc(RS * t - n); } return s; }, color: 'teal', width: 3, n: 500 },
                ],
                extra: ({ plot, s }) => Array.from({ length: Math.floor(6 * RS) + 1 }, (_, n) => s('circle', { cx: plot.X(n / RS), cy: plot.Y(band(n / RS)), r: 4, class: 'fl-ink' })),
                readout: (p) => `${p.m} sinc pulse${p.m > 1 ? 's' : ''}, centred on the samples nearest the middle`,
              },
              after: r`Each sinc pulse is 1 at its own sample and 0 at every other sample, so the sum passes through all the dots, and between them it curves in just the right way. Shannon proved that for a signal with no frequencies above half the sample rate, the sum of all the pulses equals the original signal **exactly**. Digital audio isn't a staircase: played back properly, it's smooth.`,
            },
            {
              type: 'numeric',
              title: 'Recording bats',
              prompt: r`Some bats call at up to 110 kHz, far above human hearing. What is the minimum sample rate needed to record such calls without aliasing, in kHz?`,
              unit: 'kHz',
              answer: 220,
              wrong: [{ v: 110, why: 'You need more than twice the highest frequency.' }, { v: 44.1, tol: 0.1, why: 'A CD rate would turn the bat calls into audible aliases.' }],
              explain: r`More than $2 \times 110 = 220$ kHz. Bat researchers use recorders sampling at 250 to 500 kHz, then slow the recording down by a factor of 10 or more so humans can hear the calls.`,
            },
            {
              type: 'numeric',
              title: 'An ultrasonic ghost',
              prompt: r`A 30 kHz ultrasonic tone (far too high to hear) reaches a recorder sampling at 44.1 kHz, with no anti-aliasing filter. At what frequency does it appear in the recording, in kHz?`,
              unit: 'kHz',
              answer: 14.1,
              tol: 0.05,
              wrong: [{ v: 30, why: 'That’s above the Nyquist frequency (22.05 kHz), so it can’t be recorded as itself. It folds back.' }],
              explain: r`It folds back to $44.1 - 30 = 14.1$ kHz: a clearly audible whistle that was never there. This is why the filter must come **before** sampling: afterwards, the false tone is indistinguishable from a real one.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Telephone voices',
              prompt: r`Traditional digital telephone lines sample voices 8,000 times per second. What is the highest frequency they can carry?`,
              unit: 'Hz',
              answer: 4000,
              wrong: [{ v: 16000, why: 'The highest frequency is half the sample rate, not double.' }, { v: 8000, why: 'That’s the sample rate. The Nyquist frequency is half of it.' }],
              explain: r`$8000 / 2 = 4000$ Hz (in practice, about 3.4 kHz after filtering). Enough to understand speech, but it cuts off the high frequencies that distinguish "s" from "f", which is why people spell names over the phone with "S for Sierra".`,
            },
          ],
          recap: [
            r`Sampling above $2 f_{\max}$ captures a band-limited signal perfectly.`,
            'Half the sample rate is the Nyquist frequency.',
            'Anti-aliasing filters remove frequencies above it before sampling.',
          ],
        },
        {
          id: 'bits',
          title: 'Bits & Compression',
          summary: 'Quantization and MP3s',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Rounding to levels',
              body: r`Each sample must also be stored with a limited number of bits, so its value is rounded to one of $2^n$ levels. This is **quantization**. Change the number of bits.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: -1.25, ymax: 1.25, grid: false, height: 260, axes: { xfmt: () => '', yfmt: () => '' },
                params: { b: { min: 1, max: 6, step: 1, value: 2, label: 'bits per sample', color: 'teal', format: (v) => `${v} (${2 ** v} levels)` } },
                curves: [
                  { f: (t) => Math.sin(2 * Math.PI * t), color: 'ink', width: 2, dash: true },
                  { f: (t, p) => quant(Math.sin(2 * Math.PI * Math.floor(t * 48) / 48), p.b), color: 'teal', width: 3 },
                ],
                readout: (p) => r`largest rounding error: $\pm${(1 / (2 ** p.b - 1)).toFixed(3)}$ (of a full swing of $\pm 1$)`,
              },
              after: r`With few bits, the staircase is crude and the rounding errors sound like hiss. Each extra bit doubles the number of levels and halves the error. CDs use 16 bits: $2^{16} = 65{,}536$ levels, enough to push the noise far below the music.`,
            },
            {
              type: 'numeric',
              title: 'CD bit rate',
              prompt: r`A CD stores 44,100 samples per second, 16 bits each, in 2 channels. What's the data rate in kilobits per second (1 kbit = 1000 bits)? (Nearest whole number.)`,
              unit: 'kbit/s',
              answer: (44100 * 16 * 2) / 1000,
              tol: 1,
              wrong: [{ v: (44100 * 16) / 1000, tol: 1, why: 'Don’t forget the two stereo channels.' }, { v: (44100 * 2) / 1000, tol: 1, why: 'Each sample is 16 bits.' }],
              explain: r`$44{,}100 \times 16 \times 2 = 1{,}411{,}200$ bits/s $\approx 1411$ kbit/s.`,
            },
            {
              type: 'numeric',
              title: 'Dynamic range',
              prompt: r`Each extra bit halves the rounding noise, which adds about 6 decibels of **dynamic range** (the span from the quietest to the loudest sound). About how many decibels does 16-bit audio give?`,
              unit: 'dB',
              answer: 96,
              tol: 1,
              wrong: [{ v: 16, why: 'Each bit is worth about 6 dB: 16 × 6.' }, { v: 65536, why: 'That’s the number of levels. Decibels are logarithmic: about 6 dB per bit.' }],
              explain: r`$16 \times 6 \approx 96$ dB, roughly the range from a quiet bedroom to a loud rock concert. Studios record at 24 bits (about 144 dB), leaving headroom so that nothing clips while mixing.`,
            },
            {
              type: 'numeric',
              title: '24-bit audio',
              prompt: r`Each extra bit doubles the number of levels, adding about 6.02 dB of dynamic range. What is the dynamic range of 24-bit audio, in dB? (Nearest dB.)`,
              unit: 'dB',
              answer: 6.02 * 24,
              tol: 0.6,
              explain: r`$6.02 \times 24 \approx 144$ dB, more than the range from the quietest sound you can hear to the threshold of pain (about 120–130 dB). That’s why 24 bits is used for recording and mixing, while 16 bits (96 dB) is plenty for listening.`,
            },
            {
              type: 'numeric',
              title: 'How much does MP3 shrink?',
              prompt: r`CD audio runs at about 1,411 kbit/s. A typical MP3 runs at 128 kbit/s. By roughly what factor is it compressed? (Nearest whole number.)`,
              answer: 1411 / 128,
              tol: 0.6,
              explain: r`$\frac{1411}{128} \approx 11$. The encoder throws away sounds masked by louder ones at nearby frequencies, which most listeners can’t hear anyway.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How MP3s shrink',
              prompt: r`A 128 kbit/s MP3 is about 11 times smaller than CD audio, yet most listeners find it sounds similar. What does it mainly throw away?`,
              choices: [
                { t: 'Sounds the ear can’t perceive, such as quiet frequencies masked by louder nearby ones', ok: true },
                { t: 'Every other sample', why: 'That would halve the Nyquist frequency and make high sounds alias. MP3 is far cleverer.' },
                { t: 'Nothing: the compression is lossless', why: 'MP3 is lossy: discarded information can’t be recovered. Lossless formats (like FLAC) only shrink audio about 2×.' },
              ],
              explain: r`MP3 uses a model of human hearing (**psychoacoustics**): it splits the sound into frequency bands with a Fourier-like transform, then spends bits only where the ear will notice. A loud tone hides quieter tones at nearby frequencies, and that hidden detail is discarded. JPEG does the same for images, discarding fine detail the eye barely sees.`,
            },
          ],
          recap: [
            r`Quantization rounds samples to $2^n$ levels; each extra bit halves the error.`,
            'CD audio: 44.1 kHz × 16 bits × 2 channels ≈ 1411 kbit/s.',
            'Lossy compression (MP3, JPEG) discards what our senses barely notice.',
          ],
        },
      ],
    },
    {
      title: 'Processing Signals',
      summary: 'Filters, and finding frequencies with the DFT.',
      lessons: [
        {
          id: 'filters',
          title: 'Digital Filters',
          summary: 'Smoothing away the noise',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'An average of neighbours',
              prompt: r`A sensor gives the readings 10, 14, 9, 13, 12. Replace the middle reading by the average of the three readings centred on it (14, 9, 13). What is the new value?`,
              answer: 12,
              wrong: [{ v: 11.6, tol: 0.01, why: 'That averages all five. Use just the middle three: 14, 9 and 13.' }, { v: 9, why: 'That’s the original reading. Average it with its two neighbours.' }],
              explain: r`$\frac{14 + 9 + 13}{3} = 12$. Doing this at every point is a **moving average**, the simplest digital filter: random jitter tends to cancel out, while the slow underlying trend survives.`,
            },
            {
              type: 'interactive',
              title: 'Tune the filter',
              body: r`The dots are noisy measurements of a smooth wave (dashed). The coral curve is a moving average over a window of $w$ neighbouring samples. Find the window that gives the **smallest** error.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: NS, ymin: -2, ymax: 2, grid: false, height: 280, axes: { xlabel: 'sample', xticks: 50, yticks: 1 },
                params: { w: { min: 1, max: 61, step: 2, value: 3, label: 'window w', color: 'coral' } },
                curves: [{ f: (i) => Math.sin((2 * Math.PI * 2 * i) / NS), color: 'ink', dash: true }],
                extra: ({ plot, p, s }) => {
                  const sm = smooth(p.w);
                  let d = '';
                  NOISY.forEach((v, i) => { d += `M${plot.X(i).toFixed(1)} ${plot.Y(v).toFixed(1)}h0`; });
                  return [s('path', { d, stroke: 'var(--ink-3)', 'stroke-width': 4, 'stroke-linecap': 'round' }), s('path', { d: sm.map((v, i) => `${i ? 'L' : 'M'}${plot.X(i).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 })];
                },
                readout: (p) => `Window ${p.w} · RMS error from the true wave: **${maErr(p.w).toFixed(4)}**`,
                goal: (p) => maErr(p.w) <= maErr(BEST_W) * 1.02,
                hint: 'Too small a window leaves the noise; too large a window flattens the wave itself. Look for the middle ground.',
                solution: { w: BEST_W },
              },
              explain: r`Small windows leave most of the noise; huge windows average across whole wiggles of the wave and flatten its peaks. The best window, here around ${BEST_W} samples, balances the two errors. This **trade-off between noise and distortion** is at the heart of every filter design.`,
            },
            {
              type: 'explain',
              title: 'Filters and frequencies',
              body: r`A moving average lets slow changes through and suppresses fast ones: it's a **low-pass filter**. In Fourier terms, it multiplies each frequency by a different amount, close to 1 for low frequencies and much smaller for high ones.

Filters can be designed to keep any band you like: **high-pass** filters remove rumble, **band-pass** filters isolate a radio station, and **notch** filters remove the 50 or 60 Hz hum of mains electricity. All of them are just weighted sums of neighbouring samples, computed millions of times a second in phones, hearing aids and hi-fi.`,
            },
            {
              type: 'mcq',
              title: 'Echoes and reverb',
              prompt: r`A sound effect adds to each sample a copy of the sample from 0.3 seconds earlier, at half the volume. What does it sound like?`,
              choices: [
                { t: 'An echo', ok: true },
                { t: 'The same sound, louder', why: 'The copy is delayed by 0.3 s, long enough to be heard separately.' },
                { t: 'The sound played backwards', why: 'Adding delayed copies doesn’t reverse time; it adds a repeat.' },
              ],
              explain: r`Adding a delayed, quieter copy is an echo. Add thousands of short, fading delays and you get the reverberation of a concert hall. Weighted sums of past samples like this are called **convolution**, the same operation as the image filters of the Neural Networks course.`,
            },
            {
              type: 'mcq',
              title: 'Differences, not averages',
              prompt: r`A filter outputs the difference of neighbouring samples, $y_n = x_n - x_{n-1}$. What kind of filter is it?`,
              choices: [
                { t: r`High-pass: it removes slow changes and keeps rapid ones`, ok: true },
                { t: r`Low-pass: it smooths the signal`, why: r`Averaging smooths; differencing does the opposite.` },
                { t: r`It changes nothing`, why: r`A constant signal gives zero output, while a rapidly alternating one is doubled.` },
              ],
              explain: r`A constant (zero-frequency) input gives 0, while an input alternating $+1, -1$ gives $\pm 2$. Averaging neighbours is low-pass; differencing is high-pass. Edge-detection in images uses the same idea in two dimensions.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Averaging away a frequency',
              prompt: r`A moving average over 4 consecutive samples is applied to a signal that alternates $+1, 0, -1, 0, +1, 0, -1, 0, \ldots$ (a wave that repeats every 4 samples). What is the output?`,
              answer: 0,
              wrong: [{ v: 0.25, tol: 0.01, why: r`Any 4 consecutive samples contain one $+1$, one $-1$ and two 0s.` }, { v: 1, why: 'Add up 4 consecutive samples: they cancel.' }],
              explain: r`Every window of 4 samples holds a complete cycle ($+1, 0, -1, 0$ in some order), which sums to 0. A moving average over $w$ samples completely removes any wave that repeats exactly every $w$ samples (or a whole fraction of $w$). Engineers use this to cancel known interference, like mains hum.`,
            },
          ],
          recap: [
            'A moving average is a simple low-pass filter: it keeps slow trends and suppresses fast jitter.',
            'Choosing the window trades noise against distortion.',
            'Filters are weighted sums of samples (convolution): echoes, reverb, hum removal.',
          ],
        },
        {
          id: 'dft',
          title: 'The DFT and the FFT',
          summary: 'Finding the frequencies in a list of numbers',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Hidden notes',
              prompt: r`You have 64 numbers sampled from a sound. How could you find out which pure tones it contains?`,
              choices: [
                { t: 'Compare it with test waves of each frequency: a large match means that tone is present', ok: true },
                { t: 'Look for the biggest number in the list', why: 'The biggest sample tells you about loudness at one instant, not about frequencies.' },
                { t: 'It can’t be done from samples', why: 'It can: this is exactly what the discrete Fourier transform does.' },
              ],
              explain: r`Multiply the samples by a test wave of frequency $k$ and add up the products. If the signal contains that frequency, the products mostly agree in sign and the sum is large; otherwise they cancel. Doing this for every $k$ is the **discrete Fourier transform** (DFT).`,
            },
            {
              type: 'interactive',
              title: 'Probe for tones',
              body: r`The signal (black) hides two tones, one loud and one quiet, among frequencies of 1 to 31 cycles per 64 samples. The violet wave is your probe. Scan the probe frequency and watch the match strength. Find the **quieter** hidden tone.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 63, ymin: -2, ymax: 2, grid: false, height: 260, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'sample', xticks: 16, yticks: 1 },
                params: { k: { min: 1, max: 31, step: 1, value: 2, label: 'probe frequency', color: 'violet', format: (v) => `${v} cycles` } },
                curves: [{ f: (x, p) => Math.sin((2 * Math.PI * p.k * x) / N64), color: 'violet', width: 1.5, n: 600 }],
                extra: ({ plot, s }) => [s('path', { d: HID.map((v, i) => `${i ? 'L' : 'M'}${plot.X(i).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }), ...HID.map((v, i) => s('circle', { cx: plot.X(i), cy: plot.Y(v), r: 2.5, class: 'fl-ink' }))],
                readout: (p) => { const m = dftMag(p.k); return `Match strength at ${p.k} cycles: **${m.toFixed(3)}** ${'█'.repeat(Math.round(m * 20))}`; },
                goal: (p) => p.k === 12,
                hint: 'One tone gives a strength of about 1; look for another, about half as strong.',
                solution: { k: 12 },
              },
              explain: r`The signal is $\sin$ at 5 cycles (strength 1) plus a half-strength wave at 12 cycles. Every other probe frequency gives zero: over a whole number of cycles, mismatched waves cancel exactly. The list of match strengths for every frequency is the signal's **spectrum**.`,
            },
            {
              type: 'explain',
              title: 'The discrete Fourier transform',
              body: r`For $N$ samples $x_0, \ldots, x_{N-1}$, the DFT gives, for each frequency $k$,
$$X_k = \sum_{n=0}^{N-1} x_n\, e^{-2\pi i k n / N}.$$
The complex exponential packs a cosine probe and a sine probe into one, so $|X_k|$ measures the strength of frequency $k$ whatever its phase. Done naively, each $X_k$ needs $N$ multiplications, so all $N$ of them take about $N^2$.`,
            },
            {
              type: 'numeric',
              title: 'Too slow?',
              prompt: r`A naive DFT of $N$ samples takes about $N^2$ operations. For one second of CD audio ($N = 44{,}100$), how many operations is that, in billions? (1 decimal place.)`,
              unit: 'billion',
              answer: (44100 * 44100) / 1e9,
              tol: 0.06,
              wrong: [{ v: 0.0441, tol: 0.001, why: r`Square it: $44{,}100^2 \approx 1.9 \times 10^9$.` }],
              explain: r`$44{,}100^2 \approx 1.94 \times 10^9$: about 2 billion operations for one second of sound, and that's for one channel. Real-time audio processing would be hopeless on early computers.`,
            },
            {
              type: 'explain',
              title: 'The Fast Fourier Transform',
              body: r`In 1965 James Cooley and John Tukey published the **Fast Fourier Transform**: split the samples into even- and odd-numbered halves, take the DFT of each half, and combine them. Repeating the split all the way down reduces the work from $N^2$ to about $N \log_2 N$. (Gauss had found the same trick around 1805 while computing asteroid orbits, but never published it.)

The FFT is often called the most important algorithm of the 20th century: it runs inside every phone, Wi-Fi router, MRI scanner and music app.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How much faster?',
              prompt: r`For $N = 1{,}048{,}576 = 2^{20}$ samples, roughly how many times faster is the FFT ($N \log_2 N$ operations) than the naive DFT ($N^2$)?`,
              unit: '×',
              answer: 2 ** 20 / 20,
              relTol: 0.02,
              wrong: [{ v: 20, why: r`That's $\log_2 N$. The ratio is $\frac{N^2}{N \log_2 N} = \frac{N}{\log_2 N}$.` }, { v: 2 ** 20, relTol: 0.02, why: r`Divide by $\log_2 N = 20$ as well.` }],
              hint: r`$\frac{N^2}{N \log_2 N} = \frac{N}{20}$.`,
              explain: r`$\frac{N}{\log_2 N} = \frac{1{,}048{,}576}{20} \approx 52{,}000$ times faster: a job that would take a naive DFT 14 hours takes the FFT about a second. Clever algorithms can matter more than faster hardware.`,
            },
          ],
          recap: [
            'The DFT measures each frequency by comparing the signal with test waves.',
            'Mismatched frequencies cancel; the list of strengths is the spectrum.',
            r`The FFT cuts the work from $N^2$ to $N\log_2 N$ by splitting into halves.`,
          ],
        },
        {
          id: 'moire',
          title: 'Moiré Patterns',
          summary: 'Aliasing you can see',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Ghostly stripes',
              body: r`Photograph a finely striped shirt or a brick wall from far away, and strange wavy bands can appear that aren’t really there. These **moiré patterns** are aliasing in space: the camera’s pixels sample the pattern, and stripes finer than the pixels masquerade as broad, slow stripes.

Just as with sound, a pattern with $f$ cycles per pixel, sampled once per pixel, looks the same as one with $|f - k|$ cycles per pixel for any whole number $k$. Only frequencies up to $\frac12$ cycle per pixel (the Nyquist limit) come through faithfully.`,
            },
            {
              type: 'numeric',
              title: 'A fine grating',
              prompt: r`A grating has 100 lines per cm and the camera sensor samples it at 95 pixels per cm. How many (false) lines per cm appear in the picture?`,
              unit: 'lines/cm',
              answer: 5,
              explain: r`$100 - 95 = 5$ lines per cm: broad bands in place of the fine grating. It’s the spatial version of beats between two close frequencies.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fooling the pixels',
              prompt: r`Top: fine stripes with $f$ cycles per pixel. Bottom: what a row of pixels records (each pixel samples the pattern at its centre). Find a stripe frequency between 0.5 and 1.5 that the pixels record as a slow pattern of only **0.1 cycles per pixel**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 3, grid: false, axes: false, maxWidth: 620, height: 200,
                params: { f: { min: 0.5, max: 1.5, step: 0.01, value: 0.7, label: 'stripe frequency', color: 'coral', format: (v) => `${v.toFixed(2)} cycles/pixel` } },
                extra: ({ plot, p, s }) => { const out = []; for (let i = 0; i < 800; i++) { const x = i * 0.05, v = 0.5 + 0.5 * Math.cos(2 * Math.PI * p.f * x); out.push(s('rect', { x: plot.X(x), y: plot.Y(2.9), width: plot.X(0.051) - plot.X(0), height: plot.Y(0) - plot.Y(1.1), fill: 'var(--ink)', opacity: v.toFixed(2) })); } for (let k = 0; k < 40; k++) { const v = 0.5 + 0.5 * Math.cos(2 * Math.PI * p.f * (k + 0.5)); out.push(s('rect', { x: plot.X(k) + 0.5, y: plot.Y(1.3), width: plot.X(1) - plot.X(0) - 1, height: plot.Y(0) - plot.Y(1.1), fill: 'var(--ink)', opacity: v.toFixed(2) })); } return out; },
                readout: (p) => { const a = Math.abs(p.f - Math.round(p.f)); return `true pattern ${p.f.toFixed(2)} cycles/pixel · pixels record **${a.toFixed(2)} cycles/pixel**${p.f > 0.5 ? ' (aliased!)' : ''}`; },
                goal: (p) => Math.abs(p.f - 0.9) < 0.005 || Math.abs(p.f - 1.1) < 0.005,
                hint: r`The recorded frequency is the distance from $f$ to the nearest whole number.`,
                solution: { f: 0.9 },
              },
              explain: r`Both $f = 0.9$ and $f = 1.1$ alias to 0.1: the pixels record a lazy wave with a 10-pixel period, although the real stripes are finer than the pixels. Cameras add an optical **anti-aliasing filter** that blurs the image very slightly, removing detail finer than the pixels can handle.`,
            },
            {
              type: 'mcq',
              title: 'Dress code',
              prompt: r`Why are TV presenters often asked not to wear finely striped or checked clothes?`,
              choices: [
                { t: 'The fine pattern can alias against the camera’s pixels into shimmering moiré bands', ok: true },
                { t: 'Stripes make the picture too bright', why: 'Brightness isn’t the problem. Fine regular patterns interfere with the pixel grid.' },
                { t: 'The colours bleed into each other', why: 'The issue is a regular pattern near the pixel spacing: aliasing.' },
              ],
              explain: r`As the presenter moves, the stripe frequency on the sensor changes and the false bands crawl and shimmer. Broadcasters avoid fine regular patterns for exactly this reason.`,
            },
            {
              type: 'numeric',
              title: 'Resolving power',
              prompt: r`A camera sensor is 4,000 pixels wide. What is the greatest number of light–dark stripe pairs (cycles) across the image it can record without aliasing?`,
              answer: 2000,
              explain: r`The Nyquist limit is half a cycle per pixel: $\frac{4000}{2} = 2000$ cycles. Finer patterns alias into false, coarser ones.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two screens',
              prompt: r`Two window screens with 50 and 52 wires per cm are laid on top of each other. How far apart (in cm) are the broad moiré bands you see?`,
              unit: 'cm',
              answer: 0.5,
              tol: 0.01,
              explain: r`The bands repeat at the difference frequency, $52 - 50 = 2$ per cm, so they are 0.5 cm apart. Tiny differences in spacing create big, easy-to-see bands, which is why moiré patterns are used to detect small strains in materials.`,
            },
          ],
          recap: [
            'Moiré patterns are spatial aliasing: fine detail masquerading as coarse bands.',
            'A pattern of f cycles per pixel looks like |f − k|; only f ≤ ½ is faithful.',
            'Overlapping gratings make bands at the difference frequency.',
          ],
        },
      ],
    },
  ],
};
