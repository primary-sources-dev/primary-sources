# Navigation Test Cases

## Scope
Page navigation in both standalone viewer and workbench — prev/next, direct input, keyboard, bounds.

## Standalone Viewer Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| NAV-001 | P0 | Next button advances page | Page increments by 1; canvas re-renders; page input updates |
| NAV-002 | P0 | Prev button decrements page | Page decrements by 1; canvas re-renders; page input updates |
| NAV-003 | P0 | Direct page input (type number, press Enter) | Jumps to entered page; canvas renders correct content |
| NAV-004 | P1 | Navigate to page 1 then press Prev | Stays on page 1; button disabled or no-op |
| NAV-005 | P1 | Navigate to last page then press Next | Stays on last page; button disabled or no-op |
| NAV-006 | P1 | Enter page number 0 or negative | Clamps to page 1; no error |
| NAV-007 | P1 | Enter page number > total pages | Clamps to last page; no error |
| NAV-008 | P1 | Enter non-numeric text in page input | Ignored or reverts to current page; no crash |
| NAV-009 | P2 | Keyboard: Arrow Right / PageDown | Advances to next page |
| NAV-010 | P2 | Keyboard: Arrow Left / PageUp | Returns to previous page |

## Workbench Classify Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| NAV-011 | P0 | Page prev/next buttons in classify tab | `goToPage()` updates current page; cards re-render for new page range |
| NAV-012 | P1 | Page input field in classify tab | Direct jump works; validates bounds |
| NAV-013 | P1 | Navigate while render is in progress | Queued renders for old pages cancelled or skipped; new page renders |

## Data Assertions
- Page number is always within `[1, doc.numPages]`.
- Canvas content matches the requested page index.
- Page input field reflects current page after navigation.
