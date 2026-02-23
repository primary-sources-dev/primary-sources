# OCR Pipeline Setup Guide for Primary Sources

This guide documents the complete workflow for turning scanned PDF images into searchable text and integrating them into the Research Vault database.

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Tool Installation](#2-tool-installation)
3. [GUI Tool (Recommended)](#3-gui-tool-recommended)
4. [Single-File Processing (CLI)](#4-single-file-processing-cli)
5. [Batch Processing Scripts](#5-batch-processing-scripts)
6. [Output Organization](#6-output-organization)
7. [Quality Control](#7-quality-control)
8. [Database Integration](#8-database-integration)

---

## Quick Start

For most users, the **GUI tool** is the easiest way to process PDFs:

```powershell
cd tools/ocr-gui
pip install -r requirements.txt
python ocr_gui.py
```

See [Section 3](#3-gui-tool-recommended) for details.

---

## 1. Pipeline Overview

### Workflow Stages

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Raw PDF Scans  │ ──▶ │   OCR Process   │ ──▶ │  Quality Check  │ ──▶ │ Database Entry  │
│  (raw-material/)│     │  (searchable +  │     │  (spot-check    │     │ (source →       │
│                 │     │   plain text)   │     │   accuracy)     │     │  source_excerpt)│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Output Types

| Output | Format | Purpose |
|--------|--------|---------|
| **Searchable PDF** | `.pdf` | Preserves original appearance with invisible text layer; use for reading/citation |
| **Plain Text** | `.txt` | Raw extracted text with page markers; use for full-text search and data entry |

### Raw Materials Inventory

| Collection | Location | Files | Status |
|------------|----------|-------|--------|
| Warren Commission | `raw-material/warren-commission/` | 26 volumes | Downloaded |
| HSCA | `raw-material/hsca/` | 14 volumes + reports | Downloaded |
| Church Committee | `raw-material/church-committee/` | 5 books | Downloaded |
| Garrison Papers | `raw-material/garrison/` | Planned (~25 files) | Not downloaded |
| Yates Documents | `yates/` | 1 file | OCR complete |

---

## 2. Tool Installation

### Method A: OCRmyPDF via WSL (Recommended)

The most robust method for archival documents. Produces both searchable PDFs and handles image preprocessing.

**Prerequisites:**
- WSL (Ubuntu) installed
- Administrative privileges (`sudo` access)

**Installation:**
```bash
sudo apt update && sudo apt install -y ocrmypdf
```

**Key Features:**
- `--deskew`: Straightens crooked scanned pages
- `--clean`: Removes noise/specks from old photocopies
- `--force-ocr`: Forces processing if file has partial (bad) text layer
- `--sidecar`: Outputs plain text alongside the searchable PDF

### Method B: Python Script (Windows-Native)

Simpler installation, outputs plain text only.

**Prerequisites:**
```powershell
# 1. Install Tesseract OCR engine
winget install -e --id UB-Mannheim.TesseractOCR

# 2. Install Poppler (PDF rendering)
winget install -e --id oschwartz10612.Poppler

# 3. Install Python libraries
pip install pytesseract pdf2image
```

**Add Tesseract to PATH (per session):**
```powershell
$env:Path += ";C:\Program Files\Tesseract-OCR"
```

---

## 3. GUI Tool (Recommended)

The OCR GUI provides a visual interface for batch processing without command-line usage.

### Installation

```powershell
cd tools/ocr-gui
pip install -r requirements.txt
```

### Running the GUI

```powershell
python tools/ocr-gui/ocr_gui.py
```

Or double-click `tools/ocr-gui/run.bat`.

### Features

| Feature | Description |
|---------|-------------|
| **File Queue** | Add multiple PDFs via Browse button or drag-and-drop |
| **Backend Selection** | Choose WSL (ocrmypdf) or Python (pytesseract) |
| **Output Options** | Searchable PDF, plain text, or both |
| **OCR Settings** | Deskew, clean, force OCR toggles |
| **Progress Tracking** | Per-file percentage and status indicators |
| **Log Panel** | Real-time processing output |
| **Auto-open** | Opens output folder when batch completes |

### Interface

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
│            [ Start OCR ]           [ Cancel ]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Single-File Processing (CLI)

### Using OCRmyPDF (WSL)

```bash
# Basic: Create searchable PDF
ocrmypdf input.pdf output_searchable.pdf

# With preprocessing (recommended for archival scans)
ocrmypdf --deskew --clean input.pdf output_searchable.pdf

# With plain text sidecar output
ocrmypdf --deskew --clean --sidecar output.txt input.pdf output_searchable.pdf

# Force re-OCR on already-processed PDFs
ocrmypdf --force-ocr --deskew --clean input.pdf output_searchable.pdf
```

### Using Python Script (Windows)

Save as `raw-material/scripts/ocr_tool.py`:

```python
import pytesseract
from pdf2image import convert_from_path
import os
import sys

# Poppler path (adjust if your installation differs)
poppler_path = r"C:\Users\willh\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin"

def run_ocr(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return

    try:
        images = convert_from_path(pdf_path, poppler_path=poppler_path)
        full_text = ""
        for i, image in enumerate(images):
            print(f"Scanning page {i+1}/{len(images)}...")
            text = pytesseract.image_to_string(image)
            full_text += f"\n\n--- PAGE {i+1} ---\n\n{text}"
            
        output_filename = os.path.splitext(pdf_path)[0] + "_ocr.txt"
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"SUCCESS! Text extracted to: {output_filename}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ocr_tool.py <path_to_pdf>")
    else:
        run_ocr(sys.argv[1])
```

**Usage:**
```powershell
python raw-material/scripts/ocr_tool.py "raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-1.pdf"
```

---

## 5. Batch Processing Scripts (CLI)

### Warren Commission (26 Volumes)

Save as `raw-material/scripts/ocr_warren_batch.sh` (run in WSL):

```bash
#!/bin/bash
# Batch OCR for Warren Commission volumes

INPUT_DIR="/mnt/c/Users/willh/Desktop/primary-sources/raw-material/warren-commission"
OUTPUT_DIR="/mnt/c/Users/willh/Desktop/primary-sources/processed/warren-commission"

mkdir -p "$OUTPUT_DIR"

for pdf in "$INPUT_DIR"/GPO-WARRENCOMMISSIONHEARINGS-*.pdf; do
    filename=$(basename "$pdf" .pdf)
    output_pdf="$OUTPUT_DIR/${filename}_searchable.pdf"
    output_txt="$OUTPUT_DIR/${filename}.txt"
    
    if [ -f "$output_pdf" ]; then
        echo "Skipping $filename (already processed)"
        continue
    fi
    
    echo "Processing $filename..."
    ocrmypdf --deskew --clean --sidecar "$output_txt" "$pdf" "$output_pdf"
    echo "Completed: $filename"
done

echo "Warren Commission batch complete."
```

### HSCA (14 Volumes + Reports)

Save as `raw-material/scripts/ocr_hsca_batch.sh`:

```bash
#!/bin/bash
# Batch OCR for HSCA volumes

INPUT_DIR="/mnt/c/Users/willh/Desktop/primary-sources/raw-material/hsca"
OUTPUT_DIR="/mnt/c/Users/willh/Desktop/primary-sources/processed/hsca"

mkdir -p "$OUTPUT_DIR"

for pdf in "$INPUT_DIR"/*.pdf; do
    filename=$(basename "$pdf" .pdf)
    output_pdf="$OUTPUT_DIR/${filename}_searchable.pdf"
    output_txt="$OUTPUT_DIR/${filename}.txt"
    
    if [ -f "$output_pdf" ]; then
        echo "Skipping $filename (already processed)"
        continue
    fi
    
    echo "Processing $filename..."
    ocrmypdf --deskew --clean --sidecar "$output_txt" "$pdf" "$output_pdf"
    echo "Completed: $filename"
done

echo "HSCA batch complete."
```

### Church Committee (5 Books)

Save as `raw-material/scripts/ocr_church_batch.sh`:

```bash
#!/bin/bash
# Batch OCR for Church Committee volumes

INPUT_DIR="/mnt/c/Users/willh/Desktop/primary-sources/raw-material/church-committee"
OUTPUT_DIR="/mnt/c/Users/willh/Desktop/primary-sources/processed/church-committee"

mkdir -p "$OUTPUT_DIR"

for pdf in "$INPUT_DIR"/*.pdf; do
    filename=$(basename "$pdf" .pdf)
    output_pdf="$OUTPUT_DIR/${filename}_searchable.pdf"
    output_txt="$OUTPUT_DIR/${filename}.txt"
    
    if [ -f "$output_pdf" ]; then
        echo "Skipping $filename (already processed)"
        continue
    fi
    
    echo "Processing $filename..."
    ocrmypdf --deskew --clean --sidecar "$output_txt" "$pdf" "$output_pdf"
    echo "Completed: $filename"
done

echo "Church Committee batch complete."
```

### Running Batch Scripts

```bash
# Make executable
chmod +x raw-material/scripts/ocr_*_batch.sh

# Run (expect several hours for large collections)
./raw-material/scripts/ocr_warren_batch.sh
./raw-material/scripts/ocr_hsca_batch.sh
./raw-material/scripts/ocr_church_batch.sh
```

---

## 6. Output Organization

### Directory Structure

```
primary-sources/
├── raw-material/           # Original unprocessed PDFs (DO NOT MODIFY)
│   ├── warren-commission/
│   ├── hsca/
│   ├── church-committee/
│   └── garrison/
│
├── processed/              # OCR output (searchable PDFs + text)
│   ├── warren-commission/
│   │   ├── GPO-WARRENCOMMISSIONHEARINGS-1_searchable.pdf
│   │   ├── GPO-WARRENCOMMISSIONHEARINGS-1.txt
│   │   └── ...
│   ├── hsca/
│   ├── church-committee/
│   └── garrison/
│
└── yates/                  # Special case: already processed
    ├── ralphleonyatesdocumentsfull.pdf   # Original
    └── yates_searchable.pdf              # OCR output
```

### File Naming Convention

| Input | Searchable PDF | Plain Text |
|-------|----------------|------------|
| `GPO-WARRENCOMMISSIONHEARINGS-1.pdf` | `GPO-WARRENCOMMISSIONHEARINGS-1_searchable.pdf` | `GPO-WARRENCOMMISSIONHEARINGS-1.txt` |
| `HSCA-Vol-1.pdf` | `HSCA-Vol-1_searchable.pdf` | `HSCA-Vol-1.txt` |

---

## 7. Quality Control

### Spot-Check Procedure

After OCR processing, verify accuracy on a sample of pages:

1. **Open the searchable PDF** in a PDF reader
2. **Select text** (Ctrl+A or drag) on 3-5 random pages
3. **Compare** selected text to visible scan
4. **Check for common OCR errors:**
   - `rn` misread as `m`
   - `l` misread as `1` or `I`
   - Names with unusual spelling (e.g., "Oswald" → "Oswa1d")
   - Dates with digit errors

### Quality Ratings

| Rating | Description | Action |
|--------|-------------|--------|
| **A** | >95% accurate, minor typos | Ready for database entry |
| **B** | 85-95% accurate, some errors | Usable with manual correction during entry |
| **C** | <85% accurate, major issues | Re-run with `--force-ocr` or manual transcription |

### Known Problem Documents

Track documents that require special handling:

```markdown
## OCR Problem Log

| Document | Issue | Resolution |
|----------|-------|------------|
| church_book_III.pdf | Heavy redactions cause garbled text | Manual review required for redacted sections |
| HSCA-Vol-16.pdf | Faded typewriter text | Re-run with --oversample 400 |
```

---

## 8. Database Integration

### Mapping OCR Output to Schema

The extracted text feeds into the **Source → Source Excerpt → Assertion** chain:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         source table                                │
├─────────────────────────────────────────────────────────────────────┤
│ source_id    │ (auto-generated UUID)                                │
│ source_type  │ 'TESTIMONY' or 'REPORT'                              │
│ title        │ "Warren Commission Hearings, Vol. 1"                 │
│ external_ref │ "GPO-WARRENCOMMISSIONHEARINGS-1" (for de-duplication)│
│ publisher    │ "U.S. Government Printing Office"                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      source_excerpt table                           │
├─────────────────────────────────────────────────────────────────────┤
│ excerpt_id   │ (auto-generated UUID)                                │
│ source_id    │ (FK to source)                                       │
│ locator      │ "p. 47, para. 3" or "pp. 112-115"                    │
│ excerpt_text │ "Mr. BALL. Did you see the rifle..." (actual text)   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        assertion table                              │
├─────────────────────────────────────────────────────────────────────┤
│ subject_type │ 'person'                                             │
│ subject_id   │ (FK to person.person_id)                             │
│ predicate    │ 'TESTIFIED_THAT'                                     │
│ object_value │ "he saw a rifle in the sixth floor window"           │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Entry Workflow

1. **Register the Source** (one-time per volume)
   ```sql
   INSERT INTO source (source_type, title, external_ref, publisher)
   VALUES (
     'TESTIMONY',
     'Warren Commission Hearings, Vol. 1',
     'GPO-WARRENCOMMISSIONHEARINGS-1',
     'U.S. Government Printing Office'
   );
   ```

2. **Create Excerpts** (per citation)
   - Open the `.txt` file
   - Search for relevant testimony using `Ctrl+F`
   - Note the page number from `--- PAGE XX ---` markers
   - Copy the exact text into `excerpt_text`

3. **Link to Assertions** (per claim)
   - Follow the [Data Entry SOP](./data-entry-sop.md) Phase IV

### Bulk Source Registration

For efficiency, register all Warren Commission volumes at once:

```sql
INSERT INTO source (source_type, title, external_ref, publisher) VALUES
  ('TESTIMONY', 'Warren Commission Hearings, Vol. 1', 'GPO-WARRENCOMMISSIONHEARINGS-1', 'U.S. GPO'),
  ('TESTIMONY', 'Warren Commission Hearings, Vol. 2', 'GPO-WARRENCOMMISSIONHEARINGS-2', 'U.S. GPO'),
  ('TESTIMONY', 'Warren Commission Hearings, Vol. 3', 'GPO-WARRENCOMMISSIONHEARINGS-3', 'U.S. GPO'),
  -- ... continue for all 26 volumes
  ('TESTIMONY', 'Warren Commission Hearings, Vol. 26', 'GPO-WARRENCOMMISSIONHEARINGS-26', 'U.S. GPO')
ON CONFLICT DO NOTHING;
```

### Page Number Reference

The `--- PAGE XX ---` markers in OCR output correspond to **PDF page numbers**, not printed page numbers. When creating `source_excerpt.locator`:

- Use printed page numbers when visible (e.g., "p. 47")
- Fall back to PDF page numbers with notation (e.g., "PDF p. 52")
- For testimony, include speaker if known (e.g., "p. 47, testimony of Howard Brennan")

---

## Appendix: Processing Time Estimates

| Collection | Files | Est. Pages | Est. Time (OCRmyPDF) |
|------------|-------|------------|----------------------|
| Warren Commission | 26 | ~15,000 | 8-12 hours |
| HSCA | 16 | ~8,000 | 4-6 hours |
| Church Committee | 5 | ~2,500 | 1-2 hours |
| Garrison Papers | ~25 | ~10,000 | 6-10 hours |

> **Note:** Times assume running on a modern CPU. OCR is CPU-intensive; consider running overnight or on a dedicated machine.