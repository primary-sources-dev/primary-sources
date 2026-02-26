# Classifier Review Tool

**Status:** ✅ LIVE  
**Feature ID:** WO-OCR-012  
**Location:** `docs/ui/ocr/yates-classification-report.html`  
**Generator:** `tools/classifier_test_html.py`  
**Tool Info Page:** `docs/ui/tools/classifier-review.html`

## Overview

The Classifier Review Tool is an interactive HTML interface for human-in-the-loop validation of document classification results. Users review classifier predictions, confirm correct classifications, and correct misclassifications. All feedback is saved to a server-side training file that improves the classifier over time.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENT PROCESSING PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PDF File                                                       │
│      │                                                           │
│      ▼                                                           │
│   PyMuPDF (text extraction)                                      │
│      │                                                           │
│      ├──────────────────┬──────────────────┐                    │
│      ▼                  ▼                  ▼                    │
│   Document          Metadata           Entity                   │
│   Classifier        Parser             Linker                   │
│      │                  │                  │                    │
│      ▼                  ▼                  ▼                    │
│   24 Doc Types      RIF, Date,        People,                  │
│   + 4 Structural    Agency, Author    Places                   │
│                                                                  │
│      └──────────────────┴──────────────────┘                    │
│                         │                                        │
│                         ▼                                        │
│              classifier-review.html                              │
│                         │                                        │
│                         ▼                                        │
│              User Reviews & Corrects                             │
│                         │                                        │
│                         ▼                                        │
│              POST /api/feedback                                  │
│                         │                                        │
│                         ▼                                        │
│              data/classifier-feedback.json                       │
│                         │                                        │
│                         ▼                                        │
│              train_classifier.py --suggest                       │
│                         │                                        │
│                         ▼                                        │
│              Pattern suggestions → Update classifier             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Document Classifier (`tools/ocr-gui/document_classifier.py`)

Identifies document types using regex fingerprints and Levenshtein fuzzy matching.

**Supported Types (24 primary + 4 structural):**

| Category | Types |
|----------|-------|
| FBI | `FBI_302`, `FBI_REPORT`, `DPD_REPORT` |
| CIA | `CIA_CABLE`, `CIA_201` |
| Warren Commission | `WC_EXHIBIT`, `WC_TESTIMONY`, `WC_DEPOSITION`, `WC_AFFIDAVIT` |
| Congressional | `HSCA_DOC`, `HSCA_REPORT`, `SENATE_REPORT`, `CHURCH_COMMITTEE` |
| Police | `POLICE_REPORT` |
| Correspondence | `MEMO`, `LETTER` |
| Witness | `WITNESS_STATEMENT` (signed statements, distinct from FBI 302 agent summaries) |
| Other | `NARA_RIF`, `TRAVEL_DOCUMENT`, `MEDICAL_RECORD`, `HANDWRITTEN_NOTES` |
| Structural | `BLANK`, `TOC`, `INDEX`, `COVER` |
| Fallback | `UNKNOWN` |

### 2. Metadata Parser (`tools/ocr-gui/metadata_parser.py`)

Extracts structured metadata from document headers and footers.

**Extracted Fields:**
- `rif_number` — NARA Record Information Form number
- `agency` — Originating agency (FBI, CIA, etc.)
- `date` / `date_iso` — Document date
- `author` — Document author or agent
- `footer_author` — Agent name from footer (FBI 302)
- `footer_file_number` — File number from footer

### 3. Entity Linker (`tools/ocr-gui/entity_linker.py`)

Cross-references OCR text against the research database.

**Data Sources:**
- `docs/ui/assets/data/people.json` — 22 known people
- `docs/ui/assets/data/places.json` — 16 known places

**Matching Methods:**
- Exact match against display names
- Alias matching (e.g., "Lee Oswald" → "Lee Harvey Oswald")
- Fuzzy matching via RapidFuzz (88% threshold)

### 4. HTML Generator (`tools/classifier_test_html.py`)

Generates the interactive review interface.

**Usage:**
```bash
python tools/classifier_test_html.py
```

**Output:** `docs/ui/classifier-review.html`

**Configuration (in script):**
```python
pdf_path = "raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-1.pdf"
sample_pages = [0, 1, 2, 3, ...]  # Pages to analyze
```

### 5. Feedback Server (`tools/ocr_server.py`)

Flask server with feedback collection endpoints.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback` | Save classification feedback |
| GET | `/api/feedback` | Retrieve all feedback |
| GET | `/api/feedback/corrections` | Get only incorrect classifications |

**Feedback Storage:** `data/classifier-feedback.json`

### 6. Training Script (`tools/train_classifier.py`)

Analyzes feedback and suggests new fingerprint patterns.

**Usage:**
```bash
python tools/train_classifier.py              # Show analysis
python tools/train_classifier.py --suggest    # Generate pattern suggestions
```

**Output:** `data/classifier-suggestions.json`

## User Interface

### Page Card Components

Each page displays:

1. **PDF Preview** — Rendered via PDF.js (click to enlarge)
2. **Classification Header** — Page number, confidence score, status
3. **Alternatives** — Top 3 alternative classifications with scores
4. **Highlight Terms** — Matched fingerprint patterns
5. **Metadata Bar** (gold) — Extracted metadata fields
6. **Entities Bar** (blue) — Linked people and places
7. **Type Selection** — One-click buttons sorted by confidence
8. **OCR Text** — Expandable raw text preview

### Filters & Sorting

| Filter | Options |
|--------|---------|
| Type | All, or specific document type |
| Status | All, Pending, Correct, Incorrect |
| Sort | Page (asc/desc), Confidence (asc/desc) |

### Feedback Actions

| Action | Result |
|--------|--------|
| Click predicted type | Marks as "correct" (green) |
| Click different type | Marks as "incorrect" (red) |
| Export Feedback JSON | Downloads local feedback file |
| Clear All | Removes all local feedback |

### Notes Feature

Each page card includes a notes section with:

**Dropdown presets:**
| Code | Label |
|------|-------|
| `NEW_TYPE` | Consider new document type |
| `NEW_PATTERN` | Add pattern to classifier |
| `SCHEMA_UPDATE` | Schema change needed |
| `OCR_QUALITY` | Poor OCR / illegible |
| `AMBIGUOUS` | Ambiguous classification |

**Custom field:** Free-text input for additional notes.

Notes are saved with feedback and included in the training data export.

## Training Workflow

### Step 1: Generate Review Report

```bash
# From project root
python tools/classifier_test_html.py
```

### Step 2: Start Servers

```bash
# Terminal 1: OCR server (for feedback API)
python tools/ocr_server.py

# Terminal 2: Static file server
python -m http.server 8000
```

### Step 3: Review Classifications

1. Open `http://localhost:8000/docs/ui/classifier-review.html`
2. For each page:
   - If classification is correct → click the predicted type button
   - If incorrect → click the correct type button
3. Toast notification confirms each save

### Step 4: Analyze Feedback

```bash
python tools/train_classifier.py --suggest
```

**Sample Output:**
```
==========================================================
CLASSIFIER FEEDBACK ANALYSIS
==========================================================

Total entries: 42
  Correct:   35 (83%)
  Incorrect: 7 (17%)

--- Corrections (classifier got wrong) ---
  WC_TESTIMONY -> FBI_302: 3 corrections
    Sample pages: 15, 45, 89

==========================================================
SUGGESTED NEW PATTERNS
==========================================================

--- FBI_302 ---
  (r"FEDERAL BUREAU OF INVESTIGATION", 30),  # Found in 3/3 samples misclassified as WC_TESTIMONY
```

### Step 5: Apply Patterns

1. Review suggestions in `data/classifier-suggestions.json`
2. Add validated patterns to `tools/ocr-gui/document_classifier.py`
3. Regenerate review report to verify improvements

## File Structure

```
primary-sources/
├── start.txt                         # Server startup instructions
├── data/
│   ├── classifier-feedback.json      # Accumulated training feedback
│   └── classifier-suggestions.json   # Generated pattern suggestions
├── docs/ui/
│   ├── ocr/
│   │   └── yates-classification-report.html  # Generated review interface
│   └── tools/
│       └── classifier-review.html    # Tool information page
├── tools/
│   ├── classifier_test_html.py       # HTML generator
│   ├── train_classifier.py           # Training analysis script
│   ├── ocr_server.py                 # Flask server with feedback API
│   └── ocr-gui/
│       ├── document_classifier.py    # Classification engine
│       ├── metadata_parser.py        # Header/footer extraction
│       └── entity_linker.py          # Database entity matching
└── raw-material/                     # Source PDFs
```

## Server Requirements

**Critical:** Both servers must run from the **project root** directory.

```bash
# Terminal 1 - Static file server (port 8000)
cd C:\Users\willh\Desktop\primary-sources
python -m http.server 8000

# Terminal 2 - OCR/Feedback server (port 5000)
cd C:\Users\willh\Desktop\primary-sources
python tools/ocr_server.py
```

**Access URL:** `http://localhost:8000/docs/ui/ocr/yates-classification-report.html`

See `start.txt` in project root for full instructions.

## Feedback JSON Schema

### classifier-feedback.json

```json
{
  "entries": [
    {
      "page": 42,
      "source": "GPO-WARRENCOMMISSIONHEARINGS-1.pdf",
      "predictedType": "WC_TESTIMONY",
      "selectedType": "FBI_302",
      "status": "incorrect",
      "textSample": "FEDERAL BUREAU OF INVESTIGATION...",
      "noteType": "NEW_TYPE",
      "notes": "Consider new document type - WITNESS_STATEMENT",
      "timestamp": "2026-02-23T14:30:00.000Z"
    }
  ],
  "summary": {
    "total": 150,
    "correct": 120,
    "incorrect": 30
  }
}
```

### classifier-suggestions.json

```json
{
  "generated_at": "2026-02-23T15:00:00.000Z",
  "suggestions": [
    {
      "doc_type": "FBI_302",
      "pattern": "FEDERAL BUREAU OF INVESTIGATION",
      "weight": 30,
      "reason": "Found in 5 samples misclassified as WC_TESTIMONY",
      "confidence": "HIGH",
      "misclassified_as": "WC_TESTIMONY",
      "sample_count": 5
    }
  ]
}
```

## Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| PyMuPDF (fitz) | PDF text extraction | Yes |
| Flask | Feedback API server | Yes |
| RapidFuzz | Fuzzy matching | Optional (improves accuracy) |

## Related Documentation

- [Document Classifier Reference](document-classifier-reference.md)
- [Forensic Metadata Parser](forensic-metadata-parser.md)
- [Document Layout Analyzer](document-layout-analyzer.md)

## Known Issues

### Text Layer Highlighting Not Visible (2026-02-25)

**Status:** 🔴 UNRESOLVED

**Symptom:** Yellow highlight overlays on matched fingerprint terms are not appearing on the rendered PDF pages.

**Investigation:**

1. **CSS verified correct:**
   - `.text-layer` has `opacity: 0.7`, `position: absolute`
   - `.highlight` spans have `background-color: #FFFF00` (bright yellow)

2. **JavaScript verified executing:**
   - Console shows `pageHighlights` populated correctly
   - `renderTextLayer()` function is called for pages with highlights
   - Text layer `<div>` is created and appended to `.canvas-container`
   - Highlight `<span>` elements are created with `.highlight` class

3. **Root cause identified: Y-coordinate positioning**
   - PDF.js `Util.transform(viewport.transform, item.transform)` returns screen coordinates
   - Original code: `span.style.top = (canvas.height - tx[5]) + 'px'` — double-inverted Y axis
   - Spans positioned at `top: 1209px` (near bottom) instead of `top: ~50px` (near top)
   - "FEDERAL BUREAU OF INVESTIGATION" header should be at top, not bottom

4. **Fix attempted:**
   - Changed to `span.style.top = tx[5] + 'px'` (direct use of transformed coordinate)
   - **Result:** Still not working

**Next steps to investigate:**

- Verify `tx[5]` value range after viewport transform (expected: 0-100 for top-of-page text)
- Check if viewport transform is being applied correctly
- Consider using PDF.js built-in `TextLayerBuilder` instead of manual positioning
- Inspect z-index stacking (text layer may still be behind canvas)
- Check if `overflow: hidden` on `.text-layer` is clipping content

**Workaround:** The highlight terms are displayed in text form below each page card ("Highlight terms: FEDERAL BUREAU OF INVESTIGATION...") for manual reference.

## Changelog

| Date | Change |
|------|--------|
| 2026-02-23 | Initial release with full pipeline integration |
| 2026-02-23 | Added server-side feedback loop |
| 2026-02-23 | Added structural page types (BLANK, TOC, INDEX, COVER) |
| 2026-02-23 | Added PDF.js rendering with text layer highlighting |
| 2026-02-25 | Documented text layer highlighting issue (unresolved) |
