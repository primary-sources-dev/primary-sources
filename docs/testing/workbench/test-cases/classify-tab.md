# Classify Tab Test Cases

## Scope
Review card behavior, save/skip lifecycle, persistence, and visual state integrity.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| CLS-001 | P0 | Open classify on selected source | First review item renders with image/canvas and controls |
| CLS-002 | P0 | Apply selections + `Apply & Save` | Success feedback shown; review state persists; card advances per configured flow |
| CLS-003 | P0 | Click `Skip` with reason and note | State marked skipped; reason captured in feedback; item leaves active queue if filtered |
| CLS-004 | P0 | Reload page after save | Saved choices and notes are restored exactly |
| CLS-005 | P1 | Reload page after skip | Skip state/reason restored; not reset to pending |
| CLS-006 | P1 | Change decision and re-save same item | Latest save wins; no duplicate conflicting entries |
| CLS-007 | P0 | Pagination/next item navigation | Correct next item loads with matching canvas/image |
| CLS-008 | P1 | Note edits while switching entity type/filter | Notes remain intact; no unexpected clearing |
| CLS-009 | P1 | Pending-only filter mode | Shows pending items only; skipped hidden by default |
| CLS-010 | P2 | Empty review queue | Clear completion/empty state messaging |

## Data Assertions
- Feedback object includes state, selected tiers, notes, and skip reason.
- Card visual state matches stored review state on initial load and after refresh.
