
import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "docs" / "ui" / "assets" / "data"

def deduplicate_file(filename, id_key):
    path = DATA_DIR / filename
    if not path.exists():
        print(f"File {filename} not found.")
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        try:
            items = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {filename}")
            return

    unique_items = {}
    duplicates_removed = 0
    
    for item in items:
        # Get the ID
        item_id = item.get(id_key) or item.get("id")
        
        # Specialized check for placeholder
        if filename == "people.json" and item.get("display_name") == "Smith, John":
            duplicates_removed += 1
            continue

        if not item_id or item_id.startswith("xxxxxxxx"):
            duplicates_removed += 1
            continue

        if item_id in unique_items:
            # Merge if necessary, or just keep the one with more data
            existing = unique_items[item_id]
            # Heuristic: keep the one with more keys or longer notes
            if len(item.keys()) > len(existing.keys()):
                unique_items[item_id] = item
            elif len(str(item.get("notes", ""))) > len(str(existing.get("notes", ""))):
                unique_items[item_id] = item
            duplicates_removed += 1
        else:
            unique_items[item_id] = item
            
    # Convert back to list
    deduplicated = list(unique_items.values())
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(deduplicated, f, indent=2)
    
    print(f"{filename}: Removed {duplicates_removed} duplicates/placeholders.")

if __name__ == "__main__":
    deduplicate_file("people.json", "person_id")
    deduplicate_file("organizations.json", "org_id")
    deduplicate_file("places.json", "place_id")
    deduplicate_file("objects.json", "object_id")
    deduplicate_file("events.json", "event_id")
    deduplicate_file("sources.json", "source_id")
