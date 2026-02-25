# Integration Plan: Classifier Review in OCR Tool

**Objective**: Add [Review] button to OCR completion flow that opens classification review in new tab.

- **Status**: Proposed
- **Priority**: High
- **Related**: `classifier-review-tool.md`, `extraction-workbench.md`

---

## 1. User Flow

```
Upload PDF → OCR Process → Auto-Classify → Completion
                                               ↓
                          [Workbench] [View] [Review] [.TXT] [.MD] [.HTML]
                                               ↓
                              Opens classification review in NEW TAB
                                               ↓
                          Page-by-page review with feedback buttons
```

---

## 2. Implementation Steps

### Phase 1: Add Review Button (Frontend)

**File**: `docs/ui/ocr/ocr-gui.js`

Add to the `isCompleted` button block (after Workbench/View buttons):

```javascript
<a href="/api/review/${file.name}" target="_blank" 
   class="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 px-3 py-1.5 hover:bg-emerald-500 hover:text-archive-bg transition-all flex items-center gap-1"
   title="Review Classification">
    <span class="material-symbols-outlined text-sm">fact_check</span> Review
</a>
```

### Phase 2: Server Endpoint (Backend)

**File**: `tools/ocr_server.py`

Add endpoint that generates review HTML on-demand:

```python
@app.route("/api/review/<filename>")
def review_endpoint(filename):
    """
    Generate classification review page for a processed PDF.
    Returns HTML with page-by-page classification cards.
    """
    pdf_path = f"processed/{filename}"
    # Run classifier on each page
    # Generate HTML (reuse classifier_test_html.py logic)
    # Return as HTML response
```

### Phase 3: Auto-Classification on OCR Complete

**File**: `tools/ocr_server.py`

After OCR completes, automatically run classifier:

```python
# In process_file() or equivalent:
ocr_result = run_ocr(file)
classification = classify_document(ocr_result.text)

# Store classification with result
result['classified_type'] = classification.doc_type.value
result['classification_confidence'] = classification.confidence
result['classification_pages'] = [...]  # Per-page results
```

---

## 3. Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OCR Tool UI   │────▶│   ocr_server    │────▶│   classifier    │
│  (ocr-gui.js)   │     │   (Flask)       │     │   (Python)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │ [Review] click        │ /api/review/file.pdf  │
        │──────────────────────▶│──────────────────────▶│
        │                       │   classify pages      │
        │                       │◀──────────────────────│
        │    HTML response      │   generate HTML       │
        │◀──────────────────────│                       │
        │                       │                       │
        ▼                       │                       │
   NEW TAB: Review UI           │                       │
```

---

## 4. Data Flow

1. **Upload**: User drops PDF into OCR tool
2. **OCR**: Server extracts text from each page
3. **Classify**: Server auto-runs classifier on extracted text
4. **Store**: Classification results stored with OCR job
5. **Display**: Completion shows [Review] button
6. **Review**: Click opens `/api/review/filename.pdf` in new tab
7. **Render**: Server generates review HTML with:
   - Page thumbnails (PDF.js)
   - Classification per page
   - Confidence scores
   - Correct/Incorrect buttons
   - Type override dropdown
8. **Feedback**: User actions POST to `/api/feedback`

---

## 5. Files Modified

| File | Change |
|------|--------|
| `ocr-gui.js` | Add [Review] button to completion state |
| `ocr_server.py` | Add `/api/review/<filename>` endpoint |
| `ocr_server.py` | Auto-classify after OCR completes |
| `classifier_test_html.py` | Refactor HTML generation into reusable function |

---

## 6. Success Criteria

- [ ] [Review] button appears after OCR completion
- [ ] Clicking opens classification review in new tab
- [ ] Review shows all pages with classifications
- [ ] Feedback buttons work (correct/incorrect)
- [ ] Feedback saves to training data
- [ ] No separate CLI step required

---

## 7. Future Enhancements

- Badge on [Review] button showing "X pages need attention"
- Filter to show only low-confidence pages
- Batch review across multiple completed files
- Integration with Extraction Workbench
