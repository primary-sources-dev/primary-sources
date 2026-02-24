#!/usr/bin/env python3
"""
Warren Commission Volume Testing

Tests the classifier across all WC volumes to discover patterns and improve detection.
"""
import fitz
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores, DocType
from zone_extractor import extract_document

WC_DIR = "raw-material/warren-commission"
OUTPUT_DIR = "tools/output/wc_volumes"

def get_wc_volumes():
    """Get list of WC volume PDFs."""
    files = []
    for f in os.listdir(WC_DIR):
        if f.startswith("GPO-WARRENCOMMISSIONHEARINGS-") and f.endswith(".pdf"):
            vol_num = int(f.replace("GPO-WARRENCOMMISSIONHEARINGS-", "").replace(".pdf", ""))
            files.append((vol_num, os.path.join(WC_DIR, f)))
    return sorted(files)

def test_volume(vol_num: int, pdf_path: str, sample_size: int = 15):
    """Test a single volume and return results."""
    print(f"\n{'='*60}")
    print(f"VOLUME {vol_num}: {os.path.basename(pdf_path)}")
    print(f"{'='*60}")
    
    pdf = fitz.open(pdf_path)
    total_pages = len(pdf)
    print(f"Total pages: {total_pages}")
    
    # Sample pages evenly distributed
    step = max(1, total_pages // sample_size)
    sample_pages = list(range(1, total_pages + 1, step))[:sample_size]
    
    results = []
    type_counts = {}
    
    for page_num in sample_pages:
        text = pdf[page_num - 1].get_text()
        
        classification = classify_document(text)
        extraction = extract_document(text)
        
        doc_type = classification.doc_type.value
        type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        
        results.append({
            "page": page_num,
            "type": doc_type,
            "confidence": round(classification.confidence, 3),
            "fields": len(extraction.fields),
            "preview": text[:200].replace('\n', ' ')[:100]
        })
        
        conf_str = f"{classification.confidence:.0%}"
        print(f"  Page {page_num:4d}: {doc_type:15s} ({conf_str:>4s}) - {len(extraction.fields)} fields")
    
    pdf.close()
    
    return {
        "volume": vol_num,
        "total_pages": total_pages,
        "sample_size": len(sample_pages),
        "type_counts": type_counts,
        "results": results
    }

def main():
    print("="*70)
    print("WARREN COMMISSION VOLUMES - CLASSIFICATION TEST")
    print("="*70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    volumes = get_wc_volumes()
    print(f"Found {len(volumes)} volumes")
    
    all_results = []
    overall_counts = {}
    
    for vol_num, pdf_path in volumes:
        result = test_volume(vol_num, pdf_path)
        all_results.append(result)
        
        # Aggregate counts
        for dtype, count in result["type_counts"].items():
            overall_counts[dtype] = overall_counts.get(dtype, 0) + count
    
    # Summary
    print("\n" + "="*70)
    print("OVERALL SUMMARY")
    print("="*70)
    total_samples = sum(r["sample_size"] for r in all_results)
    print(f"Total volumes: {len(all_results)}")
    print(f"Total sample pages: {total_samples}")
    print(f"\nDocument types detected:")
    for dtype, count in sorted(overall_counts.items(), key=lambda x: -x[1]):
        pct = count / total_samples * 100
        print(f"  {dtype:20s}: {count:4d} ({pct:5.1f}%)")
    
    # Save results
    output_file = f"{OUTPUT_DIR}/all_volumes_test.json"
    with open(output_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "overall_counts": overall_counts,
            "volumes": all_results
        }, f, indent=2)
    
    print(f"\nResults saved to: {output_file}")
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
