"""
transcription_worker.py — Background audio/video transcription using OpenAI Whisper.

Modeled on ocr_worker.py. Same class structure, callbacks, cancel pattern.

Supported formats:
- Audio: MP3, WAV, M4A, FLAC, OGG, WMA
- Video: MP4, WEBM, MOV, MKV, AVI (extracts audio via ffmpeg)

Outputs:
- {base}.txt — plain transcript (consumed by metadata parser + classifier)
- {base}.vtt — WebVTT for playback sync
- {base}.transcript.json — structured segments with timestamps
"""

import os
import json
import subprocess
import threading
import time
from pathlib import Path
from typing import Callable, Optional

# Check for whisper availability
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".wma"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".mkv", ".avi"}
MEDIA_EXTENSIONS = AUDIO_EXTENSIONS | VIDEO_EXTENSIONS

WHISPER_MODELS = ["tiny", "base", "small", "medium", "large"]


class TranscriptionWorker:
    """Handles audio/video transcription in a background thread using Whisper."""

    def __init__(
        self,
        model_size: str = "base",
        language: Optional[str] = None,
        output_dir: str = ".",
        output_txt: bool = True,
        output_vtt: bool = True,
        output_json: bool = True,
        on_progress: Optional[Callable] = None,
        on_complete: Optional[Callable] = None,
        on_log: Optional[Callable[[str], None]] = None,
    ):
        self.model_size = model_size if model_size in WHISPER_MODELS else "base"
        self.language = language
        self.output_dir = output_dir
        self.output_txt = output_txt
        self.output_vtt = output_vtt
        self.output_json = output_json

        self.on_progress = on_progress
        self.on_complete = on_complete
        self.on_log = on_log

        self._cancel_flag = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._model = None

    def log(self, message: str):
        if self.on_log:
            self.on_log(message)

    def cancel(self):
        self._cancel_flag.set()

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    # ========================================================================
    # SINGLE FILE PROCESSING (Used by web server)
    # ========================================================================

    def process_file(self, filepath: str, on_progress=None, on_complete=None):
        """Process a single audio/video file directly (blocking)."""
        if on_progress:
            self.on_progress = on_progress
        if on_complete:
            self.on_complete = on_complete

        try:
            success, msg = self._process(filepath)
            if self.on_complete:
                self.on_complete(success, msg)
        except Exception as e:
            if self.on_complete:
                self.on_complete(False, str(e))

    # ========================================================================
    # CORE PROCESSING
    # ========================================================================

    def _process(self, filepath: str) -> tuple:
        """Run transcription pipeline on a single file."""
        if not WHISPER_AVAILABLE:
            return False, "Whisper not installed. Run: pip install openai-whisper"

        filename = os.path.basename(filepath)
        base_name = os.path.splitext(filename)[0]
        ext = os.path.splitext(filepath)[1].lower()

        if ext not in MEDIA_EXTENSIONS:
            return False, f"Unsupported file type: {ext}"

        self.log(f"Starting transcription: {filename}")

        # Step 1: Extract audio from video if needed
        audio_path = filepath
        is_video = ext in VIDEO_EXTENSIONS
        temp_wav = None

        if is_video:
            self._update_progress(5, f"Extracting audio from video: {filename}")
            temp_wav = os.path.join(self.output_dir, f"{base_name}_temp.wav")
            success, msg = self._extract_audio(filepath, temp_wav)
            if not success:
                return False, msg
            audio_path = temp_wav

        if self._cancel_flag.is_set():
            self._cleanup_temp(temp_wav)
            return False, "Cancelled"

        # Step 2: Load Whisper model
        self._update_progress(15, f"Loading Whisper model: {self.model_size}")
        try:
            if self._model is None:
                self._model = whisper.load_model(self.model_size)
        except Exception as e:
            self._cleanup_temp(temp_wav)
            return False, f"Failed to load Whisper model: {e}"

        if self._cancel_flag.is_set():
            self._cleanup_temp(temp_wav)
            return False, "Cancelled"

        # Step 3: Transcribe
        self._update_progress(25, f"Transcribing: {filename} (this may take a while)")
        try:
            options = {}
            if self.language:
                options["language"] = self.language
            result = self._model.transcribe(audio_path, **options)
        except Exception as e:
            self._cleanup_temp(temp_wav)
            return False, f"Transcription failed: {e}"

        if self._cancel_flag.is_set():
            self._cleanup_temp(temp_wav)
            return False, "Cancelled"

        self._update_progress(80, "Writing output files...")

        segments = result.get("segments", [])
        language = result.get("language", self.language or "unknown")

        # Calculate duration from last segment
        duration = 0.0
        if segments:
            duration = segments[-1].get("end", 0.0)

        meta = {
            "version": "1.0",
            "filename": filename,
            "media_type": "video" if is_video else "audio",
            "duration": round(duration, 2),
            "language": language,
            "model": self.model_size,
        }

        os.makedirs(self.output_dir, exist_ok=True)

        # Step 4: Write outputs
        if self.output_txt:
            txt_path = os.path.join(self.output_dir, f"{base_name}.txt")
            self._write_txt(segments, txt_path)
            self.log(f"  Saved: {base_name}.txt")

        if self.output_vtt:
            vtt_path = os.path.join(self.output_dir, f"{base_name}.vtt")
            self._write_vtt(segments, vtt_path)
            self.log(f"  Saved: {base_name}.vtt")

        if self.output_json:
            json_path = os.path.join(self.output_dir, f"{base_name}.transcript.json")
            self._write_json(segments, meta, json_path)
            self.log(f"  Saved: {base_name}.transcript.json")

        # Cleanup temp audio
        self._cleanup_temp(temp_wav)

        self._update_progress(100, "Transcription complete")
        self.log(f"Transcription complete: {filename} ({len(segments)} segments, {self._format_duration(duration)})")
        return True, "Complete"

    # ========================================================================
    # AUDIO EXTRACTION
    # ========================================================================

    def _extract_audio(self, video_path: str, output_wav: str) -> tuple:
        """Extract audio from video using ffmpeg."""
        try:
            cmd = [
                "ffmpeg", "-i", video_path,
                "-vn",                    # no video
                "-acodec", "pcm_s16le",   # 16-bit PCM WAV
                "-ar", "16000",           # 16kHz (Whisper's native rate)
                "-ac", "1",               # mono
                "-y",                     # overwrite
                output_wav
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            if result.returncode != 0:
                return False, f"ffmpeg failed: {result.stderr[:500]}"
            if not os.path.exists(output_wav):
                return False, "ffmpeg produced no output file"
            self.log(f"  Audio extracted: {os.path.basename(output_wav)}")
            return True, "OK"
        except FileNotFoundError:
            return False, "ffmpeg not found. Install ffmpeg and ensure it's on PATH."
        except subprocess.TimeoutExpired:
            return False, "Audio extraction timed out (>5 min)"
        except Exception as e:
            return False, f"Audio extraction error: {e}"

    # ========================================================================
    # OUTPUT WRITERS
    # ========================================================================

    def _write_txt(self, segments: list, path: str):
        """Write plain text transcript with segment delimiters."""
        with open(path, "w", encoding="utf-8") as f:
            for seg in segments:
                text = seg.get("text", "").strip()
                if text:
                    f.write(text + "\n")

    def _write_vtt(self, segments: list, path: str):
        """Write WebVTT subtitle file."""
        with open(path, "w", encoding="utf-8") as f:
            f.write("WEBVTT\n\n")
            for i, seg in enumerate(segments):
                start = self._format_vtt_time(seg.get("start", 0))
                end = self._format_vtt_time(seg.get("end", 0))
                text = seg.get("text", "").strip()
                if text:
                    f.write(f"{i + 1}\n")
                    f.write(f"{start} --> {end}\n")
                    f.write(f"{text}\n\n")

    def _write_json(self, segments: list, meta: dict, path: str):
        """Write structured transcript JSON."""
        output = {
            **meta,
            "segments": [
                {
                    "id": i,
                    "start": round(seg.get("start", 0), 2),
                    "end": round(seg.get("end", 0), 2),
                    "text": seg.get("text", "").strip(),
                    "confidence": round(seg.get("avg_logprob", 0) * -1, 3) if "avg_logprob" in seg else None,
                }
                for i, seg in enumerate(segments)
            ]
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

    # ========================================================================
    # HELPERS
    # ========================================================================

    def _update_progress(self, pct: int, msg: str):
        """Send progress update via callback."""
        if self.on_progress:
            try:
                self.on_progress(pct, msg)
            except TypeError:
                pass

    def _cleanup_temp(self, path: Optional[str]):
        """Remove temporary file if it exists."""
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

    @staticmethod
    def _format_vtt_time(seconds: float) -> str:
        """Format seconds as HH:MM:SS.mmm for WebVTT."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"

    @staticmethod
    def _format_duration(seconds: float) -> str:
        """Format duration as human-readable string."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        if hours > 0:
            return f"{hours}h {minutes}m {secs}s"
        elif minutes > 0:
            return f"{minutes}m {secs}s"
        else:
            return f"{secs}s"
