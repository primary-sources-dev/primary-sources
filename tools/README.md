# Primary Sources — Tools

Utilities for processing raw materials and managing the research vault.

---

## OCR Tools

### Web Interface (Recommended)

Modern web-based OCR tool with drag-drop file handling.

**Start the server:**
```bash
python tools/ocr-server.py
```

**Open in browser:**
```
http://localhost:5000
```

**Features:**
- Drag-and-drop PDF upload
- Backend selection (WSL ocrmypdf / Python pytesseract)
- Real-time progress tracking
- Queue management with tab navigation

**Frontend location:** `docs/ui/ocr/` (follows project style guide)

### Desktop GUI

Python tkinter desktop application for OCR processing.

**Run:**
```bash
python tools/ocr-gui/ocr_gui.py
```

Or double-click `tools/ocr-gui/run.bat`.

**Install dependencies:**
```bash
pip install -r tools/ocr-gui/requirements.txt
```

---

## File Structure

```
tools/
├── ocr-server.py        # Flask web server for OCR UI
├── ocr-gui/             # Desktop GUI (tkinter)
│   ├── ocr_gui.py       # Main GUI application
│   ├── ocr_worker.py    # OCR processing backend
│   ├── requirements.txt
│   └── run.bat
├── scan_pdf.py          # CLI PDF text extraction
├── notes.md             # Entity extraction pipeline documentation
└── README.md            # This file

docs/ui/ocr/             # Web UI frontend (served by ocr-server.py)
├── index.html
├── ocr-gui.css
└── ocr-gui.js
```

---

## Entity Extraction

See `tools/notes.md` for the detailed workflow on extracting entities from OCR'd documents.

**Quick reference:**
1. OCR your PDF → `raw-material/[source]/[doc]_searchable.pdf`
2. Read and extract entities following the schema in `notes.md`
3. Output to → `raw-material/[source]/[source]_entities.json`
4. Merge into → `docs/ui/assets/data/*.json` (UI) or database (SQL)

---

## Requirements

**OCR Web Server:**
```bash
pip install flask werkzeug
```

**Desktop GUI:**
```bash
pip install customtkinter pytesseract pdf2image Pillow
```

**OCR Backends:**
- **WSL (recommended):** `sudo apt install ocrmypdf`
- **Python:** `pip install pytesseract` + Tesseract installation
