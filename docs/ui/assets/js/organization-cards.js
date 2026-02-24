// organization-cards.js
// Card Population Functions for Organization Profile
// Primary Sources Project - 2026-02-24

// Helper: Format dates
function formatDate(dateStr) {
  if (!dateStr) return 'UNKNOWN';

  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatYear(dateStr) {
  if (!dateStr) return 'UNKNOWN';

  const date = new Date(dateStr);
  if (isNaN(date)) {
    if (dateStr.match(/^\d{4}$/)) return dateStr;
    return dateStr;
  }

  return date.getFullYear().toString();
}

// Populate Header
function populateHeader(data) {
  // Name
  const nameEl = document.getElementById('org-name');
  if (nameEl) nameEl.textContent = data.name || 'UNKNOWN';

  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.name || 'Organization';

  // Type Badge
  if (data.type) {
    const badgeWrapper = document.getElementById('org-type-badge-wrapper');
    const badge = document.getElementById('org-type-badge');
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

  // Founded
  if (data.founded_date) {
    const wrapper = document.getElementById('stat-founded-wrapper');
    const el = document.getElementById('stat-founded');
    if (wrapper && el) {
      el.textContent = formatYear(data.founded_date);
      wrapper.style.display = '';
    }
  }

  // Dissolved
  if (data.dissolved_date) {
    const wrapper = document.getElementById('stat-dissolved-wrapper');
    const el = document.getElementById('stat-dissolved');
    if (wrapper && el) {
      el.textContent = formatYear(data.dissolved_date);
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

  // Members count
  if (data.members) {
    const wrapper = document.getElementById('stat-members-wrapper');
    const el = document.getElementById('stat-members');
    if (wrapper && el) {
      el.textContent = data.members.length;
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

// Card 2: Members & Personnel
function populateMembers(members) {
  const list = document.getElementById('members-list');
  if (!list || !members || members.length === 0) return;

  list.innerHTML = members.map(member => {
    const name = member.name || 'Unknown';
    const role = member.role || '';
    const dates = member.dates || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">person</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${role ? `<p class="text-sm text-archive-secondary/80 mb-1">${role}</p>` : ''}
        ${dates ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${dates}</p>` : ''}
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

// Card 4: Related Organizations
function populateRelatedOrganizations(orgs) {
  const list = document.getElementById('related-orgs-list');
  if (!list || !orgs || orgs.length === 0) return;

  list.innerHTML = orgs.map(org => {
    const name = org.name || 'Unknown Organization';
    const relationship = org.relationship || '';
    const type = org.type || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">corporate_fare</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Type: ${type}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 5: Locations
function populateLocations(locations) {
  const list = document.getElementById('locations-list');
  if (!list || !locations || locations.length === 0) return;

  list.innerHTML = locations.map(location => {
    const name = location.name || 'Unknown Location';
    const address = location.address || '';
    const purpose = location.purpose || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">place</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${address ? `<p class="text-sm text-archive-secondary/80 mb-1">${address}</p>` : ''}
        ${purpose ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Purpose: ${purpose}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 6: Identifiers
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

// Card 7: Primary Sources
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
