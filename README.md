# Lectern

Curriculum management for school districts. Curriculum directors create a district account, invite their teachers, and collect Understanding-by-Design unit plans through a draft → submit → review → approve workflow.

## Stack

- Next.js 16 (App Router)
- Postgres (Neon recommended) via `pg`
- JWT cookies for sessions
- Tailwind CSS v4

## Local development

1. Install deps:
   ```bash
   npm install
   ```
2. Provision a Postgres database (Neon free tier works fine) and copy the connection string.
3. Create `.env.local` from `.env.example` and fill in:
   - `DATABASE_URL` — Postgres connection string (must include `?sslmode=require` for Neon).
   - `JWT_SECRET` — any long random string.
   - `ANTHROPIC_API_KEY` — optional, enables document upload parsing and AI-powered cross-curricular connections.
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000` and click **Start Free Trial** to create your first district account.

The schema is created automatically on first DB query — no migration step needed.

## Multi-tenancy

Every row in `users`, `curriculum_docs`, `doc_history`, and `notes` has a `district_id` foreign key. API routes scope all reads and writes by the `districtId` claim in the session JWT. The public curriculum browse view is district-scoped via the `?district=<slug>` query param.

## Roles

- **Admin** — manages users, district settings (name, subjects, grade levels), and reviews/approves docs.
- **Teacher** — drafts, edits, and submits curriculum docs for review.

## Deploying

Designed for Vercel + Neon. Push to GitHub, connect the repo to Vercel, set the env vars in the Vercel dashboard, and deploy.
