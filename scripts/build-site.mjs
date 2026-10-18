// Builds the site GitHub Pages serves, in _site/: the static files, plus a real HTML page for every
// address (home, about, legal, each course and each lesson), 404.html, sitemap.xml and robots.txt.
// Each page carries its own title, description, canonical URL, structured data and content, so search
// engines and link previews see it without running JavaScript. In the browser, js/app.js then takes
// over the same page. The pages come from the app's own code (js/pages.js), rendered here with linkedom.
// .github/workflows/deploy.yml runs this on every push to main. Local development needs no build.
// Usage: node scripts/build-site.mjs   then preview with: python3 scripts/serve.py 4173 _site
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import katex from 'katex';
import { updateCatalog } from './build-catalog.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = join(ROOT, '_site');
const STATIC = ['css', 'js', 'img', 'vendor', 'favicon.svg', 'CNAME'];
const TEMPLATE = readFileSync(join(ROOT, 'index.html'), 'utf8');

if (updateCatalog()) console.log('updated js/courses/catalog.js');

// The app's modules expect a browser: a DOM (linkedom), KaTeX, no saved progress and the light theme.
const { window } = parseHTML(TEMPLATE);
Object.assign(globalThis, { window, Node: window.Node, matchMedia: () => ({ matches: false }) });
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: () => {} } });
window.katex = katex;
const { ORIGIN, paths } = await import('../js/routes.js');
const { setHead } = await import('../js/head.js');
const { escapeHtml } = await import('../js/lib/md.js');
const { courses } = await import('../js/courses/catalog.js');
const { courses: fullCourses } = await import('../js/courses/index.js');
const pages = await import('../js/pages.js');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of STATIC) cpSync(join(ROOT, f), join(OUT, f), { recursive: true, filter: (src) => !src.endsWith('.DS_Store') });

// Writes one page: render() builds { head, body } into a fresh copy of index.html.
function writePage(file, render) {
  const { document } = parseHTML(TEMPLATE);
  globalThis.document = document;
  const { head, body } = render();
  setHead(head);
  for (const el of body) el.classList?.remove('page-enter');
  document.getElementById('app').replaceChildren(...body);
  // Course-card art is decorative (aria-hidden) and already in js/art.js, which every page loads:
  // in the HTML it would add 50 KB (gzip) to each home page visit. The app draws it when it takes
  // over; the card keeps its size meanwhile (fixed aspect ratio in css/components.css).
  for (const art of document.querySelectorAll('#app .course-card .cover')) art.replaceChildren();
  if (document.querySelector('#app .katex')) {
    // before our stylesheets, as js/lib/md.js loadKatex() does, so our .katex rules still win
    const css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('href', '/vendor/katex/katex.min.css');
    document.head.insertBefore(css, document.head.querySelector('link[rel="stylesheet"]'));
  }
  // linkedom writes <title> text unescaped
  const html = document.toString().replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(head.title)}</title>`);
  mkdirSync(dirname(join(OUT, file)), { recursive: true });
  writeFileSync(join(OUT, file), html + '\n');
}
const fileFor = (path) => join(path, 'index.html');

// When each course's content last changed (its last commit), for the sitemap; null without git history.
function lastChanged(file) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim() || null;
  } catch (e) {
    return null;
  }
}

const sitemap = [{ path: paths.home() }, { path: paths.about() }];
writePage(fileFor(paths.home()), () => pages.homePage());
writePage(fileFor(paths.courses()), () => pages.homePage({ scrollToCourses: true }));
writePage(fileFor(paths.about()), () => pages.aboutPage());
writePage(fileFor(paths.legal()), () => pages.legalPage());
writePage('404.html', () => pages.notFoundPage());

let nLessons = 0;
for (const c of courses) {
  const full = fullCourses.find((f) => f.id === c.id);
  const fullLessons = full.chapters.flatMap((ch) => ch.lessons);
  const lastmod = lastChanged(`js/courses/${c.id}.js`);
  writePage(fileFor(paths.course(c.id)), () => pages.coursePage(c));
  sitemap.push({ path: paths.course(c.id), lastmod });
  for (const l of c.chapters.flatMap((ch) => ch.lessons)) {
    const fl = fullLessons.find((x) => x.id === l.id);
    writePage(fileFor(paths.lesson(c.id, l.id)), () => ({ head: pages.lessonHead(c, l), body: [pages.lessonOutline(c, l, fl)] }));
    sitemap.push({ path: paths.lesson(c.id, l.id), lastmod });
    nLessons++;
  }
}

writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(({ path, lastmod }) => `  <url><loc>${ORIGIN}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

// ---------- checks: every page is complete, and every link on it leads somewhere ----------
const errors = [];
const htmlFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = join(dir, e.name);
  return e.isDirectory() ? (['js', 'css', 'vendor', 'img'].includes(e.name) && dir === OUT ? [] : htmlFiles(p)) : e.name.endsWith('.html') ? [p] : [];
});
const exists = (path) => existsSync(join(OUT, path.endsWith('/') ? fileFor(path) : path));
const files = htmlFiles(OUT);
for (const file of files) {
  const name = relative(OUT, file);
  const { document } = parseHTML(readFileSync(file, 'utf8'));
  const noindex = document.querySelector('meta[name="robots"]')?.getAttribute('content') === 'noindex';
  if (!document.title.trim()) errors.push(`${name}: no title`);
  if (!document.querySelector('meta[name="description"]')?.getAttribute('content')) errors.push(`${name}: no description`);
  if (noindex === !!document.querySelector('link[rel="canonical"]')) errors.push(`${name}: needs either a canonical link or noindex`);
  if (!document.getElementById('app').firstElementChild) errors.push(`${name}: #app is empty`);
  for (const ld of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      JSON.parse(ld.textContent);
    } catch (e) {
      errors.push(`${name}: invalid structured data`);
    }
  }
  for (const el of document.querySelectorAll('[href], [src]')) {
    const url = el.getAttribute('href') ?? el.getAttribute('src');
    if (url.includes('#/')) errors.push(`${name}: old hash link ${url}`);
    const local = url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) || '/' : url;
    if (/^[a-z]+:/.test(local) || local.startsWith('//') || local.startsWith('#')) continue;
    if (!local.startsWith('/')) errors.push(`${name}: relative link ${url} (breaks below the top folder)`);
    else if (!exists(local.split(/[?#]/)[0])) errors.push(`${name}: broken link ${url}`);
  }
}
for (const { path } of sitemap) if (!exists(path)) errors.push(`sitemap.xml: ${path} has no page`);

if (errors.length) {
  console.error(`${errors.length} problems:\n  ${[...new Set(errors)].slice(0, 50).join('\n  ')}`);
  process.exit(1);
}
console.log(`built _site/: ${files.length} pages (${courses.length} courses, ${nLessons} lessons), ${sitemap.length} URLs in sitemap.xml`);
