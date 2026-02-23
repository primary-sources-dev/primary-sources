# Entity Extraction Pipeline

Detailed workflow for extracting structured entities from OCR'd source documents.

---

## Overview

This document describes the exact process for converting raw OCR text from PDF documents into structured JSON entities that match the database schema.

**Input:** OCR'd PDF (e.g., `yates_searchable.pdf`)  
**Output:** Structured JSON file (e.g., `yates_entities.json`)

---

## Phase 1: Document Ingestion

### 1.1 Read OCR Text

Read the PDF in chunks to extract searchable text:

```
# Read first 500 lines
Read: raw-material/[source]/[document]_searchable.pdf (lines 1-500)

# Continue reading in 500-line chunks
Read: lines 500-1000
Read: lines 1000-1500
# ... until document is fully reviewed
```

**Key extraction points:**
- FBI FD-302 reports have structured headers with dates, file numbers, agents
- Testimony transcripts have speaker identification
- Look for ALL CAPS names (FBI style)
- Note page numbers from OCR (e.g., "-- 3 of 43 --")

### 1.2 Create Working Notes

As you read, extract raw mentions in categories:
- Names (with context: role, relationship, address)
- Dates (with associated actions)
- Locations (addresses, buildings, streets)
- Objects (physical items mentioned)
- Events (interviews, sightings, transfers)

---

## Phase 2: Schema Reference

Before structuring entities, review existing JSON files to understand required fields.

### 2.1 People Schema

```json
{
  "id": "slug-format-name",
  "person_id": "uuid-v4",
  "icon": "person",
  "label": "Role · Dates or Context",
  "display_name": "Last, First",
  "given_name": "First",
  "family_name": "Last",
  "aliases": ["Optional array"],
  "tags": ["Event tags", "Organization tags"],
  "notes": "Detailed description with source context"
}
```

**Label format examples:**
- `"FBI Special Agent · Dallas Office"`
- `"Witness · TBSC Employee"`
- `"Family · Yates Daughter"`
- `"Politician · 1900 – 1965"`

### 2.2 Organizations Schema

```json
{
  "id": "slug-format-name",
  "org_id": "uuid-v4",
  "org_type": "BUSINESS | AGENCY | ARCHIVE | ORGANIZATION",
  "icon": "store | policy | local_police | gavel | local_hospital | nightlife | military_tech",
  "label": "Type · Location",
  "name": "Full Official Name",
  "aliases": ["Optional array"],
  "notes": "Description with address and relevance",
  "url": "null or URL string"
}
```

**org_type values:**
- `BUSINESS` — Commercial entities (stores, clubs, companies)
- `AGENCY` — Government bodies (FBI, police, military)
- `ARCHIVE` — Document repositories
- `ORGANIZATION` — Other (hospitals, churches)

### 2.3 Places Schema

```json
{
  "id": "slug-format-name",
  "place_id": "uuid-v4",
  "icon": "location_city | signpost | place | landscape | home | storefront | corporate_fare | route | local_mall",
  "label": "Type · Parent Location",
  "name": "Full Place Name",
  "place_type": "CITY | SITE | BUILDING | STREET",
  "parent_place_id": "uuid of parent or null",
  "lat": null or decimal,
  "lon": null or decimal,
  "notes": "Description with address and significance"
}
```

**place_type hierarchy:**
- `CITY` — Top level (Dallas, Irving, New Orleans)
- `SITE` — Areas within cities (Oak Cliff, Dealey Plaza)
- `BUILDING` — Specific structures (TSBD, residences)
- `STREET` — Roads and intersections

**Parent linking:**
- Dallas places → parent_place_id: `"2e3f4a5b-6c7d-48e9-f0a1-b2c3d4e5f6a7"` (Dallas)
- Irving places → parent_place_id: `"4b5c6d7e-8f9a-40b1-c2d3-e4f5a6b7c8d9"` (Irving)
- Dealey Plaza sites → parent_place_id: `"7c8d9e0f-1a2b-43c4-d5e6-f7a8b9c0d1e2"` (Dealey Plaza)

### 2.4 Objects Schema

```json
{
  "id": "slug-format-name",
  "object_id": "uuid-v4",
  "icon": "inventory_2 | photo | badge | receipt_long | local_shipping | precision_manufacturing",
  "label": "Type · Exhibit or Source",
  "name": "Descriptive Name",
  "object_type": "WEAPON | DOCUMENT | MEDIA_CARRIER | VEHICLE",
  "description": "Full description with measurements, serial numbers, significance",
  "related_to": "Optional: id of related object"
}
```

### 2.5 Events Schema

```json
{
  "id": "slug-format-name",
  "event_id": "uuid-v4",
  "parent_event_id": "uuid of parent event or omit",
  "event_type": "SIGHTING | SHOT | TRANSFER | INTERVIEW | REPORT_WRITTEN | PHONE_CALL",
  "icon": "person_pin | pin_drop | assignment_ind | record_voice_over | build | phone_in_talk",
  "label": "Date · Location",
  "title": "Event Title",
  "description": "Full narrative description",
  "featured": true/false (optional),
  "is_conflict": true/false (optional, for disputed events),
  "start_ts": "ISO 8601 timestamp",
  "end_ts": "ISO 8601 timestamp (for RANGE precision)",
  "time_precision": "EXACT | APPROX | RANGE | UNKNOWN"
}
```

**time_precision rules:**
- `EXACT` — Known date/time, start_ts only
- `APPROX` — Estimated date/time, start_ts only
- `RANGE` — Date span, both start_ts and end_ts required
- `UNKNOWN` — Both timestamps null

**event_type to icon mapping:**
| Event Type | Icon | Use Case |
|------------|------|----------|
| SIGHTING | person_pin | Witness observations |
| SHOT | gps_fixed | Shooting incidents |
| TRANSFER | pin_drop, build | Drop-offs, service calls |
| INTERVIEW | assignment_ind | FBI/official interviews |
| REPORT_WRITTEN | record_voice_over, campaign | Verbal reports, first contact |
| PHONE_CALL | phone_in_talk | Telephone communications |

---

## Phase 3: Entity Population

### 3.1 Generate UUIDs

Use UUID v4 format for all `*_id` fields. Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Convention for this project:**
- Increment from existing UUIDs in seed data
- Keep pattern recognizable (e.g., `a1b2c3d4-...` incrementing)

### 3.2 Create Slugs

ID slugs follow kebab-case convention:
- `ralph-leon-yates` (not `ralph_leon_yates`)
- `dallas-fbi-office` (not `DallasFBIOffice`)
- `elm-houston-corner` (descriptive, not just `intersection-1`)

### 3.3 Cross-Reference Tags

Tags connect people to events. Use exact event titles:
- `"The Ralph Leon Yates incident"`
- `"The Sylvia Odio Incident"`
- `"Oswald Hired at TSBD"`

Organization tags link people to employers:
- `"Texas Butchers Supply Company"`
- `"FBI"`

### 3.4 Status Tracking

Mark each entity with a status field for processing:
- `"status": "NEW"` — Extracted from this document, not yet in main data
- `"status": "exists in [file].json"` — Already in database
- `"status": "NEW - [note]"` — New with special annotation

---

## Phase 4: Output Structure

### 4.1 File Organization

Output file location: `raw-material/[source]/[source]_entities.json`

Example: `raw-material/yates/yates_entities.json`

### 4.2 JSON Structure

```json
{
  "metadata": {
    "source_document": "yates_searchable.pdf",
    "extraction_date": "YYYY-MM-DD",
    "extraction_method": "manual review of OCR text"
  },
  
  "people": [ ... ],
  "organizations": [ ... ],
  "places": [ ... ],
  "objects": [ ... ],
  "events": [ ... ],
  
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

## Phase 5: Quality Checklist

Before finalizing, verify:

### People
- [ ] All names have `display_name` in "Last, First" format
- [ ] `given_name` and `family_name` populated where known
- [ ] Role/relationship clear in `label`
- [ ] Tags link to relevant events/organizations
- [ ] Notes include source document context

### Organizations
- [ ] `org_type` matches controlled vocabulary
- [ ] Address included in notes if known
- [ ] Aliases captured (e.g., "TBSC" for full company name)

### Places
- [ ] `place_type` correctly categorized
- [ ] `parent_place_id` links to existing city/site
- [ ] Coordinates added where possible (can geocode later)
- [ ] Full address in `name` or `notes`

### Objects
- [ ] `object_type` matches controlled vocabulary
- [ ] Physical description included (size, serial numbers)
- [ ] Related objects cross-referenced
- [ ] Exhibit numbers noted where applicable

### Events
- [ ] `event_type` matches controlled vocabulary
- [ ] `time_precision` correctly set
- [ ] `parent_event_id` links sub-events to main incident
- [ ] Participants mentioned in description
- [ ] Date format consistent (ISO 8601)

---

## Automation Opportunities

### Automatable Now

1. **UUID generation** — Script to batch-generate valid UUIDs
2. **Slug creation** — Convert names to kebab-case automatically
3. **Date parsing** — Extract and convert dates to ISO 8601
4. **Geocoding** — Convert addresses to lat/lon coordinates

### Semi-Automatable (LLM-Assisted)

1. **Entity extraction** — Use Claude/GPT to identify entities from OCR text
2. **Schema population** — LLM fills template based on extracted data
3. **Parent linking** — Suggest parent_place_id based on location context
4. **Tag assignment** — Suggest event tags based on content

### Requires Human Review

1. **De-duplication** — Confirming entity matches across documents
2. **Event boundaries** — Deciding where one event ends and another begins
3. **Time precision** — Judging EXACT vs APPROX vs RANGE
4. **Conflict flagging** — Identifying disputed facts

---

## Example Extraction Session

**Input text (from OCR):**
```
RALPH LEON YATES, 13564 Brookgreen, Dallas, Texas,
voluntarily appeared at the Dallas FBI Office, accompanied by his
uncle, Mr. J. O. SMITH, 13770 Sprucewood, Dallas, Texas...
```

**Extracted entities:**

```json
// Person 1
{
  "id": "ralph-leon-yates",
  "display_name": "Yates, Ralph Leon",
  "notes": "Resided at 13564 Brookgreen, Dallas TX..."
}

// Person 2  
{
  "id": "jo-smith",
  "display_name": "Smith, J.O.",
  "label": "Family · Yates Uncle",
  "notes": "Resided at 13770 Sprucewood, Dallas TX..."
}

// Place 1
{
  "id": "yates-residence",
  "name": "13564 Brookgreen, Dallas TX",
  "place_type": "BUILDING",
  "parent_place_id": "[Dallas UUID]"
}

// Place 2
{
  "id": "dallas-fbi-office", 
  "name": "Dallas FBI Office",
  "place_type": "BUILDING"
}
```

---

## Reference: Existing Entity UUIDs

For `parent_place_id` linking, use these established UUIDs:

| Place | UUID |
|-------|------|
| Dallas | `2e3f4a5b-6c7d-48e9-f0a1-b2c3d4e5f6a7` |
| Irving | `4b5c6d7e-8f9a-40b1-c2d3-e4f5a6b7c8d9` |
| Dealey Plaza | `7c8d9e0f-1a2b-43c4-d5e6-f7a8b9c0d1e2` |
| TSBD | `a1b2c3d4-e5f6-4778-a9b0-c1d2e3f4a5b6` |
| New Orleans | `9f0a1b2c-3d4e-45f6-a7b8-c9d0e1f2a3b4` |

For `parent_event_id` linking (Yates incident sub-events):

| Event | UUID |
|-------|------|
| Yates Hitchhiker (main) | `1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d` |

---

## Next Steps

1. **Process remaining raw materials** using this workflow
2. **Build merge tool** to incorporate `_entities.json` into main data files
3. **Develop LLM prompt template** for semi-automated extraction
4. **Create validation script** to check JSON against schema
