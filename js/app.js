import { h, clear, toast } from './lib/dom.js';
import { mdi, md, loadKatex } from './lib/md.js';
import { icons, logo } from './lib/icons.js';
import { store } from './store.js';
import { cover, heroArt, animateHero, principleArt } from './art.js';
import { courses } from './courses/catalog.js';
import { renderLesson } from './lesson.js';
import { loadWidgets } from './widgets/index.js';
import { s } from './lib/svg.js';

const root = document.getElementById('app');
let sessionFilter = 'all';
let sessionLevel = 'all';
const LEVELS = ['Foundational', 'Intermediate', 'Advanced'];

// the catalog has every course without its lesson steps; a full course loads when a lesson opens
const getCourse = (id) => courses.find((c) => c.id === id);
const loadCourse = (id) => import(`./courses/${id}.js`).then((m) => m.default);

// ---------- theme ----------
function applyTheme(t) {
  if (t) document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
}
applyTheme(store.theme);
const isDark = () =>
  document.documentElement.dataset.theme === 'dark' ||
  (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

// ---------- router ----------
function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}
window.addEventListener('hashchange', route);

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
  const [page, a, b, stepNo] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const c = getCourse(a);
  let view = () => homePage(page === 'courses');
  if (page === 'about') view = aboutPage;
  else if (page === 'legal') view = legalPage;
  else if (c && (page === 'course' || page === 'lesson')) {
    view = () => coursePage(c);
    try {
      const [full] = await Promise.all([page === 'lesson' ? loadCourse(c.id) : null, loadKatex()]);
      const all = full ? full.chapters.flatMap((ch) => ch.lessons) : [];
      const idx = all.findIndex((l) => l.id === b);
      if (idx >= 0) {
        await loadWidgets(all[idx]);
        view = () => renderLesson(root, { course: full, lesson: all[idx], next: all[idx + 1], go, start: stepNo ? Math.max(0, +stepNo - 1) : 0 });
      }
    } catch (e) {
      if (seq !== routeSeq) return;
      console.error(e);
      if (navigator.onLine && reloadOnce()) return;
      toast('Could not load this page. Check your connection and try again.');
      if (root.firstChild) return;
    }
  }
  if (seq !== routeSeq) return;
  root._cleanup?.();
  root._cleanup = null;
  view();
}

// ---------- shared chrome ----------
function header(active) {
  const st = store.streak();
  const themeBtn = h('button.icon-btn', {
    type: 'button',
    'aria-label': 'Toggle dark mode',
    html: isDark() ? icons.sun : icons.moon,
    onClick: () => {
      const t = isDark() ? 'light' : 'dark';
      store.theme = t;
      applyTheme(t);
      themeBtn.innerHTML = isDark() ? icons.sun : icons.moon;
    },
  });
  return h('header.site-header',
    h('div.wrap',
      h('a.brand', { href: '#/', html: logo + '<span>OpenAha</span>' }),
      h('nav.header-nav', { 'aria-label': 'Main' },
        h('a', { href: '#/courses', 'aria-current': active === 'courses' ? 'page' : null }, 'Courses'),
        h('a', { href: '#/about', 'aria-current': active === 'about' ? 'page' : null }, 'About')),
      h('div.header-right',
        h(`span.chip.streak${st.active ? '.is-active' : ''}`, { title: 'Daily streak', html: `${icons.flame}<span>${st.count}</span>` }),
        h('span.chip.xp', { title: 'Total XP', html: `${icons.bolt}<span>${store.xp}</span>` }),
        themeBtn)));
}

function footer() {
  return h('footer.site-footer',
    h('div.wrap',
      h('div', { html: `<strong style="color:var(--ink)">OpenAha</strong>: free, interactive math and science for everyone. <a href="#/about">About</a> · <a href="#/legal">Impressum &amp; Privacy</a>` }),
      h('div',
        h('button.btn.btn-ghost.btn-sm', {
          type: 'button',
          onClick: () => {
            if (confirm('Reset all progress, XP and streak on this device?')) {
              store.reset();
              route();
              toast('Progress reset');
            }
          },
        }, 'Reset progress'))));
}

// ---------- home ----------
function homePage(scrollToCourses) {
  document.title = 'OpenAha: Learn math and science by doing';
  clear(root);
  const last = store.last && getCourse(store.last.courseId);
  const firstCourse = courses[0];
  const startHref = last ? nextLessonHref(last) : `#/course/${firstCourse.id}`;

  const hero = h('section.hero',
    h('div.wrap',
      h('div',
        h('div.eyebrow', 'Interactive math & science'),
        h('h1', { html: 'Learn <em>math</em> and <em class="phys">science</em> by doing.', style: { marginTop: '14px' } }),
        h('p.hero-sub', 'Bite-sized, hands-on lessons. Drag, predict, and solve your way to real understanding. Free for everyone.'),
        h('div.hero-cta',
          h('a.btn', { href: startHref }, last ? 'Continue learning' : 'Start learning', h('span', { html: icons.right, style: { width: '20px', display: 'inline-flex' } })),
          h('a.btn.btn-secondary', { href: '#/courses' }, 'Browse courses'))),
      h('div.hero-art', { html: heroArt })));
  animateHero(hero);

  const cont = last ? continueCard(last) : null;

  // course catalogue
  const grid = h('div.catalog');
  const subjectPills = h('div.pills', { role: 'group', 'aria-label': 'Filter by subject' });
  const levelPills = h('div.pills', { role: 'group', 'aria-label': 'Filter by difficulty' });
  const subjectOpts = [['all', 'All'], ['math', 'Math'], ['physics', 'Natural Sciences']];
  const levelOpts = [['all', 'All'], ...LEVELS.map((l) => [l, l])];
  const pillRow = (box, opts, cur, set) => box.replaceChildren(...opts.map(([k, label]) => h('button.pill', { type: 'button', 'aria-pressed': String(cur === k), onClick: () => { set(k); renderGrid(); } }, label)));
  const filters = h('div.filters',
    h('div.filter-row', h('span.filter-label', 'Subject'), subjectPills),
    h('div.filter-row', h('span.filter-label', 'Difficulty'), levelPills));
  const renderGrid = () => {
    pillRow(subjectPills, subjectOpts, sessionFilter, (k) => (sessionFilter = k));
    pillRow(levelPills, levelOpts, sessionLevel, (k) => (sessionLevel = k));
    const shown = courses.filter((c) => (sessionFilter === 'all' || c.subject === sessionFilter) && (sessionLevel === 'all' || c.level === sessionLevel));
    const groups = LEVELS.flatMap((lvl) => {
      const group = shown.filter((c) => c.level === lvl);
      if (!group.length) return [];
      return [h('div.level-head', h('span.eyebrow', lvl), h('span.level-count', `${group.length} ${group.length === 1 ? 'course' : 'courses'}`)), h('div.course-grid', group.map(courseCard))];
    });
    grid.replaceChildren(...(groups.length ? groups : [h('p.muted', 'No courses match these filters.')]));
  };
  renderGrid();

  const catalog = h('section.section#courses',
    h('div.wrap',
      h('div.section-head',
        h('div', h('h2.section-title', 'Courses'), h('p.section-sub', 'Every course is a path of short lessons. Each lesson is a handful of puzzles that build one idea.')),
        filters),
      grid));

  const how = h('section.section.band',
    h('div.wrap',
      h('div.section-head', h('div', h('h2.section-title', 'How OpenAha teaches'), h('p.section-sub', 'Built on what learning science says works: active practice, immediate feedback, and visual intuition first.'))),
      h('div.principles',
        principle('doing', 'Learn by doing', 'Every lesson asks you to predict, drag or solve before it explains. Your first attempt gives the explanation a purpose.'),
        principle('visual', 'See it first', 'Concrete pictures and simulations come before symbols, so the formula names something you already understand.'),
        principle('feedback', 'Mistakes are information', 'Instant, specific feedback on every answer. Tap “Why?” to see the reasoning, or try again.'),
        principle('streak', 'A little every day', 'Lessons take 5–15 minutes. Keep a daily streak and watch your progress grow.'))));

  root.append(header(scrollToCourses ? 'courses' : null), h('main.page-enter', hero, cont ? h('div.wrap', { style: { marginTop: '-12px' } }, cont) : null, catalog, how), footer());
  if (scrollToCourses) requestAnimationFrame(() => document.getElementById('courses')?.scrollIntoView());
  else window.scrollTo(0, 0);
}

// ---------- about ----------
function aboutPage() {
  document.title = 'About · OpenAha';
  clear(root);
  const nLessons = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.length, 0), 0);
  const nSteps = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.reduce((d, l) => d + l.nSteps, 0), 0), 0);
  const fmt = (n) => n.toLocaleString('en-US');
  const page = h('section.about.wrap',
    h('div.eyebrow', 'About OpenAha'),
    h('h1.about-title', { html: 'Learning should be free.<br><em>Understanding should be fun.</em>' }),
    h('p.about-lead', 'OpenAha exists to give everyone high-quality, interactive education in math and science, for free. Not just the people who can afford it.'),
    h('div.about-stats',
      h('div', h('b', fmt(courses.length)), h('span', 'courses')),
      h('div', h('b', fmt(nLessons)), h('span', 'lessons')),
      h('div', h('b', fmt(nSteps)), h('span', 'interactive steps')),
      h('div', h('b', 'Free'), h('span', 'for everyone, always'))),
    h('div.about-grid',
      h('article.tcard',
        h('h3', 'Our goal'),
        h('p', 'The best interactive learning tools usually sit behind subscriptions. We think that’s backwards. A student with a phone and curiosity should get the same lessons as anyone else: hands-on, carefully explained, and correct.')),
      h('article.tcard',
        h('h3', 'How it works'),
        h('p', 'Every lesson asks you to predict, drag, build or solve before it explains. You get instant feedback, a “Why?” behind every answer, and live simulations you can push and probe until the idea clicks.')),
      h('article.tcard',
        h('h3', 'No barriers'),
        h('p', 'No account, no paywall, no ads. Your progress, XP and streak are saved only in your own browser, on your device.')),
      h('article.tcard',
        h('h3', 'What you can learn'),
        h('p', 'From fractions and logic puzzles to relativity, quantum computing and cosmology. Courses are grouped as Foundational, Intermediate and Advanced, so you can start wherever you are.'))),
    h('div.about-cta',
      h('a.btn', { href: '#/courses' }, 'Browse the courses'),
      h('a.btn.btn-secondary', { href: '#/' }, 'Back to home')));
  root.append(header('about'), h('main.page-enter', page), footer());
  window.scrollTo(0, 0);
}

// ---------- legal notice (§ 18 MStV) and privacy (Art. 13 GDPR) ----------
function legalPage() {
  document.title = 'Impressum & Privacy · OpenAha';
  clear(root);
  const page = h('section.legal.wrap',
    h('h1', 'Impressum'),
    h('p', 'Information according to § 18 (1) MStV:'),
    h('p', { html: 'Kiarash Parvizi<br>Altheimer Straße 56a<br>64807 Dieburg<br>Germany' }),
    h('h2', 'Privacy'),
    h('p', 'Controller: Kiarash Parvizi, address above.'),
    h('p', { html: 'This site is hosted on GitHub Pages by GitHub, Inc. (USA). When you visit, GitHub logs your IP address for security purposes (Art. 6 (1) (f) GDPR: our legitimate interest in a secure, working website). The site cannot be delivered without it. GitHub keeps these logs as long as it needs them for security and publishes no fixed period. GitHub takes part in the EU-US Data Privacy Framework; see the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub Privacy Statement</a>.' }),
    h('p', 'Your progress, XP, streak and theme are saved only in your browser’s local storage, because the site needs them to work (§ 25 (2) no. 2 TDDDG). They are never sent to us or anyone else. You can delete them with “Reset progress” or by clearing this site’s data.'),
    h('p', { html: 'To count visits, this site uses Cloudflare Web Analytics by Cloudflare, Inc. (USA). On each page view your browser sends Cloudflare the page address, the referring site, your browser, operating system, screen size and page load times, along with your IP address (Art. 6 (1) (f) GDPR: our legitimate interest in knowing how the site is used). Cloudflare uses no cookies or local storage for this and does not use the data to identify or follow you; we only see totals, never individual visitors. Cloudflare publishes no fixed retention period and takes part in the EU-US Data Privacy Framework; see the <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare Privacy Policy</a>.' }),
    h('p', 'There are no cookies, no advertising and no tracking across sites.'),
    h('p', 'You have the right to access, rectification, erasure, restriction of processing and data portability (Art. 15–18, 20 GDPR), and to lodge a complaint with a supervisory authority, such as the Hessian Commissioner for Data Protection and Freedom of Information (HBDI).'),
    h('p', { html: '<strong>Right to object:</strong> you can object at any time, on grounds relating to your particular situation, to processing of your data based on Art. 6 (1) (f) GDPR (Art. 21 GDPR).' }));
  root.append(header(), h('main.page-enter', page), footer());
  window.scrollTo(0, 0);
}

function principle(art, title, text) {
  return h('article.tcard.principle', h('div.art', { html: principleArt[art] }), h('h3', title), h('p', text));
}

function courseCard(c) {
  const pr = store.courseProgress(c);
  const lessons = pr.total;
  return h(`a.tcard.course-card.subject-${c.subject}`, { href: `#/course/${c.id}` },
    h('div.cover', { html: cover(c.cover) }),
    h('div.body',
      h('div.eyebrow', `${c.subject === 'math' ? 'Math' : 'Natural Sciences'} · ${c.level}`),
      h('h3', c.title),
      h('p.tagline', c.tagline),
      h('div.meta',
        pr.done ? h('div.progress', h('span', { style: { width: pr.pct * 100 + '%' } })) : h('span', `${lessons} lessons`),
        pr.done ? h('span', `${pr.done}/${lessons}`) : h('span', `${c.chapters.length} ${c.chapters.length === 1 ? 'chapter' : 'chapters'}`))));
}

function nextLesson(c) {
  const all = c.chapters.flatMap((ch) => ch.lessons);
  return all.find((l) => !store.lesson(c.id, l.id)?.done) || null;
}
function nextLessonHref(c) {
  const n = nextLesson(c);
  return n ? `#/lesson/${c.id}/${n.id}` : `#/course/${c.id}`;
}

function continueCard(c) {
  const n = nextLesson(c);
  const pr = store.courseProgress(c);
  return h(`a.tcard.continue-card.subject-${c.subject}`, { href: n ? `#/lesson/${c.id}/${n.id}` : `#/course/${c.id}` },
    h('div.cover', { html: cover(c.cover) }),
    h('div',
      h('div.eyebrow', 'Continue learning'),
      h('h3', n ? n.title : c.title),
      h('div', { class: 'muted', style: { fontSize: '15px' } }, `${c.title} · ${pr.done}/${pr.total} lessons`)),
    h('span.btn.btn-sm', n ? 'Resume' : 'Review'));
}

// ---------- course ----------
function coursePage(c) {
  document.title = `${c.title} · OpenAha`;
  clear(root);
  const pr = store.courseProgress(c);
  const n = nextLesson(c);
  const all = c.chapters.flatMap((ch) => ch.lessons);
  const mins = all.reduce((a, l) => a + l.minutes, 0);

  const hero = h('section.course-hero',
    h('div.wrap',
      h('div',
        h('a.back-link', { href: '#/courses', html: icons.left + '<span>All courses</span>' }),
        h('div.eyebrow', { style: { marginTop: '22px' } }, `${c.subject === 'math' ? 'Math' : 'Natural Sciences'} · ${c.level}`),
        h('h1', c.title),
        h('div.desc', { html: md(c.description) }),
        h('div.course-stats',
          h('span', { html: `${icons.book}${all.length} lessons` }),
          h('span', { html: `${icons.clock}~${Math.round(mins / 5) * 5} min` }),
          h('span', { html: `${icons.check}${pr.done}/${pr.total} complete` })),
        h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
          h('a.btn', { href: n ? `#/lesson/${c.id}/${n.id}` : `#/lesson/${c.id}/${all[0].id}` }, pr.done === 0 ? 'Start course' : n ? 'Continue' : 'Review from start'),
          c.prereq ? h('span.muted', { style: { alignSelf: 'center', fontSize: '15px' }, html: mdi(`Helpful background: ${c.prereq}`) }) : null)),
      h('div.cover', { html: cover(c.cover) })));

  const chapters = h('div.chapters.wrap');
  let lessonNum = 0;
  c.chapters.forEach((ch, ci) => {
    const path = h('ol.path');
    ch.lessons.forEach((l) => {
      const k = lessonNum++;
      const done = store.lesson(c.id, l.id)?.done;
      const isNext = n && n.id === l.id;
      const off = [0, 1, 1.5, 1, 0, -1, -1.5, -1][k % 8];
      const nodeIcon = done ? icons.check : isNext ? icons.play : icons[l.icon] || icons.star;
      path.append(
        h('li.path-item', { style: { '--off': off } },
          h('div.node-col',
            h(`a.node${done ? '.is-done' : ''}${isNext ? '.is-next' : ''}`, { href: `#/lesson/${c.id}/${l.id}`, 'aria-label': `${l.title}${done ? ' (completed)' : ''}`, html: nodeIcon })),
          h('a.node-label', { href: `#/lesson/${c.id}/${l.id}` },
            h('strong', l.title),
            h('span', l.summary || `${l.nSteps} steps`))));
    });
    chapters.append(
      h('section.chapter',
        h('div.chapter-head', h('div.num', String(ci + 1)), h('div', h('h2', ch.title), ch.summary ? h('p', ch.summary) : null)),
        path));
  });

  root.append(header(), h(`main.page-enter.subject-${c.subject}`, hero, chapters), footer());
  window.scrollTo(0, 0);
  requestAnimationFrame(() => drawPaths(chapters));
  // fetch the course and the widgets of the lesson the main button opens, so it starts at once
  const first = n || all[0];
  loadCourse(c.id)
    .then((full) => loadWidgets(full.chapters.flatMap((ch) => ch.lessons).find((l) => l.id === first.id)))
    .catch(() => {});
  const onResize = () => drawPaths(chapters);
  window.addEventListener('resize', onResize);
  root._cleanup = () => window.removeEventListener('resize', onResize);
}

// connect lesson nodes with a dotted curve
function drawPaths(container) {
  container.querySelectorAll('ol.path').forEach((ol) => {
    ol.querySelector('.path-svg')?.remove();
    const nodes = [...ol.querySelectorAll('.node')];
    if (nodes.length < 2) return;
    const base = ol.getBoundingClientRect();
    const pts = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    });
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const my = (a.y + b.y) / 2;
      d += ` C${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    }
    const svg = s('svg', { class: 'path-svg', width: base.width, height: base.height }, s('path', { d }));
    ol.prepend(svg);
  });
}

route();
