# Sticky Footer Semantic Refactor Plan

## Overview
Complete semantic refactor to fix footer positioning using proper HTML5 structure and CSS flexbox.

## Phase 1: CSS Updates

### File: `assets/css/main.css`

#### Remove:
```css
.main-content {
    flex: 1;
    padding-bottom: var(--navbar-height);
}
```

#### Add:
```css
main {
    flex: 1;
    padding-bottom: var(--navbar-height);
}

footer {
    margin-top: auto;
}
```

## Phase 2: Footer Component Update

### File: `components/footer.html`

#### Change:
```html
<!-- Before -->
<footer class="mt-20 border-t border-archive-secondary/10 bg-archive-dark px-6 py-12">

<!-- After -->
<footer class="border-t border-archive-secondary/10 bg-archive-dark px-6 py-12">
```

## Phase 3: HTML Structure Refactor

### All 34 HTML Files

#### Current Structure:
```html
<body>
    <header>...</header>
    <div class="main-content">
        <div data-component="mega-menu">...</div>
        <!-- All page content -->
    </div>
    <div data-component="footer">...</div>
    <nav data-component="bottom-nav">...</nav>
</body>
```

#### Target Structure:
```html
<body>
    <header>...</header>
    <main>
        <div data-component="mega-menu">...</div>
        <!-- All page content -->
    </main>
    <div data-component="footer">...</div>
    <nav data-component="bottom-nav">...</nav>
</body>
```

## Phase 4: Implementation Steps

### Step 1: Update CSS
1. Remove `.main-content` styles
2. Add `main` element styles
3. Add `footer { margin-top: auto }`

### Step 2: Update Footer Component
1. Remove `mt-20` from footer.html
2. Rebuild components

### Step 3: Batch HTML Updates
**Process 5-10 files at a time:**

#### Batch 1:
1. entities/event/event-details.html
2. entities/event/event-index.html
3. entities/object/object-details.html
4. entities/object/object-index.html
5. entities/organization/org-details.html

#### Batch 2:
1. entities/organization/org-index.html
2. entities/person/person-details.html
3. entities/person/person-index.html
4. entities/place/place-details.html
5. entities/place/place-index.html

#### Batch 3:
1. entities/source/source-details.html
2. entities/source/source-index.html
3. exploration/otd.html
4. exploration/random.html
5. exploration/witness-atlas.html

#### Batch 4:
1. pages/about.html
2. pages/blog-post.html
3. pages/blog.html
4. pages/features.html
5. pages/links.html

#### Batch 5:
1. search.html
2. sitemap.html
3. tools/analyzer/analyzer-details.html
4. tools/citation/citation-details.html
5. tools/classifier/classifier-details.html

#### Batch 6:
1. tools/classifier/classifier-ui.html
2. tools/matcher/matcher-details.html
3. tools/ocr/ocr-details.html
4. tools/ocr/ocr-ui.html
5. tools/pdf-viewer/pdf-viewer-details.html

#### Batch 7:
1. tools/pdf-viewer/pdf-viewer-ui.html
2. tools/research/research-details.html
3. tools/tools-index.html
4. index.html

*Test each batch before proceeding*

## Phase 5: Testing & Validation

### After Each Batch:
1. **Visual inspection** - Footer positioning
2. **Responsive testing** - Mobile/tablet/desktop
3. **Component functionality** - All interactive elements
4. **No console errors** - Clean JavaScript execution

### Final Validation:
1. **Cross-browser testing** - Chrome, Firefox, Safari
2. **Accessibility check** - Screen reader compatibility
3. **SEO validation** - Semantic structure correct

## Benefits

### Technical Benefits:
- ✅ **Semantic HTML5** - Proper element usage
- ✅ **Clean CSS** - No unused `.main-content` class
- ✅ **Standard pattern** - Conventional sticky footer
- ✅ **Better performance** - No extra wrapper divs

### Development Benefits:
- ✅ **Maintainable** - Clear structure for future devs
- ✅ **Scalable** - Easy to add new pages
- ✅ **Accessible** - Screen reader friendly
- ✅ **SEO optimized** - Proper document outline

## Risk Mitigation

### Batch Processing:
- Update 5-10 files at a time
- Test each batch thoroughly
- Rollback if issues detected

### Backup Strategy:
- Git commit after each successful batch
- Keep working copies of modified files
- Document all changes made

### Testing Coverage:
- Visual regression testing
- Functional testing of all components
- Responsive design validation

## Implementation Order

1. **CSS updates** (5 minutes)
2. **Footer component** (2 minutes + rebuild)
3. **HTML batch 1** (10 files, 15 minutes)
4. **HTML batch 2** (10 files, 15 minutes)
5. **HTML batch 3** (10 files, 15 minutes)
6. **Final validation** (10 minutes)

**Total estimated time:** ~1 hour

## Expected Result

Footer will properly stick to the bottom of the viewport (above the bottom navigation) using semantic HTML5 structure and modern CSS flexbox layout. This provides a maintainable, accessible, and performant solution that follows web development best practices.
