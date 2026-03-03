# API Contract Test Cases

## Scope
Backend endpoints that serve and process PDFs — response shapes, error handling, file priority.

## `/api/review/{filename}` Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| API-001 | P0 | Review valid PDF file | 200; `{ filename, total_pages, pages: [{ page, page_index, doc_type, confidence, matched_patterns, text, all_scores }] }` |
| API-002 | P0 | Each page has `text` field <= 2000 chars | Text truncated at 2000; no overflow |
| API-003 | P1 | Review nonexistent file | 404; `{ error: "..." }` |
| API-004 | P1 | Review media file (`.mp3`) | 200; response includes `media_type`, `duration`, segment-based pages |
| API-005 | P1 | Review `.txt` file with `.ocr.json` sidecar | 200; pages built from sidecar JSON |
| API-006 | P2 | Review `.txt` file without `.ocr.json` sidecar | 404; clear error message |
| API-007 | P1 | `all_scores` field contains all classifier types | Dict with string keys and float values; sums approximately to 1.0 |
| API-008 | P2 | `matched_patterns` is array of strings | Non-null array; each element is a string |

## `/api/download/{filename}` Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| API-010 | P0 | Download existing processed PDF | 200; binary PDF content; correct Content-Type |
| API-011 | P0 | File priority: `processed/{filename}` first | Serves from `processed/` if exists |
| API-012 | P1 | File priority: `processed/{basename}_searchable.pdf` second | Falls back to searchable variant |
| API-013 | P1 | File priority: `processed/uploads/{filename}` third | Falls back to uploads dir |
| API-014 | P1 | Download nonexistent file | 404 response |
| API-015 | P2 | `?download=true` query param | Content-Disposition: attachment header set |

## `/api/download/file/{filename}` Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| API-020 | P0 | Serve file from `processed/uploads/` | 200; binary content; correct MIME type |
| API-021 | P1 | Nonexistent file | 404; `{ error: "File not found" }` |
| API-022 | P2 | Filename with URL-encoded characters | Properly decoded; file served if exists |

## `/api/feedback` Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| API-030 | P0 | POST feedback for a page | 200; feedback persisted; retrievable |
| API-031 | P1 | POST feedback with missing fields | 400; validation error |

## Data Assertions
- All responses are valid JSON (except binary file downloads).
- Error responses always include `error` field with human-readable message.
- File serving never exposes paths outside `processed/` directory (path traversal safe).
