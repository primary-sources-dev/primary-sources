# Workbench Smoke Checklist

Run this before full suite.

## Preconditions
- [ ] On `main` with clean status.
- [ ] Server starts (`py -3 tools/ocr_server.py`).
- [ ] At least one test PDF and one URL fixture available.

## Smoke Steps
- [ ] SMK-001: Open Workbench and verify all tabs render.
- [ ] SMK-002: Input mode switching works (Upload/Paste/URL).
- [ ] SMK-003: Paste submit creates a completed source.
- [ ] SMK-004: URL ingest HTML succeeds.
- [ ] SMK-005: URL ingest direct PDF succeeds.
- [ ] SMK-006: Source selection opens Classify context.
- [ ] SMK-007: Classify Apply & Save persists after refresh.
- [ ] SMK-008: Detect Entities runs and populates results.
- [ ] SMK-009: Export action produces output artifact.
- [ ] SMK-010: No console/runtime crash during flow.

## Smoke Result
- Pass if all SMK items pass.
- Fail if any P0 step fails.
