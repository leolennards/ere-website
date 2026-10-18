# Test plan and results

## Layers

| Layer | Tool | Location | What it covers |
| --- | --- | --- | --- |
| Unit | Vitest | `tests/unit` | Mortgage maths against independently computed values (Python `Decimal`, 40-digit precision) incl. zero-interest and extra repayments; ZAR formatting; WhatsApp/tel/directions links; reference and slug generation; search-filter parsing (invalid input dropped, ranges swapped, round-trip to URL) |
| Integration | Vitest + in-memory PGlite (real Postgres engine, real migrations) | `tests/integration` | Draft/archived never public; sold hidden unless enabled; featured only when published; combined filters; LIKE-wildcard escaping; price sorting with POA last; pagination clamping; publish lifecycle; slug redirects; property deletion keeps enquiries; image reorder/cover; map privacy (no address/coords leak); enquiry consent metadata; draft linking refused; enquiry filters/counts/deletion; settings validation; rate limiter |
| End-to-end | Playwright (Chromium; desktop 1366 px + Pixel 7) | `e2e` | Every public page 200 with unique title and one `h1`; header/footer links resolve; legacy redirects 308; search → results → filter chips → clear; drafts/sold hidden; real 404; gallery (buttons, lightbox, keyboard); WhatsApp link format; calculator values; axe-core WCAG 2.2 AA scan; mobile menu + no horizontal overflow; valuation form validation and success; honeypot refusal (no false success); admin redirect, wrong password, full listing lifecycle (create draft → hidden → upload → reject fake image → publish → visible → enquire → status → note → delete enquiry → delete listing), settings persistence, sign-out |

E2E tests create and clean up their own records (`cleanupTestData`) and send a random `x-real-ip` per visitor so rate limits don't interfere.

## Running

```bash
npm test                                   # unit + integration
npm run build && npx next start -p 3001    # production server (DB running, demo seeded, owner created)
E2E_BASE_URL=http://localhost:3001 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
```

## Latest results (18 Oct 2026, local, macOS, Node 24, PGlite server)

| Check | Result |
| --- | --- |
| `npm run typecheck` | ✅ pass |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm test` | ✅ 43/43 passed |
| `next build` | ✅ success, 0 warnings. Public pages are Partial Prerender; admin is dynamic. |
| `npm run test:e2e` against the **production build** | ✅ 15/15 passed |
| `npm run test:e2e` against `next dev` | ✅ 15/15 passed |
| axe-core (5 key pages) | ✅ 0 serious/critical violations (two earlier findings fixed: step-number contrast, WhatsApp button contrast) |
| Lighthouse (mobile, simulated slow 4G, local prod build) | Home: Perf 83 · A11y 100 · Best practices 100 · SEO 100. Buy: Perf 83 · 100 · 100 · 100. Property (demo): Perf 94 · A11y 100 · Best practices 100 · SEO 69 (*expected*: demo listings are `noindex`). CLS 0 on all. Lab LCP 2.8–4.0 s (see note). |
| Security headers | ✅ CSP, HSTS, nosniff, frame DENY, referrer and permissions policies present |
| Access control (curl) | ✅ `/admin/*` → 307 to login; export → 401; upload → 401 without session, 403 cross-origin |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities (dev tooling: 9, see SECURITY_AND_PRIVACY) |

**Performance note:** in real Chrome on the local production build, LCP entries are at 130–250 ms. Lighthouse's simulated LCP is dominated by its slow-4G model, and on the homepage it picks the small header logo: Chrome is not registering the condensed display headings as LCP candidates (verified with a `PerformanceObserver`). Field data after deployment (Vercel Speed Insights or CrUX) is the real measure. INP could not be measured in the lab; TBT is 160–270 ms.

## Not yet tested

- Real Google Maps embed (no key configured). The fallback was tested.
- Email notifications (no Resend account). The code path is no-op when unconfigured.
- Vercel Blob storage (local driver tested).
- Physical devices, iOS Safari, Firefox (only Chromium automated). Screen reader passes.
- Load and concurrency on managed Postgres.

## Release acceptance criteria

All of the above automated checks pass on the deployed preview; the manual smoke test in DEPLOYMENT.md passes; demo data is absent in production (dashboard warning gone); privacy notice approved by the business; owner content in TODO supplied or consciously deferred.
