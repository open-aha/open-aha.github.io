// 1D motion on a track with strobe marks and live x–t / v–t graphs.
// spec: { xmin, xmax, T, x:(t,p)=>pos, v:(t,p)=>vel, params:{...sliders}, graphs:['x','v'],
//         xg:{ymin,ymax,step}, vg:{ymin,ymax,step}, strobe:1, object:'car'|'ball', flags:[{x,label,color}],
//         showVector, goal:(p, run)=>bool|{ok,msg}, solution:{}, hint, autoplay, unit:'m', tickStep }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, Plot, arrow, fmt, fix, decimals, clamp, snap, expectedBoost } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function track(box, spec, api) {
  const p = {};
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const T = spec.T ?? 5;
  const xmin = spec.xmin ?? 0, xmax = spec.xmax ?? 20;
  const posAt = (t) => spec.x(t, p);
  const velAt = (t) => (spec.v ? spec.v(t, p) : (posAt(t + 1e-3) - posAt(t - 1e-3)) / 2e-3);
  let t = 0, playing = false, raf = 0, last = 0, ran = false, touched = false;
  let runParams = null;

  // ----- track drawing -----
  const W = 600, H = spec.trackH || 130;
  const tsvg = svgRoot(W, H);
  tsvg.setAttribute('aria-label', 'Motion track');
  const L = 40, R = W - 30;
  const X = (x) => L + ((x - xmin) / (xmax - xmin)) * (R - L);
  const roadY = H - 44;
  tsvg.append(s('rect', { x: L - 16, y: roadY, width: R - L + 32, height: 6, rx: 3, class: 'fl-ink', opacity: 0.8 }));
  const tickStep = spec.tickStep || niceStep(xmax - xmin);
  // label every m-th tick when the numbers would crowd (phones enlarge the text); the unit goes on the last label
  const x0 = Math.ceil(xmin / tickStep) * tickStep, nTicks = Math.floor((xmax - x0) / tickStep + 1e-9);
  const widest = Math.max(...Array.from({ length: nTicks + 1 }, (_, k) => fmt(x0 + k * tickStep, 1).length)) + 1;
  let every = 1;
  while (every < 6 && (X(tickStep) - X(0)) * every < widest * 7.4 * expectedBoost(W) + 8) every++;
  const lastLabel = Math.floor(nTicks / every) * every;
  for (let k = 0; k <= nTicks; k++) {
    const x = x0 + k * tickStep;
    tsvg.append(s('line', { x1: X(x), x2: X(x), y1: roadY + 8, y2: roadY + 16, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    if (k % every) continue;
    tsvg.append(s('text', { x: X(x), y: roadY + 32, 'text-anchor': 'middle', class: 'tick', text: k === lastLabel ? `${fmt(x, 1)} ${spec.unit || 'm'}` : fmt(x, 1) }));
  }
  for (const f of spec.flags || []) {
    const fx = X(f.x);
    tsvg.append(
      s('line', { x1: fx, x2: fx, y1: roadY - 58, y2: roadY, stroke: 'var(--ink)', 'stroke-width': 2 }),
      s('path', { d: `M${fx} ${roadY - 58} l22 7 l-22 7 z`, class: `fl-${f.color || 'coral'}` }),
      f.label ? s('text', { x: fx + 4, y: roadY - 64, class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: f.label }) : null,
    );
  }
  const strobeG = s('g');
  tsvg.append(strobeG);
  const obj = s('g');
  if ((spec.object || 'car') === 'car') {
    obj.append(
      s('rect', { x: -22, y: -26, width: 44, height: 18, rx: 6, class: 'fl-coral' }),
      s('rect', { x: -12, y: -36, width: 24, height: 12, rx: 4, class: 'fl-coral' }),
      s('circle', { cx: -12, cy: -6, r: 6, class: 'fl-ink' }),
      s('circle', { cx: 12, cy: -6, r: 6, class: 'fl-ink' }),
    );
  } else {
    obj.append(s('circle', { cx: 0, cy: -14, r: 14, class: 'fl-coral' }));
  }
  const vecArrow = arrow(0, 0, 0, 0, { color: 'var(--blue)', width: 4, head: 12 });
  tsvg.append(obj, vecArrow);
  const timeTxt = s('text', { x: L - 16, y: 22, class: 'sim-time' });
  tsvg.append(timeTxt);

  // ----- graphs -----
  const graphs = [];
  const gwrap = h('div', { style: { display: 'grid', gridTemplateColumns: (spec.graphs || []).length > 1 ? '1fr 1fr' : '1fr', gap: '0', borderTop: '2px solid var(--line)' } });
  for (const g of spec.graphs || []) {
    const cfg = g === 'x' ? { ymin: xmin, ymax: xmax, ...(spec.xg || {}) } : { ymin: -5, ymax: 5, ...(spec.vg || {}) };
    const single = (spec.graphs || []).length === 1;
    const plot = new Plot({ width: single ? 600 : 300, height: single ? 220 : 220, xmin: 0, xmax: T, ymin: cfg.ymin, ymax: cfg.ymax, padL: 44, padB: 34, padT: 24, padR: 18 });
    const ys = cfg.step || niceStep(cfg.ymax - cfg.ymin);
    plot.grid(1, ys);
    plot.axes({ xticks: T > 12 ? 2 : 1, yticks: ys, xlabel: 't (s)', ylabel: g === 'x' ? `x (${spec.unit || 'm'})` : `v (${spec.unit || 'm'}/s)`, yAt: 0 });
    const clip = plot.clip();
    const ghost = s('path', { class: 'curve st-muted', 'stroke-dasharray': '6 6', style: 'stroke-width:2', 'clip-path': clip });
    const trace = s('path', { class: `curve st-${g === 'x' ? 'coral' : 'blue'}`, 'clip-path': clip });
    const dot = s('circle', { r: 6, class: g === 'x' ? 'fl-coral' : 'fl-blue', stroke: 'var(--card)', 'stroke-width': 2.5 });
    const target = s('path', { class: 'curve st-teal', 'stroke-dasharray': '2 8', style: 'stroke-width:4', 'clip-path': clip });
    plot.layers.under.append(target, ghost);
    plot.layers.main.append(trace);
    plot.layers.handles.append(dot);
    graphs.push({ g, plot, trace, dot, ghost, target });
    gwrap.append(plot.svg);
  }

  // ----- controls -----
  const playBtn = button('Play', () => (playing ? pause() : play()), { icon: icons.play, primary: true });
  const resetBtn = button('Reset', () => { pause(); setT(0); }, { icon: icons.reset });
  const scrub = h('input', { type: 'range', min: 0, max: T, step: 0.01, value: 0, 'aria-label': 'Time' });
  scrub.addEventListener('input', () => { pause(); setT(parseFloat(scrub.value)); ran = true; touched = true; api.onChange(); });
  const scrubWrap = h('div.slider', h('label', { html: mdi('$t$') }), scrub, h('output', ''));
  scrub.style.setProperty('--sc', 'var(--ink)');
  const controls = h('div.w-controls', playBtn, resetBtn, scrubWrap);
  const sliders = {};
  const sliderRow = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    if (d.slider === false) continue;
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 0.1, value: d.value, color: d.color || 'blue', format: d.format,
      onInput: (v) => { p[k] = v; touched = true; pause(); setT(0); ran = false; drawGhosts(); api.onChange(); },
    });
    sliderRow.append(sliders[k].el);
  }
  const readout = h('div.w-readout');

  box.append(tsvg);
  if (graphs.length) box.append(gwrap);
  box.append(readout);
  if (sliderRow.children.length) box.append(sliderRow);
  box.append(controls);

  function drawGhosts() {
    for (const gr of graphs) {
      const f = gr.g === 'x' ? posAt : velAt;
      gr.ghost.setAttribute('d', spec.preview ? gr.plot.fnPath(f, 0, T, 200) : '');
      if (spec.target && spec.target[gr.g]) gr.target.setAttribute('d', gr.plot.fnPath(spec.target[gr.g], 0, T, 200));
    }
  }

  function setT(nt) {
    t = clamp(nt, 0, T);
    scrub.value = t;
    scrub.style.setProperty('--pct', (t / T) * 100 + '%');
    scrubWrap.querySelector('output').textContent = fix(t, 1) + ' s';
    const x = posAt(t), v = velAt(t);
    const px = X(clamp(x, xmin - (xmax - xmin) * 0.05, xmax + (xmax - xmin) * 0.05));
    obj.setAttribute('transform', `translate(${px},${roadY})`);
    if (spec.showVector) {
      const len = clamp(v * (spec.vecScale || 12), -160, 160);
      vecArrow.update(px, roadY - 60, px + len, roadY - 60);
    } else vecArrow.update(0, 0, 0, 0);
    timeTxt.textContent = `t = ${fix(t, 2)} s`;
    // strobe marks every spec.strobe seconds up to t
    strobeG.replaceChildren();
    if (spec.strobe) {
      for (let k = 0; k * spec.strobe <= t + 1e-9; k++) {
        const tx = X(posAt(k * spec.strobe));
        strobeG.append(s('circle', { cx: tx, cy: roadY - 14, r: 5, class: 'fl-coral', opacity: 0.35 }));
        strobeG.append(s('text', { x: tx, y: roadY - 42, 'text-anchor': 'middle', class: 'tick', style: 'font-size:max(calc(10px * var(--fs, 1)), var(--fmin, 0px))', text: `${fix(k * spec.strobe, decimals(spec.strobe))}s` }));
      }
    }
    for (const gr of graphs) {
      const f = gr.g === 'x' ? posAt : velAt;
      gr.trace.setAttribute('d', t > 0 ? gr.plot.fnPath(f, 0, t, Math.max(2, Math.round(200 * (t / T)))) : '');
      gr.dot.setAttribute('cx', gr.plot.X(t));
      gr.dot.setAttribute('cy', gr.plot.Y(clamp(f(t), gr.plot.ymin, gr.plot.ymax)));
    }
    readout.innerHTML = mdi(spec.readout ? spec.readout(t, p, x, v) : `$x = ${fix(x, 1)}\\text{ ${spec.unit || 'm'}}$ &nbsp;&nbsp; $v = ${fix(v, 1)}\\text{ ${spec.unit || 'm'}/s}$`);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    setT(t + dt * (spec.speed || 1));
    if (t >= T) {
      pause();
      ran = true;
      runParams = { ...p };
      api.onChange();
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (t >= T) setT(0);
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

  drawGhosts();
  setT(spec.startAtEnd ? T : 0);
  if (spec.autoplay && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(play, 500);

  return {
    ready: () => (spec.needRun ? ran : touched),
    check() {
      const r = spec.goal ? spec.goal(spec.needRun ? runParams || p : p) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, v] of Object.entries(spec.solution)) {
          p[k] = v;
          if (sliders[k]) sliders[k].value = v;
        }
        runParams = { ...p };
        drawGhosts();
        setT(0);
        play();
      }
    },
    destroy() {
      pause();
    },
  };
}

function niceStep(range) {
  const raw = range / 8;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}
