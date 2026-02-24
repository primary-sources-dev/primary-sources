"""
classifier_test.py — Sample Page Extraction and Classification Test

Extracts sample pages from a PDF, extracts text, and runs document classification.
Used for validating and tuning the Document Layout Analyzer.
"""

import sys
import fitz  # PyMuPDF
from pathlib import Path

# Add ocr-gui to path for imports
sys.path.insert(0, str(Path(__file__).parent / "ocr-gui"))

from document_classifier import classify_document, DocType

def extract_page_text(pdf_path: str, page_num: int) -> str:
    """Extract text from a specific page of a PDF."""
    doc = fitz.open(pdf_path)
    if page_num < 0 or page_num >= len(doc):
        return ""
    page = doc[page_num]
    text = page.get_text()
    doc.close()
    return text

def test_pages(pdf_path: str, page_numbers: list[int]) -> list[dict]:
    """Test classification on multiple pages."""
    results = []
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    doc.close()
    
    print(f"PDF: {Path(pdf_path).name}")
    print(f"Total pages: {total_pages}")
    print(f"Testing {len(page_numbers)} pages...")
    print("-" * 80)
    
    for page_num in page_numbers:
        if page_num >= total_pages:
            print(f"Page {page_num}: SKIPPED (out of range)")
            continue
            
        text = extract_page_text(pdf_path, page_num)
        
        if not text.strip():
            results.append({
                "page": page_num + 1,  # 1-indexed for display
                "doc_type": "NO_TEXT",
                "confidence": 0,
                "method": "n/a",
                "first_line": "[empty or image-only page]",
                "text_length": 0,
            })
            continue
        
        # Classify
        result = classify_document(text)
        
        # Get first meaningful line
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        first_line = lines[0] if lines else ""
        
        # Detect if fuzzy was used
        fuzzy_used = any("[fuzzy]" in p for p in result.matched_patterns)
        method = "regex+fuzzy" if fuzzy_used else "regex"
        
        results.append({
            "page": page_num + 1,
            "doc_type": result.doc_type.value,
            "confidence": result.confidence,
            "method": method,
            "first_line": first_line[:60] + ("..." if len(first_line) > 60 else ""),
            "text_length": len(text),
        })
    
    return results

def print_results_table(results: list[dict]):
    """Print results as a formatted table."""
    print(f"\n{'Page':<6} {'Type':<18} {'Conf':<8} {'Method':<12} {'First Line'}")
    print("=" * 100)
    
    for r in results:
        conf_str = f"{r['confidence']:.0%}" if r['confidence'] > 0 else "-"
        print(f"{r['page']:<6} {r['doc_type']:<18} {conf_str:<8} {r['method']:<12} {r['first_line']}")

def main():
    # Warren Commission Volume 1
    pdf_path = "raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-1.pdf"
    
    # Sample pages to test (0-indexed):
    # - Pages 1-5: Front matter
    # - Pages 12-20: Start of Marina Oswald testimony
    # - Pages 50-55: Mid-testimony
    # - Pages 100-105: Later testimony
    # - Pages 200-205: Different section
    # - Random spread
    
    sample_pages = [
        0, 1, 2, 3, 4,           # Front matter
        12, 13, 14, 15, 16,      # Early testimony
        50, 51, 52,              # Mid testimony
        100, 101, 102,           # Later testimony
        150, 175, 200, 225,      # Spread through document
        250, 300, 350, 400,      # Later sections
    ]
    
    results = test_pages(pdf_path, sample_pages)
    print_results_table(results)
    
    # Summary stats
    print("\n" + "=" * 100)
    print("SUMMARY")
    print("-" * 40)
    
    type_counts = {}
    for r in results:
        t = r["doc_type"]
        type_counts[t] = type_counts.get(t, 0) + 1
    
    for doc_type, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {doc_type}: {count} pages")
    
    # Confidence distribution
    confs = [r["confidence"] for r in results if r["confidence"] > 0]
    if confs:
        avg_conf = sum(confs) / len(confs)
        print(f"\nAverage confidence: {avg_conf:.1%}")
        low_conf = [r for r in results if 0 < r["confidence"] < 0.3]
        if low_conf:
            print(f"Low confidence pages (<30%): {len(low_conf)}")

if __name__ == "__main__":
    main()
