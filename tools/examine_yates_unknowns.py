#!/usr/bin/env python3
"""Examine UNKNOWN pages in Yates documents."""
import fitz
import os
import sys
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores

PDF_PATH = "raw-material/yates/yates_searchable.pdf"
UNKNOWN_PAGES = [2, 5, 7, 9, 11, 12, 19, 22, 23, 26, 28, 29]

pdf = fitz.open(PDF_PATH)

for page_num in UNKNOWN_PAGES:
    text = pdf[page_num - 1].get_text()
    
    print(f"\n{'='*60}")
    print(f"PAGE {page_num} ({len(text)} chars)")
    print(f"{'='*60}")
    
    if len(text) < 50:
        print("[minimal text - likely image/scan]")
        continue
    
    preview = re.sub(r'[\x00-\x1F\x7F-\x9F]', ' ', text[:800]).replace('\n', ' ')
    print(f"Preview: {preview[:400]}...")
    
    # Check what patterns exist
    patterns = []
    if re.search(r"hospital|medical|psychiatric|ward", text, re.I):
        patterns.append("MEDICAL")
    if re.search(r"telephone|called|call|phone", text, re.I):
        patterns.append("PHONE")
    if re.search(r"interview|statement|advised|information", text, re.I):
        patterns.append("INTERVIEW")
    if re.search(r"letter|dear|sincerely", text, re.I):
        patterns.append("LETTER")
    if re.search(r"FBI|Bureau|Agent", text, re.I):
        patterns.append("FBI")
    if re.search(r"Dallas|Texas|November.*1963", text, re.I):
        patterns.append("DALLAS_RELATED")
        
    if patterns:
        print(f"Patterns found: {patterns}")
        
    scores = get_all_scores(text)
    top_scores = sorted(scores.items(), key=lambda x: -x[1])[:5]
    print(f"Top scores: {[(t.value if hasattr(t, 'value') else str(t), f'{s:.3f}') for t, s in top_scores]}")

pdf.close()
