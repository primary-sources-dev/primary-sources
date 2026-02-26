// person-v2-cards.js
// Card Population Functions for Person Profile V2 (Synthesized Design)
// Combines oswald.html's visual aesthetic with person.html's architecture
// Primary Sources Project - 2026-02-23

// Card 1: Biography
function populateBiography(notes) {
  const textEl = document.getElementById('biography-text');
  if (!textEl || !notes) return;

  textEl.textContent = notes;
}

// Card 2: Chronology (Visual Timeline with oswald.html design)
function populateChronology(events) {
  const timeline = document.getElementById('chronology-timeline');
  if (!timeline || !events || events.length === 0) return;

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date || a.start_ts);
    const dateB = new Date(b.date || b.start_ts);
    return dateA - dateB;
  });

  let html = '<div class="flex flex-col gap-0">';

  sortedEvents.forEach((event, index) => {
    const isLast = index === sortedEvents.length - 1;
    const date = formatTimelineDate(event.date || event.start_ts);
    const title = event.title || 'Untitled Event';
    const description = event.description || '';

    html += `
      <div class="flex gap-4 items-start group">
        <div class="flex flex-col items-center">
          <div class="w-2 h-2 ${isLast ? 'border border-primary' : 'bg-primary'} mt-1 flex-shrink-0"></div>
          ${!isLast ? '<div class="w-px bg-archive-secondary/20 flex-1 min-h-[2rem]"></div>' : ''}
        </div>
        <div class="pb-4">
          <span class="text-[10px] font-bold text-primary uppercase tracking-widest">${date}</span>
          <p class="text-xs text-archive-secondary mt-0.5">${title}${description ? '. ' + description : ''}</p>
        </div>
      </div>
    `;
  });

  html += '</div>';
  timeline.innerHTML = html;
}

// Card 3: Aliases
function populateAliases(aliases) {
  const list = document.getElementById('aliases-list');
  if (!list || !aliases || aliases.length === 0) return;

  list.innerHTML = aliases.map(alias => {
    const aliasName = alias.alias_name || alias;
    const aliasType = alias.alias_type || 'UNKNOWN';
    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">badge</span>
          <span class="text-xs font-bold text-archive-heading uppercase tracking-wider">${aliasName}</span>
        </div>
        <span class="text-[10px] text-archive-secondary opacity-60 uppercase">${aliasType}</span>
      </div>
    `;
  }).join('');
}

// Card 4: Residences
function populateResidences(residences) {
  const list = document.getElementById('residences-list');
  if (!list || !residences || residences.length === 0) return;

  list.innerHTML = residences.map(res => {
    const place = res.place || 'UNKNOWN';
    const address = res.address || '';
    const dates = res.dates || '';
    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">home</span>
          <div>
            <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${place}</p>
            ${address ? `<p class="text-[10px] text-archive-secondary/60 mt-0.5">${address}</p>` : ''}
          </div>
        </div>
        <span class="text-[10px] text-archive-secondary opacity-60 uppercase">${dates}</span>
      </div>
    `;
  }).join('');
}

// Card 5: Organizations (oswald.html style)
function populateOrganizations(organizations) {
  const list = document.getElementById('organizations-list');
  if (!list || !organizations || organizations.length === 0) return;

  list.innerHTML = organizations.map(org => {
    const name = org.name || 'UNKNOWN';
    const role = org.role || '';
    const dates = org.dates || '';
    const displayText = role ? `${name} — ${role}` : name;

    // Icon based on org type
    let icon = 'groups';
    if (name.toLowerCase().includes('marine') || name.toLowerCase().includes('military')) {
      icon = 'military_tech';
    } else if (name.toLowerCase().includes('school') || name.toLowerCase().includes('depository') || name.toLowerCase().includes('company')) {
      icon = 'apartment';
    }

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors group">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">${icon}</span>
          <span class="text-xs font-bold text-archive-heading uppercase tracking-wider">${displayText}</span>
        </div>
        <span class="text-[10px] text-archive-secondary opacity-60 uppercase">${dates}</span>
      </div>
    `;
  }).join('');
}

// Card 6: Family
function populateFamily(family) {
  const list = document.getElementById('family-list');
  if (!list || !family || family.length === 0) return;

  list.innerHTML = family.map(member => {
    const name = member.name || 'UNKNOWN';
    const relation = member.relation || '';
    const date = member.date || '';
    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">person</span>
          <div>
            <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${name}</p>
            ${relation ? `<p class="text-[10px] text-archive-secondary/60 mt-0.5">${relation}</p>` : ''}
          </div>
        </div>
        <span class="text-[10px] text-archive-secondary opacity-60 uppercase">${date}</span>
      </div>
    `;
  }).join('');
}

// Card 7: Related Events (oswald.html style)
function populateEvents(events) {
  const list = document.getElementById('events-list');
  if (!list || !events || events.length === 0) return;

  list.innerHTML = events.map(event => {
    const title = event.title || 'Untitled Event';
    const date = event.date ? formatTimelineDate(event.date) : '';
    const description = event.description || '';
    const type = event.type || '';

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div>
          ${date ? `<p class="text-[10px] text-primary uppercase tracking-widest font-bold mb-0.5">${date}</p>` : ''}
          <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${title}</p>
          ${description ? `<p class="text-[10px] text-archive-secondary/60 mt-1">${description}</p>` : ''}
        </div>
        <span class="material-symbols-outlined text-archive-secondary/40 text-base">chevron_right</span>
      </div>
    `;
  }).join('');
}

// Card 8: Objects
function populateObjects(objects) {
  const list = document.getElementById('objects-list');
  if (!list || !objects || objects.length === 0) return;

  list.innerHTML = objects.map(obj => {
    const name = obj.name || 'UNKNOWN';
    const type = obj.type || '';
    const description = obj.description || '';

    // Icon based on type
    let icon = 'inventory_2';
    if (type === 'WEAPON') icon = 'gavel';
    else if (type === 'DOCUMENT') icon = 'description';
    else if (type === 'PHOTO') icon = 'image';

    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary text-base mt-0.5">${icon}</span>
          <div>
            <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${name}</p>
            ${type ? `<p class="text-[10px] text-primary uppercase tracking-widest mb-1">${type}</p>` : ''}
            ${description ? `<p class="text-[10px] text-archive-secondary/60">${description}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Card 9: Primary Sources (oswald.html style)
function populateSources(sources) {
  const list = document.getElementById('sources-list');
  if (!list || !sources || sources.length === 0) return;

  list.innerHTML = sources.map(source => {
    const title = source.title || 'Untitled Source';
    const type = source.type || 'DOCUMENT';
    const year = source.year || '';
    const author = source.author || '';
    const archive = source.archive || '';

    const metaLine = [type, year].filter(Boolean).join(' · ');
    const detailLine = [author, archive].filter(Boolean).join(' — ');

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div>
          ${metaLine ? `<p class="text-[10px] text-primary uppercase tracking-widest font-bold mb-0.5">${metaLine}</p>` : ''}
          <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${title}</p>
          ${detailLine ? `<p class="text-[10px] text-archive-secondary/60 mt-1">${detailLine}</p>` : ''}
        </div>
        <span class="material-symbols-outlined text-archive-secondary/40 text-base">description</span>
      </div>
    `;
  }).join('');
}

// Card 10: External Identifiers
function populateIdentifiers(identifiers) {
  const list = document.getElementById('identifiers-list');
  if (!list || !identifiers || identifiers.length === 0) return;

  list.innerHTML = identifiers.map(id => {
    const type = id.type || 'UNKNOWN';
    const value = id.value || '';

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">tag</span>
          <div>
            <p class="text-[10px] text-primary uppercase tracking-widest mb-0.5">${type}</p>
            <p class="text-xs font-bold text-archive-heading tracking-wider">${value}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Card 11: Assertions
function populateAssertions(assertions) {
  const list = document.getElementById('assertions-list');
  if (!list || !assertions || assertions.length === 0) return;

  list.innerHTML = assertions.map(assertion => {
    const claim = assertion.claim || '';
    const source = assertion.source || '';
    const confidence = assertion.confidence || 'UNKNOWN';

    // Confidence badge color
    let confidenceBg = 'bg-archive-secondary/10';
    let confidenceText = 'text-archive-secondary/60';
    if (confidence === 'SUPPORTED') {
      confidenceBg = 'bg-primary/20';
      confidenceText = 'text-primary';
    } else if (confidence === 'DISPUTED') {
      confidenceBg = 'bg-red-500/20';
      confidenceText = 'text-red-400';
    }

    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary text-base mt-0.5">fact_check</span>
          <div class="flex-1">
            <p class="text-xs text-archive-heading mb-2">${claim}</p>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-1 ${confidenceBg} ${confidenceText} uppercase tracking-widest">${confidence}</span>
              ${source ? `<span class="text-[10px] text-archive-secondary/60">Source: ${source}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Card 12: Photos & Media
function populateMedia(media) {
  const gallery = document.getElementById('media-gallery');
  if (!gallery || !media || media.length === 0) return;

  gallery.innerHTML = media.map(item => {
    const url = item.url || '';
    const caption = item.caption || '';
    const type = item.type || 'PHOTO';

    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 hover:border-primary transition-colors overflow-hidden group">
        <div class="aspect-square bg-archive-dark/50 flex items-center justify-center">
          ${url ? `<img src="${url}" alt="${caption}" class="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />` : `<span class="material-symbols-outlined text-archive-secondary/20 text-4xl">image</span>`}
        </div>
        ${caption ? `<div class="p-2"><p class="text-[9px] text-archive-secondary/60 leading-tight">${caption}</p></div>` : ''}
      </div>
    `;
  }).join('');
}

// Helper: Format timeline dates (oswald.html style)
function formatTimelineDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;

  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const day = date.getDate();

  // If day is 1, assume it's just month/year
  if (day === 1) {
    return `${month} ${year}`;
  }

  return `${month} ${day}, ${year}`;
}
