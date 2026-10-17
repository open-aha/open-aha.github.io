// Graph (network) puzzles.
// mode 'color': click nodes to cycle colours; goal = proper colouring with <= k colours.
// mode 'trace': click nodes in sequence to walk along edges; goal = use every edge exactly once.
// mode 'tour':  click nodes in sequence; goal = visit every node exactly once and return to the
//               start (a Hamiltonian cycle). With weights, optional maxLength caps the total.
// mode 'pick':  click edges to select them; goal = a spanning tree, optional maxWeight cap.
// mode 'drag':  drag nodes around; goal = no two edges cross. solution = [[x,y],...].
// mode 'view':  static drawing. spec: { nodes:[[x,y,label?]], edges:[[a,b],...], mode, k, weights }
import { h } from '../lib/dom.js';
import { mdi } from '../lib/md.js';
import { s, svgRoot, draggable } from '../lib/svg.js';
import { button } from './controls.js';
import { icons } from '../lib/icons.js';

const PALETTE = ['var(--card)', 'var(--blue)', 'var(--coral)', 'var(--teal)', 'var(--amber)'];

// Do segments p1-p2 and p3-p4 cross at an interior point?
function crosses([x1, y1], [x2, y2], [x3, y3], [x4, y4]) {
  const d = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d1 = d(x3, y3, x4, y4, x1, y1), d2 = d(x3, y3, x4, y4, x2, y2);
  const d3 = d(x1, y1, x2, y2, x3, y3), d4 = d(x1, y1, x2, y2, x4, y4);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

export function network(box, spec, api) {
  const W = spec.w || 600, H = spec.h || 340;
  const R = spec.r || 18;
  const svg = svgRoot(W, H);
  svg.setAttribute('aria-label', 'Network of points and lines');
  const mode = spec.mode || 'view';
  const nodes = spec.nodes, edges = spec.edges;
  const pos = nodes.map(([x, y]) => [x, y]);
  const start = pos.map((p) => [...p]);
  const edgeEls = edges.map(([a, b], i) => {
    const [x1, y1] = pos[a], [x2, y2] = pos[b];
    const el = s('line', { x1, y1, x2, y2, stroke: 'var(--ink-3)', 'stroke-width': 4, 'stroke-linecap': 'round' });
    svg.append(el);
    if (mode === 'pick') {
      const hit = s('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 22, style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': `Line ${i + 1}` });
      hit.addEventListener('click', () => clickEdge(i));
      hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickEdge(i); } });
      svg.append(hit);
    }
    return el;
  });
  if (spec.weights) edges.forEach(([a, b], i) => {
    const [x1, y1] = pos[a], [x2, y2] = pos[b];
    const g = s('g', { style: 'pointer-events:none' });
    g.append(s('rect', { x: (x1 + x2) / 2 - 13, y: (y1 + y2) / 2 - 11, width: 26, height: 22, rx: 6, class: 'fl-card', stroke: 'var(--line-2)' }));
    g.append(s('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: String(spec.weights[i]) }));
    svg.append(g);
  });
  const colors = nodes.map(() => 0);
  let path = [];
  const used = new Set();
  const picked = new Set();
  const nodeEls = nodes.map(([x, y, label], i) => {
    const live = mode !== 'view' && mode !== 'pick';
    const g = s('g', { style: live ? 'cursor:pointer' : '', tabindex: live && mode !== 'drag' ? 0 : null, role: live ? 'button' : null, 'aria-label': `Point ${label || i + 1}` });
    const c = s('circle', { cx: x, cy: y, r: R, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 3 });
    const t = s('text', { x, y: y + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: label ?? '' });
    g.append(c, t);
    if (mode === 'drag') {
      draggable(g, svg, {
        onMove: ({ x: px, y: py }) => {
          pos[i] = [Math.max(R, Math.min(W - R, px)), Math.max(R, Math.min(H - R, py))];
          draw();
        },
        onEnd: () => api.onChange(),
      });
    } else if (live) {
      g.addEventListener('click', () => clickNode(i));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickNode(i); } });
    }
    svg.append(g);
    return { c, t };
  });
  const readout = h('div.w-readout');
  box.append(svg, readout);
  const resetLabel = { trace: 'Start over', tour: 'Start over', color: 'Clear colours', pick: 'Clear lines', drag: 'Start over' }[mode];
  if (resetLabel) box.append(h('div.w-controls.center', button(resetLabel, reset, { icon: icons.reset })));

  function edgeIndex(a, b) {
    return edges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  }
  const tourDone = () => path.length === nodes.length + 1 && path[0] === path[path.length - 1];
  const sum = (set) => [...set].reduce((t, e) => t + (spec.weights ? spec.weights[e] : 1), 0);
  function clickNode(i) {
    if (mode === 'color') {
      colors[i] = (colors[i] % (spec.k || 3)) + 1;
    } else if (mode === 'trace' || mode === 'tour') {
      if (!path.length) path.push(i);
      else {
        const last = path[path.length - 1];
        const e = edgeIndex(last, i);
        const revisit = mode === 'tour' && (tourDone() || (path.includes(i) && !(i === path[0] && path.length === nodes.length)));
        if (e < 0 || used.has(e) || revisit) {
          flash(nodeEls[i].c);
          return;
        }
        used.add(e);
        path.push(i);
      }
    }
    draw();
    api.onChange();
  }
  function clickEdge(i) {
    if (picked.has(i)) picked.delete(i);
    else picked.add(i);
    draw();
    api.onChange();
  }
  function flash(el) {
    el.animate?.([{ fill: 'var(--error-tint)' }, { fill: 'var(--card)' }], { duration: 400 });
  }
  function reset() {
    colors.fill(0);
    path = [];
    used.clear();
    picked.clear();
    start.forEach((p, i) => (pos[i] = [...p]));
    draw();
    api.onChange();
  }
  function conflicts() {
    return edges.filter(([a, b]) => colors[a] && colors[a] === colors[b]).length;
  }
  function crossingPairs() {
    const out = [];
    for (let i = 0; i < edges.length; i++)
      for (let j = i + 1; j < edges.length; j++) {
        const [a, b] = edges[i], [c, d] = edges[j];
        if (a === c || a === d || b === c || b === d) continue;
        if (crosses(pos[a], pos[b], pos[c], pos[d])) out.push(i, j);
      }
    return out;
  }
  // Components of the picked edges (union-find); returns { comps, cycle }.
  function pickedForest() {
    const par = nodes.map((_, i) => i);
    const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
    let cycle = false;
    for (const e of picked) {
      const [a, b] = edges[e];
      const ra = find(a), rb = find(b);
      if (ra === rb) cycle = true;
      else par[ra] = rb;
    }
    return { comps: new Set(nodes.map((_, i) => find(i))).size, cycle };
  }
  function draw() {
    let bad = new Set();
    if (mode === 'drag') {
      bad = new Set(crossingPairs());
      edgeEls.forEach((el, i) => {
        const [a, b] = edges[i];
        el.setAttribute('x1', pos[a][0]); el.setAttribute('y1', pos[a][1]);
        el.setAttribute('x2', pos[b][0]); el.setAttribute('y2', pos[b][1]);
      });
      nodeEls.forEach(({ c, t }, i) => {
        c.setAttribute('cx', pos[i][0]); c.setAttribute('cy', pos[i][1]);
        t.setAttribute('x', pos[i][0]); t.setAttribute('y', pos[i][1] + 5);
      });
    }
    nodeEls.forEach(({ c, t }, i) => {
      if (mode === 'color') {
        c.setAttribute('fill', PALETTE[colors[i]]);
        t.setAttribute('style', `font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));${colors[i] ? 'fill:#fff' : ''}`);
      } else if (mode === 'trace' || mode === 'tour') {
        const here = path[path.length - 1] === i;
        c.setAttribute('fill', here ? 'var(--violet)' : path.includes(i) ? 'var(--violet-soft)' : 'var(--card)');
        t.setAttribute('style', `font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));${here ? 'fill:#fff' : ''}`);
      }
    });
    edgeEls.forEach((el, i) => {
      const clash = (mode === 'color' && colors[edges[i][0]] && colors[edges[i][0]] === colors[edges[i][1]]) || bad.has(i);
      const on = used.has(i) || picked.has(i);
      el.setAttribute('stroke', clash ? 'var(--error)' : on ? 'var(--violet)' : 'var(--ink-3)');
      el.setAttribute('stroke-width', on ? 7 : clash ? 5 : 4);
      el.setAttribute('opacity', mode === 'pick' && !on ? 0.45 : 1);
    });
    if (mode === 'color') {
      const uncolored = colors.filter((c) => !c).length;
      readout.innerHTML = mdi(uncolored ? `Tap points to colour them. ${uncolored} left.` : conflicts() ? `${conflicts()} line${conflicts() > 1 ? 's join' : ' joins'} two points of the same colour (shown in red).` : `Every line joins two different colours, using ${new Set(colors).size} colours.`);
    } else if (mode === 'trace') {
      readout.innerHTML = mdi(!path.length ? 'Tap a point to start.' : `${used.size} of ${edges.length} lines used${used.size === edges.length ? ': every line exactly once!' : ''}`);
    } else if (mode === 'tour') {
      const len = spec.weights ? ` · length **${sum(used)}**` : '';
      readout.innerHTML = mdi(!path.length ? 'Tap a point to start.' : tourDone() ? `Back at the start after visiting all ${nodes.length} points${len}.` : `${new Set(path).size} of ${nodes.length} points visited${len}`);
    } else if (mode === 'pick') {
      const { comps, cycle } = pickedForest();
      const w = spec.weights ? ` · total **${sum(picked)}**` : '';
      readout.innerHTML = mdi(`${picked.size} line${picked.size === 1 ? '' : 's'} chosen${w} · ${comps === 1 ? 'everything connected' : `${comps} separate pieces`}${cycle ? ' · contains a loop' : ''}`);
    } else if (mode === 'drag') {
      const n = bad.size ? crossingPairs().length / 2 : 0;
      readout.innerHTML = mdi(n ? `**${n}** crossing${n > 1 ? 's' : ''} (red lines). Drag the points.` : 'No crossings!');
    } else { readout.innerHTML = ''; readout.hidden = true; } // a view-only network: its caption is shown under the figure
  }
  draw();
  return {
    ready: () => (mode === 'color' ? colors.every(Boolean) : mode === 'trace' || mode === 'tour' ? path.length > 1 : mode === 'pick' ? picked.size > 0 : true),
    check() {
      if (mode === 'color') {
        if (conflicts()) return { ok: false, msg: 'Some lines join two points of the same colour.' };
        const k = new Set(colors).size;
        if (spec.maxColors && k > spec.maxColors) return { ok: false, msg: `Valid, but you used ${k} colours. Can you do it with ${spec.maxColors}?` };
        return { ok: true };
      }
      if (mode === 'trace') {
        if (used.size === edges.length) return { ok: true };
        return { ok: false, msg: `You used ${used.size} of ${edges.length} lines. Each line must be used exactly once. Try starting somewhere else.` };
      }
      if (mode === 'tour') {
        if (!tourDone()) return { ok: false, msg: `Visit all ${nodes.length} points once each, then step back to where you started.` };
        if (spec.maxLength && sum(used) > spec.maxLength) return { ok: false, msg: `A valid round trip of length ${sum(used)}. Can you find one of ${spec.maxLength} or less?` };
        return { ok: true };
      }
      if (mode === 'pick') {
        const { comps, cycle } = pickedForest();
        if (cycle) return { ok: false, msg: 'Your lines contain a loop, so at least one of them is wasted.' };
        if (comps > 1) return { ok: false, msg: 'Not everything is connected yet.' };
        if (spec.maxWeight && sum(picked) > spec.maxWeight) return { ok: false, msg: `That connects everything with total ${sum(picked)}. You can do better.` };
        return { ok: true };
      }
      if (mode === 'drag') {
        const n = crossingPairs().length / 2;
        return n ? { ok: false, msg: `There ${n > 1 ? `are still ${n} crossings` : 'is still 1 crossing'}.` } : { ok: true };
      }
      return { ok: true };
    },
    reveal() {
      if (mode === 'color' && spec.solution) spec.solution.forEach((c, i) => (colors[i] = c));
      if ((mode === 'trace' || mode === 'tour') && spec.solution) {
        path = [spec.solution[0]];
        used.clear();
        for (let i = 1; i < spec.solution.length; i++) { used.add(edgeIndex(spec.solution[i - 1], spec.solution[i])); path.push(spec.solution[i]); }
      }
      if (mode === 'pick' && spec.solution) { picked.clear(); spec.solution.forEach((e) => picked.add(e)); }
      if (mode === 'drag' && spec.solution) spec.solution.forEach((p, i) => (pos[i] = [...p]));
      draw();
    },
  };
}
