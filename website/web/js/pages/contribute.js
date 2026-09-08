import { el, icon, reveal, formatDate } from '../dom.js';
import { to } from '../router.js';
import { sectionHead } from '../components.js';
import { LINKS } from '../config.js';

const INCLUDE = [
  'Offered by a Moroccan university, school, faculty, research center or recognised training institution.',
  'Clearly related to AI, machine learning, data science, big data, robotics, computer vision, NLP, bioinformatics, AI-adjacent cybersecurity, digital health or smart systems.',
  'A Moroccan research structure with visible AI-related teaching, supervision, projects or publications.',
  'A doctoral structure, lab, center or team that supervises AI-related research · even if its official name is broader than AI.',
];

const EXCLUDE = [
  'Generic computer science programs with no visible AI, data or research component.',
  'Private training offers without a reliable source.',
  'Expired calls, unless marked as nonactive.',
  'Entries without at least one URL.',
  'Personal opinions, rankings or unsupported claims.',
];

function pathCard({ title, text, cta, href, iconName, note }) {
  return el('article.card', null,
    el('div.card__head', null,
      el('span.monogram', { 'aria-hidden': 'true' }, icon(iconName, 20)),
      el('div.card__head-text', null,
        el('h3.h3', { text: title }),
        note && el('p.card__inst', { text: note }),
      ),
    ),
    el('p.small.muted', { text }),
    el('a.btn.btn--primary.btn--sm', { href, target: '_blank', rel: 'noopener', style: { marginTop: 'auto', alignSelf: 'flex-start' } },
      cta, icon('external', 14)),
  );
}

function ruleList(title, items, tone) {
  return el('div.stack.stack--sm', null,
    el('h3.h3', { text: title }),
    el('ul', { style: { display: 'grid', gap: 'var(--s-3)', listStyle: 'none' } },
      items.map((item) => el('li', { style: { display: 'grid', gridTemplateColumns: '20px 1fr', gap: 'var(--s-3)', alignItems: 'start' } },
        el('span', { style: { color: tone === 'yes' ? 'var(--ok)' : 'var(--ink-4)', marginTop: '4px' }, 'aria-hidden': 'true' },
          icon(tone === 'yes' ? 'check' : 'spark', 15)),
        el('span.small', { text: item }),
      )),
    ),
  );
}

export default function contribute(catalog) {
  const steps = [
    ['Check it is not already listed', 'Search the catalog first · entries are deduplicated by name, city and host institution.'],
    ['Find an official source', 'A university, school, lab or ministry page. Official PDFs on an institution domain count. Secondary sources only when nothing official exists.'],
    ['Add one JSON object', 'Programs go in catalog/education_programs.json, labs and centers in catalog/research_structures.json. Keep list fields as lists.'],
    ['Set last_checked to today', 'Every entry records the date a human last confirmed the source, in YYYY-MM-DD form.'],
    ['Run the validator', 'python scripts/validate_catalog.py must pass, and python scripts/build_stats.py regenerates the counts if they changed.'],
    ['Open a pull request', 'CI re-runs validation on every pull request. A maintainer reviews the source before merging.'],
  ];

  const page = el('div.entry', null,
    el('div.shell', null,
      el('header.stack', { style: { paddingBlock: 'var(--s-6) var(--s-7)', maxWidth: '62ch' } },
        el('p.eyebrow', { text: 'Contribute' }),
        el('h1.h1.balance', { text: 'The catalog is only as complete as the people who fill it.' }),
        el('p.lede', {
          text: `MADRASA currently holds ${catalog.stats.structures} research structures but only ${catalog.stats.programs} education programs. Morocco has far more of both. Every addition is reviewed in public, against an official source.`,
        }),
      ),

      el('section.section.section--tight.section--edge', null,
        sectionHead('Share what is missing', {
          lede: 'Send a proposal to the MAIR team without a GitHub account, or contribute through the project’s GitHub workflow.',
        }),
        el('div.wrap-gap', { style: { marginBottom: 'var(--s-5)' } },
          el('a.btn.btn--primary', { href: to('submit'), text: 'Submit a research structure' }),
          el('a.btn', { href: to('submit', { kind: 'program' }), text: 'Submit an education program' }),
        ),
        el('div.grid.grid--2', null,
          pathCard({
            iconName: 'spark',
            note: 'Easiest · takes two minutes',
            title: 'Suggest an entry',
            text: 'Fill in a short GitHub issue template with the name, host institution and official link. A maintainer turns it into a catalog entry.',
            cta: 'Open a submission issue',
            href: LINKS.newStructure,
          }),
          pathCard({
            iconName: 'layers',
            note: 'For contributors comfortable with Git',
            title: 'Open a pull request',
            text: 'Edit the JSON directly, run the validator locally, and submit. Your entry lands in the dataset exactly as you wrote it.',
            cta: 'Read CONTRIBUTING.md',
            href: LINKS.contributing,
          }),
        ),
        el('div.wrap-gap.mt-5', null,
          el('a.btn.btn--sm', { href: LINKS.newProgram, target: '_blank', rel: 'noopener' }, icon('cap', 15), 'Submit an education program'),
          el('a.btn.btn--sm', { href: LINKS.newStructure, target: '_blank', rel: 'noopener' }, icon('flask', 15), 'Submit a research structure'),
          el('a.btn.btn--sm', { href: LINKS.discord, target: '_blank', rel: 'noopener' }, 'Ask on Discord'),
        ),
      ),

      el('section.section.section--tight', null,
        sectionHead('What gets accepted', {
          eyebrow: 'Inclusion rules',
          lede: 'Taken directly from the project’s contributing guide · these are the rules maintainers actually apply at review.',
        }),
        el('div.grid.grid--2', { style: { gap: 'var(--s-7)' } },
          ruleList('Include', INCLUDE, 'yes'),
          ruleList('Leave out', EXCLUDE, 'no'),
        ),
      ),

      el('section.section.section--tight.section--edge', null,
        sectionHead('Adding an entry, step by step'),
        el('div.grid.grid--2', { style: { gap: 'var(--s-7)', alignItems: 'start' } },
          el('ol.steps', null, steps.map(([title, text]) => el('li.step', null,
            el('div.step__body', null,
              el('h3.h3', { text: title }),
              el('p.small.muted', { text }),
            ),
          ))),
          el('div.stack', null,
            el('h3.h3', { text: 'Run the checks locally' }),
            el('div.prose', null,
              el('pre', null, el('code', {
                text: [
                  '# validate every record against the schema',
                  'python scripts/validate_catalog.py',
                  '',
                  '# regenerate api/stats.json and the badges',
                  'python scripts/build_stats.py',
                  '',
                  '# confirm the generated files are in sync',
                  'python scripts/build_stats.py --check',
                  '',
                  '# preview this site locally',
                  'python scripts/serve.py',
                ].join('\n'),
              })),
            ),
            el('p.small.muted', { text: 'The same validator runs in CI on every pull request, so a failing check locally means a failing check there too.' }),
            el('div.wrap-gap', null,
              el('a.btn.btn--sm', { href: LINKS.schema, target: '_blank', rel: 'noopener' }, 'Field reference', icon('external', 14)),
              el('a.btn.btn--sm.btn--ghost', { href: to('about') }, 'How sources are checked'),
            ),
          ),
        ),
      ),

      el('section.section.section--tight', null,
        el('div.figure-strip', null,
          el('div.stat', null, el('span.stat__n', { text: String(catalog.stats.entries) }), el('span.stat__label', { text: 'Entries today' })),
          el('div.stat', null, el('span.stat__n', { text: String(catalog.stats.institutions) }), el('span.stat__label', { text: 'Institutions covered' })),
          el('div.stat', null, el('span.stat__n', { text: `${catalog.stats.regions}/12` }), el('span.stat__label', { text: 'Regions with an entry' })),
          el('div.stat', null, el('span.stat__n', { text: formatDate(catalog.stats.lastChecked).split(' ').slice(1).join(' ') }), el('span.stat__label', { text: 'Most recent source check' })),
        ),
        el('p.small.muted.mt-4', { text: 'Five of Morocco’s twelve regions have no entry at all yet. Southern and eastern institutions are the biggest known gap.' }),
      ),
    ),
  );

  page.querySelectorAll('.section-head, .steps, .figure-strip').forEach((node) => reveal(node));

  return {
    node: page,
    title: 'Contribute · MADRASA',
    description: 'How to add a Moroccan AI education program or research structure to the MADRASA catalog.',
  };
}
