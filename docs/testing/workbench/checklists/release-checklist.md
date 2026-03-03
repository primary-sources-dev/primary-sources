# Workbench Release Checklist

## Functional Gates
- [ ] All P0 tests pass (`test-cases/*.md`).
- [ ] No unresolved P1 in ingest/classify/export.
- [ ] Regression suite pass for REG-001 to REG-005.

## Data Integrity Gates
- [ ] Feedback export includes review state, notes, skip reasons.
- [ ] Entity decisions are included and page-linked.
- [ ] Re-export reflects latest decisions.

## API Gates
- [ ] `/api/ingest-url` contract stable for scraped/downloaded/ytdlp/fallback paths.
- [ ] `/api/paste` contract stable.
- [ ] Download endpoint behavior validated for existing/missing files.

## UX/Recovery Gates
- [ ] Refresh and resume preserves user state.
- [ ] File switching does not leak state across files.
- [ ] Error paths recover without page reload.

## Signoff
- [ ] Test report added under `reports/` with date.
- [ ] Open defects linked with severity and owner.
