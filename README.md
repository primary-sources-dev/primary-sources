# Primary Sources: Historical Engine

**Primary Sources** is a subject-agnostic chronological engine designed to transform raw historical data and physical artifacts into a structured, relational network of metadata. It moves beyond simple "search" by enabling forensic research, immersive simulations, and narrative-driven exploration of historical events.

---

## Project Vision

While currently seeded with data from the **1963 Yates / JFK investigation**, the underlying architecture is built to reconstruct *any* historical era, cold case, or cultural movement by mapping the relationship between:

| Entity | Question | Database Table |
|--------|----------|----------------|
| **Events** | What happened and when? | `event` + `event_participant` |
| **People** | Who was involved and in what role? | `person` + `person_alias` |
| **Places** | Where did it occur? | `place` (hierarchical) |
| **Objects** | What physical evidence exists? | `object` |
| **Organizations** | Which groups were involved? | `org` |
| **Sources** | Where is the evidence? | `source` + `source_excerpt` |
| **Assertions** | What claims are made? | `assertion` + `assertion_support` |

---

## Getting Started

### 1. Main Archive UI

The primary discovery portal for researchers to browse the structured database.

```bash
python -m http.server 8000 --directory docs/ui/
```

**URL**: [http://localhost:8000](http://localhost:8000)

**Browse Pages**:
- [People](docs/ui/people.html) — Witnesses, suspects, officials
- [Places](docs/ui/places.html) — Locations with hierarchical relationships
- [Events](docs/ui/events.html) — Chronological timeline with detail pages
- [Objects](docs/ui/objects.html) — Physical evidence and artifacts
- [Organizations](docs/ui/organizations.html) — Agencies, businesses, groups

### 2. OCR Analytical Tool

Batch processing utility for transcribing PDF documents into searchable text with dual output formats.

```bash
python tools/ocr-server.py
```

**URL**: [http://localhost:5000](http://localhost:5000)

**Features**:
- Drag-and-drop PDF upload
- Dual backend support (WSL/ocrmypdf or Python/pytesseract)
- Output formats: Searchable PDF + Markdown (.md)
- Real-time progress tracking per file
- Integrated PDF viewer for quality verification

**Dependencies**: Tesseract OCR (and optionally `ocrmypdf` via WSL)

### 3. PDF Viewer

Built-in document viewer for examining source materials.

- **Path**: `docs/ui/pdf-viewer.html?file=path/to/document.pdf`

---

## Project Structure

```
primary-sources/
├── docs/
│   ├── ui/                    # Frontend (HTML/CSS/JS mockups)
│   │   ├── index.html         # Main archive landing page
│   │   ├── people.html        # Entity browse pages
│   │   ├── event.html         # Event detail page
│   │   ├── pdf-viewer.html    # Document viewer
│   │   ├── ocr/               # OCR tool UI (v1 mockup)
│   │   └── assets/
│   │       ├── data/          # Entity JSON files
│   │       ├── documents/     # Searchable PDFs
│   │       └── js/            # Shared logic (db-logic, filter)
│   ├── architecture-and-schema.md
│   ├── data-entry-sop.md
│   └── ontology-and-controlled-vocab.md
├── tools/
│   ├── ocr-server.py          # Flask API for OCR web UI
│   ├── ocr-gui/               # Desktop GUI (customtkinter)
│   ├── notes.md               # Entity extraction workflow
│   └── scan_pdf.py            # PDF text extraction utility
├── supabase/
│   └── migrations/            # PostgreSQL schema (001-004)
├── raw-material/              # Unprocessed PDFs (Warren, HSCA, Church)
└── processed/                 # OCR output directory
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture & Schema](docs/architecture-and-schema.md) | Technical database specification |
| [Ontology & Vocabulary](docs/ontology-and-controlled-vocab.md) | Controlled vocabulary definitions |
| [Data Entry SOP](docs/data-entry-sop.md) | 5-phase workflow for adding data |
| [Entity Extraction](tools/notes.md) | Manual extraction process for PDFs |
| [OCR Tool README](tools/README.md) | Tool usage and features |
| [Roadmap](roadmap.md) | 26-feature product vision |

---

## Roadmap

The project is currently in **Phase 1: Utility & Core Structure**. The full roadmap includes 26 features across categories:

| Category | Example Features |
|----------|------------------|
| **Forensic** | Conflict Heatmaps, Network Explorer, 3D Print Replicas |
| **Narrative** | POV Timelines, Cultural Portal, Slow Reveal Mode |
| **Simulation** | Witness POV Video, AR Overlays, Synthetic Case Files |
| **Research** | Private Notes, Self-Service Vault, Custom Field Guides |

*See [roadmap.md](roadmap.md) for the complete feature table.*

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Database** | Supabase / PostgreSQL (4NF) |
| **Backend** | Python (Flask, Tesseract, pypdf) |
| **Frontend** | Vanilla JS, Tailwind CSS |
| **Fonts** | Oswald (headings), Roboto Mono (body) |
| **Icons** | Material Symbols Outlined |

---

## Current Data

The archive currently contains entities from the **Ralph Leon Yates incident** (November 1963):
- 15+ people (witnesses, officials, family)
- 10+ places (Dallas-area locations)
- 5+ organizations (FBI, Secret Service, TBSC)
- 10+ events (sightings, interviews, hospitalization)
- Primary source documents (FBI reports, affidavits)

---

*Created with care by the Primary Sources project team.*
