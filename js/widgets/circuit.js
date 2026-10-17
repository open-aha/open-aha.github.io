// Simple DC circuit: battery + loads in 'single' | 'series' | 'parallel' layout.
// spec: { layout, params:{V, R1, R2}, loads:'bulb'|'resistor', showMeters, goal(p, res), solution, readout }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, fix, decimals } from '../lib/svg.js';
import { slider } from './controls.js';

export function circuit(box, spec, api) {
  const p = { V: spec.V ?? 6, R1: spec.R1 ?? 3, R2: spec.R2 ?? 3, broken: false };
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  // a value set by a slider shows the decimals of its step; fixed values show at most one
  const dp = (k) => (defs[k] ? decimals(defs[k].step || 1) : Number.isInteger(p[k]) ? 0 : 1);
  const layout = spec.layout || 'single';
  const kind = spec.loads || 'bulb';
  let touched = false, raf = 0, last = 0, offsets = {};

  const W = 600, H = 300;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Circuit diagram');
  const wires = s('g', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linejoin': 'round' });
  const dotsG = s('g');
  const parts = s('g');
  const labels = s('g');
  svg.append(wires, dotsG, parts, labels);

  // geometry
  const L = 90, R = 520, T = 60, B = 250;
  const paths = {}; // name -> svg path for current dots
  const addPath = (name, d) => {
    const el = s('path', { d });
    wires.append(el);
    paths[name] = el;
  };
  if (layout === 'parallel') {
    // main loop: battery (left) up to top rail, down the right... branches at x=300 and x=450
    addPath('main', `M${L} ${(T + B) / 2 - 40} L${L} ${T} L300 ${T} M300 ${B} L${L} ${B} L${L} ${(T + B) / 2 + 40}`);
    addPath('b1', `M300 ${T} L300 ${B}`);
    addPath('top2', `M300 ${T} L450 ${T} L450 ${B} L300 ${B}`);
  } else {
    addPath('main', `M${L} ${(T + B) / 2 - 40} L${L} ${T} L${R} ${T} L${R} ${B} L${L} ${B} L${L} ${(T + B) / 2 + 40}`);
  }
  // battery symbol on the left wire
  const by = (T + B) / 2;
  parts.append(
    s('rect', { x: L - 30, y: by - 40, width: 60, height: 80, fill: 'var(--surface)' }),
    s('line', { x1: L - 26, x2: L + 26, y1: by - 10, y2: by - 10, stroke: 'var(--ink)', 'stroke-width': 4 }),
    s('line', { x1: L - 14, x2: L + 14, y1: by + 10, y2: by + 10, stroke: 'var(--ink)', 'stroke-width': 8 }),
    s('line', { x1: L, x2: L, y1: by - 40, y2: by - 10, stroke: 'var(--ink)', 'stroke-width': 4 }),
    s('line', { x1: L, x2: L, y1: by + 10, y2: by + 40, stroke: 'var(--ink)', 'stroke-width': 4 }),
    s('text', { x: L + 32, y: by - 14, class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', text: '+' }),
  );
  const vLabel = s('text', { x: L - 40, y: by + 6, 'text-anchor': 'end', class: 'lbl', style: 'font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px))' });
  labels.append(vLabel);

  function load(cx, cy, vertical, name) {
    const g = s('g', { transform: `translate(${cx},${cy})${vertical ? ' rotate(90)' : ''}` });
    const glow = s('circle', { r: 30, fill: 'var(--amber)', opacity: 0 });
    const body = s('g');
    if (kind === 'bulb') {
      body.append(
        s('circle', { r: 20, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 3 }),
        s('path', { d: 'M-12 -12 L12 12 M12 -12 L-12 12', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      );
    } else {
      body.append(
        s('rect', { x: -40, y: -16, width: 80, height: 32, fill: 'var(--surface)' }),
        s('path', { d: 'M-40 0 L-30 0 L-25 -12 L-15 12 L-5 -12 L5 12 L15 -12 L25 12 L30 0 L40 0', fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }),
      );
    }
    g.append(glow, body);
    parts.append(g);
    // a load on the right-hand wire gets its label inside the loop, so it isn't cut off at the edge
    const inside = vertical && cx > W * 0.75;
    // bulbs glow out to a radius of 48, so their labels sit beyond it; a load on the top wire is labelled inside the loop
    const off = kind === 'bulb' ? 56 : 32;
    const below = !vertical && kind === 'bulb' && cy < (T + B) / 2;
    const under = vertical && layout === 'parallel'; // side by side branches: label under each one
    const txt = under
      ? s('text', { x: cx, y: cy + off + 12, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))' })
      : s('text', { x: cx + (vertical ? (inside ? -off : off) : 0), y: cy + (vertical ? 5 : below ? off + 6 : -off), 'text-anchor': vertical ? (inside ? 'end' : 'start') : 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))' });
    labels.append(txt);
    return { glow, txt, name };
  }
  const loads = [];
  if (layout === 'single') loads.push(load(R, (T + B) / 2, true, 'R1'));
  if (layout === 'series') { loads.push(load(260, T, false, 'R1')); loads.push(load(400, T, false, 'R2')); }
  if (layout === 'parallel') { loads.push(load(300, (T + B) / 2, true, 'R1')); loads.push(load(450, (T + B) / 2, true, 'R2')); }

  // solve
  function solve() {
    const { V, R1, R2 } = p;
    if (layout === 'single') {
      const I = V / R1;
      return { I, branch: { R1: { I, V, P: V * I } }, Req: R1 };
    }
    if (layout === 'series') {
      const Req = R1 + R2, I = V / Req;
      return { I, Req, branch: { R1: { I, V: I * R1, P: I * I * R1 }, R2: { I, V: I * R2, P: I * I * R2 } } };
    }
    const I1 = V / R1, I2 = V / R2;
    return { I: I1 + I2, Req: 1 / (1 / R1 + 1 / R2), branch: { R1: { I: I1, V, P: V * I1 }, R2: { I: I2, V, P: V * I2 } } };
  }

  const readout = h('div.w-readout');
  box.append(svg, readout);
  const sliders = {};
  const row = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color || (k === 'V' ? 'amber' : 'coral'),
      format: d.format || ((v) => `${fix(v, decimals(d.step || 1))} ${k === 'V' ? 'V' : 'Ω'}`),
      onInput: (v) => { p[k] = v; touched = true; draw(); api.onChange(); },
    });
    row.append(sliders[k].el);
  }
  if (row.children.length) box.append(row);

  function draw() {
    const res = solve();
    vLabel.textContent = `${fix(p.V, dp('V'))} V`;
    const maxP = spec.maxPower || 12;
    loads.forEach((ld) => {
      const b = res.branch[ld.name];
      const bright = Math.min(1, b.P / maxP);
      ld.glow.setAttribute('opacity', kind === 'bulb' ? (0.15 + 0.75 * bright) * (b.P > 0.01 ? 1 : 0) : 0);
      ld.glow.setAttribute('r', 22 + 26 * bright);
      ld.txt.textContent = spec.showMeters === false ? '' : `${fix(p[ld.name], dp(ld.name))} Ω · ${fix(b.I, 2)} A`;
    });
    readout.innerHTML = mdi(spec.readout ? spec.readout({ ...p, ...res }) : `Total current $I = ${fix(res.I, 2)}$ A`);
    return res;
  }

  // animated current dots (conventional current: + terminal, clockwise from the top of the battery)
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const res = solve();
    const speeds = { main: res.I, b1: res.branch.R1?.I ?? 0, top2: res.branch.R2?.I ?? 0 };
    dotsG.replaceChildren();
    for (const [name, el] of Object.entries(paths)) {
      const len = el.getTotalLength();
      if (!len) continue;
      offsets[name] = ((offsets[name] || 0) + speeds[name] * 40 * dt) % 26;
      for (let d = offsets[name]; d < len; d += 26) {
        const pt = el.getPointAtLength(d);
        dotsG.append(s('circle', { cx: pt.x, cy: pt.y, r: 3.5, class: 'fl-amber' }));
      }
    }
    raf = requestAnimationFrame(frame);
  }
  draw();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  return {
    ready: () => touched || spec.ready === true,
    check() {
      const r = spec.goal ? spec.goal(p, solve()) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, v] of Object.entries(spec.solution)) {
          p[k] = v;
          if (sliders[k]) sliders[k].value = v;
        }
        draw();
      }
    },
    destroy: () => cancelAnimationFrame(raf),
  };
}
