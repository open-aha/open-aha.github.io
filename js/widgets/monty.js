// The Monty Hall game, playable by hand or simulated in bulk.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { button } from './controls.js';

export function monty(box, spec, api) {
  const stats = { stay: { w: 0, n: 0 }, switch: { w: 0, n: 0 } };
  let car, pick, opened, stage; // stage: 'pick' | 'decide' | 'done'
  const wrap = h('div', { style: { padding: '18px 16px 4px' } });
  const doorsRow = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '420px', margin: '0 auto' } });
  const msg = h('div.w-readout', { style: { marginTop: '12px' } });
  const choiceRow = h('div.w-controls.center');
  const statsEl = h('div.w-readout');
  const bulk = h('div.w-controls.center',
    button('Simulate 100 × stay', () => simulate('stay', 100)),
    button('Simulate 100 × switch', () => simulate('switch', 100)));
  wrap.append(doorsRow, msg);
  box.append(wrap, choiceRow, statsEl, bulk);

  const doors = [0, 1, 2].map((i) => {
    const d = h('button.tcard', {
      type: 'button',
      style: { aspectRatio: '3 / 4', display: 'grid', placeItems: 'center', fontSize: '42px', fontWeight: '800', borderRadius: '14px' },
      'aria-label': `Door ${i + 1}`,
      onClick: () => choose(i),
    });
    doorsRow.append(d);
    return d;
  });

  function newGame() {
    car = Math.floor(Math.random() * 3);
    pick = opened = null;
    stage = 'pick';
    render();
  }

  function choose(i) {
    if (stage !== 'pick') return;
    pick = i;
    // host opens a goat door that isn't the pick
    const options = [0, 1, 2].filter((d) => d !== pick && d !== car);
    opened = options[Math.floor(Math.random() * options.length)];
    stage = 'decide';
    render();
  }

  function decide(strategy) {
    if (stage !== 'decide') return;
    if (strategy === 'switch') pick = [0, 1, 2].find((d) => d !== pick && d !== opened);
    const win = pick === car;
    stats[strategy].n++;
    if (win) stats[strategy].w++;
    stage = 'done';
    render(win, strategy);
    api.onChange();
  }

  function simulate(strategy, k) {
    for (let j = 0; j < k; j++) {
      const c = Math.floor(Math.random() * 3), p0 = Math.floor(Math.random() * 3);
      const win = strategy === 'stay' ? p0 === c : p0 !== c;
      stats[strategy].n++;
      if (win) stats[strategy].w++;
    }
    renderStats();
    api.onChange();
  }

  function render(win, strategy) {
    doors.forEach((d, i) => {
      const revealed = stage === 'done' || i === opened;
      d.textContent = revealed ? (i === car ? '🚗' : '🐐') : String(i + 1);
      d.style.borderColor = i === pick ? 'var(--select)' : '';
      d.style.background = revealed ? 'var(--surface)' : '';
      d.disabled = stage !== 'pick';
    });
    choiceRow.replaceChildren();
    if (stage === 'pick') msg.innerHTML = 'Pick a door.';
    if (stage === 'decide') {
      msg.innerHTML = `The host opens door ${opened + 1}: a goat! Stay with door ${pick + 1}, or switch?`;
      choiceRow.append(button('Stay', () => decide('stay')), button('Switch', () => decide('switch'), { primary: true }));
    }
    if (stage === 'done') {
      msg.innerHTML = win ? `You ${strategy === 'switch' ? 'switched' : 'stayed'} and won the car! 🎉` : `You ${strategy === 'switch' ? 'switched' : 'stayed'}… and got a goat.`;
      choiceRow.append(button('Play again', newGame, { primary: true }));
    }
    renderStats();
  }

  function renderStats() {
    const pct = (o) => (o.n ? `${Math.round((o.w / o.n) * 100)}%` : 'n/a');
    statsEl.innerHTML = mdi(`**Stay:** won ${stats.stay.w} of ${stats.stay.n} (${pct(stats.stay)}) &nbsp;&nbsp; **Switch:** won ${stats.switch.w} of ${stats.switch.n} (${pct(stats.switch)})`);
  }

  newGame();
  return {
    ready: () => stats.stay.n + stats.switch.n >= (spec.needGames || 1),
    check: () => ({ ok: true }),
  };
}
