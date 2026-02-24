"""
header_parser.py — Forensic Header Parser for Archival Documents

Extracts structured metadata (Agency, RIF Number, Date, Author) from OCR'd 
archival document headers using regex-based pattern recognition.

Supports:
- FBI 302 Forms (Agent name, Field Office, Date)
- NARA RIF Sheets (Agency, Record Number, Date)

See: docs/ui/ocr/plans/forensic-header-parser.md (WO-OCR-007)
"""

import re
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field, asdict


@dataclass
class ExtractedField:
    """A single extracted metadata field with confidence scoring."""
    value: str
    confidence: str  # HIGH, MEDIUM, LOW
    pattern_name: str
    raw_match: str


@dataclass
class ParsedHeader:
    """Complete extraction result from a document header."""
    rif_number: Optional[ExtractedField] = None
    agency: Optional[ExtractedField] = None
    date: Optional[ExtractedField] = None
    date_iso: Optional[str] = None  # Normalized ISO date
    author: Optional[ExtractedField] = None
    document_type: Optional[str] = None  # FBI_302, NARA_RIF, etc.
    raw_header: str = ""
    extraction_notes: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dictionary."""
        result = {
            "rif_number": asdict(self.rif_number) if self.rif_number else None,
            "agency": asdict(self.agency) if self.agency else None,
            "date": asdict(self.date) if self.date else None,
            "date_iso": self.date_iso,
            "author": asdict(self.author) if self.author else None,
            "document_type": self.document_type,
            "raw_header": self.raw_header,
            "extraction_notes": self.extraction_notes,
        }
        return result
    
    def has_extractions(self) -> bool:
        """Returns True if any fields were extracted."""
        return any([self.rif_number, self.agency, self.date, self.author])


class HeaderParser:
    """
    Regex-based metadata extractor for archival document headers.
    
    Usage:
        parser = HeaderParser()
        result = parser.parse(ocr_text)
        if result.has_extractions():
            print(result.to_dict())
    """
    
    # Number of characters from start of document to search for headers
    HEADER_WINDOW = 2000
    
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
        "fbi_agent": {
            "pattern": r"(?:SA|Special\s+Agent)\s+(?P<agent>[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)",
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
        # Compile patterns for performance
        self._compiled = {
            name: re.compile(cfg["pattern"], re.IGNORECASE | re.MULTILINE)
            for name, cfg in self.PATTERNS.items()
        }
    
    def parse(self, text: str) -> ParsedHeader:
        """
        Parse OCR text and extract header metadata.
        
        Args:
            text: Full OCR text from document
            
        Returns:
            ParsedHeader with extracted fields and confidence scores
        """
        result = ParsedHeader()
        
        # Only search the header window (first N characters)
        header_text = text[:self.HEADER_WINDOW]
        result.raw_header = header_text
        
        # Track detected document type
        detected_doc_type = None
        
        # Apply each pattern
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
                    
            elif maps_to == "agency":
                if not result.agency or self._confidence_rank(confidence) > self._confidence_rank(result.agency.confidence):
                    result.agency = extracted
                    
            elif maps_to == "author":
                if not result.author or self._confidence_rank(confidence) > self._confidence_rank(result.author.confidence):
                    result.author = extracted
                    
            elif maps_to == "date":
                if not result.date or self._confidence_rank(confidence) > self._confidence_rank(result.date.confidence):
                    result.date = extracted
                    # Normalize the date
                    result.date_iso = self._normalize_date(groups, pattern_name)
            
            # Update document type detection
            if doc_type and not detected_doc_type:
                detected_doc_type = doc_type
        
        result.document_type = detected_doc_type
        
        # Add extraction notes
        if result.has_extractions():
            result.extraction_notes.append(f"Extracted {sum(1 for f in [result.rif_number, result.agency, result.date, result.author] if f)} field(s)")
            if result.document_type:
                result.extraction_notes.append(f"Document type detected: {result.document_type}")
        else:
            result.extraction_notes.append("No recognizable header patterns found")
        
        return result
    
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
# CONVENIENCE FUNCTION
# =============================================================================

def parse_header(text: str) -> dict:
    """
    Convenience function to parse text and return JSON-serializable dict.
    
    Args:
        text: OCR text to parse
        
    Returns:
        Dictionary with extracted metadata
    """
    parser = HeaderParser()
    result = parser.parse(text)
    return result.to_dict()


# =============================================================================
# CLI TESTING
# =============================================================================

if __name__ == "__main__":
    import sys
    import json
    
    # Test samples
    TEST_SAMPLES = [
        # FBI 302 style
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
    ]
    
    parser = HeaderParser()
    
    print("=" * 60)
    print("Forensic Header Parser — Test Suite")
    print("=" * 60)
    
    for i, sample in enumerate(TEST_SAMPLES, 1):
        print(f"\n--- Test Sample {i} ---")
        result = parser.parse(sample)
        print(json.dumps(result.to_dict(), indent=2, default=str))
        print()
