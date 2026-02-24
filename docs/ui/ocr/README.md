# OCR Web UI (v1 Interface)

> **Note:** This is the first version of the OCR web interface, created as a static HTML/CSS/JS prototype before migration to the Next.js web application.

## Purpose

This directory contains the prototype OCR tool interface that allows researchers to:
- **Upload** PDF files for OCR processing via drag-and-drop.
- **Configure** backend processing (WSL/ocrmypdf vs Python/pytesseract).
- **Monitor** real-time, per-file progress with animated visual feedback.
- **Verify** results instantly via integrated `pdf-viewer.html` support.

## Key Features

- **Image Support**: Direct OCR of standalone image files (.jpg, .png, .tiff, .webp) without PDF conversion.
- **Extraction Workbench**: High-fidelity verification interface with dual-pane review (Scan vs. Text).
- **Deep Sync**: Integrated coordinate mapping allow researchers to click any line of OCR text to instantly zoom the PDF viewer to the source evidence.
- **Visual Splitter**: Sidebar thumbnail viewing with checkbox selection for targeted archival processing.

## Forensic Metadata Parser

After OCR processing completes, the system automatically parses document headers and footers to extract archival metadata. This feature recognizes standardized patterns from:

- **FBI 302 Forms**: Agent name, Field Office, Date, File Number (header + footer)
- **NARA RIF Sheets**: Agency, Record Number (###-#####-#####), Date
- **Warren Commission**: Exhibit numbers (CE-###, CD-###)

### Extracted Fields

| Field | Maps To | Example |
|-------|---------|---------|
| RIF Number | `source.external_ref` | `104-10001-10001` |
| Agency | `source.notes` | `CIA`, `FBI`, `SECRET SERVICE` |
| Date | `source.published_date` | `1963-11-22` (ISO normalized) |
| Author | `source.author` | `SA James P. Hosty` |

### Confidence Scoring

Each extracted field includes a confidence badge:
- **HIGH** (green): Strong pattern match with contextual anchors
- **MEDIUM** (gold): Pattern match without strong context
- **LOW** (orange): Partial or ambiguous match

### UI Features

- **Metadata Preview Card**: Displays below each completed file in the queue
- **Copy All**: Exports all fields to clipboard in key-value format
- **Per-field Copy**: Individual copy buttons for each extracted value
- **Re-parse**: Manual retry for edge cases or after re-OCR

### API Endpoint

```
POST /api/parse-header
Content-Type: application/json

{ "text": "OCR text content..." }
```

Returns structured JSON with extracted fields and confidence scores.

## Files

| File | Description |
|------|-------------|
| `index.html` | Main UI template (served by Flask), includes Tailwind CDN config |
| `ocr-components.css` | Component-only styles (Tailwind handles utilities) |
| `ocr-gui.js` | Client-side logic for file handling, progress polling, metadata preview |
| `components.md` | Component documentation and reference |
| `plan.md` | CSS alignment implementation plan |
| `plans/` | Feature implementation plans (archival-image-support, forensic-metadata-parser) |

## Running the Server

From the project root:

```bash
python tools/ocr-server.py
```

Then open http://localhost:5000

## Multi-Agent Coordination

This tool is designed to work within a multi-agent environment where:
1. **OCR Agent**: Handles the heavy lifting of image-to-text conversion and coordinate mapping.
2. **Extraction Agent**: Reviews OCR'd PDFs via the **Extraction Workbench** to verify transcription and identify entities.
3. **Database Agent**: Merges verified text and entities into the research vault schema.

The **Extraction Workbench** provides the deep sync bridge between visual evidence and digital record, reducing verification time by up to 80% through click-to-zoom localization.

## Design Tokens

This interface follows the Primary Sources design system via **Tailwind CSS CDN**:

| Token | Value | Tailwind Class |
|-------|-------|----------------|
| Background | `#2E282A` | `bg-archive-bg` |
| Dark Background | `#1A1718` | `bg-archive-dark` |
| Surface | `#252021` | `bg-archive-surface` |
| Primary (gold) | `#B08B49` | `text-primary`, `bg-primary` |
| Heading text | `#F0EDE0` | `text-archive-heading` |
| Secondary text | `#D4CFC7` | `text-archive-secondary` |
| Display font | Oswald | `font-display` |
| Mono font | Roboto Mono | `font-mono` |
| Border radius | 0 | `rounded-none` (default) |

Icons: Material Symbols Outlined (`<span class="material-symbols-outlined">icon_name</span>`)
