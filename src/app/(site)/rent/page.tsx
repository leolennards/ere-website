import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsSkeleton, ListingsView } from "@/components/search/listings-view";
import { PageIntro } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Properties to Rent in Cape Town",
  description: "Rental properties available through Elevate Real Estate (ERE) in Parow and across Cape Town.",
  alternates: { canonical: "/rent" },
};

export default function RentPage({ searchParams }: PageProps<"/rent">) {
  return (
    <>
      <PageIntro
        eyebrow="Rent"
        title="Properties to rent"
        intro="Rental properties currently available through ERE. Monthly rentals are shown before deposits and other lease costs."
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsView deal="rent" searchParams={searchParams} />
      </Suspense>
    </>
  );
}
