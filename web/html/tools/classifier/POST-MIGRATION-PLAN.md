# Classifier Review Tool: Post-Migration Implementation Plan

**Status**: 🟡 PENDING (Execute after HTML migration complete)  
**Prerequisite**: `html-migration.md` Phase 1-3 complete  
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

### Task 1: Add [Review] Button to OCR UI

**File**: `web/html/tools/ocr/ocr-gui.js`

**Location**: Inside `isCompleted` block (after Workbench/View buttons)

**Code**:
```javascript
<a href="../classifier/classifier-ui.html?file=${encodeURIComponent(file.name)}" 
   target="_blank" 
   class="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 px-3 py-1.5 hover:bg-emerald-500 hover:text-archive-bg transition-all flex items-center gap-1"
   title="Review Classification">
    <span class="material-symbols-outlined text-sm">fact_check</span> Review
</a>
```

---

### Task 2: Create Dynamic classifier-ui.html

**File**: `web/html/tools/classifier/classifier-ui.html`

**Behavior**:
1. Read `?file=` parameter from URL
2. Fetch classification data from `/api/review/<filename>`
3. Render page cards with PDF.js thumbnails
4. Enable feedback buttons (correct/incorrect/override)

**Base from**: Reuse HTML/CSS/JS from current `classifier_test_html.py` output  
**Key change**: Instead of static HTML, fetch data dynamically via API

**Structure**:
```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <!-- Standard head (Tailwind, fonts, main.css) -->
</head>
<body>
    <header data-component="header"></header>
    
    <main id="review-container" class="max-w-6xl mx-auto p-6">
        <!-- Loading state -->
        <div id="loading">Loading classification data...</div>
        
        <!-- Cards injected here by JS -->
    </main>
    
    <script>
        // 1. Get filename from URL params
        // 2. Fetch /api/review/<filename>
        // 3. Render page cards
        // 4. Setup feedback handlers
    </script>
</body>
</html>
```

---

### Task 3: Add Server Endpoint

**File**: `tools/ocr_server.py`

**Endpoint**: `GET /api/review/<filename>`

**Response**: JSON with per-page classification data

```python
@app.route("/api/review/<filename>")
def review_endpoint(filename):
    """Return classification data for all pages in a PDF."""
    pdf_path = os.path.join(PROCESSED_DIR, filename)
    
    if not os.path.exists(pdf_path):
        return jsonify({"error": "File not found"}), 404
    
    # Run classifier on each page
    results = []
    doc = fitz.open(pdf_path)
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        classification = classify_document(text)
        
        results.append({
            "page": page_num + 1,
            "page_index": page_num,
            "doc_type": classification.doc_type.value,
            "confidence": classification.confidence,
            "matched_patterns": classification.matched_patterns[:5],
            "all_scores": get_all_scores(text),
        })
    
    return jsonify({
        "filename": filename,
        "total_pages": len(results),
        "pages": results
    })
```

---

### Task 4: Auto-Classify on OCR Complete

**File**: `tools/ocr_server.py`

**Location**: After OCR text extraction completes

**Code**:
```python
# After OCR completes, run classifier
if CLASSIFIER_AVAILABLE:
    classification = classify_document(extracted_text)
    result['classified_type'] = classification.doc_type.value
    result['classification_confidence'] = classification.confidence
```

This enables the classification badge in the OCR queue (already partially implemented).

---

## 5. Files Summary

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `web/html/tools/ocr/ocr-gui.js` | Add [Review] button |
| **CREATE** | `web/html/tools/classifier/classifier-ui.html` | Dynamic review UI |
| **MODIFY** | `tools/ocr_server.py` | Add `/api/review/<filename>` endpoint |
| **MODIFY** | `tools/ocr_server.py` | Auto-classify after OCR |
| **KEEP** | `tools/ocr-gui/document_classifier.py` | Classifier logic (unchanged) |
| **DEPRECATE** | `tools/classifier_test_html.py` | CLI generator (no longer needed) |

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

- [ ] Migration complete (all files in `web/html/`)
- [ ] [Review] button appears after OCR completion
- [ ] Clicking [Review] opens `classifier-ui.html` in new tab
- [ ] classifier-ui.html loads data from `/api/review/<filename>`
- [ ] Page cards render with PDF.js thumbnails
- [ ] Feedback buttons work (correct/incorrect)
- [ ] Feedback saves to training data via `/api/feedback`
- [ ] No CLI step required

---

## 8. Execution Order

1. ✅ Complete HTML migration (Phase 1-3)
2. Create `classifier-ui.html` shell with loading state
3. Add `/api/review/<filename>` endpoint to server
4. Implement JS to fetch and render classification data
5. Add [Review] button to `ocr-gui.js`
6. Test end-to-end flow
7. Deprecate `classifier_test_html.py` CLI usage

---

*Plan created: 2026-02-25*  
*Execute after: HTML Migration complete*
