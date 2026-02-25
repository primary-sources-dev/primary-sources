"""
classifier_test_html.py — Generate Interactive HTML Classification Report

Creates an HTML page for human review of document classification results.
User can mark each classification as correct/incorrect and specify the correct type.
Feedback is saved to localStorage and can be exported as JSON.

Integrates:
- Document Classifier (type detection)
- Metadata Parser (header/footer extraction)
- Entity Linker (people/places database matching)
"""

import sys
import json
import fitz  # PyMuPDF
from pathlib import Path
from datetime import datetime
import html

# Add ocr-gui to path for imports
sys.path.insert(0, str(Path(__file__).parent / "ocr-gui"))

from document_classifier import classify_document, DocType, get_all_scores
from metadata_parser import MetadataParser

# Entity linker requires data files
ENTITY_LINKER_AVAILABLE = False
try:
    from entity_linker import EntityLinker
    DATA_DIR = Path(__file__).parent.parent / "docs" / "ui" / "assets" / "data"
    if (DATA_DIR / "people.json").exists():
        entity_linker = EntityLinker(DATA_DIR)
        ENTITY_LINKER_AVAILABLE = True
        print(f"Entity Linker: Loaded {len(entity_linker.people)} people, {len(entity_linker.places)} places")
except Exception as e:
    print(f"Entity Linker: Not available ({e})")
    entity_linker = None

# Initialize metadata parser
metadata_parser = MetadataParser()

def extract_page_text(pdf_path: str, page_num: int) -> str:
    """Extract text from a specific page of a PDF."""
    doc = fitz.open(pdf_path)
    if page_num < 0 or page_num >= len(doc):
        return ""
    page = doc[page_num]
    text = page.get_text()
    doc.close()
    return text


def test_pages(pdf_path: str, page_numbers: list[int]) -> list[dict]:
    """Test classification on multiple pages."""
    results = []
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    doc.close()
    
    print(f"Processing {len(page_numbers)} pages from {Path(pdf_path).name}...")
    
    for i, page_num in enumerate(page_numbers):
        if page_num >= total_pages:
            continue
        
        print(f"  Page {page_num + 1} ({i+1}/{len(page_numbers)})", end="  ")
            
        text = extract_page_text(pdf_path, page_num)
        
        if not text.strip():
            results.append({
                "page": page_num + 1,
                "page_index": page_num,  # 0-indexed for PDF.js
                "doc_type": "NO_TEXT",
                "confidence": 0,
                "matched_patterns": [],
                "all_scores": {},
                "text_preview": "[Empty or image-only page]",
                "text_length": 0,
                "highlight_terms": [],
            })
            continue
        
        # Classify
        result = classify_document(text)
        all_scores = get_all_scores(text)
        
        # Parse metadata (header + footer)
        metadata = metadata_parser.parse(text)
        metadata_dict = metadata.to_dict()
        
        # Extract entities
        entities = []
        if ENTITY_LINKER_AVAILABLE and entity_linker:
            try:
                entities = entity_linker.link_entities(text)
            except Exception:
                pass
        
        # Extract highlight terms from matched patterns
        # Patterns can be:
        # - Raw regex: "FEDERAL BUREAU OF INVESTIGATION"
        # - Fuzzy match: "[fuzzy] FEDERAL BUREAU OF INVESTIGATION (90%)"
        highlight_terms = []
        for pattern in result.matched_patterns[:8]:
            term = pattern
            # Handle fuzzy prefix
            if term.startswith("[fuzzy]"):
                term = term.replace("[fuzzy]", "").strip()
            # Remove percentage suffix like "(90%)"
            if "(" in term and "%" in term:
                term = term.rsplit("(", 1)[0].strip()
            # Skip pure regex patterns (contain special chars like \s, ^, $, etc)
            if any(c in term for c in ['\\', '^', '$', '+', '*', '?', '[', ']', '{', '}']):
                continue
            # Clean and validate
            term = term.strip()
            if term and len(term) >= 4 and len(term) <= 50:
                highlight_terms.append(term)
        
        # Clean text for HTML display
        preview = text[:800].strip()
        
        results.append({
            "page": page_num + 1,
            "page_index": page_num,  # 0-indexed for PDF.js
            "doc_type": result.doc_type.value,
            "confidence": round(result.confidence, 3),
            "matched_patterns": result.matched_patterns[:5],
            "all_scores": {k: round(v, 3) for k, v in all_scores.items() if v > 0.05},
            "text_preview": preview,
            "text_length": len(text),
            "highlight_terms": highlight_terms,
            # New: Metadata extraction
            "metadata": {
                "rif_number": metadata_dict.get("rif_number", {}).get("value") if metadata_dict.get("rif_number") else None,
                "agency": metadata_dict.get("agency", {}).get("value") if metadata_dict.get("agency") else None,
                "date": metadata_dict.get("date", {}).get("value") if metadata_dict.get("date") else None,
                "date_iso": metadata_dict.get("date_iso"),
                "author": metadata_dict.get("author", {}).get("value") if metadata_dict.get("author") else None,
                "footer_author": metadata_dict.get("footer_author", {}).get("value") if metadata_dict.get("footer_author") else None,
                "footer_file": metadata_dict.get("footer_file_number", {}).get("value") if metadata_dict.get("footer_file_number") else None,
            },
            # New: Entity links
            "entities": entities[:10],  # Limit to first 10
        })
    
    print(f"\nProcessed {len(results)} pages.")
    return results

def generate_metadata_html(metadata: dict) -> str:
    """Generate HTML for extracted metadata fields."""
    if not metadata or not any(metadata.values()):
        return ""
    
    fields = []
    if metadata.get("rif_number"):
        fields.append(f'<span class="mr-3"><b>RIF:</b> {html.escape(str(metadata["rif_number"]))}</span>')
    if metadata.get("agency"):
        fields.append(f'<span class="mr-3"><b>Agency:</b> {html.escape(str(metadata["agency"]))}</span>')
    if metadata.get("date"):
        date_str = metadata.get("date_iso") or metadata.get("date")
        fields.append(f'<span class="mr-3"><b>Date:</b> {html.escape(str(date_str))}</span>')
    if metadata.get("author") or metadata.get("footer_author"):
        author = metadata.get("author") or metadata.get("footer_author")
        fields.append(f'<span class="mr-3"><b>Author:</b> {html.escape(str(author))}</span>')
    if metadata.get("footer_file"):
        fields.append(f'<span class="mr-3"><b>File#:</b> {html.escape(str(metadata["footer_file"]))}</span>')
    
    if not fields:
        return ""
    
    return f'''<div class="mb-2 p-2 text-xs" style="background: rgba(176, 139, 73, 0.1); border-left: 2px solid var(--primary); border-radius: 2px;">
                            <span class="opacity-60">Metadata:</span> {"".join(fields)}
                        </div>'''


def generate_entities_html(entities: list) -> str:
    """Generate HTML for linked entities."""
    if not entities:
        return ""
    
    people = [e for e in entities if e.get("type") == "PERSON"]
    places = [e for e in entities if e.get("type") == "PLACE"]
    
    parts = []
    if people:
        names = [f'<span class="text-blue-300">{html.escape(e.get("label", e.get("matched_text", "?")))}</span>' for e in people[:5]]
        parts.append(f'<b>People:</b> {", ".join(names)}')
    if places:
        names = [f'<span class="text-green-300">{html.escape(e.get("label", e.get("matched_text", "?")))}</span>' for e in places[:5]]
        parts.append(f'<b>Places:</b> {", ".join(names)}')
    
    if not parts:
        return ""
    
    return f'''<div class="mb-2 p-2 text-xs" style="background: rgba(100, 149, 237, 0.1); border-left: 2px solid cornflowerblue; border-radius: 2px;">
                            <span class="opacity-60">Entities:</span> {" &bull; ".join(parts)}
                        </div>'''


def generate_html_report(results: list[dict], pdf_name: str, pdf_path: str, output_path: str):
    """Generate interactive HTML report."""
    
    # All document types for dropdown
    doc_types = [t.value for t in DocType]
    
    # Absolute path from server root (leading slash)
    pdf_relative = "/" + pdf_path.replace(chr(92), '/')
    
    html_content = f'''<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Classification Review: {html.escape(pdf_name)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
    <style>
        :root {{
            --primary: #B08B49;
            --primary-light: #c9a15e;
            --archive-bg: #2E282A;
            --archive-surface: #252021;
            --archive-secondary: #D4CFC7;
            --archive-heading: #F0EDE0;
            --archive-dark: #1A1718;
        }}
        body {{
            font-family: 'Roboto Mono', monospace;
            background-color: var(--archive-bg);
            color: var(--archive-secondary);
        }}
        h1, h2, h3 {{
            font-family: 'Oswald', sans-serif;
            text-transform: uppercase;
            color: var(--archive-heading);
        }}
        .correct {{ background-color: rgba(34, 197, 94, 0.12) !important; border-color: #22c55e !important; }}
        .incorrect {{ background-color: rgba(239, 68, 68, 0.12) !important; border-color: #ef4444 !important; }}
        .pending {{ background-color: var(--archive-surface) !important; border-color: rgba(176, 139, 73, 0.4) !important; }}
        pre {{ white-space: pre-wrap; word-wrap: break-word; font-size: 11px; }}
        .card {{ background-color: var(--archive-surface); border-color: rgba(176, 139, 73, 0.3); }}
        .card.hidden {{ display: none; }}
        .pdf-canvas {{ max-height: 500px; width: auto; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }}
        .pdf-canvas:hover {{ border-color: var(--primary); }}
        .canvas-container {{ position: relative; display: inline-block; }}
        .canvas-loading {{ position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--primary); }}
        .image-modal {{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; justify-content: center; align-items: center; }}
        .image-modal.active {{ display: flex; }}
        .image-modal canvas {{ max-width: 95%; max-height: 95%; }}
        
        /* Text layer highlighting */
        .text-layer {{ position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; opacity: 0.3; line-height: 1; pointer-events: none; }}
        .text-layer span {{ position: absolute; white-space: pre; color: transparent; }}
        .text-layer .highlight {{ background-color: #B08B49; color: transparent; border-radius: 2px; }}
        
        /* Type buttons */
        .type-btn {{ 
            padding: 4px 8px; 
            font-size: 11px; 
            font-family: 'Roboto Mono', monospace;
            background: rgba(0,0,0,0.3); 
            border: 1px solid rgba(255,255,255,0.15); 
            color: var(--archive-secondary);
            cursor: pointer;
            transition: all 0.15s;
            border-radius: 2px;
        }}
        .type-btn:hover {{ background: rgba(255,255,255,0.1); border-color: var(--primary); }}
        .type-btn.predicted {{ 
            background: rgba(176, 139, 73, 0.25); 
            border-color: var(--primary); 
            border-width: 2px;
            color: var(--archive-heading);
            font-weight: bold;
        }}
        .type-btn.selected {{ 
            background: #22c55e; 
            border-color: #22c55e; 
            color: #000;
            font-weight: bold;
        }}
        .type-btn.selected.wrong {{
            background: #ef4444;
            border-color: #ef4444;
        }}
        details[open] summary {{ opacity: 0.7; }}
    </style>
</head>
<body class="p-6">
    <script>
        // PDF.js setup
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const PDF_URL = '{pdf_relative}';
        let pdfDoc = null;
        
        async function loadPDF() {{
            try {{
                console.log('Loading PDF from:', PDF_URL);
                const loadingTask = pdfjsLib.getDocument(PDF_URL);
                pdfDoc = await loadingTask.promise;
                console.log('PDF loaded successfully:', pdfDoc.numPages, 'pages');
                renderAllPages();
            }} catch (err) {{
                console.error('Failed to load PDF:', err);
                document.querySelectorAll('.canvas-loading').forEach(el => {{
                    el.textContent = 'PDF load failed';
                    el.style.color = 'red';
                }});
            }}
        }}
        
        // Store highlight terms for each page
        const pageHighlights = {{}};
        
        async function renderPage(pageIndex, canvasId, scale = 1.5) {{
            try {{
                if (!pdfDoc) {{
                    console.error('No PDF document loaded');
                    return;
                }}
                const page = await pdfDoc.getPage(pageIndex + 1); // PDF.js is 1-indexed
                const viewport = page.getViewport({{ scale }});
                const canvas = document.getElementById(canvasId);
                if (!canvas) {{
                    console.error('Canvas not found:', canvasId);
                    return;
                }}
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({{ canvasContext: ctx, viewport }}).promise;
                
                // Get highlight terms for this page
                const card = canvas.closest('[data-page-index]');
                const highlightTerms = card ? (pageHighlights[pageIndex] || []) : [];
                
                // Render text layer with highlights if we have terms
                if (highlightTerms.length > 0) {{
                    await renderTextLayer(page, canvas, viewport, highlightTerms);
                }}
                
                // Remove loading indicator
                const loading = canvas.parentElement.querySelector('.canvas-loading');
                if (loading) loading.remove();
            }} catch (err) {{
                console.error('Failed to render page', pageIndex, err);
            }}
        }}
        
        async function renderTextLayer(page, canvas, viewport, highlightTerms) {{
            try {{
                const textContent = await page.getTextContent();
                const container = canvas.parentElement;
                
                // Create or get text layer div
                let textLayer = container.querySelector('.text-layer');
                if (!textLayer) {{
                    textLayer = document.createElement('div');
                    textLayer.className = 'text-layer';
                    textLayer.style.width = canvas.width + 'px';
                    textLayer.style.height = canvas.height + 'px';
                    container.appendChild(textLayer);
                }}
                
                // Clear existing content
                textLayer.innerHTML = '';
                
                // Build regex for all highlight terms
                const escapedTerms = highlightTerms.map(t => t.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&'));
                const highlightRegex = new RegExp('(' + escapedTerms.join('|') + ')', 'gi');
                
                // Process text items
                for (const item of textContent.items) {{
                    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                    const span = document.createElement('span');
                    
                    // Check if this text contains any highlight terms
                    const text = item.str;
                    if (highlightRegex.test(text)) {{
                        span.className = 'highlight';
                    }}
                    highlightRegex.lastIndex = 0; // Reset regex
                    
                    span.textContent = text;
                    span.style.left = tx[4] + 'px';
                    span.style.top = (canvas.height - tx[5]) + 'px';
                    span.style.fontSize = Math.abs(tx[0]) + 'px';
                    span.style.fontFamily = item.fontName || 'sans-serif';
                    
                    textLayer.appendChild(span);
                }}
            }} catch (err) {{
                console.error('Failed to render text layer', err);
            }}
        }}
        
        function renderAllPages() {{
            const cards = document.querySelectorAll('[data-page-index]');
            console.log('Found', cards.length, 'page cards to render');
            cards.forEach(el => {{
                const pageIndex = parseInt(el.dataset.pageIndex);
                const canvasId = `canvas-${{pageIndex}}`;
                
                // Store highlight terms for this page
                try {{
                    const highlights = JSON.parse(el.dataset.highlights || '[]');
                    if (highlights.length > 0) {{
                        pageHighlights[pageIndex] = highlights;
                        console.log('Page', pageIndex, 'highlights:', highlights);
                    }}
                }} catch (e) {{
                    console.warn('Failed to parse highlights for page', pageIndex);
                }}
                
                console.log('Rendering page index:', pageIndex, 'canvas:', canvasId);
                renderPage(pageIndex, canvasId);
            }});
        }}
        
        // Load PDF when page loads
        document.addEventListener('DOMContentLoaded', () => {{
            console.log('DOM ready, starting PDF load');
            loadPDF();
        }});
    </script>
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-2xl font-bold mb-2">Document Classification Review</h1>
            <p class="text-sm opacity-60">{html.escape(pdf_name)} &bull; {len(results)} pages &bull; Generated {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
        </div>
        
        <!-- Summary Stats -->
        <div id="stats" class="card border p-4 mb-6">
            <h2 class="text-lg font-bold mb-3">Summary</h2>
            <div id="stats-content" class="grid grid-cols-4 gap-4 text-sm mb-4">
                <div><span class="opacity-60">Total:</span> <span id="stat-total">{len(results)}</span></div>
                <div><span class="opacity-60">Reviewed:</span> <span id="stat-reviewed">0</span></div>
                <div class="text-green-400"><span>Correct:</span> <span id="stat-correct">0</span></div>
                <div class="text-red-400"><span>Incorrect:</span> <span id="stat-incorrect">0</span></div>
            </div>
            
            <!-- Filters -->
            <div class="flex flex-wrap gap-4 mb-4 text-sm">
                <div>
                    <label class="opacity-60 mr-2">Filter Type:</label>
                    <select id="filter-type" onchange="applyFilters()" style="background: var(--archive-dark); border: 1px solid rgba(255,255,255,0.2); color: var(--archive-secondary); padding: 4px 8px;">
                        <option value="">All Types</option>
                        {"".join([f'<option value="{t}">{t}</option>' for t in doc_types])}
                    </select>
                </div>
                <div>
                    <label class="opacity-60 mr-2">Sort:</label>
                    <select id="sort-order" onchange="applyFilters()" style="background: var(--archive-dark); border: 1px solid rgba(255,255,255,0.2); color: var(--archive-secondary); padding: 4px 8px;">
                        <option value="page-asc">Page (1→N)</option>
                        <option value="page-desc">Page (N→1)</option>
                        <option value="conf-desc">Confidence (High→Low)</option>
                        <option value="conf-asc">Confidence (Low→High)</option>
                    </select>
                </div>
                <div>
                    <label class="opacity-60 mr-2">Show:</label>
                    <select id="filter-status" onchange="applyFilters()" style="background: var(--archive-dark); border: 1px solid rgba(255,255,255,0.2); color: var(--archive-secondary); padding: 4px 8px;">
                        <option value="">All</option>
                        <option value="pending">Pending Only</option>
                        <option value="correct">Correct Only</option>
                        <option value="incorrect">Incorrect Only</option>
                    </select>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="exportFeedback()" class="px-4 py-2 font-bold text-sm" style="background-color: var(--primary); color: var(--archive-dark);">
                    Export Feedback JSON
                </button>
                <button onclick="clearFeedback()" class="px-4 py-2 text-sm" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                    Clear All
                </button>
            </div>
        </div>
        
        <!-- Results -->
        <div class="space-y-4">
'''
    
    for r in results:
        page = r["page"]
        doc_type = r["doc_type"]
        conf = r["confidence"]
        conf_pct = f"{conf:.0%}" if conf > 0 else "-"
        preview = html.escape(r["text_preview"])
        patterns = r["matched_patterns"]
        all_scores = r["all_scores"]
        page_index = r.get("page_index", page - 1)
        highlight_terms = r.get("highlight_terms", [])
        highlight_json = json.dumps(highlight_terms)
        
        # New: Metadata and entities
        metadata = r.get("metadata", {})
        entities = r.get("entities", [])
        
        # Confidence color
        if conf >= 0.7:
            conf_color = "text-green-400"
        elif conf >= 0.4:
            conf_color = "text-yellow-400"
        else:
            conf_color = "text-red-400"
        
        # Top 3 alternative scores
        alt_scores = sorted(all_scores.items(), key=lambda x: -x[1])[:3]
        alt_html = " | ".join([f"{t}: {s:.0%}" for t, s in alt_scores]) if alt_scores else "-"
        
        # Canvas HTML for PDF.js rendering
        canvas_html = f'''<div class="canvas-container">
                            <canvas id="canvas-{page_index}" class="pdf-canvas" onclick="showModalPage({page_index})"></canvas>
                            <div class="canvas-loading">Loading...</div>
                        </div>'''
        
        # Sort types by confidence score - top alternatives first
        sorted_types = sorted(all_scores.items(), key=lambda x: -x[1])
        top_types = [t for t, s in sorted_types[:4]]  # Top 4 by score
        
        # Ensure predicted type is in top row even if low confidence
        if doc_type not in top_types:
            top_types = [doc_type] + top_types[:3]
        
        # Remaining types (alphabetical)
        other_types = sorted([t for t in doc_types if t not in top_types])
        
        # Generate top row buttons (predicted + top alternatives)
        top_buttons = []
        for t in top_types:
            score = all_scores.get(t, 0)
            score_pct = f"{score:.0%}" if score > 0 else ""
            if t == doc_type:
                top_buttons.append(f'<button onclick="selectType({page}, \'{t}\')" class="type-btn predicted" data-type="{t}">{t} <span class="opacity-60">{score_pct}</span></button>')
            else:
                top_buttons.append(f'<button onclick="selectType({page}, \'{t}\')" class="type-btn" data-type="{t}">{t} <span class="opacity-60">{score_pct}</span></button>')
        top_buttons_html = "".join(top_buttons)
        
        # Generate other buttons (collapsed)
        other_buttons = []
        for t in other_types:
            other_buttons.append(f'<button onclick="selectType({page}, \'{t}\')" class="type-btn" data-type="{t}">{t}</button>')
        other_buttons_html = "".join(other_buttons)
        
        html_content += f'''
            <div id="page-{page}" class="card border p-4 pending" data-page="{page}" data-page-index="{page_index}" data-predicted="{doc_type}" data-confidence="{conf}" data-highlights='{highlight_json}'>
                <div class="flex gap-6">
                    <!-- Left: PDF Page (rendered by PDF.js) -->
                    <div class="flex-shrink-0">
                        {canvas_html}
                    </div>
                    
                    <!-- Right: Classification Details -->
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="font-bold text-lg" style="color: var(--primary);">Page {page}</span>
                                <span class="ml-2 {conf_color} text-sm">{conf_pct}</span>
                                <span id="status-{page}" class="ml-3 text-xs opacity-60"></span>
                            </div>
                        </div>
                        
                        <div class="mb-2 text-xs opacity-50">
                            <span>Predicted: <strong>{doc_type}</strong> | Alt: {alt_html}</span>
                        </div>
                        
                        <div class="mb-2 text-xs" style="color: var(--primary);">
                            <span class="opacity-60">Highlight terms:</span> {', '.join(highlight_terms[:5]) if highlight_terms else '<em class="opacity-40">none</em>'}
                        </div>
                        
                        <!-- Extracted Metadata -->
                        {generate_metadata_html(metadata)}
                        
                        <!-- Linked Entities -->
                        {generate_entities_html(entities)}
                        
                        <!-- One-Click Type Selection -->
                        <div class="mb-3 p-2 type-grid" style="background: var(--archive-dark); border-radius: 4px;">
                            <div class="text-xs opacity-60 mb-2">Top candidates (click to confirm):</div>
                            <div class="flex flex-wrap gap-1 mb-2">
                                {top_buttons_html}
                            </div>
                            <div class="text-xs opacity-40 mt-2 mb-1">Other types:</div>
                            <div class="flex flex-wrap gap-1">
                                {other_buttons_html}
                            </div>
                        </div>
                        
                        <details class="text-xs">
                            <summary class="cursor-pointer opacity-60 hover:opacity-100">Show OCR text</summary>
                            <pre class="mt-2 p-2 max-h-48 overflow-auto" style="background: var(--archive-dark); border: 1px solid rgba(255,255,255,0.1);">{preview}</pre>
                        </details>
                    </div>
                </div>
            </div>
'''
    
    html_content += '''
        </div>
    </div>
    
    <!-- Image Modal -->
    <div id="imageModal" class="image-modal" onclick="hideModal()">
        <canvas id="modalCanvas"></canvas>
    </div>
    
    <script>
        // Load saved feedback from localStorage
        const STORAGE_KEY = "classifier_feedback";
        let feedback = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        
        // Apply saved feedback on load
        document.addEventListener("DOMContentLoaded", () => {
            for (const [page, data] of Object.entries(feedback)) {
                applyFeedbackUI(page, data);
            }
            updateStats();
        });
        
        // One-click type selection
        function selectType(page, selectedType) {
            const el = document.getElementById(`page-${page}`);
            const predicted = el.dataset.predicted;
            const isCorrect = (selectedType === predicted);
            
            // Save feedback
            feedback[page] = {
                status: isCorrect ? "correct" : "incorrect",
                predictedType: predicted,
                selectedType: selectedType
            };
            saveFeedback();
            applyFeedbackUI(page, feedback[page]);
            updateStats();
        }
        
        function applyFeedbackUI(page, data) {
            const el = document.getElementById(`page-${page}`);
            if (!el) return;
            
            // Update card status
            el.classList.remove("correct", "incorrect", "pending");
            el.classList.add(data.status);
            
            // Update status text
            const statusEl = document.getElementById(`status-${page}`);
            if (data.status === "correct") {
                statusEl.textContent = "✓ Correct";
                statusEl.style.color = "#22c55e";
            } else if (data.status === "incorrect") {
                statusEl.textContent = `✗ Wrong → ${data.selectedType}`;
                statusEl.style.color = "#ef4444";
            } else {
                statusEl.textContent = "";
            }
            
            // Update button states
            const buttons = el.querySelectorAll(".type-btn");
            buttons.forEach(btn => {
                btn.classList.remove("selected", "wrong");
                if (data.selectedType && btn.dataset.type === data.selectedType) {
                    btn.classList.add("selected");
                    if (data.status === "incorrect") {
                        btn.classList.add("wrong");
                    }
                }
            });
        }
        
        function saveFeedback() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(feedback));
        }
        
        function updateStats() {
            const visible = document.querySelectorAll("[data-page]:not(.hidden)").length;
            const total = document.querySelectorAll("[data-page]").length;
            const reviewed = Object.values(feedback).filter(f => f.status === "correct" || f.status === "incorrect").length;
            const correct = Object.values(feedback).filter(f => f.status === "correct").length;
            const incorrect = Object.values(feedback).filter(f => f.status === "incorrect").length;
            
            document.getElementById("stat-total").textContent = visible < total ? `${visible}/${total}` : total;
            document.getElementById("stat-reviewed").textContent = reviewed;
            document.getElementById("stat-correct").textContent = correct;
            document.getElementById("stat-incorrect").textContent = incorrect;
        }
        
        // Filtering and sorting
        function applyFilters() {
            const typeFilter = document.getElementById("filter-type").value;
            const statusFilter = document.getElementById("filter-status").value;
            const sortOrder = document.getElementById("sort-order").value;
            
            const container = document.querySelector(".space-y-4");
            const cards = Array.from(document.querySelectorAll("[data-page]"));
            
            // Filter
            cards.forEach(card => {
                const page = card.dataset.page;
                const predicted = card.dataset.predicted;
                const status = feedback[page]?.status || "pending";
                
                let show = true;
                if (typeFilter && predicted !== typeFilter) show = false;
                if (statusFilter && status !== statusFilter) show = false;
                
                card.classList.toggle("hidden", !show);
            });
            
            // Sort
            const visibleCards = cards.filter(c => !c.classList.contains("hidden"));
            visibleCards.sort((a, b) => {
                const pageA = parseInt(a.dataset.page);
                const pageB = parseInt(b.dataset.page);
                const confA = parseFloat(a.dataset.confidence);
                const confB = parseFloat(b.dataset.confidence);
                
                switch(sortOrder) {
                    case "page-asc": return pageA - pageB;
                    case "page-desc": return pageB - pageA;
                    case "conf-asc": return confA - confB;
                    case "conf-desc": return confB - confA;
                    default: return 0;
                }
            });
            
            // Reorder DOM
            visibleCards.forEach(card => container.appendChild(card));
            
            updateStats();
        }
        
        function exportFeedback() {
            const exportData = {};
            for (const [page, data] of Object.entries(feedback)) {
                exportData[page] = { ...data, page: parseInt(page) };
            }
            const data = {
                exportedAt: new Date().toISOString(),
                source: document.title.replace("Classification Review: ", ""),
                summary: {
                    total: document.querySelectorAll("[data-page]").length,
                    reviewed: Object.values(feedback).filter(f => f.status !== "pending").length,
                    correct: Object.values(feedback).filter(f => f.status === "correct").length,
                    incorrect: Object.values(feedback).filter(f => f.status === "incorrect").length,
                },
                feedback: exportData,
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "classifier_feedback.json";
            a.click();
        }
        
        function clearFeedback() {
            if (confirm("Clear all feedback?")) {
                feedback = {};
                localStorage.removeItem(STORAGE_KEY);
                document.querySelectorAll("[data-page]").forEach(el => {
                    el.classList.remove("correct", "incorrect");
                    el.classList.add("pending");
                    el.querySelectorAll(".type-btn").forEach(btn => btn.classList.remove("selected", "wrong"));
                });
                document.querySelectorAll("[id^=status-]").forEach(el => el.textContent = "");
                updateStats();
            }
        }
        
        // Image modal - render full size page
        async function showModalPage(pageIndex) {
            if (!pdfDoc) return;
            const page = await pdfDoc.getPage(pageIndex + 1);
            const scale = 2.5; // Higher res for modal
            const viewport = page.getViewport({ scale });
            const canvas = document.getElementById("modalCanvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;
            document.getElementById("imageModal").classList.add("active");
        }
        
        function hideModal() {
            document.getElementById("imageModal").classList.remove("active");
        }
        
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") hideModal();
        });
    </script>
</body>
</html>
'''
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"Report saved to: {output_path}")

def main():
    # Warren Commission Volume 1
    pdf_path = "raw-material/warren-commission/GPO-WARRENCOMMISSIONHEARINGS-1.pdf"
    output_path = "docs/ui/classifier-review.html"
    
    # Sample pages - broader spread for better testing
    sample_pages = [
        0, 1, 2, 3, 4, 5,           # Front matter (0-indexed)
        12, 13, 14, 15, 16, 17,     # Early content
        25, 30, 35, 40, 45,         # Early testimony
        50, 55, 60, 65, 70,         # Mid-early
        100, 110, 120, 130, 140,    # Mid
        150, 175, 200, 225, 250,    # Spread
        275, 300, 325, 350, 375,    # Later
        400, 425, 450, 475, 500,    # Late sections
    ]
    
    results = test_pages(pdf_path, sample_pages)
    generate_html_report(results, Path(pdf_path).name, pdf_path, output_path)
    
    print(f"\nOpen in browser: http://localhost:8000/classifier-review.html")

if __name__ == "__main__":
    main()
