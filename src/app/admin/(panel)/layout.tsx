import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";
import { enquiryCounts } from "@/lib/data/enquiries";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | ERE Admin" }, robots: { index: false, follow: false } };

// Admin pages always render per request behind the session check.
export const instant = false;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const counts = await enquiryCounts(getDb());
  return (
    <AdminShell me={{ name: me.name, role: me.role }} unread={counts.unread}>
      {children}
    </AdminShell>
  );
}
