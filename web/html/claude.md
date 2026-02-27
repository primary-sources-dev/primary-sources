# YATES EVENTS - Entity Extraction Workflow

## OBJECTIVE
Continue reviewing and expanding the Yates events dataset through iterative review, using OCR extraction, classification, and schema validation to add missing events and improve entity quality.

---

## FILE REFERENCES

1. **Source Document**
   - `assets/documents/yates-searchable.pdf`

2. **Entity Data (Current State)**
   - `C:\Users\willh\Desktop\primary-sources\raw-material\yates\yates_entities.json`
   - Status: 7 events COMPLETE, 20 people, 7 orgs, 13 places, 5 objects

3. **Schema & Vocabulary**
   - `assets/data/events.json` (event schema)
   - `assets/data/people.json` (people vocabulary)
   - `assets/data/organizations.json` (org vocabulary)
   - `assets/data/places.json` (place vocabulary)
   - `assets/data/objects.json` (object vocabulary)
   - `assets/data/sources.json` (source vocabulary)

4. **Tools**
   - OCR: `tools/ocr/ocr-ui.html`
   - Classifier: `tools/classifier/classifier-ui.html`
   - Analyzer: `tools/analyzer/analyzer-details.html`

5. **Output Targets**
   - `entities/event/event-{id}.html`
   - `entities/event/event-index.html`

---

## CRITICAL: EVENT STRUCTURE REQUIREMENTS

### Parent Event with Nested Sub-Events
**ALL Yates-related events MUST be nested under the parent event:**

```json
{
  "id": "yates-incident",
  "event_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "title": "The Ralph Leon Yates Incident",
  "event_type": "SIGHTING",
  "sub_events": [
    {
      "event_id": "unique-uuid-here",
      "parent_event_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "title": "Sub-Event Title",
      ...
    }
  ],
  "participants": [...],
  "evidence": [...],
  "sources": [...],
  "locations": [...],
  "related_events": [...],
  "assertions": [...]
}
```

### ⚠️ NEVER CREATE FLAT EVENT STRUCTURES
- Events must NOT be at root level of events array
- Each sub-event MUST have `parent_event_id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"`
- All sub-events MUST be nested inside parent's `sub_events` array
- See `assets/data/events.json` for correct structure

---

## WORKFLOW (Ordered List)

### 1. Review Current Events
   1. Open `assets/data/events.json`
   2. Locate parent event: "The Ralph Leon Yates Incident" (id: "yates-incident")
   3. Review existing sub-events in `sub_events` array (currently 12 events)
   4. Identify gaps in timeline (Nov 20-Jan 15, 1964)
   5. Note missing interviews, reports, meetings
   6. Reference `yates_entities.json` for additional entity details

### 2. OCR Extraction
   1. Launch `tools/ocr/ocr-ui.html`
   2. Load `assets/documents/yates-searchable.pdf`
   3. Extract text from unprocessed pages
   4. Focus: dates, agent names, interview summaries, locations

### 3. Classification Review
   1. Launch `tools/classifier/classifier-ui.html?file=yates-searchable.pdf`
   2. Review 4-tier classification (agency, class, format, content)
   3. Flag pages with event-relevant content:
      - FBI 302 interviews
      - Memos
      - Testimony
      - Reports
   4. Export classified pages

### 4. Entity Extraction Loop
   1. Read classified page text
   2. Identify event data:
      - `event_type` (INTERVIEW, REPORT_WRITTEN, TRANSFER, etc.)
      - `event_level` (PRIMARY, SECONDARY)
      - `title` (brief description)
      - `description` (detailed narrative)
      - `start_ts` / `end_ts` (ISO 8601 format)
      - `time_precision` (UNKNOWN, APPROX, EXACT, RANGE)
      - `parent_event_id` (if sub-event)
   3. Draft sub-event JSON following schema:
      ```json
      {
        "id": "event-slug",
        "event_id": "unique-uuid-here",
        "parent_event_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "event_type": "INTERVIEW",
        "event_level": "SECONDARY",
        "icon": "assignment_ind",
        "label": "Nov 27, 1963 · Dallas, TX",
        "title": "Event Title",
        "description": "Full description...",
        "start_ts": "1963-11-27T00:00:00Z",
        "time_precision": "EXACT",
        "status": "COMPLETE"
      }
      ```
      **NOTE:** This will be added to parent's `sub_events` array, NOT root level
   4. Cross-reference participants against `people` array
   5. Cross-reference locations against `places` array
   6. Cross-reference objects against `objects` array

### 5. Schema Validation
   1. **VERIFY NESTED STRUCTURE**:
      - Sub-event MUST be inside parent's `sub_events` array
      - Sub-event MUST have `parent_event_id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"`
      - NEVER place events at root level of events.json
   2. Check required fields present:
      - `event_id`, `parent_event_id`, `event_type`, `event_level`, `event_hierarchy`, `title`, `description`, `start_ts`, `time_precision`
      - Optional: `id`, `status`, `icon`, `label`, `url`
   3. Verify `event_type` in controlled vocabulary:
      - PRIMARY: SIGHTING, SHOT, TRANSFER, PHONE_CALL, EMPLOYMENT
      - SECONDARY: INTERVIEW, REPORT_WRITTEN, MEETING, PHONE_CALL
   4. Verify `event_level` in controlled vocabulary:
      - PRIMARY: What actually happened
      - SECONDARY: Documentation about primary events
   5. Verify `event_hierarchy` in controlled vocabulary:
      - CATEGORY_1: Main Political Violence Events (Walker, JFK, Tippit, Oswald)
      - CATEGORY_2: Direct Investigations and Witness Events
      - CATEGORY_3: Documentation, Reports, and Interviews
   6. Validate timestamp format (ISO 8601)
   7. Confirm `time_precision` logic:
      - UNKNOWN: both timestamps NULL
      - APPROX: start_ts NOT NULL, end_ts NULL
      - EXACT: start_ts NOT NULL, end_ts NULL or equal
      - RANGE: both NOT NULL
   8. Check `icon` uses Material Symbols
   9. Verify `parent_event_id` matches parent event's `event_id`

### 6. Vocabulary Compliance
   1. Verify all referenced `person_id` exists in `people` array
   2. Verify all referenced `place_id` exists in `places` array
   3. Verify all referenced `object_id` exists in `objects` array
   4. Flag new entities needed (person, place, object)
   5. Create stub entries for missing entities

### 7. Quality Review
   1. Check event completeness:
      - Does description answer who/what/when/where/why?
      - Are key details from source included?
      - Is relationship to parent event clear?
   2. Cross-reference with existing events:
      - Timeline consistency
      - No duplicate events
      - Proper parent-child relationships
   3. Source attribution:
      - Can event be traced to specific document?
      - Page number/section noted?

### 8. Agent Feedback Loop
   1. Agent reviews extraction
   2. Flags issues:
      - Missing required fields
      - Vocabulary gaps
      - Timeline conflicts
      - Unclear relationships
   3. Agent proposes corrections
   4. Human reviews and approves
   5. Iterate until quality threshold met

### 9. Save & Update
   1. **Add new sub-event to parent's `sub_events` array**:
      - Open `assets/data/events.json`
      - Locate parent event (id: "yates-incident", event_id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")
      - Add new event object to `sub_events` array
      - Ensure `parent_event_id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"` is set
   2. Update summary counts if needed
   3. Create HTML entity page: `entities/event/event-{id}.html`
   4. Update `entities/event/event-index.html` with new entry
   5. Document extraction notes/decisions

### 10. Iterate
   1. Move to next unprocessed page
   2. Repeat steps 4-9
   3. Track progress (pages reviewed vs. total)
   4. Continue until all relevant pages processed

---

## EXPECTED STANDARDS

### Event Quality Criteria
- **Completeness**: All required fields populated
- **Accuracy**: Dates/times verified against source document
- **Clarity**: Description is self-contained (understandable without context)
- **Traceability**: Can be linked back to specific source page
- **Consistency**: Follows established schema patterns

### Minimum Sub-Event Data
```json
{
  "event_id": "required-unique-uuid",
  "parent_event_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "event_type": "required-from-vocab",
  "event_level": "PRIMARY|SECONDARY",
  "title": "required-concise-title",
  "description": "required-detailed-narrative",
  "start_ts": "required-if-known",
  "time_precision": "required",
  "id": "optional-slug",
  "icon": "optional-material-symbol",
  "label": "optional-short-summary",
  "status": "optional-COMPLETE|PARTIAL|PENDING",
  "url": "optional-source-link"
}
```

**CRITICAL:** This sub-event object must be placed inside the parent event's `sub_events` array in `assets/data/events.json`, not at root level.

### Known Gaps (Prioritize)
Based on CLAUDE.md context, missing events likely include:
- FBI reports/memos between interviews
- Warren Commission references to Yates
- HSCA investigation mentions
- Hospital admission details (Jan 15, 1964)
- Medical records/treatment events
- Follow-up investigations

---

## AGENT INSTRUCTIONS

**DO:**
- Read entire yates-searchable.pdf page-by-page
- Extract every event with temporal anchor (date/time)
- Create new entities (people, places, objects) as needed
- Use OCR tool for text extraction
- Use classifier for page categorization
- Validate against schema before saving
- Document reasoning for ambiguous decisions

**DO NOT:**
- **Create flat event structures** (CRITICAL: all events MUST be nested in parent's sub_events array)
- Place Yates sub-events at root level of events.json
- Skip pages without obvious event markers
- Assume event details not in source
- Merge distinct events into single entry
- Create events without temporal information
- Bypass schema validation
- Ignore vocabulary compliance
- Create events without `parent_event_id` reference

**FOCUS:**
- Events involving Ralph Yates directly
- FBI investigation timeline
- Witness interviews/statements
- Official reports/memos
- Timeline conflicts/discrepancies

---

## SUCCESS METRICS

- All pages of yates-searchable.pdf reviewed
- Every event with date/time extracted
- 100% schema compliance
- 100% vocabulary compliance
- Zero duplicate events
- Complete parent-child relationships documented
- Entity page generated for each event
- event-index.html updated

---

## SYSTEM ALIGNMENT COMPLETED ✅

### JavaScript Code Update

**File:** `assets/js/db-logic.js` (Lines 148-151)

**Previous Code (INCORRECT):**
```javascript
const children = events
    .filter(e => e.parent_event_id === event.event_id)
    .sort((a, b) => (a.start_ts || '').localeCompare(b.start_ts || ''));
```

**Updated Code (CORRECT):**
```javascript
// Read sub-events from nested array structure
const children = event.sub_events || [];
children.sort((a, b) => (a.start_ts || '').localeCompare(b.start_ts || ''));
```

**Status:** ✅ COMPLETED (2026-02-26)
**Change:** Updated db-logic.js to read from `event.sub_events` array instead of filtering all events by `parent_event_id`.

---

**STATUS:** Active MVP - Continue Yates Events Review
**LAST UPDATED:** 2026-02-26
**ID CHANGE:** yates-hitchhiker → yates-incident (completed 2026-02-26)
