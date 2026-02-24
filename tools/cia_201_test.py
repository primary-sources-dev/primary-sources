#!/usr/bin/env python3
"""
CIA 201 Documents Test
Tests the classifier for CIA 201 Personality File indicators.
"""
import fitz
import os
import sys
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, DocType

PDF_PATH = "raw-material/hsca/HSCA-Lopez-Report.pdf"

if not os.path.exists(PDF_PATH):
    print(f"File not found: {PDF_PATH}")
    sys.exit(1)

pdf = fitz.open(PDF_PATH)
matches = []

print(f"Scanning {PDF_PATH} for CIA 201 indicators...")

# Sample a larger set of pages since Lopez report is long
for i in range(100, 300):
    text = pdf[i].get_text()
    
    # Check for raw patterns first
    if re.search(r"201-\d{6,8}", text):
        result = classify_document(text)
        matches.append({
            "page": i + 1,
            "detected": result.doc_type.value,
            "confidence": result.confidence,
            "matched": result.matched_patterns
        })
        print(f"  Page {i+1}: {result.doc_type.value} ({result.confidence*100:.1f}%) - {result.matched_patterns[:2]}")

pdf.close()

print(f"\nFound {len(matches)} pages with 201 indicators.")
