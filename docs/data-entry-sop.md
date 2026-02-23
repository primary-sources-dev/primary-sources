# Data Entry Standard Operating Procedure (SOP)

This document outlines the authoritative workflow for decomposing primary source material into 4NF-compliant database records. Strict adherence to this process ensures that every data point in the vault is traceable, unique, and computable.

---

## Prerequisites: OCR Processing

Before beginning data entry, ensure the source document has been processed through the OCR pipeline. Scanned PDFs must be converted to searchable text to enable efficient excerpt extraction.

> **Reference:** See [OCR Pipeline Guide](./ocr-pipeline-guide.md) for tool installation, batch processing scripts, and quality control procedures.

---

## 1. Phase I: Source Registration

Every data point must begin with its container.

1. **Identity Verification**: Search the `source` table using the **NARA RIF**, **Archive ID**, or **Title**.
2. **Register Source**: If the source is missing, insert a new record into `source`.
* *Standard*: Ensure `source_type` matches a code in `v_source_type` (e.g., `REPORT`, `TESTIMONY`).


3. **Define Excerpt**: Create a `source_excerpt` record for the specific page, paragraph, or timestamp.
* *Standard*: Use the most granular locator possible (e.g., `p. 4, para. 2`).



## 2. Phase II: Entity Verification & De-duplication

To maintain 4NF purity, we must prevent "Entity Splitting" (multiple records for one person/object).

1. **Scan for Identifiers**: Identify specific IDs mentioned (e.g., FBI File #, Commission Exhibit #, License Plate).
2. **Cross-Reference `entity_identifier`**: Search the `entity_identifier` table for these values **before** creating a new entity.
3. **Check Aliases**: Search `person_alias` to determine if a name mentioned is an alternate identity for an existing `person_id`.
4. **Register Entities**: Only after exhausting de-duplication steps should you create records in `person`, `org`, `place`, or `object`.

> **Integrity Protection (Migration 004):** The database automatically validates all `entity_identifier` entries. If you attempt to link an identifier to a non-existent `entity_id`, the insert will be rejected with a descriptive error. This prevents orphaned references and ensures all identifiers trace to valid entities.

## 3. Phase III: Event Construction

Events anchor the entities in time and space.

1. **Initialize Event**: Create a record in the `event` table.
2. **Set Precision**: Assign a `v_time_precision` code (e.g., `EXACT` or `APPROX`).
3. **Map Participant Roles**: Add entries to `event_participant`.
* *Action*: Assign the specific `v_role_type` (e.g., `INVESTIGATOR`, `WITNESS`).


4. **Anchor Geography & Artifacts**: Add entries to `event_place` and `event_object` using the appropriate `v_place_role` and `v_object_role`.

## 4. Phase IV: Assertion & Support (The Evidence Loop)

This phase formalizes the claim made by the source.

1. **Formulate Assertion**: Create a record in the `assertion` table.
* *Structure*: Define the **Subject**, **Predicate**, and **Object**.
* *Link*: Reference the `context_event_id` created in Phase III.


2. **Link Evidence**: Create a record in `assertion_support`.
* *Action*: Connect the `assertion_id` to the `excerpt_id` from Phase I.
* *Evaluation*: Select the `v_support_type` (`SUPPORTS`, `CONTRADICTS`, or `MENTIONS`).



## 5. Phase V: Final Validation

1. **Relational Edges**: If the event has a sequence relationship with another, update `event_relation`.
2. **Integrity Audit**: Ensure all junction table entries include an `assertion_id` to maintain a perfect paper trail.
