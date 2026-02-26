# Card Component Inventory

**Generated:** 2026-02-26  
**Location:** `web/html/`

---

## Card Types by Category

### 1. Modular Component Card

| File | Card Name | Description |
|------|-----------|-------------|
| `components/animated-card.html` | **Animated Card** | Priority/roadmap card with large background icon, animated badge, hover effects. Statuses: `queue`, `planned`, `live` |

---

### 2. Entity Index Cards (used on browse/listing pages)

| File | Purpose |
|------|---------|
| `assets/js/db-logic.js` | **Generic Entity Card** - Universal card renderer for all entity types (events, people, orgs, places, objects, sources). Auto-detects entity type and builds appropriate link. |

---

### 3. Person Profile Cards (`assets/js/person-cards.js`)

| # | Card Name | Function | Data Field |
|---|-----------|----------|------------|
| 1 | Biography | `populateBiography()` | `notes` |
| 2 | Chronology | `populateChronology()` | `events` (timeline) |
| 3 | Aliases | `populateAliases()` | `aliases` |
| 4 | Residences | `populateResidences()` | `residences` |
| 5 | Organizations | `populateOrganizations()` | `organizations` |
| 6 | Family | `populateFamily()` | `family` |
| 7 | Related Events | `populateEvents()` | `events` |
| 8 | Objects | `populateObjects()` | `objects` |
| 9 | Primary Sources | `populateSources()` | `sources` |
| 10 | External Identifiers | `populateIdentifiers()` | `identifiers` |

---

### 4. Event Profile Cards (`assets/js/event-cards.js`)

| # | Card Name | Function | Data Field |
|---|-----------|----------|------------|
| 1 | Context & Background | `populateContext()` | `context` |
| 2 | Timeline/Sub-events | `populateTimeline()` | `subEvents` |
| 3 | Participants | `populateParticipants()` | `participants` |
| 4 | Locations | `populateLocations()` | `locations` |
| 5 | Objects | `populateObjects()` | `objects` |
| 6 | Sources | `populateSources()` | `sources` |

---

### 5. Other Entity Profile Cards

| File | Entity Type |
|------|-------------|
| `assets/js/place-cards.js` | Place profiles |
| `assets/js/object-cards.js` | Object profiles |
| `assets/js/organization-cards.js` | Organization profiles |
| `assets/js/source-cards.js` | Source profiles |

---

### 6. Tool-Specific Cards

| File | Card Type |
|------|-----------|
| `tools/classifier/classifier-ui.html` | **Classification Card** - Page-by-page document classification with confidence scores |
| `pages/blog.html` | **Blog Post Card** - Blog listing cards |

---

### 7. Homepage Dashboard Cards (`index.html`)

- **Feature Cards** (On This Day, Six Degrees, Witness Atlas) - use `animated-card` component
- **Tool Cards** (OCR, PDF Viewer, etc.) - inline card styling with "Live" badges
- **Recently Added Cards** - dynamic event cards via `db-logic.js`

---

## Summary

**Total: ~30+ distinct card types** across the component library.

### Card Design Patterns

All cards follow the archival aesthetic:
- Dark backgrounds (`bg-[#252021]/60` or `bg-archive-dark`)
- Gold accent borders on hover (`border-primary`)
- Uppercase tracking-wide typography
- Material Symbols icons in primary color
- Consistent padding and spacing
