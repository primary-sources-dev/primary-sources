# Primary Sources: Historical Engine

**Primary Sources** is a subject-agnostic chronological engine designed to transform raw historical data and physical artifacts into a structured, relational network of metadata. It moves beyond simple "search" by enabling forensic research, immersive simulations, and narrative-driven exploration of historical events.

---

## Project Vision

While currently seeded with data from the **1963 Ralph Leon Yates / JFK investigation**, the underlying architecture is built to reconstruct *any* historical era, cold case, or cultural movement by mapping the relationship between:

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

## Current Dataset

The archive currently contains **real historical research data** from the **Ralph Leon Yates incident** (November 1963) and related JFK assassination investigations:

### Entity Counts
- **22 People**: Lee Harvey Oswald, Ralph Leon Yates, FBI Special Agents (C. Ray Hall, Arthur Carter, John Kesler, Maurice White), Jack Ruby, Dempsey Jones, Yates family members, witnesses
- **17 Places**: Dallas, Dealey Plaza, Texas School Book Depository, R.L. Thornton Expressway, Elm & Houston Streets, Irving TX locations, Yates residence, FBI office
- **8+ Events**: The Yates Hitchhiker Incident (with 7 procedural sub-events), Walker Incident (with 4 sub-events), FBI interviews, polygraph examination, hospitalization
- **11 Objects**: Carcano Rifle (CE 139), CE 399 "Magic Bullet", Brown Paper Packages, TBSC service invoices, photographs, vehicles
- **30+ Organizations**: Government archives (NARA, NSA, presidential libraries), investigative bodies (Warren Commission, HSCA, ARRB, Church Committee), agencies (FBI, CIA, DPD), Dallas businesses (Texas Butchers Supply, Carousel Club, Park-It Market)
- **5 Primary Sources**: Warren Commission Report (1964), HSCA Final Report (1979), Church Committee Report (1976), Yates FBI Files (searchable PDF)

### Data Integrity
- **Comprehensive**: Lee Harvey Oswald profile includes 12 card types (aliases, residences, organizations, family, events, objects, sources, identifiers, assertions, media)
- **Forensic Detail**: Ralph Yates incident includes timestamped procedural timeline (Nov 26 first report → Dec 10 affidavit → Jan 4 polygraph → Jan 15 hospitalization)
- **Hierarchical**: Place relationships (Dallas → Dealey Plaza → TSBD, Dallas → Oak Cliff → Wynnewood Village)
- **Custody Chains**: CE 399 bullet tracked through 4 handlers (Tomlinson → Wright → Johnsen → FBI Lab)
- **Cross-Referenced**: 30+ archives cataloged with URL links to official repositories

---

## Getting Started

### 1. Main Archive UI

The primary discovery portal for researchers to browse the structured database.

```bash
# Run from project root to support absolute /docs/ui/ paths
python -m http.server 8000
```

**URL**: [http://localhost:8000/docs/ui/index.html](http://localhost:8000/docs/ui/index.html)

**Browse Pages**:
- [People](http://localhost:8000/docs/ui/browse/people.html) — 22 witnesses, suspects, FBI agents, family members
- [Places](http://localhost:8000/docs/ui/browse/places.html) — 17 Dallas-area locations with hierarchical relationships
- [Events](http://localhost:8000/docs/ui/browse/events.html) — Chronological timeline with procedural sub-events
- [Objects](http://localhost:8000/docs/ui/browse/objects.html) — 11 pieces of physical evidence with custody chains
- [Organizations](http://localhost:8000/docs/ui/browse/organizations.html) — 30+ archives, agencies, and businesses
- [Sources](http://localhost:8000/docs/ui/browse/sources.html) — 5 primary source documents with citations

**Entity Detail Pages**:
- [Lee Harvey Oswald Profile](http://localhost:8000/docs/ui/entities/person.html?id=3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8) — 12-card comprehensive profile
- [Ralph Yates Profile](http://localhost:8000/docs/ui/entities/person.html?id=8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d) — Witness profile with timeline
- [Yates Hitchhiker Incident](http://localhost:8000/docs/ui/entities/event.html?id=yates-hitchhiker) — 7-phase procedural timeline

### 2. OCR Analytical Tool

**Production-ready** batch processing utility for transcribing archival PDF documents into searchable text with forensic-grade metadata extraction.

```bash
cd tools
python ocr-server.py
```

**URL**: [http://localhost:5000](http://localhost:5000)

**Features**:
- **Dual OCR Backend**: WSL/OCRmyPDF (high-quality searchable PDFs) + Python/Tesseract (Windows-native text extraction)
- **Document Classification**: Automatic detection of 20+ archival document types (FBI 302, Warren Commission exhibits, CIA cables, NARA RIF, HSCA docs, police reports, medical records)
- **Metadata Extraction**: Forensic parsing of 90+ extraction patterns (RIF numbers, FBI file numbers, agents, dates, document numbers, classification markings)
- **Entities Dashboard**: Unified, filterable grid for matched entities and NER candidates with summary analytics
- **Page-Level Mapping**: Automatic cross-referencing of detected entities with document pages using character offsets
- **Deep-Linking**: Direct navigation from entity "Pg #" badges to specific pages in the Classify tab with visual highlighting
- **Zone-Based Extraction**: Type-specific field extraction with header/body/footer awareness (FBI 302 footer-aware, testimony Q&A segmentation, CIA cable numbered blocks)
- **Output Formats**: Searchable PDF, Markdown (.md), TXT, HTML, JSON metadata
- **Citation Generation**: Automatic citations in Chicago, APA, MLA, NARA formats
- **Quality Verification**: Real-time progress tracking + integrated PDF viewer

**Architecture**:
- `ocr_server.py` (868 lines) — Flask REST API with 10 endpoints
- `metadata_parser.py` (621 lines) — 90+ extraction patterns with confidence scoring
- `document_classifier.py` (1,055 lines) — Fingerprint-based regex + fuzzy fallback classifier
- `entity_linker.py` (254 lines) — Narrative entity linking engine with rapidfuzz
- `zone_extractor.py` (829 lines) — Type-specific field extraction (200+ patterns)

**Dependencies**: Tesseract OCR (required), `ocrmypdf` via WSL (optional, recommended)

**Documentation**: See [OCR Pipeline Guide](docs/ocr-pipeline-guide.md) for complete workflow and batch processing instructions

### 3. PDF Viewer

Built-in document viewer for examining source materials.

- **Path**: `docs/ui/ocr/pdf-viewer.html?file=path/to/document.pdf`
- **Example**: [Yates FBI File](http://localhost:8000/docs/ui/ocr/pdf-viewer.html?file=assets/documents/yates-searchable.pdf)

---

## Project Structure

```
primary-sources/
├── docs/
│   ├── ui/                    # Frontend (HTML/CSS/JS)
│   │   ├── index.html         # Main archive landing page
│   │   ├── browse/            # Multi-entity list views
│   │   │   ├── people.html    # Browse 22 people
│   │   │   ├── events.html    # Browse 8+ events
│   │   │   └── ...            # Other browse pages
│   │   ├── entities/          # Single-entity profiles
│   │   │   ├── person.html    # Person detail page (12-card layout)
│   │   │   ├── event.html     # Event detail page (sub-events timeline)
│   │   │   └── ...            # Other entity pages
│   │   ├── ocr/               # OCR components & PDF viewer
│   │   │   └── pdf-viewer.html # Document viewer
│   │   └── assets/
│   │       ├── data/          # Real historical data (JSON)
│   │       │   ├── people.json        # 22 people
│   │       │   ├── places.json        # 17 places
│   │       │   └── ...                # Other data files
│   │       ├── js/            # Core logic & card libraries
│   │       │   ├── components.js      # Dynamic component loader
│   │       │   ├── db-logic.js        # Universal data fetcher
│   │       │   └── ...                # Entity-specific cards
│   │       └── css/
│   ├── architecture-and-schema.md    # Database specification (4NF)
│   ├── ontology-and-controlled-vocab.md
│   ├── provenance-and-sourcing.md    # Evidentiary standards
│   ├── data-entry-sop.md             # 5-phase workflow
│   ├── ocr-pipeline-guide.md         # OCR tool documentation
│   └── ENTITY-AUDIT.md               # Quality control & audit log
├── tools/
│   ├── ocr-server.py          # Flask API (10 REST endpoints)
│   ├── ocr-gui/               # Desktop GUI (customtkinter)
│   │   ├── metadata_parser.py # 90+ extraction patterns
│   │   ├── document_classifier.py # 20+ document types
│   │   ├── entity_linker.py   # Cross-reference engine
│   │   └── zone_extractor.py  # Type-specific field extraction
│   ├── notes.md               # Entity extraction workflow
│   └── scan_pdf.py            # PDF text extraction utility
├── supabase/
│   └── migrations/            # PostgreSQL schema (4NF)
│       ├── 001_initial_schema.sql
│       ├── 002_polymorphic_relationships.sql
│       ├── 003_controlled_vocab.sql
│       └── 004_rls_policies.sql
├── raw-material/              # Unprocessed source PDFs
│   ├── warren-commission/     # 26 volumes (downloaded)
│   ├── hsca/                  # 14 volumes + reports (downloaded)
│   └── church-committee/      # 5 books (downloaded)
└── processed/                 # OCR output directory
    ├── searchable-pdfs/
    ├── markdown/
    └── json-metadata/
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture & Schema](docs/architecture-and-schema.md) | PostgreSQL 4NF database specification with polymorphic foreign keys |
| [Ontology & Vocabulary](docs/ontology-and-controlled-vocab.md) | Controlled vocabulary definitions for entity types |
| [Provenance & Sourcing](docs/provenance-and-sourcing.md) | Forensic evidentiary standards and NARA citation rules |
| [Data Entry SOP](docs/data-entry-sop.md) | 5-phase workflow for adding archival data |
| [OCR Pipeline Guide](docs/ocr-pipeline-guide.md) | Complete OCR workflow and quality control procedures |
| [Entity Audit](docs/ENTITY-AUDIT.md) | Quality verification and data integrity audit log |
| [Document Index](document-index.md) | Comprehensive categorized map of all project documentation |

---

## Template System

All entity detail pages use a **modular card library system** with `CARD_REGISTRY` defining card behavior:

### Person Template (12 cards)
Biography, Chronology, Aliases, Residences, Organizations, Family, Events, Objects, Sources, Identifiers, Assertions, Media

**Example**: [Lee Harvey Oswald](http://localhost:8000/person.html?id=3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8) — All 12 cards populated

### Event Template (9 cards)
Context, Timeline (sub_events), Participants, Evidence, Sources, Locations, Related Events, Assertions, Media

**Example**: [Yates Hitchhiker Incident](http://localhost:8000/event.html?id=yates-hitchhiker) — 7 procedural sub-events

### Place Template (7 cards)
Description, Events, Parent/Child Places, Related Places, Features, Identifiers, Sources

**Example**: [Dealey Plaza](http://localhost:8000/place.html?id=7c8d9e0f-1a2b-43c4-d5e6-f7a8b9c0d1e2) — Hierarchical relationships

### Object Template (8 cards)
Description, Properties, Events, People, Custody Chain, Related Objects, Identifiers, Sources

**Example**: [CE 399 "Magic Bullet"](http://localhost:8000/object.html?id=9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7) — 4-step custody chain

### Organization Template (7 cards)
Description, Events, Members, Related Organizations, Locations, Identifiers, Sources

**Example**: [Warren Commission](http://localhost:8000/organization.html?id=warren-commission) — 4 commissioners listed

### Source Template (8 cards)
Description, Content Summary, Events, People, Organizations, Places, Citations, Provenance

**Example**: [Warren Report](http://localhost:8000/source.html?id=warren-report) — Chicago/APA/MLA citations

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Database** | Supabase / PostgreSQL (4NF) |
| **Backend** | Python 3.x (Flask, Tesseract, pypdf, rapidfuzz) |
| **Frontend** | Vanilla JS, Tailwind CSS |
| **OCR** | Tesseract 5.x + OCRmyPDF (WSL) |
| **Fonts** | Oswald (headings), Roboto Mono (body) |
| **Icons** | Material Symbols Outlined |

---

## Roadmap

The project is currently in **Phase 1: Utility & Core Structure**. The full roadmap includes 26 features across categories:

| Category | Example Features |
|----------|------------------|
| **Forensic** | Conflict Heatmaps, Network Explorer, 3D Print Replicas |
| **Narrative** | POV Timelines, Cultural Portal, Slow Reveal Mode |
| **Simulation** | Witness POV Video, AR Overlays, Synthetic Case Files |
| **Research** | Private Notes, Self-Service Vault, Custom Field Guides |

*See [working-notes.md](working-notes.md) for the complete strategy and next-up tasks.*

---

## OCR Tool Status

**Production-Ready** — The OCR scanner tool has been validated for production use:

- ✅ **Architecture**: A+ rating for modular design (6 specialized components)
- ✅ **Performance**: Dual backend support for speed + quality optimization
- ✅ **Accuracy**: 20+ document type classification with fuzzy fallback
- ✅ **Forensic Grade**: 90+ metadata extraction patterns with confidence scoring
- ✅ **Integration**: Entity linking with existing People/Places databases
- ✅ **Testing**: Real-world validation on Yates FBI documents and Warren Commission materials

**Potential Enhancements**:
- Batch parallelization for large-volume processing
- Page-level caching for repeated access
- Direct database integration for extracted metadata
- RESTful API expansion for external tool integration

---

## Research Focus: The Ralph Leon Yates Incident

The current dataset centers on one of the most compelling witness accounts from the JFK assassination investigation. Ralph Leon Yates, a refrigeration mechanic, reported picking up a hitchhiker matching Lee Harvey Oswald's description on November 20-21, 1963. The hitchhiker carried a package and discussed shooting the President from a window.

**Why This Case Matters**:
- **Pre-Assassination Report**: Yates told co-worker Dempsey Jones about the encounter *before* the assassination
- **Corroborating Details**: Package story matches Wesley Frazier's account of "curtain rods"
- **FBI Investigation**: Extensive documentation includes 7 interviews, polygraph test, timeline verification
- **Unresolved Questions**: Alibi discrepancies (Charlie's Meat Market check stub never found)
- **Mental Health Crisis**: Yates hospitalized Jan 1964 following FBI pressure

**Dataset Coverage**:
- 7 FBI Special Agents documented
- 8 procedural sub-events with timestamps
- 6 Yates family members
- 4 TBSC employers and co-workers
- 3 Dallas businesses with address verification
- Service call documentation (Shop Bill #8760, Invoice #36919)

---

## Development Notes

### Data Integrity
All JSON files in `docs/ui/assets/data/` contain **real historical research data** extracted from:
- Warren Commission Report (1964)
- HSCA Final Report (1979)
- FBI interview reports (DL 89-43)
- Dallas Police Department records
- NARA archival collections

### Template Coverage
100% template coverage achieved across all 6 entity types:
- **Person**: 12/12 cards testable (Oswald entry covers all fields)
- **Event**: 9/9 cards testable (Yates incident covers all fields)
- **Place**: 7/7 cards testable (Dallas/Dealey Plaza hierarchy)
- **Object**: 8/8 cards testable (CE 399 custody chain)
- **Organization**: 7/7 cards testable (Warren Commission members)
- **Source**: 8/8 cards testable (Warren Report citations/provenance)

### OCR Integration
The OCR tool is designed to populate this database automatically:
1. Scan archival PDF (e.g., FBI 302 report)
2. Classify document type → Extract metadata → Link entities
3. Generate structured JSON output matching entity schemas
4. Review and import into `docs/ui/assets/data/`

---

*Created with care by the Primary Sources project team.*
