# Mega Menu Component (`mega-menu.html`)

A comprehensive, collapsible dropdown menu that provides access to all major sections of the Primary Sources archive.

## Usage
```html
<div data-component="mega-menu" class="component-loaded" data-prebuilt="true">
    <!-- Injected at build time or runtime -->
</div>
```

## Structure
The menu is divided into 6 distinct containers, each identified by a unique `nav-{n}` ID and a visible number:

1.  **#nav-1: Home & General**: Direct links to the root and search.
2.  **#nav-2: About & Info**: Project background, features, blog, and links.
3.  **#nav-3: Browse Entities**: Core archive indices (People, Events, etc.).
4.  **#nav-4: Research Tools**: Advanced scanning and analysis applications.
5.  **#nav-5: Discovery**: Dynamic exploration tools.
6.  **#nav-6: Tool Documentation**: Educational resources and technical guides.

## Key Features
- **Grid Layout**: Uses a responsive 2-column grid of cards on both mobile and desktop.
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
