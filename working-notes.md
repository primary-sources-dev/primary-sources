# Working Notes: Primary Sources Master Strategy
*Last Updated: 2026-02-24*

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
- **Document Layout Analyzer**: ✅ LIVE (v1.5)
    - **20 Document Types**: FBI_302, CIA_CABLE, CIA_201, DPD_REPORT, MEDICAL_RECORD, HSCA_DOC, CHURCH_COMMITTEE, HANDWRITTEN, and more.
    - **Fingerprinting**: Weighted regex pattern matching with OCR-tolerant variants.
    - **Zone-Specific Parsing**: Type-specific extraction from headers, footers, and body zones.
    - **78.2% Classification Rate**: Validated across Warren Commission, HSCA, Church Committee, CIA 201, and Yates collections.
- **Layout Analyzer v2.0 (LIVE - Phase 1, 2 & 3)**:
    - **Body Format Analysis**: Recursive segmentation of body text into Q&A and numbered claims.
    - **Narrative Entity Linking**: Interactive mapping of body text to people/places databases.
    - **Fuzzy Fingerprinting**: ✅ LIVE — Levenshtein Distance matching (RapidFuzz) to classify garbled OCR. ~2.3x improvement on degraded scans.
    - **Classification Review UI**: ✅ LIVE — Standalone bulk review tool (`classifier-review.html`) with page images, correct/incorrect feedback, type override dropdown, and JSON export. Used for classifier tuning.
    - **Workbench Classification Integration**: (Planned) Migrate review UI features into PDF Workbench:
        - Feedback buttons + type override dropdown
        - Deep sync highlighting on matched fingerprint text
        - Batch page navigation with keyboard shortcuts
        - Live re-classification toggle
    - **Visual Seal Detection**: (Planned) Computer Vision (YOLO) to identify Agency seals/stamps.
    - **Table Transformer (TATR)**: (Planned) Converting box scores and financial ledgers into structured markdown.
- **Commit-to-DB**: One-click persistence of verified text and entities into the research vault.

---

## IV. Execution: Next Up & Quick Wins

### Active Build Pool (High Impact / Low Effort)
1.  **Extraction Workbench Phase 4 (Commit)**: Backend logic to save workbench results directly to SQL.

### Recently Completed (2026-02-24)
- [x] **Document Analyzer v1.5**: Added detection for CIA 201 files, DPD Reports, Medical Records, and Handwritten notes.
- [x] **OCR Cross-Port Nav**: Fixed core navigation header/footer breakage between port 5000 and 8000.
- [x] **Tool Information Page Template**: Canonical structure for analytical tool pages (`docs/ui/templates/tool-information-page.md`).
- [x] **OCR Tool Info Page**: Full informational page with Extraction Workbench, Deep Sync, batch processing features.
- [x] **PDF Viewer Refactor**: Migrated to standard template with modular header, workflow diagram, and Live status.
- [x] **Document Analyzer UI**: Updated to Live status with refined document grid and v1.5 metrics.
- [x] **Citation Generator Page**: Updated to Live status with emerald styling.
- [x] **Dashboard Card Standardization**: All 4 Analytical Tools cards now use consistent compact layout with Live badges.
- [x] **Navigation Split Architecture**: Dashboard cards → info pages; header nav → functional tools.

### Previously Completed (2026-02-23 Marathon)
- [x] **Forensic PDF Workbench**: High-fidelity metadata ribbon (RIF, Agency, Date) and sidecar review pane.
- [x] **Intelligence Layer (Psychology)**: AI-powered entity highlighting (CIA, FBI, Oswald) directly on document scans.
- [x] **Universal Navigation Robustness**: Site-root relative component loading (`/`) fixing header breakage in subdirectories.
- [x] **"On This Day" (OTD) Dashboard**: Refactored from home page widget to dedicated discovery portal with Day/Week/Year temporal filters.
- [x] **UX/UI Polish Bundle**: Snappy transitions (300ms), dynamic breadcrumbs, and status labels.
- [x] **Auto-Generated Citations**: Chicago, MLA, APA, NARA formats in one click.
- [x] **Mobile Native Support**: Direct upload of iPhone .heic images.
- [x] **Footer Parsing**: Extraction of Agency File numbers and Agent names from FBI 302 footers.
- [x] **Universal Person Profile**: Production-ready `person.html` with modular card library architecture.
- [x] **ZIP Processor**: Batch unrolling of .zip and .tar archives for bulk archival ingestion.

---

## V. Technical Debt & Migration Sync

This section tracks the blockers for the Next.js migration and known schema/data mismatches that must be resolved to achieve full relational parity.

### 1. Critical Migration Blockers (UI/UX)
- [ ] **Static Data Architecture**: UI currently relies on hardcoded JSON files. *Fix*: Transition `db-logic.js` to dynamic API routes (Supabase).
- [ ] **Search & Filter Gaps**: Global search and sidebar filters are currently non-functional stubs. *Fix*: Implement PostgreSQL Full-Text Search and query param handling.
- [ ] **Dynamic Detail Pages**: `event.html` and `person.html` require URL query param logic to populate from the database rather than placeholders.
- [ ] **Pagination**: The "Load More" button needs offset/limit logic to handle large datasets.

### 2. Schema Mismatches (Integrity)
- [x] **Mock Data Field Names**: Aligned with Supabase schema (`org_id`, `place_type`, `object_type`, `source_type`).
- [ ] **Missing UI Fields**: JSON files contain `tags`, `icon` fields not in PostgreSQL schema. *Decision needed*: Add to schema or remove from mock data.
- [ ] **Cascade Deletion Bugs**: Deleting a `source_excerpt` currently cascades to `assertion_support`, silently breaking the evidentiary chain. *Fix*: Implement `prevent_source_excerpt_deletion()` trigger.
- [ ] **Relationship Parity**: UI assumes `parent_event_id` and `organization` strings, whereas the schema requires `event_relation` and `event_participant` junction table links.

### 3. Applied Migrations (001-006)
| Migration | Purpose | Status |
|-----------|---------|--------|
| 001_initial_schema.sql | Core tables, indexes, polymorphic FK triggers | ✅ Ready |
| 002_seed_vocab.sql | All 12 controlled vocabulary tables | ✅ Ready |
| 003_predicate_registry.sql | v_predicate table + FK constraint | ✅ Ready |
| 004_integrity_fixes.sql | CHECK constraints, deletion protection, updated_at | ✅ Ready |
| 005_age_at_event.sql | age_at_event() function + participant view | ✅ Ready |
| 006_fix_view_column.sql | Fix view column name (role → role_type) | ✅ Ready |

### 4. Migration 007 Task List (Pending)
- [ ] Add `prevent_source_excerpt_deletion()` trigger.
- [ ] Implement `ON DELETE SET NULL` on all junction table `assertion_id` columns.
- [ ] Enforce `NOT NULL` on `event.time_precision` (with default 'UNKNOWN').
- [ ] Consider adding `tags` column to entity tables for UI compatibility.
