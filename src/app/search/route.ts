import type { NextRequest } from "next/server";

const FORWARDED = ["q", "type", "minPrice", "maxPrice", "beds", "baths", "parking", "sort"];

/**
 * Routes the homepage search form to /buy or /rent, dropping empty fields.
 * Uses a relative Location so it works behind any host or proxy.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const target = new URLSearchParams();
  for (const key of FORWARDED) {
    const v = params.get(key)?.trim();
    if (v) target.set(key, v.slice(0, 80));
  }
  const path = params.get("deal") === "rent" ? "/rent" : "/buy";
  const qs = target.toString();
  return new Response(null, { status: 303, headers: { Location: qs ? `${path}?${qs}` : path } });
}
