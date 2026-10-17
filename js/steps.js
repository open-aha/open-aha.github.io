// Step renderers. Each returns a controller:
// { el, kind: 'explain'|'question', ready(), check() -> {correct, msg}, reveal(), retry(), destroy() }

import { h, shuffle } from './lib/dom.js';
import { md, mdi } from './lib/md.js';
import { icons } from './lib/icons.js';
import { createWidget } from './widgets/index.js';
import { sticky } from './lib/svg.js';

const KICKERS = {
  explain: ['bulb', 'Concept'],
  mcq: ['question', 'Question'],
  multi: ['question', 'Select all that apply'],
  numeric: ['pencil', 'Your turn'],
  interactive: ['hand', 'Try it'],
  order: ['layers', 'Put in order'],
};

function header(step) {
  const [ic, label] = KICKERS[step.type] || KICKERS.explain;
  const kick = h('div.step-kicker', { html: icons[ic] + `<span>${step.kicker || label}</span>` });
  return [kick, step.title ? h('h2.step-title', { html: mdi(step.title) }) : null, step.body ? h('div.prose', { html: md(step.body) }) : null];
}

function mountWidget(step, onChange) {
  if (!step.widget) return { el: null, ctrl: null };
  const box = h('div.figure');
  const ctrl = createWidget(box, step.widget, { onChange });
  if (step.widget.caption) box.append(h('div.caption', { html: mdi(step.widget.caption) }));
  // readouts keep the tallest height they have reached (at the current width), so text that wraps
  // onto a second line for some values does not make the figure and its sliders jump up and down
  const observers = [...box.querySelectorAll('.w-readout')].map(steady);
  if (ctrl && observers.length) {
    const destroy = ctrl.destroy;
    ctrl.destroy = () => { observers.forEach((o) => o.disconnect()); destroy?.call(ctrl); };
  }
  return { el: box, ctrl };
}

function steady(el) {
  let width = 0, tallest = 0;
  const ro = new ResizeObserver(() => {
    const w = el.clientWidth;
    if (!w || el.dataset.reserved) return; // the widget reserved its own height
    if (w !== width) { width = w; tallest = 0; el.style.minHeight = ''; }
    const ht = el.offsetHeight;
    if (ht > tallest) { tallest = ht; el.style.minHeight = ht + 'px'; }
  });
  ro.observe(el);
  return ro;
}

export function renderStep(step, ctx) {
  const fn = RENDERERS[step.type];
  if (!fn) throw new Error('Unknown step type ' + step.type);
  return fn(step, ctx);
}

const RENDERERS = {
  explain(step, ctx) {
    const { el: fig, ctrl } = mountWidget(step, () => ctx.onReady());
    const el = h('section.step', header(step), fig, step.after ? h('div.prose', { html: md(step.after) }) : null);
    return {
      el,
      kind: 'explain',
      // optional gate: widget must report ready (e.g. "drag until...")
      ready: () => (step.gate && ctrl?.ready ? ctrl.ready() : true),
      destroy: () => ctrl?.destroy?.(),
    };
  },

  mcq(step, ctx) {
    return choiceStep(step, ctx, false);
  },
  multi(step, ctx) {
    return choiceStep(step, ctx, true);
  },

  numeric(step, ctx) {
    const { el: fig, ctrl } = mountWidget(step, () => {});
    const input = h('input.num-input', {
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
      spellcheck: 'false',
      placeholder: step.placeholder || '?',
      'aria-label': 'Your answer',
      onInput: () => {
        input.classList.remove('is-wrong');
        ctx.onReady();
      },
    });
    const row = h('div.numeric',
      step.lhs ? h('span.lhs', { html: mdi(step.lhs) }) : null,
      input,
      step.unit ? h('span.unit', { html: mdi(step.unit) }) : null);
    const el = h('section.step', header(step), fig, step.prompt ? h('div.prompt', { html: mdi(step.prompt) }) : null, row);
    setTimeout(() => {
      if (window.matchMedia('(hover: hover)').matches) input.focus({ preventScroll: true });
    }, 380);
    return {
      el,
      kind: 'question',
      ready: () => parseNum(input.value) != null,
      check() {
        const v = parseNum(input.value);
        const ans = step.answer;
        const tol = step.tol ?? (step.relTol ? Math.abs(ans) * step.relTol : 1e-6 + Math.abs(ans) * 1e-9);
        const ok = Math.abs(v - ans) <= tol;
        input.classList.toggle('is-correct', ok);
        input.classList.toggle('is-wrong', !ok);
        input.disabled = ok;
        let msg = null;
        if (!ok && step.wrong) {
          const w = step.wrong.find((w) => Math.abs(v - w.v) <= (w.tol ?? tol));
          if (w) msg = w.why;
        }
        if (!ok && !msg && step.hint) msg = step.hint;
        return { correct: ok, msg };
      },
      reveal() {
        input.value = step.display ?? String(step.answer);
        input.classList.remove('is-wrong');
        input.classList.add('is-correct');
        input.disabled = true;
      },
      retry() {
        input.classList.remove('is-wrong');
        input.select();
        input.focus();
      },
      destroy: () => ctrl?.destroy?.(),
    };
  },

  interactive(step, ctx) {
    const { el: fig, ctrl } = mountWidget(step, () => ctx.onReady());
    const el = h('section.step', header(step), step.prompt ? h('div.prompt', { html: mdi(step.prompt) }) : null, fig);
    return {
      el,
      kind: 'question',
      ready: () => (ctrl?.ready ? ctrl.ready() : true),
      check: () => {
        const r = ctrl.check();
        return { correct: r.ok, msg: r.msg };
      },
      reveal: () => ctrl.reveal?.(),
      retry: () => ctrl.retry?.(),
      destroy: () => ctrl?.destroy?.(),
    };
  },

  order(step, ctx) {
    const items = step.items.map((t, i) => ({ t, i }));
    let order = shuffle(items);
    // never start in the solved order
    while (order.every((o, k) => o.i === k) && items.length > 1) order = shuffle(items);
    const list = h('ol.order-list', { 'aria-label': 'Reorder the items' });
    let touched = false;

    const renderList = () => {
      list.replaceChildren(
        ...order.map((o, k) => {
          const li = h('li.order-item', { dataset: { i: o.i } },
            h('span.grip', { html: icons.grip, 'aria-hidden': 'true' }),
            h('span.otext', { html: mdi(o.t) }),
            h('span.moves',
              h('button', { type: 'button', 'aria-label': 'Move up', html: icons.up, disabled: k === 0, onClick: () => move(k, -1) }),
              h('button', { type: 'button', 'aria-label': 'Move down', html: icons.down, disabled: k === order.length - 1, onClick: () => move(k, 1) })));
          enableDrag(li, k);
          return li;
        }),
      );
    };
    const move = (k, d) => {
      const j = k + d;
      if (j < 0 || j >= order.length) return;
      [order[k], order[j]] = [order[j], order[k]];
      touched = true;
      clearMarks();
      renderList();
      ctx.onReady();
      list.children[j]?.querySelectorAll('button')[d < 0 ? 0 : 1]?.focus();
    };
    const clearMarks = () => list.querySelectorAll('.order-item').forEach((n) => n.classList.remove('is-correct', 'is-wrong'));

    function enableDrag(li, k) {
      const grip = li.querySelector('.grip');
      let startY = 0, h0 = 0, cur = k;
      grip.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        grip.setPointerCapture(e.pointerId);
        startY = e.clientY;
        h0 = li.getBoundingClientRect().height + 10;
        cur = k;
        li.classList.add('dragging');
      });
      grip.addEventListener('pointermove', (e) => {
        if (!li.classList.contains('dragging')) return;
        const dy = e.clientY - startY;
        li.style.transform = `translateY(${dy}px)`;
        const target = sticky(cur, k + dy / h0, 0, order.length - 1, 1); // favour the current slot so a resting hand does not flicker
        if (target !== cur) {
          cur = target;
          [...list.children].forEach((sib, idx) => {
            if (sib === li) return;
            let shift = 0;
            if (k < cur && idx > k && idx <= cur) shift = -h0;
            if (k > cur && idx < k && idx >= cur) shift = h0;
            sib.style.transform = shift ? `translateY(${shift}px)` : '';
          });
        }
      });
      const end = () => {
        if (!li.classList.contains('dragging')) return;
        li.classList.remove('dragging');
        if (cur !== k) {
          const [m] = order.splice(k, 1);
          order.splice(cur, 0, m);
          touched = true;
          clearMarks();
          ctx.onReady();
        }
        renderList();
      };
      grip.addEventListener('pointerup', end);
      grip.addEventListener('pointercancel', end);
    }

    renderList();
    const { el: fig, ctrl } = mountWidget(step, () => {});
    const el = h('section.step', header(step), fig, step.prompt ? h('div.prompt', { html: mdi(step.prompt) }) : null, list);
    return {
      el,
      kind: 'question',
      ready: () => touched,
      check() {
        let ok = true;
        [...list.children].forEach((li, k) => {
          const good = order[k].i === k;
          ok = ok && good;
          li.classList.toggle('is-correct', good);
          li.classList.toggle('is-wrong', !good);
        });
        return { correct: ok, msg: ok ? null : 'Items in red are out of place.' };
      },
      reveal() {
        order = items.slice();
        renderList();
        list.querySelectorAll('.order-item').forEach((n) => n.classList.add('is-correct'));
      },
      retry() {
        clearMarks();
      },
      destroy: () => ctrl?.destroy?.(),
    };
  },
};

function choiceStep(step, ctx, multi) {
  const { el: fig, ctrl } = mountWidget(step, () => {});
  const choices = step.choices.map((c, i) => ({ ...c, i }));
  const ordered = step.fixed ? choices : shuffle(choices);
  const selected = new Set();
  const btns = [];
  const group = h(`div.choices${step.cols === 2 ? '.cols-2' : ''}`, { role: multi ? 'group' : 'radiogroup', 'aria-label': 'Answer choices' });
  ordered.forEach((c, k) => {
    const b = h(`button.choice${multi ? '.multi' : ''}`, {
      type: 'button',
      role: multi ? 'checkbox' : 'radio',
      'aria-checked': 'false',
      onClick: () => toggle(c, b),
    },
    h('span.key-hint', { 'aria-hidden': 'true' }, String(k + 1)),
    h('span.ctext', { html: mdi(c.t) }));
    b._c = c;
    btns.push(b);
    group.append(b);
  });
  function toggle(c, b) {
    if (b.disabled) return;
    btns.forEach((x) => x.classList.remove('is-wrong'));
    if (multi) {
      if (selected.has(c.i)) selected.delete(c.i);
      else selected.add(c.i);
    } else {
      selected.clear();
      selected.add(c.i);
    }
    btns.forEach((x) => x.setAttribute('aria-checked', selected.has(x._c.i) ? 'true' : 'false'));
    ctx.onReady();
  }
  const el = h('section.step', header(step), fig, step.prompt ? h('div.prompt', { html: mdi(step.prompt) }) : null, group);
  return {
    el,
    kind: 'question',
    choose(k) {
      const b = btns[k];
      if (b) toggle(b._c, b);
    },
    ready: () => selected.size > 0,
    check() {
      if (!multi) {
        const c = choices[[...selected][0]];
        const b = btns.find((x) => x._c.i === c.i);
        if (c.ok) {
          b.classList.add('is-correct');
          btns.forEach((x) => {
            x.disabled = true;
            if (x !== b) x.classList.add('is-dim');
          });
          return { correct: true, msg: c.why || null };
        }
        b.classList.add('is-wrong');
        b.disabled = true;
        b.classList.add('is-dim');
        selected.clear();
        b.setAttribute('aria-checked', 'false');
        return { correct: false, msg: c.why || null };
      }
      const want = new Set(choices.filter((c) => c.ok).map((c) => c.i));
      const ok = want.size === selected.size && [...want].every((i) => selected.has(i));
      if (ok) {
        btns.forEach((x) => {
          x.disabled = true;
          if (want.has(x._c.i)) x.classList.add('is-correct');
          else x.classList.add('is-dim');
        });
        return { correct: true };
      }
      // say how many are wrong without giving away which
      const wrongPicked = [...selected].filter((i) => !want.has(i));
      const missed = [...want].filter((i) => !selected.has(i));
      const firstWhy = wrongPicked.map((i) => choices[i].why).find(Boolean);
      let msg = firstWhy;
      if (!msg) {
        if (wrongPicked.length && missed.length) msg = 'Some of your picks are off, and you missed at least one.';
        else if (wrongPicked.length) msg = `${wrongPicked.length === 1 ? 'One' : 'Some'} of your picks ${wrongPicked.length === 1 ? "doesn't" : "don't"} belong.`;
        else msg = `You're missing ${missed.length === 1 ? 'one' : 'some'}.`;
      }
      return { correct: false, msg };
    },
    reveal() {
      btns.forEach((x) => {
        x.disabled = true;
        x.classList.remove('is-wrong', 'is-dim');
        x.setAttribute('aria-checked', 'false');
        if (x._c.ok) x.classList.add('is-correct');
        else x.classList.add('is-dim');
      });
    },
    retry() {
      if (multi) btns.forEach((x) => x.classList.remove('is-wrong'));
    },
    destroy: () => ctrl?.destroy?.(),
  };
}

// Accepts "3", "-2.5", "3/4", "1,5", "−2", "2e3"
export function parseNum(str) {
  if (str == null) return null;
  let s = String(str).trim().replace(/−/g, '-').replace(/\s+/g, '');
  if (!s) return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ''); // 6,400 → 6400
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.'); // decimal comma: 2,5 → 2.5
  const sci = s.match(/^(?:(-?\d+(?:\.\d+)?)[×x*·])?10\^\(?(-?\d+)\)?$/i); // 3×10^9, 10^-3
  if (sci) return (sci[1] != null ? parseFloat(sci[1]) : 1) * 10 ** parseInt(sci[2], 10);
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    return d === 0 ? null : parseFloat(frac[1]) / d;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return null;
  return parseFloat(s);
}
