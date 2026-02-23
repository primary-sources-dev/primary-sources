# OCR Scanner: Future Enhancements & Technical Roadmap

This document outlines the planned evolution of the OCR Tool from a basic transcription utility into a professional-grade **Intelligent Extraction Assistant**.

---

## 1. Multi-Format Input Expansion

| Feature | Technical Addition Needed | Impact on Research |
| :--- | --- | --- |
| **Archival Images** | Support for `.jpg`, `.png`, `.tiff`, `.webp` | Direct processing of raw high-res scans without needing PDF conversion. |
| **Mobile Photos** | Support for `.heic` (iPhone format) | Allows field researchers to upload "quick-snaps" from physical archives. |
| **Transcription** | Integration of **OpenAI Whisper** (Local) | Converts MP3 witness interviews or radio broadcasts into timestamped "text evidence." |
| **Batch Unrolling** | `.zip` / `.tar` handling | Drop a single archive of 500 images and have the tool synthesize one cohesive timeline. |

---

## 2. Intelligent Document Analysis

### A. Handwriting Recognition (HTR)
*   **Improvement**: Integrate Transformer-based models like **TrOCR** or **Donut**.
*   **Change Needed**: Backend upgrade to move beyond Tesseract (which struggles with cursive).
*   **Value**: Allows the engine to read handwritten field notes, marginalia, and personal letters.

### B. Automatic Metadata Clipping
*   **Improvement**: Pattern-matching for government headers (RIF sheets, FBI memo headers).
*   **Addition Needed**: Regex-based "Header Parser" and CV-based "RIF Detector."
*   **Value**: Automatically populates `source_id`, `agency`, and `date` fields in the database before human review begins.

### C. Layout-Aware Table Extraction
*   **Improvement**: Integration of **Table Transformer (TATR)**.
*   **Change Needed**: Implement layout-aware neural networks to detect grid geometry.
*   **Value**: Instantly converts "pictures of tables" (financials, sports box scores) into structured Markdown or JSON.

---

## 3. Workflow Evolution: "The Extraction Assistant"

The goal is to move from "File Out" to a "Side-by-Side Workspace."

### UI/UX Requirements:
*   **Split-Pane View**:
    *   **Left**: Original high-res archival scan.
    *   **Right**: Editable OCR text (Rich Text or Markdown).
*   **The "Auto-Suggest" Tray**: 
    *   A dynamic panel that displays AI-detected entities (**People**, **Places**, **Dates**).
    *   **Interaction**: "One-click" buttons to commit a detected entity directly to the research vault database.
*   **Real-Time Highlight Sync**: Clicking a word in the text pane scrolls the original image to that exact coordinate (and vice-versa).

---

## 4. Automated Entity Identification

The transition from "raw OCR text" to "linked database records" is the critical step that transforms documents into **Smart Evidence**. This system scans OCR output for entities already cataloged in the research vault and flags new discoveries for review.

---

### Three Technical Approaches

| Approach | Method | Accuracy | Cost | Use Case |
| :--- | --- | --- | --- | --- |
| **Database Lookup** | Direct matching against existing `person`, `place`, `org` tables | 100% (for known entities) | $0 | Primary method for linking to cataloged entities |
| **Local AI (NER)** | SpaCy or Duckling for Named Entity Recognition | 70-85% | $0 (compute only) | Discover new entities not yet in database |
| **LLM Extraction** | GPT-4o with "Historical Researcher" prompt | 85-95% | $0.01-0.05/page | Extract context and relationships ("Person A at Place B at Time C") |

---

### A. Recommended Hybrid Implementation

The optimal workflow combines **database lookup first** (fast, accurate, zero cost) with **flagged unknowns** for human review:

1. **Extract**: OCR produces raw text as usual.
2. **Verify**: Python script queries existing entities from `person`, `place`, `org` tables.
3. **Match**: Finds exact matches (e.g., "Ralph Leon Yates" → links to `person_id`).
4. **Flag**: Names that "look like entities" but aren't in the database get marked as "New Entity Candidates."
5. **Save**: Output `entities.json` sidecar file alongside `.txt` and `.pdf`.
6. **Review**: OCR UI displays "Entities Identified" tab where users can approve links or create new records.

---

### B. Fuzzy Matching & Disambiguation

**Problem**: OCR errors, aliases, and partial names create mismatches:
- "Yales" vs "Yates" (OCR typo)
- "Lee Oswald" vs "Lee Harvey Oswald" vs "L.H. Oswald" (alias variations)
- "Dallas" (could be Dallas, TX or Dallas County, AL) (geographic ambiguity)

**Solutions**:

*   **Alias Resolution**: Query the `person_alias` table for alternate names:
    ```sql
    SELECT p.person_id, p.display_name, pa.alias_value
    FROM person p
    LEFT JOIN person_alias pa ON p.person_id = pa.person_id
    WHERE lower(p.display_name) LIKE '%yates%'
       OR lower(pa.alias_value) LIKE '%yates%';
    ```

*   **Fuzzy String Matching**: Use **python-Levenshtein** for similarity scoring:
    ```python
    from fuzzywuzzy import fuzz
    if fuzz.ratio("R. L. Yates", "Ralph Leon Yates") > 85:
        # Probable match, flag for review
    ```

*   **Geographic Context**: Use hierarchical `place.parent_place_id` and document context:
    - If document mentions "Dealey Plaza," assume "Dallas" = Dallas, Texas (not Dallas, GA).
    - Display disambiguation UI: "Did you mean: Dallas, TX or Dallas County, AL?"

---

### C. Confidence Scoring System

Not all entity matches are equal. The system assigns confidence levels to guide human review:

| Confidence | Match Type | Action | Example |
| :--- | --- | --- | --- |
| **100%** | Exact match in database | Auto-link (no review needed) | "Ralph Leon Yates" → existing `person_id` |
| **85-99%** | Fuzzy match or alias | Flag for approval | "R. L. Yates" → probable match to Ralph Leon Yates |
| **70-84%** | NER detection, partial name | Requires review | "Yates" → could be Ralph or Dorothy Yates |
| **< 70%** | Weak signal | Ignore or flag as low-priority | "Mr. Y" → insufficient data |

**Implementation**:
*   Add `confidence_threshold` parameter (default: 85%).
*   Entities below threshold appear in "Needs Review" queue.
*   High-confidence matches populate `assertion_support` table with `support_type = 'MENTIONS'`.

---

### D. Output Format: `entities.json` Sidecar

Each processed document generates a machine-readable annotation file:

```json
{
  "document": "yates-fbi-302.pdf",
  "processed_at": "2026-02-23T14:30:00Z",
  "entities": [
    {
      "text": "Ralph Leon Yates",
      "type": "person",
      "matched_id": "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
      "confidence": 1.0,
      "method": "exact_match",
      "page": 2,
      "bbox": [120, 450, 280, 470]
    },
    {
      "text": "C. Ray Hall",
      "type": "person",
      "matched_id": null,
      "confidence": 0.85,
      "method": "ner",
      "status": "needs_review",
      "page": 3
    },
    {
      "text": "Dallas",
      "type": "place",
      "matched_id": "2e3f4a5b-6c7d-48e9-f0a1-b2c3d4e5f6a7",
      "confidence": 0.92,
      "method": "contextual_match",
      "disambiguation": "Dallas, Texas (inferred from 'Dealey Plaza' context)"
    }
  ]
}
```

---

### E. UI Integration: "Entities" Tab

Add a third tab to the OCR tool (alongside Home/Queue) that displays extraction results:

*   **Approved Entities**: Green checkmarks for auto-linked records.
*   **Pending Review**: Yellow warning icons for fuzzy matches requiring approval.
*   **New Discoveries**: Blue "+" buttons to create new database records directly from the UI.
*   **Batch Actions**: "Approve All High-Confidence" and "Export to CSV" for bulk processing.

**Interaction Flow**:
1. User uploads `yates-fbi-302.pdf`.
2. OCR completes → file appears in Queue tab with "Extract Entities" button.
3. User clicks button → backend runs entity matching.
4. Entities tab populates with results:
   - ✓ Ralph Leon Yates → Linked to person_id
   - ⚠️ C. Ray Hall → New entity (approve?)
   - ✓ Dallas, Texas → Linked to place_id
5. User clicks "Approve" → system creates `assertion_support` record with `support_type = 'MENTIONS'`.

---

## 5. Technical Dependencies Mapping

| Category | Additions Needed |
| :--- | --- |
| **Libraries** | `openai-whisper`, `transformers`, `torch`, `opencv-python`, `python-Levenshtein`, `spacy` |
| **Models** | `TrOCR` (Handwriting), `Whisper-base` (Audio), `TATR` (Tables), `en_core_web_sm` (NER) |
| **Frontend** | `Canvas API` for coordinate mapping, `Diff-Match-Patch` for text reconciliation |
| **Backend** | Enhanced Flask API routes for `/api/transcribe`, `/api/entity-extract`, `/api/entity-approve` |
| **Database** | New query functions for fuzzy matching across `person_alias` and `place` hierarchies |
