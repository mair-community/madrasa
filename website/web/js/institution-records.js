import { el, icon, formatDate, reveal } from './dom.js';
import { to } from './router.js';
import { LABELS } from './config.js';
import { brandMark } from './components.js';

function placeOf(entry) {
  const city = entry.city || entry.region || 'Unknown';
  const region = entry.region && entry.region !== entry.city ? entry.region : '';
  return el('p.rec__where', null,
    el('span', { text: city }),
    region ? el('span.rec__region', { text: region }) : null,
  );
}

/**
 * Domains as running text rather than chips: inside a row, chips add three
 * borders and a wrap point per record and destroy the column's rhythm.
 */
function domainsOf(entry) {
  const shown = entry.domains.slice(0, 2).join(', ');
  const rest = entry.domains.length - 2;
  return rest > 0 ? `${shown} +${rest}` : shown || 'None listed';
}

/**
 * One record. A single real anchor whose ::after covers the row, so the whole
 * row is clickable without nesting interactive elements inside a link.
 */
export function record(entry) {
  const isProgram = entry.kind === 'program';
  const institution = entry.institutions[0] || '';

  const kind = isProgram
    ? (entry.degreeType || entry.level || 'Program')
    : (entry.structureType || 'Structure');

  return el('li', { class: `rec${isProgram ? ' rec--program' : ''}` },
    el('span.rec__mark', null, brandMark(institution, { size: 'row' })),

    // Name first, then one meta line. Stacking kind, name and institution as
    // three lines is what makes a row tall enough to stop being a row.
    el('div.rec__main', null,
      el('h3.rec__name', null, el('a', { href: to(entry.href), text: entry.name })),
      el('p.rec__org', null,
        el('span', { class: `rec__kind${isProgram ? ' rec__kind--program' : ''}`, text: kind }),
        institution ? document.createTextNode(` · ${institution}`) : null,
      ),
    ),

    el('div.rec__meta', null,
      placeOf(entry),
      el('p.rec__domains', { text: domainsOf(entry) }),
      el('p.rec__seen', null,
        el('span.status-dot', { dataset: { status: entry.status }, 'aria-label': LABELS.status[entry.status] || entry.status }),
        el('span', { text: entry.lastChecked ? formatDate(entry.lastChecked) : 'not dated' }),
      ),
    ),

    el('span.rec__go', { 'aria-hidden': 'true' }, icon('arrow', 15)),
  );
}


export function institutionRecords(entries) {
  return el('ul.institution-records', null, entries.map((entry) => reveal(record(entry))));
}
