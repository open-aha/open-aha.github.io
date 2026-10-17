// 1D two-cart collision with adjustable masses, velocities and restitution e (0 = sticky, 1 = elastic).
// spec: { params:{m1,m2,v1,v2,e}, goal(p, result), solution, readout, showBars }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, fix, decimals } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function collide(box, spec, api) {
  const p = { m1: spec.m1 ?? 2, m2: spec.m2 ?? 2, v1: spec.v1 ?? 2, v2: spec.v2 ?? 0, e: spec.e ?? 1 };
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const W = 600, H = 200, ground = 150, pxm = 40; // px per metre
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Collision track');
  svg.append(s('rect', { x: 0, y: ground, width: W, height: 6, class: 'fl-ink', opacity: 0.8 }));
  for (let x = 20; x < W; x += 40) svg.append(s('line', { x1: x, x2: x, y1: ground + 8, y2: ground + 14, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
  const cart = (cls) => {
    const g = s('g');
    const body = s('rect', { y: -46, height: 38, rx: 7, class: cls });
    const lbl = s('text', { y: -21, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800;font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' });
    const w1 = s('circle', { cy: -6, r: 6, class: 'fl-ink' }), w2 = s('circle', { cy: -6, r: 6, class: 'fl-ink' });
    const arrow = s('path', { class: 'fl-ink', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
    const vtxt = s('text', { y: -56, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))' });
    g.append(body, w1, w2, lbl, vtxt, arrow);
    svg.append(g);
    return { g, body, lbl, w1, w2, vtxt, arrow };
  };
  const A = cart('fl-blue'), B = cart('fl-coral');
  const status = s('text', { x: 14, y: 24, class: 'sim-time' });
  svg.append(status);

  const readout = h('div.w-readout');
  box.append(svg, readout);
  const sliders = {};
  const row = h('div.w-controls');
  // a value set by a slider shows the decimals of its step; fixed values show at most one
  const dpOf = (k) => (defs[k] ? decimals(defs[k].step || 0.5) : Number.isInteger(p[k]) ? 0 : 1);
  const mdp = { m1: dpOf('m1'), m2: dpOf('m2') };
  const fmts = { m1: (v) => `${fix(v, dpOf('m1'))} kg`, m2: (v) => `${fix(v, dpOf('m2'))} kg`, v1: (v) => `${fix(v, dpOf('v1'))} m/s`, v2: (v) => `${fix(v, dpOf('v2'))} m/s`, e: (v) => (v === 0 ? 'sticky' : v === 1 ? 'elastic' : fix(v, dpOf('e'))) };
  for (const [k, d] of Object.entries(defs)) {
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 0.5, value: d.value, color: d.color || (k.endsWith('1') ? 'blue' : k.endsWith('2') ? 'coral' : 'violet'),
      format: d.format || fmts[k],
      onInput: (v) => { p[k] = v; reset(); api.onChange(); },
    });
    row.append(sliders[k].el);
  }
  if (row.children.length) box.append(row);
  const playBtn = button('Go', () => (running ? stop() : go()), { icon: icons.play, primary: true });
  box.append(h('div.w-controls.center', playBtn, button('Reset', () => reset(), { icon: icons.reset })));

  const width = (m) => 40 + m * 10;
  let st, running = false, raf = 0, last = 0, result = null;
  function reset() {
    stop();
    st = { x1: 2.2, x2: 9.2, u1: p.v1, u2: p.v2, hit: false, t: 0 };
    result = null;
    status.textContent = '';
    draw();
    readout.innerHTML = mdi(text());
  }
  function finalVel() {
    const { m1, m2, v1, v2, e } = p;
    const P = m1 * v1 + m2 * v2;
    return [(P - m2 * e * (v1 - v2)) / (m1 + m2), (P + m1 * e * (v1 - v2)) / (m1 + m2)];
  }
  function go() {
    reset();
    running = true;
    playBtn.innerHTML = icons.pause + '<span>Stop</span>';
    last = performance.now();
    raf = requestAnimationFrame(step);
  }
  function step(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    st.t += dt;
    st.x1 += st.u1 * dt;
    st.x2 += st.u2 * dt;
    const gap = (st.x2 - width(p.m2) / 2 / pxm) - (st.x1 + width(p.m1) / 2 / pxm);
    if (!st.hit && gap <= 0 && st.u1 > st.u2) {
      st.hit = true;
      [st.u1, st.u2] = finalVel();
      const overlap = -gap;
      st.x1 -= overlap / 2;
      st.x2 += overlap / 2;
      result = { u1: st.u1, u2: st.u2 };
      status.textContent = 'Collision!';
      api.onChange();
    }
    draw();
    readout.innerHTML = mdi(text());
    const off = (x, m) => x * pxm + width(m) / 2 < -10 || x * pxm - width(m) / 2 > W + 10;
    if (st.t > 12 || (st.hit && (off(st.x1, p.m1) || off(st.x2, p.m2) || st.t > 6)) || (!st.hit && st.t > 8)) {
      if (!st.hit) status.textContent = 'They never meet!';
      stop();
      return;
    }
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    playBtn.innerHTML = icons.play + '<span>Go</span>';
  }
  function place(c, x, m, u) {
    const w = width(m);
    c.g.setAttribute('transform', `translate(${x * pxm},${ground})`);
    c.body.setAttribute('x', -w / 2);
    c.body.setAttribute('width', w);
    c.w1.setAttribute('cx', -w / 2 + 12);
    c.w2.setAttribute('cx', w / 2 - 12);
    c.lbl.textContent = `${fix(m, c === A ? mdp.m1 : mdp.m2)} kg`;
    c.vtxt.textContent = `${fix(u, 2)} m/s`;
    const L = Math.max(-60, Math.min(60, u * 14));
    c.arrow.setAttribute('d', Math.abs(L) < 2 ? '' : `M0 -66 h${L} l${-Math.sign(L) * 7} -5 v10 l${Math.sign(L) * 7} -5 z`);
    c.arrow.setAttribute('transform', 'translate(0,-6)');
  }
  function draw() {
    place(A, st.x1, p.m1, st.u1);
    place(B, st.x2, p.m2, st.u2);
  }
  function text() {
    const P0 = p.m1 * p.v1 + p.m2 * p.v2;
    const K0 = 0.5 * p.m1 * p.v1 ** 2 + 0.5 * p.m2 * p.v2 ** 2;
    if (spec.readout) return spec.readout(p, result, { P0, K0 });
    const Pn = p.m1 * st.u1 + p.m2 * st.u2;
    const Kn = 0.5 * p.m1 * st.u1 ** 2 + 0.5 * p.m2 * st.u2 ** 2;
    return `momentum $= ${fix(Pn, 2)}$ kg·m/s $\\quad$ kinetic energy $= ${fix(Kn, 2)}$ J`;
  }
  reset();

  return {
    ready: () => (spec.needRun ? !!result : true),
    check() {
      const r = spec.goal ? spec.goal(p, result) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, v] of Object.entries(spec.solution)) {
          p[k] = v;
          if (sliders[k]) sliders[k].value = v;
        }
        go();
      }
    },
    destroy: stop,
  };
}
