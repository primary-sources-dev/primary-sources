# Footer Duplication Investigation

## Summary
- The repeated footer rendering is caused by duplicated footer HTML already present in `index.html`, not by runtime loading.
- The build injector in `web/html/build.py` historically used a regex that stopped at the first closing tag (e.g., `</div>`), which can split a `data-component` wrapper when the injected component includes nested tags.
- Each build could therefore append another copy of the footer outside the wrapper, compounding the number of footers rendered.

## Evidence
- In `web/html/index.html`, the footer wrapper (`<div data-component="footer">`) contains one injected footer, but additional footer fragments appear *after* the wrapper closes.
- These extra fragments are outside the `data-component` wrapper, so `build.py --clean` (which only removes injected content inside wrappers) does not remove them.

## Why It Got Worse
- The original injector treated the first matching `</div>` as the end of the wrapper, even when the component HTML included nested `<div>` tags.
- That caused partial injection and leftover footer HTML in the file. Re-running the build added another injected footer while leaving previous leftovers in place.

## Current State
- The repository has been reset to commit `a99121e`, and force-pushed to match that state.
- The duplicated footer content in `index.html` should no longer be compounding after the reset, but any leftover artifacts depend on whether the file was re-generated or edited afterward.

## Recommended Fix (If Revisited)
- If you reintroduce a build fix, avoid regex-only matching for HTML wrappers. Use a parser or a depth-aware matching approach for opening/closing tags.
- Add a cleanup step that removes orphaned `<!-- BUILD:INJECTED --> ... <!-- /BUILD:INJECTED -->` blocks that are outside their wrapper.

