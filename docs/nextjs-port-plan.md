# Next.js Port Plan — Primary Sources Research Vault
*Created: 2026-02-28*
*Status: DRAFT — Review before implementation*
*Reference: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)*
*CodeRef: `.coderef/` (1,640 elements, 89 files, dependency graph)*

---

## 0. Strategy: Build Inline, Port Later

We are NOT porting now. We are continuing to build out the current HTML/Flask system (workbench, entities, etc.). This plan ensures every feature we build today maps cleanly to Next.js so the port is mechanical — not architectural.

**The workflow:**
1. **Inventory** — Catalog every active file with its port destination (done below)
2. **Inline rules** — For each new feature, check it against the Vercel rules before writing code
3. **Separation discipline** — Keep data fetching, state, and rendering in distinct layers
4. **Port** — When ready, move each file to its mapped destination with no restructuring

---

## I. Complete Active Inventory

### A. Pages (37 HTML → 37 Next.js routes)

| # | Current HTML | Next.js Route | Category |
|---|---|---|---|
| 1 | `index.html` | `app/page.tsx` | Home |
| 2 | `search.html` | `app/search/page.tsx` | Global |
| 3 | `sitemap.html` | `app/sitemap/page.tsx` | Global |
| 4 | `entities/person/person-index.html` | `app/entities/person/page.tsx` | Entity Browse |
| 5 | `entities/person/person-details.html` | `app/entities/person/[id]/page.tsx` | Entity Detail |
| 6 | `entities/event/event-index.html` | `app/entities/event/page.tsx` | Entity Browse |
| 7 | `entities/event/event-details.html` | `app/entities/event/[id]/page.tsx` | Entity Detail |
| 8 | `entities/organization/org-index.html` | `app/entities/organization/page.tsx` | Entity Browse |
| 9 | `entities/organization/org-details.html` | `app/entities/organization/[id]/page.tsx` | Entity Detail |
| 10 | `entities/place/place-index.html` | `app/entities/place/page.tsx` | Entity Browse |
| 11 | `entities/place/place-details.html` | `app/entities/place/[id]/page.tsx` | Entity Detail |
| 12 | `entities/object/object-index.html` | `app/entities/object/page.tsx` | Entity Browse |
| 13 | `entities/object/object-details.html` | `app/entities/object/[id]/page.tsx` | Entity Detail |
| 14 | `entities/source/source-index.html` | `app/entities/source/page.tsx` | Entity Browse |
| 15 | `entities/source/source-details.html` | `app/entities/source/[id]/page.tsx` | Entity Detail |
| 16 | `exploration/otd.html` | `app/exploration/otd/page.tsx` | Exploration |
| 17 | `exploration/random.html` | `app/exploration/random/page.tsx` | Exploration |
| 18 | `exploration/witness-atlas.html` | `app/exploration/witness-atlas/page.tsx` | Exploration |
| 19 | `pages/about.html` | `app/about/page.tsx` | Static |
| 20 | `pages/blog.html` | `app/blog/page.tsx` | Static |
| 21 | `pages/blog-post.html` | `app/blog/[slug]/page.tsx` | Dynamic |
| 22 | `pages/features.html` | `app/features/page.tsx` | Static |
| 23 | `pages/links.html` | `app/links/page.tsx` | Static |
| 24 | `tools/tools-index.html` | `app/tools/page.tsx` | Tools |
| 25 | `tools/ocr/ocr-details.html` | `app/tools/ocr/page.tsx` | Tools Info |
| 26 | `tools/ocr/ocr-ui.html` | `app/tools/ocr/scanner/page.tsx` | Tools UI |
| 27 | `tools/pdf-viewer/pdf-viewer-details.html` | `app/tools/pdf-viewer/page.tsx` | Tools Info |
| 28 | `tools/pdf-viewer/pdf-viewer-ui.html` | `app/tools/pdf-viewer/viewer/page.tsx` | Tools UI |
| 29 | `tools/analyzer/analyzer-details.html` | `app/tools/analyzer/page.tsx` | Tools Info |
| 30 | `tools/assertion-tracker/assertion-tracker-details.html` | `app/tools/assertion-tracker/page.tsx` | Tools Info |
| 31 | `tools/citation/citation-details.html` | `app/tools/citation/page.tsx` | Tools Info |
| 32 | `tools/classifier/classifier-details.html` | `app/tools/classifier/page.tsx` | Tools Info |
| 33 | `tools/classifier/classifier-ui.html` | `app/tools/classifier/review/page.tsx` | Tools UI |
| 34 | `tools/matcher/matcher-details.html` | `app/tools/matcher/page.tsx` | Tools Info |
| 35 | `tools/research/research-details.html` | `app/tools/research/page.tsx` | Tools Info |
| 36 | `tools/workbench/workbench.html` | `app/tools/workbench/page.tsx` | **Last to port** |
| 37 | `tools/TEMPLATE-tool-details.html` | *(dev reference only — not ported)* | Template |

### B. Shared Components (7 HTML → 7 React components)

| Current Component | Next.js Component | Server/Client | Vercel Rule |
|---|---|---|---|
| `components/header.html` | `components/Header.tsx` | Server | `server-serialization` |
| `components/mega-menu.html` | `components/MegaMenu.tsx` | Client | `bundle-dynamic-imports` |
| `components/bottom-nav.html` | `components/BottomNav.tsx` | Server | `rendering-hoist-jsx` |
| `components/footer.html` | `components/Footer.tsx` | Server | `rendering-hoist-jsx` |
| `components/animated-card.html` | `components/AnimatedCard.tsx` | Server | `rendering-hoist-jsx` |
| `components/facet-bar.html` | `components/FacetBar.tsx` | Client | `rerender-derived-state` |
| `components/pdf-viewer-header.html` | `components/PdfViewerHeader.tsx` | Server | `rendering-hoist-jsx` |

### C. JavaScript Modules (27 JS → React components/hooks/utils)

| Current JS | Elements | Next.js Destination | Type |
|---|---|---|---|
| `workbench.js` | 224 | `app/tools/workbench/` (multiple files) | Client components + hooks |
| `ocr-gui.js` | 80 | `app/tools/ocr/scanner/OcrScanner.tsx` | Client component |
| `event-profile.js` | 56 | `components/entities/EventProfile.tsx` | Server component |
| `person-profile.js` | 50 | `components/entities/PersonProfile.tsx` | Server component |
| `db-logic.js` | 44 | `lib/entity-utils.ts` | Utility functions |
| `event-cards.js` | — | `components/cards/EventCards.tsx` | Server component |
| `person-cards.js` | — | `components/cards/PersonCards.tsx` | Server component |
| `object-cards.js` | — | `components/cards/ObjectCards.tsx` | Server component |
| `object-profile.js` | — | `components/entities/ObjectProfile.tsx` | Server component |
| `organization-cards.js` | — | `components/cards/OrgCards.tsx` | Server component |
| `organization-profile.js` | — | `components/entities/OrgProfile.tsx` | Server component |
| `place-cards.js` | — | `components/cards/PlaceCards.tsx` | Server component |
| `place-profile.js` | — | `components/entities/PlaceProfile.tsx` | Server component |
| `source-cards.js` | — | `components/cards/SourceCards.tsx` | Server component |
| `source-profile.js` | — | `components/entities/SourceProfile.tsx` | Server component |
| `nav.js` | — | `components/Header.tsx` (merged) | Server component |
| `components.js` | — | *(eliminated — Next.js layouts replace)* | — |
| `collapsible-menu.js` | — | `components/MegaMenu.tsx` (merged) | Client component |
| `filter.js` | — | `components/FilterPanel.tsx` | Client component |
| `filter-mapping.js` | — | `lib/filter-utils.ts` | Utility |
| `global-search.js` | — | `app/search/SearchClient.tsx` | Client component |
| `blog-post.js` | — | `app/blog/[slug]/page.tsx` (inline) | Server component |
| `data-abstraction.js` | — | `lib/supabase.ts` | Data layer |
| `validation.js` | — | `lib/validation.ts` | Utility |
| `witness-logic.js` | — | `lib/witness-utils.ts` | Utility |
| `witness-ui.js` | — | `app/exploration/witness-atlas/WitnessClient.tsx` | Client component |
| `timer.js` | — | *(dev utility — not ported)* | — |

### D. CSS Files (5 → Tailwind config + CSS modules)

| Current CSS | Next.js Destination | Notes |
|---|---|---|
| `tailwind-prod.css` | `tailwind.config.ts` + `globals.css` | Rebuilt from Tailwind config |
| `main.css` | `globals.css` | Custom variables, archive theme tokens |
| `workbench.css` | `app/tools/workbench/workbench.module.css` | Scoped to workbench |
| `ocr-components.css` | `app/tools/ocr/ocr.module.css` | Scoped to OCR |
| `pdf-viewer.css` | `app/tools/pdf-viewer/viewer.module.css` | Scoped to PDF viewer |

### E. Data Files (7 JSON → Supabase tables)

| Current JSON | Supabase Table | Records |
|---|---|---|
| `people.json` | `person` | People entities |
| `events.json` | `event` + junction tables | Event entities |
| `objects.json` | `object` | Object entities |
| `organizations.json` | `org` | Organization entities |
| `places.json` | `place` | Place entities |
| `sources.json` | `source` + `source_excerpt` | Source documents |
| `blog.json` | `blog_post` (new table or CMS) | Blog content |

### F. Python Backend (stays as microservice)

| Current Python | Port Status | Notes |
|---|---|---|
| `ocr_server.py` (37 elements) | **Stays** | Flask routes proxied by Next.js API routes |
| `entity_matcher.py` | **Stays** | Called via `/api/entities` proxy |
| `document_classifier.py` | **Stays** | Called via `/api/classify` proxy |
| `metadata_parser.py` | **Stays** | Internal to OCR pipeline |
| `zone_extractor.py` | **Stays** | Internal to OCR pipeline |
| `entity_linker.py` | **Stays** | Internal to OCR pipeline |
| `ocr_worker.py` | **Stays** | Internal to OCR pipeline |
| `ocr_gui.py` | **Stays** | Internal to OCR pipeline |

### G. API Endpoints (Flask → Next.js API routes)

| Flask Endpoint | Next.js API Route | Method |
|---|---|---|
| `/api/entities` | `app/api/entities/route.ts` | POST |
| `/api/entities/export` | `app/api/entities/export/route.ts` | POST |
| `/api/classify` | `app/api/classify/route.ts` | POST |
| `/api/review/:file` | `app/api/review/[file]/route.ts` | GET |
| `/api/history` | `app/api/history/route.ts` | GET |
| `/api/config` | `app/api/config/route.ts` | GET |
| `/api/ocr/process` | `app/api/ocr/process/route.ts` | POST |
| `/api/download/:file` | `app/api/download/[file]/route.ts` | GET |

### H. Build System (eliminated)

| Current | Next.js Replacement |
|---|---|
| `build.py` — injects components into 37 pages | `layout.tsx` nesting — automatic |
| `validate-build.py` — post-build checks | TypeScript compiler + ESLint |
| `--clean` rebuild cycle | Hot module reload (dev), `next build` (prod) |

---

## II. Vercel Rules — Reference

### Skill Sources

| Skill | Rules | Priority |
|-------|-------|----------|
| React Best Practices | 57 rules, 8 categories | Architecture + Performance |
| Web Design Guidelines | 100+ UI/UX/a11y rules | Accessibility + UX |
| Composition Patterns | 9 rules, 4 categories | Component architecture |

### Rules Mapped to Our System

#### CRITICAL: Eliminating Waterfalls
| Rule | Our Application |
|---|---|
| `async-parallel` | Entity detail pages: fetch person + events + sources via `Promise.all()` |
| `async-suspense-boundaries` | Wrap each entity card in `<Suspense>` for independent streaming |
| `async-defer-await` | OTD page: don't await all events before rendering header |
| `async-api-routes` | Entity export: start Supabase write early, await at response |

#### CRITICAL: Bundle Size
| Rule | Our Application |
|---|---|
| `bundle-dynamic-imports` | PDF viewer, workbench tabs, mega-menu → `next/dynamic` |
| `bundle-barrel-imports` | Import each component directly — no barrel files |
| `bundle-defer-third-party` | Fonts → `next/font`, Material Symbols → subset |
| `bundle-conditional` | Workbench: load tab modules only when activated |

#### HIGH: Server-Side Performance
| Rule | Our Application |
|---|---|
| `server-serialization` | Pass only display fields to client cards |
| `server-cache-react` | `React.cache()` for entity lookups — dedup per request |
| `server-cache-lru` | LRU cache for controlled vocab tables |
| `server-dedup-props` | Fetch entity once, distribute fields to cards |
| `server-parallel-fetching` | Person page: biography + events + sources in parallel |

#### MEDIUM-HIGH: Client-Side
| Rule | Our Application |
|---|---|
| `client-swr-dedup` | Search results, entity lists → SWR |
| `client-localstorage-schema` | Version workbench keys: `v1_workbench_export_` |
| `client-passive-event-listeners` | PDF scroll, workbench pan → passive listeners |

#### MEDIUM: Re-renders + Rendering
| Rule | Our Application |
|---|---|
| `rerender-derived-state` | Derive `canClassify` from state, don't store separately |
| `rerender-functional-setstate` | `setEntities(prev => ...)` for approve/reject |
| `rerender-transitions` | `startTransition` for tab switching |
| `rendering-conditional-render` | Ternary for card show/hide: `{data ? <Card /> : null}` |
| `rendering-content-visibility` | Long entity lists: `content-visibility: auto` |
| `rendering-hoist-jsx` | Static layout elements extracted outside components |

#### Composition Patterns
| Rule | Our Application |
|---|---|
| `architecture-compound-components` | Entity profile with sub-components sharing context |
| `architecture-avoid-boolean-props` | Compose cards, don't pass show/hide booleans |
| `state-context-interface` | Workbench: `{ state, actions, meta }` context shape |
| `state-lift-state` | Progressive unlock in WorkbenchProvider |
| `patterns-explicit-variants` | `<BadgePending />` / `<BadgeConfirmed />` not `<Badge status={} />` |

---

## III. Build-Inline Rules (Apply NOW While Building)

These rules govern how we write code TODAY so the port is clean.

### Rule 1: Separate Data from Rendering
- **Do:** Fetch/compute data at the top of a function, render below
- **Don't:** Inline fetch calls inside HTML template strings
- **Why:** Data fetching becomes a server component, rendering becomes JSX
- **Example:** `workbench.js` — entity detection fetch is already separate from `renderEntitiesDashboard()` ✓

### Rule 2: Keep State Centralized
- **Do:** Store state in one place (class properties, single object)
- **Don't:** Scatter state across DOM attributes, global variables, and localStorage
- **Why:** Maps to React context / useState in one provider
- **Example:** Workbench `feedback{}` object holds all page state ✓

### Rule 3: Use Data Attributes for Behavior, Classes for Styling
- **Do:** `data-tab="classify"` for JS behavior, CSS classes for appearance
- **Don't:** Toggle `.active` class and use it for both styling AND JS selection
- **Why:** React uses props for behavior, className for styling — clean separation
- **Example:** Tab buttons use `data-tab` for switching ✓

### Rule 4: Keep API Contracts Clean
- **Do:** Return plain JSON with consistent shapes from all endpoints
- **Don't:** Return HTML fragments, use Flask-specific session features
- **Why:** Next.js API routes expect JSON in, JSON out
- **Example:** `/api/entities` returns `{ matched: [], candidates: [] }` ✓

### Rule 5: Isolate Side Effects
- **Do:** Group localStorage reads/writes in dedicated methods
- **Don't:** Sprinkle `localStorage.setItem()` throughout rendering code
- **Why:** Maps to custom hooks (`useWorkbenchStorage()`)
- **Example:** `saveEntityApprovals()` / `loadEntityApprovals()` methods ✓

### Rule 6: Version localStorage Keys
- **Do:** `v1_workbench_export_{filename}`
- **Don't:** `workbench_export_{filename}` (unversioned)
- **Why:** Schema migrations in localStorage need version prefixes
- **Status:** ⚠️ NOT YET DONE — apply on next workbench change

### Rule 7: No Inline Styles for Theming
- **Do:** Use CSS variables or Tailwind classes
- **Don't:** `element.style.color = '#86efac'` in JS
- **Why:** Maps to Tailwind config tokens or CSS modules
- **Example:** Badge colors use CSS classes (`.badge-format`, `.badge-agency`) ✓

### Rule 8: One Function, One Job
- **Do:** `detectEntities()`, `renderEntitiesDashboard()`, `approveEntity()` — separate functions
- **Don't:** One giant function that fetches, renders, and saves
- **Why:** Each function becomes a hook, component, or server action
- **Example:** Workbench class methods are already well-separated ✓

---

## IV. Accessibility Gaps (Fix During Current Build or Port)

| Area | Current Gap | Fix | Priority |
|---|---|---|---|
| Keyboard nav | Mega-menu not keyboard-navigable | `role="menu"`, arrow keys | Port |
| Focus management | Tab switching doesn't move focus | Focus first element in panel | Now |
| Screen reader | Cards have no landmark roles | `role="region"`, `aria-label` | Port |
| Color contrast | `opacity-40` text on dark bg | Verify WCAG AA 4.5:1 | Now |
| Forms | Workbench dropdowns lack labels | `aria-label` on selects | Now |
| Images | PDF pages have no alt text | `aria-label="Page N"` | Now |

---

## V. Port Execution Order (When Ready)

### Phase 1: Foundation
Layout shell, header, footer, bottom-nav, mega-menu, static pages (about, features, links, sitemap)

### Phase 2: Entity Browse
Shared browse layout for all 6 entity types, search + filtering with SWR

### Phase 3: Entity Detail
Dynamic `[id]` pages with compound card components, Supabase integration

### Phase 4: Exploration
On This Day, Random Entity, Witness Atlas

### Phase 5: Research Tools
OCR scanner, PDF viewer, classifier review, tools dashboard — proxy to Python microservice

### Phase 6: Document Workbench (Last)
5-tab workflow, progressive unlock as context, entity detection as SWR, export to Supabase

---

## VI. What Stays / What Changes

### Stays
- Database schema (27 tables, 4NF, assertion model)
- Controlled vocabulary (`v_*` tables)
- Python OCR/classification/entity matching (microservice)
- Assertion chain (every relationship traced to source excerpts)

### Changes
- `build.py` → Next.js layouts (eliminated)
- `mock-*.json` → Supabase queries
- `ocr_server.py` routes → Next.js API routes (Python stays as microservice)
- `main.css` + tool CSS → Tailwind config + CSS modules
- 27 standalone JS files → React components/hooks/utils
- CDN fonts → `next/font`

---

## VII. Quality Gate — Per-Feature Checklist

Apply to every feature built from now on:

- [ ] Data fetching separate from rendering
- [ ] State centralized (not scattered across DOM/globals)
- [ ] API endpoints return clean JSON
- [ ] Side effects (localStorage, fetch) isolated in dedicated methods
- [ ] localStorage keys versioned
- [ ] CSS uses classes/variables, not inline JS styles
- [ ] No barrel imports in JS
- [ ] Accessibility: labels, keyboard, contrast

Apply during port:

- [ ] Server vs Client boundary correct
- [ ] Heavy deps lazy-loaded (`next/dynamic`)
- [ ] Supabase queries use `React.cache()` or LRU
- [ ] Suspense boundaries around async cards
- [ ] Composition over boolean props
- [ ] `startTransition` for non-urgent updates

---

## VIII. CodeRef Integration

The `.coderef/` directory provides machine-readable inventory:

| File | What It Provides | Port Use |
|---|---|---|
| `index.json` | 1,640 elements across 89 files | Element-level migration checklist |
| `graph.json` | Dependency relationships | Determines port order (leaf nodes first) |
| `diagrams/imports.mmd` | 32 module import graph | Confirms no circular deps |
| `diagrams/dependencies.mmd` | 89-file dependency graph | Full system topology |
| `reports/coverage.json` | 0% test coverage | Test plan needed before port |
| `reports/patterns.json` | Handler/error patterns | Pattern consistency validation |
| `reports/drift.json` | Index freshness | Re-scan before port begins |

**Before port begins:** Re-run `coderef_scan` to get fresh index, then use `graph.json` to generate the exact file-by-file migration order.
