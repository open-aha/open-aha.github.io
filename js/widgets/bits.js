// A row of clickable bits (most significant on the left).
// spec: { n: 8, value: 0, places: true, labels: ['p1', …], colors: ['blue', …], lock: [indices],
//         readout(value, bits) → md, goal(value, bits) → bool | {ok,msg}, hint, solution: int }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

export const bitsOf = (val, n) => Array.from({ length: n }, (_, i) => (val >> (n - 1 - i)) & 1);

export function bits(box, spec, api) {
  const n = spec.n || 8;
  const cell = spec.cell || (n > 8 ? 52 : 64), gap = 10;
  const head = spec.places === false && !spec.labels ? 12 : 44;
  const W = n * (cell + gap) + gap, H = head + cell + 12;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', `${n} switchable bits`);
  if (spec.maxWidth) svg.style.maxWidth = spec.maxWidth + 'px';
  const start = spec.value || 0;
  let val = start, touched = false;
  const lock = new Set(spec.lock || []);
  const cells = [];

  for (let i = 0; i < n; i++) {
    const x = gap + i * (cell + gap), y = head;
    const g = s('g', { class: lock.has(i) ? 'bit locked' : 'bit', tabindex: lock.has(i) ? -1 : 0, role: 'switch' });
    const rect = s('rect', { x, y, width: cell, height: cell, rx: 12, 'stroke-width': 2.5 });
    const t = s('text', { x: x + cell / 2, y: y + cell / 2 + 10, 'text-anchor': 'middle', class: 'bit-digit' });
    g.append(rect, t);
    const top = spec.labels ? spec.labels[i] : spec.places === false ? null : String(2 ** (n - 1 - i));
    if (top != null) svg.append(s('text', { x: x + cell / 2, y: head - 14, 'text-anchor': 'middle', class: 'lbl', text: top }));
    svg.append(g);
    const flip = () => {
      if (lock.has(i)) return;
      val ^= 1 << (n - 1 - i);
      touched = true;
      render();
      api.onChange();
    };
    g.addEventListener('click', flip);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        flip();
      }
    });
    cells.push({ g, rect, t });
  }

  const readout = h('div.w-readout');
  box.append(svg, readout);
  if (!spec.noReset) box.append(h('div.w-controls.center', button('Reset', () => { val = start; render(); api.onChange(); }, { icon: icons.reset })));

  function render() {
    const b = bitsOf(val, n);
    b.forEach((bit, i) => {
      const { g, rect, t } = cells[i];
      const color = spec.colors?.[i];
      rect.setAttribute('class', bit ? (color ? `fl-${color}` : 'fl-ink') : 'fl-card');
      rect.setAttribute('stroke', bit ? 'none' : 'var(--line-2)');
      t.style.fill = bit ? 'var(--card)' : 'var(--ink-3)';
      t.textContent = String(bit);
      g.setAttribute('aria-checked', bit ? 'true' : 'false');
      g.setAttribute('aria-label', `${spec.labels ? spec.labels[i] : `bit ${2 ** (n - 1 - i)}`}: ${bit}`);
    });
    if (spec.readout) readout.innerHTML = mdi(spec.readout(val, b));
    else {
      const terms = b.map((bit, i) => (bit ? 2 ** (n - 1 - i) : null)).filter((v) => v != null);
      readout.innerHTML = mdi(`$${terms.length ? terms.join(' + ') : '0'} = \\mathbf{${val}}$`);
    }
  }
  render();

  return {
    ready: () => touched || spec.ready === true,
    check() {
      if (!spec.goal) return { ok: true };
      const r = spec.goal(val, bitsOf(val, n));
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution != null) {
        val = spec.solution;
        render();
      }
    },
  };
}
