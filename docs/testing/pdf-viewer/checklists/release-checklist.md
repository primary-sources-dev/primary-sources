# PDF Viewer Release Checklist

Run after all test suites pass.

## Pre-Release
- [ ] All P0 tests pass across all test case files.
- [ ] No unresolved P1 defects in render/classify path.
- [ ] Performance thresholds met (first render < 1s, 100-page drain < 15s).
- [ ] Smoke checklist passes clean.

## Cross-Browser
- [ ] Chrome (primary): full suite pass.
- [ ] Firefox: smoke checklist pass.
- [ ] Edge: smoke checklist pass.
- [ ] Safari (if applicable): smoke checklist pass.

## Responsive
- [ ] Desktop (1920x1080): full layout renders correctly.
- [ ] Tablet (1024x768): classify cards stack properly.
- [ ] Narrow (< 849px): responsive layout triggers; no overflow.

## Integration
- [ ] PDF → Classify → Entities → Export path works end-to-end.
- [ ] File switching (PDF → media → PDF) works without stale state.
- [ ] localStorage feedback persists across refresh.
- [ ] Modal renders and closes cleanly at all tested sizes.

## Artifacts
- [ ] Test report filed in `reports/YYYY-MM-DD-release.md`.
- [ ] All defects logged with severity and owner.
- [ ] Performance benchmarks recorded.

## Sign-Off
- [ ] Tester:
- [ ] Date:
- [ ] Build/commit:
