# Next Up: Immediate Quick Wins

Based on the [Master Roadmap](./roadmap.md), these three features represent the highest impact for the lowest implementation effort. They leverage existing data structures to provide immediate value to researchers.

---

### 1. Age-at-Event Badge (#25)
*   **Description**: Automatically calculate and display a person's exact age next to their name on any event or document page.
*   **Logic**: `event_date` - `birth_date` = Age.
*   **Value**: Instantly humanizes the data. Seeing that a key witness was only 19 years old qualitatively changes how a researcher views their testimony.
*   **Category**: Assistant / Forensic

### 2. Inflation Converter (#26)
*   **Description**: A toggle or hover interaction on any historical currency value (e.g., in FBI reports or cultural ads) that shows its modern purchasing power.
*   **Logic**: Static CPI (Consumer Price Index) multiplier applied to `assertion_value`.
*   **Value**: Provides a "time-machine" perspective on the 1960s economy, making historical prices (like a $25.00 rifle or a $0.30 gallon of gas) relatable to a 2026 user.
*   **Category**: Assistant / Culture

### 3. "On This Day" (OTD) Dashboard (#24)
*   **Description**: An automated widget on the home page highlighting historical events that occurred on today's month/day in previous years.
*   **Logic**: SQL/JSON filter: `WHERE month = current_month AND day = current_day`.
*   **Value**: Encourages daily engagement and surfaces deep archive content without requiring manual curation.
*   **Category**: Assistant / Engagement

### 4. Consolidated "Extraction Workbench" (#7, #26)
*   **Description**: Transform the existing `pdf-viewer.html` into a unified "Extraction Workbench" featuring a Visual PDF Splitter (for targeting specific pages) and a Dual-Pane Review Workspace (Original Scan | OCR Editor).
*   **Logic**: Uses **PDF.js** for thumbnail selection (Splitter) and a responsive CSS Grid layout for the side-by-side reconstruction workspace.
*   **Value**: Eliminates "context fatigue" by keeping the entire archival intake process—splitting, processing, and entity verification—within a single, high-performance UI.
*   **Category**: UX / Productivity / Tooling

### 5. Archival Image Support
*   [x] **#5: Archival Image Support**: Enable the OCR tool to process standalone high-resolution image files (.jpg, .png, .tiff) directly.
*   **Logic**: Extends the `OCRWorker` to handle direct image input streams alongside PDF page-renders.
*   **Value**: Field researchers often capture single-frame "quick-snaps" rather than multi-page PDFs; this eliminates the need for manual conversion.
*   **Category**: Utility / Input

### 6. "Smart Highlight" Entity Matcher
*   **Description**: Automatically cross-reference OCR output against the existing `person` and `place` tables.
*   **Logic**: A "Lookup-First" Python script that highlights exact matches of cataloged entities in the extraction text.
*   **Value**: Instantly links documents to the "Master Knowledge Graph." If Ralph Leon Yates is mentioned, the name lights up as a verified link to his forensic profile.
*   **Category**: Assistant / Intelligent

### 7. Forensic Header Parser
*   **Description**: Implement pattern-recognition for standardized archival headers (e.g., FBI 302 memos and Agency RIF sheets).
*   **Logic**: Regex-based detection for "Agency," "RIF Number," and "Date" metadata strings at the top of documents.
*   **Value**: Automates the most tedious part of data entry—populating source metadata—before the researcher even reads the first paragraph.
*   **Category**: Assistant / Metadata

---
*These features will be the primary focus for the next sprint to demonstrate the power of the Atomic Historical Engine.*
