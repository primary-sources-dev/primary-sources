# Path Fix Plan - Option B: Add /docs/ui/ Prefix

**Date:** 2026-02-24
**Status:** 🔧 READY TO IMPLEMENT
**Branch:** refactor-site-structure

---

## Problem Statement

Server runs from **project root** (`primary-sources/`) but refactor assumes `docs/ui/` as web root.

**Current:**
- Server root: `http://localhost:8000/` → `primary-sources/`
- HTML files location: `primary-sources/docs/ui/`
- Paths like `/components/header.html` resolve to `primary-sources/components/` ❌
- Should resolve to: `primary-sources/docs/ui/components/` ✅

**Solution:**
Add `/docs/ui/` prefix to all absolute paths in JavaScript, HTML, and component files.

---

## Phase 1: Core JavaScript Files (2 files)

### 1.1 `assets/js/components.js`

**Current (Line 12):**
```javascript
const response = await fetch(`/components/${componentName}.html`);
```

**Change to:**
```javascript
const response = await fetch(`/docs/ui/components/${componentName}.html`);
```

**Impact:** Fixes header, footer, bottom-nav loading on all pages

---

### 1.2 `assets/js/db-logic.js`

**Lines 54-59 - Entity Links:**
```javascript
// CURRENT:
if (item.person_id) itemLink = `/entities/person.html?id=${item.person_id}`;
else if (item.event_id || item.id) itemLink = `/entities/event.html?id=${item.id || item.event_id}`;
else if (item.org_id) itemLink = `/entities/organization.html?id=${item.org_id}`;
else if (item.place_id) itemLink = `/entities/place.html?id=${item.place_id}`;
else if (item.object_id) itemLink = `/entities/object.html?id=${item.object_id}`;
else if (item.source_id) itemLink = `/entities/source.html?id=${item.source_id}`;

// CHANGE TO:
if (item.person_id) itemLink = `/docs/ui/entities/person.html?id=${item.person_id}`;
else if (item.event_id || item.id) itemLink = `/docs/ui/entities/event.html?id=${item.id || item.event_id}`;
else if (item.org_id) itemLink = `/docs/ui/entities/organization.html?id=${item.org_id}`;
else if (item.place_id) itemLink = `/docs/ui/entities/place.html?id=${item.place_id}`;
else if (item.object_id) itemLink = `/docs/ui/entities/object.html?id=${item.object_id}`;
else if (item.source_id) itemLink = `/docs/ui/entities/source.html?id=${item.source_id}`;
```

**Line 71 - PDF Viewer Link:**
```javascript
// CURRENT:
itemLink = `/ocr/pdf-viewer.html?file=${filePath}&page=${page}&search=${search}`;

// CHANGE TO:
itemLink = `/docs/ui/ocr/pdf-viewer.html?file=${filePath}&page=${page}&search=${search}`;
```

**Line 378 - OTD Event Link:**
```javascript
// CURRENT:
<a href="/entities/event.html?id=${item.id}" class="text-[10px]...">

// CHANGE TO:
<a href="/docs/ui/entities/event.html?id=${item.id}" class="text-[10px]...">
```

**Impact:** Fixes entity card clicks from homepage and OTD page

---

## Phase 2: Browse Pages (6 files)

All browse pages use relative path `assets/data/` which resolves incorrectly from subdirectories.

### Files to Update:
1. `browse/events.html`
2. `browse/people.html`
3. `browse/organizations.html`
4. `browse/places.html`
5. `browse/objects.html`
6. `browse/sources.html`

### Change Pattern:

**Find in each file:**
```html
data-source="assets/data/events.json"
data-filters='{"Event": "assets/data/events.json",...}'
```

**Replace with:**
```html
data-source="/docs/ui/assets/data/events.json"
data-filters='{"Event": "/docs/ui/assets/data/events.json",...}'
```

**Specific Changes Per File:**

#### `browse/events.html`
```html
<!-- Line ~51 -->
<div id="events-grid" ... data-source="assets/data/events.json">
→ data-source="/docs/ui/assets/data/events.json"
```

#### `browse/people.html`
```html
<!-- Line ~51 -->
data-filters='{"Event": "assets/data/events.json", ...}'
→ data-filters='{"Event": "/docs/ui/assets/data/events.json", ...}'
```

#### `browse/organizations.html`
```html
<!-- Line ~51 -->
data-filters='{"Event": "assets/data/events.json", ...}'
→ data-filters='{"Event": "/docs/ui/assets/data/events.json", ...}'
```

#### `browse/places.html`
```html
<!-- Line ~51 -->
data-source="assets/data/places.json"
→ data-source="/docs/ui/assets/data/places.json"
```

#### `browse/objects.html`
```html
<!-- Line ~51 -->
data-source="assets/data/objects.json"
→ data-source="/docs/ui/assets/data/objects.json"
```

#### `browse/sources.html`
```html
<!-- Line ~51 -->
data-source="assets/data/sources.json"
→ data-source="/docs/ui/assets/data/sources.json"
```

**Impact:** Fixes data loading on all browse pages

---

## Phase 3: Entity Profile Pages (6 files)

Check for any relative asset paths that need fixing.

### Files to Check:
1. `entities/person.html`
2. `entities/event.html`
3. `entities/organization.html`
4. `entities/place.html`
5. `entities/object.html`
6. `entities/source.html`

### Verification Needed:

**Check CSS/JS script tags:**
```html
<!-- Should all be absolute: -->
<link rel="stylesheet" href="/docs/ui/assets/css/main.css">
<script src="/docs/ui/assets/js/components.js"></script>
```

**Check data sources in profile scripts:**
- `person-profile.js` loads `/assets/data/people.json` → needs `/docs/ui/` prefix
- `event-profile.js` loads `/assets/data/events.json` → needs `/docs/ui/` prefix
- Similar for other profile scripts

**Action:** Search each file for:
- `href="assets/`
- `src="assets/`
- `data-source="assets/`
- Replace with `/docs/ui/assets/`

**Impact:** Ensures entity profile pages load correctly

---

## Phase 4: Entity Profile JavaScript Modules (6 files)

### Files to Update:
1. `assets/js/person-profile.js`
2. `assets/js/event-profile.js`
3. `assets/js/organization-profile.js`
4. `assets/js/place-profile.js`
5. `assets/js/object-profile.js`
6. `assets/js/source-profile.js`

### Change Pattern:

**Search for data fetch calls:**
```javascript
// CURRENT:
fetch('/assets/data/people.json')
fetch(`/assets/data/${dataFile}`)

// CHANGE TO:
fetch('/docs/ui/assets/data/people.json')
fetch(`/docs/ui/assets/data/${dataFile}`)
```

**Search for navigation links:**
```javascript
// CURRENT:
href="/browse/people.html"
href="/entities/person.html"

// CHANGE TO:
href="/docs/ui/browse/people.html"
href="/docs/ui/entities/person.html"
```

**Example from person-profile.js (line 439):**
```javascript
// CURRENT:
<a href="/browse/people.html" class="inline-flex...">

// CHANGE TO:
<a href="/docs/ui/browse/people.html" class="inline-flex...">
```

**Impact:** Fixes data loading and "Back to..." links in entity profiles

---

## Phase 5: Feature Pages (3 files)

### Files to Update:
1. `features/otd.html`
2. `features/random.html`
3. `features/witness-atlas.html`

### Check for:

**Asset references:**
```html
<!-- Should be absolute: -->
<link href="/docs/ui/assets/css/main.css">
<script src="/docs/ui/assets/js/components.js"></script>
```

**Data sources:**
```javascript
// Check inline scripts for data fetches
fetch('/assets/data/events.json') → fetch('/docs/ui/assets/data/events.json')
```

**Impact:** Ensures feature pages work correctly from subdirectory

---

## Phase 6: Component Files (2 files)

### 6.1 `components/header.html`

**Status:** ✅ **ALREADY FIXED** (user manually updated)

All links already use `/docs/ui/` prefix:
- `/docs/ui/index.html`
- `/docs/ui/browse/events.html`
- `/docs/ui/pages/about.html`
- `/docs/ui/tools/classifier-review.html`
- etc.

**No changes needed.**

---

### 6.2 `components/bottom-nav.html`

**Current (lines 7, 13, 19, 25, 31):**
```html
<a href="/index.html" ...>
<a href="/browse/people.html" ...>
<a href="/browse/events.html" ...>
<a href="/pages/about.html" ...>
<a href="/pages/links.html" ...>
```

**Change to:**
```html
<a href="/docs/ui/index.html" ...>
<a href="/docs/ui/browse/people.html" ...>
<a href="/docs/ui/browse/events.html" ...>
<a href="/docs/ui/pages/about.html" ...>
<a href="/docs/ui/pages/links.html" ...>
```

**Impact:** Fixes mobile bottom navigation across all pages

---

## Phase 7: Index and Search Pages (2 files)

### 7.1 `index.html`

**Check for:**
- Data source attributes: `data-source="/docs/ui/assets/data/events.json"`
- All script/link tags should already be correct (absolute paths)

**Verify inline data fetches:**
```javascript
// Any fetch() calls in inline scripts
fetch('/assets/data/events.json') → fetch('/docs/ui/assets/data/events.json')
```

---

### 7.2 `search.html`

**Check for:**
- Asset paths in head
- Data source attributes
- Any relative paths that need `/docs/ui/` prefix

---

## Phase 8: Additional JavaScript Files

### Files to Check:
- `assets/js/nav.js` - Navigation logic
- `assets/js/filter.js` - Filter/search functionality
- `assets/js/blog-post.js` - Blog post logic
- `assets/js/event-cards.js` - Event card rendering

### Pattern:
Search all for:
- `fetch('/assets/`
- `href="/entities/`
- `href="/browse/`
- `href="/pages/`
- `href="/features/`

Replace with `/docs/ui/` prefix.

---

## Implementation Checklist

### Phase 1: Core JavaScript ⚡ HIGH PRIORITY
- [ ] `assets/js/components.js` - Fix component loading
- [ ] `assets/js/db-logic.js` - Fix entity links and OTD links

### Phase 2: Browse Pages
- [ ] `browse/events.html` - Fix data source
- [ ] `browse/people.html` - Fix data source
- [ ] `browse/organizations.html` - Fix data source
- [ ] `browse/places.html` - Fix data source
- [ ] `browse/objects.html` - Fix data source
- [ ] `browse/sources.html` - Fix data source

### Phase 3: Entity Pages
- [ ] `entities/person.html` - Verify paths
- [ ] `entities/event.html` - Verify paths
- [ ] `entities/organization.html` - Verify paths
- [ ] `entities/place.html` - Verify paths
- [ ] `entities/object.html` - Verify paths
- [ ] `entities/source.html` - Verify paths

### Phase 4: Entity Profile Scripts
- [ ] `assets/js/person-profile.js` - Fix data fetches and links
- [ ] `assets/js/event-profile.js` - Fix data fetches and links
- [ ] `assets/js/organization-profile.js` - Fix data fetches and links
- [ ] `assets/js/place-profile.js` - Fix data fetches and links
- [ ] `assets/js/object-profile.js` - Fix data fetches and links
- [ ] `assets/js/source-profile.js` - Fix data fetches and links

### Phase 5: Feature Pages
- [ ] `features/otd.html` - Verify paths
- [ ] `features/random.html` - Verify paths
- [ ] `features/witness-atlas.html` - Verify paths

### Phase 6: Components
- [x] `components/header.html` - ✅ Already fixed
- [ ] `components/bottom-nav.html` - Fix navigation links

### Phase 7: Root Pages
- [ ] `index.html` - Verify data sources
- [ ] `search.html` - Verify paths

### Phase 8: Additional Scripts
- [ ] `assets/js/nav.js` - Check for path references
- [ ] `assets/js/filter.js` - Check for data fetches
- [ ] `assets/js/blog-post.js` - Check for path references
- [ ] `assets/js/event-cards.js` - Check for links

---

## Testing Plan

After each phase, test:

### Phase 1 Tests (Critical):
- [ ] Homepage loads with header and footer visible
- [ ] Hamburger menu works (collapsible categories)
- [ ] Click entity card → navigates to profile page (no 404)
- [ ] Browser console shows no 404 errors for components

### Phase 2 Tests:
- [ ] Navigate to each browse page
- [ ] Verify entity cards display
- [ ] Check browser console for 404 on data files
- [ ] Click entity card → profile page loads

### Phase 3 Tests:
- [ ] Navigate to each entity profile type
- [ ] Verify CSS/JS loads correctly
- [ ] Check browser console for asset 404s

### Phase 4 Tests:
- [ ] Entity profile pages display data
- [ ] "Back to [Entity Type]" links work
- [ ] Related entities section loads

### Phase 5 Tests:
- [ ] Feature pages load with header/footer
- [ ] Data displays correctly
- [ ] Links navigate properly

### Phase 6 Tests:
- [ ] Bottom navigation works on all pages
- [ ] All nav links navigate correctly

### Phase 8 Tests:
- [ ] Filter/search functionality works
- [ ] Navigation logic functions correctly

---

## Estimated Time

- **Phase 1 (Critical):** 10 minutes
- **Phase 2:** 15 minutes (6 files, simple find/replace)
- **Phase 3:** 10 minutes (verification, likely no changes)
- **Phase 4:** 20 minutes (6 files, multiple changes per file)
- **Phase 5:** 10 minutes (3 files, verification)
- **Phase 6:** 5 minutes (1 file, 5 changes)
- **Phase 7:** 5 minutes (verification)
- **Phase 8:** 15 minutes (search and replace)

**Total Estimated:** 90 minutes (1.5 hours)

---

## Success Criteria

✅ All pages load with header and footer visible
✅ Hamburger menu expands/collapses correctly
✅ Entity cards navigate to correct profile pages
✅ Browse pages display entity data
✅ Entity profiles load data correctly
✅ All navigation links work
✅ No 404 errors in browser console
✅ Bottom navigation works on mobile

---

## Rollback Plan

If issues arise:
```bash
# Revert to commit before path fixes
git reset --hard 621a82f

# Or create new branch from current commit
git checkout -b path-fix-backup
git checkout refactor-site-structure
```

---

## Notes

- Server must remain running from project root (`primary-sources/`)
- All absolute paths in `docs/ui/` must use `/docs/ui/` prefix
- Component loader is the most critical fix (Phase 1.1)
- Test incrementally after each phase
- Keep browser DevTools console open to catch 404s

---

**Ready to implement!** 🚀
