import os
import re
from pathlib import Path

def fix_file(path):
    print(f"Processing {path}")
    content = path.read_text(encoding="utf-8")
    
    # 1. Add mega-menu if missing
    if 'data-component="header"' in content and 'data-component="mega-menu"' not in content:
        print(f"  Adding mega-menu mount point")
        content = re.sub(
            r'(<header data-component="header"[^>]*></header>)',
            r'\1\n    <div data-component="mega-menu"></div>',
            content
        )
    
    # 2. Force rebuild: Remove injected blocks
    if '<!-- BUILD:INJECTED -->' in content:
        print(f"  Cleaning existing injected blocks")
        content = re.sub(
            r'\s*<!-- BUILD:INJECTED -->.*?<!-- /BUILD:INJECTED -->\s*',
            '\n',
            content,
            flags=re.DOTALL
        )
    
    # 3. Force rebuild: Remove loaded classes
    if 'component-loaded' in content:
        print(f"  Removing component-loaded classes")
        content = re.sub(r' component-loaded', '', content)
        content = re.sub(r' class=""', '', content)
        
    path.write_text(content, encoding="utf-8")

# Process root-exclusive of components and assets
for path in Path('.').rglob('*.html'):
    parts = path.parts
    if 'components' in parts or 'assets' in parts or 'node_modules' in parts:
        continue
    if path.name == 'build.py':
        continue
    fix_file(path)
