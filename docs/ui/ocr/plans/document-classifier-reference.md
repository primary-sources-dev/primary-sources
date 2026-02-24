# Document Classifier Reference

Technical documentation for the Document Layout Analyzer's classification engine.

## Overview

The Document Classifier (`tools/ocr-gui/document_classifier.py`) identifies document types from OCR text using weighted fingerprint pattern matching. It supports 15 document types commonly found in historical research archives.

## Supported Document Types

| Type | Code | Description |
|------|------|-------------|
| FBI Interview Form | `FBI_302` | FD-302 interview reports |
| FBI Report | `FBI_REPORT` | Airtels, teletypes, lab reports |
| NARA Record | `NARA_RIF` | National Archives RIF records |
| CIA Cable | `CIA_CABLE` | Classified communications |
| Memorandum | `MEMO` | Internal memos |
| Letter | `LETTER` | Correspondence |
| Travel Document | `TRAVEL_DOCUMENT` | Passports, visas, vaccination records |
| WC Exhibit | `WC_EXHIBIT` | Warren Commission exhibits |
| WC Testimony | `WC_TESTIMONY` | Formal hearing transcripts |
| WC Deposition | `WC_DEPOSITION` | Q&A depositions |
| WC Affidavit | `WC_AFFIDAVIT` | Sworn statements |
| Police Report | `POLICE_REPORT` | Dallas PD/Sheriff reports |
| Senate Report | `SENATE_REPORT` | Congressional committee reports |
| Church Committee | `CHURCH_COMMITTEE` | Church Committee (1975-76) documents |
| HSCA Document | `HSCA_DOC` | HSCA working documents |
| HSCA Report | `HSCA_REPORT` | HSCA Final Report narrative |
| Unknown | `UNKNOWN` | Unclassified documents |

## Classification Algorithm

The classifier uses a **two-stage approach**:

1. **Stage 1: Regex Fingerprinting** — Fast pattern matching against known document signatures
2. **Stage 2: Fuzzy Fallback** — Levenshtein distance matching for garbled OCR text

### 1. Text Preprocessing

```python
def preprocess_text(text: str) -> str:
    # Rejoin hyphenated line breaks (OCR artifact)
    text = re.sub(r'-\n', '', text)
    # Normalize multiple spaces
    text = re.sub(r' +', ' ', text)
    return text
```

### 2. Sample Extraction

The classifier examines three text zones:
- **Header**: First 20 lines (title, metadata)
- **Footer**: Last 10 lines (page numbers, signatures)
- **Body**: First 3000 characters (for narrative documents)

### 3. Fuzzy Fingerprinting (Levenshtein Fallback)

When regex-based classification produces confidence below 50%, the classifier applies **Levenshtein distance matching** using RapidFuzz against canonical fingerprint strings.

**Example**: Garbled OCR text `"FEDIRAL EUREAU OF INVESTGATION"` matches canonical `"FEDERAL BUREAU OF INVESTIGATION"` at ~90% similarity, allowing correct classification as FBI_302.

```python
from rapidfuzz import fuzz

# Fuzzy match example
score = fuzz.partial_ratio("FEDERAL BUREAU OF INVESTIGATION", garbled_text)
# Returns 0-100 similarity score
```

**Confidence Boosting Rules:**
- If fuzzy agrees with regex: Combined confidence = max(regex_score, fuzzy_score * 0.9)
- If fuzzy overrides regex (>15% more confident): Use fuzzy result with 0.85 penalty

**Benefits:**
- Recovers ~2.3x improvement on garbled documents
- Prevents misclassification of degraded scans
- Maintains speed for clean documents (fuzzy only triggers below 50%)

### 3. Fingerprint Matching

Each document type has weighted regex patterns ("fingerprints"):

```python
FINGERPRINTS = {
    DocType.FBI_302: [
        (r"FEDERAL BUREAU OF INVESTIGATION", 30),
        (r"FD.?302", 25),
        (r"DL\s*(?:89|44|100)-\d+", 25),  # Dallas field office
        (r"was interviewed", 15),
        ...
    ],
    ...
}
```

### 4. Score Calculation

```python
total_weight = sum(weight for pattern, weight in fingerprints)
matched_weight = sum(weight for pattern, weight in fingerprints if re.search(pattern, text))
confidence = matched_weight / total_weight
```

### 5. Classification Decision

```python
if best_score < 0.10:  # 10% threshold
    return DocType.UNKNOWN
else:
    return best_matching_type
```

## API Reference

### `classify_document(text: str) -> ClassificationResult`

Main classification function.

**Parameters:**
- `text`: Full OCR text from document page

**Returns:** `ClassificationResult` dataclass with:
- `doc_type`: `DocType` enum value
- `confidence`: Float 0.0-1.0
- `matched_patterns`: List of pattern strings that matched
- `header_sample`: First N lines used for classification

**Example:**
```python
from document_classifier import classify_document

result = classify_document(ocr_text)
print(f"Type: {result.doc_type.value}")
print(f"Confidence: {result.confidence:.0%}")
```

### `get_all_scores(text: str) -> dict[DocType, float]`

Returns confidence scores for all document types.

**Parameters:**
- `text`: Full OCR text

**Returns:** Dictionary mapping each `DocType` to its confidence score

**Example:**
```python
from document_classifier import get_all_scores

scores = get_all_scores(ocr_text)
for doc_type, score in sorted(scores.items(), key=lambda x: -x[1])[:3]:
    print(f"{doc_type.value}: {score:.1%}")
```

### `get_zone_config(doc_type: DocType) -> dict`

Returns zone configuration for a document type.

**Returns:** Dictionary with:
- `header_lines`: Number of lines in header zone
- `footer_lines`: Number of lines in footer zone
- `header_fields`: Expected fields in header
- `footer_fields`: Expected fields in footer
- `body_fields`: Expected fields in body

## Performance Metrics

Tested across 395 sample pages from 4 collections:

| Collection | Classification Rate | UNKNOWN Rate |
|------------|---------------------|--------------|
| HSCA Report | 96.7% | 3.3% |
| Church Committee | 84.0% | 16.0% |
| Yates Documents | 76.7% | 23.3% |
| Warren Commission | 70.4% | 29.6% |
| **Overall** | **75.4%** | **24.6%** |

*Note: UNKNOWN pages in exhibit volumes (WC 16-26) are primarily image-only scans with no extractable text.*

## Adding New Document Types

### 1. Add to DocType Enum

```python
class DocType(Enum):
    NEW_TYPE = "NEW_TYPE"
```

### 2. Add Fingerprint Patterns

```python
FINGERPRINTS = {
    DocType.NEW_TYPE: [
        (r"PATTERN_1", weight),
        (r"PATTERN_2", weight),
        ...
    ],
}
```

### 3. Add Zone Configuration

```python
ZONE_CONFIG = {
    DocType.NEW_TYPE: {
        "header_lines": 15,
        "footer_lines": 5,
        "header_fields": ["field1", "field2"],
        "footer_fields": ["page_number"],
        "body_fields": ["content"],
    },
}
```

### 4. Add Extraction Patterns (in zone_extractor.py)

```python
NEW_TYPE_PATTERNS = [
    (r"(pattern)", "field_name", "zone", confidence),
]

TYPE_PATTERNS[DocType.NEW_TYPE] = NEW_TYPE_PATTERNS
```

## Troubleshooting

### Low Confidence Scores

- Check for OCR artifacts breaking patterns
- Add OCR-tolerant pattern variants (e.g., `F.?D.?302` for FD-302)
- Increase pattern weights for reliable indicators

### False Positives

- Add negative patterns or increase threshold
- Make patterns more specific
- Check for overlapping patterns between types

### Image-Only Pages

Pages with no extractable text will always return `UNKNOWN`. Consider:
- Running OCR again with different settings
- Marking as image exhibit type

## File Locations

- **Classifier**: `tools/ocr-gui/document_classifier.py`
- **Extractor**: `tools/ocr-gui/zone_extractor.py`
- **Test Scripts**: `tools/*_test.py`
- **Output**: `tools/output/`

## Version History

| Date | Changes |
|------|---------|
| 2026-02-24 | Added LETTER and TRAVEL_DOCUMENT types (now 17 total) |
| 2026-02-24 | Improved WC_EXHIBIT patterns, overall rate 75.4% |
| 2026-02-24 | Added 6 document types (FBI_REPORT, WC_DEPOSITION, WC_AFFIDAVIT, POLICE_REPORT, SENATE_REPORT, CHURCH_COMMITTEE) |
| 2026-02-24 | Improved FBI 302 OCR tolerance |
| 2026-02-24 | Lowered classification threshold to 10% |
| 2026-02-23 | Added WC_TESTIMONY, HSCA_REPORT types |
| 2026-02-23 | Initial implementation with 8 types |
