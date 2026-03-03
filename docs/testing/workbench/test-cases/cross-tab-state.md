# Cross-Tab State Test Cases

## Scope
State continuity, tab gating, localStorage persistence, and file switching.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| XTB-001 | P0 | Select source -> move through Classify -> Entities -> Export | Single source context maintained across all tabs |
| XTB-002 | P0 | Save review then hard refresh | State rehydrates from storage/server; no loss |
| XTB-003 | P1 | Switch source file mid-session | Previous state isolated; new file context loaded cleanly |
| XTB-004 | P1 | Return to previous source | Prior saved state restored correctly |
| XTB-005 | P1 | Requested deep-link tab not yet eligible | Fallback navigates safely; user informed of requirement |
| XTB-006 | P1 | localStorage migration keys present from old classifier | Old keys migrated once; no data duplication or overwrite issue |
| XTB-007 | P2 | Clear browser storage and reload | App recovers gracefully with empty-state behavior |

## Data Assertions
- No cross-file leakage in feedback/entity approvals.
- All persisted keys are namespaced and version-safe.
