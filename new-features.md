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

---
*Status: All features committed and integrated into `docs/ui/` — v0.8.2-alpha*
