import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { SITE_URL } from "@/config/business";
import { listSitemapProperties } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { loadSettings, publicStatuses } from "@/lib/settings";
import { unstable_rethrow } from "next/navigation";

const STATIC = ["/", "/buy", "/rent", "/sell", "/valuation", "/bond-calculator", "/about", "/contact", "/privacy"];

/** Built per request so new listings appear immediately; demo listings are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const pages: MetadataRoute.Sitemap = STATIC.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: p === "/" || p === "/buy" || p === "/rent" ? "daily" : "monthly" }));
  try {
    const db = getDb();
    const statuses = publicStatuses((await loadSettings(db)).visibility);
    const rows = await listSitemapProperties(db, statuses);
    return [...pages, ...rows.filter((r) => !r.isDemo).map((r) => ({ url: `${SITE_URL}/properties/${r.slug}`, lastModified: r.updatedAt, changeFrequency: "weekly" as const }))];
  } catch (err) {
    unstable_rethrow(err);
    return pages;
  }
}
