#!/usr/bin/env python3
"""
Full Pipeline Test - Warren Commission Volume 1

Tests the complete OCR → Classification → Extraction pipeline on sample pages.
Outputs results to tools/output/wc_vol1_test/
"""
import fitz
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores, DocType
from zone_extractor import extract_document

# Configuration
PDF_PATH = "raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-1.pdf"
OUTPUT_DIR = "tools/output/wc_vol1_test"
SAMPLE_PAGES = [1, 9, 17, 18, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]  # Key pages

def ensure_output_dir():
    """Create output directory if needed."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/pages", exist_ok=True)

def process_page(pdf, page_num: int) -> dict:
    """Process a single page through the full pipeline."""
    page = pdf[page_num - 1]  # 0-indexed
    text = page.get_text()
    
    # Classification
    classification = classify_document(text)
    
    # Extraction
    extraction = extract_document(text)
    
    return {
        "page": page_num,
        "char_count": len(text),
        "text_preview": text[:500].replace('\n', ' '),
        "classification": {
            "type": classification.doc_type.value,
            "confidence": round(classification.confidence, 3),
            "confidence_label": classification.confidence_label,
            "matched_patterns": classification.matched_patterns[:5],
        },
        "extraction": {
            "fields_found": len(extraction.fields),
            "field_names": list(extraction.fields.keys()),
            "fields": {
                k: {
                    "value": v.value[:100] if len(v.value) > 100 else v.value,
                    "zone": v.zone,
                    "confidence": round(v.confidence, 2)
                }
                for k, v in extraction.fields.items()
            }
        },
        "full_text": text  # For individual page files
    }

def main():
    print("=" * 70)
    print("WARREN COMMISSION VOLUME 1 - FULL PIPELINE TEST")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"PDF: {PDF_PATH}")
    print()
    
    ensure_output_dir()
    
    # Open PDF
    print("Opening PDF...")
    pdf = fitz.open(PDF_PATH)
    total_pages = len(pdf)
    print(f"Total pages: {total_pages}")
    print()
    
    # Filter sample pages to valid range
    pages_to_test = [p for p in SAMPLE_PAGES if p <= total_pages]
    print(f"Testing {len(pages_to_test)} sample pages: {pages_to_test}")
    print()
    
    results = []
    type_counts = {}
    
    for page_num in pages_to_test:
        print(f"Processing page {page_num}...", end=" ")
        result = process_page(pdf, page_num)
        
        # Save individual page text
        page_file = f"{OUTPUT_DIR}/pages/page_{page_num:04d}.txt"
        with open(page_file, 'w', encoding='utf-8') as f:
            f.write(result['full_text'])
        
        # Remove full text from summary (too large)
        del result['full_text']
        results.append(result)
        
        # Track type counts
        doc_type = result['classification']['type']
        type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        
        conf = result['classification']['confidence']
        fields = result['extraction']['fields_found']
        print(f"{doc_type} ({conf:.0%}) - {fields} fields")
    
    pdf.close()
    
    # Summary
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Pages processed: {len(results)}")
    print(f"Document types found:")
    for dtype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {dtype}: {count}")
    
    # Calculate average confidence per type
    type_confidences = {}
    for r in results:
        t = r['classification']['type']
        c = r['classification']['confidence']
        if t not in type_confidences:
            type_confidences[t] = []
        type_confidences[t].append(c)
    
    print(f"\nAverage confidence by type:")
    for dtype, confs in type_confidences.items():
        avg = sum(confs) / len(confs)
        print(f"  {dtype}: {avg:.1%}")
    
    # Save full results
    summary_file = f"{OUTPUT_DIR}/pipeline_results.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump({
            "test_info": {
                "pdf": PDF_PATH,
                "total_pages": total_pages,
                "pages_tested": pages_to_test,
                "timestamp": datetime.now().isoformat()
            },
            "type_counts": type_counts,
            "type_confidences": {k: sum(v)/len(v) for k, v in type_confidences.items()},
            "results": results
        }, f, indent=2)
    
    print(f"\nResults saved to: {summary_file}")
    print(f"Page texts saved to: {OUTPUT_DIR}/pages/")
    print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
