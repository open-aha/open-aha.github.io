// Post correspondence puzzle: click dominoes to line them up until the top and bottom strings agree.
// spec: { dominoes: [['a', 'baa'], ['ab', 'aa'], …], solution: [indices], hint, maxLen: 40 }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

export function pcp(box, spec, api) {
  const D = spec.dominoes, maxLen = spec.maxLen || 40;
  const W = 600, tileW = Math.min(124, (W - 20) / D.length - 12), tileH = 92, H = tileH + 170;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Dominoes and the row built from them');
  const mono = 'font-family:var(--font-mono);font-weight:600';
  let seq = [], touched = false;

  // palette of dominoes
  const x0 = (W - D.length * (tileW + 12) + 12) / 2;
  D.forEach(([top, bot], i) => {
    const x = x0 + i * (tileW + 12), y = 10;
    const g = s('g', { class: 'handle', role: 'button', tabindex: 0, 'aria-label': `Domino ${i + 1}: ${top} over ${bot}`, style: 'cursor:pointer' });
    const fs = Math.min(24, (tileW - 16) / Math.max(top.length, bot.length) / 0.62);
    g.append(
      s('rect', { x, y, width: tileW, height: tileH, rx: 12, class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 }),
      s('line', { x1: x + 10, y1: y + tileH / 2, x2: x + tileW - 10, y2: y + tileH / 2, stroke: 'var(--line-2)', 'stroke-width': 2 }),
      s('text', { x: x + tileW / 2, y: y + tileH / 4 + fs / 3, 'text-anchor': 'middle', style: `${mono};font-size:max(calc(${fs}px * var(--fs, 1)), var(--fmin, 0px))`, fill: 'var(--blue)', text: top }),
      s('text', { x: x + tileW / 2, y: y + (3 * tileH) / 4 + fs / 3, 'text-anchor': 'middle', style: `${mono};font-size:max(calc(${fs}px * var(--fs, 1)), var(--fmin, 0px))`, fill: 'var(--coral)', text: bot }),
      s('text', { x: x + 12, y: y + 18, class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: String(i + 1) }),
    );
    const add = () => { if (strs().top.length + top.length > maxLen || strs().bot.length + bot.length > maxLen) return; seq.push(i); touched = true; render(); api.onChange(); };
    g.addEventListener('click', add);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(); } });
    svg.append(g);
  });

  const row = s('g');
  svg.append(row);
  const readout = h('div.w-readout');
  const undo = button('Undo', () => { seq.pop(); render(); api.onChange(); }, { icon: icons.left });
  const clear = button('Clear', () => { seq = []; render(); api.onChange(); }, { icon: icons.reset });
  box.append(svg, readout, h('div.w-controls.center', undo, clear));

  function strs() {
    return { top: seq.map((i) => D[i][0]).join(''), bot: seq.map((i) => D[i][1]).join('') };
  }
  function firstMismatch(a, b) {
    for (let k = 0; k < Math.min(a.length, b.length); k++) if (a[k] !== b[k]) return k;
    return -1;
  }
  function render() {
    const { top, bot } = strs();
    const n = Math.max(top.length, bot.length, 1);
    const cell = Math.min(30, (W - 20) / n), y = tileH + 40;
    const left = (W - n * cell) / 2, bad = firstMismatch(top, bot);
    const els = [];
    els.push(s('text', { x: W / 2, y: y - 12, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: seq.length ? `dominoes: ${seq.map((i) => i + 1).join(', ')}` : 'click the dominoes to build a row' }));
    const draw = (str, yy, col) => {
      for (let k = 0; k < str.length; k++) {
        const other = col === 'blue' ? bot : top;
        const cls = k >= other.length ? 'fl-card' : str[k] === other[k] ? 'fl-teal-soft' : 'fl-coral-soft';
        els.push(s('rect', { x: left + k * cell + 1, y: yy, width: cell - 2, height: 40, rx: 5, class: cls, stroke: k === bad ? 'var(--error)' : 'var(--line)', 'stroke-width': k === bad ? 2.5 : 1 }));
        els.push(s('text', { x: left + k * cell + cell / 2, y: yy + 27, 'text-anchor': 'middle', style: `${mono};font-size:max(calc(${Math.min(20, cell * 0.75)}px * var(--fs, 1)), var(--fmin, 0px))`, fill: `var(--${col})`, text: str[k] }));
      }
    };
    // domino boundaries along each row
    const marks = (lens, yy) => { let pos = 0; for (const L of lens) { pos += L; els.push(s('line', { x1: left + pos * cell, y1: yy - 3, x2: left + pos * cell, y2: yy + 43, stroke: 'var(--ink-3)', 'stroke-width': 1.5 })); } };
    draw(top, y, 'blue');
    draw(bot, y + 50, 'coral');
    marks(seq.map((i) => D[i][0].length), y);
    marks(seq.map((i) => D[i][1].length), y + 50);
    row.replaceChildren(...els);
    let msg;
    if (!seq.length) msg = 'Top and bottom must end up reading **exactly** the same.';
    else if (bad >= 0) msg = `Mismatch at letter ${bad + 1}: no dominoes added later can fix it. Undo.`;
    else if (top === bot) msg = `**Match!** Both rows read **${top}**.`;
    else msg = top.length > bot.length ? `So far so good: the top is ${top.length - bot.length} letter${top.length - bot.length > 1 ? 's' : ''} ahead.` : `So far so good: the bottom is ${bot.length - top.length} letter${bot.length - top.length > 1 ? 's' : ''} ahead.`;
    readout.innerHTML = mdi(msg);
    undo.disabled = !seq.length;
    clear.disabled = !seq.length;
  }
  render();
  return {
    ready: () => touched,
    check() {
      const { top, bot } = strs();
      if (seq.length && top === bot) return { ok: true };
      return { ok: false, msg: firstMismatch(top, bot) >= 0 ? 'The rows disagree somewhere. Undo back to where they last agreed.' : spec.hint || 'Keep adding dominoes until the two rows are identical.' };
    },
    reveal() {
      if (spec.solution) { seq = [...spec.solution]; render(); }
    },
  };
}
