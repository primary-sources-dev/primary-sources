# Fixture Manifest

Metadata-only manifest for Workbench tests. Keep large binaries in runtime paths.

## Local Files
| Fixture ID | Type | Example | Intended Tests |
|---|---|---|---|
| FX-001 | PDF | `dummy.pdf` | INP-002, INP-006, API-005 |
| FX-002 | Image | `sample.jpg` | INP-002, API-005 |
| FX-003 | Audio | `test-audio.wav` | INP-002, Export/TTS smoke |
| FX-004 | Text | paste payload | INP-004, API-002 |

## URL Fixtures
| Fixture ID | Type | URL | Intended Tests |
|---|---|---|---|
| FX-101 | HTML | `https://example.com` | INP-005, API-004 |
| FX-102 | Direct PDF | `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf` | INP-006, API-005 |
| FX-103 | Video page | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | INP-007, API-006 |

## Expected Outcome Notes
- FX-103 may resolve as `ytdlp` or `scraped` depending on environment constraints.
- Any fallback path must still return structured success/error payloads.
