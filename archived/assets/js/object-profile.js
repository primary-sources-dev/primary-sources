// object-profile.js
// Component Card Library System for Object Profiles
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

  properties: {
    icon: 'straighten',
    title: 'Physical Properties',
    dataField: 'properties',
    autoExpand: false,
    showWhen: (data) => data.properties && Object.keys(data.properties).length > 0,
    populate: (data) => populateProperties(data.properties)
  },

  events: {
    icon: 'event',
    title: 'Related Events',
    dataField: 'events',
    autoExpand: false,
    showWhen: (data) => data.events && data.events.length > 0,
    populate: (data) => populateEvents(data.events)
  },

  people: {
    icon: 'person',
    title: 'Related People',
    dataField: 'people',
    autoExpand: false,
    showWhen: (data) => data.people && data.people.length > 0,
    populate: (data) => populatePeople(data.people)
  },

  custody: {
    icon: 'receipt_long',
    title: 'Chain of Custody',
    dataField: 'custody_chain',
    autoExpand: false,
    showWhen: (data) => data.custody_chain && data.custody_chain.length > 0,
    populate: (data) => populateCustody(data.custody_chain)
  },

  'related-objects': {
    icon: 'category',
    title: 'Related Objects',
    dataField: 'related_objects',
    autoExpand: false,
    showWhen: (data) => data.related_objects && data.related_objects.length > 0,
    populate: (data) => populateRelatedObjects(data.related_objects)
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
async function loadObjectProfile(objectId) {

  // Show loading state
  showLoadingState();

  // 1. Fetch object data from API (or static JSON for now)
  let objectData;
  try {
    // For now, use objects.json - will switch to /api/objects/{objectId} later
    const response = await fetch('/docs/ui/assets/data/objects.json');
    const allObjects = await response.json();
    objectData = allObjects.find(o => o.object_id === objectId || o.id === objectId);

    if (!objectData) {
      console.error(`Object not found: ${objectId}`);
      showErrorState('Object not found');
      return null;
    }
  } catch (err) {
    console.error('Failed to load object:', err);
    showErrorState('Failed to load object data');
    return null;
  }

  // 2. Populate header (always)
  populateHeader(objectData);

  // 3. Populate stats dashboard (always)
  populateStats(objectData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(objectData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge (only for array data)
      const countData = objectData[card.dataField];
      if (Array.isArray(countData)) {
        setCardCount(cardId, countData.length);
      }

      // Populate content
      card.populate(objectData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(objectData)
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
  console.log('Loading object profile...');
}

function hideLoadingState() {
  console.log('Object profile loaded');
}

function showErrorState(message) {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
        <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
        <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
        <a href="/docs/ui/browse/objects.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back to Objects
        </a>
      </div>
    `;
    emptyState.style.display = '';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get object ID from URL parameter (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const objectId = urlParams.get('id');

  if (objectId) {
    loadObjectProfile(objectId);
  } else {
    showErrorState('No object ID provided');
  }
});

