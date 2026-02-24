// person-v2-profile.js
// Component Card Library System for Person Profiles (V2 - Synthesized Design)
// Combines oswald.html aesthetic with person.html architecture
// Primary Sources Project - 2026-02-23

// Card Registry - Defines all possible cards and their behavior
const CARD_REGISTRY = {

  biography: {
    icon: 'article',
    title: 'Biographical Summary',
    dataField: 'notes',
    autoExpand: true,
    showWhen: (data) => data.notes !== null && data.notes !== '',
    populate: (data) => populateBiography(data.notes)
  },

  chronology: {
    icon: 'timeline',
    title: 'Chronology',
    dataField: 'events',
    autoExpand: (data) => data.events && data.events.length >= 3,
    showWhen: (data) => data.events && data.events.length > 0,
    populate: (data) => populateChronology(data.events)
  },

  aliases: {
    icon: 'badge',
    title: 'Known Aliases',
    dataField: 'aliases',
    autoExpand: false,
    showWhen: (data) => data.aliases && data.aliases.length > 0,
    populate: (data) => populateAliases(data.aliases)
  },

  residences: {
    icon: 'home',
    title: 'Residences',
    dataField: 'residences',
    autoExpand: false,
    showWhen: (data) => data.residences && data.residences.length > 0,
    populate: (data) => populateResidences(data.residences)
  },

  organizations: {
    icon: 'account_balance',
    title: 'Affiliated Organizations',
    dataField: 'organizations',
    autoExpand: false,
    showWhen: (data) => data.organizations && data.organizations.length > 0,
    populate: (data) => populateOrganizations(data.organizations)
  },

  family: {
    icon: 'family_restroom',
    title: 'Family Relations',
    dataField: 'family',
    autoExpand: false,
    showWhen: (data) => data.family && data.family.length > 0,
    populate: (data) => populateFamily(data.family)
  },

  events: {
    icon: 'event',
    title: 'Related Events',
    dataField: 'related_events',
    autoExpand: false,
    showWhen: (data) => data.related_events && data.related_events.length > 0,
    populate: (data) => populateEvents(data.related_events)
  },

  objects: {
    icon: 'inventory_2',
    title: 'Related Objects',
    dataField: 'objects',
    autoExpand: false,
    showWhen: (data) => data.objects && data.objects.length > 0,
    populate: (data) => populateObjects(data.objects)
  },

  sources: {
    icon: 'description',
    title: 'Primary Sources',
    dataField: 'sources',
    autoExpand: false,
    showWhen: (data) => data.sources && data.sources.length > 0,
    populate: (data) => populateSources(data.sources)
  },

  identifiers: {
    icon: 'tag',
    title: 'External Identifiers',
    dataField: 'identifiers',
    autoExpand: false,
    showWhen: (data) => data.identifiers && data.identifiers.length > 0,
    populate: (data) => populateIdentifiers(data.identifiers)
  },

  assertions: {
    icon: 'fact_check',
    title: 'Assertions',
    dataField: 'assertions',
    autoExpand: false,
    showWhen: (data) => data.assertions && data.assertions.length > 0,
    populate: (data) => populateAssertions(data.assertions)
  },

  media: {
    icon: 'image',
    title: 'Photos & Media',
    dataField: 'media',
    autoExpand: false,
    showWhen: (data) => data.media && data.media.length > 0,
    populate: (data) => populateMedia(data.media)
  }

};

// Main loading function
async function loadPersonProfile(personId) {

  // Show loading state
  showLoadingState();

  // 1. Fetch person data from API (or static JSON for now)
  let personData;
  try {
    // For now, use mock-person.json - will switch to /api/people/{personId} later
    const response = await fetch('assets/data/mock-person.json');
    const allPeople = await response.json();
    personData = allPeople.find(p => p.person_id === personId);

    if (!personData) {
      console.error(`Person not found: ${personId}`);
      showErrorState('Person not found');
      return null;
    }
  } catch (err) {
    console.error('Failed to load person:', err);
    showErrorState('Failed to load person data');
    return null;
  }

  // 2. Populate responsive header (desktop archive card + mobile hero)
  populateResponsiveHeader(personData);

  // 3. Populate stats dashboard
  populateStats(personData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(personData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge
      const countData = personData[card.dataField];
      const count = Array.isArray(countData) ? countData.length : 1;
      setCardCount(cardId, count);

      // Populate content
      card.populate(personData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(personData)
        : card.autoExpand === true;

      if (shouldExpand) {
        expandCard(cardId);
      }
    } else {
      // Hide card
      hideCard(cardId);
    }
  });

  // 5. Show empty state if minimal data
  if (visibleCardCount < 2) {
    showEmptyState();
  } else {
    hideEmptyState();
  }

  // Hide loading state
  hideLoadingState();
}

// Responsive header population (desktop archive card + mobile hero)
function populateResponsiveHeader(data) {
  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.display_name || 'Person';

  // Desktop Header (Archive Card Layout)
  const nameDesktop = document.getElementById('person-name-desktop');
  if (nameDesktop) nameDesktop.textContent = data.display_name || 'UNKNOWN';

  // Mobile Header (Hero Layout)
  const nameMobile = document.getElementById('person-name-mobile');
  if (nameMobile) nameMobile.textContent = data.display_name || 'UNKNOWN';

  // Portrait (both layouts)
  if (data.portrait_url) {
    // Desktop
    const portraitImgDesktop = document.getElementById('person-portrait-img-desktop');
    if (portraitImgDesktop) {
      portraitImgDesktop.src = data.portrait_url;
      portraitImgDesktop.alt = `Portrait of ${data.display_name}`;
      portraitImgDesktop.classList.remove('hidden');
    }

    // Mobile
    const portraitDivMobile = document.getElementById('person-portrait-mobile');
    const portraitImgMobile = document.getElementById('person-portrait-img-mobile');
    if (portraitDivMobile && portraitImgMobile) {
      portraitImgMobile.src = data.portrait_url;
      portraitImgMobile.alt = `Portrait of ${data.display_name}`;
      portraitDivMobile.style.display = '';
    }
  }

  // Label (mobile only)
  if (data.label) {
    const labelMobile = document.getElementById('person-label-mobile');
    if (labelMobile) {
      labelMobile.textContent = data.label;
      labelMobile.style.display = '';
    }
  }

  // Dates (mobile only)
  const datesMobile = document.getElementById('person-dates-mobile');
  if (datesMobile) {
    const birthYear = data.birth_date ? formatDateShort(data.birth_date) : 'UNKNOWN';
    const deathYear = data.death_date ? formatDateShort(data.death_date) : null;

    if (deathYear) {
      datesMobile.textContent = `${birthYear} – ${deathYear}`;
    } else {
      datesMobile.textContent = `Born ${birthYear}`;
    }
  }

  // Aliases (both layouts)
  if (data.aliases && data.aliases.length > 0) {
    // Desktop
    const aliasesDesktop = document.getElementById('person-aliases-desktop');
    if (aliasesDesktop) {
      const displayAliases = data.aliases.slice(0, 2);
      aliasesDesktop.innerHTML = displayAliases.map(alias => {
        const aliasName = alias.alias_name || alias;
        const isPrimary = alias.alias_type === 'PRIMARY';
        const borderClass = isPrimary ? 'border-primary/40 text-primary' : 'border-archive-secondary/20 text-archive-secondary';
        return `<span class="text-[10px] border ${borderClass} px-2 py-1 uppercase tracking-widest">${aliasName}</span>`;
      }).join('');
      aliasesDesktop.style.display = '';
    }

    // Mobile
    const aliasesDivMobile = document.getElementById('person-aliases-mobile');
    const aliasesListMobile = document.getElementById('person-aliases-list-mobile');
    if (aliasesDivMobile && aliasesListMobile) {
      const displayAliases = data.aliases.slice(0, 2);
      aliasesListMobile.innerHTML = displayAliases.map(alias => {
        const aliasName = alias.alias_name || alias;
        return `<span class="text-[9px] px-2 py-1 bg-archive-secondary/10 text-archive-secondary/70 border border-archive-secondary/20 uppercase tracking-wider">${aliasName}</span>`;
      }).join('');
      aliasesDivMobile.style.display = '';
    }
  }

  // Desktop 6-stat grid
  const bornDesktop = document.getElementById('stat-born-desktop');
  if (bornDesktop) bornDesktop.textContent = data.birth_date ? formatDate(data.birth_date) : 'UNKNOWN';

  if (data.death_date) {
    const diedWrapper = document.getElementById('stat-died-desktop-wrapper');
    const diedDesktop = document.getElementById('stat-died-desktop');
    if (diedWrapper && diedDesktop) {
      diedDesktop.textContent = formatDate(data.death_date);
      diedWrapper.style.display = '';
    }
  }

  // Place (from first residence or birth location)
  const firstResidence = data.residences && data.residences[0];
  if (firstResidence) {
    const placeWrapper = document.getElementById('stat-place-desktop-wrapper');
    const placeDesktop = document.getElementById('stat-place-desktop');
    if (placeWrapper && placeDesktop) {
      placeDesktop.textContent = firstResidence.place || 'UNKNOWN';
      placeWrapper.style.display = '';
    }
  }

  // Age
  const age = calculateAge(data.birth_date, data.death_date);
  if (age !== null) {
    const ageWrapper = document.getElementById('stat-age-desktop-wrapper');
    const ageDesktop = document.getElementById('stat-age-desktop');
    if (ageWrapper && ageDesktop) {
      ageDesktop.textContent = age;
      ageWrapper.style.display = '';
    }
  }

  // Label (desktop)
  if (data.label) {
    const labelWrapper = document.getElementById('stat-label-desktop-wrapper');
    const labelDesktop = document.getElementById('stat-label-desktop');
    if (labelWrapper && labelDesktop) {
      labelDesktop.textContent = data.label;
      labelWrapper.style.display = '';
    }
  }

  // Sources count
  const sourcesDesktop = document.getElementById('stat-sources-desktop');
  if (sourcesDesktop) {
    sourcesDesktop.textContent = data.sources ? data.sources.length : 0;
  }
}

// Populate stats dashboard (mobile only)
function populateStats(data) {
  // Born
  const bornMobile = document.getElementById('stat-born-mobile');
  if (bornMobile) {
    bornMobile.textContent = data.birth_date ? formatDateShort(data.birth_date) : 'UNKNOWN';
  }

  // Died
  if (data.death_date) {
    const diedCard = document.getElementById('stat-died-mobile-card');
    const diedMobile = document.getElementById('stat-died-mobile');
    if (diedCard && diedMobile) {
      diedMobile.textContent = formatDateShort(data.death_date);
      diedCard.style.display = '';
    }
  }

  // Age
  const age = calculateAge(data.birth_date, data.death_date);
  if (age !== null) {
    const ageCard = document.getElementById('stat-age-mobile-card');
    const ageMobile = document.getElementById('stat-age-mobile');
    if (ageCard && ageMobile) {
      ageMobile.textContent = age;
      ageCard.style.display = '';
    }
  }

  // Sources count
  const sourcesMobile = document.getElementById('stat-sources-mobile');
  if (sourcesMobile) {
    sourcesMobile.textContent = data.sources ? data.sources.length : 0;
  }
}

// Helper functions
function showCard(cardId) {
  const section = document.getElementById(`${cardId}-section`);
  if (section) section.style.display = '';
}

function hideCard(cardId) {
  const section = document.getElementById(`${cardId}-section`);
  if (section) section.style.display = 'none';
}

function expandCard(cardId) {
  const content = document.getElementById(`${cardId}-content`);
  const chevron = document.getElementById(`${cardId}-chevron`);
  if (content) content.style.display = 'block';
  if (chevron) chevron.style.transform = 'rotate(180deg)';
}

function collapseCard(cardId) {
  const content = document.getElementById(`${cardId}-content`);
  const chevron = document.getElementById(`${cardId}-chevron`);
  if (content) content.style.display = 'none';
  if (chevron) chevron.style.transform = '';
}

function toggleCard(cardId) {
  const content = document.getElementById(`${cardId}-content`);
  const chevron = document.getElementById(`${cardId}-chevron`);

  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    content.style.display = 'none';
    chevron.style.transform = '';
  }
}

function setCardCount(cardId, count) {
  const badge = document.getElementById(`${cardId}-count`);
  if (badge) badge.textContent = `(${count})`;
}

function showEmptyState() {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.style.display = '';
}

function hideEmptyState() {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.style.display = 'none';
}

function showLoadingState() {
  // Could add skeleton loaders here
  console.log('Loading person profile...');
}

function hideLoadingState() {
  console.log('Person profile loaded');
}

function showErrorState(message) {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
        <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
        <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
        <a href="people.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back to People
        </a>
      </div>
    `;
    emptyState.style.display = '';
  }
}

// Helper: Format dates
function formatDate(dateStr) {
  if (!dateStr) return 'UNKNOWN';

  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get person ID from URL parameter (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  if (personId) {
    loadPersonProfile(personId);
  } else {
    showErrorState('No person ID provided');
  }
});
