# OCR Web UI (v1 Mockup)

> **Note:** This is the first version of the OCR web interface, created as a static HTML/CSS/JS mockup before migration to the Next.js web application.

## Purpose

This directory contains the prototype OCR tool interface that allows researchers to:
- **Upload** PDF files for OCR processing via drag-and-drop.
- **Configure** backend processing (WSL/ocrmypdf vs Python/pytesseract).
- **Monitor** real-time, per-file progress with animated visual feedback.
- **Verify** results instantly via integrated `pdf-viewer.html` support.

## Key Features

- **Integrated Document Viewer**: Completed OCR jobs feature a "View" button that opens the result in the vault's custom PDF viewer for immediate quality check.
- **Per-File Progress Tracking**: Real-time percentage updates and progress bars for each item in the queue.
- **Responsive Design**: Gold pulsing drop-zone animations and feedback aligned with the Primary Sources style guide.
- **Dual-Backend Support**: Toggle between high-precision WSL-based OCR and lightweight Python-based processing.

## Files

| File | Description |
|------|-------------|
| `index.html` | Main UI template (served by Flask) |
| `ocr-gui.css` | Styling following the Primary Sources design system |
| `ocr-gui.js` | Client-side logic for file handling, progress polling, and viewer integration |

## Running the Server

From the project root:

```bash
python tools/ocr-server.py
```

Then open http://localhost:5000

## Multi-Agent Coordination

This tool is designed to work within a multi-agent environment where:
1. **OCR Agent**: Handles the heavy lifting of image-to-text conversion.
2. **Extraction Agent**: Reviews OCR'd PDFs (via `pdf-viewer.html`) to identify entities.
3. **Database Agent**: Merges extracted entities into the research vault schema.

The integrated viewer provides the common visual anchor point for all agents to validate evidentiary claims.

## Design Tokens

This mockup follows the Primary Sources design system:
- Background: `#2E282A` (archive-bg)
- Dark Background: `#1A1718` (archive-dark)
- Primary accent: `#B08B49` (gold)
- Font: Oswald (headings), Roboto Mono (body)
- Border radius: 0 (sharp edges)
