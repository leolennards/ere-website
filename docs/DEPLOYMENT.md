# Deployment

**Status:** not yet deployed. Nothing has been published to a live URL, and DNS for elevaterealestate.co.za has not been touched. These are the steps to take when the owner approves launch.

## Recommended hosting

| Piece | Recommendation | Notes |
| --- | --- | --- |
| App | **Vercel** (Pro plan for a commercial site) | Node.js runtime, region **cpt1 (Cape Town)** if available on the plan, otherwise `fra1`/`lhr1` |
| Database | **Neon Postgres** via Vercel Marketplace | Choose an AWS region close to the app region. Use the *pooled* connection string. |
| Photos | **Vercel Blob** | Connect the store to the project; `BLOB_READ_WRITE_TOKEN` is added automatically |
| Email (optional) | **Resend** | Verify the sending domain (SPF + DKIM DNS records) |
| Maps (optional) | Google Maps **Embed API** | See below |

Any Node 22+ host with Postgres works too: `npm run build && npm start`. Without Vercel Blob, photos are stored in `UPLOADS_DIR` on persistent disk.

## Step by step

1. **Push the repository** to GitHub and import it in Vercel (framework: Next.js; defaults are fine).
2. **Database:** Vercel → Storage → Marketplace → Neon → create and connect it to the project (sets `DATABASE_URL`).
3. **Blob:** Vercel → Storage → Blob → create a store and connect it (sets `BLOB_READ_WRITE_TOKEN`).
4. **Environment variables** (Production and Preview):
   - `SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   - `NEXT_PUBLIC_SITE_URL=https://www.elevaterealestate.co.za` (or the final domain)
   - optional: `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFY_EMAIL_TO`
5. **Migrate:** locally, with the production URL: `DATABASE_URL='<neon url>' npm run db:migrate`
6. **Create the owner account:** `DATABASE_URL='<neon url>' npm run admin:create -- --email <owner email> --name "<Owner name>"` (prompts for the password). Don't run `db:seed-demo` against production; it refuses when `NODE_ENV`/`VERCEL_ENV` is production, but don't rely on that.
7. **Deploy** (push to `main`, or `vercel --prod`).
8. **Smoke test** on the Vercel URL: home, `/buy`, `/contact`; sign in at `/admin`; create a draft, upload a photo, publish, check it on `/buy`; send a test enquiry and see it in the dashboard; check `/sitemap.xml` and `/robots.txt`. Then delete the test listing and enquiry.
9. **Domain and HTTPS:** add `elevaterealestate.co.za` and `www` in Vercel → Domains, then update DNS at the current registrar as Vercel instructs (A record for the apex and a CNAME for `www`). HTTPS certificates are issued automatically. Keep MX records unchanged so email keeps working.
10. **Before switching DNS:** export anything needed from the old WordPress site (enquiries, users, media) and confirm with the current host how to cancel. The old URLs are redirected (see `next.config.ts`).

## Switching the domain

The domain's DNS, the old WordPress site and the mailboxes are all at MWEB (cPanel). Only two records change; everything else, especially **MX, `mail` and the SPF TXT record, stays as it is** so email keeps working. Keep the MWEB package: the mailboxes live on it.

In MWEB cPanel → **Zone Editor** → `elevaterealestate.co.za`:

| Record | Name | Change to |
| --- | --- | --- |
| A | `elevaterealestate.co.za.` (the bare domain) | `216.198.79.1` |
| CNAME | `www` | `bc23d20298760899.vercel-dns-017.com.` |

If `mail`, `webmail`, `cpanel` or `ftp` are CNAMEs to the bare domain, first change them to A records with the old address (`102.65.21.17`) so they keep pointing at MWEB.

Afterwards: `vercel domains verify www.elevaterealestate.co.za` (Vercel then issues the HTTPS certificates automatically). The bare domain redirects to `www` (`next.config.ts`). To roll back, restore the two old values (A `102.65.21.17`, `www` CNAME to the bare domain).

## Google Maps configuration

1. Google Cloud Console → create a project → enable **Maps Embed API** (billing account required, but Embed API usage is not charged).
2. Credentials → API key → **Application restrictions: Websites** → add `https://www.elevaterealestate.co.za/*`, `https://elevaterealestate.co.za/*` and the Vercel preview domain if needed. **API restrictions:** Maps Embed API only.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` and redeploy (it is inlined at build time).
4. Check the office pin on `/contact`. The map uses the street address, not hard-coded coordinates.

## Email notifications

Set `RESEND_API_KEY`, `EMAIL_FROM` (on a verified domain, e.g. `ERE Website <website@elevaterealestate.co.za>`) and `NOTIFY_EMAIL_TO` (the inbox that should be alerted). Notifications contain the reference and a dashboard link only. Failed emails never fail a submission (they're logged).

## Backups

See [DATABASE.md](DATABASE.md#backups-and-recovery): Neon point-in-time restore, plus a weekly encrypted `pg_dump`.

## Rollback

- **Code:** Vercel → Deployments → previous deployment → *Promote to Production* (instant).
- **Database:** migrations are forward-only. Before a risky migration, create a Neon branch. To recover, restore to a point in time or switch `DATABASE_URL` to the branch.
- **DNS:** keep the old host's records documented until the new site has been stable for a few weeks.

## Ongoing costs (estimates; verify current pricing)

Vercel Pro about US$20/month; Neon free to start (paid from about US$19/month); Blob a few US$/month at most for listing photos; Resend free tier; Google Maps Embed free. The domain renewal stays with the current registrar.
