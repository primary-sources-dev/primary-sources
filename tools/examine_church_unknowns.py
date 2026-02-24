#!/usr/bin/env python3
"""Examine UNKNOWN pages in Church Committee to discover patterns."""
import fitz
import os
import sys
import re
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores

# Sample UNKNOWN pages from each file
samples = [
    ("raw-material/church-committee/church_book_I.pdf", [1, 100, 133, 232, 265, 529, 628]),
    ("raw-material/church-committee/church_book_IV.pdf", [28, 37, 46, 55, 64, 73, 91]),
]

pattern_counts = Counter()

for pdf_path, pages in samples:
    filename = os.path.basename(pdf_path)
    print(f"\n{'='*60}")
    print(f"FILE: {filename}")
    print(f"{'='*60}")
    
    pdf = fitz.open(pdf_path)
    
    for page_num in pages:
        text = pdf[page_num - 1].get_text()
        
        if len(text) < 50:
            print(f"\nPage {page_num}: [minimal text - likely image/scan]")
            continue
        
        print(f"\nPage {page_num} ({len(text)} chars):")
        preview = text[:500].replace('\n', ' ')[:300]
        print(f"  Preview: {preview}...")
        
        patterns_found = []
        
        # Check for Senate patterns
        if re.search(r"SENATE|COMMITTEE|CONGRESS", text, re.I):
            patterns_found.append("SENATE")
            pattern_counts["SENATE"] += 1
        
        # Check for Select Committee
        if re.search(r"SELECT\s+COMMITTEE|INTELLIGENCE\s+ACTIVITIES", text, re.I):
            patterns_found.append("SELECT_COMMITTEE")
            pattern_counts["SELECT_COMMITTEE"] += 1
        
        # Check for Church patterns
        if re.search(r"CHURCH|94th\s+Congress", text, re.I):
            patterns_found.append("CHURCH")
            pattern_counts["CHURCH"] += 1
        
        # Check for hearing transcript
        if re.search(r"HEARING|TESTIMONY|WITNESS", text, re.I):
            patterns_found.append("HEARING")
            pattern_counts["HEARING"] += 1
        
        # Check for staff report/study
        if re.search(r"STAFF\s+(?:REPORT|STUDY)|REPORT\s+TO|SUPPLEMENTARY", text, re.I):
            patterns_found.append("STAFF_REPORT")
            pattern_counts["STAFF_REPORT"] += 1
        
        # Check for exhibit/appendix
        if re.search(r"APPENDIX|EXHIBIT|ANNEX|ATTACHMENT", text, re.I):
            patterns_found.append("APPENDIX")
            pattern_counts["APPENDIX"] += 1
        
        # Check for TOC/Index
        if re.search(r"TABLE\s+OF\s+CONTENTS|INDEX|CONTENTS", text, re.I):
            patterns_found.append("TOC")
            pattern_counts["TOC"] += 1
        
        # Check for cover/title page
        if re.search(r"INTELLIGENCE\s+ACTIVITIES|UNITED\s+STATES\s+GOVERNMENT|BOOK\s+(?:I|II|III|IV|V)", text, re.I):
            patterns_found.append("COVER_PAGE")
            pattern_counts["COVER_PAGE"] += 1
        
        if patterns_found:
            print(f"  Patterns: {patterns_found}")
    
    pdf.close()

print("\n" + "="*60)
print("PATTERN SUMMARY")
print("="*60)
for pattern, count in pattern_counts.most_common():
    print(f"  {pattern:20s}: {count}")
