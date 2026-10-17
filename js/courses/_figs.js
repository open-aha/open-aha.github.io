// Reusable figure builders for course content.

// Function machine chain: machine(['×3', '+5'], { input: 'x', output: '26', back: true })
export function machine(ops, { input = 'x', output = '?', back = false, mids = [], backMids = [], color = 'blue' } = {}) {
  const n = ops.length;
  const w = 600;
  const rows = back ? 2 : 1;
  const ht = rows === 2 ? 250 : 130;
  return {
    kind: 'figure',
    w,
    h: ht,
    label: 'Function machine',
    draw: ({ s, arrow }) => {
      const els = [];
      // room at each end sized to the input and output labels, so long ones are never cut off
      const inW = Math.max(44, String(input).length * 12 + 20), outW = Math.max(44, String(output).length * 12 + 20);
      const boxW = 96, gap = (w - inW - outW - n * boxW) / (n + 1);
      const y = 64;
      const xs = ops.map((_, i) => inW + gap * (i + 1) + boxW * i);
      // forward row
      const val = (x, yy, text, col = 'ink') =>
        s('text', { x, y: yy + 7, 'text-anchor': 'middle', class: `lbl-math fl-${col}`, style: 'font-size:22px', text });
      els.push(val(inW / 2, y, input, color));
      xs.forEach((x, i) => {
        els.push(arrow(i === 0 ? inW - 4 : xs[i - 1] + boxW + 4, y, x - 6, y, { color: 'var(--ink-3)', width: 2.5, head: 9 }));
        els.push(s('rect', { x, y: y - 28, width: boxW, height: 56, rx: 14, class: `fl-${color}` }));
        els.push(s('text', { x: x + boxW / 2, y: y + 8, 'text-anchor': 'middle', style: 'font-size:22px;font-weight:800;fill:#fff', text: ops[i] }));
        if (mids[i] != null && i < n - 1) els.push(val(x + boxW + gap / 2, y - 30, mids[i], 'muted'));
      });
      els.push(arrow(xs[n - 1] + boxW + 4, y, w - outW + 2, y, { color: 'var(--ink-3)', width: 2.5, head: 9 }));
      els.push(val(w - outW / 2, y, output));
      if (back) {
        const y2 = 186;
        const inv = ops.map(invert);
        els.push(s('text', { x: w / 2, y: 140, 'text-anchor': 'middle', class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));letter-spacing:.1em', text: 'UNDO IN REVERSE ORDER' }));
        els.push(val(w - outW / 2, y2, output));
        xs.forEach((x, i) => {
          els.push(s('rect', { x, y: y2 - 28, width: boxW, height: 56, rx: 14, class: 'fl-coral' }));
          els.push(s('text', { x: x + boxW / 2, y: y2 + 8, 'text-anchor': 'middle', style: 'font-size:22px;font-weight:800;fill:#fff', text: inv[i] }));
          els.push(arrow(i === n - 1 ? w - outW + 2 : xs[i + 1] - 4, y2, x + boxW + 6, y2, { color: 'var(--ink-3)', width: 2.5, head: 9 }));
          if (backMids[i] != null && i > 0) els.push(val(x - gap / 2, y2 - 30, backMids[i], 'muted'));
        });
        els.push(arrow(xs[0] - 4, y2, inW - 2, y2, { color: 'var(--ink-3)', width: 2.5, head: 9 }));
        els.push(val(inW / 2, y2, backMids[0] ?? input, 'coral'));
      }
      return els;
    },
  };
}

function invert(op) {
  const m = op.match(/^([+−\-×÷])\s*(.+)$/);
  if (!m) return op;
  const map = { '+': '−', '−': '+', '-': '+', '×': '÷', '÷': '×' };
  return map[m[1]] + m[2];
}

// Two-pan picture used for static balance (no tilt), e.g. system puzzles
export function scale(left, right, opts = {}) {
  return { kind: 'balance', left, right, showEq: opts.showEq ?? false, x: opts.x, y: opts.y, label: opts.label, labelY: opts.labelY, showLevel: opts.showLevel };
}
