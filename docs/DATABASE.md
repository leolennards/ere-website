# Database

PostgreSQL. The schema is defined in [`src/lib/db/schema.ts`](../src/lib/db/schema.ts), and migrations are generated into [`drizzle/`](../drizzle).

## Tables

| Table | Purpose | Key columns / rules |
| --- | --- | --- |
| `properties` | Listings | `reference` UNIQUE (ERE-XXXXXX), `slug` UNIQUE (ends with reference), `transaction_type` sale/rent, `property_type`, `status` draft/available/under_offer/sold/let/archived, `price` whole rands or NULL = "price on application", optional facts (NULL = not supplied; never shown as 0), `street_address` + `latitude/longitude` (private), `map_visibility` exact/approximate/hidden, `features text[]`, `featured`, `agent_id` → agents (SET NULL), `is_demo`, `published_at` (set on first publish, then kept) |
| `property_images` | Photos | `property_id` → properties (CASCADE), `urls` jsonb {480,960,1600}, `storage_keys`, `width/height`, `alt`, `sort_order` (lowest = cover) |
| `enquiries` | Leads | `reference` UNIQUE (ENQ-YYMMDD-XXXX), `type` property/valuation/general, `status` new/contacted/in_progress/resolved, `property_id` → properties (**SET NULL**) plus snapshot `property_reference`/`property_title`, contact fields, `details` jsonb (valuation answers), `privacy_accepted_at` + `privacy_notice_version`, `marketing_consent` (default false), `assigned_to` → admins (SET NULL), `follow_up_at`, `read_at` |
| `enquiry_notes` | Internal notes | `enquiry_id` (CASCADE), `author_id` (SET NULL) + `author_name` snapshot |
| `admins` | Dashboard users | `email` UNIQUE, Argon2id `password_hash`, `role` owner/staff, `status` active/disabled, `last_login_at` |
| `sessions` | Login sessions | `id` = SHA-256 of the cookie token, `admin_id` (CASCADE), `expires_at` |
| `agents` | Team shown publicly | name, role, phone, email, active, sort order |
| `testimonials` | Client quotes | CHECK: cannot be `published` unless `consent_confirmed` |
| `settings` | Key → JSON settings | keys `business`, `social`, `visibility`, `about`, `seo`; validated with zod on read and write; `updated_by` |
| `audit_log` | Admin activity | action, entity, summary (never passwords or enquiry content) |
| `rate_limits` | Abuse protection | key (salted IP/account hash), count, reset_at |

## Constraints and indexes

- CHECKs: price ≥ 0, bedrooms 0–50, latitude/longitude ranges, testimonial publish ⇒ consent.
- Indexes: `properties (status, transaction_type)`, `suburb`, `price`, `featured`; `property_images (property_id, sort_order)`; `enquiries (status)`, `(type)`, `(created_at)`; `sessions (admin_id)`, `(expires_at)`; `audit_log (created_at)`.
- Pagination uses `LIMIT/OFFSET` with a deterministic order (status rank, sort key, `id`). Page numbers are clamped.

## Relationships and deletion behaviour

- Deleting a property deletes its image rows (CASCADE), removes the files from storage (in the action), and **keeps** enquiries (the FK is set NULL; the snapshot fields preserve which listing they were about).
- Deleting an admin unassigns their enquiries and keeps their notes (author name snapshot).

## Migrations

1. Edit `src/lib/db/schema.ts`.
2. `npm run db:generate -- --name short_description` creates `drizzle/NNNN_*.sql`. **Review the SQL.** Avoid destructive changes (dropping or renaming columns) without a two-step migration.
3. `npm run db:migrate` applies pending migrations (tracked in `drizzle.__drizzle_migrations`). Run it against production before deploying code that depends on the change.

The current schema is a single migration `0000_init.sql`.

## Backups and recovery

- **Neon:** point-in-time restore is built in (history window depends on plan; free tier ≈ 1 day, paid up to 30 days). Before risky migrations, create a branch: Neon console → Branches → *Create branch* (instant copy).
- **Logical backup** (recommended weekly, kept encrypted off-platform):
  `pg_dump "$DATABASE_URL" --format=custom --file=ere-$(date +%F).dump`
  Restore: `pg_restore --clean --no-owner --dbname "$TARGET_URL" ere-YYYY-MM-DD.dump`
- **Photos:** Vercel Blob is durable but not versioned. Keep original listing photos in the agency's own files.
- Backups contain personal information. Store them encrypted, restrict access, and delete them in line with the retention policy.

## Local database

`npm run db:local` runs PGlite (Postgres compiled to WebAssembly) as a server on `127.0.0.1:5433`, with data in `.data/pglite`. It multiplexes one session, so the app uses a single pooled connection locally. For full Postgres fidelity use Docker instead:
`docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17` and set `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable`.
