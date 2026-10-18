import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { PageIntro, SectionHeading } from "@/components/ui/section-heading";
import { telLink } from "@/lib/contact-links";
import { listActiveAgents } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/server/site";
import aerial from "../../../../public/images/cape-town-city-bowl-aerial.webp";
import { unstable_rethrow } from "next/navigation";

export const metadata: Metadata = {
  title: "About ERE",
  description: "Elevate Real Estate (ERE) is a Parow-based estate agency that helps families buy and sell property across Cape Town, with clear communication at every step.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Service first",
    body: "For us, a sale is measured by how well our clients were looked after, not only by the commission earned.",
  },
  {
    title: "Communication is key",
    body: "Sellers, buyers, attorneys and banks all hear from us regularly, so nobody is left wondering what happens next.",
  },
  {
    title: "Step-by-step guidance",
    body: "Buying for the first time can be daunting. We explain each stage in plain language and make the process as easy to follow as we can.",
  },
];

async function People() {
  const s = await getSiteSettings();
  let team: Awaited<ReturnType<typeof listActiveAgents>> = [];
  try {
    team = await listActiveAgents(getDb());
  } catch (err) {
    unstable_rethrow(err);
    team = [];
  }
  const owner = s.about;
  if (!owner.ownerName && team.length === 0) return null;
  return (
    <section aria-labelledby="people-title" className="pb-20 lg:pb-28">
      <div className="container-site">
        <SectionHeading id="people-title" eyebrow="The people" title="Who you'll work with" />
        {owner.ownerName && (
          <div className="mt-10 grid gap-8 rounded-3xl border border-line bg-white p-8 lg:grid-cols-3 lg:p-12">
            <div>
              <p className="heading text-3xl">{owner.ownerName}</p>
              {owner.ownerRole && <p className="mt-1 text-stone">{owner.ownerRole}</p>}
            </div>
            {owner.ownerBio && <p className="whitespace-pre-line text-lg leading-relaxed lg:col-span-2">{owner.ownerBio}</p>}
          </div>
        )}
        {team.length > 0 && (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-white p-6">
                <p className="font-semibold">{a.name}</p>
                {a.role && <p className="text-sm text-stone">{a.role}</p>}
                {a.phone && (
                  <a href={telLink(a.phone)} className="link mt-3 inline-flex items-center gap-2 text-sm">
                    <PhoneIcon size={15} /> {a.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

async function Founded() {
  const year = (await getSiteSettings()).about.foundedYear;
  return year ? <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-stone">Established {year}</p> : null;
}

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About ERE"
        title={
          <>
            Elevate <span className="text-ere-red">Real Estate</span>
          </>
        }
        intro="ERE is an estate agency in Parow, Cape Town. We want to help families find the right home and to make buying or selling a smoother experience for everyone involved."
      >
        <Suspense>
          <Founded />
        </Suspense>
      </PageIntro>

      <section aria-labelledby="name-title" className="py-20 lg:py-28">
        <div className="container-site grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="flex aspect-square items-center justify-center rounded-3xl border border-line bg-white p-12">
              <Logo className="h-auto w-full max-w-sm" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <SectionHeading id="name-title" eyebrow="What ERE stands for" title="Elevate: to lift up" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                <strong>ERE</strong> stands for <strong>Elevate Real Estate</strong>. The name reflects what we set out to do: raise the standard of
                service people can expect when they buy or sell a home.
              </p>
              <p>
                We&apos;re involved every step of the way: from signing the mandate and starting the marketing, to finding a buyer, following bond
                approval and seeing the property through registration with the attorneys.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="on-dark bg-ink py-20 text-white lg:py-28">
        <div className="container-site">
          <SectionHeading id="values-title" eyebrow="Our approach" title="How we work" />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-3">
            {VALUES.map((v) => (
              <li key={v.title} className="reveal bg-ink-2 p-8 lg:p-10">
                <h3 className="heading text-2xl">{v.title}</h3>
                <p className="mt-3 text-mist">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="where-title" className="py-20 lg:py-28">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              id="where-title"
              eyebrow="Parow & Cape Town"
              title="A local office with a city-wide reach"
              intro="Our office is at 163B Market Street in Parow Valley. ERE works with buyers and sellers all around Cape Town and in the surrounding towns."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-dark">
                Visit or contact us <ArrowRightIcon size={18} />
              </Link>
              <Link href="/buy" className="btn btn-outline">
                View properties
              </Link>
            </div>
          </div>
          <div className="reveal relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={aerial} alt="Aerial view of Cape Town's suburbs" fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" className="object-cover" />
          </div>
        </div>
      </section>

      <Suspense>
        <People />
      </Suspense>
    </>
  );
}
