/**
 * Application bootstrap: chrome behaviour, routing and page rendering.
 */
import { el, clear, formatDate } from './dom.js';
import { BASE } from './config.js';
import { loadCatalog } from './data.js';
import { route, start, currentPath, to, navigate } from './router.js';
import { loadingState, errorState, notFoundState } from './components.js';
import { initMotion, motion } from './motion.js';

import home from './pages/home.js';
import explore from './pages/explore.js';
import entryPage from './pages/entry.js';
import { institutionsIndex, institutionPage } from './pages/institutions.js';
import contribute from './pages/contribute.js';
import submitPage from './pages/submit.js';
import about from './pages/about.js';

const main = document.getElementById('main');
const header = document.getElementById('site-header');
const nav = document.getElementById('site-nav');
const navToggle = document.getElementById('nav-toggle');
const footerMeta = document.getElementById('footer-meta');

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */
// Kicked off before anything is rendered so the bundle downloads alongside the
// catalog rather than after it. Resolves to false when motion is unavailable or
// unwanted, in which case every call below is a no-op.
const motionReady = initMotion();
const headerHeight = () => header?.offsetHeight || 0;

/* -------------------------------------------------------------------------- */
/* Chrome                                                                      */
/* -------------------------------------------------------------------------- */
const setStuck = () => header.setAttribute('data-stuck', String(window.scrollY > 8));
setStuck();
addEventListener('scroll', setStuck, { passive: true });

function closeNav() {
  nav.dataset.open = 'false';
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle?.addEventListener('click', () => {
  const open = nav.dataset.open !== 'true';
  nav.dataset.open = String(open);
  navToggle.setAttribute('aria-expanded', String(open));
});

addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNav();
  // "/" focuses search, the way a catalog should behave.
  if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) {
    const search = document.querySelector('input[type="search"]');
    if (search) { event.preventDefault(); search.focus(); }
  }
});

function markActiveNav(path) {
  const section = path.split('/')[0] || '';
  for (const link of nav.querySelectorAll('a[data-nav]')) {
    const match = link.dataset.nav === section
      || (link.dataset.nav === 'contribute' && section === 'submit')
      || (link.dataset.nav === 'explore' && ['program', 'structure'].includes(section));
    if (match) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

/* -------------------------------------------------------------------------- */
/* Document metadata                                                           */
/* -------------------------------------------------------------------------- */
function setMeta({ title, description }) {
  const path = currentPath();
  const url = `https://madrasa.mair.ma/${path}`;
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.content = path === 'submit' || /not found/i.test(title || '') ? 'noindex,follow' : 'index,follow';
  for (const [selector, value] of [
    ['meta[property="og:url"]', url],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
  ]) if (value) document.querySelector(selector)?.setAttribute('content', value);
  if (title) document.title = title;
  if (description) {
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
      document.head.querySelector(selector)?.setAttribute('content', description);
    }
  }
  document.head.querySelector('meta[property="og:title"]')?.setAttribute('content', title || document.title);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = el('link', { rel: 'canonical' });
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                   */
/* -------------------------------------------------------------------------- */
let catalogPromise = null;
let leaveCurrent = null;

function render(node) {
  leaveCurrent?.();
  leaveCurrent = null;
  motion.leave();
  clear(main);
  main.appendChild(node);
  motion.enter(main);
}

/** Every route resolves the catalog first; pages receive fully-built data. */
async function renderPage(builder, params, { keepScroll = false, restore = false } = {}) {
  // Keep the prerendered content visible on the initial load.
  if (!main.children.length || leaveCurrent) render(el('div.shell.section', null, loadingState()));

  let catalog;
  try {
    catalogPromise = catalogPromise || loadCatalog();
    // Both are awaited together so the motion bundle is in place before the
    // page is built · pages call reveal() while their nodes are still detached.
    [catalog] = await Promise.all([catalogPromise, motionReady]);
  } catch (error) {
    catalogPromise = null;
    render(el('div.shell', null, errorState(error, () => renderPage(builder, params))));
    setMeta({ title: 'Catalog unavailable · MADRASA' });
    return;
  }

  const page = builder(catalog, params);
  render(page.node);
  leaveCurrent = page.onLeave || null;

  setMeta({ title: page.title, description: page.description });
  markActiveNav(currentPath());
  updateFooterMeta(catalog);

  if (!keepScroll && !restore) motion.scrollTo(0, { immediate: true });
  if (!restore) main.focus({ preventScroll: true });
}

function updateFooterMeta(catalog) {
  if (!footerMeta || footerMeta.dataset.filled) return;
  footerMeta.dataset.filled = 'true';
  footerMeta.replaceChildren(
    document.createTextNode(`${catalog.stats.entries} entries · last verified ${formatDate(catalog.stats.lastChecked)} · `),
    el('a', { href: `${BASE}catalog/education_programs.json`, text: 'raw data' }),
  );
}

/* -------------------------------------------------------------------------- */
/* In-page anchors                                                             */
/* -------------------------------------------------------------------------- */
// Registered before the router so it sees these clicks first: the router treats
// `#main` as a same-page navigation and would swallow it, leaving the skip link
// with nothing to do. Here the scroll runs through the motion layer and focus
// actually moves, which is the point of the link.
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = event.target.closest('a[href^="#"]');
  const id = anchor?.getAttribute('href').slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;

  event.preventDefault();
  history.replaceState(history.state, '', `#${id}`);
  motion.scrollTo(target, { offset: -headerHeight() });
  target.focus({ preventScroll: true });
});

/* -------------------------------------------------------------------------- */
/* Routes                                                                      */
/* -------------------------------------------------------------------------- */
route('', home);
route('explore', explore);
route('institutions', institutionsIndex);
route('institutions/:slug', institutionPage);
route('contribute', contribute);
route('submit', submitPage);
route('about', about);
route('program/:id', (catalog, params) => entryPage(catalog, { kind: 'program', id: params.id }));
route('structure/:id', (catalog, params) => entryPage(catalog, { kind: 'structure', id: params.id }));

// Plural conveniences so hand-typed URLs still land somewhere sensible.
const REDIRECTS = {
  domains: () => to('explore'),
  programs: () => to('explore', { kind: 'program' }),
  structures: () => to('explore', { kind: 'structure' }),
  labs: () => to('explore', { kind: 'structure' }),
};
for (const [path, target] of Object.entries(REDIRECTS)) route(path, target);

start(({ handler, params, ...options }) => {
  closeNav();

  if (!handler) {
    render(el('div.shell', null, notFoundState(`There is no page at “${currentPath() || '/'}”.`)));
    setMeta({ title: 'Page not found · MADRASA' });
    markActiveNav('');
    motion.scrollTo(0, { immediate: true });
    return;
  }

  // Redirect routes resolve without touching the catalog.
  if (Object.values(REDIRECTS).includes(handler)) {
    navigate(handler(), { replace: true });
    return;
  }

  renderPage(handler, params, options);
});
