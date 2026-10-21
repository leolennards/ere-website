# Current status (18 Oct 2026)

**Phase:** 7 (testing and refinement) complete locally. **Phase 8 (deployment) not started**: no hosting accounts or credentials are configured, and nothing is live.

## Completed
All features in docs/REQUIREMENTS.md marked ✅: public site (home, buy, rent, property pages, sell, valuation, bond calculator, about, contact, privacy, credits), admin dashboard (listings + photos, enquiries, settings, testimonials, team, users, account), SEO infrastructure, security controls, documentation.

## Incomplete / needs configuration
- Production deployment, domain and HTTPS (docs/DEPLOYMENT.md).
- Google Maps key (maps currently fall back to "Open in Google Maps").
- Email notifications (Resend not configured).
- Owner content (see TODO.md); About page owner section and testimonials stay hidden until supplied.

## Known issues
- Lab (Lighthouse simulated slow 4G) LCP is 2.8–4.0 s; real-browser LCP locally is ~0.2 s. Needs field measurement.
- CSP permits inline scripts (framework requirement; see SECURITY_AND_PRIVACY.md).
- Dev-only `npm audit` findings in drizzle-kit and eslint-config-next.
- Only Chromium is covered by automated tests.

## Latest verification
typecheck ✅ · lint ✅ (0 problems) · unit/integration 43/43 ✅ · production build ✅ (0 warnings) · e2e 17/17 ✅ on the production build · axe 0 serious/critical · Lighthouse a11y/best practices 100 · `npm audit --omit=dev` 0. Details: docs/TEST_PLAN.md.

## Local environment notes
- The local database (`.data/pglite`) contains **6 demo listings** and a test owner `owner@ere.test`. Remove both before using this database for anything real (`npm run db:clear-demo`; delete the user).

## Exact next steps
1. Owner supplies the content in TODO.md §1–§13.
2. Create Vercel (Pro), Neon, Blob, Google Cloud and Resend accounts under the business's ownership.
3. Follow docs/DEPLOYMENT.md steps 1–8 on a Vercel preview URL; run the e2e suite against it (`E2E_BASE_URL=…`).
4. Owner reviews the preview and approves the privacy notice.
5. DNS cut-over (step 9), then submit the sitemap in Google Search Console and update the Google Business Profile.
