# Schema Mismatches & Integrity Gaps

This document tracks known inconsistencies between the database schema (migrations 001-004), the UI JSON files, and potential data integrity issues.

---

## Part 1: UI JSON vs Database Schema

The JSON files in `docs/ui/assets/data/` contain fields that do not exist in the PostgreSQL schema.

### people.json

| JSON Field | Status | Notes |
|------------|--------|-------|
| `person_type` | **NOT IN SCHEMA** | Value `"PERSON"` has no meaning — no `v_person_type` table exists |
| `organization` | **NOT IN SCHEMA** | Org relationships should use `event_participant` junction table |
| `tags` | **NOT IN SCHEMA** | UI-only presentation field |
| `icon` | **NOT IN SCHEMA** | UI-only |
| `label` | **NOT IN SCHEMA** | UI-only |
| `id` (slug) | **NOT IN SCHEMA** | Database uses only `person_id` (uuid) |
| `middle_name` | **MISSING** | Schema has this field but JSON doesn't populate it |

### places.json

| JSON Field | Status | Notes |
|------------|--------|-------|
| `tags` | **NOT IN SCHEMA** | Some places have tags arrays |
| `icon` | **NOT IN SCHEMA** | UI-only |
| `label` | **NOT IN SCHEMA** | UI-only |
| `id` (slug) | **NOT IN SCHEMA** | Database uses only `place_id` (uuid) |

### orgs.json

| JSON Field | Status | Notes |
|------------|--------|-------|
| `tags` | **NOT IN SCHEMA** | Some orgs have tags arrays |
| `icon` | **NOT IN SCHEMA** | UI-only |
| `label` | **NOT IN SCHEMA** | UI-only |
| `id` (slug) | **NOT IN SCHEMA** | Database uses only `org_id` (uuid) |

### objects.json

| JSON Field | Status | Notes |
|------------|--------|-------|
| `tags` | **NOT IN SCHEMA** | All objects have tags arrays |
| `icon` | **NOT IN SCHEMA** | UI-only |
| `label` | **NOT IN SCHEMA** | UI-only |
| `id` (slug) | **NOT IN SCHEMA** | Database uses only `object_id` (uuid) |

### events.json

| JSON Field | Status | Notes |
|------------|--------|-------|
| `parent_event_id` | **NOT IN SCHEMA** | Event hierarchy should use `event_relation` junction table with `PART_OF` |
| `featured` | **NOT IN SCHEMA** | UI presentation flag |
| `is_conflict` | **NOT IN SCHEMA** | UI presentation flag |
| `url` | **NOT IN SCHEMA** | Document links should go through `source` → `assertion` → `event` |
| `icon` | **NOT IN SCHEMA** | UI-only |
| `label` | **NOT IN SCHEMA** | UI-only |
| `id` (slug) | **NOT IN SCHEMA** | Database uses only `event_id` (uuid) |

---

## Part 2: Acceptable UI-Only Fields

These fields are intentionally UI-specific and do not need schema representation:

- `id` (slug) — URL-friendly identifier for routing
- `icon` — Material Symbol name for display
- `label` — Human-readable subtitle for cards

---

## Part 3: Migration Integrity Issues

### Critical

| Migration | Issue | Description |
|-----------|-------|-------------|
| 001 | **source_excerpt cascade** | Deleting `source_excerpt` cascades to `assertion_support`, silently breaking the evidentiary chain |

### Medium

| Migration | Issue | Description |
|-----------|-------|-------------|
| 001 | **Assertion FK errors** | `event_participant.assertion_id`, `event_place.assertion_id`, etc. lack `ON DELETE SET NULL` — deleting a referenced assertion causes FK violation |
| 004 | **time_precision NULL bypass** | Trigger returns early if `time_precision IS NULL` — allows events with timestamps but no precision code |
| 004 | **No assertion deletion trigger** | `assertion` table lacks explicit deletion protection (relies on FK errors) |

### Low

| Migration | Issue | Description |
|-----------|-------|-------------|
| 001 | **event.title nullable** | Events without titles are hard to identify in UIs |
| 001 | **Junction cascade silent** | `event_participant`, `event_place`, `event_object` cascade delete silently when parent event deleted |
| 001 | **Redundant SET NULL** | `assertion.context_event_id ON DELETE SET NULL` never reached because `prevent_event_deletion` blocks first |
| 001/004 | **Index split** | Some indexes in 001, some in 004 — cosmetic inconsistency |

---

## Part 4: Resolution Status

| Issue | Resolution | Status |
|-------|------------|--------|
| `person_type` field | Remove from JSON or ignore | Pending |
| `organization` field | Remove from JSON; use junction table | Pending |
| `tags` field | Was supposed to be removed; still present | Pending |
| `parent_event_id` | Migrate to `event_relation` with `PART_OF` | Pending |
| `featured`, `is_conflict`, `url` | Decide: add to schema or keep UI-only | Pending |
| source_excerpt cascade | Add deletion protection trigger in 005 | Pending |
| time_precision NULL | Require NOT NULL or enforce timestamp logic | Pending |

---

## Part 5: Recommended Migration 005

To address critical issues, a new migration should:

1. Add `prevent_source_excerpt_deletion()` trigger
2. Add `ON DELETE SET NULL` to junction table `assertion_id` columns
3. Consider `NOT NULL` constraint on `event.time_precision`
4. Consider `NOT NULL` constraint on `event.title`

---

*Last updated: 2026-02-23*
