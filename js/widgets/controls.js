import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { fix, sticky, decimals } from '../lib/svg.js';
export { decimals };

const COLOR_VARS = {
  blue: 'var(--blue)', coral: 'var(--coral)', teal: 'var(--teal)', amber: 'var(--amber)',
  violet: 'var(--violet)', pink: 'var(--pink)', ink: 'var(--ink)', green: 'var(--success)',
};
export const colorVar = (c) => COLOR_VARS[c] || c || 'var(--select)';

// Range slider with label and live value
export function slider({ label, min, max, step = 0.1, value, color = 'blue', format, onInput }) {
  const id = 'sl' + Math.random().toString(36).slice(2, 8);
  const input = h('input', { type: 'range', id, min, max, step, value });
  const out = h('output', { for: id });
  const fmtv = format || ((v) => fix(v, decimals(step)));
  // The value label must not change width as the value changes: a wider label shrinks the track
  // under a resting pointer, which moves the value, which changes the label again (a jittery loop).
  // Reserve room for the longest label over the whole range, and never let it shrink after that.
  let longest = 0;
  const n = Math.round((max - min) / step);
  for (let k = 0; k <= Math.min(n, 400); k++) {
    const v = min + (n <= 400 ? k : Math.round((n * k) / 400)) * step;
    try { longest = Math.max(longest, String(fmtv(+v.toFixed(9))).replace(/[$*\\{}]|\\[a-z]+/gi, '').length); } catch (e) {}
  }
  // long labels (named options) go on their own line under the track instead
  const long = longest > 14;
  if (!long) out.style.minWidth = `max(64px, ${(longest * 0.66).toFixed(1)}em)`;
  let widest = 0;
  const sync = () => {
    const v = parseFloat(input.value);
    input.style.setProperty('--pct', ((v - min) / (max - min)) * 100 + '%');
    out.innerHTML = mdi(fmtv(v));
    const w = long ? 0 : out.offsetWidth;
    if (w > widest) { widest = w; out.style.minWidth = w + 'px'; }
  };
  input.style.setProperty('--sc', colorVar(color));
  // While the pointer drags the thumb, the value is "sticky" (see svg.js): the native input snaps at
  // exactly halfway between steps, which makes a resting hand flicker between two values.
  let committed = parseFloat(input.value);
  let px = null;
  const move = (e) => { px = e.clientX; };
  const end = () => { px = null; window.removeEventListener('pointermove', move, true); };
  input.addEventListener('pointerdown', (e) => {
    px = e.clientX;
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', end, { once: true, capture: true });
    window.addEventListener('pointercancel', end, { once: true, capture: true });
  });
  input.addEventListener('input', () => {
    let v = parseFloat(input.value);
    if (px != null) {
      const r = input.getBoundingClientRect(), thumb = 26;
      const f = Math.max(0, Math.min(1, (px - r.left - thumb / 2) / Math.max(1, r.width - thumb)));
      v = sticky(committed, min + f * (max - min), min, max, step);
      input.value = v;
    }
    if (Math.abs(v - committed) < 1e-9) return;
    committed = v;
    sync();
    onInput && onInput(v);
  });
  sync();
  const el = h(`div.slider${long ? '.long-out' : ''}`, h('label', { for: id, html: mdi(label) }), input, out);
  return {
    el,
    get value() {
      return parseFloat(input.value);
    },
    set value(v) {
      input.value = v;
      committed = parseFloat(input.value);
      sync();
    },
    input,
  };
}

export function button(label, onClick, { icon, primary } = {}) {
  return h(`button.w-btn${primary ? '.primary' : ''}`, { type: 'button', onClick, html: (icon || '') + `<span>${mdi(label)}</span>` });
}
