# Classifier Review Tool: Post-Migration Implementation Plan

**Status**: ✅ COMPLETE  
**Completed**: 2026-02-25  
**Location**: `web/html/tools/classifier/`

---

## 1. Objective

Integrate the Classification Review Tool into the OCR workflow so users can review document classifications directly after OCR processing — no CLI step, no separate tool.

---

## 2. Post-Migration File Structure

```
web/html/
├── tools/
│   ├── tools-index.html              (Tools launcher hub)
│   ├── ocr/
│   │   ├── ocr-details.html          (Info page)
│   │   ├── ocr-ui.html               (Upload/Queue UI)
│   │   └── ocr-gui.js                (Frontend logic)
│   └── classifier/
│       ├── classifier-details.html   (Info page)
│       ├── classifier-ui.html        (Review UI - dynamic)
│       └── POST-MIGRATION-PLAN.md    (This file)
├── assets/
│   └── css/main.css
└── components/
    └── header.html
```

---

## 3. User Flow (Target State)

```
┌─────────────────────────────────────────────────────────────┐
│  1. UPLOAD                                                  │
│     User drops PDF into OCR tool (ocr-ui.html)              │
│                         ↓                                   │
│  2. PROCESS                                                 │
│     OCR extracts text, classifier auto-runs                 │
│                         ↓                                   │
│  3. COMPLETION                                              │
│     Queue shows: [Workbench] [View] [Review] [.TXT] [.MD]   │
│                                       ↓                     │
│  4. REVIEW (new tab)                                        │
│     Click [Review] → opens classifier-ui.html?file=doc.pdf  │
│                         ↓                                   │
│  5. VERIFY                                                  │
│     Page-by-page review with correct/incorrect feedback     │
│                         ↓                                   │
│  6. COMMIT (future)                                         │
│     Save verified data to database                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Tasks

### Task 1: Add [Review] Button to OCR UI ✅

**File**: `web/html/tools/ocr/ocr-gui.js`  
**Commit**: `fa2b907` (refactor: complete entity structure migration)

Added emerald green `[Review]` button to completed-file action row. Links to `../classifier/classifier-ui.html?file=${encodeURIComponent(file.name)}` in a new tab.

---

### Task 2: Create Dynamic classifier-ui.html ✅

**File**: `web/html/tools/classifier/classifier-ui.html`  
**Commit**: `b2ee9ba` (refactor: dynamic classifier-ui)

Rewrote from 8,075 static lines → 578 dynamic lines:
- Reads `?file=` from URL params
- Fetches `/api/review/<filename>` for per-page classification
- Dynamically renders all page cards with `renderCards()`
- PDF.js lazy-loads thumbnails from `/api/download/<filename>`
- All features preserved: feedback, filters, sorting, notes, export, localStorage

---

### Task 3: Add Server Endpoint ✅

**File**: `tools/ocr_server.py`  
**Commit**: `98582b1` (earlier session)

`GET /api/review/<filename>` — Opens PDF with PyMuPDF, runs `classify_document()` + `get_all_scores()` per page, returns structured JSON.

Also fixed `GET /api/download/<filename>` to serve inline (PDF.js needs this) while preserving `?download=true` for actual file downloads.

---

### Task 4: Auto-Classify on OCR Complete ✅

**File**: `tools/ocr_server.py`

Added classifier call to `_run_metadata_parser()` — after metadata extraction, runs `classify_document()` on the OCR text and injects `classified_type`, `classification_confidence`, and `classification_label` into `file_info["parsed_metadata"]`. The existing `renderMetadataPreview()` badge in `ocr-gui.js` renders automatically.

---

## 5. Files Summary

| Action | File | Status |
|--------|------|--------|
| **MODIFIED** | `web/html/tools/ocr/ocr-gui.js` | ✅ [Review] button added |
| **REWRITTEN** | `web/html/tools/classifier/classifier-ui.html` | ✅ Dynamic review UI (8K→578 lines) |
| **MODIFIED** | `tools/ocr_server.py` | ✅ `/api/review/`, `/api/download/` fix, auto-classify |
| **KEPT** | `tools/ocr-gui/document_classifier.py` | ✅ Unchanged |
| **DEPRECATE** | `tools/classifier_test_html.py` | 🟡 Pending deprecation notice |

---

## 6. Migration Mapping

| Current Location | New Location |
|------------------|--------------|
| `docs/ui/tools/classifier-review.html` | `web/html/tools/classifier/classifier-details.html` |
| `docs/ui/ocr/yates-classification-report.html` | Replaced by dynamic `classifier-ui.html` |
| `docs/ui/ocr/index.html` | `web/html/tools/ocr/ocr-ui.html` |
| `docs/ui/ocr/ocr-gui.js` | `web/html/tools/ocr/ocr-gui.js` |

---

## 7. Success Criteria

- [x] Migration complete (all files in `web/html/`)
- [x] [Review] button appears after OCR completion
- [x] Clicking [Review] opens `classifier-ui.html` in new tab
- [x] classifier-ui.html loads data from `/api/review/<filename>`
- [x] Page cards render with PDF.js thumbnails
- [x] Feedback buttons work (correct/incorrect)
- [x] Feedback saves to training data via `/api/feedback`
- [x] No CLI step required

---

## 8. Execution Order

1. ✅ Complete HTML migration (Phase 1-3)
2. ✅ Create `classifier-ui.html` shell with loading state
3. ✅ Add `/api/review/<filename>` endpoint to server
4. ✅ Implement JS to fetch and render classification data
5. ✅ Add [Review] button to `ocr-gui.js`
6. ✅ Auto-classify on OCR completion (badge in queue)
7. 🟡 Deprecate `classifier_test_html.py` CLI usage

---

*Plan created: 2026-02-25*  
*Completed: 2026-02-25*
