import { h, burst, clear } from './lib/dom.js';
import { md, mdi } from './lib/md.js';
import { icons } from './lib/icons.js';
import { renderStep } from './steps.js';
import { store } from './store.js';
import { openSuggest } from './feedback.js';
import { openShare } from './share.js';
import { paths } from './routes.js';

const PRAISE = ['Correct!', 'Nice work!', 'Exactly right!', 'Spot on!', 'You got it!', 'Brilliant!'];
const NOT_YET = ['Not quite', 'Not yet', 'Close, but no'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SUGGEST_TIP_MAX = 3; // times the "suggest an improvement" pointer is ever shown

export function renderLesson(root, { course, lesson, next, go, start = 0 }) {
  clear(root);
  store.setLast(course.id, lesson.id);

  const steps = lesson.steps;
  let i = 0;
  let ctrl = null;
  let state = 'idle';
  let attempts = 0;
  const firstTry = []; // per question step: true/false
  let xp = 0;
  let finished = false;
  const done = new Set(); // steps already completed (revisited in review mode)

  const player = h(`div.player.subject-${course.subject}`);
  const seg = h('div.segbar', { 'aria-hidden': 'true' }, steps.map(() => h('span')));
  const closeBtn = h('button.icon-btn', { type: 'button', 'aria-label': 'Exit lesson', html: icons.x, onClick: () => exit() });
  const progressLabel = h('span.sr-only', { 'aria-live': 'polite' });
  const suggestBtn = h('button.icon-btn.suggest-btn', { type: 'button', 'aria-label': 'Suggest an improvement', title: 'Suggest an improvement', html: icons.flag,
    onClick: () => {
      hideTip();
      openSuggest({ course, lesson, step: finished ? null : i + 1, total: steps.length });
    } });
  const share = () => {
    hideTip();
    openShare({ course, lesson, step: finished ? null : i + 1, total: steps.length });
  };
  const shareBtn = h('button.icon-btn.share-btn', { type: 'button', 'aria-label': 'Share this step', title: 'Share this step', html: icons.share, onClick: share });
  const top = h('header.player-top', closeBtn, h('div.player-title', lesson.title), seg, shareBtn, suggestBtn, progressLabel);
  let tip = null;
  const stage = h('main.stage', { id: 'stage' });

  // action bar
  const fbBadge = h('div.fb-badge');
  const fbTitle = h('strong');
  const fbMsg = h('span');
  const fb = h('div.fb', { role: 'status', 'aria-live': 'polite' }, fbBadge, h('div.fb-text', fbTitle, fbMsg));
  const grow = h('div.grow');
  const secondary = h('button.btn.btn-secondary', { type: 'button', hidden: true });
  const main = h('button.btn.btn-main', { type: 'button' });
  const back = h('button.btn.btn-secondary.back-btn', { type: 'button', 'aria-label': 'Previous step', title: 'Previous step', html: `${icons.left}<span>Back</span>`, hidden: true });
  // after a right answer, a nudge to pass the step on (it opens the same dialog as the top bar's share button)
  const shareBar = h('button.btn.btn-secondary.share-bar-btn', { type: 'button', 'aria-label': 'Share this step', html: `${icons.share}<span>Share</span>`, hidden: true, onClick: share });
  const bar = h('footer.actionbar', h('div.inner', back, fb, grow, shareBar, secondary, main));

  player.append(top, stage, bar);
  root.append(player);
  // the bar is fixed over the page and its height changes (feedback rows, wrapping on phones): keep the stage clear of it
  const barSize = new ResizeObserver(() => player.style.setProperty('--bar-h', `${bar.offsetHeight}px`));
  barSize.observe(bar);

  main.addEventListener('click', onMain);
  secondary.addEventListener('click', onSecondary);
  back.addEventListener('click', goBack);

  const keyHandler = (e) => {
    if (finished && e.key !== 'Enter') return;
    if (document.querySelector('.dialog-backdrop')) {
      if (e.key === 'Escape') document.querySelector('.dialog-backdrop').remove();
      return;
    }
    if (e.key === 'Escape') return exit();
    const tag = e.target.tagName;
    if (e.key === 'Enter') {
      if (tag === 'BUTTON' && e.target !== main) return;
      if (tag === 'INPUT' || tag !== 'BUTTON') {
        e.preventDefault();
        if (!main.disabled) main.click();
      }
      return;
    }
    if (tag === 'INPUT') return;
    if (/^[1-9]$/.test(e.key) && ctrl?.choose && state === 'answering') {
      ctrl.choose(+e.key - 1);
    }
  };
  document.addEventListener('keydown', keyHandler);
  root._cleanup = () => {
    document.removeEventListener('keydown', keyHandler);
    barSize.disconnect();
    ctrl?.destroy?.();
  };

  showStep(Math.min(start, steps.length - 1));

  function updateSeg() {
    [...seg.children].forEach((s, k) => {
      s.classList.toggle('done', k < i || finished);
      s.classList.toggle('current', k === i && !finished);
    });
    progressLabel.textContent = finished ? 'Lesson complete' : `Step ${i + 1} of ${steps.length}`;
  }

  function showStep(k) {
    const prev = stage.firstElementChild;
    hideTip();
    const mount = () => {
      ctrl?.destroy?.();
      clear(stage);
      i = k;
      attempts = 0;
      const step = steps[i];
      ctrl = renderStep(step, { onReady: refresh, course });
      stage.append(ctrl.el);
      state = ctrl.kind === 'explain' ? 'explain' : 'answering';
      setBar();
      if (state === 'answering' && done.has(i)) review();
      updateSeg();
      window.scrollTo({ top: 0 });
    };
    if (prev && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prev.classList.add('leaving');
      setTimeout(mount, 180);
    } else mount();
  }

  function refresh() {
    // a fresh interaction after a wrong answer returns straight to answering
    if (state === 'wrong') state = 'answering';
    if (state === 'answering' || state === 'explain') setBar();
  }

  // an already-completed question, shown again with its answer and explanation
  function review() {
    ctrl.reveal?.();
    state = 'revealed';
    bar.classList.add('is-correct');
    fbBadge.innerHTML = icons.eye;
    fbTitle.textContent = 'Reviewing';
    fbMsg.innerHTML = 'You’ve already answered this one.';
    main.textContent = 'Continue';
    main.className = 'btn btn-main btn-success';
    main.disabled = false;
    showWhy();
  }

  function goBack() {
    if (finished || i === 0) return;
    showStep(i - 1);
  }

  function setBar() {
    bar.classList.remove('is-correct', 'is-wrong');
    secondary.hidden = true;
    shareBar.hidden = true;
    back.hidden = finished || i === 0;
    main.className = 'btn btn-main';
    const step = steps[i];
    if (state === 'explain') {
      main.textContent = step.cta || (i === steps.length - 1 ? 'Finish' : 'Continue');
      main.disabled = !ctrl.ready() && !done.has(i);
    } else if (state === 'answering') {
      main.textContent = 'Check';
      main.disabled = !ctrl.ready();
    }
  }

  function onMain() {
    if (finished) return;
    if (state === 'explain' || state === 'correct' || state === 'revealed') return advance();
    if (state === 'answering') return doCheck();
    if (state === 'wrong') {
      state = 'answering';
      ctrl.retry?.();
      setBar();
      return;
    }
  }

  function onSecondary() {
    if (state === 'correct') {
      showWhy();
      secondary.hidden = true;
    } else if (state === 'wrong') {
      ctrl.reveal?.();
      state = 'revealed';
      bar.classList.remove('is-wrong');
      bar.classList.add('is-correct');
      fbBadge.innerHTML = icons.eye;
      fbTitle.textContent = 'Here’s the answer';
      fbMsg.innerHTML = steps[i].explain ? 'Read the explanation above, then continue.' : '';
      clearNote();
      secondary.hidden = true;
      main.textContent = 'Continue';
      main.className = 'btn btn-main btn-success';
      showWhy();
    }
  }

  function doCheck() {
    if (!ctrl.ready()) return;
    const step = steps[i];
    const r = ctrl.check();
    attempts++;
    if (r.correct) {
      if (attempts === 1) firstTry[i] = true;
      else if (firstTry[i] == null) firstTry[i] = false;
      hideTip();
      const gained = attempts === 1 ? 10 : 5;
      xp += gained;
      state = 'correct';
      bar.classList.add('is-correct');
      fbBadge.innerHTML = icons.check;
      fbTitle.textContent = step.praise || pick(PRAISE);
      fbMsg.innerHTML = '';
      showNote('is-correct', r.msg || step.success ? [['Why it’s right', r.msg || step.success]] : []);
      xpPop(gained);
      main.textContent = 'Continue';
      main.className = 'btn btn-main btn-success';
      main.disabled = false;
      shareBar.hidden = false;
      if (step.explain) {
        secondary.hidden = false;
        secondary.textContent = 'Why?';
      }
      const rect = main.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top);
      main.focus({ preventScroll: true });
    } else {
      firstTry[i] = false;
      state = 'wrong';
      bar.classList.add('is-wrong');
      fbBadge.innerHTML = icons.cross;
      fbTitle.textContent = pick(NOT_YET);
      // longer feedback goes in a card inside the step (where explanations appear), not in the cramped bar
      const parts = [], hint = step.hint || step.widget?.hint;
      if (r.msg && r.msg !== hint) parts.push(['Why it’s not right', r.msg]);
      if (hint && (r.msg === hint || attempts >= 2)) parts.push(['Hint', hint]);
      showNote('is-wrong', parts);
      fbMsg.innerHTML = parts.length ? 'Read the note above, then try again.' : 'Take another look and try again.';
      if (attempts === 2) showTip();
      main.textContent = 'Try again';
      main.className = 'btn btn-main btn-error';
      main.disabled = false;
      secondary.hidden = false;
      secondary.textContent = 'Show answer';
      ctrl.el.classList.remove('shake');
      void ctrl.el.offsetWidth;
      const target = ctrl.el.querySelector('.choices, .numeric, .figure, .order-list');
      if (target) {
        target.classList.remove('shake');
        void target.offsetWidth;
        target.classList.add('shake');
      }
    }
  }

  // feedback card in the step body: [[heading, markdown], ...]
  function clearNote() {
    ctrl.el.querySelector('.note')?.remove();
  }
  function showNote(kind, parts) {
    clearNote();
    if (!parts.length) return;
    const box = h(`div.note.${kind}`, parts.map(([title, text]) => h('div.note-part', h('h4', title), h('div.prose', { html: md(text) }))));
    const why = ctrl.el.querySelector('.why');
    why ? why.before(box) : ctrl.el.append(box);
    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }

  // after a second wrong answer, point at the flag button (only the first few times ever)
  function showTip() {
    if (tip || store.tipCount('suggest') >= SUGGEST_TIP_MAX) return;
    store.countTip('suggest');
    tip = h('div.suggest-tip', { role: 'status' },
      h('p', 'Is this step unclear? Use this button to suggest how we could explain it better.'),
      h('button.suggest-tip-close', { type: 'button', 'aria-label': 'Dismiss', html: icons.x, onClick: hideTip }));
    top.append(tip);
  }
  function hideTip() {
    tip?.remove();
    tip = null;
  }

  // a small "+10 XP" that floats up under the top bar and fades away
  function xpPop(n) {
    player.querySelector('.xp-pop')?.remove();
    const pop = h('div.xp-pop', { 'aria-hidden': 'true', html: `${icons.bolt || ''}<span>+${n} XP</span>` });
    player.append(pop);
    pop.addEventListener('animationend', () => pop.remove());
    setTimeout(() => pop.remove(), 2400);
  }

  function showWhy() {
    const step = steps[i];
    if (!step.explain || ctrl.el.querySelector('.why')) return;
    const box = h('div.why', h('h4', 'Explanation'), h('div.prose', { html: md(step.explain) }));
    ctrl.el.append(box);
    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  function advance() {
    done.add(i);
    if (i < steps.length - 1) showStep(i + 1);
    else finish();
  }

  function finish() {
    finished = true;
    hideTip();
    back.hidden = true;
    ctrl?.destroy?.();
    const qs = firstTry.filter((v) => v != null);
    const acc = qs.length ? qs.filter(Boolean).length / qs.length : 1;
    const already = store.lesson(course.id, lesson.id)?.done;
    const bonus = already ? 5 : 20;
    xp += bonus;
    store.addXp(xp);
    store.completeLesson(course.id, lesson.id, { accuracy: acc, xp });
    const streak = store.tickStreak();
    updateSeg();

    bar.classList.remove('is-correct', 'is-wrong');
    shareBar.hidden = true;
    secondary.hidden = false;
    secondary.textContent = 'Back to course';
    secondary.onclick = () => go(paths.course(course.id));
    main.className = 'btn btn-main';
    main.disabled = false;
    main.textContent = next ? 'Next lesson' : 'Finish course';
    main.onclick = () => go(next ? paths.lesson(course.id, next.id) : paths.course(course.id));
    main.removeEventListener('click', onMain);
    secondary.removeEventListener('click', onSecondary);

    clear(stage);
    const recap = lesson.recap?.length
      ? h('div.recap', h('h4', 'What you learned'), h('ul', lesson.recap.map((r) => h('li', { html: mdi(r) }))))
      : null;
    const pct = Math.round(acc * 100);
    stage.append(
      h('section.complete.step',
        h('div.medal', { html: medal(course.subject) }),
        h('h1', pct === 100 ? 'Flawless!' : pct >= 70 ? 'Lesson complete!' : 'You made it through!'),
        h('p.sub', { html: mdi(lesson.title) }),
        h('div.stat-row',
          h('div.stat.s-xp', h('b', `+${xp}`), h('span', 'XP earned')),
          h('div.stat.s-acc', h('b', `${pct}%`), h('span', 'First-try')),
          h('div.stat.s-streak', h('b', { html: `${streak}` }), h('span', streak === 1 ? 'Day streak' : 'Day streak'))),
        recap));
    window.scrollTo({ top: 0 });
    setTimeout(() => {
      const m = stage.querySelector('.medal');
      if (m) {
        const r = m.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 28);
      }
    }, 450);
    main.focus({ preventScroll: true });
  }

  function exit() {
    if (finished || i === 0) return go(paths.course(course.id));
    const dlg = h('div.dialog-backdrop', { onClick: (e) => e.target === dlg && dlg.remove() },
      h('div.dialog', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-t' },
        h('h3#dlg-t', 'Leave this lesson?'),
        h('p', 'Your progress in this lesson will be lost. You can start it again any time.'),
        h('div.row',
          h('button.btn.btn-secondary', { type: 'button', onClick: () => dlg.remove() }, 'Keep learning'),
          h('button.btn', { type: 'button', onClick: () => { dlg.remove(); go(paths.course(course.id)); } }, 'Leave'))));
    document.body.append(dlg);
    dlg.querySelector('.btn-secondary').focus();
  }
}

function medal(subject) {
  const c = subject === 'physics' ? 'var(--coral)' : 'var(--blue)';
  return `<svg viewBox="0 0 168 168" aria-hidden="true">
    <circle cx="84" cy="84" r="78" fill="var(--surface)"/>
    <g class="medal-pop">
      <path d="M84 22 L138 53 L138 115 L84 146 L30 115 L30 53 Z" fill="${c}"/>
      <path d="M84 36 L126 60 L126 108 L84 132 L42 108 L42 60 Z" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>
    </g>
    <path class="medal-draw" pathLength="1" d="M62 86 L78 102 L108 70" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="146" cy="30" r="6" fill="var(--amber)" class="medal-pop"/>
    <circle cx="22" cy="134" r="5" fill="var(--teal)" class="medal-pop"/>
    <rect x="18" y="26" width="10" height="10" rx="2" fill="var(--violet)" transform="rotate(20 23 31)" class="medal-pop"/>
  </svg>`;
}
