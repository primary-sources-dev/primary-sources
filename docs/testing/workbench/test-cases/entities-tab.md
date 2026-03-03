# Entities Tab Test Cases

## Scope
Entity detection, approvals, rejection flow, per-page selection behavior, and persistence.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| ENT-001 | P0 | Click `Detect Entities` | Detection request completes; summary/meta counts update |
| ENT-002 | P0 | Approve detected registry match | Approval state persists and is represented in export data |
| ENT-003 | P0 | Reject detected match | Rejection state persists and is represented in export data |
| ENT-004 | P1 | Approve/reject candidate entity | Candidate decision persists and is auditable |
| ENT-005 | P1 | Switch page then return | Entity checkbox decisions remain page-scoped and intact |
| ENT-006 | P1 | Switch entity type (person/location/org) | Type filter changes options only; existing selections retained |
| ENT-007 | P0 | Refresh after approvals | Prior decisions restored accurately |
| ENT-008 | P2 | No entities detected case | Empty-state renders without errors |

## Data Assertions
- `entityApprovals` and selected entity mappings are stable across reload.
- Export payload includes approved/rejected decisions with page linkage.
