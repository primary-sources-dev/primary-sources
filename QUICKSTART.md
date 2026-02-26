# Quickstart

Fast reference for common development tasks.

## Start Development Server
```bash
cd C:\Users\willh\Desktop\primary-sources\tools
python ocr_server.py  # http://localhost:5000 | Stop: Ctrl+C
```

## Build HTML Templates
```bash
cd C:\Users\willh\Desktop\primary-sources\web\html

# Clean Build (recommended)
python build.py --clean && python build.py && python validate-build.py

# Quick Build
python build.py

# Validation Options
python validate-build.py              # All files
python validate-build.py --strict     # Exit on error
python validate-build.py --file path  # Single file
```

## Typical Workflow
1. **Start server** (terminal 1): `cd tools && python ocr_server.py`
2. **Make changes** to templates/components in `web/html/`
3. **Rebuild** (terminal 2): `cd web/html && python build.py && python validate-build.py`
4. **Refresh browser** to see changes

## File Locations
- `tools/ocr_server.py` - Flask development server
- `web/html/build.py` - Component injection build script
- `web/html/validate-build.py` - Post-build validation
- `web/html/components/` - Reusable HTML components
- `web/html/assets/` - CSS, JS, data files

## Common Issues
**Build doesn't reflect changes:** Run `python build.py --clean` first, then rebuild
**Duplicate headers/navigation:** Run `python validate-build.py` to check corruption
**Port 5000 in use:** Kill existing process or change port in `ocr_server.py`

---
For detailed documentation, see `README.md` and `CLAUDE.md`.
