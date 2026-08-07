#!/usr/bin/env python3
"""Validate the MADRASA JSON catalog.

The catalog is intentionally simple:
- humans edit files in catalog/*.json
- websites/interfaces can consume the same JSON directly
- badge/stat files are generated under api/
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"

PROGRAMS = CATALOG / "education_programs.json"
RESEARCH_STRUCTURES = CATALOG / "research_structures.json"

PROGRAM_REQUIRED = [
    "program_id",
    "name",
    "level",
    "degree_type",
    "host_institution",
    "city",
    "region",
    "mode",
    "duration_years",
    "language",
    "tuition",
    "admission",
    "domains",
    "status",
    "url",
    "last_checked",
]

RESEARCH_REQUIRED = [
    "structure_id",
    "name",
    "type",
    "host_institution",
    "city",
    "region",
    "domains",
    "status",
    "last_checked",
]

VALID_LEVELS = {
    "Bachelor",
    "Engineer",
    "Master",
    "PhD",
    "Postdoctoral",
    "Certificate",
    "Executive",
    "Other",
}

VALID_MODES = {
    "in_person",
    "online",
    "hybrid",
    "executive",
    "research",
    "alternance",
    "unknown",
}

VALID_TUITION = {
    "public",
    "private",
    "funded",
    "fellowship",
    "paid",
    "unknown",
}

# Keep this operational, not verification-related.
VALID_STATUS = {"active", "likely_active", "unknown", "inactive", "nonactive"}

VALID_REGIONS = {
    "Tanger-Tetouan-Al Hoceima",
    "Oriental",
    "Fes-Meknes",
    "Rabat-Sale-Kenitra",
    "Beni Mellal-Khenifra",
    "Casablanca-Settat",
    "Marrakesh-Safi",
    "Draa-Tafilalet",
    "Souss-Massa",
    "Guelmim-Oued Noun",
    "Laayoune-Sakia El Hamra",
    "Dakhla-Oued Ed-Dahab",
    "Multiple regions",
}

ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
URL_RE = re.compile(r"^https?://")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def read_json(path: Path) -> list[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValueError(f"Missing file: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in {path.relative_to(ROOT)}: {error}") from error

    if not isinstance(data, list):
        raise ValueError(f"{path.relative_to(ROOT)} must contain a JSON array")

    for index, row in enumerate(data, start=1):
        if not isinstance(row, dict):
            raise ValueError(f"{path.relative_to(ROOT)} item {index} must be a JSON object")

    return data


def is_blank(value: Any) -> bool:
    return value is None or value == "" or value == []


def require_fields(path: Path, rows: list[dict[str, Any]], required: list[str]) -> list[str]:
    errors: list[str] = []

    for index, row in enumerate(rows, start=1):
        for field in required:
            if field not in row or is_blank(row.get(field)):
                # duration_years may be null when unknown, but the field must exist.
                if field == "duration_years" and field in row:
                    continue
                errors.append(f"{path.name} item {index}: missing {field}")

    return errors


def validate_string_list(
    row: dict[str, Any],
    field: str,
    index: int,
    file_name: str,
    allow_empty: bool = False,
) -> list[str]:
    value = row.get(field)

    if not isinstance(value, list):
        return [f"{file_name} item {index}: {field} must be a list"]

    if not allow_empty and not value:
        return [f"{file_name} item {index}: {field} must not be empty"]

    if any(not isinstance(item, str) or not item.strip() for item in value):
        return [f"{file_name} item {index}: {field} must contain non-empty strings"]

    return []


def validate_optional_unit(row: dict[str, Any], index: int, file_name: str) -> list[str]:
    """unit can be string, list of strings, null, or absent.

    This avoids breaking entries where the host is clear but no specific school/lab/unit exists.
    """
    if "unit" not in row or row.get("unit") is None:
        return []

    value = row.get("unit")

    if isinstance(value, str):
        if not value.strip():
            return [f"{file_name} item {index}: unit string must not be empty"]
        return []

    if isinstance(value, list):
        if any(not isinstance(item, str) or not item.strip() for item in value):
            return [f"{file_name} item {index}: unit list must contain non-empty strings"]
        return []

    return [f"{file_name} item {index}: unit must be a string, list, null, or absent"]


def validate_urls(row: dict[str, Any], index: int, file_name: str) -> list[str]:
    errors: list[str] = []
    value = row.get("url")

    if not isinstance(value, list) or not value:
        return [f"{file_name} item {index}: url must be a non-empty list"]

    for url in value:
        if not isinstance(url, str) or not URL_RE.match(url):
            errors.append(f"{file_name} item {index}: invalid url: {url!r}")
        if "[" in str(url) or "]" in str(url) or "](" in str(url):
            errors.append(f"{file_name} item {index}: url must be raw URL, not Markdown: {url!r}")

    return errors


def validate_common(path: Path, rows: list[dict[str, Any]], id_key: str) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_names: set[tuple[str, str, str]] = set()
    file_name = path.name

    for index, row in enumerate(rows, start=1):
        row_id = str(row.get(id_key, "")).strip()

        if not ID_RE.match(row_id):
            errors.append(f"{file_name} item {index}: invalid {id_key}: {row_id!r}")
        elif row_id in seen_ids:
            errors.append(f"{file_name} item {index}: duplicate {id_key}: {row_id}")

        if row_id:
            seen_ids.add(row_id)

        errors += validate_string_list(row, "host_institution", index, file_name)
        errors += validate_optional_unit(row, index, file_name)
        errors += validate_string_list(row, "domains", index, file_name)
        errors += validate_urls(row, index, file_name)

        status = row.get("status")
        if status not in VALID_STATUS:
            errors.append(
                f"{file_name} item {index}: status must be one of {sorted(VALID_STATUS)}, got {status!r}"
            )

        region = row.get("region")
        if region not in VALID_REGIONS:
            errors.append(f"{file_name} item {index}: non-standard region: {region!r}")

        last_checked = str(row.get("last_checked", ""))
        if not DATE_RE.match(last_checked):
            errors.append(f"{file_name} item {index}: last_checked must be YYYY-MM-DD")
        else:
            checked = datetime.strptime(last_checked, "%Y-%m-%d").date()
            if checked > date.today():
                errors.append(f"{file_name} item {index}: last_checked cannot be in the future")

        host_key = ""
        host_value = row.get("host_institution")
        if isinstance(host_value, list):
            host_key = ";".join(host_value).casefold()

        name_key = (
            str(row.get("name", "")).casefold(),
            str(row.get("city", "")).casefold(),
            host_key,
        )

        if name_key in seen_names:
            errors.append(f"{file_name} item {index}: possible duplicate name/city/host: {row.get('name')}")

        seen_names.add(name_key)

    return errors


def validate_programs(rows: list[dict[str, Any]]) -> list[str]:
    errors = require_fields(PROGRAMS, rows, PROGRAM_REQUIRED)
    errors += validate_common(PROGRAMS, rows, "program_id")

    for index, row in enumerate(rows, start=1):
        if row.get("level") not in VALID_LEVELS:
            errors.append(f"education_programs.json item {index}: invalid level: {row.get('level')!r}")

        if row.get("mode") not in VALID_MODES:
            errors.append(f"education_programs.json item {index}: invalid mode: {row.get('mode')!r}")

        if row.get("tuition") not in VALID_TUITION:
            errors.append(f"education_programs.json item {index}: invalid tuition: {row.get('tuition')!r}")

        duration = row.get("duration_years")
        if duration is not None:
            if not isinstance(duration, (int, float)) or isinstance(duration, bool) or duration <= 0:
                errors.append("education_programs.json item {index}: duration_years must be a positive number or null")

        tuition_amount = row.get("tuition_amount_mad")
        if tuition_amount is not None:
            if (
                not isinstance(tuition_amount, (int, float))
                or isinstance(tuition_amount, bool)
                or tuition_amount < 0
            ):
                errors.append(
                    f"education_programs.json item {index}: tuition_amount_mad must be a non-negative number or null"
                )

        errors += validate_string_list(row, "language", index, "education_programs.json")
        errors += validate_string_list(row, "admission", index, "education_programs.json", allow_empty=True)

    return errors


def validate_research_structures(rows: list[dict[str, Any]]) -> list[str]:
    errors = require_fields(RESEARCH_STRUCTURES, rows, RESEARCH_REQUIRED)
    errors += validate_common(RESEARCH_STRUCTURES, rows, "structure_id")
    return errors


def main() -> int:
    try:
        programs = read_json(PROGRAMS)
        structures = read_json(RESEARCH_STRUCTURES)
    except ValueError as error:
        print(error)
        return 1

    errors = validate_programs(programs) + validate_research_structures(structures)

    if errors:
        print("Catalog validation failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"OK: {len(programs)} programs checked.")
    print(f"OK: {len(structures)} research structures checked.")
    print("Catalog validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())