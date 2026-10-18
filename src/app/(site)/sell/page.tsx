import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { PageIntro, SectionHeading } from "@/components/ui/section-heading";
import street from "../../../../public/images/cape-town-kloof-nek.webp";

export const metadata: Metadata = {
  title: "Sell Your Property in Cape Town",
  description: "Selling with Elevate Real Estate (ERE): how the process works, from mandate and marketing to bond approval and registration, and how to request a valuation.",
  alternates: { canonical: "/sell" },
};

const STAGES = [
  { title: "Valuation", body: "An ERE agent visits the property, discusses your plans and gives you their view of its current market value." },
  { title: "Mandate", body: "When you're ready, you sign a mandate. We agree the asking price and how the property will be presented." },
  { title: "Marketing", body: "Your property is photographed, listed and marketed. Enquiries and viewings are handled for you." },
  { title: "Offer to purchase", body: "We present offers, explain the conditions in each one and keep you informed until an offer is accepted." },
  { title: "Bond approval", body: "If the buyer needs finance, we follow the bond application with them until it is approved." },
  { title: "Transfer & registration", body: "We work with the conveyancing attorneys until the property is registered in the buyer's name." },
];

const PREPARE = [
  "Your ID document and contact details for all registered owners",
  "A copy of the title deed, if you have one (the attorneys can obtain it)",
  "Your latest municipal rates account and, for sectional title, levy statements",
  "Approved building plans for any alterations, if available",
  "Compliance certificates the conveyancer may require, such as an electrical certificate of compliance",
];

export default function SellPage() {
  return (
    <>
      <PageIntro
        eyebrow="Sell your property"
        title={
          <>
            Selling, explained <span className="text-ere-red">step by step</span>
          </>
        }
        intro="Selling a home is a big decision. ERE stays involved from the first valuation to the day the property is registered, and explains each stage along the way."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/valuation" className="btn btn-primary">
            Request a valuation <ArrowRightIcon size={18} />
          </Link>
          <Link href="/contact?topic=selling" className="btn btn-outline">
            Ask a question first
          </Link>
        </div>
      </PageIntro>

      <section aria-labelledby="stages-title" className="py-20 lg:py-28">
        <div className="container-site">
          <SectionHeading id="stages-title" eyebrow="The process" title="From valuation to registration" />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s, i) => (
              <li key={s.title} className="reveal bg-white p-7 lg:p-9">
                <span aria-hidden="true" className="display text-6xl text-ere-red">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-xl font-semibold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-stone">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="prepare-title" className="pb-20 lg:pb-28">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="reveal relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={street} alt="A tree-lined Cape Town street with Table Mountain in the distance" fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" className="object-cover" />
          </div>
          <div>
            <SectionHeading id="prepare-title" eyebrow="Getting ready" title="Useful to have on hand" intro="You don't need all of this before speaking to us, but having it ready can help the sale move faster." />
            <ul className="mt-8 grid gap-4">
              {PREPARE.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-red-wash text-red-ink">
                    <CheckIcon size={15} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-stone">Requirements vary from property to property. Your agent and the conveyancing attorney will confirm exactly what is needed.</p>
          </div>
        </div>
      </section>

      <section className="px-3 pb-20 sm:px-5 lg:pb-28">
        <div className="on-dark rounded-[2rem] bg-ink py-16 text-white lg:py-20">
          <div className="container-site flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h2 className="display text-5xl sm:text-7xl">
                What is your home <span className="text-ere-red">worth?</span>
              </h2>
              <p className="mt-4 max-w-xl text-lg text-mist">Request a valuation online and an ERE agent will contact you to arrange a visit.</p>
            </div>
            <Link href="/valuation" className="btn btn-primary">
              Request a valuation <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
