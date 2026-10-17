// Dev tool: render every step in the browser and report drawing problems.
// Usage (in the browser console on the dev server):
//   const m = await import('/scripts/render-check.js'); await m.check(['series'])
import { courses } from '../js/courses/index.js';
import { renderStep } from '../js/steps.js';

const BAD = /NaN|undefined|Infinity/;
const tick = () => new Promise((r) => setTimeout(r, 0));

export async function check(ids) {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-12000px;top:0;width:680px;';
  document.body.append(host);
  const issues = [];
  let steps = 0;
  for (const c of courses) {
    if (ids && !ids.includes(c.id)) continue;
    for (const ch of c.chapters) for (const l of ch.lessons) {
      for (let i = 0; i < l.steps.length; i++) {
        const step = l.steps[i];
        const at = `${c.id}/${l.id}#${i + 1}`;
        steps++;
        let ctrl;
        try {
          ctrl = renderStep(step, { onReady: () => {}, course: c });
          host.replaceChildren(ctrl.el);
          await tick();
        } catch (e) {
          issues.push(`${at}: render throws ${e.message}`);
          continue;
        }
        const el = ctrl.el;
        if (el.querySelector('.katex-error')) issues.push(`${at}: KaTeX error "${el.querySelector('.katex-error').textContent.slice(0, 60)}"`);
        for (const n of el.querySelectorAll('svg *')) {
          for (const a of n.attributes) {
            if (BAD.test(a.value) && a.name !== 'aria-label') { issues.push(`${at}: <${n.tagName} ${a.name}="${a.value.slice(0, 50)}">`); break; }
          }
        }
        for (const r of el.querySelectorAll('.w-readout, .readout')) if (BAD.test(r.textContent)) issues.push(`${at}: readout "${r.textContent.slice(0, 80)}"`);
        for (const t of el.querySelectorAll('svg text')) if (BAD.test(t.textContent)) issues.push(`${at}: svg text "${t.textContent}"`);
        // labels that fall outside their drawing (screen coordinates, so transforms count)
        for (const svg of el.querySelectorAll('svg')) {
          const S = svg.getBoundingClientRect();
          if (!S.width) continue;
          for (const t of svg.querySelectorAll('text')) {
            if (!t.textContent.trim() || t.closest('[visibility="hidden"],[display="none"]')) continue;
            const b = t.getBoundingClientRect();
            if (!b.width) continue;
            const out = b.right < S.left || b.left > S.right || b.bottom < S.top || b.top > S.bottom;
            const clipped = !out && (b.left < S.left - 3 || b.right > S.right + 3 || b.top < S.top - 3 || b.bottom > S.bottom + 3);
            if (out) issues.push(`${at}: label "${t.textContent.slice(0, 30)}" lies outside the drawing`);
            else if (clipped) issues.push(`${at}: label "${t.textContent.slice(0, 30)}" is cut off at the edge`);
          }
        }
        if (step.widget && step.widget.kind === 'graph') {
          const drawn = el.querySelectorAll('svg path[d]:not([d=""]), svg line, svg circle, svg rect, svg polygon, svg ellipse');
          if (drawn.length < 2) issues.push(`${at}: graph draws almost nothing (${drawn.length} shapes)`);
        }
        if (step.type === 'interactive' && ctrl.reveal) {
          try {
            ctrl.reveal();
            await tick();
            const r = ctrl.check();
            if (!r.correct) issues.push(`${at}: revealed solution is not accepted${r.msg ? ' (' + String(r.msg).slice(0, 60) + ')' : ''}`);
          } catch (e) {
            issues.push(`${at}: reveal/check throws ${e.message}`);
          }
        }
        try { ctrl.destroy?.(); } catch (e) {}
      }
    }
  }
  host.remove();
  return { steps, issues };
}
