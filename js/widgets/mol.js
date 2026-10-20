// Molecules on a flat canvas.
// mode 'build':    tap an element to add an atom (bonded to the selected atom, if any); tap one atom then
//                  another to bond them (tap again for double, triple); tap a bond to change its order;
//                  drag atoms around. Lone pairs, unpaired electrons and charges are worked out live.
//                  spec: { palette: ['C','H'] | {C: 2, H: 6}, implicitH, charges, target: smiles,
//                  formula: 'C2H6O', find: { n, solutions: [smiles] }, goal(m), atoms/bonds or smiles }
// mode 'select':   tap atoms to mark them, or cycle them through `colors` colours (equivalent groups).
//                  spec: { smiles | atoms, pick: 'H'|'heavy'|'all'|(i, atom) => bool, colors, answer, goal(sel) }
// mode 'transfer': move electrons from one atom to another to make ions. spec: { atoms, goal(state) }
// mode 'arrows':   draw curly arrows: tap a lone pair or a bond, then the atom or bond it goes to.
//                  spec: { atoms (with lp, q), bonds, answer: [['lp:2','a:5'], ['b:5-6','a:6']], product }
// mode 'view':     just the drawing. style: 'skeletal' hides carbon atoms (lines meet at corners).
// atoms are [el, x, y, {q, h, lp, rad}] or objects; bonds [a, b, order]. Canvas 600 × h units.
import { h as el } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, toSvgPoint, textBoost, textFloor } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';
import { ELEMENTS, analyze, formula, canon, parseSmiles, pieces, spread, sub, sup, mol as fromSmiles, neighbours, hOf, usualH } from '../lib/chem.js';

const usualBonds = (e) => usualH(e, 0, 0);

const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
// fill, ring colour, text colour
const LOOK = {
  H: ['var(--card)', 'var(--ink-3)', 'var(--ink)'],
  C: ['var(--ink)', 'var(--ink)', 'var(--card)'],
  N: ['var(--blue-soft)', 'var(--blue)', 'var(--ink)'],
  O: ['var(--coral-soft)', 'var(--coral)', 'var(--ink)'],
  F: ['var(--teal-soft)', 'var(--teal)', 'var(--ink)'],
  Cl: ['var(--teal-soft)', 'var(--teal)', 'var(--ink)'],
  Br: ['var(--pink-soft)', 'var(--pink)', 'var(--ink)'],
  I: ['var(--violet-soft)', 'var(--violet)', 'var(--ink)'],
  S: ['var(--amber-soft)', 'var(--amber)', 'var(--ink)'],
  P: ['var(--violet-soft)', 'var(--violet)', 'var(--ink)'],
  B: ['var(--amber-soft)', 'var(--amber)', 'var(--ink)'],
  Si: ['var(--surface-2)', 'var(--ink-3)', 'var(--ink)'],
};
const METAL = ['var(--surface-2)', 'var(--violet)', 'var(--ink)'];
const NOBLE = ['var(--teal-soft)', 'var(--ink-3)', 'var(--ink)'];
const look = (e) => LOOK[e] || (ELEMENTS[e]?.metal ? METAL : ELEMENTS[e]?.v === 8 ? NOBLE : LOOK.Si);
const GROUP = ['var(--blue)', 'var(--coral)', 'var(--teal)', 'var(--amber)', 'var(--violet)', 'var(--pink)'];
const GROUP_SOFT = ['var(--blue-soft)', 'var(--coral-soft)', 'var(--teal-soft)', 'var(--amber-soft)', 'var(--violet-soft)', 'var(--pink-soft)'];
const qText = (q) => (q ? `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}` : '');

function norm(spec, W, H) {
  let atoms, bonds;
  if (spec.smiles) {
    const m = fromSmiles(spec.smiles, { w: W, h: H, explicitH: !!spec.explicitH, bond: spec.bond || 70, margin: spec.margin ?? 50, start: spec.start, flipX: spec.flipX, flipY: spec.flipY });
    atoms = m.atoms.map((a) => ({ ...a }));
    bonds = m.bonds.map((b) => ({ ...b }));
  } else {
    atoms = (spec.atoms || []).map((a) => (Array.isArray(a) ? { el: a[0], x: a[1], y: a[2], q: 0, ...(a[3] || {}) } : { q: 0, ...a }));
    bonds = (spec.bonds || []).map((b) => (Array.isArray(b) ? { a: b[0], b: b[1], o: b[2] || 1 } : { ...b }));
    atoms.forEach((a) => { if (a.h === undefined) a.h = spec.implicitH ? null : 0; });
  }
  (spec.overrides || []).forEach(([i, o]) => Object.assign(atoms[i], o));
  return { atoms, bonds };
}

export function mol(box, spec, api) {
  const W = 600, H = spec.h || 320;
  const mode = spec.mode || 'build';
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', spec.label || 'Molecule');
  svg.style.touchAction = mode === 'view' ? '' : 'none';
  const gB = s('g'), gHit = s('g'), gA = s('g'), gArr = s('g'), gFly = s('g');
  svg.append(gB, gHit, gA, gArr, gFly);
  const readout = mode === 'view' && !spec.readout ? null : el('div.w-readout');
  const tray = el('div.mol-found');
  const palette = el('div.w-controls.center.mol-palette');
  const tools = el('div.w-controls.center');
  box.append(svg);
  if (mode === 'build' || mode === 'transfer') box.append(palette);
  if (readout) box.append(readout);
  if (spec.find) box.append(tray);
  box.append(tools);

  const start = norm(spec, W, H);
  let M = clone(start);
  let sel = null; // { t: 'a'|'b', i }
  let src = null; // arrows mode: chosen source
  let arrows = [];
  let colors = M.atoms.map(() => 0);
  let touched = false, solvedShown = false, note = '';
  const found = [];
  const limits = spec.palette && !Array.isArray(spec.palette) ? { ...spec.palette } : null;
  const palList = spec.palette ? (Array.isArray(spec.palette) ? spec.palette : Object.keys(spec.palette)) : [];

  function clone(m) { return { atoms: m.atoms.map((a) => ({ ...a })), bonds: m.bonds.map((b) => ({ ...b })) }; }
  const bondOf = (i, j) => M.bonds.find((b) => (b.a === i && b.b === j) || (b.a === j && b.b === i));
  const bkey = (b) => `b:${Math.min(b.a, b.b)}-${Math.max(b.a, b.b)}`;
  const used = (e) => M.atoms.filter((a) => a.el === e).length - start.atoms.filter((a) => a.el === e).length;
  const left = (e) => (limits ? limits[e] - used(e) : Infinity);

  // ---------- geometry ----------
  const hidden = (i) => spec.style === 'skeletal' && M.atoms[i].el === 'C' && !M.atoms[i].q && !M.atoms[i].show;
  const label = (i) => {
    const a = M.atoms[i];
    const hh = hOf(M, i);
    if (spec.showH === false || !hh) return a.label || a.el;
    return a.label || (a.hLeft ? `H${hh > 1 ? sub(hh) : ''}${a.el}` : `${a.el}H${hh > 1 ? sub(hh) : ''}`);
  };
  const radius = (i) => (M.atoms[i].el === 'H' ? 15 : 20);
  const half = (i) => { const t = label(i); return t.length > 1 ? Math.max(radius(i), 8 + t.length * 8.6) : radius(i); };
  const angTo = (i, j) => (Math.atan2(M.atoms[j].y - M.atoms[i].y, M.atoms[j].x - M.atoms[i].x) * 180) / Math.PI;
  // where lone pairs, single electrons and the charge sit: in the gaps between bonds (and away from a label's hydrogens)
  function spots(i, per) {
    const a = M.atoms[i];
    const taken = neighbours(M, i).map((j) => angTo(i, j));
    if (hOf(M, i) && label(i).length > 1) taken.push(a.hLeft ? 180 : 0);
    const n = per.lp + per.rad;
    // a lone atom is drawn as its Lewis symbol
    if (mode === 'transfer' || (!taken.length && a.lp == null && a.rad == null)) return dotSpots(Math.max(0, per.e));
    const dirs = spread(taken, n);
    return dirs.map((d, k) => ({ d, pair: k < per.lp }));
  }
  // Lewis dot symbols: one electron per side first, then pairs (top, right, bottom, left)
  function dotSpots(e) {
    const sides = [-90, 0, 90, 180], cnt = [0, 0, 0, 0];
    for (let k = 0; k < Math.min(8, e); k++) cnt[k % 4]++;
    return sides.flatMap((d, k) => (cnt[k] ? [{ d, pair: cnt[k] === 2 }] : []));
  }
  const pol = (i, d, r) => [M.atoms[i].x + r * Math.cos((d * Math.PI) / 180), M.atoms[i].y + r * Math.sin((d * Math.PI) / 180)];

  // ---------- drawing ----------
  function draw() {
    const an = analyze(M);
    gB.replaceChildren(); gHit.replaceChildren(); gA.replaceChildren(); gArr.replaceChildren();
    M.bonds.forEach((b, k) => {
      const A = M.atoms[b.a], B = M.atoms[b.b];
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const offs = b.o === 1 ? [0] : b.o === 2 ? [-5, 5] : [-8, 0, 8];
      // in skeletal drawings a double bond's second line sits inside, and lines stop short of labels
      const cutA = hidden(b.a) ? 0 : half(b.a) * 0.75, cutB = hidden(b.b) ? 0 : half(b.b) * 0.75;
      const isSel = sel && sel.t === 'b' && sel.i === k;
      const isSrc = src === bkey(b);
      for (const o of offs) {
        gB.append(s('line', {
          x1: A.x + (dx / L) * cutA + nx * o, y1: A.y + (dy / L) * cutA + ny * o, x2: B.x - (dx / L) * cutB + nx * o, y2: B.y - (dy / L) * cutB + ny * o,
          stroke: isSel || isSrc ? 'var(--select)' : 'var(--ink)', 'stroke-opacity': isSel || isSrc ? 1 : 0.78, 'stroke-width': spec.style === 'skeletal' ? 3.5 : 4, 'stroke-linecap': 'round',
        }));
      }
      if (mode === 'build' || mode === 'arrows') {
        const hit = s('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: 'transparent', 'stroke-width': 22, 'data-b': k, style: 'cursor:pointer', role: 'button', tabindex: 0, 'aria-label': `Bond between ${ELEMENTS[A.el]?.name || A.el} and ${ELEMENTS[B.el]?.name || B.el}` });
        gHit.append(hit);
      }
    });
    M.atoms.forEach((a, i) => {
      const per = an.per[i];
      const g = s('g', { 'data-a': i, style: mode === 'view' ? '' : 'cursor:pointer', role: mode === 'view' ? null : 'button', tabindex: mode === 'view' ? null : 0, 'aria-label': `${ELEMENTS[a.el]?.name || a.el} atom${a.q ? `, charge ${qText(a.q)}` : ''}` });
      const [fill, ring, ink] = look(a.el);
      const isSel = sel && sel.t === 'a' && sel.i === i;
      const r = radius(i), w = half(i);
      const c = colors[i];
      if (c) g.append(s('rect', { x: a.x - w - 8, y: a.y - r - 8, width: 2 * w + 16, height: 2 * r + 16, rx: r + 8, fill: GROUP_SOFT[(c - 1) % 6], stroke: GROUP[(c - 1) % 6], 'stroke-width': 3 }));
      if (isSel) g.append(s('rect', { x: a.x - w - 7, y: a.y - r - 7, width: 2 * w + 14, height: 2 * r + 14, rx: r + 7, fill: 'none', stroke: 'var(--select)', 'stroke-width': 3 }));
      if (hidden(i)) {
        // a corner of the skeleton: a small dot only while it can be picked
        if (mode === 'select') g.append(s('circle', { cx: a.x, cy: a.y, r: 6, fill: 'var(--ink)' }), s('circle', { cx: a.x, cy: a.y, r: 22, fill: 'transparent' }));
      } else {
        const bad = mode === 'build' && per.issue && (per.issue === 'too many bonds' || per.issue.startsWith('more than'));
        const shape = w > r ? s('rect', { x: a.x - w, y: a.y - r, width: 2 * w, height: 2 * r, rx: r }) : s('circle', { cx: a.x, cy: a.y, r });
        const plain = spec.style === 'skeletal' && a.el !== 'C';
        shape.setAttribute('fill', plain ? 'var(--surface)' : fill);
        shape.setAttribute('stroke', bad ? 'var(--error)' : plain ? 'none' : ring);
        shape.setAttribute('stroke-width', bad ? 4 : 3);
        g.append(shape);
        const tcol = plain ? (a.el === 'O' ? 'var(--coral)' : a.el === 'N' ? 'var(--blue)' : 'var(--ink)') : ink;
        g.append(s('text', { x: a.x, y: a.y + 6.5, 'text-anchor': 'middle', fill: tcol, style: `font-weight:700;${FS(a.el === 'H' ? 16 : 18)}`, text: label(i) }));
      }
      // electrons: dots in the gaps
      const showE = spec.lonePairs !== false && !(spec.style === 'skeletal' && !spec.lonePairs) && !(mode === 'transfer' && false);
      if (showE) {
        const rr = (mode === 'transfer' ? r + 9 : w > r ? r + 6 : r + 8);
        spots(i, per).forEach(({ d, pair }, k) => {
          const isLpSrc = src === `lp:${i}` && pair;
          const col = isLpSrc ? 'var(--select)' : 'var(--ink)';
          const ox = mode === 'transfer' && (d === 0 || d === 180) ? w - r : 0;
          const [px, py] = pol(i, d, rr + ox);
          const tx = -Math.sin((d * Math.PI) / 180) * 4.5, ty = Math.cos((d * Math.PI) / 180) * 4.5;
          if (pair) g.append(s('circle', { cx: px + tx, cy: py + ty, r: 3.3, fill: col }), s('circle', { cx: px - tx, cy: py - ty, r: 3.3, fill: col }));
          else g.append(s('circle', { cx: px, cy: py, r: 3.8, fill: mode === 'build' ? 'var(--amber)' : col, stroke: mode === 'build' ? 'var(--warn)' : 'none', 'stroke-width': 1.2 }));
          if (mode === 'arrows' && pair) g.append(s('circle', { cx: px, cy: py, r: 13, fill: 'transparent', 'data-lp': i, 'data-k': k, style: 'cursor:pointer' }));
        });
      }
      if (a.q && spec.charges !== false) {
        const taken = neighbours(M, i).map((j) => angTo(i, j)).concat(spots(i, per).map((q) => q.d));
        const best = [-45, -135, 45, 135, -67.5, -22.5, -112.5, -157.5, 22.5, 67.5, 112.5, 157.5, 0, 180, -90, 90].map((d) => [d, Math.min(...taken.map((t) => Math.abs(((((d - t) % 360) + 540) % 360) - 180)), 360)]).sort((x, y) => y[1] - x[1])[0][0];
        const [cx, cy] = pol(i, best, (w > r ? w : r) + (mode === 'transfer' ? 22 : 13));
        g.append(s('circle', { cx, cy, r: 10.5, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
        g.append(s('text', { x: cx, y: cy + 4.5, 'text-anchor': 'middle', style: `font-weight:700;${FS(12)}`, text: qText(a.q) }));
      }
      gA.append(g);
    });
    // curly arrows
    arrows.forEach(([from, to], k) => gArr.append(curly(from, to, k)));
    // spec.extra: extra drawing on top (labels, reaction arrows), given the molecule
    if (spec.extra) gArr.append(...[spec.extra({ s, M, W, H, FS })].flat(Infinity).filter(Boolean));
    zoom();
    readoutText(an);
  }

  // On a phone the 600-unit canvas shrinks to a third of its size, so zoom in on the molecule: the
  // view fits the atoms (with room around them) and only ever grows, so nothing jumps while you build.
  let view = null;
  function zoom() {
    const avail = typeof document === 'undefined' ? 680 : Math.min(680, document.documentElement.clientWidth - 32);
    if (avail >= 480 || spec.zoom === false) return;
    const minW = 390, aspect = H / W;
    const xs = M.atoms.map((a) => a.x), ys = M.atoms.map((a) => a.y);
    let need = xs.length ? [Math.min(...xs) - 60, Math.min(...ys) - 50, Math.max(...xs) + 60, Math.max(...ys) + 50] : [W / 2 - minW / 2, H / 2 - (minW * aspect) / 2, W / 2 + minW / 2, H / 2 + (minW * aspect) / 2];
    if (view) need = [Math.min(need[0], view[0]), Math.min(need[1], view[1]), Math.max(need[2], view[0] + view[2]), Math.max(need[3], view[1] + view[3])];
    let w = Math.max(minW, need[2] - need[0], (need[3] - need[1]) / aspect);
    w = Math.min(W, w);
    const hh = w * aspect;
    let x = (need[0] + need[2]) / 2 - w / 2, y = (need[1] + need[3]) / 2 - hh / 2;
    x = Math.max(0, Math.min(W - w, x));
    y = Math.max(0, Math.min(H - hh, y));
    const nb = [x, y, w, hh].map((v) => +v.toFixed(1));
    if (view && nb.every((v, i) => Math.abs(v - view[i]) < 0.5)) return;
    view = nb;
    svg.setAttribute('viewBox', view.join(' '));
    const scale = avail / w;
    svg.style.setProperty('--fs', textBoost(scale).toFixed(3));
    svg.style.setProperty('--fmin', textFloor(scale));
  }
  function endPoint(id, toward) {
    const [t, rest] = id.split(':');
    if (t === 'a' || t === 'lp') {
      const i = +rest, a = M.atoms[i];
      if (t === 'lp') {
        // the lone pair facing where the arrow goes
        const per = analyze(M).per[i];
        const sp = spots(i, per).filter((q) => q.pair).map((q) => pol(i, q.d, radius(i) + 9));
        if (sp.length) return sp.sort((p, q) => Math.hypot(p[0] - toward[0], p[1] - toward[1]) - Math.hypot(q[0] - toward[0], q[1] - toward[1]))[0];
      }
      const ang = Math.atan2(toward[1] - a.y, toward[0] - a.x);
      return [a.x + Math.cos(ang) * (radius(i) + 6), a.y + Math.sin(ang) * (radius(i) + 6)];
    }
    const [i, j] = rest.split('-').map(Number);
    return [(M.atoms[i].x + M.atoms[j].x) / 2, (M.atoms[i].y + M.atoms[j].y) / 2];
  }
  function curly(from, to, k) {
    const c0 = centroid();
    const p0 = endPoint(from, endPoint(to, [c0.x, c0.y]));
    const p1 = endPoint(to, p0);
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    let nx = -(p1[1] - p0[1]) / L, ny = (p1[0] - p0[0]) / L;
    // bend away from the middle of the molecule
    if ((mx - c0.x) * nx + (my - c0.y) * ny < 0) { nx = -nx; ny = -ny; }
    const bend = Math.max(26, L * 0.38);
    const cx = mx + nx * bend, cy = my + ny * bend;
    const g = s('g', { 'data-arrow': k, style: 'cursor:pointer' });
    g.append(s('path', { d: `M${p0[0]} ${p0[1]} Q${cx} ${cy} ${p1[0]} ${p1[1]}`, fill: 'none', stroke: 'transparent', 'stroke-width': 18 }));
    g.append(s('path', { d: `M${p0[0]} ${p0[1]} Q${cx} ${cy} ${p1[0]} ${p1[1]}`, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3.2, 'marker-end': 'url(#arrow-coral)', 'stroke-linecap': 'round' }));
    return g;
  }
  const centroid = () => ({ x: M.atoms.reduce((t, a) => t + a.x, 0) / Math.max(1, M.atoms.length), y: M.atoms.reduce((t, a) => t + a.y, 0) / Math.max(1, M.atoms.length) });

  // ---------- the state handed to goals ----------
  function state() {
    const an = analyze(M);
    return {
      mol: M, an, atoms: M.atoms, bonds: M.bonds, colors, arrows,
      formula: formula(M), plainFormula: formula(M, { plain: true, hill: true }), pieces: pieces(M), canon: canon(M),
      is: (smiles) => canon(M) === canon(parseSmiles(smiles)),
      complete: an.ok && M.atoms.length > 0,
    };
  }
  // spec.lenient: elements allowed fewer than eight electrons (boron in BF3)
  const real = (an) => an.per.map((p, i) => (p.issue && p.issue.startsWith('only') && (spec.lenient || []).includes(M.atoms[i].el) ? null : p.issue));
  function firstIssue(an) {
    const iss = real(an);
    const k = iss.findIndex(Boolean);
    if (k < 0) return null;
    const name = ELEMENTS[M.atoms[k].el]?.name || M.atoms[k].el;
    return `${name[0].toUpperCase() + name.slice(1)} has ${iss[k]}`;
  }
  function readoutText(an) {
    if (!readout) return;
    let t = '';
    if (spec.readout) t = spec.readout(state());
    else if (mode === 'build') {
      if (!M.atoms.length) t = 'Tap an element to add an atom.';
      else {
        const iss = firstIssue(an);
        t = `**${formula(M)}**${an.charge ? ` (charge ${qText(an.charge)})` : ''} · ${pieces(M) > 1 ? `${pieces(M)} separate pieces` : iss ? iss : 'every atom has a full shell ✓'}`;
      }
      if (spec.find) t += ` · found ${found.length} of ${spec.find.n}`;
    } else if (mode === 'transfer') {
      t = M.atoms.map((a, i) => `${a.el}${a.q ? sup(`${Math.abs(a.q) > 1 ? Math.abs(a.q) : ''}${a.q > 0 ? '+' : '-'}`) : ''}: ${Math.max(0, an.per[i].e)}`).join(' · ') + ' (outer electrons)';
    } else if (mode === 'select') {
      const n = colors.filter(Boolean).length;
      t = spec.colors > 1 ? `${new Set(colors.filter(Boolean)).size} colour${new Set(colors.filter(Boolean)).size === 1 ? '' : 's'} used · ${n} atoms coloured` : `${n} selected`;
    } else if (mode === 'arrows') t = arrows.length ? `${arrows.length} arrow${arrows.length > 1 ? 's' : ''} drawn · tap an arrow to remove it` : 'Tap a lone pair or a bond to start an arrow.';
    if (note) t += ` · ${note}`;
    readout.innerHTML = mdi(t);
  }

  // ---------- editing ----------
  function freeSpot(near) {
    const L = spec.implicitH ? 80 : 72, gap = spec.implicitH ? 60 : 40;
    const fits = (x, y) => x > 34 && x < W - 34 && y > 26 && y < H - 26 && !M.atoms.some((b) => Math.hypot(b.x - x, b.y - y) < gap);
    if (near != null) {
      const a = M.atoms[near];
      const nb = neighbours(M, near), taken = nb.map((j) => angTo(near, j));
      let order;
      if (!nb.length) order = [-30, 30, 150, -150, -90, 90];
      else if (nb.length === 1) {
        // carry on a zig-zag: bend the opposite way to the bond we arrived along
        const back = taken[0], up = Math.sin((back * Math.PI) / 180) > 0;
        const c1 = back + 120, c2 = back - 120;
        order = (Math.sin((c1 * Math.PI) / 180) > 0) === up ? [c1, c2] : [c2, c1];
        order.push(back + 180, back + 60, back - 60);
      } else order = spread(taken, 1);
      for (const d of order.concat(spread(taken, 1), spread(taken, 3), spread(taken, 6))) {
        const x = a.x + L * Math.cos((d * Math.PI) / 180), y = a.y + L * Math.sin((d * Math.PI) / 180);
        if (fits(x, y)) return [x, y];
      }
    }
    // a fresh atom: start left of centre on an empty canvas, else find a free spot near the middle
    if (!M.atoms.length) return [spec.implicitH ? 150 : 200, H / 2 + 20];
    for (let ring = 1; ring < 14; ring++) for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * 2 * Math.PI + ring, rr = ring * 30;
      const x = W / 2 + rr * Math.cos(ang) * 1.6, y = H / 2 + rr * Math.sin(ang);
      if (fits(x, y)) return [x, y];
    }
    return [W / 2, H / 2];
  }
  function addAtom(e) {
    if (left(e) <= 0) return;
    const near = sel && sel.t === 'a' ? sel.i : null;
    const [x, y] = freeSpot(near);
    M.atoms.push({ el: e, x, y, q: 0, h: spec.implicitH ? null : 0 });
    colors.push(0);
    if (near != null) M.bonds.push({ a: near, b: M.atoms.length - 1, o: 1 });
    // growing a chain: a new atom that makes two or more bonds becomes the selected one, so the next tap
    // bonds to it (hydrogens and halogens end a chain: the selection stays put for the next one)
    if (usualBonds(e) > 1) sel = { t: 'a', i: M.atoms.length - 1 };
    changed();
  }
  function tapAtom(i) {
    note = '';
    if (mode === 'select') {
      if (!pickable(i)) return;
      const k = spec.colors || 1;
      colors[i] = (colors[i] + 1) % (k + 1);
      return changed();
    }
    if (mode === 'transfer') {
      if (sel && sel.t === 'a' && sel.i !== i) { give(sel.i, i); sel = null; return; }
      sel = sel && sel.i === i ? null : { t: 'a', i };
      return draw();
    }
    if (mode === 'arrows') {
      if (src) { addArrow(src, `a:${i}`); return; }
      return;
    }
    if (mode !== 'build') return;
    if (sel && sel.t === 'a' && sel.i !== i) {
      const b = bondOf(sel.i, i);
      if (b && spec.keepStart && M.bonds.indexOf(b) < start.bonds.length) { sel = null; return draw(); }
      if (b) b.o = b.o % 3 + 1;
      else M.bonds.push({ a: sel.i, b: i, o: 1 });
      sel = null;
      return changed();
    }
    sel = sel && sel.t === 'a' && sel.i === i ? null : { t: 'a', i };
    draw();
  }
  function tapBond(k) {
    note = '';
    if (mode === 'arrows') {
      const id = bkey(M.bonds[k]);
      if (src && src !== id) return addArrow(src, id);
      src = src === id ? null : id;
      return draw();
    }
    const b = M.bonds[k];
    if (spec.keepStart && k < start.bonds.length) return;
    if (sel && sel.t === 'b' && sel.i === k) b.o = b.o % 3 + 1;
    sel = { t: 'b', i: k };
    changed();
  }
  function tapLp(i) {
    note = '';
    const id = `lp:${i}`;
    src = src === id ? null : id;
    draw();
  }
  function addArrow(from, to) {
    if (from.startsWith('b:') && to === from) return;
    const k = arrows.findIndex(([f, t]) => f === from && t === to);
    if (k < 0) arrows.push([from, to]);
    src = null;
    changed();
  }
  function del() {
    if (!sel) return;
    if (sel.t === 'b') { if (spec.keepStart && sel.i < start.bonds.length) return; M.bonds.splice(sel.i, 1); }
    else {
      const i = sel.i;
      if (i < start.atoms.length && spec.keepStart) return;
      M.bonds = M.bonds.filter((b) => b.a !== i && b.b !== i).map((b) => ({ ...b, a: b.a > i ? b.a - 1 : b.a, b: b.b > i ? b.b - 1 : b.b }));
      M.atoms.splice(i, 1);
      colors.splice(i, 1);
    }
    sel = null;
    changed();
  }
  function charge() {
    if (!sel || sel.t !== 'a') return;
    const a = M.atoms[sel.i];
    a.q = a.q === 0 ? 1 : a.q === 1 ? -1 : 0;
    changed();
  }
  // transfer one electron from atom i to atom j, with a dot flying across
  function give(i, j) {
    const an = analyze(M);
    if (an.per[i].e <= 0) { note = `${M.atoms[i].el} has no outer electrons left to give`; return draw(); }
    const full = ELEMENTS[M.atoms[j].el]?.p === 1 ? 2 : 8;
    if (an.per[j].e >= full) { note = `${M.atoms[j].el} already has a full outer shell`; return draw(); }
    const A = M.atoms[i], B = M.atoms[j];
    const dot = s('circle', { cx: A.x, cy: A.y - radius(i) - 9, r: 4.5, fill: 'var(--select)' });
    gFly.append(dot);
    const t0 = performance.now(), dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 520;
    const step = (now) => {
      const f = Math.min(1, (now - t0) / dur), e = f * f * (3 - 2 * f);
      const x = A.x + (B.x - A.x) * e, y = A.y - radius(i) - 9 + (B.y - A.y) * e - Math.sin(Math.PI * f) * 50;
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      if (f < 1) requestAnimationFrame(step);
      else { dot.remove(); A.q += 1; B.q -= 1; changed(); }
    };
    requestAnimationFrame(step);
  }
  const pickable = (i) => {
    const p = spec.pick || 'all', a = M.atoms[i];
    if (typeof p === 'function') return p(i, a);
    if (Array.isArray(p)) return p.includes(i);
    return p === 'all' || (p === 'H' ? a.el === 'H' : p === 'heavy' ? a.el !== 'H' : a.el === p);
  };
  function changed() {
    touched = true;
    paintPalette();
    draw();
    api.onChange();
  }
  // in an isomer hunt, starting over clears the drawing but keeps what has been saved
  function reset() {
    M = clone(start);
    sel = null; src = null; arrows = []; note = '';
    colors = M.atoms.map(() => 0);
    solvedShown = false;
    changed();
  }

  // ---------- pointer handling: tap or drag ----------
  let press = null;
  svg.addEventListener('pointerdown', (e) => {
    if (mode === 'view') return;
    const t = e.target.closest('[data-a],[data-b],[data-lp],[data-arrow]');
    const p = toSvgPoint(svg, e);
    press = { t, x: p.x, y: p.y, moved: false, id: e.pointerId };
    if (t && t.dataset.a != null && mode === 'build') {
      const a = M.atoms[+t.dataset.a];
      press.ox = a.x - p.x; press.oy = a.y - p.y;
      svg.setPointerCapture(e.pointerId);
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!press || !press.t || press.t.dataset.a == null || mode !== 'build') return;
    const p = toSvgPoint(svg, e);
    if (!press.moved && Math.hypot(p.x - press.x, p.y - press.y) < 7) return;
    press.moved = true;
    const a = M.atoms[+press.t.dataset.a];
    a.x = Math.max(22, Math.min(W - 22, p.x + press.ox));
    a.y = Math.max(22, Math.min(H - 22, p.y + press.oy));
    draw();
  });
  svg.addEventListener('pointerup', (e) => {
    if (!press) return;
    const { t, moved } = press;
    press = null;
    if (moved) { touched = true; api.onChange(); return; }
    activate(t);
  });
  svg.addEventListener('pointercancel', () => { press = null; });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest('[data-a],[data-b]');
    if (!t) return;
    e.preventDefault();
    activate(t);
  });
  function activate(t) {
    if (!t) {
      if (sel || src) { sel = null; src = null; draw(); }
      return;
    }
    if (t.dataset.arrow != null) { arrows.splice(+t.dataset.arrow, 1); return changed(); }
    if (t.dataset.lp != null) return tapLp(+t.dataset.lp);
    if (t.dataset.b != null) return tapBond(+t.dataset.b);
    if (t.dataset.a != null) return tapAtom(+t.dataset.a);
  }

  // ---------- controls ----------
  const chips = {};
  function paintPalette() {
    for (const [e, b] of Object.entries(chips)) {
      const n = left(e);
      b.disabled = n <= 0;
      b.querySelector('span').innerHTML = limits ? `+ ${e}<small class="mol-left">${n} left</small>` : `+ ${e}`;
    }
  }
  if (mode === 'build') {
    for (const e of palList) {
      const b = button('+ ' + e, () => addAtom(e));
      b.classList.add('mol-chip');
      b.style.setProperty('--chip', look(e)[1]);
      chips[e] = b;
      palette.append(b);
    }
    paintPalette();
    tools.append(button('Delete', del, { icon: icons.x }));
    if (spec.charges) tools.append(button('Charge ±', charge));
    if (spec.find) tools.append(button('Save this one', save, { primary: true, icon: icons.check }));
    tools.append(button(spec.find ? 'Clear drawing' : 'Reset', reset, { icon: icons.reset }));
  } else if (mode === 'select') {
    tools.append(button('Clear', reset, { icon: icons.reset }));
  } else if (mode === 'transfer') {
    tools.append(button('Start over', reset, { icon: icons.reset }));
  } else if (mode === 'arrows') {
    tools.append(button('Clear arrows', () => { arrows = []; src = null; changed(); }, { icon: icons.reset }));
  }

  // ---------- isomer hunt ----------
  function check1() {
    const st = state();
    if (!M.atoms.length) return { ok: false, msg: 'Build a molecule first.' };
    if (st.pieces > 1) return { ok: false, msg: 'Everything must be joined into one molecule.' };
    const iss = firstIssue(st.an);
    if (iss) return { ok: false, msg: iss + '.' };
    const want = spec.formula ? hillOf(spec.formula) : spec.target && formula(parseSmiles(spec.target), { plain: true, hill: true });
    if (want && st.plainFormula !== want) return { ok: false, msg: `That's ${st.formula}; the molecule should be ${spec.target ? formula(parseSmiles(spec.target)) : sub(spec.formula)}.` };
    if (spec.netCharge != null && st.an.charge !== spec.netCharge) return { ok: false, msg: `The overall charge should be ${spec.netCharge === 0 ? 'zero' : qText(spec.netCharge)}.` };
    return { ok: true, st };
  }
  function save() {
    const r = check1();
    if (!r.ok) { note = r.msg.replace(/\.$/, ''); return draw(); }
    if (spec.find.test) { const t = spec.find.test(r.st); if (t !== true) { note = t; return draw(); } }
    const code = r.st.canon;
    const k = found.findIndex((f) => f.code === code);
    if (k >= 0) { note = `that's the same molecule as number ${k + 1}, just drawn differently`; flash(k); return draw(); }
    found.push({ code, m: clone(M) });
    note = `saved number ${found.length}`;
    tray.append(thumb(M, found.length));
    touched = true;
    draw();
    api.onChange();
  }
  function flash(k) {
    const t = tray.children[k];
    if (!t) return;
    t.classList.remove('flash');
    void t.offsetWidth;
    t.classList.add('flash');
  }
  function thumb(m, n) {
    const xs = m.atoms.map((a) => a.x), ys = m.atoms.map((a) => a.y);
    const x0 = Math.min(...xs) - 26, y0 = Math.min(...ys) - 26, w = Math.max(...xs) - x0 + 26, hh = Math.max(...ys) - y0 + 26;
    const t = svgRoot(Math.max(w, hh * 1.4), Math.max(hh, w / 1.4), 'fig mol-thumb');
    const ox = (Math.max(w, hh * 1.4) - w) / 2 - x0, oy = (Math.max(hh, w / 1.4) - hh) / 2 - y0;
    t.setAttribute('aria-label', `Saved molecule ${n}`);
    for (const b of m.bonds) {
      const A = m.atoms[b.a], B = m.atoms[b.b];
      t.append(s('line', { x1: A.x + ox, y1: A.y + oy, x2: B.x + ox, y2: B.y + oy, stroke: 'var(--ink)', 'stroke-width': 6 + 4 * (b.o - 1), 'stroke-opacity': 0.7, 'stroke-linecap': 'round' }));
    }
    for (const a of m.atoms) t.append(s('circle', { cx: a.x + ox, cy: a.y + oy, r: a.el === 'H' ? 10 : 15, fill: look(a.el)[0], stroke: look(a.el)[1], 'stroke-width': 3 }));
    const wrap = el('div.mol-thumb-box', t, el('span', String(n)));
    return wrap;
  }

  // ---------- arrows: show the product ----------
  function morph(prod) {
    if (!prod) return;
    const P = norm({ ...prod, implicitH: spec.implicitH }, W, H);
    const from = clone(M);
    let swapped = false;
    const t0 = performance.now(), dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 900;
    const step = (now) => {
      const f = Math.min(1, (now - t0) / dur), e = f * f * (3 - 2 * f);
      M.atoms.forEach((a, i) => { const b = P.atoms[i]; if (b) { a.x = from.atoms[i].x + (b.x - from.atoms[i].x) * e; a.y = from.atoms[i].y + (b.y - from.atoms[i].y) * e; } });
      if (f >= 0.5 && !swapped) {
        swapped = true;
        M.bonds = P.bonds.map((b) => ({ ...b }));
        M.atoms.forEach((a, i) => { const b = P.atoms[i]; if (b) Object.assign(a, { q: b.q, lp: b.lp, rad: b.rad, h: b.h, el: b.el }); });
        arrows = [];
      }
      draw();
      if (f < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  draw();

  function goalOf() {
    if (mode === 'build') {
      if (spec.find) {
        if (found.length >= spec.find.n) return { ok: true };
        return { ok: false, msg: found.length ? `You have ${found.length} of ${spec.find.n}. There are more: try a different branch or chain.` : 'Build one, then tap “Save this one”.' };
      }
      const r = check1();
      if (!r.ok) return r;
      if (spec.goal) { const g = spec.goal(r.st); return typeof g === 'object' ? g : { ok: !!g, msg: g ? null : spec.hint }; }
      if (spec.target && !r.st.is(spec.target)) return { ok: false, msg: spec.wrongIsomer || 'Every atom is happy, but the atoms are joined in a different pattern from the one asked for.' };
      return { ok: true };
    }
    if (mode === 'select') {
      if (spec.goal) { const g = spec.goal({ colors, sel: colors.map((c, i) => (c ? i : -1)).filter((i) => i >= 0), atoms: M.atoms, bonds: M.bonds }); return typeof g === 'object' ? g : { ok: !!g, msg: g ? null : spec.hint }; }
      return groupsMatch(spec.answer);
    }
    if (mode === 'transfer') {
      const st = { atoms: M.atoms, an: analyze(M) };
      if (spec.goal) { const g = spec.goal(st); return typeof g === 'object' ? g : { ok: !!g, msg: g ? null : spec.hint }; }
      const bad = M.atoms.findIndex((a, i) => { const e = st.an.per[i].e, E = ELEMENTS[a.el]; return E.metal ? e !== 0 : e !== (E.p === 1 ? 2 : 8); });
      if (bad < 0) return { ok: true };
      const a = M.atoms[bad], name = ELEMENTS[a.el].name;
      return { ok: false, msg: ELEMENTS[a.el].metal ? `The ${name} atom still has outer electrons to give away.` : `The ${name} atom doesn't have a full outer shell yet.` };
    }
    if (mode === 'arrows') {
      const want = new Set(spec.answer.map(([f, t]) => f + '>' + t));
      const got = new Set(arrows.map(([f, t]) => f + '>' + t));
      const right = [...got].filter((x) => want.has(x)).length;
      if (right === want.size && got.size === want.size) return { ok: true };
      if (spec.hints) for (const [k, msg] of Object.entries(spec.hints)) if (got.has(k)) return { ok: false, msg };
      if (!got.size) return { ok: false, msg: 'Draw at least one arrow: tap where the electrons start, then where they go.' };
      return { ok: false, msg: got.size > want.size ? `${right} of your arrows ${right === 1 ? 'is' : 'are'} right, but there are extra ones.` : right ? `${right} of ${want.size} arrows right so far.` : 'Not those electrons. Look for an electron-rich spot (a lone pair or a π bond) and an electron-poor atom.' };
    }
    return { ok: true };
  }
  // answer: list of indices (one colour) or a list of groups (each group one colour, groups different)
  function groupsMatch(answer) {
    if (!answer) return { ok: true };
    const groups = Array.isArray(answer[0]) ? answer : [answer];
    const inAny = new Set(groups.flat());
    for (let i = 0; i < M.atoms.length; i++) if (!inAny.has(i) && colors[i]) return { ok: false, msg: spec.extraMsg || 'You marked an atom that doesn’t belong.' };
    const cols = groups.map((g) => [...new Set(g.map((i) => colors[i]))]);
    if (cols.some((c) => c.includes(0))) return { ok: false, msg: spec.missMsg || 'Some atoms that belong are still unmarked.' };
    if (cols.some((c) => c.length > 1)) return { ok: false, msg: spec.splitMsg || 'Atoms that are equivalent should all have the same colour.' };
    const used = cols.map((c) => c[0]);
    if (new Set(used).size < used.length) return { ok: false, msg: spec.mergeMsg || 'Two different kinds share a colour. Give each kind its own colour.' };
    return { ok: true };
  }

  return {
    ready: () => touched || spec.ready === true,
    check() {
      const r = goalOf();
      if (r.ok && mode === 'arrows' && spec.product && !solvedShown) { solvedShown = true; setTimeout(() => morph(spec.product), 250); }
      return r;
    },
    reveal() {
      if (mode === 'build' && spec.find) {
        tray.replaceChildren();
        found.length = 0;
        (spec.find.solutions || []).forEach((sm, k) => { const m = fromSmiles(sm, { w: W, h: H, explicitH: !spec.implicitH }); found.push({ code: canon(m), m }); tray.append(thumb(m, k + 1)); });
        draw();
      } else if (mode === 'build' && (spec.solution || spec.target)) {
        const m = spec.solution ? norm(spec.solution, W, H) : fromSmiles(spec.target, { w: W, h: H, explicitH: !spec.implicitH, bond: 72 });
        if (spec.implicitH) m.atoms.forEach((a) => { a.h = null; });
        M = clone(m);
        colors = M.atoms.map(() => 0);
        sel = null;
        draw();
      } else if (mode === 'select' && spec.answer) {
        const groups = Array.isArray(spec.answer[0]) ? spec.answer : [spec.answer];
        colors = M.atoms.map(() => 0);
        groups.forEach((g, k) => g.forEach((i) => { colors[i] = k + 1; }));
        draw();
      } else if (mode === 'transfer' && spec.solution) {
        spec.solution.forEach((q, i) => { M.atoms[i].q = q; });
        draw();
      } else if (mode === 'arrows') {
        arrows = spec.answer.map((a) => [...a]);
        draw();
        if (spec.product && !solvedShown) { solvedShown = true; setTimeout(() => morph(spec.product), 1100); }
      }
    },
    retry() { note = ''; draw(); },
  };
}

// a plain formula such as 'C2H6O' in Hill order, for comparing with what was built
function hillOf(f) {
  const c = {};
  for (const [, e, n] of String(f).matchAll(/([A-Z][a-z]?)(\d*)/g)) c[e] = (c[e] || 0) + (+n || 1);
  const keys = Object.keys(c).sort();
  const order = c.C ? ['C', ...(c.H ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H')] : keys;
  return order.map((k) => k + (c[k] > 1 ? c[k] : '')).join('');
}
