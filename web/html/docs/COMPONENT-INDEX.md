# Component Index — Primary Sources Web/HTML

**Generated:** 2026-02-25
**Purpose:** Master index of all HTML components, their usage patterns, and reusability mapping

---

## Table of Contents

1. [Component Types](#component-types)
2. [Reusable Components](#reusable-components)
3. [Page Inventory](#page-inventory)
4. [Component Reuse Matrix](#component-reuse-matrix)
5. [JavaScript Modules](#javascript-modules)
6. [CSS Architecture](#css-architecture)
7. [Quick Reference](#quick-reference)

---

## Component Types

### 1. Global Navigation Components

#### Header (`components/header.html`)
**Type:** Global Navigation
**Usage:** All pages
**Features:**
- Logo and site title with link to home
- Breadcrumb navigation (auto-updated per page)
- Search button
- Hamburger menu with collapsible categories
- Dropdown menu with 5 main categories:
  - Home & General
  - Content & Info
  - Browse Entities
  - Features
  - Tools (with subcategories)

**Implementation:**
```html
<header data-component="header" class="sticky top-0 z-50 w-full border-b border-archive-secondary/20 bg-archive-bg/95 backdrop-blur"></header>
```

**JavaScript Dependencies:**
- `collapsible-menu.js` — Dropdown menu interactions
- `nav.js` — Breadcrumb updates

---

#### Bottom Navigation (`components/bottom-nav.html`)
**Type:** Mobile Navigation
**Usage:** All pages
**Features:**
- Fixed 5-icon bottom navigation bar
- Active state indicator via `data-active` attribute
- Links: Home | People | Events | About | Links
- Material Symbols icons with labels

**Implementation:**
```html
<nav data-component="bottom-nav" data-active="Home" class="fixed bottom-0 z-50 w-full border-t border-archive-secondary/20 bg-archive-bg px-6 py-4"></nav>
```

**Critical Instruction:**
> DO NOT MODIFY THIS NAVIGATION STRUCTURE, ICONS, OR LINKS UNLESS EXPLICITLY INSTRUCTED BY THE USER.

---

#### Footer (`components/footer.html`)
**Type:** Global Footer
**Usage:** All pages
**Features:**
- Site branding with icon
- Disclaimer statement
- Footer links (Disclaimer, Privacy Policy, Terms, Contact)
- Copyright notice

**Implementation:**
```html
<div data-component="footer"></div>
```

---

### 2. Filter/Facet Components

#### Facet Bar (`components/facet-bar.html`)
**Type:** Filter UI
**Usage:** Entity index pages (person-index, event-index, etc.)
**Features:**
- Dynamic filter dropdowns injected via JavaScript
- Clear filters button (hidden until filters active)
- Configurable via `data-filters` attribute

**Implementation:**
```html
<section data-component="facet-bar"
         data-title="People"
         data-filters='{"Event": "../assets/data/events.json", "Organization": [...]}'
         class="bg-archive-dark px-6 py-8 border-b border-archive-secondary/20">
</section>
```

**JavaScript Dependencies:**
- `filter.js` — Filter logic and UI injection

---

### 3. Card Components

#### Animated Card (`components/animated-card.html`)
**Type:** Interactive Card
**Usage:** Feature roadmap pages, tool details pages
**Features:**
- Large background icon with hover effect
- Animated status badge (queue, planned, live)
- Conditional grayscale/opacity for "planned" status
- Optional link wrapper via `data-href`

**Implementation:**
```html
<div data-component="animated-card"
     data-icon="database"
     data-title="Commit to Database"
     data-desc="Phase 4 of the Extraction Workbench."
     data-status="queue"
     data-href="/tools/feature.html">
</div>
```

**Template ID:** `animated-card-template`
**JavaScript:** Inline self-contained script in component file

---

### 4. Tool-Specific Components

#### PDF Viewer Header (`components/pdf-viewer-header.html`)
**Type:** Tool Header
**Usage:** `tools/pdf-viewer/pdf-viewer-ui.html`
**Features:**
- Exit button
- Document title display
- Page navigation controls (prev/next)
- Page number input + total count
- Workbench toggle button
- Intelligence layer toggle
- Zoom controls (in/out/fit-width)

**Implementation:**
```html
<header class="pdf-viewer-header h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#2E282A] z-[110] relative shadow-xl">
```

**JavaScript Dependencies:**
- PDF viewer application script (tool-specific)

---

## Reusable Components

### Always Included (Global)

| Component | File | Used On | Load Method |
|-----------|------|---------|-------------|
| Header | `components/header.html` | All pages | `data-component="header"` |
| Bottom Nav | `components/bottom-nav.html` | All pages | `data-component="bottom-nav"` |
| Footer | `components/footer.html` | All pages | `data-component="footer"` |

**Load Mechanism:** `components.js` scans for `data-component` attributes and injects HTML via fetch

---

### Conditionally Included

| Component | File | Used On | Condition |
|-----------|------|---------|-----------|
| Facet Bar | `components/facet-bar.html` | Entity index pages | Index/browse pages only |
| Animated Card | `components/animated-card.html` | Feature/roadmap pages | Declarative via `data-component` |
| PDF Viewer Header | `components/pdf-viewer-header.html` | PDF viewer tool | Tool-specific app |

---

## Page Inventory

### Root Level

#### `index.html` (Home)
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (global, active: "Home")

**Page-Specific Elements:**
- Hero section with JFK timer
- Platform Features grid (3 cards: On This Day, Six Degrees, Witness Atlas)
- Browse by Category grid (6 cards: Events, People, Organizations, Sources, Places, Objects)
- Recently Added (dynamic event cards injected by `db-logic.js`)
- Analytical Tools grid (7 cards with "Live" badges)

**JavaScript:**
- `components.js`
- `nav.js`
- `db-logic.js`
- `collapsible-menu.js`
- `timer.js`

---

#### `search.html` (Global Search)
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (global)

**Page-Specific Elements:**
- Global search interface

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`
- `global-search.js` (assumed)

---

### Entities (Browse)

#### `entities/person/person-index.html`
**Components:**
- Header (global)
- Facet Bar (filters: Event, Organization)
- Footer (global)
- Bottom Nav (active: "People")

**Page-Specific Elements:**
- Directory of Personnel heading
- Dynamic person cards grid (`data-data-source="people"`)
- Load More Records button

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`
- `filter.js`

---

#### `entities/person/person-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (active: "People")

**Page-Specific Elements:**
- Person profile cards (12 cards: Biography, Chronology, Aliases, etc.)

**JavaScript:**
- `components.js`
- `nav.js`
- `person-profile.js`
- `person-cards.js`

---

#### `entities/event/event-index.html`
**Components:**
- Header (global)
- Facet Bar (filters configured for events)
- Footer (global)
- Bottom Nav (active: "Events")

**Page-Specific Elements:**
- Dynamic event cards grid
- Load More Records button

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`
- `filter.js`

---

#### `entities/event/event-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (active: "Events")

**Page-Specific Elements:**
- Event profile cards (9 cards: Context, Timeline, Participants, etc.)

**JavaScript:**
- `components.js`
- `nav.js`
- `event-profile.js`
- `event-cards.js`

---

#### `entities/organization/org-index.html`
**Components:**
- Header (global)
- Facet Bar
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Dynamic organization cards grid

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`
- `filter.js`

---

#### `entities/organization/org-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Organization profile cards (7 cards)

**JavaScript:**
- `components.js`
- `nav.js`
- `organization-profile.js`
- `organization-cards.js`

---

#### `entities/place/place-index.html`
**Components:**
- Header (global)
- Facet Bar
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Dynamic place cards grid

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`
- `filter.js`

---

#### `entities/place/place-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Place profile cards (7 cards)

**JavaScript:**
- `components.js`
- `nav.js`
- `place-profile.js`
- `place-cards.js`

---

#### `entities/object/object-index.html`
**Components:**
- Header (global)
- Facet Bar
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Dynamic object cards grid

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`
- `filter.js`

---

#### `entities/object/object-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Object profile cards (8 cards)

**JavaScript:**
- `components.js`
- `nav.js`
- `object-profile.js`
- `object-cards.js`

---

#### `entities/source/source-index.html`
**Components:**
- Header (global)
- Facet Bar
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Dynamic source cards grid

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`
- `filter.js`

---

#### `entities/source/source-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Source profile cards (8 cards)

**JavaScript:**
- `components.js`
- `nav.js`
- `source-profile.js`
- `source-cards.js`

---

### Exploration Features

#### `exploration/otd.html` (On This Day)
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- On This Day feature UI

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `exploration/random.html` (Six Degrees)
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Six Degrees feature UI

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `exploration/witness-atlas.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Witness Atlas feature UI

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

### Pages (Static Content)

#### `pages/about.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (active: "About")

**Page-Specific Elements:**
- Mission statement
- Editorial position
- How archive is organized (6 cards: Events, People, Organizations, Sources, Chronologies, Objects)
- Guiding principles (5 numbered items)

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `db-logic.js`

---

#### `pages/blog.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Blog post listing

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `pages/blog-post.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Individual blog post template

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`
- `blog-post.js`

---

#### `pages/features.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Vision & Roadmap content

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `pages/links.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (active: "Links")

**Page-Specific Elements:**
- External resource links

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

### Tools

#### `tools/tools-index.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Tools directory grid

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/ocr/ocr-ui.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav (active: "Tools")

**Page-Specific Elements:**
- Two-tab interface (Home, Guide)
- Drop zone for file upload
- Queue list with status indicators
- Process log output
- Settings panel (backend selection, output formats, OCR options)
- Modal overlay

**CSS:**
- `ocr-components.css` (custom)

**JavaScript:**
- `components.js`
- `collapsible-menu.js`
- `nav.js`
- `ocr-gui.js` (tool-specific)

---

#### `tools/ocr/ocr-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- OCR Tool details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/pdf-viewer/pdf-viewer-ui.html`
**Components:**
- PDF Viewer Header (tool-specific)

**Page-Specific Elements:**
- PDF canvas/viewer
- Workbench panel (toggleable)
- Intelligence layer (toggleable)

**CSS:**
- `pdf-viewer.css` (custom)

**JavaScript:**
- Tool-specific PDF rendering script

---

#### `tools/pdf-viewer/pdf-viewer-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- PDF Viewer details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/analyzer/analyzer-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Document Analyzer details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/citation/citation-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Citation Generator details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/matcher/matcher-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Entity Matcher details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/research/research-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Research Tools details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

#### `tools/classifier/classifier-ui.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Classifier Review tool UI

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`
- Tool-specific classifier script

---

#### `tools/classifier/classifier-details.html`
**Components:**
- Header (global)
- Footer (global)
- Bottom Nav

**Page-Specific Elements:**
- Classifier Review details/documentation

**JavaScript:**
- `components.js`
- `nav.js`
- `collapsible-menu.js`

---

## Component Reuse Matrix

### Component Usage by Page Type

| Component | Home | Entity Index | Entity Details | Pages | Tools | Exploration |
|-----------|------|--------------|----------------|-------|-------|-------------|
| Header | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Footer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bottom Nav | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Facet Bar | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Animated Card | ❌ | ❌ | ❌ | ❌ | ✅ (some) | ❌ |
| PDF Viewer Header | ❌ | ❌ | ❌ | ❌ | ✅ (PDF only) | ❌ |

---

### Component Reuse Count

| Component | Total Pages | % of Site |
|-----------|-------------|-----------|
| Header | 39 | 100% |
| Footer | 39 | 100% |
| Bottom Nav | 39 | 100% |
| Facet Bar | 6 | 15% |
| Animated Card | ~5 | 13% |
| PDF Viewer Header | 1 | 3% |

**Total HTML Pages:** 39

---

## JavaScript Modules

### Core Modules (Always Loaded)

#### `components.js`
**Purpose:** Component loader
**Functionality:**
- Scans DOM for `data-component` attributes
- Fetches component HTML from `components/` directory
- Injects component into placeholder elements
- Fires `componentLoaded` custom event

**Used On:** All pages

---

#### `nav.js`
**Purpose:** Navigation state management
**Functionality:**
- Updates breadcrumb navigation based on current page
- Handles active state for bottom navigation
- Manages header navigation highlighting

**Used On:** All pages

---

#### `collapsible-menu.js`
**Purpose:** Header dropdown menu interactions
**Functionality:**
- Toggles category expansion in header dropdown
- Manages chevron rotation animations
- Handles aria-expanded states

**Used On:** All pages (via header component)

---

### Feature-Specific Modules

#### `db-logic.js`
**Purpose:** Data fetching and card rendering
**Functionality:**
- Fetches JSON data from `assets/data/` directory
- Injects entity cards into grid containers
- Handles dynamic content population

**Used On:**
- `index.html`
- All entity index pages
- Some static pages

---

#### `filter.js`
**Purpose:** Filter and facet logic
**Functionality:**
- Parses `data-filters` attribute on facet-bar
- Generates filter dropdowns
- Handles filter state and clearing
- Filters displayed cards based on selection

**Used On:**
- All entity index pages (6 pages)

---

#### `timer.js`
**Purpose:** JFK assassination elapsed time counter
**Functionality:**
- Calculates years/months/days since Nov 22, 1963
- Updates timer display on page load

**Used On:**
- `index.html`

---

#### `global-search.js`
**Purpose:** Global search functionality
**Functionality:**
- Search interface logic
- Query handling

**Used On:**
- `search.html`

---

### Entity Profile Modules

#### `person-profile.js`
**Purpose:** Person detail page logic
**Used On:** `entities/person/person-details.html`

---

#### `person-cards.js`
**Purpose:** Person card component logic
**Used On:** `entities/person/person-details.html`

---

#### `event-profile.js`
**Purpose:** Event detail page logic
**Used On:** `entities/event/event-details.html`

---

#### `event-cards.js`
**Purpose:** Event card component logic
**Used On:** `entities/event/event-details.html`

---

#### `organization-profile.js`
**Purpose:** Organization detail page logic
**Used On:** `entities/organization/org-details.html`

---

#### `organization-cards.js`
**Purpose:** Organization card component logic
**Used On:** `entities/organization/org-details.html`

---

#### `place-profile.js`
**Purpose:** Place detail page logic
**Used On:** `entities/place/place-details.html`

---

#### `place-cards.js`
**Purpose:** Place card component logic
**Used On:** `entities/place/place-details.html`

---

#### `object-profile.js`
**Purpose:** Object detail page logic
**Used On:** `entities/object/object-details.html`

---

#### `object-cards.js`
**Purpose:** Object card component logic
**Used On:** `entities/object/object-details.html`

---

#### `source-profile.js`
**Purpose:** Source detail page logic
**Used On:** `entities/source/source-details.html`

---

#### `source-cards.js`
**Purpose:** Source card component logic
**Used On:** `entities/source/source-details.html`

---

#### `blog-post.js`
**Purpose:** Blog post rendering logic
**Used On:** `pages/blog-post.html`

---

### Tool-Specific Modules

#### `ocr-gui.js`
**Purpose:** OCR tool interface logic
**Used On:** `tools/ocr/ocr-ui.html`

---

## CSS Architecture

### Global Styles

#### `main.css`
**Purpose:** Global site styles
**Scope:** All pages
**Contains:**
- Archive design system variables
- Typography styles
- Utility classes
- Badge styles
- Button styles
- Card styles
- Common layout patterns

---

### Tool-Specific Styles

#### `ocr-components.css`
**Purpose:** OCR tool-specific styles
**Scope:** `tools/ocr/ocr-ui.html`
**Contains:**
- Drop zone styles
- Queue list styles
- Tab interface styles
- Settings panel styles
- Modal styles

---

#### `pdf-viewer.css`
**Purpose:** PDF viewer tool-specific styles
**Scope:** `tools/pdf-viewer/pdf-viewer-ui.html`
**Contains:**
- PDF canvas container styles
- Toolbar styles
- Workbench panel styles

---

## Quick Reference

### Component Loading Pattern

**Standard Component:**
```html
<div data-component="footer"></div>
```

**Component with Configuration:**
```html
<section data-component="facet-bar"
         data-title="People"
         data-filters='{"Event": [...], "Organization": [...]}'></section>
```

**Component with Active State:**
```html
<nav data-component="bottom-nav" data-active="Home"></nav>
```

---

### JavaScript Loading Pattern

**Standard Page:**
```html
<script src="assets/js/components.js" defer></script>
<script src="assets/js/nav.js" defer></script>
<script src="assets/js/collapsible-menu.js" defer></script>
```

**Entity Index Page:**
```html
<script src="assets/js/components.js" defer></script>
<script src="assets/js/collapsible-menu.js" defer></script>
<script src="assets/js/nav.js" defer></script>
<script src="assets/js/db-logic.js" defer></script>
<script src="assets/js/filter.js" defer></script>
```

**Entity Details Page:**
```html
<script src="assets/js/components.js" defer></script>
<script src="assets/js/nav.js" defer></script>
<script src="assets/js/[entity]-profile.js" defer></script>
<script src="assets/js/[entity]-cards.js" defer></script>
```

---

### Tailwind Config (Standard)

All pages include:
```javascript
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#B08B49",
                "archive-bg": "#2E282A",
                "archive-secondary": "#D4CFC7",
                "archive-heading": "#F0EDE0",
                "archive-dark": "#1A1718",
            },
            fontFamily: {
                "display": ["Oswald", "sans-serif"],
                "mono": ["Roboto Mono", "monospace"]
            },
            borderRadius: {
                "DEFAULT": "0", "lg": "0", "xl": "0", "full": "9999px"
            },
        },
    },
}
```

---

## Summary Statistics

### Component Distribution

| Category | Count |
|----------|-------|
| Global Components | 3 |
| Filter Components | 1 |
| Card Components | 1 |
| Tool-Specific Components | 1 |
| **Total Reusable Components** | **6** |

---

### Page Distribution

| Category | Count |
|----------|-------|
| Root Level | 2 |
| Entity Index Pages | 6 |
| Entity Detail Pages | 6 |
| Exploration Features | 3 |
| Static Pages | 5 |
| Tool Pages | 17 |
| **Total Pages** | **39** |

---

### JavaScript Module Distribution

| Category | Count |
|----------|-------|
| Core Modules | 3 |
| Feature-Specific | 4 |
| Entity Profile Modules | 12 |
| Tool-Specific | 1+ |
| **Total Modules** | **20+** |

---

### CSS File Distribution

| Category | Count |
|----------|-------|
| Global Stylesheets | 1 |
| Tool-Specific Stylesheets | 2 |
| **Total Stylesheets** | **3** |

---

## Maintenance Notes

### Global Component Changes

When modifying global components (`header.html`, `bottom-nav.html`, `footer.html`), changes will automatically propagate to all pages via `components.js` loader.

**No cache-busting required** — Components are fetched dynamically on page load.

---

### Adding New Pages

**Checklist for new pages:**
1. Include core JavaScript modules: `components.js`, `nav.js`, `collapsible-menu.js`
2. Add component placeholders: `data-component="header"`, `data-component="footer"`, `data-component="bottom-nav"`
3. Set `data-active` attribute on `bottom-nav` for active state
4. Include Tailwind config block
5. Link to `main.css`
6. Add page to this index

---

### Component Development Workflow

1. Create component HTML in `components/` directory
2. Use `<template>` tags for dynamic components (see `animated-card.html`)
3. Include inline JavaScript for self-contained components
4. Test component on target page via `data-component` attribute
5. Document in this index

---

## Contact

For questions about component architecture or reusability patterns, refer to:
- `html-migration.md` — Web migration documentation
- `CLAUDE.md` — AI assistant constraints (DO NOT MODIFY global components)

---

**Last Updated:** 2026-02-25
**Maintained By:** Primary Sources Development Team
