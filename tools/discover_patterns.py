#!/usr/bin/env python3
"""
Pattern Discovery Tool

Analyzes UNKNOWN pages to discover new document types and patterns.
"""
import fitz
import os
import sys
import re
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores

WC_DIR = "raw-material/warren-commission"

def analyze_unknown_pages(volume_nums=[16, 17, 18, 19, 20, 21], samples_per_vol=10):
    """Analyze UNKNOWN pages to discover patterns."""
    
    all_texts = []
    pattern_counts = Counter()
    
    for vol_num in volume_nums:
        pdf_path = f"{WC_DIR}/GPO-WARRENCOMMISSIONHEARINGS-{vol_num}.pdf"
        if not os.path.exists(pdf_path):
            continue
            
        print(f"\n{'='*60}")
        print(f"VOLUME {vol_num}")
        print(f"{'='*60}")
        
        pdf = fitz.open(pdf_path)
        total_pages = len(pdf)
        step = max(1, total_pages // samples_per_vol)
        
        for i in range(0, total_pages, step)[:samples_per_vol]:
            page_num = i + 1
            text = pdf[i].get_text()
            
            result = classify_document(text)
            
            if result.doc_type.value == "UNKNOWN" and len(text) > 100:
                print(f"\n--- Page {page_num} ({len(text)} chars) ---")
                
                # Look for common patterns
                patterns_found = []
                
                # Check for affidavit patterns
                if re.search(r"AFFIDAVIT|sworn|subscribed|notary", text, re.I):
                    patterns_found.append("AFFIDAVIT")
                    pattern_counts["AFFIDAVIT"] += 1
                
                # Check for deposition patterns  
                if re.search(r"DEPOSITION|deponent|testimony.*taken", text, re.I):
                    patterns_found.append("DEPOSITION")
                    pattern_counts["DEPOSITION"] += 1
                
                # Check for report patterns
                if re.search(r"REPORT|submitted|findings|investigation", text, re.I):
                    patterns_found.append("REPORT")
                    pattern_counts["REPORT"] += 1
                
                # Check for letter patterns
                if re.search(r"Dear\s+(?:Mr|Mrs|Sir)|Sincerely|Respectfully", text, re.I):
                    patterns_found.append("LETTER")
                    pattern_counts["LETTER"] += 1
                
                # Check for transcript patterns
                if re.search(r"Q\.\s|A\.\s|EXAMINATION|cross-exam", text, re.I):
                    patterns_found.append("TRANSCRIPT")
                    pattern_counts["TRANSCRIPT"] += 1
                
                # Check for list/roster patterns
                if re.search(r"LIST|ROSTER|SCHEDULE|INDEX", text, re.I):
                    patterns_found.append("LIST")
                    pattern_counts["LIST"] += 1
                
                # Check for statement patterns
                if re.search(r"STATEMENT|states that|declare", text, re.I):
                    patterns_found.append("STATEMENT")
                    pattern_counts["STATEMENT"] += 1
                
                # Check for medical/autopsy patterns
                if re.search(r"AUTOPSY|medical|examination|wound|injury|death", text, re.I):
                    patterns_found.append("MEDICAL")
                    pattern_counts["MEDICAL"] += 1
                
                # Check for police report patterns
                if re.search(r"POLICE|officer|patrol|arrest|incident", text, re.I):
                    patterns_found.append("POLICE")
                    pattern_counts["POLICE"] += 1
                    
                # Check for FBI patterns we might be missing
                if re.search(r"Bureau|Special Agent|SA\s+[A-Z]|FBI", text, re.I):
                    patterns_found.append("FBI_RELATED")
                    pattern_counts["FBI_RELATED"] += 1
                
                if patterns_found:
                    print(f"  Patterns: {patterns_found}")
                else:
                    print(f"  Patterns: [none detected]")
                
                preview = text[:300].replace('\n', ' ')
                print(f"  Preview: {preview[:200]}...")
                
                all_texts.append({
                    "vol": vol_num,
                    "page": page_num,
                    "text": text,
                    "patterns": patterns_found
                })
        
        pdf.close()
    
    print("\n" + "="*60)
    print("PATTERN SUMMARY")
    print("="*60)
    for pattern, count in pattern_counts.most_common():
        print(f"  {pattern:20s}: {count}")
    
    return all_texts, pattern_counts

if __name__ == "__main__":
    texts, counts = analyze_unknown_pages()
    
    print("\n" + "="*60)
    print("RECOMMENDATIONS")
    print("="*60)
    for pattern, count in counts.most_common(5):
        if count >= 3:
            print(f"  Consider adding {pattern} document type ({count} occurrences)")
