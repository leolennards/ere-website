import { getCurrentAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/data/audit";
import { exportEnquiries } from "@/lib/data/enquiries";
import { getDb } from "@/lib/db";
import { enquiryStatus, enquiryType } from "@/lib/db/schema";

function csvCell(v: unknown) {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Owner-only CSV export of enquiries matching the current filters. Every export is audit-logged. */
export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Unauthorised", { status: 401 });
  if (admin.role !== "owner") return new Response("Only the owner account can export enquiries.", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const type = enquiryType.enumValues.find((t) => t === sp.get("type"));
  const status = enquiryStatus.enumValues.find((s) => s === sp.get("status"));
  const db = getDb();
  const rows = await exportEnquiries(db, { type, status, q: sp.get("q")?.slice(0, 80) || undefined });
  await audit(db, admin, "enquiries.exported", "enquiry", "", `${rows.length} enquiries exported`);
  const header = ["reference", "createdAt", "type", "status", "name", "phone", "email", "preferredContact", "propertyReference", "message", "details", "marketingConsent"];
  const body = [header.join(","), ...rows.map((r) => header.map((h) => csvCell(r[h as keyof typeof r])).join(","))].join("\r\n");
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ere-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
