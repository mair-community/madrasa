import { institutionRecords } from '../institution-records.js';
import { el, icon, debounce, reveal, plural, SEARCH_DEBOUNCE } from '../dom.js';
import { to } from '../router.js';
import {
  sectionHead, institutionTile, brandMark, emptyState, breadcrumbs, notFoundState, barList, dl,
} from '../components.js';

export function institutionsIndex(catalog) {
  const list = el('ul.institutions-list');
  const countLine = el('p.results__count', { role: 'status', 'aria-live': 'polite' });

  const search = el('input.search-input', {
    type: 'search',
    size: '1',
    placeholder: 'Find an institution: a name, a city, or an acronym like UM6P…',
    'aria-label': 'Find an institution',
    autocomplete: 'off',
  });

  function render(term = '') {
    const needle = term.trim().toLowerCase();
    const rows = catalog.institutions.filter((institution) =>
      !needle || institution.name.toLowerCase().includes(needle) || institution.short.toLowerCase().includes(needle)
      || institution.cities.some((city) => city.toLowerCase().includes(needle)));

    list.replaceChildren();
    countLine.replaceChildren(
      el('strong', { text: String(rows.length) }),
      document.createTextNode(` of ${catalog.stats.institutions} institutions`),
    );

    if (!rows.length) {
      list.appendChild(el('li', null, emptyState({ title: 'No institution matches that', text: 'Try a city name, an acronym such as UM6P, or clear the search.' })));
      return;
    }
    rows.forEach((institution, i) => {
      const tile = institutionTile(institution);
      tile.removeAttribute('role');
      list.appendChild(el('li', null, reveal(tile, Math.min(i, 8) * 22)));
    });
  }

  search.addEventListener('input', debounce(() => render(search.value), SEARCH_DEBOUNCE));
  render();

  const withPrograms = catalog.institutions.filter((i) => i.programs > 0).length;

  return {
    node: el('div.section--tight', null,
      el('div.shell', null,
        el('header.page-head', { style: { paddingBlock: 'var(--s-6) var(--s-5)' } },
          el('p.eyebrow', { text: 'Cross-section' }),
          el('h1.h1.balance', { text: 'Institutions' }),
          el('p.lede', { text: `Every university, school and institute hosting at least one record: ${plural(catalog.stats.institutions, 'institution')} in all, ${withPrograms} of which also list a degree programme.` }),
        ),
        el('div', null, search),
        el('div.results__bar', { style: { marginTop: 'var(--s-4)' } }, countLine),
        el('section', { 'aria-labelledby': 'institutions-heading', style: { marginTop: 'var(--s-3)' } },
          el('h2.sr-only', { id: 'institutions-heading', text: 'All institutions' }),
          list,
        ),
      ),
    ),
    title: 'Institutions · MADRASA',
    description: 'Moroccan universities, schools and institutes hosting AI research structures and education programs.',
  };
}

export function institutionPage(catalog, { slug }) {
  const institution = catalog.institutionBySlug.get(slug);

  if (!institution) {
    return {
      node: el('div.shell', null, notFoundState(`No institution with the id “${slug}” appears in the register.`)),
      title: 'Not found · MADRASA',
      status: 404,
    };
  }

  const programs = institution.entries.filter((entry) => entry.kind === 'program');
  const structures = institution.entries.filter((entry) => entry.kind === 'structure');
  const domainRows = [...institution.domains]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, 8);

  const page = el('div.section--tight', null,
    el('div.shell', null,
      breadcrumbs([
        { label: 'Home', href: to('') },
        { label: 'Institutions', href: to('institutions') },
        { label: institution.name },
      ]),

      el('div.rec-page', null,
        el('header.rec-head', null,
          el('div.rec-head__top', null,
            brandMark(institution.name, { size: 'lg' }),
            el('div.stack.stack--sm', null,
              el('p.eyebrow', { text: 'Institution' }),
              el('h1.display.rec-head__title.balance', { text: institution.name }),
            ),
          ),
          el('p.lede', {
            text: `${plural(institution.total, 'record')} in the register${institution.cities.length ? ` across ${institution.cities.join(', ')}` : ''}.`,
          }),
          el('div.wrap-gap', null,
            el('a.btn.btn--primary.btn--wrap', { href: to('explore', { institution: institution.name }) }, 'Explore this institution', icon('arrow', 14)),
          ),
        ),

        el('div.rec-body', null,
          el('div.stack.stack--lg', null,
            dl([
              ['Records', String(institution.total)],
              ['Labs & centres', String(institution.structures)],
              ['Programs', String(institution.programs)],
              ['Cities', institution.cities.join(', ') || 'Not recorded'],
            ]),

            structures.length ? el('section', null,
              sectionHead(`Labs, centres & teams (${structures.length})`),
              institutionRecords(structures),
            ) : null,

            programs.length ? el('section', null,
              sectionHead(`Education programs (${programs.length})`),
              institutionRecords(programs),
            ) : el('section', null,
              emptyState({
                mark: 'cap',
                title: 'No education program listed yet',
                text: `The register records research structures at ${institution.name} but no AI degree programme so far. If one exists, it belongs here.`,
                action: el('a.btn.btn--primary', { href: to('contribute') }, 'Add a program'),
              }),
            ),
          ),

          domainRows.length > 1 ? el('aside.stack', null,
            el('h2.h3', { text: 'Strongest domains here' }),
            barList(domainRows, { total: institution.total, hrefFor: (row) => to('explore', { domain: row.value, institution: institution.name }) }),
          ) : null,
        ),
      ),
    ),
  );

  page.querySelectorAll('.dl, .section-head, .bar-list').forEach((node) => reveal(node));

  return {
    node: page,
    title: `${institution.name} · MADRASA`,
    description: `AI research structures and education programs at ${institution.name}, Morocco.`,
  };
}
