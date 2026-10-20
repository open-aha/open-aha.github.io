// Dev tool: measure every graph slider track on the site, and how many pixels each goal's target band covers.
//   const m = await import('/scripts/slider-check.js'); const r = await m.scan(); r.bad
import { courses } from '../js/courses/index.js';
import { renderStep } from '../js/steps.js';
import { loadWidgets } from '../js/widgets/index.js';
import { loadKatex } from '../js/lib/md.js';

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function tracks(step, c, width) {
  const host = document.createElement('div');
  host.className = 'player';
  host.style.cssText = `position:absolute;left:-12000px;top:0;width:${width}px`;
  document.body.append(host);
  try { host.append(renderStep(step, { onReady: () => {}, course: c }).el); } catch (e) { host.remove(); return null; }
  await frame();
  // a few named options render as buttons (no track): null
  const list = [...host.querySelectorAll('.slider input')].map((inp) => (inp.closest('.seg-slider') ? null : Math.round(inp.getBoundingClientRect().width)));
  const svg = [...host.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  const svgW = svg ? Math.round(svg.getBoundingClientRect().width) : 0;
  host.remove();
  return { list, svgW };
}

// fraction of a parameter's range that meets the goal, others held at the solution
function band(w, k) {
  const d = w.params[k], base = Object.fromEntries(Object.entries(w.params).map(([q, v]) => [q, v.value]));
  Object.assign(base, w.solution || {});
  const step = d.step || 0.1, n = Math.round((d.max - d.min) / step);
  if (!w.goal || !w.solution || n < 1) return null;
  let hits = 0;
  for (let i = 0; i <= n; i++) {
    const v = +(d.min + i * step).toFixed(9);
    try { const g = w.goal({ ...base, [k]: v }); if (g === true || (g && g.ok)) hits++; } catch (e) {}
  }
  return { hits, n: n + 1, frac: hits / (n + 1) };
}

export async function scan({ phone = 343, desk = 640, minPhone = 110, minDesk = 110, minBandPx = 4 } = {}) {
  await loadKatex();
  const rows = [], bad = [];
  for (const c of courses) {
    await loadWidgets(c);
    for (const l of c.chapters.flatMap((ch) => ch.lessons)) {
      for (const [i, st] of l.steps.entries()) {
        const w = st.widget;
        if (!w || w.kind !== 'graph' || !w.params) continue;
        const keys = Object.keys(w.params);
        if (!keys.length) continue;
        const id = `${c.id}/${l.id}#${i + 1}`;
        const P = await tracks(st, c, phone), Dk = await tracks(st, c, desk);
        if (!P) { bad.push(`${id}: render failed`); continue; }
        const sk = keys.filter((q) => w.params[q].slider !== false);
        for (const k of keys) {
          const d = w.params[k], lab = String(d.label || k).replace(/\s+/g, ' ');
          const slider = d.slider !== false, j = sk.indexOf(k);
          const tp = slider ? P.list[j] : null, td = slider ? Dk.list[j] : null;
          if (slider && tp === null) continue; // shown as buttons
          const b = st.type === 'interactive' ? band(w, k) : null;
          // a dragged point moves across the plot instead of a track
          const span = slider ? tp : P.svgW * ((d.max - d.min) / Math.max(1e-9, (/y/.test(k) ? (w.ymax - w.ymin) : (w.xmax - w.xmin)) || 1));
          const bandPx = b && b.hits ? b.frac * span : null;
          rows.push({ id, k, lab, slider, tp, td, hits: b?.hits, n: b?.n, bandPx });
          if (slider && tp != null && tp < minPhone) bad.push(`${id} [${lab}] phone track ${tp}px (desktop ${td}px)`);
          else if (slider && td != null && td < minDesk) bad.push(`${id} [${lab}] desktop track ${td}px (phone ${tp}px)`);
          // values with more than 30 steps get −/+ buttons (controls.js, graph.js), so any exact target is reachable
          if (bandPx != null && bandPx < minBandPx && b.hits < b.n && b.n <= 31) bad.push(`${id} [${lab}] goal band ${bandPx.toFixed(1)}px on phone (${b.hits}/${b.n} values${slider ? '' : ', dragged'})`);
        }
      }
    }
  }
  return { count: rows.length, bad, rows };
}
