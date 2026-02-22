# Documentation Task Map for Agent

## Quick Reference

| Task | File | Type | Lines/Section |
|------|------|------|---------------|
| 1.1 | `supabase/README.md` | REPLACE | Line 12 (directory structure) |
| 1.2 | `supabase/README.md` | ADD | After line 23 (running steps) |
| 1.3 | `supabase/README.md` | REPLACE | Lines 41-44 (psql commands) |
| 2.1 | `docs/architecture-and-schema.md` | REPLACE | Lines 47-52 (Section 5.2 expansion) |
| 2.2 | `docs/architecture-and-schema.md` | ADD | After Section 5.2 (new Section 5.3) |
| 2.3 | `docs/architecture-and-schema.md` | ADD | Section 6 (~line 54, index additions) |
| 3.1 | `docs/data-entry-sop.md` | ADD | After line 26 (Phase II note) |

## File-by-File Summary

### File 1: `supabase/README.md`
**3 changes required**

1. Update directory tree to include `004_integrity_fixes.sql`
2. Add steps 5-6 to "Option A" instructions
3. Add line for 003 and 004 to "Option C" psql commands

**Impact:** Users will know migration 004 exists and how to run it

---

### File 2: `docs/architecture-and-schema.md`
**3 changes required**

1. Expand Section 5.2 to document 10+ new triggers (polymorphic FKs, timestamps, time precision, deletion protection)
2. Add new Section 5.3 for CHECK constraints
3. Update Section 6 with new index information and de-duplication query pattern

**Impact:** Complete technical reference of all database constraints and triggers

**⚠️ Important:** After adding Section 5.3, renumber all subsequent sections:
- Current Section 6 → Section 7
- Current Section 7 → Section 8
- Current Section 8 → Section 9

---

### File 3: `docs/data-entry-sop.md`
**1 change required**

1. Add integrity protection note in Phase II (after step 4)

**Impact:** Users understand the database will automatically validate entity_identifier entries

---

## Execution Order

Recommended order for minimal conflicts:

1. **First:** `supabase/README.md` (straightforward additions)
2. **Second:** `docs/data-entry-sop.md` (single addition)
3. **Last:** `docs/architecture-and-schema.md` (requires section renumbering)

---

## Expected Outcome

After completion:
- All documentation reflects migration 004 features
- Users know how to run all four migrations
- Technical reference is complete and accurate
- Data entry workflow includes integrity validation notes

---

## Reference

Full detailed instructions: `archived/doc-update-instructions.md`
