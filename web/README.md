# web/

Web application for the Primary Sources research vault.

> **Status: Not yet initialized.** This directory is reserved for the frontend application. The database layer must be set up first — see [`supabase/`](../supabase/README.md).

## Planned Scope

The web layer will provide a research interface on top of the Supabase PostgreSQL backend. Planned capabilities:

- **Timeline View** — Chronologically ordered events with confidence indicators
- **Entity Pages** — Linked profiles for persons, organizations, places, and objects
- **Source Browser** — Navigate primary sources and their excerpts
- **Assertion Explorer** — Query claims by type, subject, or supporting evidence
- **Conflict Detector** — Flag assertions where evidence contradicts a known claim

## Stack (Proposed)

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Database client | Supabase JS SDK (`@supabase/supabase-js`) |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (row-level security) |
| Hosting | Vercel |

## Prerequisites Before Starting

1. Supabase project created and migrations applied (`001` and `002`) — see [`supabase/README.md`](../supabase/README.md)
2. `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Getting Started (once initialized)

```bash
cd web
npm install
npm run dev
```
