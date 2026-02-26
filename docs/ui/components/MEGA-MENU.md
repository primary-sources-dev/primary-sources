# Mega Menu Component (`mega-menu.html`)

A comprehensive, high-density navigation component designed for the Primary Sources archive. It provides a structured interface for exploring entities, research tools, and project documentation.

## Usage
```html
<div data-component="mega-menu" class="component-loaded" data-prebuilt="true">
    <!-- Injected at build time by build.py -->
</div>
```

## Action Cards (Dedicated Header Row)
The top row of the menu consists of two high-priority action cards using the distinctive `.close-card` dashed styling:

| ID Reference | Title | Intent |
| :--- | :--- | :--- |
| `#home-container` | **Return Home** | Immediate navigation back to the archive root (`index.html`). |
| `#close-container` | **Close Navigation** | Closes the menu modal and returns to the current page. |

## Functional Containers (Ordered Sequence)
Beneath the action row, the menu is organized into six functional cards:

| # | ID Reference | Title | Primary Function |
| :--- | :--- | :--- | :--- |
| **1** | `#nav-1` | **Home & General** | Dashboard shortcuts and global archive search. |
| **2** | `#nav-2` | **About & Info** | Project mission, dev blog, and sitemaps. |
| **3** | `#nav-3` | **Browse Entities** | Core indices (People, Events, Orgs, Places, etc.). |
| **4** | `#nav-4` | **Research Tools** | Workspace applications (OCR, PDF, Matcher, etc.). |
| **5** | `#nav-5` | **Discovery** | Exploratory tools (Witness Atlas, Six Degrees). |
| **6** | `#nav-6` | **Tool Documentation** | User guides for the Research Tools workspace. |

## Responsive Grid Logic
The component utilizes a native CSS Grid system defined in `main.css`:

- **Desktop Layout**: 2-column grid (`grid-template-columns: repeat(2, 1fr)`) with a `3rem` gap.
- **Mobile Layout**: 2-column grid stack (`repeat(2, 1fr)`) triggered at `< 1024px`. 
- **Density**: Mobile padding is compressed to `1rem` with a `1rem` gap to ensure all 20+ links remain visible within the viewport.

## Visual Standards
- **Glassmorphism**: 30px backdrop blur with a semi-transparent dark charcoal background.
- **Micro-Animations**: Material Symbols hover effects with primary gold accents (`#B08B49`).
- **Interaction**: Top-level action cards feature a dashed border and centered alignment to distinguish them from content categories.

## Technical Maintenance
- **File**: `web/html/components/mega-menu.html`
- **Controller**: `assets/js/collapsible-menu.js`
- **Rebuild Requirement**: Run `python build.py` after any structural changes to propagate updates site-wide.

---
*Last Verified: 2026-02-26 | Grid V4.2 (Action Header Update)*
