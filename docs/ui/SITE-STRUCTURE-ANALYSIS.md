# Site Structure Analysis & Normalization Plan

**Date:** 2026-02-24
**Current Status:** INCONSISTENT — Mixed path conventions causing navigation issues

---

## Current Structure Issues

### 1. **Root Directory Clutter** (23 HTML files at `/docs/ui/`)

**Entity Templates** (should be in `/templates/` or `/entities/`)
```
person.html
event.html
organization.html
place.html
object.html
source.html
```

**List/Browse Pages** (should be in `/browse/` or stay at root)
```
people.html
events.html
organizations.html
places.html
objects.html
sources.html
```

**Feature Pages** (should be in `/features/`)
```
otd.html          (On This Day)
random.html       (Six Degrees)
witness-atlas.html
search.html
```

**Content Pages** (should be in `/pages/` or stay at root)
```
about.html
blog.html
blog-post.html
links.html
features.html
index.html
```

**Utility Pages** (should be in `/tools/` or `/utilities/`)
```
pdf-viewer.html
oswald.html       (Special case - person override)
```

**Orphaned/Duplicate Files**
```
classifier-review.html    ⚠️ DUPLICATE - also exists in /tools/
```

---

### 2. **Path Reference Inconsistencies**

#### **Header Component (`components/header.html`)**
- **Lines 3, 20:** Relative paths → `index.html`, `search.html`
- **Lines 33-71:** Absolute paths → `/index.html`, `/tools/citation-generator.html`

❌ **Problem:** Mixed path conventions break navigation when components are loaded from different depths

#### **Entity Pages (e.g., `person.html`)**
- **Assets:** Relative paths → `assets/css/main.css`, `assets/js/components.js`
- **Navigation:** Relative paths → `index.html`, `people.html`

❌ **Problem:** Works from root but breaks from subdirectories

#### **Tools Pages (e.g., `tools/classifier-review.html`)**
- **Assets:** Absolute paths → `/assets/js/components.js`, `/assets/js/nav.js`
- **Assets (CSS):** Relative paths → `../assets/css/main.css`

❌ **Problem:** Mixed absolute/relative creates confusion

---

### 3. **Directory Organization**

**Current Subdirectories:**
```
/docs/ui/
├── archived/          ✅ Good - stores old versions
├── assets/           ✅ Good - CSS, JS, data, documents
│   ├── css/
│   ├── data/
│   ├── documents/
│   └── js/
├── components/       ✅ Good - reusable HTML components
├── ocr/              ⚠️ Partial - only has index.html, should have all OCR pages
│   └── plans/
├── templates/        ❓ Unknown contents
└── tools/            ✅ Good - 7 tool documentation pages
```

**Missing Subdirectories:**
```
/browse/       (for entity list pages: people.html, events.html, etc.)
/entities/     (for entity templates: person.html, event.html, etc.)
/features/     (for feature pages: otd.html, random.html, witness-atlas.html)
/pages/        (for static content: about.html, blog.html, links.html)
```

---

## Normalization Recommendations

### **Option A: Minimal Reorganization (Safest)**

**Goal:** Fix path inconsistencies without moving files

1. **Standardize All Paths to Absolute (Root-Relative)**
   - Change ALL asset references to `/assets/...`
   - Change ALL page links to `/page-name.html` or `/subdir/page.html`
   - Update header component to use absolute paths everywhere
   - Update all entity templates to use absolute paths

2. **Remove Duplicate Files**
   - Delete `/docs/ui/classifier-review.html` (keep version in `/tools/`)

3. **Document Current Structure**
   - Create `/docs/ui/README.md` explaining file organization
   - Add comments in header component explaining path conventions

**Effort:** Low (2-3 hours)
**Risk:** Low
**Benefit:** Navigation works consistently across all pages

---

### **Option B: Full Reorganization (Cleanest)**

**Goal:** Organize pages by function, standardize paths

#### **Proposed Structure:**
```
/docs/ui/
├── index.html                    (homepage - stays at root)
├── search.html                   (global search - stays at root)
│
├── assets/                       (no changes)
│   ├── css/
│   ├── data/
│   ├── documents/
│   └── js/
│
├── components/                   (no changes)
│   ├── header.html
│   ├── footer.html
│   └── bottom-nav.html
│
├── pages/                        ⭐ NEW - static content
│   ├── about.html
│   ├── blog.html
│   ├── blog-post.html
│   ├── links.html
│   └── features.html
│
├── browse/                       ⭐ NEW - entity list pages
│   ├── people.html
│   ├── events.html
│   ├── organizations.html
│   ├── places.html
│   ├── objects.html
│   └── sources.html
│
├── entities/                     ⭐ NEW - entity detail templates
│   ├── person.html
│   ├── event.html
│   ├── organization.html
│   ├── place.html
│   ├── object.html
│   ├── source.html
│   └── oswald.html              (special override)
│
├── features/                     ⭐ NEW - interactive features
│   ├── otd.html
│   ├── random.html
│   └── witness-atlas.html
│
├── tools/                        (no changes - already organized)
│   ├── citation-generator.html
│   ├── classifier-review.html
│   ├── document-analyzer.html
│   ├── entity-matcher.html
│   ├── ocr-features.html
│   ├── pdf-viewer-features.html
│   └── research-tools.html
│
├── ocr/                          (expand - move OCR-related pages here)
│   ├── index.html
│   ├── pdf-viewer.html          ⭐ MOVED from root
│   └── plans/
│
├── archived/                     (no changes)
└── templates/                    (verify contents)
```

#### **Implementation Steps:**

1. **Create New Directories**
   ```bash
   mkdir -p docs/ui/pages
   mkdir -p docs/ui/browse
   mkdir -p docs/ui/entities
   mkdir -p docs/ui/features
   ```

2. **Move Files**
   ```bash
   # Static content
   mv docs/ui/{about,blog,blog-post,links,features}.html docs/ui/pages/

   # Browse pages
   mv docs/ui/{people,events,organizations,places,objects,sources}.html docs/ui/browse/

   # Entity templates
   mv docs/ui/{person,event,organization,place,object,source,oswald}.html docs/ui/entities/

   # Features
   mv docs/ui/{otd,random,witness-atlas}.html docs/ui/features/

   # OCR
   mv docs/ui/pdf-viewer.html docs/ui/ocr/

   # Remove duplicate
   rm docs/ui/classifier-review.html
   ```

3. **Update All Path References**
   - Header component: `/pages/about.html`, `/browse/people.html`, `/entities/person.html`
   - Index.html cards: Update all links to new paths
   - Bottom nav: Update navigation links
   - All assets: Standardize to `/assets/...`

4. **Update JavaScript Loaders**
   - Modify `assets/js/components.js` to handle new paths
   - Update `assets/js/nav.js` breadcrumb logic

5. **Test All Navigation**
   - Verify header dropdown links work
   - Verify bottom nav works
   - Verify breadcrumbs work
   - Verify asset loading from all subdirectories

**Effort:** High (8-10 hours)
**Risk:** Medium (potential for broken links during transition)
**Benefit:** Clean, scalable, maintainable structure

---

### **Option C: Hybrid Approach (Recommended)**

**Goal:** Keep commonly-linked pages at root, organize the rest

#### **Structure:**
```
/docs/ui/
├── index.html              (root - most visited)
├── search.html             (root - global utility)
├── people.html             (root - high traffic)
├── events.html             (root - high traffic)
├── organizations.html      (root - high traffic)
├── places.html             (root - high traffic)
├── objects.html            (root - high traffic)
├── sources.html            (root - high traffic)
│
├── pages/                  ⭐ NEW
│   ├── about.html
│   ├── blog.html
│   ├── blog-post.html
│   ├── links.html
│   └── features.html
│
├── entities/               ⭐ NEW
│   └── [all entity templates]
│
├── features/               ⭐ NEW
│   ├── otd.html
│   ├── random.html
│   └── witness-atlas.html
│
├── tools/                  (no changes)
├── ocr/                    (expand)
├── components/             (no changes)
├── assets/                 (no changes)
└── archived/               (no changes)
```

**Implementation:**
1. Move entity **templates** to `/entities/` (person.html, event.html, etc.)
2. Keep entity **list pages** at root (people.html, events.html, etc.)
3. Move static content to `/pages/`
4. Move features to `/features/`
5. Standardize ALL paths to absolute (`/assets/...`, `/pages/about.html`, `/entities/person.html`)
6. Delete duplicate classifier-review.html

**Effort:** Medium (4-6 hours)
**Risk:** Low-Medium
**Benefit:** Balance between organization and URL simplicity

---

## Critical Path Issues to Fix Immediately

### 1. **Header Component Path Inconsistency**
**File:** `docs/ui/components/header.html`

**Current:**
```html
<a href="index.html" class="flex items-center gap-2">  <!-- Line 3: RELATIVE -->
<a href="/index.html"                                   <!-- Line 33: ABSOLUTE -->
```

**Fix:** Standardize to absolute paths
```html
<a href="/index.html" class="flex items-center gap-2">  <!-- Consistent -->
<a href="/search.html"                                   <!-- Consistent -->
```

---

### 2. **Duplicate classifier-review.html**
**Issue:** File exists in TWO locations
- `/docs/ui/classifier-review.html` (313KB - large, likely the working tool)
- `/docs/ui/tools/classifier-review.html` (19KB - documentation page)

**Fix:**
- Verify which is correct (likely the tools version is docs, root version is the tool itself)
- Rename root version to `/docs/ui/ocr/classifier-review-tool.html` (if it's the actual tool)
- OR delete root version if it's a duplicate

---

### 3. **Asset Path References in Entity Pages**
**Files:** `person.html`, `event.html`, etc.

**Current:**
```html
<link rel="stylesheet" href="assets/css/main.css">     <!-- RELATIVE -->
<script src="assets/js/components.js" defer></script>  <!-- RELATIVE -->
```

**Problem:** Breaks when entity templates moved to `/entities/` subdirectory

**Fix:** Standardize to absolute
```html
<link rel="stylesheet" href="/assets/css/main.css">
<script src="/assets/js/components.js" defer></script>
```

---

## Path Standardization Rules

### **Adopt Consistent Convention:**

#### **✅ RECOMMENDED: Root-Relative Absolute Paths**
```html
<!-- Assets -->
<link rel="stylesheet" href="/assets/css/main.css">
<script src="/assets/js/components.js"></script>

<!-- Internal Pages -->
<a href="/index.html">Home</a>
<a href="/pages/about.html">About</a>
<a href="/browse/people.html">People</a>
<a href="/entities/person.html?id=123">Person Profile</a>
<a href="/tools/citation-generator.html">Citation Generator</a>

<!-- Components -->
<header data-component="header"></header>
```

**Benefits:**
- Works from ANY subdirectory depth
- Clear intent (starting from web root)
- Easy to refactor/move files
- Consistent across entire site

---

#### **❌ AVOID: Relative Paths**
```html
<!-- BAD - Breaks when moved to subdirectories -->
<link rel="stylesheet" href="assets/css/main.css">
<a href="index.html">Home</a>
<script src="assets/js/components.js"></script>

<!-- BAD - Hard to maintain -->
<link rel="stylesheet" href="../assets/css/main.css">
<link rel="stylesheet" href="../../assets/css/main.css">
```

---

## Testing Checklist

After implementing any normalization:

- [ ] Load index.html - verify all assets load
- [ ] Click header logo - verify returns to home
- [ ] Click each dropdown menu item - verify all pages load
- [ ] Load person.html?id=oswald - verify entity template works
- [ ] Load people.html - verify list page works
- [ ] Load tools/citation-generator.html - verify tool docs load
- [ ] Load ocr/index.html - verify OCR tool loads
- [ ] Click bottom nav items - verify navigation works
- [ ] Open browser console - verify NO 404 errors for assets
- [ ] Test breadcrumbs - verify correct paths display
- [ ] Test from different page depths - verify consistent behavior

---

## Recommended Action Plan

### **Phase 1: Immediate Fixes (Do This Week)**
1. ✅ Fix header component path inconsistencies (use absolute paths)
2. ✅ Standardize asset references in all entity templates (use absolute paths)
3. ✅ Delete or relocate duplicate classifier-review.html
4. ✅ Test navigation from all page types

**Effort:** 2-3 hours
**Risk:** Low
**Impact:** Fixes broken navigation

---

### **Phase 2: Light Reorganization (Next Sprint)**
1. Create `/pages/` directory
2. Move static content (about, blog, links, features) to `/pages/`
3. Create `/entities/` directory
4. Move entity templates (person, event, organization, place, object, source) to `/entities/`
5. Update all links in header, index, and bottom nav
6. Test thoroughly

**Effort:** 4-6 hours
**Risk:** Medium
**Impact:** Cleaner structure, easier to maintain

---

### **Phase 3: Full Normalization (Future)**
1. Create `/browse/` and `/features/` directories
2. Move remaining pages to appropriate subdirectories
3. Update all internal links sitewide
4. Create site structure documentation
5. Add path validation tests

**Effort:** 8-10 hours
**Risk:** Medium-High
**Impact:** Professional, scalable site architecture

---

## File Inventory Summary

**Total HTML Files:** 42
**Root Level:** 23 (too many)
**Subdirectories:** 19
**Duplicates:** 1 (classifier-review.html)
**Orphaned:** 2 (oswald.html, pdf-viewer.html)

**Recommended Target:**
- **Root Level:** 8-10 high-traffic pages
- **Subdirectories:** 32-34 organized by function
- **Duplicates:** 0
- **Orphaned:** 0 (all files have clear purpose/location)

---

## Questions for Decision

1. **Do you want to keep entity list pages at root for SEO?**
   `/people.html` vs `/browse/people.html`

2. **Should classifier-review.html be a tool or documentation?**
   If tool → `/ocr/classifier-review.html`
   If docs → `/tools/classifier-review.html`

3. **What is oswald.html?**
   Person override? If so → `/entities/oswald.html`
   Special page? If so → document purpose

4. **Should we maintain old URLs with redirects?**
   If moving files, add `.htaccess` or meta redirects from old paths

5. **Preferred implementation: Option A, B, or C?**
   - A: Fix paths only (low effort)
   - B: Full reorganization (cleanest)
   - C: Hybrid (recommended)

---

## Next Steps

**Immediate (Today):**
1. Review this analysis
2. Answer decision questions above
3. Choose Option A, B, or C

**This Week:**
1. Implement Phase 1 fixes (path standardization)
2. Test navigation thoroughly
3. Document any issues found

**Next Sprint:**
1. Implement chosen reorganization plan
2. Update all internal links
3. Create site structure documentation
4. Add validation tests

---

**Contact:** Ready to proceed with selected approach. Recommend starting with Option A (path fixes) immediately, then Option C (hybrid reorganization) next sprint.
