# supabase/

Supabase project configuration and database migrations for the Primary Sources research vault.

## Directory Structure

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Full DDL: all tables, indexes, and triggers
    ├── 002_seed_vocab.sql            # Seed data: all 12 controlled vocabulary tables
    └── 003_predicate_registry.sql    # v_predicate table + FK constraint on assertion.predicate
```

## Running the Migrations

### Option A — Supabase SQL Editor (quickest)

1. Open your project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Paste and run `001_initial_schema.sql`
4. Paste and run `002_seed_vocab.sql`

> **Important:** Run `001` before `002`. The seed file inserts into tables that `001` creates.

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

`v_event_type` · `v_role_type` · `v_place_role` · `v_object_role` · `v_relation_type` · `v_source_type` · `v_assertion_type` · `v_support_type` · `v_time_precision` · `v_org_type` · `v_place_type` · `v_object_type`

All seed inserts use `ON CONFLICT DO NOTHING` — safe to re-run on an existing database.

## Adding New Migrations

Name each new file sequentially: `003_...sql`, `004_...sql`, etc. Never modify a migration that has already been applied to a live database — add a new one instead.
