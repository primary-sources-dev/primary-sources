#!/usr/bin/env python3
"""
Yates Documents Testing

Tests the classifier on Ralph Leon Yates documents.
"""
import fitz
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores, DocType
from zone_extractor import extract_document

PDF_PATH = "raw-material/yates/yates_searchable.pdf"
OUTPUT_DIR = "tools/output/yates"

def main():
    print("=" * 70)
    print("YATES DOCUMENTS - CLASSIFICATION TEST")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    pdf = fitz.open(PDF_PATH)
    total_pages = len(pdf)
    print(f"Total pages: {total_pages}\n")
    
    sample_size = 30
    step = max(1, total_pages // sample_size)
    results = []
    type_counts = {}
    
    for i in range(0, total_pages, step)[:sample_size]:
        page_num = i + 1
        text = pdf[i].get_text()
        
        result = classify_document(text)
        extraction = extract_document(text)
        
        results.append({
            "page": page_num,
            "doc_type": result.doc_type.value,
            "confidence": result.confidence,
            "fields_extracted": len(extraction.fields),
        })
        
        type_counts[result.doc_type.value] = type_counts.get(result.doc_type.value, 0) + 1
        
        print(f"  Page {page_num:>4}: {result.doc_type.value:17s} ({result.confidence*100:3.0f}%) - {len(extraction.fields)} fields")
    
    pdf.close()
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Sample pages: {len(results)}")
    print("\nDocument types detected:")
    
    for doc_type, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        pct = count / len(results) * 100
        print(f"  {doc_type:20s}: {count:4d} ({pct:5.1f}%)")
    
    # Save results
    output_file = os.path.join(OUTPUT_DIR, "yates_test.json")
    with open(output_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "results": results,
            "summary": type_counts,
        }, f, indent=2)
    
    print(f"\nResults saved to: {output_file}")
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
