# Contributing

Thanks for helping maintain MADRASA, the Moroccan AI Education Catalog.

## What to edit

- Add or update programs in `catalog/programs.json`.
- Add or update research structures in `catalog/research_structures.json`.
- Do not edit `api/*.json` by hand. Generate them with `python scripts/build_stats.py`.

## Inclusion rules

MADRASA includes entries that meet at least one of the following criteria:

- The program is offered by a Moroccan university, school, faculty, research center, or recognized training institution.
- The program is clearly related to artificial intelligence, machine learning, data science, Big Data, robotics, computer vision, NLP, bioinformatics, cybersecurity with AI, digital health, smart systems, or another AI-adjacent field.
- The research structure is based in Morocco and has visible AI-related teaching, supervision, projects, publications, or research themes.
- The doctoral structure, lab, center, or team supervises or conducts AI-related research, even if its official name is broader than AI.

Do not add:

- Generic computer science programs with no visible AI, data, or research component.
- Private training offers without a reliable source.
- Expired calls unless they are marked as `nonactive`.
- Entries without at least one URL.
- Personal opinions, rankings, or unverified claims.

## Source rules

Use official URLs whenever possible:

1. Official university, school, faculty, lab, or center page
2. Official admissions platform
3. Official PDF hosted on an institution domain
4. Ministry, CNRST, Jamiati, or official national portal
5. Secondary sources only when no official source is available

For PDFs and images:

- Prefer official URLs instead of uploading files to the repository.
- Store links in the `url` list.
- Upload files only if MAIR owns them or has permission to redistribute them.

## Status values

Use only:

- `active`: the program or structure appears currently operational based on public sources.
- `nonactive`: the program or structure is archived, discontinued, expired, or included only for historical tracking.

## Data formatting rules

- Use English names for cities, regions, institutions, and notes when possible.
- Use raw URLs only. Do not use Markdown links inside JSON.
- Keep `host_institution`, `unit`, `domains`, `language`, `admission`, and `url` as lists.
- Use `duration_years` as a number when known, for example `2`, `3`, or `1.5`; use `null` when unknown.
- Use `last_checked` in `YYYY-MM-DD` format.
- Keep notes short and factual.

## Validation

Before opening a pull request, run:

```bash
python scripts/validate_catalog.py
python scripts/build_stats.py
python scripts/build_stats.py --check
```

## Pull request checklist

- [ ] The entry is in Morocco or directly connected to Moroccan AI education/research
- [ ] It is clearly related to AI, data science, machine learning, Big Data, or AI research
- [ ] The URL is official whenever possible
- [ ] The status is either `active` or `nonactive`
- [ ] `last_checked` is updated
- [ ] Generated badge/stat files are updated if counts changed
- [ ] `python scripts/validate_catalog.py` passes
