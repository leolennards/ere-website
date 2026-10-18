import type { Metadata } from "next";
import { Suspense } from "react";
import { Areas, AreasView } from "@/components/home/areas";
import { FeaturedProperties, FeaturedPropertiesSkeleton } from "@/components/home/featured";
import { Hero } from "@/components/home/hero";
import { Process } from "@/components/home/process";
import { RecentlySold, Testimonials } from "@/components/home/proof";
import { SellCta } from "@/components/home/sell-cta";
import { ToolsBand } from "@/components/home/tools-band";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { getSiteSettings } from "@/lib/server/site";
import { DEFAULT_SETTINGS, publicContact } from "@/lib/settings";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

async function ToolsBandWithContact() {
  return <ToolsBand contact={publicContact(await getSiteSettings())} />;
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<FeaturedPropertiesSkeleton />}>
        <FeaturedProperties />
      </Suspense>
      <Process />
      <Suspense fallback={<AreasView served={[]} listingSuburbs={[]} />}>
        <Areas />
      </Suspense>
      <SellCta />
      <Suspense>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<ToolsBand contact={publicContact(DEFAULT_SETTINGS)} />}>
        <ToolsBandWithContact />
      </Suspense>
      <Suspense>
        <RecentlySold />
      </Suspense>
      <Suspense>
        <OrganizationJsonLd />
      </Suspense>
    </>
  );
}
