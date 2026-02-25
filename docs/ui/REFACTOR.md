# Site Structure Refactor - Complete Implementation Guide

**Date:** 2026-02-24
**Project:** Primary Sources Research Vault
**Scope:** Full reorganization from flat structure to organized subdirectories (Option B)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Flight Checklist](#pre-flight-checklist)
3. [Phase 1: Directory Creation](#phase-1-directory-creation)
4. [Phase 2: File Moves](#phase-2-file-moves)
5. [Phase 3: Component Updates](#phase-3-component-updates)
6. [Phase 4: Root Page Updates](#phase-4-root-page-updates)
7. [Phase 5: Pages Directory Updates](#phase-5-pages-directory-updates)
8. [Phase 6: Browse Directory Updates](#phase-6-browse-directory-updates)
9. [Phase 7: Entities Directory Updates](#phase-7-entities-directory-updates)
10. [Phase 8: Features Directory Updates](#phase-8-features-directory-updates)
11. [Phase 9: OCR Directory Updates](#phase-9-ocr-directory-updates)
12. [Phase 10: Tools Directory Updates](#phase-10-tools-directory-updates)
13. [Phase 11: JavaScript Updates](#phase-11-javascript-updates)
14. [Testing Checklist](#testing-checklist)
15. [Rollback Plan](#rollback-plan)
16. [Summary Statistics](#summary-statistics)

---

## Overview

### Current State
- **23 HTML files** cluttering root directory
- **Mixed path conventions** (relative and absolute)
- **No logical organization** by function
- **Duplicate files** (classifier-review.html)

### Target State
- **2 HTML files** at root (index.html, search.html)
- **All paths absolute** (root-relative: `/assets/...`, `/pages/...`)
- **Clear organization** by function (pages, browse, entities, features, tools, ocr)
- **No duplicates** (cleaned up)

### Benefits
✅ Professional structure
✅ Scalable for growth
✅ Easy onboarding for new developers
✅ Maintainable long-term
✅ Framework-ready (Next.js, etc.)

---

## Pre-Flight Checklist

Before starting, verify:

- [ ] **Git repository initialized** (`git init` if not)
- [ ] **Clean working directory** (commit or stash current changes)
- [ ] **Backup created** (see command below)
- [ ] **Local development server running** (to test changes)
- [ ] **Browser DevTools open** (to catch 404 errors)

### Create Backup

```bash
# Create timestamped backup
cp -r docs/ui docs/ui-backup-$(date +%Y%m%d-%H%M%S)

# Or create git branch
git checkout -b refactor-site-structure
git add .
git commit -m "Backup: Pre-refactor state"
```

---

## Phase 1: Directory Creation

### Commands

```bash
# Navigate to project root
cd /c/Users/willh/Desktop/primary-sources/docs/ui

# Create new directories
mkdir -p pages
mkdir -p browse
mkdir -p entities
mkdir -p features
```

### Verify

```bash
ls -ld pages browse entities features
# Should show 4 directories created
```

**Estimated Time:** 1 minute

---

## Phase 2: File Moves (23 files)

### Static Content → `/pages/` (5 files)

```bash
mv about.html pages/
mv blog.html pages/
mv blog-post.html pages/
mv links.html pages/
mv features.html pages/
```

**Files moved:**
```
docs/ui/about.html           → docs/ui/pages/about.html
docs/ui/blog.html            → docs/ui/pages/blog.html
docs/ui/blog-post.html       → docs/ui/pages/blog-post.html
docs/ui/links.html           → docs/ui/pages/links.html
docs/ui/features.html        → docs/ui/pages/features.html
```

---

### Entity List Pages → `/browse/` (6 files)

```bash
mv people.html browse/
mv events.html browse/
mv organizations.html browse/
mv places.html browse/
mv objects.html browse/
mv sources.html browse/
```

**Files moved:**
```
docs/ui/people.html          → docs/ui/browse/people.html
docs/ui/events.html          → docs/ui/browse/events.html
docs/ui/organizations.html   → docs/ui/browse/organizations.html
docs/ui/places.html          → docs/ui/browse/places.html
docs/ui/objects.html         → docs/ui/browse/objects.html
docs/ui/sources.html         → docs/ui/browse/sources.html
```

---

### Entity Templates → `/entities/` (7 files)

```bash
mv person.html entities/
mv event.html entities/
mv organization.html entities/
mv place.html entities/
mv object.html entities/
mv source.html entities/
mv oswald.html entities/
```

**Files moved:**
```
docs/ui/person.html          → docs/ui/entities/person.html
docs/ui/event.html           → docs/ui/entities/event.html
docs/ui/organization.html    → docs/ui/entities/organization.html
docs/ui/place.html           → docs/ui/entities/place.html
docs/ui/object.html          → docs/ui/entities/object.html
docs/ui/source.html          → docs/ui/entities/source.html
docs/ui/oswald.html          → docs/ui/entities/oswald.html
```

---

### Interactive Features → `/features/` (3 files)

```bash
mv otd.html features/
mv random.html features/
mv witness-atlas.html features/
```

**Files moved:**
```
docs/ui/otd.html             → docs/ui/features/otd.html
docs/ui/random.html          → docs/ui/features/random.html
docs/ui/witness-atlas.html   → docs/ui/features/witness-atlas.html
```

---

### OCR Pages → `/ocr/` (1 file)

```bash
mv pdf-viewer.html ocr/
```

**Files moved:**
```
docs/ui/pdf-viewer.html      → docs/ui/ocr/pdf-viewer.html
```

---

### Files Staying at Root (2 files)

```
docs/ui/index.html           (stays - homepage)
docs/ui/search.html          (stays - global search)
```

---

### File to Delete (1 duplicate)

```bash
rm classifier-review.html
```

**Reason:** Duplicate of `tools/classifier-review.html` (313KB bloated version vs 19KB documentation page)

---

### Verify File Moves

```bash
# Check root is clean (should only show index.html and search.html)
ls -1 *.html

# Expected output:
# index.html
# search.html

# Verify new directories populated
ls -1 pages/*.html
ls -1 browse/*.html
ls -1 entities/*.html
ls -1 features/*.html
ls -1 ocr/*.html
```

**Estimated Time:** 5 minutes

---

## Phase 3: Component Updates (3 files)

### File: `components/header.html` ⚠️ **CRITICAL**

This component is loaded on every page. Errors here break the entire site.

#### Line-by-Line Changes

**Line 3: Logo link**
```html
<!-- BEFORE -->
<a href="index.html" class="flex items-center gap-2">

<!-- AFTER -->
<a href="/index.html" class="flex items-center gap-2">
```

**Line 20: Search link**
```html
<!-- BEFORE -->
<a href="search.html"

<!-- AFTER -->
<a href="/search.html"
```

**Lines 33-73: Dropdown menu links**
```html
<!-- BEFORE → AFTER -->
href="/index.html"                   → href="/index.html"              (no change)
href="/about.html"                   → href="/pages/about.html"
href="/blog.html"                    → href="/pages/blog.html"
href="/events.html"                  → href="/browse/events.html"
href="/people.html"                  → href="/browse/people.html"
href="/organizations.html"           → href="/browse/organizations.html"
href="/places.html"                  → href="/browse/places.html"
href="/objects.html"                 → href="/browse/objects.html"
href="/sources.html"                 → href="/browse/sources.html"
href="/links.html"                   → href="/pages/links.html"
href="/otd.html?scope=Day&feature=true" → href="/features/otd.html?scope=Day&feature=true"
href="/random.html?feature=true"     → href="/features/random.html?feature=true"
href="/witness-atlas.html?feature=true" → href="/features/witness-atlas.html?feature=true"
href="/features.html"                → href="/pages/features.html"
href="/ocr/index.html?feature=true"  → href="/ocr/index.html?feature=true"  (no change)
href="/tools/citation-generator.html" → href="/tools/citation-generator.html" (no change)
href="/tools/document-analyzer.html" → href="/tools/document-analyzer.html" (no change)
href="/tools/entity-matcher.html"    → href="/tools/entity-matcher.html" (no change)
href="/tools/research-tools.html"    → href="/tools/research-tools.html" (no change)
href="/tools/classifier-review.html" → href="/tools/classifier-review.html" (no change)
```

**Total changes in this file:** 13 link updates

---

### File: `components/bottom-nav.html`

Search for any hardcoded navigation links and update:

```html
<!-- BEFORE → AFTER -->
href="index.html"            → href="/index.html"
href="events.html"           → href="/browse/events.html"
href="people.html"           → href="/browse/people.html"
href="search.html"           → href="/search.html"
```

---

### File: `components/footer.html`

Search for any hardcoded links and update:

```html
<!-- BEFORE → AFTER -->
href="about.html"            → href="/pages/about.html"
href="links.html"            → href="/pages/links.html"
```

**Estimated Time:** 30 minutes

---

## Phase 4: Root Page Updates (2 files)

### File: `index.html`

#### Asset Links
```html
<!-- BEFORE → AFTER (if any relative paths exist) -->
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links

**Hero section:**
```html
<!-- Line ~73 -->
href="about.html"                    → href="/pages/about.html"
```

**Platform Features section (lines 89-127):**
```html
href="otd.html?scope=Day&feature=true" → href="/features/otd.html?scope=Day&feature=true"
href="random.html?feature=true"      → href="/features/random.html?feature=true"
href="witness-atlas.html?feature=true" → href="/features/witness-atlas.html?feature=true"
```

**Browse by Category section (lines 138-191):**
```html
href="events.html"                   → href="/browse/events.html"
href="people.html"                   → href="/browse/people.html"
href="organizations.html"            → href="/browse/organizations.html"
href="places.html"                   → href="/browse/places.html"
href="objects.html"                  → href="/browse/objects.html"
href="sources.html"                  → href="/browse/sources.html"
```

**Recently Added section (line 200):**
```html
href="events.html"                   → href="/browse/events.html"
```

**Analytical Tools section (lines 217-283):**
```html
href="tools/ocr-features.html"       → href="/tools/ocr-features.html"
href="tools/pdf-viewer-features.html" → href="/tools/pdf-viewer-features.html"
href="tools/document-analyzer.html"  → href="/tools/document-analyzer.html"
href="tools/citation-generator.html" → href="/tools/citation-generator.html"
href="tools/entity-matcher.html"     → href="/tools/entity-matcher.html"
href="tools/research-tools.html"     → href="/tools/research-tools.html"
href="tools/classifier-review.html"  → href="/tools/classifier-review.html"
```

**Total changes:** ~20 link updates

---

### File: `search.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
href="organization.html"             → href="/entities/organization.html"
href="place.html"                    → href="/entities/place.html"
href="object.html"                   → href="/entities/object.html"
href="source.html"                   → href="/entities/source.html"
```

**Estimated Time:** 45 minutes

---

## Phase 5: Pages Directory Updates (5 files)

### File: `pages/about.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="features.html"                 → href="/pages/features.html"
href="blog.html"                     → href="/pages/blog.html"
```

---

### File: `pages/blog.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="blog-post.html"                → href="/pages/blog-post.html"
href="about.html"                    → href="/pages/about.html"
```

---

### File: `pages/blog-post.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="blog.html"                     → href="/pages/blog.html"
```

---

### File: `pages/links.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="about.html"                    → href="/pages/about.html"
```

---

### File: `pages/features.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"

<!-- Line 242: Layout Analyzer card link (already absolute) -->
href="/tools/classifier-review.html" → href="/tools/classifier-review.html"  (no change)
```

**Estimated Time:** 1 hour

---

## Phase 6: Browse Directory Updates (6 files)

### File: `browse/people.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="person.html"                   → href="/entities/person.html"
href="events.html"                   → href="/browse/events.html"
href="organizations.html"            → href="/browse/organizations.html"
href="places.html"                   → href="/browse/places.html"
```

---

### File: `browse/events.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="event.html"                    → href="/entities/event.html"
href="people.html"                   → href="/browse/people.html"
href="places.html"                   → href="/browse/places.html"
```

---

### File: `browse/organizations.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="organization.html"             → href="/entities/organization.html"
href="people.html"                   → href="/browse/people.html"
```

---

### File: `browse/places.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="place.html"                    → href="/entities/place.html"
href="events.html"                   → href="/browse/events.html"
```

---

### File: `browse/objects.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="object.html"                   → href="/entities/object.html"
href="people.html"                   → href="/browse/people.html"
href="events.html"                   → href="/browse/events.html"
```

---

### File: `browse/sources.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="source.html"                   → href="/entities/source.html"
href="people.html"                   → href="/browse/people.html"
href="events.html"                   → href="/browse/events.html"
```

**Estimated Time:** 1.5 hours

---

## Phase 7: Entities Directory Updates (7 files)

### File: `entities/person.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/person-profile.js"    → src="/assets/js/person-profile.js"
src="assets/js/person-cards.js"      → src="/assets/js/person-cards.js"
```

#### Navigation Links
```html
<!-- Breadcrumbs (line ~56) -->
href="index.html"                    → href="/index.html"
href="people.html"                   → href="/browse/people.html"

<!-- Entity links in cards -->
href="event.html"                    → href="/entities/event.html"
href="organization.html"             → href="/entities/organization.html"
href="place.html"                    → href="/entities/place.html"
href="object.html"                   → href="/entities/object.html"
href="source.html"                   → href="/entities/source.html"

<!-- Back button (line ~460) -->
href="people.html"                   → href="/browse/people.html"
```

---

### File: `entities/event.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/event-profile.js"     → src="/assets/js/event-profile.js"
src="assets/js/event-cards.js"       → src="/assets/js/event-cards.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="events.html"                   → href="/browse/events.html"
href="person.html"                   → href="/entities/person.html"
href="organization.html"             → href="/entities/organization.html"
href="place.html"                    → href="/entities/place.html"
href="object.html"                   → href="/entities/object.html"
href="source.html"                   → href="/entities/source.html"
```

---

### File: `entities/organization.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/organization-profile.js" → src="/assets/js/organization-profile.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="organizations.html"            → href="/browse/organizations.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
href="place.html"                    → href="/entities/place.html"
```

---

### File: `entities/place.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/place-profile.js"     → src="/assets/js/place-profile.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="places.html"                   → href="/browse/places.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
```

---

### File: `entities/object.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/object-profile.js"    → src="/assets/js/object-profile.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="objects.html"                  → href="/browse/objects.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
```

---

### File: `entities/source.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/source-profile.js"    → src="/assets/js/source-profile.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="sources.html"                  → href="/browse/sources.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
href="organization.html"             → href="/entities/organization.html"
```

---

### File: `entities/oswald.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
src="assets/js/person-profile.js"    → src="/assets/js/person-profile.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="people.html"                   → href="/browse/people.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
```

**Estimated Time:** 2 hours

---

## Phase 8: Features Directory Updates (3 files)

### File: `features/otd.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="event.html"                    → href="/entities/event.html"
href="person.html"                   → href="/entities/person.html"
```

---

### File: `features/random.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="person.html"                   → href="/entities/person.html"
href="event.html"                    → href="/entities/event.html"
```

---

### File: `features/witness-atlas.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
src="assets/js/db-logic.js"          → src="/assets/js/db-logic.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="person.html"                   → href="/entities/person.html"
href="place.html"                    → href="/entities/place.html"
```

**Estimated Time:** 45 minutes

---

## Phase 9: OCR Directory Updates (2 files)

### File: `ocr/index.html`

#### Asset Links
```html
<!-- If currently using relative paths with ../ -->
href="../assets/css/main.css"        → href="/assets/css/main.css"
src="../assets/js/components.js"     → src="/assets/js/components.js"
src="../assets/js/nav.js"            → src="/assets/js/nav.js"

<!-- Local OCR script (keep relative - in same directory) -->
src="ocr-gui.js"                     → src="/ocr/ocr-gui.js"  (or keep as is if same dir)
```

#### Navigation Links
```html
href="/index.html"                   → href="/index.html"  (no change if already absolute)
href="/tools/document-analyzer.html" → href="/tools/document-analyzer.html"  (no change)
```

---

### File: `ocr/pdf-viewer.html`

#### Asset Links
```html
href="assets/css/main.css"           → href="/assets/css/main.css"
src="assets/js/components.js"        → src="/assets/js/components.js"
src="assets/js/nav.js"               → src="/assets/js/nav.js"
```

#### Navigation Links
```html
href="index.html"                    → href="/index.html"
href="ocr/index.html"                → href="/ocr/index.html"
```

**Estimated Time:** 30 minutes

---

## Phase 10: Tools Directory Updates (7 files)

All tools pages should already be using absolute paths. Verify and fix any that aren't.

### Files to Check:
- `tools/citation-generator.html`
- `tools/classifier-review.html`
- `tools/document-analyzer.html`
- `tools/entity-matcher.html`
- `tools/ocr-features.html`
- `tools/pdf-viewer-features.html`
- `tools/research-tools.html`

### Standard Pattern (verify each file):

#### Asset Links (should be absolute)
```html
href="/assets/css/main.css"          ✅ Correct
src="/assets/js/components.js"       ✅ Correct
src="/assets/js/nav.js"              ✅ Correct

<!-- If any are relative, change to absolute -->
href="../assets/css/main.css"        → href="/assets/css/main.css"
```

#### Navigation Links
```html
href="/index.html"                   ✅ Correct
href="/tools/citation-generator.html" ✅ Correct
```

**Estimated Time:** 30 minutes

---

## Phase 11: JavaScript Updates (6-10 files)

### File: `assets/js/components.js`

Check component loading paths (should already be absolute):

```javascript
// Verify these use absolute paths
fetch('/components/header.html')     // ✅ Correct
fetch('/components/footer.html')     // ✅ Correct
fetch('/components/bottom-nav.html') // ✅ Correct

// If any are relative, change to absolute
fetch('components/header.html')      // ❌ Fix to '/components/header.html'
```

---

### File: `assets/js/nav.js`

Update breadcrumb generation logic:

```javascript
// BEFORE → AFTER
'/people.html'            → '/browse/people.html'
'/person.html'            → '/entities/person.html'
'/events.html'            → '/browse/events.html'
'/event.html'             → '/entities/event.html'
'/organizations.html'     → '/browse/organizations.html'
'/organization.html'      → '/entities/organization.html'
'/places.html'            → '/browse/places.html'
'/place.html'             → '/entities/place.html'
'/objects.html'           → '/browse/objects.html'
'/object.html'            → '/entities/object.html'
'/sources.html'           → '/browse/sources.html'
'/source.html'            → '/entities/source.html'
'/about.html'             → '/pages/about.html'
'/blog.html'              → '/pages/blog.html'
'/features.html'          → '/pages/features.html'
'/otd.html'               → '/features/otd.html'
'/random.html'            → '/features/random.html'
'/witness-atlas.html'     → '/features/witness-atlas.html'
```

---

### File: `assets/js/db-logic.js`

#### Data File Paths (verify absolute)
```javascript
// Should already be absolute
fetch('/assets/data/events.json')
fetch('/assets/data/people.json')
fetch('/assets/data/organizations.json')
fetch('/assets/data/places.json')
fetch('/assets/data/objects.json')
fetch('/assets/data/sources.json')
```

#### Entity Link Generation
```javascript
// BEFORE → AFTER
window.location.href = '/person.html?id=' + id     → '/entities/person.html?id=' + id
window.location.href = '/event.html?id=' + id      → '/entities/event.html?id=' + id
window.location.href = '/organization.html?id=' + id → '/entities/organization.html?id=' + id
window.location.href = '/place.html?id=' + id      → '/entities/place.html?id=' + id
window.location.href = '/object.html?id=' + id     → '/entities/object.html?id=' + id
window.location.href = '/source.html?id=' + id     → '/entities/source.html?id=' + id

// List page links
href = '/people.html'              → '/browse/people.html'
href = '/events.html'              → '/browse/events.html'
href = '/organizations.html'       → '/browse/organizations.html'
href = '/places.html'              → '/browse/places.html'
href = '/objects.html'             → '/browse/objects.html'
href = '/sources.html'             → '/browse/sources.html'
```

---

### File: `assets/js/person-profile.js`

Update entity linking:

```javascript
// BEFORE → AFTER
href = '/event.html?id=' + eventId           → '/entities/event.html?id=' + eventId
href = '/organization.html?id=' + orgId      → '/entities/organization.html?id=' + orgId
href = '/place.html?id=' + placeId           → '/entities/place.html?id=' + placeId
href = '/object.html?id=' + objectId         → '/entities/object.html?id=' + objectId
href = '/source.html?id=' + sourceId         → '/entities/source.html?id=' + sourceId
href = '/people.html'                        → '/browse/people.html'
```

---

### File: `assets/js/event-profile.js`

Update entity linking:

```javascript
// BEFORE → AFTER
href = '/person.html?id=' + personId         → '/entities/person.html?id=' + personId
href = '/place.html?id=' + placeId           → '/entities/place.html?id=' + placeId
href = '/organization.html?id=' + orgId      → '/entities/organization.html?id=' + orgId
href = '/object.html?id=' + objectId         → '/entities/object.html?id=' + objectId
href = '/events.html'                        → '/browse/events.html'
```

---

### Other Entity-Specific JS Files

Apply same pattern to:
- `assets/js/person-cards.js`
- `assets/js/event-cards.js`
- `assets/js/organization-profile.js`
- `assets/js/place-profile.js`
- `assets/js/object-profile.js`
- `assets/js/source-profile.js`

**Pattern:**
```javascript
// Entity detail pages
'/person.html'           → '/entities/person.html'
'/event.html'            → '/entities/event.html'
'/organization.html'     → '/entities/organization.html'
'/place.html'            → '/entities/place.html'
'/object.html'           → '/entities/object.html'
'/source.html'           → '/entities/source.html'

// Browse pages
'/people.html'           → '/browse/people.html'
'/events.html'           → '/browse/events.html'
'/organizations.html'    → '/browse/organizations.html'
'/places.html'           → '/browse/places.html'
'/objects.html'          → '/browse/objects.html'
'/sources.html'          → '/browse/sources.html'
```

**Estimated Time:** 1-2 hours

---

## Testing Checklist

### Pre-Testing Setup

```bash
# Start local development server
# Option 1: Python
python -m http.server 8000 --directory docs/ui

# Option 2: Node.js (if installed)
npx http-server docs/ui -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Navigate to: `http://localhost:8000/`

---

### Navigation Tests (Critical Path)

**Homepage (`/index.html`)**
- [ ] Load homepage - no console errors
- [ ] Click header logo - returns to homepage
- [ ] Click "About This Project" button - loads `/pages/about.html`
- [ ] Click "Events" card (Browse section) - loads `/browse/events.html`
- [ ] Click "People" card (Browse section) - loads `/browse/people.html`
- [ ] Click "On This Day" card - loads `/features/otd.html`
- [ ] Click "OCR Tool" card - loads `/tools/ocr-features.html`
- [ ] Click "Classifier Review" card - loads `/tools/classifier-review.html`

**Header Dropdown Menu**
- [ ] Click "About" - loads `/pages/about.html`
- [ ] Click "Blog" - loads `/pages/blog.html`
- [ ] Click "Events" - loads `/browse/events.html`
- [ ] Click "People" - loads `/browse/people.html`
- [ ] Click "Organizations" - loads `/browse/organizations.html`
- [ ] Click "Places" - loads `/browse/places.html`
- [ ] Click "Objects" - loads `/browse/objects.html`
- [ ] Click "Sources" - loads `/browse/sources.html`
- [ ] Click "Links" - loads `/pages/links.html`
- [ ] Click "On This Day" - loads `/features/otd.html`
- [ ] Click "Six Degrees" - loads `/features/random.html`
- [ ] Click "Witness Atlas" - loads `/features/witness-atlas.html`
- [ ] Click "Vision & Roadmap" - loads `/pages/features.html`
- [ ] Click "OCR Tool" - loads `/ocr/index.html`
- [ ] Click "Citation Generator" - loads `/tools/citation-generator.html`
- [ ] Click "Document Analyzer" - loads `/tools/document-analyzer.html`
- [ ] Click "Entity Matcher" - loads `/tools/entity-matcher.html`
- [ ] Click "Research Tools" - loads `/tools/research-tools.html`
- [ ] Click "Classifier Review" - loads `/tools/classifier-review.html`

**Entity Pages**
- [ ] Load `/browse/people.html` - page displays correctly
- [ ] Click a person card - loads `/entities/person.html?id=...`
- [ ] Verify breadcrumb: Archive > People > [Person Name]
- [ ] Click breadcrumb "People" - returns to `/browse/people.html`
- [ ] Click breadcrumb "Archive" - returns to `/index.html`
- [ ] Verify all entity cards load (Events, Organizations, etc.)

**Browse Pages**
- [ ] Load `/browse/events.html` - page displays correctly
- [ ] Load `/browse/organizations.html` - page displays correctly
- [ ] Load `/browse/places.html` - page displays correctly
- [ ] Load `/browse/objects.html` - page displays correctly
- [ ] Load `/browse/sources.html` - page displays correctly

**Features Pages**
- [ ] Load `/features/otd.html` - page displays correctly
- [ ] Load `/features/random.html` - page displays correctly
- [ ] Load `/features/witness-atlas.html` - page displays correctly

**Tools Pages**
- [ ] Load `/tools/citation-generator.html` - page displays correctly
- [ ] Load `/tools/classifier-review.html` - page displays correctly
- [ ] Load `/tools/document-analyzer.html` - page displays correctly
- [ ] Load `/tools/entity-matcher.html` - page displays correctly
- [ ] Load `/tools/ocr-features.html` - page displays correctly
- [ ] Load `/tools/pdf-viewer-features.html` - page displays correctly
- [ ] Load `/tools/research-tools.html` - page displays correctly

**OCR Pages**
- [ ] Load `/ocr/index.html` - page displays correctly
- [ ] Load `/ocr/pdf-viewer.html` - page displays correctly

**Static Pages**
- [ ] Load `/pages/about.html` - page displays correctly
- [ ] Load `/pages/blog.html` - page displays correctly
- [ ] Load `/pages/blog-post.html` - page displays correctly
- [ ] Load `/pages/links.html` - page displays correctly
- [ ] Load `/pages/features.html` - page displays correctly

---

### Asset Loading Tests

**Open Browser DevTools (F12) → Network Tab**

- [ ] Load homepage - verify all CSS loads (no 404s)
- [ ] Load homepage - verify all JS loads (no 404s)
- [ ] Load homepage - verify all fonts load (no 404s)
- [ ] Load `/entities/person.html` - verify all assets load
- [ ] Load `/browse/people.html` - verify all assets load
- [ ] Load `/features/otd.html` - verify all assets load
- [ ] Load `/tools/citation-generator.html` - verify all assets load
- [ ] Load `/ocr/index.html` - verify all assets load

**Check Console for Errors**
- [ ] No 404 errors for CSS files
- [ ] No 404 errors for JS files
- [ ] No 404 errors for component files
- [ ] No 404 errors for data files

---

### Component Loading Tests

**Verify modular components load:**
- [ ] Header displays on all pages
- [ ] Footer displays on all pages
- [ ] Bottom nav displays on all pages
- [ ] Bottom nav highlights correct active page

---

### JavaScript Functionality Tests

**Dynamic Features:**
- [ ] Homepage: "Recently Added" section populates with data
- [ ] Browse pages: Entity cards populate from JSON data
- [ ] Entity pages: Cards populate dynamically (Biography, Events, etc.)
- [ ] Search page: Search functionality works
- [ ] OCR tool: File upload interface works

**Entity Linking:**
- [ ] Person page: Click event link → loads correct event
- [ ] Event page: Click person link → loads correct person
- [ ] Organization page: Click member link → loads correct person
- [ ] Place page: Click event link → loads correct event

---

### Breadcrumb Tests

**Verify breadcrumbs display correct paths:**
- [ ] Person page: Archive > People > [Person Name]
- [ ] Event page: Archive > Events > [Event Name]
- [ ] Organization page: Archive > Organizations > [Org Name]
- [ ] Place page: Archive > Places > [Place Name]
- [ ] Object page: Archive > Objects > [Object Name]
- [ ] Source page: Archive > Sources > [Source Name]

---

### Mobile Responsiveness Tests

**Test on mobile viewport (DevTools → Toggle Device Toolbar):**
- [ ] Header hamburger menu works
- [ ] Bottom nav displays correctly
- [ ] Entity cards stack vertically
- [ ] Browse cards display correctly
- [ ] Tool cards display correctly

---

### Cross-Browser Tests (Optional but Recommended)

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

---

## Rollback Plan

### If Issues Occur During Refactor:

#### Option 1: Restore from Backup
```bash
# Stop immediately
# Delete broken state
rm -rf docs/ui

# Restore from backup
cp -r docs/ui-backup-YYYYMMDD-HHMMSS docs/ui
```

#### Option 2: Git Rollback
```bash
# If using git branch
git checkout main
git branch -D refactor-site-structure

# If committed to main
git reset --hard HEAD~1  # Go back 1 commit
git reset --hard <commit-hash>  # Go back to specific commit
```

#### Option 3: Selective Rollback

**If only certain pages are broken:**
```bash
# Restore specific file from backup
cp docs/ui-backup-YYYYMMDD/index.html docs/ui/index.html
cp docs/ui-backup-YYYYMMDD/components/header.html docs/ui/components/header.html
```

---

### Post-Rollback Actions

1. **Document what went wrong**
   - Which phase caused the issue?
   - Which files were affected?
   - What error messages appeared?

2. **Fix the issue in isolation**
   - Test the fix on a single file
   - Verify it works before applying site-wide

3. **Re-attempt refactor**
   - Start from Phase 1 again
   - Apply lessons learned

---

## Summary Statistics

### Files to Move: **23**
- Pages: 5
- Browse: 6
- Entities: 7
- Features: 3
- OCR: 1
- Delete: 1 (duplicate)

### Files to Update: **45-50**
- Components: 3
- Root pages: 2
- Pages directory: 5
- Browse directory: 6
- Entities directory: 7
- Features directory: 3
- OCR directory: 2
- Tools directory: 7 (verify only)
- JavaScript files: 6-10

### Total Link Updates: **200-250**
- Header component: 13
- Index.html: 20
- Entity templates: ~100 (7 files × ~15 links each)
- Browse pages: ~60 (6 files × ~10 links each)
- Other pages: ~50

### Time Estimates by Phase:

| Phase | Description | Time |
|-------|-------------|------|
| 0 | Pre-flight (backup, setup) | 10 min |
| 1 | Directory creation | 1 min |
| 2 | File moves | 5 min |
| 3 | Component updates | 30 min |
| 4 | Root page updates | 45 min |
| 5 | Pages directory updates | 1 hour |
| 6 | Browse directory updates | 1.5 hours |
| 7 | Entities directory updates | 2 hours |
| 8 | Features directory updates | 45 min |
| 9 | OCR directory updates | 30 min |
| 10 | Tools directory updates | 30 min |
| 11 | JavaScript updates | 1-2 hours |
| 12 | Testing + debugging | 2-3 hours |

**Total Estimated Time:** 10-13 hours

---

## Implementation Schedule Recommendation

### Day 1 (3-4 hours)
- **Morning:** Phases 0-4 (Setup through root pages)
- **Test:** Verify homepage and header navigation work
- **Git commit:** "Refactor: Phases 1-4 complete - directory structure and root pages"

### Day 2 (3-4 hours)
- **Morning:** Phases 5-7 (Pages, Browse, Entities directories)
- **Test:** Verify entity pages load and link correctly
- **Git commit:** "Refactor: Phases 5-7 complete - subdirectory pages"

### Day 3 (3-4 hours)
- **Morning:** Phases 8-11 (Features, OCR, Tools, JavaScript)
- **Afternoon:** Full site testing
- **Test:** Run complete testing checklist
- **Git commit:** "Refactor: Complete - all pages updated and tested"

---

## Success Criteria

✅ All pages load without 404 errors
✅ All assets (CSS, JS, fonts) load correctly
✅ Header dropdown navigation works
✅ Bottom nav works on all pages
✅ Entity linking works (person → event, etc.)
✅ Breadcrumbs display correct paths
✅ Search functionality works
✅ Dynamic data loading works (Recently Added, entity cards, etc.)
✅ No console errors in browser DevTools
✅ Mobile responsive layout intact
✅ Root directory contains only 2 files (index.html, search.html)

---

## Post-Refactor Documentation

### Files to Create/Update:

1. **`docs/ui/README.md`** (create if doesn't exist)
   - Document new directory structure
   - Explain path conventions (absolute paths)
   - List where to add new pages

2. **`docs/ui/STRUCTURE.md`** (create)
   - Visual directory tree
   - Purpose of each directory
   - File naming conventions

3. **Update CLAUDE.md** (if exists)
   - Update file location references
   - Update path examples
   - Add note about refactor completion

---

## Notes for Future Development

### Adding New Pages

**Static content page:**
```bash
# Create in /pages/
touch docs/ui/pages/new-page.html
# Use absolute paths: href="/assets/css/main.css"
```

**Browse/list page:**
```bash
# Create in /browse/
touch docs/ui/browse/new-entities.html
# Link to entity detail: href="/entities/new-entity.html"
```

**Entity detail template:**
```bash
# Create in /entities/
touch docs/ui/entities/new-entity.html
# Link back to browse: href="/browse/new-entities.html"
```

**Interactive feature:**
```bash
# Create in /features/
touch docs/ui/features/new-feature.html
# Use absolute paths for all assets and links
```

**Tool documentation:**
```bash
# Create in /tools/
touch docs/ui/tools/new-tool.html
# Follow existing tool page template
```

### Path Convention Rules

**ALWAYS use absolute paths (root-relative):**
```html
✅ href="/assets/css/main.css"
✅ href="/pages/about.html"
✅ href="/entities/person.html?id=123"

❌ href="assets/css/main.css"
❌ href="../assets/css/main.css"
❌ href="person.html"
```

---

## Contact & Support

**Questions during refactor?**
- Check this document first
- Review `SITE-STRUCTURE-ANALYSIS.md` for context
- Test changes incrementally (don't batch all phases)
- Keep backup available for quick rollback

**Post-refactor issues?**
- Check browser console for 404 errors
- Verify all `href` and `src` attributes use absolute paths
- Check that files moved to correct directories
- Verify JavaScript path updates match new structure

---

**End of Refactor Guide**

Good luck! Remember to test frequently and commit often. 🚀
