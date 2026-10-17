// Robot-on-a-grid engine (shared by the widget and the validator).
// A world is an array of strings: '#' wall, '.' floor, 'F' flag, '*' gem,
// and the robot's start as one of '>' '<' '^' 'v' (the way it faces).
// A program is an array of lines from a small vocabulary:
//   'forward', 'turn left', 'turn right', 'repeat N', 'while not at flag',
//   'if wall ahead', 'if path ahead', 'if path left', 'if path right', 'else', 'end'
// Blocks (repeat / while / if) run until their matching 'end'; a missing 'end' closes at the bottom.

const DIRS = { '>': 0, v: 1, '<': 2, '^': 3 }; // clockwise from east
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];

export function parseWorld(rows) {
  const w = Math.max(...rows.map((r) => r.length)), ht = rows.length;
  const walls = new Set(), gems = [];
  let start = null, flag = null;
  rows.forEach((row, y) => [...row.padEnd(w, '#')].forEach((ch, x) => {
    if (ch === '#') walls.add(`${x},${y}`);
    else if (ch === 'F') flag = [x, y];
    else if (ch === '*') gems.push([x, y]);
    else if (ch in DIRS) start = [x, y, DIRS[ch]];
  }));
  return { w, h: ht, walls, gems, start, flag };
}

const isWall = (W, x, y) => x < 0 || y < 0 || x >= W.w || y >= W.h || W.walls.has(`${x},${y}`);

// Turn program lines into a tree. Returns { body, error } (error names a stray 'end' or 'else').
export function parse(lines) {
  const root = { body: [] };
  const stack = [root];
  let error = null;
  lines.forEach((raw, i) => {
    const t = raw.trim();
    const top = stack[stack.length - 1];
    const into = top.inElse ? top.else : top.body;
    let m;
    if (t === 'end') {
      if (stack.length === 1) error = error || { line: i, msg: `line ${i + 1}: “end” has no block to close` };
      else stack.pop();
    } else if (t === 'else') {
      if (top.kind !== 'if' || top.inElse) error = error || { line: i, msg: `line ${i + 1}: “else” must come inside an “if” block` };
      else { top.inElse = true; top.elseLine = i; }
    } else if ((m = t.match(/^repeat (\d+)$/))) {
      const node = { kind: 'repeat', n: +m[1], body: [], line: i };
      into.push(node);
      stack.push(node);
    } else if (t === 'while not at flag') {
      const node = { kind: 'while', body: [], line: i };
      into.push(node);
      stack.push(node);
    } else if ((m = t.match(/^if (wall ahead|path ahead|path left|path right)$/))) {
      const node = { kind: 'if', cond: m[1], body: [], else: [], line: i };
      into.push(node);
      stack.push(node);
    } else if (t === 'forward' || t === 'turn left' || t === 'turn right') {
      into.push({ kind: t, line: i });
    } else if (t) {
      error = error || { line: i, msg: `line ${i + 1}: unknown command “${t}”` };
    }
  });
  return { body: root.body, error };
}

// Run a program on a world. Returns { frames, result } where frames are robot states after each
// action ({x, y, d, got, line}) and result = { ok, reason, msg, moves, line }.
// battery: the robot stops after that many moves (forwards and turns) unless it is on the flag.
export function run(rows, lines, { maxMoves = 200, maxChecks = 2000, battery = null } = {}) {
  const W = parseWorld(rows);
  const { body, error } = parse(lines);
  const st = { x: W.start[0], y: W.start[1], d: W.start[2], got: new Set(), moves: 0, checks: 0 };
  const frames = [{ x: st.x, y: st.y, d: st.d, got: [], line: -1 }];
  const snap = (line) => frames.push({ x: st.x, y: st.y, d: st.d, got: [...st.got], line });
  if (error) return { frames, result: { ok: false, reason: 'error', msg: error.msg, line: error.line, moves: 0 } };
  const atFlag = () => W.flag && st.x === W.flag[0] && st.y === W.flag[1];
  const look = (turn) => { const d = (st.d + turn + 4) % 4; return isWall(W, st.x + DX[d], st.y + DY[d]); };
  const cond = (c) => (c === 'wall ahead' ? look(0) : c === 'path ahead' ? !look(0) : c === 'path left' ? !look(-1) : !look(1));
  class Stop { constructor(r) { this.r = r; } }

  function exec(list) {
    for (const node of list) {
      if (++st.checks > maxChecks) throw new Stop({ reason: 'loop', line: node.line });
      switch (node.kind) {
        case 'forward': {
          const nx = st.x + DX[st.d], ny = st.y + DY[st.d];
          if (isWall(W, nx, ny)) { snap(node.line); throw new Stop({ reason: 'crash', line: node.line }); }
          st.x = nx; st.y = ny;
          W.gems.forEach(([gx, gy], k) => { if (gx === nx && gy === ny) st.got.add(k); });
          st.moves++;
          snap(node.line);
          break;
        }
        case 'turn left': st.d = (st.d + 3) % 4; st.moves++; snap(node.line); break;
        case 'turn right': st.d = (st.d + 1) % 4; st.moves++; snap(node.line); break;
        case 'repeat': for (let k = 0; k < node.n; k++) exec(node.body); break;
        case 'while': while (!atFlag()) { if (++st.checks > maxChecks) throw new Stop({ reason: 'loop', line: node.line }); exec(node.body); } break;
        case 'if': exec(cond(node.cond) ? node.body : node.else); break;
      }
      if (battery != null && st.moves >= battery && !atFlag()) throw new Stop({ reason: 'battery', line: node.line });
      if (st.moves > maxMoves) throw new Stop({ reason: 'loop', line: node.line });
    }
  }
  let stop = null;
  try { exec(body); } catch (e) { if (e instanceof Stop) stop = e.r; else throw e; }
  const allGems = st.got.size === W.gems.length;
  let result;
  if (stop?.reason === 'crash') result = { ok: false, reason: 'crash', line: stop.line, msg: `Bumped into a wall on line ${stop.line + 1}.` };
  else if (stop?.reason === 'battery') result = { ok: false, reason: 'battery', line: stop.line, msg: `Out of battery: the robot can make only ${battery} moves, and it hasn’t reached the flag.` };
  else if (stop?.reason === 'loop') result = { ok: false, reason: 'loop', line: stop.line, msg: 'Stopped after too many moves: the robot is going round in circles (an endless loop?).' };
  else if (!atFlag()) result = { ok: false, reason: 'short', msg: W.flag ? 'The program finished, but the robot isn’t on the flag.' : 'The program finished.' };
  else if (!allGems) result = { ok: false, reason: 'gems', msg: `The robot reached the flag but collected only ${st.got.size} of ${W.gems.length} gems.` };
  else result = { ok: true, reason: 'done', msg: W.gems.length ? 'All gems collected and the flag reached!' : 'Reached the flag!' };
  result.moves = st.moves;
  return { frames, result };
}

// A program's length in lines, not counting blank lines.
export const lineCount = (lines) => lines.filter((l) => l.trim()).length;

// Does a program solve every world (within the line limit)?
export function solves(spec, lines) {
  const worlds = spec.worlds || [spec.world];
  if (spec.maxLines && lineCount(lines) > spec.maxLines) return { ok: false, msg: `Use at most ${spec.maxLines} lines (you have ${lineCount(lines)}).` };
  for (let i = 0; i < worlds.length; i++) {
    const { result } = run(worlds[i], lines, spec);
    if (!result.ok) return { ok: false, world: i, msg: (worlds.length > 1 ? `Grid ${i + 1}: ` : '') + result.msg };
  }
  return { ok: true };
}
