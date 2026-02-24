// place-cards.js
// Card Population Functions for Place Profile
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
  const nameEl = document.getElementById('place-name');
  if (nameEl) nameEl.textContent = data.name || 'UNKNOWN';

  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.name || 'Place';

  // Type Badge
  if (data.type) {
    const badgeWrapper = document.getElementById('place-type-badge-wrapper');
    const badge = document.getElementById('place-type-badge');
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

  // Address
  if (data.address) {
    const wrapper = document.getElementById('stat-address-wrapper');
    const el = document.getElementById('stat-address');
    if (wrapper && el) {
      el.textContent = data.address;
      wrapper.style.display = '';
    }
  }

  // City
  if (data.city) {
    const wrapper = document.getElementById('stat-city-wrapper');
    const el = document.getElementById('stat-city');
    if (wrapper && el) {
      el.textContent = data.city;
      wrapper.style.display = '';
    }
  }

  // State
  if (data.state) {
    const wrapper = document.getElementById('stat-state-wrapper');
    const el = document.getElementById('stat-state');
    if (wrapper && el) {
      el.textContent = data.state;
      wrapper.style.display = '';
    }
  }

  // Coordinates
  if (data.latitude && data.longitude) {
    const wrapper = document.getElementById('stat-coordinates-wrapper');
    const el = document.getElementById('stat-coordinates');
    if (wrapper && el) {
      el.textContent = `${data.latitude}, ${data.longitude}`;
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

// Card 2: Events at This Location
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

// Card 3: Location Hierarchy (Parent/Child)
function populateHierarchy(data) {
  // Parent location
  if (data.parent_place) {
    const wrapper = document.getElementById('parent-location-wrapper');
    const container = document.getElementById('parent-location');
    if (wrapper && container) {
      const parent = data.parent_place;
      container.innerHTML = `
        <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <span class="material-symbols-outlined text-primary">place</span>
            <h4 class="text-base font-bold text-archive-heading uppercase">${parent.name || 'Unknown'}</h4>
          </div>
          ${parent.type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Type: ${parent.type}</p>` : ''}
        </div>
      `;
      wrapper.style.display = '';
    }
  }

  // Child locations
  if (data.child_places && data.child_places.length > 0) {
    const wrapper = document.getElementById('child-locations-wrapper');
    const container = document.getElementById('child-locations');
    if (wrapper && container) {
      container.innerHTML = data.child_places.map(child => `
        <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <span class="material-symbols-outlined text-primary">place</span>
            <h4 class="text-base font-bold text-archive-heading uppercase">${child.name || 'Unknown'}</h4>
          </div>
          ${child.type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Type: ${child.type}</p>` : ''}
        </div>
      `).join('');
      wrapper.style.display = '';
    }
  }
}

// Card 4: Related Places
function populateRelatedPlaces(places) {
  const list = document.getElementById('related-places-list');
  if (!list || !places || places.length === 0) return;

  list.innerHTML = places.map(place => {
    const name = place.name || 'Unknown Place';
    const relationship = place.relationship || '';
    const distance = place.distance || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">pin_drop</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${distance ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Distance: ${distance}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 5: Notable Features
function populateFeatures(features) {
  const list = document.getElementById('features-list');
  if (!list || !features || features.length === 0) return;

  list.innerHTML = features.map(feature => {
    const name = feature.name || 'Unknown Feature';
    const description = feature.description || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">architecture</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${description ? `<p class="text-sm text-archive-secondary/80">${description}</p>` : ''}
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
