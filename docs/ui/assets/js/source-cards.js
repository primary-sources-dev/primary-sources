// source-cards.js
// Card Population Functions for Source Profile
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
  // Title
  const titleEl = document.getElementById('source-title');
  if (titleEl) titleEl.textContent = data.title || 'UNKNOWN';

  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.title || 'Source';

  // Type Badge
  if (data.type) {
    const badgeWrapper = document.getElementById('source-type-badge-wrapper');
    const badge = document.getElementById('source-type-badge');
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

  // Date
  if (data.date) {
    const wrapper = document.getElementById('stat-date-wrapper');
    const el = document.getElementById('stat-date');
    if (wrapper && el) {
      el.textContent = formatDate(data.date);
      wrapper.style.display = '';
    }
  }

  // Author
  if (data.author) {
    const wrapper = document.getElementById('stat-author-wrapper');
    const el = document.getElementById('stat-author');
    if (wrapper && el) {
      el.textContent = data.author;
      wrapper.style.display = '';
    }
  }

  // Classification
  if (data.classification) {
    const wrapper = document.getElementById('stat-classification-wrapper');
    const el = document.getElementById('stat-classification');
    if (wrapper && el) {
      el.textContent = data.classification;
      wrapper.style.display = '';
    }
  }

  // Pages
  if (data.pages) {
    const wrapper = document.getElementById('stat-pages-wrapper');
    const el = document.getElementById('stat-pages');
    if (wrapper && el) {
      el.textContent = data.pages;
      wrapper.style.display = '';
    }
  }

  // Repository
  if (data.repository) {
    const wrapper = document.getElementById('stat-repository-wrapper');
    const el = document.getElementById('stat-repository');
    if (wrapper && el) {
      el.textContent = data.repository;
      wrapper.style.display = '';
    }
  }
}

// Card 1: Overview
function populateOverview(description) {
  const textEl = document.getElementById('overview-text');
  if (textEl) {
    textEl.textContent = description;
  }
}

// Card 2: Content Summary
function populateContentSummary(summary) {
  const textEl = document.getElementById('content-text');
  if (textEl) {
    textEl.innerHTML = `<p class="text-sm text-archive-secondary/80 leading-relaxed">${summary}</p>`;
  }
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
    const role = person.role || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">person</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${role ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${role}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 5: Related Organizations
function populateOrganizations(orgs) {
  const list = document.getElementById('organizations-list');
  if (!list || !orgs || orgs.length === 0) return;

  list.innerHTML = orgs.map(org => {
    const name = org.name || 'Unknown Organization';
    const relationship = org.relationship || '';
    const role = org.role || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">corporate_fare</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${role ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${role}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 5.5: Related Places (NEW)
function populatePlaces(places) {
  const list = document.getElementById('places-list');
  if (!list || !places || places.length === 0) return;

  list.innerHTML = places.map(place => {
    const name = place.name || 'Unknown Place';
    const relevance = place.relevance || '';
    const mentions = place.mentions || 0;

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">place</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relevance ? `<p class="text-sm text-archive-secondary/80 mb-1">${relevance}</p>` : ''}
        ${mentions ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${mentions} Mentions in Document</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 6: Citations
function populateCitations(data) {
  const list = document.getElementById('citations-list');
  if (!list) return;

  const title = data.title || 'Untitled Source';
  const author = data.author || 'Unknown Author';
  const year = data.date ? formatYear(data.date) : 'n.d.';
  const repository = data.repository || 'Archive';

  // Generate multiple citation formats
  const citations = [
    {
      format: 'APA',
      citation: `${author}. (${year}). ${title}. ${repository}.`
    },
    {
      format: 'Chicago',
      citation: `${author}. "${title}." ${repository}, ${year}.`
    },
    {
      format: 'MLA',
      citation: `${author}. "${title}." ${repository}, ${year}.`
    }
  ];

  list.innerHTML = citations.map(cite => `
    <div class="p-4 bg-archive-dark border border-archive-secondary/20">
      <p class="text-[10px] text-primary uppercase tracking-widest mb-2">${cite.format} Format</p>
      <p class="text-sm text-archive-secondary/80 leading-relaxed">${cite.citation}</p>
      <button onclick="navigator.clipboard.writeText('${cite.citation.replace(/'/g, "\\'")}'); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 2000)"
        class="mt-2 text-[10px] text-primary hover:text-archive-heading uppercase tracking-widest">Copy</button>
    </div>
  `).join('');
}

// Card 7: Authenticity & Provenance
function populateProvenance(provenance) {
  const details = document.getElementById('provenance-details');
  if (!details || !provenance) return;

  details.innerHTML = Object.entries(provenance).map(([key, value]) => {
    const label = key.replace(/_/g, ' ').toUpperCase();

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <p class="text-[10px] text-primary uppercase tracking-widest mb-2">${label}</p>
        <p class="text-sm text-archive-secondary/80 leading-relaxed">${value}</p>
      </div>
    `;
  }).join('');
}

// Card 8: Related Sources
function populateRelatedSources(sources) {
  const list = document.getElementById('related-sources-list');
  if (!list || !sources || sources.length === 0) return;

  list.innerHTML = sources.map(source => {
    const title = source.title || 'Untitled Source';
    const relationship = source.relationship || '';
    const type = source.type || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20 hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">description</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${title}</h4>
        </div>
        ${relationship ? `<p class="text-sm text-archive-secondary/80 mb-1">${relationship}</p>` : ''}
        ${type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Type: ${type}</p>` : ''}
      </div>
    `;
  }).join('');
}
