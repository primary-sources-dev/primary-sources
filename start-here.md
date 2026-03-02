# Start Here: Classifier + Entity Workflow

## What Goes Where
- `Classifier feedback` improves model training rules.
- `Entity approvals/exports` update your entity/source JSON registries.
- These are related, but they are different pipelines.

## Pipeline A: Classifier Feedback Dataset
1. Open Workbench and review pages in `CLASSIFY`.
2. Click `Export Feedback JSON`.
3. This saves a file in-repo under: `data/feedback-exports/`
   - Example: `classifier_feedback_<file>_v2_<timestamp>.json`
4. Convert export(s) into training dataset format:
   - `python tools/convert_workbench_feedback_v2.py --input "data/feedback-exports/classifier_feedback_*_v2_*.json" --output data/classifier-feedback.json`
5. Train/analyze from that dataset:
   - `python tools/train_classifier.py --suggest`

### Where Data Is Stored
- Training dataset file: `data/classifier-feedback.json`
- Reviewed records are in: `entries[]`
- Merge behavior: latest `source + page` replaces older entry.

## Pipeline B: Entity Dataset Updates
1. In Workbench `ENTITIES`, click `Detect Entities`.
2. Approve/reject matches and candidates.
3. Export to registries:
   - `Export Source Record` -> `web/html/assets/data/sources.json`
   - `Export New Entities` -> one of:
     - `web/html/assets/data/people.json`
     - `web/html/assets/data/places.json`
     - `web/html/assets/data/organizations.json`
     - `web/html/assets/data/events.json`
     - `web/html/assets/data/objects.json`

## Important Distinction
- `Export Feedback JSON` does **not** write directly to entity registries.
- `Entity Export` does **not** update classifier training by itself.
- To improve both systems, run both pipelines.

## Quick Daily Loop
1. Review pages (`CLASSIFY`).
2. Export feedback JSON.
3. Convert to `data/classifier-feedback.json`.
4. Run trainer suggestions.
5. Detect + approve entities.
6. Export source/entity records.
