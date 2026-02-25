
import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "docs" / "ui" / "assets" / "data"

def clean_data_file(filename, id_key):
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
    removed_count = 0
    
    for item in items:
        # 1. Skip absolute placeholders/test records
        item_id = item.get(id_key) or item.get("id")
        display_name = item.get("display_name", "") or item.get("name", "") or item.get("title", "")
        
        if not item_id or item_id.startswith("xxxxxxxx"):
            removed_count += 1
            continue
            
        if "John Smith" in display_name or "Smith, John" in display_name:
            if item_id.startswith("autogen") or "xxxx" in item_id:
                removed_count += 1
                continue

        # 2. Filter child events from top-level list (per user request)
        if filename == "events.json" and "parent_event_id" in item:
            # Check if it's already in the parent's sub_events (manual check/trust)
            # For now, simply remove from top level.
            removed_count += 1
            continue

        # 3. Deduplicate by UUID
        if item_id in unique_items:
            existing = unique_items[item_id]
            # Keep the richer record
            if len(item.keys()) > len(existing.keys()):
                unique_items[item_id] = item
            removed_count += 1
        else:
            unique_items[item_id] = item
            
    # Final list
    cleaned = list(unique_items.values())
    
    # Sort by ID for stability
    cleaned.sort(key=lambda x: str(x.get(id_key, "")))
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, indent=2)
    
    print(f"{filename}: Cleaned {removed_count} records (duplicates/children/placeholders). Total now: {len(cleaned)}")

if __name__ == "__main__":
    clean_data_file("people.json", "person_id")
    clean_data_file("organizations.json", "org_id")
    clean_data_file("places.json", "place_id")
    clean_data_file("objects.json", "object_id")
    clean_data_file("events.json", "event_id")
    clean_data_file("sources.json", "source_id")
