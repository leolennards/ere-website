import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-shell";
import { pageParam, str } from "@/lib/admin-helpers";
import { requireAdmin } from "@/lib/auth/session";
import { listEnquiries } from "@/lib/data/enquiries";
import { getDb } from "@/lib/db";
import { enquiryStatus, enquiryType } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Enquiries" };
export const instant = false;

const STATUS_STYLE: Record<string, string> = {
  new: "bg-red-ink text-white",
  contacted: "bg-warning-wash text-warning",
  in_progress: "bg-sand text-ink",
  resolved: "bg-success-wash text-success",
};

function dateParam(v: string | string[] | undefined, endOfDay = false) {
  const s = str(v);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00+02:00`);
  if (endOfDay) d.setDate(d.getDate() + 1);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function AdminEnquiries({ searchParams }: PageProps<"/admin/enquiries">) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const f = {
    q: str(sp.q),
    type: enquiryType.enumValues.find((t) => t === sp.type),
    status: enquiryStatus.enumValues.find((s) => s === sp.status),
    unread: sp.unread === "1",
    from: dateParam(sp.from),
    to: dateParam(sp.to, true),
    page: pageParam(sp.page),
  };
  const r = await listEnquiries(getDb(), f);
  const base = new URLSearchParams();
  for (const k of ["q", "type", "status", "unread", "from", "to"] as const) {
    const v = str(sp[k]);
    if (v) base.set(k, v);
  }
  const pageHref = (p: number) => `?${new URLSearchParams({ ...Object.fromEntries(base), page: String(p) })}`;

  return (
    <>
      <AdminHeader
        title="Enquiries"
        description={`${r.total} matching`}
        actions={me.role === "owner" && r.total > 0 ? <a href={`/api/admin/enquiries/export?${base}`} className="btn btn-outline btn-sm">Export CSV</a> : undefined}
      />
      {sp.deleted && <p role="status" className="mb-4 rounded-xl bg-success-wash p-4 text-sm text-success">Enquiry permanently deleted.</p>}
      <form className="card mb-6 grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto]" role="search" aria-label="Filter enquiries">
        <div><label htmlFor="eq" className="sr-only">Search</label><input id="eq" name="q" defaultValue={f.q} placeholder="Name, phone, email or reference" className="input" /></div>
        <div>
          <label htmlFor="et" className="sr-only">Type</label>
          <select id="et" name="type" defaultValue={f.type ?? ""} className="select">
            <option value="">All types</option>
            {Object.entries(ENQUIRY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="es" className="sr-only">Status</label>
          <select id="es" name="status" defaultValue={f.status ?? ""} className="select">
            <option value="">All statuses</option>
            {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div><label htmlFor="ef" className="sr-only">From date</label><input id="ef" type="date" name="from" defaultValue={str(sp.from)} className="input" aria-label="From date" /></div>
        <div><label htmlFor="eto" className="sr-only">To date</label><input id="eto" type="date" name="to" defaultValue={str(sp.to)} className="input" aria-label="To date" /></div>
        <div className="flex gap-2"><button className="btn btn-dark">Filter</button><Link href="/admin/enquiries" className="btn btn-outline">Reset</Link></div>
      </form>

      {r.items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="heading text-2xl">No enquiries {base.toString() ? "match these filters" : "yet"}</p>
          <p className="mt-2 text-stone">Website enquiries, valuation requests and contact messages appear here.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Enquiries</caption>
            <thead className="border-b border-line bg-bone/60 text-xs uppercase tracking-wider text-stone">
              <tr>
                <th scope="col" className="p-3">From</th>
                <th scope="col" className="p-3">Type</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Assigned</th>
                <th scope="col" className="p-3">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {r.items.map((e) => (
                <tr key={e.id} className="hover:bg-bone/50">
                  <td className="p-3">
                    <Link href={`/admin/enquiries/${e.id}`} className={`hover:text-red-ink ${e.readAt ? "" : "font-bold"}`}>
                      {!e.readAt && <span className="mr-2 inline-block size-2 rounded-full bg-ere-red align-middle" aria-hidden="true" />}
                      {e.name}
                      {!e.readAt && <span className="sr-only"> (unread)</span>}
                    </Link>
                    <span className="block font-mono text-xs text-stone">{e.reference}</span>
                  </td>
                  <td className="p-3">{ENQUIRY_TYPE_LABELS[e.type]}{e.propertyReference && <span className="block font-mono text-xs text-stone">{e.propertyReference}</span>}</td>
                  <td className="p-3"><span className={`badge ${STATUS_STYLE[e.status]}`}>{ENQUIRY_STATUS_LABELS[e.status]}</span></td>
                  <td className="p-3 text-stone">{e.assigneeName ?? "—"}</td>
                  <td className="whitespace-nowrap p-3 text-stone">{formatDateTime(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {r.page > 1 ? <Link href={pageHref(r.page - 1)} className="btn btn-outline btn-sm">Previous</Link> : <span />}
          <span>Page {r.page} of {r.pageCount}</span>
          {r.page < r.pageCount ? <Link href={pageHref(r.page + 1)} className="btn btn-outline btn-sm">Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}
