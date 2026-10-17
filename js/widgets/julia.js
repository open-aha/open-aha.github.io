// Julia sets: tap the small Mandelbrot map to choose c; the big canvas shows the Julia set of z² + c.
// spec: { c: [re, im], iter, goal: 'dust' | 'connected' }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';

const inM = (a, b, n = 300) => { let x = 0, y = 0; for (let i = 0; i < n; i++) { const t = x * x - y * y + a; y = 2 * x * y + b; x = t; if (x * x + y * y > 4) return false; } return true; };

export function julia(box, spec, api) {
  const JW = 520, JH = 400, MW = 240, MH = 200, DPR = 2, BD = 1.25; // BD: big-canvas pixel density
  let [ca, cb] = spec.c || [-0.8, 0.156];
  const iter = spec.iter || 120;
  let touched = false, dragging = false;
  const big = h('canvas', { width: JW * BD, height: JH * BD, style: { width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }, 'aria-label': 'Julia set' });
  const map = h('canvas', { width: MW * DPR, height: MH * DPR, style: { width: '100%', maxWidth: '260px', height: 'auto', display: 'block', cursor: 'crosshair', touchAction: 'none', borderRadius: '10px' }, 'aria-label': 'Mandelbrot set map. Tap to choose c.' });
  const readout = h('div.w-readout');
  const note = h('div', { style: { flex: '1 1 180px', fontSize: '14px' } });
  note.innerHTML = mdi('**Tap or drag on the map** to choose $c$. Black is the Mandelbrot set.');
  box.append(big, h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' } }, map, note), readout);

  // Mandelbrot map, rendered once; region re ∈ [-2.2, 0.8], im ∈ [-1.25, 1.25]
  const mx = (px) => -2.2 + (px / MW) * 3, my = (py) => 1.25 - (py / MH) * 2.5;
  const mctx = map.getContext('2d');
  const mimg = mctx.createImageData(MW * DPR, MH * DPR);
  for (let py = 0; py < MH * DPR; py++) for (let px = 0; px < MW * DPR; px++) {
    const a = mx(px / DPR), b = my(py / DPR);
    let x = 0, y = 0, n = 0;
    while (x * x + y * y <= 4 && n < 60) { const t = x * x - y * y + a; y = 2 * x * y + b; x = t; n++; }
    const i = (py * MW * DPR + px) * 4, v = n >= 60 ? 20 : 120 + Math.round(120 * Math.sqrt(n / 60));
    mimg.data[i] = n >= 60 ? 20 : v; mimg.data[i + 1] = n >= 60 ? 20 : v; mimg.data[i + 2] = n >= 60 ? 20 : 255; mimg.data[i + 3] = 255;
  }
  const bctx = big.getContext('2d');
  function draw() {
    mctx.putImageData(mimg, 0, 0);
    const X = ((ca + 2.2) / 3) * MW * DPR, Y = ((1.25 - cb) / 2.5) * MH * DPR;
    mctx.strokeStyle = '#ff6b4a'; mctx.lineWidth = 3 * DPR / 2;
    mctx.beginPath(); mctx.arc(X, Y, 7 * DPR / 2 + 2, 0, 2 * Math.PI); mctx.stroke();
    const img = bctx.createImageData(JW * BD, JH * BD), sc = 3.4 / (JW * BD);
    for (let py = 0; py < JH * BD; py++) for (let px = 0; px < JW * BD; px++) {
      let x = (px - (JW * BD) / 2) * sc, y = ((JH * BD) / 2 - py) * sc, n = 0;
      while (x * x + y * y <= 4 && n < iter) { const t = x * x - y * y + ca; y = 2 * x * y + cb; x = t; n++; }
      const i = (py * JW * BD + px) * 4;
      if (n >= iter) { img.data[i] = 17; img.data[i + 1] = 17; img.data[i + 2] = 17; }
      else { const a = Math.sqrt(n / iter); img.data[i] = Math.round(69 + 186 * a); img.data[i + 1] = Math.round(109 * (1 - a) + 107 * a); img.data[i + 2] = Math.round(255 * (1 - a) + 74 * a); }
      img.data[i + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
    const conn = inM(ca, cb);
    readout.innerHTML = mdi(`$c = ${ca.toFixed(3)} ${cb < 0 ? '-' : '+'} ${Math.abs(cb).toFixed(3)}i$ · ${conn ? 'inside the Mandelbrot set: the Julia set is **connected**' : 'outside the Mandelbrot set: the Julia set is **dust**'}`);
  }
  function pick(e) {
    const r = map.getBoundingClientRect();
    ca = mx(((e.clientX - r.left) / r.width) * MW);
    cb = my(((e.clientY - r.top) / r.height) * MH);
    touched = true;
    draw();
    api.onChange();
  }
  map.addEventListener('pointerdown', (e) => { dragging = true; map.setPointerCapture(e.pointerId); pick(e); });
  map.addEventListener('pointermove', (e) => { if (dragging) pick(e); });
  map.addEventListener('pointerup', () => (dragging = false));
  map.addEventListener('pointercancel', () => (dragging = false));
  draw();
  return {
    ready: () => touched || !spec.goal,
    check() {
      if (spec.goal === 'dust') return inM(ca, cb) ? { ok: false, msg: 'This c is inside the Mandelbrot set, so its Julia set is still connected. Pick a point outside the black region.' } : { ok: true };
      if (spec.goal === 'connected') return inM(ca, cb) ? { ok: true } : { ok: false, msg: 'This c is outside the Mandelbrot set. Pick a point in the black region.' };
      return { ok: true };
    },
    reveal() { if (spec.solution) { [ca, cb] = spec.solution; touched = true; draw(); } },
  };
}
