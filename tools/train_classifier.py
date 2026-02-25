"""
train_classifier.py — Learn from Human Feedback

Reads classification feedback from data/classifier-feedback.json and:
1. Analyzes correction patterns (what types are commonly misclassified)
2. Extracts text patterns from corrections
3. Suggests new fingerprints to add to document_classifier.py
4. Can auto-apply simple pattern additions

Usage:
    python tools/train_classifier.py              # Show analysis
    python tools/train_classifier.py --suggest    # Suggest new patterns
    python tools/train_classifier.py --apply      # Auto-apply suggestions (careful!)
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
FEEDBACK_FILE = PROJECT_ROOT / "data" / "classifier-feedback.json"
CLASSIFIER_FILE = PROJECT_ROOT / "tools" / "ocr-gui" / "document_classifier.py"
SUGGESTIONS_FILE = PROJECT_ROOT / "data" / "classifier-suggestions.json"


def load_feedback() -> dict:
    """Load feedback from JSON file."""
    if not FEEDBACK_FILE.exists():
        print(f"No feedback file found at: {FEEDBACK_FILE}")
        return {"entries": [], "summary": {}}
    
    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def analyze_corrections(feedback: dict) -> dict:
    """Analyze correction patterns from feedback."""
    entries = feedback.get("entries", [])
    
    # Group by predicted -> selected
    corrections = defaultdict(list)
    confirmations = defaultdict(int)
    
    for entry in entries:
        predicted = entry.get("predictedType", "UNKNOWN")
        selected = entry.get("selectedType", "UNKNOWN")
        status = entry.get("status", "")
        
        if status == "correct":
            confirmations[predicted] += 1
        elif status == "incorrect":
            corrections[(predicted, selected)].append(entry)
    
    return {
        "corrections": dict(corrections),
        "confirmations": dict(confirmations),
        "total_entries": len(entries),
        "total_correct": sum(confirmations.values()),
        "total_incorrect": sum(len(v) for v in corrections.values()),
    }


def extract_common_phrases(text_samples: list[str], min_length: int = 10) -> list[tuple[str, int]]:
    """
    Extract common phrases from text samples that could become fingerprints.
    
    Returns list of (phrase, count) sorted by frequency.
    """
    # Tokenize into phrases (sequences of 2-5 words)
    phrase_counts = defaultdict(int)
    
    for text in text_samples:
        if not text:
            continue
        
        # Clean text
        text = re.sub(r'\s+', ' ', text).strip()
        words = text.split()
        
        # Extract n-grams (2-5 words)
        for n in range(2, 6):
            for i in range(len(words) - n + 1):
                phrase = ' '.join(words[i:i+n])
                # Skip if too short or has weird characters
                if len(phrase) >= min_length and re.match(r'^[A-Za-z0-9\s\.\-,]+$', phrase):
                    phrase_counts[phrase.upper()] += 1
    
    # Sort by frequency
    sorted_phrases = sorted(phrase_counts.items(), key=lambda x: -x[1])
    return sorted_phrases[:20]  # Top 20


def suggest_patterns(analysis: dict) -> list[dict]:
    """
    Generate pattern suggestions based on correction analysis.
    
    Returns list of suggestions with format:
    {
        "doc_type": "FBI_302",
        "pattern": "FEDERAL BUREAU OF INVESTIGATION",
        "weight": 30,
        "reason": "Found in 5 samples misclassified as WC_TESTIMONY",
        "confidence": "HIGH"
    }
    """
    suggestions = []
    
    for (predicted, actual), entries in analysis["corrections"].items():
        if len(entries) < 2:  # Need at least 2 samples
            continue
        
        # Extract text samples
        text_samples = [e.get("textSample", "") for e in entries]
        
        # Find common phrases
        common_phrases = extract_common_phrases(text_samples)
        
        for phrase, count in common_phrases[:5]:  # Top 5 per correction type
            if count < 2:
                continue
            
            # Determine confidence based on count
            if count >= 4:
                confidence = "HIGH"
                weight = 30
            elif count >= 2:
                confidence = "MEDIUM"
                weight = 20
            else:
                confidence = "LOW"
                weight = 15
            
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


def print_analysis(analysis: dict):
    """Print human-readable analysis."""
    print("=" * 60)
    print("CLASSIFIER FEEDBACK ANALYSIS")
    print("=" * 60)
    print(f"\nTotal entries: {analysis['total_entries']}")
    print(f"  Correct:   {analysis['total_correct']} ({analysis['total_correct']/max(1,analysis['total_entries']):.0%})")
    print(f"  Incorrect: {analysis['total_incorrect']} ({analysis['total_incorrect']/max(1,analysis['total_entries']):.0%})")
    
    if analysis["confirmations"]:
        print("\n--- Confirmed Types (classifier got right) ---")
        for doc_type, count in sorted(analysis["confirmations"].items(), key=lambda x: -x[1]):
            print(f"  {doc_type}: {count} confirmations")
    
    if analysis["corrections"]:
        print("\n--- Corrections (classifier got wrong) ---")
        for (predicted, actual), entries in sorted(analysis["corrections"].items(), key=lambda x: -len(x[1])):
            print(f"  {predicted} -> {actual}: {len(entries)} corrections")
            # Show sample pages
            pages = [str(e.get("page", "?")) for e in entries[:5]]
            print(f"    Sample pages: {', '.join(pages)}")


def print_suggestions(suggestions: list[dict]):
    """Print pattern suggestions."""
    if not suggestions:
        print("\nNo pattern suggestions (need more correction data).")
        return
    
    print("\n" + "=" * 60)
    print("SUGGESTED NEW PATTERNS")
    print("=" * 60)
    
    # Group by doc_type
    by_type = defaultdict(list)
    for s in suggestions:
        by_type[s["doc_type"]].append(s)
    
    for doc_type, type_suggestions in sorted(by_type.items()):
        print(f"\n--- {doc_type} ---")
        for s in type_suggestions:
            print(f'  (r"{s["pattern"]}", {s["weight"]}),  # {s["reason"]}')


def save_suggestions(suggestions: list[dict]):
    """Save suggestions to JSON file for later review."""
    SUGGESTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    output = {
        "generated_at": datetime.now().isoformat(),
        "suggestions": suggestions,
    }
    
    with open(SUGGESTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSuggestions saved to: {SUGGESTIONS_FILE}")


def main():
    args = sys.argv[1:]
    
    # Load feedback
    feedback = load_feedback()
    if not feedback.get("entries"):
        print("No feedback entries found. Use the classifier review tool to provide feedback.")
        return
    
    # Analyze
    analysis = analyze_corrections(feedback)
    print_analysis(analysis)
    
    # Generate suggestions
    if "--suggest" in args or "--apply" in args:
        suggestions = suggest_patterns(analysis)
        print_suggestions(suggestions)
        save_suggestions(suggestions)
    
    # Auto-apply (not implemented yet - would modify classifier file)
    if "--apply" in args:
        print("\n[!] Auto-apply not yet implemented. Review suggestions and add manually.")
        print(f"    Edit: {CLASSIFIER_FILE}")


if __name__ == "__main__":
    main()
