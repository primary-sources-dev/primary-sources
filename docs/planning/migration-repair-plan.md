# Migration Repair Plan (Pre-Bootstrap)

## Scope
This plan repairs the migration chain before first database bootstrap, while no data has been migrated/seeded.

## 1. Freeze Migration Contract
- Keep numbering stable (`001..016`).
- Patch broken files in place now (safe pre-bootstrap).
- Record that this is a pre-bootstrap cleanup pass.

## 2. Repair SQL Syntax Blockers (`007`, `008`, `010`, `011`)
- Replace `ADD CONSTRAINT IF NOT EXISTS` with guarded `DO $$ ... IF NOT EXISTS (...) THEN ALTER TABLE ... ADD CONSTRAINT ... END IF; END $$;`
- Remove invalid CHECKs using subqueries (`IN (SELECT ...)`).
- Use FK references to vocabulary tables as the allowed-value contract.
- Preserve existing column/index intent.

## 3. Rewrite Witness Migration Logic (`012`, `013`)
- Remove invalid `local` declarations.
- Fix bad column references (`event_id` instead of `id`).
- Remove dependency on non-existent `participants` column.
- Convert to schema-safe utility definitions only.
- Do not auto-run data migration in bootstrap chain.
- If needed later, move execution to explicit post-seed script.

## 4. Fix Person Name Migration (`014`)
- Target `person` table (not `people`).
- Remove dependency on missing `v_name_type` unless created in same migration.
- Remove hardcoded row updates from schema migration.
- Keep structural DDL only (e.g., `middle_name`) plus comments.

## 5. Resolve `003` Redundancy
- Guard FK addition so it only runs if the FK does not already exist.
- Keep predicate seed inserts idempotent (`ON CONFLICT DO NOTHING`).

## 6. Validate Full Chain on Clean DB
- Apply full chain from `001` through `016`.
- Confirm zero SQL errors and expected object creation.
- Smoke-test critical integrity behaviors:
  - time precision enforcement
  - source excerpt deletion protection
  - `assertion_id` `ON DELETE SET NULL` behavior

## 7. Update Documentation
- Update `docs/architecture-and-schema.md` to match repaired migrations.
- Update `archived/working-notes.md` to mark cleanup complete.
- Add a concise migration changelog note: “pre-bootstrap repair pass.”
