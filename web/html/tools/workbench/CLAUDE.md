# CLAUDE.md — Document Workbench

## Mission

Complete 5-tab scanner: **Input → Source → Classify → Entities → Export**. End-to-end flow for Yates event documents.

## Architecture

7 classes, 209 elements, 1 file (`assets/js/workbench.js`)

| Class | Line | Role |
|---|---|---|
| InputTab | 1128 | File upload, OCR processing, kanban queue |
| SourceTab | 1631 | File history grid, file selection |
| ClassifyTab | 35 | Per-page review, Agency/Class/Format tiers, content tags |
| EntitiesTab | 684 | Entity detection, approve/reject, filter/search |
| ExportTab | 931 | Source record + new entity export to JSON |
| DocumentWorkbench | 1759 | State manager, tab orchestration, progressive unlock |
| DocumentWorkbench | 49 | Header rendering (legacy, line 49) |

## Progressive Unlock

Input/Source → always available
Classify → requires loaded file + classificationData
Entities → requires reviewed pages
Export → requires approved entities

Logic: `getUnlockState()` line 1991, `updateTabStates()` line 1998

## API Endpoints

| Endpoint | Method | Used By | Line |
|---|---|---|---|
| `/api/config` | GET | InputTab | 1145 |
| `/api/jobs` | POST | InputTab | 1303 |
| `/api/jobs/:id/start` | POST | InputTab | 1310 |
| `/api/jobs/:id` | GET | InputTab | 1325 |
| `/api/jobs/:id/cancel` | POST | InputTab | 1399 |
| `/api/history` | GET | SourceTab | 1644 |
| `/api/download/:file` | GET | DocumentWorkbench | 1820 |
| `/api/download/:file.txt` | GET | InputTab | 1606 |
| `/api/parse-metadata` | POST | InputTab | 1611 |
| `/api/review/:file` | GET | DocumentWorkbench | 2077 |
| `/api/feedback` | POST | ClassifyTab | 453 |
| `/api/entities` | POST | EntitiesTab | 727 |
| `/api/entities/export` | POST | ExportTab | 1041, 1106 |

## State

| Key | Location | Purpose |
|---|---|---|
| `feedback{}` | class property | Per-page classification data |
| `entityApprovals` | class property | Approve/reject decisions |
| `workbench_export_{file}` | localStorage | Persisted entity approvals |
| `FILE_NAME` | class property | Current loaded file |
| `classificationData` | class property | Server review data |

## Files

- `web/html/tools/workbench/workbench.html` — page template
- `web/html/tools/workbench/workbench.css` — scoped styles
- `web/html/assets/js/workbench.js` — all logic
- `tools/ocr_server.py` — Flask API (all endpoints above)
- `tools/entity_matcher.py` — entity detection engine
- `tools/ocr-gui/document_classifier.py` — document classification

## Key Methods

| Method | Class | Line | Purpose |
|---|---|---|---|
| `injectHeaderTabs()` | DocumentWorkbench | 1946 | Inject tabs into global header |
| `switchTab()` | DocumentWorkbench | 2014 | Tab navigation + unlock check |
| `loadFile()` | DocumentWorkbench | 2043 | Load PDF + classification data |
| `detectEntities()` | EntitiesTab | 689 | POST to /api/entities |
| `renderEntitiesDashboard()` | EntitiesTab | 786 | Render entity table |
| `approveEntity()` | EntitiesTab | 902 | Mark entity approved |
| `exportSourceRecord()` | ExportTab | 1007 | Export source to JSON |
| `exportNewEntities()` | ExportTab | 1060 | Export candidates to JSON |
| `startProcessing()` | InputTab | 1278 | Begin OCR job |
| `renderCard()` | ClassifyTab | 242 | Render page card |
| `submit4Tier()` | ClassifyTab | 415 | Save classification tiers |
| `selectFile()` | SourceTab | 1747 | Select file from history |

## Inline Rules

→ `docs/nextjs-port-plan.md` Section III

## Don't

- Modify global header/footer components
- Scatter localStorage calls outside dedicated save/load methods
- Mix fetch logic into render methods
- Use unversioned localStorage keys
