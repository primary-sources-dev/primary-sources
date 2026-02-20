# Ontology and Controlled Vocabulary

This document defines the authoritative reference codes (the `v_` tables) used to maintain the vault's computability and semantic integrity. Every "Type" or "Role" in the database must map to a code defined here.

## 1. Event Types (`v_event_type`)

Categorizes the nature of a spatiotemporal occurrence.

* **`SHOT`**: A specific instance of a firearm discharge.
* **`SIGHTING`**: A visual observation of a person or object by a witness.
* **`TRANSFER`**: The movement of a person or object from one custody/location to another.
* **`INTERVIEW`**: A formal or informal questioning session.
* **`REPORT_WRITTEN`**: The act of an official documenting an event or investigation.
* **`AUTOPSY_STEP`**: A specific procedure performed during a post-mortem examination.
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

* **`REPORT`**: Official government or agency findings (e.g., FBI 302).
* **`TESTIMONY`**: Sworn statements, depositions, or hearings.
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
* **`TRANSFERRED`**: The object was moved to a new party or location.

## 6. Entity Classifications

### 6.1 Org Types (`v_org_type`)

* **`AGENCY`**: Government or law enforcement bodies (e.g., FBI, DPD).
* **`MEDIA`**: News outlets or publishers (e.g., WFAA, Star-Telegram).
* **`BUSINESS`**: Commercial entities (e.g., TBSC).
* **`GROUP`**: Political or social organizations.

### 6.2 Place Types (`v_place_type`)

* **`BUILDING`**: A specific structure (e.g., Texas School Book Depository).
* **`STREET`**: A road or intersection.
* **`CITY`**: A municipal area.
* **`REGION`**: A larger geographic or administrative zone.

## 7. Evidence Support Types (`v_support_type`)

Defines the relationship between a source excerpt and an assertion.

* **`SUPPORTS`**: The excerpt explicitly corroborates the claim.
* **`CONTRADICTS`**: The excerpt provides a conflicting account.
* **`MENTIONS`**: The excerpt refers to the subjects but neither confirms nor denies the specific claim.
