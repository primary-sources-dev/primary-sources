# API Contract Test Cases

## Scope
Validate request/response schema and fallback behavior for Workbench-critical endpoints.

## Endpoints
- `GET /api/config`
- `POST /api/paste`
- `POST /api/ingest-url`
- `GET /api/download/file/<filename>`
- Review/export endpoints used by workbench tabs

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| API-001 | P0 | `GET /api/config` | 200 with expected capability fields |
| API-002 | P0 | `POST /api/paste` valid body | 200 with `{ok, basename, pages, chars}` |
| API-003 | P0 | `POST /api/paste` empty text | 400 with clear error message |
| API-004 | P0 | `POST /api/ingest-url` HTML URL | 200 success with `type=scraped`, `basename`, `pages`, `chars` |
| API-005 | P0 | `POST /api/ingest-url` direct PDF/image/audio URL | 200 success with `type=downloaded` and `file{}` |
| API-006 | P0 | `POST /api/ingest-url` video URL | 200 success via `type=ytdlp` or valid `scraped` fallback |
| API-007 | P1 | `POST /api/ingest-url` invalid URL | 400 with validation error |
| API-008 | P1 | `GET /api/download/file/*` existing file | 200 and correct content |
| API-009 | P1 | `GET /api/download/file/*` missing file | 404 JSON error |
| API-010 | P1 | SSL edge URL on ingest | No unhandled exception; fallback behavior returns structured error or success |

## Contract Requirements
- All error payloads include `error` key.
- `ingest-url` success payload always includes `success=true`, `type`, and either `file` or scrape fields.
