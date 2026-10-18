// Client-side navigation with real URLs (History API). Clicking a link to one of the site's pages
// changes the address without reloading; Back and Forward re-render the page they return to.
import { parseRoute, routePath, legacyPath } from './routes.js';

let handler = () => {};

function render() {
  // old hash links (#/course/...) and non-canonical paths (no trailing slash, /index.html) get the page's own URL
  const legacy = legacyPath(location.hash);
  if (legacy) history.replaceState(null, '', legacy);
  const own = routePath(parseRoute(location.pathname, location.search));
  if (own && own !== location.pathname) history.replaceState(null, '', own + location.search + location.hash);
  handler();
}

export function navigate(to, { replace = false } = {}) {
  if (to !== location.pathname + location.search + location.hash) history[replace ? 'replaceState' : 'pushState'](null, '', to);
  render();
}

// draws the current page again, e.g. after progress was reset
export const rerender = () => render();

export function startRouter(fn) {
  handler = fn;
  addEventListener('popstate', render);
  // an old hash link typed into the address bar changes only the hash, which doesn't reload the page
  addEventListener('hashchange', () => legacyPath(location.hash) && render());
  document.addEventListener('click', onLinkClick);
  render();
}

function onLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href]');
  if (!(a instanceof HTMLAnchorElement) || a.target || a.hasAttribute('download')) return;
  const url = new URL(a.href);
  // other sites, files (anything with an extension) and anchors within this page are left to the browser
  if (url.origin !== location.origin || /\.\w+$/.test(url.pathname)) return;
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
  e.preventDefault();
  navigate(url.pathname + url.search + url.hash);
}
