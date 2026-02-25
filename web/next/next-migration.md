# Next.js Migration Plan

**Date:** 2026-02-24
**Status:** 📋 PLANNING
**Target Directory:** `web/next/`

---

## Migration Strategy: Incremental Parity

The goal of this migration is to transition the "Primary Sources" forensic engine from a static HTML/JS prototype to a production-grade Next.js application without losing research utility during the process.

---

## 🛠 Next.js Initialization

Once the repository restructure is complete, the Next.js application will be initialized in the `web/next/` directory.

```bash
cd web
npx create-next-app@latest next --typescript --tailwind --app --src-dir --import-alias "@/*"
```

### Initial Configuration
- **TypeScript**: Ensuring type-safety for the forensic data model.
- **Tailwind CSS**: Maintaining styling consistency with the prototype.
- **App Router**: Leveraging React Server Components for performance.
- **Supabase Integration**:
  ```bash
  cd web/next
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  ```

---

## 📈 Incremental Migration Phases

### Phase 1: Core Technical Foundation
1. **Database Integration**: Set up Supabase clients and TypeScript types for 4NF schema.
2. **Design System**: Migrate CSS tokens from `main.css` to Tailwind config.
3. **Layout**: Re-implement `header`, `footer`, and `bottom-nav` as React components.

### Phase 2: Page Migration (Priority Order)
1. **Entity Details**: Singular deep-dives (Person, Event, Organization).
2. **Browse Indexes**: List views with complex filtering.
3. **Features**: Witness Atlas, OTD, and Random entry tools.
4. **Analytical Tools**: Citation generator and document analyzer.

---

## ⚖️ Alternative Migration Options

### Option: Replace in Place (Clean Cut)
*Archive prototype immediately and focus 100% on Next.js.*
- **Pros**: Zero dual maintenance; single canonical codebase.
- **Cons**: High pressure; no side-by-side comparison for data verification.

### Option: Monorepo-style (Scalable)
*Set up workspaces (pnpm/Turborepo) for multi-app management.*
- **Pros**: Future-proof for mobile/admin apps.
- **Cons**: Over-engineered for current solo/small-team needs.

---

## ✅ Migration Decision Checklist

- [ ] **Data Integrity**: Are the Next.js queries returning the exact metadata as the prototype JSON?
- [ ] **UX Parity**: Does the Next.js filtering feel as fast/responsive as the JS implementation?
- [ ] **OCR Integration**: Can the new app correctly link to the Python OCR tools in `/tools/`?
- [ ] **Maintenance**: Can we successfully deprecate `web/html/` without losing feature support?

---

## 🏁 Final Cleanup
Once the Next.js application reaches feature parity:
1. Move `web/html/` to `docs/archived/html-prototype/`.
2. Update all documentation to point to the new production app.
3. Remove legacy dependencies.

---
*Reference: Detailed path refactor logic available in `RESTRUCTURE-ANALYSIS.md`.*
