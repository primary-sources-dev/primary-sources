# UI Component Audit & Fix List
*Updated: 2026-02-24 — Pre-Next.js Migration*

---

## Page Component Matrix

| Page | Header | Hero | Footer | BottomNav | CSS | Scripts |
|------|--------|------|--------|-----------|-----|---------|
| **index.html** | modular | gradient dark | modular | modular | tailwind-prod.css | components, nav, db-logic |
| **pages/about.html** | modular | simple | modular | modular | tailwind-prod.css | components, nav, db-logic |
| **pages/blog.html** | modular | simple | modular | modular | tailwind-prod.css | components, nav |
| **entities/event/event-details.html** | modular | simple | modular | modular | tailwind-prod.css | components, nav, db-logic, event-* |
| **entities/event/event-index.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **pages/features.html** | modular | none | modular | modular | tailwind-prod.css | components, nav |
| **pages/links.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **entities/object/object-index.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **entities/organization/org-index.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **exploration/otd.html** | modular | none | modular | modular | tailwind-prod.css | components, nav |
| **tools/pdf-viewer/pdf-viewer-ui.html** | modular (pdf-viewer-header) | none | — | — | tailwind-prod.css + pdf-viewer.css | components |
| **tools/pdf-viewer/pdf-viewer-details.html** | modular | gradient dark | modular | modular | tailwind-prod.css | components, nav |
| **entities/person/person-index.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **entities/person/person-details.html** | modular | simple | modular | modular | tailwind-prod.css | components, nav, db-logic, person-* |
| **entities/place/place-index.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **exploration/random.html** | modular | none | modular | modular | tailwind-prod.css | components, nav |
| **search.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, global-search |
| **entities/source/source-index.html** | modular | none | modular | modular | tailwind-prod.css | components, nav, db-logic, filter |
| **exploration/witness-atlas.html** | modular | none | modular | modular | tailwind-prod.css | components, nav |
| **tools/ocr/ocr-ui.html** | modular | none | modular | modular | tailwind-prod.css + ocr-components.css | components, nav, ocr-gui |
| **tools/analyzer/analyzer-details.html** | modular | gradient dark | modular | modular | tailwind-prod.css | components, nav |
| **tools/citation/citation-details.html** | modular | gradient dark | modular | modular | tailwind-prod.css | components, nav |
| **tools/matcher/matcher-details.html** | modular | gradient dark | modular | modular | tailwind-prod.css | components, nav |
| **tools/research/research-details.html** | modular | gradient dark | modular | modular | tailwind-prod.css | components, nav |

---

## Hero Types Identified

| Type | Style | Pages |
|------|-------|-------|
| **Gradient Dark** | `bg-archive-dark py-12` + gradient overlays + badge + H1 + description + stat tags | index, tools/* |
| **Simple** | Lighter hero, often with profile card | about, blog, event, oswald, person |
| **None** | No hero section | events, features, links, objects, organizations, etc. |

---

## Components Inventory

| Component | Location | Used By |
|-----------|----------|---------|
| `header.html` | components/ | 28 pages (standard site header) |
| `footer.html` | components/ | 28 pages (standard site footer) |
| `bottom-nav.html` | components/ | 28 pages (mobile navigation) |
| `facet-bar.html` | components/ | Filter pages (sidebar filters) |
| `pdf-viewer-header.html` | components/ | pdf-viewer.html (toolbar with nav/zoom/workbench) |

---

## Inconsistencies to Fix Before Next.js

| Issue | Pages Affected | Fix | Priority | Status |
|-------|----------------|-----|----------|--------|
| ~~Hardcoded footer~~ | ~~random, witness-atlas~~ | ~~Convert to modular~~ | ~~High~~ | ✅ Fixed |
| ~~Missing bottom-nav~~ | ~~random, witness-atlas, ocr/index~~ | ~~Add modular component~~ | ~~High~~ | ✅ Fixed |
| ~~Missing footer~~ | ~~ocr/index~~ | ~~Add modular component~~ | ~~High~~ | ✅ Fixed |
| ~~Legacy standalone~~ | ~~pdf-viewer.html~~ | ~~Deprecate~~ | ~~Medium~~ | ✅ Clarified: pdf-viewer.html is the functional viewer (keep); info page moved to tools/pdf-viewer-features.html |
| ~~Custom CSS~~ | ~~ocr/index.html~~ | ~~Align with main.css~~ | ~~Medium~~ | ✅ Fixed: ocr-components.css now uses CSS variables from main.css |
| ~~Duplicate person pages~~ | ~~person.html, person-v2.html~~ | ~~Consolidate to single template~~ | ~~Low~~ | ✅ Fixed (person-v2 → person.html) |
| ~~Duplicate event pages~~ | ~~event.html, event-v1.html~~ | ~~Consolidate to single template~~ | ~~Low~~ | ✅ Fixed (event-v1 → event.html) |

---

## Script Dependencies

| Script | Purpose | Pages |
|--------|---------|-------|
| `components.js` | Loads modular components via `data-component` attribute | All modular pages |
| `nav.js` | Dynamic breadcrumbs + bottom-nav active state | All modular pages |
| `db-logic.js` | Database fetch/render for dynamic content | Data-driven pages |
| `filter.js` | Sidebar filtering logic | List pages (people, events, objects, etc.) |
| `ocr-gui.js` | OCR tool functionality | tools/ocr/ocr-ui.html |
| `global-search.js` | Search functionality | search.html |
| `person-profile.js` | Person detail rendering (card registry) | entities/person/person-details.html |
| `person-cards.js` | Person card components (populate functions) | entities/person/person-details.html |
| `event-profile.js` | Event detail rendering (card registry) | entities/event/event-details.html |
| `event-cards.js` | Event card components (populate functions) | entities/event/event-details.html |
| `organization-profile.js` | Organization detail rendering | entities/organization/org-details.html |
| `organization-cards.js` | Organization card components | entities/organization/org-details.html |
| `place-profile.js` | Place detail rendering | entities/place/place-details.html |
| `place-cards.js` | Place card components | entities/place/place-details.html |
| `object-profile.js` | Object detail rendering | entities/object/object-details.html |
| `object-cards.js` | Object card components | entities/object/object-details.html |
| `source-profile.js` | Source detail rendering | entities/source/source-details.html |
| `source-cards.js` | Source card components | entities/source/source-details.html |

---

## CSS Architecture

| File | Purpose | Notes |
|------|---------|-------|
| `main.css` | Source file for design system | Input for tailwind-prod.css |
| `tailwind-prod.css` | Compiled CSS with all utilities | Used by all pages |
| `ocr-components.css` | OCR tool styles | Uses CSS variables from main.css |
| `pdf-viewer.css` | PDF viewer styles | Uses CSS variables from main.css |

---

## Next.js Migration Recommendations

### 1. Create Shared Layout Components
```
components/
├── Layout.tsx              # Wraps all pages
├── Header.tsx              # From header.html
├── Footer.tsx              # From footer.html
├── BottomNav.tsx           # From bottom-nav.html
├── HeroGradient.tsx        # Gradient dark hero variant
├── HeroSimple.tsx          # Simple hero variant
├── FacetBar.tsx            # From facet-bar.html
└── PDFViewerHeader.tsx     # From pdf-viewer-header.html (standalone tool)
```

### 2. Consolidate Tailwind Config
Move inline `tailwind.config` to `tailwind.config.js`:
```js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#B08B49",
        "archive-bg": "#2E282A",
        "archive-secondary": "#D4CFC7",
        "archive-heading": "#F0EDE0",
        "archive-dark": "#1A1718",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0",
        lg: "0",
        xl: "0",
        full: "9999px",
      },
    },
  },
}
```

### 3. Page Templates
| Template | Use For |
|----------|---------|
| `ListPage` | people, events, objects, organizations, places, sources, links |
| `DetailPage` | person, event, object, source |
| `ToolInfoPage` | tools/* (informational pages) |
| `ToolAppPage` | ocr/index, pdf-viewer (functional tools) |
| `DiscoveryPage` | otd, random, witness-atlas |
| `ContentPage` | about, blog, features |

---

## Fix Checklist

- [x] Fix otd.html: Add modular footer + bottom-nav
- [x] Fix random.html: Add modular footer + bottom-nav
- [x] Fix witness-atlas.html: Add modular footer + bottom-nav
- [x] Fix ocr/index.html: Add modular footer + bottom-nav
- [x] Consolidate pdf-viewer info page to tools/pdf-viewer-features.html (pdf-viewer.html is the functional viewer, not legacy)
- [x] Align ocr-components.css with main.css design tokens (uses CSS variables)
- [x] Modularize pdf-viewer.html: extract header to component, CSS to pdf-viewer.css
- [x] Consolidate person.html + person-v2.html (person-v2 renamed to person.html, original archived)
- [x] Consolidate event.html + event-v1.html (event-v1 renamed to event.html, original archived)
- [x] Rename person-v2-profile.js → person-profile.js (original archived)
- [x] Rename person-v2-cards.js → person-cards.js (original archived)
- [x] Rename event-v1-profile.js → event-profile.js
- [x] Rename event-v1-cards.js → event-cards.js
- [x] Align baseline data with Supabase schema field names (org_id, place_type, object_type, source_type)
- [ ] Extract inline Tailwind config to shared file
