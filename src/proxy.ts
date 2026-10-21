import { NextResponse, type NextRequest } from "next/server";
import { getPublicPropertyBySlug } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { loadSettings, publicStatuses } from "@/lib/settings";

const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-ere_admin" : "ere_admin";

/**
 * Property pages stream a prerendered shell, which fixes the HTTP status at 200
 * before the page can call notFound(). Checking the slug here, before rendering,
 * gives search engines a real 404 for removed listings and a real 308 for renamed ones.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) return guardAdmin(request);
  const slug = decodeURIComponent(request.nextUrl.pathname.slice("/properties/".length));
  if (!slug || slug.includes("/") || slug.length > 200) return NextResponse.next();
  try {
    const db = getDb();
    const statuses = publicStatuses((await loadSettings(db)).visibility);
    const r = await getPublicPropertyBySlug(db, slug, statuses);
    if (r.kind === "redirect") return NextResponse.redirect(publicUrl(request, `/properties/${r.slug}`), 308);
    if (r.kind === "missing") return NextResponse.rewrite(new URL("/__listing-not-found", request.url));
  } catch (err) {
    // Fall through: the page performs the same lookup and handles errors itself.
    console.error("[proxy] listing lookup failed:", err instanceof Error ? err.message : err);
  }
  return NextResponse.next();
}

/**
 * Signed-out visitors are sent to the login page before any admin page code is
 * rendered or sent. This only checks that a session cookie is present; every
 * admin page, action and API route still verifies the session itself.
 */
function guardAdmin(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || !/^\/admin(\/|$)/.test(path)) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && /^[\w-]{43}$/.test(token)) return NextResponse.next();
  return NextResponse.redirect(publicUrl(request, "/admin/login"), 307);
}

/** Absolute URL on the host the visitor actually used (request.url can be the bind address, e.g. 0.0.0.0). */
function publicUrl(request: NextRequest, path: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return new URL(path, `${proto}://${host}`);
}

export const config = { matcher: ["/properties/:slug", "/admin/:path*"] };
