import Link from "next/link";
import type { PropertyCardDTO } from "@/lib/data/properties";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/listing-options";
import { ArrowRightIcon } from "../icons";
import { PropertyFactsInline } from "./property-facts";
import { PropertyImage } from "./property-image";
import { StatusBadge } from "./status-badge";

export function PropertyCard({
  property: p,
  variant = "default",
  sizes = "(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw",
  priority,
}: {
  property: PropertyCardDTO;
  variant?: "default" | "feature";
  sizes?: string;
  priority?: boolean;
}) {
  const feature = variant === "feature";
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden ${feature ? "lg:flex-row" : ""} rounded-2xl border border-line bg-white transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-mist hover:shadow-[var(--shadow-lift)] focus-within:shadow-[var(--shadow-lift)]`}>
      <div className={`relative overflow-hidden bg-sand ${feature ? "aspect-[4/3] lg:aspect-auto lg:min-h-[32rem] lg:w-7/12" : "aspect-[4/3]"}`}>
        <PropertyImage
          image={p.cover}
          sizes={sizes}
          priority={priority}
          className="absolute inset-0 size-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <StatusBadge status={p.status} deal={p.transactionType} />
          {p.isDemo && <span className="badge bg-ink text-white">Demo listing</span>}
        </div>
      </div>
      <div className={`flex flex-1 flex-col gap-3 p-5 ${feature ? "lg:justify-center lg:gap-4 lg:p-10" : ""}`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className={`heading text-ink ${feature ? "text-3xl lg:text-5xl" : "text-2xl"}`}>{formatPrice(p.price, p.transactionType)}</p>
          <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-stone">{PROPERTY_TYPE_LABELS[p.propertyType]}</p>
        </div>
        <h3 className={`font-semibold leading-snug ${feature ? "text-xl lg:text-2xl" : "text-lg"}`}>
          <Link href={`/properties/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {p.title}
          </Link>
        </h3>
        <p className="text-sm text-stone">
          {p.suburb}, {p.city}
        </p>
        <div className={`flex items-end justify-between gap-3 border-t border-line pt-4 ${feature ? "mt-auto lg:mt-4" : "mt-auto"}`}>
          <PropertyFactsInline property={p} />
          <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-bone text-ink transition-colors duration-300 group-hover:bg-red-ink group-hover:text-white">
            <ArrowRightIcon size={18} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white" aria-hidden="true">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-7 w-2/5" />
        <div className="skeleton h-5 w-4/5" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  );
}
