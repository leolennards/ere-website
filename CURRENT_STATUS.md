# Current status (16 Nov 2026)

**Phase:** 8 (deployment) in progress. The site is **deployed and working** on Vercel (project `ere-website`, region fra1) with Neon Postgres and Vercel Blob. It is reachable on the Vercel address until the domain's DNS is switched; `www.elevaterealestate.co.za` and the bare domain are registered on the project and `NEXT_PUBLIC_SITE_URL` already uses the final address.

**Remaining to go live (owner action, MWEB cPanel → Zone Editor):** see "Switching the domain" in docs/DEPLOYMENT.md. Do not change the MX, mail or SPF records: email stays with MWEB.

## Completed
All features in docs/REQUIREMENTS.md marked ✅: public site (home, buy, rent, property pages, sell, valuation, bond calculator, about, contact, privacy, credits), admin dashboard (listings + photos, enquiries, settings, testimonials, team, users, account), SEO infrastructure, security controls, documentation.

## Incomplete / needs configuration
- DNS switch for the domain (docs/DEPLOYMENT.md). Vercel plan: the project is on a Hobby team; Vercel requires Pro for commercial sites.
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
2. Switch DNS at MWEB (docs/DEPLOYMENT.md), then confirm HTTPS on both hostnames.
3. Owner supplies the remaining content in TODO.md (PPRA number, hours, agents, testimonials) and approves the privacy notice.
4. Optional: Google Maps key and Resend email notifications.
