// person-profile.js
// Component Card Library System for Person Profiles
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

  // 2. Populate header (always)
  populateHeader(personData);

  // 3. Populate stats dashboard (always)
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
  if (content) content.style.display = '';
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
