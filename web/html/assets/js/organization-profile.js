// organization-profile.js
// Component Card Library System for Organization Profiles
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

  members: {
    icon: 'groups',
    title: 'Members & Personnel',
    dataField: 'members',
    autoExpand: false,
    showWhen: (data) => data.members && data.members.length > 0,
    populate: (data) => populateMembers(data.members)
  },

  events: {
    icon: 'event',
    title: 'Related Events',
    dataField: 'events',
    autoExpand: false,
    showWhen: (data) => data.events && data.events.length > 0,
    populate: (data) => populateEvents(data.events)
  },

  'related-orgs': {
    icon: 'account_tree',
    title: 'Related Organizations',
    dataField: 'related_organizations',
    autoExpand: false,
    showWhen: (data) => data.related_organizations && data.related_organizations.length > 0,
    populate: (data) => populateRelatedOrganizations(data.related_organizations)
  },

  locations: {
    icon: 'place',
    title: 'Locations',
    dataField: 'locations',
    autoExpand: false,
    showWhen: (data) => data.locations && data.locations.length > 0,
    populate: (data) => populateLocations(data.locations)
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
async function loadOrganizationProfile(orgId) {

  // Show loading state
  showLoadingState();

  // 1. Fetch organization data from API (or static JSON for now)
  let orgData;
  try {
    // For now, use organizations.json - will switch to /api/organizations/{orgId} later
    const response = await fetch(`${window.basePath || ''}assets/data/organizations.json`);
    const allOrgs = await response.json();
    orgData = allOrgs.find(o => o.org_id === orgId || o.id === orgId);

    if (!orgData) {
      console.error(`Organization not found: ${orgId}`);
      showErrorState('Organization not found');
      return null;
    }
  } catch (err) {
    console.error('Failed to load organization:', err);
    showErrorState('Failed to load organization data');
    return null;
  }

  // 2. Populate header (always)
  populateHeader(orgData);

  // 3. Populate stats dashboard (always)
  populateStats(orgData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(orgData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge
      const countData = orgData[card.dataField];
      const count = Array.isArray(countData) ? countData.length : 1;
      setCardCount(cardId, count);

      // Populate content
      card.populate(orgData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(orgData)
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
  console.log('Loading organization profile...');
}

function hideLoadingState() {
  console.log('Organization profile loaded');
}

function showErrorState(message) {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
        <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
        <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
        <a href="${window.basePath || ''}entities/organization/org-index.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back to Organizations
        </a>
      </div>
    `;
    emptyState.style.display = '';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get organization ID from URL parameter (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get('id');

  if (orgId) {
    loadOrganizationProfile(orgId);
  } else {
    showErrorState('No organization ID provided');
  }
});

