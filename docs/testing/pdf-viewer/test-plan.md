# PDF Viewer Master Test Plan

## 1. Objective
Validate PDF rendering, navigation, and classification integration end-to-end across both the standalone viewer and workbench integration.

## 2. In-Scope Components
- Standalone UI: `web/html/tools/pdf-viewer/pdf-viewer-ui.html`
- Standalone styles: `web/html/assets/css/pdf-viewer.css`
- Workbench UI logic: `web/html/assets/js/workbench.js` (ClassifyTab, lines 35-1254)
- Workbench HTML: `web/html/tools/workbench/workbench.html` (modal, canvas elements)
- Workbench styles: `web/html/tools/workbench/workbench.css` (canvas, modal)
- Backend: `tools/ocr_server.py` (`/api/review`, `/api/download`)
- Library: PDF.js 3.11.174 (CDN)

## 3. Test Layers
- L1 Functional UI tests (rendering, navigation, zoom, modal)
- L2 API contract tests (response shape, file serving, error codes)
- L3 Integration tests (classify pipeline, entity detection from PDF pages)
- L4 Performance tests (large PDFs, memory, concurrent renders)
- L5 Regression tests (known issue hotspots)

## 4. Coverage Matrix
| Area | Key Risks | Test Files |
|---|---|---|
| Canvas rendering | blank canvas, scale errors, concurrent render race | `test-cases/canvas-rendering.md` |
| Navigation | page bounds, input validation, keyboard shortcuts | `test-cases/navigation.md` |
| Text layer | overlay misalignment, highlight failures, blend mode | `test-cases/text-layer.md` |
| Standalone viewer | thumbnails, zoom, intelligence layer, workbench mode | `test-cases/standalone-viewer.md` |
| Workbench integration | lazy loading, modal, render queue, classification cards | `test-cases/workbench-integration.md` |
| API contracts | /api/review, /api/download, file priority, error responses | `test-cases/api-contracts.md` |
| Performance | 100+ page PDFs, memory footprint, render throughput | `test-cases/performance.md` |
| Regressions | prior defects, known edge cases | `test-cases/regressions.md` |

## 5. Severity Definitions
- P0: PDF fails to render, canvas blank, classification data lost.
- P1: major feature degraded (zoom broken, text layer missing) but workaround exists.
- P2: minor defects, cosmetic issues, non-blocking edge cases.

## 6. Entry Criteria
- Server starts (`py -3 tools/ocr_server.py`).
- At least one test PDF in `web/html/processed/` (fixture manifest).
- PDF.js CDN reachable.

## 7. Exit Criteria
- 100% pass on all P0 tests.
- No unresolved P1 defects in render/classify/export path.
- Performance benchmarks within acceptable thresholds.
- Report published under `reports/` with evidence and defect IDs.

## 8. Execution Order
1. Smoke checklist (`checklists/smoke-checklist.md`)
2. Canvas rendering suite
3. Navigation suite
4. Text layer suite
5. Standalone viewer suite
6. Workbench integration suite
7. API contract suite
8. Performance suite
9. Regression suite
10. Release checklist (`checklists/release-checklist.md`)

## 9. Evidence Requirements
For each failed test capture:
- Test ID
- Steps performed
- Expected vs actual result
- Endpoint payload/response (if API-related)
- Screenshot or console output
- Severity and owner
