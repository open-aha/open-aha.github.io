// Every page except the lesson player. A page is { head, body, mount }:
//   head: the tags setHead() writes (title, description, canonical path, structured data);
//   body: the nodes that go into #app;
//   mount({ hydrating }): browser-only work once the body is in the document (scrolling, animation,
//     layout); it may return a cleanup. hydrating is true when the body replaces the same page
//     pre-rendered by scripts/build-site.mjs.
// The build renders these same functions in Node, so building a page must not touch window or layout.
import { h, toast } from './lib/dom.js';
import { mdi, md } from './lib/md.js';
import { icons, logo } from './lib/icons.js';
import { s } from './lib/svg.js';
import { prereqParts } from './lib/prereq.js';
import { store } from './store.js';
import { cover, heroArt, animateHero, principleArt } from './art.js';
import { courses } from './courses/catalog.js';
import { openSuggest, REPO, EMAIL } from './feedback.js';
import { loadWidgets } from './widgets/index.js';
import { ORIGIN, paths } from './routes.js';
import { rerender } from './router.js';

let sessionFilter = 'all';
let sessionLevel = 'all';
const LEVELS = ['Foundational', 'Intermediate', 'Advanced'];
const HOME_TITLE = 'OpenAha: Learn math and science by doing';

// the catalog has every course without its lesson steps; a full course loads when a lesson opens
export const getCourse = (id) => courses.find((c) => c.id === id);
export const loadCourse = (id) => import(`./courses/${id}.js`).then((m) => m.default);
const lessonsOf = (c) => c.chapters.flatMap((ch) => ch.lessons);

// Which courses each course names as helpful background (before), and which name it (after),
// in catalogue order. Built once, from the prereq texts (js/lib/prereq.js).
let related = null;
function relatedCourses(c) {
  if (!related) {
    related = new Map(courses.map((x) => [x.id, { before: [], after: [] }]));
    for (const x of courses) {
      for (const p of x.prereq ? prereqParts(x.prereq, courses) : []) {
        if (!p.course) continue;
        related.get(x.id).before.push(p.course);
        related.get(p.course.id).after.push(x);
      }
    }
  }
  return related.get(c.id);
}
const subjectName = (c) => (c.subject === 'math' ? 'Math' : 'Natural Sciences');
const sentence = (t) => (/[.!?]$/.test(t) ? t : `${t}.`);
const toTop = ({ hydrating }) => {
  if (!hydrating) window.scrollTo(0, 0);
};

// ---------- structured data (schema.org) ----------
const PUBLISHER = { '@type': 'Organization', name: 'OpenAha', url: `${ORIGIN}/` };
const breadcrumbs = (...items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: ORIGIN + path })),
});

// ---------- theme ----------
export function applyTheme(t) {
  if (t) document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
}
const isDark = () =>
  document.documentElement.dataset.theme === 'dark' ||
  (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

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
      h('a.brand', { href: paths.home(), html: logo + '<span>OpenAha</span>' }),
      h('nav.header-nav', { 'aria-label': 'Main' },
        h('a', { href: paths.courses(), 'aria-current': active === 'courses' ? 'page' : null }, 'Courses'),
        h('a', { href: paths.about(), 'aria-current': active === 'about' ? 'page' : null }, 'About')),
      h('div.header-right',
        h(`span.chip.streak${st.active ? '.is-active' : ''}`, { title: 'Daily streak', html: `${icons.flame}<span>${st.count}</span>` }),
        h('span.chip.xp', { title: 'Total XP', html: `${icons.bolt}<span>${store.xp}</span>` }),
        themeBtn)));
}

function footer() {
  return h('footer.site-footer',
    h('div.wrap',
      h('div', { html: `<strong style="color:var(--ink)">OpenAha</strong>: free, interactive math and science for everyone. <a href="${paths.about()}">About</a> · <a href="${paths.legal()}">Impressum &amp; Privacy</a>` }),
      h('div',
        h('button.btn.btn-ghost.btn-sm', {
          type: 'button',
          onClick: () => {
            if (confirm('Reset all progress, XP and streak on this device?')) {
              store.reset();
              rerender();
              toast('Progress reset');
            }
          },
        }, 'Reset progress'))));
}

// ---------- home ----------
export function homePage({ scrollToCourses = false } = {}) {
  const last = store.last && getCourse(store.last.courseId);
  const firstCourse = courses[0];
  const startHref = last ? nextLessonHref(last) : paths.course(firstCourse.id);

  const art = h('div.hero-art', { html: heroArt });
  const hero = h('section.hero',
    h('div.wrap',
      h('div',
        h('div.eyebrow', 'Interactive math & science'),
        h('h1', { html: 'Learn <em>math</em> and <em class="phys">science</em> by doing.', style: { marginTop: '14px' } }),
        h('p.hero-sub', 'Bite-sized, hands-on lessons. Drag, predict, and solve your way to real understanding. Free for everyone.'),
        h('div.hero-cta',
          h('a.btn', { href: startHref }, last ? 'Continue learning' : 'Start learning', h('span', { html: icons.right, style: { width: '20px', display: 'inline-flex' } })),
          h('a.btn.btn-secondary', { href: paths.courses() }, 'Browse courses'))),
      art));

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

  // /courses/ shows the same page as the home page, so search engines are pointed to the home page
  const description = `Free, interactive lessons in math and science: ${courses.length} courses, from fractions to quantum computing. Learn by doing, with instant feedback. No account, no ads.`;
  return {
    head: {
      title: HOME_TITLE,
      description,
      path: paths.home(),
      jsonld: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: 'OpenAha', url: `${ORIGIN}/`, description, inLanguage: 'en', publisher: { '@id': `${ORIGIN}/#organization` } },
          { ...PUBLISHER, '@id': `${ORIGIN}/#organization`, email: EMAIL, sameAs: [REPO] },
        ],
      },
    },
    body: [header(scrollToCourses ? 'courses' : null), h('main.page-enter', hero, cont ? h('div.wrap', { style: { marginTop: '-12px' } }, cont) : null, catalog, how), footer()],
    mount({ hydrating }) {
      art.classList.add('is-ready');
      animateHero(hero);
      if (scrollToCourses) requestAnimationFrame(() => document.getElementById('courses')?.scrollIntoView());
      else toTop({ hydrating });
    },
  };
}

// ---------- about ----------
export function aboutPage() {
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
    h('section.about-help',
      h('h2', 'Help make it better'),
      h('p.about-help-lead', 'AI tools helped us build this many lessons quickly. What turns a good lesson into a great one is human insight: the moment a step confused you, a clearer example, a mistake only a careful reader spots. OpenAha is open source, and every suggestion is read.'),
      h('ul.about-help-ways',
        h('li', h('strong', 'In a lesson,'), ' tap the flag at the top. Your suggestion arrives with the exact step it’s about.'),
        h('li', h('strong', 'Beginners:'), ' your confusion is the most valuable feedback there is. Experts no longer notice the gaps.'),
        h('li', h('strong', 'Teachers:'), ' tell us what would make a lesson work in your classroom, or which topic is missing.')),
      h('div.about-help-cta',
        h('button.btn', { type: 'button', onClick: () => openSuggest() }, 'Suggest an improvement'),
        h('a.btn.btn-secondary', { href: `${REPO}/blob/main/CONTRIBUTING.md`, target: '_blank', rel: 'noopener' }, 'Contribute on GitHub')),
      h('p.about-help-mail', { html: `Want to use OpenAha in your school, help translate it, or partner with us? Or have something you’d rather not post publicly? Write to <a href="mailto:${EMAIL}">${EMAIL}</a>.` })),
    h('div.about-cta',
      h('a.btn', { href: paths.courses() }, 'Browse the courses'),
      h('a.btn.btn-secondary', { href: paths.home() }, 'Back to home')));
  return {
    head: {
      title: 'About · OpenAha',
      description: 'OpenAha gives everyone high-quality, interactive education in math and science, for free. No account, no paywall, no ads, and open source.',
      path: paths.about(),
      jsonld: { '@context': 'https://schema.org', ...breadcrumbs(['OpenAha', paths.home()], ['About', paths.about()]) },
    },
    body: [header('about'), h('main.page-enter', page), footer()],
    mount: toTop,
  };
}

// ---------- legal notice (§ 18 MStV) and privacy (Art. 13 GDPR) ----------
export function legalPage() {
  const page = h('section.text-page.wrap',
    h('h1', 'Impressum'),
    h('p', 'Information according to § 18 (1) MStV:'),
    h('p', { html: 'Kiarash Parvizi<br>Altheimer Straße 56a<br>64807 Dieburg<br>Germany' }),
    h('p', { html: `Email: <a href="mailto:${EMAIL}">${EMAIL}</a>` }),
    h('h2', 'Privacy'),
    h('p', 'Controller: Kiarash Parvizi, address above.'),
    h('p', { html: 'This site is hosted on GitHub Pages by GitHub, Inc. (USA). When you visit, GitHub logs your IP address for security purposes (Art. 6 (1) (f) GDPR: our legitimate interest in a secure, working website). The site cannot be delivered without it. GitHub keeps these logs as long as it needs them for security and publishes no fixed period. GitHub takes part in the EU-US Data Privacy Framework; see the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub Privacy Statement</a>.' }),
    h('p', 'Your progress, XP, streak, theme and how often a tip has been shown to you are saved only in your browser’s local storage, because the site needs them to work (§ 25 (2) no. 2 TDDDG). They are never sent to us or anyone else. You can delete them with “Reset progress” or by clearing this site’s data.'),
    h('p', { html: 'To count visits, this site uses Cloudflare Web Analytics by Cloudflare, Inc. (USA). On each page view your browser sends Cloudflare the page address, the referring site, your browser, operating system, screen size and page load times, along with your IP address (Art. 6 (1) (f) GDPR: our legitimate interest in knowing how the site is used). Cloudflare uses no cookies or local storage for this and does not use the data to identify or follow you; we only see totals, never individual visitors. Cloudflare publishes no fixed retention period and takes part in the EU-US Data Privacy Framework; see the <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare Privacy Policy</a>.' }),
    h('p', 'There are no cookies, no advertising and no tracking across sites.'),
    h('p', 'You have the right to access, rectification, erasure, restriction of processing and data portability (Art. 15–18, 20 GDPR), and to lodge a complaint with a supervisory authority, such as the Hessian Commissioner for Data Protection and Freedom of Information (HBDI).'),
    h('p', { html: '<strong>Right to object:</strong> you can object at any time, on grounds relating to your particular situation, to processing of your data based on Art. 6 (1) (f) GDPR (Art. 21 GDPR).' }));
  return {
    // kept out of search results: it has no lessons, only the operator's postal address
    head: { title: 'Impressum & Privacy · OpenAha', description: 'Legal notice (Impressum) and privacy policy of OpenAha.', path: paths.legal(), noindex: true },
    body: [header(), h('main.page-enter', page), footer()],
    mount: toTop,
  };
}

// ---------- page not found ----------
// course: set when the address names a known course but a lesson it doesn't have
export function notFoundPage(course = null) {
  const page = h('section.text-page.wrap',
    h('div.eyebrow', 'Error 404'),
    h('h1', 'Page not found'),
    h('p', course
      ? `${course.title} has no lesson at this address. It may have been renamed or moved.`
      : 'There’s no page at this address. It may have moved, or the link may have a typo.'),
    h('div.about-cta',
      course ? h('a.btn', { href: paths.course(course.id) }, `Go to ${course.title}`) : h('a.btn', { href: paths.courses() }, 'Browse the courses'),
      h('a.btn.btn-secondary', { href: paths.home() }, 'Back to home')));
  return {
    head: { title: 'Page not found · OpenAha', description: 'There’s no page at this address.', noindex: true },
    body: [header(), h('main.page-enter', page), footer()],
    mount: toTop,
  };
}

function principle(art, title, text) {
  return h('article.tcard.principle', h('div.art', { html: principleArt[art] }), h('h3', title), h('p', text));
}

function courseCard(c) {
  const pr = store.courseProgress(c);
  const lessons = pr.total;
  return h(`a.tcard.course-card.subject-${c.subject}`, { href: paths.course(c.id) },
    h('div.cover', { html: cover(c.cover) }),
    h('div.body',
      h('div.eyebrow', `${subjectName(c)} · ${c.level}`),
      h('h3', c.title),
      h('p.tagline', c.tagline),
      h('div.meta',
        pr.done ? h('div.progress', h('span', { style: { width: pr.pct * 100 + '%' } })) : h('span', `${lessons} lessons`),
        pr.done ? h('span', `${pr.done}/${lessons}`) : h('span', `${c.chapters.length} ${c.chapters.length === 1 ? 'chapter' : 'chapters'}`))));
}

function nextLesson(c) {
  return lessonsOf(c).find((l) => !store.lesson(c.id, l.id)?.done) || null;
}
function nextLessonHref(c) {
  const n = nextLesson(c);
  return n ? paths.lesson(c.id, n.id) : paths.course(c.id);
}

function continueCard(c) {
  const n = nextLesson(c);
  const pr = store.courseProgress(c);
  return h(`a.tcard.continue-card.subject-${c.subject}`, { href: nextLessonHref(c) },
    h('div.cover', { html: cover(c.cover) }),
    h('div',
      h('div.eyebrow', 'Continue learning'),
      h('h3', n ? n.title : c.title),
      h('div', { class: 'muted', style: { fontSize: '15px' } }, `${c.title} · ${pr.done}/${pr.total} lessons`)),
    h('span.btn.btn-sm', n ? 'Resume' : 'Review'));
}

// ---------- course ----------
export function coursePage(c) {
  const pr = store.courseProgress(c);
  const n = nextLesson(c);
  const all = lessonsOf(c);
  const mins = all.reduce((a, l) => a + l.minutes, 0);

  const hero = h('section.course-hero',
    h('div.wrap',
      h('div',
        h('a.back-link', { href: paths.courses(), html: icons.left + '<span>All courses</span>' }),
        h('div.eyebrow', { style: { marginTop: '22px' } }, `${subjectName(c)} · ${c.level}`),
        h('h1', c.title),
        h('div.desc', { html: md(c.description) }),
        h('div.course-stats',
          h('span', { html: `${icons.book}${all.length} lessons` }),
          h('span', { html: `${icons.clock}~${Math.round(mins / 5) * 5} min` }),
          h('span', { html: `${icons.check}${pr.done}/${pr.total} complete` })),
        h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
          h('a.btn', { href: paths.lesson(c.id, (n || all[0]).id) }, pr.done === 0 ? 'Start course' : n ? 'Continue' : 'Review from start'),
          c.prereq ? h('span.muted.prereq', 'Helpful background: ', prereqParts(c.prereq, courses).map((p) => (p.course ? h('a', { href: paths.course(p.course.id) }, p.course.title) : p.text))) : null)),
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
            h(`a.node${done ? '.is-done' : ''}${isNext ? '.is-next' : ''}`, { href: paths.lesson(c.id, l.id), 'aria-label': `${l.title}${done ? ' (completed)' : ''}`, html: nodeIcon })),
          h('a.node-label', { href: paths.lesson(c.id, l.id) },
            h('strong', l.title),
            h('span', l.summary || `${l.nSteps} steps`))));
    });
    chapters.append(
      h('section.chapter',
        h('div.chapter-head', h('div.num', String(ci + 1)), h('div', h('h2', ch.title), ch.summary ? h('p', ch.summary) : null)),
        path));
  });

  // courses that name this one as helpful background: where a learner can go next
  const { before, after } = relatedCourses(c);
  const next = after.length
    ? h('section.section.next-courses',
      h('div.wrap',
        h('div.section-head', h('div', h('h2.section-title', 'Courses that build on this'), h('p.section-sub', `Ready for more? These courses use what you learn in ${c.title}.`))),
        h('div.course-grid', after.map(courseCard))))
    : null;

  const url = ORIGIN + paths.course(c.id);
  const suffix = ` Free interactive course with ${all.length} hands-on lessons.`;
  const tagline = sentence(c.tagline);
  return {
    head: {
      title: `${c.title} · Free interactive course · OpenAha`,
      description: tagline.length + suffix.length <= 160 ? tagline + suffix : tagline,
      path: paths.course(c.id),
      jsonld: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            '@id': url,
            name: c.title,
            description: tagline,
            url,
            provider: PUBLISHER,
            inLanguage: 'en',
            isAccessibleForFree: true,
            educationalLevel: c.level,
            timeRequired: `PT${mins}M`,
            syllabusSections: c.chapters.map((ch) => ({ '@type': 'Syllabus', name: ch.title, description: ch.summary })),
            ...(before.length ? { coursePrerequisites: before.map((p) => ({ '@type': 'Course', '@id': ORIGIN + paths.course(p.id), name: p.title })) } : {}),
          },
          breadcrumbs(['OpenAha', paths.home()], [c.title, paths.course(c.id)]),
        ],
      },
    },
    body: [header(), h(`main.page-enter.subject-${c.subject}`, hero, chapters, next), footer()],
    mount({ hydrating }) {
      toTop({ hydrating });
      requestAnimationFrame(() => drawPaths(chapters));
      // fetch the course and the widgets of the lesson the main button opens, so it starts at once
      const first = n || all[0];
      loadCourse(c.id)
        .then((full) => loadWidgets(lessonsOf(full).find((l) => l.id === first.id)))
        .catch(() => {});
      const onResize = () => drawPaths(chapters);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    },
  };
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

// ---------- lesson ----------
// The lesson player (js/lesson.js) draws the page; this is its <head>. c and l come from the catalog.
export function lessonHead(c, l) {
  const path = paths.lesson(c.id, l.id);
  return {
    title: `${l.title} · ${c.title} · OpenAha`,
    description: `${l.summary ? `${sentence(l.summary)} ` : ''}A free interactive lesson from ${c.title}: ${l.nSteps} hands-on steps, about ${l.minutes} minutes.`,
    path,
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'LearningResource',
          '@id': ORIGIN + path,
          name: l.title,
          ...(l.summary ? { description: l.summary } : {}),
          url: ORIGIN + path,
          learningResourceType: 'Interactive lesson',
          provider: PUBLISHER,
          inLanguage: 'en',
          isAccessibleForFree: true,
          educationalLevel: c.level,
          timeRequired: `PT${l.minutes}M`,
          isPartOf: { '@type': 'Course', '@id': ORIGIN + paths.course(c.id), name: c.title },
        },
        breadcrumbs(['OpenAha', paths.home()], [c.title, paths.course(c.id)], [l.title, path]),
      ],
    },
  };
}

// What a lesson's address shows before the player starts, written into the page by the build: an outline
// for search engines, link previews and browsers without JavaScript. Where JavaScript runs (html.js),
// css/components.css hides it and the player replaces it.
// c and l come from the catalog; full is the lesson with its steps and recap.
export function lessonOutline(c, l, full) {
  const all = lessonsOf(c);
  const i = all.findIndex((x) => x.id === l.id);
  const [prev, next] = [all[i - 1], all[i + 1]];
  return h('div.lesson-static',
    header(),
    h('main',
      h('article.text-page.lesson-outline.wrap',
        h('a.back-link', { href: paths.course(c.id), html: `${icons.left}<span>${c.title}</span>` }),
        h('div.eyebrow', `${subjectName(c)} · ${c.level} · Lesson ${i + 1} of ${all.length}`),
        h('h1', l.title),
        l.summary ? h('p.lead', l.summary) : null,
        h('p', `An interactive lesson with ${l.nSteps} steps, about ${l.minutes} minutes: you predict, drag and solve, with instant feedback on every answer. It runs in your browser and needs JavaScript.`),
        h('h2', 'What you’ll learn'),
        h('ul', full.recap.map((r) => h('li', { html: mdi(r) }))),
        h('h2', 'Steps'),
        h('ol', full.steps.filter((st) => st.title).map((st) => h('li', { html: mdi(st.title) }))),
        h('nav.lesson-pager', { 'aria-label': 'Lessons' },
          prev ? h('a', { href: paths.lesson(c.id, prev.id), rel: 'prev' }, `Previous: ${prev.title}`) : null,
          next ? h('a', { href: paths.lesson(c.id, next.id), rel: 'next' }, `Next: ${next.title}`) : h('a', { href: paths.course(c.id) }, `Back to ${c.title}`)))),
    footer());
}
