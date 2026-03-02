#!/usr/bin/env python3
"""Validate canonical web/html/assets/data JSON files against local JSON Schemas."""

from __future__ import annotations

import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    message=r".*RefResolver is deprecated.*",
)

try:
    from jsonschema import Draft202012Validator, RefResolver
except ImportError:
    print("ERROR: jsonschema is not installed. Run: python -m pip install jsonschema", file=sys.stderr)
    sys.exit(2)


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "web" / "html" / "assets" / "data"
SCHEMA_DIR = ROOT / "tools" / "schema" / "schemas" / "entities"

TARGETS = {
    "people.json": "people.schema.json",
    "events.json": "events.schema.json",
    "organizations.json": "organizations.schema.json",
    "places.json": "places.schema.json",
    "objects.json": "objects.schema.json",
    "sources.json": "sources.schema.json",
    "blog.json": "blog.schema.json",
}


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def format_path(error) -> str:
    if not error.path:
        return "$"
    return "$." + ".".join(str(p) for p in error.path)


def validate_target(data_file: str, schema_file: str) -> list[str]:
    data_path = DATA_DIR / data_file
    schema_path = SCHEMA_DIR / schema_file

    if not data_path.exists():
        return [f"{data_file}: file not found"]
    if not schema_path.exists():
        return [f"{data_file}: schema not found ({schema_file})"]

    data = load_json(data_path)
    schema = load_json(schema_path)

    resolver = RefResolver(base_uri=schema_path.as_uri(), referrer=schema)
    validator = Draft202012Validator(schema, resolver=resolver)
    errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))

    out = []
    for err in errors:
        out.append(f"{data_file} {format_path(err)}: {err.message}")
    return out


def main() -> int:
    all_errors: list[str] = []

    print("Validating canonical data files...")
    for data_file, schema_file in TARGETS.items():
        errs = validate_target(data_file, schema_file)
        if errs:
            all_errors.extend(errs)
        else:
            print(f"  OK  {data_file} <- {schema_file}")

    if all_errors:
        print("\nValidation failed:\n", file=sys.stderr)
        for line in all_errors:
            print(f"  - {line}", file=sys.stderr)
        return 1

    print("\nAll JSON files passed schema validation.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
