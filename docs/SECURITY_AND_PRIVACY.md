# Security and privacy

No system is "completely secure". This document lists what is implemented, what remains the deployer's responsibility, and the known residual risks.

## Threats considered

| Threat | Controls |
| --- | --- |
| Account takeover / credential stuffing | Argon2id (19 MiB, t=2), min 12-char passwords, failed-attempt limits per IP (20/15 min) and per account (5/15 min), constant-work check for unknown emails, generic error message, audit log of failures |
| Session theft | 256-bit random tokens; only SHA-256 stored; `__Host-` cookie, HttpOnly, Secure, SameSite=Lax, 7-day expiry; disabled users and password changes revoke sessions; logout deletes the row |
| Privilege escalation | No public registration; first owner created only by CLI; every admin page, action and route re-checks the session server-side; owner-only: settings, users, exports, permanent deletes; the last active owner can't be disabled |
| CSRF | Server actions: built-in same-origin check. Route handlers: `Origin` must match host. SameSite=Lax cookies. |
| XSS | React escaping everywhere; descriptions are plain text (no HTML rendering); JSON-LD escapes `<`; CSP blocks third-party scripts, framing and plugins |
| SQL injection | Drizzle parameterised queries only; `LIKE` wildcards escaped |
| Malicious uploads | Size limits (4 MB), decoded with sharp (the filename and MIME type are not trusted), re-encoded to WebP, metadata (incl. GPS) stripped, stored outside `public/`, served only as `image/webp` with `nosniff` and `default-src 'none'`, path-traversal checks |
| Spam / abuse of forms | Honeypot, minimum fill time, per-IP rate limits (5 per 10 min per form, 30/day), server validation |
| Data leakage | Public DTOs exclude private address/coordinates; drafts are invisible (tested); admin pages `noindex` + `no-store`; notification emails exclude visitor contact details; logs omit personal data and passwords |
| Spreadsheet formula injection | CSV export prefixes cells starting with `= + - @` |
| Probing the admin while signed out | `src/proxy.ts` redirects any `/admin/*` request without a session cookie to the login page (307) before a page is rendered, so no admin code or markup is sent. Every page, server action and API route still validates the session and role itself; the proxy check is only the first gate (tested in `e2e/admin.spec.ts`) |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |

Headers (from `next.config.ts`): CSP, HSTS (2 years), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. `X-Powered-By` is disabled.

## Residual risks and trade-offs

- **CSP allows `'unsafe-inline'` scripts.** Next.js streaming injects inline scripts; nonce-based CSP would force every page to render dynamically and remove the static shell. The mitigation is that no user content is rendered as HTML and no third-party scripts are allowed.
- **Client IP for rate limiting** comes from `x-real-ip` / `x-forwarded-for`. On Vercel these are set by the platform. If self-hosting, put the app behind a proxy that overwrites them, or clients could rotate them.
- **Password reset** is CLI-only (`npm run admin:reset-password`). No email reset flow means no email-based takeover, but the owner needs developer help to reset their own password.
- **No 2FA.** Recommended future addition for owner accounts.
- **Public Blob URLs:** photos of draft listings are reachable if someone knows the unguessable URL (random UUID). Don't upload anything sensitive as a listing photo.
- **Dependency risk:** on 18 Oct 2026, `npm audit --omit=dev` reported **0 vulnerabilities** in production dependencies. The full audit reports 9 (4 moderate, 5 high) in **development-only** tooling: drizzle-kit's bundled esbuild (dev-server request issue) and eslint-config-next's glob dependencies (ReDoS). These aren't shipped, and npm's only automatic fix is a major *downgrade*, so they are tracked in TODO to resolve via upstream updates. Run `npm audit` monthly.

## POPIA

| Requirement | Implementation |
| --- | --- |
| Openness / notice | `/privacy`: responsible party, information officer, what is collected and why, sharing, cross-border transfer, retention, security, cookies, rights, Information Regulator. Linked from every form and the footer. **Must be reviewed by the business or its legal adviser before launch.** |
| Consent and purpose | Required checkbox acknowledging the notice. Version and timestamp stored per enquiry. |
| Direct marketing (s69) | Separate, **unticked**, optional opt-in. Stored as `marketing_consent`. Never implied by an enquiry. |
| Minimality | Only name, phone and preferred contact are required. Email and property details are optional. No ID numbers or financial data. |
| Security safeguards (s19) | Controls above, access limited to authenticated staff, audit logging |
| Data subject rights | Access/correction: staff look up the enquiry by name/phone. Deletion: owner can permanently delete an enquiry and its notes from the dashboard (audit-logged). |
| Retention | Policy in the notice: enquiries without a transaction are reviewed and deleted within 24 months of last contact. **Operational task**: monthly, filter enquiries older than 24 months with status *Resolved* and delete them (manual today; an automated job is in TODO). |
| Operators | Hosting, database, storage and email providers act as operators. Confirm agreements/DPAs with each. |
| Information Officer | Defaults to "the principal of ERE" until the owner's name is set in Settings. Register the Information Officer with the Information Regulator if not already done. |

## Operational security checklist

- Use a unique, long owner password; don't share accounts — create a staff user per person.
- Keep `SESSION_SECRET`, database and Blob tokens only in Vercel environment variables.
- Restrict the Google Maps key to the site's domains and to the Maps Embed API only.
- Review *Recent activity* on the dashboard periodically.
- Disable staff accounts on the day someone leaves (Users → Disable).
