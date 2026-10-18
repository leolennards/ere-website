import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __erePool?: Pool; __ereDb?: Db };

export function createPool(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return new Pool({
    connectionString: url,
    // The embedded PGlite dev server multiplexes one session, so keep one
    // connection per process locally to avoid interleaved transactions.
    max: Number(process.env.DATABASE_POOL_MAX || (local ? 1 : 5)),
    ssl: local || /sslmode=disable/.test(url) ? undefined : { rejectUnauthorized: true },
    idleTimeoutMillis: 10_000,
  });
}

/** Shared database handle. Tests swap it with `setDb()` (PGlite in-process). */
export function getDb(): Db {
  if (!g.__ereDb) {
    g.__erePool ??= createPool();
    g.__ereDb = drizzle(g.__erePool, { schema }) as unknown as Db;
  }
  return g.__ereDb;
}

export function setDb(db: Db) {
  g.__ereDb = db;
}

export { schema };
