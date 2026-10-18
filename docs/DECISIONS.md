# Decision log

## D1: Rebuild instead of enhancing WordPress (18 Oct 2026)
**Context:** the live site runs the Resido theme, Elementor and a listings plugin. It has no listings, inconsistent contact details and public registration, and we have no admin or hosting access.
**Alternatives:** (a) fix the existing WordPress site; (b) headless WordPress + new front end; (c) a purpose-built app.
**Decision:** (c). With no access, (a) and (b) were impossible to do safely. The brief also needs a custom enquiry pipeline, POPIA-oriented data handling and a tested codebase. **Cost:** the owner moves to a new dashboard; a developer is needed for code changes.

## D2: Next.js 16 with Cache Components, all data at request time
**Alternatives:** `use cache` with tag invalidation; the older dynamic model.
**Decision:** keep the framework default (Cache Components) for static shells and streaming, but read the database only at request time (`connection()` + Suspense). Builds never touch the database, and admin changes appear instantly. Revisit caching if traffic grows.

## D3: PostgreSQL + Drizzle; PGlite for local development and tests
**Alternatives:** SQLite (diverges from production), Prisma (heavier engine), Supabase (more services than needed).
**Decision:** Postgres everywhere through the same `pg` driver. Locally the PGlite socket server needs no install, and tests run on in-memory PGlite with real migrations. Docker Postgres is documented for full fidelity.

## D4: First-party authentication
**Alternatives:** Auth.js / Clerk / Supabase Auth.
**Decision:** a small, audited implementation (Argon2id, DB sessions, `__Host-` cookie, rate limits, CLI provisioning). It needs only a few accounts, has no third-party dependency or cost, and gives full control over POPIA data. **Trade-off:** no email password reset or 2FA yet (TODO).

## D5: Pre-generated WebP variants instead of runtime image optimisation
Upload-time processing strips GPS metadata, validates the file by decoding it, and avoids per-request optimisation costs. Static marketing photos still use `next/image`.

## D6: Google Maps Embed API behind a "Show map" facade on listings
The Embed API isn't charged per load, and loading it only on request avoids third-party requests until the visitor asks. The office map on Contact loads automatically. The privacy level is computed server-side, so private addresses never reach the browser.

## D7: Use owner-confirmed contact details; hide unverified content
082 474 1178 (confirmed by the owner) is used for phone and WhatsApp, with admin@elevaterealestate.co.za as the email; the owner's name and bio were supplied by the business. Hours, socials, founding year, testimonials, agents and specific areas served stay hidden until confirmed in Settings. Content from the old site isn't republished without confirmation.

## D8: Property 404/308 in Proxy
With partial prerendering the HTTP status is committed before the page runs, so `notFound()` produced soft 404s in production. `src/proxy.ts` looks the slug up first. It costs one indexed query per property-page request, but listings get correct status codes for SEO.

## D9: Forms and header never inside replaceable Suspense fallbacks
A production e2e failure showed that interactive fallbacks are swapped out by streamed content, losing typed input or an open menu. Forms render outside settings boundaries, and the header takes settings as a promise and suspends only its contact links.

## D10: Display typeface: Archivo (width axis) + Instrument Sans
Archivo's 62–125% width axis echoes the logo's condensed capitals from one self-hosted variable font. Instrument Sans is highly legible for body and UI text. Both load via `next/font` with metric-matched fallbacks.

## D11: Logo red reserved for large type
#FF0000 fails AA for small text, so the darker `red-ink` (#C8000A) is used for links and buttons. This preserves the brand while meeting WCAG.
