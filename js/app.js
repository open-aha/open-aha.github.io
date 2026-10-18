import { toast } from './lib/dom.js';
import { loadKatex } from './lib/md.js';
import { store } from './store.js';
import { renderLesson } from './lesson.js';
import { loadWidgets } from './widgets/index.js';
import { parseRoute } from './routes.js';
import { startRouter, navigate } from './router.js';
import { setHead } from './head.js';
import { applyTheme, getCourse, loadCourse, homePage, aboutPage, legalPage, coursePage, notFoundPage, lessonHead } from './pages.js';

const root = document.getElementById('app');
applyTheme(store.theme);

// Pages written by scripts/build-site.mjs arrive with their content in #app. The first render
// replaces it with the same page, now interactive, without replaying the entrance animation.
let hydrating = root.hasChildNodes();
let rendered = false; // whether this tab has drawn a page yet (prerendered content doesn't count)

function show(page) {
  setHead(page.head);
  if (hydrating) page.body.forEach((el) => el.classList?.remove('page-enter'));
  root.replaceChildren(...page.body);
  root._cleanup = page.mount?.({ hydrating }) || null;
}

// A deploy since this tab opened can pair new course or widget files with old shared modules
// that no longer fit; a reload fetches a matching set. At most once a minute, so it never loops.
function reloadOnce() {
  try {
    if (Date.now() - (+sessionStorage.getItem('openaha:reloaded') || 0) < 60000) return false;
    sessionStorage.setItem('openaha:reloaded', String(Date.now()));
  } catch (e) {
    return false;
  }
  location.reload();
  return true;
}

// The current page stays up while the next one loads what it needs; only the latest route renders.
let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  const r = parseRoute(location.pathname, location.search);
  const c = r.course && getCourse(r.course);
  let view = () => show(notFoundPage());
  if (r.page === 'home' || r.page === 'courses') view = () => show(homePage({ scrollToCourses: r.page === 'courses' }));
  else if (r.page === 'about') view = () => show(aboutPage());
  else if (r.page === 'legal') view = () => show(legalPage());
  else if (c && (r.page === 'course' || r.page === 'lesson')) {
    const meta = r.page === 'lesson' && c.chapters.flatMap((ch) => ch.lessons).find((l) => l.id === r.lesson);
    view = () => show(r.page === 'lesson' && !meta ? notFoundPage(c) : coursePage(c));
    try {
      const [full] = await Promise.all([meta ? loadCourse(c.id) : null, loadKatex()]);
      const all = full ? full.chapters.flatMap((ch) => ch.lessons) : [];
      const idx = all.findIndex((l) => l.id === r.lesson);
      if (idx >= 0) {
        await loadWidgets(all[idx]);
        view = () => {
          setHead(lessonHead(c, meta));
          renderLesson(root, { course: full, lesson: all[idx], next: all[idx + 1], go: navigate, start: r.step ? r.step - 1 : 0 });
        };
      }
    } catch (e) {
      if (seq !== routeSeq) return;
      console.error(e);
      if (navigator.onLine && reloadOnce()) return;
      toast('Could not load this page. Check your connection and try again.');
      // keep the page already on screen; on a first visit, show the course page instead
      if (rendered) return;
    }
  }
  if (seq !== routeSeq) return;
  root._cleanup?.();
  root._cleanup = null;
  view();
  hydrating = false;
  rendered = true;
}

startRouter(route);
