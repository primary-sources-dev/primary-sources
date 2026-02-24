#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.join(os.getcwd(), 'tools/ocr-gui'))
from document_classifier import classify_document, get_all_scores

test_text = """
DALLAS POLICE DEPARTMENT
SUPPLEMENTARY INVESTIGATION REPORT
SERIAL NO. 2341
OFFENSE: HOMICIDE
Reporting Officer: Will Fritz
Details: The suspect was seen leaving the scene...
"""

result = classify_document(test_text)
print(f"Detected: {result.doc_type.value} ({result.confidence*100:.1f}%)")
print(f"Matches: {result.matched_patterns}")
scores = get_all_scores(test_text)
print(f"All scores: {scores}")
