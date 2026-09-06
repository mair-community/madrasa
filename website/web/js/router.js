/**
 * History-API router.
 *
 * Paths are resolved relative to BASE so the same build works at `/` and at a
 * GitHub Pages project path. Unknown deep links are served `404.html` (a copy of
 * the shell) by Pages, and by `scripts/serve.py` locally.
 */
import { BASE } from './config.js';

const routes = [];
let onNavigate = null;

/** @param {string} pattern e.g. `explore`, `program/:id` */
export function route(pattern, handler) {
  const keys = [];
  const source = pattern
    .split('/')
    .map((part) => {
      if (!part.startsWith(':')) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keys.push(part.slice(1));
      return '([^/]+)';
    })
    .join('/');
  routes.push({ regex: new RegExp(`^${source}$`), keys, handler });
}

export function currentPath() {
  let path = decodeURI(location.pathname);
  if (path.startsWith(BASE)) path = path.slice(BASE.length);
  return path.replace(/^\/+|\/+$/g, '');
}

/** Builds an in-app URL: `to('explore', {q: 'lab'})` */
export function to(path = '', params = null) {
  const url = `${BASE}${String(path).replace(/^\/+/, '')}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) continue;
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

export function navigate(href, { replace = false, keepScroll = false } = {}) {
  const url = new URL(href, location.origin);
  if (url.pathname === location.pathname && url.search === location.search) return;
  history[replace ? 'replaceState' : 'pushState']({ keepScroll }, '', url);
  resolve({ keepScroll });
}

/** Rewrites the query string without re-rendering the page. */
export function setQuery(params, { replace = true } = {}) {
  const url = to(currentPath(), params);
  history[replace ? 'replaceState' : 'pushState']({ keepScroll: true }, '', url);
}

export function query() {
  return new URLSearchParams(location.search);
}

function resolve(options = {}) {
  const path = currentPath();
  for (const { regex, keys, handler } of routes) {
    const match = regex.exec(path);
    if (!match) continue;
    const params = Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
    onNavigate?.({ path, params, handler, ...options });
    return;
  }
  onNavigate?.({ path, params: {}, handler: null, ...options });
}

export function start(callback) {
  onNavigate = callback;

  // Intercept same-origin links marked with `data-link`, plus any anchor whose
  // href resolves inside BASE, so content links need no extra wiring.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    // Match the browser's <base> resolution, including on nested detail pages.
    const url = new URL(anchor.href);
    if (url.origin !== location.origin) return;
    if (!url.pathname.startsWith(BASE)) return;
    if (/\.(json|md|png|svg|txt|xml|zip|pdf)$/i.test(url.pathname)) return;

    event.preventDefault();
    navigate(url.href);
  });

  window.addEventListener('popstate', () => resolve({ restore: true }));
  resolve();
}
