const r = String.raw;
const tau = (p) => p.R * p.C * 1e-3; // kΩ × μF → seconds
const fmtHz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(1)} kHz` : `${f.toFixed(0)} Hz`);

const hpCut = (CuF) => 1 / (2 * Math.PI * 10000 * CuF * 1e-6); // R = 10 kΩ
const EPS0 = 8.85e-12;
const DIEL = [['air', 1], ['paper', 3.7], ['glass', 7]];

const rcRipple = (C) => { const R = 100, dt = 2e-5; let v = 1, t = 0, lo = 1, hi = 0; while (t < 0.06) { const sv = Math.abs(Math.sin(2 * Math.PI * 50 * t)); v = sv > v ? sv : v * Math.exp(-dt / (R * C)); if (t > 0.03) { lo = Math.min(lo, v); hi = Math.max(hi, v); } t += dt; } return hi - lo; };
export default {
  id: 'rc',
  subject: 'physics',
  title: 'Capacitors & RC Circuits',
  level: 'Intermediate',
  cover: 'rc',
  tagline: 'Time constants, exponential charging, and the filters inside every speaker and phone.',
  description: r`Put a resistor and a capacitor together and you get a circuit with a sense of time. Watch capacitors charge and discharge exponentially, find the time constant that governs it, see how RC circuits filter high and low frequencies, meet capacitors at work in memory chips, touchscreens and power supplies, and find out how much energy they store and how they're built.`,
  prereq: 'Electricity & Circuits',
  chapters: [
    {
      title: 'Charging and Discharging',
      summary: 'The time constant.',
      lessons: [
        {
          id: 'charging',
          title: 'Charging Up',
          summary: 'The RC time constant',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Filling a capacitor',
              body: r`Connect an empty capacitor $C$ to a battery $V_0$ through a resistor $R$. At first the capacitor offers no opposition, so current flows freely. As charge builds up, the capacitor's voltage pushes back, the current shrinks, and charging slows down. The capacitor's voltage follows
$$V(t) = V_0\left(1 - e^{-t/RC}\right)$$
The product $\tau = RC$ is the **time constant** (ohms × farads = seconds). After one time constant, the capacitor reaches $1 - e^{-1} \approx 63\%$ of the battery voltage.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the timing',
              prompt: r`Choose a resistor and capacitor so that the capacitor reaches 63% of full charge at exactly **2 seconds** (where the dashed lines cross).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1.1, grid: 1, gridY: 0.25, height: 280, axes: { xlabel: 'time (s)', ylabel: 'V / V₀' },
                params: {
                  R: { min: 10, max: 100, step: 10, value: 10, label: 'resistance', color: 'amber', format: (v) => `${v} kΩ` },
                  C: { min: 10, max: 100, step: 10, value: 10, label: 'capacitance', color: 'blue', format: (v) => `${v} μF` },
                },
                curves: [
                  { f: (t, p) => 1 - Math.exp(-t / tau(p)), color: 'violet', width: 3 },
                  { f: () => 1 - Math.exp(-1), color: 'ink', dash: true, width: 1.5 },
                ],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(2), x2: plot.X(2), y1: plot.Y(0), y2: plot.Y(1.1), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' })],
                readout: (p) => r`$\tau = RC = ${p.R}\text{ k}\Omega \times ${p.C}\ \mu\text{F} = ${tau(p).toFixed(2)}$ s`,
                goal: (p) => Math.abs(tau(p) - 2) < 1e-9,
                hint: r`You need $R \times C = 2$ s. With R in kΩ and C in μF, that means $R \times C = 2000$.`,
                solution: { R: 40, C: 50 },
              },
              explain: r`Any pair with $RC = 2$ s works: 40 kΩ × 50 μF, 20 kΩ × 100 μF, and so on. Bigger resistors slow the current; bigger capacitors need more charge. Either way the timing stretches. This is how simple timers (blinking lights, delays) are built.`,
            },
            {
              type: 'numeric',
              title: 'Almost full',
              prompt: r`What percentage of full voltage does a charging capacitor reach after **5** time constants? (1 decimal place.)`,
              unit: '%',
              answer: (1 - Math.exp(-5)) * 100,
              tol: 0.06,
              wrong: [{ v: 100, why: r`It gets very close, but never quite there: $1 - e^{-5}$.` }, { v: 63.2, tol: 0.1, why: 'That’s after one time constant.' }],
              explain: r`$1 - e^{-5} \approx 99.3\%$. In theory a capacitor never quite finishes charging; in practice, engineers treat it as full after about 5 time constants.`,
            },
            {
              type: 'numeric',
              title: 'The first instant',
              prompt: r`A 12 V battery charges an empty capacitor through a 4 kΩ resistor. What current flows at the very first instant, in milliamps?`,
              unit: 'mA',
              answer: 3,
              wrong: [{ v: 0, why: 'At first the empty capacitor has no voltage to push back, so the full 12 V drives current through the resistor.' }, { v: 0.003, tol: 0.0002, why: 'That’s in amps. Convert to milliamps.' }],
              explain: r`$I = \frac{12}{4000} = 3$ mA. The current then decays exponentially with the same time constant, $I = I_0 e^{-t/RC}$, as the capacitor's voltage rises.`,
            },
            {
              type: 'numeric',
              title: 'After one time constant',
              prompt: r`A capacitor charges from 0 towards 9 V through a resistor. What is its voltage after one time constant? (2 decimal places.)`,
              unit: 'V',
              answer: 9 * (1 - Math.exp(-1)),
              tol: 0.01,
              explain: r`$9(1 - e^{-1}) \approx 5.69$ V: 63% of the way. After five time constants it’s over 99% charged.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ready to flash',
              prompt: r`A camera flash charges its capacitor through a resistor with $RC = 1.5$ s, and it is ready once the voltage reaches **90%** of full. How long does that take, in seconds? (1 decimal place.)`,
              unit: 's',
              answer: 1.5 * Math.log(10),
              tol: 0.06,
              wrong: [{ v: 1.5, why: 'After one time constant the capacitor is only 63% charged.' }, { v: 7.5, tol: 0.06, why: 'Five time constants takes it to over 99%. You only need 90%.' }],
              explain: r`Set $1 - e^{-t/RC} = 0.9$, so $e^{-t/RC} = 0.1$ and $t = RC \ln 10 \approx 1.5 \times 2.30 \approx 3.5$ s. Each time constant closes 63% of the remaining gap (63%, 86%, 95%, …), so 90% arrives a little after two of them.`,
            },
          ],
          recap: [
            r`A charging capacitor follows $V = V_0(1 - e^{-t/RC})$.`,
            r`The time constant $\tau = RC$; after $1\tau$ it's at 63%, after $5\tau$ over 99%.`,
            'Larger R or C means slower charging.',
          ],
        },
        {
          id: 'discharging',
          title: 'Letting Go',
          summary: 'Exponential discharge',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'Exponential decay',
              body: r`Disconnect the battery and let the capacitor empty through the resistor. The current is largest at first and shrinks as the voltage falls:
$$V(t) = V_0\, e^{-t/RC}$$
After each time constant, the voltage drops to $e^{-1} \approx 37\%$ of what it was. The same maths describes radioactive decay and cooling coffee: the rate of change is proportional to how much is left.`,
            },
            {
              type: 'numeric',
              title: 'Half-life',
              prompt: r`A 1000 μF capacitor discharges through a 10 kΩ resistor. How long does it take for the voltage to fall to **half**? (In seconds, 1 decimal place.)`,
              unit: 's',
              answer: 10 * Math.LN2,
              tol: 0.06,
              wrong: [{ v: 10, tol: 0.05, why: r`That's the time constant, after which 37% remains. Half remains at $\tau \ln 2$.` }, { v: 5, tol: 0.05, why: r`It isn't linear: solve $e^{-t/\tau} = \frac12$, giving $t = \tau\ln 2$.` }],
              explain: r`$\tau = 10^4 \times 10^{-3} = 10$ s. Setting $e^{-t/10} = \frac12$ gives $t = 10 \ln 2 \approx 6.9$ s. Every 6.9 s after that, the voltage halves again.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Measure the time constant',
              prompt: r`This is a measured discharge curve. Find the time constant by dragging to the moment when the voltage has fallen to **37%** of its starting value.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 1.1, grid: 1, gridY: 0.1, height: 260, axes: { xlabel: 'time (s)', ylabel: 'V / V₀' },
                params: { t: { min: 0, max: 12, step: 0.05, value: 6, slider: false } },
                curves: [{ f: (t) => Math.exp(-t / 3), color: 'violet', width: 3 }, { f: () => Math.exp(-1), color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.t, y: (p) => Math.exp(-p.t / 3), drag: { x: 't' }, color: 'teal' }],
                readout: (p) => r`$t = ${p.t.toFixed(2)}$ s: $V/V_0 = ${Math.exp(-p.t / 3).toFixed(3)}$`,
                goal: (p) => Math.abs(p.t - 3) < 0.05,
                hint: r`37% is $e^{-1} \approx 0.368$: where does the curve cross the dashed line?`,
                solution: { t: 3 },
              },
              explain: r`It reaches 37% at $t = 3$ s, so $\tau = RC = 3$ s. If you know $R$, this measures $C$, which is how many multimeters measure capacitance.`,
            },
            {
              type: 'numeric',
              title: 'Energy left',
              prompt: r`A capacitor's stored energy is $\tfrac12 CV^2$. When its voltage has fallen to half, what fraction of its energy remains?`,
              answer: 0.25,
              wrong: [{ v: 0.5, why: 'Energy goes as V²: (½)² = ¼.' }],
              explain: r`$\left(\frac12\right)^2 = \frac14$. Energy drains twice as fast as voltage: it decays with time constant $\frac{RC}{2}$.`,
            },
            {
              type: 'numeric',
              title: 'The first rush',
              prompt: r`A capacitor charged to 9 V starts discharging through a 1 kΩ resistor. What is the current at the very first instant, in milliamps?`,
              unit: 'mA',
              answer: 9,
              explain: r`At first the full 9 V is across the resistor: $I = \frac{9}{1000} = 9$ mA. The current then decays with the same time constant as the voltage.`,
            },
            {
              type: 'mcq',
              title: 'Leaky memory',
              prompt: r`Your computer's main memory (DRAM) stores each bit as charge on a tiny capacitor, which slowly leaks away. What does the computer do about it?`,
              choices: [
                { t: 'It reads and rewrites every bit many times per second, typically refreshing all of memory every 64 milliseconds', ok: true },
                { t: 'Nothing: the charge never leaks fast enough to matter', why: 'The capacitors are so tiny that charge leaks away in a fraction of a second. Without refreshing, data would vanish.' },
                { t: 'It stores each bit in thousands of capacitors', why: 'That would waste space. Instead, each bit is periodically refreshed.' },
              ],
              explain: r`That's the "dynamic" in Dynamic RAM: constant refreshing. It's also why memory loses its contents when the power is cut, unlike flash memory, which traps charge behind an insulating layer for years.`,
            },
          ],
          recap: [
            r`A discharging capacitor follows $V = V_0 e^{-t/RC}$.`,
            r`It halves every $\tau \ln 2 \approx 0.69\,\tau$.`,
            'DRAM must refresh its leaky capacitors constantly.',
          ],
        },
      ],
    },
    {
      title: 'Capacitors and Frequency',
      summary: 'Filters and everyday uses.',
      lessons: [
        {
          id: 'filters',
          title: 'Filters',
          summary: 'Passing lows, blocking highs',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Capacitors and AC',
              body: r`A capacitor blocks steady (DC) current once it's charged, but alternating current keeps charging and discharging it, so AC gets through. The faster the alternation, the more easily it passes. The capacitor's opposition to AC, its **reactance**, is
$$X_C = \frac{1}{2\pi f C}$$
large at low frequencies, small at high frequencies.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A low-pass filter',
              body: r`A resistor followed by a capacitor to ground forms a **low-pass filter**: high frequencies leak away through the capacitor, low frequencies pass. The **cutoff frequency** $f_c = \frac{1}{2\pi RC}$ marks the changeover. Change the capacitor (with $R = 1$ kΩ).`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 5, ymin: 0, ymax: 1.1, grid: 1, gridY: 0.25, height: 280, padL: 48,
                axes: { xlabel: 'frequency', ylabel: 'output', xfmt: (v) => ['', '10 Hz', '100 Hz', '1 kHz', '10 kHz', '100 kHz'][Math.round(v)] ?? '' },
                params: { C: { min: 0.01, max: 1, step: 0.01, value: 0.1, label: 'capacitance', color: 'blue', format: (v) => `${v.toFixed(2)} μF` } },
                curves: [{ f: (lg, p) => 1 / Math.sqrt(1 + (10 ** lg * 2 * Math.PI * 1000 * p.C * 1e-6) ** 2), color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const fc = 1 / (2 * Math.PI * 1000 * p.C * 1e-6), x = Math.log10(fc);
                  return x > 1 && x < 5 ? [s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(0), y2: plot.Y(Math.SQRT1_2), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }), s('circle', { cx: plot.X(x), cy: plot.Y(Math.SQRT1_2), r: 6, class: 'fl-coral' })] : [];
                },
                readout: (p) => `cutoff frequency **${fmtHz(1 / (2 * Math.PI * 1000 * p.C * 1e-6))}**`,
              },
              after: r`Below the cutoff, signals pass almost unchanged; above it, they're increasingly suppressed. Swap the resistor and capacitor and you get a **high-pass** filter. Speakers use such pairs (crossovers) to send bass to the big woofer and treble to the small tweeter.`,
            },
            {
              type: 'numeric',
              title: 'Find the cutoff',
              prompt: r`What is the cutoff frequency of a low-pass filter with $R = 1$ kΩ and $C = 0.1\ \mu$F? (Nearest whole number of hertz.)`,
              unit: 'Hz',
              answer: Math.round(1 / (2 * Math.PI * 1000 * 1e-7)),
              tol: 2,
              wrong: [{ v: 10000, tol: 10, why: r`That's $\frac{1}{RC}$. Divide by $2\pi$ as well.` }],
              explain: r`$f_c = \frac{1}{2\pi \times 1000 \times 10^{-7}} \approx 1592$ Hz. Treble above this is softened, which is how a simple tone control works.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Block the rumble',
              prompt: r`A **high-pass** filter (capacitor first, then a 10 kΩ resistor) can remove low-frequency rumble from a microphone signal. Choose $C$ so that the cutoff is **100 Hz**.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 5, ymin: 0, ymax: 1.1, grid: 1, gridY: 0.25, height: 260, padL: 48,
                axes: { xlabel: 'frequency', ylabel: 'output', xfmt: (v) => ['', '10 Hz', '100 Hz', '1 kHz', '10 kHz', '100 kHz'][Math.round(v)] ?? '' },
                params: { C: { min: 0.01, max: 1, step: 0.001, value: 0.5, label: 'capacitance', color: 'blue', format: (v) => `${v.toFixed(3)} μF` } },
                curves: [{ f: (lg, p) => { const x = 10 ** lg / hpCut(p.C); return x / Math.sqrt(1 + x * x); }, color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(2), x2: plot.X(2), y1: plot.Y(0), y2: plot.Y(1.05), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' })],
                readout: (p) => `cutoff frequency **${fmtHz(hpCut(p.C))}**`,
                goal: (p) => Math.abs(hpCut(p.C) - 100) < 2,
                hint: r`$C = \frac{1}{2\pi R f_c} = \frac{1}{2\pi \times 10^4 \times 100}$.`,
                solution: { C: 0.159 },
              },
              explain: r`$C = \frac{1}{2\pi \times 10{,}000 \times 100} \approx 0.16\ \mu$F. Low frequencies (wind, handling noise, mains hum at 50 Hz) are now reduced, while voices, mostly above 100 Hz, pass through.`,
            },
            {
              type: 'numeric',
              title: 'Ten times the cutoff',
              prompt: r`Well above its cutoff, a simple RC low-pass filter passes amplitude roughly in proportion to $\frac{f_c}{f}$. At ten times the cutoff frequency, how many decibels is that ($20\log_{10}$ of the amplitude ratio)?`,
              unit: 'dB',
              answer: -20,
              explain: r`$20\log_{10}(0.1) = -20$ dB: the filter "rolls off" at 20 dB per decade. Steeper filters chain several RC stages together.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'At the cutoff',
              prompt: r`At the cutoff frequency, the output amplitude of an RC filter is $\frac{1}{\sqrt2}$ of the input. As a decimal, what fraction of the input **power** gets through? (Power goes as amplitude squared.)`,
              answer: 0.5,
              wrong: [{ v: 0.707, tol: 0.01, why: 'That’s the amplitude. Square it for power.' }],
              explain: r`$\left(\frac{1}{\sqrt2}\right)^2 = \frac12$: half the power. That's why the cutoff is also called the **half-power** or "−3 dB" point ($10\log_{10}\frac12 \approx -3$).`,
            },
          ],
          recap: [
            r`Capacitor reactance $X_C = 1/(2\pi f C)$: high for low frequencies.`,
            r`An RC low-pass filter has cutoff $f_c = 1/(2\pi RC)$.`,
            'Filters split sound between speakers and shape tone.',
          ],
        },
        {
          id: 'uses',
          title: 'Capacitors at Work',
          summary: 'Smoothing, sensing and storing',
          icon: 'hand',
          steps: [
            {
              type: 'mcq',
              title: 'Smoothing',
              prompt: r`A phone charger converts mains AC into DC. After rectifying, the voltage still has bumps 100 or 120 times per second. Why is a large capacitor added?`,
              choices: [
                { t: 'It charges at each peak and supplies current in between, smoothing out the dips', ok: true },
                { t: 'It raises the voltage', why: 'It doesn’t boost the voltage. It acts as a short-term reservoir between peaks.' },
                { t: 'It converts AC to DC by itself', why: 'Diodes do the rectifying. The capacitor smooths what’s left.' },
              ],
              explain: r`The capacitor acts like a water tower: it fills at each peak and drains a little between them. The larger $RC$ is compared with the gap between peaks, the smaller the leftover "ripple".`,
            },
            {
              type: 'mcq',
              title: 'Touchscreens',
              prompt: r`How does your phone's touchscreen detect your finger?`,
              choices: [
                { t: 'Your finger changes the capacitance of a grid of transparent electrodes, which the phone measures', ok: true },
                { t: 'It detects the pressure of your finger', why: 'That’s how old resistive screens worked. Modern screens respond even to a feather-light touch, because they sense capacitance.' },
                { t: 'It detects the heat of your finger', why: 'Heat isn’t involved. That’s why a gloved finger doesn’t work but a special conductive stylus does.' },
              ],
              explain: r`A fine grid of transparent electrodes forms many tiny capacitors. Your body is a conductor, so a nearby finger alters the electric field and the measured capacitance at that spot. The phone scans the grid many times per second to locate multiple fingers. It's also why touchscreens don't respond to ordinary gloves.`,
            },
            {
              type: 'numeric',
              title: 'Defibrillator',
              prompt: r`A defibrillator stores 200 J in a capacitor charged to 2000 V. What's its capacitance, in microfarads? ($E = \tfrac12 CV^2$.)`,
              unit: 'μF',
              answer: 100,
              wrong: [{ v: 50, why: r`$C = \frac{2E}{V^2} = \frac{400}{4 \times 10^6}$.` }, { v: 0.0001, tol: 0.00001, why: 'That’s in farads. Convert to microfarads.' }],
              explain: r`$C = \frac{2 \times 200}{2000^2} = 10^{-4}$ F $= 100\ \mu$F. A capacitor can dump its energy through the patient's chest in a few milliseconds, far faster than a battery could.`,
            },
            {
              type: 'numeric',
              title: 'Supercapacitor',
              prompt: r`A supercapacitor rated at 3000 F and 2.7 V stores energy $\tfrac12 CV^2$. How many kilojoules is that? (1 decimal place.)`,
              unit: 'kJ',
              answer: (0.5 * 3000 * 2.7 ** 2) / 1000,
              tol: 0.06,
              wrong: [{ v: (3000 * 2.7 ** 2) / 1000, tol: 0.06, why: r`Don't forget the $\tfrac12$.` }, { v: (0.5 * 3000 * 2.7) / 1000, tol: 0.06, why: r`Square the voltage: $V^2 = 2.7^2$.` }],
              explain: r`$\tfrac12 \times 3000 \times 2.7^2 \approx 10{,}900$ J $\approx 10.9$ kJ, about as much as a single AA battery holds, in a can far bigger and heavier. Supercapacitors store less energy than batteries but can deliver it extremely fast and survive millions of cycles, so they're used to capture braking energy in buses and trams.`,
            },
            {
              type: 'interactive',
              title: 'Smoothing the ripple',
              body: r`A rectifier turns mains into humps (grey) peaking 100 times a second. A capacitor across a 100 Ω load charges at each peak and slowly discharges between them (violet). Find the **smallest** capacitor, in steps of 100 µF, that keeps the ripple within **5%** of the peak.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.04, ymin: 0, ymax: 1.1, grid: false, height: 260, axes: { xlabel: 'time (s)', ylabel: 'voltage (fraction of peak)', xticks: 0.01, yticks: 0.25 },
                params: { C: { min: 100, max: 4000, step: 100, value: 500, label: 'capacitor', color: 'violet', format: (v) => `${v} µF` } },
                curves: [{ f: (t) => Math.abs(Math.sin(2 * Math.PI * 50 * t)), color: 'muted', dash: true, n: 400 }],
                extra: ({ plot, p, s }) => { const C = p.C * 1e-6, dt = 2e-5; let v = 0, d = ''; for (let t = 0; t <= 0.04; t += dt) { const sv = Math.abs(Math.sin(2 * Math.PI * 50 * t)); v = sv > v ? sv : v * Math.exp(-dt / (100 * C)); d += (d ? 'L' : 'M') + plot.X(t).toFixed(1) + ' ' + plot.Y(v).toFixed(1); } return [s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 })]; },
                readout: (p) => `ripple **${(100 * rcRipple(p.C * 1e-6)).toFixed(1)}%** of the peak · time constant RC = ${(100 * p.C * 1e-6 * 1000).toFixed(0)} ms`,
                goal: (p) => rcRipple(p.C * 1e-6) <= 0.05 && rcRipple((p.C - 100) * 1e-6) > 0.05,
                hint: 'The ripple is roughly the gap (10 ms) divided by the time constant RC.',
                solution: { C: 1800 },
              },
              explain: r`About **1,800 µF**: the time constant $RC = 0.18$ s is about 18 times the 10 ms gap, so the voltage sags only about 5% before the next peak tops it up. Bigger loads (smaller $R$) need bigger capacitors, which is why power supplies contain those large cylindrical cans.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three time constants',
              prompt: r`A capacitor charging through a resistor reaches $1 - e^{-t/RC}$ of its final voltage. After three time constants ($t = 3RC$), what percentage is that? (1 decimal place.)`,
              unit: '%',
              answer: 100 * (1 - Math.exp(-3)),
              tol: 0.06,
              explain: r`$1 - e^{-3} \approx 0.950$: **95.0%**. Engineers treat 5 time constants (99.3%) as "fully charged". With $R = 10$ kΩ and $C = 100\ \mu$F, $RC = 1$ s.`,
            },
          ],
          recap: [
            'Capacitors smooth rectified DC by storing charge between peaks.',
            'Touchscreens sense the capacitance change caused by a finger.',
            'Supercapacitors deliver energy quickly and last for millions of cycles.',
          ],
        },
      ],
    },
    {
      title: 'Inside the Capacitor',
      summary: 'Stored energy and how capacitors are built.',
      lessons: [
        {
          id: 'energy',
          title: 'Energy in Capacitors',
          summary: 'The area under the line',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Charging costs more and more',
              body: r`A capacitor's charge is proportional to its voltage, $Q = CV$. Adding each extra bit of charge means pushing it against the voltage already there, so later charges cost more energy than earlier ones.

On a graph of voltage against charge, the energy stored is the **area under the line**: a triangle with area
$$E = \tfrac12 QV = \tfrac12 CV^2$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Store half a joule',
              prompt: r`A 100 μF capacitor is charged to a voltage you choose. The shaded triangle is the stored energy. Charge it so it stores exactly **0.5 J**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 22, ymin: 0, ymax: 220, grid: 2, gridY: 20, height: 260, padL: 48, axes: { xlabel: 'charge (mC)', ylabel: 'voltage (V)' },
                params: { V: { min: 0, max: 200, step: 5, value: 50, label: 'voltage', color: 'violet', format: (v) => `${v} V` } },
                curves: [{ f: (q) => q * 10, color: 'ink', width: 2 }],
                extra: ({ plot, p, s }) => {
                  const Q = p.V / 10; // mC, since C = 0.1 mF
                  return [s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(Q)} ${plot.Y(0)} L${plot.X(Q)} ${plot.Y(p.V)} Z`, class: 'fl-amber', opacity: 0.55 })];
                },
                readout: (p) => r`$Q = CV = ${(p.V / 10).toFixed(1)}$ mC, $\;E = \tfrac12 CV^2 = ${(0.5e-4 * p.V * p.V).toFixed(3)}$ J`,
                goal: (p) => Math.abs(0.5e-4 * p.V * p.V - 0.5) < 1e-9,
                hint: r`Solve $\tfrac12 \times 10^{-4} \times V^2 = 0.5$.`,
                solution: { V: 100 },
              },
              explain: r`$V^2 = 10^4$, so $V = 100$ V. Doubling the voltage would quadruple the energy: the triangle doubles in both width and height.`,
            },
            {
              type: 'numeric',
              title: 'Where did it go?',
              prompt: r`A battery of voltage $V$ moves charge $Q = CV$ onto a capacitor, doing work $QV = CV^2$. But the capacitor ends up storing only $\tfrac12 CV^2$. What fraction of the battery's energy was turned into heat in the resistor?`,
              answer: 0.5,
              wrong: [{ v: 0, why: 'The battery supplied CV², but only ½CV² is stored.' }],
              explain: r`Exactly **half**, whatever the resistance! A bigger resistor gives a smaller current for longer; the total heat comes out the same. (Charging gradually, by raising the voltage slowly, can avoid most of this loss.)`,
            },
            {
              type: 'mcq',
              title: 'Capacitor or battery?',
              prompt: r`Why don't electric cars use capacitors instead of batteries?`,
              choices: [
                { t: 'Capacitors store far less energy per kilogram, although they can charge and discharge much faster', ok: true },
                { t: 'Capacitors can’t store energy for more than a second', why: 'Good capacitors hold charge for hours or longer; the issue is how little energy they hold.' },
                { t: 'Capacitors only work with AC', why: 'Capacitors store DC charge perfectly well.' },
              ],
              explain: r`A lithium-ion battery stores roughly 100 times more energy per kilogram than a supercapacitor. But capacitors charge in seconds and survive millions of cycles, so they complement batteries, handling quick bursts of power.`,
            },
            {
              type: 'numeric',
              title: 'A supercapacitor',
              prompt: r`How much energy does a 1 F capacitor store at 5 V ($E = \frac12 CV^2$), in joules?`,
              unit: 'J',
              answer: 12.5,
              tol: 0.01,
              explain: r`$\frac12 \times 1 \times 25 = 12.5$ J, enough to keep a small clock running for days, but a phone battery stores several thousand times more.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sharing charge',
              prompt: r`A charged capacitor is connected to an identical empty one. The charge shares out equally, so each ends up at half the original voltage. What fraction of the original stored energy remains in the pair?`,
              answer: 0.5,
              wrong: [{ v: 1, why: r`Each capacitor has $\tfrac12 C\left(\frac V2\right)^2 = \frac18 CV^2$; together, $\frac14 CV^2$.` }, { v: 0.25, why: 'That’s for one capacitor. There are two.' }],
              explain: r`Two capacitors at $V/2$ store $2 \times \tfrac12 C\frac{V^2}{4} = \tfrac14 CV^2$: **half** the original $\tfrac12 CV^2$. Charge is conserved, but energy isn't: the rest becomes heat and radiation in the connecting wires, however thin or thick they are.`,
            },
          ],
          recap: [
            r`Stored energy $E = \tfrac12 CV^2$: the area under the voltage–charge line.`,
            'Charging from a battery wastes half the energy as heat.',
            'Capacitors hold far less energy than batteries but deliver it fast.',
          ],
        },
        {
          id: 'build',
          title: 'Building Capacitors',
          summary: 'Plates, gaps and combinations',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Two plates',
              body: r`The simplest capacitor is two metal plates of area $A$, separated by a gap $d$ filled with an insulator. Its capacitance is
$$C = \frac{\varepsilon_0 \varepsilon_r A}{d}$$
where $\varepsilon_0 = 8.85 \times 10^{-12}$ F/m and $\varepsilon_r$ is the insulator's **dielectric constant** (1 for air, about 3.7 for paper, about 7 for glass). Bigger plates, a thinner gap or a better dielectric all increase $C$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Plates and gaps',
              body: r`Change the plate area, the gap and the material between the plates.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 220,
                params: {
                  A: { min: 10, max: 200, step: 10, value: 100, label: 'area', color: 'blue', format: (v) => `${v} cm²` },
                  d: { min: 0.1, max: 2, step: 0.1, value: 1, label: 'gap', color: 'coral', format: (v) => `${v.toFixed(1)} mm` },
                  k: { min: 0, max: 2, step: 1, value: 0, label: 'material', color: 'teal', format: (v) => DIEL[v][0] },
                },
                extra: ({ plot, p, s }) => {
                  const w = 1 + (p.A / 200) * 7, gap = 0.4 + p.d * 1.5, x0 = 5 - w / 2;
                  return [
                    s('rect', { x: plot.X(x0), y: plot.Y(3 + gap / 2), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(gap), class: ['fl-surface', 'fl-amber-soft', 'fl-teal-soft'][p.k] }),
                    s('rect', { x: plot.X(x0), y: plot.Y(3 + gap / 2 + 0.25), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(0.25), class: 'fl-coral' }),
                    s('rect', { x: plot.X(x0), y: plot.Y(3 - gap / 2), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(0.25), class: 'fl-blue' }),
                  ];
                },
                readout: (p) => {
                  const C = (EPS0 * DIEL[p.k][1] * p.A * 1e-4) / (p.d * 1e-3);
                  return r`$C = \dfrac{\varepsilon_0 \times ${DIEL[p.k][1].toFixed(1)} \times ${p.A}\text{ cm}^2}{${p.d.toFixed(1)}\text{ mm}} = ${(C * 1e12).toFixed(0)}$ pF`;
                },
              },
              after: r`Even big plates give only hundreds of picofarads. Practical capacitors roll up long strips of foil with thin insulating film between them, giving huge areas and tiny gaps in a small can.`,
            },
            {
              type: 'numeric',
              title: 'Halve the gap',
              prompt: r`A capacitor's plates are pushed to half their original separation. By what factor does its capacitance change?`,
              unit: '×',
              answer: 2,
              wrong: [{ v: 0.5, why: r`$C \propto \frac{1}{d}$: a smaller gap means **more** capacitance.` }, { v: 4, why: 'The gap appears to the first power, not squared.' }],
              explain: r`$C \propto \frac1d$, so halving $d$ doubles $C$. Some keyboards and microphones work this way: pressing a key or a sound wave moves a plate, changing the capacitance.`,
            },
            {
              type: 'explain',
              title: 'Combining capacitors',
              body: r`Capacitors combine the **opposite** way to resistors:
- In **parallel**, the plates effectively join into bigger plates: $C = C_1 + C_2$.
- In **series**, the gaps effectively add up: $\frac1C = \frac{1}{C_1} + \frac{1}{C_2}$.`,
            },
            {
              type: 'numeric',
              title: 'In series',
              prompt: r`What is the total capacitance of a 6 μF and a 3 μF capacitor connected in series?`,
              unit: 'μF',
              answer: 2,
              wrong: [{ v: 9, why: 'That’s the parallel combination. In series, add the reciprocals.' }, { v: 4.5, why: r`$\frac{1}{C} = \frac16 + \frac13 = \frac12$.` }],
              explain: r`$\frac1C = \frac16 + \frac13 = \frac12$, so $C = 2\ \mu$F: smaller than either one, just as series resistors give more than either.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A paper capacitor',
              prompt: r`Two strips of foil, each 2 m long and 5 cm wide, are separated by paper 0.05 mm thick ($\varepsilon_r = 3.7$). What's the capacitance, in nanofarads? (Nearest whole number.)`,
              unit: 'nF',
              answer: Math.round((EPS0 * 3.7 * 2 * 0.05) / 0.05e-3 * 1e9),
              tol: 1,
              wrong: [{ v: Math.round((EPS0 * 2 * 0.05) / 0.05e-3 * 1e9), tol: 1, why: 'Include the dielectric constant of paper, 3.7.' }],
              hint: r`$A = 2 \times 0.05 = 0.1$ m², $d = 5 \times 10^{-5}$ m.`,
              explain: r`$C = \frac{8.85 \times 10^{-12} \times 3.7 \times 0.1}{5 \times 10^{-5}} \approx 65$ nF. Rolled into a cylinder, such a strip fits in your palm: that's how early radio capacitors were made.`,
            },
          ],
          recap: [
            r`Parallel plates: $C = \varepsilon_0\varepsilon_r A / d$.`,
            'Bigger area, smaller gap or a dielectric increase capacitance.',
            r`Parallel: $C_1 + C_2$. Series: $1/C = 1/C_1 + 1/C_2$.`,
          ],
        },
        {
          id: 'timer',
          title: 'The 555 Timer',
          summary: 'A capacitor that blinks',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Charging between two thresholds',
              body: r`The 555 timer chip (1971) is one of the most-made integrated circuits ever. In its **astable** mode it switches on and off forever, using a capacitor $C$ and two resistors $R_1$ and $R_2$:
- the capacitor charges through $R_1 + R_2$ until it reaches $\frac23$ of the supply voltage;
- the chip then discharges it through $R_2$ alone until it falls to $\frac13$;
- and repeats.

Each stage lasts $\ln 2 \approx 0.693$ time constants, so the frequency is
$$f = \frac{1}{0.693\,(R_1 + 2R_2)\,C} \approx \frac{1.44}{(R_1 + 2R_2)\,C}.$$`,
            },
            {
              type: 'numeric',
              title: 'How fast does it tick?',
              prompt: r`With $R_1 = 1$ kΩ, $R_2 = 10$ kΩ and $C = 10$ µF, what is the frequency in hertz? (2 decimal places.)`,
              unit: 'Hz',
              answer: 1.44 / (21000 * 10e-6),
              tol: 0.03,
              explain: r`$f = \frac{1.44}{(1000 + 20{,}000) \times 10^{-5}} = \frac{1.44}{0.21} \approx 6.86$ Hz: about seven blinks a second.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Blink once a second',
              prompt: r`With $C = 100$ µF and $R_1 = 1$ kΩ, choose $R_2$ so the LED blinks at exactly **1 Hz**. The curve shows the capacitor voltage (as a fraction of the supply) bouncing between $\frac13$ and $\frac23$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'time (s)', ylabel: 'capacitor voltage ÷ supply', xticks: 0.5, yticks: 1 / 3, yfmt: (v) => ['0', '⅓', '⅔', '1'][Math.round(v * 3)] },
                params: { R2: { min: 1, max: 20, step: 0.05, value: 4, label: 'R₂', color: 'violet', format: (v) => `${v.toFixed(2)} kΩ` } },
                curves: [{ f: (t, p) => { const C = 100e-6, tc = (1000 + p.R2 * 1000) * C, td = p.R2 * 1000 * C, Tc = 0.6931 * tc, Td = 0.6931 * td, ph = t % (Tc + Td); return ph < Tc ? 1 - (2 / 3) * Math.exp(-ph / tc) : (2 / 3) * Math.exp(-(ph - Tc) / td); }, color: 'violet', width: 2.5, n: 900 }, { f: () => 2 / 3, color: 'muted', dash: true }, { f: () => 1 / 3, color: 'muted', dash: true }],
                readout: (p) => { const f = 1.44 / ((1000 + 2000 * p.R2) * 100e-6); return `frequency **${f.toFixed(3)} Hz** · on for ${(0.693 * (1000 + 1000 * p.R2) * 100).toFixed(0)} ms, off for ${(0.693 * 1000 * p.R2 * 100).toFixed(0)} ms`; },
                goal: (p) => Math.abs(1.44 / ((1000 + 2000 * p.R2) * 100e-6) - 1) < 0.01,
                hint: r`Solve $1000 + 2R_2 = \frac{1.44}{100 \times 10^{-6}} = 14{,}400$.`,
                solution: { R2: 6.7 },
              },
              explain: r`$R_2 = \frac{14{,}400 - 1000}{2} = 6.7$ kΩ. Change $C$ to 10 µF and the same resistors blink 10 times faster. That simple scaling made the 555 the default way to make blinkers, buzzers and pulse generators.`,
            },
            {
              type: 'mcq',
              title: 'Where does ln 2 come from?',
              prompt: r`While charging, the capacitor heads exponentially towards the full supply voltage, starting from $\frac13$. Why does it take exactly $\ln 2$ time constants to reach $\frac23$?`,
              choices: [
                { t: r`The remaining gap to full voltage halves, from $\frac23$ to $\frac13$, and halving takes $\ln 2$ time constants`, ok: true },
                { t: r`Because $\frac23$ is twice $\frac13$`, why: r`Close, but what matters is the gap to the target voltage, which halves from $\frac23$ to $\frac13$.` },
                { t: 'It is a property of the chip’s transistors', why: 'It comes purely from exponential charging between the two thresholds.' },
              ],
              explain: r`Exponential charging shrinks the gap to the target by a factor $e$ every time constant, so halving it takes $\ln 2 \approx 0.693$ time constants. Discharging from $\frac23$ to $\frac13$ is also a halving.`,
            },
            {
              type: 'numeric',
              title: 'On for how long?',
              prompt: r`The output is "on" while the capacitor charges. For the 1 Hz blinker ($R_1 = 1$ kΩ, $R_2 = 6.7$ kΩ), the fraction of time it is on (the **duty cycle**) is $\frac{R_1 + R_2}{R_1 + 2R_2}$. What percentage is that? (Nearest whole number.)`,
              unit: '%',
              answer: (7.7 / 14.4) * 100,
              tol: 0.6,
              explain: r`$\frac{7.7}{14.4} \approx 53\%$. The charging path includes $R_1$, so "on" always lasts a little longer than "off"; a small $R_1$ keeps the duty cycle close to 50%.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A quick pulse',
              prompt: r`With $R_1 = R_2 = 10$ kΩ and $C = 1$ µF, how long (in milliseconds) does each charging stage last? (1 decimal place.)`,
              unit: 'ms',
              answer: 0.6931 * 20000 * 1e-6 * 1000,
              tol: 0.1,
              explain: r`$0.693 \times (10 + 10)\ \text{k}\Omega \times 1\ \mu\text{F} = 0.693 \times 0.02 = 0.0139$ s, about **13.9 ms**. The discharge takes half as long (6.9 ms), so the frequency is about 48 Hz.`,
            },
          ],
          recap: [
            'The 555 charges a capacitor between ⅓ and ⅔ of the supply voltage.',
            'Each stage lasts ln 2 ≈ 0.693 time constants.',
            'Astable frequency f ≈ 1.44 / ((R₁ + 2R₂)C).',
          ],
        },
      ],
    },
  ],
};
