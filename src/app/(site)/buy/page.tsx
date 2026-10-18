import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsSkeleton, ListingsView } from "@/components/search/listings-view";
import { PageIntro } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Properties for Sale in Cape Town",
  description: "Browse houses, apartments and townhouses for sale through Elevate Real Estate (ERE) in Parow and across Cape Town.",
  alternates: { canonical: "/buy" },
};

export default function BuyPage({ searchParams }: PageProps<"/buy">) {
  return (
    <>
      <PageIntro
        eyebrow="Buy"
        title="Properties for sale"
        intro="Homes currently listed with ERE in Parow and across Cape Town. Filter by area, budget and size. Every search can be bookmarked or shared."
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsView deal="sale" searchParams={searchParams} />
      </Suspense>
    </>
  );
}
