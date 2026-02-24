"""
metadata_parser.py — Forensic Metadata Parser for Archival Documents

Extracts structured metadata (Agency, RIF Number, Date, Author) from OCR'd 
archival documents using regex-based pattern recognition.

Supports header parsing:
- NARA RIF Sheets (Agency, Record Number, Date)
- Warren Commission Exhibits (CE numbers)
- Generic memo headers (Date, Subject)

Supports footer parsing (FBI 302 specific):
- Agent signature lines ("transcribed by SA...")
- File numbers in footer position
- Date of transcription

Future: Will expand to parse body, tables, marginalia, and stamps
as part of the Document Layout Analyzer (Feature 01b).

See: docs/ui/ocr/plans/forensic-metadata-parser.md (WO-OCR-007)
"""

import re
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field, asdict

# Import document classifier for type detection
try:
    from document_classifier import classify_document, DocType, ClassificationResult
    CLASSIFIER_AVAILABLE = True
except ImportError:
    CLASSIFIER_AVAILABLE = False


@dataclass
class ExtractedField:
    """A single extracted metadata field with confidence scoring."""
    value: str
    confidence: str  # HIGH, MEDIUM, LOW
    pattern_name: str
    raw_match: str


@dataclass
class ParsedMetadata:
    """Complete extraction result from a document (header + footer)."""
    # Classification info (from Document Layout Analyzer)
    classified_type: Optional[str] = None  # FBI_302, NARA_RIF, etc.
    classification_confidence: Optional[float] = None
    classification_label: Optional[str] = None  # HIGH, MEDIUM, LOW
    
    # Header-sourced fields
    rif_number: Optional[ExtractedField] = None
    agency: Optional[ExtractedField] = None
    date: Optional[ExtractedField] = None
    date_iso: Optional[str] = None  # Normalized ISO date
    author: Optional[ExtractedField] = None
    document_type: Optional[str] = None  # Legacy field, use classified_type
    raw_header: str = ""
    
    # Footer-sourced fields (FBI 302 specific)
    footer_author: Optional[ExtractedField] = None  # "transcribed by SA..."
    footer_file_number: Optional[ExtractedField] = None  # File number in footer
    footer_date: Optional[ExtractedField] = None  # Date of transcription
    raw_footer: str = ""
    
    extraction_notes: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dictionary."""
        result = {
            # Classification (Document Layout Analyzer)
            "classified_type": self.classified_type,
            "classification_confidence": round(self.classification_confidence, 3) if self.classification_confidence else None,
            "classification_label": self.classification_label,
            # Header fields
            "rif_number": asdict(self.rif_number) if self.rif_number else None,
            "agency": asdict(self.agency) if self.agency else None,
            "date": asdict(self.date) if self.date else None,
            "date_iso": self.date_iso,
            "author": asdict(self.author) if self.author else None,
            "document_type": self.document_type,
            "raw_header": self.raw_header,
            # Footer fields
            "footer_author": asdict(self.footer_author) if self.footer_author else None,
            "footer_file_number": asdict(self.footer_file_number) if self.footer_file_number else None,
            "footer_date": asdict(self.footer_date) if self.footer_date else None,
            "raw_footer": self.raw_footer,
            "extraction_notes": self.extraction_notes,
        }
        return result
    
    def has_extractions(self) -> bool:
        """Returns True if any fields were extracted (header or footer)."""
        return any([
            self.rif_number, self.agency, self.date, self.author,
            self.footer_author, self.footer_file_number, self.footer_date
        ])


class MetadataParser:
    """
    Regex-based metadata extractor for archival document headers and footers.
    
    Usage:
        parser = MetadataParser()
        result = parser.parse(ocr_text)  # Header + Footer (default)
        result = parser.parse(ocr_text, include_footer=False)  # Header only
        if result.has_extractions():
            print(result.to_dict())
    
    FBI 302 Note:
        FBI FD-302 forms (1960s) place agent name and file number in the FOOTER.
        Footer parsing is enabled by default.
    """
    
    # Number of characters from start of document to search for headers
    HEADER_WINDOW = 2000
    
    # Number of characters from end of document to search for footers
    FOOTER_WINDOW = 1500
    
    # ==========================================================================
    # PATTERN DEFINITIONS
    # ==========================================================================
    
    PATTERNS = {
        # NARA RIF Number: 3-5-5 digit format (e.g., 104-10001-10001)
        "nara_rif": {
            "pattern": r"(?:RIF(?:\s+(?:Number|No\.?|#))?[:\s]*)?(?P<rif>\d{3}-\d{5}-\d{5})",
            "maps_to": "rif_number",
            "confidence": "HIGH",
            "doc_type": "NARA_RIF",
        },
        
        # Agency header line (common on declassified documents)
        "agency_header": {
            "pattern": r"(?:AGENCY|Agency|ORIGINATOR)[:\s]+(?P<agency>FBI|CIA|SECRET SERVICE|NSA|DIA|STATE|HSCA|DPD|USSS)",
            "maps_to": "agency",
            "confidence": "HIGH",
            "doc_type": None,
        },
        
        # FBI Special Agent attribution
        # Handles: "SA James P. Hosty", "SA C. Ray Hall", "Special Agent John Smith"
        "fbi_agent": {
            "pattern": r"(?:SA|Special\s+Agent)\s+(?P<agent>[A-Z](?:[a-z]+|\.)\s+(?:[A-Z](?:[a-z]+|\.)\s+)?[A-Z][a-z]+)",
            "maps_to": "author",
            "confidence": "MEDIUM",
            "doc_type": "FBI_302",
        },
        
        # FBI File Number (e.g., DL 89-43, 62-109060)
        "fbi_file_number": {
            "pattern": r"(?:File(?:\s+(?:Number|No\.?|#))?[:\s]*)?(?P<file>[A-Z]{2}\s*\d{2,3}-\d+|\d{2,3}-\d{5,7})",
            "maps_to": "rif_number",  # Store as alternate identifier
            "confidence": "MEDIUM",
            "doc_type": "FBI_302",
        },
        
        # CIA 201 File Number
        "cia_201_file": {
            "pattern": r"(?:201(?:\s+File)?[:\s]*)?(?P<file>201-\d{6,8})",
            "maps_to": "rif_number",
            "confidence": "HIGH",
            "doc_type": "CIA_201",
        },
        
        # DPD Case Number (e.g., "Serial No. 2341", "Case No. 7890")
        "dpd_case": {
            "pattern": r"(?:Serial|Case|Report)\s+(?:No\.?|Number|#)?\s*(?P<case>\d{3,7})",
            "maps_to": "rif_number",
            "confidence": "MEDIUM",
            "doc_type": "DPD_REPORT",
        },
        
        # Medical Record
        "medical_record_header": {
            "pattern": r"(?:MEDICAL\s+RECORD|PATIENT\s+HISTORY|HOSPITAL\s+REPORT)",
            "maps_to": "agency", # Using agency to store facility/record type
            "confidence": "HIGH",
            "doc_type": "MEDICAL_RECORD",
        },
        
        # Date formats (multiple patterns, ordered by specificity)
        "date_mdy_slash": {
            "pattern": r"(?:Date[:\s]*)?(?P<month>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{2,4})",
            "maps_to": "date",
            "confidence": "MEDIUM",
            "doc_type": None,
        },
        
        "date_written_long": {
            "pattern": r"(?P<month>January|February|March|April|May|June|July|August|September|October|November|December)\s+(?P<day>\d{1,2}),?\s+(?P<year>\d{4})",
            "maps_to": "date",
            "confidence": "HIGH",
            "doc_type": None,
        },
        
        "date_written_short": {
            "pattern": r"(?P<day>\d{1,2})\s+(?P<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?P<year>\d{2,4})",
            "maps_to": "date",
            "confidence": "MEDIUM",
            "doc_type": None,
        },
        
        "date_iso": {
            "pattern": r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})",
            "maps_to": "date",
            "confidence": "HIGH",
            "doc_type": None,
        },
        
        # Warren Commission Exhibits
        "warren_exhibit": {
            "pattern": r"(?:Commission\s+)?(?:Exhibit\s+)?(?P<exhibit>CE-?\d+|CD-?\d+)",
            "maps_to": "rif_number",
            "confidence": "HIGH",
            "doc_type": "WARREN_COMMISSION",
        },
    }
    
    # ==========================================================================
    # FOOTER PATTERN DEFINITIONS (FBI 302 specific)
    # ==========================================================================
    
    FOOTER_PATTERNS = {
        # "transcribed by SA [Name]" or "dictated by SA [Name]"
        # Handles: "SA James P. Hosty", "SA C. Ray Hall", "SA John Smith"
        "fbi_transcribed_by": {
            "pattern": r"(?:transcribed|dictated|typed)\s+(?:by\s+)?(?:SA\s+)?(?P<agent>[A-Z](?:[a-z]+|\.)\s+(?:[A-Z](?:[a-z]+|\.)\s+)?[A-Z][a-z]+)",
            "maps_to": "footer_author",
            "confidence": "HIGH",
        },
        
        # Agent name with slash notation: "Smith/Jones" or "SMITH/JONES"
        "fbi_agent_slash": {
            "pattern": r"(?P<agent>[A-Z][a-z]+(?:/[A-Z][a-z]+)?)\s*:\s*[a-z]{2,3}$",
            "maps_to": "footer_author",
            "confidence": "MEDIUM",
        },
        
        # File number at end of document (e.g., "DL 89-43" or "89-43")
        "fbi_footer_file": {
            "pattern": r"(?P<file>[A-Z]{2}\s*\d{2,3}-\d+|\d{2,3}-\d{3,7})\s*$",
            "maps_to": "footer_file_number",
            "confidence": "MEDIUM",
        },
        
        # Date of transcription pattern
        "fbi_transcription_date": {
            "pattern": r"(?:Date\s+(?:of\s+)?(?:transcription|dictation)[:\s]*)?(?P<month>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{2,4})",
            "maps_to": "footer_date",
            "confidence": "MEDIUM",
        },
        
        # "on [date]" pattern common in FBI footers
        "fbi_footer_on_date": {
            "pattern": r"on\s+(?P<month>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{2,4})",
            "maps_to": "footer_date",
            "confidence": "LOW",
        },
    }
    
    # Month name to number mapping
    MONTH_MAP = {
        "january": 1, "jan": 1,
        "february": 2, "feb": 2,
        "march": 3, "mar": 3,
        "april": 4, "apr": 4,
        "may": 5,
        "june": 6, "jun": 6,
        "july": 7, "jul": 7,
        "august": 8, "aug": 8,
        "september": 9, "sep": 9, "sept": 9,
        "october": 10, "oct": 10,
        "november": 11, "nov": 11,
        "december": 12, "dec": 12,
    }
    
    def __init__(self):
        # Compile header patterns for performance
        self._compiled = {
            name: re.compile(cfg["pattern"], re.IGNORECASE | re.MULTILINE)
            for name, cfg in self.PATTERNS.items()
        }
        # Compile footer patterns
        self._footer_compiled = {
            name: re.compile(cfg["pattern"], re.IGNORECASE | re.MULTILINE)
            for name, cfg in self.FOOTER_PATTERNS.items()
        }
    
    def parse(self, text: str, include_footer: bool = True) -> ParsedMetadata:
        """
        Parse OCR text and extract header (and optionally footer) metadata.
        
        Args:
            text: Full OCR text from document
            include_footer: If True, also scan document footer for FBI 302 metadata
            
        Returns:
            ParsedMetadata with extracted fields and confidence scores
        """
        result = ParsedMetadata()
        
        # Step 1: Classify document type (if classifier available)
        if CLASSIFIER_AVAILABLE:
            classification = classify_document(text)
            result.classified_type = classification.doc_type.value
            result.classification_confidence = classification.confidence
            result.classification_label = classification.confidence_label
            result.extraction_notes.append(
                f"Document classified as {classification.doc_type.value} "
                f"({classification.confidence:.0%} confidence)"
            )
        
        # Only search the header window (first N characters)
        header_text = text[:self.HEADER_WINDOW]
        result.raw_header = header_text
        
        # Track detected document type
        detected_doc_type = None
        header_field_count = 0
        
        # Apply each header pattern
        for pattern_name, config in self.PATTERNS.items():
            regex = self._compiled[pattern_name]
            match = regex.search(header_text)
            
            if not match:
                continue
            
            maps_to = config["maps_to"]
            confidence = config["confidence"]
            doc_type = config.get("doc_type")
            
            # Extract the primary named group value
            groups = match.groupdict()
            primary_key = [k for k in groups.keys() if groups[k]][0]
            value = groups[primary_key].strip()
            
            extracted = ExtractedField(
                value=value,
                confidence=confidence,
                pattern_name=pattern_name,
                raw_match=match.group(0),
            )
            
            # Map to result field (only if not already set with higher confidence)
            if maps_to == "rif_number":
                if not result.rif_number or self._confidence_rank(confidence) > self._confidence_rank(result.rif_number.confidence):
                    result.rif_number = extracted
                    header_field_count += 1
                    
            elif maps_to == "agency":
                if not result.agency or self._confidence_rank(confidence) > self._confidence_rank(result.agency.confidence):
                    result.agency = extracted
                    header_field_count += 1
                    
            elif maps_to == "author":
                if not result.author or self._confidence_rank(confidence) > self._confidence_rank(result.author.confidence):
                    result.author = extracted
                    header_field_count += 1
                    
            elif maps_to == "date":
                if not result.date or self._confidence_rank(confidence) > self._confidence_rank(result.date.confidence):
                    result.date = extracted
                    header_field_count += 1
                    # Normalize the date
                    result.date_iso = self._normalize_date(groups, pattern_name)
            
            # Update document type detection
            if doc_type and not detected_doc_type:
                detected_doc_type = doc_type
        
        result.document_type = detected_doc_type
        
        # Parse footer if requested
        footer_field_count = 0
        if include_footer:
            footer_field_count = self._parse_footer(text, result)
        
        # Add extraction notes
        total_fields = header_field_count + footer_field_count
        if total_fields > 0:
            notes = []
            if header_field_count > 0:
                notes.append(f"{header_field_count} header field(s)")
            if footer_field_count > 0:
                notes.append(f"{footer_field_count} footer field(s)")
            result.extraction_notes.append(f"Extracted {' + '.join(notes)}")
            if result.document_type:
                result.extraction_notes.append(f"Document type detected: {result.document_type}")
        else:
            result.extraction_notes.append("No recognizable patterns found in header or footer")
        
        return result
    
    def _parse_footer(self, text: str, result: ParsedMetadata) -> int:
        """
        Parse document footer for FBI 302-specific metadata.
        
        Args:
            text: Full OCR text
            result: ParsedMetadata to update with footer fields
            
        Returns:
            Number of fields extracted from footer
        """
        # Get footer window (last N characters)
        footer_text = text[-self.FOOTER_WINDOW:] if len(text) > self.FOOTER_WINDOW else text
        result.raw_footer = footer_text
        
        field_count = 0
        
        for pattern_name, config in self.FOOTER_PATTERNS.items():
            regex = self._footer_compiled[pattern_name]
            match = regex.search(footer_text)
            
            if not match:
                continue
            
            maps_to = config["maps_to"]
            confidence = config["confidence"]
            
            # Extract the primary named group value
            groups = match.groupdict()
            non_none_keys = [k for k in groups.keys() if groups[k]]
            if not non_none_keys:
                continue
            primary_key = non_none_keys[0]
            value = groups[primary_key].strip()
            
            extracted = ExtractedField(
                value=value,
                confidence=confidence,
                pattern_name=pattern_name,
                raw_match=match.group(0),
            )
            
            # Map to footer result fields
            if maps_to == "footer_author":
                if not result.footer_author or self._confidence_rank(confidence) > self._confidence_rank(result.footer_author.confidence):
                    result.footer_author = extracted
                    field_count += 1
                    # If no header author, this becomes the primary author
                    if not result.author:
                        result.author = extracted
                        
            elif maps_to == "footer_file_number":
                if not result.footer_file_number or self._confidence_rank(confidence) > self._confidence_rank(result.footer_file_number.confidence):
                    result.footer_file_number = extracted
                    field_count += 1
                    # If no header RIF, use footer file number
                    if not result.rif_number:
                        result.rif_number = extracted
                        
            elif maps_to == "footer_date":
                if not result.footer_date or self._confidence_rank(confidence) > self._confidence_rank(result.footer_date.confidence):
                    result.footer_date = extracted
                    field_count += 1
        
        # If we found footer fields and no doc type yet, likely FBI 302
        if field_count > 0 and not result.document_type:
            result.document_type = "FBI_302"
        
        return field_count
    
    def _confidence_rank(self, confidence: str) -> int:
        """Convert confidence level to numeric rank for comparison."""
        return {"HIGH": 3, "MEDIUM": 2, "LOW": 1}.get(confidence, 0)
    
    def _normalize_date(self, groups: dict, pattern_name: str) -> Optional[str]:
        """
        Normalize extracted date components to ISO format (YYYY-MM-DD).
        
        Handles:
        - 2-digit years (assumes 1900s for 00-99)
        - Month names (January, Jan, etc.)
        - Various numeric formats
        """
        try:
            month = groups.get("month")
            day = groups.get("day")
            year = groups.get("year")
            
            if not all([month, day, year]):
                return None
            
            # Convert month name to number if needed
            if isinstance(month, str) and not month.isdigit():
                month = self.MONTH_MAP.get(month.lower())
                if not month:
                    return None
            else:
                month = int(month)
            
            day = int(day)
            year = int(year)
            
            # Handle 2-digit years (assume 1900s for JFK-era documents)
            if year < 100:
                year = 1900 + year
            
            # Validate ranges
            if not (1 <= month <= 12 and 1 <= day <= 31 and 1900 <= year <= 2100):
                return None
            
            return f"{year:04d}-{month:02d}-{day:02d}"
            
        except (ValueError, TypeError):
            return None


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def parse_metadata(text: str, include_footer: bool = True) -> dict:
    """
    Convenience function to parse text and return JSON-serializable dict.
    
    Args:
        text: OCR text to parse
        include_footer: If True, also scan document footer (default: True)
        
    Returns:
        Dictionary with extracted metadata from header and footer
    """
    parser = MetadataParser()
    result = parser.parse(text, include_footer=include_footer)
    return result.to_dict()


def parse_document(text: str) -> dict:
    """
    Full document parser — scans both header and footer.
    Alias for parse_metadata(text, include_footer=True).
    """
    return parse_metadata(text, include_footer=True)


# =============================================================================
# CLI TESTING
# =============================================================================

if __name__ == "__main__":
    import sys
    import json
    
    # Test samples
    TEST_SAMPLES = [
        # FBI 302 style (header)
        """
        FEDERAL BUREAU OF INVESTIGATION
        
        Date: 11/23/63
        
        SA James P. Hosty, Dallas Field Office
        File Number: DL 89-43
        
        Interview of LEE HARVEY OSWALD conducted at Dallas Police Department...
        """,
        
        # NARA RIF style
        """
        AGENCY: CIA
        RECORD NUMBER: 104-10001-10001
        
        RECORDS SERIES: JFK ASSASSINATION RECORDS
        
        AGENCY FILE NUMBER: 80T01357A
        
        Document Date: November 22, 1963
        """,
        
        # Warren Commission exhibit
        """
        Commission Exhibit CE-399
        
        Date: 22 Nov 1963
        
        Description: Bullet recovered from stretcher at Parkland Hospital
        """,
        
        # FBI 302 with footer (agent info at bottom)
        """
        FEDERAL BUREAU OF INVESTIGATION
        
        Date of transcription: 11/26/63
        
        RALPH LEON YATES, 2527 Glenfield, Dallas, Texas, was interviewed at his 
        place of employment, Morgan Express Company, 2531 Glenfield, Dallas, Texas.
        
        YATES stated that on Wednesday, November 20, 1963, he was driving a pickup
        truck south on the Stemmons Expressway...
        
        [Multiple paragraphs of interview content...]
        
        ...YATES stated he did not observe the man closely enough to furnish a 
        detailed description.
        
        transcribed by SA C. Ray Hall
        DL 89-43
        on 11/26/63
        """,
    ]
    
    parser = MetadataParser()
    
    print("=" * 60)
    print("Forensic Metadata Parser - Test Suite")
    print("=" * 60)
    
    for i, sample in enumerate(TEST_SAMPLES, 1):
        print(f"\n--- Test Sample {i} ---")
        result = parser.parse(sample)
        print(json.dumps(result.to_dict(), indent=2, default=str))
        print()
