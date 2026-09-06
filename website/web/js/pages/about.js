import { el, icon, reveal, formatDate } from '../dom.js';
import { to } from '../router.js';
import { sectionHead, contributeCta } from '../components.js';
import { LINKS, LABELS } from '../config.js';

function definition(term, description) {
  return el('div.fact', null,
    el('span.fact__k', { text: term }),
    el('div.fact__v', null, el('span', { text: description })),
  );
}

export default function about(catalog) {
  const page = el('div.entry', null,
    el('div.shell', null,
      el('header.stack', { style: { paddingBlock: 'var(--s-6) var(--s-7)', maxWidth: '64ch' } },
        el('p.eyebrow', { text: 'About' }),
        el('h1.h1.balance', { text: 'A public record of Moroccan AI education and research.' }),
        el('p.lede', {
          text: 'Finding out where AI is taught or researched in Morocco usually means trawling dozens of institutional sites, half of which are out of date. MADRASA collects that information once, in the open, with a source and a date attached to every line.',
        }),
        el('div.wrap-gap', null,
          el('a.btn.btn--primary', { href: to('explore') }, 'Explore the catalog', icon('arrow', 15)),
          el('a.btn', { href: LINKS.mair, target: '_blank', rel: 'noopener' }, 'About MAIR', icon('external', 14)),
        ),
      ),

      el('section.section.section--tight.section--edge', null,
        el('div.grid.grid--2', { style: { gap: 'var(--s-7)', alignItems: 'start' } },
          el('div.prose', null,
            el('h2.h2', { text: 'What it is' }),
            el('p', { text: 'MADRASA is a community-maintained catalog of two things: AI-related education programs offered by Moroccan institutions, and the Moroccan laboratories, centers, units and teams doing AI-related research.' }),
            el('p', { text: 'It is a dataset before it is a website. Two JSON files hold every record; this interface reads them directly. Anyone can consume the same files · for a thesis, a policy brief, a scholarship search, or another interface entirely.' }),
            el('h2.h2', { text: 'What it is not' }),
            el('p', { text: 'It is not a ranking, an accreditation body, or an admissions service. It records what institutions publish about themselves. Deadlines, fees and eligibility change constantly, so the official page linked on every entry always takes precedence over what you read here.' }),
          ),
          el('div.stack', null,
            el('div.figure-strip', null,
              el('div.stat', null, el('span.stat__n', { text: String(catalog.stats.structures) }), el('span.stat__label', { text: 'Research structures' })),
              el('div.stat', null, el('span.stat__n', { text: String(catalog.stats.programs) }), el('span.stat__label', { text: 'Education programs' })),
              el('div.stat', null, el('span.stat__n', { text: String(catalog.stats.institutions) }), el('span.stat__label', { text: 'Institutions' })),
              el('div.stat', null, el('span.stat__n', { text: String(catalog.stats.domains) }), el('span.stat__label', { text: 'Domain tags' })),
            ),
            el('p.small.muted', { text: `Catalog last verified on ${formatDate(catalog.stats.lastChecked)}. Counts are computed from the JSON files at page load, so this page can never drift from the data.` }),
            el('div.wrap-gap', null,
              el('a.btn.btn--sm', { href: `${to('')}catalog/research_structures.json`, target: '_blank', rel: 'noopener' }, 'research_structures.json'),
              el('a.btn.btn--sm', { href: `${to('')}catalog/education_programs.json`, target: '_blank', rel: 'noopener' }, 'education_programs.json'),
            ),
          ),
        ),
      ),

      el('section.section.section--tight', null,
        sectionHead('How an entry gets in', {
          eyebrow: 'Method',
          lede: 'The rules are deliberately narrow. A catalog that accepts everything is worth nothing.',
        }),
        el('ol.steps', null, [
          ['One official source, minimum', 'Preference order: the institution’s own page, then its admissions platform, then an official PDF on an institution domain, then a ministry, CNRST or Jamiati portal. Secondary sources are a last resort.'],
          ['AI has to be visible', 'A generic computer science degree does not qualify. There must be a stated AI, machine learning, data science or closely adjacent component · even if the structure’s official name is broader.'],
          ['Recorded, not paraphrased', 'Fields follow a published schema with fixed vocabularies for level, mode, tuition, status and region, so entries stay comparable instead of turning into free prose.'],
          ['Dated and re-checked', 'Every record stores last_checked. An entry that stops being verifiable is marked nonactive rather than deleted, so the history stays intact.'],
          ['Merged in public', 'Changes arrive as pull requests. Automated validation runs on each one; a maintainer checks the source before merging.'],
        ].map(([title, text]) => el('li.step', null,
          el('div.step__body', null,
            el('h3.h3', { text: title }),
            el('p.small.muted', { text }),
          ),
        ))),
      ),

      el('section.section.section--tight.section--edge', null,
        sectionHead('Reading an entry', { lede: 'Two fields do most of the work when you judge how much to trust a record.' }),
        el('div.factsheet', null,
          definition('status', 'Operational state as far as public sources show. Active means the program or structure appears to be running; nonactive means archived, discontinued or kept for historical tracking.'),
          definition('last_checked', 'The date a human last opened the official source and confirmed the entry. Older dates are not wrong · they are simply less fresh.'),
          definition('url', 'Always a list. Some entries need more than one official page, for example a lab page plus its doctoral study structure.'),
          definition('domains', 'Free-text tags written by contributors. They are grouped into families on this site for browsing, but stored exactly as submitted.'),
        ),
        el('div.wrap-gap.mt-5', null,
          ...Object.entries(LABELS.status)
            .filter(([key]) => ['active', 'nonactive'].includes(key))
            .map(([key, label]) => el('span.chip.chip--static', null,
              el('span.status-dot', { dataset: { status: key } }), el('span', { text: `${label} · ${key}` }))),
        ),
      ),

      el('section.section.section--tight', null,
        sectionHead('Known gaps', {
          eyebrow: 'Honest limitations',
          lede: 'Stating these plainly is more useful than pretending the catalog is complete.',
        }),
        el('div.grid.grid--3', null, [
          ['Programs are under-covered', `Only ${catalog.stats.programs} education programs are listed against ${catalog.stats.structures} research structures. Morocco has many more of both.`],
          ['Geography is uneven', `${catalog.stats.regions} of Morocco’s 12 regions appear. Southern and eastern institutions are barely represented.`],
          ['Tags are contributor-written', 'Domain vocabulary is not controlled, so similar ideas can appear under different labels. This site reconciles the obvious cases only.'],
        ].map(([title, text]) => el('article.card', null,
          el('h3.h3', { text: title }),
          el('p.small.muted', { text }),
        ))),
      ),

      el('section.section.section--tight.section--edge', null,
        el('div.grid.grid--2', { style: { gap: 'var(--s-7)', alignItems: 'start' } },
          el('div.prose', null,
            el('h2.h2', { text: 'Who maintains it' }),
            el('p', null, 'MADRASA is a project of ', el('a', { href: LINKS.mair, rel: 'noopener', target: '_blank', text: 'MAIR' }), ', a Moroccan AI community. It is independent: no institution pays for placement, and inclusion is not an endorsement.'),
            el('p', null, 'The code and data are MIT licensed and live on ', el('a', { href: LINKS.repo, rel: 'noopener', target: '_blank', text: 'GitHub' }), '. Corrections are welcome from anyone · students and staff of the listed institutions especially.'),
          ),
          el('div.stack', null,
            el('h3.h3', { text: 'Get in touch' }),
            el('ul.link-list', null,
              el('li', null, el('a', { href: LINKS.repo, target: '_blank', rel: 'noopener' }, icon('layers', 16), el('span.host', { text: 'Open an issue on GitHub' }), icon('external', 14))),
              el('li', null, el('a', { href: LINKS.discord, target: '_blank', rel: 'noopener' }, icon('globe', 16), el('span.host', { text: 'Join the MAIR Discord' }), icon('external', 14))),
              el('li', null, el('a', { href: LINKS.mair, target: '_blank', rel: 'noopener' }, icon('spark', 16), el('span.host', { text: 'mair.ma' }), icon('external', 14))),
            ),
          ),
        ),
      ),

      el('div.section', null, contributeCta()),
    ),
  );

  page.querySelectorAll('.section-head, .steps, .factsheet, .figure-strip, .cta-panel').forEach((node) => reveal(node));

  return {
    node: page,
    title: 'About · MADRASA',
    description: 'How the MADRASA catalog of Moroccan AI education and research is built, verified and maintained.',
  };
}
