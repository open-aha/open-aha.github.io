// Turing machine: a scrolling tape, a rule table, and Step / Run / Reset.
// spec: { rules: {State: {symbol: [write, move, next]}}, tape: '1011', head: 3 | (input) => index,
//         start: 'A', halt: ['H'], blank: '_', cells: 11, speed: 450,
//         edit: [[state, symbol, index]], symbols: ['0','1','_'], states: ['A','H'],
//         readout(m) → md, goal(rules) → bool | {ok,msg}, hint, solution: [[state, symbol, index, value]] }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';
import { makeTape, step as tmStep, withEdits } from './turing-core.js';

const MOVES = ['L', 'R', 'N'];
const MOVE_WORD = { L: 'left', R: 'right', N: 'stay' };

export function turing(box, spec, api) {
  const blank = spec.blank ?? '_';
  const halt = new Set(spec.halt ?? ['H']);
  const N = spec.cells || 11, cell = 46, gap = 6;
  const W = N * (cell + gap) + gap, H = 118;
  const editKeys = (spec.edit || []).map(([st, sym, i]) => `${st}|${sym}|${i}`);
  let rules = JSON.parse(JSON.stringify(spec.rules));
  let m, timer = null, touched = false;

  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Turing machine tape');
  if (spec.maxWidth) svg.style.maxWidth = spec.maxWidth + 'px';
  const cellEls = [];
  for (let i = 0; i < N; i++) {
    const x = gap + i * (cell + gap);
    const rect = s('rect', { x, y: 10, width: cell, height: cell, rx: 8, 'stroke-width': 2 });
    const t = s('text', { x: x + cell / 2, y: 10 + cell / 2 + 8, 'text-anchor': 'middle', class: 'bit-digit' });
    svg.append(rect, t);
    cellEls.push({ rect, t });
  }
  const cx = gap + Math.floor(N / 2) * (cell + gap) + cell / 2;
  svg.append(s('path', { d: `M${cx} ${10 + cell + 6} l-10 14 h20 Z`, class: 'fl-coral' }));
  const badge = s('rect', { x: cx - 34, y: 10 + cell + 22, width: 68, height: 28, rx: 14, class: 'fl-coral' });
  const badgeT = s('text', { x: cx, y: 10 + cell + 41, 'text-anchor': 'middle', class: 'lbl' });
  badgeT.style.fill = 'var(--card)';
  svg.append(badge, badgeT);

  const readout = h('div.w-readout');
  const table = h('table.tm-table');
  const stepBtn = button('Step', () => { stop(); advance(); }, { icon: icons.right });
  const runBtn = button('Run', () => (timer ? stop() : start()), { icon: icons.play });
  const resetBtn = button('Reset', () => { stop(); reset(); }, { icon: icons.reset });
  box.append(svg, readout, h('div.w-controls.center', stepBtn, runBtn, resetBtn), table);

  function reset() {
    const input = spec.tape ?? '';
    m = { tape: makeTape(input, blank), head: typeof spec.head === 'function' ? spec.head(input) : spec.head ?? 0, state: spec.start ?? 'A', steps: 0, stuck: false };
    render();
  }
  function done() {
    return halt.has(m.state) || m.stuck || m.steps >= (spec.maxSteps ?? 500);
  }
  function advance() {
    if (done()) return false;
    if (!tmStep(m, rules, blank)) m.stuck = true;
    render();
    return !done();
  }
  function start() {
    if (done()) reset();
    runBtn.innerHTML = icons.pause + '<span>Pause</span>';
    timer = setInterval(() => { if (!advance()) stop(); }, spec.speed ?? 450);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    runBtn.innerHTML = icons.play + '<span>Run</span>';
  }

  function cycle(st, sym, i) {
    const opts = i === 0 ? spec.symbols ?? ['0', '1', blank] : i === 1 ? MOVES.filter((mv) => spec.moves?.includes(mv) ?? mv !== 'N') : spec.states ?? [...Object.keys(rules), ...halt];
    const cur = opts.indexOf(rules[st][sym][i]);
    rules[st][sym][i] = opts[(cur + 1) % opts.length];
    touched = true;
    stop();
    reset();
    api.onChange();
  }

  function symLabel(v) {
    return v === '_' ? 'blank' : v;
  }

  function renderTable() {
    const sym = m.tape.get(m.head) ?? blank;
    table.replaceChildren(h('thead', h('tr', h('th', 'state'), h('th', 'reads'), h('th', 'write'), h('th', 'move'), h('th', 'next state'))));
    const body = h('tbody');
    for (const [st, row] of Object.entries(rules)) {
      for (const [rs, act] of Object.entries(row)) {
        const active = !done() && st === m.state && rs === sym;
        const cells = act.map((v, i) => {
          const label = i === 0 ? symLabel(v) : i === 1 ? MOVE_WORD[v] : halt.has(v) ? `${v} (halt)` : v;
          if (editKeys.includes(`${st}|${rs}|${i}`)) return h('td', h('button.tm-edit', { type: 'button', onClick: () => cycle(st, rs, i), 'aria-label': `Change: ${label}` }, label));
          return h('td', label);
        });
        body.append(h(`tr${active ? '.active' : ''}`, h('td', st), h('td', symLabel(rs)), ...cells));
      }
    }
    table.append(body);
  }

  function render() {
    const mid = Math.floor(N / 2);
    cellEls.forEach(({ rect, t }, i) => {
      const v = m.tape.get(m.head + i - mid) ?? blank;
      const isHead = i === mid;
      rect.setAttribute('class', isHead ? 'fl-amber-soft' : 'fl-card');
      rect.setAttribute('stroke', isHead ? 'var(--amber)' : 'var(--line-2)');
      t.textContent = v === '_' ? '' : v;
      t.style.fill = 'var(--ink)';
    });
    badgeT.textContent = halt.has(m.state) ? 'HALT' : m.state;
    badge.setAttribute('class', halt.has(m.state) ? 'fl-teal' : 'fl-coral');
    readout.innerHTML = mdi(spec.readout ? spec.readout(m) : `step **${m.steps}**${halt.has(m.state) ? ' · halted' : m.stuck ? ' · no rule applies: stopped' : ''}`);
    stepBtn.disabled = done();
    renderTable();
  }

  reset();

  return {
    ready: () => touched || !spec.goal || spec.ready === true,
    check() {
      if (!spec.goal) return { ok: true };
      const r = spec.goal(rules);
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
    reveal() {
      if (spec.solution) {
        stop();
        rules = withEdits(rules, spec.solution);
        reset();
      }
    },
    destroy: stop,
  };
}
