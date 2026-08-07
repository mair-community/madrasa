<p align="center">
  <img src="assets/logo.png" alt="MAIR logo" width="200"><br>
</p>

<p align="center">
  <strong>MADRASA</strong><br>
  A curated catalog of AI education programs and AI research structures in Morocco.
</p>

<p align="center">
  <a href="https://mair.ma/">
    <img src="https://img.shields.io/badge/Website-mair.ma-980100" alt="MAIR Website">
  </a>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/mair-community/madrasa/main/api/programs-badge.json&cacheSeconds=300" alt="Programs badge">
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/mair-community/madrasa/main/api/research-structures-badge.json&cacheSeconds=300" alt="Research structures badge">
  <a href="https://discord.gg/ZtNuKJ7V2H">
    <img src="https://img.shields.io/badge/Discord-Community-5865F2?logo=discord&logoColor=white" alt="Discord: Join the server">
  </a>
  <a href="CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/Contributions-Welcome-980100" alt="Contributions Welcome">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-success" alt="License: MIT">
  </a>
</p>

MADRASA is a community-maintained catalog for discovering AI-related education and research opportunities in Morocco. This repository helps students, researchers, and contributors discover Moroccan educational programs and research structures related to AI.


## Catalog files

| File | Description |
|---|---|
| `catalog/education_programs.json` | Main catalog of AI education programs. |
| `catalog/research_structures.json` | AI-related labs, centers, doctoral structures, and research groups. |
| `api/stats.json` | Generated counts used by interfaces and badges. |
| `api/*-badge.json` | Shields.io endpoint badge files generated from the catalog. |
| `docs/schema.md` | Field definitions and accepted values. |

## Data model

## Data model

The repository uses **JSON as the source of truth**. URLs are stored as lists, because one entry may need more than one official source.

Common rules:

* `host_institution` is always a list.
* `domains` is always a list.
* `url` is always a non-empty list of raw URLs.
* `unit` may be a string, a list, `null`, or absent.
* `status` means operational status: `active`, `likely_active`, `unknown`, or `inactive`.
* `last_checked` must use `YYYY-MM-DD`.

### Educational program example

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
  "admission": ["Selective admission", "Application file", "Interview"],
  "domains": ["Data Science", "Data Engineering", "AI", "Machine Learning"],
  "status": "active",
  "url": ["https://masterdata-ia.inpt.ac.ma/"],
  "last_checked": "2026-06-23",
  "notes": "Alternance-based master program."
}
```

### Research structure example

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

## Quick use

```bash
# Validate the catalog
python scripts/validate_catalog.py

# Generate badge/stat files
python scripts/build_stats.py

# Check that generated badge/stat files are up to date
python scripts/build_stats.py --check

# Pretty-print programs
python -m json.tool catalog/education_programs.json

# Search with jq
jq '.[] | select(.level == "PhD")' catalog/education_programs.json
jq '.[] | select(.city == "Rabat")' catalog/education_programs.json
```

## Status labels

| Status | Meaning |
|---|---|
| `active` | The program or structure appears currently operational based on available public sources. |
| `nonactive` | The entry is archived, discontinued, expired, or kept only for historical tracking. |

## How to contribute

1. Check whether the entry already exists.
2. Add or update one JSON object.
3. Use official URLs whenever possible.
4. Update `last_checked` using `YYYY-MM-DD`.
5. Run `python scripts/validate_catalog.py`.
6. Run `python scripts/build_stats.py` if counts changed.
7. Open a pull request.

## Disclaimer

This is an independent community catalog. Always verify admission details, accreditation, fees, deadlines, and requirements on the official institution website.
