# YouTube Transcript Integration Plan

## Problem
Currently, YouTube URLs go through yt-dlp audio download + Whisper transcription. This is slow (minutes), GPU-dependent, and often less accurate than YouTube's own captions.

## Solution
Prefer YouTube's built-in transcripts when available. Fall back to audio download + Whisper only when no transcript exists.

## How yt-dlp Exposes Transcripts
- `extract_info(url, download=False)` returns two dicts:
  - `info['subtitles']` — manually uploaded captions (highest quality)
  - `info['automatic_captions']` — auto-generated captions (~90% of English videos)
- Each dict is keyed by language code (e.g. `en`, `es`, `fr`)
- Each track offers multiple formats: `vtt`, `srv3`, `ttml`, `json3`
- VTT is the target format — already supported in our pipeline

## Detection Flow (inside `_download_ytdlp`)

```
YouTube URL detected
  → extract_info(download=False)
  → Check subtitles['en'] (manual) → prefer this
  → Check automatic_captions['en'] (auto) → fallback
  → If transcript found:
      Download VTT → strip timestamps → save as .txt + .ocr.json
      Return type: "scraped" (instant, no processing needed)
  → If no transcript:
      Download audio as MP3 → queue for Whisper
      Return type: "ytdlp" (needs processing)
```

## Implementation

### Backend: `tools/ocr_server.py`

Add `_extract_yt_transcript(url, lang='en')` helper:

1. Call `yt_dlp.YoutubeDL.extract_info(url, download=False)`
2. Check `info['subtitles'].get(lang)` then `info['automatic_captions'].get(lang)`
3. Find the VTT format URL in the track list
4. Download VTT content via `requests.get()`
5. Strip VTT timestamps and metadata → plain text
6. Save as `.txt` + `.ocr.json` sidecar (same shape as web scrape)
7. Return `{"success": True, "type": "scraped", "title": ..., "basename": ..., "pages": ..., "chars": ...}`

Modify `_download_ytdlp()`:
- Try `_extract_yt_transcript()` first
- If it returns a result, return it directly
- If no transcript available, proceed with existing audio download logic

### Frontend: `web/html/assets/js/workbench.js`

Minimal change — update status message in `downloadUrl()` to distinguish transcript from scrape:

- Backend response includes `"source": "yt-transcript"` when transcript was used
- Frontend shows: `"Transcript: Video Title (auto-captions)"` instead of `"Scraped: Video Title"`
- No new UI elements needed — same Fetch button, same queue behavior
- File appears in queue as completed, source tab refreshes automatically

### UX Flow (no UI changes)

```
User pastes YouTube URL → clicks Fetch
  → Status: "Detecting content type..."
  → Status: "Transcript: JFK Speech (auto-captions)" ← instant
  → File appears in COMPLETE column of kanban
  → Source tab auto-refreshes
```

Compare to current flow:
```
User pastes YouTube URL → clicks Fetch
  → Status: "Downloading audio..."        ← 30-60 seconds
  → File appears in QUEUED column
  → User clicks Start Processing
  → Whisper transcribes                   ← 2-5 minutes
  → File moves to COMPLETE
```

## Benefits
- **Speed**: Instant vs minutes for audio download + Whisper
- **Accuracy**: YouTube's captions (especially manual) are often better than local Whisper base model
- **No GPU**: Removes Whisper dependency for most YouTube content
- **No audio storage**: No MP3 files saved for transcript-only ingestion

## Edge Cases
- **No English transcript**: Could accept a `lang` parameter from frontend, default to `en`
- **Multiple languages**: Could save all available languages, or let user choose
- **Auto-caption quality**: Some auto-captions are poor — user can re-process via Whisper if needed
- **Private/restricted videos**: `extract_info` will fail — error handling already exists

## Files Modified
- `tools/ocr_server.py` — add `_extract_yt_transcript()`, modify `_download_ytdlp()` to try transcript first

## Testing
1. Paste a YouTube URL with manual subtitles → should return instantly as scraped text
2. Paste a YouTube URL with only auto-captions → should return instantly as scraped text
3. Paste a YouTube URL with no captions → should fall back to audio download
4. Verify `.txt` + `.ocr.json` output matches expected format
