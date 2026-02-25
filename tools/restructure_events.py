
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
EVENTS_JSON = PROJECT_ROOT / "docs" / "ui" / "assets" / "data" / "events.json"

def restructure_events():
    if not EVENTS_JSON.exists():
        return

    with open(EVENTS_JSON, 'r', encoding='utf-8') as f:
        events = json.load(f)

    # 1. Identify Parents
    # yates-hitchhiker (event_id: 1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d)
    # walker-incident (event_id: 2c3d4e5f-6a7b-48c9-d0e1-f2a3b4c5d6e7)
    
    yates_parent_id = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"
    
    # 2. Find events that should be nested under Yates
    child_ids_to_nest = [
        "a0b1c2d3-e4f5-4678-a9b0-c1d2e3f4a5b6", # Thomas Ayres Interview
        "b1c2d3e4-f5a6-4789-b0c1-d2e3f4a5b6c7", # Donald Mask Interview
        "c2d3e4f5-a6b7-4890-c1d2-e3f4a5b6c7d8", # Park-It Market Service Call
        "e8f9a0b1-c2d3-4456-e7f8-a9b0-c1d2e3f4a5b6", # Dempsey Jones Interview (Wait, ID check)
        "f9a0b1c2-d3e4-4567-f8a9-b0c1d2e3f4a5"  # J.R. Gilpin Interview
    ]
    # Correcting Dempsey Jones ID based on file view: e8f9a0b1-c2d3-4456-e7f8-a9b0-c1d2e3f4a5b6 vs view saw e8f9a0b1-c2d3-4456-e7f8-a9b0-c1d2e3f4a5b6
    # Actually I should trust the object 'id' slug matching too.
    child_slugs_to_nest = ["ayres-fbi-interview", "mask-fbi-interview", "park-it-market-service-call", "jones-fbi-interview", "gilpin-fbi-interview"]

    parent_map = {e["event_id"]: e for e in events}
    yates_parent = parent_map.get(yates_parent_id)

    if not yates_parent:
        print("Yates parent not found")
        return

    final_parents = []
    
    for e in events:
        # If it has a parent_event_id, it shouldn't be here (top level)
        if "parent_event_id" in e:
            continue
            
        # If it's one of our specific child slugs, nest it and skip top-level
        if e.get("id") in child_slugs_to_nest:
            # Set parent link
            e["parent_event_id"] = yates_parent_id
            # Add to parent's sub_events if not already there (check by title or ID)
            existing_sub_ids = {se["event_id"] for se in yates_parent.get("sub_events", [])}
            if e["event_id"] not in existing_sub_ids:
                if "sub_events" not in yates_parent: yates_parent["sub_events"] = []
                yates_parent["sub_events"].append(e)
            continue
            
        final_parents.append(e)

    # Secondary check: ensure sub_events themselves are clean
    for p in final_parents:
        if "sub_events" in p:
            # Sort sub_events by date
            p["sub_events"].sort(key=lambda x: x.get("start_ts", ""))

    with open(EVENTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_parents, f, indent=2)
    print(f"Restructured events.json. Now has {len(final_parents)} parent events.")

if __name__ == "__main__":
    restructure_events()
