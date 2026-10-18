import Link from "next/link";
import { formatZarShort } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, RENT_PRICE_STEPS, SALE_PRICE_STEPS } from "@/lib/listing-options";
import type { SearchFilters } from "@/lib/search-filters";

/** GET filter form — works without JavaScript and keeps every search shareable via the URL. */
export function ListingFilterForm({
  idPrefix,
  basePath,
  deal,
  filters,
  suburbs,
}: {
  idPrefix: string;
  basePath: string;
  deal: "sale" | "rent";
  filters: SearchFilters;
  suburbs: string[];
}) {
  const steps = deal === "sale" ? SALE_PRICE_STEPS : RENT_PRICE_STEPS;
  const id = (k: string) => `${idPrefix}-${k}`;
  const priceLabel = (n: number) => `${formatZarShort(n)}${deal === "rent" ? " pm" : ""}`;

  return (
    <form action={basePath} method="get" className="grid gap-5" aria-label="Filter properties">
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      <div>
        <label htmlFor={id("q")} className="label">
          Suburb or area
        </label>
        <input id={id("q")} name="q" defaultValue={filters.q ?? ""} list={id("suburbs")} className="input" placeholder="e.g. Parow" autoComplete="off" />
        <datalist id={id("suburbs")}>
          {suburbs.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <div>
        <label htmlFor={id("type")} className="label">
          Property type
        </label>
        <select id={id("type")} name="type" defaultValue={filters.type ?? ""} className="select">
          <option value="">Any type</option>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="label">Price{deal === "rent" ? " per month" : ""}</legend>
        <div>
          <label htmlFor={id("min")} className="sr-only">
            Minimum price
          </label>
          <select id={id("min")} name="minPrice" defaultValue={filters.minPrice?.toString() ?? ""} className="select">
            <option value="">No min</option>
            {steps.map((s) => (
              <option key={s} value={s}>
                {priceLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("max")} className="sr-only">
            Maximum price
          </label>
          <select id={id("max")} name="maxPrice" defaultValue={filters.maxPrice?.toString() ?? ""} className="select">
            <option value="">No max</option>
            {steps.map((s) => (
              <option key={s} value={s}>
                {priceLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      {(
        [
          ["beds", "Bedrooms", filters.beds],
          ["baths", "Bathrooms", filters.baths],
          ["parking", "Parking", filters.parking],
        ] as const
      ).map(([name, label, value]) => (
        <fieldset key={name}>
          <legend className="label">{label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {["", "1", "2", "3", "4", "5"].map((v) => (
              <label key={v} className="relative">
                <input type="radio" name={name} value={v} defaultChecked={(value?.toString() ?? "") === v} className="peer sr-only" />
                <span className="inline-flex h-10 min-w-12 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line bg-white px-3 text-sm font-medium transition-colors hover:border-mist peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-ink">
                  {v === "" ? "Any" : `${v}+`}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn btn-primary flex-1">
          Show results
        </button>
        <Link href={basePath} className="btn btn-outline">
          Clear
        </Link>
      </div>
    </form>
  );
}
