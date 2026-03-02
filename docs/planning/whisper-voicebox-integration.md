# Plan: Whisper Transcription Input + Voicebox TTS Output

## Context

The workbench currently only ingests PDFs and images via OCR. We want to add audio/video as input sources (oral histories, interviews, depositions, press conferences) using local Whisper for transcription, and plan Voicebox TTS for read-back and audio export on the output side. Once Whisper produces `.txt`, the entire downstream pipeline (classify, entities, export) works unchanged — it's all text.

**Build**: Phase 1 (Whisper input). **Plan only**: Phase 2 (Voicebox output).

---

## Phase 1: Whisper Transcription Input (BUILD)

### 1A. New file: `tools/ocr-gui/transcription_worker.py`

Modeled on `tools/ocr-gui/ocr_worker.py`. Same class structure, callbacks, cancel pattern.

```
class TranscriptionWorker:
    __init__(model_size="base", language=None, output_dir, output_txt, output_vtt, output_json)
    process_file(filepath)           # entry point
    _extract_audio(video_path)       # ffmpeg for video -> wav
    _transcribe(audio_path)          # whisper.transcribe()
    _write_txt(segments, path)       # plain text with segment delimiters
    _write_vtt(segments, path)       # WebVTT timestamps
    _write_json(segments, meta, path)  # structured transcript
```

**Outputs** (parallel to OCRWorker's `.txt`/`.ocr.json`/`.pdf`):
- `{base}.txt` — plain transcript (consumed by metadata parser + classifier)
- `{base}.vtt` — WebVTT for playback sync
- `{base}.transcript.json` — structured segments with timestamps

### 1B. Modify: `tools/ocr_server.py`

| Location | Change |
|----------|--------|
| Line ~30 | Import TranscriptionWorker with `WHISPER_AVAILABLE` flag |
| Line 105 | Add `AUDIO_EXTENSIONS`, `VIDEO_EXTENSIONS` sets, extend `ALLOWED_EXTENSIONS` |
| Line ~127 | Add `is_media()`, `is_audio()`, `is_video()` helpers |
| Line 171 | `/api/config` — add `whisper_available`, `whisper_models` |
| Line 182 | `/api/jobs` POST — accept `whisper_model`, `whisper_language` form fields |
| Line 313 | `process_job_worker()` — route media files to TranscriptionWorker instead of OCRWorker |
| Line 1018 | `/api/review/{filename}` — handle media files via `.transcript.json` -> segment-based pages |
| Line 1240 | `/api/history` — scan for media files alongside PDFs |

**File type routing in `process_job_worker()`:**
```
if is_media(file):
    TranscriptionWorker -> .txt/.vtt/.transcript.json
    _run_metadata_parser(file)  # same as OCR path
else:
    OCRWorker -> .txt/.pdf/.ocr.json (unchanged)
```

### 1C. Modify: `web/html/assets/js/workbench.js`

| Location | Change |
|----------|--------|
| Line 1249 | Extend `ALLOWED_EXTS` with audio/video extensions |
| Line 1249+ | Add `MEDIA_EXTS`, `VIDEO_EXTS` sets |
| Line 1376 | `getSettings()` — include whisper_model, whisper_language |
| Line 1391 | `startProcessing()` — append whisper settings to FormData |
| Line 1568 | `renderQueuedCard()` — mic/videocam icon for media files |
| Line 247 | `renderCard()` — branch to `renderSegmentCard()` for transcripts |
| New method | `renderSegmentCard()` — timestamp + speaker + text preview (no canvas) |
| New method | `formatTime(seconds)` — "00:04:23" helper |
| Line 1832 | SourceTab — media type badge on source cards |
| Line 2171 | `loadFile()` — skip `loadPDF()` for media files |

### 1D. Modify: `web/html/tools/workbench/workbench.html`

- Add whisper settings panel (model selector, language) in Input tab
- Show/hide based on whether media files are queued
- Update drop zone hint text to include audio/video

### 1E. Modify: `web/html/tools/workbench/workbench.css`

- `.segment-preview` — transcript segment card styling
- `.media-badge` — audio/video type indicator

### Extensions accepted

**Audio**: `.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.wma`
**Video**: `.mp4`, `.webm`, `.mov`, `.mkv`, `.avi`

### Transcript JSON structure

```json
{
  "version": "1.0",
  "filename": "interview.mp3",
  "media_type": "audio",
  "duration": 1823.5,
  "language": "en",
  "model": "base",
  "segments": [
    { "id": 0, "start": 0.0, "end": 4.8, "text": "This is Special Agent...", "confidence": 0.92 }
  ]
}
```

### Dependencies

- `pip install openai-whisper` (pulls torch automatically)
- `ffmpeg` system install (required for video audio extraction + whisper internals)

### What stays unchanged

- `entity_matcher.py` — already text-agnostic
- `/api/entities` — operates on text strings
- `/api/entities/export` — operates on entity records
- `/api/feedback` — operates on page/segment feedback
- ExportTab — source record + entity export are media-agnostic
- EntitiesTab — concatenates `pages[].text`, works on segments identically

---

## Phase 2: Voicebox TTS Output (PLAN ONLY)

### Architecture

Voicebox runs as a separate local REST API. The workbench proxies through `ocr_server.py`.

```
Classify Tab -> TTS button -> POST /api/tts/synthesize -> Voicebox API -> audio blob -> <audio>
Export Tab -> Narrate -> POST /api/tts/batch -> Voicebox API -> .mp3 zip -> download
```

### New endpoints (future)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/tts/synthesize` | Single text -> audio blob |
| `POST /api/tts/batch` | Multiple texts -> zip of .mp3 files |
| `GET /api/tts/config` | Voicebox availability + voice list |

### UI (future)

- **Classify tab**: Speaker icon per card -> plays OCR/transcript text aloud
- **Export tab**: "Narrate Entity Summaries" + "Narrate Source Excerpts" buttons -> downloads .mp3 zip

### Dependencies (future)

- Voicebox local REST API (Qwen3-TTS backend)
- No Python packages — HTTP proxy only

---

## Build order

| Step | Scope | Verify |
|------|-------|--------|
| 1A | TranscriptionWorker class | Unit test: `.mp3` -> `.txt` + `.vtt` + `.transcript.json` |
| 1B | ocr_server routing + endpoints | Upload .mp3 via API, check `/api/history` returns it |
| 1C | InputTab + ClassifyTab frontend | Drag-drop .mp4, see segment cards in Classify |
| 1D | workbench.html whisper settings | Model/language selectors appear for media files |
| 1E | Full end-to-end | Upload audio -> transcribe -> classify segments -> detect entities -> export |

## Verification

1. `pip install openai-whisper` + verify `ffmpeg` on PATH
2. Upload a short .mp3 clip via Input tab
3. Confirm transcription completes with progress updates
4. Select file in Source tab — should show TRANSCRIPT badge
5. Switch to Classify — segment cards with timestamps, tier selectors work
6. Run entity detection — matches found in transcript text
7. Export source record — works identically to PDF workflow
