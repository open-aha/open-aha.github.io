import { fix } from '../lib/svg.js';
import { r, FS, bars } from './_chem.js';

// ---------- colour from a spectrum ----------
// CIE 1931 colour-matching functions (multi-lobe Gaussian fits, Wyman, Sloan & Shirley 2013)
const gp = (l, m, s1, s2) => Math.exp(-0.5 * ((l - m) / (l < m ? s1 : s2)) ** 2);
const xb = (l) => 1.056 * gp(l, 599.8, 37.9, 31) + 0.362 * gp(l, 442, 16, 26.7) - 0.065 * gp(l, 501.1, 20.4, 26.2);
const yb = (l) => 0.821 * gp(l, 568.8, 46.9, 40.5) + 0.286 * gp(l, 530.9, 16.3, 31.1);
const zb = (l) => 1.217 * gp(l, 437, 11.8, 36) + 0.681 * gp(l, 459, 26, 13.8);
function toXYZ(spec) { let X = 0, Y = 0, Z = 0; for (let l = 380; l <= 730; l += 3) { const v = spec(l); X += v * xb(l); Y += v * yb(l); Z += v * zb(l); } return [X, Y, Z]; }
const linRGB = ([X, Y, Z]) => [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
const WHITE = linRGB(toXYZ(() => 1));
const gam = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const css = (rgb) => `rgb(${rgb.map((c) => Math.round(gam(c) * 255)).join(',')})`;
// what white light looks like after passing through something with transmission T(λ)
const seen = (T) => linRGB(toXYZ(T)).map((c, i) => c / WHITE[i]);
// the hue of an emission spectrum (brightness normalised)
const glow = (E) => { const L = linRGB(toXYZ(E)); const m = Math.max(1e-9, ...L); return L.map((c) => Math.max(0, c) / m); };
const band = (c, w, A) => (l) => A * Math.exp(-0.5 * ((l - c) / w) ** 2);
const transmit = (...bands) => (l) => 10 ** -bands.reduce((t, b) => t + b(l), 0);

// a swatch: test tube or square of colour, with a caption
const swatch = (plot, s, x, y, rgb, label, w = 1.6, hh = 2.2) => [
  s('rect', { x: plot.X(x - w / 2), y: plot.Y(y + hh / 2), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(hh), rx: 12, style: `fill:${css(rgb)}`, stroke: 'var(--ink-3)', 'stroke-width': 2 }),
  label ? s('text', { x: plot.X(x), y: plot.Y(y - hh / 2) + 22, 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: label }) : null,
];
// a rainbow strip across a wavelength axis
function rainbow(plot, s, y0, y1) {
  const out = [];
  for (let l = 380; l < 730; l += 5) out.push(s('rect', { x: plot.X(l), y: plot.Y(y1), width: plot.X(l + 5.5) - plot.X(l), height: plot.Y(y0) - plot.Y(y1), style: `fill:${css(glow((x) => Math.exp(-0.5 * ((x - l - 2.5) / 4) ** 2)))}` }));
  return out;
}

// ---------- conjugated polyenes: λmax against number of C=C (fit to measured values) ----------
const polyene = (k) => 544 - 380 * Math.exp(-(k - 1) / 6.9);

// ---------- flame emission lines [nm, relative strength] ----------
const LINES = {
  Na: [[589, 1]],
  Sr: [[606, 0.5], [636, 0.6], [662, 1], [682, 0.8]],
  Ba: [[513, 0.7], [524, 1], [532, 0.8]],
  Cu: [[428, 0.8], [435, 1], [444, 0.9], [452, 0.7]],
  Li: [[610, 0.1], [671, 1]],
};
const emission = (mix) => (l) => Object.entries(mix).reduce((t, [el, n]) => t + n * LINES[el].reduce((u, [c, a]) => u + a * Math.exp(-0.5 * ((l - c) / 3) ** 2), 0), 0);

// ---------- ligand-field colours of chromium(III) ----------
const LIGANDS = [['Cl⁻', 13600], ['H₂O', 17400], ['NH₃', 21500], ['CN⁻', 26600]];

// ---------- hydrogen's visible lines: jumps down to level 2 (E_n = −13.6/n² eV) ----------
const HLINES = { 3: 656, 4: 486, 5: 434, 6: 410 };
const H_SEQ = [3, 5, 4, 3, 6, 4, 3, 5]; // the jumps, in the order they happen
const hLineCol = (l) => css(glow((x) => Math.exp(-0.5 * ((x - l) / 4) ** 2)));
const H_CYCLE = 1.6; // seconds per excite-and-fall

// ---------- the π electrons as particles in a box: a longer chain, more levels, a smaller gap ----------
const boxK = (t) => Math.min(11, 1 + Math.floor(Math.max(0, t) / 0.9)); // conjugated C=C at time t

// ---------- a Jablonski diagram: absorb at 490 nm, slide down the vibrational ladder, emit at 515 nm ----------
const JAB_COL = (l) => css(glow((x) => Math.exp(-0.5 * ((x - l) / 4) ** 2)));

export default {
  id: 'colour',
  subject: 'physics',
  title: 'The Chemistry of Colour',
  level: 'Intermediate',
  cover: 'colour',
  tagline: 'Why carrots are orange and copper is blue: absorption, flames, dyes, metals, pigments and glow.',
  description: r`Colour is what's left of white light after molecules have taken their share. Every swatch in this course is computed from a real spectrum, the way your eye would see it. Choose which light a solution absorbs and see its colour, mix salts to design a firework, lengthen a chain of double bonds until it turns carrot-orange, swap the molecules around a metal ion to change its colour, mix pigments, make molecules glow, and work out why ultraviolet light burns.`,
  prereq: 'Chemical Bonding, and Light & Optics',
  chapters: [
    {
      title: 'Taking Light Away',
      summary: 'Absorption and complementary colours.',
      lessons: [
        {
          id: 'absorb',
          title: 'Why Things Have Colour',
          summary: 'What’s missing is what you see',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Subtracting from white',
              body: r`White light contains every wavelength from violet (400 nm) to red (700 nm). A molecule that absorbs some of them leaves the rest, and the rest is the colour you see. Absorb in the blue and what's left looks yellow-orange; absorb in the orange and what's left looks blue. The colour you see is roughly the **complement** of the colour absorbed.

Move the absorption band and watch the solution.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 730, ymin: -0.5, ymax: 4, grid: false, height: 300, padL: 20,
                axes: { xticks: 50, yticks: 0, xlabel: 'wavelength (nm)', yAt: -0.5, xAt: 380 },
                params: { c: { min: 400, max: 700, step: 5, value: 450, label: 'Absorbs at', color: 'violet', format: (v) => `${v} nm` } },
                under: ({ plot, s }) => rainbow(plot, s, -0.5, 0),
                curves: [{ f: (l, p) => 2.6 * Math.exp(-0.5 * ((l - p.c) / 30) ** 2), color: 'ink' }],
                extra: ({ plot, p, s }) => swatch(plot, s, 680, 2.6, seen(transmit(band(p.c, 30, 1.2))), 'looks like'),
                readout: (p) => `absorbs ${p.c} nm`,
              },
            },
            {
              type: 'interactive',
              title: 'Make it blue',
              prompt: r`Copper sulfate solution looks blue. Where must it absorb? Move the band until the solution looks clearly blue.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 730, ymin: -0.5, ymax: 4, grid: false, height: 300, padL: 20,
                axes: { xticks: 50, yticks: 0, xlabel: 'wavelength (nm)', yAt: -0.5, xAt: 380 },
                params: { c: { min: 400, max: 700, step: 5, value: 450, label: 'Absorbs at', color: 'violet', format: (v) => `${v} nm` } },
                under: ({ plot, s }) => rainbow(plot, s, -0.5, 0),
                curves: [{ f: (l, p) => 2.6 * Math.exp(-0.5 * ((l - p.c) / 30) ** 2), color: 'ink' }],
                extra: ({ plot, p, s }) => swatch(plot, s, 680, 2.6, seen(transmit(band(p.c, 30, 1.2))), 'looks like'),
                readout: (p) => `absorbs ${p.c} nm`,
                goal: (p) => (p.c >= 585 && p.c <= 640 ? true : { ok: false, msg: p.c < 585 ? 'Not blue yet. Blue is what’s left when the orange-red end is removed.' : 'Too far into the red: it looks cyan-green.' }),
                solution: { c: 610 },
              },
              explain: r`Absorbing orange light (around 600 nm) leaves mostly blue and green, which looks blue. Copper sulfate's band actually peaks further out, near 800 nm in the near infrared, with a tail through the red, which is why it's a paler, sky blue.`,
            },
            {
              type: 'mcq',
              title: 'Green leaves',
              prompt: 'Chlorophyll absorbs strongly in the blue (430 nm) and the red (660 nm). Why do leaves look green?',
              choices: [
                { t: 'Green, in the middle, is the light left over', ok: true },
                { t: 'Chlorophyll absorbs green light', why: 'If it absorbed green, green would be missing.' },
                { t: 'Leaves emit green light', why: 'Leaves reflect; they don’t glow (in visible light).' },
              ],
              explain: r`Absorb both ends of the spectrum and the middle, green, is left. Plants waste green light: one reason photosynthesis is only a few percent efficient.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Energy of a colour',
              prompt: r`A dye absorbs at 600 nm. What energy, in electronvolts, does each absorbed photon carry? ($E \approx 1240 / \lambda$ eV with $\lambda$ in nm.)`,
              unit: 'eV',
              answer: 2.07,
              tol: 0.01,
              explain: r`$1240 / 600 = 2.07$ eV. Visible light spans about 1.8 to 3.1 eV, just the right range to lift electrons between molecular orbitals that are close together.`,
            },
          ],
          recap: [
            'Colour = white light minus what is absorbed (roughly the complementary colour).',
            'E (eV) ≈ 1240 / λ (nm).',
          ],
        },
        {
          id: 'flames',
          title: 'Flames & Fireworks',
          summary: 'Atoms that emit',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Excited atoms',
              body: r`Heat a metal salt in a flame and its atoms' electrons jump to higher levels, then fall back, emitting light at a few exact wavelengths: a **line spectrum** that is a fingerprint of the element. Sodium's line at 589 nm gives street lamps (and burnt soup) their orange-yellow; strontium glows red, barium green, copper blue.`,
              widget: bars([['Li', 671, 'coral'], ['Sr', 662, 'coral'], ['Na', 589, 'amber'], ['Ba', 524, 'teal'], ['Cu', 435, 'blue']], { ymax: 750, yticks: 150, ylabel: 'main wavelength (nm)', height: 260 }),
            },
            { /*chemanim:colour.flames*/
              type: 'explain',
              kicker: 'Explore',
              title: 'One jump, one colour',
              body: r`Hydrogen, the simplest atom, shows the idea cleanly. Its electron can only sit on certain levels. A collision in the hot gas kicks it up; when it falls back to level 2 it gives out one photon whose energy is exactly the gap. Watch the spectrum fill in.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.2, grid: false, axes: false, height: 330,
                animate: { param: 't', speed: 1, max: H_SEQ.length * H_CYCLE, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  const EY = (n) => 1.9 + 4.0 * (1 - 4 / (n * n)) * (n > 2 ? 1 : 0); // level 2 at the bottom of the ladder, 6 near the top
                  for (let n = 2; n <= 6; n++) {
                    out.push(s('line', { x1: X(0.8), x2: X(4.6), y1: Y(EY(n)), y2: Y(EY(n)), stroke: 'var(--ink-2)', 'stroke-width': 2 }));
                    if (n < 6) out.push(s('text', { x: X(0.6), y: Y(EY(n)) + 4, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(11)}`, text: `n=${n}` }));
                    else out.push(s('text', { x: X(4.75), y: Y(EY(n)) + 4, class: 'lbl', style: `fill:var(--ink-3);${FS(11)}`, text: 'n=6' }));
                  }
                  const i = Math.min(H_SEQ.length - 1, Math.floor(t / H_CYCLE)), u = t / H_CYCLE - i, n = H_SEQ[i], lx = 1.4 + (i % 4) * 0.9;
                  // up (a collision), wait, down (a photon)
                  let ey = EY(2);
                  if (u < 0.25) ey = EY(2) + (EY(n) - EY(2)) * (u / 0.25);
                  else if (u < 0.5) ey = EY(n);
                  else if (u < 0.7) ey = EY(n) + (EY(2) - EY(n)) * ((u - 0.5) / 0.2);
                  out.push(s('line', { x1: X(lx), x2: X(lx), y1: Y(EY(2)), y2: Y(EY(n)), stroke: u < 0.5 ? 'var(--ink-3)' : hLineCol(HLINES[n]), 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
                  out.push(s('circle', { cx: X(lx), cy: Y(ey), r: 7, fill: 'var(--blue)' }));
                  if (u >= 0.6 && u < 1) {
                    // the photon flies off to the right as a wiggle
                    const x0 = 4.8 + (u - 0.6) * 9, col = hLineCol(HLINES[n]), y0 = (EY(n) + EY(2)) / 2;
                    let d = '';
                    for (let k = 0; k <= 30; k++) d += `${k ? 'L' : 'M'}${X(x0 + k * 0.04).toFixed(1)} ${Y(y0 + 0.18 * Math.sin(k * 0.9)).toFixed(1)}`;
                    out.push(s('path', { d, fill: 'none', stroke: col, 'stroke-width': 3 }));
                  }
                  // the spectrum: a line appears once that jump has happened
                  const SX = (l) => 0.9 + ((l - 380) / 350) * 8.4;
                  out.push(s('rect', { x: X(0.9), y: Y(1.2), width: X(9.3) - X(0.9), height: Y(0.5) - Y(1.2), fill: '#0b0d12', rx: 4 }));
                  const seenLines = new Set(H_SEQ.slice(0, i + (u >= 0.7 ? 1 : 0)));
                  for (const m of seenLines) {
                    const l = HLINES[m];
                    out.push(s('rect', { x: X(SX(l)) - 2.5, y: Y(1.2), width: 5, height: Y(0.5) - Y(1.2), style: `fill:${hLineCol(l)}` }));
                    out.push(s('text', { x: X(SX(l)), y: Y(0.5) + 15, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: `${l}` }));
                  }
                  out.push(s('text', { x: X(9.3), y: Y(1.2) - 6, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(11)}`, text: 'wavelength (nm) →' }));
                  return out;
                },
                readout: (p) => {
                  const i = Math.min(H_SEQ.length - 1, Math.floor(p.t / H_CYCLE)), n = H_SEQ[i];
                  return `Jump from level ${n} to level 2: a ${HLINES[n]} nm photon`;
                },
              },
              after: r`Only four visible lines ever appear, however long you watch: red 656, cyan 486, blue 434 and violet 410 nm, because only four gaps from higher levels down to level 2 fall in the visible. Bigger jumps give bluer photons (falls all the way to level 1 give ultraviolet). Each element has its own ladder of levels, so its own set of lines: a barcode that identifies it in a flame, a firework or a distant star.`,
            },
            {
              type: 'interactive',
              title: 'Design a firework',
              prompt: r`Mix salts to make a **purple** firework. (Watch out: sodium's yellow swamps everything.)`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 730, ymin: -0.6, ymax: 4, grid: false, height: 320, padL: 20, stackSliders: true,
                axes: { xticks: 50, yticks: 0, xlabel: 'wavelength (nm)', yAt: -0.6, xAt: 380 },
                params: {
                  Sr: { min: 0, max: 3, step: 1, value: 0, label: 'Strontium', color: 'coral' },
                  Ba: { min: 0, max: 3, step: 1, value: 1, label: 'Barium', color: 'teal' },
                  Cu: { min: 0, max: 3, step: 1, value: 0, label: 'Copper', color: 'blue' },
                  Na: { min: 0, max: 3, step: 1, value: 1, label: 'Sodium', color: 'amber' },
                },
                under: ({ plot, s }) => rainbow(plot, s, -0.6, -0.1),
                curves: [{ f: (l, p) => 0.9 * emission({ Sr: p.Sr, Ba: p.Ba, Cu: p.Cu, Na: p.Na * 2 })(l), color: 'ink', n: 500 }],
                extra: ({ plot, p, s }) => { const tot = p.Sr + p.Ba + p.Cu + p.Na; return tot ? [s('circle', { cx: plot.X(660), cy: plot.Y(2.9), r: 34, style: `fill:${css(glow(emission({ Sr: p.Sr, Ba: p.Ba, Cu: p.Cu, Na: p.Na * 2 })))}`, stroke: 'var(--ink-3)', 'stroke-width': 2 })] : []; },
                readout: (p) => (p.Sr + p.Ba + p.Cu + p.Na ? 'The circle shows the mixed colour.' : 'Add some salts.'),
                goal: (p) => {
                  const [R, G, B] = glow(emission({ Sr: p.Sr, Ba: p.Ba, Cu: p.Cu, Na: p.Na * 2 }));
                  if (p.Sr + p.Ba + p.Cu + p.Na === 0) return { ok: false, msg: 'Add some salts.' };
                  return R > 0.55 && B > 0.55 && G < 0.3 ? true : { ok: false, msg: G >= 0.3 ? 'Too much yellow or green in the mix.' : 'Purple needs both red and blue.' };
                },
                solution: { Sr: 2, Ba: 0, Cu: 2, Na: 0 },
              },
              explain: r`Strontium (red) plus copper (blue), with no sodium or barium. Purple is the hardest firework colour: copper compounds break down in hot flames, and a trace of sodium contamination turns everything yellowish.`,
            },
            {
              type: 'numeric',
              title: 'The sodium photon',
              prompt: r`What is the energy of a 589 nm photon in eV? (Two decimal places.)`,
              unit: 'eV',
              answer: 2.11,
              tol: 0.01,
              explain: r`$1240 / 589 = 2.11$ eV: exactly the gap between sodium's 3s and 3p levels.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Helium from the Sun',
              prompt: 'In 1868, astronomers saw a yellow line at 587.6 nm in sunlight that matched no known element. What did it turn out to be?',
              choices: [
                { t: 'Helium, discovered in the Sun before it was found on Earth', ok: true },
                { t: 'Sodium', why: 'Sodium’s lines are at 589.0 and 589.6 nm: close, but measurably different.' },
                { t: 'A fault in the telescope', why: 'The line was real and reproducible.' },
              ],
              explain: r`Named from Greek *helios*, the Sun, helium was found on Earth only in 1895. Line spectra are so exact that they identify elements across the universe.`,
            },
          ],
          recap: [
            'Hot atoms emit sharp lines: element fingerprints.',
            'Fireworks: Sr red, Na yellow, Ba green, Cu blue.',
          ],
        },
      ],
    },
    {
      title: 'Molecules with Colour',
      summary: 'Dyes, metals and pigments.',
      lessons: [
        {
          id: 'conjugation',
          title: 'Conjugated Dyes',
          summary: 'Longer chains, longer wavelengths',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'Electrons on a longer track',
              body: r`In a chain of alternating single and double bonds (a **conjugated** system), the π electrons spread along the whole chain, like particles in a box. A longer box means more closely spaced energy levels, so the gap between the highest filled and the lowest empty orbital shrinks, and the molecule absorbs **longer** wavelengths.

Ethene (one C=C) absorbs only in the far ultraviolet. Add double bonds and the absorption marches towards the visible:`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 150, ymax: 520, height: 300, grid: false,
                axes: { xticks: 1, yticks: 50, xlabel: 'conjugated C=C bonds', ylabel: 'λ absorbed (nm)', yAt: 150, xAt: 0 },
                curves: [{ f: (k) => polyene(k), color: 'violet', from: 1, to: 11.5 }, { f: () => 400, color: 'muted', dash: true }],
                points: [[1, 165], [2, 217], [3, 258], [4, 290], [5, 334], [6, 364], [8, 410], [11, 452]].map(([k, v]) => ({ x: () => k, y: () => v, color: 'coral' })),
                extra: ({ plot, s }) => [s('text', { x: plot.X(0.3), y: plot.Y(400) - 8, class: 'lbl halo-text', style: `fill:var(--ink-3);${FS(13)}`, text: 'visible light starts' })],
              },
              after: r`The dots are measured values for polyenes; the curve is a fit. Around eight to ten conjugated double bonds the absorption enters the visible.`,
            },
            { /*chemanim:colour.conjugation*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Stretch the box',
              body: r`Each extra double bond lengthens the box and adds two more π electrons. The energy levels of a particle in a box go as $n^2/L^2$: stretch the box and every level drops and crowds closer together. Electrons fill the levels two at a time. Watch the gap between the top filled level and the first empty one.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.4, grid: false, axes: false, height: 340,
                animate: { param: 't', speed: 0.9, max: 10.5, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], k = boxK(p.t), N = 2 * k, L = N + 1;
                  // the chain: 2k carbons, alternating double and single bonds
                  const step = 8.6 / 22, x0 = 5 - (step * (N - 1)) / 2;
                  for (let j = 0; j < N - 1; j++) {
                    const xa = x0 + j * step, xb = xa + step, ya = 5.75 + (j % 2 ? 0.18 : -0.18), yb = 5.75 + (j % 2 ? -0.18 : 0.18);
                    out.push(s('line', { x1: X(xa), y1: Y(ya), x2: X(xb), y2: Y(yb), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                    if (j % 2 === 0) {
                      // the second line of a double bond: parallel, on the inside of the zig-zag, a little shorter
                      const px = X(xa), py = Y(ya), qx = X(xb), qy = Y(yb), len = Math.hypot(qx - px, qy - py), nx = (-(qy - py) / len) * 6, ny = ((qx - px) / len) * 6;
                      out.push(s('line', { x1: px + nx + (qx - px) * 0.15, y1: py + ny + (qy - py) * 0.15, x2: qx + nx - (qx - px) * 0.15, y2: qy + ny - (qy - py) * 0.15, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                    }
                  }
                  // the box and its levels (E ∝ n²/L²), scaled so ethene's first empty level sits near the top
                  const EY = (n) => 0.45 + (4.5 * (n * n) / (L * L)) / (4 / 9);
                  const bx0 = 5 - (step * N) / 2 - 0.1, bx1 = 5 + (step * N) / 2 + 0.1;
                  out.push(s('path', { d: `M${X(bx0)} ${Y(5.15)}V${Y(0.35)}H${X(bx1)}V${Y(5.15)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  for (let n = 1; n <= k + 1; n++) {
                    const filled = n <= k, y = EY(n);
                    out.push(s('line', { x1: X(bx0 + 0.15), x2: X(bx1 - 0.15), y1: Y(y), y2: Y(y), stroke: filled ? 'var(--blue)' : 'var(--coral)', 'stroke-width': 2 }));
                    if (filled) for (const dx of [-0.12, 0.12]) out.push(s('circle', { cx: X(5 + dx), cy: Y(y), r: 3.5, fill: 'var(--blue)' }));
                  }
                  const yH = EY(k), yL = EY(k + 1);
                  out.push(s('line', { x1: X(bx1 + 0.35), x2: X(bx1 + 0.35), y1: Y(yH), y2: Y(yL), stroke: 'var(--violet)', 'stroke-width': 3 }));
                  out.push(s('text', { x: X(bx1 + 0.5), y: Y((yH + yL) / 2) + 5, class: 'lbl halo-text', style: `fill:var(--violet);${FS(13)}`, text: 'gap' }));
                  return out;
                },
                readout: (p) => {
                  const k = boxK(p.t);
                  return `${k} conjugated C=C · ${2 * k} π electrons · absorbs at about ${fix(polyene(k), 0)} nm (measured)`;
                },
              },
              after: r`Two things happen at once as the chain grows: the levels sink and crowd together ($1/L^2$), and there are more electrons to fill them, so the top filled level climbs the ladder. The net effect is a shrinking gap between the highest filled orbital and the lowest empty one, so smaller photons, of longer wavelength, are enough to lift an electron. The simple box overdoes the effect (real chains have alternating bond lengths), so the wavelengths quoted are measured ones, but the trend is exactly right.`,
            },
            {
              type: 'interactive',
              title: 'Carrot orange',
              prompt: r`β-carotene, the pigment of carrots, absorbs blue light near 450 nm. Lengthen the chain until the molecule looks orange.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 230,
                params: { k: { min: 1, max: 12, step: 1, value: 3, label: 'C=C bonds', control: 'slider' } },
                extra: ({ plot, p, s }) => {
                  const out = [], n = 2 * p.k, dx = Math.min(0.5, 8.4 / n);
                  let d = `M${plot.X(0.8)} ${plot.Y(3.6)}`;
                  for (let i = 1; i <= n; i++) d += `L${plot.X(0.8 + i * dx)} ${plot.Y(i % 2 ? 4.2 : 3.6)}`;
                  out.push(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                  for (let i = 0; i < n; i += 2) {
                    const x1 = 0.8 + i * dx, y1 = 3.6, x2 = 0.8 + (i + 1) * dx, y2 = 4.2, ox = 0.06, oy = -0.18;
                    out.push(s('line', { x1: plot.X(x1 + ox), y1: plot.Y(y1 + oy), x2: plot.X(x2 + ox), y2: plot.Y(y2 + oy), stroke: 'var(--ink)', 'stroke-width': 3 }));
                  }
                  out.push(...swatch(plot, s, 5, 1.4, seen(transmit(band(polyene(p.k), 35, 1.4))), null, 3.2, 1.6));
                  return out;
                },
                readout: (p) => `${p.k} conjugated C=C · absorbs at **${fix(polyene(p.k), 0)} nm**`,
                goal: (p) => (polyene(p.k) >= 440 && polyene(p.k) <= 470 ? true : { ok: false, msg: polyene(p.k) < 440 ? 'Still absorbing too far towards the ultraviolet: the colour is too pale.' : 'Now it absorbs too far into the green: it looks red.' }),
                solution: { k: 11 },
              },
              explain: r`Eleven conjugated double bonds: β-carotene's chain absorbs blue-violet light (about 450 nm), leaving yellow, orange and red. Lycopene, the red of tomatoes, has the same chain length but absorbs a little further out.`,
            },
            {
              type: 'mcq',
              title: 'Seeing in colour',
              prompt: 'Retinal, the molecule in your eye, absorbs visible light only when bound to its protein. On its own it absorbs at 380 nm. What does binding probably do?',
              choices: [
                { t: 'It spreads the π electrons further, shifting absorption to longer wavelengths', ok: true },
                { t: 'It breaks the conjugated chain', why: 'Breaking conjugation would push absorption further into the UV.' },
                { t: 'It makes retinal emit light', why: 'Vision relies on absorption, followed by a shape change.' },
              ],
              explain: r`Retinal binds through a nitrogen that becomes positively charged, extending the conjugation; the protein's surroundings then tune the absorption to 420 nm (blue cones), 530 (green), 560 (red) or 500 nm (rods). Same molecule, four colours.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Shrinking gap',
              prompt: r`Using $E \approx 1240/\lambda$ eV, by how much (in eV) does the energy gap shrink going from butadiene (217 nm) to β-carotene (452 nm)? (Two decimal places.)`,
              unit: 'eV',
              answer: 2.97,
              tol: 0.02,
              explain: r`$1240/217 = 5.71$ eV; $1240/452 = 2.74$ eV. The gap shrinks by about 2.97 eV, more than half, as the box gets longer.`,
            },
          ],
          recap: [
            'Conjugated π electrons behave like particles in a box.',
            'Longer conjugation → smaller gap → longer wavelength absorbed.',
            '~10 conjugated C=C reach the visible (carrots, tomatoes).',
          ],
        },
        {
          id: 'metals',
          title: 'Transition-Metal Colours',
          summary: 'Splitting the d orbitals',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Ligands split the levels',
              body: r`A transition-metal ion in solution is surrounded by molecules or ions called **ligands** (water, ammonia, chloride...). Their electrons push on the metal's five d orbitals unevenly, splitting them into two groups separated by an energy $\Delta$. An electron jumping across that gap absorbs light of wavelength $\lambda = hc/\Delta$, and the complex is coloured.

Different ligands split the levels by different amounts (the **spectrochemical series**): roughly $\mathrm{I^- < Cl^- < H_2O < NH_3 < CN^-}$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 260,
                params: { L: { min: 0, max: 3, step: 1, value: 1, label: 'Ligand', format: (v) => LIGANDS[v][0] } },
                extra: ({ plot, p, s }) => {
                  const D = LIGANDS[p.L][1], lam = 1e7 / D, gap = 0.8 + (D - 12000) / 6000;
                  const out = [];
                  const lvl = (x, y, n) => { for (let k = 0; k < n; k++) out.push(s('line', { x1: plot.X(x + k * 0.8), x2: plot.X(x + k * 0.8 + 0.6), y1: plot.Y(y), y2: plot.Y(y), stroke: 'var(--ink)', 'stroke-width': 4 })); };
                  lvl(0.6, 1.0, 3); lvl(1.0, 1.0 + gap, 2);
                  out.push(s('path', { d: `M${plot.X(3.4)} ${plot.Y(1.0)}V${plot.Y(1.0 + gap) + 6}`, stroke: 'var(--violet)', 'stroke-width': 3, 'marker-end': 'url(#arrow-violet)' }));
                  out.push(s('text', { x: plot.X(3.6), y: plot.Y(1 + gap / 2) + 5, class: 'lbl', style: `fill:var(--violet);${FS(15)}`, text: 'Δ' }));
                  out.push(...swatch(plot, s, 7.4, 2.6, seen(transmit(band(lam, 45, 1.1))), `absorbs ${fix(lam, 0)} nm`, 2.6, 2.6));
                  return out;
                },
                readout: (p) => `[Cr(${LIGANDS[p.L][0]})₆]: Δ = ${LIGANDS[p.L][1].toLocaleString('en')} cm⁻¹`,
              },
              after: r`Chromium(III) with six of each ligand. (Real spectra have two bands; one is shown.)`,
            },
            {
              type: 'interactive',
              title: 'Make it yellow',
              prompt: r`Which ligand makes the chromium complex absorb blue light (440–480 nm), so that it looks yellow-orange?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 200,
                params: { L: { min: 0, max: 3, step: 1, value: 1, label: 'Ligand', format: (v) => LIGANDS[v][0] } },
                extra: ({ plot, p, s }) => swatch(plot, s, 5, 2.6, seen(transmit(band(1e7 / LIGANDS[p.L][1], 45, 1.1))), `absorbs ${fix(1e7 / LIGANDS[p.L][1], 0)} nm`, 3, 2.6),
                readout: (p) => `with ${LIGANDS[p.L][0]}`,
                goal: (p) => { const lam = 1e7 / LIGANDS[p.L][1]; return lam >= 440 && lam <= 480 ? true : { ok: false, msg: lam > 480 ? 'Absorbing too far towards the red: you need a stronger-field ligand.' : 'That absorbs mostly ultraviolet: too pale.' }; },
                solution: { L: 2 },
              },
              explain: r`Ammonia: $\Delta = 21{,}500$ cm⁻¹ means $\lambda = 10^7/21{,}500 = 465$ nm, absorbing blue and leaving yellow. $\mathrm{[Cr(NH_3)_6]^{3+}}$ salts are indeed yellow, while $\mathrm{[Cr(H_2O)_6]^{3+}}$ is violet.`,
            },
            {
              type: 'mcq',
              title: 'Deeper blue',
              prompt: 'Add ammonia to pale blue copper sulfate solution and it turns deep royal blue. Why?',
              choices: [
                { t: 'Ammonia replaces water around Cu²⁺, increasing Δ and shifting absorption from the near-infrared into the orange', ok: true },
                { t: 'Ammonia is blue', why: 'Ammonia solution is colourless.' },
                { t: 'The copper is oxidised', why: 'It stays Cu²⁺; only its ligands change.' },
              ],
              explain: r`$\mathrm{[Cu(H_2O)_6]^{2+}}$ absorbs mostly beyond 700 nm, so it's a pale blue. $\mathrm{[Cu(NH_3)_4(H_2O)_2]^{2+}}$ absorbs strongly near 600 nm (orange), which leaves an intense blue.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Colourless zinc',
              prompt: r`Zinc(II) compounds are white or colourless, although zinc is next to copper. Zn²⁺ has a full set of ten d electrons. Why no colour?`,
              choices: [
                { t: 'Every d orbital is full, so no electron can jump across the gap', ok: true },
                { t: 'Zinc has no d orbitals', why: 'It has them, all filled.' },
                { t: 'Zinc ions absorb all colours equally', why: 'They absorb no visible light at all.' },
              ],
              explain: r`A d–d jump needs an empty space in the upper set. With $d^{10}$ (Zn²⁺) or $d^0$ (Sc³⁺, Ti⁴⁺) there's nowhere to jump, so those ions are colourless. Titanium dioxide, $d^0$, is the brilliant white of paint.`,
            },
          ],
          recap: [
            'Ligands split metal d orbitals by Δ; λ = hc/Δ is absorbed.',
            'Stronger-field ligands (NH₃, CN⁻) → bigger Δ → shorter λ absorbed.',
            'd⁰ and d¹⁰ ions are colourless.',
          ],
        },
        {
          id: 'pigments',
          title: 'Mixing Pigments',
          summary: 'Subtractive colour',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Each one takes a bite',
              body: r`Mixing paints is **subtractive**: each pigment absorbs its own part of the spectrum, and only light that escapes all of them reaches your eye. The transmissions multiply. Yellow (absorbs blue) and cyan (absorbs red) leave just the green between: that's why blue and yellow paint make green.`,
            },
            {
              type: 'interactive',
              title: 'Mix a green',
              prompt: r`Mix yellow and cyan pigment until the paint is a clear green.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 730, ymin: -0.6, ymax: 3, grid: false, height: 300, padL: 20, stackSliders: true,
                axes: { xticks: 50, yticks: 0, xlabel: 'wavelength (nm)', yAt: -0.6, xAt: 380 },
                params: {
                  y: { min: 0, max: 2, step: 0.1, value: 0.2, label: 'Yellow', color: 'amber' },
                  c: { min: 0, max: 2, step: 0.1, value: 1.4, label: 'Cyan', color: 'teal' },
                },
                under: ({ plot, s }) => rainbow(plot, s, -0.6, -0.1),
                curves: [{ f: (l, p) => 2 * transmit(band(440, 35, p.y), band(640, 45, p.c))(l), color: 'ink' }],
                extra: ({ plot, p, s }) => swatch(plot, s, 680, 2.62, seen(transmit(band(440, 35, p.y), band(640, 45, p.c))), null, 70, 0.6),
                readout: () => 'black curve: light that gets through both pigments',
                goal: (p) => { const [R, G, B] = seen(transmit(band(440, 35, p.y), band(640, 45, p.c))); return G > 0.35 && R < 0.5 * G && B < 0.5 * G ? true : { ok: false, msg: B >= 0.5 * G ? 'Too blue: more yellow pigment.' : R >= 0.5 * G ? 'Too much red getting through: more cyan.' : 'Too dark.' }; },
                solution: { y: 1.2, c: 1.4 },
              },
              explain: r`With enough of both, only the middle of the spectrum survives: green. Printers mix cyan, magenta and yellow inks on the same principle; each ink removes one third of the spectrum.`,
            },
            {
              type: 'mcq',
              title: 'All three',
              prompt: 'What happens if you mix plenty of cyan, magenta and yellow pigment?',
              choices: [
                { t: 'Nearly black: almost every wavelength is absorbed by one of them', ok: true },
                { t: 'White', why: 'That’s mixing coloured lights (additive). Pigments subtract.' },
                { t: 'Grey-green', why: 'Magenta removes the green that would otherwise survive.' },
              ],
              explain: r`Each subtracts a third of the spectrum; together they leave almost nothing: a muddy near-black. (Printers add a real black ink, K in CMYK, for crisp blacks.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The first synthetic blue',
              prompt: 'Prussian blue, the first modern synthetic pigment (Berlin, about 1706), is iron(II) and iron(III) bound together through cyanide. Where does its intense colour come from?',
              choices: [
                { t: 'An electron hopping from Fe(II) to a neighbouring Fe(III) absorbs orange-red light', ok: true },
                { t: 'A long conjugated carbon chain', why: 'Prussian blue is inorganic: no polyene chains.' },
                { t: 'Copper impurities', why: 'It’s pure iron cyanide.' },
              ],
              explain: r`This **intervalence charge transfer** absorbs strongly around 700 nm, giving a deep blue that is far more intense than ordinary d–d colours. Before it, blue pigments came from ground lapis lazuli (ultramarine), worth more than gold.`,
            },
          ],
          recap: [
            'Pigments subtract: their transmissions multiply.',
            'Yellow + cyan → green; C + M + Y → nearly black.',
          ],
        },
      ],
    },
    {
      title: 'Light Back Out',
      summary: 'Glowing molecules and UV.',
      lessons: [
        {
          id: 'glow',
          title: 'Glowing Molecules',
          summary: 'Fluorescence and chemiluminescence',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'In blue, out green',
              body: r`Some molecules, after absorbing light, give part of the energy back as light: **fluorescence**. A little energy is always lost to vibrations first, so the emitted light has a **longer** wavelength than the absorbed light (the **Stokes shift**). Fluorescein (in highlighter pens and tracing dyes) absorbs blue near 490 nm and emits green near 515 nm.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 730, ymin: -0.5, ymax: 1.2, grid: false, height: 260, padL: 20,
                axes: { xticks: 50, yticks: 0, xlabel: 'wavelength (nm)', yAt: -0.5, xAt: 380 },
                under: ({ plot, s }) => rainbow(plot, s, -0.5, -0.05),
                curves: [{ f: (l) => Math.exp(-0.5 * ((l - 490) / 18) ** 2), color: 'blue' }, { f: (l) => 0.85 * gp(l, 515, 14, 28), color: 'teal' }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(455), y: plot.Y(1.05), 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'absorbed' }), s('text', { x: plot.X(570), y: plot.Y(0.75), 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--teal);${FS(13)}`, text: 'emitted' })],
              },
            },
            { /*chemanim:colour.glow*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Where the energy goes',
              body: r`Each electronic level of a molecule comes with a ladder of **vibrational** levels: the molecule can also be shaking. Follow fluorescein through one cycle of absorbing and emitting light.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 5, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], u = (p.t % 5) / 5;
                  const S0 = 0.9, S1 = 4.0, vib = 0.18;
                  // the two electronic levels, each with its vibrational ladder
                  for (const [base, name] of [[S0, 'ground state'], [S1, 'excited state']]) {
                    for (let v = 0; v < 5; v++) out.push(s('line', { x1: X(2.2), x2: X(7.8), y1: Y(base + v * vib), y2: Y(base + v * vib), stroke: 'var(--ink-2)', 'stroke-width': v ? 1 : 2.5, 'stroke-opacity': v ? 0.5 : 1 }));
                    out.push(s('text', { x: X(2.05), y: Y(base) + 4, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: name }));
                  }
                  const blue = JAB_COL(490), green = JAB_COL(515);
                  // phases: absorb (u 0–0.2), relax down the ladder (0.2–0.55), wait (0.55–0.65), emit (0.65–0.85), relax again (0.85–1)
                  let ex = 3.4, ey = S0;
                  if (u < 0.2) { ey = S0 + (S1 + 2 * vib - S0) * (u / 0.2); }
                  else if (u < 0.55) { const f = (u - 0.2) / 0.35; ex = 3.4 + 1.2 * f; ey = S1 + 2 * vib * (1 - Math.floor(f * 2.999) / 2); }
                  else if (u < 0.65) { ex = 4.6; ey = S1; }
                  else if (u < 0.85) { const f = (u - 0.65) / 0.2; ex = 4.6 + 1.0 * f; ey = S1 + (S0 + 2 * vib - S1) * f; }
                  else { const f = (u - 0.85) / 0.15; ex = 5.6; ey = S0 + 2 * vib * (1 - Math.floor(f * 2.999) / 2); }
                  // arrows already travelled
                  if (u >= 0.2) out.push(s('line', { x1: X(3.4), x2: X(3.4), y1: Y(S0), y2: Y(S1 + 2 * vib), stroke: blue, 'stroke-width': 4 }));
                  if (u >= 0.85) out.push(s('line', { x1: X(5.6), x2: X(5.6), y1: Y(S1), y2: Y(S0 + 2 * vib), stroke: green, 'stroke-width': 4 }));
                  out.push(s('circle', { cx: X(ex), cy: Y(ey), r: 7, fill: 'var(--ink)' }));
                  // incoming and outgoing photons
                  const wig = (xA, yA, col) => {
                    let d = '';
                    for (let k = 0; k <= 26; k++) d += `${k ? 'L' : 'M'}${X(xA + k * 0.045).toFixed(1)} ${Y(yA + 0.16 * Math.sin(k * 0.95)).toFixed(1)}`;
                    out.push(s('path', { d, fill: 'none', stroke: col, 'stroke-width': 3 }));
                  };
                  if (u < 0.2) wig(0.4 + 1.6 * (u / 0.2), 2.6, blue);
                  if (u >= 0.65 && u < 1) wig(6.3 + 2.3 * ((u - 0.65) / 0.35), 2.6, green);
                  out.push(s('text', { x: X(1.0), y: Y(3.2), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--blue);${FS(12)}`, text: 'in: 490 nm' }));
                  out.push(s('text', { x: X(8.9), y: Y(3.2), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--success);${FS(12)}`, text: 'out: 515 nm' }));
                  return out;
                },
                readout: (p) => {
                  const u = (p.t % 5) / 5;
                  return u < 0.2 ? 'A blue photon lifts an electron, and the molecule starts shaking.' : u < 0.65 ? 'Within picoseconds the shaking is passed on as heat.' : u < 0.85 ? 'A few nanoseconds later: a green photon, smaller than the blue one.' : 'Back in the ground state, shaking a little; that heat goes too.';
                },
              },
              after: r`The {blue:absorption arrow} is longer than the {success:emission arrow}: some energy leaks away as vibration (heat) at both ends, so the light that comes out always has less energy, and a longer wavelength, than the light that went in. That difference is the Stokes shift (drawn much bigger here than fluorescein's 5% so you can see the steps). It is what makes fluorescence so useful: filters can block the blue light shining in and pass only the green glow coming out.`,
            },
            {
              type: 'numeric',
              title: 'Energy lost',
              prompt: r`Green fluorescent protein (GFP), from jellyfish, in the form used in most labs absorbs at 488 nm and emits at 509 nm. What percentage of each photon's energy is lost as heat? (One decimal place.)`,
              unit: '%',
              answer: 4.1,
              tol: 0.1,
              explain: r`Energy is proportional to $1/\lambda$, so the emitted photon has $488/509 = 0.959$ of the energy: 4.1% is lost. GFP, now used to light up cells in millions of experiments, won the 2008 Nobel Prize.`,
            },
            {
              type: 'mcq',
              title: 'Invisible to visible',
              prompt: 'Why do white shirts glow bluish under a UV lamp, and look “whiter than white” in daylight?',
              choices: [
                { t: 'Washing powders contain optical brighteners that absorb UV and fluoresce blue', ok: true },
                { t: 'Cotton itself fluoresces', why: 'Cotton tends to look slightly yellow; the brightener adds blue light to cancel it.' },
                { t: 'UV light reflects as blue', why: 'Reflection doesn’t change wavelength. The molecule absorbs and re-emits.' },
              ],
              explain: r`The brighteners turn invisible ultraviolet into visible blue, which cancels fabric's yellowish tinge and adds extra light. More light out than visible light in: "whiter than white".`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Light without light',
              prompt: 'A glow stick glows after you bend it, with no light shining on it. Where does the energy come from?',
              choices: [
                { t: 'A chemical reaction leaves a dye molecule excited, and it emits light: chemiluminescence', ok: true },
                { t: 'Stored sunlight', why: 'It glows just as well straight out of a dark packet.' },
                { t: 'Heat from bending', why: 'The stick stays cool; the energy is chemical.' },
              ],
              explain: r`Bending breaks an inner vial; hydrogen peroxide reacts with an oxalate ester, and the energy released passes to a fluorescent dye, which emits. Fireflies do the same with luciferin and an enzyme.`,
            },
          ],
          recap: [
            'Fluorescence: absorb, lose a little energy, emit at a longer wavelength.',
            'Chemiluminescence: a reaction supplies the excitation energy.',
          ],
        },
        {
          id: 'uv',
          title: 'Sunscreen & UV',
          summary: 'When light breaks bonds',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Photons that break bonds',
              body: r`A photon can break a bond if it carries at least the bond energy. A C–C bond takes 348 kJ/mol; per photon that corresponds to a wavelength of $119{,}600/348 \approx 344$ nm. Ultraviolet below that (UVB, 280–315 nm, and part of UVA, 315–400 nm) can damage the molecules in skin, including DNA.`,
            },
            {
              type: 'numeric',
              title: 'Breaking O–H',
              prompt: r`An O–H bond takes 463 kJ/mol to break. What is the longest wavelength (nm) of light that can do it, photon by photon?`,
              unit: 'nm',
              answer: 258,
              tol: 1,
              explain: r`$119{,}600 / 463 \approx 258$ nm: deep ultraviolet (UVC). Fortunately the ozone layer absorbs almost all UVC before it reaches the ground.`,
            },
            {
              type: 'interactive',
              title: 'Formulate a sunscreen',
              prompt: r`A sunscreen uses two absorbers: one for UVB (peak 310 nm) and one for UVA (peak 357 nm). Add enough of each to cut transmission below 10% at both 305 nm and 360 nm.`,
              widget: {
                kind: 'graph', xmin: 280, xmax: 420, ymin: 0, ymax: 1.05, height: 300, grid: false, stackSliders: true,
                axes: { xticks: 20, yticks: 0.25, xlabel: 'wavelength (nm)', ylabel: 'UV getting through', yAt: 0, xAt: 280, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: {
                  b: { min: 0, max: 2, step: 0.1, value: 0.3, label: 'UVB filter', color: 'violet' },
                  a: { min: 0, max: 2, step: 0.1, value: 0.3, label: 'UVA filter', color: 'blue' },
                },
                under: ({ plot, s }) => [s('rect', { x: plot.X(280), y: plot.Y(1.05), width: plot.X(315) - plot.X(280), height: plot.Y(0) - plot.Y(1.05), fill: 'var(--violet)', 'fill-opacity': 0.08 })],
                extra: ({ plot, s }) => [s('text', { x: plot.X(297), y: plot.Y(0.55), 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--violet);${FS(13)}`, text: 'UVB' }), s('text', { x: plot.X(395), y: plot.Y(0.55), 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'UVA' })],
                curves: [{ f: (l, p) => transmit(band(310, 14, p.b), band(357, 18, p.a))(l), color: 'ink' }, { f: () => 0.1, color: 'muted', dash: true }],
                readout: (p) => { const T = transmit(band(310, 14, p.b), band(357, 18, p.a)); return `through at 305 nm: **${fix(100 * T(305), 1)}%** · at 360 nm: **${fix(100 * T(360), 1)}%**`; },
                goal: (p) => { const T = transmit(band(310, 14, p.b), band(357, 18, p.a)); return T(305) <= 0.1 && T(360) <= 0.1 ? true : { ok: false, msg: T(305) > 0.1 ? 'Too much UVB getting through.' : 'Too much UVA getting through.' }; },
                solution: { b: 1.2, a: 1.1 },
              },
              explain: r`An absorbance of about 1 at each wavelength lets 10% through. "Broad-spectrum" sunscreens need a UVA filter (such as avobenzone, a conjugated molecule absorbing near 357 nm) as well as a UVB one. Sun protection factor (SPF) measures UVB only.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why molecules survive',
              prompt: 'Sunscreen molecules absorb UV all day. Why don’t they break their own bonds?',
              choices: [
                { t: 'They turn the absorbed energy into heat very quickly, before any bond can break', ok: true },
                { t: 'They reflect the UV back', why: 'Organic filters absorb; mineral ones (zinc oxide) mostly absorb too.' },
                { t: 'They do break, and are replaced instantly', why: 'Good filters survive many absorption cycles; that’s why some must be stabilised.' },
              ],
              explain: r`The best filters undergo an ultrafast internal change (often a proton hop) that dumps the energy as heat in less than a trillionth of a second. Even so, some (like avobenzone) slowly degrade, which is why you reapply sunscreen.`,
            },
          ],
          recap: [
            'λmax to break a bond = 119,600 / (bond energy in kJ/mol) nm.',
            'UVB and UVA damage skin; sunscreens absorb both.',
            'Good absorbers turn UV into harmless heat.',
          ],
        },
      ],
    },
  ],
};
