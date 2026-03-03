# Canvas Rendering Test Cases

## Scope
PDF page rendering to HTML5 canvas via pdf.js — scale, dimensions, error handling, retry.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| CAN-001 | P0 | Render page 1 of a valid PDF at default scale (1.5x) | Canvas populated with non-blank pixels; dimensions match viewport at 1.5x |
| CAN-002 | P0 | Render multiple pages sequentially | Each canvas gets correct page content; no cross-page bleed |
| CAN-003 | P0 | Concurrent render limit (MAX_CONCURRENT_RENDERS = 3) | No more than 3 renders active simultaneously; queued items wait |
| CAN-004 | P1 | Render page with images and vector graphics | Images and paths visible; no missing elements vs reference |
| CAN-005 | P1 | Render page at 2.5x scale (modal view) | Canvas dimensions scale correctly; content sharp at high res |
| CAN-006 | P1 | Render same page twice (re-render) | No duplicate canvases; `renderedPages` Set prevents double render |
| CAN-007 | P1 | Canvas context is 2D | `canvas.getContext('2d')` returns valid context; fallback if null |
| CAN-008 | P2 | Render page with no text (image-only scan) | Canvas renders image content; text layer is empty but no error |
| CAN-009 | P1 | PDF load fails (404 or corrupt) | Red error message on canvas area; retry button visible |
| CAN-010 | P2 | Retry after failure | Retry clears error state and re-attempts render |

## Data Assertions
- Canvas width/height match `viewport.width * scale` and `viewport.height * scale`.
- `renderedPages` Set contains page index after successful render.
- `activeRenders` never exceeds `MAX_CONCURRENT_RENDERS`.
