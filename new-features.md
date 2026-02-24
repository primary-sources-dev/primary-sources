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
- **Fingerprint Classification**: Identifies document type (FBI 302, NARA RIF, CIA Cable, Memo, WC Exhibit) using textual fingerprints.
- **Zone Extraction**: Applies type-specific patterns to header, body, and footer zones.
- **Multi-Field Extraction**: NARA RIF extracts 10 fields, CIA Cables extract 9 fields, FBI 302 extracts 6+ fields.
- **API Endpoints**: `/api/classify` for type detection, `/api/extract` for full pipeline.
- **UI Integration**: Classification banner with confidence indicator, color-coded by accuracy level.

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

---
*Status: All features committed and integrated into `docs/ui/`*
