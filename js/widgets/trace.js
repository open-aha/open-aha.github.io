// Step through a program line by line, watching its variables and output.
// spec: { lines: [code lines], run: function* (p) { yield { line, vars: {name: value}, out } },
//         params: {name: {min, max, step, value, label, color, format}}, vars: [names in display order],
//         goal: (p, last) => bool | {ok, msg}, solution: {param: value}, hint, speed, maxFrames }
// Each yield is one moment: `line` is the line just run (0-based), `vars` the values after it,
// and `out` any text it printed. A value written { raw: 'text' } is shown as plain text. The widget collects the frames up front, so Back works too.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { highlight } from '../lib/code.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function collect(spec, p) {
  const frames = [];
  const it = spec.run(p);
  let out = [];
  for (const f of it) {
    if (f.out != null) out = [...out, String(f.out)];
    frames.push({ line: f.line, vars: { ...(f.vars || {}) }, out });
    if (frames.length >= (spec.maxFrames ?? 400)) break;
  }
  return frames;
}

const show = (v) => (v && v.raw != null ? String(v.raw) : Array.isArray(v) ? `[${v.map(show).join(', ')}]` : typeof v === 'string' ? `"${v}"` : typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v));

export function trace(box, spec, api) {
  const p = {};
  for (const [k, d] of Object.entries(spec.params || {})) p[k] = d.value;
  let frames = [], fi = -1, timer = null, touched = false;

  const code = h('ol.tr-code', { 'aria-label': 'Program' }, ...spec.lines.map((l) => h('li.tr-line', { html: highlight(l) || ' ' })));
  const varsEl = h('div.tr-vars');
  const outEl = h('div.tr-out', { 'aria-live': 'polite' });
  const side = h('div.tr-side', h('div.tr-head', 'Variables'), varsEl, h('div.tr-head', 'Output'), outEl);
  const status = h('div.w-readout.tr-status');
  const backBtn = button('Back', () => { stop(); go(fi - 1); }, { icon: icons.left });
  const stepBtn = button('Step', () => { stop(); go(fi + 1); touch(); }, { icon: icons.right, primary: true });
  const runBtn = button('Run', () => (timer ? stop() : play()), { icon: icons.play });
  const resetBtn = button('Reset', () => { stop(); go(-1); }, { icon: icons.reset });
  const controls = h('div.w-controls');
  const sliders = {};
  for (const [k, d] of Object.entries(spec.params || {})) {
    sliders[k] = slider({ label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color, format: d.format, onInput: (v) => { p[k] = v; stop(); rebuild(); touch(); } });
    controls.append(sliders[k].el);
  }
  box.append(h('div.tr-wrap', code, side), status, h('div.w-controls.center', backBtn, stepBtn, runBtn, resetBtn));
  if (controls.children.length) box.append(controls);

  function names() {
    if (spec.vars) return spec.vars;
    const seen = [];
    for (const f of frames) for (const k of Object.keys(f.vars)) if (!seen.includes(k)) seen.push(k);
    return seen;
  }

  function rebuild() {
    frames = collect(spec, p);
    go(-1);
  }

  function go(k) {
    fi = Math.max(-1, Math.min(frames.length - 1, k));
    const f = fi >= 0 ? frames[fi] : null;
    const prev = fi > 0 ? frames[fi - 1] : null;
    [...code.children].forEach((li, i) => li.classList.toggle('active', !!f && f.line === i));
    varsEl.replaceChildren(...names().map((n) => {
      const has = f && n in f.vars;
      const changed = has && (!prev || show(prev.vars[n]) !== show(f.vars[n]));
      return h(`div.tr-var${changed ? '.changed' : ''}`, h('span.tr-name', n), h('span.tr-val', has ? show(f.vars[n]) : '–'));
    }));
    const out = f ? f.out : [];
    outEl.replaceChildren(...(out.length ? out.map((o) => h('div', o)) : [h('div.tr-none', 'nothing printed yet')]));
    if (fi < 0) status.innerHTML = mdi('Press **Step** to run the first line.');
    else if (fi === frames.length - 1) status.innerHTML = mdi(`Finished after **${frames.length}** steps.`);
    else status.innerHTML = mdi(`step **${fi + 1}** of ${frames.length}: line ${f.line + 1}`);
    backBtn.disabled = fi < 0;
    stepBtn.disabled = fi >= frames.length - 1;
  }

  function play() {
    touch();
    if (fi >= frames.length - 1) go(-1);
    runBtn.innerHTML = icons.pause + '<span>Pause</span>';
    timer = setInterval(() => { if (fi >= frames.length - 1) stop(); else go(fi + 1); }, spec.speed ?? 420);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    runBtn.innerHTML = icons.play + '<span>Run</span>';
  }
  function touch() {
    if (!touched) { touched = true; api.onChange(); }
    else api.onChange();
  }

  rebuild();

  return {
    ready: () => touched || spec.ready === true || !spec.goal,
    check() {
      if (!spec.goal) return { ok: true };
      const fr = collect(spec, p);
      const r = spec.goal(p, fr[fr.length - 1], fr);
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (!spec.solution) return;
      stop();
      for (const [k, v] of Object.entries(spec.solution)) { p[k] = v; if (sliders[k]) sliders[k].value = v; }
      rebuild();
      go(frames.length - 1);
    },
    destroy: stop,
  };
}
