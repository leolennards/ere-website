import Link from "next/link";
import { countPublicByDeal, getFeaturedProperties } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { getPublicStatuses } from "@/lib/server/site";
import { ArrowRightIcon, HomeIcon } from "../icons";
import { PropertyCard, PropertyCardSkeleton } from "../property/property-card";
import { SectionHeading } from "../ui/section-heading";

export async function FeaturedProperties() {
  const db = getDb();
  const statuses = await getPublicStatuses();
  const [featured, counts] = await Promise.all([getFeaturedProperties(db, statuses, 5), countPublicByDeal(db, statuses)]);
  const total = counts.sale + counts.rent;

  return (
    <FeaturedShell total={total}>
      {featured.length === 0 ? (
        <div className="reveal flex flex-col items-start gap-5 rounded-3xl border border-dashed border-mist bg-white/60 p-8 sm:flex-row sm:items-center sm:p-10">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-red-wash text-red-ink">
            <HomeIcon size={26} />
          </span>
          <div className="flex-1">
            <h3 className="heading text-2xl">New listings are being prepared</h3>
            <p className="mt-2 max-w-xl text-stone">
              Featured homes will appear here as soon as they are published. Tell us what you are looking for and we will
              let you know when something suitable comes up.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {total > 0 && (
              <Link href="/buy" className="btn btn-dark">
                View all listings
              </Link>
            )}
            <Link href="/contact?topic=buying" className="btn btn-outline">
              Tell us what you need
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:gap-6">
          <div className="reveal">
            <PropertyCard property={featured[0]} variant="feature" sizes="(min-width: 1024px) 58vw, 100vw" />
          </div>
          {featured.length > 1 && (
            <ul className={`grid gap-5 md:grid-cols-2 lg:gap-6 ${featured.length - 1 >= 3 ? "lg:grid-cols-3" : ""}`}>
              {featured.slice(1).map((p) => (
                <li key={p.id} className="reveal">
                  <PropertyCard property={p} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FeaturedShell>
  );
}

function FeaturedShell({ total, children }: { total?: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby="featured-title" className="py-20 lg:py-28">
      <div className="container-site">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between lg:mb-14">
          <SectionHeading id="featured-title" eyebrow="Featured properties" title={<>Homes worth<br className="hidden sm:block" /> a closer look</>} />
          {total != null && total > 0 && (
            <Link href="/buy" className="btn btn-outline shrink-0">
              Browse all properties <ArrowRightIcon size={18} />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function FeaturedPropertiesSkeleton() {
  return (
    <FeaturedShell>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading featured properties">
        {[0, 1, 2].map((i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </FeaturedShell>
  );
}
