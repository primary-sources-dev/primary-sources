// event-v1-profile.js
// Component Card Library System for Event Profiles
// Universal event template with archival aesthetic
// Primary Sources Project - 2026-02-24

// Card Registry - Defines all possible cards and their behavior
const CARD_REGISTRY = {

  context: {
    icon: 'info',
    title: 'Context & Significance',
    dataField: 'context',
    autoExpand: true,
    showWhen: (data) => data.context !== null && data.context !== '',
    populate: (data) => populateContext(data.context)
  },

  timeline: {
    icon: 'timeline',
    title: 'Procedural Timeline',
    dataField: 'sub_events',
    autoExpand: (data) => data.sub_events && data.sub_events.length >= 3,
    showWhen: (data) => data.sub_events && data.sub_events.length > 0,
    populate: (data) => populateTimeline(data.sub_events)
  },

  participants: {
    icon: 'groups',
    title: 'Key Participants',
    dataField: 'participants',
    autoExpand: false,
    showWhen: (data) => data.participants && data.participants.length > 0,
    populate: (data) => populateParticipants(data.participants)
  },

  evidence: {
    icon: 'inventory_2',
    title: 'Material Evidence',
    dataField: 'evidence',
    autoExpand: false,
    showWhen: (data) => data.evidence && data.evidence.length > 0,
    populate: (data) => populateEvidence(data.evidence)
  },

  sources: {
    icon: 'description',
    title: 'Primary Sources',
    dataField: 'sources',
    autoExpand: false,
    showWhen: (data) => data.sources && data.sources.length > 0,
    populate: (data) => populateSources(data.sources)
  },

  locations: {
    icon: 'place',
    title: 'Locations',
    dataField: 'locations',
    autoExpand: false,
    showWhen: (data) => data.locations && data.locations.length > 0,
    populate: (data) => populateLocations(data.locations)
  },

  'related-events': {
    icon: 'link',
    title: 'Related Events',
    dataField: 'related_events',
    autoExpand: false,
    showWhen: (data) => data.related_events && data.related_events.length > 0,
    populate: (data) => populateRelatedEvents(data.related_events)
  },

  assertions: {
    icon: 'fact_check',
    title: 'Assertions & Analysis',
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
async function loadEventProfile(eventId) {

  // Show loading state
  showLoadingState();

  // 1. Fetch event data from API (or static JSON for now)
  let eventData;
  try {
    // For now, use mock-event.json - will switch to /api/events/{eventId} later
    const response = await fetch('assets/data/mock-event.json');
    const allEvents = await response.json();
    eventData = allEvents.find(e => e.event_id === eventId || e.id === eventId);

    if (!eventData) {
      console.error(`Event not found: ${eventId}`);
      showErrorState('Event not found');
      return null;
    }
  } catch (err) {
    console.error('Failed to load event:', err);
    showErrorState('Failed to load event data');
    return null;
  }

  // 2. Populate header
  populateHeader(eventData);

  // 3. Populate stats dashboard
  populateStats(eventData);

  // 4. Process all cards
  let visibleCardCount = 0;

  Object.keys(CARD_REGISTRY).forEach(cardId => {
    const card = CARD_REGISTRY[cardId];

    // Check if card should be shown
    if (card.showWhen(eventData)) {
      visibleCardCount++;

      // Show card section
      showCard(cardId);

      // Set count badge
      const countData = eventData[card.dataField];
      const count = Array.isArray(countData) ? countData.length : 1;
      setCardCount(cardId, count);

      // Populate content
      card.populate(eventData);

      // Apply expansion rules
      const shouldExpand = typeof card.autoExpand === 'function'
        ? card.autoExpand(eventData)
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

// Populate event header
function populateHeader(data) {
  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = data.title || 'Event';

  // Icon
  const iconEl = document.getElementById('event-icon');
  if (iconEl && data.icon) {
    iconEl.textContent = data.icon;
  }

  // Type badge
  const typeBadge = document.getElementById('event-type-badge');
  if (typeBadge && data.event_type) {
    typeBadge.textContent = formatEventType(data.event_type);
  }

  // Title
  const titleEl = document.getElementById('event-title');
  if (titleEl) titleEl.textContent = data.title || 'UNKNOWN EVENT';

  // Date badge
  const dateBadge = document.getElementById('event-date-badge');
  if (dateBadge && data.label) {
    dateBadge.textContent = data.label;
  }

  // Location badge
  if (data.location) {
    const locationBadge = document.getElementById('event-location-badge');
    if (locationBadge) {
      locationBadge.textContent = data.location;
      locationBadge.style.display = '';
    }
  }

  // Description
  const descEl = document.getElementById('event-description');
  if (descEl) descEl.textContent = data.description || '';

  // Stats grid
  const statDate = document.getElementById('stat-date');
  if (statDate) statDate.textContent = data.label || formatDate(data.start_ts);

  // Duration
  if (data.end_ts) {
    const duration = calculateDuration(data.start_ts, data.end_ts);
    const durationWrapper = document.getElementById('stat-duration-wrapper');
    const durationEl = document.getElementById('stat-duration');
    if (durationWrapper && durationEl && duration) {
      durationEl.textContent = duration;
      durationWrapper.style.display = '';
    }
  }

  // Type
  if (data.event_type) {
    const typeWrapper = document.getElementById('stat-type-wrapper');
    const typeEl = document.getElementById('stat-type');
    if (typeWrapper && typeEl) {
      typeEl.textContent = formatEventType(data.event_type);
      typeWrapper.style.display = '';
    }
  }

  // Participants count
  if (data.participants && data.participants.length > 0) {
    const participantsWrapper = document.getElementById('stat-participants-wrapper');
    const participantsEl = document.getElementById('stat-participants');
    if (participantsWrapper && participantsEl) {
      participantsEl.textContent = data.participants.length;
      participantsWrapper.style.display = '';
    }
  }

  // Location
  if (data.location) {
    const locationWrapper = document.getElementById('stat-location-wrapper');
    const locationEl = document.getElementById('stat-location');
    if (locationWrapper && locationEl) {
      locationEl.textContent = data.location;
      locationWrapper.style.display = '';
    }
  }
}

// Populate stats dashboard
function populateStats(data) {
  // Sources count
  const sourcesEl = document.getElementById('stat-sources');
  if (sourcesEl) {
    sourcesEl.textContent = data.sources ? data.sources.length : 0;
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
  let badgeId = `${cardId}-count`;

  // Special case for sources (has different ID)
  if (cardId === 'sources') {
    badgeId = 'sources-count-badge';
  }

  const badge = document.getElementById(badgeId);
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
  console.log('Loading event profile...');
}

function hideLoadingState() {
  console.log('Event profile loaded');
}

function showErrorState(message) {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
        <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
        <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
        <a href="events.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back to Events
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
    if (dateStr.match(/^\d{4}$/)) return dateStr;
    return dateStr;
  }

  return date.getFullYear().toString();
}

// Helper: Format event type
function formatEventType(type) {
  if (!type) return 'UNKNOWN';
  return type.replace(/_/g, ' ');
}

// Helper: Calculate duration
function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end)) return null;

  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour' : `${diffHours} hours`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
  } else {
    return 'Less than 1 minute';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get event ID from URL parameter (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (eventId) {
    loadEventProfile(eventId);
  } else {
    showErrorState('No event ID provided');
  }
});
