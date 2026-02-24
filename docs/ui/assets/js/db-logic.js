/**
 * db-logic.js — Generic entity card renderer
 *
 * All 6 entity types (person, org, place, object, event, source) share
 * one card layout. Each JSON file maps its fields to 4 standard slots:
 *
 *   icon        — Material Symbol name
 *   label       — metadata line (date, role, category, etc.)
 *   title       — primary display name
 *   description — short description or summary (falls back to notes or body)
 *   link        — optional href (defaults to "#")
 *   featured    — optional boolean for wide/highlighted treatment
 *
 * For events: Only parent events (without parent_event_id) are displayed.
 */

function buildCard(item) {
    const featured = !!item.featured;

    const searchIndex = [
        item.label,
        item.title,
        item.name,
        item.description,
        item.notes,
        item.body,
        ...(item.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();

    const itemType = (item.org_type || item.person_type || item.place_type || item.object_type || item.source_type || item.event_type || '').toLowerCase();
    let dynamicTags = [...(item.tags || [])];
    if (itemType) dynamicTags.push(itemType);
    if (item.organization) dynamicTags.push(item.organization);

    // Auto-generate tags for events (Date & Location)
    if (item.start_ts) {
        const d = new Date(item.start_ts);
        const month = d.toLocaleString('en-US', { month: 'long' });
        const year = d.getFullYear();
        dynamicTags.push(`${month} ${year}`);
    }
    if (item.label) {
        if (item.label.includes('Dallas')) dynamicTags.push('Dallas');
        if (item.label.includes('Washington')) dynamicTags.push('Washington');
        if (item.label.includes('New Orleans')) dynamicTags.push('New Orleans');
        if (item.label.includes('Residence')) dynamicTags.push('residence');
    }

    const filterTags = dynamicTags.filter(Boolean).join('|').toLowerCase();

    // Determine the link: default to event.html for events, otherwise use the URL/link
    let itemLink = item.url || item.link || (item.event_id ? `event.html?id=${item.id}` : '#');

    // NEW: Global PDF Interceptor - Route all PDFs through our custom viewer
    if (itemLink.includes('.pdf')) {
        const [filePath, pdfParams] = itemLink.split('#');
        const queryParams = new URLSearchParams(pdfParams || '');
        const page = queryParams.get('page') || 1;
        const search = queryParams.get('search') || '';

        // Handle path depth (if we are in ocr/ or other subfolder)
        const pathPrefix = window.location.pathname.includes('/ocr/') ? '../' : '';
        itemLink = `${pathPrefix}pdf-viewer.html?file=${filePath}&page=${page}&search=${search}`;
    }

    return `
    <a href="${itemLink}"
        ${(item.url || item.link || item.event_id) ? 'target="_blank"' : ''}
        data-search-index="${searchIndex}"
        data-filter-tags="${filterTags}"
        data-org="${item.organization || 'Independent'}"
        data-title="${(item.display_name || item.title || item.name || '').toLowerCase()}"
        data-label="${(item.label || '').toLowerCase()}"
        data-date="${item.start_ts || ''}"
        style="display:flex;align-items:flex-start;gap:1rem;border:1px solid ${featured ? 'rgba(176,139,73,0.4)' : 'rgba(212,207,199,0.1)'};background:${featured ? 'rgba(176,139,73,0.07)' : 'rgba(37,32,33,0.6)'};padding:${featured ? '1.25rem' : '1rem'};transition:border-color 0.2s;text-decoration:none;"
        onmouseover="this.style.borderColor='rgba(176,139,73,0.6)'"
        onmouseout="this.style.borderColor='${featured ? 'rgba(176,139,73,0.4)' : 'rgba(212,207,199,0.1)'}'">

        <div style="flex-shrink:0;width:${featured ? '5.5rem' : '4.5rem'};height:${featured ? '6rem' : '5.5rem'};border:1px solid rgba(212,207,199,0.1);background:#2e282a;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined" style="font-size:${featured ? '3rem' : '2.5rem'};color:var(--primary)">${item.icon || 'description'}</span>
        </div>

        <div style="display:flex;flex-direction:column;height:100%;padding:0.25rem 0;min-width:0;">
            <div style="display:flex;align-items:center;margin-bottom:4px;">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--primary);letter-spacing:0.1em;">${item.label || ''}</span>
                ${item.is_conflict ? '<span style="background:rgba(176,139,73,0.15);color:var(--primary);font-size:8px;padding:2px 4px;border:1px solid rgba(176,139,73,0.3);margin-left:8px;font-weight:700;display:flex;align-items:center;gap:3px;"><span class="material-symbols-outlined" style="font-size:10px;">history_toggle_off</span>CONFLICT</span>' : ''}
            </div>
            <h4 style="font-family:\'Oswald\',sans-serif;font-size:${featured ? '1.15rem' : '1rem'};font-weight:700;text-transform:uppercase;color:var(--archive-heading);line-height:1.25;margin:0">${item.display_name || item.title || item.name || ''}</h4>
            <p style="font-size:0.72rem;color:rgba(212,207,199,0.75);margin-top:8px;line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${item.description || item.notes || item.body || ''}</p>
        </div>
    </a>`;
}

/**
 * renderEventDetail — Populates the single event view page (event.html)
 * Extracts 'id' from URL, finds data, and injects into DOM slots.
 */
async function renderEventDetail() {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    if (!eventId) return;

    try {
        // Fetch all necessary data files
        const [events, people, sources, objects] = await Promise.all([
            fetch('assets/data/events.json').then(r => r.json()),
            fetch('assets/data/people.json').then(r => r.json()),
            fetch('assets/data/sources.json').then(r => r.json()),
            fetch('assets/data/objects.json').then(r => r.json())
        ]);

        const event = events.find(e => e.id === eventId);
        if (!event) return;

        // 1. Populate Header/Meta
        document.title = `${event.title} — Primary Sources`;
        const titleEl = document.getElementById('event-title');
        if (titleEl) titleEl.textContent = event.title;

        const labelEl = document.getElementById('event-label');
        if (labelEl) labelEl.textContent = event.label;

        const descEl = document.getElementById('event-description');
        if (descEl) descEl.textContent = event.description;

        const iconEl = document.getElementById('event-icon');
        if (iconEl) iconEl.textContent = event.icon || 'calendar_month';

        // 2. Filter & Render Child Events (Timeline)
        const children = events
            .filter(e => e.parent_event_id === event.event_id)
            .sort((a, b) => (a.start_ts || '').localeCompare(b.start_ts || ''));

        const timelineContainer = document.getElementById('event-timeline');
        if (timelineContainer) {
            if (children.length > 0) {
                timelineContainer.innerHTML = children.map(child => buildCard(child)).join('');
            } else {
                timelineContainer.innerHTML = '<p class="text-xs text-archive-secondary/40 italic">No sub-events documented for this record.</p>';
            }
        }

        // 3. Filter & Render People (Key Participants)
        // We match based on the tags array in people.json
        const relatedPeople = people.filter(p => p.tags && p.tags.includes(event.title));
        const peopleContainer = document.getElementById('event-people');
        if (peopleContainer) {
            peopleContainer.innerHTML = relatedPeople.map(p => buildCard(p)).join('');
        }

        // 4. Filter & Render Objects (Evidence)
        const relatedObjects = objects.filter(o => o.tags && o.tags.includes(event.title));
        const objectsContainer = document.getElementById('event-objects');
        if (objectsContainer) {
            objectsContainer.innerHTML = relatedObjects.map(o => buildCard(o)).join('');
        }

        // 5. Filter & Render Sources (Primary Documents)
        // For Yates prototype, we look for the searchable PDF specifically
        const relatedSources = sources.filter(s => s.id === 'yates-searchable' || (s.notes && s.notes.includes(event.title)));
        const sourcesContainer = document.getElementById('event-sources');
        if (sourcesContainer) {
            sourcesContainer.innerHTML = relatedSources.map(s => buildCard(s)).join('');
        }

    } catch (err) {
        console.error("Error loading event detail:", err);
    }
}

function renderEntities(container) {
    const dataSource = container.getAttribute("data-data-source");
    const filterValue = container.getAttribute("data-filter");
    const filterKey = container.getAttribute("data-filter-key") || "org_type";
    const filterMode = container.getAttribute("data-filter-mode") || "include";

    if (!dataSource) return;

    fetch(`assets/data/${dataSource}.json`)
        .then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${dataSource}.json`);
            return r.json();
        })
        .then(data => {
            let filteredData = data;

            // Apply generic filter if present
            if (filterValue) {
                if (filterMode === 'exclude') {
                    filteredData = data.filter(item => item[filterKey] !== filterValue);
                } else {
                    filteredData = data.filter(item => item[filterKey] === filterValue);
                }
            }

            // Legacy event filtering
            if (dataSource === 'events' && !filterValue) {
                filteredData = data.filter(item => !item.parent_event_id);
            }

            container.innerHTML = filteredData.map(item => buildCard(item)).join('');

            // Dispatch event so filter.js knows to apply initial sort/filters
            document.dispatchEvent(new CustomEvent("entitiesRendered", {
                detail: { container, dataSource }
            }));
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p style="color:rgba(212,207,199,0.4);font-size:0.75rem;padding:1rem">No records found.</p>`;
        });
}

function renderOTDPage(container, scope = "Day", targetDate = new Date()) {
    // Normalize targetDate to the user's local "day" and "month" for the query
    // We treat the year as irrelevant for OTD matching
    const month = targetDate.getMonth(); // 0-indexed local
    const day = targetDate.getDate();     // local day

    // Show loading state
    container.innerHTML = `<div class="col-span-full text-center py-20 opacity-30"><span class="material-symbols-outlined animate-spin text-4xl mb-4">history</span><p class="uppercase tracking-[0.3em] text-[10px]">Scanning chronological archives...</p></div>`;

    fetch(`assets/data/events.json`)
        .then(r => r.json())
        .then(data => {
            const results = data.filter(item => {
                if (!item.start_ts) return false;
                const d = new Date(item.start_ts);
                // We use UTC components from the data to match our target "local" day
                // because archival dates in JSON should be treated as absolute markers
                const iMonth = d.getUTCMonth();
                const iDay = d.getUTCDate();

                if (scope === "Day") {
                    return iMonth === month && iDay === day;
                } else if (scope === "Week") {
                    // Approximate week by +/- 3 days using normalized timestamps
                    const targetTS = Date.UTC(2000, month, day);
                    const itemTS = Date.UTC(2000, iMonth, iDay);
                    const diffDays = Math.abs(targetTS - itemTS) / (1000 * 60 * 60 * 24);
                    // Handle year wrap-around for late Dec/early Jan
                    const wrapDiff = 366 - diffDays;
                    return diffDays <= 3 || wrapDiff <= 3;
                } else if (scope === "Month" || scope === "Year") {
                    return iMonth === month;
                }
                return false;
            });

            if (results.length === 0) {
                container.innerHTML = `<p class="text-archive-secondary/40 p-8 text-center uppercase tracking-widest text-xs">No records found for this ${scope.toLowerCase()} window.</p>`;
            } else {
                container.innerHTML = results.map(item => buildOTDCard(item)).join('');
            }

            // Update subtitle
            const subtitle = document.getElementById('otd-subtitle');
            if (subtitle) {
                const dateStr = targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                if (scope === "Day") subtitle.textContent = `Documented events for ${dateStr}`;
                else if (scope === "Week") subtitle.textContent = `Historical window for the week of ${dateStr}`;
                else if (scope === "Month" || scope === "Year") subtitle.textContent = `Archival summary for the month of ${targetDate.toLocaleDateString('en-US', { month: 'long' })}`;
            }
        })
        .catch(err => {
            console.error("OTD Page Error:", err);
        });
}

async function renderRandomEntity(container) {
    if (!container) return;

    // Show loading state
    container.innerHTML = `<div class="text-center py-20 opacity-30"><span class="material-symbols-outlined animate-spin text-4xl mb-4">cyclone</span><p class="uppercase tracking-[0.3em] text-[10px]">Tuning to a random archival frequency...</p></div>`;

    const dataFiles = [
        'assets/data/events.json',
        'assets/data/people.json',
        'assets/data/orgs.json',
        'assets/data/places.json',
        'assets/data/objects.json',
        'assets/data/sources.json'
    ];

    try {
        // Fetch all files
        const responses = await Promise.all(dataFiles.map(file => fetch(file).then(r => r.json())));

        // Flatten into one big pool
        const allEntities = responses.flat();

        if (allEntities.length === 0) {
            container.innerHTML = `<p class="text-archive-secondary/40 text-center uppercase tracking-widest text-xs">The archive is currently silent.</p>`;
            return;
        }

        // Pick one
        const randomIndex = Math.floor(Math.random() * allEntities.length);
        const randomItem = allEntities[randomIndex];

        // Render using the premium OTD style card
        container.innerHTML = buildOTDCard(randomItem);

    } catch (err) {
        console.error("Serendipity Engine Error:", err);
        container.innerHTML = `<p class="text-red-500/50 text-center uppercase tracking-widest text-xs">Interference detected in the archival stream.</p>`;
    }
}

// Handle raw [data-data-source] divs already in the page HTML
document.addEventListener("DOMContentLoaded", () => {
    // If we are on event.html, run the detail renderer
    if (window.location.pathname.includes('event.html')) {
        renderEventDetail();
    }

    document.querySelectorAll("[data-data-source]").forEach(el => {
        if (!el.closest("[data-component]")) {
            renderEntities(el);
        }
    });

    document.querySelectorAll("[data-otd-page]").forEach(el => {
        renderOTDPage(el);
    });

    document.querySelectorAll("[data-random-page]").forEach(el => {
        renderRandomEntity(el);
    });
});

// Handle [data-data-source] inside dynamically loaded components
document.addEventListener("componentLoaded", (e) => {
    const el = e.detail.element;
    el.querySelectorAll("[data-data-source]").forEach(container => renderEntities(container));
    if (el.hasAttribute("data-data-source")) renderEntities(el);
});

function buildOTDCard(item) {
    const d = new Date(item.start_ts);
    const dayStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    const yearStr = d.getUTCFullYear();

    return `
    <article class="bg-archive-dark border border-primary/30 p-8 flex flex-col items-center text-center group hover:border-primary transition-all relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        <div class="mb-6">
            <span class="text-[10px] font-bold uppercase text-primary tracking-[0.4em]">On This Day</span>
            <div class="mt-2 text-4xl font-display font-bold text-archive-heading uppercase tracking-tighter">${dayStr}</div>
            <div class="text-xs font-mono text-archive-secondary/40 mt-1">${yearStr} — Archival Record #${item.id.toUpperCase().slice(0, 8)}</div>
        </div>

        <div class="w-16 h-16 bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-archive-bg transition-colors">
            <span class="material-symbols-outlined text-3xl">${item.icon || 'history_edu'}</span>
        </div>

        <div class="max-w-xl">
            <h4 class="text-2xl font-bold text-primary uppercase font-display leading-tight mb-4">${item.title}</h4>
            <div class="flex items-center justify-center gap-4 mb-6">
                <span class="text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 border border-emerald-500/20">Verified Record</span>
                <span class="text-[9px] uppercase tracking-widest text-archive-secondary/60">${item.label}</span>
            </div>
            <p class="text-sm leading-relaxed text-archive-secondary/80 italic font-serif">
                "${item.description || item.notes || item.body || ''}"
            </p>
        </div>

        <div class="mt-8 pt-6 border-t border-archive-secondary/10 w-full flex justify-center gap-6">
            <a href="event.html?id=${item.id}" class="text-[10px] font-bold uppercase text-primary hover:underline tracking-widest flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">auto_stories</span>
                View Deep Record
            </a>
            ${item.url ? `
            <a href="${item.url}" target="_blank" class="text-[10px] font-bold uppercase text-primary hover:underline tracking-widest flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">description</span>
                Source Document
            </a>
            ` : ''}
        </div>
    </article>
    `;
}
