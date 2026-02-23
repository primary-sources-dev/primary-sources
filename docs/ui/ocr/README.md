# OCR Web UI (v1 Mockup)

> **Note:** This is the first version of the OCR web interface, created as a static HTML/CSS/JS mockup before migration to the Next.js web application.

## Purpose

This directory contains the prototype OCR tool interface that allows users to:
- Upload PDF files for OCR processing
- Monitor processing progress
- Download searchable PDF results

## Files

| File | Description |
|------|-------------|
| `index.html` | Main UI template (served by Flask) |
| `ocr-gui.css` | Styling following the Primary Sources design system |
| `ocr-gui.js` | Client-side logic for file handling and API calls |

## Running the Server

From the project root:

```bash
python tools/ocr-server.py
```

Then open http://localhost:5000

## Migration Path

When the Next.js web app (`web/`) is initialized:
1. Port the HTML structure to React components
2. Move CSS to the app's styling system
3. Convert JS logic to React hooks/state management
4. Replace Flask API with Next.js API routes

## Design Tokens

This mockup follows the Primary Sources design system:
- Background: `#1a1a1a` (archive-bg)
- Primary accent: `#c9a227` (gold)
- Font: Oswald (headings), Roboto Mono (body)
- Border radius: 0 (sharp edges)
