import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/section-heading";
import credits from "@/content/photo-credits.json";

export const metadata: Metadata = {
  title: "Image Credits",
  description: "Credits and licences for photography used on the Elevate Real Estate website.",
  alternates: { canonical: "/credits" },
  robots: { index: false, follow: true },
};

export default function CreditsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Credits"
        title="Image credits"
        intro="General photographs of Cape Town on this website are used under the licences below. They illustrate the city and are not photographs of properties listed by ERE."
      />
      <div className="container-site py-14 lg:py-20">
        <ul className="grid max-w-3xl gap-4">
          {credits.map((c) => (
            <li key={c.file} className="rounded-2xl border border-line bg-white p-6">
              <p className="font-semibold">{c.title}</p>
              <p className="mt-1 text-sm text-stone">
                By {c.artist} · {"licenseUrl" in c && c.licenseUrl ? <a href={c.licenseUrl as string} className="link" target="_blank" rel="noopener">{c.license}</a> : c.license}
              </p>
              <p className="mt-1 text-sm text-stone">{c.changes}</p>
              <a href={c.page} className="link mt-2 inline-block text-sm" target="_blank" rel="noopener">
                Source
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl text-sm text-stone">
          Photographs of individual properties are supplied by ERE or the property owner. Photographs shown on demonstration listings during development are
          CC0 images from StockSnap.io and are not used on the live site.
        </p>
      </div>
    </>
  );
}
