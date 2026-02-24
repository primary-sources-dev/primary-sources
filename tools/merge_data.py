import json
import os

def merge_json(base_path, overlay_path, output_path, id_field, overlay_key=None):
    if not os.path.exists(base_path):
        print(f"Base path {base_path} not found.")
        return
    if not os.path.exists(overlay_path):
        print(f"Overlay path {overlay_path} not found.")
        return

    with open(base_path, 'r') as f:
        base_data = json.load(f)
    with open(overlay_path, 'r') as f:
        overlay_data = json.load(f)
    
    if overlay_key:
        overlay_data = overlay_data.get(overlay_key, [])

    # Create map for overlay
    overlay_map = {}
    for item in overlay_data:
        # Match by either id_field or id/slug
        key = item.get(id_field) or item.get('id')
        if key:
            overlay_map[key] = item

    # Merge
    merged_data = []
    overlaid_keys = set()
    
    for item in base_data:
        key = item.get(id_field) or item.get('id')
        if key and key in overlay_map:
            # Merge fields: prefer overlay but keep base if missing
            new_item = item.copy()
            new_item.update(overlay_map[key])
            merged_data.append(new_item)
            overlaid_keys.add(key)
        else:
            merged_data.append(item)
    
    # Add any remaining items from overlay that weren't in base
    for key, item in overlay_map.items():
        if key not in overlaid_keys:
            merged_data.append(item)
            
    with open(output_path, 'w') as f:
        json.dump(merged_data, f, indent=2)

# 1. Start with the Original Directory (if available in archived) or high-density baseline
# Note: I'm merging in multiple passes to capture everything.

# PASS 1: Base Directories + High Density Mock
merge_json('docs/ui/assets/data/archived/orgs.json', 'docs/ui/assets/data/archived/mock-organizations.json', 'docs/ui/assets/data/organizations.json', 'org_id')
merge_json('docs/ui/assets/data/archived/people.json', 'docs/ui/assets/data/archived/mock-person.json', 'docs/ui/assets/data/people.json', 'person_id')
merge_json('docs/ui/assets/data/archived/places.json', 'docs/ui/assets/data/archived/mock-places.json', 'docs/ui/assets/data/places.json', 'place_id')
merge_json('docs/ui/assets/data/archived/events.json', 'docs/ui/assets/data/archived/mock-event.json', 'docs/ui/assets/data/events.json', 'event_id')
merge_json('docs/ui/assets/data/archived/objects.json', 'docs/ui/assets/data/archived/mock-objects.json', 'docs/ui/assets/data/objects.json', 'object_id')
merge_json('docs/ui/assets/data/archived/sources.json', 'docs/ui/assets/data/archived/mock-sources.json', 'docs/ui/assets/data/sources.json', 'source_id')

# PASS 2: Add Yates Incident Entities (Large Catalog)
merge_json('docs/ui/assets/data/people.json', 'raw-material/yates/yates_entities.json', 'docs/ui/assets/data/people.json', 'person_id', overlay_key='people')
merge_json('docs/ui/assets/data/organizations.json', 'raw-material/yates/yates_entities.json', 'docs/ui/assets/data/organizations.json', 'org_id', overlay_key='organizations')
merge_json('docs/ui/assets/data/places.json', 'raw-material/yates/yates_entities.json', 'docs/ui/assets/data/places.json', 'place_id', overlay_key='places')
merge_json('docs/ui/assets/data/events.json', 'raw-material/yates/yates_entities.json', 'docs/ui/assets/data/events.json', 'event_id', overlay_key='events')
merge_json('docs/ui/assets/data/objects.json', 'raw-material/yates/yates_entities.json', 'docs/ui/assets/data/objects.json', 'object_id', overlay_key='objects')
