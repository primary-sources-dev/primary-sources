# PDF Viewer Testing Suite

This directory contains the test suite for both the standalone PDF Viewer (`web/html/tools/pdf-viewer/`) and the workbench PDF rendering integration (`ClassifyTab` in `workbench.js`).

## Scope
- Standalone viewer: canvas rendering, navigation, zoom, text layer, thumbnails, intelligence overlay.
- Workbench integration: lazy loading, concurrent render queue, modal detail view, classification card rendering.
- API contracts: `/api/review`, `/api/download`, file serving priority.
- Performance: large PDFs, memory, render throughput.
- Edge cases: corrupt files, missing sidecars, network failures.

## Directory Layout
- `test-plan.md`: master strategy, coverage, and execution order.
- `test-cases/`: atomic functional/API/performance/regression test definitions.
- `checklists/`: concise runbooks for smoke and release passes.
- `reports/`: dated execution reports and defect summaries.
- `fixtures/`: fixture manifest and expected outcomes (metadata only).

## How To Use
1. Run `checklists/smoke-checklist.md` first.
2. If smoke passes, run all files in `test-cases/`.
3. Log results in `reports/YYYY-MM-DD-*.md`.
4. Triage failures by severity (P0/P1/P2).
5. Re-run smoke after fixes.

## Pass Criteria
- All P0 tests pass.
- No render failures on supported PDF files.
- No memory leaks on large documents (100+ pages).
- No blocker in PDF load -> render -> classify -> export path.
