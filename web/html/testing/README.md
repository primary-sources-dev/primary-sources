# Document Classification Review Tool - Test Suite

This directory contains automated tests to verify the integrity and accuracy of the **Document Classification Review** tool (`classifier-ui.html`) and its backend API.

---

## 1. Test Suite Structure

| File | Type | Purpose |
|------|------|---------|
| `test_classifier_api.py` | Python (pytest) | Verifies the `/api/feedback` and `/api/review` endpoints on the OCR server. |
| `test_classifier_integration.sh` | Bash/PS | Integration script to run a full 'Load -> Verify -> Commit' cycle. |
| `README.md` | Documentation | This file. |

---

## 2. API Tests (`test_classifier_api.py`)

These tests verify the core "Feedback Loop"—the communication between your browser and the server.

### What it tests:
- **Successful Submission**: Posting a valid classification record to the server.
- **De-duplication**: Ensuring that re-saving a page updates the record instead of creating duplicates.
- **Status Calculation**: Verifying that the server correctly increments the "Correct/Incorrect" summary counters.
- **Data Integrity**: Confirming that the `textSample` and `4-tier` metadata are preserved in the JSON audit log.

### How to Run:
Ensure the `ocr_server.py` is running first:
```powershell
# In terminal 1:
python tools/ocr_server.py

# In terminal 2:
cd web/html/testing
pytest test_classifier_api.py
```

---

## 3. Frontend Validation (Manual/Semi-automated)

Since the tool relies on `pdf.js` and canvas rendering, UI validation is best performed by checking the following:

1.  **URL Parameter Injection**: Open `classifier-ui.html?file=sample.pdf`. Verify the 'Source' badge at the top shows the filename.
2.  **Lazy Load Check**: Scroll down slowly. Verify that the "Rendering..." indicator only appears as cards enter the viewport.
3.  **Local Storage Sync**: Refresh the page (`F5`) after clicking 'Verify'. The Green/Red badges should **persist** without a server fetch.
4.  **Zoom Modal**: Click any PDF canvas. Verify it opens the high-resolution overlay.

---

## 4. Troubleshooting
If the API tests fail with a `404`, ensure the `ocr_server.py` is up to date (specifically that the `/api/feedback` route is priority-loaded before the catch-all static route).
