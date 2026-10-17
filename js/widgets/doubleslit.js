// Double-slit experiment: particles land one at a time; an interference pattern builds up.
// Optional "which-slit" detector destroys the interference.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

export function doubleslit(box, spec, api) {
  const W = 600, H = 300;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Double-slit detector screen');
  // layout: source at left, barrier with two slits, screen at right
  svg.append(
    s('circle', { cx: 40, cy: 130, r: 12, class: 'fl-amber' }),
    s('text', { x: 40, y: 165, 'text-anchor': 'middle', class: 'tick', text: 'source' }),
    s('rect', { x: 180, y: 20, width: 10, height: 85, class: 'fl-ink' }),
    s('rect', { x: 180, y: 115, width: 10, height: 30, class: 'fl-ink' }),
    s('rect', { x: 180, y: 155, width: 10, height: 85, class: 'fl-ink' }),
    s('rect', { x: 440, y: 20, width: 140, height: 220, rx: 6, class: 'fl-surface' }),
    s('text', { x: 510, y: 258, 'text-anchor': 'middle', class: 'tick', text: 'detector screen' }),
  );
  const detectorMark = s('g', { opacity: 0 });
  detectorMark.append(s('circle', { cx: 200, cy: 110, r: 6, class: 'fl-coral' }), s('circle', { cx: 200, cy: 150, r: 6, class: 'fl-coral' }), s('text', { x: 210, y: 92, class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', text: 'detectors' }));
  svg.append(detectorMark);
  const dots = s('g');
  svg.append(dots);
  const hist = s('g');
  svg.append(hist);
  const bins = new Array(44).fill(0);
  let count = 0, watching = false;

  // intensity across the screen, y in [-1, 1]
  const intensity = (y) => {
    const env = Math.exp(-(y * y) / 0.45); // single-slit envelope (approx.)
    if (watching) {
      // two separate bumps, one behind each slit
      return 0.5 * (Math.exp(-((y - 0.18) ** 2) / 0.12) + Math.exp(-((y + 0.18) ** 2) / 0.12));
    }
    return env * Math.cos(9 * y) ** 2;
  };
  function sample() {
    for (;;) {
      const y = Math.random() * 2 - 1;
      if (Math.random() < intensity(y)) return y;
    }
  }
  function fire(k) {
    for (let i = 0; i < k; i++) {
      const y = sample();
      count++;
      bins[Math.min(bins.length - 1, Math.floor(((y + 1) / 2) * bins.length))]++;
      if (count <= 3000) dots.append(s('circle', { cx: 450 + Math.random() * 70, cy: 130 + y * 105, r: 1.8, class: 'fl-blue', opacity: 0.8 }));
    }
    drawHist();
    api.onChange();
  }
  function drawHist() {
    hist.replaceChildren();
    const max = Math.max(1, ...bins);
    bins.forEach((b, i) => {
      const y = 25 + (i / bins.length) * 210;
      hist.append(s('rect', { x: 530, y, width: (b / max) * 45, height: 210 / bins.length - 0.5, class: 'fl-violet', opacity: 0.8 }));
    });
    readout.innerHTML = mdi(`${count} ${spec.particle || 'electrons'} detected${watching ? ' · detectors **on**' : ''}`);
  }
  const readout = h('div.w-readout');
  const toggle = button('Watch the slits: off', () => {
    watching = !watching;
    toggle.querySelector('span').textContent = `Watch the slits: ${watching ? 'on' : 'off'}`;
    detectorMark.setAttribute('opacity', watching ? 1 : 0);
    reset();
  });
  function reset() {
    dots.replaceChildren();
    bins.fill(0);
    count = 0;
    drawHist();
    api.onChange();
  }
  const ctrls = h('div.w-controls.center',
    button('Fire 1', () => fire(1), { primary: true }),
    button('Fire 100', () => fire(100)),
    button('Fire 2000', () => fire(2000)),
    button('Reset', reset, { icon: icons.reset }));
  box.append(svg, readout, ctrls);
  if (spec.detector) box.append(h('div.w-controls.center', toggle));
  drawHist();
  return {
    ready: () => count >= (spec.needCount || 1),
    check: () => ({ ok: true }),
  };
}
