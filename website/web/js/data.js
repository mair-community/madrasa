/**
 * Catalog loading and normalisation.
 *
 * Reads the repository's real catalog files. Nothing here mutates them: the
 * alias maps in `config.js` reconcile spelling variants for display and
 * faceting, and every entry keeps a pointer back to its raw record.
 */
import {
  SOURCES, INSTITUTION_ALIASES, CITY_ALIASES, DOMAIN_ALIASES,
  INSTITUTION_SHORT, LABELS, REGION_ORDER, DOMAIN_FAMILIES,
} from './config.js';

export function slugify(value) {
  return String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function canonical(value, aliases) {
  const trimmed = String(value ?? '').trim().replace(/\s+/g, ' ');
  return aliases[trimmed.toLowerCase()] || trimmed;
}

/** Schema allows `unit` to be a string, list, null or absent. */
function toList(value, aliases = null) {
  const raw = value == null ? [] : Array.isArray(value) ? value : [value];
  const out = [];
  for (const item of raw) {
    const clean = aliases ? canonical(item, aliases) : String(item ?? '').trim().replace(/\s+/g, ' ');
    if (clean && !out.includes(clean)) out.push(clean);
  }
  return out;
}

export function institutionShort(name) {
  if (INSTITUTION_SHORT[name]) return INSTITUTION_SHORT[name];
  const words = name.split(/\s+/).filter((w) => w.length > 3 && !/^(of|the|and|in|for)$/i.test(w));
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('') || name.slice(0, 3).toUpperCase();
}

function normaliseEntry(raw, kind) {
  const institutions = toList(raw.host_institution, INSTITUTION_ALIASES);
  const domains = toList(raw.domains, DOMAIN_ALIASES);
  const city = canonical(raw.city, CITY_ALIASES);
  const id = String(kind === 'program' ? raw.program_id : raw.structure_id);

  const entry = {
    id,
    kind,
    href: `${kind}/${id}`,
    name: String(raw.name ?? '').trim(),
    institutions,
    institutionSlugs: institutions.map(slugify),
    units: toList(raw.unit),
    city,
    region: String(raw.region ?? '').trim(),
    domains,
    domainSlugs: domains.map(slugify),
    status: String(raw.status ?? 'unknown'),
    urls: toList(raw.url),
    lastChecked: raw.last_checked || '',
    notes: raw.notes ? String(raw.notes).trim() : '',
    raw,
  };

  if (kind === 'program') {
    entry.level = String(raw.level ?? '').trim();
    entry.degreeType = String(raw.degree_type ?? '').trim();
    entry.mode = String(raw.mode ?? 'unknown');
    entry.modeLabel = LABELS.mode[entry.mode] || entry.mode;
    entry.durationYears = typeof raw.duration_years === 'number' ? raw.duration_years : null;
    entry.languages = toList(raw.language);
    entry.tuition = String(raw.tuition ?? 'unknown');
    entry.tuitionLabel = LABELS.tuition[entry.tuition] || entry.tuition;
    entry.tuitionAmount = typeof raw.tuition_amount_mad === 'number' ? raw.tuition_amount_mad : null;
    entry.admission = toList(raw.admission);
    entry.category = entry.level;
  } else {
    entry.structureType = String(raw.type ?? '').trim();
    entry.category = entry.structureType;
  }

  entry.searchText = [
    entry.name, entry.city, entry.region, entry.category, entry.degreeType,
    ...entry.institutions, ...entry.institutions.map(institutionShort),
    ...entry.units, ...entry.domains, entry.notes,
  ].filter(Boolean).join(' ').toLowerCase();

  return entry;
}

function tally(entries, pick) {
  const counts = new Map();
  for (const entry of entries) {
    for (const value of [].concat(pick(entry) ?? [])) {
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return counts;
}

function sortedCounts(counts, { order = null } = {}) {
  const rows = [...counts].map(([value, count]) => ({ value, count }));
  if (order) {
    rows.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
  } else {
    rows.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }
  return rows;
}

/** Groups the free-text domain tags into the families declared in config. */
function buildDomainFamilies(domainRows) {
  const assigned = new Set();
  const families = DOMAIN_FAMILIES.map((family) => {
    const members = domainRows.filter((row) => !assigned.has(row.value) && family.match.includes(row.value));
    members.forEach((row) => assigned.add(row.value));
    return { ...family, members, total: members.reduce((sum, row) => sum + row.count, 0) };
  });

  const rest = domainRows.filter((row) => !assigned.has(row.value));
  if (rest.length) {
    families.push({
      id: 'other',
      name: 'Other specialisations',
      blurb: 'Tags that sit outside the main families, kept exactly as contributors wrote them.',
      members: rest,
      total: rest.reduce((sum, row) => sum + row.count, 0),
    });
  }
  return families.filter((family) => family.members.length);
}

function buildInstitutions(entries) {
  const map = new Map();
  for (const entry of entries) {
    entry.institutions.forEach((name, index) => {
      const slug = entry.institutionSlugs[index];
      if (!map.has(slug)) {
        map.set(slug, {
          slug, name, short: institutionShort(name),
          entries: [], programs: 0, structures: 0,
          cities: new Set(), regions: new Set(), domains: new Map(),
        });
      }
      const institution = map.get(slug);
      institution.entries.push(entry);
      institution[entry.kind === 'program' ? 'programs' : 'structures'] += 1;
      if (entry.city) institution.cities.add(entry.city);
      if (entry.region) institution.regions.add(entry.region);
      for (const domain of entry.domains) institution.domains.set(domain, (institution.domains.get(domain) || 0) + 1);
    });
  }

  return [...map.values()]
    .map((institution) => ({
      ...institution,
      cities: [...institution.cities].sort(),
      regions: [...institution.regions].sort(),
      topDomains: sortedCounts(institution.domains).slice(0, 6).map((row) => row.value),
      total: institution.entries.length,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export function buildCatalog(programsRaw, structuresRaw) {
  const programs = programsRaw.map((row) => normaliseEntry(row, 'program'));
  const structures = structuresRaw.map((row) => normaliseEntry(row, 'structure'));
  const entries = [...programs, ...structures];

  const byId = new Map(entries.map((entry) => [`${entry.kind}:${entry.id}`, entry]));
  const domainRows = sortedCounts(tally(entries, (e) => e.domains));
  const institutions = buildInstitutions(entries);

  const lastChecked = entries
    .map((entry) => entry.lastChecked)
    .filter(Boolean)
    .sort()
    .pop() || '';

  return {
    entries,
    programs,
    structures,
    institutions,
    institutionBySlug: new Map(institutions.map((i) => [i.slug, i])),
    get: (kind, id) => byId.get(`${kind}:${id}`),
    facets: {
      kind: [
        { value: 'program', label: 'Programs', count: programs.length },
        { value: 'structure', label: 'Labs & centers', count: structures.length },
      ],
      level: sortedCounts(tally(programs, (e) => e.level)),
      structureType: sortedCounts(tally(structures, (e) => e.structureType)),
      region: sortedCounts(tally(entries, (e) => e.region), { order: REGION_ORDER }),
      city: sortedCounts(tally(entries, (e) => e.city)),
      institution: sortedCounts(tally(entries, (e) => e.institutions)),
      domain: domainRows,
      language: sortedCounts(tally(programs, (e) => e.languages)),
      mode: sortedCounts(tally(programs, (e) => e.mode)),
      tuition: sortedCounts(tally(programs, (e) => e.tuition)),
    },
    domainFamilies: buildDomainFamilies(domainRows),
    stats: {
      programs: programs.length,
      structures: structures.length,
      entries: entries.length,
      institutions: institutions.length,
      cities: new Set(entries.map((e) => e.city).filter(Boolean)).size,
      regions: new Set(entries.map((e) => e.region).filter(Boolean)).size,
      domains: domainRows.length,
      lastChecked,
    },
  };
}

let cache = null;

/** Loads and normalises the catalog once per page session. */
export function loadCatalog() {
  if (cache) return cache;
  cache = Promise.all(
    [SOURCES.programs, SOURCES.structures].map(async (url) => {
      const file = url.split('/').pop();
      let response;
      try {
        response = await fetch(url, { cache: 'no-cache', headers: { Accept: 'application/json' } });
      } catch {
        // A network-level failure surfaces as an opaque TypeError; say something useful.
        throw new Error(`Could not reach ${file}. Check your connection and try again.`);
      }
      if (!response.ok) throw new Error(`${file} could not be loaded (HTTP ${response.status}).`);
      try {
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error();
        return data;
      } catch {
        throw new Error(`${file} is not valid catalog JSON.`);
      }
    }),
  ).then(([programs, structures]) => buildCatalog(programs, structures))
    .catch((error) => {
      cache = null;
      throw error;
    });
  return cache;
}

/* -------------------------------------------------------------------------- */
/* Querying                                                                    */
/* -------------------------------------------------------------------------- */

const FIELD_OF = {
  kind: (entry) => entry.kind,
  level: (entry) => entry.level,
  type: (entry) => entry.structureType,
  region: (entry) => entry.region,
  city: (entry) => entry.city,
  institution: (entry) => entry.institutions,
  domain: (entry) => entry.domains,
  language: (entry) => entry.languages,
  mode: (entry) => entry.mode,
  tuition: (entry) => entry.tuition,
  status: (entry) => entry.status,
};

export const FILTER_KEYS = Object.keys(FIELD_OF);

function matchesFilter(entry, key, values) {
  const actual = FIELD_OF[key]?.(entry);
  if (actual == null) return false;
  const list = [].concat(actual);
  return values.some((value) => list.includes(value));
}

/** Scores a match so exact/prefix hits on the name rank above tag hits. */
function score(entry, query) {
  const name = entry.name.toLowerCase();
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (name.includes(query)) return 60;
  if (entry.institutions.some((i) => i.toLowerCase().includes(query))) return 40;
  if (entry.domains.some((d) => d.toLowerCase().includes(query))) return 30;
  return entry.searchText.includes(query) ? 10 : 0;
}

export const SORTS = {
  relevance: { label: 'Best match' },
  name: { label: 'Name (A–Z)' },
  checked: { label: 'Recently checked sources' },
  institution: { label: 'Institution' },
};

/**
 * @param {object} catalog
 * @param {{q?: string, filters?: Record<string, string[]>, sort?: string}} query
 */
export function queryEntries(catalog, { q = '', filters = {}, sort = 'relevance' } = {}) {
  const needle = q.trim().toLowerCase();
  const active = Object.entries(filters).filter(([, values]) => values && values.length);

  let rows = catalog.entries.filter((entry) => active.every(([key, values]) => matchesFilter(entry, key, values)));

  if (needle) {
    rows = rows
      .map((entry) => ({ entry, s: score(entry, needle) }))
      .filter((row) => row.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((row) => row.entry);
  }

  const collator = new Intl.Collator('en');
  if (sort === 'name') rows = [...rows].sort((a, b) => collator.compare(a.name, b.name));
  else if (sort === 'checked') rows = [...rows].sort((a, b) => (b.lastChecked || '').localeCompare(a.lastChecked || '') || collator.compare(a.name, b.name));
  else if (sort === 'institution') rows = [...rows].sort((a, b) => collator.compare(a.institutions[0] || '', b.institutions[0] || '') || collator.compare(a.name, b.name));
  else if (!needle) rows = [...rows].sort((a, b) => collator.compare(a.name, b.name));

  return rows;
}

/**
 * Facet counts computed against every *other* active filter, so a facet never
 * hides options that are still reachable within its own group.
 */
export function facetCounts(catalog, { q = '', filters = {} }, key) {
  const needle = q.trim().toLowerCase();
  const others = Object.entries(filters).filter(([k, values]) => k !== key && values && values.length);
  const rows = catalog.entries.filter((entry) => {
    if (!others.every(([k, values]) => matchesFilter(entry, k, values))) return false;
    return !needle || score(entry, needle) > 0;
  });
  return tally(rows, FIELD_OF[key]);
}

/** Entries that share an institution or, failing that, several domains. */
export function relatedEntries(catalog, entry, limit = 3) {
  const domains = new Set(entry.domains);
  return catalog.entries
    .filter((other) => other !== entry)
    .map((other) => {
      const sameInstitution = other.institutions.some((i) => entry.institutions.includes(i));
      const shared = other.domains.filter((d) => domains.has(d)).length;
      return { other, weight: (sameInstitution ? 10 : 0) + shared + (other.city === entry.city ? 1 : 0) };
    })
    .filter((row) => row.weight > 1)
    .sort((a, b) => b.weight - a.weight || a.other.name.localeCompare(b.other.name))
    .slice(0, limit)
    .map((row) => row.other);
}
