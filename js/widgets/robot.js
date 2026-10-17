// Program a robot on a grid: build a list of commands from a palette, then Run / Step / Reset.
// spec: { world: [rows] | worlds: [[rows], ...], program: [lines], palette: [commands], maxLines,
//         readonly, solution: [lines], hint, speed, maxMoves }
// Commands are the vocabulary of robot-core.js; 'repeat' in the palette inserts 'repeat 2' and the
// count on a repeat line cycles 2…9 when tapped. The goal: reach the flag with every gem collected,
// on every grid, within maxLines.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';
import { parseWorld, run, solves, lineCount } from './robot-core.js';

const CELL = 56;
const OPENERS = /^(repeat|while|if)/;

export function robot(box, spec, api) {
  const worlds = spec.worlds || [spec.world];
  let wi = 0;
  let program = [...(spec.program || [])];
  let cursor = program.length; // new lines go here
  let timer = null, frames = [], fi = 0, result = null, touched = false;
  let svg, robotG, gemEls = [], trail, W;
  let turnAcc = 0, lastD = 0;

  const tabs = worlds.length > 1 ? h('div.w-controls.center.rb-tabs') : null;
  const stage = h('div.rb-stage');
  const status = h('div.w-readout.rb-status');
  const progEl = h('ol.rb-prog', { 'aria-label': 'Program' });
  const palette = h('div.rb-palette');
  const runBtn = button('Run', () => (timer ? stop() : play()), { icon: icons.play, primary: true });
  const stepBtn = button('Step', () => { stop(); stepOnce(); }, { icon: icons.right });
  const resetBtn = button('Reset', () => { stop(); resetRobot(); }, { icon: icons.reset });
  const ctrls = h('div.w-controls.center', runBtn, stepBtn, resetBtn);
  const progWrap = h('div.rb-code', h('div.rb-code-head', h('span', 'Program'), h('span.rb-count')), progEl);
  if (tabs) box.append(tabs);
  box.append(stage, status, ctrls, progWrap);
  if (!spec.readonly) box.append(palette);

  function buildTabs() {
    if (!tabs) return;
    tabs.replaceChildren(...worlds.map((_, i) => {
      const b = button(`Grid ${i + 1}`, () => { stop(); wi = i; drawWorld(); resetRobot(); buildTabs(); });
      if (i === wi) b.classList.add('primary');
      return b;
    }));
  }

  function drawWorld() {
    W = parseWorld(worlds[wi]);
    const pad = 6;
    svg = svgRoot(W.w * CELL + 2 * pad, W.h * CELL + 2 * pad);
    svg.setAttribute('aria-label', 'Robot grid');
    svg.style.maxWidth = Math.min(560, (W.w * CELL + 2 * pad) * 0.92) + 'px';
    svg.style.margin = '0 auto';
    const X = (x) => pad + x * CELL, Y = (y) => pad + y * CELL;
    for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
      const wall = W.walls.has(`${x},${y}`);
      svg.append(s('rect', { x: X(x) + 1.5, y: Y(y) + 1.5, width: CELL - 3, height: CELL - 3, rx: 8, class: wall ? 'rb-wall' : 'rb-floor' }));
    }
    if (W.flag) {
      const [fx, fy] = W.flag;
      svg.append(s('g', { transform: `translate(${X(fx) + CELL / 2} ${Y(fy) + CELL / 2})` },
        s('circle', { r: 20, class: 'fl-teal-soft' }),
        s('path', { d: 'M-7 15 V-15', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }),
        s('path', { d: 'M-6 -15 L13 -8 L-6 -1 Z', class: 'fl-teal' })));
    }
    trail = s('path', { fill: 'none', stroke: 'var(--blue)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.3 });
    svg.append(trail);
    gemEls = W.gems.map(([gx, gy]) => {
      const g = s('path', { d: `M${X(gx) + CELL / 2} ${Y(gy) + CELL / 2 - 13} l11 13 l-11 13 l-11 -13 Z`, class: 'fl-amber rb-gem', stroke: 'var(--card)', 'stroke-width': 2 });
      svg.append(g);
      return g;
    });
    robotG = s('g', { class: 'rb-bot' },
      s('circle', { r: 19, class: 'fl-blue', stroke: 'var(--card)', 'stroke-width': 3 }),
      s('path', { d: 'M-6 -9 L10 0 L-6 9 Z', fill: 'var(--card)' }));
    svg.append(robotG);
    svg._X = X; svg._Y = Y;
    stage.replaceChildren(svg);
    turnAcc = W.start[2] * 90; lastD = W.start[2];
    placeRobot({ x: W.start[0], y: W.start[1], d: W.start[2], got: [] }, false);
  }

  function placeRobot(f, animate = true) {
    // keep the heading continuous so a left turn from east spins the short way round
    let dd = f.d - lastD;
    if (dd === 3) dd = -1;
    if (dd === -3) dd = 1;
    turnAcc += dd * 90;
    lastD = f.d;
    robotG.style.transition = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? `transform ${Math.min(240, (spec.speed ?? 340) - 60)}ms ease` : 'none';
    robotG.style.transform = `translate(${svg._X(f.x) + CELL / 2}px, ${svg._Y(f.y) + CELL / 2}px) rotate(${turnAcc}deg)`;
    gemEls.forEach((g, k) => g.classList.toggle('got', f.got.includes(k)));
  }

  function drawTrail(upto) {
    const pts = frames.slice(0, upto + 1).map((f) => `${svg._X(f.x) + CELL / 2} ${svg._Y(f.y) + CELL / 2}`);
    trail.setAttribute('d', pts.length > 1 ? 'M' + pts.join('L') : '');
  }

  function compute() {
    ({ frames, result } = run(worlds[wi], program, spec));
  }

  function resetRobot() {
    compute();
    fi = 0;
    turnAcc = W.start[2] * 90; lastD = W.start[2];
    placeRobot(frames[0], false);
    drawTrail(0);
    setActive(-1);
    status.innerHTML = mdi(lineCount(program) ? 'Press **Run** to watch the program, or **Step** to go one move at a time.' : 'Add commands to the program below, then press **Run**.');
    stepBtn.disabled = false;
  }

  function stepOnce() {
    if (fi >= frames.length - 1) { finish(); return false; }
    fi++;
    placeRobot(frames[fi]);
    drawTrail(fi);
    setActive(frames[fi].line);
    status.innerHTML = mdi(`line ${frames[fi].line + 1}: **${program[frames[fi].line]}**`);
    if (fi >= frames.length - 1) { finish(); return false; }
    return true;
  }

  function finish() {
    status.innerHTML = mdi((result.ok ? '✓ ' : '') + result.msg);
    status.classList.toggle('is-good', result.ok);
    if (result.line != null) setActive(result.line, true);
    stepBtn.disabled = true;
    stop();
  }

  function play() {
    if (fi >= frames.length - 1) resetRobot();
    status.classList.remove('is-good');
    runBtn.innerHTML = icons.pause + '<span>Pause</span>';
    timer = setInterval(() => { if (!stepOnce()) stop(); }, spec.speed ?? 340);
    if (frames.length <= 1) finish();
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    runBtn.innerHTML = icons.play + '<span>Run</span>';
  }

  function setActive(line, bad = false) {
    [...progEl.children].forEach((li, i) => {
      li.classList.toggle('active', i === line);
      li.classList.toggle('bad', bad && i === line && !result.ok);
    });
  }

  function edited() {
    touched = true;
    stop();
    status.classList.remove('is-good');
    renderProgram();
    resetRobot();
    api.onChange();
  }

  function renderProgram() {
    let depth = 0;
    const items = program.map((line, i) => {
      const t = line.trim();
      if (t === 'end' || t === 'else') depth = Math.max(0, depth - 1);
      const indent = depth;
      if (OPENERS.test(t) || t === 'else') depth++;
      const m = t.match(/^repeat (\d+)$/);
      const text = m && !spec.readonly
        ? h('span.rb-text', 'repeat ', h('button.tm-edit.rb-num', { type: 'button', 'aria-label': `Repeat count ${m[1]}: tap to change`, onClick: (e) => { e.stopPropagation(); program[i] = `repeat ${+m[1] >= 9 ? 2 : +m[1] + 1}`; edited(); } }, m[1]), ' times')
        : h('span.rb-text', m ? `repeat ${m[1]} times` : t);
      const li = h(`li.rb-line${i === cursor - 1 && !spec.readonly ? '.cursor' : ''}`, { style: { '--ind': indent } },
        h('span.rb-no', String(i + 1)), text);
      if (!spec.readonly) {
        li.addEventListener('click', () => { cursor = i + 1; renderProgram(); });
        li.append(h('button.rb-del', { type: 'button', 'aria-label': `Delete line ${i + 1}`, html: icons.x, onClick: (e) => { e.stopPropagation(); program.splice(i, 1); if (cursor > i) cursor--; edited(); } }));
      }
      return li;
    });
    if (!program.length) items.push(h('li.rb-empty', spec.readonly ? '(empty)' : 'Tap the commands below to build a program.'));
    progEl.replaceChildren(...items);
    const n = lineCount(program);
    progWrap.querySelector('.rb-count').textContent = spec.maxLines ? `${n} / ${spec.maxLines} lines` : `${n} line${n === 1 ? '' : 's'}`;
    progWrap.querySelector('.rb-count').classList.toggle('over', !!spec.maxLines && n > spec.maxLines);
    renderPalette();
  }

  function renderPalette() {
    if (spec.readonly) return;
    const full = spec.maxLines && lineCount(program) >= spec.maxLines + 4;
    palette.replaceChildren(
      ...(spec.palette || ['forward', 'turn left', 'turn right']).map((cmd) => {
        const label = cmd === 'repeat' ? 'repeat … times' : cmd;
        const b = h('button.rb-cmd', { type: 'button', disabled: full, onClick: () => { program.splice(cursor, 0, cmd === 'repeat' ? 'repeat 2' : cmd); cursor++; edited(); } }, label);
        if (OPENERS.test(cmd)) b.classList.add('block');
        if (cmd === 'end' || cmd === 'else') b.classList.add('closer');
        return b;
      }),
      h('span.rb-gap'),
      button('Undo', () => { if (!program.length) return; const k = Math.max(0, cursor - 1); program.splice(k, 1); cursor = k; edited(); }, { icon: icons.left }),
      button('Clear', () => { program = []; cursor = 0; edited(); }, { icon: icons.reset }),
    );
  }

  buildTabs();
  drawWorld();
  renderProgram();
  resetRobot();

  return {
    ready: () => touched || spec.readonly || spec.ready === true,
    check() {
      const r = solves(spec, program);
      if (!r.ok) {
        if (r.world != null && r.world !== wi) { wi = r.world; buildTabs(); drawWorld(); }
        resetRobot();
        if (frames.length > 1) play();
        return { ok: false, msg: r.msg + (spec.hint ? ' ' + spec.hint : '') };
      }
      return { ok: true };
    },
    reveal() {
      if (!spec.solution) return;
      stop();
      program = [...spec.solution];
      cursor = program.length;
      wi = 0;
      buildTabs();
      drawWorld();
      renderProgram();
      resetRobot();
      play();
    },
    retry() { stop(); resetRobot(); },
    destroy: stop,
  };
}
