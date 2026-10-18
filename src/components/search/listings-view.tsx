import Link from "next/link";
import { getPublicSuburbs, searchPublicProperties } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { formatNumber, formatZarShort } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/listing-options";
import { activeFilterCount, filtersToQuery, parseSearchFilters, SORT_OPTIONS, type SearchFilters } from "@/lib/search-filters";
import { getPublicStatuses } from "@/lib/server/site";
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, SearchIcon } from "../icons";
import { PropertyCard, PropertyCardSkeleton } from "../property/property-card";
import { FilterDrawer, SortSelect } from "./listing-controls";
import { ListingFilterForm } from "./listing-filters";
import { unstable_rethrow } from "next/navigation";

type Params = Record<string, string | string[] | undefined>;

export async function ListingsView({ deal, searchParams }: { deal: "sale" | "rent"; searchParams: Promise<Params> }) {
  const basePath = deal === "sale" ? "/buy" : "/rent";
  const filters = parseSearchFilters(await searchParams);
  const db = getDb();

  let result: Awaited<ReturnType<typeof searchPublicProperties>>;
  let suburbs: string[];
  try {
    const statuses = await getPublicStatuses();
    [result, suburbs] = await Promise.all([searchPublicProperties(db, { deal, filters, statuses }), getPublicSuburbs(db, statuses)]);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[listings] query failed:", err instanceof Error ? err.message : err);
    return (
      <div className="container-site py-16">
        <div role="alert" className="flex items-start gap-4 rounded-2xl border border-red-ink/30 bg-red-wash p-6">
          <AlertIcon size={24} className="mt-0.5 shrink-0 text-red-ink" />
          <div>
            <h2 className="font-semibold">We couldn&apos;t load properties just now</h2>
            <p className="mt-1 text-stone">
              Please refresh the page in a moment, or <Link href="/contact" className="link">contact the ERE team</Link> directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const active = activeFilterCount(filters);
  const chips = filterChips(filters, deal);
  const hiddenForSort: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) if (v != null && k !== "sort" && k !== "page") hiddenForSort[k] = String(v);

  return (
    <div className="container-site grid gap-10 py-10 lg:grid-cols-12 lg:py-14">
      <aside className="hidden lg:col-span-4 lg:block xl:col-span-3" aria-label="Filters">
        <div className="sticky top-28 rounded-2xl border border-line bg-white/70 p-6">
          <h2 className="heading mb-5 text-2xl">Refine your search</h2>
          <ListingFilterForm idPrefix="desk" basePath={basePath} deal={deal} filters={filters} suburbs={suburbs} />
        </div>
      </aside>

      <section className="lg:col-span-8 xl:col-span-9" aria-labelledby="results-heading">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <h2 id="results-heading" className="font-semibold" aria-live="polite">
            {result.total === 0 ? "No properties found" : `${formatNumber(result.total)} ${result.total === 1 ? "property" : "properties"}`}
            {result.pageCount > 1 && <span className="font-normal text-stone"> · page {result.page} of {result.pageCount}</span>}
          </h2>
          <div className="flex items-center gap-3">
            <FilterDrawer activeCount={active}>
              <ListingFilterForm idPrefix="mob" basePath={basePath} deal={deal} filters={filters} suburbs={suburbs} />
            </FilterDrawer>
            <SortSelect basePath={basePath} hidden={hiddenForSort} value={filters.sort ?? "newest"} options={SORT_OPTIONS} />
          </div>
        </div>

        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((c) => (
              <li key={c.key}>
                <Link
                  href={`${basePath}${filtersToQuery(filters, { [c.key]: undefined, page: undefined })}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink py-1.5 pl-3.5 pr-2.5 text-sm text-white transition-colors hover:bg-red-ink"
                  aria-label={`Remove filter: ${c.label}`}
                >
                  {c.label}
                  <CloseIcon size={14} />
                </Link>
              </li>
            ))}
            <li>
              <Link href={basePath} className="link ml-1 text-sm">
                Clear all filters
              </Link>
            </li>
          </ul>
        )}

        {result.items.length === 0 ? (
          <EmptyResults deal={deal} filtered={active > 0} basePath={basePath} />
        ) : (
          <>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((p, i) => (
                <li key={p.id}>
                  <PropertyCard property={p} priority={i < 2} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" />
                </li>
              ))}
            </ul>
            <Pagination basePath={basePath} filters={filters} page={result.page} pageCount={result.pageCount} />
          </>
        )}
      </section>
    </div>
  );
}

function filterChips(f: SearchFilters, deal: "sale" | "rent") {
  const pm = deal === "rent" ? " pm" : "";
  const chips: { key: keyof SearchFilters; label: string }[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”` });
  if (f.type) chips.push({ key: "type", label: PROPERTY_TYPE_LABELS[f.type] });
  if (f.minPrice != null) chips.push({ key: "minPrice", label: `From ${formatZarShort(f.minPrice)}${pm}` });
  if (f.maxPrice != null) chips.push({ key: "maxPrice", label: `Up to ${formatZarShort(f.maxPrice)}${pm}` });
  if (f.beds != null) chips.push({ key: "beds", label: `${f.beds}+ beds` });
  if (f.baths != null) chips.push({ key: "baths", label: `${f.baths}+ baths` });
  if (f.parking != null) chips.push({ key: "parking", label: `${f.parking}+ parking` });
  return chips;
}

function EmptyResults({ deal, filtered, basePath }: { deal: "sale" | "rent"; filtered: boolean; basePath: string }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-mist bg-white/60 px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-red-wash text-red-ink">
        <SearchIcon size={26} />
      </span>
      <h3 className="heading mt-5 text-3xl">
        {filtered ? "No properties match these filters" : deal === "sale" ? "No properties for sale right now" : "No rentals available right now"}
      </h3>
      <p className="mt-3 max-w-md text-stone">
        {filtered
          ? "Try widening your price range or removing a filter. You can also tell us what you're looking for and we'll be in touch when something suitable is listed."
          : "New listings are added regularly. Tell us what you're looking for and an ERE agent will let you know when a suitable property becomes available."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {filtered && (
          <Link href={basePath} className="btn btn-dark">
            Clear all filters
          </Link>
        )}
        <Link href={`/contact?topic=${deal === "sale" ? "buying" : "renting"}`} className="btn btn-outline">
          Tell us what you need
        </Link>
      </div>
    </div>
  );
}

function Pagination({ basePath, filters, page, pageCount }: { basePath: string; filters: SearchFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => `${basePath}${filtersToQuery(filters, { page: p })}`;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-outline btn-sm" rel="prev">
          <ChevronLeftIcon size={16} /> Previous
        </Link>
      ) : null}
      <ul className="flex items-center gap-1">
        {pages.map((p, i) => (
          <li key={p} className="flex items-center gap-1">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-stone">…</span>}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              className="inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold hover:bg-sand aria-[current=page]:bg-ink aria-[current=page]:text-white"
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="btn btn-outline btn-sm" rel="next">
          Next <ChevronRightIcon size={16} />
        </Link>
      ) : null}
    </nav>
  );
}

export function ListingsSkeleton() {
  return (
    <div className="container-site grid gap-10 py-10 lg:grid-cols-12 lg:py-14" role="status" aria-label="Loading properties">
      <div className="skeleton hidden h-[36rem] lg:col-span-4 lg:block xl:col-span-3" />
      <div className="lg:col-span-8 xl:col-span-9">
        <div className="skeleton h-10 w-60" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
