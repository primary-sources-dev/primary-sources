#!/usr/bin/env python3
"""
validate-build.py — Template Structure Validator

Checks for common template issues after build:
- Orphaned structural elements outside component wrappers
- Duplicate component injections
- Malformed BUILD:INJECTED markers
- Excessive file size (indicates duplication)

Usage:
    python validate-build.py              # Validate all HTML files
    python validate-build.py --strict     # Exit with error code if issues found
    python validate-build.py --file path  # Validate specific file

Run after build.py to catch template corruption early.
"""

import os
import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple

# Configuration
SCRIPT_DIR = Path(__file__).parent
EXCLUDE_DIRS = {"components", "assets", "node_modules", ".git", "processed"}
EXCLUDE_FILES = {"build.py", "validate.py"}

# Thresholds
MAX_FILE_SIZE_KB = 150  # Warn if HTML file exceeds this
MAX_INJECTED_BLOCKS = 5  # Warn if more than this many BUILD:INJECTED blocks


@dataclass
class ValidationIssue:
    """Represents a validation issue found in a file."""
    file: Path
    severity: str  # "ERROR", "WARNING", "INFO"
    issue_type: str
    message: str
    line_num: int = None


class TemplateValidator:
    """Validates HTML template structure after build."""

    def __init__(self, strict: bool = False):
        self.strict = strict
        self.issues: List[ValidationIssue] = []
        self.files_checked = 0
        self.files_with_issues = 0

    def validate_file(self, html_file: Path) -> List[ValidationIssue]:
        """Run all validation checks on a file."""
        issues = []
        content = html_file.read_text(encoding="utf-8")

        # Check 1: Orphaned structural elements
        orphan_issues = self._check_orphaned_elements(html_file, content)
        issues.extend(orphan_issues)

        # Check 2: Duplicate component injections
        duplicate_issues = self._check_duplicate_injections(html_file, content)
        issues.extend(duplicate_issues)

        # Check 3: Malformed markers
        marker_issues = self._check_malformed_markers(html_file, content)
        issues.extend(marker_issues)

        # Check 4: File size (indicates duplication)
        size_issues = self._check_file_size(html_file)
        issues.extend(size_issues)

        # Check 5: Unclosed component wrappers
        wrapper_issues = self._check_unclosed_wrappers(html_file, content)
        issues.extend(wrapper_issues)

        return issues

    def _check_orphaned_elements(self, html_file: Path, content: str) -> List[ValidationIssue]:
        """Check for structural elements outside component wrappers."""
        issues = []

        # Remove all component wrapper sections
        cleaned = re.sub(
            r'<\w+[^>]*\bdata-component="[^"]+"[^>]*>.*?</\w+>',
            '',
            content,
            flags=re.DOTALL | re.IGNORECASE
        )

        # Search for structural elements (excluding nav - it's used globally)
        for match in re.finditer(r'<(header|footer)\b', cleaned, re.IGNORECASE):
            tag_name = match.group(1)
            # Find line number
            line_num = content[:match.start()].count('\n') + 1

            issues.append(ValidationIssue(
                file=html_file,
                severity="ERROR",
                issue_type="ORPHANED_ELEMENT",
                message=f"Orphaned <{tag_name}> element outside component wrapper",
                line_num=line_num
            ))

        return issues

    def _check_duplicate_injections(self, html_file: Path, content: str) -> List[ValidationIssue]:
        """Check for excessive BUILD:INJECTED blocks (indicates duplication)."""
        issues = []

        injected_blocks = content.count("<!-- BUILD:INJECTED -->")

        if injected_blocks > MAX_INJECTED_BLOCKS:
            issues.append(ValidationIssue(
                file=html_file,
                severity="ERROR",
                issue_type="EXCESSIVE_INJECTIONS",
                message=f"Found {injected_blocks} BUILD:INJECTED blocks (expected <= {MAX_INJECTED_BLOCKS})"
            ))

        return issues

    def _check_malformed_markers(self, html_file: Path, content: str) -> List[ValidationIssue]:
        """Check for mismatched BUILD:INJECTED markers."""
        issues = []

        start_count = content.count("<!-- BUILD:INJECTED -->")
        end_count = content.count("<!-- /BUILD:INJECTED -->")

        if start_count != end_count:
            issues.append(ValidationIssue(
                file=html_file,
                severity="ERROR",
                issue_type="MISMATCHED_MARKERS",
                message=f"Mismatched markers: {start_count} start, {end_count} end"
            ))

        # Check for orphaned end markers
        pattern = re.compile(
            r'<!-- /BUILD:INJECTED -->\s*</div>\s*<!-- /BUILD:INJECTED -->',
            re.IGNORECASE
        )
        for match in pattern.finditer(content):
            line_num = content[:match.start()].count('\n') + 1
            issues.append(ValidationIssue(
                file=html_file,
                severity="WARNING",
                issue_type="ORPHANED_MARKER",
                message="Duplicate /BUILD:INJECTED marker found",
                line_num=line_num
            ))

        return issues

    def _check_file_size(self, html_file: Path) -> List[ValidationIssue]:
        """Check if file is suspiciously large (indicates duplication)."""
        issues = []

        size_kb = html_file.stat().st_size / 1024

        if size_kb > MAX_FILE_SIZE_KB:
            issues.append(ValidationIssue(
                file=html_file,
                severity="WARNING",
                issue_type="LARGE_FILE",
                message=f"File size {size_kb:.1f}KB exceeds threshold ({MAX_FILE_SIZE_KB}KB)"
            ))

        return issues

    def _check_unclosed_wrappers(self, html_file: Path, content: str) -> List[ValidationIssue]:
        """Check for component wrappers without proper closing tags."""
        issues = []

        # Find all component wrapper opening tags
        pattern = re.compile(
            r'<(\w+)\b[^>]*\bdata-component="([^"]+)"[^>]*>',
            re.IGNORECASE
        )

        for match in pattern.finditer(content):
            tag_name = match.group(1)
            component_name = match.group(2)
            opening_pos = match.start()

            # Try to find matching closing tag
            close_pattern = re.compile(
                rf'</{re.escape(tag_name)}>',
                re.IGNORECASE
            )

            # Search after opening tag
            remaining_content = content[match.end():]
            close_match = close_pattern.search(remaining_content)

            if not close_match:
                line_num = content[:opening_pos].count('\n') + 1
                issues.append(ValidationIssue(
                    file=html_file,
                    severity="ERROR",
                    issue_type="UNCLOSED_WRAPPER",
                    message=f"Component wrapper <{tag_name} data-component=\"{component_name}\"> not closed",
                    line_num=line_num
                ))

        return issues

    def find_html_files(self, specific_file: Path = None) -> List[Path]:
        """Find all HTML files to validate."""
        if specific_file:
            return [specific_file] if specific_file.exists() else []

        html_files = []
        for path in SCRIPT_DIR.rglob("*.html"):
            # Skip excluded directories
            if any(excluded in path.parts for excluded in EXCLUDE_DIRS):
                continue
            # Skip excluded files
            if path.name in EXCLUDE_FILES:
                continue
            html_files.append(path)

        return html_files

    def run_validation(self, specific_file: Path = None):
        """Run validation on all files and report results."""
        files = self.find_html_files(specific_file)

        print("=" * 70)
        print("HTML TEMPLATE VALIDATION")
        print("=" * 70)

        for html_file in files:
            self.files_checked += 1
            file_issues = self.validate_file(html_file)

            if file_issues:
                self.files_with_issues += 1
                self.issues.extend(file_issues)

        self._report_results()

        # Exit with error code in strict mode
        if self.strict and self.has_errors():
            sys.exit(1)

    def has_errors(self) -> bool:
        """Check if any ERROR-level issues were found."""
        return any(issue.severity == "ERROR" for issue in self.issues)

    def _report_results(self):
        """Print validation results."""
        if not self.issues:
            print(f"\n[OK] All {self.files_checked} files passed validation\n")
            print("=" * 70)
            return

        # Group by severity
        errors = [i for i in self.issues if i.severity == "ERROR"]
        warnings = [i for i in self.issues if i.severity == "WARNING"]

        print(f"\nValidated: {self.files_checked} files")
        print(f"Issues found: {len(self.issues)} ({len(errors)} errors, {len(warnings)} warnings)")
        print(f"Files with issues: {self.files_with_issues}")
        print()

        # Report errors
        if errors:
            print("ERRORS:")
            print("-" * 70)
            for issue in errors:
                rel_path = issue.file.relative_to(SCRIPT_DIR)
                location = f":{issue.line_num}" if issue.line_num else ""
                print(f"  [X] {rel_path}{location}")
                print(f"    [{issue.issue_type}] {issue.message}")
                print()

        # Report warnings
        if warnings:
            print("WARNINGS:")
            print("-" * 70)
            for issue in warnings:
                rel_path = issue.file.relative_to(SCRIPT_DIR)
                location = f":{issue.line_num}" if issue.line_num else ""
                print(f"  [!] {rel_path}{location}")
                print(f"    [{issue.issue_type}] {issue.message}")
                print()

        print("=" * 70)

        if errors:
            print("[X] VALIDATION FAILED")
        else:
            print("[!] VALIDATION PASSED WITH WARNINGS")
        print("=" * 70)


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Validate HTML template structure")
    parser.add_argument("--strict", action="store_true",
                       help="Exit with error code if issues found")
    parser.add_argument("--file", type=Path,
                       help="Validate specific file instead of all files")

    args = parser.parse_args()

    validator = TemplateValidator(strict=args.strict)
    validator.run_validation(specific_file=args.file)


if __name__ == "__main__":
    main()
