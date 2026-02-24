# Person Profile Template - Quick Start Guide

**Status:** ✅ Production Ready
**Date:** 2026-02-23
**Version:** 2.0.0

---

## Overview

Universal person profile template using a **component card library** architecture. Define all possible sections once, show only sections with data.

**Template:**
- **person.html** ⭐ **CANONICAL** - Synthesized design combining oswald.html aesthetic with universal architecture
- **oswald.html** - Static mockup reference (archival aesthetic)
- **archived/person-original.html** - Original template (archived)

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\docs\ui
python -m http.server 8000
```

### 2. Test URLs

```
Comprehensive Profile (12 cards):
http://localhost:8000/person.html?id=3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8

Minimal Profile (7 cards):
http://localhost:8000/person.html?id=8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d

Empty State (0 cards):
http://localhost:8000/person.html?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## File Structure

```
docs/ui/
├── person.html                          # Canonical person template ⭐
├── oswald.html                          # Static mockup reference
├── archived/
│   └── person-original.html             # Original template (archived)
├── assets/
│   ├── js/
│   │   ├── person-v2-profile.js         # Card registry + loading
│   │   ├── person-v2-cards.js           # Card populate functions
│   │   ├── person-profile.js            # Legacy (archived)
│   │   ├── person-cards.js              # Legacy (archived)
│   │   ├── components.js                # Existing
│   │   ├── nav.js                       # Existing
│   │   └── db-logic.js                  # Existing
│   ├── data/
│   │   ├── mock-person.json             # Test data (NEW)
│   │   └── people.json                  # Original data (PRESERVED)
│   └── css/
│       └── main.css                     # Existing
```

---

## Template Comparison

| Feature | person.html ⭐ | archived/person-original.html | oswald.html |
|---------|------------------|-------------|-------------|
| **Layout** | Responsive: Archive card (desktop) + Hero (mobile) | Hero layout (all screens) | Archive card (static) |
| **Data Loading** | ✅ Dynamic from mock-person.json | ✅ Dynamic from mock-person.json | ❌ Hardcoded |
| **Card System** | ✅ 12 conditional cards | ✅ 12 conditional cards | ❌ Fixed sections |
| **Timeline Design** | Visual dots + connectors | Vertical line style | Visual dots + connectors |
| **Card Backgrounds** | Lighter (`bg-[#252021]/60`) | Darker (`bg-archive-bg/30`) | Lighter (`bg-[#252021]/60`) |
| **Stats Display** | Desktop: 6-stat grid in header<br>Mobile: 2x2 card grid | 2x2 card grid (all screens) | 6-stat grid in header |
| **Accordion Behavior** | ✅ Yes | ✅ Yes | ❌ No |
| **Empty State** | ✅ Yes | ✅ Yes | ❌ No |
| **Best For** | Production use (best of both) | Reference/comparison | Design reference only |

**Why person.html is canonical:**
- Combines oswald.html's archival aesthetic with person.html's universal architecture
- Responsive design optimized for desktop and mobile
- Visual timeline matches static mockup quality
- Archive card layout on desktop for professional appearance
- Full dynamic data support with conditional rendering

---

## How It Works

### Component Card System

**12 Available Cards:**
1. Biographical Summary (auto-expands)
2. Chronology (auto-expands if ≥ 3 events)
3. Known Aliases
4. Residences
5. Affiliated Organizations
6. Family Relations
7. Related Events
8. Related Objects
9. Primary Sources
10. External Identifiers
11. Assertions
12. Photos & Media

**Conditional Rendering:**
- All 12 card sections defined in HTML
- JavaScript evaluates `showWhen()` for each card
- Only cards with data are displayed
- Empty state shows if < 2 cards visible

### Card Registry Pattern

```javascript
// person-profile.js
const CARD_REGISTRY = {
  biography: {
    icon: 'article',
    title: 'Biographical Summary',
    dataField: 'notes',
    autoExpand: true,
    showWhen: (data) => data.notes !== null && data.notes !== '',
    populate: (data) => populateBiography(data.notes)
  },
  // ... 11 more cards
};
```

---

## Data Format

### Required Fields
```json
{
  "person_id": "uuid",
  "display_name": "Last, First Middle",
  "birth_date": "YYYY-MM-DD",
  "death_date": "YYYY-MM-DD",
  "label": "Role"
}
```

### Optional Fields (Enable Cards)
```json
{
  "notes": "Biography text",
  "aliases": [{"alias_name": "Name", "alias_type": "PRIMARY"}],
  "residences": [{"place": "City", "address": "123 St", "dates": "1963"}],
  "organizations": [{"name": "Org", "role": "Role", "dates": "1960-1963"}],
  "family": [{"name": "Person", "relation": "Spouse", "date": "m. 1961"}],
  "events": [{"date": "1963-11-22", "title": "Event", "description": "...", "type": "HISTORICAL"}],
  "related_events": [{"title": "Event", "date": "1963-11-22", "description": "..."}],
  "objects": [{"name": "Object", "type": "WEAPON", "description": "..."}],
  "sources": [{"title": "Source", "type": "DOCUMENT", "year": "1963", "author": "...", "archive": "NARA"}],
  "identifiers": [{"type": "FBI_FILE", "value": "105-82555"}],
  "assertions": [{"claim": "Text", "source": "Source", "confidence": "SUPPORTED"}],
  "media": [{"url": "/path/to/image.jpg", "caption": "Caption", "type": "PHOTO"}]
}
```

---

## Testing Checklist

- [x] **Comprehensive Profile** - All 12 cards render correctly
- [x] **Minimal Profile** - 7 cards render, others hidden
- [x] **Empty State** - Shows message when < 2 cards
- [x] **Biography Auto-Expand** - Opens by default when data exists
- [x] **Chronology Auto-Expand** - Opens when ≥ 3 events
- [x] **Card Collapse/Expand** - Click to toggle works
- [x] **Mobile Responsive** - Stats grid 2x2, cards stack
- [x] **Date Formatting** - Birth/death dates display correctly
- [x] **Age Calculation** - Shows correct age in stats
- [x] **Alias Badges** - Show up to 2 in header
- [x] **Timeline Rendering** - Events sorted chronologically
- [x] **Empty Data Handling** - No errors with null/undefined

---

## Next.js Migration Path

### Step 1: Create API Route
```typescript
// app/api/people/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: person, error } = await supabase
    .from('person')
    .select(`
      *,
      person_alias (alias_name, alias_type),
      event_participant!inner (
        event (event_id, title, start_ts, event_type, description),
        role_type
      )
    `)
    .eq('person_id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(transformPersonData(person));
}
```

### Step 2: Update Data Source
```javascript
// person-v2-profile.js line 128
// Change from:
const response = await fetch('assets/data/mock-person.json');

// To:
const response = await fetch(`/api/people/${personId}`);
```

### Step 3: Test with Production Data
```bash
npm run dev
# Open: http://localhost:3000/person-v2?id={person_id}
```

**Note:** person.html is the canonical template for migration.

---

## Adding New Cards

### 1. Add HTML Section
```html
<!-- person.html -->
<section id="new-card-section" data-section="new-card" style="display:none;">
  <div class="px-6 py-6 bg-archive-dark border-b border-archive-secondary/20 flex items-center justify-between cursor-pointer hover:bg-archive-dark/80 transition-colors"
       onclick="toggleCard('new-card')">
    <div class="flex items-center gap-4">
      <span class="material-symbols-outlined text-primary text-2xl">icon_name</span>
      <h2 class="text-2xl font-bold text-archive-heading uppercase font-display">New Card Title</h2>
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
// person-profile.js
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
// person-cards.js
function populateNewCard(data) {
  const list = document.getElementById('new-card-list');
  if (!list || !data || data.length === 0) return;

  list.innerHTML = data.map(item => {
    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <h4 class="text-base font-bold text-archive-heading uppercase">${item.name}</h4>
        <p class="text-xs text-archive-secondary/70">${item.description}</p>
      </div>
    `;
  }).join('');
}
```

---

## Troubleshooting

### Cards Not Showing
1. Check browser console for errors
2. Verify `person_id` in URL matches data
3. Check `showWhen()` condition returns true
4. Verify data field exists and has content

### Timeline Not Rendering
1. Check `events` array exists in data
2. Verify dates are valid ISO format
3. Check `populateChronology()` function

### Empty State Always Shows
1. Check that at least 2 cards have data
2. Verify `showWhen()` conditions are correct
3. Check data structure matches expected format

### Styles Not Loading
1. Verify Tailwind CDN loaded
2. Check `main.css` linked correctly
3. Ensure Material Icons CSS loaded

---

## Support

**Documentation:** `person-template-implementation-plan.md`
**Test Data:** `assets/data/mock-person.json`
**Original Data:** `assets/data/people.json` (preserved)

---

**Last Updated:** 2026-02-23
**Version:** 1.0.0
