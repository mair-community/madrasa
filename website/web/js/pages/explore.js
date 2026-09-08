import { el, icon, debounce, reveal, plural } from '../dom.js';
import { to, setQuery, query as urlQuery } from '../router.js';
import { queryEntries, facetCounts, SORTS, institutionShort } from '../data.js';
import { entryCard, emptyState } from '../components.js';
import { SEARCH_DEBOUNCE } from '../livesearch.js';
import { enhanceSelect } from '../islands.js';
import { LABELS } from '../config.js';

/** Facet definitions, in panel order. `when` hides a facet that cannot apply. */
const FACETS = [
  { key: 'level', label: 'Program level', source: 'level', when: (f) => !f.kind?.includes('structure') || f.kind?.includes('program') },
  { key: 'type', label: 'Structure type', source: 'structureType', when: (f) => !f.kind?.includes('program') || f.kind?.includes('structure') },
  { key: 'region', label: 'Region', source: 'region', open: true },
  { key: 'city', label: 'City', source: 'city', limit: 8 },
  { key: 'institution', label: 'Institution', source: 'institution', limit: 8, searchable: true, alias: institutionShort },
  { key: 'domain', label: 'Domain', source: 'domain', limit: 10, searchable: true, open: true },
  { key: 'language', label: 'Language of instruction', source: 'language', when: (f) => !f.kind?.includes('structure') || f.kind?.includes('program') },
  { key: 'mode', label: 'Study mode', source: 'mode', labels: LABELS.mode, when: (f) => !f.kind?.includes('structure') || f.kind?.includes('program') },
  { key: 'tuition', label: 'Tuition', source: 'tuition', labels: LABELS.tuition, when: (f) => !f.kind?.includes('structure') || f.kind?.includes('program') },
];

const FILTER_KEYS = FACETS.map((facet) => facet.key).concat('kind');

function readState() {
  const params = urlQuery();
  const filters = {};
  for (const key of FILTER_KEYS) {
    const raw = params.get(key);
    if (raw) filters[key] = raw.split(',').map((v) => v.trim()).filter(Boolean);
  }
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'relevance';
  return { q: params.get('q') || '', filters, sort };
}

function writeState(state) {
  setQuery({
    q: state.q || null,
    ...Object.fromEntries(FILTER_KEYS.map((key) => [key, state.filters[key]?.length ? state.filters[key] : null])),
    sort: state.sort === 'relevance' ? null : state.sort,
  });
}

export default function explore(catalog) {
  const state = readState();

  /* ---------------------------------------------------------------- header */
  const searchInput = el('input.search-input', {
    type: 'search',
    value: state.q,
    placeholder: 'Search by name, institution, city or domain…',
    'aria-label': 'Search the catalog',
    autocomplete: 'off',
  });
  searchInput.addEventListener('input', debounce(() => {
    state.q = searchInput.value;
    update();
  }, SEARCH_DEBOUNCE));

  const segmented = el('div.kind-options', { role: 'group', 'aria-label': 'Entry types' });
  const segments = [
    { value: 'structure', label: 'Labs & centers', count: catalog.stats.structures },
    { value: 'program', label: 'Programs', count: catalog.stats.programs },
  ].map((segment) => {
    const input = el('input', {
      type: 'checkbox',
      value: segment.value,
      on: {
        change: () => {
          const selected = segments.filter((control) => control.checked).map((control) => control.value);
          if (selected.length === 2) delete state.filters.kind;
          else state.filters.kind = selected.length ? selected : ['none'];
          update();
        },
      },
    });
    segmented.appendChild(el('label.kind-option', null, input,
      el('span', { text: `${segment.label} (${segment.count})` })));
    return input;
  });

  // Rendered as a native <select> and upgraded to react-select once the island
  // bundle loads; the native control keeps working if it never does.
  const sortSelect = el('select.select', { 'aria-label': 'Sort results' },
    ...Object.entries(SORTS).map(([value, { label }]) => el('option', { value, text: label, selected: value === state.sort })));
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; update(); });

  let sortIsland = null;
  enhanceSelect(sortSelect, {
    ariaLabel: 'Sort results',
    onChange: (value) => { state.sort = value; update(); },
  }).then((handle) => { sortIsland = handle; });

  /* ---------------------------------------------------------------- facets */
  const optionNodes = new Map();   // `${key}:${value}` → {row, count, input}
  const facetNodes = new Map();    // key → <details>

  function buildFacet(facet) {
    const rows = catalog.facets[facet.source] || [];
    if (!rows.length) return null;

    const list = el('div.facet__list');
    const details = el('details.facet', { open: facet.open || false },
      el('summary', null, el('span', { text: facet.label })),
      list);

    let expanded = false;
    let term = '';

    const searchBox = facet.searchable
      ? el('input.input', {
          type: 'search',
          placeholder: `Filter ${facet.label.toLowerCase()}…`,
          'aria-label': `Filter the ${facet.label.toLowerCase()} list`,
          style: { marginTop: 'var(--s-3)', fontSize: '.8125rem', padding: '7px 12px' },
        })
      : null;
    if (searchBox) {
      searchBox.addEventListener('input', () => { term = searchBox.value.trim().toLowerCase(); applyVisibility(); });
      details.insertBefore(searchBox, list);
    }

    const more = facet.limit && rows.length > facet.limit
      ? el('button.facet__more', {
          type: 'button',
          text: `Show all ${rows.length}`,
          on: {
            click: () => {
              expanded = !expanded;
              more.textContent = expanded ? 'Show fewer' : `Show all ${rows.length}`;
              applyVisibility();
            },
          },
        })
      : null;
    if (more) details.appendChild(more);

    for (const row of rows) {
      const input = el('input', { type: 'checkbox', value: row.value });
      const count = el('span.check__n', { text: String(row.count) });
      const label = facet.labels?.[row.value] || row.value;
      // Acronyms are how people actually refer to these institutions.
      const searchKey = `${label} ${facet.alias?.(row.value) || ''}`.toLowerCase();
      const node = el('label.check', null,
        input,
        el('span.check__label', { text: label, title: label }),
        count);

      input.addEventListener('change', () => {
        const selected = new Set(state.filters[facet.key] || []);
        if (input.checked) selected.add(row.value); else selected.delete(row.value);
        if (selected.size) state.filters[facet.key] = [...selected];
        else delete state.filters[facet.key];
        update();
      });

      list.appendChild(node);
      optionNodes.set(`${facet.key}:${row.value}`, { node, count, input, label, searchKey, matches: 0 });
    }

    function applyVisibility() {
      let shown = 0;
      for (const row of rows) {
        const option = optionNodes.get(`${facet.key}:${row.value}`);
        const searchable = !term || option.searchKey.includes(term);
        const reachable = option.matches > 0 || option.input.checked;
        const withinLimit = expanded || term || !facet.limit || shown < facet.limit;
        const visible = searchable && reachable && withinLimit;
        option.node.hidden = !visible;
        if (searchable && reachable) shown += 1;
      }
      if (more) more.hidden = Boolean(term) || shown <= facet.limit;
    }

    details._apply = applyVisibility;
    facetNodes.set(facet.key, details);
    return details;
  }

  const clearButton = el('button.facet__more', {
    type: 'button',
    text: 'Clear all',
    on: {
      click: () => {
        state.filters = {};
        state.q = '';
        searchInput.value = '';
        update();
      },
    },
  });

  // Mirrors the active-filter count so it stays visible while the facets scroll.
  const filtersBadge = el('span.filters__badge', { hidden: true, 'aria-hidden': 'true' });

  const filtersPanel = el('aside.filters', { id: 'filters', 'aria-label': 'Filters' },
    el('div.filters__head', null,
      el('span.filters__title', null, el('span', { text: 'Refine' }), filtersBadge),
      clearButton,
    ),
    ...FACETS.map(buildFacet).filter(Boolean),
    el('div.filters__done', null,
      el('button.btn.btn--primary.btn--block', {
        type: 'button',
        text: 'Show results',
        on: { click: () => toggleFilters(false) },
      }),
    ),
  );

  const filtersToggle = el('button.btn.btn--sm.filters-toggle', {
    type: 'button',
    'aria-expanded': 'false',
    'aria-controls': 'filters',
    on: { click: () => toggleFilters(filtersPanel.dataset.open !== 'true') },
  }, icon('layers', 15), el('span', { text: 'Filters' }));

  function toggleFilters(open) {
    filtersPanel.dataset.open = String(open);
    filtersToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) filtersPanel.querySelector('summary')?.focus();
    else filtersToggle.focus();
  }

  const onKeydown = (event) => {
    if (event.key === 'Escape' && filtersPanel.dataset.open === 'true') toggleFilters(false);
  };
  document.addEventListener('keydown', onKeydown);

  /* --------------------------------------------------------------- results */
  const countLine = el('p.results__count', { role: 'status', 'aria-live': 'polite' });
  const activeFilters = el('div.active-filters');
  const resultsBody = el('div');

  const results = el('section', { 'aria-labelledby': 'results-heading' },
    el('h2.sr-only', { id: 'results-heading', text: 'Search results' }),
    el('div.results__bar', null,
      countLine,
      el('div.row', null, filtersToggle, sortSelect),
    ),
    activeFilters,
    resultsBody,
  );

  function renderActiveFilters() {
    activeFilters.replaceChildren();
    const entries = Object.entries(state.filters).flatMap(([key, values]) => values.map((value) => ({ key, value })));
    if (state.q) {
      activeFilters.appendChild(el('button.filter-pill', {
        type: 'button',
        on: { click: () => { state.q = ''; searchInput.value = ''; update(); } },
      }, el('span.filter-pill__k', { text: 'search' }), el('span', { text: `“${state.q}”` }), el('span.filter-pill__x', { 'aria-hidden': 'true', text: '×' }),
        el('span.sr-only', { text: 'Remove search term' })));
    }
    for (const { key, value } of entries) {
      const facet = FACETS.find((f) => f.key === key);
      const label = facet?.labels?.[value] || (key === 'kind' ? (value === 'none' ? 'No entry types selected' : value === 'program' ? 'Programs' : 'Labs & centers') : value);
      activeFilters.appendChild(el('button.filter-pill', {
        type: 'button',
        on: {
          click: () => {
            state.filters[key] = state.filters[key].filter((v) => v !== value);
            if (!state.filters[key].length) delete state.filters[key];
            update();
          },
        },
      }, el('span.filter-pill__k', { text: facet?.label.toLowerCase() || key }), el('span', { text: label }),
        el('span.filter-pill__x', { 'aria-hidden': 'true', text: '×' }),
        el('span.sr-only', { text: `Remove filter ${label}` })));
    }
    if (entries.length + (state.q ? 1 : 0) > 1) {
      activeFilters.appendChild(el('button.filter-pill', {
        type: 'button',
        style: { borderStyle: 'dashed' },
        on: { click: () => { state.filters = {}; state.q = ''; searchInput.value = ''; update(); } },
      }, el('span', { text: 'Clear all' })));
    }
  }

  function update({ pushUrl = true } = {}) {
    const rows = queryEntries(catalog, state);

    // An absent kind filter includes both types; kind=none preserves neither.
    for (const input of segments) {
      input.checked = !state.filters.kind?.length || state.filters.kind.includes(input.value);
    }

    // Facet counts recomputed against every other active filter
    for (const facet of FACETS) {
      const details = facetNodes.get(facet.key);
      if (!details) continue;
      const applicable = !facet.when || facet.when(state.filters);
      details.hidden = !applicable;
      if (!applicable) continue;
      const counts = facetCounts(catalog, state, facet.key);
      for (const row of catalog.facets[facet.source] || []) {
        const option = optionNodes.get(`${facet.key}:${row.value}`);
        option.matches = counts.get(row.value) || 0;
        option.count.textContent = String(option.matches);
        option.input.checked = Boolean(state.filters[facet.key]?.includes(row.value));
      }
      details._apply();
    }

    sortIsland?.setValue(state.sort);

    const filterCount = Object.values(state.filters).reduce((sum, values) => sum + values.length, 0);
    clearButton.hidden = !filterCount && !state.q;
    filtersBadge.hidden = !filterCount;
    filtersBadge.textContent = String(filterCount);
    filtersToggle.querySelector('span').textContent = filterCount ? `Filters (${filterCount})` : 'Filters';

    countLine.replaceChildren(
      el('strong', { text: String(rows.length) }),
      document.createTextNode(` ${rows.length === 1 ? 'entry' : 'entries'}${state.q ? ` for “${state.q}”` : ''}`),
    );

    renderActiveFilters();

    resultsBody.replaceChildren();
    if (rows.length) {
      const grid = el('div.grid.grid--cards');
      rows.forEach((entry, i) => grid.appendChild(reveal(entryCard(entry), Math.min(i, 6) * 35)));
      resultsBody.appendChild(grid);
    } else {
      resultsBody.appendChild(emptyState({
        title: 'No entries match those filters',
        text: 'Try removing a filter, or search for a broader term. If a real program or lab is missing, adding it takes one issue on GitHub.',
        action: el('div.row', { style: { justifyContent: 'center' } },
          el('button.btn', {
            type: 'button',
            text: 'Clear all filters',
            on: { click: () => { state.filters = {}; state.q = ''; searchInput.value = ''; update(); } },
          }),
          el('a.btn.btn--primary', { href: to('contribute') }, 'Add a missing entry'),
        ),
      }));
    }

    if (pushUrl) writeState(state);
  }

  const page = el('div.explore', null,
    el('div.shell', null,
      el('div.explore__head', null,
        el('div.section-head__text', null,
          el('h1.h1', { text: 'Explore the catalog' }),
          el('p.lede', { text: `${plural(catalog.stats.entries, 'entry', 'entries')} with sources checked across ${plural(catalog.stats.institutions, 'institution')} · filter by level, place, institution or research domain.` }),
        ),
        searchInput,
        segmented,
      ),
      el('div.explore__body', null, filtersPanel, results),
    ),
  );

  update({ pushUrl: false });

  return {
    node: page,
    title: 'Explore · MADRASA',
    onLeave: () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      sortIsland?.destroy();
      sortIsland = null;
    },
  };
}
