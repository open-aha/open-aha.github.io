// Pure logic-circuit evaluation (no DOM), shared by the gates widget and the validator.
export const GATE_FN = {
  AND: (a) => a.every(Boolean),
  OR: (a) => a.some(Boolean),
  NOT: (a) => !a[0],
  NAND: (a) => !a.every(Boolean),
  NOR: (a) => !a.some(Boolean),
  XOR: (a) => a.filter(Boolean).length % 2 === 1,
  XNOR: (a) => a.filter(Boolean).length % 2 === 0,
  BUF: (a) => !!a[0],
};

// inputs: {A: 0|1, …}; prev: values from the last evaluation (lets feedback loops hold state)
export function evaluate(spec, inputs, prev = {}) {
  const v = { ...prev, ...inputs };
  for (const g of spec.gates) if (v[g.id] == null) v[g.id] = g.init ?? 0;
  for (let iter = 0; iter < 40; iter++) {
    let changed = false;
    for (const g of spec.gates) {
      const out = GATE_FN[g.type](g.in.map((id) => !!v[id])) ? 1 : 0;
      if (v[g.id] !== out) {
        v[g.id] = out;
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const o of spec.outputs || []) v[o.id] = v[o.from] ? 1 : 0;
  return v;
}
