# 004 Integrity Fixes — Implementation Plan (Rev 2)

Single migration file: `supabase/migrations/004_integrity_fixes.sql`

## IMPORTANT

Apply before any production data is inserted. All fixes are additive.

## Steps

### Step 1 — CHECK: assertion.object_type allowed values

Add `check (object_type in ('person','org','place','object','event'))` via `ALTER TABLE`.

### Step 2 — CHECK: assertion object value semantics

`check ((object_id is not null) or (object_value is not null) or (object_type is null))` → if `object_type` is set, at least one value field must be populated.

### Step 3 — Trigger: assertion.object_id polymorphic FK

Mirror of existing `check_assertion_subject_fk`. New function `check_assertion_object_fk()` — only fires when `object_id` IS NOT NULL, validates UUID exists in the table named by `object_type`. Bind `BEFORE INSERT OR UPDATE` on `assertion`.

### Step 4 — Trigger: entity_identifier.entity_id polymorphic FK

New function `check_entity_identifier_fk()` — validates UUID against six entity tables (`person`, `org`, `place`, `object`, `event`, `source`). Bind `BEFORE INSERT OR UPDATE` on `entity_identifier`.

### Step 5 — Trigger: updated_at auto-update

One shared function `set_updated_at()` returns `NEW` with `updated_at = now()`. Apply one `BEFORE UPDATE` trigger on each of: `person`, `org`, `place`, `object`, `event`, `source`.

### Step 6 — Indexes: name fields and external_ref

**Strategy:**

* Name columns (`display_name`, `name`) → functional index on `lower(column)` for case-insensitive exact-match de-duplication. Queries must use `WHERE lower(display_name) = lower(...)`.
* `source.title`, `source.external_ref` → standard B-tree to support `ILIKE 'prefix%'` prefix searches.

| Index | Table | Expression |
|---|---|---|
| `idx_person_display_name` | `person` | `lower(display_name)` |
| `idx_org_name` | `org` | `lower(name)` |
| `idx_place_name` | `place` | `lower(name)` |
| `idx_object_name` | `object` | `lower(name)` |
| `idx_source_title` | `source` | `title` |
| `idx_source_external_ref` | `source` | `external_ref` |

### Step 7 — CHECK: date range constraints

| Table | Constraint |
|---|---|
| `event` | `end_ts IS NULL OR end_ts >= start_ts` |
| `person` | `death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date` |
| `person_alias` | `to_date IS NULL OR from_date IS NULL OR to_date >= from_date` |
| `org` | `end_date IS NULL OR start_date IS NULL OR end_date >= start_date` |

### Step 8 — UNIQUE: source.external_ref

Partial unique index (NULLs allowed, values must be unique):

```sql
CREATE UNIQUE INDEX uq_source_external_ref ON source(external_ref) WHERE external_ref IS NOT NULL;
```

### Step 9 — Trigger: time precision enforcement

Four precision codes, all from `v_time_precision`:

| Code | start_ts | end_ts | Notes |
|---|---|---|---|
| `UNKNOWN` | must be NULL | must be NULL | No timestamp data |
| `APPROX` | must be NOT NULL | must be NULL | One soft anchor — two endpoints = use RANGE |
| `EXACT` | must be NOT NULL | NULL or equal to start_ts | Point-in-time or exactly-bounded duration |
| `RANGE` | must be NOT NULL | must be NOT NULL | Bounded span |

New function `check_event_time_precision()` raises exception on violation. Bind `BEFORE INSERT OR UPDATE` on `event`.

### Step 10 — Entity deletion protection (entity-specific triggers)

One `BEFORE DELETE` trigger per entity type. Each checks only the tables relevant to that entity.

#### 10a — person

Blocks if referenced in: `person_alias`, `event_participant` (`party_type='person'`), `assertion` (subject/object where type='person'), `entity_identifier` (`entity_type='person'`)

#### 10b — org

Blocks if referenced in: `event_participant` (`party_type='org'`), `assertion` (subject/object where type='org'), `entity_identifier` (`entity_type='org'`)

#### 10c — place

Blocks if referenced in: `event_place`, `place.parent_place_id` (hierarchical — blocks parent deletion if children exist), `assertion` (subject/object where type='place'), `entity_identifier` (`entity_type='place'`)

#### 10d — object

Blocks if referenced in: `event_object`, `assertion` (subject/object where type='object'), `entity_identifier` (`entity_type='object'`)

#### 10e — event

Blocks if referenced in: `event_relation` (`event_id_from` OR `event_id_to`), `assertion.context_event_id`, `assertion` (subject/object where type='event'), `entity_identifier` (`entity_type='event'`)

#### 10f — source

Block if any `source_excerpt` for this source has an `assertion_support` entry. Deleting a sourced assertion's evidentiary basis is not permitted. Deletion is only allowed once all supporting excerpts have been unlinked. Also blocks if referenced in `entity_identifier` (`entity_type='source'`).

## Execution Order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10a → 10b → 10c → 10d → 10e → 10f

## Files Affected

| File | Action |
|---|---|
| `supabase/migrations/004_integrity_fixes.sql` | [NEW] |
| `supabase/README.md` | Add 004 to migration list |
| `docs/architecture-and-schema.md` | Document new constraints; update §5.2 Referential Triggers to list all triggers including new ones |
| `docs/data-entry-sop.md` | Phase II note: new entity_identifier trigger prevents orphaned identifiers |

## Verification

| # | Test | Expected |
|---|---|---|
| 1 | `assertion` insert with fake `object_id` | Exception |
| 2 | `entity_identifier` insert with bad `entity_id` | Exception |
| 3 | `source` insert with duplicate `external_ref` | Unique violation |
| 4 | `event` with `end_ts < start_ts` | Exception |
| 5 | Update `person` row | `updated_at` advances |
| 6 | `EXPLAIN` on `lower(display_name)` query | Index scan |
| 7 | Delete `person` referenced in `person_alias` | Exception |
| 8 | Delete parent `place` with child places | Exception |
| 9 | `event` with `time_precision='APPROX'` and `start_ts=NULL` | Exception |
| 10 | Valid inserts for all four precision codes | All succeed |
