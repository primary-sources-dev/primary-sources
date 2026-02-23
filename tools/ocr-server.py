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
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

# Paths
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TOOLS_DIR)
UI_DIR = os.path.join(PROJECT_ROOT, "docs", "ui", "ocr")

# Import OCR worker from ocr-gui
import sys
sys.path.insert(0, os.path.join(TOOLS_DIR, "ocr-gui"))
try:
    from ocr_worker import OCRWorker
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: ocr_worker not available, using placeholder processing")

# Flask app serving from docs/ui/ocr/
app = Flask(__name__, 
            template_folder=UI_DIR, 
            static_folder=UI_DIR, 
            static_url_path="")

# Configuration
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "processed")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXTENSIONS = {"pdf"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global state
processing_jobs = {}  # job_id -> {status, files, progress, worker}
job_counter = 0


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ============================================================================
# ROUTES - Static Files
# ============================================================================

@app.route("/")
def index():
    """Serve the main OCR tool page from docs/ui/ocr/."""
    return send_from_directory(UI_DIR, "index.html")


@app.route("/ocr-gui.css")
def serve_css():
    """Serve CSS file."""
    return send_from_directory(UI_DIR, "ocr-gui.css")


@app.route("/ocr-gui.js")
def serve_js():
    """Serve JS file."""
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
    deskew = request.form.get("deskew", "true") == "true"
    clean = request.form.get("clean", "true") == "true"
    force_ocr = request.form.get("force_ocr", "false") == "true"
    
    if not files:
        return jsonify({"error": "No files provided"}), 400
    
    # Validate files
    for file in files:
        if not allowed_file(file.filename):
            return jsonify({"error": f"Invalid file type: {file.filename}"}), 400
    
    # Save uploaded files to temp location
    saved_files = []
    for file in files:
        filename = secure_filename(file.filename)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Seek back to start
        
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], "uploads", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        file.save(filepath)
        
        saved_files.append({
            "name": filename,
            "size": file_size,
            "path": filepath,
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


@app.route("/api/output-dir", methods=["GET", "POST"])
def handle_output_dir():
    """Get or set the output directory."""
    if request.method == "GET":
        return jsonify({"output_dir": UPLOAD_FOLDER})
    
    # For now, just return current directory
    # In production, would validate and set
    new_dir = request.json.get("output_dir")
    return jsonify({"output_dir": UPLOAD_FOLDER})


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
