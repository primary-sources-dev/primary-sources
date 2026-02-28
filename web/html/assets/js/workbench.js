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
            <div class="flex gap-6">
                <!-- Left: PDF Page -->
                <div class="flex-shrink-0 max-w-[320px]">
                    <div class="canvas-container shadow-lg">
                        <canvas id="canvas-${page_index}" class="pdf-canvas rounded-sm" data-page-index="${page_index}" data-action="show-modal"></canvas>
                        <div class="canvas-loading">Loading...</div>
                        ${isContinuation ? '<div class="absolute top-0 right-0 bg-blue-600 text-[9px] px-1.5 py-0.5 font-bold tracking-tighter shadow-md">CONTINUITY</div>' : ''}
                    </div>
                </div>

                <!-- Right: Classification and 4-Tier Feedback -->
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-xl" style="color: var(--primary);">Page ${page}</span>
                            <span class="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-xs ${this.confidenceColor(confidence)}">${confPct}% Match</span>
                            <div id="verified-badge-${page}" class="hidden verified-badge text-xs">
                                <span class="material-symbols-outlined text-sm">verified</span> Verified
                            </div>
                        </div>
                        <div id="status-text-${page}" class="text-xs opacity-60 italic"></div>
                    </div>

                    <!-- Mirror Logic (Summary View) -->
                    <div class="grid grid-cols-2 gap-2 mb-4 p-3 bg-black/20 rounded border border-white/5">
                        <div class="flex flex-col gap-1">
                            <label class="text-[9px] uppercase tracking-wider opacity-40">1. Agency</label>
                            <span class="badge-tier badge-agency w-fit" id="view-agency-${page}">${agency || 'UNKNOWN'}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[9px] uppercase tracking-wider opacity-40">2. Document Class</label>
                            <span class="badge-tier badge-class w-fit" id="view-class-${page}">${doc_type}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[9px] uppercase tracking-wider opacity-40">3. Format</label>
                            <span class="badge-tier badge-format w-fit" id="view-format-${page}">PENDING</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[9px] uppercase tracking-wider opacity-40">4. Content Tags</label>
                            <div id="view-content-${page}" class="flex flex-wrap gap-1">
                                <span class="text-[10px] opacity-30 italic">Not set</span>
                            </div>
                        </div>
                    </div>

                    <!-- 4-Tier Correction Form -->
                    <div class="p-3 bg-archive-dark rounded-md border border-white/5 mb-4 shadow-inner">
                        <div class="grid grid-cols-3 gap-3 mb-3">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] opacity-60">Agency:</label>
                                <select id="select-agency-${page}" class="bg-black/40 border border-white/10 text-[11px] p-1 rounded">
                                    ${AGENCIES.map(a => `<option value="${a}" ${a === agency ? 'selected' : ''}>${a}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] opacity-60">Class:</label>
                                <select id="select-class-${page}" class="bg-black/40 border border-white/10 text-[11px] p-1 rounded">
                                    ${CLASSES.map(c => `<option value="${c}" ${c === 'REPORT' ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] opacity-60">Format:</label>
                                <select id="select-format-${page}" class="bg-black/40 border border-white/10 text-[11px] p-1 rounded">
                                    <option value="">-- Auto --</option>
                                    ${FORMATS.map(f => `<option value="${f}">${f}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Tier 4: Content Tags -->
                        <div class="mb-3">
                            <label class="text-[10px] opacity-60 block mb-1">Content Tags (Select many):</label>
                            <div class="flex flex-wrap gap-1 p-2 bg-black/30 rounded border border-white/5 max-h-[80px] overflow-y-auto">
                                ${CONTENT_TYPES.map(ct => `
                                    <label class="flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer whitespace-nowrap">
                                        <input type="checkbox" name="content-${page}" value="${ct}" class="scale-75"> ${ct}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="text-[10px] opacity-60 block mb-1">Reviewer Note (Optional):</label>
                            <div class="grid grid-cols-1 gap-2">
                                <select id="note-preset-${page}" class="bg-black/40 border border-white/10 text-[11px] p-1 rounded" data-action="note-preset" data-page="${page}">
                                    <option value="">-- Select preset --</option>
                                    ${Object.entries(NOTE_PRESETS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                                </select>
                                <textarea id="note-text-${page}" rows="2" placeholder="Add review context, ambiguity notes, or follow-up items..." class="bg-black/40 border border-white/10 text-[11px] p-2 rounded resize-y" data-action="note-input" data-page="${page}"></textarea>
                            </div>
                        </div>

                        <div class="flex items-center justify-between mt-4">
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="flag-new-${page}" class="scale-90">
                                <label for="flag-new-${page}" class="text-[10px] text-yellow-500/80">Flag as New Document Type</label>
                            </div>
                            <button class="bg-primary hover:bg-primary/80 text-archive-dark px-4 py-1.5 rounded font-bold text-xs transition-colors shadow-lg" data-action="submit-4tier" data-page="${page}">
                                APPLY & VERIFY
                            </button>
                        </div>
                    </div>

                    <!-- Technical Details -->
                    <details class="mb-2">
                        <summary class="text-[10px] opacity-30 cursor-pointer hover:opacity-100 transition-opacity">Show analysis fingerprints</summary>
                        <div class="mt-2 p-2 bg-black/40 rounded border border-white/5 text-[10px] font-mono leading-relaxed">
                            <div class="mb-2 text-primary font-bold">Matches:</div>
                            <div class="pl-2 border-l border-primary/30">${matched_patterns.join('<br>')}</div>
                        </div>
                    </details>
                </div>
            </div>
        </div>`;
    }

    renderCards(pages) {
        const container = document.getElementById('cards-container');
        container.innerHTML = pages.map(p => this.renderCard(p)).join('');
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

    submit4Tier(page) {
        const el = document.getElementById(`page-${page}`);
        const predicted = el.dataset.predicted;

        const agency = document.getElementById(`select-agency-${page}`).value;
        const docClass = document.getElementById(`select-class-${page}`).value;
        const format = document.getElementById(`select-format-${page}`).value;
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
                if (data.success) this.wb.showToast(`Verified Page ${page}`);
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
        const badgeEl = document.getElementById(`verified-badge-${page}`);

        if (status === "correct" || status === "incorrect") {
            statusEl.textContent = "\u2713 Verified";
            statusEl.classList.add("text-green-500");
            badgeEl.classList.remove("hidden");
        } else {
            statusEl.textContent = data?.notes ? "Note saved" : "";
            statusEl.classList.remove("text-green-500");
            badgeEl.classList.add("hidden");
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
        if (data.selectedAgency) {
            document.getElementById(`select-agency-${page}`).value = data.selectedAgency;
        }
        if (data.selectedClass) {
            document.getElementById(`select-class-${page}`).value = data.selectedClass;
        }
        if (Object.prototype.hasOwnProperty.call(data, "selectedFormat")) {
            document.getElementById(`select-format-${page}`).value = data.selectedFormat || "";
        }

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
        const visible = document.querySelectorAll("[data-page]:not(.hidden)").length;
        const total = document.querySelectorAll("[data-page]").length;
        const reviewed = Object.values(this.wb.feedback).filter(f => f.status === "correct" || f.status === "incorrect").length;
        const correct = Object.values(this.wb.feedback).filter(f => f.status === "correct").length;
        const incorrect = Object.values(this.wb.feedback).filter(f => f.status === "incorrect").length;

        document.getElementById("stat-total").textContent = visible < total ? `${visible}/${total}` : total;
        document.getElementById("stat-reviewed").textContent = reviewed;
        document.getElementById("stat-correct").textContent = correct;
        document.getElementById("stat-incorrect").textContent = incorrect;
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
        const typeFilter = document.getElementById("filter-type").value;
        const agencyFilter = document.getElementById("filter-agency")?.value || "";
        const statusFilter = document.getElementById("filter-status").value;
        const sortOrder = document.getElementById("sort-order").value;

        const container = document.getElementById("cards-container");
        const cards = Array.from(document.querySelectorAll("[data-page]"));

        cards.forEach(card => {
            const page = card.dataset.page;
            const predicted = card.dataset.predicted;
            const agency = card.dataset.agency;

            const currentFeedback = this.wb.feedback[page] || {};
            const status = currentFeedback.status || "pending";
            const currentAgency = currentFeedback.selectedAgency || agency;
            const currentClass = currentFeedback.selectedClass || predicted;

            let show = true;
            if (typeFilter && currentClass !== typeFilter) show = false;
            if (agencyFilter && currentAgency !== agencyFilter) show = false;
            if (statusFilter && status !== statusFilter) show = false;

            card.classList.toggle("hidden", !show);
        });

        const visibleCards = cards.filter(c => !c.classList.contains("hidden"));
        visibleCards.sort((a, b) => {
            const pageA = parseInt(a.dataset.page);
            const pageB = parseInt(b.dataset.page);
            const confA = parseFloat(a.dataset.confidence);
            const confB = parseFloat(b.dataset.confidence);

            switch (sortOrder) {
                case "page-asc": return pageA - pageB;
                case "page-desc": return pageB - pageA;
                case "conf-asc": return confA - confB;
                case "conf-desc": return confB - confA;
                default: return 0;
            }
        });

        visibleCards.forEach(card => container.appendChild(card));
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

        // Concatenate all page text
        let combinedText = '';
        if (this.wb.classificationData && this.wb.classificationData.pages) {
            for (const page of this.wb.classificationData.pages) {
                if (page.text) combinedText += page.text + '\n\n';
            }
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
            this.wb.detectedEntities = data.entities || [];
            this.wb.detectedCandidates = data.new_candidates || [];

            const s = data.summary || {};
            document.getElementById('entity-summary').innerHTML = `
                <div><span class="opacity-60">Matched:</span> <span class="font-bold">${s.matched || 0}</span></div>
                <div><span class="opacity-60">Persons:</span> ${s.persons || 0}</div>
                <div><span class="opacity-60">Places:</span> ${s.places || 0}</div>
                <div><span class="opacity-60">Orgs:</span> ${s.orgs || 0}</div>
                <div><span class="opacity-60">Candidates:</span> ${s.candidates || 0}</div>
            `;

            this.renderMatchedEntities(this.wb.detectedEntities);
            this.renderCandidateEntities(this.wb.detectedCandidates);

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

    renderMatchedEntities(entities) {
        const tbody = document.getElementById('matched-entities-body');
        if (!entities.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center opacity-40 py-4">No entities matched</td></tr>';
            return;
        }
        tbody.innerHTML = entities.map((e, i) => {
            const approval = this.wb.entityApprovals[`matched-${i}`] || 'pending';
            const rowClass = approval === 'rejected' ? 'rejected' : approval === 'approved' ? 'approved' : '';
            const typeClass = `badge-entity-${e.entity_type}`;
            return `
            <tr class="${rowClass}" id="entity-row-${i}">
                <td class="font-bold">${e.display_name}</td>
                <td><span class="badge-entity-type ${typeClass}">${e.entity_type}</span></td>
                <td>${Math.round(e.confidence * 100)}%</td>
                <td class="text-xs opacity-60">${e.method}</td>
                <td class="whitespace-nowrap">
                    <button data-action="approve-entity" data-idx="${i}" class="text-[10px] px-2 py-1 ${approval === 'approved' ? 'text-green-400 font-bold' : 'opacity-40 hover:opacity-100'}">Approve</button>
                    <button data-action="reject-entity" data-idx="${i}" class="text-[10px] px-2 py-1 ${approval === 'rejected' ? 'text-red-400 font-bold' : 'opacity-40 hover:opacity-100'}">Reject</button>
                </td>
            </tr>`;
        }).join('');
    }

    renderCandidateEntities(candidates) {
        const section = document.getElementById('candidates-section');
        const tbody = document.getElementById('candidate-entities-body');
        if (!candidates.length) { section.classList.add('hidden'); return; }
        section.classList.remove('hidden');
        tbody.innerHTML = candidates.map((c, i) => {
            const approval = this.wb.entityApprovals[`candidate-${i}`] || 'pending';
            const rowClass = approval === 'rejected' ? 'rejected' : approval === 'approved' ? 'approved' : '';
            return `
            <tr class="${rowClass}" id="candidate-row-${i}">
                <td class="font-bold">${c.text}</td>
                <td><span class="badge-entity-type badge-entity-person">${c.entity_type}</span></td>
                <td>${Math.round(c.confidence * 100)}%</td>
                <td class="whitespace-nowrap">
                    <button data-action="approve-candidate" data-idx="${i}" class="text-[10px] px-2 py-1 ${approval === 'approved' ? 'text-green-400 font-bold' : 'opacity-40 hover:opacity-100'}">Add as New</button>
                    <button data-action="reject-candidate" data-idx="${i}" class="text-[10px] px-2 py-1 ${approval === 'rejected' ? 'text-red-400 font-bold' : 'opacity-40 hover:opacity-100'}">Skip</button>
                </td>
            </tr>`;
        }).join('');
    }

    approveEntity(idx) {
        this.wb.entityApprovals[`matched-${idx}`] = 'approved';
        this.wb.saveEntityApprovals();
        if (this.wb.detectedEntities) this.renderMatchedEntities(this.wb.detectedEntities);
    }

    rejectEntity(idx) {
        this.wb.entityApprovals[`matched-${idx}`] = 'rejected';
        this.wb.saveEntityApprovals();
        if (this.wb.detectedEntities) this.renderMatchedEntities(this.wb.detectedEntities);
    }

    approveCandidate(idx) {
        this.wb.entityApprovals[`candidate-${idx}`] = 'approved';
        this.wb.saveEntityApprovals();
        if (this.wb.detectedCandidates) this.renderCandidateEntities(this.wb.detectedCandidates);
    }

    rejectCandidate(idx) {
        this.wb.entityApprovals[`candidate-${idx}`] = 'rejected';
        this.wb.saveEntityApprovals();
        if (this.wb.detectedCandidates) this.renderCandidateEntities(this.wb.detectedCandidates);
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
        const classes  = reviewed.map(p => p.selectedClass).filter(Boolean);
        const formats  = reviewed.map(p => p.selectedFormat).filter(Boolean);

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

        if (this.isWorkbenchMode) {
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
                // Source tab
                case 'select-file':
                    if (self.sourceTab) self.sourceTab.selectFile(target.dataset.filename);
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
            source: true,
            classify: hasFile,
            entities: hasFile && hasReviewed,
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
                const fallback = ['export', 'entities', 'classify', 'source']
                    .find(t => unlock[t]) || 'source';
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

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
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

        // Clear rendered content
        const cardsContainer = document.getElementById('cards-container');
        if (cardsContainer) cardsContainer.innerHTML = '';
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

        // Load classification data, then advance to appropriate tab
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
