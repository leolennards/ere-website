import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { removeAgent, saveAgent } from "@/app/admin/actions";
import { AdminForm, type FieldSpec } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/admin-shell";
import { ConfirmAction } from "@/components/admin/kit";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { agents, type Agent } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Team" };
export const instant = false;

const fields = (a?: Agent): FieldSpec[] => [
  { name: "name", label: "Name", type: "text", value: a?.name ?? "", required: true },
  { name: "role", label: "Role", type: "text", value: a?.role ?? "", placeholder: "e.g. Property practitioner" },
  { name: "phone", label: "Phone", type: "tel", value: a?.phone ?? "" },
  { name: "email", label: "Email", type: "email", value: a?.email ?? "" },
  { name: "sortOrder", label: "Order", type: "number", value: String(a?.sortOrder ?? 0) },
  { name: "active", label: "Show on the website and allow assigning to listings", type: "checkbox", value: a?.active ?? true },
];

export default async function TeamPage({ searchParams }: PageProps<"/admin/team">) {
  await requireAdmin();
  const rows = await getDb().select().from(agents).orderBy(asc(agents.sortOrder), asc(agents.name));
  const sp = await searchParams;
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Team" description="Agents shown on the About page and on listings they are assigned to. Only add people who have agreed to be listed." />
      {sp.saved && <p role="status" className="mb-4 rounded-xl bg-success-wash p-4 text-sm text-success">Team member added.</p>}
      <div className="grid gap-4">
        {rows.map((a) => (
          <details key={a.id} className="card p-5">
            <summary className="cursor-pointer"><span className="font-semibold">{a.name}</span> <span className="text-sm text-stone">{a.role} {a.active ? "" : "· hidden"}</span></summary>
            <div className="mt-5 grid gap-4">
              <AdminForm action={saveAgent.bind(null, a.id)} fields={fields(a)} columns={2} />
              <ConfirmAction action={removeAgent.bind(null, a.id)} label="Remove" title={`Remove ${a.name}?`} body="Listings assigned to this person will show the ERE office instead." confirmLabel="Remove" buttonClassName="btn btn-sm justify-self-start text-red-ink hover:bg-red-wash" />
            </div>
          </details>
        ))}
        <section className="card p-6" aria-labelledby="new-a">
          <h2 id="new-a" className="heading mb-4 text-2xl">Add a team member</h2>
          <AdminForm action={saveAgent.bind(null, null)} fields={fields()} columns={2} submitLabel="Add" />
        </section>
      </div>
    </div>
  );
}
