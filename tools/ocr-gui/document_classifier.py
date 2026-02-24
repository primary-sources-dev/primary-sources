"""
document_classifier.py — Document Type Classification Engine

Identifies archival document types (FBI 302, NARA RIF, CIA Cable, Memo, etc.)
by matching textual fingerprints against OCR output. Enables type-specific
extraction rules in the metadata parser.

Part of the Document Layout Analyzer (WO-OCR-010).

See: docs/ui/ocr/plans/document-layout-analyzer.md
"""

import re
from dataclasses import dataclass
from typing import Optional
from enum import Enum


class DocType(Enum):
    """Supported document type identifiers."""
    FBI_302 = "FBI_302"
    NARA_RIF = "NARA_RIF"
    CIA_CABLE = "CIA_CABLE"
    MEMO = "MEMO"
    WC_EXHIBIT = "WC_EXHIBIT"
    WC_TESTIMONY = "WC_TESTIMONY"
    HSCA_DOC = "HSCA_DOC"
    HSCA_REPORT = "HSCA_REPORT"  # HSCA Final Report narrative
    UNKNOWN = "UNKNOWN"


@dataclass
class ClassificationResult:
    """Result of document type classification."""
    doc_type: DocType
    confidence: float  # 0.0 - 1.0
    matched_patterns: list[str]
    header_sample: str  # First N lines used for classification
    
    @property
    def confidence_label(self) -> str:
        """Human-readable confidence level."""
        if self.confidence >= 0.9:
            return "HIGH"
        elif self.confidence >= 0.7:
            return "MEDIUM"
        elif self.confidence >= 0.5:
            return "LOW"
        else:
            return "UNCERTAIN"
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dictionary."""
        return {
            "doc_type": self.doc_type.value,
            "confidence": round(self.confidence, 3),
            "confidence_label": self.confidence_label,
            "matched_patterns": self.matched_patterns,
        }


# =============================================================================
# FINGERPRINT REGISTRY
# =============================================================================
# Each fingerprint is a tuple: (regex_pattern, weight)
# Higher weight = stronger indicator of document type
# Max possible score per type is sum of all weights

FINGERPRINTS = {
    DocType.FBI_302: [
        (r"FEDERAL BUREAU OF INVESTIGATION", 30),
        (r"F.?D.?E.?R.?A.?L\s+BUREAU", 20),  # OCR-tolerant
        (r"FD.?302", 25),  # Handles FD-302, FD~302, FD 302
        (r"FD.?302.?a", 20),
        (r"Date.{0,5}(?:of\s+)?transcription", 20),
        (r"was interviewed", 15),
        (r"transcribed by SA", 20),
        (r"dictated\s+\d{1,2}/\d{1,2}/\d{2,4}", 15),
        (r"File\s*(?:#|Number|No)?", 10),
        (r"[A-Z]{2}\s*\d{2,3}-\d+", 15),  # Field office file pattern (DL 89-43)
        (r"at which time .* was interviewed", 10),
        (r"advised as follows", 10),
        (r"on \d{1,2}/\d{1,2}/\d{2,4} at", 10),
        (r"voluntarily\s+(?:appeared|furnished)", 15),  # Common FBI 302 phrase
        (r"Special Agent[s]?\s+of\s+the", 15),
    ],
    
    DocType.NARA_RIF: [
        (r"\d{3}-\d{5}-\d{5}", 40),  # RIF number pattern (e.g., 104-10001-10001)
        (r"RECORD\s+(NUMBER|INFORMATION)", 25),
        (r"JFK ASSASSINATION", 20),
        (r"ARRB", 20),
        (r"JFK Act", 15),
        (r"AGENCY\s*:", 15),
        (r"RECORD NUMBER\s*:", 15),
        (r"RECORD SERIES", 10),
        (r"AGENCY FILE NUMBER", 10),
        (r"ORIGINATOR", 10),
        (r"FROM\s*:\s*(CIA|FBI|SECRET SERVICE|NSA|DIA)", 15),
    ],
    
    DocType.CIA_CABLE: [
        (r"\bDIR\s+\d+", 30),
        (r"\bCITE\b", 25),
        (r"ROUTING", 20),
        (r"TOP SECRET|SECRET|CONFIDENTIAL", 20),
        (r"PRIORITY|IMMEDIATE|ROUTINE", 15),
        (r"MEXI|WAVE|JMWAVE", 15),  # Station codes
        (r"INFO\s*:", 10),
        (r"REF\s*:", 10),
        (r"SUBJ\s*:", 10),
        (r"DTG\s*:", 10),
        (r"CLASSIFIED MESSAGE", 20),
    ],
    
    DocType.MEMO: [
        (r"^\s*TO\s*:", 25),
        (r"^\s*FROM\s*:", 25),
        (r"^\s*DATE\s*:", 20),
        (r"^\s*SUBJECT\s*:|^\s*RE\s*:", 20),
        (r"MEMORANDUM", 30),
        (r"MEMO\s+FOR\s+THE\s+RECORD", 25),
        (r"INTEROFFICE", 15),
        (r"ATTENTION\s*:", 10),
        (r"CC\s*:|COPIES\s+TO\s*:", 10),
    ],
    
    DocType.WC_EXHIBIT: [
        (r"CE-\d{1,4}", 35),  # Commission Exhibit
        (r"CD-\d{1,4}", 30),  # Commission Document
        (r"COMMISSION EXHIBIT", 30),
        (r"WARREN COMMISSION", 25),
        (r"EXHIBIT NO\.", 20),
        (r"PRESIDENT'S COMMISSION", 20),
    ],
    
    DocType.WC_TESTIMONY: [
        (r"TESTIMONY OF\s+", 35),
        (r"The Chairman\.", 30),
        (r"President'?s Commission", 30),
        (r"HEARINGS\s+BEFORE", 25),
        (r"ASSASSINATION.*PRESIDENT.*KENNEDY", 30),
        (r"The\s+Commission\s+met", 20),
        (r"Chief\s+Justice.*Warren", 20),
        (r"Senator\s+(?:Cooper|Russell)", 15),
        (r"Congressman\s+(?:Boggs|Ford)", 15),
        (r"Washington,\s+D\.?C\.?", 10),
        # Questioners (Commission staff counsel)
        (r"Mr\.\s+(?:Rankin|Jenner|Liebeler|Ball|Belin|Specter|Redlich|Stern|Coleman|Slawson|Willens|Goldberg)\.", 25),
        # Commissioners as questioners
        (r"Mr\.\s+(?:Dulles|McCloy)\.", 20),
        # Witness patterns (key witnesses from Vol 1)
        (r"Mrs\.\s+Oswald\.", 20),  # Marina Oswald
        (r"Mr\.\s+Oswald\.", 18),   # Robert Oswald
        # Common testimony Q&A patterns
        (r"(?:Mr\.|Mrs\.)\s+\w+\.\s+(?:Yes|No|That is correct)", 15),
        (r"(?:sir|ma'am)[;\.]", 10),
    ],
    
    DocType.HSCA_DOC: [
        (r"HSCA", 35),
        (r"HOUSE SELECT COMMITTEE", 30),
        (r"House Select Committee on Assassinations", 35),
        (r"RG\s*233", 25),  # Record Group 233
        (r"JFK TASK FORCE", 20),
        (r"SEGREGATED CIA", 15),
        (r"BOX\s+\d+", 10),
        (r"FOLDER", 10),
        # HSCA document references
        (r"HSCA.?(?:JFK|MLK)\s*(?:hearings|Document)", 30),
        (r"MLK\s*Document\s*\d+", 25),
        (r"JFK\s*Document\s*\d+", 25),
        (r"staff\s+summary\s+of\s+interview", 20),
        (r"executive\s+session\s+testimony", 20),
    ],
    
    DocType.HSCA_REPORT: [
        # HSCA Final Report narrative patterns
        (r"the committee(?:'s)?", 20),  # Any "the committee" reference
        (r"committee\s+(?:staff|counsel|investigator|public\s+hearing|noted)", 20),
        (r"Federal\s+Bureau\s+of\s+Investigation", 15),
        (r"Central\s+Intelligence\s+Agency", 15),
        (r"Secret\s+Service", 15),
        (r"Warren\s+Commission", 15),
        (r"the assassination(?:\s+of)?", 20),
        (r"President\s+(?:John\s+F\.?\s+)?Kennedy", 20),
        (r"Dr\.?\s+(?:Martin\s+Luther\s+)?King", 20),
        (r"Lee\s+Harvey\s+Oswald", 20),
        (r"James\s+Earl\s+Ray", 20),
        (r"conspiracy", 15),
        (r"investigation", 15),
        # JFK-specific locations/evidence
        (r"Dealey\s+Plaza", 20),
        (r"Texas\s+School\s+Book\s+Depository", 20),
        (r"grassy\s+knoll", 20),
        (r"Mannlicher.?Carcano", 15),
        (r"motorcade", 15),
        (r"November\s+22,?\s+1963", 20),
    ],
}

# Calculate max possible score for each type (for normalization)
MAX_SCORES = {
    doc_type: sum(weight for _, weight in patterns)
    for doc_type, patterns in FINGERPRINTS.items()
}


# =============================================================================
# CLASSIFICATION ENGINE
# =============================================================================

def extract_header_sample(text: str, num_lines: int = 25) -> str:
    """
    Extract the first N lines for fingerprint matching.
    
    Args:
        text: Full OCR text
        num_lines: Number of lines to extract (default: 25)
        
    Returns:
        First N lines as a single string
    """
    lines = text.split('\n')
    return '\n'.join(lines[:num_lines])


def extract_footer_sample(text: str, num_lines: int = 15) -> str:
    """
    Extract the last N lines for footer analysis.
    
    Args:
        text: Full OCR text
        num_lines: Number of lines to extract (default: 15)
        
    Returns:
        Last N lines as a single string
    """
    lines = text.split('\n')
    return '\n'.join(lines[-num_lines:])


def preprocess_text(text: str) -> str:
    """
    Preprocess OCR text to handle common artifacts.
    - Rejoin words split across lines (e.g., "com-\nmittee" -> "committee")
    """
    import re
    # Rejoin hyphenated line breaks
    text = re.sub(r'-\n', '', text)
    # Normalize multiple spaces
    text = re.sub(r' +', ' ', text)
    return text


def classify_document(text: str, header_lines: int = 25) -> ClassificationResult:
    """
    Classify document type by matching fingerprints against header.

    Args:
        text: Full OCR text to classify
        header_lines: Number of lines to analyze (default: 25)

    Returns:
        ClassificationResult with doc_type, confidence, and matched patterns
    """
    # Preprocess to handle OCR artifacts
    text = preprocess_text(text)
    
    header_sample = extract_header_sample(text, header_lines)

    # Also check footer for FBI 302 (agent signature)
    footer_sample = extract_footer_sample(text, 15)
    
    # For narrative reports (HSCA), also check body content
    body_sample = text[:3000] if len(text) > 3000 else text
    combined_sample = header_sample + "\n" + footer_sample + "\n" + body_sample

    scores: dict[DocType, tuple[float, list[str]]] = {}
    
    for doc_type, patterns in FINGERPRINTS.items():
        score = 0
        matched = []
        
        for pattern, weight in patterns:
            # Use MULTILINE for ^ anchors to work per-line
            flags = re.IGNORECASE | re.MULTILINE
            if re.search(pattern, combined_sample, flags):
                score += weight
                matched.append(pattern)
        
        # Normalize score to 0.0 - 1.0
        max_score = MAX_SCORES[doc_type]
        normalized = score / max_score if max_score > 0 else 0.0
        scores[doc_type] = (normalized, matched)
    
    # Find best match
    best_type = max(scores.keys(), key=lambda t: scores[t][0])
    best_score, best_matches = scores[best_type]
    
    # If best score is too low, return UNKNOWN
    if best_score < 0.15:
        return ClassificationResult(
            doc_type=DocType.UNKNOWN,
            confidence=0.0,
            matched_patterns=[],
            header_sample=header_sample[:500],  # Truncate for storage
        )
    
    return ClassificationResult(
        doc_type=best_type,
        confidence=best_score,
        matched_patterns=best_matches,
        header_sample=header_sample[:500],  # Truncate for storage
    )


def get_all_scores(text: str, header_lines: int = 25) -> dict[str, float]:
    """
    Get classification scores for all document types.
    Useful for debugging and showing alternatives.
    
    Args:
        text: Full OCR text
        header_lines: Number of lines to analyze
        
    Returns:
        Dictionary mapping doc_type names to confidence scores
    """
    header_sample = extract_header_sample(text, header_lines)
    footer_sample = extract_footer_sample(text, 15)
    combined_sample = header_sample + "\n" + footer_sample
    
    results = {}
    
    for doc_type, patterns in FINGERPRINTS.items():
        score = 0
        for pattern, weight in patterns:
            flags = re.IGNORECASE | re.MULTILINE
            if re.search(pattern, combined_sample, flags):
                score += weight
        
        max_score = MAX_SCORES[doc_type]
        normalized = score / max_score if max_score > 0 else 0.0
        results[doc_type.value] = round(normalized, 3)
    
    return dict(sorted(results.items(), key=lambda x: x[1], reverse=True))


# =============================================================================
# ZONE CONFIGURATION
# =============================================================================
# Defines which zones to extract for each document type

ZONE_CONFIG = {
    DocType.FBI_302: {
        "header_lines": 15,
        "footer_lines": 12,
        "header_fields": ["doc_date", "form_id"],
        "footer_fields": ["agent_name", "file_number", "transcription_date"],
        "body_fields": ["subject_name", "location"],
    },
    DocType.NARA_RIF: {
        "header_lines": 25,
        "footer_lines": 5,
        "header_fields": ["rif_number", "agency", "record_date", "classification", "originator"],
        "footer_fields": ["review_date", "release_status"],
        "body_fields": ["title", "description"],
    },
    DocType.CIA_CABLE: {
        "header_lines": 20,
        "footer_lines": 5,
        "header_fields": ["classification", "routing", "cite", "date", "subject"],
        "footer_fields": [],
        "body_fields": ["message_content"],
    },
    DocType.MEMO: {
        "header_lines": 12,
        "footer_lines": 8,
        "header_fields": ["to", "from", "date", "subject"],
        "footer_fields": ["signature", "cc_list"],
        "body_fields": ["content"],
    },
    DocType.WC_EXHIBIT: {
        "header_lines": 10,
        "footer_lines": 5,
        "header_fields": ["exhibit_number", "exhibit_type"],
        "footer_fields": [],
        "body_fields": ["content", "related_testimony"],
    },
    DocType.WC_TESTIMONY: {
        "header_lines": 10,
        "footer_lines": 3,
        "header_fields": ["testimony_date", "witness_name", "session_info"],
        "footer_fields": ["page_number"],
        "body_fields": ["testimony_content", "questioner", "response"],
    },
    DocType.HSCA_DOC: {
        "header_lines": 15,
        "footer_lines": 5,
        "header_fields": ["record_group", "box", "folder"],
        "footer_fields": [],
        "body_fields": ["content"],
    },
    DocType.HSCA_REPORT: {
        "header_lines": 5,
        "footer_lines": 3,
        "header_fields": ["page_number"],
        "footer_fields": ["page_number"],
        "body_fields": ["content", "subjects_mentioned"],
    },
}


def get_zone_config(doc_type: DocType) -> dict:
    """
    Get zone extraction configuration for a document type.
    
    Args:
        doc_type: The classified document type
        
    Returns:
        Zone configuration dictionary
    """
    return ZONE_CONFIG.get(doc_type, {
        "header_lines": 15,
        "footer_lines": 10,
        "header_fields": [],
        "footer_fields": [],
        "body_fields": [],
    })


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def classify(text: str) -> dict:
    """
    Convenience function for API integration.
    
    Args:
        text: OCR text to classify
        
    Returns:
        JSON-serializable classification result
    """
    result = classify_document(text)
    return result.to_dict()


def is_fbi_302(text: str) -> bool:
    """Quick check if document appears to be FBI FD-302."""
    result = classify_document(text)
    return result.doc_type == DocType.FBI_302 and result.confidence >= 0.5


def is_nara_rif(text: str) -> bool:
    """Quick check if document appears to be NARA RIF sheet."""
    result = classify_document(text)
    return result.doc_type == DocType.NARA_RIF and result.confidence >= 0.5


# =============================================================================
# TEST SUITE
# =============================================================================

if __name__ == "__main__":
    import json
    
    # Test samples
    FBI_302_SAMPLE = """
                                    FEDERAL BUREAU OF INVESTIGATION

                                                                Date  11/26/63
    
    RALPH LEON YATES, 2308 Byers, Dallas, Texas, advised that on November 20,
    1963, at approximately 10:30 AM, while driving to work, he picked up a
    young white male hitchhiker...
    
    YATES stated he did not observe the man closely enough to furnish a 
    detailed description.
    
    transcribed by SA C. Ray Hall
    DL 89-43
    on 11/26/63
    """
    
    NARA_RIF_SAMPLE = """
    JFK ASSASSINATION SYSTEM
    
    IDENTIFICATION FORM
    
    AGENCY: CIA
    RECORD NUMBER: 104-10001-10001
    
    RECORD SERIES: JFK
    AGENCY FILE NUMBER: 201-289248
    
    ORIGINATOR: CIA/DO/C
    FROM: MEXICO CITY
    TO: DIRECTOR
    
    TITLE: OSWALD, LEE HARVEY
    DATE: 10/10/63
    """
    
    MEMO_SAMPLE = """
    MEMORANDUM
    
    TO:      Director, FBI
    FROM:    SAC, Dallas
    DATE:    November 25, 1963
    SUBJECT: Lee Harvey Oswald
    
    This is to advise that on November 22, 1963, at approximately 
    12:30 PM, President John F. Kennedy was assassinated...
    """
    
    CIA_CABLE_SAMPLE = """
    SECRET
    
    DIR 84888
    
    CITE MEXI 7025
    
    ROUTING: 3
    
    SUBJ: REPORTED CONTACT WITH SOVIET EMBASSY
    
    REF: MEXI 7024
    
    1. ON 1 OCTOBER 1963 A RELIABLE SOURCE REPORTED...
    """
    
    print("=" * 60)
    print("Document Classifier - Test Suite")
    print("=" * 60)
    
    test_cases = [
        ("FBI 302", FBI_302_SAMPLE),
        ("NARA RIF", NARA_RIF_SAMPLE),
        ("MEMO", MEMO_SAMPLE),
        ("CIA Cable", CIA_CABLE_SAMPLE),
    ]
    
    for name, sample in test_cases:
        print(f"\n--- {name} ---")
        result = classify_document(sample)
        print(f"Classified as: {result.doc_type.value}")
        print(f"Confidence: {result.confidence:.1%} ({result.confidence_label})")
        print(f"Matched patterns: {len(result.matched_patterns)}")
        
        # Show all scores
        print("All scores:")
        scores = get_all_scores(sample)
        for doc_type, score in scores.items():
            if score > 0:
                print(f"  {doc_type}: {score:.1%}")
    
    print("\n" + "=" * 60)
    print("All tests complete")
    print("=" * 60)
