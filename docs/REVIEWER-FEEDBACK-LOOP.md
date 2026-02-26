# Reviewer Feedback Loop (Human-in-the-Loop)

This document outlines the workflow by which human researchers verify and correct automated document classifications.

---

## 1. Overview

The **Reviewer Feedback Loop** ensures high-quality metadata for the Research Vault. While the automated classifier (Cortex) predicts the document's nature, a human reviewer "blinds" it with a final verification step before it is committed to the relational database.

---

## 2. The 4-Tier Feedback Model

Corrections are captured across four dimensions to ensure the hierarchy is preserved:

1.  **Agency** (Who): Does it belong to the FBI, CIA, or DPD?
2.  **Class** (Type): Is it a Report, Memo, or Testimony?
3.  **Format** (Form): Was it written on a 302 form, a Teletype, or a Cable?
4.  **Content** (Purpose): Does it contain an Interview, Ballistics, or Forensic Analysis?

---

## 3. Workflow Stages

### Stage 1: Automated Prediction
- **Trigger**: OCR process completes.
- **Action**: `document_classifier.py` runs against the extracted text.
- **Output**: Initial 4-tier predictions are stored in the server's processed cache.

### Stage 2: Human Review (`classifier-ui.html`)
- **Reviewer Action**: Opens the Review Tool for a specific file.
- **Visual Cues**: 
    - Green Badge: High-confidence match.
    - Yellow/Red Badge: Uncertain; requires attention.
    - "Continuity" Badge: Stateful logic linked this page to the previous one.
- **Correction**: Reviewer clicks "Correct" or selects a different Type/Agency/Content-Tag from the UI buttons.

### Stage 3: Training Data Capture
- **Endpoint**: `POST /api/feedback`
- **Data Saved**: Current predictions, human corrections, and a text sample are saved to `data/classifier-feedback.json`.
- **Purpose**: This JSON serves as an "Audit Log" and a training dataset for retuning the classifier patterns.

### Stage 4: Database Commitment (Final)
- **Status**: *Planned*
- **Action**: Once a whole document is "Marked as Verified," the consolidated 4-tier metadata is written to the `source` and `source_content_type` tables in Supabase.

---

## 4. Key endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/review/<filename>` | Loads predicted metadata for all pages. |
| `POST` | `/api/feedback` | Saves a human correction/verification. |
| `GET` | `/api/feedback` | Retrieves the feedback audit log. |

---

## 5. Maintenance

- **Adding Patterns**: If the reviewer notes a recurring misclassification, they add a comment (e.g., "Add pattern: 'DE STATION'").
- **Schema Updates**: If a document type doesn't exist in the list, a "Schema Update" note is flagged, and the `v_doc_format` table is extended.
---

## 6. Schema Discovery & Agentic Updates

A primary goal of this loop is to handle **"Unknown Unknowns"**. The human reviewer's corrections serve as signals for the AI agent to evolve the system.

### The "Schema Signal"
- If a reviewer selects **`SCHEMA_UPDATE`** or **`NEW_TYPE`** in the notes:
    - **Agent Action**: The AI agent must analyze the `classifier-feedback.json` log.
    - **Database Update**: The agent should proactively propose a SQL migration to add the new `v_doc_format` or `v_content_type` code to the controlled vocabulary.
    - **Classifier Update**: The agent should then refine `document_classifier.py` to recognize the new pattern.

### Tracking Progress
The system ensures that "what we didn't know we needed" becomes part of the permanent schema-tracking history.

---

## 7. Troubleshooting & Error Handling

- **500 Internal Server Error**: 
    - Most commonly caused by missing imports in `ocr_server.py` when extending the `document_classifier` functionality.
    - **Fix**: Ensure that any new classification utility (e.g., `get_agency`) is added to the `try/except` import block at the top of `ocr_server.py`.
    - **Validation**: Run `python tools/classifier_feedback_test.py` to verify all server-side dependencies are correctly exported and available.
- **Empty Samples**: 
    - If `textSample` is missing in the feedback, check if the OCR process completed successfully for that specific page.
- **UI Render Failures**:
    - If thumbnails appear blank, verify that the `renderQueue` in `classifier-ui.html` is processing and that the PDF.js worker is correctly initialized.
