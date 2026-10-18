import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { removeTestimonial, saveTestimonial } from "@/app/admin/actions";
import { AdminForm, type FieldSpec } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/admin-shell";
import { ConfirmAction } from "@/components/admin/kit";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { testimonials, type Testimonial } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Testimonials" };
export const instant = false;

const fields = (t?: Testimonial): FieldSpec[] => [
  { name: "quote", label: "Quote (client's own words)", type: "textarea", value: t?.quote ?? "", rows: 4, required: true },
  { name: "name", label: "Client name as they agreed it may appear", type: "text", value: t?.name ?? "", required: true, hint: "e.g. “Thandi M.”" },
  { name: "context", label: "Context", type: "text", value: t?.context ?? "", hint: "e.g. “Sold in Parow, 2025”" },
  { name: "sortOrder", label: "Order", type: "number", value: String(t?.sortOrder ?? 0) },
  { name: "consentConfirmed", label: "The client gave written permission to publish this", type: "checkbox", value: t?.consentConfirmed ?? false },
  { name: "published", label: "Publish on the website", type: "checkbox", value: t?.published ?? false, hint: "Requires the consent box above." },
];

export default async function TestimonialsPage({ searchParams }: PageProps<"/admin/testimonials">) {
  await requireAdmin();
  const rows = await getDb().select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));
  const sp = await searchParams;
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Testimonials" description="Only genuine testimonials with the client's written consent. The homepage section stays hidden until one is published." />
      {sp.saved && <p role="status" className="mb-4 rounded-xl bg-success-wash p-4 text-sm text-success">Testimonial added.</p>}
      <div className="grid gap-4">
        {rows.map((t) => (
          <details key={t.id} className="card p-5">
            <summary className="cursor-pointer">
              <span className="font-semibold">{t.name}</span> <span className="text-sm text-stone">— {t.published ? "Published" : "Not published"}</span>
              <span className="mt-1 block line-clamp-1 text-sm text-stone">“{t.quote}”</span>
            </summary>
            <div className="mt-5 grid gap-4">
              <AdminForm action={saveTestimonial.bind(null, t.id)} fields={fields(t)} />
              <ConfirmAction action={removeTestimonial.bind(null, t.id)} label="Delete" title="Delete this testimonial?" body="It will be removed from the website." confirmLabel="Delete" buttonClassName="btn btn-sm justify-self-start text-red-ink hover:bg-red-wash" />
            </div>
          </details>
        ))}
        <section className="card p-6" aria-labelledby="new-t">
          <h2 id="new-t" className="heading mb-4 text-2xl">Add a testimonial</h2>
          <AdminForm action={saveTestimonial.bind(null, null)} fields={fields()} submitLabel="Add testimonial" />
        </section>
      </div>
    </div>
  );
}
