// Markdown-lite renderer with KaTeX.
//   $inline$  $$display$$  **bold**  *italic*  `code`  {blue:coloured text}
//   blank line = new paragraph, "- " bullets, "1. " numbered,
//   "::: key" / "::: callout" ... ":::" blocks, lines starting with "<" pass through as HTML.
// Math macros: \blue{x} \coral{x} \teal{x} \amber{x} \violet{x} \pink{x} \green{x} \red{x}

const COLORS = ['blue', 'coral', 'teal', 'amber', 'violet', 'pink', 'green', 'red'];
const macros = {};
for (const c of COLORS) macros['\\' + c] = `\\htmlClass{c-${c}}{#1}`;
Object.assign(macros, {
  '\\R': '\\mathbb{R}',
  '\\dd': '\\,\\mathrm{d}',
  '\\unit': '\\,\\mathrm{#1}',
});

const KATEX_OPTS = {
  throwOnError: false,
  strict: 'ignore',
  trust: (ctx) => ctx.command === '\\htmlClass',
  macros,
};

// KaTeX (script and stylesheet) loads the first time a page with math is about to render.
let katexReady;
export function loadKatex() {
  if (katexReady) return katexReady;
  if (window.katex) return Promise.resolve();
  const add = (tag, attrs) =>
    new Promise((resolve, reject) => {
      const el = Object.assign(document.createElement(tag), attrs, { onload: resolve, onerror: reject });
      // the stylesheet goes before ours, so our .katex rules still win
      document.head.insertBefore(el, tag === 'link' ? document.head.querySelector('link[rel="stylesheet"]') : null);
    });
  const base = new URL('../../vendor/katex/', import.meta.url);
  katexReady = Promise.all([
    add('link', { rel: 'stylesheet', href: new URL('katex.min.css', base).href }),
    add('script', { src: new URL('katex.min.js', base).href }),
  ]).catch((e) => {
    katexReady = null;
    throw e;
  });
  return katexReady;
}

export function tex(src, display = false) {
  if (!window.katex) return escapeHtml(src);
  // KaTeX can't use a middle dot inside \text{}; write units like m·K safely
  src = fixMiddleDot(src);
  try {
    return window.katex.renderToString(src, { ...KATEX_OPTS, displayMode: display });
  } catch (e) {
    console.warn('KaTeX error', src, e);
    return escapeHtml(src);
  }
}

// KaTeX can't render a middle dot inside \text{}: split such groups around \cdot,
// and turn any remaining middle dots in math into \cdot.
export function fixMiddleDot(src) {
  return src
    .replace(/\\text\{([^{}]*)\}/g, (m, inner) => (inner.includes('·') ? inner.split('·').map((t) => `\\text{${t}}`).join('\\cdot ') : m))
    .replace(/·/g, '\\cdot ');
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function inline(s, stash) {
  return s
    .replace(/`([^`]+)`/g, (_, c) => stash(`<code>${escapeHtml(c)}</code>`))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\{(blue|coral|teal|amber|violet|pink|green|red):([^{}]+)\}/g, '<span class="c-$1">$2</span>');
}

export function md(src) {
  if (src == null) return '';
  src = String(src).replace(/^\n+|\s+$/g, '');
  // dedent template literals
  const lines0 = src.split('\n');
  const indents = lines0.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const minIndent = indents.length ? Math.min(...indents) : 0;
  src = lines0.map((l) => l.slice(minIndent)).join('\n');

  const store = [];
  const stash = (htmlStr) => {
    store.push(htmlStr);
    return `\u0000${store.length - 1}\u0000`;
  };
  // an escaped \$ is a literal dollar sign: it never opens display math, and may appear inside inline math
  src = src.replace(/(^|[^\\])\$\$([\s\S]+?)\$\$/g, (_, pre, m) => pre + stash(tex(m.trim(), true)));
  src = src.replace(/(^|[^\\])\$((?:\\\$|[^$\n])+?)\$/g, (_, pre, m) => pre + stash(tex(m, false)));
  src = src.replace(/\\\$/g, '$');

  const out = [];
  const blocks = src.split(/\n{2,}/);
  let open = null; // ::: block
  for (let block of blocks) {
    const lines = block.split('\n');
    let buf = [];
    const flushPara = () => {
      if (buf.length) out.push(`<p>${inline(buf.join(' '), stash)}</p>`);
      buf = [];
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const t = line.trim();
      let m;
      if ((m = t.match(/^:::\s*(\w+)?\s*$/))) {
        flushPara();
        if (open && !m[1]) {
          out.push('</div>');
          open = null;
        } else {
          open = m[1] || 'callout';
          out.push(`<div class="${open}">`);
        }
        continue;
      }
      if (/^[-*] /.test(t)) {
        flushPara();
        const items = [];
        while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
          items.push(`<li>${inline(lines[i].trim().slice(2), stash)}</li>`);
          i++;
        }
        i--;
        out.push(`<ul>${items.join('')}</ul>`);
        continue;
      }
      if (/^\d+\. /.test(t)) {
        flushPara();
        const items = [];
        while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
          items.push(`<li>${inline(lines[i].trim().replace(/^\d+\. /, ''), stash)}</li>`);
          i++;
        }
        i--;
        out.push(`<ol>${items.join('')}</ol>`);
        continue;
      }
      if (t.startsWith('|')) {
        // simple pipe table: header row, separator row, body rows
        flushPara();
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
          i++;
        }
        i--;
        const body = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
        const [head, ...rest] = body;
        out.push(`<table class="md-table"><thead><tr>${head.map((c) => `<th>${inline(c, stash)}</th>`).join('')}</tr></thead><tbody>${rest.map((r) => `<tr>${r.map((c) => `<td>${inline(c, stash)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
        continue;
      }
      if (t.startsWith('<')) {
        flushPara();
        out.push(t);
        continue;
      }
      if (/^\u0000\d+\u0000$/.test(t) && store[+t.slice(1, -1)].includes('katex-display')) {
        flushPara();
        out.push(t);
        continue;
      }
      buf.push(t);
    }
    flushPara();
  }
  if (open) out.push('</div>');
  let res = out.join('\n');
  // restore stashed (may be nested once)
  for (let k = 0; k < 2; k++) res = res.replace(/\u0000(\d+)\u0000/g, (_, i) => store[+i]);
  return res;
}

// inline-only (no paragraphs), for choice labels and feedback lines
export function mdi(src) {
  if (src == null) return '';
  const store = [];
  const stash = (htmlStr) => {
    store.push(htmlStr);
    return `\u0000${store.length - 1}\u0000`;
  };
  let s = String(src);
  s = s.replace(/(^|[^\\])\$\$([\s\S]+?)\$\$/g, (_, pre, m) => pre + stash(tex(m.trim(), false)));
  s = s.replace(/(^|[^\\])\$((?:\\\$|[^$\n])+?)\$/g, (_, pre, m) => pre + stash(tex(m, false)));
  s = s.replace(/\\\$/g, '$');
  s = inline(s, stash);
  for (let k = 0; k < 2; k++) s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => store[+i]);
  return s;
}
