// Random sampler: run trials, chart frequencies vs theory, optional running proportion.
// spec: { outcomes:[labels], probs:[theory], trial:()=>index, batches:[1,10,100,1000], running:index|null,
//         needTrials, goal:(counts,total)=>..., readout:(counts,total)=>md, color }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, Plot, fmt, fix } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

export function sampler(box, spec, api) {
  const n = spec.outcomes.length;
  let counts = new Array(n).fill(0), total = 0;
  let history = []; // running proportion samples [total, proportion]
  const W = 600, H = spec.height || 240;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Frequency chart');
  const padL = 44, padB = 34, padT = 16, padR = 12;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxP = spec.ymax ?? Math.min(1, Math.max(...spec.probs) * 1.8 + 0.05);
  const Y = (v) => padT + innerH - (v / maxP) * innerH;
  // axes
  for (let k = 0; k <= 4; k++) {
    const v = (maxP * k) / 4;
    svg.append(s('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: 'grid-line' }));
    svg.append(s('text', { x: padL - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick', text: `${Math.round(v * 100)}%` }));
  }
  const bw = innerW / n;
  const bars = [], theo = [], vals = [];
  spec.outcomes.forEach((lab, i) => {
    const x = padL + i * bw;
    const bar = s('rect', { x: x + bw * 0.16, width: bw * 0.68, y: Y(0), height: 0, rx: 4, class: `fl-${spec.color || 'blue'}` });
    const t = s('line', { x1: x + bw * 0.08, x2: x + bw * 0.92, y1: Y(spec.probs[i]), y2: Y(spec.probs[i]), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' });
    const v = s('text', { x: x + bw / 2, y: Y(0) - 6, 'text-anchor': 'middle', class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))' });
    svg.append(bar, t, v, s('text', { x: x + bw / 2, y: H - padB + 18, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: lab }));
    bars.push(bar); theo.push(t); vals.push(v);
  });

  let rplot = null, rpath = null;
  if (spec.running != null) {
    rplot = new Plot({ width: 600, height: 200, xmin: 0, xmax: 100, ymin: 0, ymax: 1, padL: 44, padB: 30, padT: 14, padR: 12 });
    rplot.svg.style.borderTop = '2px solid var(--line)';
    rpath = s('path', { class: 'curve st-coral', style: 'stroke-width:2.5' });
    rplot.layers.main.append(rpath);
  }

  const readout = h('div.w-readout');
  const ctrls = h('div.w-controls.center');
  for (const b of spec.batches || [1, 10, 100, 1000]) {
    ctrls.append(button(b === 1 ? (spec.oneLabel || 'Run 1') : `Run ${b}`, () => run(b), { primary: b === 1 }));
  }
  ctrls.append(button('Reset', () => { counts.fill(0); total = 0; history = []; draw(); api.onChange(); }, { icon: icons.reset }));
  box.append(svg);
  if (rplot) box.append(rplot.svg);
  box.append(readout, ctrls);

  function run(k) {
    for (let j = 0; j < k; j++) {
      counts[spec.trial()]++;
      total++;
      if (spec.running != null) {
        if (total <= 200 || total % Math.ceil(total / 200) === 0) history.push([total, counts[spec.running] / total]);
      }
    }
    draw();
    api.onChange();
  }

  function draw() {
    counts.forEach((c, i) => {
      const f = total ? c / total : 0;
      const y = Y(Math.min(f, maxP));
      bars[i].setAttribute('y', y);
      bars[i].setAttribute('height', Y(0) - y);
      vals[i].setAttribute('y', y - 6);
      vals[i].textContent = total ? `${fix(f * 100, 1)}%` : '';
    });
    if (rplot) {
      const xmax = Math.max(100, total);
      rplot.xmax = xmax;
      // rebuild axes for the new range
      rplot.layers.grid.replaceChildren();
      rplot.layers.axes.replaceChildren();
      const step = niceStep(xmax);
      rplot.grid(step, 0.25);
      rplot.axes({ xticks: step, yticks: 0.25, xlabel: 'trials', ylabel: spec.runningLabel || 'proportion', yfmt: (v) => `${Math.round(v * 100)}%` });
      rplot.layers.under.replaceChildren(s('line', { x1: rplot.left, x2: rplot.right, y1: rplot.Y(spec.probs[spec.running]), y2: rplot.Y(spec.probs[spec.running]), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
      rpath.setAttribute('d', history.map(([t, v], i) => `${i ? 'L' : 'M'}${rplot.X(t).toFixed(1)} ${rplot.Y(v).toFixed(1)}`).join(''));
    }
    readout.innerHTML = mdi(spec.readout ? spec.readout(counts, total) : `$n = ${total}$ trials`);
  }
  draw();

  return {
    ready: () => total >= (spec.needTrials || 1),
    check() {
      const r = spec.goal ? spec.goal(counts, total) : true;
      if (typeof r === 'object') return r;
      return { ok: !!r, msg: r ? null : spec.hint };
    },
  };
}

function niceStep(range) {
  const raw = range / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}
