# Current status (16 Nov 2026)

**Phase:** 8 (deployment) complete. The site is **live at https://www.elevaterealestate.co.za** (Vercel project `ere-website`, region fra1, Neon Postgres, Vercel Blob). DNS was switched at MWEB on 16 Nov 2026: A `@` → Vercel, `www` CNAME → Vercel; MX, `mail` and SPF are unchanged, so email stays with MWEB. HTTPS certificates are issued for both hostnames and the bare domain redirects to `www`.

## Completed
All features in docs/REQUIREMENTS.md marked ✅: public site (home, buy, rent, property pages, sell, valuation, bond calculator, about, contact, privacy, credits), admin dashboard (listings + photos, enquiries, settings, testimonials, team, users, account), SEO infrastructure, security controls, documentation.

## Incomplete / needs configuration
- Vercel plan: the project is on a Hobby team; Vercel requires Pro for commercial sites.
- Google Maps key (maps currently fall back to "Open in Google Maps").
- Email notifications (Resend not configured).
- Owner content (see TODO.md); About page owner section and testimonials stay hidden until supplied.

## Known issues
- Lab (Lighthouse simulated slow 4G) LCP is 2.8–4.0 s; real-browser LCP locally is ~0.2 s. Needs field measurement.
- CSP permits inline scripts (framework requirement; see SECURITY_AND_PRIVACY.md).
- Dev-only `npm audit` findings in drizzle-kit and eslint-config-next.
- Only Chromium is covered by automated tests.

## Latest verification
typecheck ✅ · lint ✅ (0 problems) · unit/integration 43/43 ✅ · production build ✅ (0 warnings) · e2e 17/17 ✅ on the production build · admin e2e 5/5 ✅ against the live deployment (test data removed afterwards) · axe 0 serious/critical · Lighthouse a11y/best practices 100 · `npm audit --omit=dev` 0. Details: docs/TEST_PLAN.md.

## Local environment notes
- The local database (`.data/pglite`) contains **6 demo listings** and a test owner `owner@ere.test`. Remove both before using this database for anything real (`npm run db:clear-demo`; delete the user).

## Exact next steps
1. Owner signs in to the live admin, changes the temporary password, and adds real listings.
2. Keep the MWEB package (mailboxes); the old WordPress files remain there as a fallback.
3. Owner supplies the remaining content in TODO.md (PPRA number, hours, agents, testimonials) and approves the privacy notice.
4. Optional: Google Maps key and Resend email notifications.
