# Plan: Classifier → Document Workbench Evolution

## Phase 1: Wire Export Tab into Classifier Review UI — COMPLETE (with known gaps)

All 6 steps implemented and verified. Export tab is live with entity detection, approval, and JSON write-back.

### Files Modified

| File | Change | Status |
| ------ | -------- | -------- |
| `tools/entity_matcher.py` | Added `load_from_entity_files(data_dir)` method | DONE |
| `tools/ocr_server.py` | Fixed EntityMatcher init + added `POST /api/entities/export` endpoint | DONE |
| `web/html/tools/classifier/classifier-ui.html` | Tab CSS + HTML restructure + Export tab JS | DONE |
| `docs/CLASSIFIER-TOOL-REFERENCE.md` | Updated with Export tab docs, entity APIs, persistence model | DONE |
| `web/html/tools/classifier/classifier-details.html` | Updated features, workflow, pipeline phases, API endpoints, status | DONE |

### Verification Results

- EntityMatcher loads 82 entities from real JSON files (26 people, 2 aliases, 16 places, 38 orgs)
- `POST /api/entities/export` creates `.bak` backups, deduplicates by ID+name, reloads index
- Two-tab UI (Review + Export) operational with localStorage persistence

### Known Gaps (to address in Phase 2 or as patches)

| Gap | Severity | Notes |
| ------ | ---------- | ------- |
| `POST /api/entities/export` ignores the `action` parameter — always appends | LOW | Plan specified `"action": "append"` but the endpoint hard-codes append behavior; no `update` or `replace` path exists yet |
| No entity-type validation on export records | LOW | Endpoint accepts any JSON shape for `record`; no schema enforcement |

---

## Phase 2: Document Workbench Consolidation

### Problem

Two separate tools share one backend but have no shared state:

- **OCR Scanner** (`ocr-ui.html` + `ocr-gui.js`) — 3 tabs: SCAN, REVIEW, GUIDE
- **Classifier** (`classifier-ui.html`) — 2 tabs: REVIEW, EXPORT

A researcher scans a document in the Scanner, then manually opens it in the Classifier via URL parameter. No continuity, no shared state, duplicate file tracking logic.

### Target Architecture

A single **Document Workbench** (`workbench.html`) with 4 tabs following the document lifecycle:

```text
┌──────────┬───────────┬──────────────┬──────────┐
│  SOURCE  │  CLASSIFY │   ENTITIES   │  EXPORT  │
└──────────┴───────────┴──────────────┴──────────┘
```

| Tab | Origin | Purpose |
| ----- | -------- | --------- |
| **SOURCE** | Scanner REVIEW tab (file grid) | Select a processed file from history; shows available documents |
| **CLASSIFY** | Classifier REVIEW tab | PDF rendering + 4-tier page-level classification feedback |
| **ENTITIES** | Classifier EXPORT tab (detect section) | Entity detection, matched entities table, new candidates table, approve/reject |
| **EXPORT** | Classifier EXPORT tab (write section) | Source record preview, export to JSON files, download feedback, activity log |

**Not included in workbench:**

- Scanner SCAN tab (file upload + OCR processing) — stays in `ocr-ui.html` as a batch processing tool. OCR jobs take minutes and block the UI with polling. The workbench is for post-OCR review.
- Scanner GUIDE tab — becomes a help icon or collapsible panel in the workbench header.

### Pre-Step: Library Version Audit

Before any code extraction, audit shared library versions across both tools:

| Library | OCR Scanner Version | Classifier Version | Action |
| --------- | --------------------- | -------------------- | -------- |
| PDF.js | Check `ocr-ui.html` | Check `classifier-ui.html` | Pin to single version in workbench |
| Tailwind CSS | Check CDN link | Check CDN link | Unify |
| Any other shared libs | — | — | Inventory and resolve conflicts |

If versions differ, resolve before Step 2.1 to prevent runtime conflicts in the unified workbench.

### State Contract

```javascript
// Single shared state object replaces all scattered globals
const WorkbenchState = {
    // Active document (set by SOURCE tab, consumed by all others)
    activeFile: null,           // filename string
    pdfUrl: null,               // resolved URL for PDF.js
    pdfDoc: null,               // loaded PDF.js document object

    // Classification data (fetched from API on file selection)
    classificationData: null,   // from GET /api/review/{file}

    // User feedback (persisted to localStorage per file)
    feedback: {},               // page-level review state
    entityApprovals: {},        // entity approve/reject state

    // Transient (in-memory only, reset on file switch)
    detectedEntities: [],       // from POST /api/entities
    detectedCandidates: [],     // new entity candidates
};

// localStorage keys (scoped per file):
//   workbench_feedback_{filename}
//   workbench_export_{filename}
```

### localStorage Key Migration

The classifier used `classifier_feedback_{FILE_NAME}` and `classifier_export_{FILE_NAME}`. The workbench uses `workbench_*` keys. A one-time migration function runs on first workbench load:

```javascript
function migrateLocalStorageKeys() {
    const migrated = localStorage.getItem('workbench_migration_v1');
    if (migrated) return;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('classifier_feedback_')) {
            const file = key.replace('classifier_feedback_', '');
            localStorage.setItem(`workbench_feedback_${file}`, localStorage.getItem(key));
        }
        if (key.startsWith('classifier_export_')) {
            const file = key.replace('classifier_export_', '');
            localStorage.setItem(`workbench_export_${file}`, localStorage.getItem(key));
        }
    }
    localStorage.setItem('workbench_migration_v1', Date.now().toString());
    // Old keys left in place — classifier-ui.html still works during transition
}
```

Old `classifier_*` keys are preserved (not deleted) so that `classifier-ui.html` continues to function during the transition period. They can be cleaned up after the backward-compat redirect is confirmed stable.

### Progressive Unlock

| Tab | Enabled When | Disabled Message | Tooltip (on hover) |
| ----- | ------------- | ----------------- | -------------------- |
| SOURCE | Always | — | — |
| CLASSIFY | `activeFile` has `classificationData` | "Select a document in SOURCE" | "Select a document first" |
| ENTITIES | At least 1 page reviewed in CLASSIFY | "Review at least one page first" | "Review pages in Classify tab" |
| EXPORT | At least 1 entity approved in ENTITIES | "Approve entities before exporting" | "Approve entities first" |

Disabled tabs show a tooltip on hover explaining what prerequisite is missing. The disabled message appears as an inline banner in the tab panel area if the user somehow navigates to a locked tab (e.g., via deep-link fallback).

### File Switching

SOURCE tab shows a grid of available files from `GET /api/history`. Selecting a file:

1. **Check for unsaved work** — if the current file has unsaved work (see definition below), prompt "You have unsaved changes. Switch anyway?"
2. **Destroy previous PDF** — call `WorkbenchState.pdfDoc.destroy()` if a document is loaded (releases canvas memory, prevents PDF.js memory leaks)
3. Sets `WorkbenchState.activeFile`
4. Fetches `GET /api/review/{file}` → classification data
5. Loads PDF via `pdfjsLib.getDocument()`
6. Restores localStorage feedback/approvals for that file
7. Resets downstream tab state (detected entities cleared, candidate list emptied)
8. Auto-advances to CLASSIFY tab
9. URL updates to `workbench.html?file={filename}&tab=classify`

**"Unsaved work" is defined as:** feedback entries exist in `WorkbenchState.feedback` that have not yet been persisted via `POST /api/feedback`, OR entity approvals exist in `WorkbenchState.entityApprovals` that have not yet been exported via `POST /api/entities/export`. Each export action sets a `lastExportedAt` timestamp in localStorage; if feedback/approvals have been modified after that timestamp, work is considered unsaved.

### URL Deep-Linking

The workbench supports direct links with query params:

- `workbench.html` — opens to SOURCE tab
- `workbench.html?file=yates-searchable.pdf` — loads file, opens CLASSIFY
- `workbench.html?file=yates-searchable.pdf&tab=entities` — loads file, opens ENTITIES
- Scanner's "Review" button links to `workbench.html?file={filename}`

**Fallback when target tab is locked:** If a deep-link requests a tab whose prerequisites aren't met, the workbench:

1. Loads the file (if `?file=` is present)
2. Advances to the **highest unlocked tab** instead of the requested one
3. Shows a toast notification: "Navigated to [tab name] — [requested tab] requires [missing prerequisite]"
4. The requested `?tab=` param is preserved in the URL so a page refresh after completing prerequisites will land on the intended tab

Example: `?file=X&tab=export` when no entities approved → opens CLASSIFY tab, shows "Export requires approved entities"

### Implementation Steps

#### Step 2.1: Extract classifier JS into external module

**Prerequisite for everything else.** The classifier's 2018-line inline `<script>` must become `workbench.js` (or `classifier-workbench.js`).

- Extract all JS from `classifier-ui.html` into `web/html/assets/js/workbench.js`
- Use a **class-based architecture** (not bare IIFE) for testability and clear interfaces:

```javascript
class DocumentWorkbench {
    constructor(config) {
        this.state = { ...WorkbenchState };  // deep copy of defaults
        this.config = config;                // { fileParam, containerIds }
    }

    init() { /* bind events, check URL params, run migration */ }
    loadFile(filename) { /* fetch classification, load PDF, restore state */ }
    switchTab(name) { /* progressive unlock check, activate panel */ }
    destroy() { /* cleanup: pdfDoc.destroy(), remove listeners */ }
}

// Tab-specific logic in focused classes
class ClassifyTab { /* PDF rendering, feedback engine */ }
class EntitiesTab { /* entity detection, approve/reject */ }
class ExportTab { /* source record, JSON export */ }
```

- Replace inline event handlers (`onclick="..."`) with `addEventListener` bindings
- Expose a clean init function: `new DocumentWorkbench(config).init()`
- Verify `classifier-ui.html` works identically after extraction (regression test)

**Files:** `classifier-ui.html` (gut script blocks), new `assets/js/workbench.js`

#### Step 2.2: Build the workbench shell

Create `web/html/tools/workbench/workbench.html` with:

- Same header/footer/nav components as other tool pages
- 4-tab bar (SOURCE, CLASSIFY, ENTITIES, EXPORT)
- Tab panels as empty containers (content populated by JS)
- Progressive unlock CSS (`.tab-btn.disabled`, `.tab-locked-message`)
- Import `workbench.js` as module
- URL param handling (`?file=`, `?tab=`)

**Files:** new `workbench/workbench.html`, new `workbench/workbench.css`

#### Step 2.3: Build the SOURCE tab

**`GET /api/history` response contract** — the SOURCE tab needs these fields per file:

| Field | Currently Returned? | Notes |
| ------- | --------------------- | ------- |
| `filename` | Yes | Primary identifier |
| `page_count` | Yes | From OCR results |
| `processed_date` | Yes | Job completion timestamp |
| `status` | Yes (job status) | `completed`, `failed`, etc. |
| `review_progress` | **NO — needs backend addition** | Fraction of pages with feedback (e.g., "3/12 reviewed") |
| `export_status` | **NO — needs backend addition** | Whether source record has been exported |

**Backend change required:** Add a lightweight query to `GET /api/history` that checks for existing feedback and export records per file. This contradicts the "No Backend Changes Needed" header — that header applies to the core pipeline endpoints, but the SOURCE tab's status indicators need new response fields.

Build the SOURCE tab:

- Fetch `GET /api/history` to populate file grid
- Show each file with: filename, page count, processed date, **review status badge** (color-coded: gray = unreviewed, yellow = in progress, green = fully reviewed, blue = exported)
- Click file → load into WorkbenchState → advance to CLASSIFY
- Search/filter bar for filename
- Sort controls (by date, by status, by name)
- "Process New Document" link → opens `ocr-ui.html` in new tab

**Files:** `workbench.js` (add source module), `ocr_server.py` (extend `/api/history` response)

#### Step 2.4: Wire CLASSIFY, ENTITIES, EXPORT tabs

- Migrate classifier Review tab logic into CLASSIFY panel
- Split classifier Export tab into ENTITIES panel (detect + approve) and EXPORT panel (source record + write)
- Wire progressive unlock logic (check state before enabling tabs)
- Wire file switching (reset state, reload data)

**Files:** `workbench.js`

#### Step 2.5: Backward compatibility (with rollback)

Transition uses a **feature flag** so the redirect can be disabled without redeployment:

```javascript
// In classifier-ui.html, at top of <script>
const WORKBENCH_REDIRECT = localStorage.getItem('workbench_redirect') !== 'false';
// Default: true (redirect enabled). Set to 'false' in console to disable.
if (WORKBENCH_REDIRECT && window.location.search.includes('file=')) {
    const params = new URLSearchParams(window.location.search);
    window.location.replace(`../workbench/workbench.html?file=${params.get('file')}&tab=classify`);
}
```

Rollback: `localStorage.setItem('workbench_redirect', 'false')` in browser console disables redirect instantly.

Steps:

- `classifier-ui.html?file=X` redirects to `workbench.html?file=X&tab=classify` (controlled by flag)
- Scanner's "Review" and "Classifier" links updated to point to workbench
- Navigation menu updated (Classifier → Document Workbench)
- `classifier-details.html` updated to describe the workbench
- **Both old and new UIs coexist** during transition — old classifier remains functional with its own localStorage keys

**Files:** `classifier-ui.html`, `ocr-gui.js`, mega-menu links, `classifier-details.html`

### Risk Mitigation

| Risk | Mitigation |
| ------ | ----------- |
| Global variable conflicts during JS extraction | Class-based module pattern; test regression before proceeding |
| Scanner's batch model vs. workbench's single-file model | Keep Scanner separate; workbench only handles post-OCR review |
| Route-level scripts assume page ownership | Module boundaries; WorkbenchState as single source of truth |
| Lost work during file switching | Prompt "You have unsaved changes" if feedback modified after last export timestamp |
| Large file (2000+ lines) becoming unmanageable | External JS module keeps HTML thin; CSS in separate file |
| PDF.js memory leaks during file switching | Call `pdfDoc.destroy()` before loading new document; nullify canvas references |
| localStorage key drift between old and new UI | One-time migration function with `workbench_migration_v1` flag; old keys preserved |
| Hard redirect breaks workflow mid-session | Feature flag in localStorage; rollback via console command |

### API Endpoints

Core pipeline endpoints already exist from Phase 1. One backend change is needed for the SOURCE tab (see Step 2.3):

| Endpoint | Used By |
| ---------- | --------- |
| `GET /api/history` | SOURCE tab (file grid) |
| `GET /api/review/{file}` | CLASSIFY tab (classification data) |
| `GET /api/download/{file}` | CLASSIFY tab (PDF.js rendering) |
| `POST /api/feedback` | CLASSIFY tab (save page feedback) |
| `POST /api/entities` | ENTITIES tab (detect entities) |
| `GET /api/entities/index` | ENTITIES tab (index metadata) |
| `POST /api/entities/export` | EXPORT tab (write to JSON files) |
| `GET /api/feedback` | EXPORT tab (download feedback) |

### Verification

1. **SOURCE tab** — Shows file grid from `/api/history`; clicking a file loads it and advances to CLASSIFY
2. **CLASSIFY tab** — Identical behavior to current classifier Review tab
3. **ENTITIES tab** — Entity detection and approval works as current Export tab section 2
4. **EXPORT tab** — Source record export and new entity export works as current Export tab section 3
5. **Progressive unlock** — Tabs disabled with messages until prerequisites met
6. **File switching** — Select different file in SOURCE → all tabs reset and reload
7. **Deep linking** — `?file=X&tab=entities` loads directly to correct state
8. **Backward compat** — Old `classifier-ui.html?file=X` redirects to workbench
9. **Scanner link** — Scanner's "Review" button opens workbench with file preloaded
