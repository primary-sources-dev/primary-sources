# Mega Menu Component (`mega-menu.html`)

A comprehensive, collapsible dropdown menu that provides access to all major sections of the Primary Sources archive.

## Usage
```html
<div data-component="mega-menu" class="component-loaded" data-prebuilt="true">
    <!-- Injected at build time or runtime -->
</div>
```

## Structure
The mega menu is organized into five logical cards, each covering a specific functional area:

1.  **Home & General**: Navigation to the dashboard, global search, and site-wide overview.
2.  **Browse Archives**: Direct links to entity-specific indices (People, Events, Organizations, etc.).
3.  **Exploration**: Interactive tools like "On This Day," Random Discovery, and the Witness Atlas.
4.  **Archive Tools**: Technical tools for researchers (OCR, PDF Viewer, Classifier, Matcher).
5.  **Information**: Links to About, Features, Blog, Links, and Site Map.

## Key Features
- **Grid Layout**: Uses a responsive grid of cards (1 column mobile, 3 columns desktop).
- **Interactive States**: Hover effects on links with primary color accents.
- **Micro-Animations**: Uses Material Symbols with subtle transitions.
- **Accessibility**: High-contrast text on semi-transparent dark backgrounds (`bg-[#252021]/60`).

## Technical Details
- **File**: `web/html/components/mega-menu.html`
- **Script Dependency**: `assets/js/collapsible-menu.js` (handles toggle logic and race conditions).
- **CSS Hierarchy**: Placed inside a `#header-dropdown` container with `absolute` positioning and high `z-index`.
- **Path Resolution**: Links use root-relative paths (e.g., `/search.html`) which are adjusted by `build.py` during site generation.

---
*Last Updated: 2026-02-26*
