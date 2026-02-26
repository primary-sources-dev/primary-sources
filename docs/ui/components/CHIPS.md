# Chips & Badges Component Reference

*Last Updated: 2026-02-26*

This document catalogs all chip/badge patterns used throughout the Primary Sources UI.

---

## Overview

The UI uses a **standardized chip system** for status indicators, labels, and metadata display.

---

## Standardized Chip System

### CSS Classes (in `main.css`)

```css
/* Base chip */
.chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 2px;
    background: rgba(176, 139, 73, 0.15);
    border: 1px solid rgba(176, 139, 73, 0.3);
    color: var(--primary);
}

/* Sizes */
.chip-sm { font-size: 8px; padding: 2px 6px; }
.chip-md { font-size: 10px; padding: 4px 8px; }
.chip-lg { font-size: 12px; padding: 6px 12px; }

/* Special states */
.chip-pulse { animation: pulse 2s infinite; }
```

### Usage

```html
<!-- Small (card corners, inline) -->
<span class="chip chip-sm">WIP</span>

<!-- Medium (default) -->
<span class="chip chip-md">Live</span>

<!-- Large (hero sections) -->
<span class="chip chip-lg">Coming Soon</span>

<!-- With pulse animation -->
<span class="chip chip-md chip-pulse">In Progress</span>

<!-- Positioned in card corner -->
<span class="absolute top-2 right-2 chip chip-sm">WIP</span>
```

---

## 1. Status Chips (Standardized)

### WIP Chip
**Location:** `index.html` (Platform Features section)
**CSS:** `.chip`, `.chip-sm`

```html
<span class="absolute top-2 right-2 chip chip-sm">WIP</span>
```

### Live Badge
**Location:** `index.html` (Analytical Tools section)

```html
<span class="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 border border-emerald-500/30">Live</span>
```

### Index Badge
**Location:** `index.html` (Tools Index card)

```html
<span class="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 border border-emerald-500/30">Index</span>
```

### Active Badge
**Location:** `pages/features.html`

```html
<span class="px-2 py-1 bg-green-500/10 text-green-500 text-[8px] font-bold uppercase tracking-widest border border-green-500/20">Active</span>
```

---

## 2. Animated Card Badges

**Location:** `components/animated-card.html`
**Used by:** Features/roadmap cards

| Status | Style | Label |
|--------|-------|-------|
| `queue` | `bg-primary/10 text-primary border-primary/20 animate-pulse` | "In Queue" |
| `planned` | `bg-archive-secondary/10 text-archive-secondary border-archive-secondary/20` | "Planned" |
| `live` | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` | "Live" |

---

## 3. Entity Chips (OCR Tool)

**Location:** `tools/ocr/ocr-components.css`
**Used by:** Document classification segments

### Base Entity Chip
```css
.entity-chip {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 99px;
    background: rgba(176, 139, 73, 0.1);
    color: var(--primary);
    border: 1px solid rgba(176, 139, 73, 0.3);
}
```

### Type Variants
| Type | Background | Text Color | Border |
|------|------------|------------|--------|
| Default | `rgba(176, 139, 73, 0.1)` | `--primary` | `rgba(176, 139, 73, 0.3)` |
| `.person` | `rgba(61, 139, 255, 0.1)` | `#4da6ff` | `rgba(61, 139, 255, 0.3)` |
| `.place` | `rgba(47, 179, 68, 0.1)` | `#2fb344` | `rgba(47, 179, 68, 0.3)` |

### Score Tag (Fuzzy Match)
```css
.score-tag {
    font-size: 7px;
    opacity: 0.7;
    background: rgba(0, 0, 0, 0.4);
    padding: 0 3px;
    border-radius: 2px;
}
```

---

## 4. Document Type Badge (OCR)

**Location:** `tools/ocr/ocr-gui.js`

```javascript
const docTypeBadge = `<span class="doc-type-badge">${docType.replace('_', ' ')}</span>`;
```

---

## 5. Confidence Badge (OCR)

**Location:** `tools/ocr/ocr-gui.js`

```javascript
`<span class="confidence-badge ${confidenceClass}">${confidence}</span>`
```

Classes: `.high`, `.medium`, `.low` (likely defined in ocr-components.css)

---

## 6. Tag Chips (Blog)

**Location:** `pages/blog.html`, `assets/js/blog-post.js`

```html
<span class="text-[9px] px-2 py-0.5 bg-archive-secondary/10 text-archive-secondary/60 uppercase tracking-wider">${tag}</span>
```

---

## 7. Coming Soon Badge

**Location:** `exploration/otd.html`, `exploration/random.html`, `exploration/witness-atlas.html`

```html
<span class="badge badge-large">Discovery Port — Coming Soon</span>
```

---

## 8. Tool Status Labels

**Location:** Tool detail pages (`tools/*/`)

```html
<span class="font-bold text-emerald-400 uppercase tracking-wider text-sm">Status: Live</span>
```

---

## Migration Status

### Standardized (using `.chip` classes)
- ✅ Homepage WIP badges (`index.html`)

### Legacy (to migrate as needed)
- ⏳ Live/Index badges on tool cards (`index.html`)
- ⏳ Active badges (`features.html`)
- ⏳ Coming Soon badges (`exploration/*.html`)
- ⏳ Tool status labels (`tools/*-details.html`)
- ⏳ Blog tag chips (`blog.html`, `blog-post.js`)

### OCR-Specific (remain in `ocr-components.css`)
- Entity chips (`.entity-chip`, `.entity-chip.person`, `.entity-chip.place`)
- Doc type badges (`.doc-type-badge`)
- Confidence badges (`.confidence-badge`)

---

## Legacy CSS Classes (deprecated, in `main.css`)

The following classes still exist for backward compatibility but should not be used for new development:

- `.badge`, `.badge-small`, `.badge-large` — use `.chip` + size modifier instead
- `.badge-wip` — use `.chip .chip-sm` instead
