# Workbench Integration Test Cases

## Scope
PDF rendering inside the workbench Classify tab — lazy loading, render queue, modal, classification cards.

## Lazy Loading Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| WBI-001 | P0 | Scroll classify tab — pages in viewport render | IntersectionObserver triggers at 600px margin; canvas renders |
| WBI-002 | P0 | Pages outside viewport do not render | `renderedPages` Set does not contain offscreen page indices |
| WBI-003 | P1 | Scroll fast through many pages | Render queue fills; MAX_CONCURRENT_RENDERS (3) respected; no crash |
| WBI-004 | P1 | Scroll back to already-rendered page | Canvas preserved; no re-render; `renderedPages` check prevents duplicate |
| WBI-005 | P2 | Filter or pagination change | `renderedPages` cleared; render queue reset; new pages lazy-load |

## Render Queue Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| WBI-010 | P0 | Queue processes items in order | Pages render in queue insertion order; no starvation |
| WBI-011 | P1 | `activeRenders` decrements on completion | Counter drops after each render completes; next queued item starts |
| WBI-012 | P1 | Render failure in queue | Failed page shows error; queue continues processing remaining items |

## Modal Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| WBI-020 | P0 | Click canvas (`show-modal` action) | Modal opens; canvas renders at 2.5x scale; `.image-modal.active` class set |
| WBI-021 | P0 | Close modal | `.image-modal.active` removed; modal hidden; no orphaned renders |
| WBI-022 | P1 | Modal on page with text layer | Text layer renders in modal at 2.5x; still selectable |
| WBI-023 | P2 | Modal on large page (high-res scan) | Renders within reasonable time (< 3s); no browser hang |

## Classification Card Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| WBI-030 | P0 | Card renders with canvas + classification panel | Left: 360px canvas, Right: doc_type, confidence, matched patterns |
| WBI-031 | P0 | Card shows correct text excerpt | Text from `/api/review` response displayed; max 2000 chars |
| WBI-032 | P1 | Card for media file (no PDF) | No canvas rendered; transcript segment displayed instead |
| WBI-033 | P1 | Card actions (Apply & Save, Skip) | Feedback persisted to localStorage; card updates visual state |

## File Switching Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| WBI-040 | P0 | Switch file in Source tab | ClassifyTab destroys old pdfDoc; loads new PDF; renders fresh |
| WBI-041 | P1 | Switch from PDF to media file | PDF rendering skipped; media segments shown; no stale canvas |
| WBI-042 | P1 | Switch from media file to PDF | PDF loads and renders; media UI hidden |

## Cleanup Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| WBI-050 | P1 | `destroy()` called on tab switch | `pdfDoc.destroy()` called; observer disconnected; Sets/queues cleared |
| WBI-051 | P2 | Multiple rapid file switches | No memory leak; old documents fully cleaned up |

## Data Assertions
- `renderedPages.size` never exceeds visible page count + margin buffer.
- `activeRenders` is 0 after all queue items complete.
- `pdfDoc` is null after `destroy()`.
- Modal canvas dimensions = page viewport * 2.5.
