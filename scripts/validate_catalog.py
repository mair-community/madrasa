#!/usr/bin/env python3
"""Basic validator for the Moroccan AI Education Catalog."""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROGRAMS = ROOT / "catalog" / "programs.csv"
RESEARCH = ROOT / "catalog" / "research_structures.csv"

PROGRAM_REQUIRED = [
    "program_id", "name", "level", "degree_type", "institution", "school_or_faculty",
    "city", "region", "domains", "research_oriented", "status", "source_title",
    "source_owner", "source_url", "source_type", "last_checked",
]

RESEARCH_REQUIRED = [
    "structure_id", "name", "type", "institution", "school_or_lab", "city", "region",
    "domains", "status", "source_title", "source_owner", "source_url", "source_type",
    "last_checked",
]

VALID_LEVELS = {"Bachelor", "Engineer", "Master", "PhD", "Certificate", "Other"}
VALID_RESEARCH = {"Yes", "Some", "No"}
VALID_STATUS = {"verified_official", "announced_official", "needs_review", "inactive_or_archived"}
VALID_SOURCE_TYPES = {"official", "official_pdf", "secondary", "other"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def validate_rows(path: Path, id_col: str, required: list[str], label: str) -> list[str]:
    rows = read_csv(path)
    errors: list[str] = []
    seen_ids: set[str] = set()

    if not rows:
        return [f"{path.name} is empty"]

    header = rows[0].keys()
    for col in required:
        if col not in header:
            errors.append(f"{path.name}: missing required column: {col}")

    for i, row in enumerate(rows, start=2):
        row_id = row.get(id_col, "").strip()
        if not row_id:
            errors.append(f"{path.name} line {i}: missing {id_col}")
        elif not ID_RE.match(row_id):
            errors.append(f"{path.name} line {i}: invalid {id_col} format: {row_id}")
        elif row_id in seen_ids:
            errors.append(f"{path.name} line {i}: duplicate {id_col}: {row_id}")
        seen_ids.add(row_id)

        for col in required:
            if not row.get(col, "").strip():
                errors.append(f"{path.name} line {i}: missing {col}")

        if row.get("status") and row.get("status") not in VALID_STATUS:
            errors.append(f"{path.name} line {i}: invalid status: {row.get('status')}")
        if row.get("source_type") and row.get("source_type") not in VALID_SOURCE_TYPES:
            errors.append(f"{path.name} line {i}: invalid source_type: {row.get('source_type')}")
        if row.get("last_checked") and not DATE_RE.match(row.get("last_checked", "")):
            errors.append(f"{path.name} line {i}: last_checked must be YYYY-MM-DD")
        if row.get("source_url") and not row.get("source_url", "").startswith(("http://", "https://")):
            errors.append(f"{path.name} line {i}: source_url must be absolute URL")

        if label == "program":
            if row.get("level") not in VALID_LEVELS:
                errors.append(f"{path.name} line {i}: invalid level: {row.get('level')}")
            if row.get("research_oriented") not in VALID_RESEARCH:
                errors.append(f"{path.name} line {i}: invalid research_oriented: {row.get('research_oriented')}")

    print(f"OK: {len(rows)} {label} rows checked.")
    return errors


def main() -> int:
    for path in [PROGRAMS, RESEARCH]:
        if not path.exists():
            print(f"Missing file: {path}")
            return 1

    errors = []
    errors += validate_rows(PROGRAMS, "program_id", PROGRAM_REQUIRED, "program")
    errors += validate_rows(RESEARCH, "structure_id", RESEARCH_REQUIRED, "research structure")

    if errors:
        print("\nCatalog validation failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Catalog validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
