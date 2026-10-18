import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { addNote, removeEnquiry, saveEnquiry } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/admin-shell";
import { ConfirmAction } from "@/components/admin/kit";
import { requireAdmin } from "@/lib/auth/session";
import { telLink, whatsappLink } from "@/lib/contact-links";
import { getEnquiry, markEnquiryRead } from "@/lib/data/enquiries";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Enquiry" };
export const instant = false;

const DETAIL_LABELS: Record<string, string> = {
  address: "Property address / suburb",
  propertyType: "Property type",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  sizeM2: "Approximate size (m²)",
  condition: "Condition / notes",
  topic: "Topic",
};

export default async function EnquiryDetail({ params, searchParams }: PageProps<"/admin/enquiries/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getDb();
  const data = await getEnquiry(db, id);
  if (!data) notFound();
  await markEnquiryRead(db, id);
  const sp = await searchParams;
  const { enquiry: e, notes, property } = data;
  const team = await db.select({ id: admins.id, name: admins.name }).from(admins).where(eq(admins.status, "active")).orderBy(asc(admins.name));
  const details = Object.entries(e.details ?? {}).filter(([, v]) => v != null && v !== "");
  const followUp = e.followUpAt ? new Date(e.followUpAt).toISOString().slice(0, 10) : "";

  return (
    <div className="max-w-5xl">
      <Link href="/admin/enquiries" className="link text-sm">← All enquiries</Link>
      <AdminHeader title={e.name} description={<span><span className="font-mono">{e.reference}</span> · {ENQUIRY_TYPE_LABELS[e.type]} · received {formatDateTime(e.createdAt)}</span>} />
      {sp.error === "confirm" && <p role="alert" className="mb-6 rounded-xl bg-red-wash p-4 text-sm text-red-deep">Type DELETE to confirm deletion.</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-6 lg:col-span-2">
          <section className="card p-6" aria-labelledby="contact-h">
            <h2 id="contact-h" className="heading text-2xl">Contact details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-stone">Phone</dt><dd><a href={telLink(e.phone)} className="link">{e.phone}</a></dd></div>
              <div><dt className="text-sm text-stone">Email</dt><dd>{e.email ? <a href={`mailto:${e.email}`} className="link break-all">{e.email}</a> : "Not given"}</dd></div>
              <div><dt className="text-sm text-stone">Prefers</dt><dd className="capitalize">{e.preferredContact}</dd></div>
              <div><dt className="text-sm text-stone">Marketing consent</dt><dd>{e.marketingConsent ? "Yes — opted in" : "No"}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={telLink(e.phone)} className="btn btn-dark btn-sm">Call</a>
              <a href={whatsappLink(e.phone, `Hi ${e.name.split(" ")[0]}, this is Elevate Real Estate regarding your enquiry ${e.reference}.`)} target="_blank" rel="noopener" className="btn btn-whatsapp btn-sm">WhatsApp</a>
              {e.email && <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry ${e.reference}`)}`} className="btn btn-outline btn-sm">Email</a>}
            </div>
          </section>

          <section className="card p-6" aria-labelledby="msg-h">
            <h2 id="msg-h" className="heading text-2xl">Enquiry</h2>
            {e.propertyReference && (
              <p className="mt-3 text-sm">
                About <strong className="font-mono">{e.propertyReference}</strong> — {e.propertyTitle}
                {property ? <> · <Link href={`/admin/properties/${property.id}`} className="link">open listing</Link></> : <span className="text-stone"> (listing since deleted)</span>}
              </p>
            )}
            {details.length > 0 && (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {details.map(([k, v]) => (
                  <div key={k}><dt className="text-sm text-stone">{DETAIL_LABELS[k] ?? k}</dt><dd className="whitespace-pre-line">{String(v)}</dd></div>
                ))}
              </dl>
            )}
            <p className="mt-4 whitespace-pre-line rounded-xl bg-bone p-4">{e.message || <span className="text-stone">No message.</span>}</p>
            <p className="mt-3 text-xs text-stone">Privacy notice ({e.privacyNoticeVersion}) acknowledged {formatDateTime(e.privacyAcceptedAt)}.</p>
          </section>

          <section className="card p-6" aria-labelledby="notes-h">
            <h2 id="notes-h" className="heading text-2xl">Internal notes</h2>
            {notes.length === 0 ? <p className="mt-3 text-sm text-stone">No notes yet. Notes are only visible to ERE staff.</p> : (
              <ol className="mt-4 grid gap-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-bone p-4">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="mt-2 text-xs text-stone">{n.authorName} · {formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-5">
              <AdminForm action={addNote.bind(null, e.id)} submitLabel="Add note" resetOnSuccess fields={[{ name: "body", label: "New note", type: "textarea", rows: 3, placeholder: "e.g. Called, arranged viewing for Saturday 10:00" }]} />
            </div>
          </section>
        </div>

        <div className="grid content-start gap-6">
          <section className="card p-6" aria-labelledby="status-h">
            <h2 id="status-h" className="heading text-2xl">Follow-up</h2>
            <div className="mt-4">
              <AdminForm
                action={saveEnquiry.bind(null, e.id)}
                submitLabel="Update"
                fields={[
                  { name: "status", label: "Status", type: "select", value: e.status, options: Object.entries(ENQUIRY_STATUS_LABELS) },
                  { name: "assignedTo", label: "Responsible", type: "select", value: e.assignedTo ?? "", options: [["", "Unassigned"], ...team.map((t) => [t.id, t.name] as [string, string])] },
                  { name: "followUpAt", label: "Follow up on", type: "date", value: followUp },
                ]}
              />
            </div>
          </section>
          {me.role === "owner" && (
            <section className="card p-6" aria-labelledby="del-h">
              <h2 id="del-h" className="heading text-xl">Delete personal information</h2>
              <p className="mt-1 text-sm text-stone">Use this for POPIA deletion requests or when the retention period has passed.</p>
              <div className="mt-4">
                <ConfirmAction
                  action={removeEnquiry.bind(null, e.id)}
                  requireTyping
                  label="Delete enquiry…"
                  title={`Delete ${e.reference}?`}
                  body="The enquiry and its notes are permanently deleted. This can't be undone."
                  confirmLabel="Delete permanently"
                  buttonClassName="btn btn-sm border border-red-ink text-red-ink hover:bg-red-wash"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
