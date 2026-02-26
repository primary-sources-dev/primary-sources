#!/usr/bin/env python3
"""
cleanup-footers.py — Remove orphaned footer duplicates from all HTML files

Removes footer fragments that appear outside the data-component="footer" wrapper.
These were left by previous buggy builds.
"""

import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
EXCLUDE_DIRS = {"components", "assets", "node_modules", ".git"}

def clean_orphaned_footers(html_file: Path) -> bool:
    """Remove orphaned footer content between first </div> after footer and bottom nav."""
    content = html_file.read_text(encoding="utf-8")

    # Pattern: Footer wrapper closing tag, followed by orphaned content, until bottom nav
    # We want to keep: </div>\n\n    <!-- MODULAR BOTTOM NAV -->
    # We want to remove everything between them
    pattern = re.compile(
        r'(<!-- /BUILD:INJECTED -->\n</div>)'  # End of proper footer
        r'(.*?)'                                 # Orphaned content (to remove)
        r'(\n\s*<!-- MODULAR BOTTOM NAV -->)',  # Start of bottom nav
        re.DOTALL
    )

    def replacer(match):
        proper_footer_end = match.group(1)
        bottom_nav_start = match.group(3)
        # Keep proper footer end and bottom nav start, add clean spacing
        return proper_footer_end + '\n' + bottom_nav_start

    new_content = pattern.sub(replacer, content)

    if new_content != content:
        html_file.write_text(new_content, encoding="utf-8")
        return True
    return False

def find_html_files() -> list[Path]:
    """Find all HTML files to process."""
    html_files = []
    for path in SCRIPT_DIR.rglob("*.html"):
        if any(excluded in path.parts for excluded in EXCLUDE_DIRS):
            continue
        html_files.append(path)
    return sorted(html_files)

def main():
    print("\nCleaning orphaned footer duplicates...")

    html_files = find_html_files()
    files_cleaned = 0

    for html_file in html_files:
        rel_path = html_file.relative_to(SCRIPT_DIR)
        if clean_orphaned_footers(html_file):
            files_cleaned += 1
            print(f"  [OK] {rel_path}")

    print(f"\nCleaned {files_cleaned}/{len(html_files)} files")
    print()

if __name__ == "__main__":
    main()
