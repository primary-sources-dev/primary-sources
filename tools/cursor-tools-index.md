# Tools Index

**Generated:** 2026-02-26  
**Location:** `tools/`

---

## Overview

This directory contains Python utilities for processing archival documents, extracting metadata, and managing the research vault.

---

## Core Tools

### OCR & Document Processing

| File | Description | Usage |
|------|-------------|-------|
| `ocr_server.py` | Flask web server for OCR UI. Serves frontend and provides REST API for file processing. Includes document classification, metadata parsing, and entity linking. | `python tools/ocr_server.py` → `http://localhost:5000` |
| `scan_pdf.py` | Simple PDF keyword search utility. Reports which pages contain specified keywords. | `python tools/scan_pdf.py` |

### Citation & Reference

| File | Description | Usage |
|------|-------------|-------|
| `citation_generator.py` | Academic citation generator. Produces Chicago, MLA, and APA formatted citations from source metadata. | `from citation_generator import generate_citation` |
| `inflation.py` | Historical currency converter. Converts USD values to modern purchasing power using CPI data. | `from inflation import convert_to_modern` |

### Entity Matching

| File | Description | Usage |
|------|-------------|-------|
| `entity_matcher.py` | Entity matching for OCR text. Scans text against known entities (persons, places, orgs) to auto-link mentions to database records. Supports exact and fuzzy matching. | `from entity_matcher import find_entities` |

---

## OCR-GUI Module (`ocr-gui/`)

Desktop and backend components for OCR processing.

| File | Description |
|------|-------------|
| `ocr_gui.py` | Desktop tkinter application for batch OCR processing |
| `ocr_worker.py` | OCR processing backend. Handles WSL (ocrmypdf) and Python (pytesseract) backends |
| `document_classifier.py` | Document type classification engine. Identifies FBI 302, NARA RIF, CIA Cable, Memo, etc. by matching textual fingerprints |
| `metadata_parser.py` | Forensic metadata parser. Extracts structured metadata (Agency, RIF Number, Date, Author) from OCR'd documents |
| `zone_extractor.py` | Type-specific zone extraction engine. Applies targeted patterns based on classified document type |
| `entity_linker.py` | Narrative entity linking. Cross-references archival text with People and Places databases |
| `requirements.txt` | Python dependencies for OCR-GUI |
| `run.bat` | Windows batch launcher |

---

## Test & Analysis Scripts

### Classifier Testing

| File | Description |
|------|-------------|
| `classifier_test.py` | Document classifier unit tests |
| `test_classifier.py` | Additional classifier tests |
| `classifier_test_html.py` | **DEPRECATED** - Generates HTML classification reports. Replaced by dynamic `classifier-ui.html` |
| `train_classifier.py` | Analyzes feedback data to suggest classifier pattern improvements |

### Collection-Specific Tests

| File | Description |
|------|-------------|
| `yates_test.py` | Test classifier on Yates FBI documents |
| `wc_volume_test.py` | Test classifier on Warren Commission volumes |
| `church_committee_test.py` | Test classifier on Church Committee documents |
| `cia_201_test.py` | Test classifier on CIA 201 files |
| `full_pipeline_test.py` | End-to-end pipeline test across all components |
| `prove_it_works.py` | Proof-of-concept demonstration script |

### Unknown Page Analysis

| File | Description |
|------|-------------|
| `examine_unknown.py` | Examine UNKNOWN pages to understand missing patterns |
| `examine_yates_unknowns.py` | Analyze UNKNOWN pages in Yates documents |
| `examine_church_unknowns.py` | Analyze UNKNOWN pages in Church Committee docs |
| `analyze_wc_unknowns.py` | Analyze UNKNOWN pages in Warren Commission volumes |
| `check_page_scores.py` | Inspect individual page classification scores |
| `discover_patterns.py` | Auto-discover new patterns from UNKNOWN pages |
| `test_dpd_detection.py` | Test Dallas Police Department document detection |

---

## Data Management Scripts

| File | Description |
|------|-------------|
| `merge_data.py` | Merge entity data from multiple sources |
| `restructure_events.py` | Restructure event data format |
| `tag_yates_entities.py` | Tag entities in Yates documents |
| `deduplicate_baseline.py` | Deduplicate baseline entity data |
| `clean_baseline.py` | Clean and normalize baseline data |
| `all_collections_summary.py` | Generate summary statistics across all collections |

---

## Output Directory (`output/`)

Contains test results and extracted data:

```
output/
├── hsca_report_test/      # HSCA test results
│   ├── pages/             # Per-page text extractions
│   └── pipeline_results.json
├── wc_vol1_test/          # Warren Commission Vol 1 test
│   ├── pages/
│   └── pipeline_results.json
├── wc_volumes/            # All WC volumes test
├── church_committee/      # Church Committee test
└── yates_examine.txt      # Yates analysis output
```

---

## Dependencies

### OCR Server (Flask)
```bash
pip install flask werkzeug PyMuPDF rapidfuzz
```

### Desktop GUI
```bash
pip install customtkinter pytesseract pdf2image Pillow
```

### OCR Backends
- **WSL (recommended):** `sudo apt install ocrmypdf`
- **Python:** `pip install pytesseract` + Tesseract installation

---

## API Endpoints (ocr_server.py)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve main landing page |
| `/api/config` | GET | Get server configuration |
| `/api/jobs` | POST | Create new OCR job |
| `/api/jobs/<id>` | GET | Get job status |
| `/api/jobs/<id>/start` | POST | Start job processing |
| `/api/jobs/<id>/cancel` | POST | Cancel running job |
| `/api/download/<filename>` | GET | Download processed file |
| `/api/review/<filename>` | GET | Get per-page classification data |
| `/api/feedback` | POST | Submit classification feedback |
| `/api/parse-metadata` | POST | Parse metadata from text |

---

## Related Documentation

- `tools/README.md` — Quick start guide
- `tools/ocr-gui/README.md` — Desktop GUI documentation
- `tools/notes.md` — Entity extraction pipeline notes
- `docs/ui/ocr/plans/` — Feature planning documents
