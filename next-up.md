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

### 4. PDF Splitter Utility
*   **Description**: Integrate a local drag-and-drop tool to split multi-page PDFs into individual images or smaller page ranges before OCR processing.
*   **Logic**: Uses the existing `ocr_worker.py` logic but exposed as a standalone pre-processing utility.
*   **Value**: Significantly improves the OCR workflow for large archival books/reports, allowing researchers to target specific high-value pages without waiting for 500-page batch processing.
*   **Category**: Utility / Tooling

### 5. Archival Image Support
*   **Description**: Enable the OCR tool to process standalone high-resolution image files (.jpg, .png, .tiff) directly.
*   **Logic**: Extends the `OCRWorker` to handle direct image input streams alongside PDF page-renders.
*   **Value**: Field researchers often capture single-frame "quick-snaps" rather than multi-page PDFs; this eliminates the need for manual conversion.
*   **Category**: Utility / Input

### 6. "Smart Highlight" Entity Matcher
*   **Description**: Automatically cross-reference OCR output against the existing `person` and `place` tables.
*   **Logic**: A "Lookup-First" Python script that highlights exact matches of cataloged entities in the extraction text.
*   **Value**: Instantly links documents to the "Master Knowledge Graph." If Ralph Leon Yates is mentioned, the name lights up as a verified link to his forensic profile.
*   **Category**: Assistant / Intelligent

### 7. Dual-Pane Extraction Workspace
*   **Description**: Re-architect the OCR UI into a professional side-by-side view (Archival Scan | Extraction Editor).
*   **Logic**: Uses a responsive split-pane layout to display the original source document alongside the editable markdown text.
*   **Value**: Transitions the user from a "file processor" to an "investigative editor," making manual verification of OCR text significantly faster and more accurate.
*   **Category**: UX / Productivity

### 8. Forensic Header Parser
*   **Description**: Implement pattern-recognition for standardized archival headers (e.g., FBI 302 memos and Agency RIF sheets).
*   **Logic**: Regex-based detection for "Agency," "RIF Number," and "Date" metadata strings at the top of documents.
*   **Value**: Automates the most tedious part of data entry—populating source metadata—before the researcher even reads the first paragraph.
*   **Category**: Assistant / Metadata

---
*These features will be the primary focus for the next sprint to demonstrate the power of the Atomic Historical Engine.*
