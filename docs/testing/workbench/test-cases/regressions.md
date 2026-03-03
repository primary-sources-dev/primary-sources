# Regression Test Cases

## Scope
Target historically unstable areas to prevent repeat failures.

## Cases
| ID | Priority | Regression Target | Expected |
|---|---|---|---|
| REG-001 | P0 | Input action mismatch (`url-ingest` vs handler) | URL button always triggers ingest call |
| REG-002 | P0 | Missing `submitPaste()` wiring | Paste submit executes and creates source artifact |
| REG-003 | P0 | Unicode logging crash on Windows | URL ingest never fails due to console encoding characters |
| REG-004 | P0 | URL ingest SSL cert error | Cert-chain issues do not hard-crash ingest path |
| REG-005 | P1 | yt-dlp format unavailable error | Fallback path yields structured success/failure, not unhandled exception |
| REG-006 | P1 | Classify save state renders incorrectly after reload | UI matches persisted state, no false red/pending visuals |
| REG-007 | P1 | Entity notes reset on selection changes | Notes persist when entity filters/types change |
| REG-008 | P1 | Canvas page changes with missing image load | Next/prev loads correct image/canvas content |
| REG-009 | P2 | Sticky header/facet behavior drift | Workbench sticky behavior remains as intended |

## Exit Gate
All P0 regression tests must pass before release merge signoff.
