// Projectile launcher (no air resistance).
// spec: { g, h0, xmax, ymax, params:{angle:{...}, speed:{...}}, target:{x, w}, preview, drop (compare with dropped ball),
//         strobe, showVectors, goal:(run)=>bool|{ok,msg}, solution, hint, needLaunch }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, Plot, arrow, fmt, fix, decimals, clamp } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function projectile(box, spec, api) {
  const g = spec.g ?? 9.8;
  const h0 = spec.h0 ?? 0;
  const p = {};
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const getAngle = () => p.angle ?? spec.angle ?? 45;
  const getSpeed = () => p.speed ?? spec.speed ?? 15;
  let launched = false, lastRun = null, raf = 0, flying = false;

  const xmax = spec.xmax ?? 40, ymax = spec.ymax ?? 22;
  const plot = new Plot({ width: 600, height: spec.height || 340, xmin: spec.xmin ?? -2, xmax, ymin: 0, ymax, padL: 36, padB: 36, padT: 16, padR: 16 });
  const gs = spec.gridStep || 5;
  plot.grid(gs, gs);
  // the cannon sits on the origin; from a ledge, the y axis moves to the left edge so the ledge does not hide its numbers
  plot.axes({ xticks: gs, yticks: gs, xlabel: 'x (m)', ylabel: 'y (m)', origin: false, xAt: h0 > 0 ? (spec.xmin ?? -2) : 0 });
  const svg = plot.svg;
  svg.setAttribute('aria-label', 'Projectile launcher');

  // ground
  plot.layers.under.append(s('rect', { x: plot.left, y: plot.Y(0), width: plot.right - plot.left, height: 6, class: 'fl-ink', opacity: 0.85 }));
  // platform if h0 > 0
  if (h0 > 0) plot.layers.under.append(s('rect', { x: plot.X(-2), y: plot.Y(h0), width: plot.X(0.6) - plot.X(-2), height: plot.Y(0) - plot.Y(h0), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
  // target
  let targetEl = null;
  if (spec.target) {
    targetEl = s('rect', { x: plot.X(spec.target.x - spec.target.w / 2), y: plot.Y(0) - 8, width: plot.X(spec.target.w) - plot.X(0), height: 10, rx: 3, class: 'fl-teal' });
    plot.layers.under.append(targetEl, s('text', { x: plot.X(spec.target.x), y: plot.Y(0) - 16, 'text-anchor': 'middle', class: 'lbl fl-teal', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: spec.target.label || 'Target' }));
  }
  const clip = plot.clip();
  const previewPath = s('path', { class: 'curve st-muted', 'stroke-dasharray': '4 8', style: 'stroke-width:2.5', 'clip-path': clip });
  const trail = s('path', { class: 'curve st-coral', style: 'stroke-width:3', 'clip-path': clip });
  const strobeG = s('g', { 'clip-path': clip });
  const dropStrobe = s('g', { 'clip-path': clip });
  plot.layers.main.append(previewPath, trail, strobeG, dropStrobe);
  // cannon
  const cannon = s('g');
  cannon.append(
    s('rect', { x: -4, y: -9, width: 46, height: 18, rx: 8, class: 'fl-ink' }),
    s('circle', { r: 13, class: 'fl-ink' }),
  );
  const ball = s('circle', { r: 8, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2.5 });
  const dropBall = s('circle', { r: 8, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 2.5 });
  const vxArrow = arrow(0, 0, 0, 0, { color: 'var(--blue)', width: 3.5, head: 10 });
  const vyArrow = arrow(0, 0, 0, 0, { color: 'var(--teal)', width: 3.5, head: 10 });
  plot.layers.handles.append(cannon, ball, vxArrow, vyArrow);
  if (spec.drop) plot.layers.handles.append(dropBall);
  const landTxt = s('text', { class: 'lbl', 'text-anchor': 'middle', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' });
  const landMark = s('path', { class: 'fl-coral' });
  plot.layers.labels.append(landMark, landTxt);

  const readout = h('div.w-readout');
  const sliderRow = h('div.w-controls');
  const sliders = {};
  for (const [k, d] of Object.entries(defs)) {
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color || (k === 'angle' ? 'violet' : 'coral'),
      format: d.format || ((v) => (k === 'angle' ? `${fix(v, decimals(d.step || 1))}°` : `${fix(v, decimals(d.step || 1))} m/s`)),
      onInput: (v) => { p[k] = v; launched = false; lastRun = null; cancel(); aim(); api.onChange(); },
    });
    sliderRow.append(sliders[k].el);
  }
  const launchBtn = button('Launch', () => launch(), { icon: icons.play, primary: true });
  const controls = h('div.w-controls.center', launchBtn);

  box.append(svg, readout);
  if (sliderRow.children.length) box.append(sliderRow);
  box.append(controls);

  const vx0 = () => getSpeed() * Math.cos((getAngle() * Math.PI) / 180);
  const vy0 = () => getSpeed() * Math.sin((getAngle() * Math.PI) / 180);
  const posAt = (t) => ({ x: vx0() * t, y: h0 + vy0() * t - 0.5 * g * t * t });
  const flightTime = () => (vy0() + Math.sqrt(vy0() ** 2 + 2 * g * h0)) / g;

  function aim() {
    const ang = getAngle();
    cannon.setAttribute('transform', `translate(${plot.X(0)},${plot.Y(h0)}) rotate(${-ang})`);
    ball.setAttribute('cx', plot.X(0));
    ball.setAttribute('cy', plot.Y(h0));
    dropBall.setAttribute('cx', plot.X(0));
    dropBall.setAttribute('cy', plot.Y(h0));
    trail.setAttribute('d', '');
    strobeG.replaceChildren();
    dropStrobe.replaceChildren();
    landTxt.textContent = '';
    landMark.setAttribute('d', '');
    vxArrow.update(0, 0, 0, 0);
    vyArrow.update(0, 0, 0, 0);
    const T = flightTime();
    previewPath.setAttribute('d', spec.preview ? plot.paramPath((t) => posAt(t).x, (t) => posAt(t).y, 0, T, 120) : '');
    updateReadout();
  }

  function updateReadout() {
    const T = flightTime();
    const range = vx0() * T;
    const peak = h0 + vy0() ** 2 / (2 * g);
    readout.innerHTML = mdi(spec.readout ? spec.readout({ angle: getAngle(), speed: getSpeed(), range, peak, T, last: lastRun }) : `$v_x = ${fix(vx0(), 1)}$ m/s &nbsp; $v_y = ${fix(vy0(), 1)}$ m/s`);
  }

  function cancel() {
    cancelAnimationFrame(raf);
    flying = false;
  }

  function launch() {
    cancel();
    aim();
    flying = true;
    const T = flightTime();
    const t0 = performance.now();
    const slow = spec.slow || 1;
    let nextStrobe = 0;
    const st = spec.strobe ?? 0.25;
    const step = (now) => {
      const t = Math.min(T, ((now - t0) / 1000) / slow);
      const pos = posAt(t);
      ball.setAttribute('cx', plot.X(pos.x));
      ball.setAttribute('cy', plot.Y(Math.max(0, pos.y)));
      trail.setAttribute('d', plot.paramPath((u) => posAt(u).x, (u) => posAt(u).y, 0, t, 80));
      if (spec.drop) {
        const dy = Math.max(0, h0 - 0.5 * g * t * t);
        dropBall.setAttribute('cy', plot.Y(dy));
      }
      while (st && nextStrobe <= t + 1e-9) {
        const q = posAt(nextStrobe);
        strobeG.append(s('circle', { cx: plot.X(q.x), cy: plot.Y(q.y), r: 4, class: 'fl-coral', opacity: 0.4 }));
        if (spec.drop) dropStrobe.append(s('circle', { cx: plot.X(0), cy: plot.Y(Math.max(0, h0 - 0.5 * g * nextStrobe ** 2)), r: 4, class: 'fl-violet', opacity: 0.4 }));
        nextStrobe += st;
      }
      if (spec.showVectors) {
        const sc = spec.vecScale || 4;
        const vy = vy0() - g * t;
        const bx = plot.X(pos.x), by = plot.Y(pos.y);
        vxArrow.update(bx, by, bx + vx0() * sc, by);
        vyArrow.update(bx, by, bx, by - vy * sc);
      }
      if (t < T) raf = requestAnimationFrame(step);
      else land(T);
    };
    raf = requestAnimationFrame(step);
  }

  function land(T) {
    flying = false;
    const range = vx0() * T;
    const lx = plot.X(range);
    landMark.setAttribute('d', `M${lx} ${plot.Y(0) - 2} l-6 -10 h12 z`);
    landTxt.setAttribute('x', clamp(lx, plot.left + 30, plot.right - 30));
    landTxt.setAttribute('y', plot.Y(0) - 18);
    landTxt.textContent = `${fix(range, 1)} m`;
    launched = true;
    lastRun = { angle: getAngle(), speed: getSpeed(), range, T, peak: h0 + vy0() ** 2 / (2 * g) };
    updateReadout();
    if (spec.target && Math.abs(range - spec.target.x) <= spec.target.w / 2) {
      targetEl.animate?.([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], { duration: 500, iterations: 2 });
    }
    api.onChange();
  }

  aim();

  return {
    ready: () => (spec.needLaunch === false ? true : launched),
    check() {
      const run = lastRun || { angle: getAngle(), speed: getSpeed() };
      if (spec.goal) {
        const r = spec.goal(run);
        if (typeof r === 'object') return r;
        return { ok: !!r, msg: r ? null : spec.hint };
      }
      if (spec.target) {
        const ok = Math.abs(run.range - spec.target.x) <= spec.target.w / 2;
        return { ok, msg: ok ? null : run.range < spec.target.x ? `Landed at ${fmt(run.range, 1)} m: too short.` : `Landed at ${fmt(run.range, 1)} m: too far.` };
      }
      return { ok: true };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, v] of Object.entries(spec.solution)) {
          p[k] = v;
          if (sliders[k]) sliders[k].value = v;
        }
        launch();
      }
    },
    destroy: cancel,
  };
}
