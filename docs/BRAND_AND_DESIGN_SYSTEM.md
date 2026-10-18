# Brand and design system: "Red, Ink & Bone"

## Existing identity (preserved)

- **Logo:** ERE's original PNG (`public/brand/ere-logo.png`), trimmed but not altered. A white version (`ere-logo-white.png`) was produced from the same alpha mask for dark backgrounds. The `Logo` component is the only way the logo is rendered.
- **Brand colour:** pure **#FF0000**, sampled from the logo.
- **Lettering cue:** the logo's condensed bold capitals and its tapered red bars either side of "ERE".

## Colour tokens (`src/app/globals.css`, `@theme`)

| Token | Value | Use |
| --- | --- | --- |
| `ere-red` | #FF0000 | Logo, large display words, decorative bars. **Not for small text**: 4.0:1 on white. |
| `red-ink` | #C8000A | Text links, primary buttons (6.1:1 with white) |
| `red-deep` | #9E0008 | Hover state |
| `red-wash` | #FDE8E7 | Error panels, icon chips |
| `ink` / `ink-2` / `ink-3` | #15110E / #241E1A / #3A322C | Dark sections, text |
| `bone` | #F6F1EA | Page background (warm off-white) |
| `sand` | #ECE4D8 | Secondary panels, skeletons |
| `line` | #DDD3C6 | Borders |
| `stone` | #5F564E | Muted text (6.4:1 on bone) |
| `mist` | #BDB3A7 | Muted text on ink (9:1) |
| `success` / `warning` (+ `-wash`) | #1D6F47 / #8A5A00 | Status messages |
| WhatsApp button | #0E7A40 | WhatsApp-family green darkened to 5.4:1 |

Every colour pairing in use was checked against WCAG AA. axe-core runs in the e2e suite.

## Typography

- **Display (`.display`, `.heading`):** Archivo variable, using its width axis at 70–78% and weight 750–800, uppercase for `.display`. It echoes the logo's condensed lettering from a single self-hosted font file.
- **Body/UI:** Instrument Sans.
- Both are loaded with `next/font` (self-hosted, `display: swap`, size-adjusted fallbacks so there's no layout shift).
- Scale: display headings 2.6–8.5 rem fluid by breakpoint, body 1 rem/1.6, small 0.875 rem.

## Signature devices

- **Tapered bar** (`.eyebrow::before`, hero rule): the logo's flanking bars, used as section markers.
- **Red word**: one key word per major heading in `ere-red` (e.g. "**Elevate**", "**selling?**").
- **Ink sections** alternate with bone sections to create rhythm. Image-led sections use full-bleed Cape Town photography.

## Layout

- `.container-site`: max 84 rem with a 16/24/40 px gutter at mobile, tablet and desktop.
- 12-column asymmetric grids on desktop (7/5, 5/7, 8/4); single column on mobile.
- Corner radius: 1 rem cards, 1.5–2 rem feature panels, pill buttons.

## Components

| Component | File |
| --- | --- |
| Header (transparent over the hero, solid on scroll; dropdown; `<dialog>` mobile drawer) | `components/site/site-header.tsx` |
| Footer | `components/site/site-footer.tsx` |
| Buttons, inputs, badges, cards | CSS classes in `globals.css` (`.btn-*`, `.input`, `.select`, `.badge`, `.card`) |
| Property card / feature card, status badge, facts | `components/property/*` |
| Gallery with lightbox | `components/property/gallery.tsx` |
| Search panel, listing filters, filter drawer, sort | `components/search/*` |
| Form fields, consent, success/error states | `components/forms/fields.tsx` |
| Map with consent-style "Show map" facade | `components/map-embed.tsx` |
| Bond calculator | `components/mortgage-calculator.tsx` |
| Admin shell, generic form, confirm dialog, image manager | `components/admin/*` |
| Loading skeletons, empty states, error states | in each view (`ListingsSkeleton`, `EmptyResults`, `error.tsx`, `not-found.tsx`) |

## Motion

- Hero: the image settles from 108% scale (1.8 s); hero text lifts 14 px with an 80 ms stagger. It is **transform-only**, so text is visible from the first paint. The red rule grows in.
- Sections: CSS scroll-driven reveal (`.reveal`, `animation-timeline: view()`). In browsers without support, content simply shows. No JavaScript is involved.
- Cards: 1.2 s image zoom to 104%, lift and border change on hover; arrow chip turns red.
- Navigation: underline grows on hover and active links; dropdown fades and rises.
- Dialogs: fade; drawers slide in from the right.
- `prefers-reduced-motion: reduce` disables all animation and transitions. Print disables reveals.

## Responsive behaviour

Breakpoints follow Tailwind (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Tested at 390 px (mobile) and 1366–1440 px (desktop) with no horizontal overflow (asserted in e2e). Filters become a drawer below `lg`. Navigation becomes a full-height drawer below `lg`. Tables in admin scroll horizontally inside their card.

## Imagery

Hero and section photos are Wikimedia Commons images of Cape Town (CC BY-SA / CC0), credited on `/credits`. They never imply an ERE listing. Demo listing photos are CC0 StockSnap and are only used by local demo data.
