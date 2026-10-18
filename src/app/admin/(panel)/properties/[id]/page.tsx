import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changePropertyStatus, removeProperty, saveProperty } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-shell";
import { ImageManager } from "@/components/admin/image-manager";
import { ConfirmAction, PendingButton } from "@/components/admin/kit";
import { PropertyForm } from "@/components/admin/property-form";
import { ExternalIcon } from "@/components/icons";
import { StatusBadge } from "@/components/property/status-badge";
import { toFormValues } from "@/lib/admin-helpers";
import { requireAdmin } from "@/lib/auth/session";
import { getPropertyForEdit, listActiveAgents } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import type { ListingStatus } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/server/site";
import { publicStatuses } from "@/lib/settings";

export const metadata: Metadata = { title: "Edit property" };
export const instant = false;

function QuickStatus({ id, to, label, primary }: { id: string; to: ListingStatus; label: string; primary?: boolean }) {
  return (
    <form action={changePropertyStatus.bind(null, id, to)}>
      <PendingButton className={`btn btn-sm ${primary ? "btn-primary" : "btn-outline"}`} pendingText="Updating…">{label}</PendingButton>
    </form>
  );
}

export default async function EditProperty({ params, searchParams }: PageProps<"/admin/properties/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getDb();
  const [data, agents, settings, sp] = await Promise.all([getPropertyForEdit(db, id), listActiveAgents(db), getSiteSettings(), searchParams]);
  if (!data) notFound();
  const { property: p, images } = data;
  const isPublic = (publicStatuses(settings.visibility) as string[]).includes(p.status);

  return (
    <div className="max-w-5xl">
      <Link href="/admin/properties" className="link text-sm">← All properties</Link>
      <AdminHeader
        title={p.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{p.reference}</span>
            <StatusBadge status={p.status} className="ring-1 ring-line" />
            <span className="text-sm">{isPublic ? "Visible on the website" : "Not visible to the public"}</span>
          </span>
        }
        actions={
          <>
            <Link href={`/admin/properties/${p.id}/preview`} className="btn btn-outline btn-sm">Preview</Link>
            {isPublic && <Link href={`/properties/${p.slug}`} target="_blank" className="btn btn-outline btn-sm">View live <ExternalIcon size={14} /></Link>}
          </>
        }
      />
      {sp.created && <p role="status" className="mb-6 rounded-xl bg-success-wash p-4 text-sm text-success">Listing created. Add photos below, then publish when it&apos;s ready.</p>}
      {sp.error === "confirm" && <p role="alert" className="mb-6 rounded-xl bg-red-wash p-4 text-sm text-red-deep">Type DELETE to confirm deletion.</p>}

      <section aria-label="Quick actions" className="card mb-6 flex flex-wrap items-center gap-2 p-4">
        <span className="mr-2 text-sm font-semibold">Quick actions:</span>
        {p.status === "draft" || p.status === "archived" ? <QuickStatus id={p.id} to="available" label="Publish" primary /> : <QuickStatus id={p.id} to="draft" label="Unpublish (draft)" />}
        {p.status !== "under_offer" && p.status !== "draft" && <QuickStatus id={p.id} to="under_offer" label="Under offer" />}
        {p.transactionType === "sale" ? p.status !== "sold" && <QuickStatus id={p.id} to="sold" label="Mark sold" /> : p.status !== "let" && <QuickStatus id={p.id} to="let" label="Mark let" />}
        {p.status !== "archived" && <QuickStatus id={p.id} to="archived" label="Archive" />}
      </section>

      <div className="grid gap-6">
        <ImageManager propertyId={p.id} images={images.map((i) => ({ id: i.id, thumb: i.urls["480"] ?? Object.values(i.urls)[0], alt: i.alt, width: i.width, height: i.height }))} />
        <PropertyForm action={saveProperty.bind(null, p.id)} initial={toFormValues(p)} agents={agents.map((a) => ({ id: a.id, name: a.name }))} isNew={false} />
        {me.role === "owner" && (
          <section className="card border-red-ink/30 p-6" aria-labelledby="danger">
            <h2 id="danger" className="heading text-xl text-red-ink">Delete listing</h2>
            <p className="mt-1 text-sm text-stone">Permanently removes the listing and its photos. Enquiries about it are kept. To take it off the website without deleting, use Archive instead.</p>
            <div className="mt-4">
              <ConfirmAction
                action={removeProperty.bind(null, p.id)}
                requireTyping
                label="Delete permanently…"
                title={`Delete ${p.reference}?`}
                body="This deletes the listing and all of its photos. It cannot be undone."
                confirmLabel="Delete listing"
                buttonClassName="btn btn-sm border border-red-ink text-red-ink hover:bg-red-wash"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
