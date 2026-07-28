#!/usr/bin/env python3
"""Build simple JSON stats for README badges and future interfaces."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"
API = ROOT / "api"

API.mkdir(exist_ok=True)

programs = json.loads((CATALOG / "programs.json").read_text(encoding="utf-8"))
structures = json.loads((CATALOG / "research_structures.json").read_text(encoding="utf-8"))

stats = {
    "programs": len(programs),
    "research_structures": len(structures),
    "last_checked": max(
        [item.get("last_checked", "") for item in programs + structures if item.get("last_checked")],
        default=str(date.today()),
    ),
}

(API / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

(API / "programs-badge.json").write_text(
    json.dumps(
        {
            "schemaVersion": 1,
            "label": "Programs",
            "message": str(stats["programs"]),
            "color": "980100",
        },
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

(API / "research-structures-badge.json").write_text(
    json.dumps(
        {
            "schemaVersion": 1,
            "label": "Research structures",
            "message": str(stats["research_structures"]),
            "color": "980100",
        },
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

(API / "last-checked-badge.json").write_text(
    json.dumps(
        {
            "schemaVersion": 1,
            "label": "Last checked",
            "message": stats["last_checked"],
            "color": "success",
        },
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

print("Stats generated in api/")