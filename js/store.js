// Per-viewer progress, XP and streak in localStorage (all access guarded).

const KEY = 'lumen:v1';
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { xp: 0, lessons: {}, streak: { count: 0, last: null }, ...JSON.parse(raw) };
  } catch (e) {
    /* storage unavailable */
  }
  return { xp: 0, lessons: {}, streak: { count: 0, last: null }, last: null, theme: null };
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const store = {
  get xp() {
    return state.xp;
  },
  streak() {
    const s = state.streak;
    if (!s.last) return { count: 0, active: false };
    const d = dayDiff(s.last, today());
    if (d === 0) return { count: s.count, active: true };
    if (d === 1) return { count: s.count, active: false };
    return { count: 0, active: false };
  },
  addXp(n) {
    state.xp += n;
    save();
  },
  // call when a lesson is completed
  tickStreak() {
    const s = state.streak;
    const t = today();
    if (s.last === t) return s.count;
    s.count = s.last && dayDiff(s.last, t) === 1 ? s.count + 1 : 1;
    s.last = t;
    save();
    return s.count;
  },
  lesson(courseId, lessonId) {
    return state.lessons[`${courseId}/${lessonId}`] || null;
  },
  completeLesson(courseId, lessonId, { accuracy, xp }) {
    const k = `${courseId}/${lessonId}`;
    const prev = state.lessons[k];
    state.lessons[k] = {
      done: true,
      best: Math.max(accuracy, prev?.best ?? 0),
      xp: (prev?.xp ?? 0) + xp,
      at: Date.now(),
    };
    save();
  },
  setLast(courseId, lessonId) {
    state.last = { courseId, lessonId, at: Date.now() };
    save();
  },
  get last() {
    return state.last;
  },
  courseProgress(course) {
    const all = course.chapters.flatMap((c) => c.lessons);
    const done = all.filter((l) => this.lesson(course.id, l.id)?.done).length;
    return { done, total: all.length, pct: all.length ? done / all.length : 0 };
  },
  get theme() {
    return state.theme;
  },
  set theme(t) {
    state.theme = t;
    save();
  },
  // how often a one-off tip (e.g. 'suggest') has been shown
  tipCount(id) {
    return state.tips?.[id] ?? 0;
  },
  countTip(id) {
    state.tips = { ...state.tips, [id]: this.tipCount(id) + 1 };
    save();
  },
  reset() {
    state = { xp: 0, lessons: {}, streak: { count: 0, last: null }, last: null, theme: state.theme, tips: state.tips };
    save();
  },
};
