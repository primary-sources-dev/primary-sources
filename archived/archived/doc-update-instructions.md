# Documentation Update Instructions for 004_integrity_fixes.sql

## Overview

The migration file `supabase/migrations/004_integrity_fixes.sql` has been completed, but the documentation has not been updated. Three files require modifications to reflect the new database integrity features.

---

## Task 1: Update supabase/README.md

**File:** `supabase/README.md`

### Change 1.1: Update Directory Structure (Line 12)

**Current:**
```markdown
supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Full DDL: all tables, indexes, and triggers
    ├── 002_seed_vocab.sql            # Seed data: all 12 controlled vocabulary tables
    └── 003_predicate_registry.sql    # v_predicate table + FK constraint on assertion.predicate
```

**Replace with:**
```markdown
supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Full DDL: all tables, indexes, and triggers
    ├── 002_seed_vocab.sql            # Seed data: all 12 controlled vocabulary tables
    ├── 003_predicate_registry.sql    # v_predicate table + FK constraint on assertion.predicate
    └── 004_integrity_fixes.sql       # Integrity enforcement: polymorphic FKs, CHECK constraints, deletion protection
```

### Change 1.2: Update Running Instructions

**Location:** After line 23 ("Important: Run `001` before `002`...")

**Add:**
```markdown
5. Paste and run `003_predicate_registry.sql`
6. Paste and run `004_integrity_fixes.sql`

> **Important:** Run migrations in numerical order (001 → 002 → 003 → 004). Migration 004 must be applied **before** inserting any production data to ensure all integrity constraints are active.
```

### Change 1.3: Update Option C (psql instructions)

**Current (lines 41-44):**
```bash
psql -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
psql -U postgres -d postgres -f supabase/migrations/002_seed_vocab.sql
```

**Replace with:**
```bash
psql -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
psql -U postgres -d postgres -f supabase/migrations/002_seed_vocab.sql
psql -U postgres -d postgres -f supabase/migrations/003_predicate_registry.sql
psql -U postgres -d postgres -f supabase/migrations/004_integrity_fixes.sql
```

---

## Task 2: Update docs/architecture-and-schema.md

**File:** `docs/architecture-and-schema.md`

### Change 2.1: Expand Section 5.2 — Referential Triggers

**Location:** Section 5.2 currently ends at line 52

**Current content:**
```markdown
### 5.2 Referential Triggers

Since the database uses polymorphic references (where one ID might point to a Person or an Org), custom PostgreSQL triggers are utilized:

* **`check_event_participant_party_fk`**: Enforces that the `party_id` in `event_participant` exists in the correct entity table based on the `party_type` (`person` or `org`).
* **`check_assertion_subject_fk`**: Enforces that the `subject_id` in `assertion` exists in the correct entity table based on `subject_type` (one of `person`, `org`, `place`, `object`, or `event`). Without this trigger, an assertion could reference a non-existent entity UUID, breaking the traceability chain.
```

**Replace with:**
```markdown
### 5.2 Referential Triggers

Since the database uses polymorphic references (where one ID might point to a Person or an Org), custom PostgreSQL triggers are utilized:

#### Polymorphic Foreign Key Enforcement

* **`check_event_participant_party_fk`**: Enforces that the `party_id` in `event_participant` exists in the correct entity table based on the `party_type` (`person` or `org`).
* **`check_assertion_subject_fk`**: Enforces that the `subject_id` in `assertion` exists in the correct entity table based on `subject_type` (one of `person`, `org`, `place`, `object`, or `event`).
* **`check_assertion_object_fk`**: Enforces that the `object_id` in `assertion` exists in the correct entity table based on `object_type` (one of `person`, `org`, `place`, `object`, or `event`). Without this trigger, an assertion could reference a non-existent entity UUID, breaking the traceability chain.
* **`check_entity_identifier_fk`**: Enforces that the `entity_id` in `entity_identifier` exists in the correct entity table based on `entity_type` (one of `person`, `org`, `place`, `object`, `event`, or `source`).

#### Automatic Timestamp Management

* **`set_updated_at()`**: Shared function that automatically updates the `updated_at` column on row modifications. Applied to: `person`, `org`, `place`, `object`, `event`, `source`.

#### Time Precision Contract Enforcement

* **`check_event_time_precision()`**: Enforces the semantic contract between `time_precision` and timestamp fields:
  - `UNKNOWN` → both `start_ts` and `end_ts` must be NULL
  - `APPROX` → `start_ts` must be NOT NULL, `end_ts` must be NULL (use RANGE for bounded spans)
  - `EXACT` → `start_ts` must be NOT NULL, `end_ts` must be NULL or equal to `start_ts`
  - `RANGE` → both `start_ts` and `end_ts` must be NOT NULL

#### Entity Deletion Protection

To maintain referential integrity across polymorphic relationships, deletion triggers prevent orphaned references:

* **`prevent_person_deletion()`**: Blocks deletion if referenced in `person_alias`, `event_participant`, `assertion`, or `entity_identifier`
* **`prevent_org_deletion()`**: Blocks deletion if referenced in `event_participant`, `assertion`, or `entity_identifier`
* **`prevent_place_deletion()`**: Blocks deletion if referenced in `event_place`, `place.parent_place_id` (hierarchical), `assertion`, or `entity_identifier`
* **`prevent_object_deletion()`**: Blocks deletion if referenced in `event_object`, `assertion`, or `entity_identifier`
* **`prevent_event_deletion()`**: Blocks deletion if referenced in `event_relation` (both directions), `assertion.context_event_id`, `assertion` (as subject/object), or `entity_identifier`
* **`prevent_source_deletion()`**: Blocks deletion if any `source_excerpt` is linked to `assertion_support` (protects evidentiary chain) or if referenced in `entity_identifier`
```

### Change 2.2: Add New Section 5.3 — CHECK Constraints

**Location:** After the expanded Section 5.2

**Add new section:**
```markdown
### 5.3 CHECK Constraints

The following CHECK constraints enforce data integrity and business logic:

#### Assertion Constraints

* **`chk_assertion_object_type`**: Restricts `object_type` to valid entity types: `person`, `org`, `place`, `object`, `event`
* **`chk_assertion_object_value`**: Enforces mutual exclusivity — if `object_type` is set, exactly one of `object_id` (entity reference) or `object_value` (literal text) must be populated, but not both

#### Date Range Constraints

* **`chk_event_ts_order`**: Ensures `end_ts` is NULL or >= `start_ts`
* **`chk_person_date_order`**: Ensures `death_date` is NULL or >= `birth_date`
* **`chk_person_alias_date_order`**: Ensures `to_date` is NULL or >= `from_date`
* **`chk_org_date_order`**: Ensures `end_date` is NULL or >= `start_date`

All date constraints allow NULL values on either boundary to accommodate incomplete data.
```

### Change 2.3: Update Section 6 — Schema Indexing

**Location:** Section 6 (around line 54)

**Current content includes index list. Add these entries:**

After the existing index list, add:
```markdown
* **Name field indexes** (functional `lower()` indexes) on `person.display_name`, `org.name`, `place.name`, `object.name` for case-insensitive de-duplication queries
* `source.title` and `source.external_ref` (B-Tree) for prefix search support
* **Partial unique index** on `source.external_ref` (WHERE NOT NULL) to enforce NARA RIF uniqueness while allowing multiple NULL values
```

Also add a note after the index list:
```markdown
> **De-duplication Query Pattern:** Name indexes use functional `lower()` syntax. Queries must use:
> `WHERE lower(display_name) = lower('search term')` to utilize the index.
```

---

## Task 3: Update docs/data-entry-sop.md

**File:** `docs/data-entry-sop.md`

### Change 3.1: Add Validation Note to Phase II

**Location:** After line 26 (end of step 4 in Phase II)

**Add:**
```markdown

> **Integrity Protection (Migration 004):** The database automatically validates all `entity_identifier` entries. If you attempt to link an identifier to a non-existent `entity_id`, the insert will be rejected with a descriptive error. This prevents orphaned references and ensures all identifiers trace to valid entities.
```

---

## Verification Checklist

After completing all changes, verify:

- [ ] `supabase/README.md` lists all four migration files in order
- [ ] Running instructions include steps for 003 and 004
- [ ] `docs/architecture-and-schema.md` Section 5.2 lists all 10+ triggers
- [ ] `docs/architecture-and-schema.md` has new Section 5.3 for CHECK constraints
- [ ] `docs/architecture-and-schema.md` Section 6 mentions functional indexes and de-duplication pattern
- [ ] `docs/data-entry-sop.md` Phase II has integrity protection note
- [ ] All changes maintain markdown formatting and existing section numbering

---

## Notes

* **Step 2 Deviation:** The migration implements mutual exclusivity for `object_id` / `object_value` (stricter than the original plan). This is documented in Section 5.3 as implemented.
* **Section Numbering:** When adding Section 5.3, ensure all subsequent section numbers in `architecture-and-schema.md` are incremented (current Section 6 becomes Section 7, etc.)
