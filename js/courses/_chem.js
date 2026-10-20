// Shared figure builders for the chemistry courses.
import { fix } from '../lib/svg.js';

export const r = String.raw;
export const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;

// ---------- molecule widgets (js/widgets/mol.js) ----------
// build: make a molecule from a palette. target is a SMILES string the result must match.
export const build = (o) => ({ kind: 'mol', mode: 'build', h: 300, ...o });
export const view = (smiles, o = {}) => ({ kind: 'mol', mode: 'view', smiles, h: 220, ...o });
export const transfer = (atoms, o = {}) => ({ kind: 'mol', mode: 'transfer', atoms, h: 220, ...o });
export const pick = (o) => ({ kind: 'mol', mode: 'select', h: 260, ...o });
export const arrows = (o) => ({ kind: 'mol', mode: 'arrows', h: 260, ...o });
// atoms in a row (for Lewis symbols), centred in a 600-wide canvas
export const row = (els, y = 100, gap = 92) => els.map((e, i) => [e, 300 + (i - (els.length - 1) / 2) * gap, y]);

// ---------- bar chart ----------
// items: [label, value, colour]; a value can be negative (bars hang down from zero)
export function bars(items, { ymin = 0, ymax, yticks, ylabel, height = 300, fmt = (v) => fix(v, Number.isInteger(v) ? 0 : 1), unit = '', note, labelSize = 13, ...rest } = {}) {
  const n = items.length;
  return {
    kind: 'graph', xmin: 0, xmax: n, ymin, ymax, grid: false, height, padB: 58, padL: 58,
    axes: { xticks: 0, yticks: yticks || (ymax - ymin) / 4, yAt: Math.max(ymin, 0), ylabel },
    under: ({ plot, s }) => items.map(([, v, c], i) => {
      const y0 = plot.Y(Math.max(ymin, 0)), y1 = plot.Y(v);
      return s('rect', { x: plot.X(i + 0.18), width: plot.X(0.64) - plot.X(0), y: Math.min(y0, y1), height: Math.abs(y1 - y0), rx: 5, class: `fl-${c || 'blue'}` });
    }),
    extra: ({ plot, s }) => items.flatMap(([lab, v], i) => [
      s('text', { x: plot.X(i + 0.5), y: v >= 0 ? plot.Y(v) - 8 : plot.Y(0) - 8, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(14), text: fmt(v) + unit }),
      ...String(lab).split('\n').map((ln, k) => s('text', { x: plot.X(i + 0.5), y: plot.bottom + 20 + k * 16, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(labelSize)}`, text: ln })),
    ]),
    ...rest,
  };
}
