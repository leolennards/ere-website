# Requirements

Status key: ✅ implemented and tested · 🟡 implemented, needs owner input or production configuration · ⬜ not built

## Functional

| # | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| F1 | Homepage: hero, working search, featured listings (published + featured only), why-ERE, areas, seller CTA, bond teaser, contact band | ✅ | e2e `public.spec.ts`, screenshots |
| F2 | Buy and Rent listings: filters (area, type, price, beds, baths, parking), sorting, pagination, URL-shareable state, active-filter chips, clear all, loading/empty/error states | ✅ | integration + e2e |
| F3 | Property page: gallery (keyboard, swipe, lightbox), facts without zeros, description, features, costs, map with privacy level, agent/office card, enquiry form, WhatsApp with reference, related listings, bond calculator | ✅ | e2e |
| F4 | Draft and archived listings never public. Sold, let and under-offer visibility follows owner settings | ✅ | integration + e2e |
| F5 | Property enquiry, valuation request, general contact: server validation, spam protection, rate limiting, reference number, stored in dashboard, optional email notification, honest failure messages | ✅ / 🟡 email needs Resend | e2e `forms.spec.ts`, `admin.spec.ts` |
| F6 | South African bond calculator: price, deposit (% or R), rate, term, extra repayment; zero-interest case; assumptions and disclaimers | ✅ | unit tests vs independent values + e2e |
| F7 | WhatsApp click-to-chat (`wa.me/27824741178`) with encoded messages; phone fallback; configurable/disable-able | ✅ | unit + e2e |
| F8 | Google Maps: office map + directions; per-property exact/approximate/hidden; graceful fallback without key | ✅ / 🟡 key | unit (privacy) + manual |
| F9 | Admin auth: login/logout, Argon2id, DB sessions, rate-limited, CLI-only provisioning, owner/staff roles, server-side checks | ✅ | e2e + curl checks |
| F10 | Admin listings: create/edit/draft/publish/unpublish/under offer/sold/let/archive/delete (typed confirmation), reference, featured, agent, map visibility, preview | ✅ | e2e |
| F11 | Photos: multi-upload with progress, client downscale, server decode-validation, metadata/GPS stripping, WebP variants, alt text, reorder, cover, delete | ✅ | e2e (incl. rejecting a disguised PHP file) |
| F12 | Enquiry management: filters (type, status, date, unread, search), status, assignee, follow-up date, notes, owner-only CSV export and deletion | ✅ | e2e |
| F13 | Site settings: contact details, WhatsApp, verified email, hours, disclosures, socials, visibility, About content, SEO description | ✅ | e2e |
| F14 | Testimonials (consent required to publish; section hidden when empty) and team | ✅ | DB constraint + manual |
| F15 | About, Contact, Sell, Valuation, Privacy (POPIA), Credits pages | ✅ / 🟡 owner content | e2e |
| F16 | Password reset by email | ⬜ deliberately not built: owner resets via CLI. Users can change their own password in the dashboard. | n/a |

## Non-functional

| Area | Target | Status |
| --- | --- | --- |
| Accessibility | WCAG 2.2 AA | ✅ axe: 0 serious/critical on 5 key pages. Lighthouse a11y 100 on tested pages. Manual screen-reader pass still recommended. |
| Performance | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 | 🟡 CLS 0. Simulated slow-4G LCP 2.8–4 s in the lab (see TEST_PLAN). Measure in the field after deploy. |
| Security | OWASP-style controls (see SECURITY_AND_PRIVACY.md) | ✅ implemented. 🟡 needs production HTTPS and secrets. |
| SEO | Titles, descriptions, canonicals, sitemap, robots, OG, JSON-LD, real 404/308 | ✅ |
| Responsiveness | No horizontal overflow, 390 → 1440 px | ✅ e2e |
| Progressive enhancement | Search, filters and pagination work without JavaScript (GET forms) | ✅ |

## Acceptance criteria

The brief's §23 list is mapped to automated or recorded checks in [TEST_PLAN.md](TEST_PLAN.md).

## Assumptions

- 082 474 1178 is the primary number and the WhatsApp number. The owner can change both in Settings.
- Rentals are part of the business (the old site had a "For Rent" status).
- Sold and let listings are hidden until the owner enables them.
- The office address is shown as "163B Market Street, Parow Valley, Cape Town, 7500".

## Out of scope (not built)

Automated valuation models; transfer-duty or bond-cost calculators (they need maintained, verified rules); user accounts or favourites for visitors; property portal syndication (Property24 / Private Property feeds); blog; analytics (pending the owner's choice and a POPIA review); multilingual content.
