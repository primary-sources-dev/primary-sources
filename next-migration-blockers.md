# **Primary Sources UI Review: UX/UI Assessment**

---

## **✅ What's Working Well**

### 1. **Design System Maturity**
- ⭐ **Excellent Style Guide** (STYLE-GUIDE.md): Comprehensive tokens, clear rules, "Do Not" section
- ⭐ **Consistent Color Palette**: Gold (#B08B49) + dark neutrals creates professional archive aesthetic
- ⭐ **Typography Hierarchy**: Oswald (headings) + Roboto Mono (body) = clear information architecture
- ⭐ **CSS Variables**: Proper use of `--primary`, `--archive-bg` prevents Tailwind conflicts

### 2. **Component Architecture**
- ⭐ **Modular Components**: `[data-component]` pattern with `components.js` loader is smart
- ⭐ **FOUC Prevention**: Opacity transitions prevent flash of unstyled content
- ⭐ **Critical Comment**: "DO NOT MODIFY THIS NAVIGATION" in bottom-nav.html shows AI awareness
- ⭐ **Single Source of Truth**: Header and footer are reusable components

### 3. **Visual Polish**
- ⭐ **Hover States**: Icon fills (`bg-primary/10` → `bg-primary`), image grayscale transitions (700ms)
- ⭐ **Zero Border Radius**: Bold design choice, consistently enforced
- ⭐ **Left-Border Accent**: `border-l-4 border-primary` creates strong visual hierarchy
- ⭐ **Material Icons**: Semantic icons (calendar_month, groups, document_scanner)

### 4. **Information Architecture**
- ⭐ **Clear Categories**: Events, People, Places, Objects, Organizations, Sources
- ⭐ **Breadcrumbs**: Header shows Archive → Browse path (desktop only)
- ⭐ **Fixed Bottom Nav**: Mobile-first navigation with 5 key routes

---

## **❌ Critical Issues (Blockers for Next.js Migration)**

### 1. **Static Data Architecture**
**Problem**: Pages rely on hardcoded JSON files (`assets/data/events.json`) loaded via `db-logic.js`

**Why It's Critical**:
- Can't add new entities without editing JSON files
- No real-time updates from Supabase
- Data stale immediately after migration

**Fix Required**:
```javascript
// BEFORE (current)
fetch('assets/data/events.json')

// AFTER (Next.js migration)
fetch('/api/events')  // Dynamic Supabase query
```

**Files to Update**: `db-logic.js`, all browse pages

---

### 2. **Missing Search Functionality**
**Problem**: `search.html` exists but `global-search.js` is referenced (not found in review)

**Why It's Critical**:
- "Cross-reference 19,000+ records" claim but no backend
- Search input is placeholder-only
- Users cannot discover entities beyond browse

**Fix Required**:
- Implement PostgreSQL Full-Text Search
- Add `/api/search?q=` endpoint
- Real-time autocomplete for entity names

---

### 3. **Load More Pagination Stub**
**Problem**: "Load More Records" button exists but has no click handler

**Why It's Critical**:
- Will break with 100+ entities
- No offset/limit logic in `db-logic.js`

**Fix Required**:
```javascript
// Add to db-logic.js
let offset = 0;
const limit = 20;

loadMoreBtn.addEventListener('click', () => {
  offset += limit;
  fetch(`/api/events?offset=${offset}&limit=${limit}`)
    .then(res => res.json())
    .then(data => appendCards(data));
});
```

---

### 4. **Filter Bar Non-Functional**
**Problem**: `data-filters` attribute on `facet-bar` component, but no `filter.js` implementation

**Why It's Critical**:
- People page has Organization filters (FBI, Warren Commission, etc.)
- Events page has Type filters (SIGHTING, INTERVIEW, etc.)
- Zero filtering happens—all entities always visible

**Fix Required**:
- Implement client-side filtering OR
- Add `/api/events?type=SIGHTING` query params

---

## **⚠️ Major UX Gaps**

### 5. **No Empty States**
**Problem**: What happens when a filter returns 0 results? When search finds nothing?

**Impact**: User sees blank grid with no feedback

**Fix**:
```html
<div class="col-span-full py-20 text-center opacity-30">
  <span class="material-symbols-outlined text-6xl">search_off</span>
  <p class="text-xs uppercase tracking-[0.3em]">No results found for "query"</p>
  <a href="people.html" class="text-primary underline">View all people</a>
</div>
```

---

### 6. **Event Detail Page Dynamic Loading Broken**
**Problem**: `event.html` shows "LOADING TITLE..." placeholders but no URL query param handling

**Observation**:
```javascript
// event.html line 58
<h2 id="event-title">LOADING TITLE...</h2>
```

**Missing Logic**:
```javascript
// Should be:
const eventId = new URLSearchParams(window.location.search).get('id');
fetch(`/api/events/${eventId}`).then(...)
```

**Impact**: Event detail pages never populate—always show "LOADING..."

---

### 7. **Member Badge No Functionality**
**Problem**: PDF Viewer has "Member" badge (line 182 of index.html) but no auth gating

**Impact**: False promise—badge suggests restricted access that doesn't exist

**Fix Options**:
- Remove badge until auth is implemented OR
- Add `[data-auth-required]` attribute for Next.js middleware

---

### 8. **Mobile Navigation Overlap**
**Problem**: Fixed bottom nav + fixed header = content sandwich

**Observation**:
- Header: `sticky top-0`
- Bottom nav: `fixed bottom-0`
- Spacer: `<div class="h-24"></div>` at bottom

**Issue**: On short screens (iPhone SE), content area is ~300px

**Fix**:
```css
/* Add safe area insets */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Reduce spacer to 16px + nav height */
```

---

## **🔧 Minor UX Improvements**

### 9. **Dropdown Menu Keyboard Inaccessible**
**Problem**: Header dropdown uses `:hover` only (group-hover)

**Impact**: Keyboard users can't access menu

**Fix**:
```javascript
menuToggle.addEventListener('click', () => {
  dropdown.classList.toggle('open');
});
```

---

### 10. **No Loading States**
**Problem**: When `db-logic.js` fetches data, user sees empty grid

**Fix**: Add skeleton loaders
```html
<div class="skeleton-card animate-pulse">
  <div class="h-40 bg-archive-surface"></div>
  <div class="h-4 bg-archive-surface mt-2 w-3/4"></div>
</div>
```

---

### 11. **Recently Added Section Always Shows Same Data**
**Problem**: "Recently Added" (index.html line 156) is static JSON—never changes

**Fix**: Add `created_at` timestamp to entities, sort by DESC

---

### 12. **Breadcrumb Only Shows Current Page**
**Problem**: `#breadcrumb-current` (header.html line 15) is static "Browse"

**Fix**:
```javascript
// Set breadcrumb dynamically
document.getElementById('breadcrumb-current').textContent =
  document.title.split('—')[0].trim(); // "Browse People"
```

---

### 13. **Tool Cards Missing Status Indicators**
**Problem**: OCR Tool and PDF Viewer look identical (both gold)

**Suggestion**: Add status badges
- OCR Tool: `<span class="text-[8px] bg-green-500/20 text-green-400">LIVE</span>`
- PDF Viewer: `<span class="text-[8px] bg-primary/20 text-primary">MEMBER</span>` ✅ (already has this)

---

### 14. **Image Hover Timing Too Slow**
**Problem**: 700ms grayscale transition feels sluggish

**Perception**:
- 700ms = noticeable lag on fast interactions
- Industry standard: 200-300ms

**Fix**: Change `transition-700` to `transition-300` in card images

---

### 15. **No Entity Counts**
**Problem**: Category tiles show "Events", "People" but not "23 Events", "47 People"

**Impact**: User doesn't know archive size

**Fix**:
```html
<span class="font-bold text-archive-heading uppercase">Events</span>
<span class="text-[10px] text-archive-secondary/60">23 records</span>
```

---

## **📱 Responsive Issues**

### 16. **Grid Cols Inconsistency**
**Problem**:
- Index category grid: `grid-cols-2` (always 2)
- Browse pages: `grid-cols-1 md:grid-cols-2` (responsive)

**Fix**: Make index grid responsive too
```html
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
```

---

### 17. **Typography Breaks on Small Screens**
**Problem**: `text-4xl` + `uppercase` + `font-display` = line overflow on iPhone SE

**Example**: "WELCOME TO THE JFK PRIMARY SOURCES ARCHIVE" wraps poorly

**Fix**:
```html
<h2 class="text-3xl sm:text-4xl md:text-5xl ...">
```

---

### 18. **Desktop Bottom Nav Unnecessary**
**Problem**: Bottom nav is fixed on desktop (>768px) when header navigation exists

**Fix**:
```html
<nav class="md:hidden fixed bottom-0 ..."></nav>
```

---

## **🎨 Design Refinements**

### 19. **Icon Sizes Inconsistent**
**Problem**:
- Category tiles: `text-2xl` (organizations)
- Category tiles: default size (others)

**Example**: index.html line 113 vs line 104

**Fix**: Standardize all to `text-2xl` OR default (pick one)

---

### 20. **Gold Overuse in Tools Section**
**Problem**: "Analytical Tools" section (index.html line 163) uses `border-primary/40 bg-primary/5`

**Impact**: Makes tools look "more important" than entity categories

**Suggestion**: Keep neutral borders, only highlight icon on hover

---

### 21. **Hero Gradient Subtle to Invisible**
**Problem**: `from-primary/5` gradient (index.html line 55) is imperceptible on dark bg

**Suggestion**: Increase to `from-primary/10` OR add subtle radial gradient

---

### 22. **Footer Missing (Assumed)**
**Problem**: `[data-component="footer"]` referenced but component not reviewed

**Assumption**: If missing, add:
- Copyright
- External links (NARA, Mary Ferrell Foundation)
- Privacy/Terms (for member features)

---

## **🚀 Migration Readiness Checklist**

Before migrating to Next.js:

| Item | Status | Priority |
|------|--------|----------|
| Replace static JSON with API calls | ❌ Not Started | CRITICAL |
| Implement search functionality | ❌ Not Started | CRITICAL |
| Add pagination logic | ❌ Not Started | HIGH |
| Fix event detail page loading | ❌ Not Started | HIGH |
| Implement filter bar | ❌ Not Started | HIGH |
| Add empty states | ❌ Not Started | MEDIUM |
| Keyboard accessibility (dropdown) | ❌ Not Started | MEDIUM |
| Loading skeletons | ❌ Not Started | MEDIUM |
| Entity counts on tiles | ❌ Not Started | LOW |
| Responsive tweaks | ❌ Not Started | LOW |

---

## **💡 Next Steps Recommendations**

### **Immediate (Before Next.js Migration)**
1. **Mock API Endpoints**: Create `/api/events`, `/api/people` stubs that return static JSON
2. **Update `db-logic.js`**: Change all `fetch('assets/data/...')` to `fetch('/api/...')`
3. **Test Dynamic Loading**: Verify event.html populates from URL params

### **Phase 1 (Next.js Setup)**
1. **Create API Routes**: `app/api/events/route.ts` connecting to Supabase
2. **Implement Search**: Add full-text search endpoint
3. **Add Pagination**: Offset/limit support in API + frontend

### **Phase 2 (UX Polish)**
1. **Empty States**: All browse pages
2. **Loading States**: Skeleton cards
3. **Filter Bar**: Client-side OR server-side filtering

---

## **Final Assessment**

**HTML Mockup Quality: 8.5/10**
- Excellent design system
- Clean component architecture
- Consistent visual language
- **Missing**: Dynamic data, search, pagination

**Migration Readiness: 6/10**
- Solid foundation
- Needs API integration work
- JavaScript refactoring required

**Recommendation**:
1. Fix critical blockers (#1-#4) BEFORE migration
2. Use Next.js App Router for API routes
3. Keep existing HTML as templates (99% reusable!)

---

**Review Date**: 2026-02-23
**Reviewed By**: Claude Code (Sonnet 4.5)
