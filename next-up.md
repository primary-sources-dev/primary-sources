# Next Up: Immediate Quick Wins

Based on the [Master Roadmap](./roadmap.md), these features represent the highest impact for the lowest implementation effort. They leverage existing data structures and code to provide immediate value to researchers.

---

## Scanner & OCR Enhancements

### 1. Footer Parser (FBI 302)
*   **Description**: Extend the Forensic Header Parser to scan document footers. FBI 302 forms (1960s) place agent name and file number in the footer, not the header.
*   **Logic**: Add `FooterParser` class that scans last 1500 characters. Same regex approach as `HeaderParser`.
*   **Value**: Completes the metadata extraction story for the most common FBI document type.
*   **Category**: Utility / OCR
*   **Effort**: Low (extends existing code)

### 2. Mobile Photos (.heic Support)
*   **Description**: Enable iPhone photo uploads directly from archive visits. Researchers can snap documents and upload without manual conversion.
*   **Logic**: Add `pillow-heif` library. Convert `.heic` → `.jpg` before Tesseract processing.
*   **Value**: Unblocks mobile research workflows. Field researchers at NARA can upload on-site.
*   **Category**: Utility / OCR
*   **Effort**: Trivial (one library, one conversion step)

### 3. Database Lookup Entity Matching
*   **Description**: Scan OCR text against existing `person`, `place`, `org` tables to auto-link known entities. Output `entities.json` sidecar file.
*   **Logic**: Exact string matching against `display_name` + `person_alias`. 100% confidence for exact matches.
*   **Value**: Zero-cost, high-accuracy entity linking. Gateway to the full "Smart Evidence" pipeline.
*   **Category**: Utility / OCR / Entity Extraction
*   **Effort**: Low (SQL queries, no ML)

---

## Research Assistant Features

### 4. Age-at-Event Badge (#27)
*   **Description**: Automatically calculate and display a person's exact age next to their name on any event or document page.
*   **Logic**: `event.start_ts` - `person.birth_date` = Age. Computed column or view.
*   **Value**: Instantly humanizes the data. Seeing that a key witness was only 19 years old qualitatively changes how a researcher views their testimony.
*   **Category**: Assistant / Forensic
*   **Effort**: Trivial (one SQL calculation)

### 5. Auto-Generated Citations (#22)
*   **Description**: One-click citation generation from any source record. Outputs Chicago, MLA, APA, and custom formats with NARA RIF numbers.
*   **Logic**: String templating from existing `source` + `source_excerpt` fields (`author`, `published_date`, `external_ref`).
*   **Value**: Enables academic publishing directly from the vault. No manual citation formatting.
*   **Category**: Research / Publishing
*   **Effort**: Low (string templates, existing data)

### 6. Inflation Converter (#28)
*   **Description**: A toggle or hover interaction on any historical currency value (e.g., in FBI reports or cultural ads) that shows its modern purchasing power.
*   **Logic**: Static CPI (Consumer Price Index) multiplier applied to `assertion_value`.
*   **Value**: Provides a "time-machine" perspective on the 1960s economy, making historical prices (like a $25.00 rifle or a $0.30 gallon of gas) relatable to a 2026 user.
*   **Category**: Assistant / Culture
*   **Effort**: Low (CPI lookup table)

### 7. "On This Day" (OTD) Dashboard (#26)
*   **Description**: An automated widget on the home page highlighting historical events that occurred on today's month/day in previous years.
*   **Logic**: SQL/JSON filter: `WHERE month = current_month AND day = current_day`.
*   **Value**: Encourages daily engagement and surfaces deep archive content without requiring manual curation.
*   **Category**: Assistant / Engagement
*   **Effort**: Low (date filtering)

---

## UX / Tooling

### 8. Consolidated "Extraction Workbench" (#7, #26)
*   **Description**: Transform `pdf-viewer.html` into a unified "Extraction Workbench" with a Visual PDF Splitter and Dual-Pane Review Workspace (Original Scan | OCR Editor).
*   **Status**: 🔄 In Progress — Initial Planning Complete. [View Plan](docs/ui/ocr/plans/extraction-workbench.md)
*   **Next**: Phase 1 Layout Refactor.
*   **Category**: UX / Productivity / Tooling
*   **Effort**: Medium

---
### Completed Quick Wins
*   [x] **Archival Image Support**: Native ingestion of .jpg, .png, and .tiff photos. (Completed 2026-02-23)
*   [x] **Archival HTML Output**: Themed "Case File" transcript generation for standalone viewing. (Completed 2026-02-23)
*   [x] **Forensic Header Parser**: Auto-extraction of archival metadata (RIF, Agency, Date, Author) with confidence scoring. (Completed 2026-02-23)

---
*These features will be the primary focus for the next sprint to demonstrate the power of the Atomic Historical Engine.*
