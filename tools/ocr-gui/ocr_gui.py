"""
ocr_gui.py — Primary Sources OCR Tool

A GUI application for batch OCR processing of archival PDF documents.
Supports both Python (pytesseract) and WSL (ocrmypdf) backends.

Usage:
    python ocr_gui.py

Requirements:
    pip install customtkinter pytesseract pdf2image Pillow
"""

import os
import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox
from datetime import datetime
from pathlib import Path
from typing import Optional

import customtkinter as ctk

from ocr_worker import OCRWorker

# Help text for the instructions popup
HELP_TEXT = """
PRIMARY SOURCES — OCR TOOL
==========================

This tool converts scanned PDF documents into searchable text.

QUICK START
-----------
1. Click File → Open Files (or the Browse button) to add PDFs
2. Choose your output settings
3. Click "Start OCR"

BACKENDS
--------
• WSL (ocrmypdf): Higher quality, creates searchable PDFs.
  Requires WSL with ocrmypdf installed.
  
• Python (pytesseract): Windows-native, outputs plain text.
  Faster setup, no WSL required.

OPTIONS
-------
• Deskew: Straightens crooked scanned pages
• Clean: Removes noise/specks from old photocopies
• Force OCR: Re-processes files that already have text layers

OUTPUT
------
• Searchable PDF: Original document with invisible text layer
• Plain Text: Raw extracted text with page markers

Files are saved to the output directory shown in Settings.
The folder opens automatically when processing completes.

TIPS
----
• Process large batches overnight — OCR is CPU-intensive
• Use WSL backend for best quality on archival documents
• Check output quality on a few pages before processing entire collection
"""

# Archive color scheme
COLORS = {
    "bg": "#2E282A",
    "bg_dark": "#1A1718",
    "primary": "#B08B49",
    "secondary": "#D4CFC7",
    "heading": "#F0EDE0",
    "muted": "#6B6567",
}

# Default output directory (relative to workspace)
DEFAULT_OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "processed")
)


class FileQueue(ctk.CTkScrollableFrame):
    """Scrollable list of queued files with status indicators."""

    def __init__(self, master, height: int = 160, **kwargs):
        # enforce a fixed height to avoid the queue dominating the layout
        super().__init__(master, **kwargs)
        self.files: dict[str, dict] = {}  # filepath -> {label, status_label, status}
        self.configure(fg_color=COLORS["bg_dark"], height=height)
        # prevent geometry propagation so the container stays the configured height
        try:
            self.pack_propagate(False)
        except Exception:
            pass

        # placeholder when empty
        self._placeholder = ctk.CTkLabel(
            self,
            text="No files — click + to add",
            font=("Roboto Mono", 11),
            text_color=COLORS["muted"],
        )
        self._placeholder.place(relx=0.5, rely=0.5, anchor="center")

    def add_file(self, filepath: str):
        if filepath in self.files:
            return

        # remove placeholder when first file added
        try:
            if self._placeholder.winfo_exists():
                self._placeholder.place_forget()
        except Exception:
            pass

        filename = os.path.basename(filepath)
        # Compact single-line row
        row = ctk.CTkFrame(self, fg_color=COLORS["bg"])
        row.pack(fill="x", pady=(4, 0), padx=6)

        status_label = ctk.CTkLabel(
            row,
            text="○",
            width=26,
            font=("Segoe UI", 12),
            text_color=COLORS["muted"],
        )
        status_label.pack(side="left", padx=(6, 8))

        name_label = ctk.CTkLabel(
            row,
            text=filename,
            anchor="w",
            font=("Roboto Mono", 11),
            text_color=COLORS["secondary"],
        )
        name_label.pack(side="left", fill="x", expand=True)

        progress_label = ctk.CTkLabel(
            row,
            text="Pending",
            width=90,
            anchor="e",
            font=("Roboto Mono", 10),
            text_color=COLORS["muted"],
        )
        progress_label.pack(side="right", padx=(6, 6))

        remove_btn = ctk.CTkButton(
            row,
            text="✕",
            width=28,
            height=24,
            fg_color="transparent",
            hover_color=COLORS["bg_dark"],
            text_color=COLORS["muted"],
            command=lambda p=filepath: self.remove_file(p),
        )
        remove_btn.pack(side="right", padx=(6, 6))

        sep = ctk.CTkFrame(self, height=1, fg_color=COLORS["bg_dark"])  # thin line
        sep.pack(fill="x", padx=6, pady=(0, 2))

        self.files[filepath] = {
            "frame": row,
            "sep": sep,
            "status_label": status_label,
            "progress_label": progress_label,
            "status": "pending",
        }

    def update_status(self, filepath: str, status: str, progress_text: str = ""):
        if filepath not in self.files:
            for fp in self.files:
                if os.path.basename(fp) == filepath:
                    filepath = fp
                    break
            else:
                return

        item = self.files[filepath]
        item["status"] = status

        if status == "pending":
            item["status_label"].configure(text="○", text_color=COLORS["muted"])
            item["progress_label"].configure(text="Pending", text_color=COLORS["muted"])
        elif status == "processing":
            item["status_label"].configure(text="◐", text_color=COLORS["primary"])
            item["progress_label"].configure(
                text=progress_text or "Processing...", text_color=COLORS["primary"]
            )
        elif status == "complete":
            item["status_label"].configure(text="✓", text_color="#4CAF50")
            item["progress_label"].configure(text="Complete", text_color="#4CAF50")
        elif status == "error":
            item["status_label"].configure(text="✗", text_color="#F44336")
            item["progress_label"].configure(
                text=progress_text or "Error", text_color="#F44336"
            )

    def clear(self):
        for item in self.files.values():
            try:
                item["frame"].destroy()
            except Exception:
                pass
            try:
                if "sep" in item and item["sep"]:
                    item["sep"].destroy()
            except Exception:
                pass
        self.files.clear()
        # restore placeholder
        try:
            if not self._placeholder.winfo_ismapped():
                self._placeholder.place(relx=0.5, rely=0.5, anchor="center")
        except Exception:
            pass

    def remove_file(self, filepath: str):
        """Remove a file from the queue UI and internal state."""
        if filepath not in self.files:
            # try matching by basename
            for fp in list(self.files.keys()):
                if os.path.basename(fp) == filepath:
                    filepath = fp
                    break
            else:
                return

        item = self.files.pop(filepath)
        try:
            item["frame"].destroy()
        except Exception:
            pass
        try:
            if "sep" in item and item["sep"]:
                item["sep"].destroy()
        except Exception:
            pass

        # if now empty, show placeholder
        if not self.files:
            try:
                self._placeholder.place(relx=0.5, rely=0.5, anchor="center")
            except Exception:
                pass

    def get_filepaths(self) -> list[str]:
        return list(self.files.keys())


class OCRApp(ctk.CTk):
    """Main application window."""

    def __init__(self):
        super().__init__()

        self.title("Primary Sources — OCR Tool")
        self.geometry("700x750")
        self.configure(fg_color=COLORS["bg"])

        # Set appearance
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("dark-blue")

        self.worker: Optional[OCRWorker] = None
        self._build_ui()

    def _build_ui(self):
        # Menu bar
        self._build_menu()

        # Header
        header = ctk.CTkFrame(self, fg_color=COLORS["bg_dark"], height=60)
        header.pack(fill="x", padx=0, pady=0)
        header.pack_propagate(False)

        title = ctk.CTkLabel(
            header,
            text="PRIMARY SOURCES — OCR TOOL",
            font=("Oswald", 18, "bold"),
            text_color=COLORS["heading"],
        )
        title.pack(side="left", padx=20, pady=15)

        # Main tab view to separate Home / Queue
        self.tabview = ctk.CTkTabview(self, width=660)
        self.tabview.add("Home")
        self.tabview.add("Queue")
        self.tabview.pack(fill="both", expand=True, padx=20, pady=(10, 0))

        # Tab frames
        home_tab = self.tabview.tab("Home")
        queue_tab = self.tabview.tab("Queue")

        # Regular frame for Home tab (no scrollbar)
        home_scrollable = ctk.CTkFrame(home_tab, fg_color=COLORS["bg"])
        home_scrollable.pack(fill="both", expand=True)

        # Drop zone (Home tab)
        self.drop_frame = ctk.CTkFrame(
            home_scrollable,
            fg_color=COLORS["bg_dark"],
            border_width=2,
            border_color=COLORS["muted"],
            height=120,
        )
        self.drop_frame.pack(fill="x", padx=0, pady=(6, 10))
        self.drop_frame.pack_propagate(False)

        drop_label = ctk.CTkLabel(
            self.drop_frame,
            text="Drop PDF files here or click Browse",
            font=("Roboto Mono", 12),
            text_color=COLORS["muted"],
        )
        drop_label.pack(expand=True)

        # Add a compact '+' button inside the drop zone that opens the file dialog
        plus_btn = ctk.CTkButton(
            self.drop_frame,
            text="+",
            width=36,
            height=36,
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
            text_color=COLORS["bg_dark"],
            font=("Oswald", 14, "bold"),
            corner_radius=18,
            command=self._browse_files,
        )
        # place in the right center of the drop area
        plus_btn.place(relx=0.97, rely=0.5, anchor="e")

        # Make the entire drop frame clickable to open the file browser
        def _dropframe_click(event=None):
            self._browse_files()

        self.drop_frame.bind("<Button-1>", _dropframe_click)

        # Hover feedback: highlight border when mouse over drop area
        def _on_enter(e=None):
            try:
                self.drop_frame.configure(border_color=COLORS["primary"])
            except Exception:
                pass

        def _on_leave(e=None):
            try:
                self.drop_frame.configure(border_color=COLORS["muted"])
            except Exception:
                pass

        self.drop_frame.bind("<Enter>", _on_enter)
        self.drop_frame.bind("<Leave>", _on_leave)

        # (Removed old external Browse button; '+' inside drop zone handles file selection)

        # Settings section (moved to Home tab)
        settings_label = ctk.CTkLabel(
            home_scrollable,
            text="SETTINGS",
            font=("Oswald", 14, "bold"),
            text_color=COLORS["primary"],
            anchor="w",
        )
        settings_label.pack(fill="x", padx=10, pady=(6, 6))

        # Settings container with visible border for clarity
        settings_frame = ctk.CTkFrame(
            home_scrollable, 
            fg_color=COLORS["bg_dark"],
            border_width=1,
            border_color=COLORS["muted"]
        )
        settings_frame.pack(fill="x", padx=10, pady=(0, 10))

        # Backend selection
        backend_frame = ctk.CTkFrame(settings_frame, fg_color="transparent")
        backend_frame.pack(fill="x", padx=15, pady=(12, 10))

        ctk.CTkLabel(
            backend_frame,
            text="Backend:",
            font=("Roboto Mono", 11),
            text_color=COLORS["primary"],
            width=60,
            anchor="w",
        ).pack(side="left")

        self.backend_var = ctk.StringVar(value="wsl")
        ctk.CTkRadioButton(
            backend_frame,
            text="WSL (ocrmypdf)",
            variable=self.backend_var,
            value="wsl",
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
        ).pack(side="left", padx=(10, 15))

        ctk.CTkRadioButton(
            backend_frame,
            text="Python (pytesseract)",
            variable=self.backend_var,
            value="python",
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
        ).pack(side="left")

        # Output options
        output_frame = ctk.CTkFrame(settings_frame, fg_color="transparent")
        output_frame.pack(fill="x", padx=15, pady=(0, 10))

        ctk.CTkLabel(
            output_frame,
            text="Output:",
            font=("Roboto Mono", 11),
            text_color=COLORS["primary"],
            width=60,
            anchor="w",
        ).pack(side="left")

        self.output_pdf_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(
            output_frame,
            text="Searchable PDF",
            variable=self.output_pdf_var,
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
        ).pack(side="left", padx=(10, 15))

        self.output_txt_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(
            output_frame,
            text="Plain Text",
            variable=self.output_txt_var,
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
        ).pack(side="left")

        # OCR options
        options_frame = ctk.CTkFrame(settings_frame, fg_color="transparent")
        options_frame.pack(fill="x", padx=15, pady=(0, 10))

        ctk.CTkLabel(
            options_frame,
            text="Options:",
            font=("Roboto Mono", 11),
            text_color=COLORS["primary"],
            width=60,
            anchor="w",
        ).pack(side="left")

        self.deskew_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(
            options_frame,
            text="Deskew",
            variable=self.deskew_var,
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
        ).pack(side="left", padx=(10, 15))

        self.clean_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(
            options_frame,
            text="Clean",
            variable=self.clean_var,
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
        ).pack(side="left", padx=(0, 15))

        self.force_var = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(
            options_frame,
            text="Force OCR",
            variable=self.force_var,
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
        ).pack(side="left")

        # Output directory (label on top, entry + buttons below)
        dir_label_frame = ctk.CTkFrame(settings_frame, fg_color="transparent")
        dir_label_frame.pack(fill="x", padx=15, pady=(0, 5))

        ctk.CTkLabel(
            dir_label_frame,
            text="Save to:",
            font=("Roboto Mono", 11),
            text_color=COLORS["primary"],
            anchor="w",
        ).pack(fill="x")

        # Entry field and buttons on second row
        dir_entry_frame = ctk.CTkFrame(settings_frame, fg_color="transparent")
        dir_entry_frame.pack(fill="x", padx=15, pady=(0, 12))

        self.output_dir_var = ctk.StringVar(value=DEFAULT_OUTPUT_DIR)
        # Reduce width to allow buttons to fit alongside
        self.output_dir_entry = ctk.CTkEntry(
            dir_entry_frame,
            textvariable=self.output_dir_var,
            font=("Roboto Mono", 10),
            fg_color=COLORS["bg_dark"],
            border_color=COLORS["primary"],
            text_color=COLORS["secondary"],
            width=280,
        )
        self.output_dir_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))

        # Change directory button
        ctk.CTkButton(
            dir_entry_frame,
            text="Change...",
            font=("Roboto Mono", 9),
            fg_color="transparent",
            hover_color=COLORS["bg"],
            text_color=COLORS["primary"],
            border_width=1,
            border_color=COLORS["primary"],
            width=70,
            height=28,
            command=self._browse_output_dir,
        ).pack(side="left", padx=(0, 6))

        # Open output folder quickly
        ctk.CTkButton(
            dir_entry_frame,
            text="Open",
            font=("Roboto Mono", 9),
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
            text_color=COLORS["bg_dark"],
            width=60,
            height=28,
            command=self._open_output_folder,
        ).pack(side="left")

        # UX: double-click the path to copy it to clipboard
        def _bind_copy(event=None):
            path = self.output_dir_var.get()
            try:
                self.clipboard_clear()
                self.clipboard_append(path)
                self._log(f"Output path copied to clipboard: {path}")
            except Exception:
                pass

        self.output_dir_entry.bind("<Double-Button-1>", _bind_copy)

        # Start button (Home tab, at the bottom)
        home_button_frame = ctk.CTkFrame(home_scrollable, fg_color="transparent")
        home_button_frame.pack(fill="x", padx=10, pady=20)

        self.start_btn = ctk.CTkButton(
            home_button_frame,
            text="Start OCR",
            font=("Oswald", 14, "bold"),
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
            text_color=COLORS["bg_dark"],
            width=150,
            height=45,
            command=self._start_ocr,
        )
        self.start_btn.pack(side="left", expand=True)

        self.cancel_btn = ctk.CTkButton(
            home_button_frame,
            text="Cancel",
            font=("Oswald", 14, "bold"),
            fg_color="transparent",
            hover_color=COLORS["bg_dark"],
            text_color=COLORS["secondary"],
            border_width=1,
            border_color=COLORS["secondary"],
            width=150,
            height=45,
            command=self._cancel_ocr,
            state="disabled",
        )
        self.cancel_btn.pack(side="left", expand=True, padx=(20, 0))

        # Log section (place in Queue tab)
        log_label = ctk.CTkLabel(
            queue_tab,
            text="QUEUE",
            font=("Oswald", 14, "bold"),
            text_color=COLORS["primary"],
            anchor="w",
        )
        log_label.pack(fill="x", padx=10, pady=(12, 6))

        # smaller fixed-height queue to preserve vertical space
        self.queue = FileQueue(queue_tab, height=160)
        self.queue.pack(fill="x", padx=10)

        clear_btn = ctk.CTkButton(
            queue_tab,
            text="Clear Queue",
            font=("Roboto Mono", 10),
            fg_color="transparent",
            hover_color=COLORS["bg_dark"],
            text_color=COLORS["muted"],
            border_width=1,
            border_color=COLORS["muted"],
            width=100,
            height=28,
            command=self._clear_queue,
        )
        clear_btn.pack(anchor="e", padx=10, pady=(5, 0))

        # Log section (place in Queue tab)
        log_label = ctk.CTkLabel(
            queue_tab,
            text="LOG",
            font=("Oswald", 14, "bold"),
            text_color=COLORS["primary"],
            anchor="w",
        )
        log_label.pack(fill="x", padx=10, pady=(12, 5))

        self.log_text = ctk.CTkTextbox(
            queue_tab,
            height=120,
            font=("Roboto Mono", 10),
            fg_color=COLORS["bg_dark"],
            text_color=COLORS["muted"],
            border_width=0,
        )
        self.log_text.pack(fill="x", padx=10)

        # Enable drag and drop
        self._setup_dnd()

    def _build_menu(self):
        """Create the menu bar with File and Help menus."""
        menubar = tk.Menu(self, bg=COLORS["bg_dark"], fg=COLORS["secondary"],
                          activebackground=COLORS["primary"], activeforeground=COLORS["bg_dark"],
                          relief="flat", borderwidth=0)

        # File menu
        file_menu = tk.Menu(menubar, tearoff=0, bg=COLORS["bg_dark"], fg=COLORS["secondary"],
                            activebackground=COLORS["primary"], activeforeground=COLORS["bg_dark"])
        file_menu.add_command(label="Open Files...", command=self._browse_files, accelerator="Ctrl+O")
        file_menu.add_command(label="Set Output Directory...", command=self._browse_output_dir)
        file_menu.add_separator()
        file_menu.add_command(label="Open Output Folder", command=self._open_output_folder)
        file_menu.add_command(label="Open Raw Materials", command=self._open_raw_materials)
        file_menu.add_separator()
        file_menu.add_command(label="Clear Queue", command=self._clear_queue)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.quit, accelerator="Alt+F4")
        menubar.add_cascade(label="File", menu=file_menu)

        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0, bg=COLORS["bg_dark"], fg=COLORS["secondary"],
                            activebackground=COLORS["primary"], activeforeground=COLORS["bg_dark"])
        help_menu.add_command(label="How to Use", command=self._show_help)
        help_menu.add_separator()
        help_menu.add_command(label="About", command=self._show_about)
        menubar.add_cascade(label="Help", menu=help_menu)

        self.configure(menu=menubar)

        # Keyboard shortcuts
        self.bind("<Control-o>", lambda e: self._browse_files())

    def _open_output_folder(self):
        """Open the output directory in Explorer."""
        output_dir = self.output_dir_var.get()
        if os.path.isdir(output_dir):
            subprocess.run(["explorer", output_dir], shell=True)
        else:
            os.makedirs(output_dir, exist_ok=True)
            subprocess.run(["explorer", output_dir], shell=True)

    def _open_raw_materials(self):
        """Open the raw-material directory in Explorer."""
        raw_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "raw-material")
        )
        if os.path.isdir(raw_dir):
            subprocess.run(["explorer", raw_dir], shell=True)
        else:
            messagebox.showwarning("Not Found", f"Raw materials folder not found:\n{raw_dir}")

    def _show_help(self):
        """Show the help/instructions popup."""
        help_window = ctk.CTkToplevel(self)
        help_window.title("How to Use — OCR Tool")
        help_window.geometry("550x600")
        help_window.configure(fg_color=COLORS["bg"])
        help_window.transient(self)
        help_window.grab_set()

        # Header
        header = ctk.CTkFrame(help_window, fg_color=COLORS["bg_dark"], height=50)
        header.pack(fill="x")
        header.pack_propagate(False)

        ctk.CTkLabel(
            header,
            text="HOW TO USE",
            font=("Oswald", 16, "bold"),
            text_color=COLORS["heading"],
        ).pack(side="left", padx=20, pady=12)

        # Help text
        text_frame = ctk.CTkScrollableFrame(help_window, fg_color=COLORS["bg_dark"])
        text_frame.pack(fill="both", expand=True, padx=20, pady=20)

        help_label = ctk.CTkLabel(
            text_frame,
            text=HELP_TEXT.strip(),
            font=("Roboto Mono", 11),
            text_color=COLORS["secondary"],
            justify="left",
            anchor="nw",
            wraplength=480,
        )
        help_label.pack(fill="both", expand=True, padx=10, pady=10)

        # Close button
        ctk.CTkButton(
            help_window,
            text="Close",
            font=("Oswald", 12, "bold"),
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
            text_color=COLORS["bg_dark"],
            width=100,
            command=help_window.destroy,
        ).pack(pady=15)

    def _show_about(self):
        """Show the about dialog."""
        about_window = ctk.CTkToplevel(self)
        about_window.title("About")
        about_window.geometry("400x250")
        about_window.configure(fg_color=COLORS["bg"])
        about_window.transient(self)
        about_window.grab_set()
        about_window.resizable(False, False)

        ctk.CTkLabel(
            about_window,
            text="PRIMARY SOURCES",
            font=("Oswald", 24, "bold"),
            text_color=COLORS["heading"],
        ).pack(pady=(30, 5))

        ctk.CTkLabel(
            about_window,
            text="OCR TOOL",
            font=("Oswald", 16),
            text_color=COLORS["primary"],
        ).pack()

        ctk.CTkLabel(
            about_window,
            text="Version 1.0",
            font=("Roboto Mono", 11),
            text_color=COLORS["muted"],
        ).pack(pady=(20, 5))

        ctk.CTkLabel(
            about_window,
            text="Batch OCR processing for archival PDF documents",
            font=("Roboto Mono", 10),
            text_color=COLORS["secondary"],
        ).pack()

        ctk.CTkButton(
            about_window,
            text="OK",
            font=("Oswald", 12, "bold"),
            fg_color=COLORS["primary"],
            hover_color="#9A7A3F",
            text_color=COLORS["bg_dark"],
            width=80,
            command=about_window.destroy,
        ).pack(pady=25)

    def _setup_dnd(self):
        """Set up drag-and-drop support (optional, fails silently)."""
        pass

    def _on_drop(self, event):
        """Handle dropped files."""
        files = self.tk.splitlist(event.data)
        for f in files:
            if f.lower().endswith(".pdf"):
                self.queue.add_file(f)

    def _browse_files(self):
        files = filedialog.askopenfilenames(
            title="Select PDF files",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")],
        )
        for f in files:
            self.queue.add_file(f)

    def _browse_output_dir(self):
        directory = filedialog.askdirectory(title="Select output directory")
        if directory:
            self.output_dir_var.set(directory)

    def _clear_queue(self):
        self.queue.clear()

    def _log(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert("end", f"[{timestamp}] {message}\n")
        self.log_text.see("end")

    def _on_progress(self, filename: str, current: int, total: int, status: str):
        if total > 0:
            pct = int((current / total) * 100)
            progress_text = f"{pct}%"
        else:
            progress_text = status
        self.after(0, lambda: self.queue.update_status(filename, "processing", progress_text))

    def _on_complete(self, filename: str, success: bool, message: str):
        status = "complete" if success else "error"
        self.after(0, lambda: self.queue.update_status(filename, status, message))

        all_files = self.queue.get_filepaths()
        all_done = all(
            self.queue.files[f]["status"] in ("complete", "error") for f in all_files
        )

        if all_done:
            self.after(0, self._on_batch_complete)

    def _on_batch_complete(self):
        self._log("Batch complete!")
        self.start_btn.configure(state="normal")
        self.cancel_btn.configure(state="disabled")

        output_dir = self.output_dir_var.get()
        if os.path.isdir(output_dir):
            self._log(f"Opening output folder: {output_dir}")
            subprocess.run(["explorer", output_dir], shell=True)

    def _start_ocr(self):
        files = self.queue.get_filepaths()
        if not files:
            self._log("No files in queue.")
            return

        self.start_btn.configure(state="disabled")
        self.cancel_btn.configure(state="normal")

        for f in files:
            self.queue.update_status(f, "pending")

        self.worker = OCRWorker(
            on_progress=self._on_progress,
            on_complete=self._on_complete,
            on_log=lambda msg: self.after(0, lambda m=msg: self._log(m)),
        )

        self.worker.process_batch(
            files=files,
            output_dir=self.output_dir_var.get(),
            use_wsl=(self.backend_var.get() == "wsl"),
            output_pdf=self.output_pdf_var.get(),
            output_txt=self.output_txt_var.get(),
            deskew=self.deskew_var.get(),
            clean=self.clean_var.get(),
            force_ocr=self.force_var.get(),
        )

    def _cancel_ocr(self):
        if self.worker:
            self.worker.cancel()
            self._log("Cancelling...")
            self.cancel_btn.configure(state="disabled")


if __name__ == "__main__":
    app = OCRApp()
    app.mainloop()
