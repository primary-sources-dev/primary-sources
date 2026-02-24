#!/usr/bin/env python3
"""
Church Committee Testing

Tests the classifier on Church Committee reports.
"""
import fitz
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores, DocType
from zone_extractor import extract_document

CHURCH_DIR = "raw-material/church-committee"
OUTPUT_DIR = "tools/output/church_committee"

def get_church_files():
    """Get all Church Committee PDF files."""
    files = []
    for f in sorted(os.listdir(CHURCH_DIR)):
        if f.endswith('.pdf'):
            files.append(os.path.join(CHURCH_DIR, f))
    return files

def test_file(pdf_path: str, sample_size: int = 20):
    """Test classifier on a single PDF."""
    filename = os.path.basename(pdf_path)
    
    pdf = fitz.open(pdf_path)
    total_pages = len(pdf)
    
    step = max(1, total_pages // sample_size)
    results = []
    
    for i in range(0, total_pages, step)[:sample_size]:
        page_num = i + 1
        text = pdf[i].get_text()
        
        result = classify_document(text)
        extraction = extract_document(text)
        
        results.append({
            "page": page_num,
            "doc_type": result.doc_type.value,
            "confidence": result.confidence,
            "label": result.confidence_label,
            "fields_extracted": len(extraction.fields),
        })
        
        print(f"  Page {page_num:>5}: {result.doc_type.value:15s} ({result.confidence*100:3.0f}%) - {len(extraction.fields)} fields")
    
    pdf.close()
    return results

def main():
    print("=" * 70)
    print("CHURCH COMMITTEE - CLASSIFICATION TEST")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    files = get_church_files()
    print(f"Found {len(files)} PDFs\n")
    
    all_results = {}
    type_counts = {}
    
    for pdf_path in files:
        filename = os.path.basename(pdf_path)
        print("=" * 60)
        print(f"FILE: {filename}")
        print("=" * 60)
        
        results = test_file(pdf_path)
        all_results[filename] = results
        
        for r in results:
            doc_type = r["doc_type"]
            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
    
    # Summary
    print("\n" + "=" * 70)
    print("OVERALL SUMMARY")
    print("=" * 70)
    
    total_pages = sum(len(r) for r in all_results.values())
    print(f"Total files: {len(files)}")
    print(f"Total sample pages: {total_pages}")
    print("\nDocument types detected:")
    
    for doc_type, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        pct = count / total_pages * 100
        print(f"  {doc_type:20s}: {count:4d} ({pct:5.1f}%)")
    
    # Save results
    output_file = os.path.join(OUTPUT_DIR, "church_committee_test.json")
    with open(output_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "files": all_results,
            "summary": type_counts,
        }, f, indent=2)
    
    print(f"\nResults saved to: {output_file}")
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
