"""
ocr-server.py — Flask-based web server for OCR GUI
Serves frontend from docs/ui/ocr/ and provides REST API for file processing.

Usage:
    python tools/ocr-server.py
    
Then open: http://localhost:5000
"""

import os
import json
import threading
import zipfile
import tarfile
import shutil
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

# Paths
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TOOLS_DIR)
UI_DIR = os.path.join(PROJECT_ROOT, "docs", "ui", "ocr")

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
    from metadata_parser import MetadataParser, parse_metadata
    PARSER_AVAILABLE = True
except ImportError:
    PARSER_AVAILABLE = False
    print("Warning: metadata_parser not available")

try:
    from document_classifier import classify_document, classify, get_all_scores
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
    from entity_matcher import EntityMatcher, find_entities, generate_entities_json
    ENTITY_MATCHER_AVAILABLE = True
    # Initialize matcher with sample data
    _entity_matcher = EntityMatcher()
    _entity_matcher.load_sample_data()
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
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "processed")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "tiff", "webp", "heic", "heif", "zip", "tar", "gz", "tgz", "bz2"}
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
    return ext in IMAGE_PDF_EXTENSIONS


# ============================================================================
# ROUTES - Static Files
# ============================================================================

@app.route("/")
def index():
    """Serve the main OCR tool page from docs/ui/ocr/."""
    return send_from_directory(UI_DIR, "index.html")


@app.route("/assets/<path:path>")
def serve_assets(path):
    """Serve global assets (CSS, JS, images)."""
    return send_from_directory(os.path.join(PROJECT_ROOT, "docs", "ui", "assets"), path)


@app.route("/components/<path:path>")
def serve_components(path):
    """Serve modular HTML components."""
    return send_from_directory(os.path.join(PROJECT_ROOT, "docs", "ui", "components"), path)


@app.route("/ocr-components.css")
def serve_ocr_css():
    """Serve OCR-specific CSS file."""
    return send_from_directory(UI_DIR, "ocr-components.css")


@app.route("/ocr-gui.js")
def serve_js():
    """Serve local JS file."""
    return send_from_directory(UI_DIR, "ocr-gui.js")


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
    })


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
            
            if OCR_AVAILABLE:
                # Real OCR processing
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
                
                def on_progress(pct, msg):
                    job["log"].append(msg)
                    file_info["progress"] = pct
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
    """Download a processed file."""
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)


@app.route("/api/output-dir", methods=["GET", "POST"])
def handle_output_dir():
    """Get or set the output directory."""
    if request.method == "GET":
        return jsonify({"output_dir": UPLOAD_FOLDER})
    
    # For now, just return current directory
    # In production, would validate and set
    new_dir = request.json.get("output_dir")
    return jsonify({"output_dir": UPLOAD_FOLDER})


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
        result = parse_metadata(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Parse error: {str(e)}"}), 500


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
