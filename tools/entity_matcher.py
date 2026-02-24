"""
entity_matcher.py — Entity Matching for OCR Text

Scans OCR text against known entities in the research vault database
to auto-link mentions to their database records.

Supports:
- Exact matching against person, place, and org display names
- Alias matching via person_alias table
- Confidence scoring (100% for exact match, lower for partial/fuzzy)

Usage:
    from entity_matcher import EntityMatcher, find_entities
    
    # Quick function
    matches = find_entities(ocr_text)
    
    # With custom entity list
    matcher = EntityMatcher()
    matcher.load_from_json("entities.json")  # Or load_from_supabase()
    matches = matcher.find_matches(ocr_text)
"""

import json
import os
import re
from dataclasses import dataclass, asdict, field
from typing import Optional
from datetime import datetime


@dataclass
class EntityMatch:
    """A single entity match found in text."""
    text: str                    # The matched text span
    entity_type: str             # person, place, org
    entity_id: Optional[str]     # UUID from database (or None if new)
    display_name: str            # Canonical name from database
    confidence: float            # 0.0 to 1.0
    method: str                  # exact_match, alias_match, partial_match
    start_pos: int               # Character position in text
    end_pos: int                 # End character position
    status: str = "matched"      # matched, needs_review, new_candidate
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class EntityIndex:
    """Index of known entities for fast lookup."""
    persons: dict = field(default_factory=dict)      # name.lower() -> {id, display_name}
    aliases: dict = field(default_factory=dict)      # alias.lower() -> {person_id, display_name}
    places: dict = field(default_factory=dict)       # name.lower() -> {id, name}
    orgs: dict = field(default_factory=dict)         # name.lower() -> {id, name}
    loaded_at: Optional[str] = None
    
    def total_count(self) -> int:
        return len(self.persons) + len(self.aliases) + len(self.places) + len(self.orgs)


class EntityMatcher:
    """
    Scans text for known entities and returns matches with confidence scores.
    
    Supports loading entities from:
    - JSON file (offline mode)
    - Supabase database (live mode)
    """
    
    def __init__(self):
        self.index = EntityIndex()
        self._name_pattern = re.compile(
            r'\b([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)\b'
        )
    
    # =========================================================================
    # LOADING METHODS
    # =========================================================================
    
    def load_from_json(self, filepath: str) -> int:
        """
        Load entity index from JSON file.
        
        JSON format:
        {
            "persons": [{"id": "...", "display_name": "..."}],
            "aliases": [{"person_id": "...", "alias_value": "...", "display_name": "..."}],
            "places": [{"id": "...", "name": "..."}],
            "orgs": [{"id": "...", "name": "..."}]
        }
        
        Returns number of entities loaded.
        """
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Index persons
        for p in data.get("persons", []):
            key = p["display_name"].lower()
            self.index.persons[key] = {
                "id": p["id"],
                "display_name": p["display_name"]
            }
        
        # Index aliases
        for a in data.get("aliases", []):
            key = a["alias_value"].lower()
            self.index.aliases[key] = {
                "person_id": a["person_id"],
                "display_name": a.get("display_name", a["alias_value"])
            }
        
        # Index places
        for p in data.get("places", []):
            key = p["name"].lower()
            self.index.places[key] = {
                "id": p["id"],
                "name": p["name"]
            }
        
        # Index orgs
        for o in data.get("orgs", []):
            key = o["name"].lower()
            self.index.orgs[key] = {
                "id": o["id"],
                "name": o["name"]
            }
        
        self.index.loaded_at = datetime.now().isoformat()
        return self.index.total_count()
    
    def load_from_supabase(self, url: str, key: str) -> int:
        """
        Load entity index from Supabase database.
        
        Requires: pip install supabase
        
        Returns number of entities loaded.
        """
        try:
            from supabase import create_client
        except ImportError:
            raise RuntimeError("Supabase client not installed. Run: pip install supabase")
        
        client = create_client(url, key)
        
        # Load persons
        result = client.table("person").select("person_id, display_name").execute()
        for row in result.data:
            key = row["display_name"].lower()
            self.index.persons[key] = {
                "id": row["person_id"],
                "display_name": row["display_name"]
            }
        
        # Load aliases
        result = client.table("person_alias").select("person_id, alias_value").execute()
        for row in result.data:
            key = row["alias_value"].lower()
            # Look up display name from persons
            person_info = next(
                (p for p in self.index.persons.values() if p["id"] == row["person_id"]),
                None
            )
            self.index.aliases[key] = {
                "person_id": row["person_id"],
                "display_name": person_info["display_name"] if person_info else row["alias_value"]
            }
        
        # Load places
        result = client.table("place").select("place_id, name").execute()
        for row in result.data:
            key = row["name"].lower()
            self.index.places[key] = {
                "id": row["place_id"],
                "name": row["name"]
            }
        
        # Load orgs
        result = client.table("org").select("org_id, name").execute()
        for row in result.data:
            key = row["name"].lower()
            self.index.orgs[key] = {
                "id": row["org_id"],
                "name": row["name"]
            }
        
        self.index.loaded_at = datetime.now().isoformat()
        return self.index.total_count()
    
    def load_sample_data(self) -> int:
        """
        Load sample JFK-era entities for testing without database.
        """
        sample_persons = [
            {"id": "person-001", "display_name": "Ralph Leon Yates"},
            {"id": "person-002", "display_name": "Lee Harvey Oswald"},
            {"id": "person-003", "display_name": "Jack Ruby"},
            {"id": "person-004", "display_name": "Marina Oswald"},
            {"id": "person-005", "display_name": "J. D. Tippit"},
        ]
        
        sample_aliases = [
            {"person_id": "person-002", "alias_value": "Lee Oswald", "display_name": "Lee Harvey Oswald"},
            {"person_id": "person-002", "alias_value": "L.H. Oswald", "display_name": "Lee Harvey Oswald"},
            {"person_id": "person-002", "alias_value": "A. Hidell", "display_name": "Lee Harvey Oswald"},
            {"person_id": "person-003", "alias_value": "Jacob Rubenstein", "display_name": "Jack Ruby"},
        ]
        
        sample_places = [
            {"id": "place-001", "name": "Dallas"},
            {"id": "place-002", "name": "Dealey Plaza"},
            {"id": "place-003", "name": "Texas School Book Depository"},
            {"id": "place-004", "name": "Parkland Hospital"},
            {"id": "place-005", "name": "Oak Cliff"},
        ]
        
        sample_orgs = [
            {"id": "org-001", "name": "FBI"},
            {"id": "org-002", "name": "CIA"},
            {"id": "org-003", "name": "Dallas Police Department"},
            {"id": "org-004", "name": "Secret Service"},
            {"id": "org-005", "name": "Warren Commission"},
        ]
        
        # Index everything
        for p in sample_persons:
            self.index.persons[p["display_name"].lower()] = {"id": p["id"], "display_name": p["display_name"]}
        
        for a in sample_aliases:
            self.index.aliases[a["alias_value"].lower()] = {"person_id": a["person_id"], "display_name": a["display_name"]}
        
        for p in sample_places:
            self.index.places[p["name"].lower()] = {"id": p["id"], "name": p["name"]}
        
        for o in sample_orgs:
            self.index.orgs[o["name"].lower()] = {"id": o["id"], "name": o["name"]}
        
        self.index.loaded_at = datetime.now().isoformat()
        return self.index.total_count()
    
    # =========================================================================
    # MATCHING METHODS
    # =========================================================================
    
    def find_matches(self, text: str) -> list[EntityMatch]:
        """
        Scan text and return all entity matches.
        
        Args:
            text: OCR or document text to scan
            
        Returns:
            List of EntityMatch objects sorted by position
        """
        matches = []
        text_lower = text.lower()
        
        # Check exact person matches
        for name_lower, info in self.index.persons.items():
            pos = text_lower.find(name_lower)
            if pos >= 0:
                matches.append(EntityMatch(
                    text=text[pos:pos + len(name_lower)],
                    entity_type="person",
                    entity_id=info["id"],
                    display_name=info["display_name"],
                    confidence=1.0,
                    method="exact_match",
                    start_pos=pos,
                    end_pos=pos + len(name_lower),
                    status="matched"
                ))
        
        # Check alias matches
        for alias_lower, info in self.index.aliases.items():
            pos = text_lower.find(alias_lower)
            if pos >= 0:
                # Check if not already matched as exact person
                if not any(m.start_pos <= pos < m.end_pos and m.entity_type == "person" for m in matches):
                    matches.append(EntityMatch(
                        text=text[pos:pos + len(alias_lower)],
                        entity_type="person",
                        entity_id=info["person_id"],
                        display_name=info["display_name"],
                        confidence=0.95,  # Slightly lower for alias
                        method="alias_match",
                        start_pos=pos,
                        end_pos=pos + len(alias_lower),
                        status="matched"
                    ))
        
        # Check place matches
        for name_lower, info in self.index.places.items():
            pos = text_lower.find(name_lower)
            if pos >= 0:
                matches.append(EntityMatch(
                    text=text[pos:pos + len(name_lower)],
                    entity_type="place",
                    entity_id=info["id"],
                    display_name=info["name"],
                    confidence=1.0,
                    method="exact_match",
                    start_pos=pos,
                    end_pos=pos + len(name_lower),
                    status="matched"
                ))
        
        # Check org matches
        for name_lower, info in self.index.orgs.items():
            pos = text_lower.find(name_lower)
            if pos >= 0:
                matches.append(EntityMatch(
                    text=text[pos:pos + len(name_lower)],
                    entity_type="org",
                    entity_id=info["id"],
                    display_name=info["name"],
                    confidence=1.0,
                    method="exact_match",
                    start_pos=pos,
                    end_pos=pos + len(name_lower),
                    status="matched"
                ))
        
        # Sort by position and remove duplicates
        matches.sort(key=lambda m: (m.start_pos, -m.confidence))
        return self._deduplicate_matches(matches)
    
    def _deduplicate_matches(self, matches: list[EntityMatch]) -> list[EntityMatch]:
        """Remove overlapping matches, keeping highest confidence."""
        if not matches:
            return []
        
        result = []
        for match in matches:
            # Check if this match overlaps with any existing
            overlaps = False
            for existing in result:
                if (match.start_pos < existing.end_pos and 
                    match.end_pos > existing.start_pos):
                    overlaps = True
                    break
            if not overlaps:
                result.append(match)
        
        return result
    
    def find_new_candidates(self, text: str) -> list[EntityMatch]:
        """
        Find potential new entities not in the database.
        
        Uses regex to find name-like patterns that aren't already matched.
        """
        known_matches = self.find_matches(text)
        known_positions = set()
        for m in known_matches:
            known_positions.update(range(m.start_pos, m.end_pos))
        
        candidates = []
        for match in self._name_pattern.finditer(text):
            start, end = match.span()
            # Skip if overlaps with known entity
            if any(p in known_positions for p in range(start, end)):
                continue
            
            name = match.group(1)
            # Skip very short names (likely false positives)
            if len(name) < 5:
                continue
            
            candidates.append(EntityMatch(
                text=name,
                entity_type="person",  # Assume person for names
                entity_id=None,
                display_name=name,
                confidence=0.7,
                method="pattern_match",
                start_pos=start,
                end_pos=end,
                status="new_candidate"
            ))
        
        return candidates
    
    # =========================================================================
    # OUTPUT METHODS
    # =========================================================================
    
    def generate_sidecar(self, text: str, source_filename: str) -> dict:
        """
        Generate entities.json sidecar for a document.
        
        Returns dict ready to be saved as JSON.
        """
        matches = self.find_matches(text)
        candidates = self.find_new_candidates(text)
        
        return {
            "document": source_filename,
            "processed_at": datetime.now().isoformat(),
            "entity_index_loaded_at": self.index.loaded_at,
            "total_entities_in_index": self.index.total_count(),
            "entities": [m.to_dict() for m in matches],
            "new_candidates": [c.to_dict() for c in candidates],
            "summary": {
                "matched": len(matches),
                "candidates": len(candidates),
                "persons": len([m for m in matches if m.entity_type == "person"]),
                "places": len([m for m in matches if m.entity_type == "place"]),
                "orgs": len([m for m in matches if m.entity_type == "org"]),
            }
        }


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

_DEFAULT_MATCHER: Optional[EntityMatcher] = None


def get_matcher() -> EntityMatcher:
    """Get or create default matcher with sample data."""
    global _DEFAULT_MATCHER
    if _DEFAULT_MATCHER is None:
        _DEFAULT_MATCHER = EntityMatcher()
        _DEFAULT_MATCHER.load_sample_data()
    return _DEFAULT_MATCHER


def find_entities(text: str) -> list[dict]:
    """
    Quick function to find entities in text.
    
    Returns list of entity match dictionaries.
    """
    matcher = get_matcher()
    matches = matcher.find_matches(text)
    return [m.to_dict() for m in matches]


def generate_entities_json(text: str, filename: str) -> dict:
    """
    Generate entities.json sidecar for a document.
    """
    matcher = get_matcher()
    return matcher.generate_sidecar(text, filename)


# =============================================================================
# CLI TESTING
# =============================================================================

if __name__ == "__main__":
    import json
    
    # Sample FBI 302 text
    TEST_TEXT = """
    FEDERAL BUREAU OF INVESTIGATION
    
    Date of transcription: 11/26/63
    
    RALPH LEON YATES, 2527 Glenfield, Dallas, Texas, was interviewed at his 
    place of employment, Morgan Express Company, 2531 Glenfield, Dallas, Texas.
    
    YATES stated that on Wednesday, November 20, 1963, he was driving a pickup
    truck south on the Stemmons Expressway when he picked up a young white male
    hitchhiker. The hitchhiker had a 4 foot long package wrapped in brown paper.
    
    The hitchhiker asked YATES if the motorcade route went by the Texas School 
    Book Depository. YATES stated that the hitchhiker resembled Lee Harvey Oswald
    from photographs he later saw on television.
    
    YATES reported the incident to the FBI office in Dallas on November 26, 1963.
    He was interviewed by SA C. Ray Hall.
    """
    
    print("=" * 60)
    print("Entity Matcher - Test Suite")
    print("=" * 60)
    
    matcher = EntityMatcher()
    count = matcher.load_sample_data()
    print(f"\nLoaded {count} entities from sample data")
    
    print("\n" + "-" * 60)
    print("Scanning test document...")
    print("-" * 60)
    
    matches = matcher.find_matches(TEST_TEXT)
    print(f"\nFound {len(matches)} entity matches:")
    for m in matches:
        print(f"  [{m.entity_type:6}] {m.display_name} (confidence: {m.confidence:.0%}, method: {m.method})")
    
    candidates = matcher.find_new_candidates(TEST_TEXT)
    print(f"\nFound {len(candidates)} new candidates:")
    for c in candidates:
        print(f"  [candidate] {c.text} (needs review)")
    
    print("\n" + "-" * 60)
    print("Full sidecar output:")
    print("-" * 60)
    sidecar = matcher.generate_sidecar(TEST_TEXT, "yates-fbi-302.txt")
    print(json.dumps(sidecar, indent=2, default=str))
