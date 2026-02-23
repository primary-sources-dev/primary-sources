# OCR Tool — UI Components Reference

This document catalogs all UI components used in the OCR web interface, their CSS classes, and usage patterns.

> **Note:** This UI now uses **Tailwind CSS CDN** for utility classes. Custom component styles are in `ocr-components.css`.

---

## Design Tokens (Tailwind Config)

Design tokens are defined in the `tailwind.config` script in `index.html`:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                "primary": "#B08B49",
                "archive-bg": "#2E282A",
                "archive-secondary": "#D4CFC7",
                "archive-heading": "#F0EDE0",
                "archive-dark": "#1A1718",
                "archive-surface": "#252021",
            },
            fontFamily: {
                "display": ["Oswald", "sans-serif"],
                "mono": ["Roboto Mono", "monospace"]
            },
            borderRadius: {
                "DEFAULT": "0", "lg": "0", "xl": "0"
            }
        }
    }
}
```

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `primary` | `#B08B49` | `text-primary`, `bg-primary`, `border-primary` | Buttons, accents, active states |
| `archive-bg` | `#2E282A` | `bg-archive-bg` | Page background |
| `archive-secondary` | `#D4CFC7` | `text-archive-secondary` | Body text, labels |
| `archive-heading` | `#F0EDE0` | `text-archive-heading` | Headings, active tab text |
| `archive-dark` | `#1A1718` | `bg-archive-dark` | Menu bar, log output, inputs |
| `archive-surface` | `#252021` | `bg-archive-surface` | Settings container |

**Icons:** Material Symbols Outlined — `<span class="material-symbols-outlined">icon_name</span>`

---

## Typography

| Element | Font | Weight | Transform | Tracking |
|---------|------|--------|-----------|----------|
| Headings (h1-h6) | Oswald | 700 | uppercase | 0.05em |
| Body | Roboto Mono | 400 | none | normal |
| Labels | Roboto Mono | 700 | uppercase | 0.08em |
| Buttons | Roboto Mono | 700 | uppercase | 0.05em |

---

## Components

### 1. Header

Sticky navigation bar with logo, breadcrumbs, and return link.

```html
<header class="sticky top-0 z-50 border-b border-archive-secondary/20 bg-archive-bg/95 backdrop-blur">
    <div class="h-16 flex items-center justify-between px-6">
        <!-- Logo -->
        <a href="../index.html" class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <h1 class="text-xl font-bold tracking-widest text-archive-heading uppercase font-display">
                Primary Sources
            </h1>
        </a>
        <!-- Breadcrumbs -->
        <nav class="hidden md:flex items-center gap-2 border-l border-archive-secondary/20 pl-4">
            <span class="text-xs uppercase tracking-widest" style="opacity: 0.4;">Archive</span>
            <span class="material-symbols-outlined" style="font-size: 14px;">chevron_right</span>
            <span class="text-xs font-bold uppercase tracking-wider text-primary">OCR</span>
        </nav>
        <!-- Return Link -->
        <a href="../index.html" class="text-xs font-bold uppercase" style="opacity: 0.6;">
            [ Return to Archive ]
        </a>
    </div>
</header>
```

**CSS Classes:** `sticky`, `top-0`, `z-50`, `backdrop-blur`, `border-b`, `bg-archive-bg/95`

---

### 2. Menu Bar

Desktop application-style menu with dropdowns.

```html
<nav class="menu-bar">
    <div class="menu-item">
        File
        <div class="menu-dropdown">
            <div class="dropdown-item" id="menu-file-open">
                Open Files...
                <span class="shortcut">Ctrl+O</span>
            </div>
            <div class="dropdown-divider"></div>
            <a href="../index.html" class="dropdown-item">Exit</a>
        </div>
    </div>
</nav>
```

**CSS Classes:**
- `.menu-bar` — Container (dark bg, 32px height)
- `.menu-item` — Top-level item (hover reveals dropdown)
- `.menu-dropdown` — Dropdown panel (absolute positioned)
- `.dropdown-item` — Menu option (flex with shortcut)
- `.dropdown-divider` — Horizontal separator

---

### 3. Tabs

Tab navigation with active state indicator and badge.

```html
<div class="flex gap-1 mb-8 border-b border-archive-secondary/20">
    <button class="tab-btn active" data-tab="home">
        <span class="text-base font-bold uppercase tracking-wider text-archive-heading">Home</span>
    </button>
    <button class="tab-btn" data-tab="queue">
        <span class="text-base font-bold uppercase tracking-wider text-archive-heading">Queue</span>
        <span id="queue-badge" class="queue-badge hidden">0</span>
    </button>
</div>
```

**CSS Classes:**
- `.tab-btn` — Tab button (transparent bg, border-bottom indicator)
- `.tab-btn.active` — Active state (gold border-bottom)
- `.queue-badge` — Count indicator (gold bg, dark text)
- `.tab-content` — Content panel (`display: none` by default)
- `.tab-content.active` — Visible content

---

### 4. Drop Zone

Drag-and-drop file upload area with animation.

```html
<div id="drop-zone" class="drop-zone border border-archive-secondary/20 bg-archive-dark/50 mb-8">
    <div class="drop-zone-content">
        <svg class="drop-icon" viewBox="0 0 24 24">...</svg>
        <p class="text-archive-secondary text-base">Drop PDF files here or click to browse</p>
    </div>
    <input id="file-input" type="file" accept=".pdf" multiple hidden>
</div>
```

**CSS Classes:**
- `.drop-zone` — Container (dashed border, center content)
- `.drop-zone:hover` — Gold border, pulse animation
- `.drop-zone.dragover` — Active drag state
- `.drop-zone-content` — Inner flex column
- `.drop-icon` — SVG icon (40x40, gold)

**Animation:** `pulse-border` keyframes (border glow effect)

---

### 5. Settings Container

Panel containing grouped settings.

```html
<div class="settings-container border border-archive-secondary/20 bg-archive-surface/60 p-6 mb-8">
    <h3 class="text-lg font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
        Settings
    </h3>
    <!-- Setting groups here -->
</div>
```

**CSS Classes:**
- `.settings-container` — Panel (surface bg, padding, border)
- `border-l-4 border-primary` — Gold left accent on headings

---

### 6. Setting Group

Individual setting section with label and controls.

```html
<div class="setting-group mb-4">
    <label class="text-xs font-bold uppercase tracking-wider text-primary">Backend</label>
    <div class="flex gap-4 mt-2">
        <!-- Radio/Checkbox controls -->
    </div>
</div>
```

**CSS Classes:**
- `.setting-group` — Container (margin-bottom)
- `text-primary` — Gold label color

---

### 7. Radio Button (Custom)

Custom styled radio input using peer selector.

```html
<label class="flex items-center gap-2">
    <input type="radio" name="backend" value="wsl" checked class="hidden peer">
    <div class="w-4 h-4 border border-primary peer-checked:bg-primary"></div>
    <span class="text-sm">WSL (ocrmypdf)</span>
</label>
```

**CSS Pattern:** Hidden native input + visual div + peer-checked state

---

### 8. Checkbox (Custom)

Custom styled checkbox using peer selector.

```html
<label class="flex items-center gap-2">
    <input type="checkbox" id="output-pdf" checked class="hidden peer">
    <div class="w-4 h-4 border border-primary peer-checked:bg-primary"></div>
    <span class="text-sm">Searchable PDF</span>
</label>
```

**CSS Pattern:** Same as radio, without border-radius

---

### 9. Text Input

Styled text field for directory path.

```html
<input type="text" id="output-dir" readonly
    class="flex-1 bg-archive-bg border border-primary px-3 py-2 text-archive-secondary text-sm cursor-text"
    title="Double-click to copy">
```

**CSS Classes:** `bg-archive-bg`, `border-primary`, `px-3`, `py-2`, `text-sm`

---

### 10. Buttons

Primary and secondary buttons with size variants.

```html
<!-- Primary Large -->
<button class="btn-primary btn-lg">Start OCR</button>

<!-- Secondary Large -->
<button class="btn-secondary btn-lg" disabled>Cancel</button>

<!-- Primary Small -->
<button class="btn-primary btn-sm">Open</button>

<!-- Secondary Small -->
<button class="btn-secondary btn-sm">Change...</button>
```

**CSS Classes:**

| Class | Background | Text | Border |
|-------|------------|------|--------|
| `.btn-primary` | Gold | Dark | None |
| `.btn-secondary` | Transparent | Secondary | Secondary/40 |
| `.btn-sm` | — | 12px | 8px 16px padding |
| `.btn-lg` | — | 16px | 16px 48px padding |

**States:** `:hover`, `:active`, `:disabled`

---

### 11. Queue List

Container for file queue items.

```html
<div id="queue-list" class="bg-archive-dark/50 border border-archive-secondary/20 rounded-none">
    <div class="empty-state">
        <p class="text-archive-secondary text-sm">No files in queue.</p>
    </div>
</div>
```

**CSS Classes:** `.bg-archive-dark/50`, `.border-archive-secondary/20`

---

### 12. Queue Item

Individual file in the queue with progress bar.

```html
<div class="queue-item processing">
    <span class="filename">document.pdf</span>
    <span class="status">Processing...</span>
    <button class="btn-remove">×</button>
    <div class="queue-progress">
        <div class="queue-progress-bar" style="width: 45%"></div>
    </div>
</div>
```

**CSS Classes:**
- `.queue-item` — Row container
- `.queue-item.processing` — Active state (gold tint bg)
- `.queue-item.completed` — Success state (gold text)
- `.queue-item.failed` — Error state (orange text)
- `.queue-progress` — Progress track (dark bg)
- `.queue-progress-bar` — Fill bar (gold, animated width)
- `.btn-remove` — Delete button (subtle, orange on hover)

---

### 13. Log Output

Terminal-style scrollable log display.

```html
<div id="log-output" class="bg-archive-dark/50 border border-archive-secondary/20 p-4 font-mono text-xs h-48 overflow-y-auto">
    <p class="text-archive-secondary/60">Waiting to start processing...</p>
    <p class="log-success">✓ document.pdf completed</p>
    <p class="log-error">✗ failed.pdf error</p>
</div>
```

**CSS Classes:**
- `#log-output` — Container (240px height, scrollable)
- `.log-success` — Gold text
- `.log-error` — Orange text (`#d97706`)

---

### 14. Empty State

Placeholder for empty containers.

```html
<div class="empty-state">
    <p class="text-archive-secondary text-sm">No files in queue. Add files from the Home tab.</p>
</div>
```

**CSS Classes:** `.empty-state` — Centered text, muted color, padding

---

### 15. Modal

Overlay dialog with header, body, and footer.

```html
<div id="modal-overlay" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modal-title">Modal Title</h2>
            <button class="btn-close-modal" id="modal-close">×</button>
        </div>
        <div class="modal-body" id="modal-body">
            <!-- Content -->
        </div>
        <div class="modal-footer">
            <button class="btn-primary btn-sm" id="modal-ok">OK</button>
        </div>
    </div>
</div>
```

**CSS Classes:**
- `.modal-overlay` — Fixed fullscreen (hidden by default)
- `.modal-overlay.active` — Visible state
- `.modal-content` — Dialog box (gold border, max 600px)
- `.modal-header` — Title bar (dark bg)
- `.modal-body` — Content area (scrollable)
- `.modal-footer` — Action buttons (right-aligned)
- `.btn-close-modal` — X button

---

## Utility Classes

Utilities are provided by **Tailwind CSS CDN** (loaded in `index.html`). Common classes used:

| Category | Example Classes |
|----------|-----------------|
| **Layout** | `flex`, `flex-wrap`, `flex-col`, `items-center`, `justify-between`, `justify-center`, `gap-1`, `gap-2`, `gap-4` |
| **Sizing** | `w-4`, `h-4`, `h-16`, `h-48`, `max-w-3xl`, `flex-1` |
| **Spacing** | `p-4`, `p-6`, `px-3`, `px-6`, `py-1`, `py-2`, `pl-4`, `mb-4`, `mb-6`, `mb-8`, `mt-2`, `mx-auto` |
| **Typography** | `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-3xl`, `font-bold`, `font-display`, `font-mono`, `uppercase`, `tracking-wider`, `tracking-widest` |
| **Colors** | `text-primary`, `text-archive-heading`, `text-archive-secondary`, `text-archive-secondary/60`, `bg-archive-bg`, `bg-archive-dark`, `bg-archive-surface`, `bg-primary` |
| **Borders** | `border`, `border-b`, `border-l`, `border-l-4`, `border-primary`, `border-archive-secondary/20`, `rounded-none` |
| **Display** | `hidden`, `block`, `inline-block`, `inline-flex` |
| **Position** | `sticky`, `top-0`, `z-50`, `relative`, `absolute` |
| **Effects** | `backdrop-blur`, `transition`, `transition-all`, `overflow-y-auto` |
| **Responsive** | `md:flex`, `md:hidden` |

> Full Tailwind documentation: https://tailwindcss.com/docs

---

## Responsive Breakpoints

```css
@media (max-width: 768px) {
    /* Mobile: Hide menu bar, full-width buttons */
    .menu-bar { display: none; }
    .btn-lg { width: 100%; }
}

@media (min-width: 769px) {
    /* Desktop: Show md:flex elements */
    .md\:flex { display: flex; }
}
```

---

## Animations

### Pulse Border (Drop Zone)

```css
@keyframes pulse-border {
    0%, 100% {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 0 rgba(176, 139, 73, 0.4);
    }
    50% {
        border-color: #c9a15e;
        box-shadow: 0 0 0 8px rgba(176, 139, 73, 0);
    }
}
```

---

*Last updated: 2026-02-23*
