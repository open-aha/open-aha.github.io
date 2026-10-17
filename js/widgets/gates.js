// Interactive logic circuit: click the input switches, watch signals flow to the lamps.
// spec: { width, height, inputs: [{id, x, y, value}], gates: [{id, type, in: [ids], x, y, hidden, via: [x…]}],
//         outputs: [{id, from, x, y, label}], readout(v) → md, goal(v) → bool|{ok,msg}, hint, solution: {A: 1, …},
//         solution may be an array of settings applied in order (for circuits with memory) }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';
import { evaluate } from './gates-core.js';

const GH = 44; // gate height
// shape path (top-left at 0,0), output x offset, bubble?
const SHAPES = {
  AND: { d: 'M0 0 H28 A22 22 0 0 1 28 44 H0 Z', out: 50 },
  NAND: { d: 'M0 0 H28 A22 22 0 0 1 28 44 H0 Z', out: 60, bubble: 55 },
  OR: { d: 'M0 0 Q14 22 0 44 Q36 44 56 22 Q36 0 0 0 Z', out: 56, inset: 5 },
  NOR: { d: 'M0 0 Q14 22 0 44 Q36 44 56 22 Q36 0 0 0 Z', out: 66, bubble: 61, inset: 5 },
  XOR: { d: 'M0 0 Q14 22 0 44 Q36 44 56 22 Q36 0 0 0 Z', out: 56, extra: 'M-9 0 Q5 22 -9 44', inset: 5 },
  XNOR: { d: 'M0 0 Q14 22 0 44 Q36 44 56 22 Q36 0 0 0 Z', out: 66, bubble: 61, extra: 'M-9 0 Q5 22 -9 44', inset: 5 },
  NOT: { d: 'M0 4 L42 22 L0 40 Z', out: 52, bubble: 47 },
  BUF: { d: 'M0 4 L42 22 L0 40 Z', out: 42 },
};
const HIDDEN = { d: 'M0 0 H56 V44 H0 Z', out: 56 };

export function gates(box, spec, api) {
  const W = spec.width || 600, H = spec.height || 260;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Logic circuit');
  if (spec.maxWidth) svg.style.maxWidth = spec.maxWidth + 'px';
  const start = {};
  for (const i of spec.inputs) start[i.id] = i.value ? 1 : 0;
  let inp = { ...start };
  let vals = evaluate(spec, inp);
  let touched = false;

  // port positions
  const outPort = {};
  for (const i of spec.inputs) outPort[i.id] = [i.x + 26, i.y];
  const shapeOf = (g) => (g.hidden ? HIDDEN : SHAPES[g.type]);
  for (const g of spec.gates) outPort[g.id] = [g.x + shapeOf(g).out, g.y];
  const inPorts = (g) => {
    const n = g.in.length, sh = shapeOf(g);
    return g.in.map((_, k) => [g.x + (sh.inset || 0), n === 1 ? g.y : g.y - 11 + (22 * k) / (n - 1)]);
  };

  const wireLayer = s('g', {});
  const partLayer = s('g', {});
  svg.append(wireLayer, partLayer);

  // wires: one per gate input, plus gate → lamp
  const wires = [];
  const route = ([x1, y1], [x2, y2], xm) => (Math.abs(y1 - y2) < 0.5 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} H${xm} V${y2} H${x2}`);
  for (const g of spec.gates) {
    inPorts(g).forEach((pt, k) => {
      const src = g.in[k];
      const from = outPort[src];
      const via = g.via?.[k];
      const d = Array.isArray(via) ? `M${from[0]} ${from[1]} ${via.map(([x, y]) => `L${x} ${y}`).join(' ')} L${pt[0]} ${pt[1]}` : route(from, pt, via ?? (from[0] + pt[0]) / 2);
      const el = s('path', { d, fill: 'none', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      wireLayer.append(el);
      wires.push({ el, src });
    });
  }
  for (const o of spec.outputs || []) {
    const from = outPort[o.from];
    const el = s('path', { d: route(from, [o.x - 18, o.y], o.via ?? (from[0] + o.x - 18) / 2), fill: 'none', 'stroke-width': 4, 'stroke-linejoin': 'round' });
    wireLayer.append(el);
    wires.push({ el, src: o.from });
  }

  // gates
  for (const g of spec.gates) {
    const sh = shapeOf(g);
    const grp = s('g', { transform: `translate(${g.x},${g.y - GH / 2})` });
    grp.append(s('path', { d: sh.d, class: g.hidden ? 'fl-violet-soft' : 'fl-card', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    if (sh.extra) grp.append(s('path', { d: sh.extra, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
    if (sh.bubble) grp.append(s('circle', { cx: sh.bubble, cy: GH / 2, r: 5, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 3 }));
    if (g.hidden) grp.append(s('text', { x: 28, y: GH / 2 + 9, 'text-anchor': 'middle', style: 'font-size:26px;font-weight:700', text: '?' }));
    else if (spec.labels !== false) grp.append(s('text', { x: 24, y: GH + 17, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: g.type }));
    partLayer.append(grp);
  }

  // input switches
  const switches = spec.inputs.map((i) => {
    const g = s('g', { class: 'bit', tabindex: 0, role: 'switch', 'aria-label': `input ${i.id}` });
    const track = s('rect', { x: i.x - 22, y: i.y - 15, width: 48, height: 30, rx: 15, 'stroke-width': 2.5 });
    const knob = s('circle', { cy: i.y, r: 11, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2 });
    const lbl = s('text', { x: i.x - 32, y: i.y + 6, 'text-anchor': 'end', style: 'font-weight:700;font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))', text: i.label ?? i.id });
    const bit = s('text', { x: i.x + 2, y: i.y - 22, 'text-anchor': 'middle', class: 'lbl', style: 'font-family:var(--font-mono);font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))' });
    g.append(track, knob, bit);
    partLayer.append(lbl, g);
    const flip = () => {
      inp[i.id] = inp[i.id] ? 0 : 1;
      touched = true;
      render();
      api.onChange();
    };
    g.addEventListener('click', flip);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        flip();
      }
    });
    return { i, track, knob, bit, g };
  });

  // lamps
  const lamps = (spec.outputs || []).map((o) => {
    const glow = s('circle', { cx: o.x, cy: o.y, r: 26, class: 'fl-amber', opacity: 0 });
    const bulb = s('circle', { cx: o.x, cy: o.y, r: 17, stroke: 'var(--ink)', 'stroke-width': 3 });
    const name = String(o.label ?? o.id);
    // beside the lamp if it fits, otherwise centred underneath (or above, near the bottom edge)
    const fits = o.x + 28 + name.length * 11 <= W - 6;
    const ly = o.y + 46 <= H - 4 ? o.y + 46 : o.y - 32;
    const lbl = s('text', fits ? { x: o.x + 28, y: o.y + 6, style: 'font-weight:700;font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))', text: name } : { x: o.x, y: ly, 'text-anchor': 'middle', style: 'font-weight:700;font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', text: name });
    partLayer.append(glow, bulb, lbl);
    return { o, glow, bulb };
  });

  const readout = h('div.w-readout');
  box.append(svg, readout);
  if (!spec.noReset) box.append(h('div.w-controls.center', button('Reset', () => { inp = { ...start }; vals = evaluate(spec, inp); touched = false; render(); api.onChange(); }, { icon: icons.reset })));

  function render() {
    vals = evaluate(spec, inp, vals);
    for (const w of wires) {
      const on = !!vals[w.src];
      w.el.setAttribute('stroke', on ? 'var(--coral)' : 'var(--ink-3)');
      w.el.setAttribute('opacity', on ? 1 : 0.55);
    }
    for (const sw of switches) {
      const on = !!inp[sw.i.id];
      sw.track.setAttribute('class', on ? 'fl-coral' : 'fl-surface');
      sw.track.setAttribute('stroke', on ? 'var(--coral)' : 'var(--line-2)');
      sw.knob.setAttribute('cx', sw.i.x + (on ? 13 : -9));
      sw.bit.textContent = on ? '1' : '0';
      sw.g.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    for (const l of lamps) {
      const on = !!vals[l.o.id];
      l.bulb.setAttribute('class', on ? 'fl-amber' : 'fl-card');
      l.glow.setAttribute('opacity', on ? 0.3 : 0);
    }
    if (spec.readout) readout.innerHTML = mdi(spec.readout(vals));
    else readout.innerHTML = mdi((spec.outputs || []).map((o) => `${o.label ?? o.id} = **${vals[o.id]}**`).join(', '));
  }
  render();

  return {
    ready: () => touched || spec.ready === true,
    check() {
      if (!spec.goal) return { ok: true };
      const r = spec.goal(vals);
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (!spec.solution) return;
      // a solution may be one input setting, or a sequence of settings (for circuits with memory)
      for (const stepIn of [spec.solution].flat()) {
        inp = { ...inp, ...stepIn };
        render();
      }
    },
  };
}
