# Working Notes: Primary Sources Master Strategy
*Last Updated: 2026-02-23*

This document serves as the synchronized master plan for the **Primary Sources** project. It integrates the platform vision, specific JFK project goals, OCR tooling enhancements, and immediate execution priorities.

---

## I. Platform Roadmap: The Universal Historical Engine
**Principle**: A subject-agnostic chronological engine that transforms raw primary sources into structured metadata for research, simulation, and immersive education.

### Core Vision Areas
| Category | ID | Feature Name | Description |
| :--- | :--- | :--- | :--- |
| **Forensic** | 02 | **Conflict Heatmap** | Visualizes "Hot Zones" in evidence where sources disagree. |
| **Forensic** | 03 | **Network Explorer** | Reveals "Six Degrees of Separation" between known entities. |
| **Narrative** | 05 | **POV "Shadow" Timelines** | View chronology strictly through the claims of a single witness. |
| **Simulation** | 11 | **Witness POV Video** | Generates AI video of exactly what a witness saw from their location. |
| **Simulation** | 12 | **AR Spatial Overlays** | Projects historical entities onto real-world modern streets. |
| **Genealogy** | 24 | **Lineage Engine** | Recursive bloodline mapping across centuries of records. |
| **Engagement** | 18 | **Infinite Evidence Canvas** | Drag-and-drop workspace to link evidence with causal "threads." |

### System Principles
- **Atomic 4NF Engine**: Knowledge graph deconstruction mapping People, Places, and Objects.
- **Assertion Layer**: Multi-witness claim tracking without data collisions.
- **Subject-Agnostic**: Designed for any event (True Crime, Sports, Genealogy, Journalism).

---

## II. Project Focus: Primary Sources — JFK
While the engine is universal, the current primary implementation focus is the **JFK / Yates** investigation.

### Recent Project Milestones
- **Age-at-Event Badge**: Automated calculation of any person's age at the moment of a historical record.
- **Inflation Converter**: Historical USD → 2026 purchasing power using real-time CPI data.
- **Yates Incident Migration**: Structured migration of people and places related to the Ralph Leon Yates incident.

### JFK-Specific Roadmap
- **11.22 Cultural Portal**: Immersive view of 1963 music, TV, and commodity prices.
- **Regional Pulse**: Browse a map to see local context (jukeboxes, theater, grocery prices) at specific 1963 coordinates.
- **Synthetic Case Files**: AI-generated reports highlighting conflicts in the Warren Commission and FBI records.

---

## III. The Tooling: Intelligent OCR Scanner
Converting "Raw Material" into "Smart Evidence." This tool is the engine's primary ingestion method.

### Status: LIVE (v1.0 - Utility Phase)
- **Multi-Format Ingestion**: Support for PDF, Archival Images (.jpg, .png, .tiff, .webp), and Mobile Photos (.heic).
- **Forensic Metadata Parser**: Auto-extraction of RIF numbers, Agency codes, Dates, and Authors from headers/footers.
- **Extraction Workbench (Phases 1-3)**: 
    - **Split-Pane View**: Interactive PDF viewer vs. Forensic Review pane.
    - **Deep Sync**: Click text to scroll the source scan to that exact coordinate.
    - **Visual Splitter**: Per-page surgical processing.
- **Entity Matching**: Instant lookup against the 4NF database producing an `entities.json` sidecar.

### Roadmap: Intelligent Extraction Assistant (Planned)
- **Document Layout Analyzer (Phase 2)**: 
    - **Fingerprinting**: Auto-classify FBI 302s, NARA forms, and CIA cables.
    - **Zone-Specific Parsing**: Intelligent extraction from footers, routing grids, and margin stamps.
- **Handwriting Recognition (HTR)**: Integration of models (TrOCR/Donut) to read cursive field notes.
- **Table Transformer (TATR)**: Converting box scores and financial ledgers into structured markdown.
- **Commit-to-DB**: One-click persistence of verified text and entities into the research vault.

---

## IV. Execution: Next Up & Quick Wins

### Active Build Pool (High Impact / Low Effort)
1.  **Extraction Workbench Phase 4 (Commit)**: Backend logic to save workbench results directly to SQL.
2.  **Universal Person Profile**: A flexible `person.html` template for rich bios and fleeting archival witnesses.
3.  **"On This Day" (OTD) Dashboard**: Home page widget highlighting historical events from today's date.
4.  **ZIP Processor**: Batch unrolling of document archives for bulk processing.

### Recently Completed (2026-02-23 Marathon)
- [x] **UX/UI Polish Bundle**: Snappy transitions (300ms), dynamic breadcrumbs, and status labels.
- [x] **Auto-Generated Citations**: Chicago, MLA, APA, NARA formats in one click.
- [x] **Mobile Native Support**: Direct upload of iPhone .heic images.
- [x] **Footer Parsing**: Extraction of Agency File numbers and Agent names from FBI 302 footers.
- [x] **Grayscale Interactions**: Premium hover feedback across all capability and vision items.

---

## V. Technical Debt & Migration Sync

This section tracks the blockers for the Next.js migration and known schema/data mismatches that must be resolved to achieve full relational parity.

### 1. Critical Migration Blockers (UI/UX)
- **Static Data Architecture**: UI currently relies on hardcoded JSON files. *Fix*: Transition `db-logic.js` to dynamic API routes (Supabase).
- **Search & Filter Gaps**: Global search and sidebar filters are currently non-functional stubs. *Fix*: Implement PostgreSQL Full-Text Search and query param handling.
- **Dynamic Detail Pages**: `event.html` and `person.html` require URL query param logic to populate from the database rather than placeholders.
- **Pagination**: The "Load More" button needs offset/limit logic to handle large datasets.

### 2. Schema Mismatches (Integrity)
- **Missing UI Fields**: JSON files contain `tags`, `icon`, and `middle_name` fields that are not yet stored or enforced in the PostgreSQL schema.
- **Cascade Deletion Bugs**: Deleting a `source_excerpt` currently cascades to `assertion_support`, silently breaking the evidentiary chain. *Fix*: Implement `prevent_source_excerpt_deletion()` trigger in Migration 005.
- **Relationship Parity**: UI assumes `parent_event_id` and `organization` strings, whereas the schema requires `event_relation` and `event_participant` junction table links.

### 3. Migration 005 Task List
- [ ] Add `prevent_source_excerpt_deletion()` trigger.
- [ ] Implement `ON DELETE SET NULL` on all junction table `assertion_id` columns.
- [ ] Enforce `NOT NULL` on `event.time_precision` and `event.title`.
- [ ] Standardize UUID vs. Slug handling for entity routing.
