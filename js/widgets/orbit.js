// Newton's cannonball / orbit simulator. Units: planet radius = 1, GM = 1.
// Circular speed at radius r is 1/sqrt(r); escape speed is sqrt(2/r).
// spec: { r0, params:{v:{...}}, showKepler (equal-area sweeps), view (half-width), goal(p, result), solution, readout, unitSpeed (km/s per unit) }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, fix } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function orbit(box, spec, api) {
  const r0 = spec.r0 ?? 1.08;
  const p = { v: spec.v ?? 0.9 };
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const view = spec.view ?? 3.2;
  const W = 600, H = spec.height || 440;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Orbit simulation');
  const cx = spec.planetX ?? W / 2, cy = H / 2;
  const sc = (Math.min(W, H) / 2 - 10) / view;
  const X = (x) => cx + x * sc, Y = (y) => cy - y * sc;

  // stars
  for (let i = 0; i < 40; i++) svg.append(s('circle', { cx: (i * 137.5) % W, cy: (i * 71.3) % H, r: i % 4 ? 1 : 1.6, class: 'fl-muted', opacity: 0.5 }));
  svg.append(s('circle', { cx, cy, r: sc, class: spec.planetClass || 'fl-blue', opacity: 0.9 }));
  if (!spec.sun) svg.append(s('path', { d: `M${cx - sc * 0.6} ${cy - sc * 0.2} q ${sc * 0.3} ${-sc * 0.35} ${sc * 0.6} ${-sc * 0.1} t ${sc * 0.5} ${sc * 0.2}`, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 6, opacity: 0.7 }));
  // mountain + cannon
  if (!spec.sun) svg.append(s('path', { d: `M${X(-0.14)} ${Y(Math.sqrt(1 - 0.0196))} L${X(0)} ${Y(r0 - 0.005)} L${X(0.14)} ${Y(Math.sqrt(1 - 0.0196))} Z`, class: 'fl-muted' }));
  const sweeps = s('g');
  const trail = s('path', { fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 });
  const ghost = s('path', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 6' });
  const ball = s('circle', { r: 6, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 });
  svg.append(sweeps, ghost, trail, ball);
  const status = s('text', { x: 14, y: 24, class: 'sim-time' });
  svg.append(status);

  const readout = h('div.w-readout');
  box.append(svg, readout);
  const sliders = {};
  const row = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 0.01, value: d.value, color: d.color || 'coral',
      format: d.format || ((v) => `${fix(v * (spec.unitSpeed || 1), 1)}${spec.unitSpeed ? ' km/s' : ''}`),
      onInput: (v) => { p[k] = v; reset(); api.onChange(); },
    });
    row.append(sliders[k].el);
  }
  if (row.children.length) box.append(row);
  const playBtn = button('Fire', () => (running ? stop() : fire()), { icon: icons.play, primary: true });
  box.append(h('div.w-controls.center', playBtn, button('Reset', () => reset(), { icon: icons.reset })));

  let st, running = false, raf = 0, result = null, fired = false;
  function reset() {
    stop();
    st = { x: 0, y: r0, vx: p.v, vy: 0, t: 0, pts: [[0, r0]], angle: 0, done: false };
    result = null;
    trail.setAttribute('d', '');
    sweeps.replaceChildren();
    ball.setAttribute('cx', X(0));
    ball.setAttribute('cy', Y(r0));
    status.textContent = '';
    if (spec.preview) ghost.setAttribute('d', previewPath());
    readout.innerHTML = mdi(spec.readout ? spec.readout(p, null) : '');
  }
  function accel(x, y) {
    const r2 = x * x + y * y, r = Math.sqrt(r2);
    return [-x / (r2 * r), -y / (r2 * r)];
  }
  function previewPath() {
    let x = 0, y = r0, vx = p.v, vy = 0, d = `M${X(x)} ${Y(y)}`;
    for (let i = 0; i < 4000; i++) {
      [x, y, vx, vy] = verlet(x, y, vx, vy, 0.01);
      if (i % 4 === 0) d += `L${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
      const r = Math.hypot(x, y);
      if (r < 1 || r > view * 2.2) break;
    }
    return d;
  }
  function verlet(x, y, vx, vy, dt) {
    let [ax, ay] = accel(x, y);
    vx += 0.5 * dt * ax; vy += 0.5 * dt * ay;
    x += dt * vx; y += dt * vy;
    [ax, ay] = accel(x, y);
    vx += 0.5 * dt * ax; vy += 0.5 * dt * ay;
    return [x, y, vx, vy];
  }
  function fire() {
    reset();
    running = true;
    fired = true;
    playBtn.innerHTML = icons.pause + '<span>Stop</span>';
    let lastSweep = 0, sweepPts = [[0, r0]];
    const sweepEvery = spec.sweepEvery || 1.2;
    let lastT = performance.now();
    const step = (now) => {
      const real = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const simDt = real * (spec.speed || 2.2);
      const sub = 30;
      for (let i = 0; i < sub && !st.done; i++) {
        const prev = [st.x, st.y];
        [st.x, st.y, st.vx, st.vy] = verlet(st.x, st.y, st.vx, st.vy, simDt / sub);
        st.t += simDt / sub;
        // accumulate swept angle to detect one full orbit
        st.angle += Math.atan2(prev[0] * st.y - prev[1] * st.x, prev[0] * st.x + prev[1] * st.y);
        const r = Math.hypot(st.x, st.y);
        if (r < 1) finish('crash');
        else if (r > view * 2.4) finish('escape');
        else if (Math.abs(st.angle) >= 2 * Math.PI) finish('orbit');
        if (spec.showKepler) {
          sweepPts.push([st.x, st.y]);
          if (st.t - lastSweep >= sweepEvery) {
            // equal-time wedge from the planet through the arc just travelled
            const d = `M${X(0)} ${Y(0)} ` + sweepPts.filter((_, k) => k % 3 === 0 || k === sweepPts.length - 1).map(([x, y]) => `L${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' ') + ' Z';
            sweeps.append(s('path', { d, class: sweeps.children.length % 2 ? 'fl-amber' : 'fl-teal', opacity: 0.3 }));
            sweepPts = [[st.x, st.y]];
            lastSweep = st.t;
          }
        }
      }
      st.pts.push([st.x, st.y]);
      if (st.pts.length > 3000) st.pts.splice(0, 1);
      trail.setAttribute('d', st.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(''));
      ball.setAttribute('cx', X(st.x));
      ball.setAttribute('cy', Y(st.y));
      if (st.done) return stop();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function finish(kind) {
    st.done = true;
    // classify the closed orbit's shape from its energy and angular momentum
    const E = 0.5 * p.v * p.v - 1 / r0;
    let shape = kind;
    if (kind === 'orbit') shape = Math.abs(p.v - 1 / Math.sqrt(r0)) < 0.015 ? 'circle' : 'ellipse';
    result = { kind, shape, E };
    const names = { crash: 'Fell back to the ground', escape: 'Escaped!', circle: 'Circular orbit', ellipse: 'Elliptical orbit' };
    status.textContent = names[shape];
    readout.innerHTML = mdi(spec.readout ? spec.readout(p, result) : names[shape]);
    api.onChange();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    playBtn.innerHTML = icons.play + '<span>Fire</span>';
  }
  reset();

  return {
    ready: () => (spec.needRun ? !!result : fired || spec.ready === true),
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
        fire();
      }
    },
    destroy: stop,
  };
}
