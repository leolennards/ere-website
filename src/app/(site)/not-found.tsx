import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-site flex min-h-[70vh] flex-col items-start justify-center pb-20 pt-36">
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-5 text-6xl sm:text-8xl">This page has moved on</h1>
      <p className="mt-5 max-w-lg text-lg text-stone">
        The page or listing you were looking for isn&apos;t available. It may have been sold, let or removed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/buy" className="btn btn-primary">
          Browse properties
        </Link>
        <Link href="/contact" className="btn btn-outline">
          Contact ERE
        </Link>
      </div>
    </section>
  );
}
