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

### Review Tab

1. User opens `classifier-ui.html?file=<pdf-or-name>`.
2. UI resolves the PDF URL:
   - Uses `file` directly when it starts with `/api/` or `http`.
   - Otherwise maps to `/api/download/<file>`.
3. UI requests page classifications from `GET /api/review/<filename>`.
4. Reviewer applies 4-tier selections and clicks `APPLY & VERIFY`.
5. UI saves local state to `localStorage` and posts feedback to `POST /api/feedback`.

### Export Tab

1. User switches to the Export tab.
2. Source Record Preview auto-populates from reviewed page feedback (most-frequent agency/class/format, union of content tags).
3. User clicks **Detect Entities** → UI sends concatenated page text to `POST /api/entities` → matched entities and new candidates display in review tables.
4. User approves/rejects matched entities and new candidates (state persisted to `localStorage`).
5. **Export Source Record** → builds a `sources.json` entry with approved entities attached → `POST /api/entities/export`.
6. **Export New Entities** → writes approved candidates to `people.json`, `places.json`, or `organizations.json` via `POST /api/entities/export`.

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
  - `Content Tags`: `WITNESS_INTERVIEW`, `FORENSIC_ANALYSIS`, `BALLISTICS`, `SURVEILLANCE`, `INVESTIGATIVE_SUMM`, `AUTOPSY_REPORT`, `SECURITY_CLEARANCE`, `POLYGRAPH_EXAM`, `TIPS_AND_LEADS`, `ADMINISTRATIVE`, `CORRESPONDENCE`, `SEARCH_WARRANT`
- Optional `Flag as New Document Type` checkbox
- Optional reviewer note preset/text persisted locally

### Filtering and Sorting

- Filter by type, agency, and review status.
- Sort by page number or confidence.
- Export and clear local feedback state.

### Export Tab (Entity Export Pipeline)

- **Tab system**: Two-tab UI — Review (page-level classification) and Export (document-level entity export).
- **Source Record Preview**: Aggregates page-level feedback into a single source record. Auto-computes most-frequent agency, class, format, and union of content tags.
- **Entity Detection**: Calls `POST /api/entities` with concatenated page text. Displays matched entities (people, places, orgs) in a review table with confidence scores and match method.
- **New Candidates**: Shows proper nouns not found in the entity index as potential new entities.
- **Approve/Reject**: Per-entity approval controls. State persisted to `localStorage`.
- **Export Source Record**: Writes an aggregated source record to `sources.json` with approved entities attached as people/orgs/places arrays.
- **Export New Entities**: Writes approved candidate entities to their respective JSON files (`people.json`, `places.json`, `organizations.json`).
- **Backup Safety**: All exports create `.bak` files before writing. Duplicate detection by ID and name prevents re-export.
- **Export Log**: Timestamped activity log visible in the UI.

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

### `POST /api/entities` (Entity Detection)

Scans OCR text against the entity index (people, places, orgs). Request: `{ text, filename, include_candidates }`. Returns matched entities with confidence scores and optionally new candidate proper nouns.

### `GET /api/entities/index`

Returns metadata about the loaded entity index (total count + breakdown by type).

### `POST /api/entities/export` (Entity Export)

Writes a new entity record to one of 6 JSON data files. Request: `{ target_file, record, action }`. Allowed targets: `sources.json`, `people.json`, `organizations.json`, `places.json`, `objects.json`, `events.json`. Creates `.bak` backup before writing. Checks duplicates by ID and name. Reloads the EntityMatcher index if people/places/orgs files are modified.

## 6. Persistence Model

- **Local (Review)**: `localStorage` key `classifier_feedback_<filename>` — page-level review state.
- **Local (Export)**: `localStorage` key `classifier_export_<filename>` — entity approval state (approve/reject per entity).
- **Server (Feedback)**: [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json) — de-duplicates by `source + page`, updates summary counters.
- **Server (Entity Data)**: JSON files in `web/html/assets/data/` — `sources.json`, `people.json`, `organizations.json`, `places.json`, `objects.json`, `events.json`. The `/api/entities/export` endpoint appends records with `.bak` backup and duplicate detection.

## 7. Notes on Current Behavior

- The UI computes `textSample` (first 1000 characters) and includes it in the posted JSON body.
- Correct/incorrect status is determined by comparing selected class to predicted legacy type string.
- The tool still carries legacy doc-type compatibility alongside the 4-tier review model.

## 8. Directory & File Path Map

| Component | Absolute Link |
| :--- | :--- |
| **Main UI** | [classifier-ui.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/tools/classifier/classifier-ui.html) |
| **Docs Detail** | [classifier-details.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/tools/classifier/classifier-details.html) |
| **Backend API** | [ocr_server.py](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr_server.py) |
| **Entity Matcher** | [entity_matcher.py](file:///C:/Users/willh/Desktop/primary-sources/tools/entity_matcher.py) |
| **Entity Linker** | [entity_linker.py](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr-gui/entity_linker.py) |
| **Audit Log** | [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json) |
| **Entity Data** | [web/html/assets/data/](file:///C:/Users/willh/Desktop/primary-sources/web/html/assets/data/) |
| **Health Check** | [verify_classifier_health.ps1](file:///C:/Users/willh/Desktop/primary-sources/web/html/testing/verify_classifier_health.ps1) |
| **API Test Suite** | [test_classifier_api.py](file:///C:/Users/willh/Desktop/primary-sources/web/html/testing/test_classifier_api.py) |
| **Test Quickstart** | [QUICKSTART.md](file:///C:/Users/willh/Desktop/primary-sources/web/html/testing/QUICKSTART.md) |

## 9. Training Engine (train_classifier.py)

The training engine closes the loop by turning human corrections into machine rules.

### Core Logic

1. **Load**: Reads the master [classifier-feedback.json](file:///C:/Users/willh/Desktop/primary-sources/data/classifier-feedback.json).
2. **Analyze**: Groups errors by "Predicted Type" vs "Selected Type."
3. **N-Gram Mining**: Performs statistical frequency analysis on `textSample` fields to find unique phrases (e.g., "SWORN STATEMENT").
4. **Suggest**: Outputs ready-to-use Python Regex patterns that can be pasted into [document_classifier.py](file:///C:/Users/willh/Desktop/primary-sources/tools/ocr-gui/document_classifier.py).

### Execution

- [train_classifier.py](file:///C:/Users/willh/Desktop/primary-sources/tools/train_classifier.py) : View current accuracy stats and top error clusters.
- `python tools/train_classifier.py --suggest` : Generate a list of new patterns based on your recent audits.
