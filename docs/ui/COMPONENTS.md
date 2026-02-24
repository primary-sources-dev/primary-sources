# UI Components Reference

**Last Updated:** 2026-02-24

This document provides technical reference for modular UI components used across the Primary Sources project.

---

## Component Architecture

All components use a modular loading system via `components.js`:

```html
<div data-component="component-name"></div>
```

The component loader fetches `/components/component-name.html` and injects the content, then dispatches a `componentLoaded` event for JavaScript initialization.

---

## Available Components

### 1. Header (`header.html`)

**Usage:**
```html
<header data-component="header"
    class="sticky top-0 z-50 w-full border-b border-archive-secondary/20 bg-archive-bg/95 backdrop-blur"></header>
```

**Features:**
- Logo with link to homepage
- Search button
- Hamburger dropdown menu with 17 navigation links
- Breadcrumb navigation (shown on detail pages)

**Navigation Links (in order):**
1. Home
2. About
3. Blog
4. Events
5. People
6. Organizations
7. Places
8. Objects
9. Sources
10. Links
11. On This Day
12. Six Degrees
13. Witness Atlas
14. Vision & Roadmap
15. OCR Tool
16. Citation Generator
17. Document Analyzer
18. Entity Matcher
19. Research Tools

**Location:** `components/header.html`
**Pages Using:** All pages except PDF viewer (28 pages)

---

### 2. Facet Bar (`facet-bar.html`)

**Usage:**
```html
<section data-component="facet-bar"
    data-title="People"
    data-filters='{"Event": "assets/data/events.json", "Organization": ["All", "FBI", "DPD"]}'
    class="bg-archive-dark px-6 py-8 border-b border-archive-secondary/20">
</section>
```

**Features:**
- Dynamic multi-dropdown filtering
- Fetches filter options from JSON files or uses static arrays
- Sort dropdown (A-Z, Z-A, chronological for events)
- Clear filters button (appears when filters active)
- Auto-updates page heading based on active filter
- Groups results by organization when event filtered

**Required JavaScript:** `assets/js/filter.js` (must be loaded with `defer`)

**Data Attributes:**
- `data-title` - Page title (e.g., "People", "Events")
- `data-filters` - JSON object mapping filter labels to options
  - Static array: `"Organization": ["All", "FBI", "DPD"]`
  - Dynamic JSON: `"Event": "assets/data/events.json"`
- `data-with-date` - Optional flag to add date picker

**Filter Logic:**
- Each dropdown creates entries in `activeFilters` object
- Cards must have `data-filter-tags` attribute (pipe-separated lowercase values)
- Cards must have `data-search-index` attribute for search functionality
- Visible cards determined by matching ALL active filters

**Location:** `components/facet-bar.html`
**Pages Using:** people.html, events.html, organizations.html, places.html, objects.html, sources.html, links.html (7 pages)

**Known Issues Fixed:**
- **2026-02-24:** Fixed missing `wrapper.appendChild(selectWrapper)` in `createDropdown()` function (filter.js:165)
  - Dropdowns were created in memory but never appended to DOM
  - Resulted in invisible/non-rendering dropdowns
- **2026-02-24:** Removed erroneous `contents` class from `#filter-container` (facet-bar.html:6)
  - `display: contents` was removing the container box from layout

---

### 3. Footer (`footer.html`)

**Usage:**
```html
<div data-component="footer"></div>
```

**Features:**
- Project description
- Navigation links
- Legal disclaimer
- Copyright notice

**Location:** `components/footer.html`
**Pages Using:** All pages (28 pages)

---

### 4. Bottom Nav (`bottom-nav.html`)

**Usage:**
```html
<nav data-component="bottom-nav" data-active="People"
    class="fixed bottom-0 z-50 w-full border-t border-archive-secondary/20 bg-archive-bg px-6 py-4"></nav>
```

**Features:**
- Mobile-friendly fixed navigation
- 5 primary sections with icons
- Active state highlighting via `data-active` attribute

**Data Attributes:**
- `data-active` - Which section to highlight (e.g., "People", "Events", "About")

**Location:** `components/bottom-nav.html`
**Pages Using:** All pages (28 pages)

---

### 5. PDF Viewer Header (`pdf-viewer-header.html`)

**Usage:**
```html
<div data-component="pdf-viewer-header"></div>
```

**Features:**
- Page navigation (prev/next, page number input)
- Workbench toggles (Intelligence Layer, Extraction Workbench)
- Zoom controls (zoom in/out, fit width)
- Document title display

**Location:** `components/pdf-viewer-header.html`
**Pages Using:** pdf-viewer.html (1 page)

---

## JavaScript Initialization

### Component Loading Sequence

1. `components.js` loads on DOMContentLoaded
2. Finds all `[data-component]` elements
3. Fetches component HTML from `/components/{name}.html`
4. Injects HTML into element
5. Dispatches `componentLoaded` event with details:
   ```javascript
   {
     name: "component-name",
     element: domElement
   }
   ```

### Event Listeners

**`componentLoaded`** - Fired after component HTML injected
```javascript
document.addEventListener("componentLoaded", (e) => {
    if (e.detail.name === 'facet-bar') {
        // Initialize filters
    }
});
```

**`entitiesRendered`** - Fired after cards/data rendered (from db-logic.js)
```javascript
document.addEventListener("entitiesRendered", () => {
    // Re-apply filters/sort after data loads
});
```

**`otdFilterChanged`** - Custom event for On This Day date/scope changes
```javascript
document.dispatchEvent(new CustomEvent("otdFilterChanged", {
    detail: { scope: 'Day', date: dateObject }
}));
```

---

## Debugging Components

### Check Component Loading

Open browser console and run:
```javascript
document.querySelectorAll('[data-component]').forEach(el => {
    console.log(el.getAttribute('data-component'), el.classList.contains('component-loaded'));
});
```

### Check Facet Bar Initialization

```javascript
// Check if filter container exists
document.getElementById('filter-container')

// Check active filters
console.log(activeFilters) // Note: activeFilters is in closure scope

// Check if dropdowns were created
document.getElementById('filter-container').querySelectorAll('select')
```

### Common Issues

**Dropdowns not rendering:**
1. Check browser console for fetch errors
2. Verify `filter.js` is loaded (`<script src="assets/js/filter.js" defer></script>`)
3. Check `data-filters` JSON is valid (no syntax errors)
4. Verify `wrapper.appendChild(selectWrapper)` exists in `createDropdown()` (filter.js:165)

**Component not loading:**
1. Check path: `/components/{name}.html` must exist
2. Check network tab for 404 errors
3. Verify `components.js` is loaded with `defer`
4. Check console for JavaScript errors

**Filters not working:**
1. Cards must have `data-filter-tags` attribute
2. Tags must be lowercase and pipe-separated
3. Cards must have `data-search-index` for search
4. Check `applyFilters()` is called after `entitiesRendered`

---

## File Structure

```
docs/ui/
├── components/
│   ├── header.html           # Site header with navigation
│   ├── facet-bar.html        # Filter/sort component
│   ├── footer.html           # Site footer
│   ├── bottom-nav.html       # Mobile bottom navigation
│   └── pdf-viewer-header.html # PDF viewer toolbar
├── assets/
│   ├── js/
│   │   ├── components.js     # Component loader
│   │   ├── filter.js         # Facet bar logic
│   │   ├── db-logic.js       # Data fetching/rendering
│   │   ├── nav.js            # Navigation utilities
│   │   ├── person-profile.js # Person detail card registry
│   │   ├── person-cards.js   # Person card populate functions
│   │   ├── event-profile.js  # Event detail card registry
│   │   ├── event-cards.js    # Event card populate functions
│   │   ├── organization-profile.js # Org detail card registry
│   │   ├── organization-cards.js   # Org card populate functions
│   │   ├── place-profile.js  # Place detail card registry
│   │   ├── place-cards.js    # Place card populate functions
│   │   ├── object-profile.js # Object detail card registry
│   │   ├── object-cards.js   # Object card populate functions
│   │   ├── source-profile.js # Source detail card registry
│   │   └── source-cards.js   # Source card populate functions
│   └── css/
│       ├── main.css          # Global styles
│       ├── ocr-components.css # OCR tool styles
│       └── pdf-viewer.css    # PDF viewer styles
├── tools/
│   ├── ocr-features.html     # OCR tool info page
│   ├── pdf-viewer-features.html # PDF viewer info page
│   ├── document-analyzer.html # Document analyzer info page
│   ├── citation-generator.html # Citation generator info page
│   ├── entity-matcher.html   # Entity matcher info page
│   └── research-tools.html   # Research tools info page
```

---

## Version History

### 2026-02-24 (Late)
- **Updated:** Consolidated versioned JS files to canonical names
  - `person-v2-profile.js` → `person-profile.js`
  - `event-v1-profile.js` → `event-profile.js`
- **Updated:** Mock data aligned with Supabase schema (org_id, place_type, etc.)
- **Added:** All 12 entity profile JS files documented in file structure

### 2026-02-24 (Evening)
- **Added:** PDF Viewer Header component (`pdf-viewer-header.html`)
- **Added:** Entity Matcher and Research Tools to header navigation (now 19 links)
- **Added:** Six tool info pages in `tools/` directory
- **Added:** `pdf-viewer.css` stylesheet for PDF viewer
- **Updated:** Component page counts to 28 (added entity-matcher, research-tools)

### 2026-02-24
- **Fixed:** Facet bar dropdown rendering bug (filter.js:165)
- **Fixed:** Removed `contents` class from filter container (facet-bar.html:6)
- **Updated:** Header navigation with 17 links, added Blog link
- **Updated:** All navigation links use uniform styling

### 2026-02-23
- **Created:** Blog system with category filters (blog.html, blog-post.html)
- **Added:** Featured chip to blog filters

---

## See Also

- [STYLE-GUIDE.md](./STYLE-GUIDE.md) - Design tokens and patterns
- [ENTITY-AUDIT.md](../ENTITY-AUDIT.md) - Entity page audit and schema alignment
- [BLOG-TEMPLATE-README.md](../BLOG-TEMPLATE-README.md) - Blog system documentation
- [PERSON-TEMPLATE-README.md](../PERSON-TEMPLATE-README.md) - Person template documentation
- [EVENT-TEMPLATE-README.md](../EVENT-TEMPLATE-README.md) - Event template documentation
- [ORGANIZATION-TEMPLATE-README.md](../ORGANIZATION-TEMPLATE-README.md) - Organization template documentation
- [PLACE-TEMPLATE-README.md](../PLACE-TEMPLATE-README.md) - Place template documentation
- [OBJECT-TEMPLATE-README.md](../OBJECT-TEMPLATE-README.md) - Object template documentation
- [SOURCE-TEMPLATE-README.md](../SOURCE-TEMPLATE-README.md) - Source template documentation
