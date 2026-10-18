import Image from "next/image";
import Link from "next/link";
import { getPublicSuburbs } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { getPublicStatuses, getSiteSettings } from "@/lib/server/site";
import aerial from "../../../public/images/cape-town-city-bowl-aerial.webp";
import { ArrowRightIcon, PinIcon } from "../icons";
import { SectionHeading } from "../ui/section-heading";
import { unstable_rethrow } from "next/navigation";

export async function Areas() {
  const [settings, statuses] = await Promise.all([getSiteSettings(), getPublicStatuses()]);
  let listingSuburbs: string[] = [];
  try {
    listingSuburbs = await getPublicSuburbs(getDb(), statuses);
  } catch (err) {
    unstable_rethrow(err);
    listingSuburbs = [];
  }
  const served = settings.about.areasServed;
  return <AreasView served={served} listingSuburbs={listingSuburbs} />;
}

export function AreasView({ served, listingSuburbs }: { served: string[]; listingSuburbs: string[] }) {
  return (
    <section aria-labelledby="areas-title" className="py-20 lg:py-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="relative lg:col-span-7">
          <div className="reveal relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-[5/4]">
            <Image src={aerial} alt="Aerial view over Cape Town's suburbs towards the harbour" fill sizes="(min-width: 1024px) 58vw, 100vw" placeholder="blur" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-lift)] sm:left-auto sm:right-6 sm:max-w-xs">
            <p className="flex items-start gap-3 text-sm">
              <PinIcon size={20} className="mt-0.5 shrink-0 text-red-ink" />
              <span>
                <span className="block font-semibold">ERE office</span>
                163B Market Street, Parow Valley, Cape Town
              </span>
            </p>
          </div>
        </div>
        <div className="lg:col-span-5">
          <SectionHeading
            id="areas-title"
            eyebrow="Where we work"
            title="Parow-based. Cape Town-wide."
            intro="Our office is in Parow, and ERE works all around Cape Town and in the surrounding towns. If you're unsure whether we cover your area, just ask."
          />
          {served.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone">Areas we serve</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {served.map((s) => (
                  <li key={s} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {listingSuburbs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone">Currently listing in</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {listingSuburbs.map((s) => (
                  <li key={s}>
                    <Link href={`/buy?q=${encodeURIComponent(s)}`} className="inline-block rounded-full bg-ink px-3.5 py-1.5 text-sm text-white transition-colors hover:bg-red-ink">
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/contact?topic=area" className="btn btn-dark mt-10">
            Ask about your area <ArrowRightIcon size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
