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
    """Remove orphaned footer content - everything after first footer until bottom nav."""
    content = html_file.read_text(encoding="utf-8")

    # Find the first proper footer closing
    footer_marker = '<!-- MODULAR FOOTER -->'
    bottom_nav_marker = '<!-- MODULAR BOTTOM NAV -->'

    footer_start = content.find(footer_marker)
    bottom_nav_start = content.find(bottom_nav_marker, footer_start if footer_start >= 0 else 0)

    if footer_start == -1 or bottom_nav_start == -1:
        return False

    # Find the first /BUILD:INJECTED after footer marker
    build_end_marker = '<!-- /BUILD:INJECTED -->'
    first_build_end = content.find(build_end_marker, footer_start)

    if first_build_end == -1:
        return False

    # Find the </div> right after /BUILD:INJECTED
    div_close = content.find('</div>', first_build_end)
    if div_close == -1:
        return False

    div_close_end = div_close + len('</div>')

    # Check if there's orphaned content between div close and bottom nav
    between = content[div_close_end:bottom_nav_start].strip()

    if between and '</footer>' in between:  # Has orphaned footer content
        # Replace everything between with just clean spacing
        new_content = content[:div_close_end] + '\n\n    ' + content[bottom_nav_start:]
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
