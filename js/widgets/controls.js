import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { fix, sticky, decimals } from '../lib/svg.js';
export { decimals };

const COLOR_VARS = {
  blue: 'var(--blue)', coral: 'var(--coral)', teal: 'var(--teal)', amber: 'var(--amber)',
  violet: 'var(--violet)', pink: 'var(--pink)', ink: 'var(--ink)', green: 'var(--success)',
};
export const colorVar = (c) => COLOR_VARS[c] || c || 'var(--select)';

// Range slider with label and live value. A handful of named options becomes a row of buttons
// instead (see choices below); control: 'slider' or 'buttons' overrides the choice.
export function slider({ label, min, max, step = 0.1, value, color = 'blue', format, onInput, control }) {
  const id = 'sl' + Math.random().toString(36).slice(2, 8);
  const input = h('input', { type: 'range', id, min, max, step, value });
  const out = h('output', { for: id });
  const fmtv = format || ((v) => fix(v, decimals(step)));
  // Two to four positions, or up to seven named (non-numeric) options, are a choice, not a quantity:
  // dragging a thumb a third of the way across to flip a setting is clumsy, so show buttons.
  {
    const count = Math.round((max - min) / step) + 1;
    if (control !== 'slider' && count >= 2 && count <= 7) {
      const opts = Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(9));
      const named = opts.some((v) => { try { return !/^\s*[−+-]?\d/.test(String(fmtv(v))); } catch (e) { return false; } });
      if (control === 'buttons' || count <= 4 || named) return choices({ id, input, label, opts, value, color, fmtv, onInput });
    }
  }
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
  const reserve = `max(64px, ${(longest * 0.66).toFixed(1)}em)`;
  if (!long) out.style.minWidth = reserve;
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
  // A slider with more steps than a finger can pick out (over 30) gets −/+ buttons that move one
  // step, so an exact target is always reachable on a phone. Holding a button repeats.
  const fine = n > 30;
  const nudge = (dir, k = 1) => {
    const v = Math.max(min, Math.min(max, +(parseFloat(input.value) + dir * k * step).toFixed(9)));
    if (Math.abs(v - committed) < 1e-9) return;
    input.value = v;
    committed = parseFloat(input.value);
    sync();
    onInput && onInput(committed);
  };
  const nudgeBtn = (dir) => nudgeButton(dir, (k) => nudge(dir, k), `${dir < 0 ? 'Decrease' : 'Increase'} ${String(label).replace(/[$\\{}]/g, '')}`, n);
  // the track and its value wrap together, so a long label never strands the value on a line of its own
  const basis = long ? (fine ? '220px' : '140px') : `calc(${fine ? 232 : 152}px + ${reserve})`;
  // (a long option name sits on its own line under the row, at the slider's full width)
  const row = h(`span.sl-row${fine ? '.fine' : ''}`, { style: `flex-basis: ${basis}` }, fine ? [nudgeBtn(-1), input, nudgeBtn(1)] : input, long ? null : out);
  const el = h(`div.slider${long ? '.long-out' : ''}${fine ? '.fine' : ''}`, h('label', { for: id, html: mdi(label) }), row, long ? out : null);
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

// A small −/+ button that moves a value by whole steps: one per tap, repeating while held, with
// bigger strides after about a second (k steps per call) so a long range is still quick to cross.
// A row of buttons for a small set of options (used by slider() for choice-like parameters).
// A hidden range input keeps the same value, so code and dev checkers that drive sliders still work.
function choices({ id, input, label, opts, value, color, fmtv, onInput }) {
  input.hidden = true;
  input.tabIndex = -1;
  let cur = +value;
  const group = h('div.seg-opts', { role: 'radiogroup', 'aria-labelledby': id + '-l' });
  group.style.setProperty('--sc', colorVar(color));
  const btns = opts.map((v) => {
    let html = '';
    try { html = mdi(String(fmtv(v))); } catch (e) { html = String(v); }
    const b = h('button.seg', { type: 'button', role: 'radio', html });
    b.addEventListener('click', () => pick(v, true));
    return b;
  });
  const near = (v) => opts.reduce((a, o) => (Math.abs(o - v) < Math.abs(a - v) ? o : a), opts[0]);
  const show = () => btns.forEach((b, i) => {
    const on = Math.abs(opts[i] - cur) < 1e-9;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.tabIndex = on ? 0 : -1;
  });
  function pick(v, user) {
    v = near(v);
    if (Math.abs(v - cur) < 1e-9 && user) return;
    cur = v;
    input.value = v;
    show();
    if (user) onInput && onInput(v);
  }
  // arrow keys move between options, like any radio group
  group.addEventListener('keydown', (e) => {
    const i = opts.findIndex((o) => Math.abs(o - cur) < 1e-9), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const j = Math.max(0, Math.min(opts.length - 1, i + d));
    pick(opts[j], true);
    btns[j].focus();
  });
  // the hidden input still answers to programmatic changes (dev checkers sweep sliders this way)
  input.addEventListener('input', () => pick(parseFloat(input.value), true));
  group.append(...btns);
  show();
  const el = h('div.slider.seg-slider', h('label', { id: id + '-l', html: mdi(label) }), group, input);
  return {
    el,
    get value() { return cur; },
    set value(v) { pick(+v, false); },
    input,
  };
}

export function nudgeButton(dir, onStep, ariaLabel, n = 100) {
  const btn = h('button.sl-nudge', { type: 'button', 'aria-label': ariaLabel });
  // drawn rather than typed, so − and + have the same length and weight
  btn.innerHTML = `<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M2 7H12${dir < 0 ? '' : 'M7 2V12'}" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>`;
  let wait = null, rep = null;
  const stop = () => { clearTimeout(wait); clearInterval(rep); wait = rep = null; };
  btn.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    e.preventDefault();
    onStep(1);
    let ticks = 0;
    wait = setTimeout(() => { rep = setInterval(() => { ticks++; onStep(ticks < 15 ? 1 : ticks < 40 ? Math.max(1, Math.round(n / 400)) : Math.max(1, Math.round(n / 100))); }, 70); }, 400);
    btn.setPointerCapture?.(e.pointerId);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(ev, stop);
  // keyboard and assistive tech press it as a normal button (a pointer press was already handled)
  btn.addEventListener('click', (e) => { if (e.detail === 0) onStep(1); });
  return btn;
}

export function button(label, onClick, { icon, primary } = {}) {
  return h(`button.w-btn${primary ? '.primary' : ''}`, { type: 'button', onClick, html: (icon || '') + `<span>${mdi(label)}</span>` });
}
