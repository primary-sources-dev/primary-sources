# Test Suite Quickstart Guide

This folder contains the tools needed to verify that the **Document Classification Review** tool and its feedback loop are working correctly.

---

## 🚀 1. Pre-requisites
The tests require the **OCR Server** to be running.
1. Open a terminal at your project root.
2. Run the server:
   ```powershell
   python tools/ocr_server.py
   ```

---

## 🩺 2. Quick Health Check (Recommended)
Run this script first to verify that the server is reachable and your files are in the right place.

**In PowerShell:**
```powershell
cd web/html/testing
.\verify_classifier_health.ps1
```
*This will report on your server status, UI availability, and current audit log stats.*

---

## 🧪 3. Full API Testing (Deep Verification)
Use this to perform a full end-to-end check of the data storage engine. It will create test records, verify they exist, and test de-duplication logic.

**In PowerShell/Terminal:**
```powershell
cd web/html/testing
pytest test_classifier_api.py
```

---

## 🖥️ 4. Manual UI Verification
To verify the visual components, open your browser to:
[http://localhost:5000/tools/workbench/workbench.html?file=ralphleonyatesdocumentsfull_searchable.pdf&tab=classify](http://localhost:5000/tools/workbench/workbench.html?file=ralphleonyatesdocumentsfull_searchable.pdf&tab=classify)

### Verification Checklist:
1. **Scrolling**: Do pages render as you scroll?
2. **Highlights**: Do you see yellow highlights on key agency names?
3. **Save**: Click "APPLY & SAVE" on a page. Does it auto-advance to the next card?
4. **Skip**: Click "SKIP" without notes (should block). Add note + reason preset and retry (should save and auto-advance).
5. **Reload**: Refresh the page. Does saved review state persist? (Checks LocalStorage)
6. **Log**: Check `data/classifier-feedback.json` on your computer. Does it have the new record with the `textSample`? (Checks Server Storage)
