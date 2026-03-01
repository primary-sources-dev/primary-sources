# Lean CLAUDE.md Template

Rules for writing the leanest possible CLAUDE.md for any project.

## Structure (8 sections max)

1. **Current Mission** — 1-2 sentences + numbered priority list
2. **Hard Rules** — numbered list, no explanations, ref docs for why
3. **Build-Inline Rules** — one-liners, no examples
4. **Build** — code block, nothing else
5. **Architecture** — bullet the active system, ref files for details
6. **Key Paths** — `label: path` format, one line each
7. **Schema/Data Model** — single table, no prose
8. **Don't** — bullet fragments, no explanations

## Principles

- No examples — ref the file that contains them
- No explanations — state the rule, link the doc
- No prose between sections — headings + content only
- No duplicating info that lives in other docs — point to it
- Every line earns its place — if removing it changes nothing, remove it
- Data attributes for behavior, classes for styling — this applies to the doc itself: structure for machine consumption, formatting for human scanning
- Section headers are verbs or nouns, never sentences
- Tables over paragraphs, bullets over tables, fragments over bullets
- `code` for paths/commands, **bold** for emphasis, nothing else
- Ref format: `→ path/to/file.md` (arrow, not "see" or "refer to")
- Max ~80-100 lines for any project

## Anti-patterns

- Lengthy "Project Overview" paragraphs — cut to one sentence
- "Why" explanations after rules — move to architecture docs
- SQL/code examples — ref the migration or source file
- Workflow step-by-step guides — ref the SOP doc
- Repeated constraints (Don't section echoing Hard Rules) — merge or cut
- Feature inventories — ref working-notes or roadmap
- Historical context — irrelevant to the AI building today
