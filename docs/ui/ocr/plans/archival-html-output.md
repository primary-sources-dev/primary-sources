# Implementation Plan - Archival HTML Transcript Output

Add a new output format to the OCR tool that generates a standalone, themed HTML transcript. This allows researchers to view OCR results in a high-fidelity "Primary Sources" aesthetic without needing external Markdown viewers.

- **Status**: Proposed
- **Priority**: Medium-High
- **Owner**: Antigravity
- **Workorder ID**: WO-OCR-006

---

## 1. Executive Summary
While `.txt` and `.md` are excellent for data portability, they lack visual context. The Archival HTML output will generate a self-contained `.html` file that embeds the project's signature "Archive" styling (Inter typography, dark mode, and forensic borders). This creates a "Case File" feel that is instantly readable in any browser and print-ready.

## 2. Risk Assessment
- **Complexity**: Low (String templating in Python).
- **Breaking Changes**: None.
- **Performance**: Negligible increase in processing time.
- **Dependencies**: No external libraries; uses embedded CSS for standalone portability.

## 3. Current State Analysis
- **Worker (`ocr_worker.py`)**: Supports TXT, MD, and PDF. No logic for structured HTML rendering.
- **API (`ocr-server.py`)**: Routes expect fixed boolean flags for current formats.
- **UI (`index.html`)**: Layout accommodates three output checkboxes; needs adjustment for a fourth.

## 4. Key Features
- **Themed Rendering**: Embeds a subset of the project's CSS (Dark Archive theme).
- **Page Sectioning**: Automatically wraps "--- PAGE X ---" markers in `<section>` blocks with "Forensic Header" styles.
- **Standalone Portability**: All styles are inlined in a `<style>` block—zero external dependencies required to view.
- **Interactive Toggles**: (Future) Potential for high-light/note toggles within the HTML itself.

## 5. Implementation Phases

### Phase 1: Backend & Worker Logic
- **[WORKER-001]**: Define a `HTML_TEMPLATE` string in `ocr_worker.py` containing the core CSS and structure.
- **[WORKER-002]**: Implement logic to parse the raw OCR text and inject it into the HTML template, transforming page markers into headers.
- **[SERVER-001]**: Update `ocr-server.py` to accept `output_html` in the `/api/jobs` POST request.

### Phase 2: Frontend & UI Integration
- **[UI-001]**: Add an "Archival HTML" checkbox to the OCR tool settings.
- **[JS-001]**: Update `startProcessing` to pull the state of the new checkbox.
- **[JS-002]**: Update the queue renderer to display a `.HTML` download/view button upon completion.
- **[JS-003]**: Implement `downloadHtml` utility (matching `downloadMarkdown`).

### Phase 3: Validation & Polish
- **[TEST-001]**: Verify HTML rendering for multi-page documents.
- **[TEST-002]**: Test "Print to PDF" from the browser to ensure archival aesthetic is preserved on paper.

## 6. Testing Strategy
- **Visual Regression**: Ensure the generated HTML matches the "Primary Sources" design system.
- **Browser Compatibility**: Verify the standalone file opens correctly in Chrome, Edge, and mobile browsers.

## 7. Success Criteria
- [ ] Users can toggle "Archival HTML" as an output format.
- [ ] Generating an HTML transcript produces a single `.html` file in the processed folder.
- [ ] The output file looks visually consistent with the `features.html` page (typography/colors).
- [ ] Page breaks in the OCR output are represented as headers in the HTML view.
