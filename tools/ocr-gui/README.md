# OCR GUI Tool

A desktop application for batch OCR processing of archival PDF documents.

## Features

- **Drag-and-drop** file queue
- **Dual backend support**: WSL (ocrmypdf) or Python (pytesseract)
- **Batch processing** with progress tracking
- **Output options**: Searchable PDF, plain text, or both
- **OCR settings**: Deskew, clean, force OCR
- **Auto-opens** output folder on completion

## Installation

```powershell
cd tools/ocr-gui
pip install -r requirements.txt
```

### For WSL Backend (Recommended)

Ensure ocrmypdf is installed in WSL:

```bash
wsl sudo apt update && sudo apt install -y ocrmypdf
```

### For Python Backend

Ensure Tesseract and Poppler are installed:

```powershell
winget install -e --id UB-Mannheim.TesseractOCR
winget install -e --id oschwartz10612.Poppler
```

## Usage

```powershell
cd tools/ocr-gui
python ocr_gui.py
```

Or use the launcher:

```powershell
.\tools\ocr-gui\run.bat
```

## Screenshot

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMARY SOURCES — OCR TOOL                                     │
├─────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────┐   │
│   │         Drop PDF files here or click Browse             │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─ Queue ────────────────────────────────────────────────┐   │
│   │  ✓  document-1.pdf                          Complete   │   │
│   │  ◐  document-2.pdf                          47%        │   │
│   │  ○  document-3.pdf                          Pending    │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─ Settings ─────────────────────────────────────────────┐   │
│   │  Backend: (●) WSL  ( ) Python                          │   │
│   │  Output:  [✓] Searchable PDF  [✓] Plain Text           │   │
│   │  Options: [✓] Deskew  [✓] Clean  [ ] Force OCR         │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─ Log ──────────────────────────────────────────────────┐   │
│   │  [14:23:01] Processing page 47/312...                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│            [ Start OCR ]           [ Cancel ]                   │
└─────────────────────────────────────────────────────────────────┘
```
