import { desc } from "drizzle-orm";
import type { Db } from "../db";
import { auditLog } from "../db/schema";

/** Records an admin action. Summaries must never contain passwords, tokens or enquiry contents. */
export async function audit(
  db: Db,
  actor: { id: string; name: string } | null,
  action: string,
  entity = "",
  entityId = "",
  summary = "",
) {
  await db.insert(auditLog).values({ adminId: actor?.id ?? null, adminName: actor?.name ?? "", action, entity, entityId, summary });
}

export async function recentAudit(db: Db, limit = 8) {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
