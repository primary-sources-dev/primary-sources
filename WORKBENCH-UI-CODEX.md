# Workbench UI/UX Enhancements (Codex)

## 1. Input Tab
- Add a clear 3-step intake rail: `Add Source -> Validate -> Queue`.
- Show ingest result chips per item: `scraped`, `downloaded`, `transcript`, `error`.
- Add per-item “next action” button (`Review now`, `Retry`, `View details`).
- Improve URL mode with source-type preview before submit (web/article/pdf/video/audio badge).

## 2. Source Tab
- Convert grid to “work queue” cards with status bands: `new`, `in review`, `blocked`, `ready to export`.
- Add progress mini-bars (reviewed pages, entity decisions, export readiness).
- Add quick filters row pinned at top: type, status, last updated.
- Add “resume where left off” CTA on each source.

## 3. Classify Tab
- Add explicit review-state header on each card: `Pending / Verified / Skipped`.
- Make skip reason mandatory with fast reason chips + optional note.
- Show “why model chose this” panel (top signals/fingerprints) collapsible.
- Add left-right split: preview canvas left, structured decision panel right, with sticky action footer.
- Add “Next unresolved” button and keyboard shortcuts (`V`, `S`, `N`).

## 4. Entities Tab
- Use a two-pane flow: detected entities list + evidence context panel.
- Group entities by type with confidence and “new candidate” tag.
- Add bulk actions: approve all exact matches, reject all low-confidence.
- Add explicit page-scope indicator so user always knows current scope.
- Add “Apply selected to remaining pages” as guarded bulk control.

## 5. Export Tab
- Make it a preflight checklist UI:
  - review complete %
  - skipped with reasons count
  - entities approved count
  - schema validation status
- Show “export package preview” before final write.
- Add clear post-export confirmation with links to produced files.
- Add change-diff since last export (`+new approvals`, `+new notes`, `-rejected`).

## 6. Cross-Tab UX
- Add a persistent top Workbench state bar:
  - active source
  - current stage
  - unresolved count
  - save status
- Standardize CTA labels across tabs (`Save`, `Skip`, `Approve`, `Export`).
- Add unsaved-changes guard when switching source/tab.
- Keep one visual language for statuses across all tabs (same color/token mapping).

## 7. Audio/Video-Specific Flow
- Add transcript timeline panel with timestamp anchors.
- Let users click transcript lines to jump audio playback.
- Add segment-level classify cards (clip chunks) with quick merge/split.
- Show source attribution metadata (url, ingest method, transcript source) inline.

## 8. Component Tailoring Priorities
### New components
- `workbench-status-rail`
- `review-state-chip`
- `skip-reason-chip-group`
- `entity-evidence-panel`
- `export-readiness-checklist`

### Refactor existing
- Classify card shell into source-type variants (`document-card`, `audio-card`).
- Shared action footer component for consistency.

## 9. Best Next UX Iteration (High Value, Low Risk)
1. Add review-state clarity + mandatory skip reasons.
2. Add source progress + resume CTA in Source tab.
3. Add export preflight checklist.
4. Add keyboard shortcuts and next-unresolved flow.
5. Add transcript timeline for audio/video after the above is stable.
