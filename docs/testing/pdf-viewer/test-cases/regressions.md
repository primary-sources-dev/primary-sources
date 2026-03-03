# Regression Test Cases

## Scope
Known edge cases, prior defects, and high-risk interaction points for PDF rendering.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| REG-001 | P0 | PDF with mixed page sizes (letter + legal) | Each page renders at its own viewport dimensions; no cropping |
| REG-002 | P1 | PDF with embedded fonts | Text renders correctly; no tofu/missing glyphs |
| REG-003 | P1 | PDF with rotated pages (90/180/270) | Canvas shows correct orientation; text layer aligned |
| REG-004 | P1 | Password-protected PDF | Clear error message; no hang or crash |
| REG-005 | P1 | PDF with form fields | Form fields visible but non-interactive (expected limitation) |
| REG-006 | P2 | PDF with annotations/comments | Annotations visible or gracefully ignored |
| REG-007 | P0 | Corrupt/truncated PDF file | Error caught; message shown; no infinite loading state |
| REG-008 | P1 | Zero-byte PDF file | Error caught immediately; clear message |
| REG-009 | P1 | Network timeout loading PDF from `/api/download` | Timeout handled; retry available |
| REG-010 | P2 | PDF.js CDN unreachable | Graceful failure; error message instead of blank page |
| REG-011 | P1 | Switch file while previous PDF still loading | Old load cancelled or ignored; new file renders cleanly |
| REG-012 | P2 | Very long page (banner/receipt format) | Renders without canvas size overflow; scrollable |
| REG-013 | P1 | PDF with JavaScript actions | JS actions ignored (security); no execution |
| REG-014 | P2 | Filename with special characters (spaces, unicode) | URL encoding handles it; file loads correctly |
| REG-015 | P1 | Searchable PDF (`_searchable.pdf` suffix) | File priority resolves correctly; renders same as original |

## Data Assertions
- No unhandled promise rejections in console.
- No infinite loading spinners (all states resolve within timeout).
- Error states are recoverable (retry or file switch clears them).
