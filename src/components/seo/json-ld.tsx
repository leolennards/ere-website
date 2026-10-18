import { SITE_URL } from "@/config/business";
import { getSiteSettings } from "@/lib/server/site";
import { publicContact } from "@/lib/settings";

export function JsonLd({ data }: { data: object }) {
  // Escape "<" so user-entered text can never close the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Local-business data built only from verified settings — no ratings or reviews. */
export async function OrganizationJsonLd() {
  const c = publicContact(await getSiteSettings());
  const sameAs = [c.social.facebook, c.social.instagram, c.social.linkedin].filter(Boolean);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": `${SITE_URL}/#organization`,
        name: c.name,
        alternateName: "ERE",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/ere-logo.png`,
        image: `${SITE_URL}/brand/ere-logo.png`,
        telephone: c.phoneE164,
        ...(c.email ? { email: c.email } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress: c.streetAddress,
          addressLocality: c.suburb,
          addressRegion: "Western Cape",
          postalCode: c.postalCode,
          addressCountry: "ZA",
        },
        areaServed: { "@type": "City", name: "Cape Town" },
        ...(sameAs.length ? { sameAs } : {}),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
      }}
    />
  );
}
