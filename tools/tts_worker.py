"""
tts_worker.py — Text-to-speech synthesis using Kokoro TTS.

Modeled on transcription_worker.py. Wraps Kokoro KPipeline for local,
CPU-friendly speech synthesis (82M params, <0.3s per passage, Apache 2.0).

Outputs: WAV or MP3 audio files at 24kHz sample rate.
"""

import io
import os
import zipfile
from typing import List, Optional

import numpy as np

# Check for Kokoro availability
try:
    from kokoro import KPipeline
    KOKORO_AVAILABLE = True
except ImportError:
    KOKORO_AVAILABLE = False

# Check for soundfile availability
try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    SOUNDFILE_AVAILABLE = False

SAMPLE_RATE = 24000

# Kokoro voices — subset of most useful ones for document narration
VOICES = [
    # American Female
    {"id": "af_heart", "label": "Heart (American Female)", "lang": "a"},
    {"id": "af_alloy", "label": "Alloy (American Female)", "lang": "a"},
    {"id": "af_aoede", "label": "Aoede (American Female)", "lang": "a"},
    {"id": "af_bella", "label": "Bella (American Female)", "lang": "a"},
    {"id": "af_jessica", "label": "Jessica (American Female)", "lang": "a"},
    {"id": "af_kore", "label": "Kore (American Female)", "lang": "a"},
    {"id": "af_nicole", "label": "Nicole (American Female)", "lang": "a"},
    {"id": "af_nova", "label": "Nova (American Female)", "lang": "a"},
    {"id": "af_river", "label": "River (American Female)", "lang": "a"},
    {"id": "af_sarah", "label": "Sarah (American Female)", "lang": "a"},
    {"id": "af_sky", "label": "Sky (American Female)", "lang": "a"},
    # American Male
    {"id": "am_adam", "label": "Adam (American Male)", "lang": "a"},
    {"id": "am_echo", "label": "Echo (American Male)", "lang": "a"},
    {"id": "am_eric", "label": "Eric (American Male)", "lang": "a"},
    {"id": "am_liam", "label": "Liam (American Male)", "lang": "a"},
    {"id": "am_michael", "label": "Michael (American Male)", "lang": "a"},
    {"id": "am_onyx", "label": "Onyx (American Male)", "lang": "a"},
    # British Female
    {"id": "bf_emma", "label": "Emma (British Female)", "lang": "b"},
    {"id": "bf_isabella", "label": "Isabella (British Female)", "lang": "b"},
    # British Male
    {"id": "bm_daniel", "label": "Daniel (British Male)", "lang": "b"},
    {"id": "bm_george", "label": "George (British Male)", "lang": "b"},
    {"id": "bm_lewis", "label": "Lewis (British Male)", "lang": "b"},
    {"id": "bm_fable", "label": "Fable (British Male)", "lang": "b"},
]


class TTSWorker:
    """Handles text-to-speech synthesis using Kokoro TTS pipeline."""

    def __init__(self, voice: str = "af_heart", speed: float = 1.0, lang: str = "a"):
        self.voice = voice
        self.speed = speed
        self.lang = lang
        self._pipeline = None

    def _get_pipeline(self):
        """Lazy-load the Kokoro pipeline on first use."""
        if self._pipeline is None:
            if not KOKORO_AVAILABLE:
                raise RuntimeError("Kokoro not installed. Run: pip install kokoro")
            self._pipeline = KPipeline(lang_code=self.lang)
        return self._pipeline

    def synthesize(self, text: str, voice: Optional[str] = None, speed: Optional[float] = None) -> np.ndarray:
        """Synthesize text to numpy audio array (24kHz).

        Args:
            text: Text to synthesize.
            voice: Override voice ID (default: self.voice).
            speed: Override speed (default: self.speed).

        Returns:
            numpy array of audio samples at 24kHz.
        """
        pipeline = self._get_pipeline()
        v = voice or self.voice
        s = speed or self.speed

        # Kokoro yields results per chunk — concatenate all
        chunks = []
        for result in pipeline(text, voice=v, speed=s):
            if result.audio is not None:
                chunks.append(result.audio)

        if not chunks:
            return np.array([], dtype=np.float32)

        return np.concatenate(chunks)

    def synthesize_to_file(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        format: str = "wav",
    ) -> str:
        """Synthesize text and save to file.

        Args:
            text: Text to synthesize.
            output_path: Output file path.
            voice: Override voice ID.
            speed: Override speed.
            format: "wav" or "mp3".

        Returns:
            Path to the written file.
        """
        audio = self.synthesize(text, voice=voice, speed=speed)
        if len(audio) == 0:
            raise ValueError("No audio generated — text may be empty or unsupported")

        sf.write(output_path, audio, SAMPLE_RATE, format=format.upper())
        return output_path

    def synthesize_to_buffer(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        format: str = "wav",
    ) -> io.BytesIO:
        """Synthesize text and return as in-memory buffer.

        Args:
            text: Text to synthesize.
            voice: Override voice ID.
            speed: Override speed.
            format: "wav" or "mp3".

        Returns:
            BytesIO buffer containing the audio data.
        """
        audio = self.synthesize(text, voice=voice, speed=speed)
        if len(audio) == 0:
            raise ValueError("No audio generated — text may be empty or unsupported")

        buf = io.BytesIO()
        sf.write(buf, audio, SAMPLE_RATE, format=format.upper())
        buf.seek(0)
        return buf

    def synthesize_batch(
        self,
        items: List[dict],
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        format: str = "wav",
    ) -> io.BytesIO:
        """Synthesize multiple items and return as zip archive.

        Args:
            items: List of {"id": str, "text": str, "label": str} dicts.
            voice: Override voice ID.
            speed: Override speed.
            format: "wav" or "mp3".

        Returns:
            BytesIO buffer containing a zip of audio files.
        """
        ext = format.lower()
        zip_buf = io.BytesIO()

        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for item in items:
                text = item.get("text", "").strip()
                label = item.get("label", item.get("id", "untitled"))
                # Sanitize filename
                safe_label = "".join(c if c.isalnum() or c in " -_" else "" for c in label).strip()
                safe_label = safe_label.replace(" ", "-") or "audio"
                filename = f"{safe_label}.{ext}"

                if not text:
                    continue

                audio_buf = self.synthesize_to_buffer(text, voice=voice, speed=speed, format=format)
                zf.writestr(filename, audio_buf.read())

        zip_buf.seek(0)
        return zip_buf

    @staticmethod
    def get_voices() -> List[dict]:
        """Return list of available voices."""
        return VOICES
