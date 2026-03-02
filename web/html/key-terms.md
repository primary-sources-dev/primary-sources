# Key Terms

1. Workbench
2. Classification Data
3. Review State (`pending`, `verified`, `skipped`)
4. Feedback Record (per-page saved decision)
5. Predicted Type (model output, e.g., `FBI_302`)
6. Normalized Class (mapped review class, e.g., `REPORT`)
7. Entity Approvals (`approved`, `rejected`, `pending`)
8. Export Payload (`_v2` review dataset)
9. Active Queue Filter (what pages are shown for review)
10. Handoff/Forwarded State (sent to next phase and hidden from active review)
11. StandardFacetBar (page-level header bar below tabs — dynamic title, dropdown, context action card)
12. Progressive Unlock (tabs enable sequentially based on state gates in `getUnlockState()`)
13. Assertion Chain (every fact backed by `source_excerpt`, never free text)
14. Controlled Vocabulary (predefined values in `v_*` tables — no free-text in vocab fields)
15. renderCard() (builds each classify page card — dark container with badges, selectors, fingerprints)
16. loadFile() (triggers full pipeline: load source PDF, fetch classification data, render cards)
17. sourceTab.files[] (file list from `/api/history` that populates the source dropdown)
18. Workbench Context (right-aligned action component in StandardFacetBar — currently placeholder)
19. Entity Types (6 schema types: Person, Org, Place, Object, Event, Source)
20. Build Pipeline (`build.py` injects 148 HTML components across 37 pages)
