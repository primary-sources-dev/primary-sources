# Reviewer Feedback Loop (Human-in-the-Loop)

This document defines the required review loop for page-level classification and entity adjudication in the Workbench.

---

## 1. Goal

Every page must be addressed and dispositioned. The system is iterative:

1. Scan/process all pages.
2. Review every page.
3. Export reviewed outcomes.
4. Improve classifier/entity rules and vocabulary.
5. Re-scan and repeat until coverage is complete for the document set.

---

## 2. Review Disposition States

Each page must be assigned one of these states:

1. `verified_approved`: Reviewer accepts page as ready for downstream/export.
2. `verified_not_approved`: Reviewer completed review but did not approve outcome.
3. `needs_followup`: Reviewer intentionally defers due to uncertainty or missing evidence.

No page should remain unaddressed at end-of-pass.

---

## 3. Required Reason Codes for Non-Approved Outcomes

If disposition is not `verified_approved`, a reason code is required:

1. `LOW_OCR_QUALITY`
2. `AMBIGUOUS_DOC_TYPE`
3. `MULTIPLE_DOC_TYPES_ON_PAGE`
4. `INSUFFICIENT_CONTEXT`
5. `MISSING_VOCAB_TERM`
6. `ENTITY_UNCERTAIN`
7. `OTHER`

A short reviewer note should be added for context.

---

## 4. Per-Page Review Contract

Each reviewed page should persist this minimum payload:

```json
{
  "page_id": 12,
  "disposition": "verified_not_approved",
  "reason_code": "AMBIGUOUS_DOC_TYPE",
  "reason_note": "Mixed memo/report language with low OCR confidence.",
  "reviewer_id": "local-user",
  "reviewed_at": "2026-03-01T20:15:00Z"
}
```

Classification corrections continue to use the 4-tier model:

1. Agency
2. Class
3. Format
4. Content tags

Notes are currently required to explain non-approved decisions when tags are not available.

---

## 5. Queue Views and Filters

Default operational queues:

1. `Active Work`: unresolved pages requiring action.
2. `Deferred`: pages in `needs_followup` or equivalent skipped state.
3. `Completed`: `verified_approved` and `verified_not_approved`.
4. `All`: full audit view.

Recommended default UI behavior:

1. Show `Active Work` by default.
2. Hide deferred/skipped items unless explicitly toggled on.
3. Keep completed pages available for audit.

---

## 6. Data Flow

### Stage 1: Prediction
- `GET /api/review/<filename>` returns page-level predictions for the full file.

### Stage 2: Human Review
- Reviewer adjusts Agency/Class/Format/Content as needed.
- Reviewer records disposition and reason code when non-approved.
- `POST /api/feedback` stores page-level review outcome.

### Stage 3: Export for Agentic Improvement
- Export dataset includes:
  - model prediction,
  - reviewer decision,
  - disposition/reason,
  - notes and timestamps.
- Downstream agents use reviewed outcomes to propose classifier and vocabulary improvements.

### Stage 4: Re-Run
- Updated rules/vocabulary are applied.
- Document is scanned and reviewed again until all pages are dispositioned.

---

## 7. Progress Metrics

Track these each iteration:

1. `Disposition Coverage`: percent of pages with any disposition.
2. `Approved Rate`: percent `verified_approved`.
3. `Non-Approved Rate`: percent `verified_not_approved`.
4. `Follow-up Rate`: percent `needs_followup`.
5. Reason code distribution by frequency.
6. Reduction in unresolved pages per iteration.

---

## 8. Notes on Current Implementation

1. Classify tab source data is full-document page set from `/api/review/<filename>`.
2. Entity approvals do not currently remove pages from the Classify array.
3. Export payload should be treated as the canonical training/audit artifact until database tables are introduced.
