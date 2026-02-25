# Repository Restructure Analysis - Next.js Migration Planning

**Date:** 2026-02-24
**Status:** 📋 PLANNING
**Context:** Migrating from HTML prototype to Next.js production app

---

## Current State

```
primary-sources/
├── docs/
│   ├── ui/                           ← HTML prototype (just refactored)
│   │   ├── index.html
│   │   ├── pages/
│   │   ├── browse/
│   │   ├── entities/
│   │   ├── features/
│   │   ├── components/
│   │   └── assets/
│   └── [architecture docs]
├── web/                              ← Reserved for Next.js (minimal, not init)
│   ├── README.md
│   └── .env.example
├── supabase/                         ← Database migrations
├── tools/                            ← Python OCR tools
├── data/                             ← Raw data files
└── [root documentation]
```

**Issues:**
- `docs/ui/` suggests documentation but contains production prototype
- `web/` exists but unused (planned for Next.js)
- Server paths now use `/docs/ui/` which is confusing
- Unclear separation between prototype and production code

---

## Your Proposal

Move `docs/ui/` to `web/` with subdirectories:

```
primary-sources/
├── web/
│   ├── html/                         ← Current HTML prototype
│   └── next/                         ← Next.js build
├── docs/                             ← Only documentation
├── supabase/
├── tools/
└── data/
```

---

## Option Analysis

### **Option 1: Your Proposal (Dual Frontend)**

```
primary-sources/
├── web/
│   ├── html/                         # Static HTML prototype
│   │   ├── index.html
│   │   ├── pages/
│   │   ├── browse/
│   │   └── assets/
│   └── next/                         # Next.js production app
│       ├── package.json
│       ├── app/
│       ├── components/
│       └── public/
├── docs/                             # Only documentation
│   ├── architecture-and-schema.md
│   ├── ontology-and-controlled-vocab.md
│   └── ...
├── supabase/                         # Database
├── tools/                            # OCR tools
└── data/                             # Raw data
```

**Pros:**
- ✅ Clear separation: prototype vs. production
- ✅ Both frontends accessible during migration
- ✅ Can compare implementations side-by-side
- ✅ Easy to deprecate `html/` after migration complete
- ✅ `docs/` becomes pure documentation (cleaner)
- ✅ Can run both simultaneously on different ports

**Cons:**
- ❌ `web/html/` needs path updates (all `/docs/ui/` → `/web/html/`)
- ❌ Two frontend codebases to maintain during migration
- ❌ May be confusing which is "canonical"
- ❌ Duplicate assets/components during migration period

**Migration Path:**
1. Move `docs/ui/` → `web/html/`
2. Update all paths `/docs/ui/` → `/web/html/`
3. Initialize Next.js in `web/next/`
4. Migrate features incrementally
5. Delete `web/html/` when migration complete

**Best for:** Long migration period (months), need both apps running

---

### **Option 2: Replace in Place (Clean Cut)**

```
primary-sources/
├── web/                              # Next.js app (replaces HTML prototype)
│   ├── package.json
│   ├── app/
│   ├── components/
│   ├── public/
│   └── legacy/                       # Archived HTML prototype (optional)
├── docs/                             # Documentation only
├── supabase/
├── tools/
└── data/
```

**Pros:**
- ✅ Clean structure - one frontend at a time
- ✅ No dual maintenance burden
- ✅ Clear "this is the app" location
- ✅ Simpler mental model
- ✅ No path confusion
- ✅ Standard Next.js structure

**Cons:**
- ❌ Loses working prototype immediately
- ❌ Can't compare implementations
- ❌ Harder to reference during migration
- ❌ More pressure to complete migration quickly

**Migration Path:**
1. Archive `docs/ui/` → `web/legacy/` or `docs/archived/html-prototype/`
2. Initialize Next.js in `web/`
3. Migrate all features
4. Delete legacy when confident

**Best for:** Fast migration (weeks), confident in Next.js approach

---

### **Option 3: Feature Parity First (Monorepo-style)**

```
primary-sources/
├── apps/
│   ├── prototype/                    # HTML prototype
│   └── web/                          # Next.js app
├── packages/                         # Shared code (future)
│   ├── types/
│   └── constants/
├── docs/
├── supabase/
├── tools/
└── data/
```

**Pros:**
- ✅ True monorepo structure (future-proof)
- ✅ Can add more apps later (mobile, admin panel, etc.)
- ✅ Shared code between apps
- ✅ Industry standard for multi-app projects
- ✅ Easy to add build orchestration (Turborepo, Nx)

**Cons:**
- ❌ Over-engineered for current needs
- ❌ Requires workspace setup (pnpm/yarn workspaces)
- ❌ More complex build configuration
- ❌ Overkill if only one final app

**Best for:** If planning multiple apps (admin panel, mobile, etc.)

---

### **Option 4: Minimal Move (Your Proposal Simplified)**

```
primary-sources/
├── web/                              # Next.js app
│   ├── package.json
│   ├── app/
│   └── ...
├── prototype/                        # HTML prototype (root level)
│   ├── index.html
│   ├── pages/
│   └── assets/
├── docs/
├── supabase/
├── tools/
└── data/
```

**Pros:**
- ✅ Simplest restructure
- ✅ Clear separation at root level
- ✅ `web/` ready for standard Next.js
- ✅ Prototype easily accessible
- ✅ Minimal path changes needed

**Cons:**
- ❌ Root directory more cluttered
- ❌ `prototype/` at same level as `web/` feels odd
- ❌ Less scalable than Option 3

**Best for:** Quick restructure, medium migration timeline

---

## Detailed Comparison

| Aspect | Option 1 (Dual) | Option 2 (Replace) | Option 3 (Monorepo) | Option 4 (Minimal) |
|--------|-----------------|--------------------|--------------------|-------------------|
| **Complexity** | Medium | Low | High | Low |
| **Migration Time** | Slow (flexible) | Fast (forced) | Slow (flexible) | Medium |
| **Maintenance** | Dual codebases | Single codebase | Shared packages | Dual codebases |
| **Scalability** | Medium | Low | Very High | Low |
| **Path Changes** | Many (`/docs/ui/` → `/web/html/`) | Minimal | Many | Many (`/docs/ui/` → `/prototype/`) |
| **Future-Proof** | Medium | Low | Very High | Low |
| **Developer UX** | Medium (two apps) | High (one app) | Medium (setup) | High |

---

## Recommended Approach: **Option 1 (Your Proposal)**

I recommend **your original proposal**:

```
primary-sources/
├── web/
│   ├── html/                         # HTML prototype
│   │   ├── index.html
│   │   ├── pages/
│   │   ├── browse/
│   │   ├── entities/
│   │   ├── features/
│   │   ├── components/
│   │   └── assets/
│   └── next/                         # Next.js app
│       ├── package.json
│       ├── next.config.js
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── public/
├── docs/                             # Documentation only
│   ├── architecture-and-schema.md
│   ├── ui/                           # UI documentation (keep this)
│   │   ├── REFACTOR-STATUS.md
│   │   ├── COLLAPSIBLE-MENU-IMPLEMENTATION.md
│   │   └── PATH-FIX-PLAN.md
│   └── ...
├── supabase/                         # Database
├── tools/                            # OCR tools
└── data/                             # Raw data
```

### Why This Structure?

**Using `web/html/`:**
- Clear indication of technology stack
- Allows future experimentation with other UI frameworks (Svelte, Vue, etc.)
- Each framework gets its own directory (`web/svelte/`, `web/vue/`, etc.)
- Easy to compare different implementations side-by-side

**Using `web/next/` (not `web/app/`):**
- More descriptive - explicitly states it's the Next.js implementation
- Consistent with framework-specific naming pattern
- Avoids confusion with Next.js internal `/app/` directory

**Keep: `docs/ui/` for documentation**
- REFACTOR-STATUS.md belongs in docs
- PATH-FIX-PLAN.md is documentation
- COLLAPSIBLE-MENU-IMPLEMENTATION.md is documentation
- Separation: code in `web/`, docs about code in `docs/ui/`

---

## Migration Implementation Plan

### Phase 1: Restructure (1-2 hours)

**Step 1: Move HTML Prototype**
```bash
# Create directory structure
mkdir -p web/html

# Move docs/ui/ contents to web/html/
mv docs/ui/* web/html/

# Move UI documentation to docs/ui/ (keep docs separate)
mkdir docs/ui
mv web/html/REFACTOR-STATUS.md docs/ui/
mv web/html/PATH-FIX-PLAN.md docs/ui/
mv web/html/COLLAPSIBLE-MENU-IMPLEMENTATION.md docs/ui/
mv web/html/REFACTOR.md docs/ui/
mv web/html/SITE-STRUCTURE-ANALYSIS.md docs/ui/
mv web/html/STRUCTURE.md docs/ui/
```

**Step 2: Update Paths**
All instances of `/docs/ui/` → `/web/html/`:
- `assets/js/components.js` - Line 12
- `assets/js/db-logic.js` - Lines 54-59, 71, 114-117, 187, 231, 285-290, 378
- `assets/js/*-profile.js` - 6 files, 2 changes each
- `assets/js/blog-post.js` - 3 changes
- `browse/people.html` - 1 change
- `components/header.html` - All navigation links
- `components/bottom-nav.html` - All navigation links

**Estimated:** ~30 files to update

**Step 3: Update Server**
```bash
# Run server from new location
cd web/html
python -m http.server 8000
# Access at: http://localhost:8000/index.html
```

**Step 4: Update Documentation**
- Update CLAUDE.md project structure section
- Update README.md with new paths
- Add migration status to REFACTOR-STATUS.md

### Phase 2: Initialize Next.js (30 minutes)

```bash
cd web
npx create-next-app@latest next --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**Configuration:**
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ App Router
- ✅ src/ directory
- ✅ Import alias (@/*)

**Initial Setup:**
```bash
cd web/next
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
```

### Phase 3: Incremental Migration (ongoing)

**Priority Order:**
1. **Database Integration** - Supabase client, types
2. **Core Components** - Header, Footer, Navigation
3. **Entity Pages** - Person, Event, Organization, etc.
4. **Browse Pages** - Lists with filtering
5. **Feature Pages** - OTD, Random, Witness Atlas
6. **Tool Pages** - Documentation pages
7. **OCR Integration** - Connect to Python OCR tools

**Strategy:**
- Route-by-route migration
- Reuse CSS patterns (convert to Tailwind classes)
- Reuse component logic (convert to React components)
- Keep prototype running for reference
- Test each route before marking complete

### Phase 4: Cleanup (after migration)

Once Next.js app reaches feature parity:
1. Archive prototype: `web/html/` → `docs/archived/html-prototype/`
2. Update all documentation
3. Remove prototype from production deployment
4. Celebrate! 🎉

---

## Path Update Details

### Files Requiring Path Updates (After Move)

**Critical JavaScript Files:**
1. `web/html/assets/js/components.js`
   - Line 12: `fetch(/web/html/components/${componentName}.html)`

2. `web/html/assets/js/db-logic.js`
   - Lines 54-59: Entity links → `/web/html/entities/...`
   - Line 71: PDF viewer → `/web/html/ocr/pdf-viewer.html`
   - Lines 114-117: Data fetches → `/web/html/assets/data/...`
   - Line 187: Data fetch → `/web/html/assets/data/${dataSource}.json`
   - Line 231: Events data → `/web/html/assets/data/events.json`
   - Lines 285-290: All data files → `/web/html/assets/data/...`
   - Line 378: Event link → `/web/html/entities/event.html`

3. `web/html/assets/js/*-profile.js` (6 files)
   - Data fetch: `/web/html/assets/data/...`
   - Back link: `/web/html/browse/...`

4. `web/html/assets/js/blog-post.js`
   - Data fetch: `/web/html/assets/data/blog.json`
   - Post links: `/web/html/pages/blog-post.html`
   - Back link: `/web/html/pages/blog.html`

**HTML Component Files:**
5. `web/html/components/header.html`
   - All `href` attributes (20+ links)

6. `web/html/components/bottom-nav.html`
   - All `href` attributes (5 links)

**HTML Page Files:**
7. `web/html/browse/people.html`
   - Data filters path

**Total:** ~30 files, ~100 individual path updates

### Automated Update Script

```bash
#!/bin/bash
# run-path-update.sh
# Updates all /docs/ui/ references to /web/html/

cd web/html

# JavaScript files
find assets/js -name "*.js" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (components)
find components -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (browse pages)
find browse -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (entities)
find entities -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (features)
find features -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (pages)
find pages -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (tools)
find tools -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# HTML files (ocr)
find ocr -name "*.html" -type f -exec sed -i 's|/docs/ui/|/web/html/|g' {} \;

# Root HTML files
sed -i 's|/docs/ui/|/web/html/|g' index.html
sed -i 's|/docs/ui/|/web/html/|g' search.html

echo "Path update complete!"
```

---

## Alternative: Option 2 (If Fast Migration Preferred)

If you want to move quickly and archive the prototype:

```
primary-sources/
├── web/                              # Next.js app (fresh start)
│   ├── next/                         # Next.js implementation
│   │   ├── package.json
│   │   ├── app/
│   │   └── ...
├── docs/
│   ├── archived/
│   │   └── html-prototype/           # Archived HTML prototype
│   │       ├── index.html
│   │       └── ...
│   └── ui/                           # UI documentation
│       ├── REFACTOR-STATUS.md
│       └── ...
├── supabase/
├── tools/
└── data/
```

**Pros:**
- Cleaner - one active frontend
- Forces migration focus
- No path updates needed for Next.js

**Cons:**
- Prototype not easily runnable
- Harder to reference during development

---

## Recommendation Summary

**I recommend: Option 1 - `web/html/` + `web/next/`**

### Why?

1. **Clear Separation** - Prototype and production app distinct
2. **Flexible Migration** - No rush, both can run simultaneously
3. **Reference Available** - Easy to compare implementations
4. **Industry Standard** - Aligns with monorepo patterns
5. **Future-Proof** - Easy to add more apps later (admin panel, mobile)
6. **Clean Documentation** - `docs/` stays pure documentation

### Implementation:

**Short-term (This Week):**
- Move `docs/ui/` → `web/html/`
- Update all paths (automated script)
- Move UI docs to `docs/ui/`
- Test prototype still works

**Medium-term (Next 1-2 Months):**
- Initialize Next.js in `web/next/`
- Set up Supabase integration
- Migrate core components
- Migrate entity pages

**Long-term (3-6 Months):**
- Complete feature parity
- Archive prototype
- Production deployment

---

## Decision Checklist

Before proceeding, consider:

- [ ] **Migration Timeline** - How long will migration take?
  - Fast (weeks) → Option 2 (Replace in Place)
  - Medium (1-3 months) → **Option 1 (Recommended)**
  - Long (3-6 months) → Option 1 or Option 3

- [ ] **Team Size** - Solo or multiple developers?
  - Solo → Option 1 or 2
  - Team → Option 3 (monorepo better for teams)

- [ ] **Future Plans** - Will you add more apps?
  - Just one web app → Option 1 or 2
  - Multiple apps planned → **Option 3**

- [ ] **Maintenance Burden** - Can you maintain both?
  - Prefer single codebase → Option 2
  - Can maintain dual → **Option 1**

- [ ] **Reference Needs** - How often will you reference prototype?
  - Rarely → Option 2
  - Frequently → **Option 1**

---

## Next Steps

**If you choose Option 1 (Recommended):**

1. **Review this document**
2. **Approve path update strategy**
3. **I can execute the restructure** (automated)
4. **Test prototype in new location**
5. **Begin Next.js initialization**

**If you choose Option 2:**

1. **Archive prototype now**
2. **Initialize Next.js in `web/next/`**
3. **Rapid migration sprint**

**If you choose Option 3:**

1. **Set up monorepo tooling** (Turborepo/Nx)
2. **Configure workspaces**
3. **Move both apps**
4. **Set up shared packages**

---

**What's your preference?** I'm ready to execute whichever option you choose!
