# WORKBENCH AUDIT

## Scope
This audit extracts Workbench-related material from:
1. `CURRENT-STATE.md`
2. `start-here.md`
3. `WORKBENCH-UI-CODEX.md`
4. `xxxxx-plan.md`
5. `docs/CLASSIFIER-TOOL-REFERENCE.md`
6. `docs/REVIEWER-FEEDBACK-LOOP.md`
7. `docs/planning/input-output-mirror-plan.md`
8. `docs/TTS-INTEGRATION-CONTEXT.md`
9. `docs/testing/workbench/test-plan.md`
10. `docs/testing/workbench/test-cases/api-contracts.md`
11. `docs/testing/workbench/reports/2026-03-02-smoke.md`

## 1. Workbench System Definition (Current)
1. Primary UI is `web/html/tools/workbench/workbench.html` with logic in `web/html/assets/js/workbench.js`.
2. Workbench tabs are: `INPUT`, `SOURCE`, `CLASSIFY`, `ENTITIES`, `EXPORT`.
3. Core loop is operational: source selection -> classify review -> entity adjudication -> export artifacts.
4. Feedback is persisted locally (`workbench_feedback_*`) and can be exported as `_v2` feedback JSON.

## 2. Pipeline and Data Flow (Extracted)
1. Classify pipeline:
- fetch predictions from `GET /api/review/<filename>`
- human review (4-tier + notes + save/skip)
- `POST /api/feedback`
2. Entities pipeline:
- `POST /api/entities` detection
- approve/reject matched/candidate entities
- export source/entity records through `POST /api/entities/export`
3. Feedback-loop training path:
- export `_v2` files to `data/feedback-exports/`
- convert with `tools/convert_workbench_feedback_v2.py`
- train/analyze with `tools/train_classifier.py --suggest`

## 3. Source-Type Coverage (Documented)
1. Current accepted/used inputs include document/image/audio/video/url ingest.
2. Audio/video review is intended to be segment-based in Classify (source-aware card rendering).
3. Mirror-plan target requires each input to map to:
- normalized text
- structured segments
- review units
- entity candidates
- feedback export
4. EPUB is planned but not fully integrated as first-class input.

## 4. TTS + Audio Context (Documented)
1. TTS is implemented (Kokoro) via endpoints:
- `/api/tts/config`
- `/api/tts/preview`
- `/api/tts/synthesize`
- `/api/tts/batch`
2. Current TTS behavior is export-focused and workbench-text-driven.
3. Gap documented: direct processed-file-to-audio path should be added (`/api/tts/from-file` plan).

## 5. Testing Posture (Documented)
1. Workbench-specific test suite exists under `docs/testing/workbench/`.
2. Defined layers:
- functional UI
- API contracts
- integration/cross-tab state
- regressions
- reliability
3. Smoke report (`2026-03-02`) indicates pass on core P0 API/flow checks.
4. Browser-only checks remain manual for key UI behaviors (canvas/render persistence/export UX).

## 6. Improvement Backlog Extracted
1. From `CURRENT-STATE.md`:
- tighten review-state semantics and filtering UX
- improve audio/video classify maturity
- strengthen explicit fallback messaging
2. From `WORKBENCH-UI-CODEX.md`:
- queue-oriented Source UX with status and progress
- stronger classify review-state UX and skip-reason controls
- entity bulk actions and evidence panel
- export preflight checklist and delta view
3. From `input-output-mirror-plan.md`:
- capability matrix by input/output
- parity closure for non-PDF flows
- provenance completeness for page/segment/chapter attribution
4. From `xxxxx-plan.md`:
- source-mode-aware classify renderer contract
- keep shared save/skip semantics across source modes

## 7. Documented Gaps and Risks
1. State semantics are not fully unified across docs/UI language (`pending/correct/incorrect/skipped` vs `verified_approved/verified_not_approved/needs_followup`).
2. Audio/video workflow is implemented enough for flow, but still identified as less mature UX than document review.
3. Mirror parity and EPUB support are planned, not complete.
4. Some improvements exist as planning docs without explicit done/owner/status fields.

## 8. Alignment Findings (What Is Most Actionable)
1. `CURRENT-STATE.md` is the best single high-level status snapshot.
2. `REVIEWER-FEEDBACK-LOOP.md` is the best process contract but needs terminology harmonization with runtime statuses.
3. `CLASSIFIER-TOOL-REFERENCE.md` is the best technical contract source for API + storage + export behavior.
4. `docs/testing/workbench/` is sufficient to operationalize quality gates if run consistently.

## 9. Recommended Canonical Set (For "Read:" handoff)
1. `start-here.md` (operator quick-run)
2. `CURRENT-STATE.md` (status + priorities)
3. `docs/CLASSIFIER-TOOL-REFERENCE.md` (API/data truth)
4. `docs/REVIEWER-FEEDBACK-LOOP.md` (process contract)
5. `docs/testing/workbench/test-plan.md` (quality gate contract)

## 10. Bottom Line
Workbench documentation is strong but distributed.
The main improvement need is consolidation and terminology alignment so status semantics, source-mode behavior, and feedback-loop outputs are interpreted consistently by all agents.
