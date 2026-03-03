# Source Tab Test Cases

## Scope
Source history rendering, sorting/search, and active file selection.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| SRC-001 | P0 | Load Source tab with processed files available | History grid renders without errors |
| SRC-002 | P1 | Search by filename substring | Results filter correctly; clear search restores full list |
| SRC-003 | P1 | Sort by available options | Ordering changes correctly and remains stable after refresh |
| SRC-004 | P0 | Select file from Source | Workbench active file updates; downstream tabs bind to selected file |
| SRC-005 | P0 | Switch selected file while in Classify | Data context switches cleanly; no data bleed from prior file |
| SRC-006 | P1 | Select file with no review data | Graceful empty-state messaging; no crash |
| SRC-007 | P2 | Long filename rendering | No layout break; tooltip/truncation remains readable |

## Data Assertions
- Active file ID/name used consistently by Classify/Entities/Export.
- Previous file local state is not incorrectly applied to new file.
