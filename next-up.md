# Next Up: Immediate Quick Wins

Based on the [Master Roadmap](./roadmap.md), these features represent the highest impact for the lowest implementation effort. They leverage existing data structures and code to provide immediate value to researchers.

---

### 1. Extraction Workbench Phase 4 (Commit)
*   **Description**: Persist the work done in the Extraction Workbench. Implement backend logic to save verified text and extracted segments to the database.
*   **Logic**: Create `POST /api/commit` in `ocr-server.py`. Insert text into appropriate research tables.
*   **Value**: Complete the loop from raw scan to verified digital record.
*   **Category**: Utility / OCR / Tooling
*   **Effort**: Medium

---

## Research Assistant Features

### 2. "On This Day" (OTD) Dashboard (#26)
*   **Description**: An automated widget on the home page highlighting historical events that occurred on today's month/day in previous years.
*   **Logic**: SQL/JSON filter: `WHERE month = current_month AND day = current_day`.
*   **Value**: Encourages daily engagement and surfaces deep archive content without requiring manual curation.
*   **Category**: Assistant / Engagement
*   **Effort**: Low (date filtering)

---


---
### Completed Quick Wins (2026-02-23 Marathon)
*   [x] **Archival Image Support**: Native ingestion of .jpg, .png, .tiff, .webp photos.
*   [x] **Extraction Workbench (Phases 1-3)**: Dual-pane UI, Deep Sync coordinate mapping, and visual PDF splitter.
*   [x] **Forensic Header Parser**: Auto-extraction of archival metadata (RIF, Agency, Date, Author) with confidence scoring.
*   [x] **Footer Parser (FBI 302)**: Agent name and file number extraction from document footers.
*   [x] **Mobile Photos (.heic)**: iPhone photo uploads without conversion via pillow-heif.
*   [x] **Age-at-Event Badge**: SQL function + view for calculating person's age at any event.
*   [x] **Auto-Generated Citations**: Chicago, MLA, APA, NARA citation formats from source metadata.
*   [x] **Inflation Converter**: Historical USD → 2026 purchasing power with CPI data (1913-2026).
*   [x] **Entity Matching**: Auto-link OCR text to known persons, places, and orgs with entities.json sidecar.

---
*These features will be the primary focus for the next sprint to demonstrate the power of the Atomic Historical Engine.*
