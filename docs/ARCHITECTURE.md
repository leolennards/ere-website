# Architecture

## Overview

A single Next.js 16 application (App Router, React 19, TypeScript) serves the public website, the admin dashboard and a few API routes. Data lives in PostgreSQL, accessed through Drizzle ORM. Photos are stored in Vercel Blob in production, or on local disk in development.

```
Browser ──► Proxy (src/proxy.ts: /properties/:slug → 404 / 308 before render)
        ──► App Router pages (server components) ──► src/lib/data/* ──► PostgreSQL
        ──► Server actions (forms, admin)        ──► validation (zod) → data layer → audit log
        ──► Route handlers: /api/admin/... (upload, CSV), /media/... (local files), /search
```

## Directory structure

```
src/
  app/
    (site)/            public pages: home, buy, rent, properties/[slug], sell, valuation, bond-calculator, about, contact, privacy, credits
    admin/login        sign-in page
    admin/(panel)/     authenticated dashboard (layout runs requireAdmin)
    admin/actions.ts   all admin server actions (each re-checks the session/role)
    actions/           public form actions (enquiries)
    api/admin/         photo upload, enquiry CSV export
    media/[...path]    serves locally stored WebP uploads
    search/route.ts    homepage search → /buy or /rent
    sitemap.ts, robots.ts, opengraph-image.jpg, icons
  components/          site, home, property, search, forms, admin, seo, ui
  config/business.ts   verified business defaults (fallbacks for settings)
  lib/
    db/                schema.ts (single source of truth), index.ts (pool / handle)
    data/              repositories: properties, enquiries, audit
    auth/              password (Argon2id), session (cookies + DB)
    server/            site settings loader, storage, image pipeline, email, request guard
    settings.ts        zod-validated settings with defaults
    validation.ts      all form schemas
    mortgage.ts, format.ts, contact-links.ts, ids.ts, search-filters.ts, rate-limit.ts
  proxy.ts
drizzle/               generated SQL migrations
scripts/               migrate, admin provisioning, demo data
tests/                 Vitest unit + integration (PGlite)
e2e/                   Playwright
```

## Rendering model (Cache Components)

- Static parts (hero, copy, layouts) are **prerendered into a static shell**. Everything that reads the database runs **at request time**: `getSiteSettings()` calls `connection()`, and data components sit inside `<Suspense>`. `next build` therefore never needs a database. Public pages show as `◐ Partial Prerender` in the build output.
- **No server-side data caching** (no `use cache`). Listings and settings are always fresh, so publishing in the dashboard takes effect immediately, with no invalidation logic to get wrong. At this scale a few indexed queries per request are cheap. If traffic grows, `use cache` + `cacheTag` with `updateTag()` in admin actions is the upgrade path.
- **Interactive components are never inside a Suspense boundary that streams in a replacement.** The header receives settings as a promise (only its contact links suspend), and the contact and valuation forms render outside the settings boundary. Otherwise a menu opened, or text typed, before streaming finished would be lost. A production e2e test caught this.
- **Property pages** export `instant = false` and look the listing up before rendering. Because a prerendered shell would still fix the status at 200, `src/proxy.ts` performs the same lookup first: unknown or unpublished slugs are rewritten to a non-existent route (real **404**), renamed slugs get a **308** to the current slug (slugs end with the reference, e.g. `…-ere-7k2m9q`).
- Admin pages use `instant = false`. They are fully dynamic and blocked on the session check.

## Data access

- `getDb()` returns a shared Drizzle handle over a `pg` Pool (`max` 5, or 1 for local PGlite). Tests swap in an in-memory PGlite database with `setDb()` / direct injection. Every repository function takes the `db` as its first argument.
- Public queries take a `statuses` list derived from the owner's visibility settings. The public DTOs (`PropertyCardDTO`, `PropertyDetailDTO`) never include `street_address` or coordinates; the map query is computed server-side by `publicMapInfo()`.

## API boundaries

| Boundary | Auth | Notes |
| --- | --- | --- |
| Public server actions (`app/actions/enquiries.ts`) | none | zod validation, honeypot, fill-time check, per-IP rate limits, generic errors |
| Admin server actions (`app/admin/actions.ts`) | `requireAdmin()` in every action, `{ owner: true }` for destructive/sensitive | Next.js server actions also enforce same-origin |
| `POST /api/admin/properties/:id/images` | session + same-origin check | 4 MB limit, decode-validated |
| `GET /api/admin/enquiries/export` | session, owner role | audit-logged, CSV-injection safe |
| `GET /media/*` | none | local driver only, `.webp` only, path-traversal safe |

## Authentication

See [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md). In summary: Argon2id hashes, 32-byte random session tokens (only the SHA-256 is stored), `__Host-` HttpOnly Secure SameSite=Lax cookie with 7-day expiry, a DB check on every request, roles `owner` / `staff`.

## Images

The browser downscales to at most 2400 px JPEG (keeps uploads under Vercel's 4.5 MB body limit). The server then decodes with sharp (rejecting non-images regardless of filename or MIME type), auto-rotates, strips all metadata including GPS, and writes WebP at 480/960/1600 px. Pages use `<img srcset>` with the stored variants, so there are no runtime image-optimisation costs. Static site photography uses `next/image`.

## Integrations

| Service | Used for | Required? | Cost |
| --- | --- | --- | --- |
| PostgreSQL (Neon via Vercel Marketplace recommended) | all data | yes | Neon free tier is enough to start; paid plans from ~US$19/month for more storage and history |
| Vercel Blob | photos in production | yes on Vercel | small: storage + transfer, roughly cents per GB |
| Google Maps **Embed API** | maps | optional | Embed API requests are free (Google requires a billing account on the project) |
| Resend | "new enquiry" emails | optional | free tier 3,000 emails/month |
| Vercel hosting | app | yes (or any Node host) | Hobby is free for non-commercial use; a business site should use Pro (US$20/user/month) |

Check current pricing before committing. Prices change.
