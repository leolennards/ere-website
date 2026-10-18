"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-site flex min-h-[70vh] flex-col items-start justify-center pb-20 pt-36" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-5 text-6xl sm:text-7xl">We couldn&apos;t load this page</h1>
      <p className="mt-5 max-w-lg text-lg text-stone">Please try again in a moment. If it keeps happening, call or WhatsApp the ERE office.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/contact" className="btn btn-outline">
          Contact ERE
        </Link>
      </div>
    </section>
  );
}
