// Block-and-forces simulator. Flat surface or incline, static/kinetic friction, applied force.
// spec: { mode:'flat'|'incline', m, g, F, muS, muK, angle, pushTime, T, params:{F,m,muS,muK,angle}, show:[...],
//         scale (px per N), vgraph:{ymin,ymax}, goal:(p,state)=>..., needRun, solution, readout }
// Sign convention: positive = to the right (flat) or down the slope (incline).
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, Plot, arrow, fix, decimals, clamp } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

const LABELS = { applied: 'F', friction: 'f', weight: 'W', normal: 'N', net: 'F_net', gpar: 'W∥' };

export function forces(box, spec, api) {
  const p = {
    m: spec.m ?? 2, F: spec.F ?? 0, muS: spec.muS ?? 0, muK: spec.muK ?? spec.muS ?? 0,
    angle: spec.angle ?? 0, g: spec.g ?? 9.8,
  };
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  // a value set by a slider shows the decimals of its step; fixed values show at most one
  const dp = (k) => (defs[k] ? decimals(defs[k].step || 1) : Number.isInteger(p[k]) ? 0 : 1);
  const incline = spec.mode === 'incline';
  const T = spec.T ?? 4;
  let x = 0, v = 0, t = 0, raf = 0, last = 0, playing = false, ran = false, touched = false;
  let state = null; // result of the last full run
  let moved = false;

  const W = 600, H = spec.height || (spec.mode === 'incline' ? 320 : 280);
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Force diagram');
  const world = s('g');
  svg.append(world);
  const groundY = incline ? H - 60 : H - 100;
  const pivot = { x: 70, y: groundY };
  const LEN = 470;
  const theta = () => (incline ? (p.angle * Math.PI) / 180 : 0);
  // keep steep ramps inside the frame
  const slopeLen = () => {
    const th = theta();
    return th > 0 ? Math.min(LEN, (groundY - 34) / Math.tan(th)) : LEN;
  };

  // ground / incline
  const ground = s('g');
  world.append(ground);
  const block = s('g');
  const bw = 84, bh = 58;
  block.append(s('rect', { x: -bw / 2, y: -bh, width: bw, height: bh, rx: 8, class: 'fl-coral' }));
  const massTxt = s('text', { x: -bw / 2 + 7, y: -bh + 19, 'text-anchor': 'start', style: 'fill:#fff;font-weight:800;font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' });
  block.append(massTxt);
  world.append(block);
  const arrowLayer = s('g');
  world.append(arrowLayer);
  const timeTxt = s('text', { x: 16, y: 24, class: 'sim-time' });
  svg.append(timeTxt);

  function drawGround() {
    ground.replaceChildren();
    const th = theta();
    const len = slopeLen();
    if (incline) {
      const x2 = pivot.x + len, y2 = groundY;
      const topY = groundY - len * Math.tan(th);
      ground.append(s('path', { d: `M${pivot.x} ${topY} L${x2} ${y2} L${pivot.x} ${y2} Z`, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
      ground.append(s('path', { d: `M${x2 - 50} ${y2} A50 50 0 0 1 ${x2 - 50 * Math.cos(th)} ${y2 - 50 * Math.sin(th)}`, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2 }));
      ground.append(s('text', { x: x2 - 72, y: y2 - 10, class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: `${fix(p.angle, dp('angle'))}°` }));
    } else {
      ground.append(s('rect', { x: 0, y: groundY, width: W, height: 6, class: 'fl-ink', opacity: 0.8 }));
      // the camera scrolls once the block reaches the edge; ticks show that motion
      const raw = W / 2 + x * (spec.pxPerM || 40);
      const cam = Math.max(0, raw - (W - 60)) + Math.min(0, raw - 60);
      const off = ((cam % 50) + 50) % 50;
      for (let k = -1; k < W / 50 + 2; k++) {
        const px = k * 50 - off;
        ground.append(s('line', { x1: px, x2: px - 12, y1: groundY + 8, y2: groundY + 20, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
      }
    }
  }

  // ----- physics -----
  function forcesNow() {
    const th = theta();
    const N = p.m * p.g * Math.cos(th);
    const gpar = incline ? p.m * p.g * Math.sin(th) : 0; // down slope
    const applied = spec.pushTime != null && t > spec.pushTime ? 0 : p.F; // + right / + down-slope
    const drive = gpar + applied;
    let fr = 0;
    if (Math.abs(v) < 1e-6) {
      if (Math.abs(drive) <= p.muS * N + 1e-9) fr = -drive;
      else fr = -Math.sign(drive) * p.muK * N;
    } else fr = -Math.sign(v) * p.muK * N;
    return { N, gpar, applied, fr, net: drive + fr, W: p.m * p.g };
  }

  function stepPhysics(dt) {
    const f = forcesNow();
    const a = f.net / p.m;
    const nv = v + a * dt;
    // kinetic friction can stop the block but not reverse it
    if (Math.abs(v) > 1e-6 && Math.sign(nv) !== Math.sign(v) && Math.abs(f.applied + f.gpar) <= p.muS * f.N) {
      v = 0;
    } else v = nv;
    x += v * dt;
    if (Math.abs(v) > 1e-3) moved = true;
  }

  // ----- drawing -----
  const scale = spec.scale ?? 3; // px per newton
  const show = spec.show || ['applied', 'friction', 'weight', 'normal'];
  const arrows = {};
  const COLORS = { applied: 'var(--blue)', friction: 'var(--amber)', weight: 'var(--violet)', normal: 'var(--teal)', net: 'var(--ink)', gpar: 'var(--pink)' };
  for (const k of [...show, 'net']) {
    const a = arrow(0, 0, 0, 0, { color: COLORS[k], width: 4.5, head: 13 });
    const lbl = s('text', { class: 'lbl halo-text', style: `fill:${k === 'friction' ? 'var(--warn)' : COLORS[k]};font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px))` }); // amber text needs the darker tone to read on light fills
    arrowLayer.append(a, lbl);
    arrows[k] = { a, lbl };
  }

  function blockPos() {
    const th = theta();
    const len = slopeLen();
    // distance along surface from the start
    const start = incline ? 150 : W / 2;
    let d = start + x * (spec.pxPerM || 40); // px along the surface
    const dMax = incline ? (len - 50) / Math.cos(th) : Infinity;
    if (incline) d = clamp(d, 40, dMax);
    const cx = incline ? pivot.x + d * Math.cos(th) : clamp(d, 60, W - 60);
    const cy = incline ? groundY - (len - d * Math.cos(th)) * Math.tan(th) : groundY;
    return { cx, cy, th, atEnd: incline && d >= dMax - 0.5 };
  }

  function draw() {
    drawGround();
    const { cx, cy, th } = blockPos();
    const deg = (th * 180) / Math.PI;
    block.setAttribute('transform', `translate(${cx},${cy}) rotate(${deg})`);
    massTxt.textContent = `${fix(p.m, dp('m'))} kg`;
    const f = forcesNow();
    // unit vectors: along slope (down-right) and normal (up-right)
    const ux = Math.cos(th), uy = Math.sin(th);
    const nx = Math.sin(th), ny = -Math.cos(th);
    const center = { x: cx + nx * (bh / 2), y: cy + ny * (bh / 2) };
    // one shared shrink factor keeps every arrow (and its label) inside the frame, preserving relative sizes
    const room = (sx, sy, dx, dy) => {
      const L = Math.hypot(dx, dy);
      if (L < 1e-9) return Infinity;
      let t = Infinity;
      if (dx > 0) t = Math.min(t, (W - 70 - sx) / dx); else if (dx < 0) t = Math.min(t, (70 - sx) / dx);
      if (dy > 0) t = Math.min(t, (H - 24 - sy) / dy); else if (dy < 0) t = Math.min(t, (26 - sy) / dy);
      return Math.max(0, t);
    };
    const planned = [];
    const plan = (k, fx, fy, ox = 0, oy = 0) => { if (arrows[k] && Math.hypot(fx, fy) > 0.05) planned.push([center.x + ox, center.y + oy, fx * scale, fy * scale]); };
    let sc = scale;
    const set = (k, fx, fy, ox = 0, oy = 0, valueN) => {
      if (!arrows[k]) return;
      const sx = center.x + ox, sy = center.y + oy;
      let ex = sx + fx * sc, ey = sy + fy * sc;
      arrows[k].a.update(sx, sy, ex, ey);
      // a label never sits on the block: short arrows from the centre are labelled just past the block's edge
      if (!ox && !oy && Math.hypot(fx, fy) > 1e-9) {
        const L = Math.hypot(fx, fy), dx = fx / L, dy = fy / L;
        const edge = 1 / Math.max(Math.abs(dx * ux + dy * uy) / (bw / 2), Math.abs(dx * nx + dy * ny) / (bh / 2)) + 4;
        if (L * sc < edge) { ex = sx + dx * edge; ey = sy + dy * edge; }
      } else if (k === 'friction' && !incline && Math.abs(fx) * sc < bw / 2 + 4) ex = sx + Math.sign(fx) * (bw / 2 + 4);
      const mag = valueN ?? Math.hypot(fx, fy);
      const visible = mag > 0.05;
      // straight-down arrows (weight) are labelled beside the tip, away from the slope's angle marking
      const vertical = Math.abs(fx) < 1e-6 && incline;
      // friction on a slope is labelled just below the surface, so a short arrow's label never lands on the block
      const under = k === 'friction' && incline;
      arrows[k].lbl.setAttribute('x', vertical ? ex - 8 : under ? ex - nx * 16 : ex + (fx >= 0 ? 6 : -6));
      arrows[k].lbl.setAttribute('y', vertical ? ey - 2 : under ? ey - ny * 16 + 5 : ey + (fy > 0 ? 16 : -6));
      arrows[k].lbl.setAttribute('text-anchor', vertical ? 'end' : fx >= 0 ? 'start' : 'end');
      arrows[k].lbl.textContent = visible ? `${LABELS[k]} = ${fix(mag, 1)} N` : '';
    };
    plan('applied', f.applied * ux, f.applied * uy);
    plan('friction', f.fr * ux, f.fr * uy, -nx * (bh / 2), -ny * (bh / 2));
    plan('weight', 0, f.W);
    plan('normal', f.N * nx, f.N * ny);
    plan('gpar', f.gpar * ux, f.gpar * uy);
    if (spec.showNet) plan('net', f.net * ux, f.net * uy, 0, -bh * 0.9);
    sc = scale * Math.min(1, ...planned.map(([sx, sy, dx, dy]) => room(sx, sy, dx, dy)));
    // applied: along surface
    set('applied', f.applied * ux, f.applied * uy, 0, 0);
    // friction: drawn at the contact surface
    set('friction', f.fr * ux, f.fr * uy, -nx * (bh / 2), -ny * (bh / 2));
    set('weight', 0, f.W, 0, 0);
    set('normal', f.N * nx, f.N * ny, 0, 0);
    set('gpar', f.gpar * ux, f.gpar * uy, 0, 0);
    if (spec.showNet) set('net', f.net * ux, f.net * uy, 0, -bh * 0.9);
    else arrows.net.a.update(0, 0, 0, 0), (arrows.net.lbl.textContent = '');
    timeTxt.textContent = `t = ${fix(t, 2)} s`;
    const a = f.net / p.m;
    readout.innerHTML = mdi(spec.readout ? spec.readout({ ...p, ...f, a, v, x, t }) : `$F_\\text{net} = ${fix(f.net, 1)}$ N $\\quad a = ${fix(Math.abs(v) < 1e-6 && Math.abs(f.net) < 1e-9 ? 0 : a, 2)}$ m/s² $\\quad v = ${fix(v, 2)}$ m/s`);
    if (vplot) {
      vtrace.push([t, v]);
      vpath.setAttribute('d', vtrace.map(([tt, vv], i) => `${i ? 'L' : 'M'}${vplot.X(tt).toFixed(1)} ${vplot.Y(clamp(vv, vplot.ymin, vplot.ymax)).toFixed(1)}`).join(''));
    }
  }

  // velocity graph
  let vplot = null, vpath = null, vtrace = [];
  const readout = h('div.w-readout');
  box.append(svg);
  if (spec.vgraph) {
    vplot = new Plot({ width: 600, height: 170, xmin: 0, xmax: T, ymin: spec.vgraph.ymin ?? 0, ymax: spec.vgraph.ymax ?? 10, padL: 44, padB: 30, padT: 16, padR: 16 });
    const ys = spec.vgraph.step || 2;
    vplot.grid(1, ys);
    vplot.axes({ xticks: 1, yticks: ys, xlabel: 't (s)', ylabel: 'v (m/s)' });
    vpath = s('path', { class: 'curve st-blue', 'clip-path': vplot.clip() });
    vplot.layers.main.append(vpath);
    vplot.svg.style.borderTop = '2px solid var(--line)';
    box.append(vplot.svg);
  }
  box.append(readout);

  const sliders = {};
  const sliderRow = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    if (d.slider === false) continue;
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color || 'blue', format: d.format,
      onInput: (val) => { p[k] = val; touched = true; reset(); api.onChange(); },
    });
    sliderRow.append(sliders[k].el);
  }
  if (sliderRow.children.length) box.append(sliderRow);
  const playBtn = button('Play', () => (playing ? pause() : play()), { icon: icons.play, primary: true });
  const resetBtn = button('Reset', () => reset(), { icon: icons.reset });
  box.append(h('div.w-controls.center', playBtn, resetBtn));

  function reset() {
    pause();
    x = 0; v = 0; t = 0; moved = false;
    vtrace = [];
    draw();
  }
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    // substeps for stability
    for (let i = 0; i < 4; i++) {
      stepPhysics(dt / 4);
      t += dt / 4;
    }
    const offEdge = blockPos().atEnd;
    if (t >= T || offEdge) {
      t = Math.min(t, T);
      draw();
      pause();
      ran = true;
      state = { moved, v, x, ...forcesNow() };
      api.onChange();
      return;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (t >= T || ran) { x = 0; v = 0; t = 0; moved = false; vtrace = []; ran = false; }
    playing = true;
    touched = true;
    playBtn.innerHTML = icons.pause + '<span>Pause</span>';
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    playBtn.innerHTML = icons.play + '<span>Play</span>';
  }

  draw();

  return {
    ready: () => (spec.needRun ? ran : touched || spec.ready === true),
    check() {
      const r = spec.goal ? spec.goal(p, state) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, val] of Object.entries(spec.solution)) {
          p[k] = val;
          if (sliders[k]) sliders[k].value = val;
        }
        reset();
        play();
      }
    },
    destroy: pause,
  };
}
