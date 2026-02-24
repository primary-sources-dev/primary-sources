"""
zone_extractor.py — Type-Specific Zone Extraction Engine

Applies targeted extraction patterns based on classified document type.
Each document type has defined zones (header, body, footer) with specific
field patterns optimized for that format.

Part of the Document Layout Analyzer (WO-OCR-010), Phase 2.

See: docs/ui/ocr/plans/document-layout-analyzer.md
"""

import re
from dataclasses import dataclass, field
from typing import Optional, List
from document_classifier import DocType, classify_document, ClassificationResult


@dataclass
class BodySegment:
    """A discrete block of text within the document body."""
    segment_id: int
    label: str  # "QUESTION", "ANSWER", "CLAIM", "PARAGRAPH", "HEADING"
    speaker: str
    text: str
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dictionary."""
        return {
            "id": self.segment_id,
            "label": self.label,
            "speaker": self.speaker,
            "text": self.text
        }


@dataclass
class ExtractedZoneField:
    """A field extracted from a specific document zone."""
    field_name: str
    value: str
    zone: str  # "header", "body", "footer"
    confidence: float  # 0.0 - 1.0
    pattern_name: str
    raw_match: str


@dataclass 
class ZoneExtractionResult:
    """Complete extraction result with zone-aware fields."""
    doc_type: str
    doc_type_confidence: float
    fields: dict[str, ExtractedZoneField] = field(default_factory=dict)
    segments: list[BodySegment] = field(default_factory=list)
    extraction_notes: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dictionary."""
        return {
            "doc_type": self.doc_type,
            "doc_type_confidence": round(self.doc_type_confidence, 3),
            "fields": {
                name: {
                    "value": f.value,
                    "zone": f.zone,
                    "confidence": round(f.confidence, 2),
                    "pattern": f.pattern_name,
                }
                for name, f in self.fields.items()
            },
            "segments": [s.to_dict() for s in self.segments],
            "extraction_notes": self.extraction_notes,
        }
    
    def get(self, field_name: str) -> Optional[str]:
        """Get field value by name, or None if not found."""
        f = self.fields.get(field_name)
        return f.value if f else None


# =============================================================================
# ZONE DEFINITIONS
# =============================================================================

ZONE_CONFIG = {
    DocType.FBI_302: {
        "header_lines": 15,
        "footer_lines": 12,
    },
    DocType.NARA_RIF: {
        "header_lines": 30,
        "footer_lines": 8,
    },
    DocType.CIA_CABLE: {
        "header_lines": 25,
        "footer_lines": 5,
    },
    DocType.MEMO: {
        "header_lines": 15,
        "footer_lines": 10,
    },
    DocType.WC_EXHIBIT: {
        "header_lines": 12,
        "footer_lines": 5,
    },
    DocType.WC_TESTIMONY: {
        "header_lines": 10,
        "footer_lines": 3,
    },
    DocType.HSCA_DOC: {
        "header_lines": 20,
        "footer_lines": 8,
    },
    DocType.HSCA_REPORT: {
        "header_lines": 5,
        "footer_lines": 3,
    },
    DocType.FBI_REPORT: {
        "header_lines": 20,
        "footer_lines": 10,
    },
    DocType.WC_DEPOSITION: {
        "header_lines": 15,
        "footer_lines": 5,
    },
    DocType.WC_AFFIDAVIT: {
        "header_lines": 20,
        "footer_lines": 15,
    },
    DocType.POLICE_REPORT: {
        "header_lines": 20,
        "footer_lines": 10,
    },
    DocType.LETTER: {
        "header_lines": 10,
        "footer_lines": 10,
    },
    DocType.TRAVEL_DOCUMENT: {
        "header_lines": 15,
        "footer_lines": 10,
    },
    DocType.SENATE_REPORT: {
        "header_lines": 10,
        "footer_lines": 5,
    },
    DocType.CHURCH_COMMITTEE: {
        "header_lines": 10,
        "footer_lines": 5,
    },
    DocType.CIA_201: {
        "header_lines": 20,
        "footer_lines": 5,
    },
    DocType.DPD_REPORT: {
        "header_lines": 20,
        "footer_lines": 10,
    },
    DocType.MEDICAL_RECORD: {
        "header_lines": 15,
        "footer_lines": 10,
    },
    DocType.UNKNOWN: {
        "header_lines": 20,
        "footer_lines": 10,
    },
}


# =============================================================================
# TYPE-SPECIFIC FIELD PATTERNS
# =============================================================================

# Each pattern: (regex, field_name, zone, confidence)
# Zone: "header", "footer", "body", "any"

FBI_302_PATTERNS = [
    # Header patterns
    (r"FEDERAL BUREAU OF INVESTIGATION", "form_type", "header", 0.95),
    (r"FD-302\s*(?:\(Rev\.?\s*[\d\-\.]+\))?", "form_version", "header", 0.95),
    (r"Date\s*(?:of\s+transcription)?[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})", "document_date", "header", 0.9),
    (r"File\s*(?:Number|#|No\.?)?[:\s]*([A-Z]{2}\s*\d{2,3}-\d+)", "file_number", "header", 0.9),
    
    # Body patterns - subject identification
    (r"^\s*([A-Z][A-Z\s,\.]+),\s*(?:\d+\s+)?[A-Za-z]+.*?(?:was interviewed|advised|stated)", "subject_name", "body", 0.85),
    (r"([A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)*),\s*\d+\s+[A-Za-z]", "subject_name", "body", 0.8),
    (r"(?:interviewed|contacted)\s+(?:at\s+)?([^,\n]+(?:,\s*[A-Z][a-z]+)?)", "interview_location", "body", 0.7),
    (r"on\s+(?:Wednesday|Thursday|Friday|Monday|Tuesday|Saturday|Sunday)?,?\s*(\w+\s+\d{1,2},?\s+\d{4})", "interview_date", "body", 0.85),
    (r"on\s+(\d{1,2}/\d{1,2}/\d{2,4})\s*(?:,|\s+at)", "interview_date", "body", 0.8),
    
    # Footer patterns (FBI 302 has critical data here)
    (r"(?:transcribed|dictated|typed)\s+by\s+(?:SA\s+)?([A-Z][a-z]+(?:\s+[A-Z]\.?\s+)?[A-Z][a-z]+)", "transcribing_agent", "footer", 0.95),
    (r"^\s*([A-Z]{2}\s*\d{2,3}-\d+)\s*$", "footer_file_number", "footer", 0.9),
    (r"on\s+(\d{1,2}/\d{1,2}/\d{2,4})\s*$", "transcription_date", "footer", 0.85),
    
    # Any zone fallbacks
    (r"([A-Z]{2}\s+\d{2,3}-\d+)", "file_number", "any", 0.75),
    (r"SA\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s+)?[A-Z][a-z]+)", "agent_name", "any", 0.8),
]

NARA_RIF_PATTERNS = [
    # Header patterns  
    (r"RECORD\s*NUMBER[:\s]*(\d{3}-\d{5}-\d{5})", "rif_number", "header", 0.98),
    (r"(\d{3}-\d{5}-\d{5})", "rif_number", "any", 0.95),
    (r"AGENCY[:\s]*([A-Z]{2,20})", "agency", "header", 0.95),
    (r"AGENCY\s+FILE\s+NUMBER[:\s]*([A-Z0-9\-]+)", "agency_file_number", "header", 0.9),
    (r"RECORD\s+SERIES[:\s]*(.+?)(?:\n|$)", "record_series", "header", 0.85),
    (r"ORIGINATOR[:\s]*([A-Z/]+)", "originator", "header", 0.85),
    (r"FROM[:\s]*([A-Z\s]+?)(?:\n|TO:|$)", "from_station", "header", 0.8),
    (r"TO[:\s]*([A-Z\s]+?)(?:\n|FROM:|$)", "to_station", "header", 0.8),
    (r"TITLE[:\s]*(.+?)(?:\n|$)", "title", "header", 0.85),
    (r"(?:DOCUMENT\s+)?DATE[:\s]*(\d{1,2}/\d{1,2}/\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})", "document_date", "header", 0.9),
    
    # Classification
    (r"(TOP\s+SECRET|SECRET|CONFIDENTIAL|UNCLASSIFIED)", "classification", "any", 0.9),
    
    # Footer patterns
    (r"REVIEW\s+DATE[:\s]*(\d{1,2}/\d{1,2}/\d{2,4})", "review_date", "footer", 0.85),
    (r"(RELEASED|POSTPONED|WITHHELD)", "release_status", "footer", 0.8),
]

CIA_CABLE_PATTERNS = [
    # Header patterns
    (r"DIR\s+(\d+)", "dir_number", "header", 0.95),
    (r"CITE\s+([A-Z]+\s*\d+)", "cite_number", "header", 0.95),
    (r"(TOP\s+SECRET|SECRET|CONFIDENTIAL)", "classification", "header", 0.95),
    (r"ROUTING[:\s]*(\d+)", "routing", "header", 0.85),
    (r"SUBJ[:\s]*(.+?)(?:\n|$)", "subject", "header", 0.9),
    (r"REF[:\s]*(.+?)(?:\n|$)", "reference", "header", 0.85),
    (r"DTG[:\s]*(\d+Z?\s+\w+\s+\d+)", "date_time_group", "header", 0.9),
    (r"INFO[:\s]*(.+?)(?:\n|$)", "info_addressees", "header", 0.8),
    (r"(MEXI|WAVE|JMWAVE|DIRECTOR)", "station", "any", 0.8),
]

MEMO_PATTERNS = [
    # Header patterns
    (r"TO[:\s]+(.+?)(?:\n|FROM|DATE|SUBJECT)", "to", "header", 0.95),
    (r"FROM[:\s]+(.+?)(?:\n|TO|DATE|SUBJECT)", "from", "header", 0.95),
    (r"DATE[:\s]+(.+?)(?:\n|TO|FROM|SUBJECT)", "date", "header", 0.95),
    (r"(?:SUBJECT|SUBJ|RE)[:\s]+(.+?)(?:\n\n|\n[A-Z]+:)", "subject", "header", 0.95),
    (r"ATTENTION[:\s]+(.+?)(?:\n|$)", "attention", "header", 0.8),
    
    # Footer patterns
    (r"(?:Signed|Signature)[:\s]*(.+?)(?:\n|$)", "signature", "footer", 0.8),
    (r"(?:CC|Copies?\s+to)[:\s]*(.+?)(?:\n\n|$)", "cc_list", "footer", 0.75),
]

WC_EXHIBIT_PATTERNS = [
    # Header patterns
    (r"(?:COMMISSION\s+)?EXHIBIT\s+(?:NO\.?\s*)?(CE-?\d+|CD-?\d+)", "exhibit_number", "header", 0.98),
    (r"(CE-\d{1,4})", "exhibit_number", "any", 0.95),
    (r"(CD-\d{1,4})", "document_number", "any", 0.95),
    (r"HEARINGS.*?VOL(?:UME)?\.?\s*(\d+)", "volume", "any", 0.85),
    (r"PAGE\s*(\d+)", "page", "any", 0.8),
]

WC_TESTIMONY_PATTERNS = [
    # Header patterns
    (r"TESTIMONY\s+OF\s+(?:MRS?\.\s+)?([A-Z][A-Z\s\.,]{2,50}?)[\n\r]", "witness_name", "header", 0.95),
    (r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\w+\s+\d{1,2},?\s+\d{4})", "testimony_date", "header", 0.9),
    (r"President'?s\s+Commission", "commission", "header", 0.85),
    # Questioner patterns (Commission counsel)
    (r"Mr\.\s+(Rankin|Jenner|Liebeler|Ball|Belin|Specter|Redlich|Stern|Coleman|Slawson|Willens|Goldberg)\.", "questioner", "body", 0.85),
    # Commissioners as questioners
    (r"Mr\.\s+(Dulles|McCloy)\.", "commissioner_questioner", "body", 0.85),
    (r"The\s+Chairman\.", "questioner_chairman", "body", 0.9),
    # Witness response patterns (generalized)
    (r"(?:Mr\.|Mrs\.)\s+(\w+)\.\s+(?:Yes|No|That is correct)", "witness_response", "body", 0.8),
    # Volume/page
    (r"(?:^|\s)(\d{1,3})(?:\s|$)", "page", "footer", 0.7),
]

HANDWRITTEN_NOTES_PATTERNS = [
    (r"(scribe|notes|notes|memo|informal)", "note_type", "header", 0.8),
    (r"(\d{1,2}/\d{1,2}/\d{2,4})", "note_date", "any", 0.7),
]

CIA_201_PATTERNS = [
    (r"201-(\d{6,8})", "personality_file_number", "header", 0.98),
    (r"SUBJECT[:\s]+(.+?)(?:\n|$)", "subject", "header", 0.95),
    (r"Cryptonym[:\s]+([A-Z/]+)", "cryptonym", "header", 0.9),
    (r"Project[:\s]+([A-Z0-9\-]+)", "project", "header", 0.85),
    (r"P/F\s*[:\.]\s*(.+?)(?:\n|$)", "personality_file", "header", 0.8),
]

DPD_REPORT_PATTERNS = [
    (r"DALLAS\s+POLICE\s+DEPARTMENT", "department", "header", 0.95),
    (r"DALLAS\s+SHERIFF", "department", "header", 0.9),
    (r"SUPPLEMENTARY\s+INVESTIGATION", "report_type", "header", 0.95),
    (r"(?:CASE|REPORT|SERIAL)\s+(?:NO\.?|NUMBER|#)\s*:?\s*(\S+)", "case_number", "header", 0.9),
    (r"(?:OFFICE\s+OF\s+)?CHIEF\s+OF\s+POLICE", "office", "header", 0.85),
    (r"Reporting\s+Officer\s*[:\.]\s*(.+?)(?:\n|$)", "reporting_officer", "footer", 0.95),
]

MEDICAL_RECORD_PATTERNS = [
    (r"HOSPITAL|CLINIC", "facility_type", "header", 0.85),
    (r"MEDICAL\s+RECORD", "record_type", "header", 0.95),
    (r"PATIENT\s*[:\.]\s*(.+?)(?:\n|$)", "patient_name", "header", 0.95),
    (r"DIAGNOSIS\s*[:\.]\s*(.+?)(?:\n\n|$)", "diagnosis", "body", 0.9),
    (r"TREATMENT\s*[:\.]\s*(.+?)(?:\n\n|$)", "treatment", "body", 0.85),
    (r"Physician\s*[:\.]\s*(.+?)(?:\n|$)", "physician", "footer", 0.9),
]

HSCA_PATTERNS = [
    # Header patterns
    (r"RG\s*(\d+)", "record_group", "header", 0.9),
    (r"BOX\s*(\d+)", "box_number", "header", 0.85),
    (r"FOLDER[:\s]*(.+?)(?:\n|$)", "folder", "header", 0.85),
    (r"HSCA\s+(?:RECORD\s+)?(?:NO\.?\s*)?(\d+)", "hsca_number", "any", 0.9),
    # HSCA Report patterns
    (r"(?:MLK|JFK)\s*Document\s*(\d+)", "document_number", "any", 0.9),
    (r"HSCA.?(?:MLK|JFK)\s*(?:hearings|Hearings)", "hearing_type", "any", 0.85),
    (r"House\s+Select\s+Committee\s+on\s+Assassinations", "committee_name", "any", 0.9),
    (r"(?:staff\s+summary|executive\s+session)\s+(?:of\s+)?(?:interview|testimony)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "witness_name", "any", 0.85),
    (r"(?:^|\s)(\d{1,3})(?:\s|$)", "page", "footer", 0.7),
]

HSCA_REPORT_PATTERNS = [
    # Page number (usually at top or bottom)
    (r"^(\d{1,3})$", "page_number", "any", 0.8),
    # Key subjects mentioned in narrative
    (r"(Lee Harvey Oswald)", "subject_oswald", "body", 0.9),
    (r"(James Earl Ray)", "subject_ray", "body", 0.9),
    (r"(President Kennedy|President John F Kennedy)", "subject_jfk", "body", 0.9),
    (r"(Dr\.? King|Martin Luther King)", "subject_mlk", "body", 0.9),
    # Investigation subjects
    (r"(Warren Commission)", "ref_warren", "body", 0.85),
    (r"(Federal Bureau of Investigation|FBI)", "ref_fbi", "body", 0.85),
    (r"(Central Intelligence Agency|CIA)", "ref_cia", "body", 0.85),
    (r"(Secret Service)", "ref_ss", "body", 0.85),
    # Findings language
    (r"the committee\s+(concluded|determined|found)", "finding_type", "body", 0.8),
]

FBI_REPORT_PATTERNS = [
    # Header fields
    (r"TO\s*:\s*(.+?)(?:\n|FROM)", "to", "header", 0.9),
    (r"FROM\s*:\s*(.+?)(?:\n|DATE|SUBJECT|RE)", "from", "header", 0.9),
    (r"(?:DATE|DATED)\s*:\s*(.+?)(?:\n|$)", "date", "header", 0.85),
    (r"(?:RE|SUBJECT)\s*:\s*(.+?)(?:\n|$)", "subject", "header", 0.85),
    (r"BUFILE\s*(?:NO\.?)?\s*(\d+-\d+)", "bufile", "any", 0.9),
    (r"(?:AIRTEL|TELETYPE)", "communication_type", "header", 0.8),
]

WC_DEPOSITION_PATTERNS = [
    # Header
    (r"DEPOSITION\s+OF\s+(.+?)(?:\n|,|taken)", "deponent", "header", 0.95),
    (r"(?:taken|held)\s+(?:at|on)\s+(.+?)(?:\n|$)", "location_date", "header", 0.85),
    # Q&A patterns
    (r"Q\.\s+(.+?)(?:\n|A\.)", "question", "body", 0.8),
    (r"A\.\s+(.+?)(?:\n|Q\.)", "answer", "body", 0.8),
    (r"BY\s+(?:MR\.|MS\.)\s+(\w+):", "questioner", "body", 0.85),
    # Footer
    (r"(?:COURT REPORTER|Notary)\s*:?\s*(.+?)(?:\n|$)", "reporter", "footer", 0.8),
]

WC_AFFIDAVIT_PATTERNS = [
    # Header - state/county
    (r"STATE\s+OF\s+([A-Z]+)", "state", "header", 0.95),
    (r"COUNTY\s+OF\s+([A-Z]+)", "county", "header", 0.95),
    # Affiant
    (r"(?:I,|affiant,?)\s+([A-Z][A-Za-z\s\.]+),?\s+(?:being|do)", "affiant", "header", 0.9),
    # Footer - notary
    (r"NOTARY\s+PUBLIC[,:]?\s*(.+?)(?:\n|$)", "notary", "footer", 0.9),
    (r"(?:My\s+)?[Cc]ommission\s+[Ee]xpires\s*:?\s*(.+?)(?:\n|$)", "commission_expires", "footer", 0.85),
    (r"(?:Sworn|Subscribed).*?(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+)", "date_sworn", "footer", 0.85),
]

POLICE_REPORT_PATTERNS = [
    # Header - department/report type
    (r"DALLAS\s+(?:POLICE|COUNTY)\s*(?:DEPARTMENT)?", "department", "header", 0.95),
    (r"SHERIFF'?S?\s+(?:DEPARTMENT|OFFICE)", "department", "header", 0.95),
    (r"(?:OFFENSE|INCIDENT|SUPPLEMENTARY)\s+(?:REPORT|INVESTIGATION)", "report_type", "header", 0.9),
    (r"(?:CASE|REPORT|SERIAL)\s+(?:NO\.?|NUMBER|#)\s*:?\s*(\S+)", "case_number", "header", 0.9),
    # Content
    (r"(?:COMPLAINANT|VICTIM)\s*:?\s*(.+?)(?:\n|$)", "complainant", "body", 0.85),
    (r"(?:OFFENSE|CRIME)\s*:?\s*(.+?)(?:\n|$)", "offense", "body", 0.85),
    # Footer - officer
    (r"(?:INVESTIGATING|REPORTING)\s+OFFICER\s*:?\s*(.+?)(?:\n|$)", "officer", "footer", 0.9),
    (r"BADGE\s+(?:NO\.?|#)\s*:?\s*(\S+)", "badge", "footer", 0.85),
]

LETTER_PATTERNS = [
    # Header
    (r"(\w+\s+\d{1,2},?\s+\d{4})", "date", "header", 0.85),
    (r"Dear\s+(.+?)(?:\n|$)", "addressee", "header", 0.9),
    # Body
    (r"(enclos(?:ed|ure))", "has_enclosure", "body", 0.8),
    # Footer
    (r"(?:Sincerely|Respectfully|Yours truly),?\s*\n(.+?)(?:\n|$)", "signature", "footer", 0.9),
]

TRAVEL_DOCUMENT_PATTERNS = [
    # Header
    (r"(?:PASSPORT|VISA)\s*(?:NO\.?|NUMBER)?\s*:?\s*(\S+)", "document_number", "header", 0.9),
    (r"(?:Name|HOLDER|NOM)\s*:?\s*(.+?)(?:\n|$)", "holder_name", "header", 0.85),
    (r"(?:Nationality|NATIONALITE)\s*:?\s*(.+?)(?:\n|$)", "nationality", "header", 0.85),
    # Body
    (r"(?:Date\s+of\s+)?(?:Birth|BIRTH)\s*:?\s*(.+?)(?:\n|$)", "date_of_birth", "body", 0.8),
    (r"(?:Place\s+of\s+)?(?:Birth|BIRTH)\s*:?\s*(.+?)(?:\n|$)", "place_of_birth", "body", 0.8),
    # Footer
    (r"(?:Issued|DATE)\s*:?\s*(.+?)(?:\n|$)", "date_issued", "footer", 0.8),
]

SENATE_REPORT_PATTERNS = [
    # Header
    (r"(\d{1,3}(?:st|nd|rd|th)\s+(?:CONGRESS|Congress))", "congress", "header", 0.9),
    (r"(\d{1,2}(?:st|nd|rd|th)\s+Session)", "session", "header", 0.85),
    (r"REPORT\s+(?:No\.?|NUMBER)\s*(\S+)", "report_number", "header", 0.9),
    # Body
    (r"(SELECT\s+COMMITTEE)", "committee_type", "body", 0.85),
    (r"(SUBCOMMITTEE\s+ON\s+.+?)(?:\n|$)", "subcommittee", "body", 0.8),
    # Page
    (r"^(\d{1,3})$", "page_number", "footer", 0.8),
]

CHURCH_COMMITTEE_PATTERNS = [
    # Header
    (r"BOOK\s+(I{1,3}|IV|V)", "book_number", "header", 0.95),
    (r"(?:CHAPTER|SECTION)\s+(\S+)", "chapter", "header", 0.85),
    # Body - key topics
    (r"(CIA\s+(?:operations?|activities?|programs?))", "cia_topic", "body", 0.85),
    (r"(FBI\s+(?:operations?|activities?|programs?))", "fbi_topic", "body", 0.85),
    (r"(COINTELPRO)", "cointelpro", "body", 0.95),
    (r"(intelligence\s+community)", "intel_community", "body", 0.8),
    (r"(covert\s+(?:action|operations?))", "covert_action", "body", 0.85),
    (r"(assassination\s+(?:plot|attempt|report))", "assassination", "body", 0.9),
    # Page
    (r"^(\d{1,3})$", "page_number", "footer", 0.8),
]

# Map doc types to their patterns
TYPE_PATTERNS = {
    DocType.FBI_302: FBI_302_PATTERNS,
    DocType.FBI_REPORT: FBI_REPORT_PATTERNS,
    DocType.NARA_RIF: NARA_RIF_PATTERNS,
    DocType.CIA_CABLE: CIA_CABLE_PATTERNS,
    DocType.CIA_201: CIA_201_PATTERNS,
    DocType.MEMO: MEMO_PATTERNS,
    DocType.LETTER: LETTER_PATTERNS,
    DocType.TRAVEL_DOCUMENT: TRAVEL_DOCUMENT_PATTERNS,
    DocType.WC_EXHIBIT: WC_EXHIBIT_PATTERNS,
    DocType.WC_TESTIMONY: WC_TESTIMONY_PATTERNS,
    DocType.WC_DEPOSITION: WC_DEPOSITION_PATTERNS,
    DocType.WC_AFFIDAVIT: WC_AFFIDAVIT_PATTERNS,
    DocType.POLICE_REPORT: POLICE_REPORT_PATTERNS,
    DocType.DPD_REPORT: DPD_REPORT_PATTERNS,
    DocType.MEDICAL_RECORD: MEDICAL_RECORD_PATTERNS,
    DocType.SENATE_REPORT: SENATE_REPORT_PATTERNS,
    DocType.CHURCH_COMMITTEE: CHURCH_COMMITTEE_PATTERNS,
    DocType.HSCA_DOC: HSCA_PATTERNS,
    DocType.HSCA_REPORT: HSCA_REPORT_PATTERNS,
    DocType.HANDWRITTEN_NOTES: HANDWRITTEN_NOTES_PATTERNS,
}


# =============================================================================
# EXTRACTION ENGINE
# =============================================================================

def extract_zones(text: str, doc_type: DocType) -> tuple[str, str, str]:
    """
    Split document into header, body, and footer zones.
    
    Args:
        text: Full OCR text
        doc_type: Classified document type
        
    Returns:
        Tuple of (header_text, body_text, footer_text)
    """
    config = ZONE_CONFIG.get(doc_type, ZONE_CONFIG[DocType.UNKNOWN])
    lines = text.split('\n')
    
    header_count = config["header_lines"]
    footer_count = config["footer_lines"]
    
    # Handle short documents
    total_lines = len(lines)
    if total_lines <= header_count + footer_count:
        # Document too short - treat as all header
        return text, "", ""
    
    header = '\n'.join(lines[:header_count])
    footer = '\n'.join(lines[-footer_count:])
    body = '\n'.join(lines[header_count:-footer_count])
    
    return header, body, footer


def segment_body(body_text: str, doc_type: DocType) -> List[BodySegment]:
    """
    Apply type-specific segmentation to the body text.
    
    Args:
        body_text: Narrative section of the document
        doc_type: Classified document type
        
    Returns:
        List of BodySegment objects
    """
    if not body_text.strip():
        return []

    # Choose segmenter based on type
    if doc_type in [DocType.WC_TESTIMONY, DocType.WC_DEPOSITION, DocType.WC_AFFIDAVIT]:
        return _segment_qa_format(body_text)
    elif doc_type == DocType.CIA_CABLE:
        return _segment_numbered_blocks(body_text)
    else:
        # Default: split by double newline (paragraphs)
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', body_text) if p.strip()]
        return [BodySegment(i, "PARAGRAPH", "", p) for i, p in enumerate(paragraphs)]


def _segment_qa_format(text: str) -> List[BodySegment]:
    """Segments testimony/deposition into Q&A blocks."""
    segments = []
    
    # Speaker pattern: Handles Mr. J. L. RANKIN, THE CHAIRMAN, Q./A.
    # Uses a greedy match for the name that stops at a period followed by space or newline.
    speaker_pattern = re.compile(
        r'^\s*((?:Mr\.|Mrs\.|Miss|Ms\.)\s+[A-Z\.\s]+?\.|\bThe\s+CHAIRMAN\.|\bQ\.|\bA\.)', 
        re.MULTILINE
    )
    
    matches = list(speaker_pattern.finditer(text))
    
    # Capture leading text before the first speaker (e.g. "Present" list)
    if matches and matches[0].start() > 0:
        intro_text = text[0:matches[0].start()].strip()
        if intro_text:
            segments.append(BodySegment(0, "INTRO", "", intro_text))
    
    if not matches:
        return [BodySegment(0, "PARAGRAPH", "", text.strip())]
    
    COUNSEL = {
        "SPECTER", "RANKIN", "JENNER", "LIEBELER", "BALL", "BELIN", 
        "REDLICH", "STERN", "COLEMAN", "SLAWSON", "WILLENS", "GOLDBERG", 
        "CHAIRMAN", "WARREN", "RUSSELL", "COOPER", "BOGGS", "FORD", 
        "DULLES", "MCCLOY", "REPORTER"
    }

    for i in range(len(matches)):
        start_idx = matches[i].start()
        end_idx = matches[i+1].start() if i+1 < len(matches) else len(text)
        
        raw_text = text[start_idx:end_idx].strip()
        speaker_match = matches[i].group(1)
        
        speaker = speaker_match.rstrip('.').strip()
        clean_speaker = speaker.replace("Mr. ", "").replace("Mrs. ", "").replace("Ms. ", "").upper()
        
        label = "PARAGRAPH"
        if speaker in ["Q", "A"]:
            label = "QUESTION" if speaker == "Q" else "ANSWER"
            speaker = ""
        elif any(c in clean_speaker for c in COUNSEL):
            label = "QUESTION"
        else:
            label = "ANSWER"
            
        segments.append(BodySegment(len(segments), label, speaker, raw_text))
        
    return segments


def _segment_numbered_blocks(text: str) -> List[BodySegment]:
    """Segments text by numbered paragraphs (1., 2., etc.)."""
    segments = []
    pattern = re.compile(r'^\s*(\d+)\.\s+', re.MULTILINE)
    
    matches = list(pattern.finditer(text))
    
    if not matches:
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
        return [BodySegment(i, "PARAGRAPH", "", p) for i, p in enumerate(paragraphs)]
    
    for i in range(len(matches)):
        start_idx = matches[i].start()
        end_idx = matches[i+1].start() if i+1 < len(matches) else len(text)
        
        raw_text = text[start_idx:end_idx].strip()
        num = matches[i].group(1)
        
        segments.append(BodySegment(i, "CLAIM", f"Item {num}", raw_text))
        
    return segments


def extract_by_type(text: str, classification: ClassificationResult) -> ZoneExtractionResult:
    """
    Extract fields using type-specific patterns applied to correct zones.
    
    Args:
        text: Full OCR text
        classification: Result from document classifier
        
    Returns:
        ZoneExtractionResult with all extracted fields
    """
    result = ZoneExtractionResult(
        doc_type=classification.doc_type.value,
        doc_type_confidence=classification.confidence,
    )
    
    # Get zone-split text
    header, body, footer = extract_zones(text, classification.doc_type)
    
    # Get patterns for this document type
    patterns = TYPE_PATTERNS.get(classification.doc_type, [])
    
    if not patterns:
        result.extraction_notes.append(f"No patterns defined for {classification.doc_type.value}")
        return result
    
    # Apply each pattern to the appropriate zone
    for pattern, field_name, zone, base_confidence in patterns:
        # Skip if field already extracted with higher confidence
        if field_name in result.fields:
            continue
        
        # Determine which text to search
        if zone == "header":
            search_text = header
        elif zone == "footer":
            search_text = footer
        elif zone == "body":
            search_text = body
        else:  # "any"
            search_text = text
        
        # Try to match
        match = re.search(pattern, search_text, re.IGNORECASE | re.MULTILINE)
        if match:
            # Get the captured group (first group or full match)
            value = match.group(1) if match.groups() else match.group(0)
            value = value.strip()
            
            # Adjust confidence based on classification confidence
            adjusted_confidence = base_confidence * min(1.0, classification.confidence + 0.3)
            
            result.fields[field_name] = ExtractedZoneField(
                field_name=field_name,
                value=value,
                zone=zone,
                confidence=adjusted_confidence,
                pattern_name=f"{classification.doc_type.value}_{field_name}",
                raw_match=match.group(0),
            )
    
    # Step 3: Segment the body
    result.segments = segment_body(body, classification.doc_type)
    
    result.extraction_notes.append(
        f"Extracted {len(result.fields)} field(s) and {len(result.segments)} body segment(s) for {classification.doc_type.value}"
    )
    
    return result


def extract_document(text: str) -> ZoneExtractionResult:
    """
    Full document extraction pipeline: classify then extract.
    
    Args:
        text: Full OCR text
        
    Returns:
        ZoneExtractionResult with classification and extracted fields
    """
    # Step 1: Classify
    classification = classify_document(text)
    
    # Step 2: Extract based on type
    result = extract_by_type(text, classification)
    
    return result


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def extract(text: str) -> dict:
    """
    Convenience function for API integration.
    
    Args:
        text: OCR text to process
        
    Returns:
        JSON-serializable extraction result
    """
    return extract_document(text).to_dict()


def extract_fbi_302(text: str) -> dict:
    """Extract FBI 302-specific fields."""
    from document_classifier import ClassificationResult
    classification = ClassificationResult(
        doc_type=DocType.FBI_302,
        confidence=1.0,
        matched_patterns=[],
        header_sample="",
    )
    return extract_by_type(text, classification).to_dict()


def extract_nara_rif(text: str) -> dict:
    """Extract NARA RIF-specific fields."""
    from document_classifier import ClassificationResult
    classification = ClassificationResult(
        doc_type=DocType.NARA_RIF,
        confidence=1.0,
        matched_patterns=[],
        header_sample="",
    )
    return extract_by_type(text, classification).to_dict()


# =============================================================================
# TEST SUITE
# =============================================================================

if __name__ == "__main__":
    import json
    
    # Test samples
    FBI_302_SAMPLE = """
        FEDERAL BUREAU OF INVESTIGATION
        
        Date of transcription: 11/26/63
        
        RALPH LEON YATES, 2527 Glenfield, Dallas, Texas, was interviewed at his 
        place of employment, Morgan Express Company, 2531 Glenfield, Dallas, Texas.
        
        YATES stated that on Wednesday, November 20, 1963, he was driving a pickup
        truck south on the Stemmons Expressway when he observed a man standing on 
        the side of the road attempting to hitchhike.
        
        YATES described the man as a white male, approximately 25 years of age,
        5'8" to 5'9" tall, weighing approximately 150 pounds.
        
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
        
        RECORD SERIES: JFK ASSASSINATION RECORDS
        AGENCY FILE NUMBER: 80T01357A
        
        ORIGINATOR: CIA/DO/C
        FROM: MEXICO CITY
        TO: DIRECTOR
        
        TITLE: OSWALD LEE HENRY
        DATE: 10/10/63
        
        CLASSIFICATION: SECRET
        
        REVIEW DATE: 09/18/95
        STATUS: RELEASED
    """
    
    CIA_CABLE_SAMPLE = """
        SECRET
        
        DIR 84888
        
        CITE MEXI 7025
        
        ROUTING: 3
        
        SUBJ: REPORTED CONTACT WITH SOVIET EMBASSY
        
        REF: MEXI 7024
        
        DTG: 091530Z OCT 63
        
        INFO: CI/SIG, WH/3
        
        1. ON 1 OCTOBER 1963 A RELIABLE SOURCE REPORTED THAT AN AMERICAN
        MALE WHO IDENTIFIED HIMSELF AS LEE OSWALD CONTACTED THE SOVIET
        EMBASSY IN MEXICO CITY...
    """
    
    print("=" * 60)
    print("Zone Extractor - Test Suite")
    print("=" * 60)
    
    test_cases = [
        ("FBI 302 (Yates Interview)", FBI_302_SAMPLE),
        ("NARA RIF Sheet", NARA_RIF_SAMPLE),
        ("CIA Cable", CIA_CABLE_SAMPLE),
    ]
    
    for name, sample in test_cases:
        print(f"\n{'='*60}")
        print(f"--- {name} ---")
        print("=" * 60)
        
        result = extract_document(sample)
        
        print(f"\nDocument Type: {result.doc_type} ({result.doc_type_confidence:.0%})")
        print(f"\nExtracted Fields ({len(result.fields)}):")
        
        for field_name, field in sorted(result.fields.items()):
            print(f"  [{field.zone:6}] {field_name}: {field.value[:50]}... ({field.confidence:.0%})" 
                  if len(field.value) > 50 
                  else f"  [{field.zone:6}] {field_name}: {field.value} ({field.confidence:.0%})")
        
        print(f"\nNotes: {result.extraction_notes}")
    
    print("\n" + "=" * 60)
    print("All tests complete")
    print("=" * 60)
