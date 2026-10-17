// Mandelbrot set on a canvas, with click-to-zoom and an iteration slider.
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { slider, button } from './controls.js';
import { icons } from '../lib/icons.js';

export function mandel(box, spec, api) {
  const W = 600, H = 400;
  const canvas = h('canvas', { width: W * 2, height: H * 2, style: { width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in', touchAction: 'manipulation' }, 'aria-label': 'Mandelbrot set. Tap to zoom in.' });
  const ctx = canvas.getContext('2d');
  let cx = -0.6, cy = 0, scale = 3.2 / W; // complex units per CSS pixel
  let maxIter = spec.iter || 80, zooms = 0;
  const readout = h('div.w-readout');
  const iterSlider = slider({ label: 'detail', min: 20, max: 400, step: 10, value: maxIter, color: 'violet', format: (v) => `${v} steps`, onInput: (v) => { maxIter = v; render(); } });
  box.append(canvas, readout, h('div.w-controls', iterSlider.el), h('div.w-controls.center', button('Reset view', () => { cx = -0.6; cy = 0; scale = 3.2 / W; zooms = 0; render(); }, { icon: icons.reset })));

  function color(n) {
    if (n >= maxIter) return [17, 17, 17];
    const t = n / maxIter;
    const a = Math.sqrt(t);
    return [Math.round(69 + 186 * a), Math.round(109 * (1 - a) + 107 * a), Math.round(255 * (1 - a) + 74 * a)];
  }
  function render() {
    const img = ctx.createImageData(W * 2, H * 2);
    const s2 = scale / 2;
    for (let py = 0; py < H * 2; py++) {
      const y0 = cy - (py - H) * s2; // imaginary axis points up
      for (let px = 0; px < W * 2; px++) {
        const x0 = cx + (px - W) * s2;
        let x = 0, y = 0, n = 0;
        while (x * x + y * y <= 4 && n < maxIter) {
          const xt = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xt;
          n++;
        }
        const [r, g, b] = color(n);
        const i = (py * W * 2 + px) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    readout.innerHTML = mdi(`zoom ×${Math.round(3.2 / W / scale)} · centre $${cx.toFixed(4)} ${cy < 0 ? '-' : '+'} ${Math.abs(cy).toFixed(4)}i$ · tap to zoom in`);
  }
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W, py = ((e.clientY - rect.top) / rect.height) * H;
    cx += (px - W / 2) * scale;
    cy -= (py - H / 2) * scale;
    scale /= 3;
    zooms++;
    render();
    api.onChange();
  });
  render();
  return { ready: () => zooms >= (spec.needZooms || 0), check: () => ({ ok: true }) };
}
