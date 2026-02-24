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

### B. Automatic Metadata Clipping (Phase 1 — Complete)
*   **Status**: ✅ Shipped as "Forensic Header Parser" (2026-02-23)
*   **Implementation**: Regex-based `HeaderParser` class in `tools/ocr-gui/header_parser.py`
*   **Capabilities**: Extracts RIF numbers, Agency, Date, and Author from document headers with confidence scoring.
*   **Known Limitation**: FBI 302 forms place agent/file info in the footer, not header.

### B2. Document Layout Analyzer (Phase 2 — Planned)

*   **Goal**: Full-page zone parsing that goes beyond headers to extract metadata from **all** document regions.
*   **Addition Needed**: ML-based document classifier + zone-specific extraction rules.

#### Document Type Classification

The system will automatically identify document types using a **fingerprinting** approach:

| Document Type | Visual Fingerprint | Textual Fingerprint | Metadata Zones |
|---------------|-------------------|---------------------|----------------|
| **FBI 302** | Form field boxes, serial number block at bottom | "FEDERAL BUREAU OF INVESTIGATION", "Date of transcription", "FD-302" | Header: Date, Subject. Footer: Agent name, File number |
| **NARA Cover Sheet** | Agency seal, RIF barcode | "RECORD IDENTIFICATION FORM", "AGENCY", "RECORD NUMBER" | Header: RIF, Agency, Record Series |
| **CIA Cable** | Classification stamps, routing grid | "SECRET", "FROM:", "TO:", "SUBJ:", cable slug lines | Header: Classification, Routing. Body: Cable text |
| **Warren Commission Exhibit** | "COMMISSION EXHIBIT" banner, exhibit number | "CE-", "Hearings Vol", numbered exhibits | Header: Exhibit ID. Body: Exhibit description |
| **Memorandum** | "MEMORANDUM" header, TO/FROM/SUBJECT lines | Standard memo format | Header: Routing info. Body: Memo content |
| **Handwritten Notes** | No structured layout, cursive/block writing | N/A (requires HTR) | Full page treated as body |

#### Classification Pipeline

```
1. INGEST → OCR text + page image
2. CLASSIFY → Score document against known type fingerprints
   - Visual features: Layout geometry, stamps, seals, form fields
   - Textual features: Keyword patterns, header strings, format markers
3. ROUTE → Apply type-specific parser:
   - FBI 302 → HeaderParser + FooterParser
   - NARA → HeaderParser (existing)
   - Memo → HeaderParser + BodyParser
   - Table-heavy → TableTransformer (TATR)
4. OUTPUT → Unified metadata JSON with zone annotations
```

#### Zone-Specific Extraction

Once document type is identified, the system applies targeted extraction:

| Zone | Extraction Method | Typical Content |
|------|-------------------|-----------------|
| **Header** | Regex patterns (existing HeaderParser) | RIF, Agency, Date, Subject line |
| **Footer** | Footer-specific regex + position detection | Agent name, File number, Page count |
| **Body** | Paragraph segmentation + NER | Witness statements, narrative content |
| **Tables** | Table Transformer (TATR) or Camelot | Financial records, witness lists, schedules |
| **Marginalia** | Handwriting recognition (TrOCR) | Annotations, signatures, routing stamps |
| **Stamps/Seals** | Image classification + OCR | Classification markings, agency seals |

#### Confidence Scoring for Classification

| Confidence | Action |
|------------|--------|
| **90-100%** | Auto-classify, apply type-specific parser |
| **70-89%** | Classify with "Suggested Type" flag for review |
| **< 70%** | Mark as "Unknown Type," apply generic parser |

#### Implementation Notes

*   **Knowledge Base**: Document type definitions stored in `v_document_type` controlled vocabulary table.
*   **Training Data**: Build corpus from known-good examples in the vault (NARA archives, Mary Ferrell collection).
*   **Fallback**: Unknown document types default to header-only parsing (current behavior).
*   **Human Override**: UI allows user to correct misclassified documents, feeding back into training set.

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

---

## 💬 Feedback & Review (Gemini CLI)

### 1. Structural Logic: The "Smart Evidence" Shift
The most critical addition is **Section 4: Automated Entity Identification**. By introducing a `entities.json` sidecar, the project creates a "metadata layer" for every document. This mimics professional investigative systems (like Palantir or Nuix), where raw files are instantly converted into a queryable knowledge graph.

### 2. Technical Strategy: The Hybrid Approach
*   **Database Lookup First**: This is a high-efficiency move. Matching against known entities (`person`, `place`, `org`) first solves ~80% of the extraction workload with zero cost and 100% accuracy.
*   **Fuzzy Matching (Levenshtein)**: Essential for archival work. OCR errors (e.g., "Yales" instead of "Yates") are inevitable; fuzzy scoring ensures these aren't lost to the system.
*   **Disambiguation Logic**: The proposed "Geographic Context" solution (inferring Dallas, TX from Dealey Plaza) shows the system is evolving from text recognition to narrative understanding.

### 3. UX/UI: The "Entities" Tab & Extraction Assistant
The proposed **Side-by-Side Workspace** and **Entities Tab** are the primary value-drivers.
*   **Real-Time Highlight Sync**: This is the "killer feature." Seeing the original scan scroll to the exact word when a name is clicked in the extraction tray provides a world-class research experience.
*   **Editor Role**: This workflow transitions the user from a "typist" to an "editor," drastically increasing the speed of archival digitization.

### 4. Data Model Alignment
The plan to populate the `assertion_support` table with `support_type = 'MENTIONS'` is perfectly aligned with the 4NF architecture. It ensures that the mere presence of an entity in a document is tracked with the same evidentiary rigor as a formal witness statement.

**Final Recommendation**: Start with **Approach A (Database Lookup)** in the next cycle. It provides the highest immediate value with the lowest technical overhead.
