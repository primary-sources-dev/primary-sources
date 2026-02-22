# JFK Primary Sources Archives — Style Guide

> This document is the single source of truth for UI consistency.
> All new screens must reference these tokens and patterns before writing any markup.

---

## 1. Color Tokens

| Token | Hex | Use |
|---|---|---|
| `primary` | `#B08B49` | Gold accent — CTAs, active state, borders on hover, left-border accents |
| `archive-bg` | `#2E282A` | Page background |
| `archive-secondary` | `#D4CFC7` | Body text, secondary labels, muted UI elements |
| `archive-heading` | `#F0EDE0` | Headings, nav labels, high-emphasis text |
| `archive-dark` | `#1A1718` | Hero section, footer, darker surface areas |
| `archive-surface` | `#252021` | Card backgrounds, tile interiors |

**Opacity utilities in use:**
- `border-archive-secondary/20` — standard divider/border
- `bg-primary/10` — icon container background (default state)
- `opacity-60` / `opacity-40` — muted body copy, copyright text

---

## 2. Typography

### Fonts
| Role | Family | Weight | Transform |
|---|---|---|---|
| Headings (`h1`–`h4`) | Oswald | 600–700 | `uppercase` always |
| Body / data | Roboto Mono | 400–500 | Normal |
| Labels / nav | Roboto Mono | 700 | `uppercase` + tight tracking |

### Scale in use
| Size class | Use |
|---|---|
| `text-4xl` / `text-5xl` | Hero heading |
| `text-2xl` | Section headings |
| `text-xl` | Header logo / nav title |
| `text-lg` | Card titles |
| `text-base` | Hero subtext, buttons |
| `text-xs` | Metadata labels, footer links |
| `text-[10px]` | Timestamps, copyright, micro-labels |

### Tracking
- Headings: `tracking-widest`
- Labels / nav: `tracking-wider` or `tracking-widest`
- Body subtext: `tracking-tighter`

---

## 3. Shape & Spacing

- **Border radius: 0** — no rounded corners anywhere. No exceptions.
- **Borders:** `border border-archive-secondary/20` — standard card/tile border
- **Left accent:** `border-l-4 border-primary pl-4` — used on all section headings
- **Padding:** `p-6` for sections, `px-4` for header, `px-6 py-10` for footer

---

## 4. Component Patterns

### Category Tile (Browse by Category)
```
border + bg-[#252021]/60
icon: bg-primary/10, border-primary/20, text-primary
hover → border-primary, icon fills to bg-primary, icon text = archive-bg
label: uppercase, tracking-wider, text-archive-heading
```

### Section Heading
```html
<h3 class="text-2xl font-bold text-archive-heading tracking-widest uppercase border-l-4 border-primary pl-4">
  Section Title
</h3>
```

### Recently Added Card
```
image: aspect-video, grayscale + brightness-75 default
hover → grayscale-0, brightness-100 (transition 700ms)
type label: text-[10px] font-bold uppercase text-primary tracking-widest
title: text-lg font-bold text-archive-heading, hover:text-primary
date: text-xs text-archive-secondary opacity-70
```

### Primary Button (CTA)
```
bg-primary, text-archive-bg, font-bold
hover: brightness-110
active: scale-95
no border radius
```

### Header
```
sticky top-0, z-50, backdrop-blur, bg-archive-bg/95
height: h-16
border-b: border-archive-secondary/20
```

### Bottom Navigation (mobile)
```
fixed bottom-0, h-16, z-50
active link: text-primary
inactive: text-archive-secondary hover:text-primary
icon + label (text-[10px] uppercase)
```

---

## 5. Interaction States

| State | Rule |
|---|---|
| Default border | `border-archive-secondary/20` |
| Hover border | `border-primary` |
| Active / selected | `text-primary` |
| Icon default | `bg-primary/10 text-primary` |
| Icon hover | `bg-primary text-archive-bg` |
| Image default | `grayscale brightness-75` |
| Image hover | `grayscale-0 brightness-100` (700ms) |
| Text hover | `hover:text-primary` |

---

## 6. Do Not

- Do not use rounded corners (`rounded-*` is globally set to `0`)
- Do not use bright or saturated accent colors — only `primary` gold
- Do not use white backgrounds — minimum surface is `archive-surface` (`#252021`)
- Do not mix serif fonts — Oswald + Roboto Mono only
- Do not use heading tags without `uppercase` and Oswald
- Do not hardcode hex values in markup — use the token names

---

## 7. Tailwind Config Reference

```js
colors: {
  "primary":           "#B08B49",
  "archive-bg":        "#2E282A",
  "archive-secondary": "#D4CFC7",
  "archive-heading":   "#F0EDE0",
},
fontFamily: {
  "display": ["Oswald", "sans-serif"],
  "mono":    ["Roboto Mono", "monospace"],
},
borderRadius: {
  "DEFAULT": "0", "lg": "0", "xl": "0", "full": "0"
},
```

---

*Extracted from `dash.html` · Last updated: 2026-02-21*
