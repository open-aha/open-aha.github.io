// Validate all course content: structure, answers, and that every formula renders in KaTeX.
// Usage: node scripts/validate.mjs
import katex from 'katex';
import { courses } from '../js/courses/index.js';
import { covers } from '../js/art.js';
import { readFileSync, existsSync } from 'node:fs';
import { updateCatalog } from './build-catalog.mjs';
import { fixMiddleDot } from '../js/lib/md.js';
import { prereqProblem } from '../js/lib/prereq.js';
import { evaluate as evaluateGates } from '../js/widgets/gates-core.js';
import { withEdits as tmEdits } from '../js/widgets/turing-core.js';
import { solves as robotSolves, parseWorld } from '../js/widgets/robot-core.js';
import { collect as traceCollect } from '../js/widgets/trace.js';

const COLORS = ['blue', 'coral', 'teal', 'amber', 'violet', 'pink', 'green', 'red'];
const macros = {};
for (const c of COLORS) macros['\\' + c] = `\\htmlClass{c-${c}}{#1}`;
Object.assign(macros, { '\\R': '\\mathbb{R}', '\\dd': '\\,\\mathrm{d}', '\\unit': '\\,\\mathrm{#1}' });

// widget kinds registered in js/widgets/index.js
const reg = readFileSync(new URL('../js/widgets/index.js', import.meta.url), 'utf8');
const KINDS = new Set([...reg.matchAll(/^\s*(\w+): \(\) => import\(/gm)].map((m) => m[1]));

const errors = [];
const warns = [];

// every CSS custom property used in course files must be defined in css/tokens.css (--cc-soft is set per course)
{
  const tokens = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8');
  const defined = new Set([...tokens.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]).concat(['--cc-soft']));
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(new URL('../js/courses/', import.meta.url))) {
    if (!f.endsWith('.js')) continue;
    const src = readFileSync(new URL('../js/courses/' + f, import.meta.url), 'utf8');
    for (const m of src.matchAll(/var\((--[a-z0-9-]+)\)/g)) if (!defined.has(m[1])) errors.push(`${f}: undefined CSS variable ${m[1]}`);
  }
}
let stepCount = 0, mathCount = 0;

function checkMath(str, where) {
  if (typeof str !== 'string') return;
  let src = str.replace(/\\\$/g, '');
  const display = [...src.matchAll(/\$\$([\s\S]+?)\$\$/g)].map((m) => m[1]);
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, '');
  const inline = [...src.matchAll(/\$([^$\n]+?)\$/g)].map((m) => m[1]);
  const rest = src.replace(/\$([^$\n]+?)\$/g, '');
  if (rest.includes('$')) errors.push(`${where}: unmatched $ in "${str.slice(0, 80)}"`);
  for (const [m, disp] of [...display.map((d) => [d, true]), ...inline.map((d) => [d, false])]) {
    mathCount++;
    try {
      katex.renderToString(fixMiddleDot(m), { displayMode: disp, throwOnError: true, strict: 'ignore', trust: (c) => c.command === '\\htmlClass', macros: { ...macros } });
    } catch (e) {
      errors.push(`${where}: KaTeX error in "${m}": ${e.message.split('\n')[0]}`);
    }
  }
}

function walkStrings(obj, where, seen = new Set()) {
  if (obj == null || seen.has(obj)) return;
  if (typeof obj === 'string') return checkMath(obj, where);
  if (typeof obj !== 'object') return;
  seen.add(obj);
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'draw' || typeof v === 'function') continue;
    walkStrings(v, `${where}.${k}`, seen);
  }
}

const courseIds = new Set();
for (const c of courses) {
  const cw = `course ${c.id}`;
  for (const f of ['id', 'subject', 'title', 'level', 'cover', 'tagline', 'description', 'chapters'])
    if (!c[f]) errors.push(`${cw}: missing ${f}`);
  if (courseIds.has(c.id)) errors.push(`${cw}: duplicate id`);
  // the app loads js/courses/<id>.js on demand
  const file = new URL(`../js/courses/${c.id}.js`, import.meta.url);
  if (!existsSync(file) || (await import(file)).default !== c) errors.push(`${cw}: must be the default export of js/courses/${c.id}.js`);
  courseIds.add(c.id);
  if (!['math', 'physics'].includes(c.subject)) errors.push(`${cw}: bad subject`);
  if (!covers[c.cover]) errors.push(`${cw}: unknown cover "${c.cover}"`);
  // the course page links every course named here (js/lib/prereq.js)
  const prereqIssue = c.prereq && prereqProblem(c, courses);
  if (prereqIssue) errors.push(`${cw}: prereq ${prereqIssue}`);
  checkMath(c.description, cw);
  const lessonIds = new Set();
  for (const ch of c.chapters) {
    if (!ch.lessons?.length) errors.push(`${cw}/${ch.title}: no lessons`);
    for (const l of ch.lessons) {
      const lw = `${c.id}/${l.id}`;
      if (lessonIds.has(l.id)) errors.push(`${lw}: duplicate lesson id`);
      lessonIds.add(l.id);
      if (!l.title || !l.steps?.length) errors.push(`${lw}: missing title/steps`);
      walkStrings(l.recap, `${lw}.recap`);
      l.steps.forEach((st, i) => {
        stepCount++;
        const sw = `${lw}#${i + 1}(${st.type})`;
        walkStrings(st, sw);
        if (st.widget && !KINDS.has(st.widget.kind)) errors.push(`${sw}: unknown widget kind "${st.widget.kind}"`);
        if (st.widget?.kind === 'graph') {
          const COLORS = new Set(['amber', 'blue', 'coral', 'green', 'ink', 'muted', 'pink', 'teal', 'violet']);
          for (const c of [...(st.widget.curves || []), ...(st.widget.points || [])]) if (c.color && !COLORS.has(c.color)) errors.push(`${sw}: unknown curve/point colour "${c.color}"`);
        }
        switch (st.type) {
          case 'explain':
            if (!st.body && !st.widget) errors.push(`${sw}: explain step without body or widget`);
            break;
          case 'mcq': {
            const ok = st.choices?.filter((x) => x.ok).length;
            if (ok !== 1) errors.push(`${sw}: mcq needs exactly 1 correct choice (has ${ok})`);
            if ((st.choices?.length || 0) < 2) errors.push(`${sw}: needs ≥2 choices`);
            st.choices?.forEach((ch, k) => { if (!ch.ok && !ch.why) warns.push(`${sw}: choice ${k + 1} has no diagnostic "why"`); });
            if (!st.prompt) errors.push(`${sw}: missing prompt`);
            break;
          }
          case 'multi': {
            const ok = st.choices?.filter((x) => x.ok).length;
            if (!ok) errors.push(`${sw}: multi needs ≥1 correct choice`);
            if (!st.prompt) errors.push(`${sw}: missing prompt`);
            break;
          }
          case 'numeric': {
            if (typeof st.answer !== 'number' || !isFinite(st.answer)) errors.push(`${sw}: answer must be a finite number`);
            const tol = st.tol ?? (st.relTol ? Math.abs(st.answer) * st.relTol : 1e-6);
            for (const w of st.wrong || []) {
              if (typeof w.v !== 'number' || !isFinite(w.v)) errors.push(`${sw}: wrong value not numeric`);
              else if (Math.abs(w.v - st.answer) <= tol) errors.push(`${sw}: wrong value ${w.v} is within tolerance of the answer`);
              if (!w.why) errors.push(`${sw}: wrong value ${w.v} missing why`);
            }
            if (!st.prompt) errors.push(`${sw}: missing prompt`);
            break;
          }
          case 'interactive':
            if (!st.widget) errors.push(`${sw}: interactive step needs a widget`);
            break;
          case 'order':
            if (!(st.items?.length >= 2)) errors.push(`${sw}: order needs ≥2 items`);
            break;
          default:
            errors.push(`${sw}: unknown step type`);
        }
        if (st.type !== 'explain' && !st.explain) warns.push(`${sw}: no explanation`);
        // numeric graph widget goals: evaluate solution against goal if both exist
        const w = st.widget;
        if (w?.kind === 'graph' && w.goal && w.solution) {
          const p = {};
          for (const [k, d] of Object.entries(w.params || {})) p[k] = d.value;
          Object.assign(p, w.solution);
          const r = w.goal(p);
          const ok = typeof r === 'object' ? r.ok : r;
          if (!ok) errors.push(`${sw}: graph solution does not satisfy goal`);
          const p0 = {};
          for (const [k, d] of Object.entries(w.params || {})) p0[k] = d.value;
          const r0 = w.goal(p0);
          if (typeof r0 === 'object' ? r0.ok : r0) warns.push(`${sw}: initial state already satisfies goal`);
        }
        if (w?.kind === 'track' && w.goal && w.solution) {
          const p = {};
          for (const [k, d] of Object.entries(w.params || {})) p[k] = d.value;
          Object.assign(p, w.solution);
          const r = w.goal(p);
          if (!(typeof r === 'object' ? r.ok : r)) errors.push(`${sw}: track solution does not satisfy goal`);
          for (const [k, v] of Object.entries(w.solution)) {
            const d = w.params?.[k];
            if (d && (v < d.min || v > d.max || Math.abs(Math.round((v - d.min) / d.step) * d.step + d.min - v) > 1e-9))
              errors.push(`${sw}: solution ${k}=${v} not reachable by slider`);
          }
        }
        if (w?.kind === 'projectile' && w.solution) {
          const g = w.g ?? 9.8, h0 = w.h0 ?? 0;
          const angle = w.solution.angle ?? w.angle ?? w.params?.angle?.value;
          const speed = w.solution.speed ?? w.speed ?? w.params?.speed?.value;
          const vx = speed * Math.cos((angle * Math.PI) / 180), vy = speed * Math.sin((angle * Math.PI) / 180);
          const T = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
          const run = { angle, speed, range: vx * T, T };
          if (w.goal) {
            const r = w.goal(run);
            if (!(typeof r === 'object' ? r.ok : r)) errors.push(`${sw}: projectile solution does not satisfy goal`);
          } else if (w.target && Math.abs(run.range - w.target.x) > w.target.w / 2) errors.push(`${sw}: projectile solution misses target (${run.range.toFixed(2)})`);
        }
        if (w?.kind === 'bits' && w.goal) {
          const n = w.n || 8;
          const bitsOf = (v) => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);
          const ok = (v) => { const r = w.goal(v, bitsOf(v)); return typeof r === 'object' ? r.ok : r; };
          if (w.solution == null) errors.push(`${sw}: bits goal without solution`);
          else if (!ok(w.solution)) errors.push(`${sw}: bits solution does not satisfy goal`);
          if (ok(w.value || 0)) warns.push(`${sw}: initial bits already satisfy goal`);
        }
        if (w?.kind === 'turing' && w.goal) {
          const okOf = (rules) => { const r = w.goal(rules); return typeof r === 'object' ? r.ok : r; };
          if (!w.solution) errors.push(`${sw}: turing goal without solution`);
          else if (!okOf(tmEdits(w.rules, w.solution))) errors.push(`${sw}: turing solution does not satisfy goal`);
          if (okOf(w.rules)) warns.push(`${sw}: initial turing rules already satisfy goal`);
        }
        if (w?.kind === 'gates' && w.goal) {
          const init = {};
          for (const i of w.inputs) init[i.id] = i.value ? 1 : 0;
          const okOf = (v) => { const r = w.goal(v); return typeof r === 'object' ? r.ok : r; };
          let v = evaluateGates(w, init);
          if (okOf(v)) warns.push(`${sw}: initial circuit already satisfies goal`);
          if (!w.solution) errors.push(`${sw}: gates goal without solution`);
          else {
            let cur = { ...init };
            for (const st of [w.solution].flat()) { cur = { ...cur, ...st }; v = evaluateGates(w, cur, v); }
            if (!okOf(v)) errors.push(`${sw}: gates solution does not satisfy goal`);
          }
          for (const g of w.gates) for (const id of g.in) if (!w.inputs.some((i) => i.id === id) && !w.gates.some((x) => x.id === id)) errors.push(`${sw}: gate ${g.id} has unknown input ${id}`);
        }
        if (w?.kind === 'robot') {
          const worlds = w.worlds || [w.world];
          for (const wd of worlds) { const W = parseWorld(wd); if (!W.start) errors.push(`${sw}: robot world has no start`); }
          if (!w.readonly) {
            if (!w.solution) errors.push(`${sw}: robot puzzle without solution`);
            else { const r = robotSolves(w, w.solution); if (!r.ok) errors.push(`${sw}: robot solution fails: ${r.msg}`); }
            if (robotSolves(w, w.program || []).ok) warns.push(`${sw}: initial robot program already solves the puzzle`);
          }
        }
        if (w?.kind === 'trace') {
          const p = {};
          for (const [k, d] of Object.entries(w.params || {})) p[k] = d.value;
          let fr = [];
          try { fr = traceCollect(w, p); } catch (e) { errors.push(`${sw}: trace run throws: ${e.message}`); }
          if (!fr.length) errors.push(`${sw}: trace produced no frames`);
          for (const f of fr) if (!(f.line >= 0 && f.line < w.lines.length)) { errors.push(`${sw}: trace frame points at line ${f.line}`); break; }
          if (w.goal) {
            const okOf = (q) => { const f2 = traceCollect(w, q); const r = w.goal(q, f2[f2.length - 1], f2); return typeof r === 'object' ? r.ok : r; };
            if (okOf(p)) warns.push(`${sw}: initial trace already satisfies goal`);
            if (!w.solution || !okOf({ ...p, ...w.solution })) errors.push(`${sw}: trace solution missing or fails the goal`);
          }
        }
        if (typeof w?.validate === 'function') {
          const msg = w.validate();
          if (msg) errors.push(`${sw}: ${msg}`);
        }
      });
    }
  }
}

const lessons = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.length, 0), 0);
console.log(`${courses.length} courses, ${lessons} lessons, ${stepCount} steps, ${mathCount} formulas checked`);
if (!errors.length && updateCatalog()) console.log('updated js/courses/catalog.js');
for (const w of warns) console.log('warn  ' + w);
for (const e of errors) console.log('ERROR ' + e);
if (errors.length) {
  console.log(`\n${errors.length} error(s)`);
  process.exit(1);
}
console.log('All good ✓');
