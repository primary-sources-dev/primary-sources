# Navigation Menu Component Reference

*Last Updated: 2026-02-26*

The collapsible navigation menu provides hierarchical site navigation within the header dropdown.

---

## Overview

The nav menu is a **two-level accordion menu** embedded in the header component. It organizes all site pages into 5 categories with optional subcategories (e.g., Tools has OCR & Documents, Research & Data).

---

## Files

| File | Purpose |
|------|---------|
| `components/header.html` | HTML structure (menu lives inside header) |
| `assets/js/collapsible-menu.js` | Expand/collapse behavior, keyboard navigation |
| `assets/css/main.css` | Menu styling (lines 225-364) |

---

## HTML Structure

### Category (Top-Level)

```html
<div class="menu-category" data-category="browse">
    <button class="category-toggle" data-target="browse-items" 
            aria-expanded="false" aria-controls="browse-items">
        <span class="material-symbols-outlined">dataset</span>
        <span>Browse Entities</span>
        <span class="chevron material-symbols-outlined">expand_more</span>
    </button>
    <div id="browse-items" class="category-items" role="region">
        <a href="/entities/event/event-index.html" class="menu-link">Events</a>
        <a href="/entities/person/person-index.html" class="menu-link">People</a>
        <!-- ... more links -->
    </div>
</div>
```

### Subcategory (Nested)

```html
<div class="menu-subcategory">
    <button class="subcategory-toggle" data-target="tools-ocr-items" 
            aria-expanded="false" aria-controls="tools-ocr-items">
        <span>OCR & Documents</span>
        <span class="chevron material-symbols-outlined">expand_more</span>
    </button>
    <div id="tools-ocr-items" class="subcategory-items" role="region">
        <a href="/tools/ocr/ocr-ui.html" class="menu-link">OCR Tool</a>
        <!-- ... more links -->
    </div>
</div>
```

---

## Menu Categories

| Category | Icon | Items |
|----------|------|-------|
| Home & General | `home` | Home, About |
| Content & Info | `article` | Blog, Links, Vision & Roadmap |
| Browse Entities | `dataset` | Events, People, Organizations, Places, Objects, Sources |
| Features | `auto_awesome` | On This Day, Six Degrees, Witness Atlas |
| Tools | `construction` | 2 subcategories (see below) |

### Tools Subcategories

| Subcategory | Items |
|-------------|-------|
| OCR & Documents | OCR Tool, Document Analyzer, Classifier Review |
| Research & Data | Citation Generator, Entity Matcher, Research Tools |

---

## CSS Classes

### Category Level

| Class | Purpose |
|-------|---------|
| `.menu-category` | Container for each top-level section |
| `.category-toggle` | Button that expands/collapses category |
| `.category-toggle.expanded` | Active state (chevron rotated) |
| `.category-items` | Container for links (hidden by default) |
| `.category-items.expanded` | Visible state (`max-height: 500px`) |
| `.menu-link` | Individual navigation link |

### Subcategory Level

| Class | Purpose |
|-------|---------|
| `.menu-subcategory` | Nested container with left border |
| `.subcategory-toggle` | Button for nested expand/collapse |
| `.subcategory-toggle.expanded` | Active state |
| `.subcategory-items` | Nested link container |
| `.subcategory-items.expanded` | Visible state (`max-height: 300px`) |

---

## CSS Styling

### Category Toggle

```css
.category-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: #D4CFC7;              /* archive-secondary */
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
}

.category-toggle:hover {
    background: rgba(176, 139, 73, 0.05);
    color: #B08B49;              /* primary gold */
}
```

### Menu Link

```css
.menu-link {
    display: block;
    padding: 10px 16px 10px 48px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(212, 207, 199, 0.8);
    text-decoration: none;
    transition: all 0.2s;
    border-bottom: 1px solid rgba(176, 139, 73, 0.05);
}

.menu-link:hover {
    background: rgba(176, 139, 73, 0.05);
    color: #B08B49;
    padding-left: 52px;          /* subtle slide effect */
}
```

### Chevron Animation

```css
.category-toggle .chevron {
    margin-left: auto;
    font-size: 16px;
    transition: transform 0.3s ease;
}

.category-toggle.expanded .chevron {
    transform: rotate(180deg);
}
```

### Expand/Collapse Animation

```css
.category-items {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;
    background: rgba(26, 23, 24, 0.5);
}

.category-items.expanded {
    max-height: 500px;
}
```

---

## JavaScript Behavior

### Initialization

The menu initializes via `collapsible-menu.js` which:
1. Listens for `componentLoaded` event when header is injected
2. Falls back to `DOMContentLoaded` if header is pre-built
3. Uses `menuInitialized` guard to prevent double-init

```javascript
document.addEventListener('componentLoaded', (e) => {
    if (e.detail.name === 'header' && !menuInitialized) {
        initCollapsibleMenu();
    }
});
```

### Accordion Behavior

- **Categories**: Only one category open at a time (accordion)
- **Subcategories**: Can have multiple open within a category
- **Click Outside**: Closes all categories

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle expand/collapse |
| `Escape` | Collapse all |

### Session Persistence

Stores active category in `sessionStorage` for optional state restoration:

```javascript
sessionStorage.setItem('activeCategory', targetId);
```

---

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `aria-expanded` | Indicates current state (true/false) |
| `aria-controls` | Links button to controlled region |
| `role="region"` | Identifies collapsible content area |
| `data-target` | JavaScript hook for finding target element |

---

## Integration

### Required Scripts

```html
<script src="assets/js/components.js" defer></script>
<script src="assets/js/collapsible-menu.js" defer></script>
```

### Dropdown Container

The menu dropdown appears on hover via CSS (in header.html):

```html
<div id="header-dropdown"
    class="absolute left-0 top-full mt-1 w-64 bg-archive-dark border border-archive-secondary/20 
           shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible 
           transition-all z-[100]">
```

---

## Adding New Menu Items

### New Link in Existing Category

```html
<div id="browse-items" class="category-items" role="region">
    <!-- Existing links -->
    <a href="/entities/new-entity/new-index.html" class="menu-link">New Entity</a>
</div>
```

### New Category

```html
<div class="menu-category" data-category="new-category">
    <button class="category-toggle" data-target="new-items" 
            aria-expanded="false" aria-controls="new-items">
        <span class="material-symbols-outlined">icon_name</span>
        <span>New Category</span>
        <span class="chevron material-symbols-outlined">expand_more</span>
    </button>
    <div id="new-items" class="category-items" role="region">
        <a href="/path/to/page.html" class="menu-link">Page Name</a>
    </div>
</div>
```

### New Subcategory (under Tools)

```html
<div class="menu-subcategory">
    <button class="subcategory-toggle" data-target="tools-new-items" 
            aria-expanded="false" aria-controls="tools-new-items">
        <span>New Subcategory</span>
        <span class="chevron material-symbols-outlined">expand_more</span>
    </button>
    <div id="tools-new-items" class="subcategory-items" role="region">
        <a href="/tools/new/new-ui.html" class="menu-link">New Tool</a>
    </div>
</div>
```

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#B08B49` | Hover text, borders |
| `--archive-secondary` | `#D4CFC7` | Default text |
| `--archive-dark` | `#1A1718` | Dropdown background |
| Border opacity | `0.1 - 0.2` | Subtle separators |
| Font size | `9px - 10px` | Compact uppercase labels |
| Letter spacing | `0.1em` | Consistent tracking |

---

## Related Components

- **[HEADER.md](./HEADER.md)** — Parent component containing the nav menu
- **[BOTTOM-NAV.md](./BOTTOM-NAV.md)** — Mobile-friendly bottom navigation bar
