// Protein folding on a square lattice (the HP model). Beads are amino acids: H (oily, hydrophobic)
// or P (polar). Tap a bead to bend the chain there (straight → left → right); the rest of the chain
// swings round. Oily beads touching each other (but not neighbours along the chain) are contacts.
// spec: { seq: 'HPPH…', turns: 'SSLR…' (one per inner bead), target: contacts wanted, solution: turns, h }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const NEXT = { S: 'L', L: 'R', R: 'S' };
const ROT = { S: 0, L: 1, R: -1 };

// lattice coordinates of every bead
export function foldPath(turns, n) {
  const pos = [[0, 0]];
  let dir = 0; // 0 +x, 1 +y, 2 -x, 3 -y
  for (let i = 1; i < n; i++) {
    if (i >= 2) dir = (dir + ROT[turns[i - 2]] + 4) % 4;
    const [x, y] = pos[i - 1];
    pos.push([x + [1, 0, -1, 0][dir], y + [0, 1, 0, -1][dir]]);
  }
  return pos;
}
export function foldScore(seq, turns) {
  const pos = foldPath(turns, seq.length);
  const key = (p) => p.join(',');
  const seen = new Map(), clash = new Set();
  pos.forEach((p, i) => { const k = key(p); if (seen.has(k)) { clash.add(i); clash.add(seen.get(k)); } else seen.set(k, i); });
  const contacts = [];
  for (let i = 0; i < pos.length; i++) for (let j = i + 2; j < pos.length; j++) {
    if (seq[i] !== 'H' || seq[j] !== 'H') continue;
    if (Math.abs(pos[i][0] - pos[j][0]) + Math.abs(pos[i][1] - pos[j][1]) === 1) contacts.push([i, j]);
  }
  return { pos, clash, contacts };
}

export function fold(box, spec, api) {
  const seq = spec.seq, n = seq.length;
  const W = 600, H = spec.h || 360;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'A protein chain on a grid');
  const gGrid = s('g'), gChain = s('g');
  svg.append(gGrid, gChain);
  const readout = h('div.w-readout');
  const tools = h('div.w-controls.center');
  box.append(svg, readout, tools);
  const start = (spec.turns || 'S'.repeat(n - 2)).split('');
  let turns = start.slice(), touched = false, shown = null, anim = 0;

  tools.append(button('Straighten', () => { turns = 'S'.repeat(n - 2).split(''); changed(); }, { icon: icons.reset }));

  function layout(pos) {
    const xs = pos.map((p) => p[0]), ys = pos.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const cell = Math.min(64, (W - 60) / Math.max(1, x1 - x0), (H - 60) / Math.max(1, y1 - y0));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return pos.map(([x, y]) => [W / 2 + (x - cx) * cell, H / 2 - (y - cy) * cell, cell]);
  }
  function draw(P) {
    const { clash, contacts } = foldScore(seq, turns);
    const cell = P[0][2];
    gGrid.replaceChildren();
    gChain.replaceChildren();
    // faint lattice
    const ox = ((P[0][0] % cell) + cell) % cell, oy = ((P[0][1] % cell) + cell) % cell;
    let d = '';
    for (let x = ox; x < W; x += cell) d += `M${x} 0V${H}`;
    for (let y = oy; y < H; y += cell) d += `M0 ${y}H${W}`;
    gGrid.append(s('path', { d, stroke: 'var(--grid)', 'stroke-width': 1 }));
    for (const [i, j] of contacts) gChain.append(s('line', { x1: P[i][0], y1: P[i][1], x2: P[j][0], y2: P[j][1], stroke: 'var(--amber)', 'stroke-width': 4, 'stroke-dasharray': '4 5', 'stroke-linecap': 'round' }));
    gChain.append(s('path', { d: 'M' + P.map((p) => `${p[0]} ${p[1]}`).join('L'), fill: 'none', stroke: 'var(--ink)', 'stroke-opacity': 0.65, 'stroke-width': 5, 'stroke-linejoin': 'round' }));
    P.forEach(([x, y], i) => {
      const hyd = seq[i] === 'H', inner = i > 0 && i < n - 1;
      const g = s('g', inner ? { 'data-i': i, role: 'button', tabindex: 0, style: 'cursor:pointer', 'aria-label': `Bend the chain at bead ${i + 1}` } : {});
      if (inner) g.append(s('circle', { cx: x, cy: y, r: Math.max(16, cell * 0.48), fill: 'transparent' }));
      g.append(s('circle', { cx: x, cy: y, r: Math.min(20, cell * 0.33), fill: hyd ? 'var(--amber)' : 'var(--blue-soft)', stroke: clash.has(i) ? 'var(--error)' : hyd ? 'var(--warn)' : 'var(--blue)', 'stroke-width': clash.has(i) ? 4 : 2.5 }));
      if (i === 0 || i === n - 1) g.append(s('text', { x, y: y + 4.5, 'text-anchor': 'middle', class: 'lbl', style: `fill:${hyd ? '#111' : 'var(--ink)'};${FS(11)}`, text: i === 0 ? 'N' : 'C' }));
      gChain.append(g);
    });
    readout.innerHTML = mdi(clash.size ? 'The chain runs into itself: two beads can’t share a square.' : `oily contacts: **${contacts.length}**${spec.target ? ` · goal ${spec.target}` : ''}`);
  }
  function render(animate) {
    const P = layout(foldScore(seq, turns).pos);
    cancelAnimationFrame(anim);
    if (!animate || !shown || matchMedia('(prefers-reduced-motion: reduce)').matches) { shown = P; draw(P); return; }
    const from = shown, t0 = performance.now();
    const step = (now) => {
      const f = Math.min(1, (now - t0) / 220), e = f * f * (3 - 2 * f);
      shown = P.map((p, i) => [from[i][0] + (p[0] - from[i][0]) * e, from[i][1] + (p[1] - from[i][1]) * e, p[2]]);
      draw(shown);
      if (f < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function changed() { touched = true; render(true); api.onChange(); }
  const tap = (el) => { const t = el?.closest('[data-i]'); if (!t) return; const i = +t.dataset.i; turns[i - 1] = NEXT[turns[i - 1]]; changed(); };
  svg.addEventListener('click', (e) => tap(e.target));
  svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(e.target); } });
  render(false);

  return {
    destroy: () => cancelAnimationFrame(anim),
    ready: () => touched,
    check() {
      const { clash, contacts } = foldScore(seq, turns);
      if (clash.size) return { ok: false, msg: 'Untangle the chain first: no two beads may sit on the same square.' };
      if (contacts.length >= (spec.target || 0)) return { ok: true };
      return { ok: false, msg: `${contacts.length} oily contact${contacts.length === 1 ? '' : 's'}; aim for ${spec.target}. Try to tuck the orange beads into the middle.` };
    },
    reveal() { if (spec.solution) { turns = spec.solution.split(''); render(true); } },
  };
}
