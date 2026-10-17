// General-purpose interactive graph.
// spec: { xmin,xmax,ymin,ymax, width,height, grid, axes:{...}, params:{name:{min,max,step,value,label,color,slider}},
//   curves:[{f:(x,p)=>y, color, dash, width, from:(p)=>x, to:(p)=>x, param:{x:(t,p),y:(t,p),t0,t1}}],
//   points:[{x:(p)=>, y:(p)=>, color, label:(p)=>str|str, drag:{x:'param', y:'param'}, r}],
//   under:(ctx)=>[svg elements below the curves], extra:(ctx)=>[svg elements above the curves], readout:(p)=>md string, goal:(p)=>bool|{ok,msg}, solution:{...}, hint }

import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { Plot, s, set, draggable, keyNudge, clamp, snap, sticky, arrow, fmt, fmtTick, expectedBoost, keepInside } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function graph(box, spec, api) {
  const p = {};
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  let touched = false;

  // widen the left margin when y-axis tick labels sit at the left edge and would be cut off
  if (spec.axes !== false) {
    const ax = spec.axes || {}, xmin = spec.xmin ?? -5, ymin = spec.ymin ?? -5, ymax = spec.ymax ?? 5;
    const yAxisX = Math.min(spec.xmax ?? 5, Math.max(xmin, ax.xAt ?? 0));
    const yt = ax.yticks ?? (spec.gridY || spec.grid || 1);
    if (yAxisX === xmin && yt > 0 && (ymax - ymin) / yt < 200) {
      const yf = ax.yfmt || fmtTick;
      let widest = 0;
      for (let y = Math.ceil(ymin / yt) * yt; y <= ymax + 1e-9; y += yt) widest = Math.max(widest, String(yf(+y.toFixed(10))).length);
      const need = Math.round(widest * 7.6 * expectedBoost(spec.width || 600) + 18);
      if (need > (spec.padL ?? spec.pad ?? 36)) spec = { ...spec, padL: need };
    }
  }
  // axis names go outside the data area when the axes sit on the plot's edges, so curves never run through them
  if (spec.axes !== false && spec.axes) {
    const ax = spec.axes, xmin = spec.xmin ?? -5, ymin = spec.ymin ?? -5, pad = spec.pad ?? 36;
    const onBottom = Math.max(ymin, Math.min(spec.ymax ?? 5, ax.yAt ?? 0)) === ymin;
    const onLeft = Math.max(xmin, Math.min(spec.xmax ?? 5, ax.xAt ?? 0)) === xmin;
    const below = ax.xlabel && onBottom && ax.xlabelBelow !== false;
    const above = ax.ylabel && onLeft && ax.ylabelAbove !== false;
    // xlabelBelow: 'edge' puts the name under the plot's bottom edge (for an x axis running through the middle)
    const edge = ax.xlabel && ax.xlabelBelow === 'edge';
    spec = { ...spec, axes: { ...ax, xlabelBelow: edge ? 'edge' : !!below, ylabelAbove: !!above } };
    if (below && !edge && (spec.padB ?? pad) < 50) spec.padB = 50;
    if (edge && (spec.padB ?? pad) < 34) spec.padB = 34;
    // xticksBelow: tick numbers under the plot, clear of signals that keep crossing a middle axis
    if (ax.xticksBelow && (spec.padB ?? pad) < (edge ? 50 : 30)) spec.padB = edge ? 50 : 30;
    if (above && (spec.padT ?? pad) < 32) spec.padT = 32;
  }
  // equal: same scale on both axes (so slopes and circles look true)
  let height = spec.height || 420;
  if (spec.equal) {
    const pad = spec.pad ?? 36;
    const w = (spec.width || 600) - (spec.padL ?? pad) - (spec.padR ?? pad);
    height = Math.round((w * ((spec.ymax ?? 5) - (spec.ymin ?? -5))) / ((spec.xmax ?? 5) - (spec.xmin ?? -5))) + (spec.padT ?? pad) + (spec.padB ?? pad);
  } else if (spec.axes !== false && typeof document !== 'undefined') {
    // on a phone a wide chart turns into a thin strip: give data plots up to 35% more height
    const scale = Math.min(680, document.documentElement.clientWidth - 32) / (spec.width || 600);
    height = Math.round(height * clamp(0.8 / scale, 1, 1.35));
  }
  const plot = new Plot({
    width: spec.width || 600,
    height,
    xmin: spec.xmin ?? -5, xmax: spec.xmax ?? 5, ymin: spec.ymin ?? -5, ymax: spec.ymax ?? 5,
    pad: spec.pad ?? 36, padL: spec.padL, padR: spec.padR, padT: spec.padT, padB: spec.padB,
  });
  if (spec.grid !== false) plot.grid(spec.grid || 1, spec.gridY || spec.grid || 1);
  if (spec.axes !== false) plot.axes({ xticks: spec.grid || 1, yticks: spec.gridY || spec.grid || 1, ...(spec.axes || {}) });
  const clipUrl = plot.clip();
  plot.layers.main.setAttribute('clip-path', clipUrl);
  plot.layers.under.setAttribute('clip-path', clipUrl);
  // clipExtra: keep the extra layer inside the plot too (for paths that can run off the chart)
  if (spec.clipExtra) plot.layers.over.setAttribute('clip-path', clipUrl);
  if (spec.title) plot.svg.setAttribute('aria-label', spec.title);

  const curveEls = (spec.curves || []).map((c) => {
    const el = s('path', { class: `curve st-${c.color || 'blue'}`, 'stroke-dasharray': c.dash ? '8 8' : null, style: c.width ? `stroke-width:${c.width}` : null });
    plot.layers.main.append(el);
    return el;
  });

  const pointEls = (spec.points || []).map((pt) => {
    const color = pt.color || 'blue';
    const g = s('g', { class: pt.drag ? 'handle' : '' });
    const halo = pt.drag ? s('circle', { r: 22, class: `halo fl-${color}` }) : null;
    const dot = s('circle', { r: pt.r || (pt.drag ? 10 : 7), class: `fl-${color}`, stroke: 'var(--card)', 'stroke-width': 3 });
    const lbl = s('text', { class: 'lbl', 'text-anchor': 'start' });
    // an invisible, finger-sized grab area around a draggable point
    if (pt.drag) g.append(s('circle', { r: 32, fill: 'transparent', class: 'hit' }));
    if (halo) g.append(halo);
    // shown when the value is off the chart: the point waits at the edge, pointing to where it really is
    const off = s('path', { d: 'M0 -7L6 3H-6Z', class: `fl-${color}`, style: 'display:none' });
    g.append(dot, off, lbl);
    plot.layers.handles.append(g);
    if (pt.drag) {
      g.setAttribute('role', 'slider');
      g.setAttribute('aria-label', pt.ariaLabel || 'Draggable point');
      draggable(g, plot.svg, {
        onMove: ({ x, y }) => {
          if (pt.drag.fn) {
            // custom mapping from pointer (math coords) to params
            const upd = pt.drag.fn(plot.invX(x), plot.invY(y), p) || {};
            for (const [k, v] of Object.entries(upd)) setParam(k, v, true);
          } else {
            if (pt.drag.x) setParam(pt.drag.x, plot.invX(x), true);
            if (pt.drag.y) setParam(pt.drag.y, plot.invY(y), true);
          }
          touch();
        },
      });
      keyNudge(g, {
        onNudge: (dx, dy) => {
          if (pt.drag.fn) {
            const k = pt.drag.key || Object.keys(defs)[0];
            setParam(k, p[k] + (dx || dy) * (defs[k].step || 1));
            touch();
            return;
          }
          if (pt.drag.x) setParam(pt.drag.x, p[pt.drag.x] + dx * (defs[pt.drag.x].step || 0.1));
          if (pt.drag.y) setParam(pt.drag.y, p[pt.drag.y] + dy * (defs[pt.drag.y].step || 0.1));
          touch();
        },
      });
    }
    return { g, dot, lbl, halo, off };
  });

  const extraLayer = plot.layers.over;
  const sliders = {};
  const controls = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    if (d.slider === false) continue;
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 0.1, value: d.value, color: d.color, format: d.format,
      onInput: (v) => { p[k] = v; touch(); },
    });
    controls.append(sliders[k].el);
  }
  const readout = spec.readout ? h('div.w-readout') : null;

  if (spec.maxWidth) {
    plot.svg.style.maxWidth = spec.maxWidth + 'px';
    plot.svg.style.margin = '0 auto';
  }
  box.append(plot.svg);
  if (readout) {
    box.append(readout);
    reserveReadout();
  }

  // Reserve the readout's tallest height over the slider range up front, so text that wraps onto
  // an extra line for some values never pushes the sliders down while the learner is dragging.
  function reserveReadout() {
    readout.dataset.reserved = '1';
    let width = 0;
    const measure = () => {
      const w = readout.clientWidth;
      if (!w || w === width) return;
      width = w;
      const keys = Object.keys(defs).filter((k) => defs[k].slider !== false);
      const at = (d, f) => clamp(d.min + Math.round((f * (d.max - d.min)) / (d.step || 1e-9)) * (d.step || 0), d.min, d.max);
      const cases = [{}, Object.fromEntries(keys.map((k) => [k, defs[k].min])), Object.fromEntries(keys.map((k) => [k, defs[k].max]))];
      for (const k of keys) for (let j = 0; j <= 10; j++) cases.push({ [k]: at(defs[k], j / 10) });
      let seed = 7;
      for (let j = 0; j < 8; j++) cases.push(Object.fromEntries(keys.map((k) => [k, at(defs[k], (seed = (seed * 16807) % 2147483647) / 2147483647)])));
      readout.style.minHeight = '';
      let tallest = 0;
      for (const c of cases) {
        try { readout.innerHTML = mdi(spec.readout({ ...p, ...c })); } catch (e) { continue; }
        tallest = Math.max(tallest, readout.offsetHeight);
      }
      try { readout.innerHTML = mdi(spec.readout(p)); } catch (e) {}
      readout.style.minHeight = tallest + 'px';
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(readout);
    readout._measure = () => { width = 0; measure(); }; // for the dev checkers (ResizeObserver does not run in a hidden tab)
  }
  if (controls.children.length) box.append(controls);

  // optional animation: advances a time parameter (spec.animate = { param, speed, max, loop, autoplay })
  let raf = 0, playing = false, last = 0;
  const anim = spec.animate;
  let playBtn = null;
  if (anim) {
    if (p[anim.param] == null) p[anim.param] = 0;
    playBtn = button('Play', () => (playing ? stop() : start()), { icon: icons.play, primary: true });
    const resetBtn = button('Reset', () => { stop(); p[anim.param] = 0; update(); }, { icon: icons.reset });
    box.append(h('div.w-controls.center', playBtn, resetBtn));
  }
  function start() {
    playing = true;
    touched = true;
    api.onChange();
    playBtn.innerHTML = icons.pause + '<span>Pause</span>';
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    playing = false;
    cancelAnimationFrame(raf);
    if (playBtn) playBtn.innerHTML = icons.play + '<span>Play</span>';
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    p[anim.param] += dt * (anim.speed || 1);
    if (anim.max != null && p[anim.param] >= anim.max) {
      if (anim.loop === false) {
        p[anim.param] = anim.max;
        update();
        stop();
        return;
      }
      p[anim.param] -= anim.max;
    }
    update();
    raf = requestAnimationFrame(tick);
  }

  function setParam(k, v, dragging = false) {
    const d = defs[k];
    v = clamp(v, d.min, d.max);
    // snap from the slider's minimum, like a native range input; a drag favours the current value
    if (dragging) v = sticky(p[k], v, d.min, d.max, d.step);
    else if (d.step) v = clamp(d.min + Math.round((v - d.min) / d.step) * d.step, d.min, d.max);
    p[k] = +v.toFixed(6);
    if (sliders[k]) sliders[k].value = p[k];
  }

  function touch() {
    touched = true;
    update();
    api.onChange();
  }

  function update() {
    (spec.curves || []).forEach((c, i) => {
      let d;
      if (c.param) d = plot.paramPath((t) => c.param.x(t, p), (t) => c.param.y(t, p), c.param.t0, typeof c.param.t1 === 'function' ? c.param.t1(p) : c.param.t1);
      else d = plot.fnPath((x) => c.f(x, p), c.from == null ? plot.xmin : typeof c.from === 'function' ? c.from(p) : c.from, c.to == null ? plot.xmax : typeof c.to === 'function' ? c.to(p) : c.to, c.n || 240);
      curveEls[i].setAttribute('d', d);
      if (c.visible) curveEls[i].style.display = c.visible(p) ? '' : 'none';
    });
    (spec.points || []).forEach((pt, i) => {
      const { g, lbl, dot, off } = pointEls[i];
      const x = pt.x(p), y = pt.y(p);
      // a value beyond the chart is pinned to the edge, drawn hollow, with an arrow pointing outwards
      const cx = clamp(x, plot.xmin, plot.xmax), cy = clamp(y, plot.ymin, plot.ymax);
      const outside = isFinite(x) && isFinite(y) && (Math.abs(cx - x) > 1e-9 || Math.abs(cy - y) > 1e-9);
      // pinned points sit just inside the edge, so they and their arrow stay clear of the axis numbers
      const inset = outside ? 16 : 0;
      const gx = clamp(plot.X(isFinite(cx) ? cx : 0), plot.left + inset, plot.right - inset);
      const gy = clamp(plot.Y(isFinite(cy) ? cy : 0), plot.top + inset, plot.bottom - inset);
      g.setAttribute('transform', `translate(${gx},${gy})`);
      g.style.visibility = isFinite(x) && isFinite(y) ? '' : 'hidden';
      dot.style.fillOpacity = outside ? '0.25' : '';
      off.style.display = outside ? '' : 'none';
      if (outside) {
        const ang = (Math.atan2(-(plot.Y(y) - gy), plot.X(x) - gx) * 180) / Math.PI;
        off.setAttribute('transform', `rotate(${90 - ang}) translate(0 -14)`);
      }
      const text = typeof pt.label === 'function' ? pt.label(p) : pt.label;
      set(lbl, { text: text || '', x: pt.labelDx ?? 14, y: pt.labelDy ?? -12 });
      if (pt.visible) g.style.display = pt.visible(p) ? '' : 'none';
    });
    if (spec.under) {
      // shading and backgrounds: drawn beneath the curves
      plot.layers.under.replaceChildren(...[spec.under({ plot, p, s, arrow, fmt })].flat(Infinity).filter(Boolean));
    }
    if (spec.extra) {
      extraLayer.replaceChildren(...[spec.extra({ plot, p, s, arrow, fmt })].flat(Infinity).filter(Boolean));
    }
    if (readout) readout.innerHTML = mdi(spec.readout(p));
    if (plot.svg.isConnected) keepInside(plot.svg);
  }
  update();
  if (anim?.autoplay && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => box.isConnected && start(), 400);

  return {
    destroy: stop,
    ready: () => touched || spec.ready === true,
    check() {
      const r = spec.goal ? spec.goal(p) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        for (const [k, v] of Object.entries(spec.solution)) setParam(k, v);
        update();
      }
    },
    get params() {
      return p;
    },
  };
}
