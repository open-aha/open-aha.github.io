// Ising model: a grid of up/down spins updated by the Metropolis rule at temperature T (units J/k_B), with an optional field h.
// spec: { size: 64, T: 3, h: 0, field: false, start: 'random' | 'up', goal: (s) => bool | {ok,msg}, solution: { T, h, start } }
//   goal/readout receive s = { T, h, m (signed magnetisation per spin), e (energy per spin), sweeps }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function ising(box, spec, api) {
  const L = spec.size || 64, N = L * L, PX = 6;
  let T = spec.T ?? 3, H = spec.h ?? 0, sweeps = 0, running = false, raf = 0, touched = false;
  const spin = new Int8Array(N);
  let seed = 12345;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const canvas = h('canvas', { width: L * PX, height: L * PX, style: { width: '100%', maxWidth: '420px', height: 'auto', display: 'block', margin: '0 auto', borderRadius: '10px', imageRendering: 'pixelated' }, 'aria-label': 'Grid of magnetic spins' });
  const ctx = canvas.getContext('2d');
  const readout = h('div.w-readout');
  const tS = slider({ label: 'temperature', min: 0.5, max: 5, step: 0.05, value: T, color: 'coral', format: (v) => v.toFixed(2), onInput: (v) => { T = v; touched = true; render(); api.onChange(); } });
  const hS = spec.field ? slider({ label: 'magnetic field', min: -1, max: 1, step: 0.05, value: H, color: 'violet', format: (v) => v.toFixed(2), onInput: (v) => { H = v; touched = true; render(); api.onChange(); } }) : null;
  const play = button('Pause', () => (running ? stop() : start()), { icon: icons.pause });
  const reset = button('Random start', () => { init('random'); render(); api.onChange(); }, { icon: icons.reset });
  const allUp = button('All up', () => { init('up'); render(); api.onChange(); }, { icon: icons.up });
  box.append(canvas, readout, h('div.w-controls', tS.el, hS && hS.el), h('div.w-controls.center', play, reset, allUp));

  function init(kind) {
    for (let i = 0; i < N; i++) spin[i] = kind === 'up' ? 1 : rand() < 0.5 ? 1 : -1;
    sweeps = 0;
  }
  function sweep() {
    for (let k = 0; k < N; k++) {
      const i = (rand() * N) | 0, x = i % L, y = (i / L) | 0;
      const nb = spin[y * L + ((x + 1) % L)] + spin[y * L + ((x + L - 1) % L)] + spin[((y + 1) % L) * L + x] + spin[((y + L - 1) % L) * L + x];
      const dE = 2 * spin[i] * (nb + H);
      if (dE <= 0 || rand() < Math.exp(-dE / T)) spin[i] = -spin[i];
    }
    sweeps++;
  }
  function stats() {
    let m = 0, e = 0;
    for (let i = 0; i < N; i++) {
      const x = i % L, y = (i / L) | 0;
      m += spin[i];
      e -= spin[i] * (spin[y * L + ((x + 1) % L)] + spin[((y + 1) % L) * L + x]) + H * spin[i];
    }
    return { T, h: H, m: m / N, e: e / N, sweeps };
  }
  const css = getComputedStyle(document.documentElement);
  const UP = css.getPropertyValue('--coral').trim() || '#ff6b4a', DOWN = css.getPropertyValue('--blue').trim() || '#456dff';
  function render() {
    ctx.fillStyle = DOWN;
    ctx.fillRect(0, 0, L * PX, L * PX);
    ctx.fillStyle = UP;
    for (let i = 0; i < N; i++) if (spin[i] > 0) ctx.fillRect((i % L) * PX, ((i / L) | 0) * PX, PX, PX);
    const st = stats();
    readout.innerHTML = mdi(spec.readout ? spec.readout(st) : `magnetisation **${st.m >= 0 ? '+' : '−'}${Math.abs(st.m).toFixed(2)}** · energy per spin ${st.e.toFixed(2)} · ${st.sweeps} sweeps`);
  }
  function frame() {
    if (!box.isConnected) return stop();
    for (let k = 0; k < (spec.speed || 2); k++) sweep();
    render();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; setPlay(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); setPlay(); }
  function setPlay() { play.innerHTML = (running ? icons.pause : icons.play) + `<span>${running ? 'Pause' : 'Play'}</span>`; }
  init(spec.start || 'random');
  render();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) start(); else setPlay();

  return {
    destroy: stop,
    ready: () => touched || !spec.goal,
    check() {
      if (!spec.goal) return { ok: true };
      const r = spec.goal(stats());
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      const sol = spec.solution || {};
      if (sol.T != null) { T = sol.T; tS.value = T; }
      if (sol.h != null && hS) { H = sol.h; hS.value = H; }
      if (sol.start) init(sol.start);
      for (let k = 0; k < (sol.sweeps || 0); k++) sweep();
      touched = true;
      render();
    },
  };
}
