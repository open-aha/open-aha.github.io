import { codeBlock } from '../lib/code.js';
import { fix } from '../lib/svg.js';

const r = String.raw;
// inline code inside String.raw templates (a literal backtick would end the template)
const c = (t) => '`' + t + '`';

// ---------- static pictures of the robot's grid ----------
const DIRS = { '>': 0, v: 90, '<': 180, '^': 270 };
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
// rows: robot world strings; marks: [[x, y, 'A']]; path: [[x, y], ...] drawn dotted
function gridFig(rows, { marks = [], path = null, label = 'Robot grid', cell = 56 } = {}) {
  const w = Math.max(...rows.map((row) => row.length)), ht = rows.length, pad = 6;
  return {
    kind: 'figure', w: w * cell + 2 * pad, h: ht * cell + 2 * pad, maxWidth: Math.min(520, w * cell * 0.92), label,
    draw: ({ s }) => {
      const X = (x) => pad + x * cell + cell / 2, Y = (y) => pad + y * cell + cell / 2;
      const els = [];
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        els.push(s('rect', { x: X(x) - cell / 2 + 1.5, y: Y(y) - cell / 2 + 1.5, width: cell - 3, height: cell - 3, rx: 8, class: ch === '#' ? 'rb-wall' : 'rb-floor' }));
      }));
      if (path) els.push(s('path', { d: 'M' + path.map(([x, y]) => `${X(x)} ${Y(y)}`).join('L'), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 4, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }));
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === 'F') els.push(s('g', { transform: `translate(${X(x)} ${Y(y)})` }, s('circle', { r: 20, class: 'fl-teal-soft' }), s('path', { d: 'M-7 15 V-15', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }), s('path', { d: 'M-6 -15 L13 -8 L-6 -1 Z', class: 'fl-teal' })));
        if (ch === '*') els.push(s('path', { d: `M${X(x)} ${Y(y) - 13} l11 13 l-11 13 l-11 -13 Z`, class: 'fl-amber', stroke: 'var(--card)', 'stroke-width': 2 }));
        if (ch in DIRS) els.push(s('g', { transform: `translate(${X(x)} ${Y(y)}) rotate(${DIRS[ch]})` }, s('circle', { r: 19, class: 'fl-blue', stroke: 'var(--card)', 'stroke-width': 3 }), s('path', { d: 'M-6 -9 L10 0 L-6 9 Z', fill: 'var(--card)' })));
      }));
      for (const [x, y, t] of marks) {
        els.push(s('circle', { cx: X(x), cy: Y(y), r: 16, class: 'fl-violet' }));
        els.push(s('text', { x: X(x), y: Y(y) + 6, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--card);${FS(17)}`, text: t }));
      }
      return els;
    },
  };
}

// ---------- turtle drawings (graph widget) ----------
// repeat n: forward 1, turn left a degrees. Returns the points, scaled and centred to fit the view.
function turtlePts(n, a, { copies = 1, spin = 0, poly = null } = {}) {
  const pts = [[0, 0]];
  let x = 0, y = 0, hd = 0;
  for (let c = 0; c < copies; c++) {
    const sides = poly ? poly[0] : n, turn = poly ? poly[1] : a;
    for (let i = 0; i < sides; i++) {
      x += Math.cos((hd * Math.PI) / 180); y += Math.sin((hd * Math.PI) / 180);
      pts.push([x, y]);
      hd += turn;
    }
    hd += spin;
  }
  return pts;
}
function fitPts(pts, W = 5.6, H = 4.4) {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(W / Math.max(x1 - x0, 1e-6), H / Math.max(y1 - y0, 1e-6), 6);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { pts: pts.map(([x, y]) => [(x - cx) * k, (y - cy) * k]), k };
}
const closes = (pts) => Math.hypot(pts[pts.length - 1][0] - pts[0][0], pts[pts.length - 1][1] - pts[0][1]) < 1e-6;
function turtleDraw({ plot, s }, raw, heading) {
  const { pts } = fitPts(raw);
  const P = (q) => `${plot.X(q[0]).toFixed(1)} ${plot.Y(q[1]).toFixed(1)}`;
  const [ex, ey] = pts[pts.length - 1];
  const rot = -heading;
  return [
    s('path', { d: 'M' + pts.map(P).join('L'), fill: closes(raw) ? 'var(--teal-soft)' : 'none', 'fill-rule': 'evenodd', stroke: 'var(--teal)', 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
    s('circle', { cx: plot.X(pts[0][0]), cy: plot.Y(pts[0][1]), r: 6, class: 'fl-ink' }),
    s('g', { transform: `translate(${plot.X(ex).toFixed(1)} ${plot.Y(ey).toFixed(1)}) rotate(${rot})` }, s('circle', { r: 13, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 3 }), s('path', { d: 'M-4 -6 L8 0 L-4 6 Z', fill: 'var(--card)' })),
  ];
}
const gapTo = (raw) => Math.hypot(raw[raw.length - 1][0], raw[raw.length - 1][1]);
function turtleSpec({ n = 4, a = 90, nRange = [1, 12], aRange = [0, 180], showN = true, showA = true, goal, solution, hint, height }) {
  const params = {
    n: { min: nRange[0], max: nRange[1], step: 1, value: n, label: 'repeats', color: 'violet', slider: showN },
    a: { min: aRange[0], max: aRange[1], step: 1, value: a, label: 'turn', color: 'coral', format: (v) => `${v}°`, slider: showA },
  };
  return {
    kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -2.6, ymax: 2.6, grid: false, axes: false, maxWidth: 460, clipExtra: true, height,
    params,
    extra: (ctx) => turtleDraw(ctx, turtlePts(ctx.p.n, ctx.p.a), ctx.p.n * ctx.p.a),
    readout: (p) => {
      const raw = turtlePts(p.n, p.a);
      return `total turning: ${p.n} × ${p.a}° = **${p.n * p.a}°** · ${closes(raw) ? 'the path **closes**' : `ends ${fix(gapTo(raw), 2)} steps from the start`}`;
    },
    goal, solution, hint,
  };
}

// ---------- robot worlds ----------
const W_DEMO = ['>..###', '##.###', '##...F'];
const W_PREDICT = ['.....', '.....', '.....', '.....', '^....'];
const W_FIRST = ['>...#', '###.#', '###.F'];
const W_DOWN = ['v####', '.####', '..*.F'];
const W_ORDER = ['###F', '....', '.###', '^###'];
const W_STAIRS13 = ['>*###', '#.*##', '##.*#', '###.F'];
const W_FIX1 = ['v###', '.###', '...F'];
const W_EXTRA = ['..F..', '.....', '>....'];
const W_LATE = ['>...#', '#.#.#', '#.#F#'];
const W_TWO = ['>.###', '#.###', '#.*.F'];
const W_MOVED = ['>*.##', '##.##', '##*.F'];
const W_HALL = ['>.......F'];
const W_STEPS = ['####F', '###*.', '##*.#', '#*.##', '>.###'];
const W_RING = ['>.*..', '####.', '####*', '####.', 'F.*..'];
const W_ZIG = ['>.*####', '##..*##', '####..*', '######F'];
const W_UP = ['##F##', '##.##', '>..##', '#####', '#####'];
const W_DN = ['#####', '#####', '>..##', '##.##', '##F##'];
const W_HALL5 = ['>....F'];
const W_HALL3 = ['>..F##'];
const W_WIND1 = ['#####', '##..F', '##.##', '>..##'];
const W_WIND2 = ['>..##', '##.##', '##..F'];
const W_MAZE1 = ['>......', '######.', '.....#.', '.#.###.', '.#.#...', '.#.#.##', '.#....F'];
const W_MAZE2 = ['>....#.', '####.#.', '...#...', '.#####.', '...#...', '.#.#.##', '.#....F'];
const W_ISLAND = ['.......', '.#####.', '.#...#.', '.#.F.#.', '.#...#.', '.##.##.', '>......'];
const W_LONG = ['>#.....', '.###.##', '...#...', '##.###.', '.#.....', '.#####.', '......F'];

const FOLLOW = ['while not at flag', 'if path ahead', 'forward', 'else', 'if path left', 'turn left', 'else', 'turn right', 'end', 'end', 'end'];
const LEFT_HAND = ['while not at flag', 'if path left', 'turn left', 'forward', 'else', 'if path ahead', 'forward', 'else', 'turn right', 'end', 'end', 'end'];
const RIGHT_HAND = ['while not at flag', 'if path right', 'turn right', 'forward', 'else', 'if path ahead', 'forward', 'else', 'turn left', 'end', 'end', 'end'];
const MOVES = ['forward', 'turn left', 'turn right'];

export default {
  id: 'coding',
  subject: 'math',
  title: 'Thinking in Code',
  level: 'Foundational',
  cover: 'coding',
  tagline: 'Program a robot and a drawing turtle: sequences, loops, decisions, variables and functions.',
  description: r`Computers do exactly what they're told, one instruction at a time. Learn to think like a programmer: write step-by-step instructions for a robot, hunt down bugs, shrink long programs with loops, let the robot decide for itself with "if" and "while", draw stars with a turtle, and trace real code line by line as its variables change.`,
  chapters: [
    {
      title: 'Instructions',
      summary: 'Sequences and bugs.',
      lessons: [
        {
          id: 'sequence',
          title: 'Step by Step',
          summary: 'Programs are exact instructions',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A robot that does what it’s told',
              body: r`A **program** is a list of instructions that a computer follows exactly, in order, one at a time. It never guesses what you meant.

This robot understands three instructions: **forward** (move one square the way it faces), **turn left** and **turn right** (turn on the spot by a quarter turn). Press **Run** to watch it follow the program, or **Step** to go one instruction at a time.`,
              widget: { kind: 'robot', world: W_DEMO, readonly: true, program: ['forward', 'forward', 'turn right', 'forward', 'forward', 'turn left', 'forward', 'forward', 'forward'] },
              after: r`Nine instructions, followed in order from the top. The highlighted line is the one being carried out. Turning doesn't move the robot; it only changes which way **forward** will go.`,
            },
            {
              type: 'mcq',
              title: 'Where does it end up?',
              body: r`The robot starts in the bottom-left corner, facing up. It runs this program:

${codeBlock(['forward', 'forward', 'turn right', 'forward', 'forward', 'forward', 'turn right', 'forward'])}`,
              widget: gridFig(W_PREDICT, { marks: [[3, 3, 'A'], [3, 1, 'B'], [2, 3, 'C'], [3, 2, 'D']] }),
              prompt: 'Which square does the robot finish on?',
              choices: [
                { t: 'A', ok: true },
                { t: 'B', why: 'After the second right turn the robot faces down, not up: two right turns from "up" make it face the opposite way.' },
                { t: 'C', why: 'Count the forwards after the first turn: there are three, so the robot reaches the fourth column.' },
                { t: 'D', why: 'That’s where the robot is before the last line. The final **forward** moves it one more square.' },
              ],
              explain: r`Up two squares, then turn right (now facing right) and go three squares, then turn right again (now facing down) and go one square: square **A**. The trick when reading a program is to keep track of two things at every line: where the robot is, and which way it faces.`,
            },
            {
              type: 'interactive',
              title: 'Your first program',
              prompt: r`Build a program that takes the robot to the flag. Tap the commands to add them; tap a line to insert after it, or ✕ to delete it. Then press **Check**.`,
              widget: { kind: 'robot', world: W_FIRST, palette: MOVES, solution: ['forward', 'forward', 'forward', 'turn right', 'forward', 'forward', 'turn left', 'forward'], hint: 'Go right three squares, then down two, then right one.' },
              explain: r`One solution: **forward** ×3, **turn right**, **forward** ×2, **turn left**, **forward**. Eight instructions. Run it before you check: testing your own program is half of programming.`,
            },
            {
              type: 'explain',
              title: 'Left is the robot’s left',
              body: r`**Turn left** means the robot's own left, not the left of your screen. When the robot faces **down** the screen, its left is the screen's **right**, just as when someone walks towards you, their left hand is on your right.

Programmers call this a **relative** instruction: what it does depends on the robot's current state. A good habit is to imagine you *are* the robot, facing the way it faces, and turn your head with it.`,
              widget: gridFig(['.v.', '...'], { marks: [[2, 0, 'L'], [0, 0, 'R']], label: 'A robot facing down, with its left and right marked' }),
              after: r`The robot faces down, so its left (**L**) is on the screen's right and its right (**R**) is on the screen's left.`,
            },
            {
              type: 'mcq',
              title: 'Facing you',
              prompt: r`The robot faces **down** the screen. It runs **turn left**, then **forward**. Which way does it move on the screen?`,
              choices: [
                { t: 'Right', ok: true },
                { t: 'Left', why: 'That’s the screen’s left. Facing down, the robot’s left is the screen’s right.' },
                { t: 'Up', why: 'A single quarter turn from facing down points sideways, not up.' },
                { t: 'Down', why: 'Turning changes the direction, so the robot no longer faces down.' },
              ],
              explain: r`Turning left from "down" (a quarter turn anticlockwise as you look at the screen, as every left turn is when seen from above) points it to the **right** of the screen. Up → left → down → right → up is the cycle of left turns as seen on screen.`,
            },
            {
              type: 'interactive',
              title: 'Collect the gem',
              prompt: r`This robot starts facing **down**. Get it to the flag, picking up the gem on the way (it collects a gem by moving onto it).`,
              widget: { kind: 'robot', world: W_DOWN, palette: MOVES, solution: ['forward', 'forward', 'turn left', 'forward', 'forward', 'forward', 'forward'], hint: 'Down two squares first. Which turn makes a down-facing robot head right?' },
              explain: r`**forward** ×2, **turn left** (facing down, its left is the screen's right), then **forward** ×4, collecting the gem on the way.`,
            },
            {
              type: 'order',
              title: 'Unscramble the program',
              body: r`Here the robot understands bigger instructions, such as "move 2 forward". The robot starts at the bottom, facing up.`,
              widget: gridFig(W_ORDER),
              prompt: 'Put the instructions in order so the robot reaches the flag.',
              items: ['move 2 forward', 'turn right', 'move 3 forward', 'turn left', 'move 1 forward'],
              explain: r`Up 2 to the corridor, turn right, along 3, turn left (now facing up), and up 1 to the flag. Any other order walks into a wall: in a program, **order matters** as much as the instructions themselves.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'A long staircase',
              prompt: r`Guide the robot down the staircase to the flag, collecting all three gems.`,
              widget: { kind: 'robot', world: W_STAIRS13, palette: MOVES, solution: ['forward', 'turn right', 'forward', 'turn left', 'forward', 'turn right', 'forward', 'turn left', 'forward', 'turn right', 'forward', 'turn left', 'forward'], hint: 'Each stair is the same four moves: forward, turn right, forward, turn left.' },
              explain: r`It takes 13 instructions, and the same four (**forward**, **turn right**, **forward**, **turn left**) repeat three times before the final **forward**. Writing the same thing over and over is tedious and easy to get wrong. Two lessons from now, **loops** will shrink this program to a handful of lines.`,
            },
          ],
          recap: [
            'A program is a list of exact instructions, carried out in order.',
            'Track the robot’s position and direction at every line.',
            '“Left” and “right” are relative to the way the robot faces.',
          ],
        },
        {
          id: 'bugs',
          title: 'Finding Bugs',
          summary: 'Debugging like a detective',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Bugs',
              body: r`A **bug** is a mistake in a program: it does something other than what its author intended. Engineers called faults "bugs" long before computers, and in 1947 operators of the Harvard Mark II computer famously taped a real moth, found jammed in a relay, into their logbook as the "first actual case of bug being found".

Bugs are normal. Every programmer writes them, and much of programming is **debugging**: finding and fixing them. The computer is never wrong about what your program says; the bug is always in the gap between what you *wrote* and what you *meant*.`,
            },
            {
              type: 'interactive',
              title: 'Fix the turn',
              prompt: r`This program was meant to take the robot to the flag, but something's wrong. Run it, find the bug, and fix it. (Tap a line to choose where new commands go; ✕ deletes a line.)`,
              widget: { kind: 'robot', world: W_FIX1, palette: MOVES, program: ['forward', 'forward', 'turn right', 'forward', 'forward', 'forward'], solution: ['forward', 'forward', 'turn left', 'forward', 'forward', 'forward'], maxLines: 6, hint: 'Which way does a robot facing down need to turn to head right?' },
              explain: r`Line 3 should be **turn left**: facing down, the robot's left is the screen's right. The author probably thought of the screen's right instead of the robot's. Many bugs come from exactly this kind of mismatch between two points of view.`,
            },
            {
              type: 'mcq',
              title: 'One square too far',
              body: r`This program should take the robot to the flag, but the robot ends one square to the **right** of it.

${codeBlock(['forward', 'forward', 'forward', 'turn left', 'forward', 'forward'])}`,
              widget: gridFig(W_EXTRA),
              prompt: 'What is the fix?',
              choices: [
                { t: 'Delete one of the first three **forward** lines', ok: true },
                { t: 'Change **turn left** to **turn right**', why: 'Turning right from facing right points the robot down, off the bottom of the grid.' },
                { t: 'Delete the last **forward**', why: 'Then the robot would stop one square below where it ends now: still one column too far right.' },
                { t: 'Add **turn left** and **forward** at the end', why: 'That patches the symptom with extra moves. The real mistake is earlier: the robot turns one square too late.' },
              ],
              explain: r`The robot walks three squares before turning, so it turns up one column too late. Removing one early **forward** fixes the cause. Patching a bug at the end ("just add a move back") often works for this grid but leaves the real mistake in place, ready to bite later.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The crash isn’t the bug',
              body: r`This program should go right three squares and then down two to the flag. Press **Step** repeatedly and compare what the robot does with what it *should* do at each line.`,
              widget: { kind: 'robot', world: W_LATE, readonly: true, program: ['forward', 'turn right', 'forward', 'forward', 'forward', 'forward'] },
              after: r`The robot crashes on line 5, but nothing is wrong with line 5: **forward** is exactly right there in the intended program. The mistake happened earlier, when the robot turned too soon, and only *showed up* later. When you debug, look for the **first** line where reality and intention part ways.`,
            },
            {
              type: 'mcq',
              title: 'Where’s the bug?',
              body: r`In the program you just stepped through, the robot crashes into the bottom edge on line 5.`,
              prompt: 'Which line is the real bug?',
              choices: [
                { t: 'Line 2: the turn comes too early', ok: true },
                { t: 'Line 5: the forward that crashes', why: 'Line 5 is a perfectly good **forward**; the robot is just in the wrong place by then.' },
                { t: 'Line 1: the first forward', why: 'Line 1 does exactly what the plan says: one step right.' },
                { t: 'Line 6: the last forward', why: 'Line 6 never even runs: the robot stops when it crashes.' },
              ],
              explain: r`Line 2 turns after one square instead of three. The intended program is **forward** ×3, **turn right**, **forward** ×2: the same instructions in a different order. Errors that surface far from their cause are what make debugging feel like detective work.`,
            },
            {
              type: 'interactive',
              title: 'Two bugs',
              prompt: r`This program has **two** bugs. Fix them so the robot collects the gem and reaches the flag, using at most 8 lines.`,
              widget: { kind: 'robot', world: W_TWO, palette: MOVES, program: ['forward', 'turn right', 'forward', 'turn right', 'forward', 'forward', 'forward'], solution: ['forward', 'turn right', 'forward', 'forward', 'turn left', 'forward', 'forward', 'forward'], maxLines: 8, hint: 'Step through it. The robot should go down two squares, not one, and then head right.' },
              explain: r`It needs a second **forward** after the first turn (to reach the bottom row), and the second turn should be **turn left** (facing down, left is the screen's right). Fix one bug at a time and re-run after each fix: two bugs at once are much more confusing than one.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'One line out of place',
              prompt: r`Every instruction this program needs is already here, but one line is in the wrong place. Fix it without adding lines (at most 8).`,
              widget: { kind: 'robot', world: W_MOVED, palette: MOVES, program: ['forward', 'forward', 'turn right', 'forward', 'turn left', 'forward', 'forward', 'forward'], solution: ['forward', 'forward', 'turn right', 'forward', 'forward', 'turn left', 'forward', 'forward'], maxLines: 8, hint: 'The robot needs to reach the bottom row before turning left. Delete the early turn and add it back further down.' },
              explain: r`The **turn left** on line 5 comes one **forward** too early. Move it down one place: **forward** ×2, **turn right**, **forward** ×2, **turn left**, **forward** ×2. Small bugs like a misplaced line are the most common kind, and stepping through is the fastest way to find them.`,
            },
          ],
          recap: [
            'A bug is a gap between what a program says and what its author meant.',
            'The line where things go wrong visibly is often not the bug.',
            'Step through, compare with your intention, and fix one bug at a time.',
          ],
        },
      ],
    },
    {
      title: 'Loops',
      summary: 'Saying it once.',
      lessons: [
        {
          id: 'loops',
          title: 'Repeat Yourself',
          summary: 'Loops shrink programs',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Loops',
              body: r`The staircase program used the same four instructions three times. A **loop** says "do this several times" once:

${codeBlock(['repeat 3 times', '  forward', '  turn right', '  forward', '  turn left', 'end', 'forward'])}

The indented lines between **repeat** and **end** are the loop's **body**. The robot runs the body 3 times, then carries on after **end**. That's 7 lines instead of 13, and if the staircase had 100 steps, we'd only change the 3 to 100.`,
            },
            {
              type: 'interactive',
              title: 'A long corridor',
              prompt: r`Get the robot to the end of the corridor using **at most 3 lines**. (Tap the number on a **repeat** line to change it.)`,
              widget: { kind: 'robot', world: W_HALL, palette: ['forward', 'repeat', 'end'], maxLines: 3, solution: ['repeat 8', 'forward', 'end'], hint: 'Count the squares between the robot and the flag.' },
              explain: r`**repeat 8 times**, **forward**, **end**. The flag is 8 squares away. Getting the count exactly right is a classic source of bugs: one too few or one too many is so common it has a name, the **off-by-one error**.`,
            },
            {
              type: 'interactive',
              title: 'Climbing the stairs',
              prompt: r`Collect every gem on the way up to the flag, in **at most 6 lines**.`,
              widget: { kind: 'robot', world: W_STEPS, palette: ['forward', 'turn left', 'turn right', 'repeat', 'end'], maxLines: 6, solution: ['repeat 4', 'forward', 'turn left', 'forward', 'turn right', 'end'], hint: 'Find the moves for one stair (right one square, then up one square), and repeat them.' },
              explain: r`One stair is **forward**, **turn left**, **forward**, **turn right**, and there are 4 stairs. Spotting the repeating pattern is the real work; once you see it, the loop writes itself.`,
            },
            {
              type: 'numeric',
              title: 'Counting moves',
              body: r`${codeBlock(['repeat 3 times', '  forward', '  repeat 2 times', '    turn right', '  end', 'end'])}`,
              prompt: r`How many moves (forwards and turns) does the robot make?`,
              answer: 9,
              wrong: [{ v: 5, why: 'The inner loop runs completely every time the outer body runs: 2 turns each time, 3 times.' }, { v: 6, why: 'Each run of the outer body makes 1 forward and 2 turns: 3 moves, done 3 times.' }],
              explain: r`Each time round the outer loop: 1 forward + 2 turns = 3 moves. The outer loop runs 3 times: $3 \times 3 = 9$ moves. (Two right turns make a U-turn, so the robot walks forward and back, forward and back, forward and back.) A loop inside a loop is a **nested loop**.`,
            },
            {
              type: 'numeric',
              title: 'Loops inside loops',
              body: r`${codeBlock(['repeat 4 times', '  repeat 5 times', '    forward', '  end', '  turn right', 'end'])}`,
              prompt: r`How many times does the robot move **forward**?`,
              answer: 20,
              wrong: [{ v: 9, why: 'The counts multiply, not add: the inner loop of 5 runs once for each of the 4 outer repeats.' }, { v: 24, why: 'That counts the turns too. Only the forwards: 5 per outer repeat.' }],
              explain: r`$4 \times 5 = 20$ forwards (and 4 turns): the robot walks around a square with sides of 5. Nested loops multiply, which is why a few lines of code can make a computer do millions of things.`,
            },
            {
              type: 'interactive',
              title: 'Around the block',
              prompt: r`Collect all three gems and reach the flag in **at most 6 lines**. You'll need a loop inside a loop.`,
              widget: { kind: 'robot', world: W_RING, palette: ['forward', 'turn left', 'turn right', 'repeat', 'end'], maxLines: 6, solution: ['repeat 3', 'repeat 4', 'forward', 'end', 'turn right', 'end'], hint: 'Each side is 4 forwards followed by a right turn, and there are three sides.' },
              explain: r`**repeat 3** { **repeat 4** { **forward** }, **turn right** }. The inner loop walks one side; the outer loop does three sides. (The last right turn leaves the robot facing up on the flag, which is fine.)`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'The long zigzag',
              prompt: r`Collect all the gems and reach the flag in **at most 7 lines**.`,
              widget: { kind: 'robot', world: W_ZIG, palette: ['forward', 'turn left', 'turn right', 'repeat', 'end'], maxLines: 7, solution: ['repeat 3', 'forward', 'forward', 'turn right', 'forward', 'turn left', 'end'], hint: 'One step of this staircase is two squares across and one down.' },
              explain: r`Each step is **forward**, **forward**, **turn right**, **forward**, **turn left**, and there are three of them: 7 lines with the loop, against 15 without. Loops make programs shorter, but more importantly they make them say what you *mean*: "do this step three times".`,
            },
          ],
          recap: [
            'A loop runs its body a fixed number of times.',
            'Nested loops multiply: 4 repeats of 5 repeats is 20.',
            'Find the repeating pattern first, then wrap it in a loop.',
          ],
        },
        {
          id: 'turtle',
          title: 'Turtle Geometry',
          summary: 'Drawing shapes with loops',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A drawing turtle',
              body: r`In the 1960s, Seymour Papert and colleagues created the language **Logo**, in which children programmed a "turtle" that draws as it walks. The program here is:

${codeBlock(['repeat N times', '  forward 1', '  turn left A degrees'])}

The black dot is where the turtle started; the coral turtle shows where it stops. Change the number of repeats and the turning angle.`,
              widget: turtleSpec({ n: 4, a: 90 }),
              after: r`With 4 repeats of a 90° turn you get a square. Most other settings give paths that don't close up, but some give polygons, stars and spirals. (The drawing is resized to fit, so all sides look the same length whatever the shape.)`,
            },
            {
              type: 'interactive',
              title: 'A hexagon',
              prompt: r`The turtle repeats 6 times. Choose the turn so that it draws a regular hexagon (six equal sides and angles, closing up).`,
              widget: turtleSpec({ n: 6, a: 45, showN: false, goal: (p) => p.a === 60, solution: { a: 60 }, hint: 'After 6 turns the turtle should face the way it started: one full turn in total.' }),
              explain: r`$360° \div 6 = 60°$. To come back to the start facing the same way, the turtle must turn through one full circle, $360°$, in total, shared equally among the 6 corners.`,
            },
            {
              type: 'numeric',
              title: 'Nine sides',
              prompt: r`What turning angle makes the turtle draw a regular 9-sided shape (a nonagon) with 9 repeats?`,
              unit: '°',
              answer: 40,
              wrong: [{ v: 140, why: 'That’s the angle inside each corner of the shape. The turtle turns through the outside angle: 180° − 140°.' }, { v: 9, why: 'Share the full turn of 360° among 9 corners.' }],
              explain: r`$360° \div 9 = 40°$. Notice the turtle turns through the **exterior** angle. The interior angle of the nonagon is $180° - 40° = 140°$.`,
            },
            {
              type: 'explain',
              title: 'The total turning theorem',
              body: r`Whenever the turtle walks around a closed shape that doesn't cross itself and comes back facing the way it started, it has turned through **exactly 360°** in total. That's the **total turning theorem**, and it's why the exterior angles of any simple polygon (regular or not) add up to $360°$.

For a regular polygon with $n$ sides, each turn is $\dfrac{360°}{n}$, and each interior angle is $180° - \dfrac{360°}{n}$. Thinking like the turtle turns geometry facts into something you can feel by walking.`,
            },
            { /*anim:coding*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Counting the turns',
              body: r`Watch the turtle draw, and keep an eye on the dial: it adds up every turn the turtle makes, winding further out each time the total passes a full circle. Try the stars.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 3.35, ymin: -1.2, ymax: 1.2, grid: false, axes: false,
                animate: { param: 't', speed: 1.6, autoplay: true },
                params: { sh: { min: 0, max: 3, step: 1, value: 1, label: 'shape', color: 'violet', format: (v) => ['pentagon (turn 72.0°)', '5-pointed star (turn 144.0°)', '7-pointed star (turn 154.3°)', '8-pointed star (turn 135.0°)'][v] } },
                extra: ({ plot, p, s }) => {
                  const [n, k] = [[5, 1], [5, 2], [7, 3], [8, 3]][p.sh], beta = (2 * Math.PI * k) / n, R = 1, phi0 = Math.PI / 2;
                  const V = (j) => [R * Math.cos(phi0 + j * beta), R * Math.sin(phi0 + j * beta)];
                  const cyc = n * 1.5 + 2, tt = p.t % cyc;
                  const seg = Math.min(n, Math.floor(tt / 1.5)), u = tt - seg * 1.5;
                  const els = [];
                  // path so far
                  const pts = [V(0)];
                  for (let j = 1; j <= seg; j++) pts.push(V(j));
                  let pos = V(seg), turned = seg * beta;
                  if (seg < n) {
                    const a = Math.min(1, u), [x0, y0] = V(seg), [x1, y1] = V(seg + 1);
                    pos = [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a];
                    pts.push(pos);
                    if (u > 1) turned += beta * Math.min(1, (u - 1) / 0.5);
                  }
                  els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                  const head = phi0 + beta / 2 + Math.PI / 2 + turned;
                  const tri = [[16, 0], [-9, 9], [-9, -9]].map(([a, b]) => [plot.X(pos[0]) + a * Math.cos(head) + b * Math.sin(head), plot.Y(pos[1]) - (a * Math.sin(head) - b * Math.cos(head))]);
                  els.push(s('path', { d: tri.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z', class: 'fl-teal', stroke: 'var(--card)', 'stroke-width': 2 }));
                  // the dial: a spiral whose angle is the total turning, one ring per full turn
                  const cx = 2.35, cy = 0.05, h0 = phi0 + beta / 2 + Math.PI / 2;
                  els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: plot.X(0.85) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
                  const sp = [];
                  for (let i = 0; i <= 160; i++) { const a = (turned * i) / 160, rr = 0.3 + 0.13 * (a / (2 * Math.PI)); sp.push([cx + rr * Math.cos(h0 + a), cy + rr * Math.sin(h0 + a)]); }
                  if (turned > 0.01) els.push(s('path', { d: sp.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
                  const tip = sp[sp.length - 1];
                  els.push(s('line', { x1: plot.X(cx), y1: plot.Y(cy), x2: plot.X(tip[0]), y2: plot.Y(tip[1]), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(s('text', { x: plot.X(cx), y: plot.Y(-1.12), 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--teal)', text: `turned ${Math.round((turned * 180) / Math.PI)}°` }));
                  return els;
                },
                readout: (p) => { const [n, k] = [[5, 1], [5, 2], [7, 3], [8, 3]][p.sh]; return `${n} turns of ${fix((360 * k) / n, 1)}° = ${360 * k}° in total = **${k} full turn${k > 1 ? 's' : ''}** (the turtle circles the middle ${k === 1 ? 'once' : k + ' times'})`; },
              },
              after: r`A simple polygon always adds up to exactly one full turn, 360°. A star that crosses itself winds around its centre more than once, so its turns add up to 2, 3, … full turns: $5 \times 144° = 720°$. Either way the total is a whole number of turns, because the turtle ends up facing the way it started. That's why a shape of $n$ equal turns closes up when each turn is $360°$, or $720°$, or any whole number of full turns, divided by $n$.`,
            },
            {
              type: 'numeric',
              title: 'Inside an octagon',
              prompt: r`What is the interior angle of a regular octagon (8 sides)?`,
              unit: '°',
              answer: 135,
              wrong: [{ v: 45, why: 'That’s the turtle’s turn at each corner (the exterior angle). The interior angle is 180° minus that.' }, { v: 1080, why: 'That’s the sum of all eight interior angles. Divide by 8.' }],
              explain: r`Each turn is $360° \div 8 = 45°$, so each interior angle is $180° - 45° = 135°$. A stop sign has eight corners of $135°$.`,
            },
            {
              type: 'interactive',
              title: 'A five-pointed star',
              prompt: r`With 5 repeats, find the turn that draws a **five-pointed star** (and closes up). A pentagon doesn't count!`,
              widget: turtleSpec({ n: 5, a: 100, showN: false, goal: (p) => (p.a === 144 ? true : { ok: false, msg: p.a === 72 ? 'That’s a pentagon. Try turning much more sharply at each point.' : 'The star must close up after 5 repeats. Try angles bigger than 90°.' }), solution: { a: 144 } }),
              explain: r`A turn of $144°$ draws the star. Five turns of $144°$ add up to $720°$: the turtle turns round **twice** while drawing it. Closed paths that cross themselves can total any whole number of full turns.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'When does it close?',
              prompt: r`The turtle repeats **forward 1, turn left 150°** over and over. After how many repeats does it first come back to the start, facing the way it began?`,
              answer: 12,
              wrong: [{ v: 5, why: 'Five turns of 150° make 750°, which isn’t a whole number of full turns.' }, { v: 2.4, why: 'The number of repeats must be a whole number: the total turning has to be a multiple of 360°.' }],
              hint: r`You need $150° \times n$ to be a whole number of full turns: the smallest $n$ with $150n$ a multiple of $360$.`,
              explain: r`$150n$ must be a multiple of $360$. Dividing out the common factor 30: $5n$ must be a multiple of $12$, so the smallest is $n = 12$. Then the turtle has turned $1800° = 5$ full turns, drawing a 12-pointed star. Set the explorer to 12 repeats and 150° to see it.`,
            },
          ],
          recap: [
            'A turtle draws by repeating "forward, turn".',
            'A simple closed shape needs 360° of turning in total.',
            'Regular n-gon: turn 360°/n; stars turn several full circles.',
          ],
        },
      ],
    },
    {
      title: 'Decisions',
      summary: 'Programs that react.',
      lessons: [
        {
          id: 'conditions',
          title: 'If This, Then That',
          summary: 'Conditions and while loops',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A robot with sensors',
              body: r`So far, every program worked only on the grid it was written for. Real programs must cope with situations their authors never saw. So we give the robot **sensors**: it can check whether there's a **path ahead**, a **path left** or a **path right** (no wall in that direction), and an **if** block runs only when its condition is true:

${codeBlock(['if path left', '  turn left', 'else', '  turn right', 'end'])}

If there's a path to the robot's left it turns left; **else** (otherwise) it turns right. Exactly one of the two branches runs.`,
            },
            {
              type: 'interactive',
              title: 'One program, two grids',
              prompt: r`Write **one** program that works on **both** grids (use the Grid buttons to switch between them). The corridor turns up on one and down on the other.`,
              widget: { kind: 'robot', worlds: [W_UP, W_DN], palette: ['forward', 'turn left', 'turn right', 'if path left', 'else', 'end'], solution: ['forward', 'forward', 'if path left', 'turn left', 'else', 'turn right', 'end', 'forward', 'forward'], hint: 'Go forward twice. Then let the robot check which side is open before turning.' },
              explain: r`**forward** ×2; **if path left**: **turn left**, **else**: **turn right**; then **forward** ×2. A program with decisions is **general**: it solves a whole family of problems, not just one.`,
            },
            {
              type: 'numeric',
              title: 'Which branch runs?',
              body: r`The robot faces an open square (no wall ahead).

${codeBlock(['if wall ahead', '  turn right', 'else', '  forward', '  forward', 'end', 'turn left'])}`,
              prompt: 'How many moves does the robot make?',
              answer: 3,
              wrong: [{ v: 4, why: 'The **turn right** is inside the **if** branch, which is skipped when there’s no wall.' }, { v: 2, why: 'The **turn left** after **end** runs whichever branch was taken.' }],
              explain: r`No wall ahead, so the **if** branch is skipped and the **else** branch runs (two forwards). Then **turn left**, which comes after **end**, runs either way. Total: 3 moves.`,
            },
            {
              type: 'explain',
              title: 'While loops',
              body: r`A **repeat** loop needs to know in advance how many times to run. A **while** loop keeps going as long as its condition is true, checking before each run of its body:

${codeBlock(['while not at flag', '  forward', 'end'])}

This walks down a corridor of *any* length. But beware: if the body never makes the condition false (say, the robot only turns and never moves), the loop runs forever. That's an **infinite loop**, one of the most famous bugs of all.`,
            },
            {
              type: 'interactive',
              title: 'Any length of corridor',
              prompt: r`Write a program of **at most 3 lines** that gets the robot to the flag on both grids.`,
              widget: { kind: 'robot', worlds: [W_HALL5, W_HALL3], palette: ['forward', 'repeat', 'while not at flag', 'end'], maxLines: 3, solution: ['while not at flag', 'forward', 'end'], hint: 'A repeat loop needs a fixed count, but the corridors have different lengths.' },
              explain: r`**while not at flag**: **forward**. The same three lines work for a corridor of length 5, 3 or 3 million. The loop decides for itself when to stop.`,
            },
            {
              type: 'interactive',
              title: 'Follow the path',
              prompt: r`This program follows a winding path, but only if every bend turns **left**. Change it so it works on both grids. (Tap a line to choose where new commands go.)`,
              widget: { kind: 'robot', worlds: [W_WIND1, W_WIND2], palette: ['forward', 'turn left', 'turn right', 'if path left', 'else', 'end'], program: ['while not at flag', 'if path ahead', 'forward', 'else', 'turn left', 'end', 'end'], solution: FOLLOW, hint: 'Replace the plain “turn left” with a decision: turn left if there’s a path left, otherwise turn right.' },
              explain: r`Inside the **else**, replace **turn left** with **if path left**: **turn left**, **else**: **turn right**, **end**. Now at each bend the robot looks before it turns. Blocks inside blocks, like loops inside loops, are how short programs handle complicated situations.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A fork in the road',
              body: r`The path-following program you just built reaches a junction shaped like a **T**: the way ahead is blocked, and there are paths both left and right.

${codeBlock(FOLLOW.map((l, i) => '  '.repeat([0, 1, 2, 1, 2, 3, 2, 3, 2, 1, 0][i]) + l))}`,
              prompt: 'What does the robot do?',
              choices: [
                { t: 'Turns left and carries on', ok: true },
                { t: 'Turns right and carries on', why: 'It checks **path left** first, and that’s true, so the **else** branch never runs.' },
                { t: 'Stops, because two paths are open', why: 'Nothing in the program stops it. It always takes the first branch whose condition is true.' },
                { t: 'Gets stuck turning on the spot', why: 'After turning left it has a path ahead, so the next time round it moves forward.' },
              ],
              explain: r`The **if** checks "path left" first. Since there is one, the robot turns left, and next time round the loop it moves forward. The program never even looks right. The **order** of checks decides what happens when several conditions are true, which is exactly the idea behind the maze-solving rule in the next lesson.`,
            },
          ],
          recap: [
            'An if block runs only when its condition is true; else covers the other case.',
            'A while loop repeats until its condition becomes false.',
            'A loop whose condition never changes runs forever.',
          ],
        },
        {
          id: 'mazes',
          title: 'Escaping Mazes',
          summary: 'The wall-follower rule',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A hand on the wall',
              body: r`An old trick for escaping a maze: put your left hand on the wall and keep walking, never letting go. You'll follow every twist, poke into every dead end and come back out, and eventually reach the exit.

As a program, the robot's rule at each square is:
1. If there's a path to the **left**, turn left and step forward.
2. Otherwise, if there's a path **ahead**, step forward.
3. Otherwise, turn right (and try again).

Rule 1 keeps the robot's "left hand" on the wall: it hugs every left turn.`,
            },
            {
              type: 'interactive',
              title: 'The spinning robot',
              prompt: r`This program tries the left-hand rule, but the robot just spins on the spot. Fix it so it escapes both mazes.`,
              widget: { kind: 'robot', worlds: [W_MAZE1, W_MAZE2], palette: ['forward', 'turn left', 'turn right', 'if path left', 'if path ahead', 'else', 'end', 'while not at flag'], program: ['while not at flag', 'if path left', 'turn left', 'else', 'if path ahead', 'forward', 'else', 'turn right', 'end', 'end', 'end'], solution: LEFT_HAND, speed: 160, hint: 'After turning left, what must the robot do before it checks again? Otherwise its left is the way it just came.' },
              explain: r`Add **forward** right after **turn left** (inside the same branch). Without it, after turning left the robot checks its left again, which is now the way it came, finds a path, turns again, and spins forever. Rule 1 is "turn left **and step**", and the program has to say both.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An island in the middle',
              body: r`Here the flag sits in a room in the middle, and the walls around that room aren't joined to the outer walls. Run the left-hand rule and watch.`,
              widget: { kind: 'robot', world: W_ISLAND, readonly: true, program: LEFT_HAND, speed: 120 },
              after: r`The robot circles the outside forever, keeping its hand on a wall that never leads to the room, and the program stops it after 200 moves. The wall follower is only guaranteed to work when every wall is connected to the outside (a "simply connected" maze, with no loops).`,
            },
            {
              type: 'mcq',
              title: 'Why did it fail?',
              prompt: 'Why does the wall follower never reach the flag in the island maze?',
              choices: [
                { t: 'The wall it follows forms a closed loop that never touches the flag’s room', ok: true },
                { t: 'The maze is too big for the program', why: 'Size doesn’t matter: the robot would follow a connected wall of any length to its end.' },
                { t: 'It should have used its right hand instead', why: 'Following the right wall from the start circles the same outer loop the other way round.' },
                { t: 'The program has a bug', why: 'The program follows its rule perfectly. The rule itself just doesn’t suit this kind of maze.' },
              ],
              explain: r`A wall follower traces the wall it starts on. If that wall is a closed loop, the robot goes round it forever. Correct programs can still fail when their **assumptions** (here, "all walls connect to the outside") don't hold. Smarter maze algorithms, which mark where they've been, solve any maze.`,
            },
            {
              type: 'interactive',
              title: 'Low battery',
              prompt: r`This robot's battery allows only **25 moves**. The left-hand rule wanders into a long dead end and runs out. Change the program so the robot reaches the flag in time.`,
              widget: { kind: 'robot', world: W_LONG, battery: 25, palette: ['forward', 'turn left', 'turn right', 'if path left', 'if path right', 'if path ahead', 'else', 'end', 'while not at flag'], program: LEFT_HAND, solution: RIGHT_HAND, speed: 160, hint: 'Try keeping the other hand on the wall: swap every left for a right (and every right for a left).' },
              explain: r`The **right-hand rule** (swap left and right throughout) reaches this flag in 17 moves; the left-hand rule needs 47. Both always work in a simply connected maze, but which is faster depends on the maze. There's no free lunch: a simple rule can't know which way is shorter.`,
            },
            {
              type: 'mcq',
              title: 'Every square, twice at most',
              prompt: r`In a maze with no loops, a wall follower walks along each corridor at most twice (once each way). What does that guarantee?`,
              choices: [
                { t: 'It always finishes, though it may explore most of the maze first', ok: true },
                { t: 'It always takes the shortest route', why: 'It may explore every dead end before finding the exit, as the low-battery maze showed.' },
                { t: 'It never visits a dead end', why: 'It goes into every dead end it meets, then turns round and comes back out.' },
              ],
              explain: r`Walking each corridor at most twice means the total walk is at most twice the length of all the corridors, so the robot can't wander forever. But it's not the shortest route. Finding shortest routes takes a different idea: explore outwards from the start, nearest squares first (**breadth-first search**), which you'll meet in the Algorithms course.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The cost of dead ends',
              prompt: r`A wall-following robot walks down a straight corridor that has **3 dead-end side passages**, each 4 squares long, all on its left. How many **extra forward moves** do the dead ends cost, compared with walking straight down the corridor?`,
              answer: 24,
              wrong: [{ v: 12, why: 'The robot walks into each dead end and then all the way back out again.' }, { v: 8, why: 'That’s the cost of one dead end (4 in, 4 out). There are three.' }],
              explain: r`Each dead end costs 4 squares in and 4 back: 8 forwards (plus turns). Three of them: **24** extra forwards. A wall follower pays for every dead end on its side of the maze, which is why the choice of hand can matter so much.`,
            },
          ],
          recap: [
            'The left-hand rule: turn left and step if you can, else forward, else turn right.',
            'It always escapes a maze whose walls all connect to the outside.',
            'Which hand is faster depends on the maze.',
          ],
        },
      ],
    },
    {
      title: 'Memory',
      summary: 'Variables, loops that count, and functions.',
      lessons: [
        {
          id: 'variables',
          title: 'Boxes with Names',
          summary: 'Variables and assignment',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Variables',
              body: r`Programs need to remember things. A **variable** is a named box that holds a value. The line ${c('x = 5')} means "put 5 in the box called x". It is an **instruction**, not an equation.

Step through this program and watch the boxes.`,
              widget: {
                kind: 'trace',
                lines: ['x = 5', 'y = x + 2', 'x = x * 3', 'print(x, y)'],
                run: function* () {
                  let x = 5;
                  yield { line: 0, vars: { x } };
                  const y = x + 2;
                  yield { line: 1, vars: { x, y } };
                  x = x * 3;
                  yield { line: 2, vars: { x, y } };
                  yield { line: 3, vars: { x, y }, out: `${x} ${y}` };
                },
              },
              after: r`${c('x = x * 3')} would be nonsense as an equation, but as an instruction it's clear: work out the right-hand side using the *current* value (5 × 3 = 15), then put the answer in the box. Notice that **y stays 7**: it was computed from x once, and doesn't follow x when x changes later. (The ${c('*')} symbol means multiply.)`,
            },
            {
              type: 'numeric',
              title: 'A copy, not a link',
              body: r`${codeBlock(['a = 3', 'b = a', 'a = 10', 'print(b)'])}`,
              prompt: 'What does this program print?',
              answer: 3,
              wrong: [{ v: 10, why: '`b = a` copies the value 3 into b at that moment. Changing a later doesn’t touch b.' }],
              explain: r`Line 2 copies a's **current value**, 3, into b. Line 3 then changes a, but b keeps its 3. Variables hold values, not formulas: if you want b to follow a, you have to update it again.`,
            },
            {
              type: 'mcq',
              title: 'Swapping two boxes',
              body: r`The variables a and b hold 1 and 2. We want to swap them, so that a holds 2 and b holds 1.`,
              prompt: 'Which program works?',
              choices: [
                { t: r`${c('t = a')}, then ${c('a = b')}, then ${c('b = t')}`, ok: true },
                { t: r`${c('a = b')}, then ${c('b = a')}`, why: 'After `a = b` both boxes hold 2, and the original 1 is lost forever. Then `b = a` copies 2 again.' },
                { t: r`${c('b = a')}, then ${c('a = b')}`, why: 'Now both end up holding 1: the first line destroys the 2 before it can be saved.' },
              ],
              explain: r`Overwriting a box destroys what was in it, so you first save a copy in a temporary box ${c('t')}. It's like swapping the drinks in two glasses: you need a third glass.`,
            },
            {
              type: 'interactive',
              title: 'Work backwards',
              prompt: r`Choose the starting value ${c('n')} so that the program prints **20**. Step through it to check.`,
              widget: {
                kind: 'trace',
                lines: ['x = n', 'x = x * 2', 'x = x + 4', 'print(x)'],
                params: { n: { min: 0, max: 20, step: 1, value: 3, label: 'n', color: 'violet' } },
                run: function* (p) {
                  let x = p.n;
                  yield { line: 0, vars: { n: p.n, x } };
                  x = x * 2;
                  yield { line: 1, vars: { n: p.n, x } };
                  x = x + 4;
                  yield { line: 2, vars: { n: p.n, x } };
                  yield { line: 3, vars: { n: p.n, x }, out: x };
                },
                goal: (p) => p.n * 2 + 4 === 20,
                solution: { n: 8 },
                hint: 'Undo the steps from the bottom: before adding 4, x must have been 16.',
              },
              explain: r`Undo each line in reverse: before "+ 4" the value was $20 - 4 = 16$, and before "× 2" it was $16 \div 2 = 8$. So ${c('n = 8')}. Running a program backwards in your head is a powerful debugging trick.`,
            },
            {
              type: 'numeric',
              title: 'Squaring again and again',
              body: r`${codeBlock(['x = 2', 'x = x * x', 'x = x * x', 'x = x * x', 'print(x)'])}`,
              prompt: 'What does this print?',
              answer: 256,
              wrong: [{ v: 16, why: 'That’s after two squarings. There are three.' }, { v: 8, why: 'Each line squares the current value: 2 → 4 → 16 → …' }, { v: 64, why: 'Each line multiplies x by itself, not by 2: 2 → 4 → 16 → 256.' }],
              explain: r`$2 \to 4 \to 16 \to 256$. Each line squares the current value, so after three lines $x = 2^8 = 256$. Repeated squaring grows ferociously fast, and it's the trick computers use to calculate huge powers quickly (cryptography depends on it).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A swap without a spare box',
              body: r`${codeBlock(['a = 7', 'b = 3', 'a = a + b', 'b = a - b', 'a = a - b', 'print(a, b)'])}`,
              prompt: r`What value does **a** hold at the end?`,
              answer: 3,
              wrong: [{ v: 7, why: 'Trace it carefully: after line 3, a = 10; after line 4, b = 10 − 3 = 7; after line 5, a = 10 − 7.' }, { v: 10, why: 'That’s a after line 3. Two more lines change things.' }, { v: 4, why: 'Line 5 uses the new b (7), not the original 3.' }],
              explain: r`Line 3: $a = 10$. Line 4: $b = 10 - 3 = 7$. Line 5: $a = 10 - 7 = 3$. So the program prints $3\ 7$: the values were swapped without a third box! The trick works because a briefly holds the **sum**, from which either original can be recovered.`,
            },
          ],
          recap: [
            'A variable is a named box; “x = …” puts a value in it.',
            'The right side is worked out first, using current values.',
            'Assigning copies a value; overwriting destroys the old one.',
          ],
        },
        {
          id: 'counting',
          title: 'Loops with Memory',
          summary: 'Counters, totals and off-by-one',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Running totals',
              body: r`Combine a loop with a variable and you can add things up. Here ${c('for i in range(1, n + 1)')} runs its body once for each value $i = 1, 2, \dots, n$. Step through it, and try different values of $n$.`,
              widget: {
                kind: 'trace',
                lines: ['total = 0', 'for i in range(1, n + 1):', '    total = total + i', 'print(total)'],
                vars: ['n', 'i', 'total'],
                params: { n: { min: 1, max: 10, step: 1, value: 5, label: 'n', color: 'violet' } },
                run: function* (p) {
                  let total = 0;
                  yield { line: 0, vars: { n: p.n, total } };
                  for (let i = 1; i <= p.n; i++) {
                    yield { line: 1, vars: { n: p.n, i, total } };
                    total += i;
                    yield { line: 2, vars: { n: p.n, i, total } };
                  }
                  yield { line: 3, vars: { n: p.n, total }, out: total };
                },
              },
              after: r`The variable ${c('total')} is an **accumulator**: it starts at 0 and the loop keeps adding to it. For $n = 5$ it prints $1 + 2 + 3 + 4 + 5 = 15$. The indented line is the loop's body, run once per value of ${c('i')}.`,
            },
            {
              type: 'numeric',
              title: 'Adding squares',
              body: r`${codeBlock(['total = 0', 'for i in range(1, 5):', '    total = total + i * i', 'print(total)'])}`,
              prompt: r`What does this print? (Careful: ${c('range(1, 5)')} gives $1, 2, 3, 4$; it stops **before** 5.)`,
              answer: 30,
              wrong: [{ v: 55, why: 'That includes 5² = 25. The range stops before 5.' }, { v: 10, why: 'That adds 1 + 2 + 3 + 4. The body adds i × i, the squares.' }],
              explain: r`$1 + 4 + 9 + 16 = 30$. In Python, ${c('range(a, b)')} starts at $a$ and stops just **before** $b$. Forgetting that gives an off-by-one error.`,
            },
            {
              type: 'interactive',
              title: 'Reaching 55',
              prompt: r`Set $n$ so that the program prints **55**.`,
              widget: {
                kind: 'trace',
                lines: ['total = 0', 'for i in range(1, n + 1):', '    total = total + i', 'print(total)'],
                vars: ['n', 'i', 'total'],
                params: { n: { min: 1, max: 15, step: 1, value: 4, label: 'n', color: 'violet' } },
                speed: 200,
                run: function* (p) {
                  let total = 0;
                  yield { line: 0, vars: { n: p.n, total } };
                  for (let i = 1; i <= p.n; i++) {
                    yield { line: 1, vars: { n: p.n, i, total } };
                    total += i;
                    yield { line: 2, vars: { n: p.n, i, total } };
                  }
                  yield { line: 3, vars: { n: p.n, total }, out: total };
                },
                goal: (p) => (p.n * (p.n + 1)) / 2 === 55,
                solution: { n: 10 },
                hint: 'The program adds 1 + 2 + … + n. Keep going until the total is 55.',
              },
              explain: r`$1 + 2 + \dots + 10 = 55$. There's a shortcut: $1 + 2 + \dots + n = \dfrac{n(n + 1)}{2}$, and $\dfrac{10 \times 11}{2} = 55$. A good programmer often replaces a loop with a formula, but the loop is easier to get right first.`,
            },
            {
              type: 'explain',
              title: 'Fenceposts',
              body: r`How many fenceposts does a 10-metre fence need, with a post every metre? Not 10 but **11**: one at each end. Counting the gaps and counting the posts differ by one, and mixing them up is the **off-by-one error**, probably the most common bug in all of programming.

In code it hides in loop limits: does the loop run while $i < 10$ or while $i \le 10$? Does counting start at 0 or at 1? When you write a loop, test the smallest cases by hand: what happens for $n = 0$ and $n = 1$?`,
            },
            {
              type: 'numeric',
              title: 'How many times?',
              prompt: r`How many times does the body of ${c('for i in range(3, 12):')} run?`,
              answer: 9,
              wrong: [{ v: 10, why: 'The range includes 3 but stops before 12: that’s 12 − 3 values.' }, { v: 8, why: 'Count them: 3, 4, 5, 6, 7, 8, 9, 10, 11.' }],
              explain: r`${c('range(3, 12)')} is $3, 4, \dots, 11$: that's $12 - 3 = 9$ values. Python chose "stop before the end" so that ${c('range(a, b)')} always has exactly $b - a$ values, which helps avoid fencepost errors.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The biggest so far',
              body: r`Loops can work through a **list** of values. To find the largest, keep the biggest seen so far in a variable, and update it whenever something bigger turns up.`,
              widget: {
                kind: 'trace',
                lines: ['scores = [4, 9, 2, 9, 7, 12, 5]', 'best = scores[0]', 'for x in scores:', '    if x > best:', '        best = x', 'print(best)'],
                vars: ['x', 'best'],
                speed: 360,
                run: function* () {
                  const scores = [4, 9, 2, 9, 7, 12, 5];
                  yield { line: 0, vars: {} };
                  let best = scores[0];
                  yield { line: 1, vars: { best } };
                  for (const x of scores) {
                    yield { line: 2, vars: { x, best } };
                    yield { line: 3, vars: { x, best } };
                    if (x > best) { best = x; yield { line: 4, vars: { x, best } }; }
                  }
                  yield { line: 5, vars: { best }, out: best };
                },
              },
              after: r`${c('scores[0]')} is the first item (programmers count from 0). The comparison runs for every item, but ${c('best')} changes only twice: at 9 and at 12. The second 9 doesn't count, because $9 > 9$ is false. This "best so far" pattern finds a maximum in a single pass through the list.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting multiples',
              body: r`${codeBlock(['count = 0', 'for i in range(1, 101):', '    if i % 3 == 0:', '        count = count + 1', 'print(count)'])}

The symbol ${c('%')} gives the remainder after division, so ${c('i % 3 == 0')} is true when $i$ is a multiple of 3.`,
              prompt: 'What does this program print?',
              answer: 33,
              wrong: [{ v: 34, why: 'Is 0 included? The range starts at 1, and the multiples of 3 from 3 to 99 number 99 ÷ 3.' }, { v: 100, why: 'The count goes up only when the if condition is true.' }, { v: 33.33, tol: 0.01, why: 'You can’t count a third of a number: count the whole multiples 3, 6, …, 99.' }],
              explain: r`The range runs from 1 to 100, and the multiples of 3 among those are $3, 6, \dots, 99$: there are $99 \div 3 = 33$ of them. A **counter** is an accumulator that adds 1 each time something happens, here combined with an **if** inside a loop.`,
            },
          ],
          recap: [
            'An accumulator starts at 0 and a loop keeps adding to it.',
            'range(a, b) runs from a up to b − 1: b − a values.',
            'Off-by-one (fencepost) errors hide in loop limits; test small cases.',
          ],
        },
        {
          id: 'functions',
          title: 'Functions',
          summary: 'Name it once, use it everywhere',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Making your own instructions',
              body: r`A **function** is a named piece of code you can use again and again. You define it once with ${c('def')}, then **call** it by name, giving it inputs (**arguments**). It can hand back a result with ${c('return')}:

${codeBlock(['def double(x):', '    return 2 * x', '', 'print(double(5))      # prints 10', 'print(double(double(3)))   # prints 12'])}

Inside the function, ${c('x')} is a fresh box that holds whatever value was passed in. Functions let you build big programs from small, tested, well-named pieces.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching a call',
              body: r`Step through a program that calls a function twice. Watch the program jump into the function, compute, and jump back with the answer.`,
              widget: {
                kind: 'trace',
                lines: ['def area(w, h):', '    return w * h', '', 'a = area(3, 4)', 'b = area(a, 2)', 'print(a + b)'],
                vars: ['w', 'h', 'a', 'b'],
                run: function* () {
                  yield { line: 0, vars: {} };
                  yield { line: 3, vars: {} };
                  yield { line: 1, vars: { w: 3, h: 4 } };
                  const a = 12;
                  yield { line: 3, vars: { a } };
                  yield { line: 4, vars: { a } };
                  yield { line: 1, vars: { w: a, h: 2, a } };
                  const b = 24;
                  yield { line: 4, vars: { a, b } };
                  yield { line: 5, vars: { a, b }, out: a + b };
                },
              },
              after: r`Defining the function (line 1) doesn't run it; it just teaches the computer a new word. Each call fills ${c('w')} and ${c('h')} with new values, runs the body, and replaces the call with the returned value: ${c('area(3, 4)')} becomes 12, and ${c('area(12, 2)')} becomes 24.`,
            },
            {
              type: 'numeric',
              title: 'A function of a function',
              body: r`${codeBlock(['def f(x):', '    return x * x + 1', '', 'print(f(f(2)))'])}`,
              prompt: 'What does this print?',
              answer: 26,
              wrong: [{ v: 5, why: 'That’s f(2). The outer f is then applied to that result.' }, { v: 17, why: 'Work from the inside out: f(2) = 5, and then f(5) = 5 × 5 + 1.' }],
              explain: r`Inside first: $f(2) = 2 \times 2 + 1 = 5$. Then $f(5) = 5 \times 5 + 1 = 26$. Calls nest like brackets in arithmetic: the innermost is worked out first.`,
            },
            {
              type: 'interactive',
              title: 'A flower from squares',
              prompt: r`A turtle function draws a square. The program calls it repeatedly, turning a little between squares:

${codeBlock(['def square():', '    repeat 4 times: forward 1, turn left 90', '', 'repeat 12 times:', '    square()', '    turn left T degrees'])}

Choose $T$ so that the 12 squares spread evenly all the way round, and the flower closes up.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -2.6, ymax: 2.6, grid: false, axes: false, maxWidth: 460, clipExtra: true,
                params: { t: { min: 0, max: 60, step: 1, value: 10, label: '$T$', color: 'coral', format: (v) => `${v}°` } },
                extra: (ctx) => turtleDraw(ctx, turtlePts(0, 0, { copies: 12, spin: ctx.p.t, poly: [4, 90] }), 12 * ctx.p.t),
                readout: (p) => `12 turns of ${p.t}° = **${12 * p.t}°** in total`,
                goal: (p) => p.t === 30,
                solution: { t: 30 },
                hint: 'The 12 extra turns should add up to one full circle.',
              },
              explain: r`$360° \div 12 = 30°$. The function hides the details of drawing a square, so the main program can talk about the bigger idea: "draw a square, turn, repeat". That's **abstraction**, the main reason functions exist.`,
            },
            {
              type: 'mcq',
              title: 'Why bother?',
              prompt: 'A program draws 50 squares, each with 4 lines of code. Why is a square() function better than copying those 4 lines 50 times?',
              choices: [
                { t: 'A fix or change made once in the function applies to all 50 squares', ok: true },
                { t: 'The computer runs functions faster than copied code', why: 'Speed is roughly the same (calling a function even costs a tiny bit). The gain is for the people writing and reading the code.' },
                { t: 'Copied code isn’t allowed in most languages', why: 'It’s allowed; it’s just a bad idea. Every copy is another place for a bug to hide.' },
              ],
              explain: r`With 50 copies, a bug must be fixed 50 times, and missing one copy creates a new bug. With a function, there's one copy to test and fix. Programmers call this **DRY**: Don't Repeat Yourself.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A function that calls itself',
              body: r`A function may call **itself** on a smaller problem. The factorial $n! = n \times (n - 1) \times \dots \times 1$ can be defined that way: $n! = n \times (n - 1)!$, stopping at $1! = 1$. Step through and watch the calls go down to ${c('fact(1)')}, then unwind as each one returns its answer.`,
              widget: {
                kind: 'trace',
                lines: ['def fact(n):', '    if n <= 1:', '        return 1', '    return n * fact(n - 1)', '', 'print(fact(4))'],
                vars: ['running', 'n', 'returns'],
                speed: 520,
                run: function* () {
                  const call = (k) => ({ raw: `fact(${k})` });
                  yield { line: 0, vars: {} };
                  yield { line: 5, vars: { running: call(4) } };
                  for (let n = 4; n >= 1; n--) {
                    yield { line: 1, vars: { running: call(n), n } };
                    if (n <= 1) { yield { line: 2, vars: { running: call(1), n, returns: 1 } }; break; }
                    yield { line: 3, vars: { running: call(n), n } };
                  }
                  let v = 1;
                  for (let n = 2; n <= 4; n++) { v *= n; yield { line: 3, vars: { running: call(n), n, returns: v } }; }
                  yield { line: 5, vars: { returns: 24 }, out: 24 };
                },
              },
              after: r`Each call waits for the next, smaller one: ${c('fact(4)')} needs ${c('fact(3)')}, which needs ${c('fact(2)')}, down to ${c('fact(1)')}, which just returns 1. Then the waiting multiplications finish: $4 \times 3 \times 2 \times 1 = 24$. This is **recursion**; the Recursion & Recurrences course explores it in depth.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A recursive sum',
              body: r`${codeBlock(['def s(n):', '    if n == 0:', '        return 0', '    return n + s(n - 1)', '', 'print(s(6))'])}`,
              prompt: 'What does this print?',
              answer: 21,
              wrong: [{ v: 15, why: 'That’s s(5). s(6) adds 6 more.' }, { v: 720, why: 'That would be 6! (multiplying). This function adds.' }, { v: 6, why: 's(6) is 6 + s(5), and s(5) isn’t zero: keep unwinding.' }],
              explain: r`$s(6) = 6 + s(5) = 6 + 5 + s(4) = \dots = 6 + 5 + 4 + 3 + 2 + 1 + 0 = 21$. It's the running total from the previous lesson, written recursively. The **base case** $s(0) = 0$ stops the chain; without it, the function would call itself forever.`,
            },
          ],
          recap: [
            'A function is a named, reusable piece of code; def defines it, calling runs it.',
            'Arguments fill the function’s variables; return hands back a value.',
            'Functions avoid repetition; recursive functions call themselves on smaller cases.',
          ],
        },
      ],
    },
  ],
};
