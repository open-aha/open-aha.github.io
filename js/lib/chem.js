// Chemistry helpers shared by the molecule widgets, the chemistry courses and the validator.
// No DOM here: everything works in Node too.
//
// A molecule is { atoms: [{ el, x, y, q, h, lp, rad }], bonds: [{ a, b, o }] }:
//   el  element symbol            q   charge (default 0)
//   h   hydrogens drawn as part of the label (null = as many as the atom normally takes)
//   lp, rad  lone pairs and single electrons, when the author fixes them (else worked out)
//   o   bond order 1, 2 or 3

// v: valence electrons, p: period, m: molar mass (g/mol), en: Pauling electronegativity
export const ELEMENTS = {
  H: { v: 1, p: 1, m: 1.008, en: 2.2, name: 'hydrogen' },
  He: { v: 2, p: 1, m: 4.0026, en: null, name: 'helium' },
  Li: { v: 1, p: 2, m: 6.94, en: 0.98, name: 'lithium', metal: true },
  Be: { v: 2, p: 2, m: 9.012, en: 1.57, name: 'beryllium', metal: true },
  B: { v: 3, p: 2, m: 10.81, en: 2.04, name: 'boron' },
  C: { v: 4, p: 2, m: 12.011, en: 2.55, name: 'carbon' },
  N: { v: 5, p: 2, m: 14.007, en: 3.04, name: 'nitrogen' },
  O: { v: 6, p: 2, m: 15.999, en: 3.44, name: 'oxygen' },
  F: { v: 7, p: 2, m: 18.998, en: 3.98, name: 'fluorine' },
  Ne: { v: 8, p: 2, m: 20.18, en: null, name: 'neon' },
  Na: { v: 1, p: 3, m: 22.99, en: 0.93, name: 'sodium', metal: true },
  Mg: { v: 2, p: 3, m: 24.305, en: 1.31, name: 'magnesium', metal: true },
  Al: { v: 3, p: 3, m: 26.982, en: 1.61, name: 'aluminium', metal: true },
  Si: { v: 4, p: 3, m: 28.085, en: 1.9, name: 'silicon' },
  P: { v: 5, p: 3, m: 30.974, en: 2.19, name: 'phosphorus' },
  S: { v: 6, p: 3, m: 32.06, en: 2.58, name: 'sulfur' },
  Cl: { v: 7, p: 3, m: 35.45, en: 3.16, name: 'chlorine' },
  Ar: { v: 8, p: 3, m: 39.948, en: null, name: 'argon' },
  K: { v: 1, p: 4, m: 39.098, en: 0.82, name: 'potassium', metal: true },
  Ca: { v: 2, p: 4, m: 40.078, en: 1.0, name: 'calcium', metal: true },
  Br: { v: 7, p: 4, m: 79.904, en: 2.96, name: 'bromine' },
  I: { v: 7, p: 5, m: 126.9, en: 2.66, name: 'iodine' },
  Xe: { v: 8, p: 5, m: 131.29, en: 2.6, name: 'xenon' },
};

const SUBS = '₀₁₂₃₄₅₆₇₈₉', SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sub = (t) => String(t).replace(/\d/g, (d) => SUBS[d]);
export const sup = (t) => String(t).replace(/\d/g, (d) => SUPS[d]).replace(/\+/g, '⁺').replace(/-/g, '⁻');
// a formula typed plainly ("H2SO4", "NH4+", "SO4 2-") with subscript digits and a superscript charge
export const chem = (t) => {
  const m = String(t).match(/^(.*?)(?:\s(\d*)([+-])|([+-]+))?$/);
  const q = m[3] ? (m[2] || '') + m[3] : m[4] || '';
  return sub(m[1]) + (q ? sup(q) : '');
};

// hydrogens an atom takes when nothing says otherwise (CH4, NH3, H2O, HF; N+ takes four, O− one)
export function usualH(el, q = 0, bonds = 0) {
  const e = ELEMENTS[el];
  if (!e || e.metal || e.v === 8) return 0;
  let target;
  if (el === 'H') target = q ? 0 : 1;
  else if (e.v <= 3) target = e.v - q;
  else if (e.v === 4) target = 4 - Math.abs(q);
  else target = 8 - e.v + q;
  return Math.max(0, target - bonds);
}

// ---------- reading molecules ----------
// A small SMILES reader: organic-subset atoms (B C N O P S F Cl Br I), bracket atoms such as [NH4+],
// [O-] or [Na+], bonds - = #, branches ( ), ring closures 1–9 and '.' between separate pieces.
// Aromatic lower-case atoms are not supported: write rings in Kekulé form (C1=CC=CC=C1).
export function parseSmiles(str) {
  const atoms = [], bonds = [];
  const stack = [], rings = {};
  let prev = null, order = 1, i = 0;
  const addAtom = (a) => {
    const k = atoms.length;
    atoms.push(a);
    if (prev != null) bonds.push({ a: prev, b: k, o: order });
    prev = k;
    order = 1;
  };
  while (i < str.length) {
    const c = str[i];
    if (c === '(') { stack.push(prev); i++; continue; }
    if (c === ')') { prev = stack.pop(); i++; continue; }
    if (c === '-' || c === '=' || c === '#') { order = { '-': 1, '=': 2, '#': 3 }[c]; i++; continue; }
    if (c === '.') { prev = null; i++; continue; }
    if (/\d/.test(c)) {
      if (rings[c]) {
        const r = rings[c];
        bonds.push({ a: r.atom, b: prev, o: Math.max(order, r.order) });
        delete rings[c];
      } else rings[c] = { atom: prev, order };
      order = 1;
      i++;
      continue;
    }
    if (c === '[') {
      const j = str.indexOf(']', i);
      const m = str.slice(i + 1, j).match(/^([A-Z][a-z]?)(H(\d*))?([+-]+|[+-]\d+)?$/);
      if (!m) throw new Error(`Bad bracket atom in ${str}`);
      let q = 0;
      if (m[4]) q = /\d/.test(m[4]) ? (m[4][0] === '+' ? 1 : -1) * +m[4].slice(1) : (m[4][0] === '+' ? 1 : -1) * m[4].length;
      addAtom({ el: m[1], q, h: m[2] ? (m[3] ? +m[3] : 1) : 0 });
      i = j + 1;
      continue;
    }
    const two = str.slice(i, i + 2);
    const el = two === 'Cl' || two === 'Br' ? two : c;
    if (!'BCNOPSFI'.includes(el[0]) || !ELEMENTS[el]) throw new Error(`Unknown atom "${el}" in ${str}`);
    addAtom({ el, q: 0, h: null });
    i += el.length;
  }
  if (Object.keys(rings).length) throw new Error(`Unclosed ring in ${str}`);
  return { atoms, bonds };
}

// ---------- electron bookkeeping ----------
export const bondSum = (mol, i) => mol.bonds.reduce((t, b) => t + (b.a === i || b.b === i ? b.o : 0), 0);
export const neighbours = (mol, i) => mol.bonds.flatMap((b) => (b.a === i ? [b.b] : b.b === i ? [b.a] : []));
export const hOf = (mol, i) => { const a = mol.atoms[i]; return a.h == null ? usualH(a.el, a.q || 0, bondSum(mol, i)) : a.h; };

// Per atom: bonds, hydrogens in the label, electrons it keeps (e), lone pairs, single electrons,
// electrons around it (shell) and anything wrong. Each bond uses one of the atom's own electrons,
// so an atom with charge q keeps e = valence − q − bonds; the charge shown is its formal charge.
// While a molecule is being built, an atom keeps one single electron for every bond it still
// usually makes (carbon with one bond shows three), and pairs up the rest.
export function analyze(mol) {
  const per = mol.atoms.map((a, i) => {
    const E = ELEMENTS[a.el] || { v: 4, p: 2 };
    const B = bondSum(mol, i), h = hOf(mol, i), q = a.q || 0;
    const e = E.v - q - B - h;
    const free = Math.max(0, Math.min(e, usualH(a.el, q, 0) - B - h));
    const lp = a.lp ?? Math.max(0, Math.floor((e - free) / 2));
    const rad = a.rad ?? Math.max(0, free + ((e - free) % 2));
    const shell = 2 * (B + h) + 2 * lp + rad;
    const full = E.p === 1 ? 2 : 8;
    let issue = null;
    if (e < 0 && a.lp == null) issue = 'too many bonds';
    else if (E.p <= 2 && shell > full) issue = `more than ${full} electrons`;
    else if (rad && free && a.rad == null) issue = `room for ${free} more bond${free > 1 ? 's' : ''}`;
    else if (rad) issue = 'an unpaired electron';
    else if (!E.metal && E.v !== 8 && shell < full && (B + h) > 0) issue = `only ${shell} electrons around it`;
    return { B, h, q, e, lp, rad, free, shell, full, issue };
  });
  const charge = mol.atoms.reduce((t, a) => t + (a.q || 0), 0);
  return { per, charge, ok: per.every((p) => !p.issue) };
}

// ---------- formulas ----------
export function counts(mol) {
  const c = {};
  mol.atoms.forEach((a, i) => {
    c[a.el] = (c[a.el] || 0) + 1;
    const h = hOf(mol, i);
    if (h) c.H = (c.H || 0) + h;
  });
  return c;
}
// Carbon compounds in Hill order (C, then H, then the rest alphabetically). Others the usual way:
// least electronegative element first, with hydrogen in front for acids and water (HCl, H₂O, H₃O⁺)
// and after the first element otherwise (NH₃, NH₄⁺, OH⁻).
export function formula(mol, { plain = false, hill = false } = {}) {
  const c = counts(mol);
  const keys = Object.keys(c).sort();
  const q0 = mol.atoms.reduce((t, a) => t + (a.q || 0), 0);
  let order;
  if (c.C || hill) order = c.C ? ['C', ...(c.H ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H')] : keys;
  else {
    const rest = keys.filter((k) => k !== 'H').sort((a, b) => (ELEMENTS[a].en ?? 0) - (ELEMENTS[b].en ?? 0) || a.localeCompare(b));
    if (!c.H) order = rest;
    else if (rest.every((k) => ELEMENTS[k].v >= 6) && q0 >= 0) order = ['H', ...rest];
    else order = [rest[0], 'H', ...rest.slice(1)];
  }
  const body = order.map((k) => k + (c[k] > 1 ? c[k] : '')).join('');
  const q = mol.atoms.reduce((t, a) => t + (a.q || 0), 0);
  const qs = q ? (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '-') : '';
  return plain ? body + qs : sub(body) + sup(qs);
}
export const molarMass = (mol) => Object.entries(counts(mol)).reduce((t, [k, n]) => t + ELEMENTS[k].m * n, 0);

// ---------- same molecule? ----------
// A canonical code for the bonding pattern (not the drawing): hydrogens are folded into the atoms
// they sit on, then atom labels are refined by their neighbours (Weisfeiler–Lehman) until stable.
// Two drawings of the same structure give the same code; different structural isomers differ.
export function canon(mol) {
  const isH = (i) => mol.atoms[i].el === 'H' && neighbours(mol, i).length === 1 && mol.atoms[neighbours(mol, i)[0]].el !== 'H';
  const keep = mol.atoms.map((_, i) => i).filter((i) => !isH(i));
  const idx = new Map(keep.map((i, k) => [i, k]));
  const hc = keep.map((i) => hOf(mol, i) + neighbours(mol, i).filter(isH).length);
  // benzene-like rings (alternating single and double bonds) count as one structure, however drawn
  const arom = new Set();
  for (const ring of rings(mol)) {
    if (ring.length !== 6) continue;
    const rb = ring.map((a, k) => mol.bonds.find((b) => (b.a === a && b.b === ring[(k + 1) % 6]) || (b.b === a && b.a === ring[(k + 1) % 6])));
    if (rb.every((b, k) => b && b.o !== rb[(k + 1) % 6].o && b.o <= 2)) rb.forEach((b) => arom.add(b));
  }
  const edges = mol.bonds.filter((b) => idx.has(b.a) && idx.has(b.b)).map((b) => [idx.get(b.a), idx.get(b.b), arom.has(b) ? 'a' : b.o]);
  let lab = keep.map((i, k) => `${mol.atoms[i].el}${mol.atoms[i].q || 0}h${hc[k]}`);
  const relabel = (sigs) => { const u = [...new Set(sigs)].sort(); return sigs.map((x) => String(u.indexOf(x))); };
  lab = relabel(lab);
  for (let it = 0; it < keep.length + 1; it++) {
    const sigs = lab.map((l, k) => l + '|' + edges.flatMap(([a, b, o]) => (a === k ? [o + ':' + lab[b]] : b === k ? [o + ':' + lab[a]] : [])).sort().join(','));
    const next = relabel(sigs);
    const stable = new Set(next).size === new Set(lab).size;
    lab = next;
    if (stable && it > 1) break;
  }
  // final labels carry the element, so the code is the multiset of labelled atoms and bonds
  const base = keep.map((i, k) => `${mol.atoms[i].el}${mol.atoms[i].q || 0}h${hc[k]}#${lab[k]}`);
  const atomsPart = [...base].sort().join(' ');
  const bondPart = edges.map(([a, b, o]) => [base[a], base[b]].sort().join('~') + '/' + o).sort().join(' ');
  return atomsPart + ' || ' + bondPart;
}
export const sameMolecule = (a, b) => canon(a) === canon(b);
// how many separate pieces (a molecule must be one piece)
export function pieces(mol) {
  const seen = new Set();
  let n = 0;
  for (let i = 0; i < mol.atoms.length; i++) {
    if (seen.has(i)) continue;
    n++;
    const st = [i];
    while (st.length) { const u = st.pop(); if (seen.has(u)) continue; seen.add(u); st.push(...neighbours(mol, u)); }
  }
  return n;
}

// Rings, one per bond that closes a loop in a breadth-first spanning tree (exact for separate and fused rings).
export function rings(mol) {
  const n = mol.atoms.length;
  const nb = mol.atoms.map((_, i) => neighbours(mol, i));
  const parent = new Array(n).fill(-1), depth = new Array(n).fill(-1), out = [];
  for (let r = 0; r < n; r++) {
    if (depth[r] >= 0) continue;
    depth[r] = 0;
    const q = [r];
    while (q.length) {
      const u = q.shift();
      for (const v of nb[u]) if (depth[v] < 0) { depth[v] = depth[u] + 1; parent[v] = u; q.push(v); }
    }
  }
  for (const b of mol.bonds) {
    if (parent[b.a] === b.b || parent[b.b] === b.a) continue;
    let x = b.a, y = b.b;
    const px = [x], py = [y];
    while (x !== y) {
      if (depth[x] >= depth[y]) { x = parent[x]; px.push(x); } else { y = parent[y]; py.push(y); }
    }
    py.pop();
    out.push([...px, ...py.reverse()]);
  }
  return out;
}

// ---------- 2D layout ----------
// Free directions around a point: put n new items into the widest gaps between angles already taken.
export function spread(taken, n) {
  const out = [];
  const all = taken.map((a) => ((a % 360) + 360) % 360);
  if (!all.length && n) { out.push(-90); all.push(270); n--; }
  for (let k = 0; k < n; k++) {
    const s = [...all].sort((a, b) => a - b);
    let best = -1, at = 0;
    for (let j = 0; j < s.length; j++) {
      const a = s[j], b = j + 1 < s.length ? s[j + 1] : s[0] + 360;
      if (b - a > best + 1e-6) { best = b - a; at = a; }
    }
    const ang = at + best / 2;
    out.push(ang);
    all.push(((ang % 360) + 360) % 360);
  }
  return out;
}
// Lay a molecule out in 2D (bond length 1): chains zig-zag, rings are regular polygons,
// branches fill the widest gaps, and atoms with a triple bond (or two double bonds) stay straight.
export function layout(mol, { start = -30 } = {}) {
  const n = mol.atoms.length;
  const pos = new Array(n).fill(null);
  const nb = mol.atoms.map((_, i) => neighbours(mol, i));
  const rs = rings(mol);
  const linear = (i) => mol.bonds.some((b) => (b.a === i || b.b === i) && b.o === 3) || mol.bonds.filter((b) => (b.a === i || b.b === i) && b.o === 2).length >= 2;
  const ang = (i, j) => (Math.atan2(pos[j][1] - pos[i][1], pos[j][0] - pos[i][0]) * 180) / Math.PI;
  const at = (i, deg, d = 1) => [pos[i][0] + d * Math.cos((deg * Math.PI) / 180), pos[i][1] + d * Math.sin((deg * Math.PI) / 180)];
  const flip = new Array(n).fill(1);
  const placeRing = (ring, from) => {
    // ring atoms in cycle order, starting at an atom already placed
    const k = ring.indexOf(from), cyc = [...ring.slice(k), ...ring.slice(0, k)], m = cyc.length;
    const R = 1 / (2 * Math.sin(Math.PI / m));
    const placed = cyc.filter((a) => pos[a]);
    let cx, cy, a0;
    if (placed.length >= 2 && nb[cyc[0]].includes(cyc[m - 1]) && pos[cyc[m - 1]]) {
      // fused to a ring already drawn: build on the shared edge, away from the old atoms
      const [x1, y1] = pos[cyc[0]], [x2, y2] = pos[cyc[m - 1]];
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, h = R * Math.cos(Math.PI / m);
      let nx = -(y2 - y1), ny = x2 - x1;
      const len = Math.hypot(nx, ny);
      nx /= len; ny /= len;
      const others = nb[cyc[0]].filter((v) => pos[v] && v !== cyc[m - 1]);
      if (others.length) { const [ox, oy] = pos[others[0]]; if ((ox - mx) * nx + (oy - my) * ny > 0) { nx = -nx; ny = -ny; } }
      cx = mx + nx * h; cy = my + ny * h;
      a0 = Math.atan2(y1 - cy, x1 - cx);
      const a1 = Math.atan2(y2 - cy, x2 - cx);
      const dir = Math.sin(a1 - a0) > 0 ? -1 : 1;
      cyc.forEach((a, j) => { if (!pos[a]) pos[a] = [cx + R * Math.cos(a0 + (dir * 2 * Math.PI * j) / m), cy + R * Math.sin(a0 + (dir * 2 * Math.PI * j) / m)]; });
      return;
    }
    const prev = nb[from].filter((v) => pos[v] && !ring.includes(v));
    const away = prev.length ? ang(prev[0], from) : start + 60;
    cx = pos[from][0] + R * Math.cos((away * Math.PI) / 180);
    cy = pos[from][1] + R * Math.sin((away * Math.PI) / 180);
    a0 = Math.atan2(pos[from][1] - cy, pos[from][0] - cx);
    cyc.forEach((a, j) => { if (!pos[a]) pos[a] = [cx + R * Math.cos(a0 + (2 * Math.PI * j) / m), cy + R * Math.sin(a0 + (2 * Math.PI * j) / m)]; });
  };
  for (let r = 0; r < n; r++) {
    if (pos[r]) continue;
    pos[r] = [r * 3, 0];
    const queue = [r];
    while (queue.length) {
      const u = queue.shift();
      for (const ring of rs) if (ring.includes(u) && ring.some((a) => !pos[a])) { placeRing(ring, u); ring.forEach((a) => queue.push(a)); }
      const kids = nb[u].filter((v) => !pos[v]);
      if (!kids.length) continue;
      const done = nb[u].filter((v) => pos[v]);
      let angles;
      if (done.length === 0) angles = kids.length === 1 ? [start] : spread([], kids.length).map((a) => a + start + 90);
      else if (done.length === 1 && linear(u)) angles = [ang(done[0], u)].concat(spread([ang(u, done[0]), ang(done[0], u)], kids.length - 1));
      else if (done.length === 1 && kids.length <= 2) {
        const back = ang(u, done[0]);
        flip[u] = -flip[done[0]];
        angles = kids.length === 1 ? [back + 120 * flip[u]] : [back + 120 * flip[u], back - 120 * flip[u]];
      } else angles = spread(done.map((v) => ang(u, v)), kids.length);
      kids.forEach((v, k) => { pos[v] = at(u, angles[k]); flip[v] = flip[u]; queue.push(v); });
    }
  }
  return pos;
}

// Fit positions into a box (w × h, with margin), with bonds at most `bond` long. Returns new positions.
export function fit(pos, { w = 600, h = 300, margin = 50, bond = 70, cx = null, cy = null } = {}) {
  if (!pos.length) return pos;
  const xs = pos.map((p) => p[0]), ys = pos.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(bond, (w - 2 * margin) / Math.max(1e-9, x1 - x0), (h - 2 * margin) / Math.max(1e-9, y1 - y0));
  const ox = (cx ?? w / 2) - ((x0 + x1) / 2) * k, oy = (cy ?? h / 2) - ((y0 + y1) / 2) * k;
  return pos.map(([x, y]) => [+(ox + x * k).toFixed(1), +(oy + y * k).toFixed(1)]);
}

// Turn hydrogens held in labels into separate H atoms placed around their atom (for Lewis drawings).
export function explicitH(mol, d = 0.82) {
  const atoms = mol.atoms.map((a) => ({ ...a })), bonds = mol.bonds.map((b) => ({ ...b }));
  const n = atoms.length;
  for (let i = 0; i < n; i++) {
    const k = hOf(mol, i);
    if (!k) { atoms[i].h = 0; continue; }
    const taken = neighbours({ atoms, bonds }, i).map((j) => (Math.atan2(atoms[j].y - atoms[i].y, atoms[j].x - atoms[i].x) * 180) / Math.PI);
    const dirs = spread(taken, k);
    atoms[i].h = 0;
    for (const deg of dirs) {
      const j = atoms.length;
      atoms.push({ el: 'H', q: 0, h: 0, x: atoms[i].x + d * Math.cos((deg * Math.PI) / 180), y: atoms[i].y + d * Math.sin((deg * Math.PI) / 180) });
      bonds.push({ a: i, b: j, o: 1 });
    }
  }
  // each atom's hydrogens are placed without looking at its neighbours' (a CH between two CH3s can land
  // on their hydrogens), so swing any crowded H around its parent to the clearest nearby angle
  const parent = new Map(bonds.filter((b) => b.b >= n).map((b) => [b.b, b.a]));
  const clearance = (j, x, y) => Math.min(...atoms.map((a, k) => (k === j || k === parent.get(j) ? Infinity : Math.hypot(a.x - x, a.y - y))));
  for (let pass = 0; pass < 3; pass++) {
    for (let j = n; j < atoms.length; j++) {
      const p = atoms[parent.get(j)], here = clearance(j, atoms[j].x, atoms[j].y);
      if (here >= 0.75 * d) continue;
      const deg0 = (Math.atan2(atoms[j].y - p.y, atoms[j].x - p.x) * 180) / Math.PI;
      let best = [here, atoms[j].x, atoms[j].y];
      for (const len of [d, 0.85 * d]) for (let off = -90; off <= 90; off += 5) {
        const t = ((deg0 + off) * Math.PI) / 180, x = p.x + len * Math.cos(t), y = p.y + len * Math.sin(t);
        const c = clearance(j, x, y) - Math.abs(off) * 0.001 - (d - len) * 0.2;
        if (c > best[0]) best = [c, x, y];
      }
      atoms[j].x = best[1];
      atoms[j].y = best[2];
    }
  }
  return { atoms, bonds };
}

// SMILES → a drawable molecule: laid out, scaled into the box. opts.explicitH draws every H as an atom.
export function mol(smiles, opts = {}) {
  const m = parseSmiles(smiles);
  const p = layout(m, opts);
  m.atoms.forEach((a, i) => { a.x = p[i][0]; a.y = p[i][1]; });
  let out = opts.explicitH ? explicitH(m) : m;
  const f = fit(out.atoms.map((a) => [a.x, a.y]), opts);
  out.atoms.forEach((a, i) => { a.x = f[i][0]; a.y = f[i][1]; });
  if (opts.flipX || opts.flipY) out.atoms.forEach((a) => { if (opts.flipX) a.x = (opts.w || 600) - a.x; if (opts.flipY) a.y = (opts.h || 300) - a.y; });
  return out;
}

// ---------- electron domains ----------
const T = Math.acos(-1 / 3);
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const IDEAL = {
  1: [[1, 0, 0]],
  2: [[1, 0, 0], [-1, 0, 0]],
  3: [[0, 1, 0], [Math.sin(2.0944), Math.cos(2.0944), 0], [-Math.sin(2.0944), Math.cos(2.0944), 0]],
  4: [[0, 1, 0], [Math.sin(T), Math.cos(T), 0], [Math.sin(T) * Math.cos(2.0944), Math.cos(T), Math.sin(T) * Math.sin(2.0944)], [Math.sin(T) * Math.cos(4.1888), Math.cos(T), Math.sin(T) * Math.sin(4.1888)]],
  5: [[1, 0, 0], [Math.cos(2.0944), 0, Math.sin(2.0944)], [Math.cos(4.1888), 0, Math.sin(4.1888)], [0, 1, 0], [0, -1, 0]],
  6: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]],
};
// Directions of n bonds and l lone pairs around a centre. Lone pairs take the first slots (equatorial
// for five domains, opposite each other for six). With up to four domains the pairs then push the
// bonds together: every domain repels every other (1/d⁴), lone pairs 1.3 times harder.
export function domains(n, l) {
  const N = n + l;
  if (N < 1 || N > 6) return null;
  let P = IDEAL[N].map((v) => v.slice());
  if (l && N <= 4) {
    const w = P.map((_, i) => (i < l ? 1.3 : 1));
    for (let k = 0; k < 600; k++) {
      const F = P.map(() => [0, 0, 0]);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const d = [P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]], L = Math.hypot(d[0], d[1], d[2]), f = (w[i] * w[j]) / L ** 5;
        for (let a = 0; a < 3; a++) F[i][a] += f * d[a];
      }
      P = P.map((v, i) => { const k = dot3(F[i], v); return unit3(v.map((x, a) => x + 0.02 * (F[i][a] - x * k))); });
    }
  }
  return { lone: P.slice(0, l), bonds: P.slice(l) };
}

// 3D atoms around one centre for the mol3d widget: ligands fill the bond slots in order.
// shape3d({ center: 'C', ligands: ['H', 'Cl', 'Cl', 'Cl'], lone: 0, length: 1.25 })
export function shape3d({ center, ligands, lone = 0, length = 1.25, labels = {} }) {
  const d = domains(ligands.length, lone);
  const atoms = [[center, 0, 0, 0, labels[0] ? { label: labels[0] } : undefined], ...d.bonds.map((v, i) => [ligands[i], v[0] * length, v[1] * length, v[2] * length, labels[i + 1] ? { label: labels[i + 1] } : undefined])];
  return { atoms: atoms.map((a) => (a[4] ? a : a.slice(0, 4))), bonds: d.bonds.map((_, i) => [0, i + 1, 1]), lone: d.lone.map((v) => [0, ...v]) };
}

// ---------- checks for the validator ----------
// Returns a list of problems with a 'mol' widget spec (empty when it is solvable as written).
export function molProblems(spec) {
  const out = [];
  const mode = spec.mode || 'build';
  const atoms = spec.smiles ? parseSmiles(spec.smiles).atoms : (spec.atoms || []).map((a) => (Array.isArray(a) ? { el: a[0], ...(a[3] || {}) } : a));
  for (const a of atoms) if (!ELEMENTS[a.el]) out.push(`unknown element ${a.el}`);
  const nAtoms = spec.smiles ? (spec.explicitH ? explicitH({ ...parseSmiles(spec.smiles), atoms: parseSmiles(spec.smiles).atoms.map((a) => ({ ...a, x: 0, y: 0 })) }).atoms.length : atoms.length) : atoms.length;
  const lenient = (mol, i, issue) => issue.startsWith('only') && (spec.lenient || []).includes(mol.atoms[i].el);
  const solvable = (sm, what) => {
    let m;
    try { m = parseSmiles(sm); } catch (e) { out.push(`${what}: ${e.message}`); return null; }
    const an = analyze(m);
    an.per.forEach((p, i) => { if (p.issue && !lenient(m, i, p.issue)) out.push(`${what} ${sm}: atom ${i} (${m.atoms[i].el}) has ${p.issue}`); });
    if (pieces(m) > 1) out.push(`${what} ${sm} is in several pieces`);
    return m;
  };
  if (mode === 'build') {
    const have = {};
    for (const a of atoms) have[a.el] = (have[a.el] || 0) + 1;
    const pal = spec.palette;
    const can = (el, n) => (have[el] || 0) + (Array.isArray(pal) ? (pal.includes(el) ? Infinity : 0) : (pal?.[el] || 0)) >= n;
    const needAll = (m) => {
      const c = {};
      m.atoms.forEach((a, i) => { c[a.el] = (c[a.el] || 0) + 1; if (!spec.implicitH) { const h = hOf(m, i); if (h) c.H = (c.H || 0) + h; } });
      for (const [el, n] of Object.entries(c)) if (!can(el, n)) out.push(`not enough ${el} to build the target (needs ${n})`);
    };
    if (spec.target) { const m = solvable(spec.target, 'target'); if (m) needAll(m); }
    if (spec.find) {
      const sols = spec.find.solutions || [];
      if (sols.length < spec.find.n) out.push(`find needs ${spec.find.n} solutions listed, has ${sols.length}`);
      const codes = new Set();
      for (const sm of sols) {
        const m = solvable(sm, 'solution');
        if (!m) continue;
        needAll(m);
        const code = canon(m);
        if (codes.has(code)) out.push(`solution ${sm} repeats an earlier one`);
        codes.add(code);
        if (spec.formula && formula(m, { plain: true, hill: true }) !== spec.formula.replace(/\s/g, '')) out.push(`solution ${sm} has formula ${formula(m, { plain: true, hill: true })}, not ${spec.formula}`);
      }
    }
    if (!spec.target && !spec.find && !spec.goal) out.push('build widget without target, find or goal');
  }
  if (mode === 'transfer') {
    if (!spec.solution) out.push('transfer widget without solution');
    else {
      const total = spec.solution.reduce((t, q) => t + q, 0);
      if (total !== 0) out.push('transfer solution charges do not add to zero');
      atoms.forEach((a, i) => {
        const E = ELEMENTS[a.el], e = E.v - spec.solution[i];
        if (!spec.goal && (E.metal ? e !== 0 : e !== (E.p === 1 ? 2 : 8))) out.push(`transfer solution leaves ${a.el} with ${e} electrons`);
      });
    }
  }
  if (mode === 'select' && spec.answer) {
    for (const i of spec.answer.flat()) if (!(i >= 0 && i < nAtoms)) out.push(`select answer index ${i} out of range`);
  }
  if (mode === 'arrows') {
    const m = { atoms, bonds: (spec.bonds || []).map((b) => (Array.isArray(b) ? { a: b[0], b: b[1], o: b[2] || 1 } : b)) };
    const an = analyze(m);
    for (const [f, t] of spec.answer || []) {
      for (const id of [f, t]) {
        const [k, rest] = id.split(':');
        if (k === 'lp') { if (!(an.per[+rest]?.lp > 0)) out.push(`arrow source ${id} has no lone pair`); }
        else if (k === 'a') { if (!m.atoms[+rest]) out.push(`arrow target ${id} missing`); }
        else if (k === 'b') { const [i, j] = rest.split('-').map(Number); if (!m.bonds.some((b) => (b.a === i && b.b === j) || (b.a === j && b.b === i))) out.push(`bond ${id} does not exist`); if (i > j) out.push(`bond id ${id} must list the smaller atom first`); }
        else out.push(`bad arrow end ${id}`);
      }
      if (!f.startsWith('lp:') && !f.startsWith('b:')) out.push(`arrow must start at a lone pair or bond: ${f}`);
    }
    if (!spec.answer?.length) out.push('arrows widget without answer');
  }
  return out;
}
