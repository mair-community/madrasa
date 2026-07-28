<p align="center">
  <img src="assets/logo.png" alt="MAIR logo" width="200"><br>
</p>

<p align="center">
  <strong>Moroccan AI Education Catalog</strong><br>
  A catalog of AI education programs and AI research structures in Morocco.
</p>

<p align="center">
  <a href="https://mair.ma/">
    <img src="https://img.shields.io/badge/Website-mair.ma-980100" alt="MAIR Website">
  </a>
<!--
  <img src="https://img.shields.io/badge/Programs-59-980100" alt="Programs: 0">
  <img src="https://img.shields.io/badge/Research%20structures-6-980100" alt="Research structures: 0">
-->
  <a href="https://discord.gg/ZtNuKJ7V2H">
    <img src="https://img.shields.io/badge/Discord-Community-5865F2?logo=discord&logoColor=white" alt="Discord: Join the server">
  </a>
  <a href="CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/Contributions-Welcome-980100" alt="Contributions Welcome">
  </a>
</p>

A curated catalog of AI-related education and research opportunities in Morocco. This repository helps students, researchers, and contributors discover Moroccan programs related to AI and relevant subjects. It includes the following items:
- Bachelor, master, and engineering programs
- PhD and postdoctoral programs
- Executive programs
- AI-related research structures

## Catalog files

| File | Description |
|---|---|
| `catalog/programs.json` | Main catalog of AI education programs. |
| `catalog/research_structures.json` | AI-related labs, centers, doctoral structures, and research groups. |
| `api/stats.json` | Generated statistics for interfaces and badges. |
| `docs/schema.md` | Field definitions and contribution rules. |

## Quick use

```bash
# Validate the catalog
python scripts/validate_catalog.py

# Generate stats for badges/interfaces
python scripts/build_stats.py

# Pretty-print programs
python -m json.tool catalog/programs.json

# Search with jq
jq '.[] | select(.level == "PhD")' catalog/programs.json
jq '.[] | select(.city == "Rabat")' catalog/programs.json
```

## Status labels

| Status | Meaning |
|---|---|
| `verified_official` | Verified from an official university, school, faculty, or lab page. |
| `needs_review` | Source exists, but the title, level, accreditation, or availability needs checking. |
| `inactive_or_archived` | Kept for history, not currently open. |

## How to contribute

1. Check whether the program or structure already exists.
2. Add or update one JSON entry.
3. Use an official source whenever possible.
4. Update `last_checked`.
5. Run the validator.
6. Open a pull request.

## Notes

- Moroccan program pages change often, especially during admission season.
- Some programs are announced only through annual PDFs.
- PhD opportunities often appear through yearly doctoral calls rather than permanent program pages.

## Disclaimer

This is an independent community catalog. Always verify admission details, accreditation, fees, deadlines, and requirements on the official institution website.
