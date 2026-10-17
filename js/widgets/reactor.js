// A reaction in a box: A + B → C + D. Molecules bounce around; when an A meets a B and the push
// along their line of centres beats the activation energy, both change into products.
// spec: { params: { T (kelvin), n (pairs of A and B), Ea (activation energy, kJ/mol), cat (0/1) }, window (s), readout(state) }
// Each param is a slider if given in spec.params; otherwise its default is used.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, fix } from '../lib/svg.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

const COL = { A: 'var(--blue)', B: 'var(--coral)', C: 'var(--violet)', D: 'var(--teal)' };

export function reactor(box, spec, api) {
  const defs = spec.params || {};
  const p = { T: 300, n: 24, Ea: 50, cat: 0 };
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const W = 600, H = 250, R = 7, pad = 6;
  const WIN = spec.window ?? 30;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Molecules reacting in a box');
  svg.append(s('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 12, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
  const layer = s('g');
  svg.append(layer);
  // live graph of how many A molecules are left
  const G = { w: 600, h: 150, l: 46, r: 14, t: 14, b: 30 };
  const gsvg = svgRoot(G.w, G.h);
  gsvg.setAttribute('aria-label', 'Number of A molecules over time');
  const gx = (t) => G.l + (t / WIN) * (G.w - G.l - G.r), gy = (f) => G.t + (1 - f) * (G.h - G.t - G.b);
  for (const f of [0, 0.5, 1]) {
    gsvg.append(s('line', { x1: G.l, x2: G.w - G.r, y1: gy(f), y2: gy(f), class: 'grid-line' }));
    gsvg.append(s('text', { x: G.l - 8, y: gy(f) + 5, 'text-anchor': 'end', class: 'tick', text: `${f * 100}%` }));
  }
  for (let t = 0; t <= WIN; t += 10) gsvg.append(s('text', { x: gx(t), y: G.h - 8, 'text-anchor': 'middle', class: 'tick', text: `${t} s` }));
  const ghost = s('path', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5' });
  const line = s('path', { fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  gsvg.append(ghost, line, s('text', { x: G.w - G.r - 6, y: G.t + 14, 'text-anchor': 'end', class: 'lbl', style: 'fill:var(--blue);font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'A left' }));
  gsvg.style.borderTop = '2px solid var(--line)';

  const readout = h('div.w-readout');
  const controls = h('div.w-controls');
  for (const [k, d] of Object.entries(defs)) {
    if (d.slider === false) continue;
    controls.append(slider({ label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color, format: d.format, onInput: (v) => { p[k] = v; restart(); api.onChange(); } }).el);
  }
  const playBtn = button('Pause', () => (running ? pause() : play()), { icon: icons.pause, primary: true });
  const resetBtn = button('Restart', () => { restart(); play(); }, { icon: icons.reset });
  box.append(svg, gsvg, readout, h('div.w-controls.center', playBtn, resetBtn));
  if (controls.children.length) box.append(controls);

  let mols = [], t = 0, hist = [], prevHist = null, raf = 0, running = false, last = 0, seed = 1;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());

  function restart() {
    if (hist.length > 4) prevHist = hist;
    seed = 12345;
    layer.replaceChildren();
    mols = [];
    const sig = 70 * Math.sqrt(p.T / 300);
    for (let i = 0; i < 2 * p.n; i++) {
      let x, y, tries = 0;
      do { x = pad + R + rand() * (W - 2 * pad - 2 * R); y = pad + R + rand() * (H - 2 * pad - 2 * R); tries++; } while (tries < 50 && mols.some((m) => (m.x - x) ** 2 + (m.y - y) ** 2 < (2.4 * R) ** 2));
      const el = s('circle', { r: R, stroke: 'var(--card)', 'stroke-width': 1.5 });
      layer.append(el);
      mols.push({ x, y, vx: sig * gauss(), vy: sig * gauss(), k: i % 2 ? 'B' : 'A', el });
    }
    t = 0;
    hist = [[0, 1]];
    draw();
  }

  function stepSim(dt) {
    const thr = 0.85 * (p.cat ? p.Ea * 0.6 : p.Ea) * 1000; // threshold on the squared closing speed
    for (const m of mols) {
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < pad + R) { m.x = pad + R; m.vx = Math.abs(m.vx); }
      if (m.x > W - pad - R) { m.x = W - pad - R; m.vx = -Math.abs(m.vx); }
      if (m.y < pad + R) { m.y = pad + R; m.vy = Math.abs(m.vy); }
      if (m.y > H - pad - R) { m.y = H - pad - R; m.vy = -Math.abs(m.vy); }
    }
    for (let i = 0; i < mols.length; i++) for (let j = i + 1; j < mols.length; j++) {
      const a = mols[i], b = mols[j];
      const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
      if (d2 > 4 * R * R || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (closing <= 0) continue;
      if (((a.k === 'A' && b.k === 'B') || (a.k === 'B' && b.k === 'A')) && closing * closing > thr) {
        a.k = a.k === 'A' ? 'C' : 'D';
        b.k = b.k === 'A' ? 'C' : 'D';
        a.flash = b.flash = 0.25;
      }
      // equal masses, elastic: swap the velocity components along the line of centres
      a.vx -= closing * nx; a.vy -= closing * ny; b.vx += closing * nx; b.vy += closing * ny;
      const push = (2 * R - d) / 2;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    }
    t += dt;
    for (const m of mols) if (m.flash) m.flash = Math.max(0, m.flash - dt);
  }

  const countA = () => mols.filter((m) => m.k === 'A').length;
  const pathOf = (hs) => (hs && hs.length > 1 ? 'M' + hs.filter(([tt]) => tt <= WIN).map(([tt, f]) => `${gx(tt).toFixed(1)} ${gy(f).toFixed(1)}`).join('L') : '');

  function draw() {
    for (const m of mols) {
      m.el.setAttribute('cx', m.x.toFixed(1));
      m.el.setAttribute('cy', m.y.toFixed(1));
      m.el.setAttribute('fill', COL[m.k]);
      m.el.setAttribute('r', m.flash ? R * 1.5 : R);
    }
    line.setAttribute('d', pathOf(hist));
    ghost.setAttribute('d', pathOf(prevHist));
    const a = countA();
    readout.innerHTML = mdi(spec.readout ? spec.readout({ t, a, n: p.n, p }) : `time **${fix(Math.min(t, 99.9), 1)} s** · {blue:A} left: **${a}** of ${p.n} · products formed: **${p.n - a}** pairs`);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const sub = 4;
    for (let k = 0; k < sub; k++) stepSim(dt / sub);
    if (t - hist[hist.length - 1][0] >= 0.25 && t <= WIN) hist.push([t, countA() / p.n]);
    draw();
    raf = requestAnimationFrame(tick);
  }
  function play() {
    running = true;
    playBtn.innerHTML = icons.pause + '<span>Pause</span>';
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    playBtn.innerHTML = icons.play + '<span>Play</span>';
  }

  restart();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => box.isConnected && play(), 300);
  else pause();

  // for tests: run the simulation for a number of seconds without drawing
  box._simulate = (secs) => { const n = Math.round(secs * 240); for (let i = 0; i < n; i++) stepSim(1 / 240); return countA(); };

  return { ready: () => true, destroy: pause };
}
