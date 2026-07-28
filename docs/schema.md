# Catalog schema

The catalog uses two json files only. Source information is merged directly into each file.

## `data/programs.json`

| Column | Required | Description |
|---|---:|---|
| `program_id` | Yes | Stable lowercase slug, e.g. `uca-master-ai`. |
| `name` | Yes | English program name. Keep acronyms when useful. |
| `level` | Yes | One of `Bachelor`, `Engineer`, `Master`, `PhD`, `Certificate`, `Other`. |
| `degree_type` | Yes | Degree type, e.g. `Master`, `Research Master`, `State Engineering Degree`, `PhD`. |
| `institution` | Yes | Parent university or school, written in English when possible. |
| `school_or_faculty` | Yes | Faculty, school, CEDoc, center, or department. |
| `city` | Yes | City name in English. |
| `region` | Yes | Moroccan administrative region name in English. |
| `mode` | No | Presential, hybrid, executive, research, alternance, etc. |
| `duration` | No | Duration when known. |
| `language` | No | Main language(s) of instruction. |
| `tuition` | No | Public/private/known fee/unknown. |
| `admission` | No | Short eligibility summary. |
| `domains` | Yes | Semicolon-separated AI/data domains. |
| `research_oriented` | Yes | `Yes`, `Some`, or `No`. |
| `status` | Yes | `verified_official`, `announced_official`, `needs_review`, `inactive_or_archived`. |
| `source_title` | Yes | Human-readable source title. |
| `source_owner` | Yes | Institution or source owner. |
| `source_url` | Yes | Main URL used for verification. |
| `source_type` | Yes | `official`, `official_pdf`, `secondary`, or `other`. |
| `last_checked` | Yes | ISO date `YYYY-MM-DD`. |
| `source_notes` | No | Short note about the source. |
| `notes` | No | Short practical note about the program. |

## `data/research_structures.json`

Use this file for laboratories, Center for Doctoral Studies (CEDoc) formations, research centers, and teams that are useful for AI research discovery but are not standalone degree programs.

Required fields: `structure_id`, `name`, `type`, `institution`, `school_or_lab`, `city`, `region`, `domains`, `status`, `source_title`, `source_owner`, `source_url`, `source_type`, and `last_checked`.

## Source quality rules

Prefer sources in this order:

1. Official university, school, faculty, or lab page
2. Official admissions platform
3. Official PDF hosted on the institution domain
4. Ministry, CNRST, Jamiati, or official national portal
5. Secondary education portals only when no official source is available

Mark entries as `needs_review` when:

- The source is old
- The page does not clearly state the level
- The title appears only in a news post or admission result
- The source is a PDF from a previous academic year
- Accreditation or recognition is unclear

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
