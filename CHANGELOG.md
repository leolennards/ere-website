# Changelog

## 0.1.0 — 2026-10-18 (unreleased, local)

### Phase 1: Audit
- Audited the live WordPress site (Resido theme, 0 listings, conflicting contact details, theme demo content) → `docs/AUDIT.md`.
- Preserved the original logo and site icons; extracted brand red #FF0000.

### Phases 2–3: Design system, homepage, property discovery
- "Red, Ink & Bone" design system with Archivo (width axis) and Instrument Sans; accessible red variant for small text.
- Homepage: cinematic Cape Town hero, working search, editorial featured listings, process section based on ERE's own description, areas section driven by real data, seller CTA, bond teaser, contact band; testimonials and sold sections appear only with real content.
- Buy/Rent listings with URL-based filters, sorting, pagination, chips, and empty/loading/error states; works without JavaScript.
- Property pages with gallery and lightbox, facts (never zero for unknowns), map privacy levels, WhatsApp with reference, enquiry form, bond calculator, related listings.

### Phase 4: Backend and admin
- PostgreSQL schema and migration; Drizzle repositories; PGlite for local development and tests.
- Argon2id auth, DB sessions, rate-limited login (failures only), CLI provisioning, owner/staff roles.
- Admin: dashboard, listings CRUD and status workflow, photo pipeline (decode validation, GPS stripping, WebP variants, alt text, ordering), enquiries (status, assignment, follow-ups, notes, CSV export, deletion), settings, testimonials, team, users, account.

### Phase 5: Tools and integrations
- South African bond calculator (tested against independently computed values).
- Valuation request and contact forms with honeypot, timing check and rate limits; reference numbers; optional Resend notifications.
- Google Maps Embed with fallback; WhatsApp click-to-chat.

### Phase 6: Trust, SEO and compliance
- About, Sell, Contact, Privacy (POPIA) and Credits pages; metadata, canonicals, sitemap, robots, OG image, RealEstateAgent and Breadcrumb JSON-LD; legacy URL redirects; real 404/308 for listings via Proxy.

### Phase 7: Testing and fixes
- 43 unit/integration and 15 Playwright e2e tests, passing against both dev and production builds.
- Fixed from testing: login limiter counted successful sign-ins; forms and the mobile menu inside streamed Suspense fallbacks lost input/state in production; soft-404s for listings in production; two colour-contrast failures (step numerals, WhatsApp button); hero text animation preventing LCP registration; decimal comma in facts ("2,5" → "2.5").
