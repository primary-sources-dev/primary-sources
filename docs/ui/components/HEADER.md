# Header Component (`header.html`)

The central navigation hub for the Primary Sources archive.

## Usage
```html
<header data-component="header"
    class="sticky top-0 z-50 w-full border-b border-archive-secondary/20 bg-archive-bg/95 backdrop-blur"></header>
```

## Features
- **Branding**: Dynamic logo with "Primary Sources" typography and `account_balance` icon.
- **Search**: Integrated search button linking to global search.
- **Breadcrumbs**: Dynamic path tracking (e.g., Archive > Browse) that updates via `nav.js`.
- **Global Menu**: Slide-out/hover menu containing all 17+ main navigation links, categorized by area (Home, Browse, Features, Tools).

## Integration
- **File**: `web/html/components/header.html`
- **Script Dependency**: `assets/js/nav.js` (for breadcrumb logic)
- **CSS Labels**: `.font-display`, `.text-primary`, `.bg-archive-dark`

---
*Last Updated: 2026-02-25*
