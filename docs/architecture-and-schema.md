# Architecture and Schema Specification

This document defines the technical architecture of the research vault. The system is implemented as a **PostgreSQL** database (Supabase) utilizing **Fourth Normal Form (4NF)** principles to ensure data integrity and support complex historical link analysis.

## 1. Design Philosophy

* **Event-Centricity:** All historical data points are anchored to discrete events in time and space.
* **Assertion-Based Modeling:** The database stores claims about facts rather than static "truths," allowing for the preservation of conflicting accounts.
* **Strict Normalization (4NF):** Multi-valued attributes (aliases, identifiers, participants) are isolated into dedicated tables to prevent data redundancy and combinatorial explosions.

## 2. Entity Modeling

Entities are the primary subjects of research. To ensure classification accuracy, Organizations, Places, and Objects are linked to controlled type tables.

* **`person`**: Individual human actors.
* **`org`**: Groups and agencies, classified by `v_org_type`.
* **`place`**: Geographic locations, classified by `v_place_type`. Supports hierarchical containment (e.g., a room inside a building) via `parent_place_id`.
* **`object`**: Physical artifacts and evidence items, classified by `v_object_type` (e.g., `WEAPON`, `DOCUMENT`, `VEHICLE`).

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

* **`check_event_participant_party_fk`**: Enforces that the `party_id` in `event_participant` exists in the correct entity table based on the `party_type` (`person` or `org`).
* **`check_assertion_subject_fk`**: Enforces that the `subject_id` in `assertion` exists in the correct entity table based on `subject_type` (one of `person`, `org`, `place`, `object`, or `event`). Without this trigger, an assertion could reference a non-existent entity UUID, breaking the traceability chain.

## 6. Schema Indexing

To support timeline generation and research tools, indexes are applied to:

* All `v_` reference codes (B-Tree).
* `event.start_ts` (B-Tree) for chronological sorting.
* `party_id` and `subject_id` (B-Tree/GIN) for rapid link-analysis queries.
* `assertion.predicate` (B-Tree) for claim-type queries.
* `source_excerpt.source_id` (B-Tree) for excerpt lookups.
