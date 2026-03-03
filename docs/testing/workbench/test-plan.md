# Workbench Master Test Plan

## 1. Objective
Validate the Workbench tool end-to-end so every source can move from intake to export with reliable state, correct API contracts, and auditable feedback outputs.

## 2. In-Scope Components
- UI: `web/html/tools/workbench/workbench.html`
- UI logic: `web/html/assets/js/workbench.js`
- Backend endpoints: `tools/ocr_server.py`

## 3. Test Layers
- L1 Functional UI tests (tab behavior and user actions)
- L2 API contract tests (response shape and failure behavior)
- L3 Integration tests (cross-tab and persistence flow)
- L4 Regression tests (known issue hotspots)
- L5 Reliability tests (timeouts, fallback paths, long sessions)

## 4. Coverage Matrix
| Area | Key Risks | Test Files |
|---|---|---|
| Input | mode switching, ingest type routing, queue injection | `test-cases/input-tab.md`, `test-cases/api-contracts.md` |
| Source | active file handoff, history/grid correctness | `test-cases/source-tab.md`, `test-cases/cross-tab-state.md` |
| Classify | save/skip semantics, persistence, card progression | `test-cases/classify-tab.md`, `test-cases/regressions.md` |
| Entities | detect/approve/reject integrity, per-page behavior | `test-cases/entities-tab.md`, `test-cases/cross-tab-state.md` |
| Export | unlock behavior, output quality, feedback-loop artifacts | `test-cases/export-tab.md`, `test-cases/api-contracts.md` |
| Cross-tab | tab gating, file switching, localStorage hydration | `test-cases/cross-tab-state.md` |

## 5. Severity Definitions
- P0: blocks core workflow, data loss, corrupt output.
- P1: major feature degraded but workaround exists.
- P2: minor defects, UX inconsistencies, non-blocking edge cases.

## 6. Entry Criteria
- `main` is clean and synced.
- Server starts (`py -3 tools/ocr_server.py`).
- Fixture manifest is available.

## 7. Exit Criteria
- 100% pass on all P0 tests.
- No unresolved P1 defects in ingest/classify/export path.
- Regression suite passes for prior defects.
- Report published under `reports/` with evidence and defect IDs.

## 8. Execution Order
1. Smoke checklist (`checklists/smoke-checklist.md`)
2. Functional suites (Input -> Source -> Classify -> Entities -> Export)
3. API contract suite
4. Cross-tab/persistence suite
5. Regression suite
6. Release checklist (`checklists/release-checklist.md`)

## 9. Evidence Requirements
For each failed test capture:
- Test ID
- Steps performed
- Expected vs actual result
- Endpoint payload/response (if API-related)
- Screenshot or output snippet
- Severity and owner
