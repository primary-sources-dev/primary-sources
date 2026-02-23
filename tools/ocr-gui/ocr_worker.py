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
        on_progress: Optional[Callable[[str, int, int, str], None]] = None,
        on_complete: Optional[Callable[[str, bool, str], None]] = None,
        on_log: Optional[Callable[[str], None]] = None,
    ):
        self.on_progress = on_progress  # (filename, current_page, total_pages, status)
        self.on_complete = on_complete  # (filename, success, message)
        self.on_log = on_log  # (log_message)
        self._cancel_flag = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def log(self, message: str):
        if self.on_log:
            self.on_log(message)

    def cancel(self):
        self._cancel_flag.set()

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def process_batch(
        self,
        files: list[str],
        output_dir: str,
        use_wsl: bool = False,
        output_pdf: bool = True,
        output_txt: bool = True,
        deskew: bool = True,
        clean: bool = True,
        force_ocr: bool = False,
    ):
        """Start processing a batch of files in a background thread."""
        self._cancel_flag.clear()
        self._thread = threading.Thread(
            target=self._process_batch_impl,
            args=(files, output_dir, use_wsl, output_pdf, output_txt, deskew, clean, force_ocr),
            daemon=True,
        )
        self._thread.start()

    def _process_batch_impl(
        self,
        files: list[str],
        output_dir: str,
        use_wsl: bool,
        output_pdf: bool,
        output_txt: bool,
        deskew: bool,
        clean: bool,
        force_ocr: bool,
    ):
        os.makedirs(output_dir, exist_ok=True)

        for filepath in files:
            if self._cancel_flag.is_set():
                self.log("Batch cancelled by user.")
                break

            filename = os.path.basename(filepath)
            self.log(f"Starting: {filename}")

            try:
                if use_wsl:
                    success, msg = self._process_wsl(
                        filepath, output_dir, output_pdf, output_txt, deskew, clean, force_ocr
                    )
                else:
                    success, msg = self._process_python(
                        filepath, output_dir, output_pdf, output_txt
                    )

                if self.on_complete:
                    self.on_complete(filename, success, msg)

            except Exception as e:
                self.log(f"Error processing {filename}: {e}")
                if self.on_complete:
                    self.on_complete(filename, False, str(e))

    def _process_python(
        self,
        filepath: str,
        output_dir: str,
        output_pdf: bool,
        output_txt: bool,
    ) -> tuple[bool, str]:
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
                self.on_progress(filename, page_num, total_pages, "Processing")

            text = pytesseract.image_to_string(image)
            full_text += f"\n\n--- PAGE {page_num} ---\n\n{text}"

        if output_txt:
            txt_path = os.path.join(output_dir, f"{base_name}.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(full_text)
            self.log(f"  Saved: {base_name}.txt")

        if output_pdf:
            self.log("  Note: Searchable PDF output requires WSL mode.")

        return True, "Complete"

    def _process_wsl(
        self,
        filepath: str,
        output_dir: str,
        output_pdf: bool,
        output_txt: bool,
        deskew: bool,
        clean: bool,
        force_ocr: bool,
    ) -> tuple[bool, str]:
        """Process using ocrmypdf via WSL."""
        filename = os.path.basename(filepath)
        base_name = os.path.splitext(filename)[0]

        wsl_input = self._to_wsl_path(filepath)
        wsl_output_dir = self._to_wsl_path(output_dir)

        pdf_output = f"{wsl_output_dir}/{base_name}_searchable.pdf"
        txt_output = f"{wsl_output_dir}/{base_name}.txt" if output_txt else None

        cmd = ["wsl", "ocrmypdf"]

        if deskew:
            cmd.append("--deskew")
        if clean:
            cmd.append("--clean")
        if force_ocr:
            cmd.append("--force-ocr")
        if txt_output:
            cmd.extend(["--sidecar", txt_output])

        cmd.extend([wsl_input, pdf_output])

        self.log(f"  Running: {' '.join(cmd[1:5])}...")

        if self.on_progress:
            self.on_progress(filename, 0, 100, "OCRmyPDF running...")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=3600,
            )

            if result.returncode == 0:
                self.log(f"  Saved: {base_name}_searchable.pdf")
                if output_txt:
                    self.log(f"  Saved: {base_name}.txt")
                return True, "Complete"
            else:
                error_msg = result.stderr.strip() or "Unknown error"
                self.log(f"  Error: {error_msg}")
                return False, error_msg

        except subprocess.TimeoutExpired:
            return False, "Timeout (>1 hour)"
        except FileNotFoundError:
            return False, "WSL not found. Is WSL installed?"

    def _to_wsl_path(self, windows_path: str) -> str:
        """Convert Windows path to WSL path."""
        path = os.path.abspath(windows_path)
        if path[1] == ":":
            drive = path[0].lower()
            rest = path[2:].replace("\\", "/")
            return f"/mnt/{drive}{rest}"
        return path.replace("\\", "/")
