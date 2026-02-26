#!/usr/bin/env python3
"""
build.py — Component Injector for Primary Sources

Bakes component HTML into pages at build time to eliminate runtime flash.

Usage:
    python build.py          # Build all pages
    python build.py --clean  # Remove injected content (restore placeholders)

Components are read from components/*.html and injected into elements
with data-component="name" attributes.
"""

import os
import re
import sys
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
COMPONENTS_DIR = SCRIPT_DIR / "components"
EXCLUDE_DIRS = {"components", "assets", "node_modules", ".git"}
EXCLUDE_FILES = {"build.py"}

# Marker comments to identify injected content
INJECT_START = "<!-- BUILD:INJECTED -->"
INJECT_END = "<!-- /BUILD:INJECTED -->"


def get_component_content(name: str) -> str | None:
    """Read component HTML file."""
    component_path = COMPONENTS_DIR / f"{name}.html"
    if not component_path.exists():
        print(f"  Warning: Component '{name}' not found at {component_path}")
        return None
    return component_path.read_text(encoding="utf-8")


def calculate_base_path(html_file: Path) -> str:
    """Calculate relative path from HTML file to root."""
    rel_path = html_file.relative_to(SCRIPT_DIR)
    depth = len(rel_path.parts) - 1  # -1 for the file itself
    if depth == 0:
        return ""
    return "../" * depth


def adjust_paths(html: str, base_path: str) -> str:
    """Adjust root-relative paths to work from file's location."""
    if not base_path:
        # Root level - just remove leading slash
        return re.sub(r'href="/', 'href="', html)
    # Deeper level - replace leading slash with relative path
    return re.sub(r'href="/', f'href="{base_path}', html)


def inject_components(html_file: Path, clean: bool = False) -> tuple[int, int]:
    """
    Inject or clean components in an HTML file.
    Returns (components_found, components_injected).
    """
    content = html_file.read_text(encoding="utf-8")
    base_path = calculate_base_path(html_file)
    
    found = 0
    injected = 0
    
    # Pattern to find data-component elements
    # Matches: <tag data-component="name" ...> ... </tag>
    pattern = re.compile(
        r'(<(\w+)\s+[^>]*data-component="([^"]+)"[^>]*>)'  # Opening tag with attribute
        r'(.*?)'  # Content (non-greedy)
        r'(</\2>)',  # Closing tag
        re.DOTALL
    )
    
    def add_loaded_class(tag: str) -> str:
        """Add component-loaded class to opening tag."""
        if 'class="' in tag:
            # Append to existing class attribute
            return re.sub(r'class="([^"]*)"', r'class="\1 component-loaded"', tag)
        else:
            # Add class attribute before closing >
            return tag[:-1] + ' class="component-loaded">'
    
    def remove_loaded_class(tag: str) -> str:
        """Remove component-loaded class from opening tag."""
        # Remove the class we added (with leading space)
        tag = re.sub(r' component-loaded', '', tag)
        # Clean up empty class attributes
        tag = re.sub(r' class=""', '', tag)
        return tag
    
    def replacer(match):
        nonlocal found, injected
        found += 1
        
        opening_tag = match.group(1)
        tag_name = match.group(2)
        component_name = match.group(3)
        existing_content = match.group(4)
        closing_tag = match.group(5)
        
        if clean:
            # Remove injected content and component-loaded class
            if INJECT_START in existing_content:
                injected += 1
                cleaned_tag = remove_loaded_class(opening_tag)
                return f"{cleaned_tag}{closing_tag}"
            return match.group(0)
        
        # Skip if already has injected content
        if INJECT_START in existing_content:
            return match.group(0)
        
        # Get component content
        component_html = get_component_content(component_name)
        if not component_html:
            return match.group(0)
        
        # Adjust paths for file depth
        adjusted_html = adjust_paths(component_html, base_path)
        
        # Add component-loaded class to prevent flash
        modified_tag = add_loaded_class(opening_tag)
        
        injected += 1
        return f"{modified_tag}\n{INJECT_START}\n{adjusted_html}\n{INJECT_END}\n{closing_tag}"
    
    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        html_file.write_text(new_content, encoding="utf-8")
    
    return found, injected


def find_html_files() -> list[Path]:
    """Find all HTML files to process."""
    html_files = []
    for path in SCRIPT_DIR.rglob("*.html"):
        # Skip excluded directories
        if any(excluded in path.parts for excluded in EXCLUDE_DIRS):
            continue
        # Skip excluded files
        if path.name in EXCLUDE_FILES:
            continue
        html_files.append(path)
    return sorted(html_files)


def main():
    clean = "--clean" in sys.argv
    action = "Cleaning" if clean else "Building"
    
    print(f"\n{action} Primary Sources components...")
    print(f"Components directory: {COMPONENTS_DIR}")
    print()
    
    html_files = find_html_files()
    total_found = 0
    total_injected = 0
    files_modified = 0
    
    for html_file in html_files:
        rel_path = html_file.relative_to(SCRIPT_DIR)
        found, injected = inject_components(html_file, clean=clean)
        
        if found > 0:
            total_found += found
            total_injected += injected
            if injected > 0:
                files_modified += 1
                print(f"  {rel_path}: {injected}/{found} components {'cleaned' if clean else 'injected'}")
    
    print()
    print(f"{'Cleaned' if clean else 'Built'} {files_modified} files")
    print(f"Total: {total_injected}/{total_found} components {'removed' if clean else 'injected'}")
    print()


if __name__ == "__main__":
    main()
