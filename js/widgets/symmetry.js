// Symmetries of a regular polygon (dihedral group). Buttons rotate or flip the shape.
// State {k, f} means x ↦ Rᵏ Fᶠ x  (R = rotate 360/n° counterclockwise, F = flip across the vertical axis).
// spec: { n: 3|4, target: {k, f}, goal(state, history), hint, readout(state, history) → md, maxWidth }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

const COLORS = ['coral', 'blue', 'teal', 'amber', 'violet', 'pink'];
const mod = (a, n) => ((a % n) + n) % n;

export function symName({ k, f }, n) {
  if (!f) return k === 0 ? 'the identity (do nothing)' : `a rotation by ${(k * 360) / n}°`;
  return 'a flip (reflection)';
}

export function symmetry(box, spec, api) {
  const n = spec.n || 4;
  const step = 360 / n;
  const hasTarget = !!spec.target;
  const W = hasTarget ? 600 : 420, H = 300;
  const C1 = hasTarget ? [190, 150] : [210, 150], R1 = 104;
  const C2 = [470, 150], R2 = 66;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', `A regular ${n}-gon with numbered corners`);
  svg.style.maxWidth = (spec.maxWidth || (hasTarget ? 600 : 420)) + 'px';
  svg.style.margin = '0 auto';

  const theta0 = n === 4 ? 135 : 90;
  const orig = Array.from({ length: n }, (_, i) => {
    const a = ((theta0 - i * step) * Math.PI) / 180;
    return [Math.cos(a), Math.sin(a)];
  });
  const apply = ({ k, f }, [x, y]) => {
    if (f) x = -x;
    const a = (k * step * Math.PI) / 180;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };

  const main = s('g', {});
  const tgt = s('g', {});
  svg.append(main, tgt);
  // the axis of the flip
  main.before(s('line', { x1: C1[0], x2: C1[0], y1: C1[1] - R1 - 26, y2: C1[1] + R1 + 26, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }));

  function drawShape(g, pts, [cx, cy], rad, small) {
    const P = pts.map(([x, y]) => [cx + rad * x, cy - rad * y]);
    const els = [s('path', { d: P.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z', class: 'fl-blue-soft', stroke: 'var(--ink)', 'stroke-width': small ? 2.5 : 3.5, 'stroke-linejoin': 'round' })];
    P.forEach(([x, y], i) => {
      els.push(s('circle', { cx: x, cy: y, r: small ? 12 : 17, class: `fl-${COLORS[i]}`, stroke: 'var(--card)', 'stroke-width': 3 }));
      els.push(s('text', { x, y: y + (small ? 5 : 7), 'text-anchor': 'middle', style: `fill:#fff;font-weight:700;font-size:max(calc(${small ? 14 : 19}px * var(--fs, 1)), var(--fmin, 0px))`, text: String(i + 1) }));
    });
    g.replaceChildren(...els);
  }

  let state = { k: 0, f: 0 };
  let history = [];
  let touched = false;
  let anim = 0;

  if (hasTarget) {
    drawShape(tgt, orig.map((p) => apply(spec.target, p)), C2, R2, true);
    svg.append(s('text', { x: C2[0], y: 34, 'text-anchor': 'middle', class: 'lbl', text: 'target' }));
    svg.append(s('text', { x: C1[0], y: 24, 'text-anchor': 'middle', class: 'lbl', text: 'yours' }));
  }

  const readout = h('div.w-readout');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function act(op) {
    cancelAnimationFrame(anim);
    const from = orig.map((p) => apply(state, p));
    state = op === 'R' ? { k: mod(state.k + 1, n), f: state.f } : { k: mod(-state.k, n), f: 1 - state.f };
    history.push(op);
    touched = true;
    api.onChange();
    const t0 = performance.now(), dur = reduce ? 0 : 420;
    const frame = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const pts = from.map(([x, y]) => {
        if (op === 'R') {
          const a = (e * step * Math.PI) / 180;
          return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
        }
        return [x * (1 - 2 * e), y];
      });
      drawShape(main, pts, C1, R1);
      if (t < 1) anim = requestAnimationFrame(frame);
      else render();
    };
    anim = requestAnimationFrame(frame);
    renderText();
  }

  function render() {
    drawShape(main, orig.map((p) => apply(state, p)), C1, R1);
    renderText();
  }
  function renderText() {
    if (spec.readout) readout.innerHTML = mdi(spec.readout(state, history));
    else {
      const seq = history.length ? history.join(' then ') : 'no moves yet';
      readout.innerHTML = mdi(`${seq}${history.length ? ` = **${symName(state, n)}**` : ''}`);
    }
  }

  const ctrls = h('div.w-controls.center',
    button(`Rotate ${step}° ⟲ (R)`, () => act('R'), { primary: true }),
    button('Flip ↔ (F)', () => act('F'), { primary: true }),
    button('Reset', () => { cancelAnimationFrame(anim); state = { k: 0, f: 0 }; history = []; render(); api.onChange(); }, { icon: icons.reset }));
  box.append(svg, readout, ctrls);
  render();

  return {
    destroy: () => cancelAnimationFrame(anim),
    ready: () => touched || spec.ready === true,
    check() {
      let r;
      if (spec.goal) r = spec.goal(state, history);
      else if (hasTarget) r = state.k === mod(spec.target.k, n) && state.f === spec.target.f;
      else return { ok: true };
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (hasTarget) {
        state = { k: mod(spec.target.k, n), f: spec.target.f };
        history = [];
        render();
      }
    },
  };
}
