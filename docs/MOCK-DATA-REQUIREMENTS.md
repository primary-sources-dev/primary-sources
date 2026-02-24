# Mock Data Requirements for Template Testing

**Project:** Primary Sources - Entity Profile Templates
**Date:** 2026-02-24
**Status:** 🔴 BLOCKING - Templates cannot be fully tested without these additions

---

## Executive Summary

We have 4 new entity profile templates (Organization, Place, Object, Source) with **component card systems** that dynamically show/hide sections based on available data. Currently, our mock data has **gaps** that prevent us from testing certain cards, which means we cannot verify the UI works correctly before going live.

**What's at stake:**
- 🚨 **2 cards cannot be tested at all** (Organization Locations, Source Places)
- ⚠️ **3 templates have sparse data** (limits variety testing)
- ✅ **If we fix these gaps:** All templates will be 100% testable

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

#### 6. Add Dealey Plaza as 3rd Place

**Why:** Completes the hierarchical chain (Dallas → Dealey Plaza → TSBD) for testing parent/child relationships

#### 7. Add CIA as 4th Organization

**Why:** Another major investigative organization for variety testing

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
- [ ] Warren Commission has `locations` field with 2+ entries
- [ ] Warren Report has `places` field with 3+ entries
- [ ] FBI organization has enhanced data (identifiers, sources, related_orgs)
- [ ] CE 399 object entry exists with 4+ custody chain entries
- [ ] HSCA Report source entry exists with `places` field
- [ ] All JSON files validate without syntax errors
- [ ] All test URLs load without errors
- [ ] All new cards render and expand correctly

### Quality Checks (Should Have)
- [ ] Data is historically accurate (use Warren Report as reference)
- [ ] IDs follow UUID format (lowercase hex with dashes)
- [ ] Dates follow ISO format (YYYY-MM-DD)
- [ ] Citations are properly formatted (Chicago, APA, MLA)

---

## Timeline Estimate

**Critical Tasks (1-2 hours):**
- Add `locations` to Warren Commission: 15 min
- Add `places` to Warren Report: 15 min
- Enhance FBI entry: 20 min
- Add CE 399 object: 30 min
- Add HSCA Report source: 30 min
- Testing and validation: 30 min

**Total:** ~2.5 hours for complete coverage

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

---

**Last Updated:** 2026-02-24
**Maintained By:** Development Team
**Status:** 🔴 Blocking - Priority Fix Required
