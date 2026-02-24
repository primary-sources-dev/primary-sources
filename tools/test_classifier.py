"""
test_classifier.py — Test Document Layout Analyzer on real documents
"""

import fitz  # PyMuPDF
import sys
import os

# Add ocr-gui to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import classify_document, get_all_scores
from zone_extractor import extract_document

def test_pdf(pdf_path, max_pages=5):
    """Test classifier on pages from a PDF."""
    print(f"\nTesting: {pdf_path}")
    print("=" * 70)
    
    try:
        pdf = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return
    
    pages_tested = 0
    
    for page_num in range(min(len(pdf), max_pages * 2)):  # Check more pages to find ones with text
        if pages_tested >= max_pages:
            break
            
        page = pdf[page_num]
        text = page.get_text()
        
        # Skip pages with minimal text
        if len(text.strip()) < 200:
            continue
        
        pages_tested += 1
        
        print(f"\n--- PAGE {page_num + 1} ---")
        print(f"Text length: {len(text)} chars")
        print(f"Preview: {text[:150].replace(chr(10), ' ')}...")
        
        # Classify
        result = classify_document(text)
        print(f"\nClassification: {result.doc_type.value}")
        print(f"Confidence: {result.confidence:.1%} ({result.confidence_label})")
        
        if result.matched_patterns:
            print(f"Matched patterns: {result.matched_patterns[:4]}")
        
        # Show all scores
        scores = get_all_scores(text)
        top_scores = [(k, v) for k, v in scores.items() if v > 0][:3]
        if top_scores:
            print(f"Top scores: {top_scores}")
        
        # Extract fields
        extraction = extract_document(text)
        if extraction.fields:
            print(f"\nExtracted {len(extraction.fields)} field(s):")
            for name, field in list(extraction.fields.items())[:6]:
                val = field.value[:50] + "..." if len(field.value) > 50 else field.value
                print(f"  [{field.zone:6}] {name}: {val}")
    
    pdf.close()
    print(f"\nTested {pages_tested} pages from {pdf_path}")


if __name__ == "__main__":
    # Test on Yates documents (FBI 302s)
    yates_pdf = "raw-material/yates/yates_searchable.pdf"
    if os.path.exists(yates_pdf):
        test_pdf(yates_pdf, max_pages=5)
    else:
        print(f"File not found: {yates_pdf}")
    
    # Test on Warren Commission if available
    wc_pdf = "raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-1.pdf"
    if os.path.exists(wc_pdf):
        print("\n" + "=" * 70)
        print("WARREN COMMISSION VOL 1")
        test_pdf(wc_pdf, max_pages=3)
