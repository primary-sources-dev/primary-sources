#!/usr/bin/env python3
"""Examine UNKNOWN pages to understand what patterns we're missing."""
import fitz
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores

# Check a few pages from high-UNKNOWN volumes
samples = [
    ("raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-19.pdf", [54, 107, 160]),
    ("raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-24.pdf", [63, 125, 187]),
    ("raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-8.pdf", [65, 97, 129]),
]

for pdf_path, pages in samples:
    print(f"\n{'='*60}")
    print(f"FILE: {os.path.basename(pdf_path)}")
    print(f"{'='*60}")
    
    pdf = fitz.open(pdf_path)
    
    for page_num in pages:
        text = pdf[page_num - 1].get_text()
        
        print(f"\n--- Page {page_num} ({len(text)} chars) ---")
        
        if len(text) < 50:
            print("  [MINIMAL TEXT - likely image/photo page]")
            print(f"  Content: {repr(text[:100])}")
        else:
            # Show preview
            preview = text[:400].replace('\n', ' ')
            print(f"  Preview: {preview[:200]}...")
            
            # Check scores
            scores = get_all_scores(text)
            non_zero = [(k, v) for k, v in scores.items() if v > 0]
            if non_zero:
                print(f"  Scores: {non_zero}")
            else:
                print("  Scores: [no matches]")
    
    pdf.close()
