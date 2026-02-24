# Person Template Implementation Plan v2.0
## Component Card Library Architecture

**Project:** Primary Sources
**Feature:** Universal Person Profile Template (person.html)
**Date:** 2026-02-23
**Status:** ✅ Approved - Ready for Implementation
**Architecture:** Modular Component Card System

---

## 🎯 Objective

Create a universal person profile template using a **component card library** where ALL possible sections are defined, and the page dynamically shows only cards with data.

**Key Principle:** Define everything, show what exists.

---

## 🧩 Architecture Overview

### **Component Card System**

```
person.html
├── Person Header (Always)
├── Stats Dashboard (Always)
└── Card Library (15+ cards)
    ├── Card 1: Biographical Summary
    ├── Card 2: Chronology ⭐ (Hero Feature)
    ├── Card 3: Aliases
    ├── Card 4: Residences
    ├── Card 5: Organizations
    ├── Card 6: Family Relations
    ├── Card 7: Related Events
    ├── Card 8: Related Objects
    ├── Card 9: Primary Sources
    ├── Card 10: Identifiers
    ├── Card 11: Assertions
    ├── Card 12: Photos & Media
    ├── Card 13: Legal Records (future)
    ├── Card 14: Employment History (future)
    └── Card 15: External Links (future)
```

**Behavior:**
- Each card has `data-section="{card-id}"` and `style="display:none;"` by default
- JavaScript evaluates `showWhen()` condition for each card
- If condition = true → show card, populate data, apply expansion rules
- If condition = false → keep card hidden

---

## 📦 Complete Card Library (15+ Cards)

### **Always Visible**
| Card | Description | Data Source |
|------|-------------|-------------|
| Person Header | Name, dates, label, portrait | `person.display_name`, `birth_date`, `death_date` |
| Stats Dashboard | Birth, death, age, source count | Calculated from person + relations |

### **Conditional Cards**
| # | Card Name | Icon | Data Source | Auto-Expand |
|---|-----------|------|-------------|-------------|
| 1 | Biographical Summary | `article` | `person.notes` | ✅ Yes |
| 2 | Chronology | `timeline` | `event_participant → event` | If ≥ 3 events |
| 3 | Known Aliases | `badge` | `person_alias` | ❌ No |
| 4 | Residences | `home` | `event_place (RESIDENCE)` | ❌ No |
| 5 | Affiliated Organizations | `account_balance` | `event_participant (org)` | ❌ No |
| 6 | Family Relations | `family_restroom` | `assertion (SPOUSE_OF, CHILD_OF)` | ❌ No |
| 7 | Related Events | `event` | `event_participant` | ❌ No |
| 8 | Related Objects | `inventory_2` | `event_object` | ❌ No |
| 9 | Primary Sources | `description` | `assertion → source_excerpt` | ❌ No |
| 10 | External Identifiers | `tag` | `entity_identifier` | ❌ No |
| 11 | Assertions | `fact_check` | `assertion (subject_id=person)` | ❌ No |
| 12 | Photos & Media | `image` | `object (PHOTO)` | ❌ No |
| 13 | Legal Records | `gavel` | Future feature | ❌ No |
| 14 | Employment History | `work` | Future feature | ❌ No |
| 15 | External Links | `link` | `org (ARCHIVE)` | ❌ No |

---

## 🏗️ File Structure

```
docs/ui/
├── person.html                          ← NEW (universal template)
├── oswald.html                          ← KEEP (reference only)
├── assets/
│   ├── js/
│   │   ├── person-profile.js            ← NEW (card registry + loading logic)
│   │   ├── person-cards.js              ← NEW (card population functions)
│   │   ├── db-logic.js                  ← UPDATE (person helpers)
│   │   └── components.js                ← EXISTING
│   ├── data/
│   │   └── people.json                  ← EXISTING
│   └── css/
│       └── main.css                     ← EXISTING
```

---

## 📐 Layout Design

```
┌─────────────────────────────────────────────────────┐
│ BREADCRUMB (Home / People / [Name])                │
├─────────────────────────────────────────────────────┤
│ PERSON HEADER (Hero - Centered)                    │
│              ┌─────┐                                │
│              │ IMG │                                │
│              └─────┘                                │
│       Lee Harvey Oswald                             │
│       Suspect · 1939 – 1963                         │
│       Aliases: Hidell, O.H. Lee                     │
├─────────────────────────────────────────────────────┤
│ STATS DASHBOARD (4-card grid)                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │ Born │ │ Died │ │ Age  │ │Docs  │               │
│ │ Oct  │ │ Nov  │ │  24  │ │ 47  │               │
│ │ 1939 │ │ 1963 │ │years │ │srcs  │               │
│ └──────┘ └──────┘ └──────┘ └──────┘               │
├─────────────────────────────────────────────────────┤
│ ▼ BIOGRAPHICAL SUMMARY                              │
│   [Expanded by default]                             │
├─────────────────────────────────────────────────────┤
│ ▼ CHRONOLOGY (9) ⭐ HERO FEATURE                    │
│   [Expanded if ≥ 3 events]                         │
│   ● Sep 1959 - USMC Discharge                      │
│   │                                                 │
│   ● Oct 1959 - Defected to USSR                    │
│   │                                                 │
│   ● Nov 22, 1963 - JFK Assassination               │
│   ⬤                                                 │
├─────────────────────────────────────────────────────┤
│ ▶ KNOWN ALIASES (2)                                 │
│   [Collapsed - click to expand]                    │
├─────────────────────────────────────────────────────┤
│ ▶ RESIDENCES (4)                                    │
│   [Collapsed]                                       │
├─────────────────────────────────────────────────────┤
│ ▶ AFFILIATED ORGANIZATIONS (3)                      │
│   [Collapsed]                                       │
├─────────────────────────────────────────────────────┤
│ ▶ FAMILY RELATIONS (5)                              │
│   [Collapsed]                                       │
├─────────────────────────────────────────────────────┤
│ ▶ RELATED EVENTS (12)                               │
│   [Collapsed]                                       │
├─────────────────────────────────────────────────────┤
│ ▶ RELATED OBJECTS (7)                               │
│   [Collapsed]                                       │
├─────────────────────────────────────────────────────┤
│ ▶ PRIMARY SOURCES (47)                              │
│   [Collapsed]                                       │
├─────────────────────────────────────────────────────┤
│ ▶ EXTERNAL IDENTIFIERS (3)                          │
│   [Collapsed]                                       │
└─────────────────────────────────────────────────────┘
```

**Mobile Behavior:**
- Stats: 2x2 grid
- All cards: Full-width stack
- Same expansion rules

---

## 🎨 Universal Card Template

### **Standard Card HTML Structure**

```html
<!-- Generic Card Component -->
<section id="{card-id}-section"
         data-section="{card-id}"
         class="border-b border-archive-secondary/20"
         style="display:none;">

    <!-- Card Header (Clickable) -->
    <div class="px-6 py-6 bg-archive-dark border-b border-archive-secondary/20 flex items-center justify-between cursor-pointer hover:bg-archive-dark/80 transition-colors"
         onclick="toggleCard('{card-id}')">
        <div class="flex items-center gap-4">
            <span class="material-symbols-outlined text-primary text-2xl">{icon}</span>
            <h2 class="text-2xl font-bold text-archive-heading uppercase font-display">{Title}</h2>
            <span id="{card-id}-count" class="text-xs bg-primary/20 text-primary px-3 py-1 uppercase tracking-widest">({count})</span>
        </div>
        <span id="{card-id}-chevron" class="material-symbols-outlined text-archive-secondary transition-transform">
            expand_more
        </span>
    </div>

    <!-- Card Content (Expandable) -->
    <div id="{card-id}-content" class="px-6 py-8" style="display:none;">
        <div class="max-w-6xl mx-auto">
            <!-- Card-specific content injected here -->
        </div>
    </div>

</section>
```

**CSS Classes:**
- Expanded: Chevron rotates 180deg (`transform: rotate(180deg)`)
- Collapsed: Chevron default (pointing down)

---

## 💻 JavaScript Card Registry

### **Complete Registry Object**

```javascript
// person-profile.js

const CARD_REGISTRY = {

  'biography': {
    icon: 'article',
    title: 'Biographical Summary',
    dataField: 'notes',
    autoExpand: true,
    showWhen: (data) => data.notes !== null && data.notes !== '',
    populate: (data) => populateBiography(data.notes)
  },

  'chronology': {
    icon: 'timeline',
    title: 'Chronology',
    dataField: 'events',
    autoExpand: (data) => data.events && data.events.length >= 3,
    showWhen: (data) => data.events && data.events.length > 0,
    populate: (data) => populateChronology(data.events)
  },

  'aliases': {
    icon: 'badge',
    title: 'Known Aliases',
    dataField: 'aliases',
    autoExpand: false,
    showWhen: (data) => data.aliases && data.aliases.length > 0,
    populate: (data) => populateAliases(data.aliases)
  },

  'residences': {
    icon: 'home',
    title: 'Residences',
    dataField: 'residences',
    autoExpand: false,
    showWhen: (data) => data.residences && data.residences.length > 0,
    populate: (data) => populateResidences(data.residences)
  },

  'organizations': {
    icon: 'account_balance',
    title: 'Affiliated Organizations',
    dataField: 'organizations',
    autoExpand: false,
    showWhen: (data) => data.organizations && data.organizations.length > 0,
    populate: (data) => populateOrganizations(data.organizations)
  },

  'family': {
    icon: 'family_restroom',
    title: 'Family Relations',
    dataField: 'family',
    autoExpand: false,
    showWhen: (data) => data.family && data.family.length > 0,
    populate: (data) => populateFamily(data.family)
  },

  'events': {
    icon: 'event',
    title: 'Related Events',
    dataField: 'events',
    autoExpand: false,
    showWhen: (data) => data.events && data.events.length > 0,
    populate: (data) => populateEvents(data.events)
  },

  'objects': {
    icon: 'inventory_2',
    title: 'Related Objects',
    dataField: 'objects',
    autoExpand: false,
    showWhen: (data) => data.objects && data.objects.length > 0,
    populate: (data) => populateObjects(data.objects)
  },

  'sources': {
    icon: 'description',
    title: 'Primary Sources',
    dataField: 'sources',
    autoExpand: false,
    showWhen: (data) => data.sources && data.sources.length > 0,
    populate: (data) => populateSources(data.sources)
  },

  'identifiers': {
    icon: 'tag',
    title: 'External Identifiers',
    dataField: 'identifiers',
    autoExpand: false,
    showWhen: (data) => data.identifiers && data.identifiers.length > 0,
    populate: (data) => populateIdentifiers(data.identifiers)
  },

  'assertions': {
    icon: 'fact_check',
    title: 'Assertions',
    dataField: 'assertions',
    autoExpand: false,
    showWhen: (data) => data.assertions && data.assertions.length > 0,
    populate: (data) => populateAssertions(data.assertions)
  },

  'media': {
    icon: 'image',
    title: 'Photos & Media',
    dataField: 'media',
    autoExpand: false,
    showWhen: (data) => data.media && data.media.length > 0,
    populate: (data) => populateMedia(data.media)
  }

};
```

---

## 🔄 Core Loading Logic

### **Main Function**

```javascript
async function loadPersonProfile(personId) {

  // 1. Fetch person data from API
  const personData = await fetch(`/api/people/${personId}`)
    .then(r => r.json())
    .catch(err => {
      console.error('Failed to load person:', err);
      showErrorState();
      return null;
    });

  if (!personData) return;

  // 2. Populate header (always)
  populateHeader(personData);

  // 3. Populate stats dashboard (always)
  populateStats(personData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(personData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge
      const countData = personData[card.dataField];
      const count = Array.isArray(countData) ? countData.length : 1;
      setCardCount(cardId, count);

      // Populate content
      card.populate(personData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(personData)
        : card.autoExpand === true;

      if (shouldExpand) {
        expandCard(cardId);
      }
    } else {
      // Hide card
      hideCard(cardId);
    }
  });

  // 5. Show empty state if minimal data
  if (visibleCardCount < 2) {
    showEmptyState();
  }
}

// Helper functions
function showCard(cardId) {
  const section = document.getElementById(`${cardId}-section`);
  if (section) section.style.display = '';
}

function hideCard(cardId) {
  const section = document.getElementById(`${cardId}-section`);
  if (section) section.style.display = 'none';
}

function expandCard(cardId) {
  const content = document.getElementById(`${cardId}-content`);
  const chevron = document.getElementById(`${cardId}-chevron`);
  if (content) content.style.display = '';
  if (chevron) chevron.style.transform = 'rotate(180deg)';
}

function toggleCard(cardId) {
  const content = document.getElementById(`${cardId}-content`);
  const chevron = document.getElementById(`${cardId}-chevron`);

  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = '';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    content.style.display = 'none';
    chevron.style.transform = '';
  }
}

function setCardCount(cardId, count) {
  const badge = document.getElementById(`${cardId}-count`);
  if (badge) badge.textContent = `(${count})`;
}
```

---

## 📋 Implementation Phases

### **Phase 1: HTML Structure (90 minutes)**
- [ ] Create `person.html` base file
- [ ] Add header component integration
- [ ] Build person header (hero style, centered)
- [ ] Create stats dashboard (4-card grid)
- [ ] Define all 12+ card sections with standard template
- [ ] Add breadcrumb navigation
- [ ] Add footer component integration
- [ ] Add empty state component

### **Phase 2: JavaScript Core (60 minutes)**
- [ ] Create `person-profile.js`
- [ ] Implement `CARD_REGISTRY` object
- [ ] Implement `loadPersonProfile()` function
- [ ] Implement `showCard()` / `hideCard()` helpers
- [ ] Implement `expandCard()` / `toggleCard()` functions
- [ ] Implement `setCardCount()` function
- [ ] Add URL parameter handling (`?id={person_id}`)

### **Phase 3: Card Population Functions (90 minutes)**
- [ ] Create `person-cards.js`
- [ ] Implement `populateHeader()`
- [ ] Implement `populateStats()`
- [ ] Implement `populateBiography()`
- [ ] Implement `populateChronology()` (timeline component)
- [ ] Implement `populateAliases()`
- [ ] Implement `populateResidences()`
- [ ] Implement `populateOrganizations()`
- [ ] Implement `populateFamily()`
- [ ] Implement `populateEvents()`
- [ ] Implement `populateObjects()`
- [ ] Implement `populateSources()`
- [ ] Implement `populateIdentifiers()`

### **Phase 4: Data Integration (30 minutes)**
- [ ] Update `db-logic.js` with person data helpers
- [ ] Create mock data for testing (comprehensive profile)
- [ ] Create mock data for testing (minimal profile)
- [ ] Test with `people.json` static data
- [ ] Prepare API endpoint structure documentation

### **Phase 5: Testing & Refinement (60 minutes)**
- [ ] Test Case 1: Oswald (comprehensive - 10+ cards)
- [ ] Test Case 2: Ralph Yates (minimal - 3-4 cards)
- [ ] Test Case 3: Unknown witness (fleeting - 1-2 cards)
- [ ] Test expansion/collapse interactions
- [ ] Test mobile responsiveness (stats grid, card stacking)
- [ ] Test empty state trigger
- [ ] Fix any bugs or layout issues
- [ ] Validate against style guide

**Total Estimated Time:** ~5.5 hours

---

## 🧪 Test Scenarios

### **Test Case 1: Lee Harvey Oswald (Comprehensive)**

**Mock Data:**
```json
{
  "person_id": "3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8",
  "display_name": "Lee Harvey Oswald",
  "given_name": "Lee",
  "family_name": "Oswald",
  "birth_date": "1939-10-18",
  "death_date": "1963-11-24",
  "notes": "Former U.S. Marine who defected to the Soviet Union...",
  "aliases": [
    {"alias_name": "Alek James Hidell", "alias_type": "PRIMARY"},
    {"alias_name": "O.H. Lee", "alias_type": "SECONDARY"}
  ],
  "residences": [
    {"place": "New Orleans, LA", "address": "4907 Magazine St", "dates": "May-Sep 1963"},
    {"place": "Dallas, TX", "address": "Oak Cliff", "dates": "Oct-Nov 1963"}
  ],
  "organizations": [
    {"name": "U.S. Marine Corps", "dates": "1956-1959"},
    {"name": "Fair Play for Cuba Committee", "dates": "1963"},
    {"name": "Texas School Book Depository", "dates": "Oct-Nov 1963"}
  ],
  "family": [
    {"name": "Marina Nikolayevna Prusakova", "relation": "Spouse", "date": "m. Apr 1961"}
  ],
  "events": [
    {"date": "1959-09", "title": "USMC Discharge", "description": "..."},
    {"date": "1963-11-22", "title": "JFK Assassination", "description": "..."}
    // ... 9 total events
  ],
  "objects": [
    {"name": "Carcano Rifle", "type": "WEAPON"},
    {"name": "FPCC Membership Card", "type": "DOCUMENT"}
  ],
  "sources": [
    {"title": "Warren Commission Report", "type": "DOCUMENT", "year": 1964}
    // ... 47 total sources
  ],
  "identifiers": [
    {"type": "FBI_FILE", "value": "105-82555"}
  ]
}
```

**Expected Result:**
- ✅ Header shows name, dates, label
- ✅ 2 alias badges visible
- ✅ Stats show: Born Oct 1939, Died Nov 1963, Age 24, 47 Sources
- ✅ Cards shown: Biography, Chronology (9), Aliases (2), Residences (4), Organizations (3), Family (5), Events (12), Objects (7), Sources (47), Identifiers (3)
- ✅ Biography: Expanded
- ✅ Chronology: Expanded (≥ 3 events)
- ✅ All other cards: Collapsed
- ✅ Empty state: Hidden

---

### **Test Case 2: Ralph Yates (Minimal)**

**Mock Data:**
```json
{
  "person_id": "8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
  "display_name": "Yates, Ralph Leon",
  "given_name": "Ralph",
  "family_name": "Yates",
  "birth_date": "1928",
  "death_date": "1975",
  "notes": null,
  "aliases": [],
  "residences": [],
  "organizations": [
    {"name": "Texas Butchers Supply Co.", "dates": "1963"}
  ],
  "family": [],
  "events": [
    {"date": "1963-11-20", "title": "Yates Report", "description": "Reported hitchhiker"}
  ],
  "objects": [],
  "sources": [
    {"title": "FBI Interview", "type": "DOCUMENT", "year": 1963},
    {"title": "Affidavit", "type": "DOCUMENT", "year": 1963}
  ],
  "identifiers": []
}
```

**Expected Result:**
- ✅ Header shows name, dates
- ✅ No alias badges
- ✅ Stats show: Born 1928, Died 1975, Age 35, 2 Sources
- ✅ Cards shown: Organizations (1), Events (1), Sources (2)
- ✅ Cards hidden: Biography, Chronology, Aliases, Residences, Family, Objects, Identifiers
- ✅ All shown cards: Collapsed
- ✅ Empty state: Hidden (has 3 visible cards)

---

### **Test Case 3: John Smith (Fleeting Witness)**

**Mock Data:**
```json
{
  "person_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "display_name": "Smith, John",
  "given_name": "John",
  "family_name": "Smith",
  "birth_date": null,
  "death_date": null,
  "notes": null,
  "aliases": [],
  "residences": [],
  "organizations": [],
  "family": [],
  "events": [],
  "objects": [],
  "sources": [],
  "identifiers": []
}
```

**Expected Result:**
- ✅ Header shows name only
- ✅ Stats show: Born UNKNOWN, Died hidden, Age hidden, 0 Sources
- ✅ ALL cards hidden (no data)
- ✅ Empty state visible: "Limited archival data available for this person"

---

## 🚀 Next.js Migration Path

### **API Endpoint Structure**

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
        event (
          event_id,
          title,
          start_ts,
          event_type,
          description
        ),
        role_type
      )
    `)
    .eq('person_id', id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  // Transform data to match card registry expectations
  const transformedData = {
    ...person,
    aliases: person.person_alias || [],
    events: person.event_participant?.map(ep => ep.event) || [],
    // ... other transformations
  };

  return Response.json(transformedData);
}
```

### **Dynamic Route**

```
URL: /person?id=3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8
→ Loads person.html
→ JavaScript extracts personId from URL
→ Calls loadPersonProfile(personId)
→ Fetches /api/people/{personId}
→ Conditionally renders cards
```

---

## ✅ Success Criteria

1. **✅ Universal Template** - Single person.html works for ALL profiles
2. **✅ Graceful Degradation** - Missing data doesn't break layout
3. **✅ Conditional Rendering** - Only show cards with data
4. **✅ Chronology Prominence** - Auto-expands for comprehensive profiles
5. **✅ Mobile Responsive** - Stats grid adapts, cards stack naturally
6. **✅ Consistent Design** - Matches Primary Sources style guide
7. **✅ Expandable** - Easy to add new cards to registry
8. **✅ API Ready** - Designed for Next.js migration
9. **✅ No Errors** - Handles null/undefined data gracefully
10. **✅ Clear Empty State** - Communicates when data is limited

---

## 📦 Deliverables

1. ✅ `docs/ui/person.html` - Complete template with all 12+ card sections
2. ✅ `docs/ui/assets/js/person-profile.js` - Card registry + loading logic
3. ✅ `docs/ui/assets/js/person-cards.js` - All populate functions
4. ✅ Updated `db-logic.js` - Person data helpers
5. ✅ Test with 3 mock data scenarios
6. ✅ Documentation for adding new cards

---

## 🎯 How to Add New Cards (Future)

### **Step 1: Add to HTML**

```html
<section id="new-card-section" data-section="new-card" style="display:none;">
    <!-- Use standard card template -->
</section>
```

### **Step 2: Add to Registry**

```javascript
'new-card': {
  icon: 'icon_name',
  title: 'New Card Title',
  dataField: 'newCardData',
  autoExpand: false,
  showWhen: (data) => data.newCardData && data.newCardData.length > 0,
  populate: (data) => populateNewCard(data.newCardData)
}
```

### **Step 3: Create Populate Function**

```javascript
function populateNewCard(data) {
  const container = document.getElementById('new-card-content');
  // Build HTML from data
  container.innerHTML = buildNewCardHTML(data);
}
```

**Done!** Card automatically integrates with loading system.

---

## ⏱️ Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | 90 min | person.html complete |
| Phase 2 | 60 min | Core JS logic |
| Phase 3 | 90 min | All populate functions |
| Phase 4 | 30 min | Data integration |
| Phase 5 | 60 min | Testing & refinement |
| **Total** | **5.5 hours** | **Production-ready template** |

---

## 🚦 Status: READY TO BUILD

**Approval:** ✅ User approved component card library design
**Next Action:** Create person.html + JavaScript files
**Architecture:** ✅ Finalized
**Test Plan:** ✅ Defined

---

**Ready to proceed with implementation?**
