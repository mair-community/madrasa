import { el, icon, reveal, revealAll, formatDate, plural } from '../dom.js';
import { to, navigate } from '../router.js';
import { queryEntries, institutionShort } from '../data.js';
import {
  sectionHead, entryGrid, institutionTile, barList, contributeCta, linkArrow,
} from '../components.js';
import { liveSearch } from '../livesearch.js';

const SUGGESTIONS = ['Machine Learning', 'Cybersecurity', 'Bioinformatics', 'Natural Language Processing', 'Robotics'];

/**
 * Suggestions for the hero typeahead: matching entries first, then the
 * institutions and domains the query touches, as one-click filters.
 */
function heroSuggestions(catalog, query) {
  const needle = query.toLowerCase();
  const matches = queryEntries(catalog, { q: query });

  const entries = matches.slice(0, 6).map((entry) => ({
    group: 'Entries',
    institution: entry.institutions[0],
    mono: institutionShort(entry.institutions[0] || entry.name),
    label: entry.name,
    meta: [
      entry.kind === 'program' ? entry.level || 'Program' : entry.structureType,
      entry.institutions[0],
      entry.city,
    ].filter(Boolean).join(' · '),
    href: to(entry.href),
  }));

  const institutions = catalog.institutions
    .filter((i) => i.name.toLowerCase().includes(needle) || i.short.toLowerCase().includes(needle))
    .slice(0, 2)
    .map((i) => ({
      group: 'Institutions',
      institution: i.name,
      mono: i.short,
      label: i.name,
      meta: `${plural(i.total, 'entry', 'entries')} in the catalog`,
      href: to(`institutions/${i.slug}`),
    }));

  const domains = catalog.facets.domain
    .filter((d) => d.value.toLowerCase().includes(needle))
    .slice(0, 3)
    .map((d) => ({
      group: 'Domains',
      mono: '#',
      label: d.value,
      meta: `Filter the catalog · ${plural(d.count, 'entry', 'entries')}`,
      href: to('explore', { domain: d.value }),
    }));

  return { items: [...entries, ...institutions, ...domains], total: matches.length };
}

function hero(catalog) {
  const { stats } = catalog;

  const input = el('input', {
    type: 'search',
    name: 'q',
    // Without this the input carries a 20-character intrinsic width that pushes
    // the hero grid wider than the viewport on small screens.
    size: 1,
    autocomplete: 'off',
    placeholder: 'Search labs, centers, masters, PhD programs…',
    'aria-label': 'Search the catalog',
  });

  const form = el('form.searchbar', {
    role: 'search',
    on: {
      submit: (event) => {
        event.preventDefault();
        navigate(to('explore', { q: input.value.trim() }));
      },
    },
  }, el('span.searchbar__icon', null, icon('search', 19)), input,
    el('button.btn.btn--primary.btn--sm', { type: 'submit' }, 'Search'));

  // Results appear as you type; Enter without a highlighted row still submits.
  const field = el('div.searchfield', null, form);
  const search = liveSearch(input, {
    host: field,
    suggest: (query) => heroSuggestions(catalog, query),
    onSubmit: (query) => navigate(to('explore', { q: query })),
    footer: (query, total) => (total > 0
      ? { label: `See all ${plural(total, 'result')} for “${query}”`, href: to('explore', { q: query }) }
      : { label: `Search the full catalog for “${query}”`, href: to('explore', { q: query }) }),
  });

  const node = el('section.hero', null,
    el('div.shell.hero__inner', null,
      el('div.hero__topline', null,
        el('p.hero__eyebrow', { text: 'The Moroccan AI catalog' }),
        el('span.hero__edition', { text: 'Open data. Shared knowledge.' }),
      ),
      el('div.hero__composition', null,
        el('div.hero__intro', null,
          el('h1.display.hero__title', null,
            'Find your place ', el('br'), 'in ', el('em', { text: 'Moroccan AI.' }),
          ),
          el('p.lede.hero__lede', {
            text: 'Discover where AI is taught and researched. Explore programs, laboratories, and the institutions behind them, with sources checked.',
          }),
          el('p.hero__source-note', null, icon('check', 14), 'Every entry includes an official source and a source check date.'),
        ),
        el('nav.hero__directory', { 'aria-label': 'Browse the catalog' },
          el('p.hero__directory-label', { text: 'Start exploring' }),
          ...[
            [stats.structures, 'Labs & research centers', to('explore', { kind: 'structure' })],
            [stats.programs, 'Education programs', to('explore', { kind: 'program' })],
            [stats.institutions, 'Universities & institutions', to('institutions')],
          ].map(([count, label, href]) => el('a.hero__directory-link', { href },
            el('span.hero__count', { text: String(count) }),
            el('span', { text: label }), icon('arrow', 18),
          )),
          el('p.hero__coverage', { text: `Across ${stats.cities} cities · ${stats.domains} research domains` }),
        ),
      ),
      el('div.hero__discovery', null,
        el('label.hero__search-label', { for: 'hero-search', text: 'What would you like to explore?' }),
        field,
        el('div.hero__suggest', null,
          el('span.tiny', { text: 'Explore a subject' }),
          ...SUGGESTIONS.slice(0, 4).map((term) => el('a', { href: to('explore', { domain: term }), text: term })),
        ),
      ),
    ),
  );

  input.id = 'hero-search';
  return { node, search };
}

function collectionsSection(catalog) {
  const cards = [
    {
      kind: 'structure',
      icon: 'flask',
      title: 'Labs, centers & research teams',
      count: catalog.stats.structures,
      text: 'Laboratories, research centers, units and teams doing AI-related work inside Moroccan universities and schools.',
      breakdown: catalog.facets.structureType,
    },
    {
      kind: 'program',
      icon: 'cap',
      title: 'Education programs',
      count: catalog.stats.programs,
      text: 'Engineering degrees, masters and doctoral programs with a clear AI, data or machine-learning component.',
      breakdown: catalog.facets.level,
    },
  ].map((item) => el('article.card', null,
    el('div.card__head', null,
      el('span.monogram', { 'aria-hidden': 'true' }, icon(item.icon, 20)),
      el('div.card__head-text', null,
        el('h3.h3', null, el('a', { href: to('explore', { kind: item.kind }), text: item.title })),
        el('p.card__inst', { text: `${item.count} entries in the catalog` }),
      ),
    ),
    el('p.small.muted', { text: item.text }),
    el('div.card__tags', null, item.breakdown.map((row) => el('span.tag', { text: `${row.value} · ${row.count}` }))),
  ));

  return el('section.section.section--edge', null,
    el('div.shell', null,
      sectionHead('Two catalogs, one map', {
        eyebrow: 'What’s inside',
        lede: 'Research structures and education programs are curated separately but searched together, because the useful question is usually “who works on this, and where?”',
      }),
      el('div.grid.grid--2', null, cards),
    ),
  );
}

function recentSection(catalog) {
  const recent = queryEntries(catalog, { sort: 'checked' }).slice(0, 6);
  return el('section.section', null,
    el('div.shell', null,
      sectionHead('Recently checked sources', {
        eyebrow: 'Fresh from the catalog',
        lede: 'Every entry carries the date a human last checked its official source. These were checked most recently.',
        action: linkArrow('Explore all entries', to('explore', { sort: 'checked' })),
      }),
      entryGrid(recent),
    ),
  );
}

function institutionsSection(catalog) {
  const top = catalog.institutions.slice(0, 8);
  const grid = el('div.grid.grid--2', null, top.map(institutionTile));
  revealAll(grid.children, 40);

  return el('section.section.section--edge', null,
    el('div.shell', null,
      sectionHead('The institutions behind the work', {
        eyebrow: 'Who hosts it',
        lede: `${catalog.stats.institutions} universities, schools and institutes appear in the catalog. These host the most entries.`,
        action: linkArrow('All institutions', to('institutions')),
      }),
      grid,
    ),
  );
}

function geographySection(catalog) {
  const regions = catalog.facets.region.filter((row) => row.count > 0);
  const cities = catalog.facets.city.slice(0, 10);

  return el('section.section', null,
    el('div.shell', null,
      sectionHead('Concentrated, but not only in the capital', {
        eyebrow: 'Where it happens',
        lede: `AI research in the catalog spans ${plural(catalog.stats.regions, 'region')} and ${plural(catalog.stats.cities, 'city', 'cities')}, from Tangier to Beni Mellal.`,
      }),
      el('div.grid.grid--2', { style: { gap: 'var(--s-7)' } },
        el('div.stack', null,
          el('h3.h3', { text: 'By region' }),
          barList(regions, {
            total: catalog.stats.entries,
            hrefFor: (row) => to('explore', { region: row.value }),
          }),
        ),
        el('div.stack', null,
          el('h3.h3', { text: 'By city' }),
          el('div.cloud', null, cities.map((row) => el('a', {
            href: to('explore', { city: row.value }),
            dataset: { weight: row.count > 7 ? '3' : row.count > 3 ? '2' : '1' },
          }, row.value, el('sup', { text: String(row.count) })))),
          el('p.small.muted', { text: 'Region names follow Morocco’s twelve official administrative regions, as recorded in the catalog schema.' }),
        ),
      ),
    ),
  );
}

function domainsSection(catalog) {
  const top = catalog.facets.domain.slice(0, 26);
  const max = top[0]?.count || 1;
  return el('section.section.section--edge', null,
    el('div.shell', null,
      sectionHead('What people actually work on', {
        eyebrow: 'Research domains',
        lede: `${catalog.stats.domains} distinct domain tags appear across the catalog · from core machine learning to Darija language technology and computational genomics.`,
        action: linkArrow('Explore by domain', to('explore')),
      }),
      el('div.cloud', null, top.map((row) => el('a', {
        href: to('explore', { domain: row.value }),
        dataset: { weight: row.count / max > 0.45 ? '3' : row.count / max > 0.12 ? '2' : '1' },
      }, row.value, el('sup', { text: String(row.count) })))),
    ),
  );
}

function methodSection(catalog) {
  const steps = [
    ['Sourced from the institution itself', 'Entries are built from official university, school, lab or ministry pages · never from rankings or hearsay.'],
    ['Checked, dated and re-checked', `Each record stores a source check date. The most recent sweep was ${formatDate(catalog.stats.lastChecked)}.`],
    ['Reviewed in public', 'Every change is a pull request, validated automatically against a published JSON schema before it can be merged.'],
  ];

  return el('section.section', null,
    el('div.shell', null,
      el('div.grid.grid--2', { style: { gap: 'var(--s-7)', alignItems: 'start' } },
        el('div.stack', null,
          el('p.eyebrow', { text: 'How the catalog is made' }),
          el('h2.h2.balance', { text: 'A catalog you can check, not just read.' }),
          el('p.lede', { text: 'MADRASA is a dataset first and a website second. The JSON files are the source of truth; this interface is one way to read them.' }),
          el('div.wrap-gap', null,
            el('a.btn', { href: to('about') }, 'About the project'),
            el('a.btn.btn--ghost', { href: `${to('')}catalog/research_structures.json`, target: '_blank', rel: 'noopener' }, 'View the raw JSON', icon('external', 14)),
          ),
        ),
        el('ol.steps', null, steps.map(([title, text]) => el('li.step', null,
          el('div.step__body', null,
            el('h3.h3', { text: title }),
            el('p.small.muted', { text }),
          ),
        ))),
      ),
    ),
  );
}

export default function home(catalog) {
  const { node: heroSection, search } = hero(catalog);

  const page = el('div', null,
    heroSection,
    collectionsSection(catalog),
    recentSection(catalog),
    institutionsSection(catalog),
    geographySection(catalog),
    domainsSection(catalog),
    methodSection(catalog),
    el('div.shell.section', null, contributeCta()),
  );

  page.querySelectorAll('.section-head, .steps, .cta-panel, .bar-list, .cloud').forEach((node) => reveal(node));

  return {
    node: page,
    title: 'MADRASA · Moroccan AI education & research, mapped',
    onLeave: () => search?.destroy(),
  };
}
