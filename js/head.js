// The <head> tags that differ per page: title, description, canonical URL, link previews, robots and
// structured data. The app sets them on every page change; scripts/build-site.mjs writes them into each page.
import { ORIGIN } from './routes.js';

// path: the page's canonical URL path (null for a page without one, like "not found").
// noindex: keep the page out of search results. jsonld: schema.org data for search engines.
export function setHead({ title, description, path = null, noindex = false, jsonld = null }) {
  document.title = title;
  const url = path == null ? null : ORIGIN + path;
  tag('meta', 'name', 'description', 'content', description);
  tag('meta', 'name', 'robots', 'content', noindex ? 'noindex' : null);
  tag('link', 'rel', 'canonical', 'href', noindex ? null : url);
  tag('meta', 'property', 'og:url', 'content', url);
  tag('meta', 'property', 'og:title', 'content', title);
  tag('meta', 'property', 'og:description', 'content', description);
  // "<" is escaped so that no text in the data can end the script element
  tag('script', 'type', 'application/ld+json', 'text', jsonld && JSON.stringify(jsonld).replace(/</g, '\\u003c'));
}

// sets (or with value null, removes) the <tagName key="id"> element's value
function tag(tagName, key, id, attr, value) {
  let el = document.head.querySelector(`${tagName}[${key}="${id}"]`);
  if (value == null) return el?.remove();
  if (!el) {
    el = document.createElement(tagName);
    el.setAttribute(key, id);
    document.head.append(el);
  }
  if (attr === 'text') el.textContent = value;
  else el.setAttribute(attr, value);
}
