# Event Details Template - Implementation Guide

**Status:** ✅ Production Ready  
**Date:** 2026-02-26  
**Version:** 2.0.0  
**Location:** `entities/event/event-details.html`

---

## Overview

Universal event details template using a **component card library** architecture with archival aesthetic. Define all possible sections once, show only sections with data.

**Works for both:**
- **Comprehensive events** (like Yates Incident with 7 sub-events, multiple participants, sources)
- **Simple standalone events** (like Walker Incident with basic info)

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\web\html
python -m http.server 8000
```

### 2. Test URLs

```
Comprehensive Event (Yates Incident - 10 cards):
http://localhost:8000/entities/event/event-details.html?id=1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d

Simple Event (Walker Incident - 7 cards):
http://localhost:8000/entities/event/event-details.html?id=walker-event-id

Empty State (Minimal - 0 cards):
http://localhost:8000/entities/event/event-details.html?id=minimal-event-id
```

---

## File Structure

```
web/html/entities/event/
├── event-details.html                  # Event details template ⭐
├── event-index.html                    # Event browse/discovery page
└── README.md                           # This documentation

web/html/assets/js/
├── event-profile.js                    # Card registry + loading logic
├── db-logic.js                         # Data fetching and rendering
├── components.js                       # Component system
├── nav.js                              # Navigation logic
└── filter.js                           # Filtering functionality

web/html/assets/data/
└── events.json                         # Events data source
```

---

## How It Works

### Component Card System

**10 Available Cards:**
1. Context & Significance (auto-expands)
2. Procedural Timeline (auto-expands if ≥ 3 sub-events)
3. Key Participants
4. Material Evidence
5. Primary Sources
6. Locations
7. Related Events
8. Assertions & Analysis
9. **Organizations** (NEW - extracted from participants)
10. Photos & Media

**Conditional Rendering:**
- All 10 card sections defined in HTML
- JavaScript evaluates `showWhen()` for each card
- Only cards with data are displayed
- Empty state shows if < 2 cards visible

### Card Registry Pattern

```javascript
// assets/js/event-profile.js
const CARD_REGISTRY = {
  context: {
    icon: 'info',
    title: 'Context & Significance',
    dataField: 'context',
    autoExpand: true,
    showWhen: (data) => data.context !== null && data.context !== '',
    populate: (data) => populateContext(data.context)
  },
  timeline: {
    icon: 'timeline',
    title: 'Procedural Timeline',
    dataField: 'sub_events',
    autoExpand: (data) => data.sub_events && data.sub_events.length >= 3,
    showWhen: (data) => data.sub_events && data.sub_events.length > 0,
    populate: (data) => populateTimeline(data.sub_events)
  },
  organizations: {
    icon: 'account_balance',
    title: 'Organizations',
    dataField: 'organizations',
    autoExpand: false,
    showWhen: (data) => {
      // Extract from participants if no organizations array
      const orgs = data.organizations || extractOrganizationsFromParticipants(data.participants || []);
      return orgs.length > 0;
    },
    populate: (data) => {
      const orgs = data.organizations || extractOrganizationsFromParticipants(data.participants || []);
      populateOrganizations(orgs);
    }
  },
  // ... 7 more cards
};
```

---

## Data Format

### Required Fields
```json
{
  "event_id": "uuid",
  "title": "Event Title",
  "event_type": "SIGHTING | SHOT | INTERVIEW | etc",
  "icon": "material_icon_name",
  "label": "Date · Location",
  "start_ts": "ISO 8601 timestamp"
}
```

### Optional Fields (Enable Cards)
```json
{
  "description": "Event description",
  "context": "Background and significance text",
  "location": "Dallas, TX",
  "end_ts": "ISO 8601 timestamp",
  "time_precision": "EXACT | APPROX | RANGE",
  "sub_events": [
    {
      "event_id": "uuid",
      "title": "Sub-event Title",
      "description": "What happened",
      "start_ts": "ISO 8601 timestamp",
      "icon": "material_icon",
      "label": "Date label",
      "url": "Link to document"
    }
  ],
  "participants": [
    {"name": "Person Name", "role": "Witness | Agent | Suspect", "description": "Details"}
  ],
  "evidence": [
    {"name": "Object Name", "type": "WEAPON | DOCUMENT | PHOTO", "description": "...", "location": "Where found"}
  ],
  "sources": [
    {"title": "Source Title", "type": "DOCUMENT | TESTIMONY", "date": "YYYY", "author": "...", "archive": "NARA", "url": "link"}
  ],
  "locations": [
    {"name": "Place Name", "address": "123 St", "description": "...", "significance": "Why important"}
  ],
  "related_events": [
    {"title": "Event Title", "date": "YYYY-MM-DD", "description": "...", "relation": "PRECEDED BY | FOLLOWED BY"}
  ],
  "assertions": [
    {"claim": "Statement", "source": "Source", "confidence": "CONFIRMED | DISPUTED | SUPPORTED", "analysis": "Assessment"}
  ],
  "organizations": [
    {"name": "Organization Name", "type": "Government | Corporate", "role": "Investigating | Participating"}
  ],
  "media": [
    {"url": "/path/to/image.jpg", "caption": "Caption", "type": "PHOTO | VIDEO"}
  ]
}
```

---

## Design Features

### Archive Aesthetic:
- ✅ Archive card header layout
- ✅ Visual timeline with dots and vertical connectors
- ✅ Lighter card backgrounds (`bg-[#252021]/60`)
- ✅ Border-left accent on section headers (`border-l-4 border-primary pl-4`)
- ✅ 6-stat grid in header

### Universal Architecture:
- ✅ 10 conditional cards (only show when data exists)
- ✅ Accordion behavior for progressive disclosure
- ✅ Auto-expand rules (Context always, Timeline if ≥ 3 sub-events)
- ✅ Empty state handling
- ✅ Dynamic data loading from events.json
- ✅ **Organizations extraction** from participant roles

---

## Organizations Feature (NEW)

### Dynamic Extraction
Organizations are automatically extracted from participant roles:

```javascript
// Organization mappings from participant roles
const orgMappings = {
  'FBI Agent': {
    name: 'Federal Bureau of Investigation',
    type: 'Government Agency',
    role: 'Investigating Authority'
  },
  'SA': {
    name: 'Federal Bureau of Investigation', 
    type: 'Government Agency',
    role: 'Investigating Authority'
  },
  'Dallas Police': {
    name: 'Dallas Police Department',
    type: 'Law Enforcement', 
    role: 'Local Authority'
  },
  'Warren Commission': {
    name: 'Warren Commission',
    type: 'Government Commission',
    role: 'Investigative Body'
  }
};
```

### No Schema Changes Required
- **Backward Compatible:** Works with existing participant data
- **Zero Migration:** No need to add organizations arrays to events.json
- **Extensible:** Easy to add new organization mappings

---

## Testing Checklist

- [x] **Comprehensive Event** - All 10 cards render correctly (Yates)
- [x] **Simple Event** - 7 cards render (Walker)
- [x] **Empty State** - Shows message when < 2 cards
- [x] **Context Auto-Expand** - Opens by default when data exists
- [x] **Timeline Auto-Expand** - Opens when ≥ 3 sub-events
- [x] **Card Collapse/Expand** - Click to toggle works
- [x] **Visual Timeline** - Dots and connectors render correctly
- [x] **Date Formatting** - Timestamps display correctly
- [x] **Icon Display** - Event type icons show in header
- [x] **Participant Cards** - Role-based icons work
- [x] **Source Links** - URLs to documents functional
- [x] **Organizations Card** - Extracts from participants correctly
- [x] **Empty Data Handling** - No errors with null/undefined

---

## Next.js Migration Path

### Step 1: Create API Route
```typescript
// app/api/events/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: event, error } = await supabase
    .from('event')
    .select(`
      *,
      event_participant (
        person (person_id, display_name, label),
        role_type
      ),
      event_object (
        object (object_id, name, type, description)
      )
    `)
    .eq('event_id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(transformEventData(event));
}
```

### Step 2: Update Data Source
```javascript
// assets/js/event-profile.js line ~78
// Change from:
const response = await fetch('assets/data/events.json');

// To:
const response = await fetch(`/api/events/${eventId}`);
```

### Step 3: Test with Production Data
```bash
npm run dev
# Open: http://localhost:3000/entities/event/event-details.html?id={event_id}
```

---

## Adding New Cards

### 1. Add HTML Section
```html
<!-- event-details.html -->
<section id="new-card-section" data-section="new-card" class="border-b border-archive-secondary/20" style="display:none;">
  <div class="px-6 py-6 bg-archive-dark border-b border-archive-secondary/20 flex items-center justify-between cursor-pointer hover:bg-archive-dark/80 transition-colors"
       onclick="toggleCard('new-card')">
    <div class="flex items-center gap-4">
      <span class="material-symbols-outlined text-primary text-xl">icon_name</span>
      <h2 class="text-xl font-bold text-archive-heading uppercase font-display tracking-widest border-l-4 border-primary pl-4">New Card Title</h2>
      <span id="new-card-count" class="text-xs bg-primary/20 text-primary px-3 py-1 uppercase tracking-widest">(0)</span>
    </div>
    <span id="new-card-chevron" class="material-symbols-outlined text-archive-secondary transition-transform">
      expand_more
    </span>
  </div>
  <div id="new-card-content" class="px-6 py-8" style="display:none;">
    <div id="new-card-list" class="max-w-6xl mx-auto">
      <!-- Content injected here -->
    </div>
  </div>
</section>
```

### 2. Add to Card Registry
```javascript
// assets/js/event-profile.js
'new-card': {
  icon: 'icon_name',
  title: 'New Card Title',
  dataField: 'newCardData',
  autoExpand: false,
  showWhen: (data) => data.newCardData && data.newCardData.length > 0,
  populate: (data) => populateNewCard(data.newCardData)
}
```

### 3. Create Populate Function
```javascript
// assets/js/event-profile.js
function populateNewCard(data) {
  const list = document.getElementById('new-card-list');
  if (!list || !data || data.length === 0) return;

  list.innerHTML = data.map(item => {
    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <h4 class="text-xs font-bold text-archive-heading uppercase">${item.name}</h4>
        <p class="text-[10px] text-archive-secondary/70">${item.description}</p>
      </div>
    `;
  }).join('');
}
```

---

## Troubleshooting

### Cards Not Showing
1. Check browser console for errors
2. Verify `event_id` in URL matches data
3. Check `showWhen()` condition returns true
4. Verify data field exists and has content

### Timeline Not Rendering
1. Check `sub_events` array exists in data
2. Verify dates are valid ISO 8601 format
3. Check `populateTimeline()` function

### Organizations Not Showing
1. Check participants have recognized roles
2. Verify organization mappings in `parseOrganizationFromRole()`
3. Check `extractOrganizationsFromParticipants()` function

### Empty State Always Shows
1. Check that at least 2 cards have data
2. Verify `showWhen()` conditions are correct
3. Check data structure matches expected format

### Styles Not Loading
1. Verify Tailwind CSS loaded
2. Check `main.css` linked correctly
3. Ensure Material Icons CSS loaded

---

## Related Files

- **Event Browse Page:** `entities/event/event-index.html`
- **Event Data:** `assets/data/events.json`
- **Component System:** `assets/js/components.js`
- **Navigation:** `assets/js/nav.js`
- **Filtering:** `assets/js/filter.js`

---

**Last Updated:** 2026-02-26  
**Version:** 2.0.0 (Added Organizations Feature)  
**Implementation:** Production Ready
