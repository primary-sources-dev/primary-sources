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

# Fuzzy matching support
try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False


class DocType(Enum):
    """Supported document type identifiers."""
    # === Primary Source Documents ===
    FBI_302 = "FBI_302"
    FBI_REPORT = "FBI_REPORT"  # FBI reports, airtels, teletypes
    NARA_RIF = "NARA_RIF"
    CIA_CABLE = "CIA_CABLE"
    MEMO = "MEMO"
    LETTER = "LETTER"  # Correspondence
    TRAVEL_DOCUMENT = "TRAVEL_DOCUMENT"  # Passports, visas, embarkation
    WC_EXHIBIT = "WC_EXHIBIT"
    WC_TESTIMONY = "WC_TESTIMONY"
    WC_DEPOSITION = "WC_DEPOSITION"  # Q&A depositions
    WC_AFFIDAVIT = "WC_AFFIDAVIT"  # Sworn statements
    POLICE_REPORT = "POLICE_REPORT"  # Dallas PD, Sheriff reports
    SENATE_REPORT = "SENATE_REPORT"  # Congressional committee reports
    CHURCH_COMMITTEE = "CHURCH_COMMITTEE"  # Church Committee specific
    HSCA_DOC = "HSCA_DOC"
    HSCA_REPORT = "HSCA_REPORT"  # HSCA Final Report narrative
    CIA_201 = "CIA_201"  # CIA Personality File
    DPD_REPORT = "DPD_REPORT"  # Dallas Police specific formats
    MEDICAL_RECORD = "MEDICAL_RECORD"  # Hospital/Psychiatric records
    HANDWRITTEN_NOTES = "HANDWRITTEN_NOTES"  # Scanned notes/scribbles
    WITNESS_STATEMENT = "WITNESS_STATEMENT"  # Signed witness statements (distinct from FBI 302)
    # === Structural Pages (Skip Processing) ===
    BLANK = "BLANK"  # Empty or near-empty pages
    TOC = "TOC"  # Table of contents
    INDEX = "INDEX"  # Back-matter index pages
    COVER = "COVER"  # Title/cover pages
    # === Fallback ===
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
        (r"[A-Z]{2}\s*\d{2,3}-\d+", 20),  # Field office file pattern (DL 89-43) - increased weight
        (r"DL\s*(?:89|44|100)-\d+", 25),  # Dallas field office specific
        (r"at which time .* was interviewed", 10),
        (r"advised as follows", 15),  # increased
        (r"on \d{1,2}/\d{1,2}/\d{2,4} at", 10),
        (r"voluntarily\s+(?:appeared|furnished)", 15),
        (r"Special Agent[s]?\s+of\s+the", 15),
        (r"(?:stated|advised|said)\s+(?:that|he|she)", 12),  # Common interview language
        (r"interview(?:ed)?", 12),  # Generic interview mention
        (r"FBI\s+(?:interview|agent|file)", 15),  # FBI mention
    ],
    
    DocType.FBI_REPORT: [
        # FBI reports, airtels, teletypes (not 302 interview forms)
        (r"AIRTEL", 35),
        (r"TELETYPE", 30),
        (r"Bureau\s+(?:file|letter)", 25),
        (r"SAC\s+(?:[A-Z]+|Dallas|New Orleans|Miami)", 25),
        (r"DIRECTOR,?\s+FBI", 25),
        (r"RE:\s+", 15),
        (r"BUFILE", 20),
        (r"URGENT|ROUTINE|PRIORITY", 15),
        (r"ENCODED MESSAGE", 20),
        (r"(?:FBI|Bureau)\s+Laboratory", 20),
        (r"Laboratory\s+(?:Report|Work\s+Sheet)", 25),
        (r"Latent\s+Fingerprint", 20),
        (r"submitted\s+(?:for|to)\s+examination", 15),
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
    
    DocType.LETTER: [
        (r"Dear\s+(?:Mr\.|Mrs\.|Ms\.|Sir|Madam)", 30),
        (r"(?:Sincerely|Respectfully|Yours\s+truly)", 25),
        (r"(?:Very\s+truly\s+yours|Cordially)", 20),
        (r"\d{1,2},?\s+\d{4}$", 15),  # Date at end of line
        (r"(?:Dear|To)\s+(?:Sir|Madam|Senator|Congressman)", 25),
        (r"enclosure|enclosed|attach", 15),
        (r"(?:Re|Reference|Regarding)\s*:", 15),
    ],
    
    DocType.TRAVEL_DOCUMENT: [
        # Very specific passport/visa indicators
        (r"PASSPORT\s+(?:NO\.?|NUMBER)", 40),
        (r"UNITED\s+STATES\s+(?:PASSPORT|OF\s+AMERICA)", 35),
        (r"(?:VISA|VISTO)\s+(?:NO\.?|NUMBER|TYPE)", 35),
        (r"VACCINATION\s+(?:CERTIFICATE|RECORD)", 35),
        (r"IMMUNIZATION\s+(?:RECORD|CERTIFICATE)", 35),
        (r"EMBARKATION\s+(?:CARD|SLIP|RECORD)", 30),
        (r"WORLD\s+HEALTH\s+ORGANIZATION", 30),
        (r"INTERNATIONAL\s+(?:CERTIFICATE|TRAVEL)", 25),
        (r"PORT\s+OF\s+(?:ENTRY|EXIT|EMBARKATION)", 25),
        # These are too generic, removed: travel, departure, arrival, citizen
    ],

    DocType.WC_EXHIBIT: [
        (r"COMMISSION\s+EXHIBIT\s+CE-?\d{1,4}", 40), # Strong combined marker
        (r"CE-?\s*\d{1,4}", 25), # Lower weight if just shorthand
        (r"CD-?\s*\d{1,4}", 30),  # Commission Document
        (r"COMMISSION\s+EXHIBIT", 30),
        (r"Commission\s+Exhibit", 25),
        (r"WARREN\s+COMMISSION", 25),
        (r"EXHIBIT\s+(?:NO\.?|NUMBER)", 20),
        (r"PRESIDENT'?S?\s+COMMISSION", 20),
        (r"(?:Exhibit|EXHIBIT)\s+\d{1,4}", 25),
        (r"(?:continued|Continued)", 15),  # Continuation pages
        (r"see\s+(?:next|following)\s+page", 10),
    ],
    
    DocType.WC_TESTIMONY: [
        (r"TESTIMONY\s+OF\s+(?:MRS?\.\s+)?(?:MR\.\s+)?([A-Z\s]+)", 40),
        (r"The\s+Commission\s+met\s+at", 35),
        (r"Washington,\s+D\.?C\.?", 15),
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
    
    DocType.WC_DEPOSITION: [
        # Deposition transcripts (Q&A format outside formal hearings)
        (r"DEPOSITION", 35),
        (r"(?:Q|Question)\s*[:\.]", 25),
        (r"(?:A|Answer)\s*[:\.]", 25),
        (r"deponent", 20),
        (r"(?:direct|cross).?examination", 25),
        (r"BY\s+(?:MR\.|MS\.)\s+\w+:", 20),
        (r"sworn|duly\s+sworn", 20),
        (r"COURT REPORTER|stenographer", 15),
        (r"testimony.*taken", 15),
        (r"(?:EXAMINATION|QUESTIONED)\s+BY", 20),
    ],
    
    DocType.WC_AFFIDAVIT: [
        # Sworn affidavits and statements
        (r"AFFIDAVIT", 40),
        (r"STATE\s+OF\s+(?:TEXAS|[A-Z]+)", 25),
        (r"COUNTY\s+OF\s+(?:DALLAS|[A-Z]+)", 25),
        (r"(?:BEFORE ME|subscribed)\s+.*\s+(?:notary|this day)", 30),
        (r"sworn\s+(?:to|and\s+subscribed)", 30),
        (r"NOTARY\s+PUBLIC", 25),
        (r"duly\s+sworn", 20),
        (r"(?:my\s+)?commission\s+expires", 15),
        (r"(?:deposes|states)\s+(?:and says|that)", 20),
        (r"WITNESS\s+(?:MY|WHEREOF)", 15),
    ],
    
    DocType.POLICE_REPORT: [
        # Dallas Police, Sheriff's Department reports
        (r"DALLAS\s+(?:POLICE|COUNTY)", 30),
        (r"SHERIFF'?S?\s+(?:DEPARTMENT|OFFICE)", 30),
        (r"SUPPLEMENTARY\s+(?:OFFENSE|INVESTIGATION)\s+REPORT", 35),
        (r"OFFENSE\s+REPORT", 25),
        (r"INCIDENT\s+REPORT", 25),
        (r"(?:INVESTIGATING|REPORTING)\s+OFFICER", 25),
        (r"PATROL\s+(?:DIVISION|DISTRICT)", 20),
        (r"(?:OFFENSE|CRIME)\s+(?:CODE|TYPE)", 15),
        (r"COMPLAINANT|VICTIM", 15),
        (r"(?:TIME|DATE)\s+OF\s+(?:OFFENSE|OCCURRENCE)", 15),
        (r"BADGE\s+(?:NO|NUMBER|#)", 15),
        (r"(?:squad|unit|car)\s+\d+", 15),
    ],
    
    DocType.SENATE_REPORT: [
        # Generic Senate/Congressional committee reports
        (r"SENATE\s+(?:REPORT|COMMITTEE)", 30),
        (r"\d{1,3}(?:st|nd|rd|th)\s+(?:CONGRESS|Congress)", 30),
        (r"UNITED\s+STATES\s+SENATE", 25),
        (r"SELECT\s+COMMITTEE", 25),
        (r"SUBCOMMITTEE", 20),
        (r"STAFF\s+(?:REPORT|STUDY)", 25),
        (r"REPORT\s+(?:TO|OF)\s+THE", 20),
        (r"CONGRESSIONAL", 15),
        (r"HEARINGS?\s+BEFORE", 20),
        (r"FINDINGS\s+AND\s+RECOMMENDATIONS", 25),
    ],
    
    DocType.CHURCH_COMMITTEE: [
        # Church Committee specific (1975-1976)
        (r"CHURCH|94th\s+Congress", 30),
        (r"SELECT\s+COMMITTEE\s+TO\s+STUDY\s+GOVERNMENTAL\s+OPERATIONS", 40),
        (r"INTELLIGENCE\s+ACTIVITIES", 30),
        (r"FOREIGN\s+AND\s+MILITARY\s+INTELLIGENCE", 35),
        (r"BOOK\s+(?:I|II|III|IV|V)", 25),
        (r"SUPPLEMENTARY.*VIEWS", 20),
        (r"(?:CIA|FBI|NSA)\s+(?:domestic|foreign)\s+(?:operations|activities)", 25),
        (r"COINTELPRO", 35),
        (r"(?:assassination|covert\s+action)\s+(?:report|plot)", 30),
        (r"(?:counterintelligence|intelligence\s+community)", 20),
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

    DocType.CIA_201: [
        (r"201-\d{6,8}", 40),  # 201 number pattern
        (r"PERSONALITY\s+FILE", 35),
        (r"CIA\s+Personality\s+Record", 35),
        (r"SUBJECT\s*:\s*(?:LEE\s+HARVEY\s+)?OSWALD", 20),
        (r"201-FILE", 30),
        (r"Project\s+Search", 15),
        (r"Cryptonym", 20),
        (r"P/F\s*[:\.]", 15),
        (r"DCA\s+(?:file|number)", 20),
        (r"CIA.?DO", 25),
        (r"201\s+RECORD", 30),
        (r"PERSONALITY\s+DOSSIER", 30),
    ],

    DocType.DPD_REPORT: [
        (r"DALLAS\s+POLICE\s+DEPARTMENT", 40),
        (r"DALLAS\s+SHERIFF", 30),
        (r"SUPPLEMENTARY\s+INVESTIGATION", 35),
        (r"Jesse\s+Curry", 25),
        (r"Will\s+Fritz", 25),
        (r"Homicide\s+&\s+Robbery", 25),
        (r"Handwriting\s+Specimen", 20),
        (r"Booking\s+(?:Number|Entry)", 25),
        (r"POLICE\s+RECORDS", 30),
        (r"IDENTIFICATION\s+BUREAU", 25),
        (r"OFFENSE[:\s]+HOMICIDE", 20),
    ],

    DocType.MEDICAL_RECORD: [
        (r"HOSPITAL|CLINIC", 30),
        (r"MEDICAL\s+(?:RECORD|REPORT|HISTORY)", 35),
        (r"PSYCHIATRIC|PSYCHOLOGICAL", 35),
        (r"WARD|PATIENT|PHYSICIAN", 25),
        (r"DIAGNOSIS|TREATMENT", 25),
        (r"Medication|Dosage", 20),
        (r"Leavenworth|Springfield.*Medical", 30),  # Yates context
        (r"Nurse|Doctor", 15),
    ],

    DocType.HANDWRITTEN_NOTES: [
        (r"scribble|notes|handwritten", 20),
        (r"(?:[a-z]{1,3}\s+){5,}", 10),  # Many short words (could be scribbles)
        (r"[A-Z]{1}\s+[a-z]{1}", 10),    # Single letters separated by space
        (r"informal", 15),
        (r"rough\s+notes", 25),
        (r"date\s+unknown", 15),
        (r"(?:[a-z]{1,2}\s+){10,}", 20),  # Lots of tiny fragments
        (r"[\?\.]{3,}", 10),              # Question marks/dots in messy text
        (r"(?:[A-Z]{1,2}\s+){5,}", 15),   # CAPS fragments
    ],

    DocType.WITNESS_STATEMENT: [
        # Distinct from FBI 302 (agent's summary) - this is witness's own words
        (r"STATEMENT\s+OF\s+[A-Z]", 40),
        (r"VOLUNTARY\s+STATEMENT", 40),
        (r"SIGNED\s+STATEMENT", 35),
        (r"I,\s+[A-Z][a-z]+\s+[A-Z][a-z]+,?\s+(?:make|give|furnish)", 35),
        (r"make\s+the\s+following\s+(?:voluntary\s+)?statement", 35),
        (r"following\s+statement\s+(?:of\s+my\s+own\s+)?free\s+will", 30),
        (r"(?:Signed|Signature)\s*[:\-]?\s*$", 25),
        (r"/s/\s*[A-Z]", 25),  # Signature notation
        (r"(?:WITNESS|Witness)\s*[:\-]?\s*$", 20),
        (r"(?:typed|prepared)\s+(?:by|at)\s+(?:my\s+)?(?:request|direction)", 20),
        (r"read\s+(?:this|the\s+above)\s+statement", 20),
        (r"statement\s+is\s+true\s+and\s+correct", 25),
        (r"no\s+(?:threats|promises|coercion)", 20),
        (r"of\s+my\s+own\s+free\s+will", 25),
    ],
    
    # =========================================================================
    # STRUCTURAL PAGE TYPES (Skip Processing)
    # =========================================================================
    
    DocType.BLANK: [
        # Blank pages detected primarily by character count (see classify_document)
        # These patterns are for explicit "blank page" markers when char count > threshold
        (r"(?:This page (?:intentionally )?(?:left )?blank)", 80),
        (r"\[?\s*(?:BLANK|blank|EMPTY|empty)\s*\]?", 70),
        (r"(?:PAGE\s+)?INTENTIONALLY\s+(?:LEFT\s+)?BLANK", 80),
    ],
    
    DocType.TOC: [
        (r"TABLE\s+OF\s+CONTENTS", 50),
        (r"CONTENTS", 40),
        (r"Table of Contents", 45),
        (r"Contents", 35),
        # Chapter/section listings with page numbers
        (r"Chapter\s+(?:I{1,3}|IV|V|VI{0,3}|[0-9]+)\s*[\.…\-—]+\s*\d+", 35),
        (r"(?:CHAPTER|Chapter|PART|Part|Section|SECTION)\s+\w+\s*[\.…\-—]+\s*\d+", 30),
        # Multiple lines ending with page numbers (TOC pattern)
        (r"[A-Z][a-z]+.*[\.…\-—]+\s*\d{1,4}$", 25),
        (r"(?:Appendix|APPENDIX|Exhibit|EXHIBIT)\s+\w+\s*[\.…\-—]+\s*\d+", 25),
        (r"(?:Introduction|Foreword|Preface|Summary)\s*[\.…\-—]+\s*\d+", 25),
        (r"(?:Index|Bibliography|References)\s*[\.…\-—]+\s*\d+", 20),
    ],
    
    DocType.INDEX: [
        (r"^\s*INDEX\s*$", 50),
        (r"^\s*Index\s*$", 45),
        (r"GENERAL\s+INDEX", 45),
        (r"NAME\s+INDEX", 45),
        (r"SUBJECT\s+INDEX", 45),
        # Alphabetical entries with page numbers (index pattern)
        (r"^[A-Z][a-z]+,\s+[A-Z][a-z]+.*\d{1,4}", 30),  # "Smith, John... 123"
        (r"^[A-Z][a-z]+.*,\s+\d{1,4}(?:,\s*\d{1,4})*", 35),  # "Topic, 12, 45, 78"
        # Multiple comma-separated page numbers
        (r"\d{1,4},\s*\d{1,4},\s*\d{1,4}", 30),
        # "See also" cross-references
        (r"[Ss]ee\s+(?:also\s+)?[A-Z][a-z]+", 25),
        # Subentries (indented items)
        (r"^\s{2,}[a-z].*\d{1,4}$", 20),
    ],
    
    DocType.COVER: [
        # Volume/Report titles
        (r"VOLUME\s+(?:I{1,3}|IV|V|VI{0,3}|[0-9]+)", 40),
        (r"Volume\s+(?:I{1,3}|IV|V|VI{0,3}|[0-9]+)", 35),
        (r"REPORT\s+OF\s+THE", 35),
        (r"Report of the", 30),
        # Publication info
        (r"U\.?S\.?\s+GOVERNMENT\s+PRINTING\s+OFFICE", 40),
        (r"GOVERNMENT\s+PRINTING\s+OFFICE", 35),
        (r"GPO", 25),
        (r"WASHINGTON\s*(?:,\s*D\.?C\.?)?(?:\s*:\s*|\s+)\d{4}", 35),
        (r"Washington\s*(?:,\s*D\.?C\.?)?(?:\s*:\s*|\s+)\d{4}", 30),
        # Commission/Committee names as titles
        (r"PRESIDENT'?S?\s+COMMISSION", 35),
        (r"WARREN\s+COMMISSION", 35),
        (r"HOUSE\s+SELECT\s+COMMITTEE", 30),
        (r"SELECT\s+COMMITTEE", 25),
        # Year patterns (publication years)
        (r"(?:19[5-9]\d|20[0-2]\d)\s*$", 20),
        # "Hearings" or "Report" as standalone title element
        (r"^\s*HEARINGS?\s*$", 30),
        (r"^\s*REPORT\s*$", 25),
        # Sparse content indicator (covers have little body text)
        (r"^(?:\s*\n){5,}", 15),  # Many blank lines
    ],
}

# Calculate max possible score for each type (for normalization)
MAX_SCORES = {
    doc_type: sum(weight for _, weight in patterns)
    for doc_type, patterns in FINGERPRINTS.items()
}


# =============================================================================
# CANONICAL FINGERPRINTS (for Levenshtein fuzzy matching)
# =============================================================================
# These are the "ideal" text strings that perfect OCR would produce.
# Used as fallback when regex-based matching produces low confidence.

CANONICAL_FINGERPRINTS = {
    DocType.FBI_302: [
        ("FEDERAL BUREAU OF INVESTIGATION", 40),
        ("FD-302", 30),
        ("Date of transcription", 25),
        ("was interviewed", 20),
        ("transcribed by SA", 25),
        ("Special Agent", 20),
    ],
    DocType.FBI_REPORT: [
        ("AIRTEL", 35),
        ("TELETYPE", 30),
        ("DIRECTOR FBI", 30),
        ("SAC DALLAS", 25),
        ("Bureau file", 25),
    ],
    DocType.NARA_RIF: [
        ("RECORD INFORMATION", 35),
        ("RECORD NUMBER", 30),
        ("JFK ASSASSINATION", 30),
        ("AGENCY FILE NUMBER", 25),
        ("ORIGINATOR", 20),
    ],
    DocType.CIA_CABLE: [
        ("CLASSIFIED MESSAGE", 35),
        ("SECRET", 25),
        ("CONFIDENTIAL", 25),
        ("ROUTING", 25),
        ("CITE", 25),
    ],
    DocType.CIA_201: [
        ("PERSONALITY FILE", 40),
        ("201 FILE", 35),
        ("CIA Personality Record", 35),
        ("PERSONALITY DOSSIER", 30),
    ],
    DocType.MEMO: [
        ("MEMORANDUM", 40),
        ("MEMO FOR THE RECORD", 35),
        ("INTEROFFICE", 25),
    ],
    DocType.LETTER: [
        ("Dear Sir", 30),
        ("Dear Madam", 30),
        ("Sincerely", 25),
        ("Respectfully", 25),
        ("Very truly yours", 30),
    ],
    DocType.WC_EXHIBIT: [
        ("COMMISSION EXHIBIT", 40),
        ("WARREN COMMISSION", 35),
        ("PRESIDENTS COMMISSION", 30),
    ],
    DocType.WC_TESTIMONY: [
        ("TESTIMONY OF", 40),
        ("The Commission met at", 35),
        ("Washington DC", 25),
    ],
    DocType.WC_DEPOSITION: [
        ("DEPOSITION", 40),
        ("direct examination", 30),
        ("cross examination", 30),
        ("COURT REPORTER", 25),
    ],
    DocType.WC_AFFIDAVIT: [
        ("AFFIDAVIT", 45),
        ("STATE OF TEXAS", 30),
        ("COUNTY OF DALLAS", 30),
        ("NOTARY PUBLIC", 30),
        ("subscribed and sworn", 30),
    ],
    DocType.POLICE_REPORT: [
        ("DALLAS POLICE", 35),
        ("SHERIFFS DEPARTMENT", 35),
        ("OFFENSE REPORT", 30),
        ("INVESTIGATING OFFICER", 30),
    ],
    DocType.DPD_REPORT: [
        ("DALLAS POLICE DEPARTMENT", 45),
        ("SUPPLEMENTARY INVESTIGATION", 35),
        ("Homicide and Robbery", 30),
    ],
    DocType.HSCA_DOC: [
        ("HOUSE SELECT COMMITTEE", 40),
        ("House Select Committee on Assassinations", 45),
        ("HSCA", 30),
    ],
    DocType.HSCA_REPORT: [
        ("the committee", 25),
        ("committee staff", 25),
        ("the assassination", 25),
        ("President Kennedy", 25),
        ("Lee Harvey Oswald", 30),
    ],
    DocType.CHURCH_COMMITTEE: [
        ("SELECT COMMITTEE TO STUDY GOVERNMENTAL OPERATIONS", 50),
        ("INTELLIGENCE ACTIVITIES", 35),
        ("FOREIGN AND MILITARY INTELLIGENCE", 40),
        ("COINTELPRO", 40),
    ],
    DocType.SENATE_REPORT: [
        ("SENATE REPORT", 35),
        ("UNITED STATES SENATE", 35),
        ("SELECT COMMITTEE", 30),
        ("CONGRESS", 25),
    ],
    DocType.MEDICAL_RECORD: [
        ("MEDICAL RECORD", 40),
        ("MEDICAL REPORT", 35),
        ("HOSPITAL", 30),
        ("PSYCHIATRIC", 35),
        ("DIAGNOSIS", 30),
    ],
    DocType.TRAVEL_DOCUMENT: [
        ("PASSPORT", 40),
        ("UNITED STATES PASSPORT", 45),
        ("VISA", 35),
        ("VACCINATION CERTIFICATE", 40),
    ],
    DocType.HANDWRITTEN_NOTES: [
        ("handwritten", 30),
        ("rough notes", 30),
    ],
    DocType.WITNESS_STATEMENT: [
        ("STATEMENT OF", 40),
        ("VOLUNTARY STATEMENT", 45),
        ("SIGNED STATEMENT", 40),
        ("make the following statement", 35),
        ("of my own free will", 35),
        ("statement is true and correct", 35),
    ],
    
    # Structural page types
    DocType.TOC: [
        ("TABLE OF CONTENTS", 50),
        ("CONTENTS", 40),
        ("Chapter", 25),
    ],
    DocType.INDEX: [
        ("INDEX", 50),
        ("GENERAL INDEX", 45),
        ("See also", 30),
    ],
    DocType.COVER: [
        ("VOLUME", 35),
        ("GOVERNMENT PRINTING OFFICE", 40),
        ("REPORT OF THE", 35),
        ("WASHINGTON", 25),
    ],
}


# =============================================================================
# FUZZY CLASSIFICATION ENGINE
# =============================================================================

def fuzzy_classify(text: str, threshold: int = 70) -> tuple[DocType, float, list[str]]:
    """
    Classify document using Levenshtein distance against canonical fingerprints.
    
    This is a fallback for when regex-based classification produces low confidence,
    typically due to garbled OCR output.
    
    Args:
        text: OCR text (header + footer sample recommended)
        threshold: Minimum fuzzy match score (0-100) to count as a match
        
    Returns:
        Tuple of (best_doc_type, confidence_score, matched_fingerprints)
    """
    if not HAS_RAPIDFUZZ:
        return (DocType.UNKNOWN, 0.0, [])
    
    text_lower = text.lower()
    scores: dict[DocType, tuple[float, list[str]]] = {}
    
    for doc_type, fingerprints in CANONICAL_FINGERPRINTS.items():
        type_score = 0.0
        matched = []
        max_possible = sum(weight for _, weight in fingerprints)
        
        for canonical, weight in fingerprints:
            # Use partial_ratio to find the best substring match
            score = fuzz.partial_ratio(canonical.lower(), text_lower)
            
            if score >= threshold:
                # Weight the score by the fingerprint's importance
                weighted_score = (score / 100.0) * weight
                type_score += weighted_score
                matched.append(f"{canonical} ({score}%)")
        
        # Normalize to 0.0 - 1.0
        confidence = type_score / max_possible if max_possible > 0 else 0.0
        scores[doc_type] = (confidence, matched)
    
    # Find best match
    best_type = max(scores.keys(), key=lambda t: scores[t][0])
    best_score, best_matches = scores[best_type]
    
    # Require at least one match
    if not best_matches:
        return (DocType.UNKNOWN, 0.0, [])
    
    return (best_type, best_score, best_matches)


# =============================================================================
# REGEX CLASSIFICATION ENGINE
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
    
    Uses a multi-stage approach:
    0. Structural page detection (BLANK, based on character count)
    1. Regex-based fingerprint matching (fast, precise)
    2. Levenshtein fuzzy matching (fallback for garbled OCR)

    Args:
        text: Full OCR text to classify
        header_lines: Number of lines to analyze (default: 25)

    Returns:
        ClassificationResult with doc_type, confidence, and matched patterns
    """
    # =================================================================
    # Stage 0: BLANK page detection (before preprocessing)
    # =================================================================
    # Strip and count meaningful characters
    stripped = text.strip()
    char_count = len(stripped)
    
    # Threshold: pages with < 100 chars are likely blank or just page numbers
    BLANK_THRESHOLD = 100
    
    if char_count < BLANK_THRESHOLD:
        # Check if it's just whitespace, page numbers, or "blank" indicators
        is_blank_page = (
            char_count == 0 or
            re.match(r'^[\s\d\-\.]+$', stripped) or  # Only whitespace/digits
            re.search(r'(?:blank|empty)', stripped, re.IGNORECASE) or
            re.match(r'^\d{1,4}$', stripped)  # Just a page number
        )
        if is_blank_page:
            return ClassificationResult(
                doc_type=DocType.BLANK,
                confidence=0.95,
                matched_patterns=[f"char_count={char_count}"],
                header_sample=stripped[:100],
            )
    
    # Preprocess to handle OCR artifacts
    text = preprocess_text(text)
    
    header_sample = extract_header_sample(text, header_lines)

    # Also check footer for FBI 302 (agent signature)
    footer_sample = extract_footer_sample(text, 15)
    
    # For narrative reports (HSCA), also check body content
    body_sample = text[:3000] if len(text) > 3000 else text
    combined_sample = header_sample + "\n" + footer_sample + "\n" + body_sample

    # =================================================================
    # Stage 1: Regex-based classification
    # =================================================================
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
    
    # Find best regex match
    best_type = max(scores.keys(), key=lambda t: scores[t][0])
    best_score, best_matches = scores[best_type]
    method = "regex"
    
    # =================================================================
    # Stage 2: Fuzzy fallback (when regex confidence is low)
    # =================================================================
    FUZZY_THRESHOLD = 0.5  # Trigger fuzzy matching below this confidence
    
    if best_score < FUZZY_THRESHOLD and HAS_RAPIDFUZZ:
        fuzzy_type, fuzzy_conf, fuzzy_matches = fuzzy_classify(combined_sample)
        
        # Case A: Fuzzy agrees with regex - boost confidence
        if fuzzy_type == best_type and fuzzy_conf > 0:
            # Combine scores (weighted average favoring the higher one)
            combined_conf = max(best_score, fuzzy_conf * 0.9)
            best_score = combined_conf
            best_matches = best_matches + [f"[fuzzy] {m}" for m in fuzzy_matches[:3]]
            method = "regex+fuzzy"
        
        # Case B: Fuzzy is much more confident - override
        elif fuzzy_conf > best_score + 0.15 and fuzzy_conf >= 0.3:
            best_type = fuzzy_type
            best_score = fuzzy_conf * 0.85  # Slight penalty for fuzzy-only
            best_matches = [f"[fuzzy] {m}" for m in fuzzy_matches]
            method = "fuzzy"
    
    # =================================================================
    # Final decision
    # =================================================================
    # If best score is still too low, return UNKNOWN
    if best_score < 0.10:
        return ClassificationResult(
            doc_type=DocType.UNKNOWN,
            confidence=0.0,
            matched_patterns=[],
            header_sample=header_sample[:500],
        )
    
    return ClassificationResult(
        doc_type=best_type,
        confidence=best_score,
        matched_patterns=best_matches,
        header_sample=header_sample[:500],
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
    body_sample = text[:3000] if len(text) > 3000 else text
    combined_sample = header_sample + "\n" + footer_sample + "\n" + body_sample
    
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
    DocType.LETTER: {
        "header_lines": 10,
        "footer_lines": 10,
        "header_fields": ["date", "addressee"],
        "footer_fields": ["signature", "sender"],
        "body_fields": ["content"],
    },
    DocType.TRAVEL_DOCUMENT: {
        "header_lines": 15,
        "footer_lines": 10,
        "header_fields": ["document_type", "holder_name", "nationality"],
        "footer_fields": ["issuing_authority", "date_issued"],
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
    DocType.WC_DEPOSITION: {
        "header_lines": 15,
        "footer_lines": 5,
        "header_fields": ["deponent_name", "date", "location"],
        "footer_fields": ["page_number", "reporter"],
        "body_fields": ["questions", "answers"],
    },
    DocType.WC_AFFIDAVIT: {
        "header_lines": 20,
        "footer_lines": 15,
        "header_fields": ["state", "county", "affiant_name"],
        "footer_fields": ["notary", "date_signed"],
        "body_fields": ["statement_content"],
    },
    DocType.POLICE_REPORT: {
        "header_lines": 20,
        "footer_lines": 10,
        "header_fields": ["department", "report_type", "case_number", "date"],
        "footer_fields": ["officer_name", "badge_number"],
        "body_fields": ["narrative"],
    },
    DocType.SENATE_REPORT: {
        "header_lines": 10,
        "footer_lines": 5,
        "header_fields": ["congress", "session", "report_number"],
        "footer_fields": ["page_number"],
        "body_fields": ["content"],
    },
    DocType.CHURCH_COMMITTEE: {
        "header_lines": 10,
        "footer_lines": 5,
        "header_fields": ["book", "chapter", "subject"],
        "footer_fields": ["page_number"],
        "body_fields": ["content"],
    },
    DocType.FBI_REPORT: {
        "header_lines": 20,
        "footer_lines": 10,
        "header_fields": ["to", "from", "subject", "date", "file_number"],
        "footer_fields": [],
        "body_fields": ["content"],
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
    DocType.WITNESS_STATEMENT: {
        "header_lines": 15,
        "footer_lines": 15,
        "header_fields": ["statement_of", "date", "location"],
        "footer_fields": ["signature", "witness_signature", "date_signed"],
        "body_fields": ["statement_content"],
    },
    # Structural page types - minimal extraction
    DocType.BLANK: {
        "header_lines": 0,
        "footer_lines": 0,
        "header_fields": [],
        "footer_fields": [],
        "body_fields": [],
        "skip_processing": True,
    },
    DocType.TOC: {
        "header_lines": 5,
        "footer_lines": 3,
        "header_fields": ["page_number"],
        "footer_fields": ["page_number"],
        "body_fields": ["chapter_list"],
        "skip_processing": True,
    },
    DocType.INDEX: {
        "header_lines": 3,
        "footer_lines": 3,
        "header_fields": ["page_number"],
        "footer_fields": ["page_number"],
        "body_fields": [],
        "skip_processing": True,
    },
    DocType.COVER: {
        "header_lines": 10,
        "footer_lines": 5,
        "header_fields": ["title", "volume", "publication_year"],
        "footer_fields": ["publisher"],
        "body_fields": [],
        "skip_processing": True,
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


# Structural page types that should skip full body processing
STRUCTURAL_TYPES = {DocType.BLANK, DocType.TOC, DocType.INDEX, DocType.COVER}


def is_structural(text: str) -> bool:
    """
    Quick check if page is a structural element (cover, TOC, index, blank).
    Structural pages should typically be skipped during content extraction.
    """
    result = classify_document(text)
    return result.doc_type in STRUCTURAL_TYPES


def is_blank(text: str) -> bool:
    """Quick check if page is blank or near-empty."""
    result = classify_document(text)
    return result.doc_type == DocType.BLANK


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
    
    # Garbled OCR sample (simulates poor scan quality)
    GARBLED_FBI_302 = """
                                    FEDIRAL EUREAU OF INVESTGATION

                                                                Dete  11/26/63
    
    RAIPH LEON YATES, 2308 Byers, Dalias, Texes, edvised that on Novembor 20,
    1963, at epproximately 10:30 AM, while drivinq to work, he picked up a
    young white mele hitchhiker...
    
    YATES steted he did not observe the man ciosely enough to furnish a 
    deteiled description.
    
    trenscribed by SA C. Rey Hail
    DL 89-43
    on 11/26/63
    """
    
    print("=" * 60)
    print("Document Classifier - Test Suite")
    print(f"Fuzzy matching: {'ENABLED' if HAS_RAPIDFUZZ else 'DISABLED'}")
    print("=" * 60)
    
    # Structural page test samples
    BLANK_SAMPLE = """
    
    
    
    42
    
    
    """
    
    TOC_SAMPLE = """
    TABLE OF CONTENTS
    
    Chapter I — Formation of the Warren Commission .......................... 1
    Chapter II — Narrative of Events ........................................ 18
    Chapter III — Analysis of Lee Harvey Oswald ............................ 375
    Chapter IV — Conclusions ............................................... 469
    
    Appendix A — Exhibits .................................................. 500
    Appendix B — Index ..................................................... 750
    """
    
    INDEX_SAMPLE = """
    INDEX
    
    Abt, John, 123, 456
    Adams, Victoria, 67, 89, 234
    Altgens, James, 45, 78
        photograph by, 45, 78
    Baker, Marrion L., 102, 145
        testimony of, 102
    Benavides, Domingo, 234, 567
        See also Tippit shooting
    """
    
    COVER_SAMPLE = """
    
    
    REPORT OF THE
    
    PRESIDENT'S COMMISSION
    ON THE
    ASSASSINATION OF PRESIDENT KENNEDY
    
    
    VOLUME I
    
    
    
    U.S. GOVERNMENT PRINTING OFFICE
    WASHINGTON : 1964
    """
    
    test_cases = [
        ("FBI 302 (clean)", FBI_302_SAMPLE),
        ("FBI 302 (garbled)", GARBLED_FBI_302),
        ("NARA RIF", NARA_RIF_SAMPLE),
        ("MEMO", MEMO_SAMPLE),
        ("CIA Cable", CIA_CABLE_SAMPLE),
        # Structural types
        ("BLANK page", BLANK_SAMPLE),
        ("TABLE OF CONTENTS", TOC_SAMPLE),
        ("INDEX page", INDEX_SAMPLE),
        ("COVER page", COVER_SAMPLE),
    ]
    
    for name, sample in test_cases:
        print(f"\n--- {name} ---")
        result = classify_document(sample)
        
        # Detect if fuzzy matching was used
        fuzzy_used = any("[fuzzy]" in p for p in result.matched_patterns)
        method = "regex+fuzzy" if fuzzy_used else "regex"
        
        print(f"Classified as: {result.doc_type.value}")
        print(f"Confidence: {result.confidence:.1%} ({result.confidence_label})")
        print(f"Method: {method}")
        print(f"Matched patterns ({len(result.matched_patterns)}):")
        for p in result.matched_patterns[:5]:  # Show first 5
            print(f"  - {p[:60]}{'...' if len(p) > 60 else ''}")
        
        # Show regex-only scores for comparison
        print("Regex-only scores (top 3):")
        scores = get_all_scores(sample)
        for i, (doc_type, score) in enumerate(scores.items()):
            if score > 0 and i < 3:
                print(f"  {doc_type}: {score:.1%}")
    
    print("\n" + "=" * 60)
    print("All tests complete")
    print("=" * 60)
