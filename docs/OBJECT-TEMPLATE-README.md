# Object Profile Template - Quick Start Guide

**Status:** ✅ Production Ready
**Date:** 2026-02-24
**Version:** 1.0.0

---

## Overview

Universal object profile template using a **component card library** architecture. Define all possible sections once, show only sections with data.

**Works for:**
- **Weapons** (Mannlicher-Carcano Rifle)
- **Documents** (Brown Paper Sack, Backyard Photographs)
- **Evidence** (CE 133-A/B, Exhibit 139)
- **Artifacts** (Business Records, Invoices)

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\docs\ui
python -m http.server 8000
```

### 2. Test URLs

```
Comprehensive Object (Mannlicher-Carcano Rifle):
http://localhost:8000/object.html?id=mannlicher-carcano

Document (Brown Paper Sack):
http://localhost:8000/object.html?id=brown-paper-sack

Empty State:
http://localhost:8000/object.html?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## File Structure

```
docs/ui/
├── object.html                          # Universal object template
├── assets/
│   ├── js/
│   │   ├── object-profile.js            # Card registry + loading
│   │   ├── object-cards.js              # Card populate functions
│   │   ├── components.js                # Existing
│   │   ├── nav.js                       # Existing
│   │   └── db-logic.js                  # Existing
│   ├── data/
│        └── objects.json                 # Baseline Data (Canonical)
│   └── css/
│       └── main.css                     # Existing
```

---

## How It Works

### Component Card System

**8 Available Cards:**
1. Overview (auto-expands)
2. Physical Properties
3. Related Events
4. Related People
5. Chain of Custody
6. Related Objects
7. Identifiers
8. Primary Sources

**Conditional Rendering:**
- All 8 card sections defined in HTML
- JavaScript evaluates `showWhen()` for each card
- Only cards with data are displayed
- Empty state shows if < 2 cards visible

### Card Registry Pattern

```javascript
// object-profile.js
const CARD_REGISTRY = {
  overview: {
    icon: 'info',
    title: 'Overview',
    dataField: 'description',
    autoExpand: true,
    showWhen: (data) => data.description !== null && data.description !== '',
    populate: (data) => populateOverview(data.description)
  },
  custody: {
    icon: 'receipt_long',
    title: 'Chain of Custody',
    dataField: 'custody_chain',
    autoExpand: false,
    showWhen: (data) => data.custody_chain && data.custody_chain.length > 0,
    populate: (data) => populateCustody(data.custody_chain)
  },
  // ... 6 more cards
};
```

---

## Data Format

### Required Fields
```json
{
  "object_id": "uuid",
  "name": "Mannlicher-Carcano Rifle",
  "object_type": "WEAPON | DOCUMENT | PHOTO | ARTIFACT",
  "label": "Warren Commission Exhibit 139"
}
```

### Optional Fields (Enable Cards)
```json
{
  "description": "Overview text",
  "properties": {
    "caliber": "6.5mm",
    "length": "40.2 inches",
    "serial_number": "C2766"
  },
  "events": [
    { "event_id": "uuid", "title": "Event", "date": "1963-11-22", "role": "PRIMARY" }
  ],
  "people": [
    { "person_id": "uuid", "name": "Person", "relation": "OWNER | HANDLER" }
  ],
  "custody_chain": [
    { "holder": "Dallas Police", "from": "1963-11-22", "to": "1963-11-23", "notes": "..." }
  ],
  "related_objects": [
    { "object_id": "uuid", "name": "Object", "relation": "COMPONENT | ASSOCIATED" }
  ],
  "identifiers": [
    { "type": "EXHIBIT_NUMBER", "value": "CE 139" },
    { "type": "SERIAL_NUMBER", "value": "C2766" }
  ],
  "sources": [
    { "title": "Source", "type": "DOCUMENT", "year": "1964", "archive": "NARA" }
  ]
}
```

---

## Next.js Migration Path

### Step 1: Create API Route
```typescript
// app/api/objects/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: object, error } = await supabase
    .from('object')
    .select(`
      *,
      event_object (
        event (event_id, title, start_ts, event_type),
        role_type
      ),
      entity_identifier!entity_id (id_type, id_value)
    `)
    .eq('object_id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(transformObjectData(object));
}
```

### Step 2: Update Data Source
```javascript
// object-profile.js line 91
// Change from:
const response = await fetch('assets/data/objects.json');

// To:
const response = await fetch(`/api/objects/${objectId}`);
```

---

## Testing Checklist

- [ ] **Comprehensive Object** - All cards render correctly
- [ ] **Minimal Object** - Only populated cards shown
- [ ] **Empty State** - Shows message when < 2 cards
- [ ] **Overview Auto-Expand** - Opens by default when data exists
- [ ] **Card Collapse/Expand** - Click to toggle works
- [ ] **Properties Display** - Key-value pairs formatted
- [ ] **Custody Chain** - Timeline visualization
- [ ] **Exhibit Numbers** - Properly linked identifiers
- [ ] **Empty Data Handling** - No errors with null/undefined

---

## Support

**Baseline Data:** `assets/data/objects.json`

---

**Last Updated:** 2026-02-24
**Version:** 1.0.0
