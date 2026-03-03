# Standalone Viewer Test Cases

## Scope
Features specific to `pdf-viewer-ui.html` — thumbnails, zoom, intelligence layer, workbench mode, URL parameters.

## URL Parameter Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| STV-001 | P0 | Open with `?file=test.pdf` | PDF loads and renders page 1 |
| STV-002 | P1 | Open with `?file=test.pdf&page=5` | PDF loads and renders page 5 |
| STV-003 | P1 | Open with `?mode=workbench` | Editor pane visible; forensic ribbon renders |
| STV-004 | P1 | Open with no `file` parameter | Error message or empty state; no crash |
| STV-005 | P2 | Open with nonexistent file | 404 handled; error message shown |

## Thumbnail Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| STV-010 | P1 | Thumbnails render for small PDF (< 20 pages) | All page thumbnails visible in sidebar at 0.4x scale |
| STV-011 | P1 | Thumbnails render for large PDF (100+ pages) | First 100 thumbnails render; performance limit respected |
| STV-012 | P2 | Click thumbnail | Main canvas navigates to that page |
| STV-013 | P2 | Thumbnail checkbox selection | Checkbox toggles; selected count updates |

## Zoom Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| STV-020 | P1 | Zoom in (+0.25 increment) | Canvas scale increases; content sharpens |
| STV-021 | P1 | Zoom out (-0.25 increment) | Canvas scale decreases; more content visible |
| STV-022 | P1 | Zoom out at minimum (0.5x) | Further zoom out disabled or no-op |
| STV-023 | P2 | Fit-to-width mode | Canvas width matches container; scale auto-calculated |

## Intelligence Layer Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| STV-030 | P2 | PDF with `.ocr.json` sidecar | Entity overlay boxes render at correct coordinates |
| STV-031 | P2 | PDF without `.ocr.json` sidecar | No overlay; text-only fallback; no error |
| STV-032 | P2 | Entity box click | Highlights entity; shows detail info |

## Workbench Mode Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| STV-040 | P1 | Toggle workbench pane | Editor pane opens; `onFitWidth()` called after 450ms delay |
| STV-041 | P1 | Forensic ribbon metadata | RIF, agency, date, classification parsed from `/api/parse-header` |
| STV-042 | P2 | OCR line click in editor | Corresponding text highlighted in main canvas |

## Page Splitting Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| STV-050 | P2 | Select pages via checkboxes and submit | Alert: "Surgical Split NOT YET IMPLEMENTED" (known unimplemented) |

## Data Assertions
- Thumbnail count <= 100 for large PDFs.
- Zoom scale is always >= 0.5.
- Intelligence overlay coordinates match `.ocr.json` bbox data.
