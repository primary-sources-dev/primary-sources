// =====================================================================
// workbench.js — Document Workbench (extracted from classifier-ui.html)
// Class-based architecture for the unified document review pipeline.
// =====================================================================

// ── Vocabularies ────────────────────────────────────────────────────
const AGENCIES = ['FBI', 'CIA', 'DPD', 'WC', 'HSCA', 'NARA', 'SS', 'UNKNOWN'];
const CLASSES = ['REPORT', 'CABLE', 'MEMO', 'CORRESPONDENCE', 'EXHIBIT', 'TESTIMONY', 'DEPOSITION', 'AFFIDAVIT', 'TRAVEL', 'OTHER'];
const FORMATS = ['FD-302', 'AIRTEL', 'TELETYPE', 'RIF', 'CABLE', 'MEMO', 'LETTER', 'ENVELOPE', 'PASSPORT', 'VISA', 'OTHER'];
const CONTENT_TYPES = [
    'WITNESS_INTERVIEW', 'FORENSIC_ANALYSIS', 'BALLISTICS', 'SURVEILLANCE',
    'INVESTIGATIVE_SUMM', 'AUTOPSY_REPORT', 'SECURITY_CLEARANCE',
    'POLYGRAPH_EXAM', 'TIPS_AND_LEADS', 'ADMINISTRATIVE',
    'CORRESPONDENCE', 'SEARCH_WARRANT'
];
const ALL_DOC_TYPES = [
    'BLANK', 'CHURCH_COMMITTEE', 'CIA_201', 'CIA_CABLE', 'COVER',
    'DPD_REPORT', 'FBI_302', 'FBI_REPORT', 'FBI_TELETYPE', 'HANDWRITTEN_NOTES',
    'HSCA_DOC', 'HSCA_REPORT', 'INDEX', 'LETTER', 'MEDICAL_RECORD',
    'MEMO', 'NARA_RIF', 'POLICE_REPORT', 'SENATE_REPORT',
    'TRAVEL_DOCUMENT', 'TOC', 'UNKNOWN', 'WC_AFFIDAVIT',
    'WC_DEPOSITION', 'WC_EXHIBIT', 'WC_TESTIMONY', 'WITNESS_STATEMENT'
];
const NOTE_PRESETS = {
    'NEW_TYPE': 'Consider new document type',
    'NEW_PATTERN': 'Add pattern to classifier',
    'SCHEMA_UPDATE': 'Schema change needed',
    'OCR_QUALITY': 'Poor OCR / illegible',
    'AMBIGUOUS': 'Ambiguous classification'
};

// =====================================================================
// ClassifyTab — PDF rendering + 4-tier feedback engine
// =====================================================================
class ClassifyTab {
    constructor(workbench) {
        this.wb = workbench;
        this.pageHighlights = {};
        this.renderedPages = new Set();
        this.renderQueue = [];
        this.activeRenders = 0;
        this.MAX_CONCURRENT_RENDERS = 3;
        this.observer = null;

        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredPages = [];
    }

    // ── PDF rendering ───────────────────────────────────────────
    async renderPage(pageIndex, canvasId, scale = 1.5) {
        try {
            if (!this.wb.pdfDoc) {
                console.warn(`Delaying render for page ${pageIndex}: PDF not ready`);
                return false;
            }
            const page = await this.wb.pdfDoc.getPage(pageIndex + 1);
            const viewport = page.getViewport({ scale });
            const canvas = document.getElementById(canvasId);
            if (!canvas) return false;

            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;

            const card = canvas.closest('[data-page-index]');
            const highlightTerms = card ? (this.pageHighlights[pageIndex] || []) : [];
            if (highlightTerms.length > 0) {
                await this.renderTextLayer(page, canvas, viewport, highlightTerms);
            }
            const loading = canvas.parentElement.querySelector('.canvas-loading');
            if (loading) loading.remove();
            return true;
        } catch (err) {
            console.error('Failed to render page', pageIndex, err);
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const loading = canvas.parentElement.querySelector('.canvas-loading');
                if (loading) {
                    const self = this;
                    loading.innerHTML = '';
                    const btn = document.createElement('button');
                    btn.className = 'text-[10px] underline';
                    btn.textContent = 'Retry';
                    btn.addEventListener('click', () => self.retryRender(pageIndex));
                    loading.appendChild(btn);
                }
            }
            return false;
        }
    }

    retryRender(pageIndex) {
        const canvas = document.getElementById(`canvas-${pageIndex}`);
        if (canvas) {
            const loading = canvas.parentElement.querySelector('.canvas-loading');
            if (loading) loading.textContent = 'Retrying...';
        }
        this.renderPage(pageIndex, `canvas-${pageIndex}`);
    }

    async renderTextLayer(page, canvas, viewport, highlightTerms) {
        try {
            const textContent = await page.getTextContent();
            const container = canvas.parentElement;
            let textLayer = container.querySelector('.text-layer');
            if (!textLayer) {
                textLayer = document.createElement('div');
                textLayer.className = 'text-layer';
                textLayer.style.width = canvas.width + 'px';
                textLayer.style.height = canvas.height + 'px';
                container.appendChild(textLayer);
            }
            textLayer.innerHTML = '';
            const escapedTerms = highlightTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const highlightRegex = new RegExp('(' + escapedTerms.join('|') + ')', 'gi');

            for (const item of textContent.items) {
                const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                const span = document.createElement('span');
                const text = item.str;
                if (highlightRegex.test(text)) span.className = 'highlight';
                highlightRegex.lastIndex = 0;
                span.textContent = text;
                span.style.left = tx[4] + 'px';
                span.style.top = tx[5] + 'px';
                span.style.fontSize = Math.abs(tx[0]) + 'px';
                span.style.fontFamily = item.fontName || 'sans-serif';
                textLayer.appendChild(span);
            }
        } catch (err) {
            console.error('Failed to render text layer', err);
        }
    }

    async processQueue() {
        if (this.renderQueue.length === 0 || this.activeRenders >= this.MAX_CONCURRENT_RENDERS) return;

        const task = this.renderQueue.shift();
        this.activeRenders++;

        try {
            const success = await this.renderPage(task.pageIndex, task.canvasId);
            if (success) {
                this.renderedPages.add(task.pageIndex);
            }
        } finally {
            this.activeRenders--;
            this.processQueue();
        }
    }

    setupLazyLoading() {
        const cards = document.querySelectorAll('[data-page-index]');
        console.log('Found', cards.length, 'page cards, setting up lazy loading');

        cards.forEach(el => {
            const pageIndex = parseInt(el.dataset.pageIndex);
            try {
                const highlights = JSON.parse(el.dataset.highlights || '[]');
                if (highlights.length > 0) this.pageHighlights[pageIndex] = highlights;
            } catch (e) { console.warn('Failed to parse highlights for page', pageIndex); }
        });

        const self = this;
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const pageIndex = parseInt(el.dataset.pageIndex);
                    if (!self.renderedPages.has(pageIndex) && !self.renderQueue.some(t => t.pageIndex === pageIndex)) {
                        self.renderQueue.push({ pageIndex, canvasId: `canvas-${pageIndex}` });
                        self.processQueue();
                    }
                }
            });
        }, { rootMargin: '600px', threshold: 0.01 });

        cards.forEach(card => this.observer.observe(card));
    }

    // ── Card rendering ──────────────────────────────────────────
    // ── Card rendering (Components) ─────────────────────────────
    renderHybridSelector(page, tierType, title, options, selected) {
        const top3 = options.slice(0, 3);
        const others = options.slice(3);

        return `
            <div class="hybrid-selector-container" id="container-${tierType}-${page}">
                <label class="hybrid-label">${title}:</label>
                ${top3.map(opt => `
                    <button class="hybrid-chip ${opt === selected ? 'active' : ''}" 
                            data-action="select-hybrid-chip" 
                            data-tier="${tierType}" 
                            data-value="${opt}" 
                            data-page="${page}">${opt}</button>
                `).join('')}
                <select class="hybrid-select-more" 
                        id="select-${tierType}-${page}"
                        data-action="select-hybrid-dropdown" 
                        data-tier="${tierType}" 
                        data-page="${page}">
                    <option value="">More...</option>
                    ${others.map(opt => `<option value="${opt}" ${opt === selected ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
        `;
    }

    confidenceColor(conf) {
        if (conf >= 0.7) return 'text-green-400';
        if (conf >= 0.4) return 'text-yellow-400';
        return 'text-red-400';
    }

    buildTopButtons(page, allScores, predictedType) {
        const sorted = Object.entries(allScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        return sorted.map(([type, score]) => {
            const isPredicted = type === predictedType;
            const cls = isPredicted ? 'type-btn predicted' : 'type-btn';
            return `<button class="${cls}" data-type="${type}" data-page="${page}" data-action="select-type">${type} <span class="opacity-60">${Math.round(score * 100)}%</span></button>`;
        }).join('');
    }

    buildOtherButtons(page, allScores) {
        const topTypes = Object.entries(allScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([t]) => t);

        return ALL_DOC_TYPES
            .filter(t => !topTypes.includes(t))
            .map(t => `<button class="type-btn" data-type="${t}" data-page="${page}" data-action="select-type">${t}</button>`)
            .join('');
    }

    renderCard(pageData) {
        const { page, page_index, doc_type, agency, confidence, matched_patterns, all_scores } = pageData;
        const confPct = Math.round(confidence * 100);
        const highlightsJson = JSON.stringify(matched_patterns).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const textContent = pageData.text || '';
        const textSample = textContent.substring(0, 1000).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

        const isContinuation = matched_patterns.some(p => p.includes('CONTINUITY_FROM'));
        const continuityClass = isContinuation ? 'border-l-4 border-l-blue-500/50' : '';

        return `
        <div id="page-${page}" class="card border p-4 pending ${continuityClass}" data-page="${page}" data-page-index="${page_index}"
            data-predicted="${doc_type}" data-agency="${agency || 'UNKNOWN'}" data-confidence="${confidence}"
            data-highlights='${highlightsJson}' data-text-sample="${textSample}">
            <div class="card-layout">
                <!-- Left: PDF Page -->
                <div class="flex-shrink-0" style="flex: 0 0 360px; max-width: 360px; width: 360px;">
                    <div class="canvas-container shadow-lg">
                        <canvas id="canvas-${page_index}" class="pdf-canvas rounded-sm" data-page-index="${page_index}" data-action="show-modal"></canvas>
                        <div class="canvas-loading">Loading...</div>
                        ${isContinuation ? '<div class="absolute top-0 right-0 bg-blue-600 text-[9px] px-1.5 py-0.5 font-bold tracking-tighter shadow-md">CONTINUITY</div>' : ''}
                    </div>
                </div>

                <!-- Right: Analysis Panel -->
                <div class="classification-panel">
                    <div class="flex flex-wrap justify-between items-center gap-y-2 mb-1">
                        <div class="flex flex-wrap items-center gap-2 pr-2">
                            <span class="font-bold text-xl" style="color: var(--primary);">Page ${page}</span>
                            <span class="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[10px] ${this.confidenceColor(confidence)} whitespace-nowrap">${confPct}% Match</span>
                        </div>
                        <div id="status-text-${page}" class="text-[10px] opacity-60 italic whitespace-nowrap"></div>
                        <details class="ms-auto text-right">
                            <summary class="text-[9px] opacity-30 cursor-pointer hover:opacity-100 transition-opacity">Fingerprints</summary>
                            <div class="mt-2 p-2 bg-black/40 rounded border border-white/5 text-[10px] font-mono leading-relaxed text-left">
                                <div class="mb-1 text-primary font-bold">Matches:</div>
                                <div class="pl-2 border-l border-primary/30">${matched_patterns.join('<br>')}</div>
                            </div>
                        </details>
                    </div>

                    <!-- Correction Form -->
                    <div class="p-4 bg-archive-dark rounded-md border border-white/5 shadow-md space-y-4">
                        <!-- Summary Header -->
                        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 pb-4 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest leading-none">
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Agency:</span>
                                <span class="badge-tier badge-agency" id="view-agency-${page}">${agency || 'UNKNOWN'}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Class:</span>
                                <span class="badge-tier badge-class" id="view-class-${page}">${doc_type}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Format:</span>
                                <span class="badge-tier badge-format" id="view-format-${page}">PENDING</span>
                            </div>
                        </div>
                        ${this.renderHybridSelector(page, 'agency', 'Agency', AGENCIES, agency)}
                        ${this.renderHybridSelector(page, 'class', 'Class', CLASSES, doc_type)}
                        ${this.renderHybridSelector(page, 'format', 'Format', FORMATS, 'PENDING')}

                        <div class="pt-1">
                            <label class="text-[10px] opacity-60 block mb-2 font-bold uppercase tracking-widest">Content Tags:</label>
                            <div class="flex flex-wrap gap-1.5 p-2 bg-black/30 rounded border border-white/10 max-h-[100px] overflow-y-auto">
                                ${CONTENT_TYPES.map(tag => `
                                    <label class="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/5 hover:border-primary/40 cursor-pointer text-[10px] leading-none">
                                        <input type="checkbox" name="content-${page}" value="${tag}" class="scale-90">
                                        ${tag.replace(/_/g, ' ')}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            <div class="flex flex-col gap-2">
                                <label class="text-[10px] opacity-60 uppercase font-bold tracking-widest">Reviewer Note:</label>
                                <select id="note-preset-${page}" class="workbench-select" data-action="note-preset" data-page="${page}">
                                    <option value="">-- Choose Preset --</option>
                                    ${Object.entries(NOTE_PRESETS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                                </select>
                                <textarea id="note-text-${page}" rows="2" 
                                    class="bg-black/40 border border-white/10 text-[11px] p-2 rounded resize-none w-full h-[54px]"
                                    placeholder="Context notes..."></textarea>
                            </div>
                            <div class="flex flex-col justify-between items-stretch">
                                <div class="flex items-center gap-2 mb-2 bg-black/20 p-2 rounded border border-white/5">
                                    <input type="checkbox" id="flag-new-${page}" class="scale-110">
                                    <label for="flag-new-${page}" class="text-[10px] opacity-80 cursor-pointer leading-tight">Flag as New Document Type</label>
                                </div>
                                <button class="w-full grow py-3 bg-primary text-archive-dark font-bold rounded shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
                                        data-action="submit-4tier" data-page="${page}">
                                    <span class="material-symbols-outlined text-sm font-bold">check_circle</span>
                                    APPLY & VERIFY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    renderCards(pages) {
        this.filteredPages = pages;
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = Math.min(start + this.itemsPerPage, pages.length);
        const slice = pages.slice(start, end);

        const container = document.getElementById('cards-container');
        container.innerHTML = slice.map(p => this.renderCard(p)).join('');

        // Re-apply saved feedback to visible cards
        for (const p of slice) {
            const fb = this.wb.feedback[p.page];
            if (fb) this.applyFeedbackUI(p.page, fb);
        }

        this.updatePagination();
    }

    // ── Feedback engine ─────────────────────────────────────────
    applyNotePreset(page) {
        const preset = document.getElementById(`note-preset-${page}`).value;
        const textField = document.getElementById(`note-text-${page}`);
        if (preset && NOTE_PRESETS[preset]) {
            textField.value = NOTE_PRESETS[preset];
        }
        this.saveNote(page);
    }

    saveNote(page) {
        const preset = document.getElementById(`note-preset-${page}`).value;
        const text = document.getElementById(`note-text-${page}`).value;
        if (!this.wb.feedback[page]) this.wb.feedback[page] = { status: 'pending' };
        this.wb.feedback[page].noteType = preset || null;
        this.wb.feedback[page].notes = text || null;
        this.wb.saveFeedback();
    }

    selectTierValue(page, tierType, value) {
        if (!value) return;

        // Update chips in that specific container
        const container = document.getElementById(`container-${tierType}-${page}`);
        if (container) {
            container.querySelectorAll('.hybrid-chip').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === value);
            });
        }

        // Update select value (reset if it's one of the chips)
        const select = document.getElementById(`select-${tierType}-${page}`);
        if (select) {
            const options = Array.from(select.options).map(o => o.value);
            select.value = options.includes(value) ? value : "";
        }

        // Update summary view badge
        const badgeId = `view-${tierType}-${page}`;
        const badge = document.getElementById(badgeId);
        if (badge) badge.textContent = value;

        // Save to feedback
        if (!this.wb.feedback[page]) this.wb.feedback[page] = { status: 'pending' };

        if (tierType === 'agency') this.wb.feedback[page].selectedAgency = value;
        if (tierType === 'class') this.wb.feedback[page].selectedClass = value;
        if (tierType === 'format') this.wb.feedback[page].selectedFormat = value;

        this.wb.saveFeedback();
    }

    submit4Tier(page) {
        const el = document.getElementById(`page-${page}`);
        const predicted = el.dataset.predicted;

        // Get values from our hybrid components
        const getVal = (tier) => {
            const activeChip = el.querySelector(`.hybrid-chip.active[data-tier="${tier}"]`);
            if (activeChip) return activeChip.dataset.value;
            const select = document.getElementById(`select-${tier}-${page}`);
            return select ? select.value : null;
        };

        const agency = getVal('agency') || "UNKNOWN";
        const docClass = getVal('class') || "REPORT";
        const format = getVal('format') || "GENERIC";

        const content = Array.from(document.querySelectorAll(`input[name="content-${page}"]:checked`)).map(i => i.value);
        const isNew = document.getElementById(`flag-new-${page}`).checked;
        const textSample = el.dataset.textSample || '';

        const feedbackData = {
            status: (docClass === predicted) ? "correct" : "incorrect",
            predictedType: predicted,
            selectedType: docClass,
            selectedAgency: agency,
            selectedClass: docClass,
            selectedFormat: format,
            selectedContent: content,
            newTypeFlag: isNew,
            textSample: textSample
        };

        this.wb.feedback[page] = feedbackData;
        this.wb.saveFeedback();
        this.applyFeedbackUI(page, feedbackData);
        this.updateStats();

        // POST to server
        fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page: page,
                source: this.wb.FILE_NAME,
                ...feedbackData
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) this.wb.showToast(`Saved review for Page ${page}`);
            })
            .catch(err => console.warn('Server offline, saved locally only.'));
    }

    applyFeedbackUI(page, data) {
        const el = document.getElementById(`page-${page}`);
        if (!el) return;

        const status = data?.status || "pending";
        el.classList.remove("pending", "correct", "incorrect");
        el.classList.add(status);

        const statusEl = document.getElementById(`status-text-${page}`);
        if (status === "correct" || status === "incorrect") {
            statusEl.textContent = "\u2713 Reviewed";
            statusEl.classList.add("text-green-500");
        } else {
            statusEl.textContent = data?.notes ? "Note saved" : "";
            statusEl.classList.remove("text-green-500");
        }

        // Update View labels
        if (data.selectedAgency) {
            document.getElementById(`view-agency-${page}`).textContent = data.selectedAgency;
        }
        if (data.selectedClass) {
            document.getElementById(`view-class-${page}`).textContent = data.selectedClass;
        }
        if (Object.prototype.hasOwnProperty.call(data, "selectedFormat")) {
            document.getElementById(`view-format-${page}`).textContent = data.selectedFormat || 'GENERIC';
        }

        const contentContainer = document.getElementById(`view-content-${page}`);
        if (Array.isArray(data.selectedContent) && data.selectedContent.length > 0) {
            contentContainer.innerHTML = data.selectedContent.map(c => `<span class="content-tag">${c}</span>`).join('');
        } else if (Object.prototype.hasOwnProperty.call(data, "selectedContent")) {
            contentContainer.innerHTML = '<span class="text-[10px] opacity-30 italic">none</span>';
        }

        // Sync form
        if (data.selectedAgency) this.selectTierValue(page, 'agency', data.selectedAgency);
        if (data.selectedClass) this.selectTierValue(page, 'class', data.selectedClass);
        if (data.selectedFormat) this.selectTierValue(page, 'format', data.selectedFormat);

        // Check content boxes
        document.querySelectorAll(`input[name="content-${page}"]`).forEach(cb => {
            cb.checked = (data.selectedContent || []).includes(cb.value);
        });

        // Sync reviewer notes
        const notePresetEl = document.getElementById(`note-preset-${page}`);
        const noteTextEl = document.getElementById(`note-text-${page}`);
        if (notePresetEl) notePresetEl.value = data.noteType || "";
        if (noteTextEl) noteTextEl.value = data.notes || "";
    }

    updateStats() {
        const allPages = this.wb.classificationData ? this.wb.classificationData.pages.length : 0;
        const filtered = this.filteredPages.length;
        const reviewed = Object.values(this.wb.feedback).filter(f => f.status === "correct" || f.status === "incorrect").length;
        const correct = Object.values(this.wb.feedback).filter(f => f.status === "correct").length;
        const incorrect = Object.values(this.wb.feedback).filter(f => f.status === "incorrect").length;

        document.getElementById("stat-total").textContent = filtered < allPages ? `${filtered}/${allPages}` : allPages;
        document.getElementById("stat-reviewed").textContent = reviewed;
        document.getElementById("stat-correct").textContent = correct;
        document.getElementById("stat-incorrect").textContent = incorrect;
    }

    updatePagination() {
        const total = this.filteredPages.length;
        const totalPages = Math.max(1, Math.ceil(total / this.itemsPerPage));
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = Math.min(start + this.itemsPerPage, total);

        const prevBtn = document.getElementById('page-prev');
        const nextBtn = document.getElementById('page-next');
        const pageInput = document.getElementById('page-input');
        const pageTotal = document.getElementById('page-total');
        const pageRange = document.getElementById('page-range');

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (pageInput) { pageInput.value = this.currentPage; pageInput.max = totalPages; }
        if (pageTotal) pageTotal.textContent = `of ${totalPages}`;
        if (pageRange) pageRange.textContent = total > 0
            ? `Showing ${start + 1}\u2013${end} of ${total}`
            : 'No results';
    }

    goToPage(page) {
        const totalPages = Math.max(1, Math.ceil(this.filteredPages.length / this.itemsPerPage));
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        this.renderCards(this.filteredPages);
    }

    populateTypeFilter(pages) {
        const types = [...new Set(pages.map(p => p.doc_type))].sort();
        const agencies = [...new Set(pages.map(p => p.agency))].filter(Boolean).sort();

        const typeSelect = document.getElementById('filter-type');
        typeSelect.innerHTML = '<option value="">All Types</option>';
        types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            typeSelect.appendChild(opt);
        });

        const agencySelect = document.getElementById('filter-agency');
        if (agencySelect) {
            agencySelect.innerHTML = '<option value="">All Agencies</option>';
            agencies.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                agencySelect.appendChild(opt);
            });
        }
    }

    applyFilters() {
        if (!this.wb.classificationData) return;

        const typeFilter = document.getElementById("filter-type").value;
        const agencyFilter = document.getElementById("filter-agency")?.value || "";
        const statusFilter = document.getElementById("filter-status").value;
        const sortOrder = document.getElementById("sort-order").value;

        // Filter from full dataset (array-based, not DOM)
        let filtered = this.wb.classificationData.pages.filter(p => {
            const fb = this.wb.feedback[p.page] || {};
            const status = fb.status || "pending";
            const agency = fb.selectedAgency || p.agency;
            const docType = fb.selectedClass || p.doc_type;

            if (typeFilter && docType !== typeFilter) return false;
            if (agencyFilter && agency !== agencyFilter) return false;
            if (statusFilter && status !== statusFilter) return false;
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortOrder) {
                case "page-asc": return a.page - b.page;
                case "page-desc": return b.page - a.page;
                case "conf-asc": return a.confidence - b.confidence;
                case "conf-desc": return b.confidence - a.confidence;
                default: return 0;
            }
        });

        // Reset to page 1 and render
        this.currentPage = 1;
        this.renderCards(filtered);
        this.updateStats();
    }

    exportFeedback() {
        const exportData = {};
        for (const [page, data] of Object.entries(this.wb.feedback)) {
            exportData[page] = { ...data, page: parseInt(page) };
        }
        const data = {
            exportedAt: new Date().toISOString(),
            source: this.wb.FILE_NAME,
            summary: {
                total: document.querySelectorAll("[data-page]").length,
                reviewed: Object.values(this.wb.feedback).filter(f => f.status !== "pending").length,
                correct: Object.values(this.wb.feedback).filter(f => f.status === "correct").length,
                incorrect: Object.values(this.wb.feedback).filter(f => f.status === "incorrect").length,
            },
            feedback: exportData,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `classifier_feedback_${this.wb.FILE_NAME.replace('.pdf', '')}.json`;
        a.click();
    }

    clearFeedback() {
        if (confirm("Clear all feedback?")) {
            this.wb.feedback = {};
            localStorage.removeItem(this.wb.STORAGE_KEY);
            document.querySelectorAll("[data-page]").forEach(el => {
                el.classList.remove("correct", "incorrect");
                el.classList.add("pending");
                el.querySelectorAll(".type-btn").forEach(btn => btn.classList.remove("selected", "wrong"));
            });
            document.querySelectorAll("[id^=status-]").forEach(el => el.textContent = "");
            this.updateStats();
        }
    }

    // ── Modal ───────────────────────────────────────────────────
    async showModalPage(pageIndex) {
        if (!this.wb.pdfDoc) return;
        const page = await this.wb.pdfDoc.getPage(pageIndex + 1);
        const scale = 2.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.getElementById("modalCanvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        document.getElementById("imageModal").classList.add("active");
    }

    hideModal() {
        document.getElementById("imageModal").classList.remove("active");
    }
}

// =====================================================================
// EntitiesTab — Entity detection + approve/reject
// =====================================================================
class EntitiesTab {
    constructor(workbench) {
        this.wb = workbench;
    }

    async detectEntities() {
        const btn = document.getElementById('detect-entities-btn');
        const loading = document.getElementById('entity-loading');
        const results = document.getElementById('entity-results');

        btn.disabled = true;
        btn.textContent = 'Scanning...';
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        // Concatenate all page text and track offsets
        let combinedText = '';
        const pageOffsets = [];
        let currentOffset = 0;

        if (this.wb.classificationData && this.wb.classificationData.pages) {
            this.wb.classificationData.pages.forEach((page, idx) => {
                const text = (page.text || '') + '\n\n';
                pageOffsets.push({
                    start: currentOffset,
                    end: currentOffset + text.length,
                    index: idx + 1,
                    tags: page.tags || []
                });
                combinedText += text;
                currentOffset += text.length;
            });
        }

        if (!combinedText.trim()) {
            loading.classList.add('hidden');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">search</span> Detect Entities';
            this.wb.exportTab.showExportStatus('No page text available. Process pages in OCR first.', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: combinedText,
                    filename: this.wb.FILE_NAME,
                    include_candidates: true
                })
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const data = await res.json();

            // Helper to find page for a character position
            const findPage = (pos) => {
                const p = pageOffsets.find(o => pos >= o.start && pos < o.end);
                if (!p) return { index: 1, tags: [] };
                const fb = this.wb.feedback[p.index];
                const activeTags = fb && fb.selectedContent ? fb.selectedContent : (p.tags || []);
                return { index: p.index, tags: activeTags };
            };

            // Collect all unique tags for the document context summary (Predicted + Feedback)
            const docTags = new Set();
            pageOffsets.forEach(p => {
                const fb = this.wb.feedback[p.index];
                if (fb) {
                    if (fb.selectedContent) fb.selectedContent.forEach(t => docTags.add(t));
                    if (fb.selectedAgency) docTags.add(fb.selectedAgency);
                    if (fb.selectedType) docTags.add(fb.selectedType);
                } else if (p.tags) {
                    p.tags.forEach(t => docTags.add(t));
                }
            });

            // Enhance entities with page info (using updated findPage)
            this.wb.detectedEntities = (data.entities || []).map(e => {
                const pInfo = findPage(e.start_pos);
                return { ...e, page: pInfo.index, tags: pInfo.tags };
            });

            this.wb.detectedCandidates = (data.new_candidates || []).map(c => {
                const pInfo = findPage(c.start_pos);
                return { ...c, page: pInfo.index, tags: pInfo.tags };
            });

            // Update inline summary bar
            const s = data.summary || {};
            const matchesEl = document.getElementById('entity-matches-total');
            const breakdownEl = document.getElementById('entity-matches-breakdown');
            const candidatesEl = document.getElementById('entity-candidates-total');
            const tagsEl = document.getElementById('entity-summary-tags');

            if (matchesEl) matchesEl.textContent = `${s.matched || 0}`;
            if (breakdownEl) breakdownEl.textContent = `(${s.persons || 0}P/${s.places || 0}L/${s.orgs || 0}O)`;
            if (candidatesEl) candidatesEl.textContent = `${s.candidates || 0}`;

            if (tagsEl) {
                tagsEl.innerHTML = Array.from(docTags).map(t =>
                    `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10" style="color: var(--primary);">${t}</span>`
                ).join('') || '<span class="opacity-20 italic text-[10px]">No tags</span>';
            }

            this.renderEntitiesDashboard();

            loading.classList.add('hidden');
            results.classList.remove('hidden');

        } catch (err) {
            console.error('Entity detection failed:', err);
            this.wb.exportTab.showExportStatus(`Entity detection failed: ${err.message}. Is the server running?`, 'error');
            loading.classList.add('hidden');
        }

        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">search</span> Detect Entities';
    }

    renderEntitiesDashboard() {
        const tbody = document.getElementById('entities-dashboard-body');
        const filterType = document.getElementById('entity-filter-type')?.value || 'all';
        const filterStatus = document.getElementById('entity-filter-status')?.value || 'all';
        const filterTag = document.getElementById('entity-filter-tag')?.value || 'all';
        const searchQuery = (document.getElementById('entity-search')?.value || '').toLowerCase().trim();

        if (!this.wb.detectedEntities && !this.wb.detectedCandidates) return;

        // Combine all items into one list for the dashboard
        const allItems = [
            ...(this.wb.detectedEntities || []).map((e, i) => ({ ...e, _id: `matched-${i}`, _category: 'matched' })),
            ...(this.wb.detectedCandidates || []).map((c, i) => ({ ...c, _id: `candidate-${i}`, _category: 'candidate', display_name: c.text }))
        ];

        // Update Tag Filter Options (Dynamic based on detected items)
        this.updateFilterTags(allItems);

        // Apply filters
        const filtered = allItems.filter(item => {
            const matchesType = filterType === 'all' || item.entity_type === filterType;

            const approval = this.wb.entityApprovals[item._id] || 'pending';
            let matchesStatus = true;
            if (filterStatus === 'matched') matchesStatus = item._category === 'matched';
            else if (filterStatus === 'candidate') matchesStatus = item._category === 'candidate';
            else if (filterStatus !== 'all') matchesStatus = approval === filterStatus;

            const matchesTag = filterTag === 'all' || (item.tags && item.tags.includes(filterTag));
            const matchesSearch = !searchQuery || item.display_name.toLowerCase().includes(searchQuery);

            return matchesType && matchesStatus && matchesTag && matchesSearch;
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-12 opacity-30">No entities match your filters</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            const approval = this.wb.entityApprovals[item._id] || 'pending';
            const rowClass = approval === 'rejected' ? 'rejected' : approval === 'approved' ? 'approved' : '';
            const typeClass = `badge-entity-${item.entity_type}`;
            const isCandidate = item._category === 'candidate';

            return `
            <tr class="${rowClass}">
                <td>
                    <div class="font-bold">${item.display_name}</div>
                    <div class="text-[10px] opacity-40 flex gap-2">
                        <span>${item.method === 'ner' ? 'candidate' : (item.method || 'matched')}</span>
                        ${item.tags ? item.tags.map(t => `<span class="text-primary/60">#${t}</span>`).join(' ') : ''}
                    </div>
                </td>
                <td><span class="badge-entity-type ${typeClass}">${item.entity_type}</span></td>
                <td><div class="text-xs">${Math.round(item.confidence * 100)}%</div></td>
                <td>
                    <button data-action="jump-to-page" data-page="${item.page}" class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold">
                        Pg ${item.page}
                    </button>
                </td>
                <td class="whitespace-nowrap">
                    <button data-action="${isCandidate ? 'approve-candidate' : 'approve-entity'}" 
                            data-idx="${item._id.split('-')[1]}" 
                            class="text-[10px] px-2 py-1 ${approval === 'approved' ? 'text-green-400 font-bold' : 'opacity-40 hover:opacity-100'}">
                        ${isCandidate ? 'Add as New' : 'Approve'}
                    </button>
                    <button data-action="${isCandidate ? 'reject-candidate' : 'reject-entity'}" 
                            data-idx="${item._id.split('-')[1]}" 
                            class="text-[10px] px-2 py-1 ${approval === 'rejected' ? 'text-red-400 font-bold' : 'opacity-40 hover:opacity-100'}">
                        ${isCandidate ? 'Skip' : 'Reject'}
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    updateFilterTags(allItems) {
        const select = document.getElementById('entity-filter-tag');
        if (!select) return;
        const currentVal = select.value;
        const tags = new Set();
        allItems.forEach(item => { if (item.tags) item.tags.forEach(t => tags.add(t)); });

        let html = '<option value="all">All Tags</option>';
        Array.from(tags).sort().forEach(t => {
            html += `<option value="${t}" ${t === currentVal ? 'selected' : ''}>${t}</option>`;
        });

        // Only update if changed to avoid losing focus
        if (select.innerHTML !== html) select.innerHTML = html;
    }

    initFilters() {
        const self = this;
        ['entity-filter-type', 'entity-filter-status', 'entity-filter-tag'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => self.renderEntitiesDashboard());
        });
        document.getElementById('entity-search')?.addEventListener('input', () => self.renderEntitiesDashboard());
    }

    jumpToPage(pageIdx) {
        // 1. Switch tab
        this.wb.switchTab('classify');

        // 2. Wait for DOM and scroll
        setTimeout(() => {
            const card = document.querySelector(`[data-page="${pageIdx}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('highlight-flash');
                setTimeout(() => card.classList.remove('highlight-flash'), 2000);
            }
        }, 300);
    }

    approveEntity(idx) {
        this.wb.entityApprovals[`matched-${idx}`] = 'approved';
        this.wb.saveEntityApprovals();
        this.renderEntitiesDashboard();
    }

    rejectEntity(idx) {
        this.wb.entityApprovals[`matched-${idx}`] = 'rejected';
        this.wb.saveEntityApprovals();
        this.renderEntitiesDashboard();
    }

    approveCandidate(idx) {
        this.wb.entityApprovals[`candidate-${idx}`] = 'approved';
        this.wb.saveEntityApprovals();
        this.renderEntitiesDashboard();
    }

    rejectCandidate(idx) {
        this.wb.entityApprovals[`candidate-${idx}`] = 'rejected';
        this.wb.saveEntityApprovals();
        this.renderEntitiesDashboard();
    }
}


// =====================================================================
// ExportTab — Source record preview + JSON export
// =====================================================================
class ExportTab {
    constructor(workbench) {
        this.wb = workbench;
    }

    // ── Helpers ─────────────────────────────────────────────────
    frequency(arr) {
        if (!arr.length) return null;
        const c = {};
        arr.forEach(v => { c[v] = (c[v] || 0) + 1; });
        return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
    }

    showExportStatus(message, type = 'success') {
        const el = document.getElementById('export-status');
        el.classList.remove('hidden');
        el.style.borderColor = type === 'error' ? 'rgba(239, 68, 68, 0.4)' :
            type === 'warning' ? 'rgba(234, 179, 8, 0.4)' :
                'rgba(34, 197, 94, 0.4)';
        el.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.08)' :
            type === 'warning' ? 'rgba(234, 179, 8, 0.08)' :
                'rgba(34, 197, 94, 0.08)';
        el.textContent = message;
        setTimeout(() => el.classList.add('hidden'), 5000);
    }

    logExport(message) {
        const log = document.getElementById('export-log');
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.prepend(entry);
    }

    // ── Source record aggregation ───────────────────────────────
    populateSourceRecordPreview() {
        if (!this.wb.classificationData || !this.wb.classificationData.pages) return;

        const reviewed = [];
        for (const [page, data] of Object.entries(this.wb.feedback)) {
            if (data.status === 'correct' || data.status === 'incorrect') {
                reviewed.push(data);
            }
        }
        if (reviewed.length === 0) return;

        const agencies = reviewed.map(p => p.selectedAgency).filter(Boolean);
        const classes = reviewed.map(p => p.selectedClass).filter(Boolean);
        const formats = reviewed.map(p => p.selectedFormat).filter(Boolean);

        const agVal = this.frequency(agencies);
        const clVal = this.frequency(classes);
        const fmVal = this.frequency(formats);

        if (agVal) document.getElementById('export-agency').value = agVal;
        if (clVal) document.getElementById('export-source-type').value = clVal;
        if (fmVal) document.getElementById('export-format').value = fmVal;

        // Union of content tags
        const allTags = new Set();
        reviewed.forEach(p => (p.selectedContent || []).forEach(t => allTags.add(t)));
        const tagsEl = document.getElementById('export-content-tags');
        if (allTags.size > 0) {
            tagsEl.innerHTML = [...allTags].map(t =>
                `<span class="badge-tier badge-content">${t}</span>`
            ).join('');
        }

        // Auto-name from filename
        const nameInput = document.getElementById('export-source-name');
        if (!nameInput.value) {
            nameInput.value = this.wb.FILE_NAME.replace('.pdf', '').replace(/[-_]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
        }
    }

    // ── Export source record ────────────────────────────────────
    async exportSourceRecord() {
        const name = document.getElementById('export-source-name').value.trim();
        if (!name) { this.showExportStatus('Please enter a document name.', 'warning'); return; }

        const record = {
            id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            source_id: crypto.randomUUID(),
            name: name,
            display_name: name,
            source_type: document.getElementById('export-source-type').value,
            origin_agency: document.getElementById('export-agency').value || null,
            doc_format: document.getElementById('export-format').value || null,
            notes: document.getElementById('export-source-notes').value || '',
            url: '',
            people: [],
            organizations: [],
            places: []
        };

        // Attach approved matched entities
        if (this.wb.detectedEntities) {
            this.wb.detectedEntities.forEach((e, i) => {
                if (this.wb.entityApprovals[`matched-${i}`] === 'approved') {
                    if (e.entity_type === 'person')
                        record.people.push({ name: e.display_name, role: 'Mentioned' });
                    else if (e.entity_type === 'org')
                        record.organizations.push({ name: e.display_name, role: 'Mentioned' });
                    else if (e.entity_type === 'place')
                        record.places.push({ name: e.display_name, relevance: 'Mentioned' });
                }
            });
        }

        try {
            const res = await fetch('/api/entities/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_file: 'sources.json', record })
            });
            const data = await res.json();
            if (data.success) {
                const act = data.action === 'duplicate_skipped' ? 'already exists' : 'created';
                this.showExportStatus(`Source record ${act}: ${name}`);
                this.logExport(`Source: ${name} \u2192 sources.json (${act})`);
            } else {
                this.showExportStatus(`Export failed: ${data.error}`, 'error');
            }
        } catch (err) {
            this.showExportStatus(`Export failed: ${err.message}`, 'error');
        }
    }

    // ── Export new entities ─────────────────────────────────────
    async exportNewEntities() {
        if (!this.wb.detectedCandidates) {
            this.showExportStatus('Run entity detection first.', 'warning');
            return;
        }

        let exported = 0, skipped = 0;

        for (let i = 0; i < this.wb.detectedCandidates.length; i++) {
            if (this.wb.entityApprovals[`candidate-${i}`] !== 'approved') continue;

            const c = this.wb.detectedCandidates[i];
            let targetFile, record;

            if (c.entity_type === 'person') {
                targetFile = 'people.json';
                const parts = c.text.trim().split(/\s+/);
                const familyName = parts.pop();
                const givenName = parts.join(' ');
                record = {
                    person_id: crypto.randomUUID(),
                    display_name: c.text,
                    given_name: givenName,
                    family_name: familyName,
                    aliases: [],
                    notes: `Auto-detected from ${this.wb.FILE_NAME}`
                };
            } else if (c.entity_type === 'place') {
                targetFile = 'places.json';
                record = {
                    place_id: crypto.randomUUID(),
                    name: c.text,
                    place_type: 'SITE',
                    notes: `Auto-detected from ${this.wb.FILE_NAME}`
                };
            } else if (c.entity_type === 'org') {
                targetFile = 'organizations.json';
                record = {
                    org_id: crypto.randomUUID(),
                    name: c.text,
                    org_type: 'UNKNOWN',
                    notes: `Auto-detected from ${this.wb.FILE_NAME}`
                };
            } else { continue; }

            try {
                const res = await fetch('/api/entities/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target_file: targetFile, record })
                });
                const data = await res.json();
                if (data.success) {
                    if (data.action === 'created') exported++;
                    else skipped++;
                    this.logExport(`Entity: ${c.text} \u2192 ${targetFile} (${data.action})`);
                }
            } catch (err) {
                this.logExport(`FAILED: ${c.text} \u2192 ${targetFile}: ${err.message}`);
            }
        }
        this.showExportStatus(`Exported ${exported} new entities (${skipped} duplicates skipped)`);
    }
}

// =====================================================================
// InputTab — OCR scanning with kanban pipeline layout
// =====================================================================
class InputTab {
    constructor(workbench) {
        this.wb = workbench;
        this.queuedFiles = [];      // Array of {file, name, size, status, progress, current_msg, parsed_metadata}
        this.currentJob = null;     // Active job {id, status, files[], log[]}
        this.pollTimer = null;      // setTimeout reference
        this.logEntries = [];       // Array of {msg, type} for inline log
        this.outputDir = './processed';
        this.ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic', '.heif', '.zip', '.tar', '.gz', '.tgz', '.bz2'];
    }

    // --- Initialization ---

    async init() {
        this.setupDropZone();
        // Fetch server config
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const cfg = await res.json();
                this.outputDir = cfg.output_dir || './processed';
            }
        } catch { /* use default */ }
        // Resume in-progress job from localStorage
        const savedJobId = localStorage.getItem('ocr_current_job_id');
        if (savedJobId) {
            this.currentJob = { id: savedJobId, status: 'processing', files: [] };
            this.updateButtons(true);
            this.pollJob();
        }
    }

    setupDropZone() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        if (!dropZone || !fileInput) return;

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.addFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', (e) => {
            this.addFiles(e.target.files);
            fileInput.value = '';
        });
        // Keyboard shortcut: Ctrl+O
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                fileInput.click();
            }
        });
    }

    // --- Queue Management ---

    addFiles(fileList) {
        const files = Array.from(fileList);
        let added = 0;
        for (const f of files) {
            const ext = '.' + f.name.split('.').pop().toLowerCase();
            if (!this.ALLOWED_EXTS.includes(ext)) {
                this.logError(`Skipped ${f.name}: unsupported format`);
                continue;
            }
            if (this.queuedFiles.some(q => q.name === f.name)) {
                this.logError(`Skipped ${f.name}: already in queue`);
                continue;
            }
            this.queuedFiles.push({
                file: f,
                name: f.name,
                size: f.size,
                status: 'queued',
                progress: 0,
                current_msg: '',
                parsed_metadata: null
            });
            added++;
        }
        if (added > 0) {
            this.updateFileCount();
            this.renderKanban();
        }
    }

    removeFile(idx) {
        if (idx >= 0 && idx < this.queuedFiles.length && this.queuedFiles[idx].status === 'queued') {
            this.queuedFiles.splice(idx, 1);
            this.updateFileCount();
            this.renderKanban();
        }
    }

    clearCompleted() {
        this.queuedFiles = this.queuedFiles.filter(f => f.status !== 'completed');
        this.updateFileCount();
        this.renderKanban();
        this.updateStats();
    }

    clearAll() {
        if (this.currentJob && this.currentJob.status === 'processing') {
            this.wb.showToast('Cannot clear while processing');
            return;
        }
        this.queuedFiles = [];
        this.currentJob = null;
        this.logEntries = [];
        this.updateFileCount();
        this.renderKanban();
        this.updateStats();
    }

    updateFileCount() {
        const el = document.getElementById('input-file-count');
        if (!el) return;
        const queued = this.queuedFiles.filter(f => f.status === 'queued').length;
        const total = this.queuedFiles.length;
        if (total === 0) el.textContent = 'No files queued';
        else if (queued === total) el.textContent = `${total} file${total !== 1 ? 's' : ''} queued`;
        else el.textContent = `${total} file${total !== 1 ? 's' : ''} (${queued} queued)`;
    }

    // --- Settings ---

    getSettings() {
        return {
            backend: (document.querySelector('input[name="backend"]:checked') || {}).value || 'wsl',
            output_pdf: document.getElementById('output-pdf')?.checked ?? true,
            output_txt: document.getElementById('output-txt')?.checked ?? false,
            output_md: document.getElementById('output-md')?.checked ?? true,
            output_html: document.getElementById('output-html')?.checked ?? true,
            deskew: document.getElementById('option-deskew')?.checked ?? true,
            clean: document.getElementById('option-clean')?.checked ?? true,
            force_ocr: document.getElementById('option-force')?.checked ?? false
        };
    }

    // --- Processing Lifecycle ---

    async startProcessing() {
        const queued = this.queuedFiles.filter(f => f.status === 'queued');
        if (queued.length === 0) {
            this.wb.showToast('No files to process');
            return;
        }

        const settings = this.getSettings();
        const formData = new FormData();
        for (const qf of queued) {
            formData.append('files', qf.file);
        }
        formData.append('backend', settings.backend);
        formData.append('output_pdf', settings.output_pdf);
        formData.append('output_txt', settings.output_txt);
        formData.append('output_md', settings.output_md);
        formData.append('output_html', settings.output_html);
        formData.append('deskew', settings.deskew);
        formData.append('clean', settings.clean);
        formData.append('force_ocr', settings.force_ocr);

        this.logEntries = [];
        this.logMessage(`Creating job for ${queued.length} file(s)...`);

        try {
            const res = await fetch('/api/jobs', { method: 'POST', body: formData });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const job = await res.json();
            this.currentJob = job;
            localStorage.setItem('ocr_current_job_id', job.id);

            // Start the job
            const startRes = await fetch(`/api/jobs/${job.id}/start`, { method: 'POST' });
            if (!startRes.ok) throw new Error(`Start failed: HTTP ${startRes.status}`);

            this.logSuccess(`Job ${job.id} started`);
            this.updateButtons(true);
            this.pollJob();
        } catch (err) {
            this.logError(`Failed to start: ${err.message}`);
            this.updateButtons(false);
        }
    }

    async pollJob() {
        if (!this.currentJob) return;
        try {
            const res = await fetch(`/api/jobs/${this.currentJob.id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const job = await res.json();

            // Map server file statuses back to our queue
            if (job.files) {
                for (const serverFile of job.files) {
                    const local = this.queuedFiles.find(q => q.name === serverFile.name);
                    if (!local) continue;

                    if (serverFile.status === 'completed') {
                        local.status = 'completed';
                        local.progress = 100;
                        local.parsed_metadata = serverFile.parsed_metadata || null;
                        local.current_msg = '';
                    } else if (serverFile.status === 'processing') {
                        local.status = 'processing';
                        local.progress = serverFile.progress || 0;
                        local.current_msg = serverFile.current_msg || 'Processing...';
                    } else if (serverFile.status === 'failed') {
                        local.status = 'failed';
                        local.progress = 0;
                        local.current_msg = serverFile.error || 'Failed';
                    }
                }
            }

            // Append new log entries
            if (job.log && Array.isArray(job.log)) {
                const newEntries = job.log.slice(this.logEntries.length);
                for (const msg of newEntries) {
                    if (typeof msg === 'string') {
                        if (msg.includes('✓') || msg.toLowerCase().includes('completed')) {
                            this.logSuccess(msg);
                        } else if (msg.includes('✗') || msg.toLowerCase().includes('error')) {
                            this.logError(msg);
                        } else {
                            this.logMessage(msg);
                        }
                    }
                }
            }

            this.currentJob = job;
            this.renderKanban();
            this.updateStats();

            // Continue polling or finalize
            if (job.status === 'processing' || job.status === 'queued') {
                this.pollTimer = setTimeout(() => this.pollJob(), 500);
            } else {
                // Job finished
                localStorage.removeItem('ocr_current_job_id');
                this.updateButtons(false);
                if (job.status === 'completed') {
                    this.logSuccess('All files processed successfully');
                } else {
                    this.logError(`Job ended with status: ${job.status}`);
                }
                // Refresh SOURCE tab so new files appear
                if (this.wb.sourceTab) {
                    this.wb.sourceTab.loadHistory();
                }
            }
        } catch (err) {
            this.logError(`Poll error: ${err.message}`);
            // Retry after a longer delay on error
            this.pollTimer = setTimeout(() => this.pollJob(), 2000);
        }
    }

    async cancelProcessing() {
        if (!this.currentJob) return;
        try {
            await fetch(`/api/jobs/${this.currentJob.id}/cancel`, { method: 'POST' });
            this.logMessage('Job cancelled');
        } catch (err) {
            this.logError(`Cancel failed: ${err.message}`);
        }
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
        localStorage.removeItem('ocr_current_job_id');
        this.updateButtons(false);
        this.renderKanban();
    }

    updateButtons(processing) {
        const startBtn = document.querySelector('[data-action="input-start"]');
        const cancelBtn = document.querySelector('[data-action="input-cancel"]');
        if (startBtn) startBtn.disabled = processing;
        if (cancelBtn) cancelBtn.disabled = !processing;
    }

    // --- Kanban Rendering ---

    renderKanban() {
        const queuedEl = document.getElementById('kanban-queued');
        const processingEl = document.getElementById('kanban-processing');
        const completeEl = document.getElementById('kanban-complete');
        if (!queuedEl || !processingEl || !completeEl) return;

        const queued = [];
        const processing = [];
        const completed = [];

        this.queuedFiles.forEach((f, i) => {
            if (f.status === 'completed') completed.push({ f, i });
            else if (f.status === 'processing') processing.push({ f, i });
            else queued.push({ f, i }); // queued or failed
        });

        // QUEUED column
        queuedEl.innerHTML = queued.length === 0
            ? '<div class="kanban-empty">No files queued</div>'
            : queued.map(({ f, i }) => this.renderQueuedCard(f, i)).join('');

        // PROCESSING column
        if (processing.length === 0) {
            processingEl.innerHTML = '<div class="kanban-empty">Idle</div>';
        } else {
            processingEl.innerHTML = processing.map(({ f }) => this.renderProcessingCard(f)).join('')
                + this.renderLog();
        }

        // COMPLETE column
        completeEl.innerHTML = completed.length === 0
            ? '<div class="kanban-empty">No completed files</div>'
            : completed.map(({ f, i }) => this.renderCompleteCard(f, i)).join('');
    }

    renderQueuedCard(file, idx) {
        return `<div class="kanban-card">
            <div class="filename">${this.escapeHtml(file.name)}</div>
            <div class="meta">${this.formatFileSize(file.size)} · Waiting...</div>
            <div class="kanban-card-actions">
                <button data-action="input-remove" data-idx="${idx}">Remove</button>
            </div>
        </div>`;
    }

    renderProcessingCard(file) {
        return `<div class="kanban-card">
            <div class="filename">${this.escapeHtml(file.name)}</div>
            <div class="kanban-progress">
                <div class="kanban-progress-bar" style="width: ${file.progress}%"></div>
            </div>
            <div class="meta">${file.progress}% · ${this.escapeHtml(file.current_msg || 'Processing...')}</div>
        </div>`;
    }

    renderCompleteCard(file, idx) {
        const pm = file.parsed_metadata || {};
        let badge = '';
        if (pm.classified_type || pm.doc_type) {
            const type = pm.classified_type || pm.doc_type || '';
            const conf = pm.classification_confidence || pm.confidence || 0;
            const confPct = typeof conf === 'number' ? Math.round(conf * (conf < 1 ? 100 : 1)) : conf;
            const level = confPct >= 80 ? 'high' : (confPct >= 50 ? 'medium' : 'low');
            badge = `<span class="classification-badge ${level}">${this.escapeHtml(type)} ${confPct}%</span>`;
        }

        let metadata = '';
        const fields = [];
        if (pm.agency) fields.push(['Agency', pm.agency]);
        if (pm.date_iso || pm.date) fields.push(['Date', pm.date_iso || (pm.date && pm.date.value) || '']);
        if (pm.rif_number) fields.push(['RIF', pm.rif_number]);
        if (pm.author) fields.push(['Author', pm.author]);

        if (fields.length > 0) {
            metadata = `<div class="kanban-metadata">${fields.map(([label, value]) =>
                `<div class="meta-row"><span class="meta-label">${label}</span><span class="meta-value">${this.escapeHtml(String(value))}</span></div>`
            ).join('')}</div>`;
        }

        return `<div class="kanban-card">
            <div class="filename">${this.escapeHtml(file.name)}</div>
            ${badge}
            ${metadata}
            <div class="kanban-card-actions">
                <button data-action="input-copy-metadata" data-idx="${idx}" title="Copy metadata">
                    <span class="material-symbols-outlined" style="font-size:12px;">content_copy</span>
                </button>
                <button data-action="input-reparse" data-idx="${idx}" title="Re-parse metadata">
                    <span class="material-symbols-outlined" style="font-size:12px;">refresh</span>
                </button>
            </div>
        </div>`;
    }

    renderLog() {
        if (this.logEntries.length === 0) return '';
        const recent = this.logEntries.slice(-10);
        return `<div class="kanban-log">${recent.map(e => {
            const cls = e.type === 'success' ? ' class="log-success"' : (e.type === 'error' ? ' class="log-error"' : '');
            return `<p${cls}>> ${this.escapeHtml(e.msg)}</p>`;
        }).join('')}</div>`;
    }

    // --- Stats ---

    updateStats() {
        const totalEl = document.getElementById('input-stat-total');
        const successEl = document.getElementById('input-stat-success');
        const confEl = document.getElementById('input-stat-confidence');
        if (!totalEl) return;

        const total = this.queuedFiles.length;
        const succeeded = this.queuedFiles.filter(f => f.status === 'completed').length;

        let avgConf = '--';
        const confs = this.queuedFiles
            .filter(f => f.parsed_metadata && (f.parsed_metadata.classification_confidence || f.parsed_metadata.confidence))
            .map(f => {
                const c = f.parsed_metadata.classification_confidence || f.parsed_metadata.confidence || 0;
                return typeof c === 'number' ? (c < 1 ? c * 100 : c) : 0;
            });
        if (confs.length > 0) {
            avgConf = Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) + '%';
        }

        totalEl.textContent = total;
        successEl.textContent = succeeded;
        confEl.textContent = avgConf;
    }

    // --- Logging ---

    logMessage(msg) { this.logEntries.push({ msg, type: 'info' }); }
    logSuccess(msg) { this.logEntries.push({ msg, type: 'success' }); }
    logError(msg) { this.logEntries.push({ msg, type: 'error' }); }

    // --- Utilities ---

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Metadata Actions ---

    async copyMetadata(fileIdx) {
        const file = this.queuedFiles[fileIdx];
        if (!file || !file.parsed_metadata) {
            this.wb.showToast('No metadata to copy');
            return;
        }
        const pm = file.parsed_metadata;
        const lines = [];
        if (pm.rif_number) lines.push(`RIF: ${pm.rif_number}`);
        if (pm.agency) lines.push(`Agency: ${pm.agency}`);
        if (pm.date_iso) lines.push(`Date: ${pm.date_iso}`);
        if (pm.author) lines.push(`Author: ${pm.author}`);
        if (pm.classified_type || pm.doc_type) lines.push(`Type: ${pm.classified_type || pm.doc_type}`);

        if (lines.length === 0) {
            this.wb.showToast('No metadata fields found');
            return;
        }
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            this.wb.showToast('Metadata copied');
        } catch {
            this.wb.showToast('Copy failed');
        }
    }

    async reparseHeader(fileIdx) {
        const file = this.queuedFiles[fileIdx];
        if (!file) return;

        const baseName = file.name.replace(/\.[^.]+$/, '');
        try {
            // Fetch the text output
            const textRes = await fetch(`/api/download/${encodeURIComponent(baseName)}.txt`);
            if (!textRes.ok) throw new Error(`No text output found`);
            const text = await textRes.text();

            // Re-parse
            const parseRes = await fetch('/api/parse-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!parseRes.ok) throw new Error(`Parse failed`);
            const parsed = await parseRes.json();

            file.parsed_metadata = { ...file.parsed_metadata, ...parsed };
            this.renderKanban();
            this.wb.showToast('Metadata re-parsed');
        } catch (err) {
            this.wb.showToast(`Re-parse failed: ${err.message}`);
        }
    }
}

// =====================================================================
// SourceTab — File grid from /api/history (workbench mode only)
// =====================================================================
class SourceTab {
    constructor(workbench) {
        this.wb = workbench;
        this.files = [];
        this.filteredFiles = [];
    }

    async loadHistory() {
        const countEl = document.getElementById('source-count');
        const gridEl = document.getElementById('source-grid');
        const emptyEl = document.getElementById('source-empty');

        try {
            const res = await fetch('/api/history');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.files = data.files || [];

            if (this.files.length === 0) {
                gridEl.innerHTML = '';
                emptyEl.classList.remove('hidden');
                countEl.textContent = '0 documents';
                return;
            }

            emptyEl.classList.add('hidden');

            // Enrich files with localStorage review status
            this.files.forEach(f => {
                const fbKey = `workbench_feedback_${f.name}`;
                const clKey = `classifier_feedback_${f.name}`;
                const stored = localStorage.getItem(fbKey) || localStorage.getItem(clKey);
                if (stored) {
                    try {
                        const fb = JSON.parse(stored);
                        const reviewed = Object.values(fb).filter(v => v.status === 'correct' || v.status === 'incorrect').length;
                        f._reviewCount = reviewed;
                    } catch { f._reviewCount = 0; }
                } else {
                    f._reviewCount = 0;
                }
            });

            this.filteredFiles = [...this.files];
            this.applySort();
            this.renderGrid();
            countEl.textContent = `${this.files.length} document${this.files.length !== 1 ? 's' : ''}`;
        } catch (err) {
            console.error('Failed to load history:', err);
            countEl.textContent = 'Failed to load documents.';
        }
    }

    applySort() {
        const sortEl = document.getElementById('source-sort');
        const sort = sortEl ? sortEl.value : 'name-asc';

        this.filteredFiles.sort((a, b) => {
            switch (sort) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'status': return (b._reviewCount || 0) - (a._reviewCount || 0);
                default: return a.name.localeCompare(b.name);
            }
        });
    }

    applySearch() {
        const query = (document.getElementById('source-search')?.value || '').toLowerCase().trim();
        if (!query) {
            this.filteredFiles = [...this.files];
        } else {
            this.filteredFiles = this.files.filter(f => f.name.toLowerCase().includes(query));
        }
        this.applySort();
        this.renderGrid();

        const countEl = document.getElementById('source-count');
        const emptyEl = document.getElementById('source-empty');
        if (this.filteredFiles.length === 0 && query) {
            countEl.textContent = `No matches for "${query}"`;
            emptyEl.classList.add('hidden');
        } else {
            countEl.textContent = `${this.filteredFiles.length} document${this.filteredFiles.length !== 1 ? 's' : ''}`;
            emptyEl.classList.toggle('hidden', this.filteredFiles.length > 0);
        }
    }

    renderGrid() {
        const gridEl = document.getElementById('source-grid');

        gridEl.innerHTML = this.filteredFiles.map(f => {
            const isActive = this.wb.FILE_NAME === f.name;
            const activeClass = isActive ? ' active' : '';
            const sizeMB = f.size ? (f.size / (1024 * 1024)).toFixed(1) + ' MB' : '';
            const reviewCount = f._reviewCount || 0;

            let statusClass, statusLabel;
            if (reviewCount === 0) {
                statusClass = 'unreviewed'; statusLabel = 'Unreviewed';
            } else {
                statusClass = 'in-progress'; statusLabel = `${reviewCount} reviewed`;
            }

            return `
            <div class="source-card${activeClass}" data-action="select-file" data-filename="${f.name}">
                <div class="filename">${f.name}</div>
                <div class="meta">
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                    ${sizeMB ? `<span>${sizeMB}</span>` : ''}
                    <span>${f.type || ''}</span>
                </div>
            </div>`;
        }).join('');
    }

    selectFile(filename) {
        if (this.wb.FILE_NAME && this.wb.FILE_NAME !== filename) {
            if (!confirm(`Set "${filename}" as working document?\n\nThis will replace the current file.`)) return;
        }
        this.wb.loadFile(filename);
    }
}

// =====================================================================
// DocumentWorkbench — Main controller
// =====================================================================
class DocumentWorkbench {
    constructor(config) {
        this.config = config || {};

        // Detect mode: workbench (4-tab) vs classifier (2-tab)
        this.isWorkbenchMode = !!document.getElementById('tab-source');

        // Parse URL params
        const params = new URLSearchParams(window.location.search);
        const rawFile = params.get('file') || '';
        this.requestedTab = params.get('tab') || '';

        // File state (may be empty in workbench mode until selection)
        this.FILE_NAME = '';
        this.PDF_URL = '';
        if (rawFile) {
            this.setFile(rawFile);
        } else if (!this.isWorkbenchMode) {
            // Classifier fallback: default to yates-searchable.pdf
            this.setFile('yates-searchable.pdf');
        }

        // State
        this.pdfDoc = null;
        this.classificationData = null;
        this.feedback = {};
        this.entityApprovals = {};
        this.detectedEntities = null;
        this.detectedCandidates = null;

        // localStorage keys (set by setFile)
        this.STORAGE_KEY = '';
        this.EXPORT_STORAGE_KEY = '';

        // Tab controllers
        this.classifyTab = new ClassifyTab(this);
        this.entitiesTab = new EntitiesTab(this);
        this.exportTab = new ExportTab(this);
        this.sourceTab = this.isWorkbenchMode ? new SourceTab(this) : null;
        this.inputTab = this.isWorkbenchMode ? new InputTab(this) : null;
    }

    setFile(rawFile) {
        this.PDF_URL = (rawFile.startsWith('/') || rawFile.startsWith('http'))
            ? rawFile
            : `/api/download/${encodeURIComponent(rawFile)}`;
        this.FILE_NAME = rawFile.includes('/') ? rawFile.split('/').pop() : rawFile;

        // Workbench uses migrated keys; classifier keeps legacy keys for backward compat
        const prefix = this.isWorkbenchMode ? 'workbench' : 'classifier';
        this.STORAGE_KEY = `${prefix}_feedback_${this.FILE_NAME}`;
        this.EXPORT_STORAGE_KEY = `${prefix}_export_${this.FILE_NAME}`;
    }

    init() {
        // Run localStorage key migration (workbench mode)
        if (this.isWorkbenchMode) {
            this.migrateLocalStorageKeys();
        }

        // Restore persisted state if file is set
        if (this.FILE_NAME) {
            this.feedback = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            this.entityApprovals = JSON.parse(localStorage.getItem(this.EXPORT_STORAGE_KEY) || '{}');
        }

        // PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        // Set up event delegation
        this.bindEvents();

        // ── Header tab injection (workbench mode) ──────────────────
        if (this.isWorkbenchMode) {
            this.injectHeaderTabs();
        }

        if (this.isWorkbenchMode) {
            // Initialize INPUT tab (drop zone, config fetch, job restore)
            if (this.inputTab) this.inputTab.init();

            // Initialize ENTITIES tab filters
            if (this.entitiesTab) this.entitiesTab.initFilters();

            // Workbench mode: load file grid, handle deep-link
            this.sourceTab.loadHistory().then(() => {
                if (this.FILE_NAME) {
                    // Deep-link: file specified in URL → load it
                    this.loadFile(this.FILE_NAME, true);
                }
            });
        } else {
            // Classifier mode: load file directly (2-tab)
            document.title = `Classification Review: ${this.FILE_NAME}`;
            this.loadClassificationData();
        }
    }

    // ── localStorage migration (classifier → workbench keys) ────
    migrateLocalStorageKeys() {
        const migrated = localStorage.getItem('workbench_migration_v1');
        if (migrated) return;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('classifier_feedback_')) {
                const file = key.replace('classifier_feedback_', '');
                if (!localStorage.getItem(`workbench_feedback_${file}`)) {
                    localStorage.setItem(`workbench_feedback_${file}`, localStorage.getItem(key));
                }
            }
            if (key.startsWith('classifier_export_')) {
                const file = key.replace('classifier_export_', '');
                if (!localStorage.getItem(`workbench_export_${file}`)) {
                    localStorage.setItem(`workbench_export_${file}`, localStorage.getItem(key));
                }
            }
        }
        localStorage.setItem('workbench_migration_v1', Date.now().toString());
    }

    // ── Event delegation (replaces all inline onclick) ──────────
    bindEvents() {
        const self = this;

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                const tab = btn.dataset.tab;
                self.switchTab(tab);
            });
        });

        // Delegated click events on the main content area
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const page = target.dataset.page;
            const idx = target.dataset.idx !== undefined ? parseInt(target.dataset.idx) : null;

            switch (action) {
                // Input tab
                case 'input-start':
                    if (self.inputTab) self.inputTab.startProcessing();
                    break;
                case 'input-cancel':
                    if (self.inputTab) self.inputTab.cancelProcessing();
                    break;
                case 'input-remove':
                    if (self.inputTab && idx !== null) self.inputTab.removeFile(idx);
                    break;
                case 'input-clear-completed':
                    if (self.inputTab) self.inputTab.clearCompleted();
                    break;
                case 'input-clear-all':
                    if (self.inputTab) self.inputTab.clearAll();
                    break;
                case 'input-copy-metadata':
                    if (self.inputTab && idx !== null) self.inputTab.copyMetadata(idx);
                    break;
                case 'input-reparse':
                    if (self.inputTab && idx !== null) self.inputTab.reparseHeader(idx);
                    break;
                // Source tab
                case 'select-file':
                    if (self.sourceTab) self.sourceTab.selectFile(target.dataset.filename);
                    break;
                // (reserved)
                // Classify tab — pagination
                case 'page-prev':
                    self.classifyTab.goToPage(self.classifyTab.currentPage - 1);
                    break;
                case 'page-next':
                    self.classifyTab.goToPage(self.classifyTab.currentPage + 1);
                    break;
                // Classify tab
                case 'submit-4tier':
                    self.classifyTab.submit4Tier(parseInt(page));
                    break;
                case 'show-modal':
                    self.classifyTab.showModalPage(parseInt(target.dataset.pageIndex));
                    break;
                case 'select-type':
                    // Handled within renderCard's own logic
                    break;
                case 'select-hybrid-chip':
                    self.classifyTab.selectTierValue(parseInt(page), target.dataset.tier, target.dataset.value);
                    break;
                case 'export-feedback':
                    self.classifyTab.exportFeedback();
                    break;
                case 'clear-feedback':
                    self.classifyTab.clearFeedback();
                    break;
                // Entities tab
                case 'detect-entities':
                    self.entitiesTab.detectEntities();
                    break;
                case 'jump-to-page':
                    self.entitiesTab.jumpToPage(parseInt(target.dataset.page));
                    break;
                case 'approve-entity':
                    self.entitiesTab.approveEntity(idx);
                    break;
                case 'reject-entity':
                    self.entitiesTab.rejectEntity(idx);
                    break;
                case 'approve-candidate':
                    self.entitiesTab.approveCandidate(idx);
                    break;
                case 'reject-candidate':
                    self.entitiesTab.rejectCandidate(idx);
                    break;
                // Export tab
                case 'export-source-record':
                    self.exportTab.exportSourceRecord();
                    break;
                case 'export-new-entities':
                    self.exportTab.exportNewEntities();
                    break;
            }
        });

        // Delegated change/input events for note presets and text
        document.addEventListener('change', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            if (target.dataset.action === 'note-preset') {
                self.classifyTab.applyNotePreset(parseInt(target.dataset.page));
            }
            if (target.dataset.action === 'filter') {
                self.classifyTab.applyFilters();
            }
            if (target.dataset.action === 'select-hybrid-dropdown') {
                const val = target.value;
                if (val) self.classifyTab.selectTierValue(parseInt(target.dataset.page), target.dataset.tier, val);
            }
        });

        document.addEventListener('input', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            if (target.dataset.action === 'note-input') {
                self.classifyTab.saveNote(parseInt(target.dataset.page));
            }
        });

        // Filter selects
        ['filter-type', 'filter-agency', 'filter-status', 'sort-order'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => self.classifyTab.applyFilters());
        });

        // Pagination page input
        const pageInput = document.getElementById('page-input');
        if (pageInput) {
            pageInput.addEventListener('change', () => {
                self.classifyTab.goToPage(parseInt(pageInput.value) || 1);
            });
        }

        // Source tab search/sort (workbench mode only)
        if (this.isWorkbenchMode) {
            const searchEl = document.getElementById('source-search');
            if (searchEl) {
                searchEl.addEventListener('input', () => self.sourceTab.applySearch());
            }
            const sortEl = document.getElementById('source-sort');
            if (sortEl) {
                sortEl.addEventListener('change', () => {
                    self.sourceTab.applySort();
                    self.sourceTab.renderGrid();
                });
            }
        }

        // Modal dismiss
        document.getElementById('imageModal')?.addEventListener('click', () => {
            self.classifyTab.hideModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') self.classifyTab.hideModal();
        });
    }

    // ── Header tab injection ─────────────────────────────────────
    injectHeaderTabs() {
        const header = document.querySelector('header[data-component="header"]');
        if (!header) return;

        const leftGroup = header.querySelector('.flex.items-center.gap-3');
        if (!leftGroup) return;

        // Elements to fade out: search icon and branding title
        const searchLink = leftGroup.querySelector('a[href*="search"]');
        const brandingLink = leftGroup.querySelector('a.pl-4');
        const breadcrumb = leftGroup.querySelector('#breadcrumb-nav');

        // Fade out then remove search, branding, and breadcrumb
        [searchLink, brandingLink, breadcrumb].forEach(el => {
            if (el) {
                el.style.transition = 'opacity 0.2s ease';
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                // Remove from flow after fade completes (eliminates ghost gap-3 spacing)
                setTimeout(() => { el.style.display = 'none'; }, 220);
            }
        });

        // Create tab container
        const tabContainer = document.createElement('div');
        tabContainer.className = 'header-tabs';
        tabContainer.style.opacity = '0';
        tabContainer.style.transition = 'opacity 0.3s ease 0.15s';

        const tabs = [
            { name: 'input', icon: 'upload_file', label: 'Input' },
            { name: 'source', icon: 'folder_open', label: 'Source' },
            { name: 'classify', icon: 'rate_review', label: 'Classify', locked: true },
            { name: 'entities', icon: 'person_search', label: 'Entities', locked: true },
            { name: 'export', icon: 'file_export', label: 'Export', locked: true }
        ];

        const self = this;
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = 'header-tab-btn' + (tab.name === 'input' ? ' active' : '') + (tab.locked ? ' disabled' : '');
            btn.setAttribute('data-tab', tab.name);
            btn.textContent = tab.label;
            btn.addEventListener('click', () => self.switchTab(tab.name));
            tabContainer.appendChild(btn);
        });

        // Insert tabs as direct child of outer header wrapper (between left and right groups)
        // This lets justify-between center them between menu and user icon
        const headerWrapper = header.querySelector('.flex.h-16');
        if (headerWrapper) {
            const rightGroup = headerWrapper.lastElementChild;
            headerWrapper.insertBefore(tabContainer, rightGroup);
        } else {
            leftGroup.appendChild(tabContainer);
        }

        // Trigger fade in
        requestAnimationFrame(() => {
            tabContainer.style.opacity = '1';
        });
    }

    // ── Progressive unlock ──────────────────────────────────────
    getUnlockState() {
        const hasFile = !!this.FILE_NAME && !!this.classificationData;
        const reviewedCount = Object.values(this.feedback).filter(
            v => v.status === 'correct' || v.status === 'incorrect'
        ).length;
        const hasReviewed = reviewedCount > 0;
        const approvedCount = Object.values(this.entityApprovals).filter(v => v === 'approved').length;
        const hasApproved = approvedCount > 0;

        return {
            input: true,
            source: true,
            classify: hasFile,
            entities: hasFile,
            export: hasFile && hasApproved
        };
    }

    updateTabStates() {
        if (!this.isWorkbenchMode) return;

        const unlock = this.getUnlockState();

        ['classify', 'entities', 'export'].forEach(tab => {
            const btn = document.querySelector(`[data-tab="${tab}"]`);
            if (!btn) return;

            if (unlock[tab]) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }

            // Toggle locked message vs content
            const locked = document.getElementById(`${tab}-locked`);
            const content = document.getElementById(`${tab}-content`);
            if (locked && content) {
                if (unlock[tab]) {
                    locked.classList.add('hidden');
                    content.classList.remove('hidden');
                } else {
                    locked.classList.remove('hidden');
                    content.classList.add('hidden');
                }
            }
        });
    }

    // ── Tab switching ───────────────────────────────────────────
    switchTab(tabName) {
        // In workbench mode, check if tab is unlocked
        if (this.isWorkbenchMode) {
            const unlock = this.getUnlockState();
            if (!unlock[tabName]) {
                // Fall back to highest unlocked tab
                const fallback = ['export', 'entities', 'classify', 'source', 'input']
                    .find(t => unlock[t]) || 'input';
                if (fallback !== tabName) {
                    const reasons = {
                        classify: 'Select a document first',
                        entities: 'Review pages in Classify tab',
                        export: 'Approve entities first'
                    };
                    this.showToast(`${tabName.charAt(0).toUpperCase() + tabName.slice(1)} requires: ${reasons[tabName] || 'prerequisites'}`);
                    tabName = fallback;
                }
            }
        }

        document.querySelectorAll('.tab-btn, .header-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        const panel = document.getElementById(`tab-${tabName}`);
        if (panel) panel.classList.add('active');

        // Populate export preview when switching to export
        if (tabName === 'export') this.exportTab.populateSourceRecordPreview();

        // Update URL (workbench mode)
        if (this.isWorkbenchMode) {
            const url = new URL(window.location);
            if (this.FILE_NAME) url.searchParams.set('file', this.FILE_NAME);
            url.searchParams.set('tab', tabName);
            history.replaceState(null, '', url);
        }
    }

    // ── File loading (workbench multi-file support) ─────────────
    async loadFile(filename, isDeepLink = false) {
        // Destroy previous PDF to prevent memory leaks
        this.destroy();

        // Reset downstream state
        this.classificationData = null;
        this.feedback = {};
        this.entityApprovals = {};
        this.detectedEntities = null;
        this.detectedCandidates = null;

        // Clear rendered content and show loading spinner
        const cardsContainer = document.getElementById('cards-container');
        if (cardsContainer) cardsContainer.innerHTML = '<div class="text-center py-12 opacity-60"><span class="loading-spinner"></span> Loading classifications\u2026</div>';
        const entityResults = document.getElementById('entity-results');
        if (entityResults) entityResults.classList.add('hidden');
        const entityLoading = document.getElementById('entity-loading');
        if (entityLoading) entityLoading.classList.add('hidden');


        // Set new file
        this.setFile(filename);

        // Restore persisted state for this file
        this.feedback = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        this.entityApprovals = JSON.parse(localStorage.getItem(this.EXPORT_STORAGE_KEY) || '{}');

        // Update title
        document.title = `Document Workbench: ${this.FILE_NAME}`;

        // Switch to CLASSIFY immediately so user sees the loading spinner
        // Bypass switchTab() which would block on unlock check (classificationData is null)
        if (this.isWorkbenchMode) {
            document.querySelectorAll('.tab-btn, .header-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const classifyBtn = document.querySelector('[data-tab="classify"]');
            if (classifyBtn) { classifyBtn.classList.add('active'); classifyBtn.classList.remove('disabled'); }
            const classifyPanel = document.getElementById('tab-classify');
            if (classifyPanel) classifyPanel.classList.add('active');
            const classifyLocked = document.getElementById('classify-locked');
            const classifyContent = document.getElementById('classify-content');
            if (classifyLocked) classifyLocked.classList.add('hidden');
            if (classifyContent) classifyContent.classList.remove('hidden');
        }

        // Reset stats and pagination immediately so user sees fresh state
        document.getElementById('stat-total').textContent = '\u2014';
        document.getElementById('stat-reviewed').textContent = '0';
        document.getElementById('stat-correct').textContent = '0';
        document.getElementById('stat-incorrect').textContent = '0';
        document.getElementById('file-info').textContent = `${filename} \u2022 Loading\u2026`;
        this.classifyTab.currentPage = 1;
        this.classifyTab.filteredPages = [];
        this.classifyTab.updatePagination();
        const filterType = document.getElementById('filter-type');
        const filterAgency = document.getElementById('filter-agency');
        const filterStatus = document.getElementById('filter-status');
        if (filterType) filterType.innerHTML = '<option value="">All Types</option>';
        if (filterAgency) filterAgency.innerHTML = '<option value="">All Agencies</option>';
        if (filterStatus) filterStatus.value = '';

        // Load classification data
        await this.loadClassificationData();

        // Update tab states after loading
        this.updateTabStates();

        // Re-render source grid to show active file
        if (this.sourceTab) this.sourceTab.renderGrid();

        // Navigate to requested or default tab
        if (isDeepLink && this.requestedTab) {
            this.switchTab(this.requestedTab);
        } else {
            this.switchTab('classify');
        }
    }

    // ── Data loading ────────────────────────────────────────────
    async loadClassificationData() {
        const statusEl = document.getElementById('load-status');
        if (statusEl) statusEl.innerHTML = '<span class="loading-spinner"></span> Classifying pages\u2026';

        try {
            const res = await fetch(`/api/review/${encodeURIComponent(this.FILE_NAME)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            this.classificationData = await res.json();
            console.log('Classification data loaded:', this.classificationData.total_pages, 'pages');

            document.getElementById('file-info').textContent =
                `${this.classificationData.filename} \u2022 ${this.classificationData.total_pages} pages \u2022 ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
            document.getElementById('stat-total').textContent = this.classificationData.total_pages;

            this.classifyTab.populateTypeFilter(this.classificationData.pages);
            this.classifyTab.renderCards(this.classificationData.pages);
            if (statusEl) statusEl.textContent = '';

            this.loadPDF();

            // Apply saved feedback
            for (const [page, data] of Object.entries(this.feedback)) {
                this.classifyTab.applyFeedbackUI(page, data);
            }
            this.classifyTab.updateStats();

            // Update progressive unlock
            if (this.isWorkbenchMode) this.updateTabStates();

        } catch (err) {
            console.error('Failed to load classification data:', err);
            if (statusEl) statusEl.innerHTML = `<span class="text-red-400">\u26A0 ${err.message}</span>`;
        }
    }

    async loadPDF() {
        try {
            console.log('Loading PDF from:', this.PDF_URL);
            const loadingTask = pdfjsLib.getDocument(this.PDF_URL);
            this.pdfDoc = await loadingTask.promise;
            console.log('PDF loaded successfully:', this.pdfDoc.numPages, 'pages');
            this.classifyTab.setupLazyLoading();
        } catch (err) {
            console.error('Failed to load PDF:', err);
            document.querySelectorAll('.canvas-loading').forEach(el => {
                el.textContent = 'PDF load failed';
                el.style.color = 'red';
            });
        }
    }

    // ── Persistence ─────────────────────────────────────────────
    saveFeedback() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.feedback));
        // Update progressive unlock after feedback changes
        if (this.isWorkbenchMode) this.updateTabStates();
    }

    saveEntityApprovals() {
        localStorage.setItem(this.EXPORT_STORAGE_KEY, JSON.stringify(this.entityApprovals));
        // Update progressive unlock after approval changes
        if (this.isWorkbenchMode) this.updateTabStates();
    }

    // ── Toast ───────────────────────────────────────────────────
    showToast(message) {
        const existing = document.querySelector('.workbench-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'workbench-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ── Cleanup ─────────────────────────────────────────────────
    destroy() {
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }
        if (this.classifyTab.observer) {
            this.classifyTab.observer.disconnect();
            this.classifyTab.observer = null;
        }
        this.classifyTab.renderedPages.clear();
        this.classifyTab.renderQueue = [];
        this.classifyTab.activeRenders = 0;
    }
}

// ── Auto-init on DOMContentLoaded ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.workbench = new DocumentWorkbench();
    window.workbench.init();
});
