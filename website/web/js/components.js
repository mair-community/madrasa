/**
 * Shared UI pieces: entry cards, monograms, states, section headings.
 */
import { el, icon, formatDate, hostOf, plural, reveal } from './dom.js';
import { to } from './router.js';
import { institutionShort } from './data.js';
import { BASE, LABELS, LINKS, INSTITUTION_LOGO } from './config.js';

export function monogram(name, { large = false } = {}) {
  const short = institutionShort(name);
  return el('span', {
    class: large ? 'monogram monogram--lg' : 'monogram',
    title: name,
    'aria-hidden': 'true',
    text: short,
  });
}

/**
 * The institution's official logo where we hold one, otherwise the lettermark.
 * A logo that fails to load swaps itself back to the lettermark, so a deleted
 * or blocked file degrades instead of leaving a hole.
 *
 * @param {string} name canonical institution name
 * @param {{size?: 'sm'|'lg'}} [options]
 */
export function brandMark(name, { size = 'sm' } = {}) {
  const logo = INSTITUTION_LOGO[name];
  if (!logo) return monogram(name, { large: size === 'lg' });

  const plaque = el('span', { class: `brand-logo brand-logo--${size}`, title: name });
  const img = el('img', {
    src: `${BASE}assets/logos/${logo.file}`,
    alt: '',
    width: logo.w,
    height: logo.h,
    loading: 'lazy',
    decoding: 'async',
  });
  img.addEventListener('error', () => plaque.replaceWith(monogram(name, { large: size === 'lg' })), { once: true });
  plaque.appendChild(img);
  return plaque;
}

export function statusDot(status) {
  return el('span', { class: 'status-dot', dataset: { status }, text: LABELS.status[status] || status });
}

export function metaItem(iconName, label) {
  return el('span.card__meta-item', null, icon(iconName, 14), el('span', { text: label }));
}

export function sectionHead(title, { eyebrow = null, lede = null, action = null } = {}) {
  return el('div.section-head', null,
    el('div.section-head__text', null,
      eyebrow && el('p.eyebrow', { text: eyebrow }),
      el('h2.h2.balance', { text: title }),
      lede && el('p.lede', { text: lede }),
    ),
    action,
  );
}

export function linkArrow(label, href) {
  return el('a.btn.btn--ghost.btn--sm', { href }, label, icon('arrow', 15));
}

/**
 * The catalog's primary unit of content.
 * One real anchor per card; the stretched pseudo-element makes the whole
 * surface clickable without nesting interactive elements.
 */
export function entryCard(entry) {
  const isProgram = entry.kind === 'program';
  const institution = entry.institutions[0] || '';

  const meta = [];
  if (entry.city) meta.push(metaItem('pin', entry.region && entry.region !== entry.city ? `${entry.city} · ${entry.region}` : entry.city));
  if (isProgram) {
    if (entry.durationYears) meta.push(metaItem('clock', `${entry.durationYears} ${entry.durationYears === 1 ? 'year' : 'years'}`));
    if (entry.languages?.length) meta.push(metaItem('globe', entry.languages.join(' · ')));
  } else if (entry.units.length && entry.units[0] !== institution) {
    meta.push(metaItem('building', entry.units[0]));
  }

  const tags = entry.domains.slice(0, 3).map((domain) => el('span.tag', { text: domain }));
  if (entry.domains.length > 3) tags.push(el('span.tag.muted', { text: `+${entry.domains.length - 3} more`, title: entry.domains.slice(3).join(', ') }));

  return el('article.card.card--directory', null,
    el('div.card__logo-row', null, brandMark(institution, { size: 'lg' })),
    el('div.card__head', null,
      el('div.card__head-text', null,
        el('p', { class: `pill-kind ${isProgram ? 'pill-kind--program' : ''}`, text: isProgram ? (entry.level || 'Program') : (entry.structureType || 'Structure') }),
        el('h3.card__title', null, el('a', { href: to(entry.href), text: entry.name })),
        institution && el('p.card__inst', { text: institution }),
      ),
    ),
    el('div.card__meta', null, meta),
    el('div.card__tags', null, tags),
    el('div.card__foot', null,
      statusDot(entry.status),
      entry.lastChecked && el('time', { datetime: entry.lastChecked, text: `Verified ${formatDate(entry.lastChecked)}` }),
    ),
  );
}

export function entryGrid(entries) {
  const grid = el('div.grid.grid--cards');
  entries.forEach((entry, i) => grid.appendChild(reveal(entryCard(entry), Math.min(i, 5) * 50)));
  return grid;
}

export function institutionTile(institution) {
  const parts = [];
  if (institution.programs) parts.push(plural(institution.programs, 'program'));
  if (institution.structures) parts.push(plural(institution.structures, 'lab or center', 'labs & centers'));

  return el('article.tile', { role: 'listitem' },
    brandMark(institution.name),
    el('div.tile__text', null,
      el('h3.tile__name', null, el('a', { href: to(`institutions/${institution.slug}`), text: institution.name })),
      el('p.tile__meta', { text: [parts.join(' · '), institution.cities.join(', ')].filter(Boolean).join(' · ') }),
    ),
  );
}

export function externalLinks(urls) {
  return el('ul.link-list', null, urls.map((url) => el('li', null,
    el('a', { href: url, rel: 'noopener nofollow', target: '_blank' },
      icon('globe', 16),
      el('span.host', { text: hostOf(url) }),
      icon('external', 14),
    ),
  )));
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

export function loadingState(count = 6) {
  const grid = el('div.grid.grid--cards', { 'aria-busy': 'true', 'aria-label': 'Loading catalog' });
  for (let i = 0; i < count; i += 1) {
    grid.appendChild(el('div.skeleton-card', null,
      el('div.skeleton'), el('div.skeleton'), el('div.skeleton'), el('div.skeleton'),
    ));
  }
  return grid;
}

export function emptyState({ title, text, action = null, mark = 'search' }) {
  return el('div.state', { role: 'status' },
    el('span.state__mark', null, icon(mark, 40)),
    el('p.state__title', { text: title }),
    text && el('p.state__text', { text }),
    action,
  );
}

export function errorState(error, retry) {
  return el('div.state', { role: 'alert' },
    el('span.state__mark', null, icon('flask', 40)),
    el('p.state__title', { text: 'The catalog could not be loaded' }),
    el('p.state__text', { text: error?.message || 'Something went wrong while reading the catalog files.' }),
    el('div.row', { style: { justifyContent: 'center' } },
      retry && el('button.btn.btn--primary', { type: 'button', on: { click: retry } }, 'Try again'),
      el('a.btn', { href: LINKS.repo, rel: 'noopener' }, 'Open the data on GitHub'),
    ),
  );
}

export function notFoundState(message = 'We could not find that page.') {
  return el('div.state',
    null,
    el('span.state__mark', null, icon('spark', 40)),
    el('p.state__title', { text: 'Nothing here' }),
    el('p.state__text', { text: message }),
    el('div.row', { style: { justifyContent: 'center' } },
      el('a.btn.btn--primary', { href: to('explore') }, 'Explore the catalog'),
      el('a.btn', { href: to('') }, 'Back home'),
    ),
  );
}

export function breadcrumbs(trail) {
  return el('nav.breadcrumbs', { 'aria-label': 'Breadcrumb' },
    trail.flatMap((crumb, i) => [
      i ? el('span', { 'aria-hidden': 'true', text: '/' }) : null,
      crumb.href
        ? el('a', { href: crumb.href, text: crumb.label })
        : el('span', { 'aria-current': 'page', text: crumb.label }),
    ]),
  );
}

/** A labelled figure used in stat strips. */
export function stat(value, label) {
  return el('div.stat', null,
    el('span.stat__n', { text: String(value) }),
    el('span.stat__label', { text: label }),
  );
}

export function barList(rows, { total, hrefFor }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return el('ul.bar-list', null, rows.map((row, i) => el('li.bar-row', null,
    el('div.bar-row__top', null,
      el('span.bar-row__name', null, el('a', { href: hrefFor(row), text: row.value })),
      el('span.bar-row__n', { text: total ? `${row.count} · ${Math.round((row.count / total) * 100)}%` : String(row.count) }),
    ),
    el('div.bar-row__track', null,
      el('div.bar-row__fill', {
        style: { width: `${Math.max(4, (row.count / max) * 100)}%`, animationDelay: `${Math.min(i, 8) * 45}ms` },
      }),
    ),
  )));
}

function ctaPanel({ title, text, actions }) {
  const panel = el('section.cta-panel', null,
    el('div', null,
      el('h2.h2.balance', { text: title }),
      el('p.mt-4', { text }),
    ),
    el('div.wrap-gap', null, actions),
  );
  panel.prepend(patternLayer());
  return panel;
}

function patternLayer() {
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(NS, 'svg');
  svgEl.setAttribute('class', 'cta-panel__pattern');
  svgEl.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'url(#zellij)');
  svgEl.appendChild(rect);
  return svgEl;
}

export function contributeCta() {
  return ctaPanel({
    title: 'Something missing? The catalog is edited by the community.',
    text: 'MADRASA is maintained in the open. Adding a program or a lab means opening one issue · or one small pull request against a JSON file. Every entry needs an official source and a verification date.',
    actions: [
      el('a.btn.btn--solid', { href: to('contribute') }, 'How to contribute', icon('arrow', 15)),
      el('a.btn.btn--ghost', { href: LINKS.repo, rel: 'noopener' }, 'View on GitHub'),
    ],
  });
}

export function dl(rows) {
  return el('div.dl', null, rows.filter(Boolean).map(([key, value]) => {
    let body;
    if (value instanceof Node) body = value;
    else if (Array.isArray(value)) body = el('ul', null, value.map((item) => el('li', { text: item })));
    else body = el('span', { text: String(value) });
    return el('div.dl__row', null,
      el('span.dl__k', { text: key }),
      el('div.dl__v', null, body),
    );
  }));
}
