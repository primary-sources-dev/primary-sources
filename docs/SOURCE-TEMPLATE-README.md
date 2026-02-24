# Source Profile Template - Quick Start Guide

**Status:** ✅ Production Ready
**Date:** 2026-02-24
**Version:** 1.0.0

---

## Overview

Universal source profile template using a **component card library** architecture. Define all possible sections once, show only sections with data.

**Works for:**
- **Government Reports** (Warren Commission Report, HSCA Final Report)
- **FBI Documents** (Ralph Yates FBI File, 302 Forms)
- **Testimony** (Warren Commission Hearings)
- **Media** (Photographs, Audio Recordings)

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\docs\ui
python -m http.server 8000
```

### 2. Test URLs

```
Comprehensive Source (Warren Commission Report):
http://localhost:8000/source.html?id=warren-report

FBI Document (Yates FBI File):
http://localhost:8000/source.html?id=yates-fbi-file

Empty State:
http://localhost:8000/source.html?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## File Structure

```
docs/ui/
├── source.html                          # Universal source template
├── assets/
│   ├── js/
│   │   ├── source-profile.js            # Card registry + loading
│   │   ├── source-cards.js              # Card populate functions
│   │   ├── components.js                # Existing
│   │   ├── nav.js                       # Existing
│   │   └── db-logic.js                  # Existing
│   ├── data/
│   │   └── sources.json                 # Baseline Data (Canonical)
│   └── css/
│       └── main.css                     # Existing
```

---

## How It Works

### Component Card System

**8 Available Cards:**
1. Overview (auto-expands)
2. Content Summary
3. Related Events
4. Related People
5. Related Organizations
6. Citations (auto-generated)
7. Authenticity & Provenance
8. Related Sources

**Conditional Rendering:**
- All 8 card sections defined in HTML
- JavaScript evaluates `showWhen()` for each card
- Only cards with data are displayed
- Empty state shows if < 2 cards visible

### Card Registry Pattern

```javascript
// source-profile.js
const CARD_REGISTRY = {
  overview: {
    icon: 'info',
    title: 'Overview',
    dataField: 'description',
    autoExpand: true,
    showWhen: (data) => data.description !== null && data.description !== '',
    populate: (data) => populateOverview(data.description)
  },
  citations: {
    icon: 'format_quote',
    title: 'Citations',
    dataField: 'citations',
    autoExpand: false,
    showWhen: (data) => data.citations || (data.title && data.author),
    populate: (data) => populateCitations(data)
  },
  provenance: {
    icon: 'verified',
    title: 'Authenticity & Provenance',
    dataField: 'provenance',
    autoExpand: false,
    showWhen: (data) => data.provenance && Object.keys(data.provenance).length > 0,
    populate: (data) => populateProvenance(data.provenance)
  },
  // ... 5 more cards
};
```

---

## Data Format

### Required Fields
```json
{
  "source_id": "uuid",
  "title": "Warren Commission Report",
  "source_type": "REPORT | FBI_302 | TESTIMONY | PHOTO | AUDIO",
  "label": "Published September 24, 1964"
}
```

### Optional Fields (Enable Cards)
```json
{
  "description": "Overview text",
  "content_summary": "Summary of key contents",
  "author": "Warren Commission",
  "publication_date": "1964-09-24",
  "archive": "NARA",
  "external_ref": "RIF 180-10001-10001",
  "url": "https://www.archives.gov/...",
  "events": [
    { "event_id": "uuid", "title": "Event", "date": "1963-11-22" }
  ],
  "people": [
    { "person_id": "uuid", "name": "Person", "role": "AUTHOR | SUBJECT | WITNESS" }
  ],
  "organizations": [
    { "org_id": "uuid", "name": "Organization", "role": "PUBLISHER | CUSTODIAN" }
  ],
  "citations": {
    "chicago": "Warren Commission. Report of the President's Commission...",
    "mla": "United States. Warren Commission. Report...",
    "apa": "Warren Commission. (1964). Report...",
    "nara": "NARA RIF 180-10001-10001"
  },
  "provenance": {
    "original_custodian": "National Archives",
    "classification": "Declassified",
    "authenticity": "Verified",
    "digitization_date": "2017-10-26"
  },
  "related_sources": [
    { "source_id": "uuid", "title": "Source", "relation": "SUPPORTS | CONTRADICTS | REFERENCES" }
  ]
}
```

---

## Next.js Migration Path

### Step 1: Create API Route
```typescript
// app/api/sources/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: source, error } = await supabase
    .from('source')
    .select(`
      *,
      source_excerpt (excerpt_id, page_ref, content),
      entity_identifier!entity_id (id_type, id_value),
      assertion_support (
        assertion (assertion_id, subject_type, predicate, object_value)
      )
    `)
    .eq('source_id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(transformSourceData(source));
}
```

### Step 2: Update Data Source
```javascript
// source-profile.js line 91
// Change from:
const response = await fetch('assets/data/sources.json');

// To:
const response = await fetch(`/api/sources/${sourceId}`);
```

---

## Citation Generation

The Citations card auto-generates formatted citations using the Citation Generator tool:

```javascript
// source-cards.js
function populateCitations(data) {
  const container = document.getElementById('citations-list');
  
  const formats = ['chicago', 'mla', 'apa', 'nara'];
  
  container.innerHTML = formats.map(format => {
    const citation = data.citations?.[format] || generateCitation(data, format);
    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 p-4">
        <span class="text-[10px] uppercase tracking-widest text-primary mb-2 block">${format}</span>
        <p class="text-xs text-archive-secondary/80 font-mono">${citation}</p>
        <button onclick="copyToClipboard('${citation}')" 
                class="mt-2 text-[10px] text-primary hover:underline uppercase tracking-widest">
          Copy
        </button>
      </div>
    `;
  }).join('');
}
```

---

## Testing Checklist

- [ ] **Comprehensive Source** - All cards render correctly
- [ ] **Minimal Source** - Only populated cards shown
- [ ] **Empty State** - Shows message when < 2 cards
- [ ] **Overview Auto-Expand** - Opens by default when data exists
- [ ] **Card Collapse/Expand** - Click to toggle works
- [ ] **Citations Display** - All 4 formats shown
- [ ] **Copy to Clipboard** - Citation copy buttons work
- [ ] **External Links** - Archive URLs open correctly
- [ ] **Provenance Badge** - Classification status displayed
- [ ] **Empty Data Handling** - No errors with null/undefined

---

## Support

**Baseline Data:** `assets/data/sources.json`

---

**Last Updated:** 2026-02-24
**Version:** 1.0.0
