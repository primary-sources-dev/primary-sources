"""
citation_generator.py — Academic Citation Generator for Primary Sources

Generates properly formatted citations in Chicago, MLA, and APA styles
from source metadata in the research vault.

Usage:
    from citation_generator import generate_citation, CitationFormat
    
    source = {
        "title": "Interview of Ralph Leon Yates",
        "author": "SA C. Ray Hall",
        "published_date": "1963-11-26",
        "source_type": "FBI_302",
        "external_ref": "DL 89-43",
        "archive": "NARA"
    }
    
    chicago = generate_citation(source, CitationFormat.CHICAGO)
    mla = generate_citation(source, CitationFormat.MLA)
    apa = generate_citation(source, CitationFormat.APA)
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional
import re


class CitationFormat(Enum):
    """Supported citation formats."""
    CHICAGO = "chicago"
    MLA = "mla"
    APA = "apa"
    NARA = "nara"  # NARA-specific format with RIF


@dataclass
class SourceMetadata:
    """Normalized source metadata for citation generation."""
    title: str
    author: Optional[str] = None
    published_date: Optional[str] = None  # ISO format: YYYY-MM-DD
    source_type: Optional[str] = None
    external_ref: Optional[str] = None  # RIF number or file number
    archive: Optional[str] = None
    page_number: Optional[str] = None
    volume: Optional[str] = None
    publisher: Optional[str] = None
    url: Optional[str] = None
    accessed_date: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: dict) -> "SourceMetadata":
        """Create SourceMetadata from dictionary."""
        return cls(
            title=data.get("title", "Untitled Document"),
            author=data.get("author"),
            published_date=data.get("published_date"),
            source_type=data.get("source_type"),
            external_ref=data.get("external_ref"),
            archive=data.get("archive"),
            page_number=data.get("page_number"),
            volume=data.get("volume"),
            publisher=data.get("publisher"),
            url=data.get("url"),
            accessed_date=data.get("accessed_date"),
        )


# =============================================================================
# SOURCE TYPE LABELS
# =============================================================================

SOURCE_TYPE_LABELS = {
    "FBI_302": "FBI Interview Report (FD-302)",
    "NARA_RIF": "Declassified Government Record",
    "WARREN_COMMISSION": "Warren Commission Document",
    "MEMO": "Memorandum",
    "REPORT": "Report",
    "LETTER": "Letter",
    "TESTIMONY": "Testimony",
    "PHOTOGRAPH": "Photograph",
    "DOCUMENT": "Document",
}


# =============================================================================
# CITATION FORMATTERS
# =============================================================================

def _format_date_chicago(iso_date: str) -> str:
    """Format ISO date to Chicago style: Month Day, Year."""
    try:
        dt = datetime.strptime(iso_date, "%Y-%m-%d")
        return dt.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        return iso_date or ""


def _format_date_mla(iso_date: str) -> str:
    """Format ISO date to MLA style: Day Month Year."""
    try:
        dt = datetime.strptime(iso_date, "%Y-%m-%d")
        return dt.strftime("%d %b. %Y")
    except (ValueError, TypeError):
        return iso_date or ""


def _format_date_apa(iso_date: str) -> str:
    """Format ISO date to APA style: (Year, Month Day)."""
    try:
        dt = datetime.strptime(iso_date, "%Y-%m-%d")
        return dt.strftime("%Y, %B %d")
    except (ValueError, TypeError):
        return iso_date or ""


def _extract_year(iso_date: str) -> str:
    """Extract year from ISO date."""
    if iso_date and len(iso_date) >= 4:
        return iso_date[:4]
    return "n.d."


def _format_author_apa(author: str) -> str:
    """Format author name for APA style: Last, F. M."""
    if not author:
        return ""
    
    # Handle "SA C. Ray Hall" format
    author = re.sub(r"^SA\s+", "", author)  # Remove SA prefix
    
    parts = author.split()
    if len(parts) == 1:
        return parts[0]
    elif len(parts) == 2:
        return f"{parts[1]}, {parts[0][0]}."
    else:
        # Last name is final part, everything else is first/middle
        last = parts[-1]
        initials = " ".join(f"{p[0]}." for p in parts[:-1])
        return f"{last}, {initials}"


def _format_nara_ref(external_ref: str) -> str:
    """Format NARA RIF or file number."""
    if not external_ref:
        return ""
    
    # Check if it's a NARA RIF format (XXX-XXXXX-XXXXX)
    if re.match(r"\d{3}-\d{5}-\d{5}", external_ref):
        return f"NARA RIF {external_ref}"
    
    # Otherwise it's a file number
    return f"File No. {external_ref}"


# =============================================================================
# CITATION GENERATORS
# =============================================================================

def _generate_chicago(meta: SourceMetadata) -> str:
    """
    Generate Chicago Manual of Style (17th ed.) citation.
    
    Format: Author. "Title." Source Type, Date. Archive, Reference.
    """
    parts = []
    
    # Author
    if meta.author:
        author = re.sub(r"^SA\s+", "", meta.author)  # Remove SA prefix
        parts.append(f"{author}.")
    
    # Title (in quotes)
    parts.append(f'"{meta.title}."')
    
    # Source type
    source_label = SOURCE_TYPE_LABELS.get(meta.source_type, meta.source_type or "Document")
    parts.append(source_label + ",")
    
    # Date
    if meta.published_date:
        parts.append(_format_date_chicago(meta.published_date) + ".")
    
    # Archive and reference
    archive_ref = []
    if meta.archive:
        archive_ref.append(meta.archive)
    if meta.external_ref:
        archive_ref.append(_format_nara_ref(meta.external_ref))
    if archive_ref:
        parts.append(", ".join(archive_ref) + ".")
    
    # URL if present
    if meta.url:
        parts.append(meta.url + ".")
    
    return " ".join(parts)


def _generate_mla(meta: SourceMetadata) -> str:
    """
    Generate MLA (9th ed.) citation.
    
    Format: Author. "Title." Source Type, Archive, Date. Reference.
    """
    parts = []
    
    # Author
    if meta.author:
        author = re.sub(r"^SA\s+", "", meta.author)
        parts.append(f"{author}.")
    
    # Title (in quotes)
    parts.append(f'"{meta.title}."')
    
    # Source type / container
    source_label = SOURCE_TYPE_LABELS.get(meta.source_type, meta.source_type or "Document")
    parts.append(source_label + ",")
    
    # Archive
    if meta.archive:
        parts.append(meta.archive + ",")
    
    # Date
    if meta.published_date:
        parts.append(_format_date_mla(meta.published_date) + ".")
    
    # Reference number
    if meta.external_ref:
        parts.append(_format_nara_ref(meta.external_ref) + ".")
    
    return " ".join(parts)


def _generate_apa(meta: SourceMetadata) -> str:
    """
    Generate APA (7th ed.) citation.
    
    Format: Author (Year, Month Day). Title. Source Type. Archive. Reference.
    """
    parts = []
    
    # Author (Last, F. M.)
    if meta.author:
        parts.append(_format_author_apa(meta.author))
    
    # Date in parentheses
    if meta.published_date:
        year = _extract_year(meta.published_date)
        parts.append(f"({_format_date_apa(meta.published_date)}).")
    else:
        parts.append("(n.d.).")
    
    # Title (italicized in real APA, but we output plain text)
    parts.append(f"{meta.title}.")
    
    # Source type
    source_label = SOURCE_TYPE_LABELS.get(meta.source_type, meta.source_type or "Document")
    parts.append(source_label + ".")
    
    # Archive
    if meta.archive:
        parts.append(meta.archive + ".")
    
    # Reference
    if meta.external_ref:
        parts.append(_format_nara_ref(meta.external_ref) + ".")
    
    return " ".join(parts)


def _generate_nara(meta: SourceMetadata) -> str:
    """
    Generate NARA-specific archival citation.
    
    Format: RIF [Number]; [Title]; [Date]; [Archive]
    """
    parts = []
    
    if meta.external_ref:
        parts.append(_format_nara_ref(meta.external_ref))
    
    parts.append(meta.title)
    
    if meta.published_date:
        parts.append(_format_date_chicago(meta.published_date))
    
    if meta.archive:
        parts.append(meta.archive)
    
    if meta.author:
        author = re.sub(r"^SA\s+", "", meta.author)
        parts.append(f"Author: {author}")
    
    return "; ".join(parts)


# =============================================================================
# PUBLIC API
# =============================================================================

def generate_citation(source: dict, format: CitationFormat = CitationFormat.CHICAGO) -> str:
    """
    Generate a formatted citation from source metadata.
    
    Args:
        source: Dictionary containing source metadata
        format: Citation format (CHICAGO, MLA, APA, NARA)
        
    Returns:
        Formatted citation string
    """
    meta = SourceMetadata.from_dict(source)
    
    if format == CitationFormat.CHICAGO:
        return _generate_chicago(meta)
    elif format == CitationFormat.MLA:
        return _generate_mla(meta)
    elif format == CitationFormat.APA:
        return _generate_apa(meta)
    elif format == CitationFormat.NARA:
        return _generate_nara(meta)
    else:
        return _generate_chicago(meta)


def generate_all_citations(source: dict) -> dict:
    """
    Generate citations in all supported formats.
    
    Args:
        source: Dictionary containing source metadata
        
    Returns:
        Dictionary with format names as keys and citations as values
    """
    return {
        "chicago": generate_citation(source, CitationFormat.CHICAGO),
        "mla": generate_citation(source, CitationFormat.MLA),
        "apa": generate_citation(source, CitationFormat.APA),
        "nara": generate_citation(source, CitationFormat.NARA),
    }


# =============================================================================
# CLI TESTING
# =============================================================================

if __name__ == "__main__":
    import json
    
    # Test sources
    TEST_SOURCES = [
        {
            "title": "Interview of Ralph Leon Yates",
            "author": "SA C. Ray Hall",
            "published_date": "1963-11-26",
            "source_type": "FBI_302",
            "external_ref": "DL 89-43",
            "archive": "NARA",
        },
        {
            "title": "CIA Memorandum on Cuban Operations",
            "author": "Richard Helms",
            "published_date": "1963-11-22",
            "source_type": "MEMO",
            "external_ref": "104-10001-10001",
            "archive": "NARA JFK Collection",
        },
        {
            "title": "Warren Commission Testimony of Marina Oswald",
            "published_date": "1964-02-03",
            "source_type": "TESTIMONY",
            "external_ref": "CE-1156",
            "archive": "National Archives",
        },
    ]
    
    print("=" * 70)
    print("Citation Generator — Test Suite")
    print("=" * 70)
    
    for i, source in enumerate(TEST_SOURCES, 1):
        print(f"\n--- Source {i}: {source['title'][:40]}... ---\n")
        
        citations = generate_all_citations(source)
        for format_name, citation in citations.items():
            print(f"  {format_name.upper():8} | {citation}")
        print()
