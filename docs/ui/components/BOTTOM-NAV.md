# Bottom Navigation (`bottom-nav.html`)

Mobile-first fixed navigation bar for quick access to primary archive sections.

## Usage
```html
<nav data-component="bottom-nav" data-active="People"
    class="fixed bottom-0 z-50 w-full border-t border-archive-secondary/20 bg-archive-bg px-6 py-4"></nav>
```

## Features
- **Section Icons**: 5 primary sections: Home, People, Events, Tools, About.
- **Active State**: Highlighting based on the `data-active` attribute.
- **Responsive**: Fixed to the bottom on mobile; typically hidden or secondary on widescreen.

## Integration
- **File**: `web/html/components/bottom-nav.html`
- **Script Dependency**: `assets/js/nav.js` (for active state logic)
- **Data Attributes**: `data-active` (e.g., "People", "Events").

---
*Last Updated: 2026-02-25*
