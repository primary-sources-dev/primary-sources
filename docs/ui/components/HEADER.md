# Header Component (`header.html`)

The central navigation hub for the Primary Sources archive.

## Usage
```html
<header data-component="header"
    class="sticky top-0 z-50 w-full border-b border-archive-secondary/20 bg-archive-bg/95 backdrop-blur"></header>
```

## Layout
```
[☰ Menu] [🔍] | PRIMARY SOURCES: JFK > Browse ............. [👤 User]
         LEFT (all inline)                                    RIGHT
```

## Features
- **Global Menu**: Slide-out/hover menu containing all 17+ main navigation links, categorized by area (Home, Browse, Features, Tools).
- **Search**: Integrated search button linking to global search.
- **Branding**: "Primary Sources: JFK" title text, inline after search.
- **Breadcrumbs**: Shows current section (e.g., "> Browse"), hidden on homepage via `nav.js`.
- **User Icon**: Placeholder for future user/account features (right-aligned).

## Integration
- **File**: `web/html/components/header.html`
- **Script Dependency**: `assets/js/nav.js` (for breadcrumb logic)
- **CSS Labels**: `.font-display`, `.text-primary`, `.bg-archive-dark`

---
*Last Updated: 2026-02-26*
