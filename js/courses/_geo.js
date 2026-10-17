// Geometry helpers for figure/graph "extra" drawing. Points are [x, y] in plot (math) coordinates.

export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

// interior angle at B (degrees) between rays BA and BC
export function angleAt(A, B, C) {
  const v1 = [A[0] - B[0], A[1] - B[1]], v2 = [C[0] - B[0], C[1] - B[1]];
  const c = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2));
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
}

// filled wedge marking the angle at B between BA and BC (screen space via plot)
export function wedge(plot, s, A, B, C, r = 30, cls = 'fl-blue', opacity = 0.35) {
  const b = [plot.X(B[0]), plot.Y(B[1])];
  const a1 = Math.atan2(plot.Y(A[1]) - b[1], plot.X(A[0]) - b[0]);
  const a2 = Math.atan2(plot.Y(C[1]) - b[1], plot.X(C[0]) - b[0]);
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const p1 = [b[0] + r * Math.cos(a1), b[1] + r * Math.sin(a1)];
  const p2 = [b[0] + r * Math.cos(a1 + d), b[1] + r * Math.sin(a1 + d)];
  const sweep = d > 0 ? 1 : 0;
  return s('path', { d: `M${b[0]} ${b[1]} L${p1[0]} ${p1[1]} A${r} ${r} 0 0 ${sweep} ${p2[0]} ${p2[1]} Z`, class: cls, opacity });
}

// label placed along the angle bisector at B
export function angleLabel(plot, s, A, B, C, text, dist = 48, cls = 'lbl') {
  const b = [plot.X(B[0]), plot.Y(B[1])];
  const u1 = norm([plot.X(A[0]) - b[0], plot.Y(A[1]) - b[1]]);
  const u2 = norm([plot.X(C[0]) - b[0], plot.Y(C[1]) - b[1]]);
  const m = norm([u1[0] + u2[0], u1[1] + u2[1]]);
  return s('text', { x: b[0] + m[0] * dist, y: b[1] + m[1] * dist + 5, 'text-anchor': 'middle', class: cls, style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text });
}

const norm = (v) => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

export function poly(plot, s, pts, attrs = {}) {
  return s('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${plot.X(p[0])} ${plot.Y(p[1])}`).join('') + 'Z', ...attrs });
}

export function seg(plot, s, P, Q, attrs = {}) {
  return s('line', { x1: plot.X(P[0]), y1: plot.Y(P[1]), x2: plot.X(Q[0]), y2: plot.Y(Q[1]), ...attrs });
}

export function label(plot, s, P, text, dx = 0, dy = 0, attrs = {}) {
  return s('text', { x: plot.X(P[0]) + dx, y: plot.Y(P[1]) + dy, 'text-anchor': 'middle', class: 'lbl', ...attrs, text });
}

// right-angle marker at B for rays toward A and C
export function rightMark(plot, s, A, B, C, size = 14) {
  const b = [plot.X(B[0]), plot.Y(B[1])];
  const u1 = norm([plot.X(A[0]) - b[0], plot.Y(A[1]) - b[1]]);
  const u2 = norm([plot.X(C[0]) - b[0], plot.Y(C[1]) - b[1]]);
  const p1 = [b[0] + u1[0] * size, b[1] + u1[1] * size];
  const p3 = [b[0] + u2[0] * size, b[1] + u2[1] * size];
  const p2 = [p1[0] + u2[0] * size, p1[1] + u2[1] * size];
  return s('path', { d: `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} L${p3[0]} ${p3[1]}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.8 });
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
