# supabase/

Supabase project configuration and database migrations for the Primary Sources research vault.

## Directory Structure

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Full DDL: all tables, indexes, and triggers
    ├── 002_seed_vocab.sql            # Seed data: all 18 controlled vocabulary tables
    ├── 003_predicate_registry.sql    # v_predicate table + FK constraint on assertion.predicate
    ├── 004_integrity_fixes.sql       # Integrity enforcement: polymorphic FKs, CHECK constraints, deletion protection
    ├── 005_age_at_event.sql          # Age-at-Event Badge: age_at_event() function + view
    ├── 006_fix_view_column.sql       # Fix: view column name (role → role_type)
    ├── 007_event_level.sql           # v_event_level vocab table + event.event_level column
    ├── 008_event_hierarchy.sql       # v_event_hierarchy vocab table
    ├── 009_witness_hierarchy.sql     # v_witness_hierarchy vocab table
    ├── 010_witnesses_array.sql       # Witnesses array support
    ├── 011_witness_validation.sql    # Witness validation triggers
    ├── 012_witness_data_migration.sql # Witness data migration from legacy format
    ├── 013_witness_types.sql         # Additional witness type codes
    ├── 014_person_names_schema.sql   # Person name schema enhancements
    └── 015_classifier_vocab.sql      # Classifier UI vocab alignment (v_source_type + v_doc_format expansion)
```

## Running the Migrations

### Option A — Supabase SQL Editor (quickest)

1. Open your project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Paste and run `001_initial_schema.sql`
4. Paste and run `002_seed_vocab.sql`
5. Paste and run `003_predicate_registry.sql`
6. Paste and run `004_integrity_fixes.sql`
7. Paste and run `005_age_at_event.sql`
8. Paste and run `006_fix_view_column.sql`
9. Paste and run `007_event_level.sql`
10. Paste and run `008_event_hierarchy.sql`
11. Paste and run `009_witness_hierarchy.sql`
12. Paste and run `010_witnesses_array.sql`
13. Paste and run `011_witness_validation.sql`
14. Paste and run `012_witness_data_migration.sql`
15. Paste and run `013_witness_types.sql`
16. Paste and run `014_person_names_schema.sql`
17. Paste and run `015_classifier_vocab.sql`

> **Important:** Run migrations in numerical order (001 → 015). Migration 004 must be applied **before** inserting any production data to ensure all integrity constraints are active.

### Option B — Supabase CLI

```bash
# Install the CLI if you haven't already
npm install -g supabase

# Link to your remote project
supabase link --project-ref <your-project-ref>

# Push all migrations in order
supabase db push
```

### Option C — psql (local Postgres)

```bash
psql -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
psql -U postgres -d postgres -f supabase/migrations/002_seed_vocab.sql
psql -U postgres -d postgres -f supabase/migrations/003_predicate_registry.sql
psql -U postgres -d postgres -f supabase/migrations/004_integrity_fixes.sql
psql -U postgres -d postgres -f supabase/migrations/005_age_at_event.sql
psql -U postgres -d postgres -f supabase/migrations/006_fix_view_column.sql
psql -U postgres -d postgres -f supabase/migrations/007_event_level.sql
psql -U postgres -d postgres -f supabase/migrations/008_event_hierarchy.sql
psql -U postgres -d postgres -f supabase/migrations/009_witness_hierarchy.sql
psql -U postgres -d postgres -f supabase/migrations/010_witnesses_array.sql
psql -U postgres -d postgres -f supabase/migrations/011_witness_validation.sql
psql -U postgres -d postgres -f supabase/migrations/012_witness_data_migration.sql
psql -U postgres -d postgres -f supabase/migrations/013_witness_types.sql
psql -U postgres -d postgres -f supabase/migrations/014_person_names_schema.sql
psql -U postgres -d postgres -f supabase/migrations/015_classifier_vocab.sql
```

## Schema Overview

The schema is organized into four layers:

| Layer | Tables |
|---|---|
| **Controlled Vocab** | 12 `v_` tables — all type/role codes |
| **Core Entities** | `person`, `org`, `place`, `object` |
| **Event Model** | `event`, `event_participant`, `event_place`, `event_object`, `event_relation` |
| **Evidence Layer** | `source`, `source_excerpt`, `assertion`, `assertion_support` |
| **Attribute Tables** | `person_alias`, `entity_identifier` |

See [`docs/architecture-and-schema.md`](../docs/architecture-and-schema.md) for the full design spec.

## Vocab Tables Seeded

`v_event_type` · `v_role_type` · `v_place_role` · `v_object_role` · `v_relation_type` · `v_source_type` · `v_assertion_type` · `v_support_type` · `v_time_precision` · `v_org_type` · `v_place_type` · `v_object_type` · `v_predicate` · `v_person_relation_type` · `v_id_type`

All seed inserts use `ON CONFLICT DO NOTHING` — safe to re-run on an existing database.

## Data Modeling Rules

### Event Relationships
To maintain 4NF standards, the `event` table does not contain a `parent_id` or `sequence_id`. All relationships between events must be modeled in the **`event_relation`** table.

* **Frontend Abstraction:** The UI mockups (e.g., `events.json`) use a simplified `parent_event_id` field for rendering nested views.
* **Database Mapping:** During data import from JSON to SQL, the `parent_event_id` MUST be converted into a row in the `event_relation` table with `relation_type = 'PART_OF'`.

## Adding New Migrations

Name each new file sequentially: `016_...sql`, `017_...sql`, etc. Never modify a migration that has already been applied to a live database — add a new one instead.

## Utility Functions

| Function | Description |
|----------|-------------|
| `age_at_event(person_id, event_id)` | Returns person's age (years) at event time |
| `age_at_date(person_id, date)` | Returns person's age (years) at any date |

## Views

| View | Description |
|------|-------------|
| `v_event_participant_with_age` | Event participants with pre-calculated age badges |
