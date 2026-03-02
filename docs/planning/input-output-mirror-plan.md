# Input-Output Mirror Plan (EPUB + Multimodal Parity)

## Goal
- Add EPUB as first-class input.
- Audit current input/output capabilities.
- Define and execute a mirror-input-with-output standard.

## Expectations
- Every accepted input type should produce a consistent minimum output set.
- Review/classify/entity loop must work regardless of source type.
- Provenance must remain segment/page/chapter attributable.
- No breaking changes to existing PDF/image/audio/video flows.

## Current Inputs (Audit Baseline)
- `pdf`, image types (`jpg/png/tiff/webp/heic`)
- archives (`zip/tar/gz/...`)
- audio (`mp3/wav/m4a/flac/ogg/wma`)
- video (`mp4/webm/mov/mkv/avi`)
- URL download (yt-dlp path)
- `epub` (not yet supported)

## Current Outputs (Audit Baseline)
- OCR/processing: `.txt`, `.md`, `.html`, searchable pdf (where applicable), `.ocr.json`
- media transcription: `.transcript.json`, `.txt`, `.vtt`
- review exports: feedback `_v2` JSON
- entity exports: people/places/org/events/objects/sources JSON
- TTS exports: audio/zip from workbench or processed text sources

## Mirror Standard (Target by Input Type)
- Minimum mirrored outputs for each input:
1. `normalized_text` (required)
2. `structured_segments` (required)
3. `review_units` (required)
4. `entity_candidates` (required)
5. `feedback_export` (required)
6. `audio_export` (optional for all text-capable inputs)

## EPUB Integration Plan
1. Accept `.epub` in upload validator and UI.
2. Add EPUB extractor worker:
- parse chapters/sections
- emit unified text + segment structure
3. Write processed sidecars:
- `<base>.txt`
- `<base>.md` (optional)
- `<base>.epub.json` (chapter/section metadata)
4. Add `/api/review/<epub>` adapter:
- convert chapter/section blocks into review units (like pages/segments)
5. Add source typing:
- `source_type=epub_text`
- optional `source_medium=ebook`
6. Enable entity detection on EPUB review text.
7. Enable TTS-from-file on EPUB outputs via existing txt/md path.

## Input vs Output Audit Task
1. Build capability matrix: each input x each output.
2. Mark:
- supported
- partial
- missing
3. Add reason for each gap and implementation cost (`low/med/high`).
4. Prioritize gaps that block feedback loop parity.

## Success Criteria
- EPUB files can be processed, reviewed, entity-detected, exported, and narrated.
- Capability matrix shows no critical missing outputs for supported inputs.
- All source types can enter the same feedback loop with source-aware cards.
- Attribution stored for each review unit (page/segment/chapter + offsets/timestamps).

## Expected Results
- One unified multimodal pipeline (docs + media + ebooks).
- Better classifier/entity training coverage across source types.
- Reduced manual workaround for non-PDF content.
- Clear roadmap for remaining parity gaps.

## Execution Order
1. Produce capability matrix (current-state truth).
2. Implement EPUB ingest + sidecar generation.
3. Implement EPUB review adapter.
4. Validate entity + TTS compatibility.
5. Update docs/runbook with new source type and commands.
6. Run one EPUB end-to-end test and publish findings.
