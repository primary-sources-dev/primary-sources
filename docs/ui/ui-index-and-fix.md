# UI Component Audit & Fix List
*Updated: 2026-02-24 — Pre-Next.js Migration*

---

## Page Component Matrix

| Page | Header | Hero | Footer | BottomNav | CSS | Scripts |
|------|--------|------|--------|-----------|-----|---------|
| **index.html** | modular | gradient dark | modular | modular | main.css | components, nav, db-logic |
| **about.html** | modular | simple | modular | modular | main.css | components, nav, db-logic |
| **blog.html** | modular | simple | modular | modular | main.css | components, nav |
| **blog-post.html** | modular | none | modular | modular | main.css | components, nav, blog-post |
| **event.html** | modular | none | modular | modular | main.css | components, nav, db-logic |
| **event-v1.html** | modular | simple | modular | modular | main.css | components, nav, db-logic, event-v1-* |
| **events.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **features.html** | modular | none | modular | modular | main.css | components, nav |
| **links.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **objects.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **organizations.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **oswald.html** | modular | simple | modular | modular | main.css | components, nav, db-logic |
| **otd.html** | modular | none | modular | modular | main.css | components, nav |
| **pdf-viewer.html** | modular (pdf-viewer-header) | none | — | — | main.css + pdf-viewer.css | components |
| **tools/pdf-viewer-features.html** | modular | gradient dark | modular | modular | main.css | components, nav |
| **people.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **person.html** | modular | gradient dark | modular | modular | main.css | components, nav, db-logic, person-* |
| **person-v2.html** | modular | simple | modular | modular | main.css | components, nav, db-logic, person-v2-* |
| **places.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **random.html** | modular | none | modular | modular | main.css | components, nav |
| **search.html** | modular | none | modular | modular | main.css | components, nav, db-logic, global-search |
| **sources.html** | modular | none | modular | modular | main.css | components, nav, db-logic, filter |
| **witness-atlas.html** | modular | none | modular | modular | main.css | components, nav |
| **ocr/index.html** | modular | none | modular | modular | main.css + ocr-components.css | components, nav, ocr-gui |
| **tools/document-analyzer.html** | modular | gradient dark | modular | modular | main.css | components, nav |
| **tools/citation-generator.html** | modular | gradient dark | modular | modular | main.css | components, nav |
| **tools/ocr-features.html** | modular | gradient dark | modular | modular | main.css | components, nav |
| **tools/entity-matcher.html** | modular | gradient dark | modular | modular | main.css | components, nav |
| **tools/research-tools.html** | modular | gradient dark | modular | modular | main.css | components, nav |

---

## Hero Types Identified

| Type | Style | Pages |
|------|-------|-------|
| **Gradient Dark** | `bg-archive-dark py-12` + gradient overlays + badge + H1 + description + stat tags | index, person, tools/* |
| **Simple** | Lighter hero, often with profile card | about, blog, event-v1, oswald, person-v2 |
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
| ⚠️ Duplicate person pages | person.html, person-v2.html | Consolidate to single template | Low | Pending |
| ⚠️ Duplicate event pages | event.html, event-v1.html | Consolidate to single template | Low | Pending |

---

## Script Dependencies

| Script | Purpose | Pages |
|--------|---------|-------|
| `components.js` | Loads modular components via `data-component` attribute | All modular pages |
| `nav.js` | Dynamic breadcrumbs + bottom-nav active state | All modular pages |
| `db-logic.js` | Database fetch/render for dynamic content | Data-driven pages |
| `filter.js` | Sidebar filtering logic | List pages (people, events, objects, etc.) |
| `ocr-gui.js` | OCR tool functionality | ocr/index.html |
| `global-search.js` | Search functionality | search.html |
| `person-profile.js` | Person detail rendering | person.html |
| `person-cards.js` | Person card components | person.html |
| `blog-post.js` | Blog post rendering | blog-post.html |

---

## CSS Architecture

| File | Purpose | Notes |
|------|---------|-------|
| `main.css` | Global styles, CSS custom properties | Used by all pages |
| `ocr-components.css` | OCR tool styles | Uses CSS variables from main.css |
| `pdf-viewer.css` | PDF viewer styles | Uses CSS variables from main.css |
| Inline Tailwind config | Theme colors, fonts, border-radius | Duplicated in every page head |

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
- [ ] Consolidate person.html + person-v2.html
- [ ] Consolidate event.html + event-v1.html
- [ ] Extract inline Tailwind config to shared file
