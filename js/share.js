// "Share this step": a small dialog showing the step's link, ready to copy or send to a friend.
// The link opens the lesson right at that step.
import { h } from './lib/dom.js';
import { icons } from './lib/icons.js';
import { ORIGIN, paths } from './routes.js';

// a step title as plain text: no maths dollars, bold stars or {colour:...} markup
const plain = (s = '') => s.replace(/\{[a-z-]+:([^}]*)\}/g, '$1').replace(/[$*_`\\]/g, '').replace(/\s+/g, ' ').trim();

// From a lesson: { course, lesson, step (1-based, or null for the whole lesson), total }.
export function openShare({ course, lesson, step, total }) {
  const link = ORIGIN + paths.lesson(course.id, lesson.id, step);
  const title = step ? plain(lesson.steps[step - 1]?.title) : '';
  const what = title ? `${title}, from “${lesson.title}”` : `“${lesson.title}”`;
  const message = `${what} on OpenAha: ${link}`;
  const opener = document.activeElement;

  const url = h('input.share-url#share-url', { type: 'text', value: link, readonly: true, spellcheck: 'false', onFocus: () => url.select(), onClick: () => url.select() });
  const copyLabel = h('span', 'Copy');
  const copyBtn = h('button.btn.share-copy', { type: 'button', onClick: copy }, h('span.share-copy-icon', { html: icons.link }), copyLabel);
  let reset = 0;
  async function copy() {
    // the clipboard API can be missing, refused, or left waiting on a permission prompt: then copy the selected field
    const wrote = await Promise.race([navigator.clipboard?.writeText(link).then(() => true, () => false) ?? false, new Promise((ok) => setTimeout(() => ok(false), 600))]);
    if (!wrote) {
      url.select();
      document.execCommand('copy');
    }
    copyBtn.classList.add('btn-success', 'is-copied');
    copyBtn.querySelector('.share-copy-icon').innerHTML = icons.check;
    copyLabel.textContent = 'Copied';
    status.textContent = 'Link copied to the clipboard.';
    clearTimeout(reset);
    reset = setTimeout(() => {
      copyBtn.classList.remove('btn-success', 'is-copied');
      copyBtn.querySelector('.share-copy-icon').innerHTML = icons.link;
      copyLabel.textContent = 'Copy';
      status.textContent = '';
    }, 2200);
  }

  const app = (icon, label, attrs) => h(attrs.href ? 'a.share-app' : 'button.share-app', attrs, h('span.share-app-icon', { html: icon }), h('span', label));
  const apps = [
    app(icons.mail, 'Email', { href: `mailto:?${new URLSearchParams({ subject: title || lesson.title, body: message }).toString().replace(/\+/g, '%20')}` }),
    app(icons.chat, 'WhatsApp', { href: `https://wa.me/?${new URLSearchParams({ text: message })}`, target: '_blank', rel: 'noopener' }),
    navigator.share ? app(icons.dots, 'More', { type: 'button', onClick: () => navigator.share({ title: title || lesson.title, text: `${what} on OpenAha`, url: link }).catch(() => {}) }) : null,
  ];
  const status = h('p.sr-only', { role: 'status', 'aria-live': 'polite' });

  const close = () => {
    clearTimeout(reset);
    dlg.remove();
    opener?.focus?.({ preventScroll: true });
  };
  // keys stay inside the dialog (the lesson player would otherwise treat Escape as "exit lesson")
  const onKeydown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  };
  const dlg = h('div.dialog-backdrop', { onClick: (e) => e.target === dlg && close(), onKeydown },
    h('div.dialog.share', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'share-t' },
      h('button.icon-btn.share-close', { type: 'button', 'aria-label': 'Close', html: icons.x, onClick: close }),
      h('h3#share-t', step ? 'Share this step' : 'Share this lesson'),
      h('div.share-card', { style: { '--cc': `var(--${course.subject === 'physics' ? 'coral' : 'blue'})` } },
        h('div.share-where', step ? `${course.title} · ${lesson.title} · step ${step} of ${total}` : course.title),
        h('div.share-title', title || lesson.title)),
      h('label.share-label', { for: 'share-url' }, 'Anyone with this link lands right here:'),
      h('div.share-link', url, copyBtn),
      h('div.share-apps', apps),
      status));
  document.body.append(dlg);
  copyBtn.focus();
}
