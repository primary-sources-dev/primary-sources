"""
train_classifier.py — Learn from Human Feedback (v2)

Reads classification feedback from data/classifier-feedback.json and:
1. Analyzes correction patterns across all 4 tiers (Agency, Class, Format, Content)
2. Extracts text patterns from corrections for fingerprint suggestions
3. Reports pages flagged as needing new document types (newTypeFlag)
4. Surfaces reviewer notes tagged SCHEMA_UPDATE or NEW_PATTERN
5. Can auto-apply fingerprint pattern additions to document_classifier.py (with backup)
6. Can export SQL migration fragments for new vocab codes discovered through review

Usage:
    python tools/train_classifier.py                # Show full 4-tier analysis
    python tools/train_classifier.py --suggest      # Suggest new fingerprint patterns
    python tools/train_classifier.py --apply        # Auto-apply suggestions (creates backup)
    python tools/train_classifier.py --export       # Export SQL migration fragment
"""

import json
import re
import shutil
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
FEEDBACK_FILE = PROJECT_ROOT / "data" / "classifier-feedback.json"
CLASSIFIER_FILE = PROJECT_ROOT / "tools" / "ocr-gui" / "document_classifier.py"
SUGGESTIONS_FILE = PROJECT_ROOT / "data" / "classifier-suggestions.json"
EXPORT_DIR = PROJECT_ROOT / "data" / "exports"

# Known vocabulary (current DB seeds + migration 015 additions)
KNOWN_SOURCE_TYPES = {
    'REPORT', 'TESTIMONY', 'BOOK', 'FILM', 'PHOTO', 'MEMO', 'ARTICLE',
    'CABLE', 'CORRESPONDENCE', 'EXHIBIT', 'DEPOSITION', 'AFFIDAVIT', 'TRAVEL',
    'OTHER', 'FBI_302', 'FBI_REPORT', 'WC_TESTIMONY', 'WITNESS_STATEMENT',
}
KNOWN_DOC_FORMATS = {
    'CABLE', 'RIF', '201_FILE', 'AFFIDAVIT', 'DEPOSITION', 'EXHIBIT',
    'TESTIMONY', 'COVER_SHEET', 'INDEX_PAGE', 'TOC', 'GENERIC_TEMPLATE',
    'FD-302', 'AIRTEL', 'TELETYPE', 'MEMO', 'LETTER', 'ENVELOPE',
    'PASSPORT', 'VISA_FORM', 'OTHER', 'SEARCHABLE_PDF',
}
KNOWN_AGENCIES = {'FBI', 'CIA', 'DPD', 'WC', 'HSCA', 'NARA', 'SS', 'UNKNOWN'}
KNOWN_CONTENT_TYPES = {
    'WITNESS_INTERVIEW', 'FORENSIC_ANALYSIS', 'BALLISTICS', 'SURVEILLANCE',
    'INVESTIGATIVE_SUMM', 'AUTOPSY_REPORT', 'SECURITY_CLEARANCE',
    'POLYGRAPH_EXAM', 'TIPS_AND_LEADS', 'ADMINISTRATIVE',
    'CORRESPONDENCE', 'SEARCH_WARRANT', 'INTERVIEW',
}


def load_feedback() -> dict:
    """Load feedback from JSON file."""
    if not FEEDBACK_FILE.exists():
        print(f"No feedback file found at: {FEEDBACK_FILE}")
        return {"entries": [], "summary": {}}

    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# =========================================================================
# Analysis — all 4 tiers
# =========================================================================

def analyze_corrections(feedback: dict) -> dict:
    """Analyze correction patterns from feedback across all 4 tiers."""
    entries = feedback.get("entries", [])

    # Tier 2: Class / selectedType corrections (original logic)
    corrections = defaultdict(list)
    confirmations = defaultdict(int)

    # Tier 1: Agency distribution
    agency_counts = defaultdict(int)

    # Tier 3: Format distribution
    format_counts = defaultdict(int)

    # Tier 4: Content tag frequency
    content_counts = defaultdict(int)

    # Cross-tier: agency + class combinations
    agency_class_pairs = defaultdict(int)

    for entry in entries:
        predicted = entry.get("predictedType", "UNKNOWN")
        selected = entry.get("selectedType") or entry.get("selectedClass") or "UNKNOWN"
        status = entry.get("status", "")

        if status == "correct":
            confirmations[predicted] += 1
        elif status == "incorrect":
            corrections[(predicted, selected)].append(entry)

        # Tier 1: Agency
        agency = entry.get("selectedAgency")
        if agency:
            agency_counts[agency] += 1

        # Tier 3: Format
        fmt = entry.get("selectedFormat")
        if fmt:
            format_counts[fmt] += 1

        # Tier 4: Content tags
        content = entry.get("selectedContent", [])
        if isinstance(content, list):
            for tag in content:
                content_counts[tag] += 1

        # Cross-tier
        if agency and selected:
            agency_class_pairs[(agency, selected)] += 1

    return {
        "corrections": dict(corrections),
        "confirmations": dict(confirmations),
        "total_entries": len(entries),
        "total_correct": sum(confirmations.values()),
        "total_incorrect": sum(len(v) for v in corrections.values()),
        "agency_counts": dict(agency_counts),
        "format_counts": dict(format_counts),
        "content_counts": dict(content_counts),
        "agency_class_pairs": dict(agency_class_pairs),
    }


# =========================================================================
# Flagged items — newTypeFlag + reviewer notes
# =========================================================================

def extract_flagged_items(feedback: dict) -> dict:
    """Extract pages flagged as new types and actionable reviewer notes."""
    entries = feedback.get("entries", [])

    new_type_flags = []
    schema_update_notes = []
    new_pattern_notes = []
    other_notes = []

    for entry in entries:
        page = entry.get("page", "?")
        source = entry.get("source", "?")

        # newTypeFlag
        if entry.get("newTypeFlag"):
            new_type_flags.append({
                "page": page,
                "source": source,
                "predictedType": entry.get("predictedType"),
                "selectedClass": entry.get("selectedClass") or entry.get("selectedType"),
                "textSample": (entry.get("textSample") or "")[:200],
            })

        # Reviewer notes by preset type
        note_type = entry.get("noteType")
        notes_text = entry.get("notes")
        if note_type or notes_text:
            note_record = {
                "page": page,
                "source": source,
                "noteType": note_type,
                "notes": notes_text,
            }
            if note_type == "SCHEMA_UPDATE":
                schema_update_notes.append(note_record)
            elif note_type == "NEW_PATTERN":
                new_pattern_notes.append(note_record)
            elif note_type:
                other_notes.append(note_record)

    return {
        "new_type_flags": new_type_flags,
        "schema_update_notes": schema_update_notes,
        "new_pattern_notes": new_pattern_notes,
        "other_notes": other_notes,
    }


def discover_unknown_vocab(feedback: dict) -> dict:
    """Find vocabulary codes in feedback that aren't in known DB seeds."""
    entries = feedback.get("entries", [])

    unknown_classes = set()
    unknown_formats = set()
    unknown_agencies = set()
    unknown_content = set()

    for entry in entries:
        cls = entry.get("selectedClass") or entry.get("selectedType")
        if cls and cls not in KNOWN_SOURCE_TYPES:
            unknown_classes.add(cls)

        fmt = entry.get("selectedFormat")
        if fmt and fmt not in KNOWN_DOC_FORMATS:
            unknown_formats.add(fmt)

        agency = entry.get("selectedAgency")
        if agency and agency not in KNOWN_AGENCIES:
            unknown_agencies.add(agency)

        for tag in entry.get("selectedContent", []):
            if tag and tag not in KNOWN_CONTENT_TYPES:
                unknown_content.add(tag)

    return {
        "unknown_classes": sorted(unknown_classes),
        "unknown_formats": sorted(unknown_formats),
        "unknown_agencies": sorted(unknown_agencies),
        "unknown_content": sorted(unknown_content),
    }


# =========================================================================
# Pattern extraction (unchanged core logic)
# =========================================================================

def extract_common_phrases(text_samples: list, min_length: int = 10) -> list:
    """
    Extract common phrases from text samples that could become fingerprints.
    Returns list of (phrase, count) sorted by frequency.
    """
    phrase_counts = defaultdict(int)

    for text in text_samples:
        if not text:
            continue

        text = re.sub(r'\s+', ' ', text).strip()
        words = text.split()

        for n in range(2, 6):
            for i in range(len(words) - n + 1):
                phrase = ' '.join(words[i:i+n])
                if len(phrase) >= min_length and re.match(r'^[A-Za-z0-9\s\.\-,]+$', phrase):
                    phrase_counts[phrase.upper()] += 1

    sorted_phrases = sorted(phrase_counts.items(), key=lambda x: -x[1])
    return sorted_phrases[:20]


def suggest_patterns(analysis: dict) -> list:
    """
    Generate pattern suggestions based on correction analysis.
    Returns list of suggestion dicts.
    """
    suggestions = []

    for (predicted, actual), entries in analysis["corrections"].items():
        if len(entries) < 2:
            continue

        text_samples = [e.get("textSample", "") for e in entries]
        common_phrases = extract_common_phrases(text_samples)

        for phrase, count in common_phrases[:5]:
            if count < 2:
                continue

            if count >= 4:
                confidence, weight = "HIGH", 30
            elif count >= 2:
                confidence, weight = "MEDIUM", 20
            else:
                confidence, weight = "LOW", 15

            suggestions.append({
                "doc_type": actual,
                "pattern": phrase,
                "weight": weight,
                "reason": f"Found in {count}/{len(entries)} samples misclassified as {predicted}",
                "confidence": confidence,
                "misclassified_as": predicted,
                "sample_count": len(entries),
            })

    return suggestions


# =========================================================================
# --apply: write patterns into document_classifier.py
# =========================================================================

def apply_suggestions(suggestions: list) -> bool:
    """
    Apply HIGH-confidence suggestions to document_classifier.py.
    Creates a timestamped backup before modifying.
    Returns True if changes were written.
    """
    if not CLASSIFIER_FILE.exists():
        print(f"[!] Classifier file not found: {CLASSIFIER_FILE}")
        return False

    high_confidence = [s for s in suggestions if s["confidence"] == "HIGH"]
    if not high_confidence:
        print("\n[!] No HIGH-confidence suggestions to apply. Skipping.")
        return False

    # Read current classifier source
    source = CLASSIFIER_FILE.read_text(encoding="utf-8")

    # Create backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = CLASSIFIER_FILE.with_suffix(f".py.backup_{timestamp}")
    shutil.copy2(CLASSIFIER_FILE, backup_path)
    print(f"\n[+] Backup created: {backup_path}")

    # Group suggestions by doc_type
    by_type = defaultdict(list)
    for s in high_confidence:
        by_type[s["doc_type"]].append(s)

    applied_count = 0
    for doc_type, type_suggestions in by_type.items():
        # Find the FINGERPRINTS block for this doc_type
        # Look for pattern: DocType.TYPE_NAME: [
        enum_name = doc_type  # e.g. FBI_302
        marker = f"DocType.{enum_name}: ["

        if marker not in source:
            print(f"  [-] DocType.{enum_name} not found in FINGERPRINTS dict, skipping")
            continue

        # Find the closing bracket of this type's pattern list
        marker_pos = source.index(marker)
        # Walk forward to find the matching ]
        bracket_depth = 0
        insert_pos = None
        for i in range(marker_pos, len(source)):
            if source[i] == '[':
                bracket_depth += 1
            elif source[i] == ']':
                bracket_depth -= 1
                if bracket_depth == 0:
                    insert_pos = i
                    break

        if insert_pos is None:
            print(f"  [-] Could not find closing bracket for DocType.{enum_name}")
            continue

        # Build new pattern lines
        new_lines = []
        for s in type_suggestions:
            pattern = s["pattern"]
            weight = s["weight"]
            reason = s["reason"]
            # Check if pattern already exists
            if pattern in source:
                print(f"  [=] Pattern already exists: {pattern}")
                continue
            new_lines.append(
                f'        (r"{pattern}", {weight}),  # auto-added: {reason}'
            )
            applied_count += 1

        if new_lines:
            insertion = "\n" + "\n".join(new_lines) + "\n    "
            source = source[:insert_pos] + insertion + source[insert_pos:]

    if applied_count > 0:
        CLASSIFIER_FILE.write_text(source, encoding="utf-8")
        print(f"\n[+] Applied {applied_count} new pattern(s) to {CLASSIFIER_FILE}")
        print(f"    Backup at: {backup_path}")
        return True
    else:
        # Remove unnecessary backup
        backup_path.unlink()
        print("\n[=] No new patterns to apply (all already present or no matches).")
        return False


# =========================================================================
# --export: SQL migration fragment
# =========================================================================

def export_sql(unknown_vocab: dict):
    """Export SQL INSERT statements for unknown vocab codes found in feedback."""
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_path = EXPORT_DIR / f"vocab_fragment_{timestamp}.sql"

    lines = [
        f"-- Vocabulary codes discovered from classifier feedback",
        f"-- Generated: {datetime.now().isoformat()}",
        f"-- Review before applying to production",
        "",
    ]

    has_content = False

    if unknown_vocab["unknown_classes"]:
        has_content = True
        lines.append("-- New source types (v_source_type)")
        lines.append("INSERT INTO v_source_type (code, label) VALUES")
        vals = []
        for code in unknown_vocab["unknown_classes"]:
            vals.append(f"  ('{code}', 'TODO: add label')")
        lines.append(",\n".join(vals))
        lines.append("ON CONFLICT (code) DO NOTHING;\n")

    if unknown_vocab["unknown_formats"]:
        has_content = True
        lines.append("-- New document formats (v_doc_format)")
        lines.append("INSERT INTO v_doc_format (code, label) VALUES")
        vals = []
        for code in unknown_vocab["unknown_formats"]:
            vals.append(f"  ('{code}', 'TODO: add label')")
        lines.append(",\n".join(vals))
        lines.append("ON CONFLICT (code) DO NOTHING;\n")

    if unknown_vocab["unknown_agencies"]:
        has_content = True
        lines.append("-- New agencies (v_agency)")
        lines.append("INSERT INTO v_agency (code, label) VALUES")
        vals = []
        for code in unknown_vocab["unknown_agencies"]:
            vals.append(f"  ('{code}', 'TODO: add label')")
        lines.append(",\n".join(vals))
        lines.append("ON CONFLICT (code) DO NOTHING;\n")

    if unknown_vocab["unknown_content"]:
        has_content = True
        lines.append("-- New content types (v_content_type)")
        lines.append("INSERT INTO v_content_type (code, label) VALUES")
        vals = []
        for code in unknown_vocab["unknown_content"]:
            vals.append(f"  ('{code}', 'TODO: add label')")
        lines.append(",\n".join(vals))
        lines.append("ON CONFLICT (code) DO NOTHING;\n")

    if not has_content:
        print("\n[=] No unknown vocabulary codes found. Nothing to export.")
        return

    with open(export_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n[+] SQL fragment exported to: {export_path}")
    print("    Review and rename to supabase/migrations/0XX_*.sql before applying.")


# =========================================================================
# Printing
# =========================================================================

def print_analysis(analysis: dict):
    """Print human-readable analysis across all 4 tiers."""
    print("=" * 60)
    print("CLASSIFIER FEEDBACK ANALYSIS (4-TIER)")
    print("=" * 60)
    total = analysis['total_entries']
    print(f"\nTotal entries: {total}")
    print(f"  Correct:   {analysis['total_correct']} ({analysis['total_correct']/max(1,total):.0%})")
    print(f"  Incorrect: {analysis['total_incorrect']} ({analysis['total_incorrect']/max(1,total):.0%})")

    # Tier 1: Agency breakdown
    if analysis["agency_counts"]:
        print("\n--- Tier 1: Agency Distribution ---")
        for agency, count in sorted(analysis["agency_counts"].items(), key=lambda x: -x[1]):
            print(f"  {agency}: {count}")

    # Tier 2: Class confirmations/corrections
    if analysis["confirmations"]:
        print("\n--- Tier 2: Confirmed Types (classifier got right) ---")
        for doc_type, count in sorted(analysis["confirmations"].items(), key=lambda x: -x[1]):
            print(f"  {doc_type}: {count} confirmations")

    if analysis["corrections"]:
        print("\n--- Tier 2: Corrections (classifier got wrong) ---")
        for (predicted, actual), entries in sorted(analysis["corrections"].items(), key=lambda x: -len(x[1])):
            print(f"  {predicted} -> {actual}: {len(entries)} corrections")
            pages = [str(e.get("page", "?")) for e in entries[:5]]
            print(f"    Sample pages: {', '.join(pages)}")

    # Tier 3: Format breakdown
    if analysis["format_counts"]:
        print("\n--- Tier 3: Format Distribution ---")
        for fmt, count in sorted(analysis["format_counts"].items(), key=lambda x: -x[1]):
            print(f"  {fmt}: {count}")

    # Tier 4: Content tag breakdown
    if analysis["content_counts"]:
        print("\n--- Tier 4: Content Tag Frequency ---")
        for tag, count in sorted(analysis["content_counts"].items(), key=lambda x: -x[1]):
            print(f"  {tag}: {count}")

    # Cross-tier
    if analysis["agency_class_pairs"]:
        print("\n--- Cross-Tier: Agency x Class ---")
        for (agency, cls), count in sorted(analysis["agency_class_pairs"].items(), key=lambda x: -x[1]):
            print(f"  {agency} / {cls}: {count}")


def print_flagged_items(flagged: dict):
    """Print flagged items and actionable reviewer notes."""
    if flagged["new_type_flags"]:
        print("\n" + "=" * 60)
        print("FLAGGED: NEW DOCUMENT TYPES NEEDED")
        print("=" * 60)
        for item in flagged["new_type_flags"]:
            print(f"  Page {item['page']} ({item['source']})")
            print(f"    Predicted: {item['predictedType']}")
            print(f"    Reviewer selected: {item['selectedClass']}")
            if item['textSample']:
                print(f"    Text: {item['textSample'][:100]}...")

    if flagged["schema_update_notes"]:
        print("\n" + "=" * 60)
        print("ACTIONABLE: SCHEMA_UPDATE Notes")
        print("=" * 60)
        for note in flagged["schema_update_notes"]:
            print(f"  Page {note['page']} ({note['source']}): {note['notes']}")

    if flagged["new_pattern_notes"]:
        print("\n" + "=" * 60)
        print("ACTIONABLE: NEW_PATTERN Notes")
        print("=" * 60)
        for note in flagged["new_pattern_notes"]:
            print(f"  Page {note['page']} ({note['source']}): {note['notes']}")

    if flagged["other_notes"]:
        print("\n--- Other Reviewer Notes ---")
        for note in flagged["other_notes"]:
            label = note['noteType'] or 'FREETEXT'
            print(f"  [{label}] Page {note['page']} ({note['source']}): {note['notes']}")

    if not any(flagged.values()):
        print("\n[=] No flagged items or reviewer notes found.")


def print_unknown_vocab(unknown: dict):
    """Print vocabulary codes not in known DB seeds."""
    has_any = any(unknown.values())
    if not has_any:
        print("\n[=] All feedback vocabulary codes match known DB seeds.")
        return

    print("\n" + "=" * 60)
    print("UNKNOWN VOCABULARY (not in DB seeds)")
    print("=" * 60)

    if unknown["unknown_classes"]:
        print(f"\n  Source types: {', '.join(unknown['unknown_classes'])}")
    if unknown["unknown_formats"]:
        print(f"  Doc formats:  {', '.join(unknown['unknown_formats'])}")
    if unknown["unknown_agencies"]:
        print(f"  Agencies:     {', '.join(unknown['unknown_agencies'])}")
    if unknown["unknown_content"]:
        print(f"  Content tags: {', '.join(unknown['unknown_content'])}")

    print("\n  Run with --export to generate SQL migration fragment.")


def print_suggestions(suggestions: list):
    """Print pattern suggestions."""
    if not suggestions:
        print("\nNo pattern suggestions (need more correction data).")
        return

    print("\n" + "=" * 60)
    print("SUGGESTED NEW PATTERNS")
    print("=" * 60)

    by_type = defaultdict(list)
    for s in suggestions:
        by_type[s["doc_type"]].append(s)

    for doc_type, type_suggestions in sorted(by_type.items()):
        print(f"\n--- {doc_type} ---")
        for s in type_suggestions:
            marker = " [HIGH]" if s["confidence"] == "HIGH" else ""
            print(f'  (r"{s["pattern"]}", {s["weight"]}),  # {s["reason"]}{marker}')

    high_count = sum(1 for s in suggestions if s["confidence"] == "HIGH")
    if high_count:
        print(f"\n  {high_count} HIGH-confidence suggestion(s) eligible for --apply.")


def save_suggestions(suggestions: list):
    """Save suggestions to JSON file for later review."""
    SUGGESTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)

    output = {
        "generated_at": datetime.now().isoformat(),
        "suggestions": suggestions,
    }

    with open(SUGGESTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"\nSuggestions saved to: {SUGGESTIONS_FILE}")


# =========================================================================
# Main
# =========================================================================

def main():
    args = sys.argv[1:]

    # Load feedback
    feedback = load_feedback()
    if not feedback.get("entries"):
        print("No feedback entries found. Use the classifier review tool to provide feedback.")
        return

    # Always run: full 4-tier analysis
    analysis = analyze_corrections(feedback)
    print_analysis(analysis)

    # Always run: flagged items + reviewer notes
    flagged = extract_flagged_items(feedback)
    print_flagged_items(flagged)

    # Always run: unknown vocab check
    unknown = discover_unknown_vocab(feedback)
    print_unknown_vocab(unknown)

    # --suggest: generate pattern suggestions
    if "--suggest" in args or "--apply" in args:
        suggestions = suggest_patterns(analysis)
        print_suggestions(suggestions)
        save_suggestions(suggestions)

    # --apply: write patterns into classifier
    if "--apply" in args:
        suggestions = suggest_patterns(analysis)
        apply_suggestions(suggestions)

    # --export: SQL migration fragment
    if "--export" in args:
        export_sql(unknown)


if __name__ == "__main__":
    main()
