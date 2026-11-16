"use client";

import { Suspense, use, useId, useState } from "react";
import { formatZarShort } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, RENT_PRICE_STEPS, SALE_PRICE_STEPS } from "@/lib/listing-options";
import { SearchIcon } from "../icons";

function SuburbOptions({ suburbs }: { suburbs: Promise<string[]> }) {
  return use(suburbs).map((s) => <option key={s} value={s} />);
}

/**
 * Homepage search. A plain GET form, so it also works without JavaScript.
 * Only the suburb suggestions wait for data: the form itself mounts once, so
 * anything typed while the suggestions load is kept.
 */
export function SearchPanel({ suburbs }: { suburbs: Promise<string[]> }) {
  const [deal, setDeal] = useState<"sale" | "rent">("sale");
  const id = useId();
  const steps = deal === "sale" ? SALE_PRICE_STEPS : RENT_PRICE_STEPS;

  return (
    <form action="/search" method="get" role="search" aria-label="Find a property" className="rounded-[1.25rem] bg-white p-3 text-ink shadow-[var(--shadow-lift)] sm:p-4">
      <fieldset className="mb-3 flex gap-1 rounded-full bg-bone p-1 sm:inline-flex">
        <legend className="sr-only">I want to</legend>
        {(
          [
            ["sale", "Buy"],
            ["rent", "Rent"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="relative flex-1 cursor-pointer sm:flex-none">
            <input
              type="radio"
              name="deal"
              value={value}
              checked={deal === value}
              onChange={() => setDeal(value)}
              className="peer sr-only"
            />
            <span className="block rounded-full px-6 py-2 text-center text-sm font-semibold text-stone transition-colors peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-ink">
              {label}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto]">
        <div>
          <label htmlFor={`${id}-q`} className="sr-only">
            Suburb or area
          </label>
          <input id={`${id}-q`} name="q" list={`${id}-suburbs`} placeholder="Suburb or area, e.g. Parow" className="input border-transparent bg-bone" autoComplete="off" />
          <datalist id={`${id}-suburbs`}>
            <Suspense fallback={null}>
              <SuburbOptions suburbs={suburbs} />
            </Suspense>
          </datalist>
        </div>
        <div>
          <label htmlFor={`${id}-type`} className="sr-only">
            Property type
          </label>
          <select id={`${id}-type`} name="type" className="select border-transparent bg-bone" defaultValue="">
            <option value="">Any type</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-max`} className="sr-only">
            Maximum price
          </label>
          <select key={deal} id={`${id}-max`} name="maxPrice" className="select border-transparent bg-bone" defaultValue="">
            <option value="">Any price</option>
            {steps.map((s) => (
              <option key={s} value={s}>
                Up to {formatZarShort(s)}
                {deal === "rent" ? " pm" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-beds`} className="sr-only">
            Minimum bedrooms
          </label>
          <select id={`${id}-beds`} name="beds" className="select border-transparent bg-bone" defaultValue="">
            <option value="">Any beds</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ beds
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary h-full min-h-12 sm:col-span-2 lg:col-span-1">
          <SearchIcon size={18} />
          Search
        </button>
      </div>
    </form>
  );
}
