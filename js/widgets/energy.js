// Ball on a curved track with live energy bars (KE, PE, thermal).
// spec: { track:(x)=>height(m), xmin, xmax, ymax, x0 (release x), m, g, mu (friction coeff, drag model), T,
//         params:{m, mu, x0}, dragStart:true, bars:['ke','pe','th','total'], goal, needRun, solution, readout }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, Plot, fix, clamp, sticky, draggable } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function energy(box, spec, api) {
  const g = spec.g ?? 9.8;
  const p = { m: spec.m ?? 1, mu: spec.mu ?? 0, x0: spec.x0 ?? (spec.xmin ?? -5) + 0.5 };
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const f = spec.track;
  const df = (x) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
  const xmin = spec.xmin ?? -5, xmax = spec.xmax ?? 5, ymax = spec.ymax ?? 6;
  let x = p.x0, vs = 0, t = 0, thermal = 0, raf = 0, last = 0, playing = false, ran = false, touched = false;
  let maxSpeed = 0, lowest = Infinity;

  const plot = new Plot({ width: 600, height: spec.height || 300, xmin, xmax, ymin: -0.4, ymax, padL: 44, padR: 150, padT: 16, padB: 24 });
  plot.grid(1, 1);
  // height axis
  plot.layers.axes.append(s('line', { x1: plot.left, x2: plot.left, y1: plot.top, y2: plot.Y(0), class: 'axis-line' }));
  for (let yy = 0; yy <= ymax; yy += spec.yStep || 1) {
    plot.layers.axes.append(s('text', { x: plot.left - 8, y: plot.Y(yy) + 4, 'text-anchor': 'end', class: 'tick', text: `${yy}` }));
  }
  plot.layers.axes.append(s('text', { x: plot.left + 6, y: plot.top + 10, class: 'axis-label', text: 'h (m)' }));
  const trackPath = plot.fnPath(f, xmin, xmax, 300);
  plot.layers.under.append(s('path', { d: `${trackPath} L${plot.X(xmax)} ${plot.Y(-0.4)} L${plot.X(xmin)} ${plot.Y(-0.4)} Z`, class: 'fl-surface', opacity: 0.8 }));
  plot.layers.main.append(s('path', { d: trackPath, class: 'curve st-ink', style: 'stroke-width:4' }));
  const startLine = s('line', { stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' });
  plot.layers.main.append(startLine);
  const ball = s('g', { class: spec.dragStart ? 'handle' : '' });
  if (spec.dragStart) ball.append(s('circle', { r: 22, class: 'halo fl-coral' }));
  ball.append(s('circle', { r: 11, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 3 }));
  plot.layers.handles.append(ball);

  // energy bars on the right
  const bars = spec.bars || ['ke', 'pe', 'th', 'total'];
  const BAR = { ke: ['KE', 'blue'], pe: ['PE', 'teal'], th: ['Heat', 'coral'], total: ['Total', 'ink'] };
  const bx0 = 600 - 140, bw = 26, gap = 8, by0 = plot.Y(0), bh = by0 - plot.top - 10;
  const barEls = {};
  bars.forEach((k, i) => {
    const xx = bx0 + i * (bw + gap);
    const rect = s('rect', { x: xx, width: bw, rx: 4, class: `fl-${BAR[k][1]}` });
    const lbl = s('text', { x: xx + bw / 2, y: by0 + 16, 'text-anchor': 'middle', class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', text: BAR[k][0] });
    plot.layers.labels.append(rect, lbl);
    barEls[k] = rect;
  });
  plot.layers.labels.append(s('line', { x1: bx0 - 6, x2: 600 - 8, y1: by0, y2: by0, stroke: 'var(--axis)', 'stroke-width': 1.5 }));

  const readout = h('div.w-readout');
  box.append(plot.svg, readout);
  const sliders = {};
  const sliderRow = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    if (d.slider === false) continue;
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 0.1, value: d.value, color: d.color || 'blue', format: d.format,
      onInput: (v) => { p[k] = v; touched = true; reset(); api.onChange(); },
    });
    sliderRow.append(sliders[k].el);
  }
  if (sliderRow.children.length) box.append(sliderRow);
  const playBtn = button('Release', () => (playing ? pause() : play()), { icon: icons.play, primary: true });
  const resetBtn = button('Reset', () => reset(), { icon: icons.reset });
  box.append(h('div.w-controls.center', playBtn, resetBtn));

  if (spec.dragStart) {
    draggable(ball, plot.svg, {
      onMove: ({ x: px }) => {
        if (playing) return;
        const d = defs.x0 || { min: xmin + 0.2, max: xmax - 0.2, step: 0.1 };
        p.x0 = sticky(p.x0, plot.invX(px), d.min, d.max, d.step || 0.1);
        touched = true;
        reset();
        api.onChange();
      },
    });
  }

  const E0 = () => p.m * g * f(p.x0);
  function reset() {
    pause();
    x = p.x0; vs = 0; t = 0; thermal = 0; maxSpeed = 0; lowest = f(x); ran = false;
    draw();
  }
  function step(dt) {
    const s1 = df(x), n = Math.sqrt(1 + s1 * s1);
    // tangential acceleration from gravity plus a simple friction-like drag (energy goes to heat)
    const aG = (-g * s1) / n;
    const aF = p.mu > 0 && Math.abs(vs) > 1e-6 ? -Math.sign(vs) * p.mu * g / n : 0;
    let nv = vs + (aG + aF) * dt;
    if (p.mu > 0 && Math.abs(vs) > 1e-6 && Math.sign(nv) !== Math.sign(vs) && Math.abs(aG) <= p.mu * g / n) nv = 0;
    const dx = ((vs + nv) / 2) * dt / n;
    const nx = clamp(x + dx, xmin, xmax);
    // work done by friction becomes heat
    if (p.mu > 0) thermal += Math.abs(p.m * p.mu * g / n * ((vs + nv) / 2) * dt);
    x = nx;
    vs = nv;
    if (p.mu === 0) {
      // keep energy exact for the frictionless case
      const ke = E0() - p.m * g * f(x);
      vs = Math.sign(vs || aG || 1) * Math.sqrt(Math.max(0, (2 * ke) / p.m));
      if (ke <= 1e-9) vs = 0;
    }
    if (x <= xmin || x >= xmax) vs = 0;
  }
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    for (let i = 0; i < 20; i++) step(dt / 20);
    // in the frictionless case, nudge away from exact turning points
    if (p.mu === 0 && Math.abs(vs) < 1e-6) vs = -Math.sign(df(x)) * 1e-3;
    t += dt;
    maxSpeed = Math.max(maxSpeed, Math.abs(vs));
    lowest = Math.min(lowest, f(x));
    draw();
    const T = spec.T ?? 8;
    if (t >= T) {
      pause();
      ran = true;
      api.onChange();
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function play() {
    reset();
    playing = true;
    touched = true;
    playBtn.innerHTML = icons.pause + '<span>Stop</span>';
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    if (playing) ran = true;
    playing = false;
    cancelAnimationFrame(raf);
    playBtn.innerHTML = icons.play + '<span>Release</span>';
  }

  function draw() {
    const yy = f(x);
    const s1 = df(x), n = Math.sqrt(1 + s1 * s1);
    // ball sits on top of the track: offset along the normal
    const nxp = -s1 / n, nyp = 1 / n;
    const off = 11 / ((plot.X(1) - plot.X(0)));
    ball.setAttribute('transform', `translate(${plot.X(x + nxp * off)},${plot.Y(yy + nyp * off)})`);
    const h0 = f(p.x0);
    startLine.setAttribute('x1', plot.left);
    startLine.setAttribute('x2', plot.right);
    startLine.setAttribute('y1', plot.Y(h0));
    startLine.setAttribute('y2', plot.Y(h0));
    const ke = 0.5 * p.m * vs * vs, pe = p.m * g * yy;
    const tot = E0();
    const vals = { ke, pe, th: thermal, total: ke + pe + thermal };
    const scaleE = spec.emax ?? Math.max(1, p.m * g * ymax);
    for (const k of bars) {
      const hh = clamp((vals[k] / scaleE) * bh, 0, bh);
      barEls[k].setAttribute('y', by0 - hh);
      barEls[k].setAttribute('height', hh);
    }
    readout.innerHTML = mdi(spec.readout ? spec.readout({ ...p, x, h: yy, v: Math.abs(vs), ke, pe, th: thermal, E: tot, maxSpeed, t }) : `$h = ${fix(yy, 2)}$ m $\\quad v = ${fix(Math.abs(vs), 2)}$ m/s $\\quad KE = ${fix(ke, 0)}$ J $\\quad PE = ${fix(pe, 0)}$ J`);
  }

  reset();
  return {
    ready: () => (spec.needRun ? ran : touched || spec.ready === true),
    check() {
      const r = spec.goal ? spec.goal(p, { maxSpeed, lowest, ran }) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, v] of Object.entries(spec.solution)) {
          p[k] = v;
          if (sliders[k]) sliders[k].value = v;
        }
        play();
      }
    },
    destroy: pause,
  };
}
