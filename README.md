<p align="center">
  <a href="https://openaha.org"><img src="img/social.png" alt="OpenAha: learn math and science by doing. Free, interactive lessons. No account, no paywall, open source." width="820"></a>
</p>

<h3 align="center">
  👉 <a href="https://openaha.org">Start learning at openaha.org</a>
</h3>

<p align="center">
  <a href="https://openaha.org"><img src="https://img.shields.io/badge/website-openaha.org-f26b3a?style=for-the-badge" alt="Website: openaha.org"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/code-MIT-3b6fe0?style=for-the-badge" alt="Code license: MIT"></a>
  <a href="LICENSE-CONTENT.md"><img src="https://img.shields.io/badge/lessons-CC_BY--SA_4.0-3b6fe0?style=for-the-badge" alt="Lesson license: CC BY-SA 4.0"></a>
</p>

<p align="center">
  Free, interactive lessons in math and science. Every lesson is a short sequence of
  hands-on puzzles: predict, drag, simulate and solve, with instant feedback and an explanation
  behind every answer.
</p>

<p align="center">
  <b>140+ courses</b> · <b>1,000+ lessons</b> · no account · no ads · free forever
</p>

<p align="center">
  Try one: <a href="https://openaha.org/courses/graphs/planar/?step=1">untangle a graph</a> ·
  <a href="https://openaha.org/courses/graphs/konigsberg/?step=3">draw the house in one stroke</a> ·
  <a href="https://openaha.org/courses/coding/sequence/?step=6">program a robot to grab the gem</a>
</p>

<p align="center">
  Found something confusing or wrong? Tap the flag in any lesson, or see <a href="CONTRIBUTING.md">how to contribute</a>.
</p>

---

## Layout

| Path | What it is |
|---|---|
| `index.html` | App shell, and the template for every built page |
| `css/` | Design tokens (light/dark), components, lesson player, widgets |
| `js/app.js` | Starts the app: picks the page for the address, loads courses and lessons |
| `js/routes.js` | The site's URLs (`/courses/<course>/<lesson>/`), and redirects for old `#/` links |
| `js/router.js` | Navigation between pages without reloading (History API) |
| `js/pages.js` | Pages (home, course, about, legal, not found), each with its title, description and structured data |
| `js/head.js` | Writes a page's `<head>` tags |
| `js/lesson.js` | Lesson player: steps, Check → feedback, XP, streak, completion |
| `js/steps.js` | Step types: explain, mcq, multi, numeric, interactive, order |
| `js/widgets/` | Interactive figures: graph (the general workhorse: sliders, draggable points, animation), figure, balance, track, projectile, forces, energy, circuit, sampler, monty, orbit, collide, sieve, gas, doubleslit, network, decay, mandel, ipd, bits, symmetry, gates, turing |
| `js/courses/` | Course content (data + small drawing helpers) |
| `js/courses/catalog.js` | Generated: every course without its lesson steps, for the home and course pages. A course's full file loads only when one of its lessons opens |
| `js/art.js` | Course cover illustrations |
| `scripts/validate.mjs` | Content validator |
| `scripts/build-catalog.mjs` | Builds `js/courses/catalog.js` (the validator runs it too) |
| `scripts/build-site.mjs` | Builds the deployed site in `_site/`: a real page for every course and lesson, `sitemap.xml`, `robots.txt`, `404.html` |
| `.github/workflows/deploy.yml` | On every push to `main`: validate, build, publish on GitHub Pages |

Progress, XP and streaks are stored in `localStorage` on the viewer's device.

Dev shortcut: `/courses/<course>/<lesson>/?step=<n>` opens a lesson at a given step (steps count from 1).


## Adding a course

1. Write `js/courses/<id>.js` exporting `{ id, subject, title, level, cover, tagline, description, prereq, chapters }`.
   `prereq` (optional) names the courses that help as background by their exact titles, joined with commas or "and", with an optional note in parentheses: `'Sequences & Series, and Complex Numbers (for the Mandelbrot and Julia set lessons)'`. The course page links each one and lists the courses that build on it; the validator rejects any other text.
2. Add a cover to `js/art.js` (keyed by `cover`).
3. Import it in `js/courses/index.js` and place it in the learning path.
4. Run `npm run validate`. It also regenerates `js/courses/catalog.js`.
