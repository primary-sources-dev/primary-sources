# Ontology and Controlled Vocabulary

This document defines the authoritative reference codes (the `v_` tables) used to maintain the vault's computability and semantic integrity. Every "Type" or "Role" in the database must map to a code defined here.

## 1. Event Types (`v_event_type`)

Categorizes the nature of a spatiotemporal occurrence.

* **`SHOT`**: A specific instance of a firearm discharge.
* **`SIGHTING`**: A visual observation of a person or object by a witness.
* **`TRANSFER`**: The movement of a person or object from one custody/location to another.
* **`INTERVIEW`**: A formal or informal questioning session.
* **`REPORT_WRITTEN`**: The act of an official documenting an event or investigation.
* **`PHONE_CALL`**: A telephonic communication between two or more parties.

## 2. Participant Roles (`v_role_type`)

Defines the functional capacity of an entity during an event.

* **`WITNESS`**: An individual who personally observed the event.
* **`SUBJECT`**: The primary focus of the event (e.g., the person being transported).
* **`INVESTIGATOR`**: The official conducting the inquiry or reporting.
* **`PHOTOGRAPHER`**: The individual capturing visual evidence.
* **`PHYSICIAN`**: A medical professional performing an evaluation.
* **`OFFICER`**: Law enforcement personnel securing or participating in the event.

## 3. Source Types (`v_source_type`)

Categorizes the nature of the evidence container.

* **`REPORT`**: Official government or agency findings (e.g., FBI 302 — agent's summary).
* **`WITNESS_STATEMENT`**: Signed statement in witness's own words (distinct from agent summary). Higher evidentiary weight than REPORT.
* **`TESTIMONY`**: Sworn statements, depositions, or hearings before a commission/court.
* **`BOOK`**: Published historical or investigative literature.
* **`FILM`**: Moving image artifacts (e.g., newsreels, home movies).
* **`PHOTO`**: Still photography.
* **`MEMO`**: Internal informal correspondence or notes.
* **`ARTICLE`**: Periodical or newspaper clippings.

## 4. Time Precision (`v_time_precision`)

Defines the degree of certainty regarding a timestamp.

* **`EXACT`**: Timestamp is known to the minute or second.
* **`APPROX`**: Timestamp is estimated within a 15–30 minute window.
* **`RANGE`**: The event occurred between two known points in time.
* **`UNKNOWN`**: The specific time is not recorded or is highly disputed.

## 5. Place and Object Roles

Determines the relationship between an entity and an event's location or physical artifacts.

### 5.1 Place Roles (`v_place_role`)

* **`OCCURRED_AT`**: The primary location of the event.
* **`STARTED_AT`**: The point of origin for a movement or duration.
* **`ENDED_AT`**: The destination or terminal point.
* **`FOUND_AT`**: The location where evidence was recovered.

### 5.2 Object Roles (`v_object_role`)

* **`USED`**: The object was utilized during the event (e.g., a rifle fired).
* **`RECOVERED`**: The object was taken into custody during the event.
* **`EXAMINED`**: The object was the subject of a forensic test or review.
* **`PHOTOGRAPHED`**: The object was visually documented during the event.
* **`TRANSFERRED`**: The object was moved to a new party or location.

## 6. Entity Classifications

### 6.1 Org Types (`v_org_type`)

* **`AGENCY`**: Government or law enforcement bodies (e.g., FBI, DPD).
* **`MEDIA`**: News outlets or publishers (e.g., WFAA, Star-Telegram).
* **`BUSINESS`**: Commercial entities.
* **`GROUP`**: Political or social organizations.

### 6.2 Place Types (`v_place_type`)

* **`BUILDING`**: A specific structure (e.g., Texas School Book Depository).
* **`STREET`**: A road or intersection.
* **`CITY`**: A municipal area.
* **`SITE`**: A specific area or geographic zone (e.g., Dealey Plaza assassination site, parking lot).

### 6.3 Object Types (`v_object_type`)

* **`DOCUMENT`**: A written or printed record (e.g., a report, letter, exhibit).
* **`WEAPON`**: A firearm, blade, or instrument used to cause harm.
* **`VEHICLE`**: A car, motorcycle, or other mode of transport.
* **`MEDIA_CARRIER`**: A film reel, audio tape, or photographic negative.
* **`CLOTHING`**: Garments or personal effects worn by a subject.

## 7. Relation Types (`v_relation_type`)

Defines the directional edge between two events in the timeline graph.

* **`PRECEDES`**: Event A occurs chronologically before Event B.
* **`PART_OF`**: Event A is a sub-component of a larger Event B (e.g., a single shot is part of a motorcade segment).
* **`CORROBORATES`**: Event A provides secondary evidence that Event B occurred as described.
* **`CONTRADICTS`**: Event A makes the occurrence or timing of Event B logically impossible.

## 8. Assertion Types (`v_assertion_type`)

Categorizes the nature of an atomic claim. Every assertion in the database must be typed by one of these codes.

* **`TIME`**: A claim regarding when an event occurred.
* **`LOCATION`**: A claim regarding where an entity was located.
* **`PARTICIPATION`**: A claim regarding who was present at or involved in an event.
* **`POSSESSION`**: A claim regarding who owned, held, or controlled an object.
* **`OBSERVATION`**: A claim regarding a specific detail witnessed by a participant (e.g., the color of a jacket).
* **`IDENTIFICATION`**: A claim that Entity A is the same as, or an alias for, Entity B.

## 9. Evidence Support Types (`v_support_type`)

Defines the relationship between a source excerpt and an assertion.

* **`SUPPORTS`**: The excerpt explicitly corroborates the claim.
* **`CONTRADICTS`**: The excerpt provides a conflicting account.
* **`MENTIONS`**: The excerpt refers to the subjects but neither confirms nor denies the specific claim.

## 10. Assertion Predicates (`v_predicate`)

Defines the controlled vocabulary for `assertion.predicate`. All claims must use a code from this table — free-text predicates are not permitted.

See [`supabase/migrations/003_predicate_registry.sql`](../supabase/migrations/003_predicate_registry.sql) for the full seed list. Key categories:

* **Presence:** `WAS_PRESENT_AT`, `WAS_LOCATED_AT`
* **Identity:** `IS_ALIAS_OF`, `IS_SAME_AS`, `IS_MEMBER_OF`, `IS_EMPLOYED_BY`
* **Possession:** `OWNED`, `HELD_CUSTODY_OF`, `TRANSFERRED_TO`
* **Action:** `FIRED`, `ORDERED`, `COMMUNICATED_WITH`, `OBSERVED`
* **Testimony:** `TESTIFIED_THAT`, `DOCUMENTED`, `CONTRADICTED`
* **State:** `WAS_ALIVE_AT`, `WAS_DECEASED_AT`, `WAS_INJURED_AT`

## 11. Vocabulary Governance Policy

All codes in `v_` tables are intentional and version-controlled. The following rules govern additions.

### Adding a New Code

1. **Justify the gap** — confirm no existing code covers the concept.
2. **Name it** — use `UPPER_SNAKE_CASE`. Be specific and unambiguous.
3. **Add to the correct migration** — create a new numbered migration file (e.g., `004_...sql`). Never modify a previously applied migration.
4. **Update this document** — add the new code and definition to the relevant section above.

### Deprecating a Code

1. Do not delete codes that have been applied to live data.
2. Add a `DEPRECATED_` prefix or a `notes` entry in the `v_` table marking it inactive.
3. Document the deprecated code here with a replacement code noted.

### Versioning Rule

Each set of vocab additions corresponds to one migration file. Migration files are numbered sequentially and never edited after deployment.
