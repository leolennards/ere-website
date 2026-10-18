import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { admins, sessions, type AdminRole } from "@/lib/db/schema";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === "production";
// "__Host-" cookies must be Secure, path=/, and host-only — stronger isolation in production.
export const SESSION_COOKIE = secure ? "__Host-ere_admin" : "ere_admin";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(adminId: string) {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: sha256(token), adminId, expiresAt });
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, adminId));
  // Housekeeping: drop expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Resolves the signed-in administrator from the session cookie (deduplicated per request). */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const [row] = await getDb()
    .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role })
    .from(sessions)
    .innerJoin(admins, eq(admins.id, sessions.adminId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date()), eq(admins.status, "active")));
  return row ?? null;
});

/** For pages and server actions. Redirects to the login page when signed out. */
export async function requireAdmin(opts: { owner?: boolean } = {}): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (opts.owner && admin.role !== "owner") redirect("/admin?denied=1");
  return admin;
}

export async function signOutEverywhere(adminId: string) {
  await getDb().delete(sessions).where(eq(sessions.adminId, adminId));
}
