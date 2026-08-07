#!/usr/bin/env python3
"""Build badge/stat files from the MADRASA catalog."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"
API = ROOT / "api"


def read_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_or_check(path: Path, payload: dict, check: bool) -> bool:
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if check:
        if not path.exists():
            print(f"Missing generated file: {path.relative_to(ROOT)}")
            return False
        current = path.read_text(encoding="utf-8")
        if current != text:
            print(f"Outdated generated file: {path.relative_to(ROOT)}")
            return False
        return True

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return True


def badge(label: str, message: str, color: str = "980100") -> dict:
    return {
        "schemaVersion": 1,
        "label": label,
        "message": message,
        "color": color,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if generated badge/stat files are not up to date")
    args = parser.parse_args()

    programs = read_json(CATALOG / "education_programs.json")
    structures = read_json(CATALOG / "research_structures.json")

    all_items = programs + structures
    last_checked_values = [item.get("last_checked") for item in all_items if item.get("last_checked")]
    last_checked = max(last_checked_values) if last_checked_values else "unknown"

    stats = {
        "programs": len(programs),
        "research_structures": len(structures),
        "last_checked": last_checked,
    }

    outputs = {
        API / "stats.json": stats,
        API / "programs-badge.json": badge("Programs", str(stats["programs"])),
        API / "research-structures-badge.json": badge("Research structures", str(stats["research_structures"])),
        API / "last-checked-badge.json": badge("Last checked", stats["last_checked"], "success"),
    }

    ok = True
    for path, payload in outputs.items():
        ok = write_or_check(path, payload, args.check) and ok

    if not ok:
        print("Run: python scripts/build_stats.py")
        return 1

    if args.check:
        print("Generated badge/stat files are up to date.")
    else:
        print("Generated badge/stat files in api/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
