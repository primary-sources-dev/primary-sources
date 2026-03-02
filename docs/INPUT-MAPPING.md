# Input Tab — Component Map

| Component | File | Purpose |
|---|---|---|
| **Tab bar** (INPUT · SOURCE · CLASSIFY · ENTITIES · EXPORT) | `web/html/assets/js/workbench.js` `injectHeaderTabs()` + `web/html/tools/workbench/workbench.css` `.header-tabs` | Progressive-unlock tab navigation |
| **"INPUT" heading + "ALL" dropdown** | `web/html/tools/workbench/workbench.html:100-108` | Tab title + filter dropdown (not yet functional) |
| **"WORKBENCH CONTEXT" toggle** | `web/html/tools/workbench/workbench.html:110-115` | Expand/collapse context panel (debug/state info) |
| **Upload / Paste / URL buttons** | `web/html/tools/workbench/workbench.html:371-380` + `workbench.js` `switchInputMode()` | Input mode switcher — toggles which intake panel is visible |
| **Drop zone** (cloud icon + "Drop files here") | `web/html/tools/workbench/workbench.html:385-393` + `workbench.js` `setupDropZone()` | Drag-and-drop / click-to-browse file upload area |
| **Format label** (PDF · JPG · PNG...) | `web/html/tools/workbench/workbench.html:390` | Shows accepted file types |
| **Backend radio** (WSL / Python) | `web/html/tools/workbench/workbench.html:436-452` | Select OCR backend (ocrmypdf via WSL or Python fallback) |
| **Preprocessing checkboxes** (Deskew · Clean · Force OCR) | `web/html/tools/workbench/workbench.html:454-476` | OCR preprocessing options passed to backend |
| **Output Formats checkboxes** (PDF · TXT · MD · HTML) | `web/html/tools/workbench/workbench.html:478-507` | Which output formats to generate from OCR |
| **Whisper Transcription** (Model + Language dropdowns) | `web/html/tools/workbench/workbench.html:530-545` | Whisper model/language settings for audio/video files |
| **"No files queued" + Cancel / Start Processing** | `web/html/tools/workbench/workbench.html:547-570` + `workbench.js` `startProcessing()` / `cancelProcessing()` | File count status + action buttons to kick off processing |
| **Kanban board** (QUEUED · PROCESSING · COMPLETE) | `workbench.js` `renderKanban()` + `web/html/tools/workbench/workbench.html:572-590` | Visual pipeline showing file progress through OCR/Whisper |
| **Footer stats** (Total · Succeeded · Avg Confidence) | `web/html/tools/workbench/workbench.html:1044-1048` | Aggregate stats across all processed files |

## Hidden Panels

| Component | File | Purpose |
|---|---|---|
| **Paste panel** | `web/html/tools/workbench/workbench.html:397-413` | Title + textarea for pasting raw text |
| **URL panel** | `web/html/tools/workbench/workbench.html:416-432` | URL input + Fetch button |

## Backend API Routes

| Endpoint | File | Purpose |
|---|---|---|
| `POST /api/jobs` | `tools/ocr_server.py:383` | Create processing job |
| `GET /api/config` | `tools/ocr_server.py` | Server capabilities |
| `POST /api/ingest-url` | `tools/ocr_server.py:1862` | Unified URL fetch (auto-detects type) |
| `POST /api/paste` | `tools/ocr_server.py:1838` | Paste text intake |
| `POST /api/download` | `tools/ocr_server.py:292` | yt-dlp audio download (legacy) |
| `GET /api/download/file/<name>` | `tools/ocr_server.py:372` | Serve downloaded file for queue injection |
