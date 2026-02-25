# HTML Prototype: Domain-Driven Entity Restructuring Plan

**Status**: 📋 READY FOR EXECUTION (FINALIZED)
**Objective**: Finalize the "Forensic Archive" UI architecture by consolidating all views into a nested, domain-oriented directory structure and moving the terminal code to the `web/html/` root.

---

## 🏛 The Vision: Exploration & Analysis Hub

This plan moves the HTML prototype out of the documentation folder and into a professional development root. It transforms "Features" into "Exploration" tools and "Browse" actions into "Domain Modules."

### Directory Strategy
- **`web/html/entities/`**: Domain-driven modules (Index/Details).
- **`web/html/tools/`**: Research and analysis utilities.
- **`web/html/tools/ocr/`**: Specialized PDF and OCR viewing tools.
- **`web/html/exploration/`**: Discovery-based entry points (Atlas, OTD, Random).
- **`archived/`**: (Root level) Strategic isolation of legacy code and drafts.

---

## 📂 Transformation Map (Consolidation)

### 1. Entity Domains (Consolidating Browse + Profiles)
All files moved to `web/html/entities/` subdirectories.

| Entity Type | Source Paths | Target Nested Path | New Convention |
| :--- | :--- | :--- | :--- |
| **People** | `browse/people.html`, `entities/person.html` | `entities/person/person-index.html`, `person-details.html` | **Index / Details** |
| **Events** | `browse/events.html`, `entities/event.html` | `entities/event/event-index.html`, `event-details.html` | **Index / Details** |
| **Places** | `browse/places.html`, `entities/place.html` | `entities/place/place-index.html`, `place-details.html` | **Index / Details** |
| **Objects** | `browse/objects.html`, `entities/object.html` | `entities/object/objects-index.html`, `object-details.html` | **Index / Details** |
| **Orgs** | `browse/organizations.html`, `entities/organization.html` | `entities/organization/org-index.html`, `org-details.html` | **Index / Details** |
| **Sources** | `browse/sources.html`, `entities/source.html` | `entities/source/sources-index.html`, `source-details.html` | **Index / Details** |

### 2. Specialized Folders
| Source Dir | Target Root-Level Path | Role |
| :--- | :--- | :--- |
| `docs/ui/archived/` | `primary-sources/archived/` | **Legacy/Drafts** |
| `docs/ui/templates/` | `docs/ui/templates/` | **Documentation Templates** |
| `docs/ui/features/` | `web/html/exploration/` | **Discovery Tools** (Atlas, OTD) |
| `docs/ui/ocr/` | `web/html/tools/ocr/` | **PDF & OCR UI** |
| `docs/ui/tools/` | `web/html/tools/` | **Research Utilities** |
| `docs/ui/pages/` | `web/html/pages/` | **Informational / Blog** |

---

## 🛠 Execution Steps

### Phase 1: Physical Restructure
1. Create new root `archived/` folder.
2. Create `web/html/` and its major sub-hubs: `entities/`, `tools/`, `exploration/`, `pages/`.
3. Create the 6 domain subfolders within `entities/`.
4. Perform the "Great Shift" (Moves & Renames).

### Phase 2: Global Link Repair
Execute an automated refactor script to update 100+ absolute paths.
- **Rules**: 
  - `/docs/ui/browse/people.html` ➔ `/web/html/entities/person/person-index.html`
  - `/docs/ui/entities/person.html` ➔ `/web/html/entities/person/person-details.html`
  - `/docs/ui/assets/` ➔ `/web/html/assets/`
  - `/docs/ui/ocr/` ➔ `/web/html/tools/ocr/`
  - `/docs/ui/features/` ➔ `/web/html/exploration/`

### Phase 3: Logic & Component Sync
1. **`db-logic.js`**: Update entity routing logic and JSON data fetching.
2. **`components/`**: Update all navigation links in the header and bottom-nav.
3. **Breadcrumbs**: Synchronize "Back to Index" links to use relative paths within domain folders.

---

## ✅ Total Expected Outcome
The repository is transformed into a domain-driven system where the **HTML Stack** is cleanly isolated in `web/html/`, prepared for side-by-side comparison with the future **Next.js Stack** in `web/next/`, while documentation is safely protected in `docs/`.

---
*Part of the Primary Sources: Historical Engine Technical Foundation.*
