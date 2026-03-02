# Agent Loop Runbook (Read This First)

Use this file as the single instruction handoff:

`Read: C:\Users\willh\Desktop\primary-sources\AGENT-LOOP-RUNBOOK.md`

---

## Objective

Each loop must produce one of:
1. A code/process fix, or
2. New structured training/entity data.

No loop ends at "noted."

---

## Required Workflow (Every Loop)

1. Review pages in Workbench (`CLASSIFY`).
2. Assign a disposition to every page:
   - `correct` (approved)
   - `incorrect` (not approved)
   - `skipped` (needs follow-up)
3. For `incorrect` or `skipped`, require:
   - reason preset, or
   - `OTHER` + custom reason detail
4. Export feedback JSON from Workbench.
5. Convert export into training dataset:
   - `python tools/convert_workbench_feedback_v2.py --input "data/feedback-exports/classifier_feedback_*_v2_*.json" --output data/classifier-feedback.json`
6. Run analysis/suggestions:
   - `python tools/train_classifier.py --suggest`
7. Execute at least one improvement action:
   - classifier pattern update, or
   - vocab/schema update, or
   - OCR/scanner/process update
8. Re-run scan/review and compare metrics.

---

## Entity Pipeline (Separate but Required)

1. In `ENTITIES`, click `Detect Entities`.
2. Approve/reject matches/candidates.
3. Export:
   - Source record -> `web/html/assets/data/sources.json`
   - New entities -> people/places/orgs/events/objects JSON registries

Note: classifier feedback export does not directly write entity registries.

---

## Inputs and Outputs

### Inputs
1. Workbench reviewed pages
2. Reviewer reason codes + notes
3. Entity approvals/rejections

### Outputs
1. Training dataset:
   - `data/classifier-feedback.json`
2. Raw feedback loop artifacts:
   - `data/feedback-exports/*.json`
3. Trainer diagnostics/suggestions:
   - stdout from `tools/train_classifier.py`
4. Entity registry updates:
   - `web/html/assets/data/*.json`

---

## Required Reporting (Agent Must Return)

1. Summary counts:
   - total, correct, incorrect, skipped, pending
2. Top non-approved reasons (including `OTHER` detail themes)
3. Corrections cluster summary (`predicted -> selected`)
4. Exact files changed
5. What was fixed this loop
6. What remains for next loop

---

## Definition of Done (Per Loop)

A loop is complete only if all are true:
1. Feedback export completed.
2. `data/classifier-feedback.json` updated from converter.
3. Trainer report reviewed.
4. At least one concrete improvement applied OR new structured data added.
5. Agent reports metrics + next actions.

---

## Fast Start Commands

```powershell
# 1) Convert latest Workbench feedback export(s)
python tools/convert_workbench_feedback_v2.py --input "data/feedback-exports/classifier_feedback_*_v2_*.json" --output data/classifier-feedback.json

# 2) Analyze and suggest improvements
python tools/train_classifier.py --suggest
```
