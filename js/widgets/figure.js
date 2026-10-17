// Static or lightly animated figure drawn by a function.
// spec: { w, h, draw: ({s, arrow, svg, w, h}) => elements, label, maxWidth }
import { s, svgRoot, arrow, Plot, fmt } from '../lib/svg.js';

export function figure(box, spec) {
  const w = spec.w || 600, ht = spec.h || 300;
  const svg = svgRoot(w, ht);
  if (spec.label) svg.setAttribute('aria-label', spec.label);
  if (spec.maxWidth) {
    svg.style.maxWidth = spec.maxWidth + 'px';
    svg.style.margin = '0 auto';
  }
  const els = spec.draw({ s, arrow, svg, w, h: ht, Plot, fmt });
  for (const e of [els].flat(Infinity)) if (e) svg.append(e);
  box.append(svg);
  return {};
}
