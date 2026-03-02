import sys
import os
import json

# Add tools to path
sys.path.append(r'c:\Users\willh\Desktop\primary-sources\tools')

from entity_matcher import EntityMatcher

def test_matcher():
    matcher = EntityMatcher()
    data_dir = r'c:\Users\willh\Desktop\primary-sources\web\html\assets\data'
    loaded = matcher.load_from_entity_files(data_dir)
    print(f"Loaded {loaded} entities")
    
    # Sample text from ralphleonyatesdocumentsfull.txt
    sample_text = """
    RALPH LEON YATES, 13564 Brookgreen, Dallas, Texas,
    voluntarily appeared at the Dallas FBI Office, accompanied by his
    uncle, Mr. J. 0. SMITH, 13770 Sprucewood, Dallas, Texas
    
    YATES said after seeing photographs and television
    pictures of LEE HARVEY OSWALD, he is of the opinion that this man
    was identical with OSWALD.
    """
    
    matches = matcher.find_matches(sample_text)
    print(f"Found {len(matches)} matches:")
    for m in matches:
        print(f"  [{m.entity_type}] {m.display_name} (found: {m.text})")
        
    candidates = matcher.find_new_candidates(sample_text)
    print(f"Found {len(candidates)} candidates:")
    for c in candidates:
        print(f"  [candidate] {c.text}")

if __name__ == "__main__":
    test_matcher()
