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
| `catalog/programs.csv` | Main catalog of AI education programs. Source fields are included in the same file. |
| `catalog/research_structures.csv` | AI-related labs, centers, teams, and doctoral structures. Source fields are included in the same file. |
| `docs/schema.md` | Column definitions and contribution rules. |

## Quick use

```bash
# Validate the catalog
python scripts/validate_catalog.py

# Show all PhD entries
csvgrep -c level -m PhD catalog/programs.csv

# Search by city
csvgrep -c city -m Rabat catalog/programs.csv

# Search by keyword
csvgrep -c domains -r "Bioinformatics|Agriculture|Cybersecurity" catalog/programs.csv
```

Install `csvgrep` with:

```bash
pip install csvkit
```

## Status labels

| Status | Meaning |
|---|---|
| `verified_official` | Verified from an official university, school, faculty, or lab page. |
| `announced_official` | Announced by an official source, but still needs next-year confirmation. |
| `needs_review` | Source exists, but the title, level, accreditation, or availability needs checking. |
| `inactive_or_archived` | Kept for history, not currently open. |

## How to contribute

1. Check whether the program or structure already exists.
2. Add or update one row in the correct CSV file.
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
