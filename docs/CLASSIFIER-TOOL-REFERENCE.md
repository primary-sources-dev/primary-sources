# Document Classification Review Tool - Technical Reference

This reference documents the current implementation of the classifier review tool in this repository.

## 1. Purpose
- Provide a human review layer for per-page document classification results.
- Capture reviewer corrections in a persistent feedback log for analysis/training.
- Support a 4-tier metadata review model: `Agency`, `Class`, `Format`, `Content Tags`.

## 2. Current UI + Code Locations
- **UI**: [classifier-ui.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/tools/classifier/classifier-ui.html)
- **Tool Detail Page**: [classifier-details.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/tools/classifier/classifier-details.html)
- **API Server**: [ocr_server.py](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr_server.py)
- **Persistent Feedback File**: [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json)

## 3. Data Flow
1. User opens `classifier-ui.html?file=<pdf-or-name>`.
2. UI resolves the PDF URL:
   - Uses `file` directly when it starts with `/api/` or `http`.
   - Otherwise maps to `/api/download/<file>`.
3. UI requests page classifications from `GET /api/review/<filename>`.
4. Reviewer applies 4-tier selections and clicks `APPLY & VERIFY`.
5. UI saves local state to `localStorage` and posts feedback to `POST /api/feedback`.

## 4. Implemented Features

### PDF Rendering
- Uses `pdf.js` with canvas rendering.
- Uses `IntersectionObserver` for lazy page rendering.
- Render queue is concurrency-limited to `3` pages (`MAX_CONCURRENT_RENDERS = 3`).
- Adds a text layer and highlights matched classifier patterns.
- Clicking a page opens a modal canvas view.

### Review Controls
- Per-page summary shows:
  - Predicted type
  - Agency
  - Confidence
  - Continuity marker (`CONTINUITY_FROM` pattern)
- 4-tier controls:
  - `Agency` values: `FBI`, `CIA`, `DPD`, `WC`, `HSCA`, `NARA`, `SS`, `UNKNOWN`
  - `Class` values: `REPORT`, `CABLE`, `MEMO`, `CORRESPONDENCE`, `EXHIBIT`, `TESTIMONY`, `DEPOSITION`, `AFFIDAVIT`, `TRAVEL`, `OTHER`
  - `Format` values include `FD-302`, `AIRTEL`, `TELETYPE`, `RIF`, `CABLE`, `MEMO`, `LETTER`, `ENVELOPE`, `PASSPORT`, `VISA`, `OTHER`
  - `Content Tags` as multi-select checklist
- Optional `Flag as New Document Type` checkbox
- Optional reviewer note preset/text persisted locally

### Filtering and Sorting
- Filter by type, agency, and review status.
- Sort by page number or confidence.
- Export and clear local feedback state.

## 5. API Contract (Current)

### `GET /api/review/<filename>`
Returns per-page classification payload for a PDF in `web/html/processed` (or `processed/uploads`, with `_searchable` fallback).

### `POST /api/feedback`
Stores one page-level feedback record. Required fields are currently `page` and `status`; UI also sends:
- `source`, `predictedType`, `selectedType`, `selectedAgency`, `selectedClass`, `selectedFormat`, `selectedContent`, `newTypeFlag`, `textSample`.

### `GET /api/feedback`
Returns full stored feedback object (`entries` + `summary`).

### `GET /api/feedback/corrections`
Returns grouped incorrect classifications for training analysis.

## 6. Persistence Model
- **Local**: `localStorage` key format is `classifier_feedback_<filename>`.
- **Server**: [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json).
- Server de-duplicates by `source + page` and updates summary counters (`total`, `correct`, `incorrect`).

## 7. Notes on Current Behavior
- The UI computes `textSample` (first 1000 characters) and includes it in the posted JSON body.
- Correct/incorrect status is determined by comparing selected class to predicted legacy type string.
- The tool still carries legacy doc-type compatibility alongside the 4-tier review model.

## 8. Directory & File Path Map

| Component | absolute Link |
| :--- | :--- |
| **Main UI** | [classifier-ui.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/tools/classifier/classifier-ui.html) |
| **Docs Detail** | [classifier-details.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/tools/classifier/classifier-details.html) |
| **Backend API** | [ocr_server.py](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr_server.py) |
| **Audit Log** | [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json) |
| **Health Check** | [verify_classifier_health.ps1](file:///C:/Users/willh/Desktop/primary-sources/web/html/testing/verify_classifier_health.ps1) |
| **API Test Suite** | [test_classifier_api.py](file:///C:/Users/willh/Desktop/primary-sources/web/html/testing/test_classifier_api.py) |
| **Test Quickstart**| [QUICKSTART.md](file:///C:/Users/willh/Desktop/primary-sources/web/html/testing/QUICKSTART.md) |

## 9. Training Engine (train_classifier.py)

The training engine closes the loop by turning human corrections into machine rules.

### Core Logic:
1. **Load**: Reads the master [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json).
2. **Analyze**: Groups errors by "Predicted Type" vs "Selected Type."
3. **N-Gram Mining**: Performs statistical frequency analysis on `textSample` fields to find unique phrases (e.g., "SWORN STATEMENT").
4. **Suggest**: Outputs ready-to-use Python Regex patterns that can be pasted into [document_classifier.py](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr-gui/document_classifier.py).

### Execution:
- [train_classifier.py](file:///C:/Users/willh/Desktop/primary-sources/tools/train_classifier.py) : View current accuracy stats and top error clusters.
- `python tools/train_classifier.py --suggest` : Generate a list of new patterns based on your recent audits.
