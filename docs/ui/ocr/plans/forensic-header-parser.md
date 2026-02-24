# Implementation Plan - Forensic Header Parser (Priority #7)

Automatically extract standardized metadata (Agency, RIF Number, Date, Author) from OCR'd archival documents using regex-based pattern recognition. Pre-populates `source` table fields, reducing the most tedious part of data entry to a one-click review.

- **Status**: Approved — Ready for Implementation
- **Priority**: High
- **Owner**: Antigravity
- **Workorder ID**: WO-OCR-007

---

## 1. Executive Summary

Field researchers spend significant time manually transcribing header metadata from scanned archival documents. This plan implements pattern-recognition for standardized headers (FBI 302 memos, NARA RIF sheets, Warren Commission exhibits) that automatically extracts and pre-fills source metadata before the researcher reads the first paragraph.

**Target Documents**:
| Document Type | Header Pattern | Example |
|---------------|----------------|---------|
| FBI 302 Forms | Agent name, Field Office, Date, File Number | `SA James P. Hosty, Dallas, 11/22/63` |
| NARA RIF Sheets | Agency, Record Number, Date | `CIA, 104-10001-10001, 1963-11-25` |
| Warren Commission | Exhibit Number, Commission Doc ID | `CE-399`, `CD-1` |
| HSCA Documents | Record Group, Folder, Box | `RG 233, Box 12` |

## 2. Risk Assessment

- **Complexity**: Medium (Regex patterns require iterative refinement against real documents).
- **Breaking Changes**: None. Additive feature to existing OCR pipeline.
- **Performance**: Negligible. Text parsing is instant compared to OCR processing.
- **Dependencies**: Python `re` module (standard library), no new packages required.

## 3. Architecture Decision

> **DECISION REQUIRED**: Frontend-only vs. Backend post-processor

**Option A: Frontend-Only (JavaScript)**
- Runs in browser after OCR text is returned
- Zero backend changes
- Patterns bundled in `ocr-gui.js`
- Pro: Simpler deployment
- Con: Complex regex harder to maintain in JS; no server-side pattern updates

**Option B: Backend Post-Processor (Python)** ← Recommended
- New module `header_parser.py` alongside `ocr_worker.py`
- Returns structured JSON with extracted fields
- Pro: Python's `re` module with named groups is more maintainable
- Pro: Pattern library can be updated without frontend deployment
- Con: Requires backend change

## 4. Key Features

1. **Pattern Library**: Regex patterns for FBI, CIA, NARA, HSCA, and Warren Commission header formats
2. **Confidence Scoring**: Each extracted field tagged with confidence (HIGH/MEDIUM/LOW) based on pattern specificity
3. **Pre-filled Metadata Card**: UI component showing extracted values for researcher review before commit
4. **Override Support**: All auto-detected values are editable; human judgment remains final

## 5. Implementation Phases

### Phase 1: Pattern Library & Parser Module

| Task ID | Description |
|---------|-------------|
| **PARSER-001** | Create `header_parser.py` with `HeaderParser` class |
| **PARSER-002** | Implement FBI 302 pattern: agent name, field office, date |
| **PARSER-003** | Implement NARA RIF pattern: `\d{3}-\d{5}-\d{5}` |
| **PARSER-004** | Implement date normalization (handles `11/22/63`, `November 22, 1963`, `22 Nov 1963`) |
| **PARSER-005** | Return structured JSON: `{agency, rif, date, author, confidence, raw_header}` |

### Phase 2: Backend Integration

| Task ID | Description |
|---------|-------------|
| **SERVER-001** | Add `/api/parse-header` endpoint accepting OCR text |
| **SERVER-002** | Integrate parser into post-OCR pipeline (optional auto-run) |
| **SERVER-003** | Return metadata alongside existing OCR response |

### Phase 3: Frontend UI

| Task ID | Description |
|---------|-------------|
| **UI-001** | Add "Metadata Preview" card below queue item on completion |
| **UI-002** | Display extracted fields with confidence badges |
| **UI-003** | Add "Copy to Clipboard" for quick paste into database entry form |
| **UI-004** | Add manual "Re-parse Header" button for edge cases |

### Phase 4: Testing & Refinement

| Task ID | Description |
|---------|-------------|
| **TEST-001** | Validate against 10 sample FBI 302 documents |
| **TEST-002** | Validate against 10 sample NARA RIF sheets |
| **TEST-003** | Regression: ensure non-archival documents don't produce false positives |

## 6. Sample Pattern Definitions

```python
PATTERNS = {
    "nara_rif": {
        "pattern": r"(?P<rif>\d{3}-\d{5}-\d{5})",
        "maps_to": "external_ref",
        "confidence": "HIGH"
    },
    "fbi_agent": {
        "pattern": r"(?:SA|Special Agent)\s+(?P<agent>[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)",
        "maps_to": "author",
        "confidence": "MEDIUM"
    },
    "date_mdy": {
        "pattern": r"(?P<month>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{2,4})",
        "maps_to": "published_date",
        "confidence": "MEDIUM"
    },
    "agency_header": {
        "pattern": r"(?:AGENCY|Agency):\s*(?P<agency>FBI|CIA|SECRET SERVICE|HSCA|DPD)",
        "maps_to": "source_type_hint",
        "confidence": "HIGH"
    }
}
```

## 7. Database Field Mapping

| Extracted Field | Maps To | Notes |
|-----------------|---------|-------|
| RIF Number | `source.external_ref` | NARA Record Identification Form number |
| Agency | `source.notes` or lookup | May inform `source_type` selection |
| Date | `source.published_date` | Normalized to ISO format |
| Agent Name | `source.author` | e.g., "SA James P. Hosty" |
| Exhibit Number | `entity_identifier` | Links to Warren Commission exhibits |

## 8. Success Criteria

- [ ] Parser correctly extracts RIF numbers from NARA documents with >95% accuracy
- [ ] Parser correctly extracts agent names from FBI 302s with >80% accuracy
- [ ] Date normalization handles at least 5 common archival date formats
- [ ] UI displays extracted metadata with clear confidence indicators
- [ ] No false positives on non-archival documents (personal letters, photos without headers)

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Pattern Drift**: Archival formats vary by decade/agency | Extensible pattern library; easy to add new patterns |
| **OCR Quality**: Degraded scans produce garbled headers | Confidence scoring accounts for partial matches |
| **False Positives**: Random number sequences match RIF pattern | Require contextual anchors (e.g., "RIF:" prefix nearby) |

## 10. Open Decisions

> These items must be resolved before implementation begins:

1. **Architecture**: Frontend-only (JS) or Backend post-processor (Python)?
2. **Trigger Mode**: Auto-run after every OCR job, or on-demand via button?
3. **Output UX**: Pre-fill a form, or display for manual copy/paste?
4. **Priority Patterns**: Which document types to implement first?

## 11. Deliverables

1. `header_parser.py` — Pattern library and extraction logic
2. `/api/parse-header` — REST endpoint (if backend approach chosen)
3. UI metadata preview component
4. Documentation update to `docs/ui/ocr/README.md`
5. Test corpus: 20 sample documents with expected extraction results
