# Implementation Plan - Phased Liquid Dashboard Refinement

This plan transforms the Mega Menu into a high-fidelity, full-screen "Liquid Dashboard" that eliminates scrolling on desktop while restoring the space-efficient 2-column grid on mobile.

## Phase 1: Grid Alignment & Gutter Synchronization
- **Goal**: Restore the perfect vertical/horizontal structural integrity across the 3-tier layout.
- **Changes**: 
  - Synchronize `gap` and `padding` across `.mega-menu-header`, `.mega-menu-main`, and `.mega-menu-footer`.
  - Update Header to use a matching 2-column grid for the HOME and CLOSE cards.
  - Align all vertical edges to be perfectly flush.

## Phase 2: Desktop "Full-View" Liquid Scaling
- **Goal**: Ensure the entire menu is visible on any desktop viewport without scrollbars.
- **Changes**:
  - Set `.mega-menu-main` to `grid-template-rows: repeat(3, 1fr)` to fill vertical space.
  - Implement vertical text scaling for category titles and links so they shrink to fit shorter screens.
  - Transition fixed margins/paddings to relative or clamped units for vertical flexibility.
  - Maintain `overflow: hidden` on desktop for a static "App Layer" feel.

## Phase 3: Mobile Grid Restoration (2-Column)
- **Goal**: Optimize for small screens by returning to a high-density 2-column layout.
- **Changes**:
  - Update mobile media query to use `grid-template-columns: repeat(2, 1fr)`.
  - Adjust internal card padding and font sizes for high-density mobile viewing.
  - Consolidate common styles to reduce CSS weight.
  - Ensure the footer social bar adapts to the 2-column width.

## Phase 4: Site-Wide Verification
- **Goal**: Finalize and verify across all 36 pages.
- **Changes**:
  - Run `python build.py` to propagate changes.
  - Viewport-stress-testing across screen heights (400px up to 1440px).
