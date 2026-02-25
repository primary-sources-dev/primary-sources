// place-profile.js
// Component Card Library System for Place Profiles
// Primary Sources Project - 2026-02-24

// Card Registry - Defines all possible cards and their behavior
const CARD_REGISTRY = {

  overview: {
    icon: 'info',
    title: 'Overview',
    dataField: 'description',
    autoExpand: true,
    showWhen: (data) => data.description !== null && data.description !== '',
    populate: (data) => populateOverview(data.description)
  },

  events: {
    icon: 'event',
    title: 'Events at This Location',
    dataField: 'events',
    autoExpand: false,
    showWhen: (data) => data.events && data.events.length > 0,
    populate: (data) => populateEvents(data.events)
  },

  hierarchy: {
    icon: 'account_tree',
    title: 'Location Hierarchy',
    dataField: 'hierarchy',
    autoExpand: false,
    showWhen: (data) => (data.parent_place || (data.child_places && data.child_places.length > 0)),
    populate: (data) => populateHierarchy(data)
  },

  'related-places': {
    icon: 'pin_drop',
    title: 'Related Places',
    dataField: 'related_places',
    autoExpand: false,
    showWhen: (data) => data.related_places && data.related_places.length > 0,
    populate: (data) => populateRelatedPlaces(data.related_places)
  },

  features: {
    icon: 'architecture',
    title: 'Notable Features',
    dataField: 'features',
    autoExpand: false,
    showWhen: (data) => data.features && data.features.length > 0,
    populate: (data) => populateFeatures(data.features)
  },

  identifiers: {
    icon: 'badge',
    title: 'Identifiers',
    dataField: 'identifiers',
    autoExpand: false,
    showWhen: (data) => data.identifiers && data.identifiers.length > 0,
    populate: (data) => populateIdentifiers(data.identifiers)
  },

  sources: {
    icon: 'description',
    title: 'Primary Sources',
    dataField: 'sources',
    autoExpand: false,
    showWhen: (data) => data.sources && data.sources.length > 0,
    populate: (data) => populateSources(data.sources)
  }

};

// Main loading function
async function loadPlaceProfile(placeId) {

  // Show loading state
  showLoadingState();

  // 1. Fetch place data from API (or static JSON for now)
  let placeData;
  try {
    // For now, use places.json - will switch to /api/places/{placeId} later
    const response = await fetch('/docs/ui/assets/data/places.json');
    const allPlaces = await response.json();
    placeData = allPlaces.find(p => p.place_id === placeId || p.id === placeId);

    if (!placeData) {
      console.error(`Place not found: ${placeId}`);
      showErrorState('Place not found');
      return null;
    }
  } catch (err) {
    console.error('Failed to load place:', err);
    showErrorState('Failed to load place data');
    return null;
  }

  // 2. Populate header (always)
  populateHeader(placeData);

  // 3. Populate stats dashboard (always)
  populateStats(placeData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(placeData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge (only for array data)
      const countData = placeData[card.dataField];
      if (Array.isArray(countData)) {
        setCardCount(cardId, countData.length);
      }

      // Populate content
      card.populate(placeData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(placeData)
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
  console.log('Loading place profile...');
}

function hideLoadingState() {
  console.log('Place profile loaded');
}

function showErrorState(message) {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
        <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
        <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
        <a href="/docs/ui/browse/places.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back to Places
        </a>
      </div>
    `;
    emptyState.style.display = '';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get place ID from URL parameter (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const placeId = urlParams.get('id');

  if (placeId) {
    loadPlaceProfile(placeId);
  } else {
    showErrorState('No place ID provided');
  }
});

