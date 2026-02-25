# Fixing Relationships: Entity & Event Alignment Plan

This document outlines the refined strategy for handling complex forensic relationships, using the **Ralph Leon Yates Incident** as the primary architectural baseline for SQL migration.

---

## 1. Granular Role Expansion (`v_role_type`)
**Strategy**: Split generic roles (like `INVESTIGATOR`) into precise forensic variants to preserve the chain of custody and reporting hierarchy.
- `REPORTING_AGENT`: The author of the official document (e.g., FBI 302).
- `INTERVIEWER`: The agents physically present in the room during questioning.
- `EXAMINER`: Specialists conducting technical evaluations (e.g., Polygraph).
- `AFFIANT`: Individuals providing sworn, signed statements (like Yates).

**Comments**:
*yes please*

---

## 2. Explicit Assertion Attribution
**Strategy**: Every claim in the `assertion` table will point to the specific person who made it as the `subject_id`, rather than just being a generic "fact" of the event.
- Use `predicate` values to distinguish claim types: `stated_observation`, `identified_photo`, `provided_alibi`.
- Allows for the query: "Show all assertions made BY Ralph Yates."

**Comments**:
*yes please*

---

## 3. Witness Support Matrix (`assertion_support`)
**Strategy**: Use the `assertion_support` junction table to map how secondary witnesses interact with primary claims.
- **Dempsey Jones**: Linked to Yates' primary claim with the label `SUPPORTS`.
- Power the UI to show corroboration counts directly on the entity profile.

**Comments**:
*same witnesses may contradict other asserations, keep this in mind same*

---

## 4. Alibi & Conflict Flagging
**Strategy**: Model alibi checks as discrete events that generate contradictory assertions.
- **Charlie's Meat Market**: The alibi check of co-workers (Ayres/Mask) generates a `TIME` assertion.
- This assertion is linked to Yates' claim with labels `CONTRADICTS`.
- Powers the "Conflict Heatmap" in the research dashboard.

**Comments**:
*yes please, this is realted to item 3, lets ensure we have this figured out*

---

## 5. Persistent Kinship Linking
**Strategy**: Document permanent biological or legal relationships (like spouse/child) separately from event participation.
- **Implementation**: Model as an assertion (Subject -> Predicate: `SPOUSE_OF` -> Object) or a dedicated `person_relation` table if the scale warrants.
- Ensures Dorothy Yates is globally recognized as the wife, regardless of the individual event.

**Comments**:
*yes please*

---

## 6. Sub-Event "Succession"
**Strategy**: Use `event_relation` to move beyond simple parent/child nesting, documenting the "Flow" of an investigation.
- **Chain**: *Initial Report* -> (Relation: `RESULTS_IN`) -> *Formal Interview* -> (Relation: `RESULTS_IN`) -> *Polygraph*.
- Maintains the chronological and procedural logic of the investigation.

**Comments**:
*is this in the schema already?*

---
## 7. Migration Alignment Check
- **Relational Integrity**: **SUCCESS**. Updated `001_initial_schema.sql` at the source.
- **Controlled Vocab**: **SUCCESS**. Seeded `002_seed_vocab.sql` with `v_role_type`, `v_predicate`, and `v_relation_type` forensic codes.
- **JSON Consistency**: Current `events.json` structure is 100% compatible.
- **Kinship Solution**: Added `person_relation` table to core schema for global ties.

**Comments**:
*Verified: All refinements are now part of the primary source code. We are ready for migration.*
