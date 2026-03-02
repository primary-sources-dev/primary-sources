#!/usr/bin/env python3
"""
convert_workbench_feedback_v2.py

Convert Workbench feedback export(s) in workbench-feedback-v2 format into the
legacy classifier training format expected by tools/train_classifier.py:

{
  "entries": [...],
  "summary": { "total": N, "correct": X, "incorrect": Y, "skipped": Z, "pending": P }
}

Usage:
  python tools/convert_workbench_feedback_v2.py \
      --input "C:/Users/willh/Downloads/classifier_feedback_*_v2.json" \
      --output data/classifier-feedback.json
"""

from __future__ import annotations

import argparse
import glob
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

LEGACY_TO_DISPOSITION = {
    "correct": "verified_approved",
    "incorrect": "verified_not_approved",
    "skipped": "needs_followup",
    "pending": "pending",
}

CLASS_VALUES = {
    "REPORT", "CABLE", "MEMO", "CORRESPONDENCE", "EXHIBIT",
    "TESTIMONY", "DEPOSITION", "AFFIDAVIT", "TRAVEL", "OTHER",
}


def normalize_status(status: str) -> str:
    s = str(status or "").strip().lower()
    if s in LEGACY_TO_DISPOSITION:
        return s
    # Allow canonical disposition values as input
    disposition_to_status = {
        "verified_approved": "correct",
        "verified_not_approved": "incorrect",
        "needs_followup": "skipped",
        "pending": "pending",
    }
    return disposition_to_status.get(s, "pending")


def map_doc_type_to_class(doc_type: str) -> str:
    value = str(doc_type or "").strip().upper()
    if not value:
        return "OTHER"
    if "AFFIDAVIT" in value:
        return "AFFIDAVIT"
    if "DEPOSITION" in value:
        return "DEPOSITION"
    if "TESTIMONY" in value:
        return "TESTIMONY"
    if "EXHIBIT" in value:
        return "EXHIBIT"
    if any(t in value for t in ("TRAVEL", "PASSPORT", "VISA")):
        return "TRAVEL"
    if any(t in value for t in ("CABLE", "TELETYPE", "AIRTEL")):
        return "CABLE"
    if "MEMO" in value:
        return "MEMO"
    if "LETTER" in value or "CORRESPONDENCE" in value:
        return "CORRESPONDENCE"
    if any(t in value for t in ("REPORT", "302", "STATEMENT", "RIF")):
        return "REPORT"
    return "OTHER"


def normalize_selected_class(selected_class: str, predicted_type: str) -> str:
    value = str(selected_class or "").strip().upper()
    if value in CLASS_VALUES:
        return value
    if value:
        return map_doc_type_to_class(value)
    return map_doc_type_to_class(predicted_type)


def convert_page(source: str, page_obj: Dict[str, Any], exported_at: str) -> Dict[str, Any]:
    reviewer = page_obj.get("reviewer") or {}
    prediction = page_obj.get("prediction") or {}
    predicted_type = prediction.get("type")
    selected_class = normalize_selected_class(reviewer.get("selected_class"), predicted_type)
    status = normalize_status(page_obj.get("review_status") or page_obj.get("status"))
    disposition = page_obj.get("disposition") or LEGACY_TO_DISPOSITION.get(status, "pending")

    entry = {
        "page": page_obj.get("page"),
        "source": source,
        "status": status,
        "disposition": disposition,
        "reason_code": reviewer.get("reason_code") or reviewer.get("note_type"),
        "reason_detail": reviewer.get("reason_detail"),
        "predictedType": predicted_type,
        "selectedType": selected_class,
        "selectedAgency": reviewer.get("selected_agency"),
        "selectedClass": selected_class,
        "selectedFormat": reviewer.get("selected_format"),
        "selectedContent": reviewer.get("selected_content") or [],
        "newTypeFlag": bool(reviewer.get("new_type_flag")),
        "noteType": reviewer.get("note_type"),
        "notes": reviewer.get("notes"),
        "textSample": "",
        "timestamp": exported_at or datetime.utcnow().isoformat(),
    }
    return entry


def build_summary(entries: List[Dict[str, Any]]) -> Dict[str, int]:
    summary = {"total": len(entries), "correct": 0, "incorrect": 0, "skipped": 0, "pending": 0}
    for entry in entries:
        status = entry.get("status")
        if status in summary:
            summary[status] += 1
    return summary


def load_v2_file(path: Path) -> Tuple[str, List[Dict[str, Any]], str]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    source = data.get("source") or path.stem
    exported_at = data.get("exportedAt") or datetime.utcnow().isoformat()
    pages = data.get("pages") or []
    return source, pages, exported_at


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert Workbench feedback v2 export(s) to legacy entries format.")
    parser.add_argument("--input", required=True, help="Input file path or glob pattern for _v2 export JSON files.")
    parser.add_argument("--output", default="data/classifier-feedback.json", help="Output legacy feedback JSON path.")
    args = parser.parse_args()

    input_paths = [Path(p) for p in glob.glob(args.input)]
    if not input_paths:
        raise SystemExit(f"No files matched input pattern: {args.input}")

    # De-duplicate by source+page (latest file wins by sorted filename order)
    merged: Dict[Tuple[str, Any], Dict[str, Any]] = {}
    for p in sorted(input_paths):
        source, pages, exported_at = load_v2_file(p)
        for page in pages:
            key = (source, page.get("page"))
            merged[key] = convert_page(source, page, exported_at)

    entries = list(merged.values())
    entries.sort(key=lambda e: (str(e.get("source") or ""), int(e.get("page") or 0)))
    output = {"entries": entries, "summary": build_summary(entries)}

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Converted {len(input_paths)} file(s) -> {out_path} ({len(entries)} merged entries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
