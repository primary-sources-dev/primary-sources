// person-cards.js
// Card Population Functions for Person Profile
// Primary Sources Project - 2026-02-23

// Helper: Format dates
function formatDate(dateStr) {
  if (!dateStr) return 'UNKNOWN';

  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr; // Return as-is if not valid date

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatDateShort(dateStr) {
  if (!dateStr) return 'UNKNOWN';

  const date = new Date(dateStr);
  if (isNaN(date)) {
    // Try to extract year if format is just "YYYY"
    if (dateStr.match(/^\d{4}$/)) return dateStr;
    return dateStr;
  }

  return date.getFullYear().toString();
}

// Helper: Calculate age
function calculateAge(birthDate, deathDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();

  if (isNaN(birth) || isNaN(end)) return null;

  const ageYears = Math.floor((end - birth) / (365.25 * 24 * 60 * 60 * 1000));
  return ageYears;
}

// Populate Header
function populateHeader(data) {
  // Name
  const nameEl = document.getElementById('person-name');
  if (nameEl) nameEl.textContent = data.display_name || 'UNKNOWN';

  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.display_name || 'Person';

  // Portrait (if available)
  if (data.portrait_url) {
    const portraitDiv = document.getElementById('person-portrait');
    const portraitImg = document.getElementById('person-portrait-img');
    if (portraitDiv && portraitImg) {
      portraitImg.src = data.portrait_url;
      portraitImg.alt = `Portrait of ${data.display_name}`;
      portraitDiv.style.display = '';
    }
  }

  // Label (if available)
  if (data.label) {
    const labelEl = document.getElementById('person-label');
    if (labelEl) {
      labelEl.textContent = data.label;
      labelEl.style.display = '';
    }
  }

  // Dates
  const datesEl = document.getElementById('person-dates');
  if (datesEl) {
    const birthYear = data.birth_date ? formatDateShort(data.birth_date) : 'UNKNOWN';
    const deathYear = data.death_date ? formatDateShort(data.death_date) : null;

    if (deathYear) {
      datesEl.textContent = `${birthYear} – ${deathYear}`;
    } else {
      datesEl.textContent = `Born ${birthYear}`;
    }
  }

  // Aliases (show up to 2 in header)
  if (data.aliases && data.aliases.length > 0) {
    const aliasesDiv = document.getElementById('person-aliases');
    const aliasesList = document.getElementById('person-aliases-list');

    if (aliasesDiv && aliasesList) {
      const displayAliases = data.aliases.slice(0, 2);
      aliasesList.innerHTML = displayAliases.map(alias => {
        const aliasName = alias.alias_name || alias;
        return `<span class="text-[9px] px-2 py-1 bg-archive-secondary/10 text-archive-secondary/70 border border-archive-secondary/20 uppercase tracking-wider">${aliasName}</span>`;
      }).join('');
      aliasesDiv.style.display = '';
    }
  }
}

// Populate Stats Dashboard
function populateStats(data) {
  // Born
  const bornEl = document.getElementById('stat-born');
  if (bornEl) {
    if (data.birth_date) {
      const date = new Date(data.birth_date);
      if (!isNaN(date)) {
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        bornEl.innerHTML = `${month}<br>${year}`;
      } else {
        bornEl.textContent = data.birth_date;
      }
    } else {
      bornEl.textContent = 'UNKNOWN';
    }
  }

  // Died
  if (data.death_date) {
    const diedCard = document.getElementById('stat-died-card');
    const diedEl = document.getElementById('stat-died');
    if (diedCard && diedEl) {
      const date = new Date(data.death_date);
      if (!isNaN(date)) {
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        diedEl.innerHTML = `${month}<br>${year}`;
      } else {
        diedEl.textContent = data.death_date;
      }
      diedCard.style.display = '';
    }
  }

  // Age
  const age = calculateAge(data.birth_date, data.death_date);
  if (age !== null) {
    const ageCard = document.getElementById('stat-age-card');
    const ageEl = document.getElementById('stat-age');
    if (ageCard && ageEl) {
      ageEl.innerHTML = `${age}<br><span class="text-xs">years</span>`;
      ageCard.style.display = '';
    }
  }

  // Sources
  const sourcesEl = document.getElementById('stat-sources');
  if (sourcesEl) {
    const count = data.sources ? data.sources.length : 0;
    sourcesEl.innerHTML = `${count}<br><span class="text-xs">docs</span>`;
  }
}

// Card 1: Biography
function populateBiography(notes) {
  const textEl = document.getElementById('biography-text');
  if (textEl) {
    textEl.textContent = notes;
  }
}

// Card 2: Chronology (Timeline)
function populateChronology(events) {
  const timeline = document.getElementById('chronology-timeline');
  if (!timeline || !events || events.length === 0) return;

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date || a.start_ts);
    const dateB = new Date(b.date || b.start_ts);
    return dateA - dateB;
  });

  // Build timeline HTML
  let html = '<div class="relative border-l-2 border-primary/30 pl-6 space-y-6">';

  sortedEvents.forEach((event, index) => {
    const isLast = index === sortedEvents.length - 1;
    const date = formatDate(event.date || event.start_ts);
    const title = event.title || 'Untitled Event';
    const description = event.description || '';

    html += `
      <div class="relative">
        <div class="absolute -left-[29px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-archive-bg"></div>
        <div class="pb-6 ${!isLast ? 'border-b border-archive-secondary/10' : ''}">
          <p class="text-[10px] text-primary uppercase tracking-widest mb-1">${date}</p>
          <h3 class="text-lg font-bold text-archive-heading mb-2 uppercase font-display">${title}</h3>
          ${description ? `<p class="text-xs text-archive-secondary/70 leading-relaxed">${description}</p>` : ''}
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
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">badge</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${aliasName}</h4>
        </div>
        <p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">Type: ${aliasType}</p>
      </div>
    `;
  }).join('');
}

// Card 4: Residences
function populateResidences(residences) {
  const list = document.getElementById('residences-list');
  if (!list || !residences || residences.length === 0) return;

  list.innerHTML = residences.map(residence => {
    const place = residence.place || 'Unknown Location';
    const address = residence.address || '';
    const dates = residence.dates || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">home</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${place}</h4>
        </div>
        ${address ? `<p class="text-sm text-archive-secondary/80 mb-1">${address}</p>` : ''}
        ${dates ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${dates}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 5: Organizations
function populateOrganizations(organizations) {
  const list = document.getElementById('organizations-list');
  if (!list || !organizations || organizations.length === 0) return;

  list.innerHTML = organizations.map(org => {
    const name = org.name || 'Unknown Organization';
    const dates = org.dates || '';
    const role = org.role || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">account_balance</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${role ? `<p class="text-sm text-archive-secondary/80 mb-1">${role}</p>` : ''}
        ${dates ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${dates}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 6: Family Relations
function populateFamily(family) {
  const list = document.getElementById('family-list');
  if (!list || !family || family.length === 0) return;

  list.innerHTML = family.map(member => {
    const name = member.name || 'Unknown';
    const relation = member.relation || '';
    const date = member.date || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">family_restroom</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${relation ? `<p class="text-sm text-archive-secondary/80 mb-1">${relation}</p>` : ''}
        ${date ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest">${date}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 7: Related Events
function populateEvents(events) {
  const list = document.getElementById('events-list');
  if (!list || !events || events.length === 0) return;

  list.innerHTML = events.map(event => {
    const title = event.title || 'Untitled Event';
    const date = formatDate(event.date || event.start_ts);
    const description = event.description || '';
    const type = event.event_type || event.type || '';

    return `
      <div class="p-4 bg-archive-dark border-l-4 border-primary hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">event</span>
            <h4 class="text-base font-bold text-archive-heading uppercase">${title}</h4>
          </div>
          <span class="text-[10px] text-primary uppercase tracking-widest whitespace-nowrap">${date}</span>
        </div>
        ${type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest mb-2">Type: ${type}</p>` : ''}
        ${description ? `<p class="text-xs text-archive-secondary/70 leading-relaxed">${description}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 8: Related Objects
function populateObjects(objects) {
  const list = document.getElementById('objects-list');
  if (!list || !objects || objects.length === 0) return;

  list.innerHTML = objects.map(obj => {
    const name = obj.name || 'Unknown Object';
    const type = obj.type || '';
    const description = obj.description || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">inventory_2</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${name}</h4>
        </div>
        ${type ? `<p class="text-[10px] text-archive-secondary/60 uppercase tracking-widest mb-2">Type: ${type}</p>` : ''}
        ${description ? `<p class="text-xs text-archive-secondary/70">${description}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Card 9: Primary Sources
function populateSources(sources) {
  const list = document.getElementById('sources-list');
  if (!list || !sources || sources.length === 0) return;

  list.innerHTML = sources.map(source => {
    const title = source.title || 'Untitled Source';
    const type = source.type || '';
    const year = source.year || '';
    const author = source.author || '';
    const archive = source.archive || '';

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
          ${archive ? `<span>• Archive: ${archive}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Card 10: External Identifiers
function populateIdentifiers(identifiers) {
  const list = document.getElementById('identifiers-list');
  if (!list || !identifiers || identifiers.length === 0) return;

  list.innerHTML = identifiers.map(identifier => {
    const type = identifier.type || 'UNKNOWN';
    const value = identifier.value || '';

    return `
      <div class="p-4 bg-archive-dark border border-archive-secondary/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">tag</span>
          <h4 class="text-base font-bold text-archive-heading uppercase">${type}</h4>
        </div>
        <p class="text-sm text-archive-secondary/80 font-mono">${value}</p>
      </div>
    `;
  }).join('');
}

// Card 11: Assertions
function populateAssertions(assertions) {
  const list = document.getElementById('assertions-list');
  if (!list || !assertions || assertions.length === 0) return;

  list.innerHTML = assertions.map(assertion => {
    const claim = assertion.claim || assertion.text || 'No claim text';
    const source = assertion.source || '';
    const confidence = assertion.confidence || '';

    return `
      <div class="p-4 bg-archive-dark border-l-4 border-primary hover:bg-archive-dark/80 transition-colors">
        <div class="flex items-start gap-3 mb-2">
          <span class="material-symbols-outlined text-primary">fact_check</span>
          <p class="text-sm text-archive-secondary/80 leading-relaxed flex-1">${claim}</p>
        </div>
        <div class="flex flex-wrap gap-3 text-[10px] text-archive-secondary/60 uppercase tracking-widest ml-8">
          ${source ? `<span>Source: ${source}</span>` : ''}
          ${confidence ? `<span>• Confidence: ${confidence}</span>` : ''}
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
    const url = item.url || item.file_url || '';
    const caption = item.caption || item.title || 'No caption';
    const type = item.type || 'IMAGE';

    if (type === 'IMAGE' || type === 'PHOTO') {
      return `
        <div class="relative group">
          <div class="aspect-square bg-archive-secondary/10 border border-archive-secondary/20 overflow-hidden">
            <img src="${url}" alt="${caption}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
          </div>
          <p class="mt-2 text-[10px] text-archive-secondary/60 uppercase tracking-wider text-center">${caption}</p>
        </div>
      `;
    } else {
      return `
        <div class="p-4 bg-archive-dark border border-archive-secondary/20 flex flex-col items-center justify-center gap-2">
          <span class="material-symbols-outlined text-primary text-3xl">insert_drive_file</span>
          <p class="text-[10px] text-archive-secondary/80 uppercase tracking-wider text-center">${caption}</p>
        </div>
      `;
    }
  }).join('');
}
