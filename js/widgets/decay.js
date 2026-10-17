// Radioactive decay: a grid of atoms decays at random; the count tracks a half-life curve.
// spec: { N: 400, halfLife: 1 (in time units), tmax: 5, label: 'half-lives' }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, Plot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

export function decay(box, spec, api) {
  const N = spec.N || 400, T = spec.halfLife || 1, tmax = spec.tmax || 5;
  const cols = 25, rows = Math.ceil(N / cols);
  const W = 600, cell = 20, gridH = rows * cell + 10;
  const grid = svgRoot(W, gridH);
  grid.setAttribute('aria-label', 'Atoms decaying');
  const dots = [];
  const ox = (W - cols * cell) / 2;
  for (let i = 0; i < N; i++) {
    const c = s('circle', { cx: ox + (i % cols) * cell + cell / 2, cy: 5 + Math.floor(i / cols) * cell + cell / 2, r: 7, class: 'fl-coral' });
    grid.append(c);
    dots.push(c);
  }
  const plot = new Plot({ width: 600, height: 220, xmin: 0, xmax: tmax, ymin: 0, ymax: N, padL: 48, padB: 32, padT: 14, padR: 16 });
  plot.grid(1, N / 4);
  plot.axes({ xticks: 1, yticks: N / 4, xlabel: spec.label || 'half-lives', ylabel: 'atoms left' });
  plot.layers.under.append(s('path', { d: plot.fnPath((t) => N * 2 ** (-t / T), 0, tmax), class: 'curve st-muted', 'stroke-dasharray': '6 5', style: 'stroke-width:2' }));
  const trace = s('path', { class: 'curve st-coral' });
  plot.layers.main.append(trace);
  plot.svg.style.borderTop = '2px solid var(--line)';
  const readout = h('div.w-readout');
  const playBtn = button('Start', () => (running ? stop() : start()), { icon: icons.play, primary: true });
  box.append(grid, plot.svg, readout, h('div.w-controls.center', playBtn, button('Reset', reset, { icon: icons.reset })));

  let alive, t, pts, running = false, raf = 0, last = 0, ran = false;
  function reset() {
    stop();
    alive = new Array(N).fill(true);
    t = 0;
    pts = [[0, N]];
    dots.forEach((d) => { d.setAttribute('class', 'fl-coral'); d.setAttribute('opacity', 1); });
    draw();
  }
  function start() {
    if (t >= tmax) reset();
    running = true;
    playBtn.innerHTML = icons.pause + '<span>Pause</span>';
    last = performance.now();
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    playBtn.innerHTML = icons.play + '<span>Start</span>';
  }
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * (spec.speed || 0.8);
    last = now;
    const p = 1 - 2 ** (-dt / T);
    for (let i = 0; i < N; i++) {
      if (alive[i] && Math.random() < p) {
        alive[i] = false;
        dots[i].setAttribute('class', 'fl-muted');
        dots[i].setAttribute('opacity', 0.35);
      }
    }
    t += dt;
    pts.push([t, alive.filter(Boolean).length]);
    draw();
    if (t >= tmax) {
      ran = true;
      stop();
      api.onChange();
      return;
    }
    raf = requestAnimationFrame(step);
  }
  function draw() {
    trace.setAttribute('d', pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''));
    const left = alive.filter(Boolean).length;
    readout.innerHTML = mdi(`after ${t.toFixed(1)} ${spec.label || 'half-lives'}: **${left}** of ${N} atoms left (theory: ${Math.round(N * 2 ** (-t / T))})`);
  }
  reset();
  return {
    ready: () => ran || spec.ready === true,
    check: () => ({ ok: true }),
    destroy: stop,
  };
}
