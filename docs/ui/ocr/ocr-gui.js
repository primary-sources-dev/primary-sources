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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    addFilesToQueue(files);
}

function addFilesToQueue(files) {
    const validFiles = files.filter(f => {
        if (f.type !== 'application/pdf') {
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
    switchTab('queue'); // Auto-switch to Queue tab when files added
}

function removeFileFromQueue(index) {
    queuedFiles.splice(index, 1);
    renderQueue();
    updateQueueBadge();
}

function clearQueue() {
    queuedFiles = [];
    renderQueue();
    updateQueueBadge();
}

function renderQueue() {
    if (queuedFiles.length === 0) {
        queueList.innerHTML = '<div class="empty-state"><p>No files in queue. Add files from the Home tab.</p></div>';
        return;
    }

    queueList.innerHTML = queuedFiles.map((file, idx) => `
        <div class="queue-item">
            <div>
                <div class="font-bold">${file.name}</div>
                <div class="text-xs" style="opacity: 0.6">${formatFileSize(file.size)}</div>
            </div>
            <button class="btn-remove" onclick="removeFileFromQueue(${idx})">×</button>
        </div>
    `).join('');
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
            currentJob = job;

            // Update log
            job.log.forEach((msg, idx) => {
                if (!document.querySelector(`[data-log-idx="${idx}"]`)) {
                    if (msg.includes('✓') || msg.includes('completed')) {
                        logSuccess(msg);
                    } else if (msg.includes('✗') || msg.includes('Error')) {
                        logError(msg);
                    } else {
                        logMessage(msg);
                    }
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
