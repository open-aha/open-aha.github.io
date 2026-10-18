// A course's prereq is plain text naming other courses by their exact titles, for example
// "Sequences & Series, and Complex Numbers (for the Mandelbrot and Julia set lessons)".
// The course page links each course it names; scripts/validate.mjs rejects any other text,
// so renaming a course can't silently drop a link.

// The text cut into parts, in order: { course } for each course it names, { text } between them.
export function prereqParts(text, courses) {
  const longestFirst = [...courses].sort((a, b) => b.title.length - a.title.length);
  const parts = [];
  let plain = '';
  for (let i = 0; i < text.length; ) {
    const c = /\w/.test(text[i - 1] || '') ? null : longestFirst.find((c) => text.startsWith(c.title, i) && !/\w/.test(text[i + c.title.length] || ''));
    if (c) {
      if (plain) parts.push({ text: plain });
      parts.push({ course: c });
      plain = '';
      i += c.title.length;
    } else plain += text[i++];
  }
  if (plain) parts.push({ text: plain });
  return parts;
}

// Why course c's prereq can't be linked properly, or null when it's fine. Allowed between titles:
// commas, "and", "or", and a note in parentheses such as "(for E = mc²)".
export function prereqProblem(c, courses) {
  const parts = prereqParts(c.prereq, courses);
  const named = parts.filter((p) => p.course).map((p) => p.course);
  if (!named.length) return 'names no course by its exact title';
  if (named.some((n) => n.id === c.id)) return 'names the course itself';
  if (new Set(named).size < named.length) return 'names a course twice';
  const rest = parts.filter((p) => p.text).map((p) => p.text.replace(/\([^()]*\)/g, ' ')).join(' ');
  if (!/^(\s|,|\band\b|\bor\b)*$/.test(rest)) return `has text that isn’t a course title: "${rest.replace(/\s+/g, ' ').trim()}"`;
  return null;
}
