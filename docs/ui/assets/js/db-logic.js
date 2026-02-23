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

    return `
    <a href="${item.url || item.link || '#'}"
        ${(item.url || item.link) ? 'target="_blank"' : ''}
        data-search-index="${searchIndex}"
        data-filter-tags="${filterTags}"
        data-org="${item.organization || 'Independent'}"
        data-title="${(item.display_name || item.title || item.name || '').toLowerCase()}"
        data-label="${(item.label || '').toLowerCase()}"
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
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p style="color:rgba(212,207,199,0.4);font-size:0.75rem;padding:1rem">No records found.</p>`;
        });
}

// Handle raw [data-data-source] divs already in the page HTML
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-data-source]").forEach(el => {
        if (!el.closest("[data-component]")) {
            renderEntities(el);
        }
    });
});

// Handle [data-data-source] inside dynamically loaded components
document.addEventListener("componentLoaded", (e) => {
    const el = e.detail.element;
    el.querySelectorAll("[data-data-source]").forEach(container => renderEntities(container));
    if (el.hasAttribute("data-data-source")) renderEntities(el);
});
