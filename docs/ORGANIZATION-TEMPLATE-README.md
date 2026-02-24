# Organization Profile Template - Quick Start Guide

**Status:** ✅ Production Ready
**Date:** 2026-02-24
**Version:** 1.0.0

---

## Overview

Universal organization profile template using a **component card library** architecture. Define all possible sections once, show only sections with data.

**Works for:**
- **Government Agencies** (FBI, CIA, Secret Service, DPD)
- **Commissions** (Warren Commission, HSCA, Church Committee)
- **Media Organizations** (WFAA, Dallas Morning News)
- **Businesses** (Texas School Book Depository, Klein's Sporting Goods)
- **Archives** (NARA, Mary Ferrell Foundation)

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\docs\ui
python -m http.server 8000
```

### 2. Test URLs

```
Government Commission (Warren Commission):
http://localhost:8000/organization.html?id=warren-commission

Federal Agency (FBI):
http://localhost:8000/organization.html?id=fbi

Business (Texas Butchers Supply):
http://localhost:8000/organization.html?id=texas-butchers-supply

Empty State:
http://localhost:8000/organization.html?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## File Structure

```
docs/ui/
├── organization.html                    # Universal organization template
├── assets/
│   ├── js/
│   │   ├── organization-profile.js      # Card registry + loading
│   │   ├── organization-cards.js        # Card populate functions
│   │   ├── components.js                # Existing
│   │   ├── nav.js                       # Existing
│   │   └── db-logic.js                  # Existing
│   ├── data/
│   │   ├── mock-organizations.json      # Test data
│   │   └── organizations.json           # Original data (PRESERVED)
│   └── css/
│       └── main.css                     # Existing
```

---

## How It Works

### Component Card System

**7 Available Cards:**
1. Overview (auto-expands)
2. Members & Personnel
3. Related Events
4. Related Organizations
5. Locations
6. Identifiers
7. Primary Sources

**Conditional Rendering:**
- All 7 card sections defined in HTML
- JavaScript evaluates `showWhen()` for each card
- Only cards with data are displayed
- Empty state shows if < 2 cards visible

### Card Registry Pattern

```javascript
// organization-profile.js
const CARD_REGISTRY = {
  overview: {
    icon: 'info',
    title: 'Overview',
    dataField: 'description',
    autoExpand: true,
    showWhen: (data) => data.description !== null && data.description !== '',
    populate: (data) => populateOverview(data.description)
  },
  members: {
    icon: 'groups',
    title: 'Members & Personnel',
    dataField: 'members',
    autoExpand: false,
    showWhen: (data) => data.members && data.members.length > 0,
    populate: (data) => populateMembers(data.members)
  },
  // ... 5 more cards
};
```

---

## Data Format

### Required Fields
```json
{
  "org_id": "uuid-or-slug",
  "name": "Federal Bureau of Investigation",
  "display_name": "FBI",
  "org_type": "AGENCY | COMMISSION | MEDIA | BUSINESS | ARCHIVE | GROUP"
}
```

### Optional Fields (Enable Cards)
```json
{
  "description": "Overview text for the organization...",
  "label": "Federal Law Enforcement",
  "start_date": "1935-07-01",
  "end_date": null,
  "members": [
    { "name": "J. Edgar Hoover", "role": "Director", "person_id": "uuid" }
  ],
  "events": [
    { "event_id": "uuid", "title": "Event", "date": "1963-11-22", "description": "..." }
  ],
  "related_organizations": [
    { "org_id": "uuid", "name": "CIA", "relation": "Investigative Partner" }
  ],
  "locations": [
    { "place_id": "uuid", "name": "Dallas Field Office", "address": "..." }
  ],
  "identifiers": [
    { "type": "EXECUTIVE_ORDER", "value": "11130" }
  ],
  "sources": [
    { "title": "Source", "type": "DOCUMENT", "year": "1963", "archive": "NARA" }
  ]
}
```

---

## Supabase Schema Mapping

| Mock Field | Schema Table | Schema Column |
|------------|--------------|---------------|
| `org_id` | `org` | `org_id` (UUID) |
| `name` | `org` | `name` |
| `org_type` | `org` | `org_type` → `v_org_type.code` |
| `description` | `org` | `notes` |
| `start_date` | `org` | `start_date` |
| `end_date` | `org` | `end_date` |
| `members` | `event_participant` | Junction via events |
| `identifiers` | `entity_identifier` | `entity_type='org'` |

---

## Next.js Migration Path

### Step 1: Create API Route
```typescript
// app/api/organizations/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: org, error } = await supabase
    .from('org')
    .select(`
      *,
      event_participant!party_id (
        role_type,
        event (event_id, title, start_ts, event_type)
      ),
      entity_identifier!entity_id (id_type, id_value)
    `)
    .eq('org_id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(transformOrgData(org));
}
```

### Step 2: Update Data Source
```javascript
// organization-profile.js line 83
// Change from:
const response = await fetch('assets/data/mock-organizations.json');

// To:
const response = await fetch(`/api/organizations/${orgId}`);
```

---

## Testing Checklist

- [ ] **Comprehensive Org** - All cards render correctly (Warren Commission)
- [ ] **Minimal Org** - Only populated cards shown (Texas Butchers Supply)
- [ ] **Empty State** - Shows message when < 2 cards
- [ ] **Overview Auto-Expand** - Opens by default when description exists
- [ ] **Card Collapse/Expand** - Click to toggle works
- [ ] **Members Display** - Links to person profiles
- [ ] **Event Links** - Navigate to event detail pages
- [ ] **Related Orgs** - Navigate to other organization profiles
- [ ] **Empty Data Handling** - No errors with null/undefined

---

## Org Types Reference (v_org_type)

| Code | Label | Example |
|------|-------|---------|
| `AGENCY` | Government/Law Enforcement | FBI, CIA, DPD, Secret Service |
| `COMMISSION` | Investigative Body | Warren Commission, HSCA |
| `MEDIA` | News/Publishers | WFAA, Dallas Morning News |
| `BUSINESS` | Commercial Entity | Klein's Sporting Goods, TSBD |
| `ARCHIVE` | Document Repository | NARA, Mary Ferrell Foundation |
| `GROUP` | Political/Social | Fair Play for Cuba Committee |

---

## Support

**Test Data:** `assets/data/mock-organizations.json`
**Original Data:** `assets/data/organizations.json` (preserved)

---

**Last Updated:** 2026-02-24
**Version:** 1.0.0
