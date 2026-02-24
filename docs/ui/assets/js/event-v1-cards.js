// event-v1-cards.js
// Card Population Functions for Event Profile V1
// Archival aesthetic with visual design from oswald.html
// Primary Sources Project - 2026-02-24

// Card 1: Context & Background
function populateContext(context) {
  const textEl = document.getElementById('context-text');
  if (!textEl || !context) return;

  textEl.textContent = context;
}

// Card 2: Timeline/Sub-events (Visual Timeline with dots)
function populateTimeline(subEvents) {
  const timeline = document.getElementById('timeline-list');
  if (!timeline || !subEvents || subEvents.length === 0) return;

  const sortedEvents = [...subEvents].sort((a, b) => {
    const dateA = new Date(a.start_ts || a.date);
    const dateB = new Date(b.start_ts || b.date);
    return dateA - dateB;
  });

  let html = '<div class="flex flex-col gap-0">';

  sortedEvents.forEach((event, index) => {
    const isLast = index === sortedEvents.length - 1;
    const date = formatTimelineDate(event.start_ts || event.date || event.label);
    const title = event.title || 'Untitled Event';
    const description = event.description || '';
    const icon = event.icon || 'event';
    const url = event.url || '';

    html += `
      <div class="flex gap-4 items-start group">
        <div class="flex flex-col items-center">
          <div class="w-2 h-2 ${isLast ? 'border border-primary' : 'bg-primary'} mt-1 flex-shrink-0"></div>
          ${!isLast ? '<div class="w-px bg-archive-secondary/20 flex-1 min-h-[2rem]"></div>' : ''}
        </div>
        <div class="pb-4 flex-1">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-primary text-base mt-0.5">${icon}</span>
            <div class="flex-1">
              <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">${date}</p>
              <p class="text-xs font-bold text-archive-heading uppercase tracking-wider mb-1">${title}</p>
              ${description ? `<p class="text-[10px] text-archive-secondary/70 leading-relaxed">${description}</p>` : ''}
              ${url ? `<a href="${url}" class="inline-flex items-center gap-1 text-[9px] text-primary hover:underline uppercase tracking-widest mt-2"><span class="material-symbols-outlined text-xs">description</span>View Document</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  timeline.innerHTML = html;
}

// Card 3: Participants
function populateParticipants(participants) {
  const list = document.getElementById('participants-list');
  if (!list || !participants || participants.length === 0) return;

  list.innerHTML = participants.map(person => {
    const name = person.name || 'UNKNOWN';
    const role = person.role || '';
    const description = person.description || '';

    // Icon based on role
    let icon = 'person';
    if (role.toLowerCase().includes('agent') || role.toLowerCase().includes('fbi')) {
      icon = 'badge';
    } else if (role.toLowerCase().includes('witness')) {
      icon = 'visibility';
    } else if (role.toLowerCase().includes('suspect')) {
      icon = 'person_search';
    }

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors group">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">${icon}</span>
          <div>
            <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${name}</p>
            ${role ? `<p class="text-[10px] text-primary uppercase tracking-widest mt-0.5">${role}</p>` : ''}
            ${description ? `<p class="text-[10px] text-archive-secondary/60 mt-1">${description}</p>` : ''}
          </div>
        </div>
        <span class="material-symbols-outlined text-archive-secondary/40 text-base">chevron_right</span>
      </div>
    `;
  }).join('');
}

// Card 4: Material Evidence
function populateEvidence(evidence) {
  const list = document.getElementById('evidence-list');
  if (!list || !evidence || evidence.length === 0) return;

  list.innerHTML = evidence.map(item => {
    const name = item.name || 'UNKNOWN';
    const type = item.type || '';
    const description = item.description || '';
    const location = item.location || '';

    // Icon based on type
    let icon = 'inventory_2';
    if (type.toLowerCase().includes('weapon')) icon = 'gavel';
    else if (type.toLowerCase().includes('document')) icon = 'description';
    else if (type.toLowerCase().includes('photo')) icon = 'image';
    else if (type.toLowerCase().includes('vehicle')) icon = 'directions_car';

    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary text-base mt-0.5">${icon}</span>
          <div class="flex-1">
            <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${name}</p>
            ${type ? `<p class="text-[10px] text-primary uppercase tracking-widest mb-1">${type}</p>` : ''}
            ${description ? `<p class="text-[10px] text-archive-secondary/70 leading-relaxed">${description}</p>` : ''}
            ${location ? `<p class="text-[9px] text-archive-secondary/50 mt-1 uppercase tracking-wider"><span class="material-symbols-outlined text-xs align-middle">place</span> ${location}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Card 5: Primary Sources (oswald.html style)
function populateSources(sources) {
  const list = document.getElementById('sources-list');
  if (!list || !sources || sources.length === 0) return;

  list.innerHTML = sources.map(source => {
    const title = source.title || 'Untitled Source';
    const type = source.type || 'DOCUMENT';
    const date = source.date || source.year || '';
    const author = source.author || '';
    const archive = source.archive || '';
    const url = source.url || '';

    const metaLine = [type, date].filter(Boolean).join(' · ');
    const detailLine = [author, archive].filter(Boolean).join(' — ');

    return `
      <a href="${url || '#'}" class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div>
          ${metaLine ? `<p class="text-[10px] text-primary uppercase tracking-widest font-bold mb-0.5">${metaLine}</p>` : ''}
          <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${title}</p>
          ${detailLine ? `<p class="text-[10px] text-archive-secondary/60 mt-1">${detailLine}</p>` : ''}
        </div>
        <span class="material-symbols-outlined text-archive-secondary/40 text-base">description</span>
      </a>
    `;
  }).join('');
}

// Card 6: Locations
function populateLocations(locations) {
  const list = document.getElementById('locations-list');
  if (!list || !locations || locations.length === 0) return;

  list.innerHTML = locations.map(loc => {
    const name = loc.name || loc.place || 'UNKNOWN';
    const address = loc.address || '';
    const description = loc.description || '';
    const significance = loc.significance || '';

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-base">place</span>
          <div>
            <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${name}</p>
            ${address ? `<p class="text-[10px] text-archive-secondary/60 mt-0.5">${address}</p>` : ''}
            ${description ? `<p class="text-[10px] text-archive-secondary/70 mt-1">${description}</p>` : ''}
            ${significance ? `<p class="text-[9px] text-primary/70 mt-1 italic">${significance}</p>` : ''}
          </div>
        </div>
        <span class="material-symbols-outlined text-archive-secondary/40 text-base">chevron_right</span>
      </div>
    `;
  }).join('');
}

// Card 7: Related Events
function populateRelatedEvents(events) {
  const list = document.getElementById('related-events-list');
  if (!list || !events || events.length === 0) return;

  list.innerHTML = events.map(event => {
    const title = event.title || 'Untitled Event';
    const date = formatTimelineDate(event.date || event.start_ts);
    const description = event.description || '';
    const type = event.event_type || '';
    const relation = event.relation || '';

    return `
      <div class="flex items-center justify-between border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div>
          <div class="flex items-center gap-2 mb-1">
            ${date ? `<p class="text-[10px] text-primary uppercase tracking-widest font-bold">${date}</p>` : ''}
            ${relation ? `<span class="text-[9px] px-2 py-0.5 bg-primary/20 text-primary uppercase tracking-wider">${relation}</span>` : ''}
          </div>
          <p class="text-xs font-bold text-archive-heading uppercase tracking-wider">${title}</p>
          ${description ? `<p class="text-[10px] text-archive-secondary/60 mt-1">${description}</p>` : ''}
        </div>
        <span class="material-symbols-outlined text-archive-secondary/40 text-base">chevron_right</span>
      </div>
    `;
  }).join('');
}

// Card 8: Assertions & Analysis
function populateAssertions(assertions) {
  const list = document.getElementById('assertions-list');
  if (!list || !assertions || assertions.length === 0) return;

  list.innerHTML = assertions.map(assertion => {
    const claim = assertion.claim || '';
    const source = assertion.source || '';
    const confidence = assertion.confidence || 'UNKNOWN';
    const analysis = assertion.analysis || '';

    // Confidence badge color
    let confidenceBg = 'bg-archive-secondary/10';
    let confidenceText = 'text-archive-secondary/60';
    if (confidence === 'CONFIRMED' || confidence === 'SUPPORTED') {
      confidenceBg = 'bg-primary/20';
      confidenceText = 'text-primary';
    } else if (confidence === 'DISPUTED' || confidence === 'UNLIKELY') {
      confidenceBg = 'bg-red-500/20';
      confidenceText = 'text-red-400';
    }

    return `
      <div class="border border-archive-secondary/20 bg-[#252021]/60 px-4 py-3 hover:border-primary transition-colors">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary text-base mt-0.5">fact_check</span>
          <div class="flex-1">
            <p class="text-xs text-archive-heading mb-2 leading-relaxed">${claim}</p>
            ${analysis ? `<p class="text-[10px] text-archive-secondary/70 mb-2 leading-relaxed italic">${analysis}</p>` : ''}
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

// Card 9: Photos & Media
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

  // If it's already a formatted label, return as-is
  if (dateStr.includes('·') || dateStr.includes(',')) {
    return dateStr;
  }

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
