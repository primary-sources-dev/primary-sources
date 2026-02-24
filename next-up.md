# Next Up: Immediate Quick Wins

Based on the [Master Roadmap](./roadmap.md), these features represent the highest impact for the lowest implementation effort. They leverage existing data structures and code to provide immediate value to researchers.

---

### 1. Extraction Workbench Phase 4 (Commit)
*   **Description**: Persist the work done in the Extraction Workbench. Implement backend logic to save verified text and extracted segments to the database.
*   **Target**: `ocr-server.py` and PG integration.
*   **Category**: Utility / OCR / Tooling
*   **Effort**: Medium

### 2. Universal Person Profile (Phases 1-2)
*   **Description**: Build a flexible `person.html` template that handles both rich biographies and minimal archival witnesses.
*   **Target**: `docs/ui/person.html`, Layout Structure, and Sidebar Grid.
*   **Category**: UI/UX / Information Architecture
*   **Effort**: Low (HTML/CSS)

---

## Research Assistant Features

### 3. "On This Day" (OTD) Dashboard (#26)
*   **Description**: An automated widget on the home page highlighting historical events that occurred on today's month/day in previous years.
*   **Target**: Home page widget + SQL date filter.
*   **Category**: Assistant / Engagement
*   **Effort**: Low

### 4. UX/UI Polish Bundle (Consistency Sprint)
*   **Tasks**: 
    1. Snappy Image Hovers (700ms → 300ms).
    2. Dynamic Breadcrumb labels (Page Title sync).
    3. Status Badges on Tool Cards (LIVE/BETA markers).
    4. Responsive Grid alignment (Home vs Browse parity).
*   **Category**: UI/UX
*   **Effort**: Trivial (all CSS/JS tweaks)

### 5. ZIP Processer (Batch Unrolling)
*   **Description**: Allow researchers to upload a `.zip` or `.tar` of document images for bulk processing.
*   **Target**: `ocr-server.py` extraction logic.
*   **Category**: Utility / OCR
*   **Effort**: Low

---


---
### Completed Quick Wins (2026-02-23 Marathon)
*   [x] **Archival Image Support**: Native ingestion of .jpg, .png, .tiff, .webp photos.
*   [x] **Extraction Workbench (Phases 1-3)**: Dual-pane UI, Deep Sync coordinate mapping, and visual PDF splitter.
*   [x] **Forensic Metadata Parser**: Auto-extraction of archival metadata (RIF, Agency, Date, Author) from headers and footers with confidence scoring. (File: `metadata_parser.py`)
*   [x] **Footer Parsing (FBI 302)**: Agent name and file number extraction from document footers (integrated into Metadata Parser).
*   [x] **Mobile Photos (.heic)**: iPhone photo uploads without conversion via pillow-heif.
*   [x] **Age-at-Event Badge**: SQL function + view for calculating person's age at any event.
*   [x] **Auto-Generated Citations**: Chicago, MLA, APA, NARA citation formats from source metadata.
*   [x] **Inflation Converter**: Historical USD → 2026 purchasing power with CPI data (1913-2026).
*   [x] **Entity Matching**: Auto-link OCR text to known persons, places, and orgs with entities.json sidecar.

---
*These features will be the primary focus for the next sprint to demonstrate the power of the Atomic Historical Engine.*
