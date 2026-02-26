
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "web" / "html" / "assets" / "data"
YATES_JSON = PROJECT_ROOT / "raw-material" / "yates" / "yates_entities.json"

TAG = "The Ralph Leon Yates incident"

def tag_yates_entities():
    if not YATES_JSON.exists():
        return

    with open(YATES_JSON, 'r', encoding='utf-8') as f:
        yates_data = json.load(f)

    # Collect all IDs from yates_entities
    yates_ids = set()
    for cat in ["people", "places", "organizations", "objects", "events"]:
        if cat in yates_data:
            for item in yates_data[cat]:
                if "person_id" in item: yates_ids.add(item["person_id"])
                if "place_id" in item: yates_ids.add(item["place_id"])
                if "org_id" in item: yates_ids.add(item["org_id"])
                if "object_id" in item: yates_ids.add(item["object_id"])
                if "event_id" in item: yates_ids.add(item["event_id"])
                if "id" in item: yates_ids.add(item["id"])

    # Mapping files
    mapping = {
        "people.json": "person_id",
        "places.json": "place_id",
        "organizations.json": "org_id",
        "objects.json": "object_id",
        "events.json": "event_id"
    }

    for filename, id_key in mapping.items():
        path = DATA_DIR / filename
        if not path.exists(): continue
        
        with open(path, 'r', encoding='utf-8') as f:
            items = json.load(f)
            
        modified = False
        for item in items:
            item_id = item.get(id_key) or item.get("id")
            if item_id in yates_ids:
                if "tags" not in item:
                    item["tags"] = []
                if TAG not in item["tags"]:
                    item["tags"].append(TAG)
                    modified = True
                    
        if modified:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2)
            print(f"Tagged items in {filename}")

if __name__ == "__main__":
    tag_yates_entities()
