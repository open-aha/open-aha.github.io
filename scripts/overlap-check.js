// Dev tool: find drawing mistakes that a human would see but a crash test would not.
//   - text hidden under shapes drawn after it (e.g. bars painted over an axis label)
//   - text overlapping other text
//   - lines and curves hidden under filled shapes drawn after them
//   - text with too little contrast against what is behind it
// Usage (browser console on the dev server):
//   const m = await import('/scripts/overlap-check.js'); await m.check(['powers'])
import { courses } from '../js/courses/index.js';
import { renderStep } from '../js/steps.js';
import { loadWidgets } from '../js/widgets/index.js';
import { loadKatex } from '../js/lib/md.js';
import { boost } from './layout-check.js';

// a message-channel tick is not throttled when the tab is in the background (unlike setTimeout)
const tick = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
const SHAPES = 'rect,circle,ellipse,path,polygon,polyline,line';

function rgba(str) {
  const m = str && str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
}
const lum = ({ r, g, b }) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

function alpha(el, prop) {
  let a = 1;
  for (let n = el; n && n.tagName && n.tagName.toLowerCase() !== 'svg'; n = n.parentElement) {
    const cs = getComputedStyle(n);
    a *= +cs.opacity;
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
  }
  const cs = getComputedStyle(el);
  const c = rgba(cs[prop]);
  if (!c) return 0;
  return a * c.a * +(prop === 'fill' ? cs.fillOpacity : cs.strokeOpacity);
}
const paintsFill = (el) => el.tagName !== 'line' && getComputedStyle(el).fill !== 'none' && alpha(el, 'fill') >= 0.5;
const paintsStroke = (el) => getComputedStyle(el).stroke !== 'none' && alpha(el, 'stroke') >= 0.5 && parseFloat(getComputedStyle(el).strokeWidth) >= 2.5;

function covers(el, x, y, mode) {
  const m = el.getScreenCTM();
  if (!m || !inside(clipBox(el), x, y)) return false;
  const p = new DOMPoint(x, y).matrixTransform(m.inverse());
  try {
    if ((mode !== 'stroke') && paintsFill(el) && el.isPointInFill(p)) return true;
    if ((mode !== 'fill') && paintsStroke(el) && el.isPointInStroke(p)) return true;
  } catch (e) {}
  return false;
}
// the visible window of a clipped shape (curves are clipped to the plot area), in screen pixels
function clipBox(el) {
  const holder = el.closest('[clip-path]');
  if (!holder) return null;
  const id = (holder.getAttribute('clip-path').match(/#([^)"']+)/) || [])[1];
  const r = id && el.ownerSVGElement?.querySelector(`#${CSS.escape(id)} rect`);
  if (!r) return null;
  const m = holder.getScreenCTM();
  const a = new DOMPoint(+r.getAttribute('x'), +r.getAttribute('y')).matrixTransform(m);
  const b = new DOMPoint(+r.getAttribute('x') + +r.getAttribute('width'), +r.getAttribute('y') + +r.getAttribute('height')).matrixTransform(m);
  return { left: a.x, top: a.y, right: b.x, bottom: b.y };
}
const inside = (c, x, y) => !c || (x >= c.left && x <= c.right && y >= c.top && y <= c.bottom);
const hit = (a, b) => !(b.right < a.left || b.left > a.right || b.bottom < a.top || b.top > a.bottom);

function shown(el) {
  const b = el.getBoundingClientRect();
  return b.width > 0 && alpha(el, el.tagName === 'text' ? 'fill' : 'fill') + alpha(el, 'stroke') > 0 ? b : null;
}

function inspectSvg(svg, at, issues, figBg) {
  const all = [...svg.querySelectorAll('text,' + SHAPES)].filter((e) => !e.closest('defs,clipPath,marker,mask,pattern'));
  const order = new Map(all.map((e, i) => [e, i]));
  const texts = all.filter((e) => e.tagName === 'text' && e.textContent.trim() && shown(e));
  const shapes = all.filter((e) => e.tagName !== 'text' && shown(e));
  const boxes = new Map([...texts, ...shapes].map((e) => [e, e.getBoundingClientRect()]));
  const label = (t) => `"${t.textContent.trim().slice(0, 24)}"`;

  for (const t of texts) {
    const b = boxes.get(t);
    // 1. covered by a later shape
    const later = shapes.filter((s) => order.get(s) > order.get(t) && hit(b, boxes.get(s)) && !s.closest('.handle'));
    if (later.length) {
      let n = 0, cov = 0;
      for (let i = 1; i <= 5; i++) for (let j = 1; j <= 3; j++) {
        const x = b.left + (b.width * i) / 6, y = b.top + (b.height * j) / 4;
        n++;
        if (later.some((s) => covers(s, x, y))) cov++;
      }
      if (cov / n > 0.1) issues.push(`${at}: text ${label(t)} is ${Math.round((100 * cov) / n)}% hidden under shapes drawn on top of it`);
    }
    // 2. contrast against what is directly behind its centre
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const behind = shapes.filter((s) => order.get(s) < order.get(t) && hit(b, boxes.get(s)) && covers(s, cx, cy, 'fill'));
    const bgEl = behind[behind.length - 1];
    const bg = bgEl ? rgba(getComputedStyle(bgEl).fill) : figBg;
    const fg = rgba(getComputedStyle(t).fill);
    if (bg && fg && fg.a > 0.3 && contrast(fg, bg) < 1.6) issues.push(`${at}: text ${label(t)} has very low contrast against its background (${contrast(fg, bg).toFixed(2)})`);
  }
  // 2b. axis names and tick numbers crossed by data lines drawn under them
  const strokes = shapes.filter((s) => !s.classList.contains('grid-line') && !s.classList.contains('axis-line') && !s.closest('.handle')
    && getComputedStyle(s).stroke !== 'none' && alpha(s, 'stroke') >= 0.4 && parseFloat(getComputedStyle(s).strokeWidth) >= 1.5);
  for (const t of texts) {
    if (!t.classList.contains('axis-label') && !t.classList.contains('tick')) continue;
    const b = boxes.get(t);
    const near = strokes.filter((s) => hit(b, boxes.get(s)));
    if (!near.length) continue;
    let n = 0, cov = 0;
    for (let i = 1; i <= 7; i++) for (let j = 1; j <= 3; j++) {
      const x = b.left + (b.width * i) / 8, y = b.top + (b.height * j) / 4;
      n++;
      if (near.some((s) => { const m = s.getScreenCTM(); if (!m || !inside(clipBox(s), x, y)) return false; try { return s.isPointInStroke(new DOMPoint(x, y).matrixTransform(m.inverse())); } catch (e) { return false; } })) cov++;
    }
    if (cov / n > 0.08) issues.push(`${at}: axis text ${label(t)} has a line running through it (${Math.round((100 * cov) / n)}%)`);
  }
  // 3. text on text
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = boxes.get(texts[i]), c = boxes.get(texts[j]);
    if (!hit(a, c)) continue;
    const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    if (w <= 0 || h <= 0) continue;
    const small = Math.min(a.width * a.height, c.width * c.height);
    if ((w * h) / small > 0.25 && h > 4) issues.push(`${at}: text ${label(texts[i])} overlaps text ${label(texts[j])}`);
  }
  // 4. lines and curves hidden under later filled shapes
  for (const l of shapes) {
    const cs = getComputedStyle(l);
    if (cs.stroke === 'none' || alpha(l, 'stroke') < 0.4) continue;
    if (l.tagName !== 'line' && cs.fill !== 'none' && alpha(l, 'fill') > 0.1) continue;
    if (l.classList.contains('grid-line') || l.classList.contains('axis-line')) continue;
    let len = 0;
    try { len = l.getTotalLength(); } catch (e) { continue; }
    if (len < 40) continue;
    const m = l.getScreenCTM();
    // shapes sitting on the line's own ends (graph nodes, arrow tips, markers) are by design
    const e0 = l.getPointAtLength(0).matrixTransform(m), e1 = l.getPointAtLength(len).matrixTransform(m);
    const later = shapes.filter((s) => order.get(s) > order.get(l) && hit(boxes.get(l), boxes.get(s)) && !s.closest('.handle') && paintsFill(s)
      && !covers(s, e0.x, e0.y, 'fill') && !covers(s, e1.x, e1.y, 'fill'));
    if (!later.length) continue;
    let n = 0, cov = 0;
    for (let k = 0; k <= 24; k++) {
      const q = l.getPointAtLength((len * k) / 24).matrixTransform(m);
      n++;
      if (later.some((s) => covers(s, q.x, q.y, 'fill'))) cov++;
    }
    if (cov / n > 0.08) issues.push(`${at}: a ${l.tagName} (${cs.stroke}${l.getAttribute('stroke-dasharray') ? ', dashed' : ''}) is ${Math.round((100 * cov) / n)}% hidden under filled shapes drawn on top of it`);
  }
}

export async function check(ids, { theme, extremes = true } = {}) {
  await Promise.all([loadKatex(), loadWidgets(courses.filter((c) => !ids || ids.includes(c.id)))]);
  if (theme) document.documentElement.dataset.theme = theme;
  const host = document.createElement('div');
  host.className = 'player';
  host.style.cssText = `position:absolute;left:-12000px;top:0;width:${Math.min(680, document.documentElement.clientWidth - 32)}px;`;
  document.body.append(host);
  const figBg = rgba(getComputedStyle(document.documentElement).getPropertyValue('--surface').trim().replace(/^#(..)(..)(..)$/, (_, r, g, b) => `rgb(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)})`));
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
      } catch (e) { continue; }
      const run = (tag) => { const out = []; for (const svg of ctrl.el.querySelectorAll('svg')) if (svg.getBoundingClientRect().width > 60) inspectSvg(svg, at + tag, out, figBg); out.forEach((x) => issues.add(x)); };
      run('');
      if (step.type === 'interactive' && ctrl.reveal) { try { ctrl.reveal(); await tick(); boost(ctrl.el); run(' (solved)'); } catch (e) {} }
      try { ctrl.destroy?.(); } catch (e) {}
      // every slider at its minimum, then at its maximum
      const params = step.widget && step.widget.params;
      if (extremes && params && Object.keys(params).length) {
        for (const end of ['min', 'max']) {
          const ps = {};
          for (const [k, d] of Object.entries(params)) ps[k] = { ...d, value: d[end] ?? d.value };
          const variant = { ...step, widget: { ...step.widget, params: ps } };
          let c2;
          try { c2 = renderStep(variant, { onReady: () => {}, course: c }); host.replaceChildren(c2.el); await tick(); boost(c2.el); } catch (e) { continue; }
          const out = []; for (const svg of c2.el.querySelectorAll('svg')) if (svg.getBoundingClientRect().width > 60) inspectSvg(svg, `${at} (sliders at ${end})`, out, figBg); out.forEach((x) => issues.add(x));
          try { c2.destroy?.(); } catch (e) {}
        }
      }
    }
  }
  host.remove();
  return { steps, issues: [...issues] };
}

// Show one step full-screen (optionally solved) so it can be inspected or screenshotted.
export async function show(courseId, lessonId, n, { solved = false, end, set } = {}) {
  await Promise.all([loadKatex(), loadWidgets(courses.find((c) => c.id === courseId))]);
  const c = courses.find((x) => x.id === courseId);
  const l = c.chapters.flatMap((ch) => ch.lessons).find((x) => x.id === lessonId);
  let step = l.steps[n - 1];
  if ((end || set) && step.widget?.params) {
    const ps = {};
    // set: { 1: value } sets the 1st slider (in order), or { name: value } by parameter name
    Object.entries(step.widget.params).forEach(([k, d], i) => { ps[k] = { ...d, value: set?.[k] ?? set?.[i + 1] ?? (end ? d[end] ?? d.value : d.value) }; });
    step = { ...step, widget: { ...step.widget, params: ps } };
  }
  document.getElementById('__view')?.remove();
  const wrap = document.createElement('div');
  wrap.id = '__view';
  wrap.className = 'player';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;background:var(--bg);padding:12px 40px;';
  const ctrl = renderStep(step, { onReady: () => {}, course: c });
  wrap.append(ctrl.el);
  document.body.append(wrap);
  if (solved && ctrl.reveal) ctrl.reveal();
  const fig = wrap.querySelector('svg');
  fig?.scrollIntoView({ block: 'start' });
  return 'shown';
}
export const hide = () => document.getElementById('__view')?.remove();
