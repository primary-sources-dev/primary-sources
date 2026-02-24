# Entity Page Audit Report

**Date:** 2026-02-24
**Purpose:** Ensure card registry pattern consistency and align baseline data with Supabase schema

---

## 1. Card Registry Consistency Audit

### Pattern Requirements

All entity profile pages must follow this consistent pattern:

```javascript
const CARD_REGISTRY = {
  cardId: {
    icon: 'material_icon_name',      // Material Symbols icon
    title: 'Card Title',              // Display title
    dataField: 'schema_field_name',   // Maps to JSON/DB field
    autoExpand: true | false | fn,    // Expansion behavior
    showWhen: (data) => boolean,      // Visibility condition
    populate: (data) => void          // Content renderer
  }
};
```

### Audit Results

| Entity | Profile JS | Cards | Pattern | Status |
|--------|-----------|-------|---------|--------|
| Person | `person-profile.js` | 12 | ✅ Consistent | OK |
| Event | `event-profile.js` | 9 | ✅ Consistent | OK |
| Organization | `organization-profile.js` | 7 | ✅ Consistent | OK |
| Place | `place-profile.js` | 7 | ✅ Consistent | OK |
| Object | `object-profile.js` | 8 | ✅ Consistent | OK |
| Source | `source-profile.js` | 8 | ✅ Consistent | OK |

**Result:** All 6 entity profiles use consistent card registry pattern ✅

---

## 2. Baseline Data Format Audit

### Supabase Schema Field Names (Canonical)

| Entity | Primary Key | Type Field | Description Field |
|--------|-------------|------------|-------------------|
| person | `person_id` | — | `notes` |
| org | `org_id` | `org_type` | `notes` |
| place | `place_id` | `place_type` | `notes` |
| object | `object_id` | `object_type` | `notes` |
| event | `event_id` | `event_type` | `notes` (context) |
| source | `source_id` | `source_type` | `notes` |

### Issues Found

| File | Issue | Current | Should Be |
|------|-------|---------|-----------|
| `organizations.json` | Wrong primary key | `organization_id` | `org_id` |
| `organizations.json` | Wrong type field | `type` | `org_type` |
| `places.json` | Wrong type field | `type` | `place_type` |
| `objects.json` | Wrong type field | `type` | `object_type` |
| `sources.json` | Wrong type field | `type` | `source_type` |
| All baseline files | Using `description` | `description` | OK for display (maps to `notes`) |

### Additional Field Mappings

The baseline data uses some display-friendly field names that map to schema fields:

| Baseline Field | Schema Field | Notes |
|------------|--------------|-------|
| `description` | `notes` | OK - UI display name |
| `display_name` | — | UI convenience field (computed) |
| `label` | — | UI convenience field (computed) |
| `events` | Junction via `event_participant` etc. | Denormalized for baseline |
| `sources` | Junction via `assertion_support` | Denormalized for baseline |

---

## 3. Required Fixes

### 3.1 Baseline Data Files

**organizations.json:**
- [x] Rename `organization_id` → `org_id`
- [x] Rename `type` → `org_type`
- [x] Rename `people` → `members` (matches card registry)

**places.json:**
- [x] Rename `type` → `place_type`

**objects.json:**
- [x] Rename `type` → `object_type`

**sources.json:**
- [x] Rename `type` → `source_type`

### 3.2 Profile JS Files

**organization-profile.js:**
- [x] Update to use `org_id` instead of `organization_id`

### 3.3 JS File Renames (Version Consolidation)

| Old Name | New Name | Archived Original |
|----------|----------|-------------------|
| `person-v2-profile.js` | `person-profile.js` | `archived/person-profile-original.js` |
| `person-v2-cards.js` | `person-cards.js` | `archived/person-cards-original.js` |
| `event-v1-profile.js` | `event-profile.js` | — (no prior version) |
| `event-v1-cards.js` | `event-cards.js` | — (no prior version) |

### 3.4 HTML File Updates

**person.html:**
- [x] Update script references from `person-v2-*.js` → `person-*.js`

**event.html:**
- [x] Update script references from `event-v1-*.js` → `event-*.js`

---

## 4. Schema Reference

### Core Entity Tables

```sql
-- person
CREATE TABLE person (
    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    given_name TEXT,
    middle_name TEXT,
    family_name TEXT,
    birth_date DATE,
    death_date DATE,
    notes TEXT
);

-- org
CREATE TABLE org (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    org_type TEXT REFERENCES v_org_type(code),
    notes TEXT,
    start_date DATE,
    end_date DATE
);

-- place
CREATE TABLE place (
    place_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    place_type TEXT REFERENCES v_place_type(code),
    parent_place_id UUID REFERENCES place(place_id),
    notes TEXT
);

-- object
CREATE TABLE object (
    object_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    object_type TEXT REFERENCES v_object_type(code),
    notes TEXT
);

-- event
CREATE TABLE event (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL REFERENCES v_event_type(code),
    title TEXT,
    description TEXT,
    start_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ,
    time_precision TEXT REFERENCES v_time_precision(code),
    notes TEXT
);

-- source
CREATE TABLE source (
    source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_type TEXT REFERENCES v_source_type(code),
    author TEXT,
    publication_date DATE,
    external_ref TEXT,
    url TEXT,
    notes TEXT
);
```

---

## 5. Next.js Migration Notes

When migrating to Next.js with Supabase:

1. **API Routes** should return data with schema field names
2. **Transform functions** can add computed fields (`display_name`, `label`) for UI
3. **Type definitions** should match schema exactly

Example transform:

```typescript
function transformOrgData(dbOrg: OrgRow): OrgDisplay {
  return {
    ...dbOrg,
    display_name: dbOrg.name, // Computed
    label: dbOrg.org_type,    // Computed
  };
}
```

---

**Audit Complete:** All fixes applied 2026-02-24
