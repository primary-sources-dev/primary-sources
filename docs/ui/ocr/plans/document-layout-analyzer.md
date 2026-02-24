# Implementation Plan — Document Layout Analyzer

**Status:** Planning  
**Priority:** High  
**Workorder ID:** WO-OCR-010  
**Depends On:** Forensic Metadata Parser (complete)

---

## 1. Ultimate Goal

**One-click archival ingestion**: A researcher uploads a scanned document and receives a fully structured database record with minimal human review.

```
Current Pipeline:
SCAN → OCR → BLIND REGEX → partial metadata → manual entry

Target Pipeline:
SCAN → OCR → CLASSIFY → ZONE EXTRACT → ENTITY MATCH → VERIFY → COMMIT
              ^^^^^^^^
              THIS FEATURE
```

The Document Layout Analyzer is the **intelligence layer** that identifies document type and routes to specialized extraction logic.

---

## 2. Problem Statement

### Current Limitations

The Forensic Metadata Parser runs **blind regex** across entire documents:

| Issue | Impact |
|-------|--------|
| No document type awareness | Same patterns applied to FBI 302, NARA cover sheets, memos |
| Position-agnostic | Can't distinguish header vs footer vs body metadata |
| False positives | Date patterns match interview dates, not document dates |
| Incomplete extraction | Misses type-specific fields (routing codes, classification stamps) |

### Real-World Example

**FBI FD-302 Interview Report:**
```
                                        FEDERAL BUREAU OF INVESTIGATION
                                                                    Date 11/26/63
                                                                    
RALPH LEON YATES, 2308 Byers, Dallas, Texas, was interviewed...

[... 2 pages of interview text ...]

transcribed by SA C. Ray Hall
DL 89-43
on 11/26/63
```

**Current parser finds:** RIF (maybe), one date (which one?)  
**Layout analyzer would find:** Document date, Interview date, Subject name, Agent name, File number, Field office code

---

## 3. Document Type Registry

### Phase 1: Core Types (FBI/NARA Focus)

| Type ID | Document Type | Visual Fingerprint | Textual Fingerprint |
|---------|--------------|-------------------|---------------------|
| `FBI_302` | FBI Interview Report | FD-302 form header | "FEDERAL BUREAU OF INVESTIGATION" + "Date" in header |
| `NARA_RIF` | NARA Cover Sheet | RIF number pattern | "RECORD INFORMATION" or ###-#####-##### |
| `CIA_CABLE` | CIA Routing Cable | DIR/CITE headers | "SECRET" + routing codes |
| `MEMO` | Generic Memorandum | TO/FROM/SUBJECT/DATE | Standard memo header block |
| `WC_EXHIBIT` | Warren Commission Exhibit | CE-### or CD-### | "COMMISSION EXHIBIT" |

### Phase 2: Extended Types

| Type ID | Document Type | Notes |
|---------|--------------|-------|
| `HSCA_DOC` | HSCA Document | Record Group patterns |
| `HANDWRITTEN` | Handwritten Notes | Low OCR confidence indicator |
| `TRANSCRIPT` | Testimony Transcript | Q/A patterns, page numbers |
| `PHOTO_CAPTION` | Photograph with Caption | Short text, exhibit reference |

---

## 4. Zone Detection Model

Each document type defines extraction zones:

```
┌─────────────────────────────────────────┐
│              HEADER ZONE                │  Lines 1-15 (configurable)
│   Document ID, Date, Classification     │
├─────────────────────────────────────────┤
│                                         │
│              BODY ZONE                  │  Middle content
│   Interview text, memo content          │
│                                         │
├─────────────────────────────────────────┤
│              FOOTER ZONE                │  Last 15 lines
│   Agent signature, file numbers         │
└─────────────────────────────────────────┘

┌──────────┐                    ┌──────────┐
│ MARGIN   │                    │ MARGIN   │
│ ZONE     │                    │ ZONE     │
│ Stamps   │                    │ Routing  │
│ Initials │                    │ Codes    │
└──────────┘                    └──────────┘
```

### Zone Configuration by Document Type

```python
ZONE_CONFIG = {
    "FBI_302": {
        "header": {"lines": 15, "fields": ["doc_date", "form_id"]},
        "body": {"fields": ["subject_name", "interview_content"]},
        "footer": {"lines": 10, "fields": ["agent_name", "file_number", "transcription_date"]},
    },
    "NARA_RIF": {
        "header": {"lines": 20, "fields": ["rif_number", "agency", "record_date", "classification"]},
        "body": {"fields": ["title", "description"]},
        "footer": {"lines": 5, "fields": ["review_date", "release_status"]},
    },
    "MEMO": {
        "header": {"lines": 10, "fields": ["to", "from", "date", "subject"]},
        "body": {"fields": ["content"]},
        "footer": {"lines": 5, "fields": ["signature", "cc_list"]},
    },
}
```

---

## 5. Classification Pipeline

### Step 1: Fingerprint Matching

```python
def classify_document(ocr_text: str) -> DocumentType:
    """
    Classify document by matching fingerprints against first N lines.
    Returns highest-confidence match.
    """
    header_sample = extract_lines(ocr_text, start=0, count=20)
    
    scores = {}
    for doc_type, fingerprints in FINGERPRINT_REGISTRY.items():
        score = 0
        for pattern, weight in fingerprints:
            if re.search(pattern, header_sample, re.IGNORECASE):
                score += weight
        scores[doc_type] = score
    
    best_match = max(scores, key=scores.get)
    confidence = scores[best_match] / MAX_POSSIBLE_SCORE
    
    return DocumentType(type_id=best_match, confidence=confidence)
```

### Step 2: Zone Extraction

```python
def extract_by_zone(ocr_text: str, doc_type: DocumentType) -> ExtractedMetadata:
    """
    Apply zone-specific extraction based on document type.
    """
    config = ZONE_CONFIG[doc_type.type_id]
    lines = ocr_text.split('\n')
    
    result = ExtractedMetadata(doc_type=doc_type)
    
    # Header zone
    header_text = '\n'.join(lines[:config["header"]["lines"]])
    for field in config["header"]["fields"]:
        result.set(field, extract_field(header_text, field, doc_type))
    
    # Footer zone
    footer_text = '\n'.join(lines[-config["footer"]["lines"]:])
    for field in config["footer"]["fields"]:
        result.set(field, extract_field(footer_text, field, doc_type))
    
    # Body zone
    body_text = '\n'.join(lines[config["header"]["lines"]:-config["footer"]["lines"]])
    for field in config["body"]["fields"]:
        result.set(field, extract_field(body_text, field, doc_type))
    
    return result
```

---

## 6. Fingerprint Registry

### FBI 302 Fingerprints

```python
FBI_302_FINGERPRINTS = [
    (r"FEDERAL BUREAU OF INVESTIGATION", 30),
    (r"FD-302", 25),
    (r"Date of transcription", 20),
    (r"was interviewed at", 15),
    (r"File #|File Number", 10),
    (r"transcribed by SA", 20),
    (r"DL \d{2,3}-\d+", 15),  # Dallas field office file pattern
]
```

### NARA RIF Fingerprints

```python
NARA_RIF_FINGERPRINTS = [
    (r"\d{3}-\d{5}-\d{5}", 40),  # RIF number pattern
    (r"RECORD (NUMBER|INFORMATION)", 25),
    (r"AGENCY", 10),
    (r"(CIA|FBI|SECRET SERVICE|NSA)", 15),
    (r"ARRB|JFK Act", 20),
]
```

### CIA Cable Fingerprints

```python
CIA_CABLE_FINGERPRINTS = [
    (r"DIR\s+\d+", 30),
    (r"CITE", 25),
    (r"SECRET|CONFIDENTIAL|TOP SECRET", 20),
    (r"ROUTING", 15),
    (r"MEXI|WAVE", 10),  # Station codes
]
```

---

## 7. Field Extraction Patterns

### Type-Specific Patterns

```python
FIELD_PATTERNS = {
    "FBI_302": {
        "doc_date": r"Date\s+(\d{1,2}/\d{1,2}/\d{2,4})",
        "transcription_date": r"(?:transcribed|dictated).*?(\d{1,2}/\d{1,2}/\d{2,4})",
        "agent_name": r"(?:transcribed by|dictated to)\s+SA\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s+)?[A-Z][a-z]+)",
        "file_number": r"([A-Z]{2}\s*\d{2,3}-\d+)",
        "subject_name": r"^([A-Z][A-Z\s,]+),.*?was interviewed",
    },
    "NARA_RIF": {
        "rif_number": r"(\d{3}-\d{5}-\d{5})",
        "agency": r"AGENCY[:\s]+([A-Z]{2,20})",
        "record_date": r"(?:RECORD DATE|DATE)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4}|\d{4}-\d{2}-\d{2})",
    },
    "MEMO": {
        "to": r"TO[:\s]+(.+?)(?=FROM|DATE|SUBJECT|\n\n)",
        "from": r"FROM[:\s]+(.+?)(?=TO|DATE|SUBJECT|\n\n)",
        "date": r"DATE[:\s]+(.+?)(?=TO|FROM|SUBJECT|\n\n)",
        "subject": r"(?:SUBJECT|RE)[:\s]+(.+?)(?=\n\n)",
    },
}
```

---

## 8. Confidence Scoring

### Classification Confidence

| Score Range | Label | Action |
|-------------|-------|--------|
| 90-100% | HIGH | Auto-apply extraction |
| 70-89% | MEDIUM | Apply with review flag |
| 50-69% | LOW | Show alternatives to user |
| <50% | UNKNOWN | Fall back to generic parser |

### Field Confidence

Each extracted field carries its own confidence:

```python
@dataclass
class ExtractedField:
    value: str
    confidence: float  # 0.0 - 1.0
    source_zone: str   # "header", "body", "footer"
    pattern_used: str  # Which regex matched
```

---

## 9. Integration Points

### With Metadata Parser

```python
# metadata_parser.py integration
class MetadataParser:
    def parse(self, text: str, include_footer: bool = True) -> ParsedMetadata:
        # NEW: Classify first
        doc_type = classify_document(text)
        
        if doc_type.confidence >= 0.7:
            # Use type-specific extraction
            return extract_by_zone(text, doc_type)
        else:
            # Fall back to current blind regex
            return self._parse_generic(text, include_footer)
```

### With Entity Matcher

```python
# Extracted fields feed entity matcher
extracted = layout_analyzer.extract(ocr_text)

# Subject name → person lookup
if extracted.subject_name:
    matches = entity_matcher.find_matches(extracted.subject_name.value)
```

### With OCR Server API

```python
@app.route("/api/parse-metadata", methods=["POST"])
def parse_metadata_endpoint():
    text = request.json.get("text")
    
    # Classify and extract
    result = layout_analyzer.analyze(text)
    
    return jsonify({
        "doc_type": result.doc_type.type_id,
        "doc_type_confidence": result.doc_type.confidence,
        "fields": result.to_dict(),
    })
```

---

## 10. Implementation Phases

### Phase 1: Classification Engine (Week 1)
- [ ] Create `document_classifier.py` module
- [ ] Implement fingerprint registry for FBI 302, NARA RIF, MEMO
- [ ] Add classification confidence scoring
- [ ] Unit tests with sample documents

### Phase 2: Zone Extraction (Week 2)
- [ ] Implement zone detection (header/body/footer)
- [ ] Create type-specific field patterns
- [ ] Integrate with `metadata_parser.py`
- [ ] Add field-level confidence scoring

### Phase 3: API Integration (Week 3)
- [ ] Update `/api/parse-metadata` endpoint
- [ ] Add `/api/classify` endpoint for type-only queries
- [ ] Update OCR GUI to display document type
- [ ] Add classification override UI

### Phase 4: Extended Types (Future)
- [ ] Add CIA Cable, HSCA, Warren Commission types
- [ ] Implement margin zone detection
- [ ] Add table detection for structured data
- [ ] ML-based classification fallback

---

## 11. File Structure

```
tools/
├── ocr-gui/
│   ├── metadata_parser.py      # Existing (updated)
│   ├── document_classifier.py  # NEW - classification engine
│   ├── zone_extractor.py       # NEW - zone-based extraction
│   └── fingerprints/           # NEW - type fingerprint configs
│       ├── fbi_302.py
│       ├── nara_rif.py
│       ├── cia_cable.py
│       └── memo.py
├── ocr-server.py               # Updated API endpoints
```

---

## 12. Success Criteria

| Metric | Target |
|--------|--------|
| Classification accuracy (FBI 302) | >95% |
| Classification accuracy (NARA RIF) | >95% |
| Field extraction completeness | >80% of available fields |
| False positive rate | <5% |
| Processing time overhead | <100ms per document |

---

## 13. Test Documents Needed

- [ ] 10x FBI FD-302 forms (various field offices)
- [ ] 10x NARA RIF cover sheets
- [ ] 5x CIA cables
- [ ] 5x Generic memos
- [ ] 5x Warren Commission exhibits
- [ ] 5x Edge cases (poor OCR, mixed types)

---

*Plan created: February 23, 2026*
