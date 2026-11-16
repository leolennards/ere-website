import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";
import { recentAudit } from "@/lib/data/audit";
import { enquiryCounts, listEnquiries } from "@/lib/data/enquiries";
import { demoPropertyCount, propertyCounts } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@/lib/listing-options";
import { emailConfigured } from "@/lib/server/email";
import { storageDriver } from "@/lib/server/storage";

export const instant = false;

function Stat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: "red" }) {
  return (
    <Link href={href} className="card group p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <p className="text-sm text-stone">{label}</p>
      <p className={`heading mt-2 text-5xl ${tone === "red" && value > 0 ? "text-red-ink" : ""}`}>{value}</p>
    </Link>
  );
}

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const me = await requireAdmin();
  const db = getDb();
  const [p, e, recent, activity, demos, sp] = await Promise.all([
    propertyCounts(db),
    enquiryCounts(db),
    listEnquiries(db, {}, 6),
    recentAudit(db, 8),
    demoPropertyCount(db),
    searchParams,
  ]);
  const checks = [
    { ok: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY), label: "Google Maps key", fix: "Maps show an “Open in Google Maps” link instead." },
    { ok: emailConfigured(), label: "Email notifications", fix: "New enquiries appear here but no email is sent." },
    { ok: storageDriver() === "vercel-blob" || !process.env.VERCEL, label: "Photo storage", fix: "Configure Vercel Blob before uploading photos in production." },
  ];
  return (
    <>
      <AdminHeader title={`Hello, ${me.name.split(" ")[0]}`} description="An overview of listings and enquiries." actions={<Link href="/admin/properties/new" className="btn btn-primary btn-sm">New property</Link>} />
      {sp.denied && <p role="alert" className="mb-6 rounded-xl bg-red-wash p-4 text-sm text-red-deep">That area is only available to the owner account.</p>}
      {demos > 0 && (
        <p role="note" className="mb-6 rounded-xl bg-warning-wash p-4 text-sm text-warning">
          There {demos === 1 ? "is 1 demo listing" : `are ${demos} demo listings`} in the database. Remove them before launch with <code>npm run db:clear-demo</code>.
        </p>
      )}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Published listings" value={p.published} href="/admin/properties?status=available" />
        <Stat label="Drafts" value={p.drafts} href="/admin/properties?status=draft" />
        <Stat label="Unread enquiries" value={e.unread} href="/admin/enquiries?unread=1" tone="red" />
        <Stat label="New (not yet contacted)" value={e.new} href="/admin/enquiries?status=new" tone="red" />
        <Stat label="Sold / let" value={p.closed} href="/admin/properties?status=sold" />
        <Stat label="Featured on homepage" value={p.featured} href="/admin/properties" />
        <Stat label="Open valuation requests" value={e.valuations} href="/admin/enquiries?type=valuation" />
        <Stat label="Follow-ups due" value={e.followUpsDue} href="/admin/enquiries" tone="red" />
      </section>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2" aria-labelledby="recent-enq">
          <div className="flex items-center justify-between">
            <h2 id="recent-enq" className="heading text-2xl">Latest enquiries</h2>
            <Link href="/admin/enquiries" className="link text-sm">View all</Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="mt-6 text-stone">No enquiries yet. They will appear here as soon as someone submits a form on the website.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.items.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/enquiries/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-red-ink">
                    <span>
                      <span className={r.readAt ? "" : "font-semibold"}>{r.name}</span>
                      <span className="ml-2 text-sm text-stone">{ENQUIRY_TYPE_LABELS[r.type]}{r.propertyReference ? ` · ${r.propertyReference}` : ""}</span>
                    </span>
                    <span className="text-sm text-stone">{ENQUIRY_STATUS_LABELS[r.status]} · {formatDateTime(r.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="grid gap-6">
          <section className="card p-6" aria-labelledby="setup">
            <h2 id="setup" className="heading text-2xl">Setup status</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {checks.map((c) => (
                <li key={c.label}>
                  <span className={`font-semibold ${c.ok ? "text-success" : "text-warning"}`}>{c.ok ? "✓" : "!"} {c.label}</span>
                  {!c.ok && <span className="block text-stone">{c.fix}</span>}
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-6" aria-labelledby="activity">
            <h2 id="activity" className="heading text-2xl">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-stone">Nothing yet.</p>
            ) : (
              <ul className="mt-4 grid gap-3 text-sm">
                {activity.map((a) => (
                  <li key={a.id}>
                    <span className="font-medium">{a.adminName || "System"}</span> <span className="text-stone">{a.action.replace(".", " ")}</span>
                    {a.summary && <span className="block text-stone">{a.summary}</span>}
                    <span className="block text-xs text-stone">{formatDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
