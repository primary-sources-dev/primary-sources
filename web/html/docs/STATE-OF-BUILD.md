# State of Build — Migration Roadmap

**Generated:** 2026-02-25
**Purpose:** Ordered list of all changes needed to modernize JavaScript module system and component architecture

---

## Table of Contents

1. [Infrastructure Changes](#infrastructure-changes)
2. [JavaScript Module Conversions (Core)](#javascript-module-conversions-core-files)
3. [JavaScript Module Conversions (Entity Profiles)](#javascript-module-conversions-entity-profiles)
4. [JavaScript Module Conversions (Tools & Pages)](#javascript-module-conversions-tools--pages)
5. [Web Component Conversions](#web-component-conversions)
6. [Build Optimization](#build-optimization)
7. [Documentation & Cleanup](#documentation--cleanup)
8. [Summary Metadata](#summary-metadata)

---

## Infrastructure Changes

### 1. Initialize Build System
**Type:** Setup
**Priority:** High (required for everything else)
**Effort:** 30 minutes
**Risk:** Low (non-breaking, additive only)
**Dependencies:** None
**Impact:** Foundation for all other improvements
**Reversible:** Yes (just delete files)

**Actions:**
- Run `npm init -y` in `web/html/`
- Install Vite: `npm install --save-dev vite`
- Create `vite.config.js`
- Add npm scripts to `package.json` (dev, build)
- Test with `npm run dev`

---

### 2. Create Source Directory Structure
**Type:** Organization
**Priority:** High
**Effort:** 15 minutes
**Risk:** Low (doesn't affect existing code)
**Dependencies:** #1
**Impact:** Separates source from build output
**Reversible:** Yes

**Actions:**
- Create `web/html/src/` directory
- Create `web/html/src/components/`
- Create `web/html/src/modules/`
- Create `web/html/dist/` (add to .gitignore)
- Keep existing `web/html/assets/` during transition

---

### 3. Update .gitignore
**Type:** Configuration
**Priority:** High
**Effort:** 5 minutes
**Risk:** None
**Dependencies:** #2
**Impact:** Prevents committing built files
**Reversible:** Yes

**Actions:**
- Add `web/html/dist/` to .gitignore
- Add `web/html/node_modules/` to .gitignore
- Add `web/html/package-lock.json` (or keep it, team preference)

---

## JavaScript Module Conversions (Core Files)

### 4. Convert timer.js to ES6 Module
**Type:** Code refactor
**Priority:** Medium (good learning file, low risk)
**Effort:** 30 minutes
**Risk:** Low (isolated, simple file)
**Dependencies:** #1, #2
**Impact:** 1 page (index.html)
**Reversible:** Yes (keep old file as backup)

**Actions:**
- Copy `assets/js/timer.js` → `src/modules/timer.mjs`
- Wrap code in function, add `export`
- Remove global variable assignments
- Update `index.html` script tag to `<script type="module">`
- Test timer still works on homepage

**Files Changed:** 2 (timer.js → timer.mjs, index.html)

---

### 5. Convert components.js to ES6 Module
**Type:** Code refactor
**Priority:** High (core infrastructure)
**Effort:** 1 hour
**Risk:** Medium (used on 100% of pages)
**Dependencies:** #1, #2
**Impact:** 39 pages (all pages)
**Reversible:** Yes (high-impact rollback)

**Actions:**
- Copy `assets/js/components.js` → `src/modules/components.mjs`
- Export `loadComponent()` function
- Export `initializeComponents()` function
- Remove global scope assignments
- Test on 3 pages before rolling out to all 39

**Files Changed:** 40 (components.js → components.mjs, 39 HTML files)

---

### 6. Convert nav.js to ES6 Module
**Type:** Code refactor
**Priority:** High (core infrastructure)
**Effort:** 45 minutes
**Risk:** Medium (used on 100% of pages)
**Dependencies:** #5
**Impact:** 39 pages
**Reversible:** Yes

**Actions:**
- Copy `assets/js/nav.js` → `src/modules/nav.mjs`
- Import from `components.mjs` if needed
- Export navigation functions
- Remove global scope assignments
- Update all 39 HTML files

**Files Changed:** 40

---

### 7. Convert collapsible-menu.js to ES6 Module
**Type:** Code refactor
**Priority:** High (header dropdown depends on this)
**Effort:** 30 minutes
**Risk:** Low (contained logic)
**Dependencies:** #1, #2
**Impact:** 39 pages (all pages with header)
**Reversible:** Yes

**Actions:**
- Copy `assets/js/collapsible-menu.js` → `src/modules/collapsible-menu.mjs`
- Export menu toggle functions
- Remove global event listener assignments
- Update HTML imports

**Files Changed:** 40

---

### 8. Convert db-logic.js to ES6 Module
**Type:** Code refactor
**Priority:** High (data layer)
**Effort:** 1 hour
**Risk:** Medium (12 pages depend on this)
**Dependencies:** #5
**Impact:** 12 pages (index.html + all entity index pages)
**Reversible:** Yes

**Actions:**
- Copy `assets/js/db-logic.js` → `src/modules/db-logic.mjs`
- Export individual fetch functions (`fetchEvents`, `fetchPeople`, etc.)
- Import `components.mjs` if needed
- Update 12 HTML files
- Verify data still loads on all entity pages

**Files Changed:** 13

---

### 9. Convert filter.js to ES6 Module
**Type:** Code refactor
**Priority:** Medium
**Effort:** 45 minutes
**Risk:** Medium (6 pages depend on this)
**Dependencies:** #8
**Impact:** 6 pages (all entity index pages)
**Reversible:** Yes

**Actions:**
- Copy `assets/js/filter.js` → `src/modules/filter.mjs`
- Import from `db-logic.mjs`
- Export `FilterEngine` class or filter functions
- Update 6 entity index HTML files
- Test filters still work

**Files Changed:** 7

---

## JavaScript Module Conversions (Entity Profiles)

### 10. Convert person-profile.js to ES6 Module
**Type:** Code refactor
**Priority:** Low (page-specific)
**Effort:** 30 minutes
**Risk:** Low (1 page only)
**Dependencies:** #5
**Impact:** 1 page (person-details.html)
**Reversible:** Yes

**Actions:**
- Copy to `src/modules/person-profile.mjs`
- Export profile class/functions
- Update person-details.html
- Test person detail page

**Files Changed:** 2

---

### 11. Convert person-cards.js to ES6 Module
**Type:** Code refactor
**Priority:** Low
**Effort:** 30 minutes
**Risk:** Low
**Dependencies:** #10
**Impact:** 1 page
**Reversible:** Yes

**Actions:**
- Copy to `src/modules/person-cards.mjs`
- Export card rendering functions
- Update person-details.html

**Files Changed:** 2

---

### 12-23. Convert Remaining Entity Profile Modules
**Type:** Code refactor (bulk)
**Priority:** Low
**Effort:** 4 hours (30 min × 12 files)
**Risk:** Low (isolated to specific pages)
**Dependencies:** #5
**Impact:** 10 pages (5 entity types × 2 files each)
**Reversible:** Yes

**Modules to Convert:**
- event-profile.mjs + event-cards.mjs
- organization-profile.mjs + organization-cards.mjs
- place-profile.mjs + place-cards.mjs
- object-profile.mjs + object-cards.mjs
- source-profile.mjs + source-cards.mjs

**Files Changed:** 22 (10 modules + 10 HTML files + 2 existing)

---

## JavaScript Module Conversions (Tools & Pages)

### 24. Convert blog-post.js to ES6 Module
**Type:** Code refactor
**Priority:** Low
**Effort:** 20 minutes
**Risk:** Low
**Dependencies:** #1, #2
**Impact:** 1 page
**Reversible:** Yes

**Files Changed:** 2

---

### 25. Convert global-search.js to ES6 Module
**Type:** Code refactor
**Priority:** Medium
**Effort:** 30 minutes
**Risk:** Low
**Dependencies:** #8
**Impact:** 1 page (search.html)
**Reversible:** Yes

**Files Changed:** 2

---

## Web Component Conversions

### 26. Convert Animated Card to Web Component
**Type:** Component refactor
**Priority:** Low (optional, proof of concept)
**Effort:** 2 hours
**Risk:** Low (5 pages only)
**Dependencies:** #1, #2
**Impact:** ~5 pages (tool detail pages)
**Reversible:** Yes (keep old component)

**Actions:**
- Create `src/components/animated-card.js`
- Define `class AnimatedCard extends HTMLElement`
- Move inline script to class methods
- Add `connectedCallback()`, `disconnectedCallback()`
- Implement Shadow DOM
- Register with `customElements.define()`
- Update ~5 HTML files to use `<animated-card>` tag
- Test on all affected pages

**Files Changed:** 6

---

### 27. Convert Header to Web Component
**Type:** Component refactor
**Priority:** High (if doing Web Components)
**Effort:** 4 hours
**Risk:** High (100% of pages)
**Dependencies:** #7, #26 (proof of concept)
**Impact:** 39 pages
**Reversible:** Yes (but high effort to rollback)

**Actions:**
- Create `src/components/archive-header.js`
- Extract HTML from `components/header.html`
- Define `class ArchiveHeader extends HTMLElement`
- Implement breadcrumb updating logic
- Implement dropdown menu logic (import from collapsible-menu.mjs)
- Add Shadow DOM with scoped styles
- Add lifecycle hooks
- Register component
- Update all 39 HTML files to use `<archive-header>` tag
- Extensive testing on all page types

**Files Changed:** 40

---

### 28. Convert Footer to Web Component
**Type:** Component refactor
**Priority:** Medium (if doing Web Components)
**Effort:** 1.5 hours
**Risk:** Medium (100% of pages)
**Dependencies:** #27
**Impact:** 39 pages
**Reversible:** Yes

**Actions:**
- Create `src/components/archive-footer.js`
- Extract HTML from `components/footer.html`
- Define `class ArchiveFooter extends HTMLElement`
- Implement Shadow DOM
- Register component
- Update all 39 HTML files

**Files Changed:** 40

---

### 29. Convert Bottom Nav to Web Component
**Type:** Component refactor
**Priority:** Medium (if doing Web Components)
**Effort:** 2 hours
**Risk:** Medium (100% of pages)
**Dependencies:** #27
**Impact:** 39 pages
**Reversible:** Yes

**Actions:**
- Create `src/components/bottom-nav.js`
- Extract HTML from `components/bottom-nav.html`
- Define `class BottomNav extends HTMLElement`
- Implement active state logic (read from attribute)
- Implement Shadow DOM
- Register component
- Update all 39 HTML files with `data-active` attribute

**Files Changed:** 40

---

### 30. Convert Facet Bar to Web Component
**Type:** Component refactor
**Priority:** Low (if doing Web Components)
**Effort:** 3 hours
**Risk:** Medium (6 entity index pages)
**Dependencies:** #9 (filter.mjs), #27
**Impact:** 6 pages
**Reversible:** Yes

**Actions:**
- Create `src/components/facet-bar.js`
- Extract HTML from `components/facet-bar.html`
- Define `class FacetBar extends HTMLElement`
- Parse `data-filters` attribute
- Integrate with filter.mjs logic
- Implement Shadow DOM
- Add reactive filter updates
- Register component
- Update 6 entity index HTML files

**Files Changed:** 7

---

### 31. Convert PDF Viewer Header to Web Component
**Type:** Component refactor
**Priority:** Low (tool-specific)
**Effort:** 2 hours
**Risk:** Low (1 page only)
**Dependencies:** #27
**Impact:** 1 page
**Reversible:** Yes

**Actions:**
- Create `src/components/pdf-viewer-header.js`
- Extract from `components/pdf-viewer-header.html`
- Define Web Component class
- Integrate with PDF viewer logic
- Update pdf-viewer-ui.html

**Files Changed:** 2

---

## Build Optimization

### 32. Configure Tree-Shaking
**Type:** Build configuration
**Priority:** Medium (production optimization)
**Effort:** 30 minutes
**Risk:** Low (build-time only)
**Dependencies:** #4-#25 (all modules converted)
**Impact:** Reduces bundle size 40-60%
**Reversible:** Yes

**Actions:**
- Verify Vite/Rollup tree-shaking is enabled (default)
- Run production build: `npm run build`
- Analyze bundle with `rollup-plugin-visualizer`
- Verify unused exports are removed
- Measure bundle size reduction

**Files Changed:** 1 (vite.config.js)

---

### 33. Enable Minification
**Type:** Build configuration
**Priority:** Medium (production optimization)
**Effort:** 15 minutes
**Risk:** Low
**Dependencies:** #1
**Impact:** Reduces bundle size 50-70%
**Reversible:** Yes

**Actions:**
- Enable Terser in Vite config (usually default for production)
- Build production bundle
- Test that minified code works
- Verify source maps still generated for debugging

**Files Changed:** 1 (vite.config.js)

---

### 34. Implement Cache-Busting
**Type:** Build configuration
**Priority:** High (fixes stale cache issues)
**Effort:** 30 minutes
**Risk:** Low
**Dependencies:** #32, #33
**Impact:** Users always get fresh code
**Reversible:** Yes

**Actions:**
- Enable file hashing in Vite build output
- Update HTML generation to reference hashed filenames
- Or use Vite's built-in HTML injection
- Test deployment workflow

**Files Changed:** 1 (vite.config.js) + deployment script

---

### 35. Configure Code Splitting
**Type:** Build configuration
**Priority:** Low (advanced optimization)
**Effort:** 2 hours
**Risk:** Medium (complexity)
**Dependencies:** #4-#25
**Impact:** Further reduces per-page bundle sizes
**Reversible:** Yes

**Actions:**
- Configure manual chunks in Vite config
- Group entity profiles into separate chunks
- Group tool scripts into separate chunks
- Keep common code in shared chunk
- Test that pages load correct chunks
- Verify network waterfall is optimal

**Files Changed:** 1 (vite.config.js)

---

## Documentation & Cleanup

### 36. Update COMPONENT-INDEX.md
**Type:** Documentation
**Priority:** Medium
**Effort:** 1 hour
**Risk:** None
**Dependencies:** All component changes
**Impact:** Keeps docs current
**Reversible:** Yes

**Actions:**
- Document new Web Component usage patterns
- Update JavaScript module import patterns
- Document build process
- Add "How to create new components" section
- Update component reuse matrix

**Files Changed:** 1

---

### 37. Update CLAUDE.md
**Type:** Documentation
**Priority:** High
**Effort:** 1 hour
**Risk:** None
**Dependencies:** All changes
**Impact:** AI assistant knows new patterns
**Reversible:** Yes

**Actions:**
- Add "Build System" section
- Document ES6 module conventions
- Document Web Component creation workflow
- Update "Adding New Pages" checklist
- Add "Development Workflow" section

**Files Changed:** 1

---

### 38. Create BUILD.md
**Type:** Documentation
**Priority:** Medium
**Effort:** 30 minutes
**Risk:** None
**Dependencies:** #1, #32-#35
**Impact:** Team knows how to build
**Reversible:** N/A (new file)

**Actions:**
- Document build commands (dev, build, preview)
- Explain development vs production workflows
- Document deployment process
- List troubleshooting steps
- Add performance benchmarks

**Files Changed:** 1 (new)

---

### 39. Archive Legacy Files
**Type:** Cleanup
**Priority:** Low
**Effort:** 30 minutes
**Risk:** Low (moving, not deleting)
**Dependencies:** All conversions complete
**Impact:** Cleaner directory structure
**Reversible:** Yes

**Actions:**
- Create `web/html/legacy/` directory
- Move old `components/*.html` to legacy
- Move old `assets/js/*.js` files to legacy
- Update .gitignore to exclude legacy from version control
- Add README in legacy explaining files are deprecated

**Files Changed:** ~30 (moves)

---

### 40. Update Deployment Pipeline
**Type:** Infrastructure
**Priority:** High (required for production)
**Effort:** 1 hour
**Risk:** Medium (affects deployment)
**Dependencies:** #1, #32-#35
**Impact:** Production deploys optimized build
**Reversible:** Yes

**Actions:**
- Add `npm install` to deployment script
- Add `npm run build` to deployment script
- Change deployment source from `web/html/` to `web/html/dist/`
- Test deployment on staging environment
- Update CI/CD config if applicable

**Files Changed:** Deployment scripts/config

---

## Summary Metadata

### Total Changes Overview

**Files to Create:** 8
- vite.config.js
- package.json
- src/ directory structure
- BUILD.md
- Component JS files (if doing Web Components)

**Files to Convert:** 20
- Core JS modules (6 files)
- Entity profile modules (12 files)
- Tool/page modules (2 files)

**Files to Update:** 39+
- All HTML files (39)
- COMPONENT-INDEX.md
- CLAUDE.md
- .gitignore
- Deployment scripts

**Files to Archive:** 30+
- Legacy component HTML files (6)
- Legacy JS files (20+)

---

### Effort Summary by Phase

| Phase | Changes | Effort | Risk |
|-------|---------|--------|------|
| Infrastructure Setup | #1-3 | 1 hour | Low |
| Core Module Conversion | #4-9 | 6 hours | Medium |
| Entity Module Conversion | #10-23 | 6 hours | Low |
| Web Components (optional) | #26-31 | 15 hours | Medium-High |
| Build Optimization | #32-35 | 4 hours | Low-Medium |
| Documentation & Cleanup | #36-40 | 4 hours | Low |

**Total without Web Components:** 21 hours
**Total with Web Components:** 36 hours

---

### Risk Levels Explained

**Low Risk:** Single page impact, easily reversible, isolated changes
**Medium Risk:** Multiple pages, core functionality, requires testing
**High Risk:** All pages affected, architecture change, extensive testing needed

---

### Recommended Order

**Priority 1 (Must Do):**
- #1-3: Infrastructure
- #4-9: Core modules
- #32-34: Build optimization
- #37, #40: Critical docs & deployment

**Priority 2 (Should Do):**
- #10-25: All module conversions
- #36, #38: Full documentation

**Priority 3 (Nice to Have):**
- #26-31: Web Components
- #35: Code splitting
- #39: Cleanup

---

## Branch Strategy

**Branch Name:** `modernize-js-architecture`

**Rationale:** This modernization work is a large architectural refactor that should be isolated from ongoing feature development on `main`. Working in a separate branch allows:
- Main branch stays stable for feature work (OCR improvements, classifier integration, etc.)
- Build system changes can be tested in isolation
- Easy rollback if Vite/ES6 migration causes issues
- Parallel development without merge conflicts

**Commands to Start:**
```bash
# From main branch, create and switch to new branch
git checkout -b modernize-js-architecture

# Work through tasks #1-40 in this branch
# Commit frequently with descriptive messages

# When ready to merge back:
git checkout main
git merge modernize-js-architecture

# Or use a PR for code review
git push -u origin modernize-js-architecture
# Then create PR on GitHub
```

**Merge Criteria:**
- [ ] All Priority 1 tasks complete (#1-9, #32-34, #37, #40)
- [ ] `npm run build` produces working output
- [ ] All 39 pages tested and functional
- [ ] No console errors in browser
- [ ] Performance benchmarks meet or exceed current

**Note:** Feature work on `main` (classifier integration, new tools, etc.) does NOT block this modernization. The two tracks are independent and can proceed in parallel.

---

## Quick Start Checklist

**Today (30 minutes):**
- [ ] #1: Run `npm init -y` and install Vite
- [ ] #2: Create `src/` directory structure
- [ ] #3: Update .gitignore
- [ ] Test with `npm run dev`

**Week 1 (6 hours):**
- [ ] #4: Convert timer.js
- [ ] #5: Convert components.js
- [ ] #6: Convert nav.js
- [ ] #7: Convert collapsible-menu.js
- [ ] #8: Convert db-logic.js
- [ ] #9: Convert filter.js

**Week 2 (4 hours):**
- [ ] #32: Configure tree-shaking
- [ ] #33: Enable minification
- [ ] #34: Implement cache-busting
- [ ] #37: Update CLAUDE.md
- [ ] #40: Update deployment pipeline

**After Week 2:**
- System is 80% improved
- ES6 modules in place
- Build optimization enabled
- Production-ready

---

## Status Tracking

**Current Status:** Not Started
**Last Updated:** 2026-02-25
**Completed:** 0/40
**In Progress:** 0/40
**Blocked:** 0/40

---

## Notes

- All changes are reversible by keeping backup copies of original files
- Test thoroughly at each stage before proceeding
- Web Components (#26-31) are optional and can be skipped
- Priority 1 changes provide 80% of the benefit
- Estimated 21 hours total for Priority 1 + 2
- Full migration with Web Components: 36 hours

---

**Reference Documents:**
- `COMPONENT-INDEX.md` — Current component inventory
- `CLAUDE.md` — AI assistant constraints
- `html-migration.md` — Web migration documentation
