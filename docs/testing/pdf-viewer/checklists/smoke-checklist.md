# PDF Viewer Smoke Checklist

Run this before full suite.

## Preconditions
- [ ] Server starts (`py -3 tools/ocr_server.py`).
- [ ] At least one processed PDF in `web/html/processed/`.
- [ ] PDF.js CDN reachable (check browser console for worker load).

## Smoke Steps
- [ ] SMK-001: Open standalone viewer with `?file=<test.pdf>` — page 1 renders.
- [ ] SMK-002: Navigate forward/back — correct pages render.
- [ ] SMK-003: Zoom in/out — canvas re-renders at new scale.
- [ ] SMK-004: Open workbench, select a PDF in Source tab.
- [ ] SMK-005: Classify tab renders first page canvas with classification card.
- [ ] SMK-006: Scroll down — lazy loading renders additional pages.
- [ ] SMK-007: Click canvas — modal opens at high res (2.5x).
- [ ] SMK-008: Close modal — returns to normal view.
- [ ] SMK-009: Text layer is selectable on rendered pages.
- [ ] SMK-010: No console errors or unhandled promise rejections.

## Smoke Result
- Pass if all SMK items pass.
- Fail if any P0 step fails.
