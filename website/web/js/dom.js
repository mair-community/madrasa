/**
 * Minimal DOM builder.
 *
 * Everything is created as real nodes rather than HTML strings, so catalog text
 * can never be interpreted as markup.
 */

/**
 * @param {string} tag  e.g. `div`, `a.card__title`, `span.tag.tag--brand`
 * @param {object} [props]  attributes; `class`, `text`, `html`, `dataset`, `on`
 *                          and `style` get special handling
 * @param {...(Node|string|null|undefined|Array)} children
 */
export function el(tag, props = null, ...children) {
  const [name, ...classes] = String(tag).split('.');
  const node = document.createElement(name || 'div');
  if (classes.length) node.classList.add(...classes);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.classList.add(...String(value).split(/\s+/).filter(Boolean));
      else if (key === 'text') node.textContent = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key === 'style') Object.assign(node.style, value);
      else if (key === 'on') for (const [ev, fn] of Object.entries(value)) node.addEventListener(ev, fn);
      else if (key in node && typeof node[key] === 'boolean') node[key] = Boolean(value);
      else node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  append(node, children);
  return node;
}

function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/** Inline SVG from a path spec, which keeps the bundle free of an icon dependency. */
export function svg(paths, { size = 16, fill = 'none', stroke = 'currentColor', width = 1.7, viewBox = '0 0 24 24' } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const root = document.createElementNS(NS, 'svg');
  root.setAttribute('viewBox', viewBox);
  root.setAttribute('width', size);
  root.setAttribute('height', size);
  root.setAttribute('aria-hidden', 'true');
  root.setAttribute('focusable', 'false');
  for (const d of [].concat(paths)) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', fill);
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', width);
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    root.appendChild(p);
  }
  return root;
}

const ICONS = {
  pin: 'M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  building: 'M4 21V6.5A1.5 1.5 0 0 1 5.5 5H12v16 M12 21V9.5A1.5 1.5 0 0 1 13.5 8H19a1 1 0 0 1 1 1v12 M3 21h18 M7.5 9h1.5 M7.5 13h1.5 M7.5 17h1.5 M15.5 12H17 M15.5 16H17',
  external: 'M13.5 5.5H18.5V10.5 M18.5 5.5L11 13 M17 14.5V18a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V9a1.5 1.5 0 0 1 1.5-1.5H10',
  check: 'M4.5 12.5l4.5 4.5 10.5-11',
  clock: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z M12 7.5V12l3 2',
  search: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M16 16l4.5 4.5',
  arrow: 'M5 12h13 M13 6.5l6 5.5-6 5.5',
  back: 'M19 12H6 M11 17.5L5 12l6-5.5',
  cap: 'M3 9l9-4.2L21 9l-9 4.2L3 9z M7 11v4.6c0 1 2.2 2.4 5 2.4s5-1.4 5-2.4V11 M20.5 9.5v5',
  flask: 'M10 3.5v6L4.7 18.2A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.7-2.8L14 9.5v-6 M8.5 3.5h7 M7.5 15h9',
  globe: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z M3.5 12h17 M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17z',
  layers: 'M12 3.5l8.5 4.5-8.5 4.5L3.5 8 12 3.5z M3.5 12.5L12 17l8.5-4.5 M3.5 16.5L12 21l8.5-4.5',
  spark: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z',
};

export function icon(name, size = 16) {
  return svg(ICONS[name].split(' M').map((d, i) => (i ? `M${d}` : d)), { size });
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Renders the shared zellij lattice as a tiled rect referencing the page defs. */
export function pattern(className) {
  const NS = 'http://www.w3.org/2000/svg';
  const root = document.createElementNS(NS, 'svg');
  root.setAttribute('aria-hidden', 'true');
  root.setAttribute('focusable', 'false');
  root.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  if (className) root.setAttribute('class', className);
  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'url(#zellij)');
  root.appendChild(rect);
  return root;
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** `2026-08-01` → `1 August 2026` (schema guarantees ISO dates). */
export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** One debounce for every search box on the site, so they all feel identical. */
export const SEARCH_DEBOUNCE = 120;

export function debounce(fn, wait = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Reveal-on-scroll. Falls back to "always visible" without IntersectionObserver. */
const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.reveal = 'in';
        obs.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
  : null;

/**
 * Installed by web/js/motion.js when the GSAP layer is live, so scroll reveals
 * are driven by ScrollTrigger instead of the observer below. Without it (no
 * bundle, or reduced motion) the observer stays in charge.
 */
let revealDriver = null;

export function setRevealDriver(driver) {
  revealDriver = driver;
}

export function reveal(node, delay = 0) {
  if (revealDriver) {
    revealDriver(node, delay);
    return node;
  }
  if (!revealObserver) return node;
  node.dataset.reveal = '';
  if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);
  revealObserver.observe(node);
  return node;
}

export function revealAll(nodes, step = 60, max = 6) {
  [...nodes].forEach((node, i) => reveal(node, Math.min(i, max) * step));
}
