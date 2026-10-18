import { createHash } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import type { Db } from "./db";
import { rateLimits } from "./db/schema";

/**
 * Fixed-window rate limiter stored in Postgres, so limits hold across
 * serverless instances. Keys contain only a salted hash of the client IP.
 */
export async function hitRateLimit(db: Db, key: string, limit: number, windowSeconds: number) {
  const result = (await db.execute(sql`
    insert into ${rateLimits} (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    on conflict (key) do update set
      count = case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end,
      reset_at = case when ${rateLimits.resetAt} < now() then excluded.reset_at else ${rateLimits.resetAt} end
    returning count, reset_at
  `)) as unknown as { rows: { count: number; reset_at: Date | string }[] };
  const row = result.rows[0];
  // Opportunistic cleanup of expired windows.
  if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, sql`now() - interval '1 day'`));
  return { allowed: row.count <= limit, count: row.count, resetAt: new Date(row.reset_at) };
}

/** Reads a bucket without incrementing it. */
export async function isRateLimited(db: Db, key: string, limit: number) {
  const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
  return Boolean(row && row.resetAt > new Date() && row.count >= limit);
}

export function hashIdentifier(value: string) {
  const salt = process.env.SESSION_SECRET || "ere-dev-salt";
  return createHash("sha256").update(`${salt}:${value}`).digest("base64url").slice(0, 32);
}

export function clientIpFrom(headers: Headers) {
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
