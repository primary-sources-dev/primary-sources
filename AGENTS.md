# Repository Guidelines

## Project Structure & Module Organization

- `docs/` is the source of truth for architecture, ontology, provenance, and the data-entry SOP.
- `supabase/` holds schema and seed migrations under `supabase/migrations/`.
- `web/` is reserved for the future frontend (not initialized yet).
- `docs/ui/` contains static UI mockups and a style guide.

## Build, Test, and Development Commands

- `supabase db push` applies all migrations via the Supabase CLI.
- `psql -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql` runs a migration locally.
- `psql -U postgres -d postgres -f supabase/migrations/002_seed_vocab.sql` seeds controlled vocab tables.
- `cd web; npm install; npm run dev` starts the web app once initialized.

## Coding Style & Naming Conventions

- SQL migrations are sequential and immutable: `001_initial_schema.sql`, `002_seed_vocab.sql`, `003_...sql`.
- Controlled vocabulary tables are prefixed `v_`, and codes are uppercase (e.g., `REPORT`, `EXACT`).
- Maintain 4NF normalization and the assertion-based evidence model described in `docs/`.
- UUID primary keys are immutable; never change IDs after creation.

## Testing Guidelines

- No automated test suite yet; validate changes by applying migrations and checking constraints.
- Data entry must follow `docs/data-entry-sop.md` to keep assertions traceable to excerpts.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (`feat:`, `docs:`, `chore:`, `refactor:`).
- PRs should describe intent, list affected docs or migrations, and note ordering constraints.
- Schema changes require a new migration file and a matching update to `docs/architecture-and-schema.md`.
- UI changes should include screenshots or references to updated mockups in `docs/ui/`.

## Security & Configuration Tips

- Keep `.env.local` out of version control; use `web/.env.example` as a template.
- Do not store secrets in migrations or documentation.
