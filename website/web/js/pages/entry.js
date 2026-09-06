import { el, icon, formatDate, plural, reveal } from '../dom.js';
import { to } from '../router.js';
import { relatedEntries, slugify } from '../data.js';
import {
  breadcrumbs, brandMark, statusDot, externalLinks, entryGrid, sectionHead, notFoundState,
} from '../components.js';
import { LINKS } from '../config.js';

function fact(label, value) {
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return null;
  const body = Array.isArray(value)
    ? el('ul', null, value.map((item) => el('li', { text: item })))
    : el('span', { text: String(value) });
  return el('div.fact', null, el('span.fact__k', { text: label }), el('div.fact__v', null, body));
}

function chipRow(values, hrefFor) {
  return el('div.cloud', null, values.map((value) => el('a', { href: hrefFor(value), text: value })));
}

/** schema.org markup so individual entries are meaningful to search engines. */
function structuredData(entry) {
  const payload = entry.kind === 'program'
    ? {
        '@context': 'https://schema.org',
        '@type': 'EducationalOccupationalProgram',
        name: entry.name,
        programType: entry.degreeType || entry.level,
        educationalProgramMode: entry.mode,
        timeToComplete: entry.durationYears ? `P${entry.durationYears}Y` : undefined,
        inLanguage: entry.languages,
        provider: entry.institutions.map((name) => ({ '@type': 'CollegeOrUniversity', name })),
        url: entry.urls[0],
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'ResearchOrganization',
        name: entry.name,
        parentOrganization: entry.institutions.map((name) => ({ '@type': 'CollegeOrUniversity', name })),
        address: { '@type': 'PostalAddress', addressLocality: entry.city, addressRegion: entry.region, addressCountry: 'MA' },
        knowsAbout: entry.domains,
        url: entry.urls[0],
      };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(payload, (key, value) => (value === undefined ? undefined : value));
  return script;
}

export default function entryPage(catalog, { kind, id }) {
  const entry = catalog.get(kind, id);

  if (!entry) {
    return {
      node: el('div.shell', null, notFoundState(`No ${kind === 'program' ? 'program' : 'research structure'} with the id “${id}” exists in the catalog.`)),
      title: 'Not found · MADRASA',
      status: 404,
    };
  }

  const isProgram = entry.kind === 'program';
  const institution = entry.institutions[0] || '';
  const related = relatedEntries(catalog, entry, 3);

  const facts = isProgram
    ? [
        fact('Level', entry.level),
        fact('Degree', entry.degreeType),
        fact('Duration', entry.durationYears ? `${entry.durationYears} ${entry.durationYears === 1 ? 'year' : 'years'}` : null),
        fact('Study mode', entry.modeLabel),
        fact('Language', entry.languages.join(' · ')),
        fact('Tuition', entry.tuitionAmount != null
          ? `${entry.tuitionLabel} · ${entry.tuitionAmount.toLocaleString('en-US')} MAD`
          : entry.tuitionLabel),
        fact('Admission', entry.admission),
        fact('Host institution', entry.institutions),
        fact('Unit', entry.units),
        fact('Location', [entry.city, entry.region].filter(Boolean).join(', ')),
      ]
    : [
        fact('Type', entry.structureType),
        fact('Host institution', entry.institutions),
        fact('Unit', entry.units),
        fact('City', entry.city),
        fact('Region', entry.region),
      ];

  const aside = el('aside', null,
    el('div.aside-card', null,
      el('div.stack.stack--sm', null,
        el('p.eyebrow', { text: 'Official sources' }),
        el('p.small.muted', { text: `${plural(entry.urls.length, 'link')} recorded for this entry. Details on the official page always take precedence over this catalog.` }),
      ),
      externalLinks(entry.urls),
      el('hr.divider'),
      el('div.stack.stack--sm', null,
        statusDot(entry.status),
        el('p.tiny.muted', { text: entry.lastChecked ? `Source last checked on ${formatDate(entry.lastChecked)}.` : 'No verification date recorded.' }),
      ),
      el('a.btn.btn--sm.btn--block', {
        href: `${LINKS.issues}/new?title=${encodeURIComponent(`Update ${entry.kind}: ${entry.name}`)}&body=${encodeURIComponent(`Entry id: \`${entry.id}\`\n\nWhat needs updating?\n\n`)}`,
        rel: 'noopener',
        target: '_blank',
      }, 'Suggest a correction', icon('external', 14)),
    ),
  );

  const main = el('div.stack.stack--lg', null,
    el('div.factsheet', null, facts.filter(Boolean)),

    entry.notes ? el('div.stack.stack--sm', null,
      el('h2.h3', { text: 'Note from the maintainers' }),
      el('p.note', { text: entry.notes }),
    ) : null,

    entry.domains.length ? el('div.stack.stack--sm', null,
      el('h2.h3', { text: isProgram ? 'What you would study' : 'Research domains' }),
      chipRow(entry.domains, (domain) => to('explore', { domain })),
    ) : null,

    el('div.stack.stack--sm', null,
      el('h2.h3', { text: 'Explore from here' }),
      el('div.wrap-gap', null,
        institution && el('a.btn.btn--sm.btn--wrap', { href: to(`institutions/${slugify(institution)}`) }, `All entries at ${institution}`),
        entry.city && el('a.btn.btn--sm.btn--wrap', { href: to('explore', { city: entry.city }) }, `Everything in ${entry.city}`),
        el('a.btn.btn--sm.btn--ghost', { href: to('explore', { kind: entry.kind }) }, isProgram ? 'All programs' : 'All labs & centers'),
      ),
    ),
  );

  const page = el('div.entry', null,
    el('div.shell', null,
      breadcrumbs([
        { label: 'Home', href: to('') },
        { label: isProgram ? 'Programs' : 'Labs & centers', href: to('explore', { kind: entry.kind }) },
        { label: entry.name },
      ]),

      el('header.entry__head', null,
        el('div.entry__title-row', null,
          brandMark(institution, { size: 'lg' }),
          el('div.stack.stack--sm', null,
            el('p', { class: `pill-kind ${isProgram ? 'pill-kind--program' : ''}`, text: isProgram ? (entry.degreeType || entry.level) : entry.structureType }),
            el('h1.h1.entry__title.balance', { text: entry.name }),
          ),
        ),
        el('div.entry__sub', null,
          institution && el('span.card__meta-item', null, icon('building', 15), el('a', { href: to(`institutions/${slugify(institution)}`), text: institution })),
          entry.city && el('span.card__meta-item', null, icon('pin', 15), el('span', { text: [entry.city, entry.region].filter(Boolean).join(', ') })),
        ),
        el('div.wrap-gap', null,
          entry.urls[0] && el('a.btn.btn--primary', { href: entry.urls[0], target: '_blank', rel: 'noopener nofollow' },
            'Visit official page', icon('external', 15)),
          el('a.btn', { href: to('explore') }, 'Back to catalog'),
        ),
      ),

      el('div.entry__body', null, main, aside),

      related.length ? el('section.section', null,
        sectionHead(isProgram ? 'Related programs and labs' : 'Related labs and programs', {
          eyebrow: 'Nearby in the catalog',
          lede: 'Entries that share an institution or overlapping research domains.',
        }),
        entryGrid(related),
      ) : null,
    ),
    structuredData(entry),
  );

  page.querySelectorAll('.factsheet, .aside-card, .section-head').forEach((node) => reveal(node));

  return {
    node: page,
    title: `${entry.name} · ${institution || 'MADRASA'}`,
    description: isProgram
      ? `${entry.degreeType || entry.level} at ${institution} in ${entry.city}. ${entry.domains.slice(0, 4).join(', ')}.`
      : `${entry.structureType} at ${institution} in ${entry.city}. Research domains: ${entry.domains.slice(0, 4).join(', ')}.`,
  };
}
