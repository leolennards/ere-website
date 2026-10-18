# SEO and accessibility

## Technical SEO (implemented)

- **Titles and descriptions:** unique per page (template `%s | Elevate Real Estate`). Property pages generate `"<title>, <suburb>"` and a description from type, suburb, price, reference and description text.
- **Canonicals:** every public page. Filtered listing URLs canonicalise to `/buy` or `/rent`.
- **Sitemap:** `/sitemap.xml`, built per request with static pages plus all publicly visible, non-demo listings with `lastModified`.
- **robots.txt:** allows everything except `/admin`, `/api/`, `/search`. Admin pages also send `X-Robots-Tag: noindex`.
- **Status codes:** unknown, draft or archived listings → **404** (via `src/proxy.ts`, before any streaming). Renamed listings → **308** to the current slug. Legacy WordPress URLs (`/about-us`, `/contact-us`, `/listings`, `/our-agents`, …) → **308**.
- **Open Graph / Twitter:** site-wide branded image (`src/app/opengraph-image.jpg`). Property pages use their cover photo.
- **Structured data:** `RealEstateAgent` (name, address, phone, verified email and socials only — **no ratings or reviews**) on Home and Contact. `BreadcrumbList` on property pages. No listing-level schema: Google has no real-estate listing rich result, and invented markup would be misleading.
- **Demo listings** are `noindex` and excluded from the sitemap.
- **Headings:** one `h1` per page (asserted in e2e), logical `h2`/`h3`.

## Local SEO (owner actions)

- Claim or verify the **Google Business Profile** with exactly: *Elevate Real Estate*, *163B Market Street, Parow Valley, Cape Town, 7500*, *082 474 1178*, website URL. Name, address and phone must match the site.
- Add the site to **Google Search Console** and submit `https://<domain>/sitemap.xml`.
- Update the phone number on Facebook, Instagram and LinkedIn to match.
- Write genuine suburb content only for areas ERE actually serves (e.g. a short Parow page) once confirmed.

Rankings depend on many factors outside the website. None are guaranteed.

## Accessibility (target WCAG 2.2 AA)

Implemented:

- Semantic landmarks, a skip link, one `h1`, labelled navigation regions, breadcrumbs.
- Visible focus rings on everything (`:focus-visible`, 2 px red-ink; white on dark).
- Forms: every input has a `<label>`, required fields are marked in text, errors are linked via `aria-describedby`, an error summary uses `role="alert"` and receives focus, success uses `role="status"`.
- Colour is never the only signal (status badges have text; unread enquiries have a dot plus the text "(unread)").
- Contrast is checked for every token pair (see the design system doc). The pure logo red is reserved for large display text.
- Dialogs use native `<dialog>` (focus trap, Escape, `aria-label`). Dropdown: `aria-expanded`, Escape and outside click close it.
- Gallery: carousel region with roledescription, live position announcement, labelled controls, keyboard arrows, swipe, thumbnails with `aria-current`.
- Maps have a descriptive `title`, plus a text address and an external link alternative.
- `prefers-reduced-motion` disables all animation. Content never depends on animation to appear.
- Touch targets ≥ 44 px for primary controls. Pages zoom to 200% without loss (no fixed heights on text containers).

## Testing strategy

- **Automated:** axe-core (`@axe-core/playwright`, tags wcag2a/aa, 21a/aa, 22aa) on Home, Buy, Contact, Valuation and Bond calculator. The suite fails on any *serious* or *critical* violation. Lighthouse accessibility: 100 on Home, Buy and a property page (18 Oct 2026).
- **Responsive:** e2e asserts no horizontal overflow at 412 px (Pixel 7) on Home, Buy and Contact. Screenshots reviewed at 390 and 1440 px.
- **Manual, still to do before launch:** VoiceOver (iOS/macOS) and TalkBack pass through search → listing → enquiry; keyboard-only pass through the admin property editor; 200% zoom check.
