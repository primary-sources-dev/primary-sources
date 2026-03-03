# Export Tab Test Cases

## Scope
Export readiness, output generation, and feedback-loop artifact quality.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| EXP-001 | P0 | Open Export tab default state | Tab accessible per current product rule (unlocked by default) |
| EXP-002 | P0 | Export source record | Valid output generated with required fields |
| EXP-003 | P0 | Export new entities | Output includes approved entities only and correct schema |
| EXP-004 | P1 | Export with partial review | Behavior matches policy (allowed or blocked) with clear messaging |
| EXP-005 | P1 | Re-export same source after edits | Output reflects latest review state, no stale data |
| EXP-006 | P1 | TTS preview action | Preview generation succeeds/fails with clear status messaging |
| EXP-007 | P1 | TTS generate action from processed source | Output file created and linked in UI state |
| EXP-008 | P2 | Export error handling | Error surfaced clearly, no UI dead state |

## Data Assertions
- Exported files are consumable by downstream feedback scripts.
- Approved/verified/skipped semantics are preserved in output.
