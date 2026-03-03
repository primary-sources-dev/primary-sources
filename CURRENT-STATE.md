1. Current State: Intake Is Strong
- Upload, Paste, and URL ingest are wired and functioning.
- URL ingest now handles multiple source types and has fallback behavior.
- Queue handoff into downstream tabs is operational.

2. Current State: Core Review Loop Is Operational
- Source selection -> Classify -> Entities -> Export flow is in place.
- Review actions and entity decisions are persisted enough to continue sessions.
- Export path exists for feedback-loop artifacts.

3. Current State: Reliability Improved but Not Fully Productized
- API contract testing on main passed for the core ingest endpoints.
- Workbench runtime outputs were being tracked; now mitigated via .gitignore.
- Full UI/manual suite still needs regular execution to catch regressions early.

4. Current Gaps
- Review-state semantics can still be tightened (pending/verified/skipped) across filters and UX labels.
- Entity workflow needs clearer page-scoped vs apply-across controls for operator speed.
- Audio/video-specific classify UX is still less mature than document/page review UX.
- Fallback paths (especially for video ingest) succeed, but behavior should be explicit in UI messaging.

5. Highest-Value Features to Add Next
- Explicit review queue filters: Active (pending), Deferred (skipped), Completed (verified).
- Mandatory skip reason taxonomy with analytics-ready output.
- Apply selected entities to remaining pages as an explicit bulk action.
- Better source-type-aware cards (document vs audio/video transcript) with consistent save/skip model.
- Export readiness panel showing what is complete vs blocked before export.

6. Pipeline/Quality Features
- Add automated API smoke script in repo so every run checks ingest contracts quickly.
- Add regression checklist execution cadence (daily or before merge).
- Add per-run report file generation under docs/testing/workbench/reports/.

7. Data/Feedback Loop Features
- Include structured failure reasons in exports (not just free text).
- Add new class candidate capture flow for unknown document/audio types.
- Add summary dashboards: top skip reasons, top uncertain entity types, top false positives.

8. Architecture Hardening Features
- Normalize one shared state contract across tabs (single source of truth).
- Isolate source adapters (document, web page, YouTube transcript, audio) behind a common ingest interface.
- Add stricter schema validation pre-export to prevent malformed feedback artifacts.

9. Operational Recommendation
- Freeze feature additions briefly and run one full manual suite pass from the new test docs.
- Fix P0/P1 findings first, then implement queue/filter/state features in one focused iteration.

10. Bottom Line
- Workbench is usable and materially improved.
- Next gains come from tightening review-state UX, entity scaling controls, and making the feedback loop more structured and measurable.
