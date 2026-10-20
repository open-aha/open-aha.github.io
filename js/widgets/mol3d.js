// Molecules in 3D: ball-and-stick, drag to turn (arrow keys too).
// spec: { atoms: [[el, x, y, z, {label, r}]], bonds: [[i, j, order]], lone: [[atom, dx, dy, dz]], h, scale,
//   turn: [rx, ry] (starting rotation, degrees), spin: true (turn slowly until touched),
//   vsepr: { center, ligand } with params n (bonded atoms) and l (lone pairs): the shape is generated,
//   dipoles: true (bond dipoles and their sum), mode: 'view' | 'match' | 'point' | 'pick',
//   match: { atoms, bonds } the ghost to line up with (drawn on the left), point: atom index to turn away,
//   pick: { answer: [indices], ordered: true }, readout(st), goal(st), solution }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, toSvgPoint, fix, arrow } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';
import { ELEMENTS, domains } from '../lib/chem.js';

const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const LOOK = {
  H: ['var(--card)', 'var(--ink-3)', 'var(--ink)'], C: ['var(--ink)', 'var(--ink)', 'var(--card)'],
  N: ['var(--blue-soft)', 'var(--blue)', 'var(--ink)'], O: ['var(--coral-soft)', 'var(--coral)', 'var(--ink)'],
  F: ['var(--teal-soft)', 'var(--teal)', 'var(--ink)'], Cl: ['var(--teal-soft)', 'var(--teal)', 'var(--ink)'],
  Br: ['var(--pink-soft)', 'var(--pink)', 'var(--ink)'], I: ['var(--violet-soft)', 'var(--violet)', 'var(--ink)'],
  S: ['var(--amber-soft)', 'var(--amber)', 'var(--ink)'], P: ['var(--violet-soft)', 'var(--violet)', 'var(--ink)'],
  B: ['var(--amber-soft)', 'var(--amber)', 'var(--ink)'], Xe: ['var(--teal-soft)', 'var(--ink-3)', 'var(--ink)'],
  X: ['var(--surface-2)', 'var(--ink-3)', 'var(--ink)'],
};
const look = (e) => LOOK[e] || LOOK.X;
const SHAPES = {
  '1,0': 'linear', '1,1': 'linear', '1,2': 'linear', '1,3': 'linear',
  '2,0': 'linear', '3,0': 'trigonal planar', '2,1': 'bent', '4,0': 'tetrahedral', '3,1': 'trigonal pyramidal', '2,2': 'bent',
  '5,0': 'trigonal bipyramidal', '4,1': 'seesaw', '3,2': 'T-shaped', '2,3': 'linear',
  '6,0': 'octahedral', '5,1': 'square pyramidal', '4,2': 'square planar', '3,3': 'T-shaped',
};
export const shapeName = (n, l) => SHAPES[`${n},${l}`] || '';

// ---------- small vector kit ----------
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mul = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
const mm = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const rotX = (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
const rotY = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
export const angleBetween = (a, b) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))) * 180) / Math.PI;

export function mol3d(box, spec, api) {
  const W = 600, H = spec.h || 300;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', spec.label || 'A molecule you can turn by dragging');
  svg.setAttribute('tabindex', '0');
  svg.style.touchAction = 'none';
  svg.style.cursor = 'grab';
  const scene = s('g');
  svg.append(scene);
  const readout = spec.readout !== false && (spec.readout || spec.vsepr || spec.dipoles || spec.mode) ? h('div.w-readout') : null;
  const controls = h('div.w-controls');
  const tools = h('div.w-controls.center');
  box.append(svg);
  if (readout) box.append(readout);

  const defs = spec.params || {};
  const p = {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const sliders = {};
  for (const [k, d] of Object.entries(defs)) {
    if (d.slider === false) continue;
    controls.append((sliders[k] = slider({ label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color, format: d.format, control: d.control, onInput: (v) => { p[k] = v; touched = true; rebuild(true); api.onChange(); } })).el);
  }
  if (controls.children.length) box.append(controls);
  box.append(tools);

  const mode = spec.mode || 'view';
  const scale = spec.scale || 100;
  let R = mm(rotX(((spec.turn?.[0] ?? 0) * Math.PI) / 180), rotY(((spec.turn?.[1] ?? 0) * Math.PI) / 180));
  const R0 = R.map((r) => r.slice());
  let touched = false, spinning = !!spec.spin, picked = [], userTurned = false;
  let atoms = [], bonds = [], lone = [], from = null, tween = 0;

  const asAtom = (a) => (Array.isArray(a) ? { el: a[0], p: [a[1], a[2], a[3]], ...(a[4] || {}) } : a);
  function rebuild(animate) {
    const prev = atoms.map((a) => a.p.slice());
    if (spec.vsepr) {
      const d = domains(p.n, p.l || 0);
      if (!d) { atoms = [{ el: spec.vsepr.center, label: spec.vsepr.label, p: [0, 0, 0] }]; bonds = []; lone = []; draw(); return; }
      atoms = [{ el: spec.vsepr.center, label: spec.vsepr.label, p: [0, 0, 0] }, ...d.bonds.map((v) => ({ el: spec.vsepr.ligand || 'H', p: v.map((x) => x * (spec.vsepr.length || 1.25)) }))];
      bonds = d.bonds.map((_, i) => [0, i + 1, spec.vsepr.order || 1]);
      lone = d.lone.map((v) => [0, ...v]);
    } else {
      atoms = spec.atoms.map(asAtom);
      bonds = spec.bonds || [];
      lone = spec.lone || [];
    }
    if (!spec.turn && !userTurned) R = bestView();
    if (animate && prev.length === atoms.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) { from = prev; tween = performance.now(); requestAnimationFrame(frame); }
    else from = null;
    draw();
  }
  function frame(now) {
    if (!from) return;
    if (now - tween > 450) from = null;
    draw();
    if (from) requestAnimationFrame(frame);
  }
  // the turn that spreads the atoms (and lone-pair lobes) out best on the screen, slightly tilted
  function bestView() {
    const pts = atoms.map((a) => a.p).concat(lone.map(([i, dx, dy, dz]) => [atoms[i].p[0] + dx * 0.8, atoms[i].p[1] + dy * 0.8, atoms[i].p[2] + dz * 0.8]));
    const around = {};
    bonds.forEach(([i, j]) => { (around[i] ||= []).push(j); (around[j] ||= []).push(i); });
    let best = null, bestScore = -1e9;
    for (let ax = -60; ax <= 60; ax += 10) for (let ay = 0; ay < 360; ay += 10) {
      const M = mm(rotX((ax * Math.PI) / 180), rotY((ay * Math.PI) / 180));
      const q = pts.map((v) => mul(M, v));
      let mn = 1e9, tot = 0, n = 0;
      for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) { const d = Math.hypot(q[i][0] - q[j][0], q[i][1] - q[j][1]); mn = Math.min(mn, d); tot += d; n++; }
      // bonds that look straight across from each other on screen, but aren't in 3D, make a shape read as flat
      let flat = 0;
      for (const [c, list] of Object.entries(around)) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const u = sub3(q[list[i]], q[+c]), w = sub3(q[list[j]], q[+c]);
        const proj2 = (Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / ((Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1])) || 1)))) * 180) / Math.PI;
        if (proj2 > 168 && angleBetween(sub3(pts[list[i]], pts[+c]), sub3(pts[list[j]], pts[+c])) < 165) flat++;
      }
      const score = mn + 0.05 * (tot / Math.max(1, n)) - 0.002 * Math.abs(ax + 15) - 0.4 * flat;
      if (score > bestScore + 1e-6) { bestScore = score; best = M; }
    }
    return best || R;
  }
  const posOf = (i) => {
    if (!from) return atoms[i].p;
    const f = Math.min(1, (performance.now() - tween) / 450), e = f * f * (3 - 2 * f);
    return atoms[i].p.map((x, a) => from[i][a] + (x - from[i][a]) * e);
  };

  // project with a little perspective; returns [x, y, depth, size factor]
  const D = 9;
  const proj = (v, cx, cy, Rm = R) => { const q = mul(Rm, v); const k = D / (D - q[2]); return [cx + q[0] * scale * k, cy - q[1] * scale * k, q[2], k]; };
  const centre = () => (mode === 'match' ? [430, H / 2] : [W / 2, H / 2]);
  const radius = (a) => (a.r || (a.label ? 25 : a.el === 'H' ? 15 : 22));

  function drawMolecule(list, bl, lp, cx, cy, Rm, { ghost = false } = {}) {
    const items = [];
    const P = list.map((a, i) => proj(ghost ? a.p : posOf(i), cx, cy, Rm));
    bl.forEach(([i, j, o = 1]) => {
      const [X1, Y1, z1, k1] = P[i], [X2, Y2, z2, k2] = P[j];
      const dx = X2 - X1, dy = Y2 - Y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      // the stick runs between the two balls' edges, and is drawn just behind the farther ball
      const c1 = Math.min(L / 2, radius(list[i]) * k1 * 0.8), c2 = Math.min(L / 2, radius(list[j]) * k2 * 0.8);
      const x1 = X1 + (dx / L) * c1, y1 = Y1 + (dy / L) * c1, x2 = X2 - (dx / L) * c2, y2 = Y2 - (dy / L) * c2;
      const offs = o === 1 ? [0] : o === 2 ? [-5, 5] : [-8, 0, 8];
      items.push({ z: Math.min(z1, z2) - 0.01, el: s('g', { opacity: ghost ? 0.4 : 1 }, offs.map((d) => s('line', { x1: x1 + nx * d, y1: y1 + ny * d, x2: x2 + nx * d, y2: y2 + ny * d, stroke: 'var(--ink-2)', 'stroke-width': (o === 1 ? 8 : 5) * k1, 'stroke-linecap': 'round' }))) });
    });
    lp.forEach(([i, dx, dy, dz]) => {
      const c = list[i].p;
      const tip = [c[0] + dx * 0.95, c[1] + dy * 0.95, c[2] + dz * 0.95];
      const [x1, y1] = P[i], [x2, y2, z2, k2] = proj(ghost ? tip : posOf(i).map((x, a) => x + [dx, dy, dz][a] * 0.95), cx, cy, Rm);
      const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI, Lp = Math.hypot(x2 - x1, y2 - y1);
      const mx = (x1 + x2) / 2 + (x2 - x1) * 0.15, my = (y1 + y2) / 2 + (y2 - y1) * 0.15;
      items.push({ z: z2, el: s('ellipse', { cx: mx, cy: my, rx: Math.max(16, Lp * 0.62), ry: 19 * k2, transform: `rotate(${ang} ${mx} ${my})`, fill: 'var(--teal)', 'fill-opacity': ghost ? 0.1 : 0.22, stroke: 'var(--teal)', 'stroke-opacity': ghost ? 0.3 : 0.75, 'stroke-width': 2, 'stroke-dasharray': '5 4' }) });
    });
    list.forEach((a, i) => {
      const [x, y, z, k] = P[i];
      const [fill, ring, ink] = look(a.el);
      const rr = radius(a) * k;
      const pk = picked.indexOf(i);
      const g = s('g', { 'data-i': ghost ? null : i });
      if (!ghost && mode === 'pick' && pk >= 0) g.append(s('circle', { cx: x, cy: y, r: rr + 7, fill: 'none', stroke: 'var(--select)', 'stroke-width': 3.5 }));
      if (ghost) {
        g.append(s('circle', { cx: x, cy: y, r: rr, fill: 'var(--surface)', stroke: ring === 'var(--ink)' ? 'var(--ink-3)' : ring, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
        const text = a.label ?? (a.el === 'X' ? '' : a.el);
        if (text) g.append(s('text', { x, y: y + 6 * k, 'text-anchor': 'middle', fill: 'var(--ink-2)', style: `font-weight:700;${FS(text.length > 2 ? 13 : 16)}`, text }));
        items.push({ z, el: g });
        return;
      }
      g.append(s('circle', { cx: x, cy: y, r: rr, fill, stroke: ring, 'stroke-width': 3 }));
      g.append(s('ellipse', { cx: x - rr * 0.32, cy: y - rr * 0.36, rx: rr * 0.32, ry: rr * 0.2, fill: '#fff', 'fill-opacity': a.el === 'C' ? 0.22 : 0.55, transform: `rotate(-30 ${x - rr * 0.32} ${y - rr * 0.36})` }));
      const text = a.label ?? (a.el === 'X' ? '' : a.el);
      if (text) g.append(s('text', { x, y: y + 6 * k, 'text-anchor': 'middle', fill: ink, style: `font-weight:700;${FS(text.length > 2 ? 13 : 16)}`, text }));
      if (!ghost && mode === 'pick' && spec.pick?.ordered && pk >= 0) {
        g.append(s('circle', { cx: x + rr * 0.8, cy: y - rr * 0.8, r: 11, fill: 'var(--select)' }));
        g.append(s('text', { x: x + rr * 0.8, y: y - rr * 0.8 + 4.5, 'text-anchor': 'middle', fill: '#fff', style: `font-weight:700;${FS(13)}`, text: String(pk + 1) }));
      }
      items.push({ z, el: g });
    });
    items.sort((a, b) => a.z - b.z);
    return items.map((it) => it.el);
  }

  // final: use where the atoms are heading, not where an animation has got to (for checking answers)
  function dipoleVectors(final = false) {
    const at = (i) => (final ? atoms[i].p : posOf(i));
    // each bond's dipole points from the less to the more electronegative atom, sized by the difference
    return bonds.map(([i, j]) => {
      const ei = ELEMENTS[atoms[i].el]?.en ?? 2.5, ej = ELEMENTS[atoms[j].el]?.en ?? 2.5;
      const d = unit(sub3(at(j), at(i))), m = ej - ei;
      return { i, j, v: d.map((x) => x * m), m };
    });
  }
  const net = (final = false) => dipoleVectors(final).reduce((t, b) => t.map((x, a) => x + b.v[a]), [0, 0, 0]);

  function draw() {
    const [cx, cy] = centre();
    const out = [];
    if (mode === 'match' && spec.match) {
      const ghost = (spec.match.atoms || []).map(asAtom);
      out.push(s('text', { x: 170, y: 26, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: spec.match.label || 'target' }));
      out.push(s('text', { x: 430, y: 26, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'drag to turn' }));
      out.push(...drawMolecule(ghost, spec.match.bonds || [], [], 170, cy, spec.match.turn ? mm(rotX((spec.match.turn[0] * Math.PI) / 180), rotY((spec.match.turn[1] * Math.PI) / 180)) : [[1, 0, 0], [0, 1, 0], [0, 0, 1]], { ghost: true }));
    }
    out.push(...drawMolecule(atoms, bonds, lone, cx, cy, R));
    if (spec.dipoles && atoms.length > 1) {
      for (const b of dipoleVectors()) {
        if (Math.abs(b.m) < 0.15) continue;
        const [x1, y1] = proj(posOf(b.i), cx, cy), [x2, y2] = proj(posOf(b.j), cx, cy);
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        const [ax, ay, bx, by] = b.m > 0 ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
        const f0 = 0.3, f1 = 0.76, o = 32;
        if (L > 30) out.push(arrow(ax + (bx - ax) * f0 + nx * o, ay + (by - ay) * f0 + ny * o, ax + (bx - ax) * f1 + nx * o, ay + (by - ay) * f1 + ny * o, { color: 'var(--coral)', width: 3, head: 9 }));
      }
      const v = net(), m = len(v);
      if (m > 0.05) {
        // the net dipole starts at the edge of the central atom, so its label stays visible
        const q = mul(R, unit(v)), Ls = 80 + 40 * Math.min(1, m), r0 = radius(atoms[0]) + 6, qn = Math.hypot(q[0], q[1]) || 1;
        out.push(arrow(cx + (q[0] / qn) * r0, cy - (q[1] / qn) * r0, cx + q[0] * Ls, cy - q[1] * Ls, { color: 'var(--violet)', width: 6, head: 14 }));
      }
    }
    scene.replaceChildren(...out);
    if (readout) readout.innerHTML = mdi(readText());
  }

  // ---------- state for readouts and goals ----------
  function matched() {
    if (!spec.match) return { n: 0, of: 0 };
    const ghost = (spec.match.atoms || []).map(asAtom);
    const Rg = spec.match.turn ? mm(rotX((spec.match.turn[0] * Math.PI) / 180), rotY((spec.match.turn[1] * Math.PI) / 180)) : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const G = ghost.map((a) => ({ el: a.label || a.el, q: mul(Rg, a.p) }));
    const used = new Set();
    let n = 0;
    atoms.forEach((a, i) => {
      const q = mul(R, atoms[i].p);
      let best = -1, bd = 1e9;
      G.forEach((g, k) => { if (used.has(k) || g.el !== (a.label || a.el)) return; const d = len(sub3(g.q, q)); if (d < bd) { bd = d; best = k; } });
      if (best >= 0 && bd < (spec.match.tol || 0.38)) { used.add(best); n++; }
    });
    return { n, of: atoms.length };
  }
  function state() {
    const lig = atoms.slice(1).map((a) => sub3(a.p, atoms[0].p));
    const angles = [];
    for (let i = 0; i < lig.length; i++) for (let j = i + 1; j < lig.length; j++) angles.push(angleBetween(lig[i], lig[j]));
    const v = spec.dipoles ? net(true) : [0, 0, 0];
    const pt = spec.point != null ? unit(mul(R, sub3(atoms[spec.point].p, atoms[spec.center ?? 0].p))) : null;
    return { p, n: p.n, l: p.l, shape: spec.vsepr ? shapeName(p.n, p.l || 0) : '', angles, minAngle: angles.length ? Math.min(...angles) : null, dipole: len(v), match: matched(), away: pt ? -pt[2] : null, picked, R };
  }
  function readText() {
    const st = state();
    if (typeof spec.readout === 'function') return spec.readout(st);
    if (spec.vsepr) {
      if (p.n + (p.l || 0) > 6) return 'More than six electron domains won’t fit around one atom.';
      const shown = [...new Set(st.angles.map((a) => fix(a, 1)))].sort((a, b) => a - b);
      const pol = spec.dipoles ? ` · ${st.dipole < 0.05 ? '**non-polar**' : '**polar**'}` : '';
      return `**${st.shape}** · ${p.n + (p.l || 0)} electron domains${shown.length ? ` · bond angle${shown.length > 1 ? 's' : ''} ${shown.slice(0, 3).join('°, ')}°` : ''}${pol}`;
    }
    if (mode === 'match') return `atoms lined up with the target: ${st.match.n} of ${st.match.of}`;
    if (mode === 'point') return st.away > 0.9 ? `the ${spec.pointName || 'marked group'} points straight away from you ✓` : `the ${spec.pointName || 'marked group'} points ${st.away > 0.3 ? 'partly away from you' : st.away < -0.3 ? 'towards you' : 'sideways'}`;
    if (spec.dipoles) return st.dipole < 0.05 ? 'The bond dipoles cancel: **non-polar**' : `Net dipole (violet arrow): **polar** · size ${fix(st.dipole, 2)}`;
    if (mode === 'pick') return picked.length ? `picked: ${picked.map((i) => atoms[i].label || atoms[i].el).join(', ')}` : 'Tap atoms to pick them.';
    return '';
  }

  // ---------- turning ----------
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    spinning = false;
    const pt = toSvgPoint(svg, e);
    drag = { x: pt.x, y: pt.y, x0: pt.x, y0: pt.y, t: e.target.closest('[data-i]'), moved: false };
    svg.setPointerCapture(e.pointerId);
    svg.style.cursor = 'grabbing';
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = toSvgPoint(svg, e);
    if (!drag.moved && Math.hypot(pt.x - drag.x0, pt.y - drag.y0) < 6) return;
    drag.moved = true;
    userTurned = true;
    turn((pt.x - drag.x) * 0.012, (pt.y - drag.y) * 0.012);
    drag.x = pt.x; drag.y = pt.y;
  });
  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    svg.style.cursor = 'grab';
    if (!d.moved && d.t && mode === 'pick') tapAtom(+d.t.dataset.i);
    else if (d.moved) { touched = true; api.onChange(); }
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', (e) => {
    const m = { ArrowLeft: [-0.17, 0], ArrowRight: [0.17, 0], ArrowUp: [0, -0.17], ArrowDown: [0, 0.17] }[e.key];
    if (!m) return;
    e.preventDefault();
    spinning = false;
    userTurned = true;
    turn(m[0], m[1]);
    touched = true;
    api.onChange();
  });
  function turn(ay, ax) {
    R = mm(rotY(ay), mm(rotX(ax), R));
    draw();
  }
  function tapAtom(i) {
    const k = picked.indexOf(i);
    if (k >= 0) picked.splice(k, 1);
    else picked.push(i);
    touched = true;
    draw();
    api.onChange();
  }
  // a slow turn so the drawing reads as 3D before anyone touches it
  let last = 0, raf = 0;
  function spin(now) {
    if (!spinning) return;
    if (svg.isConnected) { if (last) turn(((now - last) / 1000) * 0.5, 0); last = now; }
    raf = requestAnimationFrame(spin);
  }
  if (spinning && !matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(spin);
  else spinning = false;
  if (mode !== 'view' || spec.resetButton) tools.append(button('Reset view', () => { userTurned = false; R = spec.turn ? R0.map((r) => r.slice()) : bestView(); picked = []; draw(); }, { icon: icons.reset }));
  if (!tools.children.length) tools.remove();

  rebuild(false);

  // Reserve the readout's tallest height over every setting of the sliders, so the figure never
  // jumps while someone taps through shapes (the wording, and so the wrapping, changes).
  if (readout && Object.keys(sliders).length) {
    readout.dataset.reserved = '1';
    let width = 0;
    const measure = () => {
      const w = readout.clientWidth;
      if (!w || w === width) return;
      width = w;
      const keys = Object.keys(sliders), saved = { ...p }, savedR = R, savedU = userTurned;
      const combos = [{}];
      for (const k of keys) {
        const d = defs[k], out = [];
        for (const c of combos) for (let v = d.min; v <= d.max + 1e-9; v += d.step) out.push({ ...c, [k]: +v.toFixed(6) });
        combos.splice(0, combos.length, ...out.slice(0, 200));
      }
      readout.style.minHeight = '';
      let tallest = 0;
      userTurned = true;
      for (const c of combos) { Object.assign(p, c); rebuild(false); tallest = Math.max(tallest, readout.offsetHeight); }
      Object.assign(p, saved); userTurned = savedU; R = savedR; rebuild(false);
      readout.style.minHeight = tallest + 'px';
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(readout);
    readout._measure = () => { width = 0; measure(); };
  }

  return {
    destroy: () => { spinning = false; cancelAnimationFrame(raf); },
    ready: () => touched || spec.ready === true,
    check() {
      const st = state();
      if (spec.goal) { const r = spec.goal(st); return typeof r === 'object' ? r : { ok: !!r, msg: r ? null : spec.hint }; }
      if (mode === 'match') return st.match.n === st.match.of ? { ok: true } : { ok: false, msg: spec.hint || `${st.match.n} of ${st.match.of} atoms line up. Keep turning.` };
      if (mode === 'point') return st.away > 0.9 ? { ok: true } : { ok: false, msg: spec.hint || 'Turn the molecule until that group points straight into the screen, hidden behind the centre.' };
      if (mode === 'pick') {
        const want = spec.pick?.answer || [];
        const ok = spec.pick?.ordered ? want.length === picked.length && want.every((v, k) => v === picked[k]) : want.length === picked.length && want.every((v) => picked.includes(v));
        return ok ? { ok: true } : { ok: false, msg: spec.hint || 'Not quite.' };
      }
      return { ok: true };
    },
    reveal() {
      if (spec.solution?.turn) { R = mm(rotX((spec.solution.turn[0] * Math.PI) / 180), rotY((spec.solution.turn[1] * Math.PI) / 180)); }
      if (spec.solution?.params) {
        for (const [k, v] of Object.entries(spec.solution.params)) { p[k] = v; if (sliders[k]) sliders[k].value = v; }
        rebuild(true);
      }
      if (spec.pick?.answer) picked = spec.pick.answer.slice();
      draw();
    },
  };
}
