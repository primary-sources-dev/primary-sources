# New Features Log — February 23, 2026

The following features have been successfully implemented and deployed during the **Primary Sources: Sprint Alpha**. These updates transform the platform from a simple database into a high-fidelity forensic engine.

---

## 1. Extraction Workbench (v1)
A unified side-by-side workspace for archival review and data verification.
- **Three-Pane Layout**: Integrated Sidebar (Navigation), Viewer (Evidence), and Editor (Verification).
- **Workbench Toggle**: Dynamic switching between standard reading mode and forensic workbench mode.
- **"Save Commit" UI**: Placeholder for Phase 4 database persistence.

## 2. Deep Sync
The "killer feature" for archival integrity.
- **Coordinate Mapping**: OCR worker now outputs word-level bounding boxes in a `.ocr.json` sidecar.
- **Click-to-Zoom**: Clicking a line of text in the editor instantly centers the PDF viewer on that exact coordinate in the scanned document.
- **Visual Highlighting**: A gold spotlight highlights the evidence on the scan during review.

## 3. Visual PDF Splitter
A sidecar navigation tool for surgical archival processing.
- **Thumbnail Engine**: Real-time generation of page previews for large archival PDFs.
- **Selection System**: Checkbox-based page selection for targeted extraction or splitting.

## 4. Forensic Metadata Parser
Automated extraction of metadata from government archival forms (headers and footers).
- **Pattern Recognition**: Regex-based extraction of RIF numbers, Agency, Date, and Author metadata.
- **Confidence Scoring**: Dynamic assessment of metadata accuracy.
- **Footer Support**: Extended logic to handle agent/file info on FBI 302 footers.

## 5. Document Layout Analyzer
Intelligent document classification and zone-specific extraction engine.
- **17 Document Types**: FBI_302, FBI_REPORT, CIA_CABLE, MEMO, LETTER, TRAVEL_DOCUMENT, NARA_RIF, WC_TESTIMONY, WC_DEPOSITION, WC_AFFIDAVIT, WC_EXHIBIT, POLICE_REPORT, SENATE_REPORT, CHURCH_COMMITTEE, HSCA_DOC, HSCA_REPORT, UNKNOWN.
- **Fingerprint Classification**: Weighted regex pattern matching with OCR-tolerant variants.
- **Zone Extraction**: Type-specific patterns applied to header, body, and footer zones.
- **75.4% Classification Rate**: Tested across 395 pages from Warren Commission, HSCA, Church Committee, and Yates collections.
- **OCR Tolerance**: Handles common OCR artifacts (hyphenated line breaks, garbled text, field office codes).
- **API Endpoints**: `/api/classify` for type detection, `/api/extract` for full pipeline.
- **UI Integration**: Classification banner with confidence indicator, color-coded by accuracy level.
- **Reference**: See `docs/ui/ocr/plans/document-classifier-reference.md` for technical documentation.

## 6. Expanded Media Ingestion
Direct support for raw archival material without pre-processing.
- **Native Images**: Direct OCR for `.jpg`, `.png`, `.tiff`, `.webp`, and `.bmp`.
- **Mobile Snaps (.heic)**: Native conversion for iPhone photos (`.heic`) taken by researchers at physical archives.

## 7. Research Assistant Tools
Forensic metadata surfacing for immediate context.
- **Age-at-Event Badge**: Automatically calculates a person's age at the moment of an event based on birth record timestamps.
- **Inflation Converter**: Historical USD → 2026 purchasing power using static CPI reference data.
- **Auto-Citations**: One-click export to NARA, Chicago, MLA, and APA formats.

## 8. Entity Matcher (Foundation)
The bridge from text to database records.
- **Entities.json**: Automated sidecar output mapping OCR text to known person, place, and organization IDs in the research vault.
- **Fuzzy Matching**: Handles OCR errors and name variations (e.g., "R.L. Yates" → "Ralph Leon Yates").
- **Confidence Scoring**: High/Medium/Low match confidence for human review.

## 9. Platform Discovery Suite
Unified suite of exploratory tools featuring a premium, immersive "Discovery Port" design language.
- **On This Day (OTD)**: Chronological discovery engine (`otd.html`) with Day/Week/Year scoping.
- **Six Degrees**: Relational jump engine (`random.html`) for uncovering wild connections.
- **The Witness Atlas**: Global geospatial and cultural reconstruction project (`witness-atlas.html`).
- **Target Date Explorer**: Native calendar picker to jump to any historical date.
- **Deep-Linking**: Full URL parameter support (`?scope=Week&date=1963-11-22`) for bookmarking forensic views.

## 10. Core UI & UX Standardization
System-wide refinement for visual consistency and structural integrity.
- **Badge Component System**: Centralized `.badge` classes replacing ad-hoc Tailwind strings. Semantic variants include `badge-small`, `badge-large`, `badge-wip` (with construction icon), and `Live` indicators.
- **Modular Header Migration**: Full integration of Discovery Portals into the modular `header` component. Automatically generates dynamic breadcrumbs (e.g., `Archive > Witness Atlas`) and provides unified master menu access.
- **Tracking Convention**: Standardized usage of `feature=true` URL parameters across all platform entry points for consistent state management.

## 11. Forensic PDF Workbench & Intelligence Layer (2026-02-24)
Advanced evidentiary analysis features integrated into the primary document viewer to bridge the gap between raw scans and structured research.
- **Forensic Metadata Ribbon**: Implementation of a high-fidelity metadata strip in the PDF Viewer that surfaces document classification, RIF IDs, and agency data directly above the workspace.
- **Intelligence Layer (Psychology)**: Added an AI-powered overlay system (the "Psychology" toggle) that highlights high-priority archival entities (e.g., CIA, FBI, Oswald, Kennedy, Secret Service) directly on the document canvas using OCR coordinates. Featuring a hover-active tooltip system for rapid identification.
- **Universal Component Architecture**: Refactored `components.js` and `header.html` to use site-root relative paths (`/`). This critical update ensures consistent global navigation and component loading regardless of directory depth, specifically fixing header breakage in specialized tools like the `/ocr/` portal.
- **Workbench Persistence**: Enhanced `ocr-gui.js` to automatically pass tracking parameters (`feature=true`) through the extraction pipeline to the workbench viewer, ensuring session continuity.

## 12. Tool Information Page System (2026-02-23)
Standardized informational pages for all analytical tools with consistent template architecture.
- **Template Standard**: Created `docs/ui/templates/tool-information-page.md` defining canonical structure for all tool pages.
- **Page Structure**: Hero (badge, title, stats), What It Does, How It Works (workflow diagram), Supported Items (grid), Key Features (2x2), API Usage (code), Status Card.
- **Six Tool Pages Deployed**:
  - **OCR Tool** (`tools/ocr-features.html`): Tesseract engine, batch processing, Extraction Workbench with Deep Sync.
  - **PDF Viewer** (`tools/pdf-viewer-features.html`): Document viewing, annotations, side-by-side OCR verification, Intelligence Layer.
  - **Document Analyzer** (`tools/document-analyzer.html`): 17 document types, fingerprint classification, zone extraction.
  - **Citation Generator** (`tools/citation-generator.html`): Chicago/MLA/APA/NARA formats, agent name handling, RIF support.
  - **Entity Matcher** (`tools/entity-matcher.html`): Fuzzy matching, confidence scoring, NER extraction, vault ID linking.
  - **Research Tools** (`tools/research-tools.html`): Inflation converter and age-at-event calculator with DB integration.
- **Live Status**: All tools marked as Live with emerald badge styling.
- **Navigation Split**: Dashboard cards link to informational pages; header nav links to functional tools.
- **Modular Header Integration**: All pages use `data-component="header"` with dynamic breadcrumbs via `nav.js`.

## 13. Classification Review Tool & Training Loop (2026-02-23)
Human-in-the-loop classifier improvement system with integrated feedback collection.
- **Classification Review Tool** (`tools/classifier-review.html`): Visual bulk review interface with PDF.js rendering.
- **Text Layer Highlighting**: Displays matched fingerprint patterns directly on document canvas.
- **Integrated Pipeline**: Combines Document Classifier (28 types), Metadata Parser, and Entity Linker in single view.
- **Server-Side Feedback**: User clicks POST to `/api/feedback` endpoint, saving to `data/classifier-feedback.json`.
- **Training Script** (`tools/train_classifier.py`): Analyzes corrections, extracts common phrases, suggests new patterns.
- **Feedback API Endpoints**: `POST /api/feedback`, `GET /api/feedback`, `GET /api/feedback/corrections`.

---

## Tool Codebase Audit (2026-02-23)

### Existing Tool Pages (`docs/ui/tools/`)

| # | Page File | Tool Name | Status |
|---|-----------|-----------|--------|
| 1 | `pdf-viewer-features.html` | PDF Viewer | ✅ Live |
| 2 | `ocr-features.html` | OCR Tool | ✅ Live |
| 3 | `document-analyzer.html` | Document Layout Analyzer (+ Zone Extractor, Metadata Parser) | ✅ Live |
| 4 | `classifier-review.html` | Classification Review Tool (+ Training Loop) | ✅ Live |
| 5 | `citation-generator.html` | Citation Generator | ✅ Live |
| 6 | `entity-matcher.html` | Entity Matcher (+ Entity Linker) | ✅ Live |
| 7 | `research-tools.html` | Research Tools (Inflation + Age Calculator) | ✅ Live |
| 8 | `pattern-discovery.html` | Pattern Discovery Tool | ✅ Live |
| 9 | `ocr-api.html` | OCR API Reference | ✅ Live |

### Code Files Without Tool Pages (Candidates)

#### High Priority — User-Facing Tools

| # | Code File | Tool Name | Description | Page |
|---|-----------|-----------|-------------|------|
| 1 | `tools/train_classifier.py` | Classifier Training Script | Analyzes feedback, suggests patterns | ✅ `classifier-review.html` |
| 2 | `tools/ocr-gui/zone_extractor.py` | Zone Extractor | Type-specific field extraction | ✅ `document-analyzer.html` |
| 3 | `tools/ocr-gui/entity_linker.py` | Entity Linker | Cross-references OCR with people/places | ✅ `entity-matcher.html` |
| 4 | `tools/ocr-gui/metadata_parser.py` | Metadata Parser | Extracts RIF, agency, date, author | ✅ `document-analyzer.html` |
| 5 | `tools/discover_patterns.py` | Pattern Discovery Tool | Finds new document type patterns | ✅ `pattern-discovery.html` |

#### Medium Priority — Internal/Infrastructure

| # | Code File | Purpose |
|---|-----------|---------|
| 6 | `tools/classifier_test_html.py` | Generates classifier-review.html |
| 7 | `tools/ocr_server.py` | Flask backend for OCR + feedback API |
| 8 | `tools/ocr-gui/ocr_gui.py` | Desktop GUI (covered by ocr-features.html) |
| 9 | `tools/scan_pdf.py` | Simple keyword search in PDFs |
| 10 | `tools/full_pipeline_test.py` | End-to-end OCR pipeline test |

#### Low Priority — Test/Analysis Scripts

| # | Code File | Purpose |
|---|-----------|---------|
| 11 | `tools/wc_volume_test.py` | Warren Commission volume testing |
| 12 | `tools/church_committee_test.py` | Church Committee testing |
| 13 | `tools/cia_201_test.py` | CIA 201 file testing |
| 14 | `tools/yates_test.py` | Yates document testing |
| 15 | `tools/analyze_wc_unknowns.py` | Analyze unclassified WC pages |
| 16 | `tools/examine_*.py` (5 files) | Examine unknown pages |
| 17 | `tools/check_page_scores.py` | Debug classification scores |
| 18 | `tools/test_classifier.py` | Unit tests for classifier |
| 19 | `tools/test_dpd_detection.py` | Dallas PD pattern tests |
| 20 | `tools/prove_it_works.py` | Demonstration script |

#### Data Management Scripts (Internal)

| # | Code File | Purpose |
|---|-----------|---------|
| 21 | `tools/merge_data.py` | Merge JSON datasets |
| 22 | `tools/clean_baseline.py` | Clean baseline data |
| 23 | `tools/deduplicate_baseline.py` | Remove duplicates |
| 24 | `tools/restructure_events.py` | Restructure event data |
| 25 | `tools/tag_yates_entities.py` | Tag entities in Yates docs |
| 26 | `tools/all_collections_summary.py` | Generate collection summaries |

### Recommended New Tool Pages — COMPLETED

| Priority | Tool | Action |
|----------|------|--------|
| 1 | ~~Classifier Training~~ | ✅ Covered in `classifier-review.html` |
| 2 | ~~Pattern Discovery~~ | ✅ Created `pattern-discovery.html` |
| 3 | ~~Zone Extractor~~ | ✅ Merged into `document-analyzer.html` |
| 4 | ~~Metadata Parser~~ | ✅ Merged into `document-analyzer.html` |
| 5 | ~~Entity Linker~~ | ✅ Merged into `entity-matcher.html` |
| 6 | OCR API Reference | ✅ Created `ocr-api.html` |

## 14. Tool Documentation Expansion (2026-02-23)
Comprehensive documentation coverage for all high-priority tools.
- **Pattern Discovery Tool** (`tools/pattern-discovery.html`): New standalone page documenting the UNKNOWN page analysis workflow.
- **OCR API Reference** (`tools/ocr-api.html`): Complete REST API documentation for all 12 endpoints (classification, extraction, entities, citations, feedback).
- **Document Analyzer Update**: Added Zone Extractor and Metadata Parser sections with field tables and zone descriptions.
- **Entity Matcher Update**: Added Entity Linker engine documentation with People/Places database info.
- **Internal Script Docstrings**: Added module-level docstrings to `scan_pdf.py` and verified existing docstrings.

---
*Status: All features committed and integrated into `docs/ui/` — v0.8.5-alpha*
