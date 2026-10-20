// Kinetic-theory gas in a box with a movable piston.
// Particle speeds scale with sqrt(T); "pressure" is measured from wall impulses.
// spec: { N, params:{T (K), V (fraction of max width)}, showHist, goal(p, meas), readout }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, fix } from '../lib/svg.js';
import { slider } from './controls.js';

export function gas(box, spec, api) {
  const p = { T: spec.T ?? 300, V: spec.V ?? 1, N: spec.N ?? 60 };
  const defs = spec.params || {};
  for (const [k, d] of Object.entries(defs)) p[k] = d.value;
  const W = 600, H = 280, x0 = 30, y0 = 20, maxW = 500, boxH = 220;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Gas particles in a container');
  const walls = s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4 });
  const piston = s('rect', { y: y0 - 6, width: 14, height: boxH + 12, rx: 3, class: 'fl-muted' });
  const rod = s('rect', { y: y0 + boxH / 2 - 4, height: 8, class: 'fl-muted' });
  const parts = s('g');
  const thermo = s('rect', { x: x0, y: y0 + boxH + 10, height: 8, rx: 4 });
  svg.append(parts, walls, rod, piston, thermo);

  let particles = [];
  const maxN = 120;
  const rand = () => Math.random();
  function makeParticles() {
    particles = [];
    for (let i = 0; i < maxN; i++) {
      const a = rand() * Math.PI * 2;
      // Maxwell-ish speed spread: sum of uniforms
      const sp = 0.6 + rand() * 0.5 + rand() * 0.5;
      particles.push({ x: x0 + 10 + rand() * (maxW * p.V - 20), y: y0 + 10 + rand() * (boxH - 20), dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, el: s('circle', { r: 5 }) });
    }
    particles.forEach((q) => parts.append(q.el));
  }
  makeParticles();

  // in a narrow column the reading wraps to two lines; css reserves both (see .gas-box in widgets.css)
  box.classList.add('gas-box');
  const readout = h('div.w-readout.gas-readout');
  let shown = '', tallest = 0;
  box.append(svg, readout);
  const sliders = {};
  const row = h('div.w-controls');
  const fmts = { T: (v) => `${v} K`, V: (v) => `${Math.round(v * 100)}%`, N: (v) => `${v}` };
  for (const [k, d] of Object.entries(defs)) {
    sliders[k] = slider({
      label: d.label || k, min: d.min, max: d.max, step: d.step || 1, value: d.value, color: d.color || (k === 'T' ? 'coral' : k === 'V' ? 'blue' : 'teal'),
      format: d.format || fmts[k],
      onInput: (v) => { p[k] = v; touched = true; impulses = []; api.onChange(); },
    });
    row.append(sliders[k].el);
  }
  if (row.children.length) box.append(row);

  let raf = 0, last = performance.now(), touched = false;
  let impulses = []; // [time, impulse] over the last couple of seconds
  let simT = 0;
  const speedScale = () => 70 * Math.sqrt(p.T / 300); // px per second at 300 K
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    simT += dt;
    const right = x0 + maxW * p.V;
    const v = speedScale();
    let imp = 0;
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const active = i < p.N;
      q.el.setAttribute('opacity', active ? 1 : 0);
      if (!active) continue;
      q.x += q.dx * v * dt;
      q.y += q.dy * v * dt;
      if (q.x < x0 + 5) { q.x = x0 + 5; q.dx = Math.abs(q.dx); imp += 2 * Math.abs(q.dx) * v; }
      if (q.x > right - 5) { q.x = right - 5; q.dx = -Math.abs(q.dx); imp += 2 * Math.abs(q.dx) * v; }
      if (q.y < y0 + 5) { q.y = y0 + 5; q.dy = Math.abs(q.dy); imp += 2 * Math.abs(q.dy) * v; }
      if (q.y > y0 + boxH - 5) { q.y = y0 + boxH - 5; q.dy = -Math.abs(q.dy); imp += 2 * Math.abs(q.dy) * v; }
      q.el.setAttribute('cx', q.x);
      q.el.setAttribute('cy', q.y);
      const sp = Math.hypot(q.dx, q.dy);
      q.el.setAttribute('class', sp > 1.45 ? 'fl-coral' : sp > 1.05 ? 'fl-amber' : 'fl-blue');
    }
    impulses.push([simT, imp]);
    while (impulses.length && impulses[0][0] < simT - 2.5) impulses.shift();
    draw();
    raf = requestAnimationFrame(frame);
  }
  function draw() {
    const right = x0 + maxW * p.V;
    walls.setAttribute('d', `M${right + 14} ${y0 - 6} L${x0} ${y0 - 6} L${x0} ${y0 + boxH + 6} L${right + 14} ${y0 + boxH + 6}`);
    piston.setAttribute('x', right);
    rod.setAttribute('x', right + 14);
    rod.setAttribute('width', Math.max(0, W - right - 20));
    thermo.setAttribute('width', (maxW * Math.min(p.T, 900)) / 900);
    thermo.setAttribute('class', p.T > 450 ? 'fl-coral' : p.T > 250 ? 'fl-amber' : 'fl-blue');
    const span = impulses.length > 1 ? impulses[impulses.length - 1][0] - impulses[0][0] : 0;
    const total = impulses.reduce((a, b) => a + b[1], 0);
    // 2D kinetic theory: impulse rate per unit wall length = N<v²>/(2A).
    // Normalised (÷1.74, using the nominal perimeter) so 60 particles at 300 K in the full box read ≈ 1.00.
    const perimeter = 2 * (maxW * p.V + boxH);
    const P = span > 0.5 ? total / span / perimeter / 1.74 : null;
    const meas = { P, theory: (p.N / 60) * (p.T / 300) / p.V };
    const html = mdi(spec.readout ? spec.readout(p, meas) : `pressure $\\approx ${P == null ? '…' : fix(P, 2)}$ $\\quad$ (ideal gas law predicts $${fix(meas.theory, 2)}$)`);
    // the readout keeps its tallest height, so a reading that wraps to two lines never pushes the sliders down and up
    if (html !== shown) {
      shown = html;
      readout.innerHTML = html;
      const hgt = readout.offsetHeight;
      if (hgt > tallest) { tallest = hgt; readout.style.minHeight = hgt + 'px'; }
    }
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(frame);
  else draw();

  return {
    ready: () => touched || spec.ready === true,
    check() {
      const r = spec.goal ? spec.goal(p) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) for (const [k, v] of Object.entries(spec.solution)) { p[k] = v; if (sliders[k]) sliders[k].value = v; }
    },
    destroy: () => cancelAnimationFrame(raf),
  };
}
