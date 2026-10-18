import "server-only";

/**
 * CSRF defence for route handlers: state-changing requests must come from this
 * site's own pages (session cookies are also SameSite=Lax).
 */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
