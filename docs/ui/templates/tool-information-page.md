# Tool Information Page Template

Standard template for all analytical tool information pages in Primary Sources.

---

## Page Structure

```
┌─────────────────────────────────────────┐
│  MODULAR HEADER (sticky)                │
├─────────────────────────────────────────┤
│  HERO SECTION                           │
│  - Badge: [icon] Analytical Tool · Live │
│  - H1 Title                             │
│  - Description                          │
│  - Stat/Feature Tags                    │
├─────────────────────────────────────────┤
│  MAIN CONTENT (max-w-4xl)               │
│  ├─ What It Does                        │
│  ├─ How It Works (optional diagram)     │
│  ├─ Supported [Items] (grid)            │
│  ├─ Key Features (2x2 grid)             │
│  ├─ API Usage (code block)              │
│  └─ Status Card (Live)                  │
├─────────────────────────────────────────┤
│  MODULAR FOOTER                         │
│  MODULAR BOTTOM-NAV                     │
└─────────────────────────────────────────┘
```

---

## Template File

Location: `docs/ui/tools/[tool-name].html`

### Head Section

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Tool Name] — Primary Sources</title>
    <meta name="description" content="[Brief tool description for SEO]" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/main.css">
    <script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#B08B49",
                        "archive-bg": "#2E282A",
                        "archive-secondary": "#D4CFC7",
                        "archive-heading": "#F0EDE0",
                        "archive-dark": "#1A1718",
                    },
                    fontFamily: {
                        "display": ["Oswald", "sans-serif"],
                        "mono": ["Roboto Mono", "monospace"]
                    },
                    borderRadius: {
                        "DEFAULT": "0", "lg": "0", "xl": "0", "full": "9999px"
                    },
                },
            },
        }
    </script>
    <script src="/assets/js/components.js"></script>
    <script src="/assets/js/nav.js"></script>
</head>
```

### Body Opening + Header

```html
<body class="bg-archive-bg text-archive-secondary font-mono transition-colors duration-300">

    <!-- MODULAR HEADER -->
    <header data-component="header"
        class="sticky top-0 z-50 w-full border-b border-archive-secondary/20 bg-archive-bg/95 backdrop-blur"></header>
```

### Hero Section

```html
    <!-- HERO -->
    <section class="relative w-full overflow-hidden bg-archive-dark py-12">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-archive-bg to-transparent pointer-events-none"></div>

        <div class="relative z-10 px-6 flex flex-col items-center text-center">
            <!-- Badge Line -->
            <span class="text-[10px] font-bold uppercase text-emerald-400 tracking-widest mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">[ICON]</span>
                Analytical Tool · Live
            </span>
            
            <!-- Title -->
            <h1 class="mb-4 text-4xl font-bold leading-tight text-archive-heading sm:text-5xl uppercase font-display">
                [Tool Name]
            </h1>
            
            <!-- Description -->
            <p class="mb-6 max-w-lg text-sm text-archive-secondary/80">
                [1-2 sentence description of what the tool does]
            </p>
            
            <!-- Stat Tags -->
            <div class="flex flex-wrap justify-center gap-2">
                <span class="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1.5 border border-emerald-500/30">
                    [Stat 1]
                </span>
                <span class="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1.5 border border-emerald-500/30">
                    [Stat 2]
                </span>
            </div>
        </div>
    </section>

    <hr class="border-archive-secondary/20" />
```

### Main Content Container

```html
    <!-- MAIN CONTENT -->
    <main class="max-w-4xl mx-auto px-6 py-10">
        <!-- Sections go here -->
    </main>

    <hr class="border-archive-secondary/20" />
```

---

## Content Sections

### Section Heading Style

All section headings use this consistent style:

```html
<h2 class="text-xl font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
    Section Title
</h2>
```

### 1. What It Does (Required)

```html
<section class="mb-12">
    <h2 class="text-xl font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
        What It Does
    </h2>
    <div class="prose prose-invert max-w-none text-archive-secondary/90 text-sm leading-relaxed space-y-4">
        <p>[Paragraph 1 - main functionality]</p>
        <p>[Paragraph 2 - key benefit or use case]</p>
    </div>
</section>
```

### 2. How It Works (Optional - Visual Diagram)

```html
<section class="mb-12">
    <h2 class="text-xl font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
        How It Works
    </h2>
    <div class="bg-archive-dark/30 border border-archive-secondary/20 p-6">
        <div class="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <!-- Step 1 -->
            <div class="flex flex-col items-center gap-2">
                <div class="w-16 h-16 flex items-center justify-center bg-archive-secondary/10 border border-archive-secondary/20">
                    <span class="material-symbols-outlined text-2xl text-archive-secondary">[icon]</span>
                </div>
                <span class="text-[10px] uppercase tracking-wider text-archive-secondary/70">[Step Name]</span>
            </div>
            
            <!-- Arrow -->
            <span class="material-symbols-outlined text-archive-secondary/30 rotate-90 md:rotate-0">arrow_forward</span>
            
            <!-- Step 2 (highlighted - primary colors) -->
            <div class="flex flex-col items-center gap-2">
                <div class="w-16 h-16 flex items-center justify-center bg-primary/20 border border-primary/40">
                    <span class="material-symbols-outlined text-2xl text-primary">[icon]</span>
                </div>
                <span class="text-[10px] uppercase tracking-wider text-primary">[Step Name]</span>
            </div>
            
            <!-- More steps... -->
        </div>
    </div>
</section>
```

### 3. Supported Items Grid (Required)

```html
<section class="mb-12">
    <h2 class="text-xl font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
        Supported [Items]
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <!-- Item Card -->
        <div class="border border-archive-secondary/20 bg-archive-dark/30 p-3 text-center">
            <span class="text-xs font-bold text-archive-heading uppercase">[ITEM_CODE]</span>
            <p class="text-[9px] text-archive-secondary/60 mt-1">[Description]</p>
        </div>
        <!-- Repeat for each item -->
    </div>
</section>
```

### 4. Key Features (Required - 2x2 Grid)

```html
<section class="mb-12">
    <h2 class="text-xl font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
        Key Features
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Feature Card -->
        <div class="flex gap-4 border border-archive-secondary/20 bg-archive-dark/30 p-4">
            <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                <span class="material-symbols-outlined text-lg">[icon]</span>
            </div>
            <div>
                <h3 class="font-bold text-archive-heading text-sm uppercase mb-1">[Feature Name]</h3>
                <p class="text-xs text-archive-secondary/70">[Feature description]</p>
            </div>
        </div>
        <!-- Repeat for 4 features -->
    </div>
</section>
```

### 5. API Usage (Required)

```html
<section class="mb-12">
    <h2 class="text-xl font-bold text-archive-heading uppercase tracking-wider border-l-4 border-primary pl-4 mb-6">
        API Usage
    </h2>
    <div class="bg-archive-dark/50 border border-archive-secondary/20 p-5">
        <pre class="text-[11px] font-mono text-archive-secondary/90 overflow-x-auto"><code>[Python code example]</code></pre>
    </div>
</section>
```

### 6. Status Card (Required - Live Version)

```html
<section class="border border-emerald-500/30 bg-emerald-500/5 p-6">
    <div class="flex items-center gap-3 mb-3">
        <span class="material-symbols-outlined text-emerald-400">check_circle</span>
        <span class="font-bold text-emerald-400 uppercase tracking-wider text-sm">Status: Live</span>
    </div>
    <p class="text-xs text-archive-secondary/80">
        [Description of current status and availability]
    </p>
</section>
```

---

## Footer Section

```html
    <!-- MODULAR FOOTER -->
    <div data-component="footer"></div>

    <!-- MODULAR BOTTOM NAV -->
    <nav data-component="bottom-nav" data-active="Home"
        class="fixed bottom-0 z-50 w-full border-t border-archive-secondary/20 bg-archive-bg px-6 py-4"></nav>

    <div class="h-24"></div>

</body>
</html>
```

---

## Color Reference

| Element | Class |
|---------|-------|
| Live badge (hero) | `text-emerald-400` |
| Live stat tags | `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` |
| Status card (Live) | `border-emerald-500/30 bg-emerald-500/5` |
| Status icon | `text-emerald-400` with `check_circle` icon |
| Primary accent | `text-primary` (#B08B49) |
| Headings | `text-archive-heading` (#F0EDE0) |
| Body text | `text-archive-secondary/90` |

---

## Checklist for New Tool Pages

- [ ] Title follows pattern: `[Tool Name] — Primary Sources`
- [ ] Meta description is 150-160 characters
- [ ] Hero badge uses emerald-400 with "Live" text
- [ ] All sections use standard heading style
- [ ] Key Features has exactly 4 items
- [ ] API Usage shows real Python example
- [ ] Status card uses emerald colors and "Live" status
- [ ] Footer uses modular components
- [ ] Page tested at mobile and desktop widths

---

## Reference Implementations

- `docs/ui/tools/document-analyzer.html` — Full implementation with performance table
- `docs/ui/tools/citation-generator.html` — Full implementation with format examples
