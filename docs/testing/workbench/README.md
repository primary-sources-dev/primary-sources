# Workbench Testing Suite

This directory contains the test suite for the Workbench tool only (`web/html/tools/workbench/*` and supporting APIs).

## Scope
- Input intake and processing flow.
- Source selection and file context handoff.
- Classification review workflow and persistence.
- Entity detection and approval workflow.
- Export and downstream feedback-loop outputs.
- Cross-tab state gating and recovery.

## Directory Layout
- `test-plan.md`: master strategy, coverage, and execution order.
- `test-cases/`: atomic functional/API/regression test definitions.
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
- No data loss in feedback/export flow.
- No blocker in ingest -> classify -> entities -> export path.
