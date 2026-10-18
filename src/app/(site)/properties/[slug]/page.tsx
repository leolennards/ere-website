import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache, Suspense } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyDetail } from "@/components/property/property-detail";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicPropertyBySlug, getRelatedProperties, type PropertyDetailDTO } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/listing-options";
import { getPublicStatuses, getSiteSettings } from "@/lib/server/site";
import { publicContact } from "@/lib/settings";

// The listing is looked up before anything streams so a missing listing
// returns a real 404 and a renamed one a real 308 redirect.
export const instant = false;

const lookup = cache(async (slug: string) => getPublicPropertyBySlug(getDb(), slug, await getPublicStatuses()));

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await lookup(slug);
  if (r.kind !== "found") return { title: "Property not found", robots: { index: false } };
  const p = r.property;
  const price = formatPrice(p.price, p.transactionType).replace(/\s/g, " ");
  const description = `${PROPERTY_TYPE_LABELS[p.propertyType]} ${p.transactionType === "sale" ? "for sale" : "to rent"} in ${p.suburb}, ${p.city}. ${price}. Ref ${p.reference}. ${p.description.replace(/^DEMONSTRATION LISTING[^\n]*\n+/, "").slice(0, 110)}`.trim();
  const image = p.cover?.urls["1600"] ?? p.cover?.urls["960"];
  return {
    title: `${p.title}, ${p.suburb}`,
    description: description.slice(0, 160),
    alternates: { canonical: `/properties/${p.slug}` },
    robots: p.isDemo ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: `${p.title} — ${price}`,
      description: description.slice(0, 200),
      images: image ? [{ url: image, width: p.cover!.width, height: p.cover!.height, alt: p.cover!.alt }] : undefined,
    },
  };
}

async function Related({ p }: { p: PropertyDetailDTO }) {
  const items = await getRelatedProperties(getDb(), p, await getPublicStatuses());
  if (!items.length) return null;
  return (
    <section aria-labelledby="related-title" className="container-site mt-24">
      <SectionHeading id="related-title" eyebrow="You may also like" title="Similar properties" />
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <li key={r.id}>
            <PropertyCard property={r} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const r = await lookup(slug);
  if (r.kind === "redirect") permanentRedirect(`/properties/${r.slug}`);
  if (r.kind === "missing") notFound();
  const p = r.property;
  const contact = publicContact(await getSiteSettings());
  return (
    <>
      <PropertyDetail
        p={p}
        contact={contact}
        related={
          <Suspense>
            <Related p={p} />
          </Suspense>
        }
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: p.transactionType === "sale" ? "Buy" : "Rent", path: p.transactionType === "sale" ? "/buy" : "/rent" },
          { name: p.title, path: `/properties/${p.slug}` },
        ]}
      />
    </>
  );
}
