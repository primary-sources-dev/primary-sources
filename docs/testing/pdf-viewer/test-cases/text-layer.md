# Text Layer Test Cases

## Scope
PDF.js text overlay rendering, text selection, and term highlighting.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| TXT-001 | P0 | Text layer renders over canvas | Selectable text visible; positioned to match canvas content |
| TXT-002 | P1 | Text layer opacity and blend mode | Opacity 0.7, mix-blend-mode: multiply applied via CSS |
| TXT-003 | P1 | Highlight search terms on page | Matched terms get highlight background color; non-matched text unaffected |
| TXT-004 | P1 | Text transform alignment | `pdfjsLib.Util.transform(viewport.transform, item.transform)` positions text items correctly relative to canvas |
| TXT-005 | P2 | Select and copy text from text layer | Browser text selection works; copied text matches PDF content |
| TXT-006 | P2 | Page with no extractable text (image-only) | Text layer is empty; no error thrown; canvas still renders |
| TXT-007 | P2 | Text layer on zoomed canvas | Text positions scale with zoom factor; no misalignment at 2.5x |
| TXT-008 | P1 | Multiple highlight terms on same page | All terms highlighted; no overlap or corruption |
| TXT-009 | P2 | Text layer render failure | Error logged; canvas still visible; no crash |

## Data Assertions
- Text layer div children count matches page textContent items.
- Each text span position aligns with corresponding canvas region.
- Highlight class applied only to matching terms.
