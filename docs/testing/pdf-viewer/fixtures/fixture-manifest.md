# PDF Viewer Fixture Manifest

## Required Test Fixtures

| Fixture | Type | Purpose | Location |
|---|---|---|---|
| `test-small.pdf` | 5-page text PDF | Basic rendering, navigation, text layer | `web/html/processed/` |
| `test-large.pdf` | 100+ page PDF | Performance, lazy loading, thumbnail limits | `web/html/processed/` |
| `test-scanned.pdf` | Image-only scan | Canvas rendering without text layer | `web/html/processed/` |
| `test-mixed-sizes.pdf` | Mixed page dimensions | Regression REG-001 (letter + legal) | `web/html/processed/` |
| `test-searchable.pdf` / `test_searchable.pdf` | OCR'd variant | File priority resolution (API-012) | `web/html/processed/` |
| `test-small.ocr.json` | OCR sidecar | Intelligence layer overlay coordinates | `web/html/processed/` |
| `test-corrupt.pdf` | Truncated/invalid PDF | Error handling (REG-007) | `web/html/processed/` |
| `test-empty.pdf` | Zero-byte file | Error handling (REG-008) | `web/html/processed/` |
| `test-media.mp3` | Audio file | Media vs PDF switching (WBI-032, WBI-041) | `web/html/processed/uploads/` |
| `test-transcript.txt` + `.ocr.json` | Text with sidecar | Text file review path (API-005) | `web/html/processed/` |

## Fixture Generation Notes
- `test-small.pdf`: Any 5-page document with selectable text.
- `test-large.pdf`: Can use any archival PDF with 100+ pages.
- `test-scanned.pdf`: Scan or photograph pages without OCR text layer.
- `test-corrupt.pdf`: Truncate a valid PDF at 50% of file size.
- `test-empty.pdf`: `touch test-empty.pdf` (zero bytes).
- `test-small.ocr.json`: Run OCR pipeline on `test-small.pdf` to generate sidecar.

## Expected Outcomes
- All valid fixtures render without errors.
- Corrupt/empty fixtures produce clear error messages.
- Media fixture triggers transcript display, not PDF rendering.
- Sidecar fixture enables intelligence overlay in standalone viewer.
