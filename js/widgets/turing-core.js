// Turing machine engine (shared by the widget and the validator).
// rules: { State: { symbol: [write, move ('L'|'R'|'N'), next] } }
// A machine halts when it enters a state listed in `halt`, or when no rule applies.

export function makeTape(str, blank = '_') {
  const cells = new Map();
  [...str].forEach((ch, i) => { if (ch !== blank) cells.set(i, ch); });
  return cells;
}

export function tapeString(cells, blank = '_') {
  const keys = [...cells.keys()].filter((k) => cells.get(k) !== blank);
  if (!keys.length) return '';
  const lo = Math.min(...keys), hi = Math.max(...keys);
  let out = '';
  for (let i = lo; i <= hi; i++) out += cells.get(i) ?? blank;
  return out;
}

export function step(m, rules, blank = '_') {
  const sym = m.tape.get(m.head) ?? blank;
  const rule = rules[m.state]?.[sym];
  if (!rule) return false;
  const [write, move, next] = rule;
  if (write === blank) m.tape.delete(m.head);
  else m.tape.set(m.head, write);
  m.head += move === 'L' ? -1 : move === 'R' ? 1 : 0;
  m.state = next;
  m.steps++;
  return true;
}

export function run(spec, rules = spec.rules, input = spec.tape ?? '', maxSteps = spec.maxSteps ?? 500) {
  const blank = spec.blank ?? '_';
  const halt = new Set(spec.halt ?? ['H']);
  const m = { tape: makeTape(input, blank), head: spec.head ?? 0, state: spec.start ?? 'A', steps: 0 };
  if (typeof m.head === 'function') m.head = m.head(input);
  while (!halt.has(m.state) && m.steps < maxSteps) if (!step(m, rules, blank)) break;
  return { ...m, halted: halt.has(m.state), output: tapeString(m.tape, blank) };
}

// apply edits [[state, symbol, index, value], ...] to a deep copy of the rules
export function withEdits(rules, edits) {
  const out = JSON.parse(JSON.stringify(rules));
  for (const [st, sym, i, v] of edits) out[st][sym][i] = v;
  return out;
}
