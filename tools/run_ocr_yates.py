
import os
import json
import sys
import re
from pathlib import Path
from datetime import datetime

# Add ocr-gui to path
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(TOOLS_DIR, "ocr-gui"))

try:
    from zone_extractor import extract_document
    from document_classifier import classify_document
except ImportError:
    print("Error: Could not import OCR modules.")
    sys.exit(1)

PROJECT_ROOT = os.path.dirname(TOOLS_DIR)
PDF_PATH = os.path.join(PROJECT_ROOT, "raw-material", "yates", "yates_searchable.pdf")
JSON_PATH = os.path.join(PROJECT_ROOT, "raw-material", "yates", "yates_entities.json")
DATA_DIR = os.path.join(PROJECT_ROOT, "docs", "ui", "assets", "data")

def load_canonical_data():
    """Load canonical data to use as a standard."""
    canonical = {
        "people": [],
        "places": [],
        "organizations": []
    }
    for key in canonical.keys():
        path = os.path.join(DATA_DIR, f"{key}.json")
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                canonical[key] = json.load(f)
    return canonical

def extract_entities_from_text(text, known_entities):
    """Simple entity extraction using regex and known entity lists."""
    results = {
        "people": set(),
        "places": set(),
        "organizations": set()
    }
    
    # Check for known entities (exact match)
    for p in known_entities["people"]:
        name = p.get("display_name")
        if name and name.lower() in text.lower():
            results["people"].add(name)
        # Check initials variant
        given = p.get("given_name", "")
        family = p.get("family_name", "")
        if given and family:
            short = f"{given[0]}. {family}"
            if short.lower() in text.lower():
                results["people"].add(name)

    for p in known_entities["places"]:
        name = p.get("name")
        if name and name.lower() in text.lower():
            results["places"].add(name)

    for o in known_entities["organizations"]:
        name = o.get("name")
        if name and name.lower() in text.lower():
            results["organizations"].add(name)

    # Find new person candidates using regex
    # Pattern for "Name, First M." or "First M. Last"
    name_patterns = [
        r"\b([A-Z][a-z]+, [A-Z][a-z]+(?: [A-Z]\.?)?)\b",  # Last, First M.
        r"\b([A-Z][a-z]+ [A-Z]\.? [A-Z][a-z]+)\b",        # First M. Last
        r"\b([A-Z][a-z]+ [A-Z][a-z]+)\b"                  # First Last
    ]
    for pattern in name_patterns:
        for match in re.finditer(pattern, text):
            name = match.group(1)
            # Basic validation: filter out common words or too short
            if len(name) > 5 and not any(word in name.lower() for word in ["the", "and", "from", "stated", "advised"]):
                results["people"].add(name)

    return results

def process_pdf(known_entities):
    import fitz
    doc = fitz.open(PDF_PATH)
    
    found_total = {
        "people": set(),
        "places": set(),
        "organizations": set()
    }
    
    print(f"Processing {len(doc)} pages of {PDF_PATH}...")
    
    for i, page in enumerate(doc):
        text = page.get_text()
        if not text.strip():
            continue
            
        # 1. Zone extraction
        extraction = extract_document(text)
        if extraction.fields:
            for field in extraction.fields.values():
                val = field.value
                if field.field_name in ["agent_name", "subject_name", "witness_name", "transcribing_agent"]:
                    found_total["people"].add(val)
                elif field.field_name in ["agency", "originator"]:
                    found_total["organizations"].add(val)
                elif field.field_name in ["location", "interview_location"]:
                    found_total["places"].add(val)

        # 2. General entity scan
        page_entities = extract_entities_from_text(text, known_entities)
        for key in found_total:
            found_total[key].update(page_entities[key])
            
    doc.close()
    return found_total

def update_json(found):
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found.")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Standardize metadata
    data["metadata"]["last_run"] = datetime.now().isoformat()
    data["metadata"]["extraction_method"] = "automated OCR forensic extraction (zone-aware)"

    # Helper to check if name exists in list
    def exists(name, entity_list, name_field="display_name"):
        return any(e.get(name_field, "").lower() == name.lower() for e in entity_list)

    stats = {"people": 0, "places": 0, "orgs": 0}

    # Add People
    for name in found["people"]:
        if not exists(name, data["people"]):
            # Standardize: if "LAST, FIRST", split it
            given = ""
            family = ""
            if "," in name:
                parts = name.split(",", 1)
                family = parts[0].strip()
                given = parts[1].strip()
            elif " " in name:
                parts = name.rsplit(" ", 1)
                given = parts[0].strip()
                family = parts[1].strip()
            
            new_item = {
                "id": name.lower().replace(" ", "-").replace(",", "").replace(".", ""),
                "person_id": f"autogen-{name.lower().replace(' ', '-')}",
                "icon": "person",
                "label": "Extracted Witness",
                "display_name": name,
                "person_type": "PERSON",
                "given_name": given or name,
                "family_name": family or None,
                "notes": "Identified in Yates FBI files via OCR extraction.",
                "status": "TODO"
            }
            data["people"].append(new_item)
            stats["people"] += 1

    # Add Places
    for name in found["places"]:
        if not exists(name, data["places"], "name"):
            new_item = {
                "id": name.lower().replace(" ", "-").replace(",", "").replace(".", ""),
                "place_id": f"autogen-{name.lower().replace(' ', '-')}",
                "icon": "place",
                "label": "Extracted Location",
                "name": name,
                "place_type": "SITE",
                "notes": "Identified in Yates FBI files via OCR extraction.",
                "status": "TODO"
            }
            data["places"].append(new_item)
            stats["places"] += 1

    # Add Organizations
    for name in found["organizations"]:
        if not exists(name, data["organizations"], "name"):
            new_item = {
                "id": name.lower().replace(" ", "-").replace(",", "").replace(".", ""),
                "org_id": f"autogen-{name.lower().replace(' ', '-')}",
                "org_type": "ORGANIZATION",
                "icon": "corporate_fare",
                "label": "Extracted Organization",
                "name": name,
                "notes": "Identified in Yates FBI files via OCR extraction.",
                "status": "TODO"
            }
            data["organizations"].append(new_item)
            stats["orgs"] += 1

    # Update summary counts
    data["summary"]["total_people_new"] = data["summary"].get("total_people_new", 0) + stats["people"]
    data["summary"]["total_places_new"] = data["summary"].get("total_places_new", 0) + stats["places"]
    data["summary"]["total_organizations_new"] = data["summary"].get("total_organizations_new", 0) + stats["orgs"]

    print(f"Extraction Summary:")
    print(f"  People: {stats['people']} new added")
    print(f"  Places: {stats['places']} new added")
    print(f"  Orgs:   {stats['orgs']} new added")

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Updated {JSON_PATH}")

if __name__ == "__main__":
    canonical = load_canonical_data()
    found = process_pdf(canonical)
    update_json(found)
