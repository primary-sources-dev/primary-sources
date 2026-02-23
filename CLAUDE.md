# CLAUDE.md — AI Assistant Guide for Primary Sources Research Vault

This document provides context, constraints, and workflows for AI assistants working on this project.

---

## Project Overview

**Primary Sources Research Vault** is a PostgreSQL/Supabase database designed for rigorous historical research with academic-grade source traceability. The system stores **assertions** (claims) linked to **source excerpts** rather than static "facts," allowing for conflicting accounts and full provenance tracking.

**Use Case:** Historical event reconstruction (specifically designed for JFK assassination research, but adaptable to any historical event requiring meticulous source documentation).

**Core Philosophy:**
- **4NF Compliance:** All data normalized to Fourth Normal Form to prevent redundancy
- **Assertion-Based Modeling:** We don't store truth—we store claims with evidence
- **Polymorphic Design:** Entities can be of multiple types (person, org, place, object, event) with trigger-enforced referential integrity

---

## Critical Architectural Constraints

### 0. Hands-off Global Components

**Never** modify the global navigation or header/footer components unless explicitly instructed by the user. These components are established early and stabilize the UI. Specifically:
- **`docs/ui/components/bottom-nav.html`**: Master global navigation.
- **`docs/ui/components/header.html`**: Master site header.

**Why:** These files serve as the backbone of the UI and are frequently modified by the AI in ways that drift from the user's intent.

### 1. Never Bypass the Controlled Vocabulary

All type/role fields must reference `v_*` tables. **Never** accept free-text values for:
- `event_type` → must be in `v_event_type`
- `assertion.predicate` → must be in `v_predicate`
- `source_type` → must be in `v_source_type`
- All other `*_type`, `*_role`, `*_precision` fields

**Why:** The entire system's computability depends on semantic consistency.

### 2. Respect Migration Immutability

**Never modify a migration file after it has been applied.** Migrations are numbered sequentially (`001`, `002`, `003`, etc.). To fix or extend the schema:
- Create a new numbered migration file
- Document the change in `docs/architecture-and-schema.md`
- Update `supabase/README.md` to list the new migration

**Why:** Production databases cannot replay modified migrations without data loss.

### 3. Maintain the Assertion Chain

Every junction table entry (`event_participant`, `event_place`, `event_object`, `event_relation`) and attribute table entry (`person_alias`, `entity_identifier`) should include an `assertion_id` linking it back to evidence.

**Why:** This ensures every relationship in the database can be traced to a source excerpt.

### 4. Event Boundary Doctrine

Events must follow strict modeling rules (see `docs/architecture-and-schema.md` Section 8):
- Create separate events when timestamp, location, participants, or source excerpts differ
- Use `PART_OF` relation for procedural sub-steps within larger events
- Every event must have `event_type`, at least one participant/object, and at least one assertion

**Why:** Consistent event modeling enables reliable graph analysis and timeline generation.

---

## Project Structure

```
primary-sources/
├── docs/                          # All technical documentation
│   ├── README.md                  # Documentation index
│   ├── architecture-and-schema.md # Technical architecture spec
│   ├── ontology-and-controlled-vocab.md  # All v_ table definitions
│   ├── data-entry-sop.md          # Data entry workflow (5 phases)
│   ├── provenance-and-sourcing.md # Source citation standards
│   └── plan.md                    # Migration 004 implementation plan
├── supabase/
│   ├── README.md                  # Migration runner instructions
│   └── migrations/
│       ├── 001_initial_schema.sql        # Core tables + triggers
│       ├── 002_seed_vocab.sql            # Controlled vocabulary seed data
│       ├── 003_predicate_registry.sql    # Predicate FK constraint
│       └── 004_integrity_fixes.sql       # Polymorphic FKs, CHECK constraints, deletion protection
└── web/                           # Next.js data entry app (excluded from current scope)
```

---

## Key Documentation Files (Read These First)

### Essential Reading

1. **`docs/README.md`** — Start here for navigational overview
2. **`docs/architecture-and-schema.md`** — Complete technical specification
   - Section 5: Referential triggers (polymorphic FK enforcement)
   - Section 8: Event Boundary Doctrine
3. **`docs/ontology-and-controlled-vocab.md`** — Definitions of all type/role codes
4. **`docs/data-entry-sop.md`** — 5-phase workflow for adding data

### Reference Files

- **`supabase/migrations/*.sql`** — Actual schema DDL (source of truth for table structure)
- **`docs/provenance-and-sourcing.md`** — NARA RIF citation standards

---

## Schema Summary (27 Tables)

### Controlled Vocabularies (12 tables)
All `v_*` tables defining allowed codes for types, roles, and precision levels.

**Critical Tables:**
- `v_event_type` — Event categorization (SHOT, SIGHTING, TRANSFER, etc.)
- `v_predicate` — Allowed assertion predicates (WAS_PRESENT_AT, FIRED, TESTIFIED_THAT, etc.)
- `v_time_precision` — Timestamp certainty (UNKNOWN, APPROX, EXACT, RANGE)

### Core Entities (4 tables)
- `person` — Individual human actors
- `org` — Organizations/agencies
- `place` — Geographic locations (hierarchical via `parent_place_id`)
- `object` — Physical artifacts/evidence

### Event Model (5 tables)
- `event` — Temporal anchor point
- `event_participant` — Person/org participation in events
- `event_place` — Event locations
- `event_object` — Objects involved in events
- `event_relation` — Event-to-event relationships (PRECEDES, PART_OF, etc.)

### Evidence Layer (4 tables)
- `source` — Primary documents/media
- `source_excerpt` — Specific citations (page/timestamp)
- `assertion` — Subject-Predicate-Object claims
- `assertion_support` — Links assertions to excerpts (SUPPORTS/CONTRADICTS/MENTIONS)

### Attribute Tables (2 tables)
- `person_alias` — Alternate names (4NF split)
- `entity_identifier` — External IDs (FBI file numbers, exhibit numbers, etc.)

---

## Archive Support and Source Custodianship (Migration 002)

Archives (NARA, Mary Ferrell Foundation, Presidential Libraries, etc.) are modeled as **`org` entities with `org_type = 'ARCHIVE'`**. Sources are linked to their archival custodian via `entity_identifier` table.

**Key Patterns:**
- **Archive Organization:** `org` with `org_type = 'ARCHIVE'`, `name` = archive name, `notes` = holdings description + URL
- **Source-to-Archive Link:** `entity_identifier` with `id_type = 'ARCHIVE_CUSTODIAN'`, `id_value` = archive short code (e.g., 'NARA')
- **Place Types:** `'SITE'` for assassination-related locations (Dealey Plaza, Book Depository complex, etc.)

**Query Pattern:** Find all sources from a specific archive:
```sql
SELECT s.* FROM source s
  JOIN entity_identifier ei ON s.source_id = ei.entity_id
  WHERE ei.entity_type='source' AND ei.id_type='ARCHIVE_CUSTODIAN' AND ei.id_value='NARA'
```

---

## Integrity Features (Migration 004)

### Polymorphic FK Enforcement
**Triggers:** `check_assertion_subject_fk`, `check_assertion_object_fk`, `check_entity_identifier_fk`

Since PostgreSQL cannot natively enforce FKs on polymorphic references (e.g., `subject_id` could point to any entity table), custom triggers validate that UUIDs exist in the correct table based on `*_type` discriminator columns.

### Deletion Protection
**Triggers:** `prevent_*_deletion()` for person, org, place, object, event, source

Prevents deletion of entities that are referenced in downstream tables. For example, you cannot delete a person if they are referenced in `event_participant` or `assertion`.

### Time Precision Contract
**Trigger:** `check_event_time_precision()`

Enforces semantic rules:
- `UNKNOWN` → both timestamps must be NULL
- `APPROX` → start_ts NOT NULL, end_ts must be NULL
- `EXACT` → start_ts NOT NULL, end_ts NULL or equal to start_ts
- `RANGE` → both timestamps NOT NULL

### CHECK Constraints
- `chk_assertion_object_type` — Restricts object_type to valid entity types
- `chk_assertion_object_value` — Enforces mutual exclusivity (object_id XOR object_value)
- `chk_event_ts_order`, `chk_person_date_order`, etc. — Date range validations

### Indexes
- **Functional indexes** on `lower(display_name)`, `lower(name)` for case-insensitive de-duplication
  - **Query pattern:** `WHERE lower(display_name) = lower('search term')`
- **Partial unique index** on `source.external_ref` (WHERE NOT NULL) for NARA RIF uniqueness

---

## Common Tasks

### Adding a New Event Type

1. Create new migration file (e.g., `005_add_event_types.sql`)
2. Insert into `v_event_type`:
   ```sql
   INSERT INTO v_event_type (code, label) VALUES
     ('NEW_TYPE', 'Description of the new event type')
   ON CONFLICT (code) DO NOTHING;
   ```
3. Update `docs/ontology-and-controlled-vocab.md` Section 1
4. Update `supabase/README.md` to list migration 005

### Adding a New Predicate

1. Create new migration file
2. Insert into `v_predicate`:
   ```sql
   INSERT INTO v_predicate (code, label, notes) VALUES
     ('NEW_PREDICATE', 'Human-readable description', 'Optional usage notes')
   ON CONFLICT (code) DO NOTHING;
   ```
3. Update `docs/ontology-and-controlled-vocab.md` Section 10
4. Update migration list in `supabase/README.md`

### Modifying Table Structure

**Never modify existing migrations.** Instead:

1. Create new migration file (next sequential number)
2. Use `ALTER TABLE` for structural changes
3. Document changes in `docs/architecture-and-schema.md`
4. If adding triggers/constraints, update Section 5.2 or 5.3
5. Update `supabase/README.md`

### Adding Documentation

All new features must be documented in:
- `docs/architecture-and-schema.md` — Technical implementation
- `docs/data-entry-sop.md` — User workflow impact (if applicable)
- Migration file comments — Inline SQL documentation

---

## Testing Validation (Before Applying Migrations)

### Pre-Flight Checks

Before applying any new migration:

1. **Syntax Check:** Run migration against a local PostgreSQL instance first
2. **Rollback Plan:** Ensure you can recreate the database from 001 → 00N
3. **Documentation Sync:** Verify all docs reference the new migration

### Post-Application Validation

After applying migration 004 (or any new migration):

```sql
-- Verify all triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_%' ORDER BY tgname;

-- Verify all constraints exist
SELECT conname, contype FROM pg_constraint WHERE conname LIKE 'chk_%';

-- Verify all indexes exist
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%' ORDER BY indexname;

-- Test polymorphic FK trigger (should fail)
INSERT INTO assertion (subject_type, subject_id, predicate, assertion_type)
VALUES ('person', 'fake-uuid-12345', 'WAS_PRESENT_AT', 'PARTICIPATION');
-- Expected: ERROR: subject_id fake-uuid-12345 not found in person

-- Test time precision trigger (should fail)
INSERT INTO event (event_type, time_precision, start_ts, end_ts)
VALUES ('SHOT', 'APPROX', '1963-11-22 12:30:00', '1963-11-22 12:35:00');
-- Expected: ERROR: time_precision=APPROX requires end_ts to be NULL

-- Test updated_at trigger (should succeed and auto-update)
INSERT INTO person (display_name) VALUES ('Test Person');
UPDATE person SET given_name = 'John' WHERE display_name = 'Test Person';
SELECT updated_at > created_at FROM person WHERE display_name = 'Test Person';
-- Expected: TRUE
```

---

## What to Avoid

### ❌ Don't

- **Don't** modify existing migration files (`001`, `002`, `003`, `004`)
- **Don't** accept free-text values for controlled vocabulary fields
- **Don't** create assertions without linking them to source excerpts via `assertion_support`
- **Don't** delete entities that have downstream references (triggers will block, but don't force it)
- **Don't** bypass the 5-phase data entry workflow (see `docs/data-entry-sop.md`)
- **Don't** add event participants without an `assertion_id` (breaks traceability)
- **Don't** use `ILIKE` on name fields—use `WHERE lower(name) = lower(...)` for index hits

### ❌ Never

- **Never** store "facts" directly—always use assertions backed by source excerpts
- **Never** allow duplicate NARA RIF numbers (`source.external_ref` has partial unique index)
- **Never** create events without `event_type` (FK constraint will fail)
- **Never** skip de-duplication checks (Phase II of data entry SOP)

---

## Code Style and Conventions

### SQL Migrations

```sql
-- Use descriptive headers
-- =============================================================
-- 00N_feature_name.sql
-- Description of what this migration does
-- Prerequisite: migrations 001-00M must be applied
-- =============================================================

-- Organize by step
-- Step 1: Add new table
CREATE TABLE ...

-- Step 2: Add constraints
ALTER TABLE ...

-- Use consistent naming
-- Constraints: chk_tablename_description
-- Triggers: trg_tablename_action
-- Functions: action_tablename()
-- Indexes: idx_tablename_column

-- Always use IF EXISTS/IF NOT EXISTS for idempotency
DROP TRIGGER IF EXISTS trg_example ON table_name;
CREATE INDEX IF NOT EXISTS idx_example ON table_name(column);
```

### Documentation

- Use **bold** for table/column names in prose
- Use `code` for SQL keywords and values
- Use > blockquotes for important notes/warnings
- Keep sections numbered for easy reference
- Always update the table of contents when adding sections

---

## Migration Workflow Reference

```bash
# Local testing
psql -U postgres -d postgres -f supabase/migrations/00N_new_feature.sql

# Supabase deployment (via SQL Editor)
# 1. Open Supabase Dashboard → SQL Editor
# 2. Paste migration contents
# 3. Execute

# Supabase deployment (via CLI)
supabase db push

# Verify applied migrations
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

## Quick Reference: Entity Types

| Discriminator Value | Table | ID Column |
|---------------------|-------|-----------|
| `person` | `person` | `person_id` |
| `org` | `org` | `org_id` |
| `place` | `place` | `place_id` |
| `object` | `object` | `object_id` |
| `event` | `event` | `event_id` |
| `source` | `source` | `source_id` |

**Usage Note:** `source` is a valid discriminator for `entity_type` (identifiers), but is **not** currently a valid `subject_type` or `object_type` for assertions or `party_type` for event participants.

Use these values in the appropriate discriminator columns.

---

## Vocabulary Governance

All codes in `v_*` tables are version-controlled. To modify:

1. **Adding codes:** Create new migration, insert with `ON CONFLICT DO NOTHING`
2. **Deprecating codes:** Add `DEPRECATED_` prefix or notes field, never delete
3. **Changing labels:** Acceptable via UPDATE in new migration (doesn't break FK references)

See `docs/ontology-and-controlled-vocab.md` Section 11 for full policy.

---

## Contact and Context

This project uses:
- **PostgreSQL** via **Supabase** (cloud-hosted)
- **Next.js** for data entry UI (`web/` directory, currently out of scope)
- **Git** for version control

**Migration Status:** Migrations 001-004 complete and documented. Schema is production-ready.

**Current Focus:** Data population and web UI development (see `docs/project-notes.md` for options).

---

## Helpful Commands

```bash
# Find all triggers in the database
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname LIKE 'trg_%';

# Find all CHECK constraints
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'c';

# List all controlled vocabulary tables
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'v_%'
ORDER BY tablename;

# Count records in all v_ tables
SELECT 'v_event_type' AS table, COUNT(*) FROM v_event_type
UNION ALL
SELECT 'v_role_type', COUNT(*) FROM v_role_type
-- ... etc
ORDER BY table;
```

---

## Final Notes for AI Assistants

- **Always read the docs first** before suggesting changes
- **Check existing migrations** to understand the schema evolution
- **Validate against the SOP** when discussing data entry workflows
- **Respect the assertion model** — this is not a traditional normalized database
- **When in doubt, ask** — don't assume standard relational patterns apply

This is a **research-grade system** with academic integrity standards. Every design decision prioritizes traceability and evidentiary rigor over convenience.
