import { asc, eq } from "drizzle-orm";
import { getRecentlySold } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { getPublicStatuses } from "@/lib/server/site";
import { PropertyCard } from "../property/property-card";
import { SectionHeading } from "../ui/section-heading";
import { unstable_rethrow } from "next/navigation";

/** Only genuine, consented testimonials are shown; the section is omitted when there are none. */
export async function Testimonials() {
  let rows: { id: string; quote: string; name: string; context: string }[] = [];
  try {
    rows = await getDb()
      .select({ id: testimonials.id, quote: testimonials.quote, name: testimonials.name, context: testimonials.context })
      .from(testimonials)
      .where(eq(testimonials.published, true))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt))
      .limit(6);
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
  if (!rows.length) return null;
  return (
    <section aria-labelledby="testimonials-title" className="py-20 lg:py-28">
      <div className="container-site">
        <SectionHeading id="testimonials-title" eyebrow="Client experiences" title="In our clients' words" />
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <li key={t.id} className="reveal">
              <figure className="flex h-full flex-col rounded-3xl border border-line bg-white p-7">
                <span aria-hidden="true" className="display text-7xl leading-[0.6] text-ere-red">
                  &ldquo;
                </span>
                <blockquote className="mt-4 flex-1 text-lg leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-6 border-t border-line pt-4">
                  <span className="block font-semibold">{t.name}</span>
                  {t.context && <span className="text-sm text-stone">{t.context}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Shown only when the owner enables sold/let listings in Admin → Settings. */
export async function RecentlySold() {
  let items: Awaited<ReturnType<typeof getRecentlySold>> = [];
  try {
    items = await getRecentlySold(getDb(), await getPublicStatuses());
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
  if (!items.length) return null;
  return (
    <section aria-labelledby="sold-title" className="pb-20 lg:pb-28">
      <div className="container-site">
        <SectionHeading id="sold-title" eyebrow="Recent results" title="Recently sold & let" />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id} className="reveal">
              <PropertyCard property={p} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
