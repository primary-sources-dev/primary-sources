# Implementation Plan: Extraction Workbench (Forensic Mode)

**Objective**: Transform `pdf-viewer.html` into a dual-pane "Extraction Workbench" that synchronizes original scans with OCR data for verification, surgical splitting, and database committing.

- **Status**: Proposed
- **Priority**: High (UX Foundation)
- **Workorder ID**: WO-OCR-007

## 1. Architectural Changes

### Changes (Modifications)
*   **`pdf-viewer.html`**:
    *   Change from a single-column layout to a **Dynamic CSS Grid** layout.
    *   Introduce `?mode=workbench` and `?mode=view` URL parameters to toggle UI state.
    *   Update `Toolbar` to include "Workbench" only controls (Split, Edit, Commit).
*   **`ocr_worker.py`**:
    *   Update `_process_python` and `_process_wsl` to output a **Coordinate Map JSON** (word-level or line-level coordinates) alongside the `.txt` and `.html` files.

### Additions (New Features)
*   **Dual-Pane Engine**: A JavaScript module that calculates the scroll ratio. If you scroll to line 50 on the right, the PDF on the left pans to the exact bounding box of those coordinates.
*   **The "Surgical" Splitter**: A thumbnail-based sidebar in the viewer that allows users to select specific pages and POST them to `/api/jobs` without leaving the viewer.
*   **Extraction Editor**: A Monaco-style text editor on the right pane that supports custom "Archive Tags" (links to people/places).

### Deletions (Redundancy)
*   Remove basic text-only preview from `ocr/index.html` once the Workbench is stable (users will review in the professional viewer instead).

---

## 2. Implementation Phases

### Phase 1: The Split-Screen Foundation
1.  Refactor `pdf-viewer.html` CSS to use a `grid-template-areas` approach.
2.  Implement "Reading Mode" (full width) as the default.
3.  Implement "Workbench Mode" (50/50 split) triggered by a toolbar toggle.
4.  Add a generic "Notes" area to the right pane as a placeholder for the OCR text.

### Phase 2: Coordinate-Aware OCR (Backend)
1.  Modify the Python OCR pipeline to generate `[filename].ocr.json`.
2.  Data Structure: `{ "page": 1, "lines": [ { "text": "...", "bbox": [x1, y1, x2, y2] } ] }`.
3.  Update the File Download API to support this new forensic JSON type.

### Phase 3: The "Deep Sync" (UX)
1.  Implement the **Click-to-Zoom** feature: Clicking any line in the text editor sends an event to the PDF canvas to re-center and zoom on that coordinate.
2.  Implement **Hovers**: Hovering over an OCR line highlights the matching area on the physical document in red/gold.
3.  Build the **Thumbnail Splitter**: A sidebar showing every PDF page with a checkbox for "Add to Scan Queue."

### Phase 4: The Database Bridge (Commit)
1.  Add a "Commit" button in the Workbench.
2.  Implement a POST endpoint that takes the verified metadata and text and inserts it into the `source_excerpt` master table.
3.  Visual confirmation: The Workbench "stamps" the document as **VERIFIED**.

---

## 3. Success Criteria
- [ ] Researcher can open a 200-page file and select 5 pages for scanning within the viewer.
- [ ] Clicking a word in the transcription pane zooms the PDF exactly to that word.
- [ ] Viewer handles "Archival Mode" (Full Screen) for public users without showing the workbench tools.
- [ ] No data enters the final database without a "Workbench Verification" flag.
