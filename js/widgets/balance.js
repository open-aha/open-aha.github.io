// Balance scale for equations.
// spec: { left:{x,y,c}, right:{x,y,c}, x: hidden value, y: hidden value, ops:['sub1','subx','suby','div'],
//         goal:'isolate', tap: bool, showEq: bool, label: 'x' }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

const W = 600, H = 300, PIVOT = { x: 300, y: 92 }, ARM = 192, PAN_DROP = 138, PAN_W = 184;

export function balance(box, spec, api) {
  const init = () => ({
    L: { x: spec.left.x || 0, y: spec.left.y || 0, c: spec.left.c || 0 },
    R: { x: spec.right.x || 0, y: spec.right.y || 0, c: spec.right.c || 0 },
  });
  let st = init();
  const history = [];
  let touched = false;
  const xv = spec.x ?? 1, yv = spec.y ?? 1;
  const xl = spec.label || 'x';
  const yl = spec.labelY || 'y';

  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Balance scale');
  // stand
  svg.append(
    s('rect', { x: 210, y: H - 18, width: 180, height: 12, rx: 6, class: 'fl-surface' }),
    s('path', { d: `M${PIVOT.x} ${PIVOT.y + 6} L${PIVOT.x - 46} ${H - 18} L${PIVOT.x + 46} ${H - 18} Z`, class: 'fl-muted', opacity: 0.35 }),
  );
  const beam = s('g', { class: 'bal-beam', style: `transform-origin:${PIVOT.x}px ${PIVOT.y}px` },
    s('rect', { x: PIVOT.x - ARM - 8, y: PIVOT.y - 7, width: 2 * ARM + 16, height: 14, rx: 7, class: 'fl-ink' }),
  );
  const pivotDot = s('circle', { cx: PIVOT.x, cy: PIVOT.y, r: 9, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 4 });
  const pans = { L: makePan(PIVOT.x - ARM), R: makePan(PIVOT.x + ARM) };
  svg.append(pans.L.g, pans.R.g, beam, pivotDot);
  // level indicator
  const levelTxt = s('text', { x: PIVOT.x, y: 34, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))' });
  svg.append(levelTxt);

  function makePan(cx) {
    const g = s('g', { class: 'bal-pan' });
    const strings = s('path', { d: `M${cx} ${PIVOT.y} L${cx - PAN_W / 2 + 8} ${PIVOT.y + PAN_DROP} M${cx} ${PIVOT.y} L${cx + PAN_W / 2 - 8} ${PIVOT.y + PAN_DROP}`, stroke: 'var(--ink-3)', 'stroke-width': 2, fill: 'none' });
    const tray = s('path', { d: `M${cx - PAN_W / 2} ${PIVOT.y + PAN_DROP} L${cx + PAN_W / 2} ${PIVOT.y + PAN_DROP} L${cx + PAN_W / 2 - 18} ${PIVOT.y + PAN_DROP + 16} L${cx - PAN_W / 2 + 18} ${PIVOT.y + PAN_DROP + 16} Z`, class: 'fl-ink' });
    const items = s('g');
    g.append(strings, items, tray);
    return { g, items, cx, nodes: [] };
  }

  const eq = h('div.w-readout');
  const controls = h('div.w-controls.center');
  const opBtns = {};
  const ops = spec.ops || [];
  const opDefs = {
    sub1: { label: `Remove $1$ from both`, can: () => st.L.c >= 1 && st.R.c >= 1, run: () => { st.L.c--; st.R.c--; } },
    subx: { label: `Remove $\\blue{${xl}}$ from both`, can: () => st.L.x >= 1 && st.R.x >= 1, run: () => { st.L.x--; st.R.x--; } },
    suby: { label: `Remove $\\teal{${yl}}$ from both`, can: () => st.L.y >= 1 && st.R.y >= 1, run: () => { st.L.y--; st.R.y--; } },
    div: {
      label: () => `Divide both by $${divisor() || 'n'}$`,
      can: () => divisor() > 1,
      run: () => { const k = divisor(); for (const side of ['L', 'R']) for (const t of ['x', 'y', 'c']) st[side][t] /= k; },
    },
  };
  function divisor() {
    // the coefficient of x on the side that has x, if it divides everything
    const k = st.L.x || st.R.x;
    if (!k || k < 2) return 0;
    const all = [st.L.x, st.L.y, st.L.c, st.R.x, st.R.y, st.R.c];
    return all.every((v) => v % k === 0) ? k : 0;
  }
  for (const op of ops) {
    const d = opDefs[op];
    const b = button(typeof d.label === 'function' ? d.label() : d.label, () => apply(op));
    opBtns[op] = b;
    controls.append(b);
  }
  if (ops.length || spec.tap) {
    const undo = button('Reset', () => {
      st = init();
      history.length = 0;
      render(true);
      api.onChange();
    }, { icon: icons.reset });
    controls.append(undo);
  }

  box.append(svg);
  if (spec.showEq !== false) box.append(eq);
  if (controls.children.length) box.append(controls);

  function apply(op) {
    const d = opDefs[op];
    if (!d.can()) return;
    history.push(JSON.stringify(st));
    d.run();
    touched = true;
    render();
    api.onChange();
  }

  function weight(side) {
    return st[side].x * xv + st[side].y * yv + st[side].c;
  }

  function layout(side) {
    const it = [];
    for (let i = 0; i < st[side].x; i++) it.push('x');
    for (let i = 0; i < st[side].y; i++) it.push('y');
    for (let i = 0; i < st[side].c; i++) it.push('c');
    const pan = pans[side];
    const baseY = PIVOT.y + PAN_DROP - 2;
    const rows = [];
    let row = [], wsum = 0;
    for (const k of it) {
      const w = k === 'c' ? 30 : 44;
      if (wsum + w > PAN_W - 24 && row.length) {
        rows.push(row);
        row = [];
        wsum = 0;
      }
      row.push(k);
      wsum += w;
    }
    if (row.length) rows.push(row);
    const pos = [];
    let y = baseY;
    rows.forEach((r) => {
      const widths = r.map((k) => (k === 'c' ? 30 : 44));
      const tot = widths.reduce((a, b) => a + b, 0);
      let x = pan.cx - tot / 2;
      const rh = r.some((k) => k !== 'c') ? 44 : 30;
      r.forEach((k, i) => {
        pos.push({ k, x: x + widths[i] / 2, y: y - rh / 2 });
        x += widths[i];
      });
      y -= rh;
    });
    return pos;
  }

  function itemNode(k) {
    // outer group is positioned via the transform attribute; inner group animates with CSS
    const outer = s('g');
    outer.append(itemInner(k));
    return outer;
  }
  function itemInner(k) {
    if (k === 'x')
      return s('g', { class: 'bal-item box' }, s('rect', { x: -20, y: -20, width: 40, height: 40, rx: 8, class: 'fl-blue' }), s('text', { y: 7, 'text-anchor': 'middle', text: xl }));
    if (k === 'y')
      return s('g', { class: 'bal-item circ' }, s('circle', { r: 20, class: 'fl-teal' }), s('text', { y: 6, 'text-anchor': 'middle', text: yl }));
    return s('g', { class: 'bal-item unit' }, s('circle', { r: 14, class: 'fl-amber' }), s('text', { y: 5, 'text-anchor': 'middle', text: '1' }));
  }

  function render(instant) {
    for (const side of ['L', 'R']) {
      const pan = pans[side];
      const pos = layout(side);
      // reuse nodes by kind index for smooth transitions
      const byKind = { x: [], y: [], c: [] };
      pan.nodes.forEach((n) => byKind[n.k].push(n));
      const next = [];
      const used = new Set();
      for (const p of pos) {
        let n = byKind[p.k].shift();
        if (!n) {
          n = { k: p.k, el: itemNode(p.k) };
          if (!instant) n.el.firstChild.classList.add('entering');
          pan.items.append(n.el);
          if (spec.tap) {
            n.el.style.cursor = 'pointer';
            n.el.addEventListener('click', () => tapRemove(side, n.k));
          }
        }
        used.add(n);
        n.el.setAttribute('transform', `translate(${p.x},${p.y})`);
        next.push(n);
      }
      pan.nodes.forEach((n) => {
        if (!used.has(n)) {
          n.el.firstChild.classList.add('leaving');
          const wrapG = n.el;
          setTimeout(() => wrapG.remove(), 340);
        }
      });
      pan.nodes = next;
    }
    // tilt
    const diff = weight('R') - weight('L');
    const ang = Math.max(-12, Math.min(12, diff * 2.2));
    beam.style.transform = `rotate(${ang}deg)`;
    const dy = ARM * Math.sin((ang * Math.PI) / 180);
    const dx = ARM * (1 - Math.cos((ang * Math.PI) / 180));
    pans.L.g.style.transform = `translate(${dx}px, ${-dy}px)`;
    pans.R.g.style.transform = `translate(${-dx}px, ${dy}px)`;
    const level = Math.abs(diff) < 1e-9;
    levelTxt.textContent = spec.showLevel === false ? '' : level ? 'Balanced' : 'Not balanced!';
    levelTxt.setAttribute('class', 'lbl ' + (level ? 'fl-green' : 'fl-coral'));
    eq.innerHTML = mdi(`$${side('L')} = ${side('R')}$`);
    for (const [op, b] of Object.entries(opBtns)) {
      b.disabled = !opDefs[op].can();
      if (op === 'div') b.querySelector('span').innerHTML = mdi(opDefs.div.label());
    }
  }

  function tapRemove(side, k) {
    if (st[side][k] <= 0) return;
    st[side][k]--;
    touched = true;
    render();
    api.onChange();
  }

  function term(n, v, color) {
    if (!n) return '';
    return `${n === 1 ? '' : n}\\${color}{${v}}`;
  }
  function side(sd) {
    const t = st[sd];
    const parts = [term(t.x, xl, 'blue'), term(t.y, yl, 'teal'), t.c ? String(t.c) : ''].filter(Boolean);
    return parts.length ? parts.join(' + ') : '0';
  }

  render(true);

  const isolated = () => {
    const a = st.L, b = st.R;
    const lone = (t) => t.x === 1 && t.y === 0 && t.c === 0;
    const only = (t) => t.x === 0 && t.y === 0;
    return (lone(a) && only(b)) || (lone(b) && only(a));
  };

  return {
    ready: () => touched,
    check() {
      if (spec.goal === 'isolate') {
        if (isolated()) return { ok: true };
        return { ok: false, msg: spec.hint || `Keep going until a single $\\blue{${xl}}$ is alone on one side.` };
      }
      if (typeof spec.goal === 'function') return spec.goal(st);
      return { ok: true };
    },
    reveal() {
      st = { L: { x: 1, y: 0, c: 0 }, R: { x: 0, y: 0, c: xv } };
      render();
    },
    retry() {},
  };
}
