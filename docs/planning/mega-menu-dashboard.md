# Implementation Plan - Full-Screen Dashboard Navigation

Transition the Mega Menu from a scrollable list to a static, non-scrollable "Command Center" dashboard that perfectly fills the available screen real-estate.

## Proposed Changes

### [Component] [mega-menu.html](file:///C:/Users/willh/Desktop/primary-sources/web/html/components/mega-menu.html)
- **Refined Layout**:
  - `<div class="mega-menu-header">`: HOME and CLOSE actions.
  - `<div class="mega-menu-main">`: The 6 category cards.
  - `<div class="mega-menu-footer">`: Social archive bar.
- **Card Content**: Ensure category card content is concise to support vertical scaling.

### [Style] [main.css](file:///C:/Users/willh/Desktop/primary-sources/web/html/assets/css/main.css)
- **Container**:
  - `.mega-menu-container`: `display: flex; flex-direction: column; height: calc(100vh - var(--header-height) - var(--navbar-height) - 48px); overflow: hidden;`.
- **Dashboard Headers/Footers**:
  - `.mega-menu-header`: Fixed height, flex-row.
  - `.mega-menu-footer`: Fixed height, horizontal bar.
- **The "Dynamic Fill" Body**:
  - `.mega-menu-main`: 
    - `flex: 1; overflow: hidden;` (strictly no scrolling).
    - `display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: 1rem;` (ensures 3 rows of 2 cards fill the space).
- **Internal Card Scaling**:
  - Adjust `.category-card` (or equivalent) to use `height: 100%` and `display: flex; flex-direction: column;` so content stays centered/distributed.
- **Mobile Responsive Override**:
  - **CRITICAL**: On small viewports where height is restricted, switch `grid-template-rows` to `auto` or re-enable scrolling to prevent UI breaking.

## Verification Plan

### Automated Tests
- Run `python build.py`.

### Manual Verification
- **Viewport Stress Test**: Resize the browser window vertically. Verify that cards shrink/grow but never reveal a scrollbar.
- **Visual Balance**: Ensure the gap between cards remains consistent while they scale.
- **Mobile Check**: Verify that on a phone-sized screen, the layout either remains legible or gracefully falls back to a scrollable list.
