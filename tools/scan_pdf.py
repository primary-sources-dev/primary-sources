"""
scan_pdf.py — Simple PDF Keyword Search Utility

Searches a PDF for specified keywords and reports which pages contain them.
Used for quick document analysis and locating specific content.

Usage:
    python tools/scan_pdf.py
    
    # Or modify the pdf_path and keywords in __main__ section
"""

import pypdf
import sys

def find_keywords_in_pdf(pdf_path, keywords):
    results = {kw: [] for kw in keywords}
    
    try:
        reader = pypdf.PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            page_num = i + 1
            text = page.extract_text()
            
            for kw in keywords:
                if kw.lower() in text.lower():
                    results[kw].append(page_num)
        
        for kw, pages in results.items():
            print(f"Keyword '{kw}' found on pages: {pages}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    pdf_path = "docs/ui/assets/documents/yates-searchable.pdf"
    keywords = [
        "voluntary appearance", "C. Ray Hall", "affidavit", 
        "Charlie's", "polygraph", "extremely upset", 
        "Woodlawn", "Elm and Houston", "Dempsey", "Gilpin", 
        "Ayres", "Mask", "Park-It"
    ]
    find_keywords_in_pdf(pdf_path, keywords)
