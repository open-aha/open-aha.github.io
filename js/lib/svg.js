// SVG helpers: element factory, coordinate plots, pointer dragging.

const NS = 'http://www.w3.org/2000/svg';

export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) if (c) el.append(c);
  return el;
}

export function set(el, attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') el.textContent = v;
    else if (v == null) el.removeAttribute(k);
    else el.setAttribute(k, v);
  }
  return el;
}

export function svgRoot(w, h, cls = 'fig') {
  const svg = s('svg', { viewBox: `0 0 ${w} ${h}`, class: cls, role: 'img' });
  textScaler()?.observe(svg);
  return svg;
}

// Figures are drawn for a 600-unit-wide canvas and scaled to fit. On a phone that shrinks 13px
// labels to about 7px, so each figure gets a --fs factor (used by every figure font size) that
// enlarges its text by up to 1.4x, keeping tick numbers at roughly 9.5px or more on screen.
export const TEXT_MIN_PX = 9.5, TEXT_MAX_BOOST = 1.4;
export const textBoost = (scale) => clamp(TEXT_MIN_PX / (13 * scale), 1, TEXT_MAX_BOOST);
// and no figure text renders below 9px: --fmin is that size in the drawing's own units
export const textFloor = (scale) => `${(9 / Math.max(scale, 0.1)).toFixed(2)}px`;
let scaler;
function textScaler() {
  if (scaler === undefined) {
    scaler = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
      for (const { target, contentRect } of entries) {
        const vb = target.viewBox?.baseVal?.width;
        if (!vb || !contentRect.width) continue;
        target.style.setProperty('--fs', textBoost(contentRect.width / vb).toFixed(3));
        target.style.setProperty('--fmin', textFloor(contentRect.width / vb));
        keepInside(target);
      }
    });
  }
  return scaler;
}
// Nudge any label that spills past the drawing's edge back inside (enlarged text near an edge,
// or a label that follows a moving point). Only plain, unrotated labels with a single x/y are moved.
export function keepInside(svg) {
  const R = svg.getBoundingClientRect();
  if (!R.width) return;
  const single = (v) => v != null && v.trim() !== '' && !/[ ,]/.test(v.trim());
  for (const t of svg.querySelectorAll('text')) {
    if (t.closest('defs,clipPath,marker,pattern,mask')) continue;
    const x = t.getAttribute('x'), y = t.getAttribute('y');
    const b = t.getBoundingClientRect();
    if (!b.width) continue;
    const m = t.getScreenCTM();
    if (!m || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) continue;
    const pad = 3;
    let dx = 0, dy = 0;
    if (b.width < R.width - 2 * pad) {
      if (b.left < R.left + pad) dx = R.left + pad - b.left;
      else if (b.right > R.right - pad) dx = R.right - pad - b.right;
    }
    if (b.top < R.top + 1) dy = R.top + 1 - b.top;
    else if (b.bottom > R.bottom - 1) dy = R.bottom - 1 - b.bottom;
    if (dx && single(x)) t.setAttribute('x', +(+x + dx / m.a).toFixed(2));
    if (dy && single(y)) t.setAttribute('y', +(+y + dy / m.d).toFixed(2));
  }
}

// the boost a figure of this many units will get at the current window size (for layout decisions)
export function expectedBoost(units = 600) {
  if (typeof window === 'undefined') return 1;
  const col = Math.min(680, document.documentElement.clientWidth - 32);
  return textBoost(Math.min(1, col / units));
}

// Convert a pointer event into SVG user coordinates.
export function toSvgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = pt.matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

// Make `handle` draggable inside `svg`. onMove receives svg-space {x,y}.
export function draggable(handle, svg, { onStart, onMove, onEnd } = {}) {
  handle.style.cursor = 'grab';
  handle.style.touchAction = 'none';
  let active = false;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    active = true;
    handle.setPointerCapture(e.pointerId);
    handle.style.cursor = 'grabbing';
    onStart && onStart(toSvgPoint(svg, e));
    onMove && onMove(toSvgPoint(svg, e));
  });
  handle.addEventListener('pointermove', (e) => {
    if (!active) return;
    onMove && onMove(toSvgPoint(svg, e));
  });
  const end = (e) => {
    if (!active) return;
    active = false;
    handle.style.cursor = 'grab';
    onEnd && onEnd(toSvgPoint(svg, e));
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

// Keyboard support for a draggable handle: arrow keys nudge.
export function keyNudge(handle, { step = 1, onNudge }) {
  handle.setAttribute('tabindex', '0');
  handle.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const k = e.shiftKey ? 5 : 1;
    onNudge(d[0] * step * k, d[1] * step * k);
  });
}

// A Cartesian plot area mapping math coords to SVG coords.
export class Plot {
  constructor({ width = 600, height = 400, xmin = -5, xmax = 5, ymin = -5, ymax = 5, pad = 36, padL, padR, padT, padB, boost }) {
    Object.assign(this, { width, height, xmin, xmax, ymin, ymax });
    this.boost = boost ?? expectedBoost(width); // how much the text will be enlarged on this screen
    this.pl = padL ?? pad;
    this.pr = padR ?? pad;
    this.pt = padT ?? pad;
    this.pb = padB ?? pad;
    this.svg = svgRoot(width, height);
    this.layers = {};
    for (const name of ['grid', 'axes', 'under', 'main', 'over', 'labels', 'handles']) {
      this.layers[name] = s('g', { class: 'layer-' + name });
      this.svg.append(this.layers[name]);
    }
  }
  X(x) {
    return this.pl + ((x - this.xmin) / (this.xmax - this.xmin)) * (this.width - this.pl - this.pr);
  }
  Y(y) {
    return this.height - this.pb - ((y - this.ymin) / (this.ymax - this.ymin)) * (this.height - this.pt - this.pb);
  }
  invX(px) {
    return this.xmin + ((px - this.pl) / (this.width - this.pl - this.pr)) * (this.xmax - this.xmin);
  }
  invY(py) {
    return this.ymin + ((this.height - this.pb - py) / (this.height - this.pt - this.pb)) * (this.ymax - this.ymin);
  }
  get left() { return this.pl; }
  get right() { return this.width - this.pr; }
  get top() { return this.pt; }
  get bottom() { return this.height - this.pb; }

  grid(dx = 1, dy = dx) {
    const g = this.layers.grid;
    for (let x = Math.ceil(this.xmin / dx) * dx; x <= this.xmax + 1e-9; x += dx)
      g.append(s('line', { x1: this.X(x), x2: this.X(x), y1: this.top, y2: this.bottom, class: 'grid-line' }));
    for (let y = Math.ceil(this.ymin / dy) * dy; y <= this.ymax + 1e-9; y += dy)
      g.append(s('line', { x1: this.left, x2: this.right, y1: this.Y(y), y2: this.Y(y), class: 'grid-line' }));
    return this;
  }

  axes({ xlabel, ylabel, xticks, yticks, xfmt = fmtTick, yfmt = fmtTick, xAt = 0, yAt = 0, origin = true, xlabelBelow = false, ylabelAbove = false, xticksBelow = false } = {}) {
    const g = this.layers.axes;
    // tick numbers and axis names go above the data, so curves and bars never hide them
    const lg = this.layers.labels;
    const ay = clamp(yAt, this.ymin, this.ymax);
    const ax = clamp(xAt, this.xmin, this.xmax);
    g.append(s('line', { x1: this.left, x2: this.right + 6, y1: this.Y(ay), y2: this.Y(ay), class: 'axis-line', 'marker-end': 'url(#arrowhead)' }));
    g.append(s('line', { x1: this.X(ax), x2: this.X(ax), y1: this.bottom, y2: this.top - 6, class: 'axis-line' }));
    // label every m-th tick when the numbers would otherwise run into each other (tick marks stay)
    const every = (gap, need) => { let m = 1; while (need > gap * m && m < 12) m++; return m; };
    if (xticks) {
      let widest = 0;
      for (let x = Math.ceil(this.xmin / xticks) * xticks; x <= this.xmax + 1e-9; x += xticks) widest = Math.max(widest, String(xfmt(x)).length);
      const mx = every(Math.abs(this.X(xticks) - this.X(0)), widest * 7.4 * this.boost + 8);
      for (let x = Math.ceil(this.xmin / xticks) * xticks; x <= this.xmax + 1e-9; x += xticks) {
        if (!origin && Math.abs(x - ax) < 1e-9) continue;
        if (Math.abs(x - ax) < 1e-9 && Math.abs(ay - this.ymin) > 1e-9 && origin === 'skip') continue;
        g.append(s('line', { x1: this.X(x), x2: this.X(x), y1: this.Y(ay) - 4, y2: this.Y(ay) + 4, class: 'axis-line' }));
        if (Math.round(x / xticks) % mx !== 0) continue;
        lg.append(s('text', { x: this.X(x), y: xticksBelow ? this.bottom + 20 : this.Y(ay) + 20, class: 'tick', 'text-anchor': 'middle', text: xfmt(x) }));
      }
    }
    if (yticks) {
      const my = every(Math.abs(this.Y(yticks) - this.Y(0)), 13 * 1.15 * this.boost + 2);
      for (let y = Math.ceil(this.ymin / yticks) * yticks; y <= this.ymax + 1e-9; y += yticks) {
        if (Math.abs(y - ay) < 1e-9) continue;
        g.append(s('line', { x1: this.X(ax) - 4, x2: this.X(ax) + 4, y1: this.Y(y), y2: this.Y(y), class: 'axis-line' }));
        if (Math.round(y / yticks) % my !== 0) continue;
        lg.append(s('text', { x: this.X(ax) - 9, y: this.Y(y) + 5, class: 'tick', 'text-anchor': 'end', text: yfmt(y) }));
      }
    }
    if (xlabel) lg.append(s('text', { x: this.right, y: xlabelBelow === 'edge' ? this.bottom + (xticksBelow ? 40 : 24) : this.Y(ay) + (xlabelBelow ? 40 : -10), class: 'axis-label', 'text-anchor': 'end', text: xlabel }));
    if (ylabel) lg.append(s('text', { x: this.X(ax) + (ylabelAbove ? 6 : 10), y: ylabelAbove ? this.top - 12 : this.top + 4, class: 'axis-label', text: ylabel }));
    return this;
  }

  // Build a path string for y = f(x)
  fnPath(f, x0 = this.xmin, x1 = this.xmax, n = 240) {
    let d = '';
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = f(x);
      if (!isFinite(y) || y > this.ymax + (this.ymax - this.ymin) * 2 || y < this.ymin - (this.ymax - this.ymin) * 2) {
        pen = false;
        continue;
      }
      d += (pen ? 'L' : 'M') + this.X(x).toFixed(2) + ' ' + this.Y(y).toFixed(2);
      pen = true;
    }
    return d;
  }

  // Parametric path
  paramPath(fx, fy, t0, t1, n = 240) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n;
      d += (i ? 'L' : 'M') + this.X(fx(t)).toFixed(2) + ' ' + this.Y(fy(t)).toFixed(2);
    }
    return d;
  }

  clip() {
    const id = 'clip' + Math.random().toString(36).slice(2, 8);
    const defs = s('defs', {}, s('clipPath', { id }, s('rect', { x: this.left, y: this.top, width: Math.max(0, this.right - this.left), height: Math.max(0, this.bottom - this.top) })));
    this.svg.prepend(defs);
    return `url(#${id})`;
  }
}

export function fmtTick(v) {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r).replace('-', '−');
}

export function fmt(v, d = 2) {
  if (!isFinite(v)) return '';
  let r = Number(v.toFixed(d));
  if (Object.is(r, -0)) r = 0;
  return String(r).replace('-', '−');
}

// Live numbers (anything that changes while a widget plays or is dragged) use a FIXED number of
// decimals: "4.70", "4.71", "5.00", never "4.7", "4.71", "5". A changing number of decimals makes
// the text, and everything beside it, jump. Use the most decimals that number needs in that step.
export function fix(v, d = 2) {
  if (!isFinite(v)) return '';
  let s = v.toFixed(d);
  if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
  return s.replace('-', '−');
}

// A value on a log scale keeps n significant figures instead: 0.010, 0.10, 1.0, 10, 250
// (group: write 12,000 rather than 12000)
export function sig(v, n = 2, group = false) {
  if (!isFinite(v)) return '';
  if (v === 0) return '0';
  const big = Math.abs(v) >= 10 ** (n - 1), r = Math.round(Number(v.toPrecision(n)));
  const s = big ? (group ? r.toLocaleString('en-US') : String(r)) : v.toPrecision(n);
  return s.replace('-', '−');
}

// decimals a slider step shows: 0.5 -> 1, 0.25 -> 2, 1 -> 0
export function decimals(step) {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const snap = (v, step) => Math.round(v / step) * step;

// Snap a dragged value to its step grid, but favour the current value: the pointer has to travel
// three quarters of the way to the next step before it switches, so a shaky hand resting near
// the halfway point does not make the value (and the drawing) flicker back and forth.
export function sticky(cur, raw, min, max, step, give = 0.25) {
  if (!step) return clamp(raw, min, max);
  const v = clamp(+(min + Math.round((raw - min) / step) * step).toFixed(9), min, max);
  if (cur != null && Math.abs(v - cur) > 1e-9 && Math.abs(raw - cur) < step * (0.5 + give)) return cur;
  return v;
}

// shared arrowhead marker defs (inserted once into the document)
export function ensureDefs() {
  if (document.getElementById('lumen-defs')) return;
  const defs = s('svg', { id: 'lumen-defs', width: 0, height: 0, style: 'position:absolute', 'aria-hidden': 'true' },
    s('defs', {},
      marker('arrowhead', 'var(--axis)'),
      marker('arrow-blue', 'var(--blue)'),
      marker('arrow-coral', 'var(--coral)'),
      marker('arrow-teal', 'var(--teal)'),
      marker('arrow-amber', 'var(--amber)'),
      marker('arrow-violet', 'var(--violet)'),
      marker('arrow-pink', 'var(--pink)'),
      marker('arrow-ink', 'var(--ink)'),
      marker('arrow-green', 'var(--success)'),
    ));
  document.body.prepend(defs);
}

function marker(id, color) {
  return s('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' },
    s('path', { d: 'M0 0 L10 5 L0 10 z', style: `fill:${color}` }));
}

// arrow line from (x1,y1) to (x2,y2) in svg coords, with arrowhead drawn as polygon (robust colours)
export function arrow(x1, y1, x2, y2, { color = 'var(--ink)', width = 3, head = 11, cls = '' } = {}) {
  const g = s('g', { class: cls });
  const line = s('line', { 'stroke-linecap': 'round' });
  const tip = s('path', {});
  g.append(line, tip);
  g.update = (a, b, c, d2, col = color) => {
    const dx = c - a, dy = d2 - b;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) {
      line.setAttribute('visibility', 'hidden');
      tip.setAttribute('visibility', 'hidden');
      return;
    }
    line.removeAttribute('visibility');
    tip.removeAttribute('visibility');
    const ux = dx / len, uy = dy / len;
    const hl = Math.min(head, len * 0.6);
    const bx = c - ux * hl, by = d2 - uy * hl;
    set(line, { x1: a, y1: b, x2: bx + ux * 1, y2: by + uy * 1, style: `stroke:${col};stroke-width:${width}` });
    const hw = hl * 0.55;
    set(tip, { d: `M${c} ${d2} L${bx - uy * hw} ${by + ux * hw} L${bx + uy * hw} ${by - ux * hw} Z`, style: `fill:${col}` });
  };
  g.update(x1, y1, x2, y2);
  return g;
}
