// Dev tool: find live numbers whose number of decimals changes as a widget plays or is dragged.
// "t = 4.7 s" followed by "t = 4.71 s" makes the text (and everything next to it) jump; every live
// number must be shown with a fixed number of decimals (the most that number ever needs in that
// step), e.g. "4.70" and "4.00". See DESIGN.md, "Live numbers".
//   - plays every animation (Play / Run / Launch / ... buttons) on a fake clock and reads the text
//     on every frame
//   - sweeps every slider through its range
//   - re-renders the step with each widget parameter (dragged points too) at many values
// It compares every number in figure text, readouts and slider labels across all those states and
// reports each one that is shown with different numbers of decimals.
// Usage (browser console on the dev server):
//   const m = await import('/scripts/digits-check.js'); await m.check(['motion'])
import { courses } from '../js/courses/index.js';
import { renderStep } from '../js/steps.js';
import { loadWidgets } from '../js/widgets/index.js';
import { loadKatex } from '../js/lib/md.js';

const tick = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
const NUM = /[−-]?\d+(?:\.\d+)?/g;

// a fake clock, so animations can be stepped frame by frame in a hidden tab
function fakeClock() {
  const real = { raf: window.requestAnimationFrame, caf: window.cancelAnimationFrame, now: performance.now.bind(performance) };
  let now = real.now(), id = 0, queue = new Map();
  window.requestAnimationFrame = (f) => { queue.set(++id, f); return id; };
  window.cancelAnimationFrame = (k) => queue.delete(k);
  performance.now = () => now;
  return {
    frame(ms = 1000 / 30) {
      now += ms;
      const q = queue; queue = new Map();
      for (const f of q.values()) { try { f(now); } catch (e) {} }
    },
    restore() { window.requestAnimationFrame = real.raf; window.cancelAnimationFrame = real.caf; performance.now = real.now; },
  };
}

// every piece of live text in the step, keyed by where it is. A figure label keeps the name it got
// when first seen (labels added later, like strobe marks, must not shift the names of the others).
let names = new WeakMap();
const nameOf = (t, i) => { if (!names.has(t)) names.set(t, `svg text ${i}`); return names.get(t); };
function snapshot(el) {
  const out = [];
  // data-free-digits marks text whose changing length is the point (e.g. 0.0042 vs 0.000042)
  const free = (t) => t.closest('[data-free-digits]');
  el.querySelectorAll('svg text').forEach((t, i) => { if (!t.querySelector('tspan') && !free(t)) out.push([nameOf(t, i), t.textContent]); });
  el.querySelectorAll('svg tspan').forEach((t, i) => { if (!free(t)) out.push([nameOf(t, 'tspan ' + i), t.textContent]); });
  el.querySelectorAll('.w-readout, output').forEach((t, i) => {
    if (free(t)) return;
    // read formulas from their TeX source, where a fraction's parts stay apart (\frac{29.4}{19.4})
    const c = t.cloneNode(true);
    c.querySelectorAll('.katex').forEach((k) => k.replaceWith(' ' + (k.querySelector('annotation')?.textContent || '') + ' '));
    out.push([`${t.tagName === 'OUTPUT' ? 'slider value' : 'readout'} ${i}`, c.textContent]);
  });
  return out;
}

function record(seen, el) {
  for (const [key, text] of snapshot(el)) {
    const nums = text.match(NUM);
    if (!nums) continue;
    const skel = text.replace(NUM, '#').replace(/\s+/g, ' ');
    nums.forEach((n, j) => {
      const k = `${key}|${skel}|${j}`;
      const d = n.includes('.') ? n.split('.')[1].length : 0;
      let r = seen.get(k);
      if (!r) seen.set(k, (r = { key, skel, j, dec: new Map(), toks: new Set() }));
      if (!r.dec.has(d)) r.dec.set(d, text.trim().slice(0, 80));
      if (r.toks.size < 400) r.toks.add(n.replace('−', '-'));
    });
  }
}

// A value on a log scale keeps a fixed number of significant figures instead of fixed decimals:
// 0.010, 0.10, 1.0, 10, 250 (an integer like 250 may have 2 or 3). Text like that keeps a near
// constant length, so any slot whose values share 2 or more significant figures passes.
function sigRange(t) {
  const u = t.replace('-', '');
  if (u.includes('.')) { const d = u.replace('.', '').replace(/^0+/, ''); return [d.length, d.length]; }
  const d = u.replace(/^0+/, '');
  return [Math.max(1, d.replace(/0+$/, '').length), Math.max(1, d.length)];
}
function logScaleOK(toks) {
  let lo = 0, hi = Infinity;
  for (const t of toks) { if (!parseFloat(t)) continue; const [a, b] = sigRange(t); lo = Math.max(lo, a); hi = Math.min(hi, b); }
  return lo >= 2 && lo <= hi;
}

const PLAY = /^(play|run|launch|start|go|drop|release|fire|step|swing|roll|let go|throw)/i;

async function exercise(ctrl, seen, clock, { frames, sweep }) {
  const el = ctrl.el;
  record(seen, el);
  // sliders: sweep each one through its range, then put it back
  for (const input of sweep ? el.querySelectorAll('.slider input[type=range]') : []) {
    const min = +input.min, max = +input.max, step = +input.step || 1, v0 = input.value;
    const n = Math.round((max - min) / step), K = Math.min(n, 40);
    // every K-th step, and the step after it (a stride alone can land on whole numbers only)
    for (let k = 0; k <= K; k++) for (const o of [0, 1]) {
      const i = Math.round((k * n) / K) + o;
      if (i > n) continue;
      input.value = min + i * step;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      record(seen, el);
    }
    input.value = v0;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  // animations
  for (const b of frames ? el.querySelectorAll('button') : []) {
    if (!PLAY.test(b.textContent.trim())) continue;
    try { b.click(); } catch (e) { continue; }
    for (let f = 0; f < frames; f++) { clock.frame(); if (f % 2 === 0) record(seen, el); }
    record(seen, el);
    // pause if it is still running
    if (/^pause/i.test(b.textContent.trim())) b.click();
  }
}

export async function check(ids, { frames = 300, values = 8 } = {}) {
  await Promise.all([loadKatex(), loadWidgets(courses.filter((c) => !ids || ids.includes(c.id)))]);
  const host = document.createElement('div');
  host.className = 'player';
  host.style.cssText = `position:absolute;left:-12000px;top:0;width:${Math.min(680, document.documentElement.clientWidth - 32)}px;`;
  document.body.append(host);
  const issues = [];
  let steps = 0;
  const clock = fakeClock();
  try {
    for (const c of courses) {
      if (ids && !ids.includes(c.id)) continue;
      for (const ch of c.chapters) for (const l of ch.lessons) for (let i = 0; i < l.steps.length; i++) {
        const step = l.steps[i];
        if (!step.widget) continue;
        const at = `${c.id}/${l.id}#${i + 1}`;
        steps++;
        const seen = new Map();
        const variants = [step];
        const params = step.widget.params || {};
        for (const [k, d] of Object.entries(params)) {
          if (d.min == null || d.max == null) continue;
          const st = d.step || (d.max - d.min) / 50, n = Math.round((d.max - d.min) / st), K = Math.min(n, values);
          for (let j = 0; j <= K; j++) for (const o of [0, 1]) {
            const i = Math.round((j * n) / K) + o;
            if (i <= n) variants.push({ ...step, widget: { ...step.widget, params: { ...params, [k]: { ...d, value: +(d.min + i * st).toFixed(9) } } } });
          }
        }
        for (const [vi, v] of variants.entries()) {
          let ctrl;
          names = new WeakMap();
          try { ctrl = renderStep(v, { onReady: () => {}, course: c }); host.replaceChildren(ctrl.el); await tick(); } catch (e) { continue; }
          try { await exercise(ctrl, seen, clock, { frames: vi === 0 ? frames : 0, sweep: vi === 0 }); } catch (e) {}
          try { ctrl.reveal?.(); record(seen, ctrl.el); } catch (e) {}
          try { ctrl.destroy?.(); } catch (e) {}
        }
        for (const r of seen.values()) {
          if (r.dec.size < 2 || logScaleOK(r.toks)) continue;
          const ex = [...r.dec.entries()].sort((a, b) => a[0] - b[0]).map(([d, t]) => `${d}dp: "${t}"`).join('  |  ');
          issues.push(`${at} ${r.key}, number ${r.j + 1}: ${ex}`);
        }
      }
    }
  } finally {
    clock.restore();
    host.remove();
  }
  return { steps, issues };
}
