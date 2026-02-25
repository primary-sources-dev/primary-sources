
import json
import re
from pathlib import Path
from typing import List, Dict, Any
try:
    from rapidfuzz import process, fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

class EntityLinker:
    """
    Narrative Entity Linking Engine.
    Cross-references archival text with existing People and Places databases.
    """
    
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.people = self._load_json(data_dir / "people.json")
        self.places = self._load_json(data_dir / "places.json")
        
        # Compile patterns for high-speed matching
        self.people_patterns = self._build_people_patterns()
        self.places_patterns = self._build_places_patterns()
        
        # Build master name lists for fuzzy matching
        self.master_people = self._build_master_names(self.people, ["display_name", "given_name", "family_name"])
        self.master_places = self._build_master_names(self.places, ["name"])

    def _load_json(self, path: Path) -> List[Dict[str, Any]]:
        """Load archival JSON data."""
        if not path.exists():
            return []
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def _build_people_patterns(self):
        """Build regex patterns for known people, including initials and aliases."""
        patterns = []
        for p in self.people:
            names = []
            display = p.get("display_name", "")
            given = p.get("given_name", "")
            family = p.get("family_name", "")

            if display: names.append(display)
            if given and family:
                names.append(f"{given} {family}")
                # Initial variant: Lee Oswald -> L. Oswald
                if len(given) > 1:
                    names.append(f"{given[0]}. {family}")
            
            # Handle "Last, First" format and its variants
            if display and "," in display:
                parts = [n.strip() for n in display.split(',', 1)]
                last = parts[0]
                first = parts[1]
                names.append(f"{first} {last}")
                if len(first) > 1:
                    names.append(f"{first[0]}. {last}")
                names.append(last) 
            elif family:
                names.append(family)
            
            # Clean, filter, and unique-ify
            names = list(set([n for n in names if n and len(n) > 2]))
            
            if names:
                for name in names:
                    entity_id = p.get("id") or p.get("person_id") or "unknown"
                    patterns.append({
                        "pattern": re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE),
                        "id": entity_id,
                        "display": display or entity_id,
                        "match_len": len(name)
                    })
        return patterns

    def _build_places_patterns(self):
        """Build regex patterns for known places."""
        patterns = []
        for p in self.places:
            names = [p["name"]]
            if p.get("id"): names.append(p["id"].replace('-', ' '))
            
            names = list(set([n for n in names if n and len(n) > 3]))
            if names:
                for name in names:
                    entity_id = p.get("id") or p.get("place_id") or "unknown"
                    patterns.append({
                        "pattern": re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE),
                        "id": entity_id,
                        "display": p.get("name", entity_id),
                        "match_len": len(name)
                    })
        return patterns

    def _build_master_names(self, data_list, fields):
        """Build a flat list of names for fuzzy matching."""
        master = []
        for item in data_list:
            names = set()
            for field in fields:
                val = item.get(field)
                if val:
                    names.add(val)
                    # Add Last, First variants
                    if "," in val:
                        parts = [p.strip() for p in val.split(',')]
                        if len(parts) >= 2:
                            names.add(f"{parts[1]} {parts[0]}")
            
            for name in names:
                if len(name) > 3:
                    entity_id = item.get("id") or item.get("person_id") or item.get("place_id") or "unknown"
                    master.append({
                        "name": name,
                        "id": entity_id,
                        "display": item.get("display_name") or item.get("name") or entity_id
                    })
        return master

    def link_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Identify entities in text and link to database records.
        """
        if not text:
            return []
            
        # Combine all patterns and sort by the length of the matched text (proxy by display name length)
        combined = []
        for p in self.people_patterns:
            combined.append({**p, "type": "PERSON"})
        for p in self.places_patterns:
            combined.append({**p, "type": "PLACE"})
            
        # Sort by specificity of the matched text (match_len)
        combined.sort(key=lambda x: x["match_len"], reverse=True)
            
        links = []
        potential_matches = []
        
        # --- Stage 1: Collect Exact Regex Matches ---
        for entity in combined:
            for match in entity["pattern"].finditer(text):
                potential_matches.append({
                    "id": entity["id"],
                    "type": entity["type"],
                    "label": entity["display"],
                    "matched_text": match.group(0),
                    "start": match.start(),
                    "end": match.end(),
                    "method": "exact",
                    "score": 100
                })

        # --- Stage 2: Collect Fuzzy Matches from Proper Noun Sequences ---
        if HAS_RAPIDFUZZ:
            proper_noun_pattern = re.compile(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b')
            for match in proper_noun_pattern.finditer(text):
                candidate = match.group(0)
                if len(candidate) < 4: continue
                
                # Check people
                best_p = self._fuzzy_search(candidate, self.master_people)
                if best_p and best_p["score"] >= 88: # Slightly higher threshold for blocks
                    potential_matches.append({
                        "id": best_p["id"],
                        "type": "PERSON",
                        "label": best_p["display"],
                        "matched_text": candidate,
                        "start": match.start(),
                        "end": match.end(),
                        "method": "fuzzy",
                        "score": best_p["score"]
                    })
                
                # Check places
                best_pl = self._fuzzy_search(candidate, self.master_places)
                if best_pl and best_pl["score"] >= 88:
                    potential_matches.append({
                        "id": best_pl["id"],
                        "type": "PLACE",
                        "label": best_pl["display"],
                        "matched_text": candidate,
                        "start": match.start(),
                        "end": match.end(),
                        "method": "fuzzy",
                        "score": best_pl["score"]
                    })

        # --- Stage 3: Resolve Overlaps and De-duplicate ---
        # Sort by match length (longest first), then score
        potential_matches.sort(key=lambda x: (x["end"] - x["start"], x["score"]), reverse=True)
        
        seen_ids = set()
        consumed_ranges = []
        
        for m in potential_matches:
            # Check for range overlap
            overlap = False
            for c_start, c_end in consumed_ranges:
                if (m["start"] >= c_start and m["start"] < c_end) or \
                   (m["end"] > c_start and m["end"] <= c_end) or \
                   (m["start"] <= c_start and m["end"] >= c_end):
                    overlap = True
                    break
            
            if not overlap and m["id"] not in seen_ids:
                links.append({
                    "id": m["id"],
                    "type": m["type"],
                    "label": m["label"],
                    "matched_text": m["matched_text"],
                    "method": m["method"],
                    "score": round(m["score"], 1) if m["method"] == "fuzzy" else 100
                })
                seen_ids.add(m["id"])
                consumed_ranges.append((m["start"], m["end"]))
                
        return links

    def _fuzzy_search(self, candidate, master_list):
        """Search a master list for the best fuzzy match."""
        if not master_list: return None
        
        # Only take items that are reasonably similar in length
        name_strings = [item["name"] for item in master_list]
        
        result = process.extractOne(candidate, name_strings, scorer=fuzz.token_set_ratio)
        
        if result:
            match_str, score, idx = result
            return {**master_list[idx], "score": score}
        return None

# Test logic
if __name__ == "__main__":
    import sys
    # Assume we are running from project root or tools dir
    project_root = Path(__file__).parent.parent.parent
    data_dir = project_root / "docs" / "ui" / "assets" / "data"
    
    linker = EntityLinker(data_dir)
    print(f"Loaded {len(linker.people)} people and {len(linker.places)} places.")
    
    test_text = "Ralph Yates stated he saw Lee Oswald near Dealey Plaza in Dallas."
    results = linker.link_entities(test_text)
    
    print("\nLinking Results:")
    for res in results:
        print(f"  [{res['type']}] {res['label']} (ID: {res['id']}) - matched '{res['matched_text']}'")
