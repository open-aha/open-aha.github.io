// "Suggest an improvement": a small dialog that hands the learner's note, plus where they are,
// to a pre-filled GitHub issue.
import { h } from './lib/dom.js';
import { ORIGIN, paths } from './routes.js';

export const REPO = 'https://github.com/open-aha/open-aha.github.io';
export const EMAIL = 'contact@openaha.org';

// kind → GitHub issue form (.github/ISSUE_TEMPLATE/<form>.yml) and title prefix
const KINDS = [
  { id: 'mistake', label: 'Something’s wrong', form: 'mistake', tag: 'Mistake' },
  { id: 'confusing', label: 'It’s confusing', form: 'improvement', tag: 'Confusing' },
  { id: 'idea', label: 'I have an idea', form: 'improvement', tag: 'Idea' },
];

// From a lesson: { course, lesson, step (1-based, or null for the whole lesson), total }.
// With no lesson, the suggestion is about OpenAha in general.
export function openSuggest({ course, lesson, step, total } = {}) {
  const link = ORIGIN + (lesson ? paths.lesson(course.id, lesson.id, step) : paths.home());
  const place = lesson ? `${course.title} › ${lesson.title}${step ? ` › step ${step} of ${total}` : ''}` : 'OpenAha in general';
  let kind = lesson ? KINDS[0] : KINDS[2];

  const chips = KINDS.map((k) =>
    h('button.suggest-kind', { type: 'button', 'aria-pressed': String(k === kind), onClick: () => {
      kind = k;
      chips.forEach((c, n) => c.setAttribute('aria-pressed', String(KINDS[n] === kind)));
    } }, k.label));
  const text = h('textarea.suggest-text#suggest-text', { rows: 4, placeholder: 'What should change? You can also write it on the next page.' });

  const title = () => `[${kind.tag}] ${lesson ? `${lesson.title}${step ? `, step ${step}` : ''}` : ''}`;
  const github = () => {
    const q = new URLSearchParams({ template: `${kind.form}.yml`, title: title(), where: `${place}\n${link}`, details: text.value.trim() });
    window.open(`${REPO}/issues/new?${q}`, '_blank', 'noopener');
    dlg.remove();
  };

  // keys stay inside the dialog (the lesson player would otherwise treat Escape as "exit lesson")
  const onKeydown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') dlg.remove();
  };
  const dlg = h('div.dialog-backdrop', { onClick: (e) => e.target === dlg && dlg.remove(), onKeydown },
    h('div.dialog.suggest', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'suggest-t' },
      h('h3#suggest-t', 'Suggest an improvement'),
      h('p', lesson
        ? 'Spotted a mistake, got stuck, or know how this could click better? Every note helps make the lesson better for the next learner.'
        : 'Spotted a mistake, missing a topic, or have an idea to make OpenAha better? Every note helps the next learner.'),
      h('p.suggest-where', place),
      h('div.suggest-kinds', { role: 'group', 'aria-label': 'Kind of suggestion' }, chips),
      h('label.sr-only', { for: 'suggest-text' }, 'Your suggestion'),
      text,
      h('p.suggest-note', 'Opens GitHub, where your note will be public. You need a free account to post it.'),
      h('div.row',
        h('button.btn.btn-secondary', { type: 'button', onClick: () => dlg.remove() }, 'Cancel'),
        h('button.btn', { type: 'button', onClick: github }, 'Open on GitHub'))));
  document.body.append(dlg);
  text.focus();
}
