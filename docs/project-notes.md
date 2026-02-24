# Project Notes

---

## Form Options

Options for data entry without writing raw SQL:

1. **Supabase Table Editor** — Built into the Supabase dashboard. Spreadsheet-like interface, supports dropdowns from related tables. Available immediately, no setup required. Good for early-stage entry and schema validation.

2. **Custom Web Form (`web/`)** — A Next.js app using the Supabase JS SDK with forms tailored to the SOP workflow (guided multi-step: Source → Excerpt → Assertion → Support). Controlled vocab tables power dropdowns automatically. Most powerful long-term option.

3. **Retool or Appsmith** — No-code tools that connect directly to Supabase via REST API. Drag-and-drop form builder, publish in hours. No frontend code required. Good middle ground if the custom web app feels premature.

---

## Baseline Data Status (2026-02-24)

The project has transitioned from "Mock/Prototype" phase to "Validated Baseline" phase.
- **Canonical Files**: `people.json`, `events.json`, `organizations.json`, `places.json`, `objects.json`, `sources.json` are now the primary data sources.
- **Baseline Document**: See `docs/DATA-BASELINE-STANDARDS.md` for full field specifications and examples.
- **Routing**: All profile templates (`person.html`, `event.html`, etc.) are now fully dynamic and linked to the canonical files using dual-ID (UUID/Slug) lookup logic.

---

## Links

* [Primary Sources Dev — ChatGPT Agent](https://chatgpt.com/g/g-6998acf847c48191b56f76a57dfe61a3-primary-sources-dev)
