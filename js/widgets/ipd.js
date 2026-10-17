// Repeated prisoner's dilemma against a chosen opponent strategy.
// Payoffs (you, them): both C = 3,3; you D they C = 5,0; you C they D = 0,5; both D = 1,1.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

const STRATS = {
  'Tit for Tat': (hist) => (hist.length ? hist[hist.length - 1][0] : 'C'),
  'Always Defect': () => 'D',
  'Always Cooperate': () => 'C',
  Grudger: (hist) => (hist.some(([me]) => me === 'D') ? 'D' : 'C'),
};
const PAY = { CC: [3, 3], DC: [5, 0], CD: [0, 5], DD: [1, 1] };

export function ipd(box, spec, api) {
  const rounds = spec.rounds || 10;
  let opp = spec.opponent || 'Tit for Tat';
  let hist = []; // [myMove, theirMove]
  const board = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '18px 16px 6px', justifyContent: 'center' } });
  const readout = h('div.w-readout');
  const oppRow = h('div.w-controls.center');
  const playRow = h('div.w-controls.center',
    button('Cooperate', () => play('C'), { primary: true }),
    button('Defect', () => play('D')),
    button('Restart', reset, { icon: icons.reset }));
  if (spec.choose !== false) {
    for (const name of Object.keys(STRATS)) {
      const b = button(name, () => { opp = name; reset(); });
      b.dataset.name = name;
      oppRow.append(b);
    }
  }
  box.append(board, readout, playRow);
  if (spec.choose !== false) box.append(h('div', { style: { textAlign: 'center', fontSize: '13px', color: 'var(--ink-3)', fontWeight: 700 } }, 'OPPONENT'), oppRow);

  function play(me) {
    if (hist.length >= rounds) return;
    const them = STRATS[opp](hist);
    hist.push([me, them]);
    draw();
    api.onChange();
  }
  function reset() {
    hist = [];
    draw();
    api.onChange();
  }
  function cell(m, who) {
    return h('div', { style: { width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '13px', color: '#fff', background: m === 'C' ? 'var(--success)' : 'var(--error)' }, title: `${who}: ${m === 'C' ? 'cooperate' : 'defect'}` }, m);
  }
  function draw() {
    board.replaceChildren(...hist.map(([a, b], i) => h('div', { style: { display: 'grid', gap: '4px', justifyItems: 'center' } }, h('span', { style: { fontSize: '10px', color: 'var(--ink-3)' } }, String(i + 1)), cell(a, 'You'), cell(b, opp))));
    let mine = 0, theirs = 0;
    hist.forEach(([a, b]) => { const [x, y] = PAY[a + b]; mine += x; theirs += y; });
    readout.innerHTML = mdi(`Round ${hist.length}/${rounds} vs **${opp}** · you **${mine}**, them **${theirs}**${hist.length >= rounds ? ' · game over' : ''}`);
    oppRow.querySelectorAll('button').forEach((b) => (b.style.borderColor = b.dataset.name === opp ? 'var(--select)' : ''));
  }
  draw();
  return { ready: () => hist.length >= (spec.needRounds || rounds), check: () => ({ ok: true }) };
}
