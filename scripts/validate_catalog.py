#!/usr/bin/env python3
"""Validate the MADRASA JSON catalog."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PROGRAMS = ROOT / "catalog" / "programs.json"
RESEARCH = ROOT / "catalog" / "research_structures.json"

PROGRAM_REQUIRED = [
    "program_id",
    "name",
    "level",
    "degree_type",
    "institution",
    "school_or_faculty",
    "city",
    "region",
    "domains",
    "research_oriented",
    "status",
    "source_title",
    "source_owner",
    "source_url",
    "source_type",
    "last_checked",
]

RESEARCH_REQUIRED = [
    "structure_id",
    "name",
    "type",
    "institution",
    "school_or_lab",
    "city",
    "region",
    "domains",
    "status",
    "source_title",
    "source_owner",
    "source_url",
    "source_type",
    "last_checked",
]

VALID_LEVELS = {"Bachelor", "Engineer", "Master", "PhD", "Postdoctoral", "Certificate", "Executive", "Other"}
VALID_RESEARCH = {"Yes", "Some", "No"}
VALID_STATUS = {"verified_official", "needs_review", "inactive_or_archived"}
VALID_SOURCE_TYPES = {"official", "official_pdf", "secondary", "other"}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def read_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError(f"{path.name} must contain a JSON array")

    return data


def is_url(value: str) -> bool:
    return value.startswith(("http://", "https://"))


def validate_rows(path: Path, id_col: str, required: list[str], label: str) -> list[str]:
    errors: list[str] = []
    rows = read_json(path)

    if not rows:
        return [f"{path.name} is empty"]

    seen_ids: set[str] = set()

    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            errors.append(f"{path.name} item {index}: item must be an object")
            continue

        row_id = str(row.get(id_col, "")).strip()

        if not row_id:
            errors.append(f"{path.name} item {index}: missing {id_col}")
        elif not ID_RE.match(row_id):
            errors.append(f"{path.name} item {index}: invalid {id_col}: {row_id}")
        elif row_id in seen_ids:
            errors.append(f"{path.name} item {index}: duplicate {id_col}: {row_id}")

        seen_ids.add(row_id)

        for field in required:
            value = row.get(field)
            if value is None or value == "" or value == []:
                errors.append(f"{path.name} item {index}: missing {field}")

        domains = row.get("domains")
        if domains is not None and not isinstance(domains, list):
            errors.append(f"{path.name} item {index}: domains must be a list")

        status = row.get("status")
        if status and status not in VALID_STATUS:
            errors.append(f"{path.name} item {index}: invalid status: {status}")

        source_type = row.get("source_type")
        if source_type and source_type not in VALID_SOURCE_TYPES:
            errors.append(f"{path.name} item {index}: invalid source_type: {source_type}")

        last_checked = row.get("last_checked")
        if last_checked and not DATE_RE.match(str(last_checked)):
            errors.append(f"{path.name} item {index}: last_checked must be YYYY-MM-DD")

        for url_field in ["source_url", "pdf_url", "image_url", "archived_url"]:
            value = str(row.get(url_field, "")).strip()
            if value and not is_url(value):
                errors.append(f"{path.name} item {index}: {url_field} must be an absolute URL")

        if label == "program":
            level = row.get("level")
            if level and level not in VALID_LEVELS:
                errors.append(f"{path.name} item {index}: invalid level: {level}")

            research = row.get("research_oriented")
            if research and research not in VALID_RESEARCH:
                errors.append(f"{path.name} item {index}: invalid research_oriented: {research}")

    print(f"OK: {len(rows)} {label} entries checked.")
    return errors


def main() -> int:
    for path in [PROGRAMS, RESEARCH]:
        if not path.exists():
            print(f"Missing file: {path}")
            return 1

    errors: list[str] = []

    try:
        errors += validate_rows(PROGRAMS, "program_id", PROGRAM_REQUIRED, "program")
        errors += validate_rows(RESEARCH, "structure_id", RESEARCH_REQUIRED, "research structure")
    except json.JSONDecodeError as error:
        print(f"Invalid JSON: {error}")
        return 1
    except ValueError as error:
        print(error)
        return 1

    if errors:
        print("\nCatalog validation failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Catalog validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())