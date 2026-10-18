import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { createUser, setUserStatus } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/admin-shell";
import { PendingButton } from "@/components/admin/kit";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };
export const instant = false;

export default async function UsersPage() {
  const me = await requireAdmin({ owner: true });
  const rows = await getDb()
    .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role, status: admins.status, lastLoginAt: admins.lastLoginAt })
    .from(admins)
    .orderBy(asc(admins.name));
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Users" description="People who can sign in to this dashboard. Staff can manage listings and enquiries; only owners can change settings, delete records, export data and manage users." />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Administrator accounts</caption>
          <thead className="border-b border-line bg-bone/60 text-xs uppercase tracking-wider text-stone">
            <tr><th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Role</th><th scope="col" className="p-3">Last sign-in</th><th scope="col" className="p-3"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3"><span className="font-semibold">{u.name}</span><span className="block text-stone">{u.email}</span></td>
                <td className="p-3 capitalize">{u.role}{u.status === "disabled" && <span className="badge ml-2 bg-sand text-stone">Disabled</span>}</td>
                <td className="p-3 text-stone">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
                <td className="p-3 text-right">
                  {u.id !== me.id && (
                    <form action={setUserStatus.bind(null, u.id, u.status === "active" ? "disabled" : "active")}>
                      <PendingButton className="btn btn-outline btn-sm" pendingText="…">{u.status === "active" ? "Disable" : "Enable"}</PendingButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card mt-6 p-6" aria-labelledby="new-u">
        <h2 id="new-u" className="heading mb-4 text-2xl">Add a user</h2>
        <AdminForm
          action={createUser}
          columns={2}
          resetOnSuccess
          submitLabel="Create account"
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true, autoComplete: "off" },
            { name: "role", label: "Role", type: "select", value: "staff", options: [["staff", "Staff"], ["owner", "Owner"]] },
            { name: "password", label: "Temporary password", type: "password", required: true, autoComplete: "new-password", hint: "At least 12 characters. Ask them to change it after signing in." },
          ]}
        />
      </section>
    </div>
  );
}
