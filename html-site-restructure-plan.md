# HTML Prototype: Domain-Driven Entity Restructuring Plan

**Status**: 📋 READY FOR EXECUTION
**Objective**: Finalize the "Forensic Archive" UI architecture by consolidating all entity views into a nested, subject-oriented directory structure.

---

## 🏛 The Vision: Subject-Agnostic Modular Hubs

This plan moves the HTML prototype away from generic "Browse" actions and into a **Domain-Driven Architecture**. Each core entity type (Person, Event, Place, etc.) will reside in its own folder, serving as a scalable "Intelligence Hub."

### Core Naming Convention
- **Plural (The Index)**: `[entity]-index.html` (Searchable inventory/list view)
- **Singular (The Details)**: `[entity]-details.html` (Deep-dive forensic profile)

---

## 📂 Transformation Map (Consolidation)

All files will be moved into `docs/ui/entities/` subdirectories.

| Data Type | Source Path (Browse/Root) | Target Nested Path | New Convention |
| :--- | :--- | :--- | :--- |
| **People** | `browse/people.html` | `entities/person/person-index.html` | **Index** |
| | `entities/person.html` | `entities/person/person-details.html` | **Details** |
| **Events** | `browse/events.html` | `entities/event/event-index.html` | **Index** |
| | `entities/event.html` | `entities/event/event-details.html` | **Details** |
| **Places** | `browse/places.html` | `entities/place/place-index.html` | **Index** |
| | `entities/place.html` | `entities/place/place-details.html` | **Details** |
| **Objects** | `browse/objects.html` | `entities/object/objects-index.html` | **Index** |
| | `entities/object.html` | `entities/object/object-details.html` | **Details** |
| **Orgs** | `browse/organizations.html` | `entities/organization/org-index.html` | **Index** |
| | `entities/organization.html` | `entities/organization/org-details.html` | **Details** |
| **Sources** | `browse/sources.html` | `entities/source/sources-index.html` | **Index** |
| | `entities/source.html` | `entities/source/source-details.html` | **Details** |

---

## 🛠 Execution Steps

### Phase 1: Physical Restructure
1. Create entity-specific subdirectories: `person/`, `event/`, `place/`, `object/`, `organization/`, `source/`.
2. Move and rename the `.html` files according to the map above.

### Phase 2: Path & Link Repair
1. **Global Components**:
   - Update `bottom-nav.html` category links.
   - Update `header.html` dropdown and mobile navigation.
2. **Dynamic Logic**:
   - Update `db-logic.js` (Card link generator) to route into nested subfolders.
   - Update `global-search.js` to map entity types to their specific directories.

### Phase 3: Breadcrumb Synchronization
- Loop through all 12 newly moved files.
- Update internal "Back to List" links to point to the local `index.html` (sibling) rather than the relative `../browse/` path.

---

## ✅ Expected Results

1. **Scalability**: New analytic tools (e.g., `event-map.html`) can be added directly to the `event/` folder without cluttering the root.
2. **Architectural Clarity**: High-precision separation between "The Library" (Index) and "The Record" (Details).
3. **Forensic Aesthetic**: URLs and structure will mirror professional historical repositories.

---

*Part of the Primary Sources: Historical Engine Technical Foundation.*
