# Project Notes

---

## Form Options

Options for data entry without writing raw SQL:

1. **Supabase Table Editor** — Built into the Supabase dashboard. Spreadsheet-like interface, supports dropdowns from related tables. Available immediately, no setup required. Good for early-stage entry and schema validation.

2. **Custom Web Form (`web/`)** — A Next.js app using the Supabase JS SDK with forms tailored to the SOP workflow (guided multi-step: Source → Excerpt → Assertion → Support). Controlled vocab tables power dropdowns automatically. Most powerful long-term option.

3. **Retool or Appsmith** — No-code tools that connect directly to Supabase via REST API. Drag-and-drop form builder, publish in hours. No frontend code required. Good middle ground if the custom web app feels premature.
