// Tiny code formatter for lesson listings and the trace widget (pure string functions).
// Pseudocode in a Python-like style: keywords, numbers, strings and # comments are coloured.

const KEYWORDS = /\b(for|in|range|while|if|elif|else|repeat|times|def|return|print|and|or|not|True|False|to|end)\b/g;

const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function highlight(line) {
  const hash = line.indexOf('#');
  const code = hash >= 0 ? line.slice(0, hash) : line;
  const comment = hash >= 0 ? line.slice(hash) : '';
  const parts = code.split(/("[^"]*")/);
  const body = parts.map((p, i) => {
    if (i % 2) return `<span class="cd-str">${esc(p)}</span>`;
    return esc(p)
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="cd-num">$1</span>')
      .replace(KEYWORDS, '<span class="cd-kw">$1</span>');
  }).join('');
  return body + (comment ? `<span class="cd-com">${esc(comment)}</span>` : '');
}

// A code listing as one line of HTML, so the markdown renderer passes it through untouched.
// Never put a dollar sign in a listing: the markdown renderer would read it as maths.
export function codeBlock(lines) {
  const rows = (Array.isArray(lines) ? lines : lines.split('\n')).map((l) => `<span class="cd-line">${highlight(l) || ' '}</span>`).join('');
  return `<div class="code-block" role="figure" aria-label="Code listing">${rows}</div>`;
}
