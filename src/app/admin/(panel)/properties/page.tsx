import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/property/status-badge";
import { pageParam, str } from "@/lib/admin-helpers";
import { requireAdmin } from "@/lib/auth/session";
import { adminListProperties } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { listingStatus } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Properties" };
export const instant = false;

export default async function AdminProperties({ searchParams }: PageProps<"/admin/properties">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = str(sp.q);
  const status = listingStatus.enumValues.find((s) => s === sp.status);
  const deal = sp.deal === "sale" || sp.deal === "rent" ? sp.deal : undefined;
  const r = await adminListProperties(getDb(), { q, status, deal, page: pageParam(sp.page) });
  const qs = (page: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(deal ? { deal } : {}), page: String(page) })}`;

  return (
    <>
      <AdminHeader title="Properties" description={`${r.total} listing${r.total === 1 ? "" : "s"}`} actions={<Link href="/admin/properties/new" className="btn btn-primary btn-sm">New property</Link>} />
      {sp.deleted && <p role="status" className="mb-4 rounded-xl bg-success-wash p-4 text-sm text-success">Property deleted. Linked enquiries were kept.</p>}
      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]" role="search" aria-label="Filter properties">
        <label className="sr-only" htmlFor="pq">Search</label>
        <input id="pq" name="q" defaultValue={q} placeholder="Search title, reference or suburb" className="input" />
        <label className="sr-only" htmlFor="ps">Status</label>
        <select id="ps" name="status" defaultValue={status ?? ""} className="select">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="sr-only" htmlFor="pd">Transaction</label>
        <select id="pd" name="deal" defaultValue={deal ?? ""} className="select">
          <option value="">Sale & rent</option>
          <option value="sale">For sale</option>
          <option value="rent">To rent</option>
        </select>
        <button className="btn btn-dark">Filter</button>
      </form>

      {r.items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="heading text-2xl">No properties found</p>
          <p className="mt-2 text-stone">{q || status || deal ? "Try clearing the filters." : "Create your first listing to get started."}</p>
          <Link href="/admin/properties/new" className="btn btn-primary mt-6">New property</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Property listings</caption>
            <thead className="border-b border-line bg-bone/60 text-xs uppercase tracking-wider text-stone">
              <tr>
                <th scope="col" className="p-3">Listing</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Price</th>
                <th scope="col" className="p-3">Suburb</th>
                <th scope="col" className="p-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {r.items.map((p) => (
                <tr key={p.id} className="hover:bg-bone/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.cover ? <img src={p.cover.urls["480"]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" /> : <span className="h-12 w-16 shrink-0 rounded-lg bg-sand" />}
                      <span>
                        <Link href={`/admin/properties/${p.id}`} className="font-semibold hover:text-red-ink">{p.title}</Link>
                        <span className="block font-mono text-xs text-stone">
                          {p.reference}
                          {p.featured && <span className="ml-2 font-sans text-red-ink">★ Featured</span>}
                          {p.isDemo && <span className="ml-2 font-sans">Demo</span>}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="p-3"><StatusBadge status={p.status} className="ring-1 ring-line" /></td>
                  <td className="whitespace-nowrap p-3">{formatPrice(p.price, p.transactionType)}</td>
                  <td className="p-3">{p.suburb}</td>
                  <td className="whitespace-nowrap p-3 text-stone">{formatDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {r.page > 1 ? <Link href={qs(r.page - 1)} className="btn btn-outline btn-sm">Previous</Link> : <span />}
          <span>Page {r.page} of {r.pageCount}</span>
          {r.page < r.pageCount ? <Link href={qs(r.page + 1)} className="btn btn-outline btn-sm">Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}
