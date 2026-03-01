# Classify Card Tabs — Implementation Plan

## Goal

Add tabbed entity views to each Classify page card. User sees document classification and detected entities in one card without tab switching.

## Tabs

**Document** (default) | **People** | **Organizations** | **Locations** | **Events**

- Document: existing classification form (no changes)
- People/Organizations/Locations: entity chips from `/api/entities` results
- Events: event chips from `events.json` matching (future: backend detection)

## Data Flow

1. Move `detectEntities()` call from EntitiesTab to `loadClassificationData()` in DocumentWorkbench
2. Store results on `this.matchedEntities` — shared state, both tabs consume it
3. Each card's entity tabs filter by page number from the shared results
4. EntitiesTab reads from shared state instead of calling API again

## Card Layout

- Tab bar sits at top of classification panel (dark container)
- Style: `text-[10px] font-bold uppercase tracking-widest`, active tab gets `border-b-2 border-primary`
- Tab labels show counts: `People (4)` | `Orgs (1)` | `Locations (2)` | `Events (1)`
- Only active tab content visible — card shrinks on entity tabs, full height on Document tab

## Entity Tab Content

- Top 3-5 chips visible, sorted by confidence
- `+N more` toggle expands to scrollable area (`max-h-[100px] overflow-y-auto`)
- Chip colors: People=blue, Orgs=purple, Locations=green, Events=amber
- Solid border = database match, dotted border = candidate
- Read-only — no approve/reject (stays in Entities tab)
- Empty state: italic `No [type] detected`

## Files Changed

- `web/html/assets/js/workbench.js` — move detectEntities call, add tab bar + entity panels to `renderCard()`, add card tab switching logic
- `web/html/tools/workbench/workbench.css` — card tab styles, entity chip styles

## Not Changed

- `tools/ocr_server.py` — no backend changes
- `tools/entity_matcher.py` — no changes
- Entities tab approve/reject workflow — unchanged
- Export tab — unchanged
