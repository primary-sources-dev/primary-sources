# Primary Sources — Tools Index
*Generated: 2026-02-25*

This document serves as the master index for all specialized Python utilities, OCR engines, and research tools in the Primary Sources project.

---

## 🏗️ Core Infrastructure & OCR
| Tool | Description | Usage/Endpoint |
|------|-------------|-------|
| [**ocr_server.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr_server.py) | Flask web server serving the OCR UI and providing a REST API for document processing. | `python tools/ocr_server.py` → `http://localhost:5000` |
| [**ocr-gui/**](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr-gui) | Desktop-based batch OCR processing module. See [Module Detail](#ocr-gui-module-ocr-gui) below. | `tools/ocr-gui/run.bat` |
| [**scan_pdf.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/scan_pdf.py) | CLI utility for keyword searching and text layer extraction from PDFs. | `python tools/scan_pdf.py` |

---

## 🧠 Intelligence & Classification
| Tool | Description |
|------|-------------|
| [**train_classifier.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/train_classifier.py) | Analyzes feedback data to suggest and train classifier pattern improvements. |
| [**test_classifier.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/test_classifier.py) | Validation script for checking document classification accuracy. |
| [**classifier_test_html.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/classifier_test_html.py) | **DEPRECATED** — Historical tool for generating visual classification reports. |
| [**discover_patterns.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/discover_patterns.py) | Auto-discovers new textual fingerprints from documents marked as "UNKNOWN". |

---

## 🔗 Entity Identification & Linking
| Tool | Description |
|------|-------------|
| [**entity_matcher.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/entity_matcher.py) | Scans text against People/Places databases to auto-link mentions. |
| [**tag_yates_entities.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/tag_yates_entities.py) | Specialized tagging script for the Yates incident dataset. |
| [**citation_generator.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/citation_generator.py) | Generates Chicago, MLA, and APA citations from document metadata. |

---

## 🔬 Research & Pilot Studies
| Tool | Description |
|------|-------------|
| [**church_committee_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/church_committee_test.py) | Analysis script focused on Church Committee document sets. |
| [**cia_201_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/cia_201_test.py) | Pilot study for extracting entity patterns from CIA 201-files. |
| [**wc_volume_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/wc_volume_test.py) | Framework for bulk processing of Warren Commission volumes. |
| [**yates_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/yates_test.py) | Verification tests for the Yates incident data extraction. |

---

## 🧹 Data Processing & Hygiene
| Tool | Description |
|------|-------------|
| [**clean_baseline.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/clean_baseline.py) | Sanitizes JSON baseline data to match current entity schemas. |
| [**deduplicate_baseline.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/deduplicate_baseline.py) | Identifies and removes duplicate entries in entity JSON files. |
| [**merge_data.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/merge_data.py) | Merges entity data from multiple sources into a single unified record. |
| [**restructure_events.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/restructure_events.py) | Batch updates event data formats for UI compatibility. |

---

## 🛠️ OCR-GUI Module Detail
Located in `tools/ocr-gui/`, this module handles the forensic layer of document processing.

| File | Description |
|------|-------------|
| `ocr_gui.py` | Desktop tkinter application for batch OCR processing. |
| `ocr_worker.py` | Hardware-agnostic worker supporting WSL (ocrmypdf) and pytesseract. |
| `document_classifier.py` | Engine that identifies FBI 302s, CIA Cables, and NARA RIFs. |
| `metadata_parser.py` | Extracts structured data (Agency, Date, Author) from document headers. |
| `zone_extractor.py` | Targeted text extraction based on classified document zones. |

---

## 🌐 API Reference (ocr_server.py)
The Flask server provides the following endpoints for the Intelligence Layer:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | POST | Create and queue a new OCR/Processing job. |
| `/api/jobs/<id>` | GET | Check real-time status of a running job. |
| `/api/parse-metadata` | POST | Send raw text to receive structured metadata JSON. |
| `/api/feedback` | POST | Submit manual classification corrections to improve `train_classifier.py`. |
| `/api/review/<file>` | GET | Retrieve per-page classification scores for quality audit. |

---

## 📊 Requirements & Dependencies
- **Server**: `pip install flask werkzeug PyMuPDF rapidfuzz`
- **OCR Engine**: `pip install customtkinter pytesseract pdf2image Pillow`
- **Backends**: WSL `ocrmypdf` (Recommended) or Tesseract (Native).

---
*Index maintained by Antigravity AI — Consensus Technical Record*
