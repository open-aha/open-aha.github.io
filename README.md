# OpenAha

Free, interactive lessons in math and science. Every lesson is a short sequence of
hands-on puzzles: predict, drag, simulate and solve, with instant feedback and an explanation
behind every answer.

**Start learning at [openaha.org](https://openaha.org)**

## Layout

| Path | What it is |
|---|---|
| `index.html` | App shell |
| `css/` | Design tokens (light/dark), components, lesson player, widgets |
| `js/app.js` | Router and pages (home, course path) |
| `js/lesson.js` | Lesson player: steps, Check → feedback, XP, streak, completion |
| `js/steps.js` | Step types: explain, mcq, multi, numeric, interactive, order |
| `js/widgets/` | Interactive figures: graph (the general workhorse: sliders, draggable points, animation), figure, balance, track, projectile, forces, energy, circuit, sampler, monty, orbit, collide, sieve, gas, doubleslit, network, decay, mandel, ipd, bits, symmetry, gates, turing |
| `js/courses/` | Course content (data + small drawing helpers) |
| `js/art.js` | Course cover illustrations |
| `scripts/validate.mjs` | Content validator |

Progress, XP and streaks are stored in `localStorage` on the viewer's device.

Dev shortcut: `#/lesson/<course>/<lesson>/<step>` opens a lesson at a given step (steps count from 1).

## Adding a course

1. Write `js/courses/<id>.js` exporting `{ id, subject, title, level, cover, tagline, description, prereq, chapters }`.
2. Add a cover to `js/art.js` (keyed by `cover`).
3. Import it in `js/courses/index.js` and place it in the learning path.
4. Run `npm run validate`.
