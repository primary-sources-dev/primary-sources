#!/usr/bin/env python3
import fitz
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ocr-gui'))
from document_classifier import get_all_scores, DocType

doc = fitz.open('raw-material/hsca/HSCA-Lopez-Report.pdf')
text = doc[156].get_text()
scores = get_all_scores(text)
for t, s in sorted(scores.items(), key=lambda x: -x[1])[:5]:
    print(f"{t}: {s:.3f}")
doc.close()
