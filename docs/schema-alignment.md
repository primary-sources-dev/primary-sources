# Schema Alignment: Classifier UI vs. Database

**Date:** 2026-02-27
**Migration:** `015_classifier_vocab.sql`
**Scope:** Reconcile the 4-tier vocabulary used by the Classifier Review UI (`web/html/tools/classifier/classifier-ui.html`, lines 547-555) with the database controlled vocabulary tables seeded in `supabase/migrations/002_seed_vocab.sql`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tier 1 -- Agency (`v_agency`)](#2-tier-1--agency-v_agency)
3. [Tier 2 -- Class / Source Type (`v_source_type`)](#3-tier-2--class--source-type-v_source_type)
4. [Tier 3 -- Format (`v_doc_format`)](#4-tier-3--format-v_doc_format)
5. [Tier 4 -- Content Tags (`v_content_type`)](#5-tier-4--content-tags-v_content_type)
6. [Schema Infrastructure Status](#6-schema-infrastructure-status)
7. [Migration 015 Plan](#7-migration-015-plan)
8. [Affected Files](#8-affected-files)
9. [Future Work](#9-future-work)

---

## 1. Executive Summary

The Classifier Review UI defines four metadata tiers per document page. An earlier analysis assumed the database was missing tables and columns for Agency, Format, and Content Tags. **Verification against the current schema (`001_initial_schema.sql`) reveals that the structural foundation already exists:**

- `v_agency` table and `source.origin_agency` column -- **present**
- `v_doc_format` table and `source.doc_format` column -- **present**
- `v_content_type` table and `source_content_type` junction table -- **present**
- `source_content_type` junction table for multi-tag support -- **present**

The remaining gaps are **vocabulary-only**: missing seed values in `v_source_type` and `v_doc_format`. No new tables or columns are needed.

---

## 2. Tier 1 -- Agency (`v_agency`)

**Status: FULLY ALIGNED**

| Code    | UI (`AGENCIES`) | DB (`v_agency`) |
|---------|:-:|:-:|
| FBI     | Y | Y |
| CIA     | Y | Y |
| DPD     | Y | Y |
| WC      | Y | Y |
| HSCA    | Y | Y |
| NARA    | Y | Y |
| SS      | Y | Y |
| UNKNOWN | Y | Y |

**Schema column:** `source.origin_agency TEXT REFERENCES v_agency(code)`

No action required.

---

## 3. Tier 2 -- Class / Source Type (`v_source_type`)

**Status: PARTIAL MATCH -- 7 missing codes**

| Code           | UI (`CLASSES`) | DB (`v_source_type`) | Notes |
|----------------|:-:|:-:|-------|
| REPORT         | Y | Y | |
| TESTIMONY      | Y | Y | |
| MEMO           | Y | Y | |
| CABLE          | Y | - | Add in migration 015 |
| CORRESPONDENCE | Y | - | Add in migration 015 |
| EXHIBIT        | Y | - | Add in migration 015 |
| DEPOSITION     | Y | - | Add in migration 015 |
| AFFIDAVIT      | Y | - | Add in migration 015 |
| TRAVEL         | Y | - | Add in migration 015 |
| OTHER          | Y | - | Add in migration 015 |
| BOOK           | - | Y | Keep (broader source type) |
| FILM           | - | Y | Keep (broader source type) |
| PHOTO          | - | Y | Keep (broader source type) |
| ARTICLE        | - | Y | Keep (broader source type) |

**Schema column:** `source.source_type TEXT NOT NULL REFERENCES v_source_type(code)`

**Action:** Insert 7 new codes into `v_source_type`.

---

## 4. Tier 3 -- Format (`v_doc_format`)

**Status: PARTIAL MATCH -- 7 missing codes**

The UI FORMATS list and the DB `v_doc_format` table overlap on a few entries but target different purposes. The UI focuses on specific agency form templates (FD-302, AIRTEL); the DB has broader structural formats (COVER_SHEET, INDEX_PAGE). Both are valid uses of the `v_doc_format` vocabulary.

| Code             | UI (`FORMATS`) | DB (`v_doc_format`) | Notes |
|------------------|:-:|:-:|-------|
| CABLE            | Y | Y | Already present |
| RIF              | Y | Y | Already present |
| FD-302           | Y | - | Add in migration 015 |
| AIRTEL           | Y | - | Add in migration 015 |
| TELETYPE         | Y | - | Add in migration 015 |
| MEMO             | Y | - | Add in migration 015 |
| LETTER           | Y | - | Add in migration 015 |
| ENVELOPE         | Y | - | Add in migration 015 |
| PASSPORT         | Y | - | Add in migration 015 |
| VISA             | Y | - | Add in migration 015 (stored as VISA_FORM to avoid confusion with travel visa concepts) |
| OTHER            | Y | - | Add in migration 015 |
| 201_FILE         | - | Y | Keep (CIA personality file) |
| AFFIDAVIT        | - | Y | Keep |
| DEPOSITION       | - | Y | Keep |
| EXHIBIT          | - | Y | Keep |
| TESTIMONY        | - | Y | Keep |
| COVER_SHEET      | - | Y | Keep |
| INDEX_PAGE       | - | Y | Keep |
| TOC              | - | Y | Keep |
| GENERIC_TEMPLATE | - | Y | Keep |

**Schema column:** `source.doc_format TEXT REFERENCES v_doc_format(code)`

**Action:** Insert 9 new codes into `v_doc_format` (FD-302, AIRTEL, TELETYPE, MEMO, LETTER, ENVELOPE, PASSPORT, VISA_FORM, OTHER).

---

## 5. Tier 4 -- Content Tags (`v_content_type`)

**Status: FULLY ALIGNED**

| Code               | UI (`CONTENT_TYPES`) | DB (`v_content_type`) |
|--------------------|:-:|:-:|
| WITNESS_INTERVIEW  | Y | Y |
| FORENSIC_ANALYSIS  | Y | Y |
| BALLISTICS         | Y | Y |
| SURVEILLANCE       | Y | Y |
| INVESTIGATIVE_SUMM | Y | Y |
| AUTOPSY_REPORT     | Y | Y |
| SECURITY_CLEARANCE | Y | Y |
| POLYGRAPH_EXAM     | Y | Y |
| TIPS_AND_LEADS     | Y | Y |
| ADMINISTRATIVE     | Y | Y |
| CORRESPONDENCE     | Y | Y |
| SEARCH_WARRANT     | Y | Y |

**Schema table:** `source_content_type` (junction table for multi-tagging via `source_id` + `content_type`)

No action required.

---

## 6. Schema Infrastructure Status

| Infrastructure Item                        | Status | Location |
|--------------------------------------------|--------|----------|
| `v_agency` vocab table                     | Present | `001_initial_schema.sql` line 28 |
| `v_agency` seed data (8 codes)             | Present | `002_seed_vocab.sql` lines 188-197 |
| `source.origin_agency` FK column           | Present | `001_initial_schema.sql` line 165 |
| `v_doc_format` vocab table                 | Present | `001_initial_schema.sql` line 29 |
| `v_doc_format` seed data (11 codes)        | Present | `002_seed_vocab.sql` lines 200-212 |
| `source.doc_format` FK column              | Present | `001_initial_schema.sql` line 163 |
| `v_content_type` vocab table               | Present | `001_initial_schema.sql` line 30 |
| `v_content_type` seed data (12 codes)      | Present | `002_seed_vocab.sql` lines 215-228 |
| `source_content_type` junction table       | Present | `001_initial_schema.sql` lines 185-189 |
| `v_source_type` seed data (7 of 14 codes)  | Partial | `002_seed_vocab.sql` lines 83-91 |

---

## 7. Migration 015 Plan

**File:** `supabase/migrations/015_classifier_vocab.sql`

**Scope:** Vocabulary seed inserts only. No DDL (no new tables, columns, or triggers).

### Step 1: Expand `v_source_type` (7 new codes)

```sql
INSERT INTO v_source_type (code, label) VALUES
  ('CABLE',          'Classified field cable communication'),
  ('CORRESPONDENCE', 'Formal letter or official written exchange'),
  ('EXHIBIT',        'Evidence exhibit entered into investigation record'),
  ('DEPOSITION',     'Pre-trial sworn questioning transcript'),
  ('AFFIDAVIT',      'Signed sworn written statement'),
  ('TRAVEL',         'Travel-related document (passport application, visa, ticket)'),
  ('OTHER',          'Source type not covered by existing categories')
ON CONFLICT (code) DO NOTHING;
```

### Step 2: Expand `v_doc_format` (9 new codes)

```sql
INSERT INTO v_doc_format (code, label) VALUES
  ('FD-302',    'FBI Report of Interview (standard field interview form)'),
  ('AIRTEL',    'FBI priority internal communication (teletype-grade)'),
  ('TELETYPE',  'Teletype machine communication'),
  ('MEMO',      'Internal memorandum or routing slip'),
  ('LETTER',    'Formal correspondence on letterhead'),
  ('ENVELOPE',  'Mailing envelope (physical evidence)'),
  ('PASSPORT',  'Passport document or application'),
  ('VISA_FORM', 'Visa application or stamp document'),
  ('OTHER',     'Document format not covered by existing categories')
ON CONFLICT (code) DO NOTHING;
```

### Step 3: Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_source_origin_agency ON source(origin_agency);
CREATE INDEX IF NOT EXISTS idx_source_doc_format    ON source(doc_format);
CREATE INDEX IF NOT EXISTS idx_source_content_type_source ON source_content_type(source_id);
CREATE INDEX IF NOT EXISTS idx_source_content_type_type   ON source_content_type(content_type);
```

---

## 8. Affected Files

| File | Change |
|------|--------|
| `supabase/migrations/015_classifier_vocab.sql` | New migration (vocab inserts + indexes) |
| `supabase/README.md` | Add migration 015 to list |
| `docs/schema-alignment.md` | This document (new) |
| `docs/ontology-and-controlled-vocab.md` | Update Sections 6 and 17 with new codes (future) |
| `docs/architecture-and-schema.md` | Note new indexes (future) |

---

## 9. Future Work

These items are out of scope for migration 015 but are documented for tracking:

### Phase 2: UI Refactoring
- **Classifier UI** (`web/html/tools/classifier/classifier-ui.html`): Replace hardcoded `AGENCIES`, `CLASSES`, `FORMATS`, `CONTENT_TYPES` arrays with dynamic fetches from the database (or a shared JSON vocabulary file generated from the DB).
- **VISA vs. VISA_FORM mapping:** The UI uses `VISA` but the DB stores `VISA_FORM`. The UI should map this at the presentation layer, or be updated to use `VISA_FORM` directly.

### Phase 3: Train Classifier Updates
- **`tools/ocr-gui/train_classifier.py`** (if it exists): Update training pipeline to recognize the expanded vocabularies.
- **Document fingerprints:** Ensure new format codes (FD-302, AIRTEL, TELETYPE) have corresponding fingerprint patterns in the classifier engine.

### Phase 4: Documentation Sync
- Update `docs/ontology-and-controlled-vocab.md` with complete `v_source_type`, `v_doc_format` tables.
- Update `docs/architecture-and-schema.md` Section 2.2 (Source Typing Model) to reference classifier alignment.

### Phase 5: Legacy Cleanup
- The classifier UI also defines `ALL_DOC_TYPES` (line 558) with 27 legacy document type codes. These are not in any `v_*` table and are used only for backward compatibility with the old single-tier classification system. Once the 4-tier system is fully adopted, these should be deprecated.
