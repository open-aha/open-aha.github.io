// Dev tool: find layout problems a learner would feel, at the current viewport width.
//   - anything wider than the lesson column (horizontal overflow, worst on phones)
//   - figure text so small it is hard to read once the drawing is scaled down
//   - labels cut off at the edge of their drawing, at any slider position
//   - the page moving while a slider is dragged (figure, readout or sliders changing size)
//   - NaN / undefined / Infinity appearing at some slider position
// Usage (browser console on the dev server; set a phone-sized viewport first to test phones):
//   const m = await import('/scripts/layout-check.js'); await m.check(['powers'], { samples: 6 })
import { courses } from '../js/courses/index.js';
import { renderStep } from '../js/steps.js';
import { textBoost, textFloor, keepInside } from '../js/lib/svg.js';

// apply the phone text enlargement now (the page's ResizeObserver does not run in a hidden tab)
export function boost(el) {
  for (const svg of el.querySelectorAll('svg.fig')) {
    const vb = svg.viewBox?.baseVal?.width, w = svg.getBoundingClientRect().width;
    if (vb && w) { svg.style.setProperty('--fs', textBoost(w / vb).toFixed(3)); svg.style.setProperty('--fmin', textFloor(w / vb)); keepInside(svg); }
  }
  for (const r of el.querySelectorAll('.w-readout')) if (r._measure && !r._measured) { r._measured = true; r._measure(); }
}

const tick = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
const BAD = /NaN|undefined|Infinity/;

function scrolls(el, stop) {
  for (let n = el.parentElement; n && n !== stop; n = n.parentElement) {
    const o = getComputedStyle(n).overflowX;
    if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
  }
  return false;
}
const name = (el) => `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}> "${(el.textContent || '').trim().slice(0, 30)}"`;

function inspect(el, host, at, out, { minFont }) {
  const H = host.getBoundingClientRect();
  // 1. horizontal overflow (report the outermost offender only)
  for (const n of el.querySelectorAll('*')) {
    if (n.closest('svg') && n.tagName.toLowerCase() !== 'svg') continue;
    const b = n.getBoundingClientRect();
    if (!b.width) continue;
    if ((b.right > H.right + 2 || b.left < H.left - 2) && !scrolls(n, host)) {
      const p = n.parentElement.getBoundingClientRect();
      if (p.right > H.right + 2 || p.left < H.left - 2) continue;
      out.add(`${at}: ${name(n)} sticks out of the column by ${Math.round(Math.max(b.right - H.right, H.left - b.left))}px`);
    }
  }
  for (const svg of el.querySelectorAll('svg')) {
    const S = svg.getBoundingClientRect();
    if (S.width < 60) continue;
    for (const t of svg.querySelectorAll('text')) {
      if (!t.textContent.trim()) continue;
      const cs = getComputedStyle(t);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const b = t.getBoundingClientRect();
      if (!b.width) continue;
      // 2. rendered font size after the drawing is scaled to fit
      const m = t.getScreenCTM();
      const px = parseFloat(cs.fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
      if (px < minFont) out.add(`${at}: figure text "${t.textContent.trim().slice(0, 24)}" renders at ${px.toFixed(1)}px`);
      // 3. cut off at the drawing's edge
      if (b.left < S.left - 3 || b.right > S.right + 3 || b.top < S.top - 3 || b.bottom > S.bottom + 3) out.add(`${at}: label "${t.textContent.trim().slice(0, 30)}" is cut off at the edge`);
      if (BAD.test(t.textContent)) out.add(`${at}: figure text "${t.textContent.slice(0, 30)}"`);
    }
  }
  for (const r of el.querySelectorAll('.w-readout, output')) if (BAD.test(r.textContent)) out.add(`${at}: readout "${r.textContent.slice(0, 60)}"`);
  // 4. data points drawn outside a chart's plot area (unclipped layers), e.g. a value beyond ymax
  for (const svg of el.querySelectorAll('svg')) {
    const cr = svg.querySelector('clipPath rect');
    if (!cr) continue;
    const m = svg.getScreenCTM();
    if (!m) continue;
    const a = new DOMPoint(+cr.getAttribute('x'), +cr.getAttribute('y')).matrixTransform(m);
    const b = new DOMPoint(+cr.getAttribute('x') + +cr.getAttribute('width'), +cr.getAttribute('y') + +cr.getAttribute('height')).matrixTransform(m);
    for (const c of svg.querySelectorAll('circle')) {
      if (c.closest('[clip-path], defs, clipPath, marker') || c.classList.contains('hit') || c.classList.contains('halo')) continue;
      const cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden' || c.closest('[style*="display: none"]')) continue;
      const bb = c.getBoundingClientRect();
      if (!bb.width) continue;
      const cx = bb.left + bb.width / 2, cy = bb.top + bb.height / 2, tol = 6;
      if (cx < a.x - tol || cx > b.x + tol || cy < a.y - tol || cy > b.y + tol) out.add(`${at}: a point (r=${c.getAttribute('r')}) lies outside the plot area`);
    }
  }
}

// every slider at min, max, and some random positions; returns the layout signature per position
function setSlider(input, v) {
  input.value = v;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export async function check(ids, { samples = 4, minFont = 9, seed = 1 } = {}) {
  let rnd = seed;
  const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  const host = document.createElement('div');
  host.className = 'player';
  const w = Math.min(680, document.documentElement.clientWidth - 32);
  host.style.cssText = `position:absolute;left:-12000px;top:0;width:${w}px;`;
  document.body.append(host);
  const issues = new Set();
  let steps = 0;
  for (const c of courses) {
    if (ids && !ids.includes(c.id)) continue;
    for (const ch of c.chapters) for (const l of ch.lessons) for (let i = 0; i < l.steps.length; i++) {
      const step = l.steps[i];
      const at = `${c.id}/${l.id}#${i + 1}`;
      steps++;
      let ctrl;
      try {
        ctrl = renderStep(step, { onReady: () => {}, course: c });
        host.replaceChildren(ctrl.el);
        await tick();
        boost(ctrl.el);
      } catch (e) { issues.add(`${at}: render throws ${e.message}`); continue; }
      const el = ctrl.el;
      inspect(el, host, at, issues, { minFont });
      // slider sweep: the layout must not move while a slider is dragged
      const inputs = [...el.querySelectorAll('.slider input[type=range]')];
      for (const [k, input] of inputs.entries()) {
        const min = +input.min, max = +input.max, step0 = +input.step || 1;
        const vals = [min, max, ...Array.from({ length: samples }, () => min + Math.round((rand() * (max - min)) / step0) * step0)];
        const top0 = input.getBoundingClientRect().top - el.getBoundingClientRect().top;
        const fig = el.querySelector('.figure');
        let lo = Infinity, hi = -Infinity, wlo = Infinity, whi = -Infinity, flo = Infinity, fhi = -Infinity;
        for (const v of vals) {
          try { setSlider(input, v); } catch (e) { issues.add(`${at}: slider ${k + 1} at ${v} throws ${e.message}`); continue; }
          await tick();
          boost(el);
          const top = input.getBoundingClientRect().top - el.getBoundingClientRect().top;
          lo = Math.min(lo, top); hi = Math.max(hi, top);
          const wd = input.getBoundingClientRect().width;
          wlo = Math.min(wlo, wd); whi = Math.max(whi, wd);
          if (fig) { const fh = fig.getBoundingClientRect().height; flo = Math.min(flo, fh); fhi = Math.max(fhi, fh); }
          inspect(el, host, `${at} (slider ${k + 1} = ${+v.toFixed(6)})`, issues, { minFont: 0 });
        }
        if (hi - lo > 2) issues.add(`${at}: slider ${k + 1} moves up and down by ${Math.round(hi - lo)}px while dragging`);
        if (whi - wlo > 2) issues.add(`${at}: slider ${k + 1} track changes width by ${Math.round(whi - wlo)}px while dragging`);
        if (fhi - flo > 2) issues.add(`${at}: figure changes height by ${Math.round(fhi - flo)}px while slider ${k + 1} moves`);
        void top0;
      }
      try { ctrl.destroy?.(); } catch (e) {}
    }
  }
  host.remove();
  return { steps, width: w, issues: [...issues] };
}
