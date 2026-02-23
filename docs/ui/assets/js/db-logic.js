/**
 * db-logic.js — Generic entity card renderer
 *
 * All 6 entity types (person, org, place, object, event, source) share
 * one card layout. Each JSON file maps its fields to 4 standard slots:
 *
 *   icon   — Material Symbol name
 *   label  — metadata line (date, role, category, etc.)
 *   title  — primary display name
 *   body   — short description or summary
 *   link   — optional href (defaults to "#")
 *   featured — optional boolean for wide/highlighted treatment
 */

function buildCard(item) {
    const featured = !!item.featured;

    const searchableText = [
        item.label,
        item.title,
        item.name,
        item.body,
        ...(item.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();

    return `
    <a href="${item.link || '#'}"
        data-tags="${searchableText}"
        data-title="${(item.title || item.name || '').toLowerCase()}"
        data-label="${(item.label || '').toLowerCase()}"
        style="display:flex;align-items:flex-start;gap:1rem;border:1px solid ${featured ? 'rgba(176,139,73,0.4)' : 'rgba(212,207,199,0.1)'};background:${featured ? 'rgba(176,139,73,0.07)' : 'rgba(37,32,33,0.6)'};padding:${featured ? '1.25rem' : '1rem'};transition:border-color 0.2s;text-decoration:none;"
        onmouseover="this.style.borderColor='rgba(176,139,73,0.6)'"
        onmouseout="this.style.borderColor='${featured ? 'rgba(176,139,73,0.4)' : 'rgba(212,207,199,0.1)'}'">

        <div style="flex-shrink:0;width:${featured ? '5.5rem' : '4.5rem'};height:${featured ? '6rem' : '5.5rem'};border:1px solid rgba(212,207,199,0.1);background:#2e282a;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined" style="font-size:${featured ? '3rem' : '2.5rem'};color:var(--primary)">${item.icon || 'description'}</span>
        </div>

        <div style="display:flex;flex-direction:column;height:100%;padding:0.25rem 0;min-width:0;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--primary);letter-spacing:0.1em;margin-bottom:4px">${item.label || ''}</span>
            <h4 style="font-family:'Oswald',sans-serif;font-size:${featured ? '1.15rem' : '1rem'};font-weight:700;text-transform:uppercase;color:var(--archive-heading);line-height:1.25;margin:0">${item.title || item.name || ''}</h4>
            <p style="font-size:0.72rem;color:rgba(212,207,199,0.75);margin-top:8px;line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${item.body || ''}</p>
        </div>
    </a>`;
}

function renderEntities(container) {
    const dataSource = container.getAttribute("data-data-source");
    if (!dataSource) return;

    fetch(`assets/data/${dataSource}.json`)
        .then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${dataSource}.json`);
            return r.json();
        })
        .then(data => {
            container.innerHTML = data.map(item => buildCard(item)).join('');
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
