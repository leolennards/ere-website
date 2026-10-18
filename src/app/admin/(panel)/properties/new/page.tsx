import type { Metadata } from "next";
import Link from "next/link";
import { saveProperty } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-shell";
import { EMPTY_PROPERTY, PropertyForm } from "@/components/admin/property-form";
import { requireAdmin } from "@/lib/auth/session";
import { listActiveAgents } from "@/lib/data/properties";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "New property" };
export const instant = false;

export default async function NewProperty() {
  await requireAdmin();
  const agents = await listActiveAgents(getDb());
  return (
    <div className="max-w-4xl">
      <Link href="/admin/properties" className="link text-sm">← All properties</Link>
      <AdminHeader title="New property" description="Save the details first; you can add photos straight after." />
      <PropertyForm action={saveProperty.bind(null, null)} initial={EMPTY_PROPERTY} agents={agents.map((a) => ({ id: a.id, name: a.name }))} isNew />
    </div>
  );
}
