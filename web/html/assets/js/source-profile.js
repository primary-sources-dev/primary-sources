// source-profile.js
// Component Card Library System for Source Profiles
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

  content: {
    icon: 'summarize',
    title: 'Content Summary',
    dataField: 'content_summary',
    autoExpand: false,
    showWhen: (data) => data.content_summary !== null && data.content_summary !== '',
    populate: (data) => populateContentSummary(data.content_summary)
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

  organizations: {
    icon: 'corporate_fare',
    title: 'Related Organizations',
    dataField: 'organizations',
    autoExpand: false,
    showWhen: (data) => data.organizations && data.organizations.length > 0,
    populate: (data) => populateOrganizations(data.organizations)
  },

  places: {
    icon: 'place',
    title: 'Related Places',
    dataField: 'places',
    autoExpand: false,
    showWhen: (data) => data.places && data.places.length > 0,
    populate: (data) => populatePlaces(data.places)
  },

  citations: {
    icon: 'format_quote',
    title: 'Citations',
    dataField: 'citations',
    autoExpand: false,
    showWhen: (data) => data.citations || (data.title && data.author),
    populate: (data) => populateCitations(data)
  },

  provenance: {
    icon: 'verified',
    title: 'Authenticity & Provenance',
    dataField: 'provenance',
    autoExpand: false,
    showWhen: (data) => data.provenance && Object.keys(data.provenance).length > 0,
    populate: (data) => populateProvenance(data.provenance)
  },

  'related-sources': {
    icon: 'link',
    title: 'Related Sources',
    dataField: 'related_sources',
    autoExpand: false,
    showWhen: (data) => data.related_sources && data.related_sources.length > 0,
    populate: (data) => populateRelatedSources(data.related_sources)
  }

};

// Main loading function
async function loadSourceProfile(sourceId) {

  // Show loading state
  showLoadingState();

  // 1. Fetch source data from API (or static JSON for now)
  let sourceData;
  try {
    // For now, use sources.json - will switch to /api/sources/{sourceId} later
    const response = await fetch(`${window.basePath || ''}assets/data/sources.json`);
    const allSources = await response.json();
    sourceData = allSources.find(s => s.source_id === sourceId || s.id === sourceId);

    if (!sourceData) {
      console.error(`Source not found: ${sourceId}`);
      showErrorState('Source not found');
      return null;
    }
  } catch (err) {
    console.error('Failed to load source:', err);
    showErrorState('Failed to load source data');
    return null;
  }

  // 2. Populate header (always)
  populateHeader(sourceData);

  // 3. Populate stats dashboard (always)
  populateStats(sourceData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(sourceData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge (only for array data)
      const countData = sourceData[card.dataField];
      if (Array.isArray(countData)) {
        setCardCount(cardId, countData.length);
      }

      // Populate content
      card.populate(sourceData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(sourceData)
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
  console.log('Loading source profile...');
}

function hideLoadingState() {
  console.log('Source profile loaded');
}

function showErrorState(message) {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
        <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
        <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
        <a href="${window.basePath || ''}browse/sources.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back to Sources
        </a>
      </div>
    `;
    emptyState.style.display = '';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get source ID from URL parameter (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const sourceId = urlParams.get('id');

  if (sourceId) {
    loadSourceProfile(sourceId);
  } else {
    showErrorState('No source ID provided');
  }
});

