# Antigravity Tools Index
*Generated: 2026-02-25*

This index provides a comprehensive overview of the specialized Python scripts and utilities in the `tools/` directory, categorized by their primary function in the Primary Sources workflow.

---

## 🏗️ Core Infrastructure & OCR
| Tool | Description |
|------|-------------|
| [**ocr_server.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr_server.py) | Flask web server serving the OCR UI and handling uploads. |
| [**ocr-gui/**](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr-gui) | Desktop-based tkinter application for local OCR processing. |
| [**scan_pdf.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/scan_pdf.py) | CLI utility for extracting text layers from PDF documents. |

## 🧠 Intelligence & Classification
| Tool | Description |
|------|-------------|
| [**train_classifier.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/train_classifier.py) | Script to train the document classification model. |
| [**test_classifier.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/test_classifier.py) | Validation script for checking classifier accuracy. |
| [**classifier_test_html.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/classifier_test_html.py) | Generates HTML-based visual reports of classification results. |
| [**discover_patterns.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/discover_patterns.py) | Analyzes text for recurring structural or linguistic patterns. |

## 🔗 Entity Linking & Matching
| Tool | Description |
|------|-------------|
| [**entity_matcher.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/entity_matcher.py) | Logic for linking extracted entities (people, places) across documents. |
| [**tag_yates_entities.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/tag_yates_entities.py) | Specialized tagging script for the Yates incident data. |
| [**yates_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/yates_test.py) | Verification tests for entity extraction on the Yates dataset. |

## 🧹 Data Processing & Hygiene
| Tool | Description |
|------|-------------|
| [**clean_baseline.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/clean_baseline.py) | Sanitizes JSON baseline data to match the current schema. |
| [**deduplicate_baseline.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/deduplicate_baseline.py) | Identifies and removes duplicate entries in entity JSONs. |
| [**merge_data.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/merge_data.py) | Merges multiple entity files into a single unified record. |
| [**restructure_events.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/restructure_events.py) | Batch updates event structures for UI compatibility. |

## 🔬 Research & Investigation
| Tool | Description |
|------|-------------|
| [**church_committee_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/church_committee_test.py) | Analysis script focused on Church Committee document sets. |
| [**cia_201_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/cia_201_test.py) | Pilot study for 201-file entity extraction patterns. |
| [**wc_volume_test.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/wc_volume_test.py) | Testing framework for bulk processing of Warren Commission volumes. |
| [**examine_unknown.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/examine_unknown.py) | Utility to audit entities marked as 'UNKNOWN' in the database. |

## 📊 Analytics & Utilities
| Tool | Description |
|------|-------------|
| [**all_collections_summary.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/all_collections_summary.py) | Generates statistics across all document collections. |
| [**inflation.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/inflation.py) | Calculation utility for historical dollar value normalization. |
| [**check_page_scores.py**](file:///C:/Users/willh/Desktop/primary-sources/tools/check_page_scores.py) | Audits the quality and completeness of generated UI pages. |

---
*Index maintained by Antigravity AI*
