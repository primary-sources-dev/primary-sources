# Workbench UI/UX Enhancement Codex

## Current State
All 5 tabs functional. Core pipeline works. UI is utilitarian — built for function, not polish. The opportunity is to add clarity, feedback, and flow without breaking what works.

---

## Tab 1: INPUT

### Current
- 3 mode buttons (Upload/Paste/URL) toggle panels
- Drop zone with format list
- Settings panel (backend, preprocessing, output formats, whisper)
- Kanban board (queued/processing/complete)

### Gaps
- No drag feedback animation on the drop zone
- No file type icon in the queue (all files look the same)
- No progress indication during URL fetch (just text)
- Kanban complete cards show metadata but no quick action to jump to Source tab
- No batch URL input (paste multiple URLs)

### Proposed Enhancements
1. **File type badges in kanban** — PDF icon, audio waveform, text icon, video icon per queued file
2. **Animated drop zone** — border pulse on dragover, checkmark flash on drop
3. **URL fetch progress bar** — indeterminate progress bar during detection phase
4. **"Go to Source" button** on completed kanban cards — one click to Source tab with file pre-selected
5. **Batch URL textarea** — toggle from single URL input to multi-line for bulk ingest
6. **Ingest summary toast** — after processing completes, show "3 files processed, 2 succeeded, 1 failed"

### ASCII Component: Input Tab (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────┐
│  INPUT          [ALL ▼]                      [WORKBENCH CONTEXT ─] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [■ Upload]  [□ Paste]  [□ URL]  [□ Batch URL]                     │
│                                                                     │
│  ┌─────────────────────────────────┐  ┌──────────────────────────┐ │
│  │          ☁ DROP ZONE            │  │ BACKEND                  │ │
│  │   ┌─────────────────────────┐   │  │ (●) WSL  (○) Python     │ │
│  │   │  drag animation here    │   │  │                          │ │
│  │   │  ~~~~~~~~~~~~           │   │  │ PREPROCESSING            │ │
│  │   └─────────────────────────┘   │  │ [✓] Deskew  [✓] Clean   │ │
│  │  PDF·JPG·PNG·TXT·MP3·WAV·MP4   │  │ [ ] Force OCR            │ │
│  │                                 │  │                          │ │
│  └─────────────────────────────────┘  │ OUTPUT FORMATS           │ │
│                                       │ [✓]PDF [✓]TXT [✓]MD     │ │
│  ┌──────────────────────────────┐     │ [✓]HTML                  │ │
│  │ 🎤 WHISPER  Model[Base▼]    │     └──────────────────────────┘ │
│  │ Language[Auto▼]             │                                   │
│  └──────────────────────────────┘                                  │
│                                                                     │
│  Files: 3 queued          [✕ Cancel]  [▶ Start Processing]         │
│                                                                     │
│  ┌── QUEUED ──────┐ ┌── PROCESSING ──┐ ┌── COMPLETE ────────────┐ │
│  │ 📄 report.pdf  │ │ 📄 memo.pdf    │ │ 📄 yates.pdf  FBI_302  │ │
│  │    1.2 MB  [✕]  │ │ ████░░ 62%    │ │    ✓ 43 pages          │ │
│  │ 🎵 audio.mp3   │ │ Classifying... │ │    [Go to Source →]    │ │
│  │    4.8 MB  [✕]  │ │               │ │ 📝 pasted.txt          │ │
│  │ 📝 paste.txt   │ │               │ │    ✓ 2 pages            │ │
│  │    0.1 KB  [✕]  │ │               │    [Go to Source →]    │ │
│  └─────────────────┘ └───────────────┘ └────────────────────────┘ │
│                                                                     │
│  ▸ Log: [3 entries]                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tab 2: SOURCE

### Current
- Search + sort toolbar
- File grid (cards with name, size, status)
- "Process New Document" link to OCR UI
- Review status count from localStorage

### Gaps
- No file type visual distinction (PDF vs audio vs text all same card)
- No thumbnail/preview
- No date/timestamp shown
- No bulk selection
- "Process New Document" links to old OCR UI (should loop back to Input tab)
- Grid cards are text-only — no visual hierarchy

### Proposed Enhancements
1. **File type icons + color coding** — PDF (red), audio (blue), video (purple), text (green)
2. **Mini preview thumbnail** — first page render for PDFs (tiny canvas), waveform for audio, text snippet for .txt
3. **Date column** — file modification timestamp
4. **Review progress bar** — small bar showing reviewed/total pages per file
5. **"Process New" button loops to Input tab** instead of external OCR page
6. **Bulk select + bulk action** — select multiple files, bulk export or bulk delete
7. **Active file highlight** — currently selected file gets a prominent border

### ASCII Component: Source Tab (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SOURCE                                                             │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search files...]  [Sort: Name A-Z ▼]  [+ New → Input Tab]    │
│  14 documents                                                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 📄 ralphleonyatesdocumentsfull_searchable.pdf    ■ ACTIVE   │  │
│  │ ┌──────┐  OCR_RESULT · 27.8 MB · 2026-02-28                │  │
│  │ │ mini │  43 pages · ██████████░░ 38/43 reviewed            │  │
│  │ │ prev │  FBI_302 (primary type)                            │  │
│  │ └──────┘                                                    │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 📝 example-domain.txt                                       │  │
│  │ ┌──────┐  TEXT_INGEST · 142 B · 2026-03-02                  │  │
│  │ │ This │  1 page · ░░░░░░░░░░░░ Unreviewed                 │  │
│  │ │ is.. │                                                    │  │
│  │ └──────┘                                                    │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 🎵 pipeline_speech_test.wav                                 │  │
│  │ ┌──────┐  MEDIA_UPLOAD · 1.2 MB · 2026-02-27               │  │
│  │ │ ~~~~ │  6 segments · ████░░░░░░ 2/6 reviewed              │  │
│  │ │ wave │                                                    │  │
│  │ └──────┘                                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tab 3: CLASSIFY

### Current
- Summary stats bar (total, reviewed, correct, incorrect)
- Pagination (1 card at a time)
- Filters (type, agency, status)
- Per-page card: canvas (left) + classification panel (right)
- 4-tier feedback (agency, class, format, content)
- Entity assist picker
- Modal full-page view

### Gaps
- One card at a time is slow for 43-page documents — no way to scan quickly
- No keyboard shortcuts (Enter to save, Tab to next)
- No "Apply to all similar" for repeated page types
- Progress bar for reviewed/total is buried in stats
- No side-by-side comparison of consecutive pages
- Filter state not visually persistent (hard to see what's active)
- No minimap/page strip for quick navigation

### Proposed Enhancements
1. **Keyboard shortcuts** — Enter = Apply & Save, Shift+Enter = Skip, Arrow Right = Next page, Arrow Left = Prev
2. **Page strip/minimap** — horizontal scroll of tiny thumbnails below stats, click to jump
3. **Batch apply** — "Apply to all pages of type FBI_302" button when feedback is set
4. **Progress bar** — prominent bar under stats showing reviewed/total with percentage
5. **Active filter pills** — show active filters as dismissible pills above the card
6. **Quick scan mode** — toggle to show 4-6 smaller cards per page for rapid triage
7. **Confidence heatmap** — color the page strip by confidence (red=low, green=high)
8. **Sticky feedback panel** — keep the 4-tier panel visible while scrolling text

### ASCII Component: Classify Tab (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLASSIFY  yates_searchable.pdf                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Total: 43  Reviewed: 38  ✓ Correct: 35  ✗ Incorrect: 3           │
│  ████████████████████████████████████████░░░░░ 88% reviewed        │
│                                                                     │
│  ┌─ PAGE STRIP ────────────────────────────────────────────────┐   │
│  │ [1✓][2✓][3✓][4✓][5✓]...[15●][16○][17○]...[42○][43○]       │   │
│  │  ▲ green=done  ● current  ○ pending  ▲ red=incorrect       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Filters: [Type: FBI_302 ✕] [Status: Pending ✕]    [Quick Scan]   │
│  ◄ Prev   Page 15 of 43   Next ►                                  │
│                                                                     │
│  ┌─────────────────┬───────────────────────────────────────────┐   │
│  │                 │ PREDICTED: FBI_302 (45%)                  │   │
│  │   ┌─────────┐   │ Agency:  [FBI ✓] [CIA] [DPD] [WC]       │   │
│  │   │         │   │ Class:   [FD-302 ✓] [AIRTEL] [MEMO]     │   │
│  │   │  PDF    │   │ Format:  [REPORT ✓] [CABLE] [LETTER]    │   │
│  │   │  PAGE   │   │                                          │   │
│  │   │  15     │   │ Content: [✓]Names [✓]Dates [ ]Addresses  │   │
│  │   │         │   │                                          │   │
│  │   │ (click  │   │ Notes: [Preset ▼] [detail field]        │   │
│  │   │  zoom)  │   │                                          │   │
│  │   └─────────┘   │ Entities: Person▼ [Yates ✓] [Ruby ✓]   │   │
│  │                 │                                          │   │
│  │  Text excerpt:  │  [■ Apply & Save]  [□ Skip]             │   │
│  │  "FEDERAL BUR.. │  ⌨ Enter=Save  Shift+Enter=Skip         │   │
│  └─────────────────┴───────────────────────────────────────────┘   │
│                                                                     │
│  [← Apply to all FBI_302 pages]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tab 4: ENTITIES

### Current
- Detect button + auto-detection
- Filter bar (type, status, tag, search)
- Table (name, type, confidence, page, action)
- Approve/reject buttons
- Page jump (cross-tab to Classify)

### Gaps
- Table-only view — no visual grouping by type
- No entity count summary by type
- No relationship mapping (who was at what place)
- No merge/dedup for similar entities (e.g. "Dallas" vs "Dallas, Texas")
- Approve/reject is per-row only — no bulk actions
- No entity detail panel (just name in table)

### Proposed Enhancements
1. **Entity summary cards** — top row showing count by type (12 People, 5 Places, 3 Orgs) with icons
2. **Grouped view toggle** — switch from flat table to grouped-by-type accordion
3. **Bulk approve/reject** — checkbox column + "Approve Selected" / "Reject Selected" buttons
4. **Entity detail sidebar** — click entity name to see all pages where it appears, context excerpts
5. **Dedup suggestions** — flag similar names (fuzzy match) for merge review
6. **Relationship hints** — show co-occurring entities (entities on the same page)
7. **Confidence bar** — visual bar instead of percentage number

### ASCII Component: Entities Tab (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENTITIES  yates_searchable.pdf         [▶ Detect Entities]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ 👤 12   │ │ 📍 5    │ │ 🏛 3    │ │ 📫 2    │ │ 📅 8    │    │
│  │ People  │ │ Places  │ │ Orgs    │ │ Address │ │ Dates   │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                                     │
│  [Type▼] [Status▼] [Tag▼] [🔍 Search...]  [☐ Select All]         │
│  [✓ Approve Selected]  [✗ Reject Selected]                         │
│                                                                     │
│  ┌────┬──────────────────────┬──────┬───────────┬─────┬──────────┐│
│  │ ☐  │ Entity Name          │ Type │ Conf      │ Pg  │ Action   ││
│  ├────┼──────────────────────┼──────┼───────────┼─────┼──────────┤│
│  │ ☐  │ Warren Commission    │ org  │ ████████░ │ 1,3 │ [✓] [✗] ││
│  │ ☐  │ Dallas, Texas        │place │ ████████░ │ 2   │ [✓] [✗] ││
│  │ ☐  │ James C. Yates *new  │pers  │ █████░░░░ │ 1-5 │ [✓] [✗] ││
│  │ ☐  │ Dallas County SO *new│ org  │ █████░░░░ │ 4   │ [✓] [✗] ││
│  └────┴──────────────────────┴──────┴───────────┴─────┴──────────┘│
│                                                                     │
│  ┌─ DETAIL SIDEBAR (click entity) ─────────────────────────────┐  │
│  │ Warren Commission                                           │  │
│  │ Type: org  │  Status: matched  │  Confidence: 100%          │  │
│  │ Pages: 1, 3, 7, 12, 15                                     │  │
│  │ Context: "...testified before the Warren Commission on..."  │  │
│  │ Co-occurs with: Dallas TX, James Yates, FBI                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tab 5: EXPORT

### Current
- Source record preview (name, type, agency, format, content tags, notes)
- Export actions (source record, new entities, download feedback JSON)
- TTS audio panel (voice, speed, format, narration checkboxes)

### Gaps
- No readiness indicator (what's complete vs what's missing before export)
- No preview of what will be exported (just form fields)
- Export log is small and easy to miss
- No confirmation dialog before export
- No link to view exported data after export
- TTS panel hidden by default — easy to miss entirely

### Proposed Enhancements
1. **Export readiness checklist** — visual checklist showing: pages reviewed ✓, entities approved ✓, source name set ✓
2. **Export preview panel** — collapsible JSON preview of the exact record that will be written
3. **Post-export link** — after export, show "View in sources.json" or "Open entity page"
4. **Confirmation modal** — "Export 1 source record + 3 new entities?" with summary before writing
5. **TTS always visible** — move from hidden panel to always-visible section (collapsed by default)
6. **Export history** — small log of past exports from this session

### ASCII Component: Export Tab (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXPORT  yates_searchable.pdf                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ EXPORT READINESS ──────────────────────────────────────────┐   │
│  │ [✓] 38/43 pages reviewed          (minimum: 1)             │   │
│  │ [✓] 8 entities approved           (minimum: 0)             │   │
│  │ [✓] Source name set               "Yates FBI File"         │   │
│  │ [✓] Agency assigned               FBI                      │   │
│  │ [⚠] 5 pages skipped              (review recommended)      │   │
│  │                                                             │   │
│  │ Ready to export ████████████████████████████░ 88%           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ SOURCE RECORD PREVIEW ─────────────────────────────────────┐   │
│  │ Name: [Yates FBI File          ]  Type: [REPORT ▼]         │   │
│  │ Agency: [FBI ▼]  Format: [FD-302 ▼]                        │   │
│  │ Tags: [FBI_302] [WITNESS_INTERVIEW] [NAMES] [DATES]        │   │
│  │ Notes: [                                              ]     │   │
│  │                                                             │   │
│  │ ▸ Preview JSON output                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ ACTIONS ───────────────────────────────────────────────────┐   │
│  │ [■ Export Source Record]  [□ Export 3 New Entities]          │   │
│  │ [□ Download Feedback JSON]                                  │   │
│  │                                                             │   │
│  │ Log:                                                        │   │
│  │  ✓ Created source record → sources.json                    │   │
│  │  ✓ Created "James C. Yates" → people.json                  │   │
│  │  ⊘ Skipped "Dallas, Texas" (already exists)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ AUDIO EXPORT (Kokoro TTS) ─────────────────────── [▾ open] ┐  │
│  │ Source: [Workbench Review ▼]  Voice: [Heart ▼]  Speed: 1.0x │  │
│  │ [✓] Source Summary  [✓] Entities  [✓] Full Text  [ ] Pages  │  │
│  │ [▶ Preview]  [⬇ Generate & Download]                        │  │
│  │ ┌─ 🔊 ──────────────────────────────────── 0:12 ──────┐    │  │
│  │ └─────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cross-Tab UX Enhancements

### Current
- Progressive unlock (Input/Source always open, others gated)
- Tab switching via header buttons
- Toast notifications

### Proposed
1. **Breadcrumb trail** — show current position: `INPUT > SOURCE > yates.pdf > CLASSIFY > Page 15`
2. **Tab badges** — show counts on each tab: Source(14), Classify(5 pending), Entities(30), Export(ready)
3. **Global keyboard nav** — Ctrl+1-5 to switch tabs
4. **Session timer** — small clock showing how long current review session has been active
5. **Undo last action** — Ctrl+Z to undo last feedback save
