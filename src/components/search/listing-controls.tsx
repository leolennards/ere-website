"use client";

import { useRef } from "react";
import { CloseIcon, FilterIcon } from "../icons";

/** Opens the filter form in a slide-in drawer on small screens (native <dialog>: focus trap + Escape). */
export function FilterDrawer({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-outline btn-sm lg:hidden" aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        <FilterIcon size={17} />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-ink text-xs text-white">
            {activeCount}
            <span className="sr-only"> active</span>
          </span>
        )}
      </button>
      <dialog
        ref={ref}
        aria-label="Filter properties"
        className="drawer m-0 ml-auto h-dvh max-h-none w-full max-w-sm bg-bone p-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="heading text-2xl">Filters</h2>
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-full" aria-label="Close filters" onClick={() => ref.current?.close()}>
              <CloseIcon size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </dialog>
    </>
  );
}

/** Sort control: submits on change; a <noscript> button keeps it usable without JavaScript. */
export function SortSelect({
  basePath,
  hidden,
  value,
  options,
}: {
  basePath: string;
  hidden: Record<string, string>;
  value: string;
  options: Record<string, string>;
}) {
  return (
    <form action={basePath} method="get" className="flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="sort" className="text-sm text-stone">
        Sort
      </label>
      <select id="sort" name="sort" defaultValue={value} className="select min-h-10 w-auto py-1.5 text-sm" onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {Object.entries(options).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn btn-outline btn-sm">
          Apply
        </button>
      </noscript>
    </form>
  );
}
