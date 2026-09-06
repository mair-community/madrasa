/**
 * Bridge between the framework-free site and the motion bundle.
 *
 * The bundle (GSAP + Lenis) is an enhancement, never a dependency: without it
 * the site keeps its IntersectionObserver reveals and native scrolling. It is
 * skipped entirely when the visitor asks for reduced motion, and when
 * `web/dist/motion.js` has not been built.
 */
import { setRevealDriver } from './dom.js';

/** A bundle that never resolves must not hold the first render hostage. */
const LOAD_TIMEOUT = 3000;

let api = null;
let ready = null;

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The bundle URL comes from a meta tag written at serve/build time, so a tree
 * without `npm run build` never issues a request that would 404.
 * Resolved against `<base>`, which keeps subpath deploys working.
 */
function bundleUrl() {
  const source = document.querySelector('meta[name="madrasa-motion"]')?.content?.trim();
  return source ? new URL(source, document.baseURI).href : null;
}

/** Scrolling without the bundle: honest, native, and reduced-motion aware. */
function nativeScrollTo(target, { immediate = false, offset = 0 } = {}) {
  const top = typeof target === 'number'
    ? target
    : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: top + offset,
    behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/**
 * Loads and starts the motion layer. Resolves to whether it is live; never
 * rejects, so callers can await it unconditionally.
 *
 * @param {{onNestedScroll?: (node: Element) => boolean}} [options]
 * @returns {Promise<boolean>}
 */
export function initMotion(options = {}) {
  if (ready) return ready;

  const url = prefersReducedMotion() ? null : bundleUrl();
  if (!url) {
    ready = Promise.resolve(false);
    return ready;
  }

  const load = import(url).then((mod) => {
    api = mod.createMotion(options);
    setRevealDriver(api.reveal);
    document.documentElement.classList.add('has-motion');
    return true;
  });

  // The import keeps running past the timeout; a late arrival simply enhances
  // the pages that come after it.
  ready = Promise.race([
    load.catch(() => false),
    new Promise((resolve) => { setTimeout(() => resolve(false), LOAD_TIMEOUT); }),
  ]);
  return ready;
}

export const motion = {
  get live() { return api !== null; },
  /** @param {HTMLElement} root the page that has just been mounted */
  enter(root) { api?.enter(root); },
  leave() { api?.leave(); },
  refresh() { api?.refresh(); },
  /** @param {number|HTMLElement} target */
  scrollTo(target, options) { (api ? api.scrollTo : nativeScrollTo)(target, options); },
};
