# Standalone Classifier Removal Plan

## Summary

Remove the standalone Document Classifier (`classifier-ui.html`, `classifier-details.html`) and redirect all links to the Workbench Classify tab. The standalone classifier shares 100% of its JS with `workbench.js`, has ~260 lines of duplicate inline CSS, and is already soft-deprecated with a feature-flag redirect at the top of `classifier-ui.html`. The Workbench Classify tab is the canonical replacement.

## Why

- Zero standalone JS — classifier-ui.html loads `workbench.js` for all behavior
- ~260 lines of inline CSS duplicated from workbench.css
- Already soft-deprecated (redirect flag at top of classifier-ui.html)
- Maintaining two entry points to the same code doubles testing surface for no gain
- classifier-details.html is a marketing/documentation page with no functional purpose

## Files to Delete

| File | Lines | Purpose |
|---|---|---|
| `web/html/tools/classifier/classifier-ui.html` | 899 | Standalone classifier UI |
| `web/html/tools/classifier/classifier-details.html` | 910 | Marketing/docs page |
| `web/html/tools/classifier/POST-MIGRATION-PLAN.md` | 156 | Historical migration notes |

After deletion, remove the empty `web/html/tools/classifier/` directory.

## Links to Update

### 1. Global Component (requires explicit permission per CLAUDE.md Rule 1)

**`web/html/components/mega-menu.html`** — propagates to ~30 built pages

| Line | Current | Replacement |
|---|---|---|
| 111 | `<a href="/tools/classifier/classifier-details.html"` | `<a href="/tools/workbench/workbench.html"` |
| 170 | `<a href="/tools/classifier/classifier-ui.html"` | `<a href="/tools/workbench/workbench.html"` |

Update link text from "Document Classifier" → "Document Workbench" (or similar).

### 2. Site Pages (unique references outside mega-menu injection)

**`web/html/index.html`**

| Line | Current | Action |
|---|---|---|
| 182 | `<a href="tools/classifier/classifier-details.html"` | → `tools/workbench/workbench.html` |
| 241 | `<a href="tools/classifier/classifier-ui.html"` | → `tools/workbench/workbench.html` |
| 556 | `<a href="tools/classifier/classifier-details.html"` | → `tools/workbench/workbench.html` |

**`web/html/tools/tools-index.html`**

| Line | Current | Action |
|---|---|---|
| 418 | `<a href="classifier/classifier-details.html"` | → `workbench/workbench.html` |

Lines 200, 259 are mega-menu injected — handled by Step 1.

**`web/html/sitemap.html`**

| Line | Current | Action |
|---|---|---|
| 537 | `<a href="tools/classifier/classifier-details.html"` | → `tools/workbench/workbench.html` |

Lines 198, 257 are mega-menu injected — handled by Step 1.

### 3. Documentation References (update text, no functional links)

Grep for `classifier` in `*.md` files and update references to note removal / point to workbench.

## Execution Order

1. **Update `components/mega-menu.html`** — redirect both classifier links to workbench (needs explicit user permission)
2. **Update `index.html`** — 3 unique classifier references → workbench
3. **Update `tools-index.html`** — 1 unique classifier reference → workbench
4. **Update `sitemap.html`** — 1 unique classifier reference → workbench
5. **Delete** `web/html/tools/classifier/` directory (all 3 files)
6. **Rebuild** — `cd web/html && py build.py --clean && py build.py && py validate-build.py`
7. **Verify** — grep entire `dist/` output for any remaining `classifier` hrefs
8. **Restart server** — `cd tools && py ocr_server.py`
9. **Smoke test** — confirm workbench loads, Classify tab works, no 404s from nav

## Risk

- **Low.** The standalone classifier is already non-functional without workbench.js. All behavior lives in the workbench. The only risk is stale links, mitigated by the grep verification in step 7.
- Mega-menu update is a global component change (CLAUDE.md Rule 1) — requires explicit user instruction before executing.

## Rollback

`git revert <commit>` restores all files. No database or API changes involved.
