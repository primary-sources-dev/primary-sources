# Plan: Wire Export Tab into Classifier Review UI

## Context

The classifier review UI (`classifier-ui.html`) captures page-level classification feedback (agency, class, format, content tags) but has no way to push that data into the project's entity JSON files (`sources.json`, `people.json`, etc.). Meanwhile, the backend already has a full entity extraction pipeline (`EntityMatcher`, `EntityLinker`, `/api/entities` endpoint) that's never called from the classifier UI. The goal is to bridge this gap with an Export tab that aggregates page-level feedback into document-level records and writes them to entity JSON files.

**Key finding:** The `EntityMatcher` is initialized with hardcoded sample data (5 people, 5 places, 5 orgs) instead of loading from the actual entity JSON files. This needs to be fixed first.

---

## Files to Modify (3 files)

| File | Change |
|------|--------|
| `tools/entity_matcher.py` | Add `load_from_entity_files(data_dir)` method (after line 241) |
| `tools/ocr_server.py` | Fix EntityMatcher init (lines 78-87) + add `POST /api/entities/export` endpoint (after line 899) |
| `web/html/tools/classifier/classifier-ui.html` | Add tab CSS (after line 228), restructure HTML with tab system (lines 1009-1081), add Export tab JS (new script block) |

---

## Step 1: `entity_matcher.py` — Add `load_from_entity_files()` method

**Insert after line 241** (after `load_sample_data` ends, before `# MATCHING METHODS`)

New method that reads the 3 actual entity JSON files:
- `people.json` → index persons + nested aliases (alias_name field within each person's aliases array)
- `places.json` → index places
- `organizations.json` → index orgs

Uses `person_id`, `place_id`, `org_id` as ID fields (matching actual JSON structure).

---

## Step 2: `ocr_server.py` — Fix EntityMatcher initialization

**Replace lines 78-87.** Change from `load_sample_data()` to `load_from_entity_files(DATA_DIR)` with fallback to sample data if JSON files are empty.

Also add `EntityIndex` to the import on line 79.

---

## Step 3: `ocr_server.py` — Add `POST /api/entities/export` endpoint

**Insert after line 899** (after `/api/entities/index`, before the classifier review section).

Endpoint accepts:
```json
{
  "target_file": "sources.json",  // one of 6 allowed files
  "record": { ... },
  "action": "append"
}
```

Logic:
1. Validate `target_file` against allowlist (sources, people, organizations, places, objects, events)
2. Read existing JSON array from file
3. Check for duplicates by ID field and by name field
4. Create `.bak` backup
5. Append record, write back
6. If people/places/orgs file changed, reload EntityMatcher index
7. Return `{success, file, action: "created"|"duplicate_skipped", backup}`

---

## Step 4: `classifier-ui.html` — Add tab CSS

**Insert after line 228** (after `.verified-badge` rule, before `</style>`).

Styles for:
- `.tab-bar`, `.tab-btn`, `.tab-btn.active` — tab button bar
- `.tab-panel`, `.tab-panel.active` — show/hide tab content
- `.export-card` — section cards within Export tab
- `.entity-table` — entity results table with `.approved`/`.rejected` row states
- `.badge-entity-person/place/org` — colored type badges
- `.export-btn-primary/secondary` — export action buttons

---

## Step 5: `classifier-ui.html` — Restructure HTML with tab system

**Modify lines 1009-1081.** The existing content stays exactly the same but gets wrapped:

```
<div class="max-w-6xl mx-auto p-6">
  <!-- Header (unchanged) -->

  <!-- NEW: Tab Bar -->
  <div class="tab-bar">
    <button class="tab-btn active" data-tab="review">Review</button>
    <button class="tab-btn" data-tab="export">Export</button>
  </div>

  <!-- TAB: Review (wraps existing stats + cards — NO content changes) -->
  <div id="tab-review" class="tab-panel active">
    <div id="stats" ...>  (existing lines 1017-1074, unchanged)
    <div id="load-status" ...>  (existing line 1077, unchanged)
    <div id="cards-container" ...>  (existing line 1080, unchanged)
  </div>

  <!-- TAB: Export (new) -->
  <div id="tab-export" class="tab-panel">
    Section 1: Source Record Preview (editable form — name, type, agency, format, content tags, notes)
    Section 2: Entity Detection (button + matched entities table + new candidates table)
    Section 3: Export Actions (Export Source Record, Export New Entities, Download Feedback JSON buttons + log)
  </div>
</div>
```

---

## Step 6: `classifier-ui.html` — Add Export tab JavaScript

**New `<script>` block** after the existing feedback engine (after line ~1388, before `</body>`).

### Functions:

| Function | Purpose |
|----------|---------|
| `switchTab(name)` | Toggle tab-btn/tab-panel active classes; populate source preview on Export activation |
| `populateSourceRecordPreview()` | Aggregate reviewed pages: most-frequent agency/class/format, union of content tags, auto-name from filename |
| `detectEntities()` | Concatenate all page text, `POST /api/entities` with `include_candidates: true`, render results tables |
| `renderMatchedEntities(entities)` | Build table rows with Approve/Reject buttons, apply `entityApprovals` state |
| `renderCandidateEntities(candidates)` | Build candidates table with Add-as-New/Skip buttons |
| `approveEntity(idx)` / `rejectEntity(idx)` | Toggle approval state in localStorage, re-render |
| `exportSourceRecord()` | Build source record from form, include approved entities as people/orgs/places arrays, `POST /api/entities/export` to `sources.json` |
| `exportNewEntities()` | Loop approved candidates, build typed records (person→people.json, place→places.json, org→organizations.json), `POST /api/entities/export` for each |
| `showExportStatus(msg, type)` | Flash banner (green/yellow/red) |
| `logExport(msg)` | Append timestamped entry to visible export log |

### State:
- `entityApprovals` — persisted in localStorage key `classifier_export_{FILE_NAME}`
- `detectedEntities` / `detectedCandidates` — in-memory from last detection run

---

## Verification

1. **Server startup** — `python tools/ocr_server.py` prints "Entity matcher loaded N entities from JSON files" (not sample data fallback)
2. **Entity index** — `GET /api/entities/index` returns real counts from JSON files
3. **Export endpoint** — `POST /api/entities/export` with test record → creates `.bak`, appends to file, returns `"created"`; second identical call → returns `"duplicate_skipped"`
4. **Tab system** — Review tab shows existing content unchanged; Export tab shows 3 sections
5. **Source preview** — After reviewing pages in Review tab, switching to Export auto-populates most-frequent values
6. **Entity detection** — Click "Detect Entities" → calls `/api/entities` → table populates with matched entities and candidates
7. **Export flow** — Approve entities → click Export → verify JSON files updated with `.bak` backups
