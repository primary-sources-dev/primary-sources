# Quick Wins Sprint Plan

**Created**: 2026-02-23  
**Status**: ✅ COMPLETE  
**Completed**: 2026-02-23  
**Scope**: 6 features, ordered by dependencies and effort

---

## Execution Order

| Order | Feature | Effort | Est. Time | Dependencies |
|-------|---------|--------|-----------|--------------|
| **1** | Mobile Photos (.heic) | Trivial | 15 min | None |
| **2** | Age-at-Event Badge | Trivial | 30 min | None |
| **3** | Footer Parser (FBI 302) | Low | 1 hr | Extends MetadataParser |
| **4** | Auto-Generated Citations | Low | 1 hr | Source table schema |
| **5** | Inflation Converter | Low | 1 hr | CPI reference data |
| **6** | Database Lookup Entity Matching | Low | 2 hrs | Supabase connection |

**Rationale**: Trivial items first to build momentum, then progressively complex features. Entity Matching is last because it's the gateway to the larger "Smart Evidence" pipeline.

---

## Feature 1: Mobile Photos (.heic Support)

### Goal
Enable iPhone photo uploads without manual conversion.

### Implementation

**Files to modify:**
- `tools/ocr-gui/ocr_worker.py` (or equivalent image handler)

**Steps:**
1. Install `pillow-heif` library
2. Add `.heic` and `.HEIC` to accepted file extensions
3. In image preprocessing, detect HEIC and convert to JPEG before Tesseract
4. Test with sample iPhone photo

**Code Pattern:**
```python
from pillow_heif import register_heif_opener
register_heif_opener()

# Now PIL.Image.open() handles .heic automatically
```

### Acceptance Criteria
- [ ] Upload `.heic` file via OCR UI
- [ ] File converts and processes without error
- [ ] OCR output matches quality of equivalent JPEG

---

## Feature 2: Age-at-Event Badge

### Goal
Display "(Age XX)" badge next to person names on event/document pages.

### Implementation

**Files to modify:**
- `supabase/migrations/` — new migration for computed view
- Frontend component (when UI exists)

**Steps:**
1. Create SQL view or function:
   ```sql
   CREATE OR REPLACE FUNCTION age_at_event(p_person_id UUID, p_event_id UUID)
   RETURNS INTEGER AS $$
   SELECT EXTRACT(YEAR FROM AGE(e.start_ts, p.birth_date))::INTEGER
   FROM person p, event e
   WHERE p.person_id = p_person_id AND e.event_id = p_event_id
     AND p.birth_date IS NOT NULL AND e.start_ts IS NOT NULL;
   $$ LANGUAGE SQL STABLE;
   ```
2. Create view joining `event_participant` with age calculation
3. Document in `docs/architecture-and-schema.md`

### Acceptance Criteria
- [ ] SQL function returns correct age for known test case (e.g., Yates born 1936, event 1963 = age 27)
- [ ] NULL birth_date returns NULL (not error)
- [ ] View is queryable for UI consumption

---

## Feature 3: Footer Parser (FBI 302)

### Goal
Extract agent name and file number from FBI 302 footers.

### Implementation

**Files to modify:**
- `tools/ocr-gui/metadata_parser.py` — extended to include footer parsing (formerly `header_parser.py`)

**Steps:**
1. Add `FOOTER_WINDOW = 1500` constant (last N characters)
2. Create `FooterParser` class with FBI 302-specific patterns:
   - Agent signature line: `by Special Agent [NAME]`
   - File number: `File # [XX-XXXXX]` or `[City] [XX-XX]`
   - Date of transcription (often in footer)
3. Add `parse_footer()` method to main parser
4. Update `ParsedMetadata` dataclass to include footer fields
5. Auto-run footer parser after header parser in `ocr-server.py` (now `metadata_parser.py`)

**New Patterns:**
```python
FOOTER_PATTERNS = {
    "fbi_transcribed_by": {
        "pattern": r"(?:transcribed|dictated)\s+by\s+(?:SA\s+)?(?P<agent>[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)",
        "maps_to": "author",
        "confidence": "HIGH",
    },
    "fbi_footer_file": {
        "pattern": r"(?P<file>[A-Z]{2}\s*\d{2,3}-\d+)\s*$",
        "maps_to": "file_number",
        "confidence": "MEDIUM",
    },
}
```

### Acceptance Criteria
- [ ] Yates FBI 302 (`yates-searchable.pdf`) extracts agent name from footer
- [ ] File number extracted if present
- [ ] Results merged with header extraction in unified output
- [ ] UI metadata preview shows footer-sourced fields

---

## Feature 4: Auto-Generated Citations

### Goal
One-click citation generation in Chicago, MLA, APA formats.

### Implementation

**Files to create:**
- `tools/citation_generator.py` — citation formatting module

**Steps:**
1. Define citation templates for each format:
   ```python
   TEMPLATES = {
       "chicago": "{author}. \"{title}.\" {source_type}, {published_date}. {archive}, {external_ref}.",
       "mla": "{author}. \"{title}.\" {source_type}, {published_date}. {archive}. {external_ref}.",
       "apa": "{author} ({year}). {title}. {source_type}. {archive}. {external_ref}.",
   }
   ```
2. Create `generate_citation(source_dict, format)` function
3. Handle missing fields gracefully (omit rather than show "None")
4. Add NARA RIF formatting: `NARA RIF 104-10001-10001`
5. Add `/api/cite` endpoint to Flask server
6. Add "Copy Citation" button to OCR UI metadata preview

### Acceptance Criteria
- [ ] Chicago format output matches manual citation
- [ ] MLA format output matches manual citation
- [ ] APA format output matches manual citation
- [ ] Missing author gracefully handled
- [ ] NARA RIF number included when `external_ref` present

---

## Feature 5: Inflation Converter

### Goal
Convert historical USD to 2026 purchasing power.

### Implementation

**Files to create:**
- `tools/inflation.py` — CPI conversion module
- `data/cpi_annual.json` — CPI reference data (1913-2026)

**Steps:**
1. Source CPI data from Bureau of Labor Statistics
2. Create JSON lookup table:
   ```json
   {
     "1963": 30.6,
     "1964": 31.0,
     ...
     "2026": 320.0
   }
   ```
3. Implement conversion function:
   ```python
   def convert_to_modern(amount: float, year: int, target_year: int = 2026) -> float:
       return amount * (CPI[target_year] / CPI[year])
   ```
4. Add `/api/inflate` endpoint
5. Frontend: Add hover tooltip or toggle for currency values

### Acceptance Criteria
- [ ] $25.00 in 1963 → ~$250 in 2026 (10x multiplier approximately)
- [ ] API returns both original and converted values
- [ ] Handles years outside CPI range gracefully

---

## Feature 6: Database Lookup Entity Matching

### Goal
Auto-link OCR text to known entities in the vault.

### Implementation

**Files to create:**
- `tools/entity_matcher.py` — entity matching module

**Steps:**
1. Create Supabase client connection (read-only)
2. Load entity lookup tables on startup:
   ```python
   def load_entities():
       persons = supabase.table("person").select("person_id, display_name").execute()
       aliases = supabase.table("person_alias").select("person_id, alias_value").execute()
       places = supabase.table("place").select("place_id, name").execute()
       orgs = supabase.table("org").select("org_id, name").execute()
       return build_lookup_index(persons, aliases, places, orgs)
   ```
3. Implement exact match scanner:
   ```python
   def find_entities(text: str, lookup: dict) -> list[EntityMatch]:
       matches = []
       for entity_name, entity_info in lookup.items():
           if entity_name.lower() in text.lower():
               matches.append(EntityMatch(
                   text=entity_name,
                   entity_type=entity_info["type"],
                   entity_id=entity_info["id"],
                   confidence=1.0,
                   method="exact_match"
               ))
       return matches
   ```
4. Output `entities.json` sidecar file
5. Add to post-OCR pipeline (after header/footer parsing)
6. UI: Add "Entities" badge to completed jobs

### Acceptance Criteria
- [ ] "Ralph Leon Yates" in OCR text → links to person_id
- [ ] "Dallas" → links to place_id (with disambiguation note if multiple)
- [ ] Unknown names flagged as "needs_review"
- [ ] `entities.json` sidecar generated alongside `.txt` output
- [ ] UI shows entity count badge on completed jobs

---

## Deliverables Checklist

| Feature | Code | Tests | Docs | UI |
|---------|------|-------|------|----|
| 1. .heic Support | [x] | [x] | [x] | N/A |
| 2. Age-at-Event | [x] | [x] | [x] | Future |
| 3. Footer Parser | [x] | [x] | [x] | Auto |
| 4. Citations | [x] | [x] | [x] | API |
| 5. Inflation | [x] | [x] | [x] | API |
| 6. Entity Matching | [x] | [x] | [x] | API |

---

## Post-Sprint Updates

After completing each feature:
1. Mark as `[x]` in `next-up.md` under Completed Quick Wins
2. Update `roadmap.md` status if applicable
3. Update `scanner-improvements.md` if OCR-related
4. Commit with `feat:` prefix

---

*Ready to execute. Start with Feature 1: Mobile Photos (.heic)*
