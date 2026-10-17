import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
// steady-state amplitude of a driven, damped oscillator (natural frequency 1, unit force)
const amp = (w, g) => 1 / Math.sqrt((1 - w * w) ** 2 + (2 * g * w) ** 2);
const L = 0.1e-6; // henries
const fLC = (CpF) => 1 / (2 * Math.PI * Math.sqrt(L * CpF * 1e-12)) / 1e6; // MHz

// undamped oscillator (natural frequency 1 rad/s) driven from rest at frequency w
const drivenFromRest = (w, t) => (Math.abs(w - 1) < 1e-9 ? (t * Math.sin(t)) / 2 : (Math.cos(w * t) - Math.cos(t)) / (w * w - 1));
const peakAmp = (g) => 1 / (2 * g * Math.sqrt(1 - g * g));
// tuned mass damper: primary (mass 1, natural freq 1, damping 2%) with absorber of mass ratio 5%
const MU = 0.05, Z1 = 0.02, ZA = Math.sqrt((3 * MU) / (8 * (1 + MU) ** 3));
const cabs = (re, im) => Math.hypot(re, im);
function tmdResponse(f, w) {
  const k2 = MU * f * f, c2 = 2 * ZA * MU * f;
  const nRe = k2 - MU * w * w, nIm = c2 * w;
  const aRe = 1 - w * w, aIm = 2 * Z1 * w;
  // den = (aRe + i aIm)(nRe + i nIm) − MU w² (k2 + i c2 w)
  const dRe = aRe * nRe - aIm * nIm - MU * w * w * k2, dIm = aRe * nIm + aIm * nRe - MU * w * w * c2 * w;
  return cabs(nRe, nIm) / cabs(dRe, dIm);
}
const tmdPeak = (f) => {
  let m = 0;
  for (let i = 0; i <= 1500; i++) m = Math.max(m, tmdResponse(f, 0.6 + (0.8 * i) / 1500));
  return m;
};
const larmor = (B) => 42.58 * B; // MHz for protons

export default {
  id: 'resonance',
  subject: 'physics',
  title: 'Resonance',
  level: 'Intermediate',
  cover: 'resonance',
  tagline: 'Natural frequencies, driven oscillations, wobbly bridges, radio tuning, skyscraper dampers and MRI.',
  description: r`Push a swing at just the right moments and it soars. Explore what happens when a system is driven near its natural frequency: why singers can shatter glasses, why a famous London bridge wobbled, how damping tames resonance, how every radio picks out one station from thousands, how a giant pendulum steadies a skyscraper, and how resonance in atoms gives us the greenhouse effect and MRI scanners.`,
  prereq: 'Waves & Oscillations',
  chapters: [
    {
      title: 'Driving Oscillations',
      summary: 'Natural frequencies and resonance.',
      lessons: [
        {
          id: 'natural',
          title: 'Natural Frequency',
          summary: 'Every system has a favourite rhythm',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Free oscillation',
              body: r`Pull a swing back and let go: it swings at its own **natural frequency**, set by its length (as you saw in the Waves course). A mass on a spring, a guitar string and a wine glass all have natural frequencies too.

Now push it repeatedly with a **driving frequency** of your choice. How big do the oscillations get?`,
            },
            {
              type: 'mcq',
              title: 'Pushing a swing',
              prompt: r`To make a child on a swing go as high as possible with small pushes, how often should you push?`,
              choices: [
                { t: 'Once per swing, in time with its natural rhythm', ok: true },
                { t: 'As fast as possible', why: 'Rapid pushes would often hit the swing while it’s coming toward you, cancelling earlier pushes.' },
                { t: 'At random times', why: 'Random pushes sometimes add energy and sometimes remove it.' },
              ],
              explain: r`Pushing at the natural frequency means every push arrives at the right moment, adding energy each time. Small pushes build up into huge swings: that's **resonance**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Build it up',
              prompt: r`An oscillator with natural frequency 1 (in suitable units) starts at rest and is pushed with a steady rhythm. Find the driving frequency that makes the swings **keep growing** instead of rising and falling.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: -30, ymax: 30, grid: 10, gridY: 10, height: 260, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'time', ylabel: 'displacement' },
                params: { w: { min: 0.5, max: 1.5, step: 0.05, value: 0.8, label: 'driving frequency', color: 'blue', format: (v) => `${v.toFixed(2)}×` } },
                curves: [{ f: (t, p) => drivenFromRest(p.w, t), color: 'violet', width: 2 }],
                readout: (p) => {
                  let m = 0;
                  for (let t = 0; t <= 60; t += 0.05) m = Math.max(m, Math.abs(drivenFromRest(p.w, t)));
                  return r`largest swing in this time: $${m.toFixed(1)}$`;
                },
                goal: (p) => Math.abs(p.w - 1) < 1e-9,
                hint: 'Off resonance, the pushes drift in and out of step with the swing, causing beats.',
                solution: { w: 1 },
              },
              explain: r`At exactly the natural frequency, every push adds energy and the amplitude grows steadily, in a straight-line envelope, until friction or breakage stops it. Slightly off, the pushes slip out of step: they help for a while, then fight the motion, giving **beats**.`,
            },
            {
              type: 'numeric',
              title: 'A playground swing',
              prompt: r`A swing hangs on 2.5 m chains, so it behaves like a pendulum with period $T = 2\pi\sqrt{L/g}$. How often should you push it, in seconds? (1 decimal place.)`,
              unit: 's',
              answer: 2 * Math.PI * Math.sqrt(2.5 / 9.8),
              tol: 0.05,
              wrong: [{ v: 2 * Math.PI * (2.5 / 9.8), tol: 0.05, why: 'Take the square root of L/g.' }],
              explain: r`$2\pi\sqrt{2.5/9.8} \approx 3.2$ s: one push every 3.2 seconds, in time with the swing.`,
            },
            {
              type: 'numeric',
              title: 'A heavier bob',
              prompt: r`A mass on a spring oscillates with period $2\pi\sqrt{m/k}$. If the mass doubles, by what factor does the period change? (3 decimal places.)`,
              answer: Math.sqrt(2),
              tol: 0.001,
              explain: r`$\sqrt2 \approx 1.414$. (A pendulum is different: its period doesn’t depend on the mass at all, because gravity’s pull grows in proportion.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Every other swing',
              prompt: r`You push the swing at the right moment, but only on **every second** swing (once every 6.4 s). What happens?`,
              choices: [
                { t: 'It still builds up, just more slowly: each push still arrives at the right point in the swing', ok: true },
                { t: 'Nothing: you must push every swing', why: 'Each push still lands at the right moment, so it still adds energy.' },
                { t: 'The swing stops', why: 'Pushes in phase always add energy, even if they skip cycles.' },
              ],
              explain: r`Driving at half (or a third…) of the natural frequency still adds energy each time, as long as each push lands in phase. That's why buildings can be shaken by vibrations at fractions or multiples of their natural frequency.`,
            },
          ],
          recap: [
            'Every oscillating system has a natural frequency.',
            'Driving it at that frequency adds energy on every cycle.',
            'This build-up is called resonance.',
          ],
        },
        {
          id: 'driven',
          title: 'The Resonance Curve',
          summary: 'Amplitude, damping and Q',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Sweep the frequency',
              body: r`This graph shows the steady amplitude of an oscillator driven by a gentle, constant-strength push, against the driving frequency (measured in units of the natural frequency). Change the damping (friction).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2.5, ymin: 0, ymax: 12, grid: 0.5, gridY: 2, height: 320, axes: { xlabel: 'driving ÷ natural frequency', ylabel: 'amplitude' },
                params: {
                  g: { min: 0.04, max: 0.7, step: 0.02, value: 0.1, label: 'damping', color: 'coral', format: (v) => v.toFixed(2) },
                  w: { min: 0.1, max: 2.4, step: 0.05, value: 0.6, label: 'driving freq.', color: 'blue', format: (v) => `${v.toFixed(2)}×` },
                },
                curves: [{ f: (x, p) => amp(x, p.g), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.w, y: (p) => Math.min(12, amp(p.w, p.g)), color: 'blue' }],
                readout: (p) => r`amplitude at ${p.w.toFixed(2)}×: $${f2(amp(p.w, p.g))}$ $\;$ (peak $\approx ${f2(amp(Math.sqrt(Math.max(0.01, 1 - 2 * p.g * p.g)), p.g))}$, about ${f2(1 / (2 * p.g))}× the response to a very slow push)`,
              },
              after: r`Far from the natural frequency, the response is small. Near it, the amplitude shoots up, and the **less damping**, the taller and narrower the peak. With very light damping, a tiny push produces an enormous response.`,
            },
            {
              type: 'mcq',
              title: 'Sharp or broad',
              prompt: r`The **quality factor** $Q$ measures how sharp a resonance is: high $Q$ means little damping and a tall, narrow peak. Which has the highest $Q$?`,
              choices: [
                { t: 'A quartz watch crystal, ringing tens of thousands of times before fading', ok: true },
                { t: 'A car’s suspension', why: 'Shock absorbers are designed to damp oscillations quickly: very low Q.' },
                { t: 'A pillow', why: 'A pillow barely oscillates at all: almost all motion is damped immediately.' },
              ],
              explain: r`A quartz crystal can have $Q$ in the tens of thousands or more, so it responds only to a razor-thin range of frequencies. That's what makes quartz watches so accurate. Car suspensions are deliberately low-$Q$ so bumps die away.`,
            },
            {
              type: 'mcq',
              title: 'Shattering glass',
              prompt: r`A trained singer can sometimes shatter a fine crystal wine glass with their voice. What's needed?`,
              choices: [
                { t: 'A loud note held exactly at the glass’s natural frequency, so its vibrations build up until it cracks', ok: true },
                { t: 'The highest note possible', why: 'Height alone doesn’t matter. The note must match the glass’s own natural frequency.' },
                { t: 'Any very loud sound', why: 'Loudness helps, but without matching the natural frequency, the energy doesn’t build up.' },
              ],
              explain: r`Tap the glass to hear its natural "ring". Fine crystal has a high $Q$, so a sustained, loud note at exactly that pitch keeps adding energy until the flexing rim cracks. It's difficult and rare, but it has been demonstrated on camera.`,
            },
            {
              type: 'numeric',
              title: 'How tall is the peak?',
              prompt: r`For light damping, the peak amplitude is about $Q$ times the response to a very slow push, where in this model $Q = \frac{1}{2 \times \text{damping}}$. With damping 0.05, how many times bigger is the resonant response?`,
              unit: '×',
              answer: 10,
              wrong: [{ v: 20, why: r`$Q = \frac{1}{2 \times 0.05}$.` }, { v: 0.1, why: 'The resonant response is bigger, not smaller.' }],
              explain: r`$Q = \frac{1}{0.1} = 10$: pushing at resonance gives about 10 times the displacement that the same force would produce slowly.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Limit the peak',
              prompt: r`An engineer wants a machine mount whose response never exceeds **twice** the slow-push response, whatever the driving frequency. Find the **smallest** damping that achieves this.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2.5, ymin: 0, ymax: 6, grid: 0.5, gridY: 1, height: 260, axes: { xlabel: 'driving ÷ natural frequency', ylabel: 'amplitude' },
                params: { g: { min: 0.1, max: 0.7, step: 0.02, value: 0.12, label: 'damping', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x, p) => amp(x, p.g), color: 'violet', width: 3 }, { f: () => 2, color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`peak amplitude $= ${f2(p.g < 0.707 ? peakAmp(p.g) : 1)}$`,
                goal: (p) => peakAmp(p.g) <= 2 && peakAmp(p.g - 0.02) > 2,
                hint: 'Raise the damping until the top of the curve just drops below the dashed line.',
                solution: { g: 0.26 },
              },
              explain: r`A damping of about 0.26 brings the peak down to 2. More damping lowers it further, but also wastes energy and slows the response, so engineers choose the least that does the job.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'In step or out of step?',
              prompt: r`Drive an oscillator very slowly, and it moves in step with the push. Drive it very fast, and it moves exactly opposite. What's the timing exactly at resonance?`,
              choices: [
                { t: 'The motion lags the push by a quarter cycle (90°), so the push is always in the direction of the velocity', ok: true },
                { t: 'Exactly in step', why: 'In step happens far below resonance. At resonance the displacement lags by a quarter cycle.' },
                { t: 'Exactly opposite', why: 'That happens far above resonance.' },
              ],
              explain: r`At resonance the force is in phase with the **velocity**, so it does positive work all the time, which is exactly why energy builds up so efficiently. The 90° phase shift is how physicists pinpoint a resonance precisely.`,
            },
          ],
          recap: [
            'Driven amplitude peaks near the natural frequency.',
            'Less damping means a taller, narrower peak: higher Q.',
            'High-Q objects respond strongly only to a narrow range of frequencies.',
          ],
        },
      ],
    },
    {
      title: 'Resonance in the World',
      summary: 'Bridges and radios.',
      lessons: [
        {
          id: 'bridges',
          title: 'Wobbly Bridges',
          summary: 'When resonance goes wrong',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              title: 'The Millennium Bridge',
              prompt: r`London's Millennium Footbridge opened in June 2000 and started swaying sideways under crowds of walkers within days. What caused it?`,
              choices: [
                { t: 'Walkers adjusted their steps to the sway, pushing in sync and feeding the oscillation', ok: true },
                { t: 'Strong winds', why: 'The wind that day was moderate. The cause was the people themselves.' },
                { t: 'The bridge was too heavy', why: 'Weight wasn’t the issue. A sideways resonance near walking frequency was.' },
              ],
              explain: r`When we walk, we push slightly sideways with each step, about once per second. The bridge had a sideways natural frequency close to that. As it began to sway, people instinctively matched their steps to the motion, pushing in time and making it worse: **synchronous lateral excitation**. Engineers fixed it by adding dampers, and it reopened in 2002.`,
            },
            {
              type: 'mcq',
              title: 'Tacoma Narrows',
              prompt: r`The Tacoma Narrows Bridge collapsed in 1940 after twisting violently in a 64 km/h wind. It's often called "resonance", but physicists describe it more precisely. What happened?`,
              choices: [
                { t: 'Aeroelastic flutter: the bridge’s own twisting changed the airflow so that the wind pumped energy into it', ok: true },
                { t: 'Gusts arrived exactly at the bridge’s natural frequency', why: 'The wind was fairly steady, not gusting rhythmically. The bridge’s motion itself created the forcing.' },
                { t: 'An earthquake', why: 'There was no earthquake. Wind and the deck’s shape were responsible.' },
              ],
              explain: r`A steady wind doesn't have a frequency to match. Instead, the deck's twisting altered the airflow around it in a way that pushed it further each cycle: a self-excited **flutter** instability, a cousin of resonance. Modern bridge decks are tested in wind tunnels and shaped to avoid it.`,
            },
            {
              type: 'numeric',
              title: 'A sideways rhythm',
              prompt: r`A brisk walker takes 2 steps per second. Each step pushes slightly towards the side of the foot that's landing, so left and right alternate. How many times per second does the sideways push repeat its full pattern?`,
              unit: 'Hz',
              answer: 1,
              wrong: [{ v: 2, why: 'Left and right pushes are in opposite directions, so the full left–right pattern takes two steps.' }],
              explain: r`One full left–right cycle every two steps: 1 Hz. The Millennium Bridge had a sideways mode near 1 Hz, while its vertical modes were safely away from the 2 Hz vertical forcing.`,
            },
            {
              type: 'mcq',
              title: 'Break step!',
              prompt: r`Soldiers are ordered to "break step" when marching across bridges. Why?`,
              choices: [
                { t: 'Marching in perfect step applies a strong rhythmic force that could match a natural frequency of the bridge', ok: true },
                { t: 'To avoid wearing out the road surface', why: 'Wear isn’t the concern: synchronised forcing is.' },
                { t: 'It’s an old superstition with no basis', why: 'In 1831, the Broughton Suspension Bridge near Manchester collapsed under soldiers marching in step.' },
              ],
              explain: r`Random footsteps mostly cancel out; synchronised ones add up. After the Broughton bridge collapse in 1831, the British Army introduced the order to break step on bridges.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Footsteps and sway',
              body: r`A walker pushes sideways once per step, alternately left and right, so the sideways push repeats at **half** the step rate. The Millennium Bridge had a sideways mode at about 1 Hz. Change the walking pace and the damping, and watch the sway.`,
              widget: {
                kind: 'graph', xmin: 1.2, xmax: 2.8, ymin: 0, ymax: 12, grid: false, height: 260, axes: { xlabel: 'steps per second', ylabel: 'sway (relative)', xticks: 0.2, yticks: 2, xAt: 1.2, yAt: 0 },
                params: { f: { min: 1.2, max: 2.8, step: 0.01, value: 1.7, label: 'walking pace', color: 'coral', format: (v) => `${v.toFixed(2)} steps/s` }, z: { min: 0.04, max: 0.3, step: 0.01, value: 0.05, label: 'damping', color: 'teal', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x, p) => { const r = x / 2; return 1 / Math.sqrt((1 - r * r) ** 2 + (2 * p.z * r) ** 2); }, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.f, y: (p) => { const r = p.f / 2; return 1 / Math.sqrt((1 - r * r) ** 2 + (2 * p.z * r) ** 2); }, color: 'coral' }],
                readout: (p) => { const r = p.f / 2, A = 1 / Math.sqrt((1 - r * r) ** 2 + (2 * p.z * r) ** 2); return `sideways push at **${(p.f / 2).toFixed(2)} Hz** · sway **${A.toFixed(1)}×** a slow push`; },
              },
              after: r`Ordinary walking, about 2 steps per second, pushes at exactly 1 Hz: right on the resonance. Worse, people on a swaying deck fall into step with it, feeding it more. The fix was to add dampers: raising the damping flattens the peak, so no pace can build a large sway.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Engineering it out',
              prompt: r`Which of these is **not** a way to protect a structure from resonance?`,
              choices: [
                { t: 'Making it exactly as flexible as the forces acting on it', ok: true },
                { t: 'Shifting its natural frequency away from expected forcing frequencies', why: 'This works: stiffening a structure raises its natural frequency.' },
                { t: 'Adding damping', why: 'This works: damping lowers and widens the resonance peak.' },
              ],
              explain: r`The three real strategies: move the natural frequency (stiffen or add mass), add damping, or add a **tuned mass damper**, an oscillator that soaks up energy at the dangerous frequency. A later lesson in this course explores the last one.`,
            },
          ],
          recap: [
            'Rhythmic forcing near a structure’s natural frequency can cause dangerous oscillations.',
            'The Millennium Bridge wobbled because walkers synchronised with its sway.',
            'Tacoma Narrows failed through aeroelastic flutter, a self-excited instability.',
          ],
        },
        {
          id: 'tuning',
          title: 'Tuning a Radio',
          summary: 'Electrical resonance',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'An electrical swing',
              body: r`A circuit with an inductor ($L$) and a capacitor ($C$) is an electrical oscillator: energy sloshes back and forth between the capacitor's electric field and the inductor's magnetic field. Its natural frequency is
$$f = \frac{1}{2\pi\sqrt{LC}}$$
An antenna picks up signals from thousands of stations at once, but the $LC$ circuit resonates strongly with just one frequency, amplifying that station and ignoring the rest.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the station',
              prompt: r`The tuning circuit has $L = 0.1$ µH. Adjust the capacitor to tune in a station broadcasting at **100 MHz** (within 1 MHz).`,
              widget: {
                kind: 'graph', xmin: 85, xmax: 110, ymin: 0, ymax: 1.15, grid: 5, gridY: 0.25, height: 260, axes: { xlabel: 'frequency (MHz)', ylabel: 'response' },
                params: { C: { min: 18, max: 40, step: 0.5, value: 32, label: 'capacitance', color: 'violet', format: (v) => `${fix(v, 1)} pF` } },
                curves: [{ f: (x, p) => { const f0 = fLC(p.C), q = 60; return 1 / Math.sqrt(1 + (q * (x / f0 - f0 / x)) ** 2); }, color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(100), x2: plot.X(100), y1: plot.Y(0), y2: plot.Y(1.1), stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }), s('text', { x: plot.X(100) + 6, y: plot.Y(1.08), class: 'lbl', text: 'station' })],
                readout: (p) => r`resonant frequency $= \dfrac{1}{2\pi\sqrt{LC}} = ${f2(fLC(p.C))}$ MHz`,
                goal: (p) => Math.abs(fLC(p.C) - 100) < 1,
                hint: 'Lower capacitance means a higher resonant frequency.',
                solution: { C: 25.5 },
              },
              explain: r`Solving $f = \dfrac{1}{2\pi\sqrt{LC}}$ for $C$: $C = \dfrac{1}{4\pi^2 f^2 L} \approx 25$ pF. Turning an old radio's tuning knob rotates the plates of a variable capacitor, sliding the resonance from station to station.`,
            },
            {
              type: 'mcq',
              title: 'How sharp should it be?',
              prompt: r`A radio's tuning circuit could be made with very high $Q$ (an extremely narrow resonance). Why isn't that ideal?`,
              choices: [
                { t: 'A station’s signal occupies a band of frequencies; too narrow a resonance cuts some of it off, while too broad lets neighbouring stations in', ok: true },
                { t: 'High Q circuits are always noisy', why: 'Noise isn’t the problem. The signal itself spans a range of frequencies.' },
                { t: 'There’s no downside: the narrower the better', why: 'Music and speech need a band of frequencies around the carrier; an ultra-narrow filter would strip them away.' },
              ],
              explain: r`An FM station spreads over roughly 200 kHz around its carrier. The tuning circuit's bandwidth, about $f/Q$, must pass that band but reject stations 200 kHz or more away: a classic engineering compromise.`,
            },
            {
              type: 'numeric',
              title: 'Tuning to FM',
              prompt: r`A radio’s tuned circuit resonates at $f = \frac{1}{2\pi\sqrt{LC}}$. With $L = 0.1\ \mu$H, what capacitance tunes it to 100 MHz, in picofarads? (Nearest pF.)`,
              unit: 'pF',
              answer: 1 / (4 * Math.PI ** 2 * 1e16 * 0.1e-6) * 1e12,
              tol: 0.6,
              explain: r`$C = \frac{1}{4\pi^2 f^2 L} = \frac{1}{4\pi^2 \times 10^{16} \times 10^{-7}} \approx 25$ pF. Tiny capacitances like this are why FM tuners are sensitive to stray capacitance, even your hand near the aerial.`,
            },
            {
              type: 'numeric',
              title: 'A tiny circuit',
              prompt: r`An LC circuit has $L = 1\ \mu$H and $C = 100$ pF. Its resonant frequency is $f = \frac{1}{2\pi\sqrt{LC}}$. What is it, in MHz? (1 decimal place.)`,
              unit: 'MHz',
              answer: 1 / (2 * Math.PI * Math.sqrt(1e-6 * 100e-12)) / 1e6,
              tol: 0.1,
              explain: r`$\sqrt{LC} = 10^{-8}$ s, so $f = \frac{1}{2\pi \times 10^{-8}} \approx 15.9$ MHz, in the shortwave radio band.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Quadruple the capacitor',
              prompt: r`If you make the capacitance 4 times larger, by what factor does the resonant frequency change?`,
              unit: '×',
              answer: 0.5,
              wrong: [{ v: 0.25, why: r`$f \propto 1/\sqrt{C}$: 4× the capacitance divides $f$ by $\sqrt4 = 2$.` }, { v: 2, why: 'A larger capacitance gives a lower frequency, not a higher one.' }],
              explain: r`$f \propto \dfrac{1}{\sqrt{C}}$, so $4\times$ the capacitance gives $\dfrac{1}{\sqrt4} = \dfrac12$ the frequency.`,
            },
          ],
          recap: [
            r`An $LC$ circuit resonates at $f = 1/(2\pi\sqrt{LC})$.`,
            'Radios select one station by resonance.',
            r`$f \propto 1/\sqrt{C}$: a bigger capacitor gives a lower frequency.`,
          ],
        },
      ],
    },
    {
      title: 'Taming and Using Resonance',
      summary: 'Dampers, atoms and medical scanners.',
      lessons: [
        {
          id: 'tmd',
          title: 'Tuned Mass Dampers',
          summary: 'A pendulum that protects a skyscraper',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A giant ball',
              body: r`Near the top of Taipei 101, a 508-metre skyscraper, hangs a 660-tonne steel ball on cables. It's a pendulum **tuned** to the same frequency as the building's sway. When wind or an earthquake sets the tower swaying, the ball swings the opposite way, and its hydraulic dampers soak up the energy.

This is a **tuned mass damper**: a small oscillator attached to a big one, designed to steal energy at the dangerous frequency.`,
            },
            {
              type: 'mcq',
              title: 'Why tune it?',
              prompt: r`Why must the damper's natural frequency be close to the building's?`,
              choices: [
                { t: 'Only then does it resonate with the building’s sway and swing strongly enough to absorb lots of energy', ok: true },
                { t: 'So it looks good', why: 'Taipei 101 does display its damper to visitors, but tuning is about physics.' },
                { t: 'It doesn’t matter: any heavy weight helps', why: 'A dead weight just lowers the building’s natural frequency a little. The tuning makes the damper resonate.' },
              ],
              explain: r`A tuned damper is driven at its own resonance by the building, so even a small mass swings with large amplitude, moving opposite to the building and absorbing energy through its dampers.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tune the damper',
              prompt: r`A tower (natural frequency 1, very little damping) is fitted with a damper weighing 5% of the building. Adjust the damper's tuning to make the **highest** peak of the tower's response as low as possible.`,
              widget: {
                kind: 'graph', xmin: 0.6, xmax: 1.4, ymin: 0, ymax: 26, grid: 0.1, gridY: 5, height: 280, axes: { xlabel: 'driving ÷ building’s frequency', ylabel: 'sway amplitude', xAt: 0.6 },
                params: { f: { min: 0.8, max: 1.1, step: 0.01, value: 1.05, label: 'damper tuning', color: 'violet', format: (v) => `${v.toFixed(2)}×` } },
                curves: [
                  { f: (w) => Math.min(26, amp(w, Z1)), color: 'muted', dash: true, width: 1.5 },
                  { f: (w, p) => tmdResponse(p.f, w), color: 'violet', width: 3 },
                ],
                readout: (p) => r`highest peak: $${tmdPeak(p.f).toFixed(2)}$ (without a damper: 25)`,
                goal: (p) => tmdPeak(p.f) < 5.45,
                hint: 'The single peak splits into two. Make them equally tall.',
                solution: { f: 0.95 },
              },
              explain: r`The best tuning is slightly **below** the building's frequency, at about $\frac{1}{1 + 0.05} \approx 0.95$, which makes the two peaks equal. The worst-case sway drops from 25 to about 5.4. This rule was worked out by Jacob Den Hartog in the 1930s.`,
            },
            {
              type: 'numeric',
              title: 'A small fraction',
              prompt: r`Taipei 101 weighs roughly 700,000 tonnes. What percentage of that is its 660-tonne damper? (2 decimal places.)`,
              unit: '%',
              answer: (100 * 660) / 700000,
              tol: 0.005,
              wrong: [{ v: 0.94, tol: 0.01, why: 'Multiply by 100 for a percentage, but check the decimal: 660/700,000 ≈ 0.00094.' }],
              explain: r`$\frac{660}{700{,}000} \approx 0.09\%$. The damper only needs to be heavy enough to swing usefully; most of the damping comes from resonance doing the work. It reduces the building's sway in strong winds by up to about 40%.`,
            },
            {
              type: 'mcq',
              title: 'The bridge fix',
              prompt: r`How was London's wobbly Millennium Footbridge eventually fixed?`,
              choices: [
                { t: 'By adding viscous dampers and dozens of tuned mass dampers under the deck', ok: true },
                { t: 'By banning crowds', why: 'It reopened to crowds in 2002 after the dampers were installed.' },
                { t: 'By making it much heavier', why: 'Added mass alone wouldn’t solve it. Dampers removed the energy.' },
              ],
              explain: r`Engineers fitted 37 viscous dampers and about 50 tuned mass dampers. Crowd tests then showed no significant sway, and the bridge has been steady ever since.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How much better?',
              prompt: r`Without the damper, the tower's peak response was 25. With the best tuning, it's about 5.4. By what factor has the worst-case sway been reduced? (1 decimal place.)`,
              unit: '×',
              answer: 25 / 5.38,
              tol: 0.1,
              wrong: [{ v: 19.6, tol: 0.1, why: 'That’s the difference. The question asks for the ratio.' }],
              explain: r`$\frac{25}{5.4} \approx 4.6$ times smaller, from a damper weighing just 5% of the structure. Tuned mass dampers protect skyscrapers, bridges, chimneys, and even some power lines (the dumbbell-shaped "Stockbridge dampers").`,
            },
          ],
          recap: [
            'A tuned mass damper resonates with the structure and absorbs its energy.',
            'Best tuning: slightly below the structure’s frequency, making two equal peaks.',
            'A small damper can cut the worst-case response several times over.',
          ],
        },
        {
          id: 'atoms',
          title: 'Resonance in Atoms',
          summary: 'From the greenhouse effect to MRI',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Molecules have natural frequencies',
              body: r`Atoms in a molecule are joined by bonds that act like springs, so molecules vibrate at natural frequencies, typically trillions of times a second. Light (or other electromagnetic waves) at exactly those frequencies is **absorbed** strongly, while other frequencies pass straight through.

That's why each gas has its own fingerprint of absorbed colours, and why chemists can identify substances by which infrared frequencies they absorb.`,
            },
            {
              type: 'numeric',
              title: 'Carbon dioxide',
              prompt: r`Carbon dioxide has a bending vibration that absorbs infrared light with a wavelength of 15 μm. What's its frequency, in terahertz ($10^{12}$ Hz)? ($f = c/\lambda$, $c = 3 \times 10^8$ m/s.)`,
              unit: 'THz',
              answer: 20,
              wrong: [{ v: 2e13, relTol: 0.01, why: 'That’s in hertz. Convert to terahertz.' }, { v: 0.02, tol: 0.001, why: 'Convert 15 μm to 1.5 × 10⁻⁵ m.' }],
              explain: r`$\frac{3 \times 10^8}{1.5 \times 10^{-5}} = 2 \times 10^{13}$ Hz $= 20$ THz. The Earth radiates heat strongly near this wavelength, and CO₂ absorbs it: the heart of the greenhouse effect.`,
            },
            {
              type: 'mcq',
              title: 'Microwave ovens',
              prompt: r`A common claim is that microwave ovens work at 2.45 GHz because that's the resonant frequency of water molecules. Is that right?`,
              choices: [
                { t: 'No: water absorbs microwaves over a broad range; 2.45 GHz was chosen for practical reasons like penetration depth and permitted frequency bands', ok: true },
                { t: 'Yes: 2.45 GHz is water’s sharp resonance', why: 'Water’s absorption is broad and peaks at much higher frequencies (tens of GHz).' },
                { t: 'No, microwaves heat only fat', why: 'They heat water very effectively, just not through a sharp resonance.' },
              ],
              explain: r`Water molecules are electric dipoles that try to follow the oscillating field, and friction with neighbours turns that motion into heat (**dielectric heating**). At much higher frequencies, food would absorb the energy in a thin surface layer; at 2.45 GHz it penetrates a few centimetres, and that band is reserved for such uses.`,
            },
            {
              type: 'explain',
              title: 'Magnetic resonance',
              body: r`Protons (hydrogen nuclei) act like tiny spinning magnets. In a strong magnetic field $B$, they wobble (precess) at the **Larmor frequency**:
$$f = 42.58 \text{ MHz per tesla} \times B$$
A radio pulse at exactly that frequency tips them over; as they relax back, they emit radio signals. **MRI** scanners use this nuclear magnetic resonance to map the hydrogen, mostly in water and fat, inside the body.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the scanner',
              prompt: r`A research scanner transmits radio pulses at **127.7 MHz**. What magnetic field strength must it have for protons to resonate?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 7.5, ymin: 0, ymax: 320, grid: 0.5, gridY: 50, height: 260, padL: 48, axes: { xlabel: 'magnetic field (tesla)', ylabel: 'proton frequency (MHz)' },
                params: { B: { min: 0.5, max: 7, step: 0.05, value: 1, slider: false } },
                curves: [{ f: (B) => larmor(B), color: 'violet', width: 3 }, { f: () => 127.7, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.B, y: (p) => larmor(p.B), drag: { x: 'B' }, color: 'coral' }],
                readout: (p) => r`$B = ${p.B.toFixed(2)}$ T: protons resonate at $${larmor(p.B).toFixed(1)}$ MHz`,
                goal: (p) => Math.abs(larmor(p.B) - 127.7) < 1,
                hint: r`$B = \frac{127.7}{42.58}$.`,
                solution: { B: 3 },
              },
              explain: r`$B = \frac{127.7}{42.58} \approx 3.0$ T, about 60,000 times the Earth's magnetic field. Hospital scanners typically use 1.5 T or 3 T, produced by superconducting magnets cooled with liquid helium.`,
            },
            {
              type: 'numeric',
              title: 'A standard scanner',
              prompt: r`At what frequency must a 1.5 T scanner transmit? (1 decimal place.)`,
              unit: 'MHz',
              answer: larmor(1.5),
              tol: 0.06,
              wrong: [{ v: 28.4, tol: 0.1, why: 'Multiply by 42.58, don’t divide.' }],
              explain: r`$42.58 \times 1.5 \approx 63.9$ MHz, in the same range as FM radio, which is why MRI rooms are shielded with copper to keep outside radio signals out.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Making an image',
              prompt: r`Resonance tells an MRI scanner that hydrogen is present, but how does it know **where**?`,
              choices: [
                { t: 'Extra gradient coils make the field slightly stronger at one end, so each position has its own resonant frequency', ok: true },
                { t: 'The patient is moved a millimetre at a time', why: 'That would take far too long. The field itself varies with position.' },
                { t: 'Each organ has a different natural frequency', why: 'It’s the same hydrogen everywhere. The position is encoded by making the field vary across the body.' },
              ],
              explain: r`With a field gradient, frequency maps to position, just like the cochlea mapping frequency to position along its length. Paul Lauterbur and Peter Mansfield shared the 2003 Nobel Prize in Medicine for this idea. (The clicking and banging in a scanner is the gradient coils switching.)`,
            },
          ],
          recap: [
            'Molecules absorb light at their natural vibration frequencies.',
            r`Protons in a field $B$ resonate at $42.58$ MHz per tesla: the basis of MRI.`,
            'Field gradients turn frequency into position to build an image.',
          ],
        },
        {
          id: 'coupled',
          title: 'Coupled Pendulums & Beats',
          summary: 'Energy that swaps back and forth',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Two pendulums, one spring',
              body: r`Hang two identical pendulums side by side and join them with a weak spring. Start one swinging and hold the other still, then let go. Gradually the first one slows to a stop while the second takes over, and then the energy flows back again, over and over.

The system has two **normal modes**: swinging together (the spring never stretches, frequency $f_1$) and swinging opposite (the spring adds force, a slightly higher frequency $f_2$). Starting one pendulum mixes both modes equally, and as they drift in and out of step the energy sloshes between the pendulums.`,
            },
            {
              type: 'numeric',
              title: 'How long to hand over?',
              prompt: r`The motion of the first pendulum is $\cos(2\pi \bar f t)\cos(\pi \Delta f\, t)$, where $\Delta f = f_2 - f_1$. Its swing dies away completely when $\pi \Delta f\, t = \frac{\pi}{2}$. With $f_1 = 1.00$ Hz and $f_2 = 1.05$ Hz, after how many seconds is all the energy in the second pendulum?`,
              unit: 's',
              answer: 10,
              tol: 0.05,
              explain: r`$t = \frac{1}{2\Delta f} = \frac{1}{2 \times 0.05} = 10$ s. After another 10 s it is all back in the first.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tune the coupling',
              prompt: r`A stiffer spring separates the two mode frequencies more. Choose the frequency difference so that the energy passes completely to the second pendulum (violet) in **15 seconds**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: -2.6, ymax: 2.6, grid: false, height: 260, axes: { xticksBelow: true, xlabel: 'time (s)', xticks: 5, yticks: 10, xlabelBelow: 'edge' },
                params: { df: { min: 0.01, max: 0.15, step: 0.0005, value: 0.08, label: 'frequency difference', color: 'teal', format: (v) => `${v.toFixed(4)} Hz` } },
                curves: [{ f: (t, p) => 1.3 + Math.cos(2 * Math.PI * (1 + p.df / 2) * t) * Math.cos(Math.PI * p.df * t), color: 'coral', width: 1.5, n: 1600 }, { f: (t, p) => -1.3 + Math.sin(2 * Math.PI * (1 + p.df / 2) * t) * Math.sin(Math.PI * p.df * t), color: 'violet', width: 1.5, n: 1600 }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(1 / (2 * p.df)), x2: plot.X(1 / (2 * p.df)), y1: plot.Y(-2.5), y2: plot.Y(2.5), stroke: 'var(--teal)', 'stroke-dasharray': '4 4' })],
                readout: (p) => `all energy in the second pendulum after **${(1 / (2 * p.df)).toFixed(1)} s** (dashed line) · full cycle ${(1 / p.df).toFixed(1)} s`,
                goal: (p) => Math.abs(1 / (2 * p.df) - 15) < 0.1,
                hint: r`You need $\frac{1}{2\Delta f} = 15$.`,
                solution: { df: 0.0333 },
              },
              explain: r`$\Delta f = \frac{1}{30} \approx 0.033$ Hz. A weaker spring means a smaller difference and a slower exchange. The same idea, with electrons instead of pendulums, governs energy transfer between molecules and the operation of some quantum gates.`,
            },
            {
              type: 'mcq',
              title: 'Hearing it',
              prompt: r`Two guitar strings meant to play the same note are slightly out of tune. What do you hear when both are plucked together?`,
              choices: [
                { t: 'A regular rise and fall in loudness: beats, at the difference of the two frequencies', ok: true },
                { t: 'Two separate notes', why: 'When the frequencies are very close, the ear hears one note that swells and fades.' },
                { t: 'A note at the sum of the frequencies', why: 'The pitch you hear is the average; the loudness pulses at the difference.' },
              ],
              explain: r`Adding $\cos(2\pi f_1 t)$ and $\cos(2\pi f_2 t)$ gives a tone at the average frequency whose loudness pulses $|f_1 - f_2|$ times per second, the same mathematics as the coupled pendulums.`,
            },
            {
              type: 'numeric',
              title: 'Count the beats',
              prompt: r`A tuning fork at 440 Hz and a string at 443 Hz are sounded together. How many beats per second do you hear?`,
              answer: 3,
              explain: r`$443 - 440 = 3$ beats per second. As the string is brought into tune the beats slow down and finally vanish.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sharp or flat?',
              prompt: r`A string beats 4 times per second against a 440 Hz fork. Tightening the string slightly (which raises its pitch) makes the beats **faster**, 5 per second. What was the string’s original frequency?`,
              unit: 'Hz',
              answer: 444,
              wrong: [{ v: 436, why: 'If it started at 436 Hz, raising the pitch would bring it closer to 440 and slow the beats.' }],
              explain: r`4 beats means 436 or 444 Hz. Raising the pitch moved it **further** from 440, so it must already have been above: **444 Hz**. The string should be loosened.`,
            },
          ],
          recap: [
            'Coupled oscillators have normal modes with slightly different frequencies.',
            'Energy swaps between them, fully after 1/(2Δf).',
            'Two close tones produce beats at the difference frequency.',
          ],
        },
      ],
    },
  ],
};
