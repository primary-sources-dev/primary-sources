// =====================================================================
// workbench.js — Document Workbench
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
    'ADDRESS_PARSE_ISSUE': 'Address extraction/parse issue',
    'AMBIGUOUS': 'Ambiguous classification',
    'PDF_RENDER_ISSUE': 'PDF render/canvas display issue',
    'OTHER_CUSTOM': 'Other (custom reason)'
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
        // One-card review flow: show a single page card at a time.
        this.itemsPerPage = 1;
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
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

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
    normalizeDetectedEntityType(rawType) {
        const v = String(rawType || '').toLowerCase();
        if (v === 'person') return 'person';
        if (v === 'place' || v === 'location') return 'location';
        if (v === 'org' || v === 'organization') return 'organization';
        if (v === 'address') return 'address';
        return null;
    }

    inferEntityTypeFromLabel(label, fallbackType = 'person') {
        const text = String(label || '').toLowerCase();
        if (!text) return fallbackType;

        // Organization cues
        if (/(bureau|department|agency|office|committee|commission|company|corp|corporation|inc|llc|club|university|school|bank)\b/.test(text)) {
            return 'organization';
        }
        // Location cues
        if (/(street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|lane|ln\.?|boulevard|blvd|highway|hwy|expressway|freeway|underpass|plaza|park|texas|dallas|houston)\b/.test(text)) {
            return 'location';
        }
        return fallbackType;
    }

    ensureSelectedEntitiesShape(page) {
        if (!this.wb.feedback[page]) this.wb.feedback[page] = { status: 'pending' };
        if (!this.wb.feedback[page].selectedEntities || typeof this.wb.feedback[page].selectedEntities !== 'object') {
            this.wb.feedback[page].selectedEntities = { person: [], location: [], organization: [], address: [] };
        }
        ['person', 'location', 'organization', 'address'].forEach(t => {
            if (!Array.isArray(this.wb.feedback[page].selectedEntities[t])) this.wb.feedback[page].selectedEntities[t] = [];
        });
    }

    getDetectedEntitiesForPage(page) {
        const items = [];
        (this.wb.detectedEntities || []).forEach((e, i) => {
            const baseType = this.normalizeDetectedEntityType(e.entity_type);
            const mappedType = baseType ? this.inferEntityTypeFromLabel(e.display_name || e.text, baseType) : null;
            if (!mappedType || Number(e.page) !== Number(page)) return;
            items.push({
                id: `matched-${i}`,
                type: mappedType,
                label: e.display_name || e.text || 'Unknown',
                confidence: e.confidence ?? null,
                entity_id: e.entity_id || null,
                detected_type: e.entity_type || null,
                source: 'matched'
            });
        });
        (this.wb.detectedCandidates || []).forEach((c, i) => {
            const baseType = this.normalizeDetectedEntityType(c.entity_type);
            const mappedType = baseType ? this.inferEntityTypeFromLabel(c.display_name || c.text, baseType) : null;
            if (!mappedType || Number(c.page) !== Number(page)) return;
            items.push({
                id: `candidate-${i}`,
                type: mappedType,
                label: c.display_name || c.text || 'Unknown',
                confidence: c.confidence ?? null,
                entity_id: null,
                detected_type: c.entity_type || null,
                source: 'candidate'
            });
        });
        return items;
    }

    addSelectedEntity(page, uiType, optionId) {
        if (!optionId) return;
        this.ensureSelectedEntitiesShape(page);
        const options = this.getDetectedEntitiesForPage(page).filter(o => o.type === uiType);
        const selected = options.find(o => o.id === optionId);
        if (!selected) return;
        const bucket = this.wb.feedback[page].selectedEntities[uiType];
        if (!bucket.some(e => e.id === selected.id)) {
            bucket.push(selected);
            this.wb.saveFeedback();
        }
    }

    removeSelectedEntity(page, uiType, optionId) {
        this.ensureSelectedEntitiesShape(page);
        const bucket = this.wb.feedback[page].selectedEntities[uiType];
        this.wb.feedback[page].selectedEntities[uiType] = bucket.filter(e => e.id !== optionId);
        this.wb.saveFeedback();
    }

    renderEntityAssist(page) {
        this.ensureSelectedEntitiesShape(page);
        const state = this.wb.feedback[page];
        const activeType = state.entityAssistType || 'person';
        const options = this.getDetectedEntitiesForPage(page).filter(o => o.type === activeType);
        const selectedSet = new Set((state.selectedEntities[activeType] || []).map(e => e.id));

        return `
            <div class="pt-2 border-t border-white/5">
                <label class="text-[10px] opacity-60 block mb-2 font-bold uppercase tracking-widest">Entities:</label>
                <div class="flex flex-wrap items-center gap-2">
                    <select id="entity-type-${page}" class="workbench-select min-w-[140px]" data-action="entity-type-change" data-page="${page}">
                        <option value="person" ${activeType === 'person' ? 'selected' : ''}>Person</option>
                        <option value="location" ${activeType === 'location' ? 'selected' : ''}>Location</option>
                        <option value="organization" ${activeType === 'organization' ? 'selected' : ''}>Organization</option>
                        <option value="address" ${activeType === 'address' ? 'selected' : ''}>Address</option>
                    </select>
                </div>
                <div class="mt-2 p-2 bg-black/20 rounded border border-white/10 max-h-[96px] overflow-y-auto">
                    ${options.length ? options.map(o => `
                        <label class="flex items-center gap-2 text-[10px] py-1">
                            <input type="checkbox" data-action="entity-checkbox" data-page="${page}" data-entity-type="${activeType}" data-entity-id="${o.id}" ${selectedSet.has(o.id) ? 'checked' : ''}>
                            <span>${o.label}</span>
                            ${o.source === 'candidate' ? '<span class="opacity-50 italic">(candidate)</span>' : ''}
                        </label>
                    `).join('') : '<span class="text-[10px] opacity-40 italic">Run Detect Entities to populate this list.</span>'}
                </div>
            </div>
        `;
    }

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
        // Route media segments to segment-specific card renderer
        if (pageData.media_type) {
            return this.renderSegmentCard(pageData);
        }
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
                    <div class="p-4 bg-archive-dark rounded-md border border-white/5 shadow-md space-y-4">
                        <!-- Page ID + Confidence -->
                        <div class="flex flex-wrap justify-between items-center gap-y-2 pb-3 border-b border-white/5">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-bold text-xl" style="color: var(--primary);">Page ${page}</span>
                                <span class="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[10px] ${this.confidenceColor(confidence)} whitespace-nowrap">${confPct}% Match</span>
                            </div>
                            <div id="status-text-${page}" class="text-[10px] opacity-60 italic whitespace-nowrap"></div>
                        </div>
                        <!-- Summary Header -->
                        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 pb-4 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest leading-none">
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Agency:</span>
                                <span class="badge-tier badge-agency" id="view-agency-${page}" data-default="${agency || 'UNKNOWN'}">${agency || 'UNKNOWN'}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Class:</span>
                                <span class="badge-tier badge-class" id="view-class-${page}" data-default="${doc_type}">${doc_type}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Format:</span>
                                <span class="badge-tier badge-format" id="view-format-${page}" data-default="PENDING">PENDING</span>
                            </div>
                        </div>
                        ${this.renderHybridSelector(page, 'agency', 'Agency', AGENCIES, agency)}
                        ${this.renderHybridSelector(page, 'class', 'Class', CLASSES, doc_type)}
                        ${this.renderHybridSelector(page, 'format', 'Format', FORMATS, 'PENDING')}
                        ${this.renderEntityAssist(page)}

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
                                <div id="reason-detail-wrap-${page}" style="display:none;">
                                    <input id="reason-detail-${page}" type="text" data-action="note-input" data-page="${page}"
                                        class="bg-black/40 border border-white/10 text-[11px] p-2 rounded w-full"
                                        placeholder="Custom reason detail (required for Other)">
                                </div>
                                <textarea id="note-text-${page}" rows="2"
                                    data-action="note-input" data-page="${page}"
                                    class="bg-black/40 border border-white/10 text-[11px] p-2 rounded resize-none w-full h-[54px]"
                                    placeholder="Context notes..."></textarea>
                            </div>
                            <div class="flex flex-col justify-between items-stretch">
                                <div class="flex items-center gap-2 mb-2 bg-black/20 p-2 rounded border border-white/5">
                                    <input type="checkbox" id="flag-new-${page}" class="scale-110">
                                    <label for="flag-new-${page}" class="text-[10px] opacity-80 cursor-pointer leading-tight">Flag as New Document Type</label>
                                </div>
                                <button class="w-full py-3 bg-primary text-archive-dark font-bold rounded shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        data-action="submit-4tier" data-page="${page}">
                                    <span class="material-symbols-outlined text-sm font-bold">check_circle</span>
                                    APPLY & SAVE
                                </button>
                                <button class="w-full py-3 bg-black/40 border border-white/15 text-archive-heading font-bold rounded hover:border-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        data-action="skip-4tier" data-page="${page}">
                                    <span class="material-symbols-outlined text-sm font-bold">redo</span>
                                    SKIP
                                </button>
                            </div>
                        </div>

                        <!-- Fingerprints (diagnostic detail) -->
                        <details class="pt-3 border-t border-white/5">
                            <summary class="text-[9px] opacity-30 cursor-pointer hover:opacity-100 transition-opacity">Fingerprints</summary>
                            <div class="mt-2 p-2 bg-black/40 rounded border border-white/5 text-[10px] font-mono leading-relaxed text-left">
                                <div class="mb-1 text-primary font-bold">Matches:</div>
                                <div class="pl-2 border-l border-primary/30">${matched_patterns.join('<br>')}</div>
                            </div>
                        </details>
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

        // Cards are rebuilt each pagination/filter pass, so reset render bookkeeping.
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.renderQueue = [];
        this.renderedPages.clear();

        const container = document.getElementById('cards-container');
        container.innerHTML = slice.map(p => this.renderCard(p)).join('');

        // Re-apply saved feedback to visible cards
        for (const p of slice) {
            const fb = this.wb.feedback[p.page];
            if (fb) this.applyFeedbackUI(p.page, fb);
        }

        if (this.wb.pdfDoc) this.setupLazyLoading();

        this.updatePagination();
    }

    // ── Segment card for media transcripts ────────────────────────
    renderSegmentCard(pageData) {
        const { page, page_index, doc_type, agency, confidence, matched_patterns, all_scores } = pageData;
        const confPct = Math.round(confidence * 100);
        const highlightsJson = JSON.stringify(matched_patterns || []).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const textContent = pageData.text || '';
        const textSample = textContent.substring(0, 1000).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const startTime = this.formatTime(pageData.segment_start || 0);
        const endTime = this.formatTime(pageData.segment_end || 0);
        const mediaIcon = pageData.media_type === 'video' ? 'videocam' : 'mic';

        return `
        <div id="page-${page}" class="card border p-4 pending" data-page="${page}" data-page-index="${page_index}"
            data-media-type="${pageData.media_type || 'audio'}"
            data-segment-id="${page_index}"
            data-segment-start="${pageData.segment_start || 0}"
            data-segment-end="${pageData.segment_end || 0}"
            data-predicted="${doc_type}" data-agency="${agency || 'UNKNOWN'}" data-confidence="${confidence}"
            data-highlights='${highlightsJson}' data-text-sample="${textSample}">
            <div class="card-layout">
                <!-- Left: Transcript Segment Preview -->
                <div class="flex-shrink-0" style="flex: 0 0 360px; max-width: 360px; width: 360px;">
                    <div class="segment-preview">
                        <div class="segment-header">
                            <span class="material-symbols-outlined text-primary">${mediaIcon}</span>
                            <span class="segment-time">${startTime} → ${endTime}</span>
                            <span class="media-badge">${(pageData.media_type || 'audio').toUpperCase()}</span>
                        </div>
                        <div class="flex gap-2 py-2 border-b border-white/10 mb-2">
                            <button class="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                                data-action="segment-copy-time"
                                data-page="${page}" data-time="${startTime}">
                                Copy Start ${startTime}
                            </button>
                            <button class="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                                data-action="segment-copy-time"
                                data-page="${page}" data-time="${endTime}">
                                Copy End ${endTime}
                            </button>
                        </div>
                        <div class="segment-text">${textContent}</div>
                    </div>
                </div>

                <!-- Right: Analysis Panel -->
                <div class="classification-panel">
                    <div class="p-4 bg-archive-dark rounded-md border border-white/5 shadow-md space-y-4">
                        <!-- Segment ID + Confidence -->
                        <div class="flex flex-wrap justify-between items-center gap-y-2 pb-3 border-b border-white/5">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-bold text-xl" style="color: var(--primary);">Seg ${page}</span>
                                <span class="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[10px] ${this.confidenceColor(confidence)} whitespace-nowrap">${confPct}% Match</span>
                            </div>
                            <div id="status-text-${page}" class="text-[10px] opacity-60 italic whitespace-nowrap"></div>
                        </div>
                        <!-- Summary Header -->
                        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 pb-4 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest leading-none">
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Agency:</span>
                                <span class="badge-tier badge-agency" id="view-agency-${page}" data-default="${agency || 'UNKNOWN'}">${agency || 'UNKNOWN'}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Class:</span>
                                <span class="badge-tier badge-class" id="view-class-${page}" data-default="${doc_type}">${doc_type}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="opacity-40">Format:</span>
                                <span class="badge-tier badge-format" id="view-format-${page}" data-default="PENDING">PENDING</span>
                            </div>
                        </div>
                        ${this.renderHybridSelector(page, 'agency', 'Agency', AGENCIES, agency)}
                        ${this.renderHybridSelector(page, 'class', 'Class', CLASSES, doc_type)}
                        ${this.renderHybridSelector(page, 'format', 'Format', FORMATS, 'PENDING')}
                        ${this.renderEntityAssist(page)}

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
                                <div id="reason-detail-wrap-${page}" style="display:none;">
                                    <input id="reason-detail-${page}" type="text" data-action="note-input" data-page="${page}"
                                        class="bg-black/40 border border-white/10 text-[11px] p-2 rounded w-full"
                                        placeholder="Custom reason detail (required for Other)">
                                </div>
                                <textarea id="note-text-${page}" rows="2"
                                    data-action="note-input" data-page="${page}"
                                    class="bg-black/40 border border-white/10 text-[11px] p-2 rounded resize-none w-full h-[54px]"
                                    placeholder="Context notes..."></textarea>
                            </div>
                            <div class="flex flex-col justify-between items-stretch">
                                <div class="flex items-center gap-2 mb-2 bg-black/20 p-2 rounded border border-white/5">
                                    <input type="checkbox" id="flag-new-${page}" class="scale-110">
                                    <label for="flag-new-${page}" class="text-[10px] opacity-80 cursor-pointer leading-tight">Flag as New Document Type</label>
                                </div>
                                <button class="w-full py-3 bg-primary text-archive-dark font-bold rounded shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        data-action="submit-4tier" data-page="${page}">
                                    <span class="material-symbols-outlined text-sm font-bold">check_circle</span>
                                    APPLY & SAVE
                                </button>
                                <button class="w-full py-3 bg-black/40 border border-white/15 text-archive-heading font-bold rounded hover:border-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        data-action="skip-4tier" data-page="${page}">
                                    <span class="material-symbols-outlined text-sm font-bold">redo</span>
                                    SKIP
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    // ── Feedback engine ─────────────────────────────────────────
    mapDocTypeToClass(docType) {
        const value = String(docType || '').toUpperCase();
        if (!value) return 'OTHER';
        if (value.includes('AFFIDAVIT')) return 'AFFIDAVIT';
        if (value.includes('DEPOSITION')) return 'DEPOSITION';
        if (value.includes('TESTIMONY')) return 'TESTIMONY';
        if (value.includes('EXHIBIT')) return 'EXHIBIT';
        if (value.includes('TRAVEL') || value.includes('PASSPORT') || value.includes('VISA')) return 'TRAVEL';
        if (value.includes('CABLE') || value.includes('TELETYPE') || value.includes('AIRTEL')) return 'CABLE';
        if (value.includes('MEMO')) return 'MEMO';
        if (value.includes('LETTER') || value.includes('CORRESPONDENCE')) return 'CORRESPONDENCE';
        if (value.includes('REPORT') || value.includes('302') || value.includes('STATEMENT') || value.includes('RIF')) return 'REPORT';
        if (value === 'UNKNOWN' || value === 'BLANK' || value === 'INDEX' || value === 'TOC' || value === 'COVER') return 'OTHER';
        return 'OTHER';
    }

    normalizeClassValue(rawValue, fallbackDocType = null) {
        const value = String(rawValue || '').trim().toUpperCase();
        if (!value) return null;
        if (CLASSES.includes(value)) return value;
        if (ALL_DOC_TYPES.includes(value)) return this.mapDocTypeToClass(value);
        if (fallbackDocType) return this.mapDocTypeToClass(fallbackDocType);
        return value;
    }

    statusToDisposition(status) {
        const s = String(status || '').toLowerCase();
        if (s === 'correct') return 'verified_approved';
        if (s === 'incorrect') return 'verified_not_approved';
        if (s === 'skipped') return 'needs_followup';
        return 'pending';
    }

    getReasonCode(page) {
        const preset = document.getElementById(`note-preset-${page}`)?.value || '';
        if (!preset) return null;
        return preset === 'OTHER_CUSTOM' ? 'OTHER' : preset;
    }

    getReasonDetail(page) {
        const preset = document.getElementById(`note-preset-${page}`)?.value || '';
        const detail = document.getElementById(`reason-detail-${page}`)?.value?.trim() || '';
        if (preset === 'OTHER_CUSTOM') return detail || null;
        return null;
    }

    toggleReasonDetail(page) {
        const preset = document.getElementById(`note-preset-${page}`)?.value || '';
        const wrapper = document.getElementById(`reason-detail-wrap-${page}`);
        if (!wrapper) return;
        wrapper.style.display = preset === 'OTHER_CUSTOM' ? '' : 'none';
    }

    applyNotePreset(page) {
        const preset = document.getElementById(`note-preset-${page}`).value;
        const textField = document.getElementById(`note-text-${page}`);
        this.toggleReasonDetail(page);
        if (preset && NOTE_PRESETS[preset] && preset !== 'OTHER_CUSTOM') {
            textField.value = NOTE_PRESETS[preset];
        }
        this.saveNote(page);
    }

    saveNote(page) {
        const preset = document.getElementById(`note-preset-${page}`).value;
        const text = document.getElementById(`note-text-${page}`).value;
        const reasonDetail = document.getElementById(`reason-detail-${page}`)?.value?.trim() || null;
        if (!this.wb.feedback[page]) this.wb.feedback[page] = { status: 'pending' };
        this.wb.feedback[page].noteType = preset || null;
        this.wb.feedback[page].notes = text || null;
        this.wb.feedback[page].reason_code = preset === 'OTHER_CUSTOM' ? 'OTHER' : (preset || this.wb.feedback[page].reason_code || null);
        this.wb.feedback[page].reason_detail = reasonDetail;
        this.wb.saveFeedback();
    }

    getSegmentMetaFromCard(page) {
        const el = document.getElementById(`page-${page}`);
        if (!el) return { source_mode: 'document', media_type: null, segment_id: null, time_start: null, time_end: null };
        const mediaType = el.dataset.mediaType || null;
        return {
            source_mode: mediaType ? 'audio' : 'document',
            media_type: mediaType,
            segment_id: el.dataset.segmentId ? parseInt(el.dataset.segmentId, 10) : null,
            time_start: el.dataset.segmentStart ? parseFloat(el.dataset.segmentStart) : null,
            time_end: el.dataset.segmentEnd ? parseFloat(el.dataset.segmentEnd) : null,
        };
    }

    async copySegmentTime(timeLabel) {
        if (!timeLabel) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(String(timeLabel));
                this.wb.showToast(`Copied ${timeLabel}`);
                return;
            }
        } catch (err) {
            console.warn('Clipboard failed:', err);
        }
        this.wb.showToast(`Timestamp: ${timeLabel}`);
    }

    selectTierValue(page, tierType, value, options = {}) {
        if (!value) return;
        const forceSet = !!options.forceSet;

        const container = document.getElementById(`container-${tierType}-${page}`);
        const select = document.getElementById(`select-${tierType}-${page}`);
        const badgeId = `view-${tierType}-${page}`;
        const badge = document.getElementById(badgeId);

        // Toggle-off behavior: clicking an active chip unselects that tier.
        let clickedChipActive = false;
        if (container) {
            container.querySelectorAll('.hybrid-chip').forEach(btn => {
                if (btn.dataset.value === value && btn.classList.contains('active')) {
                    clickedChipActive = true;
                }
            });
        }

        if (clickedChipActive && !forceSet) {
            if (container) {
                container.querySelectorAll('.hybrid-chip').forEach(btn => btn.classList.remove('active'));
            }
            if (select) select.value = "";
            if (badge) badge.textContent = badge.dataset.default || (tierType === 'format' ? 'PENDING' : 'UNKNOWN');

            const fb = this.wb.feedback[page];
            if (fb) {
                if (tierType === 'agency') delete fb.selectedAgency;
                if (tierType === 'class') delete fb.selectedClass;
                if (tierType === 'format') delete fb.selectedFormat;
                this.wb.saveFeedback();
            }
            return;
        }

        // Update chips in that specific container
        if (container) {
            container.querySelectorAll('.hybrid-chip').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === value);
            });
        }

        // Update select value (reset if it's one of the chips)
        if (select) {
            const options = Array.from(select.options).map(o => o.value);
            select.value = options.includes(value) ? value : "";
        }

        // Update summary view badge
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
        const predictedClass = this.mapDocTypeToClass(predicted);
        const segmentMeta = this.getSegmentMetaFromCard(page);

        // Get values from our hybrid components
        const getVal = (tier) => {
            const activeChip = el.querySelector(`.hybrid-chip.active[data-tier="${tier}"]`);
            if (activeChip) return activeChip.dataset.value;
            const select = document.getElementById(`select-${tier}-${page}`);
            return select ? select.value : null;
        };

        const agency = getVal('agency') || "UNKNOWN";
        const selectedClassRaw = getVal('class');
        const hasExplicitClass = selectedClassRaw !== null && selectedClassRaw !== '';
        const docClass = this.normalizeClassValue(selectedClassRaw, predicted) || predictedClass;
        const format = getVal('format') || "GENERIC";

        const content = Array.from(document.querySelectorAll(`input[name="content-${page}"]:checked`)).map(i => i.value);
        const isNew = document.getElementById(`flag-new-${page}`).checked;
        const textSample = el.dataset.textSample || '';
        const noteType = document.getElementById(`note-preset-${page}`)?.value || null;
        const notes = document.getElementById(`note-text-${page}`)?.value || null;
        const reasonCode = this.getReasonCode(page);
        const reasonDetail = this.getReasonDetail(page);
        this.ensureSelectedEntitiesShape(page);
        const currentEntitySelections = this.wb.feedback[page]?.selectedEntities || { person: [], location: [], organization: [], address: [] };
        const currentEntityType = this.wb.feedback[page]?.entityAssistType || 'person';
        const status = (!hasExplicitClass || docClass === predictedClass) ? "correct" : "incorrect";
        if (status === "incorrect" && !reasonCode) {
            this.wb.showToast(`Select a reason preset before saving Page ${page} as not approved`);
            document.getElementById(`note-preset-${page}`)?.focus();
            return;
        }
        if (status === "incorrect" && reasonCode === "OTHER" && !reasonDetail) {
            this.wb.showToast(`Add custom reason detail before saving Page ${page}`);
            document.getElementById(`reason-detail-${page}`)?.focus();
            return;
        }

        const feedbackData = {
            status: status,
            disposition: this.statusToDisposition(status),
            reason_code: status === "incorrect" ? reasonCode : null,
            reason_detail: status === "incorrect" ? reasonDetail : null,
            predictedType: predicted,
            selectedType: docClass,
            selectedAgency: agency,
            selectedClass: docClass,
            selectedFormat: format,
            selectedContent: content,
            newTypeFlag: isNew,
            noteType: noteType,
            notes: notes,
            textSample: textSample,
            entityAssistType: currentEntityType,
            selectedEntities: currentEntitySelections,
            source_mode: segmentMeta.source_mode,
            media_type: segmentMeta.media_type,
            segment_id: segmentMeta.segment_id,
            time_start: segmentMeta.time_start,
            time_end: segmentMeta.time_end
        };

        this.wb.feedback[page] = feedbackData;
        this.wb.saveFeedback();
        this.applyFeedbackUI(page, feedbackData);
        this.updateStats();
        this.autoAdvanceAfterReview();

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

    skip4Tier(page) {
        const el = document.getElementById(`page-${page}`);
        const predicted = el.dataset.predicted;
        const segmentMeta = this.getSegmentMetaFromCard(page);

        const noteType = document.getElementById(`note-preset-${page}`)?.value || null;
        const notesRaw = document.getElementById(`note-text-${page}`)?.value || '';
        const notes = notesRaw.trim();
        const reasonCode = this.getReasonCode(page);
        const reasonDetail = this.getReasonDetail(page);
        this.ensureSelectedEntitiesShape(page);
        const currentEntitySelections = this.wb.feedback[page]?.selectedEntities || { person: [], location: [], organization: [], address: [] };
        const currentEntityType = this.wb.feedback[page]?.entityAssistType || 'person';
        if (!notes) {
            this.wb.showToast(`Add a review note before skipping Page ${page}`);
            document.getElementById(`note-text-${page}`)?.focus();
            return;
        }
        if (!reasonCode) {
            this.wb.showToast(`Select a reason preset before skipping Page ${page}`);
            document.getElementById(`note-preset-${page}`)?.focus();
            return;
        }
        if (reasonCode === "OTHER" && !reasonDetail) {
            this.wb.showToast(`Add custom reason detail before skipping Page ${page}`);
            document.getElementById(`reason-detail-${page}`)?.focus();
            return;
        }

        const getVal = (tier) => {
            const activeChip = el.querySelector(`.hybrid-chip.active[data-tier="${tier}"]`);
            if (activeChip) return activeChip.dataset.value;
            const select = document.getElementById(`select-${tier}-${page}`);
            return select ? select.value : null;
        };

        const selectedClassRaw = getVal('class');
        const selectedClass = this.normalizeClassValue(selectedClassRaw, predicted);
        const selectedAgencyRaw = getVal('agency');
        const selectedFormatRaw = getVal('format');
        const content = Array.from(document.querySelectorAll(`input[name="content-${page}"]:checked`)).map(i => i.value);
        const isNew = document.getElementById(`flag-new-${page}`).checked;
        const textSample = el.dataset.textSample || '';

        const feedbackData = {
            status: "skipped",
            disposition: this.statusToDisposition("skipped"),
            reason_code: reasonCode,
            reason_detail: reasonDetail,
            predictedType: predicted,
            selectedType: selectedClass || null,
            selectedAgency: selectedAgencyRaw || null,
            selectedClass: selectedClass || null,
            selectedFormat: selectedFormatRaw || null,
            selectedContent: content,
            newTypeFlag: isNew,
            noteType: noteType,
            notes: notes,
            textSample: textSample,
            entityAssistType: currentEntityType,
            selectedEntities: currentEntitySelections,
            source_mode: segmentMeta.source_mode,
            media_type: segmentMeta.media_type,
            segment_id: segmentMeta.segment_id,
            time_start: segmentMeta.time_start,
            time_end: segmentMeta.time_end
        };

        this.wb.feedback[page] = feedbackData;
        this.wb.saveFeedback();
        this.applyFeedbackUI(page, feedbackData);
        this.updateStats();
        this.autoAdvanceAfterReview();

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
                if (data.success) this.wb.showToast(`Skipped Page ${page}`);
            })
            .catch(err => console.warn('Server offline, saved locally only.'));
    }

    autoAdvanceAfterReview() {
        const totalPages = Math.max(1, Math.ceil(this.filteredPages.length / this.itemsPerPage));
        if (this.currentPage < totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    applyFeedbackUI(page, data) {
        const el = document.getElementById(`page-${page}`);
        if (!el) return;

        const status = data?.status || "pending";
        el.classList.remove("pending", "correct", "incorrect", "skipped");
        el.classList.add(status);

        const statusEl = document.getElementById(`status-text-${page}`);
        if (statusEl) {
            if (status === "correct" || status === "incorrect") {
                statusEl.textContent = "\u2713 Reviewed";
                statusEl.classList.add("text-green-500");
                statusEl.classList.remove("text-yellow-400");
            } else if (status === "skipped") {
                statusEl.textContent = "\u21B7 Skipped";
                statusEl.classList.add("text-yellow-400");
                statusEl.classList.remove("text-green-500");
            } else {
                statusEl.textContent = data?.notes ? "Note saved" : "";
                statusEl.classList.remove("text-green-500");
                statusEl.classList.remove("text-yellow-400");
            }
        }

        // Update View labels
        const agencyEl = document.getElementById(`view-agency-${page}`);
        if (data.selectedAgency && agencyEl) {
            agencyEl.textContent = data.selectedAgency;
        }
        const classEl = document.getElementById(`view-class-${page}`);
        const normalizedSelectedClass = this.normalizeClassValue(data.selectedClass, data.predictedType);
        if (normalizedSelectedClass && classEl) {
            classEl.textContent = normalizedSelectedClass;
        }
        const formatEl = document.getElementById(`view-format-${page}`);
        if (Object.prototype.hasOwnProperty.call(data, "selectedFormat") && formatEl) {
            formatEl.textContent = data.selectedFormat || 'GENERIC';
        }

        const contentContainer = document.getElementById(`view-content-${page}`);
        if (contentContainer) {
            if (Array.isArray(data.selectedContent) && data.selectedContent.length > 0) {
                contentContainer.innerHTML = data.selectedContent.map(c => `<span class="content-tag">${c}</span>`).join('');
            } else if (Object.prototype.hasOwnProperty.call(data, "selectedContent")) {
                contentContainer.innerHTML = '<span class="text-[10px] opacity-30 italic">none</span>';
            }
        }

        // Sync form
        // Force-set during restore so we don't trigger click-style toggle-off behavior.
        if (data.selectedAgency) this.selectTierValue(page, 'agency', data.selectedAgency, { forceSet: true });
        if (normalizedSelectedClass) this.selectTierValue(page, 'class', normalizedSelectedClass, { forceSet: true });
        if (data.selectedFormat) this.selectTierValue(page, 'format', data.selectedFormat, { forceSet: true });

        // Check content boxes
        document.querySelectorAll(`input[name="content-${page}"]`).forEach(cb => {
            cb.checked = (data.selectedContent || []).includes(cb.value);
        });

        // Sync reviewer notes
        const notePresetEl = document.getElementById(`note-preset-${page}`);
        const noteTextEl = document.getElementById(`note-text-${page}`);
        if (notePresetEl) {
            const restoredPreset = data.noteType || (data.reason_code === 'OTHER' ? 'OTHER_CUSTOM' : data.reason_code) || "";
            notePresetEl.value = restoredPreset;
            this.toggleReasonDetail(page);
        }
        const reasonDetailEl = document.getElementById(`reason-detail-${page}`);
        if (reasonDetailEl) reasonDetailEl.value = data.reason_detail || "";
        if (noteTextEl) noteTextEl.value = data.notes || "";
    }

    updateStats() {
        const allPages = this.wb.classificationData ? this.wb.classificationData.pages.length : 0;
        const filtered = this.filteredPages.length;
        const reviewed = Object.values(this.wb.feedback).filter(f =>
            f.status === "correct" || f.status === "incorrect" || f.status === "skipped"
        ).length;
        const correct = Object.values(this.wb.feedback).filter(f => f.status === "correct").length;
        const incorrect = Object.values(this.wb.feedback).filter(f => f.status === "incorrect").length;
        const skipped = Object.values(this.wb.feedback).filter(f => f.status === "skipped").length;

        document.getElementById("stat-total").textContent = filtered < allPages ? `${filtered}/${allPages}` : allPages;
        document.getElementById("stat-reviewed").textContent = reviewed;
        document.getElementById("stat-correct").textContent = correct;
        document.getElementById("stat-incorrect").textContent = incorrect;
        const skippedEl = document.getElementById("stat-skipped");
        if (skippedEl) skippedEl.textContent = skipped;
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

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (pageInput) { pageInput.value = this.currentPage; pageInput.max = totalPages; }
        if (pageTotal) pageTotal.textContent = `of ${totalPages}`;
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

    async exportFeedback() {
        const pages = this.wb.classificationData?.pages || [];
        const feedbackByPage = this.wb.feedback || {};
        const isMediaSource = !!this.wb.classificationData?.media_type;
        const exportPages = pages
            .map(p => {
                const pageNum = p.page;
                const fb = feedbackByPage[pageNum] || {};
                const predictedType = p.doc_type || 'UNKNOWN';
                const predictedClass = this.mapDocTypeToClass(predictedType);
                const selectedClass = this.normalizeClassValue(fb.selectedClass, predictedType);
                const selectedAgency = fb.selectedAgency || null;
                const selectedFormat = fb.selectedFormat || null;
                const selectedContent = Array.isArray(fb.selectedContent) ? fb.selectedContent : [];
                const selectedEntities = fb.selectedEntities || { person: [], location: [], organization: [] };
                const reviewStatus = fb.status || 'pending';
                const disposition = fb.disposition || this.statusToDisposition(reviewStatus);

                return {
                    page: pageNum,
                    page_index: p.page_index,
                    source_mode: p.media_type ? 'audio' : 'document',
                    media_type: p.media_type || null,
                    segment: p.media_type ? {
                        segment_id: fb.segment_id ?? p.page_index,
                        start: fb.time_start ?? p.segment_start ?? null,
                        end: fb.time_end ?? p.segment_end ?? null
                    } : null,
                    review_status: reviewStatus,
                    disposition: disposition,
                    prediction: {
                        type: predictedType,
                        class: predictedClass,
                        agency: p.agency || 'UNKNOWN',
                        confidence: p.confidence ?? null,
                        matched_patterns: Array.isArray(p.matched_patterns) ? p.matched_patterns : []
                    },
                    reviewer: {
                        selected_class: selectedClass,
                        selected_agency: selectedAgency,
                        selected_format: selectedFormat,
                        selected_content: selectedContent,
                        selected_entities: selectedEntities,
                        note_type: fb.noteType || null,
                        reason_code: fb.reason_code || fb.noteType || null,
                        reason_detail: fb.reason_detail || null,
                        notes: fb.notes || null,
                        new_type_flag: !!fb.newTypeFlag
                    }
                };
            })
            .sort((a, b) => a.page - b.page);

        const unresolvedPages = exportPages.filter(p => p.review_status === 'pending').map(p => p.page);
        if (unresolvedPages.length > 0) {
            this.wb.showToast(`Review all pages before export (${unresolvedPages.length} pending)`);
            return;
        }

        const reviewedPages = exportPages.filter(p => p.review_status !== 'pending');
        const correct = reviewedPages.filter(p => p.review_status === 'correct').length;
        const incorrect = reviewedPages.filter(p => p.review_status === 'incorrect').length;
        const skipped = reviewedPages.filter(p => p.review_status === 'skipped').length;
        const data = {
            schema_version: 'workbench-feedback-v2',
            exportedAt: new Date().toISOString(),
            source: this.wb.FILE_NAME,
            source_attribution: {
                source_mode: isMediaSource ? 'audio' : 'document',
                media_type: this.wb.classificationData?.media_type || null,
                duration: this.wb.classificationData?.duration ?? null,
                transcript_method: isMediaSource ? 'whisper' : null
            },
            summary: {
                total_pages: exportPages.length,
                reviewed_pages: reviewedPages.length,
                correct_pages: correct,
                incorrect_pages: incorrect,
                skipped_pages: skipped
            },
            pages: exportPages,
            reviewed_pages_only: reviewedPages,
            entity_approvals: this.wb.entityApprovals || {}
        };
        const fallbackDownload = () => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `classifier_feedback_${this.wb.FILE_NAME.replace(/\.[^/.]+$/, '')}_v2.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        try {
            const res = await fetch('/api/feedback/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const out = await res.json();
            if (!out.success) throw new Error(out.error || 'Save failed');
            this.wb.showToast(`Saved feedback export: ${out.saved_path}`);
        } catch (err) {
            console.warn('Server export save failed, falling back to browser download', err);
            fallbackDownload();
            this.wb.showToast('Server save unavailable; downloaded export locally');
        }
    }

    clearFeedback() {
        if (confirm("Clear all feedback?")) {
            this.wb.feedback = {};
            localStorage.removeItem(this.wb.STORAGE_KEY);
            document.querySelectorAll("[data-page]").forEach(el => {
                el.classList.remove("correct", "incorrect", "skipped");
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

    normalizeAddressLabel(raw) {
        let s = String(raw || '').replace(/\s+/g, ' ').trim();
        if (!s) return s;
        const replacements = [
            [/\bSTREET\b/gi, 'St'],
            [/\bAVENUE\b/gi, 'Ave'],
            [/\bROAD\b/gi, 'Rd'],
            [/\bBOULEVARD\b/gi, 'Blvd'],
            [/\bDRIVE\b/gi, 'Dr'],
            [/\bLANE\b/gi, 'Ln'],
            [/\bHIGHWAY\b/gi, 'Hwy'],
            [/\bEXPRESSWAY\b/gi, 'Expy'],
            [/\bCOURT\b/gi, 'Ct'],
            [/\bPLACE\b/gi, 'Pl'],
        ];
        replacements.forEach(([pat, rep]) => { s = s.replace(pat, rep); });
        return s;
    }

    extractAddressCandidates(batchText, pageOffsets) {
        const out = [];
        const pattern = /\b\d{1,5}\s+[A-Za-z0-9.\-']+(?:\s+[A-Za-z0-9.\-']+){0,5}\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Highway|Hwy|Expressway|Expy|Court|Ct|Place|Pl)\b(?:,\s*[A-Za-z .]+)?(?:,\s*[A-Z]{2})?(?:\s+\d{5})?/gi;
        let match;
        while ((match = pattern.exec(batchText)) !== null) {
            const start = match.index;
            const raw = match[0];
            const pageMeta = pageOffsets.find(o => start >= o.start && start < o.end) || pageOffsets[0];
            out.push({
                display_name: this.normalizeAddressLabel(raw),
                text: raw,
                entity_type: 'address',
                confidence: 0.86,
                method: 'regex_address',
                start_pos: start,
                page: pageMeta ? pageMeta.index : 1,
                tags: pageMeta ? pageMeta.tags || [] : []
            });
        }
        return out;
    }

    dedupeEntities(items, kind = 'matched') {
        const seen = new Set();
        const out = [];
        for (const item of items) {
            const name = (item.display_name || item.text || '').toLowerCase().trim();
            const type = String(item.entity_type || '').toLowerCase().trim();
            const page = String(item.page || '');
            const key = `${kind}|${type}|${name}|${page}`;
            if (!name || seen.has(key)) continue;
            seen.add(key);
            out.push(item);
        }
        return out;
    }

    async detectEntities(options = {}) {
        const auto = !!options.auto;
        const btn = document.getElementById('detect-entities-btn');
        const loading = document.getElementById('entity-loading');
        const results = document.getElementById('entity-results');

        btn.disabled = true;
        btn.textContent = auto ? 'Auto-scanning...' : 'Scanning...';
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        const allPages = (this.wb.classificationData && this.wb.classificationData.pages) ? this.wb.classificationData.pages : [];
        const maxPages = Math.min(50, allPages.length);
        const pagesToScan = allPages.slice(0, maxPages);
        const batchSize = 10;

        if (!pagesToScan.length) {
            loading.classList.add('hidden');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">search</span> Detect Entities';
            this.wb.exportTab.showExportStatus('No page text available. Process pages in OCR first.', 'warning');
            return;
        }

        try {
            const totalBatches = Math.ceil(pagesToScan.length / batchSize);
            let combinedEntities = [];
            let combinedCandidates = [];

            for (let b = 0; b < totalBatches; b++) {
                const start = b * batchSize;
                const batchPages = pagesToScan.slice(start, start + batchSize);
                loading.textContent = `Scanning entities batch ${b + 1}/${totalBatches}...`;

                let batchText = '';
                const pageOffsets = [];
                let currentOffset = 0;
                batchPages.forEach((page, idx) => {
                    const text = (page.text || '') + '\n\n';
                    pageOffsets.push({
                        start: currentOffset,
                        end: currentOffset + text.length,
                        index: page.page || (start + idx + 1),
                        tags: page.tags || []
                    });
                    batchText += text;
                    currentOffset += text.length;
                });

                if (!batchText.trim()) continue;

                const res = await fetch('/api/entities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: batchText,
                        filename: this.wb.FILE_NAME,
                        include_candidates: true
                    })
                });
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();

                const findPage = (pos) => {
                    const p = pageOffsets.find(o => pos >= o.start && pos < o.end);
                    if (!p) return { index: pageOffsets[0]?.index || 1, tags: [] };
                    const fb = this.wb.feedback[p.index];
                    const activeTags = fb && fb.selectedContent ? fb.selectedContent : (p.tags || []);
                    return { index: p.index, tags: activeTags };
                };

                combinedEntities = combinedEntities.concat((data.entities || []).map(e => {
                    const pInfo = findPage(e.start_pos);
                    return { ...e, page: pInfo.index, tags: pInfo.tags };
                }));

                combinedCandidates = combinedCandidates.concat((data.new_candidates || []).map(c => {
                    const pInfo = findPage(c.start_pos);
                    return { ...c, page: pInfo.index, tags: pInfo.tags };
                }));

                const addressCandidates = this.extractAddressCandidates(batchText, pageOffsets);
                combinedCandidates = combinedCandidates.concat(addressCandidates);
            }

            this.wb.detectedEntities = this.dedupeEntities(combinedEntities, 'matched');
            this.wb.detectedCandidates = this.dedupeEntities(combinedCandidates, 'candidate');

            // Summary header is intentionally metrics-only. Do not add context tags here.
            const s = {
                matched: this.wb.detectedEntities.length,
                candidates: this.wb.detectedCandidates.length,
                persons: this.wb.detectedEntities.filter(e => e.entity_type === 'person').length,
                places: this.wb.detectedEntities.filter(e => e.entity_type === 'place').length,
                orgs: this.wb.detectedEntities.filter(e => e.entity_type === 'org').length,
                addresses: this.wb.detectedCandidates.filter(e => e.entity_type === 'address').length
            };
            const matchesEl = document.getElementById('entity-matches-total');
            const breakdownEl = document.getElementById('entity-matches-breakdown');
            const candidatesEl = document.getElementById('entity-candidates-total');

            if (matchesEl) matchesEl.textContent = `${s.matched || 0}`;
            if (breakdownEl) breakdownEl.textContent = `(${s.persons || 0}P/${s.places || 0}L/${s.orgs || 0}O)`;
            if (candidatesEl) candidatesEl.textContent = `${s.candidates || 0}`;

            this.renderEntitiesDashboard();
            if (this.wb.classificationData) {
                this.wb.classifyTab.renderCards(this.wb.classifyTab.filteredPages.length ? this.wb.classifyTab.filteredPages : this.wb.classificationData.pages);
            }

            loading.classList.add('hidden');
            loading.textContent = 'Scanning text for entities...';
            results.classList.remove('hidden');
            if (auto) this.wb.showToast(`Auto-detected entities on first ${maxPages} pages`);

        } catch (err) {
            console.error('Entity detection failed:', err);
            this.wb.exportTab.showExportStatus(`Entity detection failed: ${err.message}. Is the server running?`, 'error');
            loading.classList.add('hidden');
            loading.textContent = 'Scanning text for entities...';
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
        const seenPeople = new Set();
        const seenOrgs = new Set();
        const seenPlaces = new Set();

        // Attach approved matched entities
        if (this.wb.detectedEntities) {
            this.wb.detectedEntities.forEach((e, i) => {
                if (this.wb.entityApprovals[`matched-${i}`] === 'approved') {
                    if (e.entity_type === 'person') {
                        const key = (e.display_name || '').toLowerCase();
                        if (key && !seenPeople.has(key)) {
                            seenPeople.add(key);
                            record.people.push({ name: e.display_name, role: 'Mentioned' });
                        }
                    } else if (e.entity_type === 'org') {
                        const key = (e.display_name || '').toLowerCase();
                        if (key && !seenOrgs.has(key)) {
                            seenOrgs.add(key);
                            record.organizations.push({ name: e.display_name, role: 'Mentioned' });
                        }
                    } else if (e.entity_type === 'place') {
                        const key = (e.display_name || '').toLowerCase();
                        if (key && !seenPlaces.has(key)) {
                            seenPlaces.add(key);
                            record.places.push({ name: e.display_name, relevance: 'Mentioned' });
                        }
                    }
                }
            });
        }

        // Merge page-level entity selections from CLASSIFY feedback loop.
        Object.values(this.wb.feedback || {}).forEach(fb => {
            const selected = fb?.selectedEntities || {};
            (selected.person || []).forEach(e => {
                const name = e.label || e.display_name || '';
                const key = name.toLowerCase();
                if (key && !seenPeople.has(key)) {
                    seenPeople.add(key);
                    record.people.push({ name: name, role: 'Mentioned' });
                }
            });
            (selected.organization || []).forEach(e => {
                const name = e.label || e.display_name || '';
                const key = name.toLowerCase();
                if (key && !seenOrgs.has(key)) {
                    seenOrgs.add(key);
                    record.organizations.push({ name: name, role: 'Mentioned' });
                }
            });
            (selected.location || []).forEach(e => {
                const name = e.label || e.display_name || '';
                const key = name.toLowerCase();
                if (key && !seenPlaces.has(key)) {
                    seenPlaces.add(key);
                    record.places.push({ name: name, relevance: 'Mentioned' });
                }
            });
            (selected.address || []).forEach(e => {
                const name = e.label || e.display_name || '';
                const key = name.toLowerCase();
                if (key && !seenPlaces.has(key)) {
                    seenPlaces.add(key);
                    record.places.push({ name: name, relevance: 'Mentioned', place_type: 'ADDRESS' });
                }
            });
        });

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
            } else if (c.entity_type === 'address') {
                targetFile = 'places.json';
                const normalizedAddress = this.wb.entitiesTab.normalizeAddressLabel(c.text || c.display_name || '');
                record = {
                    place_id: crypto.randomUUID(),
                    name: normalizedAddress || c.text,
                    place_type: 'ADDRESS',
                    notes: `Auto-detected address from ${this.wb.FILE_NAME}`
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

    // ── TTS (Kokoro Audio Export) ────────────────────────────────

    async initTTS() {
        try {
            const res = await fetch('/api/tts/config');
            if (!res.ok) return;
            const cfg = await res.json();
            if (!cfg.available) return;

            const panel = document.getElementById('audio-export-panel');
            if (panel) panel.style.display = '';

            // Populate voice dropdown
            const sel = document.getElementById('tts-voice');
            if (sel && cfg.voices) {
                sel.innerHTML = cfg.voices.map(v =>
                    `<option value="${v.id}">${v.label}</option>`
                ).join('');
            }
        } catch (e) {
            console.warn('TTS config check failed:', e);
        }
    }

    getTTSSettings() {
        return {
            voice: document.getElementById('tts-voice')?.value || 'af_heart',
            speed: parseFloat(document.getElementById('tts-speed')?.value || '1.0'),
            format: document.getElementById('tts-format')?.value || 'wav',
            source: document.getElementById('tts-source')?.value || 'workbench',
        };
    }

    setTTSStatus(msg, show = true) {
        const el = document.getElementById('tts-status');
        if (!el) return;
        el.style.display = show ? '' : 'none';
        el.textContent = msg;
    }

    getTTSFileBaseName() {
        const file = this.wb.FILE_NAME || '';
        const noExt = file.replace(/\.[^/.]+$/, '');
        return noExt.replace(/_searchable$/i, '');
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async previewTTS() {
        const settings = this.getTTSSettings();
        this.setTTSStatus('Generating preview...');
        try {
            let res;
            if (settings.source !== 'workbench') {
                const filename = this.getTTSFileBaseName();
                if (!filename) throw new Error('No file selected');
                res = await fetch('/api/tts/from-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename,
                        source: settings.source,
                        voice: settings.voice,
                        speed: settings.speed,
                        format: settings.format,
                        preview: true,
                        max_chars: 200
                    })
                });
            } else {
                const text = this.getPreviewText();
                if (!text) {
                    this.showExportStatus('No reviewed content to preview.', 'warning');
                    return;
                }
                res = await fetch('/api/tts/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, ...settings })
                });
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const player = document.getElementById('tts-preview-player');
            if (player) {
                player.src = url;
                player.style.display = '';
                player.play();
            }
            this.setTTSStatus('Preview ready.');
        } catch (e) {
            this.setTTSStatus(`Preview failed: ${e.message}`);
            this.showExportStatus(`TTS preview failed: ${e.message}`, 'error');
        }
    }

    async generateAudio() {
        const settings = this.getTTSSettings();
        try {
            let res;
            if (settings.source !== 'workbench') {
                const filename = this.getTTSFileBaseName();
                if (!filename) throw new Error('No file selected');
                this.setTTSStatus(`Generating audio from ${settings.source.toUpperCase()} source...`);
                res = await fetch('/api/tts/from-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename,
                        source: settings.source,
                        voice: settings.voice,
                        speed: settings.speed,
                        format: settings.format
                    })
                });
            } else {
                const items = this.buildNarrationItems();
                if (!items.length) {
                    this.showExportStatus('No content selected for audio generation.', 'warning');
                    return;
                }
                this.setTTSStatus(`Generating ${items.length} audio file(s)... This may take a moment.`);
                res = await fetch('/api/tts/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, ...settings })
                });
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const blob = await res.blob();
            const cd = res.headers.get('content-disposition') || '';
            const match = cd.match(/filename=\"?([^\";]+)\"?/i);
            const fallback = settings.source === 'workbench'
                ? 'audio-export.zip'
                : `${this.getTTSFileBaseName()}-audio.${settings.format}`;
            const downloadName = (match && match[1]) ? match[1] : fallback;
            this.downloadBlob(blob, downloadName);
            this.setTTSStatus(`Downloaded ${downloadName}.`);
            this.logExport(`Audio export generated: ${downloadName}`);
            this.showExportStatus(`Audio export complete — ${downloadName}`);
        } catch (e) {
            this.setTTSStatus(`Generation failed: ${e.message}`);
            this.showExportStatus(`Audio generation failed: ${e.message}`, 'error');
        }
    }

    getPreviewText() {
        // Try source record name + notes, fall back to first page text
        const name = document.getElementById('export-source-name')?.value || '';
        const notes = document.getElementById('export-source-notes')?.value || '';
        if (name || notes) return `${name}. ${notes}`.trim().slice(0, 200);

        // Fall back to first reviewed page/segment text
        const pages = this.wb.classificationData?.pages || [];
        for (const p of pages) {
            if (p.text?.trim()) return p.text.trim().slice(0, 200);
        }
        return '';
    }

    buildNarrationItems() {
        const items = [];
        const includeSource = document.getElementById('tts-include-source')?.checked;
        const includeEntities = document.getElementById('tts-include-entities')?.checked;
        const includeFullText = document.getElementById('tts-include-fulltext')?.checked;
        const includePages = document.getElementById('tts-include-pages')?.checked;

        // Source Record Summary
        if (includeSource) {
            const name = document.getElementById('export-source-name')?.value || 'Document';
            const type = document.getElementById('export-source-type')?.value || '';
            const agency = document.getElementById('export-agency')?.value || '';
            const notes = document.getElementById('export-source-notes')?.value || '';
            let text = `Source Record: ${name}.`;
            if (type) text += ` Document type: ${type}.`;
            if (agency) text += ` Origin agency: ${agency}.`;
            if (notes) text += ` ${notes}`;
            items.push({ id: 'source-record', text, label: 'Source Record' });
        }

        // Entity Summaries
        if (includeEntities && this.wb.detectedEntities) {
            const approved = [];
            this.wb.detectedEntities.forEach((e, i) => {
                if (this.wb.entityApprovals[`matched-${i}`] === 'approved') {
                    approved.push(e);
                }
            });
            if (approved.length > 0) {
                const text = approved.map(e =>
                    `${e.display_name}, ${e.entity_type}.`
                ).join(' ');
                items.push({ id: 'entity-summaries', text: `Detected entities: ${text}`, label: 'Entity Summaries' });
            }
        }

        // Full Document Text
        if (includeFullText) {
            const pages = this.wb.classificationData?.pages || [];
            const fullText = pages.map(p => p.text || '').join('\n').trim();
            if (fullText) {
                items.push({ id: 'full-document', text: fullText, label: 'Full Document' });
            }
        }

        // Individual Pages/Segments
        if (includePages) {
            const pages = this.wb.classificationData?.pages || [];
            pages.forEach((p, i) => {
                const text = (p.text || '').trim();
                if (text) {
                    const label = p.media_type ? `Segment ${i + 1}` : `Page ${i + 1}`;
                    items.push({ id: `page-${i + 1}`, text, label });
                }
            });
        }

        return items;
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
        this.AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.wma'];
        this.VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.mkv', '.avi'];
        this.MEDIA_EXTS = [...this.AUDIO_EXTS, ...this.VIDEO_EXTS];
        this.TEXT_EXTS = ['.txt', '.md', '.rtf', '.csv', '.vtt', '.srt', '.docx', '.doc', '.eml', '.mbox'];
        this.ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic', '.heif', '.zip', '.tar', '.gz', '.tgz', '.bz2', ...this.MEDIA_EXTS, ...this.TEXT_EXTS];
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
                this.whisperAvailable = cfg.whisper_available || false;
                this.ytdlpAvailable = cfg.ytdlp_available || false;
                // URL panel visibility is controlled by input mode switching
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
        const browseBtn = document.getElementById('browse-btn');
        const statusEl = document.getElementById('intake-status');
        if (!dropZone || !fileInput) return;

        // Click zone body → open file picker (skip if browse btn clicked)
        dropZone.addEventListener('click', (e) => {
            if (e.target.closest('#browse-btn')) return;
            fileInput.click();
        });

        // Browse button → open file picker
        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        // Drag-and-drop
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

        // File input change
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

        // Unified paste interception
        document.addEventListener('paste', (e) => {
            this._handlePaste(e, statusEl);
        });
    }

    _handlePaste(e, statusEl) {
        // Only act when the Input tab is active
        const inputPanel = document.getElementById('tab-input');
        if (!inputPanel || !inputPanel.classList.contains('active')) return;

        // Don't intercept paste inside form fields
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (!text) return;

        const trimmed = text.trim();
        e.preventDefault();

        // Single-line URL → fetch via /api/ingest-url
        if (/^https?:\/\/\S+$/.test(trimmed) && !trimmed.includes('\n')) {
            this._ingestUrl(trimmed, statusEl);
        } else {
            // Multi-line or non-URL text → paste via /api/paste
            this._ingestPaste(trimmed, statusEl);
        }
    }

    async _ingestUrl(url, statusEl) {
        if (statusEl) { statusEl.textContent = 'Detecting content type...'; statusEl.style.opacity = '0.7'; statusEl.style.color = ''; }

        try {
            const res = await fetch('/api/ingest-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Fetch failed');

            if (data.type === 'scraped') {
                const blob = new Blob([''], { type: 'text/plain' });
                const file = new File([blob], `${data.basename}.txt`, { type: 'text/plain' });
                this.queuedFiles.push({
                    file, name: `${data.basename}.txt`, size: data.chars || 0,
                    status: 'completed', progress: 100, current_msg: '', parsed_metadata: null
                });
                this.updateFileCount();
                this.renderKanban();
                const label = data.source === 'yt-transcript'
                    ? `Transcript: ${data.title} (${data.caption_source || 'auto'})`
                    : `Scraped: ${data.title} (${data.pages} pages, ${data.chars} chars)`;
                if (statusEl) statusEl.textContent = label;
                this.logSuccess(label);
                if (this.wb.sourceTab) this.wb.sourceTab.loadHistory();
            } else {
                if (statusEl) statusEl.textContent = `Downloaded ${data.file.name}, loading into queue...`;
                const fileRes = await fetch(`/api/download/file/${encodeURIComponent(data.file.name)}`);
                if (!fileRes.ok) throw new Error('Could not retrieve downloaded file');
                const blob = await fileRes.blob();
                const mimeType = data.file.content_type || this._guessMimeType(data.file.name);
                const file = new File([blob], data.file.name, { type: mimeType });
                this.queuedFiles.push({
                    file, name: data.file.name, size: data.file.size,
                    status: 'queued', progress: 0, current_msg: '', parsed_metadata: null
                });
                this.updateFileCount();
                this.renderKanban();
                if (statusEl) statusEl.textContent = `Downloaded: ${data.title || data.file.name}`;
                this.logSuccess(`Downloaded: ${data.title || data.file.name}`);
            }
        } catch (err) {
            if (statusEl) { statusEl.textContent = `Error: ${err.message}`; statusEl.style.color = '#ef4444'; }
            this.logError(`URL fetch failed: ${err.message}`);
        }
    }

    async _ingestPaste(text, statusEl) {
        if (!text) {
            if (statusEl) statusEl.textContent = 'Nothing to paste';
            return;
        }

        if (statusEl) { statusEl.textContent = 'Submitting...'; statusEl.style.opacity = '0.7'; statusEl.style.color = ''; }

        try {
            const res = await fetch('/api/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, title: 'pasted-text' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Paste failed');

            const blob = new Blob([text], { type: 'text/plain' });
            const file = new File([blob], `${data.basename}.txt`, { type: 'text/plain' });
            this.queuedFiles.push({
                file, name: `${data.basename}.txt`, size: blob.size,
                status: 'completed', progress: 100, current_msg: '', parsed_metadata: null
            });
            this.updateFileCount();
            this.renderKanban();
            if (statusEl) statusEl.textContent = `Created: ${data.basename}.txt (${data.pages} pages, ${data.chars} chars)`;
            this.logSuccess(`Pasted text saved: ${data.basename}.txt`);
            if (this.wb.sourceTab) this.wb.sourceTab.loadHistory();
        } catch (err) {
            if (statusEl) { statusEl.textContent = `Error: ${err.message}`; statusEl.style.color = '#ef4444'; }
            this.logError(`Paste failed: ${err.message}`);
        }
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

    // DEPRECATED: superseded by _ingestUrl() — kept for backward compat
    async downloadUrl() {
        const urlInput = document.getElementById('url-input');
        const statusEl = document.getElementById('url-status');
        const btn = document.getElementById('url-download-btn');
        if (!urlInput) return;

        const url = urlInput.value.trim();
        if (!url) {
            if (statusEl) statusEl.textContent = 'Paste a URL first';
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = 'Fetching...'; }
        if (statusEl) { statusEl.textContent = 'Detecting content type...'; statusEl.style.opacity = '0.7'; statusEl.style.color = ''; }

        try {
            const res = await fetch('/api/ingest-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Fetch failed');

            if (data.type === 'scraped') {
                // Text was scraped — add to queue as completed
                const blob = new Blob([''], { type: 'text/plain' });
                const file = new File([blob], `${data.basename}.txt`, { type: 'text/plain' });
                this.queuedFiles.push({
                    file, name: `${data.basename}.txt`, size: data.chars || 0,
                    status: 'completed', progress: 100, current_msg: '', parsed_metadata: null
                });
                this.updateFileCount();
                this.renderKanban();
                const label = data.source === 'yt-transcript'
                    ? `Transcript: ${data.title} (${data.caption_source || 'auto'})`
                    : `Scraped: ${data.title} (${data.pages} pages, ${data.chars} chars)`;
                if (statusEl) statusEl.textContent = label;
                this.logSuccess(label);
                if (this.wb.sourceTab) this.wb.sourceTab.loadHistory();
            } else {
                // File was downloaded (downloaded or ytdlp) — fetch blob and queue for processing
                if (statusEl) statusEl.textContent = `Downloaded ${data.file.name}, loading into queue...`;
                const fileRes = await fetch(`/api/download/file/${encodeURIComponent(data.file.name)}`);
                if (!fileRes.ok) throw new Error('Could not retrieve downloaded file');
                const blob = await fileRes.blob();
                const mimeType = data.file.content_type || this._guessMimeType(data.file.name);
                const file = new File([blob], data.file.name, { type: mimeType });
                this.queuedFiles.push({
                    file, name: data.file.name, size: data.file.size,
                    status: 'queued', progress: 0, current_msg: '', parsed_metadata: null
                });
                this.updateFileCount();
                this.renderKanban();
                if (statusEl) statusEl.textContent = `Downloaded: ${data.title || data.file.name}`;
                this.logSuccess(`Downloaded: ${data.title || data.file.name}`);
            }
            urlInput.value = '';
        } catch (err) {
            if (statusEl) { statusEl.textContent = `Error: ${err.message}`; statusEl.style.color = '#ef4444'; }
            this.logError(`URL fetch failed: ${err.message}`);
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">download</span> Fetch'; }
        }
    }

    _guessMimeType(filename) {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        const map = {
            mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', flac: 'audio/flac',
            ogg: 'audio/ogg', wma: 'audio/x-ms-wma', mp4: 'video/mp4', webm: 'video/webm',
            mov: 'video/quicktime', pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            png: 'image/png', tiff: 'image/tiff', webp: 'image/webp', txt: 'text/plain',
        };
        return map[ext] || 'application/octet-stream';
    }

    // DEPRECATED: superseded by _ingestPaste() — kept for backward compat
    async submitPaste() {
        const titleInput = document.getElementById('paste-title');
        const textArea = document.getElementById('paste-text');
        const statusEl = document.getElementById('paste-status');
        if (!textArea) return;

        const text = textArea.value.trim();
        const title = (titleInput?.value || '').trim() || 'pasted-text';
        if (!text) {
            if (statusEl) statusEl.textContent = 'Paste some text first';
            return;
        }

        if (statusEl) { statusEl.textContent = 'Submitting...'; statusEl.style.opacity = '0.7'; }

        try {
            const res = await fetch('/api/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, title })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Paste failed');

            const blob = new Blob([text], { type: 'text/plain' });
            const file = new File([blob], `${data.basename}.txt`, { type: 'text/plain' });
            this.queuedFiles.push({
                file, name: `${data.basename}.txt`, size: blob.size,
                status: 'completed', progress: 100, current_msg: '', parsed_metadata: null
            });
            this.updateFileCount();
            this.renderKanban();

            if (statusEl) { statusEl.textContent = `Created: ${data.basename}.txt (${data.pages} pages, ${data.chars} chars)`; }
            textArea.value = '';
            if (titleInput) titleInput.value = '';
            this.logSuccess(`Pasted text saved: ${data.basename}.txt`);
            if (this.wb.sourceTab) this.wb.sourceTab.loadHistory();
        } catch (err) {
            if (statusEl) { statusEl.textContent = `Error: ${err.message}`; statusEl.style.color = '#ef4444'; }
            this.logError(`Paste failed: ${err.message}`);
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
            force_ocr: document.getElementById('option-force')?.checked ?? false,
            whisper_model: document.getElementById('whisper-model')?.value || 'base',
            whisper_language: document.getElementById('whisper-language')?.value || '',
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
        formData.append('whisper_model', settings.whisper_model);
        formData.append('whisper_language', settings.whisper_language);

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
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        const isMedia = this.MEDIA_EXTS.includes(ext);
        const isVideo = this.VIDEO_EXTS.includes(ext);
        const icon = isMedia ? (isVideo ? 'videocam' : 'mic') : 'description';
        const badge = isMedia ? `<span class="media-badge">${isVideo ? 'VIDEO' : 'AUDIO'}</span> ` : '';
        return `<div class="kanban-card">
            <div class="filename"><span class="material-symbols-outlined text-xs opacity-40">${icon}</span> ${this.escapeHtml(file.name)}</div>
            <div class="meta">${badge}${this.formatFileSize(file.size)} · Waiting...</div>
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
        const groupOrder = ['document', 'text', 'audio', 'video', 'image', 'other'];
        const grouped = new Map(groupOrder.map(k => [k, []]));

        this.filteredFiles.forEach(f => {
            const kind = (f.kind || this.inferKindFromName(f.name)).toLowerCase();
            if (!grouped.has(kind)) grouped.set(kind, []);
            grouped.get(kind).push(f);
        });

        const sections = [];
        for (const kind of groupOrder) {
            const items = grouped.get(kind) || [];
            if (items.length === 0) continue;
            sections.push(`
                <section class="source-group">
                    <div class="source-group-header">${this.getKindLabel(kind)} <span class="source-group-count">(${items.length})</span></div>
                    <div class="source-group-grid">
                        ${items.map(f => this.renderFileCard(f)).join('')}
                    </div>
                </section>
            `);
        }

        // Include unknown kinds after known groups if present.
        grouped.forEach((items, kind) => {
            if (groupOrder.includes(kind) || items.length === 0) return;
            sections.push(`
                <section class="source-group">
                    <div class="source-group-header">${this.getKindLabel(kind)} <span class="source-group-count">(${items.length})</span></div>
                    <div class="source-group-grid">
                        ${items.map(f => this.renderFileCard(f)).join('')}
                    </div>
                </section>
            `);
        });

        gridEl.innerHTML = sections.join('');
    }

    inferKindFromName(filename) {
        const ext = '.' + (filename.split('.').pop() || '').toLowerCase();
        const audioExts = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.wma'];
        const videoExts = ['.mp4', '.webm', '.mov', '.mkv', '.avi'];
        if (ext === '.pdf') return 'document';
        if (ext === '.txt' || ext === '.md' || ext === '.rtf' || ext === '.csv') return 'text';
        if (audioExts.includes(ext)) return 'audio';
        if (videoExts.includes(ext)) return 'video';
        if (['.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic', '.heif'].includes(ext)) return 'image';
        return 'other';
    }

    getKindLabel(kind) {
        const labels = {
            document: 'Documents',
            text: 'Text',
            audio: 'Audio',
            video: 'Video',
            image: 'Images',
            other: 'Other',
        };
        return labels[kind] || kind.charAt(0).toUpperCase() + kind.slice(1);
    }

    renderFileCard(f) {
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

        const kind = (f.kind || this.inferKindFromName(f.name)).toLowerCase();
        const kindLabel = this.getKindLabel(kind).replace(/s$/, '').toUpperCase();
        const typeBadge = `<span class="media-badge">${kindLabel}</span>`;

        return `
        <div class="source-card${activeClass}" data-action="select-file" data-filename="${f.name}">
            <div class="filename">${f.name}</div>
            <div class="meta">
                <span class="status-badge ${statusClass}">${statusLabel}</span>
                ${typeBadge}
                ${sizeMB ? `<span>${sizeMB}</span>` : ''}
                <span>${f.type || ''}</span>
            </div>
            <div class="source-card-actions">
                <button class="source-delete-btn" data-action="source-delete" data-filename="${f.name}" title="Delete this source">Delete</button>
            </div>
        </div>`;
    }

    selectFile(filename) {
        if (this.wb.FILE_NAME && this.wb.FILE_NAME !== filename) {
            if (!confirm(`Set "${filename}" as working document?\n\nThis will replace the current file.`)) return;
        }
        this.wb.loadFile(filename);
    }

    async deleteFile(filename) {
        if (!filename) return;
        const confirmed = confirm(`Delete "${filename}" and related sidecar files?\n\nThis cannot be undone.`);
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/history/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);

            // Remove local review cache for this file.
            localStorage.removeItem(`workbench_feedback_${filename}`);
            localStorage.removeItem(`workbench_export_${filename}`);
            localStorage.removeItem(`classifier_feedback_${filename}`);
            localStorage.removeItem(`classifier_export_${filename}`);

            // If active file was deleted, reset to SOURCE context.
            if (this.wb.FILE_NAME === filename) {
                this.wb.destroy();
                this.wb.FILE_NAME = '';
                this.wb.PDF_URL = '';
                this.wb.classificationData = null;
                this.wb.feedback = {};
                this.wb.entityApprovals = {};
                this.wb.updateTabStates();
                this.wb.switchTab('source');
            }

            await this.loadHistory();
            this.wb.showToast(`Deleted ${filename}`);
            if (data.warnings && data.warnings.length) {
                console.warn('Delete warnings:', data.warnings);
            }
        } catch (err) {
            console.error('Delete failed:', err);
            this.wb.showToast(`Delete failed: ${err.message}`, true);
        }
    }
}

// =====================================================================
// DocumentWorkbench — Main controller
// =====================================================================

class DocumentWorkbench {
    renderWorkbenchHeader(tabName) {
        const titles = {
            input: "INPUT",
            source: "SOURCE",
            classify: "CLASSIFY",
            entities: "ENTITIES",
            export: "EXPORT"
        };
        const title = titles[tabName] || "WORKBENCH";

        // Build dropdown options — source files on classify, generic on other tabs
        let filterOptions = '<option value="all">All</option>';
        if ((tabName === 'classify' || tabName === 'source') && this.sourceTab && this.sourceTab.files.length > 0) {
            filterOptions = '<option value="" disabled' + (!this.FILE_NAME ? ' selected' : '') + '>-- Select Source --</option>';
            filterOptions += this.sourceTab.files.map(f =>
                `<option value="${f.name}"${f.name === this.FILE_NAME ? ' selected' : ''}>${f.name}</option>`
            ).join('');
        }

        return `
            <div class="workbench-facet-row">
                <div class="workbench-facet-left">
                    <h1 class="workbench-facet-title">${title}</h1>
                    <div class="workbench-facet-filter-wrap">
                        <select id="workbench-filter" class="workbench-facet-filter">
                            ${filterOptions}
                        </select>
                        <span class="material-symbols-outlined workbench-facet-filter-icon">expand_more</span>
                    </div>
                </div>
                <div class="workbench-facet-right">
                    <span class="workbench-facet-context-label">Workbench Context</span>
                    <span class="workbench-facet-context-value">---</span>
                </div>
            </div>
        `;
    }

    constructor(config) {
        this.config = config || {};
        this.isWorkbenchMode = !!document.getElementById('tab-source');
        const params = new URLSearchParams(window.location.search);
        const rawFile = params.get('file') || '';
        this.requestedTab = params.get('tab') || '';
        this.FILE_NAME = '';
        this.PDF_URL = '';
        if (rawFile) {
            this.setFile(rawFile);
        } else if (!this.isWorkbenchMode) {
            this.setFile('yates-searchable.pdf');
        }
        this.pdfDoc = null;
        this.classificationData = null;
        this.feedback = {};
        this.entityApprovals = {};
        this.detectedEntities = null;
        this.detectedCandidates = null;
        this.STORAGE_KEY = '';
        this.EXPORT_STORAGE_KEY = '';
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
        const prefix = this.isWorkbenchMode ? 'workbench' : 'classifier';
        this.STORAGE_KEY = `${prefix}_feedback_${this.FILE_NAME}`;
        this.EXPORT_STORAGE_KEY = `${prefix}_export_${this.FILE_NAME}`;
    }

    init() {
        if (this.isWorkbenchMode) this.migrateLocalStorageKeys();
        if (this.FILE_NAME) {
            this.feedback = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            this.entityApprovals = JSON.parse(localStorage.getItem(this.EXPORT_STORAGE_KEY) || '{}');
        }
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        this.bindEvents();
        if (this.isWorkbenchMode) this.injectHeaderTabs();
        if (this.isWorkbenchMode) {
            if (this.inputTab) this.inputTab.init();
            if (this.entitiesTab) this.entitiesTab.initFilters();
            if (this.sourceTab) {
                this.sourceTab.loadHistory().then(() => {
                    if (this.FILE_NAME) this.loadFile(this.FILE_NAME, true);
                    this.refreshHeader();
                });
            }
        } else {
            document.title = `Classification Review: ${this.FILE_NAME}`;
            this.loadClassificationData();
        }
        const initialTab = this.requestedTab || (this.isWorkbenchMode ? 'input' : 'classify');
        this.switchTab(initialTab);
    }

    migrateLocalStorageKeys() {
        const migrated = localStorage.getItem('workbench_migration_v1');
        if (migrated) return;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('classifier_feedback_')) {
                const file = key.replace('classifier_feedback_', '');
                if (!localStorage.getItem(`workbench_feedback_${file}`)) {
                    localStorage.setItem(`workbench_feedback_${file}`, localStorage.getItem(key));
                }
            }
            if (key && key.startsWith('classifier_export_')) {
                const file = key.replace('classifier_export_', '');
                if (!localStorage.getItem(`workbench_export_${file}`)) {
                    localStorage.setItem(`workbench_export_${file}`, localStorage.getItem(key));
                }
            }
        }
        localStorage.setItem('workbench_migration_v1', Date.now().toString());
    }

    bindEvents() {
        const self = this;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                self.switchTab(btn.dataset.tab);
            });
        });
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const page = target.dataset.page;
            const idx = target.dataset.idx !== undefined ? parseInt(target.dataset.idx) : null;
            switch (action) {
                case 'input-start': if (self.inputTab) self.inputTab.startProcessing(); break;
                case 'input-cancel': if (self.inputTab) self.inputTab.cancelProcessing(); break;
                case 'input-remove': if (self.inputTab && idx !== null) self.inputTab.removeFile(idx); break;
                case 'input-clear-completed': if (self.inputTab) self.inputTab.clearCompleted(); break;
                case 'input-clear-all': if (self.inputTab) self.inputTab.clearAll(); break;
                case 'input-copy-metadata': if (self.inputTab && idx !== null) self.inputTab.copyMetadata(idx); break;
                case 'input-reparse': if (self.inputTab && idx !== null) self.inputTab.reparseHeader(idx); break;
                case 'select-file': if (self.sourceTab) self.sourceTab.selectFile(target.dataset.filename); break;
                case 'source-delete': if (self.sourceTab) self.sourceTab.deleteFile(target.dataset.filename); break;
                case 'page-prev': self.classifyTab.goToPage(self.classifyTab.currentPage - 1); break;
                case 'page-next': self.classifyTab.goToPage(self.classifyTab.currentPage + 1); break;
                case 'submit-4tier': self.classifyTab.submit4Tier(parseInt(page)); break;
                case 'skip-4tier': self.classifyTab.skip4Tier(parseInt(page)); break;
                case 'show-modal': self.classifyTab.showModalPage(parseInt(target.dataset.pageIndex)); break;
                case 'segment-copy-time': self.classifyTab.copySegmentTime(target.dataset.time); break;
                case 'select-hybrid-chip': self.classifyTab.selectTierValue(parseInt(page), target.dataset.tier, target.dataset.value); break;
                case 'export-feedback': self.classifyTab.exportFeedback(); break;
                case 'clear-feedback': self.classifyTab.clearFeedback(); break;
                case 'detect-entities': self.entitiesTab.detectEntities(); break;
                case 'jump-to-page': self.entitiesTab.jumpToPage(parseInt(target.dataset.page)); break;
                case 'approve-entity': self.entitiesTab.approveEntity(idx); break;
                case 'reject-entity': self.entitiesTab.rejectEntity(idx); break;
                case 'approve-candidate': self.entitiesTab.approveCandidate(idx); break;
                case 'reject-candidate': self.entitiesTab.rejectCandidate(idx); break;
                case 'export-source-record': self.exportTab.exportSourceRecord(); break;
                case 'export-new-entities': self.exportTab.exportNewEntities(); break;
                case 'tts-preview': self.exportTab.previewTTS(); break;
                case 'tts-generate': self.exportTab.generateAudio(); break;
            }
        });
        document.addEventListener('change', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            if (target.dataset.action === 'note-preset') self.classifyTab.applyNotePreset(parseInt(target.dataset.page));
            if (target.dataset.action === 'filter') self.classifyTab.applyFilters();
            if (target.dataset.action === 'entity-type-change') {
                const page = parseInt(target.dataset.page);
                if (!self.feedback[page]) self.feedback[page] = { status: 'pending' };
                self.classifyTab.ensureSelectedEntitiesShape(page);
                self.feedback[page].entityAssistType = target.value || 'person';
                self.saveFeedback();
                self.classifyTab.renderCards(self.classifyTab.filteredPages);
            }
            if (target.dataset.action === 'entity-checkbox') {
                const page = parseInt(target.dataset.page);
                const type = target.dataset.entityType;
                const id = target.dataset.entityId;
                if (target.checked) self.classifyTab.addSelectedEntity(page, type, id);
                else self.classifyTab.removeSelectedEntity(page, type, id);
                self.classifyTab.renderCards(self.classifyTab.filteredPages);
            }
            if (target.dataset.action === 'select-hybrid-dropdown') {
                const val = target.value;
                if (val) self.classifyTab.selectTierValue(parseInt(target.dataset.page), target.dataset.tier, val);
            }
        });
        document.addEventListener('input', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            if (target.dataset.action === 'note-input') self.classifyTab.saveNote(parseInt(target.dataset.page));
        });
        ['filter-type', 'filter-agency', 'filter-status', 'sort-order'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => self.classifyTab.applyFilters());
        });
        const pageInput = document.getElementById('page-input');
        if (pageInput) pageInput.addEventListener('change', () => self.classifyTab.goToPage(parseInt(pageInput.value) || 1));
        if (this.isWorkbenchMode) {
            const searchEl = document.getElementById('source-search');
            if (searchEl) searchEl.addEventListener('input', () => self.sourceTab.applySearch());
            const sortEl = document.getElementById('source-sort');
            if (sortEl) sortEl.addEventListener('change', () => { if (self.sourceTab) { self.sourceTab.applySort(); self.sourceTab.renderGrid(); } });
        }
        document.getElementById('imageModal')?.addEventListener('click', () => self.classifyTab.hideModal());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') self.classifyTab.hideModal(); });
    }

    injectHeaderTabs() {
        const header = document.querySelector('header[data-component="header"]');
        if (!header) return;
        const leftGroup = header.querySelector('.flex.items-center.gap-3');
        if (!leftGroup) return;
        const searchLink = leftGroup.querySelector('a[href*="search"]');
        const brandingLink = leftGroup.querySelector('a.pl-4');
        const breadcrumb = leftGroup.querySelector('#breadcrumb-nav');
        [searchLink, brandingLink, breadcrumb].forEach(el => {
            if (el) {
                el.style.transition = 'opacity 0.2s ease';
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                setTimeout(() => { el.style.display = 'none'; }, 220);
            }
        });
        const tabContainer = document.createElement('div');
        tabContainer.className = 'header-tabs';
        tabContainer.style.opacity = '0';
        tabContainer.style.transition = 'opacity 0.3s ease 0.15s';
        const tabs = [
            { name: 'input', label: 'Input' },
            { name: 'source', label: 'Source' },
            { name: 'classify', label: 'Classify', locked: true },
            { name: 'entities', label: 'Entities', locked: true },
            { name: 'export', label: 'Export', locked: true }
        ];
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = 'header-tab-btn' + (tab.name === 'input' ? ' active' : '') + (tab.locked ? ' disabled' : '');
            btn.setAttribute('data-tab', tab.name);
            btn.textContent = tab.label;
            btn.addEventListener('click', () => this.switchTab(tab.name));
            tabContainer.appendChild(btn);
        });
        const headerWrapper = header.querySelector('.flex.h-16');
        if (headerWrapper) {
            const rightGroup = headerWrapper.lastElementChild;
            headerWrapper.insertBefore(tabContainer, rightGroup);
        } else {
            leftGroup.appendChild(tabContainer);
        }
        requestAnimationFrame(() => tabContainer.style.opacity = '1');
    }

    getUnlockState() {
        const hasFile = !!this.FILE_NAME && !!this.classificationData;
        return { input: true, source: true, classify: hasFile, entities: hasFile, export: hasFile };
    }

    updateTabStates() {
        if (!this.isWorkbenchMode) return;
        const unlock = this.getUnlockState();
        ['classify', 'entities', 'export'].forEach(tab => {
            const btn = document.querySelector(`[data-tab="${tab}"]`);
            if (!btn) return;
            unlock[tab] ? btn.classList.remove('disabled') : btn.classList.add('disabled');
            const locked = document.getElementById(`${tab}-locked`);
            const content = document.getElementById(`${tab}-content`);
            if (locked && content) {
                if (unlock[tab]) { locked.classList.add('hidden'); content.classList.remove('hidden'); }
                else { locked.classList.remove('hidden'); content.classList.add('hidden'); }
            }
        });
    }

    switchTab(tabName) {
        if (this.isWorkbenchMode) {
            const unlock = this.getUnlockState();
            if (!unlock[tabName]) {
                const fallback = ['export', 'entities', 'classify', 'source', 'input'].find(t => unlock[t]) || 'input';
                if (fallback !== tabName) {
                    const reasons = { classify: 'Select a document first', entities: 'Select a document first', export: 'Select a document first' };
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
        if (tabName === 'export') {
            this.exportTab.populateSourceRecordPreview();
            this.exportTab.initTTS();
        }
        if (this.isWorkbenchMode) {
            const url = new URL(window.location);
            if (this.FILE_NAME) url.searchParams.set('file', this.FILE_NAME);
            url.searchParams.set('tab', tabName);
            history.replaceState(null, '', url);
        }
        const headerEl = document.getElementById('workbench-active-header');
        if (headerEl) headerEl.innerHTML = this.renderWorkbenchHeader(tabName);

        // Bind source dropdown on classify tab
        if (tabName === 'classify') {
            const filter = document.getElementById('workbench-filter');
            if (filter) filter.onchange = (e) => { if (e.target.value) this.loadFile(e.target.value); };
        }
    }

    refreshHeader() {
        const headerEl = document.getElementById('workbench-active-header');
        const activeTab = document.querySelector('.header-tab-btn.active');
        if (headerEl && activeTab) headerEl.innerHTML = this.renderWorkbenchHeader(activeTab.dataset.tab);
    }

    async loadFile(filename, isDeepLink = false) {
        this.destroy();
        this.classificationData = null; this.feedback = {}; this.entityApprovals = {}; this.detectedEntities = null; this.detectedCandidates = null;
        const cardsContainer = document.getElementById('cards-container');
        if (cardsContainer) cardsContainer.innerHTML = '<div class="text-center py-12 opacity-60"><span class="loading-spinner"></span> Loading classifications…</div>';
        const entityResults = document.getElementById('entity-results'); if (entityResults) entityResults.classList.add('hidden');
        const entityLoading = document.getElementById('entity-loading'); if (entityLoading) entityLoading.classList.add('hidden');
        this.setFile(filename);
        this.feedback = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        this.entityApprovals = JSON.parse(localStorage.getItem(this.EXPORT_STORAGE_KEY) || '{}');
        document.title = `Document Workbench: ${this.FILE_NAME}`;
        if (this.isWorkbenchMode) {
            document.querySelectorAll('.tab-btn, .header-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const classifyBtn = document.querySelector('[data-tab="classify"]');
            if (classifyBtn) { classifyBtn.classList.add('active'); classifyBtn.classList.remove('disabled'); }
            const classifyPanel = document.getElementById('tab-classify'); if (classifyPanel) classifyPanel.classList.add('active');
            const classifyLocked = document.getElementById('classify-locked');
            const classifyContent = document.getElementById('classify-content');
            if (classifyLocked) classifyLocked.classList.add('hidden'); if (classifyContent) classifyContent.classList.remove('hidden');
        }
        document.getElementById('stat-total').textContent = '—';
        document.getElementById('file-info').textContent = `${filename} • Loading…`;
        this.classifyTab.currentPage = 1; this.classifyTab.filteredPages = []; this.classifyTab.updatePagination();
        await this.loadClassificationData();
        this.updateTabStates();
        if (this.sourceTab) this.sourceTab.renderGrid();
        isDeepLink && this.requestedTab ? this.switchTab(this.requestedTab) : this.switchTab('classify');
    }

    async loadClassificationData() {
        const statusEl = document.getElementById('load-status');
        if (statusEl) statusEl.innerHTML = '<span class="loading-spinner"></span> Classifying pages…';
        try {
            const res = await fetch(`/api/review/${encodeURIComponent(this.FILE_NAME)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.classificationData = await res.json();
            const pageLabel = this.classificationData.media_type ? 'segments' : 'pages';
            const durationInfo = this.classificationData.duration ? ` • ${this.classifyTab.formatTime(this.classificationData.duration)}` : '';
            document.getElementById('file-info').textContent = `${this.classificationData.filename} • ${this.classificationData.total_pages} ${pageLabel}${durationInfo} • ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
            document.getElementById('stat-total').textContent = this.classificationData.total_pages;
            this.classifyTab.populateTypeFilter(this.classificationData.pages);
            this.reconcileFeedbackStatuses();
            this.classifyTab.renderCards(this.classificationData.pages);
            this.classifyTab.applyFilters();
            if (statusEl) statusEl.textContent = '';
            // Only load PDF renderer for PDF files, skip for media transcripts
            const isMediaTranscript = this.classificationData.media_type;
            if (!isMediaTranscript) {
                this.loadPDF();
            }
            for (const [page, data] of Object.entries(this.feedback)) this.classifyTab.applyFeedbackUI(page, data);
            this.classifyTab.updateStats();
            if (this.isWorkbenchMode) this.updateTabStates();
            if (this.isWorkbenchMode && !this.detectedEntities && !this.detectedCandidates && this.classificationData?.pages?.length) {
                setTimeout(() => this.entitiesTab.detectEntities({ auto: true }), 250);
            }
        } catch (err) {
            console.error('Failed to load classification data:', err);
            if (statusEl) statusEl.innerHTML = `<span class="text-red-400">\u26A0 ${err.message}</span>`;
            const cardsContainer = document.getElementById('cards-container');
            if (cardsContainer) cardsContainer.innerHTML = `<div class="text-center py-12 opacity-60"><span class="material-symbols-outlined text-3xl text-red-400/60 mb-2">error_outline</span><p class="text-sm text-red-400/80">${err.message}</p><p class="text-[10px] opacity-40 mt-1">Select a different file or re-process this source.</p></div>`;
        }
    }

    reconcileFeedbackStatuses() {
        if (!this.classificationData?.pages || !this.feedback) return;

        const pageMap = new Map(this.classificationData.pages.map(p => [String(p.page), p]));
        let changed = false;

        for (const [page, data] of Object.entries(this.feedback)) {
            if (!data || typeof data !== 'object') continue;
            if (data.status === 'pending' || data.status === 'skipped') continue;

            const pageData = pageMap.get(String(page));
            if (!pageData) continue;

            const predictedType = pageData.doc_type || data.predictedType || 'UNKNOWN';
            const predictedClass = this.classifyTab.mapDocTypeToClass(predictedType);
            const selectedRaw = (data.selectedClass || data.selectedType || '').toString().trim();
            const hasExplicitClass = selectedRaw.length > 0;
            const selectedClass = hasExplicitClass
                ? (this.classifyTab.normalizeClassValue(selectedRaw, predictedType) || predictedClass)
                : predictedClass;
            const recomputedStatus = (!hasExplicitClass || selectedClass === predictedClass) ? 'correct' : 'incorrect';

            if (data.status !== recomputedStatus) {
                data.status = recomputedStatus;
                changed = true;
            }
            if (!data.predictedType) {
                data.predictedType = predictedType;
                changed = true;
            }
            if (!data.selectedClass || String(data.selectedClass).toUpperCase() !== selectedClass) {
                data.selectedClass = selectedClass;
                changed = true;
            }
            if (!data.selectedType || String(data.selectedType).toUpperCase() !== selectedClass) {
                data.selectedType = selectedClass;
                changed = true;
            }
        }

        if (changed) this.saveFeedback();
    }

    async loadPDF() {
        try {
            const loadingTask = pdfjsLib.getDocument(this.PDF_URL);
            this.pdfDoc = await loadingTask.promise;
            this.classifyTab.setupLazyLoading();
        } catch (err) {
            console.error('Failed to load PDF:', err);
            document.querySelectorAll('.canvas-loading').forEach(el => { el.textContent = 'PDF load failed'; el.style.color = 'red'; });
        }
    }

    saveFeedback() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.feedback)); if (this.isWorkbenchMode) this.updateTabStates(); }
    saveEntityApprovals() { localStorage.setItem(this.EXPORT_STORAGE_KEY, JSON.stringify(this.entityApprovals)); if (this.isWorkbenchMode) this.updateTabStates(); }
    showToast(message) {
        const existing = document.querySelector('.workbench-toast'); if (existing) existing.remove();
        const toast = document.createElement('div'); toast.className = 'workbench-toast'; toast.textContent = message;
        document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000);
    }
    destroy() {
        if (this.pdfDoc) { this.pdfDoc.destroy(); this.pdfDoc = null; }
        if (this.classifyTab.observer) { this.classifyTab.observer.disconnect(); this.classifyTab.observer = null; }
        this.classifyTab.renderedPages.clear(); this.classifyTab.renderQueue = []; this.classifyTab.activeRenders = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.workbench = new DocumentWorkbench();
    window.workbench.init();
});

