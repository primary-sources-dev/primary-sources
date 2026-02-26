# UI Documentation Index
*Last Updated: 2026-02-26*

Welcome to the Primary Sources UI documentation. This index provides quick access to the architecture, component gallery, and technical standards of the project.

---

## Core Documentation
- [**Architecture & Tech Stack**](./ARCHITECTURE.md) — Script dependencies, CSS architecture, and Next.js roadmap.
- [**Page Component Matrix**](./PAGE-MATRIX.md) — Mapping of pages to components and hero types.
- [**Component Registry**](./components/COMPONENTS.md) — Technical documentation for all modular HTML components.

---

## Component Library

### Structural Components
- [**Header**](./components/HEADER.md) — Global navigation header with menu, search, branding, breadcrumbs.
- [**Footer**](./components/FOOTER.md) — Global footer with links and sitemap.
- [**Bottom Nav**](./components/BOTTOM-NAV.md) — Mobile bottom navigation bar.
- [**Facet Bar**](./components/FACET-BAR.md) — Filter controls for browse pages.

### Content Components
- [**Cards**](./components/CARDS.md) — Entity cards, tool cards, index cards.
- [**Animated Card**](./components/ANIMATED-CARD.md) — Priority/roadmap cards with status badges.
- [**Chips & Badges**](./components/CHIPS.md) — Status indicators, entity chips, tag labels.

### Specialized Components
- [**PDF Viewer Header**](./components/PDF-VIEWER-HEADER.md) — Toolbar for document viewer.
- [**Icons**](./components/ICONS.md) — Material Symbols reference and usage.

---

## Complete Atomic Inventory

### Modular HTML Components (`web/html/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| Header | `header.html` | Global nav: menu, search, branding, breadcrumbs, user icon |
| Footer | `footer.html` | Site footer with links |
| Bottom Nav | `bottom-nav.html` | Mobile navigation bar |
| Facet Bar | `facet-bar.html` | Filter controls for browse pages |
| Animated Card | `animated-card.html` | Roadmap/feature cards with status badges |
| PDF Viewer Header | `pdf-viewer-header.html` | Document viewer toolbar |

### CSS Files (`web/html/assets/css/`)

| File | Purpose |
|------|---------|
| `tailwind-prod.css` | Pre-compiled Tailwind utilities + custom theme |
| `main.css` | Design tokens, badge styles, collapsible menu |
| `pdf-viewer.css` | PDF viewer specific styles |
| `tools/ocr/ocr-components.css` | OCR tool components (chips, segments, queue) |

### JavaScript Modules (`web/html/assets/js/`)

#### Core Infrastructure
| File | Purpose |
|------|---------|
| `components.js` | Dynamic component loader (`[data-component]`) |
| `nav.js` | Breadcrumb logic, active states, port rewriting |
| `collapsible-menu.js` | Header dropdown menu interactions |
| `db-logic.js` | Entity card rendering from JSON data |
| `filter.js` | Facet bar filtering logic |
| `global-search.js` | Search page functionality |
| `timer.js` | JFK assassination countdown timer |

#### Entity Card Renderers
| File | Entity Type |
|------|-------------|
| `person-cards.js` | Person profile cards |
| `event-cards.js` | Event profile cards |
| `place-cards.js` | Place profile cards |
| `organization-cards.js` | Organization profile cards |
| `object-cards.js` | Object profile cards |
| `source-cards.js` | Source profile cards |

#### Entity Profile Scripts
| File | Entity Type |
|------|-------------|
| `person-profile.js` | Person detail page logic |
| `event-profile.js` | Event detail page logic |
| `place-profile.js` | Place detail page logic |
| `organization-profile.js` | Organization detail page logic |
| `object-profile.js` | Object detail page logic |
| `source-profile.js` | Source detail page logic |

#### Page-Specific
| File | Page |
|------|------|
| `blog-post.js` | Blog post rendering |

### Atomic UI Elements

#### Chips (Standardized)
| Class | Size | Use Case |
|-------|------|----------|
| `.chip .chip-sm` | 8px | Card corners, inline labels |
| `.chip .chip-md` | 10px | Default size |
| `.chip .chip-lg` | 12px | Hero sections |
| `.chip .chip-pulse` | — | Animated state modifier |

**Migrated:**
- ✅ Homepage WIP badges (`index.html`)

**Legacy (to migrate):**
- ⏳ Live/Index badges, Active badges, Coming Soon badges
- OCR-specific: `.entity-chip`, `.doc-type-badge`, `.confidence-badge` (remain in `ocr-components.css`)

#### Buttons
| Type | Example |
|------|---------|
| Icon Button | Menu toggle, Search, User icon (40x40 bordered) |
| Text Button | "View All", "Copy" |

#### Cards (5 patterns)
| Type | Used In |
|------|---------|
| Entity Index Card | Homepage grid, browse pages |
| Entity Detail Card | Profile pages (aliases, timeline entries) |
| Tool Card | Homepage tools section |
| Animated Card | Features/roadmap |
| Blog Card | Blog listing |

#### Navigation Elements
| Element | Location |
|---------|----------|
| Breadcrumb | Header (chevron + current page) |
| Section Header | `border-l-4 border-primary pl-4` pattern |
| Tab Navigation | OCR tool queue tabs |

### Data Files (`web/html/assets/data/`)

| File | Content |
|------|---------|
| `people.json` | Person entities |
| `events.json` | Event entities |
| `places.json` | Place entities |
| `organizations.json` | Organization entities |
| `objects.json` | Object entities |
| `sources.json` | Source entities |
| `blog.json` | Blog posts |

---

## History & Audits
- [**Legacy UI Audit**](./LEGACY-AUDIT.md) — Records of historical fixes and stabilization work.

---

**Summary:** 6 modular components, 4 CSS files, 17 JS modules, 8 badge variants, 5 card patterns, 7 data files.

*Last Updated by Cursor*
