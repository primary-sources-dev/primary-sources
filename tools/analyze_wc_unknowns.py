#!/usr/bin/env python3
"""
Analyze UNKNOWN pages in Warren Commission to find missing document types.
"""
import fitz
import os
import sys
import re
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores

WC_DIR = "raw-material/warren-commission"

# Sample from high-UNKNOWN volumes (exhibit volumes 16-26)
VOLUMES_TO_CHECK = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]

content_types = Counter()
text_lengths = []

for vol_num in VOLUMES_TO_CHECK:
    pdf_path = f"{WC_DIR}/GPO-WARRENCOMMISSIONHEARINGS-{vol_num}.pdf"
    if not os.path.exists(pdf_path):
        continue
    
    pdf = fitz.open(pdf_path)
    total_pages = len(pdf)
    step = max(1, total_pages // 15)
    
    for i in range(0, total_pages, step)[:15]:
        text = pdf[i].get_text()
        result = classify_document(text)
        
        if result.doc_type.value == "UNKNOWN":
            text_lengths.append(len(text))
            
            # Categorize by content
            if len(text) < 50:
                content_types["IMAGE_ONLY"] += 1
            elif len(text) < 200:
                content_types["MINIMAL_TEXT"] += 1
            elif re.search(r"COMMISSION\s+EXHIBIT", text, re.I):
                content_types["EXHIBIT_LABEL"] += 1
            elif re.search(r"(?:photograph|photo|picture|image)", text, re.I):
                content_types["PHOTO_CAPTION"] += 1
            elif re.search(r"(?:map|diagram|chart|table|figure)", text, re.I):
                content_types["VISUAL_ELEMENT"] += 1
            elif re.search(r"(?:index|contents|list of)", text, re.I):
                content_types["INDEX/TOC"] += 1
            elif re.search(r"(?:receipt|invoice|ticket|bill)", text, re.I):
                content_types["RECEIPT/FORM"] += 1
            elif re.search(r"(?:letter|dear|sincerely)", text, re.I):
                content_types["LETTER"] += 1
            elif re.search(r"(?:news|newspaper|article|press)", text, re.I):
                content_types["NEWS_CLIPPING"] += 1
            elif re.search(r"(?:telegram|cable|message)", text, re.I):
                content_types["TELEGRAM"] += 1
            else:
                content_types["OTHER"] += 1
                # Print sample for analysis
                preview = text[:200].replace('\n', ' ')
                print(f"Vol {vol_num}, Page {i+1}: {preview[:150]}...")
    
    pdf.close()

print("\n" + "="*60)
print("UNKNOWN PAGE CONTENT ANALYSIS")
print("="*60)
print(f"Total UNKNOWN pages sampled: {sum(content_types.values())}")
print(f"Average text length: {sum(text_lengths)/len(text_lengths):.0f} chars" if text_lengths else "N/A")
print("\nContent breakdown:")
for content_type, count in content_types.most_common():
    pct = count / sum(content_types.values()) * 100
    print(f"  {content_type:20s}: {count:4d} ({pct:5.1f}%)")

print("\nRecommendations:")
if content_types["IMAGE_ONLY"] + content_types["MINIMAL_TEXT"] > sum(content_types.values()) * 0.3:
    print("  - Many pages are image-only/minimal text (expected for exhibit volumes)")
if content_types["EXHIBIT_LABEL"] > 5:
    print("  - Consider improving WC_EXHIBIT patterns")
if content_types["LETTER"] > 3:
    print("  - Consider adding LETTER document type")
if content_types["NEWS_CLIPPING"] > 3:
    print("  - Consider adding NEWS_CLIPPING document type")
if content_types["TELEGRAM"] > 3:
    print("  - Consider adding TELEGRAM document type")
