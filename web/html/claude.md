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

## WORKFLOW (Ordered List)

### 1. Review Current Events
   1. Open `yates_entities.json`
   2. Review 7 existing events for completeness
   3. Identify gaps in timeline (Nov 20-Jan 15, 1964)
   4. Note missing interviews, reports, meetings

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
      - `title` (brief description)
      - `description` (detailed narrative)
      - `start_ts` / `end_ts` (ISO 8601 format)
      - `time_precision` (UNKNOWN, APPROX, EXACT, RANGE)
      - `parent_event_id` (if sub-event)
   3. Draft event JSON following schema:
      ```json
      {
        "id": "event-slug",
        "event_id": "uuid",
        "event_type": "INTERVIEW",
        "icon": "assignment_ind",
        "label": "Nov 27, 1963 · Dallas, TX",
        "title": "Event Title",
        "description": "Full description...",
        "start_ts": "1963-11-27T00:00:00Z",
        "time_precision": "EXACT",
        "status": "COMPLETE"
      }
      ```
   4. Cross-reference participants against `people` array
   5. Cross-reference locations against `places` array
   6. Cross-reference objects against `objects` array

### 5. Schema Validation
   1. Check required fields present:
      - `id`, `event_id`, `event_type`, `title`, `description`, `start_ts`, `time_precision`, `status`
   2. Verify `event_type` in controlled vocabulary:
      - INTERVIEW, REPORT_WRITTEN, TRANSFER, SHOT, SIGHTING, MEETING, etc.
   3. Validate timestamp format (ISO 8601)
   4. Confirm `time_precision` logic:
      - UNKNOWN: both timestamps NULL
      - APPROX: start_ts NOT NULL, end_ts NULL
      - EXACT: start_ts NOT NULL, end_ts NULL or equal
      - RANGE: both NOT NULL
   5. Check `icon` uses Material Symbols

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
   1. Add new event to `events` array in `yates_entities.json`
   2. Update `summary.total_events`
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

### Minimum Event Data
```json
{
  "id": "required",
  "event_id": "required-uuid",
  "event_type": "required-from-vocab",
  "icon": "required-material-symbol",
  "label": "required-short-summary",
  "title": "required-concise-title",
  "description": "required-detailed-narrative",
  "start_ts": "required-if-known",
  "time_precision": "required",
  "status": "COMPLETE|PARTIAL|PENDING"
}
```

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
- Skip pages without obvious event markers
- Assume event details not in source
- Merge distinct events into single entry
- Create events without temporal information
- Bypass schema validation
- Ignore vocabulary compliance

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

**STATUS:** Active MVP - Continue Yates Events Review
**LAST UPDATED:** 2026-02-26
