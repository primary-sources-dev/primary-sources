# Entity Extraction Pipeline

Workflow for extracting structured entities from OCR'd source documents, mapped to the database schema and UI JSON formats.

---

## Architecture Overview

```
                                    ┌─────────────────────┐
                                    │  Supabase Database  │
                                    │  (Source of Truth)  │
                                    └─────────────────────┘
                                              ▲
                                              │ SQL INSERT
                                              │
┌──────────────┐    ┌──────────────┐    ┌─────────────────┐
│  OCR'd PDF   │ →  │  Extraction  │ →  │ [source]_       │
│  (raw text)  │    │  Process     │    │ entities.json   │
└──────────────┘    └──────────────┘    └─────────────────┘
                                              │
                                              │ Merge
                                              ▼
                                    ┌─────────────────────┐
                                    │  docs/ui/assets/    │
                                    │  data/*.json        │
                                    │  (UI Presentation)  │
                                    └─────────────────────┘
```

**Two Output Targets:**
1. **Database** — PostgreSQL tables with strict FK constraints to controlled vocabularies
2. **UI JSON** — Presentation layer with additional display fields (icons, labels, tags)

---

## Part 1: Database Schema Reference

The database is the source of truth. All entities must conform to these table structures.

### 1.1 Person Table

```sql
CREATE TABLE person (
  person_id    UUID PRIMARY KEY,
  display_name TEXT NOT NULL,        -- "Yates, Ralph Leon"
  given_name   TEXT,                 -- "Ralph"
  middle_name  TEXT,                 -- "Leon"
  family_name  TEXT,                 -- "Yates"
  birth_date   DATE,                 -- 1936-01-23
  death_date   DATE,                 -- NULL if alive/unknown
  notes        TEXT
);
```

**Related tables:**
- `person_alias` — Alternative names (e.g., "Jack Ruby" → "Jack Rubenstein")
- `entity_identifier` — External IDs (FBI file numbers, military service numbers)

### 1.2 Org Table

```sql
CREATE TABLE org (
  org_id     UUID PRIMARY KEY,
  name       TEXT NOT NULL,          -- "Texas Butchers Supply Company"
  org_type   TEXT REFERENCES v_org_type(code),  -- FK constraint
  url        TEXT,                   -- Homepage or reference URL
  start_date DATE,                   -- Founding date
  end_date   DATE,                   -- Dissolution date (if applicable)
  notes      TEXT
);
```

**Controlled vocabulary (`v_org_type`):**
| Code | Label |
|------|-------|
| `AGENCY` | Government or law enforcement bodies |
| `MEDIA` | News outlets or publishers |
| `BUSINESS` | Commercial entities |
| `GROUP` | Political or social organizations |
| `ORGANIZATION` | Generic social or public organization |
| `ARCHIVE` | Document repository or research collection |

### 1.3 Place Table

```sql
CREATE TABLE place (
  place_id        UUID PRIMARY KEY,
  name            TEXT NOT NULL,      -- "Texas School Book Depository"
  place_type      TEXT REFERENCES v_place_type(code),  -- FK constraint
  parent_place_id UUID REFERENCES place(place_id),     -- Hierarchical
  lat             DOUBLE PRECISION,   -- 32.7798
  lon             DOUBLE PRECISION,   -- -96.8086
  notes           TEXT
);
```

**Controlled vocabulary (`v_place_type`):**
| Code | Label |
|------|-------|
| `BUILDING` | A specific structure |
| `STREET` | A road or intersection |
| `CITY` | A municipal area |
| `SITE` | A specific area or geographic zone |
| `RESIDENCE` | A domestic building (Building subtype) |
| `OFFICE` | A workspace building (Building subtype) |

### 1.4 Object Table

```sql
CREATE TABLE object (
  object_id   UUID PRIMARY KEY,
  name        TEXT NOT NULL,          -- "Mannlicher-Carcano Rifle"
  object_type TEXT REFERENCES v_object_type(code),  -- FK constraint
  description TEXT                    -- Detailed description
);
```

**Controlled vocabulary (`v_object_type`):**
| Code | Label |
|------|-------|
| `DOCUMENT` | Written or printed record (report, letter, exhibit) |
| `WEAPON` | Firearm, blade, or instrument used to cause harm |
| `VEHICLE` | Car, motorcycle, or other transport |
| `MEDIA_CARRIER` | Film reel, audio tape, photographic negative |
| `CLOTHING` | Garments or personal effects |

### 1.5 Event Table

```sql
CREATE TABLE event (
  event_id       UUID PRIMARY KEY,
  event_type     TEXT NOT NULL REFERENCES v_event_type(code),  -- FK constraint
  title          TEXT,                -- "The Ralph Leon Yates Incident"
  start_ts       TIMESTAMPTZ,         -- 1963-11-20T10:30:00Z
  end_ts         TIMESTAMPTZ,         -- NULL for point events
  time_precision TEXT REFERENCES v_time_precision(code),
  description    TEXT
);
```

**Controlled vocabulary (`v_event_type`):**
| Code | Label |
|------|-------|
| `SHOT` | Specific instance of a firearm discharge |
| `SIGHTING` | Visual observation of a person or object |
| `TRANSFER` | Movement of person/object between custody/location |
| `INTERVIEW` | Formal or informal questioning session |
| `REPORT_WRITTEN` | Official documenting an event |
| `PHONE_CALL` | Telephonic communication |

**Controlled vocabulary (`v_time_precision`):**
| Code | Rule |
|------|------|
| `EXACT` | start_ts NOT NULL, end_ts NULL or = start_ts |
| `APPROX` | start_ts NOT NULL, end_ts must be NULL |
| `RANGE` | Both start_ts AND end_ts NOT NULL |
| `UNKNOWN` | Both start_ts AND end_ts must be NULL |

### 1.6 Junction Tables

Events connect to entities through junction tables:

```sql
-- Who participated?
CREATE TABLE event_participant (
  event_id   UUID REFERENCES event(event_id),
  party_type TEXT CHECK (party_type IN ('person','org')),
  party_id   UUID,  -- References person or org based on party_type
  role_type  TEXT REFERENCES v_role_type(code),
  assertion_id UUID REFERENCES assertion(assertion_id),
  notes      TEXT
);

-- Where did it happen?
CREATE TABLE event_place (
  event_id   UUID REFERENCES event(event_id),
  place_id   UUID REFERENCES place(place_id),
  place_role TEXT REFERENCES v_place_role(code),  -- OCCURRED_AT, STARTED_AT, ENDED_AT
  assertion_id UUID,
  notes      TEXT
);

-- What objects were involved?
CREATE TABLE event_object (
  event_id    UUID REFERENCES event(event_id),
  object_id   UUID REFERENCES object(object_id),
  object_role TEXT REFERENCES v_object_role(code),  -- USED, RECOVERED, EXAMINED
  assertion_id UUID,
  notes       TEXT
);
```

**Participant roles (`v_role_type`):**
| Code | Label |
|------|-------|
| `WITNESS` | Personally observed the event |
| `SUBJECT` | Primary focus of the event |
| `INVESTIGATOR` | Official conducting inquiry |
| `PHOTOGRAPHER` | Capturing visual evidence |
| `PHYSICIAN` | Medical professional |
| `OFFICER` | Law enforcement personnel |

---

## Part 2: UI JSON Format

The UI layer adds presentation fields not stored in the database.

### 2.1 People (UI)

```json
{
  "id": "ralph-yates",                    // Slug for URL routing
  "person_id": "uuid-v4",                 // Matches database PK
  "icon": "person",                       // Material icon name
  "label": "Main Witness · 1928 – 1975",  // Display subtitle
  "display_name": "Yates, Ralph Leon",    // From database
  "given_name": "Ralph",
  "family_name": "Yates",
  "tags": ["The Ralph Leon Yates incident", "Texas Butchers Supply Company"],
  "notes": "Description text..."
}
```

### 2.2 Organizations (UI)

```json
{
  "id": "texas-butchers",                 // Slug
  "org_id": "uuid-v4",                    // Matches database PK
  "org_type": "BUSINESS",                 // From v_org_type
  "icon": "store",                        // Material icon
  "label": "Industrial · Dallas, TX",     // Display subtitle
  "name": "Texas Butchers Supply Company",
  "notes": "Description...",
  "url": "#"
}
```

**Icon mapping for org_type:**
| org_type | Suggested Icon |
|----------|----------------|
| `AGENCY` | `policy`, `local_police`, `gavel` |
| `MEDIA` | `newspaper` |
| `BUSINESS` | `store`, `storefront` |
| `GROUP` | `groups` |
| `ARCHIVE` | `account_balance`, `local_library`, `menu_book` |
| `ORGANIZATION` | `local_hospital`, `church` |

### 2.3 Places (UI)

```json
{
  "id": "tsbd",                           // Slug
  "place_id": "uuid-v4",                  // Matches database PK
  "icon": "corporate_fare",               // Material icon
  "label": "Building · Dallas",           // Display subtitle
  "name": "Texas School Book Depository",
  "place_type": "BUILDING",               // From v_place_type
  "parent_place_id": "uuid-of-dallas",    // Hierarchical link
  "lat": 32.7798,
  "lon": -96.8086,
  "notes": "Description..."
}
```

**Icon mapping for place_type:**
| place_type | Suggested Icon |
|------------|----------------|
| `CITY` | `location_city` |
| `SITE` | `landscape`, `place` |
| `BUILDING` | `corporate_fare`, `home`, `storefront` |
| `STREET` | `signpost`, `route` |
| `RESIDENCE` | `home`, `cottage` |
| `OFFICE` | `corporate_fare` |

### 2.4 Objects (UI)

```json
{
  "id": "rifle-ce139",                    // Slug
  "object_id": "uuid-v4",                 // Matches database PK
  "icon": "precision_manufacturing",      // Material icon
  "label": "Weapon · Exhibit 139",        // Display subtitle
  "name": "Mannlicher-Carcano Rifle",
  "object_type": "WEAPON",                // From v_object_type
  "description": "6.5mm Italian carbine..."
}
```

**Icon mapping for object_type:**
| object_type | Suggested Icon |
|-------------|----------------|
| `DOCUMENT` | `description`, `receipt_long`, `article` |
| `WEAPON` | `precision_manufacturing` |
| `VEHICLE` | `local_shipping`, `directions_car` |
| `MEDIA_CARRIER` | `photo`, `videocam`, `album` |
| `CLOTHING` | `checkroom` |

### 2.5 Events (UI)

```json
{
  "id": "yates-hitchhiker",               // Slug
  "event_id": "uuid-v4",                  // Matches database PK
  "event_type": "SIGHTING",               // From v_event_type
  "icon": "person_pin",                   // Material icon
  "label": "Nov 20 – 21, 1963 · Dallas",  // Display subtitle
  "title": "The Ralph Leon Yates incident",
  "description": "Full narrative...",
  "featured": true,                       // UI flag for homepage
  "is_conflict": true,                    // UI flag for disputed events
  "parent_event_id": null,                // For sub-events
  "start_ts": "1963-11-20T10:30:00Z",
  "end_ts": null,
  "time_precision": "APPROX"
}
```

**Icon mapping for event_type:**
| event_type | Suggested Icon |
|------------|----------------|
| `SIGHTING` | `person_pin`, `visibility` |
| `SHOT` | `gps_fixed` |
| `TRANSFER` | `pin_drop`, `swap_horiz` |
| `INTERVIEW` | `assignment_ind`, `record_voice_over` |
| `REPORT_WRITTEN` | `campaign`, `history_edu` |
| `PHONE_CALL` | `phone_in_talk` |

---

## Part 3: Extraction Workflow

### Step 1: Read OCR Text

```
Read PDF in 500-line chunks:
  raw-material/[source]/[document]_searchable.pdf
  
Note extraction points:
  - FBI FD-302 headers (dates, file numbers, agents)
  - ALL CAPS names (FBI formatting convention)
  - Page markers ("-- 3 of 43 --")
  - Addresses (structured text patterns)
  - Timestamps ("10:30 AM", "November 20, 1963")
```

### Step 2: Categorize Raw Mentions

As you read, collect mentions into categories:

| Category | What to Look For |
|----------|------------------|
| **People** | Full names (RALPH LEON YATES), titles (SA, Dr., Gen.) |
| **Organizations** | Company names, agency abbreviations (FBI, DPD, TBSC) |
| **Places** | Addresses, building names, street intersections |
| **Objects** | Physical items with descriptions, exhibit numbers |
| **Events** | Actions with dates/times (interviewed, observed, called) |

### Step 3: Map to Controlled Vocabulary

**CRITICAL**: Every `*_type` field must use a code from the vocabulary tables.

Cross-reference your extracted data:

| Extracted Text | Maps To | Vocabulary Code |
|----------------|---------|-----------------|
| "refrigeration company" | org_type | `BUSINESS` |
| "FBI office" | org_type | `AGENCY` |
| "Oak Cliff section" | place_type | `SITE` |
| "13564 Brookgreen" | place_type | `RESIDENCE` |
| "brown paper package" | object_type | `DOCUMENT` |
| "pickup truck" | object_type | `VEHICLE` |
| "picked up hitchhiker" | event_type | `SIGHTING` |
| "interviewed by FBI" | event_type | `INTERVIEW` |
| "called FBI office" | event_type | `PHONE_CALL` |

### Step 4: Generate Structured Output

Output file: `raw-material/[source]/[source]_entities.json`

```json
{
  "metadata": {
    "source_document": "yates_searchable.pdf",
    "extraction_date": "2026-02-23",
    "extraction_method": "manual review of OCR text"
  },
  
  "people": [
    {
      "id": "dempsey-jones",
      "person_id": "b3c4d5e6-f7a8-4901-b2c3-d4e5f6a7b8c9",
      "display_name": "Jones, Dempsey",
      "given_name": "Dempsey",
      "family_name": "Jones",
      "birth_date": null,
      "death_date": null,
      "notes": "Co-worker of Ralph Yates at TBSC...",
      
      "ui_fields": {
        "icon": "person",
        "label": "Witness · TBSC Employee",
        "tags": ["The Ralph Leon Yates incident", "Texas Butchers Supply Company"]
      },
      
      "status": "NEW"
    }
  ],
  
  "organizations": [
    {
      "id": "carousel-club",
      "org_id": "c2d3e4f5-a6b7-4890-c1d2-e3f4a5b6c7d8",
      "name": "Carousel Club",
      "org_type": "BUSINESS",
      "url": null,
      "start_date": null,
      "end_date": null,
      "notes": "Nightclub operated by Jack Ruby...",
      
      "ui_fields": {
        "icon": "nightlife",
        "label": "Nightclub · Dallas, TX"
      },
      
      "status": "NEW"
    }
  ],
  
  "places": [
    {
      "id": "elm-houston-corner",
      "place_id": "f1a2b3c4-d5e6-4789-f0a1-b2c3d4e5f6a7",
      "name": "Corner of Elm and Houston Streets",
      "place_type": "SITE",
      "parent_place_id": "7c8d9e0f-1a2b-43c4-d5e6-f7a8b9c0d1e2",
      "lat": 32.7795,
      "lon": -96.8083,
      "notes": "Where Yates dropped off hitchhiker...",
      
      "ui_fields": {
        "icon": "place",
        "label": "Intersection · Dealey Plaza"
      },
      
      "status": "NEW"
    }
  ],
  
  "objects": [
    {
      "id": "brown-paper-package-yates",
      "object_id": "d1e2f3a4-b5c6-4789-d0e1-f2a3b4c5d6e7",
      "name": "Brown Paper Package ('Curtain Rods')",
      "object_type": "DOCUMENT",
      "description": "Package 4-4.5 feet long, wrapped in brown paper...",
      
      "ui_fields": {
        "icon": "inventory_2",
        "label": "Package · Yates Testimony"
      },
      
      "status": "NEW"
    }
  ],
  
  "events": [
    {
      "id": "hitchhiker-dropoff",
      "event_id": "c6d7e8f9-a0b1-4234-c5d6-e7f8a9b0c1d2",
      "event_type": "TRANSFER",
      "title": "Hitchhiker Drop-off at TSBD Corner",
      "start_ts": "1963-11-20T10:45:00Z",
      "end_ts": null,
      "time_precision": "APPROX",
      "description": "Ralph Yates dropped off hitchhiker at Elm & Houston...",
      
      "ui_fields": {
        "icon": "pin_drop",
        "label": "Nov 20–21, 1963 · Elm & Houston",
        "parent_event_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"
      },
      
      "status": "NEW"
    }
  ],
  
  "summary": {
    "total_people_new": 20,
    "total_organizations_new": 7,
    "total_places_new": 13,
    "total_objects_new": 5,
    "total_events_new": 7
  }
}
```

---

## Part 4: Reference UUIDs

For `parent_place_id` linking, use these established UUIDs from existing data:

### Places
| Place | place_id |
|-------|----------|
| Dallas | `2e3f4a5b-6c7d-48e9-f0a1-b2c3d4e5f6a7` |
| Irving | `4b5c6d7e-8f9a-40b1-c2d3-e4f5a6b7c8d9` |
| New Orleans | `9f0a1b2c-3d4e-45f6-a7b8-c9d0e1f2a3b4` |
| Dealey Plaza | `7c8d9e0f-1a2b-43c4-d5e6-f7a8b9c0d1e2` |
| TSBD | `a1b2c3d4-e5f6-4778-a9b0-c1d2e3f4a5b6` |

### Events (for parent_event_id)
| Event | event_id |
|-------|----------|
| Yates Hitchhiker (main) | `1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d` |
| Odio Incident | `6f7a8b9c-0d1e-42f3-a4b5-c6d7e8f9a0b1` |
| Walker Incident | `2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7` |

---

## Part 5: Quality Checklist

### Database Compliance
- [ ] All `*_type` fields use codes from `v_` tables
- [ ] All UUIDs are valid v4 format
- [ ] `parent_place_id` references existing place records
- [ ] `time_precision` rules are followed (see Part 1.5)
- [ ] Names pass length checks (not empty/whitespace)

### UI Completeness
- [ ] Every entity has an `id` slug (kebab-case)
- [ ] Icons are valid Material icon names
- [ ] Labels follow pattern: "Role/Type · Context"
- [ ] Tags reference exact event titles

### Data Quality
- [ ] Notes include source document context
- [ ] Coordinates added where possible
- [ ] Aliases captured in notes or person_alias entries
- [ ] Related objects cross-referenced

---

## Part 6: Merge Process

After extraction, entities need to be merged into the target files.

### To Database (SQL INSERT)
```sql
-- Example: Insert new person
INSERT INTO person (person_id, display_name, given_name, family_name, notes)
VALUES (
  'b3c4d5e6-f7a8-4901-b2c3-d4e5f6a7b8c9',
  'Jones, Dempsey',
  'Dempsey',
  'Jones',
  'Co-worker of Ralph Yates at TBSC...'
);
```

### To UI JSON (merge into docs/ui/assets/data/*.json)
```javascript
// Combine database fields + ui_fields into final format
const uiPerson = {
  ...extractedPerson,           // Database fields
  ...extractedPerson.ui_fields  // UI presentation fields
};
delete uiPerson.ui_fields;
delete uiPerson.status;
```

---

## Appendix: Automation Opportunities

### Automatable Now
| Task | Tool | Notes |
|------|------|-------|
| UUID generation | Script | Batch generate valid v4 UUIDs |
| Slug creation | Script | Convert names to kebab-case |
| Date parsing | `dateparser` | Extract and convert to ISO 8601 |
| Geocoding | Nominatim API | Convert addresses to lat/lon |
| De-duplication check | `rapidfuzz` | Fuzzy match against existing entities |

### LLM-Assisted (Semi-Automated)
| Task | Approach |
|------|----------|
| Entity extraction | Prompt: "Extract people, places, orgs from this text" |
| Type classification | Prompt: "Classify this org: [name]. Options: AGENCY, BUSINESS, GROUP" |
| Event boundary detection | Prompt: "Is this a new event or part of the previous?" |

### Requires Human Review
| Task | Reason |
|------|--------|
| De-duplication confirmation | "Jack Ruby" vs "Jacob Rubenstein" |
| Event boundaries | Subjective interpretation |
| Time precision judgment | EXACT vs APPROX |
| Conflict flagging | Historical interpretation |
