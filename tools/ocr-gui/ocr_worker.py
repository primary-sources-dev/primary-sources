"""
ocr_worker.py — Background OCR processing for the GUI tool.

Supports two backends:
1. Python (pytesseract + pdf2image) — Windows native
2. WSL (ocrmypdf) — Higher quality, requires WSL Ubuntu
"""

import os
import subprocess
import threading
from pathlib import Path
from typing import Callable, Optional

# Poppler path for Windows (adjust if needed)
POPPLER_PATH = r"C:\Users\willh\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin"


class OCRWorker:
    """Handles OCR processing in a background thread."""

    def __init__(
        self,
        backend: str = "wsl",
        output_dir: str = ".",
        output_pdf: bool = True,
        output_txt: bool = True,
        output_md: bool = False,
        deskew: bool = True,
        clean: bool = True,
        force_ocr: bool = False,
        on_progress: Optional[Callable] = None,
        on_complete: Optional[Callable] = None,
        on_log: Optional[Callable[[str], None]] = None,
    ):
        # Configuration (used by process_file)
        self.backend = backend
        self.output_dir = output_dir
        self.output_pdf = output_pdf
        self.output_txt = output_txt
        self.output_md = output_md
        self.deskew = deskew
        self.clean = clean
        self.force_ocr = force_ocr
        
        # Callbacks
        self.on_progress = on_progress
        self.on_complete = on_complete
        self.on_log = on_log
        
        self._cancel_flag = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def log(self, message: str):
        if self.on_log:
            self.on_log(message)

    def cancel(self):
        self._cancel_flag.set()

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    # ========================================================================
    # BATCH PROCESSING (Used by desktop GUI)
    # ========================================================================

    def process_batch(
        self,
        files: list[str],
        output_dir: str,
        use_wsl: bool = False,
        output_pdf: bool = True,
        output_txt: bool = True,
        output_md: bool = False,
        deskew: bool = True,
        clean: bool = True,
        force_ocr: bool = False,
    ):
        """Start processing a batch of files in a background thread."""
        self._cancel_flag.clear()
        # Update internal config for this batch
        self.backend = "wsl" if use_wsl else "python"
        self.output_dir = output_dir
        self.output_pdf = output_pdf
        self.output_txt = output_txt
        self.output_md = output_md
        self.deskew = deskew
        self.clean = clean
        self.force_ocr = force_ocr

        self._thread = threading.Thread(
            target=self._process_batch_impl,
            args=(files,),
            daemon=True,
        )
        self._thread.start()

    def _process_batch_impl(self, files: list[str]):
        os.makedirs(self.output_dir, exist_ok=True)

        for filepath in files:
            if self._cancel_flag.is_set():
                self.log("Batch cancelled by user.")
                break

            filename = os.path.basename(filepath)
            self.log(f"Starting: {filename}")

            try:
                if self.backend == "wsl":
                    success, msg = self._process_wsl(filepath)
                else:
                    success, msg = self._process_python(filepath)

                if self.on_complete:
                    # GUI expects (filename, success, message)
                    self.on_complete(filename, success, msg)

            except Exception as e:
                self.log(f"Error processing {filename}: {e}")
                if self.on_complete:
                    self.on_complete(filename, False, str(e))

    # ========================================================================
    # SINGLE FILE PROCESSING (Used by web server)
    # ========================================================================

    def process_file(self, filepath: str, on_progress=None, on_complete=None):
        """Process a single file directly."""
        if on_progress: self.on_progress = on_progress
        if on_complete: self.on_complete = on_complete
        
        try:
            if self.backend == "wsl":
                success, msg = self._process_wsl(filepath)
            else:
                success, msg = self._process_python(filepath)
            
            if self.on_complete:
                # Server expects (success, message)
                self.on_complete(success, msg)
        except Exception as e:
            if self.on_complete:
                self.on_complete(False, str(e))

    # ========================================================================
    # BACKENDS
    # ========================================================================

    def _process_python(self, filepath: str) -> tuple[bool, str]:
        """Process using pytesseract (Windows native)."""
        try:
            import pytesseract
            from pdf2image import convert_from_path
            from PIL import Image
        except ImportError as e:
            return False, f"Missing dependency: {e}"

        filename = os.path.basename(filepath)
        base_name = os.path.splitext(filename)[0]

        self.log(f"Converting PDF to images: {filename}")

        try:
            images = convert_from_path(filepath, poppler_path=POPPLER_PATH)
        except Exception as e:
            return False, f"PDF conversion failed: {e}"

        total_pages = len(images)
        full_text = ""

        for i, image in enumerate(images):
            if self._cancel_flag.is_set():
                return False, "Cancelled"

            page_num = i + 1
            self.log(f"  Page {page_num}/{total_pages}")

            if self.on_progress:
                # Handle both GUI (4 args) and Server (2 args) callbacks
                try:
                    self.on_progress(filename, page_num, total_pages, "Processing")
                except TypeError:
                    pct = int((page_num / total_pages) * 100)
                    self.on_progress(pct, f"Processing page {page_num}/{total_pages}...")

            text = pytesseract.image_to_string(image)
            full_text += f"\n\n--- PAGE {page_num} ---\n\n{text}"

        if self.output_txt:
            txt_path = os.path.join(self.output_dir, f"{base_name}.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(full_text)
            self.log(f"  Saved: {base_name}.txt")

        if self.output_md:
            md_path = os.path.join(self.output_dir, f"{base_name}.md")
            md_content = f"# OCR Result: {filename}\n\n"
            # Simple conversion of page markers to H2
            for part in full_text.split("--- PAGE "):
                if not part.strip(): continue
                lines = part.splitlines()
                if not lines: continue
                page_info = lines[0].replace(" ---", "")
                content = "\n".join(lines[1:])
                md_content += f"## Page {page_info}\n\n{content}\n\n---\n\n"
            
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            self.log(f"  Saved: {base_name}.md")

        if self.output_pdf:
            self.log("  Note: Searchable PDF output requires WSL mode.")

        return True, "Complete"

    def _process_wsl(self, filepath: str) -> tuple[bool, str]:
        """Process using ocrmypdf via WSL."""
        filename = os.path.basename(filepath)
        base_name = os.path.splitext(filename)[0]

        wsl_input = self._to_wsl_path(filepath)
        wsl_output_dir = self._to_wsl_path(self.output_dir)

        pdf_output = f"{wsl_output_dir}/{base_name}_searchable.pdf"
        txt_output = f"{wsl_output_dir}/{base_name}.txt" if self.output_txt else None

        cmd = ["wsl", "ocrmypdf"]
        if self.deskew: cmd.append("--deskew")
        if self.clean: cmd.append("--clean")
        if self.force_ocr: cmd.append("--force-ocr")
        if txt_output: cmd.extend(["--sidecar", txt_output])

        cmd.extend([wsl_input, pdf_output])

        self.log(f"  Running OCRmyPDF...")

        if self.on_progress:
            try:
                self.on_progress(filename, 0, 100, "OCRmyPDF running...")
            except TypeError:
                self.on_progress(10, "Starting OCRmyPDF in WSL...")

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)

            if result.returncode == 0:
                self.log(f"  Saved: {base_name}_searchable.pdf")
                if self.output_txt: self.log(f"  Saved: {base_name}.txt")
                
                # Convert to MD if requested
                if self.output_md and txt_output:
                    local_txt = os.path.join(self.output_dir, f"{base_name}.txt")
                    if os.path.exists(local_txt):
                        with open(local_txt, "r", encoding="utf-8") as f:
                            text = f.read()
                        md_path = os.path.join(self.output_dir, f"{base_name}.md")
                        with open(md_path, "w", encoding="utf-8") as f:
                            f.write(f"# OCR Result: {filename}\n\n{text}")
                        self.log(f"  Saved: {base_name}.md")

                return True, "Complete"
            else:
                error_msg = result.stderr.strip() or "Unknown error"
                self.log(f"  Error: {error_msg}")
                return False, error_msg

        except Exception as e:
            self.log(f"  Error: {str(e)}")
            return False, str(e)

    def _to_wsl_path(self, windows_path: str) -> str:
        """Convert Windows path to WSL path."""
        path = os.path.abspath(windows_path)
        if path[1] == ":":
            drive = path[0].lower()
            rest = path[2:].replace("\\", "/")
            return f"/mnt/{drive}{rest}"
        return path.replace("\\", "/")
