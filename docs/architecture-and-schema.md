# Architecture and Schema Specification

This document defines the technical architecture of the research vault. The system is implemented as a **PostgreSQL** database (Supabase) utilizing **Fourth Normal Form (4NF)** principles to ensure data integrity and support complex historical link analysis.

## 1. Design Philosophy

* **Event-Centricity:** All historical data points are anchored to discrete events in time and space.
* **Assertion-Based Modeling:** The database stores claims about facts rather than static "truths," allowing for the preservation of conflicting accounts.
* **Strict Normalization (4NF):** Multi-valued attributes (aliases, identifiers, participants) are isolated into dedicated tables to prevent data redundancy and combinatorial explosions.

## 2. Entity Modeling

Entities are the primary subjects of research. To ensure classification accuracy, Organizations, Places, and Objects are linked to controlled type tables.

* **`person`**: Individual human actors.
* **`org`**: Groups and agencies, classified by `v_org_type` (e.g., `AGENCY`, `MEDIA`, `ARCHIVE` for primary source repositories).
* **`place`**: Geographic locations, classified by `v_place_type`. Supports hierarchical containment (e.g., a room inside a building) via `parent_place_id`.
* **`object`**: Physical artifacts and evidence items, classified by `v_object_type` (e.g., `WEAPON`, `DOCUMENT`, `VEHICLE`).

### 2.1 Archive Modeling and Source Custodianship

Primary sources are cataloged from multiple archival repositories (NARA, Mary Ferrell Foundation, Presidential Libraries, etc.). Archives are modeled as `org` entities with `org_type = 'ARCHIVE'`. Sources are linked to their archival custodian via `entity_identifier` table:

* **Archive Organization**: `org` with `org_type = 'ARCHIVE'`
  - `name`: Archive name (e.g., "National Archives and Records Administration (NARA)")
  - `notes`: Holdings description, URL, and access information
  - `start_date`: Archive establishment date

* **Source-to-Archive Link**: `entity_identifier` with `id_type = 'ARCHIVE_CUSTODIAN'`
  - Enables traceability: which archive holds which source
  - Avoids modifying `source` table structure
  - Leverages existing integrity triggers

* **Place Types for Sites**: `v_place_type` includes `'SITE'` for assassination-related locations
  - `SITE`: Specific areas or geographic zones (e.g., Dealey Plaza assassination site)
  - Distinguishes from `BUILDING` (structures) and `REGION` (administrative zones)

## 3. The Event Model (The Golden Thread)

Events serve as the relational hub for the entire system.

* **`event`**: Defines a point in time. Chronological precision is managed via the `v_time_precision` reference table.
* **`event_participant`**: Connects Persons/Orgs to Events.
* **`event_place`**: Connects Places to Events.
* **`event_object`**: Connects Objects to Events.
* **`event_relation`**: Models the edges between events (e.g., sequences or causality).

## 4. Assertion and Evidence Layer

This layer decouples the "Fact" from the "Source."

* **`source`**: The primary document, media file, or artifact.
* **`source_excerpt`**: A specific, cite-able locator within a source (page, timestamp, or paragraph).
* **`assertion`**: An atomic claim model using a Subject-Predicate-Object structure.
* **`assertion_support`**: The critical link between an Assertion and an Excerpt. Tracks whether evidence `Supports`, `Contradicts`, or `Mentions` the claim.

## 5. Relational Integrity and 4NF Enforcement

To maintain 4NF standards, the following mechanisms are implemented:

### 5.1 Assertion-Linked Junctions

Every entry in a junction table (`event_participant`, `event_place`, `event_object`, `event_relation`) or a split table (`person_alias`, `entity_identifier`) includes an optional `assertion_id`. This ensures that every relationship in the database can be traced back to a specific evidentiary claim.

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

#### Name Integrity

* **`chk_[table]_name_len`**: Ensures name fields are not empty or just whitespace.
  - `chk_person_display_name_len`
  - `chk_org_name_len`
  - `chk_place_name_len`
  - `chk_object_name_len`
  - `chk_source_title_len`
  - `chk_person_alias_len`

All name and date constraints allow NULL values where the column itself is nullable, but prevent low-quality strings ("") once data is present.

## 6. Schema Indexing

To support timeline generation and research tools, indexes are applied to:

* All `v_` reference codes (B-Tree).
* `event.start_ts` (B-Tree) for chronological sorting.
* `party_id` and `subject_id` (B-Tree/GIN) for rapid link-analysis queries.
* `assertion.predicate` (B-Tree) for claim-type queries.
* `source_excerpt.source_id` (B-Tree) for excerpt lookups.
* **Name field indexes** (functional `lower()` indexes) on `person.display_name`, `org.name`, `place.name`, `object.name` for case-insensitive de-duplication queries
* `source.title` and `source.external_ref` (B-Tree) for prefix search support
* **Partial unique index** on `source.external_ref` (WHERE NOT NULL) to enforce NARA RIF uniqueness while allowing multiple NULL values
* **Archive search index (Planned):** Composite index on `entity_identifier(entity_type, id_type, id_value)` WHERE `entity_type='source'` AND `id_type='ARCHIVE_CUSTODIAN'` for fast archive custodian lookups

> **De-duplication Query Pattern:** Name indexes use functional `lower()` syntax. Queries must use:
> `WHERE lower(display_name) = lower('search term')` to utilize the index.

> **Archive Search Query Pattern:** To find all sources held by a specific archive:
> `SELECT s.* FROM source s JOIN entity_identifier ei ON s.source_id = ei.entity_id WHERE ei.entity_type='source' AND ei.id_type='ARCHIVE_CUSTODIAN' AND ei.id_value='NARA'`

## 7. Table Inventory

All 28 tables in the schema, grouped by architectural layer.

**Controlled Vocabularies (15)**
`v_event_type` · `v_role_type` · `v_place_role` · `v_object_role` · `v_relation_type` · `v_source_type` · `v_assertion_type` · `v_support_type` · `v_time_precision` · `v_org_type` · `v_place_type` · `v_object_type` · `v_predicate` · `v_person_relation_type` · `v_assertion_support_type`

**Core Entities (4)**
`person` · `org` · `place` · `object`

**Event Model (5)**
`event` · `event_participant` · `event_place` · `event_object` · `event_relation`

**Evidence Layer (4)**
`source` · `source_excerpt` · `assertion` · `assertion_support`

**Attribute and Relationship Tables (3)**
`person_alias` · `entity_identifier` · `person_relation`

> For column-level detail and DDL, see [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql).

## 8. Event Boundary Doctrine

Events must be modeled consistently so the graph remains machine-readable across sessions. Apply these rules in order.

### 8.1 When to Create a New Event

Create a **separate event** when **any** of the following are true:

* The timestamp or location changes (even slightly — a new room, a new minute)
* The set of participants changes (someone enters or exits the scene)
* A different `v_event_type` code applies
* The evidence for this moment comes from a separate source excerpt

If none of the above apply, it is likely part of the same event.

### 8.2 When to Use `PART_OF` (Nesting)

Use the `PART_OF` relation in `event_relation` when:

* A sub-event is a discrete procedural step within a larger event (e.g., `AUTOPSY_STEP` inside an `AUTOPSY`)
* The sub-event is only meaningful in the context of its parent
* You want to preserve granularity without cluttering the top-level timeline

Do **not** use `PART_OF` when the sub-event is independently significant or has independent sourcing.

### 8.3 When to Split an Existing Event

Split a single event into two when:

* New evidence places two distinct moments at that event slot
* The participants differ between the two moments
* Separate `source_excerpt` records exist that cannot be reconciled to one timestamp

### 8.4 Minimum Required Fields

An event is not complete until it has:

* `event_type` (required FK)
* At least one `event_participant` or `event_object` record
* At least one `assertion` supported by a `source_excerpt`
* `start_ts` or `time_precision = 'UNKNOWN'` (must be explicit, not null by omission)

