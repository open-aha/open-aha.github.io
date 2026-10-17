// Sieve of Eratosthenes on 2..N. Buttons cross out multiples of each prime in turn.
// spec: { N: 100, primes: [2,3,5,7], goal(state), needAll }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

export function sieve(box, spec, api) {
  const N = spec.N || 100;
  const cols = 10, rows = Math.ceil(N / cols);
  const cell = 52, W = cols * cell + 20, H = rows * cell + 20;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', `Numbers 1 to ${N}`);
  const cells = [];
  const crossed = new Set([1]);
  const done = new Set();
  const COL = { 2: 'blue', 3: 'coral', 5: 'teal', 7: 'violet' };
  for (let n = 1; n <= N; n++) {
    const i = n - 1, x = 10 + (i % cols) * cell, y = 10 + Math.floor(i / cols) * cell;
    const bg = s('rect', { x: x + 3, y: y + 3, width: cell - 6, height: cell - 6, rx: 10, class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 1.5 });
    const t = s('text', { x: x + cell / 2, y: y + cell / 2 + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(17px * var(--fs, 1)), var(--fmin, 0px))', text: String(n) });
    const slash = s('line', { x1: x + 12, y1: y + cell - 12, x2: x + cell - 12, y2: y + 12, 'stroke-width': 3, opacity: 0 });
    svg.append(bg, t, slash);
    cells[n] = { bg, t, slash };
  }
  const readout = h('div.w-readout');
  const ctrls = h('div.w-controls.center');
  const btns = {};
  for (const p of spec.primes || [2, 3, 5, 7]) {
    btns[p] = button(`Cross out multiples of ${p}`, () => strike(p));
    ctrls.append(btns[p]);
  }
  ctrls.append(button('Reset', reset, { icon: icons.reset }));
  box.append(svg, readout, ctrls);

  function strike(p) {
    if (done.has(p)) return;
    done.add(p);
    btns[p].disabled = true;
    let k = 0;
    for (let m = p * 2; m <= N; m += p) {
      if (crossed.has(m)) continue;
      crossed.add(m);
      const c = cells[m];
      const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 18 * k++;
      setTimeout(() => {
        c.slash.setAttribute('stroke', `var(--${COL[p] || 'ink'})`);
        c.slash.setAttribute('opacity', 1);
        c.t.setAttribute('opacity', 0.3);
      }, delay);
    }
    setTimeout(render, 0);
    api.onChange();
  }
  function reset() {
    crossed.clear();
    crossed.add(1);
    done.clear();
    for (let n = 1; n <= N; n++) {
      cells[n].slash.setAttribute('opacity', 0);
      cells[n].t.setAttribute('opacity', 1);
    }
    Object.values(btns).forEach((b) => (b.disabled = false));
    render();
    api.onChange();
  }
  function render() {
    const all = (spec.primes || [2, 3, 5, 7]).every((p) => done.has(p));
    for (let n = 2; n <= N; n++) {
      const prime = !crossed.has(n);
      cells[n].bg.setAttribute('class', all && prime ? 'fl-amber-soft' : 'fl-card');
      cells[n].bg.setAttribute('stroke', all && prime ? 'var(--amber)' : 'var(--line-2)');
    }
    cells[1].t.setAttribute('opacity', 0.3);
    const left = N - crossed.size;
    readout.innerHTML = mdi(all ? `Every number left is prime: there are **${left}** primes up to ${N}.` : `${left} numbers not yet crossed out`);
  }
  render();
  return {
    ready: () => (spec.needAll ? (spec.primes || [2, 3, 5, 7]).every((p) => done.has(p)) : true),
    check: () => ({ ok: true }),
  };
}
