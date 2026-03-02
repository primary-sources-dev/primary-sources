# TTS Integration Context for Classify Agent

## What Exists (built, tested, pushed to main)

### Backend: `tools/tts_worker.py`

Wraps Kokoro TTS (82M params, CPU-only, 24kHz, Apache 2.0).

```python
from tts_worker import TTSWorker, KOKORO_AVAILABLE, VOICES

worker = TTSWorker(voice="af_heart", speed=1.0, lang="a")
audio = worker.synthesize("Hello world")           # → numpy array 24kHz
buf = worker.synthesize_to_buffer("Hello", format="wav")  # → BytesIO
worker.synthesize_to_file("Hello", "out.wav")       # → file on disk
zip_buf = worker.synthesize_batch([                  # → zip of audio files
    {"id": "1", "text": "First item", "label": "Item-One"},
    {"id": "2", "text": "Second item", "label": "Item-Two"},
])
```

- 23 voices: `af_*` (American Female), `am_*` (American Male), `bf_*` (British Female), `bm_*` (British Male)
- Lang is auto-detected from voice prefix: `b*` → British, `a*` → American
- Lazy-loads KPipeline on first call (~2s cold start, then <0.3s per passage)
- Dependencies: `kokoro==0.3.5`, `misaki==0.6.7`, `soundfile` (already installed)

### Backend: `tools/ocr_server.py` — 4 TTS endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/tts/config` | GET | — | `{available: bool, voices: [{id, label, lang}]}` |
| `/api/tts/preview` | POST | `{text (≤200 chars), voice, speed, format}` | audio blob |
| `/api/tts/synthesize` | POST | `{text, voice, speed, format}` | audio blob |
| `/api/tts/batch` | POST | `{items: [{id, text, label}], voice, speed, format}` | `application/zip` |

All return `audio/wav` or `audio/mpeg` (synthesize/preview) or `application/zip` (batch).

Lines in ocr_server.py: import at ~101, config at ~1663, preview at ~1672, synthesize at ~1700, batch at ~1727.

### Frontend: `web/html/tools/workbench/workbench.html`

Audio Export control panel lives inside the Export tab (`#export-content`), inside `#audio-export-panel`. Contains:
- Voice dropdown (`#tts-voice`), speed selector (`#tts-speed`), format selector (`#tts-format`)
- 4 narration checkboxes: source record, entity summaries, full text, individual pages
- Preview button → plays in `<audio id="tts-preview-player">`
- Generate & Download button → downloads zip
- Status div (`#tts-status`)

### Frontend: `web/html/assets/js/workbench.js`

TTS methods on `ExportTab` class (line ~1846):
- `initTTS()` — fetches `/api/tts/config`, shows panel, populates voice dropdown
- `getTTSSettings()` — reads voice/speed/format from DOM
- `previewTTS()` — POSTs first 200 chars to `/api/tts/preview`, plays result
- `generateAudio()` — calls `buildNarrationItems()`, POSTs to `/api/tts/batch`, triggers zip download
- `buildNarrationItems()` — aggregates text from source record fields, entity summaries, page text, and individual pages based on which checkboxes are checked

---

## The Gap: Scan Output → Audio

**Currently:** TTS only reads text composed inside the workbench (reviewed pages, entity summaries, source record fields). It does NOT directly read from scan output files.

**Scan outputs that exist in `web/html/processed/`:**
- `{basename}.txt` — plain OCR text (from OCR or Whisper)
- `{basename}.ocr.json` — structured OCR with per-page text
- `{basename}.transcript.json` — structured Whisper transcript with timestamps
- `{basename}.md` — markdown (if output_md enabled in scan settings)
- `{basename}.html` — HTML (if output_html enabled in scan settings)

**What needs to happen:** Connect these files directly to TTS without requiring full workbench review.

---

## Recommended Integration Path

### Step 1: Backend — `/api/tts/from-file` endpoint

Add to `tools/ocr_server.py` (after existing TTS endpoints, before catch-all):

```python
@app.route("/api/tts/from-file", methods=["POST"])
def tts_from_file():
    """Read a processed file and synthesize audio from its text content."""
    if not KOKORO_AVAILABLE:
        return jsonify({"error": "TTS not available"}), 503

    data = request.get_json() or {}
    filename = data.get("filename", "")       # e.g. "ralphleonyatesdocumentsfull"
    source_format = data.get("source", "txt") # txt, md, html, transcript
    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))
    audio_format = data.get("format", "wav")

    # Resolve file path
    base = os.path.join(PROCESSED_DIR, filename)
    if source_format == "transcript":
        path = base + ".transcript.json"
    elif source_format == "html":
        path = base + ".html"
    elif source_format == "md":
        path = base + ".md"
    else:
        path = base + ".txt"

    if not os.path.isfile(path):
        return jsonify({"error": f"File not found: {path}"}), 404

    # Read and normalize text
    text = open(path, "r", encoding="utf-8").read()

    if source_format == "html":
        # Strip HTML tags
        import re
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
    elif source_format == "transcript":
        import json
        data_json = json.loads(text)
        segments = data_json.get("segments", [])
        text = " ".join(seg.get("text", "") for seg in segments)
    elif source_format == "md":
        # Strip markdown formatting
        import re
        text = re.sub(r'[#*_`~\[\]()]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

    if not text.strip():
        return jsonify({"error": "No text content found"}), 400

    # Chunk into paragraphs for batch synthesis
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [text]

    # If short enough, single synthesis
    if len(text) < 5000:
        lang = "b" if voice.startswith("b") else "a"
        worker = TTSWorker(voice=voice, speed=speed, lang=lang)
        buf = worker.synthesize_to_buffer(text, format=audio_format)
        mime = "audio/mpeg" if audio_format == "mp3" else "audio/wav"
        return send_file(buf, mimetype=mime, as_attachment=True,
                         download_name=f"{filename}.{audio_format}")

    # Long text → batch by paragraph
    items = [{"id": str(i), "text": p, "label": f"Part-{i+1:03d}"}
             for i, p in enumerate(paragraphs)]
    lang = "b" if voice.startswith("b") else "a"
    worker = TTSWorker(voice=voice, speed=speed, lang=lang)
    zip_buf = worker.synthesize_batch(items, format=audio_format)
    return send_file(zip_buf, mimetype="application/zip", as_attachment=True,
                     download_name=f"{filename}-audio.zip")
```

### Step 2: Frontend — Source selector in Export tab

Add a source selector to `#audio-export-panel` in `workbench.html`:

```html
<div class="flex items-center gap-2 mt-2">
    <label class="text-xs text-zinc-400">Source:</label>
    <select id="tts-source" class="bg-zinc-800 text-white text-xs rounded px-2 py-1 border border-zinc-700">
        <option value="workbench">Workbench Review (current)</option>
        <option value="txt">Processed TXT</option>
        <option value="md">Processed MD</option>
        <option value="html">Processed HTML</option>
        <option value="transcript">Transcript JSON</option>
    </select>
</div>
```

### Step 3: Frontend — Route generation based on source

In `workbench.js`, update `generateAudio()`:

```javascript
async generateAudio() {
    const settings = this.getTTSSettings();
    const source = document.getElementById('tts-source')?.value || 'workbench';

    if (source !== 'workbench') {
        // Direct file → audio path
        this.setTTSStatus('Generating from processed file...');
        try {
            const res = await fetch('/api/tts/from-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: this.wb.FILE_BASENAME,  // e.g. "ralphleonyatesdocumentsfull"
                    source: source,
                    voice: settings.voice,
                    speed: settings.speed,
                    format: settings.format
                })
            });
            // ... handle download (same as existing zip download logic)
        }
    } else {
        // Existing workbench narration path (unchanged)
        const items = this.buildNarrationItems();
        // ... existing batch logic
    }
}
```

### Step 4 (Optional): Persist audio

Save generated audio under `web/html/processed/audio/{basename}/` for replay without regeneration. Add a small audio player per file in the Source or Export tab.

---

## File Inventory

| File | What it does | Lines of interest |
|------|-------------|-------------------|
| `tools/tts_worker.py` | TTSWorker class, 23 voices, synthesize/batch/buffer | Full file (205 lines) |
| `tools/ocr_server.py` | Flask server, 4 TTS endpoints | Import: ~101, Endpoints: 1663-1760 |
| `web/html/tools/workbench/workbench.html` | Audio export panel in Export tab | `#audio-export-panel` |
| `web/html/assets/js/workbench.js` | ExportTab TTS methods | Line ~1846-1990 |
| `web/html/tools/workbench/workbench.css` | TTS panel styles | `.audio-export-panel`, `.tts-preview`, `.tts-status` |
| `tools/ocr-gui/transcription_worker.py` | Whisper transcription (produces .txt/.vtt/.transcript.json) | Full file (322 lines) |

## Dependencies (already installed)

```
kokoro==0.3.5
misaki==0.6.7
soundfile
spacy
loguru
transformers
openai-whisper
```

## Key Constraints

- `kokoro==0.3.5` + `misaki==0.6.7` — newer versions have bugs, do not upgrade
- KPipeline lazy-loads on first call (~2s), subsequent calls <0.3s per passage
- Long texts (>5000 chars) should be chunked into paragraphs for batch synthesis
- Voice prefix determines language: `a*` = American English, `b*` = British English
- Audio output is always 24kHz mono
- Never modify global components (header.html, bottom-nav.html) per CLAUDE.md rules
