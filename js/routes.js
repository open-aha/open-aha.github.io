// The site's URLs. The app routes with them, and scripts/build-site.mjs writes a real page for each.
//   /                              home
//   /courses/                      home, scrolled to the course list
//   /courses/<course>/             course
//   /courses/<course>/<lesson>/    lesson; ?step=N opens it at step N (counting from 1)
//   /about/   /legal/
// Every page URL ends in a slash: GitHub Pages serves them as folders with an index.html.

export const ORIGIN = 'https://openaha.org';

export const paths = {
  home: () => '/',
  courses: () => '/courses/',
  about: () => '/about/',
  legal: () => '/legal/',
  course: (course) => `/courses/${course}/`,
  lesson: (course, lesson, step) => `/courses/${course}/${lesson}/${step ? `?step=${step}` : ''}`,
};

// '/courses/ratios/fractions/', '?step=3' → { page: 'lesson', course: 'ratios', lesson: 'fractions', step: 3 }
// page is one of home, courses, about, legal, course, lesson, notfound.
export function parseRoute(pathname, search = '') {
  const parts = pathname.replace(/\/index\.html$/, '/').split('/').filter(Boolean);
  const [a, b, c] = parts;
  const notFound = { page: 'notfound' };
  if (!a) return { page: 'home' };
  if (a === 'about' || a === 'legal') return parts.length === 1 ? { page: a } : notFound;
  if (a !== 'courses' || parts.length > 3) return notFound;
  if (!b) return { page: 'courses' };
  if (!c) return { page: 'course', course: b };
  const step = new URLSearchParams(search).get('step');
  return { page: 'lesson', course: b, lesson: c, step: /^[1-9]\d*$/.test(step) ? +step : 0 };
}

// The page's own URL path for a parsed route, or null for a page that doesn't exist.
export function routePath(r) {
  if (r.page === 'course') return paths.course(r.course);
  if (r.page === 'lesson') return paths.lesson(r.course, r.lesson);
  return paths[r.page] ? paths[r.page]() : null;
}

// Links from before October 2026 used hash routes: #/courses, #/about, #/legal, #/course/<course>,
// #/lesson/<course>/<lesson>/<step>. Returns the matching path, or null if the hash isn't one of them.
export function legacyPath(hash) {
  if (!hash.startsWith('#/')) return null;
  const [page, a, b, step] = hash.slice(2).split('/').filter(Boolean);
  if (page === 'courses' || page === 'about' || page === 'legal') return paths[page]();
  if (page === 'course' && a) return paths.course(a);
  if (page === 'lesson' && a) return b ? paths.lesson(a, b, /^[1-9]\d*$/.test(step) ? step : 0) : paths.course(a);
  return paths.home();
}
