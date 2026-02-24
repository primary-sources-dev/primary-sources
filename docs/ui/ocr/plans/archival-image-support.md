# Implementation Plan - Archival Image Support (Priority #5)

Add native support for common image formats (.jpg, .png, .tiff) to the OCR tool, allowing direct processing of "quick-snap" archival photos without manual PDF conversion.

- **Status**: Completed
- **Priority**: High
- **Owner**: Antigravity
- **Workorder ID**: WO-OCR-005

---

## 1. Executive Summary
Field researchers often capture single-frame images of documents using mobile devices or specialized scanners. Currently, the OCR tool only accepts PDF files, forcing a friction-heavy pre-conversion step. This plan extends the `OCRWorker` and `ocr-server` to handle direct image input streams, providing instant OCR for archival photos.

## 2. Risk Assessment
- **Complexity**: Low-Medium (Extending existing patterns).
- **Breaking Changes**: None. Backwards compatibility with PDF remains.
- **Performance**: Negligible. Image processing is generally faster than PDF page-rendering.
- **Dependencies**: PIL (Pillow) is already used; `ocrmypdf` supports image inputs.

## 3. Current State Analysis
- **Backend (`ocr-server.py`)**: `ALLOWED_EXTENSIONS` is hardcoded to `{"pdf"}`.
- **Worker (`ocr_worker.py`)**: `_process_python` expects a PDF and uses `pdf2image`. `_process_wsl` expects a PDF for `ocrmypdf`.
- **Frontend (`ocr-gui.js`)**: Filters dragged files for `application/pdf` and checks `f.type` during addition.
- **UI (`index.html`)**: `<input type="file" accept=".pdf">` limits selection.

## 4. Key Features
- **Direct Image Ingestion**: Support for `.jpg`, `.jpeg`, `.png`, `.tiff`, and `.webp`.
- **Intelligent Routing**: Worker automatically detects if input is an image or PDF.
- **Native Image OCR**: Skips PDF-to-Image conversion steps for standalone files.
- **Searchable PDF Output for Images**: WSL backend will convert images into single-page searchable PDFs.

## 5. Implementation Phases

### Phase 1: Backend & Worker Extensions
- **[WORKER-001]**: Update `ocr_worker.py` to identify file type by extension.
- **[WORKER-002]**: Modify `_process_python` to open images directly with `Image.open()` if the file is not a PDF.
- **[WORKER-003]**: Modify `_process_wsl` to pass image files to `ocrmypdf` (it supports image inputs by converting them to PDF internally).
- **[SERVER-001]**: Update `ocr-server.py` `ALLOWED_EXTENSIONS` to `{"pdf", "jpg", "jpeg", "png", "tiff", "webp"}`.

### Phase 2: Frontend & UI Integration
- **[UI-001]**: Update `index.html` file input `accept` attribute to include image extensions.
- **[JS-001]**: Update `ocr-gui.js` `handleFilesDrop` and `addFilesToQueue` to permit image MIME types (`image/jpeg`, `image/png`, etc.).
- **[JS-002]**: Update `downloadMarkdown` utility to handle non-PDF original extensions correctly.
- **[DOCS-001]**: Update Help/About text in `ocr-gui.js` to reflect new image support.

### Phase 3: Validation & Cleanup
- **[TEST-001]**: Verify OCR output for a single JPG.
- **[TEST-002]**: Verify OCR output for a multi-page TIFF (Python backend).
- **[TEST-003]**: Verify Searchable PDF creation from a PNG (WSL backend).

## 6. Testing Strategy
- **Unit Tests**: Test the worker's file-type branching logic.
- **Manual QA**: Upload images of varying resolutions and formats to ensure reliability.
- **Regression**: Ensure PDF processing remains unaffected.

## 7. Success Criteria
- [ ] OCR tool accepts `.jpg`, `.png`, and `.tiff` files.
- [ ] Processing an image produces identical `.txt` and `.md` output structures as a PDF.
- [ ] WSL backend successfully creates a searchable PDF from a raw image.
- [ ] No conversion errors when dragging a mix of PDFs and Images into the UI.
