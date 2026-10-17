import { fix } from '../lib/svg.js';

const r = String.raw;
const f2 = (v) => (Math.round(v * 100) / 100).toString();

const PREFIXES = {
  '-9': ['nano', 'n', '1 nm: about half the width of a DNA molecule'],
  '-6': ['micro', 'µ', '1 µm: about the size of a small bacterium'],
  '-3': ['milli', 'm', '1 mm: the thickness of a credit card (roughly)'],
  0: ['', '', '1 m: about a long stride'],
  3: ['kilo', 'k', '1 km: a 12-minute walk'],
  6: ['mega', 'M', '1 Mm = 1,000 km: about the length of Great Britain'],
  9: ['giga', 'G', '1 Gm = 1 million km: about 2.6 × the distance to the Moon'],
};

export default {
  id: 'units',
  subject: 'physics',
  title: 'Units & Scaling',
  level: 'Foundational',
  cover: 'units',
  tagline: 'SI units, conversions, dimensions, temperature, scaling and honest measurement.',
  description: r`Every measurement is a number **and** a unit. Learn the SI system and its prefixes, convert units without mistakes, check formulas using dimensions alone, convert between temperature scales, discover why giants can't exist, and see how scientists report measurements honestly with significant figures and uncertainties.`,
  prereq: 'Powers & Roots',
  chapters: [
    {
      title: 'Units',
      summary: 'Numbers with meaning.',
      lessons: [
        {
          id: 'si',
          title: 'The SI System',
          summary: 'Base units and prefixes',
          icon: 'book',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A costly mix-up',
              prompt: r`In 1999, NASA's Mars Climate Orbiter flew too close to Mars and was lost. What caused it?`,
              choices: [
                { t: 'One team’s software used US customary units, and another team expected metric', ok: true },
                { t: 'A meteoroid strike', why: 'Nothing hit it. The cause was a bookkeeping error back on Earth.' },
                { t: 'The engine ran out of fuel', why: 'The engine worked as commanded. The commands themselves were based on the wrong numbers.' },
              ],
              explain: r`One piece of ground software reported thruster impulse in **pound-force seconds**, while the navigation software expected **newton-seconds**: a factor of about 4.45. The small errors added up over months, and the probe hit the atmosphere. A number without a clear unit is an accident waiting to happen.`,
            },
            {
              type: 'explain',
              title: 'Seven base units',
              body: r`Science uses the **International System of Units (SI)**. Every unit is built from seven base units:

| Quantity | Unit | Symbol |
|---|---|---|
| length | metre | m |
| mass | kilogram | kg |
| time | second | s |
| electric current | ampere | A |
| temperature | kelvin | K |
| amount of substance | mole | mol |
| luminous intensity | candela | cd |

Since 2019, all seven are defined by fixing exact values of constants of nature. The metre, for example, is the distance light travels in $\tfrac{1}{299\,792\,458}$ of a second. Other units are combinations: a newton is $\text{kg·m/s}^2$, and a joule is $\text{N·m}$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Prefixes',
              body: r`Prefixes scale a unit by powers of 1,000. Slide along the scale.`,
              widget: {
                kind: 'graph', xmin: -10.5, xmax: 10.5, ymin: -1.4, ymax: 1.4, grid: false, axes: false, height: 200,
                params: { e: { min: -9, max: 9, step: 3, value: 0, label: 'power of ten', color: 'violet', format: (v) => `10${String(v).replace(/./g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)])}` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(-10), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 })];
                  for (let e = -9; e <= 9; e += 3) {
                    const [name, sym] = PREFIXES[e];
                    const on = e === p.e;
                    els.push(s('line', { x1: plot.X(e), x2: plot.X(e), y1: plot.Y(0.25), y2: plot.Y(-0.25), stroke: 'var(--ink)', 'stroke-width': 3 }));
                    els.push(s('text', { x: plot.X(e), y: plot.Y(-0.75), 'text-anchor': 'middle', class: 'lbl', text: e === 0 ? 'm' : `${sym}m` }));
                    els.push(s('text', { x: plot.X(e), y: plot.Y(0.6), 'text-anchor': 'middle', class: 'lbl', opacity: on ? 1 : 0.55, text: name || '(none)' }));
                    if (on) els.push(s('circle', { cx: plot.X(e), cy: plot.Y(0), r: 11, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 3 }));
                  }
                  return els;
                },
                readout: (p) => r`$10^{${p.e}}$ m. ${PREFIXES[p.e][2]}`,
              },
              after: r`Each step along the scale is a factor of 1,000. Learn these and you can read any measurement from a virus to a solar system.`,
            },
            {
              type: 'numeric',
              title: 'Read a prefix',
              prompt: r`A computer chip's clock ticks at 3 GHz (gigahertz). How many ticks is that per second?`,
              answer: 3e9,
              tol: 1,
              wrong: [{ v: 3e6, why: 'Mega is a million. Giga is a billion.' }, { v: 3000, why: 'Kilo is a thousand. Giga is a billion.' }],
              explain: r`Giga means $10^9$, so 3 GHz is $3 \times 10^9$: three **billion** ticks per second. (You can type large numbers as 3000000000, 3e9 or 3×10^9.)`,
            },
            {
              type: 'numeric',
              title: 'Small masses',
              prompt: r`A paracetamol tablet contains 500 mg of the drug. What is that in kilograms?`,
              unit: 'kg',
              answer: 5e-4,
              relTol: 0.001,
              wrong: [{ v: 0.5, why: '500 mg is 0.5 g. A kilogram is another 1000 times bigger.' }, { v: 5e-3, relTol: 0.001, why: 'Check the powers: 500 mg = 0.5 g = 0.0005 kg.' }],
              explain: r`$500\ \text{mg} = 500 \times 10^{-3}\ \text{g} = 0.5\ \text{g} = 5 \times 10^{-4}\ \text{kg}$. The kilogram is the only base unit with a prefix built into its name, a historical quirk.`,
            },
            {
              type: 'mcq',
              title: 'Building units',
              prompt: r`A watt is a joule per second, and a joule is a newton-metre. Which combination of base units is a watt?`,
              cols: 2,
              choices: [
                { t: r`$\text{kg·m}^2/\text{s}^3$`, ok: true },
                { t: r`$\text{kg·m/s}^2$`, why: 'That’s a newton. Multiply by metres (for a joule), then divide by seconds.' },
                { t: r`$\text{kg·m}^2/\text{s}^2$`, why: 'That’s a joule. A watt is a joule per second.' },
                { t: r`$\text{kg/s}$`, why: r`Build it up: $\text{N} = \text{kg·m/s}^2$, $\text{J} = \text{N·m}$, $\text{W} = \text{J/s}$.` },
              ],
              explain: r`$\text{N} = \text{kg·m/s}^2$, so $\text{J} = \text{kg·m}^2/\text{s}^2$, and $\text{W} = \text{J/s} = \text{kg·m}^2/\text{s}^3$. Every SI unit unpacks into base units like this.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Tiny times',
              prompt: r`Light travels about 30 cm in one nanosecond. How many nanoseconds does it take to cross a 6 m room?`,
              unit: 'ns',
              answer: 20,
              wrong: [{ v: 0.2, why: r`6 m is 600 cm, and $600 / 30 = 20$.` }, { v: 2, why: r`Convert carefully: 6 m = 600 cm, not 60 cm.` }],
              explain: r`6 m = 600 cm, and $600 \div 30 = 20$ ns. Light moves about a foot per nanosecond, which is why chip designers worry about the lengths of wires!`,
            },
          ],
          recap: [
            'SI has seven base units: m, kg, s, A, K, mol, cd.',
            'Every other unit is a combination of them, such as N = kg·m/s².',
            'Prefixes: n (10⁻⁹), µ (10⁻⁶), m (10⁻³), k (10³), M (10⁶), G (10⁹).',
          ],
        },
        {
          id: 'conversions',
          title: 'Converting Units',
          summary: 'Multiplying by one',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Multiply by one',
              body: r`Since $1\ \text{km} = 1000\ \text{m}$, the fraction $\dfrac{1000\ \text{m}}{1\ \text{km}}$ equals exactly **1**. Multiplying by it changes the units, not the quantity. Treat units like algebra and cancel them:
$$72\ \frac{\text{km}}{\text{h}} \times \frac{1000\ \text{m}}{1\ \text{km}} \times \frac{1\ \text{h}}{3600\ \text{s}} = 20\ \frac{\text{m}}{\text{s}}$$
Arrange each factor so the unit you **don't** want cancels.`,
            },
            {
              type: 'numeric',
              title: 'Highway speed',
              prompt: r`Convert 108 km/h to m/s.`,
              unit: 'm/s',
              answer: 30,
              wrong: [{ v: 388800, why: r`You multiplied by 3600 instead of dividing. 1 hour is 3600 seconds, so per hour → per second means divide.` }, { v: 1.8, why: r`$108 / 60 = 1.8$ is km per minute. Convert km to m too.` }],
              explain: r`$108 \times \dfrac{1000}{3600} = 108 \div 3.6 = 30$ m/s. Shortcut: km/h ÷ 3.6 = m/s.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Two speedometers',
              prompt: r`A cheetah can sprint at about 25 m/s. Set the car's speedometer (in km/h) to the same speed.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 130, ymin: -1, ymax: 1.4, grid: false, axes: false, height: 160,
                params: { v: { min: 0, max: 130, step: 1, value: 50, label: 'speed', color: 'coral', format: (v) => `${v} km/h` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(0), x2: plot.X(130), y1: plot.Y(0.6), y2: plot.Y(0.6), stroke: 'var(--ink)', 'stroke-width': 2.5 }), s('line', { x1: plot.X(0), x2: plot.X(130), y1: plot.Y(-0.2), y2: plot.Y(-0.2), stroke: 'var(--ink)', 'stroke-width': 2.5 })];
                  for (let k = 0; k <= 130; k += 10) {
                    els.push(s('line', { x1: plot.X(k), x2: plot.X(k), y1: plot.Y(0.6), y2: plot.Y(0.75), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                    if (k % 20 === 0) els.push(s('text', { x: plot.X(k), y: plot.Y(0.85), class: 'tick', 'text-anchor': 'middle', text: String(k) }));
                  }
                  for (let m = 0; m <= 36; m += 5) {
                    els.push(s('line', { x1: plot.X(m * 3.6), x2: plot.X(m * 3.6), y1: plot.Y(-0.2), y2: plot.Y(-0.35), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                    els.push(s('text', { x: plot.X(m * 3.6), y: plot.Y(-0.62), class: 'tick', 'text-anchor': 'middle', text: String(m) }));
                  }
                  els.push(s('text', { x: plot.X(131), y: plot.Y(0.62), class: 'tick', text: 'km/h' }), s('text', { x: plot.X(131), y: plot.Y(-0.18), class: 'tick', text: 'm/s' }));
                  els.push(s('line', { x1: plot.X(p.v), x2: plot.X(p.v), y1: plot.Y(1.1), y2: plot.Y(-0.5), stroke: 'var(--coral)', 'stroke-width': 3 }));
                  return els;
                },
                readout: (p) => r`$${p.v}\ \text{km/h} = \dfrac{${p.v} \times 1000\ \text{m}}{3600\ \text{s}} = ${(p.v / 3.6).toFixed(2)}\ \text{m/s}$`,
                goal: (p) => p.v === 90,
                hint: 'Going from m/s to km/h, multiply by 3.6.',
                solution: { v: 90 },
              },
              explain: r`$25 \times 3.6 = 90$ km/h, motorway speed, reached from a standstill in about three seconds. The two scales are just the same line labelled in different units.`,
            },
            {
              type: 'numeric',
              title: 'Seconds in a day',
              prompt: r`How many seconds are there in one day?`,
              unit: 's',
              answer: 86400,
              wrong: [{ v: 1440, why: 'That’s the number of minutes. Multiply by 60 again.' }, { v: 3600, why: 'That’s one hour.' }],
              explain: r`$24 \times 60 \times 60 = 86{,}400$ s. A year is about $3.16 \times 10^7$ s, a handy number to remember: roughly $\pi \times 10^7$.`,
            },
            {
              type: 'mcq',
              title: 'Squared units',
              prompt: r`How many square centimetres are in one square metre?`,
              cols: 2,
              choices: [
                { t: '10,000', ok: true },
                { t: '100', why: r`That's for length: $1\ \text{m} = 100\ \text{cm}$. An area is 100 cm **by** 100 cm.` },
                { t: '1,000', why: 'That’s how many litres are in a cubic metre. For area, square the factor 100.' },
                { t: '1,000,000', why: r`That's cubic centimetres in a cubic metre: $100^3$.` },
              ],
              explain: r`A 1 m × 1 m square is 100 cm × 100 cm $= 10{,}000\ \text{cm}^2$. When the unit is squared, **square** the conversion factor too. For volume, cube it: $1\ \text{m}^3 = 10^6\ \text{cm}^3 = 1000$ litres.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Filling a pool',
              prompt: r`A pool is 10 m long, 5 m wide and 2 m deep. A hose delivers 20 litres per minute. How many **hours** does it take to fill? (1 m³ = 1000 L.)`,
              unit: 'h',
              answer: 83.33,
              tol: 0.1,
              wrong: [{ v: 5000, why: 'That’s the time in minutes. Divide by 60.' }, { v: 0.083, tol: 0.002, why: r`The pool holds $100\ \text{m}^3 = 100{,}000$ L, not 100 L.` }],
              explain: r`Volume $= 10 \times 5 \times 2 = 100\ \text{m}^3 = 100{,}000$ L. Time $= 100{,}000 \div 20 = 5000$ min $= 5000 \div 60 \approx 83.3$ hours, about three and a half days.`,
            },
          ],
          recap: [
            'Converting means multiplying by fractions equal to 1.',
            'Arrange the factors so unwanted units cancel.',
            'Squared units: square the factor. Cubed units: cube it.',
          ],
        },
        {
          id: 'dimensions',
          title: 'Dimensional Analysis',
          summary: 'Checking physics with units alone',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Dimensions',
              body: r`Every physical quantity is built from **dimensions**: length $[L]$, mass $[M]$, time $[T]$, and so on. Speed is $[L][T]^{-1}$. Force ($F = ma$) is $[M][L][T]^{-2}$.

::: key
**Rule:** both sides of an equation, and every term added together, must have the **same dimensions**. You can't add a length to a time.
:::`,
            },
            {
              type: 'mcq',
              title: 'Spot the impossible formula',
              prompt: r`A student writes a formula for the distance $d$ a falling object covers in time $t$. Which one **must** be wrong? ($g$ is an acceleration, in m/s².)`,
              choices: [
                { t: r`$d = g t$`, ok: true },
                { t: r`$d = \tfrac12 g t^2$`, why: r`Units: $\frac{\text{m}}{\text{s}^2} \times \text{s}^2 = \text{m}$ ✓. This is the correct formula.` },
                { t: r`$d = 5 g t^2$`, why: r`The units work ($\text{m}$), so dimensional analysis can't rule it out. The number 5 is wrong, but units can't catch that.` },
              ],
              explain: r`$g t$ has units $\frac{\text{m}}{\text{s}^2} \times \text{s} = \frac{\text{m}}{\text{s}}$: a **speed**, not a distance. Note what dimensional analysis can't catch: pure numbers like $\tfrac12$ or 5.`,
            },
            {
              type: 'explain',
              title: 'Deriving a formula',
              body: r`Dimensional analysis can even **predict** formulas. What could a pendulum's period $T$ depend on? Its length $L$ $[L]$, the bob's mass $m$ $[M]$, and gravity $g$ $[L][T]^{-2}$.

Try $T = L^a\, m^b\, g^c$. Matching dimensions:
- Mass: nothing else has $[M]$, so $b = 0$. **The mass can't matter!**
- Time: $[T]^1 = [T]^{-2c}$, so $c = -\tfrac12$.
- Length: $0 = a + c$, so $a = \tfrac12$.

So $T \propto \sqrt{L/g}$. The full formula is $T = 2\pi\sqrt{L/g}$: only the $2\pi$ needed real physics.`,
            },
            {
              type: 'numeric',
              title: 'Dimensions of energy',
              prompt: r`Kinetic energy is $\tfrac12 mv^2$. Its dimensions are $[M][L]^a[T]^b$. What is $b$?`,
              lhs: r`$b =$`,
              answer: -2,
              wrong: [{ v: 2, why: r`$v^2$ has dimensions $[L]^2[T]^{-2}$: time appears with a negative power.` }, { v: -1, why: r`Speed is $[L][T]^{-1}$, and it's **squared**.` }],
              explain: r`$mv^2$: $[M] \times ([L][T]^{-1})^2 = [M][L]^2[T]^{-2}$, so $b = -2$ (and $a = 2$). Any formula for energy, such as $mgh$ or $\tfrac12 kx^2$, must have the same dimensions.`,
            },
            {
              type: 'mcq',
              title: 'What units can’t tell you',
              prompt: r`A formula passes the dimension check. What does that prove?`,
              choices: [
                { t: 'Only that it could be right: numbers like 2π, and the choice between similar terms, aren’t checked', ok: true },
                { t: 'That it is correct', why: r`$d = 5gt^2$ passes the check but is wrong. Dimensional analysis can only rule formulas out.` },
                { t: 'Nothing at all', why: 'It proves something useful: a failing formula is definitely wrong. A passing one is just possible.' },
              ],
              explain: r`Dimensional analysis is a **necessary** check, not a sufficient one. It's a quick way to catch slips (like a missing square) in long calculations, which is why physicists check units at every line.`,
            },
            {
              type: 'interactive',
              title: 'Find the pendulum formula',
              body: r`A pendulum’s period $T$ might depend on its length $L$ (metres) and on $g$ (m/s²). Try $T = L^a g^b$. Choose the powers so the result has units of **seconds**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 60,
                params: { a: { min: -1, max: 1, step: 0.5, value: 1, label: 'power of L', color: 'blue', format: (v) => v.toFixed(1) }, b: { min: -1, max: 1, step: 0.5, value: 1, label: 'power of g', color: 'coral', format: (v) => v.toFixed(1) } },
                readout: (p) => { const m = p.a + p.b, sec = -2 * p.b, part = (u, k) => (Math.abs(k) < 1e-9 ? '' : `\\mathrm{${u}}^{${fix(k, 1)}}`); const units = `${part('m', m)}\\,${part('s', sec)}`.trim() || '1'; return `$L^{${fix(p.a, 1)}} g^{${fix(p.b, 1)}}$ has units $${units}$ ` + (Math.abs(m) < 1e-9 && Math.abs(sec - 1) < 1e-9 ? '✓ seconds!' : ''); },
                goal: (p) => Math.abs(p.a - 0.5) < 1e-9 && Math.abs(p.b + 0.5) < 1e-9,
                hint: r`$L^a g^b$ has units $\text{m}^{a+b}\,\text{s}^{-2b}$. You need $a + b = 0$ and $-2b = 1$.`,
                solution: { a: 0.5, b: -0.5 },
              },
              explain: r`$a = \frac12$, $b = -\frac12$: $T \propto \sqrt{L/g}$. Dimensional analysis alone gives the form of the answer; a full calculation supplies the missing number, $2\pi$. The mass of the bob can’t appear: no other quantity could cancel its kilograms.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Waves on a string',
              prompt: r`The speed $v$ of a wave on a string depends on the tension $F$ (in N = kg·m/s²) and the mass per unit length $\mu$ (in kg/m). Which formula has the right dimensions?`,
              cols: 2,
              choices: [
                { t: r`$v = \sqrt{F/\mu}$`, ok: true },
                { t: r`$v = F/\mu$`, why: r`$\frac{\text{kg·m/s}^2}{\text{kg/m}} = \frac{\text{m}^2}{\text{s}^2}$. That's a speed **squared**.` },
                { t: r`$v = \sqrt{F\mu}$`, why: r`$F\mu$ has units $\text{kg}^2/\text{s}^2$, so its root isn't a speed.` },
                { t: r`$v = \mu/F$`, why: r`That has units $\text{s}^2/\text{m}^2$: one over a speed squared.` },
              ],
              explain: r`$\dfrac{F}{\mu}$ has units $\dfrac{\text{kg·m/s}^2}{\text{kg/m}} = \dfrac{\text{m}^2}{\text{s}^2}$, so $\sqrt{F/\mu}$ is in m/s ✓. Tighten a guitar string and its waves travel faster, giving a higher note.`,
            },
          ],
          recap: [
            'Both sides of an equation must have the same dimensions.',
            'Units can expose wrong formulas, but not wrong numerical factors.',
            'Matching dimensions can predict how a quantity depends on others.',
          ],
        },
        {
          id: 'temperature',
          title: 'Temperature Scales',
          summary: 'Celsius, Fahrenheit and kelvin',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Three scales',
              body: r`Temperature scales are defined by reference points:

- **Celsius**: water freezes at 0 °C and boils at 100 °C (at sea level).
- **Fahrenheit**: water freezes at 32 °F and boils at 212 °F, so 180 Fahrenheit degrees span what 100 Celsius degrees do.
- **Kelvin**: the SI scale. It uses Celsius-sized steps but starts at **absolute zero**, the coldest possible temperature: $0\ \text{K} = -273.15$ °C.

Converting: $F = \tfrac95 C + 32$ and $K = C + 273.15$.`,
            },
            {
              type: 'numeric',
              title: 'Body temperature',
              prompt: r`Normal body temperature is about 37 °C. What is that in °F? (1 decimal place.)`,
              unit: '°F',
              answer: 98.6,
              tol: 0.06,
              wrong: [{ v: 66.6, tol: 0.06, why: r`Don't forget to add 32: $\tfrac95 \times 37 + 32$.` }, { v: 34.6, tol: 0.1, why: 'Multiply by 9/5 first, then add 32.' }],
              explain: r`$\tfrac95 \times 37 + 32 = 66.6 + 32 = 98.6$ °F.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Where the scales agree',
              prompt: r`The violet line converts Celsius to Fahrenheit; the dashed line is where both numbers are equal. Drag along the violet line to find the one temperature where °C and °F read the same.`,
              widget: {
                kind: 'graph', xmin: -60, xmax: 50, ymin: -80, ymax: 130, grid: 10, gridY: 20, height: 300, padL: 48, axes: { xlabel: '°C', ylabel: '°F', xAt: -60, yAt: -80 },
                params: { c: { min: -60, max: 50, step: 1, value: 20, slider: false } },
                curves: [{ f: (c) => 1.8 * c + 32, color: 'violet', width: 3 }, { f: (c) => c, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.c, y: (p) => 1.8 * p.c + 32, drag: { x: 'c' }, color: 'coral' }],
                readout: (p) => r`$${p.c}$ °C $= ${(1.8 * p.c + 32).toFixed(1)}$ °F`,
                goal: (p) => p.c === -40,
                hint: r`Solve $\tfrac95 C + 32 = C$.`,
                solution: { c: -40 },
              },
              explain: r`$\tfrac95 C + 32 = C$ gives $\tfrac45 C = -32$, so $C = -40$: $-40$ °C is exactly $-40$ °F. If someone quotes "minus forty", you don't need to ask which scale.`,
            },
            {
              type: 'mcq',
              title: 'Twice as hot?',
              prompt: r`Is a 20 °C day twice as hot as a 10 °C day?`,
              choices: [
                { t: 'No: in kelvin it’s 293 K versus 283 K, only about 3.5% hotter', ok: true },
                { t: 'Yes: 20 is twice 10', why: 'The zero of the Celsius scale is arbitrary (freezing water). Ratios only make sense on an absolute scale.' },
                { t: 'It depends on humidity', why: 'Humidity changes how hot it feels, but the physics question is about temperature ratios.' },
              ],
              explain: r`Ratios of temperatures only mean something on the **kelvin** scale, which starts at true zero: the average energy of molecules is proportional to kelvin temperature. That's why gas laws and physics formulas always use kelvin.`,
            },
            {
              type: 'numeric',
              title: 'Room temperature in kelvin',
              prompt: r`What is 20 °C in kelvin? (2 decimal places.)`,
              unit: 'K',
              answer: 293.15,
              tol: 0.006,
              wrong: [{ v: -253.15, tol: 0.01, why: 'Add 273.15 to the Celsius temperature, don’t subtract.' }],
              explain: r`$20 + 273.15 = 293.15$ K. Note: we say "kelvin", not "degrees kelvin", and the symbol is K without a degree sign.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A change in temperature',
              prompt: r`The temperature rises by 10 Celsius degrees. By how many Fahrenheit degrees did it rise?`,
              unit: 'F°',
              answer: 18,
              wrong: [{ v: 50, why: 'That converts the temperature 10 °C. A **change** doesn’t include the +32 offset.' }],
              explain: r`Changes only use the scale factor: $10 \times \tfrac95 = 18$ F°. The $+32$ shifts the zero point, which cancels when you subtract two temperatures. Likewise, a change of 10 °C is a change of exactly 10 K.`,
            },
          ],
          recap: [
            r`$F = \tfrac95 C + 32$; $K = C + 273.15$; −40 °C = −40 °F.`,
            'Temperature ratios only make sense in kelvin, which starts at absolute zero.',
            'Temperature changes use only the scale factor, not the offset.',
          ],
        },
      ],
    },
    {
      title: 'Scaling and Measurement',
      summary: 'Size matters, and so does precision.',
      lessons: [
        {
          id: 'square-cube',
          title: 'The Square–Cube Law',
          summary: 'Why giants can’t exist',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Predict',
              title: 'Double the cube',
              prompt: r`A cube's sides are doubled. By what factor does its **volume** grow?`,
              unit: '×',
              answer: 8,
              wrong: [{ v: 2, why: 'Every one of the three dimensions doubles.' }, { v: 4, why: r`That's the factor for each face's **area** ($2^2$). Volume has three dimensions: $2^3$.` }],
              explain: r`$2 \times 2 \times 2 = 8$. Each face's area grows by $2^2 = 4$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Areas lag behind volumes',
              body: r`Scale any shape up by a factor $k$. Every area grows like $\blue{k^2}$, but every volume, and so the **weight**, grows like $\coral{k^3}$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5.2, ymin: 0, ymax: 64, grid: 1, gridY: 8, height: 340, axes: { xlabel: 'scale factor k', ylabel: '×' },
                params: { k: { min: 1, max: 4, step: 0.5, value: 2, label: '$k$', color: 'violet', format: (v) => `${fix(v, 1)}×` } },
                curves: [{ f: (x) => x * x, color: 'blue' }, { f: (x) => x ** 3, color: 'coral' }],
                points: [{ x: (p) => p.k, y: (p) => p.k * p.k, color: 'blue' }, { x: (p) => p.k, y: (p) => p.k ** 3, color: 'coral' }],
                readout: (p) => r`$k = ${fix(p.k, 1)}$: area $\blue{\times ${fix(p.k ** 2, 2)}}$, weight $\coral{\times ${fix(p.k ** 3, 2)}}$, weight per unit area $\times ${fix(p.k, 1)}$`,
              },
              after: r`The strength of a bone or a beam depends on its **cross-sectional area** ($k^2$), but the load it carries is the weight ($k^3$). So the stress on it grows like $k^3 / k^2 = k$. Scale something up, and it gets relatively **weaker**.`,
            },
            {
              type: 'numeric',
              title: 'A real giant',
              prompt: r`A giant is shaped exactly like a person but 10 times taller. Compared with a person, how many times greater is the stress (weight per unit area) on their leg bones?`,
              unit: '×',
              answer: 10,
              wrong: [{ v: 1000, why: r`That's the weight. The bone area also grows, by $10^2 = 100$.` }, { v: 100, why: r`That's the bone's cross-section. Stress = weight ÷ area = $1000 / 100$.` }, { v: 1, why: 'Weight grows faster than bone area, so the stress isn’t the same.' }],
              explain: r`Weight grows by $10^3 = 1000$ and bone cross-section by $10^2 = 100$, so the stress grows by **10×**. Human leg bones can't take that: the giant would break a thigh bone taking a step. Real large animals, like elephants, have proportionally much thicker legs.`,
            },
            {
              type: 'mcq',
              title: 'Small and cold',
              prompt: r`Animals lose heat through their skin (area) and make heat throughout their body (volume). Which of these animals must eat the most food **for its body weight**?`,
              cols: 3,
              choices: [
                { t: 'A shrew', ok: true },
                { t: 'A human', why: 'Smaller animals have more skin per kilogram, so they lose heat faster for their size.' },
                { t: 'An elephant', why: 'Elephants have the least skin per kilogram, so their problem is getting rid of heat (hence the huge ears).' },
              ],
              explain: r`Surface area per unit volume scales like $k^2/k^3 = 1/k$, so small animals have far more skin per kilogram. A shrew loses heat so fast that it must eat roughly its own body weight in food every day. Elephants have the opposite problem and use their big ears as radiators.`,
            },
            {
              type: 'numeric',
              title: 'Surface per volume',
              prompt: r`A cube has side $s$: surface area $6s^2$, volume $s^3$, so surface ÷ volume $= \frac{6}{s}$. For a 1 cm sugar cube, that's 6 per cm. If the cube is ground into cubes of side 0.01 cm, what is the new surface ÷ volume ratio (per cm)?`,
              unit: 'per cm',
              answer: 600,
              wrong: [{ v: 6, why: 'The ratio is 6/s: smaller pieces have more surface for their volume.' }, { v: 60, why: r`$\frac{6}{0.01} = 600$.` }],
              explain: r`$\frac{6}{0.01} = 600$: a hundred times more surface for the same sugar. That's why powdered sugar dissolves so much faster than cubes, and why flour dust can explode while a sack of flour barely burns.`,
            },
            {
              type: 'mcq',
              title: 'Falling mice',
              prompt: r`Biologist J. B. S. Haldane wrote that a mouse dropped down a deep mine shaft can walk away, while a horse would be killed. Why?`,
              choices: [
                { t: 'Air resistance depends on area (k²) but weight on volume (k³), so small animals fall slowly', ok: true },
                { t: 'Mice are made of tougher material', why: 'It’s not the material. Small things have much more air resistance per unit of weight.' },
                { t: 'Gravity pulls less on small animals', why: 'Gravity gives everything the same acceleration. It’s the drag-to-weight ratio that changes.' },
              ],
              explain: r`Drag scales with area ($k^2$), weight with volume ($k^3$), so drag per unit weight scales like $1/k$. A mouse reaches a gentle terminal speed; a horse doesn't slow down nearly enough. Insects can fall from any height unharmed.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Model ship',
              prompt: r`A 1:100 scale model of a ship has a mass of 5 kg. Assuming it is made of the same materials, roughly what is the real ship's mass, in tonnes? (1 tonne = 1000 kg)`,
              unit: 't',
              answer: 5000,
              wrong: [{ v: 0.5, why: 'Mass scales with volume: multiply by 100³, not 100.' }, { v: 50, why: r`That's $\times 100^2$, an area factor. Mass scales like volume: $100^3 = 10^6$.` }],
              explain: r`Mass scales like volume: $100^3 = 1{,}000{,}000$. So $5\ \text{kg} \times 10^6 = 5 \times 10^6\ \text{kg} = 5000$ tonnes.`,
            },
          ],
          recap: [
            r`Scale lengths by $k$: areas scale by $k^2$, volumes and masses by $k^3$.`,
            r`Stress (weight per area) grows like $k$, so big things are relatively weaker.`,
            r`Surface-to-volume ratio scales like $1/k$, so small animals lose heat fast.`,
          ],
        },
        {
          id: 'sigfigs',
          title: 'Significant Figures',
          summary: 'Don’t claim more than you know',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Digits that mean something',
              body: r`A calculator happily reports $8.0\ \text{m} \div 3.0\ \text{s} = 2.6666667$ m/s, but the inputs were only known to 2 digits. The extra digits are fiction.

**Significant figures** are the digits that carry real information:
- Non-zero digits always count: $4.56$ has 3.
- Zeros between them count: $4.06$ has 3.
- Leading zeros don't count (they just place the decimal point): $0.0045$ has 2.
- Trailing zeros after a decimal point do count: $4.50$ has 3, claiming precision to the hundredth.`,
            },
            {
              type: 'mcq',
              title: 'Count them',
              prompt: r`How many significant figures does $0.00450$ have?`,
              cols: 4,
              choices: [
                { t: '3', ok: true },
                { t: '6', why: 'Leading zeros only place the decimal point; they don’t count.' },
                { t: '2', why: 'The final zero comes after the decimal point and after the 5, so it counts: it says the measurement is precise to that digit.' },
                { t: '5', why: 'Leading zeros never count.' },
              ],
              explain: r`$4.50 \times 10^{-3}$: the digits 4, 5 and the final 0 are significant. Scientific notation makes this unambiguous.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Read the ruler',
              prompt: r`The pencil's tip lies exactly halfway between two millimetre marks. Record its length to the precision the ruler allows (estimating the half-millimetre).`,
              widget: {
                kind: 'graph', xmin: 2.8, xmax: 5.2, ymin: -1, ymax: 1.6, grid: false, axes: false, height: 200,
                params: { L: { min: 4, max: 5, step: 0.05, value: 4.5, label: 'recorded length', color: 'teal', format: (v) => `${v.toFixed(2)} cm` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('rect', { x: plot.X(2.8), y: plot.Y(0), width: plot.X(5.2) - plot.X(2.8), height: plot.Y(-0.9) - plot.Y(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 })];
                  for (let i = 28; i <= 52; i++) {
                    const x = i / 10, len = i % 10 === 0 ? 0.55 : i % 5 === 0 ? 0.4 : 0.25;
                    els.push(s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(0), y2: plot.Y(-len), stroke: 'var(--ink)', 'stroke-width': i % 10 ? 1 : 2 }));
                    if (i % 10 === 0) els.push(s('text', { x: plot.X(x), y: plot.Y(-0.8), class: 'tick', 'text-anchor': 'middle', text: String(i / 10) }));
                  }
                  els.push(s('path', { d: `M${plot.X(2.8)} ${plot.Y(0.9)} L${plot.X(4.1)} ${plot.Y(0.9)} L${plot.X(4.35)} ${plot.Y(0.55)} L${plot.X(4.1)} ${plot.Y(0.2)} L${plot.X(2.8)} ${plot.Y(0.2)} Z`, class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 2 }));
                  els.push(s('line', { x1: plot.X(p.L), x2: plot.X(p.L), y1: plot.Y(1.3), y2: plot.Y(-0.1), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
                  return els;
                },
                readout: (p) => `you record **${p.L.toFixed(2)} cm**`,
                goal: (p) => Math.abs(p.L - 4.35) < 1e-6,
                hint: 'Find the last millimetre mark before the tip, then add half a millimetre (0.05 cm).',
                solution: { L: 4.35 },
              },
              explain: r`4.35 cm: three significant figures. The last digit is an estimate (it might really be 4.34 or 4.36), so a fair report is $4.35 \pm 0.05$ cm. Writing 4.3500 cm would claim a precision the ruler can't give.`,
            },
            {
              type: 'explain',
              title: 'Rules for calculations',
              body: r`- **Multiplying or dividing:** give the answer to the **fewest** significant figures among the inputs. $8.0 \div 3.0 = 2.7$ (2 s.f.).
- **Adding or subtracting:** give the answer to the **fewest decimal places**. $12.1 + 0.37 = 12.5$.

These are rules of thumb. Proper uncertainty analysis (next lesson) is more exact, but significant figures keep you honest quickly.`,
            },
            {
              type: 'numeric',
              title: 'Area of a card',
              prompt: r`A card measures 3.2 cm by 4.17 cm. Its area, $13.344\ \text{cm}^2$ on a calculator, should be reported to how many significant figures? Give the properly rounded area.`,
              unit: r`$\text{cm}^2$`,
              answer: 13,
              wrong: [{ v: 13.3, tol: 0.01, why: '3.2 has only 2 significant figures, so the product should too.' }, { v: 13.344, tol: 0.001, why: 'That claims far more precision than 3.2 cm allows.' }],
              explain: r`3.2 has 2 s.f., so the area is $13\ \text{cm}^2$. A chain is only as strong as its weakest link.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Avogadro’s number',
              prompt: r`Avogadro's number is often quoted as $6.022 \times 10^{23}$. How many significant figures is that?`,
              answer: 4,
              wrong: [{ v: 24, why: 'The power of ten only sets the size; count the digits in 6.022.' }, { v: 3, why: 'The zero between 6 and 2 counts.' }],
              explain: r`6, 0, 2, 2: four significant figures. (Since 2019 its value is defined exactly as $6.022\,140\,76 \times 10^{23}$, part of the redefinition of SI units.)`,
            },
          ],
          recap: [
            'Significant figures are the digits that carry real information; leading zeros don’t count.',
            'Multiplying/dividing: keep the fewest significant figures. Adding/subtracting: the fewest decimal places.',
            'The last recorded digit is usually an estimate.',
          ],
        },
        {
          id: 'uncertainty',
          title: 'Measurement & Uncertainty',
          summary: 'How sure are you?',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Accuracy vs precision',
              prompt: r`A scale reads 51.2 kg, 51.3 kg and 51.2 kg for a 50.0 kg weight. How would you describe it?`,
              choices: [
                { t: 'Precise but not accurate', ok: true },
                { t: 'Accurate but not precise', why: 'The readings agree closely with each other (precise), but they’re all off from the true value.' },
                { t: 'Both accurate and precise', why: 'The readings are consistently about 1.2 kg too high, so the scale isn’t accurate.' },
              ],
              explain: r`**Precision** means repeated readings agree with each other. **Accuracy** means they're close to the true value. This scale has a **systematic error** of about +1.2 kg: perhaps it needs recalibrating. Random scatter, by contrast, can be reduced by averaging many readings.`,
            },
            {
              type: 'explain',
              title: 'Writing uncertainty',
              body: r`A measurement is reported as **value ± uncertainty**: $12.3 \pm 0.1$ cm means "probably between 12.2 and 12.4 cm".

Two simple rules for combining (worst-case) uncertainties:
- **Adding or subtracting:** add the **absolute** uncertainties.
- **Multiplying or dividing:** add the **percentage** uncertainties.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Averaging away the scatter',
              body: r`Each reading of a stopwatch timing has random scatter of about ±0.2 s. Take the average of $n$ readings: how much does the average itself scatter? Change $n$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 0.25, grid: 10, gridY: 0.05, height: 260, padL: 52, axes: { xlabel: 'number of readings n', ylabel: 'scatter of mean (s)', yfmt: (v) => v.toFixed(2) },
                params: { n: { min: 1, max: 50, step: 1, value: 4, label: 'readings averaged', color: 'teal' } },
                curves: [{ f: (x) => 0.2 / Math.sqrt(x), from: () => 1, color: 'teal', width: 3 }],
                points: [{ x: (p) => p.n, y: (p) => 0.2 / Math.sqrt(p.n), color: 'coral' }],
                readout: (p) => r`scatter of the average $= \dfrac{0.2}{\sqrt{${p.n}}} = ${(0.2 / Math.sqrt(p.n)).toFixed(3)}$ s`,
              },
              after: r`Random errors partly cancel when averaged: the scatter of the mean shrinks like $\frac{1}{\sqrt n}$. Four readings halve it; a hundred readings cut it tenfold. But averaging does **nothing** for a systematic error, like a stopwatch that always starts late.`,
            },
            {
              type: 'numeric',
              title: 'Adding lengths',
              prompt: r`Two rods measure $5.0 \pm 0.1$ cm and $3.0 \pm 0.2$ cm. Laid end to end, what is the uncertainty in the total length?`,
              lhs: r`$8.0 \pm$`,
              unit: 'cm',
              answer: 0.3,
              wrong: [{ v: 0.1, why: 'When adding quantities, add their uncertainties.' }, { v: 0.15, why: 'Don’t average them: add them.' }],
              explain: r`The uncertainties add: $8.0 \pm 0.3$ cm. In the worst case both rods are at the long end (5.1 + 3.2 = 8.3) or both at the short end (4.9 + 2.8 = 7.7).`,
            },
            {
              type: 'numeric',
              title: 'Percentage uncertainty',
              prompt: r`A runner covers $100.0 \pm 0.5$ m in $12.5 \pm 0.1$ s. What is the percentage uncertainty in their average speed? (1 decimal place.)`,
              unit: '%',
              answer: 0.5 + 0.8,
              tol: 0.06,
              wrong: [{ v: 0.6, tol: 0.06, why: 'Speed = distance ÷ time: add the percentage uncertainties (0.5% and 0.8%), don’t add the absolute ones.' }, { v: 0.8, tol: 0.06, why: 'Include the distance’s 0.5% as well.' }],
              explain: r`Distance: $\frac{0.5}{100} = 0.5\%$. Time: $\frac{0.1}{12.5} = 0.8\%$. Dividing means adding percentages: $1.3\%$. So the speed is $8.0 \pm 0.1$ m/s. Notice the timing dominates: to improve, use a better stopwatch.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Area of a square',
              prompt: r`A square's side is measured as $10.0 \pm 0.1$ cm (1% uncertainty). Its area is $100\ \text{cm}^2$. What is the uncertainty in the area?`,
              lhs: r`$100 \pm$`,
              unit: r`$\text{cm}^2$`,
              answer: 2,
              wrong: [{ v: 1, why: r`Area = side × side, so the percentage uncertainty doubles: 1% + 1% = 2%.` }, { v: 0.01, why: r`The answer is in cm², not as a fraction: 2% of 100 cm².` }, { v: 0.2, why: r`Multiplying means adding **percentages**: 2% of 100 is 2.` }],
              explain: r`Area $= s \times s$, so the percentage uncertainties add: $1\% + 1\% = 2\%$. And 2% of $100\ \text{cm}^2$ is $2\ \text{cm}^2$. Check: $10.1^2 = 102.01$ and $9.9^2 = 98.01$ ✓.`,
            },
          ],
          recap: [
            'Precision: readings agree with each other. Accuracy: readings are close to the truth.',
            'Adding or subtracting: add absolute uncertainties.',
            'Multiplying or dividing: add percentage uncertainties.',
          ],
        },
      ],
    },
  ],
};
