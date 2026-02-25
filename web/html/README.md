# Primary Sources Archive — Web Interface

This is the interactive web interface for exploring the JFK Primary Sources Archive.

## What's Here

### Browse the Archive
- **People** — Key figures, witnesses, and investigators
- **Events** — Chronological documentation of what happened
- **Places** — Locations relevant to the historical record
- **Organizations** — Agencies, institutions, and groups involved
- **Objects** — Physical evidence and artifacts
- **Sources** — Primary documents, photographs, and recordings

### Discovery Features
- **On This Day** — See what happened on any date in history
- **Six Degrees** — Explore random connections across the archive
- **Witness Atlas** — Geographic visualization of witness accounts

### Research Tools
- **OCR Scanner** — Extract text from scanned documents
- **PDF Viewer** — Read and annotate primary source documents
- **Document Analyzer** — Classify and parse document types
- **Citation Generator** — Create proper academic citations
- **Entity Matcher** — Link names and references across documents

## Getting Started

To view the archive locally:

1. Open a terminal in this folder
2. Run: `python -m http.server 8000`
3. Open your browser to: `http://localhost:8000`

## Structure

```
html/
├── index.html          Home page
├── entities/           Browse and view records
├── exploration/        Discovery features
├── tools/              Research utilities
├── pages/              About, blog, links
├── assets/             Styles, scripts, data
└── components/         Shared UI elements
```

---

*Part of the Primary Sources Research Vault — preserving history through unedited primary materials.*
