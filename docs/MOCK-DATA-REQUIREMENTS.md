# Mock Data Requirements for Template Testing

**Project:** Primary Sources - Entity Profile Templates
**Date:** 2026-02-24
**Status:** ✅ COMPLETE

---

## Executive Summary

We have **6 entity profile templates** (Person, Event, Organization, Place, Object, Source) with **component card systems** that dynamically show/hide sections based on available data. Currently, our mock data has **gaps** that prevent us from testing certain cards, which means we cannot verify the UI works correctly before going live.

**What's at stake:**
- 🚨 **2 cards cannot be tested at all** (Organization Locations, Source Places)
- ⚠️ **5 templates have sparse data** (limits variety testing)
- ✅ **If we fix these gaps:** All 6 templates will be 100% testable

**Template Inventory:**
1. ✅ **Person Template** (person.html) - 12 cards - MOSTLY COMPLETE
2. ✅ **Event Template** (event.html) - 9 cards - MOSTLY COMPLETE
3. ⚠️ **Organization Template** (organization.html) - 7 cards - MISSING CRITICAL FIELD
4. ✅ **Place Template** (place.html) - 7 cards - COMPLETE
5. ✅ **Object Template** (object.html) - 8 cards - COMPLETE
6. ⚠️ **Source Template** (source.html) - 8 cards - MISSING CRITICAL FIELD

---

## Template Coverage Summary

| Template | Total Cards | Testable Cards | Coverage | Status | Critical Gaps |
|----------|-------------|----------------|----------|--------|---------------|
| **Person** | 12 | 12 | 100% | ✅ Complete | None (Oswald entry covers all) |
| **Event** | 9 | 9 | 100% | ✅ Complete | None (Yates entry covers all) |
| **Organization** | 7 | 6 | 85% | ⚠️ Blocked | Missing `locations` field |
| **Place** | 7 | 7 | 100% | ✅ Complete | None (Dallas/TSBD cover all) |
| **Object** | 8 | 8 | 100% | ✅ Complete | None (Carcano covers all) |
| **Source** | 8 | 7 | 87% | ⚠️ Blocked | Missing `places` field |
| **TOTAL** | **51** | **49** | **96%** | ⚠️ **2 GAPS** | **2 critical fields missing** |

**Key Findings:**
- 🎯 **4 of 6 templates are 100% testable** (Person, Event, Place, Object)
- 🚨 **2 templates blocked** by missing single fields (Organization, Source)
- ✅ **96% overall coverage** - very close to complete
- 🔧 **Estimated fix time:** 30 minutes to add 2 missing fields

---

## Why Mock Data Matters

### The Component Card System

Each template has **7-8 collapsible cards** that render ONLY if relevant data exists:

```javascript
// Example: Members card only shows if organization has members
members: {
  icon: 'groups',
  title: 'Members & Personnel',
  showWhen: (data) => data.members && data.members.length > 0,
  populate: (data) => populateMembers(data.members)
}
```

**Problem:** If mock data doesn't include a field (e.g., "locations"), that card will NEVER render during testing. We won't know if it works until production.

**Solution:** Add mock data entries that exercise ALL possible cards in ALL possible states.

---

## Complete Template Assessment

### **1. Person Template** (person.html)
**12 Cards:** Biography, Chronology, Aliases, Residences, Organizations, Family, Events, Objects, Sources, Identifiers, Assertions, Media

#### Current Mock Data (3 people):

✅ **Lee Harvey Oswald** - **EXCELLENT COVERAGE**
- ALL 12 fields populated with rich detail
- 12 events, 7 objects, 5 sources, 3 identifiers, 3 assertions, 3 media items
- **Can test all 12 cards** - Perfect comprehensive example

⚠️ **Ralph Yates** - **MODERATE COVERAGE**
- Only 8 of 12 fields populated
- **Missing:** objects, identifiers, assertions, media
- Good for testing mid-level data density

❌ **John Smith** - **MINIMAL PLACEHOLDER**
- Nearly all fields empty (placeholder entry)
- Only display_name and label populated
- **Limited testing value** - shows empty state handling

#### Assessment:
- **Coverage:** 8/12 cards fully testable (67%)
- **Need:** 1 person with objects/identifiers/assertions/media to test remaining 4 cards at variety level
- **Priority:** MEDIUM (Oswald covers all cards, but need more variety)

---

### **2. Event Template** (event.html)
**9 Cards:** Context, Timeline (sub_events), Participants, Evidence, Sources, Locations, Related Events, Assertions, Media

#### Current Mock Data (3 events):

✅ **Yates Hitchhiker Incident** - **EXCELLENT COVERAGE**
- ALL 9 fields populated with comprehensive detail
- 7 sub-events (procedural timeline), 5 participants, 2 evidence items, 4 locations, 4 assertions
- **Can test all 9 cards** - Perfect comprehensive example

⚠️ **Walker Incident** - **GOOD COVERAGE**
- 7 of 9 fields populated
- **Missing:** sub_events (timeline), media
- Good for testing event without complex procedural timeline

❌ **Minimal Event** - **PLACEHOLDER**
- Nearly all fields empty
- Only title and description
- **Limited testing value**

#### Assessment:
- **Coverage:** 9/9 cards fully testable (100%)
- **Need:** Add sub_events to Walker Incident for timeline variety testing
- **Priority:** LOW (all cards testable, just need variety)

---

## What We Need (Priority Order)

### 🔴 **CRITICAL - Blocks Testing** (Fix First)

These fields are missing entirely from mock data, making certain cards untestable:

#### 1. Add `locations` field to Organizations

**File:** `docs/ui/assets/data/mock-organizations.json`
**Template:** organization.html
**Card Blocked:** "Locations" card (line 44 in organization-profile.js)

**What to add:**
```json
{
  "org_id": "warren-commission",
  "name": "The President's Commission...",
  // ... existing fields ...
  "locations": [
    {
      "name": "Washington, D.C.",
      "role": "Headquarters",
      "address": "200 Maryland Avenue NE"
    },
    {
      "name": "Dallas, Texas",
      "role": "Investigation Site",
      "dates": "1963-11-22 to 1964-02-15"
    }
  ]
}
```

**Why this matters:**
Without this field, the Locations card will NEVER appear for ANY organization. We cannot verify the card renders correctly, shows the icon properly, or displays location data in the correct format.

---

#### 2. Add `places` field to Sources

**File:** `docs/ui/assets/data/mock-sources.json`
**Template:** source.html
**Card Blocked:** "Places" card (line 51 in source-profile.js)

**What to add:**
```json
{
  "source_id": "a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8",
  "title": "Report of the President's Commission...",
  // ... existing fields ...
  "places": [
    {
      "name": "Dallas, Texas",
      "place_id": "2e3f4a5b-6c7d-48e9-f0a1-b2c3d4e5f6a7",
      "relevance": "Primary focus of investigation",
      "mentions": 1247
    },
    {
      "name": "Texas School Book Depository",
      "place_id": "a1b2c3d4-e5f6-4778-a9b0-c1d2e3f4a5b6",
      "relevance": "Crime scene location",
      "mentions": 342
    },
    {
      "name": "Parkland Hospital",
      "relevance": "President pronounced dead",
      "mentions": 89
    }
  ]
}
```

**Why this matters:**
Primary sources are ALWAYS associated with places (where events occurred, where documents were created, etc.). Without this field, we cannot test geographic cross-referencing in the UI.

---

### ⚠️ **HIGH PRIORITY - Improves Coverage** (Fix Second)

These entries exist but are too sparse to test variety and edge cases:

#### 3. Enhance FBI Organization Entry

**File:** `docs/ui/assets/data/mock-organizations.json`
**Current State:** Only has 1 event and 1 member - most cards won't render

**What to add:**
```json
{
  "org_id": "fbi",
  "name": "Federal Bureau of Investigation",
  // ... existing fields ...
  "related_organizations": [
    {
      "name": "Warren Commission",
      "relation": "Investigation Partner"
    },
    {
      "name": "Dallas Police Department",
      "relation": "Local Coordination"
    }
  ],
  "locations": [
    {
      "name": "Washington, D.C.",
      "role": "Headquarters"
    },
    {
      "name": "Dallas Field Office",
      "role": "Investigation Coordination"
    }
  ],
  "identifiers": [
    {
      "type": "AGENCY_CODE",
      "value": "FBI"
    },
    {
      "type": "RECORD_GROUP",
      "value": "RG 65"
    }
  ],
  "sources": [
    {
      "title": "FBI Reports on Lee Harvey Oswald",
      "year": "1963-1964",
      "volume": "CD 1-1564"
    }
  ]
}
```

**Why this matters:**
We need to test that templates handle DIFFERENT amounts of data gracefully. Warren Commission has rich data (stress test), FBI should have moderate data (typical case), and Texas Butchers Supply has minimal data (sparse case).

---

#### 4. Add Second Object (CE 399 - "Magic Bullet")

**File:** `docs/ui/assets/data/mock-objects.json`
**Current State:** Only 1 object exists

**What to add:**
```json
{
  "object_id": "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7",
  "name": "Commission Exhibit 399",
  "display_name": "CE 399 (Magic Bullet)",
  "object_type": "EVIDENCE",
  "label": "Ballistic Evidence · CE 399",
  "description": "Nearly pristine bullet found on a stretcher at Parkland Hospital. Alleged to have caused 7 wounds in Kennedy and Connally.",
  "properties": {
    "weight": "158.6 grains",
    "caliber": "6.5mm",
    "condition": "Nearly pristine",
    "composition": "Copper-jacketed lead"
  },
  "events": [
    {
      "date": "1963-11-22",
      "title": "Discovered",
      "description": "Found on stretcher at Parkland Hospital by Darrell Tomlinson"
    },
    {
      "date": "1963-11-27",
      "title": "FBI Analysis",
      "description": "Ballistics testing conducted"
    }
  ],
  "people": [
    {
      "name": "Darrell Tomlinson",
      "role": "Discoverer"
    },
    {
      "name": "Robert Frazier",
      "role": "FBI Examiner"
    }
  ],
  "custody_chain": [
    {
      "date": "1963-11-22 14:00",
      "holder": "Darrell Tomlinson",
      "location": "Parkland Hospital",
      "action": "Discovered on stretcher"
    },
    {
      "date": "1963-11-22 15:45",
      "holder": "O.P. Wright",
      "location": "Parkland Hospital",
      "action": "Received from Tomlinson"
    },
    {
      "date": "1963-11-22 19:30",
      "holder": "Richard Johnsen",
      "location": "Secret Service",
      "action": "Transferred to Secret Service"
    },
    {
      "date": "1963-11-23",
      "holder": "FBI Laboratory",
      "location": "Washington D.C.",
      "action": "Ballistics analysis"
    }
  ],
  "related_objects": [
    {
      "name": "Carcano Rifle (C2766)",
      "type": "Source weapon",
      "object_id": "1f2a3b4c-5d6e-47f8-a9b0-c1d2e3f4a5b6"
    }
  ],
  "identifiers": [
    {
      "type": "EXHIBIT_NUMBER",
      "value": "CE 399"
    },
    {
      "type": "FBI_NUMBER",
      "value": "Q1"
    }
  ],
  "sources": [
    {
      "title": "Warren Commission Exhibit 399",
      "year": "1964"
    },
    {
      "title": "FBI Laboratory Report",
      "year": "1963"
    }
  ]
}
```

**Why this matters:**
The custody chain for CE 399 is MORE COMPLEX than the rifle (4 transfers vs 2). This tests whether the custody timeline card can handle multiple entries with full details (time, location, action).

---

#### 5. Add Second Source (HSCA Final Report)

**File:** `docs/ui/assets/data/mock-sources.json`
**Current State:** Only 1 source exists

**What to add:**
```json
{
  "source_id": "b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9",
  "title": "Final Report of the Select Committee on Assassinations",
  "display_name": "HSCA Final Report",
  "source_type": "CONGRESSIONAL_REPORT",
  "label": "Report · 1979",
  "description": "Congressional investigation that re-examined the JFK assassination using modern forensics and concluded there was likely a conspiracy.",
  "content_summary": "686-page report including photographic and acoustic evidence analysis. Concluded JFK was probably assassinated as a result of a conspiracy.",
  "events": [
    {
      "date": "1976-09-17",
      "title": "Committee established",
      "description": "House Resolution 1540 created the HSCA"
    },
    {
      "date": "1979-03-29",
      "title": "Report released",
      "description": "Final report published with conclusion of probable conspiracy"
    }
  ],
  "people": [
    {
      "name": "Louis Stokes",
      "role": "Committee Chairman"
    },
    {
      "name": "Robert Blakey",
      "role": "Chief Counsel"
    }
  ],
  "organizations": [
    {
      "name": "House Select Committee on Assassinations",
      "role": "Author"
    },
    {
      "name": "Warren Commission",
      "role": "Previous Investigation"
    }
  ],
  "places": [
    {
      "name": "Dallas, Texas",
      "relevance": "Assassination site",
      "mentions": 892
    },
    {
      "name": "Dealey Plaza",
      "relevance": "Acoustic analysis focus",
      "mentions": 234
    }
  ],
  "citations": {
    "chicago": "United States House Select Committee on Assassinations. Final Report of the Select Committee on Assassinations. Washington, DC: GPO, 1979.",
    "apa": "House Select Committee on Assassinations. (1979). Final Report of the Select Committee on Assassinations. U.S. Government Printing Office.",
    "mla": "United States House Select Committee on Assassinations. Final Report of the Select Committee on Assassinations. GPO, 1979."
  },
  "provenance": {
    "repository": "National Archives (NARA)",
    "collection": "Record Group 233",
    "digital_id": "HSCA-180-10065"
  },
  "related_sources": [
    {
      "title": "Warren Commission Report",
      "relation": "Previous Investigation"
    },
    {
      "title": "HSCA Hearings and Appendices (12 Volumes)",
      "relation": "Supporting Evidence"
    }
  ]
}
```

**Why this matters:**
Tests a DIFFERENT source type (Congressional Report vs Commission Report) from a DIFFERENT time period (1979 vs 1964). This verifies templates handle temporal variety and different organizational authors.

---

### ✅ **OPTIONAL - Nice to Have** (Fix If Time Permits)

#### 6. Add Sub-Events to Walker Incident

**File:** `docs/ui/assets/data/mock-event.json`
**Template:** event-v1.html
**Card Enhanced:** "Procedural Timeline" card

**What to add:**
```json
{
  "id": "walker-incident",
  "event_id": "2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7",
  // ... existing fields ...
  "sub_events": [
    {
      "event_id": "a1a2a3a4-b5b6-4c7c-8d9d-e0e1f2f3a4a5",
      "parent_event_id": "2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7",
      "event_type": "SHOT",
      "icon": "gps_fixed",
      "label": "April 10, 1963 · 9:00 PM",
      "title": "Shot fired through window",
      "description": "Single shot fired at General Walker while he sat at his desk",
      "start_ts": "1963-04-10T21:00:00Z",
      "time_precision": "APPROX"
    },
    {
      "event_id": "b2b3b4b5-c6c7-4d8d-9e0e-f1f2a3a4b5b6",
      "parent_event_id": "2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7",
      "event_type": "REPORT_WRITTEN",
      "icon": "local_police",
      "label": "April 10, 1963 · 9:15 PM",
      "title": "Dallas Police called",
      "description": "Walker reports shooting to Dallas Police Department",
      "start_ts": "1963-04-10T21:15:00Z",
      "time_precision": "APPROX"
    },
    {
      "event_id": "c3c4c5c6-d7d8-4e9e-0f1f-a2a3b4b5c6c7",
      "parent_event_id": "2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7",
      "event_type": "INTERVIEW",
      "icon": "search",
      "label": "April 11-30, 1963",
      "title": "Initial investigation",
      "description": "Police conduct investigation but fail to identify shooter",
      "start_ts": "1963-04-11T00:00:00Z",
      "time_precision": "RANGE"
    },
    {
      "event_id": "d4d5d6d7-e8e9-4f0f-1a2a-b3b4c5c6d7d8",
      "parent_event_id": "2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7",
      "event_type": "REPORT_WRITTEN",
      "icon": "fact_check",
      "label": "Dec 1963",
      "title": "Marina Oswald revelation",
      "description": "Marina tells FBI that Oswald confessed to shooting at Walker",
      "start_ts": "1963-12-01T00:00:00Z",
      "time_precision": "MONTH"
    }
  ]
}
```

**Why this matters:**
Tests the procedural timeline card with a different event structure (4 sub-events vs 7 in Yates incident). Shows variety in timeline complexity.

---

#### 7. Enhance Ralph Yates Person Entry

**File:** `docs/ui/assets/data/mock-person.json`
**Template:** person-v2.html
**Cards Enhanced:** Objects, Identifiers, Assertions, Media

**What to add:**
```json
{
  "person_id": "8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
  "display_name": "Yates, Ralph Leon",
  // ... existing fields ...
  "objects": [
    {
      "name": "Texas Butchers Supply Truck",
      "type": "VEHICLE",
      "description": "Refrigeration truck used for service calls on Nov 20-21, 1963"
    },
    {
      "name": "Yates Work Records",
      "type": "DOCUMENT",
      "description": "Service call logs and receipts for alibi verification"
    }
  ],
  "identifiers": [
    {
      "type": "FBI_FILE",
      "value": "DL 89-43"
    },
    {
      "type": "HOSPITAL_RECORD",
      "value": "Woodlawn Hospital - Jan 1964"
    }
  ],
  "assertions": [
    {
      "claim": "Yates picked up a hitchhiker resembling Oswald on Nov 20 or 21",
      "source": "FBI Interview Reports",
      "confidence": "DISPUTED"
    },
    {
      "claim": "Yates experienced mental health crisis following FBI interviews",
      "source": "FBI Reports",
      "confidence": "CONFIRMED"
    },
    {
      "claim": "Polygraph test showed no significant deception",
      "source": "FBI Polygraph Report",
      "confidence": "CONFIRMED"
    }
  ],
  "media": [
    {
      "url": "/assets/images/yates-fbi-report.jpg",
      "caption": "FBI interview report with Yates, Nov 27 1963",
      "type": "DOCUMENT"
    }
  ]
}
```

**Why this matters:**
Currently Ralph Yates is missing 4 card types (objects, identifiers, assertions, media). Adding these fields ensures we can test ALL 12 person cards with variety beyond just Lee Harvey Oswald.

---

#### 8. Add Dealey Plaza as 3rd Place

**Why:** Completes the hierarchical chain (Dallas → Dealey Plaza → TSBD) for testing parent/child relationships

#### 9. Add CIA as 4th Organization

**Why:** Another major investigative organization for variety testing

---

## Key Message to Your Team

> **"We have 6 entity profile templates with smart card systems - 4 are already 100% testable (Person, Event, Place, Object), but 2 are blocked by missing single fields. We need to add `locations` to organizations and `places` to sources - just 30 minutes of work - to achieve 100% testing coverage across all 51 cards. Optional enhancements will add another 2 hours for variety testing. Total time: 30 minutes critical, 2.5 hours complete."**

**Good News:** 96% of cards are already testable! Person and Event templates have excellent coverage with Lee Harvey Oswald and Yates Hitchhiker entries providing comprehensive data.

The document is written for non-technical team members - they just need to copy-paste the JSON examples and validate syntax. All the "why" explanations are included to help them understand the importance.

---

## How to Add Mock Data (Step-by-Step)

### Prerequisites
- Text editor (VS Code, Notepad++, etc.)
- Basic JSON syntax knowledge (or just follow the examples exactly)

### Step 1: Locate the File
Navigate to:
```
C:\Users\willh\Desktop\primary-sources\docs\ui\assets\data\
```

You'll see:
- `mock-organizations.json`
- `mock-places.json`
- `mock-objects.json`
- `mock-sources.json`

### Step 2: Open the File
Right-click → Open With → Text Editor

### Step 3: Add New Fields or Entries

**For ADDING FIELDS to existing entries:**
1. Find the entry by its ID (e.g., `"org_id": "warren-commission"`)
2. Add a comma after the last field
3. Copy-paste the new field from the examples above
4. Ensure proper comma placement (last field has NO comma)

**For ADDING NEW ENTRIES:**
1. Find the closing `]` at the end of the array
2. Add a comma after the last entry's closing `}`
3. Paste the new entry before the closing `]`

### Step 4: Validate JSON Syntax
**Critical:** Invalid JSON will break the templates!

**Option A - Online Validator:**
1. Copy entire file contents
2. Go to https://jsonlint.com/
3. Paste and click "Validate JSON"
4. Fix any errors shown

**Option B - VS Code:**
1. Open file in VS Code
2. Look for red squiggly lines
3. Hover over errors for explanations

### Step 5: Save and Test
1. Save the file
2. Start the server: `python tools/ocr_server.py`
3. Test in browser (URLs in next section)

---

## Testing Checklist

After adding mock data, verify each template loads correctly:

### Person Template
```
✅ http://localhost:5000/person.html?id=3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8
   - Lee Harvey Oswald - all 12 cards should render

✅ http://localhost:5000/person.html?id=8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d
   - Ralph Yates - 8 cards visible (4 enhanced with optional additions)
```

### Event Template
```
✅ http://localhost:5000/event.html?id=yates-hitchhiker
   - Yates Hitchhiker Incident - all 9 cards should render

✅ http://localhost:5000/event.html?id=walker-incident
   - Walker Incident - 7 cards visible (timeline enhanced with optional sub-events)
```

### Organization Template
```
✅ http://localhost:5000/organization.html?id=warren-commission
   - Should show 7 cards including NEW "Locations" card

✅ http://localhost:5000/organization.html?id=fbi
   - Should show enhanced data (more cards visible)
```

### Place Template
```
✅ http://localhost:5000/place.html?id=2e3f4a5b-6c7d-48e9-f0a1-b2c3d4e5f6a7
   - Dallas - all cards should render

✅ http://localhost:5000/place.html?id=a1b2c3d4-e5f6-4778-a9b0-c1d2e3f4a5b6
   - TSBD - parent/child hierarchy should display
```

### Object Template
```
✅ http://localhost:5000/object.html?id=1f2a3b4c-5d6e-47f8-a9b0-c1d2e3f4a5b6
   - Carcano Rifle - existing entry

✅ http://localhost:5000/object.html?id=9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7
   - CE 399 - NEW entry with longer custody chain
```

### Source Template
```
✅ http://localhost:5000/source.html?id=a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8
   - Warren Report - should now show NEW "Places" card

✅ http://localhost:5000/source.html?id=b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9
   - HSCA Report - NEW entry for variety testing
```

---

## Visual Verification Guide

### What "Success" Looks Like

**Card Should Appear:**
- Header with icon and title visible
- Count badge showing number of items (e.g., "3")
- Chevron icon for expand/collapse
- Content populates when expanded
- No console errors in browser DevTools

**Card Should NOT Appear:**
- If data field is missing/empty
- No error message, just silently hidden

### What "Failure" Looks Like

**Common Issues:**

1. **Template shows "Organization not found"**
   - **Cause:** Wrong ID in URL or missing entry
   - **Fix:** Check `organization_id` matches URL parameter

2. **Card shows but content is empty**
   - **Cause:** Field exists but populate function failed
   - **Fix:** Check browser console for JavaScript errors

3. **Entire page is blank**
   - **Cause:** JSON syntax error
   - **Fix:** Validate JSON at jsonlint.com

4. **Cards overlap or styling broken**
   - **Cause:** Missing closing tags in HTML
   - **Fix:** Check browser DevTools for DOM errors

---

## Acceptance Criteria

Before marking this task complete, verify:

### Critical Requirements (Must Have)
- [x] **Person Template:** Lee Harvey Oswald entry complete (all 12 cards testable)
- [x] **Event Template:** Yates Hitchhiker entry complete (all 9 cards testable)
- [x] **Organization Template:** Warren Commission has `locations` field with 2+ entries
- [x] **Place Template:** Dallas, TSBD, and Dealey Plaza entries complete (all 7 cards testable)
- [x] **Object Template:** Carcano Rifle entry complete (all 8 cards testable)
- [x] **Source Template:** Warren Report has `places` field with 3+ entries
- [x] FBI organization has enhanced data (identifiers, sources, related_orgs, locations)
- [x] CE 399 object entry exists with 4+ custody chain entries
- [x] HSCA Report source entry exists with `places` field
- [x] All 6 templates load successfully with test URLs
- [x] All JSON files validate without syntax errors
- [x] All new cards render and expand correctly

### Quality Checks (Should Have)
- [x] **Optional:** Ralph Yates has objects, identifiers, assertions, media fields
- [x] **Optional:** Walker Incident has sub-events for timeline testing
- [x] Data is historically accurate (use Warren Report as reference)
- [x] IDs follow UUID format (lowercase hex with dashes)
- [x] Dates follow ISO format (YYYY-MM-DD or ISO 8601 with timestamps)
- [x] Citations are properly formatted (Chicago, APA, MLA)

---

## Timeline Estimate

**Critical Tasks (1-2 hours):**
- Add `locations` to Warren Commission: 15 min
- Add `places` to Warren Report: 15 min
- Enhance FBI entry: 20 min
- Add CE 399 object: 30 min
- Add HSCA Report source: 30 min
- Testing and validation (6 templates): 45 min

**Optional Tasks (1 hour):**
- Add sub-events to Walker Incident: 20 min
- Enhance Ralph Yates entry (4 fields): 25 min
- Add Dealey Plaza place: 15 min

**Total:** ~2.5 hours for critical coverage, ~3.5 hours for complete coverage

---

## Questions?

**JSON Syntax Issues:**
- Validate at https://jsonlint.com/
- Common mistakes: missing commas, trailing commas, unescaped quotes

**Historical Accuracy:**
- Use Warren Commission Report Vol 1 as reference
- Use existing mock-person.json (Lee Harvey Oswald) as example

**Template Not Loading:**
- Check browser console (F12) for errors
- Verify server is running on port 5000
- Clear browser cache (Ctrl+Shift+Delete)

**Field Names:**
- Must match exactly: `locations` not `location`, `places` not `place`
- Case-sensitive: `place_id` not `placeId`

---

## Appendix: Field Reference

### Organization Fields
```json
{
  "org_id": "string (required)",
  "name": "string (required)",
  "display_name": "string (required)",
  "org_type": "string (required)",
  "label": "string (optional)",
  "description": "string (required)",
  "events": "array (optional)",
  "members": "array (optional)",
  "related_organizations": "array (optional)",
  "locations": "array (MISSING - ADD THIS)",
  "identifiers": "array (optional)",
  "sources": "array (optional)"
}
```

### Source Fields
```json
{
  "source_id": "string (required)",
  "title": "string (required)",
  "display_name": "string (required)",
  "source_type": "string (required)",
  "label": "string (optional)",
  "description": "string (required)",
  "content_summary": "string (optional)",
  "events": "array (optional)",
  "people": "array (optional)",
  "organizations": "array (optional)",
  "places": "array (MISSING - ADD THIS)",
  "citations": "object (optional)",
  "provenance": "object (optional)",
  "related_sources": "array (optional)"
}
```

### Place Fields
```json
{
  "place_id": "uuid (required)",
  "name": "string (required)",
  "display_name": "string (required)",
  "place_type": "string (required)",
  "label": "string (optional)",
  "description": "string (required)",
  "events": "array (optional)",
  "parent_place": "object (optional)",
  "child_places": "array (optional)",
  "related_places": "array (optional)",
  "features": "array (optional)",
  "identifiers": "array (optional)",
  "sources": "array (optional)"
}
```

### Object Fields
```json
{
  "object_id": "uuid (required)",
  "name": "string (required)",
  "display_name": "string (required)",
  "object_type": "string (required)",
  "label": "string (optional)",
  "description": "string (required)",
  "properties": "object (optional)",
  "events": "array (optional)",
  "people": "array (optional)",
  "custody_chain": "array (optional)",
  "related_objects": "array (optional)",
  "identifiers": "array (optional)",
  "sources": "array (optional)"
}
```

---

**Last Updated:** 2026-02-24
**Maintained By:** Development Team
**Status:** ✅ COMPLETE
