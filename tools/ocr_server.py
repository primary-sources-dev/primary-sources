"""
ocr-server.py — Flask-based web server for OCR GUI
Serves frontend from docs/ui/ocr/ and provides REST API for file processing.

Usage:
    python tools/ocr-server.py
    
Then open: http://localhost:5000
"""

import os
import json
import re
import threading
import zipfile
import tarfile
import shutil
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, send_file
from werkzeug.utils import secure_filename

# Ensure ffmpeg is on PATH (winget install location)
FFMPEG_DIR = os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin")
if os.path.isdir(FFMPEG_DIR) and FFMPEG_DIR not in os.environ.get("PATH", ""):
    os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

# Paths
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TOOLS_DIR)
# NEW: Base directory for the reconstructed UI
NEW_UI_ROOT = os.path.join(PROJECT_ROOT, "web", "html")
UI_DIR = os.path.join(NEW_UI_ROOT, "tools", "ocr") # Directory for OCR tool files

# Import OCR worker and metadata parser from ocr-gui
import sys
sys.path.insert(0, os.path.join(TOOLS_DIR, "ocr-gui"))
try:
    from ocr_worker import OCRWorker
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: ocr_worker not available, using placeholder processing")

try:
    from transcription_worker import TranscriptionWorker, WHISPER_AVAILABLE, MEDIA_EXTENSIONS, AUDIO_EXTENSIONS, VIDEO_EXTENSIONS, WHISPER_MODELS
except ImportError:
    WHISPER_AVAILABLE = False
    MEDIA_EXTENSIONS = set()
    AUDIO_EXTENSIONS = set()
    VIDEO_EXTENSIONS = set()
    WHISPER_MODELS = []
    print("Warning: transcription_worker not available")

try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    YTDLP_AVAILABLE = False
    print("Warning: yt-dlp not available, YouTube downloads disabled")

try:
    from metadata_parser import MetadataParser, parse_metadata
    PARSER_AVAILABLE = True
except ImportError:
    PARSER_AVAILABLE = False
    print("Warning: metadata_parser not available")

try:
    from document_classifier import classify_document, classify, get_all_scores, get_agency
    from zone_extractor import extract_document, extract
    CLASSIFIER_AVAILABLE = True
except ImportError:
    CLASSIFIER_AVAILABLE = False
    print("Warning: document_classifier/zone_extractor not available")

try:
    from citation_generator import generate_citation, generate_all_citations, CitationFormat
    CITATION_AVAILABLE = True
except ImportError:
    CITATION_AVAILABLE = False
    print("Warning: citation_generator not available")

try:
    from inflation import convert_detailed, get_multiplier, get_available_years
    INFLATION_AVAILABLE = True
except ImportError:
    INFLATION_AVAILABLE = False
    print("Warning: inflation module not available")

try:
    from entity_linker import EntityLinker
    LINKER_AVAILABLE = True
except ImportError:
    LINKER_AVAILABLE = False
    print("Warning: entity_linker not available")

# TTS worker (Kokoro)
sys.path.insert(0, TOOLS_DIR)
try:
    from tts_worker import TTSWorker, KOKORO_AVAILABLE, VOICES as TTS_VOICES
except ImportError:
    KOKORO_AVAILABLE = False
    TTS_VOICES = []
    print("Warning: tts_worker not available")

# Initialize global engines
DATA_DIR = Path(NEW_UI_ROOT) / "assets" / "data"
linker = EntityLinker(DATA_DIR) if LINKER_AVAILABLE else None

try:
    from entity_matcher import EntityMatcher, EntityIndex, find_entities, generate_entities_json
    ENTITY_MATCHER_AVAILABLE = True
    # Initialize matcher with real entity data from JSON files
    _entity_matcher = EntityMatcher()
    _entity_data_dir = str(DATA_DIR)
    _loaded = _entity_matcher.load_from_entity_files(_entity_data_dir)
    if _loaded == 0:
        print("Warning: No entities loaded from JSON files, falling back to sample data")
        _entity_matcher.load_sample_data()
    else:
        print(f"Entity matcher loaded {_loaded} entities from JSON files")
except ImportError:
    ENTITY_MATCHER_AVAILABLE = False
    _entity_matcher = None
    print("Warning: entity_matcher module not available")

# Flask app serving from docs/ui/ocr/
# Note: static_url_path="/static" avoids conflict with API routes
app = Flask(__name__, 
            template_folder=UI_DIR, 
            static_folder=UI_DIR, 
            static_url_path="/static")

# Configuration
UPLOAD_FOLDER = os.path.join(NEW_UI_ROOT, "processed")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
AUDIO_EXTS = {"mp3", "wav", "m4a", "flac", "ogg", "wma"}
VIDEO_EXTS = {"mp4", "webm", "mov", "mkv", "avi"}
MEDIA_EXTS = AUDIO_EXTS | VIDEO_EXTS
TEXT_EXTS = {"txt", "md", "rtf", "csv"}
SUBTITLE_EXTS = {"vtt", "srt"}
DOCX_EXTS = {"docx", "doc"}
EMAIL_EXTS = {"eml", "mbox"}
PASSTHROUGH_EXTS = TEXT_EXTS | SUBTITLE_EXTS | DOCX_EXTS | EMAIL_EXTS
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "tiff", "webp", "heic", "heif", "zip", "tar", "gz", "tgz", "bz2"} | MEDIA_EXTS | PASSTHROUGH_EXTS
ARCHIVE_EXTENSIONS = {"zip", "tar", "gz", "tgz", "bz2"}
IMAGE_PDF_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "tiff", "webp", "heic", "heif"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global state
processing_jobs = {}  # job_id -> {status, files, progress, worker}
job_counter = 0


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def is_archive(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in ARCHIVE_EXTENSIONS

def is_processrable(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in IMAGE_PDF_EXTENSIONS or ext in MEDIA_EXTS

def is_text_file(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in TEXT_EXTS

def is_subtitle(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in SUBTITLE_EXTS

def is_docx(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in DOCX_EXTS

def is_email_file(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in EMAIL_EXTS


def _parse_subtitles(raw, ext):
    """Parse VTT or SRT subtitle text into Whisper-compatible segments."""
    import re
    segments = []
    if ext == "vtt":
        # Strip WebVTT header
        raw = re.sub(r"^WEBVTT.*?\n\n", "", raw, flags=re.DOTALL)
    # Split into cue blocks (works for both VTT and SRT)
    blocks = re.split(r"\n\n+", raw.strip())
    ts_pattern = re.compile(r"(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})")
    for block in blocks:
        lines = block.strip().split("\n")
        ts_match = None
        text_lines = []
        for line in lines:
            m = ts_pattern.search(line)
            if m:
                ts_match = m
            elif ts_match and line.strip() and not line.strip().isdigit():
                text_lines.append(re.sub(r"<[^>]+>", "", line.strip()))
        if ts_match and text_lines:
            def _ts_to_sec(ts):
                ts = ts.replace(",", ".")
                parts = ts.split(":")
                if len(parts) == 3:
                    return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                return float(parts[0]) * 60 + float(parts[1])
            segments.append({
                "start": _ts_to_sec(ts_match.group(1)),
                "end": _ts_to_sec(ts_match.group(2)),
                "text": " ".join(text_lines),
            })
    return segments


def is_media(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in MEDIA_EXTS

def is_audio(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in AUDIO_EXTS

def is_video(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in VIDEO_EXTS


# ============================================================================
# ROUTES - Static Files
# ============================================================================

@app.route("/")
def index():
    """Serve the main landing page from web/html/index.html."""
    return send_from_directory(NEW_UI_ROOT, "index.html")


@app.route("/assets/<path:path>")
def serve_assets(path):
    """Serve global assets (CSS, JS, images)."""
    return send_from_directory(os.path.join(NEW_UI_ROOT, "assets"), path)


@app.route("/components/<path:path>")
def serve_components(path):
    """Serve modular HTML components."""
    return send_from_directory(os.path.join(NEW_UI_ROOT, "components"), path)


@app.route("/ocr-components.css")
def serve_ocr_css():
    """Serve OCR-specific CSS file."""
    return send_from_directory(UI_DIR, "ocr-components.css")


@app.route("/ocr-gui.js")
def serve_js():
    """Serve local JS file."""
    return send_from_directory(UI_DIR, "ocr-gui.js")


# API ROUTES FOLLOW...


# ============================================================================
# ROUTES - API
# ============================================================================

@app.route("/api/config", methods=["GET"])
def get_config():
    """Return default configuration and output directory."""
    return jsonify({
        "output_dir": UPLOAD_FOLDER,
        "backends": ["wsl", "python"],
        "default_backend": "wsl",
        "ocr_available": OCR_AVAILABLE,
        "whisper_available": WHISPER_AVAILABLE,
        "whisper_models": WHISPER_MODELS if WHISPER_AVAILABLE else [],
        "ytdlp_available": YTDLP_AVAILABLE,
        "tts_available": KOKORO_AVAILABLE,
        "tts_voices": TTS_VOICES if KOKORO_AVAILABLE else [],
    })


@app.route("/api/download", methods=["POST"])
def download_url():
    """
    Download audio from a URL (YouTube, etc.) using yt-dlp.
    Saves to processed/uploads/ as .mp3 and returns file info for queue injection.

    Request JSON: { "url": "https://youtube.com/watch?v=..." }
    Response:     { "success": true, "file": { "name": "...", "size": ..., "path": "..." } }
    """
    if not YTDLP_AVAILABLE:
        return jsonify({"error": "yt-dlp not installed. Run: pip install yt-dlp"}), 503

    data = request.get_json()
    if not data or not data.get("url"):
        return jsonify({"error": "No URL provided"}), 400

    url = data["url"].strip()

    # Basic URL validation
    if not url.startswith(("http://", "https://")):
        return jsonify({"error": "Invalid URL. Paste a link starting with https://"}), 400

    upload_dir = os.path.join(app.config["UPLOAD_FOLDER"], "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    try:
        # First extract info to get the title
        with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "cookiesfrombrowser": ("edge",), "extractor_args": {"youtube": {"player_client": ["web"]}}}) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get("title", "download")

        # Sanitize title for filename
        safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in title).strip()[:80]
        if not safe_title:
            safe_title = "download"

        output_template = os.path.join(upload_dir, f"{safe_title}.%(ext)s")

        # Download audio only as mp3
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": output_template,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "quiet": True,
            "no_warnings": True,
            "cookiesfrombrowser": ("edge",),
            "extractor_args": {"youtube": {"player_client": ["web"]}},
            "http_headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"},
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the downloaded file
        mp3_path = os.path.join(upload_dir, f"{safe_title}.mp3")
        if not os.path.exists(mp3_path):
            return jsonify({"error": "Download completed but output file not found"}), 500

        file_size = os.path.getsize(mp3_path)
        filename = f"{safe_title}.mp3"

        return jsonify({
            "success": True,
            "file": {
                "name": filename,
                "size": file_size,
                "path": mp3_path,
                "title": title,
                "url": url,
            }
        })

    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500


@app.route("/api/download/file/<filename>", methods=["GET"])
def serve_downloaded_file(filename):
    """Serve a downloaded file from processed/uploads/ for queue injection."""
    safe_name = os.path.basename(filename)
    upload_dir = os.path.join(app.config["UPLOAD_FOLDER"], "uploads")
    file_path = os.path.join(upload_dir, safe_name)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(upload_dir, safe_name)


@app.route("/api/jobs", methods=["POST"])
def create_job():
    """Create a new OCR processing job."""
    global job_counter
    
    files = request.files.getlist("files")
    backend = request.form.get("backend", "wsl")
    output_pdf = request.form.get("output_pdf", "true") == "true"
    output_txt = request.form.get("output_txt", "true") == "true"
    output_md = request.form.get("output_md", "false") == "true"
    output_html = request.form.get("output_html", "false") == "true"
    output_json = request.form.get("output_json", "true") == "true"
    deskew = request.form.get("deskew", "true") == "true"
    clean = request.form.get("clean", "true") == "true"
    force_ocr = request.form.get("force_ocr", "false") == "true"
    whisper_model = request.form.get("whisper_model", "base")
    whisper_language = request.form.get("whisper_language", "") or None

    if not files:
        return jsonify({"error": "No files provided"}), 400
    
    # Validate files
    for file in files:
        if not allowed_file(file.filename):
            return jsonify({"error": f"Invalid file type: {file.filename}"}), 400
    
    # Save uploaded files and handle archives
    saved_files = []
    upload_dir = os.path.join(app.config["UPLOAD_FOLDER"], "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    for file in files:
        filename = secure_filename(file.filename)
        temp_path = os.path.join(upload_dir, filename)
        file.save(temp_path)
        file_size = os.path.getsize(temp_path)

        if is_archive(filename):
            # Extract archive
            extract_dir = os.path.join(upload_dir, f"ext_{filename}_{job_counter + 1}")
            os.makedirs(extract_dir, exist_ok=True)
            
            try:
                if filename.endswith(".zip"):
                    with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                        zip_ref.extractall(extract_dir)
                elif filename.endswith((".tar", ".tar.gz", ".tgz", ".tar.bz2", ".bz2", ".gz")):
                    mode = "r:*" if not filename.endswith(".bz2") and not filename.endswith(".gz") else "r:gz" if filename.endswith((".gz", ".tgz")) else "r:bz2"
                    with tarfile.open(temp_path, mode) as tar_ref:
                        tar_ref.extractall(extract_dir)
                
                # Walk extracted files
                for root, _, walk_files in os.walk(extract_dir):
                    for f in walk_files:
                        if is_processrable(f):
                            extracted_filepath = os.path.join(root, f)
                            rel_filename = os.path.relpath(extracted_filepath, extract_dir).replace(os.sep, "_")
                            final_filename = f"{filename}_{rel_filename}"
                            final_path = os.path.join(upload_dir, final_filename)
                            shutil.move(extracted_filepath, final_path)
                            
                            saved_files.append({
                                "name": final_filename,
                                "size": os.path.getsize(final_path),
                                "path": final_path,
                                "status": "pending"
                            })
                # Clean up extraction dir and archive
                shutil.rmtree(extract_dir)
                os.remove(temp_path)
            except Exception as e:
                print(f"Error processing archive {filename}: {e}")
                # Fallback: keep archive or skip? For now skip and log.
        else:
            saved_files.append({
                "name": filename,
                "size": file_size,
                "path": temp_path,
                "status": "pending"
            })
    
    # Create job
    job_counter += 1
    job_id = f"job_{job_counter}"
    
    processing_jobs[job_id] = {
        "id": job_id,
        "status": "queued",
        "files": saved_files,
        "progress": 0,
        "log": [],
        "backend": backend,
        "options": {
            "output_pdf": output_pdf,
            "output_txt": output_txt,
            "output_md": output_md,
            "output_html": output_html,
            "output_json": output_json,
            "deskew": deskew,
            "clean": clean,
            "force_ocr": force_ocr,
            "whisper_model": whisper_model,
            "whisper_language": whisper_language,
        },
    }
    
    return jsonify(processing_jobs[job_id]), 201


@app.route("/api/jobs/<job_id>", methods=["GET"])
def get_job(job_id):
    """Get job status and progress."""
    if job_id not in processing_jobs:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(processing_jobs[job_id])


@app.route("/api/jobs/<job_id>/start", methods=["POST"])
def start_job(job_id):
    """Start processing a job."""
    if job_id not in processing_jobs:
        return jsonify({"error": "Job not found"}), 404
    
    job = processing_jobs[job_id]
    job["status"] = "processing"
    job["log"].append("OCR processing started...")
    
    # Start processing in background thread
    thread = threading.Thread(target=process_job_worker, args=(job_id,))
    thread.daemon = True
    thread.start()
    
    return jsonify(job)


def process_job_worker(job_id):
    """Background worker to process OCR job."""
    job = processing_jobs[job_id]
    
    try:
        job["log"].append(f"Using backend: {job['backend']}")
        
        total_files = len(job["files"])
        for i, file_info in enumerate(job["files"]):
            file_info["status"] = "processing"
            file_info["progress"] = 0
            job["log"].append(f"Processing: {file_info['name']}")
            job["progress"] = int((i / total_files) * 100)
            
            def on_progress(pct, msg):
                job["log"].append(msg)
                file_info["progress"] = pct
                file_info["current_msg"] = msg
                job["progress"] = int((i / total_files) * 100 + (pct / total_files))

            def on_complete(success, msg):
                if success:
                    file_info["status"] = "completed"
                    file_info["progress"] = 100
                    job["log"].append(f"✓ {file_info['name']} completed")
                else:
                    file_info["status"] = "failed"
                    file_info["progress"] = 0
                    job["log"].append(f"✗ {file_info['name']} failed: {msg}")

            if is_text_file(file_info["name"]):
                # Plain text passthrough — no OCR needed
                on_progress(10, "Reading text file...")
                try:
                    with open(file_info["path"], "r", encoding="utf-8", errors="replace") as f:
                        text = f.read()
                    basename = os.path.splitext(os.path.basename(file_info["name"]))[0]
                    # Write .txt
                    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
                    with open(txt_path, "w", encoding="utf-8") as f:
                        f.write(text)
                    on_progress(50, "Generating sidecar...")
                    # Write .ocr.json sidecar (single page)
                    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
                    ocr_json = {"pages": [{"page": i + 1, "text": p} for i, p in enumerate(paragraphs)] or [{"page": 1, "text": text}]}
                    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
                    import json as _json
                    with open(json_path, "w", encoding="utf-8") as f:
                        _json.dump(ocr_json, f, indent=2)
                    on_progress(100, "Text file imported")
                    on_complete(True, "Text imported")
                except Exception as e:
                    on_complete(False, str(e))

            elif is_subtitle(file_info["name"]):
                # VTT/SRT subtitle import — convert to transcript format
                on_progress(10, "Parsing subtitle file...")
                try:
                    with open(file_info["path"], "r", encoding="utf-8", errors="replace") as f:
                        raw = f.read()
                    basename = os.path.splitext(os.path.basename(file_info["name"]))[0]
                    ext = file_info["name"].rsplit(".", 1)[1].lower()
                    segments = _parse_subtitles(raw, ext)
                    full_text = " ".join(seg["text"] for seg in segments)
                    on_progress(50, "Writing transcript...")
                    # Write .txt
                    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
                    with open(txt_path, "w", encoding="utf-8") as f:
                        f.write(full_text)
                    # Write .transcript.json (same shape as Whisper)
                    import json as _json
                    tj = {"text": full_text, "segments": segments}
                    tj_path = os.path.join(UPLOAD_FOLDER, basename + ".transcript.json")
                    with open(tj_path, "w", encoding="utf-8") as f:
                        _json.dump(tj, f, indent=2)
                    # Write .ocr.json sidecar
                    ocr_json = {"pages": [{"page": i + 1, "text": seg["text"]} for i, seg in enumerate(segments)]}
                    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
                    with open(json_path, "w", encoding="utf-8") as f:
                        _json.dump(ocr_json, f, indent=2)
                    on_progress(100, "Subtitle imported")
                    on_complete(True, f"Imported {len(segments)} segments")
                except Exception as e:
                    on_complete(False, str(e))

            elif is_docx(file_info["name"]):
                # Word document import
                on_progress(10, "Extracting document text...")
                try:
                    from docx import Document as DocxDocument
                    doc = DocxDocument(file_info["path"])
                    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                    full_text = "\n\n".join(paragraphs)
                    basename = os.path.splitext(os.path.basename(file_info["name"]))[0]
                    on_progress(50, "Writing output...")
                    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
                    with open(txt_path, "w", encoding="utf-8") as f:
                        f.write(full_text)
                    import json as _json
                    ocr_json = {"pages": [{"page": i + 1, "text": p} for i, p in enumerate(paragraphs)]}
                    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
                    with open(json_path, "w", encoding="utf-8") as f:
                        _json.dump(ocr_json, f, indent=2)
                    on_progress(100, "Document imported")
                    on_complete(True, f"Imported {len(paragraphs)} paragraphs")
                except ImportError:
                    on_complete(False, "python-docx not installed. Run: pip install python-docx")
                except Exception as e:
                    on_complete(False, str(e))

            elif is_email_file(file_info["name"]):
                # Email (.eml/.mbox) import
                on_progress(10, "Parsing email...")
                try:
                    import email
                    from email import policy
                    with open(file_info["path"], "rb") as f:
                        msg = email.message_from_binary_file(f, policy=policy.default)
                    subject = msg.get("Subject", "(no subject)")
                    from_addr = msg.get("From", "")
                    to_addr = msg.get("To", "")
                    date = msg.get("Date", "")
                    body = msg.get_body(preferencelist=("plain", "html"))
                    body_text = body.get_content() if body else ""
                    if body and body.get_content_type() == "text/html":
                        import re
                        body_text = re.sub(r"<[^>]+>", " ", body_text)
                        body_text = re.sub(r"\s+", " ", body_text).strip()
                    header_block = f"From: {from_addr}\nTo: {to_addr}\nDate: {date}\nSubject: {subject}\n\n"
                    full_text = header_block + body_text
                    basename = os.path.splitext(os.path.basename(file_info["name"]))[0]
                    on_progress(50, "Writing output...")
                    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
                    with open(txt_path, "w", encoding="utf-8") as f:
                        f.write(full_text)
                    import json as _json
                    ocr_json = {"pages": [
                        {"page": 1, "text": header_block.strip(), "label": "Header"},
                        {"page": 2, "text": body_text, "label": "Body"}
                    ]}
                    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
                    with open(json_path, "w", encoding="utf-8") as f:
                        _json.dump(ocr_json, f, indent=2)
                    on_progress(100, "Email imported")
                    on_complete(True, f"Imported: {subject}")
                except Exception as e:
                    on_complete(False, str(e))

            elif is_media(file_info["name"]) and WHISPER_AVAILABLE:
                # Transcription processing for audio/video
                worker = TranscriptionWorker(
                    model_size=job["options"].get("whisper_model", "base"),
                    language=job["options"].get("whisper_language"),
                    output_dir=UPLOAD_FOLDER,
                    output_txt=True,
                    output_vtt=True,
                    output_json=True,
                )
                worker.process_file(file_info["path"], on_progress, on_complete)

                # Auto-run metadata parser on completed transcripts
                if file_info["status"] == "completed" and PARSER_AVAILABLE:
                    _run_metadata_parser(file_info, job)

            elif OCR_AVAILABLE:
                # Real OCR processing for PDFs/images
                worker = OCRWorker(
                    backend=job["backend"],
                    output_dir=UPLOAD_FOLDER,
                    output_pdf=job["options"]["output_pdf"],
                    output_txt=job["options"]["output_txt"],
                    output_md=job["options"]["output_md"],
                    output_html=job["options"]["output_html"],
                    output_json=job["options"].get("output_json", True),
                    deskew=job["options"]["deskew"],
                    clean=job["options"]["clean"],
                    force_ocr=job["options"]["force_ocr"],
                )
                worker.process_file(file_info["path"], on_progress, on_complete)

                # Auto-run metadata parser on completed files
                if file_info["status"] == "completed" and PARSER_AVAILABLE:
                    _run_metadata_parser(file_info, job)
            else:
                # Placeholder processing
                import time
                time.sleep(1)
                file_info["status"] = "completed"
                job["log"].append(f"✓ {file_info['name']} (placeholder)")
        
        job["progress"] = 100
        job["status"] = "completed"
        job["log"].append("✓ All files processed successfully!")
        
    except Exception as e:
        job["status"] = "failed"
        job["log"].append(f"✗ Error: {str(e)}")


def _run_metadata_parser(file_info: dict, job: dict):
    """
    Auto-run metadata parser on OCR output to extract metadata.
    Results are stored in file_info["parsed_metadata"].
    """
    base_name = os.path.splitext(file_info["name"])[0]
    
    # Try to read the .txt or .md output
    txt_path = os.path.join(UPLOAD_FOLDER, f"{base_name}.txt")
    md_path = os.path.join(UPLOAD_FOLDER, f"{base_name}.md")
    
    ocr_text = None
    for path in [txt_path, md_path]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    ocr_text = f.read()
                break
            except Exception:
                continue
    
    if not ocr_text:
        job["log"].append(f"  → Metadata parser: No text output found")
        return
    
    try:
        result = parse_metadata(ocr_text)
        file_info["parsed_metadata"] = result
        
        # Log extraction summary
        extractions = []
        if result.get("rif_number"):
            extractions.append(f"RIF: {result['rif_number']['value']}")
        if result.get("agency"):
            extractions.append(f"Agency: {result['agency']['value']}")
        if result.get("date_iso"):
            extractions.append(f"Date: {result['date_iso']}")
        if result.get("author"):
            extractions.append(f"Author: {result['author']['value']}")
        
        if extractions:
            job["log"].append(f"  → Metadata parsed: {', '.join(extractions)}")
        else:
            job["log"].append(f"  → Metadata parser: No patterns found")

    except Exception as e:
        job["log"].append(f"  → Metadata parser error: {str(e)}")

    # Auto-classify document type (feeds the badge in ocr-gui.js)
    if CLASSIFIER_AVAILABLE and ocr_text:
        try:
            classification = classify_document(ocr_text)
            agency = get_agency(classification.doc_type)
            if "parsed_metadata" not in file_info:
                file_info["parsed_metadata"] = {}
            file_info["parsed_metadata"]["classified_type"] = classification.doc_type.value
            file_info["parsed_metadata"]["classification_agency"] = agency
            file_info["parsed_metadata"]["classification_confidence"] = round(classification.confidence, 3)
            file_info["parsed_metadata"]["classification_label"] = classification.confidence_label
            job["log"].append(
                f"  → Classified: {classification.doc_type.value} [{agency}] "
                f"({round(classification.confidence * 100)}% {classification.confidence_label})"
            )
        except Exception as e:
            job["log"].append(f"  → Classifier error: {str(e)}")


@app.route("/api/jobs/<job_id>/cancel", methods=["POST"])
def cancel_job(job_id):
    """Cancel a job."""
    if job_id not in processing_jobs:
        return jsonify({"error": "Job not found"}), 404
    
    job = processing_jobs[job_id]
    if job["status"] in ["processing", "queued"]:
        job["status"] = "cancelled"
        job["log"].append("Job cancelled by user")
    
    return jsonify(job)


@app.route("/api/download/<filename>")
def download_file(filename):
    """Serve a processed file. Use ?download=true to force browser download.
    
    Checks multiple locations:
    1. processed/{filename} (OCR output)
    2. processed/{basename}_searchable.pdf (OCR output with suffix)
    3. processed/uploads/{filename} (original uploads / skipped files)
    """
    as_attachment = request.args.get("download", "").lower() == "true"
    safe_name = os.path.basename(filename)
    
    # Check multiple locations
    direct_path = os.path.join(UPLOAD_FOLDER, safe_name)
    uploads_path = os.path.join(UPLOAD_FOLDER, "uploads", safe_name)
    
    # Also try with _searchable suffix
    base_name = safe_name.replace("_searchable.pdf", ".pdf") if "_searchable" in safe_name else safe_name
    searchable_name = base_name.replace(".pdf", "_searchable.pdf")
    searchable_path = os.path.join(UPLOAD_FOLDER, searchable_name)
    
    if os.path.exists(direct_path):
        return send_from_directory(UPLOAD_FOLDER, safe_name, as_attachment=as_attachment)
    elif os.path.exists(searchable_path):
        return send_from_directory(UPLOAD_FOLDER, searchable_name, as_attachment=as_attachment)
    elif os.path.exists(uploads_path):
        return send_from_directory(os.path.join(UPLOAD_FOLDER, "uploads"), safe_name, as_attachment=as_attachment)
    else:
        return jsonify({"error": f"File not found: {safe_name}"}), 404


@app.route("/api/output-dir", methods=["GET", "POST"])
def handle_output_dir():
    """Get or set the output directory."""
    if request.method == "GET":
        return jsonify({"output_dir": UPLOAD_FOLDER})
    
    # For now, just return current directory
    # In production, would validate and set
    new_dir = request.json.get("output_dir")
    return jsonify({"output_dir": UPLOAD_FOLDER})


def enrich_extraction_with_entities(result: dict) -> dict:
    """Enrich document segments and add global linked entities summary."""
    if not (LINKER_AVAILABLE and linker):
        return result
        
    all_entities = []
    seen_ids = set()
    
    # Process segments
    for segment in result.get("segments", []):
        raw_text = segment.get("text", "")
        speaker = segment.get("speaker", "")
        
        # Segment-level linking
        entities = linker.link_entities(raw_text)
        
        # Improvement: Filter out entities that were ONLY found in the speaker's prefix
        # and handle the 'linked_entities' list more efficiently.
        filtered_entities = []
        if speaker and entities:
            speaker_upper = speaker.upper()
            for ent in entities:
                # If match is strictly inside the speaker name part of the segment, ignore
                if ent["matched_text"].upper() in speaker_upper:
                    continue
                filtered_entities.append(ent)
        else:
            filtered_entities = entities

        segment["entities"] = filtered_entities
        
        # Global unique entity tracking (using ID as key for performance/uniqueness)
        for ent in filtered_entities:
            ent_id = ent["id"]
            if ent_id not in seen_ids:
                all_entities.append(ent)
                seen_ids.add(ent_id)
                
    result["linked_entities"] = all_entities
    return result


@app.route("/api/parse-metadata", methods=["POST"])
def parse_metadata_endpoint():
    """
    Parse OCR text to extract archival metadata (header + footer).
    
    Request body (JSON):
        { "text": "OCR text content..." }
        
    Response:
        { "rif_number": {...}, "agency": {...}, "date": {...}, ... }
    """
    if not PARSER_AVAILABLE:
        return jsonify({"error": "Metadata parser not available"}), 503
    
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body"}), 400
    
    text = data["text"]
    if not text or not text.strip():
        return jsonify({"error": "Empty text provided"}), 400
    
    try:
        # Use the newer zone-aware extraction engine
        if CLASSIFIER_AVAILABLE:
            extraction = extract_document(text)
            result = extraction.to_dict()
            
            # Enrich segments with entity links
            result = enrich_extraction_with_entities(result)
            
            # Legacy compatibility mapping for frontend
            # Move fields from the 'fields' dict to top-level if they exist
            if "fields" in result:
                for field_name, field_data in result["fields"].items():
                    result[field_name] = field_data
                    
            return jsonify(result)
        else:
            # Fallback to legacy parser if zone_extractor not available
            result = parse_metadata(text)
            return jsonify(result)
            
    except Exception as e:
        return jsonify({"error": f"Analyze error: {str(e)}"}), 500


@app.route("/api/classify", methods=["POST"])
def classify_endpoint():
    """
    Classify document type by analyzing OCR text fingerprints.
    
    Request body (JSON):
        { "text": "OCR text content..." }
    
    Response:
        {
            "doc_type": "FBI_302",
            "confidence": 0.85,
            "confidence_label": "HIGH",
            "matched_patterns": ["FEDERAL BUREAU OF INVESTIGATION", ...]
        }
    """
    if not CLASSIFIER_AVAILABLE:
        return jsonify({"error": "Document classifier not available"}), 503
    
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body"}), 400
    
    text = data["text"]
    if not text or not text.strip():
        return jsonify({"error": "Empty text provided"}), 400
    
    try:
        result = classify(text)
        # Also include alternative scores
        result["all_scores"] = get_all_scores(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Classification error: {str(e)}"}), 500


@app.route("/api/extract", methods=["POST"])
def extract_endpoint():
    """
    Full document extraction: classify then extract type-specific fields.
    
    Request body (JSON):
        { "text": "OCR text content..." }
    
    Response:
        {
            "doc_type": "FBI_302",
            "doc_type_confidence": 0.85,
            "fields": {
                "subject_name": { "value": "RALPH LEON YATES", "zone": "body", "confidence": 0.85 },
                "file_number": { "value": "DL 89-43", "zone": "header", "confidence": 0.90 },
                ...
            },
            "extraction_notes": [...]
        }
    """
    if not CLASSIFIER_AVAILABLE:
        return jsonify({"error": "Zone extractor not available"}), 503
    
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body"}), 400
    
    text = data["text"]
    if not text or not text.strip():
        return jsonify({"error": "Empty text provided"}), 400
    
    try:
        result = extract(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Extraction error: {str(e)}"}), 500


@app.route("/api/cite", methods=["POST"])
def cite_endpoint():
    """
    Generate academic citations from source metadata.

    Request body (JSON):
        {
            "source": {
                "title": "Document Title",
                "author": "Author Name",
                "published_date": "1963-11-22",
                "source_type": "FBI_302",
                "external_ref": "DL 89-43",
                "archive": "NARA"
            },
            "format": "chicago"  // Optional: chicago, mla, apa, nara (default: all)
        }

    Response:
        If format specified: { "citation": "..." }
        If no format:        { "chicago": "...", "mla": "...", "apa": "...", "nara": "..." }
    """
    if not CITATION_AVAILABLE:
        return jsonify({"error": "Citation generator not available"}), 503

    data = request.get_json()
    if not data or "source" not in data:
        return jsonify({"error": "Missing 'source' field in request body"}), 400

    source = data["source"]
    if not source.get("title"):
        return jsonify({"error": "Source must have a 'title' field"}), 400

    try:
        format_str = data.get("format")
        
        if format_str:
            # Single format requested
            format_map = {
                "chicago": CitationFormat.CHICAGO,
                "mla": CitationFormat.MLA,
                "apa": CitationFormat.APA,
                "nara": CitationFormat.NARA,
            }
            fmt = format_map.get(format_str.lower())
            if not fmt:
                return jsonify({"error": f"Unknown format: {format_str}. Use: chicago, mla, apa, nara"}), 400
            
            citation = generate_citation(source, fmt)
            return jsonify({"citation": citation, "format": format_str.lower()})
        else:
            # Return all formats
            citations = generate_all_citations(source)
            return jsonify(citations)
            
    except Exception as e:
        return jsonify({"error": f"Citation error: {str(e)}"}), 500


@app.route("/api/inflate", methods=["POST"])
def inflate_endpoint():
    """
    Convert historical USD to modern purchasing power.

    Request body (JSON):
        {
            "amount": 25.00,
            "year": 1963,
            "target_year": 2026  // Optional, defaults to 2026
        }

    Response:
        {
            "original_amount": 25.0,
            "original_year": 1963,
            "converted_amount": 264.71,
            "target_year": 2026,
            "multiplier": 10.59,
            "formatted": "$25.00 (1963) = $264.71 (2026)"
        }
    """
    if not INFLATION_AVAILABLE:
        return jsonify({"error": "Inflation converter not available"}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    amount = data.get("amount")
    year = data.get("year")
    target_year = data.get("target_year", 2026)

    if amount is None:
        return jsonify({"error": "Missing 'amount' field"}), 400
    if year is None:
        return jsonify({"error": "Missing 'year' field"}), 400

    try:
        amount = float(amount)
        year = int(year)
        target_year = int(target_year)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount or year format"}), 400

    try:
        result = convert_detailed(amount, year, target_year)
        if result is None:
            min_year, max_year = get_available_years()
            return jsonify({
                "error": f"Year out of range. Available: {min_year}-{max_year}"
            }), 400
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return jsonify({"error": f"Conversion error: {str(e)}"}), 500


@app.route("/api/inflate/multiplier", methods=["GET"])
def inflate_multiplier_endpoint():
    """
    Get inflation multiplier for a year.

    Query params:
        year: Source year (required)
        target: Target year (optional, default 2026)

    Response:
        { "year": 1963, "target": 2026, "multiplier": 10.59 }
    """
    if not INFLATION_AVAILABLE:
        return jsonify({"error": "Inflation converter not available"}), 503

    year = request.args.get("year")
    target = request.args.get("target", 2026)

    if not year:
        return jsonify({"error": "Missing 'year' query parameter"}), 400

    try:
        year = int(year)
        target = int(target)
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    multiplier = get_multiplier(year, target)
    if multiplier is None:
        min_year, max_year = get_available_years()
        return jsonify({
            "error": f"Year out of range. Available: {min_year}-{max_year}"
        }), 400

    return jsonify({
        "year": year,
        "target": target,
        "multiplier": round(multiplier, 2)
    })


@app.route("/api/entities", methods=["POST"])
def entities_endpoint():
    """
    Find known entities in OCR text.

    Request body (JSON):
        {
            "text": "OCR text content...",
            "filename": "document.pdf",  // Optional, for sidecar output
            "include_candidates": true   // Optional, include new entity candidates
        }

    Response:
        {
            "entities": [...],
            "new_candidates": [...],  // If include_candidates=true
            "summary": { "matched": 4, "persons": 2, ... }
        }
    """
    if not ENTITY_MATCHER_AVAILABLE:
        return jsonify({"error": "Entity matcher not available"}), 503

    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body"}), 400

    text = data["text"]
    if not text or not text.strip():
        return jsonify({"error": "Empty text provided"}), 400

    filename = data.get("filename", "document.txt")
    include_candidates = data.get("include_candidates", True)

    try:
        if include_candidates:
            # Full sidecar output with candidates
            result = _entity_matcher.generate_sidecar(text, filename)
        else:
            # Just matched entities
            matches = _entity_matcher.find_matches(text)
            result = {
                "entities": [m.to_dict() for m in matches],
                "summary": {
                    "matched": len(matches),
                    "persons": len([m for m in matches if m.entity_type == "person"]),
                    "places": len([m for m in matches if m.entity_type == "place"]),
                    "orgs": len([m for m in matches if m.entity_type == "org"]),
                }
            }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Entity matching error: {str(e)}"}), 500


@app.route("/api/entities/index", methods=["GET"])
def entities_index_endpoint():
    """
    Get info about the loaded entity index.

    Response:
        {
            "total_entities": 19,
            "loaded_at": "2026-02-23T...",
            "breakdown": { "persons": 5, "aliases": 4, ... }
        }
    """
    if not ENTITY_MATCHER_AVAILABLE:
        return jsonify({"error": "Entity matcher not available"}), 503

    return jsonify({
        "total_entities": _entity_matcher.index.total_count(),
        "loaded_at": _entity_matcher.index.loaded_at,
        "breakdown": {
            "persons": len(_entity_matcher.index.persons),
            "aliases": len(_entity_matcher.index.aliases),
            "places": len(_entity_matcher.index.places),
            "orgs": len(_entity_matcher.index.orgs),
        }
    })


# ============================================================================
# ENTITY EXPORT ENDPOINT
# ============================================================================

@app.route("/api/entities/export", methods=["POST"])
def entities_export_endpoint():
    """
    Write a new entity record to a JSON data file.
    Creates .bak backup before writing. Checks duplicates by ID and name.
    """
    ALLOWED_FILES = {
        "sources.json", "people.json", "organizations.json",
        "places.json", "objects.json", "events.json"
    }

    ID_FIELDS = {
        "sources.json": "source_id",
        "people.json": "person_id",
        "organizations.json": "org_id",
        "places.json": "place_id",
        "objects.json": "object_id",
        "events.json": "event_id",
    }

    NAME_FIELDS = {
        "sources.json": "name",
        "people.json": "display_name",
        "organizations.json": "name",
        "places.json": "name",
        "objects.json": "name",
        "events.json": "title",
    }

    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    target_file = data.get("target_file")
    record = data.get("record")

    if not target_file or target_file not in ALLOWED_FILES:
        return jsonify({"error": f"Invalid target_file. Must be one of: {sorted(ALLOWED_FILES)}"}), 400

    if not record or not isinstance(record, dict):
        return jsonify({"error": "Missing or invalid 'record' field"}), 400

    file_path = os.path.join(str(DATA_DIR), target_file)
    backup_path = file_path + ".bak"

    try:
        # Load existing data
        existing = []
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                existing = json.load(f)

        # Duplicate check by ID or name
        id_field = ID_FIELDS.get(target_file)
        name_field = NAME_FIELDS.get(target_file)

        record_id = record.get(id_field) if id_field else None
        record_name = record.get(name_field, "").lower() if name_field else ""

        for item in existing:
            if record_id and item.get(id_field) == record_id:
                return jsonify({
                    "success": True,
                    "file": target_file,
                    "action": "duplicate_skipped",
                    "reason": f"Record with {id_field}={record_id} already exists"
                })
            if record_name and item.get(name_field, "").lower() == record_name:
                return jsonify({
                    "success": True,
                    "file": target_file,
                    "action": "duplicate_skipped",
                    "reason": f"Record with {name_field}='{record.get(name_field)}' already exists"
                })

        # Create backup
        if os.path.exists(file_path):
            import shutil
            shutil.copy2(file_path, backup_path)

        # Append and write
        existing.append(record)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)

        # Reload entity matcher index if entity data files were updated
        if target_file in ("people.json", "places.json", "organizations.json"):
            if ENTITY_MATCHER_AVAILABLE and _entity_matcher:
                _entity_matcher.index = EntityIndex()
                _entity_matcher.load_from_entity_files(str(DATA_DIR))

        return jsonify({
            "success": True,
            "file": target_file,
            "action": "created",
            "backup": os.path.basename(backup_path)
        })

    except Exception as e:
        return jsonify({"error": f"Export failed: {str(e)}"}), 500


# ============================================================================
# CLASSIFIER REVIEW ENDPOINT
# ============================================================================

@app.route("/api/review/<filename>", methods=["GET"])
def review_endpoint(filename):
    """
    Return per-page/segment classification data for a processed PDF or media file.

    Used by workbench to render a dynamic review UI.
    For media files, reads .transcript.json and classifies each segment.

    URL params:
        filename: Name of the file in the processed/ directory
                  (e.g. "yates-searchable.pdf" or "interview.mp3")

    Response:
        {
            "filename": "yates-searchable.pdf",
            "total_pages": 43,
            "pages": [
                {
                    "page":             1,
                    "page_index":       0,
                    "doc_type":         "FBI_302",
                    "confidence":       0.454,
                    "matched_patterns": ["FEDERAL BUREAU OF INVESTIGATION", ...],
                    "all_scores":       { "FBI_302": 0.454, "TOC": 0.23, ... }
                },
                ...
            ]
        }
    """
    if not CLASSIFIER_AVAILABLE:
        return jsonify({"error": "Document classifier not available"}), 503

    # Only look in the processed/ output folder — never traverse outside it
    safe_name = os.path.basename(filename)
    
    # Check multiple possible locations:
    # 1. Direct output: processed/{filename} (OCR'd files)
    # 2. Uploads subfolder: processed/uploads/{filename} (skipped/original files)
    # 3. With _searchable suffix: processed/{basename}_searchable.pdf
    pdf_path = os.path.join(UPLOAD_FOLDER, safe_name)
    uploads_path = os.path.join(UPLOAD_FOLDER, "uploads", safe_name)
    
    # Also try without _searchable suffix (user might pass original name)
    base_name = safe_name.replace("_searchable.pdf", ".pdf") if "_searchable" in safe_name else safe_name
    searchable_name = base_name.replace(".pdf", "_searchable.pdf")
    searchable_path = os.path.join(UPLOAD_FOLDER, searchable_name)
    
    # Priority: direct path > searchable version > uploads folder
    if os.path.exists(pdf_path):
        pass  # Use pdf_path as-is
    elif os.path.exists(searchable_path):
        pdf_path = searchable_path
    elif os.path.exists(uploads_path):
        pdf_path = uploads_path
    else:
        return jsonify({"error": f"File not found: {safe_name} (checked processed/, processed/uploads/, and _searchable variants)"}), 404

    # Check if this is a media file with a transcript
    ext = os.path.splitext(safe_name)[1].lower()
    if ext in {f".{e}" for e in MEDIA_EXTS}:
        base_name = os.path.splitext(safe_name)[0]
        transcript_path = os.path.join(UPLOAD_FOLDER, f"{base_name}.transcript.json")
        if not os.path.exists(transcript_path):
            return jsonify({"error": f"Transcript not found for {safe_name}. Process the file first."}), 404

        try:
            with open(transcript_path, "r", encoding="utf-8") as f:
                transcript = json.load(f)

            segments = transcript.get("segments", [])
            results = []
            prev_type = "UNKNOWN"

            for seg in segments:
                text = seg.get("text", "").strip()
                if not text:
                    continue

                if CLASSIFIER_AVAILABLE:
                    classification = classify_document(text, prev_type=prev_type)
                    all_scores = get_all_scores(text)
                    prev_type = classification.doc_type.value
                    page_result = classification.to_dict()
                    page_result["all_scores"] = {k: round(v, 4) for k, v in all_scores.items()}
                else:
                    page_result = {
                        "doc_type": "TRANSCRIPT",
                        "confidence": 1.0,
                        "matched_patterns": ["AUDIO_TRANSCRIPT"],
                        "agency": "UNKNOWN",
                        "all_scores": {"TRANSCRIPT": 1.0},
                    }

                page_result.update({
                    "page": seg.get("id", 0) + 1,
                    "page_index": seg.get("id", 0),
                    "text": text[:2000],
                    "segment_start": seg.get("start", 0),
                    "segment_end": seg.get("end", 0),
                    "media_type": transcript.get("media_type", "audio"),
                })
                results.append(page_result)

            return jsonify({
                "filename": safe_name,
                "total_pages": len(results),
                "media_type": transcript.get("media_type", "audio"),
                "duration": transcript.get("duration", 0),
                "pages": results,
            })
        except Exception as e:
            return jsonify({"error": f"Transcript review error: {str(e)}"}), 500

    if not safe_name.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF and media files are supported for review"}), 400

    try:
        import fitz  # PyMuPDF — already used by the OCR stack

        results = []
        doc = fitz.open(pdf_path)
        prev_type = "UNKNOWN"

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()

            classification = classify_document(text, prev_type=prev_type)
            all_scores = get_all_scores(text)

            # Update state for next page
            prev_type = classification.doc_type.value

            page_result = classification.to_dict()
            page_result.update({
                "page":             page_num + 1,
                "page_index":       page_num,
                "text":             text[:2000], # Send first 2k chars for UI sample/display
                "all_scores":       {k: round(v, 4) for k, v in all_scores.items()},
            })
            results.append(page_result)

        doc.close()

        return jsonify({
            "filename":    safe_name,
            "total_pages": len(results),
            "pages":       results,
        })

    except ImportError:
        return jsonify({"error": "PyMuPDF (fitz) not installed. Run: pip install pymupdf"}), 503
    except Exception as e:
        return jsonify({"error": f"Review error: {str(e)}"}), 500


# ============================================================================
# FEEDBACK / TRAINING DATA ENDPOINTS
# ============================================================================

FEEDBACK_FILE = os.path.join(PROJECT_ROOT, "data", "classifier-feedback.json")
FEEDBACK_EXPORT_DIR = os.path.join(PROJECT_ROOT, "data", "feedback-exports")
LEGACY_STATUS_TO_DISPOSITION = {
    "correct": "verified_approved",
    "incorrect": "verified_not_approved",
    "skipped": "needs_followup",
    "pending": "pending",
}
DISPOSITION_TO_LEGACY_STATUS = {
    "verified_approved": "correct",
    "verified_not_approved": "incorrect",
    "needs_followup": "skipped",
    "pending": "pending",
}


def normalize_feedback_status(value: str) -> str:
    """Accept canonical disposition or legacy status; persist legacy status for compatibility."""
    raw = str(value or "").strip().lower()
    if raw in LEGACY_STATUS_TO_DISPOSITION:
        return raw
    return DISPOSITION_TO_LEGACY_STATUS.get(raw, raw)


def status_to_disposition(status: str) -> str:
    return LEGACY_STATUS_TO_DISPOSITION.get(status, status)


def compute_feedback_summary(entries: list) -> dict:
    """Compute summary counts from entries to avoid drift."""
    summary = {"total": len(entries), "correct": 0, "incorrect": 0, "skipped": 0, "pending": 0}
    for entry in entries:
        status = entry.get("status")
        if status in summary:
            summary[status] += 1
    return summary

def load_feedback() -> dict:
    """Load existing feedback from file."""
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                entries = data.get("entries", [])
                # Backfill canonical disposition field for newer consumers.
                for entry in entries:
                    if "disposition" not in entry:
                        entry["disposition"] = status_to_disposition(entry.get("status"))
                data["summary"] = compute_feedback_summary(entries)
                return data
        except:
            pass
    return {"entries": [], "summary": {"total": 0, "correct": 0, "incorrect": 0, "skipped": 0, "pending": 0}}

def save_feedback(data: dict):
    """Save feedback to file."""
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _safe_feedback_export_name(source_name: str) -> str:
    base = os.path.splitext(source_name or "feedback")[0]
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._-")
    return safe or "feedback"


@app.route("/api/feedback", methods=["POST"])
def feedback_post():
    """
    Save classification feedback for training and schema discovery.
    
    Request body (JSON):
        {
            "page": 42,
            "source": "GPO-WARRENCOMMISSIONHEARINGS-1.pdf",
            "predictedType": "WC_TESTIMONY",
            "selectedType": "FBI_302",
            "selectedAgency": "FBI",
            "selectedClass": "REPORT",
            "selectedFormat": "FD-302",
            "selectedContent": ["INTERVIEW", "TESTIMONY"],
            "status": "incorrect",
            "newTypeFlag": false,
            "textSample": "First 500 chars of OCR text..."
        }
    
    Response:
        { "success": true, "totalEntries": 150 }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400
    
    # We now permit partial feedback for the 4-tier model
    required = ["page", "status"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400
    
    # Normalize status/disposition contract
    normalized_status = normalize_feedback_status(data.get("status"))
    if normalized_status not in {"correct", "incorrect", "pending", "skipped"}:
        return jsonify({"error": f"Invalid status/disposition: {data.get('status')}"}), 400
    data["status"] = normalized_status
    data["disposition"] = status_to_disposition(normalized_status)

    # Require explicit reason for non-approved outcomes
    if normalized_status in {"incorrect", "skipped"}:
        raw_reason_code = (data.get("reason_code") or data.get("noteType") or "").strip()
        reason_code = "OTHER" if raw_reason_code == "OTHER_CUSTOM" else raw_reason_code
        if not reason_code:
            return jsonify({"error": "reason_code (or noteType) required for non-approved outcomes"}), 400
        data["reason_code"] = reason_code
        reason_detail = (data.get("reason_detail") or "").strip()
        if reason_code == "OTHER" and not reason_detail and not (data.get("notes") or "").strip():
            return jsonify({"error": "Custom reason detail (or notes) required when reason_code=OTHER"}), 400
        data["reason_detail"] = reason_detail or None

    # Load existing feedback
    feedback = load_feedback()
    
    # Add timestamp
    data["timestamp"] = datetime.now().isoformat()
    
    # Check for duplicate (same source + page)
    source = data.get("source", "unknown")
    page = data.get("page")
    existing_idx = None
    for i, entry in enumerate(feedback["entries"]):
        if entry.get("source") == source and entry.get("page") == page:
            existing_idx = i
            break
    
    if existing_idx is not None:
        # Update existing entry
        feedback["entries"][existing_idx] = data
    else:
        # Add new entry
        feedback["entries"].append(data)

    # Recompute summary counts
    feedback["summary"] = compute_feedback_summary(feedback["entries"])
    
    # Save
    save_feedback(feedback)
    
    # SCHEMA DISCOVERY TRIGGER
    # If the user flagged a new type, we log it specifically for the agent to find 
    if data.get("newTypeFlag"):
        print(f"[AGENTIC] New Document Type Detected: {data.get('selectedType')} in {source}")
        # Note: In a full implementation, this could trigger an event or a separate log
    
    return jsonify({
        "success": True,
        "totalEntries": len(feedback["entries"]),
        "summary": feedback["summary"]
    })


@app.route("/api/feedback", methods=["GET"])
def feedback_get():
    """
    Retrieve all saved feedback.
    
    Response:
        {
            "entries": [...],
            "summary": { "total": 150, "correct": 120, "incorrect": 30 }
        }
    """
    feedback = load_feedback()
    return jsonify(feedback)


@app.route("/api/feedback/export", methods=["POST"])
def feedback_export_post():
    """
    Persist a Workbench feedback export artifact into data/feedback-exports/.
    Keeps loop artifacts in-repo so agents can process a stable location.
    """
    payload = request.get_json()
    if not payload or not isinstance(payload, dict):
        return jsonify({"error": "Missing JSON body"}), 400

    source = str(payload.get("source") or "feedback")
    schema_version = str(payload.get("schema_version") or "")
    if schema_version and schema_version != "workbench-feedback-v2":
        return jsonify({"error": f"Unsupported schema_version: {schema_version}"}), 400

    exported_at = str(payload.get("exportedAt") or datetime.now().isoformat())
    stamp = re.sub(r"[^0-9]", "", exported_at)[:14] or datetime.now().strftime("%Y%m%d%H%M%S")
    safe_base = _safe_feedback_export_name(source)
    filename = f"classifier_feedback_{safe_base}_v2_{stamp}.json"

    os.makedirs(FEEDBACK_EXPORT_DIR, exist_ok=True)
    save_path = os.path.join(FEEDBACK_EXPORT_DIR, filename)
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    return jsonify({
        "success": True,
        "filename": filename,
        "saved_path": os.path.relpath(save_path, PROJECT_ROOT).replace("\\", "/"),
    })


@app.route("/api/history", methods=["GET"])
def get_history():
    """
    Return a list of all previously processed documents.
    Scans the processed/ folder for PDFs and matching sidecars.
    """
    if not os.path.exists(UPLOAD_FOLDER):
        return jsonify({"files": []})

    files = []
    media_ext_set = {f".{e}" for e in MEDIA_EXTS}
    audio_ext_set = {f".{e}" for e in AUDIO_EXTS}
    video_ext_set = {f".{e}" for e in VIDEO_EXTS}

    def infer_kind(filename, ext):
        if ext == ".pdf":
            return "document"
        if ext in audio_ext_set:
            return "audio"
        if ext in video_ext_set:
            return "video"
        if ext in (".jpg", ".jpeg", ".png", ".tiff", ".webp", ".heic", ".heif"):
            return "image"
        if ext == ".txt":
            return "text"
        return "other"

    # Scan processed/ folder
    for entry in os.scandir(UPLOAD_FOLDER):
        if not entry.is_file():
            continue
        filename = entry.name
        ext = os.path.splitext(filename)[1].lower()

        if ext == ".pdf":
            files.append({
                "name": filename,
                "status": "completed",
                "size": entry.stat().st_size,
                "type": "OCR_RESULT" if "_searchable" in filename else "UPLOAD",
                "kind": infer_kind(filename, ext),
                "origin": "processed",
            })
        elif ext in media_ext_set:
            base_name = os.path.splitext(filename)[0]
            has_transcript = os.path.exists(os.path.join(UPLOAD_FOLDER, f"{base_name}.transcript.json"))
            files.append({
                "name": filename,
                "status": "completed" if has_transcript else "pending",
                "size": entry.stat().st_size,
                "type": "TRANSCRIPT" if has_transcript else "MEDIA_UPLOAD",
                "kind": infer_kind(filename, ext),
                "origin": "processed",
            })
        elif ext == ".txt":
            base_name = os.path.splitext(filename)[0]
            has_sidecar = os.path.exists(os.path.join(UPLOAD_FOLDER, f"{base_name}.ocr.json"))
            if has_sidecar:
                files.append({
                    "name": filename,
                    "status": "completed",
                    "size": entry.stat().st_size,
                    "type": "TEXT_INGEST",
                    "kind": infer_kind(filename, ext),
                    "origin": "processed",
                })

    # Also check processed/uploads/ for original/skipped files
    uploads_dir = os.path.join(UPLOAD_FOLDER, "uploads")
    if os.path.exists(uploads_dir):
        for entry in os.scandir(uploads_dir):
            if not entry.is_file():
                continue
            filename = entry.name
            ext = os.path.splitext(filename)[1].lower()
            if not any(f["name"] == filename for f in files):
                if ext == ".pdf":
                    files.append({
                        "name": filename,
                        "status": "completed",
                        "size": entry.stat().st_size,
                        "type": "ORIGINAL_PDF",
                        "kind": infer_kind(filename, ext),
                        "origin": "uploads",
                    })
                elif ext in media_ext_set:
                    files.append({
                        "name": filename,
                        "status": "completed",
                        "size": entry.stat().st_size,
                        "type": "MEDIA_UPLOAD",
                        "kind": infer_kind(filename, ext),
                        "origin": "uploads",
                    })

    return jsonify({"files": files})


@app.route("/api/history/<filename>", methods=["DELETE"])
def delete_history_file(filename):
    """Delete a source artifact and common sidecars by basename."""
    safe_name = os.path.basename(filename)
    if not safe_name or safe_name in (".", ".."):
        return jsonify({"error": "Invalid filename"}), 400

    processed_path = os.path.join(UPLOAD_FOLDER, safe_name)
    uploads_path = os.path.join(UPLOAD_FOLDER, "uploads", safe_name)
    primary_path = processed_path if os.path.exists(processed_path) else uploads_path if os.path.exists(uploads_path) else None

    if not primary_path:
        return jsonify({"error": "File not found"}), 404

    deleted = []
    warnings = []

    def _remove_if_exists(path):
        if os.path.exists(path) and os.path.isfile(path):
            try:
                os.remove(path)
                deleted.append(os.path.relpath(path, PROJECT_ROOT).replace("\\", "/"))
                return True
            except OSError as e:
                warnings.append(f"Failed to delete {os.path.basename(path)}: {e}")
        return False

    # Delete primary file first.
    _remove_if_exists(primary_path)

    # Delete sidecars in processed root that share basename.
    base_name, _ = os.path.splitext(safe_name)
    sidecar_exts = (".ocr.json", ".transcript.json", ".txt", ".vtt", ".srt", ".md")
    for ext in sidecar_exts:
        sidecar_path = os.path.join(UPLOAD_FOLDER, f"{base_name}{ext}")
        if os.path.normpath(sidecar_path) != os.path.normpath(primary_path):
            _remove_if_exists(sidecar_path)

    return jsonify({
        "success": True,
        "deleted": deleted,
        "warnings": warnings,
    })


@app.route("/api/feedback/corrections", methods=["GET"])
def feedback_corrections():
    """
    Get only incorrect classifications for training analysis.
    
    Response:
        {
            "corrections": [
                { "predictedType": "WC_TESTIMONY", "selectedType": "FBI_302", "count": 5, "samples": [...] }
            ]
        }
    """
    feedback = load_feedback()
    
    # Group non-approved outcomes by predicted->selected type pairs
    corrections = {}
    for entry in feedback["entries"]:
        if entry.get("status") not in {"incorrect", "skipped"}:
            continue
        
        key = f"{entry.get('predictedType', 'UNKNOWN')}->{entry.get('selectedType') or entry.get('selectedClass') or 'UNKNOWN'}"
        if key not in corrections:
            corrections[key] = {
                "predictedType": entry.get("predictedType"),
                "selectedType": entry.get("selectedType") or entry.get("selectedClass"),
                "count": 0,
                "samples": [],
                "statuses": {"incorrect": 0, "skipped": 0},
            }
        corrections[key]["count"] += 1
        st = entry.get("status")
        if st in corrections[key]["statuses"]:
            corrections[key]["statuses"][st] += 1
        if len(corrections[key]["samples"]) < 5:  # Keep up to 5 samples
            corrections[key]["samples"].append({
                "page": entry.get("page"),
                "source": entry.get("source"),
                "textSample": entry.get("textSample", "")[:200],
                "status": entry.get("status"),
                "reason_code": entry.get("reason_code"),
            })
    
    return jsonify({
        "corrections": list(corrections.values()),
        "total_incorrect": sum(c["count"] for c in corrections.values())
    })


# ============================================================================
# PASTE / URL INGEST ENDPOINTS
# ============================================================================

@app.route("/api/paste", methods=["POST"])
def paste_input():
    """Accept pasted text and create processed files from it."""
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    title = (data.get("title") or "pasted-text").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    # Sanitize title for filename
    import re as _re
    basename = _re.sub(r"[^a-zA-Z0-9_-]", "", title.replace(" ", "-")).lower() or "pasted-text"
    # Write .txt
    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)
    # Write .ocr.json sidecar
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    ocr_json = {"pages": [{"page": i + 1, "text": p} for i, p in enumerate(paragraphs)] or [{"page": 1, "text": text}]}
    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ocr_json, f, indent=2)
    return jsonify({"ok": True, "basename": basename, "pages": len(ocr_json["pages"]), "chars": len(text)})


def _is_known_video_site(url):
    """Check if URL matches known yt-dlp-compatible sites."""
    from urllib.parse import urlparse
    host = urlparse(url).netloc.lower()
    patterns = [
        "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",
        "soundcloud.com", "bandcamp.com", "twitter.com", "x.com",
        "twitch.tv", "rumble.com", "bitchute.com", "odysee.com",
    ]
    return any(p in host for p in patterns)


def _http_request_with_ssl_fallback(method, url, **kwargs):
    """Retry once with verify=False on SSL certificate-chain failures."""
    import requests as _requests
    import urllib3 as _urllib3

    headers = kwargs.pop("headers", {}) or {}
    headers.setdefault("User-Agent", "Mozilla/5.0 PrimarySources/1.0")
    try:
        return _requests.request(method, url, headers=headers, **kwargs)
    except _requests.exceptions.SSLError:
        _urllib3.disable_warnings(_urllib3.exceptions.InsecureRequestWarning)
        return _requests.request(method, url, headers=headers, verify=False, **kwargs)


def _detect_url_type(url):
    """Auto-detect URL content type. Returns 'html', 'audio', 'video', 'document', 'image', 'ytdlp', or 'unknown'."""
    from urllib.parse import urlparse

    # Check known video sites first (they return HTML but we want yt-dlp)
    if _is_known_video_site(url):
        return "ytdlp"

    # HEAD request to sniff Content-Type
    try:
        resp = _http_request_with_ssl_fallback(
            "HEAD", url, timeout=10, allow_redirects=True
        )
        ct = resp.headers.get("Content-Type", "").lower().split(";")[0].strip()

        if ct.startswith("text/html") or ct.startswith("application/xhtml"):
            return "html"
        if ct.startswith("audio/"):
            return "audio"
        if ct.startswith("video/"):
            return "video"
        if ct == "application/pdf":
            return "document"
        if ct.startswith("image/"):
            return "image"
        # Opaque binary — guess from URL extension
        if ct in ("application/octet-stream", "binary/octet-stream", ""):
            path = urlparse(url).path.lower()
            audio_exts = (".mp3", ".wav", ".m4a", ".flac", ".ogg", ".wma")
            video_exts = (".mp4", ".webm", ".mov", ".mkv", ".avi")
            image_exts = (".jpg", ".jpeg", ".png", ".tiff", ".webp", ".heic")
            if path.endswith(".pdf"):
                return "document"
            if any(path.endswith(e) for e in audio_exts):
                return "audio"
            if any(path.endswith(e) for e in video_exts):
                return "video"
            if any(path.endswith(e) for e in image_exts):
                return "image"
    except Exception:
        pass

    return "unknown"


def _scrape_html(url):
    """Scrape a web page and save as .txt + .ocr.json. Returns response dict."""
    from bs4 import BeautifulSoup
    import re as _re

    resp = _http_request_with_ssl_fallback("GET", url, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    title = soup.title.string.strip() if soup.title and soup.title.string else "web-page"
    text = soup.get_text(separator="\n", strip=True)
    if not text.strip():
        raise ValueError("No text content extracted from URL")
    basename = _re.sub(r"[^a-zA-Z0-9_-]", "", title.replace(" ", "-")).lower()[:80] or "web-page"
    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    ocr_json = {"pages": [{"page": i + 1, "text": p} for i, p in enumerate(paragraphs)] or [{"page": 1, "text": text}]}
    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ocr_json, f, indent=2)
    return {"success": True, "type": "scraped", "title": title, "basename": basename,
            "pages": len(ocr_json["pages"]), "chars": len(text)}


def _download_direct(url):
    """Download a direct file (PDF, image, audio, video) and save to uploads/. Returns response dict."""
    import re as _re
    from urllib.parse import urlparse

    upload_dir = os.path.join(UPLOAD_FOLDER, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    resp = _http_request_with_ssl_fallback("GET", url, timeout=60, stream=True)
    resp.raise_for_status()
    ct = resp.headers.get("Content-Type", "").lower().split(";")[0].strip()

    # Derive filename from URL path or Content-Disposition
    filename = None
    cd = resp.headers.get("Content-Disposition", "")
    if "filename=" in cd:
        filename = cd.split("filename=")[-1].strip('" ')
    if not filename:
        filename = os.path.basename(urlparse(url).path) or "download"
    filename = _re.sub(r"[^a-zA-Z0-9._-]", "_", filename)[:100]

    file_path = os.path.join(upload_dir, filename)
    size = 0
    with open(file_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
            size += len(chunk)

    return {"success": True, "type": "downloaded", "title": filename,
            "file": {"name": filename, "size": size, "content_type": ct}}


def _extract_yt_transcript(url, lang="en"):
    """Try to extract YouTube transcript via yt-dlp subtitles. Returns response dict or None."""
    import re as _re
    import requests as _requests

    ydl_opts = {"quiet": True, "no_warnings": True,
                "cookiesfrombrowser": ("edge",),
                "extractor_args": {"youtube": {"player_client": ["web"]}}}

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    title = info.get("title", "download")

    # Prefer manual subtitles, fall back to auto-captions
    subs = info.get("subtitles", {}).get(lang) or info.get("automatic_captions", {}).get(lang)
    if not subs:
        return None

    # Find VTT format
    vtt_url = None
    for fmt in subs:
        if fmt.get("ext") == "vtt":
            vtt_url = fmt.get("url")
            break
    if not vtt_url:
        return None

    # Download VTT content
    resp = _requests.get(vtt_url, timeout=30)
    resp.raise_for_status()
    vtt_text = resp.text

    # Strip VTT to plain text: remove header, timestamps, positioning
    lines = vtt_text.split("\n")
    text_lines = []
    for line in lines:
        line = line.strip()
        # Skip WEBVTT header, blank lines, timestamp lines, NOTE lines
        if not line or line.startswith("WEBVTT") or line.startswith("NOTE"):
            continue
        if _re.match(r"^\d{2}:\d{2}[:\.]", line) or _re.match(r"^[\d]+$", line):
            continue
        if " --> " in line:
            continue
        # Strip inline tags like <c> </c> <00:00:00.000>
        line = _re.sub(r"<[^>]+>", "", line)
        if line:
            text_lines.append(line)

    # Deduplicate consecutive identical lines (common in auto-captions)
    deduped = []
    for line in text_lines:
        if not deduped or line != deduped[-1]:
            deduped.append(line)

    text = "\n".join(deduped)
    if not text.strip():
        return None

    # Determine caption source for status messaging
    caption_source = "manual" if info.get("subtitles", {}).get(lang) else "auto-captions"

    # Save as .txt + .ocr.json (same shape as web scrape)
    basename = _re.sub(r"[^a-zA-Z0-9_-]", "", title.replace(" ", "-")).lower()[:80] or "yt-transcript"
    txt_path = os.path.join(UPLOAD_FOLDER, basename + ".txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    ocr_json = {"pages": [{"page": i + 1, "text": p} for i, p in enumerate(paragraphs)] or [{"page": 1, "text": text}]}
    json_path = os.path.join(UPLOAD_FOLDER, basename + ".ocr.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ocr_json, f, indent=2)

    print(f"[yt-transcript] Extracted {caption_source} transcript: {title} ({len(text)} chars)")

    return {"success": True, "type": "scraped", "source": "yt-transcript",
            "caption_source": caption_source, "title": title, "basename": basename,
            "pages": len(ocr_json["pages"]), "chars": len(text)}


def _download_ytdlp(url):
    """Download from YouTube/video sites. Tries transcript first, falls back to audio download."""
    import re as _re

    # Try transcript extraction first (instant, no audio download needed)
    try:
        result = _extract_yt_transcript(url)
        if result:
            return result
        print(f"[yt-dlp] No transcript available, downloading audio...")
    except Exception as e:
        print(f"[yt-dlp] Transcript extraction failed ({e}), downloading audio...")

    upload_dir = os.path.join(UPLOAD_FOLDER, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True,
                            "cookiesfrombrowser": ("edge",),
                            "extractor_args": {"youtube": {"player_client": ["web"]}}}) as ydl:
        info = ydl.extract_info(url, download=False)
        title = info.get("title", "download")

    safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in title).strip()[:80] or "download"
    output_template = os.path.join(upload_dir, f"{safe_title}.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}],
        "quiet": True, "no_warnings": True,
        "cookiesfrombrowser": ("edge",),
        "extractor_args": {"youtube": {"player_client": ["web"]}},
        "http_headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception:
        fallback_opts = {
            "format": "best",
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "cookiesfrombrowser": ("edge",),
            "extractor_args": {"youtube": {"player_client": ["web"]}},
            "http_headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
        }
        with yt_dlp.YoutubeDL(fallback_opts) as ydl:
            ydl.download([url])

    mp3_path = os.path.join(upload_dir, f"{safe_title}.mp3")
    if os.path.exists(mp3_path):
        return {"success": True, "type": "ytdlp", "title": title,
                "file": {"name": f"{safe_title}.mp3", "size": os.path.getsize(mp3_path), "content_type": "audio/mpeg"}}

    import mimetypes as _mimetypes
    candidates = [f for f in os.listdir(upload_dir) if f.startswith(safe_title) and not f.endswith((".part", ".ytdl"))]
    if not candidates:
        raise FileNotFoundError("Download completed but output file not found")
    candidates.sort(key=lambda n: os.path.getmtime(os.path.join(upload_dir, n)), reverse=True)
    picked = candidates[0]
    picked_path = os.path.join(upload_dir, picked)
    guessed_ct = _mimetypes.guess_type(picked)[0] or "application/octet-stream"
    return {"success": True, "type": "ytdlp", "title": title,
            "file": {"name": picked, "size": os.path.getsize(picked_path), "content_type": guessed_ct}}


@app.route("/api/ingest-url", methods=["POST"])
def ingest_url():
    """Unified URL ingestion. Auto-detects content type and routes accordingly.

    Request JSON: { "url": "https://..." }
    Response:     { "success": true, "type": "scraped|downloaded|ytdlp", "title": "...", ... }
    """
    data = request.get_json() or {}
    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    if not url.startswith(("http://", "https://")):
        return jsonify({"error": "Invalid URL. Paste a link starting with http:// or https://"}), 400

    try:
        detected = _detect_url_type(url)
        print(f"[ingest-url] {url} -> detected as: {detected}")

        if detected == "ytdlp":
            if not YTDLP_AVAILABLE:
                return jsonify({"error": "yt-dlp not installed. Run: pip install yt-dlp"}), 503
            try:
                return jsonify(_download_ytdlp(url))
            except Exception as ytdlp_err:
                # Fallback keeps URL ingest usable even when platform format rules change.
                try:
                    return jsonify(_scrape_html(url))
                except Exception:
                    return jsonify({"error": str(ytdlp_err)}), 500

        if detected == "html":
            return jsonify(_scrape_html(url))

        if detected in ("audio", "video", "document", "image"):
            return jsonify(_download_direct(url))

        # Unknown — try yt-dlp first, then scrape
        if YTDLP_AVAILABLE:
            try:
                return jsonify(_download_ytdlp(url))
            except Exception:
                pass
        try:
            return jsonify(_scrape_html(url))
        except Exception:
            pass
        return jsonify(_download_direct(url))

    except ImportError:
        return jsonify({"error": "Required packages missing. Run: pip install beautifulsoup4 requests"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# TTS ENDPOINTS (Kokoro Text-to-Speech)
# ============================================================================

@app.route("/api/tts/config", methods=["GET"])
def tts_config():
    """Return TTS availability and voice list."""
    return jsonify({
        "available": KOKORO_AVAILABLE,
        "voices": TTS_VOICES if KOKORO_AVAILABLE else [],
    })


@app.route("/api/tts/preview", methods=["POST"])
def tts_preview():
    """Synthesize a short preview (<=200 chars) and return audio blob."""
    if not KOKORO_AVAILABLE:
        return jsonify({"error": "Kokoro TTS not installed"}), 503

    data = request.get_json()
    if not data or not data.get("text"):
        return jsonify({"error": "No text provided"}), 400

    text = data["text"][:200]
    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))
    fmt = data.get("format", "wav").lower()

    # Determine lang from voice prefix
    lang = "b" if voice.startswith("b") else "a"

    try:
        worker = TTSWorker(voice=voice, speed=speed, lang=lang)
        buf = worker.synthesize_to_buffer(text, voice=voice, speed=speed, format=fmt)
        mime = "audio/wav" if fmt == "wav" else "audio/mpeg"
        from flask import Response
        return Response(buf.read(), mimetype=mime)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tts/synthesize", methods=["POST"])
def tts_synthesize():
    """Synthesize full text and return audio blob."""
    if not KOKORO_AVAILABLE:
        return jsonify({"error": "Kokoro TTS not installed"}), 503

    data = request.get_json()
    if not data or not data.get("text"):
        return jsonify({"error": "No text provided"}), 400

    text = data["text"]
    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))
    fmt = data.get("format", "wav").lower()

    lang = "b" if voice.startswith("b") else "a"

    try:
        worker = TTSWorker(voice=voice, speed=speed, lang=lang)
        buf = worker.synthesize_to_buffer(text, voice=voice, speed=speed, format=fmt)
        mime = "audio/wav" if fmt == "wav" else "audio/mpeg"
        from flask import Response
        return Response(buf.read(), mimetype=mime)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tts/batch", methods=["POST"])
def tts_batch():
    """Synthesize multiple items and return zip of audio files."""
    if not KOKORO_AVAILABLE:
        return jsonify({"error": "Kokoro TTS not installed"}), 503

    data = request.get_json()
    if not data or not data.get("items"):
        return jsonify({"error": "No items provided"}), 400

    items = data["items"]
    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))
    fmt = data.get("format", "wav").lower()

    lang = "b" if voice.startswith("b") else "a"

    try:
        worker = TTSWorker(voice=voice, speed=speed, lang=lang)
        zip_buf = worker.synthesize_batch(items, voice=voice, speed=speed, format=fmt)
        from flask import Response
        return Response(
            zip_buf.read(),
            mimetype="application/zip",
            headers={"Content-Disposition": "attachment; filename=audio-export.zip"}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tts/from-file", methods=["POST"])
def tts_from_file():
    """Synthesize audio directly from processed txt/md/html/transcript sidecars."""
    if not KOKORO_AVAILABLE:
        return jsonify({"error": "Kokoro TTS not installed"}), 503

    data = request.get_json() or {}
    raw_name = str(data.get("filename", "")).strip()
    source_format = str(data.get("source", "txt")).strip().lower()
    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))
    audio_format = str(data.get("format", "wav")).strip().lower()
    preview = bool(data.get("preview", False))
    max_chars = int(data.get("max_chars", 200))

    if not raw_name:
        return jsonify({"error": "filename is required"}), 400
    if source_format not in {"txt", "md", "html", "transcript"}:
        return jsonify({"error": f"Unsupported source: {source_format}"}), 400
    if audio_format not in {"wav", "mp3"}:
        return jsonify({"error": f"Unsupported format: {audio_format}"}), 400

    safe_base = os.path.basename(raw_name).replace("_searchable", "")
    safe_base = os.path.splitext(safe_base)[0]
    if source_format == "transcript":
        target_path = os.path.join(UPLOAD_FOLDER, f"{safe_base}.transcript.json")
    else:
        target_path = os.path.join(UPLOAD_FOLDER, f"{safe_base}.{source_format}")

    if not os.path.isfile(target_path):
        return jsonify({"error": f"Source file not found: {os.path.basename(target_path)}"}), 404

    with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_text = f.read()

    if source_format == "html":
        text = re.sub(r"<[^>]+>", " ", raw_text)
        text = re.sub(r"\s+", " ", text).strip()
    elif source_format == "md":
        text = re.sub(r"[#*_`~\[\]()>-]", " ", raw_text)
        text = re.sub(r"\s+", " ", text).strip()
    elif source_format == "transcript":
        try:
            payload = json.loads(raw_text)
            text = " ".join((seg.get("text", "") or "").strip() for seg in payload.get("segments", []))
            text = re.sub(r"\s+", " ", text).strip()
        except Exception as e:
            return jsonify({"error": f"Invalid transcript json: {str(e)}"}), 400
    else:
        text = raw_text.strip()

    if not text:
        return jsonify({"error": "No text content found in source file"}), 400

    if preview:
        text = text[:max(1, max_chars)]

    lang = "b" if str(voice).startswith("b") else "a"
    worker = TTSWorker(voice=voice, speed=speed, lang=lang)

    try:
        if preview or len(text) <= 5000:
            buf = worker.synthesize_to_buffer(text, voice=voice, speed=speed, format=audio_format)
            mime = "audio/mpeg" if audio_format == "mp3" else "audio/wav"
            return send_file(
                buf,
                mimetype=mime,
                as_attachment=not preview,
                download_name=f"{safe_base}.{audio_format}"
            )

        # Long text: bounded chunking for safer synthesis
        def build_tts_chunks(raw_text: str, max_chars: int = 1200):
            # Sentence-aware split first, then hard wrap if needed.
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", raw_text) if s.strip()]
            chunks = []
            current = []
            current_len = 0
            for sent in sentences:
                if len(sent) > max_chars:
                    if current:
                        chunks.append(" ".join(current).strip())
                        current = []
                        current_len = 0
                    for i in range(0, len(sent), max_chars):
                        part = sent[i:i + max_chars].strip()
                        if part:
                            chunks.append(part)
                    continue
                if current_len + len(sent) + 1 > max_chars and current:
                    chunks.append(" ".join(current).strip())
                    current = [sent]
                    current_len = len(sent)
                else:
                    current.append(sent)
                    current_len += len(sent) + 1
            if current:
                chunks.append(" ".join(current).strip())
            if not chunks:
                chunks = [raw_text[i:i + max_chars].strip() for i in range(0, len(raw_text), max_chars)]
            # Skip degenerate chunks (e.g., OCR noise with no letters/numbers)
            cleaned = []
            for c in chunks:
                if len(re.findall(r"[A-Za-z0-9]", c)) < 20:
                    continue
                cleaned.append(c)
            return cleaned

        chunks = build_tts_chunks(text, max_chars=1200)
        if not chunks:
            return jsonify({"error": "No synthesizeable text chunks after normalization"}), 400
        items = [{"id": str(i + 1), "text": c, "label": f"Part-{i + 1:03d}"} for i, c in enumerate(chunks)]
        zip_buf = worker.synthesize_batch(items, voice=voice, speed=speed, format=audio_format)
        return send_file(
            zip_buf,
            mimetype="application/zip",
            as_attachment=True,
            download_name=f"{safe_base}-audio.zip"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# CATCH-ALL ROUTE (MUST BE LAST)
# ============================================================================

@app.route("/<path:filename>")
def serve_ui_files(filename):
    """Serve HTML files and other resources from main web/html/ directory."""
    # Security check: only serve .html, .css, .js files from UI root or subdirs
    if filename.endswith(('.html', '.css', '.js', '.png', '.jpg', '.svg', '.json')):
        return send_from_directory(NEW_UI_ROOT, filename)

    # For other paths, return 404
    return jsonify({"error": "Not found"}), 404


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Primary Sources — OCR Web Server")
    print("=" * 60)
    print(f"Serving UI from: {UI_DIR}")
    print(f"Output folder:   {UPLOAD_FOLDER}")
    print(f"OCR backend:     {'Available' if OCR_AVAILABLE else 'Placeholder mode'}")
    print("-" * 60)
    print("Open browser to: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000, use_reloader=False)
