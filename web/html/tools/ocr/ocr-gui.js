/**
 * OCR Web Tool — Frontend Logic
 * Handles file uploads, drag-drop, tab navigation, and API calls
 */

// State
let currentJob = null;
let queuedFiles = [];

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const btnStart = document.getElementById('btn-start');
const btnCancel = document.getElementById('btn-cancel');
const logOutput = document.getElementById('log-output');
const queueList = document.getElementById('queue-list');
const outputDirInput = document.getElementById('output-dir');
const queueBadge = document.getElementById('queue-badge');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalOk = document.getElementById('modal-ok');

const HELP_TEXT = `
PRIMARY SOURCES — OCR TOOL
==========================

This tool converts scanned PDF documents, archival images (.jpg, .png, .tiff, .webp), and batch archives (.zip, .tar) into searchable text.

QUICK START
-----------
1. Click "Browse" or drag files onto the drop zone.
2. Archives (.zip, .tar, .tgz, .bz2) will be automatically unrolled and all images/PDFs inside added to the queue.
3. Choose your output settings and click "Start OCR".

BACKENDS
--------
• WSL (ocrmypdf): Higher quality, creates searchable PDFs.
  Requires WSL with ocrmypdf installed.
  
• Python (pytesseract): Windows-native, outputs plain text.
  Faster setup, no WSL required.

BATCH PROCESSING
----------------
You can upload a single .zip or .tar containing hundreds of documents. The tool will parse the archive and process each file individually, maintaining the logical order found within.

OPTIONS
-------
• Deskew: Straightens crooked scanned pages
• Clean: Removes noise/specks from old photocopies
• Force OCR: Re-processes files that already have text layers

OUTPUT
------
• Searchable PDF: Original document with invisible text layer
• Plain Text: Raw extracted text with page markers
• Markdown (.md): Structured text preserving archival metadata

Files are saved to the output directory shown in Settings.
`;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchConfig();
    setupTabNavigation();
});

function setupEventListeners() {
    // Drop zone
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', handleFilesDrop);

    // File input
    fileInput.addEventListener('change', (e) => {
        addFilesToQueue(Array.from(e.target.files));
        fileInput.value = ''; // Reset
    });

    // Buttons
    btnStart.addEventListener('click', startProcessing);
    btnCancel.addEventListener('click', cancelProcessing);

    // Output directory copy
    outputDirInput.addEventListener('dblclick', copyOutputPath);

    // Menu Item Listeners (commented out - menu bar disabled)
    // document.getElementById('menu-file-open').addEventListener('click', () => fileInput.click());
    // document.getElementById('menu-file-dir').addEventListener('click', changeOutputDir);
    // document.getElementById('menu-file-folder').addEventListener('click', openOutputFolder);
    document.getElementById('btn-clear-completed').addEventListener('click', clearCompleted);
    document.getElementById('btn-clear-all').addEventListener('click', clearQueue);
    // document.getElementById('menu-help-use').addEventListener('click', showHelp);
    // document.getElementById('menu-help-about').addEventListener('click', showAbout);

    // Modal Listeners
    modalClose.addEventListener('click', closeModal);
    modalOk.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            fileInput.click();
        }
    });
}

function showModal(title, content, isPre = false) {
    modalTitle.textContent = title;
    if (isPre) {
        modalBody.innerHTML = `<pre>${content}</pre>`;
    } else {
        modalBody.innerHTML = content;
    }
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

function showHelp() {
    showModal('How to Use — OCR Tool', HELP_TEXT.trim(), true);
}

function showAbout() {
    const aboutContent = `
        <div style="text-align: center; padding: 20px 0;">
            <h3 style="color: var(--color-heading); font-size: 24px; margin-bottom: 5px;">PRIMARY SOURCES</h3>
            <p style="color: var(--color-primary); font-bold; font-size: 16px; margin-bottom: 20px;">OCR WEB TOOL</p>
            <p style="color: var(--color-secondary); opacity: 0.6; font-size: 12px; margin-bottom: 5px;">Version 1.0 (Web Architecture)</p>
            <p style="color: var(--color-secondary);">Batch OCR processing for archival PDF documents.</p>
        </div>
    `;
    showModal('About', aboutContent);
}

function setupTabNavigation() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `tab-content-${tabName}`);
    });
}

// ============================================================================
// FILE HANDLING
// ============================================================================

function handleFilesDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic', '.heif', '.zip', '.tar', '.gz', '.tgz', '.bz2'];
    const files = Array.from(e.dataTransfer.files).filter(f =>
        allowedExts.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    addFilesToQueue(files);
}

function addFilesToQueue(files) {
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic', '.heif', '.zip', '.tar', '.gz', '.tgz', '.bz2'];
    const validFiles = files.filter(f => {
        const isAllowed = allowedExts.some(ext => f.name.toLowerCase().endsWith(ext));

        if (!isAllowed) {
            logError(`Invalid file type: ${f.name}`);
            return false;
        }

        if (queuedFiles.some(qf => qf.name === f.name)) {
            logError(`File already queued: ${f.name}`);
            return false;
        }
        return true;
    });

    if (validFiles.length === 0) return;

    queuedFiles.push(...validFiles);
    renderQueue();
    updateQueueBadge();
}

function removeFileFromQueue(index) {
    queuedFiles.splice(index, 1);
    renderQueue();
    updateQueueBadge();
}

function clearQueue() {
    queuedFiles = [];
    currentJob = null;
    renderQueue();
    updateQueueBadge();
    updateStats();
}

function clearCompleted() {
    if (!currentJob) {
        queuedFiles = [];
    } else {
        const completedNames = currentJob.files
            .filter(f => f.status === 'completed')
            .map(f => f.name);
        queuedFiles = queuedFiles.filter(f => !completedNames.includes(f.name));
    }
    renderQueue();
    updateQueueBadge();
    updateStats();
}

function renderQueue() {
    if (queuedFiles.length === 0) {
        queueList.innerHTML = '<div class="empty-state"><p>No files queued</p></div>';
        return;
    }

    queueList.innerHTML = queuedFiles.map((file, idx) => {
        // Find if this file is in the current job
        const jobFile = currentJob ? currentJob.files.find(f => f.name === file.name) : null;
        const status = jobFile ? jobFile.status : 'queued';
        const progress = jobFile ? jobFile.progress || 0 : 0;
        const isCompleted = status === 'completed';
        const isProcessing = status === 'processing';
        const parsedMetadata = jobFile ? jobFile.parsed_metadata : null;

        return `
        <div class="queue-item ${status}">
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <span class="font-bold">${file.name}</span>
                    <span class="text-[9px] px-1.5 py-0.5 border border-primary/30 text-primary uppercase font-bold tracking-tighter">${status}</span>
                </div>
                <div class="text-xs mb-1" style="opacity: 0.6">${formatFileSize(file.size)}</div>
                ${isProcessing ? `
                    <div class="queue-progress">
                        <div class="queue-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="text-[9px] text-primary font-bold mt-1 uppercase tracking-tighter">${progress}% Processed</div>
                ` : ''}
                ${isCompleted && parsedMetadata ? renderMetadataPreview(parsedMetadata, idx) : ''}
            </div>
                        <div class="flex items-center gap-2">
                            ${isCompleted ? `
                                <a href="../pdf-viewer/pdf-viewer-ui.html?file=processed/${file.name}&mode=workbench&feature=true" target="_blank" 
                                   class="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/40 px-3 py-1.5 hover:bg-primary hover:text-archive-bg transition-all flex items-center gap-1"
                                   title="Open in Extraction Workbench">
                                    <span class="material-symbols-outlined text-sm">construction</span> Workbench
                                </a>
                                <a href="../pdf-viewer/pdf-viewer-ui.html?file=processed/${file.name}&feature=true" target="_blank" 
                                   class="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 px-3 py-1.5 hover:bg-primary hover:text-archive-bg transition-all flex items-center gap-1"
                                   title="View in Browser">
                                    <span class="material-symbols-outlined text-sm">visibility</span> View
                                </a>
                                <a href="../classifier/classifier-ui.html?file=${encodeURIComponent(file.name)}" target="_blank"
                                   class="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 px-3 py-1.5 hover:bg-emerald-500 hover:text-archive-bg transition-all flex items-center gap-1"
                                   title="Review Classification">
                                    <span class="material-symbols-outlined text-sm">fact_check</span> Review
                                </a>
                                <button onclick="downloadTxt('${file.name}')" 
                                   class="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 px-3 py-1.5 hover:bg-primary hover:text-archive-bg transition-all flex items-center gap-1"
                                   title="Download as Plain Text">
                                    <span class="material-symbols-outlined text-sm">article</span> .TXT
                                </button>
                                <button onclick="downloadMarkdown('${file.name}')" 
                                   class="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 px-3 py-1.5 hover:bg-primary hover:text-archive-bg transition-all flex items-center gap-1"
                                   title="Download as Markdown">
                                    <span class="material-symbols-outlined text-sm">description</span> .MD
                                </button>
                                <button onclick="downloadHtml('${file.name}')" 
                                   class="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 px-3 py-1.5 hover:bg-primary hover:text-archive-bg transition-all flex items-center gap-1"
                                   title="Download Archival HTML">
                                    <span class="material-symbols-outlined text-sm">html</span> .HTML
                                </button>
                            ` : ''}
                            <button class="btn-remove" onclick="removeFileFromQueue(${idx})" ${isProcessing ? 'disabled' : ''}>×</button>
                        </div>        </div>
    `}).join('');
}

function updateQueueBadge() {
    const count = queuedFiles.length;
    if (count > 0) {
        queueBadge.textContent = count;
        queueBadge.classList.remove('hidden');
    } else {
        queueBadge.classList.add('hidden');
    }
}

// ============================================================================
// METADATA PREVIEW (Forensic Metadata Parser + Document Layout Analyzer)
// ============================================================================

function renderMetadataPreview(parsed, fileIdx) {
    // Check if we have classification info (Document Layout Analyzer)
    const hasClassification = parsed.classified_type && parsed.classified_type !== 'UNKNOWN';
    const classificationConfidence = parsed.classification_confidence || 0;
    const classificationLabel = parsed.classification_label || '';

    // Check if any fields were extracted
    const hasData = parsed.rif_number || parsed.agency || parsed.date_iso || parsed.author ||
        parsed.footer_author || parsed.footer_file_number;

    if (!hasData && !hasClassification) {
        return `
            <div class="metadata-preview">
                <div class="metadata-preview-header">
                    <span class="metadata-preview-title">Extracted Metadata</span>
                </div>
                <div class="metadata-field">
                    <span class="metadata-value empty">No metadata patterns detected</span>
                </div>
            </div>
        `;
    }

    // Build classification badge
    const classificationBadge = hasClassification ? `
        <div class="classification-banner ${classificationLabel.toLowerCase()}">
            <span class="classification-type">${parsed.classified_type.replace('_', ' ')}</span>
            <span class="classification-confidence">${Math.round(classificationConfidence * 100)}% ${classificationLabel}</span>
        </div>
    ` : '';

    // Determine document type for badge (prefer classified_type, fall back to document_type)
    const docType = parsed.classified_type || parsed.document_type;
    const docTypeBadge = docType && docType !== 'UNKNOWN'
        ? `<span class="doc-type-badge">${docType.replace('_', ' ')}</span>`
        : '';

    return `
        <div class="metadata-preview">
            ${classificationBadge}
            <div class="metadata-preview-header">
                <span class="metadata-preview-title">
                    Extracted Metadata ${docTypeBadge}
                </span>
                <div class="metadata-preview-actions">
                    <button class="btn-copy-all" onclick="copyAllMetadata(${fileIdx})" title="Copy all fields">
                        <span class="material-symbols-outlined" style="font-size: 12px;">content_copy</span> Copy All
                    </button>
                    <button class="btn-reparse" onclick="reparseHeader(${fileIdx})" title="Re-parse header">
                        <span class="material-symbols-outlined" style="font-size: 12px;">refresh</span> Re-parse
                    </button>
                </div>
            </div>
            ${renderMetadataField('RIF/ID', parsed.rif_number, fileIdx)}
            ${renderMetadataField('Agency', parsed.agency, fileIdx)}
            ${renderMetadataField('Date', parsed.date_iso ? { value: parsed.date_iso, confidence: parsed.date?.confidence || 'MEDIUM' } : parsed.date, fileIdx)}
            ${renderMetadataField('Author', parsed.author, fileIdx)}
            ${parsed.footer_author ? renderMetadataField('Agent (Footer)', parsed.footer_author, fileIdx) : ''}
            ${parsed.footer_file_number ? renderMetadataField('File # (Footer)', parsed.footer_file_number, fileIdx) : ''}
            ${parsed.footer_date ? renderMetadataField('Transcription Date', parsed.footer_date, fileIdx) : ''}
            
            ${renderBodyAnalysis(parsed, fileIdx)}
        </div>
    `;
}

function renderBodyAnalysis(parsed, fileIdx) {
    if (!parsed.segments || parsed.segments.length === 0) return '';

    let segmentHtml = parsed.segments.map(s => {
        const entityChips = (s.entities || []).map(ent => {
            const methodTag = ent.method === 'fuzzy' ? `<span class="score-tag">${Math.round(ent.score)}%</span>` : '';
            return `
                <span class="entity-chip ${ent.type.toLowerCase()}" title="Matched: ${ent.matched_text}${ent.method === 'fuzzy' ? ' (Fuzzy ' + ent.score + '%)' : ''}">
                    ${ent.label}${methodTag}
                </span>
            `;
        }).join('');

        const speakerHtml = s.speaker ? `<span class="segment-speaker">${s.speaker}:</span>` : '';
        const labelClass = s.label.toLowerCase();

        return `
            <div class="body-segment ${labelClass}">
                <div class="segment-header">
                    <span class="segment-label">${s.label}</span>
                    <div class="segment-entities">${entityChips}</div>
                </div>
                <div class="segment-content">
                    ${speakerHtml} ${s.text}
                </div>
            </div>
        `;
    }).join('');

    const globalEntities = (parsed.linked_entities || []).map(ent => `
        <div class="global-entity border border-primary/20 bg-primary/5 p-2 rounded flex items-center gap-2" title="${ent.method === 'fuzzy' ? 'Fuzzy Match: ' + ent.score + '%' : 'Exact Match'}">
            <span class="material-symbols-outlined text-primary" style="font-size: 16px;">
                ${ent.type === 'PERSON' ? 'person' : 'location_on'}
            </span>
            <div class="flex-1 text-left">
                <div class="text-[10px] font-bold text-archive-heading uppercase tracking-wide truncate max-w-[120px]">
                    ${ent.label} ${ent.method === 'fuzzy' ? '<span class="text-primary/60 text-[7px] ml-1">' + Math.round(ent.score) + '%</span>' : ''}
                </div>
                <div class="text-[8px] text-archive-secondary/60">ID: ${ent.id}</div>
            </div>
        </div>
    `).join('');

    return `
        <div class="body-analysis mt-4 border-t border-archive-secondary/20 pt-4">
            <div class="flex justify-between items-center mb-3">
                <span class="metadata-preview-title">Narrative Analysis</span>
                <span class="text-[9px] uppercase tracking-widest text-primary font-bold">Deep Extraction</span>
            </div>
            
            <!-- Global Entities Summary -->
            <div class="grid grid-cols-2 gap-2 mb-4">
                ${globalEntities}
            </div>

            <!-- Segments list -->
            <div class="segments-container space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                ${segmentHtml}
            </div>
        </div>
    `;
}

function renderMetadataField(label, field, fileIdx) {
    if (!field) {
        return `
            <div class="metadata-field">
                <span class="metadata-label">${label}</span>
                <span class="metadata-value empty">—</span>
            </div>
        `;
    }

    const value = typeof field === 'object' ? field.value : field;
    const confidence = typeof field === 'object' ? field.confidence : null;
    const confidenceClass = confidence ? confidence.toLowerCase() : '';

    return `
        <div class="metadata-field">
            <span class="metadata-label">${label}</span>
            <span class="metadata-value">
                ${escapeHtml(value)}
                ${confidence ? `<span class="confidence-badge ${confidenceClass}">${confidence}</span>` : ''}
            </span>
            <button class="btn-copy-field" onclick="copyFieldValue('${escapeHtml(value)}')" title="Copy ${label}">
                <span class="material-symbols-outlined">content_copy</span>
            </button>
        </div>
    `;
}

function copyFieldValue(value) {
    navigator.clipboard.writeText(value).then(() => {
        logSuccess(`Copied: ${value}`);
    }).catch(err => {
        logError(`Failed to copy: ${err}`);
    });
}

function copyAllMetadata(fileIdx) {
    const jobFile = currentJob?.files?.[fileIdx];
    if (!jobFile?.parsed_metadata) {
        logError('No metadata to copy');
        return;
    }

    const parsed = jobFile.parsed_metadata;
    const lines = [];

    if (parsed.rif_number?.value) lines.push(`RIF/ID: ${parsed.rif_number.value}`);
    if (parsed.agency?.value) lines.push(`Agency: ${parsed.agency.value}`);
    if (parsed.date_iso) lines.push(`Date: ${parsed.date_iso}`);
    if (parsed.author?.value) lines.push(`Author: ${parsed.author.value}`);
    if (parsed.document_type) lines.push(`Document Type: ${parsed.document_type}`);

    const text = lines.join('\n');

    navigator.clipboard.writeText(text).then(() => {
        logSuccess('Copied all metadata to clipboard');
    }).catch(err => {
        logError(`Failed to copy: ${err}`);
    });
}

async function reparseHeader(fileIdx) {
    const file = queuedFiles[fileIdx];
    if (!file) {
        logError('File not found');
        return;
    }

    logMessage(`Re-parsing header for ${file.name}...`);

    // Fetch the text file and re-parse
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    try {
        // Try to fetch the .txt or .md file
        let text = null;
        for (const ext of ['.txt', '.md']) {
            try {
                const response = await fetch(`/api/download/${baseName}${ext}`);
                if (response.ok) {
                    text = await response.text();
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!text) {
            logError('Could not find OCR output file');
            return;
        }

        // Call the parse-metadata API
        const response = await fetch('/api/parse-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            const err = await response.json();
            logError(`Parse error: ${err.error || 'Unknown error'}`);
            return;
        }

        const result = await response.json();

        // Update the job file with new parsed metadata
        if (currentJob?.files) {
            const jobFile = currentJob.files.find(f => f.name === file.name);
            if (jobFile) {
                jobFile.parsed_metadata = result;
                renderQueue();
                updateStats();
                logSuccess('Header re-parsed successfully');
            }
        }

    } catch (err) {
        logError(`Re-parse failed: ${err.message}`);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// PROCESSING
// ============================================================================

async function startProcessing() {
    if (queuedFiles.length === 0) {
        alert('No files in queue');
        return;
    }

    clearLog();
    logMessage('Preparing job...');

    // Create FormData with files and settings
    const formData = new FormData();
    queuedFiles.forEach(file => formData.append('files', file));
    formData.append('backend', document.querySelector('input[name="backend"]:checked').value);
    formData.append('output_pdf', document.getElementById('output-pdf').checked);
    formData.append('output_txt', document.getElementById('output-txt').checked);
    formData.append('output_md', document.getElementById('output-md').checked);
    formData.append('output_html', document.getElementById('output-html').checked);
    formData.append('deskew', document.getElementById('option-deskew').checked);
    formData.append('clean', document.getElementById('option-clean').checked);
    formData.append('force_ocr', document.getElementById('option-force').checked);

    try {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to create job: ${response.statusText}`);
        }

        currentJob = await response.json();
        logSuccess(`Job created: ${currentJob.id}`);
        logMessage(`Processing ${currentJob.files.length} file(s)...`);

        btnStart.disabled = true;
        btnCancel.disabled = false;

        // Start processing
        const startResponse = await fetch(`/api/jobs/${currentJob.id}/start`, {
            method: 'POST'
        });

        if (!startResponse.ok) {
            throw new Error('Failed to start job');
        }

        // Poll for progress
        pollJobProgress();

    } catch (error) {
        logError(`Error: ${error.message}`);
    }
}

function pollJobProgress() {
    if (!currentJob) return;

    fetch(`/api/jobs/${currentJob.id}`)
        .then(r => r.json())
        .then(job => {
            const statusChanged = currentJob.status !== job.status;
            const filesUpdated = JSON.stringify(currentJob.files) !== JSON.stringify(job.files);

            // Calculate per-file progress based on overall job progress
            const totalFiles = job.files.length;
            const completedFiles = job.files.filter(f => f.status === 'completed').length;
            const processingFiles = job.files.filter(f => f.status === 'processing');

            // Update each file's progress field
            job.files.forEach((file, idx) => {
                if (file.status === 'completed') {
                    file.progress = 100;
                } else if (file.status === 'processing') {
                    // Calculate this file's progress based on overall job progress
                    const completedWeight = completedFiles * (100 / totalFiles);
                    const remainingProgress = job.progress - completedWeight;
                    const processingWeight = processingFiles.length > 0 ? remainingProgress / processingFiles.length : 0;
                    file.progress = Math.min(Math.round(processingWeight), 99);
                } else if (file.status === 'failed') {
                    file.progress = 0;
                } else {
                    file.progress = 0;
                }
            });

            currentJob = job;

            // Render queue and stats
            if (filesUpdated || statusChanged || job.status === 'processing') {
                renderQueue();
                updateStats();
            }

            // Update log (only append new messages)
            const logCount = logOutput.querySelectorAll('p').length;
            job.log.slice(logCount).forEach((msg) => {
                if (msg.includes('✓') || msg.includes('completed')) {
                    logSuccess(msg);
                } else if (msg.includes('✗') || msg.includes('Error')) {
                    logError(msg);
                } else {
                    logMessage(msg);
                }
            });

            // Continue polling if still processing
            if (job.status === 'processing' || job.status === 'queued') {
                setTimeout(pollJobProgress, 500);
            } else if (job.status === 'completed') {
                btnStart.disabled = false;
                btnCancel.disabled = true;
                logSuccess('Processing completed!');
                clearQueue();
            } else if (job.status === 'failed') {
                btnStart.disabled = false;
                btnCancel.disabled = true;
                logError('Processing failed');
            }
        })
        .catch(error => {
            logError(`Poll error: ${error.message}`);
        });
}

async function cancelProcessing() {
    if (!currentJob) return;

    try {
        const response = await fetch(`/api/jobs/${currentJob.id}/cancel`, {
            method: 'POST'
        });

        if (response.ok) {
            logMessage('Processing cancelled');
            btnStart.disabled = false;
            btnCancel.disabled = true;
        }
    } catch (error) {
        logError(`Error cancelling job: ${error.message}`);
    }
}

// ============================================================================
// LOGGING
// ============================================================================

function logMessage(msg) {
    const p = document.createElement('p');
    p.textContent = `> ${msg}`;
    logOutput.appendChild(p);
    logOutput.scrollTop = logOutput.scrollHeight;
}

function logSuccess(msg) {
    const p = document.createElement('p');
    p.className = 'log-success';
    p.textContent = msg;
    logOutput.appendChild(p);
    logOutput.scrollTop = logOutput.scrollHeight;
}

function logError(msg) {
    const p = document.createElement('p');
    p.className = 'log-error';
    p.textContent = `✗ ${msg}`;
    logOutput.appendChild(p);
    logOutput.scrollTop = logOutput.scrollHeight;
}

function clearLog() {
    logOutput.innerHTML = '';
}

// ============================================================================
// CONFIG & SETTINGS
// ============================================================================

async function fetchConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        outputDirInput.value = config.output_dir;
    } catch (error) {
        console.error('Error fetching config:', error);
        outputDirInput.value = './processed';
    }
}

function changeOutputDir() {
    // For web version, would open a directory picker
    // For now, just show message
    alert('Output directory: ' + outputDirInput.value + '\n\nTo change, update the Flask backend configuration.');
}

function openOutputFolder() {
    // Web version can't directly open folders
    // Could implement downloads via /api/output endpoint
    logMessage('Output folder: ' + outputDirInput.value);
}

function copyOutputPath() {
    const path = outputDirInput.value;
    navigator.clipboard.writeText(path).then(() => {
        logSuccess('Output path copied to clipboard');
    });
}

function downloadMarkdown(originalName) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    window.open(`/api/download/${baseName}.md`, '_blank');
}

function downloadHtml(originalName) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    window.open(`/api/download/${baseName}.html`, '_blank');
}

function downloadTxt(originalName) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    window.open(`/api/download/${baseName}.txt`, '_blank');
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function updateStats() {
    if (!currentJob) {
        document.getElementById('stat-total').textContent = queuedFiles.length;
        document.getElementById('stat-confidence').textContent = '0%';
        document.getElementById('stat-success').textContent = '0';
        return;
    }

    const files = currentJob.files;
    const total = files.length;
    const succeeded = files.filter(f => f.status === 'completed').length;

    // Average confidence across all parsed metadata
    let totalConf = 0;
    let confCount = 0;

    files.forEach(f => {
        if (f.parsed_metadata && f.parsed_metadata.classification_confidence) {
            totalConf += f.parsed_metadata.classification_confidence;
            confCount++;
        }
    });

    const avgConf = confCount > 0 ? Math.round((totalConf / confCount) * 100) : 0;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-confidence').textContent = `${avgConf}%`;
    document.getElementById('stat-success').textContent = succeeded;
}
