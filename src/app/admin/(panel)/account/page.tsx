import type { Metadata } from "next";
import { changeOwnPassword } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My account" };
export const instant = false;

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <div className="max-w-xl">
      <AdminHeader title="My account" description={`${me.name} · ${me.email}`} />
      <section className="card p-6" aria-labelledby="pw">
        <h2 id="pw" className="heading mb-4 text-2xl">Change password</h2>
        <AdminForm
          action={changeOwnPassword}
          resetOnSuccess
          submitLabel="Change password"
          fields={[
            { name: "current", label: "Current password", type: "password", required: true, autoComplete: "current-password" },
            { name: "next", label: "New password", type: "password", required: true, autoComplete: "new-password", hint: "At least 12 characters. A short phrase is easy to remember and hard to guess." },
            { name: "confirm", label: "Repeat new password", type: "password", required: true, autoComplete: "new-password" },
          ]}
        />
      </section>
    </div>
  );
}
