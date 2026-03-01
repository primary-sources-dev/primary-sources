# CLAUDE.md — Primary Sources Research Vault

## Current Mission

Build Document Workbench end-to-end: **Input → Source → Classify → Entities → Export**. Once input-to-export works and entities auto-populate the UI for the Yates event, port to Next.js.

1. Complete workbench (all 5 tabs functional)
2. Export writes to data files → then Supabase
3. Entity pages populate from exported data
4. Port to Next.js → `docs/nextjs-port-plan.md`

## Hard Rules

1. Never modify global components (`web/html/components/header.html`, `bottom-nav.html`) without explicit instruction
2. Never bypass controlled vocabulary — `v_*` tables → `docs/ontology-and-controlled-vocab.md`
3. Never modify applied migrations (001-006) — new numbered files only → `supabase/migrations/`
4. Never break the assertion chain → `docs/architecture-and-schema.md` Section 8
5. Never store facts — assertions backed by `source_excerpt` only

## Build-Inline Rules (Next.js Alignment)

Applied automatically. Full mapping → `docs/nextjs-port-plan.md`

1. Separate data from rendering
2. Centralize state in one object/class
3. Data attributes for behavior, classes for styling
4. Clean API contracts — plain JSON only
5. Isolate side effects in dedicated methods
6. Version localStorage keys with `v1_` prefix
7. CSS classes for theming, not inline JS styles
8. One function, one job

## Build

```bash
cd web/html && python build.py --clean && python build.py && python validate-build.py
cd tools && python ocr_server.py  # http://localhost:5000
```

## Workbench

5-tab progressive unlock: Input → Source → Classify → Entities → Export

- Files: `web/html/tools/workbench/` (html, css) + `web/html/assets/js/workbench.js`
- API: `tools/ocr_server.py` + `tools/entity_matcher.py` + `tools/ocr-gui/document_classifier.py`
- Header tabs: `injectHeaderTabs()` in workbench.js, styles `.header-tabs` / `.header-tab-btn`

## Key Paths

- **Data:** `web/html/assets/data/*.json` (people, events, objects, organizations, places, sources)
- **Entities:** `web/html/entities/{type}/` (index + details per type, 6 types)
- **JS:** `web/html/assets/js/` (profile, cards, db-logic per entity type)
- **Components:** `web/html/components/` (header, footer, bottom-nav, mega-menu, facet-bar, animated-card)
- **Schema:** `supabase/migrations/001-006` → `docs/architecture-and-schema.md`
- **Vocab:** `docs/ontology-and-controlled-vocab.md`
- **Port plan:** `docs/nextjs-port-plan.md`
- **Roadmap:** `archived/working-notes.md`
- **API Routes:** `.coderef/routes.json` (27 Flask endpoints in `tools/ocr_server.py`)
- **CodeRef:** `.coderef/` (index.json, graph.json, diagrams/)

## Schema

| Entity | Table | ID | Discriminator |
|---|---|---|---|
| Person | `person` | `person_id` | `person` |
| Org | `org` | `org_id` | `org` |
| Place | `place` | `place_id` | `place` |
| Object | `object` | `object_id` | `object` |
| Event | `event` | `event_id` | `event` |
| Source | `source` | `source_id` | `source` |

Constraints: polymorphic FK triggers, deletion protection, time precision contract. Use `lower()` not `ILIKE`.

## Don't

- Modify migrations 001-006
- Free-text controlled vocab fields
- Assertions without `assertion_support`
- `ILIKE` — use `lower()`
- Global components without instruction
- Event participants without `assertion_id`
