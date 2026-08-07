# Catalog schema

MADRASA uses JSON files as the source of truth.

- `catalog/education_programs.json`
- `catalog/research_structures.json`

Generated badge/stat files are stored in `api/`.

## Common rules

- IDs must be lowercase slugs using letters, numbers, and hyphens only.
- `host_institution`, `unit`, `domains`, and `url` must be lists.
- URLs must be raw absolute URLs, not Markdown links.
- Dates must use `YYYY-MM-DD`.
- `status` must be either `active` or `nonactive`.
- Use English names for cities, regions, and institutions when possible.

## `catalog/education_programs.json`

| Field | Required | Type | Description |
|---|---:|---|---|
| `program_id` | Yes | string | Stable lowercase slug, e.g. `uca-master-ai`. |
| `name` | Yes | string | English program name. Keep acronyms when useful. |
| `level` | Yes | string | `Bachelor`, `Engineer`, `Master`, `PhD`, `Postdoctoral`, `Certificate`, `Executive`, or `Other`. |
| `degree_type` | Yes | string | Degree type, e.g. `Master`, `Research Master`, `Engineering Degree`, `PhD`. |
| `host_institution` | Yes | list | University, school, or standalone institution hosting the program. |
| `unit` | Yes | list | School, faculty, CEDoc, center, department, or unit. |
| `city` | Yes | string | City name in English. |
| `region` | Yes | string | Moroccan administrative region name in English. |
| `mode` | Yes | string | `in_person`, `online`, `hybrid`, `executive`, `research`, `alternance`, or `unknown`. |
| `duration_years` | Yes | number/null | Program duration in years. Use `null` when unknown. |
| `language` | Yes | list | Main language(s) of instruction. |
| `tuition` | Yes | string | `public`, `private`, `funded`, `fellowship`, `paid`, or `unknown`. |
| `tuition_amount_mad` | No | number/null | Tuition amount in MAD when known. |
| `admission` | Yes | list | Short eligibility/admission notes. |
| `domains` | Yes | list | AI/data-related domains. |
| `status` | Yes | string | `active` or `nonactive`. |
| `url` | Yes | list | One or more official/source URLs. |
| `last_checked` | Yes | string | Date checked, `YYYY-MM-DD`. |
| `notes` | No | string/null | Short practical note. |

Example:

```json
{
  "program_id": "inpt-master-data-ia",
  "name": "Data and Artificial Intelligence",
  "level": "Master",
  "degree_type": "Master",
  "host_institution": ["National Institute of Posts and Telecommunications"],
  "unit": "INPT",
  "city": "Rabat",
  "region": "Rabat-Sale-Kenitra",
  "mode": "alternance",
  "duration_years": 2,
  "language": ["French"],
  "tuition": "funded",
  "tuition_amount_mad": null,
  "admission": ["Selective admission", "Application file""],
  "domains": ["Data Science", "Data Engineering", "AI", "Machine Learning"],
  "status": "active",
  "url": ["https://masterdata-ia.inpt.ac.ma/"],
  "last_checked": "2026-06-23",
  "notes": "Alternance-based master program."
}
```

## `catalog/research_structures.json`

Use this file for laboratories, research centers, doctoral structures, and AI research groups.

| Field | Required | Type | Description |
|---|---:|---|---|
| `structure_id` | Yes | string | Stable lowercase slug. |
| `name` | Yes | string | Official or translated name of the structure. |
| `type` | Yes | string | Example: `Laboratory`, `Center`, `Research team`, `Research unit`, `Computing infrastructure`. |
| `host_institution` | Yes | list | University, school, center, or institution hosting the structure. |
| `unit` | Yes | list | School, faculty, lab, center, or internal unit. |
| `city` | Yes | string | City name in English. |
| `region` | Yes | string | Moroccan administrative region name in English. |
| `domains` | Yes | list | AI/data/research domains. |
| `status` | Yes | string | `active` or `nonactive`. |
| `url` | Yes | list | One or more official/source URLs. |
| `last_checked` | Yes | string | Date checked, `YYYY-MM-DD`. |
| `notes` | No | string/null | Short factual note. |

Example:

```json
{
  "structure_id": "um6p-colcom-bioinformatics-lab",
  "name": "Bioinformatics Laboratory",
  "type": "Laboratory",
  "host_institution": ["Mohammed VI Polytechnic University"],
  "unit": "College of Computing",
  "city": "Benguerir",
  "region": "Marrakesh-Safi",
  "domains": ["Bioinformatics", "Computational Biology", "Computational Genomics", "AI", "Machine Learning"],
  "status": "active",
  "url": ["https://bioinformatics.um6p.ma/"],
  "last_checked": "2026-08-01",
  "notes": "Relevant team: Bioinformatics Lab, College of Computing."
}
```

## Region names

Use these region names:

- `Tanger-Tetouan-Al Hoceima`
- `Oriental`
- `Fes-Meknes`
- `Rabat-Sale-Kenitra`
- `Beni Mellal-Khenifra`
- `Casablanca-Settat`
- `Marrakesh-Safi`
- `Draa-Tafilalet`
- `Souss-Massa`
- `Guelmim-Oued Noun`
- `Laayoune-Sakia El Hamra`
- `Dakhla-Oued Ed-Dahab`
- `Multiple regions`

## ID convention

Use:

```text
<institution-short>-<level-or-type>-<short-name>
```

Examples:

```text
uca-master-ai
inpt-master-data-ai
insea-phd-si2m
uh2c-ai-systems
```
