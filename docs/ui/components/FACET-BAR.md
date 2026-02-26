# Facet Bar (`facet-bar.html`)

The primary filtering and sorting interface for archive listing pages.

## Usage
```html
<section data-component="facet-bar"
    data-title="People"
    data-filters='{"Event": "assets/data/events.json", "Organization": ["All", "FBI", "DPD"]}'
    class="bg-archive-dark px-6 py-8 border-b border-archive-secondary/20">
</section>
```

## Features
- **Dynamic Filters**: Multi-dropdown system that fetches options from JSON or static arrays.
- **Sorting**: Multi-mode sorting (A-Z, Z-A, Chronological).
- **Page Context**: Automatically updates headings and results counts.
- **Breadcrumbs**: Integrated with site-wide location tracking.

## Integration
- **File**: `web/html/components/facet-bar.html`
- **Script Dependency**: `assets/js/filter.js`
- **Data Attributes**: `data-title`, `data-filters`, `data-with-date`.

---
*Last Updated: 2026-02-25*
