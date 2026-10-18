# ERE — Elevate Real Estate website

> © Elevate Real Estate. The source is public to show the work; it is not licensed for reuse, and the ERE name and logo belong to the business.

The website and listings dashboard for **ERE — Elevate Real Estate**, an estate agency at 163B Market Street, Parow Valley, Cape Town.

- **Public site:** homepage with property search, Buy and Rent listings with filters, property pages (gallery, map, bond calculator, enquiry form, WhatsApp), Sell, Property Valuation, Bond Calculator, About, Contact, Privacy (POPIA).
- **Admin dashboard (`/admin`):** listings with photo upload and publishing controls, enquiry management (status, assignment, follow-ups, notes, CSV export, deletion), site settings, testimonials, team, users.

> Current status, test results and next steps: [`CURRENT_STATUS.md`](CURRENT_STATUS.md). Content the owner still needs to supply: [`TODO.md`](TODO.md).

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL with Drizzle ORM · Argon2id auth · sharp image processing · Vitest + Playwright. Rationale: [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Requirements

- Node.js 22+ (developed on Node 24)
- PostgreSQL 15+ in production. Locally, the bundled **PGlite** server needs no installation, or you can use any Postgres (e.g. Docker).

## Getting started (local)

```bash
npm install
cp .env.example .env.local            # then set SESSION_SECRET (see the file)

npm run db:local                      # terminal 1: embedded Postgres on 127.0.0.1:5433 (data in .data/pglite)
npm run db:migrate                    # terminal 2: create tables
npm run db:seed-demo                  # optional: clearly-labelled demo listings for development
ADMIN_PASSWORD='choose-a-long-password' npm run admin:create -- --email you@example.com --name "Your Name"
npm run dev                           # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

Omit `ADMIN_PASSWORD` to be prompted for the password instead.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build for production, serve the build |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm test` | Unit and integration tests (Vitest; integration tests use in-memory PGlite) |
| `npm run test:e2e` | Playwright end-to-end tests against a running app (see `playwright.config.ts`) |
| `npm run verify` | typecheck + lint + tests + production build |
| `npm run db:local` | Start the embedded local Postgres server |
| `npm run db:generate` | Create a new SQL migration after changing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed-demo` / `db:clear-demo` | Add or remove demo listings (refuses to run in production) |
| `npm run admin:create` / `admin:reset-password` / `admin:disable` | Manage administrator accounts from the command line |

## Environment

All variables are documented in [`.env.example`](.env.example). Required: `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`. Optional: `BLOB_READ_WRITE_TOKEN` (photo storage on Vercel), `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`, `RESEND_API_KEY` + `EMAIL_FROM` + `NOTIFY_EMAIL_TO` (enquiry notification emails). Without the optional ones, the site still works: maps fall back to links and enquiries are only stored in the dashboard.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). In short: Vercel project, Neon Postgres and Vercel Blob from the Vercel Marketplace, set the environment variables, run `npm run db:migrate` against production, create the owner account with `npm run admin:create`, then point the domain.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/AUDIT.md](docs/AUDIT.md) | Phase 1 audit of the old WordPress site |
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | Goals, audiences, journeys |
| [docs/BRAND_AND_DESIGN_SYSTEM.md](docs/BRAND_AND_DESIGN_SYSTEM.md) | Tokens, type, components, motion |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Functional / non-functional requirements and acceptance criteria |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Application structure, rendering, integrations |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, constraints, migrations, backups |
| [docs/SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) | Threats, controls, POPIA |
| [docs/SEO_AND_ACCESSIBILITY.md](docs/SEO_AND_ACCESSIBILITY.md) | SEO implementation and accessibility testing |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production setup, backups, rollback |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Test strategy and latest results |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decision log |
| [docs/OWNER_GUIDE.md](docs/OWNER_GUIDE.md) | Plain-language guide for the business owner |
