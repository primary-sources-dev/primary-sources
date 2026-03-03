# Input Tab Test Cases

## Scope
Upload/Paste/URL mode behavior, queue creation, and ingest outcomes.

## Cases
| ID | Priority | Scenario | Expected |
|---|---|---|---|
| INP-001 | P0 | Switch Upload -> Paste -> URL -> Upload | Correct panel visible each time; active mode button updates; no stale panel overlap |
| INP-002 | P0 | Upload supported file (`.pdf`) | File appears queued with status `queued`; count updates |
| INP-003 | P1 | Upload unsupported file extension | File rejected with explicit error, queue unchanged |
| INP-004 | P0 | Paste text and submit | Synthetic source created; queue entry `completed`; source history refreshes |
| INP-005 | P0 | URL ingest HTML (`example.com`) | Response type `scraped`; queue/source updated for review |
| INP-006 | P0 | URL ingest direct PDF | Response type `downloaded`; file retrievable via `/api/download/file/*`; queued for processing |
| INP-007 | P0 | URL ingest known video URL | No hard failure; returns `ytdlp` or valid fallback (`scraped`) with success payload |
| INP-008 | P1 | URL input empty | Validation message shown; no request sent |
| INP-009 | P1 | Invalid URL scheme (`ftp://` or plain text) | Clear validation error; no queue changes |
| INP-010 | P1 | Rapid repeated URL submit clicks | Single effective ingest request; button disabling prevents duplicate work |
| INP-011 | P2 | Error then retry | Error styling resets on new attempt; successful retry updates status |
| INP-012 | P1 | Large text paste payload | Accepted within timeout; no UI freeze or truncation corruption |

## Data Assertions
- Queue item has expected `name`, `status`, and size metadata.
- Ingest result shape conforms to API contract.
