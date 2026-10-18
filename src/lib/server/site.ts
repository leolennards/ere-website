import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { DEFAULT_SETTINGS, loadSettings, publicStatuses, type SiteSettings } from "@/lib/settings";
import { unstable_rethrow } from "next/navigation";

/**
 * Request-time settings (never baked in at build time). If the database is
 * unavailable the site still renders with the verified defaults.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  await connection();
  try {
    return await loadSettings(getDb());
  } catch (err) {
    unstable_rethrow(err);
    console.error("[settings] falling back to defaults:", err instanceof Error ? err.message : err);
    return DEFAULT_SETTINGS;
  }
});

export async function getPublicStatuses() {
  return publicStatuses((await getSiteSettings()).visibility);
}
