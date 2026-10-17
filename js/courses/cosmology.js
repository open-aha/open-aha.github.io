const r = String.raw;

// galaxy rotation-curve model (kpc, km/s, solar masses)
const G = 4.3e-6, MD = 6e10, RD = 3, RC = 4;
const mVis = (x) => MD * (1 - Math.exp(-x / RD) * (1 + x / RD));
const vVis2 = (x) => (G * mVis(x)) / x;
const vHalo2 = (x, vh) => vh * vh * (1 - (RC / x) * Math.atan(x / RC));
const vTot = (x, vh) => Math.sqrt(vVis2(x) + vHalo2(x, vh));
const OBS = [4, 8, 12, 16, 20, 25, 30].map((x) => [x, Math.round(vTot(x, 200))]);

// a forest of stars for Olbers' paradox: fixed random positions in a 100 × 100 square
const FOREST = (() => { let a = 77; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; return Array.from({ length: 2000 }, () => [100 * u() - 50, 100 * u() - 50]); })();
const SR = 0.35; // star radius
const sightLines = (R, n) => { const stars = FOREST.slice(0, n).filter(([x, y]) => Math.hypot(x, y) < R + SR && Math.hypot(x, y) > 1), out = []; for (let k = 0; k < 240; k++) { const th = (2 * Math.PI * k) / 240, dx = Math.cos(th), dy = Math.sin(th); let best = R; for (const [x, y] of stars) { const t = x * dx + y * dy; if (t <= 0 || t > best) continue; const d2 = x * x + y * y - t * t; if (d2 < SR * SR) best = Math.min(best, t - Math.sqrt(SR * SR - d2)); } out.push([th, best, best < R]); } return out; };
// flat ΛCDM with H0 = 67.7 km/s/Mpc, Ωm = 0.31, ΩΛ = 0.69 (radiation ignored)
const OM = 0.31, OL = 0.69, TH = 977.8 / 67.7; // Hubble time in Gyr
const ageAt = (a) => (2 / (3 * Math.sqrt(OL))) * Math.asinh(Math.sqrt(OL / OM) * a ** 1.5) * TH;
const AGE = ageAt(1);
// expansion history for any Ωm, ΩΛ: a(t) by RK4 on a'' = −Ωm/(2a²) + ΩΛ a (time in Hubble times)
const historyCache = new Map();
const historyPath = (plot, om, ol, tmax) => 'M' + history(om, ol).pts.filter(([t]) => t * TH <= tmax).map(([t, a]) => `${plot.X(t * TH).toFixed(1)} ${plot.Y(Math.min(a, 3.2)).toFixed(1)}`).join('L');
const history = (om, ol) => {
  const key = `${om}|${ol}`;
  if (historyCache.has(key)) return historyCache.get(key);
  const ok = 1 - om - ol, acc = (a) => -om / (2 * a * a) + ol * a;
  let a = 0.01, v = Math.sqrt(om / a + ok + ol * a * a), t = (2 / 3) * a ** 1.5 / Math.sqrt(om);
  const pts = [[0, 0], [t, a]];
  let today = null;
  let turned = false;
  while (t < 10 && a > 0.005 && a < 6) {
    const h = Math.min(0.004, (0.01 * a) / Math.abs(v)); // small steps while a changes quickly
    const k1a = v, k1v = acc(a), k2a = v + (h / 2) * k1v, k2v = acc(a + (h / 2) * k1a), k3a = v + (h / 2) * k2v, k3v = acc(a + (h / 2) * k2a), k4a = v + h * k3v, k4v = acc(a + h * k3a);
    const na = a + (h / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
    v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (today === null && a < 1 && na >= 1 && v > 0) today = t + (h * (1 - a)) / (na - a);
    a = na; t += h;
    if (v < 0) turned = true;
    pts.push([t, a]);
  }
  if (a <= 0.005) pts.push([t, 0]);
  const res = { pts, today, crunch: turned, crunchAt: a <= 0.005 ? t : null };
  historyCache.set(key, res);
  return res;
};
// triangle on a sphere with one corner at the north pole and two on the equator, Δ apart in longitude
const sphereView = (P) => { const el = 0.45, az = -0.7; const x1 = P[0] * Math.cos(az) - P[1] * Math.sin(az), y1 = P[0] * Math.sin(az) + P[1] * Math.cos(az); return [y1, P[2] * Math.cos(el) - x1 * Math.sin(el), x1 * Math.cos(el) + P[2] * Math.sin(el)]; };

export default {
  id: 'cosmology',
  subject: 'physics',
  title: 'Modern Cosmology',
  level: 'Advanced',
  cover: 'cosmology',
  tagline: 'Stretching space, the Big Bang’s afterglow, dark matter, dark energy, the first minutes and the far future.',
  description: r`Why is the night sky dark? What is the faint microwave glow that fills the sky? Why do galaxies spin too fast, and why is the universe's expansion speeding up? Follow the evidence that shaped modern cosmology, from stretched light to the helium made in the first minutes after the Big Bang, then measure the shape of space and design universes that crunch or expand forever.`,
  prereq: 'Astronomy & Cosmology',
  chapters: [
    {
      title: 'Light from the Beginning',
      summary: 'Redshift, darkness and the cosmic background.',
      lessons: [
        {
          id: 'olbers',
          title: 'Why Is the Night Sky Dark?',
          summary: 'Olbers’ paradox',
          icon: 'moon',
          steps: [
            {
              type: 'explain',
              title: 'A forest of stars',
              body: r`Imagine an infinite, unchanging universe filled evenly with stars. Look in any direction and your line of sight must eventually hit a star, like looking into a dense forest, where every line of sight ends on a tree trunk. Then the whole sky should blaze as brightly as the surface of the Sun.

This puzzle is named after Heinrich Olbers (1823), though Kepler and others raised it earlier.`,
            },
            {
              type: 'mcq',
              title: 'Shells of stars',
              prompt: r`Divide space into thin shells around us, all equally thick. A shell twice as far away looks dimmer star-by-star. How does its **total** light compare with a nearer shell?`,
              choices: [
                { t: 'The same: each star is 4× dimmer, but the shell holds 4× as many stars', ok: true },
                { t: 'A quarter as much', why: 'Each star is a quarter as bright, but the shell’s area (and number of stars) grows as r², which cancels exactly.' },
                { t: 'Twice as much', why: 'Brightness falls as 1/r² and star number grows as r²: they cancel.' },
              ],
              explain: r`Every shell contributes the same light, so infinitely many shells would give infinite brightness (or, allowing for nearer stars blocking farther ones, a sky as bright as a star's surface everywhere). The resolution: the universe has a **finite age** (about 13.8 billion years), so we can only see light from a limited distance. Expansion also stretches and dims distant light.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Lines of sight',
              body: r`You're at the centre of a field of stars (a 2D slice). Each line of sight that ends on a star is drawn bright; lines that escape the dashed circle are dark sky. The circle is as far as you can see: in our universe, the distance light has travelled since the first stars formed. Change the stars' density and the size of the visible region.`,
              widget: {
                kind: 'graph', equal: true, xmin: -51, xmax: 51, ymin: -51, ymax: 51, grid: false, axes: false, maxWidth: 440,
                params: { R: { min: 5, max: 50, step: 1, value: 15, label: 'how far you can see', color: 'violet' }, n: { min: 100, max: 2000, step: 50, value: 600, label: 'number of stars', color: 'amber' } },
                curves: [{ param: { x: (t, p) => p.R * Math.cos(t), y: (t, p) => p.R * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const L = sightLines(p.R, p.n); let hit = '', miss = ''; for (const [th, d, h] of L) { const seg = `M${plot.X(0)} ${plot.Y(0)}L${plot.X(d * Math.cos(th)).toFixed(1)} ${plot.Y(d * Math.sin(th)).toFixed(1)}`; if (h) hit += seg; else miss += seg; } let st = ''; for (const [x, y] of FOREST.slice(0, p.n)) st += `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`; return [s('rect', { x: plot.X(-51), y: plot.Y(51), width: plot.X(51) - plot.X(-51), height: plot.Y(-51) - plot.Y(51), fill: '#0d1020' }), s('path', { d: miss, stroke: '#3b4266', 'stroke-width': 1 }), s('path', { d: hit, stroke: '#ffd36b', 'stroke-width': 1.2 }), s('path', { d: st, stroke: '#f5f3ea', 'stroke-width': 3, 'stroke-linecap': 'round' })]; },
                readout: (p) => { const L = sightLines(p.R, p.n); return `lines of sight ending on a star: **${Math.round((100 * L.filter((x) => x[2]).length) / L.length)}%** of the sky`; },
              },
              after: r`With a small visible region, most of the sky stays dark however many stars there are. Grow the region and the sky fills up: in an infinitely old, infinite universe, every line of sight would end on a star. Our universe's finite age is what leaves the gaps.`,
            },
            {
              type: 'mcq',
              title: 'Is expansion enough?',
              prompt: r`Suppose the universe were infinitely old but still expanding. Would redshift alone keep the night sky dark?`,
              choices: [
                { t: r`It would help (distant light is stretched and dimmed), but the finite age of the universe is the bigger reason`, ok: true },
                { t: r`Yes: redshift is the whole answer`, why: r`Calculations show redshift dims distant starlight but the finite age matters more.` },
                { t: r`No: expansion makes the sky brighter`, why: r`Expansion stretches and dilutes light, making it dimmer.` },
              ],
              explain: r`Edward Harrison showed that the main reason is time: stars haven’t been shining long enough, and light hasn’t travelled far enough, to fill the sky. Redshift adds to the darkness by stretching the light we do receive into longer, weaker wavelengths, like the 2.7 K microwave background.`,
            },
            {
              type: 'mcq',
              title: 'A poet’s answer',
              prompt: r`In 1848, decades before modern cosmology, Edgar Allan Poe suggested an explanation for the dark night sky. Which idea did he propose?`,
              choices: [
                { t: r`The universe is too young for light from the most distant stars to have reached us yet`, ok: true },
                { t: r`Dust clouds block the light`, why: r`Dust would heat up and glow; this idea fails.` },
                { t: r`Stars are too faint to see far away`, why: r`Each shell of stars contributes equally however far it is; faintness alone doesn’t solve the paradox.` },
              ],
              explain: r`Poe’s guess is essentially the modern answer: in a universe of finite age, we see only stars within a finite distance, so most lines of sight end on darkness. Expansion, which redshifts distant light, helps too.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How far to a star?',
              prompt: r`Stars are so sparse that a typical line of sight would travel about $10^{24}$ light-years before hitting one. But we can only see light that has travelled at most about $1.4 \times 10^{10}$ light-years. Roughly what fraction of the sky is covered by stars? (Give it as a decimal, like 1.4e-14.)`,
              answer: 1.4e-14,
              relTol: 0.05,
              wrong: [{ v: 7e13, relTol: 0.1, why: 'That’s upside down. Divide the distance we can see by the typical distance to a star.' }],
              explain: r`$\frac{1.4 \times 10^{10}}{10^{24}} = 1.4 \times 10^{-14}$: stars cover only about a hundred-trillionth of the sky. Edgar Allan Poe guessed the answer in 1848: the light from the most distant stars hasn't had time to reach us.`,
            },
          ],
          recap: [
            'In an infinite, eternal, static universe, the night sky would be blazing bright.',
            'Each shell of stars contributes equal light: dimming (1/r²) and numbers (r²) cancel.',
            'A finite age and cosmic expansion keep the night sky dark.',
          ],
        },
        {
          id: 'redshift',
          title: 'Stretching Space',
          summary: 'Cosmological redshift',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Light stretched with the universe',
              body: r`As the universe expands, the wavelength of light travelling through it stretches by the same factor. Cosmologists describe the size of the universe by a **scale factor** $a$ (equal to 1 today). Light emitted when the universe had scale factor $a$ arrives with its wavelength stretched by $\frac{1}{a}$. Its **redshift** $z$ is defined by
$$1 + z = \frac{\lambda_{\text{observed}}}{\lambda_{\text{emitted}}} = \frac{1}{a}$$`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -2.6, ymax: 2.6, grid: false, axes: false, height: 240,
                params: { a: { min: 0.1, max: 1, step: 0.05, value: 0.5, label: 'scale factor when emitted', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [
                  { f: (x) => 1.3 + 0.9 * Math.sin((2 * Math.PI * x) / 0.8), color: 'blue', width: 2.5 },
                  { f: (x, p) => -1.3 + 0.9 * Math.sin((2 * Math.PI * x * p.a) / 0.8), color: 'coral', width: 2.5 },
                ],
                extra: ({ plot, s }) => [
                  s('text', { x: plot.X(0.1), y: plot.Y(2.45), class: 'tick', text: 'emitted' }),
                  s('text', { x: plot.X(0.1), y: plot.Y(-0.15), class: 'tick', text: 'received today' }),
                ],
                readout: (p) => r`wavelength stretched $\times ${(1 / p.a).toFixed(2)}$, $\;$ redshift $z = ${(1 / p.a - 1).toFixed(2)}$`,
              },
              after: r`This isn't quite a Doppler shift from galaxies flying through space: it's space itself expanding while the light is in transit. The most distant galaxies seen by the James Webb Space Telescope have redshifts above 10: their light set out when the universe was less than a tenth of its present size.`,
            },
            {
              type: 'numeric',
              title: 'A third of the size',
              prompt: r`Light left a galaxy when the universe was one-third of its present size. What redshift $z$ do we measure?`,
              answer: 2,
              wrong: [{ v: 3, why: r`$1 + z = 3$, so $z = 2$.` }, { v: 1 / 3, tol: 0.01, why: r`That's the scale factor. $1 + z = \frac{1}{a} = 3$.` }],
              explain: r`$1 + z = \frac{1}{1/3} = 3$, so $z = 2$: every wavelength has tripled. Ultraviolet light emitted then may arrive as infrared.`,
            },
            {
              type: 'interactive',
              title: 'Looking back in time',
              body: r`A higher redshift means light that left earlier. Using the standard cosmological model, find the redshift of light that set out when the universe was only **1 billion years old**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 14, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'cosmic time (billions of years)', ylabel: 'scale factor a', xticks: 2, yticks: 0.25 },
                params: { z: { min: 0, max: 20, step: 0.01, value: 2, label: 'redshift $z$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ param: { x: (a) => ageAt(a), y: (a) => a, t0: 0.001, t1: 1 }, color: 'violet', width: 3, n: 300 }],
                points: [{ x: (p) => ageAt(1 / (1 + p.z)), y: (p) => 1 / (1 + p.z), color: 'coral' }, { x: () => AGE, y: () => 1, color: 'ink' }],
                readout: (p) => { const t = ageAt(1 / (1 + p.z)); return `light left when the universe was **${t.toFixed(2)} billion years** old and has travelled ${(AGE - t).toFixed(2)} billion years`; },
                goal: (p) => Math.abs(ageAt(1 / (1 + p.z)) - 1) < 0.01,
                hint: 'It’s between 5 and 6.',
                solution: { z: 5.68 },
              },
              explain: r`About $z = 5.7$, when the universe was 15% of its present size. The curve shows the expansion history: fast at first, slowing under gravity, then (in the last few billion years) speeding up again. JWST sees galaxies beyond $z = 13$, less than 350 million years after the Big Bang.`,
            },
            {
              type: 'numeric',
              title: 'Why JWST sees in infrared',
              prompt: r`Hydrogen atoms emit strongly at an ultraviolet wavelength of 121.6 nm. At what wavelength does this light arrive from a galaxy at redshift $z = 10$? (Nearest nm.)`,
              unit: 'nm',
              answer: 121.6 * 11,
              tol: 1,
              wrong: [{ v: 1216, why: r`Multiply by $1 + z = 11$, not by $z$.` }],
              explain: r`$121.6 \times 11 \approx 1338$ nm: infrared, invisible to the eye. That's why the James Webb Space Telescope observes in infrared and is kept extremely cold, so its own heat doesn't swamp the faint stretched light.`,
            },
            {
              type: 'numeric',
              title: 'A shifted line',
              prompt: r`Hydrogen emits a red line at 656 nm. In a galaxy at redshift $z = 1$, wavelengths are stretched by a factor $1 + z$. At what wavelength do we observe this line, in nanometres?`,
              unit: 'nm',
              answer: 1312,
              explain: r`$656 \times 2 = 1312$ nm, in the infrared. The universe was half its present size when the light set out.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Farther than its age',
              prompt: r`Light from a galaxy at $z = 10$ has travelled for about 13.3 billion years. How far away is the galaxy **now**?`,
              choices: [
                { t: 'About 31 billion light-years: space kept expanding while the light was travelling', ok: true },
                { t: '13.3 billion light-years', why: 'That’s the light-travel time. Space has expanded since the light left, carrying the galaxy much farther.' },
                { t: 'Less than 13.3 billion light-years', why: 'Expansion only adds distance. The galaxy is now much farther than the light’s travel time suggests.' },
              ],
              explain: r`Expansion stretched the path behind the light, so today the galaxy is about 31 billion light-years away. The edge of the observable universe is about 46 billion light-years away in every direction, even though the universe is only 13.8 billion years old. Nothing travels faster than light **through** space, but space itself can grow.`,
            },
          ],
          recap: [
            r`Expansion stretches light: $1 + z = \lambda_{\text{obs}}/\lambda_{\text{emit}} = 1/a$.`,
            'Redshift tells us how much the universe has grown since the light left.',
            'The most distant galaxies known have z > 10.',
          ],
        },
        {
          id: 'cmb',
          title: 'The Afterglow',
          summary: 'The cosmic microwave background',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'A glow from everywhere',
              body: r`In 1965, Arno Penzias and Robert Wilson couldn't get rid of a faint microwave hiss in their radio antenna, coming equally from every direction. It turned out to be the **cosmic microwave background** (CMB): light released about 380,000 years after the Big Bang.

Before then, the universe was a hot, opaque fog of charged particles. When it cooled to about 3000 K, electrons and nuclei combined into neutral atoms (**recombination**), and the light could finally travel freely. That light has been travelling ever since, stretched by a factor of about 1100.`,
            },
            {
              type: 'numeric',
              title: 'Cooling with expansion',
              prompt: r`The temperature of this radiation falls as $\frac{1}{a}$: when the light's wavelengths stretch by a factor of 1100, its temperature drops by the same factor. If it was released at about 3000 K, what is its temperature today? (2 decimal places.)`,
              unit: 'K',
              answer: 3000 / 1100,
              tol: 0.02,
              wrong: [{ v: 3000 * 1100, relTol: 0.01, why: 'The radiation cools as it stretches: divide by 1100.' }],
              explain: r`$3000 / 1100 \approx 2.73$ K. The measured value is $2.725$ K, just above absolute zero. The CMB has an almost perfect blackbody spectrum, peaking at a wavelength of about 1 mm.`,
            },
            {
              type: 'numeric',
              title: 'Where the glow peaks',
              prompt: r`Wien's law says a blackbody's spectrum peaks at $\lambda_{\text{peak}} = \frac{2.898\ \text{mm·K}}{T}$. At what wavelength does the 2.725 K background peak? (2 decimal places.)`,
              unit: 'mm',
              answer: 2.898 / 2.725,
              tol: 0.01,
              wrong: [{ v: 2.725 / 2.898, tol: 0.01, why: 'Divide the constant by the temperature, not the other way round.' }],
              explain: r`$\frac{2.898}{2.725} \approx 1.06$ mm: microwaves, which is why it's the cosmic **microwave** background. Before digital TV, about 1% of the static on an untuned analogue TV came from it.`,
            },
            {
              type: 'mcq',
              title: 'Tiny ripples',
              prompt: r`In 1992, the COBE satellite found that the CMB's temperature varies across the sky by only about 1 part in 100,000. Why are these tiny ripples so important?`,
              choices: [
                { t: 'They are the seeds of structure: slightly denser regions grew by gravity into galaxies and clusters', ok: true },
                { t: 'They show the instrument was faulty', why: 'The ripples have been confirmed by many experiments, including WMAP and Planck.' },
                { t: 'They prove the universe is not expanding', why: 'They’re fully consistent with expansion and in fact measure it precisely.' },
              ],
              explain: r`Gravity amplified those minute differences over billions of years into the cosmic web of galaxies. The detailed pattern of ripples, mapped by WMAP and Planck, pins down the universe's age (13.8 billion years), its geometry (very nearly flat) and its ingredients. George Smoot and John Mather won the 2006 Nobel Prize for COBE.`,
            },
            {
              type: 'interactive',
              title: 'Running the glow backwards',
              body: r`The cosmic microwave background is a 2.725 K glow today. Its temperature scales with the size of the universe: $T = 2.725\ \text{K} \times (1 + z)$, where $1 + z$ is how much space has stretched since. Atoms first formed, letting light travel freely, at about **3,000 K**. Find that redshift.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 3.7, ymin: 0, ymax: 1.15, grid: false, height: 260, axes: { xlabel: 'wavelength (power of 10 µm)', ylabel: 'brightness (scaled)', xticks: 0.5, yticks: 0.25, xAt: -0.5 },
                params: { z: { min: 0, max: 1500, step: 1, value: 200, label: 'redshift z', color: 'coral' } },
                curves: [{ f: (x, p) => { const T = 2.725 * (1 + p.z), B = (l) => 1 / (l ** 5 * (Math.exp(14388 / (l * T)) - 1)); return B(10 ** x) / B(2897.8 / T); }, color: 'violet', width: 3, n: 600 }, { f: (x) => { const T = 2.725, B = (l) => 1 / (l ** 5 * (Math.exp(14388 / (l * T)) - 1)); return B(10 ** x) / B(2897.8 / T); }, color: 'muted', dash: true, n: 400 }],
                readout: (p) => { const T = 2.725 * (1 + p.z); return `temperature **${T.toFixed(0)} K** · glow peaks at ${(2897.8 / T).toFixed(2)} µm (today: 1,063 µm, dashed)`; },
                goal: (p) => Math.abs(2.725 * (1 + p.z) - 3000) < 6,
                hint: '1 + z = 3000 / 2.725.',
                solution: { z: 1100 },
              },
              explain: r`$1 + z = 3000/2.725 \approx 1100$: space has stretched about 1,100-fold since the light set out, 380,000 years after the Big Bang. Then it glowed a dull orange, with its peak near 1 µm in the infrared; stretching has shifted that glow to millimetre microwaves.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Photons everywhere',
              prompt: r`Every cubic centimetre of space holds about 411 CMB photons, while the universe averages only about 0.25 protons per **cubic metre**. About how many CMB photons are there per proton? (In billions.)`,
              unit: 'billion',
              answer: 411e6 / 0.25 / 1e9,
              relTol: 0.03,
              wrong: [{ v: 411 / 0.25 / 1e9, relTol: 0.05, why: 'Convert units: a cubic metre holds a million cubic centimetres.' }],
              hint: r`A cubic metre holds $10^6$ cm³, so $411 \times 10^6$ photons per m³.`,
              explain: r`$\frac{4.1 \times 10^8}{0.25} \approx 1.6 \times 10^9$: about 1.6 billion photons for every proton. This ratio was fixed in the first moments after the Big Bang, and it controls how the first elements formed, as a later lesson will show.`,
            },
          ],
          recap: [
            'The CMB is light released about 380,000 years after the Big Bang.',
            'It has cooled from about 3000 K to 2.725 K as the universe expanded 1100-fold.',
            'Its tiny ripples were the seeds of galaxies.',
          ],
        },
      ],
    },
    {
      title: 'The Dark Universe',
      summary: 'Dark matter, dark energy and the first elements.',
      lessons: [
        {
          id: 'darkmatter',
          title: 'Dark Matter',
          summary: 'Galaxies that spin too fast',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Rotation curves',
              body: r`Stars orbit the centre of their galaxy. If most of the mass were in the bright central regions, outer stars should move more slowly, just as Neptune orbits more slowly than Mercury: $v = \sqrt{GM/r}$.

In the 1970s, Vera Rubin and Kent Ford measured the orbital speeds of stars and gas in spiral galaxies. Far beyond the bright disc, the speeds didn't fall. They stayed flat.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fit the rotation curve',
              prompt: r`The dots are measured orbital speeds. The dashed curve is what the visible stars and gas alone predict. Add an invisible **dark matter halo** until the total (solid) curve matches the data.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 32, ymin: 0, ymax: 260, grid: 5, gridY: 50, height: 300, padL: 52,
                axes: { xlabel: 'distance (kpc)', ylabel: 'speed (km/s)' },
                params: { vh: { min: 0, max: 300, step: 10, value: 0, label: 'dark matter halo', color: 'violet', format: (v) => `${v} km/s` } },
                curves: [
                  { f: (x) => Math.sqrt(vVis2(x)), from: () => 0.3, color: 'amber', dash: true, width: 2.5 },
                  { f: (x, p) => vTot(x, p.vh), from: () => 0.3, color: 'violet', width: 3.5 },
                ],
                extra: ({ plot, s }) => OBS.map(([x, v]) => s('circle', { cx: plot.X(x), cy: plot.Y(v), r: 6, class: 'fl-ink' })),
                readout: (p) => {
                  const ratio = (vHalo2(30, p.vh) * 30) / G / mVis(30);
                  return p.vh ? r`dark matter within 30 kpc: $${ratio.toFixed(1)}\times$ the visible mass` : 'visible matter only';
                },
                goal: (p) => OBS.every(([x, v]) => Math.abs(vTot(x, p.vh) - v) < 8),
                hint: 'The outer points sit near 200 km/s. The halo must hold the curve up far from the centre.',
                solution: { vh: 200 },
              },
              explain: r`The fit needs several times more unseen mass than visible mass, spread in a vast halo around the galaxy. Fritz Zwicky had found a similar mismatch in galaxy clusters back in 1933. Gravitational lensing and the CMB ripples point to the same conclusion: about 85% of all matter is **dark matter**, which doesn't emit or absorb light. What it's made of is still unknown.`,
            },
            {
              type: 'numeric',
              title: 'Mass that grows',
              prompt: r`For a circular orbit, $v^2 = \frac{G M(r)}{r}$, where $M(r)$ is the mass inside radius $r$. If the orbital speed is the same at 10 kpc and at 30 kpc, how many times more mass lies within 30 kpc than within 10 kpc?`,
              unit: '×',
              answer: 3,
              wrong: [{ v: 1, why: r`With $v$ constant, $M(r) = \frac{v^2 r}{G}$ grows in proportion to $r$.` }, { v: 9, why: r`$M \propto r$ (not $r^2$) when $v$ is constant.` }],
              explain: r`$M(r) = \frac{v^2 r}{G}$, so with constant $v$, mass grows in step with radius: 3 times as much within 30 kpc, even though there's very little visible light out there.`,
            },
            {
              type: 'numeric',
              title: 'Weighing the Milky Way',
              prompt: r`The Sun's neighbours orbit at about 220 km/s, and the rotation curve stays near that out to 30 kpc. Using $M = \frac{v^2 r}{G}$ with $G = 4.3 \times 10^{-6}$ kpc·(km/s)²/M☉, how much mass lies within 30 kpc? (In units of $10^{11}$ solar masses; 1 decimal place.)`,
              unit: r`$\times 10^{11}$ M☉`,
              answer: (220 ** 2 * 30) / 4.3e-6 / 1e11,
              tol: 0.1,
              wrong: [{ v: (220 * 30) / 4.3e-6 / 1e11, relTol: 0.05, why: 'Square the speed.' }],
              explain: r`$\frac{220^2 \times 30}{4.3 \times 10^{-6}} \approx 3.4 \times 10^{11}$ solar masses, while all the Milky Way's stars and gas add up to only about $6 \times 10^{10}$. Most of our galaxy's mass is dark.`,
            },
            {
              type: 'mcq',
              title: 'What could it be?',
              prompt: r`Which of these has been **ruled out** as the main form of dark matter?`,
              choices: [
                { t: r`Ordinary gas and dust that is simply too faint to see`, ok: true },
                { t: r`Unknown heavy particles (such as WIMPs)`, why: r`These remain candidates; experiments are hunting for them.` },
                { t: r`Very light particles called axions`, why: r`Axions are still a leading candidate.` },
              ],
              explain: r`The amount of ordinary matter is fixed by Big Bang nucleosynthesis and the cosmic microwave background, at about a sixth of all matter. Gas that hidden would also glow in X-rays or absorb light. Most dark matter must be something new.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Bullet Cluster',
              prompt: r`Two galaxy clusters collided about 150 million years ago. X-ray telescopes show their hot gas (most of the ordinary matter) piled up in the middle, slowed by the collision. Gravitational lensing shows that most of the **mass** sailed on with the galaxies, well ahead of the gas. Why is this such strong evidence for dark matter?`,
              choices: [
                { t: 'The mass is separated from where most of the ordinary matter is, so it must be something else that barely interacts', ok: true },
                { t: 'It shows gravity is weaker than expected', why: 'The point is where the mass is, not how strong gravity is.' },
                { t: 'The gas must be made of dark matter', why: 'The gas glows brightly in X-rays: it is ordinary matter. The mass is mostly elsewhere.' },
              ],
              explain: r`If there were no dark matter and gravity were simply modified, the lensing mass should follow the ordinary matter, mostly the gas. Instead the mass passed through the collision with almost no friction, as expected for particles that interact only through gravity (and perhaps very weakly otherwise).`,
            },
          ],
          recap: [
            'Galaxy rotation curves stay flat far beyond the visible disc.',
            'This implies huge halos of unseen dark matter.',
            'About 85% of the matter in the universe is dark.',
          ],
        },
        {
          id: 'darkenergy',
          title: 'Dark Energy',
          summary: 'The accelerating universe',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Speeding up',
              body: r`Gravity pulls everything together, so astronomers expected the expansion of the universe to be **slowing down**. In 1998, two teams measured distant exploding stars (type Ia supernovae, which all peak at nearly the same brightness, making them "standard candles"). The distant supernovae were fainter than expected: farther away than a slowing universe would allow.

The expansion is **accelerating**. Saul Perlmutter, Brian Schmidt and Adam Riess shared the 2011 Nobel Prize. Whatever drives the acceleration is called **dark energy**.`,
            },
            {
              type: 'numeric',
              title: 'The cosmic budget',
              prompt: r`According to measurements by the Planck satellite, ordinary matter (everything made of atoms) is about 5% of the universe's energy content, and dark matter about 27%. What percentage is dark energy?`,
              unit: '%',
              answer: 68,
              wrong: [{ v: 32, why: 'That’s matter (ordinary plus dark). The rest is dark energy: 100 − 32.' }, { v: 95, why: 'That’s everything except ordinary matter. Subtract dark matter too.' }],
              explain: r`$100 - 5 - 27 = 68\%$. Everything we've ever seen (stars, planets, gas, us) is about 5% of the cosmos. The other 95% is dark matter and dark energy, whose nature remains one of physics' biggest open questions.`,
            },
            {
              type: 'mcq',
              title: 'A constant energy',
              prompt: r`The simplest explanation of dark energy is Einstein's **cosmological constant**: a fixed energy per cubic metre of empty space. As the universe expands, what happens to its importance relative to matter?`,
              choices: [
                { t: 'It grows: matter thins out as space expands, but the energy of each cubic metre of space stays fixed', ok: true },
                { t: 'It fades away like matter', why: 'Matter’s density falls as volume grows; a constant energy density by definition doesn’t.' },
                { t: 'They stay in the same proportion forever', why: 'Matter density falls as 1/a³ while the cosmological constant stays the same, so the balance shifts.' },
              ],
              explain: r`Matter density falls as $\frac{1}{a^3}$, but a cosmological constant doesn't dilute at all. Early on, matter dominated and the expansion slowed; about 6 billion years ago dark energy began to win, and the expansion started to accelerate.`,
            },
            {
              type: 'numeric',
              title: 'The changeover',
              prompt: r`Matter's density falls like $\Omega_m/a^3$, while dark energy's stays at $\Omega_\Lambda$. Today $\Omega_m = 0.31$ and $\Omega_\Lambda = 0.69$. At what redshift were they equal? (2 decimal places.)`,
              lhs: r`$z =$`,
              answer: 1 / Math.pow(0.31 / 0.69, 1 / 3) - 1,
              tol: 0.01,
              wrong: [{ v: Math.pow(0.31 / 0.69, 1 / 3), tol: 0.01, why: r`That's the scale factor $a$. Convert: $z = \frac1a - 1$.` }],
              hint: r`Solve $\frac{0.31}{a^3} = 0.69$, then $z = \frac1a - 1$.`,
              explain: r`$a = \left(\frac{0.31}{0.69}\right)^{1/3} \approx 0.77$, so $z \approx 0.31$: about 3.5 billion years ago. (The expansion actually began accelerating a bit earlier, near $z \approx 0.6$, because dark energy pushes harder than matter pulls once its density is half as large.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'With and without dark energy',
              body: r`Compare the expansion history of our universe with a universe that has the same matter but no dark energy. Time is in billions of years since the Big Bang; the dot marks "today" (scale factor 1).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 3, grid: false, height: 280, axes: { xlabel: 'time (billions of years)', ylabel: 'scale factor', xticks: 10, yticks: 1 },
                params: { ol: { min: 0, max: 0.69, step: 0.01, value: 0.69, label: 'dark energy $\\Omega_\\Lambda$', color: 'violet', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => [s('path', { d: historyPath(plot, 0.31, p.ol, 40), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 })],
                points: [{ x: (p) => (history(0.31, p.ol).today || 0) * TH, y: () => 1, color: 'coral' }],
                readout: (p) => { const H = history(0.31, p.ol); return `age of this universe today: **${((H.today || 0) * TH).toFixed(1)} billion years** · ${p.ol > 0.2 ? 'expansion eventually speeds up' : 'expansion keeps slowing down'}`; },
              },
              after: r`Without dark energy the curve bends over (always decelerating) and the universe would be younger today, about 11.6 billion years, uncomfortably close to the ages of its oldest stars. With $\Omega_\Lambda = 0.69$, the curve turns upward: accelerating expansion, and an age of 13.8 billion years that fits the stars.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The worst prediction',
              prompt: r`Quantum theory suggests empty space should have an energy, and a naive estimate gives a cosmological constant about $10^{120}$ times bigger than the measured value. What does that tell us?`,
              choices: [
                { t: 'Something deep is missing from our understanding of vacuum energy or gravity', ok: true },
                { t: 'The measurements must be wrong by a factor of $10^{120}$', why: 'Several independent methods (supernovae, the CMB, galaxy clustering) agree on the measured value.' },
                { t: 'Dark energy is made of ordinary matter', why: 'Ordinary matter dilutes as the universe expands. Dark energy doesn’t.' },
              ],
              explain: r`This mismatch, sometimes called "the worst prediction in physics", is the **cosmological constant problem**. A vacuum energy that large would have torn the universe apart before galaxies could form. Explaining why the true value is so small, yet not zero, is one of the biggest open questions in physics.`,
            },
          ],
          recap: [
            'Distant supernovae revealed in 1998 that cosmic expansion is accelerating.',
            'The cause is called dark energy: about 68% of the universe’s energy.',
            'A cosmological constant grows in importance as matter thins out.',
          ],
        },
        {
          id: 'nucleosynthesis',
          title: 'The First Three Minutes',
          summary: 'Where helium came from',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'A cosmic furnace',
              body: r`In the first seconds after the Big Bang, the universe was too hot for atomic nuclei to survive. Protons and neutrons swapped back and forth. As it cooled, neutrons (slightly heavier) became rarer, and some decayed. By the time nuclei could form, a few minutes in, there was about **1 neutron for every 7 protons**.

Then almost every neutron was locked into helium-4 nuclei (2 protons + 2 neutrons) within minutes. This is **Big Bang nucleosynthesis**.`,
            },
            {
              type: 'numeric',
              title: 'Predict the helium',
              prompt: r`Start with 2 neutrons and 14 protons (a 1 : 7 ratio). The 2 neutrons pair with 2 protons to make one helium-4 nucleus; the remaining 12 protons stay as hydrogen. What fraction of the total **mass** is helium? (Treat protons and neutrons as equal in mass.)`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 1 / 13, tol: 0.001, why: 'That’s the fraction of nuclei that are helium (1 of 13). By mass, helium-4 counts 4 units out of 16.' }, { v: 0.125, tol: 0.001, why: 'Helium includes the 2 neutrons and 2 protons: 4 of the 16 particles.' }],
              explain: r`Helium holds 4 of the 16 particles: $\frac{4}{16} = 25\%$ by mass. And that's what astronomers measure in the oldest gas clouds: about 24–25% helium. A Big Bang prediction confirmed by observation, alongside the tiny amounts of deuterium and lithium also made in those first minutes. (Everything heavier was forged later, in stars.)`,
            },
            {
              type: 'interactive',
              title: 'Tuning the neutrons',
              body: r`If every neutron ends up in helium, the helium mass fraction is $Y = \dfrac{2r}{1 + r}$, where $r$ is the number of neutrons per proton when nuclei form. Observations of the oldest gas give $Y \approx 0.245$. Find the neutron-to-proton ratio that matches.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.4, ymin: 0, ymax: 0.6, grid: false, height: 280, axes: { xlabel: 'neutrons per proton', ylabel: 'helium mass fraction', xticks: 0.1, yticks: 0.1 },
                params: { r: { min: 0, max: 0.4, step: 0.001, value: 0.2, label: '$n/p$', color: 'coral', format: (v) => (v ? `${v.toFixed(3)} (1 in ${1 / v >= 10 ? Math.round(1 / v) : (1 / v).toFixed(1)})` : '0') } },
                curves: [{ f: (x) => (2 * x) / (1 + x), color: 'violet', width: 3 }, { f: () => 0.245, color: 'teal', dash: true }],
                points: [{ x: (p) => p.r, y: (p) => (2 * p.r) / (1 + p.r), color: 'coral' }],
                readout: (p) => `helium mass fraction **${((2 * p.r) / (1 + p.r)).toFixed(3)}**`,
                goal: (p) => Math.abs((2 * p.r) / (1 + p.r) - 0.245) < 0.002,
                hint: 'Where does the curve cross the dashed line?',
                solution: { r: 0.14 },
              },
              explain: r`$r \approx 0.14$, about 1 neutron for every 7 protons: exactly what the physics of the cooling early universe predicts. If the universe had expanded a little faster or slower, or if the neutron-proton mass difference were slightly different, the helium fraction would differ, so this match tests physics at one second after the Big Bang.`,
            },
            {
              type: 'mcq',
              title: 'Why stop at helium?',
              prompt: r`Big Bang nucleosynthesis made hydrogen, helium and a trace of lithium, but no carbon or oxygen. Why not?`,
              choices: [
                { t: 'There are no stable nuclei with 5 or 8 particles to build on, and the universe cooled and thinned out within minutes', ok: true },
                { t: 'Carbon hadn’t been invented yet', why: 'The laws of physics were the same. The problem was the steps needed to get there.' },
                { t: 'It was too cold for fusion', why: 'It was hot enough, but only briefly, and the stepping stones (mass 5 and 8) fall apart instantly.' },
              ],
              explain: r`To get past helium-4 you need to add one more particle (mass 5) or fuse two heliums (mass 8), and both fall apart almost instantly. Stars get round this much later by fusing **three** heliums into carbon, which needs high densities sustained for millions of years. Every carbon atom in your body was made in a star.`,
            },
            {
              type: 'mcq',
              title: 'A cosmic scale',
              prompt: r`The amount of **deuterium** left over from the first minutes is used to measure the density of ordinary matter. Why?`,
              choices: [
                { t: r`Denser matter burns deuterium more completely into helium, so less deuterium remains`, ok: true },
                { t: r`Deuterium is made in stars today`, why: r`Stars destroy deuterium; essentially all of it is primordial.` },
                { t: r`Deuterium is the most abundant element`, why: r`Hydrogen is. Deuterium is rare, which makes it sensitive.` },
              ],
              explain: r`The leftover deuterium is very sensitive to how many protons and neutrons were around: more matter, more collisions, less deuterium surviving. Measurements in distant gas clouds agree beautifully with the density inferred from the cosmic microwave background.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Decaying neutrons',
              prompt: r`Free neutrons decay with a half-life of about 10 minutes. When nuclei formed, there was about 1 neutron for every 7 protons. If nuclei had formed 10 minutes later, half of those neutrons would have decayed into protons first. How many neutrons per proton would there have been then? (Of 8 particles, 1 neutron and 7 protons, half a neutron becomes a proton. 3 decimal places.)`,
              answer: 0.5 / 7.5,
              tol: 0.002,
              wrong: [{ v: 0.5 / 7, tol: 0.002, why: 'Each decaying neutron also adds a proton: 0.5 neutrons and 7.5 protons.' }, { v: 1 / 7, tol: 0.002, why: 'That’s the ratio before the decays.' }],
              explain: r`$\frac{0.5}{7.5} \approx 0.067$, giving $Y = \frac{2 \times 0.067}{1.067} \approx 12.5\%$ helium instead of 25%. The helium we observe pins down when nuclei formed, and so how fast the young universe expanded and cooled.`,
            },
          ],
          recap: [
            'Nuclei formed a few minutes after the Big Bang, with about 1 neutron per 7 protons.',
            'Nearly all neutrons ended up in helium-4: about 25% of the mass.',
            'The observed helium fraction strongly supports the Big Bang model.',
          ],
        },
      ],
    },
    {
      title: 'Shape and Fate',
      summary: 'Is space curved, and how will it all end?',
      lessons: [
        {
          id: 'geometry',
          title: 'The Shape of Space',
          summary: 'Flat, closed or open',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Triangles tell curvature',
              body: r`General relativity allows space itself to be curved. In flat space, a triangle's angles add up to exactly 180°. On a positively curved surface like a sphere they add up to **more**; on a saddle-shaped (negatively curved) surface, **less**. Measuring a big enough triangle tells you the shape of the space you live in, without ever leaving it.`,
            },
            {
              type: 'interactive',
              title: 'A triangle on a sphere',
              body: r`Walk from the North Pole down to the equator, turn 90°, walk along the equator, turn and walk back up to the pole. Each corner on the equator is a right angle. Widen the triangle until its angles add up to **270°**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 400,
                params: { d: { min: 10, max: 180, step: 1, value: 45, label: 'angle at the pole', color: 'coral', format: (v) => `${v}°` } },
                curves: [{ param: { x: (t) => Math.cos(t), y: (t) => Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'ink', width: 2 }],
                extra: ({ plot, p, s }) => {
                  const D = (p.d * Math.PI) / 180, seg = (f, n = 60) => { let front = '', back = '', prev = null; for (let i = 0; i <= n; i++) { const [x, y, z] = sphereView(f(i / n)); const c = `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; const vis = z >= 0; if (prev === null || prev !== vis) { if (vis) front += `M${c}`; else back += `M${c}`; } else if (vis) front += `L${c}`; else back += `L${c}`; prev = vis; } return [front, back]; };
                  const arcs = [seg((u) => [Math.sin((u * Math.PI) / 2), 0, Math.cos((u * Math.PI) / 2)]), seg((u) => [Math.cos(u * D), Math.sin(u * D), 0]), seg((u) => [Math.cos(D) * Math.sin(((1 - u) * Math.PI) / 2), Math.sin(D) * Math.sin(((1 - u) * Math.PI) / 2), Math.cos(((1 - u) * Math.PI) / 2)])];
                  const eq = seg((u) => [Math.cos(2 * Math.PI * u), Math.sin(2 * Math.PI * u), 0], 120);
                  return [s('path', { d: eq[1], fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '4 4' }), s('path', { d: eq[0], fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.2 }), ...arcs.flatMap(([f, b]) => [s('path', { d: b, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 5', opacity: 0.6 }), s('path', { d: f, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-linecap': 'round' })])];
                },
                readout: (p) => `angles: ${p.d}° + 90° + 90° = **${p.d + 180}°** · the triangle covers ${((p.d / 720) * 100).toFixed(1)}% of the sphere`,
                goal: (p) => p.d === 90,
                hint: 'Two of the angles are already 90°.',
                solution: { d: 90 },
              },
              explain: r`At 90° at the pole, the angles total 270°, and the triangle covers exactly an eighth of the sphere. The **excess** over 180° is proportional to the area: $\text{excess (radians)} = \frac{\text{area}}{R^2}$. Small triangles barely notice curvature, which is why the Earth looks flat up close.`,
            },
            {
              type: 'numeric',
              title: 'Measuring the Earth',
              prompt: r`On a sphere of radius $R$, a triangle's angle excess in radians equals its area divided by $R^2$. Our triangle had an excess of 90° ($\frac{\pi}{2}$ radians). What is its area on Earth ($R = 6{,}371$ km), in millions of km²?`,
              unit: 'million km²',
              answer: (Math.PI / 2) * 6371 ** 2 / 1e6,
              relTol: 0.01,
              wrong: [{ v: 90 * 6371 ** 2 / 1e6, relTol: 0.02, why: 'Convert the excess to radians first: 90° = π/2.' }],
              explain: r`$\frac{\pi}{2} \times 6371^2 \approx 64$ million km²: an eighth of Earth's surface. Gauss surveyed a huge triangle of three mountain peaks in the 1820s; legend has it he was checking whether space itself is flat. Within his precision, the angles added up to 180°.`,
            },
            {
              type: 'mcq',
              title: 'A triangle across the universe',
              prompt: r`Cosmologists use the CMB's ripples as a giant triangle: physics predicts their true size, and we measure the angle they cover in the sky. If space were positively curved (like a sphere), how would the spots look compared with flat space?`,
              choices: [
                { t: 'Bigger: positive curvature acts like a magnifying lens over cosmic distances', ok: true },
                { t: 'Smaller', why: 'That would be negative (saddle-shaped) curvature, which spreads light paths apart.' },
                { t: 'The same', why: 'Curvature changes how angles relate to sizes over huge distances.' },
              ],
              explain: r`In a closed universe, light paths converge, so the spots look bigger (about 2° or more); in an open one, smaller. Observations find the typical spot size is close to 1°, exactly as flat space predicts. Space is flat to within about 0.4%.`,
            },
            {
              type: 'numeric',
              title: 'A surveyor’s triangle',
              prompt: r`Gauss's triangle of three mountain peaks enclosed about 3,000 km² of Earth's surface. By how much do the angles of that triangle, drawn on the curved ground, exceed 180°? Use excess $= \frac{\text{area}}{R^2}$ with $R = 6{,}371$ km, and give it in arcseconds (1 radian = 206,265″; 1 decimal place).`,
              unit: '″',
              answer: 3000 / 6371 ** 2 * 206265,
              tol: 0.3,
              wrong: [{ v: 3000 / 6371 ** 2, relTol: 0.03, why: 'That’s the excess in radians. Multiply by 206,265 to get arcseconds.' }],
              explain: r`$\frac{3000}{6371^2} \approx 7.4 \times 10^{-5}$ rad $\approx 15$″, about the width of a coin seen from 300 m. Surveyors of Gauss's day had to correct for exactly this. For a triangle a few metres across, the excess is a hundred-millionth of an arcsecond: curvature only shows up on large scales, which is why cosmologists use triangles billions of light-years across.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Flat but finite?',
              prompt: r`Measurements show space is flat to high precision. Does that prove the universe is infinite?`,
              choices: [
                { t: 'No: flat space could still wrap around like the Asteroids game world (a flat torus), or simply be far bigger than we can see', ok: true },
                { t: 'Yes: flat space must go on forever', why: 'A flat square with its edges glued (a torus) is finite but perfectly flat everywhere.' },
                { t: 'No, because flat space is always finite', why: 'Flat space can be infinite too; the measurements can’t tell which.' },
              ],
              explain: r`Curvature is local geometry; whether space closes up on itself is **topology**. Astronomers have looked for repeated patterns in the CMB that a small wrapped-around universe would produce, and found none, so if it does wrap around, it's bigger than the observable universe. Whether the universe is infinite may never be known.`,
            },
          ],
          recap: [
            'Angle sums of triangles reveal curvature: more than 180° on a sphere, less on a saddle.',
            'CMB spots about 1° across show space is flat to within 0.4%.',
            'Flat space can still be finite, if it wraps around.',
          ],
        },
        {
          id: 'fate',
          title: 'The Fate of the Universe',
          summary: 'Crunch, freeze or something stranger',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'A cosmic tug of war',
              body: r`Matter's gravity slows expansion; dark energy speeds it up. Their balance decides the future. If there's enough matter and little dark energy, expansion stops and reverses into a **Big Crunch**. With less matter, it slows but continues forever. With dark energy, it eventually accelerates, and galaxies drift beyond each other's view.`,
            },
            {
              type: 'interactive',
              title: 'Design a universe',
              body: r`Choose the amount of matter ($\Omega_m$) and dark energy ($\Omega_\Lambda$), measured as fractions of the critical density today. The curve shows the scale factor over time (the dot is "today"). Find a universe that ends in a **Big Crunch**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 3.2, grid: false, height: 300, axes: { xlabel: 'time (billions of years)', ylabel: 'scale factor', xticks: 10, yticks: 1 },
                params: { om: { min: 0.1, max: 3, step: 0.05, value: 0.3, label: 'matter $\\Omega_m$', color: 'blue', format: (v) => v.toFixed(2) }, ol: { min: 0, max: 1.5, step: 0.05, value: 0.7, label: 'dark energy $\\Omega_\\Lambda$', color: 'violet', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => { const H = history(p.om, p.ol), els = [s('path', { d: historyPath(plot, p.om, p.ol, 50), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 })]; if (H.today) els.push(s('circle', { cx: plot.X(H.today * TH), cy: plot.Y(1), r: 7, class: 'fl-coral' })); return els; },
                readout: (p) => { const H = history(p.om, p.ol); return `age today: ${H.today ? (H.today * TH).toFixed(1) + ' billion years' : 'none'} · fate: **${H.crunch ? (H.crunchAt ? `Big Crunch after ${(H.crunchAt * TH).toFixed(0)} billion years` : 'expansion reverses: a Big Crunch, eventually') : 'expands forever'}**`; },
                goal: (p) => history(p.om, p.ol).crunch,
                hint: 'Add lots of matter and remove the dark energy.',
                solution: { om: 3, ol: 0 },
              },
              explain: r`With plenty of matter and no dark energy (say $\Omega_m = 3$), gravity wins: expansion stops and the universe recollapses. Our measured universe ($\Omega_m \approx 0.31$, $\Omega_\Lambda \approx 0.69$) is nowhere near that: it will expand forever, faster and faster. (A cosmological constant that's large enough even prevents a crunch with lots of matter.)`,
            },
            {
              type: 'numeric',
              title: 'The Hubble time',
              prompt: r`The Hubble constant is about 67.7 km/s per megaparsec. Its inverse, $1/H_0$, is a natural timescale for the universe. Given that $1/H_0 = \frac{977.8}{H_0}$ billion years when $H_0$ is in km/s/Mpc, what is it? (1 decimal place.)`,
              unit: 'billion years',
              answer: 977.8 / 67.7,
              tol: 0.06,
              wrong: [{ v: 13.8, tol: 0.05, why: 'That’s the actual age. The Hubble time is 977.8 ÷ 67.7.' }],
              explain: r`$\frac{977.8}{67.7} \approx 14.4$ billion years. It would be the age if the universe had always expanded at today's rate. The true age (13.8) is a little less, because the expansion has slowed down and then sped up over its history, and the two effects nearly cancel.`,
            },
            {
              type: 'mcq',
              title: 'A lonelier sky',
              prompt: r`With accelerating expansion, distant galaxies recede faster and faster. What will astronomers in about 100 billion years see?`,
              choices: [
                { t: 'Only their own merged home galaxy: all other galaxies will have receded beyond view', ok: true },
                { t: 'More galaxies than today, as light from farther away arrives', why: 'Acceleration pushes distant galaxies beyond a horizon from which their light can never reach us.' },
                { t: 'The same sky as today', why: 'Expansion steadily removes distant galaxies from view.' },
              ],
              explain: r`The Milky Way and Andromeda will have merged, along with the rest of our Local Group, and everything else will have redshifted beyond detection. The CMB will be stretched to undetectable radio waves. Future astronomers might never learn that the universe is expanding: we live at a lucky time.`,
            },
            {
              type: 'numeric',
              title: 'Doubling forever',
              prompt: r`If dark energy dominates forever, the universe ends up expanding exponentially with Hubble constant about 56 km/s/Mpc, which means a doubling time of $\frac{\ln 2}{H} \approx$ how many billion years? ($1/H = 17.5$ billion years.)`,
              unit: 'billion years',
              answer: 17.5 * Math.log(2),
              tol: 0.1,
              explain: r`$17.5 \times 0.693 \approx 12.1$ billion years. Every 12 billion years, all large distances double, and distant galaxies slip beyond our cosmic horizon one by one.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The last light',
              prompt: r`Stars will stop forming in about 100 trillion years as gas runs out. After the last red dwarfs fade, what will be among the last things to give off any light?`,
              choices: [
                { t: 'Black holes, evaporating by Hawking radiation over around $10^{67}$ years or more', ok: true },
                { t: 'New stars forming from dark matter', why: 'Dark matter can’t cool and collapse into stars.' },
                { t: 'The cosmic microwave background, brightening again', why: 'It keeps cooling and fading as space expands.' },
              ],
              explain: r`Long after the stars, black holes will slowly evaporate, the smallest first and the supermassive ones last, after more than $10^{100}$ years. Then, if dark energy stays constant, the universe approaches **heat death**: maximum entropy, nearly empty, cold and dark, expanding forever.`,
            },
          ],
          recap: [
            'Matter decelerates expansion; dark energy accelerates it.',
            'Our universe will expand forever, faster and faster.',
            'In the far future, other galaxies vanish from view and the stars burn out.',
          ],
        },
      ],
    },
  ],
};
