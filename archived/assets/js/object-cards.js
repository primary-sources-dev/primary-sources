// object-cards.js
// Card Population Functions for Object Profile
// Primary Sources Project - 2026-02-24

// Helper: Format dates
function formatDate(dateStr) {
  if (!dateStr) return 'UNKNOWN';

  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Populate Header
function populateHeader(data) {
  // Name
  const nameEl = document.getElementById('object-name');
  if (nameEl) nameEl.textContent = data.name || 'UNKNOWN';

  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.name || 'Object';

  // Type Badge
  if (data.type) {
    const badgeWrapper = document.getElementById('object-type-badge-wrapper');
    const badge = document.getElementById('object-type-badge');
    if (badgeWrapper && badge) {
      badge.textContent = data.type;
      badgeWrapper.style.display = '';
    }
  }
}

// Populate Stats Dashboard
function populateStats(data) {
  // Type
  if (data.type) {
    const wrapper = document.getElementById('stat-type-wrapper');
    const el = document.getElementById('stat-type');
    if (wrapper && el) {
      el.textContent = data.type;
      wrapper.style.display = '';
    }
  }

  // Location
  if (data.location) {
    const wrapper = document.getElementById('stat-location-wrapper');
    const el = document.getElementById('stat-location');
    if (wrapper && el) {
      el.textContent = data.location;
      wrapper.style.display = '';
    }
  }

  // Date
  if (data.date) {
    const wrapper = document.getElementById('stat-date-wrapper');
    const el = document.getElementById('stat-date');
    if (wrapper && el) {
      el.textContent = formatDate(data.date);
      wrapper.style.display = '';
    }
  }

  // Condition
  if (data.condition) {
    const wrapper = document.getElementById('stat-condition-wrapper');
    const el = document.getElementById('stat-condition');
    if (wrapper && el) {
      el.textContent = data.condition;
      wrapper.style.display = '';
    }
  }

  // Owner
  if (data.owner) {
    const wrapper = document.getElementById('stat-owner-wrapper');
    const el = document.getElementById('stat-owner');
    if (wrapper && el) {
      el.textContent = data.owner;
      wrapper.style.display = '';
    }
  }

  // Sources count
  const sourcesEl = document.getElementById('stat-sources');
  if (sourcesEl) {
    const count = data.sources ? data.sources.length : 0;
    sourcesEl.textContent = count;
  }
}

// Card 1: Overview
function populateOverview(description) {
  const textEl = document.getElementById('overview-text');
  if (textEl) {
    textEl.textContent = description;
  }
}

// Card 2: Physical Properties
function populateProperties(properties) {
  const grid = document.getElementById('properties-grid');
  if (!grid || !properties) return;

  grid.innerHTML = Object.entries(properties).map(([key, value]) => {
    const label = key.replace(/_/g, ' ').toUpperCase();

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <p class="text-[10px] text-primary uppercase tracking-widest mb-2">${label}</p>
        <p class="text-sm text-archive-secondary/80">${value}</p>
      </div>
    `;
  }).join('');
}

// Card 3: Related Events
function populateEvents(events) {
  const list = document.getElementById('events-list');
  if (!list || !events || events.length === 0) return;

  list.innerHTML = events.map(event => {
    const title = event.title || 'Untitled Event';
    const date = formatDate(event.date || event.start_ts);
    const description = event.description || '';

    return `
      <div class="p-4 bg-archive-dark border-l-4 border-primary hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">event</span>
            <h4 class="text-base font-bold text-archive-heading uppercase">${title}</h4>
          </div>
          <span class="text-[10px] text-primary uppercase tracking-widest whitespace-nowrap">${date}</span>
        </div>
        ${description ? `<p class="text-xs text-archive-secondary/70 leading-relaxed">${description}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 4: Related People
function populatePeople(people) {
  const list = document.getElementById('people-list');
  if (!list || !people || people.length === 0) return;

  list.innerHTML = people.map(person => {
    const name = person.name || 'Unknown';
    const relationship = person.relationship || '';
    const dates = person.dates || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">person</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${dates ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${dates}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 5: Chain of Custody
function populateCustody(custodyChain) {
  const timeline = document.getElementById('custody-timeline');
  if (!timeline || !custodyChain || custodyChain.length === 0) return;

  // Sort by date
  const sortedChain = [...custodyChain].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  // Build timeline HTML
  let html = '<div class="relative border-l-2 border-primary/30 pl-6 space-y-6">';

  sortedChain.forEach((entry, index) => {
    const isLast = index === sortedChain.length - 1;
    const date = formatDate(entry.date);
    const custodian = entry.custodian || 'Unknown';
    const action = entry.action || '';
    const location = entry.location || '';

    html += `
      <div class="relative">
        <div class="absolute -left-[29px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-archive-bg"></div>
        <div class="pb-6 ${!isLast ? 'border-b border-archive-secondary/10' : ''}">
          <p class="text-[10px] text-primary uppercase tracking-widest mb-1">${date}</p>
          <h3 class="text-lg font-bold text-archive-heading mb-2 uppercase font-display">${custodian}</h3>
          ${action ? `<p class="text-sm text-archive-secondary/80 mb-1">${action}</p>` : ''}
          ${location ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Location: ${location}</p>` : ''}
        </div>
      </div>
    `;
  });

  html += '</div>';
  timeline.innerHTML = html;
}

// Card 6: Related Objects
function populateRelatedObjects(objects) {
  const list = document.getElementById('related-objects-list');
  if (!list || !objects || objects.length === 0) return;

  list.innerHTML = objects.map(obj => {
    const name = obj.name || 'Unknown Object';
    const relationship = obj.relationship || '';
    const type = obj.type || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">inventory_2</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Type: ${type}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 7: Identifiers
function populateIdentifiers(identifiers) {
  const list = document.getElementById('identifiers-list');
  if (!list || !identifiers || identifiers.length === 0) return;

  list.innerHTML = identifiers.map(identifier => {
    const type = identifier.type || 'UNKNOWN';
    const value = identifier.value || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">badge</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${type}</h4>
        </div>
        <p class="text-sm text-archive-secondary/80 font-mono">${value}</p>
      </div>
    `;
  }).join('');
}

// Card 8: Primary Sources
function populateSources(sources) {
  const list = document.getElementById('sources-list');
  if (!list || !sources || sources.length === 0) return;

  list.innerHTML = sources.map(source => {
    const title = source.title || 'Untitled Source';
    const type = source.type || '';
    const year = source.year || '';
    const author = source.author || '';

    return `
      <div class="p-4 bg-archive-dark border-l-4 border-primary hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">description</span>
            <h4 class="text-base font-bold text-archive-heading uppercase">${title}</h4>
          </div>
          ${year ? `<span class="text-[10px] text-primary uppercase tracking-widest whitespace-nowrap">${year}</span>` : ''}
        </div>
        <div class="flex flex-wrap gap-3 text-[10px] text-archive-secondary/60 uppercase tracking-widest">
          ${type ? `<span>Type: ${type}</span>` : ''}
          ${author ? `<span>• Author: ${author}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}
