# Phase 1 — Audit and Technical Discovery

_Audit date: 18 October 2026. Everything below was observed directly unless marked otherwise._

## 1. What was inspected

| Source | Access | Notes |
| --- | --- | --- |
| Live site `https://www.elevaterealestate.co.za/` | ✅ Fetched (HTML, `/wp-json`, `/listings/`, `/about-us/`, `/contact-us/`, `/our-agents/`) | Inspected as raw HTML and REST responses, not in a visual browser. No Lighthouse run was possible against the live site from this environment. |
| Local repository | ❌ None existed | No ERE source code was found on this machine. The new project was created at `~/Projects/ere-website`. |
| WordPress admin, hosting panel, DNS | ❌ No credentials | Database contents, plugin settings, form destinations and hosting constraints could not be verified. |

## 2. Current state of the live site

- **Platform:** WordPress (PHP 8.2, Apache) using the commercial **Resido** real-estate theme, **Elementor / Elementor Pro**, **Essential WP Real Estate** and `resido-core`. Built by "StudioFX" (footer credit).
- **Pages:** Home, About Us, Properties For Sale (`/listings/`), Our Agents, Contact Us. There are also many theme leftovers that are publicly reachable: `sample-page`, `dashboard-2`, `add-listing-page-2`, `compare-page-2`, `purchase-history-page`, `primary-checkout-page`, `register-user-page`, `half-map-search`, `our-articles`, `location`.
- **Listings:** `/listings/` reports **"Showing 0 of 0 Results — Nothing Found"**. The homepage "Featured Properties" section is empty. There is no listing data to migrate.
- **Search:** Search filters (price, type, bedrooms, 20 locations) are rendered, but return nothing.
- **Public user registration** is enabled on the front end (login/registration modal). This is unnecessary for an agency site and widens the attack surface.
- **SEO:** `<title>` = "Elevate Real Estate – Property Specialists". There is **no meta description and no Open Graph tags**. WordPress emits default feeds, `xmlrpc.php` and REST endpoints.
- **Performance hints:** The page uses `Cache-Control: no-store` and sets a `PHPSESSID` cookie on every page, so it can't be cached by a CDN. It loads three Google font families (Poppins, Jost, Muli) plus Elementor and theme bundles, and the homepage HTML is about 169 KB.

### Contact data found on the live site (conflicts with the brief)

| Item | Live site | Brief |
| --- | --- | --- |
| Primary phone | (021) 931-5967 landline and 067 949 9279 | **082 474 1178** |
| WhatsApp link | `wa.me/+27836253410` (083 625 3410) | **+27 82 474 1178** |
| Email | `admin@elevaterealestate.co.za` | "only when verified" |
| Address | 163 B Market Street, Parow Valley, 7500, Cape Town | 163b Market Street, Parow, Cape Town |
| Theme placeholders still live | `tel:123-456-7890`, `contact@mysite.com` | — |

**Decision:** The site uses the owner-confirmed **082 474 1178** (`+27824741178`) for calls and WhatsApp, and the confirmed email address. The address is shown as "163B Market Street, Parow Valley, Cape Town, 7500", which merges the brief with the more precise live-site version. OpenStreetMap resolves Market Street in Parowvallei but not house number 163B, so **no coordinates are hard-coded**. Maps pass the street address to Google.

> Update (18 Oct 2026): the owner confirmed 082 474 1178 (Mario Lennards, owner) as the business number, also used for WhatsApp, and confirmed `admin@elevaterealestate.co.za` as the business email.

### Brand assets

- **Logo:** `cropped-ere-realestate-1.png` (542×349, transparent). It is a pure **#FF0000** red mark: a stylised double-gable roofline with a swoosh, the letters "ERE" flanked by tapered horizontal bars, and "ELEVATE REAL ESTATE" in a condensed bold sans. It has been preserved unchanged (trimmed to its bounding box) in `public/brand/ere-logo.png`. A white version for dark backgrounds was produced by recolouring the same alpha mask (`ere-logo-white.png`).
- **Site icons:** The existing 32/180/192px icons are reused as `favicon.ico`, `apple-icon.png` and `icon.png`.
- **Colour:** #FF0000 is the only brand colour in use; the rest is theme default. #FF0000 on white has 4.0:1 contrast, which fails WCAG AA for body-size text. See the design system for how this is handled.
- **Typography:** The live site uses Poppins and Jost from the theme, but **the logo lettering is a condensed bold grotesque**, so that is the brand cue the new type system follows.
- **Imagery:** The single hero image `ere-background.jpg` is a stock interior render with unknown licence. It is reused only as an interior accent and flagged for licence confirmation.

### Content found (accuracy status)

| Content | Status |
| --- | --- |
| About text: "founded in 2021", service philosophy, the mandate → marketing → buyer → bond approval → registration process | Written by the business on its own site. **Reused only in substance**, and the 2021 founding date is **not displayed** until the owner confirms it (TODO). |
| Services: "Buying and Selling of Residential Property", "Free Property Valuations & Property Consulting", "Financial Assistance with all major Banks" | The "free" and "all major banks" claims are **not repeated** until confirmed. |
| Agents: four people listed on `/our-agents/`, including a "Principal" | **Not imported.** Staff details are personal information and may be out of date. The owner adds them through Admin → Team. |
| Testimonials: four quotes, at least one (role "Social Media Specialist") matching Resido theme demo content | **Not imported.** None could be verified as genuine. |
| 20 location terms (Athlone … Strandfontein) | These look like areas used for past listings. They are **not presented as areas served** until confirmed. |
| Socials: Facebook page `Elevate-Real-Estate-110120034731402`, Instagram `@elevaterealestate_`, LinkedIn `elevate-real-estate-21a95a222` | Stored as **suggested values** in the TODO. They are not enabled on the site until the owner confirms them. |

## 3. Main problems

1. The site shows **no properties**, so it currently cannot do its main job.
2. Contact details are inconsistent: three phone numbers, a different WhatsApp number and leftover theme placeholders.
3. Unverifiable testimonials, which risk being, or looking like, fabricated reviews.
4. Public registration and unused e-commerce and theme pages are exposed.
5. There's no meta description, no OG data, an uncacheable HTML response, and heavy theme/Elementor bundles.
6. The owner can't easily manage listings or see enquiries in one place. The live contact-form destination is unknown.

## 4. Technical risks

- **No access to the WordPress database or admin**, so existing enquiries, users and any unpublished listings can't be exported. The owner should export them before DNS cut-over.
- **Domain/DNS is controlled by the current host.** Cut-over needs whoever administers DNS.
- **The commercial theme licence and plugin renewals** stop being needed after migration. Confirm there's no contract lock-in.
- **Email deliverability:** a sending domain (SPF/DKIM) must be set up for notification emails.

## 5. Recommended architecture (decision)

Enhancing the WordPress/Resido install was considered and rejected:

- We have no admin, database or hosting access, so we can't safely change it.
- The theme's listing plugin, front-end registration and Elementor stack are the source of most of the issues above.
- The brief requires bespoke design, a custom enquiry pipeline, POPIA-oriented data handling and a typed, tested codebase. That's achievable in WordPress, but only by replacing most of the theme anyway.

**Chosen stack** (rationale in `docs/DECISIONS.md`):

- **Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4.** Server-rendered pages, with server actions for forms and admin.
- **PostgreSQL via Drizzle ORM.** Managed Postgres in production (e.g. Neon via the Vercel Marketplace). Locally, an embedded PGlite server (no install) or Docker.
- **First-party admin auth:** Argon2id hashes, database sessions, HttpOnly cookies, rate-limited login, CLI-only admin provisioning.
- **Images:** server-side validation and re-encoding with `sharp`. Stored on the local disk in development and in Vercel Blob in production.
- **Optional integrations:** Google Maps Embed API (free tier, key-restricted) and Resend for email notifications. The site degrades gracefully without either.
- **Hosting:** Vercel (the owner's developer already uses it), with a custom domain.

## 6. Proposed redesign (summary)

"**Red, Ink and Bone**": the logo's pure red used sparingly as a signal colour against warm off-white ("bone") and a warm near-black ("ink"). Headings use a condensed bold display face that echoes the logo lettering. The logo's tapered red bars become a recurring section marker. Cape Town photography is set full-bleed. See `docs/BRAND_AND_DESIGN_SYSTEM.md`.

## 7. Implementation sequence

Follows the brief's phases 2–8, tracked in `CURRENT_STATUS.md` and `CHANGELOG.md`.

## 8. Missing information and assumptions

See `TODO.md → Content required from the owner`. The key items:

1. Owner's name, photo and role, and which (if any) agents to list.
2. Confirmation of phone, WhatsApp and email. Which number is on WhatsApp?
3. Business hours, and the areas genuinely served.
4. The founding year and any professional registrations to publish. In South Africa, agents and agencies must hold a valid **Fidelity Fund Certificate from the PPRA**. The FFC number and other disclosures should be supplied for the footer.
5. Licensed property photography for real listings.
6. Whether rentals are part of the business. The live site has a "For Rent" status, so rentals are **enabled** but show an honest empty state until a rental is published.
7. Any genuine testimonials, with written consent from each client.
