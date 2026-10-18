# TODO

## Content required from the owner (blocking a polished launch)

1. ~~Owner's name, role and bio~~ ✅ Mario Lennards, owner & estate agent (supplied 18 Oct 2026). Still open: a photo, if wanted.
2. ~~Contact details~~ ✅ 082 474 1178 (also WhatsApp) and admin@elevaterealestate.co.za confirmed.
3. **Office hours:** hidden for now, by the owner's choice.
4. **PPRA Fidelity Fund Certificate number** and any registration/disclosure text for the footer.
5. **Founding year** (the old site said 2021; confirm before showing).
6. **Specific areas for the homepage chips.** The owner works across Cape Town and the surrounding towns; copy reflects this, and chips stay hidden until a list is supplied.
7. **Agents to list** (the old site listed four people including a principal; each needs to agree, with current phone numbers).
8. **Genuine testimonials** with written consent. Don't reuse the old site's quotes: at least one matches theme demo content.
9. **Social links** (suggested from the old site; confirm they're still active): facebook.com/Elevate-Real-Estate-110120034731402, instagram.com/elevaterealestate_, linkedin.com/in/elevate-real-estate-21a95a222.
10. **Real listings with licensed photos.**
11. **Privacy notice review** by the business or its legal adviser.
12. **Confirm the "Free valuations" and "assistance with all major banks" claims** from the old site before adding them to copy.
13. Licence for the old site's interior image `ere-background.jpg`: no longer used anywhere.

## Outstanding decisions

- Hosting/billing account owner (Vercel Pro, Neon, Blob, Resend, Google Cloud).
- Whether to add analytics (Vercel Web Analytics is cookieless; any choice must be reflected in the privacy notice).
- Domain: apex vs `www` as canonical.

## Engineering (prioritised)

1. **Deploy** following docs/DEPLOYMENT.md once accounts exist (P1).
2. Configure the Maps key and Resend; re-test both live (P1).
3. Manual screen-reader and Safari/Firefox/iOS passes (P1).
4. Automated retention job: flag or delete resolved enquiries older than 24 months (P2).
5. Email-based password reset and TOTP 2FA for owner accounts (P2).
6. Field performance monitoring (Vercel Speed Insights) and LCP review on real devices (P2).
7. Drag-and-drop photo reordering (currently arrow buttons, which are accessible) (P3).
8. Upgrade drizzle-kit / eslint-config-next when upstream releases resolve the dev-only `npm audit` findings (P3).
9. Optional: property portal export feed (Property24 / Private Property) (P3).
