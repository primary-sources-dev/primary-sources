#!/usr/bin/env python3
"""
Summary of Document Classification Performance Across All Collections.
"""
import fitz
import os
import sys
from collections import Counter
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, DocType

COLLECTIONS = {
    "Warren Commission": {
        "path": "raw-material/warren-commission",
        "pattern": "GPO-WARRENCOMMISSIONHEARINGS-*.pdf",
        "sample_per_file": 10,
    },
    "HSCA Report": {
        "files": ["raw-material/hsca/HSCA-Final-Report.pdf"],
        "sample_per_file": 30,
    },
    "Church Committee": {
        "path": "raw-material/church-committee", 
        "pattern": "*.pdf",
        "sample_per_file": 15,
    },
    "Yates Documents": {
        "files": ["raw-material/yates/yates_searchable.pdf"],
        "sample_per_file": 30,
    },
}

def test_collection(name: str, config: dict):
    """Test a single collection."""
    type_counts = Counter()
    total_pages = 0
    
    # Get files
    files = config.get("files", [])
    if not files and "path" in config:
        path = config["path"]
        for f in sorted(os.listdir(path)):
            if f.endswith('.pdf'):
                files.append(os.path.join(path, f))
    
    sample_per_file = config.get("sample_per_file", 15)
    
    for pdf_path in files:
        if not os.path.exists(pdf_path):
            continue
            
        pdf = fitz.open(pdf_path)
        pages = len(pdf)
        step = max(1, pages // sample_per_file)
        
        for i in range(0, pages, step)[:sample_per_file]:
            text = pdf[i].get_text()
            result = classify_document(text)
            type_counts[result.doc_type.value] += 1
            total_pages += 1
        
        pdf.close()
    
    return type_counts, total_pages

def main():
    print("=" * 70)
    print("DOCUMENT CLASSIFIER - ALL COLLECTIONS SUMMARY")
    print("=" * 70)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Document Types Supported: {len(DocType)}")
    print()
    
    all_counts = Counter()
    total_all = 0
    
    for name, config in COLLECTIONS.items():
        print(f"\n{name}")
        print("-" * 40)
        
        counts, total = test_collection(name, config)
        all_counts.update(counts)
        total_all += total
        
        for doc_type, count in counts.most_common(5):
            pct = count / total * 100 if total > 0 else 0
            print(f"  {doc_type:20s}: {count:4d} ({pct:5.1f}%)")
        
        unknown_pct = counts.get("UNKNOWN", 0) / total * 100 if total > 0 else 0
        print(f"  UNKNOWN rate: {unknown_pct:.1f}%")
    
    # Overall summary
    print("\n" + "=" * 70)
    print("OVERALL SUMMARY")
    print("=" * 70)
    print(f"Total sample pages: {total_all}")
    print(f"\nDocument types detected (top 10):")
    
    for doc_type, count in all_counts.most_common(10):
        pct = count / total_all * 100
        print(f"  {doc_type:20s}: {count:4d} ({pct:5.1f}%)")
    
    unknown_total = all_counts.get("UNKNOWN", 0)
    known_total = total_all - unknown_total
    print(f"\nClassification rate: {known_total}/{total_all} ({known_total/total_all*100:.1f}%)")
    print(f"UNKNOWN rate: {unknown_total}/{total_all} ({unknown_total/total_all*100:.1f}%)")

if __name__ == "__main__":
    main()
