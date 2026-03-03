# Performance Test Cases

## Scope
Render throughput, memory footprint, and responsiveness with large or complex PDFs.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| PRF-001 | P1 | Load 10-page PDF | All pages renderable; initial page renders < 1s |
| PRF-002 | P1 | Load 100-page PDF | Lazy loading prevents upfront render; initial page renders < 2s |
| PRF-003 | P2 | Load 500+ page PDF | Lazy loading handles it; no browser tab crash; memory stable |
| PRF-004 | P1 | Scroll through 100 pages rapidly | Render queue stays bounded; no dropped frames; queue drains |
| PRF-005 | P1 | Concurrent render limit under load | `activeRenders` stays <= 3; no render starvation |
| PRF-006 | P2 | Large page (high-res scan, 300 DPI) | Canvas renders within 3s; no canvas size limit exceeded |
| PRF-007 | P2 | Modal render at 2.5x on large page | Renders within 5s; no browser hang |
| PRF-008 | P1 | Text layer with 1000+ text items | Text layer renders without visible lag; highlight still works |
| PRF-009 | P2 | Memory after file switch | Old `pdfDoc` destroyed; heap doesn't grow monotonically |
| PRF-010 | P2 | Multiple file switches (10x) | Memory returns to baseline; no leak pattern |
| PRF-011 | P1 | Thumbnail rendering (100 thumbnails at 0.4x) | All render within 10s; sidebar scrollable |

## Measurement Points
- Time to first page render (DOMContentLoaded -> canvas populated).
- Peak memory (via DevTools Performance tab).
- Render queue drain time (all visible pages rendered).
- Frame rate during rapid scroll (should not drop below 30fps).

## Thresholds
| Metric | Acceptable | Degraded | Fail |
|---|---|---|---|
| First page render | < 1s | 1-3s | > 3s |
| 100-page queue drain | < 15s | 15-30s | > 30s |
| Modal render (2.5x) | < 3s | 3-5s | > 5s |
| Memory per 100 pages | < 200MB | 200-500MB | > 500MB |
