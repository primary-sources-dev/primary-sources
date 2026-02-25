review the updates to the docs
# Place Profile Template - Quick Start Guide

**Status:** ✅ Production Ready
**Date:** 2026-02-24
**Version:** 1.0.0

---

## Overview

Universal place profile template using a **component card library** architecture. Define all possible sections once, show only sections with data.

**Works for:**
- **Cities** (Dallas, New Orleans)
- **Buildings** (Texas School Book Depository, Walker Residence)
- **Sites** (Dealey Plaza, Triple Underpass)
- **Addresses** (1026 N. Beckley Avenue)

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\docs\ui
python -m http.server 8000
```

### 2. Test URLs

```
Comprehensive Place (Dealey Plaza):
http://localhost:8000/place.html?id=dealey-plaza

Building (Texas School Book Depository):
http://localhost:8000/place.html?id=tsbd

Empty State:
http://localhost:8000/place.html?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## File Structure

```
docs/ui/
├── place.html                           # Universal place template
├── assets/
│   ├── js/
│   │   ├── place-profile.js             # Card registry + loading
│   │   ├── place-cards.js               # Card populate functions
│   │   ├── components.js                # Existing
│   │   ├── nav.js                       # Existing
│   │   └── db-logic.js                  # Existing
│   ├── data/
│   │   ├── places.json                  # Baseline Data (Canonical)
│   └── css/
│       └── main.css                     # Existing
```

---

## How It Works

### Component Card System

**7 Available Cards:**
1. Overview (auto-expands)
2. Events at This Location
3. Location Hierarchy (parent/child places)
4. Related Places
5. Notable Features
6. Identifiers
7. Primary Sources

**Conditional Rendering:**
- All 7 card sections defined in HTML
- JavaScript evaluates `showWhen()` for each card
- Only cards with data are displayed
- Empty state shows if < 2 cards visible

### Card Registry Pattern

```javascript
// place-profile.js
const CARD_REGISTRY = {
  overview: {
    icon: 'info',
    title: 'Overview',
    dataField: 'description',
    autoExpand: true,
    showWhen: (data) => data.description !== null && data.description !== '',
    populate: (data) => populateOverview(data.description)
  },
  hierarchy: {
    icon: 'account_tree',
    title: 'Location Hierarchy',
    dataField: 'hierarchy',
    autoExpand: false,
    showWhen: (data) => (data.parent_place || (data.child_places && data.child_places.length > 0)),
    populate: (data) => populateHierarchy(data)
  },
  // ... 5 more cards
};
```

---

## Data Format

### Required Fields
```json
{
  "place_id": "uuid",
  "name": "Dealey Plaza",
  "place_type": "SITE | BUILDING | CITY | ADDRESS",
  "label": "Dallas, TX"
}
```

### Optional Fields (Enable Cards)
```json
{
  "description": "Overview text",
  "coordinates": { "lat": 32.7788, "lng": -96.8083 },
  "parent_place": { "place_id": "uuid", "name": "Dallas, TX" },
  "child_places": [
    { "place_id": "uuid", "name": "Texas School Book Depository", "place_type": "BUILDING" }
  ],
  "events": [
    { "event_id": "uuid", "title": "Event", "date": "1963-11-22", "description": "..." }
  ],
  "related_places": [
    { "place_id": "uuid", "name": "Place", "relation": "ADJACENT | NEARBY" }
  ],
  "features": [
    { "name": "Grassy Knoll", "description": "Elevated area..." }
  ],
  "identifiers": [
    { "type": "ADDRESS", "value": "411 Elm Street, Dallas, TX" }
  ],
  "sources": [
    { "title": "Source", "type": "DOCUMENT", "year": "1963", "archive": "NARA" }
  ]
}
```

---

## Next.js Migration Path

### Step 1: Create API Route
```typescript
// app/api/places/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: place, error } = await supabase
    .from('place')
    .select(`
      *,
      parent:parent_place_id (place_id, name, place_type),
      children:place!parent_place_id (place_id, name, place_type),
      event_place (
        event (event_id, title, start_ts, event_type)
      ),
      entity_identifier!entity_id (id_type, id_value)
    `)
    .eq('place_id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(transformPlaceData(place));
}
```

### Step 2: Update Data Source
```javascript
// place-profile.js line 83
// Change from:
const response = await fetch('assets/data/places.json');

// To:
const response = await fetch(`/api/places/${placeId}`);
```

---

## Testing Checklist

- [ ] **Comprehensive Place** - All cards render correctly
- [ ] **Minimal Place** - Only populated cards shown
- [ ] **Empty State** - Shows message when < 2 cards
- [ ] **Overview Auto-Expand** - Opens by default when data exists
- [ ] **Card Collapse/Expand** - Click to toggle works
- [ ] **Hierarchy Display** - Parent/child places linked
- [ ] **Event Links** - Navigate to event detail pages
- [ ] **Empty Data Handling** - No errors with null/undefined

---

## Support

**Baseline Data:** `assets/data/places.json`

---

**Last Updated:** 2026-02-24
**Version:** 1.0.0
